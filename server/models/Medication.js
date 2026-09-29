/**
 * A medication on an elderly person's schedule.
 *
 * `id` is the id the UI already uses, kept separate from `_id` because the
 * simulated fixtures number them 1..n while newly added rows get generated ids.
 * Both are strings on the wire, so `markMedication(id)` comparisons stay exact.
 */
import mongoose from "mongoose";
import { newMedicationId } from "../lib/ids.js";

const { Schema } = mongoose;

const medicationSchema = new Schema(
  {
    _id: { type: String, default: newMedicationId },
    elderlyUserId: { type: String, required: true, index: true },
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    dose: { type: String, default: "" },
    time: { type: String, default: "" },
    period: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      default: "morning",
    },
    taken: { type: Boolean, default: false },
    /** Wall-clock label the UI shows, e.g. "7:58 AM". */
    takenAt: { type: String, default: null },
    type: { type: String, default: "General" },
    withFood: { type: Boolean, default: false },
    remaining: { type: Number, default: 0 },
    color: { type: String, default: "#8bd3c7" },
  },
  { versionKey: false, timestamps: true }
);

// One row per (profile, medication id).
medicationSchema.index({ elderlyUserId: 1, id: 1 }, { unique: true });

medicationSchema.set("toJSON", {
  // No `virtuals` here: this schema already has a real `id` path, and the
  // `_id`-derived virtual would shadow it.
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const Medication = mongoose.model("Medication", medicationSchema);
