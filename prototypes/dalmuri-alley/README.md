# 달무리 골목 (프로토타입)

가상 사주·타로집 아이디어의 프로토타입. 골목 고르기 화면에서 골목 하나를 골라 들어간다. 임시 실험이며, 실제 앱은 별도 저장소에서 만든다.
실수·수정·개선 메모는 [NOTES.md](NOTES.md)에, 컨셉과 세계관, 상용화 계획은 [ROADMAP.md](ROADMAP.md)에 모은다.

## 골목

| 골목 | 화면 | 보는 것 | 그림 |
|---|---|---|---|
| 포차 골목 | three.js(r128)로 그린 3D 골목과 부스 셋, 상담사는 2D 그림 | 타로, 사주, 별자리 | `img/{dalmuri,boreum,saetbyeol}_*.webp`, 벽 그림 |
| 그믐 골목 | 세로로 내려가며 읽는 웹툰 컷과 말풍선 (3D 아님) | 사주 (그믐당, 묵 선생) | `img/gm_*.webp` 11장. 아직 없다. 없으면 카드가 잠긴다 |

상담 흐름(이름 → 고민 → 문진 → 생년월일 → 풀이 → 되묻기 → 봉투 속 편지)과 받은 편지함은 두 골목이 같은 코드를 쓴다.

## 구성

- `index.html`: 페이지 전체. Claude Artifact 게시용 조각이라 `<html>`/`<body>` 태그가 없다.
- `img/`: 포차 골목의 상담사 스프라이트와 벽 그림, 골목 고르기 카드 그림(`hub_pocha.webp`), 그믐 골목 컷(`gm_*.webp`).
- `make_sprites.py`: 포차 골목 상담사 원본 PNG를 스프라이트로 가공한다. 원본은 용량이 커서 저장소에 넣지 않았다.
- `make_cuts.py`: 그믐 골목 컷 원본을 `img/gm_*.webp`로 바꾼다 (크기 맞추기, webp). 그림을 바꾸면 `index.html`의 `GM_SPOT`을 맞춘다.
- `engine-glue.ts`: Manseryeok-engine을 브라우저에서 부르는 얇은 접착층.
- `build.mjs`: 엔진 소스와 접착층을 묶어 `index.html`의 `ENGINE_BUNDLE` 구간에 넣는다.
- `test/`: 헤드리스 통과 테스트 ([test/README.md](test/README.md)).

별자리 부스는 계산 엔진을 쓰지 않는다. 생일 날짜로 태양 별자리만 정한다.

## 골목 늘리기

1. `ALLEYS`에 카드 한 줄 (이름, 한 줄 소개, 꼬리표, 카드 그림).
2. `PERSONA`에 상담사 (이름, 말투, `kind`: 보는 방식. 사주면 `'saju'`).
3. 화면: 3D 부스를 더 짓거나, 웹툰 컷이면 `mukSession()`처럼 `Toon.cut()`과 `say()`로 대본을 쓴다.
4. LLM이 없을 때 쓸 고정 문장 (`MUK`, `fixedMuk()` 참고)과 편지 종이 (`.paper-<상담사>`).
5. `enterAlley()`에 들어가는 길을 잇는다.

## 사주 계산 경로

1. 절기 시각과 음력→양력 변환: 오픈소스 `lunar-javascript` 1.7.7 (MIT). UTC+8 시각을 한국 표준시 분 단위로 바꿔 쓴다.
2. 연·월·일·시주, 십성, 오행, 세운: Manseryeok-engine (`agent/kasi-local-1950-2026-20261109` 브랜치, 커밋 `5790b18`).
3. 풀이 문장: 페이지 안의 고정 대본. 일간, 오행 개수, 십성 분포, 세운 십성에 따라 고른다.

## 엔진 번들 다시 만들기

엔진 코드는 이 브랜치에 없으므로 엔진 브랜치를 따로 체크아웃한 경로를 넘긴다. `esbuild`가 필요하다.

```
git worktree add ../engine-src origin/agent/kasi-local-1950-2026-20261109
node prototypes/dalmuri-alley/build.mjs ../engine-src
```

## 아직 가짜인 것

- LLM은 Artifact의 `sample` 기능이다. 실제 앱에서는 `LLM.ask()` 안쪽만 자체 서버 호출로 바꾼다. 허락하지 않거나 실패하면 고정 대본으로 돈다.
- 복채(결제)는 데모 화면이다. 실제 결제는 일어나지 않는다.
- 음성은 브라우저 내장 TTS다 (포차 골목만). `Voice.speak()`이 바뀔 자리.
- 받은 편지함은 이 브라우저의 localStorage다. 계정도 서버도 없다.
