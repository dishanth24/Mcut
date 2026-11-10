import { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { expenseTotal } from '@/lib/ledger';
import PageHeader from '@/components/common/PageHeader';
import Amount from '@/components/common/Amount';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import ExpenseDetailDialog from '@/components/expenses/ExpenseDetailDialog.jsx';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { trips, expenses, members, loading, reload } = useLedger();
  const [tripId, setTripId] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!tripId && trips.length > 0) setTripId(trips[0].id);
  }, [trips, tripId]);

  const trip = trips.find((t) => t.id === tripId);
  const tripMembers = members.filter((m) => m.trip_id === tripId);
  const tripExpenses = expenses.filter((e) => e.trip_id === tripId);
  const currency = trip?.currency || 'INR';

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Every shared cost, one trip at a time."
        actions={
          trip ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-2xl bg-brand-orange text-white hover:bg-[#C97254] px-4 py-2 flex items-center gap-2 font-medium transition-colors min-h-[44px]"
            >
              <Plus className="h-4 w-4" /> Add expense
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title="No trips to track yet"
          description="Expenses live inside trips, so start with a trip first."
          action={
            <Button asChild size="sm">
              <Link to="/trips">Go to my trips</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Trip selector: horizontal chip row */}
          <div className="space-y-3">
            <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
              {trips.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTripId(t.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all min-h-[36px] ${
                    t.id === tripId
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'card-surface inner-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Total badge */}
            {trip && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 text-brand-teal px-3 py-1 text-sm font-medium">
                <Amount value={expenseTotal(tripExpenses)} currency={currency} />
                <span className="text-brand-teal/70">
                  across {tripExpenses.length} expense{tripExpenses.length === 1 ? '' : 's'}
                </span>
              </span>
            )}
          </div>

          <ExpenseList
            expenses={tripExpenses}
            members={tripMembers}
            currentUserId={user?.id}
            onOpen={setDetail}
            emptyAction={
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-2xl bg-brand-orange text-white hover:bg-[#C97254] px-4 py-2 flex items-center gap-2 font-medium transition-colors min-h-[44px]"
              >
                <Plus className="h-4 w-4" /> Add the first expense
              </button>
            }
          />
        </div>
      )}

      {trip ? (
        <>
          <ExpenseDialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
            trip={trip}
            members={tripMembers}
            user={user}
            expense={editing}
            onSaved={reload}
          />
          <ExpenseDetailDialog
            expense={detail}
            trip={trip}
            user={user}
            open={Boolean(detail)}
            onOpenChange={(value) => {
              if (!value) setDetail(null);
            }}
            onEdit={(expense) => {
              setDetail(null);
              setEditing(expense);
              setOpen(true);
            }}
            onDeleted={reload}
          />
        </>
      ) : null}
    </>
  );
}
