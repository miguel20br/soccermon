"""Analisa a faixa do trailer: BPM (autocorrelação do envelope de ataques) e energia a cada segundo."""
import array, math, subprocess, sys
f = sys.argv[1]
SR = 11025
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
x = array.array("h", raw)
H = 256  # ~23 ms
rms = [math.sqrt(sum(v * v for v in x[i:i + H]) / H) for i in range(0, len(x) - H, H)]
fps = SR / H
on = [max(0.0, rms[i] - rms[i - 1]) for i in range(1, len(rms))]  # envelope de ataques
# BPM: autocorrelação entre 70 e 190 BPM, num trecho central
seg = on[int(30 * fps):int(150 * fps)]
best = (0, 0)
for bpm10 in range(700, 1901, 5):
    lag = fps * 60 / (bpm10 / 10)
    l = int(round(lag))
    c = sum(seg[i] * seg[i + l] for i in range(len(seg) - l))
    best = max(best, (c, bpm10 / 10))
print(f"BPM ~ {best[1]}")
# energia por segundo (0-100)
por_s = [sum(rms[int(s * fps):int((s + 1) * fps)]) / fps for s in range(int(len(rms) / fps))]
mx = max(por_s)
linha = ""
for s, e in enumerate(por_s):
    if s % 60 == 0:
        print(linha)
        linha = f"{s // 60}:{s % 60:02d} "
    linha += " ▁▂▃▄▅▆▇█"[min(8, int(e / mx * 8.99))]
print(linha)
# maiores saltos de energia (entradas/drops), comparando 4 s depois vs 4 s antes
saltos = sorted(((sum(por_s[s:s + 4]) - sum(por_s[s - 4:s]), s) for s in range(4, len(por_s) - 4)), reverse=True)
vistos = []
for d, s in saltos:
    if all(abs(s - v) > 10 for v in vistos):
        vistos.append(s)
    if len(vistos) == 6:
        break
print("maiores entradas de energia em:", ", ".join(f"{v // 60}:{v % 60:02d}" for v in sorted(vistos)))
