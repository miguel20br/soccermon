---
description: Rota Índigo: o que está inútil (medido), 3 direções pra mais ramificação e um Pular que vale, e as decisões do Miguel.
---

# Rota Índigo: menos coisa inútil, mais caminho (09/11/2026)

Pedido do Miguel: "a rota índigo tem muitas coisas inúteis. principalmente pular as escolhas não te dá nada. também
queria que tivéssemos mais ramificações nas escolhas de caminhos."

Começou como análise (base: worktree `v0944`); a A entrou em 09/11 (seção no fim). Os números saem de dois scripts no scratchpad (não estão no repo):
- **Mapa:** 2.000 mapas sorteados por `buildCupMap` e 5 caminhos ao acaso em cada um (10 mil Rotas andadas), sem partida.
- **Robô:** 200 Rotas inteiras com partida de verdade (`runMatch`), as mesmas 200 seeds nas duas políticas (comparação
  pareada). O robô vai por caminho ao acaso, monta pelo "Monta pra mim", pega o Pokémon que melhora uma vaga em mais de 2
  pontos ou um item pra titular sem item, usa o sorteio quando nada serve, compra no Mercado e escolhe o óbvio nos eventos.
  - `pega`: joga normal.
  - `pula`: igual, mas aperta Pular em todo prêmio, Baú e recompensa do grupo, e descansa no Treino (só contrata do rival).

Ressalvas: o robô não ensina MT (o prêmio MT vale zero pra ele), não troca tática e não substitui. O título tem erro de
uns ±3 pp. Simulação não mede diversão.

## 1. Como a Rota funciona hoje

Arquivos: `src/engine/cup-map.ts` (mapa, rivais, `ROTA_RULES`), `src/store/long-events.ts` (eventos "?", Centro, Pedra),
`src/store/game-store.ts` (`enterNode`, `skipReward`, `rerollReward`, `train`, `afterReward`), `src/engine/rewards.ts`
(o 1 de 3), `src/engine/shop.ts` (Mercado e ₽), `src/ui/screens/CupMap.tsx` e `Reward.tsx` (telas),
`src/i18n/*/longCup.ts`.

### O mapa

9 linhas, sempre na mesma ordem (`LAYOUT = M S M S B M S M T`): 4 partidas no mapa, 3 linhas de parada, a linha do
Baú/Centro e o Treino final. Depois vêm o grupo no Planalto (3 jogos) e a Final, sem escolha. Toda Rota tem 8 partidas
(decisão da copa longa: tempo previsível, ~35 min).

```
HOJE (um mapa típico; cada casa liga na mesma coluna e na vizinha)

 Estrada da Vitória   8          [Treino]                 sempre 1 casa: passo forçado
 Cerulean             7   [Jogo]   [Ginásio]  [Jogo]      partida
                      6   [Merc]   [Evento]   [Evento]    parada (a escassez troca Mercado por Evento)
 Mt. Moon             5      [Jogo]      [Jogo]           partida (2 casas)
                      4   [Baú]    [Centro]   [Baú]       Baú ou Centro
 Floresta             3      [Merc]      [Evento]         parada
                      2   [Jogo]   [Ginásio]  [Jogo]      partida
 Rota 1               1   [Evento] [Merc]     [Treino]    parada
                      0   [Jogo]   [Jogo]     [Jogo]      sempre 3 Jogos
                                  ↓
                 Planalto: grupo (3 jogos) e Final, sem escolha
```

Ramos: cada coluna tem tipos (`BRANCHES`), que puxam rival, Baú, Mercado e item. Cada Jogo mostra o prêmio no mapa
(MT, item de tipo ou ₽ em dobro, diferentes na mesma linha) e, desde 30/10, toda vitória num Jogo abre antes o
"1 de 3 do time rival". Uma vez por região, um Jogo também dá a pedra dela.

### Quanta escolha o mapa dá (2.000 mapas)

| Medida | Hoje |
|---|---|
| Caminhos por mapa | 94 |
| ...com sequência de tipos de casa diferente | **27** |
| Passos da Rota (9) em que há escolha | **5,3** (3,7 passos forçados) |
| Opções por escolha | 2,2 |
| Escolhas entre tipos de casa diferentes | **3,1 por Rota** |
| Escolhas em que as opções levam às mesmas casas da linha seguinte | 12% |

Por linha:

