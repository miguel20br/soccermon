---
description: Revamp de toda a interface no estilo dos ambientes com apelo Clash Royale: design system, inventário das telas, plano por versão e decisões.
---

# Revamp da interface: tudo no estilo dos ambientes (proposta, 25/10/2026)

Pedido do Miguel depois de aprovar a Home em 5 ambientes (0.9.21): levar a mesma proposta pra **todas** as telas. Na
mesma conversa ele deu o eixo: "quero que a UX seja um pouco mais parecida com Clash Royale; sinto que tá tudo muito
pouco apelativo". **Nada de código antes das decisões do fim.**

Como foi feita: leitura de `src/ui/ambientes/` (o que já foi aprovado), `src/ui/styles.css`, `broadcast-kit.css`,
brand guide, ADR 0004 e 0008, `docs/planos/clash-2x2-menus-arcade.md` e a pesquisa de layout
(`pesquisa-layout-e-game-design.md` §3, o sistema de botões que já existe no papel). Prints headless a 390x844, pt-BR,
dev server local, com `?demo=` e `?vel=64` pra chegar em cada tela. Folha com os 30 prints:
[`revamp-ui/antes-390.jpg`](revamp-ui/antes-390.jpg).

## Resumo

- **Falta vontade de apertar.** As telas da copa são painéis azuis iguais, botões
  chapados do mesmo peso, texto cinza pequeno e a ação escondida no meio de tudo. A Home nova (ambientes) e o VS já
  têm cara de jogo; o resto parece formulário.
- **Eixo: apelo Clash** (seção 1): botão gordo com chanfro, cor por função (JOGAR dourado), números grandes com
  contorno, barra de topo com nível e o que você tem, prêmio e progresso sempre à vista, "juice" em todo toque. Em
  pixel art FireRed/PMD, sem moeda, sem loja, sem timer (ADR 0006 e a regra "retenção sem armadilha").
- **Design system** (seção 2): ~14 componentes, quase todos já existem soltos nos ambientes (placa, plaquinha,
  telão, caixa de fala FireRed, placas da beira). A proposta é juntar num kit só (`src/ui/kit/`) com uma galeria
  `?lab=kit` pra você aprovar antes de espalhar.
- **As 3 piores telas hoje:** Escalação (2,3 telas, 38 botões, tática como formulário), Partida (a quadra ocupa 1/4
  da tela, o painel de controles metade) e Capitão/Draft (o campo vazio empurra as cartas pra baixo da dobra e o
  único vermelho da tela é "Monta pra mim").
- **Plano** (seção 4): 0.9.22 a 0.9.29, uma "casa" por versão, começando pelo que o jogador mais vê. A 0.9.22 já
  troca o botão e o painel do jogo inteiro de uma vez (CSS global), então todo mundo sente a diferença logo.
- **19 decisões** no fim (seção 5).

---

## 1. O apelo Clash: o que copiar (sem copiar arte)

### O que faz o Clash parecer apelativo

Olhando a Home, o deck, o baú e a vitória do Clash Royale, o "apelo" vem de 12 padrões concretos. Nenhum depende da
arte deles:

| # | Padrão no Clash | Por que funciona |
|---|---|---|
| 1 | **Botão gordo com chanfro**: contorno preto grosso, faixa clara na metade de cima, base escura de 4–6 px (parece uma peça 3D), texto branco com contorno | Parece físico. O dedo sabe que dá pra apertar sem ler |
| 2 | **BATTLE amarelo-dourado**, o maior da tela, na zona do polegar, com um brilho que passa de vez em quando | Uma coisa só chama. O brilho puxa o olho sem gritar |
| 3 | **Cor por função**: amarelo joga, verde confirma ou compra, azul é neutro ou informação, vermelho fecha, cancela ou apaga | Você aprende a cor uma vez e lê a tela inteira por ela |
| 4 | **Números grandes com contorno grosso** (troféus, nível, contador de cartas, dano) | Lê em cima de qualquer fundo, até em cena animada |
| 5 | **Barra de topo** fixa: nível com estrela e barra de XP, troféus, recursos | O que você é e o que você tem, sempre à vista, em 1 olhada |
| 6 | **Progresso sempre à vista**: caminho de troféus, os 4 espaços de baú, barra "x/y" em cada carta (verde quando dá pra subir) | Sempre tem "o próximo", e ele está perto |
| 7 | **Recompensa é um evento**: o baú cai, treme, abre com explosão de luz, as cartas saem uma a uma, o contador sobe com som | Ganhar dá prazer físico; você quer de novo |
| 8 | **Painel com moldura dupla** (borda escura + filete claro por dentro), fundo com textura leve, título numa fita | Tudo parece objeto, não "caixa de site" |
| 9 | **Janela que entra com pulo** (escala 0,85 → 1,04 → 1), fundo escurecido, fecha tocando fora, X vermelho grande | Abre e fecha sem dúvida |
| 10 | **Selos curtos**: "!" quando tem coisa pra fazer, "NOVO" em fita, número em bolinha | Mostra onde ir, sem texto |
| 11 | **Tela cheia e viva, mas com 1 foco**: arena animada no fundo, personagens parados respirando, e um botão enorme | Nunca vazio, nunca poluído |
| 12 | **Juice em todo toque**: o botão afunda e quica, cada toque tem som, números contam, partículas no ganho | O jogo responde. Parece caro |

### Como fica no Soccermon

| # | No Soccermon | Já existe? |
|---|---|---|
| 1 | Botão chanfrado em pixel: contorno 3 px `--bc-ink`, faixa clara de 3 px no alto, base de 5 px escura, afunda 3 px no toque | o `.btn` tem contorno e sombra de 3 px; falta a faixa clara, a base mais alta e o quique |
| 2 | **JOGAR dourado** (`--yellow` com a faixa `#fff3a0` e a base `#b85a10`, as cores do ERMON do logo), um por tela, brilho de pixel passando a cada 5 s | o JOGAR do Estádio é vermelho com anel de luz na 1ª visita |
| 3 | Dourado joga, **verde** confirma ou compra, **azul** é secundário, **vermelho** só pra perigo e fechar | hoje o vermelho é o principal (brand guide); muda com a decisão 1 |
| 4 | Número contornado em Galmuri14 (placar, ₽, Elo, x/151, taças, nível); contorno de pixel de 2 px sem desfoque | o placar `.bc-sc` tem caixa clara; o resto é texto solto |
| 5 | **Barra de topo** nos ambientes: avatar com **nível de treinador** (as missões que já existem viram a barra de XP), taças, Pokédex x/151, engrenagem. Dentro da copa ela vira **barra da copa**: fase, ₽, sorteios, insígnias | hoje só "?", engrenagem e avatar no canto |
| 6 | Sem baú: o "próximo" é **o próximo treinador ou título** (missões), as **insígnias** da Rota, a **Copa do Dia** no telão, a **Pokédex** no Laboratório e o **Caminho do treinador** na Sede | os dados existem (`missions.ts`, `trophies.ts` `BELTS`/`ROOM_LEVELS`, `metas.ts`) |
| 7 | O **Pacote da vitória** treme, estoura com raios e as 3 cartas pulam; o ₽ do Mercado conta moeda por moeda; o placar do resultado conta os gols | `CardPack`, `CountUp`, os raios da evolução |
| 8 | Moldura dupla com sombra dura: a **placa** dos ambientes (faixa de cima na cor do lugar) e o **telão** do Estádio | `.rm-head`, `.es-top` |
| 9 | Janela vira **sheet que sobe de baixo** (no celular é onde o dedo está); X vermelho redondo; fecha tocando fora ou puxando pra baixo | modais centrais, alguns sem animação |
| 10 | "NOVO" só no que é novo de verdade; "!" só quando tem escolha esperando você (recompensa não aberta, MT pra ensinar) | `NEWS_DOORS`, as fitas NOVO da Pokédex |
| 11 | Cada tela num **lugar** (vestiário, Poké Mart, placar do estádio), com Pokémon PMD parados respirando, e 1 botão grande | os 5 ambientes e o `wild.ts` |
| 12 | Quique em todo botão, som em todo toque (já é delegado), números contando, partículas de pixel só em ganho real | `feedback.ts`, `CountUp` |

