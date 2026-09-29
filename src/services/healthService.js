/**
 * HEALTH GATEWAY SERVICE — talks to the CareGuard API.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ CareGuard is NOT connected to any medical device. CareBand is NOT       │
 * │ compatible with any real device. The values the API returns from the   │
 * │ device stream are SIMULATED and must never be presented as measured    │
 * │ values or as medical advice. Only a reading a person typed in is real  │
 * │ user input, and those are the only ones stored.                        │
 * │                                                                        │
 * │ Replacing the simulated stream with a real gateway means changing the  │
 * │ server route, not this module.                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 */
import { get, post, del, seg, ApiError } from "../lib/api";

/**
 * Re-exported from the shared module so the client and the server classify a
 * reading the same way. See lib/vitals.js.
 */
export { RANGES, classify } from "../lib/vitals.js";

function rethrow(err) {
  if (err instanceof ApiError) {
    const wrapped = new Error(err.message);
    wrapped.name = err.name;
    wrapped.code = err.status || err.code || null;
    throw wrapped;
  }
  throw err;
}

/** Latest device reading. Rejects with `code: 404` for an unknown profile. */
export async function fetchLatestReading(elderlyUserId) {
  try {
    return await get(`/health/elderly/${seg(elderlyUserId)}/latest`);
  } catch (err) {
    rethrow(err);
  }
}

/** 24h series for the charts, in the profile's own baselines. */
export async function fetchVitalSeries(elderlyUserId) {
  try {
    return await get(`/health/elderly/${seg(elderlyUserId)}/series`);
  } catch (err) {
    rethrow(err);
  }
}

/**
 * Manual entry from the elderly-side app. The server computes the severity
 * flags rather than trusting whatever the client sent.
 */
export async function submitManualReading(elderlyUserId, reading) {
  try {
    return await post(`/health/elderly/${seg(elderlyUserId)}/readings`, reading);
  } catch (err) {
    rethrow(err);
  }
}

/** Stored manual readings, newest first. */
export async function fetchManualReadings(elderlyUserId) {
  try {
    return await get(`/health/elderly/${seg(elderlyUserId)}/readings`);
  } catch (err) {
    rethrow(err);
  }
}

export async function deleteManualReading(elderlyUserId, readingId) {
  try {
    return await del(
      `/health/elderly/${seg(elderlyUserId)}/readings/${seg(readingId)}`
    );
  } catch (err) {
    rethrow(err);
  }
}
