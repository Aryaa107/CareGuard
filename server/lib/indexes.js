/**
 * Index creation.
 *
 * Mongoose builds schema indexes automatically, but the TTL indexes matter
 * enough to be explicit and awaited: until `expiresAt` is indexed, expired
 * sessions and readings are never actually reaped.
 */
import { connectDb } from "../db.js";
import { Session } from "../models/Session.js";
import { Reading } from "../models/Reading.js";
import { User } from "../models/User.js";
import { CareRelationship } from "../models/CareRelationship.js";
import { Privacy } from "../models/Privacy.js";
import { UserSettings } from "../models/UserSettings.js";
import { Medication } from "../models/Medication.js";
import { CareTeam } from "../models/CareTeam.js";
import { Alert } from "../models/Alert.js";
import { ElderlyProfile } from "../models/ElderlyProfile.js";

const MODELS = [
  User,
  Session,
  ElderlyProfile,
  CareRelationship,
  CareTeam,
  Medication,
  Reading,
  Alert,
  Privacy,
  UserSettings,
];

export async function ensureIndexes() {
  await connectDb();
  for (const model of MODELS) {
    // `syncIndexes` rather than `createIndexes`: it drops indexes that are no
    // longer declared, so a removed index does not linger in the database.
    await model.syncIndexes();
  }
  console.log(`[careguard] indexes ready across ${MODELS.length} collections`);
}
