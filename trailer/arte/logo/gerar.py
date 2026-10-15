"""Conceitos de logo do Soccermon (skill logo-design, fase 4: preto primeiro). Versão 2.

Letras construídas por esqueleto (nenhuma fonte de terceiros): cada letra é uma linha numa grade 6x8 desenhada com
traço grosso; o estilo das juntas muda a voz da letra. O primeiro O de SOCCERMON vira a bola.
A: "Bolha"  — juntas e pontas redondas: gordas, divertidas, de brinquedo/colecionável.
B: "Chute"  — juntas chanfradas e itálico 15°: número de camisa, velocidade. Símbolo: bola com rastro.
C: "Escudo" — brasão de clube com a bola; o nome nas letras do B, retas.

    python3 trailer/arte/logo/gerar.py   (escreve os SVGs ao lado deste arquivo)
"""
import math
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
TRACO = 2.3  # espessura do traço em unidades da grade (a caixa da letra tem 6x8)

# esqueletos na grade (o traço tem TRACO de espessura, então as bordas ficam ~0..6 x 0..8)
ESQ = {
    "S": "M5 1.15H1.15V4H4.85V6.85H1",
    "C": "M5 1.15H1.15V6.85H5",
    "E": "M5 1.15H1.15V6.85H5M1.15 4H4.2",
    "R": "M1.15 7V1.15H4.85V4H1.15M3.3 4L5 7",
    "M": "M1.15 7V1.15L3 4L4.85 1.15V7",
    "N": "M1.15 7V1.15L4.85 6.85V1",
    "O": "M1.15 1.15H4.85V6.85H1.15Z",
}
AVANCO = 6.9  # largura da letra + espaço


def bola(cx, cy, r, sw):
    """Bola de futsal: anel + pentágono (preto sobre branco). O anel é mais fino que o traço das letras (senão vira
    pneu) e o pentágono ocupa metade do raio, pra ler como bola até em tamanho pequeno."""
    sw = sw * 0.62
    pent = " ".join(
        f"{cx + math.cos(-math.pi / 2 + i * 2 * math.pi / 5) * r * 0.5:.2f},"
        f"{cy + math.sin(-math.pi / 2 + i * 2 * math.pi / 5) * r * 0.5:.2f}"
        for i in range(5)
    )
    return (
        # anel preenchido (dois círculos com furo, sem stroke: a caixa da arte fica exata)
        f'<path fill="#000" fill-rule="evenodd" d="M{cx - r:.2f} {cy:.2f}a{r:.2f} {r:.2f} 0 1 0 {2 * r:.2f} 0a{r:.2f} {r:.2f} 0 1 0 {-2 * r:.2f} 0z'
        f'M{cx - r + sw:.2f} {cy:.2f}a{r - sw:.2f} {r - sw:.2f} 0 1 0 {2 * (r - sw):.2f} 0a{r - sw:.2f} {r - sw:.2f} 0 1 0 {-2 * (r - sw):.2f} 0z"/>'
        f'<polygon fill="#000" points="{pent}"/>'
    )


def palavra(estilo, com_bola=True):
    """Grupo SVG da palavra em unidades da grade; devolve (svg, largura)."""
    juntas = {"bolha": 'stroke-linejoin="round" stroke-linecap="round"', "chute": 'stroke-linejoin="bevel" stroke-linecap="butt"'}[estilo]
    partes, x, usou = [], 0.0, False
    for ch in "SOCCERMON":
        if ch == "O" and com_bola and not usou:
            usou = True
            partes.append(("bola", bola(x + 3, 4, 3.75, TRACO)))
        else:
            partes.append(("letra", f'<path transform="translate({x:.2f} 0)" d="{ESQ[ch]}"/>'))
        x += AVANCO
    letras = "".join(p for tipo, p in partes if tipo == "letra")
    bolas = "".join(p for tipo, p in partes if tipo == "bola")
    corpo = f'<g fill="none" stroke="#000" stroke-width="{TRACO}" {juntas}>{letras}</g>{bolas}'
    return corpo, x - (AVANCO - 6)


