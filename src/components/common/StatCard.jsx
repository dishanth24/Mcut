import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TONES = {
  default: 'text-foreground',
  positive: 'text-[#2DD4BF]',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

const ACCENT_GRADIENTS = {
  negative: 'from-rose-500 to-red-400',
  positive: 'from-[#2DD4BF] to-emerald-400',
  orange: 'from-[#D98264] to-amber-400',
  neutral: 'from-slate-400 to-slate-500',
  violet: 'from-[#8B5CF6] to-indigo-400',
};

export default function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  accent = 'neutral',
  Icon,
  className = '',
  delay = 0,
}) {
  const shouldReduce = useReducedMotion();
  const accentKey = accent !== 'neutral' ? accent : (tone === 'negative' ? 'negative' : tone === 'positive' ? 'positive' : 'orange');
  const gradient = ACCENT_GRADIENTS[accentKey] || ACCENT_GRADIENTS.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={shouldReduce ? {} : { y: -3, transition: { duration: 0.2 } }}
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-shadow hover:shadow-md hover:border-border cursor-default',
        className
      )}
    >
      {/* 3px Top Accent Gradient */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', gradient)} />

      <div className="flex items-start justify-between gap-3">
        <span className="field-label text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          </span>
        ) : null}
      </div>

      <p className={cn('num mt-3 text-[1.65rem] font-semibold leading-none tracking-tight', TONES[tone] || '')}>
        {value}
      </p>

      {hint ? <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </motion.div>
  );
}
