"""Logos de título, rodada 3: misturas e uma ideia nova (pedido do Miguel: "adorei todos, talvez uma mistura").

G: Arena de Cartas    — D + E: cartas em arco com profundidade, letras douradas com volume saltando delas,
                        meia quadra atrás e faixa FUTSAL 5x5.
H: Explosão de Cartas — E + F: cartas voando de uma explosão; SOCCER em cima, MON grande embaixo.
I: Evolução           — nome no meio de uma evolução: raios da tela de evolução, metade em silhueta branca,
                        metade colorida, brilhos.

    python3 trailer/arte/logo/hibridos.py
"""
import math
import os

from gerar import ESQ, TRACO
from titulos import AMARELO, AZUL, BRANCO, LARANJA, METAIS, NAVY, VERMELHO, bola_cor

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = '<style>@font-face{font-family:"Galmuri11";src:url("/fonts/Galmuri11-Bold.woff2");font-weight:700}</style>'
GRAD = (f'<linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/>'
        f'<stop offset=".55" stop-color="{AMARELO}"/><stop offset="1" stop-color="{LARANJA}"/></linearGradient>'
        + "".join(f'<linearGradient id="m-{k}" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="{a}"/>'
                  f'<stop offset=".5" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></linearGradient>'
                  for k, (a, b, c, _) in METAIS.items())
        + '<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ad5"/>'
          '<stop offset=".25" stop-color="#9ae6ff"/><stop offset=".5" stop-color="#b6ffa0"/>'
          '<stop offset=".75" stop-color="#fff29a"/><stop offset="1" stop-color="#d7a6ff"/></linearGradient>')
ORDEM = ["bronze", "prata", "ouro", "prata", "bronze", "prata", "ouro", "prata", "bronze"]


