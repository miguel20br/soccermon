"""Logo final do Soccermon (escolha do Miguel, 19/10/2026): a carta holo com a bola-pokébola, vetor limpo, e a
versão monocromática.

A bola é uma bola de futebol de verdade (icosaedro truncado projetado: pentágonos e costuras de hexágono nos lugares
certos), com a faixa quase reta (10°) e o botão dourado no centro: lê como bola e como pokébola ao mesmo tempo.

Saída (SVG é a fonte; os PNG só servem pra conferir):
  logo-simbolo.svg, logo-icone.svg, logo-horizontal.svg               — em cor
  logo-*-mono-branco.svg, logo-*-mono-azul.svg                         — uma cor só (#ffffff / #0b1030)

    python3 trailer/arte/logo/final/logo.py && node trailer/arte/logo/final/render.mjs
"""
import itertools
import json
import math
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
from gerar import ESQ, TRACO  # noqa: E402  (esqueletos das letras do logo atual)

NAVY, AZUL, BRANCO = "#0e1430", "#2a4ea0", "#ffffff"
OURO, OURO_C, OURO_E, OURO_X = "#ffcb05", "#fff3a0", "#ff8a1c", "#b85a10"
HOLO = ("#ff9ad5", "#9ae6ff", "#b6ffa0", "#fff29a")
SOMBRA_BOLA = "#dbe2f2"
MONO = {"branco": "#ffffff", "azul": "#0b1030"}
CW, CH = 150, 210  # carta, em unidades locais
R = 56  # raio da bola
INCLINA = -2  # a bola inteira (gomos e faixa juntos) gira isso: com a carta a -8°, fica a -10° na tela


def n(v):
    """Número curto pro SVG (2 casas, sem zeros à toa)."""
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def pts(lista):
    return " ".join(f"{n(x)},{n(y)}" for x, y in lista)


# ---------------- a bola: icosaedro truncado de verdade ----------------
FI = (1 + 5 ** 0.5) / 2


def _norm(v):
    m = math.sqrt(sum(c * c for c in v))
    return tuple(c / m for c in v)


def _girar(v, eixo, ang):
    """Rodrigues: gira v em torno de eixo (unitário)."""
    c, s = math.cos(ang), math.sin(ang)
    x, y, z = eixo
    d = sum(a * b for a, b in zip(v, eixo))
    cruz = (y * v[2] - z * v[1], z * v[0] - x * v[2], x * v[1] - y * v[0])
    return tuple(v[i] * c + cruz[i] * s + eixo[i] * d * (1 - c) for i in range(3))


def _bola_3d(alvo=None, giro=0.0):
    """Centros dos 12 pentágonos (vértices do icosaedro) e os vértices do icosaedro truncado, girados de modo que um
    pentágono olhe pra `alvo` (direção na tela: x direita, y baixo, z pra quem olha).

    alvo=None: sem giro. Aí quem olha está no eixo de ordem 2 do icosaedro (z, o meio da costura entre dois
    hexágonos, que fica atrás do botão): o desenho é simétrico em cima/embaixo e esquerda/direita, porque trocar o
    sinal de x ou de y leva o icosaedro nele mesmo. Pentágono inteiro em cima e embaixo da faixa, meios nas bordas."""
    ico = []
    for a, b in itertools.product((-1, 1), repeat=2):
        ico += [(0, a, b * FI), (a, b * FI, 0), (b * FI, 0, a)]
    ico = [_norm(v) for v in ico]
    viz = {i: [j for j in range(12) if i != j and abs(sum(a * b for a, b in zip(ico[i], ico[j])) - 1 / 5 ** 0.5) < 1e-6]
           for i in range(12)}
    # rotação que leva o pentágono 0 até o alvo, depois giro em torno do alvo
    a = ico[0]
    sem_giro = alvo is None
    alvo = alvo or (0.0, 0.0, 1.0)
    eixo = (a[1] * alvo[2] - a[2] * alvo[1], a[2] * alvo[0] - a[0] * alvo[2], a[0] * alvo[1] - a[1] * alvo[0])
    ang = math.acos(max(-1, min(1, sum(x * y for x, y in zip(a, alvo)))))
    eixo = _norm(eixo)

    def rot(v):
        return _girar(_girar(v, eixo, ang), alvo, giro)
    if sem_giro:
        def rot(v):  # noqa: F811
            return v
    vert = {}  # (i, j): vértice do truncado na aresta i->j, perto de i
    for i in range(12):
        for j in viz[i]:
            p = tuple(ico[i][k] + (ico[j][k] - ico[i][k]) / 3 for k in range(3))
            vert[(i, j)] = rot(_norm(p))
    centros = [rot(c) for c in ico]
    # ordem dos vértices em volta de cada pentágono
    pent = []
    for i in range(12):
        c = centros[i]
        vs = [vert[(i, j)] for j in viz[i]]
        # base local pra ordenar por ângulo
        u = _norm(tuple(vs[0][k] - c[k] * sum(vs[0][m] * c[m] for m in range(3)) for k in range(3)))
        w = (c[1] * u[2] - c[2] * u[1], c[2] * u[0] - c[0] * u[2], c[0] * u[1] - c[1] * u[0])
        vs.sort(key=lambda v: math.atan2(sum(v[k] * w[k] for k in range(3)), sum(v[k] * u[k] for k in range(3))))
        pent.append((c, vs))
    pontes = [(vert[(i, j)], vert[(j, i)]) for i in range(12) for j in viz[i] if i < j]
    return pent, pontes


