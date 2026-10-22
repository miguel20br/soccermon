#!/usr/bin/env bash
# Curtas: do render do HyperFrames pro arquivo de postar. Áudio em −14 LUFS (mede, aplica o ganho que falta e um
# limitador em −1 dBFS pros picos; o loudnorm linear parava em −14,4 travado no pico; o vídeo é copiado) e a cópia -celular de até 10 MB pra subir pela extensão do Chrome (x264 em 2 passes, ~1,45 Mbps
# ou menos se o vídeo for longo; áudio AAC 128k).
#   trailer/curtas/finalizar.sh <render.mp4> <saida-sem-extensao>      (pela fila: scripts/pesado.sh na frente)
set -euo pipefail
IN=${1:?render}; OUT=${2:?saida}
mkdir -p "$(dirname "$OUT")"
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\(.*\) LUFS/\1/p' | tail -1; }
ganho=$(awk -v i="$(lufs "$IN")" 'BEGIN { print -14 - i }')
ffmpeg -v error -y -i "$IN" -c:v copy -af "volume=${ganho}dB,alimiter=limit=0.891:level=false,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "$OUT.mp4"
# celular: bitrate pra caber em 9 MiB (o limite da extensão é 10 MB), no máximo 1450k
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
kb=$(awk -v d="$dur" 'BEGIN { k = int(9 * 8 * 1024 / d - 128); print (k > 1450 ? 1450 : k) }')
P=$(mktemp -d)
ffmpeg -v error -y -i "$OUT.mp4" -c:v libx264 -preset slow -b:v "${kb}k" -pass 1 -passlogfile "$P/x" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$OUT.mp4" -c:v libx264 -preset slow -b:v "${kb}k" -pass 2 -passlogfile "$P/x" -c:a aac -b:a 128k -movflags +faststart "$OUT-celular.mp4"
rm -rf "${P:?}"
for f in "$OUT.mp4" "$OUT-celular.mp4"; do
  echo "$(basename "$f"): $(du -h "$f" | cut -f1), $(lufs "$f") LUFS, vídeo ${kb}k no -celular"
done
