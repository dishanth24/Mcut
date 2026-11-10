import { Input } from '@/components/ui/input';
import { currencySymbol, formatMoney } from '@/lib/money';

const METHODS = [
  { id: 'equal', label: 'Equally' },
  { id: 'exact', label: 'Exact' },
  { id: 'percent', label: 'Percent' },
  { id: 'shares', label: 'Shares' },
];

export default function SplitEditor({
  method,
  onMethodChange,
  participants,
  values,
  onValueChange,
  currency,
  shares,
  error,
}) {
  const allocated = shares.reduce((sum, s) => sum + s.amount_minor, 0);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-card p-1">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMethodChange(m.id)}
            className={`rounded-md px-1 py-1.5 text-xs font-medium transition-colors ${
              method === m.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'equal' ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Split evenly between the {participants.length} selected people. Any leftover minor units go to the
          first people in the list so the shares always add up to the exact total.
        </p>
      ) : (
        <div className="space-y-2">
          {participants.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3">
              <span className="flex-1 truncate text-sm">{m.user_name}</span>
              <div className="relative w-28">
                <Input
                  value={values[m.user_id] ?? ''}
                  onChange={(e) => onValueChange(m.user_id, e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="num h-9 pr-8 text-right"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-muted-foreground">
                  {method === 'percent' ? '%' : method === 'shares' ? 'sh' : currencySymbol(currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 border-t border-border pt-2">
        {shares.map((s) => (
          <div key={s.user_id} className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">{s.name}</span>
            <span className="num text-foreground">{formatMoney(s.amount_minor, currency)}</span>
          </div>
        ))}
        {error ? (
          <p className="pt-1 text-xs text-destructive">{error}</p>
        ) : (
          <p className="flex justify-between pt-1 text-xs text-muted-foreground">
            <span>Allocated</span>
            <span className="num">{formatMoney(allocated, currency)}</span>
          </p>
        )}
      </div>
    </div>
  );
}