/**
 * HTTP client for the CareGuard API.
 *
 * This is the only place the app talks to the network. Every service in
 * `src/services` goes through `request`, so authentication, error shaping and
 * session expiry are handled in one place instead of at each call site.
 *
 * The base URL is relative by default, which means the Vite dev proxy forwards
 * to the API and the browser sees a single origin — no CORS preflight and no
 * credentials on cross-site requests. Set `VITE_API_BASE` only when the API is
 * genuinely hosted elsewhere.
 */
import { getSessionToken, clearSession } from "../services/storageService";

const BASE = (import.meta.env?.VITE_API_BASE || "").replace(/\/$/, "");

/** An error carrying the HTTP status and any field the server flagged. */
export class ApiError extends Error {
  constructor(message, { status = 0, field = null, code = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.code = code;
  }
}

/* ------------------------------------------------------- session expiry */

const EXPIRED_EVENT = "careguard:session-expired";

/** Notified when the server rejects the stored token. */
export function onSessionExpired(handler) {
  window.addEventListener(EXPIRED_EVENT, handler);
  return () => window.removeEventListener(EXPIRED_EVENT, handler);
}

function announceExpiry() {
  clearSession();
  window.dispatchEvent(new CustomEvent(EXPIRED_EVENT));
}

/* ----------------------------------------------------------------- request */

/**
 * Perform one API call.
 *
 * On a 401 the stored token is dropped and an event is dispatched, so the app
 * can fall back to the sign-in screen from anywhere without every caller
 * having to handle the expired case.
 */
export async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    // A network failure is distinct from a server error, and the UI needs to
    // be able to say so rather than showing a blank screen.
    throw new ApiError("Cannot reach the CareGuard server. Is the API running?", {
      status: 0,
    });
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    if (response.status === 401 && auth) announceExpiry();
    throw new ApiError(message, {
      status: response.status,
      field: payload?.field ?? null,
      code: payload?.code ?? null,
    });
  }

  return payload;
}

export const get = (path, options) => request(path, { ...options, method: "GET" });
export const post = (path, body, options) =>
  request(path, { ...options, method: "POST", body: body ?? {} });
export const patch = (path, body, options) =>
  request(path, { ...options, method: "PATCH", body: body ?? {} });
export const del = (path, options) => request(path, { ...options, method: "DELETE" });

/** Percent-encode a path segment. Names can contain spaces ("Rohit Menon"). */
export const seg = (value) => encodeURIComponent(String(value));
