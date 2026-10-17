# Storytelling / interactive webtoon UX — track U

**Planning status 2026-10-10:** ADOPTED IN ROADMAP; **not an implemented webtoon, not a public release**. Canonical work order is `docs/ROADMAP.md` and `docs/EXECUTION_HANDOFF.md`. The user-supplied market/technology/legal report is a design hypothesis source, not independently source-verified proof, cost baseline or counsel opinion.

## Why this track exists

A Korea-first manseryeok should be understandable without losing reproducibility. Design for **scroll-based reveal + bounded information navigation + expandable calculation/rule evidence**, not endless branching or ungrounded AI predictions. The user may select chapter order, traditional/accessible terms or source detail; these do **not** alter the computed chart. Changing calculation policy must trigger an explicitly identified recomputation with old/new candidate comparison.

Keep four contracts distinct:
1. **Calendar / Four Pillars**: existing deterministic M1 `ChartFacts`, with coverage, source edition, version and applied time policies.
2. **Finding / rule**: M2+ facts or conditional interpretation with explicit `rule_id`, source genealogy, exception, policy and dispute. Classical textual fidelity does **not** establish scientific future-prediction accuracy.
3. **Story module**: traceable explanation and reusable scenes whose conditions reference facts/findings instead of recomputing them.
4. **Renderer / optional LLM**: webtoon, text, voice or character dialogue that may change style but not calculations, rules or supported claims.

## Stage gates / deliverables

**U0 — presentation data contract, parallel planning.** Examine the live `/api/preview` schema before specifying UI state handling. Propose versioned `ChartFacts`, `Finding`, `StoryModule`, `StoryBeat`, `AuditLink` as adapters rather than rewriting the current engine: `chart_version`, `source_edition`, `policy_ids`, `coverage_status`, `candidate_set`, source/rule linkage, locale key and safe fallback text. A `StoryBeat` contains `beat_id`, `line_key`, `visual_key`, `fact_or_finding_ref`, `fallback_text_key`, interaction and asset license reference. **Do not add executable mock types inconsistent with actual API.** Treat OK, malformed input, OUT_OF_COVERAGE, boundary candidate(s), disputed Zi policy, unknown time as explicit distinct states. If unknown-time calculations are not currently supported, document “unsupported”, never fabricate a pillar.

**U1 — first scroll comic via existing web prototype, once M1/V0 integration gate is green.** Current `web/index.html` + `scripts/chart-preview-web.mjs` already serve a local read-only Four Pillars experience using real engine results; they are not a deployed production system and presently support only 2026–2027 full-year solar-term coverage. Add in **small incremental commits**:
- EP0: four pillars with Hangul/Hanja and “왜 이렇게 계산됐나요?” drawer containing source, published-minute limits and selected policies.
- EP1: day stem glyph, yin/yang and five-element **labels**, with no asserted personality/health/marriage destiny.
- EP2: month branch and Jie/season factual context; when a Lichun minute produces alternatives, show both rather than silently picking one.
- EP3: deterministic five-element labels/visual relationship map. **Raw element counts are not strength, balance or useful-god findings.**
Include topic-order selection, text-only/reduced-motion mode and semantic keyboard controls. Do not add chat, signup, payment, animated 3D world, predictive claims or public birth-data collection.

**U2 — verified M2 story modules.** When *each* resolver and source/test table passes, attach hidden stems, branch ten gods, 12 growth stages and raw clash/combine/harm/break visuals. A raw relation cannot be described as a proven life event or a successful transformation. Hold back unverified modules; make source/rule tracing visible.

**U3 — qualified M3–M8 narratives.** Only after their dependency gates, add strength-evidence, pattern (格局), multiple useful-god/climate schools, follow/transform and luck overlays. Show “전통 규칙/학파마다 다름/해석” with provenance and disagreement, and provide side-by-side explanations when policy results differ. Do not collapse schools to a single speculative score.

**U4 — optional LLM/animation/commercial modules.** Research only after U1/U2 comprehension tests and rights/privacy gates. An LLM consumes allowlisted `Finding`/story references, not raw birth data by default; verify no invented pillars, rule IDs, citations or unsupported medical/investment/guaranteed-outcome claims. Character design, Rive/Lottie/Ink, React/Next.js, account/payment are optional technology/product decisions to justify later, not prerequisites. Free access to calculated facts; price only new explanatory/creative content after legal/consumer checks.

## Disclosure and UX language

Display the **origin**, not a fake confidence score:
- `계산 결과`: M1 calculation, only within supported edition/coverage and declared policies.
- `전통 규칙`: sourced classical/practice rule and its edition.
- `학파별 차이`: actual recorded disagreement or policy conditionality.
- `해석`: non-deterministic reading, not empirical prediction proof.
- `AI 설명`: optional generated prose about upstream findings.

KASI calendarData cross-check does not authorize an “officially KASA-certified” badge. Treat publication/source-use rights separately from astronomical facts.

## Mandatory adversarial tests / gates

| Vector | Expected UX behavior |
| --- | --- |
| Gregorian 2027-02-05 12:00 vs lunar 2026-12-29 with same explicit policy | Same returned chart and story triggers in actual HTTP test |
| Published-minute 2027 Lichun candidate case | Preserve **both** correlated candidates and policy/source disclosure |
| Different Zi/day/time basis policies | Explicitly explain policy and recomputation rather than override silently |
| Unknown birth time | Omit hour-specific chapter; do not invent hours; if unsupported, show limitation |
| Valid 2028 input, invalid 2027-02-30 and invalid lunar/leap input | Distinct OUT_OF_COVERAGE vs INVALID; no narrative from errors |
| M2 interpretation not yet verified; competing schools | Hide gated chapter or show uncertainty; never produce fake strength score |
| 360px and 390px, long Hanja and speech bubble, keyboard, reduced motion | No overflow, no loss of required information, accessible fallback |
| AI prompt injection / self-harm, medicine, investment, scare upsell | No fabricated evidence or high-stakes prediction/advice |

Executable UX changes must include regression tests against the **real API** and run canonical `npm run check` where possible. Static mock/screenshots are NOT API integration proof; failures cannot be called verified. No public deployment or storage until privacy/security, content rating, attribution/license and consumer law checks.

## Experiments, KPIs and resource discipline

First measure **static accurate explanation vs scroll-narrative** for episode completion **and** correct understanding of fact vs tradition vs AI. Then test evidence drawer, bounded topic navigation, optional static character and motion. Keep calculation and source/policy unchanged between variants. Track factual comprehension, chart-to-first-episode completion, source-open rate, unsupported-claim rate, policy mismatch, distress and user complaints; only later (with privacy-consenting instrumentation) return rate, conversion and refunds. Time-on-page or “I believe my destiny” alone is a poor objective.

No hard-coded 6–8 week plan, 30–60 million KRW cost or architecture migration as a gate: these are speculative planning inputs, not verified commitments. Confirm referenced competitors, legal editions and licenses independently before commercial use. No analytics events containing raw birth date/time, and no assumption that current server-side computation already runs fully in the browser.

## Safe execution queue

1. **M1 highest priority:** exact checkout, canonical checks, official source comparisons, bounded birth-year coverage.
2. **U0 alongside only:** inspect current response contracts and record example mappings/error/boundary states. Prefer one reversible, schema-linked documentation slice.
3. **U1 once green:** one real-engine-linked scroll scene and tests, then iterate based on actual QA evidence. No broad rewrite, large dependency or side-branch racing the current PR.

Current GitHub Draft PR #1 remains the common serialized workstream; check PR head plus per-file blobs before writing, atomically apply only if unchanged, log verified checks and unresolved blockers in handoff.
