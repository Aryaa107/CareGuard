/**
 * An elderly person under care.
 *
 * `sim` holds the baselines the simulated sensor stream is generated around.
 * It is data, not a hardcoded constant: swapping in a real device means
 * replacing how `sim` is produced, not how the profile is stored.
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const deviceSchema = new Schema(
  {
    name: { type: String, default: "Not paired" },
    serial: { type: String, default: "—" },
    battery: { type: Number, default: null },
    charging: { type: Boolean, default: false },
    signal: { type: String, default: "None" },
  },
  { _id: false }
);

const simSchema = new Schema(
  {
    seed: { type: Number, default: 4271 },
    heartRate: { type: Number },
    bloodOxygen: { type: Number },
    temperature: { type: Number },
    systolic: { type: Number },
    diastolic: { type: Number },
    steps: { type: Number },
    glucose: { type: Number, default: null },
    careScore: { type: Number },
    sleepAvg: { type: Number },
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    _id: { type: String, required: true },
    accountUserId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, default: "" },
    avatar: { type: String, default: "" },
    age: { type: Number, default: null },
    country: { type: String, default: "IN" },
    timezone: { type: String, default: "UTC" },
    status: {
      type: String,
      enum: ["safe", "pending", "attention", "offline"],
      default: "pending",
    },
    address: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    conditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    doctor: { type: String, default: "" },
    clinic: { type: String, default: "" },
    insurer: { type: String, default: "" },
    zones: { type: [String], default: [] },
    device: { type: deviceSchema, default: () => ({}) },
    medicationLanguage: { type: String, default: "English" },
    sim: { type: simSchema, default: () => ({}) },
    /** True for a person added through the UI and not yet wired to a device. */
    pendingSetup: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

profileSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const ElderlyProfile = mongoose.model("ElderlyProfile", profileSchema);
