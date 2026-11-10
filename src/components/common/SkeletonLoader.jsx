import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className = '' }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-5 space-y-4 animate-pulse', className)}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded-md bg-secondary" />
        <div className="h-6 w-16 rounded-full bg-secondary" />
      </div>
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-md bg-secondary" />
        <div className="h-3.5 w-48 rounded-md bg-secondary/70" />
      </div>
      <div className="h-10 w-full rounded-xl bg-secondary/50 pt-2" />
    </div>
  );
}

export function SkeletonTripCard({ className = '' }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse', className)}>
      <div className="h-28 w-full bg-secondary/80" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-md bg-secondary" />
          <div className="h-5 w-16 rounded-full bg-secondary" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-24 rounded-md bg-secondary/70" />
          <div className="h-6 w-16 rounded-md bg-secondary/70" />
        </div>
        <div className="space-y-2 border-t border-border/50 pt-3">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded-md bg-secondary/60" />
            <div className="h-4 w-20 rounded-md bg-secondary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityRow() {
  return (
    <div className="flex items-center gap-3.5 px-2 py-3 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-md bg-secondary" />
        <div className="h-3 w-1/3 rounded-md bg-secondary/60" />
      </div>
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 animate-pulse">
          <div className="h-3.5 w-20 rounded-md bg-secondary" />
          <div className="h-7 w-28 rounded-md bg-secondary" />
          <div className="h-3 w-36 rounded-md bg-secondary/60" />
        </div>
      ))}
    </div>
  );
}
