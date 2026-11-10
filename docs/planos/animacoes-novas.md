---
description: Brainstorm de animações novas (09/11/2026): o que já existe, referências, 24 ideias com esforço e risco de virar "110", o top 5, storyboards da invasão da Rota e da taça, e as decisões.
---

# Animações novas: dar vida sem passar de 110 (09/11/2026)

Pedido do Miguel (09/11): "queria um brainstorm de animações novas pra adicionar no Soccermon. tipo da torcida
invadindo quando ganha a Rota Índigo, ou dos Pokémon levantando a taça, ou sei lá. quero dar um pouco mais de vida pro
jogo".

No mesmo dia ele recebeu o feedback de que o jogo está com "110 de 100" ([menos-e-mais.md](menos-e-mais.md)) e
decidiu: sem faltas; cutscene rara pode ser longa, o que se repete é curto; diversão > realismo; evento grande tem
momento e animação próprios.

Base: `origin/main` (0.9.44.2), lida em `.claude/worktrees/tipos-hd`. Só leitura + web: nada de código mudou e nada
rodou no navegador.

## As regras deste doc (pra não virar 111)

1. **Trocar antes de somar.** Se já existe um momento ali (o Hop do gol, o desfile do Hall, a faixa FIM DE JOGO),
   a ideia nova o substitui, não entra do lado.
2. **O que se repete não ganha tempo.** Comemoração de gol, fim de partida, Mercado: a animação cabe no tempo que a
   tela já para hoje. Só o raro (título da Rota, 1ª insígnia) pode ser longo.
3. **Raro e longo é pulável no toque** (como o walkout e o desfile já são) e com Reduzir movimento vira o quadro final
   parado.
4. **Sem botão nem tela nova.** Vida de ambiente acontece sozinha; o jogador não precisa aprender nada.
5. **Visual não promete mecânica.** Nada de suor se não existe cansaço, nada de chuva se clima não muda o jogo
   (o fã de Pokémon lê clima como regra).
6. Só tela: nada disso toca `src/engine/` nem `ENGINE_VERSION`.

## 1. O que já existe (pra não repetir e pra reaproveitar)

### Kit e sprites

| Peça | Onde | O que dá pra reaproveitar |
|---|---|---|
| Kit de cinema | `src/game/cine.ts` | `CineRig` (plano, contraplano, push-in, holandês, chicote, tremida), `impactFrame`, `speedLines`, `shockwave`, `crack`, `chroma`, `crowdFlash` (flashes da torcida na borda), `lightTrail`, `mangaPanels`, `holdFrame`, `TypeFx` (partícula de cada tipo) |
| Holofote e faixas | `src/game/cinematics.ts` | `spotlight`, `slowMotion`, `drama` (o GOOOOL!), `setPieceBanner`, `superBanner`, `pin` (texto preso à tela) |
| Sprites PMD da quadra | `public/assets/field/` (`scripts/build-pmd-atlas.ts`) | Idle, Walk, Attack, Shoot, Hop, Hurt, Charge, Swing; opcionais Pose (falta em 121) e Trip (falta em 124) |
| PMD fora da quadra | `public/assets/field/extra/` | Sleep, Sit, Eat, Faint (já usados na Sala e no Eliminado; o Phaser carrega com `preloadExtra`) |
| Retratos PMD | `public/assets/portraits/` | 151 normais + 13 emoções (happy, joyous, inspired, shouting, crying, teary, sad, angry, surprised...) em ~110 a 120 espécies cada |
| O PMDCollab tem mais | (fora do atlas hoje) | Rotate (giro), Nod (aceno), DeepBreath (bocejo), LookUp, Wake: entram rebuildando o atlas, se valer |
| Comemoração por jeito | `comemoracaoOf()` em `src/game/walkout-plan.ts` | já classifica cada espécie em `pulo`, `giro` (voadores e asas) ou `pose` (de pé, humanoide); hoje só o walkout usa |
| Torcida em pixel | `Stands`, `crowdTile` em `src/ui/ambientes/Estadio.tsx` | gente de 7 px na cor do clube, 2 quadros, flashes |
| Taças | `Trophy.tsx` (SVG), `PixelTrophy.tsx` e `src/game/room-art.ts` (pixel) | a taça já existe nas duas linguagens |
| Pokémon ambiente | `src/ui/ambientes/wild.ts`, `WildZone.tsx` | pools por lugar, ações (andar, olhar, dormir, pular, emote, perseguir, fugir, cair no 5º toque), balão do artilheiro, céu pela hora (`skyOf`) |
| Números | `CountUp.tsx`, `FinalCard.tsx` (cascata), `UnlockNotice.tsx`, `.k-seal` | número rolando com overshoot, selo batendo, fila de avisos |
| Som | `playCrowd('gol' / 'vaia' / 'uuh')`, `playCry`, `playGoalCry`, músicas `campeao`, `eliminado`, `ultima-partida` | |

### Momentos que já têm animação

