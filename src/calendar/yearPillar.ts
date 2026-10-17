import type { GanZhi } from "../domain/sexagenary.js";
import { ganZhiAt } from "../domain/sexagenary.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

export type BoundaryConfidence = "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";

export interface YearPillarResolution {
  readonly pillarBeforeBoundary: GanZhi;
  readonly pillarAfterBoundary: GanZhi;
  readonly selected?: GanZhi;
  readonly confidence: BoundaryConfidence;
  readonly lichun: SolarTermEvent;
}

export function sexagenaryYearForCivilYear(year: number): GanZhi {
  if (!Number.isInteger(year)) throw new TypeError("civil year must be an integer");
  return ganZhiAt(year - 1984);
}

export function resolveYearPillarAtLichun(
  events: readonly SolarTermEvent[],
  displayedDateTime: string,
): YearPillarResolution {
  if (!isGregorianMinute(displayedDateTime)) {
    throw new Error(`invalid Gregorian minute: ${displayedDateTime}`);
  }
  validateKstMinuteSolarTermTimeline(events);
  const civilYear = Number(displayedDateTime.slice(0, 4));
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
