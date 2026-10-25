---
description: Exceção ao ADR 0004 - entrar num modo (Nova copa, Começar a Rota) pode levar 600 a 900 ms, e um toque pula.
status: aceito
data: 2026-10-25
---

# 0008. Entrada de modo mais longa (exceção ao "nada teleporta")

## Contexto

Os menus viram ambientes (docs/planos/clash-2x2-menus-arcade.md, parte 2, decisão 12 aprovada pelo Miguel em
25/10/2026). Começar uma copa saindo do Estádio ou da Rota pede um momento de cinema (a câmera sai do túnel e entra
na quadra, o mapa aproxima do time), e 200 a 300 ms não dão tempo de ver isso. O ADR 0004 manda 200 a 300 ms em toda
troca.

## Decisão

Só a entrada num modo novo (o botão principal de cada ambiente que começa uma copa) pode durar de 600 a 900 ms. Um
toque em qualquer lugar pula na hora. Trocar de aba, abrir janela e o resto dos menus continuam no ADR 0004.

## Consequências

- Hoje: 860 ms (`ENTER_MS` em `src/ui/ambientes/Ambientes.tsx`), câmera em CSS: no Estádio ela atravessa o túnel
  em passos (as paredes passam pelos lados), sai na luz dos refletores e a quadra cresce; na Rota, o mapa aproxima do
  time. Os Pokémon ambiente fogem do time. A tela termina no escuro e a View Transition de sempre entra no draft.
- Com "Reduzir movimento" não tem câmera: a copa começa direto, com o fade normal.
- Continuar uma copa aberta não ganha a entrada longa (quem continua quer chegar logo).
- Ambiente novo que tenha botão de começar modo segue a mesma regra e o mesmo `enter()`.
