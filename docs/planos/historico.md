---
description: Histórico por versão (0.8.0 a 0.9.x) que saiu do CLAUDE.md.
---

# Histórico do Soccermon

Histórico por versão (0.8.0 a 0.9.x), tirado do CLAUDE.md em 21/10/2026 para enxugá-lo. Texto copiado fiel.

## 0.9.49 · Menos e melhor (11/11/2026)

Sem motor novo (29). Plano menos-e-mais: abas acendem pela progressão (`ambEarned`/`ambLit` em src/store/coach.ts, save antigo com as 5 acesas), Liga escondida até `LIGA_OPENS_AT` − 7 dias (`ligaShown`), Metas (missões + medalhas) e Perfil na Sede, MT fora da vitrine do Mercado, Configurações com 4 opções à vista + Mais opções, Ajuda sem o passo a passo e com 9 regras. Dribles com pose própria (`dribblePose` em src/ui/match-view.ts). Chapéu como 4º drible (a vaca foi feita e tirada: o Miguel não curtiu); faixa do drible mais calma (`calm`). Sincronia: o quadro de impacto do ataque cai no tick em que a bola sai (`strikesNear`/`kickDepartures`). Prancheta e VERSUS de volta aos GIFs clássicos em pixel exato (`pixelFit` em src/ui/ambientes/sprite-scale.ts); VERSUS em pé centrado, os de trás maiores (`--k`/`--lift`).

## 0.9.48 · Fixo no jogo (10/11/2026)

Motor 29 (`liga` republicada): `fixoPass: 0.3` só na 3-1, o ala no nosso campo que vai passar prefere o fixo (armações com o fixo 34% ⇒ 51%). Números em balanceamento-geral.md.

## 0.9.47.2 · Números certos no PC (10/11/2026)

Galmuri14 com o zoom do PC: `--gz` (zoom acumulado) em todo `zoom`, regras de Galmuri14 com `--gs` + `font-size: var(--gfs, …)`; a conta (round/sign/abs, dentro de `@supports`) leva o tamanho efetivo pro vizinho bom de 17/18/22/28/40. Ruins a 1920: 144 ⇒ 0.

## 0.9.47.1 · Seu nome em todo lugar (10/11/2026)

Nome do treinador numa regra só (`trainerNameOf` em src/store/profile.ts): o escolhido, senão o 1º nome do Google (ok do Miguel pro ranking público), senão "Treinador"; `publicInfo` e a barra usam a mesma. Lápis no Perfil. iOS standalone (`navigator.standalone`) usa o login por redirect em vez do popup do GSI (`gsiAllowed`); não testado num iPhone.

## 0.9.47 · Final de verdade (10/11/2026)

Sem motor novo (28). Equilíbrio da Rota aprovado pelo Miguel: derrota na 1ª partida sem amarelo (cartão "Sem cartão"), rival da Final sem `crowd` (73% ⇒ 64% de vitória do robô na Final; título 30% ⇒ 32%), Evento "?" garantido nas linhas de parada (0,41 ⇒ 0,71 por Rota). Galmuri14: título de tela 21 px, nota da carta `round(nearest, 2.9em, 3px)`. Selo de treinador novo em uma linha; Sala de troféus com parede/piso em CSS até `room:ready`. Números em balanceamento-geral.md.

## 0.9.46 · Rota viva (10/11/2026)

Sem motor novo (28). Rota: Cassino com rolos e "quase" no 3º, roleta do balcão de prêmios, Centro com a Enfermeira Joy (máquina de 6 vagas, jingle centro.mjs), Safari com a bola em arco e 1–3 balanços, mapa com o capitão PMD andando, casas acendendo, placa de região e painel no PC; pedra sem uso vira linha no prêmio; roteiro em src/ui/rota-reveal.ts; telemetria `casa`/`linha` no evento `screen`. Revisão geral: fade das abas com `backwards` (o `both` prendia modais), Galmuri14 fora de 17/18/22/28/40 px (teste galmuri14-size), selo NOVO, celular deitado, cor do ginásio antes da quadra. Fluidez: brilho do pacote e barra das Novidades por transform. Planos: rota-indigo-2.md.

## 0.9.45 · Festa de campeão (10/11/2026)

Sem motor novo (28). Animações de título só no título (`titleCeremony` em src/store/long-cup.ts): taça curta de pixel em toda copa ganha, invasão da torcida no título da Rota (src/game/ceremony.ts), insígnia na 1ª vitória contra cada líder (jingle insignia.mjs), Estádio campeão (ola + LED); desfile do Hall só na Rota e no 1º título de cada modo; créditos guardados pro Modo História. Comemoração de gol por espécie (`comemoracaoOf`), dribles com nome (DRI de campo ≥ 78, 18 m, até 2 por time), goleiro com mergulho visível. Time Ultimate: moeda única (1 ponto = 5 Fichas), Pick ×16 (160/400/960), brecha do Pick fechada. Arte: escala inteira por cena (sprite-scale.ts), PMD no VERSUS/Hall/escalação, Cassino e Safari em pixel, Hall azul, folhas do menu (`npm run assets:menu`). Planos: animacoes-novas.md, revisao-arte.md, ultimate-fc.md.

## 0.9.44 · Véspera do Time Ultimate (09/11/2026)

Motor 28 (evolução sem perda: a carta que evolui herda o maior de cada atributo das formas anteriores e mantém a habilidade que mexe em atributo; `evolvedFrom`). Time Ultimate com cara de FC (Meus pacotes, Abrir todos, Pokémon Picks, Início em blocos, aba Jogar), Rota A+B (Pular com etiqueta, PC do Bill, Folga, Mochila, mapa largo `mapV`, Ás, Safari, Cassino, Planalto), carta mostra o valor em campo (▲ = bônus, teto 99 na carta), Golpedex com especiais e bicudas, Novidades em tela cheia, goleiro nunca de costas. Planos: ultimate-fc.md, rota-indigo.md, evolucao-sem-perda.md, noticias.md, menos-e-mais.md.

## 0.9.43 · Torcida a favor (05/11/2026)

Motor 27, pedido do Miguel (muita zebra contra o jogador, só no PVE): `TeamSetup.crowd` nos rivais da Copa e da Rota (−4%, −7% nas 3 primeiras da Rota; modificador visível no painel do rival), rival evolui com 14 como o jogador (a Liga também, o fantasma usava 10). Duelo, Liga e Time Ultimate sem torcida. `match_end` registra `delta` (diferença de nota). Números em `balanceamento-geral.md`.

