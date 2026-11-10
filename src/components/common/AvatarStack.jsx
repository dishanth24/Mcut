import React from 'react';
import MemberAvatar from '@/components/common/MemberAvatar';
import { cn } from '@/lib/utils';

export default function AvatarStack({
  members = [],
  max = 3,
  size = 'sm',
  className = '',
}) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  const badgeSizes = {
    xs: 'h-6 w-6 text-[0.55rem]',
    sm: 'h-7 w-7 text-[0.62rem]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((m, i) => {
        const name = typeof m === 'string' ? m : m.user_name || m.name || m.email || '';
        const avatarUrl = typeof m === 'object' ? m.avatar_url : '';
        return (
          <div key={m.user_id || m.id || i} className="relative transition-transform hover:z-10 hover:scale-110">
            <MemberAvatar name={name} avatarUrl={avatarUrl} size={size} showRing />
          </div>
        );
      })}
      {remaining > 0 && (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground ring-2 ring-background text-muted-foreground',
            badgeSizes[size] || badgeSizes.sm
          )}
          title={`${remaining} more member${remaining === 1 ? '' : 's'}`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
