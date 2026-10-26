---
description: Brand guide do Soccermon: cores, tipos, logo, voz e o que não fazer.
---

# Soccermon: brand guide

Versão de 19/10/2026 (0.8.8). Página visual com as amostras: [`docs/marca/index.html`](index.html) (abre direto no
navegador). Checklist curto pra usar antes de mexer em qualquer coisa visual ou em texto:
[`.claude/skills/soccermon-marca/SKILL.md`](../../.claude/skills/soccermon-marca/SKILL.md).

Tudo aqui saiu do código e das decisões do Miguel. Quando o código e este guia discordarem, o código vale e o guia
é corrigido.

## 1. Quem somos

### Capa

- **Nome:** Soccermon. Sempre assim: S maiúsculo, o resto minúsculo, junto. No logo vira SOCCERMON.
- **Proposta:** draft "escolha 1 de 3" com os 151 de Kanto e uma copa de futsal 5 contra 5 simulada, no navegador.
- **Tagline:** "Temos que chutar!" (EN: "Gotta kick 'em all!").
- **Promessa:** de graça, sem anúncio, sem conta obrigatória. Fan game sem fins lucrativos (AGPL-3.0).

### Por que existimos

- **Missão:** juntar as duas coisas que o fã brasileiro de Pokémon mais gosta, Pokémon e futebol, num jogo curto
  de celular que dá vontade de jogar de novo.
- **Pra quem:** fã de Pokémon que cresceu com a Gen 1, e a criança de 12 anos jogando no celular. Os dois leem a
  mesma tela.
- **O que diferencia:** os golpes e os atributos aparecem em campo (o Snorlax fecha o gol, o Ditto joga em todas),
  a copa acaba em minutos e o visual é de transmissão de TV.

### Personagens

Os personagens são os Pokémon e os líderes de ginásio. Não são nossos: sprites, gritos e nomes são da Nintendo,
Game Freak, Creatures e The Pokémon Company (créditos em `CREDITS.md`).

- Pokémon aparecem como sprite de jogo (`public/assets/cards/*.gif`), retrato PMD (`public/assets/portraits/`) e
  sprite de quadra. Treinadores em `public/assets/trainers/`.
- Nunca entram no logo nem no ícone. O símbolo da marca é a **carta holo com a bola**, que é nossa.
- Em arte de divulgação, no máximo uma fileira de 5 a 6 Pokémon, de pé, do mesmo tamanho de grade.

### Ilustração

- Sprite é pixel art: amplie só em múltiplo inteiro (2x, 3x) com `image-rendering: pixelated`. Reduzir? Use
  `image-rendering: auto` (fica liso, sem pixel faltando).
- Itens têm 30 x 30: mostre em 30, 60 ou 90 px. Ícones de tipo (`public/assets/types/`) são arte lisa: sem
  `pixelated`.
- Fundo de marca: azul-noite radial `#2a3a7a → #070a18` com raios brancos a 7 a 10% (os raios da tela de evolução).

## 2. Identidade visual

### Logo

O logo é a palavra SOCCERMON com o primeiro O trocado pela **carta holo com a bola**: carta dourada levemente
inclinada (-8°), holo em quatro faixas pastel, e uma bola de futebol de verdade (gomos de icosaedro truncado) com a
faixa e o botão dourado no meio, que lê como bola e como pokébola ao mesmo tempo. A bola é simétrica em
relação à faixa: o pentágono de cima espelha o de baixo (vista pelo eixo de ordem 2 do icosaedro) e gira inteira,
junto com a faixa. Vetor limpo: contorno azul-noite
firme, cores chapadas, sem degradê e sem brilho borrado.

