/* Layout.tsx — the app shell shared by every page.
 * Renders:
 *   - Desktop sidebar (sticky, left column) with nav links + theme toggle
 *   - Main content slot (<main>) where page content renders
 *   - Mobile bottom navigation bar (fixed, frosted glass pill) */

import { Link, useLocation } from "wouter";
import { useAuth } from "@/features/auth/context";
import { useTheme } from "@/contexts/ThemeContext";
import { CreatePostModal } from "@/features/posts/CreatePostModal";
import { Home, Compass, User, Aperture, LogOut, Settings, Plus, Sun, Moon } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout: authLogout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();
  const { theme, toggleTheme } = useTheme();

  /* Call API logout then clear the local session */
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      authLogout();
    } catch {
      authLogout();
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:flex-row"
      style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}
    >
      {/* ── Desktop sidebar — sticky full-height left column ── */}
      <nav
        className="hidden md:flex flex-col w-56 border-r h-screen sticky top-0 shrink-0 p-6 backdrop-blur-xl"
        style={{
          background: "var(--pg-sidebar-bg)",
          borderColor: "var(--pg-border)",
        }}
      >
        {/* Brand logo + wordmark */}
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <Aperture
            className="w-7 h-7 group-hover:rotate-90 transition-transform duration-700 ease-in-out"
            strokeWidth={1.5}
            style={{ color: "var(--pg-muted-text)" }}
          />
          <span className="font-serif text-lg tracking-wide font-medium" style={{ color: "var(--pg-text)" }}>
            Photogram
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex flex-col gap-1 flex-1">
          <SideNavLink href="/" icon={<Home className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Feed" active={location === "/"} />
          <SideNavLink href="/discover" icon={<Compass className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Discover" active={location === "/discover"} />
          {user && (
            <SideNavLink href={`/profile/${user.id}`} icon={<User className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Profile" active={location === `/profile/${user.id}`} />
          )}
          {user && (
            <SideNavLink href="/settings" icon={<Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />} label="Settings" active={location === "/settings"} />
          )}

          {/* Bottom actions: theme toggle, create post, logout */}
          <div className="mt-auto pt-6 flex flex-col gap-3">
            {/* Dark / light toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm w-full"
              style={{ color: "var(--pg-nav-inactive-text)" }}
            >
              {theme === "dark"
                ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
                : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              }
              <span className="tracking-wide">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            {user ? (
              <>
                {/* Create post — opens the upload modal */}
                <CreatePostModal>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold w-full hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: "var(--pg-btn-bg)", color: "var(--pg-btn-text)" }}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    <span>Develop</span>
                  </button>
                </CreatePostModal>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm w-full"
                  style={{ color: "var(--pg-nav-inactive-text)" }}
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-center px-4 py-2.5 font-semibold text-sm hover:opacity-90 transition-colors rounded-2xl"
                style={{ background: "var(--pg-btn-bg)", color: "var(--pg-btn-text)" }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Page content slot ── */}
      <main className="flex-1 pb-20 md:pb-0 min-w-0 max-w-full">{children}</main>

      {/* ── Mobile bottom nav — frosted glass pill ── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.2 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        <div
          className="mx-3 mb-3 px-6 py-3 rounded-[26px] backdrop-blur-2xl flex justify-between items-center shadow-2xl"
          style={{
            background: "var(--pg-bg-frosted)",
            border: "1px solid var(--pg-border-strong)",
          }}
        >
          <MobileNavLink href="/" icon={<Home className="w-6 h-6" strokeWidth={1.75} />} active={location === "/"} />
          <MobileNavLink href="/discover" icon={<Compass className="w-6 h-6" strokeWidth={1.75} />} active={location === "/discover"} />

          {/* Theme toggle in mobile nav */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{ color: "var(--pg-nav-inactive-text)" }}
          >
            {theme === "dark"
              ? <Sun className="w-5 h-5" strokeWidth={1.75} />
              : <Moon className="w-5 h-5" strokeWidth={1.75} />
            }
          </button>

          {user ? (
            <>
              <CreatePostModal>
                <button
                  className="flex items-center justify-center w-11 h-11 rounded-full shadow-lg active:scale-95 transition-transform"
                  style={{ background: "var(--pg-btn-bg)", color: "var(--pg-btn-text)" }}
                >
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

/* Desktop sidebar nav link — highlights when the route is active */
function SideNavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm"
      style={{
        color: active ? "var(--pg-text)" : "var(--pg-nav-inactive-text)",
        background: active ? "var(--pg-nav-active-bg)" : "transparent",
        fontWeight: active ? 500 : 400,
      }}
    >
      {icon}
      <span className="tracking-wide">{label}</span>
    </Link>
  );
}

/* Mobile bottom nav icon link — shows a blue dot under the active route */
function MobileNavLink({
  href,
  icon,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center transition-colors"
      style={{ color: active ? "var(--pg-text)" : "var(--pg-nav-inactive-text)" }}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="mobile-tab-dot"
          className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#3b82f6]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}