## 0.9.42.2 · Capitão chamado (05/11/2026)

Motor 26: capitão de linha chamado conduz até a zona em qualquer vaga (antes só o fixo) e o time passa mais pra ele (ala/pivô +0,35 ⇒ +0,8; fixo +0,08 ⇒ +0,3); a bicuda armada continua pro próximo chute se o do rival não chega no goleiro. O técnico IA só usa a hora certa e não muda. Números em `balanceamento-geral.md`.

## 0.9.42.1 · Bicuda sempre sai (05/11/2026)

Motor 25: a bicuda do goleiro capitão sai em qualquer toque (o toque só gradua a força); N1/N2 sempre lançam pro companheiro, inclusive no counter; N3 sempre chuta no gol (o duelo da bicuda pede toque bom ou perfeito). Antes o toque fora virava a defesa de sempre e gastava a barra (relatos de "N3 defendendo em vez de chutar"). Simulação, N3 do goleiro com toque fora: 0% ⇒ 67% de gol.

## 0.9.42 · Monotipo (05/11/2026)

Motor 24: sinergia de monotipo (5 em quadra do mesmo tipo +12%, 6 no elenco +16%, 7 +22%; `rest` do elenco no `TeamContext`), sem o teto de +15% de tipo × história; líderes de ginásio temáticos (4 titulares do tipo, capitão do tipo, sem contra-tipo nem lendário fora do tipo, Final da Liga livre; oitavas -2 com 1 item; fala de monotipo no VERSUS). As 26 mudanças da revisão de organização de telas (Escalação em linhas-resumo com sheet, Resultado enxuto, partida no PC em 900 px com escanteio e goleiro-linha na aba Time, Perfil só o cartão, Ajuda em 4 blocos, uma dica por sequência). Números em `balanceamento-geral.md`.

## 0.9.41.1 · Fim da Rota (04/11/2026)

Nova copa no resultado do fim da Rota derrubava no ErrorBoundary (a tela saindo segurava a partida velha com a Rota nova sem rivais): `useHeldPair` em `src/ui/use-held.ts` segura copa e partida juntas. Campeão da Rota conquista a Liga Índigo. Atalho `?demo=rota-fim&venceu=1|0`.

## 0.9.41 · Golpes de cinema (04/11/2026)

O nível de produção do Counter em todo golpe máximo, aprovado pelo Miguel por vídeo: N3 com corte pro capitão, ângulo holandês, quadro de impacto, rastro e TypeFx, história por tipo (`src/game/n3-story.ts`) e toque próprio nas 12 assinaturas, letreiro parado 1,6 s (+0,2 s no lance); N2 com close curto e a onda que derruba desenhada no chão; N1 na cor do tipo com letreiro colado em quem chutou (1,3 s, +0 s); bicudas com o revide curto do Counter. Peças prontas na abertura (`prewarmImpactFrame`) tiram o engasgo. Duelo: o convidado volta à velocidade normal quando o fim está gravado na sala (`src/net/session.ts`). Motor sem mudança.

## 0.9.40 · Counter (03/11/2026)

Motor 23: o duelo da bicuda volta aprovado pelo Miguel na v3 (tempo parado no contato e bicuda de primeira, câmera de cinema com plano e contraplano, ângulo holandês, painéis de mangá, kit `src/game/cine.ts`; falas reescritas com piada boba; faixas 2,3 s, GOOOOL!/BICUDA! 2,8 s, voo 3,3 s; parada 15,25 s e comemoração 8 s). Walkout v3: fundo por raridade, vidro só nas edições, efeito do tipo na carta ouro (16, `walkout-type-fx.ts`), telões no ouro, curto de 3 s, `themeTypeOf` decide o tipo do telão, do efeito e do fundo da carta; o gravador grava na GPU e no relógio da cena (o SwiftShader e o relógio real deixavam os vídeos errados). Próximo: o mesmo nível de produção nos golpes máximos N1/N2/N3 e nas bicudas.

## 0.9.39.1 · Bicuda de volta (03/11/2026)

A cutscene da bicuda e o walkout polido subiram na 0.9.39 sem o Miguel ter visto. Motor 22: `MatchConfig.showdown` desligado no FUTSAL_5 (bicuda N3 contra N3 volta ao counter do motor 20; só o `?demo=bicuda` abre o duelo) e o walkout volta aos tempos da 0.9.38 (o polido é o commit 1295770e, revertido). Os dois esperam o ok dele em cima dos vídeos.

## 0.9.39 · Duelo da bicuda (03/11/2026)

Motor 21: bicuda N3 do goleiro capitão contra o N3 do rival para a partida 9 s (fase `showdown`) numa cutscene com falas (16 pares, linha evolutiva, 14 solos, genéricas; escolha pelo tick), e a bicuda é gol garantido com comemoração de 6 s. Rival também faz, sem pular. Sugestões dos jogadores (sinergias na aba Time, +Tipo nas cartas do draft, carta em campo na prancheta, selo NOVO, seu time no Caminho do título), walkout polido (jogadas mais calmas, tiers +6 a 10%) e as 8 sugestões do QA.

## 0.9.38.2 · Fixo de secundária (03/11/2026)

Motor 20: Snorlax (Fixo 59 ⇒ 77), Lickitung (49 ⇒ 64) e Wigglytuff (37 ⇒ 48) ganham Fixo de secundária em `POSITION_OVERRIDES`, a pedido do Miguel e com prioridade. Calibragem (n 200) dentro do ruído: 7,88 ⇒ 7,50 gols/jogo, favorito 68,8% ⇒ 68,6%. 0.9.38.1: 12 consertos de tela da varredura da madrugada.

## 0.9.38 · Walkout (03/11/2026)

Walkout V2 (estádio no Phaser, placa e `FutCard` do React, telões com tipo e posição, silhueta, jogada com bola por espécie, vidro quebrando) no pacote do Mercado e no do Time Ultimate; 3 níveis, encolhe do 2º raro e 3º muito raro no dia. Time Ultimate inteiro na main (save v10), escondido até `ULTIMATE_OPENS_AT` (27/11 00:00 BRT): Início estilo hub do FC, Clube com filtros, Elenco por posição, Pendentes (venda rápida, trocar, resgatar, teto 30), aviso do último dia, rival do Fácil justo. 0.9.37.1: Copa Relâmpago centralizado e saiu o letreiro SMN flutuante.

