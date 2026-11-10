export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', decimals: 2, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED', decimals: 2, locale: 'en-AE' },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2, locale: 'en-SG' },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, locale: 'en-AU' },
  CAD: { code: 'CAD', symbol: 'C$', decimals: 2, locale: 'en-CA' },
  CHF: { code: 'CHF', symbol: 'CHF', decimals: 2, locale: 'de-CH' },
  THB: { code: 'THB', symbol: '฿', decimals: 2, locale: 'th-TH' },
  MYR: { code: 'MYR', symbol: 'RM', decimals: 2, locale: 'ms-MY' },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, locale: 'ja-JP' },
  IDR: { code: 'IDR', symbol: 'Rp', decimals: 0, locale: 'id-ID' },
  VND: { code: 'VND', symbol: '₫', decimals: 0, locale: 'vi-VN' },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);
export const DEFAULT_CURRENCY = 'INR';

export function currencyOf(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

export function currencySymbol(code) {
  return currencyOf(code).symbol;
}

/** Convert a human typed amount into integer minor units. */
export function toMinor(amount, code = DEFAULT_CURRENCY) {
  const meta = currencyOf(code);
  const raw = typeof amount === 'string' ? amount.replace(/,/g, '').trim() : amount;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * Math.pow(10, meta.decimals));
}

/** Convert minor units back to a decimal number. */
export function toDecimal(minor, code = DEFAULT_CURRENCY) {
  return (Number(minor) || 0) / Math.pow(10, currencyOf(code).decimals);
}

export function formatDecimal(minor, code = DEFAULT_CURRENCY) {
  return toDecimal(minor, code).toFixed(currencyOf(code).decimals);
}

/** Format integer minor units as a currency string. */
export function formatMoney(minor, code = DEFAULT_CURRENCY) {
  const meta = currencyOf(code);
  const value = toDecimal(minor, code);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(value);
  } catch {
    return `${meta.symbol}${value.toFixed(meta.decimals)}`;
  }
}

/** Split total into `count` equal parts, giving the leftover minor units to the first parts. */
export function allocateEven(total, count) {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Split total proportionally by weights using the largest-remainder method. */
export function allocateByWeights(total, weights) {
  const sum = weights.reduce((a, b) => a + (Number(b) || 0), 0);
  if (sum <= 0) return allocateEven(total, weights.length);
  const raw = weights.map((w) => (total * (Number(w) || 0)) / sum);
  const parts = raw.map((v) => Math.floor(v));
  let remainder = total - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
    .map((o) => o.i);
  let k = 0;
  while (remainder > 0) {
    parts[order[k % order.length]] += 1;
    remainder -= 1;
    k += 1;
  }
  return parts;
}