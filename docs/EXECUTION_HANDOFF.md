# Manseryeok-engine — current execution handoff

**Checkpoint:** 2026-10-25 KST. **Direction:** engine reliability first until further owner instruction. Existing EP0–EP4 is **Manseryeok Lab**, an internal calculation/rule verification tool; preserve its current UI. Story App/EP5 UI, characters/webtoon/design concepts and public deployment are paused. Future Astra design is a separate task.

This is current status, not authority to override `AGENTS.md` or owner instructions. Read the [active engine roadmap](ROADMAP.md) and [engine assessment / G0 execution report](engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md), then inspect live refs.


**Codex Cloud 마스터 인수인계 (2026-10-30):** [CODEX_CLOUD_MASTER_HANDOFF_20261030.md](CODEX_CLOUD_MASTER_HANDOFF_20261030.md)는 10월 5일 시작한 프로젝트의 설계·검증·문제·Collector·장기 계획을 새 세션에 전하는 문서다. 최신 실제 코드/테스트 증거는 아래 현행 체크포인트와 원격 브랜치로 재검증한다. ChatGPT 모든 대화 축어록/비밀키/새 권한을 옮기는 기능은 아니다. 이번 변경은 문서 전용이며 P2는 NO-GO 유지.

**Latest local key page:** user explicitly requested a browser input/JSON workflow. `npm run kasi:web` serves a separate loopback-only page; `start-kasi-web.cmd` is the Windows entry (Node 22 required). One typed key, 24-term year or January lunar sample, memory-only request cache, key input clearing, JSON download and stale-input invalidation; no bulk or public deployment. Exact tested SHA **`fbb163334411dbe6d81591123bbe9a5da80f4ca4`**: Node 22.23.3 typecheck/build **325/325 PASS**, original Lab and new synthetic-upstream real Chromium **PASS**. Windows batch/manual assistive tech/live KASI remain UNVERIFIED; no actual key/API call. [Guide](KASI_COLLECTOR_GUIDE.md) · [web report](engineering/KASI_WEB_QUERY_EXECUTION_20261025.md).

**Earlier Collector v0.1 checkpoint:** isolated strict TypeScript CLI under `scripts/kasi/`, with XML/JSON parsing, 1950/2026 sample gates, safe transport, resume/page hashes, atomic private storage, offline validation and JSON/discrepancy export. Exact tested code/test SHA **`fca4267df7329bd20a91bb9ba6f1290870ef5f02`**: Node 22.23.3 typecheck/build, **318/318 PASS** (0 fail/cancel/skip/todo), actual Chromium Lab PASS. New collector regressions 26; existing 292 unchanged. G0/G1-P1/runtime data/UI/engine year coverage unchanged. API keys absent/host restricted: actual CLI probe failed safely, **0 authenticated requests/successes**. Do not claim live 1950 support, pagination, minute schema, original verification or rights. [Ubuntu guide](KASI_COLLECTOR_GUIDE.md) · [exact report](engineering/KASI_COLLECTOR_V01_EXECUTION_20261025.md).

**Collector key configuration:** one ordinary `KASI_API_KEY` is now sufficient for both service requests; nonblank service-specific variables optionally override it. Each service still needs its own utilization approval. No fallback to another key on request rejection. Actual key availability/value was not inspected in this correction, and no authenticated call was made.

**Next Collector unit:** run 1950/2026 probe with separately approved keys/network, inspect real fields/precision/pages, then complete and validate both sample years before explicit bulk permission. Do not wire results into the engine or resume P2. DOCX source guide retrieval and real JSON/month pagination/KST behavior remain unverified. Collector range 1950–2027 is not supported birth-year promotion.

**Earlier G1-P1 checkpoint:** Codex fetched and fast-forwarded the clean approved work branch to **`9916d6cae8c7fd4ecb2d57818c55a96043d49116`**, including P1 implementation `4efa763edab36b5386a5d51ee2c838e131f90694`. On that exact checkout, Node 22 `npm ci`, full `npm run check` **292/292**, and actual Chromium Lab EP0–EP4 all **PASS**; failure/cancel/skip/todo all 0. No code repair was needed. This task changes verification documents only; G0, calculation data, UI, coverage and existing tests remain unchanged. [Exact execution and P2 decision](engineering/G1_P1_EVIDENCE_AUDITOR_EXECUTION_20261020.md) · [cumulative journal](DEVLOG.md).

**P2 = NO-GO:** only the execution gate is resolved. P1 remains report-only: 49 solar + 37 lunar rows internally consistent, **0/86 original rows verified**, all three original-document digests `null`, rights `UNVERIFIED`. Keep G1 outside G0 until the original row/edition evidence gate is met. P2 was not implemented. Authenticated R0 API calls remain paused following environment setup problems; this validation did not read keys or call KASI. The owner's reported 15012690 special-day API and its documented `kst` field remain separate from the 15012679 lunar API; live responses are still unverified.


**2026-10-20 added independent public-table comparison:** manually transcribed indexed KASI annual tables for 2025/26/27, compared programmatically with actual GitHub `koreaSolarTermFixtures.ts` and `koreanLunisolarFixtures.ts` at `955a8e389d773005f149e807567c19f4a1b10435`: **49/49 solar event minutes and 37/37 lunar month starts/sizes matched; 0 mismatches**. Web search-index extraction is not downloaded provider original TXT or authenticated file provenance, and page re-open failed (cache miss); keep G1 P1 original rows **0/86 VERIFIED**, origin SHA **0/3**, G1-P2 **NO-GO**. No tests newly run beyond earlier reported 292/292 exact checkout. [Detailed differential](research/G1_PUBLIC_KASI_WEB_TABLE_RECONCILIATION_20261020.md). **Next:** in functioning execution environment identify verified KASI annual TXT download for three years, record real origin SHA + edition + row mapping or precise failure; API key not required.

## Active refs / exact verified code

- Repository: `kwh01116-cmd/Manseryeok-engine`; approved branch: `agent/m1-applied-jie-slice1-20261019`.
- Collector work started from freshly fetched local/remote `59088a886f9713aa05b5043aa696ad40cb8a412f`. A later docs-only commit changes HEAD again; **re-fetch**.
- G0 historical implementation: `0bbaf47d1e91e2ce4e9af5790bd6cca6c0a9adf2`, regression commit `0eb277645b7e87915c9dd6d68172a7d0516cce40`. Latest full-tested code/test checkout including Collector web page: **`fbb163334411dbe6d81591123bbe9a5da80f4ca4`**.
- On that exact tree: fresh Node **22.23.3**, npm **10.9.9**, TS **5.8.3**; `npm ci`, `npm run check` **325/325 PASS**, 0 fail/cancel/skip/todo; actual Chromium **154.0.8037.57** Lab EP0–EP4 smoke **PASS**. Documentation successor is not a new code-test execution.
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

1. **G1-P2 NO-GO / next evidence unit:** P1 report-only manifest/auditor is implemented and exact-checkout regression-tested. Obtain/compare original row locations, editions, values, precision and lawfully acquired original-document fingerprints for the current 49 solar/37 lunar corpus. Keep every unresolved row unverified; do not infer original-row authentication from page metadata or the repository hash. Reassess P2 only after that evidence gate. Preserve event-vs-corpus sources, candidate isolation and one M1 path; no year/UI expansion.
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