| Momento | Como é hoje | Frequência |
|---|---|---|
| Walkout (pacote do UT) | estádio de pixel, silhueta, jogada, vidro quebrando (`WalkoutScene.ts`) | raro |
| Golpe máximo N1 a N3 | carga, estouro, faixa do capitão, N3 com close e painéis | algumas por partida |
| Duelo da bicuda | cutscene de 15 s com falas, plano e contraplano | raro |
| Evolução | tela cheia "O quê? X está evoluindo!" (`EvolutionOverlay.tsx`) | raro |
| Gol | GOOOOL! com o nome, grito, torcida, tremida pelo peso (virada e final = explosão), estouro do tipo se foi golpe; quem marcou faz **Hop por 2,5 s** (`Action.Celebrate` → `Hop`, o mesmo pra todo mundo) | toda partida |
| Gol sofrido | goleiro cabisbaixo (Hurt) | toda partida |
| Pênaltis | quem bate pula ou se machuca, goleiro idem | às vezes |
| Fim de jogo | faixa FIM DE JOGO e a cascata do `FinalCard` | toda partida |
| Título (qualquer copa) | `ChampionView`: confete, taça SVG, CAMPEÕES!, 3 destaques; antes, o **desfile do Hall da Fama** (cada Pokémon 1,7 s em GIF BW, com grito) **em todo título**, uma vez | Relâmpago: comum |
| Eliminado | o time desmaia (Faint) | comum |
| Sala de troféus | quarto de noite com luz, seu Pokémon passeando, câmera aproxima do troféu tocado | 4% das sessões |
| Menus | Estádio com capitão na embaixadinha e a torcida, 5 ambientes com Pokémon ambiente, quadra da Home com cenas curtas | sempre |
| Créditos | `CreditsParade`: sprites desfilando no rodapé | quase nunca |

**O buraco que o Miguel sentiu é real:** o título da Rota (8 jogos, mapa, grupo, Final) acaba igual ao da Relâmpago
(4 jogos): FIM DE JOGO, cascata, confete e o desfile. Entre o apito da Final e a tela de campeão, o time em quadra
não faz nada: ninguém comemora junto, ninguém ergue taça. E o desfile de 12 s se repete a cada título da Relâmpago,
que é o modo mais jogado: o raro e o comum estão com o mesmo peso.

## 2. Referências: como os jogos dão vida

| Jogo | O que faz | O que serve pra nós |
|---|---|---|
| **EA FC / FIFA** | Cerimônia do troféu com o capitão erguendo e o time em volta; a comunidade reclama que é a mesma cena desde o FIFA 17 e que a FC 26 cortou cerimônias e ficou "menos imersiva" | Taça erguida é o que o fã de futebol espera; e cena repetida igual cansa: variar pelo capitão e pelo jeito |
| **Futebol de verdade** | Invasão de campo depois do título (City 2022, Trabzonspor que invadiu antes do fim e teve que sair, Copenhague com boias no campo) | A invasão é bagunça alegre e é a imagem que fica: perfeita pra um título raro |
| **Mario Strikers** | Cada personagem tem animação de gol, de gol sofrido, de vitória e de derrota (o Wario jogado pro alto pelos capangas que deixam cair; o Waluigi rebolando) | Comemoração por personalidade, curta e cômica; o "jogar o capitão pro alto" |
| **Rocket League** | Goal explosions: cada gol tem a assinatura de quem marcou | O gol já explode pelo tipo do golpe; falta o **corpo** de quem marcou ter jeito próprio |
| **Pokémon (jogos)** | Hall of Fame: cada Pokémon aparece sozinho, depois o treinador; insígnia com jingle e frase ("Você recebeu a Insígnia da Cascata!"); créditos com o time depois do Campeão | O desfile já existe; falta a insígnia batendo e os créditos depois do 1º título da Rota |
| **Pokémon (anime)** | O Red levado pelo Carvalho até o Hall da Fama; o Calem com os Pokémon no Hall | O Carvalho já mora no Lab: ele pode estar na foto do Hall |
| **Inazuma Eleven / Captain Tsubasa** | Cenas de anime disparadas por jogadas, o time erguendo a taça no fim da temporada | Momento grande com cara de anime: o kit `cine.ts` já fala essa língua |
| **Clash Royale** | O Rei esfregando o troféu, emotes de vitória curtos, a coroa ao vencer | Vitória curta e engraçada; o emote do capitão ("Vamooo!") já existe |
| **Balatro** | Vários canais de feedback empilhados em cada ponto (número, tremida que cresce com o tamanho, som), cada um curto | Juice que **diz** o tamanho da coisa: moeda voando pro ₽ só quando ganha |
| **Slay the Spire** | Final do 1 é seco; a Mega Crit disse que quer o do 2 "mais extravagante quando você vence" | Até jogo enxuto sente falta do momento grande no fim |
| **Hades** | Milhares de falas que reagem ao que aconteceu, a maioria toca uma vez só | O ambiente lembrar o último resultado (a torcida comemorando o título que você acabou de ganhar) |
| **Animal Crossing / Stardew** | Moradores com rotina, silhueta clara de longe, festivais com data; o mundo segue andando sem o jogador | Pares de Pokémon fazendo coisa juntos, quem é da noite à noite, data especial (Natal) |
| **"Juice it or lose it"** | Máximo de resposta pro mínimo de ação | Vale pro micro; no grande, o oposto: segurar e deixar respirar |

