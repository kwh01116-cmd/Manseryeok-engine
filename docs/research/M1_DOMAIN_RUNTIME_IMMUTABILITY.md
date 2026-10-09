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
