# 1987·1988 한국 DST 출생 시각과 API 표준시 비교 정책 v0.1

2026-11-15. 이번 연구에서 닫는 것은 **대한민국의 기록 민간시를 한국 표준시 분으로 환산하는 유한 정책**이다. 출생 초·진태양시·다른 국가/시간대·1950년대·명리 효력을 인증하지 않는다. 기존 현대 V1과1962–1986 안정 시계 V1의 의미·범위·결과는 그대로 둔다.

## 먼저 발견한 한계와 채택 결정

API의 `kst` 명칭만으로 역사 DST 적용 여부를 확정할 수 없다.2000년 KASI 연간 표가 DST 미적용이라고 명시한 사실도1987/1988 API 전체의 직접 명세는 아니다. 따라서 기존 원 XML 두 응답을 새로 수집하지 않고 읽고, **당대 도쿄천문대의 공식 표준시 표**와 모든48행을 대조했다.

- 1987:24/24 일자·표시분 일치.
- 1988:23/24 일자·표시분 일치. 한로만 API `1988-10-08T10:44`, 도쿄천문대 표 `1988-10-08T10:45`다.
- 두 해의 DST 기간 절기도 +09 표준시 표와 일치한다.1987하지 API07:11은 당시 한국 민간시08:11에 해당하고,1988하지 API12:57은 민간시13:57에 해당한다. API 표를 +10 민간시로 해석하면1시간 차이가 생긴다.

**DECISION:** 선택 API의 분을 연중 +09 표준 KST로 비교하는 정책은 GO다. 한로의1분 판본 차이는 그대로 남기고, API10:44를10:45로 고치지 않는다.48/48분 일치·초 단위 정확성·발행기관 서명 인증이라고 쓰지 않는다. API 분을 선택한다는 구현 관례와 외부 대조의 불일치는 동시에 보존한다. 이 결과를 다른 역사 API 연도에 일반화하지 않는다.

## 실제 확인한 표면