def bola(cor=None, borda=6.0, detalhe=True):
    """Bola na origem, raio R. cor=None: colorida; cor='#…': uma cor só (o branco fica vazado)."""
    pent, pontes = _bola_3d()  # simétrica em relação à faixa e ao botão
    t = cor or NAVY

    def tela(v):  # projeção ortográfica; o que está atrás vai pra borda
        x, y, z = v
        if z < 0:
            m = math.hypot(x, y) or 1
            x, y = x / m, y / m
        return x * R, y * R

    poli = "".join(f'<polygon points="{pts([tela(v) for v in vs])}"/>' for c, vs in pent if c[2] > -0.25)
    costura = borda * (0.55 if cor else 0.42)
    linhas = "".join(f'<path d="M{n(tela(a)[0])} {n(tela(a)[1])}L{n(tela(b)[0])} {n(tela(b)[1])}"/>'
                     for a, b in pontes if a[2] > 0.02 and b[2] > 0.02)
    meia, folga = 0.16 * R, borda * 0.7

    def faixa(cor_folga, cor_faixa):  # a faixa com um respiro branco em volta: separa dos gomos e lê como pokébola
        return (f'<rect x="{n(-R * 1.2)}" y="{n(-meia - folga)}" width="{n(R * 2.4)}" '
                f'height="{n(2 * (meia + folga))}" fill="{cor_folga}"/>'
                f'<rect x="{n(-R * 1.2)}" y="{n(-meia)}" width="{n(R * 2.4)}" height="{n(2 * meia)}" fill="{cor_faixa}"/>')
    rb = 0.35 * R
    sid = (cor or "").lstrip("#")
    clip = f'<clipPath id="bc{sid}"><circle r="{R}"/></clipPath>'

    def padrao(t, fundo):
        # o conjunto todo (gomos, costuras e faixa) gira junto: a simetria fica
        return (f'<g clip-path="url(#bc{sid})"><g transform="rotate({INCLINA})"><g fill="{t}">{poli}</g>'
                + (f'<g stroke="{t}" stroke-width="{n(costura)}" stroke-linecap="round" fill="none">{linhas}</g>' if detalhe else "")
                + faixa(fundo, t) + '</g></g>')
    if cor:
        # uma cor só: tudo que é tinta numa máscara; o miolo do botão vaza e sobra o ponto do meio
        return (clip + f'<mask id="bm{sid}">{padrao("#fff", "#000")}'
                f'<circle r="{n(R - borda / 2)}" fill="none" stroke="#fff" stroke-width="{n(borda)}"/>'
                f'<circle r="{n(rb + folga)}" fill="#000"/>'  # respiro em volta do botão: não vira raio de volante
                f'<circle r="{n(rb)}" fill="#fff"/><circle r="{n(rb - borda * 1.1)}" fill="#000"/>'
                f'<circle r="{n(rb * 0.42)}" fill="#fff"/></mask>'
                f'<rect x="-{R}" y="-{R}" width="{2 * R}" height="{2 * R}" fill="{t}" mask="url(#bm{sid})"/>')
    luz = (f'<circle r="{R}" fill="{SOMBRA_BOLA}"/><g clip-path="url(#bc{sid})"><circle cx="{n(-0.09 * R)}" cy="{n(-0.11 * R)}" '
           f'r="{n(R * 0.94)}" fill="{BRANCO}"/></g>')
    botao = (f'<circle r="{n(rb + folga)}" fill="{BRANCO}"/><circle r="{n(rb)}" fill="{NAVY}"/><circle r="{n(rb - borda * 0.95)}" fill="{OURO}"/>'
             f'<path d="M{n(-rb * 0.55)} {n(-rb * 0.05)}a{n(rb * 0.55)} {n(rb * 0.55)} 0 0 1 {n(rb * 0.6)} {n(-rb * 0.5)}" fill="none" '
             f'stroke="{OURO_C}" stroke-width="{n(borda * 0.6)}" stroke-linecap="round"/>')
    return (clip + luz + padrao(t, BRANCO) + f'<circle r="{n(R - borda / 2)}" fill="none" stroke="{NAVY}" stroke-width="{n(borda)}"/>' + botao)


