import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "./context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Aperture,
  Loader2,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

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

export default function SignupPage() {
  const [step, setStep] = useState<Step>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
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

  // ── OTP digit handlers ──────────────────────────────────────────────────────
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

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
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

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (step === "otp" && otp.every(d => d !== "") && !verifyOtpMutation.isPending) {
      handleVerify(otp);
    }
  }, [otp, step, handleVerify, verifyOtpMutation.isPending]);

  // ── Resend ──────────────────────────────────────────────────────────────────
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

  const DecorativePanel = (
    <div className="flex-1 bg-muted/20 relative hidden md:flex items-center justify-center p-12 overflow-hidden order-first md:order-last">
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center" />
      <div className="relative z-20 text-white max-w-lg text-right w-full flex flex-col items-end">
        <Aperture className="w-16 h-16 mb-8 text-white/80" />
        <h1 className="font-serif text-5xl leading-tight mb-6">A space dedicated to the craft.</h1>
        <p className="text-lg text-white/70 font-mono tracking-wide uppercase">No noise. Just photos.</p>
      </div>
    </div>
  );

  // ── Success ─────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-card">
          <div className="w-full max-w-sm mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-serif text-3xl mb-3">Welcome to Photogram</h2>
            <p className="text-muted-foreground text-sm">Your darkroom is ready. Redirecting…</p>
          </div>
        </div>
        {DecorativePanel}
      </div>
    );
  }

  // ── OTP entry ───────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-card">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-12 md:hidden">
              <Aperture className="w-12 h-12 mb-4" />
              <h1 className="font-serif text-3xl">Photogram</h1>
            </div>

            <button
              onClick={() => { setStep("form"); setOtpError(""); setOtp(["","","","","",""]); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-2xl leading-tight">Check your inbox</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-1 pl-[52px]">{email}</p>
            <p className="text-muted-foreground text-sm mb-8 pl-[52px]">
              Enter the 6-digit code — valid for {expiryMins} minute{expiryMins !== 1 ? "s" : ""}.
            </p>

            {/* 6-box OTP input */}
            <div className="flex gap-2 mb-2" onPaste={handleOtpPaste}>
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
                  className={`flex-1 min-w-0 aspect-square text-center text-xl font-mono font-bold bg-muted/20 border transition-colors outline-none focus:border-foreground disabled:opacity-40 rounded-none ${
                    otpError ? "border-destructive" : "border-border"
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="flex items-start gap-1.5 text-xs text-destructive mb-3 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {otpError}
              </p>
            )}

            <Button
              onClick={() => handleVerify(otp)}
              className="w-full rounded-none tracking-widest uppercase text-xs h-12 mt-4 mb-5"
              disabled={otp.join("").length < 6 || verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {verifyOtpMutation.isPending ? "Verifying…" : "Verify Code"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || sendOtpMutation.isPending}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sendOtpMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : sendOtpMutation.isPending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </div>
        </div>
        {DecorativePanel}
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-card relative z-20">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12 md:hidden">
            <Aperture className="w-12 h-12 mb-4" />
            <h1 className="font-serif text-3xl">Photogram</h1>
          </div>

          <h2 className="font-serif text-2xl mb-2">Apply for Exhibition</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Join a curated space for photographers.{" "}
            <span className="text-muted-foreground/60 text-xs font-mono">Gmail required.</span>
          </p>

          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-5">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
                minLength={2}
              />

              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="Gmail address (you@gmail.com)"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                  onBlur={() => { if (email) setEmailError(validateEmail(email)); }}
                  className={`bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base ${
                    emailError ? "border-destructive focus-visible:border-destructive" : "border-border"
                  }`}
                  required
                />
                {emailError && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-none tracking-widest uppercase text-xs h-12"
              disabled={sendOtpMutation.isPending}
            >
              {sendOtpMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {sendOtpMutation.isPending ? "Sending code…" : "Continue"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already exhibiting?{" "}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      {DecorativePanel}
    </div>
  );
}
