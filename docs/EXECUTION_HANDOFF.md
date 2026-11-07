# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-07 UTC.** Current owner direction: pause Cloud KASI diagnosis; accept future locally obtained data and improve non-engine verification. No API/key use, M1 calculation/year expansion, P2 integration, new Story App/EP5/design, Actions or deployment. Existing EP0–EP4 remains the internal Lab. This checkpoint does not grant new permissions.

## Latest delivered code / checks

- Approved branch: `agent/m1-applied-jie-slice1-20261019`; re-read remote HEAD before work. main/foundation remain off-limits.
- Offline response intake introduced at **4026bdb7e8c2ae37d3d943726be29539e872e4b4**, monthly chronology corrected at **52f4ee61126c7462df05ee7089ddaac879b3c6ea** after review reproduced reversed dates being accepted. `kasi:intake` now rejects that case with `INTAKE_SOLAR_ORDER`; merely reordering rows retains the same result. No network/keys/engine imports or automatic integration. [Guide](KASI_LOCAL_INTAKE_GUIDE.md).
- M2 policy/source catalogue introduced at **03af44ec34489204a36692e8ca509ae03ad24aaa**; source-set delimiter collision corrected at **72024d521560826cab001591bfc1019b70ba8a5c** after synthetic reproduction. `m2:audit` compares actual elements/counts and links 4 policies, 9 native rules, 12 sources and 8 test titles. [Scope and open evidence](research/M2_POLICY_CATALOG_AUDIT.md).
- Latest direct Codex checks: Node 22.23.3 / npm 10.9.9 / TS 5.8.3 `npm run check` at **72024d52**: **352/352 PASS**, failure/cancel/skip/todo 0. Standalone M2 CLI and actual Chromium 154.0.8037.57 Lab PASS at that SHA. KASI synthetic-upstream Chromium last passed at **52f4ee61** (its code is unchanged). Monthly CLI and M2 CLI network-blocked tests are in the full suite. Clean tested code SHA; later documentation is not another code test run. Historical 335/335, 345/345 and 349/349 remain separate runs. [Execution report](engineering/OFFLINE_VALIDATION_EXECUTION_20261107.md).
- Earlier Collector CLI and loopback web remain implemented. Do not rebuild them or resume live probes from old instructions. Eight earlier limited Cloud attempts failed HTTP 400; cause remains unresolved. Local success is owner-reported, not reproduced. No API call in the new offline work.

## Guarantees and open gates

- M1 default Gregorian `[2026-01-01,2028-01-01)`; 49 solar events and 37 lunar starts. Research 2000 and historical-time helpers are not wider runtime support.
- G0 binds server-selected fixtures to one M1 execution/correlated candidates and trusted M2 v1/v2/v3. It is in-process consistency, not external source authentication. Generic M2 assumes trusted upstream.
- G1-P1 is report-only. **0/86 original rows verified; 0/3 origin-file digests; rights UNVERIFIED; P2 NO-GO.** Historical public-indexed 86/86 table comparison does not close this gate.
- M2 finite policies exist; M1/M2 overall PARTIALLY_VERIFIED. M3–M6 blocked by source/policy; M7 research; M8 not implemented. No strength/fortune/合化 claims from structural tests.
- The new bounded M2 audit is `CATALOG_CONSISTENT_EVIDENCE_OPEN`: critical editions/rights verified 0, seven native rule objects lack a separate `version`. Composition/upstream records remain outside this audit. Runtime policies/calculations are unchanged; audit success is not source authentication.
- Intake PASS proves only declared-scope structure. Empty/partial/date-only responses remain distinct; raw source authenticity, independent accuracy, rights and engine support remain unverified. No actual user response has yet been inspected with the new tool.

## Next bounded work / delivery

Offline intake and the bounded M2 audit are implemented; both reported review counterexamples were reproduced and corrected with regression tests. Next minimal unit: inspect one actual local response when supplied. Original-row evidence, critical editions, source rights and broader M2 registration remain separate later gates. Preserve existing Lab UI and all tests. Inspect every workflow before any ordinary approved-branch Push; stop if it could trigger Actions. No force, merge, main/foundation updates or deployment.

History: [master handoff](CODEX_CLOUD_MASTER_HANDOFF_20261030.md) is a historical index; [DEVLOG](DEVLOG.md) is the cumulative journal; [ROADMAP](ROADMAP.md) is the longer plan. Prior checkpoint is preserved in [Git at 667f2a98](https://github.com/kwh01116-cmd/Manseryeok-engine/blob/667f2a98d37f726cfaf7dfd91fd594063d36260f/docs/EXECUTION_HANDOFF.md). Earlier Collector/web/G0/G1 reports remain in `docs/engineering/`.
