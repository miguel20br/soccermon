#!/usr/bin/env bash
# Monta o rascunho do trailer do Time Ultimate (9:16, 1080x1920, 30 fps) a partir da mídia do capturar.mjs, do
# walkout-capture.mjs e das cartelas.mjs. Música provisória: Abertura com gancho (136 BPM, compasso 1,7647 s).
#   trailer/curtas/ut-trailer/montar.sh <pasta-da-midia> <saida.mp4>
# Linha do tempo (roteiro-v1.md): A pacote 2,4 s · B walkout 10,4 s · C mesa 2 compassos · D explicação 6 compassos ·
# E cartela final 3 compassos.
set -euo pipefail
M="${1:?pasta da mídia}"
OUT="${2:?saída .mp4}"
MUS="$(dirname "$0")/../../../public/music/abertura-gancho.mp3"
C=1.764706   # 1 compasso
B=0.441176   # 1 tempo
C2=3.529412  # 2 compassos
lista="$(mktemp --suffix=.txt)"
trap 'rm -f "$lista"' EXIT
# D e E: cartelas paradas, trocando na batida
{
  for f in metais-1:$B metais-2:$B metais-3:2.647059 \
           edicoes-1:$B edicoes-2:$B edicoes-3:$B edicoes-4:2.205882 \
           clube:$C2 final-1:$C final-2:$C final-3:$C; do
    echo "file '$M/cartela-${f%%:*}.png'"; echo "duration ${f##*:}"
  done
  echo "file '$M/cartela-final-3.png'"
} > "$lista"
V='fps=30,scale=1080:1920,setsar=1,format=yuv420p'
"$(dirname "$0")/../../../scripts/pesado.sh" ffmpeg -y -loglevel error \
  -framerate 30 -i "$M/pacote/%04d.png" \
  -i "$M/walkout-magikarp.mp4" \
  -framerate 30 -start_number 110 -i "$M/pacote/%04d.png" \
  -f concat -safe 0 -i "$lista" \
  -i "$M/cartela-leg-pacote.png" -i "$M/cartela-leg-shiny.png" \
  -i "$MUS" \
  -filter_complex "
    [0:v]trim=end_frame=72,setpts=PTS-STARTPTS,$V[a0];
    [a0][4:v]overlay=enable='lt(t,1.9)'[a];
    [1:v]trim=0:10.4,setpts=PTS-STARTPTS,$V[b];
    [2:v]setpts=PTS-STARTPTS,$V,tpad=stop_mode=clone:stop_duration=1,trim=0:$C2,setpts=PTS-STARTPTS[c0];
    [c0][5:v]overlay=enable='gte(t,0.4)'[c];
    [3:v]$V,trim=0:19.411765,setpts=PTS-STARTPTS[de];
    [a][b][c][de]concat=n=4:v=1:a=0[v];
    [6:a]atrim=0:2.4,asetpts=PTS-STARTPTS,afade=t=out:st=2.32:d=0.08[ma];
    [1:a]atrim=0:10.4,asetpts=PTS-STARTPTS,afade=t=out:st=10.1:d=0.3[wb];
    [6:a]atrim=63.529412:77.647059,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[mc];
    [6:a]atrim=88.235294:93.529412,asetpts=PTS-STARTPTS,afade=t=out:st=4.6:d=0.69[me];
    [ma][wb][mc][me]concat=n=4:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[au]" \
  -map '[v]' -map '[au]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
echo "pronto: $OUT"
