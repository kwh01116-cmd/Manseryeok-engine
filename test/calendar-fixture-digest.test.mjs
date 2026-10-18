import test from 'node:test';
import assert from 'node:assert/strict';
import { solarTermFixturePayload, lunarFixturePayload, fixtureSha256 } from '../scripts/calendar-fixture-digest.mjs';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as solarEvents } from '../dist/calendar/koreaSolarTermFixtures.js';
import { KASI_KOREAN_LUNISOLAR_2025_2027 as lunarCorpus } from '../dist/calendar/koreanLunisolarFixtures.js';

// One-time pins for the reviewed repository transcriptions, not external golden data.
// Do not update these after a fixture edit without checking KASI/KASA provenance.
const SOLAR_SHA256 = '15363d490a4d86cf37dd826fcff7aa5425d630276c4d9a79a23a405a94b066c4';
const LUNAR_SHA256 = 'd0dc8222af3afa19ee354e9e59b2251b40e0a1083fd9c8377cc0d5b8ce7c80ef';

test('KASI 2025 Daxue guard + 2026/2027 24-term fixture is pinned by SHA-256', () => {
  assert.equal(solarEvents.length, 49);
  assert.equal(fixtureSha256(solarTermFixturePayload(solarEvents)), SOLAR_SHA256);
});

test('KASI 2025-2027 37-month lunar fixture and source editions are pinned by SHA-256', () => {
  assert.equal(lunarCorpus.months.length, 37);
  assert.equal(fixtureSha256(lunarFixturePayload(lunarCorpus)), LUNAR_SHA256);
});

test('a minute, source ID, month size, or edition mutation breaks the pin', () => {
  const solarCopy = solarEvents.map(e => ({ ...e, sourceIds: [...e.sourceIds] }));
  solarCopy[2].displayedDateTime = '2026-01-20T10:46';
  assert.notEqual(fixtureSha256(solarTermFixturePayload(solarCopy)), SOLAR_SHA256);
  solarCopy[2].displayedDateTime = solarEvents[2].displayedDateTime;
  solarCopy[2].sourceIds[0] = 'UNVERIFIED-REPLACEMENT';
  assert.notEqual(fixtureSha256(solarTermFixturePayload(solarCopy)), SOLAR_SHA256);

  const lunarCopy = { ...lunarCorpus, months: lunarCorpus.months.map(m => ({ ...m })) };
  lunarCopy.months[0].days = 29;
  assert.notEqual(fixtureSha256(lunarFixturePayload(lunarCopy)), LUNAR_SHA256);
  lunarCopy.months[0].days = lunarCorpus.months[0].days;
  lunarCopy.sourceEditions = { ...lunarCorpus.sourceEditions, 2027: 'UNVERIFIED-REPLACEMENT' };
  assert.notEqual(fixtureSha256(lunarFixturePayload(lunarCopy)), LUNAR_SHA256);
});
