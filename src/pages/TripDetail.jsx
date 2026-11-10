import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Compass,
  MapPin,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTripData } from '@/hooks/useTripData';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import Pill from '@/components/common/Pill';
import AvatarStack from '@/components/common/AvatarStack';
import OverviewTab from '@/components/trips/OverviewTab';
import ExpensesTab from '@/components/trips/ExpensesTab';
import BalancesTab from '@/components/trips/BalancesTab';
import MembersTab from '@/components/trips/MembersTab';
import ChatTab from '@/components/trips/ChatTab';
import ItineraryTab from '@/components/trips/ItineraryTab';
import BudgetTab from '@/components/trips/BudgetTab';
import ReportsTab from '@/components/trips/ReportsTab';
import ActivityFeed from '@/components/activity/ActivityFeed';
import TripDialog from '@/components/trips/TripDialog';
import TripHeroStickers from '@/components/trips/TripHeroStickers';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvitePanel from '@/components/trips/InvitePanel';
import { formatDateRange, TRIP_STATUS, tripStatus } from '@/lib/trips';
import { motion, useReducedMotion } from 'framer-motion';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'chat', label: 'Chat' },
  { id: 'budget', label: 'Budget' },
  { id: 'members', label: 'Members' },
  { id: 'activity', label: 'Activity' },
  { id: 'reports', label: 'Reports' },
];

const COVER_GRADIENTS = [
  'from-[#6366F1] via-[#8B5CF6] to-[#3B82F6]', // Rich Purple/Indigo vibe
  'from-[#D98264] via-[#F59E0B] to-[#b45309]',
  'from-[#2DD4BF] via-[#059669] to-[#047857]',
  'from-[#8B5CF6] via-[#6366F1] to-[#3B82F6]',
  'from-[#EC4899] via-[#D98264] to-[#F59E0B]',
  'from-[#06B6D4] via-[#3B82F6] to-[#6366F1]',
];

function gradientForTrip(name = '', dest = '') {
  const str = (dest || name || 'Trip').toLowerCase();
  const sum = str.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COVER_GRADIENTS[sum % COVER_GRADIENTS.length];
}

