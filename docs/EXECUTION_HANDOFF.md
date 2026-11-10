# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-11 KST.** M7 v0.2 implements explicitly selected nominal calendar projection: an issued v0.1 starting interval → sequential Gregorian Y/M/D/H addition → first nominal transition date → directly anchored decade intervals → explicit as-of selection → referenced JSON/Korean text. These are dates under one selected arithmetic policy, not measured transition instants or predictions. Original v0.1 direction, sequence, Jie, integer interval, rational age, ambiguity/missing states and Se-yun remain intact.

## Current paths and distinct ranges

| Path | Actual scope |
| --- | --- |
| Default engine / production / Lab / G0 |2026–2027, unchanged |
| Existing API natal chart/M2/basic explanation |`kasi-api-1989-2026-local-v1`; civil birth `[1989-01-01,2027-01-01)` after lunar conversion, explicit HH:mm and four existing day/hour combinations |
| M7 v0.1 without new flags |Existing `kasi:luck` contract, policy `M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01`, unprojected model-age result and held calendar fields unchanged |
| Selected M7 v0.2 |Same natal range; explicit `--calendar-projection M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02`, version0.2.0; optional explicit as-of date and time |
| Pure nominal Gregorian arithmetic/period generation |Valid proleptic Gregorian `0001-01-01T00:00` through `9999-12-31T23:59`; reject arithmetic/table overflow, not natal-support expansion |
| Real-use as-of selection |`[1989-01-01T00:00,2027-01-01T00:00)` only; outside is POLICY_UNRESOLVED even when a future nominal table exists |
| Collected/research data |1950–2026, not timestamp natal support across that whole period |

Future nominal intervals do not require future solar-term data, but do not certify future civil time/DST, UTC instants or Se-yun. Early1989 reverse starts may use the actual1988-12-07 Daxue guard without enabling1988 births. Late2026 forward starts still need2027 Xiaohan;2027 timestamp Se-yun independently needs2027 Lichun. No fixture fallback, API call, recollection or manifest change.

## Executable contract and policy

- [Copyable Node22 PowerShell Gregorian/lunar, MALE/FEMALE,1990 as-of, Lichun, year-end and optional-M2 commands](KASI_LOCAL_LUCK_PROJECTION_GUIDE.md). Both `--as-of-date` and `--as-of-time` are required together; omitted as-of means no selection, never PC-now. Existing flags without projection preserve v0.1 behavior. JSON stdout has no progress/banner; safe errors use stderr; no default birth/result saving.
- Product natal M1 executes once. Projection reuses the same issued M1→M7 result, preserving profile/dataset/manifest/policies/candidate/source links. `projectLocalLuckResult` can project an existing issued v0.1 result without another M1 call. Optional natal M2 stays in the same execution; independent Se-yun is not multiplied with natal candidates.
- New output schema `kasi-local-luck-projection-v02` contains the original result in `m7`, new candidate calendars/selections/facts in `projection`, and deterministic Korean template0.2.0 explanations. `projection.baseContractScope=V01_UNPROJECTED_LEGACY_RESULTS_RETAINED` separates nested v0.1 held fields from the selected nominal result. Issued-result identity/fingerprints, immutable facts/periods, baseFactRefs and policy/rule/source references reject cross-candidate/request swaps and tampering. Serialized status/hash alone is not authentication.
- For original integer M>0 and OK start: Y=floor(M/4320), MO=floor((M mod4320)/360), D=floor((M mod360)/12), H=2×(M mod12). Preserve the original exact M/4320 model age; never reverse display decimals. Add Y→MO→D→H from the actual recorded Gregorian birth minute, not Zi `effectiveDayDate`. Year/month steps clamp valid inputs to the target month end; invalid dates are rejected. Step inputs/results/clamps remain traceable.
- For first nominal date S, every boundary is directly `S+10k years`, with year clamp and half-open `[start,end)`. Never repeatedly add10years from the previous boundary. S=2000-02-29 gives2010-02-28 then2020-02-29. The original model-age intervals remain a different representation.
- The policy is explicitly nonmonotonic:2026-01-31 12:00 with M359 gives2026-03-02 10:00, while M360 gives2026-02-28 12:00. No correction, inferred seconds, ±30second interval or probability. MINUTE sources yield `NOMINAL_UNDER_SELECTED_POLICY`, not an exact physical instant.
- Selection validates explicit input/policy, then as-of scope, then propagates AMBIGUOUS/NEEDS_DATA, followed by BEFORE_BIRTH, BEFORE_FIRST_DA_YUN, RESOLVED_UNDER_POLICY or OUTSIDE_GENERATED_RANGE. Exact nominal boundary minute belongs to the new interval. No invented small-luck period or last-period extension. Each natal candidate retains its own calendar/selection; no first-candidate shortcut.

[Policy, counterexamples and pinned comparison sources](research/M7_CALENDAR_PROJECTION_V02.md): traditional3-day basis remains the v0.1 evidence; lunar-python revision1645ad3b…f8ce sect2/sequential calls and Temporal documentation revisione8cc03fc…4e55 are software/technical comparisons only. Current Node22.23.3 has no native Temporal; no library/polyfill installation or executed-library oracle claim. Gregorian clamp/direct-anchor/query semantics are explicitly project-selected conventions. Classical critical editions/scans/rights remain open.

## Exact implementation and verification

