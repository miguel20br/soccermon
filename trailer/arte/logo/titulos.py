"""Logos de TÍTULO do Soccermon (rodada 2, mais criativa): camadas, volume, curva, personalidade.

Reaproveita as letras construídas por esqueleto de gerar.py (nenhuma fonte de terceiros) e empilha efeitos:
contorno grosso, extrusão 3D, brilho, arco, cartas, adesivo. O símbolo simples (bola) fica pro favicon.
D: Arena    — arco sobre meia quadra, extrusão azul, bola girando no O, faixa FUTSAL 5x5.
E: Coleção  — cada letra numa carta em leque (bronze/prata/ouro do jogo); o O é carta holográfica com a bola.
F: Golaço   — adesivo de quadrinho: SOCCER / MON em itálico, bola rasgando no meio, explosão e velocidade.

    python3 trailer/arte/logo/titulos.py
"""
import math
import os

from gerar import ESQ, TRACO, bola

AQUI = os.path.dirname(os.path.abspath(__file__))
NAVY, AZUL, AMARELO, LARANJA, VERMELHO, BRANCO = "#0e1430", "#2a4ea0", "#ffcb05", "#ff8a1c", "#e8423f", "#ffffff"


def letra(ch, juntas):
    """Esqueleto da letra (unidades 6x8) como <path> sem estilo."""
    return f'<path d="{ESQ[ch]}" {juntas}/>'


def camadas(grupo, cores, sw):
    """O mesmo desenho em camadas de traço: (cor, extra de espessura, dx, dy) de baixo pra cima."""
    out = ""
    for cor, extra, dx, dy in cores:
        out += (f'<g transform="translate({dx} {dy})" fill="none" stroke="{cor}" stroke-width="{sw + extra}" '
                f'stroke-linejoin="round" stroke-linecap="round">{grupo}</g>')
    return out


def bola_cor(cx, cy, r):
    """Bola colorida: branca, gomos escuros, contorno grosso (mesma geometria da bola do jogo)."""
    pent = lambda rr, rot: " ".join(  # noqa: E731
        f"{cx + math.cos(rot + i * 2 * math.pi / 5) * rr:.2f},{cy + math.sin(rot + i * 2 * math.pi / 5) * rr:.2f}"
        for i in range(5))
    gomos = "".join(
        f'<circle cx="{cx + math.cos(-math.pi / 2 + math.pi / 5 + i * 2 * math.pi / 5) * r * 0.95:.2f}" '
        f'cy="{cy + math.sin(-math.pi / 2 + math.pi / 5 + i * 2 * math.pi / 5) * r * 0.95:.2f}" r="{r * 0.28:.2f}" fill="{NAVY}"/>'
        for i in range(5))
    return (f'<clipPath id="bc{int(cx)}{int(cy)}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
            f'<circle cx="{cx}" cy="{cy}" r="{r + 0.9}" fill="{NAVY}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{BRANCO}"/>'
            f'<g clip-path="url(#bc{int(cx)}{int(cy)})">{gomos}<circle cx="{cx - r * 0.3}" cy="{cy - r * 0.35}" r="{r * 0.9}" fill="#000" opacity=".06"/></g>'
            f'<polygon fill="{NAVY}" points="{pent(r * 0.42, -math.pi / 2)}"/>')


