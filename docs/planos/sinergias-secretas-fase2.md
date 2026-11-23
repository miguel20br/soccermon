---
description: Fase 2 das sinergias secretas (as com bônus em campo): lista, bônus proposto e números de antes e depois pro Miguel decidir. Nada aplicado.
---

# Sinergias secretas, fase 2: as com bônus em campo (proposta, 23/11/2026)

A fase 1 (branch `feat-sinergias-secretas`) entregou só tela: as 6 rivalidades, o "???" na escalação, a revelação em
quadra, o Registro de Sinergias, a medalha e o "Sinergia descoberta" no resultado. As secretas abaixo **mudam a
partida** (bônus em tudo + combo de passe e chute, o mesmo pacote das 14 de história), então passam pelo motor:
`ENGINE_VERSION`, republicar a `liga` e o ok do Miguel. **Nada disto está no código.** Catálogo e gatilhos:
[pesquisa §3](pesquisas/sinergias-e-animacoes.md).

## Como medi

`scripts/balance/secretas-bonus.ts` põe as secretas em `LINKS` só na memória do script (o motor não muda) e compara
as mesmas partidas com e sem elas. Rodado com `scripts/pesado.sh`.

- **Geral** (`--geral`, n=200, draft da IA dos dois lados, a IA não conhece as secretas):

| | Gols/jogo | Favorito (média 1+ acima) vence | Times com alguma secreta ligada |
|---|---|---|---|
| Hoje | 7,10 | 62,3% | - |
| Com as 21 secretas | 7,14 | 60,5% | 21,5% |

  O jogo como um todo quase não mexe: a meta de gols (5–7) e a do favorito (60–65%) seguem.

- **Por secreta** (n=100): o time A ganha os membros no lugar de titulares de linha, o B é sorteado; mesmas seeds
  com e sem o bônus. Atenção: com atributo diferente a partida segue outro caminho, então cada linha tem ruído de uns
  ±10 pontos. Vale a média: **+2,6 pontos de vitória e +0,26 de saldo de gols por partida** para quem tem a secreta,
  o mesmo tamanho das de história de +4% a +6%. Pra fechar o número de uma secreta sozinha, n=400 nela.

## Lista e bônus proposto

Bônus em tudo para os membros (o titular fica com o maior entre as sinergias dele, como hoje). Régua proposta:
**+3% a +4%** nas que ligam muito (servem de 1ª descoberta), **+5%** nas de 2 famílias, **+6%** nas de 3 membros
certos, **+8%** nas raras de 3–4 (o degrau secreto de cima de Iniciais, Eeveelutions e Fósseis).

