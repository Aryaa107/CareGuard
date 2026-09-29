/**
 * Server-side session.
 *
 * The raw token is shown to the client exactly once and never stored — only
 * its SHA-256 digest is. A dump of this collection therefore cannot be replayed
 * as a login, which is the whole point of keeping sessions server-side.
 *
 * MongoDB reaps expired documents through the TTL index below, so no cleanup
 * job is needed.
 */
import mongoose from "mongoose";
import { newId } from "../lib/ids.js";

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    _id: { type: String, default: () => newId("sess") },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { versionKey: false }
);

// TTL index: MongoDB deletes a document once `expiresAt` has passed.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model("Session", sessionSchema);
