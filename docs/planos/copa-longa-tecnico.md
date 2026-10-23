---
description: Plano técnico da Copa longa: estado, mapa, eventos e save.
---

# Copa longa: plano técnico (0.9.1, rascunho de 20/10/2026)

Continuação de [copa-roguelike.md](copa-roguelike.md) e [copa-roguelike-plano.md](copa-roguelike-plano.md) (etapa 2).
Aqui é só o **como**: dados, motor, telas, testes e a ordem. Números (dificuldade, ₽, chance de evento) e a forma do
mapa ficam pro ok do Miguel antes de fechar (skill `soccermon-balanceamento`). Nada de código antes disso.

## 0. Uma conta que não fecha no alvo, e a proposta

O alvo fala em "4–5 andares com 2–3 casas" **e** "8–10 jogos". Se cada andar for uma linha (você entra em 1 casa por
andar), 5 andares dão no máximo 5 casas, e com Mercado/Baú/"?" no meio sobram uns 3 jogos. Pra fechar as duas coisas:

**Andar = 3 linhas** (um "ato" curtinho). Proposta:

| Linha do andar | Casas (2–3 por linha) | Joga? |
|---|---|---|
| 1 | Jogo | sim |
| 2 | Mercado, Treino, Baú, "?" (sorteio, sem repetir tipo na linha) | não |
| 3 | 1 Ginásio (elite) + 1–2 Jogo | sim |

4 andares × 3 linhas + 1 linha de **Treino** (garantido, como o descanso antes do chefe no Slay the Spire) + a
**Final** (Liga Índigo). Todo caminho tem **9 partidas** (8 + Final): a duração fica previsível (~35 min, 4 partidas
hoje ≈ 15 min) e a escolha de rota é "elite ou jogo comum" e "loja, treino, baú ou evento". 14 linhas, ~14 decisões de
rota mais recompensas e Mercados. Tudo em `LONG_CUP` (andares, linhas, casas por linha) num lugar só, pra mexer fácil.

## 1. Modelo de dados

### RunState (src/store/game-store.ts:156)

Campos **opcionais**, como a 0.9.0 fez com `money`/`sponsors`/`shop`/`packs` (o plano da 0.9.0 falava em
`SAVE_VERSION` 10, mas saiu sem: `SAVE_VERSION` continua 9 em game-store.ts:684). Sem campo = Copa rápida.

```ts
/** Sem = Copa rápida. A Copa do Dia nunca é longa. */
mode?: 'longa';
/** Mapa gerado no newRun pela seed (guardado: se o gerador mudar, copa guardada não muda embaixo do jogador). */
map?: CupMap;
/** ids das casas visitadas, em ordem (a última é onde você está). */
path?: string[];
/** uid → partidas que ainda fica fora. */
injuries?: Record<string, number>;
/** Evento "?" ou Treino aberto (status 'event' | 'training'). */
event?: { node: string; id: string; target?: string } | null;
```

- `RunStatus` (game-store.ts:153) ganha `'map' | 'event' | 'training'`. O Baú usa o `'reward'` que já existe e a casa
  Mercado usa o `'shop'`.
- **Invariante que segura quase todo o código de hoje:** `run.stage` continua sendo o **índice da partida** (0..8) e
  `run.opponents[run.stage]` continua sendo o rival da partida atual. Na Copa longa `opponents` cresce: o rival entra
  quando você toca na casa de jogo. Com isso `lockMatch` (:1170), `defeatedOf` (:521), `recordResult` (:1192),
  `liveOf` (:227), o replay e a seed da partida `${seed}-stage-${stage}` (Lineup.tsx:73, Match.tsx:386,
  Moments.tsx:307) funcionam sem mudar.
- `StageResult` (:93) ganha `final?: boolean`, gravado em **toda** partida nova (as duas copas). Conserta de uma vez
  os dois lugares que adivinham a final pelo número (missions.ts:631 e moments.ts:183; ver seção 2).