| Versão | Arquivo | Onde |
|---|---|---|
| Horizontal em cor | `public/assets/ui/logo.svg` (fonte `trailer/arte/logo/final/logo-horizontal.svg`) | Home, topo das telas, 404, pacote de cartas, card do título, clipe, artes |
| Símbolo (só a carta) | `public/assets/ui/simbolo.svg` | tela de carregamento, avatar, onde o nome já aparece do lado |
| Ícone (carta no azul-noite com raios) | `public/assets/ui/icone.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | app no celular, avatar das redes |
| Ícone pequeno (32 e 48 px) | `public/assets/ui/favicon.svg` | aba do navegador |
| Ícone 16 px feito à mão | dentro de `public/favicon.ico` (com o 32 e o 48) | aba em tela comum |
| Só a bola do logo | `public/assets/ui/bola.svg` | marca e página 404 (a bolinha que rola na quadra da Home é a original do jogo, `public/assets/ui/ball.svg`) |
| Uma cor só | `trailer/arte/logo/final/logo-*-mono-branco.svg` e `-mono-azul.svg` (`#0b1030`) | carimbo, fundo claro, bordado, impressão de uma cor |

Gerar tudo de novo: `python3 trailer/arte/logo/final/logo.py && node trailer/arte/logo/final/publicar.mjs` e depois
`CHROME_PATH=/usr/bin/chromium node docs/marketing/arte/render.mjs` (prévia do link).

**Construção do título:** as letras são esqueletos numa grade 6 x 8 (`trailer/arte/logo/gerar.py`), traço grosso
com junta redonda. SOCC é branco com lábio cinza-azulado `#dbe2f2` embaixo; ERMON é dourado `#ffcb05` com lábio
laranja `#ff8a1c`, um filete claro `#fff3a0` e o bloco 3D azul `#2a4ea0` chapado. Tudo com o mesmo contorno
`#0e1430`.

**Área de respiro:** em volta do logo horizontal, livre de qualquer texto ou borda, no mínimo **metade da altura
das letras** (0,5x; no logo de 300 de altura, as letras têm 184 e o respiro é 92). No ícone, a carta já tem o respiro
desenhado: não ponha nada por cima.

**Tamanho mínimo:**

- Horizontal: 120 px de largura na tela (o topo das telas usa 30 px de altura, 144 de largura). Abaixo disso, use
  o símbolo.
- Símbolo: 24 px de altura.
- Ícone: 64 px ou mais usa o ícone completo; 32 a 48 px, o ícone pequeno (sem raios, bola maior, sem costura);
  16 px, o desenhado à mão na grade.

**Usos errados:**

- Esticar ou apertar (sempre `height: auto` ou as duas medidas na proporção 1441 x 300).
- Trocar as cores, pintar o ERMON de outra cor ou o SOCC de dourado.
- Voltar com degradê, brilho borrado, sombra macia ou contorno neon.
- Tirar o contorno azul-noite (o logo some no fundo).
- Girar a carta diferente, tirar a bola da carta, ou pôr uma Pokébola de verdade no lugar.
- Logo em cor sobre fundo claro ou foto movimentada: use a versão de uma cor.
- Escrever o nome em fonte no lugar do logo (o título é desenho; em texto corrido é "Soccermon").

### Cor

Proporção numa tela típica: azul-noite domina (~70%), painéis ~20%, dourado ~6% (o JOGAR, etiqueta e seleção),
verde e azul de botão ~2%, vermelho ~1% (só perigo e fechar), tipo e raridade ~1%. O dourado e o vermelho são pouco de
propósito.