Pure module/core tests/policy commit **3912b2dc800040c66c8bb21f04ad7628cc0ce8b5**. Initial integration commit **1857dd19ba6353ec055ed550f853573d9a88a5ce**. Held-TEXT correction commit **a88f25bde4caba2eeae7165eb97b1343f71566dd**. Final code/test SHA after the separate HTTP test-runner repair: **ebedd7bda54f0ff06273a73ab960897bd216818e**. Later execution-record/handoff changes are documents only. Runtime remains Windows Node22.23.3/npm11.12.1/TypeScript5.8.3/Chrome154.0.8037.98 with locked dependencies.

Final EB: full **469/469**, fail/cancel/skip/todo0; old443 retained +25M7 +1runner. M2 audit exit0 keeps evidence open. Lab and KASI actual Chrome each FIRST natural exit0, owned cleanup complete. Actual35CLI at A88 +4at EB +1npm wrapper passed; production modules are identical across A88/EB, old v0.1 JSON bytes match the fixed earlier output and held TEXT lists every requested sequence member.

Actual UTC/Asia-Seoul full runs each47,975vectors /95,950G-L×sex pairs /191,900product=M1 calls /199,196candidates. Newly computed projections191,738, AMBIGUOUS7,296, NEEDS_DATA162; normal period checks1,917,380. Independent focused255selections consist of254from240no-M1 reprojections plus1separate short-range product/M1 request. The38alternations/38mutation-isolations/78adversarial envelopes/2badloaders passed. Recomputed legacy7c4f…de4eb9 matches the prior pin; new projection b59cd6b0…841915 and summary bytes match bothTZ. Canonical summary8d3314e0…9e24a7. Original/a/b and12executed files unchanged before/after; owned processes0. Detailed grid/aggregate units and hashes are in the report.

Initial1857 full468/audit/Lab/KASI and35 CLI examples were observed on that older SHA. Manual held TEXT review then found that it announced10 entries while displaying only the first3 preview. The new renderer now prints all requested held sequences without inventing dates; the change is presentation-only and regression assertions were added. First private full runs were stopped after logs reached5,000 vectors, with exact owned workers identified and interruption receipts retained. Those interrupted logs are **not** final private PASS and were not deleted or rewritten as a completed run. Subsequent checks are separate from the1857 results. Previous v0.1 Lab teardown failure/retry remains historical in its report; do not relabel it as a new v0.2 failure.

The a88f25b full check then exited1 with465/468: three original HTTP tests reported undici `fetch failed`, while35 actual CLI subprocesses exited0. The underlying cause of those transport failures is not proven. Inspection separately found that the old readiness parser could accept a partial port before the newline and that owned server shutdown was not awaited. The narrow test-runner repair preserves the original product assertions and8000ms startup bound, adds finite fragmented-readiness coverage, and changes neither production server nor M7 arithmetic. The failed execution stays recorded separately from the final verification above.

[Detailed final execution, virtual examples, actual counts and failures](engineering/M7_CALENDAR_PROJECTION_EXECUTION_20261111.md). Actual2026-06-01 12:00 examples under the approved policy: MALE M6528 →2027-12-05 12:00; FEMALE M38351 →2035-04-17 10:00. Numeric example publication and independent hand expectations do not authenticate physical transition instants. Full private outputs remain private.

## Preserved evidence and delivery

Original `.private/kasi-local-1950-2026/monthly-xml/` export SHA **7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851**. Candidatea/b manifest-content pin **8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf** is independently held, never read from the target as its own expectation. Reuse the verified loader. Original responses/export/checkpoints/candidatesa/b are read-only; new outputs use separate private directories. Full pre/post tree evidence is recorded in the linked execution report separately from these expected pins. API/key/recollection0.

Keep null-month816rows/28leap groups, null-longitude1392,1950Dahan24:00 review, clipped endpoint lunar months and unresolved historical clocks. Birth support/clock policy and four day/hour combinations are unchanged; no1988/1950 timestamp extension. Default2026–2027/G0 and **G1-P2 NO-GO** remain. No M3 strength/M4 structure/M5 useful-god, transformation/fortune/personal-event prediction, LLM, new UI, public API/deployment or final-service default-policy adoption.

Approved branch remains `agent/kasi-local-1950-2026-20261109`; starting local/remote **9119973e7adcf329a02e2beff2307761d72ff274**. Only code/synthetic tests/non-secret documents belong in ordinary fast-forward Push. Keep .private ignored; never stage raw/export/candidates/full private results. Recheck all workflows and final diff plus expected remote head before Push; foundation-only push workflow must not trigger on this branch. Record actual remote HEAD after delivery. No main/foundation/base change, force, Actions, PR merge or deployment.

## Next minimum step and history

Review a separate **minimal2027 boundary-data task**: Xiaohan for late2026 forward starting intervals and Lichun for2027 timestamp Se-yun, each with its own source/clock/pin validation. No full1950–2026 recollection and no silent use of default fixtures. This is a next-task list, not an API-collection action in v0.2. Other calendar policies, precise physical instants, historical clocks/DST, strength/structure/useful-god and Story/Astra product work remain separate.

History: [pre-v0.2 handoff](archive/EXECUTION_HANDOFF_BEFORE_M7_V02_20261111.md), [DEVLOG](DEVLOG.md), [ROADMAP](ROADMAP.md), [v0.1 execution](engineering/KASI_M7_LUCK_EXECUTION_20261110.md).
