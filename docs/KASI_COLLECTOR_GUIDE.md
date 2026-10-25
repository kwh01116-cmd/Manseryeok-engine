# KASI Data Collector v0.1 — Ubuntu 실행 가이드

Collector는 기존 명식 엔진과 **분리된 연구용 데이터 수집기**다. `scripts/kasi/`의 TypeScript를 `.kasi-build/`로 빌드한다. API 자료를 수집해도 기존 fixture, G0/G1-P1, UI 또는 기본 지원 출생연도(2026–2027)를 바꾸지 않는다. Collector의 1950–2027 조회 범위는 엔진 지원 연도가 아니다.

## 1. 준비

Ubuntu에서 **Node 22.23.3 권장**(새 HTTP 의존성의 최소 버전 22.19.0), npm과 Git이 필요하다. 저장소의 승인된 작업 브랜치를 사용한다.

```bash
node --version
npm ci
npm run check
```

키는 두 서비스 각각의 활용 승인을 받은 뒤 환경변수로 제공한다. 기존 `KASI_API_KEY`로 자동 대체하지 않는다. 키를 명령행 인자·파일·Git·채팅에 넣지 않는다. Bash에서 값이 화면/명령 이력에 나오지 않게 입력하는 예:

```bash
read -rsp '특일 API 키: ' KASI_SPCDE_API_KEY; printf '\n'
export KASI_SPCDE_API_KEY
read -rsp '음양력 API 키: ' KASI_LUNAR_API_KEY; printf '\n'
export KASI_LUNAR_API_KEY
```

일반 키와 URL 인코딩 키 모두 한 번만 URL 인코딩한다. 키 값/일부 문자열/키 포함 URL은 출력하지 않는다. 자격이 없는 서비스는 별도 실패한다. HTTPS만 사용하며 리다이렉트하지 않는다. `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` 및 `NODE_EXTRA_CA_CERTS`를 사용하는 환경은 상속된 설정을 보존한다. 네트워크 정책에서 **apis.data.go.kr:443** 접근을 허용해야 한다. TLS 검증을 끄지 않는다.

## 2. 먼저 표본 지원/스키마 확인

```bash
npm run kasi:probe -- --years 1950,2026
# 한 서비스의 승인만 시험할 때
npm run kasi:probe -- --years 1950 --service solar
```

`probe`는 두 연도에 대해 태양 절기 24건과 **1월 음양력 전체 일자**를 조회한다. 1월 검사는 연간 지원을 증명하지 않으며 출력 `yearComplete`는 항상 false다. `kst`가 없거나 공백이면 DAY 정밀도/null로 남기고 `SAMPLE_DATE_ONLY` 및 종료 코드 1을 준다. 비정상 HHmm(예: 2400, 1260, 120)는 거부한다. 실제 0000을 받은 경우만 00:00이 될 수 있다.

월 단위 조회나 페이지 메타데이터가 실제 응답과 맞지 않으면 실패한다. JSON 요청은 선택사항:

```bash
npm run kasi:probe -- --years 1950,2026 --format json
```

기본은 XML이며 JSON도 파싱한다. `requestedFormat`과 `actualFormats`를 구별한다. JSON 요청에 XML이 반환돼도 JSON 지원을 확인했다고 말하지 않는다. 오류를 숨기기 위해 형식/서비스/키를 자동 교체하지 않는다.

## 3. 두 표본 연도의 완전 수집·검증

```bash
npm run kasi:collect -- --years 1950,2026
npm run kasi:validate
npm run kasi:export
```

각 연도에서 절기 24개와 양력 365/366일을 모두 모은다. 월별로 `solYear`, `solMonth`, `pageNo`, `numOfRows=100`을 보내고, 응답의 페이지 번호·크기·총건수·각 페이지 길이·날짜 범위를 검사한다. 서버가 pagination을 무시하거나 일부 일자만 주면 완료되지 않는다. 월 조회/페이지네이션의 실제 지원은 인증된 probe/collect로 확인해야 하며 문서의 예시 totalCount만으로 가정하지 않는다.

월 조회가 실제로 불가능한 서비스 환경에서는 **명시적으로** 일별 모드를 선택할 수 있다:

```bash
npm run kasi:probe -- --years 1950,2026 --lunar-mode daily
npm run kasi:collect -- --years 1950,2026 --lunar-mode daily
```

