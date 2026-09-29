/**
 * Session token storage.
 *
 * The ONLY place in the app that touches localStorage.
 *
 * It now holds exactly one thing: the opaque session token returned by the
 * API. That is the only state a browser needs to keep — every other record
 * lives in MongoDB and is fetched over the network.
 *
 * The token is deliberately NOT the account. It is a random server-issued
 * string that is meaningless on its own: the server matches it against the
 * `sessions` collection to decide who the caller is. A user who clears storage
 * simply signs in again.
 *
 * Reads are defensive: private-browsing mode and blocked storage both degrade
 * to an in-memory store so the app still runs for the current tab.
 */
const NAMESPACE = "careguard.v1.";
const SESSION_KEY = `${NAMESPACE}session`;

/** Fallback when storage is unavailable (Safari private mode, blocked cookies). */
const memory = new Map();

function backend() {
  try {
    const probe = "__careguard_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const store = backend();

function readRaw(key) {
  try {
    return store ? store.getItem(key) : memory.get(key);
  } catch {
    return memory.get(key);
  }
}

function writeRaw(key, value) {
  try {
    if (store) store.setItem(key, value);
    else memory.set(key, value);
    return true;
  } catch {
    // Quota or private-mode failure: keep it for this tab at least.
    memory.set(key, value);
    return false;
  }
}

/**
 * The stored session `{ token, userId, issuedAt, expiresAt }`, or null.
 * Anything unparseable is treated as "no session" rather than crashing.
 */
export function getSession() {
  const raw = readRaw(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    // The client checks the clock too, so an expired token is never sent.
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session) {
  if (!session?.token) return false;
  return writeRaw(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  try {
    if (store) store.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  memory.delete(SESSION_KEY);
}

/** Just the bearer token, or null. Used by the API client. */
export function getSessionToken() {
  return getSession()?.token ?? null;
}

/** True when the token genuinely survives a reload — shown honestly in Settings. */
export function isPersistent() {
  return Boolean(store);
}

/** Wipe every CareGuard key. Used by the Settings "reset local data" action. */
export function clearAll() {
  clearSession();
  if (!store) memory.clear();
}

export const KEYS = {
  session: SESSION_KEY,
};
