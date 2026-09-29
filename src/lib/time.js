/**
 * Timezone-aware time formatting.
 *
 * Every timestamp in CareGuard is rendered through these helpers so that a
 * caregiver in Toronto and a senior in Tokyo see their own local clock. Nothing
 * here assumes Indian Standard Time.
 *
 * Demo alerts store a `time` string ("5:42 PM") plus a coarse `date` label
 * ("Today"/"Yesterday"). `demoTimeToDate` maps those onto a real Date inside the
 * profile's zone so they can be re-rendered for the viewer's zone.
 */

/** The browser's own IANA zone — acceptable default for the prototype. */
export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatter(timezone, options) {
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: timezone });
  } catch {
    // Unknown/unsupported zone: fall back to the viewer's own settings.
    return new Intl.DateTimeFormat(undefined, options);
  }
}

export function formatClock(date, timezone) {
  return formatter(timezone, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatClock24(date, timezone) {
  return formatter(timezone, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function formatDay(date, timezone) {
  return formatter(timezone, { weekday: "short", day: "numeric", month: "short" }).format(date);
}

export function formatDate(date, timezone) {
  return formatter(timezone, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date, timezone) {
  return `${formatDay(date, timezone)} · ${formatClock(date, timezone)}`;
}

/** "4 minutes ago" style relative label, clamped at one week. */
export function formatRelative(date, now = new Date()) {
  const diff = Math.round((now - date) / 1000);
  if (Number.isNaN(diff)) return "";
  if (diff < 45) return "just now";
  if (diff < 90) return "1 minute ago";
  const mins = Math.round(diff / 60);
  if (mins < 60) return `${mins} minutes ago`;
  if (mins < 90) return "1 hour ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return "over a week ago";
}

/**
 * Convert a demo "5:42 PM" + "Today" label into a real Date inside `timezone`.
 * Returns null for labels we cannot interpret, so callers keep their fallback.
 */
export function demoTimeToDate(timeLabel, dateLabel, timezone) {
  const m = /^(\d{1,2}):(\d{2})\s*([AP])M$/i.exec(String(timeLabel || "").trim());
  if (!m) return null;

  let hour = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "P") hour += 12;
  const minute = parseInt(m[2], 10);

  let dayShift = 0;
  if (/yesterday/i.test(dateLabel || "")) dayShift = -1;
  else if (/tomorrow/i.test(dateLabel || "")) dayShift = 1;

  // Wall-clock components as seen inside the profile's zone.
  const wall = zonedParts(new Date(), timezone);
  const base = Date.UTC(wall.year, wall.month - 1, wall.day + dayShift, hour, minute);
  const offsetMs = zoneOffsetMs(timezone, new Date(base));
  return new Date(base - offsetMs);
}

/** Wall-clock year/month/day/hour/minute for an instant, as seen in `timezone`. */
export function zonedParts(date, timezone) {
  try {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (t) => parseInt(p.find((x) => x.type === t)?.value || "0", 10);
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute") };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }
}

/** UTC offset of `timezone` at `at`, in milliseconds. */
export function zoneOffsetMs(timezone, at = new Date()) {
  try {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const get = (t) => parseInt(p.find((x) => x.type === t)?.value || "0", 10);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return asUtc - at.getTime();
  } catch {
    return 0;
  }
}
