---
description: Pesquisa do walkout do FC/FIFA e de gachas (prévia de raridade, pistas, upgrade) e proposta de walkout em 3 níveis (raro, muito raro, especial) pro pacote do Time Ultimate.
---

# Walkout dramático no Time Ultimate (pesquisa, 02/11/2026)

Pedido do Miguel: "queria uma animação de walkout pros Pokémon raros BEEEEM mais dramática, e pros especiais
BEEEEEEEEM MAS BEEEM mais dramática. Se baseia nas animações do FC também." **Só pesquisa: nada de código antes das
decisões do fim.** As referências de menu e o primeiro walkout (3 batidas) vieram de
[`menus-fc-e-aclamados.md`](menus-fc-e-aclamados.md) e [`cara-de-jogo.md`](cara-de-jogo.md); aqui a lupa é só a
revelação da carta boa.

Como foi feita: leitura de `src/ui/ultimate/PackMoment.tsx`, `src/ui/kit/MomentStage.tsx` (o `Walkout`),
`src/ui/kit/beats.ts` (`walkoutIndex`, `walkoutBeats`), `src/ui/kit/stage.css`, `src/ui/kit/MomentWipe.tsx`,
`src/ui/ambientes/FieldSprite.tsx`, `src/ui/components/PmdSprite.tsx`, `src/game/audio.ts`, `src/game/max-sfx.ts`,
`src/game/music.ts`, `src/store/ultimate/ultimate.ts` e `rules.ts`, `src/engine/specials.ts`; contagem das notas das
151 espécies no nível padrão (script no scratchpad); web (fontes no fim). Onde não achei fonte e falo do jogo de
memória, está marcado **(do jogo, sem fonte)**.

## Resumo em 6 linhas

1. O que faz o walkout do FC funcionar não é a carta: é a **prévia** (o jogo avisa a raridade no 1º segundo, pela
   luz, pelos fogos e pela cor) e a **demora controlada** (3 pistas antes do nome, a nota contando por último).
2. O FC tem **3 degraus**: abaixo de 81 a carta aparece direto; 81–85 "board" (zoom nas bandeiras, linhas douradas);
   86+ walkout no túnel (linhas prateadas, silhueta no fim, o jogador entra andando). Promo pinta o túnel de cor.
3. Gachas (Genshin, Wuthering Waves, Star Rail, TCG Pocket) avisam a raridade pela **cor do brilho antes do reveal**;
   a cor nunca mente pra baixo. O "upgrade" (começa num tom e sobe pra outro) é o golpe de drama mais barato que existe.
4. Nosso walkout hoje é 1 nível só (~2,4 s, 3 batidas de 600 ms + carta) em React/CSS, e do 2º do dia vira 1 batida.
5. Proposta: **3 níveis** (raro ~4 s, muito raro ~7 s, especial ~11 s) com cor da edição na prévia, holofotes e
   fogos em pixel, silhueta "Quem é esse Pokémon?", o sprite PMD entrando em campo (anda, corre, voa, quica) e um
   stinger por nível. Pular depois de 1 s; Reduzir movimento vira ~1,2 s.
6. **Recomendação: opção B** (React + CSS + um canvas 2D pequeno pras partículas, sem Phaser), 5–7 dias.

## 1. O walkout do FC, batida a batida

### Os degraus (quem ganha animação)

| Jogo | Sem animação | Degrau do meio | Walkout | Fonte |
|---|---|---|---|---|
| FIFA 22 | abaixo de 83 | "board" 83+ (chamas dos lados das placas) | 88+ (o jogador entra correndo; 6 chamas sobem) | Dexerto |
| FIFA 23 | abaixo de 83 | board 83–85 (fogos nas laterais, fundo escurece, holofotes apontam pra cima) | 86+ ou 84+ TOTW/promo (fogo **em cima da nota**) | Charlie Intel |
| FC 24 | — | 83–85 (feixes de luz bem visíveis à direita do pacote) | 86+ (feixes quase apagados, carta brilhando forte no meio antes de revelar) | mein-mmo |
| FC 25 | — | 80–85 (túnel sem as luzes) | 86+ (luzes no fundo do túnel em triângulo, subindo na diagonal) | mein-mmo, GGRecon |
| FC 26 | abaixo de 81 (carta direto) | 81–85 board (zoom nas bandeiras, **linhas douradas**) | 86+ túnel (**linhas prateadas**, o jogador entra) | Dexerto |

Lição: **a pista de raridade mora no 1º segundo**. No FC 26 "se a 1ª coisa é o túnel, é walkout; se é a bandeira da
posição, não é" (mein-mmo). O jogador já sabe que ganhou antes de saber o quê, e o resto é saborear.

