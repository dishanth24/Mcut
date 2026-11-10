import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MemberAvatar from '@/components/common/MemberAvatar';
import InvitePanel from '@/components/trips/InvitePanel';

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member' };

export default function MembersTab({ trip, members, user, onReload }) {
  const myRow = members.find((m) => m.user_id === user?.id);
  const [upi, setUpi] = useState(myRow?.upi_id || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canInvite = trip.created_by_id === user?.id || myRow?.role === 'owner' || myRow?.role === 'admin';

  const saveUpi = async () => {
    if (!myRow) return;
    setSaving(true);
    try {
      await base44.entities.TripMember.update(myRow.id, { upi_id: upi.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onReload?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {canInvite ? <InvitePanel trip={trip} user={user} /> : null}

      <div className="card-surface divide-y divide-border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3">
            <MemberAvatar name={member.user_name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.user_name}
                {member.user_id === user?.id ? ' (you)' : ''}
              </p>
              <p className="truncate text-xs text-muted-foreground">{member.user_email || 'Trip member'}</p>
            </div>
            <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{ROLE_LABEL[member.role] || 'Member'}</Badge>
          </div>
        ))}
        {members.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No members yet.</p>
        ) : null}
      </div>

      {myRow ? (
        <div className="card-surface p-5">
          <h3 className="text-base">Your UPI ID</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. When someone settles up with you, Mcut can show your UPI ID and open a payment app link.
            Only trip members see it.
          </p>
          <div className="mt-3 flex gap-2">
            <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" className="flex-1" />
            <Button onClick={saveUpi} disabled={saving || upi.trim() === (myRow.upi_id || '')}>
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}