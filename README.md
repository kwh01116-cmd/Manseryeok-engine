# Manseryeok-engine

Korea-first, evidence-driven 만세력·명리학 engine.

The project separates reproducible calendar/civil-time facts from classical textual rules, later commentary, Korean practice, and modern implementation policy. The goal is not to hide school disagreements behind a single score, but to make every important result reproducible from explicit rules, sources, policies, and tests.

## Current phase

Foundation / pre-alpha. The first implementation slice contains only deterministic primitives that do not require a disputed school policy: heavenly stems, earthly branches, five-element/yin-yang classifications, the sexagenary cycle, and stem-to-stem ten-god relations.

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

Then open http://127.0.0.1:4173/ . Time policies must be explicitly selected; the supported term coverage is currently 2026–2027. This local proof of concept is not publicly deployed, certified against the official KASA annex, or suitable for collecting real users' personal data. See `docs/research/V0_READONLY_WEB.md`. Do not merge until canonical checks pass.
