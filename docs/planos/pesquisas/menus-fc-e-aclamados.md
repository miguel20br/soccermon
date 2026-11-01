---
description: Pesquisa de menus, navegação e apresentação (EA FC, FIFA 20–23, Clash, TCG Pocket, Persona, Balatro) e 3 direções pros menus do Soccermon e do Time Ultimate.
---

# Menus do FC e de jogos aclamados: o que copiar pro Soccermon (pesquisa, 01/11/2026)

Pedido do Miguel: "ainda sinto que os menus não tão do jeito que eu quero… quero que nosso jogo seja realmente um
jogo digno de se olhar". Esta frente olha **menus, navegação e apresentação**: como os jogos de futebol mais
jogados e alguns jogos com menu muito elogiado organizam o hub, abrem pacote, mostram progresso e pagam recompensa.
**Nada de código antes das decisões do fim.**

Como foi feita: leitura de `src/ui/screens/ModeMenu.tsx`, `src/ui/ambientes/` (Ambientes, Estádio, PlayBar, TopBar),
`src/ui/kit/kit.css`, `src/ui/components/CardPack.tsx`, `src/ui/music-sync.ts`, `src/ui/screens/Reward.tsx` e das
telas do Time Ultimate no worktree `ultimate` (`src/ui/ultimate/Ultimate.tsx`, `Goals.tsx`, `Season.tsx`, `Shop.tsx`,
`Chemistry.tsx`, `ultimate.css`); prints de 30–31/10 (menu de modos em 390x844, 844x390; Time Ultimate em
390x844 com save de Natal); brand guide (`docs/marca/brand-guide.md`) e o plano `clash-2x2-menus-arcade.md`. Web:
três rodadas de busca (fontes no fim). **Limite honesto:** quase não há fonte primária de design de UI da EA (nenhuma
palestra ou entrevista de designer achada); o que é "do jogo, sem fonte" está marcado assim. Durações de animação do
FC ninguém publica: os números de tempo deste doc são nossos.

## Resumo

1. O que faz um menu "digno de se olhar" nos jogos aclamados é **um palco vivo + um botão óbvio + recompensa em
   cena**, não mais painéis: o Clash põe a arena e o Batalha no centro; o Rocket League, o seu carro; o FC, o seu
   jogador e a música.
2. O Soccermon **já tem isso na Copa**: menu de modos estilo Smash (`ModeMenu.tsx`), os 5 ambientes com barra
   embaixo e o JOGAR no polegar, o pacote com tom subindo e grito na carta grande. É a nossa melhor tela.
3. O **Time Ultimate ainda é um site**: cabeçalho de 3 andares (título, carteira, temporada, ~330 px de 844),
   abas em cima (fora do polegar), tabelas e listas compridas (aba Metas com ~2.000 px, Jogar com ~1.780 px),
   **sem música** (`music-sync.ts` não tem faixa pra `ultimate`) e sem nenhum Pokémon vivo no hub.
4. A abertura de pacote do UT despeja as 5 cartas numa grade; o ouro (Electrode 80) só aparece dourado. O walkout
   (`.walk`) que a Copa usa pra edição especial **nem está ligado no UT**.
5. O pós-jogo do UT é uma lista estática (placar, Fichas, insígnia, passe, objetivos), quando o FC, o Balatro e o
   Clash fazem disso uma **cascata** curta, cada coisa batendo na sua vez.
6. Do FC vale copiar: pista de raridade antes da carta (luz e cor), revelação em etapas só pras cartas boas (o FC 26
   não anima carta abaixo de 81), hub "Para você" com Continuar/Novo/Em breve, química em 0–3 pontinhos na carta.
7. Do FC vale **evitar**: tirar o botão de pular (o FC 24 tirou e apanhou), animação longa (FC 25), labirinto de
   abas, loja empurrada e pop-up na volta ao menu (crítica clássica ao Madden).
8. Do TCG Pocket: o rasgo do pacote segue o dedo e o som foi a prioridade nº 1 do diretor de arte, porque se abre
   pacote todo dia. Nós também (Mini a cada 12 h).
9. Três direções: **A** polir o UT dentro da casca de hoje (3–5 dias); **B** o UT ganha casa própria, o Clube, com
   barra embaixo, walkout em 3 batidas e pós-jogo em cascata (8–12 dias); **C** uma linguagem de TV única pro jogo
   todo, estilo Persona/Smash (15–25 dias, depois do Natal).
10. Recomendação: **B em etapas**, começando por pacote + pós-jogo (maior ganho, menor mexida) antes de 27/11, hub
    do Clube logo depois; C fica como guia de estilo pra 2027.

---

## 1. Onde estamos (prints e código)

### O que já está bom (não mexer, copiar pro resto)

- **Menu de modos** (`ModeMenu.tsx`, conceito C do `?lab=menu-modos`): fatias na diagonal com cena própria (quadra
  com Charmander e Squirtle, pacote com silhueta, ginásio à noite), selo "ÚLTIMO JOGADO", chips do que tem dentro,
  JOGAR dourado gigante embaixo dizendo o que vai jogar ("Modo Copa · último jogado"). Troca de fatia com FLIP em
  280–300 ms (`flipSlices`). É a tela com mais identidade do jogo, no nível do Smash.
- **Ambientes** (`src/ui/ambientes/`): barra de 5 abas com o Estádio no centro, arrasto com fundo em camadas
  (280 ms), céu pela hora, capitão que olha pro dedo, Pokémon que pulam com coração quando tocados, letreiro de LED.
  É o "hub que respira" do Clash, feito.
- **Kit** (`kit.css`): botão chanfrado que afunda em 60 ms e volta com quique de 180 ms e som; cor por função
  (dourado joga, verde confirma); `Sheet`, `Toast`, `MomentWipe`, `DoorWipe`, `.k-seal` batendo com pop.
