/**
 * Care-data routes.
 *
 * Every handler that takes an `:elderlyUserId` calls `loadCareLink` first, so
 * a caregiver can only ever reach a household they are actually linked to.
 * That check is the authorisation boundary for this whole file.
 */
import { Router } from "express";

import { ElderlyProfile } from "../models/ElderlyProfile.js";
import { Medication } from "../models/Medication.js";
import { CareTeam } from "../models/CareTeam.js";
import { Privacy } from "../models/Privacy.js";
import { Alert } from "../models/Alert.js";
import { UserSettings } from "../models/UserSettings.js";
import { defaultPrivacy } from "../../src/data/demoProfiles.js";
import { defaultSettings } from "../../src/data/careData.js";

import { route, badRequest, notFound } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { loadCareLink, linkedProfileIds } from "../lib/authorize.js";
import { buildBundle } from "../lib/sim.js";
import { newId, newAlertId } from "../lib/ids.js";
import { optionalString } from "../lib/validate.js";

const router = Router();
router.use(requireAuth);

/* ---------------------------------------------------------------- mappers */

/**
 * Strip Mongo internals so the wire shape matches the old service contract.
 *
 * Every mapper reads `_id` rather than `id`: these run over lean documents,
 * which are plain objects with no Mongoose `id` virtual.
 */
function toMedication(doc) {
  return {
    id: doc.id,
    name: doc.name,
    dose: doc.dose,
    time: doc.time,
    period: doc.period,
    taken: doc.taken,
    takenAt: doc.takenAt,
    type: doc.type,
    withFood: doc.withFood,
    remaining: doc.remaining,
    color: doc.color,
  };
}

function toTeamMember(doc) {
  return {
    id: doc._id ?? doc.id,
    name: doc.name,
    relation: doc.relation,
    role: doc.role,
    access: doc.access,
    status: doc.status,
    lastSeen: doc.lastSeen,
    phone: doc.phone,
    avatar: doc.avatar,
    pending: doc.pending,
  };
}

function toAlert(doc) {
  return {
    id: doc._id ?? doc.id,
    type: doc.type,
    icon: doc.icon,
    title: doc.title,
    detail: doc.detail,
    time: doc.time,
    date: doc.date,
    at: doc.at,
    read: doc.read,
    source: doc.source,
  };
}

/** Drop the envelope fields so only the preference values are returned. */
function toSettings(doc) {
  if (!doc) return null;
  const preferences = { ...doc };
  for (const key of ["_id", "userId", "id", "createdAt", "updatedAt", "__v"]) {
    delete preferences[key];
  }
  return preferences;
}

/* -------------------------------------------------------------- care circle */

/**
 * GET /api/care/care-circle
 *
 * The profiles this account is linked to. A brand new account has no links and
 * therefore sees an empty circle — the demo dataset is attached only to the
 * seeded accounts, never to a real sign-up.
 */
router.get(
  "/care-circle",
  route(async (req, res) => {
    const links = await linkedProfileIds(req.user.id);
    if (!links.length) return res.json([]);

    const profiles = await ElderlyProfile.find({
      _id: { $in: links.map((l) => l.elderlyUserId) },
    }).lean();

    const byId = new Map(profiles.map((p) => [p._id, p]));

    const rows = links
      .map((link) => {
        const profile = byId.get(link.elderlyUserId);
        if (!profile) return null;
        return {
          elderlyUserId: profile.id,
          name: profile.name,
          shortName: profile.shortName,
          avatar: profile.avatar,
          age: profile.age,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
          status: profile.status,
          country: profile.country,
          timezone: profile.timezone,
        };
      })
      .filter(Boolean);

    res.json(rows);
  })
);

/* ------------------------------------------------------------------ bundle */

