import { SOLAR_TERM_CODES, type SolarTermEvent } from "./solarTerms.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

/** A finite corpus completeness assertion, NOT an astronomical/source certification. */
export interface FullYearSolarTermCoverageManifest {
  readonly schemaVersion: "m1-solar-term-coverage-v1";
  readonly requirementProfile: "FULL_24_TERM_YEAR";
  readonly timeBasis: "KST";
  readonly sourcePrecision: "MINUTE";
  readonly supportedFromInclusive: string;
  readonly supportedUntilExclusive: string;
  readonly requiredYears: readonly number[];
  readonly requiredPriorBoundary: { readonly year: number; readonly term: "DAXUE" };
}

/** A valid query beyond a declared finite calendar interval, not malformed input. */
export class SolarTermQueryOutOfCoverageError extends RangeError {
  constructor() {
    super("solar-term query is outside declared coverage");
    this.name = "SolarTermQueryOutOfCoverageError";
  }
}

function requireCivilMinute(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !isGregorianMinute(value)) {
    throw new RangeError(`${label} must be a valid Gregorian minute`);
  }
}

/**
 * Validate an explicitly declared full-calendar-year corpus before any chart
 * resolver is permitted to rely on its completeness. No implicit manifest,
 * fallback years, trusted-source status or minute-level astronomical accuracy.
 */
export function validateFullYearSolarTermCoverage(
  events: readonly SolarTermEvent[],
  manifest: FullYearSolarTermCoverageManifest,
  queryKstMinute: string,
): void {
  if (!manifest || manifest.schemaVersion !== "m1-solar-term-coverage-v1" ||
      manifest.requirementProfile !== "FULL_24_TERM_YEAR" ||
      manifest.timeBasis !== "KST" || manifest.sourcePrecision !== "MINUTE") {
    throw new RangeError("unsupported solar-term coverage manifest");
  }
  requireCivilMinute(manifest.supportedFromInclusive, "supportedFromInclusive");
  requireCivilMinute(manifest.supportedUntilExclusive, "supportedUntilExclusive");
  requireCivilMinute(queryKstMinute, "queryKstMinute");
  if (manifest.supportedFromInclusive >= manifest.supportedUntilExclusive) {
    throw new RangeError("invalid solar-term coverage interval");
  }
  const years = manifest.requiredYears;
  if (!Array.isArray(years) || years.length === 0 ||
      years.some((year, i) => !Number.isInteger(year) || year < 1000 || year > 9998 ||
        (i > 0 && year !== years[i - 1]! + 1))) {
    throw new RangeError("requiredYears must be nonempty consecutive Gregorian years");
  }
  const first = years[0]!;
  const last = years[years.length - 1]!;
  if (manifest.supportedFromInclusive !== `${first}-01-01T00:00` ||
      manifest.supportedUntilExclusive !== `${last + 1}-01-01T00:00` ||
      manifest.requiredPriorBoundary?.year !== first - 1 ||
      manifest.requiredPriorBoundary?.term !== "DAXUE") {
    throw new RangeError("full-year coverage interval and prior DAXUE guard must align");
  }
  if (queryKstMinute < manifest.supportedFromInclusive ||
      queryKstMinute >= manifest.supportedUntilExclusive) {
    throw new SolarTermQueryOutOfCoverageError();
  }
  validateKstMinuteSolarTermTimeline(events);
  const canonicalOrder: string[] = [`${first - 1}:DAXUE`];
  for (const year of years) {
    for (const term of SOLAR_TERM_CODES) canonicalOrder.push(`${year}:${term}`);
  }
  const expected = new Set<string>(canonicalOrder);
  const actual = new Set<string>();
  for (const event of events) {
    const year = Number(event.displayedDateTime.slice(0, 4));
    const key = `${year}:${event.term}`;
    if (!expected.has(key)) throw new Error(`undeclared solar-term coverage event: ${key}`);
    if (!Array.isArray(event.sourceIds) || event.sourceIds.length === 0 ||
        event.sourceIds.some((id) => typeof id !== "string" || id.trim() === "")) {
      throw new Error(`missing solar-term source provenance: ${key}`);
    }
    actual.add(key);
  }
  for (const key of expected) {
    if (!actual.has(key)) throw new Error(`missing required solar term: ${key}`);
  }
  // A complete set can still be mislabeled: e.g. swapping Xiaohan and Dahan
  // preserves uniqueness, chronology and coverage but corrupts month selection.
  // Validate the entire 24-term cycle, including the prior-year Daxue guard.
  for (let i = 0; i < canonicalOrder.length; i++) {
    const event = events[i];
    const observed = event ? `${event.displayedDateTime.slice(0, 4)}:${event.term}` : "<missing>";
    if (observed !== canonicalOrder[i]) {
      throw new Error(`noncanonical solar-term order at ${i}: expected ${canonicalOrder[i]}, got ${observed}`);
    }
  }
}
