import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiRequest } from "./api";
import { AuthContext, type User } from "./auth-context";

type AuthResponse = { user: User };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<AuthResponse>("/api/auth/session")
      .then((response) => setUser(response.user))
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error("Session check failed");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        const response = await apiRequest<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(response.user);
      },
      async register(email: string, password: string) {
        const response = await apiRequest<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(response.user);
      },
      async logout() {
        await apiRequest<void>("/api/auth/logout", { method: "POST" });
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
