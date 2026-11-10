import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  PieChart as PieIcon,
  Download,
  Filter,
  ArrowUpRight,
  Receipt,
  Compass,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PALETTE = [
  '#D98264', // Terracotta
  '#2DD4BF', // Lagoon teal
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { trips, expenses, loading } = useLedger();
  const currency = userCurrency(user);
  const [includeOther, setIncludeOther] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('all');

  // Filter trips based on currency preference
  const eligibleTrips = useMemo(
    () => trips.filter((t) => includeOther || (t.currency || 'INR') === currency),
    [trips, currency, includeOther]
  );

  // All trip rows sorted by total
  const tripRows = useMemo(
    () =>
      eligibleTrips
        .map((trip) => ({
          trip,
          total: expenseTotal(expenses.filter((e) => e.trip_id === trip.id)),
          expenseCount: expenses.filter((e) => e.trip_id === trip.id).length,
        }))
        .sort((a, b) => b.total - a.total),
    [eligibleTrips, expenses]
  );

  // Filter expenses by selected trip
  const activeExpenses = useMemo(() => {
    if (selectedTripId !== 'all') {
      return expenses.filter((e) => e.trip_id === selectedTripId);
    }
    const scopedTripIds = new Set(eligibleTrips.map((t) => t.id));
    return expenses.filter((e) => scopedTripIds.has(e.trip_id));
  }, [selectedTripId, expenses, eligibleTrips]);

  const total = useMemo(() => expenseTotal(activeExpenses), [activeExpenses]);
  const categories = useMemo(() => categoryTotals(activeExpenses), [activeExpenses]);

  // Chart data for trip comparison
  const tripChartData = useMemo(
    () =>
      tripRows
        .filter((row) => row.total > 0)
        .slice(0, 6)
        .map((row) => ({
          name: row.trip.name.length > 14 ? `${row.trip.name.slice(0, 12)}…` : row.trip.name,
          fullName: row.trip.name,
          total: Math.round(row.total / 100),
        })),
    [tripRows]
  );

  const avgExpense = activeExpenses.length > 0 ? Math.round(total / activeExpenses.length) : 0;

  // CSV export helper
  const exportCsv = () => {
    const headers = ['Trip', 'Category', 'Description', 'Amount Minor', 'Formatted Amount', 'Date'];
    const rows = activeExpenses.map((exp) => {
      const trip = trips.find((t) => t.id === exp.trip_id);
      return [
        `"${(trip?.name || '').replace(/"/g, '""')}"`,
        `"${categoryOf(exp.category).label}"`,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        exp.amount_minor,
        `"${formatMoney(exp.amount_minor, exp.currency || currency)}"`,
        exp.spent_at || exp.created_date || '',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mcut-expenses-report.csv`);
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
          <p className="text-[11px] text-muted-foreground">{percent}% of total</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-xl border border-border/80 bg-card/95 p-2.5 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-foreground">{data.payload.fullName}</p>
          <p className="num text-sm font-bold text-[#D98264]">
            {formatMoney(data.value * 100, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`Spending analysis across your trips in ${currency}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={activeExpenses.length === 0}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant={includeOther ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIncludeOther((v) => !v)}
              className="text-xs"
            >
              {includeOther ? 'All currencies' : `${currency} trips only`}
            </Button>
          </div>
        }
      />

      {loading ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState
          Icon={PieIcon}
          title="No data yet"
          description="Once you record expenses, reports will break down where the money went."
          action={
            <Button asChild size="sm">
              <Link to="/trips">Go to my trips</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar: Trip Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Scope:</span>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue placeholder="All Trips" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips ({eligibleTrips.length})</SelectItem>
                  {eligibleTrips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {includeOther && (
              <p className="rounded-lg bg-warning/10 px-2.5 py-1 text-xs text-warning">
                Mixing currencies adds different denominations directly.
              </p>
            )}
          </div>

          {/* Stat Cards Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="field-label">Total recorded</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PieIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="num mt-2 text-2xl font-bold tracking-tight text-foreground">
                {formatMoney(total, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedTripId === 'all' ? 'Across all trips' : 'For this trip'}
              </p>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="field-label">Expenses count</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF]">
                  <Receipt className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="num mt-2 text-2xl font-bold tracking-tight text-foreground">
                {activeExpenses.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Line items entered</p>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="field-label">Average expense</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <Compass className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="num mt-2 text-2xl font-bold tracking-tight text-foreground">
                {formatMoney(avgExpense, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Per transaction</p>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="field-label">Trips in view</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                  <Compass className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="num mt-2 text-2xl font-bold tracking-tight text-foreground">
                {selectedTripId === 'all' ? eligibleTrips.length : 1}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedTripId === 'all' ? 'Active ledgers' : 'Selected trip'}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Category Donut */}
            <section className="card-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Spending by Category</h2>
                  <p className="text-xs text-muted-foreground">Breakdown across expense groups</p>
                </div>
                <span className="text-xs font-semibold text-primary">{categories.length} categories</span>
              </div>

              {categories.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No expenses recorded for the selected scope.
                </p>
              ) : (
                <div className="mt-4">
                  <div className="relative h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories.map((row) => ({
                            name: categoryOf(row.category).label,
                            value: row.amount_minor,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          stroke="transparent"
                        >
                          {categories.map((row, index) => (
                            <Cell
                              key={row.category}
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

                  {/* Legend breakdown list */}
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
                            />
                            <span className="truncate text-foreground font-medium">
                              {categoryOf(row.category).label}
                            </span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="num font-semibold text-foreground">
                              {formatMoney(row.amount_minor, currency)}
                            </span>
                            <span className="num text-[10px] text-muted-foreground w-8 text-right">
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

            {/* Trip Comparison Chart */}
            <section className="card-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Spending by Trip</h2>
                  <p className="text-xs text-muted-foreground">Top destinations by spending</p>
                </div>
                <span className="text-xs text-muted-foreground">In whole {currency}</span>
              </div>

              {tripChartData.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No trips with recorded expenses.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tripChartData} margin={{ top: 12, right: 12, left: -16, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="total"
                        fill="#D98264"
                        radius={[6, 6, 0, 0]}
                      >
                        {tripChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PALETTE[index % PALETTE.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* By Trip Table */}
          <section className="card-surface p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Trip Ledgers Breakdown</h2>
                <p className="text-xs text-muted-foreground">All trips with their expense counts and totals</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 font-semibold">Trip</th>
                    <th className="pb-3 text-center font-semibold">Expenses</th>
                    <th className="pb-3 text-right font-semibold">Total Spent</th>
                    <th className="pb-3 text-right font-semibold">Share of Total</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tripRows.map((row) => {
                    const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
                    return (
                      <tr key={row.trip.id} className="group hover:bg-secondary/30 transition-colors">
                        <td className="py-3">
                          <Link
                            to={`/trips/${row.trip.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{row.trip.name}</span>
                            {row.trip.destination && (
                              <span className="text-xs text-muted-foreground font-normal">
                                · {row.trip.destination}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="num py-3 text-center text-muted-foreground">
                          {row.expenseCount}
                        </td>
                        <td className="num py-3 text-right font-semibold text-foreground">
                          {formatMoney(row.total, row.trip.currency || currency)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end w-28">
                            <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="num text-xs text-muted-foreground w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Link to={`/trips/${row.trip.id}`}>
                              <span>Open</span>
                              <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
