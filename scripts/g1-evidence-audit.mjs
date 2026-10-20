import { fixtureSha256, solarTermFixturePayload, lunarFixturePayload } from './calendar-fixture-digest.mjs';

/**
 * G1-P1: read-only audit of a repository-pinned Korean calendar corpus.
 * No source-page metadata, digest, or proof claim is accepted from an API request.
 * A PASS here is NOT independent transcription verification or release clearance.
 */
const SOURCE = 'KR-KASI-CALENDAR-DATA';
const SOLAR_HASH = '15363d490a4d86cf37dd826fcff7aa5425d630276c4d9a79a23a405a94b066c4';
const LUNAR_HASH = 'd0dc8222af3afa19ee354e9e59b2251b40e0a1083fd9c8377cc0d5b8ce7c80ef';
const EDITIONS = Object.freeze({
  2025: 'V1.0a/2024-05-07T14:23',
  2026: 'V1.0a/2024-07-25T16:57',
  2027: 'V1.0a/2026-06-30T12:33',
});
const PAGE_URL = year => 'https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=' + year;
const fail = message => { throw new RangeError('G1 evidence audit: ' + message); };
const exactKeys = (object, names, context) => {
  if (!object || typeof object !== 'object' || Array.isArray(object) ||
      Object.getPrototypeOf(object) !== Object.prototype ||
      Object.keys(object).sort().join('|') !== [...names].sort().join('|')) fail(context + ': invalid fields');
};
const unique = (entries, label) => {
  const keys = new Set(entries.map(x => JSON.stringify(x)));
  if (keys.size !== entries.length) fail(label + ': duplicate row');
};
const checkRows = (actual, claims, expectedCount, label, makeKey, makeClaim) => {
  if (!Array.isArray(actual) || !Array.isArray(claims) || actual.length !== expectedCount || claims.length !== expectedCount)
    fail(label + ': unexpected count');
  const known = actual.map(makeKey);
  const claimed = claims.map(makeClaim);
  unique(known, label); unique(claimed, label);
  if (known.map(x=>JSON.stringify(x)).sort().join('\n') !== claimed.map(x=>JSON.stringify(x)).sort().join('\n'))
    fail(label + ': row identities do not match corpus');
};

export function auditG1EditionEvidence({solarEvents, lunarCorpus, manifest}) {
  exactKeys(manifest, ['schemaVersion','profileId','sourceId','solarSha256','lunarSha256','rights','pageCandidates','solarRows','lunarRows'], 'manifest');
  if (manifest.schemaVersion !== 'g1-repository-evidence-v1' ||
      manifest.profileId !== 'KOREAN-LAB-KASI-2026-2027-V1' ||
      manifest.sourceId !== SOURCE || manifest.rights !== 'UNVERIFIED' ||
      manifest.solarSha256 !== SOLAR_HASH || manifest.lunarSha256 !== LUNAR_HASH) fail('manifest identity/rights');
  if (!Array.isArray(manifest.pageCandidates) || manifest.pageCandidates.length !== 3) fail('page candidates');
  const years = new Set();
  for (const page of manifest.pageCandidates) {
    exactKeys(page,['year','pageUrl','candidateEdition','pageEvidence','originalDocumentSha256','rights'],'page');
    if (![2025,2026,2027].includes(page.year) || years.has(page.year) ||
        page.pageUrl !== PAGE_URL(page.year) ||
        page.candidateEdition !== EDITIONS[page.year] ||
        page.pageEvidence !== 'PAGE_EDITION_OBSERVED' ||
        page.originalDocumentSha256 !== null || page.rights !== 'UNVERIFIED') fail('invalid page/edition evidence');
    years.add(page.year);
  }
  if (solarTermFixturePayload(solarEvents).schemaVersion !== 'm1-kasi-solar-term-corpus-v1' ||
      fixtureSha256(solarTermFixturePayload(solarEvents)) !== SOLAR_HASH) fail('solar corpus digest');
  if (lunarCorpus.corpusId !== 'kasi-lunisolar-2025-2027-v1' ||
      lunarCorpus.schemaVersion !== 'm1-korean-lunisolar-months-v1' ||
      lunarCorpus.sourceId !== SOURCE ||
      lunarCorpus.authorityLevel !== 'KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA' ||
      lunarCorpus.supportedGregorianFromInclusive !== '2025-01-29' ||
      lunarCorpus.supportedGregorianUntilExclusive !== '2028-01-27' ||
      fixtureSha256(lunarFixturePayload(lunarCorpus)) !== LUNAR_HASH) fail('lunar corpus identity/digest');
  for (const year of [2025,2026,2027]) {
    if (lunarCorpus.sourceEditions[year] !== EDITIONS[year]) fail('lunar page edition');
  }
  if (Object.keys(lunarCorpus.sourceEditions).sort().join('|') !== '2025|2026|2027') fail('lunar edition years');
  if (solarEvents.some(x => x.timeBasis !== 'KST' || x.sourcePrecision !== 'MINUTE' ||
      x.sourceIds.length !== 1 || x.sourceIds[0] !== SOURCE)) fail('event source identity');
  for (const row of manifest.solarRows) {
    if (!Array.isArray(row) || row.length !== 4 || ![2025,2026,2027].includes(row[2]) ||
        row[2] !== Number(row[1].slice(0,4)) || row[3] !== 'UNVERIFIED_ORIGINAL_ROW') fail('solar row claim');
  }
  for (const row of manifest.lunarRows) {
    if (!Array.isArray(row) || row.length !== 6 || ![2025,2026,2027].includes(row[4]) ||
        row[4] !== row[0] || row[5] !== 'UNVERIFIED_ORIGINAL_ROW') fail('lunar row claim');
  }
  checkRows(solarEvents,manifest.solarRows,49,'solar',
    e => [e.term,e.displayedDateTime],r=>r.slice(0,2));
  checkRows(lunarCorpus.months,manifest.lunarRows,37,'lunar',
    m=>[m.lunarYear,m.lunarMonth,m.isLeapMonth,m.gregorianStart],r=>r.slice(0,4));
  if (manifest.solarRows.filter(r=>r[2]===2025).length !== 1 ||
      manifest.solarRows.filter(r=>r[2]===2026).length !== 24 ||
      manifest.solarRows.filter(r=>r[2]===2027).length !== 24 ||
      !manifest.solarRows.some(r=>r[0]==='DAXUE'&&r[1]==='2025-12-07T06:05') ||
      !manifest.solarRows.some(r=>r[0]==='DAXUE'&&r[1]==='2027-12-07T17:38')) fail('solar boundary');
  if (!manifest.lunarRows.some(r=>r[0]===2025&&r[1]===6&&r[2]===true&&r[3]==='2025-07-25') ||
      !manifest.lunarRows.some(r=>r[0]===2025&&r[1]===12&&r[3]==='2026-01-19'&&r[4]===2025) ||
      !manifest.lunarRows.some(r=>r[0]===2026&&r[1]===12&&r[3]==='2027-01-08'&&r[4]===2026)) fail('lunar boundary');
  return Object.freeze({
    status:'REPOSITORY_CONSISTENT_ORIGINAL_ROWS_UNVERIFIED',
    profileId: manifest.profileId,
    solarRows:49,
    lunarRows:37,
    pageCandidatesObserved:3,
    originalRowsVerified:0,
    rights:'UNVERIFIED',
  });
}
