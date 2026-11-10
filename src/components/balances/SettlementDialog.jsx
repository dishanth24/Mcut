import { useEffect, useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDecimal, toMinor } from '@/lib/money';
import { todayISO } from '@/lib/trips';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

export default function SettlementDialog({ open, onOpenChange, trip, members, user, preset, onSaved }) {
  const currency = trip?.currency || 'INR';
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setFromId(preset?.from_id || user?.id || '');
    setToId(preset?.to_id || '');
    setAmount(preset ? formatDecimal(preset.amount_minor, currency) : '');
    setDate(todayISO());
    setNote('');
  }, [open, preset?.from_id, preset?.to_id, preset?.amount_minor]);

  const recipient = members.find((m) => m.user_id === toId);
  const amountMinor = toMinor(amount, currency);
  const upiLink =
    recipient?.upi_id && currency === 'INR'
      ? `upi://pay?pa=${encodeURIComponent(recipient.upi_id)}&pn=${encodeURIComponent(
          recipient.user_name
        )}&am=${formatDecimal(amountMinor, 'INR')}&cu=INR&tn=${encodeURIComponent(trip?.name || 'Trip')}`
      : '';

  const submit = async () => {
    const from = members.find((m) => m.user_id === fromId);
    const to = members.find((m) => m.user_id === toId);
    if (!from || !to || fromId === toId) {
      setError('Pick two different people.');
      return;
    }
    if (amountMinor <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const record = await base44.entities.Settlement.create({
        trip_id: trip.id,
        from_user_id: from.user_id,
        from_name: from.user_name,
        to_user_id: to.user_id,
        to_name: to.user_name,
        amount_minor: amountMinor,
        currency,
        status: 'pending',
        note: note.trim(),
        settled_on: date,
        members: trip.members || members.map((m) => m.user_id),
      });
      await logActivity({
        trip,
        type: 'settlement_recorded',
        message: `${displayName(user)} recorded a payment from ${from.user_name} to ${to.user_name}`,
        actor: { id: user?.id, name: displayName(user) },
        amountMinor,
        currency,
        refId: record.id,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Could not record this settlement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Record a settlement</DialogTitle>
          <DialogDescription>
            Balances only change once the person receiving the money confirms it. Recording a payment here does
            not move money by itself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger>
                  <SelectValue placeholder="Who paid" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Who received" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.user_id !== fromId)
                    .map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.user_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settle-amount">Amount ({currency})</Label>
              <Input
                id="settle-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="num text-right"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settle-date">Date</Label>
              <Input id="settle-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Input id="settle-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid via UPI" />
          </div>

          {upiLink ? (
            <div className="rounded-xl border border-border bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">
                {recipient.user_name}'s UPI ID:{' '}
                <span className="font-medium text-foreground">{recipient.upi_id}</span>
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <a href={upiLink}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open UPI app
                </a>
              </Button>
              <p className="mt-2 text-[0.7rem] text-muted-foreground">
                Opening a payment app is not proof of payment — the settlement stays pending until it is confirmed.
              </p>
            </div>
          ) : null}

          {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}