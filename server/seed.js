/**
 * Seed the demo dataset into MongoDB.
 *
 * Reads the same fixtures the UI ships with and writes them to the real
 * collections, so a fresh database looks like the prototype did without the
 * app having to carry mock data in the browser.
 *
 *   npm run seed          seed only if the database is empty
 *   npm run seed --force  drop the demo data and reseed
 */
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";

import { connectDb, disconnectDb, mongoose } from "./db.js";
import { ensureIndexes } from "./lib/indexes.js";
import { User } from "./models/User.js";
import { Session } from "./models/Session.js";
import { ElderlyProfile } from "./models/ElderlyProfile.js";
import { CareRelationship } from "./models/CareRelationship.js";
import { CareTeam } from "./models/CareTeam.js";
import { Medication } from "./models/Medication.js";
import { Alert } from "./models/Alert.js";
import { Privacy } from "./models/Privacy.js";
import { UserSettings } from "./models/UserSettings.js";

import {
  DEMO_USERS,
  DEMO_CREDENTIALS,
  ELDERLY_PROFILES,
  CARE_RELATIONSHIPS,
  defaultPrivacy,
  teamFor,
} from "../src/data/demoProfiles.js";
import { buildCareBundle } from "../src/data/simulatedData.js";
import { defaultSettings } from "../src/data/careData.js";

const BCRYPT_ROUNDS = 10;

/** Collections the seeder owns. Real user data is never in here. */
const SEEDED = {
  User,
  Session,
  ElderlyProfile,
  CareRelationship,
  CareTeam,
  Medication,
  Alert,
  Privacy,
  UserSettings,
};

async function dropSeeded() {
  for (const model of Object.values(SEEDED)) {
    await model.deleteMany({});
  }
}

export async function seed({ force = false, log = console.log } = {}) {
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0 && !force) {
    log(`[seed] ${existingUsers} users already present — nothing to do (use --force to reseed)`);
    return false;
  }

  if (force) {
    await dropSeeded();
    log("[seed] cleared existing data");
  }

  /* ------------------------------------------------------------- accounts */

  const passwordByEmail = DEMO_CREDENTIALS.reduce((acc, c) => {
    acc[c.email.toLowerCase()] = c.password;
    return acc;
  }, {});

  // Hash once and reuse: bcrypt is deliberately slow, and every demo account
  // shares the same password, so one hash is both correct and much faster.
  const demoHash = await bcrypt.hash("careguard", BCRYPT_ROUNDS);

  await User.insertMany(
    DEMO_USERS.map((u) => {
      const password = passwordByEmail[u.email.toLowerCase()];
      if (!password) {
        throw new Error(
          `No demo credential for ${u.email}. Add one to DEMO_CREDENTIALS in src/data/demoProfiles.js.`
        );
      }
      return {
        _id: u.id,
        name: u.name,
        email: u.email.toLowerCase(),
        passwordHash: demoHash,
        role: u.role,
        country: u.country,
        timezone: u.timezone,
        locale: u.locale,
        phone: u.phone,
        avatar: u.avatar,
        demo: true,
        includeDemoData: true,
        createdAt: new Date(),
      };
    })
  );
  log(`[seed] ${DEMO_USERS.length} demo users`);

  /* ----------------------------------------------------- elderly profiles */

  await ElderlyProfile.insertMany(
    ELDERLY_PROFILES.map((p) => ({
      _id: p.id,
      accountUserId: p.accountUserId,
      name: p.name,
      shortName: p.shortName,
      avatar: p.avatar,
      age: p.age,
      country: p.country,
      timezone: p.timezone,
      status: p.status,
      address: p.address,
      bloodGroup: p.bloodGroup,
      conditions: p.conditions,
      allergies: p.allergies,
      height: p.height,
      weight: p.weight,
      doctor: p.doctor,
      clinic: p.clinic,
      insurer: p.insurer,
      zones: p.zones,
      device: p.device,
      medicationLanguage: p.medicationLanguage,
      sim: p.sim,
    }))
  );
  log(`[seed] ${ELDERLY_PROFILES.length} elderly profiles`);

  /* --------------------------------------------------------- relationships */

  await CareRelationship.insertMany(
    CARE_RELATIONSHIPS.map((r) => ({ _id: `rel-${r.caregiverId}-${r.elderlyUserId}`, ...r }))
  );
  log(`[seed] ${CARE_RELATIONSHIPS.length} care relationships`);

  /* --------------------------------- medications, care team, alerts, privacy */

  let medicationCount = 0;
  let teamCount = 0;
  let alertCount = 0;

  for (const profile of ELDERLY_PROFILES) {
    const bundle = buildCareBundle(profile);

    // The generated medication list becomes the stored truth, so the first
    // read from Mongo and the first read from the fixture agree.
    if (bundle.medications?.length) {
      await Medication.insertMany(
        bundle.medications.map((m) => ({
          elderlyUserId: profile.id,
          // The fixtures number these 1..n; store as string so newly added
          // rows and seeded rows share one id type on the wire.
          id: String(m.id),
          name: m.name,
          dose: m.dose,
          time: m.time,
          period: m.period,
          taken: Boolean(m.taken),
          takenAt: m.takenAt ?? null,
          type: m.type,
          withFood: Boolean(m.withFood),
          remaining: m.remaining,
          color: m.color,
        }))
      );
      medicationCount += bundle.medications.length;
    }

    const team = teamFor(profile.id);
    if (team.length) {
      await CareTeam.insertMany(
        team.map((m, i) => ({
          _id: `ctm-${profile.id}-${i}`,
          elderlyUserId: profile.id,
          userId: null,
          ...m,
        }))
      );
      teamCount += team.length;
    }

    if (bundle.initialAlerts?.length) {
      const now = Date.now();
      await Alert.insertMany(
        bundle.initialAlerts.map((a, i) => ({
          _id: `alrt-${profile.id}-${i}`,
          elderlyUserId: profile.id,
          type: a.type,
          icon: a.icon,
          title: a.title,
          detail: a.detail,
          time: a.time,
          date: a.date,
          // `at` may be null in the fixture; fall back to a staggered recent
          // instant so the timeline sorts sensibly instead of lumping at zero.
          at: a.at ? new Date(a.at) : new Date(now - (i + 1) * 3600000),
          read: Boolean(a.read),
          source: a.source,
        }))
      );
      alertCount += bundle.initialAlerts.length;
    }

    await Privacy.create({ _id: `priv-${profile.id}`, ...defaultPrivacy(profile.id) });
  }

  log(`[seed] ${medicationCount} medications, ${teamCount} care team members, ${alertCount} alerts`);

  /* ------------------------------------------------------------- settings */

  await UserSettings.insertMany(
    // `_id` mirrors `userId` so the settings upsert in routes/care.js finds
    // these rows rather than trying to insert a second one for the same user.
    DEMO_USERS.map((u) => ({ _id: u.id, userId: u.id, ...defaultSettings }))
  );
  log(`[seed] ${DEMO_USERS.length} settings records`);

  return true;
}

/**
 * Seed on first boot only. Keeps `npm run dev` working against an empty
 * database without overwriting anything a user has since added.
 */
export async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return false;
  await seed({ force: false, log: () => {} });
  return true;
}

/* --------------------------------------------------------------------- CLI */

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const force = process.argv.includes("--force");

  await connectDb();
  await ensureIndexes();

  console.log(`[seed] target database "${mongoose.connection.name}"`);
  const didSeed = await seed({ force });
  console.log(didSeed ? "[seed] done" : "[seed] skipped");

  await disconnectDb();
  process.exit(0);
}
