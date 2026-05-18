import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "../../api-client";
import { useAuth } from "./context";
import { Loader2, Aperture, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      setAuthContext(res.accessToken);
      toast({ title: "Welcome back", description: "You are now in the darkroom." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Access Denied", description: err.message || "Invalid credentials", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
      {/* Left — cinematic panel (desktop) */}
      <div className="flex-1 relative hidden md:flex items-end justify-start p-14 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1452711612711-2eb26f437021?q=80&w=2954&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/50 to-black/20" />
        <div className="relative z-10 max-w-sm">
          <Aperture className="w-10 h-10 mb-8 text-white/60" strokeWidth={1.25} />
          <h1 className="font-serif text-5xl leading-[1.1] mb-5 text-white">Light, shadow, and the moments between.</h1>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40">Enter the darkroom.</p>
        </div>
      </div>

      {/* Right — form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-[#0a0a0a] md:max-w-[480px]"
      >
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="mb-14 md:hidden flex flex-col items-start pt-16">
            <Aperture className="w-10 h-10 mb-5 text-white/60" strokeWidth={1.25} />
            <h1 className="font-serif text-4xl text-white">Photogram</h1>
          </div>

          <h2 className="text-[32px] font-black tracking-tight text-white mb-1">Sign In</h2>
          <p className="text-white/40 mb-8 text-sm">Welcome back to the gallery.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <GlassInput
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-white text-black rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {loginMutation.isPending ? "Signing in…" : "Authenticate"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/35">
            No portfolio yet?{" "}
            <Link href="/signup" className="text-white/70 hover:text-white transition-colors font-medium">
              Apply here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GlassInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-12 px-4 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all ${className}`}
    />
  );
}
