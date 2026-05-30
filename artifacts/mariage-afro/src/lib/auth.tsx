import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: number;
  email: string;
  role: "client" | "vendor";
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, expectedRole?: "client" | "vendor") => Promise<void>;
  register: (email: string, password: string, role?: "client" | "vendor") => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Une erreur est survenue.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const queryClient = useQueryClient();

  const fetchMe = useCallback(async () => {
    try {
      const user = await apiFetch("/api/auth/me");
      setState({ user, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

  const login = useCallback(async (email: string, password: string, expectedRole?: "client" | "vendor") => {
    await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, ...(expectedRole ? { expectedRole } : {}) }) });
    await fetchMe();
  }, [fetchMe]);

  const register = useCallback(async (email: string, password: string, role: "client" | "vendor" = "client") => {
    await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, role }) });
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState({ user: null, loading: false });
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return { user, isSignedIn: !!user };
}
