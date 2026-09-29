/**
 * SIMULATED CARE DATA — read this before changing anything below.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ Every number produced here is DEMO / SIMULATED.                        │
 * │                                                                        │
 * │ CareGuard is NOT connected to a heart-rate monitor, pulse oximeter,     │
 * │ thermometer or fall-detection wearable in this build. Nothing here is  │
 * │ a medical measurement and none of it must be presented as one.         │
 * │                                                                        │
 * │ The shapes are deliberately API-shaped so `services/healthService.js`  │
 * │ can later call a real device gateway and return the same objects, with │
 * │ `simulated` flipped to false.                                          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * One bundle is built per elderly profile, which is why two demo users show
 * different heart rates, step counts, medications and alerts.
 */
import { buildVitals, buildWeek, rnd } from "./careData.js";
import { decorateProfile, teamFor, CARE_STATUS } from "./demoProfiles.js";
import { formatPhone } from "../lib/format.js";
import { demoTimeToDate } from "../lib/time.js";

/** Marked on every payload so the UI can be honest about the data source. */
export const SIMULATED = true;

/** Dose slots reused by the medication builder. */
const SLOTS = {
  morning: { time: "8:00 AM", period: "morning" },
  afternoon: { time: "1:00 PM", period: "afternoon" },
  evening: { time: "8:00 PM", period: "evening" },
  night: { time: "10:00 PM", period: "night" },
};

const PILLETTE = ["#8bd3c7", "#7fb8f0", "#f0c46a", "#b39ae0", "#f2a1a1", "#8fd0a8"];

/**
 * Mock dispensary catalogue. Medications are picked from the profile's recorded
 * conditions so each demo person's regimen actually matches their history.
 */
const MEDICINE_BY_CONDITION = {
  "Type 2 Diabetes": { name: "Metformin 500mg", dose: "1 tablet", type: "Diabetes", slot: "morning", withFood: true },
  Hypertension: { name: "Amlodipine 5mg", dose: "1 tablet", type: "Blood Pressure", slot: "morning", withFood: false },
  Osteoarthritis: { name: "Paracetamol 650mg", dose: "1 tablet", type: "Pain", slot: "afternoon", withFood: false },
  Osteoporosis: { name: "Alendronate 70mg", dose: "1 tablet", type: "Bone Health", slot: "morning", withFood: true },
  "Atrial Fibrillation": { name: "Apixaban 5mg", dose: "1 tablet", type: "Anticoagulant", slot: "morning", withFood: false },
  "Chronic Kidney Disease": { name: "Sevelamer 800mg", dose: "2 tablets", type: "Phosphate Binder", slot: "evening", withFood: true },
  "Post-stroke recovery": { name: "Clopidogrel 75mg", dose: "1 tablet", type: "Antiplatelet", slot: "morning", withFood: false },
  "Mild dementia": { name: "Donepezil 5mg", dose: "1 tablet", type: "Cognitive", slot: "night", withFood: false },
  Hypothyroidism: { name: "Levothyroxine 50mcg", dose: "1 tablet", type: "Thyroid", slot: "morning", withFood: false },
  "Vitamin D Deficiency": { name: "Vitamin D3", dose: "1 capsule", type: "Supplement", slot: "afternoon", withFood: true },
};

/**
 * Build a profile's medication schedule from its conditions, capped at four so
 * the timeline UI keeps its shape. Adherence is driven by the care score.
 */
function buildMedications(profile, r) {
  const picked = [];
  const seen = new Set();

  profile.conditions.forEach((c) => {
    const m = MEDICINE_BY_CONDITION[c];
    if (m && !seen.has(m.name)) {
      seen.add(m.name);
      picked.push(m);
    }
  });

  // Everyone gets a supplement so the afternoon slot is never empty.
  if (!seen.has("Vitamin D3")) picked.push(MEDICINE_BY_CONDITION["Vitamin D Deficiency"]);
  if (picked.length < 4) {
    picked.push({ name: "Atorvastatin 10mg", dose: "1 tablet", type: "Cholesterol", slot: "evening", withFood: false });
  }

  const adherenceFloor = (profile.sim.careScore || 80) / 100;

  return picked.slice(0, 4).map((m, i) => {
    const taken = r() < adherenceFloor;
    return {
      id: i + 1,
      name: m.name,
      dose: m.dose,
      time: SLOTS[m.slot].time,
      period: SLOTS[m.slot].period,
      taken,
      takenAt: taken ? SLOTS[m.slot].time.replace(/:\d\d/, `:0${i + 2}`) : null,
      type: m.type,
      withFood: m.withFood,
      remaining: 6 + Math.round(r() * 24),
      color: PILLETTE[i % PILLETTE.length],
    };
  });
}