# ---------------- a carta ----------------
def carta(cor=None, borda=7.0):
    rx, aro = CW * 0.1, CW * 0.075
    iw, ih = CW - 2 * aro, CH - 2 * aro
    caixa = f'x="{n(-CW / 2)}" y="{n(-CH / 2)}" width="{CW}" height="{CH}" rx="{n(rx)}"'
    miolo = f'x="{n(-iw / 2)}" y="{n(-ih / 2)}" width="{n(iw)}" height="{n(ih)}" rx="{n(rx * 0.55)}"'
    larg = math.hypot(CW, CH) / 4
    if cor:
        # uma cor: contorno, filete interno e o holo como dois reflexos chapados (o resto vazado)
        return (f'<clipPath id="cm"><rect {miolo}/></clipPath>'
                f'<rect {caixa} fill="none" stroke="{cor}" stroke-width="{n(borda * 1.6)}"/>'
                f'<rect {miolo} fill="none" stroke="{cor}" stroke-width="{n(borda * 0.6)}"/>'
                f'<g clip-path="url(#cm)" fill="{cor}"><g transform="rotate(40)">'
                f'<rect x="{n(larg * 0.5)}" y="{-CH}" width="{n(CW * 0.08)}" height="{2 * CH}"/>'
                f'<rect x="{n(larg * 0.5 + CW * 0.14)}" y="{-CH}" width="{n(CW * 0.035)}" height="{2 * CH}"/>'
                f'<rect x="{n(-larg * 1.35)}" y="{-CH}" width="{n(CW * 0.035)}" height="{2 * CH}"/></g></g>')
    faixas = "".join(f'<rect x="{n(-2 * larg + i * larg)}" y="{-CH}" width="{n(larg + 0.5)}" height="{2 * CH}" fill="{HOLO[i]}"/>'
                     for i in range(4))
    reflexo = (f'<rect x="{n(larg * 0.5)}" y="{-CH}" width="{n(CW * 0.07)}" height="{2 * CH}" fill="#fff" opacity=".6"/>'
               f'<rect x="{n(larg * 0.5 + CW * 0.12)}" y="{-CH}" width="{n(CW * 0.025)}" height="{2 * CH}" fill="#fff" opacity=".6"/>')
    return (f'<clipPath id="cm"><rect {miolo}/></clipPath>'
            f'<rect {caixa} fill="{OURO}" stroke="{NAVY}" stroke-width="{n(borda)}"/>'
            f'<path d="M{n(-CW / 2 + 3)} {n(CH * 0.25)}V{n(-CH / 2 + rx)}q0 {n(-rx + 3)} {n(rx - 3)} {n(-rx + 3)}H{n(CW * 0.25)}" '
            f'fill="none" stroke="{OURO_C}" stroke-width="{n(aro * 0.45)}" stroke-linecap="round" transform="translate({n(aro * 0.35)} {n(aro * 0.35)})"/>'
            f'<g clip-path="url(#cm)"><g transform="rotate(40)">{faixas}{reflexo}</g></g>'
            f'<rect {miolo} fill="none" stroke="{OURO_X}" stroke-width="{n(borda * 0.45)}"/>')


def simbolo(cor=None, detalhe=True):
    """Carta + bola, na origem (sem giro). detalhe=False: sem as costuras (ícone de 16-48 px)."""
    if cor:
        # a bola fica numa "janela" vazada da carta, separada do holo por um respiro
        return (f'<mask id="jan"><rect x="-200" y="-200" width="400" height="400" fill="#fff"/><circle r="{R + 7}" fill="#000"/></mask>'
                f'<g mask="url(#jan)">{carta(cor)}</g>{bola(cor, 8)}')
    return carta() + bola(detalhe=detalhe)


