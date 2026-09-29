/**
 * An alert in the caregiver's event timeline.
 *
 * `at` is the real instant; `time` and `date` are the pre-rendered labels the
 * Alerts page already displays. Storing both keeps the existing UI contract
 * while leaving the true timestamp queryable and sortable.
 */
import mongoose from "mongoose";
import { newAlertId } from "../lib/ids.js";

const { Schema } = mongoose;

const alertSchema = new Schema(
  {
    _id: { type: String, default: newAlertId },
    elderlyUserId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["success", "warning", "info", "danger"],
      default: "info",
    },
    icon: { type: String, default: "activity" },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    time: { type: String, default: "" },
    date: { type: String, default: "Today" },
    at: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    source: { type: String, default: "Simulated feed" },
  },
  { versionKey: false, timestamps: true }
);

// Timeline order, and the unread badge count.
alertSchema.index({ elderlyUserId: 1, at: -1 });
alertSchema.index({ elderlyUserId: 1, read: 1 });

alertSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Alert = mongoose.model("Alert", alertSchema);
