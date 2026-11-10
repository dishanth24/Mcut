import React, { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pill from '@/components/common/Pill';
import MemberAvatar from '@/components/common/MemberAvatar';
import InvitePanel from '@/components/trips/InvitePanel';
import UpiQrDialog from '@/components/common/UpiQrDialog';
import { motion, useReducedMotion } from 'framer-motion';

const ROLE_CONFIG = {
  owner: { label: 'Owner', variant: 'primary' },
  admin: { label: 'Admin', variant: 'violet' },
  member: { label: 'Member', variant: 'secondary' },
};

function UpiChip({ upiId, userName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/60 px-2 py-0.5 text-xs text-foreground hover:bg-secondary transition-colors"
        title="Click to copy UPI ID"
      >
        <span className="font-mono text-[0.7rem] text-[#2DD4BF]">{upiId}</span>
        <motion.span
          key={copied ? 'copied' : 'copy'}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
        >
          {copied ? (
            <Check className="h-3 w-3 text-[#2DD4BF]" />
          ) : (
            <Copy className="h-2.5 w-2.5 text-muted-foreground" />
          )}
        </motion.span>
      </button>

      {/* Instant QR Viewer Modal trigger */}
      <UpiQrDialog
        upiId={upiId}
        name={userName}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-1.5 py-0.5 text-[0.65rem] font-bold text-[#2DD4BF] hover:bg-[#2DD4BF]/20 transition-colors"
            title="Scan QR to pay"
          >
            <QrCode className="h-3 w-3" />
            <span>QR</span>
          </button>
        }
      />
    </div>
  );
}

export default function MembersTab({ trip, members, user, onReload }) {
  const myRow = members.find((m) => m.user_id === user?.id);
  const [upi, setUpi] = useState(myRow?.upi_id || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const shouldReduce = useReducedMotion();
  const canInvite = trip.created_by_id === user?.id || myRow?.role === 'owner' || myRow?.role === 'admin';

  const saveUpi = async () => {
    if (!myRow) return;
    setSaving(true);
    try {
      await base44.entities.TripMember.update(myRow.id, { upi_id: upi.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
      onReload?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Invite Panel ── */}
      {canInvite ? <InvitePanel trip={trip} user={user} /> : null}

      {/* ── Members Avatar Cards Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg tracking-tight">
            Trip Members ({members.length})
          </h3>
          <span className="text-xs text-muted-foreground">Tap QR to scan and pay instantly</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((member, i) => {
            const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const isMe = member.user_id === user?.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduce ? 0 : i * 0.05 }}
                className="card-surface p-4 flex flex-col justify-between gap-3 border-border/80 hover:border-[#D98264]/40 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar name={member.user_name} size="md" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span>{member.user_name}</span>
                        {isMe && (
                          <span className="rounded-md bg-secondary px-1.5 py-0.2 text-[0.65rem] text-muted-foreground font-medium">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.user_email || 'Trip member'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Pill variant={roleConf.variant} size="sm">
                      {roleConf.label}
                    </Pill>
                  </div>
                </div>

                {/* Member UPI ID & QR Code */}
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs">
                  {member.upi_id ? (
                    <UpiChip upiId={member.upi_id} userName={member.user_name} />
                  ) : (
                    <span className="text-[0.7rem] text-muted-foreground italic">
                      {isMe ? 'Add your UPI below so friends can scan and pay' : 'No UPI added yet'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {members.length === 0 ? (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">
            No members in this trip yet.
          </div>
        ) : null}
      </div>

      {/* ── Your UPI ID Settings Card with Live QR Preview ── */}
      {myRow ? (
        <div className="card-surface p-5 sm:p-6 border-border/80 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2DD4BF]/15 text-[#2DD4BF] ring-2 ring-[#2DD4BF]/20">
                <QrCode className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h3 className="font-heading text-lg tracking-tight">Your UPI ID & Payment QR</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  When someone settles up with you on Mcut, they can scan your UPI QR code or tap to pay directly in their UPI app.
                </p>
              </div>
            </div>

            {upi.trim() && (
              <div className="shrink-0">
                <UpiQrDialog
                  upiId={upi.trim()}
                  name={user?.user_metadata?.name || user?.email || 'You'}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-[#2DD4BF]/50 text-[#2DD4BF] hover:bg-[#2DD4BF]/10 text-xs gap-1.5 h-9"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Preview My QR</span>
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <Input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="e.g. rohan@okaxis, yourname@upi or 9876543210@paytm"
              className="h-11 rounded-xl flex-1 font-mono text-xs focus-visible:ring-[#2DD4BF]"
            />
            <Button
              onClick={saveUpi}
              disabled={saving || upi.trim() === (myRow.upi_id || '')}
              className={`h-11 rounded-xl px-5 font-semibold transition-all ${
                saved ? 'bg-[#2DD4BF] text-slate-900' : 'bg-[#D98264] hover:bg-[#C97254] text-white'
              }`}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save UPI ID'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
