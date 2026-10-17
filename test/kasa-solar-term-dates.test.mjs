import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";

// Golden dates extracted from the two edition-specific Gazette PDFs, page 2.
// The official tables contain month/day only; they cannot certify term minutes.
const fixture = JSON.parse(readFileSync(new URL("./fixtures/kasa-solar-term-dates-2026-2027.json", import.meta.url), "utf8"));
const TERMS = "XIAOHAN DAHAN LICHUN YUSHUI JINGZHE CHUNFEN QINGMING GUYU LIXIA XIAOMAN MANGZHONG XIAZHI XIAOSHU DASHU LIQIU CHUSHU BAILU QIUFEN HANLU SHUANGJIANG LIDONG XIAOXUE DAXUE DONGZHI".split(" ");

test("KASA date evidence preserves DAY precision without promoting minute provenance", () => {
  assert.equal(fixture.sourcePrecision, "DAY");
  assert.equal(fixture.calendar, "GREGORIAN");
  assert.equal(fixture.jurisdiction, "KR");
  assert.deepEqual(fixture.editions.map(x => x.year), [2026, 2027]);
  for (const edition of fixture.editions) {
    assert.equal(edition.pdfPage, 2);
    assert.match(edition.originalPdfSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(edition.events.map(x => x.term), TERMS);
    for (const row of edition.events) {
      assert.deepEqual(Object.keys(row).sort(), ["displayedDate", "term"]);
      assert.match(row.displayedDate, new RegExp(`^${edition.year}-\\d{2}-\\d{2}$`));
    }
  }
  // Production minute records still identify their actual KASI transcription.
  // The 2025 DAXUE guard is outside the two official editions checked here.
  for (const event of KOREA_SOLAR_TERM_EVENTS_2026_2027) {
    assert.deepEqual(event.sourceIds, ["KR-KASI-CALENDAR-DATA"]);
    assert.equal(event.sourcePrecision, "MINUTE");
    assert.equal(event.timeBasis, "KST");
  }
});

for (const edition of fixture.editions) {
  test(`${edition.year} KASI fixture dates agree with all 24 official KASA Gazette dates`, () => {
    const annual = KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(x => x.displayedDateTime.startsWith(`${edition.year}-`));
    assert.equal(annual.length, 24);
    assert.equal(edition.events.length, 24);
    for (const expected of edition.events) {
      const matches = annual.filter(x => x.term === expected.term);
      assert.equal(matches.length, 1, expected.term);
      assert.equal(matches[0].displayedDateTime.slice(0, 10), expected.displayedDate, `${edition.year} ${expected.term}`);
    }
  });
}
