---
description: Auditoria (16/11/2026) do Perfil do jogador e do seletor de título, das outras telas que ficaram pra trás, e proposta de revamp com sistema de efeitos de título (gelo do Natal), 3 opções, calendário até 30/11 e decisões pro Miguel. Só proposta.
---

# Revamp do Perfil (proposta de 16/11/2026)

Só proposta: nenhum código mexido, nenhum navegador aberto (outros agentes estavam usando a máquina). Tudo saiu da
leitura do código; o que precisa de print pra julgar está no fim, em **Prints que faltam**.

Pedido do Miguel: "queria um revamp na parte de perfil do jogador. O seletor de título tá super primitivo, e tem
várias features assim meio atrasadas."

## Resumo

- **O seletor de título é uma lista de pílulas.** Os ganhos em cima, na ordem do código; os bloqueados embaixo, um
  por linha. Num save novo são **1 ganho e 45 bloqueados** numa rolagem só. Não tem prévia, grupo, raridade nem
  filtro. O "Novo" e a barra de progresso da missão já existem e ficam.
- **Efeito de título hoje são 2 classes CSS soltas** (`title-shine` dourado, `title-holo` holográfico), escolhidas
  por 3 listas separadas em `title-codes.ts`. Pra caber o gelo do Natal, isso vira **um mapa só de "look"** e um CSS
  pequeno só de título.
- **O título quase não aparece pros outros:** só no Duelo (sala, placar, VERSUS) e no cartão do treinador. No ranking
  da Copa do Dia, na Liga, no VERSUS da Copa e no card de Compartilhar ele some ou perde o efeito.
- **Atrasados de verdade:** o Legado do Time Ultimate (medalha, Campeão T1, enfeite do evento) mora no fim do Álbum,
  mas o texto do evento promete "enfeite do Perfil". O nível do treinador só aparece na barra de cima. A Coleção, a
  Ajuda e os Créditos ainda usam a casca antiga de menu.
- **Recomendação: opção B em duas fases.** Fase 1, até a versão de **30/11**: sistema de looks com o **gelo**,
  seletor novo e o título "Natal 2026" dormindo. Fase 2, até **14/12**: cartão do perfil com nível e enfeites, Legado
  do UT no Perfil, título no VERSUS da Copa e no Compartilhar. O título no ranking (migração de produção) fica pra uma
  fase 3 antes da Liga, se o Miguel quiser.

## 1. Inventário do Perfil hoje

### 1.1 As telas

| Tela ou folha | Onde no código | O que mostra |
|---|---|---|
| **Perfil (o armário)** | `src/ui/screens/Profile.tsx`, `Profile()` | Cena do vestiário (parede, varal, piso) e o cartão `pf-head`: treinador + avatar (tocar abre nome/avatar), nome com lápis, **linha do título**, escudo + clube · TAG, 3 destaques (medalhas), taças por metal (abre a Sala), vitrine de até 3 cartas. Embaixo: a faixa de números (`StatsStrip`) e 2 armários: **Treinador** (x/total) e **Título** (quantos ganhos) |
| Folha "nome" | `ClubTab part="trainer"` (`src/ui/profile/ClubTab.tsx`) | Campo do nome e a grade de avatares por geração (151 + shiny, foto do Google) |
| Folha Treinadores | `TrainerPicker` (`src/ui/profile/TrainerTab.tsx`) | Ficha do escolhido em cima (sprite, nome, selo Lendária/Platina, missão com barra) e a grade de figurinhas; tocar num liberado já salva |
| **Folha Título** | `TitlePicker` + `RedeemCode` (`TrainerTab.tsx`) | Ver 1.2 |
| Folha Números | `MyStats` (`src/ui/profile/MyStats.tsx`) | Os números da carreira |
| Clube (escudo, uniforme, faixa) | `DoorSheets` → `ClubTab part="club"`, aberto pelo escudo na Sede | Nome do clube, TAG, cor, peças do escudo e do uniforme, frase da faixa da torcida |
| Amigos | `FriendsTab`, aberto pelo mural da Sede | Código de amigo, convites, pedidos, lista |
| Metas | `src/ui/ambientes/MetasSheet.tsx` | "x de y missões", as **6 missões mais perto** (texto + barra) e as medalhas |
| Nível do treinador | `src/ui/ambientes/TopBar.tsx`, `trainerLevel()` em `metas.ts` | Estrela com o nível e barra de XP (missões). **Só na barra de cima** |
| Cartão do treinador (o que os outros veem) | `PlayerCardModal` (`src/ui/profile/PlayerCard.tsx`) | Treinador + avatar com moldura, título, escudo, destaques, taças, cartas; amigo vê também números, últimos títulos e "vocês no Duelo" |
| Legado do Time Ultimate | `UltimateLegacy` (`src/ui/ultimate/Legacy.tsx`), renderizado **no fim do Álbum** (`DexTab.tsx`, linha 95) | Medalha por temporada, "Campeão T1", a Lenda, enfeites dos eventos |

