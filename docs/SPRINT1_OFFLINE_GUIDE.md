# Sprint 1 — 독립 오프라인 엔진과 M3 실험 정책

이 패키지는 기존 계산·분류·설명 모듈만 복사해 실행한다. 런타임에는 Node 22와 명시적으로 연결한 검증 데이터가 필요하며 npm 설치·KASI 키·외부 만세력 서버가 필요하지 않다. **비공개 데이터가 없는 코드 artifact만으로는 실제 출생 명식을 계산하지 않는다.** 데이터 부재·지문 오류·미지원 입력에서 fixture나 원격 서버로 돌아가지 않는다. 패키지 대상은 chart/explain/evidence/experimental 네 모드이며 M7은 기존 저장소 경로와 회귀 검사를 유지한다.

## 범위와 권리

| 범위/기능 | 판정 | 실제 의미 |
| --- | --- | --- |
| 1950–1988 출생 시각 명식 | UNSUPPORTED | 날짜 자료는 있지만 역사 법정시/DST와 발표시계 해석을 이 프로필에 연결하지 않음 |
| 1950–1988 연구 날짜 인덱스 | SUPPORTED_LIMITED | 관측 날짜 조회이며 시각 명식 지원 아님; 자료 양끝 부분 음력 월 유지 |
| 1989–2026 출생 | SUPPORTED_VERIFIED | 기존 현대 프로필의 양력 환산 `[1989-01-01,2027-01-01)`와 기록 시각/정책 필수. 선언 범위의 내부 회귀이지 독립 천문 전수 인증 아님 |
| 2027 출생 | UNSUPPORTED | 소한·입춘 supplement 두 건으로 연간/음력/시계 계약을 확대하지 않음 |
| 음력·윤달 | SUPPORTED_LIMITED | 기존 관측 인덱스로 변환한 양력 날짜가 출생 범위 안이어야 함. 윤달 여부 필수 |
| 절입 표시 분 | SUPPORTED_VERIFIED | 기존 전/후 상관 후보 보존. 초·확률·임의 ±30초를 만들지 않음 |
| 역사 표준시·DST/진태양시 | UNSUPPORTED | 이번 패키지에서 새 옵션이나 범위를 열지 않음 |
| 자시 | SUPPORTED_VERIFIED | CIVIL_MIDNIGHT/ZI_START × SELECTED_DAY_PILLAR/CIVIL_DATE_DAY_PILLAR 네 조합 명시 선택 |
| KASI 자료 외부 배포 | RIGHTS_BLOCKED | 공개 재배포/상용 이용 심사 미수락. 내부 테스트 attachment와 공개 코드 구조를 구별 |
| 상업 자료 권리 확정 | UNKNOWN | 이 스프린트는 법적 승인이나 기관 인증을 발급하지 않음 |

기존 기본 엔진의 별도 2026–2027 fixture·G0/Lab 범위를 축소하거나 API 프로필로 교체하지 않는다. 기계 판독 목록은 [지원 계약](contracts/offline-support-v1.json)이다. 2027 supplement는 이 M1/M2/M3 패키지의 필수 파일이 아니며 포함하지 않는다.

## 제작과 복원

제작 환경은 기존 고정 Node22.23.3·TS5.8.3·잠금 의존성을 사용한다. 완성된 artifact의 실행·검사·복원에는 TypeScript/npm/node_modules가 필요 없다. 아래 출력 디렉터리는 **새 경로**여야 한다. 기존 디렉터리를 reset/clean하거나 덮어쓰지 않는다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run --silent build

$engine = '.private\sprint1-package-example\engine'
$data = '.private\sprint1-package-example\data'
& $node .\scripts\offline\build.mjs --out $engine
& $node "$engine\attach.mjs" --candidate '.private\kasi-research-1950-2026-fe84ab4-a' --out $data
& $node "$engine\verify.mjs" --artifact $engine --attachment $data

# 새 폴더에 엔진과 내부 자료를 함께 복원. 자료 대상은 .private 아래만 허용.
& $node "$engine\restore.mjs" --artifact $engine --out '.private\sprint1-package-example\restored-engine' --attachment $data --private-data-out '.private\sprint1-package-example\restored-data'
```

엔진은 정적 모듈 폐쇄와 정확한 기존 schema 함수 추출본·정책 출처 catalog·고지·계약 메타데이터를 포함한다. 수집기·네트워크 클라이언트·기존 달력 fixture·외부 패키지는 포함하지 않는다. 빌드 입력/출력 지문, 런타임 요구, 기준 revision과 실제 입력 상태는 `artifact-manifest.json`에 있다. 파일 지문 검사는 내용 일관성 검사이며 서명이나 외부 진위/이용권 인증이 아니다.

내부 attachment는 `manifest.json`, `candidate.json`, `comparisons.json`, `boundary-requirements.json`, `soljd-audit.json`, `source-references.json`, `exceptions.json`의 기존 7파일을 복사한다. 고정 base content pin `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`와 파일별 지문을 원 로더로 검증한다. 검사 대상 manifest에서 기대 pin을 읽어 신뢰하지 않는다. 원본 XML/export/checkpoint/후보 a/b는 수정하지 않는다. 외부 artifact에 이 attachment를 동봉하지 않는다.

## 실제 실행 명령

```powershell
$common = @(
  '--attachment', $data,
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR'
)

# M1→M2→한국어 기초 설명. 점수 정책을 자동 선택하지 않는다.
& $node "$engine\run.mjs" @common --mode explain --m2-profile m2-basic-classification-local-v1 --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output text

