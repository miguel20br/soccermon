---
description: Plano pras duas ideias do playtester (itens ativos na partida e Copa longa com eventos), com o que já existe, opções, números estimados, tamanho e versão.
---

# Itens ativos na partida e Copa longa com eventos (27/11/2026)

Pesquisa e plano. Nenhum código foi mexido. Lido na `.claude/worktrees/v010` (motor 34).

## Resumo (10 linhas)

1. **Itens ativos cabem no motor sem gambiarra.** A beira da quadra já manda ordens que a partida aplica na hora (`AgencyOrder`: tempo, goleiro-linha, golpe máximo). Um item vira mais um tipo dessas ordens (`kind: 'bag'`), que o Duelo e a Liga já sabem refazer.
2. **Recomendo a Opção 3:** a Bolsa vem da campanha na Rota, na Relâmpago e depois no UT. No Duelo, na Liga e na Copa do Dia todo mundo leva o mesmo kit. Cada time usa no máximo **1 item por tempo**.
3. **7 itens:** Poção, X Attack, X Defense e Cura Total (a "cura de paralisia" virou essa, porque a paralisia dura só 6 s) pro seu time; Toxic Orb, Flame Orb e Red Card pra sabotar o rival.
4. **Por régua medida** (sinergias secretas: +1% em tudo num jogador a partida toda vale uns +0,2 pp de vitória), cada item vale **+1 a +2 pp por partida** e o Red Card uns +2. Uma Bolsa usada na Rota inteira vale mais ou menos um Patrocínio Silph. Tem uma coluna "forte" se você quiser mais impacto.
5. **Contra-jogo de Pokémon:** a Cura Total desfaz as Orbs, a Lum Berry e a Focus Sash seguram a primeira Orb, e Orb jogada num Machamp com Guts dá +30% de chute **pra ele**. Koga usa a Toxic Orb e Blaine a Flame Orb.
6. **Exige `ENGINE_VERSION`** (34 ⇒ 35 nos itens de reforço, 35 ⇒ 36 na sabotagem) e republicar a `liga`. A Liga só abre em 12/01, então entra em janeiro sem pressa.
7. **Copa longa: quase tudo que o playtester pediu já está na Rota Índigo.** Mapa estilo Slay the Spire, draft de pré-evoluções, raridade subindo por andar, pacote de tipo no Mercado, "Trombada no treino" e "Patrocinador misterioso" (2 reservas por 1 carta).
8. **O que falta de verdade:** lesão vinda de um carrinho **da partida** (hoje é "no treino"), eventos que dão item da Bolsa (é o que liga A e B) e uma **Copinha Baby** arcade, onde os rivais também jogam só com pré-evoluções.
9. **Versões:** 0.10.1 (07/12) com motor 35 e os 4 itens de reforço na Rota e na Relâmpago. 0.10.2 (14/12) com sabotagem, líderes usando itens, Duelo, carrinho de partida e eventos novos. Janeiro com Liga, UT, Copa do Dia e Copinha Baby.
10. **Você decide** (lista no fim): limite por partida, Red Card (o nome bate com o "cartão vermelho" da Rota e a regra é "sem faltas"), números padrão ou fortes e se o Duelo vem com itens ligados.

---

# Parte A: itens ativos na partida

## O que já existe e onde o item entra

