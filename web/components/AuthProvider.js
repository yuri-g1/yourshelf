"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { forgetShapes } from "@/lib/shape";

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
      return me;
    } catch (err) {
      setUser(null);
      if (err?.status === 401 || err?.status === 403) writeHint(false);
      return null;
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
    const me = await refresh();
    if (!me) {
      throw Object.assign(new Error("You are signed in, but this browser did not keep the session. Allow cookies for this site and try again."), { status: 0 });
    }
    return me;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    writeHint(false);
    forgetShapes();
    setUser(null);
  }, []);

  const clearUser = useCallback(() => {
    writeHint(false);
    forgetShapes();
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