/** GET /api/care/elderly/:id/bundle — the full dashboard payload. */
router.get(
  "/elderly/:id/bundle",
  route(async (req, res) => {
    const { relationship, profile } = await loadCareLink(req.user.id, req.params.id);

    const [medications, careTeam, alerts] = await Promise.all([
      Medication.find({ elderlyUserId: profile.id }).lean(),
      CareTeam.find({ elderlyUserId: profile.id }).lean(),
      Alert.find({ elderlyUserId: profile.id }).sort({ at: -1 }).lean(),
    ]);

    res.json(
      buildBundle(profile, relationship, {
        medications: medications.map(toMedication),
        careTeam: careTeam.map(toTeamMember),
        alerts: alerts.map(toAlert),
      })
    );
  })
);

/* ----------------------------------------------------------------- profile */

/** GET /api/care/elderly/:id/profile */
router.get(
  "/elderly/:id/profile",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    res.json({ id: profile.id, ...profile });
  })
);

/**
 * PATCH /api/care/elderly/:id/profile
 *
 * A merge patch, matching the old override behaviour: only the fields present
 * in the body change. The field list is an explicit allowlist so a crafted
 * request cannot write `sim`, `_id` or any other field it should not.
 */
const PROFILE_FIELDS = new Set([
  "name",
  "shortName",
  "age",
  "status",
  "address",
  "bloodGroup",
  "conditions",
  "allergies",
  "height",
  "weight",
  "doctor",
  "clinic",
  "insurer",
  "zones",
  "medicationLanguage",
  "timezone",
  "country",
]);

const STRING_FIELDS = [
  "name",
  "shortName",
  "status",
  "address",
  "bloodGroup",
  "doctor",
  "clinic",
  "insurer",
  "medicationLanguage",
  "timezone",
  "country",
];
const NUMBER_FIELDS = ["age", "height", "weight"];
const STRING_ARRAY_FIELDS = ["conditions", "allergies", "zones"];

router.patch(
  "/elderly/:id/profile",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};
    const set = {};

    for (const key of STRING_FIELDS) {
      if (body[key] !== undefined) set[key] = optionalString(body[key], "", 200);
    }
    for (const key of NUMBER_FIELDS) {
      if (body[key] === null) set[key] = null;
      else if (body[key] !== undefined) {
        const n = Number(body[key]);
        if (Number.isNaN(n)) throw badRequest(`${key} must be a number`, key);
        set[key] = n;
      }
    }
    for (const key of STRING_ARRAY_FIELDS) {
      if (Array.isArray(body[key])) {
        set[key] = body[key].map((v) => optionalString(v, "", 120)).filter(Boolean);
      }
    }

    // `sim` is the simulation baseline, not user data — never writable here.
    if (Object.keys(set).length === 0) throw badRequest("Nothing to update");
    for (const key of Object.keys(set)) {
      if (!PROFILE_FIELDS.has(key)) delete set[key];
    }

    const updated = await ElderlyProfile.findByIdAndUpdate(
      profile.id,
      { $set: set },
      { returnDocument: "after" }
    ).lean();

    res.json({ id: updated._id, ...updated });
  })
);

/* ------------------------------------------------------------- medications */

router.get(
  "/elderly/:id/medications",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const rows = await Medication.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toMedication));
  })
);

/**
 * POST /api/care/elderly/:id/medications
 *
 * Upsert keyed on the medication's client-visible `id`; a body with no `id`
 * creates a new row. Returns the full list, because that is what the UI keeps
 * in state.
 */
router.post(
  "/elderly/:id/medications",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};

    const name = optionalString(body.name, "", 160);
    if (!name) throw badRequest("Medication name is required", "name");

    const medId = body.id == null || body.id === "" ? newId("med") : String(body.id);
    const remaining = Number(body.remaining);

    await Medication.findOneAndUpdate(
      { elderlyUserId: profile.id, id: medId },
      {
        $set: {
          name,
          dose: optionalString(body.dose, "", 80),
          time: optionalString(body.time, "", 40),
          period: ["morning", "afternoon", "evening", "night"].includes(body.period)
            ? body.period
            : "morning",
          taken: Boolean(body.taken),
          takenAt: body.takenAt == null ? null : optionalString(body.takenAt, "", 40),
          type: optionalString(body.type, "General", 80),
          withFood: Boolean(body.withFood),
          remaining: Number.isFinite(remaining) ? remaining : 0,
          color: optionalString(body.color, "#8bd3c7", 24),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const rows = await Medication.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toMedication));
  })
);

