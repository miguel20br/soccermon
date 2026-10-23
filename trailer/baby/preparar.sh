#!/usr/bin/env bash
# Trailer da Rota de baby: monta trailer/baby/midia/ (fora do git). Pela fila: scripts/pesado.sh na frente.
# Antes: o dev server (porta em BASE_URL), as cartas e a quadra (passos.mjs e quadra.mjs, ver index.html) e a tela de
# evolução gravada em $EVO (trailer-capture --cena baby --seed trailer39 --de 222 --ate 223.2 --modo pagina --escala 2).
set -euo pipefail
cd "$(dirname "$0")"
EVO=${EVO:-$HOME/.cache/trailer-baby/evo}
M=midia
J=../../public/assets
mkdir -p "$M"
# tela de evolução recortada no 9:16 (720x1280 do print 2x, ampliado 1,5x: pixel inteiro)
CROP="crop=720:1280:920:90,scale=1080:1920:flags=neighbor"
enc() { ffmpeg -v error -y -framerate 30 -start_number "$1" -i "$EVO/%05d.png" -frames:v "$2" -vf "$CROP,format=yuv420p" -c:v libx264 -crf 14 -preset slow "$M/$3"; }
enc 13 40 evo-karp.mp4
enc 205 105 evo-gyara.mp4
ffmpeg -v error -y -i "$EVO/00061.png" -vf "$CROP" "$M/sil-karp.png"
ffmpeg -v error -y -i "$EVO/00103.png" -vf "$CROP" "$M/sil-gyara.png"
cp "$J/field/129.png" "$M/sp-129.png"
cp "$J/portraits/129.png" "$M/retrato-129.png"
cp "$J/cries/latest/130.ogg" "$M/grito-130.ogg"
cp "$J/cries/latest/129.ogg" "$M/grito-129.ogg"
cp ../../public/fonts/Galmuri11-Bold.woff2 "$M/" 2>/dev/null || cp ../../public/fonts/Galmuri11.woff2 "$M/Galmuri11-Bold.woff2"
# o gancho de cada pulo do Magikarp: alto do sprite (linha opaca de cima) em cada quadro do Hop, pro selo C seguir
node --input-type=module -e "
import sharp from 'sharp';
const { data, info } = await sharp('$M/sp-129.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const topo = (x0, y0, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[((y0 + y) * info.width + x0 + x) * 4 + 3] > 0) return y; return h; };
const anim = (y0, w, h, n) => Array.from({ length: n }, (_, i) => ({ x: i * w, y: y0, w, h, topo: topo(i * w, y0, w, h) }));
const SPR = { folha: 'midia/sp-129.png', tam: [info.width, info.height], hopDir: (d) => 1472 + d * 72,
  hop2: anim(1472 + 2 * 72, 32, 72, 10), hop0: anim(1472, 32, 72, 10), pe: 0.653 };
delete SPR.hopDir;
(await import('node:fs')).writeFileSync('$M/magikarp.js', 'window.MAGIKARP = ' + JSON.stringify(SPR) + ';\n');
"
ls "$M" | tr '\n' ' '; echo
# rugido do Gyarados mais grave (a tela do Gyarados) e o Magikarp no SPLASH
ffmpeg -v error -y -i "$M/grito-130.ogg" -af "asetrate=$(ffprobe -v error -show_entries stream=sample_rate -of csv=p=0 "$M/grito-130.ogg")*0.72,aresample=48000,loudnorm=I=-14:TP=-1" "$M/grito-130-grave.wav"
ffmpeg -v error -y -i "$M/grito-129.ogg" -af "aresample=48000,loudnorm=I=-16:TP=-1" "$M/grito-129.wav"
