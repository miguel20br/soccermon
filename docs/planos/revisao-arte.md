---
description: Revisão de arte e das sprites da 0.9.44 (escala, nitidez, animação, pé no chão, famílias), com achados por gravidade e o top 10.
---

# Revisão de arte e das sprites (0.9.44, 09/11/2026)

Pedido do Miguel (09/11): "uma revisão de arte e de bom gosto, e também sobre como as sprites se comportam no jogo.
Elas estão consistentes, e bonitas?"

Base: worktree `v0944` (0.9.44 e depois 0.9.44.1), servidor dev local na porta 8131, Chromium headless do Playwright,
390x844 e 1440x900. Tudo testado no **dev local** (demos `?demo=`), nada em produção. Só leitura: nenhum código mudou.

Evidências em `/home/bartolomeu/.cache/claude-tmp/claude-1000/-home-bartolomeu-Projects-soccermon/f446d3d3-ffc7-4829-b86e-0a71ade8ebd8/scratchpad/arte/`
(abaixo, `arte/`):

- `arte/folha-151-idle.png`, `arte/folha-151-walk-direita.png`, `arte/folha-151-idle-shiny.png`: os 151 em Idle de
  frente, Walk pra direita e shiny, todos a 2x com o pé na linha amarela (script `arte/varre.mjs`).
- `arte/sprites.json`: por espécie, tamanho do quadro e do corpo, animações que faltam, durações, shiny, retratos.
- `arte/pes-idle.json` (script `arte/pes.cjs`): quanto o corpo sobe dentro do Idle e quanto tempo fica no ar.
- `arte/telas/<tamanho>-<tela>.png`: prints; `arte/medidas-*.json`: cada sprite visível com tamanho na tela, escala
  efetiva (largura na tela / largura do arquivo), zoom do CSS e `image-rendering`.
- `arte/recortes/*.png`: recortes ampliados (vizinho mais próximo) dos problemas.

## Como as sprites estão montadas hoje

| Família | Arquivo | Onde aparece |
|---|---|---|
| PMD de quadra (8 direções) | `public/assets/field/*.png` | partida (Phaser), Estádio, Lab, Rota, Arena, Sede, menu de modos, Treino, Novidades |
| PMD "fora da quadra" (Sleep, Sit, Eat, Faint) | `public/assets/field/extra/` | Sala de troféus, fim de copa (`PmdSprite`) |
| Retrato PMD 40x40 | `public/assets/portraits/` | faixa de lance, Eliminado, Duelo |
| GIF animado do Black/White (recortado no corpo, de 31 a 128 px) | `public/assets/cards/*.gif` | cartas, VERSUS, Hall da Fama, escalação, Golpedex (Especiais), Ajuda, boas-vindas |
| Avatar GIF 63x63 | `public/assets/avatars/` | a bolinha do treinador na barra de cima |
| Ícone de caixa (pokesprite) | `MonIcon` | capitão rival no mapa da Rota |
| Treinador (Showdown) | `public/assets/trainers/` | falas, Time Ultimate, Cassino, Hall |

A varredura dos 151 não achou buraco: todos têm Idle, Walk, Attack, Hurt e Hop nas 8 direções, todos têm o atlas
extra, carta e avatar. Faltam só opcionais com reserva no código: Pose em 121 espécies, Trip em 124, Shoot em 2;
shiny do PMD em Pidgey e Raichu (ficam com a tinta amarela, `src/data/pmd-shiny-missing.json`); 35 espécies têm de 1
a 4 emoções de retrato (cai no rosto normal). A folha shiny confere com as cores certas (Charizard preto, Gyarados
vermelho etc.).

## Achados

Gravidade: **F** = feio de verdade (dá pra ver sem procurar), **D** = destoa, **d** = detalhe. Esforço: P (até 1 h),
M (meio dia), G (mais que isso). Tipo: **tela** (CSS ou tela, pode ir direto), **carta** (visual de carta: passa pela
galeria `?cards=1`), **partida** (mexe no visual da partida, não no motor), **decisão** (precisa do Miguel).

