import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "./context";
import {
  Aperture,
  Loader2,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "form" | "otp" | "success";

function isGmail(email: string) {
  return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i.test(email);
}

function useCountdown(targetIso: string | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!targetIso) { setSeconds(0); return; }
    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 1000));
      setSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [targetIso]);
  return seconds;
}

function GlassInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-12 px-4 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all ${className}`}
    />
  );
}

const DecorativePanel = (
  <div className="flex-1 relative hidden md:flex items-end justify-end p-14 overflow-hidden order-last">
    <img
      src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop"
      alt=""
      className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
    />
    <div className="absolute inset-0 bg-gradient-to-tl from-black/90 via-black/50 to-black/20" />
    <div className="relative z-10 max-w-sm text-right">
      <Aperture className="w-10 h-10 mb-8 text-white/60 ml-auto" strokeWidth={1.25} />
      <h1 className="font-serif text-5xl leading-[1.1] mb-5 text-white">A space dedicated to the craft.</h1>
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40">No noise. Just photos.</p>
    </div>
  </div>
);

export default function SignupPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const resendCooldown = useCountdown(resendAvailableAt);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const validateEmail = (val: string) => {
    if (!val) return "Email is required.";
    if (!isGmail(val)) return "Only Gmail addresses (@gmail.com) are accepted.";
    return "";
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    try {
      const res = await sendOtpMutation.mutateAsync({
        data: { name: name.trim(), email: email.toLowerCase().trim(), password },
      });
      setResendAvailableAt(res.resendAvailableAt);
      setExpiresAt(res.expiresAt);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err: any) {
      setEmailError(err?.message ?? "Failed to send code. Try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = otp.map((_, i) => digits[i] ?? "");
    setOtp(next);
    setOtpError("");
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = useCallback(async (currentOtp: string[]) => {
    const code = currentOtp.join("");
    if (code.length < 6) return;
    setOtpError("");
    try {
      const res = await verifyOtpMutation.mutateAsync({
        data: { email: email.toLowerCase().trim(), otp: code },
      });
      setStep("success");
      setTimeout(() => {
        setAuthContext(res.accessToken);
        setLocation("/");
      }, 1800);
    } catch (err: any) {
      setOtpError(err?.message ?? "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [email, verifyOtpMutation, setAuthContext, setLocation]);

  useEffect(() => {
    if (step === "otp" && otp.every(d => d !== "") && !verifyOtpMutation.isPending) {
      handleVerify(otp);
    }
  }, [otp, step, handleVerify, verifyOtpMutation.isPending]);

  const handleResend = async () => {
    if (resendCooldown > 0 || sendOtpMutation.isPending) return;
    setOtpError("");
    setOtp(["", "", "", "", "", ""]);
    try {
      const res = await sendOtpMutation.mutateAsync({
        data: { name: name.trim(), email: email.toLowerCase().trim(), password },
      });
      setResendAvailableAt(res.resendAvailableAt);
      setExpiresAt(res.expiresAt);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err: any) {
      const msg: string = err?.message ?? "Failed to resend.";
      const sl: number | undefined = (err as any)?.secondsLeft;
      if (sl) setResendAvailableAt(new Date(Date.now() + sl * 1000).toISOString());
      setOtpError(msg);
    }
  };

  const expiryMins = expiresAt
    ? Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000))
    : 10;

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center px-6"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="font-serif text-3xl text-white mb-3">Welcome to Photogram</h2>
          <p className="text-white/40 text-sm">Your darkroom is ready. Redirecting…</p>
        </motion.div>
        {DecorativePanel}
      </div>
    );
  }

  // ── OTP entry ─────────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 md:max-w-[480px]"
        >
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-10 md:hidden pt-16">
              <Aperture className="w-10 h-10 mb-5 text-white/60" strokeWidth={1.25} />
              <h1 className="font-serif text-4xl text-white">Photogram</h1>
            </div>

            <button
              onClick={() => { setStep("form"); setOtpError(""); setOtp(["","","","","",""]); }}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-5">
              <Mail className="w-5 h-5 text-white/50" />
            </div>
            <h2 className="text-[32px] font-black tracking-tight text-white mb-1">Check your inbox</h2>
            <p className="text-white/40 text-sm mb-1">{email}</p>
            <p className="text-white/35 text-sm mb-8">
              Enter the 6-digit code — valid for {expiryMins} minute{expiryMins !== 1 ? "s" : ""}.
            </p>

            {/* OTP boxes */}
            <div className="flex gap-2 mb-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  disabled={verifyOtpMutation.isPending}
                  className={`flex-1 min-w-0 aspect-square text-center text-xl font-mono font-bold bg-white/[0.06] border rounded-2xl outline-none transition-all disabled:opacity-40 focus:bg-white/[0.08] ${
                    otpError ? "border-red-500/60 text-red-400" : digit ? "border-white/25 text-white" : "border-white/[0.08] text-white"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence>
              {otpError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-red-400 mb-3"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {otpError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={() => handleVerify(otp)}
              disabled={otp.join("").length < 6 || verifyOtpMutation.isPending}
              className="w-full h-12 bg-white text-black rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2 mb-6"
            >
              {verifyOtpMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifyOtpMutation.isPending ? "Verifying…" : "Verify Code"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || sendOtpMutation.isPending}
                className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sendOtpMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : sendOtpMutation.isPending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </div>
        </motion.div>
        {DecorativePanel}
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 md:max-w-[480px]"
      >
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-14 md:hidden flex flex-col items-start pt-16">
            <Aperture className="w-10 h-10 mb-5 text-white/60" strokeWidth={1.25} />
            <h1 className="font-serif text-4xl text-white">Photogram</h1>
          </div>

          <h2 className="text-[32px] font-black tracking-tight text-white mb-1">Apply for Exhibition</h2>
          <p className="text-white/40 mb-8 text-sm">
            Join a curated space for photographers.{" "}
            <span className="font-mono text-[11px] text-white/25">Gmail only.</span>
          </p>

          <form onSubmit={handleSendOtp} className="space-y-3">
            <GlassInput
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
            />

            <div>
              <GlassInput
                type="email"
                placeholder="Gmail address (you@gmail.com)"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                onBlur={() => { if (email) setEmailError(validateEmail(email)); }}
                className={emailError ? "border-red-500/60 focus:border-red-400/60" : ""}
                required
              />
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 px-1"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <GlassInput
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className="w-full h-12 bg-white text-black rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {sendOtpMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sendOtpMutation.isPending ? "Sending code…" : "Continue"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/35">
            Already exhibiting?{" "}
            <Link href="/login" className="text-white/70 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
      {DecorativePanel}
    </div>
  );
}
