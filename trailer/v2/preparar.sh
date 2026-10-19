#!/usr/bin/env bash
# Trailer 2 (9:16): monta a pasta midia/ (fora do git) com os clipes já cortados no tempo do storyboard v3, os
# recortes do DOM, os sons e a música. Rode da raiz do repo:
#   CAP=<quadros de trailer-capture.mjs> SHOTS=<recortes do DOM> MUSICA=<fonte da música> trailer/v2/preparar.sh
# CAP tem saida/, defesa-n/, defesa-l/, evo-n/, evo-p/, gol-n/, gol-l/ (PNG por quadro, 30 fps) e saida.png/
# saida-vazia.png (trailer/v2/quadra-vazia.mjs). SHOTS tem os prints 3x (scratchpad do storyboard).
# MUSICA: o MP3 original do Trainer Battle Remix (ORIGINAL=1) ou o trailer 1 renderizado (padrão: a música
# começa em 6,05 s do vídeo; os compassos 10 a 13 têm gritos por cima e saem na emenda, ver abaixo).
set -euo pipefail
: "${CAP:?}" "${SHOTS:?}" "${MUSICA:?}"
cd "$(dirname "$0")"
M=midia
P=../../public
LOGO=${LOGO:-$HOME/Downloads/soccermon-logo-final}
mkdir -p $M $M/pika

# ---- clipes: quadros 968x528 → 2x sem suavizar (pixel nítido), 30 fps --------------------------------------
clipe() { # saida pasta primeiro_quadro n_quadros [filtro extra]
  ffmpeg -v error -y -framerate 30 -start_number "$3" -i "$CAP/$2/%05d.png" -frames:v "$4" \
    -vf "${5:+$5,}scale=iw*2:ih*2:flags=neighbor,format=yuv420p" -c:v libx264 -crf 16 -preset fast -an "$M/$1.mp4"
}
clipe saida saida 1 40                 # plano 8: saída de bola (1 compasso)
clipe golpe defesa-n 33 40             # plano 9: quadra escurece, Fire Blast; a defesa cai no fim (batida 1 do 10)
clipe defesa defesa-l 40 40            # plano 10: o goleiro espalma, 0,5x
clipe evo-zoom evo-n 81 20             # plano 11a: zoom no Pikachu (2 batidas)
# plano 11b: a silhueta piscando (quadros 181–252) acelerada pra 2 batidas
ffmpeg -v error -y -framerate 30 -start_number 181 -i "$CAP/evo-p/%05d.png" -frames:v 72 \
  -vf "setpts=PTS*20/72,fps=30,scale=iw*2:ih*2:flags=neighbor,format=yuv420p" -c:v libx264 -crf 16 -preset fast -an $M/evo-silhueta.mp4
clipe evo-raichu evo-p 253 40   # plano 11c: o clarão e o Raichu (1 compasso)
clipe corrida-n gol-n 34 40            # plano 12: o Raichu parte (normal)
clipe corrida-l gol-l 26 40            # plano 12: câmera lenta até o chute entrar
clipe gol gol-n 94 40                  # plano 13: o clarão do gol e a comemoração
cp "$CAP/saida-vazia.png" "$CAP/saida.png" $M/

# ---- recortes do DOM (3x) ------------------------------------------------------------------------------------
cp "$SHOTS"/s-draft-1.png "$SHOTS"/s-draft-2.png "$SHOTS"/s-draft-3.png $M/
ffmpeg -v error -y -i "$SHOTS/p-fechado.png" -vf "crop=572:792:288:422" $M/p-fechado.png   # só o pacote (sem o "Toque pra abrir")
ffmpeg -v error -y -i "$SHOTS/p-3500.png" -vf "crop=532:728:48:403" $M/p-vira.png
for i in 1 2 3 4 5; do cp "$SHOTS/s-edicao-$i.png" $M/; done
cp "$SHOTS/s-mewtwo-1.png" $M/bronze.png
cp "$SHOTS/h-placar.png" "$SHOTS/s-emote-1.png" "$SHOTS/s-emote-2.png" "$SHOTS/s-vitrine-1.png" $M/
cp "$SHOTS/l-painel-1.png" $M/liga-elo.png
cp "$SHOTS/l-painel-4.png" $M/liga-ranking.png
ffmpeg -v error -y -i "$SHOTS/c-campeao.png" -vf "crop=1160:1250:28:180" $M/campeao.png

