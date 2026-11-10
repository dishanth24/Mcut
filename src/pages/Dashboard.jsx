import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Link2, ArrowRight, Bell, Receipt, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useLedger } from '@/hooks/useLedger';
import { computeBalances, expenseTotal } from '@/lib/ledger';
import { displayName, userCurrency } from '@/lib/profile';
import Amount from '@/components/common/Amount';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonStatRow, SkeletonTripCard, SkeletonActivityRow } from '@/components/common/SkeletonLoader';
import TripCard from '@/components/trips/TripCard';
import TripDialog from '@/components/trips/TripDialog';
import JoinByLinkDialog from '@/components/trips/JoinByLinkDialog';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { Button } from '@/components/ui/button';
import { tripStatus } from '@/lib/trips';
import { motion, useReducedMotion } from 'framer-motion';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const [tripOpen, setTripOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const shouldReduce = useReducedMotion();
  const greeting = useMemo(() => getGreeting(), []);

  const loadEvents = useCallback(() => {
    base44.entities.ActivityEvent.list({ sort: '-created_date', limit: 6 })
      .then((page) => setEvents(page.items || []))
      .catch((err) => {
        console.error('Failed to load dashboard activity events:', err);
      });
  }, []);

  useEffect(() => {
    loadEvents();
  }, [trips.length, loadEvents]);

  // Listen to global trip updates (e.g. from AppShell quick action)
  useEffect(() => {
    const onTripUpdate = () => {
      reload();
      loadEvents();
    };
    window.addEventListener('mcut-trips-updated', onTripUpdate);
    return () => window.removeEventListener('mcut-trips-updated', onTripUpdate);
  }, [reload, loadEvents]);

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
        membersList: tMembers,
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
  const firstName = displayName(user).split(' ')[0];

  // Most active trip for Quick Add Expense action
  const latestTrip = activeTrips[0]?.trip || trips[0];
  const latestTripMembers = latestTrip
    ? members.filter((m) => m.trip_id === latestTrip.id)
    : [];

  const handleQuickAddExpense = () => {
    if (trips.length === 0) {
      setTripOpen(true);
    } else {
      setExpenseOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header with Aurora Glow & Time-aware Greeting ── */}
      <div className="relative pt-1 sm:pt-2">
        {!shouldReduce && (
          <div aria-hidden="true" className="pointer-events-none absolute -inset-x-8 -top-8 h-44 overflow-hidden -z-10">
            <div
              className="absolute -top-12 left-1/4 w-72 h-72 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #D98264 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <div
              className="absolute -top-8 right-1/4 w-64 h-64 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)', filter: 'blur(50px)' }}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <motion.div
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-xs mb-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.span
                animate={shouldReduce ? {} : { rotate: [0, 14, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                className="inline-block"
              >
                {greeting.emoji}
              </motion.span>
              <span>{greeting.text}</span>
            </motion.div>

            <motion.h1
              className="font-heading text-3xl tracking-tight sm:text-4xl text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Hello, {firstName}
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Here is where your travel ledgers stand today.
            </motion.p>
          </div>

          {/* Quick Actions Row */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJoinOpen(true)}
              className="h-10 rounded-xl border-border/80 hover:bg-secondary px-3.5 gap-1.5 text-xs font-semibold"
            >
              <Link2 className="h-4 w-4 text-[#2DD4BF]" /> Join a trip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickAddExpense}
              className="h-10 rounded-xl border-border/80 hover:bg-secondary px-3.5 gap-1.5 text-xs font-semibold"
            >
              <Receipt className="h-4 w-4 text-[#D98264]" /> Add expense
            </Button>
            <Button
              size="sm"
              onClick={() => setTripOpen(true)}
              className="h-10 rounded-xl bg-gradient-to-r from-[#D98264] to-[#C97254] text-white hover:opacity-95 border-0 shadow-md shadow-[#D98264]/20 px-4 gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> New trip
            </Button>
          </motion.div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-7">
          <SkeletonStatRow />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonTripCard />
            <SkeletonTripCard />
            <SkeletonTripCard />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── 4 Stat Cards with Count-up & Accent Top Borders ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="You owe"
              value={<Amount value={summary.owe} currency={preferred} tone={summary.owe ? 'negative' : 'muted'} />}
              hint="Across all your trips in preferred currency"
              tone={summary.owe ? 'negative' : 'muted'}
              accent="negative"
              delay={0}
            />
            <StatCard
              label="Owed to you"
              value={<Amount value={summary.owed} currency={preferred} tone={summary.owed ? 'positive' : 'muted'} />}
              hint="Reimbursements waiting to be collected"
              tone={summary.owed ? 'positive' : 'muted'}
              accent="positive"
              delay={0.06}
            />
            <StatCard
              label="Net balance"
              value={<Amount value={summary.net} currency={preferred} tone={summary.net > 0 ? 'positive' : summary.net < 0 ? 'negative' : 'muted'} signed />}
              hint={summary.net > 0 ? 'You are ahead' : summary.net < 0 ? 'You are behind' : 'All square'}
              tone={summary.net > 0 ? 'positive' : summary.net < 0 ? 'negative' : 'default'}
              accent="orange"
              delay={0.12}
            />
            <StatCard
              label="Active trips"
              value={summary.activeCount}
              hint={`${trips.length} trip${trips.length === 1 ? '' : 's'} in total`}
              tone="default"
              accent="neutral"
              delay={0.18}
            />
          </div>

          {/* Pending settlements alert banner */}
          {pending.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Link
                to="/balances"
                className="flex items-center gap-3.5 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3.5 text-sm text-foreground hover:bg-warning/15 transition-all shadow-xs"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <Bell className="h-4 w-4" />
                </span>
                <span className="flex-1 font-medium">
                  {pending.length} payment{pending.length === 1 ? '' : 's'} waiting for your confirmation
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                  Review <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ) : null}

          {/* ── Active Trips Section ── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl sm:text-2xl tracking-tight">Active trips</h2>
                {activeTrips.length > 0 && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {activeTrips.length}
                  </span>
                )}
              </div>
              <Link to="/trips" className="text-xs font-semibold text-[#D98264] hover:underline flex items-center gap-1">
                All trips <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {trips.length === 0 ? (
              <EmptyState
                title="No trips yet"
                description="Start a new travel ledger, invite your friends, and log expenses seamlessly."
                illustration="suitcase"
                action={
                  <Button
                    size="sm"
                    onClick={() => setTripOpen(true)}
                    className="rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Start your first trip
                  </Button>
                }
              />
            ) : activeTrips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-5 py-8 text-center backdrop-blur-xs">
                <p className="text-sm text-muted-foreground">
                  No upcoming or ongoing trips right now. Your completed trips are in{' '}
                  <Link to="/trips" className="font-semibold text-[#D98264] hover:underline">
                    My Trips
                  </Link>.
                </p>
              </div>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {activeTrips.map((row) => (
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
          </section>

          {/* ── Recent Activity Section ── */}
          <section className="card-surface p-5 sm:p-6 border-border/70">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl sm:text-2xl tracking-tight">Recent activity</h2>
                <Sparkles className="h-4 w-4 text-[#2DD4BF]" />
              </div>
              <Link to="/activity" className="text-xs font-semibold text-[#D98264] hover:underline flex items-center gap-1">
                Full history <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-3">
              {events.length === 0 && loading ? (
                <div className="space-y-3">
                  <SkeletonActivityRow />
                  <SkeletonActivityRow />
                  <SkeletonActivityRow />
                </div>
              ) : (
                <ActivityFeed
                  events={events}
                  emptyHint="Expenses, settlements and member invites will appear here as they happen."
                />
              )}
            </div>
          </section>
        </div>
      )}

      {/* Dialogs */}
      <TripDialog
        open={tripOpen}
        onOpenChange={setTripOpen}
        user={user}
        onSaved={() => {
          reload();
          loadEvents();
        }}
      />
      <JoinByLinkDialog open={joinOpen} onOpenChange={setJoinOpen} />

      {latestTrip && (
        <ExpenseDialog
          open={expenseOpen}
          onOpenChange={setExpenseOpen}
          trip={latestTrip}
          members={latestTripMembers}
          user={user}
          onSaved={() => {
            reload();
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
