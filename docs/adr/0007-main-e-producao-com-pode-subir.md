---
description: Push na main publica sozinho em produção, então nada entra nela sem o "pode subir" do Miguel naquela conversa.
status: aceito
data: 2026-10-17
---

# 0007. main = produção, com "pode subir"

## Contexto

A Vercel está ligada ao GitHub: push na `main` publica em soccermon.com na hora. Vários agentes trabalham em paralelo.

## Decisão

Todo trabalho vive em branch e worktree próprios. Para a `main` só com o "pode subir" explícito do Miguel naquela conversa. A prévia é o push da branch (Vercel gera um endereço atrás do login). O que mexe em equilíbrio, posições, visual de carta, regra nova, Supabase de produção ou o que ele pediu para ver continua com ele; conserto com teste, texto, tradução, acessibilidade e processo sobem sem perguntar.

## Consequências

- O CI roda em toda branch; o agente espera o CI, não a fila do PC.
- Fluxo de lançamento na skill `soccermon-lancamento`.
- Migração ou função do Supabase de produção também espera o ok dele (ADR 0002).
