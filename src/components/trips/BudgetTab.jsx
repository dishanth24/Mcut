import { useState } from 'react';
import { PiggyBank, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Amount from '@/components/common/Amount';
import { categoryTotals, expenseTotal } from '@/lib/ledger';
import { formatDecimal, formatMoney, toMinor } from '@/lib/money';
import { categoryOf } from '@/lib/categories';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

export default function BudgetTab({ trip, expenses, user, reload }) {
  const currency = trip.currency || 'INR';
  const total = expenseTotal(expenses);
  const budget = trip.budget_minor || 0;
  const isOwner = trip.created_by_id === user?.id;
  const [value, setValue] = useState(budget ? formatDecimal(budget, currency) : '');
  const [saving, setSaving] = useState(false);
  const usedPct = budget ? Math.round((total / budget) * 100) : 0;
  const categories = categoryTotals(expenses);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Trip.update(trip.id, { budget_minor: toMinor(value || 0, currency) });
      await logActivity({
        trip,
        type: 'budget_updated',
        message: `${displayName(user)} updated the trip budget`,
        actor: { id: user.id, name: displayName(user) },
      });
      await reload?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base">Trip budget</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The budget covers every expense recorded on this trip.
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <PiggyBank className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </span>
        </div>

        {budget ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="num text-2xl font-semibold">
                <Amount value={total} currency={currency} />
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  of {formatMoney(budget, currency)}
                </span>
              </p>
              <span className={`text-sm font-medium ${usedPct >= 100 ? 'text-destructive' : usedPct >= 80 ? 'text-warning' : 'text-success'}`}>
                {usedPct}% used
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${usedPct >= 100 ? 'bg-destructive' : usedPct >= 80 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {total > budget
                ? `${formatMoney(total - budget, currency)} over budget`
                : `${formatMoney(budget - total, currency)} still available`}
            </p>
            {usedPct >= 80 ? (
              <p className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                <TriangleAlert className="h-3.5 w-3.5" />
                {usedPct >= 100 ? 'You have gone past the planned budget.' : 'You are close to the planned budget.'}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No budget set for this trip yet.</p>
        )}

        {isOwner ? (
          <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="budget-input">Set trip budget ({currency})</Label>
              <Input
                id="budget-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                className="num max-w-40 text-right"
                placeholder="0"
              />
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save budget'}
            </Button>
          </div>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Only the trip owner can change the budget.
          </p>
        )}
      </div>

      <section className="card-surface p-5">
        <h3 className="text-base">Spending by category</h3>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Add expenses to see category spending.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {categories.map((row) => {
              const cat = categoryOf(row.category);
              const pct = total ? Math.round((row.amount_minor / total) * 100) : 0;
              return (
                <div key={row.category}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <cat.Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
                      {cat.label}
                    </span>
                    <span className="num">{formatMoney(row.amount_minor, currency)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}