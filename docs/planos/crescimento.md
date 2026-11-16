---
description: Pesquisa (16/11/2026) de como trazer mais jogadores sem dinheiro: o que já foi tentado, casos, canais, loops, retenção, comunidade e 3 planos pro Time Ultimate.
---

# Crescimento do Soccermon (pesquisa de 16/11/2026)

Só pesquisa: nada de código mexido, nada postado. Números do jogo tirados do banco (`game_events`, 30 dias até
16/11, mesmo critério do `npm run stats`). Números de fora vêm das fontes no fim. Quando não achei número, está
escrito que não achei.

## Resumo

- **As sessões estão caindo:** 558 por semana (19/10), 814 (26/10), 477 (02/11), 254 (09/11). Em 30 dias, 1.462
  sessões e 476 novas.
- **O que traz gente nova hoje:** Google (157 novas, 77% começam copa), o link da bio do Instagram (105 novas, 76%) e
  "direto" (173). TikTok, Shorts, X e GitHub quase não aparecem no placar.
- **Os loops do jogo existem, mas quase não giram:** 44 compartilhamentos em 30 dias, contra 657 títulos, e só 4
  sessões chegaram por um link de Compartilhar. O Duelo é o loop que funciona: 92 sessões entraram numa sala por
  convite e 48 delas eram de gente nova.
- **Ainda não foi tentado:** creators (o kit está pronto desde 19/10 e ninguém recebeu), imprensa, Reddit, Discord e
  notificação.
- **Recomendação:** plano médio (opção B): creators e imprensa BR com o Time Ultimate de gancho, Copa do Dia com
  cara de "Wordle de Pokémon", prévia de link no WhatsApp e push opcional pro Natal. Discord só junto com a Liga, em
  12/01.

## 1. O que já existe e o que já foi tentado

### Canais (30 dias até 16/11)

| Canal | O que foi feito | Resultado medido |
|---|---|---|
| Instagram @soccermongame | Reels de todos os vídeos desde 22/10, link `soccermon.com/ig` na bio | **o melhor canal social:** `ig` 196 sessões, 105 novas, 76% começam copa |
| TikTok @soccermongame | trailer, clipes, Vestiário, News, link `/tt` na legenda | `tiktok` 0 sessões. Quem digita o site cai em "direto" (713 sessões, 173 novas), então parte dele pode ser TikTok |
| YouTube Shorts | os mesmos vídeos, link `/yt` | `youtube` 0 sessões |
| Google (orgânico) | nada de propósito: só título, descrição, `og:image`, sitemap de 15/10 | **372 sessões, 157 novas, 77% começam copa, 58% terminam**: o canal de melhor qualidade |
| X | post de lançamento (15/10) | 1 sessão |
| GitHub | releases, Discussions #1 fixada | 2 sessões |
| Facebook / android | ninguém postou (é gente compartilhando ou app) | 9 e 47 sessões |
| LinkedIn, TabNews, Reddit | textos prontos em `docs/marketing/textos-divulgacao.md`, **nunca postados**; Reddit decidido "não" em 19/10 | — |
| Show HN | cancelado em 28/10 (vetado) | — |
| itch.io | descartado em 16/10 ("dá trabalho e traz pouca gente") | — |
| Creators | lista de 15 BR (`~/Downloads/soccermon-creators/`), kit com 5 e-mails, clipes e títulos por código (`~/Downloads/soccermon-kit-creators/`) | **ninguém foi contatado** (em 09/11, "DMs pros streamers" seguia sem decisão) |

O que o `calendario.md` já tinha notado continua valendo: a curva sobe nas semanas com mais post e cai quando os
posts param. 75% das sessões são no celular.

### O que o jogo já tem pra crescer (conferido no código)

