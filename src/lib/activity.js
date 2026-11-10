import { base44 } from '@/api/base44Client';

/**
 * Append an entry to a trip's activity feed.
 * Every member of the trip can read it; nobody can edit someone else's entry.
 */
export async function logActivity({ trip, type, message, actor, amountMinor = 0, currency, refId }) {
  if (!trip) return null;
  return base44.entities.ActivityEvent.create({
    trip_id: trip.id,
    type,
    message,
    actor_id: actor?.id || '',
    actor_name: actor?.name || '',
    amount_minor: amountMinor || 0,
    currency: currency || trip.currency || '',
    ref_id: refId || '',
    members: trip.members || [],
  });
}