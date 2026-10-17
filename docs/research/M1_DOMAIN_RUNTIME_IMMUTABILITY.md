# M1 GanZhi runtime immutability (2026-10-09)

Status: DRAFT PR; exact repository canonical checks UNVERIFIED.

## Evidence / adversarial counterexample
The exported SEXAGENARY_CYCLE was only TypeScript-readonly. Node 22.16.0 pre-fix reproduction: a JavaScript consumer changed ganZhiAt(0).stem from 甲 to 乙, corrupting the shared 甲子 anchor. Exported HEAVENLY_STEMS/EARTHLY_BRANCHES arrays were likewise mutable, and feed day/hour pillar calculations. Direct code-level software fact, not a classical or astronomical claim.

## Small reversible fix
Freeze HEAVENLY_STEMS, EARTHLY_BRANCHES, FIVE_ELEMENTS, YIN_YANG, SEXAGENARY_CYCLE and every GanZhi entry. Preserve all table values and lookup arithmetic. Mutation attempts now throw TypeError; callers wanting a mutable value must copy it. Other nature maps remain outside this slice.

- Source genealogy: src/domain/stems.ts, branches.ts, sexagenary.ts; existing test/domain.test.mjs finite-cycle assertions.
- Preconditions: strict ES2022 JavaScript; returned GanZhi and exported constants treated as read-only.
- Exception: push/index assignment and GanZhi member mutation fail closed.
- Boundary: 甲子 index 0, 癸亥 index 59, cycle wrap, invalid-parity 乙子 unchanged.
- Codeability: EXACT software integrity invariant. Dispute: NONE about runtime immutability; no policy or interpretation heuristic.
- Adversarial test: mutate ganZhiAt(0).stem, cycle entry, and source array, then assert TypeError and unchanged 甲子.

## Checks performed
Pre-fix local corruption reproduced. Reconstructed 3-file domain slice compiled with TypeScript 5.8.3 strict and passed Node 22.16.0 focused test 1/1. Exact GitHub checkout unavailable (git ls-remote DNS failure); npm ci/npm run check NOT RUN. Repository regression added, not certified. No merge.

## Next
Recover exact checkout and canonical tests; KASA official-annex/KASI fixture comparison and rights; then V0 read-only integration after green checks.


## 2026-10-09 continuation: five-element and ten-god map protection

- Finding: the preceding commit froze the sexagenary cycle but left exported STEM_NATURE and BRANCH_NATURE maps mutable at runtime. A JavaScript caller could change STEM_NATURE.甲.element and corrupt tenGod("甲","丙") on subsequent calls. A malformed prototype key such as "__proto__" was not rejected at the tenGod API boundary.
- Change: freeze each nature record and its containing map, freeze TEN_GODS, and explicitly validate both heavenly-stem arguments against the canonical finite tuple before reading the map. No mappings or interpretation policies were changed.
- Classification: EXACT deterministic software integrity and runtime validation; source genealogy = src/domain/stems.ts, branches.ts, tenGods.ts and existing domain tests; dispute NONE about validation. No new astronomical/classical interpretation rule.
- Preconditions: ES2022 strict runtime, canonical heavenly stems. Exceptions: mutation attempts throw TypeError; invalid stems (including prototype keys, null, undefined, numeric) throw RangeError. Boundary: each day master still maps all ten stems bijectively to ten gods.
- Adversarial counterexample: mutate STEM_NATURE.甲.element to FIRE and then calculate tenGod("甲","丙"); the pre-fix exported map allowed output corruption, the new map rejects mutation and retains 食神.
- Checks: Node v22.16.0 / TypeScript v5.8.3 strict compilation PASS and 3/3 focused tests PASS on a manually reconstructed three-module domain slice. Canonical repository npm ci && npm run check NOT RUN (github.com DNS unresolved). New repository tests added but NOT certified. Draft PR remains open; M1/V0 gates OPEN.