## 3. As ideias

Formato de cada uma: **o que acontece** · quando e quanto aparece · duração · pulável · reaproveita · esforço
(P horas, M 1–2 dias, G 3+ dias) · risco de virar "110" · **nota de impacto (1 a 5)**. As fracas estão marcadas.

### A. Grandes momentos raros

**A1. Rota Índigo: a torcida invade a quadra** (a ideia do Miguel)
- No apito da Final da Rota vencida, a câmera abre, a torcida (gente de pixel na cor do clube) desce dos dois lados
  e corre pra quadra junto com Pokémon selvagens da Rota (Pidgey, Rattata, Oddish...), o time se junta no meio, o
  capitão é jogado pro alto e a taça sobe (A2 é o clímax). Storyboard na seção 5.
- Quando: só o título da Rota (o mais raro do jogo hoje). Duração 10–12 s. Pulável no toque (pula pro quadro da taça).
- Reaproveita: `CineRig`, `crowdFlash`, `TypeFx` (confete na cor do clube), pools de `wild.ts`, `comemoracaoOf`,
  `playCrowd('gol')`, música `campeao`, o relógio próprio da cena (dá pra gravar quadro a quadro pro TikTok como o walkout).
- Esforço **G** (a torcida correndo é sprite novo de 7 px gerado por código; os selvagens precisam carregar no 2º
  tempo, como as evoluções já carregam). Risco 110: **baixo** (raro, pulável). **Nota 5.**

**A2. Levantar a taça**
- O time fica em meia-lua, o capitão vem à frente, junta força (Charge) e ergue a taça de pixel (Pose; quem não tem
  Pose faz Hop), estouro de flashes e confete, os outros pulando. Corta pra tela de campeão já com a taça no lugar.
- Quando: todo título. **Curta na Relâmpago (3 s)** e é o fim do A1 na Rota. Pulável.
- Reaproveita: a pose do "Vamooo!" (`POSE_CHARGE_MS` 450 + `POSE_MS` 1600 já existem), `PixelTrophy`/`room-art`,
  `crowdFlash`, `Confetti`.
- Esforço **M**. Risco 110: médio se somar; **zero se trocar**: na Relâmpago ela entra no lugar do desfile repetido
  (ver A4). **Nota 5.**

**A3. Volta olímpica** (fraca sozinha)
- O time dá a volta na quadra acenando pra torcida.
- Andar em volta da quadra a 390 px é longo e lê pouco; sozinha é 8 s de nada acontecendo. Vira **3 s de cauda do
  A1** (o time andando por trás do letreiro final) ou nada. Esforço P dentro do A1. Risco alto sozinha. **Nota 2.**

**A4. Hall da Fama com flash** (refinar o desfile, não somar)
- O desfile vira foto: cada Pokémon entra andando em PMD (o mesmo da quadra, resolve o D1 da
  [revisao-arte.md](revisao-arte.md)), para, **flash branco com som de câmera**, e fica na foto. No fim, o treinador e
  o Carvalho entram na foto do time inteiro. 0,9 s por Pokémon em vez de 1,7 s.
- Quando: **só no título da Rota e no 1º título de cada modo** (hoje é em todo título). Pulável.
- Reaproveita: `HallParade.tsx` (o fluxo), `FieldSprite` (Walk), `crowdFlash`/`impactFrame` branco.
- Esforço **M**. Risco 110: **diminui** o tempo total (menos desfile, mais curto). **Nota 4.**

**A5. Insígnia batendo**
- 1ª vitória contra o clube de cada líder: a insígnia entra girando, bate no meio da tela como selo, "Você ganhou a
  Insígnia da Cascata!" com um jingle de 2 s; depois voa pro estojo. Hoje a insígnia só acende no mapa de Kanto com a
  etiqueta NOVO.
- Quando: no máximo 8 vezes por save. Duração 2 s. Pulável.
- Reaproveita: `KantoBadge` (`BadgeCase.tsx`), `.k-seal`, fila do `UnlockNotice`.
- Esforço **P** (+ o jingle, pela skill de música). Risco 110: baixo. **Nota 4.**

**A6. Montinho na virada no fim**
- Gol da virada nos acréscimos ou na Pressão final: os quatro companheiros correm até quem marcou e caem por cima
  (um monte de sprites com Hop e Trip), a câmera dá o soco que já existe pra virada.
- Quando: raro (virada + fim). Cabe nos 2,5 s de comemoração que o motor já segura: não soma tempo.
- Reaproveita: `goalLevel` (a virada já é "explosão"), `view.shift`/`lunge` pra puxar os sprites (o motor manda na
  posição: o montinho é deslocamento visual por cima, e volta antes da saída de bola).
