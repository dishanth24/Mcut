import { motion, useReducedMotion } from 'framer-motion';
import { Handshake } from 'lucide-react';
import Amount from '@/components/common/Amount';
import EmptyState from '@/components/common/EmptyState';
import MemberAvatar from '@/components/common/MemberAvatar';

export default function SettleUpList({ transfers, currency, onRecord }) {
  const shouldReduce = useReducedMotion();

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
        <motion.div
          key={`${transfer.from_id}-${transfer.to_id}`}
          whileHover={shouldReduce ? {} : { y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="card-surface inner-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 sm:flex-nowrap"
        >
          {/* From → To avatars */}
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <MemberAvatar name={transfer.from_name} size="sm" />
            <span className="text-sm font-medium truncate">{transfer.from_name}</span>
            <svg className="h-4 w-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <MemberAvatar name={transfer.to_name} size="sm" />
            <span className="text-sm font-medium truncate">{transfer.to_name}</span>
          </div>

          <span className="num text-brand-teal font-semibold text-lg shrink-0">
            <Amount value={transfer.amount_minor} currency={currency} />
          </span>

          <button
            type="button"
            onClick={() => onRecord(transfer)}
            className="shrink-0 rounded-2xl bg-brand-orange text-white h-10 px-4 font-medium hover:bg-[#C97254] transition-colors min-w-[80px]"
          >
            Settle
          </button>
        </motion.div>
      ))}
    </div>
  );
}
