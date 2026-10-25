# KASI Collector v0.1 — 실제 구현·실행 기록 (2026-10-25 KST)

## 출발점과 변경 범위

원격 최신 작업 브랜치 `agent/m1-applied-jie-slice1-20261019`를 fetch하여 깨끗한 로컬을 **`59088a886f9713aa05b5043aa696ad40cb8a412f`**로 fast-forward했다. AGENTS, ROADMAP, DEVLOG, 인수인계, G1-P0/P1 보고서·manifest, 기존 digest 코드/테스트와 새 공개 KASI 표 대조 보고서를 읽었다. 후자의 86행 indexed-web 일치는 원본 파일/판본 인증과 다르다는 결론을 유지했다.

기존 `src/`, G0, G1-P1 코드/fixture, 명식·UI·지원 연도와 기존 테스트를 수정하지 않았다. 새 TypeScript 도구는 `scripts/kasi/` → `.kasi-build/`로 별도 빌드한다. 기존 빌드/타입 검사 뒤에 Collector strict TypeScript 검사를 추가했다. 잠금 의존성은 XML 파서 `fast-xml-parser` 5.11.2, 프록시/TLS를 상속하는 HTTP `undici` 8.12.3, Node 22 개발 타입이다. 유료 서비스나 엔진 API 통합은 없다.

## 구현된 독립 단위

- `schema.ts`: XML/JSON envelope·페이지·실제 필드 목록, 단일/복수 item, API 내부 오류, 24절기 명칭/수/정렬/날짜/황경, HHmm/null 정밀도, 양력 전 일자, 음력 윤달/연도/월 크기/연속성, 간지 원문, 별도 TXT 참조 비교. 날짜 전용 응답을 분 단위 완료 데이터로 승격하지 않는다.
- `collector.ts`: 두 서비스/키 분리, 고정 HTTPS endpoint, proxy/CA 상속, redirect 금지, 10초 timeout, 최대 2회 재시도, 직렬 350ms 제한, 2MB 응답 한도, 키/인코딩된 키 echo 차단. 페이지별 raw SHA와 안전한 receipt, fsync/rename 원자 저장, 파일 0600/새 디렉터리 0700, 동시실행 lock·종료된 PID 복구, 누락 페이지만 재개, 원문 재검증 후 연도 완료 파일/오프라인 validate.
- `cli.ts`: `probe`, `collect`, `validate`, `export`; service/연도/형식/일별 모드의 명시 선택. 1950·2026 표본 연간 완료 파일을 검증하고 `--allow-bulk`를 선택해야 다른 연도 범위를 시작한다. 내부 테스트 transport 주입만 있고 CLI에 mock 성공/자격 우회 플래그는 없다.
- `.private/kasi/` 전체 ignore: 원문/체크포인트/연간 자료/계획/비교/JSON export. `.env*`, `.kasi-build/`도 ignore. raw/인증키/수집 데이터는 이번 커밋에 없다. Ubuntu 명령·제약·재개 절차는 [실행 가이드](../KASI_COLLECTOR_GUIDE.md).

정규화 데이터는 엔진 DTO와 별도인 `kasi-collector-year-v1`이다. 서비스 ID/operation, query/UTC 요청 시각, 실제 format 및 header/body/item 필드, 응답 SHA-256, 정규화 SHA-256과 범위를 기록한다. 응답 SHA는 HTTP 압축을 해제한 유효 UTF-8 entity의 지문이다. `externalOriginalVerification`/`rightsReview`는 모두 `UNVERIFIED`로 고정한다. API 표면과 연간 TXT를 동등한 원본으로 취급하지 않고, 선택한 참조 행과의 값/정밀도 차이는 보고서로 남긴다. 참조 입력의 출처 진위는 인증하지 않는다.

1950–2027은 **Collector query 범위**이며 만세력 엔진 지원 범위가 아니다. 역사 자료 시각은 `API_KST_AS_PUBLISHED` / `NOT_RESOLVED`로 보존하며 1950년대 법적 표준시/DST로 변환하지 않는다.

## 공식 문서 확인과 환경 제약

