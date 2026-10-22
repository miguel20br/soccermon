---
description: A Edge Function da Liga leva o motor empacotado, então todo ENGINE_VERSION novo exige republicá-la.
status: aceito
data: 2026-10-19
---

# 0002. Edge Function da Liga leva o motor empacotado

## Contexto

A Liga não confia no placar do cliente: o servidor refaz a partida com o mesmo motor. O código do servidor precisa ser idêntico ao do jogo no ar.

## Decisão

A função `liga` (Supabase) usa o motor empacotado por `npm run edge:liga` em `supabase/functions/liga/engine.js`. A cada `ENGINE_VERSION` novo, empacotar e publicar:
`npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api` (token `SUPABASE_ACCESS_TOKEN` no `.env.local`).

## Consequências

- Esquecer o deploy faz a Liga recusar todas as partidas ("recarregue a página"), sem erro visível no jogo.
- O deploy de produção do Supabase fica com o Miguel (ver ADR 0007).
- Alternativa descartada: compartilhar o código por pacote; o empacotado é mais simples com o plano gratuito.
