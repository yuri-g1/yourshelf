"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api("/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (mode, credentials) => {
    const path = mode === "signup" ? "/auth/signup" : "/auth/login";
    await api(path, { method: "POST", body: credentials });
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
