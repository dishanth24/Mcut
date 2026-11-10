import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { categoryTotals, expenseTotal } from '@/lib/ledger';
import { formatMoney } from '@/lib/money';
import { userCurrency } from '@/lib/profile';
import { categoryOf } from '@/lib/categories';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ReportsPage() {
  const { user } = useAuth();
  const { trips, expenses, loading } = useLedger();
  const currency = userCurrency(user);
  const [includeOther, setIncludeOther] = useState(false);

  const tripRows = useMemo(
    () =>
      trips
        .filter((t) => includeOther || (t.currency || 'INR') === currency)
        .map((trip) => ({
          trip,
          total: expenseTotal(expenses.filter((e) => e.trip_id === trip.id)),
        }))
        .sort((a, b) => b.total - a.total),
    [trips, expenses, currency, includeOther]
  );

  const scopedTripIds = new Set(tripRows.map((row) => row.trip.id));
  const scopedExpenses = expenses.filter((e) => scopedTripIds.has(e.trip_id));
  const total = expenseTotal(scopedExpenses);
  const categories = categoryTotals(scopedExpenses);
  const chartData = tripRows
    .filter((row) => row.total > 0)
    .slice(0, 6)
    .map((row) => ({ name: row.trip.name, total: Math.round(row.total / 100) }));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`Spending across your trips, in ${currency}.`}
        actions={
          <Button variant={includeOther ? 'default' : 'outline'} size="sm" onClick={() => setIncludeOther((v) => !v)}>
            {includeOther ? 'Mix all currencies' : `${currency} trips only`}
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState
          Icon={PieIcon}
          title="No data yet"
          description="Once you record expenses, reports will show where the money went."
          action={
            <Button asChild size="sm">
              <Link to="/trips">Go to my trips</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card-surface p-5">
              <p className="field-label">Total recorded</p>
              <p className="num mt-2 text-2xl font-semibold">{formatMoney(total, currency)}</p>
            </div>
            <div className="card-surface p-5">
              <p className="field-label">Expenses</p>
              <p className="num mt-2 text-2xl font-semibold">{scopedExpenses.length}</p>
            </div>
            <div className="card-surface p-5">
              <p className="field-label">Trips included</p>
              <p className="num mt-2 text-2xl font-semibold">{tripRows.length}</p>
            </div>
          </div>

          {includeOther ? (
            <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
              Mixing currencies only makes sense when they are informational — the totals below add different
              currencies together.
            </p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card-surface p-5">
              <h2 className="text-lg">By category</h2>
              {categories.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No expenses recorded yet.</p>
              ) : (
                <>
                  <div className="mt-2 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories.map((row) => ({ name: categoryOf(row.category).label, value: row.amount_minor }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {categories.map((row, index) => (
                            <Cell key={row.category} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatMoney(value, currency)}
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {categories.map((row, index) => (
                      <div key={row.category} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                          {categoryOf(row.category).label}
                        </span>
                        <span className="num text-muted-foreground">{formatMoney(row.amount_minor, currency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="card-surface p-5">
              <h2 className="text-lg">Trip totals</h2>
              <p className="mt-1 text-xs text-muted-foreground">In whole {currency} units.</p>
              <div className="mt-3 h-56">
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          <section className="card-surface overflow-x-auto p-5">
            <h2 className="text-lg">By trip</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">Trip</th>
                  <th className="pb-2 text-right font-medium">Expenses</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripRows.map((row) => (
                  <tr key={row.trip.id}>
                    <td className="py-2">
                      <Link to={`/trips/${row.trip.id}`} className="hover:text-primary">
                        {row.trip.name}
                      </Link>
                    </td>
                    <td className="num py-2 text-right">{expenses.filter((e) => e.trip_id === row.trip.id).length}</td>
                    <td className="num py-2 text-right">{formatMoney(row.total, row.trip.currency || currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}