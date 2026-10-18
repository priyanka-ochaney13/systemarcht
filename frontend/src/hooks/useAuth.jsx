"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { authFetch } from "@/lib/authFetch";
import { useHydrated } from "@/hooks/useHydrated";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const hydrated = useHydrated();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const profileRequest = useRef(0);

  const refreshUser = useCallback(async () => {
    const requestId = ++profileRequest.current;
    if (!auth?.currentUser) {
      setUser(null);
      setError("");
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const profile = await authFetch("/api/auth/me");
      if (requestId === profileRequest.current) setUser(profile);
      return profile;
    } catch (requestError) {
      if (requestId === profileRequest.current) {
        setUser(null);
        setError(requestError.message || "Could not load your account.");
      }
      throw requestError;
    } finally {
      if (requestId === profileRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      const requestId = ++profileRequest.current;
      setLoading(true);
      setError("");

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await authFetch("/api/auth/me");
        if (active && requestId === profileRequest.current) setUser(profile);
      } catch (requestError) {
        if (active && requestId === profileRequest.current) {
          setUser(null);
          setError(requestError.message || "Could not load your account.");
        }
      } finally {
        if (active && requestId === profileRequest.current) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    profileRequest.current += 1;
    await firebaseSignOut(auth);
    setUser(null);
    setError("");
  }, []);

  const updateProfile = useCallback(async (displayName) => {
    const requestId = ++profileRequest.current;
    const updated = await authFetch("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName }),
    });
    if (requestId === profileRequest.current) {
      setUser(updated);
      setError("");
    }
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        loading,
        error,
        configured: firebaseConfigured,
        refreshUser,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