**Cor por função** (desde a 0.9.22, `src/ui/kit/kit.css`): a cor do botão diz o que ele faz, e a pessoa aprende uma
vez e lê a tela inteira. **Dourado joga** (o JOGAR, um por tela, `.btn.primary`); **verde confirma ou compra**
(Comprar, Escolher, Seguir, `.btn.confirm`); **azul é secundário** (Sortear, Compartilhar, ir a um lugar, `.btn`);
**vermelho é perigo ou fechar**, só dentro da confirmação (`.btn.danger`); o **terciário** não tem face (Pular,
Cancelar, `.btn.ghost`; o gatilho de perigo é `.btn.ghost.danger`, texto vermelho). Seleção continua dourada, mas como
**anel**, nunca como botão cheio.

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#141a33` | fundo de toda tela |
| `--bg-2` | `#1c2447` | fundo de bloco dentro do fundo |
| `--panel` | `#232d57` | painel |
| `--panel-2` | `#2c3868` | botão comum, painel dentro de painel |
| `--line` | `#4b5a9a` | borda de painel (não é texto) |
| `--text` / `--bc-paper` | `#f4f1e6` | texto, caixa clara dos números do placar |
| `--muted` | `#a6aed6` | texto de apoio |
| `--yellow` | `#ffcb05` | o JOGAR (botão principal), etiqueta, anel de seleção, ERMON |
| `--red` / `--red-dark` | `#e8423f` / `#b22b29` | perigo e fechar (Abandonar, Apagar, X), só na confirmação |
| `--blue` | `#3a7bd5` | informação, ligado; base do botão secundário |
| `--green` | `#58c26b` | vitória, salvo, ok; botão de confirmar e comprar |
| `--bc-ink` | `#0e1430` | superfície do placar, contorno do logo |
| `--bc-ink-2` / `--bc-ink-3` | `#1b2350` / `#10173a` | miolo do placar, faixas de baixo |
| `--bc-edge` | `#000` | borda de baixo do placar |
| azul do 3D | `#2a4ea0` | bloco do ERMON, sombra dura de texto dourado |
| noite (fundo de marca) | `#2a3a7a → #070a18` | artes, carregamento, ícone, pacote de cartas |
| holo | `#ff9ad5` `#9ae6ff` `#b6ffa0` `#fff29a` | a carta do logo, pacote especial, edições |
| dourado do logo | `#fff3a0` / `#ffcb05` / `#ff8a1c` / `#b85a10` | filete, cheio, lábio, filete interno da carta |

**Cartas** (`src/ui/rarity.ts`): o metal vem da nota, padrão FIFA. Bronze `#c98a52` (até 64), prata `#c9ced8`
(65 a 74), ouro `#e8c24a` (75+). A raridade só muda o acabamento: comum `#f4f4f4`, incomum `#3ddc6a`, raro `#3a8dff`,
épico `#a45cff`, lendário `#ff8a1c`. Edições especiais (Shiny, Destaque, Ícone, Evento) têm visual próprio.

**Tipos** (`src/ui/type-colors.ts`, as cores oficiais de sempre): Normal `#A8A77A`, Fogo `#EE8130`, Água `#6390F0`,
Elétrico `#F7D02C`, Planta `#7AC74C`, Gelo `#96D9D6`, Lutador `#C22E28`, Venenoso `#A33EA1`, Terrestre `#E2BF65`,
Voador `#A98FF3`, Psíquico `#F95587`, Inseto `#A6B91A`, Pedra `#B6A136`, Fantasma `#735797`, Dragão `#6F35FC`,
Sombrio `#705746`, Aço `#B7B7CE`, Fada `#D685AD`. Cor de tipo é do tipo: não use pra enfeite.

**Contraste medido** (WCAG, razão):

| Texto | Fundo | Razão | Uso |
|---|---|---|---|
| `#f4f1e6` | `#141a33` | 15,2 | texto sobre fundo |
| `#a6aed6` | `#141a33` | 7,9 | texto de apoio |
| `#a6aed6` | `#232d57` | 6,1 | texto de apoio no painel |
| `#ffcb05` | `#0e1430` | 11,9 | dourado no placar |
| `#0e1430` | `#ffcb05` | 11,9 | etiqueta `.bc-tag` |
| `#ffffff` | `#e8423f` | 4,0 | só em botão grande e negrito (≥ 18 px); texto pequeno vai em `#b22b29` (6,4) |
| `#ffffff` | `#3a7bd5` | 4,2 | só negrito grande |
| `#ffffff` | `#58c26b` | 2,2 | **não use** texto branco solto: em cima do verde vai `#0e1430` (8,0), ou branco **com o contorno de pixel** do botão (`--k-out-1`/`--k-out-2`) |
| `#0e1430` | `#c98a52` | 6,2 | número na carta bronze |
| `#4b5a9a` | `#141a33` | 2,6 | só borda, nunca texto |

