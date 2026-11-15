# 서버 전용 API-only 달력 팩 v0.1

`KASI-SERVER-API-ONLY-1950-2027-V01`, schema `manseryeok-server-api-only-data-pack-v1`, version `1.0.0`.

이 팩은 기존 혼합 attachment의 이름을 바꾼 사본이 아니다. 이전에 보관한 **두 API의 실제 XML 응답만** 다시 읽어 정규화하고, 기존 수락 행과 비교한 별도 파생물이다. 원본·후보 a/b·2027 supplement와 기존 v1/v2/v3 계약을 수정하지 않는다. 새 API 요청·키·기관 연락은 없다.

## 자료 범위와 권리 경계

| 입력 | 포함 범위 | 원문 연결 |
| --- | --- | --- |
| `15012679 / getLunCalInfo` | 1950–2026 날짜 28,124행, 월 단위 응답 924개 | 원문 엔티티 SHA, 기존 receipt ID, API 항목 순번, 정규화 행 SHA |
| `15012690 / get24DivisionsInfo` | 1950–2026 절기 1,848행, 응답77개 | 같은 계보 검사 |
| 같은 절기 API의 기존 2027 연간 응답 | 24행, 응답1개 | 기존 boundary 원문에서 별도로 수락한 annual content 지문 |

총 **1,002응답 / 29,996정규화 행**이다. 날짜에서 동일 음력월의 관측 `monthDays`를 묶은 최소 인덱스953개를 제공한다. 새로운 음력 날짜나 2028 경계는 계산해 채우지 않는다. API의 null 월간지와 `24:00` 표기는 보존한다. 자료가 있다는 이유로 1950–2027의 시각 명식 지원을 선언하지 않으며, 별도로 선택한 기존 출생·시계 프로필의 범위를 따른다.

다음은 제외한다: candidate 전체 wrapper의 감사/비교 결과, `comparisons.json`, `exceptions.json`, `run-metadata.json`, 수집 계획·로그·checkpoint, KASA 월력요항 저작물, 연간 TXT, OSS 내장 달력표, fixture/보정표. `manifest.excludedMaterial`에 제외 사유를 남긴다. 기존 candidate loader는 **제작 시 기존 수락본의 동등성을 확인하는 용도**로만 사용한다. 런타임에는 그 파일이 필요 없다.

[KASI 권리 감사](../research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md)의 API 범위에 한해 `VERIFIED_ALLOWED_WITH_CONDITIONS`를 적용한다. 기관/API/연산/조회조건/원문 SHA/고지와 제3자 권리 구분을 유지하는 **서버 내부 저장·가공·계산 사용**이다. 고객에게 달력 팩 파일을 배포하는 행위, 다른 KASI/KASA 저작물, 앱 전체 공개 출시까지 승인한 것은 아니다. `publicFileDistribution=UNRESOLVED`이며 법률가 또는 기관의 개별 승인을 받았다는 뜻이 아니다.

## 파일과 독립 기대 지문

팩에는 아래5파일만 둔다. manifest를 제외한 payload의 byte 수·SHA도 manifest에 기록한다. 추가 파일·디렉터리·symlink·누락·변조를 거절한다.

| 파일 | 내용 |
| --- | --- |
| `manifest.json` | 새 schema, 범위, 고정 upstream pins, 행 수, 계산용 projection 지문, 권리 범위, 제외 자료,4개 payload SHA |
| `calendar.json` | API 날짜·기본 절기·최소 음력월 인덱스·별도 2027 annual content |
| `sources.json` | 허용 기관/API/operation/query/조회시각/응답 형식·결과 코드·원문 SHA와 전체 rowRefs |
| `raw-responses.ndjson` | `{sourceRef,body}`로 연결한 실제 응답 엔티티 1,002개. 요청 URL·헤더·인증정보는 포함하지 않음 |
| `NOTICE.txt` | 제공기관·두 API 목록 URL·사용 범위·고지·미인증 범위 |

