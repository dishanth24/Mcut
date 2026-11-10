import { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  LogOut,
  Moon,
  Shield,
  Sun,
  SunMoon,
  User,
  AlertTriangle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { CURRENCY_LIST } from '@/lib/money';
import { displayName, userAvatar, userCurrency } from '@/lib/profile';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { user, checkUserAuth, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [name, setName] = useState(displayName(user));
  const [currency, setCurrency] = useState(userCurrency(user));
  const [avatar, setAvatar] = useState(userAvatar(user));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error'

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
      setStatusType('success');
      setStatus('Profile preferences saved successfully.');
      setTimeout(() => setStatus(''), 3500);
    } catch (error) {
      setStatusType('error');
      setStatus(error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setAvatar(file_url);
      await base44.auth.updateMe({ avatar_url: file_url });
      await checkUserAuth();
      setStatusType('success');
      setStatus('Profile photo updated.');
      setTimeout(() => setStatus(''), 3500);
    } catch (error) {
      setStatusType('error');
      setStatus(error?.message || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  };

  const THEME_OPTIONS = [
    {
      id: 'light',
      label: 'Light',
      Icon: Sun,
      description: 'Clean bright palette for daytime',
      preview: (
        <div className="h-16 w-full rounded-md border border-neutral-300 bg-neutral-100 p-2 shadow-inner">
          <div className="h-2 w-12 rounded-sm bg-neutral-300" />
          <div className="mt-1.5 flex gap-1">
            <div className="h-7 w-2/3 rounded-sm bg-white shadow-2xs" />
            <div className="h-7 w-1/3 rounded-sm bg-[#D98264]/20" />
          </div>
        </div>
      ),
    },
    {
      id: 'dark',
      label: 'Dark',
      Icon: Moon,
      description: 'Mcut signature dark charcoal theme',
      preview: (
        <div className="h-16 w-full rounded-md border border-neutral-800 bg-[#121316] p-2 shadow-inner">
          <div className="h-2 w-12 rounded-sm bg-neutral-700" />
          <div className="mt-1.5 flex gap-1">
            <div className="h-7 w-2/3 rounded-sm bg-[#1A1D24] shadow-2xs" />
            <div className="h-7 w-1/3 rounded-sm bg-[#D98264]/20 border border-[#D98264]/40" />
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      label: 'System',
      Icon: SunMoon,
      description: 'Follows your operating system',
      preview: (
        <div className="relative h-16 w-full overflow-hidden rounded-md border border-neutral-600 bg-gradient-to-r from-neutral-100 via-neutral-300 to-[#121316] p-2 shadow-inner">
          <div className="h-2 w-12 rounded-sm bg-neutral-400" />
          <div className="mt-1.5 flex gap-1">
            <div className="h-7 w-1/2 rounded-sm bg-white/90 shadow-2xs" />
            <div className="h-7 w-1/2 rounded-sm bg-[#1A1D24]/90 border border-neutral-700" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile identity, currency, and visual appearance."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <section className="card-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <User className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Profile Identity</h2>
                <p className="text-xs text-muted-foreground">
                  Visible to other members across your trips and expenses.
                </p>
              </div>
            </div>

            {/* Avatar Upload Area */}
            <div className="mt-5 flex items-center gap-5">
              <div className="relative group">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border/80 shadow-md">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-secondary font-heading text-2xl font-bold text-foreground">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  {/* Upload Overlay */}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-medium"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mb-0.5" />
                        <span>Change</span>
                      </>
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadAvatar}
                    disabled={uploading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  {uploading ? 'Uploading image…' : 'Upload photo'}
                </label>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  JPG, PNG or WebP. Max 5MB recommended.
                </p>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name" className="text-xs font-medium">
                  Display Name
                </Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full or preferred name"
                  className="h-10 bg-background/50 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings-email" className="text-xs font-medium text-muted-foreground">
                  Registered Email
                </Label>
                <Input
                  id="settings-email"
                  value={user?.email || ''}
                  disabled
                  className="h-10 bg-secondary/40 text-muted-foreground cursor-not-allowed text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Email authentication is linked to your Mcut user account.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <Button
              onClick={save}
              disabled={saving}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{saving ? 'Saving…' : 'Save Changes'}</span>
            </Button>

            {status && (
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium',
                  statusType === 'success' ? 'text-[#2DD4BF]' : 'text-destructive'
                )}
              >
                {statusType === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {status}
              </span>
            )}
          </div>
        </section>

        {/* Currency & Appearance Column */}
        <div className="space-y-6">
          {/* Currency Preferences Card */}
          <section className="card-surface p-5 sm:p-6">
            <div className="flex items-center gap-2.5 pb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2DD4BF]/15 text-[#2DD4BF]">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Preferred Currency</h2>
                <p className="text-xs text-muted-foreground">
                  Your baseline currency for summary analytics and dashboard cards.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10 bg-background/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-semibold text-foreground mr-1.5">{c.code}</span>
                      <span className="text-muted-foreground">({c.symbol})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Common:</span>
                {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium transition-colors border',
                      currency === code
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Note: Each trip preserves its own native transaction currency so group finances stay accurate.
              </p>
            </div>
          </section>

          {/* Appearance Card */}
          <section className="card-surface p-5 sm:p-6">
            <div className="flex items-center gap-2.5 pb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                <SunMoon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Appearance & Vibe</h2>
                <p className="text-xs text-muted-foreground">
                  Customize the theme palette on this device.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((option) => {
                const isSelected = mode === option.id;
                const Icon = option.Icon;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMode(option.id)}
                    className={cn(
                      'group relative flex flex-col text-left rounded-xl p-3 border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xs'
                        : 'border-border/70 bg-card-surface hover:border-border hover:bg-secondary/40'
                    )}
                  >
                    {option.preview}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Account & Danger Zone */}
      <section className="card-surface mt-6 p-5 sm:p-6 border-destructive/25 bg-destructive/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Account & Security</h2>
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>.
                Your data is encrypted and partitioned strictly to your trip groups.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors gap-2 text-xs"
            onClick={() => logout()}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of Mcut</span>
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <p className="leading-relaxed">
            To delete your account or purge historical personal information, contact the administrator.
            Shared trip ledgers and settled expenses preserve their historical integrity for other trip mates.
          </p>
        </div>
      </section>
    </>
  );
}
