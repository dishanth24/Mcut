import { Plus, Pencil, Users, Wallet, Receipt, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Amount from '@/components/common/Amount';
import StatCard from '@/components/common/StatCard';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { computeBalances, categoryTotals, expenseTotal } from '@/lib/ledger';
import { formatDateRange, tripLength } from '@/lib/trips';
import { categoryOf } from '@/lib/categories';
import { formatMoney } from '@/lib/money';

function Detail({ label, value }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export default function OverviewTab({ trip, members, expenses, settlements, events, user, onAddExpense, onEditTrip }) {
  const currency = trip.currency || 'INR';
  const total = expenseTotal(expenses);
  const balances = computeBalances(members, expenses, settlements);
  const mine = balances.find((b) => b.user_id === user?.id)?.net || 0;
  const budget = trip.budget_minor || 0;
  const categories = categoryTotals(expenses).slice(0, 5);
  const isOwner = trip.created_by_id === user?.id;

  return (
    <div className="space-y-5">
      <div className="card-surface overflow-hidden">
        {trip.cover_image ? (
          <div className="h-40 w-full overflow-hidden bg-secondary">
            <Image src={trip.cover_image} alt={trip.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl leading-snug">{trip.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{trip.destination || 'Destination not set'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onAddExpense}>
                <Plus className="h-4 w-4" /> Add expense
              </Button>
              {isOwner ? (
                <Button size="sm" variant="outline" onClick={onEditTrip}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Dates" value={formatDateRange(trip.start_date, trip.end_date)} />
            <Detail label="Length" value={tripLength(trip.start_date, trip.end_date) ? `${tripLength(trip.start_date, trip.end_date)} days` : '—'} />
            <Detail label="Currency" value={currency} />
            <Detail label="Members" value={`${members.length}`} />
          </div>

          {trip.description ? (
            <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
              {trip.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Trip total"
          value={<Amount value={total} currency={currency} />}
          Icon={Receipt}
          hint={`${expenses.length} expense${expenses.length === 1 ? '' : 's'} recorded`}
        />
        <StatCard
          label="Your balance"
          value={<Amount value={mine} currency={currency} tone={mine > 0 ? 'positive' : mine < 0 ? 'negative' : 'muted'} signed />}
          Icon={Wallet}
          hint={mine > 0 ? 'You should receive this' : mine < 0 ? 'You should pay this' : 'You are square'}
        />
        <StatCard
          label="Budget"
          value={budget ? <Amount value={budget} currency={currency} /> : 'Not set'}
          Icon={PiggyBank}
          hint={
            budget
              ? `${Math.round((total / budget) * 100)}% used · ${formatMoney(Math.max(budget - total, 0), currency)} left`
              : 'Set a budget in the Budget tab'
          }
        />
        <StatCard
          label="Members"
          value={members.length}
          Icon={Users}
          hint={
            members
              .slice(0, 3)
              .map((m) => m.user_name.split(' ')[0])
              .join(', ') || 'Invite your travel mates'
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base">Where the money went</h3>
            <span className="text-xs text-muted-foreground">{expenses.length} expenses</span>
          </div>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Add an expense to see the breakdown.</p>
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

        <section className="card-surface p-5">
          <h3 className="text-base">Recent activity</h3>
          <div className="mt-2">
            <ActivityFeed events={events.slice(0, 5)} emptyHint="Expenses, invitations and settlements show up here." />
          </div>
        </section>
      </div>
    </div>
  );
}