### F1. Sprite reduzido com `pixelated`: pixel some (tela, P)

- **Onde:** a bolinha do treinador na barra de cima de **todas** as telas (avatar 63 px desenhado em 48: 0,76x);
  Hall da Fama (GIFs em caixa de 56 px: Mew 0,73x, Aerodactyl 0,60x, Mewtwo 0,62x); Novidades/Perfil (Charizard
  0,35x a 0,47x); Time Ultimate no PC (treinadores 0,61x a 0,95x); vaga do draft no PC (Hitmonchan 0,59x); mapa da
  Rota (capitão 0,70x a 0,87x).
- **Print:** `arte/recortes/hall-da-fama-row.png` (o rabo do Mew vira pontinhos, o Aerodactyl perde a asa),
  `arte/recortes/avatar-topo-reduzido-pixelated.png`, `arte/recortes/draft-slot-hitmonchan.png`.
- **Causa:** `img.pixel { image-rendering: pixelated }` (`src/ui/styles.css:123`) vale também quando a imagem é
  reduzida; o guia diz o contrário ("reduzir? `image-rendering: auto`"). Caixas fixas: `.hp-squad img`
  (`styles.css:6818`), `.res-me .pf-avatar` (`src/ui/kit/topbar.css:73`), `MaxDex.tsx:245/252`.
- **Conserto:** onde a caixa é menor que o arquivo, `image-rendering: auto` (ou o avatar em 63/126 px). Um teste de
  navegador que procura `img.pixel` com escala efetiva < 1 pega a próxima.

### F2. O Idle dos menus roda no relógio errado: o Pikachu quica e flutua (tela, M)

- **Onde:** todo `FieldSprite` (Estádio, ambientes, menu de modos, Treino, Novidades, mapa).
- **Medido:** 64 espécies sobem o corpo 2 px ou mais dentro do Idle. Na partida isso é um pulinho curto (o 1º quadro
  segura 0,5 a 1 s). No menu cada quadro dura 170 ms fixos, então **28 espécies passam 75% a 88% do tempo no ar**,
  contra 17% a 29% na partida: Pikachu (+8 px), Mewtwo (+6), Dragonite, Tauros (+7), Charmeleon, Cubone, Pidgey,
  Spearow, Chansey… Vaporeon e Jolteon respiram 3,7x mais rápido que na partida; Beedrill bate asa 2,5x mais devagar.
  O Walk vai de 0,5x a 2x a velocidade da partida conforme a espécie. Hop roda em loop a 80 ms (Eevee no menu,
  Meowth nas Novidades): pula sem parar.
- **Print:** `arte/recortes/estadio-1440-capitao-sombra.png` (o capitão a ~20 px acima da sombra), dados em
  `arte/pes-idle.json`.
- **Causa:** `const MS = { Walk: 110, Idle: 170, Hop: 80, Pose: 120 }` em `src/ui/ambientes/FieldSprite.tsx:99`
  ("o AnimData fica fora do pedaço"). O pé de cada espécie (`sprite-feet.json`) é medido no 1º quadro
  (`scripts/build-sprite-feet.ts:25`), que é o quadro "embaixo"; os outros ficam acima dele.
- **Conserto:** gravar as durações do AnimData no JSON da folha da quadra (o atlas extra já faz isso,
  `build-pmd-atlas.ts --extra`) e usar no `FieldSprite`; Hop sem loop (toca e volta pro Idle). Sem mudar o pedaço
  da Home: o JSON já é baixado por espécie.

### F3. Estádio no PC: três tamanhos de pixel na mesma cena (tela, P)

- **Onde:** Estádio a 1440 (e Arena).
- **Medido:** capitão 4x (2x do sprite e `scale: 2` no CSS), Pokémon da beira 3x, os da arquibancada e da bola 2x.
  O Snorlax dormindo na arquibancada fica menor que o Pikachu capitão. Na Arena, o seu e o rival a 4x e o selvagem
  do lado a 3x.
