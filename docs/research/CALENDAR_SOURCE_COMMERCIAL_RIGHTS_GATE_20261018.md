# Korean calendar source / commercial-use clearance gate — 2026-10-18

**Gate = OPEN / NO-GO for rights-based commercial certification.** This is operational research, not a legal opinion. It does NOT prohibit all use of mathematical/astronomical facts and does NOT declare the software itself illegal. It says current provenance and licensing evidence is insufficient to claim a commercially reusable Korean calendar corpus.

## Verified sources and their different legal objects

| Source surface | Verified statement | Authority | Commercial-use disposition |
| --- | --- | --- | --- |
| KASA 2027 *official* 월력요항 notice (2026-06-29, 공고 제2026-0078) | Notice has attached 2027 PDF/HWPX and its own webpage explicitly marks **공공누리 제2유형 (출처표시 + 상업적 이용금지)** | Highest **official authority** for 2027 Korean calendar publication | **RED** for copying/reformatting the protected notice/document into a commercial app without a separate lawful basis or permission |
| KOGL type definitions (public Korea government works) | Type 2 allows noncommercial use with attribution; no blanket commercial reuse | Explains license attached to publication | The displayed Type 2 notice is **not** an unconditional commercial license |
| KASI 2026/2027 *calendar data* page | It explicitly says **자료는 공식 발표 자료가 아닙니다** and refers to official 월력요항; 2027 V1.0a metadata generated 2026-06-30 12:33; minute-precision table | Computational reference, distinct surface and edition from the official KASA notice | **AMBER**: the non-official disclaimer does not grant reuse; obtain terms/permission or qualify a distinct approved source |
| KASI lunar–solar public API `한국천문연구원_음양력 정보` (data.go.kr/15012679) | Listing: **무료**, **이용허락범위 제한 없음**, automatic API access review; daily calendar/lunar date/day-cycle information, reference Julian day etc. | A **different API dataset**, not the 24-term 2027 official notice | **AMBER → candidate GREEN** only for **API-specified fields/operations**, subject to current API terms, data-quality, allowed caching/republication and actual response parity verification |
| KASI historical 2000 archived notice | Earlier project handoff separately records historically restrictive usage notice | Archival research evidence only | **RESEARCH ONLY**. No inferred permission to republish an entire historical table |
| Independent astronomy computation / MIT software | A code license may permit use of *implementation*, but does not automatically license a third-party underlying dataset or establish Korean official status | Secondary cross-check / candidate clean-room path | **AMBER** pending code/data provenance, output-rights and numerical Korean KST accuracy review |

Sources consulted (retrieved/checked 2026-10-18):
- KASA official 2027 notice: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03
- KOGL categories: https://www.kogl.or.kr/use/OpenBestCaseView.do
- KASI 2027 data and its official-status warning: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
- KASI public API listing: https://www.data.go.kr/data/15012679/openapi.do
- KASI historical archive: https://www.kasi.re.kr/publication/post/newsMaterial/2008

## Essential distinctions / prevent over-claims

1. **Calendar fact** (e.g. a date or event timing) vs **published work** (text, tables, format, downloadable PDF): not the same thing. KOGL Type 2 attaches to the posted official work; do NOT jump from that fact to either "the sun's longitude is copyrighted" or "every extraction of the whole table is safe".
2. **Official status** is independent of **reuse license**. A scientifically/officially authoritative artifact may still be marked noncommercial. An unrestricted-use API is not automatically the official 2027 public notice.
3. **KASI data page** is computational evidence, **not** an official KASA bulletin or implicit commercial relicense. The currently checked-in KASI event table remains source-identified; do not falsely label it directly copied from KASA.
4. An API's "unrestricted use" listing needs record of precisely which fields were served, service version, terms, attribution, caching and whether the particular output may be stored/transformed at scale.
5. Open-source library license **does not certify** calendar accuracy, institutional endorsement, original data authorship or practical legal clearance.
6. No tool in this review used any API service key; no 2026 KASA document rights classification is asserted unless an exact 2026 document link and license has been independently checked.

## Release decision table

- **Local research, clearly source-labeled fixture and deterministic testing**: proceed under the current research posture without expanding published dataset contents. Reassess rights if distributing research fixtures or code to third parties.
- **Closed internal demo**: may be considered only after identifying real-data minimization, access controls, handling of source text, and reuse assumptions. Not automatically exempt from licenses.
- **Public free beta**: block until each embedded calendar source's rights, accuracy, publication attribution, user input privacy and correctness gates are independently cleared. "Free" does not necessarily mean noncommercial in every circumstance.
- **Paid/commercial release**: **NO-GO** while KASA 2027 official bulletin or a derived protected corpus is the assumed redistribution source without written permission/other lawful basis, or an independently licensed/calculated alternative that has been fully audited.

## Concrete external dependency-resolution path

A. Ask the relevant KASA/KASI content provider, **with the exact source URLs, source edition, fields and product use case**, whether a paid saju app may (i) compute using individual minute facts, (ii) cache transformed full tables, (iii) republish a selected event name/time and its source ID, (iv) redistribute normalization fixtures in an open-source Git repository. Preserve written response date/contact/scope.
B. Apply for the **separate public KASI lunar–solar API**, document current listing and resulting permitted fields; compare 2026/27+ historical leap-month/day-cycle witnesses without assuming it covers **minute-level solar terms**.
C. Investigate an independently implemented astronomical term calculation with separately licensed ephemeris/algorithm. Audit KST conversion, historical timezone/DST, nearest-minute rounding, exact-second uncertainty, yearly 24× completeness and 2025 Daxue guard; compare outputs to official Korean published values where lawfully possible without redistributing protected content.
D. Prepare a clean vendor/source manifest: issuer, surface URL, edition, fetch date, original license, field scope, exact processed output, transformations, permitted storage, verification level, release approval owner.
E. Until A–D are resolved, `licenseClearance: UNVERIFIED`; UI wording must never claim "KASA certified", "officially licensed" or "commercially cleared". Keep 2000 historical corpus research-only.

## Exit criteria (all mandatory)

Written or independently well-supported commercial-use basis per **field and data source**; independent numerical source parity; audit-able complete provenance; approved public privacy/security treatment; no restrictive source content accidentally committed as a full reproduced table; lawyer/provider review where uncertainty remains. Mark **GO** only with reviewed date, authorizing owner and evidence link. This memo cannot itself mark the gate green.
