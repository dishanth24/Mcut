import React from 'react';
import { initials } from '@/lib/profile';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-[#D98264] to-[#F59E0B]', // terracotta -> amber
  'from-[#2DD4BF] to-[#059669]', // lagoon teal -> emerald
  'from-[#8B5CF6] to-[#EC4899]', // violet -> pink
  'from-[#3B82F6] to-[#06B6D4]', // blue -> cyan
  'from-[#F43F5E] to-[#FB923C]', // rose -> orange
  'from-[#A855F7] to-[#6366F1]', // purple -> indigo
];

function gradientFor(name = '') {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

export default function MemberAvatar({
  name = '',
  avatarUrl = '',
  size = 'md',
  className = '',
  showRing = true,
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[0.55rem]',
    sm: 'h-7 w-7 text-[0.62rem]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-14 w-14 text-base font-bold',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          'shrink-0 rounded-full object-cover shadow-xs',
          showRing && 'ring-2 ring-background',
          sizes[size],
          className
        )}
      />
    );
  }

  const grad = gradientFor(name);

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xs bg-gradient-to-br',
        showRing && 'ring-2 ring-background',
        grad,
        sizes[size],
        className
      )}
      aria-hidden="true"
      title={name}
    >
      {initials(name) || '?'}
    </span>
  );
}
