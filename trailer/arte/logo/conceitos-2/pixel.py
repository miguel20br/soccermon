"""Logo do Soccermon, rodada 2: 3 conceitos em PIXEL ART de verdade (a partir do conceito do Miguel: carta holo +
bola que também é pokébola, sobre raios azul-noite).

Tudo é desenhado por código numa grade de pixels (amostra no centro do pixel, sem anti-aliasing), com paleta
limitada e contorno de 1 px. Como as formas são funções, cada tamanho é redesenhado na grade dele (o ícone de 32 px
é 32x32 pixels de verdade, não uma redução borrada do de 1024).

A: Carta holo   — carta ouro holográfica inclinada, nota 99 no canto, tipo, bola-pokébola nossa no meio.
B: Pacote       — a bola estoura de um pacote de cartas rasgado, com luz e cartas voando.
C: Brasão       — escudo de clube feito da bola-pokébola, 3 estrelas em cima.

A bola "nossa": 3 pentágonos grandes (lê como bola até em 32 px), faixa grossa inclinada como faixa de camisa
(não a faixa reta da pokébola) e botão dourado de medalha.

    python3 trailer/arte/logo/conceitos-2/pixel.py   (escreve SVG + PNG em ./saida/)

Só biblioteca padrão (PNG escrito com zlib).
"""
import math
import os
import re
import struct
import sys
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")
sys.path.insert(0, os.path.dirname(AQUI))
from gerar import ESQ, TRACO  # noqa: E402  (esqueletos das letras do logo atual)

# ---------------- paleta ----------------
K = "#0b0f24"  # contorno
NAVY, NAVY2, AZUL, AZUL2 = "#0e1430", "#1d2654", "#2a4ea0", "#4a74d0"
BR, BR2, BR3 = "#ffffff", "#e3e9f7", "#aab6d8"
OURO = ("#fff3a0", "#ffcb05", "#ff8a1c", "#b85a10")
PRATA = ("#fbfcfe", "#d3d8e1", "#9aa2b0", "#5d6577")
HOLO = ("#ff9ad5", "#9ae6ff", "#b6ffa0", "#fff29a", "#d7a6ff")
VERM = ("#ff8f8d", "#e8423f", "#a42a2a")
FUNDO = ("#2a3a7a", "#212f66", "#1a2552", "#131b3f", "#0d132c", "#070a18")
SOMBRA = "#04060f"

BAYER = ((0, 8, 2, 10), (12, 4, 14, 6), (3, 11, 1, 9), (15, 7, 13, 5))


# ---------------- motor de pixels ----------------
class View:
    """Pixel -> coordenada de desenho: d = (p + .5 - off) / k (k = pixels por unidade de desenho)."""

    def __init__(self, k, ox=0.0, oy=0.0):
        self.k, self.ox, self.oy = k, ox, oy


def rast(w, h, v, f, caixa=None):
    """Camada {(x, y): cor} com f(x, y) avaliada no centro de cada pixel (coordenadas de desenho)."""
    if caixa:
        x0, y0, x1, y1 = caixa
        px0, py0 = max(0, int(x0 * v.k + v.ox) - 1), max(0, int(y0 * v.k + v.oy) - 1)
        px1, py1 = min(w, int(x1 * v.k + v.ox) + 2), min(h, int(y1 * v.k + v.oy) + 2)
    else:
        px0, py0, px1, py1 = 0, 0, w, h
    out = {}
    for py in range(py0, py1):
        for px in range(px0, px1):
            c = f((px + 0.5 - v.ox) / v.k, (py + 0.5 - v.oy) / v.k)
            if c:
                out[(px, py)] = c
    return out


def contorno(cam, cor=K, viz=8):
    vs = ((1, 0), (-1, 0), (0, 1), (0, -1)) + (((1, 1), (1, -1), (-1, 1), (-1, -1)) if viz == 8 else ())
    return {(x + dx, y + dy): cor for (x, y) in cam for dx, dy in vs if (x + dx, y + dy) not in cam}


