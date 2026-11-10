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
import { displayName, initials, userAvatar } from '@/lib/profile';
import { Image } from '@/components/ui/image';

export default function UserMenu({ user, compact = false }) {
  const { logout } = useAuth();
  const name = displayName(user);
  const avatar = userAvatar(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={compact ? 'h-9 w-9 rounded-full p-0' : 'h-auto w-full justify-start gap-3 rounded-xl px-2 py-2'}
        >
          {avatar ? (
            <Image src={avatar} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials(name) || '?'}
            </span>
          )}
          {!compact ? (
            <span className="min-w-0 text-left leading-tight">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="gap-2">
            <UserRound className="h-4 w-4" strokeWidth={1.75} /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" strokeWidth={1.75} /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}