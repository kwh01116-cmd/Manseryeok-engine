# API 후보를 사용하는 선택형 로컬 명식 명령

이 명령은 고정된 비공개 API 후보를 읽어 **기존 Four Pillars 계산기**에 연결한다. 기본 엔진의2026~2027 데이터·지원 범위와 production/Lab/G0 경로를 교체하지 않는다. 아래 예시는 실제 개인 기록이 아닌 **명시적 가상 입력**이다.

| 선택할 프로필 | 양력 환산 출생 범위 |
| --- | --- |
| `kasi-api-2026-local-v1` | `[2026-01-01,2027-01-01)` |
| `kasi-api-1989-2026-local-v1` | `[1989-01-01,2027-01-01)` |

범위는 음력 연도 숫자가 아니라 API 날짜 인덱스로 환산한 양력 출생일로 검사한다. 음력1988년의 날짜가1989년 양력 범위에 들어오면 허용될 수 있다. 음력2026년이라고2027년 양력 날짜까지 허용하지 않는다.

## 현재 Windows 환경 준비

Node22와 잠금 의존성으로 만든 `dist/`, `.kasi-build/`가 필요하다. 현재 체크아웃의 고정 의존성은 이미 설치되어 있어 재설치가 필요 없다. 코드 변경 후에는 같은 Node22 환경에서 `npm run build`로 빌드한다. 아래 준비 블록은 현재 PC의 portable Node22 절대 경로를 사용하며 PC 기본 `node`24를 선택하지 않는다. 다른 PC에서는 `$node`만 설치된 Node22 실행 파일로 바꾼다. 첫 버전 출력이 `v22.23.3`인지 확인한다. 후보 실행에는 네트워크가 필요 없다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$candidate = '.private\kasi-research-1950-2026-fe84ab4-a'
$pin = '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf'
& $node --version
```

`$pin`은 이전에 별도 확인한 manifest 내용 지문이다. 후보 파일에서 새로 읽은 값으로 기대 지문을 바꾸지 않는다. 후보가 없거나 지문이 다르면 실패하며 기존 fixture로 자동 대체하지 않는다. 후보 파일·원문·export는 수정하지 않는다. 후보와 원문은 `.private`에 계속 보관하며 공개 Git에 추가하지 않는다.

## 양력 가상 입력

준비 블록을 실행한 동일한 PowerShell에서 다음 명령을 그대로 실행한다. 출력은 JSON stdout이며 기본 파일 저장·개발 일지 저장·네트워크 호출은 없다. 개인 API 키도 필요하지 않다.

```powershell
& $node .\scripts\kasi\local-chart.mjs `
  --profile kasi-api-1989-2026-local-v1 `
  --candidate $candidate `
  --manifest-sha $pin `
  --calendar GREGORIAN `
  --date 2026-06-01 `
  --time 12:00 `
  --clock-policy KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1 `
  --day-rollover CIVIL_MIDNIGHT `
  --hour-stem-reference SELECTED_DAY_PILLAR
```

## 음력 가상 입력

위 양력 날짜를 **고정 지문으로 검증한 실제 API 후보**에서 조회하면 음력2026년4월16일 평달이다. 다음 명령도 같은 양력 날짜·시각에 도달한다. `--leap`는 `true` 또는 `false` 문자열을 명시한다. PowerShell의 `$false`를 넣는 예시가 아니다.

```powershell
& $node .\scripts\kasi\local-chart.mjs `
  --profile kasi-api-1989-2026-local-v1 `
  --candidate $candidate `
  --manifest-sha $pin `
  --calendar KOREAN_LUNAR `
  --lunar-year 2026 `
  --lunar-month 4 `
  --lunar-day 16 `
  --leap false `
  --time 12:00 `
  --clock-policy KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1 `
  --day-rollover CIVIL_MIDNIGHT `
  --hour-stem-reference SELECTED_DAY_PILLAR
```

2026년 가상 입력은 두 명령 모두 `--profile kasi-api-2026-local-v1`로 바꿔 실행할 수도 있다. 프로필을 생략하면 임의 기본 프로필을 선택하지 않고 거절한다.

위 두 명령을2026-11-10에 Node22.23.3으로 실제 실행했다. 당시 네트워크 연결/global fetch 차단 preload를 추가했고 둘 다 아래 의미의 결과를 반환했다. 개별 예시 실행이며 현대38년 전수 검사 완료 주장이 아니다. 전수 비교·회귀 결과와 정확한 코드 SHA는 별도 실행 보고서에서 확인한다.

```json
{
  "status": "OK",
  "profile": "kasi-api-1989-2026-local-v1",
  "gregorianDate": "2026-06-01",
  "time": "12:00",
  "confidence": "DEFINITE",
  "pillars": {"year":"丙午","month":"癸巳","day":"丙午","hour":"甲午"},
  "appliedJie": {"term":"LIXIA","displayedDateTime":"2026-05-05T20:49","sourcePrecision":"MINUTE"}
}
```

이 블록은 전체 JSON을 읽기 쉽게 줄인 예시다. 실제 출력의 기둥은 `chart.candidates` 아래 stem/branch 객체이고, 프로필도 메타데이터 객체다. 출생 달력 종류는 다르지만 두 경로의 `chart` 기둥·불확실성 후보와 정책은 같아야 한다.

## 필수 정책과 출력 계약

출생 시각은 `HH:mm` 필수다. 미상 시각에 정오를 채우지 않으며 입력 시각으로 `24:00`이나 초 단위를 받지 않는다. 달력 종류·프로필·후보 경로·기대 지문·시계 정책·일주 교체·시주 기준을 명시해야 한다.

