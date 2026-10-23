#!/usr/bin/env bash
# Vídeo da 0.9.16 (Charmander de capitão): da cena e da partitura pro arquivo de postar. Pela fila pesada:
#   scripts/pesado.sh trailer/video-0916/montar.sh      (da raiz do worktree, depois do preparar.mjs)
# 1) renderiza a música (scripts/musica/pecas/video-0916.mjs) e junta os sons gravados por cima: o "óóó" da torcida na
#    Cerulean, a festa no gol, e os gritos do jogo na tela de evolução (o do Charmeleon quando começa, o do Charizard
#    mais grave no impacto), como o jogo faz; 2) renderiza a cena no HyperFrames (sem áudio); 3) junta, leva o áudio a
#    −14 LUFS com limitador em −2,5 dBFS (o AAC passa um pouco: o pico real fica abaixo de −1) e codifica em 2 passes (~1,45 Mbps, cabe nos 10 MB da extensão do Chrome);
#    4) capa (o quadro da placa) e a folha de contato pro QA.
# Saída: ~/Vídeos/soccermon-postar/0916-modo-novo.mp4 e 0916-modo-novo-capa.png; rascunhos em $TMP.
set -euo pipefail
cd "$(dirname "$0")/../.."
TMP=${TMP_0916:-$HOME/.cache/soccermon-tmp/v0916/montar}
OUT=${OUT_0916:-$HOME/Vídeos/soccermon-postar/0916-modo-novo}
HF=${HYPERFRAMES:-$(ls -d "$HOME"/.npm/_npx/*/node_modules/hyperframes/bin/hyperframes.mjs | tail -1)}
FIM=31.3
mkdir -p "$TMP" "$(dirname "$OUT")"

node scripts/musica/render.mjs video-0916 --so-wav --out "$TMP"
# instantes (ms) tirados da partitura: o "óóó" (c.6, linha 8), clarão da evolução (c.8 e c.9), o gol (c.10, linha 2)
ms() { node -e "global.window={};eval(require('fs').readFileSync('trailer/video-0916/midia/som/eventos.js','utf8'));const c=window.EV.compassos;console.log(Math.round((c[$1]+(c[$1+1]-c[$1])*$2/16)*1000))"; }
UUH=$(ms 6 8); EVO=$(ms 8 0); CZ=$(ms 9 0); GOL=$(ms 10 2)
S=public/assets
FC="[1:a]atrim=0:2.2,afade=t=out:st=1.4:d=0.8,volume=0.5,adelay=$UUH|$UUH[uh];\
[2:a]atrim=0:3.4,afade=t=out:st=2.2:d=1.2,volume=0.75,adelay=$GOL|$GOL[gol];\
[3:a]atrim=0:4,afade=t=in:d=0.4,afade=t=out:st=2.6:d=1.4,volume=0.3,adelay=$((GOL+1300))|$((GOL+1300))[festa];\
[4:a]aresample=44100,volume=0.45,adelay=$EVO|$EVO[g5];\
[5:a]asetrate=44100*0.75,aresample=44100,volume=0.8,adelay=$CZ|$CZ[g6];\
[0:a]aresample=44100[m];[m][uh][gol][festa][g5][g6]amix=inputs=6:normalize=0,atrim=0:$FIM,afade=t=out:st=$(awk -v f=$FIM 'BEGIN{print f-1}'):d=1[a]"
ffmpeg -v error -y -i "$TMP/video-0916.wav" -i $S/sfx/torcida-uuh-1.mp3 -i $S/sfx/torcida-gol-1.mp3 -i $S/sfx/torcida-gol-2.mp3 \
  -i $S/cries/latest/5.ogg -i $S/cries/latest/6.ogg -filter_complex "$FC" -map "[a]" -ar 48000 "$TMP/mix.wav"

# a cena (sem áudio): qualidade alta, 30 fps (PULA_CENA=1 reaproveita a cena.mp4 de antes)
[ -n "${PULA_CENA:-}" ] || HYPERFRAMES_RENDER_DETACHED=1 node "$HF" render trailer/video-0916 -o "$TMP/cena.mp4" -q high -w 1 --quiet

# áudio a −14 LUFS: mede, aplica o ganho que falta e o limitador, 3 vezes (o limitador come um pouco a cada passada).
# Limitador em −2,4 dBFS e AAC a 192k: a 128k o AAC estourava +1 dB no ataque da final (c.7); assim o pico real fica
# abaixo de −0,5 dBFS, sem clip.
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128=peak=true -f null - 2>&1 | sed -n 's/^ *I: *\(.*\) LUFS/\1/p' | tail -1; }
cp "$TMP/mix.wav" "$TMP/audio.wav"
for _ in 1 2 3; do
  g=$(awk -v i="$(lufs "$TMP/audio.wav")" 'BEGIN { print -14 - i }')
  ffmpeg -v error -y -i "$TMP/audio.wav" -af "volume=${g}dB,alimiter=limit=0.76:level=false:attack=1:release=80" "$TMP/a1.wav"
  mv "$TMP/a1.wav" "$TMP/audio.wav"
done

# 2 passes, ~1,45 Mbps de vídeo + AAC 192k
P=$(mktemp -d)
ffmpeg -v error -y -i "$TMP/cena.mp4" -c:v libx264 -preset slow -b:v 1450k -pix_fmt yuv420p -pass 1 -passlogfile "$P/x" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$TMP/cena.mp4" -i "$TMP/audio.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 1450k -pix_fmt yuv420p \
  -pass 2 -passlogfile "$P/x" -c:a aac -b:a 192k -t $FIM -movflags +faststart "$OUT.mp4"
rm -rf "${P:?}"

# capa: o quadro da placa inteira ("CHARMANDER DE CAPITÃO?"), do render em qualidade alta
ffmpeg -v error -y -ss 7.35 -i "$TMP/cena.mp4" -frames:v 1 "$OUT-capa.png"
# folha de contato: 2 quadros/s com a hora e a linha vermelha no centro
ffmpeg -v error -y -i "$OUT.mp4" -vf "fps=2,scale=180:-1,drawtext=fontfile=/usr/share/fonts/TTF/DejaVuSans.ttf:text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,drawbox=x=89:y=0:w=2:h=ih:color=red,tile=12x6" -frames:v 1 "$TMP/folha.png"
echo "$OUT.mp4: $(du -h "$OUT.mp4" | cut -f1), $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT.mp4") s"
ffmpeg -hide_banner -i "$OUT.mp4" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | tr -s ' ' | tr '\n' ' '; echo
