import { useEffect, useState } from 'react';
import { LogOut, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { CURRENCY_LIST } from '@/lib/money';
import { displayName, userAvatar, userCurrency } from '@/lib/profile';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image } from '@/components/ui/image';

export default function Settings() {
  const { user, checkUserAuth, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [name, setName] = useState(displayName(user));
  const [currency, setCurrency] = useState(userCurrency(user));
  const [avatar, setAvatar] = useState(userAvatar(user));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setName(displayName(user));
    setCurrency(userCurrency(user));
    setAvatar(userAvatar(user));
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await base44.auth.updateMe({
        display_name: name.trim() || displayName(user),
        currency,
        avatar_url: avatar || '',
        onboarded: true,
      });
      await checkUserAuth();
      setStatus('Profile saved.');
    } catch (error) {
      setStatus(error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setAvatar(file_url);
      await base44.auth.updateMe({ avatar_url: file_url });
      await checkUserAuth();
      setStatus('Photo updated.');
    } catch (error) {
      setStatus(error?.message || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, your currency and how Mcut looks." />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-lg">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your name is what trip mates see on expenses, balances and in the trip chat.
          </p>

          <div className="mt-5 flex items-center gap-4">
            {avatar ? (
              <Image src={avatar} alt={name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-heading text-xl text-secondary-foreground">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Change photo'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Display name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
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
              <p className="text-xs text-muted-foreground">
                Used for your dashboard totals. Each trip keeps its own currency.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
              {status ? <span className="text-xs text-muted-foreground">{status}</span> : null}
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="text-lg">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose how Mcut looks on this device.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ].map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={mode === option.id ? 'default' : 'outline'}
                  onClick={() => setMode(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="text-lg">Account</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as {user?.email}. Your trips, expenses and settlements are visible only to people in the
              same trip.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              To have your account and its data deleted, contact the person who runs this app. Trips you share with
              other members keep their shared expense history.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}