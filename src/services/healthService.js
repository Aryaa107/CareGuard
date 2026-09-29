/**
 * HEALTH GATEWAY SERVICE — all readings here are SIMULATED.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ CareGuard is NOT connected to any medical device in this build. No     │
 * │ heart-rate monitor, pulse oximeter or thermometer feeds this app, and  │
 * │ nothing here should be presented as a real measurement or as medical   │
 * │ advice.                                                                │
 * │                                                                        │
 * │ This module exists so the future integration point is obvious: replace │
 * │ the bodies with `fetch("/api/v1/elderly/{id}/latest")` or a websocket  │
 * │ subscription. The returned object shape is the contract.               │
 * └────────────────────────────────────────────────────────────────────────┘
 */
import { readJSON, writeJSON, KEYS } from "./storageService";
import { findProfileById } from "../data/demoProfiles";
import { buildVitals, DEFAULT_BASELINE } from "../data/careData";
import { SIMULATED } from "../data/simulatedData";

/** Thresholds drive alert severity. Tuned for a resting adult, demo use only. */
export const RANGES = {
  heartRate: { low: 50, high: 110, unit: "BPM" },
  bloodOxygen: { low: 94, high: 100, unit: "%" },
  bodyTemperature: { low: 35.8, high: 37.6, unit: "°C" },
  systolic: { low: 100, high: 140, unit: "mmHg" },
  diastolic: { low: 60, high: 90, unit: "mmHg" },
};

export function classify(metric, value) {
  const r = RANGES[metric];
  if (!r || value == null) return "unknown";
  if (value < r.low) return "low";
  if (value > r.high) return "high";
  return "normal";
}

/**
 * Latest reading for one elderly profile.
 *
 * Returns `simulated: true` alongside every payload so the UI can keep saying
 * so out loud, and `source: "mock"` so a later device integration can be
 * feature-detected rather than guessed.
 */
export async function fetchLatestReading(elderlyUserId) {
  const profile = findProfileById(elderlyUserId);
  if (!profile) throw Object.assign(new Error("Unknown elderly profile"), { code: 404 });

  const sim = profile.sim || {};
  const vitals = buildVitals(sim.seed || 4271, { ...DEFAULT_BASELINE, ...sim });
  const last = (a) => a[a.length - 1];

  const reading = {
    elderlyUserId,
    simulated: SIMULATED,
    source: "mock",
    measuredAt: new Date().toISOString(),
    device: { ...profile.device },
    heartRate: last(vitals.hr),
    bloodOxygen: last(vitals.spo2),
    bodyTemperature: last(vitals.temp),
    systolic: last(vitals.sys),
    diastolic: last(vitals.dia),
    bloodPressure: `${last(vitals.sys)}/${last(vitals.dia)}`,
    steps: vitals.steps.reduce((a, b) => a + b, 0),
    glucose: sim.glucose ?? null,
  };

  reading.flags = {
    heartRate: classify("heartRate", reading.heartRate),
    bloodOxygen: classify("bloodOxygen", reading.bloodOxygen),
    bodyTemperature: classify("bodyTemperature", reading.bodyTemperature),
    bloodPressure:
      classify("systolic", last(vitals.sys)) === "normal" && classify("diastolic", last(vitals.dia)) === "normal"
        ? "normal"
        : "attention",
  };

  return reading;
}

/** 24h series for the charts, in the profile's own baselines. */
export async function fetchVitalSeries(elderlyUserId) {
  const profile = findProfileById(elderlyUserId);
  if (!profile) throw Object.assign(new Error("Unknown elderly profile"), { code: 404 });
  const sim = profile.sim || {};
  return {
    simulated: SIMULATED,
    series: buildVitals(sim.seed || 4271, { ...DEFAULT_BASELINE, ...sim }),
  };
}

/**
 * Manual entry from the elderly-side app. Stored locally; a real deployment
 * POSTs to the backend and lets the server decide whether it trips an alert.
 */
export async function submitManualReading(elderlyUserId, reading) {
  const all = readJSON(KEYS.incidents, {}) || {};
  const key = `readings.${elderlyUserId}`;
  const list = Array.isArray(all[key]) ? all[key] : [];
  const entry = {
    ...reading,
    id: `rd-${Date.now().toString(36)}`,
    recordedAt: new Date().toISOString(),
    simulated: false, // a value a person typed is real user input, not a fixture
    source: "manual",
  };
  all[key] = [entry, ...list].slice(0, 50);
  writeJSON(KEYS.incidents, all);
  return entry;
}

export async function fetchManualReadings(elderlyUserId) {
  const all = readJSON(KEYS.incidents, {}) || {};
  return Array.isArray(all[`readings.${elderlyUserId}`]) ? all[`readings.${elderlyUserId}`] : [];
}