## 0.9.37 · No ar (02/11/2026)

O Miguel comparou o protótipo `?lab=tv` e aprovou tudo: corte de TV diagonal como transição padrão (280 ms, fade com reduzir movimento; ADR 0004 atualizado), letreiro do canal (bug SMN + faixa da tela, AO VIVO na partida, procura lugar sem cobrir controle) e o menu Smash simplificado com toques de TV. A grade de programação saiu. Arrastar entre abas no celular intacto (passo novo na fumaça).

## 0.9.36 · Lab, Sede e Créditos (02/11/2026)

Cara de jogo: Lab e Sede com objetos da cena (SceneHotspot) no lugar dos botões azuis, Créditos rolando com sprites e a ultima-partida, placar de TV no Grupo e no Campeão (Ver tudo em Sheet), letreiro da Liga na Arena, achados 20 a 22 da hierarquia. Protótipo `?lab=tv` (corte diagonal, letreiro de canal, grade de programação) só em dev e prévia, pra o Miguel comparar; ele quer o menu Smash mais simples com toques de TV e manter o arrastar entre telas.

## 0.9.35 · Prancheta no draft (02/11/2026)

O Miguel achou feia a grade de mini cartas do draft no PC: na escolha 1 de 3 o time é a mesma prancheta (FormationBoard) do passo de posição, deitada no celular em pé. Revisão de hierarquia (achados em pesquisa de 02/11): Nova copa único botão grande, títulos 22/26 px em caixa normal, Galmuri14 sem negrito sintético, verde só confirma e azul navega, toque 44 px, texto ≥11 px; brand guide atualizado. Liga deployada no motor 19.

## 0.9.34 · Tudo à vista (02/11/2026)

O Miguel não gostou da partida de TV no PC nem de tática e formação escondidas em sheets: volta o painel antigo da partida no PC (desfaz da8cd9e4), Escalação com táticas, formações e escanteio abertos, draft com o time numa quadrinha, fim de partida rolando de novo (Destaque, evoluções, estatísticas) e o botão do golpe máximo na Copa só com a bola no pé do capitão (sem o "chamar"); motor 19: a ordem do golpe fica armada até o próximo chute do capitão (conserta o Duelo).

## 0.9.33 · Partida de TV (02/11/2026)

Cara de jogo fase 3: partida no PC com o layout do celular (barra de 4 botões, Sheets, legenda de TV), torcida em volta da quadra no 4x/8x, intervalo em placar de TV; Escalação com placas, Mercado com prateleiras, Treino/Evento/Grupo da Rota em cena; draft do Duelo no palco; Arena deitada sem rolar; Coleção com seletor; desbloqueio como selo.

## 0.9.31 e 0.9.32 · Golpe máximo de verdade e Cara de jogo (02/11/2026)

0.9.31: N1–N3 novos, N1 por tipo, goleiro só espalma golpe máximo, câmera descentralizada, cara de jogo fase 1 (kit). 0.9.32: fase 2 da cara de jogo (escopo C) com Duelo, Liga e Copa do Dia na Arena; Perfil armário; Sala de troféus em tela cheia; Novidades cartaz; Configurações em abas; Draft sem rolar, formação em carrossel e dicas sem véu.

## 0.9.30 e 0.9.30.1 · Golpe universal (01/11/2026)

No ar: 0.9.30 "Golpe universal" (bicuda do goleiro capitão, pedras na Rota) e 0.9.30.1 (menu de modos sem pisca, EM BREVE claro). Motor 17 (`liga` 17).

## 0.9.29 · Rota nova (31/10/2026)

No ar: 0.9.29 "Rota nova" (Rota redesenhada: ramos com tipo, prêmio à vista, rival em todo Jogo + prêmio, Ginásio +2, até 2 Mercados, Centro Pokémon, 6 eventos novos; menu de modos estilo Smash com Time Ultimate e selos EM BREVE; pênaltis com o chute no menu e a câmera com o gol). Motor 16 (`liga` 16).

## 0.9.28 · Golpe caprichado (30/10/2026)

No ar: 0.9.28 "Golpe caprichado" (anel-alvo e estouro do golpe máximo, sons do pacote D, N3 a 10 pontos por nível, porta Sede→Sala, Novidades na barra de cima, logo piscando em todo lugar, música menu-balanco, coerência dos menus, símbolo do Soccermon na taça e no escudo, desempenho, consertos da Rota). Motor 16 (`liga` 16).

## 0.9.27 · Modos de jogo (30/10/2026)

No ar: 0.9.27 "Modos de jogo" (menu de modos Copa · Treinador · História pra quem já jogou; anel do golpe máximo na batida, chamar o capitão, defesa máxima só no N3 e só gasta quando defende). Motor 15 (`liga` 15). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.26 · Escudos (29/10/2026)

No ar: 0.9.26 "Escudos" (escudo de verdade do clube dos amigos; 0.9.25 "Amigos": perfil de qualquer treinador, pedir amizade e desafiar). Partida nova padrão (`?lab=hud-off` volta a antiga). Motor 14 (`liga` 14). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.24 · Beira da quadra (28/10/2026)

No ar: 0.9.24 "Beira da quadra": a partida nova é a padrão (`?lab=hud-off` volta a antiga), eventos `match_skip`, `duel_join` e `duel_match_end` (migração em produção), logo de volta na tela inicial. Motor 14 (`liga` 14).

## 0.9.23.3 · Pedidos dos jogadores (27/10/2026)

No ar: 0.9.23.3 (N3 82%), 0.9.23.2 "Faxina" (kit calmo; tela grande com `zoom` na raiz: use `calc(N * var(--vw))` e `uiZoom()`, não vw/vh). `?lab=hud` = partida nova. Motor 14 (`liga` 14). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.23.1 · Ajustes nos lugares (26/10/2026)

No ar: 0.9.23 "Vestiário" (lousa, sheets, barra da copa, momento, menus, instalável). 0.9.23.1 (sem teleporte, Arena) na `consertos-0923`. Partida nova atrás de `?lab=hud`. Motor 13 (`liga` 13). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.22 · Botão de apertar (26/10/2026)

No ar: 0.9.22 (kit de botões com relevo, cor por função, painel com placa; ambientes desde a 0.9.21, `?lab=off` = Home antiga; motor 13, `liga` no 13). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.17 · Nível 3 de especial e quem leva o golpe (23/10/2026)