| 자료 | 확인한 내용 | 확인 수준·한계 |
| --- | --- | --- |
|[대통령령12136/12703 제·개정이유](https://law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010202&lsId=004533&lsRvsGubun=all)|1987-04-07 제정,5월/10월 둘째 일요일의1시간 조정과1989-05-08 폐지|공식 HTML 직접 확인. 오늘 법령 본문 페이지에서는 표제/연혁만 추출됐으므로2시/3시 조문을 새 직접 확인했다고 하지 않는다. 기존 법령 검토 기록과 아래 고정 IANA/기존 구현의 전환 시각을 구별한다.|
|[고정 IANA tzdb2025b `asia`](https://data.iana.org/time-zones/tzdb-2025b/asia)|ROK1987–88 May Sun>=8 02시 시작, Oct Sun>=8 03시 종료; Seoul base+09|원문 직접 확인. 법적 권위가 아닌 기술 대조이며 host Intl/설치 tzdb를 실행 의존성으로 쓰지 않는다.|
|[昭和62年(1987)暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko1987.pdf)|표지1986-02-01/東京天文台, 물리p2의24절기와 중앙표준시 표제|공식 기관이 보관한5면 PDF 중 표지·p2를 렌더해 직접 판독. 원 발행기관을 당시의 도쿄천문대로 기록하며 현재 NAOJ가1986년에 발행했다고 표현하지 않는다.|
|[昭和63年(1988)暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko1988.pdf)|표지1987-02-02/東京天文台, 물리p2의24절기와 중앙표준시 표제|공식6면 PDF의 표지·p2를 직접 판독. 한로1분 차이를 보존한다.|
|[NAOJ 시각 용어 해설](https://eco.mtk.nao.ac.jp/koyomi/faq/time.html)|중앙표준시/일본표준시는 UTC+9, 별도의 DST 제도 설명|공식 HTML 직접 확인. 일본의 민간시를 한국의 DST 민간시로 대신 사용하지 않는다.|
|기존 KASI API 원 XML1987/1988|각24행 `kst`와 normalized candidate의 날짜·시각·sourceRef/응답지문 연결|고정 base manifest 로더를 재사용하고 실제 raw byte SHA를 출처 기록과 대조. 새 API 요청·키·원본 변경 없음. API 기관 서명/이용권은 이 함수가 인증하지 않는다.|

PDF SHA256은1987 `722ffc818cdb4834b2dc5cd1b1764e95f61b4799efecb98eb4ca580ac0af8d29`,1988 `8fb421ddf7973e544b68f4089c200d0539cb3576dc9fcaa0be698a442da3ae07`이다. PDF/PNG·기존 raw 연결/48행 비교 영수증은 `.private/sprint5-history-20261116/`에 보관하며 공개에는 원문 전체를 복사하지 않는다. `term-clock-basis-receipt.json`은47일치/1차이와 각 실제 원응답 지문을 남긴다. 공개 PDF 다운로드2건과 웹 열람은 있었고, KASI 인증 API 요청/키/기관 연락은0건이다.

기존 [역사 시계 감사](HISTORICAL_CLOCK_1950_1988_COVERAGE_AUDIT.md)의 KASI 호스팅「時變更論」표2(p57)도1987/1988의02→03/03→02를 뒷받침하지만 연구 기고는 법령 원문이 아니다. 다른 기고 전사의10/1·10/19 같은 의심 표기를 이 구현의 전환표로 복사하지 않는다.

## 정책과 입력 계약

- 시계 ID: `KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1`, version `1`.
- 프로필 범위: 기록 한국 민간시 `[1987-01-01T00:00,1989-01-01T00:00)`.
- 필수 입력: Gregorian 분, `jurisdiction:'KR'`, `timeZone:'Asia/Seoul'`, `dayHourReference:'STANDARD_KST'`, 정확한 시계 정책 ID.
- 생일의 시계가 당시 법정 한국 민간시라는 입력 전제다. 외국 출생·이미 DST를 제거한 기록·장소/시각 불명은 이 경로의 지원 조건이 아니다. 경도/균시차를 적용하지 않으므로 한국 도시 차이를 진태양시 보정으로 만들지 않는다.
- 추가 fold 정보: `foldOffsetMinutes:540|600`만 허용한다. 중복 시간이 아닌 입력에 이 옵션을 주거나 유효하지 않은 offset을 주면 오류다. 근거 없는 자동 첫 후보 선택은 없다.

법정 민간시 환산은 시간 사실이고, 일주/시주의 입력도 표준 KST를 쓰는 것은 **PROJECT_POLICY인 명리 참조 시계 선택**이다. 이 정책은 기록 민간시 자체를 일시주에 쓰는 대안을 동시에 지원하지 않는다. 소비자는 다른 명리 참조를 원할 때 별도 명시 정책이 필요하며, 옵션 누락을 숨은 기본값으로 채우지 않는다.

| 입력 상태 | 출력 | 계산 참조 |
| --- | --- | --- |
|일반 표준시|RESOLVED_UNDER_POLICY|민간시 그대로 KST, UTC분=민간시−540분|
|일반 DST|RESOLVED_UNDER_POLICY|KST=민간시−60분, UTC분=민간시−600분|
|봄02:00–02:59|NONEXISTENT_TIME|가능 순간/명식0.03시 또는 표준시로 임의 이동하지 않음|
|가을02:00–02:59, 추가 offset 없음|AMBIGUOUS_TIME|+10/+9의 두 표준시·UTC분 대응을 보존, 단일 명식 없음|
|가을 중복 분+명시 offset|RESOLVED_UNDER_POLICY|해당 대응만 계산하되 원래fold와 두 가능 대응을 계속 보존|
|1962–86·1989이후 등 범위 밖|OUTSIDE_POLICY_SCOPE|다른 정책으로 fallback하지 않음|
|정책/관할/시간대/기준 누락·오류,24:00/초/잘못된 날짜|입력 오류|그럴듯한 명식으로 복구하지 않음|

전환은 기존 `koreanDst.ts`의 대통령령 기반 표·resolver를 재사용한다.1987-05-10/1988-05-08 02→03,1987-10-11/1988-10-09 03→02다. 독립 새 DST표나 tzdb 패키지는 만들지 않았다. Gregorian 분 이동도 기존 `gregorianDayNumber`/`gregorianDateFromDayNumber`를 재사용한다.

`utcMinute`는 선택한 시간 정책의 분 대응이며 실측 출생 순간/초가 아니다. `utcInstant`는 null을 유지한다. DST 제거 후 날짜가 바뀔 수 있다. 예:1987-06-01 민간00:30은 표준1987-05-31 23:30이며, 네 기존 자시 정책은 그 **표준 날짜/시각**에 적용한다. 원래 입력 날짜를 음력 환산 날짜와 혼동하거나 DST를 두 번 제거하지 않는다.

## 순수 함수·후보·자료 계약

[`koreanDstClock1987V1.ts`](../../src/time/koreanDstClock1987V1.ts)의 `resolveKoreanDstClockMinute1987To1988`은 민간시 원문·표준 비교분·일시 참조분·UTC분·offset 후보·원래fold 상태를 따로 반환한다. 선택 후에도 `originalCivilStatus=AMBIGUOUS_TIME`, `isAmbiguousCivilMinute=true`와2대응을 유지한다.

`resolveKoreanDstApiEventMinute1987To1988`은1987/88 연간 이벤트와1986/87년12월 실제 DAXUE guard만 해석한다.1986대설을 허용해도1986년 출생 범위가 생기지 않는다. sourceRef/정규화 원문/manifest는 로컬 로더가 검증한다. 순수 함수는 원문 진위를 인증하지 않는다.

[`koreanDstFourPillars1987V1.ts`](../../src/calendar/koreanDstFourPillars1987V1.ts)는 기존 full-year coverage, 연월주, 일시주 resolver를 조합한다. `recordedBirthKstMinute`와 `normalizedBirthKstMinute`는 표준 비교분, `recordedBirthCivilMinute`는 기록 원민간시다. 기존 M2가 계산 참조로 쓰는 필드에 DST 벽시계를 넣지 않는다. 입춘 표시 분의 두 연월주 후보는 기존 상관 구조 그대로다. gap/fold의 시계 후보와 절입 후보를 무관한 Cartesian product로 늘리지 않는다.

1988-10-09 민간02:30의 두 offset을 각각 선택하면 같은 네 기둥이 나올 수 있다. 이것은 시간 불확실성이 없어졌다는 뜻이 아니다. offset 미선택 요청은 같은 팔자가 예상되더라도 AMBIGUOUS_TIME으로 남고 명식을 발급하지 않는다.

## 독립 기대와 검증 구분

[고정 fixture](../../test/fixtures/korean-dst1987-clock-cases.mjs)는 구현 전에 도쿄천문대48분·한로1분 반례·23경계·fold2개 UTC 대응을 리터럴로 고정했다. source LF SHA256은 `0b03fe4ab84346440eac91505570cbf68f15064e8a6118379fa28be6e20f482b`이다. DST 단위 입력을 완전한 실제 출생 명식으로 표시하지 않는다.

[집중 검사](../../test/korean-dst1987-clock.test.mjs)는 전환 전/동분/후·없는시간·fold추가선택·같은팔자/다른순간·자정날짜 이동·네 자시 조합·입춘/여름절입의 상관 후보·필수 정책/관할·source/coverage 변조·두 host TZ를 다룬다. 합성 source ID/guard를 사용하는 composer 단위 검사는 실제 API 원문 검증과 다르다. 독립2000-01-07甲子 anchor의 수동 날짜 차이로1987-05-31庚辰/익일辛巳와1988-10-09丁酉를 고정했다.

전체 로컬 어댑터·실제 양음력·두 연도 날짜/절입 전수·독립 artifact와 최종 실행 SHA는 Sprint5 실행 기록에서 별도 수락한다. 공개 표준시 비교의47/48을 명리 해석/현실 예측 정답률로 표시하지 않는다. 기존 전체 회귀·원본 지문·기본 정책 보존도 별도 검증이다.

개발 중 실행:2026-11-15, 고정 Node22.23.3/TS5.8.3에서 새 소스의 `tsc --noEmit`이 통과했고 공유 emit 뒤 위 집중 검사 **12/12 PASS**(fail/cancel/skip/todo0)를 첫 실행으로 확인했다. 로그 `focused-clock-tests-r1.tap`와 소스별 지문 `focused-clock-receipt-r1.json`은 위 private 폴더에 있다. 폴더 이름의20261116은 증거 라벨이며 실제 확인·실행일은11월15일이다. 공개 PDF의 첫 일반 다운로드는 sandbox 소켓 제한으로 실패했고, 승인된 동일 공개2URL의 제한된 다운로드 뒤 로컬 렌더에 성공했다. 이는 인증API/제품 실행 실패가 아니다. 잘못 추정한 파일/배열 경로의 읽기 조회 실패도 대상 테스트 실패로 세지 않는다. 최종 커밋 SHA의 전체 검증과 이 dirty 개발 중 집중 검사를 구분한다.

이후 [새 DST 프로필 연결 fixture](../../test/fixtures/kasi-dst-profile-synthetic.mjs)와 [어댑터 검사](../../test/kasi-dst-profile.test.mjs)를 추가했다. 기존 Sprint4 fixture를 수정하지 않고731가상 날짜/49가상 이벤트/별도 synthetic pin을 만들고, 독립7명식 리터럴·양음력 연결·M1한번·M2/M3/내격8/공망·후보참조·변조·두TZ subprocess를 확인했다. 이 **11/11 PASS** 역시 첫 대상 실행이고 실제 KASI 음력 정답 검사가 아니다. fixture LF SHA는 `742cfb5812b6efd290da942ba46536f8bc1b5972d4ba14c255cfba350d4cbdcd`다.

그 뒤 같은11개 검사에 정상/gap/fold 모두의 알 수 없는 policy 필드 거절과 subprocess 내부 실제 양음력 비교를 보강해 r2에서도11/11 PASS를 확인했다. 기존 기대·검사 의미를 낮추거나 실패를 skip한 변경은 아니다. r1/r2 로그를 각각 보존한다.

실제 API-only 고정팩을 계산 입력으로 쓰는 UTC 소파일럿도 통과했다.7개 독립 리터럴을 API일진과 손산술로 대조하고14제품 요청/M1한번,64일시 양음력쌍·72태양이벤트쌍·56전환쌍을 검사했다. M1진입415에는 성공382·없는시간12·미선택fold12·입력오류8·범위밖1이 포함된다. source dependency114파일·기존 원본4트리는 전후 불변, API/네트워크/키/자격 읽기는0이었다. 기본GC/heap변경0에서 process max RSS740672KiB를 기록해 최종 두TZ 대규모 검사는 순차 실행한다. 이 검사에서 원본은 별도 일진 oracle/보존 검사용으로 읽었으므로 **팩 외 파일 접근 차단 검증**으로 세지 않는다. 그 차단 검사는 별도 실행의 책임이다. 파일럿 영수증은 `dst-pilot-dependency-r1-UTC/receipt.json`이며 최종 SHA 전수와 구분한다.

최종 driver를 준비하며 원본 로더의 전체 중복 index를 계속 붙들지 않도록 필요한 일진/음력 oracle만 compact map으로 보존했고1989 연결의 음력 입력도 추가했다. 같은 UTC 소파일럿 r2는16.3초 PASS, 동일 의미 지문 `b55fa127564d87e0a837295e7b6cffdda8d3f244d9ba9fecb78f64986002fd71`와 기존 단위를 유지했고1989 연결은2호출로 늘었다. max RSS649528KiB, heap 제한 변경/명시 GC는0이다. 한 번의 RSS 차이를 성능 개선율이나 모든 환경의 상한으로 표현하지 않는다. r2 영수증도 별도 보존했다. 최종 전수는731일×2시각×4정책의5,848양음력쌍,48태양이벤트의576쌍(Jie288/중기288),gap/fold60분 범위를 분리하도록 준비했으며 이 문서 작성 단계에서 아직 실행하지 않았다.