class Tela:
    def __init__(self, w, h):
        self.w, self.h, self.px = w, h, {}

    def por(self, cam, borda=K, viz=8):
        if borda:
            self.px.update(contorno(cam, borda, viz))
        self.px.update(cam)

    def sombra(self, cam, dx, dy, cor=SOMBRA):
        self.px.update({(x + dx, y + dy): cor for (x, y) in cam})

    def recortar(self, dentro):
        self.px = {p: c for p, c in self.px.items() if dentro(*p) and 0 <= p[0] < self.w and 0 <= p[1] < self.h}

    def svg(self, escala):
        linhas = []
        for y in range(self.h):
            x = 0
            while x < self.w:
                c = self.px.get((x, y))
                if not c:
                    x += 1
                    continue
                x0 = x
                while x < self.w and self.px.get((x, y)) == c:
                    x += 1
                linhas.append(f'<rect x="{x0}" y="{y}" width="{x - x0}" height="1" fill="{c}"/>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w * escala}" '
                f'height="{self.h * escala}" shape-rendering="crispEdges">{"".join(linhas)}</svg>\n')

    def png(self, escala):
        rgb = {}
        linhas = []
        for y in range(self.h):
            lin = bytearray()
            for x in range(self.w):
                c = self.px.get((x, y))
                if c not in rgb:
                    rgb[c] = bytes((int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255)) if c else b"\0\0\0\0"
                lin += rgb[c] * escala
            linhas.extend([b"\0" + bytes(lin)] * escala)
        W, H = self.w * escala, self.h * escala
        bloco = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)  # noqa: E731
        return (b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
                + bloco(b"IDAT", zlib.compress(b"".join(linhas), 9)) + bloco(b"IEND", b""))


def gravar(tela, nome, escala, svg=True):
    os.makedirs(SAIDA, exist_ok=True)
    with open(os.path.join(SAIDA, nome + ".png"), "wb") as f:
        f.write(tela.png(escala))
    if not svg:
        return
    with open(os.path.join(SAIDA, nome + ".svg"), "w") as f:
        f.write(tela.svg(escala))


# ---------------- geometria ----------------
def girar(x, y, cx, cy, graus):
    """Leva (x, y) pro sistema local de um objeto em (cx, cy) girado `graus` (rotação inversa)."""
    a = math.radians(-graus)
    dx, dy = x - cx, y - cy
    return dx * math.cos(a) - dy * math.sin(a), dx * math.sin(a) + dy * math.cos(a)


def para_tela(lx, ly, cx, cy, graus):
    a = math.radians(graus)
    return cx + lx * math.cos(a) - ly * math.sin(a), cy + lx * math.sin(a) + ly * math.cos(a)


def ret_arred(x, y, w, h, r):
    """Dentro de um retângulo centrado na origem (w x h) com cantos de raio r?"""
    qx, qy = abs(x) - (w / 2 - r), abs(y) - (h / 2 - r)
    if qx <= 0 or qy <= 0:
        return abs(x) <= w / 2 and abs(y) <= h / 2
    return qx * qx + qy * qy <= r * r


def poligono(x, y, pts):
    dentro = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            dentro = not dentro
        j = i
    return dentro


def pentagono(cx, cy, r, rot=-90):
    return [(cx + math.cos(math.radians(rot + i * 72)) * r, cy + math.sin(math.radians(rot + i * 72)) * r) for i in range(5)]


def estrela(cx, cy, r1, r2, n, rot=-90):
    return [(cx + math.cos(math.radians(rot + i * 180 / n)) * (r1 if i % 2 == 0 else r2),
             cy + math.sin(math.radians(rot + i * 180 / n)) * (r1 if i % 2 == 0 else r2)) for i in range(2 * n)]


# ---------------- sprites (sempre alinhados à grade, mesmo em objeto girado) ----------------
FONTE4 = {  # 4x6
    "9": ["####", "#..#", "#..#", "####", "...#", "####"],
}
FONTE3 = {"9": ["###", "#.#", "###", "..#", "###"]}
RAIO = ["...##", "..##.", ".####", "..##.", ".##..", "##..."]  # 5x6, tipo Elétrico
BRILHO = ["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."]
BRILHO_P = [".#.", "###", ".#."]


def sprite(arte, x, y, cor, esc=1):
    out = {}
    for j, lin in enumerate(arte):
        for i, ch in enumerate(lin):
            if ch == "#":
                for a in range(esc):
                    for b in range(esc):
                        out[(int(x) + i * esc + a, int(y) + j * esc + b)] = cor
    return out