No ar: 0.9.16 (golpe máximo por tipo; `ENGINE_VERSION` 12, `liga` no motor 12), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago, Duelo melhor de 3. Prévia `int-0917`: 0.9.17 (N3 de especial; motor 12). Liga fechada até `LIGA_OPENS_AT`.

## 0.9.16 · Golpe máximo por tipo e 4 Patrocínios (23/10/2026)

No ar: 0.9.16 (golpe máximo por tipo e 4 Patrocínios; `ENGINE_VERSION` 12, `liga` com o motor 12), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago e Duelo melhor de 3. Liga fechada até `LIGA_OPENS_AT`. Histórico: [docs/planos/historico.md](docs/planos/historico.md). Índice dos docs: `node scripts/indice.mjs`.

## 0.9.15 · Rota de baby (23/10/2026)

No ar: 0.9.15 (Rota de baby) e 0.9.14 (golpe máximo em 3 níveis; `ENGINE_VERSION` 11, `liga` com o motor 11), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago e Duelo melhor de 3. Liga fechada até `LIGA_OPENS_AT`. Histórico: [docs/planos/historico.md](docs/planos/historico.md). Índice dos docs: `node scripts/indice.mjs`.

## 0.9.5 · Cada formação joga de um jeito (22/10/2026)

No ar: 0.9.5 (formações com comportamento próprio e movesets únicos, `ENGINE_VERSION` 9, Edge Function `liga` com o motor 9), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago e Duelo melhor de 3. Liga fechada até `LIGA_OPENS_AT`; a Copa do Dia segue no ar. Histórico por versão e decisões antigas: [docs/planos/historico.md](docs/planos/historico.md). Índice dos docs: `node scripts/indice.mjs`.

## Estado atual (antigo) (21/10/2026, v0.9.2 · Casa arrumada)

**0.9.2 (21/10):** onda 1 da revisão de design (`docs/planos/revisao-design.md`, `pesquisa-layout-e-game-design.md`):
botões `.btn.outline`/`.btn.danger` em contorno, barra do polegar nas telas da copa, Home com "Nova copa" grande, faixa
"Vem aí", 3 portas, chave num toque, dicas só na 1ª copa, sem boas-vindas na 1ª visita, retorno de toque central em
`src/ui/feedback.ts` (som por tipo de botão, saída triste ao abandonar), Configurações com "Mais opções", e a Sala de
troféus consertada (escala inteira, chão livre em `room-spots.ts`). **A Rota Índigo** quebrou na 1ª partida
em produção (21/10), saiu do ar e voltou na 0.9.2.2 depois de jogada inteira no navegador (9 bugs consertados). Regra:
modo novo só vai ao ar depois de jogado de ponta a ponta na tela, não só pelo robô do store.

## 0.9.1 · Rota Índigo


**0.9.1 (21/10):** Rota Índigo no ar (`LONG_CUP_LIVE` em `src/store/long-cup.ts`; mapa, eventos, fase de grupos e Final,
`?demo=mapa`, `?demo=grupo`), a Copa rápida virou **Copa Relâmpago** com a chave de 16 clubes, Copa do Dia com dias
seguidos e figurinha do dia, nomes únicos, e acréscimos + Pressão final (`ENGINE_VERSION` 7,
`docs/planos/pressao-final.md`). Na 0.9.0.5, tudo na prancheta (substituir, quem recebe, passar item, pênaltis
tocando). **Decisões de 21/10:** o Miguel gosta dos cartões "Em breve" (não tirar: deixar mais leves); a sequência de
dias fica (é sem perda e sem dinheiro); as boas-vindas saem da 1ª visita (passo a passo só na Ajuda, medir o funil).


**0.9.0 (Copa roguelike, etapa 1; proposta e análise em `docs/planos/copa-roguelike.md`, plano em
`docs/planos/copa-roguelike-plano.md`):** a Copa de hoje é a **Copa rápida**; a **Copa longa** (mapa, eventos, etapa 2)
e a **Jornada** (Kanto inteiro, rumo à 1.0) vêm depois. Depois da recompensa de cada vitória (menos a final e a Copa do
Dia, `hasShop`) abre o **Mercado** (`src/engine/shop.ts`, `src/ui/screens/Shop.tsx`, `?demo=mercado`): ₽ por vitória,
gol e sem sofrer gol, juros do guardado, vitrine pela seed (2 Pokémon, pacote de tipo `PackArt`, item ou MT,
Patrocínio). **12 Patrocínios** (`src/engine/sponsors.ts`, até 3 por copa; os de campo entram pela regra única de
bônus como origem `patrocinio`, carta = campo; viram placas na beira da quadra, `drawBoards`). `RunState` ganhou
`money`, `sponsors`, `shop`, `packs` (opcionais, sem migração) e o status/tela `shop`; o painel de "quem sai/quem
recebe" é o mesmo da recompensa (`GainTarget`). Estatísticas `shop_buy`/`shop_leave` e Patrocínios no `run_end`
(migração `20261021200000_eventos_mercado.sql` aplicada em 20/10); seção Mercado no `npm run stats`; robô do Mercado em
`scripts/balance/cup.ts ... mercado`. **Tudo mora no Perfil** (pedido do Miguel em 20/10): a Home tem só a porta do
Perfil e o Perfil tem as da Sala de troféus e da Coleção (`DoorTiles`). Conserto de raiz: trocar de tela adiava o
estado inteiro até a animação; agora só a `screen` espera (`src/store/screen-transition.ts`, com teste). Força do
Mercado: o Miguel joga e sente antes de mexer nos números (calibragem 1 no plano).

Tudo que subiu em 19/10 foi separado nas Novidades em 4 números (decisão do Miguel, 19/10): **0.8.8** Ícone MVP e
conquistas retroativas (o conserto da manhã); **0.8.8.1** Melhores momentos, Copa do Dia e medalhas (o pacotão:
momentos, coleção, treinadores, UX, consertos, fórmula A, Copa do Dia); **0.8.8.2** Logo novo e faixas da torcida
(marca, ícones, pacote com o logo, Liga fechada com timer); **0.8.8.3** Cartas em camadas e álbum de figurinhas.
Número de 4 partes: o npm só aceita semver em `"version"` (fica `0.8.8`), então o número da Home, das Novidades e do
Duelo sai de `"displayVersion"` no `package.json` (`__APP_VERSION__` = `displayVersion ?? version` nos dois
`vite/config.*.mjs`); tags `v0.8.8.1`…`v0.8.8.3`. O Duelo junta só telas do mesmo deploy (versão + `__APP_BUILD__`).