- Esforço **M** (o deslocamento visual sem brigar com os snapshots é o difícil). Risco 110: baixo. **Nota 4.**

**A7. Créditos depois do 1º título da Rota**
- Como no Red/Blue: depois do 1º título da Rota, os créditos rolam com o **seu** time andando no rodapé e a
  `ultima-partida` tocando; no fim, "Obrigado por jogar" e o logo.
- Quando: **uma vez por save**. Duração 30–40 s, pulável a qualquer momento.
- Reaproveita: `CreditsParade.tsx` inteiro.
- Esforço **P**. Risco 110: nenhum. **Nota 3.**

**A8. Evolução do capitão na final** (fraca)
- Variante da evolução em tela cheia com a torcida cantando e os flashes, só na Final.
- A evolução já é o momento mais caprichado da partida; uma variante só pra Final é muito código pra pouca diferença.
  Esforço M. **Nota 2.**

**A9. Primeiro Ícone tirado** (fraca, já existe)
- O walkout do UT já tem a versão de Ícone (`WalkoutScene`, `walkTier`). No máximo, o 1º Ícone da vida toca a versão
  mais longa (uma bandeira). Esforço P. **Nota 2.**

### B. Partida

**B1. Comemoração com jeito**
- Quem marcou deixa de fazer o mesmo Hop pra todo mundo: **pulo** (Hop), **giro** (voadores e asas: o sprite gira pelas
  8 direções, como pião, que é de graça) ou **pose** (de pé e humanoides: Charge e Pose; sem Pose, pulo). No gol da
  Final, mais a partícula do tipo saindo do corpo.
- Quando: todo gol seu ou do rival. Duração: **os mesmos 2,5 s** do `Action.Celebrate`. Não é pulável (não precisa).
- Reaproveita: `comemoracaoOf()` pronto, `animForAction`, `TypeFx`.
- Esforço **P**. Risco 110: **nenhum** (troca o Hop, não soma tempo nem texto). **Nota 5.**

**B2. Fim de jogo com cara**
- Debaixo da faixa FIM DE JOGO: quem ganhou pula (Hop), quem perdeu senta (Sit) ou fica cabisbaixo (Hurt); no
  empate, Idle. Antes da cascata do `FinalCard`.
- Quando: toda partida, dentro do tempo que a faixa já fica. Sem custo de tempo.
- Reaproveita: `preloadExtra` (Sit, como a Sala), a resposta de vitória que a faixa já dá (`punch('touch')`).
- Esforço **P–M** (carregar o atlas extra na partida). Risco 110: baixo. **Nota 4.**

**B3. Ola de flashes**
- Na Pressão final e no gol da Final, os flashes da torcida correm em onda pela borda da tela em vez de piscar
  soltos.
- Quando: final de jogo apertado e Final. 1,5 s. Sem botão.
- Reaproveita: `crowdFlash` + `edgePoints` (é só a ordem e o atraso).
- Esforço **P**. Risco 110: baixo (troca o flash solto). **Nota 3.**

**B4. Banco reagindo** (fraca no celular)
- Os reservas na beira da quadra levantando no gol e pondo a mão na cabeça na bola na trave.
- Hoje não tem banco desenhado; a 390 px a quadra já está cheia (nomes, setinha, faixa). Seria camada nova num lugar
  apertado. Se um dia entrar, como retrato pulando na barra da beira. Esforço M. **Nota 2.**

**B5. Goleiro frustrado+** (fraca, já existe)
- Já tem o goleiro cabisbaixo. Socar o chão no 3º gol sofrido é mais do mesmo. **Nota 1.**

**B6. Clima na partida** (fraca, descartar na partida)
- Chuva na Misty, calor no Blaine.
- Fã de Pokémon lê clima como regra (Rain Dance, Sunny Day). Se não muda nada, engana; se muda, é regra nova de jogo
  (passa pela skill de balanceamento). **Neve só no Estádio em dezembro** (ver C6), sem tocar na partida. **Nota 1** em
  jogo.

**B7. Pokémon cansado** (descartar)
- Suor, ofegante no fim do jogo. Não existe cansaço no motor; mostrar isso quebra o "carta = campo". **Nota 1.**

### C. Menus e ambientes vivos

Já tem bastante: andar, olhar, dormir, pular, emote, perseguir, fugir, cair no 5º toque, balão do artilheiro, céu pela
hora no Estádio e na Rota. Antes de somar ação nova, vale o F2 da [revisao-arte.md](revisao-arte.md) (o Idle no relógio
certo: o Pikachu para de flutuar). Vida em sprite que quica errado não convence.

**C1. Pares**
- Dois Pokémon ambiente fazendo coisa juntos: tabelinha no Estádio (um passa, o outro devolve), dois olhando o
  computador do Lab, um cochilando encostado no outro na Sede. Um par por cena, às vezes.
