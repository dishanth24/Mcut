import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { motion } from "framer-motion";

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-destructive' };
  if (score <= 3) return { level: 2, label: 'Moderate', color: 'bg-[#D98264]' };
  return { level: 3, label: 'Strong', color: 'bg-[#2DD4BF]' };
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new verification code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`Enter the 6-digit verification code sent to ${email}`}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-12 w-12 text-lg rounded-l-xl border-border/80" />
              <InputOTPSlot index={1} className="h-12 w-12 text-lg border-border/80" />
              <InputOTPSlot index={2} className="h-12 w-12 text-lg border-border/80" />
              <InputOTPSlot index={3} className="h-12 w-12 text-lg border-border/80" />
              <InputOTPSlot index={4} className="h-12 w-12 text-lg border-border/80" />
              <InputOTPSlot index={5} className="h-12 w-12 text-lg rounded-r-xl border-border/80" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-5">
          Didn't receive the code?{" "}
          <button type="button" onClick={handleResend} className="text-[#D98264] font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to start splitting trips in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-[#D98264] font-medium hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium mb-6 border-border/80 hover:bg-secondary transition-all"
          onClick={handleGoogle}
          disabled={loading}
          type="button"
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
      </motion.div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or with email</span>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl border-border/80 focus-visible:ring-[#D98264]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-border/80 focus-visible:ring-[#D98264]"
              required
            />
            <button
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1.5 h-1">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      strength.level >= lvl ? strength.color : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[0.7rem] text-muted-foreground">
                Strength: <span className="font-medium text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showConfirmPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pl-10 pr-12 h-12 rounded-xl border-border/80 focus-visible:ring-[#D98264] ${
                passwordsMismatch ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {passwordsMatch && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="text-[#2DD4BF]"
                >
                  <Check className="w-4 h-4" />
                </motion.span>
              )}
              <button
                type="button"
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPw((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-medium rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20 transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
