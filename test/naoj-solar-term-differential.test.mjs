import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";

// Independently transcribed NAOJ 2026/2027 Reki Yoko published-minute tables.
// JST and modern KST are both UTC+09:00. This does not validate seconds.
const TERM_ORDER = "XIAOHAN DAHAN LICHUN YUSHUI JINGZHE CHUNFEN QINGMING GUYU LIXIA XIAOMAN MANGZHONG XIAZHI XIAOSHU DASHU LIQIU CHUSHU BAILU QIUFEN HANLU SHUANGJIANG LIDONG XIAOXUE DAXUE DONGZHI".split(" ");
const NAOJ_MINUTES = {
  2026: "01-05T17:23 01-20T10:45 02-04T05:02 02-19T00:52 03-05T22:59 03-20T23:46 04-05T03:40 04-20T10:39 05-05T20:49 05-21T09:37 06-06T00:48 06-21T17:25 07-07T10:57 07-23T04:13 08-07T20:43 08-23T11:19 09-07T23:41 09-23T09:05 10-08T15:29 10-23T18:38 11-07T18:52 11-22T16:23 12-07T11:53 12-22T05:50".split(" "),
  2027: "01-05T23:10 01-20T16:30 02-04T10:46 02-19T06:33 03-06T04:40 03-21T05:25 04-05T09:17 04-20T16:18 05-06T02:25 05-21T15:18 06-06T06:26 06-21T23:11 07-07T16:37 07-23T10:05 08-08T02:27 08-23T17:14 09-08T05:28 09-23T15:02 10-08T21:17 10-24T00:33 11-08T00:39 11-22T22:16 12-07T17:38 12-22T11:42".split(" "),
};

test("2026/2027 Korean published-minute fixtures agree with NAOJ for all 48 terms", () => {
  assert.equal(TERM_ORDER.length, 24);
  for (const [year, minutes] of Object.entries(NAOJ_MINUTES)) {
    assert.equal(minutes.length, 24, year);
    const annual = KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(x => x.displayedDateTime.startsWith(year + "-"));
    assert.equal(annual.length, 24, year);
    for (let i = 0; i < 24; i++) {
      const matches = annual.filter(x => x.term === TERM_ORDER[i]);
      assert.equal(matches.length, 1, year + " " + TERM_ORDER[i]);
      assert.equal(matches[0].displayedDateTime, year + "-" + minutes[i]);
      assert.equal(matches[0].timeBasis, "KST");
      assert.equal(matches[0].sourcePrecision, "MINUTE");
    }
  }
});
