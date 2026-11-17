"""그믐 골목 컷 만들기.

받은 그림(PNG/JPG)을 페이지가 쓰는 img/gm_<이름>.webp로 바꾼다. 비율이 다르면 가운데를 기준으로 잘라 맞춘다.
원본은 용량이 커서 저장소에 넣지 않는다.

쓰는 법:  python3 make_cuts.py 이름=원본경로 [이름=원본경로 ...]
예:       python3 make_cuts.py alley=~/Downloads/alley.png muk_calm=~/Downloads/muk1.png

이름과 크기는 아래 SLOTS. 그림을 바꾼 뒤에는 index.html의 SPOT(눈, 방울, 책, 촛불, 빈 종이, 밀랍, 현판 자리)과
OHAENG(오행 그림에서 다섯 색이 도는 자리)을 새 그림에 맞춰 고친다.
"""
import sys
from pathlib import Path
from PIL import Image

TALL, LAND, SQ, SIGN = (1024, 1536), (1200, 800), (1024, 1024), (1024, 512)
SLOTS = {
    # 장면
    'alley': TALL,      # 골목 입구 (금줄, 청사초롱)
    'booth': LAND,      # 골목 끝 천막 (빈 현판, 방석)
    'gate': TALL,       # 붉은 대문 너머 그믐당
    'desk': TALL,       # 빈 한지 앞의 묵 선생 (병풍 속 달)
    'tea': TALL,        # 찻잔을 내미는 손 (왼쪽에 촛불)
    'brush': TALL,      # 붓을 쥔 손과 빈 한지
    'ohaeng': TALL,     # 다섯 색 기운
    'envelope': SQ,     # 밀랍으로 봉한 봉투
    'sign': SIGN,       # 빈 현판 (투명 배경)
    'paper': TALL,      # 궁합: 위에서 본 네 칸 한지 (두 사람의 여덟 글자를 쓴다)
    'ring': SQ,         # 궁합: 다섯 기운 고리 (두 사람의 오행을 함께 얹는다)
    # 단: 듣는 사람
    'dan_neutral': SQ, 'dan_speak': SQ, 'dan_smile': SQ,
    # 청: 찾는 사람
    'cheong_neutral': SQ, 'cheong_read': SQ, 'cheong_guide': SQ,
    # 묵 선생: 읽는 사람
    'muk_calm': SQ, 'muk_knowing': SQ, 'muk_smile': SQ, 'muk_think': SQ,
    'muk_surprise': SQ, 'muk_stern': SQ, 'muk_sly': SQ, 'muk_pierce': SQ,
    # 선택: 있으면 단과 청의 표정이 더 다양해진다. 넣은 뒤 index.html의 GM_EXTRA에 이름을 더한다
    'dan_tease': SQ, 'dan_surprise': SQ, 'dan_serious': SQ, 'dan_pout': SQ,
    'cheong_smile': SQ, 'cheong_surprise': SQ, 'cheong_fluster': SQ, 'cheong_explain': SQ,
    'duo': LAND,        # 천막 상 뒤에 나란히 앉은 단과 청
}


def fit(im, size):
    w, h = size
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    out = Path(__file__).resolve().parent / 'img'
    for arg in args:
        name, _, path = arg.partition('=')
        if name not in SLOTS or not path:
            sys.exit(f'모르는 이름이거나 경로가 없다: {arg}\n이름: {", ".join(SLOTS)}')
        size, alpha = SLOTS[name], name == 'sign'
        im = Image.open(Path(path).expanduser()).convert('RGBA' if alpha else 'RGB')
        if alpha:          # 투명 배경 가장자리에 남은 옅은 번짐을 지운다
            im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 16 else v))
        ratio = (im.width / im.height) / (size[0] / size[1])
        dst = out / f'gm_{name}.webp'
        fit(im, size).save(dst, 'WEBP', quality=80, method=6)
        note = '' if 0.97 < ratio < 1.03 else f'  (비율이 달라 잘랐다: {im.width}x{im.height})'
        print(f'{dst.name:24s} {dst.stat().st_size // 1024:4d}KB{note}')


if __name__ == '__main__':
    main()
