# Tradução para o inglês: o que ficou pendente

A tradução (branch `traducao`) cobriu toda a interface, menos os arquivos que estavam sendo mexidos ao mesmo
tempo por outros dois trabalhos (efeitos dos golpes no motor e MT do ginásio). Para não criar conflito, esses
arquivos não foram tocados. Este documento lista os textos que aparecem na tela e estão neles, com a proposta
em inglês, para terminar logo depois do merge.

> **Status (15/10/2026): concluído.** Tudo abaixo foi feito depois do merge do motor dos golpes; o que sobra
> são só ferramentas de desenvolvimento (ver o Resumo no fim).

## Como terminar

**API (sem dependência nova):**

- `src/i18n/index.ts` (funciona fora do React):
  - `t(chave, vars?)`: texto com `{nome}` trocado. Chaves tipadas: `t('match.halftime', { score })`.
  - `tn(chave, n, vars?)`: plural no formato `"um|vários"` (`{n}` é o número). `plural(formas, n)` faz o
    mesmo com um texto solto; `fmt(texto, vars)` só interpola.
  - `dict()`: dicionário inteiro do idioma atual (listas, estruturas). `getLang()` / `setLang()`.
  - Nomes de dados: `moveName(id)`, `abilityName(id)`, `itemName(id)` (oficiais em inglês, iguais nas duas
    línguas, como o jogo já fazia), `itemDesc(id)`, `moveDesc(id)` (PT: `descPt`; EN: `shortDesc`),
    `abilityDesc(id)`, `typeName(tipo)`, `statusName('par' | código)`, `stageName(fase)`,
    `clubName(nomeSalvo)`, `iconTitle(espécie)`, `formationText(id)`, `linkText(id)` (nome, desc, combo),
    `modLabel()` / `moveModLabel()`, `pct(f)`.
- `src/i18n/react.ts`: `useT()` → `{ lang, d, t, tn }` (redesenha quando o idioma muda) e
  `rich(texto, { nome: <b>…</b> })` para texto com JSX no meio (entende `**negrito**`).

**Onde pôr as chaves:** cada área tem `src/i18n/pt/<area>.ts` (fonte da verdade) e `src/i18n/en/<area>.ts`
(mesmo tipo: faltou chave em inglês = erro no `tsc`). A área nova entra em `src/i18n/pt.ts` e `en.ts`.
Sugestão: `commentary` (narração de `commentary.ts`), `battle` (faixa de batalha e textos na quadra do
`MatchScene.ts` e `cinematics.ts`), `reward` (tela de recompensa e MT) e, no `common` que já existe, as
explicações dos golpes especiais (`SPECIAL_EXPLAIN`).

**Regras:**

- **Português byte a byte igual:** copie o texto atual para `pt/<area>.ts` sem mudar nada (nem pontuação,
  nem o "GOOOOOL"). Quem joga em português não pode ver diferença.
- **Termos Pokémon com o nome oficial em inglês** (batalha, status, golpes, tipos). Nada traduzido de volta
  do português.
- **Phaser e narração estão fora do React:** `MatchScene.ts`, `cinematics.ts` e a classe `Commentator` usam
  o `t()` normal (não o hook). O idioma atual é mantido pelo `settings-sync.ts` (chama `setLang` sempre que
  `settings.lang` muda), então basta chamar `t()` na hora de montar o texto.
- Textos do motor que viram tela (`TACTIC_LABEL`, `CUP_STAGES`, nomes dos clubes, `SPECIAL_EXPLAIN`): o
  dicionário `common` já tem `tactic`, `stage`, `club` com PT idêntico ao do motor. Na tela, troque o uso
  direto por `t('common.tactic.' + id)`, `stageName(i)`, `clubName(nome)`. O motor pode continuar com o
  texto em português (o save guarda o nome do clube em português; `clubName` traduz na exibição).
- `src/store/game-store.ts` já ganhou o campo `lang: 'pt' | 'en'` em `Settings` (padrão pelo navegador via
  `detectLang()`); foi a única mudança nele. Saves antigos sem o campo caem no `detectLang()`.
- Variações sorteadas (`this.pick(...)`) da narração: mantenha o mesmo número de opções nas duas línguas
  para o RNG da narração sortear igual (use arrays no dicionário, `dict().commentary.shots`).

## src/ui/commentary.ts (narração) — FEITO