### O que não copiar

- **Moeda, gema, loja, passe, oferta** (ADR 0006). O ₽ continua só dentro da copa.
- **Baú com timer**, "volte em 3 h", calendário de login, sequência que zera por dia (regra "retenção sem armadilha",
  `pesquisa-layout-e-game-design.md` §5). A Copa do Dia mostra a semana, mas perder um dia não tira nada.
- **"!" vermelho pra puxar a pessoa de volta.** Selo só aponta escolha que está esperando.
- **Arte, fonte e ícones da Supercell.** O chanfro e o contorno são técnica; a arte continua FireRed/PMD, a fonte
  continua Galmuri, os ícones continuam `HudIcon`.
- **Animação longa no caminho de quem tem pressa.** Juice dura até 300 ms na interface; só os momentos (pacote,
  campeão, evolução, entrar num modo) passam disso, e um toque pula.

---

## 2. Design system (o kit)

Tudo abaixo sai do que já foi aprovado nos ambientes, mais o chanfro do Clash. Mora em `src/ui/kit/` (`kit.css` e
uns componentes React pequenos) e aparece inteiro numa galeria `?lab=kit` (como a `?cards=1`) antes de ir pras telas.
O `broadcast-kit.css` continua pra placar e partida; o que for duplicado sai aos poucos.

### 2.1 Tokens

**Cor.** Os tokens do brand guide ficam. Entram as três tintas de cada botão (faixa clara, face, base) e um azul
mais escuro pra texto branco pequeno:

| Token novo | Hex | Uso |
|---|---|---|
| `--gold-hi` / `--gold` / `--gold-lo` | `#fff3a0` / `#ffcb05` / `#b85a10` | botão JOGAR (as cores do ERMON do logo) |
| `--green-hi` / `--green` / `--green-lo` | `#9be39f` / `#58c26b` / `#2e7d3c` | confirmar, comprar, seguir; texto `--bc-ink` (8,0) |
| `--blue-hi` / `--blue-deep` / `--blue-lo` | `#8fb8f0` / `#2456a8` / `#163a7a` | secundário; branco sobre `--blue-deep` dá 7,1 |
| `--red-hi` / `--red` / `--red-lo` | `#ff8e7a` / `#e8423f` / `#6e1615` | perigo, fechar |
| `--frame-in` | `#39447a` | o filete claro da moldura dupla (o do telão) |
| `--plate` / `--plate-in` | `#1b2147` / `#2a3366` | fundo e filete da plaquinha |
| `--paper` / `--paper-ink` | `#f8f8f0` / `#1d1d2c` | caixa de fala FireRed |

Dourado deixa de ser só destaque e vira **a cor do jogar**. Pra não perder o peso, a seleção (aba ativa, opção
escolhida) continua dourada só como **anel**, nunca como botão cheio.

**Sombra.** Sempre dura, sem desfoque. Três alturas:
`--lift-1: 0 3px 0 var(--bc-edge)` (plaquinha, chip), `--lift-2: 0 5px 0 var(--bc-edge)` (botão, cartão),
`--lift-3: 0 7px 0 3px var(--bc-edge)` (telão, sheet). Regra de ouro do kit: **tem base escura embaixo = dá pra
tocar.** Painel só de informação é chapado (moldura sem base).

**Moldura.** Três níveis, todos já nos ambientes:

| Nível | Receita | Onde hoje |
|---|---|---|
| Placa | borda 3 px `--bc-edge`, faixa de cima de 5 px na cor do lugar, raio 8, `--lift-2` | `.rm-head`, `.rt-head`, `.es-sign` |
| Telão | borda 3 px + anel 3 px `--frame-in`, fundo `#090d22` com pontinhos dourados a 8%, raio 8, `--lift-3` | `.es-top` |
| Plaquinha | fundo `--plate`, filete `inset 0 0 0 2px var(--plate-in)`, raio 4 | `.rt-badges` dentro da placa |

**Tipografia** (Galmuri, só nos tamanhos que ficam limpos, a escala que a pesquisa de layout já propôs):

| Papel | Fonte | Tamanho |
|---|---|---|
| Etiqueta (`.bc-tag`, selo) | Galmuri11 Bold, caixa alta | 10 |
| Texto de apoio, rótulo | Galmuri11 | 12 |
| Texto corrido | Galmuri11 | 14 (como hoje; 12 x 15 fica pra decisão antiga) |
| Botão secundário | Galmuri11 Bold | 15 |
| Botão principal, nome na placa | Galmuri11 Bold / Galmuri14 | 22–24 |
| Número de destaque (₽, x/151, nível) | Galmuri14 contornado | 24–30 |
| Placar, VITÓRIA, Elo | Galmuri14 contornado | 45+ |

**Número e texto contornado** (`.k-out`): `text-shadow` em 8 direções de 2 px `--bc-ink` + 3 px pra baixo, sem
desfoque. Em pixel fica igual ao contorno do Clash. Só em texto ≥ 15 px.

**Raio:** 4 (plaquinha, selo), 6 (placar), 8 (botão, placa), 10 (cartão, carta), 14 (sheet, só em cima).
**Espaço:** 4, 8, 12, 16, 24. Gutter de 16 px no celular.

### 2.2 Componentes

