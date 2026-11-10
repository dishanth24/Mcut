import { LayoutDashboard, Compass, Receipt, Scale, Activity, PieChart, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'My Trips', to: '/trips', Icon: Compass },
  { label: 'Expenses', to: '/expenses', Icon: Receipt },
  { label: 'Balances', to: '/balances', Icon: Scale },
  { label: 'Activity', to: '/activity', Icon: Activity },
  { label: 'Reports', to: '/reports', Icon: PieChart },
  { label: 'Settings', to: '/settings', Icon: Settings },
];

export const MOBILE_ITEMS = NAV_ITEMS.filter((item) =>
  ['/dashboard', '/trips', '/expenses', '/balances', '/settings'].includes(item.to)
);