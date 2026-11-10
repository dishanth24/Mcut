import { ArrowRight, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Amount from '@/components/common/Amount';
import EmptyState from '@/components/common/EmptyState';

export default function SettleUpList({ transfers, currency, onRecord }) {
  if (transfers.length === 0) {
    return (
      <EmptyState
        Icon={Handshake}
        title="Everyone is settled"
        description="No outstanding balances on this trip right now."
      />
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map((transfer) => (
        <div
          key={`${transfer.from_id}-${transfer.to_id}`}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-sm sm:flex-nowrap"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{transfer.from_name}</span>
            <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{transfer.to_name}</span>
          </span>
          <Amount value={transfer.amount_minor} currency={currency} className="font-semibold" />
          <Button size="sm" variant="outline" onClick={() => onRecord(transfer)}>
            Record
          </Button>
        </div>
      ))}
    </div>
  );
}