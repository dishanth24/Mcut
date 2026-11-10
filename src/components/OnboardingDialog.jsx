import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCY_LIST } from '@/lib/money';
import { displayName, userCurrency } from '@/lib/profile';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  User,
  Globe,
  SunMoon,
  Sun,
  Moon,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingDialog({ user }) {
  const { checkUserAuth } = useAuth();
  const { setMode } = useTheme();
  const shouldReduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('dark');
  const [saving, setSaving] = useState(false);

  const onboarded = Boolean(user?.data?.onboarded ?? user?.onboarded);

  useEffect(() => {
    if (user && !onboarded) {
      setName(displayName(user));
      setCurrency(userCurrency(user) || 'INR');
      setStep(1);
      setOpen(true);
    }
  }, [user?.id, onboarded]);

  const save = async (skip = false) => {
    setSaving(true);
    try {
      const patch = { onboarded: true };
      if (!skip) {
        patch.display_name = name.trim() || displayName(user);
        patch.currency = currency;
      }
      await base44.auth.updateMe(patch);
      if (!skip) {
        setMode(theme);
      }
      await checkUserAuth();
      setOpen(false);
    } catch {
      // Allow user to continue even if saving fails
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      save(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const stepVariants = {
    enter: (dir) => ({
      x: shouldReduce ? 0 : dir > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: shouldReduce ? 0 : dir > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) save(true);
      }}
    >
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-border/80 bg-card shadow-2xl">
        {/* Top Progress Bar & Header */}
        <div className="border-b border-border/50 bg-secondary/30 p-6 pb-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Welcome to Mcut
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Step {step} of 3
            </span>
          </div>

          {/* Step Dots / Progress Indicator */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  step === s
                    ? 'bg-primary'
                    : step > s
                    ? 'bg-[#2DD4BF]'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step Content Area */}
        <div className="p-6 pt-5 min-h-[290px] flex flex-col justify-between">
          <AnimatePresence custom={direction} mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    How should we address you?
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your name will appear on shared group expenses, itinerary notes, and settlement receipts.
                  </p>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 font-heading text-2xl font-bold text-primary">
                    {name ? name.slice(0, 1).toUpperCase() : <User className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="onboarding-name" className="text-xs font-medium">
                      Display Name
                    </Label>
                    <Input
                      id="onboarding-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      autoFocus
                      className="h-10 bg-background/50 focus:border-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    Preferred currency
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We'll use this currency for your personal dashboard totals and spend insights.
                  </p>
                </div>

                <div className="space-y-3 py-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-[#2DD4BF]" />
                      Base Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {CURRENCY_LIST.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="font-semibold">{c.code}</span> · {c.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Common pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-colors border',
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
                    Don't worry — individual trips can still track expenses in any foreign currency.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    Pick your vibe
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select how Mcut should look on this screen. You can change this anytime.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 py-2">
                  {[
                    { id: 'dark', label: 'Dark', Icon: Moon, note: 'Signature' },
                    { id: 'light', label: 'Light', Icon: Sun, note: 'Clean' },
                    { id: 'system', label: 'System', Icon: SunMoon, note: 'Auto' },
                  ].map((option) => {
                    const isSelected = theme === option.id;
                    const Icon = option.Icon;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme(option.id)}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-center',
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'border-border/70 bg-secondary/40 hover:bg-secondary/70 text-muted-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg mb-2',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {option.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {option.note}
                        </span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary mt-1 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
            {step === 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => save(true)}
                disabled={saving}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={saving}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={saving}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : step === 3 ? (
                <>
                  <span>Start planning</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
