# M1 #12 — Five-Rat / Five-Tiger runtime input validation

Status: draft branch implementation; canonical repository verification **NOT RUN**.

## Evidence / classification
- Source genealogy: direct audit of `src/calendar/hourPillar.ts` and `src/calendar/monthPillar.ts`; the established 五鼠遁 and 五虎遁 finite tables and existing tests are unchanged.
- Category: **software runtime input integrity (EXACT)**, not a new classical, astronomical or Korean-school interpretation.
- Preconditions: caller supplies one of ten valid Heavenly Stems; hour branch one of twelve Earthly Branches; month branch one of the twelve 節-derived month branches.
- Exception: invalid/missing day stem, hour branch or year stem throws `RangeError`, rather than returning an invalid `GanZhi` with `undefined` stem.
- Boundary: the actual 23:00 Zi rollover policy remains elsewhere; no default time policy was added.
- Dispute status: NONE for finite-domain validation; interpretive use of time policies remains explicit.
- Adversarial vectors: `undefined`, `null`, `0`, empty string, `AUTO`, trailing whitespace, newline, `__proto__`, `Symbol` are rejected; all 10×12 valid hour and month combinations are retained.
- Counterexample: `hourPillarFromDayStem("AUTO", "子")` previously computed a negative stem index; `monthPillarFromYearStem("__proto__", "寅")` previously accessed an inherited object property rather than a defined year stem.
- Test vector: `test/pillar-input-validation.test.mjs`.

## Checks and limitations
- 2026-10-09 KST: isolated Node.js 22.16.0 test suite **3/3 PASS**, TypeScript 5.8.3 strict compile **PASS**, using exact patched functions and minimal dependency type stubs. This is **not** the repository's canonical check.
- Local `git ls-remote` **FAIL**: github.com DNS resolution. Exact checkout, `npm ci`, `npm run check` **NOT RUN**.
- Do not claim M1 Gate 12 verified or merge PR #1 until exact-branch canonical checks and official-boundary tests pass.
