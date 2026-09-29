/**
 * Vital-sign thresholds and severity classification.
 *
 * Shared by the client (for range bars and colour coding) and the server (for
 * deciding alert severity on a submitted reading) so the two can never drift
 * into disagreeing about what counts as "high".
 *
 * Tuned for a resting adult in a demo context. These are not clinical
 * thresholds and nothing here is medical advice.
 */

export const RANGES = {
  heartRate: { low: 50, high: 110, unit: "BPM" },
  bloodOxygen: { low: 94, high: 100, unit: "%" },
  bodyTemperature: { low: 35.8, high: 37.6, unit: "°C" },
  systolic: { low: 100, high: 140, unit: "mmHg" },
  diastolic: { low: 60, high: 90, unit: "mmHg" },
};

/** "low" | "high" | "normal" | "unknown" */
export function classify(metric, value) {
  const r = RANGES[metric];
  if (!r || value == null) return "unknown";
  if (value < r.low) return "low";
  if (value > r.high) return "high";
  return "normal";
}

/**
 * The combined blood-pressure verdict. Note this reports "attention" rather
 * than "low"/"high": a single out-of-range number is not the same finding as
 * an out-of-range pair, and the UI colours it differently.
 */
export function classifyBloodPressure(systolic, diastolic) {
  const sys = classify("systolic", systolic);
  const dia = classify("diastolic", diastolic);
  return sys === "normal" && dia === "normal" ? "normal" : "attention";
}

/** Every flag for one reading, in the shape the UI expects. */
export function flagsFor(reading) {
  return {
    heartRate: classify("heartRate", reading.heartRate),
    bloodOxygen: classify("bloodOxygen", reading.bloodOxygen),
    bodyTemperature: classify("bodyTemperature", reading.bodyTemperature),
    bloodPressure: classifyBloodPressure(reading.systolic, reading.diastolic),
  };
}
