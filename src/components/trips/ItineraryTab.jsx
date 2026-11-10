import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import { formatDay } from '@/lib/trips';
import { logActivity } from '@/lib/activity';
import { displayName } from '@/lib/profile';

export default function ItineraryTab({ trip, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(trip.start_date || '');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.ItineraryItem.filter({ trip_id: trip.id }, { sort: 'day', limit: 200 })
      .then((page) => setItems(page.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [trip.id]);

  const add = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.ItineraryItem.create({
        trip_id: trip.id,
        day,
        time,
        title: title.trim(),
        location: location.trim(),
        notes: notes.trim(),
        members: trip.members || [],
      });
      setItems((prev) => [...prev, created]);
      await logActivity({
        trip,
        type: 'itinerary_added',
        message: `${displayName(user)} added “${created.title}” to the itinerary`,
        actor: { id: user.id, name: displayName(user) },
        refId: created.id,
      });
      setOpen(false);
      setTitle('');
      setTime('');
      setLocation('');
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    await base44.entities.ItineraryItem.delete(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const grouped = items.reduce((acc, item) => {
    const key = item.day || 'Unscheduled';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">A shared plan for the days you are away.</p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add plan
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          Icon={MapPin}
          title="No plans yet"
          description="Add flights, dinners and day trips so everyone knows the shape of the trip."
          action={<Button size="sm" onClick={() => setOpen(true)}>Add the first plan</Button>}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([key, rows]) => (
            <section key={key}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {key === 'Unscheduled' ? 'Unscheduled' : formatDay(key)}
              </h3>
              <div className="space-y-2">
                {rows.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
                    <span className="num mt-0.5 w-14 shrink-0 text-xs text-muted-foreground">{item.time || '—'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.location ? <p className="text-xs text-muted-foreground">{item.location}</p> : null}
                      {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Add to the itinerary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="itin-title">What is happening</Label>
              <Input
                id="itin-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunset cruise"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="itin-day">Day</Label>
                <Input id="itin-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itin-time">Time</Label>
                <Input id="itin-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itin-location">Location (optional)</Label>
              <Input id="itin-location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itin-notes">Notes (optional)</Label>
              <Textarea id="itin-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={add} disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Adding…' : 'Add to itinerary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}