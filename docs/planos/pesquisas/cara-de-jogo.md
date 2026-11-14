---
description: Levantamento tela por tela do que ainda dá cara de site ao Soccermon (fora o Time Ultimate), peças compartilhadas que resolvem, 3 escopos e ordem casada com o calendário do UT.
---

# Cara de jogo no site todo: levantamento tela por tela (01/11/2026)

Pedido do Miguel (01/11): "quero que nosso jogo seja realmente um jogo digno de se olhar… esse revamp de deixar com
cara de jogo e não site deve ser feito no site todo e não só no modo Time Ultimate". Este doc é o levantamento. **Nada
de código antes das decisões do fim.** As referências de jogo (FC 26/27, FIFA 20–23, Clash, TCG Pocket, Persona,
Smash, Balatro) estão em [`menus-fc-e-aclamados.md`](menus-fc-e-aclamados.md) e não foram refeitas aqui. A direção B
do Time Ultimate ("o Clube": walkout em 3 batidas, pós-jogo em cascata, abas embaixo) já está aprovada; este doc
reaproveita essas peças no resto do jogo.

Como foi feito: prints headless (Playwright, pt-BR) em 390x844 e 1440x900, 320x568 no menu de modos e no Estádio, no
servidor local com o `main` de hoje (0.9.30.1, worktree `menu-jogo`). Estado montado pelo store e pelos demos de dev
(`?demo=vestiario|penaltis|mt|mercado|campeao|eliminado|mapa|treino|evento|grupo|liga|dia|album|colecao`). Medi a
altura de rolagem de cada tela (`scrollHeight`) e li o código das telas com mais problema. O Time Ultimate não está
nesse servidor (só na branch `ultimate`), então a nota dele vem da auditoria da pesquisa de menus.

**Limites:** os pênaltis não foram vistos cobrança a cobrança. No headless a partida anda devagar demais (2' de jogo
em 45 s) e o "Pular pro fim" passa direto pelo fim dos pênaltis. Vi o placar "PÊNALTIS 4 x 2", o aviso de fim de jogo e
o Resultado; a disputa em si (cena Phaser + painel da ordem) fica pra conferir na tela. A Liga sem servidor só mostra um
aviso; a nota usa o `?demo=liga`.

## Resumo

1. **A porta de entrada já é jogo; o miolo e o fim ainda são site.** Menu de modos, os 5 ambientes com a barra, o VS,
   a partida no celular e o mapa da Rota tiram 4 a 5. A cara de site está em ~14 telas que usam a mesma casca
   `menu-screen` (Configurações, Ajuda, Perfil, Coleção, Copa do Dia, Liga, Créditos, Sala de troféus) ou a página
   de copa com painéis empilhados (Draft, Recompensa, Mercado, Resultado, Campeão). Altura de rolagem em 390 px:
   Perfil 4.467 px, Campeão 5.914 px, Coleção 3.726 px, Configurações 2.077 px, Ajuda 2.015 px, Recompensa 1.404 px.
2. **Os momentos de prêmio acontecem dentro da página.** O pacote da Copa abre num painel embaixo do cabeçalho do
   Mercado e as cartas caem numa grade de 2 colunas. O fim de partida é uma caixinha "VITÓRIA!" de ~160 px sobre a
   quadra. O Campeão começa bem (taça, "CAMPEÕES!", selos) e vira um relatório de tabelas por 5.900 px. É o mesmo achado
   do UT (pacote em grade, pós-jogo em lista), então **o walkout e a cascata do UT resolvem a Copa também**, se nascerem
   como peças do kit.
3. **Formulário HTML à vista.** `<select>` nativo na partida no desktop (`Prancheta.tsx:190`, "Formação [Losango ▾]"),
   na escalação (`Lineup.tsx:660`) e no Clube (`ClubTab.tsx:361`); `<input type="range">` no volume
   (`Settings.tsx:123`); acordeões `<details>` na Ajuda, no Perfil e no Duelo; campo de texto "Seu nome" no meio do
   Perfil; o Duelo inteiro é um formulário de rádio com uma frase de explicação embaixo de cada opção.
4. **No desktop o jogo encolhe pra uma coluna ou vira painel de controle.** A Home ocupa a tela toda, mas Configurações,
   Perfil, Duelo e Sala de troféus ficam numa coluna de 720 px com 360 px vazios de cada lado. A partida no desktop é um
   painel com abas à direita (Posições/Time/Lances), tática em grade e "Beira da quadra" abaixo da dobra. O draft de
   formação deixa meia tela vazia.