[15012690 포털](https://www.data.go.kr/data/15012690/openapi.do), [15012679 operation 명세](https://www.data.go.kr/data/15012679/openapi.do), [KASI 자체 OpenAPI 안내](https://astro.kasi.re.kr/life/pageView/31)를 직접 읽었다. 포털은 XML, KASI 자체 안내는 JSON+XML을 표시한다. 월/선택 일 및 페이지 필드를 확인했지만 현재 포털의 기본 특일 operation은 기념일이므로 그 응답을 24절기 응답으로 오인하지 않았다. 첨부 활용가이드 v1.4/v1.1의 파일명은 확인했으나 텍스트 도구에서 다운로드 링크 대신 아이콘만 열렸고 executor의 공식 포털 직접 조회도 불가했다. **DOCX 원문 다운로드·전수 검토 및 live schema 검증은 미완료**다. 구현은 알려진 필드를 검사하고 지원되지 않는 실제 응답을 추정/보정하지 않고 실패시킨다.

현재 실행환경의 두 전용 키 설정 여부만 bool로 점검했고 둘 다 미설정이었다. 실제 값/부분 문자열/환경 전체를 출력하지 않았다. API host도 enforced 네트워크 허용 목록에 없었다. 따라서 **인증 API 요청 0건, 실제 수집 성공 0건**, 실제 1950/2026 서비스 지원·월 pagination·JSON·kst 정밀도는 UNVERIFIED다. 키 등록을 요구하거나 네트워크 정책을 우회하지 않았다.

## 실제 검증

실행자는 이 작업의 Codex다. 예전 임시 Node 22 경로가 없어서 공식 22.23.3 archive를 내려받아 공식 SHASUMS256와 대조 후 설치했다. 최종 의존성 설치/TypeScript/Node/CLI/브라우저는 Node 22로 수행했다.

**정확한 최종 코드/테스트 SHA: `0c60b0c627e6783bdb56c39e950ebad64b7cd54a`.** 문서 전용 후속 SHA와 구분한다.

| 검사 | 결과 |
| --- | --- |
| Node/npm/TS | **22.23.3 / 10.9.9 / 5.8.3** |
| `npm ci --no-audit --no-fund` (작업 캐시 사용) | PASS, 잠금 의존성으로 재설치 |
| Collector 집중 모의 테스트 | **22/22 PASS** |
| `npm run check` | 엔진 및 Collector typecheck/build **PASS**, **314/314 Node PASS**, fail/cancelled/skipped/todo 각 **0** |
| `node scripts/browser-smoke.mjs` | 실제 **Chromium 154.0.8037.57**, 기존 Lab EP0–EP4 **PASS** |
| `npm run kasi:probe -- --years 1950,2026` | 실제 CLI 실행, **예상 종료 1**, 네 개 서비스/연도 조합 모두 해당 키 미설정 코드. 성공/연간 완료 주장 없음 |
| `npm run kasi:collect -- --from 1950 --to 2027` | 실제 대량 guard 부정 검사, `SAMPLES_AND_ALLOW_BULK_REQUIRED` 종료 1; 대량 API 요청은 시작하지 않음 |
| `.gitignore` / 변경 범위 | private raw/build/env ignore 확인; G0/G1-P1/계산 fixture/브라우저/UI 변경 없음 |

314개는 기존 292 + 신규 22이며 기존 테스트는 삭제·완화·수정하지 않았다. mock 데이터는 합성 달력이며 실제 KASI/역법 oracle이 아니다. 모의 CLI에서는 1950/2026 probe → 표본 연간 collect → 키 없는 offline validate → JSON export → TXT 불일치 보고 → 재실행 시 네트워크 재요청 없음까지 실행했다. 정상 mock 검사는 통과했고, 인증키 미설정과 무승인 대량 수집은 의도된 안전 실패다.

모의 검사 범위: XML/JSON/단일·배열 item, malformed XML/DTD, 24절기 누락/중복, 공백/누락/이상 kst, HTTP/API 내부/네트워크 오류, 유한 timeout·retry·속도 제한, 페이지 누락/반복/total 변경, 윤달·음력 연도 경계·양력 윤년, 중단 후 cache 재개, 일별 모드, 원문/정규화/receipt 지문 변조, lock/원자 쓰기 실패 시 이전 파일 보존, 키 인코딩/JSON·XML escape echo/로그 오류 비노출, 샘플 gate, CLI 잘못된 인자 및 export 비교.

브라우저 검사 통과는 UI 변경을 뜻하지 않는다. 실제 VoiceOver/NVDA, 외부 역법 전수 대조, 원본 판본 및 상업 이용 권리는 검증하지 않았다. 새 런타임 의존성에 대한 개발 당시 `npm audit --omit=dev`는 알려진 취약점 0건을 반환했으며 외부 보안 감사를 의미하지 않는다.

## 커밋과 다음 단계

- 코드: **`da255784f76840a7763fc9b70b59bc0fe456d785`**.
- 테스트: **`0c60b0c627e6783bdb56c39e950ebad64b7cd54a`** (정확한 최종 전체/브라우저 검사 대상).
- 문서 후속: 가이드·본 보고서·DEVLOG·인수인계·로드맵. 문서 SHA는 Git 이력/최종 결과에서 확인한다.

워크플로를 확인하면 foundation 선택 경로 Push만 트리거한다. 검증된 변경만 현재 작업 브랜치에 일반 fast-forward Push하고 원격 HEAD/보호 브랜치를 재확인한다. Actions dispatch/run, main/foundation 변경, force push, PR merge, 공개 배포는 하지 않는다.

**다음:** 실제 두 서비스의 승인/네트워크가 있는 Ubuntu에서 1950/2026 probe를 수행해 응답 필드·페이지 계약·실제 정밀도·기준시각을 확인한다. 불일치가 있으면 raw를 보존하고 좁게 parser 계약을 수정/회귀 검증한 뒤 두 표본 연간 collect/validate를 수행한다. 그 전에는 `--allow-bulk`를 쓰지 않는다. 가이드 원문 및 이용권도 별도로 확인한다. **G1-P2는 계속 NO-GO**이며 API 수집 사실만으로 기존 원본 행 인증을 승격하지 않는다.

## 2026-10-25 추가 정정 — 일반 인증키 하나 지원

사용자가 일반 인증키 하나를 사용한다고 정정해, CLI는 **공통 `KASI_API_KEY`**를 두 서비스에 제공하도록 수정했다. 비어 있지 않은 서비스별 환경변수는 해당 서비스에서만 우선한다. 키를 두 개 발급받아야 한다는 의미가 아니며, 두 endpoint의 활용 승인 범위는 별도다. 요청 거부 후 다른 키로 자동 전환하지 않는다. 위 초기 v0.1의 서비스별 키 필수 설명은 이 정정과 최신 Ubuntu 가이드로 대체한다.

- 코드: `366d587cde1f1cfa468796030e01d7df18a07787`.
- 정확한 최종 테스트 SHA: **`fca4267df7329bd20a91bb9ba6f1290870ef5f02`**.
- Node **22.23.3**, TS **5.8.3** typecheck/build, Collector **26/26**, 전체 **318/318 PASS**, fail/cancelled/skipped/todo 모두 **0**.
- 실제 Chromium **154.0.8037.57** Lab EP0–EP4 **PASS**.
- 추가 4개 회귀: 공통 키를 두 endpoint에 전달, 선택적 개별 우선순위, 공백/미설정, 거부된 개별 키에서 자동 fallback·정보 노출 없음. 기존 CLI 자식 테스트의 환경 격리에 공통 변수 제거만 추가하고 기존 assertion을 유지했다.
- 실제 자격 값/가용성은 이번 정정에서 읽거나 출력하지 않았다. 인증 API 호출/새 수집은 **0건**. 테스트에는 합성 키만 썼다. 기존 G0/G1·데이터·UI·연도·P2 및 대량 수집 게이트는 그대로다.

가이드/DEVLOG/현재 체크포인트를 갱신하고 같은 작업 브랜치에 일반 Push한다. 실제 API 응답·원본 판본·권리 미검증 상태는 바뀌지 않는다.
