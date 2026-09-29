/**
 * Session authentication.
 *
 * A bearer token is looked up by its SHA-256 digest, checked against its
 * expiry, and used to load the user. `req.user` and `req.session` are what
 * every downstream handler relies on.
 */
import { createHash, randomBytes } from "node:crypto";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { config } from "../config.js";
import { unauthorized } from "../lib/http.js";

/** The raw token is shown to the client once; only this digest is stored. */
export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken() {
  return randomBytes(32).toString("base64url");
}

export async function issueSession(userId, { userAgent = "", ip = "" } = {}) {
  const token = mintToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionTtlMs);

  await Session.create({
    userId,
    tokenHash: hashToken(token),
    issuedAt: now,
    expiresAt,
    userAgent: String(userAgent).slice(0, 200),
    ip: String(ip).slice(0, 60),
  });

  return {
    token,
    userId,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeSession(token) {
  if (!token) return false;
  const { deletedCount } = await Session.deleteOne({ tokenHash: hashToken(token) });
  return deletedCount > 0;
}

/** Drop every session for a user — used after a password change. */
export async function revokeAllSessions(userId, exceptToken = null) {
  const filter = { userId };
  if (exceptToken) filter.tokenHash = { $ne: hashToken(exceptToken) };
  await Session.deleteMany(filter);
}

function bearerFrom(req) {
  const header = req.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

/** Attaches `req.user` / `req.session`, or throws 401. */
export async function requireAuth(req, _res, next) {
  try {
    const token = bearerFrom(req);
    if (!token) throw unauthorized("Missing session token");

    const session = await Session.findOne({ tokenHash: hashToken(token) });
    if (!session) throw unauthorized("Session not found");

    if (session.expiresAt.getTime() <= Date.now()) {
      // Expired sessions are cleaned up eagerly here as well as by the TTL
      // index, so a revoked token is unusable immediately.
      await Session.deleteOne({ _id: session._id });
      throw unauthorized("Session expired");
    }

    const user = await User.findById(session.userId);
    if (!user) throw unauthorized("Account no longer exists");

    req.session = session;
    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attach `req.user` when a valid token is present, but never reject. */
export async function optionalAuth(req, _res, next) {
  try {
    const token = bearerFrom(req);
    if (token) {
      const session = await Session.findOne({ tokenHash: hashToken(token) });
      if (session && session.expiresAt.getTime() > Date.now()) {
        const user = await User.findById(session.userId);
        if (user) {
          req.session = session;
          req.token = token;
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