/**
 * Alert feed. `time`/`date` stay the profile's own wall-clock labels; `at` is a
 * real ISO instant derived from them, which is what lets the UI re-render each
 * timestamp in the *viewer's* timezone (Part 9).
 */
function buildAlerts(profile, r) {
  const tz = profile.timezone;
  const who = profile.shortName;
  const zoneName = profile.zones[1] || "a safe zone";
  const glucoseHigh = profile.sim.glucose > 140;

  const rows = [
    { id: 1, type: "success", icon: "check", title: "Daily check-in completed", detail: `${who} confirmed they are feeling well.`, time: "5:42 PM", date: "Today", read: false, source: "Simulated feed" },
    { id: 2, type: "warning", icon: "activity", title: "Low movement detected", detail: "No movement recorded for 95 minutes during daytime.", time: "2:15 PM", date: "Today", read: false, source: "Simulated feed" },
    { id: 3, type: "warning", icon: "pill", title: "Evening dose not taken", detail: "Reminder repeated on the wristband after 10 minutes.", time: "8:14 PM", date: "Today", read: false, source: "Medication schedule" },
    { id: 5, type: "info", icon: "location", title: "Left safe zone", detail: `${who} moved 320 m outside the ${zoneName} safe zone.`, time: "11:18 AM", date: "Today", read: true, source: "Geofence" },
    { id: 6, type: "success", icon: "check", title: "Nightly check-in completed", detail: "Good night. All readings normal.", time: "9:30 PM", date: "Yesterday", read: true, source: "Simulated feed" },
    { id: 7, type: "warning", icon: "battery", title: "Device battery low", detail: `Band battery at ${profile.device.battery}%. Charge before tonight.`, time: "8:12 PM", date: "Yesterday", read: true, source: "CareBand X2" },
  ];

  if (glucoseHigh) {
    rows.splice(3, 0, { id: 4, type: "danger", icon: "heart", title: "Blood sugar above target", detail: `Reading of ${profile.sim.glucose} mg/dL detected after lunch.`, time: "12:50 PM", date: "Today", read: true, source: "Glucometer (manual)" });
  }

  return rows.map((a) => {
    const at = demoTimeToDate(a.time, a.date, tz);
    return { ...a, at: at ? at.toISOString() : null };
  });
}

/** Movement timeline for Activity & Falls, keyed to the profile's own zones. */
function buildActivityTimeline(profile, r) {
  const [home, second, third] = profile.zones;
  return [
    { time: "8:12 AM", label: "Morning walk", detail: `${380 + Math.round(r() * 400)} steps · ${12 + Math.round(r() * 10)} min`, tone: "good" },
    { time: "9:40 AM", label: "Kitchen activity", detail: "Preparing breakfast", tone: "info" },
    { time: "11:20 AM", label: `Visit to ${second}`, detail: `Left ${home} safe zone`, tone: "warn" },
    { time: "12:50 PM", label: "Lunch", detail: "Meal logged", tone: "info" },
    { time: "1:20 PM", label: "Rest period", detail: "95 min low movement", tone: "warn" },
    { time: "4:30 PM", label: `Time at ${third}`, detail: `${800 + Math.round(r() * 700)} steps`, tone: "good" },
  ];
}

