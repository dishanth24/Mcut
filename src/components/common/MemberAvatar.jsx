import { initials } from '@/lib/profile';

const TINTS = [
  'bg-primary/15 text-primary',
  'bg-success/15 text-success',
  'bg-warning/20 text-warning',
  'bg-secondary text-secondary-foreground',
];

function tintFor(name = '') {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

export default function MemberAvatar({ name = '', size = 'md' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[0.6rem]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizes[size]} ${tintFor(name)}`}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}