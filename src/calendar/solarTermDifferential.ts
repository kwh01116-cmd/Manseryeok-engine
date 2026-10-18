import type { SolarTermCode, SolarTermEvent } from "./solarTerms.js";
import { validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

export interface SolarTermMinuteDifference {
  readonly civilYear: number;
  readonly term: SolarTermCode;
  readonly referenceMinute: string;
  readonly comparedMinute: string;
  /** compared minus reference, in displayed KST civil minutes; not a time-zone conversion. */
  readonly deltaMinutes: number;
  readonly referenceSourceIds: readonly string[];
  readonly comparedSourceIds: readonly string[];
}

/**
 * Compare two independently supplied KST minute editions without treating
 * structural agreement as astronomical certification. Works for a full year
 * or equal-key subsets. Missing or duplicate source keys fail closed.
 * In particular, a one-minute source disagreement is NOT silently rounded away.
 */
export function compareKstSolarTermMinuteEditions(
  reference: readonly SolarTermEvent[],
  compared: readonly SolarTermEvent[],
): readonly SolarTermMinuteDifference[] {
  validateKstMinuteSolarTermTimeline(reference);
  validateKstMinuteSolarTermTimeline(compared);
  const key = (event: SolarTermEvent): string => `${event.displayedDateTime.slice(0, 4)}:${event.term}`;
  const byKey = new Map(compared.map(event => [key(event), event] as const));
  if (reference.length === 0 || reference.length !== compared.length || byKey.size !== compared.length) {
    throw new RangeError("Solar-term editions require identical nonempty term-year keys.");
  }
  const report = reference.map(event => {
    const other = byKey.get(key(event));
    if (!other) throw new RangeError(`Missing solar-term edition key: ${key(event)}`);
    if (event.sourceIds.length === 0 || other.sourceIds.length === 0 ||
      event.sourceIds.some(id => typeof id !== "string" || !id.trim()) ||
      other.sourceIds.some(id => typeof id !== "string" || !id.trim())) {
      throw new RangeError(`Missing source provenance for ${key(event)}`);
    }
    const wallMinuteNumber = (value: string): number => Date.parse(`${value}:00Z`) / 60_000;
    return Object.freeze({
      civilYear: Number(event.displayedDateTime.slice(0, 4)),
      term: event.term,
      referenceMinute: event.displayedDateTime,
      comparedMinute: other.displayedDateTime,
      deltaMinutes: wallMinuteNumber(other.displayedDateTime) - wallMinuteNumber(event.displayedDateTime),
      referenceSourceIds: Object.freeze([...event.sourceIds]),
      comparedSourceIds: Object.freeze([...other.sourceIds]),
    });
  });
  if (byKey.size !== report.length) throw new RangeError("Solar-term edition key mismatch.");
  return Object.freeze(report);
}
