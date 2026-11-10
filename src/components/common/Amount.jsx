import { formatMoney } from '@/lib/money';

const TONES = {
  default: '',
  positive: 'text-success',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

export default function Amount({ value = 0, currency = 'INR', tone = 'default', signed = false, className = '' }) {
  const safe = Number(value) || 0;
  const sign = signed && safe !== 0 ? (safe > 0 ? '+' : '−') : '';
  const body = formatMoney(Math.abs(safe), currency);
  return (
    <span className={`num ${TONES[tone] || ''} ${className}`}>
      {sign}
      {body}
    </span>
  );
}