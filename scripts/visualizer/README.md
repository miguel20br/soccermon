# Visualizers do Soccermon Songs (YouTube)

Vídeo 1920x1080, 30 fps: fundo de marca com raios girando, quadra com círculo que pulsa, 40 barras pixeladas
(espectro do WAV, cores por altura), placa com título e "Faixa NN", logo, progresso. Sem Pokémon.
Pixel art em 480x270 (nearest x4) + placa em PNG (Chromium + Galmuri). Sem dependência nova (puppeteer-core, ffmpeg).

```bash
# álbum final: copie tracks.example.json, ajuste wavs + ordem + títulos (a ordem do arquivo é a do álbum)
scripts/pesado.sh node scripts/visualizer/album.mjs minha-tracklist.json          # saída: ~/Vídeos/soccermon-album/vol1
scripts/pesado.sh node scripts/visualizer/album.mjs minha-tracklist.json --inicio 20 --dur 30 --saida /tmp/teste   # amostra
# uma faixa só
scripts/pesado.sh node scripts/visualizer/render.mjs faixa.wav --titulo "Fiado, só amanhã" --n 7 --saida faixa.mp4
# capa 3000x3000 e miniatura 1280x720
node scripts/visualizer/arte.mjs
```

Saída: `faixas/NN-*.mp4` (um por faixa; já renderizada é reaproveitada, apague pra refazer), `album-completo.mp4`,
`descricao.txt` (capítulos com tempos, pronta pro YouTube). Álbum de Natal: outro JSON, outra `--saida`
(troque o texto "VOL. 1" em `render.mjs`/`arte.mjs`). Custo: ~1 min de render por minuto de áudio.

## v2: clipe por faixa (cena em pixel art)

`clipe.mjs` + `cenas.mjs` + `pix.mjs`: cada faixa ganha uma cena animada no tempo da música (BPM + graves do WAV; o espectro
vira janelas da cidade e lâmpadas). Cenas prontas: `chefe` (Sala do chefe, 96 BPM) e `plano` (O plano infalível, 112 BPM);
os eventos da cena usam o tempo da faixa (conferido no volume do master), então master refeito = rever os tempos em `cenas.mjs`.
No `tracks.json`, `"cena": "chefe", "bpm": 96` numa faixa usa o clipe; sem `cena`, cai no visualizer v1 (barras).

```bash
scripts/pesado.sh node scripts/visualizer/clipe.mjs faixa.wav --cena chefe --bpm 96 --titulo "Sala do chefe" --n 12 [--trechos 0-12.5,118.1-135.8]
node scripts/visualizer/arte2.mjs     # capa 3000x3000 e miniatura (cena do ginásio)
```
