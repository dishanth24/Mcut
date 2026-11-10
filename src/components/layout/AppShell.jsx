import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Brand, MobileNav, SidebarLinks } from '@/components/layout/Nav';
import UserMenu from '@/components/layout/UserMenu';
import ThemeToggle from '@/components/layout/ThemeToggle';
import OnboardingDialog from '@/components/OnboardingDialog';
import TripDialog from '@/components/trips/TripDialog';
import JoinByLinkDialog from '@/components/trips/JoinByLinkDialog';
import { Button } from '@/components/ui/button';
import { Plus, Link2, Compass } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, useReducedMotion } from 'framer-motion';

export default function AppShell() {
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();
  const [quickOpen, setQuickOpen] = useState(false);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleOpenNewTrip = () => {
    setQuickOpen(false);
    setTripDialogOpen(true);
  };

  const handleOpenJoinTrip = () => {
    setQuickOpen(false);
    setJoinDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-border/70 bg-card/40 px-4 py-6 backdrop-blur-md lg:flex z-30">
        <div>
          <div className="px-2 pb-6">
            <Brand />
          </div>
          <SidebarLinks />

          {/* Quick create action button in sidebar */}
          <div className="mt-6 px-1">
            <Button
              onClick={() => setTripDialogOpen(true)}
              className="w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D98264] to-[#C97254] font-semibold text-white shadow-md shadow-[#D98264]/20 hover:opacity-95 border-0"
            >
              <Plus className="h-4 w-4" /> New trip
            </Button>
          </div>
        </div>

        <div className="space-y-3 px-1 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between px-2">
            <span className="field-label text-xs">Theme</span>
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="lg:pl-64">
        {/* Mobile top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <Brand compact />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu user={user} compact />
          </div>
        </header>

        {/* Page content with smooth entrance animation */}
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile floating bottom tab bar */}
      <MobileNav onQuickAction={() => setQuickOpen(true)} />

      {/* Quick Action Sheet / Modal */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="sm:max-w-xs rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-center">Quick action</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2.5 pt-2">
            <motion.button
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              onClick={handleOpenNewTrip}
              className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-colors hover:border-[#D98264]/40 hover:bg-secondary/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D98264]/15 text-[#D98264]">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Start a new trip</p>
                <p className="text-xs text-muted-foreground">Pick dates and invite friends</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              onClick={handleOpenJoinTrip}
              className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-colors hover:border-[#2DD4BF]/40 hover:bg-secondary/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2DD4BF]/15 text-[#2DD4BF]">
                <Link2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Join with invite link</p>
                <p className="text-xs text-muted-foreground">Paste a friend's trip token</p>
              </div>
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Dialogs triggered from quick actions */}
      <TripDialog
        open={tripDialogOpen}
        onOpenChange={setTripDialogOpen}
        user={user}
        onSaved={() => {
          // Window event or navigation to new trip
          window.dispatchEvent(new Event('mcut-trips-updated'));
        }}
      />
      <JoinByLinkDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />

      <OnboardingDialog user={user} />
    </div>
  );
}
