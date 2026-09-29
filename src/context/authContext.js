import { createContext, useContext } from "react";

/**
 * Session state for the whole app.
 *
 * `status` is one of:
 *   "loading"   — checking a stored token on boot, render the splash
 *   "authed"    — a verified user is signed in
 *   "anonymous" — no valid session, render the sign-in screen
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
