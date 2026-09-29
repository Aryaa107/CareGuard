/**
 * Server configuration, read once from `.env` and validated at boot.
 *
 * Failing loudly here is deliberate: a server that starts without a working
 * database and only errors when the first request arrives is far harder to
 * diagnose than one that refuses to start.
 */
import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env and fill it in.`
    );
  }
  return value.trim();
}

function int(name, fallback) {
  const raw = process.env[name];
  if (raw == null || !raw.trim()) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got "${raw}".`);
  }
  return parsed;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: int("PORT", 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  sessionTtlMs: int("SESSION_TTL_HOURS", 12) * 60 * 60 * 1000,
  mongo: {
    uri: required("MONGODB_URI"),
    dbName: process.env.MONGODB_DB_NAME || "careguard",
  },
};

/** Never let a connection string with credentials reach a log file. */
export function redactUri(uri) {
  return uri.replace(/\/\/([^@/]+)@/, "//<credentials>@");
}
