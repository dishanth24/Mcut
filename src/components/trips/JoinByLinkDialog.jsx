import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Loader2 } from 'lucide-react';
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

export default function JoinByLinkDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  const join = () => {
    const raw = value.trim();
    if (!raw) {
      setError('Paste the invite link you were sent.');
      return;
    }
    const match = raw.match(/join\/([A-Za-z0-9]+)/);
    const token = match ? match[1] : raw;
    if (!/^[A-Za-z0-9]{6,}$/.test(token)) {
      setError('That does not look like an invite link.');
      return;
    }
    setChecking(true);
    navigate(`/join/${token}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Join a trip</DialogTitle>
          <DialogDescription>Paste the invite link a friend sent you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="invite-input">Invite link</Label>
          <Input
            id="invite-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://…/join/abc123"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={join} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Join trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}