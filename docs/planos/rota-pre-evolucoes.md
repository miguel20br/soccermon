---
description: Rota Índigo começando com pré-evoluções (a "copa baby") e semente travada anti-reset; como é hoje, proposta, números simulados e decisões pro Miguel.
---

# Rota Índigo: pré-evoluções e semente travada

Pedido do Miguel (22/10/2026): a Rota começa com o time fraco e cresce, e sair e voltar não pode re-sortear as opções. Segue a ideia de [rota-progressao.md](rota-progressao.md) (que tentava o mesmo com teto de nota e vagas), agora usando o que o jogo já tem: **a linha evolutiva**. **Nada disso foi aplicado.** Só o script de simulação ganhou a opção `baby`.

## Como é hoje

- **Tudo sai da seed da copa.** `newRun` (`src/store/game-store.ts:1134`) sorteia a seed com `Math.random()` e guarda em `run.seed`. Mapa (`buildCupMap(seed)`), capitães (`captain-r<rerollsUsed>`, linha 531), draft (`draft-<rodada>-<vaga>-r<rerollsUsed>`, linha 537), recompensas (`rewardOptions`, `src/engine/rewards.ts`) e rivais (`longOpponent`) são funções puras da seed. A partida também (`<seed>-stage-<n>`).
- **Sair e voltar não re-sorteia.** O `run` inteiro (com `options` e a vaga travada) vai pro save em IndexedDB; a vaga fica travada até escolher (`chooseSlot`, linha 1201). Re-sortear dentro da copa só com o reroll (2 por copa, entra na chave por `rerollsUsed`).
- **O re-sorteio de verdade é a copa nova.** Abandonar (`abandonRun`, linha 1182), perder ou ganhar e apertar "jogar de novo" (`Result.tsx:156`, `Home.tsx:176`) chama `newRun` sem seed, e `Math.random()` dá outra. Quem não gosta do capitão abandona e tenta de novo até vir um bom: hoje 71% dos capitães da Rota têm 85+.
- O draft da Rota já começa uma linha de raridade abaixo (`rollOptions`, linha 539), mas o capitão continua raro+ (média 87,1) e `playerDraftOptions` ainda garante prata e uma "promessa" por rodada.
- **Evolução:** só em partida (barra de 14 pontos, `EVO_THRESHOLD`), e o Treino e a Creche enchem metade da barra (`train`, `long-events.ts`). O robô evolui ~1 por copa. `Species.prevo` existe para todos os 151.

## Os 151 e a linha evolutiva

| Grupo | Quantos | Nota média (melhor vaga) |
|---|---|---|
| Forma-base de linha que evolui | 54 | 55,1 |
| Já evoluídos (têm `prevo`) | 72 | 76,3 |
| Sem linha dentro dos 151 | 25 | 60 a 93 |

Exemplos de nota: Charmander 53 → Charmeleon 67 → Charizard 84; Magikarp 44 → Gyarados 84; Dratini 48 → Dragonite 89; Machop 53 → Machamp 91; Eevee 51 (evolução fixa pelo uid).

Os 25 sem linha: Farfetch'd 60, Onix 70, Tangela 68, Porygon 67, Hitmonlee 74, Chansey 76, Hitmonchan 77, Mr. Mime 77, **Tauros 77**, Lickitung 79, Scyther 80, Jynx 81, Pinsir 82, Magmar 82, **Lapras 83**, Electabuzz 83, Aerodactyl 81, Kangaskhan 87, Snorlax 91, os três pássaros lendários (86 a 89), Mewtwo 93, Mew 91 e o Ditto 43. Onix, Scyther, Chansey e companhia "evoluem" só em Gen 2, que não existe aqui.

## Proposta

**Draft da Rota (só `isLong`):** cada opção que sai de `playerDraftOptions` e `captainOptions` vira a **forma-base da linha** dela (Charizard sai como Charmander, Machamp como Machop). Se a base já está no time ou já saiu na mesma rodada, fica a forma original. Fica no store/UI da Rota; `draftOptions` e `aiDraftTeam` não mudam, então rival, Liga, Duelo e `ENGINE_VERSION` ficam como estão.

