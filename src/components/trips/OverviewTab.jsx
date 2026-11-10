import React from 'react';
import {
  Plus,
  Receipt,
  PiggyBank,
  Users,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Amount from '@/components/common/Amount';
import StatCard from '@/components/common/StatCard';
import MemberAvatar from '@/components/common/MemberAvatar';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { computeBalances, categoryTotals, expenseTotal, simplifyDebts } from '@/lib/ledger';
import { formatDateRange, tripLength } from '@/lib/trips';
import { categoryOf } from '@/lib/categories';
import { formatMoney } from '@/lib/money';
import { motion, useReducedMotion } from 'framer-motion';

const CATEGORY_COLORS = [
  'bg-[#D98264]', // orange
  'bg-[#2DD4BF]', // teal
  'bg-[#8B5CF6]', // violet
  'bg-[#F59E0B]', // amber
  'bg-[#EC4899]', // pink
  'bg-[#3B82F6]', // blue
];

export default function OverviewTab({
  trip,
  members,
  expenses,
  settlements,
  events,
  user,
  onAddExpense,
}) {
  const shouldReduce = useReducedMotion();
  const currency = trip.currency || 'INR';
  const total = expenseTotal(expenses);
  const balances = computeBalances(members, expenses, settlements);
  const mine = balances.find((b) => b.user_id === user?.id)?.net || 0;
  const budget = trip.budget_minor || 0;
  const categories = categoryTotals(expenses).slice(0, 5);
  const debts = simplifyDebts(balances).slice(0, 4);

  const durationDays = tripLength(trip.start_date, trip.end_date);

  return (
    <div className="space-y-6">
      {/* ── Top Stat Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Trip total"
          value={<Amount value={total} currency={currency} />}
          Icon={Receipt}
          hint={`${expenses.length} expense${expenses.length === 1 ? '' : 's'} recorded`}
          tone="default"
          accent="orange"
          delay={0}
        />
        <StatCard
          label="Your balance"
          value={<Amount value={mine} currency={currency} tone={mine > 0 ? 'positive' : mine < 0 ? 'negative' : 'muted'} signed />}
          Icon={Wallet}
          hint={mine > 0 ? 'You should receive this' : mine < 0 ? 'You should pay this' : 'All square'}
          tone={mine > 0 ? 'positive' : mine < 0 ? 'negative' : 'default'}
          accent={mine > 0 ? 'positive' : mine < 0 ? 'negative' : 'neutral'}
          delay={0.06}
        />
        <StatCard
          label="Trip budget"
          value={budget ? <Amount value={budget} currency={currency} /> : 'Not set'}
          Icon={PiggyBank}
          hint={
            budget
              ? `${Math.round((total / budget) * 100)}% spent · ${formatMoney(Math.max(budget - total, 0), currency)} left`
              : 'Add budget in Budget tab'
          }
          tone="default"
          accent={budget && total > budget ? 'negative' : 'positive'}
          delay={0.12}
        />
        <StatCard
          label="Travel crew"
          value={`${members.length} members`}
          Icon={Users}
          hint={
            members
              .slice(0, 3)
              .map((m) => m.user_name.split(' ')[0])
              .join(', ') || 'No members yet'
          }
          tone="default"
          accent="violet"
          delay={0.18}
        />
      </div>

      {/* ── Mid Section: "Who owes whom" & Trip Details ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Who owes whom (simplified debts) */}
        <section className="card-surface p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-lg tracking-tight">Who owes whom</h3>
              <p className="text-xs text-muted-foreground">Smart settle-up transfers to balance the ledger</p>
            </div>
            <Button size="sm" onClick={onAddExpense} className="rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-xs">
              <Plus className="h-4 w-4 mr-1" /> Add expense
            </Button>
          </div>

          {debts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl bg-secondary/30 border border-dashed border-border/70">
              <CheckCircle2 className="h-10 w-10 text-[#2DD4BF] mb-2" />
              <p className="font-heading text-base">All square!</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                No outstanding debts on this trip right now. Everyone is balanced.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {debts.map((d, i) => (
                <motion.div
                  key={`${d.from_id}-${d.to_id}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduce ? 0 : i * 0.05 }}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-xs hover:border-[#D98264]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MemberAvatar name={d.from_name} size="sm" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <MemberAvatar name={d.to_name} size="sm" />
                    <div className="min-w-0 text-xs">
                      <p className="truncate font-semibold text-foreground">
                        {d.from_name.split(' ')[0]} → {d.to_name.split(' ')[0]}
                      </p>
                      <p className="text-muted-foreground truncate text-[0.65rem]">settle transfer</p>
                    </div>
                  </div>

                  <span className="num font-semibold text-sm text-[#2DD4BF] shrink-0 ml-2">
                    {formatMoney(d.amount_minor, currency)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Trip snapshot / Details */}
        <section className="card-surface p-5 sm:p-6 space-y-4">
          <h3 className="font-heading text-lg tracking-tight">Trip info</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Dates
              </span>
              <span className="font-medium text-foreground">
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Duration
              </span>
              <span className="font-medium text-foreground">
                {durationDays ? `${durationDays} days` : 'Flexible'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-semibold text-foreground">{currency}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expenses recorded</span>
              <span className="num font-semibold text-foreground">{expenses.length}</span>
            </div>
          </div>

          {trip.description && (
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
              {trip.description}
            </p>
          )}
        </section>
      </div>

      {/* ── Bottom Section: Category Breakdown & Recent Activity ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown with animated draw */}
        <section className="card-surface p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-lg tracking-tight">Spending by category</h3>
              <p className="text-xs text-muted-foreground">Where the money was spent</p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {categories.length} categories
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No expenses recorded yet. Log your first meal or ride to see the breakdown.
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {categories.map((row, i) => {
                const cat = categoryOf(row.category);
                const pct = total ? Math.round((row.amount_minor / total) * 100) : 0;
                const colorClass = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

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

                    {/* Animated Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className={`h-full rounded-full ${colorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: shouldReduce ? 0 : 0.6, delay: i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="card-surface p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg tracking-tight">Recent activity</h3>
            <span className="text-xs text-muted-foreground">Live feed</span>
          </div>
          <div className="mt-2">
            <ActivityFeed
              events={events.slice(0, 5)}
              emptyHint="Expenses, invitations and settlements show up here as they happen."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
