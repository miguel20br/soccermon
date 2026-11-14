---
description: Revisão de design das telas e o que simplificar na 0.9.2.
---

# Revisão de design: o jogo está virando um amontoado?

21/10/2026, em cima da branch `v091`. Prints headless a 390x844, 1440x900, 320x568 (as telas mais cheias) e 844x390
deitado, no scratchpad da sessão (`review/<nome>-m.png` = 390, `-d` = 1440, `-s` = 320, `-l` = deitado; `-full` = a
página inteira). Nada de código mexido: é só diagnóstico e plano.

## 1. Veredito curto

**Sim, em quatro lugares o jogo passa a impressão de pilha de features. No resto ele está organizado e bonito.** O
problema não é ter coisa demais no jogo: é mostrar tudo ao mesmo tempo, na mesma altura, e repetir a mesma informação
duas ou três vezes na mesma tela. Quase nada precisa sair do jogo; muita coisa precisa sair da primeira tela.

Onde pesa, tela por tela:

- **Home** (`01-home-m-full`, `01-home-d-full`): **6 avisos de "Em breve"** numa tela só (Rota Índigo, Liga e os 4
  cartões de Em breve), mais o selo BETA do Duelo, o AO VIVO e a Semana do tipo Água. Quem chega lê "metade disto não
  funciona". O "Nova copa" (a ação do jogo) é um botãozinho dentro de um bloco dentro de outro bloco, do mesmo
  tamanho que "Criar sala" e "Jogar hoje". "Modo história: ginásios, insígnias e a Liga Índigo" no Em breve e "Rota
  Índigo: ginásios" no bloco da Copa contam a mesma promessa duas vezes.
- **Resultado** (`11-result-m-full`): 3475 px no celular. Placar, fala do líder, 3 números, time, caminho da copa,
  próximo rival, botão, **a chave inteira de novo**, dica, 6 destaques, gols, "virou Destaque", evolução do rival,
  craque da partida (que já apareceu 2 vezes) e a tabela de estatísticas.
- **Campeão** (`47-campeao-m-parte1..3`): **9739 px** no celular. Prêmios, seleção, gols da campanha, mapa de gols,
  golpes, a final, elenco campeão com 10 linhas de números por carta, gol da copa, e embaixo de tudo o resultado da
  final de novo. E 5 botões no fim: 2 vermelhos e 2 amarelos.
- **Escalação** (`07-lineup-m`): 2929 px. A fileira das 4 fases **e** a chave completa da Copa Relâmpago em cima, dica,
  6 formações, quadra, rival, tática, escanteio, cobrador, 2 sinergias, carta do selecionado, abandonar.
- **Perfil → Treinador** (`26-colecao-perfil-m-full`): 4863 px, grade de 46 treinadores (35 trancados, um monte de
  NOVO) e depois a lista de títulos.
- **Configurações** (`40-settings-m-full`): 21 opções em 7 blocos, 3155 px.

Onde está bem e não precisa mexer muito: VERSUS (`08-versus-m`), Mercado (`20-mercado-m-full`), mapa da Rota
(`22-mapa-meio-d`), Copa do Dia (`29-dia-m-full`), Álbum (`28-album-m`), Pokédex (`44-dex-m`), lobby do Duelo
(`42-duel-host-m-full`), Evento (`24-evento-m-full`). Essas têm uma ação clara e pouca coisa em volta.

## 2. Para tirar ou esconder

Direto ao ponto, do que eu mais recomendo pro que menos:

| # | O quê | Onde | Fazer | Por quê / impacto |
|---|---|---|---|---|
| 1 | Os 4 cartões "Em breve" | Home (`home.soon`, `Home.tsx` seção `.soon`) | **Tirar da Home.** Viram uma linha "Vem aí" nas Novidades ou na Ajuda | 1/4 da Home é coisa que não existe. Tira ~300 px no celular e a sensação de "jogo inacabado" |
| 2 | Cartão da Rota Índigo trancado | Home, `.cup-modes` | **Esconder enquanto `LONG_CUP_LIVE = false`.** A Copa vira um cartão só, com o "Nova copa" grande | Um dos dois "modos principais" é um cadeado. O botão principal fica sozinho e grande |
| 3 | Liga "Em breve" com contagem | Home, `HomeDailyCard` | **Tirar a linha da Liga da Home** até abrir; a contagem fica dentro da Sala/Copa do Dia | Mais um cadeado na primeira tela. 40 dias de contagem é muito tempo pra ocupar espaço nobre |
| 4 | Chave completa na Escalação | `Lineup.tsx` (`Bracket`, linha 122) | **Ficar só com a fileira das 4 fases** (`.cup-bug`); a chave abre num toque ("Ver a chave") | As duas mostram a mesma coisa. Tira ~450 px e o "Jogar" sobe |
| 5 | Chave completa no Resultado | `Result.tsx` linha 211 | Mesmo: some, fica o caminho (`rc-path`) que já está no topo; a chave inteira só no campeão | Repetição. A animação de "subir na chave" pode ir pro caminho de 4 bolinhas |
| 6 | "Craque da partida" e "Virou carta Destaque" separados dos Destaques | `Result.tsx` / `ChampionExtras.tsx` | **Juntar num bloco só** ("Craque: Dodrio, virou Destaque +2") | O mesmo Pokémon aparece 3 vezes na tela |
| 7 | Resultado da final embaixo do Campeão | `ChampionView.tsx` + o resto do `Result.tsx` | **Cortar:** no título, a final já está em "A final" | Metade dos 9739 px |
| 8 | Elenco campeão com 10 números por carta | `ChampionView.tsx` | **Carta + 2 números** (gols, nota); o resto num toque | Parede de tabela no momento mais emocionante |
| 9 | Dica fixa no topo de 5 telas | `<Tip>` em Draft, Lineup, Result, Reward, Shop | **Só na 1ª copa** (já tem o "Dicas nas telas"; deixar desligado depois de ver 1x cada) | Repetem o título da tela ("Escolha uma recompensa" + "Dica: Ganhou! Pegue...") |
| 10 | Bolinhas amarelas de "novo" | Perfil, abas, Sala, Coleção, avatar (`NewDot`, 8 arquivos) | **Uma bolinha só, no avatar do topo**, e dentro só na aba que tem novidade de verdade | Em `26-colecao-perfil-m` são 5 bolinhas e 20+ etiquetas NOVO. Quando tudo é novo, nada é |
| 11 | "Perfil" duas vezes na Home | Avatar no topo (`TopActions`) e `DoorTiles` no fim | **Tirar o cartão Perfil do fim** (ou trocar pelas 3 portas: Perfil, Coleção, Sala) | Hoje Coleção e Sala só se acham passando pelo Perfil |
| 12 | 3 caminhos pra Ajuda/boas-vindas | "?" no topo, "Ajuda" no rodapé, "Ver o passo a passo" na Ajuda e nas Configurações | **O "?" leva pra Ajuda**; o passo a passo fica só dentro da Ajuda | Menos um botão no topo de toda tela de menu |
| 13 | Idioma no rodapé da Home | `LangToggle` | Manter só nas Configurações (e detectar pelo navegador) | Mais um controle no rodapé que já tem 7 links |
| 14 | "Cartas (teste)" no rodapé | `Home.tsx`, só no dev | Ok ficar, mas some nos prints: lembrar que não é problema | |
| 15 | Configurações avançadas | `Settings.tsx` | **Bloco "Mais opções" fechado** com: Velocidade nas chances de gol, Setinha do seu time, Nomes na quadra, Efeitos cinematográficos, Confirmar antes de sair, Experimentos | Fica Idioma, Som (volume geral + gritos), Velocidade inicial, Reduzir movimento, Dados. De 21 pra ~9 à vista |
| 16 | 10 filtros na Sala de troféus | `TrophyRoom.tsx` (Copa, Liga, Copa do Dia, Duelo, Medalhas, Hall, Platina, Números, Coleção, Clube) | **Esconder os vazios** (Liga fechada, Platina sem nada) e tirar "Coleção" e "Clube" (já são portas próprias) | Na `27-sala-d` são 10 pílulas sobre um quarto que já é o menu |
| 17 | 46 treinadores numa grade aberta | `TrainerTab.tsx` | **Mostrar os liberados + "35 trancados" num toque**; as missões ficam numa lista curta "Próximas 3" | 4863 px viram ~1500 |
| 18 | Barra de velocidade com "Lances" | Partida, `MatchHud.tsx` | O "Lances" já é aba do painel; tirar da barra ou tirar a aba | Mesmo nome, duas coisas em lugares diferentes |

