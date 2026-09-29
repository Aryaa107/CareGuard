/**
 * Per-account UI preferences.
 *
 * Deliberately `strict: false` for the value body: the settings page owns its
 * own field set and adding a toggle there should not require a migration.
 * Everything is optional, and a missing field falls back to the client default.
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const userSettingsSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true, index: true },
  },
  { strict: false, versionKey: false, minimize: false, timestamps: true }
);

userSettingsSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const UserSettings = mongoose.model("UserSettings", userSettingsSchema);
