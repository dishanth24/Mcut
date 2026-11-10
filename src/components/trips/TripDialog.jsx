import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_LIST, formatDecimal, toMinor } from '@/lib/money';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

export default function TripDialog({ open, onOpenChange, trip, user, onSaved }) {
  const isEdit = Boolean(trip?.id);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [budget, setBudget] = useState('');
  const [cover, setCover] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(trip?.name || '');
    setDestination(trip?.destination || '');
    setDescription(trip?.description || '');
    setStartDate(trip?.start_date || '');
    setEndDate(trip?.end_date || '');
    setCurrency(trip?.currency || 'INR');
    setBudget(trip?.budget_minor ? formatDecimal(trip.budget_minor, trip.currency || 'INR') : '');
    setCover(trip?.cover_image || '');
  }, [open, trip?.id]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Give your trip a name.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('The end date cannot be before the start date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim(),
        start_date: startDate || '',
        end_date: endDate || '',
        currency,
        budget_minor: budget ? toMinor(budget, currency) : 0,
        cover_image: cover.trim(),
      };

      if (isEdit) {
        await base44.entities.Trip.update(trip.id, payload);
        await logActivity({
          trip,
          type: 'trip_updated',
          message: `${displayName(user)} updated the trip details`,
          actor: { id: user.id, name: displayName(user) },
        });
        onSaved?.();
      } else {
        const created = await base44.entities.Trip.create({
          ...payload,
          archived: false,
          members: [user.id],
        });
        try {
          await base44.entities.TripMember.create({
            trip_id: created.id,
            user_id: user.id,
            user_name: displayName(user),
            user_email: user.email || '',
            role: 'owner',
            members: [user.id],
          });
        } catch (memberError) {
          await base44.entities.Trip.delete(created.id).catch(() => {});
          throw memberError;
        }
        await logActivity({
          trip: created,
          type: 'trip_created',
          message: `${displayName(user)} created this trip`,
          actor: { id: user.id, name: displayName(user) },
        });
        onSaved?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Could not save the trip. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{isEdit ? 'Edit trip' : 'New trip'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the plan. Amounts are stored in the trip currency.' : 'Set the scene, then invite the people travelling with you.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="trip-name">Trip name</Label>
            <Input
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goa in December"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-destination">Destination</Label>
              <Input
                id="trip-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Goa, India"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} · {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-start">Start date</Label>
              <Input id="trip-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-end">End date</Label>
              <Input id="trip-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-budget">Budget (optional)</Label>
              <Input
                id="trip-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="num text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-cover">Cover image URL (optional)</Label>
              <Input
                id="trip-cover"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trip-description">Description (optional)</Label>
            <Textarea
              id="trip-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Beach, seafood, and absolutely no spreadsheets."
            />
          </div>

          {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}