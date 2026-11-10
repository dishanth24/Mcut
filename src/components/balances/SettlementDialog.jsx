import { useEffect, useState } from 'react';
import { Loader2, ExternalLink, QrCode } from 'lucide-react';
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
import UpiQrDialog from '@/components/common/UpiQrDialog';

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
      <DialogContent className="sm:max-w-md rounded-3xl border-border/80">
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
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Who paid" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Who received" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
                className="num text-right h-11 rounded-xl"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settle-date">Date</Label>
              <Input id="settle-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Input id="settle-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid via UPI / GPay" className="h-11 rounded-xl" />
          </div>

          {/* UPI Instant QR Code & Deep Link Card */}
          {recipient?.upi_id && currency === 'INR' ? (
            <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{recipient.user_name}'s UPI ID:</p>
                  <p className="font-mono text-sm font-semibold text-foreground">{recipient.upi_id}</p>
                </div>

                <UpiQrDialog
                  upiId={recipient.upi_id}
                  name={recipient.user_name}
                  amountMinor={amountMinor}
                  currency="INR"
                  note={trip?.name || 'Mcut Settlement'}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-[#2DD4BF]/50 text-[#2DD4BF] hover:bg-[#2DD4BF]/15 gap-1.5 text-xs font-semibold h-9"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Scan QR Code</span>
                    </Button>
                  }
                />
              </div>

              {upiLink && (
                <div className="flex gap-2 pt-1">
                  <Button asChild size="sm" className="flex-1 rounded-xl bg-[#2DD4BF] text-slate-900 hover:bg-[#14B8A6] font-semibold text-xs h-9">
                    <a href={upiLink}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open UPI App (GPay/PhonePe)
                    </a>
                  </Button>
                </div>
              )}

              <p className="text-[0.68rem] text-muted-foreground leading-tight">
                Opening an app or scanning QR is convenient for transfer — this settlement stays pending until the receiver confirms.
              </p>
            </div>
          ) : null}

          {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {saving ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
