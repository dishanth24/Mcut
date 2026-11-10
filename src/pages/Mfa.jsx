import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import MfaFlow from "@/components/MfaFlow";
import MfaManage from "@/components/MfaManage";
import { MfaHeader, MfaNotice, MfaScreen, useAppInfo } from "@/components/MfaParts";
import { finishSignIn, resumeMfa, signInToManageMfa, signInWithProvider } from "@/lib/authMfaFlow";
import { safeReturnTo } from "@/lib/authReturnTo";

const PROVIDERS = [
  { id: "google", flag: "enable_google_login", name: "Google" },
  { id: "microsoft", flag: "enable_microsoft_login", name: "Microsoft" },
  { id: "facebook", flag: "enable_facebook_login", name: "Facebook" },
  { id: "apple", flag: "enable_apple_login", name: "Apple" },
];

// /mfa: finishes a Google, Microsoft, Facebook, Apple or SSO sign-in that needs a second step
// (?mfa_code=…), and opened directly it is the two-factor authentication settings page.
export default function Mfa() {
  const returnTo = safeReturnTo();
  const [challenge, setChallenge] = useState(null);
  const [managing, setManaging] = useState(null);
  const [resuming, setResuming] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    resumeMfa()
      .then((result) => {
        // A remembered device signs in straight away; otherwise continue the second step here.
        if (result?.access_token) return finishSignIn(result.access_token, returnTo);
        if (result) setChallenge(result);
        setResuming(false);
      })
      .catch((err) => { setError(err); setResuming(false); });
  }, []);

  if (resuming) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Checking authentication status…</p>
      </div>
    );
  }
  return (
    <MfaScreen>
      {managing ? <MfaManage session={managing} returnTo={returnTo} />
        : challenge ? <MfaFlow challenge={challenge} returnTo={returnTo} onManage={setManaging} />
        : <ConfirmIdentity returnTo={returnTo} onChallenge={setChallenge} initialError={error} />}
    </MfaScreen>
  );
}

// Changing two-factor settings starts with a fresh sign-in, then a code from an enrolled method.
function ConfirmIdentity({ returnTo, onChallenge, initialError }) {
  const info = useAppInfo();
  const options = info ? info.auth_config || {} : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onChallenge(await signInToManageMfa(email, password));
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const withProvider = (provider) => signInWithProvider(provider, returnTo, { manage: true }).catch(setError);
  const providers = options ? PROVIDERS.filter((provider) => options[provider.flag] ?? provider.id === "google") : [];

  return (
    <>
      <MfaHeader title={info && (info.name ? `Welcome to ${info.name}` : "Security Verification")} description="Sign in to manage your two-factor security methods" />
      <MfaNotice error={error} />
      {!options && !error && <Loader2 className="mx-auto w-6 h-6 animate-spin text-primary" />}
      {options && (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              className="w-full h-11 text-xs font-medium border-border/80 hover:bg-secondary/70 transition-colors"
              onClick={() => withProvider(provider.id)}
            >
              {provider.id === "google" && <GoogleIcon className="w-4 h-4 mr-2" />}
              Continue with {provider.name}
            </Button>
          ))}
          {(options.enable_sso_login || options.use_workspace_sso) && (
            <Button
              variant="outline"
              className="w-full h-11 text-xs font-medium border-border/80 hover:bg-secondary/70 transition-colors"
              onClick={() => withProvider("sso")}
            >
              Continue with SSO
            </Button>
          )}
          {options.enable_username_password && (
            <form onSubmit={submit} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="mfa-email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="mfa-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 text-xs bg-background/50 border-border/80 focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mfa-password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="mfa-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-10 text-xs bg-background/50 border-border/80 focus:border-primary"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-10 font-medium text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                disabled={busy}
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
