# 로컬 KASI 응답을 오프라인으로 인계·검사하기

이 경로는 **이미 로컬에서 받은 응답 파일 한 장**을 읽는 검수 도구다. API 키, 네트워크, Collector 캐시가 필요하지 않고 API 호출·수집·엔진 fixture 변경을 하지 않는다. 사용자가 로컬에서 성공했다고 보고한 것과 이 도구가 응답 구조를 확인한 것은 별개다.

## 입력 준비

1. 로컬에서 받은 성공 응답의 XML 또는 JSON envelope (`response.header/body`)를 비공개 위치에 둔다. 저장소 안이라면 ignore된 `.private/incoming/`을 사용한다.
2. 키, 인증 URL, HTTP 요청 헤더, 개인정보, `.env`, 실행 코드·ZIP을 전달하지 않는다. 출생정보가 아니라 공개 달력 API 응답만 대상으로 한다. 원문을 공유하기 전 별도 검토가 필요하다.
3. 요청한 서비스, 연도, 월/일 범위를 함께 알려준다. 조회 시각과 수집 프로그램 버전은 별도 비밀 없는 메모로 남기되, 이 도구는 그 주장을 인증하지 않는다.
4. 기존 로컬 웹의 정규화된 다운로드 JSON, 연간 export, CSV, ZIP은 이번 v1 입력 형식이 아니다. 임의 변환하거나 코드로 실행하지 않고 원래 응답 envelope를 별도로 제공한다.

## 실행 — Node 22, 설치된 잠금 의존성 사용

```bash
# 절기 한 연도 응답 한 장
npm run kasi:intake -- --file .private/incoming/solar-2026.xml --service solar --year 2026

# 절기 한 달 또는 음양력 한 달 응답 한 장
npm run kasi:intake -- --file .private/incoming/solar-2026-01.json --service solar --year 2026 --month 1
npm run kasi:intake -- --file .private/incoming/lunar-2026-01.xml --service lunar --year 2026 --month 1

# 음양력 단일 날짜 표본
npm run kasi:intake -- --file .private/incoming/lunar-2026-01-01.xml --service lunar --year 2026 --month 1 --day 1
```

`npm run kasi:intake`는 로컬 TypeScript 빌드 후 검사한다. 의존성이 미설치된 경우 설치는 별도 네트워크 작업이다. 순수 JSON stdout이 필요하면 먼저 `npm run kasi:build` 후 `node .kasi-build/intake.js ...`를 사용한다. 입력 파일명에도 키나 개인정보를 넣지 않는다.

## 판정과 종료코드

| 상태 | 의미 | 종료코드 |
| --- | --- | ---: |
| `STRUCTURALLY_COMPLETE_SCOPE` | 선언된 범위의 행수·값·페이지 계약 통과. 절기는 표시 분도 존재 | 0 |
| `DATE_ONLY_SCOPE` | 범위 행수는 맞지만 절기의 표시 분이 일부/전부 없음 | 2 |
| `PARTIAL_SCOPE` | 이 한 장으로 선언한 범위를 채우지 못함. 후속 페이지 자동 요청 없음 | 2 |
| `EMPTY_RESPONSE` | 성공 envelope의 totalCount와 행수가 0. **미지원 연도라고 단정할 수 없음** | 2 |
| `REJECTED` | 읽기, 인자, UTF-8, 형식, API 오류, 값/중복/페이지 계약 실패 | 1 |

절기 연간 범위는 24행, 절기 월 범위는 해당 월의 두 절기, 음양력 월은 실제 양력 일수, 일 표본은 1행을 기대한다. 마지막 페이지만 있는 경우 `PARTIAL_SCOPE`다. 여러 파일을 자동 합치거나 빈 날짜/누락 `kst`를 추정하지 않는다. `completeScope`는 행 범위만 가리키며 `DATE_ONLY_SCOPE`도 true일 수 있다. 페이지의 `declaredTotal`은 제공된 파일의 주장이다.

## 비밀과 증거의 경계

- 입력은 최대 2,000,000바이트의 일반 UTF-8 파일. 직접 symlink/디렉터리/장치 파일은 거절한다. POSIX에서는 열 때 symlink 대체도 차단한다. 부모 경로는 사용자가 신뢰하는 비공개 디렉터리여야 한다. Windows에서 파일 경합·배치 실기는 별도 미검증이다.
- 파일을 실행·변경·복사하지 않고, 원문/오류 본문/파일 경로/알 수 없는 필드 이름·값을 출력하지 않는다. 반환 필드는 고정 목록과 검증된 숫자/열거값이다.
- `normalizedRowsSha256`는 날짜순으로 정렬한 **검증된 정규화 달력 필드만**의 지문이다. 원문 header/message에 비밀이 있을 수 있으므로 원문 파일 해시는 만들지 않고 `originalResponseSha256=null`로 둔다. 같은 정규화 지문이 원본 파일 동일성이나 출처 진위를 뜻하지 않는다.
- 무시된 필드가 있다고 입력 파일을 안전하게 공유할 수 있는 것은 아니다. 이 도구는 원문 비밀 제거기나 인증기 역할을 하지 않는다.
- `providerAuthenticity`, `externalOriginalVerification`, `rightsReview`는 항상 `UNVERIFIED`. `yearComplete=false`, `engineSupportPromotion=false`, `g1P2Promotion=false`다. 모든 입력은 조작 가능한 사용자 제공 파일이며 성공 envelope도 실제 API 호출을 증명하지 않는다.
- 1950~2027 인자 수용은 검수 도구 범위다. 기본 명식 엔진은 여전히 2026~2027이며 역사 법정시, 독립 역법 대조, 상업 재사용권, G1-P2는 별도 게이트다.

다음 검수자는 안전한 요약과 선언 범위를 먼저 검토하고, 원문 전달이 필요하면 별도 비공개 검토를 거친다. 로컬 API 성공·특정 범위 행 완전성·독립 원본 대조·런타임 지원·권리 승인을 각각 기록한다.