def texto(s, fonte, x, y, cor, esc=1):
    out, cx = {}, x
    for ch in s:
        out.update(sprite(fonte[ch], cx, y, cor, esc))
        cx += (len(fonte[ch][0]) + 1) * esc
    return out


# ---------------- fundo de marca ----------------
def fundo(w, h, cx, cy, raio, n_raios=16, raio_cantos=0, dither=True):
    def f(x, y):
        if raio_cantos and not ret_arred(x - w / 2, y - h / 2, w, h, raio_cantos):
            return None
        t = min(1.0, math.hypot(x - cx, y - cy) / raio)
        v = t * (len(FUNDO) - 1)
        i = int(v)
        if dither and v - i > (BAYER[int(y) % 4][int(x) % 4] + 0.5) / 16:
            i += 1
        ang = (math.atan2(y - cy, x - cx) / (2 * math.pi) * n_raios + 0.25) % 1
        if ang < 0.42:
            i -= 2
        return FUNDO[max(0, min(len(FUNDO) - 1, i))]
    return f


# ---------------- a bola-pokébola "nossa" ----------------
def bola(cx, cy, R, inclina=-18, k=1.0):
    """Bola branca, 3 pentágonos grandes, faixa grossa inclinada e botão dourado de medalha."""
    pents = [pentagono(0, -0.6 * R, 0.3 * R), pentagono(-0.56 * R, 0.62 * R, 0.29 * R, -54),
             pentagono(0.56 * R, 0.62 * R, 0.29 * R, -126)]
    meia_faixa, botao = 0.2 * R, 0.4 * R
    pent_botao = R * k >= 14  # pentágono no botão só quando há pixel pra ele

    def f(x, y):
        if (x - cx) ** 2 + (y - cy) ** 2 > R * R:
            return None
        lx, ly = girar(x, y, cx, cy, inclina)
        d = math.hypot(lx, ly)
        if d <= botao:
            if d > botao - max(1.2 / k, 0.1 * R):
                return NAVY
            if pent_botao and poligono(lx, ly, pentagono(0, 0, botao * 0.5)):
                return OURO[3]
            return OURO[0] if lx + ly < -botao * 0.5 else OURO[1] if lx + ly < botao * 0.35 else OURO[2]
        if abs(ly) <= meia_faixa:
            return AZUL if ly < -meia_faixa + max(1 / k, 0.06 * R) else NAVY  # brilho de 1 px no alto da faixa
        if any(poligono(lx, ly, p) for p in pents):
            return NAVY2
        # luz no alto-esquerda, sombra embaixo-direita
        dl = math.hypot(x - (cx - 0.38 * R), y - (cy - 0.42 * R))
        if dl < 0.22 * R:
            return BR
        return BR3 if dl > 1.42 * R else BR2 if dl > 1.15 * R else BR
    return f, (cx - R, cy - R, cx + R, cy + R)


# ---------------- carta ----------------
def carta(cx, cy, w, h, graus, metal=OURO, holo=True, k=1.0, cores=HOLO, faixa=0.16):
    """Carta com borda de metal (luz em cima/esq, sombra embaixo/dir), filete escuro e miolo holográfico em faixas."""
    aro = max(2.0 / k, w * 0.07)
    filete = max(1.0 / k, w * 0.03)
    r = w * 0.12
    m = max(w, h)

    def f(x, y):
        lx, ly = girar(x, y, cx, cy, graus)
        if not ret_arred(lx, ly, w, h, r):
            return None
        if not ret_arred(lx, ly, w - 2 * aro, h - 2 * aro, r * 0.6):
            if ly < -h / 2 + aro * 0.5 or lx < -w / 2 + aro * 0.5:
                return metal[0]
            if ly > h / 2 - aro * 0.5 or lx > w / 2 - aro * 0.5:
                return metal[2]
            return metal[1]
        if not ret_arred(lx, ly, w - 2 * (aro + filete), h - 2 * (aro + filete), r * 0.4):
            return metal[3]
        if not holo:
            return metal[1]
        # faixas diagonais com uma linha de dither na troca de cor, e dois reflexos brancos
        t = (lx * 0.75 + ly * 0.65) / (m * faixa) + 2.2
        i = math.floor(t)
        px, py = int(x * k), int(y * k)
        if t - i < 0.18 and (px + py) % 2:
            i -= 1
        s = lx * 0.55 - ly * 0.85
        if abs(s + 0.12 * m) < max(0.6 / k, 0.035 * m):
            return BR
        if abs(s + 0.24 * m) < max(0.5 / k, 0.018 * m) and (px + py) % 2:
            return BR
        return cores[i % len(cores)]
    raio_caixa = math.hypot(w, h) / 2
    return f, (cx - raio_caixa, cy - raio_caixa, cx + raio_caixa, cy + raio_caixa)