def svg(w, h, corpo):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}">{corpo}</svg>\n'


def salvar(nome, conteudo):
    with open(os.path.join(AQUI, nome), "w") as f:
        f.write(conteudo)


ESCALA = 256 / 8 * 0.6  # px por unidade nos lockups (altura útil ~150 de 256)

# ---------- A: Bolha ----------
g, larg = palavra("bolha")
pad = 1.2
salvar("a-lockup.svg", svg((larg + 2 * pad) * ESCALA, (8 + 2 * pad) * ESCALA,
       f'<g transform="scale({ESCALA}) translate({pad} {pad})">{g}</g>'))
# símbolo: a bola gorda (mesmo traço da palavra)
salvar("a-symbol.svg", svg(256, 256, f'<g transform="translate(128 128) scale(23)">{bola(0, 0, 4, TRACO)}</g>'))

# ---------- B: Chute ----------
g, larg = palavra("chute")
skew = math.tan(math.radians(15))
salvar("b-lockup.svg", svg((larg + 2 * pad + 8 * skew) * ESCALA, (8 + 2 * pad) * ESCALA,
       f'<g transform="scale({ESCALA}) translate({pad + 8 * skew} {pad}) skewX(-15)">{g}</g>'))
# símbolo: bola com três riscos de velocidade atrás, em itálico
riscos = "".join(
    f'<rect x="{-4.2 - L:.2f}" y="{dy - 0.5:.2f}" width="{L:.2f}" height="1" fill="#000"/>'
    for dy, L in ((-2.2, 2.2), (0, 3.4), (2.2, 2.2))
)
salvar("b-symbol.svg", svg(256, 256,
       f'<g transform="translate(158 128) scale(17) skewX(-15)">{bola(0, 0, 4, TRACO)}{riscos}</g>'))


# ---------- C: Escudo ----------
def escudo(x, y, w, h):
    return (f"M{x} {y + h * 0.08}Q{x + w / 2} {y - h * 0.05} {x + w} {y + h * 0.08}"
            f"V{y + h * 0.58}Q{x + w} {y + h * 0.86} {x + w / 2} {y + h}"
            f"Q{x} {y + h * 0.86} {x} {y + h * 0.58}Z")


def simbolo_c(ox, oy, k):
    w, h = 200 * k, 236 * k
    d = escudo(ox, oy, w, h) + escudo(ox + 18 * k, oy + 18 * k, w - 36 * k, h - 38 * k)
    estrelas = "".join(
        f'<rect x="{ox + w / 2 + dx * k - 8 * k:.1f}" y="{oy + 34 * k:.1f}" width="{16 * k:.1f}" height="{16 * k:.1f}" '
        f'transform="rotate(45 {ox + w / 2 + dx * k:.1f} {oy + 42 * k:.1f})" fill="#000"/>'
        for dx in (-36, 0, 36)
    )
    return (f'<path fill="#000" fill-rule="evenodd" d="{d}"/>{estrelas}'
            f'<g transform="translate({ox + w / 2:.1f} {oy + h * 0.52:.1f}) scale({15 * k:.2f})">{bola(0, 0, 4, TRACO)}</g>')


salvar("c-symbol.svg", svg(256, 256, simbolo_c(28, 10, 1)))
g, larg = palavra("chute", com_bola=False)
k = 0.82
s = 13.5  # px por unidade da palavra embaixo do brasão
total = max(larg * s, 200 * k)
corpo = (simbolo_c((total - 200 * k) / 2 + 24, 18, k)
         + f'<g transform="translate({(total - larg * s) / 2 + 24:.1f} {18 + 236 * k + 24:.1f}) scale({s})">{g}</g>')
salvar("c-lockup.svg", svg(total + 48, 18 + 236 * k + 24 + 8 * s + 18, corpo))
print("ok: a/b/c symbol + lockup (v2)")
