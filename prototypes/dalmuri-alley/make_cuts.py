"""그믐 골목 컷 만들기.

받은 그림(PNG/JPG)을 페이지가 쓰는 img/gm_*.webp 열한 장으로 바꾼다.
세로 컷은 2:3 (1024×1536), 인물과 봉투는 1:1 (1024×1024). 비율이 다르면 가운데를 기준으로 잘라 맞춘다.

쓰는 법:  python3 make_cuts.py <원본 폴더>
아래 CUTS의 빈칸에 원본 파일 이름(확장자까지)을 적는다. 비워 둔 컷은 건너뛴다.
그림을 바꾼 뒤에는 index.html의 GM_SPOT(문패, 빈 한지, 눈의 위치)을 새 그림에 맞춰 고친다.
"""
import sys
from pathlib import Path
from PIL import Image

TALL, SQ = (1024, 1536), (1024, 1024)
CUTS = {
    # 이름: (원본 파일, 크기)          # ROADMAP 8절의 그림 번호와 내용
    'alley': ('', TALL),               # 1 골목 입구
    'gate': ('', TALL),                # 2 대문 (빈 문패)
    'room': ('', TALL),                # 3 방 안
    'muk_neutral': ('', SQ),           # 4 인물 기준 (입 다문 얼굴)
    'muk_speak': ('', SQ),             # 5 말하는 얼굴
    'muk_think': ('', SQ),             # 6 눈 감고 생각하는 얼굴
    'muk_surprise': ('', SQ),          # 7 눈썹 올린 얼굴
    'muk_smile': ('', SQ),             # 8 옅은 미소
    'brush': ('', TALL),               # 9 붓 쥔 손과 빈 한지
    'ohaeng': ('', TALL),              # 10 오행 연출
    'envelope': ('', SQ),              # 11 한지 봉투
}


def fit(im, size):
    w, h = size
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(__file__).parent / 'img'
    for name, (file, size) in CUTS.items():
        if not file:
            print(f'건너뜀  gm_{name} (원본을 적지 않음)')
            continue
        im = Image.open(src / file).convert('RGB')
        ratio = (im.width / im.height) / (size[0] / size[1])
        dst = out / f'gm_{name}.webp'
        fit(im, size).save(dst, 'WEBP', quality=84, method=6)
        note = '' if 0.97 < ratio < 1.03 else f'  ← 비율이 달라 잘랐다 ({im.width}×{im.height})'
        print(f'만듦    {dst.name}  {dst.stat().st_size // 1024}KB{note}')


if __name__ == '__main__':
    main()