- **Pacote** (`CardPack.tsx`): pista no pacote fechado (`packLookOf`: borda dourada se tem ouro, holo se tem
  edição), cartas saindo uma a uma com o tom subindo dó-mi-sol-dó (o "Balatro"), a grande segura 380 ms a mais e
  solta o grito, um toque pula tudo, Reduzir movimento respeitado. Tempos: abrir 560 ms, entre cartas 220 ms,
  saída 460 ms; walkout de edição 1,2 s.
- **Chances na tela** (`Odds`): o contrário do FUT, e certo.
- **Música por tela** (`music-sync.ts`) com virada e ponte entre telas da copa: isso o FC não tem.

### O que está faltando (e por quê)

| # | Onde | O que se vê | Por que pesa |
|---|---|---|---|
| 1 | Hub do UT (`Ultimate.tsx`) | `MenuHead` + carteira + `SeasonBar` empilhados: as abas só começam em ~330 px | No celular, 40% da 1ª tela é cabeçalho; o FC e o Clash põem moeda numa faixa fina no topo |
| 2 | Abas do UT | `.k-tabs` em cima, 5 abas (Pacotes, Coleção, Time, Metas, Jogar) | Fora da zona do polegar e diferente da barra dos ambientes: dois jeitos de navegar no mesmo jogo |
| 3 | Aba Jogar | Tabela de prêmio 4x3 + rival + 7 líderes em lista; JOGAR só no fim | Parece planilha. O FC mostra o prêmio no cartão do modo; o Clash, no próprio botão |
| 4 | Aba Metas (`Goals.tsx`) | Passe + Evento + Do dia + Da semana + Evoluções, ~2.000 px | Tudo com o mesmo peso; nada diz "falta 1 pra ganhar" |
| 5 | Pacotes | Arte do pacote parada, Loja e Chances embaixo na mesma página | Abrir pacote é o momento do dia e está no meio de um formulário |
| 6 | Abrir pacote | `CardPack autoOpen`, grade 2 colunas, 5 cartas; sem `.walk` | O ouro não tem momento próprio; a Copa tem walkout e o UT não |
| 7 | Prêmio (aba Jogar) | Lista fixa: placar, Fichas, insígnia, passe, objetivos | Recompensa sem ritmo: tudo chega junto, nada "bate" |
| 8 | Time | Química como lista de % embaixo do quadro; capitão num `<select>` nativo | O FC mostra a química **na carta, em campo**; o `<select>` é a única peça fora do kit |
| 9 | Som | `TRACK` não tem `ultimate` | Entrar no UT corta a música: o modo novo é o mais silencioso do jogo |
| 10 | Menu de modos | Cartão do UT só com "faltam 28 dias" | Depois de 27/11 ele pode mostrar o que está pronto (pacote cheio, marco do passe), como o Clash mostra baú pronto |

### Toques até jogar (celular em pé)

| Destino | Hoje | Referência | Meta |
|---|---|---|---|
| Copa Relâmpago (quem já jogou) | 2 (JOGAR do menu de modos, JOGAR do Estádio) | Clash 1, Brawl 1 | 2 (ok) |
| Partida do UT | 3 + rolar (JOGAR com UT marcado, aba Jogar, rolar, JOGAR) | FC 26: 2–3 (estimativa) | 2 (JOGAR, JOGAR com o último nível lembrado) |
| Abrir pacote do UT | 2 (aba Pacotes, Abrir) | TCG Pocket 1–2 | 1 a partir do hub (pacote pronto no palco) |
| Ver objetivo perto de sair | 1 + rolar ~1.500 px | FC: tile no hub | 0 (o mais perto aparece no hub) |

---

## 2. Referências

### EA Sports FC 26 e FC 27

- **Menu refeito "do zero"** no FC 26, a começar pelo Play Menu do Ultimate Team, porque o do FC 25 era
  desajeitado e lento. 4 abas principais (Para você, Online, Contra a CPU, Contra amigo) e outras (FC Pro, até 6 de
  eventos ao vivo), trocadas nos gatilhos (realsport101).
- **"Para você"** é o hub personalizado: **Novo** (o que acabou de sair), **Continuar jogando** e **Em breve** (em
  ordem de data, com requisito). Cada modo tem uma gradezinha embaixo pros modos parentes. Os objetivos aparecem
  ao lado do modo (realsport101).
- **Correção pequena que diz muito:** no TU 1.6.4, voltar da Loja ou dos Objetivos devolve pra tela de onde se veio
  (soccergaming). Voltar pro lugar certo é metade de "não se perder".
- **Reclamação nº 1 de menu:** lentidão e "labirinto de abas, cliques demais"; posts de PS5 com troca de aba de
  vários segundos (fórum EA). Elogio: "bonito, mas ineficiente".
- **Abertura de pacote no FC 26** (Dexerto): melhor carta abaixo de 81 **sem animação**, a carta aparece direto;
  81–85, "board" (zoom em posição, liga e nação, com linhas douradas, sem túnel); 86+, walkout no túnel com linhas
  prateadas e o jogador entrando. Carta promo tem respingo de cor no túnel. A bandeira do clube aparece ~2 s.
- **FC 27** (25/09/2026): Galeria FUT, itens holográficos, SBCs refeitos. Sem fonte séria de mudança de menu (um
  "hub andável" que circulou é boato de site com texto de IA). A queixa nº 1 continua sendo sorte de pacote; o mais
  elogiado, Evoluções com prévia (já no nosso plano).
- **Química FC 24+:** 0 a 3 pontos por titular (máximo 33), links por nação, liga e clube, mostrados como 3
  pontinhos na carta em campo (GGRecon, ESTNN).

### FIFA 20, 21, 22, 23 (os UTs lembrados)

- **Walkout clássico:** FIFA 17 mostrava nação e posição devagar, depois o clube; FIFA 18 é o "walkout raiz";
  FIFA 19, o meteoro; FIFA 20 e 21, o túnel com portão abrindo, chuva de glitter, clube e nação, e a carta no fim
  (mein-mmo). No FIFA 23, "board" a partir de 83, câmera virando da direita pra esquerda era a pista de carta alta,
  e levava **~6 s** até mostrar quem era e a nota (Dexerto, Charlie Intel).