| Componente | Como é | Existe hoje como |
|---|---|---|
| **Barra de topo** | ambientes: avatar com estrela do nível e barra fina de XP, chips de taças e x/151 (número contornado, tocar abre onde mora), engrenagem. Copa: fase em etiqueta, ₽, sorteios, insígnias; voltar à esquerda | `TopActions` (só ícones) |
| **Placa de título** | nome do lugar ou da tela em 22 px, faixa da cor do lugar, plaquinha de meta à direita; voltar entra na placa (um botão só, não logo + seta) | `.rm-head`, `.bc-screenhead` |
| **Plaquinha de meta** | ícone + número contornado + "x/y" ou "faltam N" | `.rt-badges` |
| **Telão** | painel do estádio pra placar, resultado, Copa do Dia, Elo | `.es-top`, `.es-board` |
| **Botão principal (JOGAR)** | dourado chanfrado, 64–68 px no celular, texto 24 branco contornado, `HudIcon next` à direita, linha de apoio em 13 px embaixo do texto; brilho de pixel passando a cada 5 s; **1 por tela** | `.btn.primary` vermelho, `.cup-go` |
| **Botão de confirmar** | verde chanfrado, 52 px, texto 15–24 `--bc-ink`; Seguir, Escolher, Comprar, Confirmar | (não existe) |
| **Botão secundário** | azul chanfrado, 44–48 px, texto 15 branco; Sortear de novo, Substituir, Ver a chave, Compartilhar | `.btn`, `.btn.outline` |
| **Botão terciário** | sem face, contorno 2 px `--line`, texto `--text`, alvo 44; Pular, Menu, Cancelar | `.btn.ghost` |
| **Botão de perigo** | vermelho chanfrado, só dentro da confirmação; fora dela o gatilho é terciário com texto vermelho | `.btn.danger` |
| **Botão-ícone** | quadrado de 44 px chanfrado azul-noite (voltar, engrenagem); fechar é redondo vermelho com X | `.modal-close`, seta da placa |
| **Cartão** | moldura dupla, `--lift-2`, ícone ou sprite à esquerda, nome 15 e uma linha de apoio; o cartão inteiro é o alvo | `.amb-tile`, `.bc-tile`, `.es-sign` |
| **Sheet** | sobe de baixo, alça no topo, 3 alturas (espiada ~25%, meia ~55%, cheia ~92%), fundo escurece só na meia e na cheia, fecha puxando ou tocando fora; no desktop vira painel lateral | (não existe; modais centrais) |
| **Abas** | a barra de baixo dos ambientes; abas internas viram "pasta": a ativa sobe 4 px e ganha a faixa dourada | `.amb-bar`, `.bc-tabs` |
| **Balão de fala** | a caixa do FireRed (papel creme, borda dupla, rosto de quem fala, seta piscando); serve pra líder, Carvalho e tutorial | `.rt-talk` |
| **Toast** | faixa que desce do topo (na barra de topo), 2,5 s, ícone e uma linha; verde ganhou, azul aviso, vermelho erro | `.toast-pill` |
| **Contador** | número contornado que conta (₽, gols, x/151, nível), som de moeda em cada passo, quique no fim | `CountUp` |
| **Barra de progresso** | 14 px, chanfrada, "x/y" contornado dentro, enche com quique; verde quando completa | `.sd-bar`, barra da Pokédex |
| **Selo e fita** | "NOVO" em fita dourada, número em bolinha, "!" só pra escolha esperando | fitas da Pokédex |

### 2.3 Estados

| Estado | Visual | Tempo |
|---|---|---|
| Normal | face, faixa clara, base de 5 px | - |
| Toque | afunda 3 px, base vai a 2 px, escala 0,97 | 60 ms |
| Solta | volta com quique (`--ease-pop`), som `tap` | 180 ms |
| Selecionado | anel dourado de 3 px por fora + selo de check | 200 ms |
| Foco do teclado | anel branco de 3 px com 3 px de folga (como hoje) | - |
| Desabilitado | face `--panel-2`, sem faixa clara, sem brilho, texto `--muted`, **continua no lugar** e diz o porquê numa linha embaixo | 200 ms |
| Carregando | face listrada a 45° andando, texto "Aquecendo…", sem toque; fica no mínimo 400 ms (não pisca) | - |

### 2.4 Movimento

Tokens novos em `:root` (o `nada-teleporta.md` já pedia):

| Token | Valor | Uso |
|---|---|---|
| `--dur-toque` | 60 ms | afundar |
| `--dur-solta` | 180 ms | quique de volta |
| `--dur-ui` | 200 ms | abas, seleção, fade |
| `--dur-tela` | 280 ms | troca de tela e de ambiente (ADR 0004, o `--amb-ms` de hoje) |
| `--dur-pop` | 320 ms | entrada com pulo (janela, carta, selo) |
| `--dur-conta` | 600–1200 ms | contador (momento de jogo; um toque completa) |
| `--dur-modo` | 860 ms | entrar num modo (ADR 0008, `ENTER_MS`) |

Juice, do mais barato pro mais caro:

1. **Quique** em todo botão, cartão e chip (CSS só, no kit).
2. **Pop de entrada** em grade: cada item entra com 40 ms de atraso (draft, Mercado, recompensa, Pokédex na 1ª tela).
3. **Brilho que passa**: uma faixa de 3 pixels claros atravessa o JOGAR a cada 5 s. Só no principal.
4. **Contador** com som de moeda (₽, gols, x/151, nível).
5. **Partículas de pixel** (6 a 10 quadradinhos dourados ou na cor do tipo) só em ganho real: vitória, carta nova,
   desbloqueio, compra, evolução.
6. **Tremida antes de abrir** (pacote, insígnia nova).

Com "Reduzir movimento": sem quique, sem brilho, sem partículas, contador vai direto pro número, sheet só faz fade.

---

## 3. Inventário das telas

Altura medida em telas de 844 px. Prints em `revamp-ui/antes-390.jpg`. Problemas que aparecem em quase todas:

- **Três camadas de cabeçalho** (~150 px): logo SOCCERMON, etiqueta "MENU"/fase, e a placa com a seta. O logo em toda
  tela também volta pro início, então são dois "voltar".
- **Tudo é o mesmo painel azul** com borda `--line`. Botão, cartão clicável e caixa de informação têm a mesma cara;
  só o vermelho se destaca.
- **Texto cinza pequeno** carrega muita coisa que podia ser número ou ícone.
- **Balões do tutorial** aparecem em quase toda 1ª visita, escurecem a tela, cobrem o que explicam (formação: a 1ª
  opção; intervalo: o "Começar o 2º tempo"; Duelo: o "Criar sala") e usam o vermelho no "Entendi", competindo com o
  principal.

### 3.1 Formação (antes do draft)

- **Hoje:** 1,4 tela; 6 cartões iguais (diagrama, nome, posições, frase, prós e contras em verde e vermelho) e
  "Monta pra mim" vermelho na barra. O balão cobre o título e a 1ª opção.
- **Problemas:** 6 opções do mesmo peso em lista longa; a escolha recomendada não aparece; "Monta pra mim" é o único
  vermelho, então a tela manda pular a decisão.
- **Proposta: a prancheta da peneira.** Carrossel de lado com 1 formação grande por vez (a quadra com os 5 pontos
  andando pra posição), as outras como abas embaixo. Prós e contras em 2 selos. Confirmar verde; "Monta pra mim"
  terciário.

```
┌─────────────────────────────┐
│ [<] ANTES DO DRAFT    ₽0 ◇0 │  barra da copa
│ ┌ PENEIRA ──────── 1 de 6 ┐ │  placa
│ │   ╭─────────────────╮   │ │
│ │   │   ●       ●     │   │ │  quadra grande, pontos
│ │ < │       ●         │ > │ │  animando pra vaga
│ │   │   ●       ●     │   │ │
│ │   ╰─────────────────╯   │ │
│ │  LOSANGO (1-2-1)        │ │
│ │  [+Toque curto][-Prof.] │ │  2 selos
│ └─────────────────────────┘ │
│ ◇ ▢ ⊥ ↻ ⇈ ⊓   (abas)        │
│ [ Monta pra mim ]           │  terciário
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  USAR LOSANGO        >  ┃ │  verde
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
```

- **Custo:** 1–1,5 dia. **Risco:** baixo (`chooseFormation` não muda).

### 3.2 Capitão e Draft (escolha 1 de 3)

- **Hoje:** 2 telas. Em cima, uma fileira de 7 chips de vaga; depois a quadra inteira com 5 "vaga" vazias (a 1ª tela
  toda); as 3 cartas só depois da dobra, cada uma com "Escolher capitão" em contorno amarelo; "Sortear de novo (2)"
  solto; "Monta pra mim" vermelho na barra. Nas rodadas seguintes, a quadra escurece e o balão aparece no meio.
