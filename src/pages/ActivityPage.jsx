import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLedger } from '@/hooks/useLedger';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ActivityFeed from '@/components/activity/ActivityFeed';
import SegmentedControl from '@/components/common/SegmentedControl';
import {
  Activity as ActivityIcon,
  Clock,
  Compass,
  Receipt,
  Banknote,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const FILTER_CONFIG = [
  { id: 'all', label: 'All', Icon: Sparkles },
  { id: 'expenses', label: 'Expenses', Icon: Receipt, match: (type) => type?.startsWith('expense_') },
  { id: 'settlements', label: 'Settlements', Icon: Banknote, match: (type) => type?.startsWith('settlement_') },
  { id: 'trips', label: 'Trips', Icon: Compass, match: (type) => type?.startsWith('trip_') || type === 'budget_updated' },
  { id: 'itinerary', label: 'Itinerary', Icon: MapPin, match: (type) => type?.startsWith('itinerary_') },
  { id: 'members', label: 'Members', Icon: Users, match: (type) => type?.startsWith('member_') },
];

export default function ActivityPage() {
  const { trips, loading: tripsLoading } = useLedger();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'trip'

  useEffect(() => {
    base44.entities.ActivityEvent.list({ sort: '-created_date', limit: 100 })
      .then((page) => setEvents(page.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    const filterDef = FILTER_CONFIG.find((f) => f.id === activeFilter);
    if (!filterDef?.match) return events;
    return events.filter((e) => filterDef.match(e.type));
  }, [events, activeFilter]);

  // Group by trip
  const groupedByTrip = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const key = event.trip_id || 'other';
      acc[key] = acc[key] || [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  // Count items for each filter
  const filterCounts = useMemo(() => {
    const counts = { all: events.length };
    FILTER_CONFIG.forEach((f) => {
      if (f.id === 'all') return;
      counts[f.id] = events.filter((e) => f.match(e.type)).length;
    });
    return counts;
  }, [events]);

  const viewOptions = [
    { value: 'timeline', label: 'Timeline', Icon: Clock },
    { value: 'trip', label: 'By Trip', Icon: Compass },
  ];

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Everything that changed across your trips in real time."
        actions={
          <SegmentedControl
            options={viewOptions}
            value={viewMode}
            onChange={setViewMode}
            layoutId="activityViewToggle"
          />
        }
      />

      {loading || tripsLoading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          Icon={ActivityIcon}
          title="No activity yet"
          description="Expenses, invitations, settlements and itinerary edits will all appear here."
          action={
            <Button asChild size="sm">
              <Link to="/trips">Create or view trips</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {FILTER_CONFIG.map((filter) => {
              const count = filterCounts[filter.id] || 0;
              const isSelected = activeFilter === filter.id;
              const Icon = filter.Icon;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border/70 bg-card-surface text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{filter.label}</span>
                  <span
                    className={cn(
                      'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtered empty state */}
          {filteredEvents.length === 0 ? (
            <div className="card-surface p-8 text-center">
              <ActivityIcon className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium text-foreground">No events in this category</p>
              <p className="mt-1 text-xs text-muted-foreground">
                There are currently no {activeFilter} activity records to show.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveFilter('all')}
              >
                Show all activity
              </Button>
            </div>
          ) : viewMode === 'timeline' ? (
            /* Timeline Unified Feed */
            <div className="card-surface p-5 sm:p-6">
              <ActivityFeed
                events={filteredEvents}
                groupByPeriod={true}
                showTripBadge={true}
                trips={trips}
              />
            </div>
          ) : (
            /* Grouped by Trip Cards */
            <div className="space-y-5">
              {Object.entries(groupedByTrip).map(([tripId, rows]) => {
                const trip = trips.find((t) => t.id === tripId);
                return (
                  <section key={tripId} className="card-surface p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Compass className="h-4 w-4" />
                        </span>
                        <div>
                          <h2 className="text-base font-medium">{trip?.name || 'Unassigned trip'}</h2>
                          {trip?.destination && (
                            <p className="text-xs text-muted-foreground">{trip.destination}</p>
                          )}
                        </div>
                      </div>

                      {trip && (
                        <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <Link to={`/trips/${trip.id}`}>
                            <span>View trip</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    <ActivityFeed events={rows} groupByPeriod={true} />
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
