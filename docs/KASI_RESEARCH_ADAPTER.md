# 완료 KASI 캐시의 오프라인 연구용 후보 만들기

`scripts/kasi/research.mjs`는 이미 확보한 월별 XML 캐시를 읽어 원문→receipt→연도 캐시→export를 대조한 뒤, 별도 비공개 스냅샷에 날짜 인덱스·음력 월·절기 후보를 쓴다. API 요청이나 키 입력은 없다. 원래 Collector의 `Store.load`, `Collector.validateYear`, 해시·정규화·연간 검증기를 재사용한다. 기존 `kasi:local validate`는 export/summary를 쓰므로 이 보존 작업에는 사용하지 않는다.

## 실행

Node22, 설치된 잠금 의존성을 사용하는 저장소 루트에서 실행한다. 입력 디렉터리와 출력은 `.private/` 내부여야 하며 출력의 부모가 미리 존재해야 한다. 출력 디렉터리는 새 이름이어야 한다. 기존 스냅샷은 덮어쓰지 않는다.

```sh
npm run kasi:research -- --input .private/kasi-local-1950-2026/monthly-xml --out .private/kasi-research-new-snapshot --expected-export-sha 7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851 --from 1950 --to 2026
```

`--expected-export-sha`는 보존된 완료본의 별도 확인값이다. 오류를 없애려고 새 입력의 해시로 기대값을 교체하지 않는다. 지원 입력은 정규화0.1.2 전체 연도 export, 월별 XML 모드다. 연간 구버전 캐시는 기존 검증기의 제한된 버전 호환 규칙을 유지한다. 날짜 누락·중복·잘못된 범위·원문/receipt/정규화/export 불일치는 거절한다.

산출물은 `candidate.json`, `source-references.json`, `comparisons.json`, `boundary-requirements.json`, `soljd-audit.json`, `exceptions.json`, `manifest.json`, `run-metadata.json`이다. 예외 목록은 null 월간지 그룹별 날짜·행수·출처,24:00 검토 이벤트, 황경 미제공 이벤트, 부분 월을 구분한다. 원문 `solJd`는 별도 감사 파일에만 추출한다. 원래 export 형식과 지문은 바꾸지 않는다.

manifest는 모든 입력 파일의 크기·SHA, 입력 트리와 파생 파일 지문, 실제 원문 연결, 소스 코드·실행 빌드 트리 지문, 수행/미수행 검사와 요청0건을 기록한다. 실행시각·HEAD·런타임은 별도 run metadata에 둔다. 같은 코드/빌드·입력·설정이면 실행시각과 관계없이 파생 파일과 manifest가 동일하다. SHA는 로컬 변경 탐지이며 제공기관의 서명이나 독립 역법 인증이 아니다.

## 후보 사용

CLI가 출력한 `manifestContentSha256`를 별도 보관하고, 저장 후 재읽을 때 그 지문으로 고정한다. metadata 파일 자체를 신뢰 근거로 삼지 않는다.

```js
import { loadCandidate } from './scripts/kasi/research.mjs';
const { index } = await loadCandidate('.private/kasi-research-new-snapshot', recordedManifestSha256);
const lunar = index.fromGregorianDate('2026-12-31');
const solar = index.fromLunarDate({lunarYear:2026,lunarMonth:11,lunarDay:23,leap:false});
```

날짜 양방향 조회는 실제 관측 범위 `[1950-01-01,2027-01-01)`에 한정한다. 양끝 월의 누락 일자를 역산해 지원하지 않는다. 월 시작 `API_OBSERVED_DAY_1`과 `ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED`를 구별한다. 기존 음력 corpus 검증기는 음력 연도 전체를 요구하며 출처도 연간 판본 계약이므로, API를 그 corpus로 위장해 넣지 않는다. 새 인덱스는 기존 날짜 연산/월 키를 재사용하는 관측일 lookup이다.

`ganji.year/month`는 API 달력 필드다. 절입 기반 사주 연주/월주가 아니다. 윤달의 빈 월간지는 null로 유지한다. `sunLongitude`는 제공값/null 그대로이고 `expectedLongitude`는 절기 규칙으로 유도했다고 표시한다.

절기 후보는 발표된 벽시계 분만 보존한다. `API_KST_AS_PUBLISHED`, `historicalCivilTime=NOT_RESOLVED`와 `utcInstant=null`을 유지한다. 대한1950의24:00은 원래 날짜와 함께 보존하고 `TIME_NOTATION_REVIEW_REQUIRED`, 계산 시각 null로 남긴다. 기존 명세에서 다음날 전환의 근거가 확인되지 않았다. 1개 대한 이벤트의 실행 시각 해석과 전체24절기 순간 타임라인은 보류된다. 대한은 월 경계의12절입에는 속하지 않지만, 이 사실로 역사 시간 정책을 해결했다고 보지 않는다. 날짜 변환은 계속 가능하다.

## 검증과 경계

공개 `test/kasi-research.test.mjs`는 전부 합성 응답을 사용한다. 입력 변조/출처 변조, null/24:00/황경, 양끝 월, 연도 연결, 지원 범위, 재현성과 네트워크 차단을 검사한다. 불일치/미지원/시각 정책 보류도 실제 결과로 유지한다.

실제 비공개 완료본은 후보 두 개를 생성한 뒤 별도 명령으로 수락 검사를 한다. 아래 검사는 비공개 파일이 없으면 실패하며 공개 전체 테스트에 포함하지 않는다.

```sh
node scripts/kasi/research-verify.mjs .private/kasi-local-1950-2026/monthly-xml .private/first-snapshot .private/second-snapshot
```

양끝 월 보완은 추정상1949-12-20~31과2027-01-01~07이다. 음력2026 전체를 닫으려면 이후12월과 다음 음력 연초 증거도 필요하다. 기존 fixture를 바탕으로 한 계획 구간은2027-01-01~02-07이며 API 관측으로 표시하지 않는다. 연초 절입 guard는1949대설, 다음 경계 증거는2027소한·입춘 및24절기 연속성용 대한이다. 현 Collector는1949를 인자로 허용하지 않으므로 이후 최소 경계 수집 시 별도 범위 검토가 필요하다. 이번 명령은 수집하지 않는다.

기본 엔진/production/Lab/G0에 연결하지 않는다. 기본 지원연도, G1-P2 NO-GO, 기존 annual TXT 판본/권리 미검증을 유지한다. 일진 비교는 기존 날짜 계산기의 범위 내 대조이며 역사 출생시각 포함 명식 검증이 아니다. 구체적 실행 증거는 [이번 보고서](engineering/KASI_RESEARCH_ADAPTER_EXECUTION_20261110.md)에 기록한다.
