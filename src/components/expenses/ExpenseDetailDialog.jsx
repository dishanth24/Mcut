import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
import MemberAvatar from '@/components/common/MemberAvatar';

const CAT_COLORS = {
  food: 'bg-[#D98264]/20 text-[#D98264]',
  stay: 'bg-[#2DD4BF]/20 text-[#2DD4BF]',
  transport: 'bg-[#8B5CF6]/20 text-[#8B5CF6]',
  flights: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  fuel: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  shopping: 'bg-[#EC4899]/20 text-[#EC4899]',
  activities: 'bg-[#10B981]/20 text-[#10B981]',
  groceries: 'bg-[#84CC16]/20 text-[#84CC16]',
  entertainment: 'bg-[#F97316]/20 text-[#F97316]',
  medical: 'bg-[#EF4444]/20 text-[#EF4444]',
  misc: 'bg-secondary text-muted-foreground',
};

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
  const colorClass = CAT_COLORS[expense.category] || CAT_COLORS.misc;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.Expense.delete(expense.id);
      await logActivity({
        trip,
        type: 'expense_deleted',
        message: `${displayName(user)} removed "${expense.title}"`,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md p-0">
        {/* Header gradient panel */}
        <div className="bg-gradient-to-b from-secondary/80 to-background p-6 rounded-t-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
                <cat.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <DialogTitle className="font-heading text-2xl">{expense.title}</DialogTitle>
                <DialogDescription>
                  {cat.label} · {formatDate(expense.expense_date)}
                </DialogDescription>
              </div>
            </div>
            <p className="num text-4xl font-bold">{formatMoney(expense.amount_minor, currency)}</p>
            <Badge variant="secondary" className="mt-2 w-fit">
              {METHOD_LABELS[expense.split_method] || 'Split'}
            </Badge>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Receipt preview */}
          {expense.receipt_uri ? (
            <div className="rounded-2xl overflow-hidden max-h-48">
              <ReceiptLink fileUri={expense.receipt_uri} />
            </div>
          ) : null}

          {/* Paid by */}
          <div>
            <p className="field-label mb-2">Paid by</p>
            <div className="space-y-1.5">
              {(expense.payers || []).map((p) => (
                <div key={p.user_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={p.name} size="xs" />
                    <span>{p.name}</span>
                  </div>
                  <span className="num">{formatMoney(p.amount_minor, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Split breakdown with progress bars */}
          <div>
            <p className="field-label mb-2">Split between</p>
            <div className="space-y-2">
              {(expense.shares || []).map((s) => {
                const pct = expense.amount_minor > 0 ? (s.amount_minor / expense.amount_minor * 100) : 0;
                return (
                  <div key={s.user_id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MemberAvatar name={s.name} size="xs" />
                        <span className="text-sm">{s.name}</span>
                        {expense.split_method === 'percent' && s.weight
                          ? <span className="text-xs text-muted-foreground">· {s.weight}%</span>
                          : null}
                        {expense.split_method === 'shares' && s.weight
                          ? <span className="text-xs text-muted-foreground">· {s.weight} share{s.weight > 1 ? 's' : ''}</span>
                          : null}
                      </div>
                      <span className="num text-sm text-muted-foreground">
                        {formatMoney(s.amount_minor, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-brand-teal"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant */}
          {expense.merchant ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Merchant</span>
              <span>{expense.merchant}</span>
            </div>
          ) : null}

          {/* Notes */}
          {expense.notes ? (
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
              {expense.notes}
            </p>
          ) : null}

          {/* Created by */}
          <p className="text-xs text-muted-foreground">
            Added by {expense.created_by_name || 'a trip member'}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border border-white/10 rounded-xl h-10 px-4"
              onClick={() => onEdit?.(expense)}
            >
              Edit expense
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive h-10 rounded-xl">
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
