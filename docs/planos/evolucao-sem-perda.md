---
description: Auditoria dos 72 pares de evolução (quem fica pior que a pré-evolução) e 3 regras de conserto pro Miguel decidir.
---

# Evolução sem perda: auditoria e regras propostas (09/11/2026)

Pedido do Miguel: "O Magikarp tem mais velocidade que a evolução? Isso não deveria acontecer. Confira se isso não
acontece com nenhum outro Pokémon." **Decidido em 09/11: B + C (versão estreita), aplicado no motor 28** (seção no fim).

Script: `npx tsx scripts/balance/evo-audit.ts` (atributos de `computeAttributes`, caminho de `evolveInstance`, bônus de
`attributeModifiers`; nível 50). Rodar de novo depois de aplicar uma regra mostra o que sobrou.

## O que a auditoria achou

72 pares de evolução nos 151 (Eevee com as 3 pontas, pedras, troca e as ramificações que existem na Gen 1). **6 pares
ficam piores em algum atributo**; nenhum piora em PAS, FOR, LEI, FOL ou GOL. Eevee, Slowpoke, Oddish, Abra, Machop,
Geodude, Gastly e as pedras estão limpos.

| Par | Espécie pura (carta do pacote) | Carta que evoluiu (+2) | Com a habilidade | Por quê |
|---|---|---|---|---|
| Poliwhirl → Poliwrath | VEL 82→64, DRI 72→64 | VEL 82→66 (−16), DRI 72→66 | Swift Swim nos dois: VEL 89→71 | Velocidade base 90→70 nos jogos + porte maior |
| Weedle → Kakuna | VEL 48→32, DRI 43→32, CHU 26→25 | VEL 48→34 (−14), DRI 43→34 | Run Away some: VEL 51→34 (−17) | Casulo: velocidade base 50→35 nos jogos |
| Caterpie → Metapod | VEL 44→29, DRI 40→30 | VEL 44→31 (−13), DRI 40→32 | Run Away some: VEL 47→31 (−16) | Casulo: velocidade base 45→30 nos jogos |
| Magikarp → Gyarados | VEL 73→70 | VEL 73→72 (−1) | **Swift Swim some: VEL 79→72 (−7)** | Velocidade base igual (80→81), mas Gyarados é gigante (−4 de agilidade) e perde o Swift Swim (+8%) |
| Poliwag → Poliwhirl | VEL 86→82 | VEL 86→84 (−2) | Swift Swim nos dois: VEL 93→91 | Mesma base (90); o Poliwag tem corpo de "pernas" (+3) e é menor |
| Metapod → Butterfree | DES 42→41 | — (o +2 cobre) | — | Defesa base 55→50 |

**Nota por posição:** só 2 vagas caem ao evoluir na mesma vaga: Caterpie → Metapod na Ala (36 → 32) e Weedle → Kakuna
na Ala (37 → 32). O Magikarp não cai em vaga nenhuma (Ala vira 74, Pivô 84): o problema dele é só o número de VEL na
carta.

Leitura: 4 dos 6 são fiéis aos jogos (casulos e Poliwrath ficam mais lentos de verdade). O Magikarp é o único em que o
jogo cria a perda sozinho (porte + habilidade), e é o mais visível porque o Gyarados é épico.

## Regras de conserto

Todas mexem em `src/engine` e mudam partida: **sobe `ENGINE_VERSION`**, `npm run edge:liga` + deploy da `liga`, e
`npm run calibrate -- --n 200` antes/depois (não rodei: 6 espécies, só o Gyarados é muito jogado; a expectativa é ficar
dentro do ruído, mas o número vem com a regra escolhida).

### A. A espécie evoluída herda o máximo de cada atributo da pré (vale pro pacote também)

`computeAttributes`: atributo = máx(próprio, o da pré-evolução já ajustada). 6 espécies, 91 pontos.

