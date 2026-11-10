import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Scale,
  Receipt,
  Activity,
  PieChart,
  Settings,
  Plus,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'My Trips', to: '/trips', Icon: Compass },
  { label: 'Expenses', to: '/expenses', Icon: Receipt },
  { label: 'Balances', to: '/balances', Icon: Scale },
  { label: 'Activity', to: '/activity', Icon: Activity },
  { label: 'Reports', to: '/reports', Icon: PieChart },
  { label: 'Settings', to: '/settings', Icon: Settings },
];

export function Brand({ compact = false }) {
  const shouldReduce = useReducedMotion();

  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 group w-fit">
      <motion.span
        whileHover={shouldReduce ? {} : { scale: 1.05, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D98264] to-[#C97254] text-base font-bold text-white shadow-md shadow-[#D98264]/20"
      >
        M
      </motion.span>
      <span className="leading-tight">
        <span className="block font-heading text-xl tracking-tight group-hover:text-[#D98264] transition-colors">
          Mcut
        </span>
        {!compact ? (
          <span className="block text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
            Split the trip
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function SidebarLinks() {
  const location = useLocation();
  const shouldReduce = useReducedMotion();

  return (
    <nav className="flex flex-col gap-1.5 py-1">
      {NAV_ITEMS.map(({ label, to, Icon }) => {
        const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

        return (
          <NavLink
            key={to}
            to={to}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {/* Animated active pill */}
            {isActive && (
              <motion.div
                layoutId={shouldReduce ? undefined : 'sidebarActivePill'}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-card border border-border/80 shadow-xs"
              />
            )}

            <Icon
              className={`relative z-10 h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5 ${
                isActive ? 'text-[#D98264]' : 'text-muted-foreground group-hover:text-foreground'
              }`}
              strokeWidth={isActive ? 2.2 : 1.75}
            />
            <span className="relative z-10">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function MobileNav({ onQuickAction }) {
  const location = useLocation();
  const shouldReduce = useReducedMotion();

  const mobileTabs = [
    { label: 'Home', to: '/dashboard', Icon: LayoutDashboard },
    { label: 'Trips', to: '/trips', Icon: Compass },
    { isAction: true }, // Centre Quick Action button
    { label: 'Balances', to: '/balances', Icon: Scale },
    { label: 'More', to: '/settings', Icon: Settings },
  ];

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 px-4 pointer-events-none lg:hidden">
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-border/80 bg-card/92 px-2 py-1.5 shadow-xl backdrop-blur-lg"
      >
        <div className="flex items-center justify-around pb-[max(0.2rem,env(safe-area-inset-bottom))]">
          {mobileTabs.map((tab, idx) => {
            if (tab.isAction) {
              return (
                <div key="quick-action" className="flex items-center justify-center px-1">
                  <motion.button
                    type="button"
                    onClick={onQuickAction}
                    aria-label="Quick action"
                    whileHover={shouldReduce ? {} : { scale: 1.08 }}
                    whileTap={shouldReduce ? {} : { scale: 0.92 }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#D98264] to-[#C97254] text-white shadow-md shadow-[#D98264]/30"
                  >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                  </motion.button>
                </div>
              );
            }

            const { label, to, Icon } = tab;
            const isActive =
              location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

            return (
              <NavLink
                key={to || idx}
                to={to}
                className={`relative flex min-h-[44px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-[0.68rem] transition-colors ${
                  isActive ? 'text-[#D98264] font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={shouldReduce ? undefined : 'mobileActiveTab'}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-xl bg-secondary/80"
                  />
                )}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.75} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
