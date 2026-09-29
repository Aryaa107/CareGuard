/**
 * AUTHENTICATION SERVICE — talks to the CareGuard API.
 *
 * Passwords are hashed with bcrypt on the server and the plaintext never
 * leaves this module. The browser only ever holds an opaque session token
 * (see storageService.js), so there is no account database in the client to
 * tamper with.
 *
 * The exported signatures are unchanged from the old localStorage version, so
 * the UI does not care that the backing store moved to MongoDB.
 */
import { get, post, patch, ApiError } from "../lib/api";
import { getSession, saveSession, clearSession } from "./storageService";
import { DEMO_USERS, DEMO_CREDENTIALS } from "../data/demoProfiles.js";

/**
 * A form-facing error. `field` targets a specific input, matching what the
 * form components already expect from the old mock service.
 */
export class AuthError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "AuthError";
    this.field = field;
  }
}

/** Re-shape an API failure into the error the login/register forms expect. */
function toAuthError(err) {
  if (err instanceof AuthError) return err;
  return new AuthError(err?.message || "Something went wrong", err?.field ?? null);
}

/* --------------------------------------------------------------- validation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Client-side checks mirror the server's so the user gets immediate feedback.
 * The server enforces the same rules regardless — this is convenience, not
 * security.
 */
export function validateEmail(email) {
  if (!email?.trim()) return "Email is required";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address";
  return null;
}

export function validatePassword(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain a letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

/* ------------------------------------------------------------------ session */

/**
 * Restore a session on boot.
 * Returns `{ user, session }` or null. The server is the authority: the token
 * is verified against the `sessions` collection, so a token that was revoked
 * or expired elsewhere does not come back.
 */
export async function restoreSession() {
  let result;
  try {
    result = await get("/auth/me");
  } catch (err) {
    // A server that is down should not look like "signed out" — but there is
    // nothing useful to do here either, so drop to the sign-in screen.
    if (err instanceof ApiError) clearSession();
    return null;
  }

  if (!result?.user) {
    clearSession();
    return null;
  }

  // The stored session is the one that actually works; keep it.
  if (result.session) saveSession(result.session);
  return result;
}

/* ------------------------------------------------------------------ actions */

/** Sign in. Throws AuthError with `field` set on validation failures. */
export async function login(email, password) {
  const emailProblem = validateEmail(email);
  if (emailProblem) throw new AuthError(emailProblem, "email");
  if (!password) throw new AuthError("Password is required", "password");

  try {
    const { user, session } = await post("/auth/login", { email, password });
    saveSession(session);
    return { user, session };
  } catch (err) {
    throw toAuthError(err);
  }
}

/**
 * Create an account. A new account starts with an empty care circle — no demo
 * health data is attached unless the caller explicitly opted into it.
 */
export async function register(payload) {
  const {
    name,
    email,
    password,
    confirmPassword,
    country,
    timezone,
    locale,
    phone,
    role,
    includeDemoData,
  } = payload ?? {};

  if (!name?.trim()) throw new AuthError("Your name is required", "name");

  const emailProblem = validateEmail(email);
  if (emailProblem) throw new AuthError(emailProblem, "email");

  const pwProblem = validatePassword(password);
  if (pwProblem) throw new AuthError(pwProblem, "password");

  if (confirmPassword !== undefined && confirmPassword !== password) {
    throw new AuthError("Passwords do not match", "confirmPassword");
  }

  try {
    const { user, session } = await post("/auth/register", {
      name,
      email,
      password,
      confirmPassword,
      country,
      timezone,
      locale,
      phone,
      role,
      includeDemoData,
    });
    saveSession(session);
    return { user, session };
  } catch (err) {
    throw toAuthError(err);
  }
}

/** Sign out. Revokes the token server-side, then clears it locally. */
export async function logout() {
  try {
    await post("/auth/logout");
  } catch {
    // Even if the call fails, the local token is going away — a user asking to
    // sign out must end up signed out.
  }
  clearSession();
  return { ok: true };
}

/** Edit own profile. Returns the updated public user. */
export async function updateOwnProfile(userId, patchBody) {
  try {
    return await patch("/auth/me", patchBody);
  } catch (err) {
    throw toAuthError(err);
  }
}

/**
 * Change password. The server revokes every other session and re-issues this
 * one, so the response carries a fresh session worth persisting.
 */
export async function changePassword(userId, current, next) {
  const problem = validatePassword(next);
  if (problem) throw new AuthError(problem, "next");

  try {
    const result = await post("/auth/change-password", { current, next });
    if (result?.session) saveSession(result.session);
    return { ok: true };
  } catch (err) {
    throw toAuthError(err);
  }
}

/** Whether this browser already holds a token (used to skip the login screen). */
export function hasStoredSession() {
  return Boolean(getSession()?.token);
}

/** Sample accounts shown on the sign-in screen, clearly labelled as samples. */
export const DEMO_LOGIN_HINTS = DEMO_CREDENTIALS.map((c) => {
  const user = DEMO_USERS.find((u) => u.email === c.email);
  return { email: c.email, password: c.password, name: user?.name, role: user?.role };
});