def chapa_carta(cx, cy, w, h, graus, k):
    """Placa do nome no pé da carta: barra escura com traços claros (o 'texto' da carta)."""
    aro = max(2.0 / k, w * 0.07) + max(1.0 / k, w * 0.03)

    def f(x, y):
        lx, ly = girar(x, y, cx, cy, graus)
        y0, y1 = h / 2 - aro - h * 0.12, h / 2 - aro - h * 0.03
        if not (y0 <= ly <= y1 and abs(lx) <= w / 2 - aro - w * 0.06):
            return None
        meio = (y0 + y1) / 2
        if abs(ly - meio) < max(0.5 / k, h * 0.012) * 1.6 and abs(lx) < w * 0.26:
            return BR2
        return NAVY2
    rc = math.hypot(w, h) / 2
    return f, (cx - rc, cy - rc, cx + rc, cy + rc)


def detalhes_carta(tela, cx, cy, w, h, graus, k):
    """Nota 99 no canto e símbolo de tipo no outro, alinhados à grade (pixel art não gira texto)."""
    esc = max(1, round(k))
    if w * k < 22:
        return
    fonte = FONTE4 if w * k >= 30 else FONTE3
    aro = max(2.0 / k, w * 0.07) + max(1.0 / k, w * 0.03)
    ax, ay = para_tela(-w / 2 + aro + w * 0.05, -h / 2 + aro + h * 0.04, cx, cy, graus)
    nota = texto("99", fonte, ax * k, ay * k, NAVY, esc)
    tela.por(nota, borda=BR, viz=4)
    if w * k >= 30:
        bx, by = para_tela(w / 2 - aro - w * 0.05, -h / 2 + aro + h * 0.04, cx, cy, graus)
        rr = 3.6 * esc
        ox, oy = bx * k - 2 * rr, by * k
        circ = {(ox + i, oy + j): OURO[1] for i in range(int(2 * rr)) for j in range(int(2 * rr))
                if (i + 0.5 - rr) ** 2 + (j + 0.5 - rr) ** 2 <= rr * rr}
        circ = {(int(a), int(b)): c for (a, b), c in circ.items()}
        tela.por(circ)
        tela.px.update(sprite(RAIO, ox + rr - 2.5 * esc, oy + rr - 3 * esc, NAVY, esc))


# ---------------- A: carta holo ----------------
def emblema_a(tela, v, simples=False):
    k = v.k
    cx, cy, w, h, g = 32, 33, 36, 48, -8
    W, H = tela.w, tela.h
    fc, cc = carta(cx, cy, w, h, g, k=k)
    cam = rast(W, H, v, fc, cc)
    tela.sombra(cam, max(1, round(2 * k)), max(1, round(3 * k)))
    tela.por(cam)
    if not simples:
        fp, cp = chapa_carta(cx, cy, w, h, g, k)
        tela.px.update(rast(W, H, v, fp, cp))
    bx, by = para_tela(0, 1.5 if not simples else 0, cx, cy, g)
    fb, cb = bola(bx, by, 10.5 if not simples else 13, k=k)
    tela.por(rast(W, H, v, fb, cb))
    detalhes_carta(tela, cx + v.ox / k, cy + v.oy / k, w, h, g, k)