- **Pular:** até o FIFA 23 um botão pulava; o FC 24 tirou e a comunidade reclamou até achar gambiarra (Dexerto).
  O FC 25 teve animação nova longa, criticada como teste de paciência (mein-mmo).
- **Química 0–100 com linhas verde/amarela/vermelha** no FIFA 20–23 (do jogo, sem fonte nesta rodada): lia de
  longe, mas exigia decorar regra de link.
- **O que se lembra com carinho:** a **música do menu** antes de tudo (FIFA 14: Disclosure, CHVRCHES; FIFA 12;
  "Song 2" no 98; "Walking on a Dream" no 09). Muita gente lembra da faixa mesmo tendo mutado (Sportskeeda,
  FourFourTwo, balls.ie). O menu do FIFA mostrava nome da faixa e artista num cantinho quando a música trocava (do
  jogo). E a **cor da carta** como evento (TOTY azul, TOTS) (do jogo).

### eFootball / PES myClub

- Nesta rodada não achamos fonte boa. Do jogo: o "olheiro"/contrato com a bola girando de cor pela raridade e o
  jogador "assinando" é o equivalente do walkout; o PES 2013/2017 é lembrado pela jogabilidade, não pelo menu.
  Não pesa na decisão.

### NBA 2K MyTeam e Madden Ultimate Team

- **O que evitar, com nome:** "luzes piscando, contagens regressivas tentadoras e bordas douradas brilhando" (AV
  Club sobre o Madden 17); propaganda do UT a cada volta ao menu (review do Madden 25); animação de pacote "ok na
  primeira vez, depois só toma tempo" (fórum EA); sistemas e moedas demais no MyTeam (Operation Sports).
- Lição: **brilho e contagem são temperos**, um por tela. O nosso brand guide já diz "dourado pouco de propósito".

### Rocket League

- Do jogo: o menu é a garagem com o **seu carro** girando devagar; tudo que se ganha aparece no carro. Drops abrem
  pelo inventário, com a cor da raridade enchendo a tela antes do item (theglobalgaming, Operation Sports).
- Lição pro UT: o fundo do hub é **o seu time**, não uma ilustração genérica.

### Clash Royale e Brawl Stars (Supercell)

- Clash: o botão Batalha é o mais forte da tela, baús com recompensa e cronômetro à vista, barra embaixo (GameGrin).
  Desde out/2025 o baú virou "Baú da Sorte": **toques que podem subir a raridade** ("giros"), 3 por baú comum,
  até 5 estrelas (notas da Supercell, Mobile Matters).
- Brawl Stars: o Starr Drop sobe de raridade a cada toque, com a cor mudando (fontes de fã divergem no número de
  chances; marcar como incerto). Lição: **o toque do jogador participa** da revelação, mesmo que o resultado já
  esteja sorteado.
- Barra de abas embaixo: 3 a 5 destinos, estado ativo e inativo, layout fixo (UXD World). Já fazemos nos ambientes.

### Pokémon (TCG Pocket, Unite, Masters EX)

- **TCG Pocket:** o rasgo do pacote segue o dedo (Serebii); pacote com carta rara solta luz e um som de "craque"
  ao abrir (GameWith); carta imersiva tem animação própria. O diretor de arte Satoru Nagaya disse à Polygon que,
  como se abre pacote todo dia, o time testou pacotes de papel de verdade e caçou o **som** que dá empolgação.
- Unite e Masters EX: do jogo, o lobby mostra o seu Pokémon em 3D com a roupa; o "scout" do Masters tem sinal de
  cor antes de mostrar o par. Sem fonte nesta rodada.
- Lição: a nossa abertura já tem tom subindo; falta o **rasgo no dedo** e um **som de pista** antes da carta grande.

### Persona 5, Smash Ultimate, Splatoon 3

- **Persona 5:** o menu é a identidade (vermelho dominante, tipografia de bilhete de resgate, diagonais que guiam o
  olho, personagem posando). O diretor admitiu que menu estiloso é "realmente chato" de fazer e que no começo era
  "impossível de ler" (PC Gamer, GameSpot). Custo alto de manter.
- **Sakurai (Famitsu 515):** cada UI tem um objetivo (personalidade, facilidade, elegância); o Persona 5 é forte mas
  pode atrasar quem não conhece; tradução muda o tamanho do texto (EN maior), então a UI tem que aguentar; um número
  que resume atributos (o CP) ajuda o público amplo. Vale pra nós: PT e EN, nota da carta.
- **Smash Ultimate:** menu de 4–5 grandes blocos; criticado por navegação confusa nos submenus (Medium). O nosso
  menu de modos já pegou o melhor dele (os blocos), sem os submenus.

### Mario Strikers Battle League e FIFA Street

- Strikers: reviews elogiam animações com personalidade e o especial (Hyper Strike), e criticam o **front-end sem
  graça** e a música do menu irritante (Pocket Tactics, Vooks, TheGamer). Lição: personalidade na partida não
  segura um menu fraco.
- FIFA Street: sem fonte nesta rodada.

### Indie com feedback elogiado (Balatro, Vampire Survivors)

- **Balatro:** o feedback é o produto; efeitos empilhados (tremida, partícula, número, som) e a **intensidade da
  tremida diz o tamanho antes do número**; números contam com tique (guia de terceiro, Blake Crosley). Nosso
  pacote já usa a escada de tom; o pós-jogo do UT ainda não usa nada disso.
- Vampire Survivors (do jogo): o baú abre com moedas jorrando e uma roleta curta; a recompensa grande tem tela
  própria, a pequena só um número subindo.

### Princípios transversais

- **"Juice it or lose it"** (Jonasson e Purho, GDC 2012) e **"The art of screenshake"** (Nijman): ~30 ajustes
  pequenos transformam um jogo sem graça. O contraponto ("Don't juice it or lose it") lembra que o efeito tem que
  combinar com a identidade.
- **Som de UI:** feedback demais dilui o que importa (Designing Sound). Um som por ação, o grande só no grande.
- **Alvo de toque:** 44x44 pt (Apple) e 48x48 dp (Material), do conhecimento geral; o nosso kit já usa 40–44 px.

