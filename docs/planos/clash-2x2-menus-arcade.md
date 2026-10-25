---
description: Pesquisa e opções pra 2x2 estilo Clash Royale, menus com barra de abas e modos arcade curtos.
---

# 2x2, menus estilo Clash e modos arcade (pesquisa, 25/10/2026)

Pedido do Miguel pra próxima atualização: (1) "modo 2x2 igual Clash Royale", (2) menus inspirados no Clash, porque
os de hoje estão "confusos de mexer", (3) mais modos arcade. **Nada de código antes das decisões do fim.**

Como foi feita: leitura de `src/net/` (Duelo), `src/engine/config.ts` (MatchConfig), `src/engine/state.ts` (ordens),
controllers e Home; prints headless a 390x844 (pt-BR, save cheio do `?demo=sala`, dev server local na porta 8103)
de Home, Perfil, Coleção, Sala de troféus, Duelo, Mercado e mapa da Rota; e pesquisa na web (fontes no fim).

## Resumo

| Pedido | Recomendação | Custo | Mexe no motor? |
|---|---|---|---|
| 2x2 | **Dupla dividindo um time**: primeiro com parceiro IA (offline), depois com amigo por link (4 na sala do Duelo) | 3–4 dias + 8–12 dias | não |
| Menus | **Cada modo é um lugar** (visão do Miguel): barra de 5 abas embaixo, arrastar de lado, cada aba um ambiente animado (Laboratório, Rota, **Estádio no centro**, Arena, Sede do clube), em etapas | 6–9 dias (barra) + 13–19 dias (ambientes) | não |
| Arcade | Começar por **Monotipo**, **Draft às cegas** e **Pênaltis sem fim**, um por semana numa vaga fixa "Arcade da semana" | 2–4 dias cada | só Pênaltis (flag nova) |

---

## 1. Modo 2x2

### Como os outros fazem

- **Clash Royale 2v2:** dois jogadores no mesmo lado, cada um com o seu deck, contra outra dupla. Parceiro amigo,
  aleatório ou do clã. Fila casual permanente onde derrota não tira troféu, e eventos com regra especial (draft,
  mega deck). Comunicação só por emote ("vou atacar", "ajuda aqui"). Se um sai, não tem bot (o que acontece com o
  elixir de quem ficou não consegui confirmar em fonte oficial).
- **Hearthstone Battlegrounds Duos:** vida compartilhada, mas cada um com a sua taverna e o seu ouro. O único canal
  entre os dois é o **portal**: passar uma carta pro parceiro por 1 de ouro. Pings fixos (portal, ?, ok, X) em
  qualquer coisa da tela. Fila solo (aleatório de rating parecido), com amigo ou sala privada. Quem foi abandonado
  pode sair sem perder ranking.
- **TFT Double Up:** vida da dupla compartilhada (zera uma vez, volta com 1; zerou de novo, acabou). Dá pra mandar
  campeão e item pro parceiro com recarga, e quem vence a própria luta antes manda reforço pra luta do outro.
- **Brawl Stars / Rocket League:** duplas são fila normal com amigo ou aleatório; nada de especial na divisão,
  porque cada um controla o próprio boneco.

O padrão que serve pra nós: **cada um tem o seu pedaço** (deck, taverna, ouro), existe **um canal pequeno de ajuda**
(portal, canhão) e a conversa é **só ping/emote**. Ninguém divide o mesmo botão.

### O que muda no Soccermon (ponto-chave)

No Soccermon ninguém controla Pokémon: o jogador é o **técnico**. Então "dois no mesmo time" é **dois técnicos no
mesmo time**. Isso é ótimo pro código: as ordens já são por time (`team: 0 | 1` em `TacticChange`, `SubOrder`,
`CornerOrder`, `LineupOrder` e `AgencyOrder`, `src/engine/state.ts`). Pro motor, tanto faz se a ordem do time 0 veio
de um ou de dois navegadores. **Dupla dividindo um time não sobe `ENGINE_VERSION` e não toca na Liga.**

O que hoje está preso em 2 pessoas é a rede:

- `Role = 'host' | 'guest'` e `SIDE` em `src/net/duel-state.ts`; `Peer` por papel; terceiro na sala recebe `full`
  (`session.ts`, linha ~792).
- Lacre e seed por trecho (`src/net/seal.ts`): uma corrente de hashes por lado. Com dupla, o lacre fica com **um
  jogador de cada dupla** (o "líder"); o parceiro só manda ordens. Continua sendo 2 correntes, igual hoje.
- Quem aplica as regras é o host; se ele cai, o convidado assume (`acceptTakeover`). Com 4, precisa de uma **ordem
  de sucessão fixa** (host → líder rival → parceiro do host → parceiro rival).
- Cota do Supabase Realtime (plano grátis): cada broadcast conta 1 envio + 1 por quem recebe. Com 4 na sala cada
  mensagem conta 4 em vez de 2, e há mais gente mandando relógio. Estimativa: ~1.600–2.000 mensagens por partida a
  4x (hoje ~640), ou ~1.000 partidas 2x2 por mês no teto de 2 milhões, dividindo com o Duelo. Cabe, mas é o número
  a vigiar.

O que dá pra mexer durante a partida hoje (as ordens): tática, prancheta (formação e vagas), troca, plano de
escanteio, pedir tempo, goleiro-linha, golpe máximo na batida e ordem dos pênaltis. Isso divide bem em **dois
papéis**:

| Papel | Mexe em | Por que é divertido |
|---|---|---|
| **Técnico** | tática, prancheta, trocas, pedir tempo | pensa o jogo, lê o rival |
| **Capitão** | golpe máximo na batida, plano de escanteio, goleiro-linha, cobradores de pênalti | o momento de reflexo, o lance |

