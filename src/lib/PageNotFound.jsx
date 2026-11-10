import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Compass, Sparkles, MapPinOff, ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background overflow-hidden">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D98264]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#2DD4BF]/10 blur-3xl"
      />

      <div className="card-surface relative max-w-lg w-full p-8 sm:p-10 text-center shadow-2xl border-border/80">
        {/* Animated Travel Compass / Lost Path Illustration */}
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          {/* Outer compass ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_25s_linear_infinite]" />
          
          {/* Subtle teal radar glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/15 via-[#2DD4BF]/10 to-transparent" />

          {/* Center Lost Trip Graphic */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-lg ring-4 ring-primary/10">
            <MapPinOff className="h-8 w-8 stroke-[1.8]" />
          </div>

          {/* Floating itinerary dots */}
          <span className="absolute -top-1 right-2 flex h-3 w-3 items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-[#2DD4BF] animate-ping" />
          </span>
          <span className="absolute bottom-2 -left-1">
            <Sparkles className="h-4 w-4 text-warning animate-pulse" />
          </span>
        </div>

        {/* 404 Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Compass className="h-3.5 w-3.5" />
          <span>Error 404 · Route Not Found</span>
        </div>

        {/* Headline & Subtext */}
        <div className="mt-4 space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Looks like this stop isn't on the itinerary.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            The page <span className="font-medium text-foreground">"{pageName || 'requested'}"</span> drifted off the map or does not exist in this expedition.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-5 h-10 shadow-sm"
          >
            <Link to="/">
              <Compass className="h-4 w-4" />
              <span>Back to safe travels</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-1.5 text-xs h-10 border-border/80 hover:bg-secondary/70"
          >
            <Link to="/trips">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>My Trips</span>
            </Link>
          </Button>
        </div>

        {/* Admin Note */}
        {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
          <div className="mt-8 p-3.5 rounded-xl border border-warning/30 bg-warning/5 text-left text-xs">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warning/20">
                <div className="h-1.5 w-1.5 rounded-full bg-warning" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Admin Diagnostic</p>
                <p className="text-muted-foreground leading-relaxed">
                  Route <code className="rounded bg-secondary/80 px-1 py-0.5 text-foreground font-mono">/{pageName}</code> is currently unhandled by the React router tree.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
