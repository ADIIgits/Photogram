import { Link, useLocation } from "wouter";
import { useAuth } from "@/features/auth/context";
import { CreatePostModal } from "@/features/posts/CreatePostModal";
import { Home, Compass, User, Aperture, LogOut, Settings } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

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
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border p-6 h-screen sticky top-0 shrink-0">
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          <Aperture className="w-8 h-8 group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
          <span className="font-serif text-xl tracking-wide font-medium">Photogram</span>
        </Link>

        <div className="flex flex-col gap-6 flex-1">
          <NavLink href="/" icon={<Home className="w-5 h-5" />} label="Feed" active={location === "/"} />
          <NavLink href="/discover" icon={<Compass className="w-5 h-5" />} label="Discover" active={location === "/discover"} />
          {user && (
            <NavLink
              href={`/profile/${user.id}`}
              icon={<User className="w-5 h-5" />}
              label="Profile"
              active={location === `/profile/${user.id}`}
            />
          )}
          {user && (
            <NavLink
              href="/settings"
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              active={location === "/settings"}
            />
          )}

          <div className="mt-auto">
            {user ? (
              <div className="flex flex-col gap-4">
                <CreatePostModal>
                  <button className="flex items-center gap-4 text-foreground/80 hover:text-foreground transition-colors p-2 -mx-2 rounded-md hover:bg-muted/50 w-full">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-full">
                      <PlusIcon />
                    </div>
                    <span className="font-medium tracking-wide">Develop</span>
                  </button>
                </CreatePostModal>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 text-muted-foreground hover:text-destructive transition-colors p-2 -mx-2 rounded-md hover:bg-muted/50 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium tracking-wide">Log Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block text-center bg-primary text-primary-foreground px-4 py-2 font-medium tracking-wide hover:bg-primary/90 transition-colors rounded-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 min-w-0 max-w-full">{children}</main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl z-50 flex justify-around items-center h-16 px-4">
        <MobileNavLink href="/" icon={<Home className="w-6 h-6" />} active={location === "/"} />
        <MobileNavLink href="/discover" icon={<Compass className="w-6 h-6" />} active={location === "/discover"} />
        {user ? (
          <>
            <CreatePostModal>
              <button className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full shadow-lg">
                <PlusIcon />
              </button>
            </CreatePostModal>
            <MobileNavLink
              href={`/profile/${user.id}`}
              icon={<User className="w-6 h-6" />}
              active={location === `/profile/${user.id}`}
            />
            <MobileNavLink
              href="/settings"
              icon={<Settings className="w-6 h-6" />}
              active={location === "/settings"}
            />
          </>
        ) : (
          <MobileNavLink href="/login" icon={<User className="w-6 h-6" />} active={location === "/login"} />
        )}
      </nav>
    </div>
  );
}

function NavLink({
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
      className={`flex items-center gap-4 p-2 -mx-2 rounded-md transition-colors ${
        active ? "text-foreground font-medium bg-muted/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {icon}
      <span className="tracking-wide text-sm uppercase">{label}</span>
    </Link>
  );
}

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
    <Link href={href} className={`p-2 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
      {icon}
    </Link>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
