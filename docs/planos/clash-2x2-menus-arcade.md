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
| Menus | **Caminho 2: barra de abas embaixo com Jogar no centro**, deslizando de lado | 6–9 dias | não |
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

## 2. Menus estilo Clash Royale

### Diagnóstico (prints a 390x844, save cheio)

O que os prints mostram:

1. **A Home tem 2 telas de altura (1.689 px).** A primeira tela mostra só Rota e Relâmpago. Logo, frase e o campo
   "Nome do seu time" ocupam ~350 px antes do primeiro modo.
2. **Duelo e Copa do Dia ficam abaixo da dobra.** Perfil, Coleção e Sala de troféus ficam no fim da 2ª tela, depois
   da fileira "Vem aí" (5 cadeados ocupando uma linha inteira).
3. **Perfil tem 6,6 telas** (1 tela de cartão, depois as 63 missões em lista). A Coleção tem 4,4 (a grade da
   Pokédex). A Sala cabe em 1 tela, mas as seções dela são chips que vazam pra direita.
4. **O Perfil repete as portas** de Sala de troféus e Coleção logo abaixo do cartão.
5. **Dois "voltar" em toda tela de menu:** o logo ("Voltar ao início") e a seta. E o avatar de cima também leva
   ao Perfil.
6. **Duelo: 4 escolhas antes de criar a sala** (modo, velocidade, duração, número de jogos), e na primeira visita um
   balão de tour por cima. Na Home e no Duelo o balão do tour bloqueia o resto da tela até ser fechado (o robô do
   teste travou nele).
7. **Mercado e mapa da Rota estão bem:** são telas de dentro da copa, com uma ação clara e o botão **Seguir** fixo
   embaixo, na zona do polegar. É o padrão que falta no resto.

Toques a partir da Home (celular em pé):

| Destino | Hoje | Com barra de abas (caminho 2) |
|---|---|---|
| Nova Rota / nova Relâmpago | 1 | 1 |
| Continuar copa | 1 (cartão "Copa em andamento") | 1 |
| Copa do Dia | rolar 1 tela + 1 | 1 (seletor de modo) ou 1 deslize |
| Duelo (até mandar o link) | rolar + 1 + 4 escolhas + Criar sala | 2 (Duelo + Criar sala com o padrão já marcado) |
| Perfil | 1 (avatar) ou rolar 2 telas + 1 | 1 |
| Pokédex | rolar 2 telas + 1 | 1 |
| Álbum / Golpedex | rolar 2 telas + 2 | 2 |
| Medalhas | rolar 2 telas + 2 | 2 |
| Missões | 1 + rolar ~1 tela | 2 (aba própria) |
| Notas da versão | rolar até o rodapé + 1 | 2 (Perfil → engrenagem/sobre) |

### O que o Clash faz

- **Barra fixa embaixo com 5 telas lado a lado** (Loja, Cartas, Batalha, Social/Clã, Eventos), e dá pra deslizar o
  dedo entre elas. Abre sempre na do meio.
- **Batalha é o botão maior, no centro, na metade de baixo**, ao alcance do polegar com uma mão.
- **Baús e recompensas sempre à vista** na tela de batalha: você sabe o que vem a seguir sem abrir menu.
- **Quase nada passa de 1 nível.** Janelas não ocupam a tela toda e fecham tocando fora.
- **Cartas e ícones grandes**, pouco texto.
- O Clash refez a Home e o Perfil em 2022 (o Perfil virou "Social"); o Clash of Clans fez o mesmo depois.
- Thumb zone (Hoober/Smashing): a ação principal no terço de baixo da tela, navegação embaixo e não em cima.

Adaptado pro Soccermon: **não temos loja nem baú** (ADR 0006, sem dinheiro nenhum). O equivalente do "baú à vista" é o
**próximo desbloqueio**: o próximo treinador ou título ("Treinador Ás: 3/5 copas"), a Copa do Dia de hoje e o
progresso da Pokédex.

### Caminho 1: Faxina com botão de jogar (pequeno)

Mantém uma Home só, sem barra, mas o principal cabe na 1ª tela.

```
┌──────────────────────────────┐
│ [?]          [engr] [avatar] │
│      SOCCERMON (menor)       │
│  ┌────────────────────────┐  │
│  │ Copa em andamento      │  │  (só se tiver)
│  └────────────────────────┘  │
│  < Rota | Relâmpago | Dia | Duelo >   seletor de modo
│  ┌────────────────────────┐  │
│  │   JOGAR  Rota Índigo   │  │  botão grande, polegar
│  └────────────────────────┘  │
│ Próximo: Treinador Ás 3/5    │
│ [Perfil] [Coleção] [Sala]    │  3 portas em linha
└──────────────────────────────┘
  rolando: Vem aí (1 linha pequena), rodapé
```

