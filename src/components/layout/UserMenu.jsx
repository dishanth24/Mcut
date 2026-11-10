import React from 'react';
import { LogOut, Settings as SettingsIcon, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { displayName, userAvatar } from '@/lib/profile';
import MemberAvatar from '@/components/common/MemberAvatar';

export default function UserMenu({ user, compact = false }) {
  const { logout } = useAuth();
  const name = displayName(user);
  const avatar = userAvatar(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            compact
              ? 'h-10 w-10 rounded-full p-0 hover:bg-secondary'
              : 'h-auto w-full justify-start gap-3 rounded-2xl p-2.5 hover:bg-card border border-transparent hover:border-border/60 transition-all'
          }
        >
          <MemberAvatar name={name} avatarUrl={avatar} size="md" />
          {!compact ? (
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg">
        <DropdownMenuLabel className="font-normal px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl px-2.5 py-2">
          <Link to="/settings" className="flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4" strokeWidth={1.75} /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-2.5 py-2">
          <Link to="/settings" className="flex items-center gap-2 text-sm">
            <SettingsIcon className="h-4 w-4" strokeWidth={1.75} /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="rounded-xl px-2.5 py-2 flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 text-sm"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
