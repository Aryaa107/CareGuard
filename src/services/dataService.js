/**
 * CARE DATA SERVICE — the API seam.
 *
 * Every component gets its data through here, never by importing a fixture
 * directly. Today every function resolves from local mock data; when the
 * FastAPI backend lands only the bodies change (GET /care-circle, GET
 * /elderly/{id}/bundle, PATCH /privacy/...). Signatures stay the same.
 *
 * Everything returned is SIMULATED demo content — see data/simulatedData.js.
 */
import { readJSON, writeJSON, KEYS } from "./storageService";
import {
  ELDERLY_PROFILES,
  relationshipsFor,
  findProfileById,
  teamFor,
  defaultPrivacy,
} from "../data/demoProfiles";
import { buildCareBundle } from "../data/simulatedData";

/**
 * Small artificial delay so loading states are real and exercised during the
 * prototype. Delete once a network call provides genuine latency.
 */
function withLatency(value, ms = 220) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredCloneSafe(value)), ms);
  });
}

/** Guard against callers mutating the module-level fixtures. */
function structuredCloneSafe(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

/* ------------------------------------------------------------- care circle */

/**
 * The elderly people this account may see (Part 7 "My Care Circle").
 *
 * Accounts created through Register start with an EMPTY circle. Demo accounts —
 * and registrations that explicitly opted into the sample dataset — get the
 * labelled fixtures from data/demoProfiles.js.
 */
export async function fetchCareCircle(user) {
  if (!user) return withLatency([]);

  const wantsDemo = Boolean(user.demo) || Boolean(user.includeDemoData);
  if (!wantsDemo) return withLatency([], 320);

  const rows = relationshipsFor(user.id).map((rel) => {
    const profile = findProfileById(rel.elderlyUserId);
    if (!profile) return null;
    return {
      elderlyUserId: profile.id,
      name: profile.name,
      shortName: profile.shortName,
      avatar: profile.avatar,
      age: profile.age,
      relationship: rel.relationship,
      isPrimary: rel.isPrimary,
      status: profile.status,
      country: profile.country,
      timezone: profile.timezone,
    };
  });

  return withLatency(rows.filter(Boolean));
}

/** Full simulated dashboard payload for one elderly profile (Part 11/12). */
export async function fetchCareBundle(elderlyUserId) {
  const profile = findProfileById(elderlyUserId);
  if (!profile) {
    const err = new Error("Elderly profile not found");
    err.code = 404;
    throw err;
  }
  return withLatency(buildCareBundle(profile));
}

/* --------------------------------------------------------- elderly profile */

/** Saved edits layered over the demo fixture so profile edits survive reloads. */
function profileOverrides() {
  return readJSON(KEYS.profiles, {}) || {};
}

export async function fetchElderlyProfile(elderlyUserId) {
  const base = findProfileById(elderlyUserId);
  if (!base) return withLatency(null);
  return withLatency({ ...base, ...(profileOverrides()[elderlyUserId] || {}) });
}

export async function saveElderlyProfile(elderlyUserId, patch) {
  const all = profileOverrides();
  all[elderlyUserId] = { ...(all[elderlyUserId] || {}), ...patch };
  writeJSON(KEYS.profiles, all);
  const base = findProfileById(elderlyUserId);
  return withLatency({ ...base, ...all[elderlyUserId] }, 180);
}

/* -------------------------------------------------------------- medication */

/**
 * Medication CRUD. The simulated bundle seeds the list; user edits are stored
 * as a per-profile override so the schedule persists across reloads.
 */
function medOverrides() {
  return readJSON(KEYS.medications, {}) || {};
}

export async function fetchMedications(elderlyUserId, seedList) {
  const saved = medOverrides()[elderlyUserId];
  return withLatency(Array.isArray(saved) ? saved : structuredCloneSafe(seedList), 160);
}

export async function saveMedication(elderlyUserId, med) {
  const all = medOverrides();
  const list = Array.isArray(all[elderlyUserId]) ? all[elderlyUserId] : [];

  if (med.id) {
    const idx = list.findIndex((m) => m.id === med.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...med };
    else list.push(med);
  } else {
    list.push({ ...med, id: Date.now() });
  }

  all[elderlyUserId] = list;
  writeJSON(KEYS.medications, all);
  return withLatency(list, 160);
}

export async function deleteMedication(elderlyUserId, medId) {
  const all = medOverrides();
  const list = Array.isArray(all[elderlyUserId]) ? all[elderlyUserId] : [];
  all[elderlyUserId] = list.filter((m) => m.id !== medId);
  writeJSON(KEYS.medications, all);
  return withLatency(all[elderlyUserId], 160);
}

/* ---------------------------------------------------------------- privacy */

/**
 * Privacy consent record (Part 16). New profiles start at "emergency-only"
 * location sharing — never full live tracking by default.
 */
export async function fetchPrivacy(elderlyUserId) {
  const saved = readJSON(KEYS.privacy, {}) || {};
  return withLatency(saved[elderlyUserId] || defaultPrivacy(elderlyUserId), 140);
}

export async function savePrivacy(elderlyUserId, patch) {
  const all = readJSON(KEYS.privacy, {}) || {};
  const next = { ...(all[elderlyUserId] || defaultPrivacy(elderlyUserId)), ...patch, elderlyUserId };
  all[elderlyUserId] = next;
  writeJSON(KEYS.privacy, all);
  return withLatency(next, 160);
}

/* ------------------------------------------------------------ care team */

/**
 * Care team for one elderly profile (Part 13). Demo rosters can be extended and
 * trimmed; changes persist locally.
 */
export async function fetchCareTeam(elderlyUserId) {
  const saved = readJSON(KEYS.relationships, {}) || {};
  const override = saved[elderlyUserId];
  return withLatency(Array.isArray(override) ? override : teamFor(elderlyUserId), 160);
}

export async function addCaregiver(elderlyUserId, member) {
  const all = readJSON(KEYS.relationships, {}) || {};
  const base = Array.isArray(all[elderlyUserId]) ? all[elderlyUserId] : teamFor(elderlyUserId);
  const next = [
    ...base,
    {
      name: member.name,
      relation: member.relation || "Family",
      role: member.role || "Co-caregiver",
      access: member.access?.length ? member.access : ["SOS"],
      status: "offline",
      lastSeen: "Just invited",
      phone: member.phone || "",
      avatar: member.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join(""),
      pending: true,
    },
  ];
  all[elderlyUserId] = next;
  writeJSON(KEYS.relationships, all);
  return withLatency(next, 200);
}

export async function removeCaregiver(elderlyUserId, name) {
  const all = readJSON(KEYS.relationships, {}) || {};
  const base = Array.isArray(all[elderlyUserId]) ? all[elderlyUserId] : teamFor(elderlyUserId);
  const next = base.filter((m) => m.name !== name);
  all[elderlyUserId] = next;
  writeJSON(KEYS.relationships, all);
  return withLatency(next, 160);
}

/** Permission matrix write (Part 14). */
export async function updatePermissions(elderlyUserId, memberName, access) {
  const all = readJSON(KEYS.relationships, {}) || {};
  const base = Array.isArray(all[elderlyUserId]) ? all[elderlyUserId] : teamFor(elderlyUserId);
  const next = base.map((m) => (m.name === memberName ? { ...m, access } : m));
  all[elderlyUserId] = next;
  writeJSON(KEYS.relationships, all);
  return withLatency(next, 140);
}

/* --------------------------------------------------------------- settings */

/** UI preferences (units, alerts, accessibility) persisted per browser. */
export async function fetchSettings(userId) {
  const all = readJSON(KEYS.settings, {}) || {};
  return withLatency(all[userId] || null, 120);
}

export async function saveSettings(userId, patch) {
  const all = readJSON(KEYS.settings, {}) || {};
  const next = { ...(all[userId] || {}), ...patch };
  all[userId] = next;
  writeJSON(KEYS.settings, all);
  return withLatency(next, 120);
}

/* ---------------------------------------------------------- demo plumbing */

/** Whether a given demo profile exists — used to gate the empty-state screen. */
export function knownProfileIds() {
  return ELDERLY_PROFILES.map((p) => p.id);
}

/**
 * Placeholder bundle for an elderly person added through the UI. It has no
 * vitals at all on purpose: a person added locally is not wired to any device,
 * and inventing readings for them would be misleading (Part 11).
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
