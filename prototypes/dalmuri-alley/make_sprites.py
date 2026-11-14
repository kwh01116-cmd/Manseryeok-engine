"""GPT 이미지로 뽑은 표정 그림들을 게임용 스프라이트로 가공한다.

  python3 make_sprites.py <원본 PNG 폴더> [--debug <미리보기 폴더>]

표정 그림마다 몸통이 미세하게 달라서 통째로 바꿔 끼우면 옷이 일렁인다.
그래서 몸통은 기준 그림 한 장만 쓰고, 표정은 얼굴 부분만 오려 가장자리를 흐리게 한
조각으로 만든다. 없는 표정(입 다문 기본 등)은 다른 그림의 입을 옮겨 붙여 만든다.
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SCALE = 0.8          # 원본 대비 출력 크기
Q = 88

CHARS = {
    'boreum': {       # 보름달 (사주)
        'src': {'neutral_open': '978df59c', 'smile_open': '105cb194', 'surprise': '44e4d895', 'blink': 'a0301c80',
                'smile': '3fa647d0', 'think_open': 'c90dbb6e', 'think': '44ab3682'},
        'base': 'smile',
        'face': (608, 372, 196, 214),          # 얼굴 타원: cx, cy, rx, ry (원본 픽셀)
        'eyes': [(528, 308, 62, 34), (690, 308, 62, 34)],
        'mouth': (612, 462, 84, 46),
        'make': {     # 결과 표정: (얼굴 원본, 입을 가져올 원본 또는 None)
            'neutral': ('neutral_open', 'blink'), 'neutral_open': ('neutral_open', None),
            'smile': ('smile', None), 'smile_open': ('smile_open', None),
            'think': ('think', None), 'think_open': ('think_open', None),
            'surprise': ('surprise', None),
        },
    },
    'dalmuri': {      # 달무리 (타로)
        'src': {'blink': 'd1c99e44', 'think': 'd4752656', 'surprise': 'a18f4fdf', 'smile_open': 'f6b85d97'},
        'base': 'smile_open',
        'face': (612, 420, 190, 205),
        'eyes': [(530, 338, 60, 34), (690, 338, 60, 34)],
        'mouth': (612, 500, 86, 50),
        # 달무리는 기본·말하는 기본·웃음·생각하며 말하는 그림이 아직 없다.
        # 입 다문 기본만 합성하고, 나머지는 페이지에서 가까운 표정으로 대신한다.
        'make': {
            'neutral': ('smile_open', 'blink'), 'smile_open': ('smile_open', None),
            'think': ('think', None), 'surprise': ('surprise', None),
        },
    },
}

def load(folder, key):
    return Image.open(os.path.join(folder, key + '-image.png')).convert('RGBA')

def ellipse_mask(size, ellipses, feather):
    m = Image.new('L', size, 0); d = ImageDraw.Draw(m)
    for cx, cy, rx, ry in ellipses: d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))

def shift_to(base, im, face):
    """머리 둘레(얼굴 안쪽 제외)가 기준 그림과 가장 잘 겹치는 이동량을 찾는다."""
    cx, cy, rx, ry = face
    box = (int(cx - rx * 1.5), int(cy - ry * 1.5), int(cx + rx * 1.5), int(cy + ry * 1.35))
    g = lambda x: np.asarray(x.convert('L').crop(box).resize(((box[2] - box[0]) // 2, (box[3] - box[1]) // 2)), dtype=np.float32)
    A, B = g(base), g(im)
    h, w = A.shape
    yy, xx = np.mgrid[0:h, 0:w]
    ring = (((xx - w / 2) / (rx * 0.5 * 0.92)) ** 2 + ((yy - h * 1.5 / 2.85) / (ry * 0.5 * 0.92)) ** 2) > 1
    best = (1e18, 0, 0); R = 10
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            ys = slice(R + dy, h - R + dy); xs = slice(R + dx, w - R + dx)
            e = (np.abs(A[R:h - R, R:w - R] - B[ys, xs]) * ring[R:h - R, R:w - R]).mean()
            if e < best[0]: best = (e, dx, dy)
    return -best[1] * 2, -best[2] * 2, round(float(best[0]), 2)

def main():
    folder = sys.argv[1]
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'img')
    os.makedirs(out, exist_ok=True)
    meta = {}
    for name, c in CHARS.items():
        src = {k: load(folder, v) for k, v in c['src'].items()}
        base = src[c['base']]; W, H = base.size
        aligned = {}
        for k, im in src.items():
            dx, dy, err = (0, 0, 0) if k == c['base'] else shift_to(base, im, c['face'])
            aligned[k] = im.transform(im.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), resample=Image.BICUBIC)
            print(name, k, 'shift', dx, dy, 'err', err)
        cx, cy, rx, ry = c['face']; pad = 26
        box = (cx - rx - pad, cy - ry - pad, cx + rx + pad, cy + ry + pad)
        face_m = ellipse_mask(base.size, [c['face']], 14)
        mouth_m = ellipse_mask(base.size, [c['mouth']], 9)
        eyes_m = ellipse_mask(base.size, c['eyes'], 7)
        sz = lambda im: im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
        sz(base).save(os.path.join(out, f'{name}_body.webp'), quality=Q, method=6)
        states = []
        for state, (face_src, mouth_src) in c['make'].items():
            full = aligned[face_src].copy()
            if mouth_src: full.paste(aligned[mouth_src], (0, 0), mouth_m)
            patch = full.convert('RGB').convert('RGBA'); patch.putalpha(face_m)
            sz(patch.crop(box)).save(os.path.join(out, f'{name}_{state}.webp'), quality=Q, method=6)
            states.append(state)
            if debug:
                comp = base.copy(); comp.paste(full, (0, 0), face_m)
                bg = Image.new('RGBA', comp.size, (40, 30, 80, 255)); bg.alpha_composite(comp)
                bg.convert('RGB').crop((box[0] - 60, box[1] - 60, box[2] + 60, box[3] + 60)).save(os.path.join(debug, f'{name}_{state}.jpg'), quality=85)
        blink = aligned['blink'].convert('RGB').convert('RGBA'); blink.putalpha(eyes_m)
        sz(blink.crop(box)).save(os.path.join(out, f'{name}_blink.webp'), quality=Q, method=6)
        if debug:
            comp = base.copy(); comp.paste(aligned['blink'], (0, 0), eyes_m)
            bg = Image.new('RGBA', comp.size, (40, 30, 80, 255)); bg.alpha_composite(comp)
            bg.convert('RGB').crop((box[0] - 60, box[1] - 60, box[2] + 60, box[3] + 60)).save(os.path.join(debug, f'{name}_blinkOnBase.jpg'), quality=85)
        meta[name] = {'w': W, 'h': H, 'rect': [box[0] / W, 1 - box[3] / H, (box[2] - box[0]) / W, (box[3] - box[1]) / H],
                      'neck': [cx / W, 1 - (cy + ry * 1.12) / H], 'states': states}
    print(json.dumps(meta))

main()
