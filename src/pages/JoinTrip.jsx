import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plane,
  Sparkles,
  MapPin,
  QrCode,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function JoinTrip() {
  const { token } = useParams();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const [status, setStatus] = useState('joining'); // 'joining' | 'done' | 'error'
  const [message, setMessage] = useState('');
  const [tripName, setTripName] = useState('');
  const [tripId, setTripId] = useState('');
  const [myMemberId, setMyMemberId] = useState('');
  const [userUpi, setUserUpi] = useState('');
  const [savedUpi, setSavedUpi] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await base44.functions.invoke('joinTrip', { token });
        const data = response.data || {};
        if (cancelled) return;

        if (data.error) {
          setStatus('error');
          setMessage(data.error);
          return;
        }

        if (data.trip_name) {
          setTripName(data.trip_name);
        }

        if (data.trip_id) {
          setTripId(data.trip_id);
        }

        // Fetch user's member row in this trip so they can set their UPI right now
        try {
          const { user } = await base44.auth.me();
          if (user?.id && data.trip_id) {
            const memberList = await base44.entities.TripMember.filter({
              trip_id: data.trip_id,
              user_id: user.id,
            });
            if (memberList.items?.[0]) {
              setMyMemberId(memberList.items[0].id);
              setUserUpi(memberList.items[0].upi_id || user.upi_id || '');
            }
          }
        } catch {}

        setStatus('done');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error?.response?.data?.error || 'This invite link is invalid, expired, or has reached its limit.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveUpiAndGo = async () => {
    if (userUpi.trim() && myMemberId) {
      try {
        await base44.entities.TripMember.update(myMemberId, { upi_id: userUpi.trim() });
        base44.auth.updateMe({ upi_id: userUpi.trim() }).catch(() => {});
        setSavedUpi(true);
      } catch {}
    }
    navigate(`/trips/${tripId}`, { replace: true });
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Glow backdrop effect */}
        <div
          aria-hidden="true"
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />

        <div className="card-surface relative p-6 sm:p-8 text-center shadow-xl border-border/80 rounded-3xl">
          {status === 'joining' ? (
            <div className="space-y-4">
              {/* Animated Compass / Travel Icon */}
              <motion.div
                animate={shouldReduce ? {} : { rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-4 ring-primary/10"
              >
                <Compass className="h-8 w-8" />
              </motion.div>

              <div className="space-y-1.5 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Plane className="h-3 w-3 animate-pulse" />
                  Boarding pass detected
                </span>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  Joining your trip…
                </h1>
                <p className="text-sm text-muted-foreground">
                  Validating your invite token and connecting you to the travel crew.
                </p>
              </div>

              {/* Pulsing travel route indicator */}
              <div className="mx-auto flex items-center justify-center gap-2 pt-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                  <span className="block h-full w-1/2 rounded-full bg-primary animate-pulse" />
                </span>
                <MapPin className="h-4 w-4 text-[#2DD4BF]" />
              </div>
            </div>
          ) : status === 'done' ? (
            <div className="space-y-5 text-left">
              {/* Celebratory Checkmark Icon */}
              <div className="text-center space-y-2">
                <motion.div
                  initial={shouldReduce ? {} : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2DD4BF]/20 text-[#2DD4BF] ring-4 ring-[#2DD4BF]/15"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2DD4BF]/15 px-2.5 py-0.5 text-xs font-semibold text-[#2DD4BF]">
                    <Sparkles className="h-3 w-3" />
                    You're officially in!
                  </span>
                  <h1 className="font-heading text-2xl font-bold text-foreground">
                    {tripName ? `Welcome to ${tripName}` : 'Welcome aboard!'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    You've joined this shared ledger. Set your UPI ID now so trip mates can settle up and scan your QR code.
                  </p>
                </div>
              </div>

              {/* Member UPI ID configuration card */}
              <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF]">
                  <QrCode className="h-4 w-4" />
                  <span>Your UPI ID / QR (Optional)</span>
                </div>
                <Label htmlFor="join-upi" className="text-[0.7rem] text-muted-foreground">
                  Whenever someone owes you money on this trip, they can pay you in one tap.
                </Label>
                <Input
                  id="join-upi"
                  value={userUpi}
                  onChange={(e) => setUserUpi(e.target.value)}
                  placeholder="e.g. yourname@okaxis or 9876543210@upi"
                  className="h-10 rounded-xl font-mono text-xs bg-background/90"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <Button
                  onClick={saveUpiAndGo}
                  className="w-full h-11 rounded-xl font-semibold bg-[#D98264] hover:bg-[#C97254] text-white gap-2"
                >
                  <span>{savedUpi ? 'Saved! Entering trip…' : 'Enter Trip & Itinerary'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive ring-4 ring-destructive/10">
                <AlertTriangle className="h-8 w-8" />
              </div>

              <div className="space-y-1.5 pt-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  Invite Link Expired
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {message || 'This trip invitation is no longer active, invalid, or has already been used.'}
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto text-xs rounded-xl">
                  <Link to="/trips">My trips</Link>
                </Button>
                <Button asChild size="sm" className="w-full sm:w-auto text-xs gap-1.5 bg-[#D98264] text-white hover:bg-[#C97254] rounded-xl">
                  <Link to="/dashboard">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