- **Muda:** nome do time sai da Home (vai pra Escalação e Perfil); logo e quadra menores; 4 modos num seletor
  (deslizar ou tocar) com um botão JOGAR só; portas sobem pra 1ª tela; "Vem aí" vira uma linha pequena; Perfil para
  de repetir as portas; o logo deixa de ser "voltar".
- **Custo:** 2–3 dias. **Risco:** baixo. Não resolve as telas longas (Perfil 6,6 telas).

### Caminho 2: Barra de abas embaixo, Jogar no centro (recomendado)

```
┌──────────────────────────────┐
│ Pallet FC  ·  121/151  [engr]│  topo fino: time, Pokédex
│                              │
│      (quadra + logo)         │
│  ┌────────────────────────┐  │
│  │ Copa em andamento  >   │  │
│  └────────────────────────┘  │
│  < Rota | Relâmpago | Dia >  │
│  ┌────────────────────────┐  │
│  │        JOGAR           │  │
│  └────────────────────────┘  │
│  Próximo: Treinador Ás 3/5   │
├──────┬──────┬──────┬──────┬──┤
│Coleç.│Arcade│ JOGAR│ Sala │Eu│  barra fixa, ícones grandes
└──────┴──────┴──────┴──────┴──┘
```

As 5 abas (deslizar de lado troca de aba, como no Clash):

| Aba | O que tem | Vem de |
|---|---|---|
| **Coleção** | Pokédex, Álbum, Golpedex (abas de cima, como hoje) | porta Coleção |
| **Arcade** | Duelo (e 2x2), Copa do Dia, o Arcade da semana, Liga quando abrir, "Vem aí" no fim | cartões do Duelo e do Dia, fileira Vem aí |
| **Jogar** (centro, abre aqui) | continuar copa, seletor Rota/Relâmpago, JOGAR, próximo desbloqueio | Home |
| **Sala** | Sala de troféus como hoje (quarto + Troféus, Medalhas, Números) | porta Sala |
| **Eu** | cartão público, Treinador, Missões (aba própria em vez de lista de 6 telas), Clube, Amigos; Notas da versão, Ajuda e Créditos no fim | Perfil + rodapé |

- **Regras:** a barra some dentro da copa e da partida (como no Clash na batalha); trocar de aba desliza a tela
  inteira em 250 ms, o marcador da aba desliza junto (o `tab-slide.ts` já faz isso nas `.bc-tabs`); Reduzir
  movimento troca o deslize por um fade de 200 ms; ícones desenhados (o kit `HudIcon` e os SVG de hoje, sem emoji);
  alvo de toque de 44 px; o rótulo da aba sempre aparece embaixo do ícone (não só ícone).
- **Celular deitado (844x390):** a barra vira uma coluna estreita à esquerda, senão come 15% da altura.
  **Desktop:** a barra fica embaixo, centralizada na largura da coluna (como no Clash no tablet).
- **Duelo:** "Criar sala" já com o padrão marcado (Disputa, 4x, normal, 1 jogo) e as 4 escolhas recolhidas em
  "Regras da sala". Dois toques até o link.
- **Tour/coach:** os balões apontam pras abas novas e não bloqueiam a tela inteira.
- **Links antigos** (`?perfil=medalhas`, `?aba=`) continuam via `src/ui/doors.ts`.
- **Custo:** 6–9 dias (Home nova, componente da barra com deslize, mudar 4 telas pra viverem dentro de aba, textos
  PT/EN, prints em 320/390/deitado/desktop, teleporte). **Risco:** médio. É a mudança que mais muda o jeito de
  usar; vale um protótipo atrás de bandeira (`?lab=abas`) pra você mexer antes.

### Caminho 3: Três abas (Jogar, Coleção, Eu)

```
├──────────┬──────────┬──────────┤
│ Coleção  │  JOGAR   │    Eu    │
└──────────┴──────────┴──────────┘
```

- **Como:** só 3 abas, maiores. Jogar tem todos os modos (Rota, Relâmpago, Dia, Duelo, Arcade) num carrossel de
  cartões grandes. **Eu** junta Perfil e Sala de troféus (o cartão público já mostra as taças; a sala vira a
  primeira seção do Eu).
