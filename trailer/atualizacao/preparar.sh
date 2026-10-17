#!/usr/bin/env bash
# Prepara a pasta midia/ do clipe de atualização 0.8.4 (fora do git) a partir das gravações:
#   CAP = quadros dos lances (scripts/trailer-capture.mjs: mime-thunder, gk-n, hab-pika)
#   UI  = saída do recortes.mjs (menus em 3x e os "filmes" quadro a quadro)
#   MUSICA = áudio de onde sai a trilha provisória (o trailer 9:16 pronto: música a partir de 6,05 s)
# Lances: corte de 540x528 do quadro 968x528 ampliado 2x sem suavizar (ou 360x352 em 3x), 30 quadros/s.
set -euo pipefail
cd "$(dirname "$0")"
: "${CAP:?}" "${UI:?}" "${MUSICA:?}"
M=midia
mkdir -p $M
enc() { # saida.mp4 argumentos-de-entrada... (GOP de 1 s: o HyperFrames busca quadro a quadro)
  local o=$1; shift
  ffmpeg -v error -y "$@" -an -c:v libx264 -crf 16 -preset fast -g 30 -keyint_min 30 -pix_fmt yuv420p "$o"
}
lance() { # saida pasta inicio(s) dur(s) x y w h escala
  enc "$M/$1.mp4" -framerate 30 -start_number 1 -i "$2/%05d.png" -vf "trim=start=$3:duration=$4,setpts=PTS-STARTPTS,crop=$7:$8:$5:$6,scale=iw*$9:ih*$9:flags=neighbor"
}
lance mime  "$CAP/mime-thunder" 1.5 2.9 428 0 540 528 2
lance snorlax "$CAP/gk-n" 2.6 1.6 0 0 540 528 2
lance pika  "$CAP/hab-pika" 1.6 2.9 290 14 360 352 3
lance entra "$UI/i-segundo-tempo" 0 3.9 150 0 540 528 2
# menus filmados (já em 3x)
filme() { enc "$M/$1.mp4" -framerate 30 -i "$2/%05d.png" -vf "${3:-null}"; }
filme holo "$UI/t-holo" "crop=1176:330:0:0"
filme versus "$UI/v-versus"
filme pacote "$UI/d-pacote-capitao"
filme pacote2 "$UI/d-pacote-2"
filme mt "$UI/m-pacote"
# recortes parados
cp "$UI"/t-grade.png "$UI"/t-antes.png "$UI"/t-depois.png "$UI"/d-opcoes-2.png "$UI"/d-opcoes-3.png \
   "$UI"/c-mrmime.png "$UI"/c-onix.png "$UI"/c-hitmonlee.png "$UI"/c-wigglytuff.png "$UI"/c-vaporeon.png \
   "$UI"/i-intervalo.png "$UI"/i-quem-entra.png "$UI"/m-aberto.png $M/
# trilha provisória: 2 trechos do trailer sem os gritos, emendados no compasso (178 BPM, compasso 1,348 s; a grade
# da música cai em 0,968 + k·1,348 s): música 0–13,10 s (trailer 6,05–19,15) + 19,84–34,67 s (trailer 25,89–40,72)
ffmpeg -v error -y -i "$MUSICA" -filter_complex \
  "[0:a]atrim=6.05:19.15,asetpts=PTS-STARTPTS[a];[0:a]atrim=25.89:40.72,asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1,afade=t=out:st=26.6:d=1.33" \
  -ar 44100 $M/musica.wav
P=../../public
cp $P/fonts/Galmuri11-Bold.woff2 $P/assets/ui/logo.svg ../arte/logo/logo-pt.svg ../arte/logo/logo-en.svg $M/
cp $P/assets/portraits/143-determined.png $M/retrato-143.png
cp $P/assets/portraits/25-determined.png $M/retrato-25.png
# Mr. Mime não tem retrato PMD: o 1º quadro da carta
ffmpeg -v error -y -i $P/assets/cards/122.gif -frames:v 1 $M/retrato-122.png
echo ok