---

## 3. Padrões concretos

| Padrão | Como os aclamados fazem | Soccermon hoje | Proposta |
|---|---|---|---|
| Hierarquia | 1 nível de abas + cartões; voltar volta pra onde se veio (FC TU 1.6.4) | Copa: menu de modos → ambientes → tela. UT: menu de modos → página com abas em cima → painéis | UT com a mesma barra dos ambientes (5 abas embaixo, centro = jogar) |
| Toques até jogar | Clash 1, FC 2–3 | Copa 2, UT 3 + rolar | UT 2 |
| Hub que respira | Arena/garagem/jogador de capa + música | Estádio vivo; UT parado e mudo | Palco do Clube com os 5 titulares (`FieldSprite`) e faixa própria |
| Transição | FC corta seco (e é criticado pela demora); Persona e Smash deslizam em diagonal | 280 ms em tudo, `MomentWipe` pra momento | Manter; walkout é "momento" (exceção do ADR 0008) |
| Microanimação | Balatro: número conta com tique; Clash: baú pulsa quando pronto | `CountUp`, `.k-seal`, quique do botão | Pacote pronto pulsa 1x a cada 4 s (escala 1→1,04, 320 ms); objetivo pronto pra resgatar com a fita batendo |
| Som de UI | TCG Pocket: som de abrir é prioridade | `select`, `back`, `kick` no pacote, grito na carta grande | Som de "craque" quando o pacote tem ouro (pista), tique no CountUp das Fichas |
| Recompensa | FC: XP e moedas sobem em sequência; Clash: baú no lugar | Copa: tela de recompensa boa; UT: lista estática | Cascata de ≤ 3 s, toque pula |
| Pista de raridade | FC: luz e linhas douradas/prateadas; TCG: luz saindo do pacote | `packLookOf` (borda dourada, holo) | Manter e somar a luz na cor do metal no rasgo |
| Legibilidade | Sakurai: 1 número resume; EN é maior | Nota grande na carta; tabelas no UT | Trocar tabelas por 1 número por cartão ("+50 Fichas se ganhar") |

---

## 4. Copiar / adaptar / evitar

| | O quê | De onde | Onde entra no Soccermon |
|---|---|---|---|
| Copiar | Botão de jogar dominante no polegar, um por tela | Clash, Brawl | Já é regra do kit; levar pro hub do UT |
| Copiar | Revelação em etapas só pra carta boa; carta comum aparece direto | FC 26 (sem animação abaixo de 81) | Walkout só pra ouro (75+) e edição; bronze/prata no leque de hoje |
| Copiar | Pular sempre disponível | FIFA até o 23 (e a bronca no FC 24) | Toque avança uma etapa, "Pular" leva ao fim |
| Copiar | Som pensado pra quem abre todo dia | TCG Pocket | Som de rasgo + "craque" de pista + grito |
| Copiar | Voltar devolve pra tela de origem | FC TU 1.6.4 | `back-nav.ts` já faz na Copa; conferir no UT (Loja → Pacotes) |
| Copiar | Nome da música aparecendo ao trocar de faixa | FIFA (do jogo) | Chip "Tocando: Balanço do menu" 3 s no canto, só no menu |
| Adaptar | Walkout: bandeira → posição → clube → jogador | FIFA 17–23 | **Tipo → posição → região/ginásio → carta** (ícone de tipo, placa PIV/ALA/FIX/GOL, insígnia de `KantoBadge`) |
| Adaptar | Toque que sobe a raridade | Clash (Baú da Sorte), Brawl (Starr Drop) | Sem mudar o sorteio: cada toque no pacote fechado acende uma faísca e a cor final já é a do sorteio (só teatro; nada de "chance") |
| Adaptar | Rasgar com o dedo | TCG Pocket | Arrastar na borda rasga; toque simples continua abrindo |
| Adaptar | Química em pontinhos na carta | FC 24+ | 0–3 pontinhos no chip do quadro (`FormationBoard`), não na carta (carta só pela `?cards=1`) |
| Adaptar | Hub "Para você": Continuar, Novo, Em breve | FC 26 | Palco do Clube: 1 cartão "Perto de sair" (objetivo mais perto) + pacote pronto + JOGAR |
| Adaptar | Garagem com o seu carro | Rocket League | Os seus 5 titulares na quadra do Clube, com o capitão na frente |
| Adaptar | Menu como identidade, diagonais | Persona 5, Smash | Já no menu de modos; levar a diagonal pro walkout e pros cortes do pós-jogo |
| Evitar | Brilho, borda dourada e contagem em tudo | Madden (AV Club) | Um destaque dourado por tela; cronômetro só onde muda decisão |
| Evitar | Pop-up ou propaganda ao voltar pro menu | Madden 25 | Novidade vira pontinho na aba, nunca janela |
| Evitar | Animação longa e sem pular | FC 24, FC 25 | Walkout ≤ 3 s, toque pula |
| Evitar | Labirinto de abas, abas dentro de abas | FC 25/26 (fórum) | 5 abas e só; dentro de Metas, seções (sem segunda fileira de abas) |
| Evitar | Várias moedas e sistemas | MyTeam (Operation Sports) | Só Fichas (já decidido) + pontos de pacote |
| Evitar | Menu estiloso ilegível | Persona 5 no começo | Testar 320 px e EN antes de aprovar |

---

## 5. Direções de redesenho

As três respeitam: celular primeiro, sem emoji (ícones `HudIcon`/`MenuIcon`), Galmuri, kit da transmissão,
"nada teleporta" (280 ms; walkout como momento, ADR 0008), nada automático no time, Reduzir movimento, PT e EN.
Nenhuma muda a carta (`FutCard`/`PokeCard2`): mexer na carta continua passando pela `?cards=1`.

### A. Polir o Time Ultimate dentro da casca de hoje

O hub continua sendo uma `menu-screen`, mas mais curto e com as abas embaixo.

