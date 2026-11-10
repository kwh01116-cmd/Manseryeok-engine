# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-10 KST.** Owner-authorized A→B is implemented: API2026 actual chart integration passed first, then an explicit local1989–2026 profile. No collection/API-key work, default engine/G0 replacement, Story UI, Actions or deployment.

## Current executable paths

| Path | Actual coverage |
| --- | --- |
| Existing default engine/G0 | Gregorian2026–2027; unchanged |
| `kasi-api-2026-local-v1` | `[2026-01-01,2027-01-01)` civil birth dates, time required |
| `kasi-api-1989-2026-local-v1` | `[1989-01-01,2027-01-01)` after lunar→Gregorian conversion, time required |
| Collected data/research date index | Gregorian1950–2026; not historical timestamp chart support |

`node scripts/kasi/local-chart.mjs` or `npm run kasi:chart -- ...` requires explicit profile, candidate directory, independently held manifest pin, calendar/date or lunar date/leap flag, HH:mm, clock policy, day rollover and hour-stem reference. Output is JSON stdout only. [Copyable Node22/PowerShell G/L commands](KASI_LOCAL_CHART_GUIDE.md).

## Exact tested code and evidence

- A code/test SHA **183878fdfc1cecdd1f133eec41d0e7d978c48f00**: full403/403, fail/cancel/skip/todo0; Lab and KASI real Chrome PASS. Actual2026 API G/L vs existing fixture18,240pairs/54,720semantic comparisons/73,152event-receipt checks PASS. All365days×12hour branches×4policies plus Jie/minute and calendar/Zi edges. Only after this gate was B registered.
- B final code/test SHA **6d75f24f7006a9dcabd701c410340d5ced7f1c51**: Windows portable Node22.23.3/npm11.12.1/TS5.8.3, full **408/408**, fail/cancel/skip/todo0; Lab/KASI real Chrome PASS. Actual13,879days and38years of Jie/calendar/Zi cases:47,975G/Lpairs,143,925semantic comparisons,200,002event/receipt checks PASS.2026A/B365days MATCH; valid/invalid leap, bounds, policy/time, alternating year/profile and result mutation isolation checked.
- Separate network-blocked B runs under explicit UTC and Asia/Seoul used the same clean SHA. Summary bytes identical, content SHA **8ab48d86d3d38c5f431d0440ef389e02708223d3e039b7339d6724945025fde2**; three semantic digests **359d92dd0a5b07bf2fba0d0ac9988580e5d721c931d418410c31b5c5c84b5369**. Execution time/TZ are separate metadata. No full birth-result corpus saved.
- Public tests are synthetic. Actual private checks are separate and fail if data is absent. CLI tests block network and fixture/Collector/research imports while performing actual subprocess calculations. No fallback/default policy/time.
- [Full A/B evidence, scopes, limitations and private log paths](engineering/KASI_API_LOCAL_CHART_EXECUTION_20261110.md). Prior390/390 atfe84ab4 is a separate historical run.

## Dataset, policy and preservation

- Input remains `.private/kasi-local-1950-2026/monthly-xml/`; export SHA **7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851**. Existing candidates `.private/kasi-research-1950-2026-fe84ab4-a/` and `...-b/` pin **8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf**. Both candidate directories and original whole-file tree were unchanged; original tree82c5a30c…66567 matches pinned manifest. API requests0, keys0, recollection0.
- Existing loader/index extracted into `scripts/kasi/candidate.mjs` with no fixture/acquisition imports; research API re-exports preserve compatibility. Local profile calls the existing coverage-checked composer with each year's24terms+prior Daxue25events. API observed-date index handles lunar conversion without coercion into complete annual-TXT lunar types. Calendar ganji are not pillar inputs.
- Event identity includes receipt+date+term; actual applied row/time policy/service/operation/query/response SHA is returned. API sourceKind is KASI_OPENAPI_RESPONSE, never TXT source IDs or a forged G0 receipt.
- Clock policy **KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1 /1** compares modern Korea civil and API KST wall minutes atUTC+09/DST0.1988auxiliary guard is December Daxue after DST ended, not1988birth support. Original API_KST_AS_PUBLISHED/NOT_RESOLVED retained, derived interpretation separate, UTC instants not created. [Primary evidence and limits](research/KASI_MODERN_API_CLOCK_POLICY_20261110.md).
- Existing four explicit day/hour combinations and correlated published-minute ambiguity retained.2027events are unnecessary for this birth resolver/coverage; future Da-yun next-Jie is separate. ZI_START may use2027effective day for a2026birth without granting2027birth support.

## Open boundaries and delivery

1988birth DST gap/fold,1950historical clocks/24:00, partial end lunar months, external full-range certification and redistribution remain separate. Original null816leap rows/28groups, longitude null1392 and held1950Dahan are preserved. G1 annual-TXT original rows0/86/origin digests0/3/rights UNVERIFIED/P2 NO-GO remain unchanged. Default src/fixtures/web/G0/G1 contracts are unchanged.

Approved branch remains `agent/kasi-local-1950-2026-20261109`; initial remote923f5cf0b361c98680a6c9c6658290574712cf43. A/B are separate normal commits; later checkpoint/report edits are documentation only. Only code/synthetic tests/non-secret reports may be pushed. `.private` stays ignored, no force-add. Re-read remote HEAD and every workflow before ordinary Push; current push workflow is foundation-only. No main/foundation/base branch changes, force push, Actions, merge or deployment.

Next minimum historical work: a separate1988DST gap/fold integration test normalizing civil birth clocks with existing time modules and comparing pinned API KST events. Do not promote1988/1950timestamp support before its policy/evidence closes.

History: [previous checkpoint](archive/EXECUTION_HANDOFF_BEFORE_API_LOCAL_CHART_20261110.md), [DEVLOG](DEVLOG.md), [ROADMAP](ROADMAP.md), [prior research adapter execution](engineering/KASI_RESEARCH_ADAPTER_EXECUTION_20261110.md).
