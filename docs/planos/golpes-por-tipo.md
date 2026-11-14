---
description: Auditoria dos golpes dos 151 por tipo, para cada Pokémon ter golpe do seu tipo.
---

# Golpes por tipo: auditoria dos 151 (21/10/2026)

Pedido do Miguel: "Gengar, tipo Venenoso e Fantasma, não tem um ataque venenoso e tem dois psíquicos. Confira se isso
não está ocorrendo em outros Pokémon também."

**Isto é proposta.** Nada foi mudado no código nem nos dados. Toda troca abaixo muda partida (golpe é evento em campo),
então precisa do ok do Miguel e de `ENGINE_VERSION` 6 → 7 (ver "Impacto" no fim).

Scripts (scratchpad, fora do repo), rodados com `npx tsx` a partir da raiz do worktree:
`/tmp/claude-1000/-home-bartolomeu-Projects-soccermon/244f6e33-1322-4600-b6a0-ca8dcc92462f/scratchpad/moves-audit/audit.ts`
(tabela dos sinalizados), `.../moves-audit/detail.ts <id>|all|types` (learnset com tipo, kind e origem) e
`.../moves-audit/propose.ts` (simula as regras 1 e 2 em cima do moveset de hoje).

## Como os golpes de um Pokémon são escolhidos

- **Fixos por espécie, sem seed e sem nível.** `createInstance` (`src/engine/instance.ts:69`) chama
  `defaultMoveset(sp)` (`src/engine/moves.ts:701`). Toda carta de Gengar sai com os mesmos 4 golpes. O `Rng` só sorteia
  habilidade e shiny.
- O conjunto vem do `learnset` da Gen 1 (RBY, nível + MT, em `src/data/pokemon.json`), com o nível de cada golpe em
  `src/data/level-moves.json`. O algoritmo pega, nesta ordem: (0) a **assinatura** (`src/engine/signature-moves.ts`);
  (1) o melhor golpe de dano (STAB ×1,6, nível ≤ teto do estágio ×1,4, MT ×0,75); (2) um de dano de cobertura; (3) um
  utilitário (status > arrancada > buff > debuff > cura); (4) o melhor que sobrou.
- Muda só em dois casos: MT ensinada (`teachMove`, `src/engine/tm.ts`) e evolução (`movesAfterEvolution`, refaz o
  padrão da forma nova e guarda o que foi ensinado). Magikarp tem moveset fixo de propósito (`FIXED_MOVESET`).
- Tipos de espécie e de golpe são os **modernos** (Clefairy é Fada, Magnemite é Elétrico/Aço, Bite é Sombrio, Haze é
  Gelo), mas o learnset é o da Gen 1. Por isso existe Pokémon Fada sem nenhum golpe Fada: a tabela de golpes do jogo
  não tem um único golpe Fada nem Aço.

## Por que o Gengar fica com 2 psíquicos e nenhum venenoso

Gengar hoje: **Dream Eater** (Psíquico), Night Shade (Fantasma), Confuse Ray (Fantasma), **Hypnosis** (Psíquico).

1. A assinatura do Gengar é **Dream Eater** (`src/engine/signature-moves.ts:100`, `94: 'dreameater'`), um golpe
   Psíquico, sem STAB. Ela entra primeiro e é protegida (`isProtectedMove`).
2. O learnset Gen 1 do Gengar **não tem nenhum golpe de dano Venenoso**. O único Venenoso é o **Toxic** (MT, status).
   Sludge existe na tabela do jogo, mas no RBY só Grimer, Muk, Koffing e Weezing aprendem; Sludge Bomb nem existe na
   tabela.
3. O tipo da espécie só pesa no golpe de **dano** (`damageScore`, ×1,6 de STAB). No utilitário (`utilityScore`,
   `src/engine/moves.ts:723`) o tipo não conta nada. E o Toxic leva duas penalidades: é MT "genérica"
   (`GENERIC_TM`, `moves.ts:660`, ×0,6) e não é golpe de nível (sem o ×1,3).
