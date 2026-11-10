---
description: Rota Índigo, 2ª pesquisa (10/11/2026): animação pra cada casa e evento, equilíbrio medido (robô + telemetria), UX/UI do mapa largo e das telas, top 6 e perguntas.
---

# Rota Índigo 2: dar vida às casas e ver se tá divertido (10/11/2026)

Pedido do Miguel (10/11, antes de dormir): "uma segunda pesquisa sobre a Rota Índigo: uma animação de roleta de cassino
no Cassino, uma animação de cura no Centro Pokémon, esse tipo de coisa. além de revisões de balanceamento da Rota Índigo
pra ver se tá divertido mesmo, UX/UI, outras animações".

Base: `origin/main` (0.9.44.2), lida em `.claude/worktrees/tipos-hd`. A e B do [rota-indigo.md](rota-indigo.md) já estão
no ar. Também li o que está pronto em branch e ainda não subiu: `animacoes` (`src/game/ceremony.ts`, insígnia, créditos)
e `arte-tela` (`src/ui/components/EventSet.tsx`, cenário de pixel do Cassino e da Safari). Nada de código mudou; só este doc.

Regras herdadas do [animacoes-novas.md](animacoes-novas.md) (pra não virar "111"): trocar antes de somar; o que se repete
não ganha tempo; raro e longo é pulável no toque e vira quadro parado com Reduzir movimento; visual não promete
mecânica; nada disso toca `src/engine/` nem `ENGINE_VERSION`.

## 0. Resumo em 6 linhas

1. **A dificuldade é plana:** o robô ganha 60–70% de toda partida da Rota, da 1ª à Final; os jogadores de verdade, 55–73%.
   O time cresce (64 → 86 de média) e o rival cresce junto (57 → 83). Não tem rampa nem respiro.
2. **O que mais dói é morrer cedo:** 1 em cada 5 Rotas terminadas pelos jogadores acaba depois de 2 partidas (perdeu as
   duas primeiras). A 1ª partida é quase cara ou coroa (56% de vitória real, 63% no robô), e o Ás na 1ª linha é 48%.
3. **A Final é a partida mais fácil da Rota** (82% real, 71% robô). O muro de verdade é o grupo.
4. **Quase ninguém assiste às partidas:** 69% das partidas da Rota terminam com "Pular pro fim". A graça da Rota está no
   mapa e nas casas. É onde a animação rende mais.
5. **Casas:** Ás, Safari e Cassino estão equilibrados (nenhum domina). Os eventos "?" quase sumiram no mapa largo
   (0,41 por Rota; eram 1,34). 14% das visitas ao Cassino chegam sem ₽ pra jogar.
6. **Tela:** o Cassino corta as roletas a 390 px, o balcão de prêmios mostra o caça-níquel, a Safari não mostra o
   Pokémon que você pegou, o Centro tem uma Lass no lugar da Enfermeira, e o mapa é uma teia de linhas tracejadas.

## 1. Animações por casa e evento

### O que já existe e dá pra reaproveitar

| Peça | Onde | Serve pra |
|---|---|---|
| Revelação da aposta | `EventScreen` em `src/ui/screens/CupMap.tsx` (`REVEAL_MS` 1700, `ev-shake`, `ev-reel` em `long-cup.css`) | a escolha só vale quando a animação acaba: o molde de Safari e Cassino já está pronto, só falta a cena |
| Cenário de pixel | `EventSet.tsx` (branch `arte-tela`): `pixelArt()`, o caça-níquel `SLOT`, o `CasinoCounter`, a grama da Safari | o caça-níquel e o balcão já desenhados; a animação gira os rolos dentro dele |
| Sprites PMD no DOM | `FieldSprite` (`src/ui/ambientes/FieldSprite.tsx`): Idle, Walk, Attack, Shoot, Hop, Hurt, Charge + extras Sleep, Sit, Eat, Faint | capitão andando no mapa, quem treina, quem acorda no Centro, o selvagem na grama |
| Kit de cinema | `src/game/cine.ts` (`crowdFlash`, `impactFrame`, `shockwave`, `holdFrame`) | é Phaser: serve de referência de tempo e de cor; as telas da Rota são React, então o equivalente vai em CSS |
| Cerimônia | `src/game/ceremony.ts` (branch `animacoes`): roteiro em ms puro e testável, `reducedHold`, `paintFan` | o mesmo jeito de escrever cada animação: um plano em ms com teste das fases e o quadro final pro Reduzir movimento |
| Jingle curto | `scripts/musica/pecas/insignia.mjs` → `public/assets/sfx/insignia.mp3`, `playBadgeJingle()` (branch `animacoes`) | jingle de cura do Centro no mesmo molde (2 s, composição própria) |
| Sons | `playSfx` (ZzFX: `select`, `kick`, `post`, `status`, `thud`, `whoosh`), `playCry`, `playCrowd` | "plim" das bolas na máquina (`select` com tom subindo), "toc" da bola balançando (`post` baixo), rolo parando (`kick` curto) |
| Andar no mapa | `go2()` em `CupMap.tsx`: `WALK_MS` 520, `.cm-me` desliza com `cm-bob` | hoje é o sprite BW da carta deslizando; vira o PMD andando no mesmo tempo |

