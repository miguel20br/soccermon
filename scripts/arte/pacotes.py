"""Arte dos pacotes da Loja do Time Ultimate: pixel art a 120x168 (+ margem), em PT e EN.

    uv run -q --with pillow --with numpy python scripts/arte/pacotes.py [nome ...]

Grava public/assets/ui/pacotes/{pt,en}/<nome>.png em 1x (a tela amplia com image-rendering: pixelated) e com
paleta (fica ~3 KB cada). Trocar uma cor: mexa no RAMP/PACKS e rode de novo; o jogo só lê o PNG pelo nome
(src/ui/ultimate/pack-art.ts).
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
OUT = os.path.join(REPO, 'public', 'assets', 'ui', 'pacotes')
W, H = 120, 168
PAD = 3  # margem transparente pro contorno e o brilho

INK = '#0e1430'
NIGHT = '#070a18'
YEL, YEL_L, YEL_LIP = '#ffcb05', '#fff3a0', '#ff8a1c'
BLUE3D = '#2a4ea0'
PAPER, LIP = '#ffffff', '#dbe2f2'
HOLO = ['#ff9ad5', '#9ae6ff', '#b6ffa0', '#fff29a']

RAMP = {
    # 6 tons, escuro -> claro
    'bronze': ['#3a200e', '#6a3c1c', '#9a5e30', '#c98a52', '#e4ae78', '#f8d8b0'],
    'prata': ['#3c4258', '#6a7288', '#9aa2b6', '#c9ced8', '#e4e8f0', '#ffffff'],
    'ouro': ['#5a3c06', '#946a10', '#c99a1e', '#e8c24a', '#f8de7c', '#fff3a0'],
    'noite': ['#070a18', '#10173a', '#1b2350', '#2a3a7a', '#3a4f9a', '#5a70c0'],
    'royal': ['#0e1430', '#16245a', '#203c8a', '#2a4ea0', '#3f6cc4', '#6c95e0'],
}
TYPE_COLOR = {
    'Rock': '#B6A136', 'Water': '#6390F0', 'Electric': '#F7D02C', 'Grass': '#7AC74C', 'Poison': '#A33EA1',
    'Fire': '#EE8130', 'Ground': '#E2BF65', 'Ice': '#96D9D6',
}
TYPE_PT = {
    'Rock': 'PEDRA', 'Water': 'ÁGUA', 'Electric': 'ELÉTRICO', 'Grass': 'PLANTA', 'Poison': 'VENENOSO',
    'Fire': 'FOGO', 'Ground': 'TERRESTRE', 'Ice': 'GELO',
}
# o texto impresso no pacote, por língua: (pequeno em cima, grande, etiqueta, chip)
TXT = {
    'pt': {
        'mini': ('PACOTE', 'MINI', '3 CARTAS', '1 PRATA+'),
        'grande': ('PACOTE', 'GRANDE', '5 CARTAS', '2 PRATA+'),
        'craque': ('SEU PRIMEIRO', 'CRAQUE', '1 DE 5', 'PRATA+'),
        'bronze': ('PICK', 'BRONZE', '1 DE 3', 'SÓ BRONZE'),
        'prata': ('PICK', 'PRATA', '1 DE 3', 'SÓ PRATA'),
        'ouro': ('PICK', 'OURO', '1 DE 3', 'SÓ OURO'),
        'evento-natal-2026': ('PICK DE', 'EVENTO', '1 DE 3', 'NATAL'),
        'lider': ('PICK DO', 'LÍDER', '1 DE 3', 'PRATA+'),
        'evento-mini': ('EVENTO', 'MINI', '3 CARTAS', 'NATAL'),
        'evento-grande': ('EVENTO', 'GRANDE', '5 CARTAS', 'NATAL'),
    },
    'en': {
        'mini': ('PACK', 'MINI', '3 CARDS', '1 SILVER+'),
        'grande': ('PACK', 'BIG', '5 CARDS', '2 SILVER+'),
        'craque': ('YOUR FIRST', 'STAR', '1 OF 5', 'SILVER+'),
        'bronze': ('PICK', 'BRONZE', '1 OF 3', 'BRONZE ONLY'),
        'prata': ('PICK', 'SILVER', '1 OF 3', 'SILVER ONLY'),
        'ouro': ('PICK', 'GOLD', '1 OF 3', 'GOLD ONLY'),
        'evento-natal-2026': ('PICK', 'EVENT', '1 OF 3', 'CHRISTMAS'),
        'lider': ('PICK', 'LEADER', '1 OF 3', 'SILVER+'),
        'evento-mini': ('EVENT', 'MINI', '3 CARDS', 'CHRISTMAS'),
        'evento-grande': ('EVENT', 'BIG', '5 CARDS', 'CHRISTMAS'),
    },
}
TYPE_TXT = {'pt': TYPE_PT, 'en': {k: k.upper() for k in TYPE_PT}}

_FONT = os.path.join(REPO, 'public', 'fonts', 'Galmuri11-Bold.woff2')
F12 = ImageFont.truetype(_FONT, 12)
F24 = ImageFont.truetype(_FONT, 24)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    a, b = rgb(a), rgb(b)
    return '#%02x%02x%02x' % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def type_ramp(c):
    return [mix(c, '#000000', 0.78), mix(c, '#000000', 0.58), mix(c, '#000000', 0.32), c, mix(c, '#ffffff', 0.4),
            mix(c, '#ffffff', 0.72)]


# ---------------------------------------------------------------- texto em pixel (sem antialias)
def _raw(txt, font):
    l, t, r, b = font.getbbox(txt)
    m = Image.new('L', (r - l + 4, font.size * 3), 0)
    d = ImageDraw.Draw(m)
    d.fontmode = '1'
    d.text((2 - l, font.size), txt, font=font, fill=255)
    return np.array(m) > 127


def text_mask(txt, font, with_dy=False):
    """Máscara recortada; dy = quantas fileiras o texto sobe acima do topo do H (acento)."""
    a = _raw(txt, font)
    cap = np.nonzero(_raw('H', font).any(1))[0].min()
    ys, xs = np.nonzero(a)
    m = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = cap - ys.min()  # fileiras acima do topo do H: o acento, colado na letra (sem o vão)
    if k > 0:
        keep = [i for i in range(len(m)) if i >= k or m[i].any()]
        m = m[keep]
        k = sum(1 for i in keep if i < k)
    return (m, -k) if with_dy else m


def dilate(a, diag=True):
    p = np.pad(a, 1)
    o = p.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if diag or dx == 0 or dy == 0:
                o |= np.roll(np.roll(p, dy, 0), dx, 1)
    return o


class Canvas:
    def __init__(self, w=W, h=H, pad=0):
        self.p = pad
        self.a = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
        self.w, self.h = w + 2 * pad, h + 2 * pad

    def px(self, x, y, c):
        x, y = x + self.p, y + self.p
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y, x] = (*rgb(c), 255)

    def maska(self, m, c):
        self.a[m] = (*rgb(c), 255)

    def rect(self, x0, y0, x1, y1, c):  # inclusivo
        x0, y0, x1, y1 = x0 + self.p, y0 + self.p, x1 + self.p, y1 + self.p
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(self.w - 1, x1), min(self.h - 1, y1)
        if x1 >= x0 and y1 >= y0:
            self.a[y0:y1 + 1, x0:x1 + 1] = (*rgb(c), 255)

    def mask(self, m, x, y, c):
        ys, xs = np.nonzero(m)
        for yy, xx in zip(ys, xs):
            self.px(x + xx, y + yy, c)

    def paste(self, img, x, y):
        im = Image.fromarray(self.a)
        im.alpha_composite(img, (x + self.p, y + self.p))
        self.a = np.array(im)

    def text(self, txt, font, cx, y, fill, outline=None, lip=None, shadow=None):
        """Texto centrado em cx; lip = a fileira de baixo de cada traço noutra cor (o lábio do logo)."""
        m, dy = text_mask(txt, font, True)
        x = cx - m.shape[1] // 2
        y += dy
        if outline:
            o = dilate(m)
            if shadow:
                self.mask(o, x - 1, y, shadow)
                self.mask(o, x - 1, y - 0, shadow)
                sh = np.pad(o, ((1, 0), (0, 0)))
                self.mask(sh, x - 1, y - 1 + 1, shadow)
            self.mask(o, x - 1, y - 1, outline)
        self.mask(m, x, y, fill)
        if lip:
            below = np.zeros_like(m)
            below[:-1] = m[:-1] & ~m[1:]
            below[-1] = m[-1]
            self.mask(below, x, y, lip)
        return m.shape[1]

    def img(self):
        return Image.fromarray(self.a)


# ---------------------------------------------------------------- peças
def card_back(w, h, ramp, ring=False, ring_c=YEL):
    """Verso de carta: moldura do metal, miolo escuro listrado e a carta holo do logo no centro."""
    c = Canvas(w + 4, h + 4)
    o = 2
    c.rect(o, o, o + w - 1, o + h - 1, INK)
    c.rect(o + 1, o + 1, o + w - 2, o + h - 2, ramp[3])
    c.rect(o + 1, o + 1, o + w - 2, o + 1, ramp[5])
    c.rect(o + 1, o + 1, o + 1, o + h - 2, ramp[4])
    c.rect(o + w - 2, o + 2, o + w - 2, o + h - 2, ramp[2])
    c.rect(o + 1, o + h - 2, o + w - 2, o + h - 2, ramp[1])
    for y in range(o + 3, o + h - 3):
        for x in range(o + 3, o + w - 3):
            c.px(x, y, '#141c44' if ((x + y) // 3) % 2 else '#0c1230')
    c.rect(o + 3, o + 3, o + w - 4, o + 3, INK)
    # cantos arredondados
    for (x, y) in [(o, o), (o + w - 1, o), (o, o + h - 1), (o + w - 1, o + h - 1)]:
        c.a[y, x] = 0
    # a carta do logo, miniatura: 9x12
    sx, sy = o + (w - 9) // 2, o + (h - 12) // 2
    c.rect(sx, sy, sx + 8, sy + 11, INK)
    c.rect(sx + 1, sy + 1, sx + 7, sy + 10, YEL)
    for y in range(sy + 2, sy + 10):
        for x in range(sx + 2, sx + 7):
            c.px(x, y, HOLO[((x - y) // 2) % 4])
    c.rect(sx + 3, sy + 4, sx + 5, sy + 7, PAPER)
    c.px(sx + 4, sy + 5, INK)
    c.px(sx + 4, sy + 6, YEL)
    c.px(sx + 3, sy + 4, LIP)
    c.px(sx + 5, sy + 7, LIP)
    if ring:
        a = c.a[..., 3] > 0
        r = dilate(a)[1:-1, 1:-1] & ~a
        r2 = dilate(r | a)[1:-1, 1:-1] & ~a & ~r
        c.mask(r, 0, 0, ring_c)
        c.mask(r2, 0, 0, INK)
    return c.img()


def sparkle(cv, x, y, c, big=False):
    cv.px(x, y, c)
    for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        cv.px(x + d[0], y + d[1], c)
    if big:
        for d in ((2, 0), (-2, 0), (0, 2), (0, -2)):
            cv.px(x + d[0], y + d[1], c)
    cv.px(x, y, '#ffffff')


def type_glyph(t, size):
    """O desenho branco do ícone de tipo do jogo, reduzido e sem antialias."""
    im = Image.open(f'{REPO}/public/assets/types/{t.lower()}.png').convert('RGBA')
    a = np.array(im).astype(int)
    white = (a[..., 0] > 230) & (a[..., 1] > 230) & (a[..., 2] > 230) & (a[..., 3] > 200)
    m = Image.fromarray((white * 255).astype(np.uint8)).crop((40, 40, 216, 216)).resize((size, size), Image.BOX)
    return np.array(m) > 110


# ---------------------------------------------------------------- o pacote
TOP, BOT = 10, 157  # corpo entre as costuras


def pack(spec):
    ramp = spec['ramp']
    crimp = spec.get('crimp', RAMP['prata'])
    cv = Canvas(pad=PAD)
    body = np.zeros((H, W), bool)
    body[TOP:BOT + 1, 3:W - 3] = True
    # beliscado nos cantos das costuras
    for (x, y) in [(3, TOP), (W - 4, TOP), (3, BOT), (W - 4, BOT)]:
        body[y, x] = False

    # sombreado do corpo: almofada (claro no meio-esquerda), raios atrás do emblema, faixa de brilho diagonal
    cx, cy = W // 2, spec.get('ray_cy', 66)
    tones = np.zeros((H, W))
    for y in range(H):
        for x in range(W):
            u = (x - 3) / (W - 7)
            pillow = math.sin(math.pi * min(1, max(0, u))) ** 0.7
            v = spec.get('base', 1.1) + 2.1 * pillow - 1.2 * max(0, u - 0.62)
            v -= 1.3 * max(0, 1 - (y - TOP) / 5) + 1.3 * max(0, 1 - (BOT - y) / 5)
            ang = math.atan2(y - cy, x - cx)
            dist = math.hypot(x - cx, y - cy)
            if spec.get('rays', True) and int((ang + math.pi) / (2 * math.pi) * 18) % 2 == 0:
                v += spec.get('ray_k', 0.8) * max(0, 1 - dist / 70)
            s = x - 0.5 * y
            if abs(s - 22) < 3.5 or abs(s - 32) < 1:
                v += 1.4
            tones[y, x] = v
    for y in range(H):
        for x in range(W):
            if body[y, x]:
                v = min(5, max(0, tones[y, x]))
                i = int(v) + (1 if (v - int(v)) > BAYER[y % 4, x % 4] else 0)
                cv.px(x, y, ramp[min(5, i)])

    # holo do pacote especial: faixas diagonais de holo por cima do brilho
    if spec.get('holo_body'):
        # pacote especial: as faixas de brilho viram holo (as cores da carta do logo), limpas
        for y in range(TOP + 2, BOT - 1):
            for x in range(3, W - 3):
                sx = x - 0.5 * y
                if body[y, x] and (abs(sx - 22) < 3.5 or abs(sx - 32) < 1 or abs(sx - 60) < 2.5):
                    cv.px(x, y, HOLO[int((y + x * 0.5) / 5) % 4])

    # pregas embaixo e em cima das costuras
    for x in range(9, W - 8, 10):
        for y, d in ((TOP + 1, 1), (BOT - 1, -1)):
            for k in range(3 if (x // 10) % 2 else 2):
                cv.px(x, y + d * k, ramp[0])
                cv.px(x + 1, y + d * k, ramp[min(5, 4)])

    # costuras (serrilhado com estrias), em cima e embaixo
    for (y0, y1, teeth_top) in ((0, TOP - 1, True), (BOT + 1, H - 1, False)):
        for y in range(y0, y1 + 1):
            for x in range(1, W - 1):
                edge = y == (y0 if teeth_top else y1)
                if edge and x % 4 in (0, 1):
                    continue
                if spec.get('holo_crimp'):
                    c = HOLO[((x + y) // 2) % 4] if x % 2 else mix(HOLO[((x + y) // 2) % 4], '#000000', 0.25)
                else:
                    c = crimp[4] if x % 2 else crimp[2]
                    if (y - y0) in (1, 2) and x % 2:
                        c = crimp[5]
                    if (y1 - y) == 0 and not edge:
                        c = crimp[1]
                cv.px(x, y, c)
        # costura pespontada
        yy = y1 - 2 if teeth_top else y0 + 2
        for x in range(4, W - 4, 3):
            cv.px(x, yy, crimp[0] if not spec.get('holo_crimp') else INK)

    # logo
    logo = Image.open(os.path.join(AQUI, 'logo96.png')).convert('RGBA')
    la = np.array(logo)
    la[..., 3] = np.where(la[..., 3] > 110, 255, 0)
    cv.paste(Image.fromarray(la), (W - 96) // 2, 14)

    # emblema
    spec['emblem'](cv, spec)

    # faixa do nome
    by0, by1 = 94, 133
    cv.rect(0, by0, W - 1, by1, INK)
    cv.rect(0, by0 + 1, W - 1, by0 + 1, ramp[4] if not spec.get('band_line') else spec['band_line'])
    cv.rect(0, by1 - 1, W - 1, by1 - 1, ramp[2] if not spec.get('band_line') else mix(spec['band_line'], '#000000', 0.4))
    cv.rect(0, by0 + 2, W - 1, by1 - 2, '#121a3e')
    for x in (0, 1, W - 2, W - 1):
        cv.rect(x, by0, x, by1, NIGHT)
    cv.text(spec['small'], F12, W // 2, by0 + 2, spec.get('small_c', YEL))
    cv.text(spec['big'], F24, W // 2, by0 + 17, PAPER, outline=None, lip=LIP)

    # selo (etiqueta amarela, como a .bc-tag)
    if spec.get('tag'):
        m = text_mask(spec['tag'], F12)
        tw = m.shape[1] + 7
        tx, ty = W - 4 - tw, 38
        cv.rect(tx - 1, ty - 1, tx + tw, ty + 12, INK)
        cv.rect(tx, ty, tx + tw - 1, ty + 11, YEL)
        cv.rect(tx, ty, tx + tw - 1, ty, YEL_L)
        cv.rect(tx, ty + 11, tx + tw - 1, ty + 11, YEL_LIP)
        cv.mask(m, tx + 4, ty + 2, INK)

    # chip da garantia (no metal)
    if spec.get('chip'):
        m, dy = text_mask(spec['chip'], F12, True)
        cw = m.shape[1] + 10
        cx0, cy0, chh = (W - cw) // 2, 137, 16
        ch = spec.get('chip_ramp', RAMP['prata'])
        cv.rect(cx0 - 1, cy0 - 1, cx0 + cw, cy0 + chh, INK)
        if spec.get('chip_holo'):
            for y in range(cy0, cy0 + chh):
                for x in range(cx0, cx0 + cw):
                    cv.px(x, y, HOLO[((x - y) // 4) % 4])
        else:
            cv.rect(cx0, cy0, cx0 + cw - 1, cy0 + chh - 1, ch[3])
            cv.rect(cx0, cy0, cx0 + cw - 1, cy0, ch[5])
            cv.rect(cx0, cy0 + chh - 1, cx0 + cw - 1, cy0 + chh - 1, ch[1])
        for (x, y) in [(cx0 - 1, cy0 - 1), (cx0 + cw, cy0 - 1), (cx0 - 1, cy0 + chh), (cx0 + cw, cy0 + chh)]:
            cv.a[y + PAD, x + PAD] = 0
        cv.mask(m, cx0 + 5, cy0 + 4 + dy, INK)

    # contorno de tinta em volta de tudo
    a = cv.a[..., 3] > 0
    out = dilate(a, diag=False)[1:-1, 1:-1] & ~a
    cv.maska(out, INK)
    if spec.get('glow'):
        a = cv.a[..., 3] > 0
        g = dilate(a, diag=False)[1:-1, 1:-1] & ~a
        cv.maska(g, spec['glow'])
        g2 = dilate(a | g, diag=False)[1:-1, 1:-1] & ~a & ~g
        cv.maska(g2, YEL_L)
        g3 = dilate(a | g | g2, diag=False)[1:-1, 1:-1] & ~a & ~g & ~g2
        cv.maska(g3, INK)
    return cv.img()


def W2(n):  # largura útil com o contorno extra do brilho
    return n


# ---------------------------------------------------------------- emblemas
def fan(metals, w=22, h=30):
    """Leque de N versos (o do meio na frente e mais alto); a cor da moldura conta o que tem dentro."""

    def draw(cv, spec):
        n = len(metals)
        mid = n // 2
        step = 15 if n == 3 else 14
        order = sorted(range(n), key=lambda i: -abs(i - mid))
        for i in order:
            k = abs(i - mid)
            img = card_back(w, h, RAMP[metals[i]])
            x = W // 2 - (w + 4) // 2 + (i - mid) * step
            y = 52 + k * 5 + (0 if n == 3 else 0)
            cv.paste(img, x, y)
        for (x, y, b) in spec.get('sparks', []):
            sparkle(cv, x, y, YEL_L, b)

    return draw


def choose(n, metal, w=None, h=None):
    """Picks: N versos lado a lado, o do meio levantado com o anel amarelo (escolha 1)."""

    def draw(cv, spec):
        ww = w or (20 if n == 3 else 16)
        hh = h or (28 if n == 3 else 22)
        gap = 5 if n == 3 else 3
        tot = n * ww + (n - 1) * gap
        x0 = (W - tot) // 2
        mid = n // 2
        for i in range(n):
            if i == mid:
                continue
            cv.paste(card_back(ww, hh, RAMP[metal]), x0 + i * (ww + gap) - 2, 64 + (2 if n == 5 else 0))
        cv.paste(card_back(ww + 2, hh + 3, RAMP[metal], ring=True, ring_c='#ffffff' if metal == 'ouro' else YEL), x0 + mid * (ww + gap) - 3, 54)
        for (x, y, b) in spec.get('sparks', []):
            sparkle(cv, x, y, YEL_L, b)

    return draw


def type_emblem(t):
    def draw(cv, spec):
        # medalhão do tipo: losango de tinta com o desenho branco, como uma insígnia
        r = 20
        cx, cy = W // 2, 70
        tr = spec['ramp']
        for y in range(cy - r - 2, cy + r + 3):
            for x in range(cx - r - 2, cx + r + 3):
                d = abs(x - cx) + abs(y - cy)
                if d <= r + 2:
                    cv.px(x, y, INK)
                if d <= r:
                    cv.px(x, y, tr[2] if (x - cx) + (y - cy) > 0 else tr[3])
                if r - 3 < d <= r:
                    cv.px(x, y, tr[4] if (y - cy) < 0 else tr[1])
        g = type_glyph(t, 24)
        sh = dilate(g)[1:-1, 1:-1]
        cv.mask(sh, cx - 12, cy - 12 + 1, tr[0])
        cv.mask(g, cx - 12, cy - 12, '#ffffff')
        for (x, y, b) in spec.get('sparks', []):
            sparkle(cv, x, y, YEL_L, b)

    return draw


# ---------------------------------------------------------------- catálogo
SPARK_A = [(16, 48, True), (102, 80, False), (22, 86, False)]

# o desenho de cada pacote (o texto vem do TXT); trocar cor = mexer aqui e rodar de novo
PACKS = {
    'mini': dict(ramp=RAMP['noite'], emblem=fan(['bronze', 'prata', 'bronze'])),
    'grande': dict(ramp=RAMP['royal'], emblem=fan(['bronze', 'prata', 'prata', 'bronze', 'bronze'], w=20, h=28),
                   base=1.3),
    'craque': dict(ramp=RAMP['noite'], emblem=choose(5, 'prata'), ray_k=1.4, crimp=RAMP['ouro'],
                   sparks=[(14, 50, True), (106, 54, False), (100, 44, False)]),
    'bronze': dict(ramp=RAMP['bronze'], chip_ramp=RAMP['bronze'], crimp=RAMP['bronze'], emblem=choose(3, 'bronze'),
                   small_c=RAMP['bronze'][4]),
    'prata': dict(ramp=RAMP['prata'], chip_ramp=RAMP['prata'], crimp=RAMP['prata'], emblem=choose(3, 'prata'),
                  small_c=RAMP['prata'][4]),
    'ouro': dict(ramp=RAMP['ouro'], chip_ramp=RAMP['ouro'], crimp=RAMP['ouro'], emblem=choose(3, 'ouro'),
                 sparks=SPARK_A, small_c=RAMP['ouro'][4]),
    'evento-natal-2026': dict(ramp=type_ramp(TYPE_COLOR['Ice']), chip_holo=True, holo_crimp=True,
                              emblem=choose(3, 'prata'), ray_k=1.6, sparks=SPARK_A + [(98, 46, True)],
                              small_c=HOLO[1]),
    'lider': dict(ramp=RAMP['noite'], emblem=choose(3, 'prata')),
    # pacotes de Evento do Desafio de Natal (todas as cartas Evento): a cor do Pick de Natal com o leque do Mini/Grande
    'evento-mini': dict(ramp=type_ramp(TYPE_COLOR['Ice']), chip_holo=True, holo_crimp=True,
                        emblem=fan(['prata', 'prata', 'prata']), sparks=SPARK_A, small_c=HOLO[1]),
    'evento-grande': dict(ramp=type_ramp(TYPE_COLOR['Ice']), chip_holo=True, holo_crimp=True,
                          emblem=fan(['prata', 'prata', 'prata', 'prata', 'prata'], w=20, h=28), base=1.3,
                          sparks=SPARK_A + [(98, 46, True)], small_c=HOLO[1]),
}
# Pick do líder com tipo (GYMS em src/store/ultimate/rules.ts; a Sabrina, sem tipo, usa o 'lider')
for _t in ('Rock', 'Water', 'Electric', 'Grass', 'Poison', 'Fire', 'Ground'):
    _r = type_ramp(TYPE_COLOR[_t])
    PACKS[f'lider-{_t.lower()}'] = dict(ramp=_r, chip_ramp=_r, crimp=RAMP['prata'], emblem=type_emblem(_t),
                                        small_c=_r[5], chip_type=_t)


def spec_for(name, lang):
    s = dict(PACKS[name])
    small, big, tag, chip = TXT[lang]['lider' if name.startswith('lider') else name]
    if 'chip_type' in s:
        chip = TYPE_TXT[lang][s['chip_type']]
    s.update(small=small, big=big, tag=tag, chip=chip)
    s.setdefault('small_c', YEL)
    return s


def save(path, img):
    """PNG com paleta: as 256 cores mais usadas ficam exatas; as que sobram (o antialias do logo) vão pra mais perto."""
    a = np.array(img)
    a[a[..., 3] == 0] = 0
    flat = a.reshape(-1, 4).astype(int)
    cols, idx, cnt = np.unique(flat, axis=0, return_inverse=True, return_counts=True)
    keep = np.argsort(-cnt)[:256]
    pal = cols[keep]
    d = ((cols[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
    lut = d.argmin(1)
    p = Image.fromarray(lut[idx.ravel()].reshape(a.shape[:2]).astype(np.uint8), 'P')
    p.putpalette(pal[:, :3].astype(np.uint8).tobytes())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    p.save(path, optimize=True, transparency=bytes(pal[:, 3].astype(np.uint8)))


if __name__ == '__main__':
    import sys
    only = sys.argv[1:]
    for lang in TXT:
        for name in PACKS:
            if not only or name in only:
                save(os.path.join(OUT, lang, f'{name}.png'), pack(spec_for(name, lang)))
