import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
          M
        </span>
        <span className="leading-tight">
          <span className="block font-heading text-2xl tracking-tight">Mcut</span>
          <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
            Split the trip
          </span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          {Icon && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <Icon className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          {title && <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>

        {children}

        {footer && (
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
