import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, SplitSquareHorizontal, Users, Calculator, PieChart,
  Check, Menu, X, ChevronUp, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import {
  motion, AnimatePresence, useScroll, useSpring,
  useTransform, useMotionValue, useReducedMotion
} from 'framer-motion';

/* ─────────────────────── DATA ─────────────────────── */
const FEATURES = [
  {
    Icon: Users,
    title: 'Everyone in one ledger',
    body: 'Create a trip, share the invite link, and every expense lands in the same place for good.',
    accentBg: 'bg-[#D98264]/15',
    accentText: 'text-[#D98264]',
    borderHover: 'hover:border-[#D98264]/40 hover:shadow-[0_8px_30px_rgba(217,130,100,0.12)]',
  },
  {
    Icon: SplitSquareHorizontal,
    title: 'Split the way it happened',
    body: 'Equal, exact amounts, percentages or shares — and only the people who actually joined in.',
    accentBg: 'bg-[#2DD4BF]/15',
    accentText: 'text-[#2DD4BF]',
    borderHover: 'hover:border-[#2DD4BF]/40 hover:shadow-[0_8px_30px_rgba(45,212,191,0.12)]',
  },
  {
    Icon: Calculator,
    title: 'Smart settle-up',
    body: 'Balances are worked out from the ledger, then reduced to the fewest practical transfers.',
    accentBg: 'bg-[#D98264]/15',
    accentText: 'text-[#D98264]',
    borderHover: 'hover:border-[#D98264]/40 hover:shadow-[0_8px_30px_rgba(217,130,100,0.12)]',
  },
  {
    Icon: PieChart,
    title: 'Know where it went',
    body: 'Category breakdowns, budget progress and per-person totals, without touching a spreadsheet.',
    accentBg: 'bg-[#2DD4BF]/15',
    accentText: 'text-[#2DD4BF]',
    borderHover: 'hover:border-[#2DD4BF]/40 hover:shadow-[0_8px_30px_rgba(45,212,191,0.12)]',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Create the trip',
    body: 'Name it, pick the dates and the currency you will spend in. Share the secret invite link with your travel crew.',
    highlight: 'Takes 10 seconds',
  },
  {
    step: '02',
    title: 'Log what you spend',
    body: 'Who paid, who joined, one receipt optional. Custom splits, percentages or equal shares keep it completely honest.',
    highlight: 'Real-time sync',
  },
  {
    step: '03',
    title: 'Settle once',
    body: 'Mcut minimizes debts into the fewest possible payments. Mark paid and everyone is square.',
    highlight: 'Fewest transfers',
  },
];

const STATS = [
  { label: 'Settlement calculation', value: '< 1s', sub: 'Instant debt simplification' },
  { label: 'Currencies supported', value: '150+', sub: 'Track trips anywhere in the world' },
  { label: 'Private & secure', value: '100%', sub: 'Only your trip members see expenses' },
];

/* ─────────────────────── HERO BG: dot-grid + flight path ─────────────────────── */
function HeroBg({ isMobile }) {
  const shouldReduce = useReducedMotion();
  // The SVG flight path arc
  const pathD = 'M 60,220 Q 200,60 380,140 Q 480,180 520,100';
  const totalLen = 540; // approx path length

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 600 320"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.065 }}
    >
      {/* Dot grid */}
      <defs>
        <pattern id="heroGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" className="text-foreground" />
        </pattern>
        <radialGradient id="heroFade" cx="50%" cy="50%" r="55%">
          <stop offset="30%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="heroMask">
          <rect width="600" height="320" fill="url(#heroFade)" />
        </mask>
      </defs>
      <rect width="600" height="320" fill="url(#heroGrid)" mask="url(#heroMask)" />

      {/* Dashed curved flight path */}
      <path
        d={pathD}
        fill="none"
        stroke="#D98264"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        strokeLinecap="round"
        style={{ opacity: 0.6 }}
      />

      {/* Animated plane travelling along path */}
      {!shouldReduce && (
        <g style={{ opacity: 0.7 }}>
          {/* Use animateMotion to slide plane along the path */}
          <path
            d="M-5,-3 L5,0 L-5,3 L-2,0 Z"
            fill="#D98264"
          >
            <animateMotion
              dur={isMobile ? '0s' : '8s'}
              repeatCount="indefinite"
              rotate="auto"
              path={pathD}
            />
          </path>
        </g>
      )}

      {/* Topographic contour lines (subtle freeform curves) */}
      {!isMobile && (
        <>
          <path
            d="M 0,260 Q 80,240 160,255 Q 240,270 320,250 Q 400,230 480,245 Q 540,255 600,240"
            fill="none" stroke="#2DD4BF" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="4 8"
          />
          <path
            d="M 0,290 Q 100,275 200,285 Q 300,295 400,278 Q 480,265 600,270"
            fill="none" stroke="#2DD4BF" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 8"
          />
        </>
      )}
    </svg>
  );
}

