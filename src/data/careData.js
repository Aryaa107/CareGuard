export const rnd = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const HOURS = [
  "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM",
  "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM",
  "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Vital baselines used when a profile does not specify its own. Roughly the
 * "healthy resting senior" shape the original demo was built around.
 */
export const DEFAULT_BASELINE = {
  heartRate: 74,
  bloodOxygen: 97.4,
  temperature: 36.6,
  systolic: 116,
  diastolic: 75,
  steps: 6400,
};

/** Rescale a generated shape so its daily total matches a target. */
function scaleToTotal(values, total) {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!sum) return values;
  const k = total / sum;
  return values.map((v) => Math.round(v * k));
}

/**
 * Build one simulated day of vitals.
 *
 * DEMO DATA ONLY — these are generated numbers, not readings from a wearable or
 * any medical device. `seed` keeps the shape stable between renders while
 * `baseline` shifts the whole curve to the profile's own resting values, which
 * is what gives each demo user different figures.
 */
export function buildVitals(seed, baseline = {}) {
  const b = { ...DEFAULT_BASELINE, ...baseline };
  const r = rnd(seed);
  const hr = [];
  const spo2 = [];
  const temp = [];
  const sys = [];
  const dia = [];
  const steps = [];

  for (let i = 0; i < 24; i += 1) {
    const active = i >= 7 && i <= 21;
    const wave = Math.sin(((i - 6) / 24) * Math.PI * 2);
    const noise = (r() - 0.5) * 8;

    hr.push(Math.round(b.heartRate + wave * 9 + (active ? noise * 0.6 : noise * 0.3)));
    spo2.push(Number((b.bloodOxygen - 1.4 + wave * 0.5 + (r() - 0.5) * 1.1).toFixed(1)));
    temp.push(Number((b.temperature + wave * 0.18 + (r() - 0.5) * 0.3).toFixed(1)));
    sys.push(Math.round(b.systolic - 2 + wave * 7 + (r() - 0.5) * 8));
    dia.push(Math.round(b.diastolic - 1 + wave * 5 + (r() - 0.5) * 6));
    steps.push(active ? Math.round(180 + Math.abs(wave) * 620 + r() * 240) : Math.round(r() * 26));
  }

  return {
    labels: HOURS,
    hr,
    spo2: spo2.map((v) => Math.min(100, v)),
    temp,
    sys,
    dia,
    steps: scaleToTotal(steps, b.steps),
  };
}

export function buildWeek(seed, base, spread) {
  const r = rnd(seed);
  return DAYS.map((d, i) => ({
    label: d,
    value: Math.round(base + (i === 4 ? -spread * 1.6 : 0) + (r() - 0.5) * spread),
  }));
}

export const vitals = buildVitals(4271);

export const senior = {
  name: "Maa Sarala Devi",
  shortName: "Sarala",
  age: 78,
  photo: "SD",
  bloodGroup: "B+",
  conditions: ["Type 2 Diabetes", "Hypertension", "Osteoarthritis"],
  allergies: ["Penicillin", "Shellfish"],
  height: 152,
  weight: 58,
  emergencyContact: "Aryaa (Daughter)",
  doctor: "Dr. Meera Nair",
  lastCheckIn: new Date(Date.now() - 1000 * 60 * 4),
  device: { name: "CareBand X2", battery: 78, charging: false, signal: "Strong" },
};

export const stats = [
  {
    id: "heart",
    label: "Heart Rate",
    value: "76",
    unit: "BPM",
    trend: -3,
    status: "Normal",
    tone: "good",
    series: vitals.hr,
  },
  {
    id: "spo2",
    label: "Oxygen (SpO₂)",
    value: "98",
    unit: "%",
    trend: 1,
    status: "Normal",
    tone: "good",
    series: vitals.spo2,
  },
  {
    id: "steps",
    label: "Steps Today",
    value: "6,842",
    unit: "steps",
    trend: 12,
    status: "+12% vs avg",
    tone: "good",
    series: vitals.steps,
  },
  {
    id: "checkin",
    label: "Last Check-in",
    value: "5:42",
    unit: "PM",
    trend: 0,
    status: "4 minutes ago",
    tone: "info",
    series: null,
  },
];

export const healthVitals = [
  { id: "hr", name: "Heart Rate", value: 76, unit: "BPM", range: "60 – 100", tone: "good", icon: "heart" },
  { id: "spo2", name: "Blood Oxygen", value: 98, unit: "%", range: "95 – 100", tone: "good", icon: "lung" },
  { id: "temp", name: "Body Temperature", value: 36.7, unit: "°C", range: "36.1 – 37.2", tone: "good", icon: "temp" },
  { id: "bp", name: "Blood Pressure", value: "118/76", unit: "mmHg", range: "< 130/85", tone: "good", icon: "bp" },
  { id: "glucose", name: "Blood Sugar", value: 112, unit: "mg/dL", range: "80 – 140", tone: "warn", icon: "drop" },
  { id: "weight", name: "Weight", value: 58, unit: "kg", range: "Stable", tone: "info", icon: "scale" },
];