- **Print:** `arte/recortes/estadio-1440-tres-escalas.png`, `arte/recortes/arena-4x-vs-3x.png`,
  `arte/telas/1440x900-estadio.png`.
- **Causa:** `src/ui/ambientes/ambientes.css:662` (`scale: 2` no `.es-captain`), `Estadio.tsx:218` e o `zonesOf` do
  Estádio (`stand`/`ball` 2x, `edge` 3x), `Arena.tsx:55` (4x).
- **Conserto:** uma escala por cena e por tamanho de tela (ver D2); destaque do capitão com sombra, luz ou a
  placa, não com pixel maior. Junto: a bola do capitão (SVG liso) sobe por cima da placa PALLET FC no PC, porque o
  `scale: 2` dobra o malabarismo.

### F4. Carta: cada Pokémon com um tamanho de pixel (carta, M)

- **Onde:** toda carta (`PokeCard2`): draft, Mercado, Safari, Cassino, Álbum, galeria.
- **Medido:** no draft a 1440, lado a lado, Rapidash a 2,2x, Dragonair a 2,6x e Tangela a 3,4x. No celular, de 1,1x
  a 2,6x. A arte também leva `drop-shadow` com desfoque (sombra macia).
- **Print:** `arte/telas/1440x900-draft.png`, `arte/recortes/draft-3-cartas-escalas-diferentes.png`,
  `arte/recortes/cards-topo.png`.
- **Causa:** `.m-art { width: 11em; height: 11em; object-fit: contain; filter: drop-shadow(0 .2em .15em …) }`
  (`src/ui/components/pokecard2.css:3346`): o GIF recortado (de 31 a 128 px) é esticado pra caber, em escala
  quebrada; o palco do PC ainda multiplica por 1,35.
- **Conserto (pra galeria):** escala inteira por carta (a maior que cabe: `floor(caixa / maior lado)`), centrada no
  pé; sombra dura. Fica cada Pokémon com um tamanho, mas todos com o mesmo pixel. Mostrar na `?cards=1` antes.

### F5. Mapa largo da Rota: o capitão rival cobre o nome da casa de cima (tela, P)

- **Onde:** mapa da Rota a 1440 (4 casas por linha); no celular encosta na casa vizinha.
- **Print:** `arte/recortes/mapa-largo-rivais-cobrem-rotulos.png` (TREINO, MERCADO, SAFARI e MERCADO cobertos),
  `arte/telas/1440x900-mapa.png`.
- **Causa:** `.cm-node-rival { top: -12px; left: calc(50% + 8px); z-index: 1 }` (`src/ui/long-cup.css:289`) e as linhas
  apertadas do mapa largo (`CupMap.tsx`, `rowH`).
- **Conserto:** o ícone ao lado da casa, na altura do meio (`top: 50%`, `left: calc(50% + 22px)`), ou o rótulo por
  cima (`.cm-label { position: relative; z-index: 2 }`). Ele também é de outra família (ícone de caixa do
  pokesprite), ver D1.

### F6. Partida no celular: sprite em escala quebrada e nome ilegível (partida, M)

- **Onde:** quadra a 390 (print da partida do `?demo=evolucao`).
- **Medido:** `SPRITE_SCALE = 1.8` vezes o FIT do canvas (968 px de quadra em 390) vezes o zoom da câmera dá perto de
  1x, quebrado; com `pixelArt: true` o vizinho mais próximo come linhas (Bellsprout e Weepinbell perdem pixel). O
  nome embaixo de cada um vira borrão ("Bellsprout", "Exeggcute" não se leem).
- **Print:** `arte/recortes/partida-390-sprites-e-nomes.png`, `arte/telas/390x844-evolucao.png`.
- **Causa:** `src/game/scenes/MatchScene.ts:243` e `src/game/main.ts:11`.
- **Conserto:** testar `render: { smoothPixelArt: true }` no lugar de `pixelArt: true` (o Phaser 4.2.1 tem: pixel
  quadrado com borda suave, sem pixel sumindo em escala quebrada); nomes com `resolution` maior ou só o do seu time e
  o do jogador com a bola. Não mexe no motor nem no `ENGINE_VERSION`. Precisa olhar em 1x, 4x e no replay.

