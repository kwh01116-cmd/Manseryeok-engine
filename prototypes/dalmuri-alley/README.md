# 달무리 골목 (프로토타입)

가상 사주·타로집 아이디어의 3D 껍데기. 임시 실험이며, 실제 앱은 별도 저장소에서 만든다.
실수·수정·개선 메모는 [NOTES.md](NOTES.md)에 모은다.

## 구성

- `index.html`: 페이지 전체. three.js(r128)로 그린 골목과 부스 세 곳(사주, 타로, 별자리). 상담사와 부스 안 벽은 2D 그림.
  Claude Artifact 게시용 조각이라 `<html>`/`<body>` 태그가 없다.
- `img/`: 상담사 그림 스프라이트(몸통 한 장과 표정별 얼굴 조각)와 부스 안 벽 그림.
- `make_sprites.py`: GPT 이미지로 뽑은 원본 PNG를 `img/`의 스프라이트로 가공한다. 원본은 용량이 커서 저장소에 넣지 않았다.
- `engine-glue.ts`: Manseryeok-engine을 브라우저에서 부르는 얇은 접착층.
- `build.mjs`: 엔진 소스와 접착층을 묶어 `index.html`의 `ENGINE_BUNDLE` 구간에 넣는다.

별자리 부스는 계산 엔진을 쓰지 않는다. 생일 날짜로 태양 별자리만 정한다.

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

- 대사는 고정 대본이다. `tarotReading()`, `sajuSession()`이 LLM 호출로 바뀔 자리.
- 음성은 브라우저 내장 TTS다. `Voice.speak()`이 ElevenLabs 스트리밍으로 바뀔 자리.
