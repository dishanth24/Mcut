import { useState } from 'react';
import { Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BalanceSummary from '@/components/balances/BalanceSummary';
import SettleUpList from '@/components/balances/SettleUpList';
import SettlementDialog from '@/components/balances/SettlementDialog';
import SettlementList from '@/components/balances/SettlementList';
import Amount from '@/components/common/Amount';
import MemberAvatar from '@/components/common/MemberAvatar';
import { computeBalances, simplifyDebts } from '@/lib/ledger';

export default function BalancesTab({ trip, members, expenses, settlements, user, reload }) {
  const currency = trip.currency || 'INR';
  const balances = computeBalances(members, expenses, settlements);
  const mine = balances.find((b) => b.user_id === user?.id)?.net || 0;
  const transfers = simplifyDebts(balances);
  const [preset, setPreset] = useState(null);
  const [open, setOpen] = useState(false);

  const openFor = (transfer) => {
    setPreset(transfer);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <BalanceSummary
        youOwe={mine < 0 ? -mine : 0}
        owedToYou={mine > 0 ? mine : 0}
        net={mine}
        currency={currency}
      />

      <div className="card-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base">Smart settle-up</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The fewest practical transfers that clear every balance. Nothing is recorded until someone confirms.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setPreset(null); setOpen(true); }}>
            <Handshake className="h-4 w-4" /> Record a payment
          </Button>
        </div>
        <div className="mt-4">
          <SettleUpList transfers={transfers} currency={currency} onRecord={openFor} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h3 className="text-base">Member balances</h3>
          <div className="mt-3 space-y-2">
            {balances.map((row) => (
              <div key={row.user_id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <MemberAvatar name={row.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {row.name}
                  {row.user_id === user?.id ? ' (you)' : ''}
                </span>
                <Amount
                  value={row.net}
                  currency={currency}
                  tone={row.net > 0 ? 'positive' : row.net < 0 ? 'negative' : 'muted'}
                  signed
                  className="text-sm font-medium"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Net = amount paid − own share + settlements sent − settlements received. All member balances on a trip
            add up to zero.
          </p>
        </section>

        <section className="card-surface p-5">
          <h3 className="text-base">Settlement history</h3>
          <div className="mt-3">
            <SettlementList trip={trip} settlements={settlements} user={user} onChanged={reload} />
          </div>
        </section>
      </div>

      <SettlementDialog
        open={open}
        onOpenChange={setOpen}
        trip={trip}
        members={members}
        user={user}
        preset={preset}
        onSaved={reload}
      />
    </div>
  );
}