### F7. Menu de modos no PC nasce com sombras sem Pokémon (tela, M)

- **Onde:** menu de modos a 1440, no dev local.
- **Visto:** aos 1,5 s o Modo Clássico tem só as sombras e a bola; aos 8 s todos aparecem.
- **Print:** `arte/telas/1440x900-modos.png` (vazio) e `arte/telas/1440x900-modos2.png` (cheio).
- **Causa provável (hipótese, não medi a rede):** cada espécie baixa a folha inteira da quadra (até 1584x3904) pra
  recortar 4 animações num canvas (`FieldSprite.tsx`, `loadSheet`), e nada aparece até terminar.
- **Conserto:** gerar no build uma folha só do menu (Idle, Walk, Hop, Pose) por espécie, ou mostrar o 1º quadro do
  Idle assim que o JSON chega. Conferir na prévia da Vercel, que é o que o jogador vê.

### D1. O mesmo Pokémon em duas caras (decisão)

- **Onde:** o time aparece em BW (detalhado, grande) no VERSUS, no Hall da Fama, na escalação e nas cartas; logo
  depois entra em campo em PMD (chibi). No fim da copa volta em PMD (desmaiado) e no Hall em BW. No mapa, ícone de
  caixa. Quatro famílias pro mesmo time em 2 minutos de jogo.
- **Print:** `arte/telas/1440x900-evolucao.png` (VERSUS) contra `arte/telas/390x844-evolucao.png` (partida),
  `arte/telas/390x844-campeao.png` (Hall).
- **Proposta:** carta continua BW (é arte de carta); tudo que é "lugar" ou "momento do time" vira PMD: VERSUS e
  Hall da Fama (o time desfilando em Walk, que já existe nos ambientes), escalação com o sprite da quadra. O ícone
  de caixa no mapa vira o sprite PMD em 1x. Esforço M por tela.

### D2. O tamanho do Pokémon muda de ambiente pra ambiente (tela, P)

- **Medido no PC (1440):** Rota 2x, Estádio 2x/3x/4x, Lab 3x, Sede 3x, Arena 3x/4x, Treino 2,7x/4,05x, menu de modos
  3x com o herói a 5x, Novidades `s` e `s+1` na mesma arte. **No celular:** Rota 1x (o nadador do mar 2x), os outros 2x.
- **Causa:** cada tela escolhe a sua: `Rota.tsx:362` (`big ? 2 : 1`), `Arena.tsx:55` (`big ? 4 : 2`), `Lab.tsx` e
  `Sede.tsx` (`big ? 3 : 2`), `ModeMenu.tsx:559` (herói `big ? 5 : 3`), `NewsFeed.tsx:68/152/179` (`s + 1`).
- **Conserto:** uma constante (`small 1 / normal 2 / big 3`) usada por todos; herói, se o Miguel quiser, com +1 só no
  menu de modos. Print: `arte/recortes/modos-heroi-5x-vs-cena-3x.png` (Mewtwo com pixel bem mais grosso que o
  Charmander do lado).

### D3. O zoom do palco no PC quebra a escala das sprites (tela, M)

- **Onde:** telas dentro de `.k-stage-body` e do zoom da Coleção no PC: Treino (2,7x e 4,05x), draft, Mercado, Álbum,
  Time Ultimate (treinadores 0,6x a 0,95x), Eliminado (1,095x).
- **Causa:** `--k-big: 1.2 / 1.35` e `--k-fit` (`src/ui/kit/stage.css:85-101`, `Stage.tsx:89`) dão `zoom` em tudo,
  sprites inclusive. Print: `arte/recortes/treino-1440-zoom135.png`.
