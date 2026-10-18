import { createHash } from 'node:crypto';

/**
 * Stable ASCII/UTF-8 JSON tuples. The explicit tuple order is part of v1;
 * a schema change must be reviewed and versioned rather than re-pinned silently.
 * This is a repository data-integrity fingerprint, NOT official KASA verification.
 */
export function solarTermFixturePayload(events) {
  return {
    schemaVersion: 'm1-kasi-solar-term-corpus-v1',
    events: events.map(({ term, displayedDateTime, timeBasis, sourcePrecision, sourceIds }) => [
      term, displayedDateTime, timeBasis, sourcePrecision, [...sourceIds],
    ]),
  };
}

export function lunarFixturePayload(corpus) {
  return {
    schemaVersion: corpus.schemaVersion,
    corpusId: corpus.corpusId,
    sourceId: corpus.sourceId,
    authorityLevel: corpus.authorityLevel,
    supportedGregorianFromInclusive: corpus.supportedGregorianFromInclusive,
    supportedGregorianUntilExclusive: corpus.supportedGregorianUntilExclusive,
    sourceEditions: Object.entries(corpus.sourceEditions)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([year, edition]) => [Number(year), edition]),
    months: corpus.months.map(({ lunarYear, lunarMonth, isLeapMonth, gregorianStart, days }) => [
      lunarYear, lunarMonth, isLeapMonth, gregorianStart, days,
    ]),
  };
}

export function fixtureSha256(payload) {
  return createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}