일별 모드는 1월 1일을 probe하고 collect에서 모든 실제 양력 일자를 `solDay`로 요청한다. 호출 수가 크게 늘므로 운영 계정 quota를 먼저 확인한다. 모드/형식은 수집 도중 바꾸지 않는다. 변경이 필요하면 기존 비공개 수집 디렉터리를 따로 보존하고 새 수집을 시작한다. 캐시/완료 파일이 다른 설정과 충돌하면 자동 덮어쓰지 않는다.

**전체 범위 수집은 위 두 표본의 연간 완료 파일을 오프라인 재검증한 뒤에만 가능하다.** 기본 목표 명령에는 추가 명시 옵션이 필요하다:

```bash
npm run kasi:collect -- --from 1950 --to 2027 --allow-bulk
npm run kasi:validate
npm run kasi:export
```

이 옵션이 없거나 1950/2026 표본이 미완료/변조되었으면 대량 요청을 시작하지 않는다. 이번 개발 작업에서는 위 대량 명령을 실행하지 않았다.

## 4. 재개, 저장 및 실패

저장 위치는 고정된 **`.private/kasi/`**이며 전체가 `.gitignore` 대상이다. CLI에는 공개 경로로 원본을 쓰는 옵션이 없다.

- `raw/<SHA-256>.body`: 키가 없는 성공 응답의 원문 UTF-8 entity. HTTP 압축 해제 후 bytes의 SHA이며 HTTP 압축 프레임의 SHA는 아니다. 잘못된 UTF-8은 거부한다.
- `pages/*.json`: 안전한 숫자 query·서비스 ID/operation·요청 UTC 시각·실제 필드 스키마·응답 SHA. 인증 URL/키/오류 메시지는 저장하지 않는다.
- `years/<year>.json`: 모든 자료가 검증된 경우에만 생성되는 연간 정규화 파일. 절기 정밀도가 부족한 연도도 완료 처리하지 않는다.
- `plan.json`: 가장 최근 collect 요청 범위/형식/모드. 해당 범위가 `validate`와 `export`의 기본 대상이다. 요청 범위를 바꾸면 이전 미완료 범위의 성공을 뜻하지 않는다.
- `probes/`: 표본 결과/안전한 실패 코드. `export.json`: 오프라인 재검증을 통과한 연간 JSON. `discrepancies.json`: 선택적 비교 결과.

모든 요청은 직렬이며 최소 350ms 간격, 10초 타임아웃, 네트워크/타임아웃/일부 HTTP 오류에 최대 2회 재시도(총 3회)한다. API 내부 오류는 HTTP 200이어도 실패하며 원문 오류는 내보내지 않는다. API quota 오류는 성공으로 바꾸지 않는다.

페이지마다 임시 파일→fsync→rename→디렉터리 fsync로 저장하고 파일 권한은 0600, 새 디렉터리는 0700이다. 완료 파일보다 페이지 체크포인트를 먼저 기록한다. 중단 후 **같은 collect 명령**을 다시 실행하면 SHA/schema/query가 맞는 페이지만 재사용하며 빠진 페이지를 요청한다. 완료 연도는 원문까지 오프라인 재검사하고 재요청하지 않는다.

별도 lock으로 동시 수집을 막는다. 종료된 PID의 stale lock은 재개 시 회수한다. lock 자체가 비정상 JSON인 경우에는 살아 있는 수집 프로세스가 없는지 확인한 뒤 lock만 점검한다. 지문 불일치/손상 캐시는 자동 교체하지 않는다. 원본을 보존하고 원인을 확인한 뒤 명시적으로 격리해야 한다. 부분 자료는 성공으로 export하지 않는다.

종료 코드 0은 지정 범위의 **구조/완전성 검사 통과**다. 그 외는 1이다. 전체 수집 도중 실패하면 이미 저장된 페이지와 연도는 남고 전체 작업은 실패로 끝난다. `validate`는 인증키/네트워크를 사용하지 않고 원문→페이지→정규화 파일을 다시 대조한다.

## 5. 정규화 및 G1 의미