- **Problemas:** o que importa (as 3 cartas) está fora da 1ª tela; a quadra vazia e a fileira de chips mostram a
  mesma coisa; 3 botões iguais embaixo das cartas quando tocar na carta já bastaria; o vermelho é o atalho, não a
  escolha.
- **Proposta: a peneira na lateral da quadra.** As 3 cartas em cima, grandes, entrando com pop uma a uma; tocar
  escolhe (anel dourado + a carta sobe); Confirmar verde. O time vira uma faixa compacta embaixo (as 5 vagas e o banco
  como mini-cartas), e a carta escolhida voa pra vaga (o item 4 do `nada-teleporta.md`). "Sortear de novo" vira
  botão secundário azul com o número contornado.

```
┌─────────────────────────────┐
│ [<] CAPITÃO · 1 de 8   ↻ 2  │  barra da copa
│ ┌ ESCOLHA SEU CAPITÃO ────┐ │
│ │ ╔═════╗╔═════╗╔═════╗   │ │
│ │ ║ 89  ║║ 82  ║║ 93  ║   │ │  cartas grandes,
│ │ ║Hypno║║Nine-║║Snor-║   │ │  pop em sequência
│ │ ║     ║║tales║║ lax ║   │ │
│ │ ╚═════╝╚═════╝╚═════╝   │ │
│ │ [ ↻ Sortear de novo  2 ]│ │  azul
│ └─────────────────────────┘ │
│  GOL  FIX  ALA  ALA  PIV │B B│  o time: mini-vagas
│  [  ][  ][  ][  ][  ]    │  │  (a carta voa pra cá)
│ [ Monta pra mim ]           │  terciário
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  CONFIRMAR CAPITÃO   >  ┃ │  verde, apagado até
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │  escolher
└─────────────────────────────┘
```

- **Custo:** 2–3 dias (`Draft.tsx` tem 488 linhas e a lógica de vaga fica). **Risco:** médio: o funil da 0.9.18 mede
  esta tela; o "Monta pra mim" mais discreto pode mudar a taxa de quem termina o draft. Medir com `npm run stats`.

### 3.3 Escalação

- **Hoje:** 2,3 telas, 38 botões. Em ordem: chave da copa (4 cartões) e "Ver a chave", dica, 6 formações em seletor,
  frase de prós e contras, quadra com as vagas, banco, o rival (5 sprites, formação, tática, média), "Tática" como
  formulário (rótulo à esquerda, valor amarelo com seta: Como o time joga, Escanteio, Cobrador, Sinergias), a carta do
  capitão recolhida e "Abandonar copa" no fim. "Jogar oitavas de final" vermelho fixo embaixo (bom).
- **Problemas:** uma tela faz quatro trabalhos (chave, formação, tática, rival). A tática parece tela de
  configurações. A confirmação de "Abandonar" aparece **atrás da barra do Jogar** (no print, o "Abandonar copa" e o
  "Cancelar" ficam cortados). Texto cinza demais.
- **Proposta: o vestiário.** Fundo de parede de azulejo com armários (kit LimeZu), a **prancheta** no centro (a quadra
  com as cartas) ocupando a 1ª tela inteira. Em volta, 4 objetos com nome: a **chave** (quadro na parede, abre sheet),
  a **tática** (quadro-branco, abre sheet com os 4 cartões grandes que a partida já usa), o **rival** (a porta, com os
  5 sprites e a formação dele; tocar abre a ficha), o **banco** (2 armários). Formação como seletor de 6 ícones em
  cima da prancheta. Abandonar vai pra dentro da sheet da chave, com confirmação em sheet própria. JOGAR dourado.

```
┌─────────────────────────────┐
│ [<] OITAVAS · Viridian  ₽8  │  barra da copa
│ ▓▓ armários ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ [Chave]  ◇ ▢ ⊥ ↻ ⇈ ⊓ [Tática]│  objetos + formação
│ ╭──── PRANCHETA ──────────╮ │
│ │        [Aerodactyl 76]  │ │
│ │ [Persian 79]  [Raichu 83]│ │  as cartas na quadra
│ │        [Venusaur 82]    │ │
│ │        [Slowbro 89 ©]   │ │
│ ╰─────────────────────────╯ │
│ BANCO [Kadabra][Articuno]   │
│ ┌ RIVAL: Viridian Terra ──┐ │  a porta: sprites +
│ │ ◐◐◐◐◐  Linha de 3 · 68  │ │  plaquinha da média
│ └─────────────────────────┘ │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  JOGAR OITAVAS       >  ┃ │  dourado
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
```

- **Custo:** 3–4 dias. **Risco:** médio: muita coisa mora aqui (Patrocínios, MT, escanteio, cobrador, sinergias).
  Nada some, só muda de casa; o teste `formation-board.test.ts` e os prints do CI pegam regressão.

### 3.4 Pré-jogo (VS)

- **Hoje:** já é o melhor exemplo do jogo: lados com cor, o líder falando, o VS grande, os times em sprite, médias em
  plaquinha. O "Carregando a quadra…" é um botão vermelho apagado com barrinha.
- **Problemas:** o carregando parece botão desabilitado.
- **Proposta:** manter. O carregando vira a barra de progresso do kit sem cara de botão; quando a quadra fica pronta,
  vira o JOGAR dourado com pop ("ENTRAR EM QUADRA"). Médias em número contornado. Opcional: a câmera sai do vestiário
  pelo túnel (a mesma do Estádio).
- **Custo:** 0,5 dia. **Risco:** baixo.

### 3.5 Partida (HUD e painéis)

- **Hoje:** 1,2 tela. Placar de TV em cima (bom), a linha de momentum, a quadra em ~25% da altura, a faixa de lances, e
  metade da tela de controles: abas Tática / Posições / Time / Lances, "Substituir", 4 cartões de tática, escanteio,
  beira da quadra, e a velocidade fixa embaixo.
- **Problemas:** **o jogo é a menor coisa da tela.** Os nomes em quadra ficam minúsculos, o golpe "TRANSFORM!" cobre
  metade da quadra. Os cartões de tática e o "Substituir" têm o mesmo peso. 22 botões visíveis enquanto a partida corre.
- **Proposta: a beira da quadra.** A quadra cresce pra ~60% da altura (em pé, mais alta que larga já não cabe; a ideia
  é aproximar a câmera e deixar a quadra rolar de lado, como o deitado já faz). Os controles viram **sheet na espiada**:
  4 botões-ícone grandes (Tática, Trocar, Escanteio, Golpe máximo) com o estado em plaquinha; tocar sobe a sheet até a
  meia altura com o painel dele. Velocidade vira um botão-ícone só que alterna 1x/2x/4x/8x. Golpe máximo aceso ganha o
  brilho dourado (é o JOGAR da partida).

```
┌─────────────────────────────┐
│ ◖DEM│ 1 │ 23' 1ºT │ 0 │CER◗ │  placar de TV
│ ▁▂▃▅▃▂▁ momentum            │
│ ╭─────────────────────────╮ │
│ │                         │ │
│ │   quadra grande,        │ │  ~60% da altura
│ │   câmera mais perto     │ │
│ │                         │ │
│ ╰─────────────────────────╯ │
│ 20' Ditto vira Mewtwo...    │
│ ╭──────── ▔▔▔ ────────────╮ │  sheet na espiada
│ │[Tática][Trocar][Esc.][★]│ │  4 ícones grandes
│ │ Equil.   2 ↔    Varia  ▮│ │  estado embaixo
│ ╰─────────────────────────╯ │
│              [2x]  [ ▶▶ ]   │
└─────────────────────────────┘
```

