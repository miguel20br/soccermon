"""Acha a fase da grade de batidas (onde cai a 1ª batida) nos primeiros 30 s, dado o BPM."""
import array, math, subprocess, sys
f, bpm = sys.argv[1], float(sys.argv[2])
SR, H = 11025, 64  # ~5.8 ms
raw = subprocess.run(["ffmpeg", "-v", "error", "-t", "32", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
x = array.array("h", raw)
rms = [math.sqrt(sum(v * v for v in x[i:i + H]) / H) for i in range(0, len(x) - H, H)]
fps = SR / H
on = [max(0.0, rms[i] - rms[i - 1]) for i in range(1, len(rms))]
per = fps * 60 / bpm
melhor = max(((sum(on[int(round(k * per + p))] for k in range(int((len(on) - p) / per))), p) for p in [i * 0.5 for i in range(int(per * 2))]))
fase = melhor[1] / fps
print(f"1ª batida da grade em ~{fase:.3f} s (batida = {60 / bpm:.3f} s, compasso = {240 / bpm:.3f} s)")
# primeiro ataque forte de verdade (início do som)
lim = max(on) * 0.35
ini = next(i for i, v in enumerate(on) if v > lim) / fps
print(f"primeiro ataque forte em ~{ini:.3f} s")
