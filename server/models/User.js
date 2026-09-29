/**
 * User account.
 *
 * `passwordHash` is `select: false` so it is excluded from every query unless
 * explicitly asked for. That makes it impossible to leak by accident: adding a
 * field to a response object can never accidentally serialize the hash.
 */
import mongoose from "mongoose";
import { newUserId } from "../lib/ids.js";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    _id: { type: String, default: newUserId },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["caregiver", "elderly"],
      default: "caregiver",
    },
    country: { type: String, default: "IN" },
    timezone: { type: String, default: "UTC" },
    locale: { type: String, default: "en-IN" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    demo: { type: Boolean, default: false },
    includeDemoData: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

/**
 * The client contract. Mirrors `toPublicUser` in the old mock authService:
 * an `id` field, no secrets, and dates as ISO strings.
 */
userSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