**0.8.8.** Começou como conserto rápido:
Ícone pode levar o MVP e continua Ícone, com selo "MVP n" e +1 por selo (`special.level` no Ícone = MVPs,
`specialBonus`/`iconMvpOpen` em `src/engine/specials.ts`); missões lendárias de campeão também saem do Hall da Fama, e
`withUnlocks` + `markEvolvedPlayed` rodam a cada vez que o jogo abre (`merge` do persist).

**0.8.8.1** (o pacotão):
- **Melhores momentos** (`src/ui/moments.ts`, `Moments.tsx`, `clip-recorder.ts`; `?demo=momentos`): replay dos lances
  na quadra, gol da copa (replay guardado em `StageResult.replay`, some se o `ENGINE_VERSION` mudar) e clipe 9:16.
- **8 consertos** (sequência de títulos, nuvem, Ícone da recompensa, Duelo Time pronto e troca do intervalo); a
  Pokédex divide a passagem de quem evolui entre as duas formas (`preEvo` no `recordResult`, sem dobrar minutos).
- **Medalhas e clube** (`src/store/medals.ts`, `club-kit.ts`, tabela aprovada em `docs/planos/medalhas.md`;
  `?demo=colecao&perfil=medalhas`, `?lab=versus`): 20 medalhas retroativas, vitrine de 3, escudo e uniforme.
- **Treinadores e quadras** (`src/engine/rival-coach.ts`, `src/game/court-themes.ts`; `?lab=quadras`,
  `?demo=lider&clube=<id>`): falas dos líderes, quadra por ginásio e rival que reage só com a beira da quadra ligada
  (aviso de 10 s, `RIVAL_COACH.leadTicks` 200).
- **Emotes 2 e conta** (`?lab=emotes&modo=copa`): rosto do capitão evoluído, silenciar, pose no "Vamooo!", líder da
  Copa reagindo; vincular a conta anônima do Duelo ao Google (`linkIdentity`).
- **Conquistas** (`?demo=platina`): tarefa cumprida em tudo que se ganha e a Platina da Gen 1 (Prof. Carvalho
  holográfico, título Diploma de Kanto).
- **UX** (pesquisa com jogadores): aba Tática simples (a tática segue "Ofensivo"; o grito do experimento é "Ataca!"),
  aba Posições, sugestão de troca, fim de jogo sozinho em 3 s, gritos Modernos de padrão, boas-vindas em 3 páginas,
  vestiário no intervalo (várias trocas com desfazer, "O rival trocou"; `?demo=vestiario`) e pronto com desfazer no
  Duelo. O fôlego do intervalo é o do começo do 2º tempo em todo lugar.
- **Home e 404** (`public/404.html`, `?home=forte`): selo AO VIVO e Psyduck "Fora de jogo!".
- **Consertos** (bugs-2): capitão no banco no Time pronto, aviso de time inválido no idioma, shiny nas estatísticas,
  "jogou" retroativo da forma de antes, o Duelo conta na Pokédex (`recordDuelDex`, mesmo `dexLines` da Copa) e a
  animação da quadra sem folha carregada.
- **Fórmula A** (`docs/planos/patch-formula.md`): Ala conta chute, Pivô conta velocidade, Dragonite Pivô 89, Eevee do
  Duelo evolui pra forma da carta; `ENGINE_VERSION` 4.
- **Contadores e evolução em quadra**: vistos/jogaram/golpes/figurinhas de uma fonte só (`seenCount`, `playedLine`,
  `isPlayed`, `movesFound`), barra cheia de antes só evolui depois de ele fazer algo na partida (`ENGINE_VERSION` 5).
- **Copa do Dia e Liga no ar (19/10)** (plano e regras em [docs/planos/liga.md](docs/planos/liga.md); `?demo=dia`,
  `?demo=liga` no dev): migração `20261019180000_copa_do_dia_e_liga.sql` aplicada e Edge Function `liga` publicada
  (refaz a partida da Liga no servidor; placar do servidor = placar da tela, conferido com contas de teste). **A Edge
  Function leva o motor empacotado: a cada `ENGINE_VERSION` novo, `npm run edge:liga` e
  `npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api`** (token
  `SUPABASE_ACCESS_TOKEN` no `.env.local`), senão a Liga recusa as partidas ("recarregue a página"). A partida da
  Liga conta na Pokédex como o Duelo (`recordDuelDex`). Falta: o draft da Copa do Dia refeito no servidor (hoje o
  ranking do dia só confere plausibilidade).
- **Liga fechada até juntar gente (pedido do Miguel, 19/10):** a Copa do Dia segue no ar; a Liga aparece na Home com
  "Em breve", contagem e um aviso no toque. Abre sozinha na data de `LIGA_OPENS_AT` (`src/league/rules.ts`, hoje
  **01/12/2026 00:00 de Brasília, provisória**). Reabrir antes ou adiar: trocar só essa linha e publicar. Código,
  tabelas e Edge Function `liga` continuam (o `?demo=liga` entra mesmo fechada).

**0.8.8.2:** logo novo (a carta holo com a bola, `public/assets/ui/logo.svg`), título chapado, ícones no traço do
`HudIcon`, brand guide em `docs/marca/` (skill `soccermon-marca`), faixas da torcida escritas pelo Miguel, pacote de
cartas com o logo, bola original na Home e a Liga fechada com contagem.

**0.8.9 (no ar desde 20/10):** perfil do amigo (Amigos → tocar no nome: vitrine, números, últimos
títulos, "vocês no Duelo"; ranking da Copa do Dia Todos/Amigos; migração `20261021120000_perfil_do_amigo.sql` **aplicada
em produção em 20/10** com o ok do Miguel), Sala de troféus (`src/ui/screens/TrophyRoom.tsx`, `src/store/trophies.ts`,
`?demo=sala`), o retrofit do "nada teleporta" (`src/ui/view-transition.ts`, `tab-slide.ts`, `exit-motion.ts`,
`npm run teleporte`) e os **menus em três portas** (decidido em 20/10, `docs/planos/menus-e-sala.md`): a Home tem os
modos de jogo + **Perfil** (Treinador com as missões, Clube, Amigos), **Coleção** (Pokédex, Álbum, Golpedex) e **Sala de
troféus** (quarto em pixel art do Modern Interiors grátis com a luz 2D do Phaser, `src/game/scenes/TrophyRoomScene.ts`,
`src/game/room-spots.ts`; o quarto é o menu, com cartão, botões-legenda, nomes ao segurar e tutorial na 1ª visita); engrenagem e
Perfil no canto de cima de toda tela de menu; `?aba=` abre a aba, `?perfil=` antigo é redirecionado (`src/ui/doors.ts`).

