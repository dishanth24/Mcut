import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Scale } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { computeBalances } from '@/lib/ledger';
import { userCurrency } from '@/lib/profile';
import { formatDate } from '@/lib/trips';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import BalanceSummary from '@/components/balances/BalanceSummary';
import Amount from '@/components/common/Amount';
import MemberAvatar from '@/components/common/MemberAvatar';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

// Confetti particles data
const CONFETTI_ITEMS = [
  { dx: 60, dy: -80, color: '#D98264' },
  { dx: -70, dy: -60, color: '#2DD4BF' },
  { dx: 90, dy: 30, color: '#8B5CF6' },
  { dx: -90, dy: 20, color: '#F59E0B' },
  { dx: 40, dy: 90, color: '#EC4899' },
  { dx: -50, dy: 80, color: '#3B82F6' },
  { dx: 110, dy: -30, color: '#10B981' },
  { dx: -110, dy: -20, color: '#F97316' },
  { dx: 20, dy: -110, color: '#D98264' },
  { dx: -20, dy: 100, color: '#2DD4BF' },
  { dx: 70, dy: 60, color: '#8B5CF6' },
  { dx: -60, dy: -90, color: '#F59E0B' },
];

function HeroCard({ net, currency }) {
  const shouldReduce = useReducedMotion();

  if (net === 0) {
    return (
      <div className="card-surface rounded-3xl p-6 relative overflow-hidden text-center">
        <div className="glow-teal absolute inset-0 opacity-30 pointer-events-none" />
        <AnimatePresence>
          <div className="relative z-10">
            <div className="text-5xl mb-2">🎉</div>
            <p className="font-heading text-3xl text-brand-teal">All Square!</p>
            <p className="mt-1 text-sm text-muted-foreground">No outstanding balances in your preferred currency</p>
          </div>
        </AnimatePresence>

        {/* Confetti */}
        {!shouldReduce && CONFETTI_ITEMS.map((p, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: [0, p.dx],
              y: [0, p.dy],
              opacity: [1, 0],
              scale: [1, 0.5],
            }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.05 }}
          />
        ))}
      </div>
    );
  }

  if (net > 0) {
    return (
      <div className="card-surface rounded-3xl p-6 relative overflow-hidden">
        <div className="glow-teal absolute -top-10 -right-10 h-32 w-32 opacity-40 pointer-events-none" />
        <p className="text-sm text-muted-foreground mb-1">You are owed</p>
        <p className="font-heading text-4xl text-brand-teal num">
          <Amount value={net} currency={currency} />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">across your {currency} trips</p>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-3xl p-6 relative overflow-hidden">
      <div className="glow-orange absolute -top-10 -right-10 h-32 w-32 opacity-40 pointer-events-none" />
      <p className="text-sm text-muted-foreground mb-1">You owe</p>
      <p className="font-heading text-4xl text-destructive num">
        <Amount value={-net} currency={currency} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">across your {currency} trips</p>
    </div>
  );
}

