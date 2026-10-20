#!/usr/bin/env bash
# Trailer 2 (9:16): monta a pasta midia/ (fora do git) com os clipes já cortados no tempo do storyboard v3, os
# recortes do DOM, os sons e a música. Rode da raiz do repo:
#   CAP=<quadros> SHOTS=<recortes 3x, emotes 8x, pacote> MUSICA=<fonte da música> [ORIGINAL=1] trailer/v2/preparar.sh
# MUSICA: o MP3 original do Trainer Battle Remix (ORIGINAL=1) ou o trailer 1 renderizado (padrão: a música
# começa em 6,05 s do vídeo; os compassos 10 a 13 têm gritos por cima e saem na emenda, ver abaixo).
set -euo pipefail
: "${CAP:?}" "${SHOTS:?}" "${MUSICA:?}"
cd "$(dirname "$0")"
M=midia
P=../../public
LOGO=${LOGO:-$HOME/Downloads/soccermon-logo-final}
mkdir -p $M $M/pika

# ---- clipes: a partida inteira é a mesma (partida · trailer3892, quadra da Saffron), enquadrada na faixa 1080x860
# seguindo a bola (enquadrar.py); no lance do gol o recorte puxa pro gol. Quadros de 968x528, 30 fps.
# CAP tem pre/ (348,5–352,4 s), defesa-l/ (0,5x), evo-p/ (tela de evolução, modo pagina), gol-n/ e gol-l/ (0,5x),
# placar.png (--placar do trailer-capture) e saida.png/saida-vazia.png (quadra-vazia.mjs).
E="python3 enquadrar.py"
$E "$CAP/pre" 28 40 $M/placar-jogo.mp4 --zoom 1.0                 # plano 8: a jogada antes do golpe (placar em cima)
$E "$CAP/pre" 68 40 $M/golpe.mp4 --zoom 1.0                       # plano 9: a quadra escurece, Fire Blast
$E "$CAP/defesa-l" 77 40 $M/defesa.mp4 --zoom 1.25 --gol 0.97     # plano 10: 0,5x, o goleiro espalma no quadro 98
# plano 11: a tela de evolução (página inteira 1280x730 → faixa): o Pikachu, a silhueta piscando, o clarão e o Raichu
evo() { # saida 1º quadro n_quadros_origem n_quadros_saida
  ffmpeg -v error -y -framerate 30 -start_number "$2" -i "$CAP/evo-p/%05d.png" -frames:v "$4" \
    -vf "trim=end_frame=$3,setpts=(PTS-STARTPTS)*$4/$3,fps=30,crop=917:730:181:0,scale=1080:860:flags=neighbor,format=yuv420p" -c:v libx264 -crf 16 -preset fast -an "$M/$1.mp4"
}
evo evo-pika 64 40 20
evo evo-silhueta 109 126 20
evo evo-raichu 235 40 40
$E "$CAP/gol-n" 81 20 $M/gol-chute.mp4 --zoom 1.3                 # plano 12a: o golpe do Raichu e o chute
$E "$CAP/gol-l" 85 20 $M/gol-lento.mp4 --zoom 1.6 --gol 0.97      # plano 12b: 0,5x, a bola chegando no gol
$E "$CAP/gol-n" 125 20 $M/gol.mp4 --zoom 1.3 --gol 0.97           # plano 13: o clarão do gol
# versão 16:9 dos mesmos clipes (sufixo -h, 1920x1080) pro trailer/v2-16x9: mesmos trechos, recorte mais aberto
H="--tamanho 1920x1080"
$E "$CAP/pre" 28 40 $M/placar-jogo-h.mp4 $H
$E "$CAP/pre" 68 40 $M/golpe-h.mp4 $H
$E "$CAP/defesa-l" 77 40 $M/defesa-h.mp4 --zoom 1.1 --gol 0.97 $H
$E "$CAP/gol-n" 81 20 $M/gol-chute-h.mp4 --zoom 1.15 $H
$E "$CAP/gol-l" 85 20 $M/gol-lento-h.mp4 --zoom 1.4 --gol 0.97 $H
$E "$CAP/gol-n" 125 20 $M/gol-h.mp4 --zoom 1.15 --gol 0.97 $H
evoh() {
  ffmpeg -v error -y -framerate 30 -start_number "$2" -i "$CAP/evo-p/%05d.png" -frames:v "$4" \
    -vf "trim=end_frame=$3,setpts=(PTS-STARTPTS)*$4/$3,fps=30,crop=1280:720:0:5,scale=1920:1080:flags=neighbor,format=yuv420p" -c:v libx264 -crf 16 -preset fast -an "$M/$1.mp4"
}
evoh evo-pika-h 64 40 20
evoh evo-silhueta-h 109 126 20
evoh evo-raichu-h 235 40 40
cp "$CAP/saida-vazia.png" "$CAP/saida.png" $M/
ffmpeg -v error -y -i "$CAP/placar.png" -vf "crop=376:73:0:0" $M/placar.png