export const weekSteps = buildWeek(991, 6400, 2400);
export const weekSleep = [
  { label: "Mon", value: 6.4 },
  { label: "Tue", value: 7.1 },
  { label: "Wed", value: 5.8 },
  { label: "Thu", value: 7.6 },
  { label: "Fri", value: 4.9 },
  { label: "Sat", value: 7.9 },
  { label: "Sun", value: 7.2 },
];
export const weekMood = [
  { label: "M", value: 7 },
  { label: "T", value: 8 },
  { label: "W", value: 6 },
  { label: "T", value: 7 },
  { label: "F", value: 5 },
  { label: "S", value: 9 },
  { label: "S", value: 8 },
];

export const heartTrend = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [
    { name: "Resting HR", data: [68, 71, 66, 73, 69, 64, 67], tone: "primary" },
    { name: "Walking HR", data: [92, 96, 90, 99, 94, 88, 91], tone: "warn" },
  ],
};

export const bpTrend = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [
    { name: "Systolic", data: [121, 118, 124, 116, 119, 113, 118], tone: "primary" },
    { name: "Diastolic", data: [78, 75, 80, 74, 77, 71, 76], tone: "info" },
  ],
};

export const medications = [
  {
    id: 1,
    name: "Metformin 500mg",
    dose: "1 tablet",
    time: "8:00 AM",
    period: "morning",
    taken: true,
    takenAt: "7:58 AM",
    type: "Diabetes",
    withFood: true,
    remaining: 18,
    color: "#8bd3c7",
  },
  {
    id: 2,
    name: "Amlodipine 5mg",
    dose: "1 tablet",
    time: "8:00 AM",
    period: "morning",
    taken: true,
    takenAt: "8:02 AM",
    type: "Blood Pressure",
    withFood: false,
    remaining: 24,
    color: "#7fb8f0",
  },
  {
    id: 3,
    name: "Vitamin D3",
    dose: "1 capsule",
    time: "1:00 PM",
    period: "afternoon",
    taken: true,
    takenAt: "1:04 PM",
    type: "Supplement",
    withFood: true,
    remaining: 12,
    color: "#f0c46a",
  },
  {
    id: 4,
    name: "Atorvastatin 10mg",
    dose: "1 tablet",
    time: "8:00 PM",
    period: "evening",
    taken: false,
    takenAt: null,
    type: "Cholesterol",
    withFood: false,
    remaining: 9,
    color: "#b39ae0",
  },
];

export const adherence = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [
    { name: "Taken", data: [100, 100, 75, 100, 100, 50, 100], tone: "primary" },
    { name: "Missed", data: [0, 0, 25, 0, 0, 50, 0], tone: "danger" },
  ],
};

export const familyMembers = [
  {
    id: 1,
    name: "Aryaa Menon",
    relation: "Daughter",
    role: "Primary Caregiver",
    status: "online",
    avatar: "AM",
    access: ["Health", "Location", "SOS", "Calls"],
    lastSeen: "Active now",
  },
  {
    id: 2,
    name: "Rohit Menon",
    relation: "Son",
    role: "Co-caregiver",
    status: "away",
    avatar: "RM",
    access: ["Health", "SOS"],
    lastSeen: "12 min ago",
  },
  {
    id: 3,
    name: "Neha Menon",
    relation: "Granddaughter",
    role: "Visitor",
    status: "offline",
    avatar: "NM",
    access: ["Calls"],
    lastSeen: "Yesterday",
  },
  {
    id: 4,
    name: "Suresh Kumar",
    relation: "Neighbor",
    role: "Trusted Contact",
    status: "online",
    avatar: "SK",
    access: ["SOS", "Location"],
    lastSeen: "5 min ago",
  },
];

export const emergencyContacts = [
  { id: 1, name: "Aryaa Menon", number: "+91 98450 22140", relation: "Daughter", primary: true },
  { id: 2, name: "Rohit Menon", number: "+91 98450 77318", relation: "Son", primary: false },
  { id: 3, name: "City Emergency", number: "112", relation: "Ambulance / Police", primary: false },
];

export const medicalProfile = [
  { label: "Blood Group", value: "B+" },
  { label: "Height / Weight", value: "152 cm · 58 kg" },
  { label: "Conditions", value: "Diabetes, Hypertension" },
  { label: "Allergies", value: "Penicillin, Shellfish" },
  { label: "Primary Doctor", value: "Dr. Meera Nair" },
  { label: "Insurance", value: "Star Health · 4471 2290" },
];

