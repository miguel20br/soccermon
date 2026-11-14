---
name: reference-postar-pelo-buffer
description: Postar nas 3 redes pelo Buffer (API), sem Chrome: script, ids dos canais, onde hospedar o vídeo, pegadinha da conta de marca do YouTube
metadata:
  type: reference
---

Desde 27/10/2026 os posts saem pelo Buffer (plano grátis, API GraphQL), não pelo Claude in Chrome.

- Script: `scripts/buffer.mjs` (`canais`, `tipo <Tipo>`, `postar <canal> <url> <legenda.txt> <ISO|fila|agora> [metadata]`, `CAPA_MS=` pro quadro da capa). Chave `BUFFER_API_KEY` no `.env.local` (criada 26/10, vence 25/11/2026; renovar em publish.buffer.com/settings/api).
- Canais: YouTube "Soccermon" `6ae012e82f1f5ed648e3c7d8`, TikTok `6adfc5252f1f5ed648df904e`, Instagram `6adfc4952f1f5ed648df8ab1`. Metadata: YouTube `{"youtube":{"title":…,"privacy":"public","categoryId":"20","madeForKids":false}}`; Instagram `{"instagram":{"type":"reel","shouldShareToFeed":true}}`.
- Vídeo por link direto: repo público github.com/miguel20br/soccermon-midia (criado com o ok do Miguel), URL raw.githubusercontent.com/miguel20br/soccermon-midia/main/<arquivo>.
- Pegadinha: o canal Soccermon é a CONTA DE MARCA "miguel20br" dentro da conta Google secundária do Miguel (a "08"); no Google, escolher "miguel20br · YouTube", não o e-mail (que leva a um canal pessoal vazio).
- Primeiro post: EP 2 "Escalaram um Magikarp no gol", 27/10 00h01 (YT shorts/iPDKL_k1zrk, TikTok 7701177387957882132, IG reel De-2FB9BtYj).

Ver [[reference-postar-pelo-chrome]] (o jeito antigo) e [[feedback-social-media-em-lote]].
