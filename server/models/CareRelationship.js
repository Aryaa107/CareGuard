/**
 * Join table: which caregiver account may see which elderly profile.
 *
 * This is the authorisation boundary for the whole care dashboard. Every read
 * of a profile, medication, reading or alert is scoped through one of these
 * rows, so a caregiver can only ever reach people they are linked to.
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const relationshipSchema = new Schema(
  {
    _id: { type: String, required: true },
    caregiverId: { type: String, required: true, index: true },
    elderlyUserId: { type: String, required: true, index: true },
    relationship: { type: String, default: "Family" },
    isPrimary: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

// One link per caregiver/elderly pair.
relationshipSchema.index(
  { caregiverId: 1, elderlyUserId: 1 },
  { unique: true }
);

relationshipSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const CareRelationship = mongoose.model("CareRelationship", relationshipSchema);
