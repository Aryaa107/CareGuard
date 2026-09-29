/**
 * DEMO / SIMULATED account directory.
 *
 * These records stand in for rows a real backend would return from `users`,
 * `elderly_profiles` and `care_relationships`. Everything here is mock data:
 * the health values are simulated, NOT measured by real medical devices
 * (see data/simulatedData.js).
 *
 * Shape mirrors the intended API contract so `services/*` can be repointed at a
 * FastAPI backend without touching UI components:
 *
 *   User             { id, name, email, role, country, timezone, locale, phone }
 *   ElderlyProfile   { id, name, age, country, timezone, status, sim, ... }
 *   CareRelationship { caregiverId, elderlyUserId, relationship, isPrimary }
 */
import { resolveCountry } from "./countries";

export const ROLES = {
  caregiver: "Caregiver / Family Member",
  elderly: "Elderly User",
};

/** Status vocabulary shared by profiles and the care-circle list. */
export const CARE_STATUS = {
  safe: { label: "Safe · Active", tone: "good" },
  pending: { label: "Check-in pending", tone: "warn" },
  attention: { label: "Needs attention", tone: "danger" },
  offline: { label: "Device offline", tone: "neutral" },
};

/* ------------------------------------------------------------------ accounts */

export const DEMO_USERS = [
  {
    id: "user-aryaa",
    name: "Aryaa Menon",
    email: "aryaa@careguard.app",
    role: "caregiver",
    country: "IN",
    timezone: "Asia/Kolkata",
    locale: "en-IN",
    phone: "98450 22140",
    avatar: "AM",
  },
  {
    id: "user-daniel",
    name: "Daniel Okonkwo",
    email: "daniel@careguard.app",
    role: "caregiver",
    country: "US",
    timezone: "America/New_York",
    locale: "en-US",
    phone: "917 555 0148",
    avatar: "DO",
  },
  {
    id: "user-elena",
    name: "Elena Weiss",
    email: "elena@careguard.app",
    role: "caregiver",
    country: "DE",
    timezone: "Europe/Berlin",
    locale: "de-DE",
    phone: "151 2345 6780",
    avatar: "EW",
  },
  {
    id: "user-kenji",
    name: "Kenji Tanaka",
    email: "kenji@careguard.app",
    role: "elderly",
    country: "JP",
    timezone: "Asia/Tokyo",
    locale: "ja-JP",
    phone: "90 1234 5678",
    avatar: "KT",
  },
];

/**
 * Mock credentials for the prototype. Passwords are never stored in plaintext —
 * authService hashes these at seed time with lib/mockPassword.js.
 */
export const DEMO_CREDENTIALS = [
  { email: "aryaa@careguard.app", password: "careguard" },
  { email: "daniel@careguard.app", password: "careguard" },
  { email: "elena@careguard.app", password: "careguard" },
  { email: "kenji@careguard.app", password: "careguard" },
];


/* ------------------------------------------------- elderly demo profiles */

/**
 * Each profile carries a `sim` block: the baselines its simulated sensor stream
 * is generated around. That is what lets two demo users show different heart
 * rates and step counts without duplicating the dashboard per person.
 */
