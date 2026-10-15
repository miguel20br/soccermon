#!/data/data/com.termux/files/usr/bin/bash
# Prepara a pasta midia/ do trailer (fora do git): trechos dos clipes já no tempo da música, sons e cópias dos
# assets do jogo. Clipes "uau" em /sdcard/Movies/Soccermon-trailer; música em trailer/musica/.
# Tempos: compasso B = 1,348 s (178 BPM); o flash de cada clipe cai numa batida (0,337 s).
set -e
cd "$(dirname "$0")"
C=${CLIPES:-/sdcard/Movies/Soccermon-trailer}
M=midia
mkdir -p $M
V="scale=1980:1080,crop=1920:1080,fps=30,format=yuv420p"
corte() { # saida clipe inicio duracao
  ffmpeg -v error -y -ss "$3" -t "$4" -i "$C/$2" -an -vf "$V" -c:v libx264 -crf 18 -preset fast "$M/$1.mp4"
}
# gancho (3 compassos = 4,044 s): evolução do Charmander acelerada 2,5x (3,0 s) + o gol com flash
ffmpeg -v error -y -ss 2.0 -t 7.5 -i "$C/1-gancho-charmander-evolui-e-marca.mp4" -an -vf "setpts=PTS/2.5,$V" -c:v libx264 -crf 18 -preset fast $M/g1.mp4
corte g2 1-gancho-charmander-evolui-e-marca.mp4 47.30 1.044
corte jogada 5-jogada-pikachu-6-passes.mp4 7.648 2.696
# golpes: 1 compasso cada, em duas metades de 2 batidas: o golpe sendo lançado (a quadra escurece) e a bola
# entrando (o flash do gol cai 0,574 s depois do começo da 2ª metade)
golpe() { # saida clipe lancamento flash_do_gol
  corte "$1a" "$2" "$3" 0.674
  corte "$1b" "$2" "$(awk "BEGIN{print $4 - 0.574}")" 0.674
  printf "file '%s'\nfile '%s'\n" "$1a.mp4" "$1b.mp4" > $M/lista.txt; (cd $M && ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy "$1.mp4"); rm $M/lista.txt
}
golpe golpe1 2-golpe-charizard-fire-blast.mp4 3.62 7.13
# Pikachu: o Thunderbolt e o gol vêm quase juntos: um corte contínuo, o raio cai na 3ª batida
corte golpe2 8-golpe-pikachu-thunderbolt.mp4 6.755 1.348
golpe golpe3 4-golpe-charizard-flamethrower.mp4 2.2 5.53
golpe golpe4 3-golpe-mewtwo-psychic.mp4 4.6 6.23
corte d1 6-ditto-vira-mewtwo-e-combo.mp4 0.3 1.348
corte d2 6-ditto-vira-mewtwo-e-combo.mp4 3.9 1.348
corte penaltis 7-penaltis-6x5-ultima-cobranca.mp4 18.137 4.044
# junta os pares num vídeo só
junta() { printf "file '%s'\nfile '%s'\n" "$2.mp4" "$3.mp4" > $M/lista.txt; (cd $M && ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy "$1.mp4"); rm $M/lista.txt; }
junta gancho g1 g2
junta ditto d1 d2
# quadros da saída de bola (com os times e vazia só com a bola): node quadra-vazia.mjs (precisa do npm run dev)
# recortes dos menus (cartas, escalação, tática): node recortes.mjs
# sons: vento (não usado desde a abertura nova)
ffmpeg -v error -y -f lavfi -i "anoisesrc=color=brown:amplitude=0.25:duration=2.9" -af "lowpass=f=500,afade=t=in:d=0.6,afade=t=out:st=2.3:d=0.6" $M/vento.wav
# apito: gravação real de juiz num ginásio (CC0, ver ../sons/CREDITOS.md): o apito forte + o eco, 1,5 s
ffmpeg -v error -y -ss 0.07 -t 1.5 -i ../sons/apito-ginasio-splicesound-cc0.wav -af "afade=t=out:st=1.1:d=0.4,loudnorm=I=-14:TP=-1:LRA=7" -ar 44100 $M/apito.wav
cp ../musica/trainer-battle-remix.mp3 $M/musica.mp3   # análise de BPM/batidas: musica-analisar.py e musica-fase.py
# assets do jogo
P=../../public
cp $P/fonts/Galmuri11-Bold.woff2 $P/assets/ui/logo.svg $P/assets/ui/ball.svg $M/
cp ../arte/logo/i-evolucao-pt.svg ../arte/logo/i-evolucao-en.svg ../arte/logo/logo-pt.svg ../arte/logo/logo-en.svg $M/
for id in 25 150 6; do cp $P/assets/portraits/$id-determined.png $M/retrato-$id.png; done
for id in 6 150 25; do cp $P/assets/cries/latest/$id.ogg $M/grito-$id.ogg; done

# GIFs viram vídeo no render e perdem o tamanho do CSS: o versus usa o 1º quadro em PNG; o Charizard do final fica GIF
cp $P/assets/cards/6.gif $M/carta-6.gif
# voo do final: o Charizard do PMD batendo as asas (Walk; linha 0 = de frente pra câmera, 7 = indo pra baixo-esquerda),
# 4 quadros de 40x48 por linha, ampliados 8x sem suavizar
mkdir -p $M/voo
for r in 0 7; do for i in 0 1 2 3; do
  ffmpeg -v error -y -i $P/assets/field/6.png -vf "format=rgba,crop=40:48:$((i * 40)):$((384 + r * 48)),scale=320:384:flags=neighbor" $M/voo/r$r-$i.png
done; done
for id in 143 68 151 132 150 45 114 49 71 103; do ffmpeg -v error -y -i $P/assets/cards/$id.gif -frames:v 1 $M/carta-$id.png; done
./abertura-sons.sh
echo PRONTO
