# 달무리 골목 그림 주문서

<!-- 그림 주문서의 사본이다. 원본 페이지: https://claude.ai/artifact/HubShgcicgfmevBgHw4PK1 . 대본 정본은 story/script-book.md. -->

ChatGPT에 프로젝트를 넘기는 인수인계 메시지와, 새로 필요한 그림 51장(그믐 골목 시즌 1 23장, 자정 우체국 28장)의 프롬프트다.

## 넘기는 순서

1. 「달무리 골목 대본집」 문서를 마크다운이나 PDF로 내보낸다.
2. ChatGPT 새 대화에 내보낸 파일을 올리고, 아래 '인수인계 메시지'를 붙여 넣는다. ChatGPT가 요약을 돌려주면 이해했는지 확인한다.
3. 그림은 배치마다 새 대화에서 만든다. '첨부'에 적힌 기준 그림을 먼저 올리고 그 배치의 프롬프트를 붙여 넣은 뒤, 한 장 나올 때마다 "다음"이라고 한다. 고칠 점이 있으면 "다음" 대신 고칠 점을 말한다.
4. 순서는 그믐 G1 → G2 → G3 → G4, 자정 우체국 A1 → A2 → A3 → A4 → A5. G1의 g_so와 A1의 두 장은 다음 배치에 첨부하는 기준 그림이라 먼저, 마음에 들 때까지 만든다.
5. 받은 그림의 파일 이름을 칸 이름으로 바꿔 둔다 (예: g_so.png). 코드에 넣는 방법은 맨 아래 '그림을 받은 뒤'.

## 인수인계 메시지 (ChatGPT에 먼저 붙여 넣기)

```text
너는 지금부터 '달무리 골목' 프로젝트를 이어받는다. 함께 올린 「달무리 골목 대본집」이 이야기와 콘티의 정본이다. 먼저 이 메시지와 대본집을 읽고 이해한 것을 열 줄 안으로 요약해 줘. 그다음 내가 '그림 주문서'의 배치를 하나씩 붙여 넣으면, 그 규칙대로 그림을 한 장씩 만든다.

1. 무엇인가
- 웹에서 보는 가상의 점집 골목이다. 손님은 골목 하나를 골라 들어가 상담사와 대화하고, 마지막에 편지 모양의 결과지를 받는다. 결과지는 유료 상품이고 지금은 결제 없는 데모다.
- 골목은 셋이다. 포차 골목(3D, 타로·사주·별자리), 그믐 골목(세로 웹툰 컷, 사주와 커플 궁합), 자정 우체국(세로 웹툰 컷, 택일과 미래로 부치는 편지, 이번에 새로 만든다).
- 사주 계산은 직접 만든 만세력 엔진(Manseryeok-engine)이 하고, 대화와 풀이 문장은 AI가 쓴다. 계산하지 않은 명리 개념은 AI가 지어내지 못하게 코드가 막는다.

2. 지금 어디까지 됐나 (2026-11-18)
- 동작하는 프로토타입: 골목 고르기, 무료 오늘의 한 장, 포차 골목 세 부스, 그믐 골목(사주, 커플 궁합, 묵 선생의 명서, 단청의 연분첩, 쿠키 컷 1~3장), 긴 풀이서, 받은 편지함, 복채 데모.
- 코드와 그림: GitHub 저장소 kwh01116-cmd/Manseryeok-engine, 브랜치 claude/virtual-fortune-telling-app-hw6bub, 폴더 prototypes/dalmuri-alley. 웹 페이지 전체가 index.html 한 파일이고, 그림은 img/, 그림 변환은 make_cuts.py, 이어받는 순서는 HANDOFF.md에 있다.
- 아직 없는 것: 그믐 시즌 1의 4~12장과 메아리 장면, 자정 우체국 전체, 실제 결제·계정·서버.

3. 네가 할 일
- 그림: 그림 주문서의 배치(그믐 G1~G4 23장, 자정 우체국 A1~A5 28장)를 순서대로 만든다. 배치마다 첨부한 기준 그림과 똑같은 얼굴과 옷을 지킨다.
- 대본: 대본집을 정본으로 지킨다. 고칠 때는 대본집의 표기(컷 번호, [모양 · 그림 칸], 해설과 대사)를 그대로 쓴다.
- 코드: 저장소에 접근할 수 있으면 HANDOFF.md의 순서를 따른다.

4. 반드시 지킬 것
- 그림 안에는 글자를 넣지 않는다. 현판, 쪽지, 봉투, 소인, 장부, 포스터, 시계 숫자까지 모두 비운다. 글자는 코드가 그림 위에 얹는다.
- 그믐 골목 하늘에는 달이 없다. 달은 그믐당 병풍 속 그림으로만 있고, 시즌 1 마지막 장의 가는 그믐달 한 컷만 예외다.
- 그림체: 그믐당 대문 안은 굵은 먹선, 대문 밖 골목과 천막, 자정 우체국은 부드러운 채색, 지나간 일을 보여 주는 회상은 세피아.
- 겁주지 않는다. 귀신, 저주, 부적, 굿, 신점은 없다. 앞날을 단정하지 않는다.
- 인물의 비밀은 대본집의 장 순서대로만 드러낸다.
```