- Cabeçalho numa linha: Fichas, pontos e cartas como chips no `TopBar` (no lugar dos `MenuHead` + `ut-wallet`);
  a temporada vira uma fita fina tocável que abre `Sheet` com prazo e evento.
- Abas viram a barra de baixo (o mesmo `PlayBar`/estilo dos ambientes), Jogar no centro e maior.
- Aba Jogar: nível em `.bc-seg`, embaixo **uma linha** "Vitória +50 · Empate +25 · Derrota +10" (a tabela 4x3 vai
  pra Ajuda), rival em cartão, líderes num carrossel de insígnias (1 linha, toca e abre sheet com a regra).
- Pacote: `.walk` ligado no UT pra ouro e edição (é uma classe), pacote pronto pulsando.
- Prêmio: os itens já existentes entram um por um (`ut-pop` com atraso de 250 ms cada).
- Capitão sai do `<select>` e vira "toque no C" no quadro.

Esforço **3–5 dias**, risco **baixo** (só `src/ui/ultimate/` e CSS). Ganho: organiza, mas não vira "jogo de olhar".

```
390 px · A · hub (aba Jogar)
┌──────────────────────────────────────────┐
│[<] Treinador      ◎420 ✦52 ▣7  [≡][?][⚙] │ topo de sempre, chips
│ ▸ Temporada 1 · Natal termina em 15d     │ fita (abre sheet)
├──────────────────────────────────────────┤
│  NÍVEL  [Fácil][Normal][Difícil][Mestre] │ .bc-seg
│  Vitória +50 · Empate +25 · Derrota +10  │ 1 linha
│ ┌──────────────────────────────────────┐ │
│ │ RIVAL  Fuchsia Ninjas      média 55  │ │
│ │ [spr][spr][spr][spr][spr]  você 55   │ │
│ └──────────────────────────────────────┘ │
│  LÍDERES  (o)(o)(o)(o)(o)(o)(o)(o) ›     │ insígnias, toca = sheet
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │               JOGAR                  │ │ .btn.primary.big
│ └──────────────────────────────────────┘ │
├──────┬──────┬────────┬──────┬────────────┤
│Pacote│Coleç.│ JOGAR  │ Time │  Metas     │ barra (a do Jogar maior)
└──────┴──────┴────────┴──────┴────────────┘
```

### B. O Clube: o Time Ultimate ganha casa (recomendada)

O UT vira um "ambiente" com o mesmo esqueleto dos 5 lugares da Copa (`Ambientes.tsx`: barra, arrasto, fundo em
camadas), mas com 5 telas dele: **Pacotes | Coleção | CLUBE (centro, entrada) | Time | Metas**. O Clube é a quadra
do seu clube (cores do `clubVars`, letreiro, torcida calma do `Stands`) com **os seus 5 titulares** em `FieldSprite`
parados e o capitão na frente olhando pro dedo (o que o Estádio já faz). É a garagem do Rocket League com a arena do
Clash.

**Clube (entrada):** placar da temporada no letreiro ("T1 · Marco 7/40"), o pacote pronto na beira da quadra
pulsando (toque = abre ali mesmo, 1 toque), o cartão "Perto de sair" (objetivo com a maior fração, `k-bar`), e o
JOGAR com o último nível lembrado e o prêmio dentro do botão ("Normal · vitória +50"). Trocar nível: toque no
subtítulo do botão, abre `Sheet`. Líderes: placa "Desafios dos líderes 3/8" que leva pra aba Metas. Música própria.

**Abrir pacote (tela cheia, por cima do Clube):**

| Batida | Tempo (ms) | O quê | Som |
|---|---|---|---|
| 0 | 0 | Pacote no centro, fundo de marca (`#2a3a7a → #070a18`), raios; borda já com a pista (`packLookOf`) | grave baixo |
| Rasgo | toque ou arrasto na borda (o rasgo segue o dedo); toque simples rasga em 300 ms | tampa sai, luz na cor do **melhor metal** (bronze/prata/ouro de `rarity.ts`; holo se edição) | rasgo; "craque" se tem ouro ou edição |
| Leque | +300, 220 entre cartas | bronze e prata saem como hoje (tom subindo) | dó-mi-sol |
| Walkout 1 | +0–600 | tela na **cor do tipo** e o `TypeIcon` bate no meio (pop 320) | tum |
| Walkout 2 | +600–1200 | placa da **posição** (PIV/ALA/FIX/GOL) entra em diagonal da direita (280) | tum |
| Walkout 3 | +1200–1800 | **insígnia ou região** (`KantoBadge` do tipo, ou "Kanto") | tum mais alto |
| Carta | +1800–3000 | carta sobe com luz atrás (`cpack-walk` de hoje, 1,2 s), nota conta até o número, grito | grito + dó agudo |
| Fim | toque | "Guardar" verde; repetida mostra "+3 pontos" batendo | |

Cada toque avança uma batida; "Pular" (terciário, canto de cima) leva ao fim. Da 2ª abertura do dia em diante, ou
com Reduzir movimento, o walkout encolhe pra 1 batida (cor do tipo + carta, ~900 ms). Só ouro (75+) e edição têm
walkout; nunca mais de um por pacote (o melhor), os outros ouros saem no leque com brilho.

**Pós-jogo (cascata, ≤ 3 s, toque pula pro fim):**

| Tempo (ms) | O quê |
|---|---|
| 0 | Placar grande no placar de TV (`.bc-sc`), "VITÓRIA 3x1" |
| 400–1000 | Fichas contando (`CountUp`, tique a cada passo, a carteira do topo recebe com pulo) |
| 1000–1500 | Barra do passe enchendo (`k-bar`, 500 ms); passou de marco: fita "Marco 7" bate (`.k-seal`) |
| 1500 + 250 cada | Objetivos cumpridos batendo um por um com o carimbo verde |
| +400 | O prêmio grande por último, sozinho: insígnia + Pacote Grande, com botão "Abrir agora" (verde) ao lado do "Continuar" |

**Time:** o quadro de hoje (`FormationBoard`) fica; cada chip ganha 0–3 pontinhos de química embaixo da nota e a
lista de % vira "Química do time +2%" num cartão que abre sheet com o detalhe. Capitão: tocar no C.

