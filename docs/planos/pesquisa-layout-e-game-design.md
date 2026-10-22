# Pesquisa: layout dos botões, telas e game design da copa

21/10/2026, madrugada. Pedido do Miguel: "pesquisas mais extensas sobre game design e melhorias nos layouts dos botões e
tal". Só pesquisa e proposta: nada de código mexido, nada commitado.

Base: a revisão de design de hoje (`v091/docs/planos/revisao-design.md`), a varredura do "pega e põe"
(`v091/docs/planos/interacoes-diretas.md`), o brand guide (`docs/marca/brand-guide.md`), o kit da transmissão
(`src/ui/broadcast-kit.css`), os botões em `src/ui/styles.css` (linhas 128-190), os prints da revisão
(`scratchpad/review/`, `-m` = 390 px, `-d` = 1440) e os números do placar que estão em `docs/planos/copa-roguelike.md`.

Legenda: **Esforço** P = até meio dia, M = 1 a 2 dias, G = 3+ dias. **Miguel?** "sim" = precisa do ok dele antes
(equilíbrio, carta, regra de jogo, ou mudança grande no jeito de ver a partida); "print" = sobe pela regra 5 de
velocidade (layout no kit), mas vale mostrar o antes/depois; "não" = conserto ou processo.

---

## 0. Resumo em 10 linhas

1. Todo jogo de referência tem **uma ação grande na zona do polegar** (Battle no Clash, Play no Snap, abrir pacote no
   TCG Pocket). No Soccermon, a ação principal muda de lugar em cada tela e a barra do polegar só existe em 3 telas.
2. **Um vermelho por tela** é regra comum nos design systems e já está no `shop.css`. Hoje há 3 vermelhos no Draft e
   na Recompensa, 2 vermelhos e 2 amarelos no Campeão e 8 primários no Amigos.
3. O amarelo cheio (`.btn.yellow`) compete com o vermelho. Proposta: aposentar e usar o **contorno amarelo** do Mercado
   como botão secundário.
4. **Achado novo:** a Galmuri11 foi desenhada pra **12 px** e a Galmuri14 pra **15 px**. O corpo do jogo usa 14 px e
   os tamanhos mais comuns são 11 e 13, que são escalas quebradas de uma fonte pixel. A escala de 6 degraus da revisão
   (10/12/14/16/20/28) repete o problema: proponho 12/15/24/30 e testar no print.
5. Branco sobre o vermelho tem contraste 4,0: só passa em texto grande e negrito (≥ 18,7 px). Hoje o rótulo de vários
   primários tem 12 a 17 px.
6. Telas de fim (Resultado, Campeão) seguem as "três leituras" do Zach Gage: o que se vê primeiro, o que vem depois e
   o detalhe atrás de um toque. Elas são a maior fonte de bagunça.
7. 45% saem nas boas-vindas e 56% jogam no celular. O Marvel Snap joga a pessoa direto na partida e ensina jogando. A
   melhor alavanca de retenção aqui é a **primeira copa guiada**, não um sistema novo.
8. Na copa, a diversão está nas decisões entre as partidas (86% jogam em 8x). As ideias mais fortes deixam essas
   decisões **legíveis**: prévia do rival que diga o que fazer, sinergia com degraus e uma meta opcional por partida.
9. Retenção sem armadilha: escada de dificuldade (Ascension/Stakes), Copa do Dia com a mesma seed pra todo mundo e
   "Nova copa" em 1 toque. Evitar timer de pacote, calendário de login e sequência que pune quem falta.
10. O plano está em 14 recomendações por tela (seção 2), no sistema de botões (seção 3), na lista do que tirar (seção 4)
    e em 10 ideias de game design ordenadas (seção 5).

---

## 1. O que os jogos de referência fazem

Onde a fonte não descreve o layout, a linha diz **(obs.)**: é o que se vê jogando e vale conferir num print antes de
citar pra alguém.