- `kasi-collector-year-v1`: 소스 receipt와 정규화 SHA를 포함한 독립 계약. 엔진 DTO로 자동 승격하지 않는다.
- 절기: 명칭·양력 날짜·HH:mm 또는 null·정밀도·실제 황경(있을 때만). 역사 시각은 `API_KST_AS_PUBLISHED` / `NOT_RESOLVED`다. **1950년대 민간시·UTC+08:30·DST를 이 자료로 변환했다고 주장하지 않는다.**
- 음양력: 양력 날짜, `lunarYear`, 월/일, 윤달, 월 크기, API가 준 연·월·일 간지 문자열. 월 판본의 주체를 양력 시작연도로 바꾸지 않고, 간지를 절입 기반 사주 연·월주로 해석하지 않는다.
- `externalOriginalVerification: UNVERIFIED`, `rightsReview: UNVERIFIED`. API 응답을 받았다는 사실은 기존 G1 `ORIGINAL_ROW_VERIFIED`, 연간 TXT 판본 인증 또는 상업 이용권 승인이 아니다.
- 응답 지문, 정규화 지문, query/요청 시각, 실제 XML/JSON 및 header/body/item 필드 목록을 보존한다. API의 별도 간행판본 정보가 없으면 만들어 넣지 않는다. SHA는 로컬 변경 탐지 수단이며 외부 진위 서명이 아니다.

## 6. 연간 TXT 표면과 비교

원본 TXT를 확보·검토한 사람이 별도로 만든 비교 JSON을 `--reference`로 제공한다. 원본 파일이나 전체 표를 저장소에 커밋하지 않는다. 최소 형태(아래 값은 **설명용 합성 예시**):

```json
{"surface":"KASI_ANNUAL_TXT","solar":[{"term":"소한","date":"2026-01-05","time":"01:21"}],"lunar":[]}
```

음력 비교 행은 `solarDate`, `lunarYear`, `lunarMonth`, `lunarDay`, `leap`, `monthDays`를 사용한다.

```bash
npm run kasi:export -- --reference .private/annual-reference.json
```

비교 입력의 SHA와 `REFERENCE_ROWS_ONLY` 범위를 기록한다. API/참조의 시각·날짜·누락/정밀도 차이는 `MISMATCH` 보고서로 남기며 어느 쪽도 보정하지 않는다. MATCH는 제공된 참조 행만의 일치이고 전수 원본 인증이 아니다. v0.1은 TXT 원문 자동 파서나 원본 판본 인증기를 제공하지 않는다.

## 7. 직접 확인한 공식 문서와 미검증 범위 (2026-10-25)

- [15012690 공식 목록/명세](https://www.data.go.kr/data/15012690/openapi.do): XML, 연/선택 월 및 pageNo/numOfRows, 오류 코드·quota, 첨부 특일 활용가이드 v1.4 표시. 텍스트로 열린 기본 operation은 기념일 조회여서 그 스키마를 24절기 전용 스키마로 오인하지 않았다.
- [15012679 공식 operation 명세](https://www.data.go.kr/data/15012679/openapi.do): `getLunCalInfo`, 필수 solYear/solMonth, 선택 solDay, 음력·윤달·월 크기·간지 및 페이지 필드. 첨부 음양력 가이드 v1.1 표시.
- [KASI 자체 OpenAPI 안내](https://astro.kasi.re.kr/life/pageView/31): 두 서비스에 JSON+XML을 표시한다. 포털 XML 표기와 차이가 있어 실제 반환 format을 따로 기록한다. 구 HTTP endpoint 표기를 그대로 사용하지 않고 HTTPS만 사용한다.

공식 공개 웹 명세는 직접 읽었다. 그러나 첨부 DOCX 다운로드는 이 환경의 텍스트 도구에서 실제 파일 링크가 노출되지 않았고, executor의 직접 공식 포털 조회도 실패하여 **가이드 DOCX 원문을 확보·전수 검토했다고 주장하지 않는다**. `kst`/`sunLongitude`의 live schema는 키가 있는 환경에서 재확인할 항목이다.

개발 환경에는 두 서비스 키가 없고 API 호스트도 네트워크 허용 대상이 아니었다. 실제 인증 API 요청/수집 성공은 **0건**, 1950/2026 실제 지원·실제 월 pagination·현재 JSON·kst 반환은 **UNVERIFIED**다. 키 등록을 요구하거나 우회하지 않았다. 합성 응답으로 동작/오류/재개/CLI 경로를 검증했으며 Ubuntu에서는 키와 네트워크 준비 후 probe부터 실행한다. 공개 목록의 이용허락범위 표기는 개별 원문·추출 자료·재배포의 전체 법적 검토를 대신하지 않는다.