export const ELDERLY_PROFILES = [
  {
    id: "elderly-001",
    accountUserId: null,
    name: "Sarala Devi",
    shortName: "Sarala",
    avatar: "SD",
    age: 78,
    country: "IN",
    timezone: "Asia/Kolkata",
    status: "safe",
    address: "Jayanagar, Bengaluru",
    bloodGroup: "B+",
    conditions: ["Type 2 Diabetes", "Hypertension", "Osteoarthritis"],
    allergies: ["Penicillin", "Shellfish"],
    height: 152,
    weight: 58,
    doctor: "Dr. Meera Nair",
    clinic: "Aster Medical Centre",
    insurer: "Star Health · 4471 2290",
    zones: ["Home", "Temple", "Market"],
    device: { name: "CareBand X2", serial: "CGX2-77451", battery: 78, charging: false, signal: "Strong" },
    medicationLanguage: "Malayalam",
    sim: { seed: 4271, heartRate: 76, bloodOxygen: 98, temperature: 36.7, systolic: 118, diastolic: 76, steps: 6842, glucose: 112, careScore: 87, sleepAvg: 7.2 },
  },
  {
    id: "elderly-002",
    accountUserId: null,
    name: "Maria Johnson",
    shortName: "Maria",
    avatar: "MJ",
    age: 81,
    country: "US",
    timezone: "America/New_York",
    status: "safe",
    address: "Brooklyn, New York",
    bloodGroup: "O+",
    conditions: ["Hypertension", "Osteoporosis"],
    allergies: ["Sulfa drugs"],
    height: 160,
    weight: 64,
    doctor: "Dr. Alan Reyes",
    clinic: "Brooklyn General",
    insurer: "Medicare Advantage · B4J 9921",
    zones: ["Home", "Community Church", "Riverside Park"],
    device: { name: "CareBand X2", serial: "CGX2-88204", battery: 64, charging: true, signal: "Strong" },
    medicationLanguage: "English",
    sim: { seed: 8812, heartRate: 81, bloodOxygen: 96, temperature: 36.4, systolic: 132, diastolic: 82, steps: 4310, glucose: 104, careScore: 74, sleepAvg: 6.3 },
  },
  {
    id: "elderly-003",
    accountUserId: null,
    name: "Robert Wilson",
    shortName: "Robert",
    avatar: "RW",
    age: 86,
    country: "US",
    timezone: "America/Chicago",
    status: "pending",
    address: "Evanston, Illinois",
    bloodGroup: "A-",
    conditions: ["Atrial Fibrillation", "Chronic Kidney Disease"],
    allergies: ["Latex", "Codeine"],
    height: 174,
    weight: 79,
    doctor: "Dr. Priya Raman",
    clinic: "Northwestern Memorial",
    insurer: "Blue Cross PPO · 77-QX 4410",
    zones: ["Home", "Day Centre", "Lakefront"],
    device: { name: "CareBand X2", serial: "CGX2-90117", battery: 22, charging: false, signal: "Weak" },
    medicationLanguage: "English",
    sim: { seed: 3145, heartRate: 92, bloodOxygen: 94, temperature: 36.9, systolic: 141, diastolic: 88, steps: 2180, glucose: 126, careScore: 58, sleepAvg: 5.4 },
  },
  {
    id: "elderly-004",
    accountUserId: "user-kenji",
    name: "Kenji Tanaka",
    shortName: "Kenji",
    avatar: "KT",
    age: 79,
    country: "JP",
    timezone: "Asia/Tokyo",
    status: "pending",
    address: "Nishinari-ku, Osaka",
    bloodGroup: "AB+",
    conditions: ["Post-stroke recovery", "Mild dementia"],
    allergies: ["None recorded"],
    height: 165,
    weight: 61,
    doctor: "Dr. Yuki Sato",
    clinic: "Osaka Community Clinic",
    insurer: "National Health Insurance · 44-2219",
    zones: ["Home", "Bathhouse", "Station"],
    device: { name: "CareBand X2", serial: "CGX2-73320", battery: 41, charging: false, signal: "Moderate" },
    medicationLanguage: "Japanese",
    sim: { seed: 6607, heartRate: 68, bloodOxygen: 97, temperature: 36.3, systolic: 128, diastolic: 79, steps: 7204, glucose: 96, careScore: 81, sleepAvg: 6.9 },
  },
  {
    id: "elderly-005",
    accountUserId: null,
    name: "Helga Bauer",
    shortName: "Helga",
    avatar: "HB",
    age: 74,
    country: "DE",
    timezone: "Europe/Berlin",
    status: "safe",
    address: "Prenzlauer Berg, Berlin",
    bloodGroup: "B-",
    conditions: ["Hypothyroidism", "Vitamin D Deficiency"],
    allergies: ["Peanuts"],
    height: 168,
    weight: 70,
    doctor: "Dr. Katrin Vogel",
    clinic: "Charité Ambulatorium",
    insurer: "AOK Legal · KV 88 441 02",
    zones: ["Home", "Café Linden", "Tiergarten"],
    device: { name: "CareBand X2", serial: "CGX2-65582", battery: 88, charging: false, signal: "Strong" },
    medicationLanguage: "German",
    sim: { seed: 5150, heartRate: 70, bloodOxygen: 98, temperature: 36.5, systolic: 121, diastolic: 74, steps: 8940, glucose: 92, careScore: 91, sleepAvg: 7.6 },
  },
];

/* ------------------------------------------- caregiver <-> elderly links */

/**
 * The relationship table. A caregiver only ever sees elderly profiles linked to
 * their own account, which is what makes the dashboard user-specific.
 */
export const CARE_RELATIONSHIPS = [
  // Aryaa -> Sarala (the original demo household)
  { caregiverId: "user-aryaa", elderlyUserId: "elderly-001", relationship: "Daughter", isPrimary: true },

  // Daniel -> three elderly people across three timezones (Part 7 demo)
  { caregiverId: "user-daniel", elderlyUserId: "elderly-002", relationship: "Mother", isPrimary: true },
  { caregiverId: "user-daniel", elderlyUserId: "elderly-003", relationship: "Father", isPrimary: false },
  { caregiverId: "user-daniel", elderlyUserId: "elderly-004", relationship: "Neighbour", isPrimary: false },

  // Elena -> Helga
  { caregiverId: "user-elena", elderlyUserId: "elderly-005", relationship: "Daughter", isPrimary: true },

  // Kenji's own account: an elderly-role login manages its own care
  { caregiverId: "user-kenji", elderlyUserId: "elderly-004", relationship: "Self", isPrimary: true },
];

