# M2 G6 — ChartFacts v2 with positional raw earthly-branch relations

Status: research-engine schema, not consumer/API release. Verify via canonical CI before treating as green.

## Non-breaking versioned contract

`deriveM2ChartFactsV2(m1Result, hiddenStemPolicyId, branchRelationsPolicyId)` is a separate opt-in adapter on top of `deriveM2ChartFacts` v1. No breaking change to v1, the existing `/api/preview` response, V0 story beats, or supported birth years. Both the hidden-stem and branch-relations policies **must** be named explicitly.

The `m2-chart-facts-v2` result preserves:
- Fully validated/calculated M1 Four Pillars and its exact policies, source minute edition IDs and finite supported-year manifest
- Calendar-specific lunar conversion source when applicable
- The base M2 v1 candidate objects (4 pillars, visible-stem ten gods and every branch's hidden-stem ten gods)
- Both correlated candidate branches when M1 returns a published-minute ambiguous Lichun/other Jie input
- The selected versioned relation profile and **all five** per-kind rule IDs and source edition IDs

Each `candidate.branchRelations[]` preserves all matching independent **position pairs** among year, month, day, hour (six index pairs). Every entry points to `preview.candidates[i].{year,month,day,hour}` for BOTH linked pillars and carries `leftPillarIndex` / `rightPillarIndex`, source ID, direction and raw relation kind. Directed punishment has explicit `fromPillarRole` and `toPillarRole`; symmetric/bi-directional/self-punishment leave those fields absent. One occurrence cannot create self-punishment by comparing the same position to itself.

- A pair may be `LIUHE` and `LIUPO` simultaneously, or even `XING`, without one suppressing the others.
- **Presence does not establish activation, transformation or auspicious effect.** No interpretations, M3 strength scores, destiny, relationship advice, or clinical/financial claims.
- Unsupported/invalid dates return a frozen empty `BLOCKED` result; corrupt provenance or missing/incorrect policy throws, rather than fabricating a chart.

## Canonical tests

`test/m2-chart-facts-v2.test.mjs`:
- Real M1 Gregorian 2027-02-05 → M2 v1 → M2 v2 invariant preservation
- Real equivalent Korean lunar 2026-12-29 → exact same candidate relation list; converter-specific source remains distinct
- Real published-minute 2027-02-04 10:46 → two separate candidate relation lists with candidate-specific role/fact references, no Cartesian product
- Unsupported coverage / impossible lunar / spoofed M1 source, invalid policy IDs, immutability and input DTO snapshot mutation
- Source-identified graph correspondence to `collectFourPillarBranchRelations` for every candidate

Upstream 12×12 exhaustive raw-table fixtures and self-occurrence counterexamples: `test/m2-branch-relations.test.mjs`. Source critical reasoning: `docs/research/M2_RAW_BRANCH_RELATIONS_SOURCE_GATE.md`.

## Next gate

Full M2 remains PARTIAL until additional independently sourced three-way (三合/三會) predicates and competing school profiles are reviewed, then mobile educational presentation of raw relation facts can be built with explicit meaning disclaimers. Do not expose the research V2 API publicly or merge the large Draft PR until source/licensing and security/review gates are met.