### A sequência do walkout (FC 25/26, a mais recente)

1. **Abre o pacote** e a câmera mostra a parede do túnel de longe, de lado (mein-mmo, FC 26).
2. **Câmera corre até o fim do túnel**, onde está a **silhueta** do jogador (mein-mmo, FC 25 e 26).
3. **Bandeiras, uma por corte de câmera:** posição, nação, liga, clube, nessa ordem (mein-mmo, FC 26). A do clube
   fica uns 2 s; se tremula ao vento é um walkout, se está dura e reta são dois (Dexerto).
4. **Carta sem foto**, só atributos e PlayStyle+.
5. **A nota conta** até o número.
6. **Carta completa** com foto.
7. **O jogador aparece, comemora e dá um passo à frente** da carta (mein-mmo).

Clássico (FIFA 17–21): **túnel com fogos → país → posição → clube → jogador**, com fogos e torcida no final
(Khel Now). FIFA 20/21: portões que abrem, e as **flares que caem do teto quando a porta abre** eram a pista: uma
flare maior = walkout; flares iguais = nada de especial (mein-mmo, realsport101). FIFA 19: o pacote cai do céu como
**meteoro**, as placas caem em sequência, e o walkout tem um aro colorido em volta da carta promo (Khel Now).

### Tempos

- FC 24: ~**6 s** do toque até o jogador inteiro na tela; FC 25: ~**12 s**, o dobro (mein-mmo cronometrou). FIFA 23:
  ~6 s até mostrar quem era (Dexerto, Charlie Intel).
- O FC 25 dividiu: "isso é fogo" no X e "até a animação acabar já saiu o FC 26" no Instagram (mein-mmo).
- Por batida, de vídeo **(do jogo, sem fonte)**: cada bandeira fica ~1–1,5 s; a nota conta em ~1 s; o jogador
  comemora ~2 s.

### Cor e especiais

- Promo: mesmas regras, mas **o túnel ganha respingos da cor da promo** (Dexerto, FC 26). FC 25: o Herói vem com
  **luz roxa** (fontes do FC 25 na busca).
- A cor da flare segue a carta: TOTY e UCL são **azuis quase iguais**, e streamers foram "enganados" pelo azul no
  TOTY de 2020 (Twinfinite, mein-mmo). Ícone puxa pro branco e creme, Scream pro laranja.
- De memória **(do jogo, sem fonte)**: TOTY azul-escuro e dourado; TOTS azul-claro; Futties rosa; Future Stars
  roxo-neon; Ícone branco e dourado; Hero roxo. A promo inteira tem sua cor e o jogador decora.
- Walkout duplo: os dois saem juntos; no FC 27 o de nota menor sai primeiro e o promo vem depois pelo lado, e a
  comunidade pediu pra inverter (fórum EA). **O melhor sempre por último.**

### Som

- Torcida subindo e fogos estourando no final (Khel Now, FIFA 20); o FIFA 18 já tinha música de fundo na
  animação (Khel Now).
- **(do jogo, sem fonte):** cada bandeira tem um "tum" grave e seco, a câmera tem um "whoosh", a nota tem um tique
  por número, e no reveal entra um acorde e a torcida explode. O silêncio antes do reveal é parte do efeito.

### Pular

- Até o FIFA 23 um botão pulava; o **FC 24 tirou** e a comunidade reclamou até achar um jeito (Dexerto). O FC 25
  ficou com fama de teste de paciência (mein-mmo).
- Lição: **drama longo só é bom se o jogador puder cortar**, e só para o que é raro de verdade.

### Comum, ouro raro e especial (resumo)

| | Comum | Ouro raro alto (board) | Walkout | Especial |
|---|---|---|---|---|
| Prévia | nenhuma | linhas douradas, fogos laterais | linhas prateadas, luz no fundo do túnel, flare grande | o mesmo + cor da promo no túnel e nas flares |
| Pistas | — | posição, liga, nação (zoom) | posição, nação, liga, clube, cada uma num corte | iguais, com a cor da promo |
| Reveal | carta direto | carta | silhueta → carta sem foto → nota conta → carta → jogador entra | igual, mais longo e com o jogador comemorando |
| Tempo | ~0 | ~3–4 s | 6–12 s | 6–12 s |

## 2. Como os gachas fazem o teaser

- **Cor fixa do brilho = raridade, antes de tudo.** Wuthering Waves: dourado é 5 estrelas garantido, roxo 4, azul
  3, e **a cor não muda no meio** (Samurai Gamers). Genshin: a estrela cadente vem azul, roxa ou dourada antes da
  tela de cada item **(do jogo, sem fonte detalhada)**. Star Rail: chovem estrelas e **uma brilha mais**, e a cor
  dela diz 4 ou 5 estrelas (PC Gamer).
