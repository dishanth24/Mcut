import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless for security
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset your password"
      footer={
        <Link to="/login" className="text-[#D98264] font-medium hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to log in</span>
        </Link>
      }
    >
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center gap-3 py-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2DD4BF]/15 text-[#2DD4BF]"
          >
            <CheckCircle2 className="w-9 h-9" />
          </motion.div>
          <h3 className="font-heading text-xl">Check your inbox</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent instructions to reset your password.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
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
          <Button
            type="submit"
            className="w-full h-12 font-medium rounded-xl bg-[#D98264] hover:bg-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