| Linha | O que é | Tem escolha | Opções | Escolha entre casas do mesmo tipo |
|---|---|---|---|---|
| 0 | Jogo | 100% | 3,0 | **100%** (3 Jogos, só muda o prêmio) |
| 1 | Parada | **46%** | 2,1 | 0% |
| 2 | Jogo | 62% | 2,0 | 41% |
| 3 | Parada | 63% | 2,1 | 0% |
| 4 | Baú/Centro | 63% | 2,0 | 19% |
| 5 | Jogo | 64% | 2,0 | 37% |
| 6 | Parada | 64% | 2,1 | 46% |
| 7 | Jogo | 63% | 2,0 | 39% |
| 8 | Treino | **0%** | 1 | — |

Os 94 caminhos impressionam, mas são quase todos o mesmo: o mapa tem 2 a 3 casas por linha, cada casa liga em 1 ou 2
de cima, e em 4 de cada 10 passos você só tem uma porta. Das escolhas que sobram, 4 de cada 10 são entre duas casas
do mesmo tipo (Jogo × Jogo), em que só muda o prêmio.

### O que cada casa e cada escolha dá (robô `pega`, 200 Rotas)

Δtime = média da nota dos titulares na vaga, logo depois da casa (na partida, só a recompensa, não a evolução jogando).

| Casa | Por Rota | Δtime | Δ₽ | Δitens | Nada mudou |
|---|---|---|---|---|---|
| Jogo (prêmio item) | 0,64 | +1,67 | 0 | +0,98 | 0% |
| Jogo (prêmio MT) | 0,61 | +1,97 | 0 | 0 | 22% |
| Jogo (₽ em dobro) | 0,58 | +1,82 | 0 | 0 | 32% |
| Mercado | 0,78 | +0,94 | −7,5 | +0,33 | 22% |
| Ginásio | 0,36 | +0,74 | 0 | +0,60 | 0% |
| Baú | 0,48 | +0,31 | 0 | +0,84 | 0% |
| Treino (item) | 0,49 | 0 | 0 | +0,97 | 3% |
| Treino (meia barra de evolução) | 0,27 | (barra) | 0 | 0 | — |
| Treino (Descanso, +1 sorteio) | 0,23 | 0 | 0 | 0 | **100%** |
| Centro Pokémon | 0,32 | 0 | 0 | 0 | 58% só com "Seguir viagem" |
| Evento | 1,34 | 0 | −0,5 | −0,09 | (efeito costuma vir depois) |

No Jogo, quase todo o ganho vem do 1 de 3 do rival (é a primeira tela). O prêmio da casa só soma por cima.

### O Pular hoje

- **Pular o 1 de 3 do rival: não dá nada** (`skipReward`: `rerolls + (rivalPick ? 0 : 1)`). O botão diz só "Pular".
- **Pular o prêmio da casa, o Baú, o Treino de técnica ou a recompensa do grupo:** +1 sorteio.
- **Descanso no Treino:** +1 sorteio.
- **Onde o sorteio serve na Rota:** só em "Sortear de novo" nas telas de recompensa. O draft já passou, e a troca de
  vitrine do Mercado é paga em ₽ (`rerollPrice`), não em sorteio.

Medido (200 Rotas, mesmas seeds):

| | `pega` (joga normal) | `pula` (pula tudo menos o rival) |
|---|---|---|
| Sorteios ganhos durante a Rota | 0,94 | 4,03 |
| Sorteios usados | 1,17 | 0,51 |
| **Sorteios sobrando no fim** | 1,77 | **5,52** |
| Título | 31% | 24% |
| Chega ao grupo | 60% | 58% |
| Time no fim | 81,7 | 80,8 |
| ₽ sobrando no fim (de ~35 ganhos) | 27 | 25 |

Onde o sorteio foi gasto (`pega`):

| Tela | Sorteios por Rota | Opções iguais depois do sorteio | O sorteio achou algo útil |
|---|---|---|---|
| 1 de 3 do rival | 0,48 | **100%** | 0% |
| Prêmio MT | 0,56 | 0% | 0% (o robô não usa MT) |
| Grupo | 0,10 | 0% | 10% |

## 2. O que está inútil (com a evidência)

1. **Pular.** Pular o rival dá zero. Pular o prêmio dá +1 sorteio, e o sorteio quase não tem onde ser gasto: quem pula
   tudo junta 4 e termina com 5,5 sobrando. Pular custa ~7 pp de título (31% → 24%) e não devolve nada que dê pra usar.
2. **"Sortear de novo" no 1 de 3 do rival gasta o sorteio e devolve as mesmas 3 cartas** (100% das vezes). O
   `prizeOptions('pokemon')` pega os 3 melhores do rival em ordem, sem sorteio (`rewards.ts`, `fromRival`). É um bug.