| Peça | Onde | Estado |
|---|---|---|
| Compartilhar o resultado estilo Wordle (🟩🟥, placares, time, link do desafio com a seed) | `src/ui/share.ts`, `Result.tsx` | funciona; 44 usos em 26 sessões em 30 dias |
| Card do título 9:16 e 1:1 pra baixar | `src/ui/share-card.ts` | metade dos compartilhamentos é o story baixado |
| Desafio por semente (`?seed=`): o amigo joga o mesmo draft | `challengeUrl`, `Estadio.tsx` | funciona; só 4 sessões chegaram por `share` |
| Copa do Dia: a mesma copa pra todo mundo, ranking do dia, texto Wordle, sequência gentil e missões de 7 e 30 dias | `src/store/daily.ts`, `Daily.tsx`, `missions.ts` | funciona; **o Compartilhar da Copa do Dia não manda evento** (não dá pra medir) |
| Duelo ao vivo por link, amigos online, botão Desafiar | `src/ui/duel/`, `src/friends/` | **o loop que funciona:** 133 entradas em sala (92 sessões), 208 partidas; das 48 sessões novas que vieram por convite, só 5 começaram uma copa depois |
| Exportar clipe 9:16 (Melhores momentos, 15 s, MP4/WebM) | `src/ui/clip-recorder.ts`, `Moments.tsx` | existe; **sem evento**, não sei se alguém usa |
| Jogo instalável (PWA) | `src/ui/install.ts`, `manifest.webmanifest` | existe; não tem service worker de push |
| Títulos por código (prêmio sem dinheiro) | skill `soccermon-titulos` | usado com gametesters; o #DesafioDourado foi planejado e não saiu |
| Objetivos diários e semanais do Time Ultimate | `src/store/ultimate/rules.ts` | entra em 27/11 |
| Liga ranqueada | `src/league/` | fechada até 12/01/2027 |

**O que falta:** notificação (push), prévia de link personalizada (o WhatsApp mostra sempre a mesma imagem),
número do dia na Copa do Dia, eventos de medição do clipe e do Compartilhar da Copa do Dia, Discord e qualquer
página que o Google consiga ler além da Home (o jogo é uma página só e o sitemap parou em 15/10).

## 2. O que os casos ensinam

| Caso | O que fez crescer | Números (só os achados) |
|---|---|---|
| **PokéRogue** (2024, navegador, sem fins lucrativos, Phaser) | loop curto sem grind; streamers grandes (Ludwig, SmallAnt) jogaram ao vivo; Discord e Reddit cheios de times "quebrados" e guias; evento oficial (Pride, junho/2024) | de 100 mil pra mais de 1 milhão de jogadores em cerca de um mês (VideoGamer, maio/2024). Não achei de onde veio o primeiro empurrão |
| **Pokémon Infinite Fusion** | o Discord nasceu do próprio jogo (fãs mandam sprites de fusão); a fusão é um conteúdo pronto pra vídeo, e viralizou no TikTok e no YouTube em 2023 | comunidade de ~20 mil foi a ~200 mil em poucos meses (Aftermath); Discord com ~940 mil membros (listagens, não oficial). Criador: nunca ganhou dinheiro e acha que é por isso que não foi derrubado |
| **Daily Red** (out/2026, navegador) | "Wordle de Pokémon": um time por dia, igual pra todos, sequência e grade de resultado sem spoiler | em dias saiu na Dexerto, GamesRadar e **Critical Hits (BR, 13/10)**. Não achei número de jogadores nem a origem do primeiro post |
| **Wordle** | o botão de compartilhar copiava uma grade de emoji sem spoiler, uma vez por dia | ~300 mil jogadores/dia no começo de jan/2022 e mais de 2 milhões no fim do mês (relato do NYT); "milhões por dia" na compra |
| **Balatro** | demo grátis, alguns posts no Reddit, depois streamers médios (Retromation, Dan Gheesling) puxaram os grandes (Northernlion) | 48 wishlists no fim de maio/2023, 28.661 no fim de julho, 208.401 no lançamento (fev/2024) |
| **Agar.io / Slither.io** | YouTubers grandes (PewDiePie, Markiplier) e uma comunidade no Reddit; zero verba | Slither.io: mais de 60 milhões de jogadores/dia em junho/2016 (Wikipedia) |
| **Relic Castle** (contra-exemplo) | fórum que listava fan games de Pokémon (não hospedava) | derrubado por DMCA em março/2024, mandado por terceiro em nome da TPCi; o Discord ficou de pé. Antes disso, em 2016, a Nintendo tirou mais de 500 fan games do Game Jolt |

**Lições pro Soccermon:**

1. **O desafio diário é o formato que a imprensa de Pokémon cobre agora** (Daily Red, outubro/2026). A Copa do Dia
   já é isso. Falta empacotar: número do dia, Compartilhar em destaque e a frase "a Copa do Dia de Pokémon".