### Referências

| Jogo | O que faz | O que serve pra nós |
|---|---|---|
| **Pokémon FRLG, Cassino de Celadon** | 3 rolos (7, R da Rocket, Pikachu, Psyduck, Slowpoke, cereja), o jogador para um por um, o "Reel Time" faz o rolo escorregar | rolos que param um por um, com o 3º demorando quando os dois primeiros batem |
| **Pokémon (todos), Centro Pokémon** | a enfermeira pega as bolas, a máquina toca o jingle e as bolas piscam juntas, "Esperamos ver você de novo!" | as 5 bolas do seu time na máquina, o jingle e o "volte sempre": todo fã reconhece em 1 s |
| **Pokémon, captura** | a bola balança até 3 vezes; cada balançada é um teste; o "clique" fecha | o número de balançadas conta o quase: fugir na 3ª dói mais do que na 1ª |
| **HGSS** | placa com o nome do lugar desce no canto quando você entra numa rota | o nome da região aparecendo sem tela nova |
| **Slay the Spire** | a fogueira: o personagem senta, o fogo estala, um clique; o mapa marca o caminho andado | Treino e Folga curtos; o caminho aceso atrás de você |
| **Balatro** | Roda da Fortuna gira e diz "Nope!" ou dá o efeito; pontuação em camadas (número, tremida, som) que cresce com o tamanho | a roleta do balcão com a chance desenhada na roda; animação proporcional ao prêmio |
| **Luck be a Landlord** | o jogo inteiro é um caça-níquel; cada giro é curto e o resultado aparece símbolo por símbolo | giro curto (menos de 2 s) e a leitura do resultado símbolo por símbolo |
| **Hades** | a porta mostra o prêmio; pegar a bênção tem um "estouro" de luz e uma fala | o Baú abrindo com a luz da raridade antes das cartas |
| **Inscryption** | o Comerciante e a fogueira dos sobreviventes: cada parada tem um personagem e um ritual de 2–3 s | cada casa da Rota com quem atende e um gesto próprio (Joy, Bill, o Pokémaníaco da Safari) |

### As propostas, casa por casa

Frequência = quantas vezes aparece por Rota (robô no mapa largo, caminho ao acaso, 400 Rotas). Esforço: P horas, M 1–2
dias, G 3+ dias. Impacto de 1 a 5. Tudo pulável no toque; com Reduzir movimento, só o quadro final.

