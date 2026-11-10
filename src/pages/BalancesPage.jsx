import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';

export default function BalancesPage() {
  const { user } = useAuth();
  const { trips, expenses, settlements, members, loading, reload } = useLedger();
  const preferred = userCurrency(user);

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
          <BalanceSummary youOwe={owe} owedToYou={owed} net={owed - owe} currency={preferred} />

          {pendingIn.length > 0 ? (
            <section className="card-surface p-5">
              <h2 className="text-lg">Waiting for your confirmation</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Someone recorded a payment to you. Confirm it once the money has arrived.
              </p>
              <div className="mt-3 space-y-2">
                {pendingIn.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{s.from_name}</span> says they paid you
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trips.find((t) => t.id === s.trip_id)?.name || 'Trip'} · {formatDate(s.settled_on)}
                      </p>
                    </div>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} className="font-semibold" />
                    <Button size="sm" onClick={() => setStatus(s, 'confirmed')}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s, 'rejected')}>
                      Dispute
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {pendingOut.length > 0 ? (
            <section className="card-surface p-5">
              <h2 className="text-lg">Recorded, awaiting confirmation</h2>
              <div className="mt-3 space-y-2">
                {pendingOut.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        You paid <span className="font-medium">{s.to_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trips.find((t) => t.id === s.trip_id)?.name || 'Trip'} · waiting on them to confirm
                      </p>
                    </div>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} className="font-semibold" />
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s, 'cancelled')}>
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card-surface p-5">
            <h2 className="text-lg">Your balance by trip</h2>
            <div className="mt-3 divide-y divide-border">
              {rows.map((row) => (
                <Link
                  key={row.trip.id}
                  to={`/trips/${row.trip.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
            {others.length > 0 ? (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Trips in other currencies are shown individually so amounts are never mixed.
              </p>
            ) : null}
          </section>

          <section className="card-surface p-5">
            <h2 className="text-lg">All settlement records</h2>
            <div className="mt-3 divide-y divide-border">
              {settlements.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No settlements recorded yet.</p>
              ) : (
                settlements.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      {s.from_name} <span className="text-muted-foreground">paid</span> {s.to_name}
                      <span className="ml-1 text-xs capitalize text-muted-foreground">· {s.status}</span>
                    </span>
                    <Amount value={s.amount_minor} currency={s.currency || preferred} />
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