const STATUS_PILL_VARIANTS = {
  upcoming: 'primary',
  ongoing: 'teal',
  completed: 'secondary',
  archived: 'secondary',
};

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trip, members, expenses, settlements, loading, error, reload } = useTripData(tripId);
  const [events, setEvents] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addExpenseSignal, setAddExpenseSignal] = useState(0);
  const [tab, setTab] = useState('overview');
  const shouldReduce = useReducedMotion();

  const loadEvents = () => {
    base44.entities.ActivityEvent.filter({ trip_id: tripId }, { sort: '-created_date', limit: 60 })
      .then((page) => setEvents(page.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!tripId) return;
    loadEvents();
  }, [tripId]);

  if (loading) return <Loading />;

  if (error === 'notfound' || (!loading && !trip)) {
    return (
      <EmptyState
        Icon={Compass}
        title="Trip not available"
        description="This trip may have been removed, or your account is not part of it."
        action={
          <Button asChild size="sm">
            <Link to="/trips">Back to my trips</Link>
          </Button>
        }
      />
    );
  }

  const refreshAll = () => {
    reload();
    loadEvents();
  };

  const handleDeleteTrip = async () => {
    setDeleting(true);
    try {
      await base44.entities.Trip.delete(trip.id);
      navigate('/trips', { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  const status = tripStatus(trip);
  const isOwner = trip.created_by_id === user?.id;
  const gradient = gradientForTrip(trip.name, trip.destination);

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>All trips</span>
        </Link>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive text-xs gap-1.5 h-8 px-2.5 rounded-xl hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete trip</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-border/80">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-xl">Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This permanently removes <span className="font-semibold text-foreground">"{trip.name}"</span> and all its recorded expenses, settlements, itinerary items, and member balances. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Keep trip</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTrip}
                  disabled={deleting}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete trip'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* ── Rich Hero Header with Purple/Gradient Cover and Stickers ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
        {trip.cover_image ? (
          <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <TripHeroStickers destination={trip.destination} status={status} />
          </div>
        ) : (
          <div className={`relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-br ${gradient} p-6 flex flex-col justify-between overflow-hidden shadow-inner`}>
            {/* Ambient blur lighting */}
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/4 h-36 w-36 rounded-full bg-[#2DD4BF]/20 blur-2xl" />

            {/* Travel Stickers & Flight Path graphics overlay */}
            <TripHeroStickers destination={trip.destination} status={status} />
          </div>
        )}

        {/* Hero content positioned over bottom of header */}
        <div className="relative p-5 sm:p-7 bg-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant={STATUS_PILL_VARIANTS[status] || 'secondary'} size="sm" dot>
                  {TRIP_STATUS[status]}
                </Pill>
                {trip.destination && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-[#2DD4BF]" />
                    <span>{trip.destination}</span>
                  </span>
                )}
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                {trip.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {formatDateRange(trip.start_date, trip.end_date)}
                </span>
                <span>·</span>
                <span className="font-medium">Currency: {trip.currency || 'INR'}</span>
                {trip.budget_minor > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-[#2DD4BF]">
                      Budget: {(trip.budget_minor / 100).toLocaleString()} {trip.currency || 'INR'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Members & Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <AvatarStack members={members} max={4} size="md" />

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInviteOpen(true)}
                  className="rounded-xl border-border/80 hover:bg-secondary px-3.5 gap-1.5 text-xs font-semibold"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#2DD4BF]" />
                  <span>Invite</span>
                </Button>

                {isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditOpen(true)}
                    className="h-9 w-9 rounded-xl p-0 hover:bg-secondary"
                    aria-label="Edit trip details"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Animated Tab Bar ── */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="sticky top-0 z-20 -mx-4 overflow-x-auto px-4 py-2 bg-background/95 backdrop-blur-md border-b border-border/70 no-scrollbar sm:mx-0 sm:px-0 sm:rounded-2xl sm:border sm:bg-secondary/40">
          <div className="flex items-center gap-1 min-w-max p-1">
            {TABS.map((item) => {
              const isSelected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative min-h-[40px] shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId={shouldReduce ? undefined : 'tripDetailActiveTab'}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-card shadow-xs border border-border/80"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Contents ── */}
        <div className="pt-2">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              trip={trip}
              members={members}
              expenses={expenses}
              settlements={settlements}
              events={events}
              user={user}
              onAddExpense={() => {
                setTab('expenses');
                setAddExpenseSignal((n) => n + 1);
              }}
              onEditTrip={() => setEditOpen(true)}
            />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <ExpensesTab
              trip={trip}
              members={members}
              expenses={expenses}
              user={user}
              reload={refreshAll}
              autoOpenSignal={addExpenseSignal}
              onAutoOpened={() => setAddExpenseSignal(0)}
            />
          </TabsContent>

          <TabsContent value="balances" className="mt-0">
            <BalancesTab
              trip={trip}
              members={members}
              expenses={expenses}
              settlements={settlements}
              user={user}
              reload={refreshAll}
            />
          </TabsContent>

          <TabsContent value="itinerary" className="mt-0">
            <ItineraryTab trip={trip} user={user} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatTab trip={trip} user={user} />
          </TabsContent>

          <TabsContent value="budget" className="mt-0">
            <BudgetTab trip={trip} expenses={expenses} user={user} reload={refreshAll} />
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <MembersTab trip={trip} members={members} user={user} onReload={refreshAll} />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <div className="card-surface p-5 sm:p-6">
              <ActivityFeed events={events} emptyHint="Nothing has happened on this trip yet." />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsTab trip={trip} members={members} expenses={expenses} settlements={settlements} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit Trip Dialog */}
      <TripDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        trip={trip}
        user={user}
        onSaved={refreshAll}
        onDeleted={() => navigate('/trips', { replace: true })}
      />

      {/* Quick Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-border/80">
          <InvitePanel trip={trip} user={user} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