# ---------------- fundo de marca ----------------
def raios(cx, cy, qtd, comp, larg, opac):
    return "".join(
        f'<polygon points="{cx},{cy} {n(cx + math.cos(a - larg) * comp)},{n(cy + math.sin(a - larg) * comp)} '
        f'{n(cx + math.cos(a + larg) * comp)},{n(cy + math.sin(a + larg) * comp)}"/>'
        for a in [k * 2 * math.pi / qtd for k in range(qtd)]).join([f'<g fill="#fff" opacity="{opac}">', "</g>"])


NOITE = ('<radialGradient id="noite" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#2a3a7a"/>'
         '<stop offset="1" stop-color="#070a18"/></radialGradient>')


def gravar(nome, vb, corpo, defs=""):
    caminho = os.path.join(AQUI, nome)
    with open(caminho, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">' + (f"<defs>{defs}</defs>" if defs else "") + f"{corpo}</svg>\n")
    return nome


GIRO = -8  # inclinação da carta
LABIO = 0.36  # sombra chapada embaixo de cada letra (unidades da grade)


def arq_simbolo(cor=None, sufixo=""):
    # caixa justa da carta girada (com contorno e sombra)
    meia_w = (CW * math.cos(math.radians(8)) + CH * math.sin(math.radians(8))) / 2 + 8
    meia_h = (CW * math.sin(math.radians(8)) + CH * math.cos(math.radians(8))) / 2 + 8
    sombra = "" if cor else (f'<g transform="translate(7 10) rotate({GIRO})"><rect x="{-CW / 2}" y="{-CH / 2}" width="{CW}" height="{CH}" '
                             f'rx="15" fill="#04060f" opacity=".4"/></g>')
    return gravar(f"logo-simbolo{sufixo}.svg", f"{n(-meia_w)} {n(-meia_h)} {n(2 * meia_w + 7)} {n(2 * meia_h + 10)}",
                  f'{sombra}<g transform="rotate({GIRO})">{simbolo(cor)}</g>')


def arq_icone(cor=None, sufixo=""):
    esc = 0.9
    if cor:
        # uma cor: quadrado cheio com o símbolo vazado (negativo)
        s = simbolo("#000")
        return gravar(f"logo-icone{sufixo}.svg", "0 0 256 256",
                      f'<mask id="neg"><rect width="256" height="256" fill="#fff"/>'
                      f'<g transform="translate(128 130) rotate({GIRO}) scale({esc})">{s}</g></mask>'
                      f'<rect width="256" height="256" rx="48" fill="{cor}" mask="url(#neg)"/>')
    corpo = (f'<rect width="256" height="256" rx="48" fill="url(#noite)"/>'
             f'<clipPath id="cantos"><rect width="256" height="256" rx="48"/></clipPath>'
             f'<g clip-path="url(#cantos)">{raios(128, 128, 16, 260, .09, ".1")}</g>'
             f'<g transform="translate(135 140) rotate({GIRO}) scale({esc})"><rect x="{-CW / 2}" y="{-CH / 2}" width="{CW}" height="{CH}" rx="15" fill="#04060f" opacity=".45"/></g>'
             f'<g transform="translate(128 130) rotate({GIRO}) scale({esc})">{simbolo()}</g>')
    return gravar(f"logo-icone{sufixo}.svg", "0 0 256 256", corpo, NOITE)


def arq_icone_pequeno():
    """Favicon (16, 32 e 48 px): fundo chapado sem raios, carta maior e reta, bola sem costura e traço mais grosso."""
    corpo = (f'<rect width="256" height="256" rx="40" fill="{NAVY}"/>'
             f'<g transform="translate(128 128) rotate(-6) scale(1.12)">{carta(borda=12)}<g transform="scale(1.3)">{bola(borda=9, detalhe=False)}</g></g>')
    return gravar("logo-icone-pequeno.svg", "0 0 256 256", corpo)


# 16 px à mão: na grade, a bola não tem gomo (vira ruído); fica o contorno, a faixa e o botão dourado
BOLA_16 = ["..KKKK..", ".KWWWWK.", "KWWWWWWK", "KKKDDKKK", "KWWWWWWK", ".KWWWWK.", "..KKKK.."]


def arq_icone_16():
    cor = {"N": NAVY, "G": OURO, "E": OURO_E, "K": NAVY, "W": BRANCO, "D": OURO}
    px = {}
    for y in range(16):
        for x in range(16):
            px[x, y] = "N"
    for y in range(1, 15):  # carta: colunas 3-12, linhas 1-14, borda dourada com a sombra laranja embaixo/direita
        for x in range(3, 13):
            borda = x in (3, 12) or y in (1, 14)
            if borda:
                px[x, y] = "E" if (x == 12 or y == 14) and not (x == 3 or y == 1) else "G"
            else:
                t = (x - 4) + (y - 2) * 0.84  # faixas do holo a 40°
                px[x, y] = HOLO[0] if t < 4 else HOLO[1] if t < 8.5 else HOLO[2] if t < 13 else HOLO[3]
    for j, linha in enumerate(BOLA_16):
        for i, c in enumerate(linha):
            if c != ".":
                px[4 + i, 4 + j] = c
    rects = "".join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{cor.get(c, c)}"/>' for (x, y), c in px.items()
                    if not ((x in (0, 15)) and (y in (0, 15))))  # cantos arredondados de 1 px
    return gravar("logo-icone-16.svg", "0 0 16 16", f'<g shape-rendering="crispEdges">{rects}</g>')