- **Custo:** 4–6 dias (`Match.tsx` 872 linhas, `MatchHud`, `Sideline`, câmera no Phaser). **Risco:** alto: é a tela
  mais testada (vestiário, acréscimos, máximo, charanga, escanteio) e o Duelo usa a mesma HUD (`DuelMatch.tsx`). Não
  mexe no motor. Fazer atrás de bandeira (`?lab=hud`) e jogar uma copa inteira antes de trocar (ADR 0005).

### 3.6 Intervalo

- **Hoje:** painel no meio da tela por cima das abas: placar, chutes, posse, mais cansado, "O rival trocou",
  "Substituir" e "Começar o 2º tempo"; o balão do tutorial cobre os dois botões.
- **Problemas:** os números (8 x 6, 23%) em texto pequeno; o vermelho e o "Substituir" lado a lado com peso parecido.
- **Proposta: o telão do intervalo.** A sheet sobe até a meia altura sozinha: telão com o placar e 3 números
  contornados (chutes, posse, mais cansado com a barra de fôlego), a troca do rival como cartão com o sprite,
  "Trocar" azul e **VOLTAR PRO JOGO** dourado.
- **Custo:** 1 dia. **Risco:** baixo (o `HalftimePanel` já é separado).

### 3.7 Pênaltis

- **Hoje:** fim de jogo empatado abre "Ordem dos pênaltis": lista de 5 com setas cima e baixo de ~32 px; o botão
  "Melhor chute primeiro" fica cortado pela barra de velocidade. Depois, a disputa com "PEGOU!" e o resultado no meio.
- **Problemas:** setas pequenas; a ação de confirmar não aparece na 1ª tela.
- **Proposta:** a ordem vira 5 cartas em fila (arrastar pra trocar, ou tocar em duas, que já é a regra da escalação),
  com o número contornado em cima; "Melhor chute primeiro" secundário e **COBRAR** dourado. Na disputa, o placar dos
  pênaltis como 5 bolinhas por time (verde gol, vermelho perdeu), que é o que o jogador procura.
- **Custo:** 1–1,5 dia. **Risco:** baixo; o Duelo usa o mesmo `PenaltyOrderPanel`.

### 3.8 Fim de jogo e Resultado

- **Hoje:** na quadra, "VITÓRIA!" com "Ver resultado · 3 s" (vermelho contando) e "Ficar aqui". O resultado tem 1,7
  tela: etiqueta da fase, VITÓRIA! em letreiro, placar, a fala do líder, 3 linhas de estatística em texto, os 5 do time
  com o craque, a chave em pílulas, o próximo rival, e "Escolher recompensa" na barra. É a tela mais perto do estilo
  novo hoje.
- **Problemas:** estatística em texto cinza; a chave em pílulas pequenas; a fala do líder pequena; o placar não conta.
- **Proposta: o placar do estádio.** O telão (moldura do kit) com o placar contando de 0 até o resultado, gol a gol,
  com o minuto embaixo de cada número; **VITÓRIA!** em fita contornada que cai com pop; o craque sobe com partículas;
  3 estatísticas como plaquinhas (posse, chutes, golpes) com o número grande. A chave vira um "caminho de troféus" de
  4 casas (oitavas → final) com a casa de agora acesa, e o próximo rival na casa seguinte. **PEGAR RECOMPENSA**
  dourado (é a próxima jogada).

```
┌─────────────────────────────┐
│ ╔═══════ OITAVAS ═════════╗ │
│ ║   ★ V I T Ó R I A ★     ║ │  fita, pop
│ ║  DEMO FC  5 × 3  CERUL. ║ │  telão: placar conta
│ ║   3' 9' 21' 30' 38'     ║ │
│ ╚═════════════════════════╝ │
│ [Misty] "Tá, tá... foi sorte"│ caixa FireRed
│ [53%][25 x 14][12 golpes]   │  plaquinhas
│      ✦ Mewtwo  CRAQUE ✦     │  partículas
│ (✓)──(2)──(3)──(4)          │  caminho da copa
│        ^ Cinnabar Vulcão    │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  PEGAR RECOMPENSA    >  ┃ │  dourado
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
```

- **Custo:** 1,5–2 dias (`ResultHero.tsx` já separado). **Risco:** baixo.

### 3.9 Recompensa (pacote)

- **Hoje:** antes de abrir, o pacote no meio de uma tela vazia, o título "Escolha uma recompensa" com "Sortear de novo
  (2)" (sortear o quê, se nem abriu?) e "Pular (+1 sorteio)" como único botão. Depois de abrir, 2 telas de cartas.
- **Problemas:** o momento mais Clash do jogo está sem juice: não treme, não estoura, e o texto fala da escolha antes
  da hora.
- **Proposta: o baú sem timer.** O pacote cai com pop, treme 2 vezes, estoura em raios (os da evolução) e as 3 cartas
  pulam em leque com pop; "Sortear de novo" só aparece depois, em azul. Escolher = tocar na carta (anel dourado);
  **PEGAR** verde. "Pular (+1 sorteio)" terciário. Se tiver MT, a carta da MT tem fita própria.
- **Custo:** 1,5 dia (`CardPack.tsx`, `Reward.tsx`). **Risco:** baixo; o pacote rápido
  (`soccermon-packs-opened`) continua pulando a animação.

### 3.10 Mercado

- **Hoje:** 2 telas. O ₽24 pequeno no cabeçalho, "Novas ofertas · grátis", um painel de texto "A vitória rendeu" com
  os ganhos, 2 cartas com "Comprar · ₽4" em contorno amarelo, pacote e item embaixo da dobra, Seguir vermelho.
- **Problemas:** o dinheiro, que é o recurso da tela, é texto; o rendimento é um parágrafo; metade da loja fica fora
  da 1ª tela.
- **Proposta: o Poké Mart.** Balcão com o vendedor (atendente do Mart desenhado no traço do kit), as ofertas na
  vitrine em grade 2x2 (2 cartas, pacote, item), preço em plaquinha com número contornado e **Comprar verde**. O ₽ fica
  na barra da copa, grande, e o "a vitória rendeu" vira um recibo que entra moeda por moeda no contador (+5, +3, +2,
  +2). **SEGUIR** verde (aqui não se joga).

```
┌─────────────────────────────┐
│ [<] PRÓX.: SEMIFINAL  ₽ 24  │  ₽ contornado, conta
│ ▓▓ prateleiras do Mart ▓▓▓▓ │
│   (vendedor)  "Bem-vindo!"  │
│ ═══════ balcão ════════════ │
│ ╔═════╗ ╔═════╗             │
│ ║ ?   ║ ║ 91  ║             │  vitrine 2x2
│ ║Ditto║ ║Mach.║             │
│ ╚═════╝ ╚═════╝             │
│ [₽4 Comprar][₽7 Comprar]    │  verde
│ [Pacote ₽6]  [Item ₽3]      │
│ recibo: vitória +5 gols +3  │
│ [↻ Novas ofertas · grátis]  │  azul
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  SEGUIR              >  ┃ │  verde
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
```