| Espécie | Sobe | Posições | Nota principal | Notas que mudam |
|---|---|---|---|---|
| Gyarados | VEL +3 | igual (PIV/GOL/FIX) | 82 → 82 | nenhuma |
| Poliwrath | VEL +22, DRI +8 | igual (GOL/ALA) | 91 → 91 | ALA 71→77, PIV 58→60 |
| Poliwhirl | VEL +4 | igual (ALA/GOL) | 67 → 68 | ALA 67→68 |
| Metapod | VEL +15, DRI +10 | GOL/FIX/PIV/ALA → **ALA**/PIV/GOL | 38 → 37 | ALA 30→37, GOL 38→37, FIX 35→33 |
| Kakuna | VEL +16, DRI +11, CHU +1 | FIX/PIV/GOL/ALA → **ALA**/PIV/FIX | 34 → 38 | ALA 30→38, GOL 33→26 |
| Butterfree | DES +1 | igual | 67 → 67 | nenhuma |

Contra: muda a carta do pacote (draft) e tira a identidade de "casulo parado" do Metapod/Kakuna (viram Ala). Não
resolve o Magikarp em campo sozinho (Swift Swim: 79 contra 75).

### B. Só a carta que evoluiu em quadra herda o máximo (o pacote fica igual)

`viewInstance`: com `evolved > 0`, cada atributo = máx(forma nova, forma de antes) + 2 por evolução. 6 pares mudam,
nenhuma carta do pacote muda.

| Par | Sobe na carta evoluída | Nota na vaga em que evoluiu | Principal |
|---|---|---|---|
| Magikarp → Gyarados | VEL +3 (72 → 75) | ALA 74 → 74 | PIV 84 → 84 |
| Poliwhirl → Poliwrath | VEL +18, DRI +8 | ALA 73 → 78 | GOL 93 → 93 |
| Poliwag → Poliwhirl | VEL +4 | ALA 69 → 70 | ALA 69 → 70 |
| Caterpie → Metapod | VEL +15, DRI +10 | ALA 32 → 39 | GOL 40 → ALA 39 |
| Weedle → Kakuna | VEL +16, DRI +11, CHU +1 | ALA 32 → 40 | FIX 36 → ALA 40 |
| Metapod → Butterfree | DES +1 | GOL 58 → 58 | ALA 69 → 69 |

A favor: conserta exatamente "a carta evoluiu e ficou pior", sem mexer no draft; o Gyarados evoluído passa a ter VEL
75 contra 73 do Magikarp. Contra: o Gyarados que evoluiu fica diferente do Gyarados do pacote além do +2 (já é,
pela posição herdada). Ainda perde pro Swift Swim do Magikarp em campo (79 contra 75) sem a C.

### C. A carta que evolui mantém a habilidade antiga quando a forma nova não tem ela

`evolveInstance`: hoje troca pra primeira habilidade da forma nova (30 combinações trocam, ex.: Magikarp Swift Swim →
Gyarados Intimidate, Eevee Adaptability → Vaporeon Water Absorb). Melhora 3 casos de atributo: Magikarp VEL 79→72 vira
79→78; Caterpie e Weedle (Run Away) perdem 2 pontos a menos. Junto com a B, **nenhum dos 6 pares fica pior em campo**
(Gyarados com Swift Swim: VEL 81 contra 79 do Magikarp).

Contra: muda o que a habilidade faz em 30 combinações (Jolteon com Run Away em vez de Volt Absorb, Gyarados sem
Intimidate). Variante menor: manter só quando a habilidade perdida mexe em atributo (Swift Swim, Run Away, Hustle,
Levitate, Anticipation, Compound Eyes). Cartas que já evoluíram em saves antigos ficam com a habilidade que têm.

## Recomendação

**B + C (variante menor).** Conserta o que o Miguel viu (a carta evoluída nunca fica pior, nem na carta nem em campo),
não mexe em nenhuma carta do pacote nem no draft e não apaga a identidade dos casulos. A sozinha muda o pacote e não
resolve o Magikarp.

## Decisões pro Miguel

1. Regra: A, B, C, B + C (recomendada) ou deixar como está (4 dos 6 são fiéis aos jogos).
2. Na C: manter qualquer habilidade perdida, ou só as que mexem em atributo?
3. Depois do ok: aplicar, `ENGINE_VERSION`, Edge Function `liga`, calibrate n=200 antes/depois e n=400 no final.

## Decidido com o Miguel (09/11)