### Tipos do mapa (src/engine/cup-map.ts)

```ts
export type NodeKind = 'jogo' | 'ginasio' | 'mercado' | 'treino' | 'bau' | 'evento' | 'final';
export interface MapNode { id: string; row: number; col: number; kind: NodeKind; next: number[] }
export interface CupMap { rows: MapNode[][] }
```

~35 casas, poucos KB. As 9 partidas guardam rival, resumo e replay (o replay só quando você fez gol): o save de uma
copa longa fica umas 2× o de uma rápida. Com 3 copas guardadas (`MAX_PARKED`), medir o tamanho do JSON que sobe pra
nuvem (`snapshot()` em src/cloud/cloud.ts:213) antes de lançar.

### Save, nuvem e clientes antigos

| Ponto | O que fazer |
|---|---|
| `migrateSave` (:814) | nada novo: a run passa como está. `runShapeOk` (:667) ganha `o.mode !== 'longa' \|\| Array.isArray(o.map?.rows)` (copa longa estragada é descartada, não trava) |
| Copa guardada (`parkedRuns`) | funciona igual; `cupStep` precisa saber o modo (abaixo) |
| Nuvem: `progressOf` (src/cloud/reconcile-plan.ts:122) | hoje compara `[results, picks, rewards, tick]`. Casa sem jogo (Baú, "?", Treino) não mexe em nada disso: os dois lados ficariam "empatados" e a versão mais adiantada podia perder. Entrar `r.path?.length ?? 0` logo depois de `results.length` |
| `cupSummary` (:213) | levar `mode` e o andar, pra pergunta da conta mostrar "Copa longa · Andar 3" |
| `mergeRecords` (:113) | já junta qualquer número pelo maior: `longTitles`/`longCups` entram sozinhos |
| Cliente antigo (aba aberta da 0.9.0 lendo um save da 0.9.1 pela nuvem) | não dá pra consertar daqui: a 0.9.0 trataria a copa longa como rápida (campeão na 4ª partida pela regra de game-store.ts:1290, ou erro numa tela com status `'map'`). Risco baixo (só aba velha + dois aparelhos). Pra não repetir na Jornada: na 0.9.1, `migrateSave` manda pra `parkedRuns` toda run com `mode` que ela não conhece, e a Home mostra "Atualize o jogo pra continuar esta copa" |

`ENGINE_VERSION` **não sobe**: nada muda dentro da partida (lesão fica fora do motor; ver seção 3). A Edge Function
`liga` não precisa de `npm run edge:liga`.

## 2. Motor

### Gerador do mapa (`src/engine/cup-map.ts`, novo, puro)

`buildCupMap(seed: string): CupMap` com `new Rng(seed, 'map')`. Regras:

1. Linhas como na tabela da seção 0; 2–3 casas por linha (`rng.int(2, 3)`), Treino e Final com 1 casa.
2. Ligações sem cruzar: de uma linha com `a` casas pra uma com `b`, a casa `i` liga nas casas
   `floor(i*b/a) .. ceil((i+1)*b/a)-1` (toda casa tem entrada e saída, e as linhas não se cruzam). Às vezes uma
   diagonal a mais, só se não cruzar.
3. Linha 2 do andar: tipos sem repetir na linha; "?" no máximo 1 por linha; no andar 1 sem Mercado (ainda não tem ₽).
4. Linha 3: sempre 1 Ginásio e pelo menos 1 Jogo, então dá sempre pra fugir da elite.

Testes (`cup-map.test.ts`): mesma seed = mesmo mapa (igualdade profunda); 500 seeds: toda casa alcançável a partir
da linha 0 e com saída até a Final; nenhuma ligação cruza; **todo caminho tem 9 partidas** (enumerar caminhos: são
poucos); regras 3 e 4 valem; Final é a única casa da última linha.

### Rivais por partida

