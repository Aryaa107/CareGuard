/**
 * Namespaced persistence wrapper.
 *
 * The ONLY place in the app that talks to localStorage. Swapping in IndexedDB,
 * an offline queue, or removing persistence entirely (once a real session API
 * exists) happens here without touching the services or components.
 *
 * Every read is defensive: private-browsing mode and disabled storage both
 * degrade to an in-memory map so the app never crashes on a read.
 */
const NAMESPACE = "careguard.v1.";

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

function key(name) {
  return `${NAMESPACE}${name}`;
}

export function readJSON(name, fallback = null) {
  try {
    const raw = store ? store.getItem(key(name)) : memory.get(key(name));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(name, value) {
  const raw = JSON.stringify(value);
  try {
    if (store) store.setItem(key(name), raw);
    else memory.set(key(name), raw);
    return true;
  } catch {
    memory.set(key(name), raw);
    return false;
  }
}

export function remove(name) {
  try {
    if (store) store.removeItem(key(name));
    else memory.delete(key(name));
  } catch {
    memory.delete(key(name));
  }
}

/** True when data genuinely survives a reload — shown honestly in Settings. */
export function isPersistent() {
  return Boolean(store);
}

/** Wipe every CareGuard key. Used by the Settings "reset local data" action. */
export function clearAll() {
  Object.values(KEYS).forEach(remove);
  if (!store) memory.clear();
}

export const KEYS = {
  session: "session",
  users: "users",
  profiles: "profiles",
  relationships: "relationships",
  medications: "medications",
  privacy: "privacy",
  incidents: "incidents",
  settings: "settings",
};