## G1 · 그믐 골목 · 지금 · 부드러운 채색 (7장)

첨부: 단 첫 그림(붉은 옷에 방울), 청 첫 그림(상투에 노란 책), 골목 입구 그림, 천막 그림(파란 차양에 빈 방석 둘)

1번 g_so가 새 인물 소의 기준 그림입니다. 마음에 들 때까지 고친 뒤 "다음"으로 넘어가세요. G2, G3, G4, A5에서 이 그림을 첨부합니다.

```text
I will ask for 7 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, warm lantern and candle light against a deep navy night, rich traditional Korean details (dancheong patterns, hanji paper, brass, silk), gentle rim light. Match the rendering quality of the attached references.

CHARACTERS
So: a Korean woman of forty-nine, chin-length black bob with a few white strands, calm tired eyes with faint smile lines, no makeup, a white cotton shirt with sleeves rolled up under a canvas apron stained with ochre, indigo and crimson paint, paint on her fingertips.
Dan (attached reference): a Korean woman in her late twenties, long dark wavy hair half-tied with a red ribbon, sly playful eyes, a white jeogori with a black sash under a red outer robe with colorful cloud-pattern sleeves, a small brass bell on a red cord.
Cheong (attached reference): a Korean man of twenty-one, hair in a topknot held by a wooden pin with a few loose strands, calm earnest face, a dark indigo robe with cloud and key-fret patterns over a white collar, often holding a yellow thread-bound book.

IMAGES
1. g_so (square 1024x1024): CHARACTER REFERENCE for So. Bust portrait facing the viewer, a calm tired expression with the faintest smile, sitting in the street booth at night (blue canopy, red-and-blue silk lanterns, low wooden table) like the attached booth image.
2. g_so_tear (square 1024x1024): The same So, same framing and booth background, eyes reddened and wet, holding back tears, looking slightly down at someone across the table.
3. g_sleeve (square 1024x1024): Close-up of Cheong's forearm with the dark indigo sleeve turned back, showing the hidden inner lining: an old faded indigo-blue cotton cloth with a small white cloud pattern, patched by hand. Lantern light. No face.
4. g_so_hand_dan (square 1024x1024): Close-up of So's paint-stained hands firmly holding both of Dan's hands (red robe sleeves, the brass bell on a red cord hanging from Dan's wrist), warm lantern light, a quiet promise.
5. g_studio (square 1024x1024): A small painter's studio late at night: canvases leaning on the walls, a blank exhibition poster pinned up, a single desk lamp, So's hand laying a paintbrush down on the table. Tired, about to give up.
6. g_dawn_moon (portrait 1024x1536): Pre-dawn deep blue sky over the hanok alley. A hair-thin waning crescent moon low in the eastern sky (this is the only image of the batch with a moon in the sky). Dan, Cheong and Muk stand in front of the open red gate, seen from behind, looking up at it. The white paper lantern above the gate is unlit. Quiet, hopeful.
7. g_yellow_lantern (landscape 1536x1024): The far end of the night alley: one yellow paper lantern we have never seen before glows above an old yellow cast-iron mailbox, mist over the wet stone path. No people.

Start with image 1 now.
```

## G2 · 그믐 골목 · 지금 · 먹선 (5장)

첨부: 묵 선생 정면 그림, 상 앞의 묵 선생 그림(뒤에 달 병풍), 대문 그림, 청 첫 그림, G1에서 만든 g_so

