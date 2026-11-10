import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Amount from '@/components/common/Amount';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import ExpenseDetailDialog from '@/components/expenses/ExpenseDetailDialog.jsx';
import { expenseTotal } from '@/lib/ledger';

export default function ExpensesTab({ trip, members, expenses, user, reload, autoOpenSignal = 0, onAutoOpened }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const currency = trip.currency || 'INR';

  useEffect(() => {
    if (autoOpenSignal > 0) {
      setOpen(true);
      onAutoOpened?.();
    }
  }, [autoOpenSignal]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="field-label">Total recorded</p>
          <p className="num mt-1 text-2xl font-semibold">
            <Amount value={expenseTotal(expenses)} currency={currency} />
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add expense
        </Button>
      </div>

      <ExpenseList
        expenses={expenses}
        members={members}
        currentUserId={user?.id}
        onOpen={setDetail}
        emptyAction={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add the first expense
          </Button>
        }
      />

      <ExpenseDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        trip={trip}
        members={members}
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
    </div>
  );
}