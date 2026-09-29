/**
 * Input validation.
 *
 * These deliberately mirror `validateEmail` / `validatePassword` in the
 * client's `authService.js` so the user sees the same message whether the
 * client or the server rejects the input. The server copy is the one that
 * actually counts — the client checks exist only to give faster feedback.
 */
import { badRequest } from "./http.js";
import { resolveCountry } from "../../src/data/countries.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function assertEmail(email) {
  const value = String(email ?? "").trim();
  if (!value) throw badRequest("Email is required", "email");
  if (!EMAIL_RE.test(value)) throw badRequest("Enter a valid email address", "email");
  return value.toLowerCase();
}

export function assertPassword(password) {
  if (!password) throw badRequest("Password is required", "password");
  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters", "password");
  }
  if (!/[A-Za-z]/.test(password)) {
    throw badRequest("Password must contain a letter", "password");
  }
  if (!/[0-9]/.test(password)) {
    throw badRequest("Password must contain a number", "password");
  }
  return password;
}

export function assertName(name) {
  const value = String(name ?? "").trim();
  if (!value) throw badRequest("Your name is required", "name");
  if (value.length > 120) throw badRequest("Name is too long", "name");
  return value;
}

export function initialsOf(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Country code is always resolved, never left blank. */
export function assertCountry(code) {
  return resolveCountry(code).code;
}

/** Trim a string field and fall back when absent. */
export function optionalString(value, fallback = "", max = 200) {
  if (value == null) return fallback;
  return String(value).trim().slice(0, max);
}
