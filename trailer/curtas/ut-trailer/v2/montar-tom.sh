#!/usr/bin/env bash
# Rascunho de tom do trailer v2 (planos 1, 2 e o começo do 3 de roteiro-v2.md), 9:16, 1080x1920, 30 fps, -14 LUFS.
# Música provisória: Abertura com gancho do começo (136 BPM, batida 0,441 s): o gancho no pacote, a pausa do compasso
# 2 no toque do Clube, a subida do compasso 3 na partida e o loop entrando (compasso 4, 7,06 s) no GOL.
#   trailer/curtas/ut-trailer/v2/montar-tom.sh <pasta-da-midia-v2> <saida.mp4>
set -euo pipefail
M="${1:?pasta da mídia}"
OUT="${2:?saída .mp4}"
R="$(cd "$(dirname "$0")/../../../.." && pwd)"
MUS="$R/public/music/abertura-gancho.mp3"
CRY="$R/public/assets/cries/latest/147.ogg"
TOR="$R/public/assets/sfx/torcida-gol-1.mp3"
V='fps=30,setsar=1,format=yuv420p'
# quadros (30 fps): A1 rasgo 31 · A2 o leque com o Dratini girando (câmera lenta de verdade) 22 · A3 aproxima no
# Dratini 26 (= 6 batidas) · B Clube 79 (do quadro 6; o toque no 12, 0,2 s depois do corte; a tela cresce devagar pra
# não ficar parada) · C partida 80 (o clarão do GOL, quadro 139 da gravação, cai no 212 = 7,06 s, o loop da música)
"$R/scripts/pesado.sh" ffmpeg -y -loglevel error \
  -framerate 30 -start_number 2 -i "$M/pacote/%04d.png" \
  -framerate 30 -start_number 34 -i "$M/pacote/%04d.png" \
  -framerate 30 -start_number 90 -i "$M/pacote/%04d.png" \
  -framerate 30 -start_number 6 -i "$M/clube/%04d.png" \
  -framerate 30 -start_number 85 -i "$M/partida-n/%05d.png" \
  -loop 1 -framerate 30 -i "$M/fundo.png" \
  -loop 1 -framerate 30 -i "$M/leg-pacote.png" \
  -loop 1 -framerate 30 -i "$M/leg-quimica.png" \
  -i "$MUS" -i "$CRY" -i "$TOR" \
  -filter_complex "
    [0:v]trim=end_frame=31,setpts=PTS-STARTPTS,$V[a1];
    [1:v]trim=end_frame=22,setpts=PTS-STARTPTS,$V[a2];
    [2:v]trim=end_frame=26,setpts=PTS-STARTPTS,scale=w='trunc(1080*(1.95+0.15*n/25)/2)*2':h='trunc(1920*(1.95+0.15*n/25)/2)*2':eval=frame:flags=lanczos,crop=1080:1920:x='541*(1.95+0.15*n/25)-540':y='873*(1.95+0.15*n/25)-960',$V[a3];
    [3:v]trim=end_frame=79,setpts=PTS-STARTPTS,scale=w='trunc(908*(1+0.1*n/78)/2)*2':h='trunc(1614*(1+0.1*n/78)/2)*2':eval=frame:flags=lanczos[b0];
    [5:v]trim=end_frame=79,setpts=PTS-STARTPTS[fb];
    [fb][b0]overlay=x='(W-w)/2':y=330,$V[b];
    [4:v]trim=end_frame=80,setpts=PTS-STARTPTS,$V[c];
    [a1][a2][a3][b][c]concat=n=5:v=1:a=0[v0];
    [v0][6:v]overlay=enable='between(n,3,45)'[v1];
    [v1][7:v]overlay=enable='between(n,100,150)',trim=end_frame=238,format=yuv420p[v];
    [8:a]atrim=0:7.94,asetpts=PTS-STARTPTS,afade=t=out:st=7.55:d=0.39[m];
    [9:a]adelay=1600|1600,volume=0.6[cr];
    [10:a]atrim=0:1.2,adelay=7060|7060,volume=0.8,afade=t=out:st=7.7:d=0.24[tc];
    [m][cr][tc]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[au]" \
  -map '[v]' -map '[au]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT.tmp.mp4"
# 2ª passada do volume: o loudnorm de uma passada fica abaixo do alvo em peça curta; corrige pro -14 LUFS medido
I=$(ffmpeg -hide_banner -i "$OUT.tmp.mp4" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{print $2; exit}')
G=$(awk -v i="$I" 'BEGIN{printf "%.2f", -14 - i}')
"$R/scripts/pesado.sh" ffmpeg -y -loglevel error -i "$OUT.tmp.mp4" -c:v copy \
  -af "volume=${G}dB,alimiter=limit=0.84:level=false,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "$OUT"
rm -f "$OUT.tmp.mp4"
echo "pronto: $OUT (volume: $I LUFS + $G dB)"
