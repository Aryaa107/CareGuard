import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { login, register, logout, restoreSession } from "../services/authService";
import { onSessionExpired } from "../lib/api";

/**
 * Owns the signed-in user for the whole app.
 *
 * On boot it asks the server whether the stored token is still valid rather
 * than trusting it locally, so a session revoked from another device stops
 * working immediately.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const restored = await restoreSession();
      if (cancelled) return;
      setUser(restored?.user ?? null);
      setStatus(restored?.user ? "authed" : "anonymous");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The API client dispatches this when the server rejects our token, so an
  // expiry anywhere in the app drops straight back to the sign-in screen.
  useEffect(() => onSessionExpired(() => {
    setUser(null);
    setStatus("anonymous");
  }), []);

  const signIn = useCallback(async (email, password) => {
    const { user: signedIn } = await login(email, password);
    setUser(signedIn);
    setStatus("authed");
    return signedIn;
  }, []);

  const signUp = useCallback(async (payload) => {
    const { user: created } = await register(payload);
    setUser(created);
    setStatus("authed");
    return created;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authed" && Boolean(user),
      isElderly: user?.role === "elderly",
      signIn,
      signUp,
      signOut,
    }),
    [user, status, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
