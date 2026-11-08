# 1950~2026 로컬 수집 실행 패키지 — 2026-11-09 KST

## 승인 범위와 출발점

사용자는 기존 프로젝트 인수인계 후 로컬에서 KASI API의 1950~2026 자료를 전체 수집할 시스템 준비를 요청했다. 원격 승인 기반 브랜치 `agent/m1-applied-jie-slice1-20261019`의 실제 HEAD **27903fbc53ba15f322b108357368ea4498c15d46**를 읽었다. AGENTS, 최신 EXECUTION_HANDOFF, Collector/CLI/웹/오프라인 intake 코드를 확인하고 파생 작업 브랜치 `agent/kasi-local-1950-2026-20261109`에서 작업했다. 이전 `/workspace/Manseryeok-engine`의 초기 main 기반 Python 변경은 보존하고 사용하지 않았다.

현재 요청은 로컬 수집 준비이며 Cloud API 장애 재진단, 실제 대량 수집, 원본 승격, 엔진 지원 연도 확대, M2 변경이나 배포 요청이 아니다. 이번 작업의 실제 인증 API 요청/수집은 **0건**이다.

## 구현

기존 TypeScript `Client/Collector/Store`를 그대로 호출하는 `scripts/kasi/local.ts`를 추가했다. 별도 달력 엔진이나 새 정규화 규칙은 만들지 않았다. 1950·2026의 두 서비스 probe→두 연도 전체 collect→sampleGate→명시적 전체 범위 선택→77년 collect→77년 offline validate→export 순서다. 대량 플래그가 없는 비대화형 collect는 저장/요청 전 거절한다. 대화형은 키 숨김 입력 후 표본 완료 시 `1950-2026`을 직접 입력해야 전체 수집한다.

기본 monthly/xml과 명시적인 daily/json 선택을 별도 저장 경로로 나눈다. 77년, 절기 1,848행, 양력 일별 음양력 28,124행의 완료 건수를 검사한다. 전체 성공 전에는 export하지 않는다. 새 실행은 summary의 이전 COMPLETE를 무효화하고 IN_PROGRESS를 기록하며 실패하면 가능한 경우 FAILED와 안전한 코드만 남긴다. 예전 export는 보존하므로 현재 summary의 COMPLETE와 원문 재검증을 함께 확인해야 한다.

기존 `atomicWrite`는 파일 fsync와 rename 후 디렉터리를 열어 fsync했다. Node의 네이티브 Windows 디렉터리 열기 제약 때문에 Windows에서는 파일 fsync/rename을 유지하고 디렉터리 fsync 단계만 생략했다. POSIX 경로는 유지한다. POSIX와 같은 전원 손실 영속성을 Windows에 보장하지 않으며 지문 재검증은 유지한다.

숨김 터미널 입력은 값/길이/URL을 기록하지 않는다. Ctrl+C와 EOF는 AbortSignal로 종료하며 heartbeat 때문에 종료가 막히지 않도록 했다. 자격은 입력한 공통키로 두 서비스에 전달하며 별도 승인 자체는 검증하지 않는다. 비대화형은 기존 공통키/선택 override 계약을 유지한다.

## 정확한 실행 증거

**실행자: 이 작업의 Codex. 정확한 코드/테스트 SHA: 9ad130513a25ab4b103185bf4c238b20b1f9526b.** 이후 문서 커밋과 구별한다.

| 검사 | 실제 결과 |
|---|---|
| 런타임 | Node 22.23.3, npm 10.9.9, TypeScript 5.8.3 |
| 고정 설치 | `npm ci --no-audit --no-fund`, lock 변경 없음 |
| 전체 `npm run check` | **362/362 PASS**, 실패/취소/skip/todo 0; 기존 352 + 신규 10 |
| 전체 범위 모의 실행 | 1,001개 성공 응답으로 77년/1,848절기/28,124일, 최종 검증/export 통과 |
| 재실행 및 offline | 추가 네트워크 요청 0으로 캐시 재개/전체 재검증 통과 |
| 실패 반례 | 명시 플래그 없음, 시각 누락, 표본 실패, 1951년 중단, 미완성 offline 검사, 이전 COMPLETE 무효화, 무단 옵션 거절 |
| Windows 저장 분기 | Linux에서 win32 분기를 주입해 기존 파일 교체/임시파일 정리 검사; native Windows 실기 아님 |
| Linux pseudo-TTY | 합성 키 붙여넣기 시 echo 없음, Ctrl+C/EOF 종료 모두 PASS |
| 실제 Chromium Lab | Chromium 154.0.8037.57 EP0–EP4 PASS |
| 실제 Chromium KASI 웹 | 최초 Lab과 동시 실행 시 다운로드 확인 1회 실패; 브라우저를 모두 종료한 뒤 단독 실행에서 다운로드 포함 PASS. 동시 실행 자원 경합은 가설이며 원인은 확정하지 않음. 테스트/화면을 변경하거나 assertion을 낮추지 않음 |

모든 서비스 응답은 합성 fixture이며 실제 역법 oracle이 아니다. 실제 사용자 인증키/생년 기록은 테스트에 사용하지 않았다.

## Windows x64 배포물 조립

`scripts/package-kasi-local.py`는 깨끗한 Git checkout과 공식 Node ZIP/SHASUMS256.txt를 받아 버전·SHA를 확인한 뒤 런타임, 라이선스, 고정 production dependency 전체, 빌드된 Collector, 실행 파일/설명서를 묶는다. 개발 의존성·원문/키·`.private`·`.git`·개인자료는 제외한다. 네이티브 `.node` 의존성이나 예상 밖 symlink를 발견하면 중단한다. 바이너리는 Git에 커밋하지 않는다.

공식 런타임: https://nodejs.org/dist/v22.23.3/node-v22.23.3-win-x64.zip

공식 SHASUMS256와 일치한 SHA-256: `2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71`.

ZIP 내부 BUILD_INFO에는 source commit/runtime digest를 기록하고 ZIP 옆에 `.zip.sha256`을 만든다. 실제 산출물 SHA는 해당 파일과 작업 결과를 기준으로 한다. 깨끗한 소스에서 `npm ci && npm run kasi:build` 후 공식 파일을 제공해 조립한다. Windows 실행 전에 전체 압축 해제가 필요하다.

## 남아 있는 검증과 다음 작업

Native Windows CMD, 실제 콘솔/붙여넣기, 백신/파일 잠금/전원 손실, 해당 사용자의 두 서비스 승인·quota, 1950~2026 라이브 범위/응답 형식/페이지 계약은 **UNVERIFIED**다. 실패 시 원문 체크포인트를 보존하고 기존 intake로 실제 응답을 조사해야 한다. 모의 성공을 이유로 엄격한 시각/황경/연속성 규칙을 완화하지 않았다.

M1/G0/G1/M2/기존 Lab와 fixture는 그대로다. 원본 0/86, 파일 지문 0/3, rights UNVERIFIED, P2 NO-GO는 유지한다. 첫 로컬 실험은 이 패키지의 1950·2026 표본이며, 두 연도가 완전 검증될 때까지 전체 요청은 시작하지 않는다.

전달은 파생 작업 브랜치와 비공개 로컬 실행 ZIP이다. workflow의 실제 트리거는 foundation 선택 경로 push뿐임을 확인했다. Actions dispatch/rerun, main/foundation 변경, PR 병합, 공개 호스팅은 하지 않았다.
