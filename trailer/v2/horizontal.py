"""Gera trailer/v2-16x9/index.html (1920x1080) a partir do trailer/v2/index.html (9:16): mesmos tempos, textos e
animações; layout próprio pro horizontal (jogo em tela cheia com os clipes recortados em 16:9, cartas lado a lado,
caixa do Game Boy larga). Rode depois de mexer no 9:16:  python3 trailer/v2/horizontal.py
Outra pasta (o teste com a Abertura):  python3 trailer/v2/horizontal.py trailer/v2-abertura trailer/v2-abertura-16x9
Mira e letreiro do golpe: posição do Charizard no clipe golpe-h.mp4 (MIRA abaixo).
"""
import os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEM, DESTINO = sys.argv[1:3] if len(sys.argv) > 2 else (AQUI, os.path.join(AQUI, "..", "v2-16x9"))
s = open(os.path.join(ORIGEM, "index.html")).read()
MIRA = (os.environ.get("MIRA_X", "905"), os.environ.get("MIRA_Y", "430"))

css = {
    "html, body { margin: 0; width: 1080px; height: 1920px;": "html, body { margin: 0; width: 1920px; height: 1080px;",
    "#root { position: relative; width: 1080px; height: 1920px;": "#root { position: relative; width: 1920px; height: 1080px;",
    ".clip { position: absolute; inset: 0; width: 1080px; height: 1920px;": ".clip { position: absolute; inset: 0; width: 1920px; height: 1080px;",
    ".legenda { position: absolute; left: 160px; width: 760px; top: 190px; height: 300px;": ".legenda { position: absolute; left: 160px; width: 1600px; top: 30px; height: 210px;",
    ".legenda.baixo { top: 1390px; height: 230px; }": ".legenda.baixo { top: 830px; height: 220px; }",
    ".jogo { position: absolute; left: 0; top: 520px; width: 1080px; height: 860px; object-fit: cover; object-position: 50% 50%;\n  box-shadow: 0 0 0 6px #0e1430, 0 20px 60px rgb(0 0 0 / 60%); }":
        ".jogo { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; object-position: 50% 50%; }",
    ".vinheta { position: absolute; left: 0; top: 520px; width: 1080px; height: 860px;": ".vinheta { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px;",
    ".caixa { position: absolute; left: 90px; width: 900px; top: 1130px; height: 470px; box-sizing: border-box; padding: 76px 70px;":
        ".caixa { position: absolute; left: 360px; width: 1200px; top: 640px; height: 380px; box-sizing: border-box; padding: 64px 80px;",
    "#bola-gb { position: absolute; width: 140px; left: 660px; top: 880px;": "#bola-gb { position: absolute; width: 120px; left: 1130px; top: 470px;",
    ".leque { position: absolute; left: 540px; top: 700px;": ".leque { position: absolute; left: 960px; top: 300px;",
    "#logo { position: absolute; left: 140px; top: 520px; width: 800px;": "#logo { position: absolute; left: 410px; top: 200px; width: 1100px;",
    ".tag { position: absolute; left: 110px; width: 860px; top: 750px;": ".tag { position: absolute; left: 160px; width: 1600px; top: 500px;",
    ".site { position: absolute; left: 110px; width: 860px; top: 890px;": ".site { position: absolute; left: 160px; width: 1600px; top: 650px;",
    ".selo { position: absolute; left: 110px; width: 860px; top: 1000px;": ".selo { position: absolute; left: 160px; width: 1600px; top: 760px;",
    ".credito { position: absolute; left: 110px; width: 860px; top: 1560px;": ".credito { position: absolute; left: 160px; width: 1600px; top: 990px;",
    "Tudo centrado em x 540 (o centro dos raios e das legendas); textos entre y 130 e 1632 (fora dos 15% de baixo).":
        "Versão 16:9 gerada por trailer/v2/horizontal.py a partir do 9:16 (não edite à mão).",
    "<title>Soccermon · trailer 2 vertical</title>": "<title>Soccermon · trailer 2 16:9</title>",
    '<meta name="viewport" content="width=1080, height=1920" />': '<meta name="viewport" content="width=1920, height=1080" />',
    'data-width="1080" data-height="1920"': 'data-width="1920" data-height="1080"',
}
for a, b in css.items():
    assert a in s, a[:50]
    s = s.replace(a, b)