4. Contas da 4ª vaga (`moves.ts:772-778`): Hypnosis = (60 + 25 × 0,6) × 1,3 × 0,9 = **87,8**; Thunderbolt = 67,5;
   Toxic = (60 + 25 × 0,9) × 0,6 × 0,9 = **44,6**. Ganha o Hypnosis, e o Gengar fecha com 2 Psíquicos. Na 3ª vaga o
   Confuse Ray (110,5) já tinha ganhado do Hypnosis (97,5).

Causa de raiz, resumida: **nada no `defaultMoveset` garante um golpe de cada tipo da espécie**. O conjunto
`types` (`moves.ts:771`) olha só os golpes já escolhidos, nunca os tipos do Pokémon. Gastly e Haunter caem no mesmo
buraco.

## O que a auditoria achou

`audit.ts` sinalizou 44 espécies sem golpe de **dano** de algum tipo seu. Separando por gravidade (Magikarp e Ditto
ficam de fora, de propósito):

- **A. Falta qualquer golpe do tipo, e o learnset Gen 1 tem um:** 13 espécies (12 + Butterfree opcional). É o caso do Gengar, e é o conserto
  proposto (regra 1).
- **B. Do tipo, só tem golpe de status, e o learnset tem golpe de dano:** mais 4 espécies (regra 2, opcional).
- **C. Impossível com a Gen 1:** o learnset não tem nenhum golpe do tipo. Só dá pra mudar abrindo exceção fora da Gen
  1. São 16 espécies sem golpe nenhum do tipo, mais 15 que só têm status do tipo.
- Duplicata de um tipo de fora com um tipo próprio faltando (sem contar Normal, que é o tipo da maioria dos buffs):
  Gengar e Haunter (Psíquico ×2) e Mr. Mime (Elétrico ×2: Thunder + Thunder Wave, mas falta Fada, e Fada não existe).
  Script: `.../moves-audit/dup.ts`.

### A. Conserto proposto (regra 1: pelo menos 1 golpe de cada tipo dele)

`*` = golpe de status/utilitário. "MT" = aprende por MT na Gen 1; "Nv" = por nível.

| Pokémon | Tipos | Golpes hoje | Falta | Proposta (antes → depois) | Alternativa |
|---|---|---|---|---|---|
| 94 Gengar | Fantasma/Veneno | Dream Eater, Night Shade, Confuse Ray*, Hypnosis* | Veneno | **Hypnosis → Toxic** (MT) | Confuse Ray → Toxic (mantém o combo Hypnosis + Dream Eater, mas continua com 2 Psíquicos) |
| 93 Haunter | Fantasma/Veneno | Night Shade, Dream Eater, Confuse Ray*, Hypnosis* | Veneno | **Hypnosis → Toxic** (MT) | mesma do Gengar |
| 92 Gastly | Fantasma/Veneno | Lick, Night Shade, Confuse Ray*, Hypnosis* | Veneno | **Confuse Ray → Toxic** (MT; ainda tem 2 Fantasmas) | Hypnosis → Toxic (igual à linha) |
| 41 Zubat | Veneno/Voador | Leech Life, Wing Attack, Confuse Ray*, Supersonic* | Veneno | **Supersonic → Toxic** (MT) | |
| 42 Golbat | Veneno/Voador | Wing Attack, Leech Life, Confuse Ray*, Supersonic* | Veneno | **Supersonic → Toxic** (MT) | |
| 15 Beedrill | Inseto/Veneno | Twineedle, Double-Edge, Agility*, Pin Missile | Veneno | **Double-Edge → Poison Sting** (Nv 1) | Pin Missile → Poison Sting (fica com o Double-Edge; os dois cortam dano) |
| 31 Nidoqueen | Veneno/Terra | Body Slam, Earthquake, Counter*, Bite | Veneno | **Bite → Poison Sting** (Nv 14) | Counter → Toxic |
| 34 Nidoking | Veneno/Terra | Thrash, Earthquake, Focus Energy*, Double Kick | Veneno | **Double Kick → Poison Sting** (Nv 1) | Focus Energy → Toxic (mantém o Double Kick) |
| 32 Nidoran♂ | Veneno | Double Kick, Blizzard, Focus Energy*, Thunder | Veneno | **Thunder → Poison Sting** (Nv 14) | |
| 33 Nidorino | Veneno | Horn Attack, Double Kick, Focus Energy*, Blizzard | Veneno | **Blizzard → Poison Sting** (Nv 14) | |
| 6 Charizard | Fogo/Voador | Flamethrower, Earthquake, Swords Dance*, Fire Blast | Voador | **Fire Blast → Fly** (MT; tinha 2 Fogos) | Earthquake → Fly (o script escolheu essa) |
| 107 Hitmonchan | Lutador | Thunder Punch, Fire Punch, Agility*, Ice Punch | Lutador | **Agility → Counter** (Nv 53, o Counter clássico dele; mantém os 3 socos) | Ice Punch → Submission (MT, golpe de dano) |
| 12 Butterfree | Inseto/Voador | Psybeam, Gust, Poison Powder*, Sleep Powder* | Inseto | opcional: Poison Powder → String Shot (Nv 1) | não recomendo: tira o trio de pós por um debuff fraco |