- **TCG Pocket:** o rasgo segue o dedo (Serebii); com carta rara, **sai luz do pacote, toca um estalo** e o fundo
  muda de cor (GameWith). O estalo é tão importante que o próprio guia avisa que some com o celular no mudo. O dev
  disse que o som é a chave da satisfação (GoNintendo, citado em `menus-fc-e-aclamados.md`).
- **Pokémon GO (do jogo, sem fonte):** o shiny se anuncia com as **estrelinhas e o "brilho" sonoro** no começo do
  encontro. É a pista mais Pokémon que existe e o jogador já conhece.
- **Upgrade/fake-out (do jogo, sem fonte):** Fate/Grand Order e Blue Archive fazem a carta ou a assinatura
  começar num tom (dourado) e **trocar pra arco-íris** no último segundo. A regra que todos seguem: **a pista só sobe,
  nunca desce.** Começar roxo e terminar dourado é isca (o "baited by blue" do TOTY), e isso dá raiva.
- **eFootball:** a bola chutada mostra o nível quando cai; o leak do 2026 volta à "bola preta" do PES, que às vezes
  vinha com raio (GamingOnPhone, EGW). A comunidade tem muita superstição sobre a bola, mas não achei fonte oficial.
- **FC Mobile:** não achei fonte boa nesta rodada; não pesa na decisão.

## 3. Onde estamos hoje

- **Quem ganha walkout:** `walkoutIndex` (`src/ui/kit/beats.ts`), só uma carta por pacote: edição primeiro
  (`editionOf`: Ícone, Evento, Destaque **ou Shiny**), depois ouro 75+.
- **O walkout:** `Walkout` em `src/ui/kit/MomentStage.tsx`, React num `MomentStage` (portal de tela cheia com os
  raios). 3 batidas de 600 ms (`WALK_BEAT_MS`): tela na cor do tipo + `TypeIcon`, placa da posição em diagonal,
  insígnia do ginásio do tipo (`BADGE_OF`, `KantoBadge`), e a carta sobe (`k-walk-rise` 700 ms) com `goal` + grito.
  Toque adianta; Pular e Esc vão pro fim. Do 2º walkout do dia, 1 batida (`walkoutBeats`, `soccermon:walkout-day`);
  com Reduzir movimento, só a carta. Total hoje: **~2,4 s**, igual pra ouro 76 e pra Ícone.
- **Frequência no UT** (`src/store/ultimate/`): Shiny 1/64 por carta (`SHINY_ODDS`), Ícone 1/100 por carta
  (`ICON_ODDS`), Evento 1/12 por carta do evento (`cardOdds`). **Destaque não sai de pacote** (vem do MVP da
  partida). No nível padrão, das 151 espécies: 57 bronze, 26 prata, **49 ouro 75–84** e **19 ouro 85+** (máximo 93).
  Ou seja: ouro é comum (68 das 151), 85+ é raro, Ícone é raríssimo, e o **Evento, durante o evento, sai em ~1 de
  cada 3 pacotes de 5 cartas**. Isso pesa na duração do nível "especial" (ver decisão 3).
- **Cores das edições** (`src/ui/styles.css`, `.sc-*`): Shiny = pastel arco-íris; Destaque = preto com ouro
  `#d9b23c`; Ícone = nebulosa roxa e rosa (`#b48cff`, fundo `#0b0726`); Evento = raios cônicos na cor do tipo da
  semana. **Já batem com a lógica do FC** (Ícone roxo/rosa, Destaque preto e ouro). É só levar a cor pra prévia.

## 4. Proposta pro Soccermon em pixel art

### Os 3 níveis

| Nível | Quem | Duração | Prévia (1º segundo) | Fogos | Pistas |
|---|---|---|---|---|---|
| **Raro** | Ouro 75–84 | ~4 s | 1 holofote acende, luz **dourada** | 1 fogo dourado | tipo, posição, ginásio |
| **Muito raro** | Ouro 85+ ou Shiny | ~7 s | corte seco pro escuro, 2 holofotes, luz **prateada** (Shiny: estrelinhas e brilho arco-íris) | 2 fogos | tipo, posição, onde vive, silhueta |
| **Especial** | Ícone, Evento, Destaque | ~11 s | apagão, 1 s de grave, céu na **cor da edição** | 3 fogos + chuva | selo da edição, tipo, posição, onde vive, silhueta, carta sem foto |

- Shiny junto de outra edição: vale o nível maior (especial), com as estrelinhas do shiny por cima.
- Ouro abaixo de 75 e prata/bronze: sem walkout (como hoje e como o FC abaixo de 81).
- Dourado → prateado → cor da edição repete a escada do FC 26 (linhas douradas no board, prateadas no walkout,
  cor da promo no especial). A cor nunca desce.

