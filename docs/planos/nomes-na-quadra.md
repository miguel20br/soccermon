---
description: Nomes dos Pokémon na quadra em pé no celular (item do roadmap): medição, 4 opções com protótipo e decisões pro Miguel.
---

# Nomes na quadra (celular em pé)

Item do roadmap: "Quadra em pé: nomes dos Pokémon se embolam". 57% das sessões são de celular. **Decidido em 23/10/2026: A + C** (regra de prioridade que já existe, mais nome curto de até 5 letras só no celular em pé < 560 px, quando o inteiro seria escondido; só some se o curto ainda cruzar). Implementado em `src/game/label-fit.ts` + `MatchScene.declutterLabels`; B e D ficam fora.

## Diagnóstico

- O item está meio velho: desde 20/10 (commit `8cf8b470`) o `MatchScene.declutterLabels` (`src/game/scenes/MatchScene.ts`, ~l. 959) já esconde com fade (180 ms) o nome de menor prioridade quando dois se encostam na quadra < 560 px (bola, seu time, capitão), e a opção Configurações → "Nomes na quadra" (todos / só meu time / nenhum, `showsName`) já existe. Os textos são criados em `createPlayerView` (~l. 887) e a fonte cresce em `updateUiScale`.
- Medição (headless, `?demo=escanteio&vel=4`, partida inteira, 400 quadros a 150 ms, 10 nomes; script em `nomes-na-quadra/probe.mjs` e `an.mjs`). "Par" = dois nomes visíveis com retângulos se cruzando.

| Cenário | Largura | Pares por quadro | Quadros com 1+ par | Nomes escondidos por quadro (de 10) |
|---|---|---|---|---|
| Todos os nomes, sem regra (antes da 20/10) | 390 | 1,35 (pior quartil 3,06) | 78% | 0 |
| Todos os nomes, sem regra | 320 | 2,00 (pior quartil 4,33) | 86% | 0 |
| **Regra atual (no ar)** | 390 | **0,17** (pior quartil 0,35) | n/d | 1,07 |
| **Regra atual (no ar)** | 320 | **0,20** (pior quartil 0,41) | n/d | 1,47 |
| Só o meu time, sem regra | 390 / 320 | 0,18 / 0,30 | n/d | 5 |

Conclusão: o embolo grave já foi resolvido em ~90%. Sobra (a) o resíduo de 0,2 par por quadro (a duração do fade e nome em cima do sprite vizinho), e (b) o custo da regra: 1 a 1,5 nome some por quadro, justamente no bolo, onde o jogador quer saber quem é quem. Ressalva: uma partida só (demo de grandalhões, escanteio), 390 e 320; não rodei copa inteira.

## Opções (protótipo em `?nomes=` no worktree, só dev/prévia, não subir)

Prints em `docs/planos/nomes-na-quadra/`.

| Opção | Pares/quadro (390) | Escondidos/quadro | Custo | Print |
|---|---|---|---|---|
| A. Ficar como está (regra por prioridade, já no ar) | 0,17 | 1,07 | zero; só marcar o item do roadmap como feito | `atual-390-bolo.png`, `atual-320-bolo.png` |
| B. Nome só de quem tem a bola + capitão (resto some) | 0,03 | 8,2 | ~10 linhas; limpo, mas perde a leitura do time ("quem é aquele?") | `B-bola-capitao-390.png` |
| C. Nome curto (4 letras) + regra atual | 0,17 (320: 0,20) | 0,85 (320: 1,09) | 1 linha no `createPlayerView` e nos dois `setText`; ~20% menos nomes escondidos; "Char", "Gyar" ainda se lêem | `C-curto-390.png`, `C-curto-320.png` |
| D. Número da camisa (1 a 5) + regra atual | 0,12 | 0,35 | número precisa existir (hoje não existe) e aparecer no painel/cartas; texto de 1 char fica pequeno (`D-numero-390.png`); perde a graça de ler o nome | `D-numero-390.png` |

Observação: "só o meu time" já é a opção de Configurações; sozinha ela quase não ajuda (0,18 par, pois o seu time é a metade que se aglomera) e esconde o rival, que é quem você precisa identificar.

## Recomendação

**A + C**: manter a regra por prioridade (já no ar) e acrescentar nome curto (máx. 5 letras, só no celular em pé < 560 px) quando o nome inteiro está sendo escondido: primeiro tenta curto, só some se ainda se cruzar. Reduz os escondidos sem número de camisa novo. Custo: pequeno (um `slice` + segunda passada no `declutterLabels`), trilha rápida (só tela, fora do motor), sem mudança de balanceamento. Se o Miguel achar que já está bom, é só A e fechar o item.

## Decisões (23/10/2026)

1. Regra de 20/10 mantida (A). 2. Nome curto (C): sim, só celular em pé, 5 letras. 3. B e 4. D: fora. 5. Trilha rápida.