def salvar(nome, w, h, corpo, defs=""):
    with open(os.path.join(AQUI, nome), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs>{FONTE}{GRAD}{defs}</defs>{corpo}</svg>\n')


def letra_3d(ch, esc, profundidade=8, passo=2.2, face="url(#ouro)"):
    """Letra com extrusão azul, contorno escuro, face dourada e brilho (estilo D), em unidades locais 6x8."""
    d = ESQ[ch]
    est = 'fill="none" stroke-linejoin="round" stroke-linecap="round"'
    out = "".join(f'<path d="{d}" {est} stroke="{AZUL if k < profundidade else NAVY}" stroke-width="{TRACO + 1.6}" '
                  f'transform="translate(0 {k * passo / esc:.3f})"/>' for k in range(profundidade, 0, -1))
    out += f'<path d="{d}" {est} stroke="{NAVY}" stroke-width="{TRACO + 1.6}"/>'
    out += f'<path d="{d}" {est} stroke="{face}" stroke-width="{TRACO}"/>'
    out += f'<path d="{d}" {est} stroke="#fff6c9" stroke-width="{TRACO * 0.22}" opacity=".8" transform="translate(-.25 -.38)"/>'
    return out


def carta(cw, ch_, fundo, prof=10):
    """Carta com profundidade (camadas escuras embaixo), moldura e filete branco."""
    lados = "".join(f'<rect x="{-cw / 2}" y="{-ch_ / 2 + k}" width="{cw}" height="{ch_}" rx="16" fill="{NAVY}"/>'
                    for k in range(prof, 0, -2))
    return (f'<rect x="{-cw / 2 + 10}" y="{-ch_ / 2 + 18}" width="{cw}" height="{ch_}" rx="16" fill="#000" opacity=".3"/>'
            + lados
            + f'<rect x="{-cw / 2}" y="{-ch_ / 2}" width="{cw}" height="{ch_}" rx="16" fill="{fundo}" stroke="{NAVY}" stroke-width="7"/>'
            f'<rect x="{-cw / 2 + 11}" y="{-ch_ / 2 + 11}" width="{cw - 22}" height="{ch_ - 22}" rx="9" fill="none" '
            f'stroke="#fff" stroke-width="3" opacity=".75"/>')


# ============ G: Arena de Cartas (D + E) ============
def arena_cartas():
    W, H = 1600, 780
    n = 9
    quadra = (f'<path d="M150 560 A650 360 0 0 1 1450 560 Z" fill="#c98d4f"/>'
              f'<path d="M150 560 A650 360 0 0 1 1450 560" fill="none" stroke="{BRANCO}" stroke-width="10" opacity=".8"/>'
              f'<path d="M560 560 A240 140 0 0 1 1040 560" fill="none" stroke="{BRANCO}" stroke-width="8" opacity=".7"/>'
              f'<line x1="800" y1="200" x2="800" y2="560" stroke="{BRANCO}" stroke-width="8" opacity=".5"/>')
    corpo = ""
    for i, l in enumerate("SOCCERMON"):
        t = i - (n - 1) / 2
        ang = t * 6
        x = 800 + t * 150
        y = 330 + t * t * 7.5
        fundo = "url(#holo)" if i == 1 else f"url(#m-{ORDEM[i]})"
        miolo = (bola_cor(0, -4, 50) if i == 1 else
                 f'<g transform="translate(-40 -62) scale(13.5)">{letra_3d(l, 13.5, 5, 1.6)}</g>')
        corpo += f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">{carta(132, 190, fundo)}{miolo}</g>'
    faixa = (f'<path d="M520 600 L1080 600 L1050 660 L1080 720 L520 720 L550 660 Z" fill="{NAVY}" transform="translate(0 7)"/>'
             f'<path d="M520 600 L1080 600 L1050 660 L1080 720 L520 720 L550 660 Z" fill="{VERMELHO}"/>'
             f'<text x="800" y="682" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" font-size="46" '
             f'fill="{BRANCO}" letter-spacing="10">FUTSAL 5×5</text>')
    salvar("g-arena-cartas.svg", W, H, quadra + corpo + faixa)


# ============ H: Explosão de Cartas (E + F) ============
def explosao_cartas():
    W, H = 1600, 820
    pts = []
    for i in range(32):
        r = 340 if i % 2 == 0 else 250
        a = i * math.pi / 16 + 0.1
        pts.append(f"{800 + math.cos(a) * r * 1.55:.0f},{410 + math.sin(a) * r:.0f}")
    burst = (f'<polygon points="{" ".join(pts)}" fill="{AMARELO}" stroke="{NAVY}" stroke-width="12" stroke-linejoin="round"/>'
             f'<circle cx="800" cy="410" r="200" fill="{LARANJA}" opacity=".35"/>')
    # SOCCER: cartas menores, espalhadas como se saíssem da explosão
    corpo = ""
    giros = [-16, -8, 5, -4, 9, 15]
    alturas = [40, -10, -30, -25, 0, 35]
    for i, l in enumerate("SOCCER"):
        x = 800 + (i - 2.5) * 158
        y = 230 + alturas[i]
        fundo = "url(#holo)" if i == 1 else f"url(#m-{ORDEM[i]})"
        miolo = (bola_cor(0, -4, 46) if i == 1 else
                 f'<g transform="translate(-48 -72) scale(16)" fill="none" stroke="{METAIS[ORDEM[i]][3]}" '
                 f'stroke-width="{TRACO}" stroke-linejoin="round" stroke-linecap="round"><path d="{ESQ[l]}"/></g>')
        corpo += f'<g transform="translate({x:.0f} {y:.0f}) rotate({giros[i]})">{carta(124, 176, fundo, 8)}{miolo}</g>'
    # MON: grande, vermelho, itálico, adesivo (estilo F)
    g = "".join(f'<path transform="translate({k * 6.8} 0)" d="{ESQ[c]}"/>' for k, c in enumerate("MON"))
    t = 'translate(560 430) skewX(-14) scale(32)'
    mon = (f'<g transform="{t}" fill="none" stroke-linejoin="bevel">'
           f'<g stroke="{BRANCO}" stroke-width="{TRACO + 3.2}">{g}</g>'
           f'<g stroke="{NAVY}" stroke-width="{TRACO + 2}">{g}</g>'
           f'<g stroke="{NAVY}" stroke-width="{TRACO + 1.2}" transform="translate(.45 .55)">{g}</g>'
           f'<g stroke="{VERMELHO}" stroke-width="{TRACO}">{g}</g>'
           f'<g stroke="#ff8f8d" stroke-width="{TRACO * .25}" transform="translate(-.2 -.35)">{g}</g></g>')
    estilhacos = "".join(
        f'<path d="M{800 + math.cos(a) * 360:.0f} {410 + math.sin(a) * 250:.0f} L{800 + math.cos(a) * 430:.0f} {410 + math.sin(a) * 300:.0f}" '
        f'stroke="{NAVY}" stroke-width="10" stroke-linecap="round"/>' for a in (0.2, 0.7, 2.5, 3.0, 3.6, 5.9))
    salvar("h-explosao-cartas.svg", W, H, burst + estilhacos + mon + corpo)


# ============ I: Evolução (ideia nova) ============
def evolucao(tagline=None, nome="i-evolucao.svg", com_fundo=True):
    W, H = 1600, 760
    raios = "".join(
        f'<polygon points="800,380 {800 + math.cos(a - .05) * 1200:.0f},{380 + math.sin(a - .05) * 1200:.0f} '
        f'{800 + math.cos(a + .05) * 1200:.0f},{380 + math.sin(a + .05) * 1200:.0f}" fill="#fff" opacity=".09"/>'
        for a in [k * math.pi / 14 for k in range(28)])
    fundo = (f'<rect width="{W}" height="{H}" fill="url(#noite)"/>{raios}'
             f'<ellipse cx="800" cy="380" rx="520" ry="230" fill="url(#halo)"/>')
    defs = ('<radialGradient id="noite" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2a3a7a"/>'
            '<stop offset="1" stop-color="#070a18"/></radialGradient>'
            '<radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".55"/>'
            '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
            '<filter id="brilho" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>')
    u = 23
    x0 = 800 - (8 * 6.9 + 6) * u / 2
    corpo = ""
    for i, l in enumerate("SOCCERMON"):
        x = x0 + i * 6.9 * u
        # da esquerda pra direita: silhueta branca → colorida (metade da evolução)
        if i == 1:
            # o O é uma carta holográfica com a bola dentro (pedido do Miguel), levemente inclinada
            corpo += (f'<g transform="translate({x + 3 * u:.0f} {380:.0f}) rotate(-6)">'
                      f'<g transform="scale({u / 21:.3f})">{carta(150, 214, "url(#holo)", 10)}{bola_cor(0, -4, 52)}</g></g>')
            continue
        if i < 4:
            est = 'fill="none" stroke-linejoin="round" stroke-linecap="round"'
            brilho = f'<path d="{ESQ[l]}" {est} stroke="#cfe4ff" stroke-width="{TRACO + .4}"/>'
            g = (f'<path d="{ESQ[l]}" {est} stroke="{NAVY}" stroke-width="{TRACO + 1.6}"/>'
                 f'<path d="{ESQ[l]}" {est} stroke="#fff" stroke-width="{TRACO}"/>')
            corpo += (f'<g transform="translate({x:.0f} {380 - 4 * u:.0f}) scale({u})">'
                      + (f'<g filter="url(#brilho)" opacity=".55">{brilho}</g>' if com_fundo else '') + f'{g}</g>')
        else:
            corpo += f'<g transform="translate({x:.0f} {380 - 4 * u:.0f}) scale({u})">{letra_3d(l, u, 7, 2.2)}</g>'
    brilhos = "".join(
        f'<path d="M{x} {y - s}L{x + s * .25} {y - s * .25}L{x + s} {y}L{x + s * .25} {y + s * .25}L{x} {y + s}'
        f'L{x - s * .25} {y + s * .25}L{x - s} {y}L{x - s * .25} {y - s * .25}Z" fill="#fff"/>'
        for x, y, s in ((380, 210, 26), (560, 560, 18), (980, 200, 22), (1240, 560, 28), (1330, 250, 16), (690, 170, 14)))
    sub = (f'<text x="800" y="640" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" font-size="40" '
           f'fill="{AMARELO}" letter-spacing="8">O QUÊ? O FUTSAL ESTÁ EVOLUINDO!</text>')
    # tagline escolhida pelo Miguel: paródia do bordão do desenho ("Temos que pegar!" / "Gotta catch 'em all!")
    sub = ""
    if tagline:
        sub = (f'<text x="800" y="650" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" '
               f'font-size="54" fill="{NAVY}" letter-spacing="6" transform="translate(5 6)">{tagline}</text>'
               f'<text x="800" y="650" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" '
               f'font-size="54" fill="{AMARELO}" letter-spacing="6">{tagline}</text>')
    if com_fundo:
        salvar(nome, W, H, fundo + corpo + brilhos + sub, defs)
    else:
        # versão sem fundo (Home, por cima de vídeo): caixa justa em volta das letras, da carta e da tagline
        y0, h = 236, (300 if not tagline else 440)
        with open(os.path.join(AQUI, nome), "w") as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="66 {y0} 1468 {h}"><defs>{FONTE if tagline else ""}{GRAD}{defs}</defs>'
                    f'{corpo}{sub}</svg>\n')