def arq_bola():
    """Só a bola do logo (a da página 404; a quadra da Home usa a ball.svg original do jogo)."""
    return gravar("logo-bola.svg", f"{-R - 1} {-R - 1} {2 * R + 2} {2 * R + 2}", bola())


def letra(ch, i, u, cor):
    d = ESQ[ch]
    est = 'fill="none" stroke-linejoin="round" stroke-linecap="round"'
    if cor:
        return f'<path d="{d}" {est} stroke="{cor}" stroke-width="{TRACO}"/>'
    # Vetor limpo, como a carta: cores chapadas, sem degradê nem transparência. Cada letra é a cor de sombra por
    # baixo e a cor cheia por cima, um pouco mais fina e subida: sobra um lábio de sombra embaixo (cel-shading).
    topo = f'transform="translate(0 {n(-LABIO / 2)})" stroke-width="{n(TRACO - LABIO)}"'
    if i < 4:  # SOCC branco
        return (f'<path d="{d}" {est} stroke="{NAVY}" stroke-width="{n(TRACO + 1.6)}"/>'
                f'<path d="{d}" {est} stroke="{SOMBRA_BOLA}" stroke-width="{TRACO}"/>'
                f'<path d="{d}" {est} stroke="{BRANCO}" {topo}/>')
    # ERMON dourado com o bloco 3D azul chapado
    ext = "".join(f'<path d="{d}" transform="translate(0 {n(k * 2.2 / u)})" stroke="{AZUL if k < 7 else NAVY}"/>' for k in range(7, 0, -1))
    return (f'<g {est} stroke-width="{n(TRACO + 1.6)}">{ext}<path d="{d}" stroke="{NAVY}"/></g>'
            f'<path d="{d}" {est} stroke="{OURO_E}" stroke-width="{TRACO}"/>'
            f'<path d="{d}" {est} stroke="{OURO}" {topo}/>'
            f'<path d="{d}" {est} stroke="{OURO_C}" stroke-width="{n(TRACO * 0.2)}" transform="translate(-.3 -.42)"/>')


def arq_horizontal(cor=None, sufixo=""):
    u = 23
    corpo = ""
    x = 0.0
    for i, ch in enumerate("SOCCERMON"):
        if i == 1:
            esc = u / 21 * 1.02
            corpo += f'<g transform="translate({n(x + 3.3 * u)} {n(4 * u)}) rotate(-6) scale({n(esc)})">{simbolo(cor)}</g>'
            x += 7.5 * u
            continue
        corpo += f'<g transform="translate({n(x)} 0) scale({u})">{letra(ch, i, u, cor)}</g>'
        x += 6.9 * u
    larg = x - 0.9 * u
    # a carta passa da altura das letras: caixa com folga em cima e embaixo
    topo, alt = -58, 8 * u + 116
    return gravar(f"logo-horizontal{sufixo}.svg", f"-10 {topo} {n(larg + 20)} {alt}", corpo)


def main():
    feitos = [arq_simbolo(), arq_icone(), arq_icone_pequeno(), arq_icone_16(), arq_bola(), arq_horizontal()]
    for nome, cor in MONO.items():
        feitos += [arq_simbolo(cor, f"-mono-{nome}"), arq_icone(cor, f"-mono-{nome}"), arq_horizontal(cor, f"-mono-{nome}")]
    pedidos = []
    for f in feitos:
        tam = (16, 32, 48, 128, 512) if "horizontal" not in f else (128, 512, 1920)
        pedidos += [[f, f"png/{f[:-4]}-{t}.png", t] for t in tam]
    with open(os.path.join(AQUI, "pedidos.json"), "w") as fp:
        json.dump(pedidos, fp)
    for f in feitos:
        print(f"{f}: {os.path.getsize(os.path.join(AQUI, f)) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
