# M1 deterministic golden witnesses and failure matrix (planning-only)

**This is a spec for later tests**, not evidence that any listed *new* tests were run. Baseline existing verified: 227 Node tests and real Chromium at code commit `891967bfd2883e4aed8296a27b96d9be8a94ee11`. No GitHub Actions invoked by this memo.

## Source-indexed witnesses already available

| Reference | Published KST minute / date | Source class | Why it matters |
| --- | --- | --- | --- |
| 2026 Lichun | `2026-02-04T05:02` | KASI *computational* calendar page | Year and month boundary align; retain two candidates at exact published minute |
| 2027 Lichun | `2027-02-04T10:46` | KASI computational page | Prior and next year/month **correlated**, not four combinations |
| 2027 Jingzhe | `2027-03-06T04:40` | KASI computational page | Month transition alone; same year pillar |
| 2027 Xiaohan | `2027-01-05T23:10` | KASI computational page | January follows prior December Daxue guard |
| 2025 Daxue guard | `2025-12-07T06:05` | KASI computational page | Without this, early 2026 cannot get safely assigned to prior active 12-節 |
| Lunar 2027 new year | `2027-02-07` Gregorian | KASI calendar data page | Lunar year boundary **does not** replace Lichun year pillar |
| Historical year 2000 | 24 terms via NAOJ research and a separate MIT-based lunar dataset | **research only**, not Korean KASA source | Boundary regression and independent historical inputs without broad consumer authorization |

Published values are *minute-precision*, not proof of the exact second. The KASI computational page explicitly warns that it is not the official public announcement: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027 . 2025/2026 guard details in `SOURCE_REGISTRY.md`. The 2027 KASA official bulletin is a separate work with a displayed noncommercial license; see `CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md`.

## Planned test identifiers — do not mark PASS before execution

| ID | Test | Expected invariant |
| --- | --- | --- |
| `M1-JIE-01` | Before / at / after 2027 Lichun 10:46 | 1 / **2 correlated** / 1; years and months change together |
| `M1-JIE-02` | Before / at / after 2027 Jingzhe 04:40 | 1 / 2 / 1; year unchanged |
| `M1-JIE-03` | 2026 early January vs 2025 Daxue | correct previous-year Jie event identity and exact sourceIDs |
| `M1-JIE-04` | 2027 Xiaohan plus prior Jie identity | correct Korean KST minute order around December/January |
| `M1-JIE-05` | GREGORIAN vs equivalent KOREAN_LUNAR inputs | equal applied Jie evidence and pillar candidates, distinct conversion provenance |
| `M1-JIE-06` | At a non-Jie (e.g. Yushui) source minute | no false month boundary |
| `M1-JIE-07` | Duplicate, absent, unsorted, UTC-labeled or mixed-source event fixtures | fail closed without inventing boundary |
| `M1-JIE-08` | Source precision `SECOND` in a `MINUTE` manifest | reject rather than pretend minute accuracy |
| `M1-JIE-09` | 2026 and 2027 end-of-year full supported intervals | no leaking coverage into 2028 |
| `M1-JIE-10` | Birth at 23:00 / 00:00 under both explicit day policies | month Jie identity independent of Zi rollover; day/hour differences by policy |
| `M1-JIE-11` | 2000 leap day research-only + 1999 Daxue guard | independent source IDs and no public coverage promotion |
| `M1-JIE-12` | DTO contains only global `solarTermSourceIds` | API must not label entire corpus set as birth's applied event |
| `M1-JIE-13` | Nonempty sources on all actual event witnesses | source metadata preserved *per event*, immutable and stable |
| `M1-JIE-14` | Forged M1 chart candidate indices/times | fail closed; no trace pointing to wrong candidate |
| `M1-JIE-15` | Full 2026/2027 consumer minutes around all 12 Jie each | exactly expected before/at/after traces without test-generated fabricated timestamps |

## Oracle independence rules

- Never generate expected sourceID or term identity with the **same resolver** being tested. Pin selected event witnesses in an independently reviewed source fixture with edition and attribution.
- Do **not** paste a complete copyright-restricted almanac table into the repository to create a golden corpus.
- At the exact published minute, show both possibilities unless exact seconds are independently available *and policy-qualified*. Rounding is not certainty.
- Preserve distinct axes: official authority, computational source, minute vs second precision, Myeongli policy, tested software invariants, commercial rights.
- Tests verifying self-consistency of Gregorian↔lunar normalization do not by themselves prove institutional astronomical correctness.

## CI-unavailable procedure

Can author draft tests off-branch or in a non-CI branch for review, but no `src/**`, `test/**`, `web/**`, `scripts/**`, lockfile or workflow path should be **pushed** to `agent/foundation-20261006` while Actions quota is unavailable: the active workflow triggers on those paths. A docs-only commit is safe under the reviewed path filters. When execution returns, run `npm ci && npm run check` and the browser smoke in an authorized exact-SHA checkout, then record both results.
