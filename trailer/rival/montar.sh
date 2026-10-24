#!/usr/bin/env bash
# Curta "O rival evoluiu": da cena e da partitura pro arquivo de postar. Pela fila pesada, da raiz do worktree:
#   scripts/pesado.sh trailer/rival/montar.sh        (depois do preparar.sh)
# 1) música (scripts/musica/pecas/curta-rival.mjs) + o grito do Dragonite na revelação (um pouco mais grave) + o "uuh"
#    da torcida no gol do rival; 2) a cena no HyperFrames (sem áudio); 3) áudio a −14 LUFS com limitador; 4) o vídeo
#    (crf 16) e a cópia de até 10 MB (2 passes, ~1,45 Mbps, pra extensão do Chrome); 5) capa e folha de contato.
set -euo pipefail
cd "$(dirname "$0")/../.."
TMP=${TMP_RIVAL:-$HOME/.cache/soccermon-tmp/curta-rival/montar}
OUT=${OUT_RIVAL:-$HOME/Vídeos/soccermon-postar/4-rival-evoluiu}
HF=${HYPERFRAMES:-$(ls -d "$HOME"/.npm/_npx/*/node_modules/hyperframes/bin/hyperframes.mjs | tail -1)}
FIM=17.9
mkdir -p "$TMP" "$(dirname "$OUT")"

node scripts/musica/render.mjs curta-rival --so-wav --out "$TMP"
S=public/assets
REV=5660; GOL=11300
FC="[1:a]aresample=44100,asetrate=44100*0.9,aresample=44100,volume=0.55,adelay=$REV|$REV[g];\
[2:a]aresample=44100,atrim=0:2.4,afade=t=out:st=1.4:d=1,volume=0.45,adelay=$GOL|$GOL[uh];\
[0:a]aresample=44100[m];[m][g][uh]amix=inputs=3:normalize=0,atrim=0:$FIM,afade=t=out:st=$(awk -v f=$FIM 'BEGIN{print f-0.8}'):d=0.8[a]"
ffmpeg -v error -y -i "$TMP/curta-rival.wav" -i $S/cries/latest/149.ogg -i $S/sfx/torcida-uuh-1.mp3 \
  -filter_complex "$FC" -map "[a]" -ar 48000 "$TMP/mix.wav"

[ -n "${PULA_CENA:-}" ] || HYPERFRAMES_RENDER_DETACHED=1 node "$HF" render trailer/rival -o "$TMP/cena.mp4" -q high -w 1 --quiet

lufs() { ffmpeg -hide_banner -i "$1" -af ebur128=peak=true -f null - 2>&1 | sed -n 's/^ *I: *\(.*\) LUFS/\1/p' | tail -1; }
cp "$TMP/mix.wav" "$TMP/audio.wav"
for _ in 1 2 3; do
  g=$(awk -v i="$(lufs "$TMP/audio.wav")" 'BEGIN { print -14 - i }')
  ffmpeg -v error -y -i "$TMP/audio.wav" -af "volume=${g}dB,alimiter=limit=0.76:level=false:attack=1:release=80" "$TMP/a1.wav"
  mv "$TMP/a1.wav" "$TMP/audio.wav"
done

ffmpeg -v error -y -i "$TMP/cena.mp4" -i "$TMP/audio.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -t $FIM -movflags +faststart "$OUT.mp4"
P=$(mktemp -d)
ffmpeg -v error -y -i "$TMP/cena.mp4" -c:v libx264 -preset slow -b:v 1450k -pix_fmt yuv420p -pass 1 -passlogfile "$P/x" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$TMP/cena.mp4" -i "$TMP/audio.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 1450k -pix_fmt yuv420p \
  -pass 2 -passlogfile "$P/x" -c:a aac -b:a 192k -t $FIM -movflags +faststart "$OUT-10mb.mp4"
rm -rf "${P:?}"

# capa: o Dragonite recém-evoluído com a faixa grande "DRAGONAIR EVOLUIU!"
ffmpeg -v error -y -ss 6.6 -i "$TMP/cena.mp4" -frames:v 1 "$OUT-capa.png"
ffmpeg -v error -y -i "$OUT.mp4" -vf "fps=2,scale=180:-1,drawtext=fontfile=/usr/share/fonts/TTF/DejaVuSans.ttf:text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,drawbox=x=89:y=0:w=2:h=ih:color=red,tile=12x4" -frames:v 1 "$TMP/folha.png"
for f in "$OUT.mp4" "$OUT-10mb.mp4"; do
  echo "$f: $(du -h "$f" | cut -f1), $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f") s, $(lufs "$f") LUFS"
done