대문 안의 장면이라 모두 굵은 먹선입니다. 달은 병풍 속 그림으로만 나옵니다.

```text
I will ask for 5 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Korean webtoon illustration with bold confident ink outlines and flat cel shading, saturated traditional palette (crimson, indigo, ochre, bone white, ink black), warm candle light, dense traditional Korean patterns (dancheong, folk painting). This is the inside of an old hanok house called Geumeumdang at night. The moon appears only as a painting on the folding screen, never in a sky.

CHARACTERS
Muk (attached reference): a Korean man in his late forties, hair tied back in a low ponytail, mustache and short goatee, sharp but kind eyes, a black durumagi over white hanbok with a red cord knot at the chest.
Cheong (attached reference): a Korean man of twenty-one, hair in a topknot held by a wooden pin with a few loose strands, calm earnest face, a dark indigo robe with cloud and key-fret patterns over a white collar, often holding a yellow thread-bound book.
So (attached reference image g_so): the woman of forty-nine with the chin-length bob, white shirt and paint-stained apron. Keep her face exactly.

IMAGES
1. g_so_smile (square 1024x1024): So (attached g_so) redrawn in this ink style, bust shot inside the candle-lit room, a faint warm smile, eyes softened.
2. g_reunion (landscape 1536x1024): Muk and So sitting face to face across Muk's low writing desk, a blank sheet of hanji and an inkstone between them, the folding screen with the painted full moon behind Muk, two candles. A tense, quiet reunion after twenty years.
3. g_cheong_dust (portrait 1024x1536): Cheong seen from behind, wiping the room with a cloth, stopping in front of the folding screen with the painted full moon, careful not to touch it.
4. g_seal_closeup (landscape 1536x1024): Extreme close-up of the lower corner of the folding-screen moon painting: painted clouds, the edge of the moon, and a tiny blank red seal stamp (a small red square with no characters) in the corner.
5. g_lantern_hang (portrait 1024x1536): Muk seen from behind, standing on a low step, hanging a white paper lantern on the eave of the red gate beside a red lantern and a blue lantern. Night.

Start with image 1 now.
```

## G3 · 그믐 골목 · 회상 · 부드러운 채색 (3장)

첨부: 단 첫 그림, 골목 입구 그림, G1에서 만든 g_so

지나간 일이라 세피아입니다. 3번은 일부러 세 칸으로 나눈 한 장입니다.

```text
I will ask for 3 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, warm lantern and candle light against a deep navy night, rich traditional Korean details (dancheong patterns, hanji paper, brass, silk), gentle rim light. Match the rendering quality of the attached references. These images are memories: render each one in faded warm sepia tones with a soft vignette, like an old photograph, while keeping the style above.

CHARACTERS
Dan at twenty: the same face as the Dan reference but younger and tired, hair in a plain short ponytail, an ordinary cheap black padded jacket over a gray hoodie, no red robe, no bell yet.
So when young (her face is never shown): long black hair in a low ponytail, a white blouse, paint-stained fingertips.

IMAGES
1. g_dan_first (portrait 1024x1536): Seven years ago: Dan at twenty standing alone in the wet hanok alley at night, hands in the pockets of her cheap padded jacket, lost and tired, the red-and-blue lanterns far behind her.
2. g_wall (portrait 1024x1536): Twenty years ago: a woman (So at twenty-eight, chin-length black hair, white blouse, holding a paint bucket and a rolled brush bag) stands at night in front of a plain old brick-and-plaster wall where an alley entrance should be, looking up at it. Her face is hidden in shadow.
3. g_wall_years (landscape 1536x1024): This one image is intentionally a triptych of three vertical panels: the same woman standing before the same wall at night, same pose, same paint-stained apron, as the years pass. Panel 1: black hair. Panel 2: a few gray strands. Panel 3: streaks of white. Face mostly in shadow.

Start with image 1 now.
```

## G4 · 그믐 골목 · 회상 · 먹선 (8장)

첨부: 묵 선생 정면 그림, 상 앞의 묵 선생 그림(달 병풍), 대문 그림, 단 첫 그림, G1에서 만든 g_so

22년 전, 21년 전, 7년 전의 장면입니다. 굵은 먹선에 세피아를 입힙니다. 젊은 소의 얼굴은 보이지 않게 합니다.

