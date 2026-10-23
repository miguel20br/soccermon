#!/usr/bin/env bash
# Animatic B da Rota de baby ("Ninguém botava fé"): quadros parados cortados no compasso da música composta.
# Pela fila pesada:  scripts/pesado.sh trailer/baby-b/montar.sh [saida.mp4]
# 1) renderiza a música (scripts/musica/pecas/video-baby-b.mjs), 2) tira os PNGs (fotografar.mjs),
# 3) monta o vídeo 1080x1920 com a torcida gravada por cima e o áudio em −14 LUFS (limitador em −1 dBFS).
set -euo pipefail
cd "$(dirname "$0")"
RAIZ=$(cd ../.. && pwd)
TMP=${TMP_BABY:-$HOME/.cache/soccermon-tmp/baby-b}
OUT=${1:-$HOME/Vídeos/soccermon-postar/previas/animatic-B-ninguem-botava-fe.mp4}
mkdir -p "$TMP/q" "$TMP/musica" "$(dirname "$OUT")"
node "$RAIZ/scripts/musica/render.mjs" video-baby-b --so-wav --out "$TMP/musica"
node fotografar.mjs "$TMP/q"
# 156 BPM: compasso = 240/156 s. Quadro → compassos: 1,1,1,1,1,2,2,2,2 (+ 1 s segurando o acorde final)
C=$(awk 'BEGIN { printf "%.6f", 240 / 156 }')
DUR=(1 1 1 1 1 2 2 2 2)
: > "$TMP/lista.txt"
for i in "${!DUR[@]}"; do
  d=$(awk -v c="$C" -v n="${DUR[$i]}" -v u="$i" 'BEGIN { printf "%.6f", c * n + (u == 8 ? 1 : 0) }')
  printf "file '%s/q/q%d.png'\nduration %s\n" "$TMP" $((i + 1)) "$d" >> "$TMP/lista.txt"
done
printf "file '%s/q/q9.png'\n" "$TMP" >> "$TMP/lista.txt"
TOTAL=$(awk -v c="$C" 'BEGIN { printf "%.3f", c * 13 + 1 }')
at() { awk -v c="$C" -v b="$1" -v r="${2:-0}" 'BEGIN { printf "%d", (c * b + c * r / 16) * 1000 }'; }
S=$RAIZ/public/assets
# torcida gravada: "óóó" na Cerulean (comp. 3, linha 8), o grito no Gyarados (comp. 5), festa baixinha no fim (comp. 11);
# o grito de verdade do Gyarados, mais grave, junto do impacto
FC="[1:a]atrim=0:2.4,afade=t=out:st=1.6:d=0.8,volume=0.55,adelay=$(at 3 8)|$(at 3 8)[uh];\
[2:a]atrim=0:3.2,afade=t=out:st=2.2:d=1,volume=0.7,adelay=$(at 5)|$(at 5)[gol];\
[3:a]atrim=0:4,afade=t=in:d=0.3,afade=t=out:st=2.8:d=1.2,volume=0.3,adelay=$(at 11)|$(at 11)[fim];\
[4:a]asetrate=44100*0.75,aresample=48000,volume=0.8,adelay=$(at 5)|$(at 5)[grito];\
[0:a]aresample=48000[m];[m][uh][gol][fim][grito]amix=inputs=5:normalize=0,atrim=0:$TOTAL,afade=t=out:st=$(awk -v t="$TOTAL" 'BEGIN{print t-0.6}'):d=0.6[a]"
ffmpeg -v error -y -i "$TMP/musica/video-baby-b.wav" -i "$S/sfx/torcida-uuh-1.mp3" -i "$S/sfx/torcida-gol-1.mp3" \
  -i "$S/sfx/torcida-gol-2.mp3" -i "$S/cries/latest/130.ogg" -filter_complex "$FC" -map "[a]" -ar 48000 "$TMP/mix.wav"
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128=peak=true -f null - 2>&1 | sed -n 's/^ *I: *\(.*\) LUFS/\1/p' | tail -1; }
ganho=$(awk -v i="$(lufs "$TMP/mix.wav")" 'BEGIN { print -14 - i }')
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/lista.txt" -i "$TMP/mix.wav" \
  -filter_complex "[0:v]fps=30,format=yuv420p[v];[1:a]volume=${ganho}dB,alimiter=limit=0.891:level=false,aresample=48000[a]" \
  -map "[v]" -map "[a]" -t "$TOTAL" -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "$OUT: $(lufs "$OUT") LUFS, $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s"