Hoje `buildCupOpponents` (src/engine/cup.ts:122) sorteia os 4 de uma vez num `Rng(seed, 'cup')` sequencial.
**Não mexer nela** (Copa do Dia e desafio por link dependem dessa sequência). Novo, ao lado:

```ts
export function longOpponent(seed: string, stage: number, kind: 'jogo' | 'ginasio' | 'final', faced: string[]): TeamSetup
```

- `Rng(seed, `long-${stage}-${kind}`)`; clube sorteado entre os 9 de `CLUBS` que você ainda não enfrentou (`faced` =
  `run.opponents.map(o => o.name)`), Final = Liga Índigo. 8 partidas antes da Final, 9 clubes: nunca repete.
- Dificuldade por partida (o `aiDraftTeam` de src/engine/draft.ts:236 aceita -1..3, e 4 como na final de hoje):
  proposta `LONG_DIFFICULTY = [-1, -1, 0, 0, 1, 1, 2, 2, 4]`, Ginásio +1 (teto 3), Final 4. Itens: 0 nos dois
  primeiros andares, 1 no 3º e 4º, Ginásio +1, Final 3 (a regra de cup.ts:129 vira tabela).
- **Jogo** = o clube sem o líder no banco (`cupRival` não põe técnico IA; a quadra é a do ginásio). **Ginásio** = o
  clube com o líder (falas, técnico IA com a beira da quadra ligada, MT do ginásio via `equipRivalTms`). Decisão do
  Miguel: ou Jogo vira time de rota (Equipe Rocket, treinadores de Kanto), mas aí são clubes, nomes e i18n novos.
- A prévia no mapa chama `longOpponent` com o mesmo `faced`: o que você vê é o que vai jogar.

### Recompensa, Mercado e pacotes por andar

`rewardOptions` (rewards.ts:23), `shopOffers` (shop.ts:119) e `packCards` (shop.ts:159) usam
`Rng(seed, `reward-${stage}…`)`, `shop-${stage}…`, `pack-${stage}…` e raridade `[3, 5, 6][min(stage, 2)]`. Pra Copa
longa:

- parâmetro opcional `key` (padrão `${stage}`, então **nenhuma stream da Copa rápida muda**) e `round` (raridade).
  Casa Mercado e Baú usam `key = n<id da casa>` (dois Mercados entre as mesmas partidas não repetem a vitrine).
- "Pior no começo, melhor a cada andar" (pedido do amigo): `LONG_ROUND = [1, 3, 5, 6]` por andar (proposta).
- Teste de regressão: `rewardOptions`/`shopOffers`/`packCards` sem `key` dão o mesmo de hoje pra 3 seeds fixas.

### Dinheiro

Na rápida o ₽ da vitória entra ao abrir o Mercado (`afterReward`, :909, com juros). Na longa o Mercado é casa, não vem
depois de toda vitória: o ₽ da vitória (`winEarnings` com `saved = 0`) entra na hora, e os **juros** (`interestOf`)
só quando você entra numa casa Mercado. Senão os juros de 8 vitórias viram bola de neve. `hasShop` (:216) passa a ser
`!run.daily && !run.mode`.

### Os lugares que contam 4 fases