### 1.2 Como se escolhe o título hoje

1. Perfil → armário **Título** (ícone de coroa, número de ganhos, ponto de novidade).
2. Abre a folha com o `TitlePicker`:
   - grade de pílulas (`.pf-titles`, uma coluna no celular, `minmax(220px)` no desktop) com os **ganhos**, na ordem
     de `TITLE_IDS`; cada pílula tem o nome (com o look, se tiver), "como ganhou" em 11 px e o selo "Novo";
   - tocar **já salva** (`save({ title: id })`); o escolhido fica azul (`.pf-chip.active`);
   - "Bloqueados (45)" e outra lista com **cada bloqueado numa pílula tracejada**, com o texto da missão e a barra;
   - no fim, "Resgatar código" (campo + botão).
3. Os ids: 46 de missão (`TITLE_IDS` em `src/store/missions.ts`) + 9 de código (`CUSTOM_TITLES` em
   `src/store/title-codes.ts`). Ganhos = missões cumpridas + `profile.redeemedTitles` (`earnedTitles()`).
4. Look: `titleClass(id)` devolve `title-shine` (lendas e alguns códigos), `title-holo` (criador e platina) ou nada.
   O CSS mora em `src/ui/profile/profile.css` (linhas ~1445–1495), com as duas regras de reduzir movimento.

### 1.3 Onde o título aparece

| Lugar | Quem vê | Com efeito? | Código |
|---|---|---|---|
| Cartão do Perfil | você | sim (o resto do título é cinza `--muted`, 13 px, de propósito) | `Profile.tsx`, `.pf-title-line` |
| Cartão do treinador | amigo, rival do Duelo | sim | `PlayerCardModal` |
| Sala do Duelo | rival | sim (borda colorida) | `Duel.tsx`, `.duel-title` |
| Placar do Duelo (toca e abre o cartão) | rival | sim | `DuelMatch.tsx`, `.sb-title` |
| VERSUS do Duelo | os dois | sim | `VersusIntro.tsx` (`coach.titleLook`) |
| Vitrine do amigo (`friend_cards.perfil`) | amigos | sim (vai o `titleId`) | `usePublicPeer()` |
| Hall da Fama | você | sim | `HallParade.tsx` |
| Card de Compartilhar do campeão | quem recebe a imagem | **não**: dourado chapado no canvas | `share-card.ts` |
| VERSUS da Copa e da Liga | - | **não aparece** (o `Match.tsx` não passa treinador) | `Match.tsx` |
| Ranking da Copa do Dia e da Liga | todos | **não aparece** (a linha só tem nome, clube e a cor) | `Daily.tsx` `RankRow`, tabelas `daily_runs`/`league_teams` sem coluna de título |

### 1.4 O que é primitivo (o seletor e o cartão)

| # | Problema | Gravidade |
|---|---|---|
| P1 | **Sem prévia:** você escolhe sem ver como fica no cartão que os outros veem. Os bloqueados nem mostram o efeito que vão ter | alta |
| P2 | **Lista corrida de 46+ pílulas** sem grupo, sem ordem por raridade, sem filtro "ganhos/faltam". Save novo = 45 bloqueados empilhados | alta |
| P3 | **Raridade invisível:** "Treinador de Pallet" e "Copa Perfeita" têm o mesmo peso na lista, só muda o brilho. `public/data/raridade.json` é de espécie (e está zerado no repo, ver A9), não de título | alta |
| P4 | **Efeito é classe solta:** 3 listas (`CUSTOM_TITLES.look`, `LEGEND_TITLES`, `PLATINUM_TITLES`), o tipo só aceita `'shine' \| 'holo'`, e o CSS está dentro de um `profile.css` de 1954 linhas que entra no bundle pelo `PlayerCardModal` do `App.tsx`. Não há lugar óbvio pro gelo | alta (Natal) |
| P5 | **Fonte de título só missão ou código.** O Natal dá título por evento (Copa de Natal, desafio na conta), e o `titleHow()` diria "Código" pra ele | alta (Natal) |
| P6 | **Desempenho do efeito:** shine e holo animam `background-position` com `filter: drop-shadow` em todo elemento visível, sem limite. Na folha, cada lendário ganho anima ao mesmo tempo | média |
| P7 | **Título fraco no cartão:** 13 px cinza logo abaixo do nome; o título especial salva, o comum some | média |
| P8 | **Nível do treinador fora do cartão:** existe na barra de cima, mas nem o seu Perfil nem o cartão que o amigo abre mostram | média |
| P9 | "Resgatar código" sempre aberto no fim da folha, ocupando espaço de quem nunca vai ter código | baixa |
| P10 | Textos mortos: `profile.picker.titleHelp`, `trainerHelp`, `trainerCount` não são usados; o comentário do `RedeemCode` diz "Mora nas Configurações" | baixa |