### As pistas trocadas

O FC usa nação, posição, clube. Os nossos 151 são todos de Kanto e da Gen 1, então **geração não é pista** (sempre
igual). Troca:

1. **Tipo** (no lugar da nação): tela na cor do tipo e o `TypeIcon` batendo. Já existe.
2. **Posição** (GOL/FIX/ALA/PIV): placa em diagonal. Já existe.
3. **Ginásio** (no lugar da liga): a insígnia do tipo (`KantoBadge`, `BADGE_OF`); tipo sem ginásio mostra "Kanto".
   Já existe. Fica no nível raro.
4. **Onde vive** (no lugar do clube): a rota ou o lugar de `src/data/kanto-encounters.json` ("Rota 1", "Floresta de
   Viridian", "Presente" pro Eevee e o Lapras, "Fóssil"), numa placa de madeira estilo placa de rota de FireRed.
   Pista nova, é a mais "Pokémon" de todas e não entrega o nome. Entra nos níveis muito raro e especial.
5. **Silhueta "Quem é esse Pokémon?"** (no lugar da silhueta no fim do túnel do FC 25/26): o sprite PMD todo preto
   (`filter: brightness(0)`) em pé no portão do ginásio. Fã de Pokémon reconhece pela forma, e é o melhor momento
   do walkout.
6. **Especial:** antes de tudo, o **selo da edição** bate ("ÍCONE", "EVENTO · FOGO", "DESTAQUE"), e no fim a carta
   aparece **sem a arte**, com a nota contando, e a arte entra depois (igual o FC 26). O Ícone mostra o título
   ("Pikachu do Ash") num letreiro.

### Câmera, luz e partículas (pixel)

- **Câmera** é transform no palco: zoom em degraus inteiros de pixel (1x → 1,15x → 1,3x, `--ease-pop` no punch),
  pan diagonal alternado a cada pista (o FC troca o ângulo a cada bandeira), **tremida** (4 a 8 px, 200 ms) no reveal.
- **Flash** branco de 60–100 ms no reveal (uma camada de opacidade). No muito raro e no especial, o flash vem do
  centro em círculo de pixel.
- **Holofotes:** 2 a 4 cones de luz em pixel (trapézio com dithering, sem blur) que acendem um por um com um "clank".
- **Fogos:** 1, 2 ou 3 rojões subindo e abrindo em pixel na cor do nível (dourado, prateado, cor da edição); no
  especial, uma chuva de faíscas cai devagar no fundo.
- **Confete** no reveal (o `.rh-confetti` do Campeão já existe) na cor da edição.
- **Raios** do `MomentStage` girando mais rápido no reveal e na cor da edição.
- Nada de emoji (brand guide): fogos, holofotes, placa e selo desenhados em SVG pixel ou em canvas.

### O sprite entrando em campo

`FieldSprite` (`src/ui/ambientes/FieldSprite.tsx`) já anima os sprites PMD em React, com Walk, Idle, Hop e Pose em 8
direções, shiny, e para tudo com Reduzir movimento. O jeito de entrar sai da `shape` da espécie (a mesma que a quadra
usa pra decidir quem paira, `HOVER_SHAPES` em `src/game/animation-manager.ts`):

| Jeito | Quem | Como |
|---|---|---|
| Voa | `wings`, `bug-wings` (Charizard, Butterfree, Pidgeot) | entra de cima, Walk com balanço vertical e sombra no chão |
| Quica | `ball`, `blob`, `fish` (Voltorb, Ditto, Magikarp) | Hop em 3 pulos até o meio |
| Corre | Velocidade alta (Jolteon, Rapidash, Dugtrio) | Walk com quadro mais rápido (70 ms) e mais distância |
| Anda | o resto | Walk de lado (dir 2) até o meio, vira de frente (dir 0) |
| Aparece | Fantasma (Gengar, Haunter) | sai do escuro em fade, sem passos |

No fim ele faz **Pose** (quem tem) ou **Hop** e solta o grito. Escala inteira (3x ou 4x, `pixelated`).

### Som

- **Prévia:** grave seco (`thud`) + estalo de holofote; no Shiny, o brilho de shiny (sino agudo, moedas: o gosto do
  Miguel, skill `soccermon-musica`).
- **Pistas:** "tum, tum, TUM" subindo (como hoje, `playSfx('kick', 1 + beat * 0.15)`), whoosh na troca de câmera.
- **Silhueta:** rufar acelerando, torcida crescendo (`playCrowd('uuh')` baixo).
- **Reveal:** stinger do nível + **grito do Pokémon** (`playCry`) + `playCrowd('gol')`; a música do menu abaixa
  (`duckMusic`/`unduckMusic`, como no golpe N3).
- **Stingers:** 3 novos, compostos na régua do Miguel (funk animado, clap 808, moedas, o BOING de assinatura):
  raro ~1,5 s, muito raro ~3 s, especial ~5 s com a subida. Até eles ficarem prontos, `max-stinger.mp3` e
  `max-especial.mp3` servem de rascunho.

### Pular, toque e Reduzir movimento

- **Pular** aparece depois de **1 s** (o 1º segundo é a prévia; ninguém perde a cor). Pular vai direto pra carta,
  com grito. Esc faz o mesmo.
- **Toque** adianta uma batida (como hoje).
- **Reduzir movimento:** versão curta de ~1,2 s em todo nível: a tela faz fade pra cor do nível ou da edição
  (300 ms), a carta aparece parada com o selo, grito e stinger curto. Sem zoom, tremida, flash, partícula nem sprite
  andando. Os sons ficam.
- **Encolher no dia:** hoje o 2º walkout do dia vira 1 batida. Com 3 níveis, a proposta é: raro encolhe do 2º do
  dia em diante (~1,5 s: prévia + carta), muito raro encolhe pro tamanho do raro do 3º em diante, e **especial
  nunca encolhe**.
- **Upgrade (o fake-out honesto):** em parte dos especiais, a prévia começa **prateada** (cara de muito raro) e, na
  silhueta, a tela racha e vira a cor da edição. Só sobe, nunca desce.

## 5. Parte técnica

### Phaser ou React/CSS?

- O pacote e o walkout **hoje são React** (`UtPackMoment` → `CardPack` → `Walkout` dentro do `MomentStage`, portal
  no `document.body`). A carta é a `FutCard` em DOM, e é a mesma da galeria `?cards=1`.
- O Phaser fica fora do bundle da Home (Armadilha do `CLAUDE.md`) e o Clube do UT não sobe a quadra. Abrir o Phaser
  só pro walkout é baixar o pedaço do Phaser, criar um contexto WebGL e ainda desenhar a `FutCard` em DOM por cima:
  dois mundos pra sincronizar.
- **React + CSS dá conta de quase tudo:** tela, câmera (transform), flash (opacity), placas, raios, sprite
  (`FieldSprite` já é React), carta. Só as partículas (fogos, faíscas, confete com 60+ pedaços) ficam melhores num
  **`<canvas>` 2D** pequeno dentro do palco, com retângulos de 2x2 a 4x4 px (pixel de verdade, sem textura).
- Phaser só vale se o Miguel quiser um **estádio/túnel desenhado com câmera 3D-ish** (opção C).

### Celular

- Animar só `transform` e `opacity` (camada própria, sem repintar); nada de animar `filter: blur`, `box-shadow` ou
  degradê grande. A silhueta usa `filter: brightness(0)` num sprite pequeno parado, que é barato.
- Partículas: teto de ~150 no especial, `requestAnimationFrame`, canvas no tamanho do palco com `devicePixelRatio`
  limitado a 2.
- Um walkout por vez (já é: `walkoutIndex` escolhe 1).
- Pré-carregar no rasgo: o atlas do `FieldSprite` da espécie (`assets/field/<id>.png/json`), o grito e o stinger.
  Dá ~1–2 s de folga (o leque roda antes).
- Testar em 320 e 390 px, deitado e no desktop; com Reduzir movimento ligado (`npm run teleporte` e o print).

### O que já existe no repo

| Peça | Onde | Serve pra |
|---|---|---|
| `MomentStage` + raios | `src/ui/kit/MomentStage.tsx`, `stage.css` | o palco |
| `Walkout` de 3 batidas | idem | base pra virar 3 níveis |
| `walkoutIndex`, `walkoutBeats` | `src/ui/kit/beats.ts` (+ teste) | escolher a carta e o nível |
| `FieldSprite` (Walk, Idle, Hop, Pose, shiny, 8 direções) | `src/ui/ambientes/FieldSprite.tsx` | o Pokémon entrando |
| `shape` da espécie, `HOVER_SHAPES` | `src/engine/data.ts`, `src/game/animation-manager.ts` | voa/quica/anda |
| `TypeIcon`, `KantoBadge`, `TYPE_COLOR` | `src/ui/components/` | pistas 1 e 3 |
| `kanto-encounters.json` | `src/data/` | pista "onde vive" |
| Cores das edições | `.sc-*` em `src/ui/styles.css` | prévia por edição |
| `.rh-confetti` | `src/ui/styles.css` | confete |
| `playCry`, `playSfx`, `playCrowd`, `playMax`, `duckMusic` | `src/game/audio.ts`, `music.ts` | grito, tum, torcida, stinger, abaixar a música |
| `max-stinger.mp3`, `max-especial.mp3`, `torcida-*.mp3` | `public/sfx/`, `public/assets/sfx/` | rascunho do som |
| `MomentWipe` (linha diagonal + papel de parede) | `src/ui/kit/MomentWipe.tsx` | a entrada do especial (o apagão vira um wipe com o desenho de estrela) |
| `fx/shine.png`, `fx/rainbow.png` | `public/assets/fx/` | brilho de shiny |

### O que falta fazer

1. `walkoutTier(inst)` em `beats.ts` (raro, muito raro, especial; com teste) e o `Walkout` lendo a tabela de
   batidas por nível em vez de `WALK_BEAT_MS` fixo.
2. Holofotes, fogos e placa de rota em SVG pixel (3 desenhos) + canvas de partículas (um componente).
3. `WalkoutSprite`: o `FieldSprite` com o jeito de entrar por `shape`.
4. Silhueta, selo da edição, carta sem arte com a nota contando (`CountUp` já existe no pós-jogo).
5. 3 stingers (skill `soccermon-musica`) + o brilho de shiny.
6. Reduzir movimento e encolher no dia por nível.
7. Galeria: um `?demo=walkout&nivel=raro|muitoraro|especial&ed=icone` pra ver sem abrir 100 pacotes (e pro CI tirar
   print).
8. Textos novos em PT e EN (`src/i18n/`): "Quem é esse Pokémon?", nomes de rota, selos.

Não mexe no motor (nada de `ENGINE_VERSION`) nem no save.

## 6. Opções

| | O que é | Esforço | Risco |
|---|---|---|---|
| **A. Mais forte, mesma cara** | 3 níveis no `Walkout` de hoje: duração por nível, cor da edição na prévia, holofote e fogos em CSS, flash e tremida, `FieldSprite` andando até o meio antes da carta, sons que já existem (stinger do golpe, torcida). Sem pista nova, sem silhueta. | 2–3 dias | baixo |
| **B. Túnel do ginásio (recomendada)** | Tudo do A + pista "onde vive", silhueta "Quem é esse Pokémon?", jeito de entrar por forma, carta sem arte com a nota contando, canvas de partículas, upgrade honesto, 3 stingers novos, demo de galeria. React + CSS + canvas 2D. | 5–7 dias | médio (afinar tempo e som; testar em celular fraco) |
| **C. Cena Phaser com estádio** | Uma `WalkoutScene` no Phaser com túnel/estádio desenhado em pixel, câmera de verdade, partículas e luz do Phaser, e a carta em DOM por cima. | 8–12 dias + arte do estádio | alto (Phaser no UT, dois mundos, arte nova, bundle) |

**Recomendação: B.** Entrega o "BEEEEM mais dramático" com coisa que é nossa (silhueta, rota, o Pokémon entrando do
jeito dele), reaproveita `FieldSprite`, `MomentStage` e o áudio, não puxa o Phaser pro Clube e respeita Reduzir
movimento sem gambiarra. Dá pra entregar em 2 passos: o A primeiro (já sobe o drama), depois o resto do B.

## 7. Decisões pro Miguel (recomendação primeiro)

1. **Opção:** B em dois passos (A antes) / só A / C.
2. **Níveis:** raro = ouro 75–84, muito raro = ouro 85+ ou Shiny, especial = Ícone, Evento, Destaque / outra régua
   (ex.: muito raro 88+).
3. **Evento:** fica no muito raro (~7 s), porque durante o evento sai em ~1 de cada 3 pacotes / especial completo
   como os outros.
4. **Duração:** 4 / 7 / 11 s / mais curto (3 / 5 / 8 s) / mais longo.
5. **Pular:** depois de 1 s / desde o 1º quadro / só depois da silhueta.
6. **Encolher no dia:** raro encolhe do 2º, muito raro do 3º, especial nunca / tudo sempre inteiro / como hoje (tudo
   encolhe).
7. **Upgrade (prata vira cor da edição):** em metade dos especiais / sempre / nunca.
8. **Pista nova "onde vive" (placa de rota):** sim / trocar por outra (cor da Pokédex, peso e altura).
9. **Silhueta "Quem é esse Pokémon?":** com o texto / só a silhueta, sem texto.
10. **Som:** 3 stingers novos compostos / reaproveitar o stinger do golpe N3 por enquanto.
11. **Copa:** o mesmo walkout no pacote da Copa (Mercado) / só no UT.

## 8. Storyboards (opção B)

### Raro (Ouro 75–84), ~4 s

| Tempo | O que aparece | Som |
|---|---|---|
| 0,0 | tela escurece; 1 holofote acende de baixo, luz dourada; 1 fogo dourado sobe e abre | grave seco + clank |
| 0,6 | tela na cor do tipo, `TypeIcon` bate no meio (pop) | tum |
| 1,0 | Pular aparece no canto | |
| 1,2 | placa da posição entra na diagonal; câmera puxa 1,15x | tum (mais agudo) + whoosh |
| 1,8 | insígnia do ginásio bate | TUM |
| 2,4 | o sprite entra do jeito dele (anda, corre, voa, quica) até o meio, para de frente, pose | passos/asa + grito |
| 3,2 | carta sobe atrás dele, nota conta, raios na cor do ouro; flash curto | stinger raro + torcida baixa |
| 4,0 | Continuar | |

### Muito raro (Ouro 85+ ou Shiny), ~7 s

| Tempo | O que aparece | Som |
|---|---|---|
| 0,0 | corte seco pro preto; 2 holofotes acendem um por um, luz prateada; tremida pequena | clank, clank, grave |
| 0,5 | 2 fogos prateados (Shiny: estrelinhas do shiny e brilho arco-íris em volta da tela) | estouros (Shiny: sino de shiny) |
| 1,0 | Pular aparece | |
| 1,2 | tipo, câmera 1,15x de um lado | tum + whoosh |
| 2,2 | posição, câmera vira pro outro lado | tum |
| 3,2 | placa de rota ("Rota 1", "Floresta de Viridian") | TUM |
| 4,2 | portão do ginásio abre; silhueta preta no fundo, zoom lento até 1,3x | rufar subindo + torcida crescendo |
| 5,2 | flash branco 80 ms; a silhueta ganha cor e corre pra frente; tremida 6 px | grito alto |
| 5,8 | carta bate na frente, nota conta, confete dourado, raios rápidos | stinger muito raro + torcida "gol" |
| 7,0 | Continuar | |

### Especial (Ícone, Evento, Destaque), ~11 s

| Tempo | O que aparece | Som |
|---|---|---|
| 0,0 | apagão (o `MomentWipe` com a estrela, rápido); 1 s quase preto | a música abaixa; só o grave |
| 0,6 | o céu acende na cor da edição (Ícone nebulosa roxa e rosa; Destaque preto e ouro; Evento raios na cor do tipo); 3 fogos na cor e chuva de faíscas | 3 estouros + subida do stinger |
| 1,0 | Pular aparece | |
| 1,5 | selo da edição bate no meio ("ÍCONE", "EVENTO · FOGO", "DESTAQUE"), tremida | TUM grande + moedas |
| 2,5 | tipo, câmera num ângulo | tum + whoosh |
| 3,5 | posição, outro ângulo | tum |
| 4,5 | placa de rota | TUM |
| 5,5 | portão abre, silhueta + "Quem é esse Pokémon?"; zoom lento até 1,3x (upgrade: aqui a prévia prateada racha e vira a cor da edição) | rufar acelerando, torcida crescendo |
| 7,0 | flash em círculo, tremida 8 px; o Pokémon entra do jeito dele e faz pose | grito alto + BOING de assinatura |
| 8,0 | carta **sem a arte** bate, a nota conta | tique por número |
| 9,0 | a arte entra na carta; título do Ícone no letreiro ("Pikachu do Ash") | acorde final do stinger |
| 9,5 | confete na cor da edição, raios rápidos, o Pokémon pula de alegria (Hop) | torcida "gol" |
| 10,5 | Continuar | a música volta |

### Reduzir movimento (qualquer nível), ~1,2 s

| Tempo | O que aparece | Som |
|---|---|---|
| 0,0 | fade (300 ms) pra cor do nível ou da edição | grave |
| 0,3 | carta parada no meio, com o selo da edição | stinger curto + grito |
| 1,2 | Continuar | |

## Fontes

- [FC 26: animações de pacote (Dexerto)](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations)
- [FC 26: como reconhecer walkout (mein-mmo)](https://mein-mmo.de/en/ea-fc-26-how-to-recognize-walkouts-during-pack-opening,1526086)
- [FC 25: a animação nova testa a paciência, 6 s → 12 s (mein-mmo)](https://mein-mmo.de/en/a-new-animation-for-ea-fc-25-will-greatly-test-your-patience-in-ultimate-team,1160084)
- [FC 25: reconhecer walkout (mein-mmo)](https://mein-mmo.de/en/ea-fc-25-recognizing-walkouts-heres-what-to-look-for,1177783)
- [FC 25: como achar walkout (GGRecon)](https://www.ggrecon.com/guides/ea-fc-how-to-spot-a-walkout/)
- [FC 25: túnel do FIFA 21 de volta (realsport101)](https://realsport101.com/ea-sports-fc/fc-25-pack-animation/)
- [FC 24: reconhecer walkout pelos feixes de luz (mein-mmo)](https://mein-mmo.de/en/ea-sports-fc-24-recognizing-walkouts-pay-attention-to-these-animations,1037943)
- [FC 24: como pular animação de pacote (Dexerto)](https://www.dexerto.com/ea-sports/how-to-skip-pack-animations-in-ea-fc-24-2304843)
- [FIFA 23: walkout pelo fogo em cima da nota (Charlie Intel)](https://charlieintel.com/fifa-23-ultimate-team-pack-animations/200629)
- [FIFA 23: boards e walkouts (Dexerto)](https://www.dexerto.com/guides/fifa-23-pack-animations-boards-walkouts-1941776/)
- [FIFA 22: boards e walkouts (Dexerto)](https://dexerto.com/fifa/fifa-22-pack-animations-for-boards-walkouts-explained-1661730)
- [FIFA 22: como reconhecer walkout (mein-mmo)](https://mein-mmo.de/en/fifa-22-how-to-recognize-a-walkout-but-is-it-still-needed,724350)
- [FIFA 20: flares que caem quando a porta abre (mein-mmo)](https://mein-mmo.de/en/fifa-20-recognizing-walkouts-pay-attention-to-this-pack-animation,398165)
- [FIFA 20: streamers enganados pelo azul do TOTY (Twinfinite)](https://twinfinite.net/2020/01/fifa-streamers-baited-toty-priceless/)
- [As melhores animações de pacote da série (Khel Now)](https://khelnow.com/gaming/best-ea-sports-fifa-pack-opening-animations-202409)
- [FC 27: walkout duplo, o menor sai primeiro (fórum EA)](https://forums.ea.com/discussions/fc-27-feedback-en/why-does-the-lowest-rated-player-show-first-in-double-walkouts/13802871)
- [eFootball 2026: animação nova inspirada no PES (GamingOnPhone)](https://gamingonphone.com/news/efootball-2026-is-reportedly-getting-a-new-pack-opening-animation/) e [EGW](https://egw.news/fifa/news/28789/leaked-efootball-2026-to-feature-new-pack-opening--NjVXYtZxm)
- [Wuthering Waves: cor do brilho = raridade, não muda no meio (Samurai Gamers)](https://samurai-gamers.com/wuthering-waves/wuwa-wish-rarity-indicator-guide/)
- [Honkai: Star Rail, a estrela que brilha mais (PC Gamer)](https://pcgamer.com/honkai-star-rails-gacha-animations-have-no-right-to-go-this-hard)
- [TCG Pocket: luz, estalo e fundo na carta rara (GameWith)](https://gamewith.net/pokemon-tcg-pocket/49002)
- [TCG Pocket: rasgo segue o dedo (Serebii)](https://serebii.net/tcgpocket/preview/)
- [TCG Pocket: god packs (Pocket Tactics)](https://www.pockettactics.com/pokemon-tcg-pocket/god-packs)

## Decidido com o Miguel (02/11/2026)

"Tudo como recomendado": níveis raro (Ouro 75–84) ~4 s, muito raro (Ouro 85+, Shiny e Evento) ~7 s, especial (Ícone, Destaque) ~11 s;
Pular depois de 1 s; encolhe do 2º raro e do 3º muito raro no dia, especial nunca; upgrade em metade dos especiais; silhueta com
"Quem é esse Pokémon?"; o mesmo walkout no pacote da Copa. Motor de animação: ele quer ver como fica no Phaser e, se ficar mais
bonito, fica no Phaser. Por isso o nível especial é feito nas duas versões (React/CSS e Phaser) atrás de laboratório, com vídeo
lado a lado, antes de escolher.

### Escolha depois dos vídeos lado a lado (02/11/2026)

Miguel comparou Phaser x React: fica uma mistura.
- **Estádio do Phaser** (aberto, gramado, torcida, torres de luz) como cenário.
- **Logo/placa "ÍCONE" do React** (e o mesmo estilo de placa pras outras edições).
- **Tipo e posição nos telões do estádio**, não no meio da tela.
- **Sai a placa de rota** ("Cerulean Cave": ele não entendeu o sentido) e **sai o título "MEWTWO CONTRA-ATACA"** no telão.
- **Revelação da carta:** a intro quebrando a tela do Phaser e, depois, a carta de verdade (`FutCard`) aparecendo como no React.
- **Mais longo**, principalmente a revelação da carta.
- **Entrada com bola, diferente por Pokémon** (embaixadinha, bicicleta, cabeçada, drible, chute na câmera, levitar a bola etc., pela forma e pelo tipo).
