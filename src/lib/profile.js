import { DEFAULT_CURRENCY } from '@/lib/money';

function profile(user) {
  return user?.data || user || {};
}

export function displayName(user) {
  const p = profile(user);
  return p.display_name || user?.full_name || (user?.email ? user.email.split('@')[0] : 'Traveller');
}

export function userCurrency(user) {
  return profile(user).currency || DEFAULT_CURRENCY;
}

export function userAvatar(user) {
  return profile(user).avatar_url || '';
}

export function userUpi(user) {
  return profile(user).upi_id || '';
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}