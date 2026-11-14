# 오픈소스 실제 코드 감사와 제품 채택 판단

2026-11-14. 결론은 **D 하이브리드: 자체 M1/M2·KASI 검증 자산 유지 + 검토한 명리 규칙의 선택적 자체 포팅**이다. 외부 달력 엔진 전체를 교체하거나 유료/타사 서버를 런타임에 연결하지 않는다. 이번에는 B 방식으로 가중 규칙을 참고한 별도 LEVEL 2 PoC를 구현했다. 공개 서비스·기본 정책 채택과 외부 자료의 재배포 승인은 별도다.

시작 로컬/직접 조회 원격은 `82587ff6f83624686e3759bda0ea506529f03ed4`, 승인 브랜치는 `agent/kasi-local-1950-2026-20261109`, 사용자 미커밋 변경은 없었다. 조사 도중 원저·모든 학파의 충분조건을 다시 닫는 작업으로 확대하지 않았다. 기존 S1의 좁은 상대 강약 NO-GO는 과거 정책 범위 그대로이며, 새로운 선택형 휴리스틱 후보와 다른 판단이다.

## 1. 고정 코드와 실행 환경

다섯 실제 저장소를 `.private/oss-audit-20261114/repos/`에 복제했다. README뿐 아니라 아래 실제 함수·자료·테스트·LICENSE를 읽었다. 모든 pin은 clone에서 확인한 full SHA다.