- Quando: sempre, sorteado. Sem botão. Reaproveita `wild.ts` (`chase` já sabe achar outro), a bola do Estádio.
- Esforço **M**. Risco 110: baixo. **Nota 3.**

**C2. O Estádio lembra o último resultado**
- Voltou de um título: a torcida faz a ola, a faixa de LED diz "CAMPEÕES DA ROTA ÍNDIGO", o capitão campeão está na
  quadra com a taça de pixel do lado. Voltou de uma eliminação: o capitão cochilando no banco, LED "Bora de novo".
  Até a próxima copa começar.
- Reaproveita: `Stands`, LED, `FieldSprite` (Sleep), `PixelTrophy`.
- Esforço **P–M**. Risco 110: nenhum (é a mesma cena com outro estado). **Nota 4.**

**C3. Quem é da noite**
- O céu já segue a hora; à noite (22 h a 6 h) o pool troca: Gastly e Zubat na Rota, mais gente dormindo no Estádio,
  Hoothoot não (é Gen 2). De manhã, Pidgey e Spearow.
- Reaproveita: `skyOf`, `POOLS`, `mood: 'sleepy'`. Esforço **P**. Risco: nenhum. **Nota 3.**

**C4. Troféu novo na Sala**
- Primeira visita à Sala depois de um título: seu Pokémon anda até a vitrine nova, a luz acende nela e ele faz Pose.
- Reaproveita: `TrophyRoomScene` (`room:focus`, o Pokémon que já passeia). Esforço **P–M**. Risco: nenhum.
  Impacto limitado: a Sala é aberta em 4% das sessões. **Nota 3.**

**C5. Toque com rosto** (fraca)
- Tocar no Pokémon do seu clube mostra o retrato com emoção (joyous). O toque já pula, grita e derruba no 5º. Mais
  uma camada no mesmo gesto. **Nota 2.**

**C6. Datas**
- Dezembro: neve caindo no Estádio e na Rota, gorro de Natal no capitão da embaixadinha (o menu de modos já tem o
  evento de Natal). Pra mais datas, só as que o jogo já comemora.
- Reaproveita: o céu e o calendário do evento. Esforço **P**. Risco: baixo (sazonal). **Nota 3.**

### D. Micro-juice

**D1. Moedas voando pro ₽**
- Quando o ₽ sobe (vitória, juros, Patrocínio), 4 a 8 moedinhas de pixel voam até o contador com o som de moeda
  (o Miguel gosta de som de moeda) e o número rola com o `CountUp`. Quanto maior o ganho, mais moedas (Balatro).
- Quando: cascata do `FinalCard` e Mercado. 0,6 s, dentro da cascata que já existe.
- Esforço **P**. Risco 110: médio se tocar em todo +1: **só em ganho de partida e Patrocínio**. **Nota 4.**

**D2. Nível do treinador subindo**
- A estrela do chip dá uma volta e o número sobe com um "ding" de level up.
- Cuidado: o [menos-e-mais.md](menos-e-mais.md) vai juntar Missões + Medalhas + Nível em "Metas" (0.9.46). Dar
  animação a uma escada que vai ser repensada é botar luz no que a gente quer simplificar. Esperar o B2 de lá.
  Esforço P. **Nota 2.**

**D3. Carta e botões** (fraca, já existe)
- Holo no ponteiro (`useHoloPointer`), quique do botão (`--ease-pop`, 180 ms), pacote revelando: já está no ponto.
  Mexer em carta passa pela galeria `?cards=1`. **Nota 1.**

## 4. Tabela de tudo

| # | Ideia | Frequência | Duração | Esforço | Risco 110 | Nota |
|---|---|---|---|---|---|---:|
| A1 | Invasão no título da Rota | rara | 10–12 s | G | baixo | 5 |
| A2 | Levantar a taça | todo título | 3 s (Relâmpago) | M | zero se trocar o desfile | 5 |
| B1 | Comemoração com jeito | todo gol | 2,5 s (já existe) | P | nenhum | 5 |
| A4 | Hall da Fama com flash | Rota e 1º título | 0,9 s/Pokémon | M | diminui | 4 |
| A5 | Insígnia batendo | 8 por save | 2 s | P | baixo | 4 |
| A6 | Montinho na virada | rara | 2,5 s (já existe) | M | baixo | 4 |
| B2 | Fim de jogo com cara | toda partida | 0 s a mais | P–M | baixo | 4 |
| C2 | Estádio lembra o resultado | até a próxima copa | ambiente | P–M | nenhum | 4 |
| D1 | Moedas voando pro ₽ | ganhos | 0,6 s | P | médio | 4 |
| A7 | Créditos depois da 1ª Rota | 1 por save | 30–40 s | P | nenhum | 3 |
| B3 | Ola de flashes | fim apertado, Final | 1,5 s | P | baixo | 3 |
| C1 | Pares | ambiente | — | M | baixo | 3 |
| C3 | Quem é da noite | ambiente | — | P | nenhum | 3 |
| C4 | Troféu novo na Sala | depois de título | 3 s | P–M | nenhum | 3 |
| C6 | Datas (neve em dezembro) | sazonal | ambiente | P | baixo | 3 |
| A3 | Volta olímpica (só como cauda do A1) | rara | 3 s | P | alto sozinha | 2 |
| A8 | Evolução do capitão na final | rara | — | M | baixo | 2 |
| A9 | 1º Ícone (já existe) | rara | — | P | baixo | 2 |
| B4 | Banco reagindo | todo gol | — | M | médio | 2 |
| C5 | Toque com rosto | toque | — | P | médio | 2 |
| D2 | Nível subindo (esperar Metas) | missões | 1 s | P | médio | 2 |
| B5 | Goleiro frustrado+ | gol sofrido | — | P | alto | 1 |
| B6 | Clima na partida | toda partida | — | M | alto (promete regra) | 1 |
| B7 | Pokémon cansado | toda partida | — | M | alto (mente) | 1 |
| D3 | Carta e botões | — | — | — | já existe | 1 |

