import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Receipt,
  Pencil,
  Trash2,
  UserPlus,
  Banknote,
  CheckCircle2,
  MapPin,
  Compass,
  Wallet,
  Calendar,
} from 'lucide-react';
import { relativeTime } from '@/lib/trips';
import { formatMoney } from '@/lib/money';
import EmptyState from '@/components/common/EmptyState';
import { motion, useReducedMotion } from 'framer-motion';

const EVENT_CONFIG = {
  trip_created: {
    Icon: Compass,
    bg: 'bg-[#D98264]/15',
    color: 'text-[#D98264]',
    border: 'border-[#D98264]/30',
  },
  trip_updated: {
    Icon: Pencil,
    bg: 'bg-[#D98264]/10',
    color: 'text-[#D98264]',
    border: 'border-[#D98264]/20',
  },
  expense_added: {
    Icon: Receipt,
    bg: 'bg-[#2DD4BF]/15',
    color: 'text-[#2DD4BF]',
    border: 'border-[#2DD4BF]/30',
  },
  expense_updated: {
    Icon: Pencil,
    bg: 'bg-secondary',
    color: 'text-muted-foreground',
    border: 'border-border/60',
  },
  expense_deleted: {
    Icon: Trash2,
    bg: 'bg-destructive/15',
    color: 'text-destructive',
    border: 'border-destructive/30',
  },
  member_joined: {
    Icon: UserPlus,
    bg: 'bg-[#8B5CF6]/15',
    color: 'text-[#8B5CF6]',
    border: 'border-[#8B5CF6]/30',
  },
  settlement_recorded: {
    Icon: Banknote,
    bg: 'bg-[#F59E0B]/15',
    color: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/30',
  },
  settlement_confirmed: {
    Icon: CheckCircle2,
    bg: 'bg-[#2DD4BF]/15',
    color: 'text-[#2DD4BF]',
    border: 'border-[#2DD4BF]/30',
  },
  itinerary_added: {
    Icon: MapPin,
    bg: 'bg-[#8B5CF6]/15',
    color: 'text-[#8B5CF6]',
    border: 'border-[#8B5CF6]/30',
  },
  budget_updated: {
    Icon: Wallet,
    bg: 'bg-[#F59E0B]/15',
    color: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/30',
  },
};

function getPeriod(dateString) {
  if (!dateString) return 'Earlier';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - eventDay) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Earlier this week';
  if (diffDays < 30) return 'Earlier this month';
  return 'Older';
}

export default function ActivityFeed({
  events = [],
  emptyHint = 'Trip activity will appear here.',
  groupByPeriod = true,
  showTripBadge = false,
  trips = [],
}) {
  const shouldReduce = useReducedMotion();

  // Create lookup for trip name
  const tripMap = useMemo(() => {
    const map = new Map();
    trips.forEach((t) => {
      if (t?.id) map.set(t.id, t.name || 'Trip');
    });
    return map;
  }, [trips]);

  // Group events by period if requested
  const periodGroups = useMemo(() => {
    if (!groupByPeriod) {
      return [{ period: null, items: events }];
    }
    const order = ['Today', 'Yesterday', 'Earlier this week', 'Earlier this month', 'Older'];
    const groups = {};
    events.forEach((event) => {
      const period = getPeriod(event.created_date);
      if (!groups[period]) groups[period] = [];
      groups[period].push(event);
    });

    return order
      .filter((p) => groups[p] && groups[p].length > 0)
      .map((p) => ({ period: p, items: groups[p] }));
  }, [events, groupByPeriod]);

  if (events.length === 0) {
    return <EmptyState Icon={Check} title="Nothing yet" description={emptyHint} />;
  }

  let globalIndex = 0;

  return (
    <div className="relative pl-1 sm:pl-2">
      {periodGroups.map((group) => (
        <div key={group.period || 'all'} className="mb-6 last:mb-0">
          {group.period && (
            <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-background/90 py-1.5 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-2xs">
                <Calendar className="h-3 w-3 text-primary" />
                {group.period}
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
          )}

          <div className="relative">
            {/* Timeline vertical guide line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[1.15rem] sm:left-[1.35rem] top-3 bottom-3 w-px bg-border/60"
            />

            <ol className="space-y-2.5 relative z-10">
              {group.items.map((event) => {
                const itemIndex = globalIndex++;
                const config = EVENT_CONFIG[event.type] || {
                  Icon: Check,
                  bg: 'bg-secondary',
                  color: 'text-muted-foreground',
                  border: 'border-border/60',
                };
                const { Icon, bg, color, border } = config;
                const tripName = event.trip_id ? tripMap.get(event.trip_id) : null;

                return (
                  <motion.li
                    key={event.id || itemIndex}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: shouldReduce ? 0 : Math.min(itemIndex * 0.03, 0.3), duration: 0.25 }}
                    className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/40"
                  >
                    {/* Icon bubble with subtle border and glow */}
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${border} ${bg} ${color} shadow-xs ring-2 ring-background transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>

                    {/* Event content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {event.message}
                        </p>
                        {showTripBadge && tripName && (
                          <Link
                            to={`/trips/${event.trip_id}`}
                            className="inline-flex items-center rounded-full border border-border/60 bg-secondary/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                          >
                            {tripName}
                          </Link>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{relativeTime(event.created_date)}</span>
                        {event.amount_minor ? (
                          <>
                            <span>·</span>
                            <span className="num font-semibold text-[#2DD4BF]">
                              {formatMoney(event.amount_minor, event.currency || 'INR')}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
}
