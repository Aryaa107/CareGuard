/**
 * Someone with access to one elderly profile's care.
 *
 * Distinct from CareRelationship: this holds people who have no CareGuard
 * account at all (agencies, neighbours, visitors), and carries the
 * permission matrix (`access`) the Family page renders.
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const teamMemberSchema = new Schema(
  {
    _id: { type: String, required: true },
    elderlyUserId: { type: String, required: true, index: true },
    /** Set when the member is a real account rather than an outside contact. */
    userId: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    relation: { type: String, default: "Family" },
    role: { type: String, default: "Co-caregiver" },
    access: { type: [String], default: () => ["SOS"] },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "offline",
    },
    lastSeen: { type: String, default: "Just invited" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    /** Invited but has not accepted yet. */
    pending: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

teamMemberSchema.index({ elderlyUserId: 1, name: 1 });

teamMemberSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const CareTeam = mongoose.model("CareTeam", teamMemberSchema);