3. **A tela da pedra:** em **91%** das vezes (368 de 403) ninguém do time evolui com ela, e a tela só tem "Deixar".
   É um clique a mais depois de quase todo Jogo de região.
4. **Centro Pokémon:** em **58%** das visitas não há amarelo pra tirar nem ninguém fora, e só sobra "Seguir viagem".
   Ele toma o lugar de um Baú na linha 4.
5. **Descanso do Treino:** +1 sorteio, o mesmo prêmio fraco do Pular (a revisão de 30/10 já tinha cortado o "+1 sorteio"
   de outro evento por isso). E o Treino de evolução só aparece em **27%** das visitas: no fim da Rota quase todo mundo
   já evoluiu, então o último Treino quase sempre vira pacote de item.
6. **O último passo do mapa (Treino) é forçado** em 100% dos mapas, e a linha 0 é sempre 3 Jogos iguais.
7. **₽ sobrando:** o robô termina com ₽27 dos ~35 que ganhou. Depois do último Mercado o ₽ não serve pra nada, e o
   "₽ em dobro" é o prêmio que mais vezes não muda nada (32%). Mas o robô compra pouco, então o número real deve ser
   menor (ver item 9).
8. **Saídas dominadas nos eventos:** na Entrevista, "Sem comentários" perde sempre de "Respeito o time deles" (o rival
   fica mais fraco de graça). Toda tela de evento tem uma saída que não dá nada.
9. **Telemetria cega na Rota:** o evento `reward` só é gravado quando a tela seguinte é escalação ou Mercado
   (`track.ts:271`). Na Rota a seguinte é o mapa, o evento, o grupo ou outra recompensa, então nenhuma recompensa da Rota
   chega no `npm run stats`. Não dá pra ver o que os jogadores de verdade pulam.
10. Sobra de código: `OutWhy` ainda tem `'cansado'`, mas nada põe ninguém "cansado" desde o corte do Treino puxado.

O que **não** está inútil: o 1 de 3 do rival (+1,7 a +2 de time por Jogo), o Mercado (+0,9), o item do Treino e do Baú
(quase 1 item cada) e o Ginásio (prêmio forte, rival +2). E a escolha de caminho existe, só que é curta.

## 3. Três direções

Referências: Slay the Spire (mapa com 6 ramos que se juntam e se separam, elite opcional, fogueira "curar ou
melhorar"), Balatro (pular o blind dá uma **etiqueta** que aparece no botão antes de você decidir), Hades (a porta
mostra o prêmio), Monster Train (em cada trecho você escolhe um de dois lados, e cada lado é um pacote de paradas),
FTL (evento com opção azul que depende do seu time), Inscryption (nó de troca e de sacrifício).

### A. "Tudo vale alguma coisa" (conserto, sem mexer no mapa)

O que muda pro jogador: nenhuma tela fica sem escolha de verdade, e pular passa a ser uma aposta.

- **Pular mostra o que dá, estilo Balatro.** Cada tela de recompensa sorteia (pela seed) uma etiqueta no botão:
  "Pular: +₽4", "Pular: troca grátis no próximo Mercado", "Pular: próximo rival −1", "Pular: meia barra de evolução pra
  um", "Pular: +2 sorteios". Quando o 1 de 3 não serve, pular vira uma escolha boa, não um prêmio de consolação.
- **Pular o rival:** "Dispensar: +₽2" (o clube paga pra você não levar ninguém).
- **O sorteio passa a valer no Mercado** (1 sorteio = 1 troca de vitrine grátis). Assim ele tem onde ser gasto.
- **Conserto do sorteio no rival:** o novo 1 de 3 sai do elenco todo do rival (titulares e banco), não dos 3 melhores
  de novo. Sem sorteio possível, o botão fica apagado.
- **Pedra sem ninguém que use:** "Guardar na Mochila" (usa depois, quando entrar alguém que evolui com ela) ou
  "Vender: +₽4". Sem a tela vazia.
- **Centro sem nada pra tratar vira "PC do Bill":** troque um reserva por um sorteado de raridade acima. O Centro deixa
  de ser casa morta.
- **Descanso do Treino:** troca o +1 sorteio por "Folga": +₽5 e quem está fora volta (se não houver ninguém fora, só o ₽).
- **Entrevista:** "Sem comentários" vira "Fugir dos repórteres: +1 sorteio", ou a escolha sai da tela.
- **Telemetria:** gravar `reward` (e casa escolhida) também na Rota. É processo, sobe sem perguntar.