Área nova `commentary` (`src/i18n/pt/commentary.ts` / `en/commentary.ts`): golpes especiais (`special`), os 36
textos dos traços de golpe novos (`trait`: crítico, carga, Fly/Dig, área, clones, muro...), status (frase pronta
por status: "X is paralyzed! It may be unable to move!", "X fell asleep!", "X was frozen solid!"...), gol, chute,
defesa, trave, desarme, efetividade ("It's super effective!" / "It's not very effective…"), combo (`linkText`),
tática (`common.tactic`, sem `TACTIC_LABEL`), itens, substituição, pênaltis e placar (`2–1` em inglês). As listas
sorteadas têm o mesmo tamanho nas duas línguas (o RNG da narração sorteia igual). **PT conferido byte a byte:**
4.627 linhas de 40 partidas iguais às do código antigo (teste temporário, apagado depois).

## src/game/scenes/MatchScene.ts (caixa de batalha e textos na quadra) — FEITO

Área nova `battle` (`src/i18n/pt/battle.ts` / `en/battle.ts`): status, pênaltis, defesa/trave/gol, "X used Y!",
"But nothing happened!", "X's attack missed!", efetividade, Transform, combo (`linkText`), Substitute, Haze,
Teleport, habilidade, item, evolução ("What? X is evolving!" / "Congratulations! X evolved into Y!"), o "GOL!" do
banner e os textos que sobem da cabeça dos traços novos (`pop`: "CRITICAL HIT!", "IT WAS A CLONE!", "3x!",
"HIT THE WALL!"...) com a linha da caixa de batalha (`line`: "X flew up high!", "X dug a hole!", "Hit 3 times!").
Siglas de status (`PAR`, `BRN`...) e o `C·` do capitão ficam iguais. `src/game/move-fx.ts` não tem texto na tela.

## src/engine/state.ts — FEITO

`TACTIC_LABEL` continua no motor (só como lista de chaves); nenhuma tela mostra mais o texto dele (a narração usa
`common.tactic`).

## src/engine/moves.ts (`MOVE_EXPLAIN` / `SPECIAL_EXPLAIN`) — FEITO

O motor segue em português e não lê idioma. O inglês de todas as explicações (17 especiais + os ~85 golpes com
traço) está em `src/i18n/en/move-explain.ts`, tipado por `ExplainMoveId` (golpe novo no `MOVE_EXPLAIN` sem
inglês = erro no `tsc`). A tela usa `moveExplain(id)` ou, melhor, `moveFutsal(id)` (explicação própria ou o texto
do tipo de golpe da Golpedex). Carta completa, Golpedex, carta da MT e o tooltip dos golpes da carta usam isso nas
duas línguas: em inglês nunca aparece a regra de batalha do Showdown ("Double damage on Dive."). A linha
"Original" da Golpedex só aparece em português (descrição traduzida dos jogos).

## src/engine/cup.ts (clubes e fases) — FEITO

Conferido depois do merge: os nomes dos clubes e das fases do motor continuam iguais às chaves de
`common.club` / `common.stage` (PT idêntico, EN `Pewter Boulders`, `Indigo League`, `Round of 16`...). O save
segue guardando o nome em português; `clubName()` / `stageName()` traduzem na exibição (Reward.tsx inclusive).

`city` (`Pewter`, `Indigo Plateau`...) já está em inglês oficial e funciona como id.

Ginásios e líderes (nomes oficiais em inglês, para a MT do ginásio e textos futuros):

| Cidade | Líder | Insígnia | Tipo |
| --- | --- | --- | --- |
| Pewter City | Brock | Boulder Badge | Rock |
| Cerulean City | Misty | Cascade Badge | Water |
| Vermilion City | Lt. Surge | Thunder Badge | Electric |
| Celadon City | Erika | Rainbow Badge | Grass |
| Fuchsia City | Koga | Soul Badge | Poison |
| Saffron City | Sabrina | Marsh Badge | Psychic |
| Cinnabar Island | Blaine | Volcano Badge | Fire |
| Viridian City | Giovanni | Earth Badge | Ground |
| Indigo Plateau | Elite Four (Lorelei, Bruno, Agatha, Lance) | — | — |

## src/store/game-store.ts — FEITO

`stageLabel` saiu (era usado só na Reward.tsx, que agora usa `stageName(fase) || t('reward.cup')`).
`Pallet FC` fica igual nas duas línguas. Fora isso, só o campo `lang` em `Settings`.

## src/ui/screens/Reward.tsx (recompensa depois da vitória) — FEITO