| # | Casa | Por Rota | O que acontece | Duração | Reaproveita | Esforço | Impacto |
|---|---|---:|---|---|---|---|---:|
| R1 | **Andar no mapa** | 9 passos | O capitão vira o PMD andando (Walk, virado pra casa escolhida) em vez do sprite da carta deslizando; a linha acende atrás dele como um rastro; poeirinha no pé ao chegar | 520 ms (o de hoje) | `FieldSprite`, `go2`, `.cm-me` | P | 4 |
| R2 | **Casa nova se abrindo** | 9 | Ao voltar pro mapa, as casas da próxima linha acendem em cascata (60 ms entre elas, `cm-pop`) e as que ficaram pra trás apagam | 300 ms, dentro do scroll que já existe | `cm-pop`, `.cm-node.open` | P | 3 |
| R3 | **Região nova** | 5 | Placa de madeira desce no canto com o nome ("Mt. Moon"), estilo HGSS, antes da fala do líder; a música já troca sozinha | 1,4 s, uma vez por região | `cm-region-name`, `told` | P | 4 |
| R4 | **Treinador Ás** | 0,9 | No mapa, um "!" pula em cima do Ás quando você toca nele (o treinador que te viu). No VERSUS, a variante do Ás: tela listrada de batalha Gen 1 (0,5 s) e o Ás desliza com a faixa "TREINADOR ÁS" | +0,6 s só no Ás | `VersusIntro.tsx` (`INTRO_MS`) | M | 4 |
| R5 | Ginásio | 0,7 | Nada novo: a insígnia batendo (A5, branch `animacoes`) já é o momento dele | — | — | — | — |
| R6 | **Centro Pokémon** | 0,2 | A Enfermeira Joy (sprite `nurse` do Showdown) no lugar da Lass. Ao confirmar, as 5 bolas do time pousam na máquina uma a uma, com um "plim" que sobe de tom; jingle de cura de 2 s; as bolas piscam juntas 3 vezes; aí o efeito: o cartão amarelo sai voando e rasga, ou quem estava fora acorda (Sleep → Hop). "Prontinho! Volte sempre." | ~3 s | jingle no molde da insígnia, `FieldSprite` Sleep/Hop, `playSfx('select', tom)` | M | 5 |
| R7 | **PC do Bill** | 0,2 | Tela de PC verde liga com bip ("PC do Bill"), o reserva vira luz e desce pra caixa em linhas de varredura, a carta nova sobe montando de baixo pra cima | 1,5 s | `FutCard`, CSS `clip-path` | M | 3 |
| R8 | **Treino / Folga** | 0,7 | Quem treina dá o golpe (Attack ou Shoot em loop) num boneco de treino de pixel e a barra enche com "+50%"; fechou a barra, emenda na evolução de sempre. Folga: o time deita (Sleep, o "z" já existe) e 5 moedas voam pro ₽ | 1,2 s | `FieldSprite`, `tr-fill`, `tr-zzz`, `pixelArt` | P | 3 |
| R9 | Mercado e Planalto | 1,1 | Moedas voando quando o ₽ muda (D1 do [animacoes-novas.md](animacoes-novas.md)); o Planalto ganha vitrine de moldura dourada | 0,6 s | `CountUp` | P | 2 |
| R10 | **Baú** | 0,6 | Baú de pixel no chão, treme 2 vezes, a tampa abre com a luz da cor da raridade (bronze, prata, ouro) e as 3 cartas saem de dentro (a revelação do 1 de 3 já existe) | 0,8 s | `pixelArt`, revelação do `Reward` | P | 3 |
| R11 | **Zona Safari** | 0,55 | O selvagem escolhido fica na grama (PMD Idle). O Pokémaníaco arremessa a Safari Ball em arco, luz vermelha suga o Pokémon, a bola cai e balança 1, 2 ou 3 vezes ("toc" em cada). Pegou: clique e 3 estrelinhas, e o Pokémon aparece do lado com o nome. Fugiu: a bola abre num clarão e ele corre pro mato (Walk) | 2,4–2,8 s | `REVEAL_MS`, `FieldSprite`, `ev-shake`, grama do `EventSet` | M | 5 |
| R12 | **Cassino** | 0,4 | **Caça-níquel:** 3 rolos de verdade (tira de ícones em loop) giram juntos e param um por um com um "tlec"; se os 2 primeiros batem, o 3º desacelera mais; prêmio: as luzes da máquina piscam e moedas caem na bandeja. **Balcão de prêmios:** uma **roleta** com a fatia verde do tamanho da chance (60%); a bolinha gira e assenta; verde, a carta desce do expositor | 2,2–2,6 s | `SLOT` e `CasinoCounter` (`EventSet.tsx`), `ev-reel` | M | 5 |
| R13 | Entrevista | rara | Flashes de câmera na borda | 0,6 s | `crowdFlash` (em CSS) | P | 2 |
| R14 | **Ovo nascendo** | rara | O ritual dos jogos: o ovo balança 3 vezes, racha, clarão branco, "Oh? … nasceu!" | 2,5 s | `EvolutionOverlay` como molde | M | 4 |
| R15 | Pedra | 0,8 telas | Usar já tem a evolução. Guardar: a pedra voa até o botão da Mochila. Vender: moedas pro ₽ | 0,4 s | — | P | 2 |
| R16 | Pássaro lendário | rara | A sombra do pássaro cruza o cenário e o grito toca | 1 s | `playCry` | P | 3 |
| R17 | **Chegada ao Planalto** | 0,6 | O mapa sobe até o topo, os portões da Liga abrem e o Lance aparece (a fala já existe) | 2 s, uma vez por Rota | `cm-story` | P–M | 3 |
| R18 | Pular com etiqueta | ~2 | A etiqueta voa até onde vale (₽ pro contador, troca grátis pro Mercado do mapa) | 0,4 s | — | P | 2 |

Fora: animação nova no Jogo (já tem VERSUS, partida e a recompensa) e no cartão amarelo/vermelho (já tem o `foul-*`).
Isso é "110".

**Por que vale:** 69% das partidas da Rota terminam com "Pular pro fim" (14 dias: 1.527 pulos em 2.205 partidas; na
Relâmpago é 70%). O jogador fica na Rota pelo mapa e pelas casas, não pela partida. Uma animação de 2–3 s numa casa que
aparece 0,2 a 0,6 vez por Rota não cansa; no que se repete a cada passo (R1, R2), o tempo continua o de hoje.

**Cuidado com o caça-níquel:** a chance continua escrita no botão, e o "quase" (3º rolo devagar) é só tempero visual,
com ₽ do jogo e resultado já sorteado pela seed. A roleta do balcão mostra a chance no tamanho da fatia: o que você vê é
o que vale.

## 2. Equilíbrio: está divertido?

### De onde vêm os números

- **Robô, mapa largo, código do ar (0.9.44.2):** 400 Rotas inteiras com partida de verdade (`runMatch`), caminho ao
  acaso, "Monta pra mim", pega o que melhora o time (mesma política `pega` do [rota-indigo.md](rota-indigo.md)), ~18 min
  na fila pesada. Script no scratchpad: `rota/c/rota-analise.sim.test.ts` e `rota/c/agg-c.py`. Título com erro de ±2–3 pp.
