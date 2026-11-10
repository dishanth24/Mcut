import { useEffect, useMemo, useState } from 'react';
import { Loader2, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES } from '@/lib/categories';
import { allocateByWeights, allocateEven, formatDecimal, formatMoney, toMinor } from '@/lib/money';
import { todayISO } from '@/lib/trips';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';
import { cn } from '@/lib/utils';
import SplitEditor from '@/components/expenses/SplitEditor';
import PayerEditor from '@/components/expenses/PayerEditor';
import MemberAvatar from '@/components/common/MemberAvatar';

export default function ExpenseDialog({ open, onOpenChange, trip, members, user, expense, onSaved }) {
  const currency = trip?.currency || 'INR';
  const isEdit = Boolean(expense);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [merchant, setMerchant] = useState('');
  const [method, setMethod] = useState('equal');
  const [participantIds, setParticipantIds] = useState([]);
  const [values, setValues] = useState({});
  const [payerMode, setPayerMode] = useState('single');
  const [singlePayerId, setSinglePayerId] = useState('');
  const [payerAmounts, setPayerAmounts] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setReceipt(null);
    if (expense) {
      setTitle(expense.title || '');
      setAmount(formatDecimal(expense.amount_minor || 0, currency));
      setCategory(expense.category || 'misc');
      setDate(expense.expense_date || todayISO());
      setNotes(expense.notes || '');
      setMerchant(expense.merchant || '');
      setMethod(expense.split_method || 'equal');
      setParticipantIds((expense.shares || []).map((s) => s.user_id));
      setPayerMode((expense.payers || []).length > 1 ? 'multiple' : 'single');
      setSinglePayerId(expense.payers?.[0]?.user_id || user?.id || '');
      setPayerAmounts(
        Object.fromEntries((expense.payers || []).map((p) => [p.user_id, formatDecimal(p.amount_minor, currency)]))
      );
      const prefilled = {};
      (expense.shares || []).forEach((s) => {
        if (expense.split_method === 'percent' || expense.split_method === 'shares') {
          prefilled[s.user_id] = String(s.weight ?? '');
        } else {
          prefilled[s.user_id] = formatDecimal(s.amount_minor, currency);
        }
      });
      setValues(prefilled);
    } else {
      setTitle('');
      setAmount('');
      setCategory('food');
      setDate(todayISO());
      setNotes('');
      setMerchant('');
      setMethod('equal');
      setParticipantIds(members.map((m) => m.user_id));
      setValues({});
      setPayerMode('single');
      setSinglePayerId(user?.id || members[0]?.user_id || '');
      setPayerAmounts({});
    }
  }, [open, expense?.id]);

  const totalMinor = toMinor(amount, currency);
  const participants = useMemo(
    () => members.filter((m) => participantIds.includes(m.user_id)),
    [members, participantIds]
  );

  const shareValues = useMemo(() => {
    if (participants.length === 0) return [];
    if (method === 'equal') {
      const parts = allocateEven(totalMinor, participants.length);
      return participants.map((m, i) => ({
        user_id: m.user_id,
        name: m.user_name,
        amount_minor: parts[i],
        weight: 1,
      }));
    }
    const weights = participants.map((m) => Number(values[m.user_id] || 0));
    if (method === 'exact') {
      return participants.map((m) => ({
        user_id: m.user_id,
        name: m.user_name,
        amount_minor: toMinor(values[m.user_id] || 0, currency),
      }));
    }
    const parts = allocateByWeights(totalMinor, weights);
    return participants.map((m, i) => ({
      user_id: m.user_id,
      name: m.user_name,
      amount_minor: parts[i],
      weight: weights[i],
    }));
  }, [participants, method, values, totalMinor, currency]);

  const payers = useMemo(() => {
    if (payerMode === 'single') {
      const member = members.find((m) => m.user_id === singlePayerId);
      if (!member) return [];
      return [{ user_id: member.user_id, name: member.user_name, amount_minor: totalMinor }];
    }
    return members
      .filter((m) => Number(payerAmounts[m.user_id]) > 0)
      .map((m) => ({
        user_id: m.user_id,
        name: m.user_name,
        amount_minor: toMinor(payerAmounts[m.user_id], currency),
      }));
  }, [payerMode, singlePayerId, payerAmounts, members, totalMinor, currency]);

  const shareError = useMemo(() => {
    if (method === 'equal' || totalMinor <= 0) return '';
    if (method === 'exact') {
      const sum = shareValues.reduce((s, row) => s + row.amount_minor, 0);
      return sum === totalMinor ? '' : `Exact amounts must add up to ${formatMoney(totalMinor, currency)}`;
    }
    const weightSum = participants.reduce((s, m) => s + Number(values[m.user_id] || 0), 0);
    if (method === 'percent') {
      return Math.abs(weightSum - 100) <= 0.01 ? '' : 'Percentages must add up to 100%';
    }
    return weightSum > 0 ? '' : 'Give at least one person a share';
  }, [method, shareValues, participants, values, totalMinor, currency]);

  const payerSum = payers.reduce((s, p) => s + p.amount_minor, 0);
  const payerError =
    payers.length > 0 && payerSum !== totalMinor
      ? `Payers add up to ${formatMoney(payerSum, currency)} but the expense is ${formatMoney(totalMinor, currency)}`
      : '';

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const validate = () => {
    if (!title.trim()) return 'Give this expense a title.';
    if (totalMinor <= 0) return 'Enter an amount greater than zero.';
    if (participants.length === 0) return 'Choose at least one person to split with.';
    if (payers.length === 0) return 'Choose who paid.';
    if (payerSum !== totalMinor) return payerError || 'The payer amounts must equal the expense total.';
    if (shareError) return shareError;
    return '';
  };

  const handleSubmit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        trip_id: trip.id,
        members: trip.members || members.map((m) => m.user_id),
        title: title.trim(),
        amount_minor: totalMinor,
        currency,
        category,
        expense_date: date,
        notes: notes.trim(),
        merchant: merchant.trim(),
        split_method: method,
        payers,
        shares: shareValues.map((s) => ({
          user_id: s.user_id,
          name: s.name,
          amount_minor: s.amount_minor,
          weight: s.weight ?? 1,
        })),
        created_by_name: displayName(user),
      };

      if (receipt) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: receipt });
        payload.receipt_uri = file_uri;
      }

      if (isEdit) {
        await base44.entities.Expense.update(expense.id, payload);
        await logActivity({
          trip,
          type: 'expense_updated',
          message: `${displayName(user)} updated "${payload.title}"`,
          actor: { id: user.id, name: displayName(user) },
          amountMinor: totalMinor,
          currency,
          refId: expense.id,
        });
      } else {
        const created = await base44.entities.Expense.create(payload);
        await logActivity({
          trip,
          type: 'expense_added',
          message: `${displayName(user)} added "${payload.title}"`,
          actor: { id: user.id, name: displayName(user) },
          amountMinor: totalMinor,
          currency,
          refId: created.id,
        });
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Could not save this expense. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg p-0">
        {/* Top gradient panel: amount + currency */}
        <div className="bg-gradient-to-b from-secondary/80 to-background p-6 rounded-t-2xl">
          <div className="flex items-start justify-between mb-4">
            <DialogHeader className="flex-1 min-w-0 pr-4">
              <DialogTitle className="font-heading text-2xl">{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
              <DialogDescription>{trip?.name} · amounts in {currency}</DialogDescription>
            </DialogHeader>
            <span className="shrink-0 rounded-full bg-card border border-white/10 px-3 py-1 text-sm font-medium">
              {currency}
            </span>
          </div>

          {/* Big amount input */}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="num text-5xl font-bold bg-transparent text-center w-full outline-none placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Rest of form */}
        <div className="px-6 pb-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-title">Title</Label>
            <Input
              id="expense-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dinner at the beach shack"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Category picker grid */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2 text-[0.65rem] transition-all border',
                    category === cat.id
                      ? 'border-brand-orange bg-brand-orange/15 text-brand-orange'
                      : 'border-transparent bg-secondary/60 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <cat.Icon className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-center leading-tight">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Paid by */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <PayerEditor
              mode={payerMode}
              onModeChange={setPayerMode}
              members={members}
              singlePayerId={singlePayerId}
              onSinglePayerChange={setSinglePayerId}
              payerAmounts={payerAmounts}
              onPayerAmountChange={(id, value) => setPayerAmounts((prev) => ({ ...prev, [id]: value }))}
            />
            {payerError ? <p className="text-xs text-destructive">{payerError}</p> : null}
          </div>

          {/* Split between: avatar toggle buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split between</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary"
                onClick={() =>
                  setParticipantIds(
                    participantIds.length === members.length ? [] : members.map((m) => m.user_id)
                  )
                }
              >
                {participantIds.length === members.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleParticipant(m.user_id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 h-10 text-sm border transition-all',
                    participantIds.includes(m.user_id)
                      ? 'border-brand-teal bg-brand-teal/15 text-brand-teal'
                      : 'border-border bg-secondary/60 text-muted-foreground'
                  )}
                >
                  <MemberAvatar name={m.user_name} size="xs" />
                  <span>{m.user_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* How to split */}
          <div className="space-y-1.5">
            <Label>How to split</Label>
            <SplitEditor
              method={method}
              onMethodChange={setMethod}
              participants={participants}
              values={values}
              onValueChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
              currency={currency}
              shares={shareValues}
              error={shareError}
            />
          </div>

          {/* Merchant */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-merchant">Merchant (optional)</Label>
            <Input
              id="expense-merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Cafe Mocha"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-notes">Notes (optional)</Label>
            <Textarea
              id="expense-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything worth remembering about this expense"
            />
          </div>

          {/* Receipt upload */}
          <div className="space-y-1.5">
            <Label>Receipt (optional)</Label>
            <label
              htmlFor="expense-receipt"
              className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-secondary/40 hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-all overflow-hidden"
            >
              {receipt ? (
                receipt.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(receipt)}
                    className="h-20 w-full object-cover rounded-xl"
                    alt="receipt"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground px-3 text-center truncate max-w-full">{receipt.name}</span>
                )
              ) : (
                <>
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Attach receipt (optional)</span>
                </>
              )}
            </label>
            <input
              id="expense-receipt"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            />
          </div>

          {/* Error */}
          {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

          {/* Footer buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full h-12 rounded-2xl bg-brand-orange text-white font-medium hover:bg-[#C97254] text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save expense'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="w-full h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
