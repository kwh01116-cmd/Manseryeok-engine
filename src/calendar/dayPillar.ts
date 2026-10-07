import { ganZhiAt, type GanZhi } from "../domain/sexagenary.js";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ANCHOR_DATE = "2000-01-07";
const ANCHOR_EPOCH_DAY = Math.floor(Date.UTC(2000, 0, 7) / 86_400_000);

function gregorianEpochDay(date: string): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new TypeError("Date must be YYYY-MM-DD.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1583 || year > 9999) throw new RangeError("Date must use the proleptic Gregorian calendar from 1583 through 9999.");
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new RangeError("Date must be a valid Gregorian date.");
  }
  return Math.floor(parsed.getTime() / 86_400_000);
}

export function dayPillarForGregorianDate(date: string): GanZhi {
  return ganZhiAt(gregorianEpochDay(date) - ANCHOR_EPOCH_DAY);
}

export const DAY_PILLAR_ANCHOR = Object.freeze({ date: ANCHOR_DATE, pillar: ganZhiAt(0) });
