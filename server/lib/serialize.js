/**
 * Serialisation helpers for documents loaded with `.lean()`.
 *
 * A lean query returns plain objects, which do NOT carry the `id` virtual that
 * Mongoose adds to a full document. Anything reading `.id` off a lean result
 * silently gets `undefined` — which surfaces as "no data found" rather than as
 * an obvious bug. These helpers make the field explicit instead.
 */

/** Attach the client-facing `id` to a lean document. */
export function withId(doc) {
  return doc ? { ...doc, id: doc._id } : doc;
}

/** The same, across an array of lean documents. */
export function withIds(docs) {
  return (docs || []).map(withId);
}
