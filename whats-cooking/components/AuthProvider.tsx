import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthSession,
  getSession,
  loadSession,
  signOut as authSignOut,
  subscribe,
} from "@/services/auth";

interface AuthContextValue {
  /** The current session, or null when signed out. */
  session: AuthSession | null;
  /** True until the persisted session has been read from disk once. */
  initializing: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribe(setSession);
    void loadSession().finally(() => setInitializing(false));
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, initializing, signOut: authSignOut }),
    [session, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
