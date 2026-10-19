"""Logo do Soccermon, rodada 2b: a CARTA do Miguel (carta holo inclinada + bola-pokébola, raios atrás), mais limpa e
sem nada escrito dentro, em 4 estilos. Este script faz os 3 estilos em vetor; o pixel art sai do pixel.py.

1 vetor   — contorno firme, cores chapadas, holo em 4 faixas largas (nada de gradiente borrado).
3 adesivo — o mesmo desenho com contorno branco grosso por fora e sombra chapada (avatar de rede social).
4 minimo  — carta dourada + bola em 3 cores (azul-noite, ouro, branco) e versão de uma cor só; 16 px à mão.

A bola "nossa": 3 pentágonos grandes, faixa grossa inclinada (a da pokébola é reta) e botão dourado de medalha.
Nome: letras do logo atual (gerar.py), SOCC branco + ERMON dourado 3D, a carta é o O.

    python3 trailer/arte/logo/conceitos-2/cartas.py && node trailer/arte/logo/conceitos-2/render.mjs
"""
import json
import math
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")
sys.path.insert(0, os.path.dirname(AQUI))
from gerar import ESQ, TRACO  # noqa: E402
from pixel import Tela  # noqa: E402

NAVY, AZUL, BRANCO = "#0e1430", "#2a4ea0", "#ffffff"
OURO, OURO_C, OURO_E, OURO_X = "#ffcb05", "#fff3a0", "#ff8a1c", "#b85a10"
HOLO = ("#ff9ad5", "#9ae6ff", "#b6ffa0", "#fff29a")  # rosa, ciano, verde, amarelo (a ordem do conceito)
SOMBRA_BOLA = "#d9e1f2"
PEDIDOS = []  # (svg, png, largura, altura) pro render.mjs

DEFS = ('<radialGradient id="noite" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#2a3a7a"/>'
        '<stop offset="1" stop-color="#070a18"/></radialGradient>'
        '<linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/>'
        f'<stop offset=".55" stop-color="{OURO}"/><stop offset="1" stop-color="{OURO_E}"/></linearGradient>'
        # adesivo: contorno branco grosso por fora (dilata o alfa) + sombra chapada embaixo
        '<filter id="adesivo" x="-20%" y="-20%" width="140%" height="140%">'
        # fecha antes os vãos das letras (boca do C), senão o papel do adesivo aparece dentro delas
        '<feMorphology in="SourceAlpha" operator="dilate" radius="{f}" result="f1"/>'
        '<feMorphology in="f1" operator="erode" radius="{f}" result="f2"/>'
        '<feMerge result="f3"><feMergeNode in="f2"/><feMergeNode in="SourceAlpha"/></feMerge>'
        '<feMorphology in="f3" operator="dilate" radius="{r}" result="d"/>'
        '<feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="borda"/>'
        '<feOffset in="d" dx="0" dy="{s}" result="ds"/><feFlood flood-color="#04060f" flood-opacity=".55"/>'
        '<feComposite in2="ds" operator="in" result="sombra"/>'
        '<feMerge><feMergeNode in="sombra"/><feMergeNode in="borda"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')
N = 0


def uid(p):
    global N
    N += 1
    return f"{p}{N}"


def pent(cx, cy, r, rot=-90):
    return " ".join(f"{cx + math.cos(math.radians(rot + i * 72)) * r:.2f},{cy + math.sin(math.radians(rot + i * 72)) * r:.2f}"
                    for i in range(5))