2. **Quase todo alcance grande veio de terceiros** (streamers no PokéRogue e no Balatro, creators no Infinite
   Fusion, YouTubers nos .io). A conta própria segura quem já chegou; quem traz gente nova é o creator.
3. **Médio puxa grande:** no Balatro, quem abriu a porta foi gente média, não o maior nome. O kit já é feito pra
   pequenos e médios (Tio Fail, Moracci, Farmando Dungeons, Breno Menezes) antes do LeeGengar.
4. **A comunidade nasce de um motivo pra conversar** (sprites no Infinite Fusion, times quebrados no PokéRogue). No
   Soccermon os motivos seriam o ranking da Copa do Dia, os Duelos e o Time Ultimate, não um servidor vazio.
5. **Risco:** quem cai é quem cobra, quem hospeda ou lista em massa, ou quem fica grande demais em lugar visível.
   Sem dinheiro, sem loja, sem portal com anúncio e sem "Pokémon" no nome é o que mais protege. O Soccermon já segue
   tudo isso.

## 3. Canais

Esforço é do Miguel (o Claude prepara texto, clipe e lista). Alcance é palpite com base nos casos e no placar,
não promessa.

| Canal | Esforço | Alcance provável | Risco pro fan game | Como entrar sem parecer spam |
|---|---|---|---|---|
| **Instagram Reels** (já) | já está na rotina | médio; é o único social que traz gente medida | baixo | manter; a legenda pede pra mandar pro amigo; responder na 1ª hora |
| **TikTok e Shorts** (já) | já está na rotina | baixo medido (0 cliques com UTM) | baixo | manter o mesmo MP4, mas não gastar mais tempo neles que no Reels |
| **Google / SEO** | 1 h uma vez (Search Console) + texto | médio e constante; já é 25% das sessões | baixo | Google Search Console (grátis, verificação pelo DNS da Vercel) pra ver as buscas; texto em PT e EN dentro do `index.html` (o que é, como joga); sitemap atualizado. Não achei concorrente "Pokémon + futsal" no navegador |
| **Creators BR no YouTube** (kit pronto) | 1–2 h pra ler e mandar 5 e-mails | **alto se um morder**; VcseLembra já fez 39+ vídeos de Infinite Fusion (130–347 mil views cada) | médio-baixo: o vídeo é deles; Nintendo tem regra própria pra vídeo de jogo dela, fan game não entra nessa regra | e-mail curto na voz do Miguel, o kit e um título exclusivo; gancho: "o Time Ultimate abre em 27/11". Começar pelos médios |
| **Lives na Twitch BR** | o mesmo e-mail | médio; a Copa do Dia é formato de live ("bata meu placar") | baixo | sugerir 10 min de Copa do Dia ou Duelo com o chat |
| **Imprensa BR** (Critical Hits, Tecnoblog, Legião dos Heróis, Pokéverso) | 1 h: e-mail com GIF | médio; a Critical Hits cobriu o Daily Red em outubro | médio: matéria aumenta a visibilidade | mandar uma dica no dia 27/11 ("fan game brasileiro de Pokémon e futsal ganha modo Time Ultimate"), sem esperar resposta |
| **Imprensa gringa** (Dexerto, GamesRadar) | 1 h | alto se pegar | **médio-alto**: é onde a TPCi olha | só depois que a BR der certo; decisão do Miguel |
| **Discords de Pokémon BR** | 30 min por servidor | baixo-médio | baixo | só no canal de divulgação/projetos; texto PT da §2.2 dos textos de divulgação |
| **r/pokemon** | 30 min + responder | alto se passar na moderação | médio | só se houver regra ou tópico de fan creation; se não houver, não postar |
| **r/pokerogue** | 30 min | médio: o público mais certo | médio (é comunidade de outro fan game) | só se as regras aceitarem outros jogos; senão, comentar quando alguém perguntar "jogos parecidos" |
| **r/WebGames** | 30 min | médio (EN) | baixo | 1 post em EN, regra lida antes; não achei as regras atuais (o Reddit bloqueia leitura automática) |
| **r/incremental_games** | — | — | — | pular: não é incremental (já decidido) |
| **r/IndieGaming / r/indiegames** | 30 min | baixo-médio | baixo | r/indiegames proibiu autopromoção disfarçada de pedido de feedback; ler a regra do dia |
| **PokéCommunity** (fórum) | 1 h (modelo de tópico) | baixo | médio (fórum de fan games, alvo histórico) | seguir o modelo e os créditos; baixa prioridade |
| **TabNews / r/brdev** | texto pronto | baixo em jogador, bom em dev | baixo | ângulo técnico (motor determinístico); já está escrito |
| **WhatsApp** (grupos de amigos dos jogadores) | zero pro Miguel | é onde o brasileiro compartilha | baixo | depende do jogo: prévia de link com o placar (§4) |
| **itch.io** | 2 h + manter | baixo (já descartado) | médio: retirada reativa quando alguém reclama | não |
| **Newgrounds** | 2 h | baixo | não achei a regra deles sobre fan game | não |
| **CrazyGames / Poki** | — | — | **veto:** portais vivem de anúncio (fere o ADR 0006) e a regra do Poki rejeita "uso indevido de IP" | não |
| **Hacker News** | — | — | — | vetado |