```text
I will ask for 8 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Korean webtoon illustration with bold confident ink outlines and flat cel shading, saturated traditional palette (crimson, indigo, ochre, bone white, ink black), warm candle light, dense traditional Korean patterns (dancheong, folk painting). This is the inside of an old hanok house called Geumeumdang at night. These images are memories: render each one in faded warm sepia tones with a soft vignette, like an old photograph, while keeping the style above.

CHARACTERS
Muk at twenty-six: the same face as the Muk reference but younger and clean-shaven (no mustache, no beard), hair tied back neatly, sharp proud eyes, a luxurious black silk durumagi with gold embroidery.
So when young (her face is never shown): long black hair in a low ponytail, a white blouse, paint-stained fingertips.
Dan at twenty: the same face as the Dan reference but younger and tired, hair in a plain short ponytail, an ordinary cheap black padded jacket over a gray hoodie, no red robe, no bell yet.
The baby's swaddling cloth is indigo-blue cotton with a small white cloud pattern. The same cloth later lines the inside of Cheong's sleeves.

IMAGES
1. g_young_muk (portrait 1024x1536): Twenty-two years ago: Muk at twenty-six sits proudly behind a lacquered desk in a luxurious fortune-telling room; many pairs of guests' shoes are lined up at the door and silhouettes queue outside.
2. g_so_hands (square 1024x1024): Close-up of a young woman's hands holding a celadon tea cup across a desk; her fingertips are stained with paint. Her face is not shown.
3. g_so_leaving (landscape 1536x1024): The young woman seen from behind, rising and walking out through a paper-lattice door; a single paintbrush lies on the floor where she sat.
4. g_dan_seat (square 1024x1024): Seven years ago: Dan at twenty kneeling at Muk's low desk, both hands clenched tightly on her knees, eyes down, unable to speak. Candlelight.
5. g_bell_give (landscape 1536x1024): Close-up over the desk: Muk's hand in a black sleeve placing a small brass bell on a red cord into Dan's open palm (plain jacket sleeve).
6. g_baby_night (portrait 1024x1536): Twenty-one years ago, a moonless night: a young woman seen from behind at the open red gate, holding a newborn in the indigo-blue swaddling cloth with the small white cloud pattern, a rolled-up folding screen under her arm.
7. g_baby (square 1024x1024): A newborn asleep in the indigo-blue swaddling cloth with the small white cloud pattern, one tiny fist out, candlelight.
8. g_baby_cushion (portrait 1024x1536): The newborn in the indigo swaddle lying on a white floor cushion in Muk's room, a folded blank note beside the baby, and the folding screen with the painted full moon standing open behind.

Start with image 1 now.
```

## A1 · 자정 우체국 · 사람 기준 (2장)

첨부: 청 첫 그림 (그림체만 참고, 인물은 따라 그리지 않음)

두 장이 자정 우체국 두 사람의 기준 그림입니다. 한 장씩 마음에 들 때까지 고친 뒤 넘어가세요. A2~A5에서 이 두 장을 첨부합니다.

```text
I will ask for 2 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, the same rendering quality as the attached references. Setting: a small 1990s-style Korean post office hidden at the end of a night alley, open only while the midnight bell rings. Palette: warm yellow lamplight, mint-green plaster walls, dark varnished wood, red cast iron, deep navy night outside. Cozy, nostalgic and a little magical, never scary. The attached image is for rendering style only; do not copy its character.

CHARACTERS
Hwang, the postmaster: a Korean woman in her mid-sixties, short silver-gray permed hair, small round reading glasses low on her nose, a brass magnifying glass on a cord around her neck, a mustard-yellow knitted shawl over a dark green 1990s Korean postal uniform jacket with a small brass badge, kind but exacting eyes.
Naeil, the night postman: a Korean man of twenty-six, messy black hair with bangs over his eyes, lanky, a dark green postal uniform jacket with rolled-up sleeves, a canvas mail bag across his chest, cheerful and a little clumsy, a folded paper map often held upside down.

IMAGES
1. a_hwang_neutral (square 1024x1024): CHARACTER REFERENCE for Hwang. Bust portrait behind the wooden post office counter at midnight, facing the viewer, a composed neutral expression, warm lamp light, pigeonhole shelves full of envelopes behind her.
2. a_naeil_neutral (square 1024x1024): CHARACTER REFERENCE for Naeil. Bust portrait in the same post office, facing the viewer, a friendly neutral expression, the mail bag strap across his chest.

Start with image 1 now.
```

