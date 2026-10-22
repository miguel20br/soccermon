---
description: Toda troca de tela e mudança de estado nos menus tem transição de 200 a 300 ms; nada pula de posição.
status: aceito
data: 2026-10-20
---

# 0004. Nada teleporta

## Contexto

Telas, abas e painéis que apareciam ou sumiam de uma vez deixavam o jogo duro. A regra já existia no Tutti e o Miguel quis a mesma aqui.

## Decisão

Toda troca de tela, entrada, saída e mudança de estado nos menus tem transição (200 a 300 ms, `--ease-out`). Com "Reduzir movimento" fica só o fade. Tela nova já nasce assim.

## Consequências

- Infra: `src/ui/view-transition.ts`, `tab-slide.ts`, `exit-motion.ts`; `npm run teleporte` acusa o que pula.
- O que ainda não cumpre está no backlog em `docs/planos/nada-teleporta.md`.
- Trocar de tela adia só a `screen` até a animação, não o estado inteiro (`src/store/screen-transition.ts`).