- **Jogadores, mapa estreito (01/11 a 08/11, 0.9.40 a 0.9.43):** 183 Rotas começadas em 86 sessões, 126 terminadas,
  773 partidas. É o melhor retrato de gente de verdade, mas no mapa antigo.
- **Jogadores, mapa largo (0.9.44, no ar desde 09/11):** **2 Rotas** começadas e 1 terminada. Não dá pra ler nada ainda.
  A telemetria nova ("puladas por tela", "etiquetas do Pular") tem 8 etiquetas no total. Dá pra olhar de novo em ~1 semana.

O robô e os jogadores batem bem onde dá pra comparar (vitória na 1ª partida 63% × 56%; título 30% × 29% das Rotas
terminadas; eliminado depois de 2 partidas 13% × 20%). O robô não usa MT, tática nem substituição.

### Curva de dificuldade, partida a partida

| Partida | Robô: vitória | Robô: time × rival | Jogadores: vitória (n) |
|---|---:|---|---:|
| 1 (Rota 1) | 63% | 64 × 57 (+7,6) | 56% (154) |
| 2 (Floresta) | 65% | 71 × 69 (+1,7) | 63% (143) |
| 3 (Mt. Moon) | 68% | 80 × 74 (+6,3) | 60% (113) |
| 4 (Cerulean) | 60% | 83 × 78 (+4,5) | 63% (96) |
| 5 (grupo 1) | 62% | 85 × 80 (+4,5) | 56% (75) |
| 6 (grupo 2) | 63% | 85 × 80 (+5,2) | 73% (74) |
| 7 (grupo 3) | 63% | 85 × 80 (+5,5) | 55% (73) |
| 8 (Final) | 71% | 86 × 83 (+2,9) | **82%** (45) |

Leitura:
- **Plana.** Toda partida é ~60–65%. O jogo compensa o crescimento do time (`LONG_DIFFICULTY` sobe de −2 a +4), então
  não existe "fase fácil pra montar" nem "chefe". Com ~8 gols por jogo, mesmo +7 de média dá só 63%: a partida é
  sorteada demais pra a rampa aparecer. Diversão > realismo: isso é ok, mas faz a 1ª partida ser perigosa.
- **A 1ª partida é a mais traiçoeira pro jogador** (56%). O time ainda é o do draft (64 de média) e as evoluções não
  vieram (o time sobe +7 da 1ª pra 2ª partida, quase tudo de evolução jogando e do 1 de 3 do rival).
- **O Ás na 1ª linha é cara ou coroa:** 48% de vitória (95 Rotas), contra 68% do Jogo. Nas outras linhas ele fica em 60%;
  no total, Ás 57%, Jogo 70% e Ginásio 56%.
- **A Final é mais fácil que o grupo** (82% real, 71% robô), apesar de ser a mais forte no papel. O grupo 3 dos jogadores
  (55%) parece ser jogo morto: quem já ganhou os 2 primeiros ganha só 53% do 3º (n=17, pista, não prova).

### Onde a Rota acaba

| Fim | Robô (400) | Jogadores (126 terminadas) |
|---|---:|---:|
| Eliminado depois de 2 partidas (perdeu as 2 primeiras) | 13% | **20%** |
| Eliminado no mapa (3ª ou 4ª partida) | 26% | 26% |
| Eliminado no grupo | 20% | 18% |
| Perdeu a Final | 12% | 6% |
| **Campeão** | **30%** | **29%** |

**Desistência:** das 183 Rotas começadas pelos jogadores, 57 (31%) não terminaram. Olhando as da 0.9.43 e 0.9.44 (30
casos), **metade saiu sem jogar nenhuma partida** (no draft ou no mapa da Rota 1): olhou e saiu, ou guardou pra depois.
O resto sai espalhado (depois de um resultado, no meio do grupo).

### Duração

- Jogadores: campeão leva **12,7 min** (mediana, numa sessão só; quase todo mundo a 8x e pulando partida). Todas as Rotas
  terminadas: 8,9 min (as eliminações curtas puxam pra baixo). O "~35 min" da copa longa é a 1x sem pular.
- Robô: 35 telas pra um campeão, 26 na média.

### Quantas decisões reais

Por Rota de campeão (robô): **9 escolhas de caminho** (todas entre tipos diferentes de casa), **8,7 telas de recompensa**
(1 de 3 ou pular), **3,2 eventos** com mais de uma saída, **1,3 Mercado**, **0,9 Treino**: ~23 decisões. Média de todas
as Rotas (com as eliminadas): ~18. Antes do mapa largo eram 5,3 escolhas de caminho e 3,1 entre tipos diferentes.

### Cada casa: compensa?

Δtime = média dos titulares logo depois da casa. "Nada mudou" = sem mudança no time, no ₽ nem nos itens.