## A2 · 자정 우체국 · 표정 (6장)

첨부: A1에서 만든 a_hwang_neutral, a_naeil_neutral

모두 기준 그림과 같은 구도와 배경에서 표정만 바뀝니다.

```text
I will ask for 6 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, the same rendering quality as the attached references. Setting: a small 1990s-style Korean post office hidden at the end of a night alley, open only while the midnight bell rings. Palette: warm yellow lamplight, mint-green plaster walls, dark varnished wood, red cast iron, deep navy night outside. Cozy, nostalgic and a little magical, never scary. Same framing and background as the references; only the expression and hands change.

CHARACTERS
Hwang (attached reference image a_hwang_neutral): keep her face, glasses, magnifier, yellow shawl and green uniform exactly.
Naeil (attached reference image a_naeil_neutral): keep his face, bangs, green uniform and mail bag exactly.

IMAGES
1. a_hwang_smile (square 1024x1024): Hwang smiling with her eyes, warm and kind.
2. a_hwang_stern (square 1024x1024): Hwang looking over her reading glasses, stern, one eyebrow raised.
3. a_hwang_think (square 1024x1024): Hwang looking down at a big open ledger on the counter, one finger on a page, thinking.
4. a_naeil_smile (square 1024x1024): Naeil with a wide cheerful grin, holding up a letter.
5. a_naeil_lost (square 1024x1024): Naeil flustered and blushing, holding a paper map upside down, scratching his head.
6. a_naeil_quiet (square 1024x1024): Naeil with lowered eyes, a quiet lonely expression, lips closed.

Start with image 1 now.
```

## A3 · 자정 우체국 · 장면 (7장)

첨부: A1의 두 기준 그림, 그믐 골목 입구 그림(골목 그림체 참고)

1번 a_alley는 골목 고르기 카드에도 쓰입니다.

```text
I will ask for 7 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, the same rendering quality as the attached references. Setting: a small 1990s-style Korean post office hidden at the end of a night alley, open only while the midnight bell rings. Palette: warm yellow lamplight, mint-green plaster walls, dark varnished wood, red cast iron, deep navy night outside. Cozy, nostalgic and a little magical, never scary.

CHARACTERS
Hwang (attached reference image a_hwang_neutral): keep her face, glasses, magnifier, yellow shawl and green uniform exactly.
Naeil (attached reference image a_naeil_neutral): keep his face, bangs, green uniform and mail bag exactly.

IMAGES
1. a_alley (portrait 1024x1536): A narrow old Korean alley at midnight (brick walls, tiled roofs, wet stone path). At its end, a small old post office with warm yellow windows; a yellow cast-iron mailbox stands at the entrance under a single glowing yellow paper lantern; a distant clock tower whose hands both point to twelve. No people. No moon.
2. a_counter (portrait 1024x1536): Inside the post office: a big round wall clock stopped at twelve, a wooden counter with a brass grille, pigeonhole shelves full of envelopes, an old brass scale, warm lamps, mint-green walls. No people.
3. a_out (portrait 1024x1536): The same alley entrance after midnight: the post office is gone, only a plain wall stands where it was; the yellow mailbox stands alone under the lantern on the empty wet street. No people. No moon.
4. a_naeil_bike (landscape 1536x1024): Naeil bursting out of the post office door on an old black bicycle with a mail basket, letters fluttering, motion lines, comic energy.
5. a_knock (landscape 1536x1024): At the door of an ordinary apartment at night, Naeil out of breath, holding out a yellow envelope with both hands, slightly sweaty, smiling.
6. a_returnbox (portrait 1024x1536): In a corner of the post office, an old red steel box overflowing with faded undelivered letters, dust floating in the lamp light.
7. a_ledger (portrait 1024x1536): Top view of a huge open ledger on the counter, its pages ruled into a blank grid of day cells, a fountain pen and a brass magnifier beside it.

Start with image 1 now.
```

## A4 · 자정 우체국 · 소품 (4장)

첨부: A1의 a_hwang_neutral

소인, 우표, 봉투, 시계는 모두 글자와 숫자 없이 그립니다.

