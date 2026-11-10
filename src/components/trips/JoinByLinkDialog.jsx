import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Loader2, Clipboard, AlertCircle } from 'lucide-react';
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
      setChecking(false);
    }
  }, [open]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue(text.trim());
        setError('');
      }
    } catch {
      // Clipboard read permission might not be granted
    }
  };

  const join = () => {
    const raw = value.trim();
    if (!raw) {
      setError('Paste the invite link you were sent.');
      return;
    }
    const match = raw.match(/join\/([A-Za-z0-9]+)/);
    const token = match ? match[1] : raw;
    if (!/^[A-Za-z0-9]{6,}$/.test(token)) {
      setError('That does not look like a valid invite link.');
      return;
    }
    setChecking(true);
    navigate(`/join/${token}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Link2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Group Invite
            </span>
          </div>
          <DialogTitle className="font-heading text-2xl font-bold text-foreground">
            Join a trip
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste the invite link or token a travel mate shared with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="invite-input" className="text-xs font-medium">
            Invite URL or Code
          </Label>
          <div className="relative">
            <Input
              id="invite-input"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  join();
                }
              }}
              placeholder="https://mcut.app/join/abc123"
              className="h-10 pr-24 bg-background/50 focus:border-primary text-xs"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              className="absolute right-1 top-1 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <Clipboard className="h-3 w-3" />
              <span>Paste</span>
            </Button>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive pt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={join}
            disabled={checking || !value.trim()}
            size="sm"
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            {checking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Checking link…</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                <span>Join trip</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
