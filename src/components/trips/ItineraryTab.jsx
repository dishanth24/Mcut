import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Calendar,
} from 'lucide-react';
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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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
  const shouldReduce = useReducedMotion();

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
    // Optimistic delete with animation
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await base44.entities.ItineraryItem.delete(item.id);
    } catch {
      // Revert if failed
      setItems((prev) => [...prev, item]);
    }
  };

  const grouped = items.reduce((acc, item) => {
    const key = item.day || 'Unscheduled';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ── Subheader ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl tracking-tight sm:text-2xl">Trip Itinerary</h2>
          <p className="text-xs text-muted-foreground">
            A shared timeline for flights, dinners and sightseeing so everyone knows the shape of the trip.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-gradient-to-r from-[#D98264] to-[#C97254] text-white hover:opacity-95 border-0 shadow-xs gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add plan
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          Icon={MapPin}
          title="No plans scheduled yet"
          description="Add flights, dinner bookings and beach day trips so your crew is in sync."
          action={
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add the first plan
            </Button>
          }
        />
      ) : (
        <div className="space-y-8 relative pl-2 sm:pl-4">
          {/* Vertical dashed guide line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[1.1rem] sm:left-[1.6rem] top-3 bottom-3 w-px border-l border-dashed border-[#D98264]/40"
          />

          {Object.entries(grouped).map(([key, rows], dayIdx) => (
            <section key={key} className="space-y-3 relative z-10">
              {/* Day Header Badge */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#D98264] to-[#C97254] text-white text-xs font-bold shadow-xs">
                  {dayIdx + 1}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-xs">
                  <Calendar className="h-3 w-3 text-[#2DD4BF]" />
                  {key === 'Unscheduled' ? 'Unscheduled Plans' : formatDay(key)}
                </span>
              </div>

              {/* Day items list */}
              <div className="space-y-2.5 pl-9 sm:pl-10">
                <AnimatePresence mode="popLayout">
                  {rows.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.25 }}
                      className="group flex items-start justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-[#D98264]/40 hover:shadow-md transition-all"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.time ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">
                              <Clock className="h-2.5 w-2.5 text-[#D98264]" />
                              {item.time}
                            </span>
                          ) : null}

                          {item.location ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#2DD4BF]/10 px-2 py-0.5 text-[0.68rem] font-medium text-[#2DD4BF]">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[200px]">{item.location}</span>
                            </span>
                          ) : null}
                        </div>

                        <h4 className="font-heading text-base text-foreground leading-snug">
                          {item.title}
                        </h4>

                        {item.notes ? (
                          <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* Delete action */}
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive shrink-0"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Add Plan Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Add to itinerary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="itin-title">What is happening</Label>
              <Input
                id="itin-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunset cruise at Vagator Beach"
                className="h-11 rounded-xl"
                autoFocus
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="itin-day">Day</Label>
                <Input
                  id="itin-day"
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itin-time">Time</Label>
                <Input
                  id="itin-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itin-location">Location (optional)</Label>
              <Input
                id="itin-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Vagator, North Goa"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itin-notes">Notes (optional)</Label>
              <Textarea
                id="itin-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tickets booked, meeting at the shack at 5 PM"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              onClick={add}
              disabled={saving || !title.trim()}
              className="w-full sm:w-auto h-11 rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20 font-semibold"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? 'Adding plan…' : 'Add to itinerary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
