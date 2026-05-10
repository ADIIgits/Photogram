/* AuthContext.tsx — global authentication state.
 *
 * How it works:
 *   1. On mount, reads the access token from localStorage.
 *   2. If a token exists, fires GET /auth/me to hydrate the User object.
 *   3. If the /me call fails (token expired / invalid), clears the token.
 *   4. Exposes login(token) — stores the token and re-triggers the /me fetch.
 *   5. Exposes logout() — clears the token and redirects to /login.
 *
 * The token is a short-lived JWT (15 min). Refresh tokens (7 d) are handled
 * automatically by the API client's custom-fetch layer. */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, type User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  /* Track the raw JWT in state — changes here re-trigger the /me query */
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("photogram_access_token"),
  );
  const [, setLocation] = useLocation();

  /* Only fetch /me when a token is present; don't retry on failure */
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  /* Clear invalid/expired tokens silently so the user lands on the login page */
  useEffect(() => {
    if (error) {
      setToken(null);
      localStorage.removeItem("photogram_access_token");
    }
  }, [error]);

  /* Called right after a successful login or OTP verification */
  const login = (newToken: string) => {
    localStorage.setItem("photogram_access_token", newToken);
    setToken(newToken);
  };

  /* Clears session state and navigates away from protected pages */
  const logout = () => {
    localStorage.removeItem("photogram_access_token");
    setToken(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        /* Only show the loading spinner when a token exists but user isn't loaded yet */
        isLoading: !!token && isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* Convenience hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