O que o Pular dá: a etiqueta à vista (₽, troca de vitrine, rival −1, barra de evolução, sorteios).
Custo: `rewards.ts` (rival e etiqueta), `game-store.ts` (`skipReward`, `train`, `rerollShop`, pedra, Centro),
`long-events.ts`, `Reward.tsx`, `CupMap.tsx` (tela do evento), `shop.ts`, `track.ts`, i18n PT/EN, testes. Save:
campos novos opcionais no `RunState` (etiqueta da tela, `bag` da Mochila, troca grátis), **sem migração**. Motor:
**não** (o "rival −1" usa o `rivalShift` que a Entrevista já usa). ~1 a 2 dias.
Riscos: ₽ e sorteio já sobram, então a etiqueta de ₽ precisa de onde gastar (o Mercado e o item 7). "Rival −1"
empilhado com a Entrevista dá rival −2: pôr teto. Os números das etiquetas pedem robô antes/depois e o ok do Miguel.

### B. "Mapa largo" (Slay the Spire de verdade, mantendo as 8 partidas)

O que muda pro jogador: todo passo tem escolha, os caminhos se juntam e se separam, e cada lado tem casas que o outro
não tem.

```
PROPOSTO (B): 4 colunas, cada casa liga em 2 (às vezes 3) de cima, todo passo com 2+ portas

 Estrada da Vitória   8   [Treino]  [Merc. do Planalto]  [Centro]       a última parada vira escolha
 Cerulean             7   [Jogo]  [Ginásio Misty]  [Jogo]  [Ás]
                      6   [Merc] [Cassino]  [Evento]  [Treino]
 Mt. Moon             5   [Jogo]  [Jogo]  [Ginásio Brock]  [Jogo]
                      4   [Baú]  [Safari]  [Centro]  [Baú]
 Floresta             3   [Evento] [Merc]  [PC do Bill]  [Treino]
                      2   [Jogo]  [Ás]  [Jogo]  [Jogo]
 Rota 1               1   [Merc] [Evento]  [Treino]  [Baú]
                      0   [Jogo]  [Jogo]  [Jogo]  [Jogo]
   (cada linha liga na de cima em X: dá pra cruzar de um lado pro outro em 2 passos)
```

- **4 casas por linha** (3 a 4) e cada uma liga em 2 de cima, às vezes 3. A regra de não cruzar linha continua no
  desenho, mas os caminhos trocam de lado em 2 passos.
- **Casas novas no tema** (escolher 2 ou 3):
  - **Treinador Ás** (elite leve, linha de partida): rival +1 e prêmio raro (item ouro ou MT rara).
  - **Zona Safari** (parada): 1 de 3 Pokémon selvagens da região, mas cada um tem chance de fugir (a chance aparece na carta).
  - **Cassino de Celadon** (parada): aposta ₽ em roleta/caça-níquel por item ou carta. Gasta o ₽ que sobra.
  - **PC do Bill** (parada): troca um reserva por um sorteado de raridade acima.
  - **Dojo de Saffron** (partida): vence os Faixas-Pretas e escolhe Hitmonlee ou Hitmonchan (o presente do Gen 1).
- **A última parada vira escolha:** Treino · Mercado do Planalto · Centro. O ₽ que sobra tem onde ir antes do grupo.
- Linha 0 com prêmios mais diferentes (um Jogo pode ser "Pokémon do rival em dobro", outro "₽ em dobro").

Meta medida com o mesmo script: passos com escolha de 5,3 → ~8 de 9; escolhas entre tipos diferentes de 3,1 → ~6;
sequências distintas de 27 → 60+.