# ---------------- B: pacote ----------------
def pacote(cx, cy, w, h, k):
    """Pacote azul-noite: lacre dourado serrilhado embaixo, boca rasgada em zigue-zague em cima."""
    dente = max(2.0 / k, w * 0.06)

    def f(x, y):
        lx, ly = x - cx, y - cy
        if abs(lx) > w / 2:
            return None
        # boca rasgada: zigue-zague irregular
        fase = ((lx + w / 2) / dente) % 2
        rasgo = -h / 2 + (fase if fase < 1 else 2 - fase) * dente * 1.1 + math.sin(lx * 0.9) * dente * 0.3
        if ly < rasgo or ly > h / 2:
            return None
        lacre = h / 2 - h * 0.17
        if ly > lacre:
            if ly > h / 2 - dente * 0.6 and ((lx + w / 2) / dente) % 1 < 0.5:
                return None  # serrilha do lacre
            if int((lx + w) * k) % max(2, round(3 * k)) == 0:
                return OURO[2]
            return OURO[0] if ly < lacre + h * 0.04 else OURO[1]
        if ly < rasgo + max(1.0 / k, h * 0.03):
            return BR3  # verso do papel na borda rasgada
        if abs(lx) > w / 2 - max(1.0 / k, w * 0.04):
            return OURO[1]  # filete dourado nas laterais
        # frente: azul-noite do pacote do jogo, estrela dourada no meio e um reflexo diagonal
        if poligono(lx, ly, estrela(0, h * 0.06, h * 0.26, h * 0.11, 5)):
            return OURO[0] if ly < h * 0.02 else OURO[1]
        s = lx * 0.8 - ly * 0.6
        if abs(s + w * 0.26) < max(0.7 / k, w * 0.05):
            return "#4a5fb8"
        return "#26357a" if lx < -w * 0.15 else "#1c2862"
    return f, (cx - w / 2, cy - h / 2 - dente * 2, cx + w / 2, cy + h / 2)


def explosao(cx, cy, r1, r2, n):
    pts = estrela(cx, cy, r1, r2, n, -80)
    miolo = estrela(cx, cy, r1 * 0.62, r2 * 0.6, n, -80)

    def f(x, y):
        if poligono(x, y, miolo):
            return "#fffbe0"
        if poligono(x, y, pts):
            return OURO[0]
        return None
    return f, (cx - r1, cy - r1, cx + r1, cy + r1)


def verso(cx, top, w, k):
    """Parte de trás do pacote aberto (aparece atrás da bola): papel escuro com a borda rasgada clara."""
    dente = max(2.0 / k, w * 0.07)

    def f(x, y):
        lx, ly = x - cx, y - top
        if abs(lx) > w / 2:
            return None
        fase = ((lx + w / 2 + dente * 0.5) / dente) % 2
        rasgo = (fase if fase < 1 else 2 - fase) * dente * 1.2
        if ly < rasgo or ly > 14:
            return None
        return BR3 if ly < rasgo + max(1.0 / k, 0.8) else "#0c1238"
    return f, (cx - w / 2, top, cx + w / 2, top + 14)


def luz(cx, cy, comp, n=9):
    """Feixes de luz saindo da boca do pacote, em leque pra cima (claro no miolo, dourado na ponta)."""
    def f(x, y):
        if y > cy:
            return None
        d = math.hypot(x - cx, y - cy)
        if d > comp:
            return None
        a = math.degrees(math.atan2(y - cy, x - cx)) + 90  # 0 = pra cima
        if abs(a) > 78:
            return None
        passo = 156 / (n - 1)
        if abs((a + 78) % passo - passo / 2) > passo * (0.2 + 0.14 * (1 - d / comp)):
            return "#fff6c4" if d < comp * 0.42 else None
        return "#fffbe0" if d < comp * 0.55 else OURO[0] if d < comp * 0.8 else OURO[1]
    return f, (cx - comp, cy - comp, cx + comp, cy)


