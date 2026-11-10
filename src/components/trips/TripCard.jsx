import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import Amount from '@/components/common/Amount';
import { formatDateRange, TRIP_STATUS, tripStatus } from '@/lib/trips';

const STATUS_STYLES = {
  upcoming: 'bg-primary/10 text-primary',
  ongoing: 'bg-success/15 text-success',
  completed: 'bg-secondary text-muted-foreground',
  archived: 'bg-secondary text-muted-foreground',
};

export default function TripCard({ trip, totalMinor, netMinor, memberCount }) {
  const status = tripStatus(trip);
  const currency = trip.currency || 'INR';

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group card-surface flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-24px_rgba(40,39,36,0.5)]"
    >
      {trip.cover_image ? (
        <div className="h-28 w-full overflow-hidden bg-secondary">
          <Image
            src={trip.cover_image}
            alt={trip.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="h-1.5 w-full bg-primary/70" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-snug">{trip.name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {trip.destination || 'Destination not set'}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${STATUS_STYLES[status]}`}>
            {TRIP_STATUS[status]}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
            {memberCount ?? trip.members?.length ?? 1}
          </span>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Trip total</span>
            <Amount value={totalMinor || 0} currency={currency} className="font-medium" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Your balance</span>
            <Amount
              value={netMinor || 0}
              currency={currency}
              tone={netMinor > 0 ? 'positive' : netMinor < 0 ? 'negative' : 'muted'}
              signed
              className="font-medium"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}