- **Conserto:** nos blocos de sprite, desfazer o zoom (`zoom: calc(1 / var(--k-z))`, como já se faz com o canvas em
  `styles.css:89`) e escolher a escala inteira com o tamanho de verdade.

### D4. Fim de copa: a fileira do time com 1x e 2x misturados (tela, P)

- **Onde:** Eliminado (o time desmaiado).
- **Print:** `arte/recortes/eliminado-time.png` (Kakuna com pixel mais grosso que Gyarados e Pidgey).
- **Causa:** `PmdSprite` com `fit` escolhe a escala por espécie (`src/ui/components/PmdSprite.tsx:93`).
- **Conserto:** a fileira calcula uma escala só (a menor que cabe pra todos) e passa pra todos.

### D5. Ficha da carta: títulos colados e em caixa alta (tela, P)

- **Onde:** carta completa, mais visível a 1440.
- **Print:** `arte/recortes/ficha-titulos-colados.png`, `arte/telas/1440x900-ficha.png`.
- **Causa:** `.panel h3 { margin: 0 0 10px }` (`src/ui/kit/kit.css:82-92`) vem depois e ganha de
  `.card-modal-right h3 { margin: 14px 0 6px }` (`src/ui/styles.css:2081`), mesma especificidade. O `uppercase` com
  espaço de 1 px também foge do guia (título de seção em caixa normal, Galmuri11 Bold).
- **Conserto:** `.card-modal-right h3` com mais especificidade e `margin-top: 18px`; tirar o `uppercase`. CSS puro.

### D6. Treino no celular: o time inteiro de costas (tela, P)

- **Print:** `arte/telas/390x844-treino.png`.
- **Causa:** `dir={wide ? 2 : 4}` em `src/ui/screens/CupMap.tsx:636`. Os cinco olham pra cima; não se vê rosto nenhum.
- **Conserto:** de frente (0) ou virados pro meio da quadra.

### D7. Eventos da Rota com cara de rascunho (tela, M)

