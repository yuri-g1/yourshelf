"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const HINT_KEY = "yourshelf:signed-in";

function readHint() {
  try {
    return localStorage.getItem(HINT_KEY) || "0";
  } catch {
    return "0";
  }
}

function writeHint(signedIn) {
  try {
    localStorage.setItem(HINT_KEY, signedIn ? "1" : "0");
  } catch {}
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const me = await api("/me");
      setUser(me);
      writeHint(true);
    } catch {
      setUser(null);
      writeHint(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHint(readHint());
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (mode, credentials) => {
    const path = mode === "signup" ? "/auth/signup" : "/auth/login";
    await api(path, { method: "POST", body: credentials });
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    writeHint(false);
    setUser(null);
  }, []);

  const clearUser = useCallback(() => {
    writeHint(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hint, refresh, signIn, signOut, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