export default function BalancesPage() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const preferred = userCurrency(user);
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
          currency: trip.currency || 'INR',
          net: balances.find((b) => b.user_id === user?.id)?.net || 0,
        };
      }),
    [trips, expenses, settlements, members, user?.id]
  );

  const primary = rows.filter((r) => r.currency === preferred);
  const owe = primary.filter((r) => r.net < 0).reduce((sum, r) => sum + -r.net, 0);
  const owed = primary.filter((r) => r.net > 0).reduce((sum, r) => sum + r.net, 0);
  const pendingIn = settlements.filter((s) => s.status === 'pending' && s.to_user_id === user?.id);
  const pendingOut = settlements.filter((s) => s.status === 'pending' && s.from_user_id === user?.id);
  const others = rows.filter((r) => r.currency !== preferred && r.net !== 0);

  const setStatus = async (settlement, status) => {
    await base44.entities.Settlement.update(settlement.id, { status });
    const trip = trips.find((t) => t.id === settlement.trip_id);
    if (status === 'confirmed' && trip) {
      await logActivity({
        trip,
        type: 'settlement_confirmed',
        message: `${displayName(user)} confirmed a payment of ${settlement.from_name} to ${settlement.to_name}`,
        actor: { id: user.id, name: displayName(user) },
        amountMinor: settlement.amount_minor,
        currency: settlement.currency,
        refId: settlement.id,
      });
    }
    reload();
  };

  const net = owed - owe;

  return (
    <>
      <PageHeader
        title="Balances"
        subtitle="What you owe, what you are owed, and the payments still waiting to be confirmed."
      />

      {loading ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState
          Icon={Scale}
          title="Nothing to balance yet"
          description="Balances appear once you have a trip with expenses in it."
          action={
            <Button asChild size="sm">
              <Link to="/trips">Go to my trips</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Hero card */}
          <HeroCard net={net} currency={preferred} />

          <BalanceSummary youOwe={owe} owedToYou={owed} net={net} currency={preferred} />

          {/* Pending In: waiting for your confirmation */}
          {pendingIn.length > 0 ? (
            <section className="card-surface p-5 rounded-2xl">
              <h2 className="text-lg font-medium">Waiting for your confirmation</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Someone recorded a payment to you. Confirm it once the money has arrived.
              </p>
              <div className="mt-3 space-y-2">
                {pendingIn.map((s) => (
                  <div key={s.id} className="card-surface inner-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
                    <MemberAvatar name={s.from_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{s.from_name}</span> says they paid you
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center rounded-full bg-brand-teal/10 text-brand-teal px-2 py-0.5 text-[0.65rem] font-medium">
                          {trips.find((t) => t.id === s.trip_id)?.name || 'Trip'}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(s.settled_on)}</span>
                      </div>
                    </div>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} className="font-semibold text-brand-teal num" />
                    <Button
                      size="sm"
                      className="bg-brand-teal text-black rounded-xl h-9 px-4 hover:bg-[#22c0a8]"
                      onClick={() => setStatus(s, 'confirmed')}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 rounded-xl" onClick={() => setStatus(s, 'rejected')}>
                      Dispute
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Pending Out: recorded, awaiting confirmation */}
          {pendingOut.length > 0 ? (
            <section className="card-surface p-5 rounded-2xl">
              <h2 className="text-lg font-medium">Recorded, awaiting confirmation</h2>
              <div className="mt-3 space-y-2">
                {pendingOut.map((s) => (
                  <div key={s.id} className="card-surface inner-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
                    <MemberAvatar name={s.to_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        You paid <span className="font-medium">{s.to_name}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center rounded-full bg-brand-teal/10 text-brand-teal px-2 py-0.5 text-[0.65rem] font-medium">
                          {trips.find((t) => t.id === s.trip_id)?.name || 'Trip'}
                        </span>
                        <span className="text-xs text-muted-foreground">waiting on them to confirm</span>
                      </div>
                    </div>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} className="font-semibold num" />
                    <Button size="sm" variant="ghost" className="h-9 rounded-xl" onClick={() => setStatus(s, 'cancelled')}>
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Trip balance rows */}
          <section className="card-surface p-5 rounded-2xl">
            <h2 className="text-lg font-medium">Your balance by trip</h2>
            <div className="mt-3 space-y-2">
              {rows.map((row) => (
                <Link key={row.trip.id} to={`/trips/${row.trip.id}`}>
                  <motion.div
                    whileHover={shouldReduce ? {} : { x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.trip.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.trip.destination || 'No destination'}</p>
                    </div>
                    <Amount
                      value={row.net}
                      currency={row.currency}
                      tone={row.net > 0 ? 'positive' : row.net < 0 ? 'negative' : 'muted'}
                      signed
                      className="text-sm font-medium"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </motion.div>
                </Link>
              ))}
            </div>
            {others.length > 0 ? (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Trips in other currencies are shown individually so amounts are never mixed.
              </p>
            ) : null}
          </section>

          {/* All settlement records */}
          <section className="card-surface p-5 rounded-2xl">
            <h2 className="text-lg font-medium">All settlement records</h2>
            <div className="mt-3 space-y-2">
              {settlements.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No settlements recorded yet.</p>
              ) : (
                settlements.map((s) => (
                  <div key={s.id} className="card-surface inner-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{s.from_name}</span>
                      <span className="text-muted-foreground"> paid </span>
                      <span className="font-medium">{s.to_name}</span>
                    </span>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} className="num font-semibold" />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize ${
                        s.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : s.status === 'confirmed'
                          ? 'bg-brand-teal/20 text-brand-teal'
                          : s.status === 'rejected'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
