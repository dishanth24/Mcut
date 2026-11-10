import React, { useState } from 'react';
import { PiggyBank, TriangleAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
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
import { motion, useReducedMotion } from 'framer-motion';

function BudgetRing({ percentage, size = 160, strokeWidth = 14, color }) {
  const shouldReduce = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cappedPct = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (cappedPct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: shouldReduce ? strokeDashoffset : strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      {/* Center percentage */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-heading text-3xl font-bold tracking-tight">
          {percentage}%
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          used
        </span>
      </div>
    </div>
  );
}

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

  const statusColor =
    usedPct >= 100 ? '#EF4444' : usedPct >= 80 ? '#F59E0B' : '#2DD4BF';

  return (
    <div className="space-y-6">
      {/* ── Main Budget Card with Progress Ring ── */}
      <div className="card-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8 justify-between">
          <div className="space-y-3 text-center sm:text-left max-w-md">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2DD4BF]/15 text-[#2DD4BF]">
                <PiggyBank className="h-4 w-4" />
              </span>
              <h2 className="font-heading text-xl sm:text-2xl tracking-tight">Trip budget</h2>
            </div>

            {budget ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2">
                  <span className="num font-heading text-3xl sm:text-4xl font-bold">
                    <Amount value={total} currency={currency} />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    of {formatMoney(budget, currency)}
                  </span>
                </div>

                {/* Friendly copy */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {usedPct >= 100 ? (
                    <span className="text-destructive font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                      <AlertOctagon className="h-4 w-4 shrink-0" />
                      Over budget by {formatMoney(total - budget, currency)}. Time to trim spending!
                    </span>
                  ) : usedPct >= 80 ? (
                    <span className="text-[#F59E0B] font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                      <TriangleAlert className="h-4 w-4 shrink-0" />
                      Heads up! {usedPct}% used, with {formatMoney(budget - total, currency)} remaining.
                    </span>
                  ) : (
                    <span className="text-[#2DD4BF] font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Looking great! {formatMoney(budget - total, currency)} still available for the trip.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No budget has been set for this trip yet. Set a limit to monitor total group spend in real time.
              </p>
            )}
          </div>

          {/* Animated Ring */}
          {budget > 0 && (
            <div className="shrink-0">
              <BudgetRing percentage={usedPct} size={150} strokeWidth={14} color={statusColor} />
            </div>
          )}
        </div>

        {/* Owner Budget Input */}
        {isOwner ? (
          <div className="mt-7 flex flex-wrap items-end gap-3 border-t border-border/70 pt-5">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label htmlFor="budget-input">Set / Update trip budget ({currency})</Label>
              <Input
                id="budget-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                className="num h-11 rounded-xl max-w-xs text-right focus-visible:ring-[#D98264]"
                placeholder="25000"
              />
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="h-11 rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-xs font-semibold px-5"
            >
              {saving ? 'Saving…' : 'Save budget'}
            </Button>
          </div>
        ) : (
          <p className="mt-5 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            Only the trip creator can adjust the budget limit.
          </p>
        )}
      </div>

      {/* ── Spending by Category ── */}
      <section className="card-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg tracking-tight">Spending by category</h3>
          <span className="text-xs text-muted-foreground">{categories.length} categories</span>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No expenses recorded yet.
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            {categories.map((row) => {
              const cat = categoryOf(row.category);
              const pct = total ? Math.round((row.amount_minor / total) * 100) : 0;

              return (
                <div key={row.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <cat.Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="num font-semibold text-foreground">
                        {formatMoney(row.amount_minor, currency)}
                      </span>
                      <span className="text-muted-foreground text-[0.68rem] w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D98264] to-[#F59E0B]"
                      style={{ width: `${pct}%` }}
                    />
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
