import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

const TONES = {
  default: 'text-foreground',
  positive: 'text-[#2DD4BF] font-semibold',
  negative: 'text-destructive font-semibold',
  muted: 'text-muted-foreground',
  neutral: 'text-foreground font-medium',
};

export default function Amount({
  value = 0,
  currency = 'INR',
  tone = 'default',
  signed = false,
  className = '',
}) {
  const safe = Number(value) || 0;
  const sign = signed && safe !== 0 ? (safe > 0 ? '+' : '−') : '';
  const body = formatMoney(Math.abs(safe), currency);

  return (
    <span className={cn('num tracking-tight', TONES[tone] || '', className)}>
      {sign}
      {body}
    </span>
  );
}
