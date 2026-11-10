import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Brand, MobileNav, SidebarLinks } from '@/components/layout/Nav';
import UserMenu from '@/components/layout/UserMenu';
import ThemeToggle from '@/components/layout/ThemeToggle';
import OnboardingDialog from '@/components/OnboardingDialog';

export default function AppShell() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-border bg-secondary/40 px-4 py-6 lg:flex">
        <div>
          <div className="px-2 pb-7">
            <Brand />
          </div>
          <SidebarLinks />
        </div>
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between px-2">
            <span className="field-label">Appearance</span>
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Brand compact />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={user} compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-14 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <OnboardingDialog user={user} />
    </div>
  );
}