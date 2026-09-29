/**
 * Country registry for CareGuard.
 *
 * Single source of truth for dial codes, default timezones, locales, currencies
 * and local emergency numbers. Registration, profiles and phone formatting all
 * read from here, so nothing in the UI assumes a single country.
 */

export const COUNTRIES = [
  { code: "IN", name: "India", dialCode: "+91", ddi: "91", timezone: "Asia/Kolkata", locale: "en-IN", currency: "INR", emergency: "112" },
  { code: "US", name: "United States", dialCode: "+1", ddi: "1", timezone: "America/New_York", locale: "en-US", currency: "USD", emergency: "911" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", ddi: "44", timezone: "Europe/London", locale: "en-GB", currency: "GBP", emergency: "999" },
  { code: "CA", name: "Canada", dialCode: "+1", ddi: "1", timezone: "America/Toronto", locale: "en-CA", currency: "CAD", emergency: "911" },
  { code: "AU", name: "Australia", dialCode: "+61", ddi: "61", timezone: "Australia/Sydney", locale: "en-AU", currency: "AUD", emergency: "000" },
  { code: "JP", name: "Japan", dialCode: "+81", ddi: "81", timezone: "Asia/Tokyo", locale: "ja-JP", currency: "JPY", emergency: "119" },
  { code: "DE", name: "Germany", dialCode: "+49", ddi: "49", timezone: "Europe/Berlin", locale: "de-DE", currency: "EUR", emergency: "112" },
  { code: "SG", name: "Singapore", dialCode: "+65", ddi: "65", timezone: "Asia/Singapore", locale: "en-SG", currency: "SGD", emergency: "995" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", ddi: "971", timezone: "Asia/Dubai", locale: "en-AE", currency: "AED", emergency: "998" },
  { code: "ZA", name: "South Africa", dialCode: "+27", ddi: "27", timezone: "Africa/Johannesburg", locale: "en-ZA", currency: "ZAR", emergency: "10177" },
  { code: "BR", name: "Brazil", dialCode: "+55", ddi: "55", timezone: "America/Sao_Paulo", locale: "pt-BR", currency: "BRL", emergency: "192" },
  { code: "FR", name: "France", dialCode: "+33", ddi: "33", timezone: "Europe/Paris", locale: "fr-FR", currency: "EUR", emergency: "15" },
  { code: "ES", name: "Spain", dialCode: "+34", ddi: "34", timezone: "Europe/Madrid", locale: "es-ES", currency: "EUR", emergency: "112" },
  { code: "NL", name: "Netherlands", dialCode: "+31", ddi: "31", timezone: "Europe/Amsterdam", locale: "nl-NL", currency: "EUR", emergency: "112" },
  { code: "IE", name: "Ireland", dialCode: "+353", ddi: "353", timezone: "Europe/Dublin", locale: "en-IE", currency: "EUR", emergency: "112" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", ddi: "64", timezone: "Pacific/Auckland", locale: "en-NZ", currency: "NZD", emergency: "111" },
];

const BY_CODE = COUNTRIES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {});

/** Fallback used when a stored profile references an unknown country code. */
export const DEFAULT_COUNTRY = COUNTRIES[0];

export function getCountry(code) {
  return BY_CODE[code] || null;
}

/** Like getCountry, but never returns null. */
export function resolveCountry(code) {
  return getCountry(code) || DEFAULT_COUNTRY;
}

export function countryName(code) {
  return resolveCountry(code).name;
}

/**
 * A few large countries span several zones. The profile picker offers these;
 * everything else gets its single national zone.
 */
const EXTRA_TIMEZONES = {
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage"],
  CA: ["America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver"],
  AU: ["Australia/Sydney", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth"],
  IN: ["Asia/Kolkata"],
  GB: ["Europe/London"],
  JP: ["Asia/Tokyo"],
  DE: ["Europe/Berlin"],
  SG: ["Asia/Singapore"],
};

export function timezonesForCountry(code) {
  return EXTRA_TIMEZONES[code] || [resolveCountry(code).timezone];
}

/** IANA zone -> human label, e.g. "Asia/Kolkata · GMT +5:30". */
export function timezoneLabel(tz) {
  const offset = timezoneOffset(tz);
  return offset ? `${tz.replace(/_/g, " ")} · ${offset}` : tz.replace(/_/g, " ");
}

/**
 * Short UTC offset for a timezone, e.g. "GMT +5:30". Returns "" if the runtime
 * does not understand the zone so the UI can degrade quietly.
 */
export function timezoneOffset(tz, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const found = parts.find((p) => p.type === "timeZoneName");
    return found ? found.value.replace("GMT", "GMT ").trim() : "";
  } catch {
    return "";
  }
}
