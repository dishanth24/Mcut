import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';

// Lazy-loaded route pages for code-splitting and faster initial bundle loading
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Trips = lazy(() => import('@/pages/Trips'));
const TripDetail = lazy(() => import('@/pages/TripDetail'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const BalancesPage = lazy(() => import('@/pages/BalancesPage'));
const ActivityPage = lazy(() => import('@/pages/ActivityPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const Settings = lazy(() => import('@/pages/Settings'));
const JoinTrip = lazy(() => import('@/pages/JoinTrip'));

function PageFallback() {
  return (
    <div className="w-full space-y-6 animate-pulse pt-2" role="status" aria-label="Loading page">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-secondary" />
          <div className="h-4 w-72 rounded-lg bg-secondary/60" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-secondary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-secondary/70" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-secondary/50" />
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-3 border-border border-t-[#D98264] animate-spin" />
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app with lazy-loaded Suspense
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:tripId" element={<TripDetail />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/join/:token" element={<JoinTrip />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