| 정책 입력 | 기존 허용값 | 의미 |
| --- | --- | --- |
| `--clock-policy` | `KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1` | 현대 한국 민간시와 발표 KST 분의 비교; 버전1 |
| `--day-rollover` | `CIVIL_MIDNIGHT`, `ZI_START` | 기존00시 일주 교체 또는23시 일주 교체 |
| `--hour-stem-reference` | `SELECTED_DAY_PILLAR`, `CIVIL_DATE_DAY_PILLAR` | 시주 천간의 기존 일간 참조 기준 |

기존 두 일주 정책×두 시주 정책의 네 조합을 명시적으로 선택할 수 있다. 새 학파·경도 보정·진태양시 정책을 추가한 것이 아니다. 예시가 고른 조합이 숨은 기본값으로 적용되지는 않는다.

출력에는 `status`, `profile`, `dataset`, 변환된 `input.gregorianDate/time`, `policies`, `chart`, `evidence`, `limits`가 있다. `dataset`은 별도 API 데이터셋 ID·버전과 고정 manifest 지문을 가진다. `evidence`는 실제 적용 절입, 연 경계에 사용한 입춘, 날짜 대응의 API 서비스 ID/operation/query/응답 지문을 연결한다. API의 달력 연·월간지를 사주 연주·월주로 대입하지 않는다.

절기 source ID는 `KASI_OPENAPI_RESPONSE:...` 형식이며 기존 연간 TXT fixture의 출처 ID로 바꾸지 않는다. 원문의 `API_KST_AS_PUBLISHED`, `historicalCivilTime=NOT_RESOLVED`, 황경 null과 윤달 월간지 null을 보존하고, 계산용 KST 해석은 별도 정책 필드에 기록한다. [시계 정책과 공식 근거](research/KASI_MODERN_API_CLOCK_POLICY_20261110.md)를 참조한다.

표시 분에 걸리면 `chart.confidence=PUBLISHED_MINUTE_AMBIGUOUS`와 기존 상관 후보를 유지한다. 입춘에서는 전·후의 연주와 월주가 짝을 이루는2후보이며 임의4조합으로 늘리지 않는다. 분 발표를 정확한 초 또는 확정된 천문 순간으로 표시하지 않는다. `DEFINITE`도 이 분 비교 정책 내 단일 후보라는 뜻이다.

정상 계산은 exit0이다. 문법·정책·고정 지문·필수 자료 문제는 `REJECTED`/exit1, 범위 밖이나 날짜 변환 결과의 비정상 상태는 exit2다. 오류에는 입력 출생정보나 비공개 경로를 그대로 출력하지 않는다. JSON stdout을 사용자가 직접 리다이렉트하면 그 파일에 출생정보가 남을 수 있으므로 실제 개인 기록을 개발 로그나 Git에 저장하지 않는다.

## 양끝 경계와 보장 범위

- 1989년 초 계산에는 기존 API 후보의 **1988년12월 대설 한 건**만 보조 guard로 사용한다.1988년 출생 명식이나 DST 전환 구간을 지원한다는 뜻이 아니다. 이후 연도도 각 이전 연도의 대설 guard를 명시적으로 선택한다.
- 기존 resolver/연간 coverage는 해당 연도24절기와 이전 대설을 사용한다.2026년 말 출생 명식에2027년 절기나 미래 coverage witness는 필요하지 않다. 향후 대운 기산의 다음 절입 요구와 현재 출생 명식의 입력 요구를 섞지 않는다. 대운 계산은 이 명령의 기능이 아니다.
- `ZI_START`로2026-12-31 23시대의 `effectiveDayDate`가2027-01-01이 될 수 있다. 이는 기존 일주 날짜 연산이며2027년 출생이나2027년 음력 날짜 변환의 지원 선언이 아니다. 입력 출생일의 API 날짜 증거는2026-12-31에 남는다.
- 음력 날짜는 평달/윤달을 구별한다. 잘못된 윤달이나 관측 범위 밖을 추정으로 채우지 않는다. 원래1950~2026 데이터의 양끝 부분 음력 월도 그대로다.
- 이 경로는 **고정 내용과 구조 coverage를 확인하는 로컬 프로필**이다. G0 receipt를 만들지 않으며 기존 G0 검증을 통과했다고 표시하지 않는다. 기본 엔진의2026~2027 지원과 G0 경로, 연간 TXT 원본 검증의 G1-P2 NO-GO는 그대로다.
- 확보 데이터는1950~2026이지만 이 명령의 현대 시각 명식 범위는 위 프로필 표에 한정한다.1950년 대한24:00과 이전 역사 법정시/DST 문제는 해석하지 않는다. 공개 배포·상용 권리·외부 독립 전수 인증도 완료 상태가 아니다. 전체 API가 전수 외부 정확성 인증을 받았다는 표현을 사용하지 않는다.

프로필은 네트워크·키 없이 검증한 후보를 읽는다. 원문/export/기존 후보를 재수집하거나 고치지 않으며, API 후보가 없을 때 기본 fixture로 fallback하지 않는다. [후보 생성과 보존 가이드](KASI_RESEARCH_ADAPTER.md)는 별도 오프라인 연구 어댑터의 계약이다.

완료된 A/B 검사 범위·정확한 코드 SHA·UTC/AsiaSeoul 재현성·남은 한계는 [실행 보고서](engineering/KASI_API_LOCAL_CHART_EXECUTION_20261110.md)에 기록했다.
