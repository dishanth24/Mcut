import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Playful travel & trip stickers matching Mcut brand:
 * - Stamps, passport marks, flight route, cute beach & coin badges
 * - Subtle floating animations, responsive scaling for mobile & tablet
 */
export default function TripHeroStickers({ destination = '', status = 'upcoming' }) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-10"
    >
      {/* ── Background topographic contour & flight curve ── */}
      <svg
        className="absolute inset-0 h-full w-full opacity-15"
        viewBox="0 0 1000 240"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M-50,180 C180,60 380,240 600,100 C780,-10 920,120 1080,40"
          stroke="url(#stickerGlowGradient)"
          strokeWidth="2.5"
          strokeDasharray="6 8"
        />
        <defs>
          <linearGradient id="stickerGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D98264" />
            <stop offset="50%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Sticker 1: Boarding Stamp (Top Left) ── */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.8, rotate: -12, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, rotate: -8, opacity: 1, y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-3 left-4 sm:top-5 sm:left-8 hidden xs:flex items-center gap-1.5 rounded-full border border-white/30 bg-black/25 backdrop-blur-md px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-lg shadow-black/20"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF] animate-ping" />
        <span>✈ {destination ? destination.slice(0, 14) : 'VACATION'}</span>
      </motion.div>

      {/* ── Sticker 2: Passport Verified Badge (Top Right) ── */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.8, rotate: 10, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, rotate: 6, opacity: 1, y: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-3 right-4 sm:top-5 sm:right-10 flex items-center gap-1 rounded-2xl border-2 border-dashed border-white/35 bg-white/10 backdrop-blur-md px-2.5 py-1 text-[0.68rem] font-extrabold text-white shadow-md shadow-black/20"
      >
        <span className="text-amber-300">★</span>
        <span className="tracking-wide">APPROVED CREW</span>
      </motion.div>

      {/* ── Sticker 3: Fun Vibe Tag (Center Right) ── */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.7, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, opacity: 1, y: [0, -6, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-4 right-12 sm:bottom-6 sm:right-32 hidden sm:flex items-center gap-1.5 rounded-xl border border-white/25 bg-gradient-to-r from-[#D98264]/40 to-[#2DD4BF]/30 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-md"
      >
        <span>🏝️</span>
        <span className="font-heading italic">zero stress, fair cuts</span>
      </motion.div>

      {/* ── Sticker 4: Ticket Stub / Days Left (Bottom Left) ── */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 0.8, opacity: 0 }}
        animate={shouldReduce ? {} : { scale: 1, opacity: 1, y: [0, 4, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute bottom-3 left-6 sm:bottom-5 sm:left-24 flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/30 backdrop-blur-md px-2.5 py-1 text-[0.7rem] font-medium text-white/90"
      >
        <span className="text-xs">🎟</span>
        <span className="num font-semibold text-[#2DD4BF]">#MCUT-PASS</span>
      </motion.div>

      {/* ── Floating micro sparkles ── */}
      <div className="absolute top-1/2 left-1/3 text-white/40 text-sm hidden md:block">✦</div>
      <div className="absolute top-1/4 right-1/4 text-[#2DD4BF]/50 text-xs hidden md:block">★</div>
      <div className="absolute bottom-1/3 left-1/2 text-[#D98264]/50 text-sm hidden md:block">✦</div>
    </div>
  );
}
