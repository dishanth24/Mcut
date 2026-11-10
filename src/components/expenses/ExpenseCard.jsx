import { formatDate } from '@/lib/trips';
import { formatMoney } from '@/lib/money';
import { categoryOf } from '@/lib/categories';

export default function ExpenseCard({ expense, memberId, onOpen }) {
  const cat = categoryOf(expense.category);
  const mine = (expense.shares || []).find((s) => s.user_id === memberId)?.amount_minor || 0;
  const payerNames = (expense.payers || []).map((p) => p.name).filter(Boolean).join(' & ');

  return (
    <button
      type="button"
      onClick={() => onOpen?.(expense)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left transition hover:border-primary/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <cat.Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{expense.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {cat.label} · {formatDate(expense.expense_date)}
          {payerNames ? ` · ${payerNames} paid` : ''}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="num block text-sm font-semibold">
          {formatMoney(expense.amount_minor, expense.currency)}
        </span>
        <span className="mt-0.5 block text-[0.7rem] text-muted-foreground">
          {mine ? `your share ${formatMoney(mine, expense.currency)}` : 'not involved'}
        </span>
      </span>
    </button>
  );
}