## 4. Loops dentro do jogo: o que funciona e o que falta

O que funciona nos casos: o resultado vira um pedaço de texto ou imagem que dá vontade de mandar (Wordle), o link
leva o amigo direto pro mesmo desafio, e o amigo que chega já tem o que fazer. O Soccermon tem as três peças; o que
falta é empurrar e medir.

| Loop | Já tem | Falta (do mais barato pro mais caro) |
|---|---|---|
| **Copa do Dia como Wordle** | mesma copa pra todos, ranking, texto com quadradinhos, sequência | (1) número do dia no texto e na tela ("Copa do Dia nº 42"), como o Wordle; (2) Compartilhar grande no fim da Copa do Dia; (3) evento `share` com `kind: daily`; (4) a frase "a Copa do Dia de Pokémon" no texto, no Reels e no e-mail pra imprensa |
| **Desafiar um amigo** (seed) | link com a seed, a Home vira "jogar o desafio" | **prévia de link no WhatsApp com o resultado** ("Time X fez 4/4. Bate?"): imagem gerada por função da Vercel (plano grátis), lida pelo `og:image` do link do desafio. Hoje todo link mostra a mesma imagem |
| **Convite pro Duelo** | link, amigos online, Desafiar, convite que chega na hora | quem chegou por convite e nunca jogou sai depois do Duelo (5 de 48 começaram copa): no fim do Duelo, o convidado novo recebe um botão "monta seu time" pro Estádio; "revanche" e placar entre os dois |
| **Placar e Liga** | ranking da Copa do Dia; Liga fechada até 12/01 | nada antes de 12/01. A Liga é o melhor momento pra comunidade (ver §6) |
| **Eventos semanais** | carta Evento da semana, objetivos semanais do UT a partir de 27/11, Natal em 15/12 | ligar o News de segunda ao jogo: "desafio da semana" anunciado no vídeo e cumprido no jogo, com título por código pra quem fizer (prêmio no jogo, sem sorteio e sem dinheiro) |
| **Clipes dos jogadores** | exportar clipe 9:16 de 15 s com o site no rodapé | evento pra medir; depois de exportar, um "manda pra @soccermongame" (o Lance da semana já prevê clipe da galera); só depois da auditoria do exportar clipe |

O que **não** fazer: recompensa por convite ("chame 3 amigos e ganhe"). No Soccermon isso puxa pra mecânica de
indicação com prêmio, e o Miguel não quer nada perto de sorteio. Também não pôr Compartilhar automático: o Wordle
cresceu porque o botão era opcional e o resultado não estragava o desafio de ninguém.

## 5. Retenção (trazer de volta quem já jogou)

O jogo segura bem quem chega (67% das sessões são de quem volta), mas não tem como chamar de volta quem sumiu. Hoje
o único caminho é a pessoa ver um vídeo nosso.