| Peça | Onde | Serve pra |
|---|---|---|
| Ordem do técnico com tick, time e `seq` | `MatchOrder`/`AgencyOrder` em `src/engine/state.ts:111` | o item é uma ordem nova: `{ kind: 'bag', item, target? }` |
| Aplicar ordem no tick dela, ignorando a que não vale agora | `applyAgencyOrder` em `src/engine/match.ts:3445` | mesmo lugar, `case 'bag'` (sem item na Bolsa ou já usou no tempo: ignora, igual ao tempo já pedido) |
| Validação da ordem (Duelo, Liga, replay) | `validOrder`/`validAgency` em `src/engine/runners/live-runner.ts:41` | aceita `bag` com item conhecido e alvo `string` |
| Liga refaz a partida no servidor | `ligaOrders`/`simulateLiga` em `src/engine/league.ts` | ordens só do time 0, até `MAX_LIGA_ORDERS`; o kit vem do servidor, não do cliente |
| Reforço com tempo | `Buff {attr, factor, timer}` em `PlayerState.buffs` | X Attack / X Defense |
| Fôlego (pesa em tudo: `0.72 + 0.28 × fôlego`) | `fatigueFactor` em `src/engine/effective.ts:68` | Poção |
| Status (par, brn, psn com Toxic que piora) | `applyStatus` (`match.ts:1447`), `STATUS_MODS`, `STATUS_DURATION` | Orbs; Lum Berry, Focus Sash e imunidade de habilidade já seguram |
| Parede do time com tempo | `TeamRuntime.screens {light, reflect, mist}` | a Cura Total ganha `safeguard` (imune a status por X s) |
| Técnico IA rival que manda ordens normais | `src/engine/rival-coach.ts` (líderes, Rng próprio) | líder usa a Bolsa dele pela personalidade |
| Itens segurados (prancheta) | `src/engine/items.ts` (Leftovers, Lum Berry…), sprite em `assets/items/` | a Bolsa é **outra coisa**: o item segurado continua igual; o da Bolsa é do técnico e some ao usar |
| Economia da campanha | `shop.ts` (Mercado: item segurado 3 ₽, pacote 6, Patrocínio 10), `rewards.ts`, `long-events.ts` | Bolsa à venda, no Baú e nos eventos |

Já existe uma ideia antiga quase igual: **M8 "Bolsa do treinador"** em `docs/planos/pesquisas/agencia.md:217`. Ela nunca foi feita. Este plano é ela atualizada com a sabotagem.

## Referências

