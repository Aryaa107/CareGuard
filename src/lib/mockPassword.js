/**
 * MOCK PASSWORD HASHING — prototype only.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ THIS IS NOT A KDF. Do not ship it.                                      │
 * │                                                                         │
 * │ When a real backend lands, this whole module disappears and credential   │
 * │ verification moves server-side. A single unsalted-across-accounts       │
 * │ SHA-256 pass is fast enough to brute-force offline, which is the         │
 * │ opposite of what a password hash is for.                                 │
 * │                                                                         │
 * │ It exists for one reason: so the localStorage mock auth layer never      │
 * │ writes a plaintext password to disk. Nothing outside authService imports │
 * │ this file.                                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const WEB_CRYPTO = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

/** 32-char hex-ish digest of a salted password, or null if unavailable. */
async function sha256Hex(text) {
  if (!WEB_CRYPTO?.subtle) return null;
  const bytes = new TextEncoder().encode(text);
  const digest = await WEB_CRYPTO.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 32-bit FNV-1a, rendered as a 32-character string. Deterministic, weak, and
 * only reached when WebCrypto is missing (non-secure context or old browser).
 */
function fnv32(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const base = hash.toString(16).padStart(8, "0");
  return base.repeat(4).slice(0, 32);
}

/** Random per-user salt. */
export function makeSalt() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Hash a password with its salt. Prefixed so the scheme in use is visible in
 * storage: "sha256$…" when WebCrypto was available, "mock$…" when it was not.
 */
export async function hashPassword(password, salt) {
  const input = `${salt}:${password}`;
  const hex = await sha256Hex(input).catch(() => null);
  if (hex) return `sha256$${hex}`;
  return `mock$${fnv32(input)}`;
}

/** Recompute and compare against a stored digest, in constant-ish time. */
export async function verifyPassword(password, salt, stored) {
  if (!stored) return false;
  const candidate = await hashPassword(password, salt);
  if (candidate.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}
