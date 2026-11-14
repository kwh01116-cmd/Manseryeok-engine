# 통합 오프라인 artifact v2 계약

`manseryeok-offline-integrated-engine-v2` / `0.2.0`은 별도 명시 빌더 `scripts/offline/build-v2.mjs`로 만든다. 기존 v1 빌더·네 mode·DTO·데이터/경로 가드의 기본값을 바꾸지 않는다. 신규 product mode는 같은 구조화 결과를 summary/detailed TEXT 또는 JSON으로 제공한다.

## 입력·출력과 런타임

- 제작: 고정 Node22/TypeScript5.8.3·이미 설치된 package-lock 의존성. stale dist를 복사하지 않고 두 tsconfig를 새로 메모리 emit한다.
- 실행·verify·restore: Node22만 필요하다. Git/npm 설치/API키/외부 요청/원본 저장소 import가 필요 없다. 절대 개발자 경로를 산출물에 쓰지 않는다.
- `--mode product --attachment <private-data> --report-profile <explicit-id> --m5-policy <explicit-id> --detail summary|detailed --output json|text`와 기존 달력·출생·시계·일주/시주 정책을 명시한다. M7·월운은 각 명시 선택을 그대로 전달한다.
- product 성공 JSON은 `{schemaVersion:'manseryeok-offline-integrated-result-v2',mode:'product',data:<기존 제품 분석 DTO>}`다. detail은 TEXT 표현만 바꾸고 같은 분석 데이터와 refs를 사용한다.
- legacy mode는 기존 `calculateOffline`의 v1 schema/DTO를 보존한다. 선택하지 않은 점수·M7·M5 대안 정책을 몰래 채택하지 않는다.
- 오류는 기존 INPUT/ARTIFACT/DATA/CALCULATION의 안전한 stderr enum과 비영 종료다. 데이터 부재·지문 오류에 fallback하지 않고 개인 입력/경로/예외 전문을 출력하지 않는다. 기본 파일 저장은 없다.

## 데이터와 지문

artifact에 달력 원문·후보·attachment를 포함하지 않는다. private attachment는 기존 v1의7파일과 별도 descriptor를 사용하고, 고정 base content pin `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`를 원 로더로 검증한다. descriptor 자체에서 읽은 해시로 원본을 승인하지 않는다. 기존 보강 자료를 임의 요구하거나2027/역사시 출생 범위를 넓히지 않는다.

verify는 파일 이름 집합·내용·vendor/라이선스 파일을 검사한다. restore는 존재하지 않는 목적지만 허용하고 symlink·원본/대상 중첩·private 자료의 공개 경로 복사를 거절한다. 이 검사 결과는 내용 일관성이며 발행기관 서명·이용권·예측 타당성의 인증이 아니다. 자료 외부 재배포와 공개 출시는 계속 NO-GO다.

## 기존 XML 파서의 오프라인 포함

기존 M7의 보강 자료 검증 모듈은 schema의 XML parse/normalize 함수를 정적으로 import한다. v1의4개 선언 추출본으로 이 export를 위조하지 않는다. v2는 fresh schema 본문을 보존하고 XML import 하나만 `vendor/fast-xml-parser.cjs`로 다시 연결한다. collector·HTTP client·키 읽기 코드는 포함하지 않는다.

기존 M7 CLI의 `scripts/kasi/local-luck.mjs`에 있는 고정 문자열 `import('./local-luck-projection.mjs')` 한 곳만 v2의 명시 allowlist로 정적 폐쇄에 포함한다. 해당 대상은 artifact의 별도 entry이기도 하다. 임의 문자열·변수·다른 모듈의 dynamic import나 require는 계속 거절한다. v1의 엄격한 import 가드는 변경하지 않았다.

이미 설치된 `fast-xml-parser@5.11.2`의 self-contained upstream CommonJS bundle77,653bytes를 artifact에 복사한다. 고정 SHA256 `fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647`, 외부 import/require0을 검사한다. 운영 소스 Git에 외부 bundle을 복사하거나 npm 다운로드/설치를 하지 않는다. lock 버전/integrity·설치 metadata 지문·원 bundle 지문·라이선스 원문/지문을 vendor inventory에 기록한다.

기존 설치/lock에서 확인한 의존성 고지는 fast-xml-parser5.11.2, @nodable/entities3.1.0, fast-xml-builder1.3.1, is-unsafe2.0.2, path-expression-matcher1.6.2, strnum2.5.1, xml-naming0.3.0, anynum1.0.1의 MIT8개다. 이는 상류가 이미 만든 bundle 안의 각 컴포넌트 빌드 버전이 이 목록과 같다는 인증이 아니다. 검증한 배포물은 고정 SHA의 fast-xml-parser5.11.2 bundle1개이며, vendor inventory는 embedded component version 미검증을 명시한다. 설치된 entities에는 LICENSE 파일이 없어 패키지/lock의 MIT 선언과 [공식 고정 revision의 LICENSE](https://raw.githubusercontent.com/nodable/val-parsers/b89ecb0d419969e2989b74c5304bc9b66931727e/LICENSE)를2026-11-14에 확인하고 고지를 별도 보존했다. 이는 정확한3.1.0 release-tag와의 연결 인증이나 법률 검토 완료를 뜻하지 않는다. [fast-xml-parser5.11.2 LICENSE](https://raw.githubusercontent.com/NaturalIntelligence/fast-xml-parser/v5.11.2/LICENSE)도 설치본과 대조했다.

M5 후보·공망·월운 간지·M4 구조의 존재를 길흉/사건·최종 용신/격국 성패로 승격하지 않는다. 검증 SHA·실제 복원/CLI 결과·지원/보류 분포는 Sprint3 실행 기록에서 별도 보고한다.
