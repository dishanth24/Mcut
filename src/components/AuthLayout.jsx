import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const BENEFITS = [
  { text: 'Split exact expenses down to the paisa', icon: Zap },
  { text: 'Smart settle-up with fewest transfers', icon: Sparkles },
  { text: '100% private: only invited mates can view', icon: Shield },
];

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden bg-[#161311] px-12 py-12 border-r border-border/50">
      {/* Background radial glow blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #D98264 0%, transparent 70%)', filter: 'blur(70px)' }}
        />
        <div
          className="absolute bottom-10 right-0 h-72 w-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 h-56 w-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D98264 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      {/* Brand logo top */}
      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-2.5 group w-fit">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D98264] to-[#C97254] text-lg font-bold text-white shadow-md shadow-[#D98264]/20 group-hover:scale-105 transition-transform">
            M
          </span>
          <span className="font-heading text-2xl tracking-tight text-white group-hover:text-[#D98264] transition-colors">
            Mcut
          </span>
        </Link>
      </div>

      {/* Centered content with headline and benefits */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-10 max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-heading text-4xl leading-tight text-white"
        >
          Split the trip,{' '}
          <span className="italic text-[#D98264]">not the friendship.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-4 text-sm text-white/70 leading-relaxed"
        >
          A single honest ledger for your group — who paid, who joined in, and the simplest settle-up transfers to close it out.
        </motion.p>

        {/* Mini trip ledger snippet preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-white/60 mb-2.5">
            <span className="font-medium">Goa Trip • Active</span>
            <span className="rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] px-2 py-0.5 text-[0.65rem] font-semibold">
              Balanced
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
            <span className="text-white/90">Dinner & Drinks</span>
            <span className="num font-semibold text-[#2DD4BF]">₹2,400</span>
          </div>
          <div className="flex items-center justify-between text-xs text-white/50 pt-2">
            <span>Rohan paid • 4 members split</span>
            <span className="text-[#D98264] font-medium">₹600 / person</span>
          </div>
        </motion.div>

        {/* Benefits list */}
        <motion.ul
          className="mt-8 space-y-3.5"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } } }}
        >
          {BENEFITS.map((b) => (
            <motion.li
              key={b.text}
              variants={{
                hidden: { opacity: 0, x: -12 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
              }}
              className="flex items-center gap-3 text-sm text-white/80"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2DD4BF]/15 text-[#2DD4BF] flex-shrink-0">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{b.text}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Footer copyright */}
      <div className="relative z-10">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Mcut. Amounts tracked in trip currency.</p>
      </div>
    </div>
  );
}

export default function AuthLayout({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-2">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile-only logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D98264] to-[#C97254] text-base font-bold text-white shadow-md">
            M
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-2xl tracking-tight">Mcut</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Split the trip
            </span>
          </span>
        </Link>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl border border-border/80 bg-card p-7 sm:p-9 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col items-center text-center mb-6">
              {Icon && (
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D98264]/10 text-[#D98264] mb-3.5">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
              )}
              {title && <h1 className="text-2xl font-heading tracking-tight text-foreground">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
            </div>

            {children}

            {footer && (
              <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