### Tipografia

Uma família só, pixel: **Galmuri** (SIL OFL 1.1, `public/fonts/`, subset gerado por `npm run fonts`).

| Estilo | Fonte | Uso |
|---|---|---|
| Placar e título de tela | Galmuri14, 20 a 48 px, peso normal | placar (`.bc-sc`), relógio, título do cabeçalho (`.bc-screenhead h1`), número grande do resultado |
| Texto | Galmuri11, 14 px, entrelinha 1,45 | tudo que se lê |
| Botão, rótulo, etiqueta | Galmuri11 Bold | botões, `.bc-tag` (10 px, caixa alta, espaço 1 px), nomes |
| Vídeo e arte | Galmuri11 Bold, caixa alta | legenda de vídeo, tagline nas artes |

- Tamanho mínimo: 10 px só em etiqueta de caixa alta; texto corrido nunca abaixo de 12 px.
- Símbolo novo num texto (seta, estrela) precisa estar no subset: o teste `scripts/fonts.test.ts` acusa e
  `npm run fonts` refaz.
- `-webkit-font-smoothing: none` no corpo: a fonte é pixel, não alise.
- A palavra SOCCERMON como título é o desenho do logo, nunca a fonte.

### Forma: o kit da transmissão

O site inteiro usa as peças da tela de partida (`src/ui/broadcast-kit.css`). Visual de placar de TV:

- **Superfície de placar** (`.bc-surface`): fundo `--bc-ink` sólido, borda de baixo preta de 2 px, raio 6 px,
  sem sombra macia. `.bc-stripe` põe a faixa lateral de 6 px na cor do time (ou dourada).
- **Etiqueta** (`.bc-tag`): pílula dourada, texto azul-noite, 10 px, negrito, caixa alta.
- **Cabeçalho de tela** (`.bc-screenhead`): o título na placa do Estádio (moldura preta grossa, faixa de cima
  amarela, base dura) com a etiqueta da fase em cima.
- **Rótulo de seção** (`.bc-lbl`), **peça com ícone** (`.bc-tile`), **abas** (`.bc-tabs`), **seletor
  segmentado** (`.bc-seg`), **barra do polegar** (`.bc-thumbbar`: a ação principal fixa embaixo no celular).
- **Painel** (`.panel`): `--panel`, moldura dupla grossa (borda 3 px `--cb-ink`, filete de 3 px `--frame-in` e um fio
  escuro por dentro), raio 10 px e base dura de 4 px, sem textura. O título (`h2` de cima, `.shop-shelf-title`,
  `.champ-h`) vai na placa do Estádio: moldura preta, faixa amarela em cima, Galmuri14 15 px; no painel fica
  pendurada na borda de cima. `.bc-surface`, toast e balão do tutorial usam o mesmo material.
- **Botão** (`.btn`, kit em `src/ui/kit/kit.css`, galeria `?lab=kit`): chanfrado, como o do Clash em pixel. Contorno
  3 px `--cb-ink`, faixa clara na metade de cima, base escura de 5 px por dentro e sombra dura de 4 px; texto branco,
  com contorno de pixel de 2 px só de 16 px pra cima (o gordo da tela). No toque afunda 3 px em 60 ms e volta
  com quique (`--ease-pop`, 180 ms) e som; com Reduzir movimento, afunda sem quique. Desabilitado fica no lugar, sem
  cor e sem base, e diz o porquê em `.btn-why`. A cor é a função (ver Cor).