/* Soft drifting outline icons — only on desktop */
function DriftingIcons() {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return null;

  const icons = [
    // coin
    { key: 'coin', el: <circle cx="12" cy="12" r="10" stroke="#D98264" strokeWidth="1.5" fill="none" />, w: 24, h: 24, style: { top: '12%', left: '6%' }, dur: 6 },
    // receipt
    {
      key: 'receipt',
      el: (
        <>
          <rect x="4" y="2" width="16" height="20" rx="2" stroke="#2DD4BF" strokeWidth="1.5" fill="none" />
          <line x1="8" y1="8" x2="16" y2="8" stroke="#2DD4BF" strokeWidth="1" />
          <line x1="8" y1="12" x2="16" y2="12" stroke="#2DD4BF" strokeWidth="1" />
          <line x1="8" y1="16" x2="13" y2="16" stroke="#2DD4BF" strokeWidth="1" />
        </>
      ),
      w: 24, h: 24, style: { top: '55%', left: '3%' }, dur: 7,
    },
    // location pin
    {
      key: 'pin',
      el: (
        <>
          <path d="M12 2C8.68 2 6 4.68 6 8c0 5 6 11 6 11s6-6 6-11c0-3.32-2.68-6-6-6Z" stroke="#D98264" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="8" r="2" stroke="#D98264" strokeWidth="1.2" fill="none" />
        </>
      ),
      w: 24, h: 24, style: { top: '20%', right: '5%' }, dur: 5,
    },
    // suitcase
    {
      key: 'suitcase',
      el: (
        <>
          <rect x="3" y="8" width="18" height="13" rx="2" stroke="#2DD4BF" strokeWidth="1.5" fill="none" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#2DD4BF" strokeWidth="1.5" fill="none" />
          <line x1="12" y1="11" x2="12" y2="17" stroke="#2DD4BF" strokeWidth="1" />
        </>
      ),
      w: 24, h: 24, style: { bottom: '14%', right: '7%' }, dur: 8,
    },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block">
      {icons.map(({ key, el, w, h, style, dur }) => (
        <motion.div
          key={key}
          className="absolute opacity-[0.06]"
          style={style}
          animate={{ y: [0, -8, 0], rotate: [0, 3, -2, 0] }}
          transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{el}</svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────── FEATURES BG ─────────────────────── */
function FeaturesBg() {
  const shouldReduce = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Dotted grid with edge fade */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
        <defs>
          <pattern id="featGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="currentColor" />
          </pattern>
          <radialGradient id="featFade" cx="50%" cy="50%" r="55%">
            <stop offset="20%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="featMask">
            <rect width="100%" height="100%" fill="url(#featFade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#featGrid)" mask="url(#featMask)" />
      </svg>

      {/* Moving gradient mesh blobs */}
      {!shouldReduce && (
        <>
          <motion.div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, #D98264 0%, transparent 70%)', filter: 'blur(80px)', opacity: 0.08 }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)', filter: 'blur(70px)', opacity: 0.07 }}
            animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </>
      )}
    </div>
  );
}

/* ─────────────────────── HOW IT WORKS: dotted route connector ─────────────────────── */
function RouteLine() {
  const { scrollYProgress } = useScroll();
  const shouldReduce = useReducedMotion();
  // pin travels 0→100% as scroll goes through the section
  const pinX = useTransform(scrollYProgress, [0.45, 0.65], ['0%', '100%']);

  return (
    <div aria-hidden="true" className="hidden sm:block absolute top-[4.5rem] left-0 right-0 h-0 pointer-events-none px-6">
      {/* Dashed line spanning the 3 step cards */}
      <div className="relative mx-auto max-w-6xl">
        <div
          className="absolute top-0 left-[16%] right-[16%] border-t-2 border-dashed border-[#D98264]/25"
          style={{ top: 0 }}
        />
        {/* Travelling pin dot */}
        {!shouldReduce && (
          <motion.div
            className="absolute -top-[5px] w-3 h-3 rounded-full bg-[#D98264] shadow-[0_0_8px_#D98264]"
            style={{ left: pinX, x: '-50%', translateX: '-50%' }}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── SECTION DIVIDER: ticket-tear ─────────────────────── */
function TicketTear({ flip = false }) {
  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden pointer-events-none"
      style={{ height: 20, transform: flip ? 'scaleY(-1)' : undefined }}
    >
      <svg viewBox="0 0 1200 20" preserveAspectRatio="none" className="w-full h-full">
        <path
          d={Array.from({ length: 60 }, (_, i) => {
            const x = i * 20;
            const y = i % 2 === 0 ? 0 : 20;
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
          }).join(' ') + ' L 1200,0 L 0,0 Z'}
          fill="hsl(var(--border))"
          fillOpacity="0.3"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────── CTA STICKER ─────────────────────── */
function Sticker({ children, className = '', delay = 0, rotate = 0 }) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute z-10 select-none whitespace-nowrap rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_0_2px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] ${className}`}
      style={{ rotate }}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      animate={shouldReduce ? {} : { y: [0, -5, 0] }}
      whileHover={shouldReduce ? {} : { scale: 1.12, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 12 } }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── CONFETTI burst (CSS-only, no canvas) ─────────────────────── */
function ConfettiBurst({ active }) {
  const shouldReduce = useReducedMotion();
  if (!active || shouldReduce) return null;
  const particles = Array.from({ length: 12 }, (_, i) => i);
  const colors = ['#D98264', '#2DD4BF', '#FF6B9D', '#A78BFA', '#FBBF24', '#34D399'];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {particles.map((i) => {
        const angle = (i / particles.length) * 360;
        const dist = 60 + Math.random() * 50;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist;
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-sm"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.3, rotate: angle * 2 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────── COUNT-UP ─────────────────────── */
function useCountUp(target, duration = 1200, startDelay = 0) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!started) return;
    if (shouldReduce) { setValue(target); return; }
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [started, target, duration, startDelay, shouldReduce]);

  return [value, () => setStarted(true)];
}

function AnimatedNumber({ value, prefix = '₹', suffix = '' }) {
  return <span className="num">{prefix}{value.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─────────────────────── LEDGER PREVIEW ─────────────────────── */
function LedgerPreview() {
  const shouldReduce = useReducedMotion();
  const [count1, startCount1] = useCountUp(2100, 1000, 300);
  const [count2, startCount2] = useCountUp(1240, 1000, 500);
  const [count3, startCount3] = useCountUp(860, 1000, 700);

  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 30 });

  useEffect(() => { startCount1(); startCount2(); startCount3(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback((e) => {
    if (shouldReduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [shouldReduce, mouseX, mouseY]);
  const handleMouseLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

  const rows = [
    { name: 'You', count: count1, positive: true, delay: 0 },
    { name: 'Rohan', count: count2, positive: false, delay: 0.15 },
    { name: 'Aanya', count: count3, positive: false, delay: 0.3 },
  ];
  const settleRows = [
    { from: 'Rohan pays you', amount: count2, delay: 0.5 },
    { from: 'Aanya pays you', amount: count3, delay: 0.65 },
  ];

  return (
    <motion.div
      ref={ref}
      style={shouldReduce ? {} : { rotateX, rotateY, transformPerspective: 800 }}
      animate={shouldReduce ? {} : { y: [0, -6, 0] }}
      transition={shouldReduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card-surface p-6 shadow-[0_30px_80px_-20px_rgba(217,130,100,0.25)] border-border/70 backdrop-blur-sm will-change-transform"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2DD4BF] animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium">Goa in December</p>
          </div>
          <p className="mt-1 font-heading text-xl">Trip balance</p>
        </div>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="rounded-full bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 px-2.5 py-0.5 text-[0.65rem] font-semibold text-[#2DD4BF]"
        >
          Ongoing
        </motion.span>
      </div>

      <div className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: row.delay + 0.1, duration: 0.4 }}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[0.7rem] font-bold text-secondary-foreground border border-border/50">
              {row.name.slice(0, 2)}
            </span>
            <span className="flex-1 text-sm font-medium">{row.name}</span>
            <span className={`num text-sm font-semibold ${row.positive ? 'text-[#2DD4BF]' : 'text-destructive'}`}>
              {row.positive ? '+' : '−'}<AnimatedNumber value={row.count} prefix="₹" />
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-5 rounded-xl border border-border/60 bg-secondary/60 p-3.5"
      >
        <p className="field-label flex items-center justify-between">
          <span>Smart Settle up</span>
          <span className="text-[0.65rem] font-medium text-[#2DD4BF]">2 transfers only</span>
        </p>
        {settleRows.map((row) => (
          <motion.p
            key={row.from}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: row.delay, duration: 0.35 }}
            className="mt-2 flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{row.from}</span>
            <span className="num font-semibold text-[#2DD4BF]"><AnimatedNumber value={row.amount} prefix="₹" /></span>
          </motion.p>
        ))}
      </motion.div>

      <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">Live preview of an active Mcut ledger</p>
    </motion.div>
  );
}

/* ─────────────────────── FLOATING CHIP ─────────────────────── */
function FloatingChip({ children, className = '', delay = 0 }) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute z-10 rounded-xl border border-border/80 bg-card/95 px-3 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={shouldReduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0, 4, 0] }}
      transition={shouldReduce ? { delay } : {
        opacity: { delay, duration: 0.4 },
        scale: { delay, duration: 0.4 },
        y: { delay: delay + 0.4, duration: 4.5 + delay, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ctaBurst, setCtaBurst] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Parallax for hero bg
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.3], [0, shouldReduce ? 0 : -40]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTop(window.scrollY > 400);
    };
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const handleCtaClick = useCallback((e) => {
    if (shouldReduce) return;
    e.preventDefault();
    setCtaBurst(true);
    setTimeout(() => {
      setCtaBurst(false);
      navigate(isAuthenticated ? '/dashboard' : '/register');
    }, 650);
  }, [shouldReduce, isAuthenticated, navigate]);

  /* Framer Motion variants */
  const wordVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const word = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
  const featureVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const featureCard = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
  const stepVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
  const stepItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
  const ctaWords = ['The', 'trip', 'is', 'better', 'than', 'the', 'maths.'];
  const ctaWord = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-[#D98264]/20 selection:text-[#D98264]">
      {/* Scroll progress bar */}
      {!shouldReduce && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#D98264] to-[#2DD4BF] origin-left z-50"
          style={{ scaleX }}
        />
      )}

      {/* ── Sticky Navbar ── */}
      <motion.header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'border-b border-border/60 bg-background/85 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
        initial={false}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.span
              whileHover={shouldReduce ? {} : { scale: 1.05, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D98264] to-[#C97254] text-base font-bold text-white shadow-md shadow-[#D98264]/20"
            >
              M
            </motion.span>
            <span className="font-heading text-xl tracking-tight group-hover:text-[#D98264] transition-colors duration-200">
              Mcut
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <a href="#features" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            {isAuthenticated ? (
              <Button asChild size="sm" className="ml-2 bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="ml-2 hover:bg-secondary">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-sm shadow-[#D98264]/25">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>

          <button
            className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-md sm:hidden"
            >
              <div className="flex flex-col gap-1 px-5 pb-5 pt-2">
                <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Features</a>
                <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">How it works</a>
                {isAuthenticated ? (
                  <Button asChild size="sm" className="mt-2 bg-[#D98264] hover:bg-[#C97254] text-white border-0">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm" className="mt-2 justify-start"><Link to="/login">Log in</Link></Button>
                    <Button asChild size="sm" className="bg-[#D98264] hover:bg-[#C97254] text-white border-0"><Link to="/register">Get started</Link></Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Hero Section ── */}
      <section className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-14 overflow-hidden">
        {/* Themed hero background */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ y: heroParallaxY }}
        >
          <HeroBg isMobile={isMobile} />
          {/* Soft radial glow blobs on top of SVG bg */}
          <div
            className="absolute -top-24 -left-20 h-96 w-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #D98264 0%, transparent 70%)', filter: 'blur(70px)' }}
          />
          <div
            className="absolute top-10 right-10 h-80 w-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)', filter: 'blur(60px)' }}
          />
        </motion.div>

        {/* Drifting outline icons — desktop only */}
        <DriftingIcons />

        <div className="relative z-10">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D98264]" />
            <span>Trip expenses, settled with zero awkwardness</span>
          </motion.div>

          <h1 className="mt-3 text-[2.7rem] leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.7rem]">
            <motion.span
              variants={shouldReduce ? {} : wordVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex flex-wrap gap-x-[0.3em]"
            >
              {['Split', 'the', 'trip,'].map((w) => (
                <motion.span key={w} variants={shouldReduce ? {} : word}>{w}</motion.span>
              ))}
            </motion.span>
            <br />
            <motion.span
              className="italic shimmer-text font-serif"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduce ? 0 : 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              not the friendship.
            </motion.span>
          </h1>

          <motion.p
            className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduce ? 0 : 0.5, duration: 0.5 }}
          >
            Flights on one card, dinner on another, the cab on someone else's. Mcut keeps a single honest ledger for
            the group — who paid, who joined in, and the one number that closes it out.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduce ? 0 : 0.6, duration: 0.5 }}
          >
            {isAuthenticated ? (
              <motion.div whileHover={shouldReduce ? {} : { y: -2 }} whileTap={shouldReduce ? {} : { scale: 0.97 }}>
                <Button asChild size="lg" className="bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/25 group">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    Open your dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div whileHover={shouldReduce ? {} : { y: -2 }} whileTap={shouldReduce ? {} : { scale: 0.97 }}>
                  <Button asChild size="lg" className="bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/25 group">
                    <Link to="/register" className="flex items-center gap-2">
                      Start a trip
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={shouldReduce ? {} : { y: -2 }} whileTap={shouldReduce ? {} : { scale: 0.97 }}>
                  <Button asChild size="lg" variant="outline" className="border-border/80 hover:bg-secondary">
                    <Link to="/login">I already have an account</Link>
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          <motion.ul
            className="mt-7 space-y-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduce ? 0 : 0.75, duration: 0.4 }}
          >
            {['Amounts tracked to the exact paisa & cent', 'End-to-end private: only invited trip mates can view'].map((txt) => (
              <li key={txt} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF]">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {txt}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Hero card */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: shouldReduce ? 0 : 0.3, duration: 0.6 }}
        >
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-secondary/50 blur-xl" aria-hidden="true" />
          <FloatingChip className="-top-5 -left-6 hidden sm:flex items-center gap-1.5" delay={0.8}>
            <span>🍽️</span><span>Dinner ₹2,400 paid by Rohan</span>
          </FloatingChip>
          <FloatingChip className="-bottom-4 -right-4 hidden sm:flex items-center gap-1.5" delay={1.1}>
            <span className="text-[#2DD4BF]">✓</span><span className="font-semibold text-[#2DD4BF]">Cab settled</span>
          </FloatingChip>
          <FloatingChip className="top-1/2 -right-8 hidden lg:flex items-center gap-1.5" delay={1.3}>
            <span>✈️</span><span>Flights split equally</span>
          </FloatingChip>
          <LedgerPreview />
        </motion.div>
      </section>

      {/* ── Ticket-tear divider ── */}
      <TicketTear />

      {/* ── Stats strip ── */}
      <section className="bg-secondary/20 py-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-5 sm:grid-cols-3 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="font-heading text-3xl text-foreground sm:text-4xl">
                <span className="text-[#D98264]">{stat.value}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ticket-tear divider (flipped) ── */}
      <TicketTear flip />

      {/* ── Features Section ── */}
      <section id="features" className="relative py-20 overflow-hidden">
        <FeaturesBg />
        <div className="relative mx-auto w-full max-w-6xl px-5">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="field-label text-[#D98264]">Features</p>
            <h2 className="mt-2 text-3xl font-heading sm:text-4xl">Everything a travel crew needs.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Built specifically for groups travelling together, not roommates splitting utility bills.</p>
          </div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={shouldReduce ? {} : featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {FEATURES.map(({ Icon, title, body, accentBg, accentText, borderHover }) => (
              <motion.div
                key={title}
                variants={shouldReduce ? {} : featureCard}
                whileHover={shouldReduce ? {} : { y: -4, transition: { duration: 0.2 } }}
                whileTap={shouldReduce ? {} : { scale: 0.97 }}
                className={`group rounded-2xl border border-border/80 bg-card p-6 transition-all duration-300 ${borderHover}`}
              >
                <motion.span
                  whileHover={shouldReduce ? {} : { scale: 1.1, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentBg} ${accentText} mb-5`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </motion.span>
                <h3 className="text-lg font-heading leading-snug">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative border-t border-border/70 bg-secondary/15 py-20 overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="max-w-xl">
            <p className="field-label text-[#D98264]">How it works</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl font-heading">
              Three steps from airport to all square.
            </h2>
          </div>

          {/* Route connector dots with travelling pin */}
          <div className="relative mt-12">
            <RouteLine />
            <motion.div
              className="grid gap-8 sm:grid-cols-3"
              variants={shouldReduce ? {} : stepVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {STEPS.map((step) => (
                <motion.div
                  key={step.step}
                  variants={shouldReduce ? {} : stepItem}
                  whileHover={shouldReduce ? {} : { y: -3 }}
                  whileTap={shouldReduce ? {} : { scale: 0.98 }}
                  className="relative rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm transition-colors hover:border-[#D98264]/40"
                >
                  {/* Pin dot at top of card for route line alignment */}
                  <div className="hidden sm:block absolute -top-[1.1rem] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#D98264]/50 bg-background" />
                  <div className="flex items-center justify-between">
                    <span className="num text-2xl font-heading font-semibold text-[#D98264]">{step.step}</span>
                    <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[0.65rem] font-medium text-[#2DD4BF]">
                      {step.highlight}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-heading">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Section — Gen Z vivid mesh gradient ── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-14"
          style={{
            /* vivid mesh: coral → hot-pink → violet → teal */
            background: 'linear-gradient(135deg, #D98264 0%, #E8637B 25%, #9B6CE8 60%, #2DD4BF 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.15) inset, 0 24px 60px -12px rgba(217,130,100,0.4)',
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated shifting gradient blob overlay */}
          {!shouldReduce && (
            <>
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full"
                style={{ background: 'radial-gradient(circle, #FF6B9D 0%, transparent 65%)', filter: 'blur(60px)', opacity: 0.5 }}
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full"
                style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 65%)', filter: 'blur(50px)', opacity: 0.5 }}
                animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              />
            </>
          )}

          {/* Grain overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px',
            }}
          />

          {/* Dark scrim to ensure text contrast (WCAG AA) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2rem] bg-black/30" />

          {/* Floating stickers — fewer on mobile */}
          <Sticker className="-top-3 left-[8%] sm:left-[12%] hidden sm:block" delay={0.3} rotate={-8}>
            ✈️ flights split
          </Sticker>
          <Sticker className="top-6 right-[6%] sm:right-[10%] hidden sm:block" delay={0.5} rotate={6}>
            📍 Goa 2025
          </Sticker>
          <Sticker className="-bottom-3 left-[15%] hidden sm:block" delay={0.7} rotate={4}>
            🧾 receipt saved
          </Sticker>
          <Sticker className="bottom-4 right-[8%]" delay={0.9} rotate={-5}>
            💬 who paid for the cab? 😅
          </Sticker>
          <Sticker className="top-[42%] -left-2 hidden lg:block" delay={1.1} rotate={-10}>
            ₹ settled ✨
          </Sticker>

          {/* Headline — word-by-word reveal */}
          <motion.h2
            className="relative mx-auto max-w-xl text-3xl leading-tight text-white sm:text-4xl font-heading"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
          >
            {ctaWords.map((w) => (
              <motion.span key={w} variants={shouldReduce ? {} : ctaWord} className="inline-block mr-[0.25em]">{w}</motion.span>
            ))}
            {' '}
            {/* Mcut underlined */}
            <motion.span
              variants={shouldReduce ? {} : ctaWord}
              className="inline-block relative"
            >
              Let{' '}
              <span className="relative">
                Mcut
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 60 8"
                  preserveAspectRatio="none"
                  height="8"
                >
                  <path
                    d="M2,6 Q15,1 30,5 Q45,9 58,4"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {' '}do the maths.
            </motion.span>
          </motion.h2>

          <motion.p
            className="relative mx-auto mt-4 max-w-md text-sm text-white/90 leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Create a trip, send the invite link, and log the very first meal. No more post-trip arguments over receipts.
          </motion.p>

          {/* CTA button with shine + confetti */}
          <motion.div
            className="relative mt-8 flex flex-wrap justify-center gap-3.5"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="relative">
              <ConfettiBurst active={ctaBurst} />
              <motion.button
                onClick={handleCtaClick}
                whileHover={shouldReduce ? {} : { scale: 1.04 }}
                whileTap={shouldReduce ? {} : { scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#1a1512] shadow-xl"
              >
                {/* Moving shine sweep */}
                {!shouldReduce && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    }}
                    animate={{ translateX: ['−100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                  />
                )}
                <span>{isAuthenticated ? 'Go to dashboard' : 'Create your account'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#D98264] text-[0.7rem] font-bold text-white">M</span>
            Mcut — split the trip, not the friendship.
          </span>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Create account</Link>
            <span className="text-muted-foreground/60">•</span>
            <span>Amounts tracked in the trip's own currency.</span>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#D98264] text-white shadow-lg hover:bg-[#C97254] transition-colors"
            aria-label="Back to top"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
