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
        'src': {'blink': 'd1c99e44', 'think': 'd4752656', 'surprise': 'a18f4fdf', 'smile_open': 'f6b85d97',
                'neutral': '1da020d7', 'neutral_open': 'fdd032ff', 'think_open': 'a3b54430',
                'smile': '75bdcb35'},          # 웃음만 캔버스가 달라(1113x1414) 크기와 위치를 맞춰 쓴다
        'base': 'smile_open',
        'face': (612, 420, 190, 205),
        'eyes': [(530, 338, 60, 34), (690, 338, 60, 34)],
        'mouth': (612, 500, 86, 50),
        'make': {
            'neutral': ('neutral', None), 'neutral_open': ('neutral_open', None),
            'smile': ('smile', None), 'smile_open': ('smile_open', None),
            'think': ('think', None), 'think_open': ('think_open', None),
            'surprise': ('surprise', None),
        },
    },
    'saetbyeol': {    # 샛별 (별자리). 그림이 두 가지 캔버스로 왔다. 어깨가 다 보이는 1209x1301 쪽을 기준으로 쓴다.
        'src': {'neutral': '039c96f7', 'neutral_open': 'c4e9fd84', 'surprise': '6cc9484e', 'blink': '1607dede',
                'smile': '2bd88d31', 'smile_open': 'd2a48801', 'think': 'a3696e93', 'think_open': '93138186'},
        'base': 'neutral', 'wide_search': True,
        'face': (615, 400, 172, 186),
        'eyes': [(545, 322, 56, 30), (683, 322, 56, 30)],
        'mouth': (615, 482, 80, 44),
        'make': {
            'neutral': ('neutral', None), 'neutral_open': ('neutral_open', None),
            'smile': ('smile', None), 'smile_open': ('smile_open', None),
            'think': ('think', None), 'think_open': ('think_open', None),
            'surprise': ('surprise', None),
        },
    },
}

def load(folder, key):
    return Image.open(os.path.join(folder, key + '-image.png')).convert('RGBA')

def ellipse_mask(size, ellipses, feather):
    m = Image.new('L', size, 0); d = ImageDraw.Draw(m)
    for cx, cy, rx, ry in ellipses: d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))

def shift_to(base, im, face, R=10):
    """머리 둘레(얼굴 안쪽 제외)가 기준 그림과 가장 잘 겹치는 이동량을 찾는다."""
    cx, cy, rx, ry = face
    box = (int(cx - rx * 1.5), int(cy - ry * 1.5), int(cx + rx * 1.5), int(cy + ry * 1.35))
    g = lambda x: np.asarray(x.convert('L').crop(box).resize(((box[2] - box[0]) // 2, (box[3] - box[1]) // 2)), dtype=np.float32)
    A, B = g(base), g(im)
    h, w = A.shape
    yy, xx = np.mgrid[0:h, 0:w]
    ring = (((xx - w / 2) / (rx * 0.5 * 0.92)) ** 2 + ((yy - h * 1.5 / 2.85) / (ry * 0.5 * 0.92)) ** 2) > 1
    best = (1e18, 0, 0)
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            ys = slice(R + dy, h - R + dy); xs = slice(R + dx, w - R + dx)
            e = (np.abs(A[R:h - R, R:w - R] - B[ys, xs]) * ring[R:h - R, R:w - R]).mean()
            if e < best[0]: best = (e, dx, dy)
    return -best[1] * 2, -best[2] * 2, round(float(best[0]), 2)

def fit_canvas(base, im, face):
    """캔버스 크기가 다른 그림을 기준 그림에 맞춘다: 배율을 바꿔 가며 위상 상관으로 위치를 찾는다."""
    def gray(x, size=None):
        bg = Image.new('RGBA', x.size, (0, 0, 0, 255)); bg.alpha_composite(x)
        g = bg.convert('L'); g = g.resize((g.width // 4, g.height // 4), Image.LANCZOS)
        return np.asarray(g, dtype=np.float32)
    A = gray(base); best = (-1, 1, 0, 0)
    for sc in np.arange(0.90, 1.121, 0.01):
        B = gray(im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS))
        h, w = max(A.shape[0], B.shape[0]), max(A.shape[1], B.shape[1])
        pa = np.zeros((h, w), np.float32); pb = np.zeros((h, w), np.float32)
        pa[:A.shape[0], :A.shape[1]] = A - A.mean(); pb[:B.shape[0], :B.shape[1]] = B - B.mean()
        fa, fb = np.fft.rfft2(pa), np.fft.rfft2(pb)
        cc = np.fft.irfft2(fa * np.conj(fb), s=(h, w)) / (np.linalg.norm(pa) * np.linalg.norm(pb) + 1e-9)
        iy, ix = np.unravel_index(np.argmax(cc), cc.shape); peak = cc[iy, ix]
        dy = iy - h if iy > h // 2 else iy; dx = ix - w if ix > w // 2 else ix
        if peak > best[0]: best = (float(peak), float(sc), int(dx * 4), int(dy * 4))
    peak, sc, dx, dy = best
    out = Image.new('RGBA', base.size, (0, 0, 0, 0))
    out.paste(im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS), (dx, dy))
    print('  canvas fit: scale', round(sc, 2), 'offset', dx, dy, 'match', round(peak, 3))
    return out

# 부스 안 배경. wall: 뒷벽에 붙일 그림, side: 옆 비닐 벽 (장면 그림의 오른쪽 벽을 잘라 쓴다). (원본, 자를 영역 또는 None)
BACKGROUNDS = {
    'tarot': {'wall': ('2dc7dee7', (290, 0, 1385, 590)), 'side': ('2dc7dee7', (1385, 0, 1672, 770))},
    'saju': {'wall': ('2cc638fe', None), 'side': ('6d007118', (1458, 0, 1672, 756))},
    'star': {'wall': ('9c6db339', None)},
}

def backgrounds(folder, out):
    for name, parts in BACKGROUNDS.items():
        for part, (key, box) in parts.items():
            im = load(folder, key).convert('RGB')
            if box: im = im.crop(box)
            im.save(os.path.join(out, f'{name}_{part}.webp'), quality=86, method=6)
            print('background', name, part, im.size)

def main():
    folder = sys.argv[1]
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'img')
    os.makedirs(out, exist_ok=True)
    meta = {}
    for name, c in CHARS.items():
        src = {k: load(folder, v) for k, v in c['src'].items()}
        base = src[c['base']]; W, H = base.size
        for k in src:
            if src[k].size != base.size: print(name, k, 'size', src[k].size); src[k] = fit_canvas(base, src[k], c['face'])
        aligned = {}
        for k, im in src.items():
            dx, dy, err = (0, 0, 0) if k == c['base'] else shift_to(base, im, c['face'], 24 if c.get('wide_search') else 10)
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
    backgrounds(folder, out)
    print(json.dumps(meta))

main()
