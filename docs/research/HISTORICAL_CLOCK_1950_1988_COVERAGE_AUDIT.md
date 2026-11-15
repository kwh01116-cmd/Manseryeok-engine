# 1950–1988 한국 역사 시계 지원 감사

2026-11-15. **한 연도의 날짜 인덱스, 법정 민간시, API 절기 발표 시계, 실제 시각 명식 지원은 서로 다르다.** 이번 선택은 그 구분을 유지하면서 연속된 검증 묶음부터 제품 경로를 넓히는 것이다. 기존 `KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1`의 ID·의미·1989–2026 결과는 변경하지 않는다.

## 결정과 독립 계산 계약

- 새 시계 정책: `KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1`, version `1`.
- **1962–1986의 한국 법정 민간시 분**은 표준 +09:00/DST0으로 API 발표 KST 분과 비교한다. 최초1962년의 prior guard는1961년12월 대설 한 건이며, 표준시 변경 이후의 보조 이벤트일 뿐1961년 출생 지원이 아니다.
- 다른 시기의 불확실성을 지운 것이 아니다. 1950–1961과1987–1988은 이 출생 프로필에서 채택하지 않는다.1952–1953처럼 +09:00/noDST라는 시계 사실이 비교적 명료한 연도도 **이번 연속 프로필의 검증/채택 밖**이며, 역사 사실 전체가 UNKNOWN이라는 뜻이 아니다.
- 순수 모듈 [`historicalKoreanClockV1.ts`](../../src/time/historicalKoreanClockV1.ts)은 `resolveHistoricalKoreanClockMinute(minute,{policyId})`와 `resolveHistoricalApiEventMinute(minute,{policyId,termCode,role})`를 제공한다. 전자는 허용한 출생 비교 분 또는 구체적 보류/없는시간/중복시간을 반환한다. 후자는1962–1986 연간 이벤트와1961년12월의 실제 `DAXUE` guard를 구분한다. 원문/출처/지문 인증은 로컬 로더의 별도 책임이다.
- 비교 분은 호스트 시간대와 무관한 원래 민간시 분이다. `utcInstant=null`, 정밀도는 MINUTE다. 초·반올림 규칙·±30초·진태양시·경도 보정은 생성하지 않는다. 자시의 유효 일주 날짜는 후속 기존 일시주 정책이 결정하며 시계 모듈이 실제 출생일을 바꾸지 않는다.

이 문서의 시계 정책 GO는 실제 제품 프로필·M2·리포트·독립 artifact 연결 검사를 대신하지 않는다. 최종 실행 SHA·실제 출생 사례·전체 회귀/부분 미실행은 [Sprint4 실행 기록](../engineering/SPRINT4_EXECUTION_20261115.md)에 별도로 기록한다.

## 직접 확인한 자료와 확인 수준

