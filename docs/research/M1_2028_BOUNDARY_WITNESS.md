# M1 independent next-year lunisolar boundary witness (2026-10-09)

## Finding and source genealogy
- Current corpus: `src/calendar/koreanLunisolarFixtures.ts`, KASI 2027 calendar-data V1.0a (2026-06-30), lunar 2027 month 12 begins Gregorian **2027-12-28**, with **30** days.
- Independent adjacent-year witness: KASI **2028 calendar data**, V1.0a generated **2026-06-30 11:33** (KASI page's displayed edition); lunar **2028 month 1 day 1 = Gregorian 2028-01-27**. Source: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2028 (also https://astro.kasi.re.kr/life/post/calendardata).
- Therefore lunar 2027-12-30 = Gregorian **2028-01-26**, and the finite 2025–2027 corpus must end **exclusive 2028-01-27**. The 2028 day itself is out of the corpus; do not silently label it as a supported 2028 lunar date.
- Authority: KASI computational calendar reference, **not** direct official KASA Gazette annex verification. The KASI 2028 page expressly says 2-years-ahead data is not the officially announced monthly almanac.

## Rule classification
- Layer: published Korean lunisolar civil-date correspondence; not a Myeongli interpretation rule.
- Codeability: EXACT *relative to the cited KASI published date*; official KASA edition certification remains OPEN.
- Preconditions: full 2027 lunar year and explicit leap flag; boundary is Gregorian civil date in Korea.
- Exceptions: do not extrapolate 2028 lunar months from this witness. No implicit timezone conversion or birth-time policy.
- Policy needed: none for the civil-date mapping. Source hierarchy/dispute: KASA annex still unverified.

## Adversarial counterexample and regression
A malicious/accidental change to the terminal 2027 lunar month from 30 to 29 days **and** the declared coverage end from 2028-01-27 to 2028-01-26 remains internally contiguous and can pass the structural corpus validator. Its computed coverage would nevertheless contradict KASI 2028 lunar New Year. Test: `test/korean-lunisolar-next-year-boundary.test.mjs` pins both the correct terminal date and this fail-open structural counterexample. The test is an external golden assertion, not proof that the generic validator can independently detect such edits.

## Verification state
- Node 22.16.0 `node --check` on new test file: PASS in isolated local staging.
- Independent date arithmetic: 2027-12-28 + 30 days = 2028-01-27 (exclusive); last day = 2028-01-26.
- Exact repository checkout still unavailable from this runtime (github.com DNS/network). `npm ci && npm run check` **NOT RUN**; new test **NOT verified against compiled repository**. No merge.
