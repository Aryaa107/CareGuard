/**
 * A single health reading.
 *
 * Every document carries `source` and `simulated` so the UI can keep labelling
 * values honestly. A reading a person typed is `source: "manual"` and
 * `simulated: false`; anything from the simulated device stream says so.
 *
 * `expiresAt` is computed at write time from the profile's privacy retention
 * setting, so shortening the retention window genuinely ages old readings out
 * through the single TTL index below.
 */
import mongoose from "mongoose";
import { newReadingId } from "../lib/ids.js";

const { Schema } = mongoose;

const readingSchema = new Schema(
  {
    _id: { type: String, default: newReadingId },
    elderlyUserId: { type: String, required: true, index: true },
    source: { type: String, default: "manual" },
    simulated: { type: Boolean, default: false },
    recordedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    heartRate: { type: Number, default: null },
    bloodOxygen: { type: Number, default: null },
    bodyTemperature: { type: Number, default: null },
    systolic: { type: Number, default: null },
    diastolic: { type: Number, default: null },
    bloodPressure: { type: String, default: null },
    steps: { type: Number, default: null },
    glucose: { type: Number, default: null },
    device: { type: Schema.Types.Mixed, default: null },
    flags: { type: Schema.Types.Mixed, default: null },
  },
  { versionKey: false }
);

// Newest first, per profile — the only query pattern the UI has.
readingSchema.index({ elderlyUserId: 1, recordedAt: -1 });

// Per-document expiry: each row carries its own retention-derived deadline.
readingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

readingSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Reading = mongoose.model("Reading", readingSchema);
