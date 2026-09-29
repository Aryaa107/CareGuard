/**
 * Authentication routes.
 *
 * Passwords are hashed with bcrypt (a deliberately slow KDF) and the plaintext
 * never leaves the request. The previous prototype hashed with a single
 * SHA-256 round, which is fast enough to brute-force offline — that is exactly
 * the weakness that only appears once credentials live in a real database.
 */
import bcrypt from "bcryptjs";
import { Router } from "express";

import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { CareRelationship } from "../models/CareRelationship.js";
import { UserSettings } from "../models/UserSettings.js";
import { defaultSettings } from "../../src/data/careData.js";
import { resolveCountry } from "../../src/data/countries.js";
import { config } from "../config.js";
import { route, badRequest, conflict, notFound, unauthorized } from "../lib/http.js";
import {
  requireAuth,
  hashToken,
  issueSession,
  revokeSession,
  revokeAllSessions,
} from "../middleware/auth.js";
import {
  assertEmail,
  assertName,
  assertPassword,
  assertCountry,
  initialsOf,
  optionalString,
} from "../lib/validate.js";

const router = Router();

const BCRYPT_ROUNDS = 10;

/** The public shape of a user — no hash, no salt. */
function toPublicUser(user) {
  return {
    id: user.id ?? user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    country: user.country,
    timezone: user.timezone,
    locale: user.locale,
    phone: user.phone,
    avatar: user.avatar || initialsOf(user.name),
    demo: Boolean(user.demo),
    includeDemoData: Boolean(user.includeDemoData),
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/login
 *
 * An unknown email and a wrong password return the identical error, so the
 * endpoint cannot be used to discover which addresses have accounts.
 */
router.post(
  "/login",
  route(async (req, res) => {
    const email = assertEmail(req.body?.email);
    const password = String(req.body?.password ?? "");
    if (!password) throw badRequest("Password is required", "password");

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) throw unauthorized("Incorrect email or password");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Incorrect email or password");

    const session = await issueSession(user.id, {
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    res.json({ user: toPublicUser(user), session });
  })
);

/**
 * POST /api/auth/register
 *
 * A new account starts with an EMPTY care circle. Nothing is attached unless
 * the caller explicitly opted into the labelled demo dataset, so demo health
 * data is never mistaken for a real person's.
 */
router.post(
  "/register",
  route(async (req, res) => {
    const body = req.body ?? {};

    const name = assertName(body.name);
    const email = assertEmail(body.email);
    const password = assertPassword(body.password);

    if (body.confirmPassword !== undefined && body.confirmPassword !== password) {
      throw badRequest("Passwords do not match", "confirmPassword");
    }

    const existing = await User.findOne({ email });
    if (existing) throw conflict("An account with this email already exists", "email");

    const countryMeta = resolveCountry(body.country);

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: body.role === "elderly" || body.role === "senior" || body.role === "patient"
        ? "elderly"
        : "caregiver",
      country: countryMeta.code,
      timezone: optionalString(body.timezone, countryMeta.timezone, 64),
      locale: optionalString(body.locale, countryMeta.locale, 16),
      phone: optionalString(body.phone, "", 32),
      avatar: initialsOf(name),
      demo: false,
      includeDemoData: Boolean(body.includeDemoData),
    });

    // Materialise the default preference set so Settings has something to
    // PATCH on the very first visit.
    await UserSettings.create({ _id: user.id, userId: user.id, ...defaultSettings });

    // An elderly-role account manages its own care: link it to itself so the
    // care-link authorisation check passes for its own profile.
    if (user.role === "elderly") {
      await CareRelationship.create({
        _id: `rel-${user.id}`,
        caregiverId: user.id,
        elderlyUserId: user.id,
        relationship: "Self",
        isPrimary: true,
      });
    }

    const session = await issueSession(user.id, {
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    res.status(201).json({ user: toPublicUser(user), session });
  })
);

/**
 * GET /api/auth/me
 *
 * Returns null rather than 401 when there is no valid session, so the client
 * can boot straight into the sign-in screen without treating it as an error.
 */
router.get(
  "/me",
  route(async (req, res) => {
    const token = (req.get("authorization") || "").slice(7).trim();
    if (!token) return res.json(null);

    const user = await restoreUser(token);
    if (!user) return res.json(null);

    res.json({ user: toPublicUser(user), session: sessionView(user.id) });
  })
);

/** POST /api/auth/logout — revokes the current token server-side. */
router.post(
  "/logout",
  requireAuth,
  route(async (req, res) => {
    await revokeSession(req.token);
    res.json({ ok: true });
  })
);

/** PATCH /api/auth/me — edit own profile. */
router.patch(
  "/me",
  requireAuth,
  route(async (req, res) => {
    const body = req.body ?? {};
    const patch = {};

    if (body.name !== undefined) patch.name = assertName(body.name);
    if (body.email !== undefined) {
      const email = assertEmail(body.email);
      if (email !== req.user.email) {
        const clash = await User.findOne({ email });
        if (clash && clash.id !== req.user.id) {
          throw conflict("That email is already in use", "email");
        }
      }
      patch.email = email;
    }
    if (body.phone !== undefined) patch.phone = optionalString(body.phone, "", 32);
    if (body.timezone !== undefined) patch.timezone = optionalString(body.timezone, req.user.timezone, 64);
    if (body.locale !== undefined) patch.locale = optionalString(body.locale, req.user.locale, 16);
    if (body.country !== undefined) patch.country = assertCountry(body.country);
    if (body.includeDemoData !== undefined) {
      patch.includeDemoData = Boolean(body.includeDemoData);
    }
    if (patch.name) patch.avatar = initialsOf(patch.name);

    if (Object.keys(patch).length === 0) throw badRequest("Nothing to update");

    const user = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { returnDocument: "after" });
    if (!user) throw notFound("Account not found");

    res.json(toPublicUser(user));
  })
);

/**
 * POST /api/auth/change-password
 *
 * Every other session for this account is revoked, and the current token is
 * re-issued, so a password change actually locks out anyone else holding a
 * token.
 */
router.post(
  "/change-password",
  requireAuth,
  route(async (req, res) => {
    const current = String(req.body?.current ?? "");
    const next = String(req.body?.next ?? "");

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) throw notFound("Account not found");

    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) throw badRequest("Current password is incorrect", "current");

    assertPassword(next);

    user.passwordHash = await bcrypt.hash(next, BCRYPT_ROUNDS);
    await user.save();

    await revokeAllSessions(user.id, req.token);
    const session = await issueSession(user.id, {
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    res.json({ ok: true, user: toPublicUser(user), session });
  })
);

/* ------------------------------------------------------------------ helpers */

async function restoreUser(token) {
  const session = await Session.findOne({ tokenHash: hashToken(token) });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return User.findById(session.userId);
}

function sessionView(userId) {
  const now = new Date();
  return {
    userId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
}

export default router;