| Ideia | Já tem? | Vale? | Observações |
|---|---|---|---|
| Copa do Dia + sequência | sim | sim, é o motivo diário | missões de 7 e 30 dias já existem; no fim, mostrar "volte amanhã: Copa do Dia nº 43" |
| Objetivos diários e semanais | no Time Ultimate (27/11) | sim | é o motivo diário de quem gosta do UT |
| **Notificação web (push)** | não | **sim, opt-in e pouco** | no Android funciona pelo Chrome sem instalar; no iPhone só com o jogo instalado na tela de início (iOS 16.4+) e o pedido tem que sair de um toque. Precisa de service worker, chave VAPID e um envio por dia (pg_cron + Edge Function, no plano grátis). No máximo 1 por dia, só "Copa do Dia nova" e eventos grandes (UT, Natal) |
| E-mail | — | não | o login é Google, mas mandar e-mail mexe com privacidade e cai no spam |
| Lançamento do Time Ultimate como evento | sim (liga sozinho em 27/11, trailer às 19h) | sim | o maior motivo pra quem sumiu voltar: vídeo do dia 24 (O pacote), trailer no 27, News de segunda (30/11) com os primeiros números. Sem push pronto, o alcance de quem sumiu fica só nas redes |
| Natal (Copa do Dia de Natal em 24 e 25/12) | aprovado | sim | é o 2º evento: bom pra estrear o push |
| Discord | não | depois | ver §6 |

## 6. Comunidade: Discord sim ou não, e quando

- **Os casos:** o Discord do Infinite Fusion e o do PokéRogue cresceram **depois** de o jogo bombar e porque havia o
  que fazer lá (mandar sprite, mostrar time). Os guias de dev solo repetem a mesma coisa: servidor pequeno vive da
  presença do dono, e servidor vazio é pior que nenhum. Começar com pouquíssimos canais.
- **Pro Miguel agora:** ele é dev solo, posta toda semana e lança toda segunda. Um Discord aberto hoje teria poucas
  dezenas de pessoas e cobraria presença diária. O GitHub Discussions já existe (e quase ninguém usa), e os
  comentários das redes ficam com o Claude.
- **Recomendação:** **não abrir antes de 27/11.** Abrir junto com a **Liga (12/01/2027)**, que dá motivo pra conversar
  (ranking, Duelos, times). Começar com 3 canais (novidades, geral e "procuro Duelo"), o Claude escrevendo os avisos
  de versão e o Miguel aparecendo umas vezes por semana. Gatilho pra abrir antes: muita gente pedindo nos
  comentários, ou um creator grande topar.
- **Risco:** baixo. O Discord do Relic Castle ficou de pé quando o site caiu. Não hospedar arquivo do jogo lá.

## 7. Três planos (16/11 a 27/12)

Contexto fixo: segunda tem News e versão, terça o Vestiário, domingo o Lance; de 18 a 26/11 o Time Ultimate está
congelado (só conserto); sex 27/11 o UT abre; ~10/12 sai a versão de Natal; 15/12 começa o evento; 24 e 25/12 tem
Copa do Dia de Natal; 12/01 a Liga abre. O Claude faz tudo o que é preparo (textos, lista, clipes, código); o
esforço abaixo é o do Miguel.

### A. Enxuto (~1–2 h por semana do Miguel)

| Semana | O quê |
|---|---|
| 16–22/11 | Ler e mandar os 5 e-mails do kit (conferir se os títulos dos creators estão no ar). Google Search Console verificado |
| 23–29/11 | 27/11: e-mail curto pra 3 sites BR com GIF do UT. Lembrete aos creators que não responderam (o kit já tem) |
| 30/11–06/12 | Placar de segunda com o efeito do UT; repetir no Reels o formato que mais teve envios |
| 07–13/12 | Nada novo: grade normal |
| 14–20/12 | News sobre o Natal; e-mail aos creators que responderam: "evento de Natal no ar" |
| 21–27/12 | Copa do Dia de Natal como post de domingo |

Risco: baixo. Limite: sem mudança no jogo, os loops continuam parados e o crescimento fica dependendo de um creator
morder.

### B. Médio (~3–4 h por semana do Miguel) · **recomendado**

Tudo do A, mais:

| Semana | O quê |
|---|---|
| 16–22/11 | Na versão de segunda 23/11 (fora do UT, trilha rápida): número do dia na Copa do Dia, Compartilhar grande no fim dela, eventos de medição (`share` da Copa do Dia, clipe exportado), botão "monta seu time" no fim do Duelo pro convidado novo, sitemap e texto em PT/EN no `index.html` |
| 23–29/11 | UT: vídeo O pacote (24), trailer (27). Imprensa BR no 27 com o gancho "fan game brasileiro"; Discords de Pokémon BR (2–3 servidores, canal de divulgação) |
| 30/11–06/12 | Prévia de link dinâmica no desafio e na Copa do Dia (o WhatsApp mostra placar e time). News de 30/11 lança o "desafio da semana" com título por código |
| 07–13/12 | Push opt-in (Android e iPhone com o jogo instalado), só "Copa do Dia nova" e eventos; pedido aparece depois de uma Copa do Dia, nunca na entrada. Vai na versão de Natal |
| 14–20/12 | 1º push: "evento de Natal começou". 1 post em r/WebGames (EN), regra lida antes |
| 21–27/12 | Push da Copa do Dia de Natal (24 e 25). Placar: o push trouxe gente de volta? Decide o Discord pra 12/01 |

