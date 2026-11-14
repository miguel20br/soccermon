---
description: O Duelo ao vivo usa Realtime em canal privado e login anônimo, com configurações do painel que não podem ser desfeitas.
status: aceito
data: 2026-10-17
---

# 0003. Duelo com Realtime privado e login anônimo

## Contexto

O Duelo tem que funcionar por link, sem exigir conta, e sem que estranhos entrem no canal de uma sala.

## Decisão

Sala por link em canal privado `duel:<código>` do Supabase Realtime (autorização na migração `20261017200000_duelo_realtime.sql`) e jogadores sem conta entram por login anônimo, que depois pode ser vinculado ao Google.

## Consequências

- No painel: Realtime com "Allow public access" desligado e Auth com "Allow anonymous sign-ins" ligado. Desfazer qualquer um quebra o Duelo.
- Cada partida mantém host e convidado com o mesmo motor determinístico (ADR 0001); só as ordens trafegam.
- Detalhes do desenho em `docs/planos/multiplayer.md`.