- **Hierarquia (variante B, 26/10):** cada tela tem **um** botão gordo, o da barra do polegar ou um `.big`: dourado
  se joga, verde se segue ou confirma. O secundário azul é baixo e de face lisa. Ação repetida de lista (Comprar,
  Escalar, Escolher, Ensinar) é o **chip** baixo (`.k-chip`, `.fut-action`, `.shop-buy`) preso na borda de baixo da
  carta ou do item. O escolhido num seletor (`.bc-seg`) é azul: o dourado cheio fica só no JOGAR.
- **Número com contorno** (`.cb-num`): Galmuri14 com o contorno de pixel de 2 px, pra ₽, x/151, nível, taças e placar.
  Só a partir de 15 px. A nota da carta não muda (carta só pela galeria `?cards=1`).
- Raios: 4 (etiqueta), 6 (placar), 8 (botão), 10 (painel e carta), 14 (sheet, só em cima). Sombra é sempre dura (sem
  desfoque), exceto o brilho de seleção amarelo.

**Peças da 0.9.23 (Vestiário):**

- **Sheet** (`src/ui/kit/Sheet.tsx`): no celular sobe de baixo (onde o dedo está), alça no topo, cantos de cima de 14 px;
  no desktop é a janela do meio. Fecha no X **redondo e vermelho**, tocando fora ou com Esc. Toda janela nova é sheet.
- **Confirmação** (`ConfirmSheet`): sheet curta, título com a pergunta ("Abandonar a copa?"), o que se perde numa
  linha, "Cancelar" terciário à esquerda e o perigo vermelho à direita. Nunca confirmação no meio da página.
