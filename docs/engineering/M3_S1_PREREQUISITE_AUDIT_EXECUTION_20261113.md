# M3-S1 전제 감사 — 실제 실행 기록

2026-11-13 KST. 연구의 결론은 **새 상대 강약 런타임 NO-GO**다. 기존 코드의 재실행·실패·보존을 기록한다. 문헌·정의 감사·24사례와 결정 근거는 [연구 보고서](../research/M3_S1_RELATIVE_STRENGTH_PREREQUISITE_AUDIT_20261113.md)에 있다.

실제 검증 SHA: **bb6cb48d95713eb3764cd6f90319200c4dddc05e**. 이후 문서·데이터 전용 사례를 변경했으며 실행320파일은 불변이다. 문서 커밋·일반 Push 후 원격 full SHA는 전달 receipt/최종 응답에서 구별한다.

## 1. 실행·실패·자원·보존 증거

### 최종 기존 코드 재검사

고정 Node **22.23.3**, 바이너리 SHA `9c9245166b4a8e182e0b797da9c20136117ff24368eaff1fec8343a123c8db0e`, 잠금 의존성 유지. 실행 SHA는 모두 위 `bb6cb48d95713eb3764cd6f90319200c4dddc05e`다.

| 실행 | 이번 실제 결과 |
| --- | --- |
| `npm run check` | **650/650**, fail/cancel/skip/todo0, TAP 390,295.9009ms. 첫 실행 자연 종료0 |
| M2 감사 | 기존4정책/9규칙/12출처 구조 일관성. native rule version 미기록7, 비평판본/권리 확인0 유지 |
| Lab 실제 Chromium | 첫 실행 자연 종료0, 기존 소유 프로세스 수명 관리 재사용 |
| KASI 웹 실제 Chromium | 첫 실행 자연 종료0. 합성 upstream 브라우저 회귀이며 실제 KASI API 호출 아님 |
| 사례 실행 | 합성/주석/재사용17/17 + 실제CLI JSON6/6 + 잘못된 입력 계약5/5 |
| 실제 기존 CLI | 9가상제품×JSON/TEXT=18자식, 모두 자연0/빈stderr, 제품당 출생M1=1. 기존 C1 핵심층은 이전 고정 산출물과 같음 |
| 비공개 감사 | 파일럿50쌍 완료 후 UTC→Asia/Seoul 각3,956쌍 순차 자연 종료0, 입력당 대량 DTO 누적 없음 |

650개는 새 S1 테스트 수가 아니라 **기존 전체 회귀**다. 사례 검사는 별도 비공개 읽기 전용 조사 도구로 실행했고 제품 코드나 공개 테스트 실행 목록을 추가하지 않았다. 사례 도구는 기존 공개 합성 scaffold의 M1 메타데이터 seed 한 번을 사용하며 실제 API 출생 제품을 추가 실행한 것으로 세지 않는다.

실제 두 시간대 실행: UTC `13:42:20.442Z→13:45:51.734Z`, Seoul `13:49:07.813Z→13:52:27.049Z`. 각 프로세스의 호스트 시간대를 확인했고 UTC 자연 종료 후 Seoul을 시작했다. 고정 `old-space256MiB / semi-space4MiB`, 250쌍마다 집계·메모리 표본을 기록했다. UTC 211,291ms/표본 heap119,371,536B/maxRSS271,448KiB, Seoul 199,236ms/heap122,906,208B/maxRSS279,556KiB였다. 각각17표본이며 표본 peak는 순간 최대나 누수 부재 증명이 아니다. 이번 대규모 감사에서 메모리 중단·자동재시도·skip·시간제한 변경은 없었다.

코호트 SHA `092e89bd98de7f0c5fc3bf26d8da50045c5b74adc3804a1bf728d660519e338c`, 양음력 및 두 시간대의 의미 SHA **`e220d0dee3425b7b34a1389be763ba911fb23b0b6c8b984e30925c1cdf990558`**, 두 summary bytes SHA `832a3c9c723a411faac633d22b6a245c35fc8e05fcdf9c5bd3b072dfadcb7822`. 실행 메타데이터는 분리했다. audit319파일과 QA54파일의 합집합320개 source/build snapshot과 검사 파일의 지문은 전후 동일하다. 겹치는 파일을 373개로 중복 집계하지 않는다.

### 성공과 구별해 남긴 실패

