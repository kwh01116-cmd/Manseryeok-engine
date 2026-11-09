# Manseryeok-engine — engine reliability roadmap

## 2026-11-10 current checkpoint — selectable local API charts implemented

사용자 승인 순서 A→B를 실제 수행했다. A **183878fdfc1cecdd1f133eec41d0e7d978c48f00**에서2026년 API/기존fixture 통합18,240 양·음력 입력쌍·전체403/403·Lab/KASI 실제 Chrome을 통과한 뒤 B를 등록했다. B **6d75f24f7006a9dcabd701c410340d5ced7f1c51**에서 전체408/408·두 브라우저 PASS, 실제13,879일·47,975쌍 전수 내부/기존resolver 대조를UTC와AsiaSeoul에서 각각 통과했고 집계 bytes가 같았다. 원본과 기존후보는 불변, 추가 KASI 요청0건이다.

| 현재 경로/자료 | 실제 범위/상태 |
| --- | --- |
| 기본 엔진·G0 |2026~2027, 기존계약 유지 |
| 선택형 `kasi-api-2026-local-v1` |2026년 시각 포함 양력/음력 명식 실행 가능 |
| 선택형 `kasi-api-1989-2026-local-v1` |양력 환산 `[1989-01-01,2027-01-01)`, 명시 시각·기존4정책 필수 |
| 확보 데이터·연구 날짜 인덱스 |1950~2026, 역사 시각 명식 지원 아님 |
| 보류 |1988출생 DST gap/fold 연결,1950년대 시각/24:00 해석, 범위 밖 경계, 독립 전수 인증·재배포·G1-P2 |

실행은 [로컬 명식 가이드](KASI_LOCAL_CHART_GUIDE.md), 실제 비교·정책·실패·한계는 [A/B 보고서](engineering/KASI_API_LOCAL_CHART_EXECUTION_20261110.md)를 따른다. 다음 최소 연구 단위는1988년DST gap/fold를 기존 시간모듈로 정규화해 API KST와 비교하는 통합 테스트다. 기본 경로 자동 교체·역사시 확대·Story/배포는 이 완료로 승인되지 않는다. 아래 수집/연구어댑터 체크포인트는 당시 기록이며 현재 상태는 이 표를 따른다.

## 2026-11-10 current checkpoint — collected data preserved, research adapter executed

1950~2026 실제 수집은 완료됐다.77년/절기1,848행/음양력28,124행, 원문·receipt1,001개씩을 로컬 원문부터 오프라인 재검증했다. 코드 **fe84ab44ec4cd0efd27fb57c480a2b422d9decbc**에서 전 기간 연결·예외 목록·관측 범위 날짜 인덱스·출처/지문을 가진 비공개 후보2개가 재현됐다. 추가 KASI 요청0건, 원본 전체 지문 불변. 전체 **390/390**, KASI 웹/Lab 실제 Chrome 각각 PASS. 과거380개 실행 기록은 별도 보존한다. [연구용 실행 가이드](KASI_RESEARCH_ADAPTER.md) · [실행·실패·제한](engineering/KASI_RESEARCH_ADAPTER_EXECUTION_20261110.md).

윤달 월간지 null816행/28그룹,24:00 검토1행, 황경 미제공1,392행, 양끝 부분 월2개를 보존했다. 역사 시간/UTC/권리/TXT 원본 인증과 G1-P2 NO-GO는 열려 있다. 기본 엔진 지원연도와 production/Lab/G0 진입점은 그대로다. 다음 최소 통합 단위는 **2026년만 기존 계산기에 API 절기 후보를 주입하는 별도 연구 통합 테스트**다. 추가 수집을 먼저 반복하지 않는다. 이후 필요 시 boundary-requirements에 근거해1949말/2027초 최소 증거만 별도 검토한다.

아래 수집 준비·미실행 문구는 각 당시의 역사적 계획/실행 기록이며 현재 완료 상태는 위 체크포인트를 따른다.