Risco: baixo-médio. A imprensa BR aumenta um pouco a visibilidade; push mal dosado irrita (por isso 1 por dia no
máximo e só com opt-in). A prévia de link é uma função nova na Vercel: tem que ficar fora do bundle da Home.

### C. Ambicioso (~6–8 h por semana do Miguel)

Tudo do B, mais:

| Semana | O quê |
|---|---|
| 16–22/11 | Mensagem também pros 10 creators restantes da lista (grandes inclusos) e pra 5 streamers da Twitch |
| 23–29/11 | Live do Miguel no 27/11 (abrindo os primeiros pacotes do UT, Duelo com quem aparecer); Discord aberto no 27 |
| 30/11–06/12 | Torneio de Duelo da comunidade num sábado (chaveamento no Discord, título por código pro campeão) |
| 07–13/12 | Imprensa gringa (Dexerto, GamesRadar) com a Copa do Dia como "Pokémon futsal Wordle"; r/pokemon se houver espaço de fan creation |
| 14–20/12 | Evento de Natal com desafio comunitário (meta somada de gols de todos), anunciado no Discord e no News |
| 21–27/12 | Retrospectiva do ano no News com números reais dos jogadores |

Risco: médio-alto. Imprensa gringa e r/pokemon põem o jogo onde a TPCi olha; Discord e live cobram presença que
compete com o desenvolvimento do Natal e da Liga. Se um creator grande pegar, o Supabase grátis pode apertar
(conexões do Realtime no Duelo).

### Recomendação

**B.** O A depende só de sorte com creator; o C gasta o tempo que o Miguel não tem antes da Liga e abre a exposição
gringa antes da hora. O B mexe nas duas coisas que os números mostram: o Google e o Instagram trazem gente boa, mas
os loops de compartilhar não giram e não há como chamar de volta quem sumiu. E usa o UT e o Natal como gancho pros
creators e pra imprensa BR.

## 8. Decisões pro Miguel (recomendação primeiro)

1. **Plano B?** Recomendo sim.
2. **Mando os 5 e-mails dos creators esta semana, com o UT de gancho?** Sim, você lê e manda (ou eu mando, com o ok
   de cada um). Antes: conferir se os títulos dos creators estão no ar.
3. **Imprensa BR no 27/11 (Critical Hits, Tecnoblog, Legião dos Heróis, Pokéverso)?** Sim, só em PT. A gringa fica
   pra depois.
4. **Número do dia e Compartilhar grande na Copa do Dia, na versão de 23/11?** Sim.
5. **Prévia de link dinâmica no WhatsApp (desafio e Copa do Dia)?** Sim, depois do 27/11.
6. **Push opt-in, no máximo 1 por dia, só Copa do Dia e eventos, estreando no Natal?** Sim.
7. **Discord?** Não agora; abrir com a Liga em 12/01.
8. **Reddit continua "não"?** Um teste só: r/WebGames em EN em dezembro. r/pokemon fica de fora.
9. **Desafio da semana no News de segunda, com título por código pra quem cumprir?** Sim (prêmio só no jogo, sem
   sorteio).
10. **Google Search Console no DNS da Vercel?** Sim, 10 min seus, pra ver o que as pessoas buscam.
11. **Live sua no 27/11?** Opcional; só se der vontade.

## Fontes

Jogo e projeto: `npm run stats -- --dias 30` e consulta à `game_events` (16/11/2026); `docs/planos/calendario.md`,
`docs/planos/divulgacao-trailer2.md`, `docs/planos/pesquisas/marketing.md`, `docs/marketing/pauta.md`,
`docs/marketing/textos-divulgacao.md`, `docs/marketing/pesquisa-perfis-virais.md`,
`~/Downloads/soccermon-creators/creators.md`, `~/Downloads/soccermon-kit-creators/LEIA-ME.md`.

