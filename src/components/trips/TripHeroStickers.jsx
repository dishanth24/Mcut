import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Rich travel-themed hero graphics for the Trip Detail cover.
 * - Animated world-map dot grid, dashed flight arc, animated plane
 * - Topographic contour lines subtly in background
 * - Pill stickers: boarding pass, destination badge, vibe tag, ticket stub
 * - Floating SVG icons: compass, coin, pin, suitcase — all inline, no images
 * - Respects prefers-reduced-motion
 * - Visible at all sizes; scaled down on mobile
 */
export default function TripHeroStickers({ destination = '', status = 'upcoming' }) {
  const shouldReduce = useReducedMotion();

  const dest = destination ? destination.slice(0, 14).toUpperCase() : 'VACATION';

  /* ---- animation helpers ---- */
  const float = (delay = 0, dy = 6) =>
    shouldReduce
      ? {}
      : {
          animate: { y: [0, -dy, 0] },
          transition: { duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay },
        };

  const spin = (delay = 0) =>
    shouldReduce
      ? {}
      : {
          animate: { rotate: [0, 360] },
          transition: { duration: 20, repeat: Infinity, ease: 'linear', delay },
        };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 1 }}
    >
      {/* ════════════════════════════════════════════════
          LAYER 0 — full-bleed SVG background canvas
          World dot-grid + topo contours + flight arc + animated plane
      ════════════════════════════════════════════════ */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 260"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* gradient for arc */}
          <linearGradient id="flightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D98264" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7" />
          </linearGradient>
          {/* mask to fade dots at edges */}
          <radialGradient id="dotFade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="dotMask">
            <rect width="1000" height="260" fill="url(#dotFade)" />
          </mask>
          {/* plane path for animateMotion */}
          <path
            id="flightArc"
            d="M60,210 C200,80 400,220 600,100 C750,10 900,160 960,80"
          />
        </defs>

        {/* ── Dot-grid world map ── */}
        <g mask="url(#dotMask)" opacity="0.18">
          {Array.from({ length: 22 }, (_, row) =>
            Array.from({ length: 50 }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 20 + 10}
                cy={row * 12 + 6}
                r="1.5"
                fill="white"
              />
            ))
          )}
        </g>

        {/* ── Topographic contour lines ── */}
        <g opacity="0.09" stroke="white" strokeWidth="1.2">
          <path d="M-20,220 C120,180 280,240 450,200 C600,165 750,220 900,190 C960,180 980,170 1020,165" />
          <path d="M-20,195 C100,155 260,210 440,172 C595,138 748,196 895,165 C960,152 980,140 1020,132" />
          <path d="M-20,168 C90,130 255,185 430,145 C590,110 745,170 890,138 C958,125 980,112 1020,100" />
          <path d="M-20,140 C80,100 240,160 420,118 C585,82 742,145 885,110 C955,96 980,84 1020,72" />
          <path d="M-20,110 C70,72 230,135 410,92 C580,56 740,118 882,80 C952,66 978,56 1020,44" />
        </g>

        {/* ── Dashed flight arc ── */}
        <path
          d="M60,210 C200,80 400,220 600,100 C750,10 900,160 960,80"
          stroke="url(#flightGrad)"
          strokeWidth="2"
          strokeDasharray="8 10"
          opacity="0.65"
        >
          {!shouldReduce && (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-180"
              dur="6s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* ── Animated Plane along arc ── */}
        {!shouldReduce && (
          <g opacity="0.9">
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              rotate="auto"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href="#flightArc" />
            </animateMotion>
            {/* Plane icon */}
            <path
              d="M-9,0 L0,-4 L9,0 L0,2 Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="0" cy="0" r="3.5" fill="#2DD4BF" opacity="0.5" />
          </g>
        )}

        {/* ── Soft radial glow circles ── */}
        <circle cx="200" cy="130" r="80" fill="#D98264" opacity="0.07" />
        <circle cx="700" cy="80" r="100" fill="#2DD4BF" opacity="0.07" />
        <circle cx="950" cy="200" r="70" fill="#8B5CF6" opacity="0.1" />

        {/* ── Sparkle stars scattered ── */}
        <g fill="white" opacity="0.4">
          <circle cx="140" cy="60" r="1.5" />
          <circle cx="340" cy="40" r="1" />
          <circle cx="520" cy="180" r="1.5" />
          <circle cx="680" cy="55" r="1" />
          <circle cx="820" cy="195" r="1.5" />
          <circle cx="430" cy="90" r="1" />
          <circle cx="880" cy="130" r="1" />
        </g>
        <text x="150" y="50" fontSize="10" fill="white" opacity="0.4">✦</text>
        <text x="490" y="175" fontSize="8" fill="#2DD4BF" opacity="0.5">★</text>
        <text x="750" y="200" fontSize="10" fill="#D98264" opacity="0.4">✦</text>
      </svg>

      {/* ════════════════════════════════════════════════
          LAYER 1 — Floating SVG icons (compass, coin, pin, suitcase)
          Positioned in empty corners; visible from sm up
      ════════════════════════════════════════════════ */}

      {/* Compass — top-center */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20 hidden sm:block"
        {...spin(2)}
      >
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="17" stroke="white" strokeWidth="1.5" />
          <circle cx="19" cy="19" r="4" fill="white" opacity="0.4" />
          <polygon points="19,5 21,19 19,33 17,19" fill="#2DD4BF" opacity="0.9" />
          <polygon points="5,19 19,21 33,19 19,17" fill="#D98264" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Coin stack — left middle */}
      <motion.div
        className="absolute left-6 top-1/2 -translate-y-1/2 opacity-25 hidden md:block"
        {...float(1, 8)}
      >
        <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
          <ellipse cx="17" cy="32" rx="13" ry="4" fill="#F59E0B" opacity="0.5" />
          <ellipse cx="17" cy="26" rx="13" ry="4" fill="#F59E0B" opacity="0.6" />
          <ellipse cx="17" cy="20" rx="13" ry="4" fill="#FBBF24" opacity="0.7" />
          <ellipse cx="17" cy="14" rx="13" ry="4" fill="#FCD34D" opacity="0.9" />
          <text x="11" y="17" fontSize="7" fill="white" fontWeight="bold">₹</text>
        </svg>
      </motion.div>

      {/* Location pin — right top quarter */}
      <motion.div
        className="absolute right-16 top-6 opacity-25 hidden sm:block"
        {...float(0.5, 7)}
      >
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path
            d="M14 2C8.477 2 4 6.477 4 12C4 20 14 34 14 34C14 34 24 20 24 12C24 6.477 19.523 2 14 2Z"
            fill="#D98264"
            opacity="0.9"
          />
          <circle cx="14" cy="12" r="4" fill="white" opacity="0.8" />
        </svg>
      </motion.div>

      {/* Suitcase — bottom-right corner */}
      <motion.div
        className="absolute bottom-4 right-6 opacity-20 hidden md:block"
        {...float(1.5, 5)}
      >
        <svg width="38" height="34" viewBox="0 0 38 34" fill="none">
          <rect x="6" y="10" width="26" height="20" rx="4" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="13" y="6" width="12" height="6" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
          <line x1="19" y1="10" x2="19" y2="30" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="6" y1="20" x2="32" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
          {/* wheels */}
          <circle cx="12" cy="31" r="2" fill="white" opacity="0.5" />
          <circle cx="26" cy="31" r="2" fill="white" opacity="0.5" />
        </svg>
      </motion.div>

      {/* Receipt scroll — bottom-center */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 hidden lg:block"
        {...float(2, 6)}
      >
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <rect x="2" y="2" width="24" height="30" rx="3" stroke="#2DD4BF" strokeWidth="1.5" fill="none" />
          <line x1="7" y1="10" x2="21" y2="10" stroke="#2DD4BF" strokeWidth="1" />
          <line x1="7" y1="16" x2="21" y2="16" stroke="#2DD4BF" strokeWidth="1" />
          <line x1="7" y1="22" x2="17" y2="22" stroke="#2DD4BF" strokeWidth="1" />
          <text x="4" y="29" fontSize="6" fill="#2DD4BF" opacity="0.8">₹₹₹</text>
        </svg>
      </motion.div>

      {/* ════════════════════════════════════════════════
          LAYER 2 — Pill / badge stickers
          Always visible (removed mobile-hidden from key stickers)
      ════════════════════════════════════════════════ */}

      {/* Sticker A: Destination boarding tag — top-left */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.7, rotate: -15, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, rotate: -8, opacity: 1, y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
        className="absolute top-3 left-3 sm:top-5 sm:left-6 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm px-3 py-1.5 text-[0.68rem] sm:text-xs font-bold uppercase tracking-widest text-white shadow-lg"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF] animate-ping flex-shrink-0" />
        <span>✈ {dest}</span>
      </motion.div>

      {/* Sticker B: "APPROVED CREW" stamp — top-right */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.7, rotate: 12, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, rotate: 7, opacity: 1, y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-3 right-3 sm:top-5 sm:right-8 flex items-center gap-1 rounded-xl border-2 border-dashed border-white/40 bg-white/10 backdrop-blur-sm px-2.5 py-1 text-[0.65rem] sm:text-[0.7rem] font-extrabold text-white shadow-md"
      >
        <span className="text-amber-300">★</span>
        <span className="tracking-widest">APPROVED CREW</span>
      </motion.div>

      {/* Sticker C: Vibe tag — bottom center-right */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.7, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, opacity: 1, y: [0, -7, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-3 right-4 sm:bottom-5 sm:right-28 flex items-center gap-1.5 rounded-xl border border-white/25 bg-gradient-to-r from-[#D98264]/50 to-[#2DD4BF]/40 backdrop-blur-sm px-3 py-1.5 text-[0.65rem] sm:text-xs font-semibold text-white shadow-md"
      >
        <span>🏝️</span>
        <span className="font-heading italic">zero stress, fair cuts</span>
      </motion.div>

      {/* Sticker D: #MCUT-PASS ticket — bottom-left */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.8, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, opacity: 1, y: [0, 5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-16 flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 text-[0.65rem] sm:text-[0.7rem] font-medium text-white/90"
      >
        <span className="text-sm">🎟</span>
        <span className="font-semibold text-[#2DD4BF]">#MCUT-PASS</span>
      </motion.div>

      {/* Sticker E: Status tag — center-left (sm+) */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.7, opacity: 0, x: -10 }}
        animate={shouldReduce ? {} : { scale: 1, opacity: 1, x: 0, rotate: [-1, 1, -1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-5 hidden sm:flex items-center gap-1 rounded-lg border border-white/20 bg-[#8B5CF6]/30 backdrop-blur-sm px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white/90"
      >
        <span>⚡</span>
        <span>{status}</span>
      </motion.div>

      {/* ── Floating micro sparkles (scattered, always visible) ── */}
      <div className="absolute top-[35%] left-[38%] text-white/50 text-sm">✦</div>
      <div className="absolute top-[18%] right-[30%] text-[#2DD4BF]/60 text-xs">★</div>
      <div className="absolute bottom-[32%] left-[52%] text-[#D98264]/55 text-sm">✦</div>
      <div className="absolute top-[55%] right-[18%] text-white/40 text-xs hidden sm:block">◆</div>
      <div className="absolute top-[25%] left-[22%] text-[#F59E0B]/50 text-xs hidden md:block">★</div>
    </div>
  );
}
