/**
 * Display formatting helpers. Locale-aware so the app does not assume any single
 * country for phone numbers, numbers or currency.
 */
import { resolveCountry } from "../data/countries";

/**
 * Build a dial code catalogue for phone inputs. Countries sharing a dial code
 * (US/CA both +1) collapse to one entry so the picker stays readable.
 */
export function dialCodeOptions(countries) {
  const seen = new Map();
  (countries || []).forEach((c) => {
    if (!seen.has(c.dialCode)) seen.set(c.dialCode, c);
  });
  return [...seen.values()].sort((a, b) => a.dialCode.localeCompare(b.dialCode, undefined, { numeric: true }));
}

/** Format "98450 22140" + country code "IN" into "+91 98450 22140". */
export function formatPhone(national, countryCode) {
  if (!national) return "—";
  const dial = resolveCountry(countryCode).dialCode;
  const trimmed = String(national).trim();
  return trimmed.startsWith("+") ? trimmed : `${dial} ${trimmed}`;
}

/** Thousands-aware number formatting driven by the profile's locale. */
export function formatNumber(value, locale) {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}

/** Currency formatting; unused today but keeps INR assumptions out of the codebase. */
export function formatCurrency(value, locale, currency) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return String(value);
  }
}

/** Initials for avatars, e.g. "Aryaa Menon" -> "AM". */
export function initials(name, max = 2) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "–";
  return words
    .slice(0, max)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** First name only, for greetings. */
export function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

/**
 * Body temperature display. Metric profiles get Celsius, a small set of
 * countries get Fahrenheit. Stored data always stays in Celsius.
 */
const FAHRENHEIT_LOCALES = new Set(["en-US", "en-CA", "en-BS", "en-BZ", "en-KY"]);

export function usesFahrenheit(locale) {
  return FAHRENHEIT_LOCALES.has(locale);
}

export function formatTemperature(celsius, locale, digits = 1) {
  if (usesFahrenheit(locale)) {
    const f = (celsius * 9) / 5 + 32;
    return `${f.toFixed(0)} °F`;
  }
  return `${celsius.toFixed(digits)} °C`;
}