def emblema_b(tela, v, simples=False):
    k = v.k
    W, H = tela.w, tela.h
    fl, cl = luz(32, 40, 38)
    tela.px.update(rast(W, H, v, fl, cl))
    if not simples:
        for cx, cy, g, metal in ((11.5, 23, -30, OURO), (52.5, 20, 26, PRATA)):
            fc, cc = carta(cx, cy, 14, 20, g, metal=metal, k=k)
            cam = rast(W, H, v, fc, cc)
            tela.por(cam)
    fv, cv = verso(32, 33, 36, k)
    tela.por(rast(W, H, v, fv, cv))
    fb, cb = bola(32, 26, 13.5, k=k)
    tela.por(rast(W, H, v, fb, cb))
    fp, cp = pacote(32, 52, 40, 26, k)
    cam = rast(W, H, v, fp, cp)
    tela.sombra(cam, 0, max(1, round(2 * k)))
    tela.por(cam)
    esc = max(1, round(k))
    if not simples:
        for x, y, arte in ((7, 7, BRILHO), (54, 33, BRILHO), (50, 4, BRILHO_P), (9, 36, BRILHO_P)):
            tela.px.update(sprite(arte, x * k + v.ox, y * k + v.oy, BR, esc))


# ---------------- C: brasão ----------------
def escudo(cx, top, w, h):
    """Escudo de clube: topo com dois ombros e bico central, laterais retas, ponta embaixo."""
    def dentro(x, y):
        lx, ly = x - cx, y - top
        if ly < 0 or ly > h or abs(lx) > w / 2:
            return False
        # topo: ombros nos cantos e um bico no meio
        topo = h * 0.06 * (1 - abs(lx) / (w / 2)) * -1 + h * 0.06 + (h * 0.05 if abs(lx) < w * 0.1 else 0) * -1
        if ly < topo:
            return False
        if ly < h * 0.55:
            return True
        # ponta: curva até o bico de baixo
        t = (ly - h * 0.55) / (h * 0.45)
        return abs(lx) <= (w / 2) * math.cos(t * math.pi / 2) ** 0.8
    return dentro


def emblema_c(tela, v, simples=False):
    k = v.k
    W, H = tela.w, tela.h
    cx, top, w, h = 32, 13, 44, 49
    fora = escudo(cx, top, w, h)
    aro = max(2.0 / k, 3.0)
    dentro = escudo(cx, top + aro, w - 2 * aro, h - 2.2 * aro)
    filete = escudo(cx, top + aro + 1.0, w - 2 * aro - 2.0, h - 2.2 * aro - 2.4)
    # metade de cima do escudo é a bola (pentágonos), a faixa com o botão é a da bola, embaixo as listras do clube
    R = 30
    bcx, bcy = cx, top + h * 0.47
    pents = [pentagono(0, -13, 5.6), pentagono(-14.5, -8, 5.2, -18), pentagono(14.5, -8, 5.2, -162)]
    meia_faixa, botao = 3.8, 6.2

    def f(x, y):
        if not fora(x, y):
            return None
        if not dentro(x, y):
            lx = x - cx
            return OURO[0] if y < top + aro + 1 and lx < 0 else OURO[2] if lx > w * 0.2 or y > top + h * 0.8 else OURO[1]
        if not filete(x, y):
            return OURO[3]
        lx, ly = x - bcx, y - bcy
        d = math.hypot(lx, ly)
        if d <= botao:
            if d > botao - max(1.2 / k, 0.06 * R):
                return NAVY
            if R * k > 40 and poligono(lx, ly, pentagono(0, 0, botao * 0.5)):
                return OURO[3]
            return OURO[0] if lx + ly < -botao * 0.5 else OURO[1] if lx + ly < botao * 0.35 else OURO[2]
        if abs(ly) <= meia_faixa:
            return AZUL if ly < -meia_faixa + max(1 / k, 0.04 * R) else NAVY
        if ly > 0:
            # metade de baixo: listras do clube
            return AZUL if int((lx + w) / (w / 7)) % 2 == 0 else AZUL2
        if any(poligono(lx, ly, p) for p in pents):
            return NAVY2
        return BR2 if lx > w * 0.3 else BR
    cam = rast(W, H, v, f, (cx - w / 2, top, cx + w / 2, top + h))
    tela.sombra(cam, max(1, round(2 * k)), max(1, round(3 * k)))
    tela.por(cam)
    # três estrelas de título em cima
    n = 3
    for i in range(n):
        sx = cx + (i - 1) * 11
        sy = top - 6.5 + (abs(i - 1) * 1.5)
        rr = 5 if i == 1 else 4.2
        pts = estrela(sx, sy, rr, rr * 0.45, 5)
        fs = lambda x, y, pts=pts, sy=sy: (OURO[0] if y < sy - 0.5 else OURO[1]) if poligono(x, y, pts) else None  # noqa: E731
        tela.por(rast(W, H, v, fs, (sx - rr, sy - rr, sx + rr, sy + rr)))
    if not simples:
        esc = max(1, round(k))
        for x, y, arte in ((5, 30, BRILHO_P), (56, 42, BRILHO_P), (54, 14, BRILHO)):
            tela.px.update(sprite(arte, x * k + v.ox, y * k + v.oy, BR, esc))


