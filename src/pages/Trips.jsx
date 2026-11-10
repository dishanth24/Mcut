import { useMemo, useState } from 'react';
import { Plus, Link2, Search, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { computeBalances, expenseTotal } from '@/lib/ledger';
import { tripStatus } from '@/lib/trips';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonTripCard } from '@/components/common/SkeletonLoader';
import TripCard from '@/components/trips/TripCard';
import TripDialog from '@/components/trips/TripDialog';
import JoinByLinkDialog from '@/components/trips/JoinByLinkDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, useReducedMotion } from 'framer-motion';

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All Trips' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Past' },
];

const SORTS = [
  { id: 'date-desc', label: 'Newest dates' },
  { id: 'date-asc', label: 'Earliest dates' },
  { id: 'spend-desc', label: 'Highest spend' },
  { id: 'name-asc', label: 'Trip name (A-Z)' },
];

export default function Trips() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [tripOpen, setTripOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const shouldReduce = useReducedMotion();

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
          membersList: tMembers,
          status: tripStatus(trip),
        };
      }),
    [trips, expenses, settlements, members, user?.id]
  );

  const filtered = useMemo(() => {
    let result = rows.filter((row) => {
      // Status filter
      if (filter === 'all') return true;
      if (filter === 'active') return ['upcoming', 'ongoing'].includes(row.status);
      return row.status === filter;
    });

    // Search query (name or destination)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.trip.name.toLowerCase().includes(q) ||
          (r.trip.destination && r.trip.destination.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (sort === 'spend-desc') return b.total - a.total;
      if (sort === 'name-asc') return a.trip.name.localeCompare(b.trip.name);
      if (sort === 'date-asc') {
        const da = a.trip.start_date || '9999';
        const db = b.trip.start_date || '9999';
        return da.localeCompare(db);
      }
      // default: date-desc
      const da = a.trip.start_date || '0000';
      const db = b.trip.start_date || '0000';
      return db.localeCompare(da);
    });

    return result;
  }, [rows, filter, search, sort]);

  const activeSortLabel = SORTS.find((s) => s.id === sort)?.label || 'Sort';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl text-foreground">My Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every shared trip, with its ledger kept honest and in order.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinOpen(true)}
            className="h-10 rounded-xl border-border/80 hover:bg-secondary px-3.5 gap-1.5 text-xs font-semibold"
          >
            <Link2 className="h-4 w-4 text-[#2DD4BF]" /> Join a trip
          </Button>
          <Button
            size="sm"
            onClick={() => setTripOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-[#D98264] to-[#C97254] text-white hover:opacity-95 border-0 shadow-md shadow-[#D98264]/20 px-4 gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" /> New trip
          </Button>
        </div>
      </div>

      {/* ── Search, Filters & Sort Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Animated Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {FILTERS.map((option) => {
            const isSelected = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected ? 'text-white' : 'text-muted-foreground hover:text-foreground bg-secondary/60'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId={shouldReduce ? undefined : 'tripsFilterPill'}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D98264] to-[#C97254] shadow-xs"
                  />
                )}
                <span className="relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input & Sort button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips or cities…"
              className="h-9 pl-9 pr-3 rounded-xl text-xs border-border/70 bg-card/60 focus-visible:ring-[#D98264]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-border/70 hover:bg-secondary px-2.5 text-xs gap-1.5 shrink-0"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">{activeSortLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              {SORTS.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={`text-xs ${sort === s.id ? 'font-semibold text-[#D98264]' : ''}`}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Trips Grid / Loading / Empty ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonTripCard />
          <SkeletonTripCard />
          <SkeletonTripCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration="suitcase"
          title={search ? 'No matching trips found' : trips.length === 0 ? 'No trips yet' : 'Nothing in this filter'}
          description={
            search
              ? `No trips found matching "${search}". Try another search term.`
              : trips.length === 0
              ? 'Create your first trip and invite the crew to start splitting expenses.'
              : 'Try selecting another view or add a new trip.'
          }
          action={
            <Button
              size="sm"
              onClick={() => (search ? setSearch('') : setTripOpen(true))}
              className="rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20"
            >
              {search ? 'Clear search' : <><Plus className="h-4 w-4 mr-1.5" /> Start a trip</>}
            </Button>
          }
        />
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((row) => (
            <TripCard
              key={row.trip.id}
              trip={row.trip}
              totalMinor={row.total}
              netMinor={row.net}
              memberCount={row.memberCount}
              membersList={row.membersList}
            />
          ))}
        </motion.div>
      )}

      {/* Dialogs */}
      <TripDialog open={tripOpen} onOpenChange={setTripOpen} user={user} onSaved={reload} />
      <JoinByLinkDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
