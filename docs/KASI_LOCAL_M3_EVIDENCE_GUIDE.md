# 선택형 M3 판단 근거 v0.1

기존 API 로컬 명식을 한 번 계산하고 기존 M2 분류를 재사용해, 일간 기준의 구조적 검토 근거를 출력한다. 결과는 **EVIDENCE_ONLY**, 최종 신강약은 **NOT_IMPLEMENTED**다. 원국만 다루며 대운·세운을 원국의 추가 기둥으로 넣지 않는다. 기존 기본 엔진/G0/G1과 M3 최종 해석·출시 게이트는 바뀌지 않는다.

## 실행

아래 예시는 실제 개인 기록이 아닌 가상 입력이다. 이 PC의 경로는 가이드에만 있고 생산 코드에는 없다. Node22와 고정 의존성을 유지한다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node $npmCli run build
$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', '.private\kasi-research-1950-2026-fe84ab4-a',
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--m2-profile', 'm2-basic-classification-local-v1',
  '--m3-profile', 'm3-structural-evidence-local-v1'
)
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 `
  --leap false --time 12:00 --output json
```

일반 입력은 장간의 정확한 일간 일치와 동오행의 다른 천간을 함께 검토할 수 있다. 지지 관계가 겹치는 가상 입력과 입춘 두 후보도 같은 명령으로 확인한다.

```powershell
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 1990-01-01 --time 12:00 --output text
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output json
& $node $npmCli run --silent kasi:evidence -- @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output json
```

시각·달력·명식/M2/M3 프로필과 기존 일주/시주 정책은 필수다. 시간 미상에 정오를 넣지 않는다. 지원 출생 날짜는 양력 환산 `[1989-01-01,2027-01-01)`이며 음력의 연도 숫자만으로 허용 여부를 판단하지 않는다. 잘못된 날짜·알 수 없는 인자·정책·누락 후보·지문 오류를 거절하고 fixture로 돌아가지 않는다. 성별·대운·as-of 인자는 이 원국 근거 명령의 입력이 아니다.

기본 출력은 stdout이다. JSON에는 배너·진행 로그가 없고 안전한 오류는 stderr로 간다. 출생정보·결과를 자동 저장하지 않으며 네트워크·API 키·LLM이 필요 없다. `npm --silent`는 부모 npm 배너를 없애기 위한 옵션이다.

## 무엇을 연결하는가

| 근거 | 이번 분류 | 판단하지 않는 부분 |
| --- | --- | --- |
| 월령 문맥 | 해당 후보의 월주/월지·실제 적용 절입·발표 분·자료 출처, 월지 장간과 일간의 기존 분류 관계 | 득령/실령, 계절 사령·토의 계절·일수표 |
| 장간의 일간 관련 위치 | 정확히 같은 천간과 같은 오행의 다른 천간을 별도 배열로 보존 | 유효 통근·강근/약근·손상·가중치 |
| 다섯 생극 방향 | 같은 오행, 일간을 생함, 일간이 생함, 일간이 극함, 일간을 극함. 천간과 장간 위치를 구분 | 유리/불리·지원 점수·세력 합산 |
| 장간/표면 천간 연결 | 정확히 같은 천간 문자가 어느 장간과 어느 천간 위치에서 연결되는지 | 동오행 대체 연결, 전통적 투간의 효력 |
| 관계 제한 문맥 | 기존 M2의 모든 쌍 관계와 삼합/삼회 완전·부분 구성원 | 상쇄 우선순위·활성화·합화·강약 변화 |

일간 자신은 생조/동류 항목에 다시 넣지 않는다. 장간의 일지 위치는 실제 구성 위치로 남긴다. 같은 문자가 여러 위치에 있으면 위치별로 보존하지만 같은 위치를 중복 집계하지 않는다. 본기/기타 표시는 기존 M2 표시 정책이며 수치 가중치가 아니다. 지지 관계가 겹쳐도 다른 근거를 지우지 않는다.

계절의 효력과 뿌리·관계의 효과는 UNRESOLVED로 남긴다. 점수·임계값·신강/신약/중화·격국·용신/희신/기신·길흉·성격·직업·재물·건강·미래 사건은 산출하지 않는다. [정의·원래 규칙·새 조합 정책·확인 수준](research/M3_EVIDENCE_POLICY_V01.md)을 구분한다. 새 모듈 버전0.1.0이 원래 규칙 버전의 공백을 채우는 것은 아니다.

## 결과와 재사용

결과 스키마는 `kasi-local-m3-evidence-v1`이다. `m1`은 이번 실행의 원래 계산, `facts`는 같은 실행이 발급한 M2, `evidence`는 후보별 M3 근거, `explanation`은 버전형 한국어 템플릿이다. `provenance`에 명식/데이터셋/manifest/시계·일주·시주/M2/M3 정책과 계산 지문이 있다. `executionCounts`는 제품 경로의 M1·M2 호출을 구분한다.

