# 정관격 구조 분석 — 선택형 로컬 M4 v0.1

출생 명식을 한 번 계산하고, 기존 M2와 구조적 M3를 재사용해 정관의 존재·월령 후보·성패 관련 구조·미평가 효력을 구분한다. 소비자 화면이나 외부 생성 API는 추가하지 않는다. 기본 출력은 stdout이며 출생정보를 자동 저장하지 않는다.

## 선택 정책과 결과

`--pattern-profile M4-ZHENGGUAN-MONTH-STRUCTURE-V01`을 명시한다. 이 버전은 M2 `m2-basic-classification-local-v1`/`1`과 구조적 M3 `m3-structural-evidence-local-v1`/`0.1.0`을 공개된 묶음으로 선택한다. 개별 M2/M3 옵션과 충돌하면 거절하며, 계절·통근·인성 제한·M3 종합은 필수 의존성이 아니다.

- 월령 본기 정관은 투출 유무와 구분해 구조 후보로 검토한다.
- 기타 장간 정관은 정확한 같은 천간이 표면에 드러난 경우를 별도 후보로 다룬다. 미투출은 이 정책에서 선택하지 않되 존재 자료는 유지한다.
- 다른 월령 장간이 연·월·시에 드러나면 경쟁 구조를 보존하고 단독 취격을 확정하지 않는다. 일간 자기 일치만으로 다른 격을 생성하지 않는다.
- 午의 기타 장간 己 정관은 기존 장간표와 문헌의 사정지 설명을 연결하는 정책이 미선택이므로 `SOURCE_OR_POLICY_UNRESOLVED`로 둔다. 본기 정관 등 다른 지원 범위까지 차단하지 않는다.
- 재·인·상관·칠살, 정확 투출·오합·재인 위치·모든 기존 지지 관계는 실제 위치와 참조를 보존한다. 존재나 방향을 힘·자동 성격·파격·구응으로 바꾸지 않는다.

월령의 `patternBasis`는 격국 기준 요소다. M5의 도움이 되는 용신·희신/기신 추천과 다른 타입이다. 본기 표시는 사령·일수·강도·가중치의 확정이 아니다. [원저·주석·전사 차이와 결정표](research/M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md).

## PowerShell 실행

다음은 이 PC의 고정 Node 22를 사용하는 예다. 다른 PC에서는 `$node`만 해당 Node 22 경로로 바꾼다. 제품 코드에 이 절대 경로를 사용하지 않는다. 후보 파일이 없거나 지문이 다르면 실패하며 기존 fixture로 대체하지 않는다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run --silent build

$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', '.private\kasi-research-1950-2026-fe84ab4-a',
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--pattern-profile', 'M4-ZHENGGUAN-MONTH-STRUCTURE-V01'
)

# 가상 출생 입력: 월령 후보와 관련 재·인·상관·칠살을 함께 검토
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output text

# 같은 기능의 구조화 결과
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output json

# 가상 입춘 표시 분: 기존 두 원국 후보를 각각 보존
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output text

# 토왕 B 표시 분: 원국당 M4 하나, 계절 대안은 M3 아래 별도 보존
& $node .\scripts\kasi\local-m3-evidence.mjs @common --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output json
```

같은 명령은 기존 `npm run --silent kasi:evidence -- ...`로도 실행할 수 있다. JSON stdout에는 진행 로그를 섞지 않으며, 안전한 오류는 stderr로 출력한다. 시각·달력·시계·일주·시주 정책은 계속 필수다. 미지원 정책, 잘못된 날짜, 지원 범위 밖 입력은 거절한다.

## 앱에서 재사용할 계약

- 순수 모듈: `src/m4/zhengguanStructureV1.ts`의 `deriveM4ZhengguanStructure`, 검증·설명·렌더 함수.
- 기존 실행 어댑터: `scripts/kasi/local-m3-evidence.mjs`의 `deriveLocalM4Pattern`, `validateLocalM4Pattern`. 같은 프로세스의 발급 M2/M3를 확인하며 일반 JSON의 `status=OK`를 신뢰하지 않는다.
- 선택 결과: `patternAnalysis`와 `patternReport`. 부모 명식당 하나이며 B 계절 대안으로 복제하지 않는다. 선택하지 않으면 이전 JSON/TEXT 경로를 유지한다.
- 후보 상태, 월령 경쟁 상태, 조건의 `OBSERVED`/`NOT_OBSERVED`, 실제 효력 상태는 서로 다른 필드다. 최종 `geCheng`, `geBai`, `jiuYing`은 `NOT_IMPLEMENTED`다.
- 설명 → 판단/조건 → 기존 M2/M3 위치 → 규칙·정책·명리 출처와 API 계산 출처를 추적한다. 문자열 참조나 지문 자체는 외부 진위·판본·권리 인증이 아니다.

API 출생 지원은 양력 환산 `[1989-01-01, 2027-01-01)` 그대로다. 원문·export·후보 a/b·2027 보강본을 수정하지 않으며 M4에 보강본을 필수로 요구하지 않는다. 이번 API 요청·키·재수집은 0건이다. 기본 엔진/G0/G1-P2·기존 M3/M7·역사시·2027 조회 범위와 최종 해석/출시 게이트는 유지한다.

독립 기대 사례와 실제 자료 연결·브라우저·CLI의 정확한 실행 범위 및 SHA는 [실행 기록](engineering/KASI_M4_ZHENGGUAN_EXECUTION_20261113.md)에 구분한다. 구조 검사 성공을 원전 해석의 외부 정답률이나 현실 예측 타당성으로 표시하지 않는다.