**B + C (versão estreita), aplicado no motor 28** (branch `evo-selo`).

- **B:** a carta guarda as espécies de antes em `evolvedFrom` (campo novo com padrão; carta do pacote e saves antigos
  não têm, sem migração). `instanceBase` (src/engine/instance.ts) dá o máximo de cada atributo entre a forma de agora e
  as de antes; carta, painel, escalação e motor usam ele (`viewInstance`, `attributeModifiers`, `createPlayer`). A
  posição principal sai dos atributos já com o máximo. A tela de evolução também não mostra mais ▼.
- **C estreita:** `abilityAfterEvolution` (src/engine/evolution.ts) mantém a habilidade quando a forma nova não tem ela
  e ela mexe em atributo (`mods` em `ABILITY_EFFECTS`: Swift Swim, Run Away, Hustle, Levitate, Anticipation, Compound
  Eyes...). A que não mexe em atributo troca como antes (Eevee Adaptability → Vaporeon Water Absorb).
- Duelo e fichário levam `evolvedFrom` na receita; o validador só aceita forma de antes da própria linha (no máximo
  uma por evolução) e a habilidade herdada só com ela.
- Teste: `src/engine/evolution.test.ts` ("evolução sem perda"): os 6 pares com toda habilidade, na carta e em campo, e
  os 72 pares na carta. Falha sem a regra (4 testes).

### Os 6 pares, antes ⇒ depois (carta evoluída, nível 50, habilidade da pré)

| Par | Habilidade | VEL na carta | VEL em campo | DRI na carta | Nota na vaga em que evoluiu | Principal |
|---|---|---|---|---|---|---|
| Magikarp → Gyarados | Swift Swim (fica) | 73 → 72 ⇒ **73 → 75** | 79 → 72 ⇒ **79 → 81** | 59 → 64 | ALA 74 | PIV 84 |
| Poliwhirl → Poliwrath | Swift Swim | 82 → 66 ⇒ **82 → 84** | 89 → 71 ⇒ **89 → 91** | 72 → 66 ⇒ **72 → 74** | ALA 73 ⇒ 78 | GOL 93 |
| Poliwag → Poliwhirl | Swift Swim | 86 → 84 ⇒ **86 → 88** | 93 → 91 ⇒ **93 → 95** | 71 → 74 | ALA 69 ⇒ 70 | ALA 70 |
| Caterpie → Metapod | Run Away (fica) | 44 → 31 ⇒ **44 → 46** | 47 → 31 ⇒ **47 → 49** | 40 → 32 ⇒ **40 → 42** | ALA 32 ⇒ 39 | GOL 40 ⇒ ALA 39 |
| Weedle → Kakuna | Run Away (fica) | 48 → 34 ⇒ **48 → 50** | 51 → 34 ⇒ **51 → 53** | 43 → 34 ⇒ **43 → 45** | ALA 32 ⇒ 40 | FIX 36 ⇒ ALA 40 |
| Metapod → Butterfree | Shed Skin → Compound Eyes | 29 → 69 | 29 → 69 | 30 → 70 | GOL 58 | ALA 69 (DES 42 → 43 ⇒ 42 → 44) |

`npx tsx scripts/balance/evo-audit.ts` depois da regra: carta evoluída pior em algum atributo **0 de 72** (era 6),
com habilidade **0** casos, vagas em que a nota cai **0** (eram 2). A espécie pura (carta do pacote) continua com as 6
diferenças, de propósito.

### Calibrate (n = 200, mesma semente)

| Métrica | Motor 27 | Motor 28 |
|---|---|---|
| Gols/jogo (meta 5–7) | 7,59 | 7,58 |
| Empates no tempo normal | 15,5% | 15,0% |
| Goleadas (6+) | 5,0% | 5,0% |
| Mais forte (Δ≥3) vence (meta 60–65%) | 65,7% | 65,7% |
| Evoluções/jogo | 0,57 | 0,56 |
| Vitórias por tática (contra/equil./def./ofens.) | 45/51/46/59% | 45/52/47/57% |

Dentro do ruído, como esperado: só 6 pares e as habilidades que mexem em atributo mudam. n = 400 fica pro número
final do lançamento.