## 5. Storyboards

### 5.1 Rota Índigo: invasão e taça (A1 + A2), 10–12 s, pulável

Entra depois do apito da Final da Rota vencida (inclusive nos pênaltis), antes do `FinalCard`. Não toca em replay,
Melhores momentos nem Duelo. Tudo no relógio da cena, com semente da partida (o clipe sai igual na gravação 9:16).

| Quadro | Tempo | Tela | Som |
|---|---|---|---|
| 1. Apito | 0,0 | A faixa FIM DE JOGO de sempre, mas a câmera **não corta**: segura no time parado no meio, meio segundo de silêncio | apito longo, a torcida prende o ar |
| 2. Explode | 0,6 | O time pula junto (B1: cada um no seu jeito), `crowdFlash` em toda a borda, confete na cor do clube cai do alto | grito da torcida (`gol`), grito do capitão |
| 3. Invasão | 1,5 | A câmera abre (zoom out com `CineRig`). Das duas laterais, dezenas de torcedores de 7 px descem correndo em ondas, na cor do clube; no meio deles, 3 ou 4 selvagens da Rota (um Pidgey voando por cima, um Rattata no chão, um Psyduck atrasado) | passos, assobios, o `campeao` entrando |
| 4. O abraço | 3,5 | A torcida forma um anel em volta do time; os selvagens chegam no anel e pulam junto. Gag: o Snorlax da arquibancada (se estiver no pool do dia) continua dormindo lá em cima | |
| 5. O capitão pro alto | 5,0 | O time levanta o capitão: ele sobe 2 vezes (Hurt no ar, de cara feliz), na 3ª ninguém segura e ele cai sentado (Trip, ou Sit). Mario Strikers, versão Pokémon | "uuu" e risada da torcida, o baque |
| 6. A taça | 6,5 | O capitão levanta, o anel se abre, ele **junta força** (Charge, 450 ms) e ergue a taça de pixel (Pose; sem Pose, Hop segurando). Flash branco (`impactFrame`), raios atrás dele na cor do clube | o grito do capitão por cima do coro, o prato da música |
| 7. Foto | 8,0 | Câmera congela em foto (`holdFrame` em todos), moldura de pixel, letreiro "CAMPEÕES DA ROTA ÍNDIGO" e o nome do clube | estalo de câmera |
| 8. Volta (opcional, A3) | 9,0 | Atrás do letreiro, o time anda pela beira acenando e a torcida volta pros lados | o coro baixando |
| 9. Corta | 10–12 | Fade de 250 ms pra tela de campeão, que já nasce com a taça no lugar e o desfile curto (A4) | |

- **Toque:** pula pro quadro 7 (a foto); outro toque segue pra tela de campeão.
- **Reduzir movimento:** só o quadro 7, parado, com o letreiro, por 2 s.
- **Celular:** a câmera abre até a quadra inteira caber em 390 px deitada ou em pé; a torcida é pequena de propósito
  (só cor e movimento, o olho fica no time).
- **Onde mora:** um palco novo na `MatchScene` (como o `stageShowdown`), disparado por `final && won` na Rota. Os
  sprites dos selvagens e o atlas extra (Sit) carregam em segundo plano no 2º tempo da Final.
- **Bônus:** é o clipe 9:16 mais compartilhável do jogo (skill `soccermon-social`).

### 5.2 Taça curta, todo título (A2 sozinha), 3 s, pulável

| Quadro | Tempo | Tela | Som |
|---|---|---|---|
| 1. Apito | 0,0 | FIM DE JOGO; o time pula no seu jeito (B1) | apito, torcida |
| 2. Meia-lua | 0,5 | Os 5 andam pro meio e formam uma meia-lua, capitão na frente (Walk, 0,6 s) | |
| 3. Ergue | 1,2 | Charge e Pose com a taça de pixel, flashes, confete | grito do capitão, prato |
| 4. Corta | 2,6 | Fade pra tela de campeão | |

