import type { SolarTermEvent } from "./solarTerms.js";

const MINUTE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isGregorianMinute(value: string): boolean {
  const match = MINUTE_PATTERN.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateKstMinuteSolarTermTimeline(events: readonly SolarTermEvent[]): void {
  let previous = "";
  const seenTermYears = new Set<string>();
  for (const event of events) {
    if (event.timeBasis !== "KST") throw new Error("solar-term timeline requires KST events");
    if (event.sourcePrecision !== "MINUTE") throw new Error("solar-term timeline requires MINUTE source precision");
    if (!isGregorianMinute(event.displayedDateTime)) throw new Error(`invalid Gregorian minute: ${event.displayedDateTime}`);
    if (previous && event.displayedDateTime <= previous) throw new Error("solar-term timeline must be strictly increasing without duplicates");
    const termYear = `${event.displayedDateTime.slice(0, 4)}:${event.term}`;
    if (seenTermYears.has(termYear)) throw new Error(`duplicate solar term within civil year: ${termYear}`);
    seenTermYears.add(termYear);
    previous = event.displayedDateTime;
  }
}

export interface AdjacentSolarTerms {
  readonly previous?: SolarTermEvent;
  readonly next?: SolarTermEvent;
}

export function adjacentSolarTerms(events: readonly SolarTermEvent[], displayedDateTime: string): AdjacentSolarTerms {
  if (!isGregorianMinute(displayedDateTime)) throw new Error(`invalid Gregorian minute: ${displayedDateTime}`);
  validateKstMinuteSolarTermTimeline(events);
  let previous: SolarTermEvent | undefined;
  for (const event of events) {
    if (event.displayedDateTime > displayedDateTime) return { previous, next: event };
    previous = event;
  }
  return { previous };
}
