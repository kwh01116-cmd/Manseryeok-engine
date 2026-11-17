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
node playthrough.js saju-llm desk,phone     # 가짜 sample로 사주 대화 → 꼭지 풀이 → 되묻기 → 편지 (금지어 섞인 항목이 걸러지는지)
node playthrough.js star-llm desk,phone     # 별자리 같은 경로
node playthrough.js lips-tarot phone        # 말하는 구간 연속 캡처 → lips-tarot-phone-burst.png (lips-saju, lips-star)
node toon.js geumeum phone,desk             # 그믐 골목(웹툰 컷) 고정 대본: 골목 고르기 → 컷 → 편지 → 골목 고르기
node toon.js geumeum-llm phone,desk         # 같은 길을 가짜 sample로 (문진, 풀이, 되묻기, 편지)
node toon.js geumeum-crisis phone           # 위급한 말 → 역할을 벗은 109 안내 → 골목 고르기 (LLM 호출 0번)
node toon.js hub phone                      # 오늘의 한 장 뒤집기, 골목 고르기 ↔ 포차 골목 오가기
```

- `playwright`는 전역에 설치된 것을 쓴다. WebGL은 소프트웨어 렌더링(swiftshader)으로 돈다.
- CDN 요청은 `node_modules`의 사본으로 가로채고, 로컬 서버는 프록시를 우회한다.
- file:// 로 열면 인물 그림이 WebGL에 올라가지 않으므로 반드시 http 서버로 연다.
- 캡처 여러 장을 한 장으로 붙여서 보려면 `python3 sheet.py out.png 540 a.png b.png` (높이 540으로 맞춰 가로로 이어 붙임. 폰 캡처는 780).
- 캡처는 `<부스>-<크기>-<단계>.png`. 실패하면 `...-FAIL.png`가 남는다.
- 두 개를 동시에 돌리면 소프트웨어 렌더링이 느려져 데스크톱 캡처가 30초 제한에 걸린다. 하나씩 돌린다.
- `tarot-llm`/`tarot-deny`는 `page.addInitScript`로 가짜 `window.claude.use("sample")`를 넣는다 (지연 후 단계에 맞는 JSON). 레포트 글자 수, 인용, 호출 수를 출력한다.
- 대사 한 줄을 넘길 때는 `#next`가 보일 때까지 기다린 뒤 누른다. 타이핑 중에 누르면 줄이 밀린다.
- 모든 모드는 봉투 → 복채(데모) → 편지 → 골목 → 받은 편지함에서 다시 열기까지 간다. 출력의 `kept`는 저장된 편지 수, `banned`는 편지에 "대운/상승궁"이 들어갔는지 (고정 별자리 편지는 없음).
- `lips-*`는 페이지의 rAF와 setTimeout을 40배 느리게 돌려 캡처 한 장이 페이지 시간 약 75ms가 되게 한다. 붙인 그림에서 입 부분만 잘라 크게 봐야 보인다.
- `playthrough.js`의 모든 모드는 골목 고르기 화면에서 포차 골목 카드를 누르고 시작한다.
- `toon.js`는 `img/gm_*.webp`가 없으면 그 자리에 이름이 적힌 빈 그림을 넣어 화면 짜임만 본다 (출력에 몇 장을 대신했는지 나온다). 한 화면씩 내려가며 `<모드>-<크기>-<번호>.png`로 찍는다.
