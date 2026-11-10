import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeBalances, categoryTotals, expenseTotal } from '@/lib/ledger';
import { formatMoney } from '@/lib/money';
import { categoryOf } from '@/lib/categories';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ReportsTab({ trip, members, expenses, settlements }) {
  const currency = trip.currency || 'INR';
  const total = expenseTotal(expenses);
  const categories = categoryTotals(expenses);
  const balances = computeBalances(members, expenses, settlements);

  const pieData = categories.map((row) => ({
    name: categoryOf(row.category).label,
    value: row.amount_minor,
  }));

  const memberData = useMemo(
    () =>
      balances.map((row) => ({
        name: row.name.split(' ')[0],
        paid: Math.round(row.paid / 100),
        share: Math.round(row.share / 100),
      })),
    [balances]
  );

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base">Total spending</h3>
          <p className="num text-2xl font-semibold">{formatMoney(total, currency)}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {expenses.length} expenses across {members.length} people
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h3 className="text-base">By category</h3>
          {pieData.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <>
              <div className="mt-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="transparent" />
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
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: COLORS[index % COLORS.length] }}
                        aria-hidden="true"
                      />
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
          <h3 className="text-base">Paid vs share</h3>
          <p className="mt-1 text-xs text-muted-foreground">In whole {currency} units for readability.</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="paid" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="share" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: 'hsl(var(--chart-1))' }} /> Paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: 'hsl(var(--chart-4))' }} /> Their share
            </span>
          </div>
        </section>
      </div>

      <section className="card-surface overflow-x-auto p-5">
        <h3 className="text-base">Per person</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 font-medium">Member</th>
              <th className="pb-2 text-right font-medium">Paid</th>
              <th className="pb-2 text-right font-medium">Share</th>
              <th className="pb-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {balances.map((row) => (
              <tr key={row.user_id}>
                <td className="py-2">{row.name}</td>
                <td className="num py-2 text-right">{formatMoney(row.paid, currency)}</td>
                <td className="num py-2 text-right">{formatMoney(row.share, currency)}</td>
                <td
                  className={`num py-2 text-right ${
                    row.net > 0 ? 'text-success' : row.net < 0 ? 'text-destructive' : ''
                  }`}
                >
                  {formatMoney(row.net, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}