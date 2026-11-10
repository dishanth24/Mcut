import React, { useEffect, useState } from 'react';
import { Check, Copy, Link2, Loader2, RefreshCw, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { displayName } from '@/lib/profile';
import { motion, useReducedMotion } from 'framer-motion';

export default function InvitePanel({ trip, user }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const shouldReduce = useReducedMotion();

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
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setError('Copy failed — select the link and copy it manually.');
    }
  };

  return (
    <div className="card-surface p-5 sm:p-6 border-border/80">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/20 shadow-xs">
          <Link2 className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="space-y-1">
          <h3 className="font-heading text-lg tracking-tight">Invite travel mates</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anyone with this link can join the trip and log expenses. Links are active for 7 days.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading && !invite ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#D98264]" /> Preparing invite token…
          </div>
        ) : invite ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="h-11 min-w-0 flex-1 truncate rounded-xl border border-border/80 bg-secondary/50 px-3.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Invite link"
              />

              {/* Morphing Copy / Check Button */}
              <motion.div
                whileHover={shouldReduce ? {} : { scale: 1.03 }}
                whileTap={shouldReduce ? {} : { scale: 0.95 }}
              >
                <Button
                  size="sm"
                  onClick={copy}
                  className={`h-11 px-4 rounded-xl font-semibold gap-1.5 transition-all ${
                    copied
                      ? 'bg-[#2DD4BF] text-slate-900 hover:bg-[#2DD4BF]/90'
                      : 'bg-[#D98264] hover:bg-[#C97254] text-white'
                  }`}
                >
                  <motion.span
                    key={copied ? 'copied' : 'copy'}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-1.5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied ✓' : 'Copy link'}</span>
                  </motion.span>
                </Button>
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={revoke}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Revoke link & create new
              </button>
              <span className="text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#2DD4BF]" /> Private link
              </span>
            </div>
          </div>
        ) : (
          <Button
            onClick={createInvite}
            className="h-11 rounded-xl bg-gradient-to-r from-[#D98264] to-[#C97254] text-white hover:opacity-95 border-0 shadow-xs font-semibold px-5"
          >
            Create invite link
          </Button>
        )}
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