Esforço **8–12 dias** (pacote + pós-jogo 3–4; Clube com barra e palco 4–6; Time e Metas 1–2), risco **médio**:
o prazo de 27/11 e o arrasto entre abas (reusa `Ambientes`/`tab-slide.ts`, mas a lista de abas é outra). Dá pra
fatiar: pacote e pós-jogo não dependem do Clube.

```
390 px · B · Clube (entrada do Time Ultimate)
┌──────────────────────────────────────────┐
│[<] Treinador      ◎420 ✦52 ▣7  [≡][?][⚙] │
│ ┌──────────────────────────────────────┐ │
│ │▓▓ torcida calma ▓▓ [ T1 · MARCO 7/40 ]│ │ letreiro LED
│ │ ───────────── quadra do clube ───────│ │
│ │      [spr]           [spr]           │ │ os 5 titulares
│ │            [CAPITÃO]        ┌─────┐  │ │
│ │      [spr]           [spr]  │PACOTE│ │ │ pulsa se pronto
│ │                             │ 2/2  │ │ │
│ │                             └─────┘  │ │
│ └──────────────────────────────────────┘ │
│ ┌ PERTO DE SAIR ───────────────────────┐ │
│ │ Vença 1 partida   [████░░] 0/1  +40◎ │ │ k-bar
│ └──────────────────────────────────────┘ │
│ [o] Desafios dos líderes 3/8          ›  │
│ ┌──────────────────────────────────────┐ │
│ │               JOGAR                  │ │
│ │       Normal · vitória +50           │ │ toque no subtítulo = nível
│ └──────────────────────────────────────┘ │
├──────┬──────┬────────┬──────┬────────────┤
│Pacote│Coleç.│ CLUBE  │ Time │  Metas  •  │ • = novidade
└──────┴──────┴────────┴──────┴────────────┘
```

```
390 px · B · walkout (batida 2 de 3)
┌──────────────────────────────────────────┐
│                                 [Pular]  │ terciário
│░░░░░░░░ cor do tipo (Elétrico) ░░░░░░░░░░│
│░░░░░░░░░░░░░░░ ┌──────┐ ░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░ │ TIPO │ ░░░░░░░░░░░░░░░░░│ TypeIcon (batida 1)
│░░░░░░░░░░░░░░░ └──────┘ ░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░╱▔▔▔▔▔▔▔▔▔▔╲░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░╱   ALA      ╲│ placa entra em diagonal
│░░░░░░░░░░░░░░░░░░░░░░░░░░▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░ ( insígnia vem aqui ) ░░░░░░░│ batida 3
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│        toque pra continuar  ● ● ○        │ 3 bolinhas = batidas
└──────────────────────────────────────────┘
```

```
390 px · B · pós-jogo (no fim da cascata)
┌──────────────────────────────────────────┐
│[<] Treinador      ◎580 ✦52 ▣7  [≡][?][⚙] │ carteira já recebeu
│ ┌──────────────────────────────────────┐ │
│ │  VOCÊ  3  x  1  PEWTER ROCHEDO       │ │ placar de TV
│ │            VITÓRIA · Brock           │ │
│ └──────────────────────────────────────┘ │
│        ◎ +160 Fichas                     │ contou
│  PASSE [██████████░░░] Marco 7  [MARCO!] │ fita bateu
│  [v] Jogue 2 partidas         +30 ◎      │ carimbo 1
│  [v] Vença 6 partidas         +1 Grande  │ carimbo 2
│ ┌──────────────────────────────────────┐ │
│ │ (insígnia)  INSÍGNIA DA ROCHA        │ │ o grande, por último
│ │ [pacote]    + Pacote Grande          │ │
│ └──────────────────────────────────────┘ │
│ [ Abrir agora ]          [ Continuar ]   │ verde · azul
└──────────────────────────────────────────┘
```

### C. Transmissão Kanto: uma linguagem só pro jogo todo

Inspirada em Persona 5 e Smash: toda troca de tela vira um **corte de TV** (a diagonal amarela do `MomentWipe`
encurtada pra 280 ms em toda troca, placas que entram em diagonal, letreiro de canal "AO VIVO · KANTO" no topo), o
menu de modos vira a "grade de programação", os ambientes e o Clube do UT ganham a mesma vinheta, e o pós-jogo de
Copa e UT vira o "replay com placar". Inclui A e B.

Esforço **15–25 dias**, risco **alto**: mexe em todas as telas, conflita com o ADR 0004 (a diagonal em toda troca
pode cansar), custa caro de manter (o próprio diretor do Persona reclama) e tem que passar em 320 px e em EN. Bom
como guia de estilo pra 2027 (Modo História), não pra novembro.

