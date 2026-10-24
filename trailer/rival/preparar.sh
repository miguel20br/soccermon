#!/usr/bin/env bash
# Curta "O rival evoluiu": monta trailer/rival/midia/ (link pra $MIDIA, fora do git) a partir da captura da partida
# (cena rival, seed trailer1820: o Dragonair do Vermilion Voltagem evolui aos 203,7 s e o Dragonite faz o 4x4):
#   node scripts/trailer-capture.mjs --cena rival --seed trailer1820 --de 199 --ate 220 --modo pagina --escala 2 --out $CAP
# e dos placares (.bc-head .scoreboard com o placar de cada gol da virada, $PLACARES). Pela fila: scripts/pesado.sh.
# Planos (quadros da captura, 2560x1460, 30 fps):
#   abre   29–141  recorte 821x1460 (a altura toda) que segue o Dragonair, 1,3x (compassos 0–1)
#   evo    142–197 recorte 720x1280 no Dragonair (a câmera do jogo chega nele até o 154), 1,5x (compasso 2)
#   rev    198–225 recorte 662x1176 no Dragonite abaixo da faixa do jogo, câmera lenta 2x (compasso 3)
#   faixa do jogo "Dragonair evoluiu!" (858–1706 x 88–281) dos mesmos quadros, em câmera lenta
#   jogo   572–684 recorte que segue o Dragonite e depois a bola até o gol (compassos 4–5)
#   congela 690: a bola na rede e o goleiro, recorte fechado 420x747 (2,6x)
set -euo pipefail
cd "$(dirname "$0")"
CAP=${CAP:-$HOME/.cache/soccermon-tmp/curta-rival/capD}
PLACARES=${PLACARES:-$HOME/.cache/soccermon-tmp/curta-rival/placares}
MIDIA=${MIDIA:-$HOME/.cache/soccermon-tmp/curta-rival/midia}
J=../../public/assets
mkdir -p "$MIDIA/sp"
[ -e midia ] || ln -s "$MIDIA" midia
# enc <saída> <entrada e filtros...>: as opções de codificação vêm antes da saída (depois dela o ffmpeg ignora)
enc() { local o=$1; shift; ffmpeg -v error -y "$@" -c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p -g 15 -keyint_min 15 -an "$o"; }
# o Dragonair (x medido nos quadros 29, 50, 70, 90): o recorte anda com ele e para antes da faixa DEFESA! (x ≤ 1170)
XA="if(lt(n,21),862+n*3.24,if(lt(n,41),930+(n-21)*6,if(lt(n,61),1050+(n-41)*6,1170)))"
enc midia/abre.mp4 -framerate 30 -start_number 29 -i "$CAP/%05d.png" -frames:v 113 -vf "crop=821:1460:'$XA':0,scale=1080:1920:flags=neighbor"
enc midia/evo.mp4 -framerate 30 -start_number 142 -i "$CAP/%05d.png" -frames:v 56 -vf "crop=720:1280:'if(lt(n,12),1220-n*21.67,960)':40,scale=1080:1920:flags=neighbor"
# câmera lenta: cada quadro 2x (entra a 15 fps, sai a 30; -frames:v conta os quadros de saída)
enc midia/rev.mp4 -framerate 15 -start_number 198 -i "$CAP/%05d.png" -frames:v 56 -vf "crop=662:1176:949:284,scale=1080:1920:flags=neighbor" -r 30
enc midia/faixa-evo.mp4 -framerate 15 -start_number 198 -i "$CAP/%05d.png" -frames:v 56 -vf "crop=848:194:858:88,scale=1272:-2:flags=neighbor" -r 30
# o lance do gol: 572–640 no Dragonite (x 900), 640–648 vem pro chute, 648–672 corre atrás da bola até a trave
X="if(lt(n,68),900,if(lt(n,76),900-(n-68)*35,if(lt(n,100),620-(n-76)*25.8,0)))"
enc midia/jogo.mp4 -framerate 30 -start_number 572 -i "$CAP/%05d.png" -frames:v 113 -vf "crop=720:1280:'max(0,$X)':110,scale=1080:1920:flags=neighbor"
ffmpeg -v error -y -i "$CAP/00690.png" -vf "crop=420:747:0:300,scale=1080:1920:flags=neighbor" midia/congela.png
cp "$PLACARES"/p*.png midia/
cp "$J/ui/logo.svg" midia/logo-horizontal.svg
cp ../../public/fonts/Galmuri11-Bold.woff2 midia/
cp "$J/field/149.png" midia/sp/149.png
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const pmd = JSON.parse(readFileSync('../../src/data/pmd-anims.json', 'utf8'));
const pes = JSON.parse(readFileSync('../../src/data/sprite-feet.json', 'utf8'));
const SPR = {};
for (const id of [149]) {
  const json = JSON.parse(readFileSync('$J/field/' + id + '.json', 'utf8'));
  const anims = {};
  for (const [nome, info] of Object.entries(pmd[id].anims))
    anims[nome] = { w: info.frameWidth, h: info.frameHeight, dur: info.durations, pe: pes[id]?.[nome] ?? 0.75,
      rects: Array.from({ length: info.rows }, (_, d) => Array.from({ length: info.frames }, (_, i) => json.frames[nome + '/' + d + '/' + i].frame).map((f) => [f.x, f.y])) };
  SPR[id] = { folha: 'midia/sp/' + id + '.png', tam: [json.meta.size.w, json.meta.size.h], sombra: pmd[id].shadowSize, anims };
}
writeFileSync('midia/sprites.js', 'window.SPR = ' + JSON.stringify(SPR) + ';\n');
console.log(Object.keys(SPR[149].anims).join(' '));
"
ls midia/
