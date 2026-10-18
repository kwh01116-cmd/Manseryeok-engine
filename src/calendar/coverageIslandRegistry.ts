/**
 * Pure routing for independently declared full-calendar-year coverage islands.
 * This selects a *declared interval* only. It does not validate astronomical
 * evidence, lunar correspondence, licensing or the underlying chart engine.
 */
export type CalendarCoverageUse = "RESEARCH" | "CONSUMER";
export type CalendarCoverageStatus = "RESEARCH_ONLY" | "CONSUMER_APPROVED";

export interface CalendarCoverageIsland<Payload> {
  readonly id: string;
  readonly supportedFromInclusive: string;
  readonly supportedUntilExclusive: string;
  readonly status: CalendarCoverageStatus;
  readonly payload: Payload;
}

export interface CalendarCoverageIslandRegistry<Payload> {
  /** Immutable metadata snapshots; the caller owns each payload and its invariants. */
  readonly islands: readonly CalendarCoverageIsland<Payload>[];
  /** Requires an explicit lane. Research-only data can never serve a consumer lookup. */
  select(displayedKstMinute: string, use: CalendarCoverageUse): CalendarCoverageIsland<Payload> | null;
}

const CIVIL_MINUTE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function validGregorianMinute(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = CIVIL_MINUTE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (year < 1583 || year > 9999 || month < 1 || month > 12 || hour > 23 || minute > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Preserve noncontiguous research/product coverage (e.g. 2000 and 2026–27)
 * without claiming the intervening years. Overlapping windows are rejected,
 * even when they have different use lanes, because selecting two sources for
 * the same instant would make provenance ambiguous.
 *
 * A caller MUST still invoke the full 24-term coverage validator and all
 * calendar provenance/licensing gates before trusting the selected payload.
 * There are no default use lanes and no source-authority implications.
 */
export function createCalendarCoverageIslandRegistry<Payload>(
  candidates: readonly CalendarCoverageIsland<Payload>[],
): CalendarCoverageIslandRegistry<Payload> {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new RangeError("Coverage islands must be a nonempty array.");
  }
  const ids = new Set<string>();
  const islands = candidates.map(candidate => {
    if (!candidate || typeof candidate.id !== "string" || candidate.id.trim() === "" || ids.has(candidate.id)) {
      throw new RangeError("Coverage island IDs must be unique and nonblank.");
    }
    ids.add(candidate.id);
    const from = candidate.supportedFromInclusive;
    const until = candidate.supportedUntilExclusive;
    if (!validGregorianMinute(from) || !validGregorianMinute(until) ||
        !/^\d{4}-01-01T00:00$/.test(from) || !/^\d{4}-01-01T00:00$/.test(until) ||
        from >= until) {
      throw new RangeError("Coverage islands must declare valid full-year, half-open bounds.");
    }
    if (candidate.status !== "RESEARCH_ONLY" && candidate.status !== "CONSUMER_APPROVED") {
      throw new RangeError("Explicit coverage island release status is required.");
    }
    if (candidate.payload === null || candidate.payload === undefined) {
      throw new RangeError("Coverage islands require a supplied payload.");
    }
    return Object.freeze({ id: candidate.id, supportedFromInclusive: from,
      supportedUntilExclusive: until, status: candidate.status, payload: candidate.payload });
  }).sort((a, b) => a.supportedFromInclusive.localeCompare(b.supportedFromInclusive));
  for (let i = 1; i < islands.length; i++) {
    if (islands[i - 1]!.supportedUntilExclusive > islands[i]!.supportedFromInclusive) {
      throw new RangeError("Coverage islands must not overlap.");
    }
  }
  const frozen = Object.freeze(islands);
  return Object.freeze({
    islands: frozen,
    select(displayedKstMinute: string, use: CalendarCoverageUse): CalendarCoverageIsland<Payload> | null {
      if (!validGregorianMinute(displayedKstMinute)) throw new RangeError("Expected a valid KST Gregorian minute.");
      if (use !== "RESEARCH" && use !== "CONSUMER") {
        throw new RangeError("An explicit research or consumer use lane is required.");
      }
      const candidate = frozen.find(profile =>
        displayedKstMinute >= profile.supportedFromInclusive &&
        displayedKstMinute < profile.supportedUntilExclusive);
      if (!candidate || (use === "CONSUMER" && candidate.status !== "CONSUMER_APPROVED")) return null;
      return candidate;
    },
  });
}
