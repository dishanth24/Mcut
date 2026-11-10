import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/trips';
import { categoryOf } from '@/lib/categories';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';
import ReceiptLink from '@/components/expenses/ReceiptLink';

const METHOD_LABELS = {
  equal: 'Split equally',
  exact: 'Exact amounts',
  percent: 'By percentage',
  shares: 'By shares',
};

export default function ExpenseDetailDialog({ expense, trip, user, open, onOpenChange, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  if (!expense) return null;
  const cat = categoryOf(expense.category);
  const currency = expense.currency || trip?.currency || 'INR';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.Expense.delete(expense.id);
      await logActivity({
        trip,
        type: 'expense_deleted',
        message: `${displayName(user)} removed “${expense.title}”`,
        actor: { id: user?.id, name: displayName(user) },
        amountMinor: expense.amount_minor,
        currency,
        refId: expense.id,
      });
      onOpenChange(false);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <cat.Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
            </span>
            <div>
              <DialogTitle className="font-heading text-xl">{expense.title}</DialogTitle>
              <DialogDescription>
                {cat.label} · {formatDate(expense.expense_date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="num text-3xl font-semibold tracking-tight">{formatMoney(expense.amount_minor, currency)}</p>
            <Badge variant="secondary" className="mt-2">
              {METHOD_LABELS[expense.split_method] || 'Split'}
            </Badge>
          </div>

          <div>
            <p className="field-label mb-2">Paid by</p>
            <div className="space-y-1.5">
              {(expense.payers || []).map((p) => (
                <div key={p.user_id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="num">{formatMoney(p.amount_minor, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label mb-2">Split between</p>
            <div className="space-y-1.5">
              {(expense.shares || []).map((s) => (
                <div key={s.user_id} className="flex items-baseline justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="num text-muted-foreground">
                    {formatMoney(s.amount_minor, currency)}
                    {expense.split_method === 'percent' && s.weight ? ` · ${s.weight}%` : ''}
                    {expense.split_method === 'shares' && s.weight ? ` · ${s.weight} share${s.weight > 1 ? 's' : ''}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {expense.merchant ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Merchant</span>
              <span>{expense.merchant}</span>
            </div>
          ) : null}

          {expense.notes ? (
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">{expense.notes}</p>
          ) : null}

          {expense.receipt_uri ? <ReceiptLink fileUri={expense.receipt_uri} /> : null}

          <p className="text-xs text-muted-foreground">
            Added by {expense.created_by_name || 'a trip member'}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit?.(expense)}>
              Edit expense
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Balances for every member will be recalculated straight away. The activity feed keeps a
                    record that this expense was removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete expense'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}