```text
I will ask for 4 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, the same rendering quality as the attached references. Setting: a small 1990s-style Korean post office hidden at the end of a night alley, open only while the midnight bell rings. Palette: warm yellow lamplight, mint-green plaster walls, dark varnished wood, red cast iron, deep navy night outside. Cozy, nostalgic and a little magical, never scary.

CHARACTERS
Hwang (attached reference image a_hwang_neutral): keep her face, glasses, magnifier, yellow shawl and green uniform exactly.

IMAGES
1. a_stamp (landscape 1536x1024): Close-up of Hwang's hand (green sleeve, edge of the yellow shawl) slamming a round brass postmark stamp onto a yellow envelope, motion lines and a small puff of ink. The postmark circle is blank.
2. a_stamps (square 1024x1024): A sheet of twelve small postage stamps with perforated edges, each illustrating one of the twelve Korean zodiac animals in a warm vintage style. No numbers or letters on the stamps.
3. a_envelope (square 1024x1024): A yellow registered envelope lying on dark wood, tied with string, one zodiac stamp in the corner and a blank round postmark circle.
4. a_clock (square 1024x1024): Close-up of the round wall clock with plain tick marks, both hands exactly at twelve, a tiny tremble line beside the minute hand.

Start with image 1 now.
```

## A5 · 자정 우체국 · 시즌 「반송함」 (9장)

첨부: A1의 두 기준 그림, G1의 g_so

1~3번은 회상이라 세피아입니다. 7번은 그믐 골목의 소가 나옵니다.

```text
I will ask for 9 images for a Korean webtoon called Dalmuri Alley. Follow these rules strictly.

RULES
- Generate ONE image at a time, in order. Each is a single full image, never a grid, collage, comic page or character sheet, unless an item says it is a triptych.
- After each image, stop and wait. Make the next one only when I say "다음". If I give feedback instead, redo the same numbered image.
- Use exactly the size given for each image.
- No text anywhere: no letters, numbers, signatures, logos or watermarks. Signs, notes, posters, envelopes, postmarks, seals, ledgers and clock faces stay blank; clock faces use plain tick marks without numerals.
- No moon in any sky unless an item asks for one.
- Characters must match the attached reference images exactly: same face, hairstyle, clothes and colors, in every image.

STYLE
Soft painterly Korean webtoon illustration, semi-realistic faces, the same rendering quality as the attached references. Setting: a small 1990s-style Korean post office hidden at the end of a night alley, open only while the midnight bell rings. Palette: warm yellow lamplight, mint-green plaster walls, dark varnished wood, red cast iron, deep navy night outside. Cozy, nostalgic and a little magical, never scary.

CHARACTERS
Hwang (attached reference image a_hwang_neutral): keep her face, glasses, magnifier, yellow shawl and green uniform exactly.
Naeil (attached reference image a_naeil_neutral): keep his face, bangs, green uniform and mail bag exactly.
Hwang at thirty-four (1996): the same face as the Hwang reference but younger, short black hair, a dark green postal uniform and cap under a clear plastic raincoat.
Naeil at twenty-three: the same face as the Naeil reference, with glasses and a gray hoodie, a tired exam student.
So (attached reference image g_so): the woman of forty-nine with the chin-length bob, white shirt and paint-stained apron. Keep her face exactly.

IMAGES
1. a_s_rain (portrait 1024x1536): Memory in faded sepia: a 1996 monsoon night, young Hwang in a postal uniform and clear raincoat stops her bicycle before a washed-out bridge over a raging river, clutching a yellow envelope inside her raincoat.
2. a_s_empty_house (landscape 1536x1024): Memory in faded sepia: the next morning, an empty old house with the gate ajar and the furniture gone, a blank moving notice tucked into the door gap.
3. a_s_exam (portrait 1024x1536): Memory in faded sepia: three years ago, Naeil at twenty-three at a small study-cubicle desk late at night, piles of exam books, writing a letter, a yellow envelope ready beside him.
4. a_s_window_rain (portrait 1024x1536): Midnight rain on the post office window; Hwang stands at the window pulling her yellow shawl tighter, looking out, melancholy.
5. a_s_yellow_letter (square 1024x1024): The faded yellow envelope at the very bottom of the return box, its address line smudged and blurred by old water stains so that nothing is readable.
6. a_s_magnifier (square 1024x1024): Hwang's hand holding the brass magnifier over the smudged address of the faded yellow envelope under lamp light. Nothing is readable.
7. a_s_studio_door (portrait 1024x1536): Dawn at a painter's studio door in an old building: Naeil hands the faded yellow envelope to So (attached reference, white shirt, paint-stained apron), who has just opened the door.
8. a_s_naeil_letter (square 1024x1024): Naeil reading his own letter (a blank sheet) in the post office, eyes wet, smiling at last.
9. a_s_clock_move (square 1024x1024): Close-up of Hwang's hand pushing the minute hand of the big wall clock just past twelve (tick marks only).

Start with image 1 now.
```