| 독립 수락 항목 | 기대값 |
| --- | --- |
| 새 팩 manifest의 canonical content SHA | `a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a` |
| 기존 base manifest content | `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf` |
| 기존 export 원byte | `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851` |
| 기존 boundary content | `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7` |
| 기존 연간 raw의 별도 annual content | `77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b` |

새 지문은 실제 팩의 API whitelist·원문/행 연결·수락 행 동등성을 검토한 뒤 이 계약과 `scripts/server-data/constants.mjs`에 별도 기록한다. manifest 자신에게 적힌 값을 기대값으로 삼지 않는다. 제작 함수는 새 결과를 `BUILT_REQUIRES_SEPARATE_PIN_ACCEPTANCE`로 표시하며, 런타임 로더에는 기대값 override 옵션이 없다. 범위/행/파일을 바꾸면 새 수락 절차와 버전이 필요하다.

## 제작·로딩·기존 계산 연결

```powershell
# 저장소에서 고정 Node22의 $node를 사용한다. 출력은 존재하지 않는 .private 하위 경로다.
& $node scripts/server-data/build.mjs `
  --archive .private/kasi-local-1950-2026/monthly-xml `
  --candidate .private/kasi-research-1950-2026-fe84ab4-a `
  --boundary .private/kasi-2027-boundary-00379e9-20261111-b `
  --out .private/server-data/api-only-v1
```

`loadServerApiOnlyDataPack({directory})`는 startup 시5파일을 검사하고 기존 parser/normalizer로 전체 원문을 다시 처리한다. API·operation·query·응답 schema를 whitelist로 제한하며 원문 SHA, receipt ID, source와 행의 일대일 연결, 정규화 행, production 범위, annual 지문과 projection을 검증한다. 재구성한 불변 객체를 실행 문맥에서 재사용하고 요청마다 디스크/원문을 다시 읽지 않는다.

반환값은 `{manifest,candidate,sources,annualSolarExtension,apiOnlyIdentity}`다. `candidate`는 기존 계산이 소비하는 API 날짜/절기/최소 월 인덱스의 메모리 호환 표현이다. 새 manifest를 과거 snapshot manifest로 위장하지 않는다. identity는 새 데이터셋 ID·팩 지문·원래 base 지문·권리/검증 범위를 구별한다. 2027 annual 객체는 별도이며 해당 프로필을 명시했을 때만 기존 factory에 연결한다.

`binding.mjs`는 순수 canonical fingerprint와 고정 constants만 가져온다. bind/verify 모두 고정 팩 manifest, candidate/source projection, identity의 권리·검증 범위·G0 부재, annual content 지문을 확인한다. 공개 bind 함수에 임의 frozen 더미나 승격된 identity를 넣어서는 발급되지 않는다. WeakMap은 같은 프로세스의 객체 연결을 추가로 확인한다. 고정 수락 내용과 완전히 같은 복사본을 다루는 것은 내용 연속성이며 인증서·발행기관 서명·API 원문 진위의 외부 인증이나 G0 receipt가 아니다. XML 원문/행의 재검사는 로더가 수행한다. 기존 `finalStrength`·계산 범위·G1-P2 상태는 바뀌지 않는다.

## 검증 수준

공개 검사는 합성 XML로 whitelist·행 연결·누락/중복/sparse·SHA/schema 변조·API null/24:00·핀 override 거절·작은 발급 연결을 검증한다. 합성 날짜는 실제 음력 날짜 또는 실제 출생 명식이라고 부르지 않는다.

실제 비공개 검사는 기존 보관 응답 1,002개 재정규화와 29,996행 연결, 기존 수락 날짜/기본 절기 전 행 동등성, 별도 재제작의5파일 byte 동일성, 새 팩만으로의 계산을 구분한다. 이 내부 정합성 검사를 명리 해석 정답률·천문학적 독립 인증·법률 의견으로 표현하지 않는다. 최종 실행 SHA·회귀·독립 패키지 결과는 Sprint5 실행 기록에 남긴다.
