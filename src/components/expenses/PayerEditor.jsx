import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencySymbol } from '@/lib/money';

export default function PayerEditor({
  mode,
  onModeChange,
  members,
  singlePayerId,
  onSinglePayerChange,
  payerAmounts,
  onPayerAmountChange,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-card p-1">
        {[
          { id: 'single', label: 'One person paid' },
          { id: 'multiple', label: 'Split payment' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onModeChange(option.id)}
            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === option.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <Select value={singlePayerId} onValueChange={onSinglePayerChange}>
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="Who paid?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.user_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3">
              <span className="flex-1 truncate text-sm">{m.user_name}</span>
              <div className="relative w-28">
                <Input
                  value={payerAmounts[m.user_id] ?? ''}
                  onChange={(e) => onPayerAmountChange(m.user_id, e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="num h-9 pr-8 text-right"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-muted-foreground">
                  {currencySymbol()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}