- **Custo:** 2 dias (+1 se o vendedor for arte nova). **Risco:** baixo; `Shop.tsx` e `shop.css` são isolados.

### 3.11 Mapa da Rota (por dentro da copa longa), Evento, Treino, Planalto

- **Hoje:** o mapa por faixas de região é bonito (Rota 1, Floresta, Mt. Moon…), com os nós redondos e o time andando.
  A fala do Carvalho fica embaixo, cobrindo o fim do mapa. **Evento:** cartão com um círculo vermelho grande que parece
  botão mas não é, e as opções ("Um descansa", "Chamar o fisio") como faixas chapadas que não parecem clicáveis.
  **Treino:** dois painéis de texto, chips de Pokémon com barrinha, "Descansar" comum, sem botão principal, meia tela
  vazia. **Planalto:** tabela boa, mas a fala do Lance cobre o botão vermelho (já anotado na pesquisa de layout).
- **Problemas:** nós do mapa todos do mesmo tamanho (o próximo jogo só tem um anel); evento e treino sem hierarquia.
- **Proposta:** o próximo nó maior, com quique e o rosto do rival em cima; nós já feitos apagados. **Evento:** a cena
  da região de fundo, a caixa de fala FireRed com quem conta o evento, e cada escolha como **cartão chanfrado** com o
  custo em plaquinha (₽4) à direita. **Treino:** os Pokémon em fila no gramado de treino, cada um com a barra de
  evolução grande; tocar escolhe; **TREINAR** verde. **Planalto:** a tabela no telão, fala fecha antes da barra do
  polegar aparecer.
- **Custo:** 2–3 dias juntos. **Risco:** médio: a Rota é o modo mais novo, com o robô do store passando e a tela
  quebrando (21/10). Jogar uma Rota inteira na tela antes de subir.

### 3.12 Campeão, Eliminado, Hall

- **Hoje:** o **campeão** tem 8,4 telas: abertura com o craque, caminho do título, prêmios, seleção da copa, gols da
  campanha, mapa de onde saíram os gols, golpes, a final, o elenco em cartas, o gol da copa, os botões, **15 avisos de
  "Treinador novo desbloqueado" em lista de texto** e os detalhes. **Eliminado:** "FIM DA LINHA", placar, fala, stats,
  Menu e Nova copa (bom).
- **Problemas:** o melhor momento do jogo vira relatório. Os desbloqueios, que são o prêmio de verdade, estão no fim, em
  lista.
- **Proposta: a festa em 2 telas.** Tela 1: a taça (troféu pixel) subindo com partículas, CAMPEÃO em fita, o placar da
  final no telão, o elenco de pé, e **os desbloqueios como cartas viradas** que você toca pra revelar uma a uma (o
  "abrir baú" do Clash, sem chance escondida: tudo o que vem já está ganho). Tela 2 (sheet "Ver tudo"): as estatísticas
  em abas. Botões: **NOVA COPA** dourado, Compartilhar azul, Melhores momentos azul.
- **Custo:** 2–3 dias (`ChampionView`, `ChampionExtras`, `HallParade`, `UnlockNotice`). **Risco:** médio: tem muita
  coisa e o clipe/compartilhar depende dela. A decisão 10 define o quanto sai da 1ª tela.

### 3.13 Duelo e sala

- **Hoje:** 1,4 tela; na 1ª visita o tour escurece tudo. Modo (3 cartões), BETA, velocidade (seletor), duração,
  número de jogos (seletor). O "Criar sala" fica embaixo da dobra.
- **Problemas:** 4 escolhas antes do botão (a decisão 16 da pesquisa de menus já aprovou recolher as regras).
- **Proposta: a quadra de rua da Arena.** A tela abre com o seu capitão contra a silhueta (a cena da Arena), e só
  **CRIAR SALA** dourado e "Entrar com código" azul. As regras ficam numa plaquinha ("Disputa · 4x · 1 jogo",
  tocar abre a sheet). Na sala, os dois lados em VS com o código grande contornado e o QR.
- **Custo:** 2 dias (a lógica fica em `src/net/`; só `Duel.tsx`). **Risco:** médio: Duelo tem muita borda
  (recarregar, host que volta); prints do CI e uma partida real entre dois navegadores headless antes de subir.

### 3.14 Liga e Copa do Dia

- **Hoje:** Liga (fechada, demo) com o Elo grande em caixa amarela (bom), o próximo rival, Jogar vermelho, e textos
  longos de regra. Copa do Dia com a data, a regra em texto, a semana em quadradinhos, a figurinha do dia e o ranking;
  o tour destaca a regra e põe outro balão por cima.
- **Proposta:** **Liga** no telão da Arena: Elo contornado com a faixa (Bronze, Prata…) como insígnia, a barra até a
  próxima faixa, o rival em VS pequeno, **JOGAR** dourado; regras numa sheet "Como funciona". **Copa do Dia** no telão
  do Estádio que já existe: a semana com as lâmpadas, a figurinha do dia como prêmio à vista, **JOGAR HOJE** dourado e o
  ranking embaixo em placas.
- **Custo:** 1,5 dia as duas. **Risco:** baixo.

### 3.15 Perfil, Treinador, Clube, Amigos

- **Hoje:** o Perfil tem 5,8 telas e 113 botões: o cartão do treinador, as portas de Sala de troféus e Coleção (que
  agora já estão na barra), abas Treinador / Clube / Amigos, "10 de 63 missões", o formulário do nome, o avatar e as
  63 missões em lista. Amigos tem o código grande (bom) e "Copiar" pequeno.
- **Problemas:** comprido, repete portas, missões em lista longa.
- **Proposta: tudo vira cômodo da Sede.** O cartão do treinador fica pendurado como quadro; Treinador, Clube e Amigos
  abrem em sheet a partir dos móveis (o espelho é o Treinador, o varal com o escudo é o Clube, o mural é Amigos). As
  missões viram o **Caminho do treinador**: uma estrada horizontal de prêmios (treinador, título, cinturão, nível da
  sala) com você no ponto atual e a barra até o próximo; as missões aparecem como "como chegar no próximo". Código de
  amigo contornado, **Copiar** azul grande.

```
┌─────────────────────────────┐
│ ★4 ▬▬▬▭  [taça]7  121/151 ⚙│  barra de topo (ícones HudIcon)
│ ┌ CAMINHO DO TREINADOR ───┐ │
│ │ ●━━●━━●━━◉━━○━━○━━○     │ │  rola de lado
│ │ Red Blue Erika [Ás] ... │ │  o próximo em destaque
│ │ Treinador Ás: 3/5 copas │ │
│ │ ▬▬▬▬▬▬▬▭▭▭  3/5         │ │
│ └─────────────────────────┘ │
│ como chegar:                │
│ [Ganhe 2 copas sem levar gol]│ cartões, 3 por vez
│ [Use 5 Pokémon de Fogo     ]│
│ [Ver todas as missões     >]│
└─────────────────────────────┘
```

- **Custo:** 3–4 dias (o caminho é tela nova; os dados já existem em `missions.ts` e `trophies.ts`). **Risco:** médio:
  links antigos (`doors.ts`) e o save não mudam, mas é a tela com mais coisa.

### 3.16 Pokédex, Álbum, Golpedex