- **Onde:** Cassino de Celadon e Zona Safari.
- **Print:** `arte/recortes/cassino-fundo-generico.png`, `arte/telas/1440x900-safari.png`.
- **Visto:** fundo em degradê liso com um ícone gigante genérico (alvo, pata) e o chão numa faixa; perto do Lab e da
  Sede desenhados, parece placeholder. A etiqueta amarela repete o título ("CASSINO DE CELADON" em cima de "Cassino
  de Celadon").
- **Conserto:** um cenário de pixel pra cada (balcão com fichas e caça-níquel; grama alta com a cerca do Safari), no
  mesmo jeito do Lab; etiqueta com outra coisa (a Rota, "Evento") ou nada.

### D8. Time Ultimate: grade de cartões iguais e rótulo cortado (tela, P)

- **Onde:** Início do Time Ultimate; momento do pacote.
- **Print:** `arte/recortes/ut-inicio-390.png`, `arte/recortes/pacote-rotulo-cortado.png`.
- **Visto:** Jogar, Clube, Loja, Metas e Destaque em cartões do mesmo jeito, dois com faixa dourada à esquerda: é o
  painel genérico que o guia evita, perto dos ambientes com lugar. No pacote, "SEU PRIMEIRO CRAQ…" cortado a 390. A
  miniatura do pacote no Destaque fica borrada (imagem reduzida).
- **Conserto:** rótulo do pacote em duas linhas ou nome curto ("1º CRAQUE"); o Início com uma peça principal (o
  Jogar grande, a vitrine do clube) e o resto em fileira menor.

### D9. Hall da Fama: um órfão na 2ª linha e fundo fora da paleta (tela, P)

- **Print:** `arte/telas/390x844-campeao.png`.
- **Visto:** 7 no time em linhas de 6: o Pikachu sozinho embaixo. Fundo radial vinho (`styles.css:6776`, mistura a cor
  do clube com o azul-noite) que fica marrom; o guia pede o azul-noite com raios. "Fechar" num botão verde (verde é
  confirmar ou comprar).
- **Conserto:** 7 numa linha (ou 4+3 centrado), fundo da marca com a cor do clube só nos raios, Fechar terciário.

### D10. Logo do pacote com sombra macia e brilho (tela, P)

- **Onde:** pacote de cartas (`.cpack-simbolo`, `.cpack-logo`, `src/ui/styles.css:7271-7282`): `drop-shadow` com
  desfoque de 6 a 8 px e brilho. O guia proíbe sombra macia e brilho no logo.
- **Conserto:** sombra dura de 2 px ou nenhuma.

### d1. Proporção entre espécies é a do PMD (decisão, aceitar)

No PMD Snorlax tem 27 px de corpo e Pikachu 25; Onix 47, Gyarados 55, Kabuto e Magnemite 14
(`arte/sprites.json`, `arte/recortes/idle-linha-gigantes.png`). É o estilo do PMD, igual em todo lugar que usa PMD.
Mexer por espécie quebraria a escala inteira. Minha sugestão: aceitar.

### d2. Retrato da faixa de lance em escala quebrada (tela, P)

`width: clamp(44px, calc(7 * var(--vw)), 76px)` (`src/ui/styles.css:3107`) põe o retrato de 40 px entre 1,1x e 1,9x.
Degraus de 40 e 80 px resolvem.

### d3. Na partida a 8x e 16x os pés patinam (partida, aceitar)

A animação acompanha a velocidade até 4x (`MatchScene.ts`, `anims.timeScale`, `Clamp(factor, 0.3, 4)`); acima disso o
corpo anda mais rápido que as pernas. Na velocidade normal está bom: a passada segue a velocidade real.

### d4. Novidades: animação que não existe e escalas misturadas (tela, P)

A arte da Golpedex pede `Pose` pro Charizard, que não tem (cai no Idle) e põe o Gengar a `s+1` ao lado do Snorlax a
`s` (`NewsFeed.tsx:68/152`): o Gengar fica maior que o Snorlax.

### d5. Meowth cortado na arte da Rota nova (tela, P)

Relatado pelo Miguel a 390; **não tirei print** (a fila pesada ficou ocupada por uma simulação longa e cancelei o lote).
Causa provável, pela leitura: o Meowth fica em `left: 88%; top: 88%` (`src/ui/components/NewsFeed.tsx`, arte
`nf-rota`) dentro de `.mm-sc { overflow: hidden }` (`src/ui/screens/mode-menu.css:220`), em Hop (quadro mais largo e
alto que o Idle) e na escala `s` de até 5x; perto do canto, o quadro passa da borda. Conserto: trazer pra
`left: 80%; top: 82%` ou Idle no lugar do Hop (que também resolve o pulo sem parar de F2).

### d6. Detalhes de tela

- Etiqueta "☆craque" no fim de copa usa a estrela de caractere como marcador (o guia pede `HudIcon`).
- Perfil no PC: o cartão do treinador pequeno à esquerda de um paredão vazio (`arte/telas/1440x900-colecao.png`).
- Partida no celular: faixa vazia entre a linha do tempo e a quadra, e a caixa de comentário branca vazia no apito
  inicial (`arte/telas/390x844-evolucao.png`).
- Mapa largo: a coluna da direita (fala do Carvalho) deixa meia tela vazia embaixo.

## O que pode ir direto, o que passa pela galeria, o que mexe na partida

| Tipo | Achados |
|---|---|
| Tela (CSS ou tela, pode ir direto) | F1, F2, F3, F5, F7, D2, D3, D4, D5, D6, D7, D8, D9, D10, d2, d4, d5, d6 |
| Carta (galeria `?cards=1` antes) | F4 (e o `pixelated` da arte da carta em F1) |
| Partida (visual, sem motor) | F6, d3 |
| Decisão do Miguel | D1 (uma família por lugar), D2 (herói maior ou não), d1 (proporção do PMD) |

## Nota honesta: as sprites estão consistentes e bonitas?

**Em parte.** As sprites em si são boas: os 151 completos, 8 direções, shiny certo, pé no chão bem resolvido na
partida (o pé medido por espécie e por animação), a passada acompanhando a velocidade, desmaio, sono e comida fora
da quadra. Na partida, olhando de longe, o time PMD fica bonito e coerente.

O que não está consistente é a **apresentação**: cada tela escolhe a sua escala (1x a 5x, mais o zoom de 1,2 e 1,35
do PC), as caixas fixas reduzem ou esticam o GIF em escala quebrada com `pixelated` (pixel sumindo no Hall, no avatar
de cima e nas cartas), os menus tocam o Idle num relógio próprio que deixa o Pikachu quicando acima da sombra, e o
mesmo time troca de família (BW, PMD, ícone de caixa) entre o VERSUS, a partida e o Hall. Nada disso está nas sprites;
está em uns dez lugares do código, a maioria CSS.

## Top 10 pra consertar primeiro

1. **F1** reduzido com `pixelated` → `auto` (avatar de cima, Hall, Novidades, UT). Tela, P.
2. **F2** durações do AnimData no `FieldSprite` e Hop sem loop (o Pikachu para de flutuar). Tela, M.
3. **F5** capitão rival do mapa largo fora do rótulo. Tela, P.
4. **D5** títulos da ficha descolados e sem caixa alta. Tela, P.
5. **F3 + D2** uma escala por cena e por tamanho de tela (Estádio, Arena, Rota, Lab, Sede, menu). Tela, P a M.
6. **F6** `smoothPixelArt` na partida e nome legível no celular. Partida, M.
7. **D3** sprites fora do zoom do palco no PC (Treino, draft, UT). Tela, M.
8. **F4** carta com escala inteira e sombra dura. Carta, M (galeria antes).
9. **F7** folha do menu gerada no build (menu de modos não nasce vazio). Tela, M.
10. **D1** decidir a família por lugar (VERSUS e Hall em PMD). Decisão, depois M por tela.

## Decidido com o Miguel (09/11)

- Fazer tudo o que é só tela de uma vez (top 10: itens 1 a 7 e 9), com antes e depois.
- Item 8 (tamanho de pixel por carta) passa pela galeria `?cards=1` antes.
- Item 10: a carta fica com a sprite BW; VERSUS, Hall da Fama e escalação passam pro PMD, igual à partida.

## Feito na branch `arte-tela` (10/11)

Testado no dev local (porta 8141, Chromium headless, 390x844, 844x390 e 1440x900); F7 medido também em produção.
Antes e depois por item: `arte/depois/*.png` (folhas) e `arte/depois/antes|depois/` (prints).

| Item | Feito |
|---|---|
| F1 | Reduzido com `image-rendering: auto`: avatar (`img.pf-avatar`), `img.trainer-sprite`, treinadores do UT, minis do fim de copa e do relatório do campeão, Hall no Perfil. Ampliação inteira continua `pixelated`. |
| F2 | `FieldSprite` usa as durações do AnimData (vêm no JSON da folha do menu); Hop toca uma vez e volta pro Idle. Pikachu no chão 75% do tempo (antes 17%). Eevee do UT e Meowth das Novidades em Idle. |
| F3 + D2 | Uma escala por cena (`src/ui/ambientes/sprite-scale.ts`, tabela abaixo). Estádio sem o `scale: 2` do capitão; Arena sem o 4x. |
| F5 | Capitão rival do lado direito do círculo e a pedra do lado esquerdo, na altura dele; rótulo por cima. |
| F6 | `smoothPixelArt` no lugar de `pixelArt` (só `src/game/main.ts`). Sprites sem linha sumindo e nomes legíveis no celular. Nome com `resolution` maior fica pra quem mexe no `MatchScene`. |
| D3 | O sprite desfaz o `zoom` do CSS por cima (`realScale`) e desenha no maior inteiro que cabe: Treino 4,05x virou 4x. |
| F7 | Folha do menu gerada antes (`npm run assets:menu`, `public/assets/field/menu/`), JSON e PNG baixam juntos. Causa medida abaixo. |
| 10 (D1) | VERSUS, desfile e fileira do Hall da Fama e as vagas da prancheta em PMD, Idle, escala inteira. Carta continua BW. |
| D4 | Fileira do fim de copa com uma escala só (`rowScale`). |
| D5 | Títulos da ficha em caixa normal, Galmuri11 Bold, 18 px em cima. |
| D6 | Treino de frente no celular. |
| D8 (parte) | Rótulo do pacote quebra em duas linhas. |
| d4, d5 | Novidades sem `s+1`; Meowth em 80%/82% (não sai cortado). |

### Escala por tela

| Tela | Celular pequeno ou deitado | Celular (390) | PC (1440) |
|---|---|---|---|
| Estádio (e o fundo da Copa do Dia) | 1x (também em pé com até 700 px de altura) | 2x | 3x (antes 2x, 3x e 4x) |
| Lab, Sede, Arena (e o fundo da Arena) | 1x | 2x | 3x (Arena antes 4x) |
| Rota (mapa, visto de longe) | 1x | 1x | 2x; o nadador junto (antes 2x fixo) |
| Menu de modos (cena / herói) | 2x / 3x | 2x / 3x | 3x / 4x (herói antes 5x) |
| Novidades | uma `s` (2 a 5) pela tela, todos iguais | | |
| Treino (dentro do palco) | 1x | 2x | 3x x zoom 1,35 = 4x |
| VERSUS | 2x | 3x | 4x |
| Hall da Fama (desfile / fileira) | 3x / 1x | 4x / 2x | 6x / 3x |
| Prancheta (escalação, draft, Duelo) | 1x | 1x | 2x pedido; com o zoom de encaixe do palco abaixo de 1, o inteiro de baixo (1x) |
| Fim de copa (desmaiados) | a maior até 2x em que todos cabem em 72 px | | |

Herói do menu de modos com +1 (não +2): é o único lugar com duas escalas na mesma cena; se o Miguel quiser igual, é
trocar `big ? 4 : 3` por `big ? 3 : 2` em `ModeMenu.tsx`.

### F7: a causa medida

Menu de modos a 1440, cache desligado, dev local. Sem freio de CPU os 7 Pokémon apareciam de 1,32 a 1,45 s. Com a
CPU 6x mais lenta (celular médio ou PC ocupado, como no dia da revisão): as folhas chegavam aos 3,36 s e os sprites
apareciam **um por vez, de 4,2 a 7,1 s**. A rede não era o gargalo (PNG local em 2 ms; em produção, ~180 ms depois do
JSON, porque o PNG só começava depois dele). O tempo ia no navegador: decodificar a folha inteira (até 3512x3392),
recortar num canvas, codificar um PNG novo e decodificar de novo, na fila da thread principal ocupada. Medido peça
por peça com 6x: ~60 a 90 ms por espécie, mas encadeado atrás do resto da página. Depois do conserto, com 6x: os 7
juntos aos 3,2 s (0,5 s depois do PNG), PNG de 14 a 19 KB no lugar de 42 a 61 KB, imagem decodificada ~3 MB no lugar
de ~20 MB por espécie.

### Não feito (fica pra depois)

- Item 8 (pixel da carta, F4): vai pela galeria `?cards=1`.
- Cassino e Safari (D7), proposta: cenário de pixel no jeito do Lab (balcão com fichas e caça-níquel; grama alta com
  a cerca de madeira e a placa do Safari), os Pokémon em PMD na escala da cena, e a etiqueta amarela dizendo
  "Evento" em vez de repetir o título.
- Fundo do Hall (D9), proposta: o azul-noite da marca com os raios do momento (`.k-moment`) na cor do clube, sem o
  radial vinho; "Fechar" como botão terciário.
- A fumaça ainda não acusa `img.pixel` reduzido (o roteiro está em `arte/depois/sonda.mjs`): ligar quando a carta
  passar pela galeria, senão ela falha em toda carta.
