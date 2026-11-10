import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { Image } from '@/components/ui/image';
import Amount from '@/components/common/Amount';
import Pill from '@/components/common/Pill';
import AvatarStack from '@/components/common/AvatarStack';
import { formatDateRange, TRIP_STATUS, tripStatus } from '@/lib/trips';
import { formatMoney } from '@/lib/money';
import { motion, useReducedMotion } from 'framer-motion';

const COVER_GRADIENTS = [
  'from-[#D98264] via-[#F59E0B] to-[#b45309]', // Sunset Goa / beach
  'from-[#2DD4BF] via-[#059669] to-[#047857]', // Tropical nature
  'from-[#8B5CF6] via-[#6366F1] to-[#3B82F6]', // European city / mountains
  'from-[#EC4899] via-[#D98264] to-[#F59E0B]', // Weekend getaway
  'from-[#06B6D4] via-[#3B82F6] to-[#6366F1]', // Island cruise
];

function gradientForTrip(name = '', dest = '') {
  const str = (dest || name || 'Trip').toLowerCase();
  const sum = str.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COVER_GRADIENTS[sum % COVER_GRADIENTS.length];
}

const STATUS_PILL_VARIANTS = {
  upcoming: 'primary',
  ongoing: 'teal',
  completed: 'secondary',
  archived: 'secondary',
};

export default function TripCard({
  trip,
  totalMinor = 0,
  netMinor = 0,
  memberCount,
  membersList = [],
}) {
  const shouldReduce = useReducedMotion();
  const status = tripStatus(trip);
  const currency = trip.currency || 'INR';
  const gradient = gradientForTrip(trip.name, trip.destination);

  // Budget calculations if budget_minor exists
  const budgetMinor = Number(trip.budget_minor) || 0;
  const hasBudget = budgetMinor > 0;
  const budgetRatio = hasBudget ? Math.min((totalMinor / budgetMinor) * 100, 100) : 0;
  const isOverBudget = hasBudget && totalMinor > budgetMinor;

  // Fallback member list for AvatarStack
  const membersForStack = membersList.length > 0
    ? membersList
    : Array.from({ length: memberCount ?? trip.members?.length ?? 1 }, (_, i) => `Member ${i + 1}`);

  return (
    <motion.div
      whileHover={shouldReduce ? {} : { y: -4, transition: { duration: 0.2 } }}
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      className="group"
    >
      <Link
        to={`/trips/${trip.id}`}
        className="card-surface flex flex-col overflow-hidden relative border-border/70 hover:border-[#D98264]/40 hover:shadow-lg transition-all"
      >
        {/* Cover visual */}
        {trip.cover_image ? (
          <div className="relative h-32 w-full overflow-hidden bg-secondary">
            <Image
              src={trip.cover_image}
              alt={trip.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 right-3">
              <Pill variant={STATUS_PILL_VARIANTS[status] || 'secondary'} size="sm" dot>
                {TRIP_STATUS[status]}
              </Pill>
            </div>
            {trip.destination && (
              <div className="absolute bottom-2.5 left-3.5 flex items-center gap-1.5 text-xs text-white/90 drop-shadow-sm font-medium">
                <MapPin className="h-3 w-3 text-[#2DD4BF]" />
                <span className="truncate">{trip.destination}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-28 w-full bg-gradient-to-br ${gradient} p-3.5 flex flex-col justify-between overflow-hidden`}>
            {/* Subtle decorative mesh circle */}
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-md" />
            
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 text-xs text-white/95 font-medium drop-shadow-xs">
                {trip.destination ? (
                  <>
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px]">{trip.destination}</span>
                  </>
                ) : (
                  <span className="opacity-75">Trip</span>
                )}
              </div>
              <Pill variant={STATUS_PILL_VARIANTS[status] || 'secondary'} size="sm" dot className="bg-white/20 text-white border-white/30 backdrop-blur-xs">
                {TRIP_STATUS[status]}
              </Pill>
            </div>

            <p className="text-white font-heading text-lg tracking-tight truncate drop-shadow-xs z-10">
              {trip.name}
            </p>
          </div>
        )}

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {trip.cover_image && (
            <h3 className="truncate font-heading text-lg leading-snug">{trip.name}</h3>
          )}

          {/* Date range & Members */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
              {formatDateRange(trip.start_date, trip.end_date)}
            </span>
            <div className="flex items-center gap-1.5">
              <AvatarStack members={membersForStack} max={3} size="xs" />
            </div>
          </div>

          {/* Budget Progress Bar (if budget is defined) */}
          {hasBudget && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget</span>
                <span className="num font-medium text-xs">
                  {formatMoney(totalMinor, currency)} / {formatMoney(budgetMinor, currency)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? 'bg-destructive'
                      : budgetRatio > 80
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#2DD4BF]'
                  }`}
                  style={{ width: `${budgetRatio}%` }}
                />
              </div>
            </div>
          )}

          {/* Financial summary at card bottom */}
          <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total spent</span>
              <Amount value={totalMinor || 0} currency={currency} className="font-semibold text-sm" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Your balance</span>
              <Amount
                value={netMinor || 0}
                currency={currency}
                tone={netMinor > 0 ? 'positive' : netMinor < 0 ? 'negative' : 'muted'}
                signed
                className="font-semibold text-sm"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