# ---------------- a bola ----------------
def bola(R, borda, inclina=-18, sombra=True, pentagonos=True, cor=None):
    """Bola na origem. `cor`: versão de uma cor só (desenha só o que é tinta; o branco fica vazado)."""
    c = uid("b")
    t = cor or NAVY
    pents = ""
    if pentagonos:
        pents = (f'<polygon points="{pent(0, -0.6 * R, 0.3 * R)}"/><polygon points="{pent(-0.56 * R, 0.62 * R, 0.29 * R, -54)}"/>'
                 f'<polygon points="{pent(0.56 * R, 0.62 * R, 0.29 * R, -126)}"/>')
    faixa = f'<rect x="{-R * 1.2}" y="{-0.2 * R}" width="{R * 2.4}" height="{0.4 * R}"/>'
    if cor:
        return (f'<clipPath id="{c}"><circle r="{R}"/></clipPath>'
                f'<g clip-path="url(#{c})" fill="{t}"><g transform="rotate({inclina})">{pents}{faixa}</g></g>'
                f'<circle r="{R}" fill="none" stroke="{t}" stroke-width="{borda}"/>'
                f'<circle r="{0.42 * R}" fill="{t}"/><circle r="{0.28 * R}" fill="#000"/><circle r="{0.15 * R}" fill="{t}"/>')
    luz = (f'<circle r="{R}" fill="{SOMBRA_BOLA}"/><circle cx="{-0.1 * R}" cy="{-0.12 * R}" r="{R * 0.93}" fill="{BRANCO}"/>'
           if sombra else f'<circle r="{R}" fill="{BRANCO}"/>')
    botao = (f'<circle r="{0.42 * R}" fill="{NAVY}"/><circle r="{0.42 * R - borda * 0.9}" fill="{OURO}"/>'
             + (f'<path d="M{-0.3 * R} {-0.02 * R}a{0.3 * R} {0.3 * R} 0 0 1 {0.36 * R} {-0.28 * R}" fill="none" '
                f'stroke="{OURO_C}" stroke-width="{borda * 0.7}" stroke-linecap="round"/>' if sombra else ""))
    return (f'<clipPath id="{c}"><circle r="{R}"/></clipPath>{luz}'
            f'<g clip-path="url(#{c})" fill="{NAVY}"><g transform="rotate({inclina})">{pents}{faixa}</g></g>'
            f'<circle r="{R}" fill="none" stroke="{NAVY}" stroke-width="{borda}"/>{botao}')


# ---------------- a carta ----------------
def carta(w, h, borda, estilo="vetor"):
    """Carta na origem (sem giro): contorno azul-noite, borda dourada fina, holo em 4 faixas largas chapadas."""
    rx = w * 0.1
    aro = w * 0.075
    c = uid("c")
    if estilo == "minimo":
        return (f'<rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="{rx}" fill="{OURO}" stroke="{NAVY}" stroke-width="{borda}"/>'
                f'<rect x="{-w / 2 + aro + borda / 2}" y="{-h / 2 + aro + borda / 2}" width="{w - 2 * aro - borda}" '
                f'height="{h - 2 * aro - borda}" rx="{rx * 0.6}" fill="none" stroke="{NAVY}" stroke-width="{borda * 0.5}"/>')
    iw, ih = w - 2 * aro, h - 2 * aro
    largura = math.hypot(w, h) / 4
    faixas = "".join(f'<rect x="{-2 * largura + i * largura:.1f}" y="{-h}" width="{largura + 0.5:.1f}" height="{2 * h}" fill="{HOLO[i]}"/>'
                     for i in range(4))
    reflexo = (f'<rect x="{largura * 0.55:.1f}" y="{-h}" width="{w * 0.07:.1f}" height="{2 * h}" fill="#fff" opacity=".6"/>'
               f'<rect x="{largura * 0.55 + w * 0.12:.1f}" y="{-h}" width="{w * 0.025:.1f}" height="{2 * h}" fill="#fff" opacity=".6"/>')
    return (f'<clipPath id="{c}"><rect x="{-iw / 2}" y="{-ih / 2}" width="{iw}" height="{ih}" rx="{rx * 0.55}"/></clipPath>'
            f'<rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="{rx}" fill="{OURO}" stroke="{NAVY}" stroke-width="{borda}"/>'
            # filete claro em cima/esquerda da borda (metal), chapado
            f'<path d="M{-w / 2 + borda * 0.4} {h * 0.25}V{-h / 2 + rx}q0 {-rx + borda * 0.4} {rx - borda * 0.4} {-rx + borda * 0.4}H{w * 0.25}" '
            f'fill="none" stroke="{OURO_C}" stroke-width="{aro * 0.45}" stroke-linecap="round" transform="translate({aro * 0.35} {aro * 0.35})"/>'
            f'<g clip-path="url(#{c})"><g transform="rotate(40)">{faixas}{reflexo}</g></g>'
            f'<rect x="{-iw / 2}" y="{-ih / 2}" width="{iw}" height="{ih}" rx="{rx * 0.55}" fill="none" stroke="{OURO_X}" stroke-width="{borda * 0.45}"/>')


def peca(estilo, cor=None):
    """Carta + bola, centrada na origem, em unidades de uma carta 150x210."""
    w, h = 150, 210
    borda = {"vetor": 7, "adesivo": 8, "minimo": 10}[estilo]
    if cor:  # uma cor só: carta em silhueta com a bola vazada por máscara
        m = uid("m")
        R = 52
        return (f'<mask id="{m}"><rect x="-200" y="-200" width="400" height="400" fill="#fff"/>'
                f'<g transform="translate(0 0)"><circle r="{R + 8}" fill="#000"/>'
                f'{bola(R, 9, cor="#fff")}</g></mask>'
                f'<rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="{w * 0.1}" fill="{cor}" mask="url(#{m})"/>')
    R = {"vetor": 54, "adesivo": 56, "minimo": 56}[estilo]
    return (carta(w, h, borda, estilo)
            + f'<g>{bola(R, borda * 0.85, sombra=estilo != "minimo")}</g>')