| Jogo | Como faz | O que pegar | O que evitar |
|---|---|---|---|
| **Balatro Multiplayer** ([repo](https://github.com/Balatro-Multiplayer/BalatroMultiplayer)) | **The Asteroid** (Planeta, 3 $): baixa 1 nível da melhor mão do rival ("Nemesis"). **Traps:** carta comprada num pacote que fica virada na mão do rival e dispara quando ele faz algo (ex.: jogou Flush, as cartas trocam de naipe). Vidas: perdeu o PvP, perde 1 vida. | sabotagem **barata e pequena** (1 nível), comprada na mesma loja que o resto; a decisão é "me fortaleço ou atrapalho ele". Traps é uma ideia boa pra uma fase 2 ("armadilha": dispara quando o rival usa o golpe máximo). | sabotagem que decide sozinha a partida |
| **Pokémon (batalha)** | X Attack +2 estágios desde a Gen 7 (+1 antes); usar item gasta o turno. Full Heal tira status. **Red Card** (Gen 5): segurado, quem te acerta é trocado à força. **Toxic Orb/Flame Orb** (Gen 4): envenena/queima **quem segura**, pensado pra Guts e Poison Heal. Líderes usam Super Potion. | nomes e sprites que todo fã reconhece; a piada das Orbs no Guts; líder que usa item | "gastar o turno" não existe aqui: o custo é o limite por tempo |
| **Mario Strikers Battle League** | futebol com itens (casco, banana, bob-omb, estrela); o time que leva uma trombada sem a bola ganha item, e caixas caem no campo | prova que item de sabotagem funciona em futebol arcade; "levou pancada, ganha item" como compensação | itens caindo do céu (precisa de mira e controle, coisa do modo jogável) |
| **EA FC Ultimate Team** | tirou o consumível de forma física antes e o de contrato na FC 25 ([VGC](https://www.videogameschronicle.com/news/ea-sports-fc-25-is-removing-contracts-from-ultimate-team/)); ficaram estilos de química e cura | consumível de **manutenção** (contrato, fôlego entre jogos) é chato e saiu; o item tem que ser uma **decisão na partida** | Bolsa no UT que vira "pagar pra jogar"; no UT ela vem de objetivo, nunca de pacote |
| **Slay the Spire** | Poções: 3 espaços, some ao usar, compra na loja, cai de combate | espaços limitados e o "guardo pra Final ou uso agora?" | — |
| **Super Auto Pets / TFT** | comida num pet, às vezes só pra próxima luta (Cupcake); componentes de item | item com alvo escolhido em 2 toques | — |

## Os 7 itens: números propostos

Tempo de jogo: cada tempo tem 180 s de motor = 20' no relógio, então **1' = 9 s**. Base atual (motor 34, n=400): **7,51 gols/jogo, favorito vence 63,4%** (`sinergias-secretas-fase2.md`).

**Régua (medida, não inventada):** as sinergias secretas dão +3% a +8% em ~2,5 jogadores a partida toda e valem **+2,6 pp de vitória e +0,26 de saldo**. Isso dá **≈ +0,2 pp de vitória e +0,02 de saldo por "1 jogador × 1% em tudo × partida inteira"**. O pedido de tempo, medido com o robô, deu +4 pp ±4,6. Tudo abaixo é **estimativa pela régua**: antes de aplicar, mede com o robô (plano no fim da Parte A).

| Item | Alvo | Efeito (padrão) | Forte (se quiser mais) | Preço na Rota | Δ vitória quando bem usado | Δ gols |
|---|---|---|---|---|---|---|
| **Poção** | 1 do seu time | fôlego volta a 100% | + os outros 4 ganham +15% | 2 ₽ | +1 pp (aos 30', jogador a 40%: ~+17% em tudo por 1/4 da partida) | saldo +0,1 |
| **X Attack** | o seu time | chute e drible ×1,3 por 5' (45 s) | ×1,3 por 8' | 3 ₽ | +1,5 a +2 pp | +0,2 gol pró |
| **X Defense** | o seu time | desarme e posicionamento ×1,25, goleiro ×1,1 por 5' | por 8' | 3 ₽ | +1,5 pp | −0,15 gol contra |
| **Cura Total** (no lugar da "cura de paralisia") | o seu time | tira status, enfraquecimentos e Leech Seed de todos e deixa o time imune a status por 5' | por 10' | 2 ₽ | +0,5 pp contra IA comum; anula uma Orb inteira | ~0 |
| **Toxic Orb** | 1 rival de linha | Toxic por 30 s (hoje o veneno dura 10 s e piora até ×3 em 12 s): ~−0,3 de fôlego, ou ~−9% em tudo **até o fim** | 45 s | 3 ₽ | +1 pp (usada no começo do 2º tempo no craque) | saldo +0,1 |
| **Flame Orb** | 1 rival de linha | queimadura por 30 s: chute e força ×0,8 e −0,1 de fôlego | 45 s | 3 ₽ | +1 pp (no pivô antes de ele atacar) | −0,1 gol contra |
| **Red Card** | 1 rival de linha (goleiro não) | sai da quadra por 2' (18 s) e o rival joga com 4. Volta antes se o time dele sofrer gol (a regra do futsal de verdade) | 3' | 5 ₽ | +2 pp (no 5 contra 4, gol pró ~+70% e contra ~−40% na janela) | +0,13 pró, −0,07 contra |

**Contra-jogo (já existe quase tudo):**
- Orb em quem segura **Lum Berry** ou **Focus Sash**: o item segura e a Orb some. É o `applyStatus` de hoje.
- Orb em quem tem **Guts / Marvel Scale / Quick Feet** (`whenStatused` em `abilities.ts`): ele **fica mais forte** (Guts: chute ×1,3). A ajuda avisa.
- Imunidade de habilidade (Limber, Immunity...) segura a Orb, como já faz com golpe.
- A **Cura Total** desfaz as duas Orbs; não desfaz o Red Card.

**Limites (proposta):** **1 item por tempo por time** (2 por partida), igual ao pedido de tempo, que todo mundo já entende. Vale "na hora" (no Duelo, com o carimbo de 2 s à frente que o golpe máximo já usa). Não vale no intervalo, nos pênaltis nem no duelo da bicuda. Bolsa com **3 espaços** na Rota e **2** na Relâmpago, e o que sobra some quando a copa acaba.

**Antes ⇒ depois esperado no jogo todo (estimativa):**

| Medida | Hoje (motor 34) | Com a Bolsa (você usa 2 por partida; líderes usam 1) |
|---|---|---|
| Gols/jogo (calibrate, sem técnico) | 7,51 | 7,51 (o calibrate não usa itens: bit a bit igual) |
| Gols/jogo numa partida com itens | 7,51 | ~7,7 (X Attack e Red Card abrem janelas de ataque) |
| Sua vitória por partida com 2 itens bem usados | base | +2 a +4 pp (padrão) / +4 a +7 pp (forte) |
| Contra líder que usa 1 item | base | −1 a −2 pp |
| Título da Rota | base atual (medir) | +4 a +7 pp, mais ou menos um Patrocínio Silph (+2 em tudo deu +8 pp de título na Copa rápida) |

## Como se ganha e como fica em cada modo

| Modo | Como ganha | Quem usa | Observação |
|---|---|---|---|
| **Rota Índigo** | começa com 1 Poção. Mercado: 1 item de Bolsa na vitrine (2 a 5 ₽). Baú: às vezes. Ginásio vencido: o item do líder. Eventos novos (Parte B) | você; líderes de ginásio e a Final com 1 item (Koga: Toxic Orb; Blaine: Flame Orb; Erika: Cura Total; Lance: X Attack perdendo) | rival comum da Rota não usa (o mapa já fica difícil no fim) |
| **Copa Relâmpago** | começa com 1 Poção; na recompensa 1 de 3, às vezes um item de Bolsa (como o Patrocínio dos arcades, `SPONSOR_REWARD_CHANCE`) | você; o líder do clube rival (que já tem técnico IA) | sem Mercado, como hoje |
| **Copa do Dia** | kit igual pra todos pela seed do dia (2 itens) | você | todo mundo com as mesmas armas, como pede o placar do dia |
| **Duelo** | **regra da sala** (como o limite de especiais): "Itens: sim/não". Com sim, cada um escolhe 2 de um kit fixo na escalação e os dois aparecem no apito | os dois | `DuelTeamRecipe.bag` validado em `duel-validate.ts` contra o kit |
| **Liga** (abre 12/01) | kit fixo do servidor pros dois lados (o cliente não manda a Bolsa) | você; o fantasma usa pela regra do técnico IA, que roda também na Edge Function | `ligaTeams` põe o kit; ordem de item que não está no kit é ignorada pelo motor |
| **Time Ultimate** (janeiro) | Bolsa da temporada que se ganha em objetivo e Desafio, **nunca** em pacote e nunca comprada com Fichas | você; rival do UT com kit pelo nível (Mestre usa) | `src/store/ultimate/`, campo novo opcional no save |

## Motor: o que muda (e por que sobe `ENGINE_VERSION`)

- `state.ts`: `AgencyOrder` ganha `{ kind: 'bag'; item: BagItem; target?: string }` e entra em `AGENCY_KINDS`. `TeamSetup.bag?: string[]` diz o que o time carrega. `AgencyRuntime` ganha `bagUsed` e o uso por tempo.
- `match.ts`, `applyAgencyOrder`: `case 'bag'` confere se o item está na Bolsa, se ainda não usou no tempo e se o alvo vale. Depois aplica com as peças que já existem (`energy`, `buffs.push`, `applyStatus` com o tempo trocado, `screens.safeguard`). Emite `{ type: 'bag', team, item, target }` pra tela e pra narração.
- **Red Card é a única peça nova de verdade:** `PlayerState.sentOff` (timer), o jogador anda até a lateral e fica fora do lance, e a IA dos dois times conta 4 contra 5. Um flag novo no snapshot (`FLAG_SENTOFF = 1024`). É o maior risco (a IA de posicionamento conta 5 em vários lugares). Por isso fica na segunda etapa.
- `rival-coach.ts`: regra de item por personalidade. Usa o mesmo Rng próprio que o técnico já usa, então o resto da partida não muda de sorteio.
- `live-runner.ts`, `validAgency`: aceita `bag`. `league.ts`: o kit vem do servidor. `duel-validate.ts`: a Bolsa da receita confere com o kit.
- **Sem ordem de item, a partida é bit a bit a de hoje** (o calibrate não muda). Mesmo assim sobe `ENGINE_VERSION` e republica a `liga` (`npm run edge:liga` + deploy), porque o motor novo aplica uma ordem que o velho ignora, e Duelo e Liga precisam bater. Os líderes usando item mudam partidas da Rota e da Relâmpago.
- Save: `RunState.bag?: string[]` é opcional, então dispensa `SAVE_VERSION` (como o `routeLock`). Mesmo assim testa com `scripts/fixtures/backup-v6-*.json`.
- Testes: um por item (efeito e limite por tempo); determinismo com ordens de item; Liga recusando item fora do kit; Duelo com receita sem Bolsa (sala antiga).

## Tela da partida

- Botão **Bolsa** na beira da quadra (`src/ui/components/Sideline.tsx`), junto do tempo, do goleiro-linha e do golpe máximo. Mostra quantos itens tem e fica apagado quando já usou no tempo.
- Tocou: uma folha embaixo com os itens (sprite pixel do item, como os da prancheta em `assets/items/`: `potion`, `x-attack`, `x-defense`, `full-heal`, `toxic-orb`, `flame-orb`, `red-card` existem no PokeAPI), nome e uma linha do que faz. Item de alvo abre a fila de rostos (os 5 seus ou os 5 rivais). Usa em 2 toques, ou 3 com alvo. **Sem emoji**: só sprite e ícone desenhado (`HudIcon`).
- Na quadra: o sprite do item sai do banco até o alvo (250 ms, regra "nada teleporta"). Depois vem a aura no time (vermelha no X Attack, azul no X Defense, verde na Poção), o anel do status de sempre nas Orbs e, no Red Card, o cartão subindo e o Pokémon saindo andando, com um relógio de 2' no HUD. Narração: "Koga jogou a Toxic Orb no Pikachu!".
- 320/390 px em pé e deitado: a folha cabe em 1 linha de 3 itens; o alvo em 1 linha de 5 rostos.
- **Atrás de bandeira** até você jogar na prévia (ADR 0005).

## Opções

| | Opção | Como funciona | Prós | Contras | Tamanho |
|---|---|---|---|---|---|
| 1 | **Bolsa da campanha** (a M8 antiga) | itens ganhos e comprados na Rota, Relâmpago e UT; somem ao usar | decisão de roguelike ("guardo pra Final?"); usa a economia que existe | Duelo e Liga ficam de fora ou injustos; economia nova pra calibrar | M |
| 2 | **Kit por partida** (Mario Strikers) | todo time começa toda partida com o mesmo kit (ex.: 1 Poção + 1 X), e quem leva carrinho sem a bola ganha 1 | justo em todo modo; nada de economia nem save | perde o roguelike; ganhar item no meio da partida é mais motor e mais IA | M |
| **3** | **Híbrido (recomendado)** | Opção 1 na Rota, Relâmpago e UT; kit igual (Opção 2 sem o "ganha na partida") na Copa do Dia, Duelo e Liga | cada modo com o que combina: escassez na campanha, igualdade no competitivo; a mesma ordem `bag` serve pra tudo | o maior escopo dos três, por isso em 3 etapas | M + M + M |

**Recomendação: Opção 3 em 3 etapas.**

| Etapa | O quê | Motor | Versão | Tamanho |
|---|---|---|---|---|
| A1 | ordem `bag` + Poção, X Attack, X Defense, Cura Total; Bolsa na Rota (Mercado, Baú, começo) e na Relâmpago; botão e folha na beira da quadra; robô medindo | 34 ⇒ 35 + `liga` | **0.10.1 (07/12)** se os números saírem até ~02/12; senão 0.10.2 | M |
| A2 | Toxic Orb, Flame Orb, Red Card (`sentOff`); líderes usando itens; Duelo com a regra da sala | 35 ⇒ 36 + `liga` | **0.10.2 (14/12)** | M (o Red Card puxa pra G; se apertar, sai e vai pra janeiro) |
| A3 | Liga com kit fixo e fantasma usando; Copa do Dia com kit do dia; Bolsa no UT | só se mexer na IA do fantasma | **janeiro** (a Liga abre 12/01) | M |

**Como medir antes de você aprovar** (skill de balanceamento): estender o robô de técnico (`scripts/balance/coach.ts`) com uma política de Bolsa. Poção no mais cansado aos 30', X Attack perdendo no 2º tempo, Orb no melhor rival no começo do 2º tempo, Red Card empatado ou perdendo depois dos 30'. Partidas pareadas (mesma seed com e sem), n=200 pra explorar e 400 no número final, pela fila pesada. A Rota inteira passa pelo `long-cup.sim.test.ts`. Hoje não rodei nada: a máquina estava com carga 14 e sem memória livre, então os números acima são da régua.

---

## A1 feita (27/11, branch `feat-itens`, atrás de `?lab=itens`)

Código: `src/engine/bag.ts` (itens e números), `applyBag` em `src/engine/match.ts`, `src/store/bolsa.ts` (Bolsa na Rota
e na Relâmpago), `src/ui/components/BagPanel.tsx` (botão e folha), `src/ui/bolsa-lab.ts` (bandeira). `?lab=itens`
liga no dev e nas prévias (copa começa com 1 Poção); `?lab=itens-todos` começa com os 4, pra testar cada um. Em
produção nada aparece. **Motor sem item é bit a bit o de hoje** (golden master igual, `ENGINE_VERSION` fica 35).

**Números medidos** (robô `scripts/balance/coach.ts 400 out 4 potion,xattack,xdefense,fullheal,bolsa`, rival sem
técnico, 400 partidas pareadas, ±1σ; 1 item do tipo na Bolsa, "bolsa" = os 4 com 1 por tempo). "Na janela" = gols
nos 5' depois do uso, na mesma partida sem e com o item (bem menos ruído que a vitória):

Base (nunca usa): vitória 50,0%, gols 3,50 pró / 3,53 contra por jogo.

| Item | Hora | Usos/jogo | Δ vitória (pp) | Gols pró/contra | Na janela de 5': pró | contra | Δ "forte" (n=200, referência) |
|---|---|---:|---:|---|---|---|---:|
| Poção | sensata (2º tempo, 28'+, o mais cansado abaixo de 60%) | 1,00 | +2,0 ±2,4 | 3,74 / 3,48 | 0,29 ⇒ 0,41 | 0,38 ⇒ 0,32 | +5,0 ±3,2 |
| Poção | minuto sorteado | 1,00 | +4,5 ±3,0 | 3,86 / 3,49 | 0,36 ⇒ 0,45 | 0,34 ⇒ 0,32 | +10,5 ±4,5 |
| X Attack | sensata (2º tempo, 25'+, sem estar ganhando) | 0,74 | +1,5 ±2,5 | 3,64 / 3,50 | 0,41 ⇒ 0,53 | 0,38 ⇒ 0,34 | +2,5 ±3,6 |
| X Attack | minuto sorteado | 1,00 | +0,0 ±3,1 | 3,70 / 3,65 | 0,36 ⇒ 0,55 | 0,34 ⇒ 0,39 | −3,5 ±4,5 |
| X Defense | sensata (2º tempo, 30'+, ganhando) | 0,51 | +1,5 ±1,4 | 3,52 / 3,46 | 0,32 ⇒ 0,35 | 0,36 ⇒ 0,24 | −0,5 ±1,9 |
| X Defense | minuto sorteado | 1,00 | +4,0 ±2,9 | 3,64 / 3,52 | 0,36 ⇒ 0,46 | 0,34 ⇒ 0,30 | −1,0 ±4,3 |
| Cura Total | sensata (2+ do time com status) | 0,07 | ~0 (−1,3 ±0,7) | 3,49 / 3,58 | — | — | −1,5 ±1,3 |
| Cura Total | minuto sorteado | 1,00 | −1,3 ±1,8 | 3,56 / 3,54 | 0,36 ⇒ 0,39 | 0,34 ⇒ 0,36 | −2,0 ±3,3 |
| Bolsa (os 4) | sensata | 1,03 | +2,3 ±2,6 | 3,73 / 3,53 | 0,38 ⇒ 0,49 | 0,39 ⇒ 0,33 | +2,5 ±3,8 |
| Bolsa (os 4) | minuto sorteado | 2,00 | +5,0 ±3,1 | 3,98 / 3,49 | 0,36 ⇒ 0,48 | 0,33 ⇒ 0,31 | +8,5 ±4,5 |

**Poção forte (decidida 27/11, n=400, `coach.ts potion`, `potionTeam` 0,15):** sensata **+5,0 ±2,3 pp** (gols 3,77 / 3,35; janela de 5': pró 0,29 ⇒ 0,41, contra 0,38 ⇒ 0,28); minuto sorteado **+11,0 ±3,1 pp** (3,97 / 3,40). Contra +2,0 / +4,5 do padrão: o +15% nos outros 4 dobra o item. As linhas acima são do padrão (Poção sem os +15%).

**Rota inteira** (`BOLSA=1 SIM=200 npx vitest run scripts/balance/long-cup.sim.test.ts`, 200 Rotas pareadas; o robô
começa com 1 Poção, pega item da Bolsa no Baú, compra no Mercado depois do Patrocínio e usa na hora sensata): título
**24,0% ⇒ 26,5% (+2,5 ±3,9 pp)**, partidas jogadas 6,30 ⇒ 6,54, ₽ no fim 35,2 ⇒ 33,6.

Leitura: a vitória por item fica dentro do ruído (±2,5 pp com 400), como a régua previa (+1 a +2 pp). A janela
mostra que o efeito existe: X Attack +0,12 a +0,19 gol pró nos 5', X Defense −0,04 a −0,12 contra, Poção +0,1 pró.
A Cura Total quase não tem uso sem as Orbs (A2): a IA rival quase nunca põe status em 2 do time. O "forte" só
pesa na Poção (os +15% de fôlego nos outros 4).

# Parte B: Copa longa com eventos

## O que o playtester pediu x o que já existe

| Pedido | Já existe? | Onde |
|---|---|---|
| Mapa estilo Slay the Spire | **sim** | Rota Índigo: `src/engine/cup-map.ts` (Jogo, Ginásio, Mercado, Evento, Treino, Baú, Centro, Safari, Cassino; ramos por tipo; 4 partidas no mapa + grupos + Final) |
| Pacotes piores no começo, melhorando | **sim** | draft da Rota uma linha de raridade abaixo (`rollOptions`, `game-store.ts:688`), "raridade pelo andar" no reforço, Baú e Mercado (`LongReward.round`); na Relâmpago, `REINFORCEMENT_ROUND = [3, 5, 6]` |
| Copinha só de pré-evoluções | **metade** | a Rota já começa com **o seu** time em forma-base (`babyOptions`, `draft.ts:346`; sem os sem-linha fortes, `ROUTE_START_BANNED`). Os rivais vêm completos |
| Pacote de um tipo | **sim** | Mercado: `{ kind: 'pack', type }` (6 ₽), puxando o tipo do ramo, da semana ou do capitão (`shop.ts`) |
| "Levou um carrinho e se machucou" | **parecido** | evento `carrinho` ("Trombada no treino": um descansa 2 partidas ou paga 4 ₽ de fisio), lesão em `run.out` com `OutWhy = 'lesao'`. Não vem da partida |
| "Patrocinador misterioso troca 2 por 1 craque" | **sim, igualzinho** | evento `patrocinador` (2 reservas por a melhor de 5 cartas sorteadas) |

**Leitura:** o playtester provavelmente jogou a Relâmpago e não achou a Rota, ou achou e não percebeu o que ela tem. Vale perguntar a ele. Se for isso, o primeiro conserto é de vitrine (o menu e o primeiro contato com a Rota), não de feature.

## O que encaixa onde

- **Rota** é o lugar de tudo que é longo e de campanha: eventos, lesão, Bolsa, pacote por andar.
- **Relâmpago** fica curta (4 jogos, sem Mercado nem eventos, decidido em 11/11). Ali só entra a recompensa que às vezes é item de Bolsa.
- **Copinha Baby** vira variante arcade (curta), e não mais uma Rota.

## Propostas

| # | O quê | Como | Motor | Tamanho | Versão |
|---|---|---|---|---|---|
| B1 | **Carrinho de verdade** | depois da partida da Rota, quem levou um carrinho que derrubou (evento de desarme com queda ou golpe crítico) tem uma chance pela seed (proposta: 15% pro mais atingido, no máximo 1 por partida) de virar evento: "Fulano levou um carrinho do Machamp aos 32'". As escolhas são **descansar 1 partida**, **fisio 3 ₽** ou **jogar no sacrifício** (começa a próxima com 70% de fôlego). Nada automático: você escolhe. | não (lê os eventos da partida no store) | P | 0.10.2 |
| B2 | **Eventos que dão item da Bolsa** (liga A e B) | "Loja de Viridian": Poção grátis ou X Attack por 2 ₽. "Equipe Rocket na saída do vestiário": troca 1 item da Bolsa por ₽ ou leva o seu. "Enfermeira Joy": Cura Total grátis se alguém está machucado. "Koga quer treinar": dá 1 Toxic Orb se você aceitar um jogo mais difícil. Seguem as regras de `long-events.ts` (uma tela, 2 a 3 escolhas, custo no botão, sem repetir). | não | P | junto da A2 (0.10.2) |
| B3 | **Copinha Baby** | arcade de 4 jogos onde **todo mundo**, rivais também, joga só com forma-base (`babyOptions` no rival e `ROUTE_START_BANNED` dos dois lados). Clube Formador ligado pros dois (limiar de evolução 14 ⇒ 9, o Patrocínio que já existe no motor), então todo jogo tem evolução. Vira a Copa do Dia de domingo ou um item no Clássico. | não (usa o `formador` que existe) | M | janeiro |
| B4 | **Rótulo do pacote por andar** | o Baú e o Mercado mostram "Pacote Bronze/Prata/Ouro" pelo andar, pra ficar visível o "melhora ao longo da copa" que já acontece | não | P | 0.10.1 (carona) |
| B5 | **Vitrine da Rota** | conferir com o playtester se ele achou a Rota; se não, destacar no menu (o Clássico abre na Relâmpago) e na primeira derrota da Relâmpago | não | P | 0.10.1 |

**Recomendação:** B4 e B5 na 0.10.1 (baratos). B1 e B2 na 0.10.2, junto da sabotagem, porque fecham o ciclo "levou carrinho, ganhou item, se vingou com Red Card". B3 em janeiro, depois de ver se a Bolsa pegou.

---

# Decisões pro Miguel (recomendação primeiro)

**Miguel 27/11: Poção forte, resto padrão, Cura Total em 14/12.** Poção com os outros 4 do time ganhando +15% de fôlego (`BAG.potionTeam`); X Attack e X Defense no padrão (5'). Cura Total sai da Bolsa, da recompensa, do Mercado e do `?lab=itens-todos` até as Orbs (0.10.2, 14/12): o efeito continua no motor, só fora de `BAG_OFFERED` (`src/engine/bag.ts`), com teste em `bolsa.test.ts`.

**Aprovadas em 27/11/2026:** as 9, todas na recomendação ("1 a 9 apoio"). Números de efeito ainda passam pelo robô e pelo ok dele antes do motor.

1. **Opção da Parte A:** 3, híbrido (campanha com Bolsa, competitivo com kit igual)? Recomendo **sim**.
2. **Limite:** 1 item por tempo por time? Recomendo **sim** (alternativa: 2 por tempo, mais caos).
3. **Números (decidido 27/11: Poção forte, resto padrão):** padrão (cada item vale +1 a +2 pp) ou forte (dobra a duração)? Recomendo **padrão primeiro** e o forte só se no teste você não sentir o item. Os números só entram depois do robô e do seu ok.
4. **Cura de paralisia vira Cura Total** (a paralisia dura 6 s, não dá tempo de curar)? Recomendo **sim**.
5. **Red Card:** a regra é "sem faltas" e a Rota já chama a 2ª derrota de "cartão vermelho". Fica como item com o nome em inglês do Pokémon ("Red Card", que nem Leftovers) e a regra do futsal (2' com 4)? Ou troca por algo sem cartão (ex.: "Whirlwind": manda 1 rival pro banco por 2')? Recomendo **Red Card**, só na etapa A2, e mudar o texto da Rota pra "eliminado".
6. **Líderes usam item** (Koga Toxic Orb, Blaine Flame Orb...)? Recomendo **sim**, 1 por partida, só ginásio e Final.
7. **Duelo:** itens ligados por padrão na sala nova? Recomendo **sim**, com a opção de desligar (como o limite de especiais).
8. **UT:** Bolsa só por objetivo e Desafio, nunca em pacote nem por Fichas? Recomendo **sim**.
9. **Parte B:** B4 e B5 agora, B1 e B2 na 0.10.2, Copinha Baby em janeiro? Recomendo **sim**. Vale perguntar ao playtester se ele jogou a Rota.

# Fontes

- Balatro Multiplayer: [GitHub](https://github.com/Balatro-Multiplayer/BalatroMultiplayer) (lidos `objects/consumables/asteroid.lua` e `traps.lua`), [balatromp.com](https://balatromp.com), [Notebookcheck sobre o mod](https://www.notebookcheck.net/Balatro-s-wild-Multiplayer-Mod-Future-teasers-and-how-to-install.964679.0.html) (Sabotage como consumível planejado ao perder o PvP)
- EA FC 25 sem contratos: [VGC](https://www.videogameschronicle.com/news/ea-sports-fc-25-is-removing-contracts-from-ultimate-team/), [90min](https://www.90min.com/posts/ea-sports-fc-25-ultimate-team-contracts-removed-sbc-storage-added-corner-kick-instructions-gk-movement-nerfed)
- Pokémon (X Attack, Full Heal, Red Card, Toxic/Flame Orb), Mario Strikers Battle League, Slay the Spire, Super Auto Pets e TFT: de memória (Bulbapedia e wikis), sem abrir página nesta pesquisa
- No repo: `docs/planos/pesquisas/agencia.md` (M8), `docs/planos/beira-da-quadra-2.md` (robô de técnico), `docs/planos/sinergias-secretas-fase2.md` (régua), `docs/planos/patrocinios-novos.md` (título por ponto), `docs/planos/copa-roguelike.md`, `docs/planos/rota-pre-evolucoes.md`, `docs/planos/rota-progressao.md`