**0.8.8.4 (20/10):** o Álbum virou livro (`src/ui/profile/Album.tsx`, `?demo=album`): estante com um livro por geração
(Gen 2 fechada, Em breve), capa que abre, folha que vira pela lombada (`.al-leaf`), um espaço por Pokémon com a carta da
frente (`profile.albumFront`, sem = a melhor; `speciesRows`/`frontRow`), versões empilhadas e espalhadas ao tocar
(`VersionsFan`). Some a página Raridades e as seções por edição.

**0.8.8.3:** cartas em camadas (shiny +1 por cima de outra edição, selo MVP 1 a 3 no Ícone e no Evento, Destaque por
nível, Evento com o desenho do tipo, bônus que passa de 99 vai pros outros atributos; `src/engine/specials.ts`,
`ENGINE_VERSION` 6), dicas ao passar o mouse/segurar (`Tip.tsx`) e o Álbum de figurinhas dentro da Pokédex
(`src/store/binder.ts`, `src/ui/profile/Album.tsx`; o Fichário do Perfil virou o álbum), com vitrine de cartas no
Perfil e no Duelo.

## 0.8.7 · Emotes, selos e faixa da torcida


Na 0.8.7 (5 frentes em paralelo + integração `int-087`; decisões em `docs/planos/relatorio-0.8.6.md`): emotes do Duelo
com retratos PMD do capitão (`src/ui/duel/Emotes.tsx`, `?lab=emotes`, plano em `docs/planos/emotes.md`), selos de
carreira na Pokédex (`sealsOf` em `src/store/profile.ts`: Folha 10 partidas, Holo 25 gols, Prisma 5 títulos, Ouro
escuro = Prisma + Kanto completo; selinho na carta só proposto em `?cards=1`, opção B), faixa da torcida (opção A, pano
na beira da quadra; frase no Perfil → Meu clube, campo opcional `banner`), "Monta pra mim" no draft (`autoDraft`,
`bestFit`; evento `pick.auto`/`run_end.auto_from`), Duelo com diferenças (`src/net/patch.ts`, `rev`/`need`, relógio 5 s
fora da partida) e partida curta = mesma partida tocada em dobro (`duelPace`), aviso de versão diferente na sala.
**Experimento "beira da quadra"** desligado por padrão (Configurações → Experimentos ou `?agencia=1`; no Duelo vale o
do host): gritos (3), pedido de tempo (1 por tempo, +5% fôlego pra quem pede e +3% pro rival), goleiro-linha, golpe
máximo do capitão (janela 20 s) e ordem dos pênaltis; técnico robô em `scripts/balance/coach.ts`. Com o padrão as
partidas não mudam (`ENGINE_VERSION` 3). Falta: rival que reage (com os líderes) pra "usar bem" valer mais que
"aleatório".

## 0.8.6 · Lendas douradas e prancheta ao vivo


Na 0.8.6 (versão "cheia de ajustes desse gênero", decidido em 18/10; a liga ranqueada foi pra 0.8.7): missões
lendárias (6 treinadores dourados `*Gold`, sprites por `scripts/build-gold-trainers.ts`, `isGoldTrainer` dá brilho
e moldura; 9 títulos com `title-shine`), missão do Ash = campeão com até 5 gols sofridos (`ASH_MAX_CONCEDED`),
recorde de títulos seguidos (`Records.streak/bestStreak`), prancheta no meio da partida (ordem `lineup` na próxima
bola parada, sem limite), +2 por evolução da carta (`EVOLUTION_BONUS`, `PokemonInstance.evolved`; aprovado com
antes/depois em `balanceamento-geral.md`), Duelo com o mesmo limiar de evolução nos dois lados (`evoNeeded` por
técnico humano), evolução do rival com animação própria (`src/game/evolution-view.ts`, `?demo=evolucao&rival=1`),
defesa do goleiro sem bola atrás dele, coleção (álbum de edições
`DexEntry.editions` no save v9, fita de campeão, 9 coleções temáticas, grito de gol do capitão), consertos de
trapaça e reconexão do Duelo, item antigo na recompensa vai pra quem você escolher, e primeiro acesso de ~2,5 MB
pra ~0,4 MB (fontes Galmuri em subset por `npm run fonts`; Phaser e Supabase sob demanda; bundles com hash em
`/bundle`, cache immutable). `ENGINE_VERSION` 3. Atalhos de divulgação `soccermon.com/tt|yt|ig` (utm). Visual "Transmissão" (opção B) na
partida e no site inteiro (kit em `src/ui/broadcast-kit.css`), tática e escanteio sem limite de mudanças,
Substituir mostrando o banco e quem nunca jogou começando em 1x. Insígnias ficam pro **Modo história** (decidido em
18/10; o `BadgeCase` está pronto, fora do Perfil). Relatório e decisões em `docs/planos/relatorio-0.8.6.md`.

## 0.8.5 · Escanteio e duelo ao vivo

Na 0.8.5: escanteio (opção B de [docs/planos/escanteio.md](docs/planos/escanteio.md), `CORNER_TUNING` em
`src/engine/match.ts`), motor com contas próprias (`src/engine/dmath.ts`; `npm run determinismo` compara Node,
Chromium, Firefox e WebKit), seed por trecho de 2 minutos e o **Duelo ao vivo (BETA)** (regras e decisões em
[docs/planos/multiplayer.md](docs/planos/multiplayer.md); `src/net/` e `src/ui/duel/`): sala por link, Supabase
Realtime em canal privado `duel:<código>` (migração `20261017200000_duelo_realtime.sql` já aplicada), 3 modos
(Disputa, Cada um com seus pacotes, Time pronto), mesmo caminho e telas do Copa, prancheta do time (`Prancheta.tsx`,
também no Copa) e duelo sem conta (login anônimo). **No painel do Supabase:** Realtime com "Allow public access"
desligado e Auth com "Allow anonymous sign-ins" ligado (17/10/2026); não desfazer sem trocar o código.