export const initialAlerts = [
  {
    id: 1,
    type: "success",
    icon: "check",
    title: "Daily check-in completed",
    detail: "Sarala confirmed she is feeling well.",
    time: "5:42 PM",
    date: "Today",
    read: false,
    source: "CareBand X2",
  },
  {
    id: 2,
    type: "warning",
    icon: "activity",
    title: "Low movement detected",
    detail: "No movement recorded for 95 minutes during daytime.",
    time: "2:15 PM",
    date: "Today",
    read: false,
    source: "Motion sensor",
  },
  {
    id: 3,
    type: "info",
    icon: "pill",
    title: "Medication taken",
    detail: "Vitamin D3 marked as taken at 1:04 PM.",
    time: "1:04 PM",
    date: "Today",
    read: true,
    source: "CareBand X2",
  },
  {
    id: 4,
    type: "danger",
    icon: "heart",
    title: "Blood sugar above target",
    detail: "Reading of 168 mg/dL detected after lunch.",
    time: "12:50 PM",
    date: "Today",
    read: true,
    source: "Glucometer",
  },
  {
    id: 5,
    type: "info",
    icon: "location",
    title: "Left safe zone",
    detail: "Sarala moved 320 m outside the Home safe zone.",
    time: "11:18 AM",
    date: "Today",
    read: true,
    source: "Geofence",
  },
  {
    id: 6,
    type: "success",
    icon: "check",
    title: "Nightly check-in completed",
    detail: "Good night. All readings normal.",
    time: "9:30 PM",
    date: "Yesterday",
    read: true,
    source: "CareBand X2",
  },
  {
    id: 7,
    type: "warning",
    icon: "battery",
    title: "Device battery low",
    detail: "Router battery at 24%. Charge before tonight.",
    time: "8:12 PM",
    date: "Yesterday",
    read: true,
    source: "Home Hub",
  },
];

export const safeZones = [
  { id: 1, name: "Home", radius: 120, status: "inside", color: "#3aa88f" },
  { id: 2, name: "Temple", radius: 90, status: "outside", color: "#7fb8f0" },
  { id: 3, name: "Market", radius: 150, status: "outside", color: "#f0c46a" },
];

export const locationHistory = [
  { place: "Home", time: "5:42 PM", duration: "3h 20m", icon: "home" },
  { place: "Temple", time: "11:20 AM", duration: "1h 10m", icon: "temple" },
  { place: "Home", time: "7:05 AM", duration: "3h 45m", icon: "home" },
  { place: "Market", time: "6:10 AM", duration: "35m", icon: "market" },
];

export const activityTimeline = [
  { time: "8:12 AM", label: "Morning walk", detail: "640 steps · 18 min", tone: "good" },
  { time: "9:40 AM", label: "Kitchen activity", detail: "Preparing breakfast", tone: "info" },
  { time: "11:20 AM", label: "Temple visit", detail: "Left Home safe zone", tone: "warn" },
  { time: "12:50 PM", label: "Lunch", detail: "Meal logged", tone: "info" },
  { time: "1:20 PM", label: "Rest period", detail: "95 min low movement", tone: "warn" },
  { time: "4:30 PM", label: "Garden time", detail: "1,240 steps", tone: "good" },
];

export const weeklyReport = {
  score: 87,
  change: 4,
  highlights: [
    "Medication adherence improved to 94% (up 8%).",
    "Average sleep rose to 7.2 hours, best in 3 months.",
    "Blood pressure stayed within target on 6 of 7 days.",
    "Two late-night wandering alerts were resolved by Aryaa.",
  ],
  concerns: [
    "Blood sugar trending high after lunch (avg 152 mg/dL).",
    "Two evenings with no evening walk — activity dipped on Friday.",
  ],
};

export const wellness = [
  { id: "walk", title: "Afternoon Walk", detail: "20 min · ~1,800 steps", done: false, icon: "foot" },
  { id: "water", title: "Drink 6 Glasses of Water", detail: "4 of 6 completed", done: false, icon: "drop" },
  { id: "checkin", title: "Evening Check-in", detail: "Due at 7:00 PM", done: false, icon: "check" },
  { id: "stretch", title: "Light Stretching", detail: "Knee-friendly routine", done: true, icon: "activity" },
];

export const defaultSettings = {
  textScale: 1,
  highContrast: false,
  reduceMotion: false,
  voiceAssist: true,
  sosHoldSeconds: 3,
  callAmbulance: true,
  notifySms: true,
  notifyPush: true,
  quietHours: true,
  geofenceAlerts: true,
  fallSensitivity: "Balanced",
  weeklyReports: true,
  // The daily wellness checklist is the caregiver's own to-do list rather than
  // anything measured about the person in their care, so it is stored with the
  // account's other preferences.
  wellness,
};

export const navGroups = [
  {
    title: "Monitoring",
    items: [
      { id: "overview", label: "Overview", icon: "LayoutDashboard" },
      { id: "health", label: "Health Monitor", icon: "HeartPulse" },
      { id: "activity", label: "Activity & Falls", icon: "Activity" },
      { id: "location", label: "Live Location", icon: "MapPin" },
    ],
  },
  {
    title: "Care",
    items: [
      { id: "medications", label: "Medications", icon: "Pill" },
      { id: "alerts", label: "Alerts", icon: "Bell", badge: 3 },
      { id: "family", label: "Family Care", icon: "Users" },
      { id: "senior", label: "Senior View", icon: "Sun" },
    ],
  },
  {
    title: "Safety",
    items: [
      { id: "emergency", label: "Emergency", icon: "Siren", urgent: true },
      { id: "reports", label: "Reports & Insights", icon: "FileBarChart" },
    ],
  },
];
