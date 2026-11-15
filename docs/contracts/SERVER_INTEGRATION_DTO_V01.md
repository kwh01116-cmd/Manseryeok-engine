# API-only 서버 분석 계약 v0.1

`scripts/server/engine.mjs`의 import 가능한 Node22 어댑터다. 서버가 검증한 자료를 한 번 준비하고 여러 요청에 재사용한다. HTTP 서버·클라이언트 SDK·클라우드 배포를 만들지 않으며, 기존 CLI/API의 기본 프로필을 교체하지 않는다.

## 운영자와 고객 입력의 분리

운영자만 `loadApiOnlyServerEngine({dataDirectory})`에 자료 경로를 준다. 이 경로는 독립 수락한 [API-only 팩](SERVER_API_ONLY_DATA_PACK_V01.md)만 허용한다. 요청에는 파일 경로·manifest 기대값·키·자료 override를 넣을 수 없다. 자료팩/원문 전체를 반환하는 API는 제공하지 않는다.

요청 schema는 `manseryeok-server-analysis-request-v1`, 분석 프로필은 명시적 `KASI-SERVER-API-ONLY-ANALYSIS-V01`/1.0.0이다.

```json
{
  "schemaVersion": "manseryeok-server-analysis-request-v1",
  "analysisProfileId": "KASI-SERVER-API-ONLY-ANALYSIS-V01",
  "calendarProfileId": "kasi-api-1987-1988-dst-local-v1",
  "jurisdiction": "KR",
  "timeZone": "Asia/Seoul",
  "calendar": "GREGORIAN",
  "date": "1987-06-01",
  "time": "00:30",
  "policies": {
    "clockPolicyId": "KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1",
    "dayRollover": "CIVIL_MIDNIGHT",
    "hourStemReference": "SELECTED_DAY_PILLAR",
    "dayHourReference": "STANDARD_KST"
  }
}
```

- `jurisdiction:'KR'`, `timeZone:'Asia/Seoul'`를 반드시 명시한다. 다른 출생지나 미지정 지역을 한국 시각으로 추정하지 않는다.
- `calendar`는 `GREGORIAN` 또는 `KOREAN_LUNAR`다. 양력은 `date`, 음력은 `lunarDate:{lunarYear,lunarMonth,lunarDay,leap}`를 사용하고 두 표기를 혼합하지 않는다.
- `time`은 `HH:mm` 또는 **null(시각 미상)**이다. 누락·24:00·초·자동 overflow를 거절한다. null이면 출생 M1을 실행하지 않고 `NEEDS_BIRTH_TIME`/원국0을 반환한다. 시각 미상의 완전한 명식을 제공한다는 뜻이 아니다.
- `calendarProfileId`와 `policies.clockPolicyId`가 맞아야 한다. 기존 네 일주/시주 참조 정책을 명시한다.
- DST 프로필만 `dayHourReference:'STANDARD_KST'`를 요구한다. `foldOffsetMinutes:540|600`은 실제 반복 시각에서만 선택할 수 있다. 원래 반복 시각 정보는 선택 뒤에도 남긴다.
- `monthlyOptions`, `luckOptions`, `experimentalPolicyId`는 선택이다. 월운은 현대 기본 프로필의 V1/확장 양력의 V2를 구분한다. 원래 대운·세운·명목투영 옵션 validator를 재사용한다. 새 서버 계약은 잘못된 대운 성별/개수를 미요청으로 바꾸지 않고 입력 오류로 거절한다. 기존 legacy의 부분 처리 계약은 변경하지 않는다.
- 실험 점수는 명시 선택한 현대 프로필에서만 허용한다. 기존 M3·M4·M5·M7 규칙을 새 점수나 최종 길흉으로 합성하지 않는다.

모든 객체 계층은 허용된 문자열 own/enumerable/data property만 받는다. getter·symbol·숨은 property·배열 대용 객체·정책 혼입을 거절한다. JSON 외 직접 import 입력에서도 같은 규칙을 적용한다.

## 프로필이 묶는 분석 범위

| 출생 프로필 | 시계 | 같은 실행에서 재사용하는 분석 |
| --- | --- | --- |
| `kasi-api-1989-2026-local-v1` | 기존 현대 V1 | 기존 Sprint3 product: M2·M3 계절/근/제한종합·내격8·기존 한정 M5·공망·요청한 M7/월운V1 |
| `kasi-api-1962-1986-standard-local-v1` | 안정 표준시 V1 | 기존 확장 report: M2·구조 M3·계절V1·근/인성제한·내격8·공망. M5/대운·세운 시계는 미채택 |
| `kasi-api-1987-1988-dst-local-v1` | 별도 DST 표준참조 V1 | 위 확장 범위, 원민간시/표준참조/UTC분·gap/fold를 추가로 구분 |
| `kasi-api-1989-2027-solar-local-v1` | 확장 현대 V2 | 기존 확장 범위와 요청한 월운V2.2027 음력은 자료 부족,2027월운은10완료+2부족 |

