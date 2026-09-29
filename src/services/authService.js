/**
 * MOCK AUTHENTICATION SERVICE — prototype only.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ THIS IS NOT REAL SECURITY. Do not ship it.                              │
 * │                                                                         │
 * │ There is no server: accounts live in localStorage and passwords are     │
 * │ stored as a salted SHA-256 digest (lib/mockPassword.js) purely so the   │
 * │ browser never writes a plaintext password to disk. A digest is not a    │
 * │ KDF — it is fast and unsalted across accounts, which is exactly why a   │
 * │ real deployment must verify credentials server-side.                    │
 * │                                                                         │
 * │ Production swap (Part 2): replace the bodies of login/register/restore  │
 * │ with calls to FastAPI (OAuth2 password flow or JWT) or Firebase Auth.   │
 * │ The exported signatures are what the UI depends on, so they stay.       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
import { readJSON, writeJSON, KEYS } from "./storageService";
import { hashPassword, verifyPassword, makeSalt } from "../lib/mockPassword";
import { DEMO_USERS, DEMO_CREDENTIALS } from "../data/demoProfiles";
import { resolveCountry } from "../data/countries";

/** Mock bearer token. A real backend returns a signed JWT here instead. */
function mintToken(userId) {
  return `mock.${userId}.${Date.now().toString(36)}`;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h, mirroring a real short-lived token

export class AuthError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "AuthError";
    this.field = field;
  }
}

/* --------------------------------------------------------------- user store */

let seeded = null;

/** Records shaped as the intended `users` table. Demo rows are flagged. */
function userTable() {
  if (seeded) return seeded;
  const stored = readJSON(KEYS.users, null);
  if (Array.isArray(stored) && stored.length) {
    seeded = stored;
    return seeded;
  }
  seeded = [];
  writeJSON(KEYS.users, seeded);
  return seeded;
}

/**
 * Seed the labelled demo accounts on first run. Passwords are hashed at seed
 * time, so the plaintext only ever exists in source, never in storage.
 */
export async function seedDemoUsers(force = false) {
  const table = userTable();
  const alreadySeeded = table.some((u) => u.demo);
  if (alreadySeeded && !force) return table;

  const byEmail = DEMO_CREDENTIALS.reduce((acc, c) => {
    acc[c.email.toLowerCase()] = c.password;
    return acc;
  }, {});

  const fresh = [];
  for (const u of DEMO_USERS) {
    const password = byEmail[u.email];
    if (!password) continue;
    if (table.some((t) => t.email === u.email)) continue;
    const salt = makeSalt();
    fresh.push({
      ...u,
      demo: true,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: await hashPassword(password, salt),
    });
  }

  seeded = [...table, ...fresh];
  writeJSON(KEYS.users, seeded);
  return seeded;
}

function findStoredUser(email) {
  const needle = String(email || "").trim().toLowerCase();
  return userTable().find((u) => u.email.toLowerCase() === needle) || null;
}

function persistUser(user) {
  const table = userTable();
  const idx = table.findIndex((u) => u.id === user.id);
  if (idx >= 0) table[idx] = user;
  else table.push(user);
  writeJSON(KEYS.users, table);
}

/** Strip secrets before anything reaches React state. */
export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...rest } = user;
  return rest;
}

/* ------------------------------------------------------------------ session */

function buildSession(user) {
  const now = Date.now();
  return {
    token: mintToken(user.id),
    userId: user.id,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    mock: true,
  };
}

function saveSession(session) {
  writeJSON(KEYS.session, session);
}

/**
 * Restore a session on boot. Returns { user, session } or null.
 * A real client would refresh an expired JWT here instead of dropping it.
 */
export async function restoreSession() {
  await seedDemoUsers();
  const session = readJSON(KEYS.session, null);
  if (!session?.userId) return null;
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    writeJSON(KEYS.session, null);
    return null;
  }
  const user = userTable().find((u) => u.id === session.userId);
  if (!user) return null;
  return { user: toPublicUser(user), session };
}

/* ------------------------------------------------------------------ actions */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email) {
  if (!email?.trim()) return "Email is required";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address";
  return null;
}

