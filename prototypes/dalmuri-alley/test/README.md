# 플레이 테스트

헤드리스 브라우저로 부스 하나를 처음부터 끝까지 눌러 보고 화면을 캡처한다.

```
cd prototypes/dalmuri-alley/test
npm install                      # three, lunar-javascript 로컬 사본 (CDN이 막힌 환경용)
node wrap.js                     # ../index.html → page.html
(cd .. && python3 -m http.server 8765 --bind 127.0.0.1 &)
node playthrough.js tarot desk,phone
node playthrough.js saju desk,phone
node playthrough.js star desk,phone
node playthrough.js tarot-llm desk,phone    # 가짜 sample로 LLM 대화 → 되묻기 → 레포트
node playthrough.js tarot-deny phone        # 첫 호출이 not_granted로 거절 → 고정 대본, 호출 1번
```

- `playwright`는 전역에 설치된 것을 쓴다. WebGL은 소프트웨어 렌더링(swiftshader)으로 돈다.
- CDN 요청은 `node_modules`의 사본으로 가로채고, 로컬 서버는 프록시를 우회한다.
- file:// 로 열면 인물 그림이 WebGL에 올라가지 않으므로 반드시 http 서버로 연다.
- 캡처 여러 장을 한 장으로 붙여서 보려면 `python3 sheet.py out.png 540 a.png b.png` (높이 540으로 맞춰 가로로 이어 붙임. 폰 캡처는 780).
- 캡처는 `<부스>-<크기>-<단계>.png`. 실패하면 `...-FAIL.png`가 남는다.
- 두 개를 동시에 돌리면 소프트웨어 렌더링이 느려져 데스크톱 캡처가 30초 제한에 걸린다. 하나씩 돌린다.
- `tarot-llm`/`tarot-deny`는 `page.addInitScript`로 가짜 `window.claude.use("sample")`를 넣는다 (지연 후 단계에 맞는 JSON). 레포트 글자 수, 인용, 호출 수를 출력한다.
- 대사 한 줄을 넘길 때는 `#next`가 보일 때까지 기다린 뒤 누른다. 타이핑 중에 누르면 줄이 밀린다.
