/**
 * MongoDB connection lifecycle.
 *
 * Mongoose keeps a single pooled connection per process, so this is
 * deliberately a module-level singleton rather than something callers open and
 * close per request.
 */
import mongoose from "mongoose";
import { config, redactUri } from "./config.js";

mongoose.set("strictQuery", true);

let connecting = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connecting) {
    connecting = mongoose
      .connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
        serverSelectionTimeoutMS: 10000,
        autoIndex: true,
      })
      .then((m) => m.connection)
      .finally(() => {
        connecting = null;
      });
  }

  return connecting;
}

export async function disconnectDb() {
  connecting = null;
  await mongoose.disconnect();
}

export function connectionInfo() {
  const { host, port, name } = mongoose.connection;
  return { host, port, name };
}

export { mongoose, redactUri };