/**
 * Deliberately simple rules — a real deployment enforces these server-side and
 * feeds a strength meter from a vetted policy.
 */
export function validatePassword(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain a letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

/** MOCK login: verify against the local digest. Async to mirror a real call. */
export async function login(email, password) {
  const emailProblem = validateEmail(email);
  if (emailProblem) throw new AuthError(emailProblem, "email");
  if (!password) throw new AuthError("Password is required", "password");

  await seedDemoUsers();
  const user = findStoredUser(email);
  // Identical message for unknown email and wrong password: no enumeration.
  if (!user) throw new AuthError("Incorrect email or password", "password");

  const ok = await verifyPassword(password, user.salt, user.passwordHash);
  if (!ok) throw new AuthError("Incorrect email or password", "password");

  const session = buildSession(user);
  saveSession(session);
  return { user: toPublicUser(user), session };
}

/**
 * MOCK sign-up. Creates a local account with an EMPTY care circle — no fake
 * health data is attached unless the caller explicitly asked for the labelled
 * demo dataset (Part 6: demo data stays separate and clearly labelled).
 */
export async function register(payload) {
  const { name, email, password, confirmPassword, country, timezone, locale, phone, role, includeDemoData } = payload;

  if (!name?.trim()) throw new AuthError("Your name is required", "name");
  const emailProblem = validateEmail(email);
  if (emailProblem) throw new AuthError(emailProblem, "email");
  const pwProblem = validatePassword(password);
  if (pwProblem) throw new AuthError(pwProblem, "password");
  if (confirmPassword !== undefined && confirmPassword !== password) {
    throw new AuthError("Passwords do not match", "confirmPassword");
  }
  if (findStoredUser(email)) throw new AuthError("An account with this email already exists", "email");

  const resolved = resolveCountry(country);
  const salt = makeSalt();
  const user = {
    id: `user-${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role === "elderly" ? "elderly" : "caregiver",
    country: resolved.code,
    timezone: timezone || resolved.timezone,
    locale: locale || resolved.locale,
    phone: phone?.trim() || "",
    avatar: name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(""),
    demo: false,
    includeDemoData: Boolean(includeDemoData),
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(password, salt),
  };

  persistUser(user);
  const session = buildSession(user);
  saveSession(session);
  return { user: toPublicUser(user), session };
}

/** Mock sign-out: drop the local session, leave account data in place. */
export async function logout() {
  writeJSON(KEYS.session, null);
  return { ok: true };
}

/** Part 17 — edit own profile. Returns the updated public user. */
export async function updateOwnProfile(userId, patch) {
  const table = userTable();
  const user = table.find((u) => u.id === userId);
  if (!user) throw new AuthError("Account not found");

  if (patch.email) {
    const problem = validateEmail(patch.email);
    if (problem) throw new AuthError(problem, "email");
    const clash = findStoredUser(patch.email);
    if (clash && clash.id !== userId) throw new AuthError("That email is already in use", "email");
  }

  Object.assign(user, patch);
  writeJSON(KEYS.users, table);
  return toPublicUser(user);
}

/** Mock password change. A real flow posts to the backend and rotates tokens. */
export async function changePassword(userId, current, next) {
  const table = userTable();
  const user = table.find((u) => u.id === userId);
  if (!user) throw new AuthError("Account not found");

  const ok = await verifyPassword(current, user.salt, user.passwordHash);
  if (!ok) throw new AuthError("Current password is incorrect", "current");

  const problem = validatePassword(next);
  if (problem) throw new AuthError(problem, "next");

  user.salt = makeSalt();
  user.passwordHash = await hashPassword(next, user.salt);
  writeJSON(KEYS.users, table);
  saveSession(buildSession(user));
  return { ok: true };
}

/** Sample accounts shown on the sign-in screen, clearly labelled as samples. */
export const DEMO_LOGIN_HINTS = DEMO_CREDENTIALS.map((c) => {
  const user = DEMO_USERS.find((u) => u.email === c.email);
  return { email: c.email, password: c.password, name: user?.name, role: user?.role };
});
