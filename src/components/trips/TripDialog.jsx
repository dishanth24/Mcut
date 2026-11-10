import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_LIST, formatDecimal, toMinor } from '@/lib/money';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

export default function TripDialog({ open, onOpenChange, trip, user, onSaved, onDeleted }) {
  const isEdit = Boolean(trip?.id);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [budget, setBudget] = useState('');
  const [cover, setCover] = useState('');
  const [userUpi, setUserUpi] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setUserUpi(user?.upi_id || '');
  }, [open, trip?.id, user?.upi_id]);

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

        // Save member with their UPI ID so friends can scan and pay straight away
        try {
          await base44.entities.TripMember.create({
            trip_id: created.id,
            user_id: user.id,
            user_name: displayName(user),
            user_email: user.email || '',
            role: 'owner',
            upi_id: userUpi.trim(),
            members: [user.id],
          });
        } catch (memberError) {
          await base44.entities.Trip.delete(created.id).catch(() => {});
          throw memberError;
        }

        // If user provided a UPI ID, also persist it on profile for convenience
        if (userUpi.trim()) {
          base44.auth.updateMe({ upi_id: userUpi.trim() }).catch(() => {});
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

  const handleDeleteTrip = async () => {
    if (!trip?.id) return;
    setDeleting(true);
    try {
      await base44.entities.Trip.delete(trip.id);
      onOpenChange(false);
      onDeleted?.(trip.id);
    } catch (err) {
      setError(err?.message || 'Could not delete this trip. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg rounded-3xl border-border/80">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{isEdit ? 'Edit trip' : 'New trip'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the plan. Amounts are stored in the trip currency.'
              : 'Set the scene, configure your UPI for quick settle-ups, then invite friends.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="trip-name">Trip name</Label>
            <Input
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Thailand Boys Trip"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-destination">Destination</Label>
              <Input
                id="trip-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Phuket, Thailand"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isEdit}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} · {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Organizer UPI ID during creation */}
          {!isEdit && (
            <div className="space-y-1.5 rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 p-3.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="trip-user-upi" className="text-xs font-semibold text-[#2DD4BF]">
                  Your UPI ID (Optional for Settle-ups)
                </Label>
                <span className="text-[0.65rem] text-muted-foreground">Generates Instant QR</span>
              </div>
              <Input
                id="trip-user-upi"
                value={userUpi}
                onChange={(e) => setUserUpi(e.target.value)}
                placeholder="e.g. name@okaxis or 9876543210@upi"
                className="h-10 rounded-xl font-mono text-xs bg-background/80"
              />
              <p className="text-[0.7rem] text-muted-foreground">
                Trip mates will be able to scan your QR code or tap to pay you back immediately.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-start">Start date</Label>
              <Input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-end">End date</Label>
              <Input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 rounded-xl"
              />
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
                className="num text-right h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-cover">Cover image URL (optional)</Label>
              <Input
                id="trip-cover"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://…"
                className="h-11 rounded-xl"
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
              placeholder="Beach, roadtrips, seafood, and completely honest splits."
              className="rounded-xl resize-none"
            />
          </div>

          {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
          {/* Delete Trip option when editing */}
          {isEdit ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving || deleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-1.5 h-10 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete trip</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-border/80">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-heading text-xl">Delete this trip?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This permanently deletes <span className="font-semibold text-foreground">"{trip?.name}"</span> and all its recorded expenses, settlements, itinerary items, and member balances. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Keep trip</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTrip}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete trip'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex w-full sm:w-auto items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
              className="rounded-xl h-10 flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saving || deleting}
              className="rounded-xl h-10 px-5 bg-[#D98264] hover:bg-[#C97254] text-white flex-1 sm:flex-initial"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