# ---- abertura: Carvalho e Pikachu (4 tons no CSS), bola, logo, fonte ----------------------------------------
cp $P/assets/trainers/oak.png $P/assets/ui/ball.svg $P/fonts/Galmuri11-Bold.woff2 $M/
cp $P/assets/portraits/6.png $M/retrato-6.png
ffmpeg -v error -y -i $P/assets/cards/25.gif -vf "format=rgba" -start_number 0 $M/pika/%02d.png
cp "$LOGO/logo-horizontal.svg" "$LOGO/logo-simbolo.svg" $M/

# ---- sons ----------------------------------------------------------------------------------------------------
# bipe do Game Boy a cada letra (0,08 s): onda quadrada curta
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.22*sgn(sin(2*PI*1350*t))*lt(mod(t\,0.08)\,0.03):s=44100:d=4.3" $M/bipes1.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.22*sgn(sin(2*PI*1350*t))*lt(mod(t\,0.08)\,0.03):s=44100:d=1.7" $M/bipes2.wav
# apito: gravação real de juiz num ginásio (CC0, ../sons/CREDITOS.md), um só
ffmpeg -v error -y -ss 0.07 -t 1.5 -i ../sons/apito-ginasio-splicesound-cc0.wav -af "afade=t=out:st=1.1:d=0.4,loudnorm=I=-14:TP=-1:LRA=7" -ar 44100 $M/apito.wav
# "tum" da bola caindo no pé do Pikachu e do pacote pousando: grave curto
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.9*exp(-18*t)*sin(2*PI*(90-40*t)*t):s=44100:d=0.35" $M/tum.wav
# rasgo do lacre: ruído rápido subindo
ffmpeg -v error -y -f lavfi -i "anoisesrc=color=white:amplitude=0.6:seed=7:duration=0.45" -af "highpass=f=1200,afade=t=in:d=0.05,afade=t=out:st=0.2:d=0.25" $M/rasgo.wav
# brilho: arpejo curto
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.18*sin(2*PI*(880+880*floor(t*12)/3)*t)*exp(-2.5*t):s=44100:d=0.9" $M/brilho.wav
# pop do emote
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.5*sin(2*PI*(500+1400*t)*t)*exp(-14*t):s=44100:d=0.25" $M/pop.wav
# impacto (gol e defesa)
ffmpeg -v error -y -f lavfi -i "aevalsrc=1.0*exp(-9*t)*sin(2*PI*(70-30*t)*t)+0.25*exp(-30*t)*(random(0)*2-1):s=44100:d=0.6" $M/impacto.wav
for id in 25 26 6; do cp $P/assets/cries/latest/$id.ogg $M/grito-$id.ogg; done
cp $P/assets/sfx/torcida-gol-1.mp3 $P/assets/sfx/torcida-uuh-1.mp3 $M/

# ---- música ---------------------------------------------------------------------------------------------------
# Grade: 178 BPM, compasso 1,348 s, 1ª batida da faixa em 0,968 s. O trailer usa a faixa a partir de 0,5 s.
if [ "${ORIGINAL:-0}" = 1 ]; then
  ffmpeg -v error -y -ss 0.5 -t 26 -i "$MUSICA" -ar 48000 -ac 2 $M/musica.wav
else
  # Trailer 1 (vídeo final): a faixa começa em 6,05 s. Os compassos 10–13 da faixa (14,448–19,840 s) têm os gritos
  # dos golpes por cima: saem, e a emenda cai na batida do gol (plano 13). Com o MP3 original não há emenda.
  ffmpeg -v error -y -i "$MUSICA" -filter_complex \
    "[0:a]atrim=6.55:20.498,asetpts=PTS-STARTPTS[a];[0:a]atrim=25.890:38.5,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.012:c1=tri:c2=tri" \
    -ar 48000 -ac 2 $M/musica.wav
fi
echo pronto
