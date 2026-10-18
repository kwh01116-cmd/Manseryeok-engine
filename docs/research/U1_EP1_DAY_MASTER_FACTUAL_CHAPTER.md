# U1 EP1 — day-master factual chapter (one computed M1 result, one U0 projection)

Date: 2026-10-18. Initial status: **authored, not yet CI verified**; update only after exact-code run passes.

## Why this slice

U1 EP0 already renders year/month/day/hour pillars with an accessible provenance disclosure. EP1 adds one small, explicitly non-predictive teaching chapter inside each displayed candidate:

- `01 · 나의 일간`: the day pillar's stem, its **five-element label** (목/화/토/금/수) and **yin/yang label** as defined by the deterministic `src/domain/stems.ts` primitive.
- Source reference `preview.candidates[i].day.stem`, from the **already source-validated** M1 real-engine response.
- Persistent Korean disclaimer that this is a traditional classification, **not** scientifically validated personality or destiny.
- For published-minute two-candidate Lichun, two independent candidate-specific day-master chapters are drawn (not a synthesized single chart).

## Single computation and additive private HTTP contract

`scripts/chart-preview-web.mjs` performs exactly the previous **one** M1 calendar calculation and, **only for `status:OK`**, adds `story:projectKoreanV0Story(output)` from the existing, tested `src/story/v0StoryProjection.ts`. The M1 `preview` schema and published-minute candidate set stay unchanged; invalid/out-of-coverage responses keep the original status/shape.

`web/index.html` must use the returned `story` DAY_STEM_CLASSIFICATION beat, and validate its `sourcePreviewVersion`, `factRef`, candidateIndex, stem and enum labels against the original M1 chart. It **must not** reimplement the 五行 lookup inside the browser, silently pick a boundary candidate or attach personality predictions. The tiny mapping from `WOOD`→`목(木)` etc is language localization of **already computed** element and polarity strings, not new metaphysical logic.

Existing input-change invalidation and stale-HTTP-response guards continue to remove prior charts/chapters. No user birth input is persisted; server remains loopback `127.0.0.1`; no user account, external HTTP, cookies, analytics or production app is introduced.

## Release and verification

- HTTP regression `test/chart-preview-web.test.mjs` verifies that both Gregorian and matching Korean lunar inputs return equivalent single-candidate `story` factual beats; 2027 Lichun returns two candidate-specific factRefs; unsupported-date errors do not fabricate `story`.
- Dependency-free real Chromium regression `scripts/browser-smoke.mjs` verifies visible EP1 chapter/glyph source reference, date-equivalent lunar parity, two Lichun chapter refs, stale-input clearing, 360/390px widths and existing keyboard evidence drawer.
- Product claims: *traditional stem/element polarity classification*, **not** psychometric evidence, health, family, wealth or future fate inference.
- EP2 is month branch and **Jie/season reference only** once independently qualified, not a universal day-master strength rule. Exposing full M2 ChartFacts v3 requires separate Korean explanation/source review.