Efeito colateral: o Fly sai do baú raro de MTs (`rareMovePool`, `tm.ts:103`: lá só entra golpe que ninguém leva no
padrão). Os outros golpes novos (Toxic, Poison Sting, Counter, Submission) já estão no moveset padrão de alguém.

### B. Regra 2, opcional (pelo menos 1 golpe de **dano** de cada tipo, quando o learnset tem)

Cobre tudo da A (menos Zubat, Golbat e a linha do Gastly, que não têm golpe de dano Veneno na Gen 1) e mais 4:

| Pokémon | Tipos | Golpes hoje | Só tem do tipo | Proposta |
|---|---|---|---|---|
| 29 Nidoran♀ | Veneno | Double Kick, Bite, Toxic*, Blizzard | Toxic | Blizzard → Poison Sting (Nv 14) |
| 30 Nidorina | Veneno | Fury Swipes, Bite, Toxic*, Double Kick | Toxic | Bite → Poison Sting (Nv 14) |
| 47 Parasect | Inseto/Planta | Slash, Leech Life, Spore*, Stun Spore* | Spore, Stun Spore | Stun Spore → Mega Drain (MT; Solar Beam é golpe de carga) |
| 71 Victreebel | Planta/Veneno | Razor Leaf, Slam, Poison Powder*, Sleep Powder* | Poison Powder | Slam → Acid (Nv 1) |

### C. Sem conserto dentro da Gen 1

O learnset RBY não tem golpe do tipo. Fica como está, a não ser que o Miguel queira abrir exceção (golpe de Gen
posterior que já exista na tabela do jogo).

| Pokémon | Falta | Existe na tabela do jogo? | Exceção possível (fora da Gen 1) |
|---|---|---|---|
| 35 Clefairy, 36 Clefable, 39 Jigglypuff, 40 Wigglytuff, 122 Mr. Mime | Fada | não há nenhum golpe Fada | só criando golpe novo (Moonblast etc. não existem) |
| 81 Magnemite, 82 Magneton | Aço | não há nenhum golpe Aço | só criando golpe novo |
| 138 Omanyte, 139 Omastar, 140 Kabuto, 141 Kabutops | Pedra | Rock Throw, Rock Slide | Rock Throw ou Rock Slide (não é learnset deles na Gen 1) |
| 142 Aerodactyl | Pedra | Rock Slide | Rock Slide (aprende em Gens seguintes) |
| 123 Scyther, 127 Pinsir | Inseto | Pin Missile, Twineedle, Leech Life | Fury Cutter/X-Scissor não existem; nada com cara deles |
| 130 Gyarados | Voador | Gust, Wing Attack… | nenhum Voador com cara dele (o Bounce é da Gen 4 e não existe) |
| 149 Dragonite | Voador | Wing Attack | Wing Attack (aprende por nível na Gen 2) |

