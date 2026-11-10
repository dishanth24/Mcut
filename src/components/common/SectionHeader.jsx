import React from 'react';
import { cn } from '@/lib/utils';

export default function SectionHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-heading tracking-tight sm:text-2xl">{title}</h2>
          {badge ? <span>{badge}</span> : null}
        </div>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