## 2. Outras features atrasadas

Comparando com as telas novas (ambientes, Copa do Dia no telão, Time Ultimate). Cada item com o arquivo e a
gravidade.

| # | Onde | Problema | Gravidade |
|---|---|---|---|
| A1 | **Legado do Time Ultimate** (`ultimate/Legacy.tsx` no fim do `DexTab`) | Medalha da temporada, "Campeão T1" e o enfeite do evento ficam escondidos no rodapé do Álbum. O texto do evento de Natal do UT (`ultimate.event.hint`) promete "enfeite do Perfil", e o Perfil não mostra enfeite nenhum. O enfeite sai a partir de 15/12 | **alta** |
| A2 | **"Campeão T1" fora do sistema de títulos** | O UT dá "título de campeão" como chip próprio do Legado; não dá pra usar embaixo do nome | **alta** (junto com A1) |
| A3 | **Ranking da Copa do Dia e da Liga** (`Daily.tsx` `RankRow`, `Liga.tsx`) | Linha com nome, clube e a cor; sem escudo desenhado e sem título. É onde mais gente vê o seu nome, e a Liga abre 12/01 | média |
| A4 | **Metas** (`MetasSheet.tsx`) | As 6 missões mais perto mostram texto e barra, mas **não o prêmio** (qual treinador ou título libera). O "Caminho do treinador" (`revamp-ui.md`, decisão 7) não saiu | média |
| A5 | **Coleção** (`screens/Collection.tsx`) | Casca antiga: `menu-screen` + `MenuHead` + abas `pf-tab`, sem cena, enquanto o Laboratório que leva até ela é ambiente | média |
| A6 | **Avatar** (`ClubTab part="trainer"`) | 151 avatares + shiny numa grade por geração, na mesma folha do nome, sem busca nem "só os que já joguei" | média |
| A7 | **VERSUS da Copa e da Liga** (`Match.tsx`) | Sem treinador nem título; no Duelo tem. Na Liga o rival é o fantasma de outra pessoa, então faria sentido mostrar o título dele | média (Liga) |
| A8 | **Card de Compartilhar** (`share-card.ts`) | O título vai em dourado chapado; o look (holo, shine, gelo) não aparece na imagem que viaja | baixa |
| A9 | **"Pokémon mais raro" do Campeão** (`ChampionExtras.tsx`) | `public/data/raridade.json` está `{"champions":0}` desde 16/10; o componente só mostra com 20 ou mais, então nunca aparece. Falta rodar `npm run stats -- --raridade` e commitar | baixa |
| A10 | **Ajuda** (`screens/Help.tsx`) | `menu-screen` + `MenuHead`, botões `ghost` e acordeões; sem cena. Funciona, mas destoa | baixa |
| A11 | **Créditos** (`screens/Credits.tsx`) | Mesma casca antiga | baixa |
| A12 | **Configurações** (`screens/Settings.tsx`) | `Stage` sem cena, painéis empilhados. Já usa o kit; só não tem cara de lugar | baixa |
| A13 | **Amigos** (`FriendsTab.tsx`) | 5 painéis empilhados (código, convites, recebidos, lista, enviados). Precisa de print pra dizer se a hierarquia está ruim | baixa (a confirmar) |

O que está em dia e não entra: **Sala de troféus** (cena Phaser com vitrines, nível e lista), **Novidades** (`NewsFeed`
com pôsteres), **Treinadores** (ficha + figurinhas, que é o molde pro seletor de título novo).

## 3. Referências