| Casa | Por Rota | Δtime | Δ₽ | Δitens | Nada mudou | Leitura |
|---|---:|---:|---:|---:|---:|---|
| Ás (vitória) | 0,92 (0,52 vencidas) | **+3,5** | +0,5 | 0 | 0% | prêmio grande, risco grande (57% de vitória): bom do jeito que está |
| Jogo (₽ x2 / item / MT) | 1,4 vencidos | +1,7 a +1,8 | +2,4 a +3,4 | +1 no item | 0% | o 1 de 3 do rival carrega o Jogo |
| Ginásio (vitória) | 0,37 | +0,9 | 0 | +0,6 | 0% | 56% de vitória pra +0,9: o mais fraco das partidas, mas tem a insígnia |
| Baú | 0,60 | +0,9 | 0 | +0,7 | 0% | sólido |
| Mercado | 0,85 | +0,7 | −9,8 | +0,5 | 15% | sólido |
| Planalto | 0,21 | +0,3 | −16 | +0,7 | 1% | cumpre o papel: gasta o ₽ que sobrava |
| Safari | 0,55 | +0,5 | 0 | 0 | 87% | 31% das visitas o robô nem joga a bola; quem entra quase sempre vai pro banco |
| Cassino | 0,38 | 0 | −3,7 | +0,3 | 14% | **14% das visitas só têm "Sair"** (sem ₽ pra jogar); 64% vão no caça-níquel |
| Centro / PC do Bill | 0,43 | 0 / troca | 0 | 0 | — | metade vira PC do Bill (troca em 70%); o Centro tira o amarelo |
| Treino | 0,69 | 0 | +1,0 | +0,4 | 40% | meia barra de evolução não aparece no Δ (vem jogando) |
| Evento "?" | 0,41 | 0 | −0,5 | −0,1 | 80% | raro agora (era 1,34 por Rota no mapa estreito) |

**Alguma casa dominante?** A rodada da B já mediu o robô que entra em toda casa X: Ás 28%, Safari 28%, Cassino 32%,
contra 30% ao acaso. Ninguém domina. "Título com e sem a casa no caminho" (só pista: quem chega no fim do mapa já
sobreviveu) dá Ás 29% × 30%, Safari 28% × 30%, Ginásio 30% × 29%, Cassino 36% × 26%, Centro 42% × 22%.
O Centro sai na frente porque tira o amarelo: é uma vida a mais.

**Sempre ou nunca escolhida pelos jogadores:** não dá pra saber. A casa escolhida no mapa não é gravada (o
[rota-indigo.md](rota-indigo.md) deixou de fora por pedir migração). Dá pra gravar **sem migração**: o evento `screen`
já é aceito pelo banco e cabe um campo a mais (`casa`, `linha`) quando a tela sai do mapa.

### Variação entre Rotas (sensação de "build")

- No fim, **1,9 dos 5 titulares veio da Rota** (não do draft); nos campeões, 2,5. Só 13% das Rotas terminam com o time
  do draft intacto. Em média 2,6 Pokémon evoluem.
- Dois times campeões têm em média **0,8 espécie em comum** de 5. Os mais vistos: Arcanine, Dragonite, Rapidash,
  Jolteon, Alakazam (o "Monta pra mim" do robô puxa pros mesmos).
- O 1 de 3 do rival, o Ás e a evolução jogando mudam o time de verdade. O caminho muda o tipo de prêmio (item, ₽, carta
  rara) mais do que o time.

### Chato, forte demais e bom

**Chato:**
1. **Morrer em 5 minutos.** 20% das Rotas dos jogadores acabam na 2ª partida. É a pior sensação do modo longo: draft
   inteiro, mapa novo, e acabou. A 1ª partida é 56% e não tem como o jogador se preparar pra ela.
2. **Ás na 1ª linha** (48% de vitória) parece armadilha pra quem chega: a ficha diz "rival mais forte", mas na 1ª
   partida o time ainda não tem nada.
3. **Eventos "?" sumiram** (0,41 por Rota): Entrevista, Patrocinador, Rocket, Lendário aparecem em 2–7% das Rotas cada.
   Eram o tempero de história.
4. **Cassino sem ₽** (14% das visitas): você escolhe a casa e só pode sair.
5. **Pedra:** 92% das telas da pedra acabam em "Vender" (a tela agora paga ₽4, então não é morta, mas é um clique por
   região).

**Forte demais:** nada passou da conta. O Ás dá +3,5 de time, o maior ganho por casa, mas custa 57% de vitória e não
mexe no título (28% × 30%).

**Bom:**
- Título em 30% (robô) e 29% (jogadores): igual ao de antes do mapa largo. A B não deixou a Rota mais fácil.
- 9 escolhas de caminho por Rota, todas entre casas diferentes. Antes eram 3,1.
- Ás, Safari e Cassino empatados com o caminho ao acaso: dá pra ir no que você gosta.
- O ₽ que sobra caiu de ~32 pra 27 (o Planalto gasta).