```
390 px · C · menu de modos como grade de programação
┌──────────────────────────────────────────┐
│ ● AO VIVO · KANTO           20:14  [⚙]   │ letreiro de canal
│╲▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ ╲  AGORA   MODO COPA      [quadra viva] │ fatia grande
│  ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│╲▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ ╲  A SEGUIR  TIME ULTIMATE  pacote 2/2  │ estado, não só data
│  ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│╲▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ ╲  EM 2027   MODO HISTÓRIA               │
│  ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│ ┌──────────────────────────────────────┐ │
│ │               JOGAR                  │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Deitado e desktop (vale pra B)

- **844x390:** o Clube vira duas colunas (palco à esquerda 60%, coluna com "Perto de sair", líderes e JOGAR à
  direita); a barra continua embaixo, mais baixa (como os ambientes fazem hoje). Walkout: placa e insígnia lado a
  lado, carta no centro.
- **1440x900:** palco do tamanho do Estádio (com `uiZoom()` e `calc(N * var(--vw))`, não vw), barra embaixo
  centralizada; pós-jogo numa coluna de 480 px no meio, como a Sheet do desktop.

### Comparação

| | A. Polir | B. Clube | C. Transmissão |
|---|---|---|---|
| Esforço | 3–5 dias | 8–12 dias | 15–25 dias |
| Risco | baixo | médio (prazo 27/11) | alto |
| Toques até jogar no UT | 2 | 2 | 2 |
| "Jogo de olhar" | pouco | muito no UT | muito em tudo |
| Reusa | kit, `PlayBar` | `Ambientes`, `FieldSprite`, `Stands`, `CardPack`, `CountUp`, `KantoBadge`, `TypeIcon` | tudo + `MomentWipe` |
| Quebra regra? | não | walkout é momento (ADR 0008) | ADR 0004 em revisão |

---

## 6. Recomendação

**B em etapas, nesta ordem:**

1. **0.9.33 (até ~22/11): pacote e pós-jogo.** Walkout de 3 batidas pro ouro e edição, rasgo no dedo, som de
   pista, `Pular`; pós-jogo em cascata com "Abrir agora". São as duas telas de dopamina do modo e não dependem do
   resto. Ligar `.walk` no UT já na hora (é 1 classe).
2. **Junto: música do UT** (faixa nova pela skill `soccermon-musica`; até lá, `menu-balanco` no `TRACK` pra não
   ficar mudo).
3. **Logo depois de 27/11 (antes do evento de Natal): o Clube** com barra embaixo e os 5 titulares no palco; as
   abas de hoje viram as telas da barra sem reescrever o conteúdo.
4. **Dezembro:** química em pontinhos no quadro, Metas com "Perto de sair" no topo, cartão do UT no menu de modos
   mostrando pacote pronto.
5. **C fica como guia** pro Modo História (2027), com um teste pequeno antes (a diagonal só no pós-jogo).

Pra Copa, que já está boa, só três toques baratos da lista: chip "Tocando: <faixa>" ao trocar de música, pacote
da recompensa com o "craque" de pista, e voltar sempre pra tela de origem (conferir com `back-nav.ts`).

---

## 7. Decisões pro Miguel (recomendação primeiro)

1. **Direção:** B em etapas (pacote e pós-jogo antes de 27/11, Clube logo depois) **(recomendado)** / A agora e B
   em dezembro / C.
2. **Abas do Time Ultimate embaixo**, com o Clube no centro, igual aos ambientes **(recomendado)** / manter em cima.
3. **Walkout:** só ouro (75+) e edição, 3 batidas (tipo → posição → insígnia/região → carta), toque avança,
   "Pular" sempre **(recomendado)** / pra toda prata pra cima / sem walkout.
4. **Rasgar o pacote arrastando o dedo** (toque simples continua valendo) **(recomendado)** / só toque.
5. **Toques no pacote fechado acendem faíscas** (teatro, o sorteio não muda) **(recomendado)** / não, abre direto.
6. **Pós-jogo em cascata ≤ 3 s com "Abrir agora"** **(recomendado)** / lista como hoje.
7. **Música do UT:** faixa própria pela skill de música, `menu-balanco` até ela ficar pronta **(recomendado)** /
   `menu-balanco` de vez / outra faixa que já existe (diga qual).
8. **Química em 0–3 pontinhos no quadro do Time** (não na carta) **(recomendado)** / só o painel de hoje.
9. **JOGAR do UT lembra o último nível** e mostra o prêmio no botão **(recomendado)** / escolher nível toda vez.
10. **Chip "Tocando: <faixa>"** por 3 s quando a música troca, só no menu **(recomendado)** / não.
11. **Cartão do UT no menu de modos com estado** (pacote 2/2, marco do passe) depois de 27/11 **(recomendado)** /
    só o nome.
12. **Linguagem C** (cortes de TV) testada só no pós-jogo, decidir em 2027 **(recomendado)** / nunca / já.

---

## Fontes

EA FC e FIFA:
- [FC 26: o menu refeito do Ultimate Team (realsport101)](https://realsport101.com/article/fc-26s-new-ui-a-deep-dive-into-the-redesigned-ultimate-team-menu)
- [FC 26 TU 1.6.4 (soccergaming)](https://soccergaming.com/fc-26-title-update-1-6-4-patch-notes-released/)
- [FC 26 pitch notes, resumo (mein-mmo)](https://mein-mmo.de/en/ea-fc-26-pitch-notes-reveal-dozens-of-new-features-the-most-important-changes-at-a-glance,1525844)
- [FC 26: animações de pacote (Dexerto)](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations)
- [FC 26: como reconhecer walkout (mein-mmo)](https://mein-mmo.de/en/ea-fc-26-how-to-recognize-walkouts-during-pack-opening,1526086)
- [FC 25: animação nova que testa a paciência (mein-mmo)](https://mein-mmo.de/en/a-new-animation-for-ea-fc-25-will-greatly-test-your-patience-in-ultimate-team,1160084)
- [FC 24: como pular animação de pacote (Dexerto)](https://www.dexerto.com/ea-sports/how-to-skip-pack-animations-in-ea-fc-24-2304843)
- [FIFA 23: boards e walkouts (Dexerto)](https://www.dexerto.com/guides/fifa-23-pack-animations-boards-walkouts-1941776/)
- [FIFA 23: animação de pacote revelada (DBLTAP)](https://www.dbltap.com/posts/fifa-23-ultimate-team-pack-animation-revealed-01ga6ykmcwcb)
- [FIFA 23: como saber se é walkout (Charlie Intel)](https://charlieintel.com/fifa-23-ultimate-team-pack-animations/200629)
- [FIFA 20: reconhecer walkout (mein-mmo)](https://mein-mmo.de/en/fifa-20-recognizing-walkouts-pay-attention-to-this-pack-animation,398165)
- [Melhores animações de pacote da série (Khel Now)](https://khelnow.com/gaming/best-ea-sports-fifa-pack-opening-animations-202409)
- [Química no FC 24 (GGRecon)](https://ggrecon.com/guides/fc-24-chemsitry-explained) e [ESTNN](https://estnn.com/ea-fc-24-chemistry-system-explained)
- [Objetivos do FC 25 (fifauteam)](https://fifauteam.com/objectives-football-club-25/) e [Season Pass do FC 25 (fut.gg)](https://www.fut.gg/news/what-is-the-new-season-pass-in-ea-sports-fc-25/)
- [Fórum EA: menus lentos no PS5](https://forums.ea.com/discussions/fc-26-technical-issues-en/persistent-menu-latency-and-page-loading-delays-on-ps5-despite-exc-internet/13407929) e [pedido de menus mais rápidos](https://forums.ea.com/discussions/fc-26-feedback-en/fc-26--future-fc-games-%E2%80%93-faster-menus-needed/13637025)
- [FC 25: menu "feito pra celular" (Final Boss)](https://finalboss.io/ea-sports-fc-25s-stumble-sets-a-high)
- [FC 27: lançamento (Colby)](https://www.colby.si/novica/ea-sports-fc-27-launches-worldwide-on-september-25-2026/) e [UT do FC 27 (Final Weapon)](https://finalweapon.net/2026/08/03/ea-sports-fc-27-football-ultimate-team-deep-dive/)
- [Músicas do FIFA 14 (Sportskeeda)](https://www.sportskeeda.com/football/10-best-fifa-14-songs), [melhores músicas do FIFA (FourFourTwo)](https://fourfourtwo.com/features/best-fifa-songs-ever), [balls.ie](https://www.balls.ie/football/best-fifa-songs/)

Madden e 2K:
- [Madden Ultimate Team (AV Club)](https://www.avclub.com/maddens-ultimate-team-is-another-sign-that-footbal)
- [Review do Madden 25 (MP1st)](https://mp1st.com/reviews/madden-25-review-flag-on-the-play/)
- [Fórum EA: UI do Madden 25](https://forums.ea.com/discussions/madden-nfl-25-ultimate-team-en/menu-ui-needs-work-in-future-titles/11856531)
- [Modos de coleção complicados demais (Operation Sports)](https://www.operationsports.com/have-card-collecting-modes-become-too-complicated)

Rocket League, Supercell:
- [Raridades no Rocket League (The Global Gaming)](https://theglobalgaming.com/rocket-league/rarity-chart) e [abrir drops (Operation Sports)](https://operationsports.com/rocket-league-how-to-open-drops-explained)
- [O que apps podem aprender com a UI do Clash Royale (GameGrin)](https://www.gamegrin.com/articles/what-can-online-apps-learn-from-clash-royales-user-interface)
- [Clash Royale, atualização de outubro de 2025 (Supercell)](https://supercell.com/en/games/clashroyale/blog/release-notes/october-update-2025) e [dezembro de 2025](https://supercell.com/en/games/clashroyale/blog/release-notes/december-update-2025)
- [Baús da Sorte (Mobile Matters)](https://mobilematters.gg/news/clash-royale/october-2025-update)
- [Starr Drops (Mobile Matters)](https://mobilematters.gg/brawl-stars/brawl-stars-starr-drops-guide) e [Brawl Stars, notas de agosto de 2026](https://supercell.com/en/games/brawlstars/blog/release-notes/release-notes-august-2026)
- [Barra de abas embaixo (UXD World)](https://uxdworld.com/?p=16206)
- [Brawl Stars na GDC 2019](https://gdconf.com/news/go-inside-design-supercells-new-hit-game-brawl-stars-gdc-2019)

Pokémon:
- [TCG Pocket: a sensação de abrir pacote (Polygon)](https://www.polygon.com/pokemon/452814/pokemon-trading-card-game-pocket-opening-pack-feel) e [GoNintendo](https://gonintendo.com/contents/40485-pokemon-trading-card-game-pocket-dev-on-why-sound-design-is-key-to-a-satisfying)
- [TCG Pocket (GamesRadar)](https://gamesradar.com/games/pokemon/pokemon-tcg-pocket-understands-the-fun-of-collecting-cards-more-than-any-other-digital-card-game)
- [Prévia do TCG Pocket (Serebii)](https://serebii.net/tcgpocket/preview/) e [GameWith](https://gamewith.net/pokemon-tcg-pocket/49002)
- [Cartas imersivas (The Backdash)](https://thebackdash.com/gaming/pokemon/how-to-collect-every-immersive-card-in-pokemon-tcg-pocket)
- [The Pokémon Company sobre o TCG Pocket](https://corporate.pokemon.co.jp/en/topics/detail/t-28/)

Persona, Smash, Strikers:
- [Persona 5: menus (GameSpot)](https://www.gamespot.com/articles/persona-5s-menus-continue-to-look-stunning/1100-6439532/), [PC Gamer](https://www.pcgamer.com/games/rpg/persona-series-director-says-atluss-flashy-menus-are-actually-really-annoying-to-design), [Mechanics of Magic](https://mechanicsofmagic.com/?p=7280)
- [Sakurai, Famitsu vol. 515 (Source Gaming)](https://sourcegaming.info/2016/11/24/the-aims-of-ui-sakurais-famitsu-column-vol-515/)
- [Smash Ultimate: o redesenho (Julie Wang)](https://medium.com/@juliewang42/on-smash-ultimates-redesign-c0f2f2f55c70) e [Super Jump](https://medium.com/super-jump/armchair-vgux-super-smash-bros-ultimate-e16bfeeea0c9)
- [Mario Strikers Battle League (Pocket Tactics)](https://www.pockettactics.com/mario-strikers-battle-league/review), [Vooks](https://vooks.net/mario-strikers-battle-league-football-review), [TheGamer](https://www.thegamer.com/mario-strikers-battle-league-review/)

Juice e som:
- [Balatro: design (Blake Crosley)](https://blakecrosley.com/guides/design/balatro)
- [Juice it or lose it (GDC Vault)](https://gdcvault.com/play/1016487/Juice-It-or-Lose) e [o contraponto (Game Developer)](https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-)
- [The art of screenshake (Game Developer)](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games)
- [Juicy (Designing Sound)](https://designingsound.org/2017/11/19/sunday-sound-thought-96-juicy/)
- [Juice no áudio, entrevistas com 12 designers (Staffordshire)](https://eprints.staffs.ac.uk/8527/1/3677084.pdf)