Na 0.8.4: balanceamento geral em 3 blocos + auditoria de posições (tudo em
[docs/planos/balanceamento-geral.md](docs/planos/balanceamento-geral.md); ajuste por espécie em `SPECIES_TUNING`,
`src/engine/attributes.ts`; a evolução herda a vaga em `PokemonInstance.inherited`), treinador e missões
(`src/store/missions.ts`, códigos de título em `src/store/title-codes.ts`) e `ENGINE_VERSION`
(`src/engine/config.ts`: suba a cada mudança que altera partidas). Divulgação da 0.8.4 e da 0.8.5 juntas (clipe
combo no TikTok). O modo de hoje se chama **Copa** (Modo história e Duelo são outros modos).

## 0.8.3 · Partida com peso, pacote de cartas e torcida

Na 0.8.3 (plano em [docs/planos/jogo-gostoso.md](docs/planos/jogo-gostoso.md)): impacto em 4 níveis (`punch()` no
`MatchScene`), câmera lenta igual pra gol/trave/defesa, rastro do tipo na bola (`src/game/ball-trail.ts`), condução
refeita, shiny em campo (`scripts/build-pmd-shiny.ts`), defesa jockey, intervalo com decisão, pacote de cartas
(`CardPack.tsx`), VERSUS novo, barra de evolução que não zera (limiar 15) e sons gravados (`public/assets/sfx/`:
apito do trailer e torcida do lado do jogador: gol, vaia e "uuuh" com variações, créditos no CREDITS.md; `playSample`/`playCrowd` em `src/game/audio.ts`).


**Plano de lançamento e próximas versões (0.8.3 → 1.0): [docs/planos/lancamento.md](docs/planos/lancamento.md).** O Miguel
quer seguir na 0.8.x por enquanto. **1.0 = lançamento oficial com tudo do "Em breve"** (Modo história, Multiplayer,
Futebol de campo, Gen 2); modo jogável, Gens 3 a 9, personalização absurda e Ultimate Team ficam para depois da 1.0. Na 0.8.2: Hall da Fama (`hall` no save v6, desfile em `HallParade.tsx`, aba no
Perfil), prêmios/seleção/recordes/gols da campanha (`ChampionExtras.tsx`, `matchDigest` em `match-stats.ts` guarda
gols/golpes/evoluções de cada partida), card do título 9:16/1:1 (`share-card.ts`) e raridade dos campeões
(`npm run stats -- --raridade` grava `public/data/raridade.json`; a tela só mostra com 20+ campeões).


No ar: contas e save na nuvem, evolução no meio da partida, substituição pelo técnico, painel ao tocar no
Pokémon, estatísticas da partida e da copa, 6 formações, tela de campeão, menus novos, golpes revisados com
animação própria, bônus de time recalculados a cada troca/evolução, página de privacidade e "Apagar minha
conta" (migração `20261014180000_apagar_conta.sql` já aplicada no banco), Ditto no painel mostrando a forma
copiada (não mais a original). Na 0.8.0: Perfil (treinador, avatar, clube com nome/sigla/cor de uma paleta
curada; cor vale no placar, VERSUS, resultado e gráficos, rival troca de uniforme se bater), Pokédex (visto =
apareceu no draft/recompensas/time rival; jogou = 1+ minuto em quadra pelo seu time; carreira por espécie),
Golpedex (`?lab=golpes`, golpe descoberto quando aparece em campo; revisão do Miguel só com `&revisao=1`), passo a
passo de boas-vindas + botão "?" + tela Ajuda + dicas, configurações a fundo (volumes, velocidade inicial, nomes
na quadra, reduzir movimento, confirmar saída, backup/restaurar/apagar) e save v5 (`src/store/profile.ts`).
Também na 0.8.0: golpes com o efeito da Gen 1 em 12 famílias (`MOVE_TRAITS`/`MOVE_TUNING` em `src/engine/moves.ts`,
relatório em `docs/planos/golpes-motor-relatorio.md`; fogo amigo do Earthquake/Surf aprovado), MT do ginásio como
recompensa (`src/engine/tm.ts`; assinatura protegida, golpe ensinado em `PokemonInstance.taught` sobrevive à
evolução, rival leva a MT do líder em até 2 Pokémon) e o jogo inteiro em inglês (`src/i18n/`, nomes oficiais;
Golpedex = Movedex, Destaque = Star Player).

**Estatísticas (15/10/2026):** Vercel Web Analytics + Speed Insights (ligar no painel da Vercel) e eventos
anônimos do jogo em `public.game_events` (`src/analytics/track.ts`, migração `20261015150000_estatisticas.sql`
já aplicada; só INSERT pela API). Consultas prontas no schema `analytics` (SQL Editor):
`por_dia`, `funil`, `origem`, `pokemon_escolhidos`, `formacoes`, `fases`, `telas`, `erros`. Privacidade promete
guardar no máximo 12 meses: job pg_cron `limpar-estatisticas-antigas` (dia 1, 4h) apaga o que passar disso; eventos só de uma lista fixa (migração `20261015190000_estatisticas_limites.sql`).

Plano do trailer e dos posts de lançamento: [docs/planos/divulgacao-trailer.md](docs/planos/divulgacao-trailer.md).

## Pendente (antigo)

> 15/10/2026: o Miguel configurou Supabase (Site URL/Redirect com soccermon.com) e Google Cloud em outra sessão;
> os itens 0–2 abaixo ficam só pra conferência (login em soccermon.com funcionando, botão oficial do Google).

0. **(16/10/2026: Client ID `363222096118-…` posto em `VITE_GOOGLE_CLIENT_ID` na Vercel, Production e Preview. O `772771786907-…` é de outro client, sem as origens: não usar.)** **Botão oficial do Google (tira o "vszcxacbcabohhdwxfpb.supabase.co" da tela de login):** o código já existe
   (`src/cloud/google-button.ts`, login com `signInWithIdToken`), mas só liga com o Client ID da Web do Google.
   Falta: (a) colocar o Client ID (termina em `.apps.googleusercontent.com`; é público) como valor padrão de
   `GOOGLE_CLIENT_ID` em `src/cloud/google-button.ts` ou na variável `VITE_GOOGLE_CLIENT_ID` da Vercel;
   (b) no Google Cloud Console → Clients → esse client → **Authorized JavaScript origins**:
   `https://soccermon.com`, `https://soccermon.vercel.app` e `http://localhost:8080`; (c) escopo `openid` em Data Access. No Supabase
   (Google provider) o mesmo Client ID precisa estar em "Client IDs" e "Skip Nonce Check" desligado. Sem o
   Client ID o jogo usa o login antigo por redirecionamento.
