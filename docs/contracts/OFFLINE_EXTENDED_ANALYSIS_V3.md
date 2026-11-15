# 선택형 확장 오프라인 계약 v3

`manseryeok-offline-extended-engine-v3` / `0.3.0`. 새 `scripts/offline/build-v3.mjs`로 제작한다. 기본 v1/v2 빌더·실행 계약을 대체하지 않는다. 기존 v2의 XML parser 고정 bundle/고지와 fresh compilation을 재사용하며 vendor helper의 export 외 기존 v2 계산 의미를 바꾸지 않는다.

## 명시적 실행과 지원 범위

- 새 mode는 `extended-product`다. `KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01`과 새 달력/시계 프로필을 명시한다.
- `kasi-api-1962-1986-standard-local-v1`은 별도 역사 표준시 프로필이다.1950–1988 전체 지원으로 표시하지 않는다. 해당 범위의 양력/음력 지원은 실제 선택 정책과 보유 날짜 인덱스를 따른다.
- `kasi-api-1989-2027-solar-local-v1`은 별도 현대 확장 프로필이다.2027은 기존 API 연간 절기 원문 재사용과 Gregorian 날짜 산술을 연결하며 **2027 음력 인덱스를 만들지 않는다**. 필요한 자료가 없으면 `NEEDS_DATA`, 시계 정책 밖이면 `POLICY_UNRESOLVED`를 보존한다.2028 입춘까지의 자료를 추정하지 않는다.
- 같은 wrapper의 기존 `product/chart/explain/evidence/experimental` mode는 v2의 parse/calculate/render를 호출해 기존 DTO를 유지한다. 확장 정책을 이 mode들의 숨은 기본값으로 만들지 않는다.
- 확장 성공/부분 결과는 `{schemaVersion:'manseryeok-offline-extended-result-v3',mode:'extended-product',data:<발급된 확장 보고서>}`다. summary/detailed TEXT는 동일한 구조화 결과를 사용한다. 기존 mode의 wrapper/schema를 v3로 몰래 변경하지 않는다.
- stdout은 JSON/TEXT 결과만 출력한다. 입력/자료 오류는 고정 phase/code stderr와 종료1이며, 명식이 `NEEDS_DATA`/`AMBIGUOUS_TIME` 등으로 보류된 경우 원 상태를 JSON/TEXT에 보존하고 종료2다. 출생정보 저장·외부 LLM·현재 PC 시각 추정은 없다.

## 데이터와 독립 기대 지문

엔진에는 달력 corpus를 포함하지 않는다. 기존 base의7파일은 attachment의 `base/`, 기존2027 boundary의5파일은 `boundary/`로 **원byte 복사**하고 별도 v3 descriptor를 root에 둔다. 원본 candidate/manifest/보강은 수정하지 않는다. 파일 집합·내용·symlink/경로 중첩/추가 파일을 검사한다.

| 범위 | 독립 수락 기대값 |
| --- | --- |
| base manifest content | `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf` |
| 기존 boundary content | `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7` |
| 같은 boundary5파일의 원byte 트리 | `47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9` |
| 기존 연간 raw24행의 새 선택 content | `77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b` |

descriptor에서 읽은 해시를 새 수락 기대값으로 삼지 않는다. 원래 candidate loader·기존 boundary loader·새 annual solar loader를 다시 호출해 각 고정 기대값을 확인한다. 추가 절기·새 연도·API URL/key를 인자로 주입할 수 없다.

새 descriptor의 권리 표시는 **API-only 내부 사용 `VERIFIED_ALLOWED_WITH_CONDITIONS` / 전체 attachment 배포 `UNRESOLVED` / `PRIVATE_NO_REDISTRIBUTION`**이다. [권리 감사](../research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md)의 범위 분리이며 법률가·기관의 개별 승인이나 앱 공개 출시가 아니다. 기존 v1/v2의 권리 필드와 원본의 미검증 표시를 소급 바꾸지 않는다.

## 제작·복원·보존

- 제작에는 기존 Node22·TypeScript5.8.3·잠금 의존성이 필요하다. stale dist 대신 메모리에서 새로 컴파일하며 선택한 고정 module closure만 포함한다. HTTP collector·fixture fallback·외부 package import·임의 dynamic import는 포함하지 않는다.
- 런타임/verify/restore에는 Node22만 필요하다. npm 설치·Git·KASI키·실시간 API·원본 저장소 import가 필요 없다.
- XML parser는 기존 v2의 fast-xml-parser5.11.2 고정 bundle과8개 MIT 고지를 재사용한다. [기존 vendor 확인 한계](OFFLINE_INTEGRATED_ANALYSIS_V2.md)를 그대로 유지한다.
- restore는 존재하지 않는 새 경로만 허용하고 engine과 data의 경로 중첩·원본 중첩·symlink를 거절한다. 자료 복원 목적지는 `.private` 경로여야 한다.
- 기존 발표 분 대안과 자시 네 정책을 보존한다. 자료 부재/시계 미지원·강약/효력 보류를0이나 확정 단일 명식으로 바꾸지 않는다.

```powershell
# 고정 Node22의 $node와 저장소 위치에서 제작한다. 각 --out은 새 경로여야 한다.
& $node scripts/offline/build-v3.mjs --out .private/sprint4-package/engine
& $node .private/sprint4-package/engine/attach.mjs --candidate .private/kasi-research-1950-2026-fe84ab4-a --boundary-supplement .private/kasi-2027-boundary-00379e9-20261111-b --out .private/sprint4-package/data
& $node .private/sprint4-package/engine/verify.mjs --artifact .private/sprint4-package/engine --attachment .private/sprint4-package/data
```

실제 최종 제작·외부 디렉터리 복원·JSON/TEXT 실행 수·실패·검증 SHA는 Sprint4 실행 보고서에 기록한다. 이 계약 파일의 존재만으로 실행을 PASS 처리하지 않는다.