def icone():
    raios = "".join(
        f'<polygon points="128,128 {128 + math.cos(a - .09) * 260:.0f},{128 + math.sin(a - .09) * 260:.0f} '
        f'{128 + math.cos(a + .09) * 260:.0f},{128 + math.sin(a + .09) * 260:.0f}" fill="#fff" opacity=".1"/>'
        for a in [k * math.pi / 8 for k in range(16)])
    corpo = (f'<rect width="256" height="256" rx="48" fill="url(#noite)"/><g clip-path="url(#cantos)">{raios}</g>'
             f'<g transform="translate(128 132) rotate(-8) scale(.95)">{carta(150, 214, "url(#holo)", 10)}{bola_cor(0, -4, 52)}</g>')
    defs = ('<radialGradient id="noite" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#2a3a7a"/>'
            '<stop offset="1" stop-color="#070a18"/></radialGradient>'
            '<clipPath id="cantos"><rect width="256" height="256" rx="48"/></clipPath>')
    with open(os.path.join(AQUI, "icone.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs>{GRAD}{defs}</defs>{corpo}</svg>\n')


# G (arena_cartas) e H (explosao_cartas) foram descartados; o escolhido é o I (evolucao)
evolucao()
evolucao("TEMOS QUE CHUTAR!", "i-evolucao-pt.svg")
evolucao("GOTTA KICK 'EM ALL!", "i-evolucao-en.svg")
evolucao(None, "logo.svg", com_fundo=False)
evolucao("TEMOS QUE CHUTAR!", "logo-pt.svg", com_fundo=False)
evolucao("GOTTA KICK 'EM ALL!", "logo-en.svg", com_fundo=False)
icone()
print("ok: logo final (i-evolucao, logo*, icone)")
