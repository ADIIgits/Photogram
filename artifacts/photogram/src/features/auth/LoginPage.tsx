import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "./context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Aperture } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 bg-muted/20 relative hidden md:flex items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1452711612711-2eb26f437021?q=80&w=2954&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-20 text-white max-w-lg">
          <Aperture className="w-16 h-16 mb-8 text-white/80" />
          <h1 className="font-serif text-5xl leading-tight mb-6">Light, shadow, and the moments between.</h1>
          <p className="text-lg text-white/70 font-mono tracking-wide uppercase">Enter the darkroom.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-card relative z-20">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12 md:hidden">
            <Aperture className="w-12 h-12 mb-4" />
            <h1 className="font-serif text-3xl">Photogram</h1>
          </div>

          <h2 className="font-serif text-2xl mb-2">Sign In</h2>
          <p className="text-muted-foreground mb-8 text-sm">Welcome back to the gallery.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-none tracking-widest uppercase text-xs h-12"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Authenticate
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            No portfolio yet?{" "}
            <Link href="/signup" className="text-foreground hover:underline font-medium">
              Apply here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