### Ajuste de número que o robô justifica

Testei no robô (mesmas 400 seeds, só no script, nada no jogo) a regra **"perder a 1ª partida da Rota não dá amarelo"**:

| | Hoje | 1ª derrota sem amarelo |
|---|---:|---:|
| Eliminado depois de 2 partidas | 13% | **0%** |
| Chega ao grupo | 61% | 74% |
| Título | 30% | **35%** (±3) |
| Time no fim | 83,3 | 84,4 |
| ₽ sobrando no fim | 26,9 | 30,1 |

Some o "morreu em 5 minutos" e o título sobe ~5 pontos. A outra saída (tirar o Ás da 1ª linha) mexe menos no título,
mas não salva quem perde 2 Jogos normais. É regra nova de jogo e equilíbrio: **fica pro Miguel** (pergunta 1). Se
ele achar que 35% ficou fácil, dá pra pagar com o rival da Final um pouco mais forte, já que ela é a partida mais fácil.

## 3. UX/UI da Rota

Prints headless a 390x844 e 1440x900 no servidor local (`tipos-hd`, porta 8391), nas telas de demo. Ficaram em inglês
(o navegador sem janela abre em inglês). Pasta: `~/.cache/claude-tmp/claude-1000/-home-bartolomeu-Projects-soccermon/f446d3d3-ffc7-4829-b86e-0a71ade8ebd8/scratchpad/rota/c/shots/`.
Nenhum erro de console nem rolagem pro lado.

### Achados

| # | O quê | Print | Conserto | Esforço |
|---|---|---|---|---|
| U1 | **Cassino a 390: as roletas saem da tela** (a 3ª estrela e o "Prêmio!" cortados na borda direita) | `cassino-revela-390x844.png` | a revelação centralizada na cena (hoje vai pro lado do treinador) | P |
| U2 | **O balcão de prêmios mostra o caça-níquel** (3 estrelas e "Prêmio!") e a carta que você ganhou não aparece | `cassino-revela-*.png` | a roleta do R12, ou no mínimo a carta descendo | P (mínimo) |
| U3 | **Safari: a mesma chance aparece duas vezes, invertida** ("Foge 15%" na carta e "85%" no botão) | `safari-390x844.png` | uma só: "Pega 85%" no botão, nada na carta (ou o inverso) | P |
| U4 | **Safari: o Pokémon pego não aparece** na revelação, só a bolinha e "Pegou Rhyhorn!" | `safari-revela-*.png` | o R11; no mínimo o sprite dele do lado da bola | P |
| U5 | **Centro com a Lass** (`who: 'lass'`), fundo liso e o coração genérico | `centro-390x844.png` | a Enfermeira Joy (`nurse` do Showdown), a máquina de cura de pixel | P |
| U6 | **O mapa é uma teia:** todas as ligações tracejadas, em cruz, com o mesmo peso. Quem chega não vê o que dá pra alcançar 2 linhas à frente | `mapa-inicio-390x844.png`, `mapa-meio-1440x900.png` | ligações que você não alcança mais a 15% de opacidade; as alcançáveis a 60%; as da próxima escolha acesas (já são) | P |
| U7 | **PC: a última linha do mapa sai cortada** e o painel do lado sobra com "Escolha seu caminho" vazio | `mapa-meio-1440x900.png` | o painel mostra a ficha da casa sob o mouse (o que cada casa dá), ou a legenda das casas; `rowH` com folga pro rodapé | P |
| U8 | **Cassino visitável sem ₽** (14% das visitas só têm "Sair") | robô | na ficha da casa: "Precisa de ₽3"; ou a casa apagada no mapa com menos de ₽3 | P |
| U9 | O capitão rival cobre o nome da casa de cima (F5) e o Treino de costas no celular (D6) | `as-ficha-390x844.png`, `treino-390x844.png` | já consertados na branch `arte-tela`, falta subir | — |
| U10 | Cassino e Safari com fundo liso e ícone gigante (D7) | `cassino-*.png` | já feito na `arte-tela` (`EventSet.tsx`) | — |
| U11 | No celular, título "Rota Índigo", ₽ e Patrocínios ocupam ~200 px em cima do mapa; no meio da Rota a faixa dos Patrocínios aparece cortada no alto | `mapa-meio-390x844.png` | o status numa linha só presa no topo do mapa (já era a proposta 9 da revisão de 30/10) | P |
| U12 | O Treino não diz onde está a Folga: o "+₽5" com uma barra azul embaixo do banco parece barra de evolução | `treino-390x844.png` | rótulo "Folga" no botão e a barra só em quem evolui | P |

### Fluxo partida → recompensa → mapa