| # | Secreta | Gatilho (entre os titulares) | Bônus | Vitórias A sem → com | Saldo A sem → com |
|---|---|---|---|---|---|
| 1 | A Turma | Pikachu/Raichu + 1 do Time da Misty + 1 do Time do Brock | +6% | 49% → 56% | -0,25 → +0,28 |
| 2 | Monte Prateado | Pikachu + Snorlax + Venusaur, Charizard ou Blastoise | +8% | 37% → 31% | -0,89 → -1,18 |
| 3 | Rival Azul | 2 de Pidgeot, Alakazam, Rhydon, Arcanine, Gyarados, Exeggutor (famílias) | +4% | 41% → 47% | -0,57 → -0,27 |
| 4 | Joy e Jenny | Chansey + Growlithe/Arcanine | +5% | 46% → 62% | -0,26 → +0,63 |
| 10 | Flauta Pokémon | Snorlax + Jigglypuff ou Clefairy (famílias) | +5% | 35% → 41% | -1,04 → -0,19 |
| 11 | Slowbro | Slowpoke + Shellder | +5% | 30% → 26% | -1,25 → -1,54 |
| 12 | Mestre e Aprendiz | Forma base + forma final da mesma família (53 famílias) | +3% | 44% → 47% | -0,37 → -0,30 |
| 13 | Família Completa | Os 3 estágios da mesma família (16 famílias) | +4% | 34% → 27% | -1,19 → -1,23 |
| 14 | As 4 Pokébolas | Bulbasaur, Charmander, Squirtle (base) + Pikachu | +8% | 10% → 11% | -2,96 → -2,74 |
| 15 | Irmãos Eevee | Eevee + Vaporeon + Jolteon + Flareon | +8% | 48% → 56% | +0,07 → +0,10 |
| 16 | Museu de Pewter | Omanyte, Kabuto e Aerodactyl (famílias), os 3 | +8% | 66% → 69% | +0,78 → +1,12 |
| 17 | Jardim de Celadon | 2 de Victreebel, Tangela, Vileplume (famílias) | +5% | 43% → 34% | -0,75 → -0,63 |
| 18 | Ninjas de Fuchsia | 2 de Weezing, Muk, Venomoth (famílias) | +5% | 42% → 45% | -0,55 → -0,29 |
| 19 | Mente de Saffron | 2 de Alakazam, Mr. Mime, Venomoth (famílias) | +5% | 56% → 49% | +0,18 → -0,03 |
| 20 | Quiz de Cinnabar | 2 de Arcanine, Rapidash, Magmar (famílias) | +5% | 61% → 61% | +0,74 → +0,93 |
| 21 | Chefe Giovanni | Persian + Nidoking ou Nidoqueen + Rhydon ou Dugtrio | +6% | 45% → 38% | -0,32 → -0,14 |
| 22 | Gelo de Lorelei | 2 de Dewgong, Cloyster, Slowbro, Jynx, Lapras | +5% | 29% → 33% | -1,46 → -0,74 |
| 23 | Punhos do Bruno | Machamp + Hitmonlee ou Hitmonchan + Onix | +6% | 35% → 42% | -0,73 → -0,65 |
| 24 | Torre Pokémon | 2 de Gengar, Golbat, Arbok, Marowak (famílias) | +5% | 25% → 42% | -1,55 → -0,82 |
| 25 | Dragões do Lance | Dratini/Dragonair/Dragonite + Gyarados ou Aerodactyl | +5% | 58% → 64% | +0,40 → +0,68 |
| 26 | Cabo Link | Um par de exclusivos de versão no mesmo time (5 pares) | +4% | 57% → 65% | +0,34 → +0,76 |

Linhas com "com" menor que "sem" são o ruído do caminho da partida (o bônus nunca tira atributo): o número que vale é
a média lá de cima.

## O que o código da fase 2 precisa (quando o Miguel aprovar)

- `LinkDef` ganha `secret?: true`; as secretas entram em `LINKS` (o motor já pega o maior bônus por titular e o
  combo via `comboLink`). Mestre e Aprendiz e Família Completa são geradas por família (`evolvesTo`), não escritas à
  mão. A Turma usa grupos "qualquer um do time da Misty/Brock".
- Carta = campo: o bônus aparece na carta e no painel; o **nome** fica escondido até a descoberta. Tirar as secretas
  de `src/ui/help/content.ts`, `CardModal` (`linksOf`), `nearLinks` da química do UT e do `newLinks` do draft (lá
  vira "???" com o número). O chip "???" da escalação ganha o `+N%`.
- A descoberta passa a contar também no combo (passe de um, chute do outro), além do lance entre rivais.
- `ENGINE_VERSION` + `npm run edge:liga` + deploy da `liga`; calibrate n=400 no número final.
- Missão `rocket`-like (título pela última) fica pra depois.

## Decisões pro Miguel

1. A régua de bônus (+3/4 comuns, +5 de 2 famílias, +6 de 3 certos, +8 raras) serve? Ou tudo +4%?
2. Mestre e Aprendiz liga em 53 famílias e é a 1ª descoberta mais provável: fica com +3% ou só tela?
3. Rival Azul pede só 2 de 6 famílias comuns (Growlithe, Magikarp, Pidgey…): sobe pra 3 ou fica +4%?
4. Combo de passe e chute em todas, ou só nas de 2–3 membros certos (as de "2 de N" só com o bônus)?
