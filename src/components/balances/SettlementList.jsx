import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Amount from '@/components/common/Amount';
import EmptyState from '@/components/common/EmptyState';
import MemberAvatar from '@/components/common/MemberAvatar';
import { Banknote } from 'lucide-react';
import { formatDate } from '@/lib/trips';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

const STATUS_STYLE = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-brand-teal/20 text-brand-teal',
  rejected: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-secondary text-muted-foreground',
};

export default function SettlementList({ trip, settlements, user, onChanged }) {
  const [busyId, setBusyId] = useState('');

  const setStatus = async (settlement, status) => {
    setBusyId(settlement.id);
    try {
      await base44.entities.Settlement.update(settlement.id, { status });
      if (status === 'confirmed') {
        await logActivity({
          trip,
          type: 'settlement_confirmed',
          message: `${displayName(user)} confirmed a payment of ${settlement.from_name} to ${settlement.to_name}`,
          actor: { id: user?.id, name: displayName(user) },
          amountMinor: settlement.amount_minor,
          currency: settlement.currency,
          refId: settlement.id,
        });
      }
      onChanged?.();
    } finally {
      setBusyId('');
    }
  };

  if (settlements.length === 0) {
    return (
      <EmptyState
        Icon={Banknote}
        title="No settlements yet"
        description="Record a payment when someone pays someone else back."
      />
    );
  }

  return (
    <div className="space-y-2">
      {settlements.map((s) => {
        const isRecipient = s.to_user_id === user?.id;
        const isPayer = s.from_user_id === user?.id;
        return (
          <div key={s.id} className="card-surface inner-border rounded-2xl px-4 py-3">
            {/* Top row: avatars + amount + status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MemberAvatar name={s.from_name} size="sm" />
                <span className="text-sm font-medium">{s.from_name}</span>
                <span className="text-xs text-muted-foreground">paid</span>
                <MemberAvatar name={s.to_name} size="sm" />
                <span className="text-sm font-medium">{s.to_name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Amount value={s.amount_minor} currency={s.currency || trip?.currency} className="num font-semibold" />
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize ${STATUS_STYLE[s.status] || STATUS_STYLE.cancelled}`}>
                  {s.status}
                </span>
              </div>
            </div>

            {/* Date + note */}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(s.settled_on)}
              {s.note ? ` · ${s.note}` : ''}
              {s.status === 'pending' && isRecipient ? ' · waiting for your confirmation' : ''}
            </p>

            {/* Action buttons */}
            {s.status === 'pending' && (isRecipient || isPayer) ? (
              <div className="mt-2 flex gap-2">
                {isRecipient ? (
                  <>
                    <Button
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => setStatus(s, 'confirmed')}
                      disabled={busyId === s.id}
                    >
                      Confirm received
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 rounded-xl"
                      onClick={() => setStatus(s, 'rejected')}
                      disabled={busyId === s.id}
                    >
                      Dispute
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-xl"
                    onClick={() => setStatus(s, 'cancelled')}
                    disabled={busyId === s.id}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
