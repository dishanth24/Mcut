export const TRIP_STATUS = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  archived: 'Archived',
};

function parseDate(value) {
  if (!value) return null;
  return new Date(value.length <= 10 ? `${value}T00:00:00` : value);
}

export function tripStatus(trip) {
  if (!trip) return 'upcoming';
  if (trip.archived) return 'archived';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseDate(trip.start_date);
  const end = parseDate(trip.end_date);
  if (end && end < today) return 'completed';
  if (start && start > today) return 'upcoming';
  return 'ongoing';
}

export function todayISO() {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function formatDate(value) {
  const d = parseDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDay(value) {
  const d = parseDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDateRange(start, end) {
  if (!start && !end) return 'Dates not set';
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  const a = parseDate(start);
  const b = parseDate(end);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function tripLength(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return 0;
  const diff = Math.round((b - a) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

export function relativeTime(value) {
  if (!value) return '';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';
  const diff = Date.now() - then.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function monthKey(value) {
  if (!value) return '';
  const raw = String(value).slice(0, 7);
  return raw;
}