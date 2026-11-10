import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  className = '',
  layoutId = 'segmentedPill',
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex items-center gap-1 rounded-xl border border-border/70 bg-secondary/60 p-1 backdrop-blur-xs',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.Icon && <opt.Icon className="h-3.5 w-3.5" />}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[0.65rem] font-semibold',
                  isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {opt.count}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId={shouldReduce ? undefined : layoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-lg bg-card shadow-xs border border-border/80"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
