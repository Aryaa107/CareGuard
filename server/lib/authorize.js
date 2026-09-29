/**
 * Care-link authorisation.
 *
 * Reading a profile, its medications, readings or alerts is always scoped
 * through the caregiver <-> elderly relationship. Routes call
 * `loadCareLink` first, so a caregiver who guesses another household's
 * `elderlyUserId` gets a 404 rather than their data.
 */
import { CareRelationship } from "../models/CareRelationship.js";
import { ElderlyProfile } from "../models/ElderlyProfile.js";
import { notFound } from "./http.js";
import { withId, withIds } from "./serialize.js";

/** True when this account is linked to this profile. */
export async function isLinked(caregiverId, elderlyUserId) {
  if (!caregiverId || !elderlyUserId) return false;
  const rel = await CareRelationship.findOne({ caregiverId, elderlyUserId }).lean();
  return Boolean(rel);
}

/**
 * Load the relationship row and the profile it points at, or throw 404.
 * Returns `{ relationship, profile }`, both with an explicit `id`.
 */
export async function loadCareLink(caregiverId, elderlyUserId) {
  const relationship = await CareRelationship.findOne({
    caregiverId,
    elderlyUserId,
  }).lean();

  if (!relationship) throw notFound("Elderly profile not found");

  const profile = await ElderlyProfile.findById(elderlyUserId).lean();
  if (!profile) throw notFound("Elderly profile not found");

  return { relationship: withId(relationship), profile: withId(profile) };
}

/** Every profile this caregiver may see, primary link first. */
export async function linkedProfileIds(caregiverId) {
  const rows = await CareRelationship.find({ caregiverId })
    .sort({ isPrimary: -1 })
    .lean();
  return withIds(rows);
}