| 자료 | 실제 확인 표면·용도 | 한계 |
| --- | --- | --- |
| [국가기록원: 서머타임제](https://theme.archives.go.kr/next/koreaOfRecord/summerTime.do) | HTML 본문.1961-08-10 표준 자오선135도, 이후 고정 시간제,1987–1988 재실시라는 역사 문맥 | 공식 기관의 후대 설명이며 개별 전환 명령 원문 자체는 아니다. 부수적인 정오 설명을 진태양시 공식으로 채택하지 않음 |
| [국가기록원: 표준시간 복구문제 이유서 BG0000054](https://theme.archives.go.kr/next/chronology/archiveDetail.do?evntId=0049272227&flag=2&page=28&sort=year) |1954-03-21 날짜·127도30분 복구와 문서 provenance를 HTML로 확인 |6면 원문 전체를 독립 판독한 것은 아니므로 정확한 fold 순간을 이 목록으로 확정하지 않음 |
| [국가기록원: 법률676호 DA0000374](https://theme.archives.go.kr/next/chronology/archiveDetail.do?evntId=0049285961&flag=1&isPop=Y) |1961-08-07 공포,8월10일135도와00시→00시30분이라는 법률 내용을 기관 HTML의 직접 인용으로 확인 |14면 원 스캔 전체를 독립 판독한 것은 아니다.1961년12월guard와1962이후 +09 채택의 근거로 사용 |
| [국가기록원:2011년3월 표준시간 변경 기록](https://theme.archives.go.kr/next/monthly/viewMain.do?month=03&year=2011) |1954령876호의1954-03-21 오전00시30분부터127.5도라는 관보 설명을 HTML로 직접 확인 |상단 연혁에는 공포일3/17·8/7도 있으므로 그것을 시행 전환일로 혼용하지 않는다. 원 관보 시계 표기와 IANA 전환의 대조는 미수락 |
| [법률3919호 표준시에관한법률](https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=3771) |오늘 직접 추출은1986-12-31 제정 연혁·표제만 확인.135도 본문은[2026-11-10의 이전 직접 확인 기록](KASI_MODERN_API_CLOCK_POLICY_20261110.md)과 분리해 사용 |오늘 도구 본문에는135도가 추출되지 않았으므로 새 직접 본문 확인으로 세지 않는다.1986 제정문만으로1954/1961의 원명령을 소급 인증하지 않음 |
| [일광절약시간제 제·개정이유](https://law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010202&lsId=004533&lsRvsGubun=all) | 대통령령12136호1987제정,12703호1989폐지,5월/10월 둘째 일요일의1시간 조정 | 법령 별칭 URL 일부는 점검/접속 실패였다. 읽을 수 있었던 연혁 URL을 구별하여 사용 |
| [IANA tzdb2025b `asia`](https://data.iana.org/time-zones/tzdb-2025b/asia) | 고정 release의 `ROK`와 `Asia/Seoul` 규칙 본문.1961-08-10 이후base9시간,1962–1986 DST 전환 없음,1987/1988 전환을 기술 비교 | 법령 원문/한국 기관의 공식 시각 인증이 아니다. 호스트 `Intl`/설치 tzdb로 대체하지 않음 |
| [KASI 호스팅「時變更論」이경, pp53–57](https://harg.kasi.re.kr/pro_plus/down/200307/200307_053-057.pdf) | `현행역법의제문제` 워크숍 기고 PDF5면을 로컬 PNG로 렌더해 **본문·표1·표2를 직접 시각 확인**. URL 경로는200307이고 정확한 간행일의 별도 판권면은 확인하지 않음 | KASI가 호스팅한 연구 기고이며 법령 자체가 아니다. 재수록 신문 그림을 원 신문 전체의 독립 원문 판독으로 세지 않음 |

KASI PDF의 SHA256은 `6afd387ae6ba276bc7a710dfafc324de59f4e409d314acfde89d3e676acfb690`이다. PDF/PNG는 `.private/sprint4-history-20261115/`에만 보관한다. 공개에는 짧은 검토 요약과 URL만 반영한다. PDF 열람/렌더링에는 로컬 `pdf` 스킬을 사용했다. 새 인증 API/키/기존 후보 재수집은0건이며 이 공개 연구 문서 열람은 그 수집과 다르다.

## 발견한 반례와 수락하지 않은 일반화

1. **1950 시작 시각이 일치하지 않는다.** KASI 호스팅 기고의 표2(p57)는3월31일23시→24시, IANA2025b는4월1일00시→01시다. 같은 시계 기준이라고 읽으면1시간 차이다. 종료의 날짜 표기 차이가 모두 같은 순간이라는 이유로 시작 차이까지 없애면 안 된다. 기존 [역사 규칙 등록부](KOREAN_CIVIL_TIME_RULE_REGISTRY.md)의1950 `EXACT`는 당시 연구 기록으로 보존하되 이번 지원 수락에는 사용하지 않는다. 법령 원명령·실제 시계 조정 기준의 추가 대조가 필요하다.
2. **1951과1955–1960도 연도 목록만으로 닫히지 않는다.** 기고는1951 시작을5월6일23시→24시로, IANA는5월6일00시로 기록한다. 기고의1955 이후 일부 종료는다음날01시→00시이고 IANA의24시→23시와 시각 해석을 추가 대조해야 한다. 목록 일치나 날짜명 변환만으로 단일 출생 순간을 만들지 않는다.
3. **1954/1961 표준시 변경은 날짜 오프셋 표만으로 gap/fold가 닫히지 않는다.** 국가기록원 HTML는1954의00시30분부터라는 설명과1961의00→00시30분 인용을 제공한다. 특히1954를 IANA의 단순00시 전환으로 대체해도 되는지는 관보 시계 기준 대조가 필요하다. 기존 `resolveKoreanStandardTime(date)`의 날짜 사실은 유지하지만 그것을 전환일의 단일 민간시→순간 해석기로 사용하지 않는다. 이번 범위는 두 전환일 자체를 포함하지 않는다.
4. **1987/1988 민간시 offset 진단과 출생 명식 지원은 다르다.** 법령 기반 기존 모듈을 재사용해 없는 시간/중복 시간을 구분할 수 있어도, API 발표 시계와 사주 일시주 기준의 전체 연결 검증이 자동 완료되는 것은 아니다.
5. [2000년 KASI 연간 발표](https://www.kasi.re.kr/publication/post/newsMaterial/2008)는 DST 미적용 시각을 명시하지만 그 연간 문서의 표기를 모든 역사 API 연도에 소급하지 않는다.1962–1986은 법정 민간시 자체도 DST0/+09이므로 이 차이가 없는 유한 범위다. API 원문의 `API_KST_AS_PUBLISHED`/`historicalCivilTime=NOT_RESOLVED`를 덮어쓰지 않고 해석 metadata를 추가한다.

## 모든1950–1988년의 자료·지원 조건

아래 API 보유 건수는 기존 고정 candidate a를 읽어 집계했다. 날짜 열은 양력 날짜 행 수이고 그 자체로 독립 역법/시각 인증은 아니다. 모든 연도는24절기 행이 있으나1950대한24:00은 표기 검토 상태다.1950의1949대설 guard는 없다. 그 밖의 prior guard는 각각1행이다.1950년대의 서로 다른 발표/민간시 관례는 전체 연간 자료를 임의로 현행+09로 바꿔 해결하지 않는다.

| 연도 | 날짜 행 | 절기/이전 대설 | 민간시 검토 | 이번 출생 시계 정책 |
| --- | ---: | --- | --- | --- |
|1950|365|24/0;대한24:00|+09/DST 시작 표기 충돌|POLICY_UNRESOLVED;별도 자료 결손|
|1951|365|24/1|+09/DST 시작 시각 재대조|POLICY_UNRESOLVED|
|1952|366|24/1|+09/noDST;이번 연속 프로필 밖|미채택, 별도 연간 연결검증 필요|
|1953|365|24/1|+09/noDST;이번 연속 프로필 밖|미채택, 별도 연간 연결검증 필요|
|1954|365|24/1|+09→+08:30 전환 순간 미수락|POLICY_UNRESOLVED|
|1955|365|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1956|366|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1957|365|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1958|365|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1959|365|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1960|366|24/1|+08:30/DST 종료 해석 재대조|POLICY_UNRESOLVED|
|1961|365|24/1|+08:30→+09;12월guard만수락|출생POLICY_UNRESOLVED|
|1962|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1963|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1964|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1965|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1966|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1967|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1968|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1969|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1970|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1971|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1972|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1973|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1974|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1975|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1976|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1977|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1978|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1979|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1980|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1981|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1982|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1983|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1984|366|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1985|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1986|365|24/1|+09/noDST|RESOLVED_UNDER_POLICY|
|1987|365|24/1|+09/+10;gap/fold 진단 가능|출생POLICY_UNRESOLVED|
|1988|366|24/1|+09/+10;gap/fold 진단 가능|출생POLICY_UNRESOLVED|

이 표의 `RESOLVED_UNDER_POLICY`는 **새 시계 함수의 상태**다. 실제 명식 프로필·분석 리포트·오프라인 artifact 지원 완료 여부와 검증 수는 Sprint4 실행 기록에 따로 적는다. 연간 자료가 있다는 이유로1950–1988전체 GO를 선언하지 않는다.

## 누락·중복·미상 시각과 경계 검사

| 조건 | 실행 결과 | 단일 명식으로 바꾸지 않는 이유 |
| --- | --- | --- |
|1987-05-10/1988-05-08의02:00–02:59|NONEXISTENT_TIME|02→03으로 건너뛴 민간시;03시로 임의 이동 금지|
|1987-10-11/1988-10-09의02:00–02:59|AMBIGUOUS_TIME|+10/DST60 또는+09/DST0의 두 offset 가능성을 보존. UTC 순간/원국을 임의 선택하지 않음|
|그 밖1987/1988 분|POLICY_UNRESOLVED|기존 DST 진단은 가능하지만 이번 출생/API 연결 프로필 밖|
|시각 없음·초·시간대 접미사·24:00·잘못된 날짜|입력 오류|미상을 정오/자정으로 채우지 않고 허용 분 입력과 구별|
|1962–1986의00시·23시·윤일|비교 분을 그대로 반환|자시/시주 천간 기준은 기존 후속 정책의 책임|

[고정 fixture](../../test/fixtures/historical-korean-clock-v1-cases.mjs)는 resolver 작성 전39연도·26경계·잘못된 분9개를 고정했다. LF SHA256 `68e234f611dc923d97c329c07a6cb5ac244cd3d31dae11ad2645379182a1f526`이며 기대값을 resolver 출력으로 생성하지 않았다. [집중 검사](../../test/historical-korean-clock-v1.test.mjs)는 위 단위조건·guard 제한·명시 정책·불변 metadata·UTC/Seoul 분리 프로세스를 다룬다. 합성 경계 분을 실제 출생 가능한 전체 명식이나 원문 API 정답 검증으로 세지 않는다.

**실행:** 최종 소스5개 출처 metadata를 반영한 공유 TypeScript emit 뒤, 고정 Node22.23.3에서 집중 검사 **11/11 PASS**, fail/cancel/skip/todo0을 첫 실행으로 확인했다.39연도 중25년 수락/14년 미채택·보류와26경계 기대를 구별했고 UTC/Seoul 별도 프로세스가 같은 값을 반환했다. 로그는 `.private/sprint4-history-20261115/focused-clock-tests-r1.tap`이다. 첫 대상 실행 전 법률676호의 기관 직접 인용 출처를 metadata의 다섯 번째로 보강했지만 입력·상태·경계 기대·정책 산술은 변경하지 않았다. 빌드 전 읽기 단계의 옛 파일명/예상 경로 조회 실패는 실제 제품/대상 검사 실패로 세지 않는다. 전체 회귀·실제 날짜 명식·최종 테스트 SHA는 root의 실행 기록으로 분리한다.

## 공개 데이터 없는 프로필 연결 검사

[`historical-profile-synthetic.mjs`](../../test/fixtures/historical-profile-synthetic.mjs)는 기존 **가상 달력**1990–2014를28년 옮겨1962–1986의9131가상 날짜와601가상 이벤트(1961대설1+25년×24)를 구성한다. source query/year/id와 날짜/월 그룹을 새로 만들고 각 receipt를 `SYNTHETIC_NOT_KASI_NOT_ACTUAL_RAW_RESPONSE`로 표시해 새 synthetic pin으로 봉한다. 실제 KASI 원문·고정 private pin·실제 음력 정답을 복사/위조하지 않는다. 달력일진 칸은 고정 가상값으로 두어 M1이 그 칸을 기둥으로 쓰지 않는지도 검사한다.

[`kasi-historical-profile.test.mjs`](../../test/kasi-historical-profile.test.mjs)는 **12/12 PASS**, fail/cancel/skip/todo0이다. 최초r1의11/12 중1실패는 loaded index의 함수까지 `structuredClone`한 검사 하니스의 DataCloneError였다. wrapper는 유지하고 candidate/source/manifest 데이터만 명시 복제한 뒤r2에서12/12로 통과했다. 입력·기대·생산 규칙을 바꾸지 않았고 r1/r2로그를 별도로 보존했다.

검사 범위는 명시 clock/범위·1950/1954/1961보류·1987/1988 gap/fold·양음력 의미·입춘2상관 후보·M1실제1회와M2/M3/M4출력 연결·공망·기존Sili에 의존하는M5보류·역사 월운 별도정책 보류·summary/detailed동일 객체·변조/교차결과/잘못된pin거절이다. 네 자시 조합의 기대는 수동으로 고정했다.1962-01-01은 기존 수락 anchor2000-01-07甲子보다13885일 앞선己亥이고 ZI_START의 익일은庚子다.23:30의 시주는 SELECTED_DAY_PILLAR에서 civil己일의甲子/익일庚일의丙子로 갈리며, CIVIL_DATE_DAY_PILLAR를 선택하면 익일 일주라도甲子시를 유지한다. 이것은 별도 천문/음력의 외부 검증이 아니다.

실제 M1 CLI subprocess3개(UTC양력/Seoul양력/UTC음력)는 public fixture만으로 성공했고 두TZ JSON이 같았다. child 환경은TZ만 전달하고 네트워크를 차단했다. 실제 private pin이 필요한 새 extended loader/2027annual 경로는 synthetic pin으로 성공시킨 척하지 않고 위조 거절만 검사한다. 새 extended 리포트의 실제 CLI·실제 KASI 생일·독립 artifact·최종 SHA는 root의 실제 통합 검사로 구분한다. 첫 연결 fixture LF SHA256은 `1e7ba0a3fb73d48d8964277dadc23008107a3d6978324cb494af8fd5e2e6c3eb`이다.

최소 다음 작업은 전체1950년대 강제 지원이 아니라 **1950/1951 원명령의 시계 조정 의미와1955–1960 종료 기준을 원신문·관보 단위로 대조하는 한 묶음**, 또는1987/1988의 API 표준시→기록 민간시·일시주 기준을 분리해 연결하는 묶음이다.1962–1986의 실제 지원은 그 연구의 완료를 기다리게 하지 않는다. 기관 연락·새API 수집·새 기본값·진태양시·상용 출시 승인은 이번 감사에 포함하지 않는다.
