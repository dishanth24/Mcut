import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, MessageSquare, ShieldCheck } from "lucide-react";
import MfaMethodSetup from "@/components/MfaMethodSetup";
import { CodeField, MfaHeader, MfaNotice, ResendLine, useCooldown } from "@/components/MfaParts";

const METHODS = [
  { id: "totp", name: "Authenticator app", icon: Smartphone,
    description: "Use an app like Google Authenticator or 1Password to generate codes." },
  { id: "sms", name: "Text messages (SMS)", icon: MessageSquare, description: "Get one-time verification codes sent to your mobile phone." },
];
const SMS_RESEND_SECONDS = 30;

// Two-factor authentication settings: enable, replace or disable a method. Card content, shown
// with <MfaScreen>. session is the mfaSession that just verified a management sign-in; its grant
// lasts a few minutes, so an expired one sends the user back through /mfa.
export default function MfaManage({ session, returnTo }) {
  const [status, setStatus] = useState(null);
  const [view, setView] = useState({ name: "list" });
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      setStatus(await session.status());
    } catch (err) {
      setError(err);
    }
  };
  useEffect(() => { load(); }, [session]);

  const back = () => { setView({ name: "list" }); load(); };

  return (
    <div className="session-record-block">
      <MfaHeader
        title="Two-Factor Security"
        description="Add a second verification layer when signing in. You'll enter a quick 6-digit code to protect your account."
      />
      {view.name === "setup" && <MfaMethodSetup session={session} method={view.method} signInPath="/mfa" onDone={back} onBack={() => setView({ name: "list" })} />}
      {view.name === "disable" && <Disable session={session} method={view.method} onDone={back} onBack={() => setView({ name: "list" })} />}
      {view.name === "list" && (
        <div className="space-y-4">
          <MfaNotice error={error} signInPath="/mfa" />
          {!status && !error && <Loader2 className="mx-auto w-6 h-6 animate-spin text-primary" />}
          {status && METHODS.map(({ id, name, icon: Icon, description }) => {
            const enrolled = status.methods.includes(id);
            return (
              <div
                key={id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-border/80 bg-background/50 p-4 transition-colors hover:border-border"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    {enrolled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#2DD4BF]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2DD4BF]">
                        <ShieldCheck className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {enrolled ? (id === "sms" && status.phone_hint ? `Configured · ${status.phone_hint}` : "Enrolled and active") : description}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant={enrolled ? "outline" : "default"}
                    className={enrolled ? "h-8 text-xs border-border/80" : "h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"}
                    onClick={() => setView({ name: "setup", method: id })}
                  >
                    {enrolled ? "Replace" : "Enable"}
                  </Button>
                  {enrolled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setView({ name: "disable", method: id })}
                    >
                      Disable
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <Button
            className="w-full h-11 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
            onClick={() => { window.location.href = returnTo; }}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

// Disables a method after a fresh code from that same method.
function Disable({ session, method, onDone, onBack }) {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(method === "totp");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useCooldown();

  const run = async (task) => {
    setError(null);
    setBusy(true);
    try {
      return await task();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (await run(() => session.sendProofCode())) {
      setCodeSent(true);
      setCooldown(SMS_RESEND_SECONDS);
    }
  };

  const confirm = async (value = code) => {
    if (busy || value.length < 6) return;
    if (await run(() => session.removeMethod(method, value, method))) onDone();
    else setCode("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-center text-foreground">
        {method === "totp" ? "Enter code from authenticator app" : "Verify with SMS code sent to phone"}
      </h2>
      <MfaNotice error={error} signInPath="/mfa" />
      {codeSent ? (
        <>
          <CodeField id="mfa-disable-code" value={code} onChange={setCode} onComplete={confirm} />
          {method === "sms" && <ResendLine cooldown={cooldown} disabled={busy} onResend={sendCode} />}
        </>
      ) : (
        <Button className="w-full h-10 text-xs bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy} onClick={sendCode}>
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Send Verification Code
        </Button>
      )}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" className="h-10 text-xs border-border/80" disabled={busy} onClick={onBack}>Cancel</Button>
        <Button
          className="h-10 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={busy || !codeSent || code.length < 6}
          onClick={() => confirm()}
        >
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Verify & Disable
        </Button>
      </div>
    </div>
  );
}
