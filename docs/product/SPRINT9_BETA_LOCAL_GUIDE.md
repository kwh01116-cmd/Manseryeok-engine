# 가상 명식 읽기 연구실 실행

Node 22, 기존 잠금 의존성 및 승인한 API 전용 서버 팩이 있는 내부 개발 PC용이다. 화면은 [http://127.0.0.1:8789](http://127.0.0.1:8789)에서 열린다. 구매 연습 화면은 기존 8788을 사용한다. 브라우저는 자신의 컴퓨터에서만 접속한다. 연구 화면에 실제 출생정보를 넣을 곳은 없다.

## 새 연습 열기

아래를 저장소에서 PowerShell로 실행한다. 기존 빌드가 준비된 경우 컴파일 두 줄은 생략할 수 있다. 연습마다 새 상태 폴더를 사용하면 다른 참가자와 이전 초대를 혼동할 일이 없다. 데이터팩과 상태 폴더는 분리한다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$s9Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$s9Pack = '.private/sprint5-20261115/api-only-pack-review-a'
$s9State = '.private/sprint9-practice-' + [Guid]::NewGuid().ToString('N')
& $s9Node node_modules/typescript/bin/tsc -p tsconfig.json
& $s9Node node_modules/typescript/bin/tsc -p tsconfig.kasi.json
& $s9Node scripts/beta/operator.mjs issue --state-dir $s9State --role READER --arm BLIND --fixture F03 --out reader.json
& $s9Node scripts/beta/operator.mjs issue --state-dir $s9State --role READER --arm REPORT_ONLY --fixture F04 --out sparse.json
& $s9Node scripts/beta/operator.mjs issue --state-dir $s9State --role EXPERT --fixture F07 --out expert.json
& $s9Node scripts/beta/web.mjs --mode INTERNAL_QA --data-pack $s9Pack --state-dir $s9State --port 8789
```

1. 운영자 전용 로컬 폴더 `$s9State/operator-output` 안에서 해당 초대 JSON의 `token`을 확인해 화면에 입력한다. URL·채팅·동기화된 클립보드에 옮기지 않는다. 응답에는 합성 문장만 작성한다. 사용한 초대 원문 파일은 운영자가 정리한다.
2. **F03 독자**는 세 글의 구체성과 해당 사례에 맞는 정도, 구별한 이유를 먼저 답한다. 비교 응답을 확정해야 여섯 장을 읽을 수 있다. 전체 평가를 마치면 각 글의 출처가 공개된다.
3. **F04 본문 독자**는 제한적 역할 해석이 전부 보류된 명식을 읽는다. 블라인드 결과와 다른 그룹으로 집계한다. **F07 전문가**는 DST로 존재하지 않는 시각에서 해석을 제공하지 않은 처리가 적절한지 검토한다. 다른 배정을 열 때는 별도 임시 브라우저 프로필을 사용한다. 한 독자의 세션을 다른 사람에게 넘기지 않는다.
4. 응답을 저장하고 새로고침해 이어 읽는다. **참여 중단과 응답 삭제**를 열어 철회할 수 있다. 자료가 변경됐다는 오류가 뜨면 평가를 섞지 말고 운영자가 버전과 새 배정을 확인한다.
5. 서버를 중지한 뒤 아래 명령으로 내부 모의 응답을 확인한다. 재실행 시 같은 상태 폴더를 사용한다. 서버 실행 중 운영 명령이 하나의 원장을 동시에 열 수 없다. 초대 취소와 참가자 삭제가 급하면 먼저 수신을 중지한다.

```powershell
& $s9Node scripts/beta/operator.mjs aggregate --state-dir $s9State
& $s9Node scripts/beta/operator.mjs purge --state-dir $s9State
# 자유 서술을 포함한 사본이 실제로 필요한 운영자만 실행한다.
& $s9Node scripts/beta/operator.mjs export --state-dir $s9State --out qa-review.json
```

집계는 응답 내용과 별도다. 초대·운영자 파일은 외부에 전송하지 않는다. 이미 내보낸 파일은 철회로 자동 소거되지 않으므로 담당자가 별도로 삭제 기록을 확인한다.

## 자료와 검증 재현

```powershell
$s9Run = '.private/sprint9-evidence-' + [Guid]::NewGuid().ToString('N')
New-Item -ItemType Directory -Path $s9Run | Out-Null
& $s9Node scripts/beta/materials.mjs --data-pack $s9Pack --out (Join-Path $s9Run 'materials')
& $s9Node scripts/beta/browser-smoke.mjs --data-pack $s9Pack --evidence-dir (Join-Path $s9Run 'browser')
& $s9Node scripts/beta/operations-check.mjs $s9Pack (Join-Path $s9Run 'operations')
```

검증 도구는 실제 엔진 및 로컬 Chromium을 사용한다. 결과와 캡처는 지정한 비공개 경로에 남는다. 실행 중인 개발 서버와 별도 상태를 사용한다. 자료 생성기의 출력과 대조 키는 운영자용이며 독자에게 배포하지 않는다.

## 실제 평가 전 결정

독자 12–20명과 전문가 3명 이상의 모집 방식, 제공할 가상 자료, 설명문·동의·폐기 및 감독 장비를 소유자가 먼저 승인해야 한다. 실제 출생정보를 쓰는 연구는 별도 결정이다. 현재 공개 서버, 개인 계정, 외부 분석 도구, 결제, 실데이터 수집은 사용할 수 없다. 이 웹은 S8 구매 서버의 디자인과 저장 구성요소를 재사용하는 저장소 실행용 연구 도구다. 기존에 만들어 둔 독립 패키지에 S9 화면이 들어 있지는 않다.
