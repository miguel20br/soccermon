#!/usr/bin/env bash
# Curtas: do render do HyperFrames pro arquivo de postar. Áudio em −14 LUFS (loudnorm em 2 passadas, ganho linear;
# o vídeo é copiado) e a cópia -celular de até 10 MB pra subir pela extensão do Chrome (x264 em 2 passes, ~1,45 Mbps
# ou menos se o vídeo for longo; áudio AAC 128k).
#   trailer/curtas/finalizar.sh <render.mp4> <saida-sem-extensao>      (pela fila: scripts/pesado.sh na frente)
set -euo pipefail
IN=${1:?render}; OUT=${2:?saida}
mkdir -p "$(dirname "$OUT")"
med=$(ffmpeg -hide_banner -i "$IN" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$med" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true"
ffmpeg -v error -y -i "$IN" -c:v copy -af "$LN,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "$OUT.mp4"
# celular: bitrate pra caber em 9,5 MB, no máximo 1450k
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
kb=$(awk -v d="$dur" 'BEGIN { k = int(9.5 * 8 * 1024 / d - 128); print (k > 1450 ? 1450 : k) }')
P=$(mktemp -d)
ffmpeg -v error -y -i "$OUT.mp4" -c:v libx264 -preset slow -b:v "${kb}k" -pass 1 -passlogfile "$P/x" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$OUT.mp4" -c:v libx264 -preset slow -b:v "${kb}k" -pass 2 -passlogfile "$P/x" -c:a aac -b:a 128k -movflags +faststart "$OUT-celular.mp4"
rm -rf "${P:?}"
for f in "$OUT.mp4" "$OUT-celular.mp4"; do
  lufs=$(ffmpeg -hide_banner -i "$f" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\(.*\) LUFS/\1/p' | tail -1)
  echo "$(basename "$f"): $(du -h "$f" | cut -f1), ${lufs} LUFS, vídeo ${kb}k no -celular"
done
