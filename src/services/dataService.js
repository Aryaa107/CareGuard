/**
 * CARE DATA SERVICE — the API seam.
 *
 * Every component gets its data through here, never by importing a fixture
 * directly. Each function maps one-to-one onto a MongoDB-backed endpoint;
 * the signatures are unchanged from the localStorage prototype, so nothing
 * above this layer had to change.
 *
 * Error contract: a 404 from the API is re-thrown as an `Error` with
 * `code: 404`, which is what `fetchCareBundle` callers already check for.
 */
import { get, post, patch, del, seg, ApiError } from "../lib/api";

/** Preserve the `err.code` contract callers already rely on. */
function rethrow(err) {
  if (err instanceof ApiError) {
    const wrapped = new Error(err.message);
    wrapped.name = err.name;
    wrapped.code = err.status || err.code || null;
    wrapped.field = err.field;
    throw wrapped;
  }
  throw err;
}

/* ------------------------------------------------------------- care circle */

/**
 * The elderly people this account may see.
 *
 * The server decides this from the caregiver/elderly relationship rows, so a
 * brand new account gets an empty circle and a demo account gets its
 * household. No client-side demo flag is involved any more.
 */
export async function fetchCareCircle(user) {
  if (!user) return [];
  try {
    return await get("/care/care-circle");
  } catch (err) {
    rethrow(err);
  }
}

/** Full dashboard payload for one elderly profile. */
export async function fetchCareBundle(elderlyUserId) {
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/bundle`);
  } catch (err) {
    rethrow(err);
  }
}

/* --------------------------------------------------------- elderly profile */

export async function fetchElderlyProfile(elderlyUserId) {
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/profile`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    rethrow(err);
  }
}

/** Merge-patch the profile. Only the fields present in `patch` change. */
export async function saveElderlyProfile(elderlyUserId, patch) {
  try {
    return await patch(`/care/elderly/${seg(elderlyUserId)}/profile`, patch);
  } catch (err) {
    rethrow(err);
  }
}

/* -------------------------------------------------------------- medication */

/**
 * The medication schedule for a profile.
 *
 * The old prototype needed a `seedList` argument to fall back on; the
 * parameter is still accepted but ignored, because the server is now the
 * single source of truth for the schedule.
 */
export async function fetchMedications(elderlyUserId, seedList) {
  void seedList;
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/medications`);
  } catch (err) {
    rethrow(err);
  }
}

/** Upsert one medication. A body with no `id` creates a new row. */
export async function saveMedication(elderlyUserId, med) {
  try {
    return await post(`/care/elderly/${seg(elderlyUserId)}/medications`, med);
  } catch (err) {
    rethrow(err);
  }
}

export async function deleteMedication(elderlyUserId, medId) {
  try {
    return await del(
      `/care/elderly/${seg(elderlyUserId)}/medications/${seg(medId)}`
    );
  } catch (err) {
    rethrow(err);
  }
}

/* ---------------------------------------------------------------- privacy */

/**
 * Privacy consent record. New profiles start at "emergency-only" location
 * sharing — never full live tracking without an explicit opt-in.
 */
export async function fetchPrivacy(elderlyUserId) {
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/privacy`);
  } catch (err) {
    rethrow(err);
  }
}

export async function savePrivacy(elderlyUserId, patchBody) {
  try {
    return await patch(`/care/elderly/${seg(elderlyUserId)}/privacy`, patchBody);
  } catch (err) {
    rethrow(err);
  }
}

/* -------------------------------------------------------------- care team */

export async function fetchCareTeam(elderlyUserId) {
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/care-team`);
  } catch (err) {
    rethrow(err);
  }
}

/** Invite someone. They land as `pending` until they accept. */
export async function addCaregiver(elderlyUserId, member) {
  try {
    return await post(`/care/elderly/${seg(elderlyUserId)}/care-team`, member);
  } catch (err) {
    rethrow(err);
  }
}

export async function removeCaregiver(elderlyUserId, name) {
  try {
    return await del(
      `/care/elderly/${seg(elderlyUserId)}/care-team/${seg(name)}`
    );
  } catch (err) {
    rethrow(err);
  }
}

/** The permission matrix write. */
export async function updatePermissions(elderlyUserId, memberName, access) {
  try {
    return await patch(
      `/care/elderly/${seg(elderlyUserId)}/care-team/${seg(memberName)}`,
      { access }
    );
  } catch (err) {
    rethrow(err);
  }
}

/* ------------------------------------------------------------------ alerts */

export async function fetchAlerts(elderlyUserId) {
  try {
    return await get(`/care/elderly/${seg(elderlyUserId)}/alerts`);
  } catch (err) {
    rethrow(err);
  }
}

/** Create an alert — used by the SOS flow. */
export async function createAlert(elderlyUserId, alert) {
  try {
    return await post(`/care/elderly/${seg(elderlyUserId)}/alerts`, alert);
  } catch (err) {
    rethrow(err);
  }
}

export async function markAlertRead(elderlyUserId, alertId, read = true) {
  try {
    return await patch(
      `/care/elderly/${seg(elderlyUserId)}/alerts/${seg(alertId)}`,
      { read }
    );
  } catch (err) {
    rethrow(err);
  }
}

export async function markAllAlertsRead(elderlyUserId) {
  try {
    return await post(`/care/elderly/${seg(elderlyUserId)}/alerts/read-all`);
  } catch (err) {
    rethrow(err);
  }
}

export async function clearAlert(elderlyUserId, alertId) {
  try {
    return await del(`/care/elderly/${seg(elderlyUserId)}/alerts/${seg(alertId)}`);
  } catch (err) {
    rethrow(err);
  }
}

/* --------------------------------------------------------------- settings */

/** UI preferences. Null when the account has never saved any. */
export async function fetchSettings(userId) {
  void userId;
  try {
    return await get("/care/settings");
  } catch (err) {
    rethrow(err);
  }
}

export async function saveSettings(userId, patchBody) {
  void userId;
  try {
    return await patch("/care/settings", patchBody);
  } catch (err) {
    rethrow(err);
  }
}

/* ---------------------------------------------------------- demo plumbing */

/**
 * Placeholder bundle for an elderly person added through the UI. It has no
 * vitals at all on purpose: a person added locally is not wired to any device,
 * and inventing readings for them would be misleading.
 */
export function pendingSetupBundle(name) {
  return {
    simulated: true,
    pendingSetup: true,
    profile: {
      id: null,
      name,
      shortName: name.split(/\s+/)[0],
      avatar: name.trim().slice(0, 2).toUpperCase(),
      age: null,
      conditions: [],
      allergies: [],
      zones: ["Home"],
      device: { name: "Not paired", serial: "—", battery: null, charging: false, signal: "None" },
    },
    snapshot: null,
    vitals: null,
    stats: [],
    medications: [],
    initialAlerts: [],
    careTeam: [],
  };
}
