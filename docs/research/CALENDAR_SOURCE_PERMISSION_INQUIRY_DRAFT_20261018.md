# Draft requests to clarify Korean calendar reuse scope — not yet sent

**Status: DRAFT ONLY.** No contact with KASA/KASI, legal counsel or data.go.kr has been made. Send only after owner review, with company/identity details and exact intended licensing/data-handling model. Do not invent permissions or claim an official approval.

## Recipient A: KASA/KASI official monthly calendar publication / data rights

**Suggested subject:** 월력요항 및 달력자료의 사주 서비스 활용·재이용 범위 문의

안녕하세요. 한국어 기반 사주·만세력 서비스를 개발하고 있으며, 절기 및 음양력 정보를 정확한 출처와 함께 사용하기 위해 자료 활용 범위를 확인하고 싶습니다.

2027년 월력요항 공식 공고에는 공공누리 제2유형(출처표시·상업적 이용금지)이 표시되어 있고, 한국천문연구원의 별도 달력자료 페이지는 해당 자료가 공식 공고가 아님을 안내하고 있습니다.

저희 서비스는 사용자 입력 시각에 대응하는 절기명과 한국표준시 발표 분, 음양력 변환을 계산·설명하는 기능을 검토 중입니다. 아래의 이용 형태별 허용 여부와 별도 승인 절차를 문의드립니다.

1. 개별 절기의 날짜·시각과 출처를 이용해 사주팔자의 연주·월주를 계산하는 행위
2. 특정 출생 시각에 대응하는 절기명과 발표 시각을 결과 화면에 한정해 표시하는 행위
3. 매년의 절기·음력 자료를 서버/앱 내부의 정규화된 계산용 데이터셋으로 저장·캐싱하는 행위
4. 정규화된 날짜표나 테스트용 일부 자료를 공개 소스코드 저장소에 포함하는 행위
5. 유료/광고 포함 상업 서비스, 비상업 내부 검증, 무료 공개 베타에서 각각 다른 조건이 적용되는지 여부

공식 월력요항과 별도 달력자료, 공공데이터 API의 이용 조건이 동일한지, 별도 라이선스 또는 신청 절차가 있는지, 필요한 출처표시 문구와 제한 사항도 알려주시면 감사하겠습니다.

검토 대상 링크:
- 2027 공식 공고: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03
- KASI 달력자료: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
- KASI 음양력 API: https://www.data.go.kr/data/15012679/openapi.do

감사합니다.

## Recipient B: data.go.kr / KASI API usage support

**Suggested subject:** 한국천문연구원 음양력 정보 API 상업 서비스·캐시·재배포 조건 확인

공공데이터포털의 `한국천문연구원_음양력 정보` API(데이터 ID 15012679)에 안내된 '이용허락범위 제한 없음'의 정확한 범위를 확인하고 싶습니다. 해당 API가 제공하는 양력·음력 일자, 윤달, 간지, 율리우스 적일 중 유료 사주 서비스에서 서버 계산용으로 활용할 수 있는 항목과 캐시·공개 재배포 가능 범위를 문의드립니다. 24절기의 한국표준시 발표 **시·분 데이터도 이 API에서 정식 제공하는지** 혹은 별도 기관 자료/API가 필요한지 확인 부탁드립니다.

**Checklist after any response**: response date, sender authority, exact dataset and version, license/scope, commercial/advertising status, server-side caching vs client display vs bundled fixtures, third-party redistribution, attribution, correction/removal procedures. Review with appropriate counsel before commercial release when terms are unclear.