`grep` de `CUP_STAGES`, `stageName`, `stageShort`, `stage === 3`, `stage < 4`, `results.length`. **41 pontos em 27
arquivos.** Quase todos somem com 3 ajudantes em src/engine/cup.ts: `cupLength(run)` (4 ou 9), `isFinalMatch(run)`
(rápida: `stage === 3`; longa: a casa atual é a Final) e `stageLabel(run, stage, lang)` ("Semifinal" ou "Jogo 5 ·
Ginásio de Cerulean").

| # | Onde | O que assume | Conserto |
|---|---|---|---|
| 1 | src/engine/cup.ts:115 | `CUP_STAGES` com 4 nomes | fica pra rápida; longa usa `stageLabel` |
| 2 | cup.ts:116 | `STAGE_DIFFICULTY` de 4 | `LONG_DIFFICULTY` |
| 3 | cup.ts:125 | 3 ginásios + Índigo | `longOpponent` |
| 4 | cup.ts:129 | itens por `stage >= 3` | tabela por andar |
| 5 | src/engine/rewards.ts:44 | raridade `[3,5,6][min(stage,2)]` | `round` |
| 6–7 | src/engine/shop.ts:123, :171 | idem (`SHOP_ROUND`) | `round` |
| 8 | src/store/game-store.ts:1290 | `last = stage === CUP_STAGES.length - 1` | `isFinalMatch` |
| 9 | game-store.ts:488 (`toLineup`), usado em :912 e `leaveShop` | depois da recompensa/Mercado vem a próxima escalação | longa volta pro mapa (`toMap`) |
| 10 | game-store.ts:216 | Mercado depois de toda vitória | `!run.mode` |
| 11 | game-store.ts:998 | todos os rivais na largada | longa nasce com `opponents: []` e `map` |
| 12 | src/store/missions.ts:631 | `stageView`: final = `r.stage === 3` | `r.final ?? r.stage === 3`. **Sem isso a 4ª partida de uma copa longa conta como final nas missões retroativas** (Blue dourado, Ze Ninguém…) |
| 13 | src/ui/moments.ts:183 | `FINAL_STAGE = 3` | `r.final ?? r.stage === 3` |
| 14 | missions.ts:240, :248 (`biker` :440, `artilheiroLendario` :563) | "gols numa copa" medidos em 4 jogos | com 9 jogos fica fácil: contar só a rápida, ou aceitar (decisão) |
| 15 | missions.ts:403 (`ash`) | ≤ 5 gols sofridos na copa | com 9 jogos fica mais difícil; tudo bem |
| 16 | src/store/profile.ts:462 | `HallEntry.scores` "das 4 partidas" | comentário + `mode?` |
| 17 | src/store/trophies.ts:16 | `cupMetal`: "ganhou as 4" | já usa `every`, funciona; separar a taça (seção 6) |
| 18 | src/cloud/reconcile-plan.ts:122 | `progressOf` | + `path.length` |
| 19 | reconcile-plan.ts:213 | `cupSummary` sem modo | + `mode` |
| 20 | src/ui/screens/Match.tsx:205 | `final: stage === CUP_STAGES.length - 1` (impacto "boom" do gol) | `isFinalMatch` |
| 21–22 | Match.tsx:496, :594 | `stageName`, `stageShort[run.stage]` | `stageLabel` |
| 23 | src/ui/components/ResultHero.tsx:115–118 | `stageWon`/`stageIn`/vice na 4ª | `stageLabel` + `isFinalMatch` |
| 24 | ResultHero.tsx:120 | próximo rival = `opponents[stage + 1]` | na longa ainda não existe: mostra "Volta pro mapa" |
| 25–26 | ResultHero.tsx:133, :237 | `stageName` | `stageLabel` |
| 27–28 | ResultHero.tsx:209, :223 | trilha de 4 bolinhas | `cupLength` (9 bolinhas cabem em 320 px a 24 px) |
| 29–30 | src/ui/components/ChampionView.tsx:82, :126 | "vitórias/4", `stageName` | `cupLength`, `stageLabel` |
| 31 | src/ui/components/ChampionExtras.tsx:171 | `stageName` | `stageLabel` |
| 32–34 | src/ui/screens/Home.tsx:115, :149, :246 | `resumeScreen`, passo, trilha de 4 | `'map'`, "Andar 3", `cupLength` |
| 35 | src/ui/components/AccountLink.tsx:14 | `cupStep` → `stageName` | modo + andar |
| 36 | src/ui/screens/Lineup.tsx:131, :168 | `stageName` | `stageLabel` |
| 37 | src/ui/screens/Reward.tsx:78 | "Próxima fase: stage+1" | longa: "Volta pro mapa" |
| 38 | src/ui/screens/Shop.tsx:97 | idem | idem |
| 39 | src/ui/stats/CupStats.tsx:136, :220; src/ui/components/Moments.tsx:334; src/ui/share-card.ts:57 | `stageShort`/`stageName` | `stageLabel`; o card 9:16 com 9 jogos precisa de print |
| 40 | src/ui/components/HallParade.tsx:125 | placares em uma linha | 9 placares quebram em 320 px: print |
| 41 | src/analytics/track.ts:137, scripts/stats.ts:95/:377, scripts/balance/cup.ts:122/:201, src/ui/dev-demo.ts:281, src/ui/help/content.ts:143 (+ textos de help pt :414 / en :391) | 4 fases fixas | `mode` no evento; `FASES` por modo; robô e demo com loop até `cupLength`; Ajuda ganha a Copa longa |

Fora da lista de propósito: src/ui/screens/Daily.tsx:186 (Copa do Dia continua rápida), src/friends/api.ts:325 e
TrophyRoom.tsx:230 (usam `scores.at(-1)`, funcionam), i18n `common.stage`/`stageIn`/`stageWon`/`stageShort`
(pt/en common.ts:123–127, match.ts, result.ts:61, stats.ts) ficam como estão pra rápida.

## 3. Lesão

- `injuries[uid] = n`: fica fora das próximas `n` partidas. Desconta 1 em `recordResult` (só na longa).
- **Bloqueio num lugar só:** `playerTeam` (game-store.ts:503) tira os machucados do **banco** do `TeamSetup`. O motor
  procura quem entra em `s.teams[team].bench` (src/engine/match.ts:3084); fora do banco, não tem como entrar. O painel
  de substituição lê `lockedSetup.bench` (Match.tsx:435): também some de lá. Banco com 1 ou 0 já funciona no motor
  (`halftimeSubs` para no `!inst`, :3101). O `lockedTeam` e o replay ficam com o banco filtrado: partida igual ao rever.
- **Titular machucado:** nada automático. A Escalação (Lineup.tsx:60, `play`) não deixa jogar: botão desligado e aviso
  "Fulano está machucado: troque ele de lugar". `lockMatch` (:1170) recusa também (defesa contra save mexido).
- Regra do evento: só machuca se sobrarem 5 saudáveis (no máximo 2 machucados ao mesmo tempo; o time tem 7). Capitão
  pode machucar? Proposta: não (o capitão tem golpe máximo e o sprite da copa).
- UI: selo "Machucado · 2" com ícone desenhado (traço do `HudIcon`, sem emoji) na carta da Escalação, no banco do
  `TeamPanel` e na prévia do mapa. Cura: Treino ("Fisioterapia") ou item `Poção Máxima` (decisão: item novo ou só o
  Treino).

## 4. Eventos "?"

Dados em `src/engine/cup-events.ts` (puro), efeitos aplicados no store:

```ts
interface CupEvent {
  id: string; weight: number; minFloor?: number;
  when?: (run: EventCtx) => boolean;          // ex.: tem 2 no banco, tem ₽ pra pagar
  choices: { id: string; cost?: number; needs?: 'bench' | 'bench2' | 'any' | 'captain'; effects: Effect[] }[];
}
type Effect =
  | { kind: 'money'; n: number }
  | { kind: 'grant'; what: 'pokemon' | 'item' | 'tm'; round: number }   // rola e passa pelo grant()
  | { kind: 'injure'; matches: number }                                  // alvo sorteado pela seed
  | { kind: 'sponsor' }                                                  // Patrocínio sorteado que você não tem
  | { kind: 'swap'; give: 2; round: number }                             // patrocinador misterioso
  | { kind: 'sellCaptain'; money: number }
  | { kind: 'heal' } | { kind: 'evo'; n: number } | { kind: 'scout' };
```

- Sorteio: `Rng(seed, `event-${nodeId}`)` escolhe o evento (peso, `when`), o alvo e as cartas. Mesma seed + mesmo
  caminho = mesmo evento. Toda lista de escolhas tem uma "Recusar/Seguir" sem efeito.
- Aplicação em `src/store/long-cup.ts` (funções `run → run | null`, testáveis sem o Zustand), reaproveitando
  `grant()` (game-store.ts:447, exportar) e `GainTarget`/fluxos de alvo da Recompensa (quem sai do banco, quem recebe o
  item, golpe esquecido da MT). `gained()` (:896) continua marcando álbum, Ícones e Pokédex com `from: 'evento'`
  (origem nova no `binderAdd`; lembrar da limpeza por origem que quebrou o Mercado no 7c8778e).
- **2 por 1:** dar 2 reservas e ficar só com 6 quebra `playerTeam` (`byUid.get('')!`). Proposta: você dá 2 do banco,
  recebe a carta forte **e** um "Pokémon perdido" bronze (`round` 0): o elenco fica em 7.
- **Capitão por ₽:** o capitão sai, entra um bronze no banco, e o próprio evento pede (a) quem assume a vaga dele (se
  era titular) e (b) o novo capitão. Duas perguntas na mesma caixa; nada escolhido sozinho.
- Validação única `teamOk(run)` (7 cartas, 5 titulares saudáveis, 2 no banco, sem espécie repetida, capitão no
  time); teste roda todo evento × toda escolha em 200 seeds e exige `teamOk`.
- Primeira leva (~8, do plano): patrocinador misterioso, capitão por ₽ (peso baixo), lesão (pagar fisioterapeuta ou
  aceitar), olheiro (ver os 2 próximos rivais), imprensa (₽ ou evo), torcida, treino extra, Pokémon perdido.

## 5. Telas

### Mapa: React + SVG (recomendado), não Phaser

| | React + SVG | Phaser |
|---|---|---|
| Primeiro carregamento | zero (fica no chunk das telas) | puxa o chunk do Phaser (hoje só pré-carregado depois do `load` da Home) |
| Toque, foco, leitor de tela, i18n | `<button>` por casa, de graça | tudo na mão |
| "Nada teleporta" | CSS (traço da rota com `stroke-dashoffset`, 250 ms, `--ease-out`); com Reduzir movimento só fade | tweens |
| Cara | ícones no traço do `HudIcon`/`MenuIcon` (skill `soccermon-marca`) | pixel art do quarto |

- `src/ui/screens/CupMap.tsx` + `cup-map.css`; `Screen` ganha `'map'`, rota em src/App.tsx (perto de :190).
- Celular (320/390): mapa vertical de baixo pra cima, rola sozinho até a linha atual (`scrollIntoView`), casas de
  44 px, faixa de cima com ₽, Patrocínios e "Andar 2 · Jogo 4 de 9". Deitado e desktop: mapa no centro e painel do
  time à direita.
- **Prévia da casa:** tocar abre uma folha embaixo (bottom sheet) com o que tem lá: rival com os sprites e a nota
  (via `longOpponent`), "Mercado", "Treino: curar ou treinar", "Baú: 1 de 3", "?". Botão "Ir" grava o caminho (não
  tem volta). Partida → `pickNode` põe o rival e abre a Escalação.
- **Evento e Treino** dentro do próprio mapa, na caixa de texto dos jogos: `RoomDialog` (src/ui/trophy/RoomDialog.tsx)
  hoje tem 1 `action`; vira `actions[]` (2–3 botões) e muda pra src/ui/components.
- Baú → tela de Recompensa (com `CardPack` se for pacote); Mercado → tela do Mercado; as duas voltam pro mapa.

### Home, retomar e conta

- O tile "Copa longa · Em breve" de src/ui/screens/Home.tsx:312 vira o botão; `newRun(teamName, seed, daily, mode)`
  (:980). Até o ok do Miguel, só aparece com `?longa=1` nas prévias (como `?agencia=1`), constante `LONG_CUP_LIVE`.
- `resumeScreen` (Home.tsx:115): `'map' | 'event' | 'training'` → `'map'`. `runStep` e `cupStep`: "Copa longa · Andar
  3". O cartão "Em andamento" mostra a trilha de 9.
- Desafio por link: `?seed=x&modo=longa` (o `seedFromUrl` passa a ler o modo).

### `?demo=mapa` (src/ui/dev-demo.ts)

Entrar na lista de :48–70 e um ramo como o `demoShop`: `newRun('Demo FC', 'mapa1', undefined, 'longa')`, time
pronto (o mesmo do `campeao`, :265), status `'map'`. Parâmetros: `&andar=3` (caminho já andado até ali, com
resultados de mentira), `&evento=<id>` (abre aquele evento), `&lesao=1` (um titular machucado, pra ver o bloqueio da
Escalação). Atualizar o comentário do topo e a lista de atalhos do CLAUDE.md.

## 6. Recordes, Hall e troféus

| Peça | Proposta |
|---|---|
| `Records` (game-store.ts:296) | `titles`/`cups` continuam contando tudo (missões "campeão", medalha `campeao` em medals.ts:52); novos `longTitles?`, `longCups?` |
| Sequência (`streakAfter`) | conta as duas (um título é um título) |
| `HallEntry` (profile.ts:452) | `mode?: 'longa'`; `HallParade` mostra a etiqueta "Copa longa" e os 9 placares em duas linhas |
| Copa perfeita | mesma regra (`isPerfectCup`, :537): 9 jogos sem sofrer gol, quase impossível, e tudo bem |
| Sala de troféus | taça própria da Copa longa (`cupCounts` separado por `mode`); objeto novo na sala = desenho novo: decisão |
| Missões | 1–2 novas ("Campeão da Copa longa", "Vencer 4 Ginásios numa copa"); `biker`/`artilheiroLendario`: decisão (item 14 da tabela) |
| `run_start`/`match_end`/`run_end` (track.ts) | prop `mode`; eventos novos `map_node` (andar, linha, tipo) e `event_choice` (evento, escolha). **Migração da lista `game_events_name_check` no Supabase de produção, com o ok do Miguel**, como a 20261021200000_eventos_mercado.sql |
| `npm run stats` | seção "Copa longa": taxa de título, onde se perde, rota mais escolhida, eventos e escolhas |

## 7. Testes

- **Unidade (Vitest):** `cup-map.test.ts` (seção 2); `long-opponent.test.ts` (determinismo, sem repetir clube,
  dificuldade sobe); regressão das streams da rápida (`buildCupOpponents`, `rewardOptions`, `shopOffers`,
  `packCards` sem `key` iguais a hoje); `cup-events.test.ts` (`teamOk` em todos os eventos); `long-cup.test.ts` no
  store: copa longa inteira pelo store com escolhas de robô (como o `demo=campeao`), lesão bloqueando `lockMatch`,
  `stageView` com `final`, `progressOf` com caminho, `runShapeOk` com mapa estragado, save → `migrateSave` → igual.
- **Robô (`scripts/balance/cup.ts`):** modo `longa`: anda pelo mapa (Mercado se tem ≥ 10 ₽, Ginásio se a média do
  time passa a do rival, senão Jogo; evento = primeira escolha que não perde nada), roda as 9 partidas. Sai: taxa de
  título, vitória por partida, ₽ gasto, lesões, tempo estimado. Antes/depois pro Miguel, 360 copas, mesmas seeds.
  Uma simulação pesada por vez (`scripts/pesado.sh`).
- **Fumaça (`scripts/smoke/fumaca.mjs`):** `copaLonga()` ao lado de `copa()` (:90): Home → Copa longa (com
  `?longa=1&vel=64`) → "Monta pra mim" → mapa → 1ª casa → partida → resultado → recompensa → mapa de novo; prints em
  390 e 1440. Commit com `Fumaça: /?demo=mapa` pra CI tirar o print do mapa.
- **Trilha completa** (`npm run check:completo`): mexe no save e no fluxo da copa.

## 8. Ordem de trabalho

Cada passo sobe sozinho; até o 7 a Copa longa fica escondida (`LONG_CUP_LIVE`), então a rápida segue igual.

| # | Passo | Esforço | Confere |
|---|---|---|---|
| 0 | Decisões: forma do mapa (seção 0), Jogo x Ginásio, dificuldade, raridade por andar, recompensa depois de todo jogo? | conversa | Miguel |
| 1 | `cup-map.ts` + testes | ½ dia | testes |
| 2 | `longOpponent`, `key`/`round` em rewards/shop/pack + teste de regressão | ½ dia | testes |
| 3 | `StageResult.final` + `isFinalMatch`/`cupLength`/`stageLabel` trocando os 41 pontos (a rápida não muda nada na tela) | 1 dia | prints da rápida iguais |
| 4 | RunState longa + ações (`newRun` com modo, `pickNode`, `toMap`, ₽ na vitória, juros no Mercado) + `progressOf`/`cupSummary` | 1 dia | `long-cup.test.ts` |
| 5 | Tela do mapa + prévia + `?demo=mapa` | 2 dias | **ok do Miguel** (celular, deitado, desktop) |
| 6 | Baú e Treino | ½–1 dia | demo |
| 7 | Lesão (`playerTeam`, Escalação, selo) + eventos + caixa de diálogo com escolhas | 2 dias | **ok do Miguel** nos textos e no `?demo=mapa&evento=` |
| 8 | Recordes, Hall, taça, missões, analytics (migração com ok), placar | 1 dia | migração aplicada antes de publicar |
| 9 | Robô longa + calibragem | 1 dia | **antes/depois pro ok** |
| 10 | Fumaça, Ajuda, inglês, Notas da versão, `LONG_CUP_LIVE = true`, lançamento 0.9.1 | ½ dia | "pode subir" |

Total: uns 10 dias de trabalho de agente. Os passos 1, 2 e 6 podem ir em worktrees paralelos; o 3 mexe em muita tela
e vai sozinho.

## Riscos

1. **41 pontos que contam 4 fases.** Se faltar um, o erro aparece longe (missão retroativa errada, rótulo vazio,
   campeão na hora errada). O passo 3 troca todos pelos ajudantes antes de existir copa longa, com teste e print
   da rápida.
2. **Streams da Copa rápida.** Mudar um nome de `Rng` muda a Copa do Dia e os desafios por link. Só parâmetros com
   padrão + teste de regressão.
3. **Cliente antigo** com save da 0.9.1 pela nuvem: campeão na 4ª partida ou erro de tela. Risco baixo; a guarda de
   `mode` desconhecido protege daqui pra frente.
4. **Evento que deixa o time inválido** (6 cartas, espécie repetida, sem capitão): `teamOk` + o teste de todos os
   eventos.
5. **Duração no celular** (~35 min; 56% jogam no celular, 86% em 8x): o mapa precisa resolver cada casa em ~10 s e a
   copa precisa dar pra guardar e voltar (já dá).
6. **Missões e medalhas infladas** por copas de 9 jogos (`biker`, `artilheiroLendario`): decidir antes de lançar.
7. **Tamanho do save na nuvem** com 9 rivais e replays × 3 copas guardadas: medir no passo 4.
8. **Economia:** sem Mercado depois de toda vitória, ₽ acumula entre as casas Mercado; juros só na casa evitam a bola
   de neve, mas os números precisam do robô.
