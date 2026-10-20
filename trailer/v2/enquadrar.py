"""Recorta um trecho de quadros do trailer-capture.mjs na proporção da faixa do jogo (1080x860, ou --tamanho 1920x1080
pro 16:9), seguindo a bola.

    python3 trailer/v2/enquadrar.py <pasta> <1º quadro> <n quadros> <saida.mp4> [--zoom 1.0] [--gol 0.95] [--rapido 1]

A posição da bola em cada quadro vem do quadros.json da pasta (bx, by de 0 a 1 no quadro). O centro do recorte vai
atrás da bola com suavização e nunca sai do quadro. --gol X puxa o centro pro gol (X de 0 a 1 na largura), meio a
meio com a bola, pra o gol e o lance caberem juntos. --rapido N acelera N vezes (pula quadros).
"""
import argparse, json, os, subprocess, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("pasta"); ap.add_argument("ini", type=int); ap.add_argument("n", type=int); ap.add_argument("saida")
ap.add_argument("--zoom", type=float, default=1.0)
ap.add_argument("--gol", type=float, default=None)
ap.add_argument("--suave", type=float, default=0.18)
ap.add_argument("--rapido", type=int, default=1)
ap.add_argument("--tamanho", default="1080x860", help="tamanho da saída (a proporção do recorte vem dele)")
a = ap.parse_args()

meta = json.load(open(os.path.join(a.pasta, "quadros.json")))["meta"]
probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0",
                        os.path.join(a.pasta, f"{a.ini:05d}.png")], capture_output=True, text=True).stdout.strip()
W, H = map(int, probe.split(","))
OW, OH = map(int, a.tamanho.split("x"))
A = OW / OH
h = H / a.zoom
w = min(W, h * A)
h = w / A
quadros = list(range(a.ini, a.ini + a.n * a.rapido, a.rapido))
cx = cy = None
cmds = []
lista = []
for k, q in enumerate(quadros):
    m = meta[min(q, len(meta)) - 1]
    tx, ty = m["bx"] * W, m["by"] * H
    if a.gol is not None:
        tx = (tx + a.gol * W) / 2
    if cx is None:
        cx, cy = tx, ty
    cx += (tx - cx) * a.suave
    cy += (ty - cy) * a.suave
    x = min(max(cx - w / 2, 0), W - w)
    y = min(max(cy - h / 2, 0), H - h)
    cmds.append(f"{k / 30:.4f} crop x {x:.1f}, crop y {y:.1f};")
    lista.append(f"file '{os.path.abspath(os.path.join(a.pasta, f'{q:05d}.png'))}'\nduration {1 / 30:.6f}")
tmp = tempfile.mkdtemp()
open(os.path.join(tmp, "cmds.txt"), "w").write("\n".join(cmds))
open(os.path.join(tmp, "lista.txt"), "w").write("\n".join(lista) + "\n")
x0, y0 = cmds[0].split("x ")[1].split(",")[0], cmds[0].split("y ")[1].rstrip(";")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "lista.txt"),
                "-vf", f"sendcmd=f={os.path.join(tmp, 'cmds.txt')},crop=w={w:.0f}:h={h:.0f}:x={x0}:y={y0},"
                       f"scale={OW}:{OH}:flags=neighbor,fps=30,format=yuv420p",
                "-frames:v", str(len(quadros)), "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-an", a.saida], check=True)
print(a.saida, f"{len(quadros)} quadros, recorte {w:.0f}x{h:.0f} de {W}x{H}")
