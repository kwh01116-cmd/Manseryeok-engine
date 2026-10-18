# Manseryeok-engine

Korea-first, evidence-driven 만세력·명리학 engine.

The project separates reproducible calendar/civil-time facts from classical textual rules, later commentary, Korean practice, and modern implementation policy. The goal is not to hide school disagreements behind a single score, but to make every important result reproducible from explicit rules, sources, policies, and tests.

## Current phase

Foundation / pre-alpha. The M1 **2026–2027 Korean Four-Pillars** computation is implemented with finite KASI reference fixtures, explicit rollover/hour-stem policies, lunar/Gregorian conversion, source-labeled uncertainty, and a private loopback V0 preview. Research-only 2000 historical sources are intentionally not served to consumers. The existing U0 deterministic presentation and **U1 EP0–EP2** calculation-evidence/day-master/month-branch factual chapters are functional in local Chromium, not predictive interpretation. M2 now includes a **partial**, source/policy-gated ChartFacts v1, hidden-stem/branch ten-god lookups and explicit 12-growth table. M2 raw source/policy-gated 合·冲·刑·害·破 relation facts now extend a non-breaking immutable ChartFacts v2 (without changing M1 or existing HTTP response). M2 now also includes an **opt-in ChartFacts v3** with source-gated 三合/三會 *member presence* (not claimed 化局); full M2 remains open for the four-member classical 土局, competing source/school variants and critical source review. No strength/fortune interpretation is computed.

Astronomical boundaries, historical Korean civil time, Zi-hour rollover, hidden stems, strength, patterns, useful gods, climate adjustment, follow/transformation structures, and luck cycles are introduced only after their provenance and policy boundaries are explicit.

## Development rule

Correctness and reproducibility outrank feature count. Executable changes must be small, tested, and reversible. See `AGENTS.md` and `docs/research/ENGINE_GUARDRAILS.md`.

## V0 local web preview (draft)

A read-only local UI is available at `web/index.html` backed by the existing Korean Four-Pillars engine. After the exact branch checkout, run:

```bash
npm ci
npm run check
node scripts/chart-preview-web.mjs
```

Then open http://127.0.0.1:4173/ . Time policies must be explicitly selected; the supported term coverage is currently 2026–2027. Canonical GitHub Actions `npm run check` (227/227) and a real Chromium local-HTTP EP0+EP1+EP2 browser smoke have passed on the Draft PR branch; this does **not** certify official KASA precision, calendar publication reuse rights, visual QA or suitability for collecting real users' personal data. The server has not been publicly deployed. See `docs/research/V0_READONLY_WEB.md`. Keep the large Draft PR unmerged until scope, rights and release gates are reviewed.