/** Safe zones + visit history, built from the profile's own place names. */
function buildPlaces(profile, r) {
  const tones = ["#3aa88f", "#7fb8f0", "#f0c46a"];
  const safeZones = profile.zones.map((name, i) => ({
    id: i + 1,
    name,
    radius: 80 + Math.round(r() * 90),
    status: i === 0 ? "inside" : "outside",
    color: tones[i % tones.length],
  }));

  const locationHistory = [
    { place: profile.zones[0], time: "5:42 PM", duration: "3h 20m", icon: "home" },
    { place: profile.zones[1], time: "11:20 AM", duration: "1h 10m", icon: "building" },
    { place: profile.zones[0], time: "7:05 AM", duration: "3h 45m", icon: "home" },
    { place: profile.zones[2], time: "6:10 AM", duration: "35m", icon: "shopping" },
  ];

  return { safeZones, locationHistory };
}

/**
 * Escalation ladder. Contacts come from the profile's care team plus that
 * country's own emergency number, so nothing assumes +91 or 112.
 */
function buildEmergencyContacts(profile) {
  const team = teamFor(profile.id);
  const contacts = team.slice(0, 2).map((m, i) => ({
    id: i + 1,
    name: m.name,
    number: m.phone || formatPhone(placeholderNumber(profile.sim.seed + i), profile.country),
    relation: m.relation,
    primary: i === 0,
  }));

  contacts.push({
    id: contacts.length + 1,
    name: "Emergency Services",
    number: profile.emergencyNumber,
    relation: "Ambulance / Police",
    primary: false,
    isEmergencyService: true,
  });

  return contacts;
}

/** Deterministic placeholder subscriber number — not a real, dialable number. */
function placeholderNumber(seed) {
  const r = rnd(seed);
  const block = () => String(Math.floor(r() * 100)).padStart(2, "0");
  return `000 00${block()} ${block()}${block()}`;
}

/** Medical snapshot card used on Emergency and Reports. */
function buildMedicalProfile(profile) {
  return [
    { label: "Blood Group", value: profile.bloodGroup },
    { label: "Height / Weight", value: `${profile.height} cm · ${profile.weight} kg` },
    { label: "Conditions", value: profile.conditions.join(", ") },
    { label: "Allergies", value: profile.allergies.join(", ") },
    { label: "Primary Doctor", value: profile.doctor },
    { label: "Clinic", value: profile.clinic },
    { label: "Insurance", value: profile.insurer },
    { label: "Country / Zone", value: `${profile.countryName} · ${profile.timezone}` },
  ];
}

/**
 * Build the full demo care bundle for one elderly profile.
 *
 * Called by dataService whenever the active elderly profile changes, so every
 * screen reads figures generated around that person's own baselines instead of
 * one global fixture.
 */
