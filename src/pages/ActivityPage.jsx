import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLedger } from '@/hooks/useLedger';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { Activity as ActivityIcon } from 'lucide-react';

export default function ActivityPage() {
  const { trips, loading: tripsLoading } = useLedger();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ActivityEvent.list({ sort: '-created_date', limit: 80 })
      .then((page) => setEvents(page.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = events.reduce((acc, event) => {
    const key = event.trip_id || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Activity" subtitle="Everything that changed across your trips." />

      {loading || tripsLoading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          Icon={ActivityIcon}
          title="No activity yet"
          description="Expenses, invitations, settlements and itinerary edits will all appear here."
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([tripId, rows]) => {
            const trip = trips.find((t) => t.id === tripId);
            return (
              <section key={tripId} className="card-surface p-5">
                <h2 className="text-base">{trip?.name || 'Trip'}</h2>
                <div className="mt-2">
                  <ActivityFeed events={rows} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}