---
description: O motor é determinístico (sem Math.random nem Date) e todo resultado novo de partida sobe o ENGINE_VERSION.
status: aceito
data: 2026-10-17
---

# 0001. Motor determinístico e ENGINE_VERSION

## Contexto

O Duelo ao vivo, a Liga (servidor refaz a partida), os replays e os melhores momentos dependem de a mesma seed com as mesmas ordens dar a mesma partida em qualquer navegador e no servidor.

## Decisão

`src/engine/` roda a 20 Hz, sem `Math.random()` nem `Date` (usa o `Rng` do estado) e com contas próprias (`dmath.ts`). Qualquer mudança que altere o resultado de partidas (motor, balanceamento, contas) sobe `ENGINE_VERSION` em `src/engine/config.ts`.

## Consequências

- Replays guardados e partidas da Liga de versão antiga são descartados ou recusados: o aviso "recarregue a página" é esperado.
- `npm run determinismo` compara Node, Chromium, Firefox e WebKit; rode ao mexer em conta do motor.
- Subir o `ENGINE_VERSION` obriga a republicar a Edge Function da Liga (ADR 0002).