5. **Regra escrita em parágrafo.** Duelo (6 frases de ajuda), Liga ("O adversário sorteado fica até você jogar
   (recarregar não troca). Começou e largou a partida por mais de 2 horas: conta como derrota."), Copa do Dia, "Gol da
   copa: Critério: golpe no chute (+3), distância do gol (+1 a cada 4 m)…", descrição de cada formação no draft. O
   método do Miguel pede ~12 palavras por texto na tela; o resto vai pro "?".

**O que já está certo e não é o problema:** som em todo toque (`src/ui/feedback.ts`, um ouvinte só no documento),
transição de 250 ms entre telas (`src/ui/view-transition.ts`), música por tela (`music-sync.ts`), botão chanfrado com
quique (`kit.css`), Sheet, Toast, selos. **O suco já existe; falta palco.** As telas de site não precisam de mais
animação: precisam deixar de ser uma página que rola.

---

## Tabela das telas

Nota de "cara de jogo" de 1 (site puro) a 5 (jogo de console). Rolagem medida em 390x844.

| Tela | Nota | Rolagem | Problema principal |
|---|---|---|---|
| Menu de modos | **5** | 844 | Nada grave; em 320 px o balão "Até mais, perdedor!" cobre as fatias e o nome vira "Trein…" |
| Estádio (Home) | **5** | 844 | Nada; é a régua |
| Rota (ambiente) | **5** | 844 | Nada |
| Arena | **4** | 844 | "Liga · abre em 29d" solto embaixo do botão, em texto cinza |
| Laboratório | **4** | 844 | Embaixo vira menu de 3 botões (verde grande + 2 azuis) com balão do Prof. em cima |
| Sede | **4** | 844 | Mesma pilha de botões (verde + 3 azuis) e a missão num cartão de papel |
| Barra de baixo | **5** | | Nada |
| Primeira vez (tour e dicas) | **3** | | Tour é um carrossel de 3 slides num modal; as dicas apagam a tela e o balão tapa o botão de jogar |
| Draft: formação | **2** | 1.163 | Lista de 6 cartões de texto iguais (390) ou grade 3x2 com meia tela vazia (1440) |
| Draft: capitão e escolhas | **3** | 1.247 | Cartas boas mas pequenas (3 por linha), quadra inteira embaixo obrigando a rolar |
| Escalação | **3** | 938 | A "lousa" aparece como 3 caixas de formulário em cima; formação num dropdown |
| VS (apresentação) | **5** | 844 | Nada |
| Partida, celular | **4** | 844 | Em 8x a câmera abre e a quadra vira uma faixa com 2 bandas vazias |
| Partida, desktop | **2** | 943 | Painel de controle: abas laterais, `<select>` de formação, tática em grade, rola |
| Intervalo | **3** | | Painel com números em texto pequeno ("Chutes 10 x 4 Posse 59%"); no desktop fica embaixo da quadra, na página |
| Pênaltis e fim de jogo | **3** | | Fim = caixinha "VITÓRIA!" sobre a quadra + barra verde "Ver resultado" (disputa não vista, ver Limites) |
| Resultado | **3** | 1.261 | Topo bom; embaixo rola pra abas "Destaques/Estatísticas" e o parágrafo do critério do gol |
| Recompensa | **2** | 1.404 | 3 opções de formatos diferentes em grade de 2 (a 3ª sozinha embaixo), time inteiro embaixo |
| Mercado | **3** | 968 | "A vitória rendeu +₽12" solto; Patrocínios abaixo da dobra |
| Pacote da Copa (CardPack) | **3** | 1.611 | Animação boa, mas dentro de um painel da página; cartas em grade de 2 |
| Eliminado | **3** | 1.212 | Título fino "FIM DA LINHA", parágrafo do critério do gol; desktop numa caixa de 1150 px |
| Campeão | **2** | 5.914 | Começo de jogo, resto relatório: 6 blocos de número, 3 tabelas, campo de gols, 8 fichas de jogador |
| Hall da Fama (sobre o Campeão) | **4** | | Bonito; fecha num botão azul redondo "Fechar" fora do kit |
| Rota: mapa | **5** | 1.216 | Nada; é o Slay the Spire bem feito |
| Rota: Treino | **2** | 844 | Dois painéis de formulário: lista de nomes com barrinha e um botão desabilitado "Toque em quem treina" |
| Rota: Evento | **3** | 880 | Fala do Prof. num painel vazio com faixa vermelha; escolhas como lista de linhas |
| Rota: Grupo (Planalto) | **3** | 844 | Tabela de classificação (ok pra futebol) + rodadas em lista |
| Duelo | **1** | 1.141 | Formulário: rádios com parágrafo, 3 segmentados com frase embaixo, sem a barra de cima |
| Liga (demo) | **2** | 1.171 | Elo e rival bons; o resto é parágrafo de regra |
| Copa do Dia | **2** | 844 | Data + parágrafo + calendário S T Q Q S S D em caixinhas + ranking em lista |
| Perfil | **2** | 4.467 | Página de cadastro: campo de nome, avatar em dropdown, 46 silhuetas com descrição, campo de código |
| Coleção: Pokédex | **3** | 3.726 | Grade de 151 é esperada; filtros em pílula de site, Pokédex vazia é um mar de "???" |
| Coleção: Álbum | **4** | 920 | Vitrine e capas do fichário boas |
| Sala de troféus | **3** | 844 | A sala é jogo, mas encaixotada em 720 px, com 10 pílulas de aba e 2 botões azuis embaixo |
| Novidades | **2** | sheet 3.962 | Changelog em acordeão: 1 cartão aberto + 20 linhas "Versão 0.9.x · nome · data" |
| Ajuda | **2** | 2.015 | FAQ: pílulas azuis, campo de busca, acordeão com sprite |
| Configurações | **2** | 2.077 | Formulário: sliders nativos, segmentados, "Mais opções", rodapé com links de site (Privacidade, GitHub) |
| Créditos | **2** | 1.286 | Documento com links; aceitável pra créditos |
| Sheet, confirmação, Toast, aviso de desbloqueio | **4** | | Kit bom; o aviso "Treinador novo desbloqueado" é um toast pequeno, sem momento |
| Time Ultimate (auditado antes) | **2** | | Ver `menus-fc-e-aclamados.md`; direção B aprovada |

Média ponderada pelo tempo de tela: alta onde se joga (entrada, partida no celular, mapa), baixa onde se decide e se
comemora (draft, recompensa, campeão) e onde se mexe no perfil.

---

## Por tela: o que mudar

Arquivos no `main` de hoje. "Ref." aponta a referência da pesquisa de menus.

### Menu de modos (`src/ui/screens/ModeMenu.tsx`): 5, manter

- Fica como está. Dois toques: em 320 px tirar o balão do Blue (ou encolher pra 1 linha) e deixar o nome do treinador
  só no avatar. No 1440 o JOGAR perde o subtítulo ("Modo Copa · último jogado"); devolver.

### Ambientes (`src/ui/ambientes/`): 4–5, manter e alinhar

- **Lab e Sede:** a pilha embaixo (1 verde grande + 2 ou 3 azuis) é um menu de botões. Trocar os azuis por **objetos da
  cena** tocáveis com plaquinha (o Álbum = o fichário na estante, a Golpedex = a lousa; na Sede, Treinador = o
  armário, Clube = o escudo na parede, Amigos = o mural). O botão verde continua sendo o único gordo. Ref.: Clash
  (o baú é o botão), menu-e-sala.md.
- **Arena:** "Liga · abre em 29d" vira um letreiro na parede da quadra (como o "ARCADE DA SEMANA"), não texto cinza.
- **Sede:** o cartão de missão em papel vira uma placa do kit (`k-bar` + título na placa).

### Primeira vez (`Onboarding.tsx`, `Tip.tsx`): 3

- O jogador novo cai direto no Estádio (bom). O tour de 3 slides num modal é o momento "manual de instruções": trocar
  por **dicas na cena**, já que o Estádio vivo explica sozinho; o tour fica só no "Ver o passo a passo de novo" da Ajuda.
- As dicas do draft e da escalação escurecem tudo e o balão tapa o botão de jogar (no print da escalação o "Jogar
  oitavas de final" fica atrás do apagado). Dica do jogo é **um dedo apontando** + 1 linha, sem apagar a tela, e some
  quando a pessoa faz a ação (Clash, Brawl). Manter "Pular".

### Draft (`src/ui/screens/Draft.tsx`): formação 2, escolhas 3

- **Formação:** a lista de 6 cartões (desenho + "Goleiro · Fixo · Ala · Ala · Pivô" + frase + prós/contras) é o maior
  bloco de texto da copa. No lugar: **carrossel de quadras**, uma formação por vez em tamanho grande, com os 5 pontos
  piscando nas posições, o nome na placa e **3 palavras** (+Toque curto, −Profundidade); deslizar troca, "Escolher" no
  polegar. A frase e a lista de posições vão pro "?". No 1440, as 6 quadras numa fileira em leque, a do meio maior.
  Ref.: seleção de time do Mario Strikers, escolha de formação do FC (quadra grande, uma por vez).
- **Capitão e escolhas:** as 3 cartas (`.cards-legible`) são a melhor parte; o problema é o resto da página. Em 390 px:
  as cartas sobem pra ocupar a largura (hoje ~115 px cada), a fileira de vagas tracejadas ("Goleiro Fixo Ala…") vira a
  barra de progresso de 7 pontos que já existe, e a quadra "PALLET FC" vira uma **miniquadra recolhida** de ~120 px que
  abre numa sheet. Nada a rolar. As cartas entram viradas e desviram em sequência (o `flip` que o pacote já tem, 220 ms
  entre cartas). Ref.: Hearthstone Arena e recompensa do Slay the Spire (3 cartas grandes no centro, fundo escuro).

### Escalação (`src/ui/screens/Lineup.tsx`, `vestiario.css`): 3

- A quadra com as fichas é boa. Em cima, "vs Cinnabar · Média 64", "Chave 1/4", "Tática Equilibrado" e "Losango
  (1-2-1) ˅" são 3 caixas de formulário; o brand guide descreve uma lousa com quadros pendurados que não aparece assim
  no print. Trocar por **placas na parede**: o rival como um cartaz com o escudo e os 5 sprites (abre a chave), a
  tática como o quadro-branco (abre a sheet), a formação como a placa da prancheta (abre o carrossel do draft). O
  `<select>` da formação (`Lineup.tsx:660`) sai.

### Partida: celular 4, desktop 2 (`src/ui/screens/Match.tsx`, `Prancheta.tsx`, `Sideline.tsx`)

- **Celular:** manter. Em 8x a câmera abre e a quadra vira uma faixa com duas bandas vazias (print `pen3-s2`): preencher
  com a arquibancada (`Stands`) em vez de fundo liso.
- **Desktop:** hoje é o celular antigo esticado (layout `wide`): abas Posições/Time/Lances à direita, "Formação" num
  `<select>` nativo (`Prancheta.tsx:190`), tática em grade 2x2 com descrição, "Beira da quadra" abaixo da dobra (a página
  rola). Proposta: **layout de TV**: quadra grande no centro (com `uiZoom()`), placar no topo, a **mesma barra de 4
  botões do celular** (Tática, Trocar, Tempo, Lances) embaixo, cada um abrindo a sua Sheet (no desktop, janela do meio),
  e a narração como legenda de TV. Uma partida, um layout. Ref.: transmissão do FC, `?lab=hud`.

### Intervalo (`HalftimePanel.tsx`): 3

- Os números vão pra **placar de TV** (o `.bc-sc`): três linhas "CHUTES 10–4", "POSSE 59%", "MAIS CANSADO Kabutops 82%"
  com barras, entrando uma por vez (cascata de 250 ms). "O rival trocou" vira uma placa de substituição de TV (seta
  verde/vermelha com os dois sprites). No desktop o painel sai da página e fica por cima da quadra, como no celular.

### Pênaltis e fim de partida (`Match.tsx` `FinalBanner`): 3

- O apito final é um momento e hoje é uma caixinha escura de ~160 px no meio da quadra com uma barra verde embaixo.
  Proposta: **cartela de fim de jogo** em tela cheia por cima da quadra parada: "VITÓRIA!" no tamanho do título do
  Resultado, placar de TV, e a cascata curta (₽ ganhos contando, craque com o selo, "Próximo: Quartas contra Cinnabar")
  antes do "Ver resultado". É a mesma peça do pós-jogo do UT. Pênaltis: conferir na tela se o painel da ordem e as
  cobranças seguem o kit (não visto).

### Resultado e Eliminado (`src/ui/screens/Result.tsx`, `ResultHero.tsx`): 3

- O topo é bom (título grande, placar, fala do líder, os 5 sprites com o craque). Embaixo: botões soltos ("Melhores
  momentos", "Compartilhar", "Dar feedback", "Ver a chave"), abas de pasta e o parágrafo do critério do gol. Proposta:
  1 tela sem rolar: herói em cima, **1 ação gorda** (Escolher recompensa / Nova copa), uma fileira de botões-ícone
  (Melhores momentos, Compartilhar, Chave, Estatísticas) e as estatísticas numa Sheet. O critério do gol vai pro "?".
- "FIM DA LINHA" em fonte fina e cinza não tem o peso do "VITÓRIA!": usar o mesmo tratamento (Galmuri14 com contorno,
  em vermelho apagado) com o `leaveWith` que já existe.

### Recompensa (`src/ui/screens/Reward.tsx`): 2

- Hoje: carta + caixa de item + caixa de MT, em grade de 2 colunas (a 3ª fica sozinha embaixo), chips "Contratar" e
  "Escolher", o time inteiro embaixo (1.404 px). Proposta: **escolha 1 de 3 em palco**, igual ao draft: as 3 opções do
  mesmo tamanho lado a lado, cada tipo com a sua moldura (carta = carta; item = carta de item com o sprite grande; MT =
  o disco girando), entrando viradas; "Pular (+1 sorteio)" e "Sortear de novo" como botões-ícone baixos; o time numa
  miniquadra que abre sheet quando é preciso escolher quem recebe. Ref.: Slay the Spire, Balatro (loja de 3).

### Mercado (`src/ui/screens/Shop.tsx`): 3

- Já tem carta e pacote grandes. "A vitória rendeu +₽12" vira o ₽ da barra de cima contando (`CountUp` + tique) na
  entrada. Patrocínios saem de baixo da dobra pra uma prateleira com seta lateral. Ref.: loja do Balatro.

### Pacote da Copa (`src/ui/components/CardPack.tsx`): 3

- A animação é a nossa melhor (tom subindo, carta grande segura). O palco é que é pequeno: abre dentro do painel
  "ESCOLHA 1 CARTA DO PACOTE", embaixo do cabeçalho do Mercado, e as cartas pousam numa grade de 2. Proposta: **o
  mesmo palco de tela cheia do UT** (fundo de marca, raios, rasgo no dedo, walkout de 3 batidas só pra ouro 75+ e
  edição, "Pular"); depois as cartas em leque no centro com "Escolher" em cada uma. Uma peça pros dois modos.

### Campeão (`src/ui/components/ChampionView.tsx`, `Result.tsx`): 2

- O Hall da Fama (sprites em fila, treinador, fundo vinho) é bom; trocar o "Fechar" azul redondo pelo botão do kit.
- A tela embaixo começa bem e vira relatório: 6 blocos de número, "Caminho do título", "Prêmios da copa" em 8 cartões,
  "Seleção da copa", "Gols da campanha", "De onde saíram os gols", "Golpes da copa" (tabela), "A final" e uma ficha de
  estatística por jogador (8 cartas com tabela de 9 linhas). 5.914 px. Proposta em 3 batidas (≤ 4 s, toque pula):
  taça + "CAMPEÕES!" + selos (como hoje) → **3 destaques** (Bola de Ouro, Artilheiro, Gol da copa com play) → caminho do
  título em 4 placas de placar. Embaixo, só "Nova copa" (dourado) e uma fileira de ícones (Compartilhar, Melhores
  momentos, Estatísticas). Todo o resto vai pra Sheet "Estatísticas da copa" (que já existe como aba). Ref.: fim de
  torneio do FIFA (taça, 3 cartões, continuar), tela-campeao.md.

### Rota Índigo: mapa 5, Treino 2, Evento 3, Grupo 3 (`CupMap.tsx`, `long-cup.css`)

- **Mapa:** manter.
- **Treino:** dois painéis com lista de nomes e barrinha + um botão desabilitado. Proposta: **cena de treino** (a quadra
  de treino do ginásio, os titulares em `FieldSprite`), tocar no Pokémon escolhe e mostra a barra de evolução enchendo
  pela metade numa prévia; "Descansar" como a cama/banco da cena com "+1 sorteio" na placa. Ref.: Centro Pokémon e
  treino dos jogos de Pokémon.
- **Evento:** o Prof. falando no meio de um painel vazio com faixa vermelha. Proposta: caixa de diálogo de RPG
  embaixo (a do mapa, que já existe), a cena do evento atrás, as escolhas como as opções do diálogo (com custo em
  ₽ à direita, como hoje).
- **Grupo:** a tabela fica (é futebol), com o tratamento de placar de TV; as rodadas viram 3 placas de jogo com os dois
  escudos, a próxima pulsando.

### Duelo (`src/ui/duel/Duel.tsx`): 1

- É a tela mais site do jogo: sem a barra de cima (só um voltar), "Escolha o modo e a velocidade e mande o link pro
  rival", aviso BETA com link sublinhado, 3 opções de modo como rádio com parágrafo (a 1ª desabilitada com uma
  terceira linha explicando por quê), e 3 segmentados (velocidade, duração, jogos), cada um com uma frase embaixo.
- Proposta: o Duelo **mora na Arena** (já é o botão "Desafiar" de lá). Abre na quadra noturna da Arena com os dois
  lados (o seu time e a silhueta "?"), os 3 modos como **blocos grandes com ícone e 2–3 palavras** (Meu time · Disputa ·
  Pacotes), e um botão "Regras" que abre Sheet com velocidade, duração e jogos (padrão já marcado). "Criar sala" no
  polegar. Explicação de cada modo no "?" do bloco. Barra de cima igual aos menus. Ref.: amistoso do Clash, regras do
  Smash (uma tela de regra, não um formulário na frente).

### Liga (`src/ui/screens/Liga.tsx`): 2

- O Elo grande, a faixa da temporada e o cartão do rival com os 5 sprites já são jogo. O resto é parágrafo de regra
  ("Você enfrenta o time salvo de outro treinador…", "O adversário sorteado fica até você jogar…", "O time da sua copa
  vira o seu fantasma…"). Proposta: palco da Arena com o rival do outro lado da quadra (como o VS), Elo e liga
  (Bronze/Prata) no letreiro, "Jogar" no polegar; as regras numa Sheet. **A Liga abre em 01/12** (`LIGA_OPENS_AT`):
  é a tela que mais vale arrumar antes disso.
- Sem servidor (local), a tela é um painel com uma frase num mar vazio: no mínimo pôr a Arena atrás.

### Copa do Dia (`src/ui/screens/Daily.tsx`): 2

- Data como título + parágrafo + calendário de 7 caixinhas S T Q Q S S D + ranking em lista. Proposta: o Estádio com
  o letreiro "COPA DO DIA · 1 DE NOVEMBRO", a figurinha do dia como uma carta virada no centro (o prêmio à vista), a
  sequência como 7 bolinhas no letreiro (acesas pelos dias jogados) e o ranking numa Sheet. Ref.: diário do Clash
  (baú do dia), login diário de gacha.

### Perfil (`src/ui/screens/Profile.tsx`, `src/ui/profile/`): 2

- Cartão do treinador bom; abaixo, uma página de cadastro de 4.467 px: atalhos pra Sala e Coleção, abas de pasta, "0 de
  63 missões cumpridas", painel "Treinador" com campo de texto do nome, avatar num dropdown, parágrafo explicando
  shiny, grade de 46 treinadores com a missão escrita em cada silhueta, "Bloqueados (45)" num `<details>`, "Resgatar
  código" com campo e botão.
- Proposta: **o armário do vestiário** (um lugar, como a Sede): o cartão do treinador em cima, grande, como o "cartão
  de jogador" do Clash; tocar no nome ou no avatar abre Sheet pra editar (o campo some da tela); os treinadores viram
  uma **coleção de figurinhas** (só a silhueta e o nome; a missão aparece ao tocar, em Sheet); missões com `k-bar` e as
  mais perto de sair primeiro; "Resgatar código" vai pras Configurações. Clube e Amigos continuam como abas, mas com a
  mesma regra (editar = sheet).

### Coleção (`src/ui/screens/Collection.tsx`): Pokédex 3, Álbum 4

- Pokédex em grade é o certo (é assim nos jogos). Dois toques: os filtros em pílula ("Todos 151", "Jogaram 0", "Faltam
  151", "Falta figurinha 151") viram a fileira de ícones de tipo que já existe + 1 seletor; a Pokédex vazia ganha o
  Prof. Carvalho no topo ("Faltam 151") em vez de 151 quadradinhos "???" como primeira impressão.
- Álbum: manter.

### Sala de troféus (`src/ui/screens/TrophyRoom.tsx`): 3

- A sala (vitrines, Pikachu, lustre) é jogo; encaixotada em 720 px, com 10 pílulas de aba embaixo (Copa, Liga, Copa do
  Dia, Duelo, Medalhas, Hall da Fama, Platina, Números, Coleção, Clube) e 2 botões azuis ("Como funciona", "Ver tudo em
  lista"). Proposta: **sala em tela cheia** (como os ambientes), cada vitrine e parede sendo uma das categorias (tocar
  na estante de medalhas abre as Medalhas), uma seta pra trocar de parede, e "Ver tudo em lista" como botão-ícone.
  Some a fileira de 10 abas.

### Novidades (`AboutFooter.tsx` `NewsButton`, `patch-notes.ts`): 2

- É um changelog: um cartão aberto e 20 linhas "Versão 0.9.29 · Rota nova · 31 de out." em acordeão. Proposta: a
  versão nova como um **cartaz** (nome da versão grande, 1 print ou sprite, 2–3 itens com ícone) e "Versões antigas"
  numa lista curta embaixo. Ref.: notícias do Clash e do Brawl (cartão com arte). Aparece sozinho só como pontinho
  no ícone, nunca janela (regra do Madden, na pesquisa).

### Ajuda (`src/ui/screens/Help.tsx`): 2

- Pílulas azuis "Como funciona" (7 modos), campo de busca, acordeão de 12 temas. Proposta: **cartas de dica** (1 tema =
  1 carta com sprite e 2 linhas, deslizar), a busca fica, os modos viram os ícones do menu de modos. Ref.: "Dicas" do
  Smash (uma por tela, com arte). Prioridade baixa: Ajuda pode ser mais documento que o resto.

### Configurações (`src/ui/screens/Settings.tsx`): 2

- Slider nativo de volume, segmentados, "Mais opções", e um rodapé de site (Ajuda · Créditos · Dar feedback ·
  Privacidade e termos · Código no GitHub · Cartas (teste)). Proposta: **menu de opções de jogo**: abas Som · Partida ·
  Acessibilidade · Dados (as mesmas seções de hoje), cada opção uma linha com o valor e setas ‹ 60% › (um `k-stepper`
  no lugar do range e dos segmentados longos), e o rodapé vira uma linha "Sobre" que abre Créditos (onde os links
  moram). Ref.: opções de qualquer jogo de console; Persona 5 e Smash.

### Créditos (`src/ui/screens/Credits.tsx`): 2

- Documento com links é aceitável. Se sobrar tempo: rolagem de créditos de fim de jogo (sprites desfilando, a música
  `ultima-partida` que já toca aqui) com os links no fim.

### Modais e avisos (`src/ui/kit/Sheet.tsx`, `Toast`, `UnlockNotice.tsx`): 4

- Sheet, ConfirmSheet e Toast estão no kit. O aviso de desbloqueio ("Treinador novo desbloqueado: Brock") é um toast
  de 3 linhas no topo, junto com o Campeão: desbloqueio de treinador merece **o selo batendo** (`.k-seal`) com o
  sprite, por 1,2 s, na volta pro menu, não durante outra comemoração.

### Time Ultimate: 2 (direção B aprovada)

- Nada novo aqui. O ponto deste doc é **onde nascem as peças do B**: walkout, cascata e o hub com barra embaixo devem
  ser escritos em `src/ui/kit/` (ou `src/ui/components/`), não em `src/ui/ultimate/`, pra Copa usar depois sem
  reescrever.

---

## Padrões que se repetem e a peça que resolve cada um

| # | Padrão (onde aparece) | Peça compartilhada | Onde nasce | Reusa |
|---|---|---|---|---|
| 1 | **Página que rola com painéis empilhados** (Perfil, Campeão, Configurações, Ajuda, Recompensa, Draft) | **Palco** (`Stage`): tela cheia, cena de fundo, no máximo 1 bloco de conteúdo, **1 ação gorda no polegar**, o resto em Sheet. Regra: tela de jogo não rola; lista longa rola dentro de uma Sheet | `src/ui/kit/Stage.tsx` | camadas dos ambientes (`Room.tsx`, `Stands`, céu), `bc-thumbbar`, `Sheet` |
| 2 | **Prêmio dentro da página** (pacote da Copa, Recompensa, fim de jogo, Campeão, desbloqueio) | **Momento** (`MomentStage`): overlay de tela cheia com fundo de marca e raios; dentro dele o walkout do UT e a escolha 1 de 3 | `src/ui/kit/` (feito pro UT 0.9.33) | `CardPack`, `MomentWipe`, `.walk`, `packLookOf`, ADR 0008 (momento) |
| 3 | **Pós-jogo como lista ou relatório** (Resultado, Campeão, Intervalo, pós-jogo do UT) | **Cascata** (`Cascade`): batidas de 250–600 ms, cada uma com som e pop, toque pula pro fim, ≤ 3–4 s | `src/ui/kit/Cascade.tsx` (feito pro UT) | `CountUp`, `.k-seal`, `k-bar`, `feedback.ts` |
| 4 | **Controles de formulário** (`<select>` ×3, `type=range`, rádio com parágrafo, `<details>`, campo de texto na página) | **Controles de jogo** no kit: `k-stepper` (‹ valor ›), `k-option` (bloco com ícone e 2–3 palavras), editar em Sheet, acordeão só dentro de Sheet | `src/ui/kit/kit.css` + `?lab=kit` | `.bc-seg`, `HudIcon`, `Sheet` |
| 5 | **Regra em parágrafo** (Duelo, Liga, Copa do Dia, critério do gol, draft) | **Info "?"** (`InfoSheet`): botão-ícone no canto do bloco abre Sheet com a regra; na tela, ≤ 12 palavras | `src/ui/kit/` | `HudIcon` `bulb`/`?`, `Sheet` |
| 6 | **Coluna de 720 px no desktop / painel de controle** (menus, partida, draft) | **Regra de 1440**: palco em tela cheia com `uiZoom()` e `calc(N * var(--vw))` (como a Home); coluna estreita só dentro de Sheet. Partida: um layout só (o do celular, aumentado) | `styles.css` (`menu-screen` some aos poucos), `Match.tsx` | `ui-zoom.ts`, `?lab=hud` |
| 7 | **Menu de botões embaixo de uma cena** (Lab, Sede, Treino, Sala de troféus) | **Objeto tocável** (`SceneHotspot`): objeto da cena com plaquinha que pisca 1 vez ao entrar; substitui botão azul secundário | `src/ui/ambientes/` | `WildZone`, `FieldSprite`, o "toque no Pokémon" que já existe |
| 8 | **Tabela de números** (Campeão, Intervalo, Grupo, fichas de jogador) | **Placar de TV** (`.bc-sc` em linhas): 3 números por vez, com barra; "Ver tudo" abre Sheet | `broadcast-kit.css` | `.bc-surface`, `.cb-num` |

O 2 e o 3 já estão no plano do UT (0.9.33). O 1, o 4 e o 5 são o grosso do trabalho no resto do jogo. O 6 vem quase
de graça quando o 1 existe. Nenhuma peça mexe na carta (`FutCard`/`PokeCard2`) nem em regra de jogo.

---

## Esboços das 3 telas que mais mudam

```
390 px · Campeão (depois da cascata, sem rolar)
┌──────────────────────────────────────────┐
│ SOCCERMON                                │
│              ( taça )                    │
│          C A M P E Õ E S !               │ Galmuri14 contorno
│   Demo FC conquistou a Copa de Kanto     │
│  [Primeiro título!] [Copa em 1 min]      │ selos batem
│ ┌────────────┬────────────┬────────────┐ │
│ │ BOLA DE    │ ARTILHEIRO │ GOL DA     │ │ 3 destaques
│ │ OURO       │  Mewtwo    │ COPA  [▷]  │ │ (cascata)
│ │ [spr] 10.0 │  [spr] 21  │ [spr] Mew  │ │
│ └────────────┴────────────┴────────────┘ │
│  OIT 9x5 › QUA 11x3 › SEM 7x4 › FIN 6x3  │ placas de placar
│                                          │
│   [▷ Momentos] [⇪ Compartilhar] [▥ Stats]│ ícones; Stats = sheet
│ ┌──────────────────────────────────────┐ │
│ │             NOVA COPA  ›             │ │ o único gordo
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
hoje: 5.914 px de rolagem (tabelas, fichas, campo de gols)
```

```
390 px · Duelo dentro da Arena
┌──────────────────────────────────────────┐
│[<] Treinador              [≡][?][⚙]      │ barra de sempre
│ ┌ Duelo ───────────────────────────────┐ │ placa
│ │░░ quadra noturna da Arena ░░░░░░░░░░░│ │
│ │   [seu time]     VS     [ ? ]        │ │ cena, não texto
│ └──────────────────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ (ícone)  │ │ (ícone)  │ │ (ícone)  │   │ k-option
│ │ Meu time │ │ Disputa  │ │ Pacotes  │   │ 2–3 palavras
│ │   [?]    │ │ ▔▔▔▔▔▔▔▔ │ │   [?]    │   │ ? = sheet da regra
│ └──────────┘ └──────────┘ └──────────┘   │
│  Regras: 1x · Normal · 1 jogo        ›   │ abre sheet
│ ┌──────────────────────────────────────┐ │
│ │            CRIAR SALA                │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
hoje: rádio com parágrafo + 3 segmentados com frase + aviso BETA (1.141 px)
```

```
390 px · Recompensa como escolha 1 de 3 (mesmo palco do draft)
┌──────────────────────────────────────────┐
│[<] OITAVAS               ₽ 0   ↻ 2       │ CupBar
│        ESCOLHA UMA RECOMPENSA            │ placa
│┌──────────┐ ┌──────────┐ ┌──────────┐    │
││ 87  GOL  │ │  ITEM    │ │ MT34     │    │ mesmo tamanho,
││  Golem   │ │ (sprite) │ │ (disco)  │    │ entram viradas
││ [carta]  │ │ Quick    │ │  Bide    │    │
││          │ │ Claw     │ │ 6 aprend.│    │
│└Contratar┘ └Escolher─┘ └Escolher─┘     │ chips presos
│                                          │
│  seu time  [▪▪▪▪▪]  toque pra ver   ›    │ miniquadra (sheet)
│                                          │
│  [Pular +1 sorteio]     [↻ Sortear (2)]  │ baixos, secundários
└──────────────────────────────────────────┘
hoje: grade de 2 (3ª opção sozinha) + quadra inteira embaixo (1.404 px)
```

---

## 3 opções de escopo

Os dias são de trabalho de agente com revisão do Miguel nos prints; não incluem o B do UT (8–12 dias, já planejado).

### A. Polimento (5–7 dias)

Trocar o que é formulário e cortar texto, sem mudar a estrutura das telas.

- Controles do kit (padrão 4): `k-stepper` no lugar dos 3 `<select>` e do slider; Duelo com a barra de cima e modos
  em `k-option`; "Fechar" do Hall no botão do kit.
- Info "?" (padrão 5) em Duelo, Liga, Copa do Dia, draft e critério do gol.
- Campeão: o relatório vai pra Sheet "Estatísticas" (a tela fica com o topo de hoje).
- Pacote da Copa em tela cheia, reusando o palco do UT quando ele existir.
- Lab e Sede: botões azuis viram objetos da cena.

Ganho: tira o "formulário" e a página infinita do Campeão. Não muda Draft, Recompensa, Perfil, Sala nem a partida no
desktop. Risco baixo.

### B. Recomendado: peças do UT no jogo todo (12–16 dias, em etapas)

A + as peças de palco.

- Momento e Cascata (padrões 2 e 3) nascem no kit na 0.9.33 do UT e entram na Copa: pacote, Recompensa, fim de
  partida, Resultado, Campeão, Intervalo.
- Palco (padrão 1) em: Liga, Duelo (Arena), Copa do Dia (Estádio), Sala de troféus, Perfil (armário).
- Draft: carrossel de formação e escolhas sem rolar.
- Partida no desktop com o layout do celular aumentado.
- Configurações como menu de opções de jogo; Novidades como cartaz.

Ganho: toda tela que se vê numa copa fica de jogo. Perfil e Sala viram lugares. Risco médio: mexe em telas da Copa
logo depois da estreia do UT; dá pra fatiar por tela (cada uma é independente depois que o kit existe).

### C. Grande: linguagem de TV em tudo (25–35 dias, 2027)

B + a direção C da pesquisa de menus ("Transmissão Kanto": corte de TV em diagonal em toda troca, letreiro de canal,
grade de programação), Ajuda em cartas, Créditos rolando, Treino e Evento da Rota como cenas, Pokédex refeita. Conflita
com o ADR 0004 se a diagonal for em toda troca. Bom como guia pro Modo História.

| | A | B | C |
|---|---|---|---|
| Dias | 5–7 | 12–16 | 25–35 |
| Risco | baixo | médio | alto |
| Telas que sobem de nota | ~8 | ~22 | todas |
| Nota média (sem Home) | ~2,8 | ~4 | ~4,5 |
| Reusa o B do UT | pouco | tudo | tudo |

---

## Ordem sugerida (casada com o calendário do Time Ultimate)

| Etapa | Quando | O quê | Versão |
|---|---|---|---|
| 0 | até ~22/11 (junto da 0.9.33) | **Nada de tela da Copa mexida antes da estreia**, menos 3 coisas pequenas: Momento e Cascata escritos no kit (pro UT, mas genéricos), Liga com as regras numa Sheet e a Arena atrás (a Liga abre 01/12), Duelo com a barra de cima | 0.9.33 |
| 1 | 28/11 a ~14/12 (depois da estreia, antes do Natal em 15/12) | Copa recebe Momento e Cascata: pacote em tela cheia, fim de partida, Resultado sem rolar, Campeão enxuto, Recompensa como escolha 1 de 3. Controles do kit (sai `<select>` e range). Info "?" nas telas de regra | 0.9.34 |
| 2 | ~15/12 a fim de dez (evento de Natal no ar, sem mexer no UT) | Palcos: Duelo e Liga na Arena, Copa do Dia no Estádio, Sala de troféus em tela cheia, Perfil como armário | 0.9.35 |
| 3 | janeiro (ranking do UT em janeiro) | Draft (formação em carrossel, escolhas sem rolar), partida no desktop, Configurações, Novidades, Lab e Sede com objetos | 0.9.36 |
| 2027 | depois | Direção C testada só no pós-jogo, depois o resto; Modo História já nasce nela | |

Cada etapa sai com revisão dupla e trailerzinho, como o Miguel pediu ("versões menos frequentes e polidas").

---

## Decisões pro Miguel (recomendação primeiro)

1. **Escopo:** B em etapas (peças do UT no jogo todo, 12–16 dias, dezembro e janeiro) **(recomendado)** / A agora e o
   resto depois / C.
2. **Momento e Cascata do UT nascem no kit** (`src/ui/kit/`), feitos pra Copa usar depois de 27/11
   **(recomendado)** / só no UT por enquanto.
3. **Antes da estreia (27/11) não mexer em tela da Copa**, menos Liga (abre 01/12) e a barra do Duelo
   **(recomendado)** / pode mexer já.
4. **Pacote da Copa (Mercado) em tela cheia com o mesmo walkout do UT**, só pra ouro 75+ e edição **(recomendado)** /
   continuar dentro do painel.
5. **Campeão em 3 batidas** (taça, 3 destaques, caminho do título) e o relatório numa Sheet "Estatísticas"
   **(recomendado)** / manter a página longa.
6. **Fim de partida em tela cheia** com a cascata curta (₽, craque, próximo rival) antes do "Ver resultado"
   **(recomendado)** / caixinha de hoje.
7. **Recompensa como escolha 1 de 3 em palco**, as 3 opções do mesmo tamanho **(recomendado)** / grade de hoje.
8. **Duelo e Liga moram na Arena**: modo em blocos grandes, regras numa Sheet **(recomendado)** / páginas de hoje com
   a barra de cima.
9. **Perfil como armário e Sala de troféus em tela cheia** (editar nome e avatar em Sheet; treinadores como figurinhas)
   **(recomendado)** / só encurtar as páginas.
10. **Draft de formação em carrossel** (uma quadra por vez, 3 palavras; frase e posições no "?") **(recomendado)** /
    lista de hoje.
11. **Partida no desktop com o layout do celular aumentado** (barra de 4 botões, painéis em Sheet) **(recomendado)** /
    painel de hoje.
12. **Configurações como menu de opções de jogo** (abas, linhas ‹ valor ›, links do rodapé nos Créditos)
    **(recomendado)** / só trocar o slider.
13. **Texto de regra na tela com no máximo ~12 palavras**, o resto no "?" **(recomendado)** / caso a caso.
14. **Dicas da primeira vez sem apagar a tela** (dedo apontando + 1 linha) e o tour de 3 slides só na Ajuda
    **(recomendado)** / manter como está.
15. **Novidades como cartaz da versão nova** + lista curta das antigas **(recomendado)** / acordeão de hoje.

Prints deste levantamento (fora do repo):
`/home/bartolomeu/.cache/claude-tmp/claude-1000/-home-bartolomeu-Projects-soccermon/152ccaaa-4524-49c1-9d45-e064e56ed88b/scratchpad/cara-de-jogo/prints/`.

## Decidido com o Miguel (02/11/2026)

"Concordo com todas, menos na que propõe mudanças em menor escala ou mais conservadoras. Acho que conseguimos sim fazer
algo bem feito e grande." Fica assim:

- **Escopo C** (grande), em etapas: primeiro as peças do B (Palco, Momento, Cascata, controles de jogo, Info "?") e as
  telas da Copa; depois a linguagem de TV em tudo.
- **Decisão 3 caiu:** pode mexer nas telas da Copa já, antes de 27/11.
- As outras 13 decisões ficam com a recomendação.