| Jogo | O que faz | O que levar |
|---|---|---|
| **Rocket League** | Título embaixo do nome no banner, visto por todos na partida, no placar e no replay do gol. A cor e o brilho vêm de **como você ganhou** (Grand Champion vermelho, Supersonic Legend branco em negrito); o jogador não troca a cor. Banner e borda de avatar à parte | Look preso ao título, não escolhido. Título aparece onde o jogo acontece (placar), não só no perfil |
| **Clash Royale** (Summer Update 2022) | Banner de batalha montado de moldura + decoração + **3 insígnias escolhidas**, mostrado aos dois antes da partida. Perfil refeito: banner em cima, números essenciais embaixo, insígnias escolhidas abaixo | Cartão = banner + 3 destaques + números. O Soccermon já tem os 3 destaques e o VERSUS; falta juntar |
| **Brawl Stars** | Títulos como prêmio da trilha de Maestria (66 de uma vez), ícone de perfil em lobby, ranking e Battle Card | Título como prêmio de progressão, à vista no ranking |
| **Fortnite** (Armário) | Filtros Todos, Recentes, Favoritos; ordenar por recente, coleção, A–Z. A cor de raridade saiu em 2024 e os jogadores reclamaram | Filtro "Ganhos/Faltam" e ordem por recente. A reclamação mostra que **raridade visível tem valor** pro jogador |
| **Pokémon GO** | Medalhas com 4 degraus (bronze, prata, ouro, platina) no perfil do treinador | O Soccermon já tem isso nas medalhas; os títulos podem usar o mesmo vocabulário de degrau |
| **EA FC** (Estádio do UT) | Escudo, uniformes, bola e itens de estádio separados por Ouro/Prata/Bronze, trocados num lugar só | Separar "o que eu sou" (título, treinador) de "o meu clube" (escudo, uniforme), como a Sede já faz |
| **Steam** (conquistas) | "% dos jogadores que têm" em cada conquista, desde 2009 | Raridade real por título, calculada fora do jogo e servida como JSON estático |

**O que deixa um seletor gostoso** (juntando os acima):

1. **Prévia ao vivo** do cartão que os outros veem, em cima da grade, trocando com transição.
2. **Grade agrupada**, não lista: grupos com cabeçalho (Lendas, Elite, Ginásios…), os raros primeiro.
3. **Bloqueado mostra o look** (em silhueta ou apagado) e a missão: dá vontade de ir buscar.
4. **"Novo"** em quem acabou de chegar (já existe) e ordem "recentes primeiro" dentro do grupo.
5. **Raridade dita**, não só sugerida pelo brilho.
6. **Favoritos** só quando a coleção é grande (Fortnite tem centenas). Com ~55 títulos não precisa.
7. **Aparecer onde os outros olham:** placar, VERSUS, ranking. Senão o título é só pra você.

## 4. Proposta

### 4.1 Cartão de perfil

O cartão `pf-head` já é bom de esqueleto. Muda o peso de cada coisa:

```
┌──────────────────────────────────────┐
│ [treinador][avatar ★7]  NOME DO TREINADOR ✎ │  ★7 = nível (o mesmo da barra de cima)
│                         Natal 2026          │  título com o look vivo, 15 px
│                         [escudo] Pallet FC · PAL │
│  (medalha)(medalha)(medalha)   [taça]3 [taça]1 │  3 destaques + taças
│  enfeites: [Natal] [T1]                        │  só aparece com enfeite
│  [carta][carta][carta]                         │
└──────────────────────────────────────┘
```

- **Entra:** o nível (estrela com número, igual à `TopBar`), o título maior e com o look vivo, a fileira de
  **enfeites** (eventos do UT e do Natal, e o Campeão T1 como medalha).
- **Fica:** escudo + clube, 3 destaques, taças, 3 cartas.
- **No cartão do treinador** (`PlayerCardModal`): o mesmo nível e os enfeites. O `friend_cards.perfil` é `jsonb`,
  então mandar `level` e `ornaments` na vitrine **não precisa de migração**: é campo novo validado no cliente, como os
  outros.

### 4.2 Seletor de título novo

No molde do `TrainerPicker` (ficha em cima, grade embaixo), pra Treinador e Título funcionarem igual:

```
┌ TÍTULO ───────────────────────────────┐
│ ┌ prévia ──────────────────────────┐ │
│ │ [avatar] Miguel                   │ │  o cartão como os outros veem
│ │          Natal 2026 (gelo)        │ │  troca com fade 200 ms
│ │ ESPECIAL · Copa de Natal 24 e 25  │ │  raridade + como ganha
│ └──────────────────────────────────┘ │
│ [ Ganhos 12 | Faltam 43 ]             │  bc-seg
│ ESPECIAIS                             │
│ [Natal 2026] [GOAT]                   │  2 colunas, look parado
│ LENDAS                                │
│ [Copa Perfeita •novo] [Zé Ninguém]    │
│ ELITE · GINÁSIOS · …                  │
│ Tenho um código ›                     │  terciário, abre o campo
└───────────────────────────────────────┘
```