/** DELETE /api/care/elderly/:id/medications/:medId */
router.delete(
  "/elderly/:id/medications/:medId",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    await Medication.deleteOne({
      elderlyUserId: profile.id,
      id: String(req.params.medId),
    });
    const rows = await Medication.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toMedication));
  })
);

/* ----------------------------------------------------------------- privacy */

/**
 * GET /api/care/elderly/:id/privacy
 *
 * Returns the stored consent, or the conservative default when the profile
 * has never had one — location sharing is never "live" without an opt-in.
 */
router.get(
  "/elderly/:id/privacy",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const saved = await Privacy.findOne({ elderlyUserId: profile.id }).lean();
    res.json(saved || defaultPrivacy(profile.id));
  })
);

router.patch(
  "/elderly/:id/privacy",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};
    const set = {};

    if (body.activityMonitoring !== undefined) {
      set.activityMonitoring = Boolean(body.activityMonitoring);
    }
    if (body.emergencySharing !== undefined) {
      set.emergencySharing = Boolean(body.emergencySharing);
    }
    if (body.shareWithTeam !== undefined) {
      set.shareWithTeam = Boolean(body.shareWithTeam);
    }
    if (body.locationSharing !== undefined) {
      if (!["off", "emergency-only", "live"].includes(body.locationSharing)) {
        throw badRequest("Invalid location sharing value", "locationSharing");
      }
      set.locationSharing = body.locationSharing;
    }
    if (body.dataRetentionDays !== undefined) {
      const days = Number(body.dataRetentionDays);
      if (!Number.isFinite(days) || days < 1 || days > 3650) {
        throw badRequest("Retention must be between 1 and 3650 days", "dataRetentionDays");
      }
      set.dataRetentionDays = days;
    }

    const saved = await Privacy.findOneAndUpdate(
      { elderlyUserId: profile.id },
      { $set: { ...set, elderlyUserId: profile.id } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean();

    const { _id, ...rest } = saved;
    res.json(rest);
  })
);

/* --------------------------------------------------------------- care team */

router.get(
  "/elderly/:id/care-team",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const rows = await CareTeam.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toTeamMember));
  })
);

/** POST /api/care/elderly/:id/care-team — invite someone. */
router.post(
  "/elderly/:id/care-team",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};

    const name = optionalString(body.name, "", 120);
    if (!name) throw badRequest("Name is required", "name");

    const access = Array.isArray(body.access) && body.access.length
      ? body.access.map((a) => optionalString(a, "", 40)).filter(Boolean)
      : ["SOS"];

    await CareTeam.create({
      _id: newId("ctm"),
      elderlyUserId: profile.id,
      name,
      relation: optionalString(body.relation, "Family", 60),
      role: optionalString(body.role, "Co-caregiver", 60),
      access,
      status: "offline",
      lastSeen: "Just invited",
      phone: optionalString(body.phone, "", 32),
      avatar: name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
      pending: true,
    });

    const rows = await CareTeam.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toTeamMember));
  })
);

/** PATCH /api/care/elderly/:id/care-team/:name — the permission matrix. */
router.patch(
  "/elderly/:id/care-team/:name",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const name = optionalString(req.params.name, "", 120);
    const access = Array.isArray(req.body?.access)
      ? req.body.access.map((a) => optionalString(a, "", 40)).filter(Boolean)
      : [];

    const result = await CareTeam.updateOne(
      { elderlyUserId: profile.id, name },
      { $set: { access } }
    );
    if (!result.matchedCount) throw notFound("Care team member not found");

    const rows = await CareTeam.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toTeamMember));
  })
);

/** DELETE /api/care/elderly/:id/care-team/:name */
router.delete(
  "/elderly/:id/care-team/:name",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    await CareTeam.deleteOne({
      elderlyUserId: profile.id,
      name: optionalString(req.params.name, "", 120),
    });
    const rows = await CareTeam.find({ elderlyUserId: profile.id }).lean();
    res.json(rows.map(toTeamMember));
  })
);

