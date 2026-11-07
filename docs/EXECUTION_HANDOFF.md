# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-07 UTC.** Current owner direction: pause Cloud KASI diagnosis; accept future locally obtained data and improve non-engine verification. No API/key use, M1 calculation/year expansion, P2 integration, new Story App/EP5/design, Actions or deployment. Existing EP0–EP4 remains the internal Lab. This checkpoint does not grant new permissions.

## Latest delivered code / checks

- Approved branch: `agent/m1-applied-jie-slice1-20261019`; re-read remote HEAD before work. main/foundation remain off-limits.
- Offline response intake code/test SHA: **4026bdb7e8c2ae37d3d943726be29539e872e4b4**. `npm run kasi:intake` inspects one local raw XML/JSON response with an explicit scope. No network/keys/engine imports or automatic integration. [Guide](KASI_LOCAL_INTAKE_GUIDE.md).
- Codex directly ran Node 22.23.3 / npm 10.9.9 / TS 5.8.3 `npm run check`: **335/335 PASS**, failure/cancel/skip/todo 0. Lab and KASI synthetic-upstream real Chromium 154.0.8037.57 both PASS. Source/tests clean at that SHA; later documentation is not another code test run. [Execution report](engineering/OFFLINE_VALIDATION_EXECUTION_20261107.md).
- Earlier Collector CLI and loopback web remain implemented. Do not rebuild them or resume live probes from old instructions. Eight earlier limited Cloud attempts failed HTTP 400; cause remains unresolved. Local success is owner-reported, not reproduced. No API call in the new offline work.

## Guarantees and open gates

- M1 default Gregorian `[2026-01-01,2028-01-01)`; 49 solar events and 37 lunar starts. Research 2000 and historical-time helpers are not wider runtime support.
- G0 binds server-selected fixtures to one M1 execution/correlated candidates and trusted M2 v1/v2/v3. It is in-process consistency, not external source authentication. Generic M2 assumes trusted upstream.
- G1-P1 is report-only. **0/86 original rows verified; 0/3 origin-file digests; rights UNVERIFIED; P2 NO-GO.** Historical public-indexed 86/86 table comparison does not close this gate.
- M2 finite policies exist; M1/M2 overall PARTIALLY_VERIFIED. M3–M6 blocked by source/policy; M7 research; M8 not implemented. No strength/fortune/合化 claims from structural tests.
- Intake PASS proves only declared-scope structure. Empty/partial/date-only responses remain distinct; raw source authenticity, independent accuracy, rights and engine support remain unverified. No actual user response has yet been inspected with the new tool.

## Next bounded work / delivery

M2 source/policy audit infrastructure can proceed offline without changing rules. Receive actual local data separately using the intake guide; original-row evidence and source-rights decisions are separate later gates. Preserve existing Lab UI and all tests. Inspect every workflow before any ordinary approved-branch Push; stop if it could trigger Actions. No force, merge, main/foundation updates or deployment.

History: [master handoff](CODEX_CLOUD_MASTER_HANDOFF_20261030.md) is a historical index; [DEVLOG](DEVLOG.md) is the cumulative journal; [ROADMAP](ROADMAP.md) is the longer plan. Prior checkpoint is preserved in [Git at 667f2a98](https://github.com/kwh01116-cmd/Manseryeok-engine/blob/667f2a98d37f726cfaf7dfd91fd594063d36260f/docs/EXECUTION_HANDOFF.md). Earlier Collector/web/G0/G1 reports remain in `docs/engineering/`.
