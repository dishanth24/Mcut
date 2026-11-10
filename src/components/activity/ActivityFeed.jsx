import { Check, Receipt, Pencil, Trash2, UserPlus, Banknote, CheckCircle2, MapPin, Compass, Wallet } from 'lucide-react';
import { relativeTime } from '@/lib/trips';
import { formatMoney } from '@/lib/money';
import EmptyState from '@/components/common/EmptyState';

const ICONS = {
  trip_created: Compass,
  trip_updated: Pencil,
  expense_added: Receipt,
  expense_updated: Pencil,
  expense_deleted: Trash2,
  member_joined: UserPlus,
  settlement_recorded: Banknote,
  settlement_confirmed: CheckCircle2,
  itinerary_added: MapPin,
  budget_updated: Wallet,
};

export default function ActivityFeed({ events = [], emptyHint = 'Trip activity will appear here.' }) {
  if (events.length === 0) {
    return <EmptyState Icon={Check} title="Nothing yet" description={emptyHint} />;
  }

  return (
    <ol className="space-y-1">
      {events.map((event) => {
        const Icon = ICONS[event.type] || Check;
        return (
          <li key={event.id} className="flex gap-3 rounded-xl px-1 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{event.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {relativeTime(event.created_date)}
                {event.amount_minor
                  ? ` · ${formatMoney(event.amount_minor, event.currency || 'INR')}`
                  : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}