1. **Feito (15/10/2026):** tela de consentimento OAuth "In production" (testado com conta de fora). O Google
   pede verificação da marca (logo/nome): opcional, 2–3 dias úteis, prova do domínio pelo Search Console.
2. **Feito (15/10/2026):** domínio soccermon.com (Cloudflare Registrar, DNS em CNAME "DNS only" para a Vercel,
   www → 308), Supabase Site URL/Redirect, origens do Client ID e site do repo no GitHub.
3. **Polimento antes de divulgar** (lista em `docs/planos/roadmap.md`, seção "Agora"): "Como jogar" e botão de
   feedback feitos na 0.8.0; nomes na quadra viraram opção em Configurações. Home, draft e Movedex no celular
   deitado arrumados em 16/10 (teste headless); partida, pênaltis, substituição e campeão também.
4. **Trailer e marketing prontos (15/10/2026):** 16:9 em `trailer/montagem/`, 9:16 em `trailer/vertical/`
   (HyperFrames, PT/EN por variável); mídia e música fora do git (`trailer/montagem/preparar.sh` + scripts de
   recorte). Vídeos finais no celular em `Filmes/Soccermon-trailer/final/`. Capas, prévia do link, avatar,
   banner e textos dos posts em `docs/marketing/` (`node docs/marketing/arte/render.mjs` refaz as imagens).
   **Pra criar qualquer asset novo (vídeo, logo, imagem, post), leia antes a skill
   `.claude/skills/soccermon-assets/SKILL.md`** (pipeline, armadilhas do HyperFrames e o gosto do Miguel). Cópia de
   tudo no Drive dele, pasta "Soccermon trailer".
5. **Divulgação da 0.8 (16 a 22/10/2026):** plano em `docs/planos/divulgacao-0.8.md` (um canal por dia, UTM por
   canal, placar toda segunda com `npm run stats -- --md`); textos prontos em `docs/marketing/textos-divulgacao.md`;
   clipes verticais e imagens do itch.io em `Downloads/Soccermon trailer/Divulgacao-0.8/`. Feito em 15/10: X,
   release v0.8.0/v0.8.1 com trailers, Social preview, Discussion #1 fixada ("Feedback do lançamento"). Falta:
   LinkedIn (texto em `docs/marketing/textos-divulgacao.md` §7), clipes, Reddit, TabNews, Show HN. itch.io
   descartado (16/10: dá trabalho manter e traz pouca gente). Posts nas contas dele: o Claude prepara e para antes de publicar.
6. **Sinais do 1º dia para olhar no placar:** maior vazamento entre "começou copa" e "jogou partida" (draft longo
   no celular?); 73% jogam em 8x (começar mais rápido?). Dragonite capitão caiu de 50% (1º dia) pra 11% em 20/10
   (Arcanine, Snorlax e Ditto 7%): sem mudança.
7. **Ambiente de dev** (`docs/planos/ambiente-dev.md`): branch `staging` + staging.soccermon.com protegido,
   variáveis do Supabase só em Production, regra de CI na `main`, `ignoreCommand` no vercel.json. Depois do
   lançamento. O vercel.app hoje leva o save por JS (`src/cloud/domain-move.ts`): trocar por 308 no painel da
   Vercel só daqui a ~1 mês (novembro/2026).
8. **Repo no Midgar:** o Miguel quer mover para a org `midgar-hq` (vault em `midgar-hq/midgar-vault`: microsaas
   em série + construir em público). Transferir com calma (reconectar a Vercel à org). Lá ele entra como projeto
   de distribuição/marca, não como aposta de microsaas (o Soccermon nunca pode cobrar).
9. Pequenos: Fly quase não aparece fora da MT; GitHub do
   Miguel arrumado em 16/10 (perfil, bio, Soccermon fixado) — pendente decidir o repo `portfolio` (site antigo no
   ar) e README do `Jogo-Oficina`.
10. Ideias combinadas para depois: melhores momentos/replay (os snapshots já existem), quadras temáticas e
   treinadores, modo carreira (0.9+).
11. **Depois da 0.8.5 (18/10/2026):** clipe combo 0.8.4 + 0.8.5 pro TikTok (rascunho da 0.8.4 em
   `trailer/atualizacao/`; falta gravar escanteio e duelo e o Miguel escolher a música; confirmar antes de postar).
   Duelo: confirmar no ar que o "Partida anulada" sumiu (corrigido na 0.8.5; só testado em duas abas no PC).
   (Prancheta depois do intervalo, risco na barra "Escanteios 0 x 0" e vincular conta anônima: feitos, com teste.)
12. **Copa do Dia refeita no servidor:** o draft e as recompensas mudam o time de uma partida pra outra, então
   conferir de verdade = refazer a copa inteira (draft, recompensas e as 4 partidas) numa Edge Function, como a da Liga.
   Plano em `docs/planos/liga.md`; não é coisa pequena (precisa tirar o draft do `game-store` pra funções puras).

## 0.9.13 · Novidades mais fáceis de ler (22/10/2026)

No ar: 0.9.12 (viradas e pontes na música, temas de Erika a Giovanni, time no ranking; `ENGINE_VERSION` 10, Edge Function `liga` com o motor 10), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago e Duelo melhor de 3. Liga fechada até `LIGA_OPENS_AT`; a Copa do Dia segue no ar. Histórico: [docs/planos/historico.md](docs/planos/historico.md). Índice dos docs: `node scripts/indice.mjs`.

## 0.9.14 · Golpe máximo em 3 níveis (23/10/2026)

No ar: 0.9.14 (golpe máximo em 3 níveis na batida da música, defesa máxima por nível; `ENGINE_VERSION` 11, Edge Function `liga` com o motor 11), Rota Índigo (`LONG_CUP_LIVE`), Copa Relâmpago e Duelo melhor de 3. Liga fechada até `LIGA_OPENS_AT`; a Copa do Dia segue no ar. Histórico: [docs/planos/historico.md](docs/planos/historico.md). Índice dos docs: `node scripts/indice.mjs`.
