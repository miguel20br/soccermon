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
