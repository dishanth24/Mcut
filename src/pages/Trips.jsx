import { useMemo, useState } from 'react';
import { Plus, Link2, Compass } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { computeBalances, expenseTotal } from '@/lib/ledger';
import { tripStatus } from '@/lib/trips';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import TripCard from '@/components/trips/TripCard';
import TripDialog from '@/components/trips/TripDialog';
import JoinByLinkDialog from '@/components/trips/JoinByLinkDialog';
import { Button } from '@/components/ui/button';

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
];

export default function Trips() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const [filter, setFilter] = useState('active');
  const [tripOpen, setTripOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const rows = useMemo(
    () =>
      trips.map((trip) => {
        const tExpenses = expenses.filter((e) => e.trip_id === trip.id);
        const tSettlements = settlements.filter((s) => s.trip_id === trip.id);
        const tMembers = members.filter((m) => m.trip_id === trip.id);
        const balances = computeBalances(tMembers, tExpenses, tSettlements);
        return {
          trip,
          total: expenseTotal(tExpenses),
          net: balances.find((b) => b.user_id === user?.id)?.net || 0,
          memberCount: tMembers.length || trip.members?.length || 1,
          status: tripStatus(trip),
        };
      }),
    [trips, expenses, settlements, members, user?.id]
  );

  const visible = rows.filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['upcoming', 'ongoing'].includes(row.status);
    return row.status === filter;
  });

  return (
    <>
      <PageHeader
        title="My Trips"
        subtitle="Every shared trip, with its ledger kept in order."
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

      <div className="mb-5 flex gap-1 overflow-x-auto no-scrollbar">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === option.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : visible.length === 0 ? (
        <EmptyState
          Icon={Compass}
          title={trips.length === 0 ? 'No trips yet' : 'Nothing in this view'}
          description={
            trips.length === 0
              ? 'Create a trip to start tracking shared costs with the people you travel with.'
              : 'Try another filter, or create a new trip.'
          }
          action={
            <Button size="sm" onClick={() => setTripOpen(true)}>
              <Plus className="h-4 w-4" /> Create a trip
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((row) => (
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

      <TripDialog open={tripOpen} onOpenChange={setTripOpen} user={user} onSaved={reload} />
      <JoinByLinkDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}