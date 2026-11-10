import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  interactive = false,
  onClick,
  ...props
}) {
  const shouldReduce = useReducedMotion();

  if (hoverEffect || interactive) {
    return (
      <motion.div
        whileHover={shouldReduce ? {} : { y: -3, transition: { duration: 0.2 } }}
        whileTap={shouldReduce ? {} : { scale: 0.98 }}
        onClick={onClick}
        className={cn(
          'glass-card p-5 cursor-pointer hover:border-[#D98264]/40 hover:shadow-md inner-border',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn('glass-card p-5 inner-border', className)} {...props}>
      {children}
    </div>
  );
}
