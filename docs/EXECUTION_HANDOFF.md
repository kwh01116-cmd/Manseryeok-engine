# Manseryeok-engine — current execution handoff

**Checkpoint:** 2026-10-19 KST. **Direction:** engine reliability first until further owner instruction. Existing EP0–EP4 is **Manseryeok Lab**, an internal calculation/rule verification tool; preserve its current UI. Story App/EP5 UI, characters/webtoon/design concepts and public deployment are paused. Future Astra design is a separate task.

This is current status, not authority to override `AGENTS.md` or owner instructions. Read the [active engine roadmap](ROADMAP.md) and [engine assessment / G0 execution report](engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md), then inspect live refs.


**2026-10-20 research/access note (NOT a new engine implementation):** Owner reports KASI **15012690 특일 API** key issued and supplied v1.4 guide confirming documented \`get24DivisionsInfo\` fields \`locdate\`, \`dateName\`, \`kst\`, \`sunLongitude\`. **No authenticated live call yet**; 15012679 lunar API is separate. Key was discussed in **ChatGPT Work cloud environment settings**; availability in a separate Codex runtime is **unverified**. Never commit or print secrets. First run R0 read-only API response/schema test and comparison, while planning G1 current-corpus per-event/month edition provenance; do not replace fixtures or expand supported years without review. See [2026-10-20 roadmap addition](ROADMAP.md) and [dated devlog](DEVLOG.md).

**2026-10-20 API-independent pivot:** Work/Codex environment save/publish errors block credential setup. Owner explicitly paused R0 authenticated API calls. **G1-P0 existing-corpus evidence audit completed**: [49-solar / 37-lunar event/edition provenance findings and G1-P1 contract](research/G1_EVENT_MONTH_EDITION_EVIDENCE_AUDIT_20261020.md). Annual KASI V1.0a page metadata was observed from public indexed content for 2025/26/27; raw annual TXT/file digest and complete per-row source verification remain UNVERIFIED. Do not treat this documents-only result as G1 implementation or a new 283-test run. Next executable slice is G1-P1 **report-only manifest/auditor** with UNKNOWN rather than fabricated editions; no source rights promotion or G0 runtime change. \`KASI_API_KEY\` is not required for that step.

## Active refs / exact verified code

- Repository: `kwh01116-cmd/Manseryeok-engine`; approved branch: `agent/m1-applied-jie-slice1-20261019`.
- Started from freshly fetched local/remote `8325a2eb113776901d859040d8dca0e32f5ef096`. Later documentation commit changes HEAD again; **re-fetch**.
- G0 implementation: `0bbaf47d1e91e2ce4e9af5790bd6cca6c0a9adf2`; separate regression commit / final tested executable tree: **`0eb277645b7e87915c9dd6d68172a7d0516cce40`**.
- On that exact tree: fresh Node **22.23.3**, npm **10.9.9**, TS **5.8.3**; `npm ci`, `npm run check` **283/283 PASS**, 0 fail/cancel/skip/todo; actual Chromium **154.0.8037.57** Lab EP0–EP4 smoke **PASS**. Documentation successor is not a new code-test execution.
- Protected refs observed: main `39b6653e4f93169a4b5b51412b72d4710e9da91f`; foundation `95906e6b0d57427b69c6461bb66eb076e2076af0`. No merge or direct update authorized.
- Inspect workflow before **every push**: current trigger is selected executable paths on `push` to foundation only. Owner prohibits Actions, force push, public deployment and personal-data storage. Use ordinary fast-forward push only to the approved work branch and verify remote HEAD.

## Implemented scope and G0 guarantee

- Default M1 Gregorian interval remains **2026–2027**; lunar inputs only if their converted civil date falls inside it. 2000 is test-only research, not a default runtime profile. Standalone base-offset/1987–88 DST helpers are not integrated into historical chart calculation.
- M1 applied Jie trace and correlated boundary candidates, existing M2 v1/v2/v3 finite named-profile facts, and Lab EP0–EP4 remain. No new school, strength, personality, fortune, useful-god rule or source year was added.
- G0 selects fixed server fixtures/manifest/annual edition metadata, calculates M1 once, checks selected context/exact event provenance, freezes an execution receipt and verifies subsequent DTOs against that same execution. Trusted M2 v1/v2/v3 wrappers reject altered corpus/event sources, candidates/refs, policies, schema and lunar provenance. HTTP uses the trusted entry point while preserving the existing response/UI.
- Fourteen new regressions include the original nonempty forged-source example. **Generic M2 v2/v3 still return READY for that example by design**: they assume trusted M1 and provide structural/self-consistency checks. New trusted entry points reject it. Do not advertise source authentication for generic functions.
- V8 precise function coverage verified exactly one M1 resolver call while verification and M2 wrappers ran repeatedly. Receipts are request-local in-process capabilities, not serialized signatures or durable birth-record storage.
- G0 guarantees selected-fixture/execution consistency only. It does not authenticate an external publication, establish astronomical correctness or commercial rights. Per-row event edition metadata is not yet encoded; existing fixture digest tests and annual context metadata are not a substitute for source criticism.

## Next engine unit / open gates

1. **G1 provenance:** versioned event/month-to-edition manifest + fingerprint validation for the **current corpus**, no year/UI expansion. Verify actual source metadata first; keep unresolved rows blocked rather than inferring editions from a generic source ID. Preserve event-vs-corpus sources, candidate isolation and one M1 path.
2. **Then one adjacent modern year:** provisionally 2025 after 2024 Daxue guard, full 2025 terms, late-2024 lunar wrap, independent witnesses and rights review. Current lunar rows alone omit January 1–28, 2025. No supported-range change until complete evidence/tests.
3. **Historical time:** primary decrees/IANA comparison and exact gaps/folds before integrated conversion; pre-1908 and earlier DST remain unresolved. Mean/apparent solar time is not implemented and must be separate from civil-time policy.
4. **M2/M3–M8:** M1/M2 overall PARTIALLY_VERIFIED; named finite subfeatures tested. M3–M6 BLOCKED_BY_SOURCE_OR_POLICY; M7 RESEARCH_ONLY; M8 NOT_IMPLEMENTED. No automatic interpretation. Full file-level evidence/research packets are in the report/roadmap.
5. **Release rights/security:** KASA 2027 KOGL Type 2, KASI reference/API field scopes and archive restrictions remain separate. Production Host/Origin, CSP, limits/timeouts, privacy/abuse and giant-PR integration remain open. No API key is held in the repository or evidenced in the Codex runtime; user reports a key issued in Work settings. No provider contact or paid service.
6. **Lab-only follow-ups:** prior small-text/focus findings remain in the [UI review](engineering/U1_EP0_EP4_UI_REVIEW_AND_EP5_READINESS_20261019.md). Automated Chromium keyboard/AX is not manual VoiceOver/NVDA or participant comprehension; both remain UNVERIFIED. Do not resume Story UI work from an old cursor.

## Preserved history

- Previous roadmap: [byte-preserved pre-engine-focus archive](archive/ROADMAP_BEFORE_ENGINE_FOCUS_20261019.md); old Story queues are superseded.
- Earlier handoff history: [pre-compaction archive](archive/EXECUTION_HANDOFF_BEFORE_COMPACTION_20261019.md).
- Existing dated M1 S1–S4 and U1 EP3/EP4 reports remain in `docs/engineering/`. Prior PNGs remain outside Git; no new screenshots or UI redesign were needed for this engine task.

For each next unit: fetch/live branch/workflow → source/policy gate → counterexample → narrow implementation → Node 22 full check + relevant real Lab browser → separate verified code/test/doc commits → ordinary push → remote/protected-ref/Actions verification. Do not treat historical notes or this checklist as permission to bypass owner constraints.