Fan games de Pokémon:
- [VideoGamer: PokéRogue passa de 1 milhão de jogadores](https://www.videogamer.com/?p=496272)
- [Dot Esports: popularidade do PokéRogue](https://dotesports.com/pokemon/news/pokerogue-popularity-shows-pokemon-needs-to-broaden-its-horizons)
- [Medium/Trill: PokéRogue e streamers](https://medium.com/trill-mag/pok%C3%A9rogue-the-fangame-that-hooked-players-immediately-e26cf2089384)
- [Phaser: PokéRogue](https://phaser.io/news/2024/06/pokerogue)
- [Aftermath: fan games, Infinite Fusion de 20 mil a 200 mil, risco legal](https://aftermath.site/pokemon-fangames-fansplaining/)
- [TheGamer: fusões no TikTok](https://www.thegamer.com/pokemon-fusions-tiktok/)
- [Discord do Pokémon Infinite Fusion](https://discord.com/servers/pokemon-infinite-fusion-302153478556352513)
- [Dexerto: Daily Red, "Wordle de Pokémon"](https://www.dexerto.com/pokemon/this-daily-pokemon-wordle-game-lets-you-fight-red-with-a-random-team-every-day-3418266/)
- [GamesRadar: Daily Red](https://www.gamesradar.com/games/pokemon/pokemon-rpg-fans-made-their-own-wordle-daily-red-lets-you-beat-pokemon-gold-and-silver-with-a-random-team-every-day-if-you-dont-mind-the-vibe-coding/)
- [Critical Hits: Daily Red (13/10/2026)](https://criticalhits.com.br/games/daily-red-e-um-jogo-de-pokemon-para-navegador-que-desafia-jogadores-a-derrotar-red-com-um-time-diferente-todos-os-dias/)

Risco:
- [Nintendo Life: Relic Castle derrubado por DMCA](https://www.nintendolife.com/news/2024/03/pokemon-fan-game-site-relic-castle-shut-down-following-dmca-takedown-notice)
- [Kotaku: motivo do DMCA do Relic Castle](https://kotaku.com/pokemon-fan-games-relic-castle-shutdown-dmca-reason-1851359618)
- [Wikipedia: Nintendo and fan games](https://en.wikipedia.org/wiki/Nintendo_and_fan_games)
- [Poki: diretrizes de qualidade (IP)](https://sdk.poki.com/poki-quality-guidelines)
- [CrazyGames: requisitos](https://docs.crazygames.com/requirements/quality/)

Outros casos:
- [Wikipedia: Wordle](https://en.wikipedia.org/wiki/Wordle)
- [TechCrunch: Wordle e o NYT](https://techcrunch.com/2022/05/04/wordle-new-york-times-user-growth)
- [Game Discover Co: Balatro 1 milhão](https://newsletter.gamediscover.co/p/how-balatro-hit-1-million-sales-in)
- [Windows Central: LocalThunk e as primeiras vendas](https://www.windowscentral.com/gaming/the-numbers-on-that-page-made-no-sense-balatro-developer-recalls-his-amazement-at-selling-50-000-copies-of-his-game-which-went-on-to-sell-5-million)
- [Pocket Gamer: Agar.io sem gastar nada](https://www.pocketgamer.com/agar-io/how-agari-io-conquered-the-app-store-without-spending-a-penny)
- [Pocket Gamer Biz: Reddit e Agar.io (Miniclip)](https://www.pocketgamer.biz/reddit-can-be-a-ua-goldmine-says-miniclip)
- [Wikipedia: Slither.io](https://en.wikipedia.org/wiki/Slither.io)
- [Game Developer: desafio diário (Spelunky e outros)](https://gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-)

Retenção e comunidade:
- [Apple: web push em apps da tela de início](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [MagicBell: limites de PWA no iOS](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Wayline: Discord de jogo indie](https://www.wayline.io/blog/indie-game-discord-strategy-community-building)
- [Bugnet: como manter o Discord do jogo](https://bugnet.io/blog/how-to-run-a-discord-community-for-your-game)
- [r/indiegames: regra contra autopromoção disfarçada](https://redlib.belloworld.it/r/indiegames/duplicates/1esd7yf)

Sem dado: regras atuais do r/WebGames, r/pokemon e r/pokerogue (o Reddit bloqueia leitura automática); política de
fan game do Newgrounds; número de jogadores do Daily Red e do Squirdle; como o PokéRogue ganhou os primeiros
jogadores.