# estilo em linha por id: posições do horizontal
pos = {
    "oak": "left:700px;top:60px;width:520px",
    "pika": "left:735px;top:150px;width:450px;opacity:0",
    "d1": "left:330px;top:290px;width:380px",
    "d3": "left:1210px;top:290px;width:380px",
    "d2": "left:740px;top:230px;width:440px",
    "pk1": "left:700px;top:250px;width:520px;opacity:0",
    "pk2": "left:700px;top:260px;width:520px;opacity:0",
    "ic": "left:710px;top:270px;width:500px;opacity:0",
    "e1": "left:710px;top:250px;width:500px;opacity:0",
    "e2": "left:710px;top:250px;width:500px;opacity:0",
    "e3": "left:710px;top:250px;width:500px;opacity:0",
    "e4": "left:710px;top:250px;width:500px;opacity:0",
    "placar": "left:650px;top:40px;width:620px;height:auto;z-index:30",
    "mira": f"left:{MIRA[0]}px;top:{MIRA[1]}px",
    "golpe": f"left:{int(MIRA[0]) - 360}px;top:{int(MIRA[1]) - 250}px",
    "em1": "left:520px;top:270px;width:440px",
    "em2": "left:980px;top:440px;width:380px;opacity:0",
    "dia1": "left:120px;top:330px;width:820px;opacity:0",
    "dia2": "left:980px;top:270px;width:820px;opacity:0",
    "camp": "left:640px;top:250px;width:640px;opacity:0",
    "vit": "left:430px;top:250px;width:540px;opacity:0",
    "mvp": "left:1060px;top:330px;width:400px;opacity:0",
    "pacote": "position:absolute;left:651px;top:230px;width:618px;height:864px",
    "simbolo": "left:820px;top:380px",
}
for i, st in pos.items():
    n = len(re.findall(rf'id="{i}"([^>]*?)style="[^"]*"', s))
    assert n == 1, (i, n)
    s = re.sub(rf'(id="{i}"[^>]*?)style="[^"]*"', rf'\1style="{st}"', s)

# trechos da cena da bola parada e do final com coordenadas próprias
s = s.replace('<div style="position:absolute;left:0;top:520px;width:1080px;height:860px;overflow:hidden">',
              '<div style="position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden">')
s = s.replace('transform-origin:540px 430px', 'transform-origin:960px 540px')
# a carta holo sai de dentro do pacote (atrás dele) e sobe até a altura do logo
s = s.replace('{ y: -420, scale: 1.25, rotationY: 720,', '{ y: -250, scale: 1.25, rotationY: 720,')
s = s.replace('tl.to("#oak", { x: -700,', 'tl.to("#oak", { x: -1500,')
# vídeos: as versões 16:9 dos clipes (sufixo -h)
s = re.sub(r'src="midia/([a-z-]+)\.mp4"', r'src="midia/\1-h.mp4"', s)
s = re.sub(r'<video id="([a-z-]+)"', r'<video id="\1-h"', s)
s = s.replace('impacto("#v-defesa"', 'impacto("#v-defesa-h"').replace('impacto("#v-gol"', 'impacto("#v-gol-h"')
s = s.replace('<img class="jogo" src="midia/saida-vazia.png" style="top:0;box-shadow:none"', '<img class="jogo" src="midia/saida-vazia.png" style="top:0"')
s = s.replace('<img class="jogo" id="com-times" src="midia/saida.png" style="top:0;box-shadow:none;opacity:0"', '<img class="jogo" id="com-times" src="midia/saida.png" style="top:0;opacity:0"')
open(os.path.join(DESTINO, "index.html"), "w").write(s)
print(os.path.join(DESTINO, "index.html"))