**2026-11-09 local acquisition update:** user requested a 1950–2026 local collection system. Reused the existing Collector in a Windows x64 portable runner, with 1950/2026 complete-year sample gates, explicit 77year request confirmation, resumable private storage and offline export. Code/test **9ad13051**, **362/362 PASS** plus existing Chromium checks; native Windows/live full-range collection unverified. [Guide](KASI_LOCAL_1950_2026.md). Data acquisition is independent of M1 coverage/P2; neither is promoted. Next local unit is the two sample years with actual approved services; no Cloud live diagnosis or bulk requests were executed in preparation.

**Active direction: 2026-10-19 KST.** Engine correctness, provenance, supported coverage, explicit policies and reproducibility take priority until the owner changes direction. EP0–EP4 is **Manseryeok Lab**, an internal calculation/rule verification tool. Preserve its current UI and regression checks. Story App, EP5 UI, characters, webtoon, design concepts and deployment are paused; future product design belongs to a separate Astra task and is not this queue.

Current operational cursor: [EXECUTION_HANDOFF.md](EXECUTION_HANDOFF.md). Stable instructions: [AGENTS.md](../AGENTS.md). Detailed evidence and research gaps: [engine reassessment / G0 report](engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md).

## 2026-11-07 operational update — offline work first

Second review correction: M2 source ID sets no longer compare delimiter-joined strings. Code **72024d521560826cab001591bfc1019b70ba8a5c** rejects merging two IDs into one `|`-joined claim while retaining order independence. Latest full check **352/352**, standalone M2 audit and Lab Chromium PASS. Source records, runtime rules and open evidence gates are unchanged.

Review correction: monthly intake chronology was missing despite the earlier tests passing. Code **52f4ee61126c7462df05ee7089ddaac879b3c6ea** rejects reversed term dates and accepts reordered valid rows. At that SHA, full check **349/349**, Lab and KASI synthetic-upstream Chromium PASS. Existing Collector schema, calendar engine and source/rights gates are unchanged.

Owner paused Cloud KASI diagnosis and will supply locally obtained data. **Do not resume API calls from historical queue entries below.** Offline single-response intake is implemented at `4026bdb7e8c2ae37d3d943726be29539e872e4b4` (335/335 + both Chromium smokes). A bounded M2 policy/source audit is implemented at `03af44ec34489204a36692e8ca509ae03ad24aaa` (**345/345 + Lab Chromium**, M2 audit CLI PASS): 4 policies/9 rules/12 sources linked; 7 native rule version fields missing, editions/rights unverified. It is not a complete M2 registry. Neither tool adds data to the engine or authenticates sources. Next minimal unit: inspect one locally obtained response with its declared scope; actual data/source/rights qualification remains blocked on evidence. [Intake guide](KASI_LOCAL_INTAKE_GUIDE.md) · [M2 audit](research/M2_POLICY_CATALOG_AUDIT.md) · [execution](engineering/OFFLINE_VALIDATION_EXECUTION_20261107.md).

## 2026-10-25 Collector v0.1 — engine-independent acquisition tool

Common ordinary `KASI_API_KEY` now serves both APIs, with optional per-service overrides and separate utilization approvals. Strict TypeScript CLI (`scripts/kasi/`) now implements probe/collect/validate/export with private atomic checkpoints and hashes, bounded transport, explicit month/daily modes and sample gates. Exact tested SHA `fca4267df7329bd20a91bb9ba6f1290870ef5f02`: **318/318 Node**, TypeScript/build and actual Lab Chromium PASS. Existing G0/G1-P1/data/UI/year support unchanged. Actual keys absent/API host restricted; live 1950/2026 schema/pagination/precision and attached DOCX review remain UNVERIFIED. No authenticated collection or bulk request was executed. Next: live two-year probe, validate complete sample years, then explicitly consider bulk. API output stays a separate evidence surface, not ORIGINAL_ROW_VERIFIED or engine year promotion. G1-P2 remains NO-GO. [Guide](KASI_COLLECTOR_GUIDE.md) · [execution evidence](engineering/KASI_COLLECTOR_V01_EXECUTION_20261025.md).

## 2026-10-20 실행 순서 보강 — KASI API 활용, G1, 출생연도 확대

