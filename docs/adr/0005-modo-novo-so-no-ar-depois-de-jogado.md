---
description: Modo novo só vai ao ar depois de jogado de ponta a ponta na tela, não só pelo robô do store.
status: aceito
data: 2026-10-21
---

# 0005. Modo novo só no ar depois de jogado na tela

## Contexto

A Rota Índigo foi ao ar com robô do store e testes verdes e quebrou na primeira partida em produção (21/10). Voltou na 0.9.2.2 depois de jogada inteira no navegador, com 9 bugs consertados.

## Decisão

Um modo novo só liga em produção (bandeira como `LONG_CUP_LIVE` em `src/store/long-cup.ts`) depois de jogado do começo ao fim no navegador, headless e com prints, pelo fluxo real da tela.

## Consequências

- Mais tempo antes de lançar; em troca, o modo não quebra na frente do jogador.
- Antes disso o modo fica atrás de bandeira ou de atalho de dev (`?demo=`).
- Roteiro de teste na skill `soccermon-teste-navegador`.
