import { randomBytes } from "node:crypto";

/**
 * Prefixed, sortable, collision-resistant ids.
 *
 * MongoDB's ObjectId would also work, but the demo fixtures ship with readable
 * ids (`elderly-001`, `user-aryaa`) that the relationship rows join on. Using
 * String `_id`s everywhere means those fixtures load into MongoDB verbatim and
 * the existing joins keep working without a mapping layer.
 */

const RANDOM_BYTES = 9;

export function newId(prefix) {
  const time = Date.now().toString(36);
  const rand = randomBytes(RANDOM_BYTES).toString("hex").slice(0, 8);
  return prefix ? `${prefix}-${time}${rand}` : `${time}${rand}`;
}

export const newUserId = () => newId("user");
export const newMedicationId = () => newId("med");
export const newAlertId = () => newId("alrt");
export const newReadingId = () => newId("rd");
