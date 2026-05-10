/* App.tsx — root component.
 * Sets up all global providers in the correct nesting order:
 *   ThemeProvider  — dark/light mode, applies class to <html>
 *   QueryClientProvider — TanStack Query cache shared across the app
 *   TooltipProvider — Radix tooltip context
 *   WouterRouter   — client-side routing (hash-less, base-URL aware)
 *   AuthProvider   — current user session, login/logout helpers
 *   Router         — maps URL paths to page components
 *   Toaster        — global toast notification overlay */

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context";
import { ThemeProvider } from "@/contexts/ThemeContext";

import LoginPage from "@/features/auth/LoginPage";
import SignupPage from "@/features/auth/SignupPage";
import HomePage from "@/features/posts/HomePage";
import PostDetailPage from "@/features/posts/PostDetailPage";
import DiscoverPage from "@/features/discover/DiscoverPage";
import ProfilePage from "@/features/profile/ProfilePage";
import SettingsPage from "@/features/settings/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

/* Single QueryClient instance shared across the entire app.
 * retry: false — show errors immediately without silent retries.
 * refetchOnWindowFocus: false — don't re-fetch when the tab regains focus. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/* Router maps URL paths to lazy-loaded page components */
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/profile/:id" component={ProfilePage} />
      <Route path="/post/:id" component={PostDetailPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    /* ThemeProvider must be outermost so all children can read/toggle theme */
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* base strips trailing slash from Vite's BASE_URL (e.g. "/") */}
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
              <Toaster />
            </AuthProvider>
          </WouterRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
