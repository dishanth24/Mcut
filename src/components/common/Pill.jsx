import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-[#D98264]/15 text-[#D98264] border-[#D98264]/30',
  teal: 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30',
  violet: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
  amber: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  success: 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  secondary: 'bg-secondary text-secondary-foreground border-border/60',
  outline: 'bg-transparent text-muted-foreground border-border',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[0.65rem] font-semibold',
  md: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-3 py-1.5 text-sm font-medium',
};

export default function Pill({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
  icon: Icon,
  dot = false,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.sm,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'teal' || variant === 'success' ? 'bg-[#2DD4BF] animate-pulse' :
            variant === 'primary' ? 'bg-[#D98264]' :
            variant === 'violet' ? 'bg-[#8B5CF6]' :
            variant === 'amber' ? 'bg-[#F59E0B]' :
            'bg-current'
          )}
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