| 저장소 | 버전 / 고정 revision | 실행 및 의존성 |
| --- | --- | --- |
| [golbin/ssaju](https://github.com/golbin/ssaju/tree/07b608a778be6dac8669e04b9ab794c441959208) | 0.2.0 / `07b608a778be6dac8669e04b9ab794c441959208` | Node22의 TS 소스 직접 실행, runtime deps0 |
| [glee1228/korean_saju](https://github.com/glee1228/korean_saju/tree/8c81256db10d3179d31f551beacaa69f2ab2fcc5) | 0.3.0 / `8c81256db10d3179d31f551beacaa69f2ab2fcc5` | 기존 Python3.13.13, PYTHONPATH 소스 직접 실행, runtime deps0 |
| [yhj1024/manseryeok](https://github.com/yhj1024/manseryeok/tree/fba3253d7305b8b61189bd78318a7a27ed8c9b09) | 2.0.0 / `fba3253d7305b8b61189bd78318a7a27ed8c9b09` | 기존 TS5.8.3으로 private CJS transpile, runtime deps0 |
| [6tail/lunar-javascript](https://github.com/6tail/lunar-javascript/tree/5c92e62c904ba5cc0b62f032796aeef433702268) | 1.7.8 / `5c92e62c904ba5cc0b62f032796aeef433702268` | Node22 CJS 직접 실행, runtime deps0 |
| [usingsky/korean_lunar_calendar_js](https://github.com/usingsky/korean_lunar_calendar_js/tree/6f988e3f50a424d165b9834f9e28cd3ea962da63) | 0.4.0 / `6f988e3f50a424d165b9834f9e28cd3ea962da63` | 기존 TS5.8.3 private CJS transpile, runtime deps0 |

외부 라이브러리 설치·lifecycle·전역 config 변경은 없었다. TS transpile은 그 저장소의 full typecheck가 아니다. 소스·자료 지문을 고정하고 외부 실행의 네트워크·credential 접근을 제한했다. 앱 수준 guard를 완전한 OS sandbox라고 부르지 않는다.

## 2. 역법과 시간 정책의 실제 구현

| 기능 | ssaju | korean_saju | manseryeok | lunar-javascript | korean_lunar_calendar_js |
| --- | --- | --- | --- | --- | --- |
| 양음력/윤달 | 1900–2099 bit표. 월초 역변환 결함 있음 | bundled 월초 index1900–2050, 끝월30일 가정 | converter1391–2100 packed표; 공개 출생 solar1800–2300/lunar1800–2100 | 삭·중기 천문 계산, 중국 달력 | 한국 packed표, solar1000-02-13–2050-12-31 / lunar1000-01-01–2050-11-18 |
| 연/월 절입 | 소형 태양 황경 근사 | 24개가 있는 KASI연도표, 없으면 Meeus fallback | Meeus + 6tail에서 생성한 보정표 | ShouXingUtil 황경·ΔT, UTC+8 기반 | 미구현 |
| 일/시 | 기준일 간지 순환/시각 산술 | Julian day, 명시 날짜·경도 보정 | 60순환/공개 세 자시 옵션 | Julian day/sect1·2 | 날짜 간지만. 시주 없음 |
| 한국 표준시/역사시 | Intl 정규화와 내부 +9/DST표의 범위가 다름 | 고정 +9, 한국 역사시/DST 미구현 | 공개 `trueSolarTime` opt-in으로 역사 offset/DST 경로 있음. 비교100은 옵션을 생략해 미검증 | 중국 +8 계산, 한국 역사시 정책 없음 | 시각 정책 없음 |
| 자시 | 당일 일주/당일 일간의 시주, 선택 불가 | 23시 시주 일간은 항상 다음날; 일주만 옵션 | midnight=당일/당일, jasi=다음/다음, splitJasi=당일/다음 | sect2 당일 일주, sect1 다음날 일주; 시주는 23시 다음날 일간 | 미구현 |
| 태양시 | 경도 LMT 선택, 균시차 아님 | (경도−135)×4분, 균시차 아님 | 경도·균시차·역사시 코드 있음 | 한국 출생 진태양시 옵션 없음 | 미구현 |
| 분 경계 후보 | 없음 | 없음 | 없음 | 없음 | 해당 기능 없음 |

표의 넓은 입력 허용 범위는 한국 역법·역사시 전체 검증 범위가 아니다. 우리 출생 범위 `[1989-01-01,2027-01-01)`와 시간 정책은 확대하지 않았다. 역사시10건은 외부 값을 실제 실행했지만 우리 기준이 미지원이므로 정답을 판정하지 않았다. manseryeok의 역사시 opt-in 코드를 “없음”이라고 하거나, 기본 경로에서 실제 검사했다고 하지 않는다.

실제 source anchors:

- ssaju `src/manse.ts`: normalizeInput34–49, normalizeBirthDate/Intl/LMT105–293, 음력317–439, 태양 황경/절입 반복473–515, 네 기둥555–630. [코드](https://github.com/golbin/ssaju/blob/07b608a778be6dac8669e04b9ab794c441959208/src/manse.ts#L317-L630). DST표는 `src/constants.ts:9–24`의1960/1987/1988 세 구간이다.
- korean_saju `src/korean_saju/saju/saju.py:Saju.from_birth`, `year_pillar.py:21–44`, `month_pillar.py:33–73`, `solar_time/solar_time_correction.py:13–46`. [`SolarTermSource`](https://github.com/glee1228/korean_saju/blob/8c81256db10d3179d31f551beacaa69f2ab2fcc5/src/korean_saju/calendar/solar_term_source.py#L22-L73)는 결손 시 계산 fallback이 있으며 source label의2000–2027 범위와 실제 개별 이벤트 경로를 혼동하면 안 된다.
- manseryeok [`calculateFourPillars`](https://github.com/yhj1024/manseryeok/blob/fba3253d7305b8b61189bd78318a7a27ed8c9b09/src/index.ts#L252-L291), `src/pillars.ts:55–81`, `src/time/true-solar-time.ts:47–61`. `tools/gen-solar-terms.mjs:13,25–43`와 `src/astro/solar-terms-data.ts:5–9`는 6tail 보정 출처를 밝힌다. 6tail과의0분 비교를 독립 KASI 원문 인증으로 세지 않는다.
- lunar-javascript [`lunar.js`](https://github.com/6tail/lunar-javascript/blob/5c92e62c904ba5cc0b62f032796aeef433702268/lunar.js): Solar64–119, `_computeYear/_computeMonth/_computeDay/_computeTime`642–780, LunarYear2680대, ShouXingUtil2971–3584, EightChar5635대. `ONE_THIRD`와 `qiAccurate`의 +8시간을 고려해 비교 어댑터는 연/월은 같은 KST 순간을 CST로−60분 이동하고 일/시는 KST 벽시각을 유지했다. native 자체의 KST 지원이라고 주장하지 않는다.
- usingsky [`korean-lunar-calendar.ts`](https://github.com/usingsky/korean_lunar_calendar_js/blob/6f988e3f50a424d165b9834f9e28cd3ea962da63/src/korean-lunar-calendar.ts): `setSolarDate`, `setLunarDate`, `getChineseGapja`. 389–420의 연/월 간지는 음력 연/월 카운터이며 입춘·절입 사주 연월이 아니다. 윤달 월간지의 계산값으로 우리 API null816행을 채우지 않는다.

## 3. 기초 분석 기능

| 항목 | ssaju | korean_saju | manseryeok | lunar-javascript | usingsky |
| --- | --- | --- | --- | --- | --- |
| 음양·오행/십성 | 있음, 지지는 본기 | 있음 | 천간·지지 본기 | 있음 | 날짜 간지 문자열만 |
| 장간/장간별 십성 | 장간표 있음 | 여기/중기/본기 표와 분류 | 전체 장간별 분석 없음 | 있음 | 없음 |
| 십이운성 | 봉법/거법 | 있음 | 없음 | 있음 | 없음 |
| 합충형파해/삼합·방합·반합 | 위치 탐색 | 위치 탐색 + 일부 자동 효력 가정 | 관계 그래프 없음 | 달력 정보·일부 합충 API, 우리 위치관계 그래프와 다른 계약 | 없음 |
| 공망 | `calculateGongmang`/format | `xun_gong.py` | `voidBranches` | `getDayXunKong` | 없음 |
| 신살 | 고정 탐색 | `sinsal.py`, `sibisinsal.py` | 없음 | 달력 신살/宜忌. 출생 신살 체계와 동일시 금지 | 없음 |
| 대운 | 순역·인접순서, 정수 기산1–10 clamp | `daewoon.py` | 순역·인접순서, `max(1,round(days/3))` | `getYun`, `getDaYun`, 두 기산 sect | 없음 |
| 세운·월운 | 연/월 라벨; 실제 절입 조회와 다름 | `sewoon.py`, 월운 공개 경로는 별도 확인 필요 | 현재 조회 selector 없음 | `getLiuNian`/`getLiuYue` 라벨 | 없음 |

관련 실제 함수: ssaju `src/analyze.ts`의 tenGod94–111, 장간206–230, 운성257–285, 관계415–674, 대운676–769, 세운784–806, 월운809–838, 공망233대. korean_saju의 같은 이름 모듈과 `saju_analysis.py:88–153`이 실제 실행 연결점이다. manseryeok `src/features/ten-gods.ts:21–82`, `luck-pillars.ts:55–129`가 출생 명식에서 호출된다. 우리 M2는 위치·겹침·규칙/출처 계약에서, M7은 분 유리수·불확실성·명목 기간 정책에서 이미 더 엄밀한 부분이 있다.

## 4. ssaju 강약·격국·용신: 기능은 있으나 정의가 다르다

[`src/analyze.ts:843–913`](https://github.com/golbin/ssaju/blob/07b608a778be6dac8669e04b9ab794c441959208/src/analyze.ts#L843-L913)의 실제 수식은 다음과 같다.

```text
score = 50 +20[월지 대표오행=일간오행]
      +10×같은 표면오행 수 +8×생일간 표면오행 수 −8×극일간 표면오행 수
      +15[월지운성 건록/제왕] −15[사/절/묘]
strong >=70, weak <=30, 나머지 neutral
```

표면 개수는 천간4+지지 대표4이며 일간 자신도 포함한다. 근력·장간 효력·상대 관성·설기/재성의 실제 효과를 계산하지 않는다. 0–100 clamp도 없어 실제2026-06-01은 **145**다.

- `determineGeukGuk`의 입력은 **월간 십성**이다(`analyze.ts:163–165`). score>=85면 종왕격, <=15면 종약격을 먼저 선택하고, 그 외 官/殺·正/偏을 합쳐 관격/재격/인수격/식상격/비겁격으로 분류한다. 기존 M4 월령 본기·기타·투출/경쟁과 다른 정책이다.
- `selectYongsin`은 `constants.ts:263–274`의 일간별 고정3천간 배열이다. strong/종왕은 키weak 배열, 그 외는 strong 배열을 사용한다. 조후·억부·격국 용신을 모두 해석한 결과가 아니다.
- 원문 판본·수치 근거·반례별 예외의 출처를 이 코드에서 찾지 못했다. source가 없다는 것은 실행할 수 없다는 뜻은 아니지만, 고전의 확정 규칙 또는 예측 정확도로 표기할 수 없다.
- native 테스트21/21은 실제 통과했다. 아래 월초 결함이 있는데도 통과하므로 그21개 기대 계약이 전체 달력 정확도를 보장하지는 않는다.

**채택:** 고정표/수식 비교 자료. **미채택:** M1 교체, 월간격국을 기존 M4로 치환, score만으로 종격, 고정 용신 배열과 단정적 운세 prose의 제품 직수입.

## 5. korean_saju 강약·격국·용신의 상세 감사

### 5.1 가중 강약

[`IlganStrengthAnalyzer.analyze`](https://github.com/glee1228/korean_saju/blob/8c81256db10d3179d31f551beacaa69f2ab2fcc5/src/korean_saju/saju/ilgan_strength.py#L87-L264)의 입력은 네 기둥이다.

| 항목 | 실제 실행 규칙 |
| --- | --- |
| 지원 분류 | 같은 오행 또는 일간을 생하는 오행 |
| 지지 | 대표오행만 사용, 월3.5/일1.5/연1/시1 |
| 표면 천간 | 일간 제외 연·월·시 각1. 자체 동오행 근이 없으면0.5 |
| 근 | 지지 대표오행 또는 실제 장간 동오행 존재 |
| 천간합 | 위치·경쟁·월령 조건 없이 오합의 고정 변환오행을 검사. 비지원 변환이면 해당 **천간 문자 전체**의 점수0 |
| 월지충 | 월지가 지원할 때 충 상대가 있으면 **−0.8 한 번**. docstring의−0.5와 다름 |
| 시각 미상 | 시주 없는 경우+1을 보정. 반환 adjustment에는 포함하지 않고 reason에만 표시 |
| 합계/등급 | clamp0–10; >=8.5극강 / >=5.5강 / >=4중화 / >=2약 / 나머지극약 |

별도 `HapChungAnalyzer.strength_adjustment`의 +12/+6/+3/+8 및 음수 보정은 위 0–10 analyzer에서 호출되지 않는다. 두 척도를 섞지 않았다. 得令·得地·得勢 alias도 이 점수 슬롯의 합계이지 독립 효력 판단이 아니다.

장간표는 우리 M2와 다르다. 子壬/卯甲/午丙/酉庚 추가는 같은 원소의 구성원이라 원소 근 presence에는 영향이 없지만, **亥의 戊土 추가**는 흙근을 바꾼다. `戊子·辛亥·庚子·辛亥` 합성 사례는 상류2.0/약, 로컬 장간 정책1.5/극약으로 임계값을 넘는다. 원국의 실제 생일 가능성을 주장하지 않는 독립 정책 반례다.

### 5.2 강약 체계가 두 개다

[`yongsin.py:EokbuClassifier.classify`](https://github.com/glee1228/korean_saju/blob/8c81256db10d3179d31f551beacaa69f2ab2fcc5/src/korean_saju/saju/yongsin.py#L211-L318)는 가중 강약 등급을 사용하지 않는다. 삼합/방합을 곧바로 유효 오행으로 바꾸고, 墓 예외·子午卯酉 premium·득령/득지·ally count 네 경우로 별도3등급을 만든다.

native100에서 가중5등급을3등급으로 단순 대응해도 **17건이 이 억부 등급과 달랐다.** 예를 들어 `癸酉·丁巳·癸丑·戊午`는 가중1.0/극약이나 억부는 巳酉丑을 금으로 바꿔 신강이다. 수식의 다른 정의이므로 같은 강약 API인 것처럼 소비해서는 안 된다.

### 5.3 격국·외격·조후·용신·충돌

| 기능 | 실제 코드/입력/우선순위 | 성격과 채택 판단 |
| --- | --- | --- |
| 격국 | `gyeokguk.py:186–257`, 건록→양일간 양인→월장간 본/중/여의 표면 정확 투출→월지 포함 삼합/방합→본기 fallback | 투출 선택을 `is_seonggyeok=True`로 표시하는 분기는 우리 실제 成格 효력과 다름. 선택 구조 참고 가능 |
| 외격 | `oegyeok.py:178–437`, 본2/중1/여0.5+표면1, 감점30/40/50·30/70/80% 등, >=90진/70가/나머지기각 | 개발자 혼합 수치 체계. 확률이나 원전 확정치 아님. 이번 미도입 |
| 조후 | `johu.py`, 월 계절·한습/난조 개수 및 고정 보정 | 기후 모델이나 객관적 긴급도 아님. 목적·단위를 밝힌 별도 후보 정책으로 향후 검토 |
| 억부용신 | `yongsin.py:473–587`, 별도 억부강약 강→식상/중→관/약→인 | 가중 점수와 같은 판단이라고 하지 않음 |
| 조후/외격 우선 | 진외격 우선, 아니면 한습→화/난조→수, 평탄은 억부. 보조 선택·neutralized 기록 | 우선순위는 실행 가능한 코드지만 효과의 독립 정답 아님. 지침 참고 대상으로 분리 |
| 희기신 | 선택한 용신 원소의 생극 방향에 따른 고정5분류 | 실제 사건 예측·격국用神과 같은 것으로 표시 금지 |

`_canon`의 자평진전/실무 언급은 있지만 각 수치·경계에 판본·페이지·독립 검증이 붙지는 않는다. 현재 pytest12개는 고급 점수의 리터럴 기대값을 충분히 검사하지 않으며 이번에는 pytest가 없어 미실행으로 남겼다. 대신 native100/우리 동일 M1네기둥97/손계산3을 실제 실행했다. 무근·合·月충·threshold의 새 PoC 독립 검사와는 구분한다.

## 6. 라이선스와 자료를 별도 심사

모든 고정 저장소에서 **MIT 코드 LICENSE를 확인**했다. notice 보존 의무와 무보증 조건을 따른다. 새 PoC의 고지는 [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md)에 있다. 외부 코드나 대량 달력표를 운영 소스에 복사하지 않았으며 패키지 의존성을 추가하지 않았다.

| 대상 | 코드와 별개로 남는 자료 문제 | 이번 결정 |
| --- | --- | --- |
| ssaju | 음력 bit표·천문 계수·용신표의 원출처 연결이 불명확 | 달력/해석 전체 이식 안 함 |
| korean_saju | bundled KASI solar2000–2027 672행/lunar1900–2050 1,867월초의 메타 주장, 원 응답·행별 지문·별도 권리 확인 부족 | 코드의 산술 설계만 참고. 자료 불포함 |
| manseryeok | lunar1391–2049 KASI,2050–2100 6tail 혼합. 절기 보정은6tail 생성 | 재배포 자료 승인과 독립 정확성 인증은 미수락 |
| lunar-javascript | MIT 코드 확인. 대규모 천문/역법·宜忌 내장표의 개별 유래·승계 검토 필요 | 계산 대조용, 전체 vendoring 없음 |
| usingsky | KASI 참고표에 감사표시. embedded표의 별도 재배포 근거와 행별 원문 연결 미확인 | 날짜 대조용. API의 윤달 간지 null 보정 자료로 사용 안 함 |

“별도 근거를 이 감사에서 못 찾음”은 불법이라는 단정이 아니다. 반대로 MIT라는 한 줄로 제3자 데이터의 모든 권리를 확인했다고 하지 않는다. 우리 기존 KASI 완료본의 권리·공개 포함 판단도 이번 전략 전환으로 소급 승인되지 않는다.

## 7. 고정100 비교: 산술·정책·미지원의 구분

입력은 일반40/절입20/자시10/역사10/음력10/분석10이다. [고정 입력](../../test/fixtures/oss-audit-100-cases.json)의 SHA는 `d3049e023f27c7605aecc0219353890282ea244dce9ff3653495cc0948338e09`다. 외부 비교 실행 전 동결했고, 실제 가상 입력만 사용했다. 음력10개의 내부 Gregorian 비교 메타데이터 추가는 native 변환 성공을 대신하지 않는다.

우리 현대 지원90입력은 **97상관 후보**다. 표시 분7건은 어느 후보 하나와 같은지 전체 집합으로 비교했고 첫 후보를 강제 선택하지 않았다. 외부 단일 출력이 집합에 속해도 우리처럼 불확실성 전체를 보존했다는 뜻은 아니다.

| 네 기둥 | MATCH | POLICY_DIFFERENCE | IMPLEMENTATION_DIFFERENCE | UNVERIFIED | UNSUPPORTED |
| --- | ---: | ---: | ---: | ---: | ---: |
| ssaju | 77 | 4 | 7 | 10 | 2 |
| korean_saju | 87 | 3 | 0 | 10 | 0 |
| manseryeok | 88 | 2 | 0 | 10 | 0 |
| lunar-javascript | 85 | 3 | 0 | 10 | 2 |
| korean_lunar_calendar_js | 0 | 0 | 0 | 0 | 100 |

MATCH는 이번 입력·정책·후보 집합의 일치이지 정확도 비율이 아니다. converter의 네 기둥100미지원은 달력 변환 기능 실패가 아니다. 역사시10건은 우리 비교 기준 미지원으로 미검증이며 오류가 아니다.

주요 반례:

1. ssaju의 절입 전1분7건은 내부 태양 근사식이 이미 다음 월/연으로 넘어갔다. 같은 절입을 계산하는 구현 차이로 분류했고 수치 수렴 정밀도를 천문 정확도로 바꾸지 않았다.
2. 23시의 당일/다음날 일주·시주 참조 조합이 다르다. `splitJasi`라는 이름을 같다고 설정해도 실제 뜻이 반대일 수 있다. 네 기둥 불일치를 무조건 산술 오류로 세지 않았다.
3. **명확한 계산 오류:** ssaju의 음력 월초 나머지0 처리. lunar2026-01-01→solar2026-02-17→lunar1900-01-01, 윤2025-06-01→solar2025-07-25→lunar2025-01-01 평달. 별도8결함 probe와 고정100의 역변환8건에서 재현됐다.
4. 한국2017윤5월·2012윤3월은 ssaju/6tail 중국 달력에서 미지원이다. 이를 KASI 환산일로 몰래 보충하지 않았다. 2012/2023의 양력→음력 차이도 달력 정책 차이로 분리했다.
5. manseryeok/usingsky 날짜 변환은 현대90/90 KASI 비교값과 같았다. 서로 KASI 계열을 공유할 수 있으므로 독립 출처 두 곳의 인증이 아니다. korean_saju는 native 음력10의 양력 변환만 비교했으며 G→L90일치를 주장하지 않는다.
6. 2026입춘05:02에는 외부 엔진이 서로 다른 기존 후보를 선택해도 둘 다 집합의 원소다. 불확실성을 제거한 정답으로 승격하지 않았다. 토왕 B는 M1 경계가 아니어서 새 원국을 만들지 않는다.

심화 비교는 같은 정의의 오류 검사가 아니다. ssaju/korean_saju와 기존 M3/M4는 다른 규칙을 채택하므로 **POLICY_DIFFERENCE**로 분류한다. 역사시에서 기준이 없으면 UNVERIFIED다. 최초 비공개 비교 초안의 advanced IMPLEMENTATION_DIFFERENCE를 이 의미에 맞게 고쳤고 원본 실행 결과는 바꾸지 않았다. 모든100행/5엔진의 분류는 [공개 요약](fixtures/OSS_AUDIT_100_RESULT_SUMMARY_20261114.json)에 있다. 원본 DTO·출처응답·대량 해석은 비공개다.

## 8. 전략 A/B/C/D

| 전략 | 정확도·검증 | 기능·속도 | 유지보수·의존성·권리 | 기존 호환 |
| --- | --- | --- | --- | --- |
| A 완전 자체 확장 | 기존 근거 보존 용이, Level2의 독립 정답 부족은 동일 | 가장 느림. 이미 있는 정의까지 재조사하면 병목 반복 | 런타임 독립. 모든 규칙/회귀 비용을 직접 부담 | 높음 |
| B 알고리즘 참고 후 자체 구현 | 의미를 명시하고 원문/휴리스틱·독립 산술 대조 가능 | 가중/취격/공망 등 유한 규칙에 빠름 | 코드 고지·참고 출처 유지. 별도 데이터 복사 피할 수 있음 | 어댑터를 좁게 두면 높음 |
| C 버전 고정 코드 내장 | 실행 재현 쉬우나 내장 계산/관습/자료를 함께 감사해야 함 | 초기 기능폭은 큼 | MIT 고지+의존성/데이터 권리/패치 책임. 외부 서버는 필요 없음 | 원래 후보·출처 계약과 충돌 가능 |
| **D 혼합** | 자체 역법과 독립 비교 유지, 명리만 선택 정책으로 추가 | **이번 권고. B 방식의 작은 포팅부터 제품 완성 가속** | 버전·규칙 추적을 우리가 소유. 검증 안 된 corpus/기본값은 미도입 | 기존 프로필 유지 + 별도 결과로 병렬 비교 |

“검증된 OSS 활용”은 전체 엔진에 정답 도장을 찍는 것이 아니라 **검토한 파일·버전·규칙·입력 범위만 채택**하는 뜻이다. 가장 앞선 고급 기능폭은 korean_saju이고, ssaju는 한국어 출력과 기능 묶음은 넓지만 실제 격국/용신 정의가 매우 단순하다. manseryeok은 계산·옵션 참고에, usingsky는 한국 날짜 변환 대조에, 6tail은 천문·중국 역법/시간축 대조에 가치가 있다. 후보·출처·원문 지문·기존 M7 정밀도는 우리 자산을 버릴 이유가 없다.

## 9. 실제 구현한 PoC와 제품 방향

`src/experimental/weightedSupportV1.ts`와 `scripts/experimental/weighted-support.mjs`는 명시 정책을 고르지 않으면 실행하지 않는다. 기존 명식을 요청당1회 계산하고 기존 M2를 검증한 뒤 점수 결과를 별도로 반환한다. 원래 M3/M4 결과 전체도 같은 결과에 남긴다.

정책 ID `EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01` / 0.1.0. 상류의 배점·무근 절반·월지충−0.8을 참고하되 **기존 M2 장간표, 자동 합화 제외, 시각 필수**를 선택했다. 이것은 원상류 복제품이나 고전의 객관적 힘 판정이 아니다. 합화/종격/용신/성격·사건 예측을 추가하지 않았다.

같은 M1의97후보에서 상류 점수와87개 같고10개 달랐다. 10개 모두 자동 합화에 따른 천간 점수 삭제를 제외한 차이로 분해됐다. 亥戊 차이는 이97개에서는 점수 차이를 만들지 않았지만 독립 합성 반례2.0↔1.5에서 확인했다. 비율을 해석 정확도로 표현하지 않는다. PoC의97분류는 극강3/강29/중화6/약33/극약26이며 입력 분포일 뿐 정답률이 아니다.

실제2026-06-01은8.5/극강,2026-01-08은0/극약이다. 후자의 기존 계절 水旺·구성상 물근과 충돌해 보일 수 있으나 점수는 월지 대표 土와 표면 슬롯을 기준으로 하기 때문이다. 이 차이를 숨겨 한 쪽이 참이라고 설명하지 않고 정책별 목적과 입력을 드러낸다. 바로 이 민감도 검토가 제품 기본 정책 고정 전에 필요하다.

[실행 가이드](../EXPERIMENTAL_WEIGHTED_SUPPORT_GUIDE.md) · [최종 검사/실패/보존](../engineering/OSS_ENGINE_COMPARISON_EXECUTION_20261114.md) · [제품 로드맵](../ROADMAP.md).

제품의 새 종료 기준은 **정의된 범위에서 작동하는 정책·반례·설명·회귀**다. Level1의 계산 정확도는 독립 기준을 유지하고, Level2의 선택 규칙은 출처/가정/trace/대안을 갖춰 수락할 수 있다. Level3는 사실·전통 해석·창작을 분리한다. 모든 학파 합의나 현실 예측 증명을 기능 출시 조건으로 요구하지 않지만, 알려진 계산 오류·권리 미확인 자료·숨은 정책을 그대로 넘기지도 않는다.

**처음부터 계속 만들 필요는 없다. 자체 계산과 검증을 보존하고, 검토한 오픈소스의 명리 규칙을 명시적 선택 정책으로 포팅하는 것이 가장 빠르고 안정적인 경로다.** 이번에 제품 전체가 완성됐다는 뜻은 아니며, 다음은 이미 만든 PoC의 제품 정책 고정과 M4/M5의 유한 기능 묶음이다. 후속 기능·UI·LLM·배포를 자동 구현하지 않았다.