# ---- recortes do DOM (3x) ------------------------------------------------------------------------------------
cp "$SHOTS"/s-draft-1.png "$SHOTS"/s-draft-2.png "$SHOTS"/s-draft-3.png $M/
cp "$SHOTS/pacote-elemento-pc.png" $M/p-fechado.png   # o pacote do jogo com o logo novo (branch pacote-logo)
ffmpeg -v error -y -i "$SHOTS/p-3500.png" -vf "crop=532:728:48:403" $M/p-vira.png
# edições na galeria ?cards=1 (main de 20/10): 1 Shiny, 2–4 Destaque (MVP 0–2), 5 Ícone, 6 Ícone MVP, 7 Evento
cp "$SHOTS/s-edicao-1.png" $M/ed-shiny.png; cp "$SHOTS/s-edicao-2.png" $M/ed-destaque.png
cp "$SHOTS/s-edicao-5.png" $M/ed-icone.png; cp "$SHOTS/s-edicao-6.png" $M/ed-icone-mvp.png; cp "$SHOTS/s-edicao-7.png" $M/ed-evento.png
cp "$SHOTS/s-mewtwo-1.png" $M/bronze.png
ffmpeg -v error -y -i "$SHOTS/s-vitrine-1.png" -vf "crop=1143:830:0:0" $M/s-vitrine-1.png
cp "$SHOTS/emote-1.png" "$SHOTS/emote-2.png" $M/                                 # emotes em 8x
cp "$SHOTS/dia-painel-1.png" $M/dia-resumo.png                                   # Copa do Dia (main)
cp "$SHOTS/dia-painel-3.png" $M/dia-ranking.png
ffmpeg -v error -y -i "$SHOTS/c-campeao.png" -vf "crop=1143:1400:36:195" $M/campeao.png
# pacote do jogo com o logo novo (branch pacote-logo): corpo e tampa separados pra tampa rasgar
ffmpeg -v error -y -i "$SHOTS/pacote-elemento-pc.png" -vf "crop=618:765:0:99" $M/pacote-corpo.png
ffmpeg -v error -y -i "$SHOTS/pacote-elemento-pc.png" -vf "crop=618:99:0:0" $M/pacote-tampa.png

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
# Grade: 178 BPM, compasso 1,348 s, 1ª batida da faixa em 0,968 s. O trailer usa a faixa a partir de 0,5 s (entra em
# 7,96 s do vídeo).
if [ "${ORIGINAL:-0}" = 1 ]; then
  # MP3 original (Bliitzit, 348 s). A grade dele: 1ª batida do compasso 0 em C0 = 1,003 s (correlação com a música do
  # trailer 1, cuja grade aprovada é 0,968 s: o original está 0,035 s atrasado em relação a ela).
  # O drop da faixa é o compasso 10; o gol do Raichu é a batida 48 do trailer (compasso 12). Pra o drop cair no gol,
  # os compassos 8–9 (a respiração antes do drop) tocam duas vezes: c0…c9, c8–c9 de novo, c10 em diante, sem
  # emenda no meio de compasso (cortes no começo de compasso, 10 ms de cruzamento).
  C0=${C0:-1.003}
  c() { python3 -c "print($C0 + $1 * 60 / 178 * 4)"; }
  INI=$(python3 -c "print($C0 - 0.468)")   # a faixa entra 0,468 s antes da 1ª batida (7,96 s do vídeo)
  ffmpeg -v error -y -i "$MUSICA" -filter_complex \
    "[0:a]atrim=$INI:$(c 10),asetpts=PTS-STARTPTS[a];[0:a]atrim=$(c 8):$(c 10),asetpts=PTS-STARTPTS[b];[0:a]atrim=$(c 10):$(c 24),asetpts=PTS-STARTPTS[d];[a][b]acrossfade=d=0.01[ab];[ab][d]acrossfade=d=0.01" \
    -ar 48000 -ac 2 $M/musica.wav
else
  # Trailer 1 (vídeo final): a faixa começa em 6,05 s do vídeo, com gritos por cima nos compassos 10–13 e 25. Saem
  # nas emendas (sempre no começo de compasso, c_k = 0,968 + k·1,3483): c0–c9, c14–c24, c17 no lugar do c25 (mesma
  # posição na frase de 8), c26 em diante. Com o MP3 original não há emenda.
  c() { python3 -c "print(6.05 + 0.968 + $1 * 60 / 178 * 4)"; }
  ffmpeg -v error -y -i "$MUSICA" -filter_complex \
    "[0:a]atrim=6.55:$(c 10),asetpts=PTS-STARTPTS[a];[0:a]atrim=$(c 14):$(c 25),asetpts=PTS-STARTPTS[b];[0:a]atrim=$(c 17):$(c 18),asetpts=PTS-STARTPTS[d];[0:a]atrim=$(c 26):$(c 28),asetpts=PTS-STARTPTS[e];[a][b]acrossfade=d=0.012[ab];[ab][d]acrossfade=d=0.012[abd];[abd][e]acrossfade=d=0.012" \
    -ar 48000 -ac 2 $M/musica.wav
fi
echo pronto