/**
 * People sharing access to one elderly profile — the grid on Family Care and the
 * escalation order on Emergency. `access` mirrors the permission matrix columns.
 */
export const CARE_TEAMS = {
  "elderly-001": [
    { name: "Aryaa Menon", relation: "Daughter", role: "Primary Caregiver", access: ["Health", "Location", "SOS", "Calls"], status: "online", lastSeen: "Active now" },
    { name: "Rohit Menon", relation: "Son", role: "Co-caregiver", access: ["Health", "SOS"], status: "away", lastSeen: "12 min ago" },
    { name: "Neha Menon", relation: "Granddaughter", role: "Visitor", access: ["Calls"], status: "offline", lastSeen: "Yesterday" },
    { name: "Suresh Kumar", relation: "Neighbour", role: "Trusted Contact", access: ["SOS", "Location"], status: "online", lastSeen: "5 min ago" },
  ],
  "elderly-002": [
    { name: "Daniel Okonkwo", relation: "Caregiver", role: "Primary Caregiver", access: ["Health", "Location", "SOS", "Calls"], status: "online", lastSeen: "Active now" },
    { name: "Grace Johnson", relation: "Sister", role: "Co-caregiver", access: ["Health", "SOS"], status: "online", lastSeen: "2 min ago" },
    { name: "Nia Okonkwo", relation: "Niece", role: "Visitor", access: ["Calls"], status: "offline", lastSeen: "Yesterday" },
  ],
  "elderly-003": [
    { name: "Daniel Okonkwo", relation: "Caregiver", role: "Primary Caregiver", access: ["Health", "Location", "SOS", "Calls"], status: "online", lastSeen: "Active now" },
    { name: "Evanston Day Staff", relation: "Agency", role: "Professional Carer", access: ["Health", "Location", "SOS"], status: "away", lastSeen: "26 min ago" },
  ],
  "elderly-004": [
    { name: "Kenji Tanaka", relation: "Self", role: "Member", access: ["Health", "SOS", "Calls"], status: "online", lastSeen: "Active now" },
    { name: "Daniel Okonkwo", relation: "Neighbour", role: "Remote Caregiver", access: ["Health", "SOS", "Location"], status: "online", lastSeen: "Active now" },
    { name: "Osaka Community Nurse", relation: "Agency", role: "Professional Carer", access: ["Health", "SOS"], status: "offline", lastSeen: "3 hours ago" },
  ],
  "elderly-005": [
    { name: "Elena Weiss", relation: "Daughter", role: "Primary Caregiver", access: ["Health", "Location", "SOS", "Calls"], status: "online", lastSeen: "Active now" },
    { name: "Pflegedienst Ambulant", relation: "Agency", role: "Professional Carer", access: ["Health", "SOS"], status: "away", lastSeen: "40 min ago" },
  ],
};

/* ---------------------------------------------------------------- helpers */

function initialsOf(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** Attach country-derived display fields so components never re-derive them. */
export function decorateProfile(profile) {
  if (!profile) return null;
  const country = resolveCountry(profile.country);
  return {
    ...profile,
    locale: profile.locale || country.locale,
    currency: country.currency,
    countryName: country.name,
    dialCode: country.dialCode,
    emergencyNumber: country.emergency,
    /** Back-compat alias: the UI historically read `photo` for avatar initials. */
    photo: profile.avatar,
  };
}

export function findProfileById(id) {
  return ELDERLY_PROFILES.find((p) => p.id === id) || null;
}

export function findUserById(id) {
  return DEMO_USERS.find((u) => u.id === id) || null;
}

/** Every elderly profile a user is entitled to see, primary link first. */
export function relationshipsFor(caregiverId) {
  return CARE_RELATIONSHIPS.filter((r) => r.caregiverId === caregiverId).sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
  );
}

export function teamFor(elderlyUserId) {
  return (CARE_TEAMS[elderlyUserId] || []).map((m) => ({ ...m, avatar: m.avatar || initialsOf(m.name) }));
}

/**
 * Default privacy for an elderly profile.
 *
 * Location sharing is deliberately NOT fully on by default: live tracking needs
 * an explicit opt-in, so the conservative "emergency-only" value is the
 * starting point (Part 16).
 */
export function defaultPrivacy(elderlyUserId) {
  return {
    elderlyUserId,
    activityMonitoring: true,
    locationSharing: "emergency-only", // "off" | "emergency-only" | "live"
    emergencySharing: true,
    shareWithTeam: true,
    dataRetentionDays: 90,
  };
}
