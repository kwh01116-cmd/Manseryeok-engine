# 2027년 소한·입춘 API 경계 보충

이 보충은 기존 후보 a/b의 manifest를 바꾸지 않는 별도 입력이다. 연간 API 원문을 확보하면 24행을 그대로 보존하되, 보충의 정규화 행은 2027년 소한·입춘 두 건으로 제한한다. 2027년 완전 연도 자료나 출생 지원 데이터로 등록하지 않는다.

현재 실제 수집 결과와 승인 상태는 실행 보고서를 확인한다. 실제 원문과 독립적으로 채택한 보충 지문이 없으면 선택한 실제 데이터 경로의 검증은 **NOT_RUN**이다. 공개 합성 테스트의 PASS로 대신하지 않는다.

## 선택과 범위

기존 `kasi:luck` 명령에 다음 두 인자를 함께 추가한다.

```powershell
--boundary-supplement '.private/검증한-보충-디렉터리' `
--boundary-supplement-sha '별도로-검토해-채택한-64자리-SHA256'
```

위 경로·지문은 형식 설명이며 실행 가능한 실제 데이터 값이 아니다. 보충 manifest 안의 지문을 읽어 그대로 기대값으로 삼지 않는다. 인자를 생략하면 기존 결과와 자료 부족 상태를 유지한다. 파일·지문·출처 오류 때 기존 fixture로 돌아가지 않는다. 순수 연도 라벨 계산에는 보충을 선택하지 않는다.

이미 검증된 실제 경로와 지문을 `$boundaryDirectory`, `$boundaryPin`에 따로 지정한 경우의 가상 입력 예시다. Node 경로는 PC별 실행 가이드 사항이며 핵심 코드에 들어 있지 않다.

```powershell
$node = 'C:/Users/Home/Desktop/Manseryeok-KASI-1950-2026-windows-x64/Manseryeok-KASI-1950-2026/runtime/node.exe'
$manifest = '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf'
& $node scripts/kasi/local-luck.mjs `
  --profile kasi-api-1989-2026-local-v1 `
  --candidate .private/kasi-research-1950-2026-fe84ab4-a `
  --manifest-sha $manifest --calendar GREGORIAN `
  --date 2026-12-31 --time 12:00 `
  --clock-policy KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1 `
  --day-rollover CIVIL_MIDNIGHT --hour-stem-reference SELECTED_DAY_PILLAR `
  --luck-profile M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01 `
  --dayun true --traditional-sex MALE --dayun-count 10 `
  --boundary-supplement $boundaryDirectory --boundary-supplement-sha $boundaryPin `
  --calendar-projection M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02 `
  --as-of-date 2026-12-31 --as-of-time 13:00 --output json
```

검증된 보충을 선택하면 소한만 M7의 다음 절입 탐색에 연결한다. 기산이 OK가 되면 기존 v0.2 투영을 재사용한다. 출생 M1은 한 번이며 원국의 dataset·지문·지원 범위는 그대로다. 대운 방향·간지 순서도 바뀌지 않는다. 별도 `luck.provenance.boundarySupplement`가 기본 후보와 보충의 조합 ID·각 지문·해석 정책을 공개한다.

`KASI-2027-AUX-PUBLISHED-KST-BOUNDARY-ONLY-V1`은 API가 발표한 KST 표시 분을 절입 간격 산술에만 쓰는 선택이다. UTC 순간, 2027년 법정시·DST 인증 또는 기존 현대 시각 정책의 범위 확대가 아니다. 원문의 `API_KST_AS_PUBLISHED`와 `NOT_RESOLVED`는 유지한다. 입춘은 자료 확보 상태만 기록하며 2027년 세운 시각 판정은 **POLICY_UNRESOLVED**다. 출생 및 실제 as-of 지원은 계속 `[1989-01-01,2027-01-01)`이다.

## 오프라인 감사

```powershell
& $node scripts/kasi/boundary-supplement-verify.mjs `
  --out .private/새로운-경계-코호트-검사-디렉터리
```

기존 47,975 입력 생성기를 읽고 마지막 확보 절입 이후의 제품 요청만 계산한다. 보충이 없으면 기존 부족 원인 집계만 수행한다. 실제 보충을 검증하려면 위 명령 끝에 검토한 `$boundaryDirectory $boundaryPin` 두 값을 추가한다. 원문·후보 a/b의 기존 독립 지문을 검사하며 API·네트워크·키 없이 실행한다. 이것은 경계 코호트 감사이고 전 범위 새 검증의 대체물이 아니다.

## 출처를 섞지 않는 대조

공식 API 명세는 `kst`를 한국표준시각으로 설명한다. [공공데이터포털 특일 정보](https://www.data.go.kr/data/15012690/openapi.do). 연간 조회를 택한 것은 기존 수집기의 검증된 한 페이지 경로가 월별 두 번보다 요청 수가 적기 때문이다. 원문의 24절기 기능 표는 월 필수로 표시하므로 연간 사용 가능 여부는 실제 응답과 구별해 기록한다.

[NAO 2027 暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou272.html)은 2026-02-02 발표 자료로 소한 2027-01-05 23:10, 입춘 2027-02-04 10:46을 제시한다. 표의 중앙표준시는 [NAO 시각계 설명](https://eco.mtk.nao.ac.jp/koyomi/faq/ephemeris.html)에 따르면 UTC+9다. 확인일은 2026-11-11 KST다. 기존 엔진 fixture의 두 표시 분은 이 표와 일치하지만, 실제 KASI 응답의 확인을 대신하지 않는다. 초 단위 일치나 독립 역법 전수 인증도 의미하지 않는다.