1. 첫 CLI 대조에서 과거 `1996-12-29 00:30` 기준을 잘못된 `12:00` 요청과 비교했다. 완료14자식+다음JSON1자식은 모두0이었으나 부모 기대 대조는1로 실패했다. 시각만 고쳐 새 디렉터리에서 18회를 실행했다. 제품 코드·고정 기대값을 고친 것이 아니다.
2. 첫 사례 조사기는 기존 재성 위치의 투영 key를 빠뜨려 17개 중2개를 검사하지 못했다. 또한 mutable 합성 M2 변조2개를 bare root validator의 역할로 잘못 검사해 5개 중3개만 거절됐다. 처음의 helper와 로그를 보존했다.
3. bare `validateM3RootPresence`는 발급된 root와 실행 문맥의 identity 검사이며 mutable 원래 M2의 전체 snapshot 재검사 API가 아니다. 두 변조는 기존 `validateM3EvidenceInputContext`를 명시적으로 호출하는 검증층으로 수정했다. 현재 로컬 제품은 발급 전 M2를 중첩 deepFreeze하고 발급·불변 결과를 확인한다. 이 합성 mutable 실험을 제품의 새 취약점 또는 새 생산 guard 구현으로 보고하지 않는다. 기대 사례의 내용·지문은 불변이고 조사 도구만 수정했다.
4. 마지막 문서 대조 명령은 `git status --porcelain` 전체에 `trim()`을 적용해 첫 줄의 상태 앞 공백을 제거했고 경로를 한 글자 잘못 읽어 종료1이었다. 데이터·제품·문서 내용은 바꾸지 않고 NUL 구분 상태 출력을 읽는 대조기로 수정했다. 기존 기대값을 완화한 것이 아니다.

### 비공개 증거 위치와 입력 지문

대량 출력과 가상 CLI 원문은 Git에 넣지 않는다. 현 로컬의 주요 receipt는 다음과 같다.

- `.private/m3-s1-qa-bb6cb48-final-qa-20261113.json` 및 check/audit/Lab/KASI 개별 종료 로그.
- `.private/m3-s1-bb6cb48-{pilot,utc,seoul}-20261113/{summary,execution}.json`.
- `.private/m3-s1-cli-bb6cb48-b-20261113/receipt.json`, 첫 실패는 `m3-s1-cli-bb6cb48-20261113/failure.json`.
- `.private/m3-s1-case-freeze-20261113.json`, 첫/최종 사례 로그 `m3-s1-case-verify-{first,final}-20261113.log`.
- 최종 대조·TEXT전문검토·실행파일 불변은 `.private/m3-s1-final-acceptance-20261113.json`, Commit/Push 확인은 별도 delivery receipt.

| 읽기 전용 입력 | 내용 지문 또는 보존 트리 지문 |
| --- | --- |
| base manifest | `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf` |
| 완료 export | `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851` |
| 수락 2027 supplement | `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7` |
| 완료 디렉터리 2,086파일 | `82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567` |
| 후보a 8파일 | `b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed` |
| 후보b 8파일 | `b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584` |
| 보강 5파일 | `47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9` |

후보는 기존 loader와 검사 대상 밖에서 고정된 기대 지문으로 검증했다. 네 입력 트리의 실제 파일 SHA를 전후 대조했으며 보강은 보존 감사만 했다. 원본·후보·보강을 수정하거나 기대 해시를 현재 파일에 맞춰 재정의하지 않았다. API·키 사용·재수집0, private 추적0. 현재 지원 출생·시계 정책과 기본/G0/G1-P2·기존 정책·게이트는 불변이다.

## 2. 복사 가능한 기존 경로 실행

**새 S1 명령은 없다.** 아래는 이번에 실제 사용한 기존 옵션 조합이다. 이 PC의 Node 경로는 가이드용이며 생산 코드에 하드코딩하지 않는다. 비공개 후보가 없으면 실행할 수 없으며 fixture fallback은 없다. 시각과 정책을 생략하지 않는다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', '.private\kasi-research-1950-2026-fe84ab4-a',
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--position-profile', 'M4-ZHENGGUAN-WEALTH-RESOURCE-POSITION-REVIEW-V01',
  '--synthesis-profile', 'M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01'
)
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output text
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar KOREAN_LUNAR --lunar-year 2025 --lunar-month 11 --lunar-day 20 --leap false --time 12:00 --output json
```

JSON stdout에 배너·진행 로그를 섞지 않는다. 기본 결과는 stdout이며 입력·결과 자동 저장·외부 생성 호출은 없다. 위 리포트는 기존 범위의 계절·근·한정 약·위치 연구를 보여주며 새 상대 강약을 발급하지 않는다.
