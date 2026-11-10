import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { MOBILE_ITEMS, NAV_ITEMS } from '@/lib/nav';

export function Brand({ compact = false }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
        M
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-xl tracking-tight">Mcut</span>
        {!compact ? (
          <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
            Split the trip
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function SidebarLinks() {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ label, to, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : ''}`} strokeWidth={1.75} />
              <span className="font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_ITEMS.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[0.65rem] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.75} />
                <span>{label === 'My Trips' ? 'Trips' : label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}