Não recomendo tirar: Duelo, Copa do Dia, Mercado, Rota, Álbum, Golpedex, emotes, faixa da torcida, Melhores momentos.
Todos têm lugar próprio e não pesam fora dele. O que pesa é a Home e as telas de "fim" (Resultado, Campeão).

## 3. Hierarquia por tela (as 3 correções de cada)

**Home** (`Home.tsx`, `home-motion.css`, `.mode-cards` em `styles.css`)
1. Uma ação principal: **"Nova copa" grande, vermelho, largura cheia**, logo abaixo do nome do time. Hoje é um
   `cup-mode-go` pequeno dentro do `.cup-mode.bc-tile` dentro do `.cup-card` (3 caixas aninhadas). Tire a etiqueta
   "MODOS PRINCIPAIS" e o subtítulo "escolha o tamanho da copa" (com um modo só, não tem tamanho pra escolher).
2. Duelo e Copa do Dia como **dois cartões irmãos menores**, botão comum (`.btn`), sem a arte VS no desktop esticando o
   cartão (`01-home-d-full`: o Duelo tem 250 px vazios). No desktop, os dois lado a lado embaixo da Copa.
3. Topo: a faixa "Semana do tipo Água" vira uma linha dentro da Copa ("Semana Água: cartas Evento de Água no
   draft"); o topo fica só com engrenagem e avatar. Com o item 1 e 2 da seção 2, a Home cabe em ~1,3 tela no celular.

**Draft** (`Draft.tsx`, `.draft-grid`)
1. No celular, **as 3 cartas vêm antes da quadra vazia** quando é escolha (capitão e opções). Em `03-draft-captain-m`
   a pessoa vê uma quadra vazia de 600 px e as cartas começam no 2º scroll; a 320 (`03-draft-captain-s`) a 3ª carta
   fica atrás da barra do "Monta pra mim".
2. **Um vermelho por tela:** os 3 "Escolher capitão"/"Escalar" vermelhos viram botões comuns (ou a carta inteira é o
   toque) e o vermelho fica pro "Confirmar" depois de escolher. Hoje são 3 primários iguais.
3. Formação (`02-formation-m`): 6 cartões de 130 px; com a descrição em uma linha e o desenho menor cabem 6 na tela.

**Escalação** (`Lineup.tsx`)
1. **"Jogar oitavas de final" no topo do celular** (hoje fica na barra fixa que aparece só no meio do scroll, depois
   da chave). Ordem: caminho de 4 fases → rival (1 linha) → quadra → Jogar fixo embaixo.
2. Tática, escanteio, cobrador e sinergias num bloco **"Tática" que abre num toque** (a tática já muda no jogo, então
   não precisa estar aberta antes). Fica a linha "Equilibrado · Varia" com o lápis.
3. Formação: as 6 opções em `bc-seg` de 2 linhas viram um `<select>` ou um botão "Losango (1-2-1)" que abre a lista,
   como já é no painel da partida (`09b-match-posicoes-m`). Mesma peça nos dois lugares.

**Partida (HUD)** (`Match.tsx`, `MatchHud.tsx`, `sideline.css`)
1. **A quadra é a protagonista e no celular ocupa 24% da altura** (`10-match-later-m`: 200 px de 844). O painel de
   tática ocupa metade. Proposta: painel recolhido por padrão (só as abas + Substituir), quadra cresce pra ~45%; abre
   puxando.
2. Camadas ao mesmo tempo num gol (`09b-match-posicoes-m`): faixa do golpe, "GOOOOOL!", cartão "GOL! Dodrio", retrato
   com Zzz, faixa da torcida, rótulos "EMPAREA!"/"CORTOU!" e o narrador embaixo; no desktop (`09-match-d`), "QUE DEFESA!" e o cartão "DEFESA!" ao mesmo tempo. Regra: **no gol, só o GOL e o cartão
   do autor**; o resto espera 1,5 s.
3. "Substituir" amarelo de largura cheia é o elemento mais forte da tela, mas é a ação mais rara. Vira botão comum
   na aba Time; no intervalo do desktop (visto na revisão; o print se perdeu numa recarga) ele aparece **duas vezes** (no painel do
   intervalo e na barra). Deixar só no painel do intervalo.

**Resultado** (`Result.tsx`, `ResultHero.tsx`)
1. Primeira tela: VITÓRIA, placar, fala, **o botão "Escolher recompensa"** e só. Os 3 números (posse, chutes, golpes)
   já ficam; o time em sprites e o próximo rival podem ir pra recompensa/escalação.
2. Abaixo do botão, **um bloco "Destaques"** (craque + gols + evolução, juntos) e as estatísticas em abas fechadas
   ("Ver estatísticas"). Corta a chave (seção 2, item 5) e a dica.
3. Campeão (`ChampionView.tsx`): ordem fixa curta: troféu → Bola/Chuteira/Luva de Ouro → elenco (só cartas) → gol
   da copa → **um vermelho "Nova copa"** + Compartilhar + Melhores momentos como botões comuns. O resto ("Seleção",
   "Gols da campanha", mapa, golpes) atrás de "Ver a campanha inteira".

**Recompensa** (`Reward.tsx`)
1. As 3 opções com **a mesma moldura e a mesma altura**: em `13-reward-m` o item e a MT são caixas de 230 px e o
   Pokémon é uma carta de 230 px solta embaixo, numa 2ª linha. No celular, uma coluna de 3 linhas iguais (sprite à
   esquerda, texto, botão) lê melhor que 2+1.
2. Três "Escolher/Contratar" vermelhos → o toque escolhe, um "Confirmar" vermelho embaixo.
3. "Seu time" (quadra inteira) já ajuda a comparar, mas ocupa 750 px: vira a fileira compacta de 7 sprites com nota.

**Mercado** (`Shop.tsx`, `shop.css`), está bom
1. A dica repete o bloco "A vitória rendeu" (os dois explicam os juros): fica só o bloco.
2. Patrocínio é a única peça com fundo creme e laranja (`SponsorCard.tsx`); as vagas embaixo são barras azul/laranja
   chapadas. Usar a mesma moldura de painel nas vagas e deixar o creme só pro cartão do contrato.
3. Os botões "Comprar · ₽7" com contorno amarelo estão ótimos: é o padrão que eu usaria pra toda ação repetida em
   grade (Recompensa, Draft, Amigos).

**Mapa / Rota / Grupo** (`CupMap.tsx`, `long-cup.css`)
1. No celular os patrocínios do topo viram 3 blocos coloridos só com ícone (`22-mapa-meio-m`): sem nome ninguém sabe
   o que é. Mostrar o nome cortado ou um "2 patrocínios" que abre.
2. O "1/1" com o cartãozinho amarelo não se explica sozinho: "Cartão 1/1" ou um `title`.
3. A caixa de fala do líder cobre o botão principal no Grupo (`23-grupo-m-full`: o vermelho fica atrás da caixa).
   Na fala, esconder a barra do polegar; depois do "Continuar" ela entra.

**Perfil** (`Profile.tsx`, `PlayerCard.tsx`, `TrainerTab.tsx`)
1. "Treinador" aparece 4 vezes na mesma tela (cartão, aba, título do painel, "Seu treinador"): o cartão do topo
   fica, o título do painel some (a aba já diz).
2. Os atalhos Sala e Coleção no topo repetem o que deveria estar na Home (seção 2, item 11). Se a Home ganhar as 3
   portas, aqui podem sair.
3. Grade de treinadores (seção 2, item 17). A aba Clube (`43-clube-m-full`) é um editor bom, mas tem 18 símbolos e 11
   cores em grade aberta: o editor pode abrir com a prévia do placar em cima (hoje está no fim, e ela é o porquê de
   tudo).

**Coleção** (`Collection.tsx`, `golpedex/`, `profile/Album.tsx`), está boa
1. Os filtros da Pokédex usam pílulas redondas de contorno amarelo (`44-dex-m`), um 3º jeito de fazer filtro (além de
   `.bc-seg` e `.bc-tabs`). Trocar por `.bc-seg` rolável.
2. Fileira de tipos corta no lado direito sem indicar que rola: fade na borda.
3. Álbum: a Gen 2 fechada ocupa meia tela no celular (`28-album-m`); ela pode ser um livro menor, cinza.

**Sala de troféus** (`TrophyRoom.tsx`, `trophy-room.css`, `TrophyRoomScene.ts`)
1. No celular o quarto tem 230 px de altura e a fala cobre metade (`27-sala-m`). O quarto é o menu: ele precisa de
   ~55% da tela. Fala do tutorial embaixo do quarto, não em cima.
2. 10 filtros (seção 2, item 16).
3. "Como funciona" e "Ver tudo em lista" são a admissão de que o quarto sozinho não basta. Ok manter a lista, mas
   como ícone no cabeçalho (`MenuHead`), não como 2 botões soltos.

**Configurações** (`Settings.tsx`, `settings.css`)
1. Bloco "Mais opções" fechado (seção 2, item 15).
2. "Apagar dados deste aparelho" é o único vermelho da tela e é destrutivo: deve ser `.btn.danger` com contorno, não
   o vermelho cheio de ação principal (a regra diz: vermelho = ação principal).
3. Ajuda (o bloco "Ajuda") sai daqui; já existe a tela Ajuda.

## 4. Sistema: o que destoa entre as telas

Medido no CSS (`src/ui/*.css` e subpastas: 24 mil linhas, `styles.css` sozinho com 7612):

- **Tamanho de fonte: 25 valores diferentes**, de 8 a 64 px, incluindo 8, 8.4, 9 e 9.5 px (abaixo do mínimo de 10 do
  guia). Os mais usados são 12 (164x), 11 (97x), 13 (88x) e 10 (66x).
- **Raio: 4, 6, 8, 10 no guia; no código também 2, 3, 12, 999 (40 pílulas) e 50%.** As pílulas de 999 px (filtros da
  Pokédex, da Sala, "Meu time/Rival") não existem no kit.
- **Espaço:** `gap` com 12 valores (1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18). 6 e 8 brigam pelo mesmo lugar.
- **Cor:** 541 hex diferentes (muitos são de tipo e raridade, que é certo, mas o resto é token esquecido).
- **Cabeçalho de tela:** três modelos. `MenuHead` com etiqueta "MENU" e voltar (Perfil, Coleção, Sala, Ajuda,
  Configurações); `bc-screenhead` com etiqueta da fase e sem voltar (Draft, Recompensa, Mercado); e nada (Escalação,
  Resultado, Duelo, que no Duelo vira "Sala ABCDEF" solto, `32-duelo-m-full`). A etiqueta "MENU" não informa nada.
- **Logo no topo**: na partida ele encolhe pra ~40 px (`09-match-m`, `09-match-d`), abaixo do mínimo de 120 do
  guia e ilegível. É o `.topbar .brand` de `App.tsx`.
- **Botões de ação repetida em grade:** Mercado usa contorno amarelo; Draft, Recompensa e Amigos usam vermelho cheio
  (Amigos tem **6 vermelhos** na tela, `30-amigos-m-full`).
- **Painéis:** `.panel` com borda 3 px, `.bc-surface` sem borda, `.bc-tile` e caixas do Mercado/Recompensa com
  bordas próprias. Recompensa mistura `.panel` (item, MT) e carta solta (Pokémon).
- **Etiquetas:** `.bc-tag` dourada, a faixa diagonal "EM BREVE/BETA" (`data-ribbon`), NOVO amarelo pequeno, "VALENDO"
  e o "craque" com estrela. Quatro formas de dizer "isto é especial".

**Regras propostas (curtas, pra pôr no brand guide):**

1. **Um vermelho por tela.** Ações repetidas em lista ou grade usam o botão de contorno amarelo do Mercado
   (`.btn.outline`, a criar a partir do `shop.css`). Destrutivo é `.btn.danger` de contorno.
2. **Escala de fonte de 6 degraus:** 10 (etiqueta), 12 (apoio), 14 (texto), 16 (nome/botão), 20 (título de bloco), 28+
   (placar/título de tela, Galmuri14). Nada abaixo de 10. Variáveis `--fs-*` no `:root`.
3. **Escala de espaço de 4 em 4:** 4, 8, 12, 16, 24, 32. `--sp-*`. O 6 vira 8, o 10 e o 14 viram 12 ou 16.
4. **Um cabeçalho só** (`MenuHead`) em toda tela fora da quadra: voltar à esquerda, título, etiqueta = onde estou
   ("COPA · OITAVAS", "PERFIL"), nunca "MENU".
5. **Filtros e abas só de `.bc-seg` e `.bc-tabs`.** Pílula redonda sai.
6. **Novidade = uma bolinha no avatar.** NOVO escrito só no item novo, uma vez; some depois de visto.
7. **Em breve fora das telas de jogo.** Coisa trancada só aparece onde a pessoa procura (Novidades, Ajuda).
8. **Opções de escolha têm a mesma moldura e a mesma altura** (Draft, Recompensa, Mercado).

## 5. Celular (320 e 390)

- **320, Home** (`01-home-s`): o cabeçalho "Copa" (`.cup-card .mode-head`) **vaza pra fora da borda amarela** à
  direita e corta o texto ("...escolha o"). E o "Nova copa" fica abaixo da dobra (568). Deitado (`50-home-l`) também.
- **320, Draft** (`03-draft-captain-s`): a 3ª carta fica atrás da barra fixa "Monta pra mim"; falta `padding-bottom`
  do tamanho da barra no `.draft-grid`.
- **390 e 320, Partida** (`10-match-later-s`): quadra de 170 px a 320. Os nomes na quadra e a faixa do golpe ficam do
  tamanho dos Pokémon. É a tela mais importante e a mais apertada.
- **390, Sala** (`27-sala-m`): o quarto fica pequeno e a fala cobre os troféus.
- **390, Mapa** (`22-mapa-meio-m`): patrocínios só com ícone; a fala do líder cobre o nó atual.
- **390, Grupo** (`23-grupo-m-full`): a fala cobre o botão principal.
- **Rolagem lateral:** nenhuma tela passou da largura (conferido em todas, `scrollWidth <= innerWidth`).
- **Alturas no celular:** Campeão 9739 px, Perfil 4863, Resultado 3475, Configurações 3155, Escalação 2929, Clube 2203.
  Acima de ~2 telas, a pessoa não chega no fim; o que importa tem que estar na primeira.
- Deitado na partida (`52-match-l`) está bom: quadra grande à esquerda e painel à direita. É o layout que o celular
  em pé deveria imitar na proporção.

## 6. Plano em ondas

**Onda 1: ganhos rápidos (1 dia, sem mexer em regra de jogo)**

| Item | Esforço |
|---|---|
| Tirar os 4 "Em breve" da Home e esconder Rota trancada e Liga fechada | 1 h |
| "Nova copa" vermelho largura cheia; tirar "MODOS PRINCIPAIS" | 1 h |
| Consertar o vazamento do `.mode-head` a 320 | 20 min |
| Escalação e Resultado: tirar a chave completa (fica o caminho de 4 fases; chave num toque) | 1,5 h |
| Dicas `<Tip>` só na 1ª copa | 30 min |
| Vermelhos repetidos → contorno amarelo (Draft, Recompensa, Amigos, Campeão) | 1,5 h |
| "Substituir" sem duplicar no intervalo; "Lances" fora da barra de velocidade | 45 min |
| Logo da partida: trocar por `simbolo.svg` (24 px+) ou tirar na quadra | 20 min |
| Configurações: "Mais opções" fechado | 1 h |
| Prints 320/390/deitado/1440 das telas mexidas | 1 h |

**Onda 2: hierarquia das telas de fim e de escolha (2 a 3 dias)**

| Item | Esforço |
|---|---|
| Resultado enxuto: primeira tela + bloco Destaques único + estatísticas fechadas | 0,5 dia |
| Campeão enxuto: ordem fixa, campanha inteira atrás de um toque, sem o resultado da final repetido | 0,5 dia |
| Recompensa: 3 opções na mesma moldura, toque escolhe, um "Confirmar" | 0,5 dia |
| Draft no celular: cartas antes da quadra vazia; padding da barra fixa | 0,5 dia |
| Escalação: Jogar no topo, Tática recolhida, formação como seletor | 0,5 dia |
| Bolinhas de novidade: só no avatar e na aba certa (`NewDot`) | 2 h |
| Home: 3 portas (Perfil, Coleção, Sala) no lugar do cartão Perfil; "?" leva pra Ajuda | 2 h |

**Onda 3: sistema (3 a 5 dias, em partes)**

| Item | Esforço |
|---|---|
| Tokens `--fs-*` e `--sp-*` no `:root` e trocar os valores soltos (por tela, começando pela Home) | 2 dias |
| `MenuHead` em toda tela fora da quadra, etiqueta = onde estou | 0,5 dia |
| Filtros em `.bc-seg` (Pokédex, Sala, Meu time/Rival); pílula de 999 px sai | 0,5 dia |
| Partida no celular: painel recolhido por padrão, quadra ~45% da altura; regra de camadas no gol | 1 a 1,5 dia (mexe no `MatchScene`, teste olhando o jogo) |
| Perfil: treinadores trancados num toque, "Próximas 3 missões" | 0,5 dia |
| Sala: quarto maior no celular, fala embaixo, filtros vazios escondidos | 0,5 dia |
| Atualizar `docs/marca/brand-guide.md` com as 8 regras da seção 4 | 1 h |

O que precisa do ok do Miguel antes (regra do CLAUDE.md): nada aqui mexe em carta, equilíbrio ou posição. A partida
(painel recolhido, camadas no gol) mexe em como o jogo é visto: mostrar antes/depois em print antes de aplicar.

## 7. Onda 1 feita (21/10, branch `design`)

Aprovado pelo Miguel: tudo da revisão e da pesquisa (`pesquisa-layout-e-game-design.md`), com estas decisões dele:
os "Em breve" ficam, numa forma mais leve (faixa **Vem aí** na Home: cartõezinhos de silhueta com cadeado que abrem uma
folha com o teaser; a Liga com a contagem mora lá; a Rota Índigo saiu dela quando foi ao ar na 0.9.1); as boas-vindas
saem do caminho da 1ª visita (o passo a passo fica na Ajuda; começar a 1ª copa marca `onboarding_done`); a sequência de
dias da Copa do Dia fica; o botão de idioma **continua no rodapé** (agora numa linha própria, não pula ao trocar).

Feito: sistema de botões (`.btn.outline`, perigo de contorno, desabilitado com motivo; amarelo cheio aposentado),
barra do polegar em toda tela do loop, Home (Nova copa grande, Duelo e Copa do Dia como irmãos, 3 portas, "?" leva pra
Ajuda), chave inteira num toque, dicas só na 1ª copa e perto do que explicam, partida (Substituir sem duplicar, Lances
fora da barra, símbolo no lugar do logo, aba Time com o nome inteiro no PC), Configurações com "Mais opções", uma
bolinha de novidade (no avatar), Mercado (Seguir na barra, cadeado no que não dá pra comprar, time do lado com o pacote
aberto, "Novas ofertas" no lugar de "Trocar vitrine", preço no Patrocínio), retorno de toque central
(`src/ui/feedback.ts`: som por tipo, vibração desligável, sair com peso), `viewport-fit=cover`, Eliminado com Nova copa
em 1 toque e a linha do quanto faltou.

### Próxima onda (não feita nesta rodada)

- Resultado e Campeão enxutos (as três leituras: 1ª tela só com placar e a ação; Destaques num bloco; estatísticas e a
  campanha inteira atrás de um toque).
- Draft e Recompensa: tocar na carta escolhe (some o botão de cada opção; um "Confirmar" na barra), mesma moldura e
  altura pras 3 opções, cartas antes da quadra vazia no celular.
- Escalas de fonte (nativa da Galmuri: 10/12/15/24/30/45) e de espaço (4/8/12/16/24/32) em tokens `--fs-*`/`--sp-*`.
- `MenuHead` em toda tela fora da quadra, etiqueta = onde estou (nunca "MENU").
- Partida no celular em pé: quadra com ~45% da altura, painel recolhido, regra de camadas no gol (mostrar antes/depois).
- Perfil: treinadores trancados num toque, "Próximas 3 missões".
- Sala de troféus: quarto maior no celular, fala embaixo, filtros vazios escondidos.
- As 10 ideias de game design da seção 5 da pesquisa (com números e o ok do Miguel).

### Patrocínios: textos antes ⇒ depois (só texto; efeito e números iguais)

| Patrocínio | Antes (PT) | Depois (PT) | Depois (EN) |
|---|---|---|---|
| Fã-Clube Pokémon | +₽1 por gol, sem limite. | Todo gol rende ₽1, sem o limite de 3 por jogo. | Every goal pays ₽1, no 3-per-match cap. |
| Cassino de Celadon | Juros até ₽5 (em vez de ₽3). | Juros de até ₽5 por vitória (em vez de ₽3). | Interest up to ₽5 per win (instead of ₽3). |
| S.S. Anne | +₽3 por vitória. | +₽3 a cada vitória. | +₽3 per win. |
| Loja de Departamentos | Mais 1 Pokémon na vitrine. | 3 Pokémon à venda no Mercado (em vez de 2). | 3 Pokémon for sale in the Market (instead of 2). |
| Laboratório de Cinnabar | A recompensa grátis mostra 4 opções. | A recompensa da vitória mostra 4 opções (em vez de 3). | The win reward shows 4 options (instead of 3). |
| Creche Pokémon | A 1ª troca de vitrine é grátis. | A 1ª troca de ofertas de cada Mercado é grátis. | The first offer refresh in each Market is free. |
| Safari Zone | Pacote de tipo com 4 cartas. | Pacote de tipo com 4 cartas (em vez de 3). | Type packs have 4 cards (instead of 3). |
| Silph Co. | +3 em tudo pra quem é do tipo do capitão. | +3 em tudo pra quem tem um tipo do capitão. | +3 to everything for Pokémon sharing a type with the captain. |
| Bicicletaria de Cerulean | +4 de velocidade pros Alas. | (igual) | +4 pace for Wingers. |
| Academia de Saffron | +4 de passe pro time todo. | (igual) | +4 passing for the whole team. |
| Torcida de Vermilion | +3 de força pros Fixos e o Goleiro. | (igual) | +3 physical for Defenders and the Keeper. |
| Patrocínio Master | +2 em tudo pro capitão, +1 por outro Patrocínio. | Capitão com +2 em tudo, +1 por Patrocínio a mais. | Captain gets +2 to everything, +1 per other Sponsor. |

Os nomes ficaram (lugares de Kanto, já curtos). No Mercado, "Trocar vitrine" virou **Novas ofertas** ("vitrine" agora
é só a de cartas do Perfil/Coleção/Duelo).