def raios(cx, cy, n, comp, larg, opac=".1"):
    return "".join(
        f'<polygon points="{cx},{cy} {cx + math.cos(a - larg) * comp:.0f},{cy + math.sin(a - larg) * comp:.0f} '
        f'{cx + math.cos(a + larg) * comp:.0f},{cy + math.sin(a + larg) * comp:.0f}" fill="#fff" opacity="{opac}"/>'
        for a in [k * 2 * math.pi / n for k in range(n)])


def svg(nome, w, h, corpo, defs=""):
    os.makedirs(SAIDA, exist_ok=True)
    caminho = os.path.join(SAIDA, nome + ".svg")
    with open(caminho, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{corpo}</svg>\n')
    return caminho


def defs(estilo, escala=1.0, fechar=0):
    return (DEFS.replace("{r}", f"{(9 if estilo == 'adesivo' else 0) * escala:.1f}").replace("{s}", f"{6 * escala:.1f}")
            .replace("{f}", f"{fechar}"))


def icone(estilo, nome, pequeno=False, fundo=True, cor=None):
    """Quadrado 256 (renderizado em 1024/48/32/16). pequeno: menos raios e carta maior."""
    giro = -8
    esc = 0.98 if pequeno else 0.92
    if estilo == "adesivo":
        esc -= 0.06
    p = peca(estilo, cor)
    filtro = ' filter="url(#adesivo)"' if estilo == "adesivo" else ""
    sombra = ("" if estilo in ("adesivo", "minimo") or cor else
              f'<g transform="translate(136 142) rotate({giro}) scale({esc})"><rect x="-75" y="-105" width="150" height="210" rx="15" fill="#04060f" opacity=".45"/></g>')
    corpo = ""
    if fundo:
        corpo = (f'<rect width="256" height="256" rx="48" fill="url(#noite)"/>'
                 f'<clipPath id="cantos"><rect width="256" height="256" rx="48"/></clipPath>'
                 f'<g clip-path="url(#cantos)">{raios(128, 128, 8 if pequeno else 16, 260, .2 if pequeno else .09)}</g>')
    corpo += f'{sombra}<g transform="translate(128 130) rotate({giro}) scale({esc})"{filtro}>{p}</g>'
    return svg(nome, 256, 256, corpo, defs(estilo))


# ---------------- nome horizontal (letras do logo atual) ----------------
def letra_3d(ch, esc, profundidade=7, passo=2.2):
    d = ESQ[ch]
    est = 'fill="none" stroke-linejoin="round" stroke-linecap="round"'
    out = "".join(f'<path d="{d}" {est} stroke="{AZUL if k < profundidade else NAVY}" stroke-width="{TRACO + 1.6}" '
                  f'transform="translate(0 {k * passo / esc:.3f})"/>' for k in range(profundidade, 0, -1))
    out += f'<path d="{d}" {est} stroke="{NAVY}" stroke-width="{TRACO + 1.6}"/>'
    out += f'<path d="{d}" {est} stroke="url(#ouro)" stroke-width="{TRACO}"/>'
    out += f'<path d="{d}" {est} stroke="#fff6c9" stroke-width="{TRACO * 0.22}" opacity=".8" transform="translate(-.25 -.38)"/>'
    return out


def letra_branca(ch):
    d = ESQ[ch]
    est = 'fill="none" stroke-linejoin="round" stroke-linecap="round"'
    return (f'<path d="{d}" {est} stroke="{NAVY}" stroke-width="{TRACO + 1.6}"/>'
            f'<path d="{d}" {est} stroke="{BRANCO}" stroke-width="{TRACO}"/>')


def horizontal(estilo, nome, fundo=True, cor=None):
    W, H, u, cy = 1600, 600, 23, 300
    x0 = 800 - (8 * 6.9 + 6) * u / 2
    corpo = ""
    for i, l in enumerate("SOCCERMON"):
        x = x0 + i * 6.9 * u
        if i == 1:
            corpo += f'<g transform="translate({x + 3 * u:.0f} {cy}) rotate(-6) scale({u / 21 * 1.02:.3f})">{peca(estilo, cor)}</g>'
            continue
        if cor:
            corpo += (f'<g transform="translate({x:.0f} {cy - 4 * u:.0f}) scale({u})"><path d="{ESQ[l]}" fill="none" '
                      f'stroke-linejoin="round" stroke-linecap="round" stroke="{cor}" stroke-width="{TRACO}"/></g>')
            continue
        g = letra_branca(l) if i < 4 else letra_3d(l, u)
        corpo += f'<g transform="translate({x:.0f} {cy - 4 * u:.0f}) scale({u})">{g}</g>'
    if estilo == "adesivo":
        corpo = f'<g filter="url(#adesivo)">{corpo}</g>'
    if fundo:
        corpo = (f'<rect width="{W}" height="{H}" fill="url(#noite)"/>{raios(800, cy, 28, 1200, .05, ".09")}' + corpo)
    return svg(nome, W, H, corpo, defs(estilo, 1.2, fechar=48))


# ---------------- 16 px à mão (mínimo) ----------------
P16 = [  # . vazio  k azul-noite  o ouro  w branco  z sombra da bola  g botão. Em 16 px os pentágonos viram cara
    "................",  # (dois olhos e boca), então aqui a bola é só faixa + botão dourado + sombra
    "...kkkkkkkkkk...",
    "..kooooooooook..",
    "..kooooooooook..",
    "..koookkkkoook..",
    "..kookwwwwkook..",
    "..kokwwwwwwkok..",
    "..kokkkggkkkok..",
    "..kokkkggkkkok..",
    "..kokwwwwwzkok..",
    "..kookwwzzkook..",
    "..koookkkkoook..",
    "..kooooooooook..",
    "..kooooooooook..",
    "...kkkkkkkkkk...",
    "................",
]


def minimo_16(nome, fundo=True, holo=False):
    """16x16 desenhado pixel a pixel: carta dourada em pé e a bola com faixa e botão (holo=True: miolo arco-íris)."""
    cores = {"k": NAVY, "o": OURO, "w": BRANCO, "z": "#aab6d8", "g": OURO_C}
    t = Tela(16, 16)
    if fundo:
        for y in range(16):
            for x in range(16):
                canto = (x in (0, 15) and y in (0, 15))
                if not canto:
                    t.px[(x, y)] = "#1b2652" if math.hypot(x - 7.5, y - 7.5) < 6 else "#0d132c"
    for y, lin in enumerate(P16):
        for x, ch in enumerate(lin):
            if ch != ".":
                c = cores[ch]
                if holo and ch == "o" and 4 <= x <= 11 and 3 <= y <= 12:
                    c = HOLO[((x + y - 7) // 4) % 4]
                t.px[(x, y)] = c
    with open(os.path.join(SAIDA, nome + ".png"), "wb") as f:
        f.write(t.png(1))


def main():
    for est, pref in (("vetor", "1-vetor"), ("adesivo", "3-adesivo"), ("minimo", "4-minimo")):
        a = icone(est, f"{pref}-icone")
        b = icone(est, f"{pref}-icone-pequeno", pequeno=True)
        c = icone(est, f"{pref}-simbolo", fundo=False)
        d = horizontal(est, f"{pref}-horizontal")
        e = horizontal(est, f"{pref}-horizontal-transparente", fundo=False)
        PEDIDOS.extend([(a, f"{pref}-icone-1024.png", 1024, 1024), (b, f"{pref}-icone-48.png", 48, 48),
                        (b, f"{pref}-icone-32.png", 32, 32),
                        (c, f"{pref}-simbolo-1024.png", 1024, 1024),
                        (d, f"{pref}-horizontal.png", 1920, 720), (e, f"{pref}-horizontal-transparente.png", 1920, 720)])
    # uma cor só (marca d'água / favicon monocromático)
    for cor, sufixo in (("#ffffff", "branco"), (NAVY, "azul")):
        s = icone("minimo", f"4-minimo-1cor-{sufixo}", fundo=False, cor=cor)
        hz = horizontal("minimo", f"4-minimo-1cor-{sufixo}-horizontal", fundo=False, cor=cor)
        PEDIDOS.extend([(s, f"4-minimo-1cor-{sufixo}-1024.png", 1024, 1024), (s, f"4-minimo-1cor-{sufixo}-32.png", 32, 32),
                        (hz, f"4-minimo-1cor-{sufixo}-horizontal.png", 1920, 720)])
    minimo_16("4-minimo-icone-16")
    minimo_16("2-pixel-icone-16", holo=True)  # sobrescreve o 16 do pixel.py: em 16 px só à mão fica bom
    with open(os.path.join(SAIDA, "pedidos.json"), "w") as f:
        json.dump([[os.path.relpath(a, SAIDA), b, w, h] for a, b, w, h in PEDIDOS], f)
    print("ok:", len(PEDIDOS), "PNG pra renderizar (node render.mjs)")


if __name__ == "__main__":
    main()