- Entra **no lugar** do desfile do Hall da Fama nos títulos repetidos da Relâmpago e da Copa do Dia. O desfile fica
  pro 1º título de cada modo e pra Rota (A4).
- Na conta de tempo: hoje um título da Relâmpago custa ~12 s de desfile (7 × 1,7 s) + a tela; com isso, 3 s + a tela.

## 6. Top 5 pra fazer primeiro

| # | O quê | Por quê |
|---|---|---|
| 1 | **B1 Comemoração com jeito** | O maior retorno por hora: todo gol fica diferente (o Pidgeot gira, o Machamp faz pose, o Snorlax pula) sem 1 ms a mais, e a classificação já existe no walkout. |
| 2 | **A2 Taça curta (e o desfile só no 1º título)** | É o pedido do Miguel e ao mesmo tempo **tira** tempo do título repetido. Constrói a peça que o A1 usa como clímax. |
| 3 | **A1 Invasão no título da Rota** | O momento grande que a Rota não tem. É G, mas raro, pulável e vira o clipe do TikTok. Fazer depois do A2, que já entrega o fim dela. |
| 4 | **A5 Insígnia batendo** | Nostalgia Gen 1 pura, 8 vezes por save, esforço P; a insígnia hoje acende calada no mapa. |
| 5 | **C2 Estádio lembra o resultado** | Vida sem botão nem tela nova: o jogador volta pro menu e o mundo sabe que ele foi campeão. |

Logo depois: B2 (fim de jogo com cara), D1 (moedas), A4 (Hall com flash em PMD). Antes de qualquer ideia de C,
o F2 da revisão de arte.

## 7. Decisões pro Miguel (recomendação primeiro)

1. **A invasão é só no título da Rota?** Recomendo sim; a Relâmpago fica com a taça curta (3 s).
2. **Quem invade?** Recomendo torcida de pixel na cor do clube + 3 ou 4 selvagens da Rota; os líderes que você venceu
   ficam pro Modo História.
3. **O desfile do Hall da Fama em todo título?** Recomendo não: taça curta em todo título, desfile (mais curto, em PMD
   e com flash) só na Rota e no 1º título de cada modo.
4. **Comemoração do gol:** os 3 jeitos do walkout (pulo, giro, pose) já? Recomendo sim, pro seu time e pro rival; a
   partícula do tipo saindo do corpo só no gol da Final.
5. **O capitão jogado pro alto cai sentado no fim?** Recomendo sim (é a piada da cena); se achar bobo demais, ele só
   desce.
6. **Taça na mão: a de pixel (a da Sala) ou a SVG da tela de campeão?** Recomendo a de pixel na quadra (pixel com pixel)
   e a SVG continua na tela de campeão.
7. **Duração da invasão:** recomendo 10–12 s, toque pula pra foto, Reduzir movimento mostra só a foto.
8. **Insígnia batendo com jingle novo (2 s, régua Rocket) ou um som que já existe?** Recomendo jingle novo, pela skill
   de música.
9. **Créditos depois do 1º título da Rota (A7)?** Recomendo sim, uma vez por save, pulável.
10. **Clima e cansaço na partida (B6, B7)?** Recomendo descartar; neve só no Estádio em dezembro.

## Fontes

- Código (origin/main 0.9.44.2): `src/game/cine.ts`, `src/game/cinematics.ts`, `src/game/scenes/{MatchScene,WalkoutScene,TrophyRoomScene,StoryScene}.ts`,
  `src/game/walkout-plan.ts` (`comemoracaoOf`), `src/game/animation-manager.ts` (`animForAction`), `src/engine/match.ts`
  (`Action.Celebrate`), `scripts/build-pmd-atlas.ts`, `src/ui/components/{ChampionView,HallParade,ResultHero,FinalCard,EvolutionOverlay,CountUp,UnlockNotice,BadgeCase,PixelTrophy,Trophy}.tsx`,
  `src/ui/ambientes/{wild.ts,WildZone.tsx,Estadio.tsx,Ambientes.tsx,FieldSprite.tsx}`, `src/ui/screens/CreditsParade.tsx`, `src/ui/dev-demo.ts`.
- Planos ligados: [menos-e-mais.md](menos-e-mais.md), [revisao-arte.md](revisao-arte.md), [tela-campeao.md](tela-campeao.md),
  [jogo-gostoso.md](jogo-gostoso.md), [emotes.md](emotes.md), [pesquisas/cara-de-jogo.md](pesquisas/cara-de-jogo.md),
  [pesquisas/ut-walkout.md](pesquisas/ut-walkout.md), [../marca/brand-guide.md](../marca/brand-guide.md) (seção 3, Movimento).
