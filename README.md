# Manseryeok-engine

Korea-first, evidence-driven 만세력·명리학 engine.

The project separates reproducible calendar/civil-time facts from classical textual rules, later commentary, Korean practice, and modern implementation policy. The goal is not to hide school disagreements behind a single score, but to make every important result reproducible from explicit rules, sources, policies, and tests.

## Current phase

**Engine reliability first (2026-10-19).** M1 and M2 are **PARTIALLY_VERIFIED** overall: the default 2026–2027 Korean civil-minute Four-Pillars pipeline and named finite traditional-rule profiles have passing tests, while independent accuracy, editions/rights, broader years, historical-time integration and school disputes remain open. M2 includes immutable opt-in ChartFacts v1/v2/v3, hidden stems/ten gods/twelve stages, raw pairs and triad membership; no strength/fortune interpretation is computed. Test-only 2000 is not a supported default runtime year. See the [engine roadmap](docs/ROADMAP.md) and [M1–M8 evidence/G0 report](docs/engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md).

Existing EP0–EP4 remains **Manseryeok Lab**, an internal calculation/rule verification tool. Story App, webtoon, characters, EP5 UI and visual redesign are paused; future product design belongs to a separate Astra task. G0 now binds the Lab's single M1 calculation to a fixed fixture/manifest/edition context and an in-process execution receipt, with strict M2 entry points. Generic M2 functions retain structural checks and trusted-upstream assumptions; source IDs are not publication authentication or commercial permission.

Astronomical boundaries, historical Korean civil time, Zi-hour rollover, hidden stems, strength, patterns, useful gods, climate adjustment, follow/transformation structures, and luck cycles are introduced only after their provenance and policy boundaries are explicit.

## Development rule

Correctness and reproducibility outrank feature count. Executable changes must be small, tested, and reversible. See `AGENTS.md` and `docs/research/ENGINE_GUARDRAILS.md`.

## Manseryeok Lab — private local verification tool

A read-only local UI is available at `web/index.html` backed by the existing Korean Four-Pillars engine. After the exact branch checkout, run:

```bash
npm ci
npm run check
node scripts/chart-preview-web.mjs
```

Then open http://127.0.0.1:4173/ . Time policies must be explicitly selected; term coverage stays 2026–2027. On executable/test commit `0eb277645b7e87915c9dd6d68172a7d0516cce40`, Node 22.23.3 typecheck/build and **283/283 Node tests**, plus actual Chromium EP0–EP4 smoke, passed locally. No GitHub Actions were used. These results do **not** certify external calendar truth, source authenticity, reuse rights or public-service privacy/security. The server has not been publicly deployed; do not collect/store real users' birth records. Keep the large Draft PR unmerged until scope, rights and integration gates are reviewed.

## Historical review notes (superseded by the engine roadmap)

The following dated sections preserve earlier checkpoints; their test counts and Story/UI queues are historical, not the current execution cursor.

## 2026-10-18: documentation-only research package / paused Actions

The owner reports monthly GitHub Actions availability is exhausted; this package modifies **research/roadmap/operating documents only**, not the tested engine. See [research work package index](docs/RESEARCH_PACKAGE_INDEX_20261018.md) for (1) the M1 applied-Jie event evidence DTO, (2) Korean official-vs-computational calendar *reuse rights* gate, (3) M1 test-vector matrix, (4) M2 rule/school policy gaps and M3 interpretation blockers, (5) U1 EP3–EP5 factual storyboards, and (6) PR #1 142-commit/152-file scope and privacy review.

The **2027 KASA official publication page advertises KOGL Type 2 (attribution, noncommercial use)**, while the distinct KASI computational data page does not constitute an official notice; a separate public lunar API lists unrestricted-use permission for its own fields. No broad commercial-use clearance is claimed. No source was contacted, no API key was used, and no new code was runtime-tested. The last successfully validated executable SHA remains `891967bfd2883e4aed8296a27b96d9be8a94ee11` (227/227 plus browser).

## Further quota-paused engineering review (2026-10-18)

The latest documentation-only pass additionally produced a **static source audit** (9 prioritized potential release issues), verified the **field-level scope of KASI's free daily lunar XML API**, mapped the M1 applied Jie event into four exact source/DTO/UI implementation slices, and drafted U1 EP3 eight-glyph Korean copy with acceptance vectors. Index: `docs/RESEARCH_PACKAGE_INDEX_20261018.md`. No executable code or tests were modified; the previous 227/227 + Chromium success is the most recent runtime evidence. Do not deploy the existing localhost service publicly or imply that an API documented for lunar **day** data also licenses/provides minute-level solar terms.