- **Muda:** menos coisas pra aprender; o Perfil e a Sala param de se sobrepor. Perde o lugar próprio dos modos
  arcade, que ficam espremidos no carrossel.
- **Custo:** 5–7 dias. **Risco:** médio; juntar Perfil e Sala desfaz parte das "três portas" decididas em 20/10.

### Recomendação

**Caminho 2.** É o que mais se parece com o que você pediu, dá casa pros modos arcade e pro 2x2 (aba Arcade) e
corta os dois maiores problemas: coisa importante abaixo da dobra e telas de 6 telas de altura. Se quiser algo já
na próxima versão sem risco, o Caminho 1 é um passo que não se perde (o seletor de modo e o JOGAR grande são os
mesmos do 2).

---

## 3. Modos arcade

Referências do formato: Rocket League tem duas playlists "Arcade" no casual que trocam toda semana (Heatseeker,
Spike Rush, Dropshot, Snow Day…); o Hearthstone tem a Taverna (regra nova toda quarta, casual); o Clash tem eventos
(Draft triplo, Morte súbita, Espelho); o EA FC tem as Regras da Casa (Bola misteriosa, Sem regras, Gol de longe vale
dobro, Sobrevivência); o Slay the Spire tem a Escalada diária (mesma seed pra todo mundo, 3 modificadores, placar);
o Hades tem o Pacto (você escolhe a dificuldade e ganha mais); o Wordle viralizou pela grade que se posta sem
spoiler.

O que funciona em todos: **uma regra só, com nome**, que muda o que é "bom", e **rotação** (volta depois, dá
saudade). Proposta de formato: **uma vaga fixa "Arcade da semana"** na aba Arcade, trocando toda segunda, junto da
"Semana do tipo" que já existe.

| # | Modo | Regra em 1 linha | Por que diverte / viraliza | Custo | Motor? |
|---|---|---|---|---|---|
| 1 | **Monotipo** | Copa sem fim só com Pokémon do tipo da semana: vai até perder | "fui até 9 vitórias com time só de Inseto" é post pronto; casa com a Semana do tipo | 2–3 dias | não (filtro no draft) |
| 2 | **Draft às cegas** | As cartas vêm viradas (só tipo e posição); a nota aparece na escalação | a revelação dá clipe ("tirei um Magikarp de pivô"); zero balanceamento | 1–2 dias | não |
| 3 | **Pênaltis sem fim** | Seu time cobra e defende contra a IA em morte súbita até errar | 1 minuto por tentativa, recorde fácil de comparar, ótimo pro TikTok | 3–4 dias | sim: flag nova "só pênaltis" (não muda partida normal) |
| 4 | **Grade do Dia** | A Copa do Dia que já existe ganha um resultado em quadradinhos (V, E, D, gols) pra compartilhar | o efeito Wordle sem spoiler; puxa o jogador todo dia | 1 dia | não |
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
barato e o mais "clipável") e Pênaltis sem fim (curtíssimo, recorde, perfeito pro TikTok). A Grade do Dia é de 1
dia e pode ir junto de qualquer uma.

---

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
8. **Menus:** Caminho 2, barra de 5 abas com Jogar no centro **(recomendado)** / Caminho 1, faxina / Caminho 3, três
   abas.
9. **Protótipo das abas** em `?lab=abas` pra você mexer antes de trocar a Home **(recomendado)** / direto na Home.
10. **Nome do time sai da Home** (vai pra Escalação e Perfil) **(recomendado)** / fica.
11. **Duelo com regras recolhidas** (Criar sala já com Disputa, 4x, normal, 1 jogo) **(recomendado)** / manter as 4
    escolhas abertas.
12. **Arcade:** uma vaga fixa "Arcade da semana" trocando toda segunda **(recomendado)** / todos os modos sempre
    abertos numa lista.
13. **Primeiros modos arcade:** Monotipo, Draft às cegas e Pênaltis sem fim, mais a Grade do Dia **(recomendado)** /
    outra escolha da lista (diga os números).
14. **Modos que mexem no motor** (Pênaltis, Morte súbita, Caos) só com os números antes/depois na sua frente, pela
    skill de balanceamento **(recomendado)** / deixar esses de fora.
15. **Ordem:** menus primeiro (dão casa pro resto), depois arcade, depois 2x2 **(recomendado)** / 2x2 primeiro.

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
