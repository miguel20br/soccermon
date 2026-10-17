---
name: soccermon-balanceamento
description: Como medir e propor mudanças de equilíbrio no Soccermon (Pokémon, posições, atributos, golpes, itens, habilidades, táticas, formações, copa, draft) com números de antes e depois pro Miguel aprovar. Use sempre que for mexer em nota, atributo, posição, fórmula, golpe, item, habilidade, tática, formação, dificuldade da copa ou economia do draft, ou quando ele reclamar que algo está forte/fraco.
---

# Balanceamento do Soccermon

Regra do Miguel: **posições, fórmulas e equilíbrio se decidem junto.** Mostre antes ⇒ depois (tabela, Pokémon de
exemplo, números do calibrate) e só aplique depois do ok explícito dele, mesmo dentro de um plano aprovado.
Diversão > realismo: muito gol não é problema. Método completo e histórico em
`docs/planos/balanceamento-geral.md` (leia antes de propor).

## Ferramentas

| O quê | Comando | Tempo |
|---|---|---|
| Calibração geral (gols/jogo, favorito, goleadas, golpes) | `npm run calibrate -- --n 400` | ~1–2 min |
| Formações | `npm run calibrate -- --n 400 --formations` | alguns min |
| Táticas | `--tactics` | **lento demais (45+ min)**: prefira a matriz própria |
| Copa inteira (vitória por fase, título) | `npx tsx scripts/balance/cup.ts 0 1 out.json 150 [nota\|evo]` + `npx tsx scripts/balance/cupagg.ts out.json` | ~10 min por 900 copas |
| Nota × impacto por espécie (teste de troca) | `npx tsx scripts/balance/exp.ts <shard> <nshards> exp-<shard>.json` + `npx tsx scripts/balance/agg.ts <tag> exp-*.json` | **~1h40 pra 29 mil partidas** |
| Precisão num subconjunto | `npx tsx scripts/balance/prec.ts <fit-species.json> <run.json>...` | — |
| Itens em bloco | `npx tsx scripts/balance/fx.ts out.json [N]` | — |
| Economia do draft (bronze/prata/ouro por rodada, capitão) | `npx tsx scripts/balance/econ.ts` | ~1 min |
| Auditoria de posições e atributos dos 151 | `npx tsx scripts/positions-audit.ts` → `?lab=posicoes&revisao=1` | segundos |
| Placar do jogo no ar | `npm run stats [-- --dias 7 \| --md]` | — |

Saídas de script vão pro scratchpad, nunca pro repo.

## Armadilhas que custaram horas

- **Ruído:** com 128 jogos por espécie o erro do resíduo é ±0,27, maior que a diferença entre espécies (±0,25). A
  lista de "fora da curva" da 1ª auditoria era quase toda sorte (correlação 0,27 com a medição seguinte).
  **Confirme cada candidata com 384+ jogos (±0,16)** antes de propor mexer.
- **Memória (7,5 GB):** uma simulação pesada por vez; nada em paralelo; vitest com `--maxWorkers=2`.
- **Atributo escondido:** a nota do Ala não conta chute e a do Pivô não conta velocidade, mas o motor usa os dois.
  Pra corrigir rendimento sem mudar a nota, mexa no atributo que a posição não conta (`SPECIES_TUNING`).
- **Margem de posição (4 pontos):** nerf grande tira posição alternativa (Tauros perde Ala/Fixo). Confira
  `eligiblePositions` depois.
- **A copa só usa o jogador simulado** (escolhe pela nota, não usa MT, joga na equilibrada). Diga isso nas ressalvas.
- Simulação não é diversão: peça pro Miguel jogar umas partidas no link de prévia.

## Onde mexer

- Ajuste por espécie: `SPECIES_TUNING` (pontos em atributo) e `POSITION_OVERRIDES` (posição extra) em
  `src/engine/attributes.ts`, um comentário curto por espécie com o porquê.
- Fórmulas de posição e físico: `DEFAULT_FORMULAS`/`BODY_EFFECTS` (mesmo arquivo); mexer muda a nota de todo mundo.
- Regra única de bônus: `src/engine/modifiers.ts` ("carta = campo": carta, painel e motor usam a mesma).
- Táticas: `TACTIC_MODS` (`src/engine/effective.ts`); formações: `src/engine/formations.ts`; copa: `src/engine/cup.ts`
  e `src/engine/draft.ts`; evolução: `src/engine/evolution.ts`; golpes: `MOVE_TRAITS`/`MOVE_TUNING` em
  `src/engine/moves.ts`; habilidades: `src/engine/abilities.ts`.
- Mudou partida? Suba `ENGINE_VERSION` (`src/engine/config.ts`).

## Formato da proposta pro Miguel

1. O que os dados dizem (com o erro da medida).
2. Tabela antes ⇒ depois por item (nota em cada vaga quando for Pokémon).
3. Efeito geral: calibrate (gols/jogo meta 5–7, favorito 60–65%, goleadas), copa por fase (meta: oitavas ~75–80%,
   final ~50–55%), título.
4. Ressalvas honestas (o que ficou fora da meta, o que ninguém viu a olho).
5. Decisões em lista curta, com a sua recomendação.

Patch pequeno: 3 a 6 mudanças, passos de 1–3 de nota ou 5–10% num efeito, quase tudo buff no fundo da tabela.
Depois do ok, registre em `docs/planos/balanceamento-geral.md` (seção do bloco com a tabela).
