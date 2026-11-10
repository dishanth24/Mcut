import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

function FloatingSuitcaseSVG() {
  const shouldReduce = useReducedMotion();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 100"
      className="w-28 h-24 mx-auto"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Suitcase body */}
      <motion.rect
        x="15" y="30" width="90" height="60" rx="10"
        stroke="#D98264" strokeWidth="2.5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: shouldReduce ? 0 : [0, -5, 0] }}
        transition={shouldReduce ? { duration: 0.4 } : { opacity: { duration: 0.4 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }}
      />
      {/* Handle */}
      <motion.path
        d="M42 30 V20 Q60 12 78 20 V30"
        stroke="#D98264" strokeWidth="2.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      {/* Center band */}
      <motion.line
        x1="60" y1="30" x2="60" y2="90"
        stroke="#D98264" strokeWidth="1.5" strokeOpacity="0.4"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      {/* Latches */}
      <motion.rect x="51" y="55" width="18" height="10" rx="3" stroke="#D98264" strokeWidth="1.5" strokeOpacity="0.5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      />
      {/* Dashed route below */}
      <motion.path
        d="M20 96 Q40 88 60 96 Q80 104 100 96"
        stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.6"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
      />
      {/* Bobbing pin */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: shouldReduce ? 0 : [0, -4, 0] }}
        transition={shouldReduce ? { delay: 0.8 } : { opacity: { delay: 0.8 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 } }}
      >
        <path d="M60 76 Q60 82 56 86 Q60 88 64 86 Q60 82 60 76Z" fill="#2DD4BF" fillOpacity="0.8" />
        <circle cx="60" cy="76" r="4" fill="#2DD4BF" />
      </motion.g>
    </svg>
  );
}

export default function EmptyState({
  Icon,
  title,
  description,
  action,
  illustration = 'suitcase',
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center backdrop-blur-xs">
      {illustration === 'suitcase' && !Icon ? (
        <FloatingSuitcaseSVG />
      ) : Icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D98264]/10 text-[#D98264] border border-[#D98264]/20 shadow-xs">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
      ) : (
        <FloatingSuitcaseSVG />
      )}

      <h3 className="mt-3 font-heading text-lg tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}

      {action ? (
        <motion.div
          className="mt-6"
          animate={shouldReduce ? {} : { scale: [1, 1.03, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {action}
        </motion.div>
      ) : null}
    </div>
  );
}