Depois de um Jogo vencido: resultado → 1 de 3 do rival → prêmio da casa (item/MT/carta rara) → às vezes a pedra →
mapa. São até 4 telas antes de andar de novo. Pular a partida (69% das vezes) deixa só elas. Não proponho juntar agora
(o [menos-e-mais.md](menos-e-mais.md) já cuida do excesso), mas a pedra pode virar uma linha dentro do prêmio quando
ninguém do time usa ("Pedra do Trovão: vender por ₽4 ou guardar") em vez de tela própria. Pede o ok do Miguel (muda a
pedra, que ele decidiu em 31/10).

### Textos (curto, sem cara de IA)

Os textos da Rota estão bons. Três ajustes:
- Safari: "Uma Safari Ball, uma chance. Quem você pegar entra no lugar de um reserva." → "Uma Safari Ball, uma chance.
  Quem você pegar entra no banco."
- Centro: "Bem-vindo ao Centro Pokémon! Quer que a gente cuide do seu time?" → com a Joy: "Bem-vindo ao Centro Pokémon!
  Deixa que a gente cuida do seu time."
- Cassino: a revelação do balcão hoje diz "Prêmio!" e a do caça-níquel também. O caça-níquel pode dizer "Três
  estrelas!" (o texto `ganhouItem` já existe e não é usado na revelação).

### O que confunde quem chega

- "Ás" sozinho no mapa (a estrela vermelha) não diz que é mais difícil: só a ficha diz. Proposta: a casa do Ás com a
  borda vermelha e o rótulo "Ás +1".
- 4 contadores no alto (partida, ₽, sorteios, e no mapa os Patrocínios) antes da 1ª partida. Não mexer agora: é o
  assunto do [menos-e-mais.md](menos-e-mais.md).
- Metade de quem abandona sai antes da 1ª partida: o mapa inteiro aparece de uma vez (36 casas). O R2 (casas acendendo)
  e o U6 (teia apagada) ajudam a ler "só olhe a próxima linha".

## 4. Proposta

### Top 6 pra fazer agora

| # | O quê | Por quê | Esforço | Precisa do Miguel? |
|---|---|---|---|---|
| 1 | **Cassino de verdade (R12 + U1 + U2 + U8):** rolos girando e parando, roleta no balcão com a fatia da chance, nada cortado a 390, ficha avisando "Precisa de ₽3" | o pedido dele, conserta 3 bugs de tela | M | não (tela); a roleta mostra a chance que já existe |
| 2 | **Centro Pokémon com a Joy e a cura (R6 + U5):** 5 bolas na máquina, jingle de 2 s, cartão amarelo rasgando | o pedido dele; o Centro é a casa que mais pesa no título (tira o amarelo) | M | o jingle passa pelo ouvido dele (regra da música) |
| 3 | **Safari com a bola balançando (R11 + U3 + U4):** arremesso, 1 a 3 balançadas, o Pokémon aparecendo ou fugindo; uma chance só na tela | a Safari hoje é a casa mais "rascunho" | M | não |
| 4 | **Mapa vivo e legível (R1 + R2 + R3 + U6 + U7):** capitão PMD andando, casas acendendo, placa da região, teia apagada, painel do PC com a ficha | é o que o jogador vê 9 vezes por Rota; não soma tempo | P–M | não |
| 5 | **Telemetria da casa escolhida** (campo `casa` e `linha` no `screen` ao sair do mapa, sem migração) | sem isso não dá pra saber o que os jogadores evitam; processo, sobe sem perguntar | P | não |
| 6 | **Primeira derrota sem amarelo (Rota 1)** ou **sem Ás na 1ª linha** | o "morrer em 5 min" é o maior chato medido | P | **sim**: é equilíbrio (regra 5) |

Ordem: 5 primeiro (horas, e começa a juntar dado já), depois 1, 2, 3 juntos (mesma tela, `EventScreen` e `EventSet.tsx`,
em cima da `arte-tela`), depois 4. O 6 só com o ok dele.

Dependência: 1 e 3 ficam melhores em cima do cenário de pixel da branch `arte-tela` (D7). Juntar a `arte-tela` antes.

### Depois

- R4 (Ás no VERSUS), R8 (Treino), R10 (Baú), R14 (Ovo), R17 (Planalto): M/P, impacto 3–4, quando os 4 primeiros
  estiverem no ar e ele tiver jogado.
- R7 (PC do Bill), R13, R15, R16, R18, R9: impacto 2–3; só se sobrar.
- Eventos "?" de volta: uma casa de Evento garantida em cada linha de parada (hoje é sorteada com Treino, Safari e
  Cassino). Pede robô antes e depois.
- Final mais difícil ou grupo mais fácil: esperar 1–2 semanas de dado do mapa largo.
- Juntar a tela da pedra no prêmio (seção 3).

## Decidido pelo Claude (10/11, Miguel dormindo)