- EA FC, cerimônia do troféu: [Career mode immersion: trophy and captaincy animations](https://forums.ea.com/discussions/fc-26-feedback-en/career-mode-immersion---trophy--captaincy-animations/13486575),
  [Universal trophy presentation overhaul (FC 27)](https://forums.ea.com/discussions/fc-27-feedback-en/feature-request-next-gen-universal-trophy-presentation--celebration-overhaul/13692416),
  [New trophy celebrations (FC 25)](https://forums.ea.com/discussions/fc-25-general-discussion-en/new-trophy-celebrations/7941839),
  [FC 24: desfile em ônibus aberto (SportBible)](https://www.sportbible.com/football/gaming/ea-sports-fc/ea-fc-24-547793-20230727).
- Invasão de campo de verdade: [Pitch invasion (Wikipedia)](https://www.wikipedia.org/wiki/Pitch_invader),
  [The pitch invasion is back (Defector)](https://defector.com/the-pitch-invasion-is-back),
  [Trabzonspor invade duas vezes (beIN)](https://www.beinsports.com/en-us/articles-video/trabzonspor-fans-invade-the-pitch-twice-to-ce).
- Mario Strikers: [Animações de gol, vitória e derrota de Daisy e Shy Guy (GoNintendo)](https://gonintendo.com/contents/6791-all-daisy-shy-guy-win-loss-goal-animations-from-mario-strikers-battle-league),
  [Montagem de todas as danças de vitória (GoNintendo)](https://www.gonintendo.com/contents/12233-nintendo-shares-montage-of-every-mario-strikers-battle-league-victory-dance),
  [Shy Guy (Kotaku)](https://kotaku.com/mario-strikers-battle-league-shy-guy-nintendo-switch-1849333184),
  [Mario Strikers (TV Tropes)](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/MarioStrikers).
- Rocket League: [Melhores goal explosions (Operation Sports)](https://operationsports.com/best-rocket-league-goal-explosions-ranked),
  [Goal explosions de time (esports.gg)](https://esports.gg/news/rocket-league/rocket-league-adds-team-goal-explosions-in-the-final-esports-shop-update/).
- Pokémon: [Hall of Fame (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Hall_of_Fame),
  [Pokémon League (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Champion_League),
  [Animation ID do PMD (SkyTemple)](https://wiki.skytemple.org/index.php/Animation_ID),
  [PMD Sprite Format (PMDCollab)](https://wiki.pmdo.pmdcollab.org/PMD_Sprite_Format).
- Captain Tsubasa e Inazuma: [Captain Tsubasa: Rise of New Champions, review (God is a Geek)](https://godisageek.com/reviews/captain-tsubasa-rise-of-new-champions-review/),
  [Inazuma Eleven (TV Tropes)](https://tvtropes.org/VideoGame/InazumaEleven).
- Clash Royale: [Emotes (Sportskeeda)](https://www.sportskeeda.com/esports/emotes-clash-royale-types-ways-unlock),
  [Os emotes mais raros (Sportskeeda)](https://sportskeeda.com/esports/rarest-clash-royale-emotes).
- Balatro e juice: [Balatro: feedback suculento (Blake Crosley)](https://blakecrosley.com/pt-BR/guides/design/balatro),
  [Why winning feels so good (PSU)](https://www.psu.com/news/why-winning-feels-so-good-reward-design-from-arcades-to-balatro/),
  [Juice It or Lose It (GDC Vault)](https://gdcvault.com/play/1016487/Juice-It-or-Lose).
- Slay the Spire: [O final do StS2 "mais extravagante quando você vence" (PC Gamer)](https://www.pcgamer.com/games/card-games/slay-the-spire-2-ending).
- Hades: [Tamanho do roteiro e das falas (Screen Rant)](https://screenrant.com/hades-dev-script-voice-lines-huge-massive/),
  [Hades 2 com 30 mil falas (GamesRadar)](https://www.gamesradar.com/games/hades/hades-2-has-an-epic-script-of-over-400-000-words-and-30-000-voice-lines-around-50-percent-more-than-the-original-roguelike).
- Animal Crossing e Stardew: [Como a Nintendo criou os moradores (Siliconera)](https://www.siliconera.com/nintendo-on-how-animal-crossing-new-horizons-lovable-villagers-were-created/),
  [Festivais (Stardew Valley Wiki)](https://stardewvalleywiki.com/Festivals),
  [Festivais em jogos de fazenda (The Boar)](https://theboar.org/2025/03/celebrating-the-seasons-a-look-at-festivals-in-farm-life-sims).

## Decidido com o Miguel (09/11)

Todas as recomendações aprovadas (1 a 10): invasão só no título da Rota (torcida de pixel na cor do clube + 3–4 selvagens da Rota, 10–12 s, toque pula pra foto final, capitão jogado pro alto cai sentado), taça curta de pixel em todo título, desfile do Hall só na Rota e no 1º título de cada modo (mais curto, PMD, flash), os 3 jeitos de comemorar pros dois times (partícula do tipo só no gol da Final), insígnia com jingle de 2 s, créditos uma vez por save depois do 1º título da Rota, sem clima nem cansaço. Ordem: B1 e A2 primeiro, depois A1, A5 e C2.