## 칸 목록

| 칸 이름 | 배치 | 크기 | 그림 | 대본의 자리 |
| --- | --- | --- | --- | --- |
| g_so | G1 | 정사각 | 지금의 소, 기준 그림 | 그믐 10·12장, 우체국 11장 |
| g_so_tear | G1 | 정사각 | 눈가가 붉어진 소 | 그믐 10장, 우체국 11장 |
| g_sleeve | G1 | 정사각 | 청의 소매 안감(낡은 쪽빛 강보 천) | 그믐 10장 |
| g_so_hand_dan | G1 | 정사각 | 소가 단의 두 손을 잡는다 | 그믐 12장 |
| g_studio | G1 | 정사각 | 작업실, 빈 전시 포스터, 붓을 내려놓는 손 | 그믐 9장 |
| g_dawn_moon | G1 | 세로 | 새벽 하늘의 가는 그믐달, 대문 앞의 단·청·묵 | 그믐 12장 |
| g_yellow_lantern | G1 | 가로 | 골목 끝에 켜진 노란 등과 노란 우체통 | 그믐 12장 마지막 컷 |
| g_so_smile | G2 | 정사각 | 옅게 웃는 소 (먹선) | 그믐 11장 |
| g_reunion | G2 | 가로 | 상을 사이에 두고 마주 앉은 묵과 소 | 그믐 11장 |
| g_cheong_dust | G2 | 세로 | 그믐당을 닦는 청의 뒷모습, 달 병풍 앞 | 그믐 4장 |
| g_seal_closeup | G2 | 가로 | 병풍 달 그림 귀퉁이의 작은 빈 붉은 낙관 | 그믐 4장 |
| g_lantern_hang | G2 | 세로 | 대문 처마에 흰 등을 거는 묵의 뒷모습 | 그믐 5장 |
| g_dan_first | G3 | 세로 | 7년 전, 스무 살 단이 젖은 골목에 서 있다 | 그믐 7장 |
| g_wall | G3 | 세로 | 그믐밤 담벼락 앞에 선 여자, 얼굴은 그늘 | 그믐 9장 |
| g_wall_years | G3 | 가로 | 같은 벽 앞, 세 칸에 걸쳐 머리가 희어지는 여자 | 그믐 9장 |
| g_young_muk | G4 | 세로 | 22년 전의 젊은 묵, 수염 없음, 화려한 방 | 그믐 6장 |
| g_so_hands | G4 | 정사각 | 찻잔을 쥔 젊은 여자의 손, 손끝에 물감 | 그믐 6장 |
| g_so_leaving | G4 | 가로 | 일어서 나가는 여자의 뒷모습, 바닥의 붓 한 자루 | 그믐 6장 |
| g_dan_seat | G4 | 정사각 | 상 앞에 앉아 두 손을 꽉 쥔 스무 살 단 | 그믐 7장 |
| g_bell_give | G4 | 가로 | 방울을 건네는 묵의 손과 받는 단의 손 | 그믐 7장 |
| g_baby_night | G4 | 세로 | 아기를 안고 대문 앞에 선 여자의 뒷모습, 말아 든 병풍 | 그믐 8장 |
| g_baby | G4 | 정사각 | 쪽빛 강보 속에 잠든 아기 | 그믐 8장 |
| g_baby_cushion | G4 | 세로 | 흰 방석 위의 아기, 접힌 빈 쪽지, 달 병풍 | 그믐 8장 |
| a_hwang_neutral | A1 | 정사각 | 국장 황, 기준 그림 | 자정 8번, 시즌 4·8장 |
| a_naeil_neutral | A1 | 정사각 | 집배원 내일, 기준 그림 | 자정 5번, 시즌 8장 |
| a_hwang_smile | A2 | 정사각 | 눈가로 웃는 국장 | 시즌 1·12장 |
| a_hwang_stern | A2 | 정사각 | 돋보기 너머로 보는 엄한 국장 | 자정 14번, 시즌 2·9장 |
| a_hwang_think | A2 | 정사각 | 장부를 짚으며 생각하는 국장 | 메아리 A2, 시즌 3·5장 |
| a_naeil_smile | A2 | 정사각 | 활짝 웃는 내일 | 자정 3·12번, 시즌 4·5·10장 |
| a_naeil_lost | A2 | 정사각 | 지도를 거꾸로 들고 당황한 내일 | 자정 5번, 시즌 1·4장 |
| a_naeil_quiet | A2 | 정사각 | 눈을 내리깐 내일 | 메아리 A1, 시즌 2·4·8·11·12장 |
| a_alley | A3 | 세로 | 자정 직전의 골목, 노란 우체통과 노란 등, 멀리 시계탑 | 자정 1번, 골목 카드 |
| a_counter | A3 | 세로 | 우체국 안, 열두 시에 멈춘 벽시계, 나무 창구 | 자정 4번, 시즌 2·7·8·12장 |
| a_out | A3 | 세로 | 우체국이 사라진 골목, 홀로 선 노란 우체통 | 자정 17번, 시즌 12장 |
| a_naeil_bike | A3 | 가로 | 우체국 문을 박차고 나오는 자전거와 내일 | 자정 2번, 시즌 1·10장 |
| a_knock | A3 | 가로 | 문 앞에서 봉투를 내미는 내일 | 배달되는 날, 시즌 1장 |
| a_returnbox | A3 | 세로 | 늦은 편지가 쌓인 낡은 빨간 철제 함 | 메아리 A3, 시즌 3장 |
| a_ledger | A3 | 세로 | 위에서 본 빈 일진 장부 | 자정 9번, 시즌 10장 |
| a_stamp | A4 | 가로 | 소인을 내려찍는 손 | 자정 11번 |
| a_stamps | A4 | 정사각 | 열두 띠 우표 한 장 | 자정 13번 |
| a_envelope | A4 | 정사각 | 노란 등기 봉투 | 자정 15번 |
| a_clock | A4 | 정사각 | 열두 시에 멈춘 시계 | 자정 7번, 시즌 2장 |
| a_s_rain | A5 | 세로 | 1996 장마, 끊긴 다리 앞의 젊은 황 | 시즌 6장 |
| a_s_empty_house | A5 | 가로 | 1996, 비어 있는 집과 문틈의 빈 안내문 | 시즌 7장 |
| a_s_exam | A5 | 세로 | 세 해 전 독서실, 편지를 쓰는 수험생 내일 | 시즌 4장 |
| a_s_window_rain | A5 | 세로 | 비 오는 자정, 창가에서 숄을 여미는 국장 | 시즌 5장 |
| a_s_yellow_letter | A5 | 정사각 | 반송함 맨 밑의 번진 노란 봉투 | 시즌 3·7·9·11장 |
| a_s_magnifier | A5 | 정사각 | 돋보기로 봉투를 비추는 국장의 손 | 시즌 9장 |
| a_s_studio_door | A5 | 세로 | 새벽 작업실 문 앞, 봉투를 내미는 내일과 소 | 시즌 11장 |
| a_s_naeil_letter | A5 | 정사각 | 자기 편지를 읽는 내일 | 시즌 12장 |
| a_s_clock_move | A5 | 정사각 | 시계 바늘을 미는 국장의 손 | 시즌 12장 |

## 그림을 받은 뒤

- 하늘에 달이 그려져 오면 다시 뽑게 하거나, 달이 안 보이게 잘라 쓴다 (make_cuts.py의 경로@x,y,너비,높이).
- 글자가 들어간 그림은 다시 뽑는다. 현판, 쪽지, 소인, 장부의 글자는 코드가 얹는다.
- 저장소 prototypes/dalmuri-alley에서 `python3 make_cuts.py g_so=g_so.png a_alley=a_alley.png …`로 img/에 넣는다. 칸 이름과 크기는 make_cuts.py의 SLOTS에 이미 있다.
- 그다음 index.html의 그림 목록에 이름을 더하고 대본집의 컷 순서대로 잇는다. 순서는 저장소의 HANDOFF.md.