O que o Pular dá: o mesmo da A (as duas se somam). Dá pra ter também "Seguir direto" numa parada (+₽3, sem entrar),
como pular uma fogueira.
Custo: `cup-map.ts` (gerador, `ROTA_RULES` com largura e ligações, escassez por caminho), `cup-map.test.ts` (os testes de
largura, "ligações não se cruzam", "4 partidas por rota"), `CupMap.tsx` (4 colunas a 320 px: casas menores, conferir
320/390/deitado), `game-store.ts` (`enterNode` com as casas novas), telas novas pra Safari e Cassino, i18n PT/EN,
`rota-caminhos.sim.test.ts` (o robô aprende as casas). Save: o mapa vive no `RunState`, então Rota guardada continua com
o mapa velho, **sem migração**. Tipo novo de casa (`NodeKind`) num save aberto por um aparelho com versão velha pode
quebrar a tela: conferir o `reconcile` da nuvem. Motor: **não** (Ás e Dojo usam `longOpponent` com `shift`, como o Ginásio).
~4 a 6 dias com 2 casas novas.
Riscos: mais Mercado e Baú alcançáveis deixam o time mais forte (o robô mostrou: Mercado +0,9 e Baú +0,8 item cada).
Título pode subir uns pontos, então a escassez (`maxShops`) e a dificuldade (`LONG_DIFFICULTY`) precisam do robô antes e
depois. Mapa de 4 colunas a 320 px é apertado. Cassino com ₽ é aposta (o Miguel gosta de combo forte; o risco é o
Cassino virar a melhor casa sempre).

### C. "Trilhas por região" (Monster Train + Hades)

O que muda pro jogador: menos cliques e escolhas mais pesadas. Em cada região você escolhe 1 de 2 ou 3 **trilhas com
nome**, e cada trilha é um pacote visível de 2 a 3 casas.

```
PROPOSTO (C): a cada região, 2-3 trilhas com nome; cada trilha é um pacote

 Floresta de Viridian ──┬── Trilha do Bosque:   Jogo (Caça-Insetos, item) → Baú → Evento
                        ├── Atalho por Pewter:  Ginásio do Brock → Mercado
                        └── Túnel Diglett:      Jogo → Centro → sai mais perto do Mt. Moon (+1 sorteio)
 Mt. Moon ──────────────┬── Caverna:            Jogo (Pedra da Lua) → Fósseis
                        └── Rota 3:             Jogo (₽ em dobro) → Mercado → Treino
```

- Cada trilha mostra tudo antes (prêmio, rival, tipo), como a porta do Hades.
- Dá pra abrir **elite opcional que soma partida** (a Rota pode ter 8 ou 9 jogos). Isso quebra a regra "toda Rota tem 8
  partidas", então é decisão do Miguel.
- Muito texto e arte de Kanto (nome de rota, quem fala), bom pra história e pra trailer.

O que o Pular dá: o da A, mais "atalho" (uma trilha curta que pula uma parada e paga sorteio ou ₽).
Custo: o mapa vira outro modelo (trilhas em vez de grade): `cup-map.ts` novo, `CupMap.tsx` quase todo, textos de cada
trilha (PT/EN), robô novo. Save: mapa velho continua, mas o `RunState` ganha o formato de trilha: migração leve ou dois
caminhos de código. Motor: não. ~1,5 a 2 semanas.
Riscos: é o que mais muda o jogo e o mais caro de reverter (ADR se for). Com 9 partidas o tempo passa de ~35 min e o título cai.

## 4. Recomendação

**A agora e B em seguida.** A A conserta o que o Miguel sentiu ("pular não dá nada"), tira as 4 casas e telas mortas
(sorteio do rival, pedra sem uso, Centro vazio, Descanso) e é barata. Fora o conserto do sorteio do rival e a telemetria,
o resto mexe na economia e pede o ok dele nos números. A B é a resposta direta pra "mais ramificações": todo passo com
escolha e casas que só existem de um lado, sem mexer no motor nem nas 8 partidas. A C fica guardada pra se a B ainda
parecer pouco, ou pro Modo História.

Antes de mexer, o robô dá a régua (passos com escolha, escolhas entre tipos, título, ₽ e sorteio sobrando). Depois, o
Miguel joga umas Rotas na prévia.

## 5. Decisões do Miguel

1. **Pular:** etiqueta sorteada e à vista no botão, estilo Balatro (₽, troca grátis no Mercado, rival −1, meia barra de
   evolução, sorteios)? Recomendo sim. As alternativas são ₽ fixo (+₽3) ou Fichas do Time Ultimate.
2. **Pular o rival** passa a dar +₽2 ("Dispensar")? Recomendo sim.
3. **Sorteio no rival:** sortear do elenco todo dele (recomendo) ou apagar o botão nessa tela?
4. **Sorteio vale como troca grátis da vitrine no Mercado?** Recomendo sim.
5. **Telas mortas:** pedra sem uso → Mochila ou vender (recomendo Mochila); Centro vazio → PC do Bill; Descanso → Folga
   (+₽5 e quem está fora volta); "Sem comentários" → +1 sorteio. Pode ser tudo?
6. **Mapa largo (B):** 4 colunas, todo passo com escolha, a última parada vira Treino · Mercado do Planalto · Centro?
   Recomendo sim.