| Jogo | Ação principal | Quantas ações por tela | "Novo" | Escolha, loja e fim de corrida |
|---|---|---|---|---|
| **Clash Royale** | Botão Battle amarelo, grande, no centro de baixo. Tudo que importa fica na **metade de baixo** da tela ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)) | Barra de 5 abas fixa embaixo. Loja com "até 6 itens". Profundidade de ~1 nível; popups parciais que fecham tocando fora | **No máximo 1 popup ao abrir**; o resto vira bolinha. Vermelho = só notificação | Baú com modo rápido e lento ("depois de 100 baús" o lento cansa). Quando tiraram o vermelho de "não dá pra comprar", o pessoal começou a tocar no que não podia, e a cor voltou |
| **Marvel Snap** | Play grande, central, em cima da barra de abas (obs.). As novidades rolam no fundo da tela, **acima do Play, sem interromper** ([Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction)) | Uma decisão por turno. Partida com menos de 4 min | Recursos liberados aos poucos: energia depois da 1ª vitória, o "Snap" só depois de umas horas | 1ª partida **sem preparo nenhum**. Uma carta jogável sempre garantida na mão inicial (Quicksilver), em vez de mulligan ([MobileGamer](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)). Recuar é "escapar", não perder ([MobileGamer](https://mobilegamer.biz/second-dinner-s-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)) |
| **Pokémon TCG Pocket** | O pacote no centro da Home. Quando ainda não dá, a Home mostra **o timer no meio** ([Pratt IxD](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/)) | Abrir pacote é o ritual: rasgar com o dedo, cartas saindo, áudio | Notificação leva direto pro pacote | Crítica: a escolha de pacote não tem desfazer, e a vantagem/fraqueza some em 1 s na batalha. Mostrar só as 2 últimas expansões confundiu todo mundo ([Filibuster](https://thefilibusterblog.com/fans-express-confusion-over-pokemon-tcg-pocket-ui-after-new-expansion-launch/)). Timer de pacote é o que **não** copiar (seção 5) |
| **Balatro** | "Next Round" e "Reroll" fixos à esquerda da loja (obs.) | Loja com **2 cartas, 2 pacotes e 1 cupom**, reroll a partir de $5 que sobe $1 a cada uso e volta pra $5 na loja seguinte ([wiki](https://balatrowiki.org/w/Shop)) | Sem bolinhas: o que é novo aparece na hora | Juros de $1 a cada $5 guardados ([games.gg](https://games.gg/balatro/guides/balatro-economy-guide/)). Ajustes: velocidade até 4x, **posição dos botões Jogar e Descartar** e cartas de alto contraste ([Steam Deck HQ](https://steamdeckhq.com/ja/game-reviews/balantro/)). Seed copiável ao perder ([Steam](https://steamcommunity.com/app/2379780/discussions/0/4346607305576903701)) |
| **Slay the Spire** | Mapa sempre a um toque. A recompensa vem em lista (ouro, poção, carta) com "Seguir" (obs.) | Recompensa de carta: **1 de 3 ou pular** ([wiki](https://slay-the-spire.fandom.com/wiki/Card_Rewards)) | Não tem | Rotas com risco legível (elite, descanso, "?"). Ascension: **cada nível soma uma regra**, até 20 ([wiki](https://slaythespire.wiki.gg/wiki/Ascension)). Daily Climb com a mesma seed pra todo mundo e 3 modificadores ([wiki](https://slaythespire.wiki.gg/wiki/Custom_Mode)) |
| **Into the Breach** (via Zach Gage) | — | "Três leituras": 1ª = o que fisga (grande), 2ª = o que explica o jogo (médio), 3ª = o detalhe (pequeno). Gage usa o próprio Slay the Spire como exemplo de ícones e números demais numa tela só ([Gigazine](https://gigazine.net/gsc_news/en/20180501-game-design-subway-legibility/)) | — | Esconder controle secundário até precisar (o menu do Really Bad Chess fica na borda) |
| **EA FC (FUT)** | Abas no topo e um "Switcher" que leva a qualquer lugar com 1 toque | A meta do redesenho de 1 ano foi **menos tempo em menu, mais tempo jogando** ([EA Playtesting](https://www.ea.com/playtesting/news/playtesting-ea-sports-fc24)) | — | A carta FUT é a referência das nossas (bronze, prata, ouro) |
| **Football Manager 24 Mobile** | "Pre-Match Hub": tática, relatório do rival, pontos fortes, pontos fracos e forma **numa tela só** antes do jogo ([FM](https://www.footballmanager.com/features/football-manager-2024-mobile-new-features-revealed)) | Um hub antes e outro depois da partida | — | O que importa do rival vira **uma decisão** (pontos fracos), não uma tabela |
| **Backpack Battles / Super Auto Pets** | Loja e batalha em fases. Na batalha a pessoa não controla nada | Loja curta: 10 de ouro, quase tudo custa 3, reroll custa 1 ([SAP](https://www.twoaveragegamers.com/ultimate-guide-to-super-auto-pets-game-mechanics/)) | — | **Congelar** item da loja pro próximo turno. Rival é o time de outro jogador ([Wikipedia](https://en.wikipedia.org/wiki/Backpack_Battles)) |
| **Pokémon Unite** | — | Contraexemplo: reviews pedem refazer os menus ("lentos", "loja difícil de navegar", interface "entulhada") ([Digital Trends](https://digitaltrends.com/gaming/pokemon-unite-review), [Destructoid](https://destructoid.com/pokemon-unite-next-season-starts-after-maintenance-today)) | — | — |
| **Monster Train** | Sem fonte boa sobre a tela. O "pick 1 de 3" com as duas opções lado a lado é igual ao do StS (obs.) | — | — | — |

**O que se repete:**

1. **Uma ação dominante por tela**, embaixo e no centro ou à direita. O resto é menor e de outra cor.
2. **A escolha acontece no próprio objeto** (carta, pacote, casa do mapa). Botão "Escolher" embaixo de cada opção é raro.
3. **"Pular" sempre existe, sempre discreto** (StS, Balatro).
4. **Loja pequena e com regra visível** (6 itens no Clash, 5 no Balatro). O preço sobe a cada reroll, e o que não dá
   pra comprar é óbvio sem tocar.
5. **Fim de corrida curto, com "de novo" na hora.** Os detalhes ficam pra quem pedir.
6. **"Novo" é raro:** um aviso por vez. Nada de bolinha em toda aba.

---

## 2. Recomendações por tela (ordem de prioridade)

| # | Tela | O quê | Referência | Esforço | Miguel? |
|---|---|---|---|---|---|
| 1 | **Todas do loop** (Recompensa, Mercado, VERSUS, Eliminado, Campeão) | **Barra do polegar (`.bc-thumbbar`) em toda tela do loop.** Hoje só Draft, Escalação e Resultado têm a barra. No Mercado o "Seguir" fica no topo, ao lado do "Trocar vitrine" (`20-mercado-m`); na Recompensa não há ação final embaixo. A barra leva o primário à direita (2/3) e no máximo um fantasma à esquerda (1/3: "Pular", "Menu") | Clash: tudo na metade de baixo ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). Hoober: 49% seguram com uma mão, o polegar faz 75% dos toques e 2/3 das pegadas de uma mão são da direita ([UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)) | P | print |
| 2 | **Draft e Recompensa** | **Tocar na carta escolhe** (fica "na mão", como no pega e põe) e some o botão vermelho embaixo de cada opção (3 "Escolher capitão" em `03-draft-captain-m`, 3 "Escolher/Contratar" em `13-reward-m`). Onde a vaga não resolve sozinha, o único vermelho é "Confirmar" na barra. "Pular (+1 reroll)" vira fantasma na barra | StS 1 de 3 ou pular ([wiki](https://slay-the-spire.fandom.com/wiki/Card_Rewards)). Regra "pega e põe" (`interacoes-diretas.md`) | P a M | print |
| 3 | **Draft (celular)** | **As cartas antes da quadra vazia** quando é escolha. Em `03-draft-captain-m` a pessoa rola 600 px de quadra vazia antes da 1ª carta. As cartas ficam na 1ª dobra e a prancheta vira faixa compacta, que cresce quando há algo na mão | Três leituras: a 1ª leitura é a escolha ([Gage](https://gigazine.net/gsc_news/en/20180501-game-design-subway-legibility/)) | P | print |
| 4 | **Home** | **"Nova copa" vermelho, largura cheia, na barra do polegar** (ou logo abaixo do nome do time). Duelo e Copa do Dia viram 2 cartões irmãos com botão comum. Some "MODOS PRINCIPAIS" e a Rota trancada (revisão, itens 1 a 3) | Clash (Battle) e Snap (Play): um botão domina a Home (obs.). Snap põe as novidades atrás, sem atrapalhar o Play ([DoF](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction)) | P | print |
| 5 | **Primeira visita** | **Boas-vindas de 3 páginas viram 0 páginas.** "Jogar" leva direto ao draft com o time já com nome, e as dicas aparecem no lugar, uma por tela, só na 1ª copa (o `<Tip>` já existe). Ajuda e passo a passo ficam no "?" | Snap: 1ª partida sem preparo, cada recurso liberado na hora de usar ([DoF](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction)). Dado nosso: **45% saem antes de passar das boas-vindas** | M | sim (fluxo de entrada) |
| 6 | **Resultado** | Aplicar as **três leituras**: 1ª = VITÓRIA + placar + "Escolher recompensa" na barra; 2ª = um bloco "Destaques" (craque, gols, evolução juntos); 3ª = estatísticas e chave atrás de "Ver estatísticas". Hoje são 3475 px, com a chave e o craque repetidos (`11-result-m`) | [Gage](https://gigazine.net/gsc_news/en/20180501-game-design-subway-legibility/); FM Post-Match Hub ([FM](https://www.footballmanager.com/features/football-manager-2024-mobile-new-features-revealed)) | M | print |
| 7 | **Eliminado** | **"Nova copa" em 1 toque, central, na barra.** Antes dela, uma linha de "faltou pouco" ("Caiu nas quartas por 1 gol. Melhor campanha: semifinal"). Compartilhar e Melhores momentos ficam como secundários, e "Menu" como fantasma pequeno. Hoje são 3 botões de pesos diferentes no meio da página (`Result.tsx:118-136`) | Restart instantâneo do Super Hexagon e "voltar ao menu" pequeno no canto ([itch.io](https://itch.io/post/14916468)). Seed copiável do Balatro | P | não |
| 8 | **Campeão** | Ordem fixa: troféu → 3 prêmios → elenco só com as cartas → **"Nova copa" vermelho na barra** + Compartilhar (contorno) + Melhores momentos (contorno). "Ver a campanha inteira" abre o resto. Hoje: 9739 px, 2 vermelhos e 2 amarelos | Três leituras; um primário por tela ([Red Cross DS](https://design.redcross.org.uk/components/buttons), [Basis DS](https://design.basis.com/components/buttons)) | M | print |
| 9 | **Partida (celular em pé)** | **Quadra no mínimo 45% da altura**; painel recolhido em abas, com o "Substituir" amarelo largura cheia virando botão comum dentro da aba Time (hoje é o elemento mais forte da tela, `10-match-later-m`). Deitado (`52-match-l`) já é o modelo | Clash: a arena manda e o deck fica embaixo, pequeno (obs.). Gage: esconder controle secundário até precisar | M a G | sim (muda como o jogo é visto) |
| 10 | **Novidades** (Perfil, abas, Sala, avatar) | **Uma bolinha só, no avatar.** Lá dentro, "NOVO" escrito uma vez no item, e some depois de visto. No máximo 1 aviso ao abrir o jogo | "Cegueira de bolinha vermelha" ([Braze](https://www.braze.com/resources/articles/beware-red-dot-badging)); Clash: no máximo 1 popup ao abrir ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)) | P | não |
| 11 | **Mercado** | O que **não dá pra comprar** fica óbvio sem tocar: preço riscado em `--muted` com ícone `lock` e o botão desabilitado com o motivo no aria ("Faltam ₽3"). Hoje o "Comprar · ₽7" parece igual com ou sem dinheiro | Clash: tirar o vermelho do "sem recurso" fez as pessoas tocarem no que não podiam ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)) | P | não |
| 12 | **Escalação** | "Jogar oitavas" na barra desde o topo. **Rival numa linha com o que ele faz bem e mal** ("Água, rápido; fraco contra Elétrico"). Tática, escanteio e cobrador atrás de um "Tática: Equilibrado · Varia" com lápis | FM24 Pre-Match Hub: forças, fraquezas e forma do rival numa tela ([FM](https://www.footballmanager.com/features/football-manager-2024-mobile-new-features-revealed)) | M | print (a linha do rival: sim, ver seção 5, #2) |
| 13 | **Todo toque** | **Feedback em todo toque:** o afundar de 2 px já existe (`.btn:active`, `.slot:active`, `.card.clickable:active`). Falta (a) o `select` tocar sozinho em todo botão (hoje são 38 chamadas soltas de `playSfx('select')`), com um som mais grave no primário; (b) vibração curta opcional (`navigator.vibrate(8)`) nos primários e ao soltar a carta na vaga, desligável. O iPhone não vibra pela web: o hack do `<input switch>` funciona do iOS 17.4 ao 26.4 e a Apple fechou no 26.5 ([rapidtoolset](https://rapidtoolset.com/en/tool/ios-haptics-tester), [azukiazusa](https://azukiazusa.dev/en/blog/ios-safari-web-haptics)). Não vale o esforço lá | "Juice it or lose it": muito retorno pra pouco toque ([GMTK/Amara](https://amara.org/v/C3BGA)) | P | não (opção em Configurações) |
| 14 | **Sistema de fonte** | **Escala nativa da Galmuri** (ver seção 3.4). Começar pela Home e pela barra do polegar e comparar prints em 1440 (tela 1x, onde a escala quebrada mais aparece) e 390 | README da Galmuri: 11 = 12 px, 14 = 15 px, 9 = 10 px ([GitHub](https://github.com/quiple/galmuri)); "tamanho quebrado deixa a fonte pixel borrada" ([Kirupa](https://www.kirupa.com/hodgepodge/preserving_pixel_art_aesthetics.htm)) | M (por tela) | print |

Ordem sugerida: 1, 2, 4, 7, 10, 11 e 13 numa tarde (são P e sem regra de jogo). Depois 3, 6, 8 e 12. Depois 14, que é
sistema. O 5 e o 9 só com o Miguel olhando.

---

## 3. Sistema de botões proposto (alinhado ao kit da transmissão)

### 3.1 Tipos

| Tipo | Classe | Visual (tokens da marca) | Altura mínima | Rótulo | Quando | Limite |
|---|---|---|---|---|---|---|
| **Principal** | `.btn.primary` (existe) | `--red` cheio, borda `--red-dark`, sombra dura `0 3px 0 #6e1615` | **52 px na barra do polegar**, 48 fora dela | Galmuri11 Bold **≥ 18,7 px** (contraste do branco sobre `--red` só passa em texto grande, ver 3.4). Verbo + objeto, até 3 palavras, `HudIcon next` à direita quando avança | A ação que avança o loop: Nova copa, Jogar, Confirmar, Escolher recompensa, Seguir | **1 por tela** (modal conta como outra tela) |
| **Secundário** | `.btn.outline` (**novo**, sai do `.shop-buy`) | fundo `--panel-2`, borda e texto `--yellow`, sombra dura `--bc-ink` | 44 px | Galmuri11 Bold 12 px | Ação repetida em grade (Comprar, Adicionar amigo, Desafiar) e 2ª ação de fim (Compartilhar, Melhores momentos) | À vontade em grade; no máximo 2 soltos |
| **Comum** | `.btn` (existe) | `--panel-2`, borda `--bc-ink` | 44 px | 12 px | Ação neutra que não avança: Sortear de novo, Ver a chave, Ver carta completa | — |
| **Fantasma** | `.btn.ghost` (existe) | transparente, borda `--line`, sem sombra | 40 px visível, **alvo de 44** (padding) | 12 px, `--muted` | Sair, Menu, Pular, Fechar, links | Nunca o único botão de uma tela de decisão |
| **Perigo** | `.btn.danger` (**refazer**) | **contorno** `#ff6b4c` em fundo `--panel`, texto `#ff6b4c`, sem preenchimento | 44 px | 12 px | Apagar dados, Abandonar copa, Desfazer amizade | Nunca na barra do polegar. Sempre com confirmação num modal, onde o "Apagar" do modal vira o principal |
| ~~Amarelo cheio~~ | `.btn.yellow` | — | — | — | **Aposentar.** Hoje serve pro Substituir e pro Compartilhar, e compete com o vermelho (Campeão tem 2). O amarelo cheio fica só pra seleção (`.bc-seg .on`) e etiqueta (`.bc-tag`), como no guia | — |

Estado desabilitado: o principal **continua visível**, com 45% de opacidade e o motivo embaixo ("Escolha 1 carta").
Nunca some.

### 3.2 Onde fica

- **Celular (≤ 700 px ou deitado baixo):** o principal mora na `.bc-thumbbar`, sempre. Com 2 botões na barra: fantasma
  à esquerda (1/3), principal à direita (2/3). Com 1: largura cheia. Nada de 3. O `env(safe-area-inset-bottom)` já
  está na barra, mas **o `index.html` (linha 12) não tem `viewport-fit=cover`**, e sem ele o valor é sempre 0
  ([MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/env)). No Safari comum quase não faz diferença (o
  navegador já reserva a área). Faz quando o jogo é instalado na tela inicial: aí a barra encosta no risco do iPhone.
  Conserto de 1 linha, mas com print no iPhone (o `cover` também muda o topo e o modo deitado).
- **Desktop:** o principal fica no fim do bloco da decisão, centralizado embaixo das opções (Draft, Recompensa) ou à
  direita (Mercado, Escalação). Nunca só no topo da página.
- **Modal:** principal à direita, fantasma "Cancelar" à esquerda.
- **Fala de personagem** (líder, tutorial): enquanto a fala está aberta, a barra do polegar se esconde (hoje a fala
  cobre o vermelho em `23-grupo-m-full`). O "Continuar" da fala é o principal daquele momento.
- **Grade de opções** (Draft, Recompensa, Mercado): mesma moldura e mesma altura em todas. O toque é na opção inteira, e
  o botão dela (quando existe) é secundário.

### 3.3 Toque e retorno

- **Alvo de 44 x 44 px no mínimo** (Apple 44 pt, Material 48 dp, WCAG 2.5.5 com 44 CSS px:
  [Adrian Roselli](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html)). Ícone de 18 px ganha padding até 44.
  No 320 o item da vaga (16 px) nunca é o único alvo (já está no `interacoes-diretas.md`).
- **Ao apertar:** `translateY(2px)` e a sombra de 3 px vai pra 1 px em 60 ms. Já é assim no `.btn`, e deve valer igual
  em `.bc-tile`, `.bc-seg`, carta e vaga. Não trocar por `scale`: a sombra dura e o afundar já são a cara do kit.
- **Ao soltar:** som `select` em todo botão (um lugar só, delegado no `App`), com um tom mais grave no principal.
  Vibração de 8 ms opcional no principal e ao soltar carta na vaga (Android).
- **Foco do teclado:** anel branco de 3 px com 3 px de folga (já existe). A seleção continua amarela.

### 3.4 Texto do botão e escala de fonte

| Fonte | Tamanho nativo | Tamanhos limpos (1x, 2x, 3x) | Uso proposto |
|---|---|---|---|
| Galmuri9 (não carregada hoje) | 10 px | 10, 20 | Etiqueta `.bc-tag`, rótulo minúsculo. Hoje a `.bc-tag` usa Galmuri11 a 10 px (0,83x) |
| Galmuri11 / Bold | 12 px | **12, 24, 36** | Texto de apoio e botão comum (12); rótulo do principal e nome grande (24) |
| Galmuri14 | 15 px | **15, 30, 45** | Texto corrido? (15, a testar); título de tela (30); placar (45) |

- Hoje: corpo em 14 px, e os tamanhos mais usados são 12 (161x), 11 (96x), 13 (84x) e 10 (61x). Só o 12 é nativo. Com
  `-webkit-font-smoothing: none`, escala quebrada deixa traço de 1 px ao lado de traço de 2 px.
- **Ressalva honesta:** num celular com 3x de densidade, 14 px vira 42 px físicos e o defeito quase some. Ele aparece
  mesmo no desktop comum (1x) e no 2x. Por isso: **prints em 1440 lado a lado, Miguel escolhe.**
- **Conflito com a revisão:** a escala de 6 degraus da `revisao-design.md` (10/12/14/16/20/28) tem só o 12 nativo.
  Proposta: **10 / 12 / 15 / 24 / 30 / 45**, com o corpo em 12 (Galmuri11) ou 15 (Galmuri14), decidido no print.
- **Contraste no principal:** branco sobre `--red` dá 4,0 (tabela do guia). Pela WCAG só passa em texto grande (≥ 18,7 px
  em negrito). Duas saídas: (a) rótulo do principal em 24 px (2x da Galmuri11, limpo e grande; "Jogar oitavas de final"
  cabe em ~290 px num 390), ou (b) principal pequeno com fundo `--red-dark` (6,4). Recomendo (a) na barra e (b) no
  principal de modal.

### 3.5 Quantos vermelhos cada tela tem hoje (contagem nos prints e no código)

| Tela | Hoje | Proposto |
|---|---|---|
| Home | Nova copa (pequeno) + 2 primários no código (`Home.tsx`) | 1: Nova copa na barra |
| Draft (capitão) | 3 "Escolher capitão" | 0 até escolher; depois 1 "Confirmar" (ou nenhum, se a vaga resolve) |
| Recompensa | 3 "Escolher/Contratar" | Toque na opção; "Pular" fantasma + "Confirmar" na barra |
| Mercado | Seguir (no topo) | Seguir na barra; Comprar em contorno (já é) |
| Escalação | Jogar (barra que aparece no meio do scroll) | Jogar na barra desde o início |
| Resultado | Escolher recompensa (ok) | Igual, já é o modelo |
| Campeão | 2 vermelhos + 2 amarelos | 1 vermelho (Nova copa) + 2 contorno |
| Amigos | 8 primários (`FriendsTab.tsx`) | 0 primários: "Desafiar" e "Adicionar" em contorno |
| Configurações | "Apagar dados" vermelho cheio | Perigo em contorno + modal |

---

## 4. O que tirar ou esconder (conciliado com a `revisao-design.md`)

"Rev." = número do item na seção 2 da revisão. Concordo com todos os itens da revisão. Esta pesquisa acrescenta os
marcados com **+** e ajusta os marcados com **~**.

| O quê | Rev. | Posição | Por quê (referência) |
|---|---|---|---|
| 4 cartões "Em breve" da Home | 1 | Concordo | Clash e Snap só mostram o que dá pra jogar; o futuro fica atrás, nas Novidades |
| Rota Índigo trancada e Liga com contagem na Home | 2, 3 | Concordo | Um cadeado na 1ª tela é "jogo inacabado". O TCG Pocket mostra o timer, mas é porque o pacote é a ação principal |
| Chave completa na Escalação e no Resultado | 4, 5 | Concordo | Mesma informação duas vezes; a fileira de 4 fases é a 2ª leitura |
| Craque e "virou Destaque" separados | 6 | Concordo | Um bloco "Destaques" |
| Resultado da final embaixo do Campeão; elenco com 10 números | 7, 8 | Concordo | Três leituras: números são a 3ª |
| `<Tip>` fixo no topo | 9 | **~ Concordo, e mais:** dica só na 1ª copa **e** perto da coisa que ela explica, nunca no topo repetindo o título | Snap libera explicação no momento de usar |
| Bolinhas de "novo" | 10 | Concordo | [Braze](https://www.braze.com/resources/articles/beware-red-dot-badging) |
| Perfil duas vezes, 3 caminhos pra Ajuda, idioma no rodapé | 11, 12, 13 | Concordo | — |
| Configurações avançadas | 15 | Concordo | Balatro deixa à vista velocidade, posição dos botões, tremida e contraste; o resto é fundo |
| 10 filtros na Sala; 46 treinadores abertos | 16, 17 | Concordo | — |
| "Lances" na barra de velocidade | 18 | Concordo | — |
| **+** `.btn.yellow` (amarelo cheio) | — | Aposentar | Compete com o vermelho; vira contorno |
| **+** "Pular (+1 reroll)" como botão de contorno no topo da Recompensa | — | Vira fantasma na barra | StS e Balatro: pular existe, mas não chama atenção |
| **+** "Trocar vitrine" e "Seguir" lado a lado no topo do Mercado | — | "Seguir" desce pra barra; "Trocar vitrine" fica no topo como comum | A ação que avança mora embaixo |
| **+** Boas-vindas em 3 páginas | — | Some (vira dica no lugar) | 45% saem ali; Snap não tem tela antes da 1ª partida |
| **+** Barra "Monta pra mim" cobrindo a 3ª carta no 320 | — | Vira fantasma dentro da barra do polegar, à esquerda | Revisão §5 já viu o problema; isto resolve sem padding extra |
| **+** Patrocínios só com ícone no topo do mapa (`22-mapa-meio-m`) | — | Nome cortado ou "2 patrocínios" que abre | Revisão §3 (Mapa, item 1); Clash: info "à mão", nunca enigma |
| **~** Escala de fonte da revisão (10/12/14/16/20/28) | §4 regra 2 | Trocar pela escala nativa (3.4) | README da Galmuri |
| **~** "Substituir" largura cheia na partida | §3 Partida 3 | Concordo, e com o pega e põe ele só leva pra prancheta | — |

Não tirar (a pesquisa reforça): o Duelo, a Copa do Dia (é o Daily Climb), o Mercado, a Rota, os Melhores momentos e o
Compartilhar (são o boca a boca de um jogo sem anúncio).

---

## 5. Game design da copa: ideias em ordem

O que os números dizem (13 a 20/10, `copa-roguelike.md`): 5,4 copas por sessão, 86% em 8x, 79% na tática equilibrada,
65% no 1-2-1, só 14% pulam a recompensa, 22% de títulos, 45% saem nas boas-vindas e 56% jogam no celular. Ou seja, o
loop curto funciona, a partida é o dado rolando e as decisões que contam acontecem **entre** as partidas. Tudo aqui é
regra de jogo, então tudo é **sim** pro Miguel (com antes/depois e `npm run calibrate` onde mexer em números).

| # | Ideia | O que muda | Por que (referência) | Esforço |
|---|---|---|---|---|
| 1 | **Primeira copa guiada + piso de nota no draft** | Na 1ª copa: draft com uma opção boa garantida por rodada (o "piso de nota" já está no `jogo-gostoso.md`), oitavas contra um rival mais fraco e uma dica por tela. Da 2ª em diante, normal | Snap garante uma carta jogável na mão inicial em vez de complicar com mulligan ([MobileGamer](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)). Ataca o vazamento de 45% | M |
| 2 | **Prévia do rival que diga o que fazer** | Na Recompensa, no Mercado e na Escalação, o próximo rival aparece com 1 frase acionável: "Cerulean: 3 de Água, rápidos. Elétrico e Planta vão bem". Hoje ele aparece só como sprites | Into the Breach e StS mostram a intenção do inimigo, e aí a escolha vira plano ([Gage](https://gigazine.net/gsc_news/en/20180501-game-design-subway-legibility/)); FM24 mostra forças e fraquezas ([FM](https://www.footballmanager.com/features/football-manager-2024-mobile-new-features-revealed)) | P a M |
| 3 | **Sinergia com degraus visíveis** | Contador "Água 2/3" no draft e na prancheta. O degrau seguinte aparece em cinza ("3 de Água: +6% e chuva na quadra") | TFT: o trait tracker com degraus é a decisão do draft ([Dot Esports](https://dotesports.com/tft/news/tft-set-12-trait-cheat-sheet-all-traits-and-breakpoint-abilities)). Já está no `jogo-gostoso.md` como "planejar" | M |
| 4 | **Meta opcional por partida** | Antes de cada jogo, uma meta curta e visível que paga ₽ ou um reroll: "Vença sem sofrer gol: +₽3", "Faça 2 gols com Fogo: +1 reroll". Dá motivo pra mexer na tática e na formação (hoje 79% e 65% nunca mudam) | Balatro: o boss blind muda a regra de cada fase; Snap: o cubo dobra o que está em jogo e deixa o risco legível ([GDC Vault](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP)) | M |
| 5 | **Ligas de dificuldade** (já aprovada como ideia) | Depois do 1º título, "Liga 1" soma uma regra (rival +2, Mercado mais caro, um banco a menos…), até ~10. Selo da maior Liga no capitão do Hall e na carta do clube | StS Ascension: uma regra por nível, por personagem ([wiki](https://slaythespire.wiki.gg/wiki/Ascension)); Balatro: selo de stake no baralho ([wiki](https://balatrogame.fandom.com/wiki/Stickers)). Com 22% de títulos, já tem gente pronta pra subir | M |
| 6 | **"Nova copa" instantânea + mesma seed** | Ao cair: "Nova copa" em 1 toque, com o mesmo nome e formação (pula a tela de formação), e "Tentar esta copa de novo" (mesma seed) como secundário. "Desafiar um amigo nesta seed" reaproveita o link de seed | Balatro deixa copiar a seed ao perder; Super Hexagon recomeça em milissegundos ([itch.io](https://itch.io/post/14916468)). 5,4 copas por sessão: o recomeço é o loop | P |
| 7 | **Mercado: reroll que sobe + segurar 1 oferta** | O reroll pago sobe ₽1 a cada uso e volta ao preço base no Mercado seguinte; "Segurar" 1 carta pro próximo Mercado (1 por vez) | Balatro ([wiki](https://balatrowiki.org/w/Shop)); congelar do Super Auto Pets ([guia](https://www.twoaveragegamers.com/ultimate-guide-to-super-auto-pets-game-mechanics/)). Dá ao ₽ guardado mais um uso além dos juros | P |
| 8 | **Bênção do Oak** (início da copa, 1 de 3) | Já está no `jogo-gostoso.md`: "+₽6 agora", "1 reroll a mais no draft", "seu capitão começa com Leftovers". Uma escolha de 10 s que dá identidade à copa | Neow do StS | P a M |
| 9 | **Ritmo da partida pra quem repete** | Velocidade inicial lembrada (já existe) e, a partir da 3ª copa, oferecer "Só os lances" como padrão, com a quadra cheia nos gols. Nunca tirar a partida inteira | Balatro deixa jogar a 4x ([Steam](https://steamcommunity.com/app/2379780/discussions/0/4346606879508270539)); Snap tem partidas de menos de 4 min. Dado: 86% em 8x. **Atenção à regra "teste olhando o jogo"** | P |
| 10 | **Recuar com dignidade** | Com 3 gols atrás no 2º tempo, um "Jogar a próxima" que encerra a copa salvando a campanha e os momentos, com tom de "escapou", não de "desistiu" | Snap: o recuo é escape, não derrota ([MobileGamer](https://mobilegamer.biz/second-dinner-s-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)) | P |

### Retenção sem armadilha (regra, não ideia)

O Soccermon nunca cobra, então não tem motivo pra usar os padrões escuros "temporais" e "sociais" de Zagal, Björk e
Lewis (2013): grind, horário marcado, pagar pra pular, pirâmide de amigos ([deceptive.design](https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games)).

| Pode (prende pela vontade de jogar) | Não pode (prende pela culpa ou pelo relógio) |
|---|---|
| Copa do Dia com a mesma seed pra todo mundo (Daily Climb) | Timer pra abrir pacote (TCG Pocket: 12 h, ampulheta) |
| Ligas de dificuldade, Platina, Hall, Álbum | Calendário de login de 28 dias (Snap, patch de nov/2025: [MSZ](https://marvelsnapzone.com/marvel-snap-november-18-2025-patch-notes/)) |
| Desafiar amigo na seed | Sequência que zera se faltar um dia |
| "NOVO" no que é novo de verdade | Bolinha vermelha pra puxar a pessoa de volta |
| Recompensa visível antes da escolha | Caixa surpresa com chance escondida |

O recorde de títulos seguidos (`Records.streak`) é sequência **de vitórias**, não de dias. Pode ficar.

---

## 6. Fontes

Jogos e design:
- Clash Royale, UX: [The Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)
- Marvel Snap: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction),
  [onboarding e cartas (MobileGamer)](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/),
  [receita de Ben Brode (MobileGamer)](https://mobilegamer.biz/second-dinner-s-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/),
  [GDC 2023 "Designing MARVEL SNAP"](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP),
  [patch de 18/11/2025](https://marvelsnapzone.com/marvel-snap-november-18-2025-patch-notes/)
- Pokémon TCG Pocket: [crítica de design (Pratt IxD)](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/),
  [confusão com os pacotes (Filibuster)](https://thefilibusterblog.com/fans-express-confusion-over-pokemon-tcg-pocket-ui-after-new-expansion-launch/),
  [ritmo dos pacotes (Pocket Tactics)](https://www.pockettactics.com/pokemon-tcg-pocket/card-acquisition)
- Balatro: [Loja (wiki)](https://balatrowiki.org/w/Shop), [economia (games.gg)](https://games.gg/balatro/guides/balatro-economy-guide/),
  [selos de stake (wiki)](https://balatrogame.fandom.com/wiki/Stickers), [ajustes (Steam Deck HQ)](https://steamdeckhq.com/ja/game-reviews/balantro/),
  [velocidade (Steam)](https://steamcommunity.com/app/2379780/discussions/0/4346606879508270539),
  [seed ao perder (Steam)](https://steamcommunity.com/app/2379780/discussions/0/4346607305576903701)
- Slay the Spire: [recompensa de carta](https://slay-the-spire.fandom.com/wiki/Card_Rewards), [Ascension](https://slaythespire.wiki.gg/wiki/Ascension),
  [Custom/Daily](https://slaythespire.wiki.gg/wiki/Custom_Mode), [tipos de casa](https://slaythespire.wiki.gg/wiki/Map_Locations),
  [GDC 2019, metrics-driven design](https://www.gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019)
- Zach Gage, "três leituras" (com Into the Breach): [Gigazine](https://gigazine.net/gsc_news/en/20180501-game-design-subway-legibility/)
- EA FC: [Playtesting FC24](https://www.ea.com/playtesting/news/playtesting-ea-sports-fc24)
- Football Manager 24 Mobile: [novidades](https://www.footballmanager.com/features/football-manager-2024-mobile-new-features-revealed)
- Backpack Battles: [Wikipedia](https://en.wikipedia.org/wiki/Backpack_Battles); Super Auto Pets: [guia](https://www.twoaveragegamers.com/ultimate-guide-to-super-auto-pets-game-mechanics/)
- Pokémon Unite: [Digital Trends](https://digitaltrends.com/gaming/pokemon-unite-review), [Destructoid](https://destructoid.com/pokemon-unite-next-season-starts-after-maintenance-today)
- TFT, degraus: [Dot Esports](https://dotesports.com/tft/news/tft-set-12-trait-cheat-sheet-all-traits-and-breakpoint-abilities)

UX, game feel e acessibilidade:
- Hoober, como seguramos o celular: [UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php),
  [Smashing](https://smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/)
- Tamanho de alvo (44/48, WCAG 2.5.5): [Adrian Roselli](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html)
- Um primário por tela: [Red Cross DS](https://design.redcross.org.uk/components/buttons), [Basis DS](https://design.basis.com/components/buttons),
  [Cieden](https://cieden.com/book/atoms/button/how-to-create-button-hierarchy)
- Bolinhas: [Braze](https://www.braze.com/resources/articles/beware-red-dot-badging), [UX Collective](https://uxdesign.cc/badge-notifications-why-everyone-wants-to-get-rid-of-them-decedb28b46d)
- Juice: ["Secrets of Game Feel and Juice" (GMTK)](https://amara.org/v/C3BGA), [Game Developer](https://www.gamedeveloper.com/business/has-your-game-got-juice-more-)
- Vibração na web e iOS: [azukiazusa](https://azukiazusa.dev/en/blog/ios-safari-web-haptics), [rapidtoolset](https://rapidtoolset.com/en/tool/ios-haptics-tester)
- Fonte pixel: [Galmuri (README)](https://github.com/quiple/galmuri), [Kirupa](https://www.kirupa.com/hodgepodge/preserving_pixel_art_aesthetics.htm)
- Área segura: [MDN env()](https://developer.mozilla.org/zh-CN/docs/Web/CSS/env)
- Recomeço rápido: [comentário no itch.io](https://itch.io/post/14916468)
- Padrões escuros: [Zagal, Björk e Lewis (deceptive.design)](https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games),
  [Chalmers](https://research.chalmers.se/en/publication/177148)

**O que não deu pra confirmar com fonte:** a posição exata dos botões no Balatro, no StS e no Snap (marcadas como
"obs." na seção 1) e qualquer coisa de dentro sobre a interface do Monster Train. As palestras da GDC (Snap, StS, Into
the Breach) estão atrás de login; usei os resumos.
