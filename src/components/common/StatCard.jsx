const TONES = {
  default: 'text-foreground',
  positive: 'text-success',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

export default function StatCard({ label, value, hint, tone = 'default', Icon }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="field-label">{label}</span>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} /> : null}
      </div>
      <p className={`num mt-3 text-[1.6rem] font-semibold leading-none tracking-tight ${TONES[tone] || ''}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}