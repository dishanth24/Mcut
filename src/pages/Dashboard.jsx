import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Link2, ArrowRight, Bell, Compass } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useLedger } from '@/hooks/useLedger';
import { computeBalances, expenseTotal } from '@/lib/ledger';
import { displayName, userCurrency } from '@/lib/profile';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import Amount from '@/components/common/Amount';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import TripCard from '@/components/trips/TripCard';
import TripDialog from '@/components/trips/TripDialog';
import JoinByLinkDialog from '@/components/trips/JoinByLinkDialog';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { Button } from '@/components/ui/button';
import { tripStatus } from '@/lib/trips';

export default function Dashboard() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const [tripOpen, setTripOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    base44.entities.ActivityEvent.list({ sort: '-created_date', limit: 6 })
      .then((page) => setEvents(page.items || []))
      .catch((err) => {
        console.error('Failed to load dashboard activity events:', err);
      });
  }, [trips.length]);

  const preferred = userCurrency(user);

  const summary = useMemo(() => {
    const rows = trips.map((trip) => {
      const tExpenses = expenses.filter((e) => e.trip_id === trip.id);
      const tSettlements = settlements.filter((s) => s.trip_id === trip.id);
      const tMembers = members.filter((m) => m.trip_id === trip.id);
      const balances = computeBalances(tMembers, tExpenses, tSettlements);
      const net = balances.find((b) => b.user_id === user?.id)?.net || 0;
      return {
        trip,
        total: expenseTotal(tExpenses),
        net,
        memberCount: tMembers.length || trip.members?.length || 1,
        status: tripStatus(trip),
      };
    });
    const primary = rows.filter((r) => (r.trip.currency || 'INR') === preferred);
    const owe = primary.filter((r) => r.net < 0).reduce((s, r) => s + -r.net, 0);
    const owed = primary.filter((r) => r.net > 0).reduce((s, r) => s + r.net, 0);
    return {
      rows,
      owe,
      owed,
      net: owed - owe,
      activeCount: rows.filter((r) => ['upcoming', 'ongoing'].includes(r.status)).length,
    };
  }, [trips, expenses, settlements, members, user?.id, preferred]);

  const pending = settlements.filter((s) => s.status === 'pending' && s.to_user_id === user?.id);
  const activeTrips = summary.rows.filter((r) => ['upcoming', 'ongoing'].includes(r.status)).slice(0, 3);

  return (
    <>
      <PageHeader
        title={`Hello, ${displayName(user).split(' ')[0]}`}
        subtitle="Here is where your trips stand today."
        actions={
          <>
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              <Link2 className="h-4 w-4" /> Join a trip
            </Button>
            <Button onClick={() => setTripOpen(true)}>
              <Plus className="h-4 w-4" /> New trip
            </Button>
          </>
        }
      />

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="You owe"
              value={<Amount value={summary.owe} currency={preferred} tone={summary.owe ? 'negative' : 'muted'} />}
              hint="Across your trips in your preferred currency"
            />
            <StatCard
              label="Owed to you"
              value={<Amount value={summary.owed} currency={preferred} tone={summary.owed ? 'positive' : 'muted'} />}
              hint="Money still to come back"
            />
            <StatCard
              label="Net balance"
              value={<Amount value={summary.net} currency={preferred} tone={summary.net > 0 ? 'positive' : summary.net < 0 ? 'negative' : 'muted'} signed />}
              hint={summary.net > 0 ? 'You are ahead' : summary.net < 0 ? 'You are behind' : 'All square'}
            />
            <StatCard
              label="Active trips"
              value={summary.activeCount}
              hint={`${trips.length} trip${trips.length === 1 ? '' : 's'} in total`}
            />
          </div>

          {pending.length > 0 ? (
            <Link
              to="/balances"
              className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
            >
              <Bell className="h-4 w-4 text-warning" />
              <span className="flex-1">
                {pending.length} payment{pending.length === 1 ? '' : 's'} waiting for your confirmation
              </span>
              <ArrowRight className="h-4 w-4 text-warning" />
            </Link>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl">Active trips</h2>
              <Link to="/trips" className="text-xs font-medium text-primary">
                All trips
              </Link>
            </div>
            {trips.length === 0 ? (
              <EmptyState
                Icon={Compass}
                title="No trips yet"
                description="Create your first trip and invite the people travelling with you."
                action={
                  <Button size="sm" onClick={() => setTripOpen(true)}>
                    <Plus className="h-4 w-4" /> Create a trip
                  </Button>
                }
              />
            ) : activeTrips.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No upcoming trips. Your completed trips are still in <Link to="/trips" className="text-primary">My Trips</Link>.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeTrips.map((row) => (
                  <TripCard
                    key={row.trip.id}
                    trip={row.trip}
                    totalMinor={row.total}
                    netMinor={row.net}
                    memberCount={row.memberCount}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Recent activity</h2>
              <Link to="/activity" className="text-xs font-medium text-primary">
                All activity
              </Link>
            </div>
            <div className="mt-2">
              <ActivityFeed events={events} emptyHint="Add an expense or invite a friend to get started." />
            </div>
          </section>
        </div>
      )}

      <TripDialog
        open={tripOpen}
        onOpenChange={setTripOpen}
        user={user}
        onSaved={() => {
          reload();
          setEvents((prev) => prev);
        }}
      />
      <JoinByLinkDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}