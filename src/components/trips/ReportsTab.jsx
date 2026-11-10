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
import { Button } from '@/components/ui/button';
import MemberAvatar from '@/components/common/MemberAvatar';
import Pill from '@/components/common/Pill';
import { Download, Printer, Users, Receipt, TrendingUp } from 'lucide-react';

const PALETTE = [
  '#D98264', // Terracotta
  '#2DD4BF', // Lagoon teal
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
];

export default function ReportsTab({ trip, members, expenses, settlements }) {
  const currency = trip.currency || 'INR';
  const total = expenseTotal(expenses);
  const categories = categoryTotals(expenses);
  const balances = computeBalances(members, expenses, settlements);

  const pieData = useMemo(
    () =>
      categories.map((row) => ({
        name: categoryOf(row.category).label,
        value: row.amount_minor,
      })),
    [categories]
  );

  const memberData = useMemo(
    () =>
      balances.map((row) => ({
        name: row.name.split(' ')[0],
        fullName: row.name,
        paid: Math.round(row.paid / 100),
        share: Math.round(row.share / 100),
      })),
    [balances]
  );

  const avgPerPerson = members.length > 0 ? Math.round(total / members.length) : 0;

  // CSV export helper
  const exportCsv = () => {
    const headers = ['Category', 'Description', 'Amount Minor', 'Formatted Amount', 'Date'];
    const rows = expenses.map((exp) => [
      `"${categoryOf(exp.category).label}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.amount_minor,
      `"${formatMoney(exp.amount_minor, currency)}"`,
      exp.spent_at || exp.created_date || '',
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${trip.name || 'trip'}-expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="rounded-xl border border-border/80 bg-card/95 p-2.5 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-foreground">{data.name}</p>
          <p className="num text-sm font-bold text-[#2DD4BF]">{formatMoney(data.value, currency)}</p>
          <p className="text-[11px] text-muted-foreground">{percent}% of trip spending</p>
        </div>
      );
    }
    return null;
  };

  const CustomMemberTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="rounded-xl border border-border/80 bg-card/95 p-2.5 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-foreground">{item.fullName}</p>
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="text-[#2DD4BF]">
              Paid: <span className="num font-semibold">{formatMoney(item.paid * 100, currency)}</span>
            </p>
            <p className="text-[#D98264]">
              Share: <span className="num font-semibold">{formatMoney(item.share * 100, currency)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="card-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="field-label">Trip Total Spending</span>
            <p className="num mt-1 text-3xl font-bold tracking-tight text-foreground">
              {formatMoney(total, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.length} expenses recorded across {members.length} members
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={expenses.length === 0}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border/60 pt-4">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" />
              Average per member
            </span>
            <p className="num mt-1 text-base font-semibold text-foreground">
              {formatMoney(avgPerPerson, currency)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3 w-3 text-[#2DD4BF]" />
              Expenses logged
            </span>
            <p className="num mt-1 text-base font-semibold text-foreground">
              {expenses.length}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-[#F59E0B]" />
              Categories active
            </span>
            <p className="num mt-1 text-base font-semibold text-foreground">
              {categories.length}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category Donut */}
        <section className="card-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Spending by Category</h3>
            <span className="text-xs text-muted-foreground">{categories.length} categories</span>
          </div>

          {pieData.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <div className="mt-4">
              <div className="relative h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PALETTE[index % PALETTE.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                    >
                      Total
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-sm font-bold num"
                    >
                      {formatMoney(total, currency)}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category pills list */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border/60 pt-3">
                {categories.map((row, index) => {
                  const color = PALETTE[index % PALETTE.length];
                  const pct = total > 0 ? Math.round((row.amount_minor / total) * 100) : 0;
                  return (
                    <div
                      key={row.category}
                      className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-secondary/40 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-foreground font-medium">
                          {categoryOf(row.category).label}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="num font-semibold text-foreground">
                          {formatMoney(row.amount_minor, currency)}
                        </span>
                        <span className="num text-[10px] text-muted-foreground w-7 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Paid vs Share Comparison */}
        <section className="card-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Paid vs Share</h3>
            <span className="text-xs text-muted-foreground">In whole {currency}</span>
          </div>

          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 12, right: 12, left: -16, bottom: 8 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip content={<CustomMemberTooltip />} />
                <Bar dataKey="paid" fill="#2DD4BF" radius={[6, 6, 0, 0]} name="Paid" />
                <Bar dataKey="share" fill="#D98264" radius={[6, 6, 0, 0]} name="Share" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2DD4BF]" /> Paid by them
            </span>
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D98264]" /> Their fair share
            </span>
          </div>
        </section>
      </div>

      {/* Per Person Balances Table */}
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Per-Person Accounting</h3>
            <p className="text-xs text-muted-foreground">Detailed summary of contributions and balances</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 text-right font-semibold">Paid Out</th>
                <th className="pb-3 text-right font-semibold">Fair Share</th>
                <th className="pb-3 text-right font-semibold">Net Balance</th>
                <th className="pb-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {balances.map((row) => {
                const member = members.find((m) => m.user_id === row.user_id);
                const isPositive = row.net > 0;
                const isNegative = row.net < 0;

                return (
                  <tr key={row.user_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar
                          name={row.name}
                          avatarUrl={member?.avatar_url}
                          size="sm"
                        />
                        <span className="font-medium text-foreground">{row.name}</span>
                      </div>
                    </td>
                    <td className="num py-3 text-right text-muted-foreground font-medium">
                      {formatMoney(row.paid, currency)}
                    </td>
                    <td className="num py-3 text-right text-muted-foreground font-medium">
                      {formatMoney(row.share, currency)}
                    </td>
                    <td
                      className={`num py-3 text-right font-bold ${
                        isPositive ? 'text-[#2DD4BF]' : isNegative ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {isPositive ? `+${formatMoney(row.net, currency)}` : formatMoney(row.net, currency)}
                    </td>
                    <td className="py-3 text-right">
                      {isPositive ? (
                        <Pill variant="teal" size="sm">Gets back</Pill>
                      ) : isNegative ? (
                        <Pill variant="destructive" size="sm">Owes</Pill>
                      ) : (
                        <Pill variant="secondary" size="sm">Settled</Pill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
