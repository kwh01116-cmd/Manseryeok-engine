# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-10 KST.** Actual KASI1950–2026 acquisition is complete. Current owner request was read-only preservation/audit and an independent offline research adapter, with zero additional KASI requests. Existing EP0–EP4 remains the internal Lab. No production/G0 integration, engine-year expansion, P2 promotion, Story UI, Actions or deployment.

## Latest observed implementation and checks

- Exact tested code/test SHA **fe84ab44ec4cd0efd27fb57c480a2b422d9decbc**. Windows Node22.23.3/npm11.12.1/TS5.8.3, full `npm run check` **390/390 PASS**, fail/cancel/skip/todo0. Actual Chrome154 KASI synthetic web PASS and Lab EP0–EP4 PASS, including native-clock resource digest and owned process/server/profile teardown.
- `scripts/kasi/research.mjs` reuses Store.load/Collector.validateYear and existing civil-date/converter/day-pillar tools. No network client or keys are needed. Original raw/page/year/export/summary files are read-only; actual raw bytes/digests/receipts and full rebuild/export equality are checked. Separate pinned research candidate supports observed civil dates only.
- Real private input: `.private/kasi-local-1950-2026/monthly-xml/`. Export SHA **7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851**,12,063,546bytes, normalizer0.1.2.77years/1,848solar/28,124lunar,1,001raw+receipts. Whole-period year joins76, missing/duplicate/out-of-range0. Actual raw solJd28,124 separately extracted.
- Final private snapshots `.private/kasi-research-1950-2026-fe84ab4-a/` and `...-b/`, manifest content SHA **8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf**. Network-blocked/key-free compilation twice plus explicit private acceptance PASS. Derived files/manifest identical; original whole-file tree unchanged. Existing snapshots retained.
- Explicit exception ledger: null calendar month ganji816rows/28leap groups, regular null0; published1950대한24:00 held for review; missing API longitude1,392 preserved with separately derived expectedLongitude. Historical civil time remains NOT_RESOLVED; UTC created0.953lunar groups/952observed day1/two clipped end months. Support `[1950-01-01,2027-01-01)` is a research date lookup, not Four Pillars runtime coverage.
- Comparisons:2026solar24+2025대설1 MATCH; existing lunar fixture702daily/24months MATCH,13months UNSUPPORTED; independent library research fixture708daily/24months MATCH; existing civil-date day pillar28,124 MATCH. Round trips28,124 are internal reversibility only. No source/fixture auto-correction or historical timestamp chart validation.
- Prior380/380 at9bb92979418b75f5c588d72977d0fff93ad4099b and its EBUSY Lab failure remain historical evidence. Intermediate failures and fixes are recorded, not erased. [Execution and limitations](engineering/KASI_RESEARCH_ADAPTER_EXECUTION_20261110.md) · [CLI/consumer guide](KASI_RESEARCH_ADAPTER.md).

## Delivery and trust boundaries

- Reuse owner-approved derived branch `agent/kasi-local-1950-2026-20261109`, descended from approved base `agent/m1-applied-jie-slice1-20261019` at27903fbc. Initial local/remote HEAD42daf70; re-read refs before ordinary push. User authorizes code/tests/secret-free summaries only. `.private` stays ignored; no raw/export/bulk candidate publication, force-add, force push, merge, main/foundation change or deployment. Check every workflow before push; current workflow push trigger is foundation-only.
- Default M1 `[2026-01-01,2028-01-01)` remains unchanged. G0 trusted entry points and annual TXT evidence profile remain unchanged. API candidates use a distinct local-response evidence profile.
- G1-P1 original rows0/86 and origin-file digests0/3 remain unverified; rights UNVERIFIED; G1-P2 NO-GO. API hash/rebuild and fixture overlap do not authenticate annual TXT editions or grant redistribution rights.
- Historical clock policy and published24:00 interpretation remain unresolved. Boundary requirements identify1949late/2027early data but no request was made. Current Collector cannot collect1949 without a later explicit range review.

## Next bounded unit

Add one explicit research integration test injecting **2026-only API term candidates** into the existing calculator and compare boundary behavior/provenance against its fixture execution. Keep production/Lab/G0 entry points and support years unchanged. No repeat collection. Consult boundary-requirements only when separately planning the minimum missing evidence.

History preserved in [prior checkpoint](archive/EXECUTION_HANDOFF_BEFORE_KASI_RESEARCH_20261109.md), [DEVLOG](DEVLOG.md), [ROADMAP](ROADMAP.md) and dated engineering reports. Historical preparation/unrun claims do not describe the current dataset.
