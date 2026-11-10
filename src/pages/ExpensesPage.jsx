import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLedger } from '@/hooks/useLedger';
import { expenseTotal } from '@/lib/ledger';
import PageHeader from '@/components/common/PageHeader';
import Amount from '@/components/common/Amount';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import ExpenseDetailDialog from '@/components/expenses/ExpenseDetailDialog.jsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt } from 'lucide-react';
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
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add expense
            </Button>
          ) : null
        }
      />

      {loading ? (
        <Loading />
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
          <div className="flex flex-wrap items-center gap-3">
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Choose a trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              <span className="num font-semibold text-foreground">
                <Amount value={expenseTotal(tripExpenses)} currency={currency} />
              </span>{' '}
              across {tripExpenses.length} expense{tripExpenses.length === 1 ? '' : 's'}
            </p>
          </div>

          <ExpenseList
            expenses={tripExpenses}
            members={tripMembers}
            currentUserId={user?.id}
            onOpen={setDetail}
            emptyAction={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add the first expense
              </Button>
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