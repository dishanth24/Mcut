import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { displayName } from '@/lib/profile';

export default function InvitePanel({ trip, user }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.entities.TripInvite.filter({ trip_id: trip.id, revoked: false }, { sort: '-created_date', limit: 1 })
      .then((page) => {
        if (!cancelled) setInvite(page.items?.[0] || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  const createInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const token = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`).replace(/-/g, '');
      const record = await base44.entities.TripInvite.create({
        trip_id: trip.id,
        token,
        trip_name: trip.name,
        created_by_name: displayName(user),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        revoked: false,
        members: trip.members || [],
      });
      setInvite(record);
    } catch (err) {
      setError(err?.message || 'Could not create an invite link.');
    } finally {
      setLoading(false);
    }
  };

  const revoke = async () => {
    if (!invite) return;
    setLoading(true);
    try {
      await base44.entities.TripInvite.update(invite.id, { revoked: true });
      setInvite(null);
    } finally {
      setLoading(false);
    }
  };

  const link = invite ? `${window.location.origin}/join/${invite.token}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed — select the link and copy it manually.');
    }
  };

  return (
    <div className="card-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Link2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base">Invite people</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Anyone with this link can join the trip. Links expire after 7 days and can be revoked anytime.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {loading && !invite ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
          </div>
        ) : invite ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="h-10 min-w-0 flex-1 truncate rounded-lg border border-border bg-secondary/60 px-3 text-xs text-muted-foreground"
                aria-label="Invite link"
              />
              <Button size="sm" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <button
              type="button"
              onClick={revoke}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <RefreshCw className="h-3 w-3" /> Revoke this link and create a new one
            </button>
          </div>
        ) : (
          <Button onClick={createInvite} size="sm">
            Create invite link
          </Button>
        )}
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}