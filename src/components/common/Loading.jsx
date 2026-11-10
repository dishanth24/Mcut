export default function Loading({ label = 'Loading' }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
    </div>
  );
}