- **Tocar num ganho salva na hora** (como o Treinador faz hoje) e a prévia mostra. Tocar num bloqueado mostra a prévia
  apagada com a missão e a barra (o `MissionHow` que já existe).
- **Grupos** = os `MISSION_GROUPS` que já existem, mais "Especiais" (código e evento) e "Platina". Dentro do grupo:
  ganhos recentes primeiro. Sem campo de busca nem favoritos (55 títulos não pedem).
- **Raridade** como rótulo de 10 px caixa alta na prévia, por categoria, sem dado novo:

  | Rótulo | Quais | Look |
  |---|---|---|
  | Comum | Pallet, ginásios, classes, feitos simples | nenhum (cinza) |
  | Raro | Elite, coleção, coleções temáticas | nenhum ou contorno (decidir na galeria) |
  | Lendário | `LEGEND_TITLES` de hoje | dourado (`shine`) |
  | Platina | `diplomaKanto` | holográfico (`holo`) |
  | Especial | código e evento | o look dele (gelo, dourado, holo) |

  Depois, se o Miguel quiser, a **% real** ("3% dos treinadores") com um `npm run stats -- --titulos` que lê os
  `saves` (o `data.profile.missionsDone` e `redeemedTitles`) e grava `public/data/titulos.json`, igual ao
  `raridade.json`. Só mostra com amostra grande (proposta: 100 saves ou mais).
- "Resgatar código" vira o link terciário **Tenho um código**, que abre o campo no lugar.
- A grade tem até 2 colunas no celular de 390 e 1 coluna a 320 (nome longo como "Torcida do Farmando Dungeons"
  precisa caber).

### 4.3 Sistema de efeitos de título

Um mapa só e um CSS pequeno. Nada de JS por quadro.

- **Dados** (`src/store/title-codes.ts`): `type TitleLook = 'shine' | 'holo' | 'ice'` e `titleLook(id)` lendo **um**
  mapa (junta `CUSTOM_TITLES[id].look`, `LEGEND_TITLES` e `PLATINUM_TITLES`). `titleClass()` continua com a mesma
  assinatura, então os 7 lugares que já usam não mudam.
- **Fonte nova de título** (Natal, desafio da semana, Campeão T1): a entrada em `CUSTOM_TITLES` ganha `how` (o texto
  de "como ganha") e `group: 'especial'`. Quem ganha recebe o id em `profile.redeemedTitles`, que já é salvo, já sobe
  pra nuvem e já entra em `earnedTitles()`. **Sem campo novo no save, sem migração.** O nome `redeemedTitles` fica
  (renomear custaria migração por nada); o comentário passa a dizer "títulos que não vêm de missão".
- **CSS** (`src/ui/title-fx.css`, novo, ~80 linhas): tira de `profile.css` o que é `title-*` e o `:has()` do
  `duel.css`. Cada look tem duas camadas:
  - **base parada** (degradê no texto com `background-clip: text` e sombra dura de 1 px, sem blur), que vale em todo
    lugar, inclusive na grade;
  - **movimento** só quando o elemento tem `.fx-live`: o título do cartão, a prévia do seletor, o placar e o VERSUS.
    **No máximo 2 vivos por tela.** Reduzir movimento (as duas regras de sempre) desliga a camada de movimento.
- **Gelo do "Natal 2026"** (proposta, aprovar na galeria):
  - base: azul-gelo claro em degradê vertical (branco-azulado em cima, azul do céu no meio, azul mais fundo embaixo),
    com sombra dura azul-noite de 1 px pra ler no fundo claro e no escuro;
  - movimento: um brilho branco estreito que passa a cada ~4 s (pausa longa, não um loop nervoso) e 2 faíscas de
    4 pontas, em pixel, que acendem e apagam com `opacity` e `scale` num pseudo-elemento;
  - pílula do seletor: borda azul-gelo com a borda de baixo azul-escura, como o kit.
  - Custo de desempenho: o brilho anima `background-position` (pinta só o texto, que é curto); as faíscas são
    `transform`/`opacity`. Medir no celular fraco antes de subir.
- **Galeria `?lab=titulos`** (dev e prévia, como `?lab=kit`): os 3 looks em fundo claro, escuro e cor de clube, em
  cartão, pílula, placar e VERSUS, com e sem reduzir movimento. O Miguel aprova ali antes de espalhar, como a carta na
  `?cards=1`.