/* ------------------------------------------------------------------ alerts */

router.get(
  "/elderly/:id/alerts",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const rows = await Alert.find({ elderlyUserId: profile.id })
      .sort({ at: -1 })
      .lean();
    res.json(rows.map(toAlert));
  })
);

/** Create an alert — used by the SOS flow. */
router.post(
  "/elderly/:id/alerts",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const body = req.body ?? {};

    const title = optionalString(body.title, "", 160);
    if (!title) throw badRequest("Alert title is required", "title");

    await Alert.create({
      _id: newAlertId(),
      elderlyUserId: profile.id,
      type: ["success", "warning", "info", "danger"].includes(body.type) ? body.type : "info",
      icon: optionalString(body.icon, "activity", 40),
      title,
      detail: optionalString(body.detail, "", 400),
      time: optionalString(body.time, "", 40),
      date: optionalString(body.date, "Today", 20),
      at: body.at ? new Date(body.at) : new Date(),
      read: false,
      source: optionalString(body.source, "CareBand X2", 80),
    });

    const rows = await Alert.find({ elderlyUserId: profile.id })
      .sort({ at: -1 })
      .lean();
    // The new alert sorts first, so it is the head of the list.
    res.status(201).json(rows.map(toAlert)[0] ?? null);
  })
);

/** PATCH /api/care/elderly/:id/alerts/:alertId — mark read/unread. */
router.patch(
  "/elderly/:id/alerts/:alertId",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    const read = req.body?.read;

    const result = await Alert.updateOne(
      { _id: String(req.params.alertId), elderlyUserId: profile.id },
      { $set: { read: read == null ? true : Boolean(read) } }
    );
    if (!result.matchedCount) throw notFound("Alert not found");

    const doc = await Alert.findById(req.params.alertId).lean();
    res.json(toAlert(doc));
  })
);

/** POST /api/care/elderly/:id/alerts/read-all */
router.post(
  "/elderly/:id/alerts/read-all",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    await Alert.updateMany({ elderlyUserId: profile.id }, { $set: { read: true } });
    const rows = await Alert.find({ elderlyUserId: profile.id })
      .sort({ at: -1 })
      .lean();
    res.json(rows.map(toAlert));
  })
);

/** DELETE /api/care/elderly/:id/alerts/:alertId */
router.delete(
  "/elderly/:id/alerts/:alertId",
  route(async (req, res) => {
    const { profile } = await loadCareLink(req.user.id, req.params.id);
    await Alert.deleteOne({
      _id: String(req.params.alertId),
      elderlyUserId: profile.id,
    });
    const rows = await Alert.find({ elderlyUserId: profile.id })
      .sort({ at: -1 })
      .lean();
    res.json(rows.map(toAlert));
  })
);

/* --------------------------------------------------------------- settings */

/** GET /api/care/settings — null when the account has never saved any. */
router.get(
  "/settings",
  route(async (req, res) => {
    const doc = await UserSettings.findOne({ userId: req.user.id }).lean();
    res.json(toSettings(doc));
  })
);

/** PATCH /api/care/settings — merge patch onto the stored preferences. */
router.patch(
  "/settings",
  route(async (req, res) => {
    const body = req.body ?? {};
    const set = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === "id" || key === "_id" || key === "userId") continue;
      if (key === "textScale" || key === "sosHoldSeconds") {
        const n = Number(value);
        if (!Number.isFinite(n)) throw badRequest(`${key} must be a number`, key);
        set[key] = n;
      } else if (key in defaultSettings) {
        // Only fields that exist in the default set may be written, with the
        // same type as the default. This stops a crafted body from inventing
        // arbitrary columns.
        set[key] = typeof defaultSettings[key] === "boolean" ? Boolean(value) : value;
      }
    }

    // Keyed on `userId` alone, never on `_id`: the unique index is on
    // `userId`, so filtering by `_id` as well would miss a row whose id was
    // generated differently and the upsert would then collide with that index.
    const doc = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: set, $setOnInsert: { _id: req.user.id, userId: req.user.id } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean();

    res.json(toSettings(doc));
  })
);

export default router;