export function buildCareBundle(rawProfile, relationship = null) {
  const profile = decorateProfile(rawProfile);
  const sim = profile.sim || {};
  const r = rnd((sim.seed || 1) + 17);

  const vitals = buildVitals(sim.seed || 4271, {
    heartRate: sim.heartRate,
    bloodOxygen: sim.bloodOxygen,
    temperature: sim.temperature,
    systolic: sim.systolic,
    diastolic: sim.diastolic,
    steps: sim.steps,
  });

  const last = (arr) => arr[arr.length - 1];
  const daySteps = vitals.steps.reduce((a, b) => a + b, 0);
  const careScore = sim.careScore ?? 80;
  const { safeZones, locationHistory } = buildPlaces(profile, r);
  const medications = buildMedications(profile, r);
  const takenCount = medications.filter((m) => m.taken).length;

  return {
    simulated: SIMULATED,
    profile,
    relationship,
    careStatus: CARE_STATUS[profile.status] || CARE_STATUS.safe,

    /* live-ish snapshot ------------------------------------------------- */
    snapshot: {
      simulated: SIMULATED,
      heartRate: last(vitals.hr),
      bloodOxygen: last(vitals.spo2),
      steps: daySteps,
      bodyTemperature: last(vitals.temp),
      bloodPressure: `${last(vitals.sys)}/${last(vitals.dia)}`,
      glucose: sim.glucose,
      careScore,
      device: { ...profile.device },
      location: {
        place: safeZones[0].name,
        address: profile.address,
        coordinates: "—",
        simulatedLocation: true,
      },
    },

    vitals,
    healthVitals: [
      { id: "heart", label: "Heart Rate", value: `${last(vitals.hr)}`, unit: "BPM", delta: `${(r() * 2).toFixed(1)}%`, deltaType: "good", icon: "heart", status: "normal", color: "#f2a1a1" },
      { id: "oxygen", label: "Blood Oxygen", value: `${last(vitals.spo2)}`, unit: "%", delta: "Stable", deltaType: "good", icon: "activity", status: "normal", color: "#7fb8f0" },
      { id: "temp", label: "Temperature", value: `${last(vitals.temp)}`, unit: "°C", delta: "Normal", deltaType: "good", icon: "thermometer", status: "normal", color: "#f0c46a" },
      { id: "pressure", label: "Blood Pressure", value: `${last(vitals.sys)}/${last(vitals.dia)}`, unit: "mmHg", delta: "Elevated", deltaType: "warn", icon: "activity", status: "elevated", color: "#8bd3c7" },
    ],

    stats: [
      { id: "heart", label: "Heart Rate", value: `${last(vitals.hr)}`, unit: "BPM", delta: "+2.4%", deltaType: "good", icon: "heart", status: "normal", color: "#f2a1a1" },
      { id: "steps", label: "Steps Today", value: daySteps, unit: "", delta: "+12%", deltaType: "good", icon: "activity", status: "good", color: "#8bd3c7" },
      { id: "oxygen", label: "Blood Oxygen", value: `${last(vitals.spo2)}`, unit: "%", delta: "Stable", deltaType: "good", icon: "activity", status: "normal", color: "#7fb8f0" },
      { id: "score", label: "Care Score", value: careScore, unit: "/100", delta: careScore >= 80 ? "+4" : "-6", deltaType: careScore >= 80 ? "good" : "bad", icon: "sparkles", status: careScore >= 80 ? "good" : "warn", color: "#b39ae0" },
    ],

    /* trends ------------------------------------------------------------- */
    heartTrend: buildWeek((sim.seed || 1) + 1, sim.heartRate || 74, 8),
    bpTrend: buildWeek((sim.seed || 1) + 2, sim.systolic || 116, 10),
    weekSteps: buildWeek((sim.seed || 1) + 3, Math.round((sim.steps || 6400) / 1000), 3).map((d) => ({
      ...d,
      value: Math.max(1, d.value),
    })),
    weekSleep: buildWeek((sim.seed || 1) + 4, Math.round(sim.sleepAvg || 7), 3).map((d) => ({
      ...d,
      value: Math.min(9, Math.max(4, d.value)),
    })),
    weekMood: buildWeek((sim.seed || 1) + 5, careScore, 12),
    adherence: {
      taken: takenCount,
      total: medications.length,
      label: `${takenCount} of ${medications.length} doses today`,
    },

    weeklyReport: {
      score: careScore,
      summary:
        careScore >= 80
          ? `${profile.shortName} had a steady week with strong activity and mostly on-time medication.`
          : `${profile.shortName} had a mixed week. Activity dipped and some check-ins were missed.`,
      highlights: [
        { icon: "activity", label: "Avg. daily steps", value: `${Math.round((sim.steps || 6400) / 100) / 10}k steps`, tone: "good" },
        { icon: "moon", label: "Average sleep", value: `${(sim.sleepAvg || 7).toFixed(1)} hrs`, tone: careScore >= 70 ? "good" : "warn" },
        { icon: "pill", label: "Medication adherence", value: `${Math.round((takenCount / medications.length) * 100)}%`, tone: takenCount === medications.length ? "good" : "warn" },
        { icon: "activity", label: "Resting heart rate", value: `${sim.heartRate || 74} bpm`, tone: "good" },
      ],
    },

    medications,
    initialAlerts: buildAlerts(profile, r),
    activityTimeline: buildActivityTimeline(profile, r),
    safeZones,
    locationHistory,
    emergencyContacts: buildEmergencyContacts(profile),
    careTeam: teamFor(profile.id),
    medicalProfile: buildMedicalProfile(profile),
  };
}