- **Hoje:** Pokédex com 4,4 telas e 180 botões: abas, vistos/jogaram com barra, 5 filtros em pílula em 2 linhas, uma
  linha de tipos que rola de lado, e a grade (boa) com fitas NOVO cortadas. Álbum com a vitrine de 3 cartas e o livro
  por geração (bom, já tem cara de objeto).
- **Proposta:** a Pokédex vira o aparelho na bancada do Laboratório: tampa vermelha de pixel em volta, x/151 contornado
  no visor, filtros num seletor só (Todos / Faltam / Jogaram) e o tipo como abas de ícone. A grade fica; a ficha do
  Pokémon abre em sheet. Álbum fica como está com o kit novo. Golpedex no computador do Laboratório (a tela verde do
  PC do FireRed).
- **Custo:** 2 dias. **Risco:** baixo; a grade de 151 é pesada no celular: o pop de entrada só na 1ª tela.

### 3.17 Sala de troféus

- **Hoje:** a cena é linda (o quarto com as vitrines). Embaixo, a fala cobrindo metade, abas em pílula que vazam pra
  direita (Copa, Liga, Copa do Dia, Duelo, Medalhas, Hall), "Nível 2 · Sala do clube", "Como funciona" e "Ver tudo em
  lista" como botões comuns, e meia tela vazia.
- **Proposta:** é a cena da Sede: as vitrines são as abas (tocar numa vitrine abre a sheet dela), o nível da sala vira
  plaquinha na placa, "Ver em lista" terciário. Sem abas em pílula.
- **Custo:** 1,5 dia. **Risco:** baixo.

### 3.18 Configurações, Ajuda, Novidades

- **Hoje:** Configurações com 2,4 telas de painéis (idioma, som, partida, acessibilidade… e o rodapé com Novidades,
  Ajuda, Créditos). Ajuda com 2,7 telas: 2 botões em contorno amarelo, 7 pílulas de modo também em contorno amarelo
  (parecem todos ação principal), a busca e os acordeões. Novidades é um modal bom (MAIS RECENTE em etiqueta).
- **Proposta:** **Configurações** em sheet cheia com seções colapsadas (cada uma um cartão com ícone); o perigo
  ("Apagar dados") como terciário vermelho com confirmação. **Ajuda:** a busca no topo, os modos como cartões com o
  ícone do lugar (2 colunas), e "Ver o passo a passo" azul. **Novidades:** sheet com a versão em fita e os itens com
  ícone; o resto fica.
- **Custo:** 1,5 dia as três. **Risco:** baixo.

### 3.19 Balões do tutorial

- **Hoje:** `Coach` com caixa azul-escura, anel amarelo em volta do alvo, "Pular" em contorno e "Entendi"/"Próximo"
  vermelhos. Escurece a tela e muitas vezes cobre o alvo.
- **Proposta:** usar a **caixa de fala FireRed** com o rosto do Carvalho (ou do líder, no modo dele), sempre do lado
  oposto do alvo (nunca em cima), sem escurecer a tela inteira (só um anel de luz no alvo, o mesmo do JOGAR da 1ª
  visita), e o avanço por toque na própria caixa (a seta piscando, como no jogo). Pular vira um X pequeno. Sem
  vermelho. No máximo 1 balão por tela; o 2º passo espera a próxima visita.
- **Custo:** 1–1,5 dia (`src/ui/coach/`). **Risco:** baixo; testes do coach (`coach.test.ts`) continuam valendo.

### 3.20 Modais de confirmação, carta, toast

- **Hoje:** "Abandonar copa" abre uma confirmação **dentro da página, atrás da barra do Jogar** (cortada no print).
  Modais centrais (carta, ficha, conta). Toast em pílula.
- **Proposta:** toda confirmação vira **sheet curta**: título de 1 linha, o que se perde em 1 linha, terciário
  "Cancelar" à esquerda e o perigo vermelho à direita. A carta (`CardModal`) abre em sheet cheia (a carta em si não
  muda: carta só pela galeria `?cards=1`). Toast desce da barra de topo.
- **Custo:** 1 dia o componente + 0,5 dia por lugar que usa. **Risco:** baixo. O "Abandonar" atrás da barra é bug de
  hoje: dá pra consertar já, fora do revamp.

### Tabela geral

| Tela | Altura hoje | Pior problema | Lugar proposto | Custo (dias) | Risco |
|---|---|---|---|---|---|
| Formação | 1,4 | 6 iguais, vermelho = pular | peneira (prancheta) | 1–1,5 | baixo |
| Capitão / Draft | 2,0 | cartas fora da 1ª tela | peneira | 2–3 | médio |
| Escalação | 2,3 | 4 telas numa, tática de formulário | vestiário | 3–4 | médio |
| VS | 1,0 | carregando parece botão | túnel | 0,5 | baixo |
| Partida | 1,2 | quadra em 1/4 da tela | beira da quadra | 4–6 | alto |
| Intervalo | - | números pequenos | telão do intervalo | 1 | baixo |
| Pênaltis | - | setas pequenas | fila de cartas | 1–1,5 | baixo |
| Resultado | 1,7 | estatística em texto | placar do estádio | 1,5–2 | baixo |
| Recompensa | 2,0 | sem juice | o pacote | 1,5 | baixo |
| Mercado | 2,0 | ₽ e rendimento em texto | Poké Mart | 2–3 | baixo |
| Rota por dentro | 1,5 | evento e treino sem hierarquia | cenas das regiões | 2–3 | médio |
| Campeão | 8,4 | festa virou relatório | a festa | 2–3 | médio |
| Duelo | 1,4 | 4 escolhas antes do botão | quadra de rua | 2 | médio |
| Liga / Dia | 1,4 / 1,3 | regras em texto | telão | 1,5 | baixo |
| Perfil | 5,8 | missões em lista, portas repetidas | Sede + caminho | 3–4 | médio |
| Pokédex | 4,4 | filtros em 3 camadas | Pokédex na bancada | 2 | baixo |
| Sala | 1,0 | abas que vazam, meia tela vazia | vitrines da Sede | 1,5 | baixo |
| Config / Ajuda / Novidades | 2,4 / 2,7 / - | tudo amarelo na Ajuda | sheets | 1,5 | baixo |
| Tutorial | - | cobre o alvo | caixa FireRed | 1–1,5 | baixo |
| Confirmações | - | atrás da barra | sheet curta | 1–2 | baixo |
| **Kit** (base) | - | - | `src/ui/kit/` + `?lab=kit` | 3–4 | médio |

Total: ~40–55 dias de trabalho, em 8 versões.

---

## 4. Plano por versão

Ordem pelo que o jogador mais vê (draft, escalação, partida, resultado), depois o que está dentro dos ambientes. Cada
versão é uma "casa" com um trailerzinho de 9:16. Toda tela nova nasce com transição (ADR 0004) e o que mexer no fluxo
da copa passa pela fumaça completa (copa inteira na tela, 320/390/deitado/1440).