Só com status do tipo, e nenhum golpe de dano possível na Gen 1 (a regra 1 já fica cumprida): Bulbasaur, Ivysaur e
Venusaur (Poison Powder), Caterpie, Metapod, Weedle e Kakuna (String Shot), Venonat e Venomoth (Poison Powder), e
depois do conserto Zubat, Golbat, Gastly, Haunter e Gengar (Toxic).

Exceção que vale discutir: **Gengar com Sludge** em vez de Toxic. Seria um ataque venenoso de verdade, mas fura a
regra "learnset da Gen 1": precisa pôr `sludge` no learnset dele em `pokemon.json`, e isso também libera a MT/baú.

### Golpes estranhos pro sabor da Gen 1 (só pra registrar)

Todos são MTs válidas do RBY, então não são bug, mas destoam:

- **Gyarados com Splash** (vem do Magikarp como Nv 1 nos dados). Splash → Leer (Nv 1), ou fica como piada.
- **Clefairy, Clefable, Jigglypuff, Wigglytuff** com Blizzard, Fire Blast e Thunder de MT, e o Clefairy sem
  **Metronome** (Nv 31, a cara dele). Sugestão: Thunder → Metronome no Clefairy, e Fire Blast → Metronome no Clefable.
- **Machop, Machoke, Machamp** com Fire Blast; **Mankey, Primeape, Nidoran♂, Rattata, Meowth e Persian** com Thunder;
  **Rattata e Raticate** com Blizzard. Dá pra trocar por golpe de nível (Seismic Toss no Machop, Nv 39) se o Miguel
  quiser menos "Pokémon de MT".
- **Pinsir** com dois buffs (Swords Dance + Focus Energy) e nenhum Inseto. Focus Energy → Slash (Nv 49)?

## Recomendação: regra geral

**"Todo Pokémon tem pelo menos 1 golpe de cada tipo dele, se o learnset da Gen 1 tiver; golpe de dano se houver,
senão de status."** É a regra 1 com preferência pelo dano. A assinatura nunca sai, e a troca é dano por dano e
utilitário por utilitário quando dá.

- Mexe em **12 espécies** (as da tabela A; 13 com a Butterfree, se o Miguel quiser). Com a regra 2 junto, sobe pra 16
  (17 com a Butterfree).
- Fazer isso como **regra no `defaultMoveset`** (um passo final, umas 20 linhas, igual ao `propose.ts`) e não como
  lista na mão: vale também pra Gen 2 quando chegar. Junto, um teste: "todo Pokémon tem 1 golpe de cada tipo dele
  quando o learnset tem". O teste falha hoje no Gengar.
- Se o Miguel preferir as escolhas da coluna "Proposta" (algumas diferem do automático: Gastly, Charizard,
  Hitmonchan), dá pra combinar: a regra escolhe sozinha e um `MOVESET_OVERRIDE` pequeno cobre essas 3.

## Impacto

- **Muda partida:** sim. `ENGINE_VERSION` 6 → 7 (`src/engine/config.ts:37`). Os replays guardados dos melhores
  momentos somem (`StageResult.replay`). Também precisa de `npm run edge:liga` e do deploy da Edge Function `liga`, senão
  a Liga recusa as partidas.
- **Saves:** os golpes ficam salvos na carta (`inst.moves`). Quem já tem Gengar no time continua com o Hypnosis até
  evoluir ou até a próxima copa. No **Duelo**, `monProblems` (`src/engine/duel-validate.ts:110`) só aceita
  `defaultMoveset + taught`. Uma carta antiga com Hypnosis seria recusada ("golpes"). Precisa aceitar também o moveset
  da versão anterior ou migrar as cartas salvas.
- **Testes que olham isso:** `engine.test.ts:298` (assinatura em 1º, continua passando) e `tm.test.ts:47` / baú raro
  (o Fly sai do baú).
- **Equilíbrio:** Toxic e Poison Sting são mais fracos que Hypnosis e Double-Edge/Bite. Os Nidos e o Beedrill perdem um
  pouco de dano, e o Gengar troca um sono por um veneno que piora. Antes de aplicar, rodar
  `npm run calibrate -- --n 400` antes/depois e mostrar a tabela pro Miguel (skill `soccermon-balanceamento`).