이 명시 프로필 선택이 하위 분석 범위를 묶는다. 결과의 원래 policy ID/version·규칙/출처/decisionTrace는 각각 유지한다. M5가 현대 기본 프로필에서 실제 실행되는 것과 새 시계 범위에서 실행하지 않고 HOLD를 주는 것을 구분한다. M6는 NOT_IMPLEMENTED다.

## 응답과 근거 참조

응답 schema는 `manseryeok-server-analysis-result-v1`이다. `status`로 성공/자료·시계·시각 보류를 먼저 구분한다.

| 필드 | 의미 |
| --- | --- |
| `profile`, `request` | 선택된 서버 계약 버전과 검증된 원입력 사본 |
| `dataPack` | 독립 pack pin·상위 수락 지문·검증 수준·서버 내부 조건부 이용/고객배포 미승인 |
| `calculation` | 기존 발급 M1. 실제 정책·원국 후보·적용 절입·달력/시계 근거 |
| `candidates` | M2의 후보 ID·네 기둥·원래 M1 후보 인덱스 |
| `analysisData` | 기존 발급 결과의 선택 projection. 입력 fact/rule/source·각 분석을 보존 |
| `modules` | M2~M7·공망의 상태와 `analysisData` 내 경로. M5 실행 여부·월운 query/table 상태와 대안 수를 별도 표시 |
| `summary` | 기존 결정론적 요약. 상세와 같은 `analysisData.summary` 객체 |
| `holds` | 자료 부족·목적 제한·효력/시계 미채택. 부재/0으로 바꾸지 않음 |
| `conditionals`, `timeResolution` | 절입 원국 대안·독립 월운 대안·선택 뒤 남은 민간시 중복을 분리 |
| `executionCounts` | 기존 발급 결과 재사용 계약. 시각 미상 M1=0, 정상 제품 M1=1, 시간축용 추가 출생 M1=0 |

`referenceBase:'analysisData'`와 `upstreamSchemaVersion`으로 원래 판단 경로를 추적한다. 새 계약은 전체 legacy DTO라고 자칭하지 않는다. 원래 분석 객체를 수정하지 않고, 혼합 자료팩 전체에 붙었던 `technical.rights` 같은 예전 기술 영역은 새 projection에서 제외한다. 전통 문헌의 판본/권리 미확정과 새 API-only 자료팩 내부 사용 수락은 별개다.

`CALCULATED_UNDER_SELECTED_POLICIES`는 출생 계산과 선택 분석의 실행 상태이며 모든 분석의 확정이 아니다. `modules/holds/conditionals`를 함께 읽는다. 보류 응답은 `analysisData/summary=null`, 후보0이고 자료·시계 사유를 남긴다. 반복 시각에 offset을 주지 않으면 원국을 만들지 않는다. 두 offset이 같은 팔자가 되어도 두 시간 대응을 지우지 않는다.

`validateApiOnlyServerResult`는 같은 프로세스의 발급·요청 hash·기존 판단 validators·후보/설명 경로를 확인한다. JSON 직렬화 자체가 외부 인증이나 G0 receipt가 되지는 않는다. 반환 객체는 동결하고 WeakMap을 사용하며, 출생별 전역 캐시/자동 파일 저장/외부 LLM은 없다.

## 리포트와 서버 적용

`renderApiOnlyServerReport(result,{detail:'summary'|'detailed'})`를 사용한다. 요약은 기존7섹션을 재사용하고 DST 기록 시각→표준 참조와 fold 선택 조건만 실제 필드에서 설명한다. 상세는 동일 DTO의 구조화 근거를 제공한다. 사용자에게 데이터팩 원문이나 전체 날짜 배열을 보내지 않는다.

실행 목표는 **Node22 서버 프로세스**다. 자료팩을 public/static 문서 루트 밖에 보관하고 결과만 반환하는 통합에 적합하다. Cloudflare Pages의 클라이언트 정적 자산으로 자료를 넣지 않는다. Workers 직접 실행·스토리지 바인딩·실제 HTTP 라우트·공개 URL은 이번에 구현/검증하지 않았다. 현재 `node:fs` 로더와 Node22 런타임 가드를 둔 artifact를 Workers 배포 완료라고 부르지 않는다.

[오프라인v4 계약](OFFLINE_SERVER_API_ONLY_V4.md) · [실행 가이드](../SPRINT5_SERVER_ENGINE_GUIDE.md) · [실제 검사/실패](../engineering/SPRINT5_EXECUTION_20261115.md)
