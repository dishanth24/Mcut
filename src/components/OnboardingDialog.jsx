import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_LIST } from '@/lib/money';
import { displayName, userCurrency } from '@/lib/profile';

export default function OnboardingDialog({ user }) {
  const { checkUserAuth } = useAuth();
  const { setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('system');
  const [saving, setSaving] = useState(false);

  const onboarded = Boolean(user?.data?.onboarded ?? user?.onboarded);

  useEffect(() => {
    if (user && !onboarded) {
      setName(displayName(user));
      setCurrency(userCurrency(user));
      setOpen(true);
    }
  }, [user?.id, onboarded]);

  const save = async (skip) => {
    setSaving(true);
    try {
      const patch = { onboarded: true };
      if (!skip) {
        patch.display_name = name.trim() || displayName(user);
        patch.currency = currency;
      }
      await base44.auth.updateMe(patch);
      if (!skip) setMode(theme);
      await checkUserAuth();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) save(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Welcome to Mcut</DialogTitle>
          <DialogDescription>
            A few details so your trip mates recognise you and amounts show in the right currency.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-name">Display name</Label>
            <Input id="onboarding-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
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
          <div className="space-y-1.5">
            <Label>Appearance</Label>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'system'].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="capitalize"
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => save(true)} disabled={saving}>
            Skip for now
          </Button>
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Start planning'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}