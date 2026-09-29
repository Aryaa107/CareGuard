/**
 * Health gateway routes.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ CareGuard is NOT connected to any medical device. The device stream     │
 * │ below is SIMULATED and is generated from each profile's stored         │
 * │ baselines. Only readings a person typed in are real user input, and    │
 * │ those are the only ones persisted.                                     │
 * │                                                                        │
 * │ This is the swap-in point for a real gateway: replace `buildLatest`   │
 * │ with a device lookup and the rest of the app is unchanged.             │
 * └────────────────────────────────────────────────────────────────────────┘
 */
import { Router } from "express";

import { Reading } from "../models/Reading.js";
import { Privacy } from "../models/Privacy.js";
import { defaultPrivacy } from "../../src/data/demoProfiles.js";
import { buildVitals, DEFAULT_BASELINE } from "../../src/data/careData.js";
import { SIMULATED } from "../../src/data/simulatedData.js";
import { flagsFor } from "../../src/lib/vitals.js";

import { route, badRequest, notFound } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { loadCareLink } from "../lib/authorize.js";
import { hydrateProfile } from "../lib/sim.js";
import { newReadingId } from "../lib/ids.js";

const router = Router();
router.use(requireAuth);

/** How many stored readings the UI is ever shown. */
const READINGS_LIMIT = 50;

const last = (arr) => arr[arr.length - 1];

/** The simulated 24h series for a profile, from its stored baselines. */
function seriesFor(profile) {
  const sim = hydrateProfile(profile).sim || {};
  return buildVitals(sim.seed || 4271, { ...DEFAULT_BASELINE, ...sim });
}

/**
 * The latest simulated device reading, in the shape the UI already consumes.
 * `source` and `simulated` travel with every payload so the interface can keep
 * labelling the numbers honestly.
 */
function buildLatest(profile) {
  const hydrated = hydrateProfile(profile);
  const sim = hydrated.sim || {};
  const vitals = seriesFor(profile);

  const reading = {
    elderlyUserId: profile.id,
    simulated: SIMULATED,
    source: "mock",
    measuredAt: new Date().toISOString(),
    device: { ...(hydrated.device || {}) },
    heartRate: last(vitals.hr),
    bloodOxygen: last(vitals.spo2),
    bodyTemperature: last(vitals.temp),
    systolic: last(vitals.sys),
    diastolic: last(vitals.dia),
    bloodPressure: `${last(vitals.sys)}/${last(vitals.dia)}`,
    steps: vitals.steps.reduce((a, b) => a + b, 0),
    glucose: sim.glucose ?? null,
  };

  reading.flags = flagsFor(reading);
  return reading;
}

/** GET /api/health/elderly/:id/latest */
router.get(
  "/elderly/:id/latest",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    res.json(buildLatest(profile));
  })
);

/** GET /api/health/elderly/:id/series — 24h chart data. */
router.get(
  "/elderly/:id/series",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    res.json({ simulated: SIMULATED, series: seriesFor(profile) });
  })
);

/** GET /api/health/elderly/:id/readings — stored manual entries, newest first. */
router.get(
  "/elderly/:id/readings",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const rows = await Reading.find({ elderlyUserId: profile.id })
      .sort({ recordedAt: -1 })
      .limit(READINGS_LIMIT)
      .lean();
    res.json(rows.map(toWire));
  })
);

/**
 * POST /api/health/elderly/:id/readings — a reading a person typed in.
 *
 * These are stored as `source: "manual"`, `simulated: false`: a value a person
 * entered is real user input, not a fixture, and the UI labels it differently.
 * The server computes the severity flags rather than trusting the client.
 */
router.post(
  "/elderly/:id/readings",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};

    const numeric = (key) => {
      if (body[key] == null || body[key] === "") return null;
      const n = Number(body[key]);
      if (!Number.isFinite(n)) throw badRequest(`${key} must be a number`, key);
      return n;
    };

    const systolic = numeric("systolic");
    const diastolic = numeric("diastolic");
    const reading = {
      heartRate: numeric("heartRate"),
      bloodOxygen: numeric("bloodOxygen"),
      bodyTemperature: numeric("bodyTemperature"),
      systolic,
      diastolic,
      glucose: numeric("glucose"),
      steps: numeric("steps"),
    };

    // Reject an entry with nothing in it rather than storing a blank row.
    const hasAnyValue = Object.values(reading).some((v) => v !== null);
    if (!hasAnyValue) throw badRequest("A reading needs at least one value");

    const bloodPressure =
      systolic !== null && diastolic !== null ? `${systolic}/${diastolic}` : null;

    const recordedAt = body.recordedAt ? new Date(body.recordedAt) : new Date();
    if (Number.isNaN(recordedAt.getTime())) {
      throw badRequest("recordedAt is not a valid date", "recordedAt");
    }

    // Honour the profile's retention window.
    const privacy = await Privacy.findOne({ elderlyUserId: profile.id }).lean();
    const retentionDays = privacy?.dataRetentionDays ?? defaultPrivacy(profile.id).dataRetentionDays;
    const expiresAt = new Date(recordedAt.getTime() + retentionDays * 86400000);

    const doc = await Reading.create({
      _id: newReadingId(),
      elderlyUserId: profile.id,
      ...reading,
      bloodPressure,
      source: "manual",
      simulated: false,
      recordedAt,
      expiresAt,
      flags: flagsFor({ ...reading, systolic, diastolic }),
    });

    res.status(201).json(toWire(doc.toJSON()));
  })
);

/** DELETE /api/health/elderly/:id/readings/:readingId */
router.delete(
  "/elderly/:id/readings/:readingId",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const result = await Reading.deleteOne({
      _id: String(req.params.readingId),
      elderlyUserId: profile.id,
    });
    if (!result.deletedCount) throw notFound("Reading not found");

    const rows = await Reading.find({ elderlyUserId: profile.id })
      .sort({ recordedAt: -1 })
      .limit(READINGS_LIMIT)
      .lean();
    res.json(rows.map(toWire));
  })
);

/**
 * Shape a stored reading for the client.
 *
 * Reads `_id` first: most callers pass a lean document, while a freshly
 * created one arrives already through `toJSON()` and has `id` instead.
 */
function toWire(doc) {
  return {
    id: doc._id ?? doc.id,
    elderlyUserId: doc.elderlyUserId,
    source: doc.source,
    simulated: doc.simulated,
    recordedAt: doc.recordedAt,
    heartRate: doc.heartRate,
    bloodOxygen: doc.bloodOxygen,
    bodyTemperature: doc.bodyTemperature,
    systolic: doc.systolic,
    diastolic: doc.diastolic,
    bloodPressure: doc.bloodPressure,
    steps: doc.steps,
    glucose: doc.glucose,
    device: doc.device,
    flags: doc.flags,
  };
}

export default router;