# 입춘 표시 분의 두 원국을 JSON으로 보존
& $node "$engine\run.mjs" @common --mode chart --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output json

# 명시적 실험 정책: 같은 가상 생일의 양력/음력 입력
$experiment = @('--mode', 'experimental', '--experimental-policy', 'EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01')
& $node "$engine\run.mjs" @common @experiment --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text
& $node "$engine\run.mjs" @common @experiment --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false --time 12:00 --output json
```

`--mode chart|explain|evidence|experimental`와 `--output json|text`는 필수다. evidence의 하위 정책 선택은 기존 `kasi:evidence` 계약을 따른다. 실험 정책도 기존 ID를 명시해야 한다. 시간 미상은 임의 정오로 채우지 않고 거절한다. stdout에는 결과만, 안전한 오류는 stderr와 비영 종료로 출력한다. 새 오프라인 경계의 오류는 INPUT/ARTIFACT/DATA/CALCULATION 단계를 구분하고, 범위 밖·관측 범위 부족·잘못된 음력 날짜는 기존 M1의 고정 상태 코드를 보존한다. 예외 전문·입력 생일·로컬 파일 경로는 출력하지 않는다. 개인 입력/결과를 기본 저장하지 않는다.

JSON은 [오프라인 결과 계약](contracts/OFFLINE_ANALYSIS_V1.md)의 version/mode/data wrapper이며 `data`는 기존 DTO 그대로다. 계산·분석 정책과 데이터 버전·후보·입력 근거·trace·미정 조건을 유지한다. 후보 ID는 한 결과 내부의 상대 참조이며 다른 요청의 동일 문자열을 합치지 않는다. 스토리/UI/API 서버는 이번에 추가하지 않았다.

## 가중 정책 0.1.0 고정

| 슬롯 | 규칙 |
| --- | --- |
| 월지 / 일지 / 연지 / 시지 | 일간과 동오행 또는 일간을 생하는 대표 오행이면 3.5 / 1.5 / 1 / 1 |
| 연간·월간·시간 | 지원 오행이면 각1, 기존 장간표의 동오행 근이 전혀 없으면0.5; 일간 자신 슬롯 없음 |
| 월지충 | 지원하는 월지에 충 상대가 하나 이상이면 −0.8 한 번 |
| 등급 | >=8.5 극신강, >=5.5 신강, >=4 중화, >=2 신약, 나머지 극신약 |
| 미적용 | 자동 합화·천간 삭제, 장간 자체 가산, 근 개수 가산, MAIN_QI 강도 배점, M4 후보/정관근 추가 보너스, 시간 미상 보정 |

정수 1/10 단위로 합산하고0–10으로 제한한다. 위 등급은 선택한 휴리스틱의 구간명이며 기존 M3 최종 신강약·관의 경중·생조 전달 효력으로 승격하지 않는다. 배점과 임계값은 기존 정책 ID/0.1.0에 묶여 있으며 이번에 변경하지 않았다.

47개 고정 합성 원국의 독립 리터럴 기대와14개 scalar 임계값을 분리했다. 계수상 실제 원국 점수는 5의 배수 또는 충 보정 후2(mod5)의 tenths이므로 8.4 등의 값을 실제 명식으로 꾸미지 않는다. 합성 달력12요청/13후보의 연결 검사는 실제 KASI 원문 검증과 다르다.

중복 감사에서 장간 하나를 직접 여러 번 합산하는 버그나 중첩 충의 이중 감점은 발견하지 않았다. 다만 **월지 대표점수와 그 장간의 근 조건, 같은 근을 공유하는 여러 표면 천간은 서로 상관된 입력을 재사용**한다. 이는 현재 정책의 선택이며 독립 강도 증거 여러 개라고 설명하지 않는다. 한 지지 변경이 대표3.5와 두 천간의 근 보정0.5씩을 함께 바꿔 +4.5가 될 수 있다. 근 witness 수만 늘면 점수는 늘지 않는다. 무관한 M4의 자동 정관근은 추가 점수가 아니다.

지원 범위 내 실행과 산술 안정성은 실험 사용 GO의 기준이다. 실제 힘/예측 타당성이나 기본값 채택을 증명하지 않으므로 **M3 DEFAULT PROMOTION은 NO-GO**다. 기존 M3·M4·M7 정책과 기본 CLI는 유지한다.

최종 실행 수·실패/수정·검증 SHA·artifact 식별자는 별도 Sprint 1 실행 기록에 남긴다.

## 이번에 완성한 내부 패키지

실제 디렉터리는 `.private/sprint1-20261114/final-131a0c5/engine/`와 같은 상위의 `data/`다. payload59파일/435,278bytes이며 manifest는 별도다. 엔진 manifest SHA는 `ba70f6a6d549cc7f80f899b912ff9586be18eba588a7882a633a110d00bc82bf`, 내부 attachment descriptor SHA는 `a932a68ded1ff76fdaca494652472cc569ce9c5e3f9f4be03a22ab5c50cf5dd5`다. 위 명령에서 공통 인자를 만들기 전에 두 경로를 이 완성본으로 지정하면 재빌드 없이 실행할 수 있다. 데이터 attachment는 공개하지 않는다.

최종 실행 코드 SHA `131a0c551a5093e22ea22d6a66b37c31dae058df`에서 전체784/784, 실제 detached CLI96성공/8거절·경로4거절을 확인했다. [정확한 범위·실패·재검사](engineering/SPRINT1_OFFLINE_M3_EXECUTION_20261114.md)를 참고한다.
