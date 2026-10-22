---
name: feedback-musica-aprovou-entra
description: "música aprovada pelo Miguel entra no jogo na hora (branch musica-jogo), sem esperar outra pergunta"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 860a4e4b-f633-450d-bc05-3e08c9fc864b
  modified: 2026-10-22T04:57:18.958Z
---

Quando o Miguel aprova uma faixa no localhost:8000, coloque ela no jogo logo em seguida. O caminho:
1. Converta pra Opus `.webm` 64 kbps e `.mp3` 80 kbps.
2. Copie o `.json` com o campo `faixa` sem o prefixo `rN-`.
3. Grave em `public/music/` da branch `musica-jogo`.
4. Meça as emendas com `scripts/musica/loops.mjs` numa cópia decodificada a 44,1 kHz.
5. Ligue a faixa na tela em `src/ui/music-sync.ts`.

Produção continua precisando do "pode subir".

**Why:** ele pediu em 22/10/2026: "quero que você adicione as músicas assim que eu aprovar".

**How to apply:** depois de um "aprovada", faça a troca e o commit na hora e avise numa linha. Veja também [[feedback-gosto-musical]].