### 4.4 Onde o título aparece

| Lugar | Hoje | Proposta | Fase |
|---|---|---|---|
| Cartão do Perfil e do treinador | cinza 13 px, efeito em 2 looks | 15 px, look vivo | 1 |
| Seletor | pílula | prévia viva + grade parada | 1 |
| Sala, placar e VERSUS do Duelo | com efeito | igual, com `.fx-live` e o gelo | 1 (de graça) |
| VERSUS da Copa e da Liga | não aparece | o seu título embaixo do clube; na Liga, o do fantasma | 2 |
| Card de Compartilhar | dourado chapado | cor base do look (gelo azul, holo em degradê parado) no canvas | 2 |
| Ranking da Copa do Dia e da Liga | não aparece | título pequeno embaixo do nome (look parado) | 3: migração (`title_id` nas tabelas e nas funções do ranking) |

## 5. Opções

| | **A. Seletor + gelo** | **B. A + cartão novo** | **C. B + ranking e raridade real** |
|---|---|---|---|
| O que entra | mapa de looks, `title-fx.css`, gelo, `?lab=titulos`, seletor no molde do Treinador (prévia, grupos, Ganhos/Faltam, raridade por categoria), "Natal 2026" dormindo, título 15 px no cartão | A + nível e enfeites no cartão e no cartão do treinador, Legado do UT no Perfil (A1, A2: Campeão T1 vira título especial), prêmio da missão nas Metas (A4), título no VERSUS da Copa/Liga e no Compartilhar | B + título no ranking (migração de produção), `npm run stats -- --titulos` com % real, "Caminho do treinador" (`revamp-ui.md` decisão 7) |
| Esforço | ~2,5 a 3 dias | +3 a 4 dias (~6 a 7 no total) | +5 a 7 dias (~12 no total) |
| Risco | baixo: só cliente, sem save novo; o cuidado é desempenho do efeito no celular | médio-baixo: mexe em `ui/ultimate/` (só depois do congelamento de 26/11) e na vitrine do amigo (campo novo, validado) | médio: Supabase de produção (só com ok), conferir se a Edge Function `liga` grava a linha do ranking |
| Cabe quando | **versão de 30/11** | fase 2 até **14/12** (antes do enfeite do UT sair em 15/12) | fase 3 até a **Liga, 12/01** |

## 6. Recomendação e calendário

**B, em duas fases.** A fase 1 é a opção A inteira e é o que o Natal precisa; a fase 2 fecha os atrasados que o UT
e o Natal vão expor em dezembro. C fica pra decidir em dezembro, olhando a Liga.

| Quando | O quê |
|---|---|
| seg 16 a sex 20/11 | fase 1 numa branch própria (`perfil-titulos`): looks, gelo, `?lab=titulos`, seletor. Prévia na Vercel pro Miguel aprovar o gelo na galeria |
| 19 a 22/11 | o tema neon (outro agente) mexe em CSS: juntar depois dele e conferir conflito em `profile.css` |
| até 26/11 | UT congelado: a fase 1 **não toca** em `src/ui/ultimate/` nem em `src/store/ultimate/` |
| seg 30/11 | **versão de Natal** sai com a fase 1. "Natal 2026" existe no código, dormindo (ninguém ganha ainda) |
| seg 07/12 | fase 2: cartão novo, nível, enfeites, Legado do UT no Perfil, Metas com prêmio, VERSUS e Compartilhar |
| ter 15/12 | o enfeite do evento do UT começa a sair: já tem lugar no Perfil |
| 15/12 em diante | o 2º degrau do desafio dá o "Natal 2026" (entra em `redeemedTitles`) |
| 24 e 25/12 | quem ganha a Copa de Natal nos dois dias ganha o "Natal 2026" |
| até 12/01 | fase 3, se aprovada: título no ranking antes da Liga |

Se a fase 1 atrasar, o mínimo que **tem** que estar em 30/11 é só o look `ice` + o título "Natal 2026" no mapa
(~1 dia). O seletor novo pode vir em 07/12 sem quebrar o Natal, porque ninguém ganha o título antes de 15/12.

## 7. Decisões pro Miguel

Recomendação primeiro; respondo no que aprovar.

1. **Opção B em duas fases (A até 30/11, o resto até 14/12)?** Sim. C decidido em dezembro.
2. **Seletor no molde do Treinador** (prévia em cima, grade agrupada embaixo, tocar num ganho já salva)? Sim: as duas
   folhas funcionam igual.