| Versão | Nome | O que entra | Trailerzinho |
|---|---|---|---|
| **0.9.22** | Botão de apertar | **Kit global**: tokens, os 5 botões chanfrados aplicados no `.btn` do jogo inteiro (o layout não muda, a cara muda), regra "base escura = clicável", número contornado, quique e som em todo toque, galeria `?lab=kit`. **Barra de topo** nos ambientes (nível, taças, x/151). **Draft inteiro** (formação e capitão/vagas na peneira) | dedo apertando o JOGAR dourado com o brilho passando; as 3 cartas caindo em pop: "ESCOLHA 1 DE 3" |
| **0.9.23** | Vestiário | Escalação no vestiário, VS com o túnel, **barra da copa** (fase, ₽, sorteios, insígnias) em todas as telas da copa, a **sheet** e as confirmações em sheet (some o "Abandonar" atrás da barra) | armários abrindo, cartas indo pra prancheta: "MONTE O TIME NO VESTIÁRIO" |
| **0.9.24** | Beira da quadra | Partida com a quadra grande e os controles em sheet (atrás de `?lab=hud` até jogar uma copa inteira), intervalo no telão, pênaltis em fila de cartas | gol, a sheet de tática subindo, a virada: "TÁTICA NA HORA" |
| **0.9.25** | Placar do estádio | Resultado com placar contando, recompensa com o pacote estourando, Eliminado, Campeão em 2 telas com os desbloqueios virando | o placar contando e o pacote estourando: "CAMPEÃO DE KANTO" |
| **0.9.26** | Poké Mart | Mercado no Mart, mapa da Rota com o próximo nó vivo, Evento, Treino e Planalto | moedas ₽ subindo no balcão: "COMPRE NA ESTRADA" |
| **0.9.27** | Sede | Perfil, Treinador, Clube e Amigos dentro da Sede, Sala de troféus nas vitrines, **Caminho do treinador** | a estrada de prêmios andando e um treinador novo liberando: "LIBERE TREINADORES" |
| **0.9.28** | Laboratório e Arena por dentro | Pokédex na bancada, Golpedex no PC, Duelo na quadra de rua com as regras recolhidas, Liga e Copa do Dia nos telões | a Pokédex enchendo; silhueta virando o amigo: "DESAFIE SEU AMIGO" |
| **0.9.29** | Faxina | Configurações, Ajuda e Novidades em sheet, tutorial na caixa do Carvalho, toast, apagar a Home de lista e o CSS morto | antes e depois lado a lado em 10 s |

Se o ritmo de "versões menos frequentes" pedir, dá pra juntar 0.9.26 com 0.9.27 e 0.9.28 com 0.9.29 (6 versões).

O que pode ir antes, fora do revamp (conserto com teste, sobe sem perguntar pela regra 5 de velocidade): a
confirmação do "Abandonar copa" atrás da barra do Jogar.

---

## 5. Decisões pro Miguel

1. **Cor do botão principal:** JOGAR **dourado** chanfrado (Clash) e cor por função: dourado joga, verde confirma ou
   compra, azul é secundário, vermelho só perigo e fechar. Muda o brand guide, que hoje diz "vermelho é a ação
   principal" **(recomendado)** / dourado só no JOGAR dos ambientes e o resto continua vermelho / tudo como está.
2. **Texto do botão dourado:** branco com contorno azul-noite de pixel, como o Clash **(recomendado)** / azul-noite sem
   contorno (mais contraste, menos "Clash").
3. **Regra "base escura embaixo = dá pra tocar"**, painel de informação chapado **(recomendado)** / sem regra.
4. **Kit aplicado no jogo inteiro de uma vez na 0.9.22** (o `.btn` e o `.panel` globais mudam, o layout das telas
   fica) **(recomendado)** / só tela por tela, conforme cada versão.
5. **Galeria `?lab=kit`** pra você aprovar botões, placas, sheet e contador antes de espalhar **(recomendado)** / ver
   direto nas telas.
6. **Barra de topo com nível de treinador:** as missões que já existem viram a barra de XP (nível = missões cumpridas
   em degraus), mais taças e x/151; sem moeda nova **(recomendado)** / só taças e x/151, sem nível / sem barra.
7. **Caminho do treinador** na Sede (treinadores, títulos, cinturões e níveis da sala numa estrada só, com o próximo
   prêmio à vista) **(recomendado)** / missões continuam em lista.
8. **Ordem:** kit + Draft na 0.9.22, depois Escalação, Partida, Resultado **(recomendado)** / começar pela Partida.
9. **Partida:** quadra em ~60% da tela e os controles numa sheet de 4 ícones, atrás de `?lab=hud` até jogar uma copa
   inteira **(recomendado)** / manter o painel fixo embaixo e só trocar o visual.
10. **Campeão em 2 telas:** a festa e os desbloqueios virando como cartas na 1ª; as estatísticas numa sheet "Ver tudo"
    **(recomendado)** / manter tudo na tela, só com o kit.
11. **Escalação = vestiário:** a prancheta na 1ª tela; chave e tática em sheet; Abandonar dentro da chave
    **(recomendado)** / layout de hoje com o kit novo.
12. **Draft:** as 3 cartas em cima na 1ª tela, escolher tocando, Confirmar verde, "Monta pra mim" vira terciário
    **(recomendado)** / manter "Monta pra mim" em destaque (o funil da 0.9.18 mede essa tela).
13. **Janelas viram sheet** que sobe de baixo (confirmação, carta, Novidades, Configurações) **(recomendado)** /
    manter modais no centro.
14. **Logo SOCCERMON só no Estádio, no VS e no Campeão**; nas outras telas, a placa com o voltar **(recomendado)** /
    logo em toda tela como hoje.
15. **Tutorial na caixa de fala FireRed** com o Carvalho, sem escurecer a tela, nunca em cima do alvo, 1 por tela, sem
    vermelho **(recomendado)** / manter o `Coach` de hoje.
16. **Juice:** quique e som em todo toque, brilho só no botão dourado (a cada 5 s), partículas só em ganho real,
    contadores com som de moeda **(recomendado)** / menos (sem brilho nem partículas) / mais (partículas em todo toque).
17. **Mercado com vendedor** desenhado atrás do balcão (+1 dia de arte) **(recomendado)** / só o balcão e a vitrine.
18. **Número contornado** no placar, ₽, Elo, x/151, nível e taças; **a carta não muda** (só pela galeria `?cards=1`)
    **(recomendado)** / contornar também a nota da carta (aí passa pela galeria antes).
19. **Escala de fonte nativa da Galmuri** (10/12/15/24/30/45) entra junto com o kit **(recomendado)** / depois, num
    print lado a lado em 1440.

## Fontes

- Clash Royale, análise de UX (Home, barra de abas, botão Battle): https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/
- Clash Royale, atualização de verão 2022 (Home e Perfil novos): https://supercell.com/en/games/clashroyale/blog/release-notes/clash-royale-summer-update-2
- Clash of Clans, interface refeita: https://supercell.com/en/games/clashofclans/blog/news/weve-revamped-the-clash-of-clans-user-interface/
- Análise acadêmica da UI do Clash Royale: https://binus.ac.id/bekasi/2025/03/analysis-towards-ui-ux-of-clash-royale-towards-the-gameplay/
- Crítica de UX do Brawl Stars (botão demais em volta do Jogar): https://ixd.prattsi.org/2025/02/design-critique-brawl-stars/
- Thumb zone: https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users
- Padrões escuros em jogos (o que não copiar): https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games
- No repo: `docs/planos/clash-2x2-menus-arcade.md` (ambientes), `docs/planos/pesquisa-layout-e-game-design.md` §3 e §5
  (botões e retenção sem armadilha), `docs/planos/nada-teleporta.md`, ADR 0004, 0006 e 0008, `docs/marca/brand-guide.md`.