**Quem não tem pré-evolução (Tauros, Lapras, Snorlax, lendários):** hoje a simulação os deixa como estão, o que deixa o "baby" mais forte do que seria. Proposta: **fora do draft inicial e do capitão**, entram a partir do Baú, do reforço do 3º jogo em diante e do Treino final (rodada de raridade ≥ 3), ou seja, como o "reforço de meio de Rota". Os fracos (Farfetch'd, Onix, Tangela, Porygon, Ditto) podem sair já no começo, porque não passam de 70.

**Evolução durante a Rota:** nada novo e nada automático (regra do Miguel: nada automático no time do jogador). Vale o que existe: a barra enche na partida, o Treino e a Creche dão metade, e o Treino final no Planalto vira o ponto de "agora vai". A carta de base mostra o selo "vira 84" (já existe) pra o jogador escolher quem aposta. Contratados do adversário e reforços seguem completos: é por eles que o time cresce de fato.

**Semente travada:** guardar no save um contador de Rotas por jogador e derivar a seed dele: `rota-<sal>-<n>`. O `n` só sobe quando a Rota **termina** (título ou eliminação). Abandonar e começar de novo traz **a mesma Rota** (mesmo mapa, capitães, draft, recompensas e rivais), nunca outro sorteio. Fica no `Records` como campo opcional (`routeLock?: { salt: string; n: number }`, `salt` sorteado uma vez por aparelho/conta): campo opcional **não precisa subir `SAVE_VERSION` nem de migração** (ausente = n 0, sal sorteado na primeira Rota). Na nuvem (Supabase) o merge fica com o maior `n` e o sal da conta mais antiga; um teste cobre o merge. `?seed=` (desafio) e Copa do Dia seguem com a seed delas, já fixas.

O que a trava **não** impede: apagar os dados do navegador sem conta. E refazer a mesma Rota abandonada com escolhas diferentes é permitido (a diferença de decisão muda o resto): o que some é o "re-sorteio até vir bom".

## Antes e depois (n=200, robô "Monta pra mim", tática equilibrada, sem MT)

Script: `OPCAO=baby [EVO_AT=2] [CAP_FULL=1] SIM=200 scripts/pesado.sh npx vitest run scripts/balance/rota-progressao.sim.test.ts`, tabelas com `rota-progressao-agg.ts`. Erro de ±3,5 pp por taxa. Os 25 sem linha **ficam** nas opções (pior caso pro "baby"). "Hoje" saiu 28% de título nesta rodada contra 25% da anterior: é o ruído.

Nota média do time (5 titulares) por partida e vitória:

| Partida | Hoje | Baby (tudo) | Baby + evolução forçada na Rota 2 | Baby, capitão normal |
|---|---|---|---|---|
| Rota 1 | 79,2 · 73% | 67,8 · 46% | 67,8 · 46% | 69,7 · 52% |
| Rota 2 | 80,5 · 69% | 72,0 · 48% | 72,0 · 48% | 74,1 · 47% |
| Rota 3 | 83,0 · 71% | 81,1 · 62% | 82,2 · 63% | 82,2 · 70% |
| Rota 4 | 83,9 · 58% | 82,9 · 63% | 83,5 · 61% | 83,8 · 62% |
| Grupo 1 a 3 | 84,7 a 85,7 | 84,4 a 85,5 | 84,7 a 85,8 | 85,0 a 86,1 |
| Final | 86,8 · 65% | 86,7 · 62% | 86,7 · 70% | 87,3 · 67% |
| Rival (R1, R2, R3, R4, Final) | 65,3 / 71,2 / 71,6 / 77,4 / 84,5 | igual | igual | igual |
| Draft (média) · capitão | 79,2 · 87,1 | 67,8 · 76,6 | 67,8 · 76,6 | 69,7 · 87,1 |
| Chega ao Planalto · Final · **título** | 60% · 42% · 28% | 37% · 28% · **17%** | 37% · 27% · **19%** | 40% · 26% · **17%** |

Leitura:
- O time começa **11 a 12 pontos** mais fraco (79 → 68) e chega ao Planalto no mesmo nível (84 a 85), com o salto grande entre a Rota 2 e a 3 (72 → 81), que é a história de "evoluiu". É exatamente a curva que a [rota-progressao](rota-progressao.md) não conseguiu (lá o time ficava fraco o caminho todo).
- O título cai de ~28% pra 17 a 19%, perto dos ~16% da Copa. Mas a **Rota 1 e a 2 ficam em ~47%** (o rival da Rota 1 é o mais fácil e ainda empata): metade dos jogadores perde uma das duas, e só 37% chegam ao Planalto. A Rota perdoa a 1ª derrota (cartão amarelo), mas ainda é duro. Vale testar rival −1 nessas duas partidas (não simulado ainda).
- Evolução forçada só na Rota 2 muda pouco (+1,1 de nota na Rota 3, título 19% contra 17%, dentro do ruído), então **não vale criar evento novo**.
- Capitão normal sobe o começo (52% na Rota 1) sem mexer no título (17%), mas é ele que dá o "melhor time na primeira partida" que o Miguel não quer.

## Decisões pro Miguel

1. **Sim ao "baby" na Rota?** (draft inicial na forma-base da linha). Recomendo **sim**: curva certa e título perto da Copa.
2. **Capitão também em forma-base?** Recomendo **sim** (Charmander capitão que vira Charizard é a cara da ideia); a alternativa é capitão cheio, com Rota 1 em 52% e o mesmo título.
3. **Sem pré-evolução (Tauros, Lapras, Snorlax, lendários):** recomendo **fora do draft inicial e do capitão**, entram como reforço do meio da Rota em diante (Baú, reforço do 3º jogo, Treino final); só os de nota ≤ 74 no começo.
4. **Evolução:** recomendo **só a natural** (partida, Treino, Creche) e o selo "vira N" na carta. Sem evento forçado.
5. **Contratados do adversário e reforços** continuam completos? Recomendo **sim**.
6. **Rival da Rota 1 e 2 um nível mais fraco (−1)** pra Rota 1 sair de ~47% pra perto de 60%? Recomendo **sim**, medindo de novo com n=400 antes de subir.
7. **Semente travada:** `n` sobe só quando a Rota termina (não ao abandonar)? Recomendo **sim**, no `Records.routeLock`, sem subir `SAVE_VERSION`. E a Copa rápida, o Duelo e a Liga ficam como estão? Recomendo **sim** (só a Rota).
8. **Se a Rota abandonada volta idêntica** (inclusive o resultado das partidas, pela seed da partida com o mesmo time): ok, ou o abandono muda a seed das partidas (só o sorteio do draft fica travado)? Recomendo **ok idêntica**; é o mais simples e mata a manha de recomeçar até vir um bom sorteio.

## O que fica pra implementar (depois do ok)

- Flag da Rota em `rollOptions`/`rollCaptains` (e no auto-draft "Monta pra mim", que passa por eles) trocando a opção pela base da linha; função `rootOf` fica em `src/engine/draft.ts` ou `src/store/long-cup.ts`, com teste (Charizard sai Charmander; não repete espécie; mesma seed, mesmas opções).
- Filtro dos sem-linha no começo e liberação por rodada de raridade.
- `Records.routeLock` + `newRun` da Rota usando a seed derivada + avanço do `n` em `finishRun`/eliminação; teste que falharia sem isso: abandonar e começar de novo dá o mesmo capitão. Merge da nuvem.
- Rival −1 nas partidas 0 e 1 (`LONG_DIFFICULTY`) se aprovado, medir n=400, textos (Novidades) e patch notes. `ENGINE_VERSION` não sobe (resultado de partida com os mesmos times não muda).
- O Miguel jogar umas Rotas na prévia: simulação não mede diversão.

## Implementado na branch `rota-baby` (23/10/2026): código e números finais

O Miguel aprovou as 8 decisões como recomendadas (23/10). Entrou: `rootOf`, `babyOptions` e `ROUTE_START_BANNED` em `src/engine/draft.ts`; `rollOptions`/`rollCaptains` da Rota usam a forma-base e banem os sem-linha com nota acima de 74 (o "Monta pra mim" passa pelos mesmos caminhos); `LONG_DIFFICULTY[1]` de 0 para -1; `Records.routeLock` (`rota-<sal>-<n>`, `n` sobe só quando a Rota termina, `mergeRecords` fica com o maior `n`, empate no menor sal); `newRun('longa')` sem `?seed=` usa a seed travada. Sem `SAVE_VERSION`, sem `ENGINE_VERSION`. Testes: `src/store/rota-baby.test.ts`.

Nota: a **Rota 1 já estava no piso** (dificuldade -1 é o mínimo do `aiDraftTeam`), então "rival -1" só muda de verdade a Rota 2. Baixar mais a Rota 1 pede piso novo no `aiDraftTeam` (decisão à parte).

### Antes e depois (n=400, robô "Monta pra mim", equilibrada, sem MT)

`SIM=400 OPCAO=hoje scripts/pesado.sh npx vitest run --maxWorkers=2 scripts/balance/rota-progressao.sim.test.ts` (antes: `main`; depois: a branch). Erro de ±2,5 pp por taxa.

| | Antes (main) | Depois (branch) | Meta da proposta |
|---|---|---|---|
| Nota inicial do time (média dos 5) | 79,5 | **62,2** | ~68 |
| Capitão | 87,2 | 62,9 | ~77 |
| Nota no Planalto (Grupo 1) | 84,7 | 84,4 | 84 a 85 |
| Vitória Rota 1 | 74% | **29%** | 50 a 60% |
| Vitória Rota 2 | 68% | 52% | 50 a 60% |
| Vitória Rota 3 · 4 | 66% · 61% | 64% · 56% | |
| Grupo 1 · 2 · 3 | 62 · 61 · 59% | 63 · 57 · 54% | |
| Final | 66% | 57% | |
| Chega ao Planalto · Final · **título** | 60% · 41% · 27% | 31% · 19% · **11%** | título 15 a 22% |

**Fora da faixa: Rota 1 (29%) e título (11%). Não ajustei nada, parei aqui.** Por quê: a simulação da proposta deixava os 25 sem-linha nas opções (Scyther, Hitmonlee, Kangaskhan...), e foram eles que seguraram o começo em 68 e o capitão em 77. Com a decisão 3 aplicada (fora do começo os de nota acima de 74) o time sai em 62 e o capitão em 63: o salto até o Planalto continua (62 → 84, mesma chegada de hoje), mas a Rota 1 vira moeda ao vento contra o rival do piso (65,1). Opções pro Miguel, sem aplicar nenhuma: (a) deixar os sem-linha fracos-médios no começo (teto de 74 vira ~80); (b) capitão de base com 1 carta "dona de linha" garantida; (c) piso novo (-2) pro rival da Rota 1; (d) aceitar (título 11% é abaixo da Copa rápida, ~16%).

### Prints (headless, 390x844 e 1440x900)

Draft da Rota com formas-base (Squirtle, Koffing e Exeggcute de capitão; Oddish, Paras e Magikarp com o selo "vira N"). Uma carta evoluída sai quando a base dela já está na mesma rodada (Seel + Dewgong), como previsto.
`scratchpad/baby-prints/2-capitao-390.png`, `4-draft-390.png`, `4-draft-1440.png` (fora do repo).

### Rascunho das Novidades (não entrou em `patch-notes.ts`)

Título: "Rota de baby"
- A Rota Índigo agora começa na forma-base: o capitão e o draft saem como Charmander, Machop, Magikarp, e o time evolui pelo caminho
- Os mais fortes sem evolução (Snorlax, Lapras, Tauros, lendários) só aparecem de reforço, depois do começo
- Sair da Rota e voltar traz o mesmo sorteio: a Rota só muda quando você termina uma
- O rival da 2ª partida ficou mais fraco