3. **Gelo só no "Natal 2026"** (o "Coração de Gelo" da Lorelei continua sem efeito)? Sim, pra o de Natal ser raro.
4. **Raridade por categoria** (Comum, Raro, Lendário, Platina, Especial) agora, e a % real só depois, com 100 saves ou
   mais? Sim.
5. **"Natal 2026" pelos dois caminhos** (Copa de Natal nos dois dias **ou** 2º degrau do desafio)? Sim: mais gente
   ganha, e quem não pode jogar dia 24 e 25 ainda tem a meta.
6. **"Campeão T1" do Time Ultimate vira título de verdade** (dá pra usar embaixo do nome, look dourado)? Sim, na fase 2.
7. **Legado do UT e enfeites saem do fim do Álbum e vão pro Perfil?** Sim, até 14/12.
8. **Nível do treinador no cartão e no cartão que o amigo vê?** Sim (sem migração).
9. **Título no ranking da Copa do Dia e da Liga** (migração de produção)? Fase 3, decidir em dezembro.
10. **Floco desenhado ao lado do título de gelo?** Não por enquanto: em 15 px, ícone e efeito juntos ficam demais. Dá
    pra ver na galeria.
11. **Aprovar os looks na galeria `?lab=titulos`** antes de espalhar? Sim.

## 8. Prints que faltam

Pra o Miguel julgar (headless, 390 e 1440 salvo dito outra coisa). Nenhum foi tirado nesta rodada.

1. Perfil hoje (o armário com o cartão), save novo e save cheio.
2. Folha **Título** hoje: save novo (1 ganho, 45 bloqueados, rolado até o fim) e save cheio com shine e holo, a 390.
3. Título no Duelo: sala, placar e VERSUS, com um título `shine` e um `holo`.
4. Cartão do treinador de um amigo (`PlayerCardModal`).
5. Folha **Metas**.
6. Álbum rolado até o fim com o **Legado do UT** (save com legado, `?utnow=`).
7. Coleção, Ajuda, Configurações e Créditos a 390, lado a lado com um ambiente (pra ver o quanto destoam).
8. Ranking da Copa do Dia com 10 linhas.
9. Card de Compartilhar do campeão com título `shine`.
10. Folha nome/avatar rolada (151 + shiny).
11. Amigos com a lista cheia (A13).
12. Depois da fase 1: `?lab=titulos` a 320, 390, 844x390 e 1440, com reduzir movimento ligado e desligado, e uma
    medição de fps num celular fraco com a folha de títulos aberta.

## Fontes

- Nossos arquivos: `src/ui/screens/Profile.tsx`, `src/ui/profile/TrainerTab.tsx` (`TitlePicker`, `RedeemCode`),
  `src/ui/profile/PlayerCard.tsx`, `src/ui/profile/club.ts` (`titleName`, `peerTitle`, `titleHow`),
  `src/store/title-codes.ts`, `src/store/missions.ts` (`TITLE_IDS`, `earnedTitles`), `src/ui/profile/profile.css`,
  `src/ui/duel/duel.css`, `src/ui/ambientes/TopBar.tsx`, `src/ui/ambientes/MetasSheet.tsx`,
  `src/ui/ultimate/Legacy.tsx`, `src/ui/profile/DexTab.tsx`, `src/ui/screens/Daily.tsx`, `src/ui/share-card.ts`,
  `scripts/stats.ts` (`raridade()`), `supabase/migrations/20261021120000_perfil_do_amigo.sql`,
  `docs/planos/natal.md`, `docs/planos/revamp-ui.md`, `.claude/skills/soccermon-titulos/SKILL.md`,
  `.claude/skills/soccermon-marca/SKILL.md`.
