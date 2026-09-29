/**
 * Privacy consent for one elderly profile.
 *
 * `locationSharing` is deliberately not "live" by default — live tracking
 * needs an explicit opt-in, so a new record starts at "emergency-only".
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const privacySchema = new Schema(
  {
    _id: { type: String, required: true },
    elderlyUserId: { type: String, required: true, unique: true, index: true },
    activityMonitoring: { type: Boolean, default: true },
    locationSharing: {
      type: String,
      enum: ["off", "emergency-only", "live"],
      default: "emergency-only",
    },
    emergencySharing: { type: Boolean, default: true },
    shareWithTeam: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 90, min: 1, max: 3650 },
  },
  { versionKey: false, timestamps: true }
);

privacySchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Privacy = mongoose.model("Privacy", privacySchema);