### Opções

#### A. Copa em dupla com parceiro IA (offline)

- **Como funciona:** Copa Relâmpago (ou Rota) com um parceiro IA, que pode ser um treinador desbloqueado (Blue,
  Erika…). O draft alterna: você escolhe, ele escolhe, e ele "pede" coisas com fala curta ("quero um Fogo pra fechar
  a sinergia"). Na partida você escolhe o papel (técnico ou capitão) e a IA faz o outro.
- **Reaproveita:** `aiPick` e `draftOptions` (`src/engine/draft.ts`), o técnico rival (`src/engine/rival-coach.ts`)
  fazendo o papel do parceiro, os sprites e falas de treinador da Rota.
- **Custo:** 3–4 dias. **Risco:** baixo; nada de rede.
- **Ponto de atenção:** regra "nada automático no time do jogador". Aqui o parceiro mexe no seu time, então a
  escolha de chamar um parceiro IA tem que ser explícita, e o papel dele fica claro na tela.
- **Por que primeiro:** ensaia a interface da dupla (draft alternado, pings, papéis) antes de pôr rede no meio.

#### B. Dupla online dividindo um time (por link, com amigo)

- **Como funciona:** sala do Duelo com 4 lugares (Dupla 1 x Dupla 2). Draft: cada um escolhe **metade do time**
  (A: capitão, goleiro, ala e 1 do banco; B: fixo, ala, pivô e 1 do banco), vendo as escolhas do parceiro, com um
  "portal" estilo Duos: **1 troca de carta entre os dois** no draft. Escalação junto (os dois arrastam, a última
  mexida vale). Partida com os papéis Técnico e Capitão, trocando no intervalo se quiserem.
- **Formatos de draft:** os 3 do Duelo continuam valendo (Meu time, Disputa, Cada um com seus pacotes). Na Disputa a
  4, a ordem vira cobra: D1A, D2A, D1B, D2B.
- **Reaproveita:** quase todo o Duelo: `duel-state.ts` (estado, prazos, W.O., melhor de 3), `patch.ts`, `seal.ts`,
  `transport.ts`, a Escalação (`Lineup.tsx`), `MatchHud`, `Prancheta`, emotes, convite com código, QR e WhatsApp,
  login anônimo.
- **Muda:** papéis de 4, presença e `full` com 4, sucessão de quem aplica as regras, pings da dupla (só pro
  parceiro), validação "esta ordem é do seu papel", e muitos testes novos em `duel.test.ts`/`session.test.ts`.
- **Custo:** 8–12 dias. **Risco:** médio. O código do Duelo já tem muita borda (recarregar, aba congelada, host que
  volta); com 4 as combinações dobram. Motor: zero. Liga: zero.
- **Desconexão:** o papel de quem caiu passa pro parceiro (ele vira técnico e capitão). Ninguém vira bot. Caíram os
  dois de uma dupla: as regras de W.O. de hoje.

#### C. Parceiro aleatório (fila)

- **Como funciona:** "Jogar 2x2" sem amigo te põe numa fila; junta 4 e abre a sala. Sem ninguém em 20 s, oferece
  parceiro IA (opção A) contra uma dupla IA, ou continuar esperando.
- **Reaproveita:** B inteiro. A fila pode ser só um canal de presença do Realtime (sem tabela nova, sem migração).
- **Custo:** +4–6 dias em cima de B. **Risco:** depende de público ao mesmo tempo. Com pouca gente, a fila fica
  vazia e a tela vira sala de espera. Vale olhar `npm run stats` antes de decidir.

#### D. Quadra menor de verdade (3x3 ou 2x2, `MatchConfig` novo)

- **Como funciona:** preset novo (`futsal3`: goleiro + 2 na linha, quadra ~28x14), cada jogador traz 1–2 Pokémon.
  Partida mais caótica, golpe de cada um aparece mais.
- **O que já é paramétrico:** `teamSize`, `benchSize`, `pitch` e `withConfig()` em `src/engine/config.ts`;
  `createMatch` confere `teamSize`.
- **O que está preso em 5:** as 6 formações (`src/engine/formations.ts`, todas com 5 vagas), a IA
  (`ai-controller.ts`, cheia de regra por posição GOL/FIXO/ALA/PIVÔ), `agency.ts` (`teamSize = 5` por padrão),
  `match-view.ts` (usa `FUTSAL_5` direto), a cena da quadra no Phaser, os bônus de posição na carta.
- **Custo:** 12–20 dias + rodada de balanceamento com você (posições e fórmula numa quadra nova). **Risco:** alto.
  Partida do `FUTSAL_5` não muda, então `ENGINE_VERSION` não precisaria subir, mas entram hashes novos no teste de
  determinismo. Fora da Liga.

#### E. Cada um controlando um Pokémon (modo jogável)

Fica registrado pra não confundir: é a visão de longo prazo (o `HumanController` existe, mas só em teste). Online
exige latência baixa e o Duelo hoje troca ordens com segundos de antecedência. **Não é pra esta versão.**

### Ranqueado ou casual? Local ou online?

- **Casual primeiro**, como o Clash faz no 2v2 (derrota não tira troféu) e como o Duelo é hoje (amistoso).
  Ranqueado 2x2 pede servidor conferindo 4 drafts e regra de abandono; deixar pra depois da Liga abrir.
- **Local (mesmo celular):** dá pra fazer barato dentro da A: draft passando o celular, na partida um faz técnico e
  o outro capitão na mesma tela. +1 dia. Bom pra jogar com irmão ou amigo do lado.

### Recomendação

**A na mesma versão que B** (A é a base e o "treino" da dupla; B é o 2x2 de verdade com amigo). C só se
`npm run stats` mostrar gente suficiente jogando ao mesmo tempo. D e E ficam pra depois.

---

## 2. Menus: cada modo é um lugar

### A visão do Miguel (25/10/2026)

> "O maior problema dos menus atuais é que falta propósito. Cada menu com uma tela própria: uma tela própria pra
> Rota Índigo, com ambientação e etc; aí você arrasta pro lado ou clica em outro modo mostrado na parte de baixo e a
> tela desliza pra outro 'ambiente' bonitinho animado. O jogo tá ótimo mas super desorganizado, uma bagunça, e não
> tá retendo o povo."

Esse é o eixo desta parte. A barra de abas do Clash é o **como navegar**; os **ambientes** são o **porquê**: cada
tela é um lugar de Kanto com um propósito só, um botão principal e um motivo pra voltar amanhã.

### Diagnóstico (prints a 390x844, save cheio)

O que os prints mostram:

1. **A Home é uma lista de cartões iguais.** Rota, Relâmpago, Duelo e Copa do Dia têm o mesmo painel azul com borda
   amarela. Nada diz "aqui é a estrada até o Planalto Índigo" ou "aqui é o estádio". É isso que o Miguel chama de
   falta de propósito.
2. **A Home tem 2 telas de altura (1.689 px).** A primeira tela mostra só Rota e Relâmpago. Logo, frase e o campo
   "Nome do seu time" ocupam ~350 px antes do primeiro modo.
3. **Duelo e Copa do Dia ficam abaixo da dobra.** Perfil, Coleção e Sala de troféus ficam no fim da 2ª tela, depois
   da fileira "Vem aí" (5 cadeados ocupando uma linha inteira).
4. **Perfil tem 6,6 telas** (1 tela de cartão, depois as 63 missões em lista). A Coleção tem 4,4 (a grade da
   Pokédex). A Sala cabe em 1 tela, mas as seções dela são chips que vazam pra direita.
5. **O Perfil repete as portas** de Sala de troféus e Coleção logo abaixo do cartão.
6. **Dois "voltar" em toda tela de menu:** o logo ("Voltar ao início") e a seta. E o avatar de cima também leva
   ao Perfil.
7. **Duelo: 4 escolhas antes de criar a sala** (modo, velocidade, duração, número de jogos), e na primeira visita um
   balão de tour por cima. Na Home e no Duelo o balão do tour bloqueia o resto da tela até ser fechado (o robô do
   teste travou nele).
8. **O que já tem ambiente funciona:** o mapa da Rota (faixas de Rota 1, Floresta de Viridian, Mt. Moon, com o Prof.
   Carvalho falando) e a Sala de troféus (o quarto à noite) são as telas com mais cara de jogo. O Mercado tem uma
   ação clara e o **Seguir** fixo embaixo, na zona do polegar. É o padrão que falta no resto.

Toques a partir da Home (celular em pé):

| Destino | Hoje | Com ambientes e barra |
|---|---|---|
| Nova Rota / nova Relâmpago | 1 | 1 (deslizar até o ambiente e tocar no botão principal, ou 1 se for o centro) |
| Continuar copa | 1 (cartão "Copa em andamento") | 1 (o centro sempre mostra) |
| Copa do Dia | rolar 1 tela + 1 | 1 (fica no placar do Estádio) |
| Duelo (até mandar o link) | rolar + 1 + 4 escolhas + Criar sala | 2 (aba Arena + Criar sala com o padrão marcado) |
| Perfil | 1 (avatar) ou rolar 2 telas + 1 | 1 (aba Sede) |
| Pokédex | rolar 2 telas + 1 | 1 (aba Laboratório) |
| Álbum / Golpedex | rolar 2 telas + 2 | 2 |
| Medalhas | rolar 2 telas + 2 | 2 |
| Missões | 1 + rolar ~1 tela | 2 (quadro de avisos da Sede) |
| Notas da versão | rolar até o rodapé + 1 | 2 (engrenagem → Sobre) |

### Referências: hub por ambiente

- **Clash Royale:** barra fixa embaixo com 5 telas lado a lado (Loja, Cartas, Batalha, Social, Eventos), dá pra
  deslizar o dedo entre elas e abre sempre na do meio. Batalha é o botão maior, no centro, ao alcance do polegar.
  Baús e recompensas à vista. Quase nada passa de 1 nível; janelas fecham tocando fora. E o principal pra nós: **a
  tela de Batalha mostra a sua arena**, e cada arena tem tema próprio (Estádio dos Goblins, Fosso dos Ossos, Arena
  da Selva…) liberado por troféus. O fundo é o seu progresso.
- **Brawl Stars:** a Home mostra o seu brawler parado no cenário e um botão Jogar amarelo enorme; o seletor de modo
  fica do lado do Jogar. A crítica de UX da Pratt aponta o problema contrário ao nosso: botão demais em volta.
- **Pokémon (as cidades):** cada cidade tem cor, música e função (Centro, Mart, ginásio). O Centro Pokémon é igual em
  todo lugar (mesma função, mesmo balcão) e a cidade em volta muda. É o modelo: **função fixa, ambiente próprio**.
- **Menus diegéticos** (Hearthstone com a caixa de madeira, o Pip-Boy do Fallout, mesas e escritórios como menu):
  o menu é um objeto do mundo. Funciona quando a ação principal continua óbvia; vira bagunça quando tudo é objeto
  clicável sem rótulo. Por isso cada ambiente aqui tem **um botão grande com texto**, e o cenário é fundo.
- **Thumb zone** (Hoober/Smashing): ação principal no terço de baixo, navegação embaixo.

Adaptado pro Soccermon: **não temos loja nem baú** (ADR 0006, sem dinheiro nenhum). O "baú à vista" vira o
**próximo desbloqueio** (o próximo treinador ou título, "Treinador Ás: 3/5 copas"), a **sequência da Copa do Dia**
(os quadradinhos S T Q Q S S D que já existem em `src/store/daily.ts`) e o **progresso da Pokédex**.

### Brainstorm: os ambientes

#### A barra e a ordem

```
 ← desliza →
┌────────┬────────┬────────┬────────┬────────┐
│ Labora-│  Rota  │ ESTÁDIO│ Arena  │  Sede  │
│ tório  │ Índigo │ (maior)│        │do clube│
└────────┴────────┴────────┴────────┴────────┘
 Coleção   modo     entrada  Duelo,   Perfil,
           longo    Relâmp.  2x2,     Sala de
                    + Dia    Arcade,  troféus,
                             Liga     Clube
```

- **Centro (tela de entrada): o Estádio.** É onde está o jogo rápido (Relâmpago), o "continuar copa" de qualquer
  modo e a meta do dia (Copa do Dia no placar). Quem abre o jogo pela primeira vez cai nele e joga em 1 toque, como
  o funil da 0.9.18 já quer.
- **Esquerda = o que é seu de longo prazo** (Laboratório: coleção; Rota: a campanha). **Direita = os outros**
  (Arena: amigos e rivais; Sede: o seu clube e o que você ganhou).
- Ícones desenhados (o kit `HudIcon` e SVG), rótulo sempre embaixo do ícone, alvo de 44 px, pontinho de novidade
  por aba (já existe: `NEWS_DOORS` em `src/store/news.ts`).
- A barra **some dentro da copa e da partida** (como no Clash na batalha). Dentro da copa, as telas de passagem
  (draft, escalação, mercado) também ganham ambiente (lista no fim).

#### 1. Estádio (centro): Copa Relâmpago e Copa do Dia

```
┌──────────────────────────────┐
│ Pallet FC      121/151 [engr]│
│  ▓▓▓ PLACAR ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  placar eletrônico:
│  COPA DO DIA  S T Q · · · ·  │  sequência da semana
│  [ Jogar hoje ]              │
│ ░░░ arquibancada (torcida) ░░│
│   ═══ quadra vista do túnel ═│
│        (capitão quicando)    │
│  ┌────────────────────────┐  │
│  │ Copa em andamento  >   │  │  (só se tiver)
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  NOVA COPA RELÂMPAGO   │  │  botão principal
│  └────────────────────────┘  │
│  Próximo: Treinador Ás 3/5   │
├──────┬──────┬──────┬──────┬──┤
```

- **A tela:** a boca do túnel do vestiário olhando pra quadra; arquibancada com a torcida (sprites pequenos
  balançando), refletores; o seu capitão quicando a bola no meio. Em cima, o placar eletrônico com a Copa do Dia. A
  torcida e a faixa levam a cor do clube.
- **Propósito:** jogar agora. Partida rápida e a meta do dia.
- **Botão principal:** Nova copa (ou Continuar, se tiver uma aberta).
- **Retenção:** placar com a sequência da semana (vontade de não quebrar), "Próximo desbloqueio" com barra, e o
  estádio cresce com as copas ganhas (quadra de escola → ginásio → arena), como as arenas do Clash.
- **Reaproveita:** `HomeCourt` (a quadrinha da Home), o cartão da Copa do Dia (`HomeDailyCard`) e a sequência
  (`dailyStreak`), sprites PMD da quadra, a cor do clube do Perfil.
- **Custo:** 3–4 dias (arte da cena em camadas + tela).

#### 2. Rota Índigo: a estrada de Kanto

```
┌──────────────────────────────┐
│  ROTA ÍNDIGO     insígnias   │
│  ○ ○ ● ○ ○ ○ ○ ○             │  8 insígnias, as ganhas acesas
│  ~~ mapa de Kanto em pixel ~~│
│  Pallet ─ Viridian ─ Pewter  │
│     \        (você aqui)     │  o seu time andando na trilha
│   Cerulean ─ ... ─ Planalto  │
│  [Carvalho]: "Já pensou em   │
│   encarar a Misty?"          │
│  ┌────────────────────────┐  │
│  │  CONTINUAR: MT. MOON   │  │  ou "Começar a Rota"
│  └────────────────────────┘  │
├──────┬──────┬──────┬──────┬──┤
```

- **A tela:** o mapa de Kanto (traço FireRed), com as cidades dos 8 ginásios, a trilha até o Planalto e o seu time
  (3 sprites) parado onde você parou. Os líderes já vencidos aparecem na porta do ginásio; os outros, em silhueta.
- **Propósito:** a campanha. "Onde eu parei e quem vem agora."
- **Botão principal:** Começar a Rota / Continuar (com o nome do trecho).
- **Retenção:** progresso visível (insígnias, o time andando no mapa), o próximo líder sempre com nome e rosto, e a
  fala do Carvalho mudando com o momento.
- **Reaproveita:** o mapa da copa longa (`CupMap.tsx`, `long-cup.css`, as faixas de região), os sprites dos líderes
  (`GYM_LEADERS`, `public/assets/trainers`), a caixa de fala do Carvalho e as falas de `docs/planos/rota-textos.md`.
- **Custo:** 3–5 dias (o mapa de Kanto inteiro é arte nova; o resto existe).

#### 3. Arena: Duelo, 2x2, Arcade e Liga

```
┌──────────────────────────────┐
│   ARENA          [código?]   │
│ ▒▒ quadra à noite, 2 lados ▒▒│
│ [seu capitão]  VS  [ ? ]     │  luz na cor de cada time
│                              │
│  ┌──────────┐ ┌──────────┐   │
│  │ DUELO 1x1│ │ DUPLA 2x2│   │
│  └──────────┘ └──────────┘   │
│  ARCADE DA SEMANA: Monotipo  │  cartaz de neon
│  [ Jogar ]                   │
│  LIGA  abre em 37 dias       │
├──────┬──────┬──────┬──────┬──┤
```

- **A tela:** uma quadra de rua à noite, dividida ao meio; o seu capitão de um lado, uma silhueta do outro
  ("quem vai encarar?"). Do lado, um cartaz de neon de fliperama com o Arcade da semana (homenagem ao Game Corner
  de Celadon).
- **Propósito:** jogar contra gente e coisa diferente.
- **Botão principal:** Criar sala (Duelo) com as regras recolhidas; 2x2 e Arcade como cartões grandes.
- **Retenção:** Arcade novo toda segunda, "Fulano te desafiou" aparece aqui (a silhueta vira o avatar dele), recorde
  da semana no cartaz, contagem da Liga.
- **Reaproveita:** a tela do Duelo inteira (`src/ui/duel/`), a arte do VS (cartas 25 e 133 da Home), o desafio de
  amigo (`FriendChallenge`), a Liga (`Liga.tsx`, ainda fechada).
- **Custo:** 2–3 dias.

#### 4. Laboratório do Carvalho: Coleção

```
┌──────────────────────────────┐
│  LABORATÓRIO     121/151     │
│ [estante][estante][máquina]  │  estantes cheias conforme
│   ▯▯▯▯▯    ▯▯▯     (PC)      │  a Pokédex enche
│      mesa com a Pokédex      │
│  [Pokédex] [Álbum] [Golpedex]│  3 objetos grandes, com nome
│  "Faltam 30. Nesta semana    │
│   aparecem mais do tipo Água"│
├──────┬──────┬──────┬──────┬──┤
```

- **A tela:** o laboratório de Pallet: estantes, a mesa com a Pokédex, o PC. As estantes vão enchendo de livros e
  pokébolas conforme a Pokédex cresce; o álbum de figurinhas aberto na mesa.
- **Propósito:** completar a coleção.
- **Botão principal:** abrir a Pokédex; Álbum e Golpedex como os outros dois objetos.
- **Retenção:** a dica de "o que falta e onde achar" (casa com a Semana do tipo), contador grande, platina à vista.
- **Reaproveita:** a Coleção inteira (`Collection.tsx`, Pokédex, Álbum, Golpedex), o Carvalho da Rota, o kit de
  móveis já no projeto (Modern Interiors da LimeZu em `public/assets/room/mi`, KayKit em `room/kaykit`).
- **Custo:** 2–3 dias.

#### 5. Sede do clube: Perfil, Sala de troféus, Clube e Amigos

```
┌──────────────────────────────┐
│  SEDE DO PALLET FC   nível 2 │
│ ▒ a sala de troféus (cena) ▒ │  o quarto que já existe
│  [vitrine][vitrine][quadro]  │
│      (seu Pokémon andando)   │
│  ┌──────────┐ ┌──────────┐   │
│  │ Treinador│ │  Clube   │   │  escudo, uniforme, faixa
│  └──────────┘ └──────────┘   │
│  [Quadro de missões 19/63]   │
│  [Amigos 3 online]           │
├──────┬──────┬──────┬──────┬──┤
```

- **A tela:** a Sala de troféus que já existe vira a sede do clube (o nível da sala já sobe de quarto do Red →
  sede → vestiário do estádio). Na parede: o escudo e a camisa do clube, o quadro de missões, o mural de amigos.
- **Propósito:** quem eu sou e o que eu ganhei, num lugar só. Junta o Perfil (hoje 6,6 telas) e a Sala.
- **Botão principal:** não tem jogar; cada móvel abre a sua seção (como a sala faz hoje), com nome embaixo.
- **Retenção:** a sala muda de nível com os títulos, a medalha mais perto de sair fica à vista, missões viram um
  quadro com 3 em destaque em vez de lista de 63.
- **Reaproveita:** `TrophyRoom.tsx`, `TrophyRoomScene.ts` (Phaser, luz 2D) ou o canvas de `RoomScene.tsx`, o
  Perfil (`Profile.tsx`: Treinador, Clube, Amigos), `doors.ts` pros links antigos.
- **Custo:** 3–4 dias (juntar Perfil e Sala é mais mudança de tela que arte).

#### Dentro da copa (sem barra)

| Tela | Ambiente | Reaproveita | Custo |
|---|---|---|---|
| Draft | a peneira: os 3 Pokémon chegando pela lateral da quadra de treino | cartas e `Draft.tsx` | 1–2 dias |
| Escalação | o vestiário: a prancheta na parede, armários com os nomes | `Lineup.tsx`, `Prancheta` | 1–2 dias |
| Mercado | o Poké Mart: balcão, vendedor, cartas na vitrine | `Shop.tsx` | 1–2 dias |
| Evento, Treino, Baú | as casas do mapa da Rota, cada uma com o fundo da região | `CupMap.tsx` | 1 dia cada |
| Ginásio | a porta do ginásio do líder antes do VS | sprites dos líderes | 1 dia |

### Navegação entre ambientes

- **Trocar de aba (tocar ou arrastar):** a tela desliza de lado em **250–300 ms**, com o fundo em 3 camadas andando
  em velocidades diferentes (céu devagar, cenário médio, botões junto do dedo). Arrastar acompanha o dedo e solta
  pro lado mais perto. É a regra do ADR 0004 (nada teleporta) do jeito que o Miguel descreveu.
- **Entrar num modo** (tocar em Nova copa, Começar a Rota): aí vale uma transição **mais longa e com cara de
  cinema, 600–900 ms**: a câmera anda pelo túnel até a quadra, ou o time dá o primeiro passo na estrada. Toque
  pula. É um "evento grande" no sentido das regras de design, mas é exceção aos 200–300 ms do ADR 0004 e precisa do
  seu ok.
- **Reduzir movimento:** sem paralaxe nem câmera; troca por fade de 200 ms.
- **Celular deitado (844x390):** a barra vira coluna estreita à esquerda. **Desktop:** a barra fica embaixo,
  centralizada, e os ambientes ocupam a coluna central com o cenário se estendendo dos lados.

### A parte técnica que pesa

- **Phaser fora da primeira carga** (Armadilhas do CLAUDE.md): a Home não pode importar `phaser`. Então os ambientes
  são **camadas de pixel art (PNG) com CSS** (paralaxe, sprites animados por `steps()`), como a `HomeCourt` já faz.
  Phaser só onde já está (partida e sala de troféus, carregado na hora).
- **Peso:** cada ambiente carrega a arte quando a aba fica vizinha da atual (o Estádio vem na primeira carga, o
  resto depois). Meta: o Estádio com menos de ~150 KB de arte.
- **Arte é o custo de verdade.** Direção sugerida: o traço FireRed (16 px, contorno escuro) que já está na sala e
  nos treinadores, com os Pokémon em sprite PMD. Nada copiado de tile de jogo; desenhado por nós ou dos kits que já
  estão no projeto (LimeZu, KayKit).

### Como isso ajuda a reter

| Gancho | Onde mora | O que já existe |
|---|---|---|
| Meta diária | placar do Estádio (Copa do Dia + sequência) | `dailyStreak`, texto estilo Wordle |
| Progresso visível | insígnias e o time andando no mapa da Rota; estantes do Laboratório; nível da Sede | `CupMap`, Pokédex, nível da sala |
| Próxima recompensa | "Próximo: Treinador Ás 3/5" no Estádio; medalha mais perto na Sede | missões e medalhas |
| Novidade semanal | Arcade da semana no cartaz da Arena, Semana do tipo no Laboratório | Semana do tipo |
| Social | "Fulano te desafiou" na Arena, amigos online na Sede | amigos, desafio por link |
| Saber onde está cada coisa | um lugar, um propósito, um botão | (é o que falta hoje) |

### Caminhos pra chegar lá

| Caminho | O que é | Custo | Risco |
|---|---|---|---|
| **1. Faxina** | Home única: logo menor, seletor de modo e um JOGAR grande na 1ª tela, portas sobem, nome do time sai da Home, "Vem aí" vira uma linha | 2–3 dias | baixo; não resolve o "sem propósito" |
| **2. Barra de abas, telas simples** | A barra de 5 abas e o deslize, cada aba com fundo de cor e ícone grande, sem cenário ainda | 6–9 dias | médio |
| **3. Ambientes (a visão do Miguel, recomendado)** | O caminho 2 + um ambiente por aba, em etapas: Estádio e Rota primeiro, depois Arena, Laboratório e Sede, e por último as telas de dentro da copa | 6–9 dias (barra) + 13–19 dias (5 ambientes) + 6–9 dias (dentro da copa) | médio-alto, mas cada etapa já sai melhor que hoje |

**Recomendação: caminho 3 em etapas.** Primeira entrega: a barra + **Estádio** (centro) + **Rota**, atrás de bandeira
(`?lab=ambientes`) pra você arrastar no celular antes de trocar a Home. As outras 3 abas entram primeiro como telas
simples (caminho 2) e ganham o ambiente uma por versão, o que casa com o ritmo de "versões menos frequentes e
polidas, trailerzinho por versão": cada ambiente novo é um trailerzinho pronto.

---

## 3. Modos arcade

Referências do formato: Rocket League tem duas playlists "Arcade" no casual que trocam toda semana (Heatseeker,
Spike Rush, Dropshot, Snow Day…); o Hearthstone tem a Taverna (regra nova toda quarta, casual); o Clash tem eventos
(Draft triplo, Morte súbita, Espelho); o EA FC tem as Regras da Casa (Bola misteriosa, Sem regras, Gol de longe vale
dobro, Sobrevivência); o Slay the Spire tem a Escalada diária (mesma seed pra todo mundo, 3 modificadores, placar);
o Hades tem o Pacto (você escolhe a dificuldade e ganha mais); o Wordle viralizou pela grade que se posta sem
spoiler.

O que funciona em todos: **uma regra só, com nome**, que muda o que é "bom", e **rotação** (volta depois, dá
saudade). Proposta de formato: **uma vaga fixa "Arcade da semana"** no cartaz de neon da Arena, trocando toda segunda, junto da
"Semana do tipo" que já existe.

| # | Modo | Regra em 1 linha | Por que diverte / viraliza | Custo | Motor? |
|---|---|---|---|---|---|
| 1 | **Monotipo** | Copa sem fim só com Pokémon do tipo da semana: vai até perder | "fui até 9 vitórias com time só de Inseto" é post pronto; casa com a Semana do tipo | 2–3 dias | não (filtro no draft) |
| 2 | **Draft às cegas** | As cartas vêm viradas (só tipo e posição); a nota aparece na escalação | a revelação dá clipe ("tirei um Magikarp de pivô"); zero balanceamento | 1–2 dias | não |
| 3 | **Pênaltis sem fim** | Seu time cobra e defende contra a IA em morte súbita até errar | 1 minuto por tentativa, recorde fácil de comparar, ótimo pro TikTok | 3–4 dias | sim: flag nova "só pênaltis" (não muda partida normal) |
| 4 | **Mata-mata de capitães** | A cada partida você escolhe só o capitão (1 de 3) e o resto do time é sorteado; perdeu, acabou | partida atrás de partida sem draft longo; "quantos capitães você aguenta?" | 2 dias | não |
| 5 | **Espelho** | Os dois times iguais (no Duelo ou contra a IA): só a tática e a escalação decidem | mostra que a tática importa; bom no Duelo entre amigos | 2 dias | não |
| 6 | **Chefão** | Seu time da copa contra um time absurdo (5 lendários, Mewtwo capitão) com prêmio por gol marcado | "segurei o Mewtwo no 0 a 0"; casa com a Rota | 2–3 dias | não (time pronto) |
| 7 | **Morte súbita** | Copa Relâmpago onde o primeiro gol acaba a partida | partidas de 30 s, tensão do começo ao fim | 2 dias | sim: flag nova (fim no 1º gol) |
| 8 | **Caos** | Golpes recarregam no dobro da velocidade e o golpe máximo enche mais rápido | é o "diversão > realismo" no máximo; golaço toda hora | 3–5 dias | sim: flags novas; números com você antes |
| 9 | **Só ouro / só bronze** | Draft só com cartas de uma faixa (75+ ou ≤64) | bronze vira desafio e piada ("o time dos Rattata"); ouro é festa | 1–2 dias | não |
| 10 | **Pacto do Carvalho** | Antes da copa você liga castigos (rival +5, sem banco, 1 troca só…); cada um soma pontos de medalha | dificuldade escolhida pelo jogador, igual o Pacto do Hades; o veterano tem o que fazer | 4–6 dias | não (usa regras de copa) |

Sobre motor nos marcados com "sim": são flags novas no `MatchConfig` (ou na copa), desligadas no `FUTSAL_5`. Partida
normal, Duelo e Liga continuam com o mesmo resultado, então o `ENGINE_VERSION` não precisa subir (confirmar com o
teste de determinismo, que ganha hashes novos pras flags). Modo arcade fica atrás de bandeira até ser jogado na tela
(ADR 0005).

**As 3 melhores pra começar:** Monotipo (identidade Pokémon pura, casa com a Semana do tipo), Draft às cegas (o mais
barato e o mais "clipável") e Pênaltis sem fim (curtíssimo, recorde, perfeito pro TikTok). A Copa do Dia já tem o
compartilhar estilo Wordle (`src/store/daily.ts`): o modelo serve pro recorde de qualquer arcade.

---

## Decisões aprovadas (25/10/2026)

O Miguel aprovou as 20 decisões abaixo com as recomendações:

- **2x2 (1–7):** parceiro IA e amigo por link juntos; Técnico e Capitão trocando no intervalo; cada um escolhe metade
  do time com 1 troca de carta; chamar o parceiro IA é exceção aceita ao "nada automático"; casual; fila aleatória
  depois; 2x2 no mesmo celular entra (+1 dia).
- **Menus (8–16):** ambientes em etapas. Barra Laboratório | Rota | **Estádio** (centro, entrada) | Arena | Sede.
  Perfil e Sala de troféus juntos na Sede; Arcade e 2x2 na Arena. Entrar num modo leva 600–900 ms e um toque pula
  (exceção registrada no [ADR 0008](../adr/0008-entrada-de-modo-mais-longa.md)). Arte no traço FireRed com Pokémon
  PMD. Primeira entrega: barra + Estádio + Rota em `?lab=ambientes`, o resto como tela simples. Nome do time sai da
  Home. Duelo com as regras recolhidas.
- **Arcade (17–19):** vaga fixa "Arcade da semana" trocando toda segunda; começar por Monotipo, Draft às cegas e
  Pênaltis sem fim; modo que mexe no motor só com os números antes/depois na frente dele.
- **Ordem (20):** menus, depois arcade, depois 2x2.

Primeira entrega feita na branch `ambientes` (`src/ui/ambientes/`): barra de 5 abas, arrasto com fundo em camadas,
Estádio e Rota Índigo com ambiente, Laboratório, Arena e Sede como telas simples que levam às de hoje.

## Decisões pro Miguel

1. **2x2:** fazer A (parceiro IA) + B (amigo por link) juntos **(recomendado)** / só A agora / só B / ir direto pra
   D (quadra menor, mexe no motor).
2. **Papéis na dupla:** Técnico (tática, prancheta, trocas) e Capitão (golpe máximo, escanteio, goleiro-linha,
   pênaltis), trocando no intervalo **(recomendado)** / os dois mexem em tudo (última ordem vale) / cada um só nos
   seus Pokémon.
3. **Draft da dupla:** cada um escolhe metade do time e tem 1 troca de carta com o parceiro (o "portal")
   **(recomendado)** / alternado sem troca / um monta, o outro só escala.
4. **Parceiro IA mexendo no seu time** é exceção aceitável à regra "nada automático", desde que você escolha chamar
   ele **(recomendado)** / não: parceiro IA só sugere, você confirma.
5. **2x2 casual** (sem ranking) **(recomendado)** / com ranking já.
6. **Parceiro aleatório (fila):** depois, se `npm run stats` mostrar gente jogando ao mesmo tempo **(recomendado)** /
   já nesta versão.
7. **2x2 no mesmo celular** (sofá), +1 dia **(recomendado)** / não.
8. **Menus:** caminho 3, ambientes em etapas (a sua visão) **(recomendado)** / caminho 2, só a barra com telas
   simples / caminho 1, faxina.
9. **Ordem da barra:** Laboratório, Rota, **Estádio (centro, tela de entrada)**, Arena, Sede **(recomendado)** /
   Rota no centro / outra ordem.
10. **Juntar Perfil e Sala de troféus na Sede do clube** (o Perfil de 6,6 telas some) **(recomendado)** / Perfil e Sala
    continuam separados (aí são 6 abas, ou o Laboratório entra na Sede).
11. **Arcade e 2x2 morando na Arena** (cartaz de neon do Arcade da semana) **(recomendado)** / Arcade com aba própria.
12. **Transição pra entrar num modo** com 600–900 ms cinematográficos (exceção ao ADR 0004, toque pula)
    **(recomendado)** / tudo em 200–300 ms.
13. **Arte dos ambientes:** traço FireRed (16 px, contorno escuro, o da sala e dos treinadores) com Pokémon PMD
    **(recomendado)** / outra direção (ver um ambiente de teste antes).
14. **Primeira entrega:** barra + Estádio + Rota em `?lab=ambientes`, o resto como tela simples e um ambiente por
    versão **(recomendado)** / tudo de uma vez.
15. **Nome do time sai da Home** (vai pra Escalação e Sede) **(recomendado)** / fica no Estádio.
16. **Duelo com regras recolhidas** (Criar sala já com Disputa, 4x, normal, 1 jogo) **(recomendado)** / manter as 4
    escolhas abertas.
17. **Arcade:** uma vaga fixa "Arcade da semana" trocando toda segunda **(recomendado)** / todos os modos sempre
    abertos numa lista.
18. **Primeiros modos arcade:** Monotipo, Draft às cegas e Pênaltis sem fim **(recomendado)** / outra escolha da lista
    (diga os números).
19. **Modos que mexem no motor** (Pênaltis, Morte súbita, Caos) só com os números antes/depois na sua frente, pela
    skill de balanceamento **(recomendado)** / deixar esses de fora.
20. **Ordem das frentes:** menus primeiro (dão casa pro resto), depois arcade, depois 2x2 **(recomendado)** / 2x2
    primeiro.

## Fontes

2x2 e jogos em dupla
- Clash Royale 2v2 (guia de terceiros): https://www.clashroyaletactics.net/can-you-2v2-in-clash-royale
- Clash Royale 2v2 nos desafios: https://www.sportskeeda.com/esports/2v2-battles-clash-royale-all-need-know
- Reclamação de fãs sobre quem sai no 2v2: https://clashroyale.fandom.com/f/p/3301901307216103860
- Hearthstone Battlegrounds Duos: https://hearthstone.wiki.gg/wiki/Duos
- Notas do lançamento do Duos (29.2): https://hearthstone.blizzard.com/en-us/news/24077473/29-2-patch-notes
- TFT Double Up (suporte da Riot): https://support.riotgames.com/en-us/tft/account/tft-double-up
- Guia do Double Up: https://mobalytics.gg/blog/tft/tft-duo-mode-double-up-guide-strategy/
- Brawl Stars Duo Showdown: https://gamewith.net/brawlstars/article/show/2227

Menus e navegação
- Análise de UX do Clash Royale: https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/
- Clash Royale, atualização de verão 2022 (Home e Perfil novos): https://supercell.com/en/games/clashroyale/blog/release-notes/clash-royale-summer-update-2
- Clash of Clans, interface refeita: https://supercell.com/en/games/clashofclans/blog/news/weve-revamped-the-clash-of-clans-user-interface/
- Análise acadêmica da UI do Clash Royale: https://binus.ac.id/bekasi/2025/03/analysis-towards-ui-ux-of-clash-royale-towards-the-gameplay/
- Thumb zone: https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users
- Barra de navegação embaixo: https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/
- Menu principal do Brawl Stars: https://samurai-gamers.com/brawl-stars/main-menu-guide/
- Crítica de UX do Brawl Stars (Pratt): https://ixd.prattsi.org/2025/02/design-critique-brawl-stars/
- Arenas do Clash Royale, cada uma com tema: https://www.sportskeeda.com/esports/all-arenas-in-clash-royale-what-new-cards-unlock e https://mobi.gg/en/tips/clash-royale-arenas-guide/
- Interfaces diegéticas (menu como objeto do mundo): https://www.wayline.io/blog/diegetic-interfaces-game-design

Modos arcade e rotativos
- Clash Royale, eventos de 2026: https://www.sportsdunia.com/gaming/clash-royale-august-events-2026
- Clash Royale, eventos e desafios: https://destructoid.com/clash-royale-september-2024-roadmap-all-events-and-challenges
- Clash Royale, Draft triplo: https://www.sportskeeda.com/esports/clash-royale-triple-draft-tournament-details-rewards
- Rocket League, playlists Arcade no menu: https://rocketleague.com/news/first-look-play-menu-changes-coming-to-rocket-league
- Rocket League, Rumble: https://www.epicgames.com/help/rocket-league-c-202300000001622/gameplay-c-202300000001682/what-is-rumble-mode-in-rocket-league-a202300000014075
- Rocket League, Heatseeker: https://upcomer.com/rocket-league-introduces-new-temporary-mode-heatseeker/
- Rocket League, modos especiais de maio: https://upcomer.com/rocket-league-sees-special-modes-return-in-modes-of-may
- Brawl Stars (Map Maker e rotação): https://en.wikipedia.org/wiki/Brawl_Stars e https://mobilematters.gg/brawl-stars/brawl-stars-map-rotation-guide
- EA FC, Regras da Casa: https://fifauteam.com/fc-27-kick-off/ e https://www.fifplay.com/encyclopedia/kick-off-mode/
- Slay the Spire, Escalada diária: https://kotaku.com/slay-the-spires-daily-challenges-keep-getting-better-1823780588 e https://slaythespire.wiki.gg/wiki/Custom_Mode
- Hades, Pacto: https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards
- Balatro, seeds: https://www.destructoid.com/best-balatro-seeds/
- Wordle, por que viralizou: https://www.smithsonianmag.com/smart-news/heres-why-the-word-game-wordle-went-viral-180979439/
- Hearthstone, Taverna: https://hearthstone.wiki.gg/wiki/Tavern_Brawl e https://gamesradar.com/hearthstone-tavern-brawls-mode