7. **Casas novas:** quais 2 ou 3 entram primeiro? Recomendo Zona Safari, Cassino de Celadon e Treinador Ás.
8. **As 8 partidas fixas** continuam (recomendo), ou abre a elite opcional que soma partida (C)?

## Decidido com o Miguel (09/11)

"Vamos fazer a A e a B em seguida" e "apoio todas as recomendações". A A entrou na branch `rota-a` (a B vem noutra
rodada). Sem mudança no motor (nada de `ENGINE_VERSION`). Save: `bag` e `shopFree` opcionais no `RunState`, sem migração.

1. **Pular mostra a etiqueta, estilo Balatro** (`skipTagOf`/`applySkip` em `src/store/long-events.ts`): sorteada pela
   seed em cada tela (prêmio da casa, Baú, Treino de técnica, grupo), à vista no botão. Valores: +₽4, troca grátis no
   Mercado, próximo rival −1, meia barra de evolução (pro titular mais perto de evoluir), +2 sorteios. Só entra no
   sorteio o que serve agora: troca grátis com Mercado alcançável pela frente, rival −1 com partida no mapa e sem outro
   −1 guardado (teto: não empilha com a Entrevista), meia barra com alguém que evolui. A Relâmpago segue +1 sorteio.
2. **Dispensar o rival: +₽2.**
3. **Sortear de novo no rival** sorteia 3 do elenco todo dele, primeiro quem não estava na mesa; sem ninguém novo, o
   botão apaga e o sorteio não é gasto. (Bug: antes voltavam as mesmas 3 cartas em 100% das vezes.)
4. **Sorteio vale como troca de vitrine no Mercado da Rota:** a troca grátis do Pular paga primeiro, depois o sorteio,
   depois o ₽.
5. **Telas mortas:** pedra → Usar, Guardar na Mochila (no mapa, a pedra guardada vira um botão que abre a tela dela) ou
   Vender (+₽4); Centro sem nada pra tratar → PC do Bill (troca um reserva por uma carta à vista, a melhor de 3 da
   raridade do Baú); Descanso → Folga (+₽5 e quem está fora volta); "Sem comentários" → "Fugir dos repórteres" (+1 sorteio).
8. **Continuam as 8 partidas fixas.**

Telemetria: o `reward` agora é gravado também na Rota (`rewardEvent` em `src/analytics/track.ts`, com `screen` e `tag`);
o `npm run stats` ganhou "Rota: puladas por tela" e "Rota: etiquetas do Pular".

### Robô antes e depois (200 Rotas, mesmas seeds, partida de verdade)

O robô depois aprendeu as telas novas: vende a pedra que ninguém usa, troca no PC do Bill quando a carta é melhor que o
pior reserva, usa a troca grátis ou o sorteio no Mercado quando a vitrine não serve. Título tem erro de uns ±3 pp.

| | `pega` antes | `pega` depois | `pula` antes | `pula` depois |
|---|---|---|---|---|
| Título | 31% | 32% | 24% | 25% |
| Chega ao grupo | 60% | 59% | 58% | 58% |
| Time no fim | 81,7 | 81,8 | 80,8 | 81,0 |
| ₽ sobrando no fim | 27,4 | 31,7 | 25,4 | 37,0 |
| Sorteios sobrando no fim | 1,77 | 1,26 | 5,52 | 3,52 |
| Sortear no rival devolve as mesmas cartas | 100% | 0% | 100% | 0% |
| Pedra sem uso que só dava "Deixar" | 91% | 0% (vende) | | |
| Centro só com "Seguir viagem" | 58% | 0% (PC do Bill: troca em 87%) | | |

Quanto o Pular rende agora, por Rota, pra quem pula tudo (`pula`): ₽4,8 (Dispensar e +₽4), +2,25 sorteios, 0,22 troca
grátis, 0,40 rival −1 e 0,43 meia barra. Antes: +4 sorteios que sobravam (5,5 no fim) e nada mais.

Leitura: pular continua pior que pegar (25% contra 32%), então nenhum número foi ajustado pra baixo. O que piorou:
**sobra mais ₽** (27 → 32 em quem pega, 25 → 37 em quem pula), porque o Pular e a Folga pagam ₽ e quase não há onde
gastar depois do último Mercado. É o argumento pro "Mercado do Planalto" da B. A troca grátis no Mercado vale menos
que +2 sorteios (o sorteio agora também troca a vitrine): se ficar sem graça jogando, vira outra etiqueta na B.