def emblema_p(tela, v, simples=False):
    """Rodada 2b: a carta do Miguel limpa (só borda dourada fina e holo em 4 faixas largas) + a bola."""
    k = v.k
    cx, cy, w, h, g = 32, 32, 38, 52, -8
    fc, cc = carta(cx, cy, w, h, g, k=k, cores=HOLO[:4], faixa=0.3)
    cam = rast(tela.w, tela.h, v, fc, cc)
    tela.sombra(cam, max(1, round(2 * k)), max(1, round(3 * k)))
    tela.por(cam)
    bx, by = para_tela(0, 0, cx, cy, g)
    fb, cb = bola(bx, by, 13.5 if not simples else 14.5, k=k)
    tela.por(rast(tela.w, tela.h, v, fb, cb))


EMBLEMAS = {"a": emblema_a, "b": emblema_b, "c": emblema_c, "p": emblema_p}
ZOOM = {"a": 1.0, "b": 0.88, "c": 1.0, "p": 1.0}  # B tem mais coisa: um pouco menor pra respirar no quadrado


# ---------------- letras do logo atual em pixel ----------------
def segmentos(d):
    toks = re.findall(r"[MHVLZ]|-?\d*\.?\d+", d)
    segs, i, x, y, ini, cmd = [], 0, 0.0, 0.0, (0.0, 0.0), None
    while i < len(toks):
        t = toks[i]
        if t in "MHVLZ":
            cmd = t
            i += 1
            if cmd == "Z":
                segs.append((x, y, *ini))
                x, y = ini
            continue
        if cmd == "M":
            x, y = float(toks[i]), float(toks[i + 1])
            ini = (x, y)
            i += 2
            cmd = "L"
            continue
        nx, ny = x, y
        if cmd == "H":
            nx = float(t)
            i += 1
        elif cmd == "V":
            ny = float(t)
            i += 1
        else:
            nx, ny = float(toks[i]), float(toks[i + 1])
            i += 2
        segs.append((x, y, nx, ny))
        x, y = nx, ny
    return segs


def na_letra(segs, u, v, r):
    for x0, y0, x1, y1 in segs:
        if x0 == x1 or y0 == y1:  # reto: junta quadrada
            if min(x0, x1) - r <= u <= max(x0, x1) + r and min(y0, y1) - r <= v <= max(y0, y1) + r:
                return True
        else:
            dx, dy = x1 - x0, y1 - y0
            t = max(0, min(1, ((u - x0) * dx + (v - y0) * dy) / (dx * dx + dy * dy)))
            if math.hypot(u - x0 - t * dx, v - y0 - t * dy) <= r:
                return True
    return False


def palavra(tela, x0, y0, s, prof, carta_no_o=None):
    """SOCCERMON: SOCC branco, ERMON dourado, extrusão em pixels e contorno; devolve a largura usada.
    carta_no_o: função(tela, cx, cy, alt) que desenha o primeiro O (a carta do conceito A)."""
    x = x0
    for i, ch in enumerate("SOCCERMON"):
        if i == 1 and carta_no_o:
            carta_no_o(tela, x + 3.7 * s, y0 + 4 * s, 8 * s)
            x += 8.3 * s  # a carta é mais larga que uma letra
            continue
        segs = segmentos(ESQ[ch])
        r = TRACO / 2
        face = {}
        for py in range(int(y0) - 1, int(y0 + 8 * s) + 2):
            for px in range(int(x) - 1, int(x + 6 * s) + 2):
                if na_letra(segs, (px + 0.5 - x) / s, (py + 0.5 - y0) / s, r):
                    face[(px, py)] = 1
        branco = i < 4
        ext = {(a, b + d): (BR3 if branco else AZUL) for d in range(1, prof + 1) for (a, b) in face}
        ext.update({(a, b + prof): (AZUL if branco else NAVY2) for (a, b) in face})
        tela.por(ext)
        tela.px.update(contorno(face, K))  # contorno da face por cima da extrusão: miolos das letras ficam escuros
        cam = {}
        alt = 8 * s
        for (a, b) in face:
            t = (b + 0.5 - y0) / alt
            if (a, b - 1) not in face:
                c = BR if branco else "#fff8d0"
            elif branco:
                c = BR if t < 0.62 else BR2
            else:
                c = OURO[0] if t < 0.3 else OURO[1] if t < 0.68 else OURO[2]
            cam[(a, b)] = c
        tela.px.update(cam)
        x += 6.9 * s
    return x - x0 - 0.9 * s


