import type { GanZhi } from "../domain/sexagenary.js";
import { ganZhiAt } from "../domain/sexagenary.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

export type BoundaryConfidence = "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";

export interface YearPillarResolution {
  readonly pillarBeforeBoundary: GanZhi;
  readonly pillarAfterBoundary: GanZhi;
  readonly selected?: GanZhi;
  readonly confidence: BoundaryConfidence;
  readonly lichun: SolarTermEvent;
}

/** Gregorian civil year -> sexagenary year, anchored on independently-known 1984 = Jia-Zi. */
export function sexagenaryYearForCivilYear(year: number): GanZhi {
  if (!Number.isInteger(year)) throw new TypeError("civil year must be an integer");
  return ganZhiAt(year - 1984);
}

/**
 * Resolve the year pillar against that civil year's published Lichun minute.
 * Equality is deliberately not guessed: a MINUTE publication does not reveal
 * the exact second of the astronomical boundary.
 */
export function resolveYearPillarAtLichun(
  events: readonly SolarTermEvent[],
  displayedDateTime: string,
): YearPillarResolution {
  validateKstMinuteSolarTermTimeline(events);
  const yearMatch = /^(\d{4})-/.exec(displayedDateTime);
  if (!yearMatch) throw new Error("displayedDateTime must start with a four-digit civil year");
  const civilYear = Number(yearMatch[1]);
  const lichun = events.find(
    (event) => event.term === "LICHUN" && event.displayedDateTime.startsWith(`${civilYear}-`),
  );
  if (!lichun) throw new Error(`missing Lichun fixture for civil year ${civilYear}`);

  const before = sexagenaryYearForCivilYear(civilYear - 1);
  const after = sexagenaryYearForCivilYear(civilYear);
  if (displayedDateTime === lichun.displayedDateTime) {
    return { pillarBeforeBoundary: before, pillarAfterBoundary: after, confidence: "PUBLISHED_MINUTE_AMBIGUOUS", lichun };
  }
  return {
    pillarBeforeBoundary: before,
    pillarAfterBoundary: after,
    selected: displayedDateTime < lichun.displayedDateTime ? before : after,
    confidence: "DEFINITE",
    lichun,
  };
}