- Rocket League, títulos: [Epic Games, "What are Rocket League Titles"](https://www.epicgames.com/help/en-US/c-202300000001622/c-202300000001682/what-are-rocket-league-titles-and-how-do-i-get-them-a202300000013269),
  [Rocket League Wiki, Title](https://rocketleague.fandom.com/wiki/Title),
  [Player Banners explained](https://www.rocketleague.com/news/player-banners-explained),
  [bordas de avatar](https://theglobalgaming.com/rocket-league/best-avatar-borders).
- Clash Royale: [Summer Update 2022](https://supercell.com/en/games/clashroyale/blog/release-notes/clash-royale-summer-update-2),
  [Battle Banners (suporte)](https://support.clashroyale.com/hc/en-us/articles/49484956343835-Battle-Banners),
  [insígnias no perfil (RoyaleAPI)](https://royaleapi.com/blog/new-achievement-badges-on-player-profile).
- Brawl Stars: [patch notes com os títulos da Maestria](https://supercell.com/en/games/brawlstars/blog/release-notes/mysteryatthehub-patch-notes),
  [cosméticos da temporada 20](https://afkgaming.com/mobileesports/guide/all-brawl-stars-season-20-cosmetic-items-pins-sprays-profile-icons-titles).
- Fortnite: [favoritos no Armário](https://www.epicgames.com/help/fortnite-battle-royale-c-202300000001636/gameplay-c-202300000001721/how-do-i-add-items-to-favorites-in-the-fortnite-locker-a202300000015720),
  [ordenar e filtrar](https://progameguides.com/fortnite/how-to-use-sort-and-filter-in-the-fortnite-locker/),
  [a raridade que saiu (PC Gamer)](https://www.pcgamer.com/games/battle-royale/epic-removes-the-item-rarity-system-from-fortnite-but-some-fans-aint-happy-and-think-its-trying-to-gouge-players).
- Pokémon GO: [Medals (wiki)](https://pokemongo.fandom.com/wiki/Medals),
  [Niantic, nível e medalhas](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/101-leveling-up-earning-medals/).
- EA FC: [itens do Estádio no FC 26](https://fifauteam.com/?p=321265),
  [trocar o escudo no FC 26](https://www.magicgameworld.com/ea-fc-26-how-to-change-club-badge-in-ultimate-team/).
- Steam, % de conquistas: [o que as porcentagens querem dizer](https://www.cloudspress.com/what-steam-achievement-rarity-percentages-mean-and-how-theyre-calculated/),
  [exemplo de página de estatísticas globais](https://steamcommunity.com/stats/1125710/achievements).

## Decidido com o Miguel (16/11/2026)

1. Em fases. A fase 1 (sistema de efeitos com o gelo, galeria `?lab=titulos` e seletor novo) vai na versão de Natal de 30/11. A fase 2 fica até 14/12.
2. O seletor segue o modelo do de Treinadores: prévia do cartão em cima e salva no toque.
3. O efeito de gelo é só do "Natal 2026".
4. **Raridades: Comum, Raro, Épico, Lendário e Especial.** Sai "Platina" e entra "Épico". A % real vem quando houver dados.
5. O "Natal 2026" sai pelos dois caminhos: Copa de Natal nos dois dias ou 2º degrau do desafio.
6. O "Campeão T1" vira título de verdade.
7. O Legado do UT vai pro Perfil.
8. O nível do treinador aparece no seu cartão e no do amigo.
9. O título no ranking fica pra decidir em dezembro, porque precisa de migração.
10. Sem floco ao lado do título de gelo por enquanto; ele vê na galeria.
11. Os efeitos são aprovados na galeria antes de espalhar.

## Fase 2 (24/11/2026, branch `feat-perfil-fase2`)

Feito: nível (estrela da barra de cima) no canto do avatar do cartão do Perfil e do cartão do treinador; título em
15 px; fileira de enfeites (`ornaments.tsx`); Legado do UT saiu do fim do Álbum e virou a porta "Time Ultimate" do
Perfil (aparece só com legado), com a melhor carta grande, total de partidas e vitórias e as temporadas; título do
Perfil no VERSUS da Copa, da Liga e do UT (`MyVersus` em `Match.tsx`); look do título no canvas do Compartilhar
(`titleFill` em `share-card.ts`: gelo e holo em degradê parado, dourado no resto).

Propostas (o doc deixava em aberto; decidi pelo mais simples, o Miguel confirma):

- **Enfeites no cartão** = um chip por evento do UT completo (`legacy.ornaments`) e um "Campeão T{n}" por temporada
  em que foi campeão (`champ:N`). Vai na vitrine do amigo e na sala do Duelo como `level` (número) e `ornaments`
  (até 6 ids curtos, validados no cliente): `friend_cards.perfil` é jsonb, sem migração; peer antigo só não mostra.
- **"Melhor carta"** = a Lenda de maior nota entre as temporadas (empate, a mais recente).
- **"Campeão T1" como título de verdade** (decisão 6): **não feito**, precisa mexer em `src/store/ultimate/`
  (congelado até 26/11). Por ora é só o chip de enfeite.
- **VERSUS da Liga**: só o seu título; o do fantasma fica pra fase 3 (a tabela não guarda título).
- **Compartilhar**: o título só aparece no formato Stories (o quadrado nunca teve treinador); sem movimento, só cor.
- **Metas com prêmio da missão** (A4) fica de fora desta rodada.
