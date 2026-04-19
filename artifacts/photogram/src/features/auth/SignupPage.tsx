import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "./context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Aperture } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const signupMutation = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signupMutation.mutateAsync({ data: { name, email, password } });
      setAuthContext(res.accessToken);
      toast({ title: "Welcome", description: "Your darkroom is ready." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create account", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-card relative z-20">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-12 md:hidden">
            <Aperture className="w-12 h-12 mb-4" />
            <h1 className="font-serif text-3xl">Photogram</h1>
          </div>

          <h2 className="font-serif text-2xl mb-2">Apply for Exhibition</h2>
          <p className="text-muted-foreground mb-8 text-sm">Join a curated space for photographers.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
              />
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
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-none tracking-widest uppercase text-xs h-12"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Portfolio
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

      <div className="flex-1 bg-muted/20 relative hidden md:flex items-center justify-center p-12 overflow-hidden order-first md:order-last">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-20 text-white max-w-lg text-right w-full flex flex-col items-end">
          <Aperture className="w-16 h-16 mb-8 text-white/80" />
          <h1 className="font-serif text-5xl leading-tight mb-6">A space dedicated to the craft.</h1>
          <p className="text-lg text-white/70 font-mono tracking-wide uppercase">No noise. Just photos.</p>
        </div>
      </div>
    </div>
  );
}