# ---------------- montagem ----------------
def icone(conceito, n, com_fundo=True):
    """Ícone quadrado n x n pixels de verdade (desenho em 64 unidades)."""
    tela = Tela(n, n)
    v = View(n / 64)
    if com_fundo:
        dith = n >= 48
        tela.px.update(rast(n, n, v, fundo(64, 64, 32, 30, 58, 16 if n >= 48 else 12, 12, dith)))
    kz = n / 64 * ZOOM[conceito]
    EMBLEMAS[conceito](tela, View(kz, n / 2 - 32 * kz, n / 2 - 32 * kz), simples=n <= 32)
    tela.recortar(lambda x, y: ret_arred(x + 0.5 - n / 2, y + 0.5 - n / 2, n, n, n * 12 / 64))
    return tela


def horizontal(conceito, com_fundo=True):
    """Nome + emblema na horizontal, grade 384x144 (x5 = 1920x720) pro fim do trailer."""
    W, H = 384, 144
    tela = Tela(W, H)
    if com_fundo:
        tela.px.update(rast(W, H, View(1), fundo(W, H, W / 2, H / 2, W * 0.55, 28)))
    if conceito in ("a", "p"):
        s = 5
        larg = (8 * 6.9 + 6 + 1.4) * s
        x0, y0 = (W - larg) / 2, (H - 8 * s) / 2 - 4

        def carta_o(t, cx, cy, alt):
            k = alt * 1.32 / (52 if conceito == "p" else 48)
            vv = View(k, cx - 32 * k, cy - 33 * k)
            EMBLEMAS[conceito](t, vv)
        palavra(tela, x0, y0, s, 4, carta_o)
    else:
        s = 4
        larg = (8 * 6.9 + 6) * s
        lado = 116
        gap = 6
        x0 = (W - (lado + gap + larg)) / 2
        k = lado / 64 * ZOOM[conceito]
        EMBLEMAS[conceito](tela, View(k, x0 + lado / 2 - 32 * k, H / 2 - 32 * k))
        palavra(tela, x0 + lado + gap, (H - 8 * s) / 2 - 2, s, 4)
    return tela


def main():
    # rodada 2b (estilo 2 da carta): pixel art
    gravar(icone("p", 64), "2-pixel-icone-1024", 16)
    gravar(icone("p", 64, com_fundo=False), "2-pixel-simbolo-1024", 16)
    for n in (48, 32, 16):
        gravar(icone("p", n), f"2-pixel-icone-{n}", 1)
    gravar(horizontal("p"), "2-pixel-horizontal", 5, svg=False)
    gravar(horizontal("p", com_fundo=False), "2-pixel-horizontal-transparente", 5)
    print("ok 2-pixel")
    for c in "abc":
        gravar(icone(c, 64), f"{c}-icone-1024", 16)
        gravar(icone(c, 64, com_fundo=False), f"{c}-simbolo-1024", 16)
        gravar(icone(c, 48), f"{c}-icone-48", 1)
        gravar(icone(c, 32), f"{c}-icone-32", 1)
        gravar(horizontal(c), f"{c}-horizontal", 5, svg=False)  # fundo com dither: SVG de 1,3 MB, só PNG
        gravar(horizontal(c, com_fundo=False), f"{c}-horizontal-transparente", 5)
        print("ok", c)


if __name__ == "__main__":
    main()