- **Fazer agora (0.9.45/0.9.46):** 5 (telemetria da casa), 1 (Cassino de verdade, com o "quase" no 3º rolo e roleta no balcão de prêmios), 2 (Centro com a Enfermeira Joy, máquina de cura e jingle próprio de 2 s), 3 (Safari com arremesso e balançadas, uma chance só na tela), 4 (mapa vivo e legível), os bugs de tela achados (roletas cortadas a 390, prêmio que não mostra a carta, chance dupla na Safari, Lass no lugar da Joy, teia de linhas, mapa cortado no PC) e a pedra sem uso virando uma linha dentro do prêmio.
- **Fica pro Miguel (equilíbrio e regra nova):** 1ª derrota sem amarelo ou tirar o Ás da 1ª linha; subir o rival da Final (esperar o dado do mapa largo); garantir uma casa de Evento por linha.

## Perguntas que só o Miguel responde

1. **Morrer em 5 minutos:** a 1ª derrota da Rota 1 não dá amarelo (recomendo; número acima), ou tirar o Ás da 1ª linha,
   ou deixar como está?
2. **Final:** está mais fácil que o grupo (82% contra 55–73% dos jogadores). Deixa (final feliz) ou sobe o rival?
   Recomendo esperar o dado do mapa largo.
3. **Jingle do Centro:** composição nossa de 2 s "no clima" do jingle de cura (recomendo), ou sem jingle (só o "plim" das
   bolas)?
4. **O "quase" no caça-níquel** (o 3º rolo desacelerando quando os 2 primeiros batem): pode, ou prefere os 3 rolos
   parando no mesmo ritmo?
5. **Roleta no balcão de prêmios** com a fatia do tamanho da chance (recomendo), ou o balcão sem animação (a carta só
   desce)?
6. **Eventos "?" sumiram** (0,41 por Rota): garantir uma casa de Evento por linha de parada?
7. **Tela da pedra** dentro do prêmio quando ninguém usa (recomendo), ou continua tela própria?

## Fontes

- Código (origin/main 0.9.44.2, `tipos-hd`): `src/ui/screens/CupMap.tsx` (`EventScreen`, `Training`, `go2`, `REVEAL_MS`),
  `src/ui/long-cup.css`, `src/store/long-events.ts` (`SAFARI_FLEE`, eventos), `src/store/rota-map.ts`, `src/engine/cup-map.ts`
  (`LONG_DIFFICULTY`, `GYM_SHIFT`), `src/store/long-cup.ts` (`nodeOpponent`, grupo), `src/i18n/pt/longCup.ts`,
  `src/analytics/track.ts`, `src/ui/components/VersusIntro.tsx`, `src/game/audio.ts`; branch `animacoes`
  (`src/game/ceremony.ts`, `playBadgeJingle`); branch `arte-tela` (`src/ui/components/EventSet.tsx`).
- Telemetria: `public.game_events` (consultas só de leitura), `npm run stats -- --dias 2 --md`.
- Pokémon FRLG, Cassino: [Slot machine (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Slot_machine),
  [Celadon Game Corner (Bulbapedia)](https://m.bulbapedia.bulbagarden.net/wiki/Celadon_Game_Corner),
  [Rocket Game Corner (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Rocket_Game_Corner),
  [Prêmios e linhas do caça-níquel do FRLG (Game8)](https://game8.co/games/Pokemon-FireRed-LeafGreen/archives/584800).
- Centro Pokémon: [Pokémon Center (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Center),
  [Pokémon Center Nurse (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Center_Nurse).
- Captura e Safari: [Catch rate e as balançadas (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Catch_rate),
  [Safari Zone (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Safari_Zone),
  [Bill's PC (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Bill%27s_PC).
- Luck be a Landlord: [Wikipedia](https://en.wikipedia.org/wiki/Luck_Be_a_Landlord),
  [review (Pocket Gamer)](https://www.pocketgamer.com/luck-be-a-landlord/review).
- Slay the Spire: [Rest Site (wiki)](https://slay-the-spire.fandom.com/wiki/Rest_Site). Balatro:
  [The Wheel of Fortune (wiki)](https://balatrogame.fandom.com/wiki/The_Wheel_of_Fortune). Hades:
  [Boons (wiki)](https://hades.fandom.com/wiki/Boons). Inscryption: [Trader (wiki)](https://inscryption.fandom.com/wiki/Trader).
- Docs da casa: [rota-indigo.md](rota-indigo.md), [rota-indigo-revisao.md](rota-indigo-revisao.md),
  [animacoes-novas.md](animacoes-novas.md), [revisao-arte.md](revisao-arte.md), [menos-e-mais.md](menos-e-mais.md).

## Decidido pelo Miguel (10/11, manhã)

- "Quase" do 3º rolo e roleta do balcão: ficam.
- Título de tela em 21 px (22 quebra o 9 da Galmuri14); nota da carta sai do tamanho ruim (galeria antes de subir).
- Equilíbrio aprovado: 1ª derrota da Rota sem cartão amarelo, rival da Final mais forte (deixa de ser a mais fácil), um Evento "?" garantido por linha.
