import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTripData } from '@/hooks/useTripData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
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
import { TRIP_STATUS, tripStatus } from '@/lib/trips';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'members', label: 'Members' },
  { id: 'activity', label: 'Activity' },
  { id: 'chat', label: 'Chat' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'budget', label: 'Budget' },
  { id: 'reports', label: 'Reports' },
];

export default function TripDetail() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { trip, members, expenses, settlements, loading, error, reload } = useTripData(tripId);
  const [events, setEvents] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addExpenseSignal, setAddExpenseSignal] = useState(0);
  const [tab, setTab] = useState('overview');

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

  return (
    <>
      <Link to="/trips" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All trips
      </Link>

      <PageHeader
        title={trip.name}
        subtitle={`${TRIP_STATUS[tripStatus(trip)]} · ${trip.destination || 'Destination not set'}`}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
            {TABS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-card"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
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

        <TabsContent value="expenses">
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

        <TabsContent value="balances">
          <BalancesTab
            trip={trip}
            members={members}
            expenses={expenses}
            settlements={settlements}
            user={user}
            reload={refreshAll}
          />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab trip={trip} members={members} user={user} onReload={refreshAll} />
        </TabsContent>

        <TabsContent value="activity">
          <div className="card-surface p-5">
            <ActivityFeed events={events} emptyHint="Nothing has happened on this trip yet." />
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <ChatTab trip={trip} user={user} />
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryTab trip={trip} user={user} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab trip={trip} expenses={expenses} user={user} reload={refreshAll} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab trip={trip} members={members} expenses={expenses} settlements={settlements} />
        </TabsContent>
      </Tabs>

      <TripDialog open={editOpen} onOpenChange={setEditOpen} trip={trip} user={user} onSaved={refreshAll} />
    </>
  );
}