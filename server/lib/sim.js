/**
 * Bridge between the stored profile and the shared simulation builder.
 *
 * The generated vitals, trends, zones and report all live in
 * `src/data/simulatedData.js`, which is plain ESM with no browser APIs — the
 * server imports the same module the client would. That keeps one source of
 * truth for how demo data is produced instead of a second copy on the server.
 *
 * What MongoDB genuinely owns is the mutable part: profile edits,
 * medications, care-team membership, alerts and manual readings. Those are
 * layered over the generated bundle below.
 */
import { findProfileById } from "../../src/data/demoProfiles.js";
import { buildCareBundle } from "../../src/data/simulatedData.js";

/**
 * Merge a stored profile with its simulation baseline.
 *
 * A seeded demo profile gets the fixture's `sim` block back (that is what makes
 * the generated stream stable per person), with any stored edits layered on
 * top. A profile created through the UI has no fixture, so it is returned as
 * stored.
 */
export function hydrateProfile(profile) {
  const fixture = findProfileById(profile.id);
  if (!fixture) return { ...profile };

  return {
    ...fixture,
    ...profile,
    sim: { ...(fixture.sim || {}), ...(profile.sim || {}) },
  };
}

/**
 * Recompute the adherence figures from the real medication rows.
 *
 * Without this the bundle would keep reporting the simulated count after a
 * caregiver ticks a dose off, which is the one number most likely to be read
 * as real.
 */
function applyAdherence(bundle, medications) {
  const taken = medications.filter((m) => m.taken).length;
  const total = medications.length;
  const pct = total ? Math.round((taken / total) * 100) : 0;

  bundle.adherence = {
    taken,
    total,
    label: `${taken} of ${total} doses today`,
  };

  if (Array.isArray(bundle.weeklyReport?.highlights)) {
    bundle.weeklyReport.highlights = bundle.weeklyReport.highlights.map((h) =>
      h.icon === "pill"
        ? { ...h, value: `${pct}%`, tone: pct === 100 ? "good" : "warn" }
        : h
    );
  }

  return bundle;
}

/**
 * Build the full dashboard payload for one profile.
 *
 * `overrides` carries the stored collections; anything not supplied falls back
 * to the generated fixture.
 */
export function buildBundle(profile, relationship = null, overrides = {}) {
  const merged = hydrateProfile(profile);
  const bundle = buildCareBundle(merged, relationship);

  if (Array.isArray(overrides.medications)) bundle.medications = overrides.medications;
  if (Array.isArray(overrides.careTeam)) bundle.careTeam = overrides.careTeam;
  if (Array.isArray(overrides.alerts)) bundle.initialAlerts = overrides.alerts;

  applyAdherence(bundle, bundle.medications || []);

  return bundle;
}