각 `evidence.candidates[i].evidence`의 레코드는 ID와 candidateRef, inputFactRefs/inputMemberRefs, pillarRefs, ruleRefs/policyRefs/sourceRefs/calculationSourceRefs를 가진다. 설명은 같은 후보의 evidenceRefs와 원래 M2 사실을 가리킨다. 명리 규칙/프로젝트 정의의 출처와 KASI 달력 자료 출처를 섞지 않는다. 저장된 ref나 지문 자체가 외부 진위 인증은 아니다.

```javascript
import {createLocalM3EvidenceProfile, deriveLocalM3Evidence}
  from './scripts/kasi/local-m3-evidence.mjs';
const profile = createLocalM3EvidenceProfile(verifiedLocalChartProfile, {
  m2ProfileId: 'm2-basic-classification-local-v1',
  m3ProfileId: 'm3-structural-evidence-local-v1',
});
const result = profile.calculate(explicitBirthRequest);
// 같은 프로세스의 검증된 M2를 이미 가지고 있다면 M1/M2를 다시 실행하지 않는다.
const evidence = deriveLocalM3Evidence(result.facts, {
  m3ProfileId: 'm3-structural-evidence-local-v1',
});
```

순수 근거/설명 함수는 `src/m3/structuralEvidenceV1.ts`에 있으며 CLI와 독립적이다. 순수 함수의 구조 검사를 외부 자료 인증으로 표시하지 않는다. 로컬 어댑터는 기존 후보 로더/고정 지문, 이번 실행의 발급 명식·M2와의 연결, 불변 객체를 추가로 확인한다. 후보를 섞거나 외부 JSON의 status=OK를 믿는 경로는 없다.

## 실제 비공개 검사

공개 합성 테스트와 실제 비공개 후보 검사는 별도다. 실제 자료가 없는 checkout에서 전 기간 검증을 수행했다고 보고하면 안 된다. 아래 검증기는 새 비공개 결과 폴더에 집계·실행 증거만 저장한다. 전체 출생 명식 출력의 저장은 하지 않는다.

```powershell
& $node .\scripts\kasi\local-m3-evidence-verify.mjs `
  '.private\kasi-research-1950-2026-fe84ab4-a' '.private\m3-evidence-new-check'
```

최종 코드 SHA와 실제 실행 건수·실패 이력은 별도 실행 보고서에 기록한다. 이 검증은 기존 M2와 근거 연결의 일관성 검사이며 원전 판본·이용권·효과·예측 효력의 독립 인증은 아니다. 2027 경계 supplement 선택 여부는 원국 M3의 새 해석 규칙이 아니다.

## 이번 코드의 실제 실행과 검증

실행 코드 e3dab282ae781c5385c44aa6d68ff46081781c10에서 전체500/500, 실패·취소·skip·todo0이었다. 기존469개를 유지하고 A9개·M3유한10/연결8/CLI4를 추가했다. M2 감사와 Lab/KASI 실제 Chrome 첫 실행이 통과했다. 실제 가상 입력 CLI8회와 npm --silent1회가 exit0이며 npm JSON 전체는 직접 실행과 같은 bytes다. 일반·겹침·입춘 두 후보의 설명 전문과 출처 참조를 직접 읽었다. LF checkout metadata 수정 cf8199a95a88f09a97e5302c231f7cff72f2cf4f에서 집중22/22·전체500/500을 다시 통과했고 실행 코드/테스트JS는 동일하다.

최종 비공개 UTC·Asia/Seoul 각 47975양력/음력 입력쌍, 95950제품=95950출생 M1, 99598후보의 M3 근거를 검증했다. 근거/설명 참조 1406856/1406856회, 입춘 상관 152쌍을 유지했다. 두 요약 파일은 bytes까지 같고 의미 지문 ed945e2e197463b8ba50cfd5cf626827ceca4afcc676d08f150d0d51e4e5c4b4이 일치했다. 원본/a/b·실행18파일 불변, API·키 없는 실행이다. 추가 호출·음양력 provenance·독립 유한 기대값/기존 M2 연결 검사와 미검증 효과의 단위는 상세 실행 보고서에서 분리한다.

실제2027 KASI 두 이벤트는 별도 지문으로 수락했고 연말 기산 보강은 선택형으로 검증했다. 그것은 M3의 원국 근거/해석 규칙이나2027출생·조회 범위 확대가 아니다. [실제 가상 설명 전문·정확한 단위·실패·출처·보존](engineering/KASI_M3_EVIDENCE_EXECUTION_20261111.md).