**상태: 계획·자료 명세 검토, 미실행.** 사용자는 KASI 특일 OpenAPI 15012690 인증키를 발급받았다고 밝혔다. 제공된 v1.4 가이드(2020년 개정)에는 \`get24DivisionsInfo\`의 \`dateName/locdate/kst/sunLongitude\` 응답 필드가 명시돼 있다. 특히 **\`kst\` 분 단위 시각 후보**가 있으므로 구문서에 근거한 ‘날짜만 제공’ 가정을 폐기한다. 그러나 라이브 호출과 응답 시각/라이선스의 현재 상태는 **UNVERIFIED**. KASI 음양력 15012679와는 별도 API/권한이다. 상세 결정 배경은 [개발 일지](DEVLOG.md)의 2026-10-20 기록 참조.

**분업:** 이 채팅은 문헌·독립 대조·정책·안전/정확도 결정, 키가 등록된 작업 실행환경은 호출·재현 가능한 수집 스크립트·테스트, Codex는 실제 엔진 구현과 GitHub 전달, Astra는 추후 별도 콘셉트/시장 검증. Work 클라우드 환경 변수는 별도 Codex 런타임에 자동 공유된다고 가정하지 않는다.

| 차례 | 독립 산출물 | 구현/검증 허용 조건 | 금지 또는 보류 |
| --- | --- | --- | --- |
| **R0 (첫 실험)** | 15012690 HTTPS/인증/JSON·XML/연도 페이지 처리/실제 \`kst\`·황경 확인, 2019·2026·2027 응답 스키마 및 2026/27 기존 48개 절기 비교 보고서 | 사용권·응답·출처판본을 기록. 노출 가능한 샘플만 저장하고 **키·전체 인증 URL 출력 금지** | 실사용 API 키/환경 없으면 요청 성공 주장 금지, 기본 fixture 수정 금지 |
| **G1 (현행 코드의 다음 안전 단위)** | 2026/27 절기 각 이벤트와 음력 월→출처/판본/정밀도/지문 검증 계약 및 반례 테스트 | 진짜 원본/판본 근거 확인 후 좁게 구현; 미확인 출처는 UNKNOWN/BLOCKED; 기존 G0 1회 M1 계산 불변 | 모든 행을 ‘KASI 공식 판본’으로 일괄 치환하거나 해시 일치=천문학적 진위로 주장 금지 |
| **Y1 (2025 단일 연도)** | 2024 대설 guard, 2025 절기 24개, 2025 연초 음력 공백 보완, 말단 경계·윤달·일주·시각 오라클 | NAOJ/독립 천문 계산 등 다른 생성 계열과 차이 보고; 권리 별도 검토; 전체 Node/Chromium 통과 후 범위 승격 | 1989~2025 전면 확장 일괄 Push 금지 |
| **Y2 (1989~2024 현대 범위)** | 연도별 지원 증거/누락·차이 레지스터, 재현 가능한 fixture 생성기, 경계·음력 oracle | Y1의 검증 게이트를 각 구간에 반복; 1987/88 DST는 현대 1989+와 분리 | 자료가 있다고 무검증으로 지원 선언 금지 |
| **H1 (역사 시간)** | 법령 원본+IANA 버전 비교, 표준시/DST gap/fold와 정책 차이 테스트 | 실제 생년 기록의 민간시와 UTC/태양시 정책을 구별 | 단일 UTC+9 역투영·임의 진태양시 보정 금지 |
| **M2/M3+** | M2 원전/학파별 명시 정책과 독립 사례, M3–M8 소스 게이트/계산 명세 | 학파/원전의 공백 해소 후 좁은 resolver 구현 | 예측 타당성 주장, 자동 신강/용신/길흉 단정 금지 |
| **Integration** | 변하지 않는 버전형 계산·근거 API, 샘플 데이터/오류 계약 | 각 범위의 데이터권리·개인정보·공개 보안/QA 별도 승인 | Story UI/EP5와 Astra 콘셉트 작업을 엔진 작업에서 시작하지 않음 |

**완성도 판정:** 테스트 그린만으로 완료라 하지 않는다. 기능별로 ① 계산 및 반례 테스트 ② 사용 연도/경계 연속성 ③ 독립 대조/불일치 해석 ④ 출처·판본 및 사용 권리 ⑤ 불확실성·정책 표현 ⑥ 안정적 계약을 구분하여 승인한다. **R0는 G1 설계의 실증 자료로 먼저 수행 가능하며, G1 구현은 R0가 준비될 때까지 판본을 지어내지 말고 출처 검토부터 한다.** 1989~2025 연도 확장은 제품 출시 보증이 아니다.


**2026-10-20 priority adjustment:** API setup was blocked by cloud-environment save/publish errors. Owner chose to **pause authenticated R0 API calls** and do independent engine work. **G1-P0 existing-corpus source audit is now completed as documentation only.** The key finding is that 49 solar events carry one KASI source ID but no per-event edition, while the 37 lunar month starts carry only corpus-wide annual \`sourceEditions\`; \`annualCalendarEditions\` in G0 comes from the lunar corpus. See [G1-P0 audit](research/G1_EVENT_MONTH_EDITION_EVIDENCE_AUDIT_20261020.md). Newly checked public indexed KASI pages expose 2025/26/27 V1.0a generation metadata, but no authenticated API, original TXT hash, complete 86-row fresh verification or new \`npm run check\`. **Next step: G1-P1 report-only immutable edition-evidence manifest + tamper tests, keeping unknown rows UNVERIFIED.** Integrating it into G0 is a separate gate. R0 may resume later when the execution environment is operational; it is no longer a blocker for P1 research or scaffolding. This supersedes the immediately preceding “R0 first” operational order only; all release and accuracy gates remain.

**G1-P1 checkpoint 2026-10-20 — exact checkout verified:** the report-only auditor/49-solar + 37-lunar manifest and 9 regression groups were pushed in [4efa763](https://github.com/kwh01116-cmd/Manseryeok-engine/commit/4efa763edab36b5386a5d51ee2c838e131f90694). Earlier reconstructed-data checks are historical evidence. Codex now tested exact work-branch HEAD **`9916d6cae8c7fd4ecb2d57818c55a96043d49116`**: Node 22.23.3 fresh `npm ci`, typecheck/build/full **292/292 Node PASS** (0 fail/cancel/skip/todo), actual Chromium 154.0.8037.57 Lab **PASS**. No execution failure or code repair. **P2 integration = NO-GO:** 0/86 original rows verified, all three original-document SHA values null, rights UNVERIFIED. Software gates passed; original row/edition evidence did not. Next: obtain/verify that evidence before a separate P2 reassessment. No G0/data/UI/coverage change or P2 implementation. [Execution addendum and decision](engineering/G1_P1_EVIDENCE_AUDITOR_EXECUTION_20261020.md).


**G1-E0 source check (2026-10-20, docs-only):** the search-index-visible KASI 2025/2026/2027 annual tables were hand-transcribed independently of repository code and compared with 49 solar + 37 lunar fixture rows: **86/86 matched (no differences)**. Evidence class `PUBLIC_INDEXED_WEB_TABLE_RECONCILED`, *not* `ORIGINAL_ROW_VERIFIED`; original TXT SHA **0/3**, strict original-row proof **0/86**, commercial rights unreviewed. G1-P2 stays **NO-GO**. Before any G1/P2 source promotion, fetch/verify actual KASI TXT for 2025/26/27, pin origin SHA and row/edition locations, and review rights; if unavailable, document failure rather than manufacture checksums. [Read full caveats](research/G1_PUBLIC_KASI_WEB_TABLE_RECONCILIATION_20261020.md).

## Completion criteria

A feature is assessed along separate axes: (1) implemented algorithm and adversarial tests, (2) traceable source/edition and field-level use rights, (3) independent external numerical/textual comparison, (4) finite supported coverage and explicit ambiguity/policies, (5) immutable/reproducible API contracts. Passing tests demonstrates the encoded behavior; it does **not** establish external calendar truth, textual authenticity, scientific predictive validity or commercial permission. No aggregate completion percentage is used.

- **IMPLEMENTED_AND_TESTED:** executable, scoped behavior verified in the exact checkout; external limitations still stated.
- **PARTIALLY_VERIFIED:** working components exist, but required external evidence, coverage or policy gates remain open.
- **RESEARCH_ONLY:** sources/specifications/test-only corpora exist without promotion to the supported runtime.
- **BLOCKED_BY_SOURCE_OR_POLICY:** no executable promotion until the identified source/dispute is resolved.
- **NOT_IMPLEMENTED:** no executable feature; a backlog title is not an implementation.

## Current M1–M8 assessment

| Milestone | Overall status | Actual scope and evidence | Unclosed gate |
| --- | --- | --- | --- |
| M1 modern calendar / Four Pillars | **PARTIALLY_VERIFIED** | 2026–2027 default Gregorian/lunar, explicit day/hour policies, minute Jie trace and correlated candidates; all 48 2026/27 term dates match pinned KASA day witnesses, all 48 minutes match independently transcribed NAOJ tables | Modern lunar independent daily oracle, minute rounding/seconds, per-field source rights, broader years and historical-time integration |
| M2 deterministic facts | **PARTIALLY_VERIFIED** | v1/v2/v3, one named profile each; hidden stems, ten gods, twelve stages, raw pairs and triad membership; 10×12/12×12/12⁴ finite tests | Critical editions, alternate school profiles, four-member earth-group decision and source-policy registry completeness; membership never establishes efficacy |
| M3 strength evidence | **BLOCKED_BY_SOURCE_OR_POLICY** | Decision spec and counterexamples only; no strength resolver | 月令/司令/root/activation/weights/precedence require independently reviewed school-specific rules |
| M4 pattern engine | **BLOCKED_BY_SOURCE_OR_POLICY** | Ordered pattern/topology requirements only; no resolver | Source-edition-specific formation/break/rescue/相神 cases and exception precedence |
| M5 useful-god / climate views | **BLOCKED_BY_SOURCE_OR_POLICY** | Separate structural/balancing/climate/medicine/bridging concepts, no resolver | Critical texts, commentary variants, conflicting recipes, explicitly separate policies |
| M6 follow / transformation | **BLOCKED_BY_SOURCE_OR_POLICY** | Requirements only; no classifier | True/false/disputed structures and activation conditions; raw 合 is insufficient |
| M7 Da-yun / Liu-nian | **RESEARCH_ONLY** | Boundary/arithmetic requirements, no executable start-age/direction/overlay | Direction policy, twelve-Jie definition, proportional age convention, precision and independently published witnesses |
| M8 supplementary / Korean practice | **NOT_IMPLEMENTED** | Backlog requirement only; no executable compatibility/Shen-sha profile | Named Korean sources/practices, editions, exceptions and independent reviewers |

Implemented finite M1/M2 subfeatures and G0 are **IMPLEMENTED_AND_TESTED within their stated scope**, not full milestone completion. Research 2000 is **RESEARCH_ONLY** despite runtime tests. Standalone historical base offsets/1987–88 DST have tests; the combined historical birth calculation is not supported. See the detailed report for file-level evidence.

## Ordered development queue

### 1. M1/M2 trust boundary and data provenance

**G0 completed:** server-selected fixture/manifest/annual-edition context, one M1 execution receipt, exact candidate/source/policy/schema verification and trusted M2 v1/v2/v3 entry points. Generic adapters retain structural-only guarantees. Tested code/test SHA: `0eb277645b7e87915c9dd6d68172a7d0516cce40`, Node 22 full **283/283**. Actual Lab Chromium remains required.

**Next independent unit G1:** versioned event/month-to-edition provenance manifest and repository fingerprint validation for the current corpus; retain event-specific evidence separately from the corpus source union. Link the existing fixture digest pins and edition records without claiming a cryptographic fingerprint authenticates an external publication. No new dates, no astronomical algorithm, no UI. Before implementation, verify the original metadata for each row/year; unresolved metadata stays blocked rather than inferred.

Exit: negative tests for unknown/wrong known source, edition, digest, manifest, corpus and candidate; mutation/serialization behavior specified; no M1 rerun or silent repair. Source rights are a separate gate.

### 2. Modern supported-year expansion and independent calendar comparison

Start with **one adjacent modern year**, provisionally 2025, only after its source packet is qualified. It requires the **2024 Daxue guard**, 2025 full 24 terms, late-2024 lunar boundary through 2025/26, end-exclusive witness and edition/rights review. The current 2025–2027 lunar corpus alone cannot serve January 1–28, 2025 or establish all-year Four Pillars.

Compare with independently published KASA/KASI/NAOJ witnesses at their actual precision and an independently pinned daily lunar oracle. KASI daily lunar API is a candidate only: no authenticated call/source integration exists and it does not supply proven minute-level solar terms. Prefer offline/build-time evidence, not per-user external calls. Consider documented independently licensed ephemerides/time scales only after precision/rounding policy is settled. Record disagreements rather than averaging or substituting sources.

Exit: full-year + guard + lunar wrap, all Jie minute ±1, 23:00/00:00 policies, leap dates/months, independent differentials, fail-closed coverage and full checks. Do not change default coverage while any gate is open. Test-only 2000 stays isolated.

### 3. Korean historical standard time, DST and time policies

Keep civil-time reconstruction separate from Myeongli time choice. Existing base-offset periods begin 1908-04-01; standalone 1987/88 DST rejects gaps/folds, but neither is wired into the modern composer. Research 1950 has a legal-text witness; it is not executable. Remaining 1948–51/1955–60 transitions and pre-1908 records require primary decrees and pinned IANA comparison, not a year-only DST list.

Exit: exact legal transition instants, explicit gap/fold choice, independent UTC/civil tests, source-tagged normalization and no retroactive UTC+9 assumption. Mean/apparent solar time requires independent longitude/equation-of-time methods and explicit policies; no true-solar-time boolean or silent adjustment.

### 4. M2 school-policy and source precision

Audit source/rule/version registry entries and two independently digitized critical editions. Preserve classical vs modern sources, MAIN_QI order vs membership, directed/reciprocal/self 刑 and simultaneous overlaps. Review a second profile only when real sources justify it. Keep 辰戌丑未 four-earth, half-group activation, combination transformation and seasonal hidden-stem weights out of executable facts until separately qualified.

Exit: explicit preconditions/exceptions/disputes, exact per-fact citations, independent table oracles and alternate-policy counterexamples. No strength or auspiciousness inference from raw membership.

### 5. Independent interpretation research (M3 first; M4–M8 remain gated)

Pin source editions/passages and distinguish base text, commentaries and modern/Korean practice. Develop independent positive/negative/counterexample cases before resolver code. Keep 月令, roots, 司令, twelve-growth convention, activation and exception precedence separate. No ad-hoc coefficient model, personality/fortune output or useful-god selection.

Exit: named school profiles, independently reviewed text-to-rule mapping, conflicting cases and refusal semantics. Software adherence to a tradition never establishes real-world predictive validity.

### 6. Stable reusable engine API

After source/policy boundaries stabilize, define immutable versioned DTOs with candidate identity, source/edition, coverage, precision, rule/policy versions, failure reasons and invalidation. Document generic vs trusted entry points. Receipts are in-process capabilities, not serialized signatures. Keep the Lab as a regression consumer. Future Astra product design may consume the verified engine through a separately authorized integration; no current UI migration or public service is scheduled.

## Delivery and current restrictions

Each narrow executable unit: counterexample → implementation → Node 22 TypeScript + full `npm run check` → relevant actual Lab Chromium → independent code/test/doc commits → ordinary fast-forward push only to `agent/m1-applied-jie-slice1-20261019`, after workflow inspection. No Actions, force push, main/foundation update, merge, public deployment, personal-data storage or paid service. Do not implement an unsupported feature merely to fill the roadmap.

The complete previous roadmap is preserved verbatim in [the historical roadmap archive](archive/ROADMAP_BEFORE_ENGINE_FOCUS_20261019.md). Its Story/UI queue and unattended priorities are superseded by this engine-first direction; old test claims remain dated historical evidence.
