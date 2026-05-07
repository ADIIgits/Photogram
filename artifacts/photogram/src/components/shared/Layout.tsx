import { Link, useLocation } from "wouter";
import { useAuth } from "@/features/auth/context";
import { CreatePostModal } from "@/features/posts/CreatePostModal";
import { Home, Compass, User, Aperture, LogOut, Settings, Plus } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout: authLogout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      authLogout();
    } catch {
      authLogout();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-[#fafafa] flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col w-56 border-r border-white/[0.07] p-6 h-screen sticky top-0 shrink-0 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <Aperture className="w-7 h-7 group-hover:rotate-90 transition-transform duration-700 ease-in-out text-white/80" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-wide font-medium">Photogram</span>
        </Link>

        <div className="flex flex-col gap-1 flex-1">
          <SideNavLink href="/" icon={<Home className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Feed" active={location === "/"} />
          <SideNavLink href="/discover" icon={<Compass className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Discover" active={location === "/discover"} />
          {user && (
            <SideNavLink href={`/profile/${user.id}`} icon={<User className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Profile" active={location === `/profile/${user.id}`} />
          )}
          {user && (
            <SideNavLink href="/settings" icon={<Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Settings" active={location === "/settings"} />
          )}

          <div className="mt-auto pt-6 flex flex-col gap-3">
            {user ? (
              <>
                <CreatePostModal>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white text-black text-sm font-semibold w-full hover:bg-white/90 active:scale-[0.98] transition-all">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    <span>Develop</span>
                  </button>
                </CreatePostModal>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 transition-colors text-sm w-full"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="block text-center bg-white text-black px-4 py-2.5 font-semibold text-sm hover:bg-white/90 transition-colors rounded-2xl">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 min-w-0 max-w-full">{children}</main>

      {/* Bottom nav — mobile (iOS frosted glass) */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.2 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        <div className="mx-3 mb-3 px-6 py-3 rounded-[26px] bg-black/60 backdrop-blur-2xl border border-white/[0.10] flex justify-between items-center shadow-2xl shadow-black/50">
          <MobileNavLink href="/" icon={<Home className="w-6 h-6" strokeWidth={1.75} />} active={location === "/"} />
          <MobileNavLink href="/discover" icon={<Compass className="w-6 h-6" strokeWidth={1.75} />} active={location === "/discover"} />
          {user ? (
            <>
              <CreatePostModal>
                <button className="flex items-center justify-center w-11 h-11 bg-white text-black rounded-full shadow-lg shadow-white/20 active:scale-95 transition-transform">
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </CreatePostModal>
              <MobileNavLink href={`/profile/${user.id}`} icon={<User className="w-6 h-6" strokeWidth={1.75} />} active={location === `/profile/${user.id}`} />
              <MobileNavLink href="/settings" icon={<Settings className="w-6 h-6" strokeWidth={1.75} />} active={location === "/settings"} />
            </>
          ) : (
            <MobileNavLink href="/login" icon={<User className="w-6 h-6" strokeWidth={1.75} />} active={location === "/login"} />
          )}
        </div>
      </motion.nav>
    </div>
  );
}

function SideNavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
        active ? "text-white bg-white/8 font-medium" : "text-white/40 hover:text-white/80 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="tracking-wide">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active }: { href: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link href={href} className={`relative flex flex-col items-center transition-colors ${active ? "text-white" : "text-white/35"}`}>
      {icon}
      {active && (
        <motion.div layoutId="mobile-tab-dot" className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#3b82f6]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
      )}
    </Link>
  );
}