def salvar(nome, w, h, corpo, defs=""):
    with open(os.path.join(AQUI, nome), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{corpo}</svg>\n')


# ============ D: Arena ============
def arena():
    W, H = 1600, 760
    u = 20  # px por unidade de letra
    letras = "SOCCERMON"
    av = 7.0
    raio = 1900  # arco suave
    cx0 = W / 2
    total = (len(letras) - 1) * av * u
    grupos, ball = [], ""
    for i, ch in enumerate(letras):
        x = cx0 - total / 2 + i * av * u
        ang = math.degrees(math.asin((x - cx0) / raio)) * 1.6
        y = 300 + (raio - math.sqrt(raio ** 2 - (x - cx0) ** 2)) * 1.6
        # letras do meio um pouco maiores (respira como um logo de jogo)
        esc = u * (1.12 - 0.18 * abs(i - 4) / 4)
        t = f'translate({x:.1f} {y:.1f}) rotate({ang:.2f}) scale({esc:.2f}) translate(-3 -4)'
        if ch == "O" and not ball:
            ball = f'<g transform="translate({x:.1f} {y:.1f}) rotate(-18)">{bola_cor(0, 0, 4.1 * esc)}</g>'
            continue
        grupos.append(f'<g transform="{t}">{letra(ch, "")}</g>')
    g = "".join(grupos)
    # extrusão: várias cópias descendo (azul), depois contorno, depois o amarelo com brilho
    corpo = ""
    for k in range(14, 0, -1):
        corpo += f'<g transform="translate(0 {k * 2.4})" fill="none" stroke="{AZUL if k < 13 else NAVY}" stroke-width="{TRACO + 1.6}" stroke-linejoin="round" stroke-linecap="round">{g}</g>'
    corpo += f'<g fill="none" stroke="{NAVY}" stroke-width="{TRACO + 1.6}" stroke-linejoin="round" stroke-linecap="round">{g}</g>'
    corpo += f'<g fill="none" stroke="url(#ouro)" stroke-width="{TRACO}" stroke-linejoin="round" stroke-linecap="round">{g}</g>'
    corpo += f'<g fill="none" stroke="#fff6c9" stroke-width="{TRACO * 0.22}" stroke-linejoin="round" stroke-linecap="round" transform="translate(-6 -9)" opacity=".8">{g}</g>'
    # meia quadra atrás (madeira + linhas) e faixa
    quadra = (f'<path d="M180 520 A620 330 0 0 1 1420 520 Z" fill="url(#madeira)"/>'
              f'<path d="M180 520 A620 330 0 0 1 1420 520" fill="none" stroke="{BRANCO}" stroke-width="10" opacity=".85"/>'
              f'<path d="M560 520 A240 140 0 0 1 1040 520" fill="none" stroke="{BRANCO}" stroke-width="8" opacity=".8"/>'
              f'<line x1="800" y1="190" x2="800" y2="520" stroke="{BRANCO}" stroke-width="8" opacity=".6"/>')
    faixa = (f'<path d="M520 560 L1080 560 L1050 620 L1080 680 L520 680 L550 620 Z" fill="{NAVY}" transform="translate(0 6)"/>'
             f'<path d="M520 560 L1080 560 L1050 620 L1080 680 L520 680 L550 620 Z" fill="{VERMELHO}"/>'
             f'<text x="800" y="642" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" font-size="46" '
             f'fill="{BRANCO}" letter-spacing="10">FUTSAL 5×5</text>')
    defs = ('<style>@font-face{font-family:"Galmuri11";src:url("/fonts/Galmuri11-Bold.woff2");font-weight:700}</style>'
            f'<linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/>'
            f'<stop offset=".55" stop-color="{AMARELO}"/><stop offset="1" stop-color="{LARANJA}"/></linearGradient>'
            '<linearGradient id="madeira" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat">'
            '<stop offset="0" stop-color="#d39a5c"/><stop offset=".5" stop-color="#d39a5c"/>'
            '<stop offset=".5" stop-color="#c98d4f"/><stop offset="1" stop-color="#c98d4f"/></linearGradient>')
    salvar("d-arena.svg", W, H, quadra + corpo + ball + faixa, defs)


# ============ E: Coleção ============
METAIS = {"bronze": ("#f0c493", "#c98a52", "#8f5a2e", "#2f1b0b"), "prata": ("#fbfcfe", "#d3d8e1", "#9aa2b0", "#1c2230"),
          "ouro": ("#fff3b8", "#e8c24a", "#b48a18", "#2c2000")}


def colecao():
    W, H = 1600, 760
    letras = "SOCCERMON"
    ordem = ["bronze", "prata", "ouro", "prata", "bronze", "prata", "ouro", "prata", "bronze"]
    cw, ch_ = 150, 210
    n = len(letras)
    defs = "".join(
        f'<linearGradient id="m-{k}" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="{a}"/>'
        f'<stop offset=".5" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></linearGradient>'
        for k, (a, b, c, _) in METAIS.items())
    defs += ('<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">'
             '<stop offset="0" stop-color="#ff9ad5"/><stop offset=".25" stop-color="#9ae6ff"/><stop offset=".5" stop-color="#b6ffa0"/>'
             '<stop offset=".75" stop-color="#fff29a"/><stop offset="1" stop-color="#d7a6ff"/></linearGradient>')
    corpo = ""
    for i, l in enumerate(letras):
        t = (i - (n - 1) / 2)
        ang = t * 6.5
        x = W / 2 + t * 132
        y = 380 + abs(t) ** 1.6 * 9
        m = ordem[i]
        tinta = METAIS[m][3]
        fundo = "url(#holo)" if (l == "O" and i == 1) else f"url(#m-{m})"
        carta = (f'<rect x="{-cw / 2 + 8}" y="{-ch_ / 2 + 12}" width="{cw}" height="{ch_}" rx="18" fill="#000" opacity=".35"/>'
                 f'<rect x="{-cw / 2}" y="{-ch_ / 2}" width="{cw}" height="{ch_}" rx="18" fill="{fundo}" stroke="{NAVY}" stroke-width="8"/>'
                 f'<rect x="{-cw / 2 + 12}" y="{-ch_ / 2 + 12}" width="{cw - 24}" height="{ch_ - 24}" rx="10" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>')
        if l == "O" and i == 1:
            miolo = bola_cor(0, -6, 52)
        else:
            miolo = (f'<g transform="translate(-48 -76) scale(16)" fill="none" stroke="{tinta}" stroke-width="{TRACO}" '
                     f'stroke-linejoin="round" stroke-linecap="round">{letra(l, "")}</g>')
        corpo += f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">{carta}{miolo}</g>'
    salvar("e-colecao.svg", W, H, corpo, defs)


# ============ F: Golaço ============
def golaco():
    W, H = 1600, 760
    sk = 'skewX(-14)'
    # explosão (estrela de 16 pontas) atrás
    pts = []
    for i in range(32):
        r = 330 if i % 2 == 0 else 250
        a = i * math.pi / 16
        pts.append(f"{800 + math.cos(a) * r * 1.5:.0f},{380 + math.sin(a) * r:.0f}")
    burst = (f'<polygon points="{" ".join(pts)}" fill="{AMARELO}" stroke="{NAVY}" stroke-width="12" stroke-linejoin="round"/>'
             f'<circle cx="800" cy="380" r="210" fill="{LARANJA}" opacity=".35"/>')
    # meios-tons
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{NAVY}" opacity=".12"/>'
                   for x in range(330, 1290, 26) for y in range(150, 620, 26) if ((x - 800) / 1.5) ** 2 + (y - 380) ** 2 < 240 ** 2)

    def linha(texto, ox, oy, u):
        g, x = "", 0
        for c in texto:
            g += f'<g transform="translate({x} 0)">{letra(c, "")}</g>'
            x += 6.8
            if texto == "SCCER" and c == "S":
                x += 6.8  # deixa o espaço do O pra bola
        return g, x

    g1, w1 = linha("SCCER", 0, 0, 1)
    w1 += 6.8  # vaga do O, que é a bola
    g2, w2 = linha("MON", 0, 0, 1)

    def palavra(g, w, cx, cy, u):
        t = f'translate({cx - w * u / 2:.0f} {cy:.0f}) {sk} scale({u})'
        return (f'<g transform="{t}" fill="none" stroke-linejoin="bevel" stroke-linecap="butt">'
                f'<g stroke="{BRANCO}" stroke-width="{TRACO + 2.6}" transform="translate(0.35 0.35)">{g}</g>'
                f'<g stroke="{NAVY}" stroke-width="{TRACO + 2.6}">{g}</g>'
                f'<g stroke="{NAVY}" stroke-width="{TRACO + 1.2}" transform="translate(0.45 0.55)">{g}</g>'
                f'<g stroke="{VERMELHO}" stroke-width="{TRACO}">{g}</g>'
                f'<g stroke="#ff8f8d" stroke-width="{TRACO * 0.25}" transform="translate(-0.2 -0.35)">{g}</g></g>')

    # contorno branco de adesivo (camada grossa por baixo de tudo)
    sticker = (f'<g transform="translate({800 - w1 * 24 / 2:.0f} 150) {sk} scale(24)" fill="none" stroke="{BRANCO}" '
               f'stroke-width="{TRACO + 5}" stroke-linejoin="round">{g1}</g>'
               f'<g transform="translate({800 - w2 * 30 / 2:.0f} 400) {sk} scale(30)" fill="none" stroke="{BRANCO}" '
               f'stroke-width="{TRACO + 5}" stroke-linejoin="round">{g2}</g>')
    p1 = palavra(g1, w1, 800, 150, 24)
    p2 = palavra(g2, w2, 800, 400, 30)
    # bola rasgando entre as palavras, com rastro de velocidade
    rastro = "".join(
        f'<path d="M{110 + abs(k) * 30} {250 + k * 30} L{250 + abs(k) * 20} {250 + k * 30}" stroke="{NAVY}" stroke-width="{16 - abs(k) * 5}" stroke-linecap="round"/>'
        for k in range(-1, 2))
    # O de SOCCER: centro da 2ª letra (itálico desloca pra direita conforme sobe)
    bx = 800 - w1 * 24 / 2 + (6.8 + 3) * 24 + 24 * 4 * math.tan(math.radians(14))
    ball = f'<g transform="rotate(-20 {bx:.0f} 246)">{bola_cor(bx, 246, 66)}</g>'
    estilhaco = "".join(
        f'<path d="M{1280 + math.cos(a) * 30:.0f} {420 + math.sin(a) * 30:.0f} L{1280 + math.cos(a) * 90:.0f} {420 + math.sin(a) * 90:.0f}" '
        f'stroke="{BRANCO}" stroke-width="10" stroke-linecap="round"/>'
        for a in (-1.2, -0.6, 0, 0.6, 1.2))
    salvar("f-golaco.svg", W, H, burst + dots + sticker + p1 + p2 + estilhaco + ball)


arena()
colecao()
golaco()
print("ok: d-arena, e-colecao, f-golaco")