- **Barra da copa** (`CupBar.tsx`): nas telas de dentro da copa, no lugar do logo. Botão-ícone de voltar (quadrado de
  44 px, chanfrado azul-noite), a fase numa placa com faixa amarela (nome curto: Oitavas, Quartas; na Rota "Partida
  3 de 8") e o que se tem na copa em plaquinhas com número contornado (₽, sorteios). **A fase só aparece aqui**: a tela
  embaixo não repete. No Eliminado e no Campeão volta o logo.
- **Lugar de tela** (o vestiário, `src/ui/vestiario.css`): a escalação fica numa lousa azul de tática (giz de X, O e
  seta, moldura de madeira) com os quadros pendurados que abrem sheet: cortiça = a chave e a copa, quadro-branco = a
  tática. A prancheta encosta na lousa e fica na 1ª tela.
- **Barra de botões da partida** (`?lab=hud`): 4 botões azul-noite chanfrados (Tática, Trocar, Tempo, Lances), cada um
  com o estado escrito embaixo, cada um abre a sua sheet. O Golpe Máximo mora na barra fixa de baixo, sempre à vista,
  enchendo por dentro em 3 gomos; tocar antes da hora explica quando acende.
- **Cartas do draft** (`.cards-legible`): as 3 lado a lado mostram os 6 atributos em grade 3x2, tudo com 10 px ou mais;
  o bônus vira a cor do número (verde sobe, vermelho desce). A carta em si não muda.

### Ícones

Quatro famílias, cada uma com seu lugar. Nada de emoji.

1. **Ícone de interface** (`HudIcon`, `src/ui/components/MatchHud.tsx`, mapa `ICONS`): grade 24, **só contorno**,
   traço **2.4**, ponta e junta **redondas**, cor `currentColor`, 18 px por padrão. Abaixo de 14 px o traço vai a 3
   (o `GdxIcon` da Golpedex faz isso sozinho). Todo ícone novo de botão, rótulo, seta ou estado entra nesse mapa.
   Hoje: tática (balanced, offensive, defensive, counter), sub, flag, skip, board, team, feed, smile, players,
   chart, cup, dex, shout, mute, calm, press, timeout, flyGk, max (estrela), medal, up, down, prev, next, close,
   check, lock, play, stop, search, expand, reroll, download, upload, bulb e os três do escanteio.
2. **Ilustração de menu** (`MenuIcon`, troféu, insígnias, MT, brasões, medalhas, selos): cheia e colorida, contorno
   escuro `#1a1430`, grade 32. Só nos cartões da Home, nos menus e nos prêmios. Nunca dentro de uma frase.
3. **Sprite** (Pokémon, item, retrato, treinador, tipo): pixel art com as regras da Ilustração.
4. **Caractere de texto:** só pontuação de verdade. `·` separa, `…` é reticência, `→` e `⇒` dentro de frase
   ("Charmander → Charmeleon", "92 ⇒ 88" nas Novidades), `×2` multiplica, `−` é menos, `♀ ♂` são do nome. Sozinho
   num botão ou como marcador, nunca: aí é `HudIcon`. Na quadra (Phaser, canvas) `▲ ▼ ♥ ⇅` podem ficar como texto
   enquanto estiverem na fonte.

**Pendente (carta):** a carta (`PokeCard2`) ainda usa `● ◆ ★` pra raridade, `★ SHINY` e `▲▼` nos números. Carta só
muda pela galeria `?cards=1` com o ok do Miguel.

## 3. Movimento e som

### Movimento

- Curvas: `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` pra tudo; `--ease-pop` `cubic-bezier(0.2, 0.9, 0.3, 1.4)`
  só pro "pop" de jogo (carta virando, número contando, selo batendo).
- Durações: botão afunda em 0,06 s, hover em 0,15 s, entrada de painel em 0,2 a 0,3 s. Loop só em decoração leve
  (pacote de cartas flutuando 3,2 s, a carta da tela de carregamento 1,6 s).
- Anime `transform` e `opacity`, não `width`, `left` nem `height`.
- Tokens (`kit.css`): `--dur-toque` 60 ms (afundar), `--dur-solta` 180 ms (quique de volta), `--dur-ui` 200 ms (abas,
  seleção), `--dur-tela` 280 ms (troca de tela, sheet subindo), `--dur-pop` 320 ms (entrada com pulo: o "Começar!" do
  VS quando a quadra fica pronta). A sheet desce em 200 ms ao fechar.
- **Momento** (protótipo no `?lab=kit`, transição de momento): uma linha amarela desce na diagonal, do canto de cima
  à direita ao de baixo à esquerda, e revela um papel de parede com o logo numa placa; o papel sai da direita pra
  esquerda (~1,1 s). Só pra momento (começar a copa, entrar em quadra, título), nunca em troca de tela comum.
- Nada vai sozinho pra outra tela: o fim de jogo espera o toque em "Ver resultado".
- Na partida (`src/game/`), o peso vem do impacto em 4 níveis (`punch()` no `MatchScene`), câmera lenta igual pra
  gol, trave e defesa, rastro do tipo na bola e flash no gol.
- **Reduzir movimento** (Configurações > Acessibilidade: Seguir o aparelho, Ligado, Desligado):
  `src/ui/settings-sync.ts` marca `<html data-reduce-motion="true">` e `src/ui/motion.css` zera animação e
  transição; os clarões somem. Na quadra, `reduceMotion` deixa a câmera parada, sem tremida e sem animação de
  evolução em campo. Toda animação nova é testada com ele ligado e também respeita
  `prefers-reduced-motion`.

### Som

- Um apito só, gravado (CC0). Torcida gravada do lado do jogador: gol, vaia, "uuuh" (`public/assets/sfx/`,
  `playSample`/`playCrowd` em `src/game/audio.ts`). Efeitos curtos do ZzFX. Gritos dos Pokémon em 8-bit (Gen 1) ou
  modernos, à escolha do jogador.
- Som sintetizado de apito ou torcida soa ruim: use gravação real.
- Música só nos vídeos, escolhida pelo Miguel e sempre creditada.

## 4. Voz e texto

### O método de escrita do Miguel (vale pra todo texto)

1. **Curto e direto.** Legenda de vídeo tem 2 a 5 palavras e diz a feature, em caixa alta: "ESCOLHA 1 DE 3",
   "ÍCONES RAROS", "FUTSAL 5 CONTRA 5", "EVOLUÇÕES NO MEIO DO JOGO", "MULTIPLAYER ONLINE", "COPA RANKEADA".
2. **Sem ironia e sem piada empilhada.** As legendas irônicas do trailer 2 ("CHAMA AQUELE AMIGO QUE DIZ QUE É MESTRE
   POKÉMON", "ELE EVOLUIU NO MEIO DO JOGO?!") foram cortadas: pareciam feitas com IA e tinham texto demais. <!-- copy-ia: exemplo -->
3. **Sem tricolon de IA** ("Monte. Escale. Evolua.").
4. **Humor de fã só em momento pontual** (o twist da abertura "…e elas JOGAM FUTSAL.", "Temos que chutar!", as
   faixas da torcida, os posts) e de preferência como **paródia de coisa real**: grito de torcida, fala dos jogos.
   "ABAIXA QUE É HYPER BEAM", "Sua insígnia é minha!", "Confia no professor!".
5. **Linguagem de quem tem 12 anos no celular:** até ~12 palavras por texto no jogo.
6. **Jargão Pokémon é bem-vindo:** PP, super efetivo, Hyper Beam, insígnia, MT. Golpe com o nome oficial em inglês.
7. **Frase escrita pelo Miguel vale como está.** Só ajuste gramática ou tamanho, e diga o que mudou.

### Três traços

| Somos | Faça | Não faça |
|---|---|---|
| Fã falando com fã | "É super efetivo!", "Até o último PP!" | explicar o que é PP |
| Narrador de TV | "GOL!", "GOLPE MÁXIMO", "Fim de jogo" | frase de manual ("O usuário deve selecionar") <!-- copy-ia: exemplo --> |
| Direto | "Toque em dois pra trocar." | "Para realizar a troca, toque em dois jogadores." |

### Antes e depois

| Antes | Depois |
|---|---|
| CHAMA AQUELE AMIGO QUE DIZ QUE É MESTRE POKÉMON | MULTIPLAYER ONLINE |
| ELE EVOLUIU NO MEIO DO JOGO?! | EVOLUÇÕES NO MEIO DO JOGO <!-- copy-ia: exemplo --> |
| Monte. Escale. Evolua. | Temos que chutar! <!-- copy-ia: exemplo --> |
| Você receberá uma recompensa ao vencer. | Ganhou! Pegue um Pokémon do rival, um item ou uma MT. |
| ↻ Sortear de novo (2) | [ícone reroll] Sortear de novo (2) |

### Glossário

- **Usamos:** Copa (o modo de hoje), Duelo, Modo história, Golpedex (EN: Movedex), Destaque (EN: Star Player),
  insígnia, MT, ginásio, líder, craque, capitão, banco, Pivô / Ala / Fixo / Goleiro, nomes oficiais dos golpes e dos
  Pokémon.
- **Evitamos:** usuário, experiência, jornada, incrível, revolucionário, "nível", "desbloquear" quando "liberar" <!-- copy-ia: exemplo -->
  serve, "Épico" fora da raridade, "oficial" (não somos).

### Escrito por gente

`.claude/skills/soccermon-marca/copy_ia.py <arquivo>` acha os tiques mecânicos: travessão de efeito, "não é X, é <!-- copy-ia: exemplo -->
Y", frases de efeito em fila, palavra inflada, Title Case, emoji, `?!` de empolgação, e com `--legenda` confere <!-- copy-ia: exemplo -->
legenda de 2 a 5 palavras. Depois leia em voz alta. Troque a frase que serviria pra qualquer jogo por uma que só
serve pro Soccermon.

## 5. Aplicações

- **Prévia do link** (`public/og-image.jpg`, 1200 x 630): logo, tagline dourada, fileira de Pokémon, uma linha do
  que é e soccermon.com. Fonte: `docs/marketing/arte/arte.html`, seção `og`.
- **Ícone do app:** carta no azul-noite com raios, cantos de 48/256 (o iOS recebe o quadrado cheio e arredonda
  sozinho).
- **Aba do navegador:** `favicon.ico` (16 à mão, 32, 48) e `favicon.svg`.
- **Carregamento:** a carta (`simbolo.svg`) flutuando no fundo de marca, direto no `index.html`, antes do JS.
- **Página 404** (`public/404.html`): placar 4 x 4 com a bola, "ERRO 404" na etiqueta, Psyduck confuso na quadra,
  "Fora de jogo!" e o botão "Voltar pro jogo". Não culpa a pessoa.
- **Card do título** (`src/ui/share-card.ts`): 9:16 e 1:1 com o logo no topo.
- **Posts e vídeo:** `.claude/skills/soccermon-assets/SKILL.md` (storyboard antes de renderizar, área segura do
  vertical). Emoji pode no texto do post.

### E-mail

O jogo não manda e-mail (login pelo Google ou anônimo). Se um dia mandar: remetente "Soccermon", assunto curto que
diz o que tem dentro, sem emoji, fundo azul-noite sólido, logo em PNG com contorno, texto nunca em imagem.

## 6. Para não errar

### Acessibilidade

- Contraste pela tabela acima. Branco sobre verde não.
- Foco visível: anel de 3 px (`--yellow` ou branco) com 2 a 3 px de folga.
- Alvo de toque de 40 a 44 px (`.modal-close`, `.tip-close`, botões).
- Ícone sozinho num botão tem `aria-label`; o SVG leva `aria-hidden`.
- Reduzir movimento sempre funcionando (seção 3).

### Arquivos

| O quê | Onde |
|---|---|
| Logo (fonte) | `trailer/arte/logo/final/logo.py` |
| Logo no site | `public/assets/ui/logo.svg`, `simbolo.svg`, `icone.svg`, `favicon.svg`, `public/favicon.ico` |
| Tokens | `src/ui/styles.css` (`:root`), `src/ui/broadcast-kit.css` |
| Cartas | `src/ui/rarity.ts`, `src/ui/components/pokecard2.css`, galeria `?cards=1` |
| Tipos | `src/ui/type-colors.ts`, `public/assets/types/` |
| Ícones | `src/ui/components/MatchHud.tsx` (`ICONS`), `src/ui/components/MenuIcon.tsx`, `src/ui/profile/icons.tsx` |
| Movimento | `src/ui/motion.css`, `src/ui/settings-sync.ts` |
| Fontes | `public/fonts/`, `scripts/build-fonts.ts` |
| Artes de divulgação | `docs/marketing/arte/` |
| Este guia | `docs/marca/brand-guide.md`, `docs/marca/index.html` |

### Não fazer

- Emoji na interface (golpe, menu, botão, gráfico). Só no texto de Compartilhar e nos posts.
- Caractere solto como ícone (×, ▲, ★, ✓, ↻, →) num botão ou marcador.
- Logo esticado, recolorido, com degradê ou sem contorno.
- Marca da Nintendo em destaque: logo oficial do Pokémon, fonte Pokémon Solid, Pokébola como símbolo, "Pokémon"
  maior que "Soccermon", ou qualquer coisa que pareça oficial.
- Qualquer dinheiro: doação, anúncio, loja.
- Sombra macia e degradê em peça do kit (o placar é chapado).
- Cor de tipo como enfeite, ou dourado espalhado (ele perde o peso de destaque).
- Texto de IA: tricolon, ironia empilhada, legenda comprida.
- Mudar carta sem passar pela galeria `?cards=1`.
- Animação sem respeitar Reduzir movimento.

