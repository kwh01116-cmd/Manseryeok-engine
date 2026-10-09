M1 #13 finite Korean lunisolar conversion (2026-10-09 KST)

STATUS: draft implementation; exact repository check pending; NOT OFFICIAL-GOLDEN.

SOURCE GENEALOGY: KASI calendar data for 2025 (V1.0a generated 2024-05-07 14:23), 2026 (V1.0a generated 2024-07-25 16:57), 2027 (V1.0a generated 2026-06-30 12:33), plus the KASI 2028-01-27 lunar-new-year endpoint cross-check. See docs/research/KOREAN_LUNISOLAR_GOLDEN_CANDIDATES.md and SOURCE_REGISTRY.md for issuer links and authority caveats. KASI data are computational references, not the KASA official annex. Rights and edition comparison remain pending.

IMPLEMENTATION: five small calendar modules; explicit caller-provided corpus; 37 month starts, complete 2025/2026/2027 lunar years; Gregorian civil-date interval [2025-01-29, 2028-01-27), 1,093 days. Both directions return OK / OUT_OF_COVERAGE / INVALID_LUNAR_DATE; invalid shapes throw. Leap-month flag is mandatory. Calendar conversion does not select Myeongli year/month pillars or a birth-time policy.

RULE: EXACT date offsets within a finite, validated corpus; CONDITIONAL correctness of the transcribed publication; no INTERPRETIVE rule or school default. Preconditions: validated 29/30-day sizes, contiguous starts, complete year sequence, source edition tags, declared endpoints. Counterexamples: 2025-06-25 regular 6/1 versus 2025-07-25 leap 6/1; 2025 leap-6 day 30 invalid; 2026 leap-6 absent; 2026-02-16 is lunar 2025-12-29; terminal-month size corruption rejected. An internally consistent but false source corpus is NOT detectable without a pinned digest and independent official comparison.

CHECKS: isolated Node 22.16.0 / TypeScript 5.8.3 strict ES2022 NodeNext build/typecheck PASS; 6/6 focused tests PASS; 1,093 daily roundtrips PASS. Exact GitHub checkout and canonical npm run check NOT RUN because github.com DNS failed. Do not merge until repository checks pass.