Área nova `reward` (`src/i18n/pt/reward.ts` / `en/reward.ts`), PT byte a byte igual ao texto antigo. Fase com
`stageName`, time eliminado com `clubName`, item com `itemName` / `itemDesc`. A dica (`Tip id="reward-pick"`)
já inclui a frase da MT do ginásio.

## MT do ginásio (src/ui/components/TmTeach.tsx, src/engine/tm.ts) — FEITO

Chaves em `reward.tm`. Nomes oficiais em inglês: `TM34` / `HM02` (`tmLabel(move, 'TM', 'HM')`: o motor
recebe o prefixo da tela, padrão `MT` / `MO`), líderes já oficiais (`From Brock`, `From Lt. Surge`),
fala da Gen 1 ao esquecer: `1, 2 and… Poof!` + `X forgot Y! And… X learned Z!`, `not compatible` para
quem não aprende. Descrição do golpe na carta da MT: `moveFutsal` (o que o golpe faz no futsal) nas duas línguas.
O selo `TaughtMark` (carta e painel da partida) mostra `TM` / título `Taught by TM`.

## src/ui/golpedex/golpedex-data.ts — FEITO

`ALL_ROWS` continua com `descPt` (é o texto em PT); a tela (`MoveLab.tsx`) já mostra `moveDesc(row.id)` em
inglês. Nada mais a fazer.

## Sem texto na tela (nada a fazer)

`src/engine/match.ts`, `src/engine/controllers/ai-controller.ts`, `src/engine/rewards.ts`,
`src/engine/instance.ts`, `src/engine/evolution.ts`, `src/game/move-fx.ts` (o helper `text()` não é usado
com texto em PT). Nomes de Pokémon, golpes, habilidades e itens que esses arquivos mandam para a tela já
são os oficiais em inglês.

`src/engine/tm.ts` (MT do ginásio): feito, ver a seção da MT acima.

## Fora das áreas restritas

Os dois textos de `src/game/cinematics.ts:271` (" no chute" / " usou") já foram traduzidos neste passo
(`match.castShot` / `match.castUsed`). `animation-manager.ts` e `court.ts`: sem texto na tela.

Ficaram de fora de propósito (só aparecem em telas de desenvolvimento ou nunca chegam ao jogador):

| Onde | PT | EN proposto |
| --- | --- | --- |
| src/ui/components/PokeCard2.tsx:31 (`VARIANT_LABEL`, só na galeria `?cards=1`) | Figurinha Holo, TCG de futsal, Holo clássico, Arco-íris, Galáxia, Radiante, Dourado | Holo Sticker, Futsal TCG, Classic Holo, Rainbow, Galaxy, Radiant, Gold |
| src/App.tsx:24 (`?demo=crash`) | Teste do aviso de erro (?demo=crash) | Error notice test (?demo=crash) |
| src/ui/screens/PositionLab.tsx, CardGallery.tsx, dev-demo.ts, trailer-scenes.ts | ferramentas de dev | (não traduzir) |

## Depois do merge — FEITO

- Carta (`CardModal.tsx`) e Golpedex (`MoveLab.tsx`) usam a explicação em inglês (`moveExplain` / `moveFutsal`).
- Combos (`MatchScene.ts`, `commentary.ts`) usam `linkText(id)`.
- Ajuda: recompensa da MT do ginásio (chance, líder ou baú raro, assinatura protegida, golpe ensinado sobrevive à
  evolução, rivais com a MT do líder), seção nova "Golpes que fazem o que faziam nos jogos" (as 12 famílias) e o
  passo a passo da Copa citando a MT. Correção: item novo substitui o antigo (antes dizia "troca").
- Quadra animada da Home: "GOL!" vem do dicionário ("GOAL!").
- Privacidade em inglês: `public/privacy.html` (troca "Português | English" nas duas páginas); os links do jogo
  apontam para a página do idioma (`privacyUrl()` em `src/ui/links.ts`). `public/404.html` bilíngue.

## Resumo

Tudo o que aparece para o jogador está traduzido. Ficou de fora só o que é ferramenta de desenvolvimento ou nunca
chega ao jogador (tabela "Fora das áreas restritas" acima: `VARIANT_LABEL` da galeria `?cards=1`, `?demo=crash`,
PositionLab, CardGallery, dev-demo, trailer).

| Arquivo | Textos pendentes |
| --- | --- |
| **Total pendente** | **0** |
