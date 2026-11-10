import { Link } from 'react-router-dom';
import { ArrowRight, SplitSquareHorizontal, Users, Calculator, PieChart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

const FEATURES = [
  {
    Icon: Users,
    title: 'Everyone in one ledger',
    body: 'Create a trip, share the invite link, and every expense lands in the same place for good.',
  },
  {
    Icon: SplitSquareHorizontal,
    title: 'Split the way it happened',
    body: 'Equal, exact amounts, percentages or shares — and only the people who actually joined in.',
  },
  {
    Icon: Calculator,
    title: 'Smart settle-up',
    body: 'Balances are worked out from the ledger, then reduced to the fewest practical transfers.',
  },
  {
    Icon: PieChart,
    title: 'Know where it went',
    body: 'Category breakdowns, budget progress and per-person totals, without touching a spreadsheet.',
  },
];

const STEPS = [
  { step: '01', title: 'Create the trip', body: 'Name it, pick the dates and the currency you will spend in.' },
  { step: '02', title: 'Log what you spend', body: 'Who paid, who joined, one receipt optional. Mcut keeps it exact.' },
  { step: '03', title: 'Settle once', body: 'See who owes whom, record the payment, and close the loop.' },
];

function LedgerPreview() {
  const rows = [
    { name: 'You', amount: '+2,100', positive: true },
    { name: 'Rohan', amount: '−1,240', positive: false },
    { name: 'Aanya', amount: '−860', positive: false },
  ];
  return (
    <div className="card-surface p-5 shadow-[0_30px_70px_-50px_rgba(40,39,36,0.55)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Goa in December</p>
          <p className="mt-1 font-heading text-xl">Trip balance</p>
        </div>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[0.65rem] font-medium text-success">Ongoing</span>
      </div>

      <div className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-secondary-foreground">
              {row.name.slice(0, 2)}
            </span>
            <span className="flex-1 text-sm">{row.name}</span>
            <span className={`num text-sm font-medium ${row.positive ? 'text-success' : 'text-destructive'}`}>
              ₹{row.amount}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-secondary/60 p-3">
        <p className="field-label">Settle up</p>
        <p className="mt-2 flex items-center justify-between text-sm">
          <span>Rohan pays you</span>
          <span className="num font-medium">₹1,240</span>
        </p>
        <p className="mt-1 flex items-center justify-between text-sm">
          <span>Aanya pays you</span>
          <span className="num font-medium">₹860</span>
        </p>
      </div>

      <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">A preview of a trip ledger</p>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
            M
          </span>
          <span className="font-heading text-xl tracking-tight">Mcut</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block">
            How it works
          </a>
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-12">
        <div>
          <p className="field-label">Trip expenses, settled</p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Split the trip,
            <br />
            <span className="italic text-primary">not the friendship.</span>
          </h1>
          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
            Flights on one card, dinner on another, the cab on someone else's. Mcut keeps a single honest ledger for
            the group — who paid, who joined in, and the one number that closes it out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Open your dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/register">
                    Start a trip <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </>
            )}
          </div>
          <ul className="mt-6 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-success" /> Amounts tracked to the last paisa
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-success" /> Only your trip mates can see your trips
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/70" aria-hidden="true" />
          <LedgerPreview />
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-lg leading-snug">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
        <p className="field-label">How it works</p>
        <h2 className="mt-3 max-w-xl text-3xl leading-tight sm:text-4xl">Three steps from airport to all square.</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.step} className="border-t border-border pt-5">
              <span className="num text-xs text-primary">{step.step}</span>
              <h3 className="mt-3 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-primary px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl text-3xl leading-tight text-primary-foreground sm:text-4xl">
            The trip is better than the maths. Let Mcut do the maths.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80">
            Create a trip, send the link, and start logging the moment someone pays for something.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                {isAuthenticated ? 'Go to dashboard' : 'Create your account'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[0.7rem] font-semibold text-primary-foreground">
              M
            </span>
            Mcut — split the trip, not the friendship.
          </span>
          <span>Amounts are tracked in the trip's own currency.</span>
        </div>
      </footer>
    </div>
  );
}