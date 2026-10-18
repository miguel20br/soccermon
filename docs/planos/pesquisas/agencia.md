# Agência do técnico na partida (pesquisa e proposta, 18/10/2026)

Pedido do Miguel: "pensar em maneiras de deixar os jogadores com mais AGÊNCIA sobre a partida, mas sem fazer eles
mesmos jogarem. Temos que ter um balanço muito consciente de estratégia."

Base: código da `int-086` (0.8.6), planos `jogo-gostoso.md`, `balanceamento-geral.md`, `multiplayer.md`,
`lancamento.md` e pesquisa de referências (seção 6, com links; versão longa em `agencia-referencias.md`). Nada aqui foi codado; toda mudança de equilíbrio
passa pela skill `soccermon-balanceamento` com antes/depois e o ok do Miguel.

---

## 1. Resumo em 10 linhas

1. Hoje o técnico decide muito **antes** da partida (draft, formação, vagas, capitão, tática, escanteio, cobrador, MT)
   e pouco **durante**: 4 botões de tática (3 trocas), escanteio (3 trocas), substituição e prancheta.
2. O que mais tem cara de Pokémon (golpes, evolução, itens, pênaltis) é **100% automático**.
3. **81% jogam em 8x**: decisão que exige reflexo ao vivo não vai ser usada. Agência boa aqui mora em **pausas com
   significado** (bola parada, intervalo, pedido de tempo) e em **gatilhos visíveis** (barra cheia, placar, minuto).
4. O rival da Copa **não reage** (tática fixa da tabela do `cup.ts`, troca automática no intervalo): sem contra-jogo,
   "ler o rival" é trivial e a decisão certa vira sempre a mesma.
5. A regra de ouro das referências (FM, Top Eleven, Clash Royale, Pokémon Unite, Into the Breach): **poucas decisões,
   cada uma com custo e com efeito que se vê em campo**. Microgerenciamento nasce quando a decisão é barata e o
   efeito é invisível.
6. Proposta: 12 mecânicas, ranqueadas. As 3 primeiras pra 0.8.x: **Pedido de tempo + gritos do técnico**,
   **Goleiro-linha** e **Golpe máximo do capitão**. Atalhos baratos: ordem dos pênaltis e "segurar a evolução".
7. Antes de tudo, um **passo zero** de 1 linha: mandar `orders` (quantas e quais) no `match_end` pra saber quanto o
   técnico já mexe hoje.
8. Método de equilíbrio comum a todas: um **técnico robô** em `scripts/balance/` com 3 políticas (nunca usa, usa
   aleatório, usa bem). Meta: usar bem vale **+3 a +6 pontos** de vitória, aleatório fica perto de 0, nunca usar não
   pode ser obrigatoriamente pior que 5 pontos (senão vira "sempre clique").
9. Tudo entra pelo caminho das ordens que já existe (`MatchOrder` → `LiveRunner.step` → resimulação no worker na
   Copa, carimbo do host no Duelo). Cada mecânica que muda partidas sobe `ENGINE_VERSION`.
10. Decisões do Miguel listadas na seção 5; referências com links na seção 6.

---

## 2. O que já existe (levantamento no código)

### Decisões do técnico e o momento de cada uma

| Momento | Decisão | Onde no código | Limite / custo hoje |
|---|---|---|---|
| Antes (Copa) | draft 1 de 3, rerolls, MT, item | `draft.ts`, `rewards.ts`, `tm.ts`, `items.ts` | rerolls contados; 1 item por Pokémon |
| Antes | formação (6), vagas, banco | `Lineup.tsx`, `formations.ts` | nenhum |
| Antes | capitão (aura +3%, +6% no mesmo tipo) | `modifiers.ts` `captainFactor` | fixo a partida toda |
| Antes | tática inicial (4) | `TeamSetup.tactic`, `effective.ts` `TACTIC_MODS`, `ai-controller.ts` `TACTIC_SHIFT` | nenhum; ofensiva gasta fôlego 1,3x |
| Antes | instrução de escanteio (Na área / Curta / Variar) e cobrador | `TeamSetup.corner`, `cornerTakerUid`, `CORNER_TUNING` | nenhum |
| Ao vivo | tática | `TacticChange` → `LiveRunner.changeTactic` | `MAX_TACTIC_CHANGES = 3`; vale ~2 s de jogo à frente (`CHANGE_LEAD_TICKS = 40` × velocidade) |
| Ao vivo | escanteio | `CornerOrder` → `changeCorner` | 3 trocas, contadas à parte |
| Ao vivo | substituição | `SubOrder` → `pendingSubs` → `applyPendingSubs` na próxima bola parada | até o tamanho do banco, 1 pendente por vez |
| Ao vivo | prancheta (formação + vagas) | `LineupOrder` (0.8.6) | sem limite, 1 pendente por time, próxima bola parada |
| Ao vivo | velocidade (1x a 8x, "Lances") e tocar no Pokémon | `MatchScene`, `PlayerInspect.tsx` | só visual |
| Intervalo | painel com chutes, posse, mais cansado e uma dica; troca e prancheta valem no vestiário | `HalftimePanel.tsx`, `LiveRunner.step` (`phase === 'halftime'`) | nenhum além dos de cima |

### O que é automático (e por isso é onde mora a agência que falta)

- **Golpes**: a IA decide (`ai-controller.ts`, `useMove` em ~10 situações). Cada golpe tem 1 uso por partida (2 se PP ≥ 25,
  `moves.ts:630`), recarga de 25 s por Pokémon e um intervalo global de 5 s entre golpes de qualquer time (`MOVE_GAP`).
  Golpe é recurso escasso que o técnico não toca.
- **Evolução**: bate o limiar (`evoNeeded`) e evolui na bola parada seguinte (`checkEvolutions`). Golpe novo chega cheio;
  golpe que continua mantém os usos gastos.
- **Combos de sinergia**: 1 por sinergia por tempo, disparam sozinhos (`comboLink`).
- **Itens** (Leftovers, Focus Sash, Lum Berry…) e **habilidades** (clutch, auras): passivos ou de uso único automático.
- **Pênaltis**: os cobradores são ordenados por chute e o resultado é um sorteio (`penaltyShootout`): nenhuma decisão.
- **Garra** (`comebackFactor`): quem perde por 3+ cresce sozinho.
- **Rival da Copa**: tática fixa por clube (`cup.ts`), troca automática no intervalo (`halftimeSubs`), nunca muda nada ao vivo.

### Detalhes técnicos que moldam a proposta

- **Copa = partida inteira pré-calculada.** `sendOrder` (Match.tsx) agenda a ordem à frente da tela e resimula tudo no
  worker com a agenda. Qualquer ordem nova funciona na Copa sem mexer no fluxo, desde que seja determinística. Cuidado:
  o cliente "sabe o futuro"; nenhuma mecânica pode mostrar previsão (tipo "chance de gol agora") que vaze o que já foi
  calculado.
- **Duelo**: ordens carimbadas pelo host, seed por trecho de 2 min, limite validado no `duel-state.ts`. Toda ordem nova
  precisa de: tipo no `MatchOrder`, `validOrder`, ramo no `LiveRunner.step`, validação no `duel-state.ts` e botão no
  `DuelMatch.tsx`. Os contadores de limite hoje moram no `LiveRunner` (não no estado); pras mecânicas novas vale guardar
  o contador no `TeamRuntime` (sobrevive a snapshot e retomada).
- **Ganchos prontos**: `Buff {attr, factor, timer}` por jogador (efeito temporário de time é só aplicar buff nos 5),
  `applyPendingSubs` em toda bola parada (`setupKickoff`, `goalClearance`, `setupCorner`, intervalo), `traitFx`/eventos
  pra animação, `match:hold` pra pausar o playback.
- **Sem faltas no motor** (nem tiro livre): "cobrador de falta" não tem onde entrar sem criar faltas, o que é outra
  feature grande.
- **Calibração não usa ordens** (`scripts/calibrate.ts` e `scripts/balance/*` rodam sem agenda). Pra medir agência
  precisa do técnico robô (seção 4).

---

## 3. As 12 mecânicas

Formato de cada uma: como funciona (com exemplo em campo), momento, custo e limite, contra-jogo, motor, equilíbrio e
medição, UI no celular, tamanho (P = dias, M = 1 semana, G = 2+ semanas).

### M1. Pedido de tempo (timeout de futsal)

- **Como funciona:** botão "Tempo" (regra real do futsal: 1 por tempo por time). A partida para na próxima bola parada,
  abre um painel tipo intervalo curto (placar, fôlego, dica) onde troca, prancheta e um grito (M2) entram **na hora**, e
  todo mundo recupera um pouco de fôlego. Ex.: 2 x 3 aos 15' do 2º tempo, Charizard com 30% de fôlego: pede tempo, tira
  ele, sobe pra ofensiva e manda "Pra cima!".
- **Momento:** ao vivo, efeito na próxima bola parada.
- **Custo/limite:** 1 por tempo, não acumula. Fôlego +0,05 a +0,08 (decidir).
- **Contra-jogo:** o rival vê "Tempo pedido" e também ganha a pausa (no Duelo, os dois mexem; a IA da Copa pode usar o
  dela com a regra de M10).
- **Motor:** ordem `timeout` no mesmo caminho (`pendingSubs` aplica na bola parada; a pausa em si é só `match:hold` no
  playback). O fôlego é a única mudança de partida → `ENGINE_VERSION`.
- **Equilíbrio:** pequeno se o fôlego for baixo. Medir com o robô "pede tempo quando o mais cansado < 40%".
- **UI:** botão na linha de Substituir; o painel reaproveita o `HalftimePanel` (já cabe em 320 px).
- **Por que é a base:** resolve o problema do 8x. Quem joga rápido ganha um momento pra pensar, com custo.
- **Tamanho:** P.

### M2. Gritos do técnico (cartas de beira de quadra)

- **Como funciona:** 3 gritos por partida, escolhidos de uma lista curta, efeito por 2–3 minutos de jogo, com um ícone
  sobre o time e uma fala na narração. Lista inicial: **Pra cima!** (+chute, +pressão; fôlego gasta 1,5x), **Fecha a
  casinha!** (+desarme, +posicionamento; chute −), **Calma!** (+passe; recupera fôlego devagar; menos golpes),
  **Abafa!** (pressão alta: o marcador sai mais vezes; fôlego 2x). Ex.: 1 x 0 aos 35', o rival na ofensiva: "Fecha a
  casinha!" segura o resultado.
- **Momento:** ao vivo (vale ~2 s à frente como a tática) e no Pedido de tempo.
- **Custo/limite:** 3 por jogo, recarga de 3 minutos, 1 ativo por vez. Cada grito tem um lado ruim (fôlego ou atributo).
- **Contra-jogo:** o rival vê o ícone e pode responder (Fecha a casinha contra Pra cima). IA da Copa responde pela M10.
- **Motor:** ordem `shout` → `Buff` nos 5 de quadra com `timer` (estrutura já existe) + viés no `TACTIC_SHIFT`
  (`pressBias`, `shootBias`). Determinístico. `ENGINE_VERSION`.
- **Equilíbrio:** é uma "tática temporária": risco de virar sempre "Pra cima" no fim. Medir cada grito por minuto e
  placar com o robô; meta: nenhum grito com ganho > +4 pontos em qualquer situação.
- **UI:** uma fileira de 3 ícones desenhados (sem emoji) com contador; fica na mesma linha da tática no celular em pé.
- **Ref.:** FM touchline shouts, Top Eleven, `jogo-gostoso.md` (já listado como "planejar com calma").
- **Tamanho:** M.

### M3. Goleiro-linha (o "power play" do futsal)

- **Como funciona:** botão "Goleiro-linha": o goleiro vira o 5º jogador de linha no ataque (vale enquanto ligado). Ex.:
  perdendo por 1 aos 37', liga, o Snorlax goleiro sobe, o time cerca a área com 5 e empata; ou perde a bola e o rival
  marca do meio da quadra no gol vazio.
- **Momento:** ao vivo, liga/desliga na próxima bola parada (ou só no 2º tempo, decidir).
- **Custo/limite:** risco puro (gol vazio). Limite: 2 ativações por partida, ou só no 2º tempo.
- **Contra-jogo:** o rival passa a chutar de longe no gol vazio (IA precisa saber isso: `shootThreshold` com bônus de gol
  vazio); no Duelo, o rival vê e pode recuar pra contra-atacar.
- **Motor:** flag por time no `TeamRuntime`; `homePosition` e `goalkeeper` do `ai-controller` mudam pro goleiro; `xg.ts`
  e o chute precisam tratar gol sem goleiro. `ENGINE_VERSION`. Atenção ao Ditto e à evolução do goleiro.
- **Equilíbrio:** dá viradas e gols (diversão > realismo). Medir com o robô "liga se perde por 1 nos últimos 5'":
  chance de empatar vs. chance de tomar mais um; meta: vale a pena perdendo por 1, não vale empatado.
- **UI:** um botão só, com estado ligado/desligado e o goleiro brilhando na quadra.
- **Ref.:** regra e uso real no futsal; nenhum jogo de técnico de futsal grande faz isso bem (espaço vazio).
- **Tamanho:** M.

### M4. Golpe máximo do capitão (barra de momento)

- **Como funciona:** o capitão tem uma barra que enche com o que o time faz (desarme, defesa, chute no gol, golpe que
  acerta; enche mais rápido perdendo). Cheia, aparece o botão; o técnico solta quando quiser e o capitão faz a versão
  máxima do golpe assinatura (efeito ~2x, animação própria, câmera lenta). Ex.: 0 x 1 na final, barra cheia, espera a
  bola chegar no Gyarados capitão e solta o Hyper Beam máximo.
- **Momento:** ao vivo; o golpe sai na próxima situação válida pra ele (com bola perto do gol pra golpe de ataque, perto
  do portador pra golpe de desarme), com janela de ~10 s. Se a janela passa, a barra volta pela metade.
- **Custo/limite:** 1 por partida. Barra visível pros dois lados.
- **Contra-jogo:** o rival vê a barra cheia e o brilho; pode marcar o capitão (com M5) ou mudar pra retranca.
- **Motor:** contador no `PlayerState`/`TeamRuntime` (eventos já existem: `tackle`, `shot`, `save`, `move`); ordem
  `captainMax`; a IA do capitão dispara um `useMove` especial com multiplicador. Liga com `signature-moves.ts`.
  `ENGINE_VERSION`.
- **Equilíbrio:** o capitão hoje só dá aura; isso aumenta o peso de escolher o capitão (bom), e pode concentrar mais ainda
  em lendários (ruim: medir diversidade de capitães, `1/Σp²`). Meta: o golpe máximo vale ~0,3 gol de média, não 1.
- **UI:** barra fina sob o placar do lado do time + botão grande quando cheia (cabe em 320 px se substituir o ícone do
  capitão).
- **Ref.:** Pokémon Unite (Unite Move), Z-Move/Dynamax/Tera (uma vez por batalha), Pokémon Masters (sync), FC (nada
  assim, ponto pro Soccermon).
- **Tamanho:** M (G com a animação de cada tipo).

### M5. Instrução individual (até 2 ativas)

- **Como funciona:** toca no Pokémon (o `PlayerInspect` já abre) e escolhe uma instrução: **Marcar** fulano (gruda no
  craque rival), **Segura a posição** (não sobe), **Liberdade** (vai pra cima, chuta mais). Ex.: o Alakazam rival fez 2
  gols: manda o Machamp marcar ele.
- **Momento:** ao vivo, vale na próxima bola parada (como a prancheta); também na escalação.
- **Custo/limite:** no máximo 2 ativas; marcar tira o marcador da cobertura (buraco atrás), liberdade gasta mais fôlego.
- **Contra-jogo:** quem é marcado pode ser trocado de vaga pela prancheta (o rival "foge" da marcação).
- **Motor:** ordem `instruct {uid, kind, targetUid?}`; `offBallMovement` (marcação já escolhe `mark` por proximidade:
  vira o alvo fixo), `homePosition` (offsets), `shootBias` individual. `ENGINE_VERSION`.
- **Equilíbrio:** marcação individual forte demais anula o Pivô rival; medir saldo do Pivô marcado.
- **UI:** 3 chips no painel do Pokémon + um ícone pequeno sobre quem tem instrução. Em 320 px cabe (é o painel que já
  existe). Risco de microgerenciamento: por isso o teto de 2.
- **Ref.:** FM (player instructions, man-marking, opposition instructions), Blood Bowl (marcar o craque).
- **Tamanho:** M.

### M6. Segurar a evolução (o "botão B")

- **Como funciona:** quando a barra de evolução enche, a carta pisca e aparecem **Evoluir** e **Segurar**. Evoluir:
  entra na próxima bola parada (como hoje). Segurar: fica na forma atual e dá pra evoluir depois, até o fim da partida.
  Ex.: Charmeleon com barra cheia aos 5' do 1º tempo: segura até o 2º tempo, porque o Charizard chega com os golpes novos
  cheios e muda o tipo pra ligar a sinergia de Voador na hora certa.
- **Momento:** ao vivo, na bola parada.
- **Custo/limite:** segurar = jogar mais tempo na forma fraca; evoluir cedo = gastar os golpes novos cedo.
- **Contra-jogo:** o rival vê a carta pronta (no Duelo, sabe que vem coisa).
- **Motor:** `checkEvolutions` passa a olhar uma ordem `evolve {uid}` pro time do técnico humano (rival da Copa evolui
  sozinho como hoje). Padrão quando o jogador não faz nada: decidir (seção 5).
- **Equilíbrio:** baixo; a evolução já foi calibrada (bloco 2 e bônus de +2). Medir quantas evoluções a mais/menos por copa.
- **UI:** os 2 botões no próprio aviso de evolução que já existe. Celular ok.
- **Ref.:** Pokémon (cancelar a evolução com B, Everstone). Combina com "nada automático no time do jogador".
- **Tamanho:** P.

### M7. Pênaltis com decisão (ordem e goleiro de pênalti)

- **Como funciona:** antes da disputa, uma tela de 15 s com os 5 cobradores em ordem (já vem sugerida pelo chute; o
  técnico arrasta) e a troca de goleiro só pra disputa (o "Tim Krul"). Ex.: bota o Hitmonlee de 1º pra abrir vantagem e
  guarda o Mewtwo pro 5º; troca o goleiro pelo Snorlax.
- **Momento:** bola parada (antes da disputa).
- **Custo/limite:** a troca do goleiro gasta uma substituição (se houver).
- **Contra-jogo:** a IA ordena pelo chute; no Duelo os dois escolhem às cegas e a ordem é revelada junto (compromisso e
  revelação, como as seeds).
- **Motor:** `penaltyShootout` lê a ordem de uma ordem `penalties {order, gkUid?}`; sem ordem, é igual a hoje.
  Determinístico. Muda só partidas com ordem, mas sobe `ENGINE_VERSION` por segurança.
- **Equilíbrio:** quase nulo (o sorteio continua; só muda quem bate). Medir nada além de um teste.
- **UI:** lista vertical arrastável; no celular em pé cabe; usar a cena de pênaltis que já existe (`?demo=penaltis`).
- **Tamanho:** P.

### M8. Bolsa do treinador (item ativável, 1 por partida)

- **Como funciona:** além do item segurado, o treinador leva 1 item de uso dele (ganho como recompensa da copa):
  **Poção** (fôlego +40% num Pokémon), **X Attack** (+chute de um Pokémon por 2'), **Full Heal** (tira status),
  **Revive**/**Max Ether** (devolve 1 uso de golpe). Ex.: o Pikachu dormiu com Sleep Powder antes do escanteio: Full Heal.
- **Momento:** ao vivo, na próxima bola parada.
- **Custo/limite:** 1 por partida; o item some quando usado (é recurso da copa inteira, estilo Poção do Slay the Spire).
- **Contra-jogo:** líderes de ginásio usam o deles (como o Full Restore dos líderes nos jogos de Pokémon).
- **Motor:** ordem `trainerItem {item, uid}`; efeitos já existem como peças (fôlego, `status = null`, `moveUses[i]++`,
  `Buff`). Economia nova nas recompensas (`rewards.ts`). `ENGINE_VERSION` e versão do save (migração).
- **Equilíbrio:** médio (economia nova). Medir valor de cada item com o robô.
- **UI:** um botão "Bolsa" que abre o item e depois o alvo (2 toques).
- **Ref.:** Pokémon (itens do treinador na batalha), Slay the Spire (poções), Top Eleven (boosters, só que ganhos jogando).
- **Tamanho:** M.

### M9. Chamar o golpe

- **Como funciona:** no painel do Pokémon, os golpes ainda não usados ganham um botão **Agora**: a IA usa aquele golpe na
  próxima situação boa (janela de ~10 s); ou **Guardar** (a IA não usa até o técnico mandar). Ex.: guarda o Sing do
  Jigglypuff pro escanteio rival; chama o Earthquake quando os 3 rivais estão juntos na área.
- **Momento:** ao vivo.
- **Custo/limite:** o golpe é 1 uso só (já é o custo). Golpe chamado fora de hora é perdido; no máximo 1 chamado
  pendente por vez.
- **Contra-jogo:** o golpe chamado brilha antes (telégrafo); o rival pode recuar ou usar Protect/Substitute.
- **Motor:** ordem `callMove {uid, slot, mode: 'now'|'hold'}`; o `ai-controller` olha a flag antes das ~10 escolhas de
  `useMove`. `ENGINE_VERSION`.
- **Equilíbrio:** a IA já escolhe bem os momentos; o ganho do técnico é pequeno e o risco de "jogar no lugar da IA" é
  alto. Medir: chamado vs. automático com o mesmo golpe.
- **UI:** 4 golpes no painel do Pokémon (já mostra o moveset).
- **Ref.:** Retro Bowl/Madden (chamar a jogada), FF XII (gambits), AFK Arena (ultimate manual vs. auto).
- **Tamanho:** M. **É a que mais encosta em "jogar"**: deixar pra depois da M4 e ver se o golpe máximo já basta.

### M10. Técnico rival que reage (e avisa antes)

- **Como funciona:** cada líder tem uma personalidade simples e previsível: Brock fecha a casinha se estiver ganhando no
  2º tempo; Misty vai pra cima se perde aos 30'; Giovanni usa goleiro-linha; Lance usa o golpe máximo assim que enche.
  A troca é **avisada uma bola parada antes** na narração ("Sabrina está chamando o time pra frente…"), e aí o técnico
  responde. Ex.: o aviso de que a Erika vai pra ofensiva te faz trocar pra contra-ataque.
- **Momento:** ao vivo (o rival), com a sua resposta ao vivo.
- **Custo/limite:** o rival segue os mesmos limites (3 trocas, 3 gritos, 1 tempo).
- **Contra-jogo:** é o próprio contra-jogo das outras mecânicas. Sem isso, "ler o rival" (tática dele já aparece no VERSUS)
  não vale nada.
- **Motor:** um "técnico IA" dentro do motor, que lê só o estado (placar, minuto, fôlego) e gera as mesmas ordens
  (`TacticChange` etc.) pro time 1 com o mesmo `seq`. Determinístico. No Duelo fica desligado (lado humano) ou vale pro
  técnico que caiu. `ENGINE_VERSION`.
- **Equilíbrio:** mexe na curva da copa (bloco 1: 74/67/55/50%). Recalibrar a força por fase junto.
- **UI:** só narração + um ícone no placar do rival. Zero botão novo.
- **Ref.:** Into the Breach (intenção do inimigo à vista), FM (o técnico rival muda no jogo), `jogo-gostoso.md` (ginásios com
  personalidade).
- **Tamanho:** M.

### M11. Foco da jogada (lado ou referência)

- **Como funciona:** um seletor "Jogar por": Esquerda, Centro, Direita ou **no craque** (escolhe um Pokémon que vira a
  referência: os passes procuram ele). Ex.: o Ala direito rival é lento (Slowbro): ataca pela esquerda dele.
- **Momento:** antes e ao vivo.
- **Custo/limite:** divide as 3 trocas da tática (ou tem as suas 3). Focar num lado deixa o outro vazio na volta.
- **Contra-jogo:** a IA rival (M10) dobra a marcação no lado ou no craque depois de alguns minutos.
- **Motor:** peso no `bestPass` e no `bestSupportSpot` do `ai-controller`. `ENGINE_VERSION`.
- **Equilíbrio:** efeito difícil de ver em 8x; risco de ser decisão "invisível" (a pior que existe). Medir só se a
  diferença aparece nos gráficos de posse por lado.
- **UI:** 4 botões ou um mini campo de 3 faixas.
- **Ref.:** EA FC (dynamic tactics), FM (focus play).
- **Tamanho:** P/M.

### M12. Trocar o capitão no jogo

- **Como funciona:** passa a braçadeira (aura +3/+6%) pra outro em quadra; útil quando o capitão sai ou quando entra quem
  é do tipo do time. Ex.: o capitão saiu cansado; a braçadeira vai pro Lapras pra ligar a aura de Água.
- **Momento:** bola parada (junto com a troca).
- **Custo/limite:** 1 por partida; a barra do golpe máximo (M4) zera ao trocar.
- **Contra-jogo:** pouco.
- **Motor:** `setup.captainUid` vira estado do time; `refreshTeamBonuses` já recalcula. `ENGINE_VERSION`.
- **Equilíbrio:** desprezível. Faz sentido **só com a M4**; sozinha é decisão sem sabor.
- **UI:** opção no painel do Pokémon.
- **Tamanho:** P.

### Ideias avaliadas e deixadas de fora

- **Cobrador de falta / tiro livre:** o motor não tem faltas; criar faltas (6ª falta acumulada do futsal, tiro livre de
  10 m) é feature grande à parte e mexe no ritmo. Guardar pro Futebol de campo ou pra 0.9+.
- **Ver a tática do rival custando algo:** a tática do rival já aparece no VERSUS e no Lineup; esconder agora seria tirar
  informação. A leitura boa vem da M10 (avisar a intenção), não de esconder.
- **Pausa ativa livre (pausar e dar ordens à vontade):** vira microgerenciamento e quebra o Duelo. O Pedido de tempo é a
  versão com custo.
- **Previsão de resultado / "chance de gol"**: vaza a partida pré-calculada da Copa. Fora.
- **Aposta pré-jogo** (estilo snap do Marvel Snap: "ganho por 2+" vale recompensa dobrada): boa, mas é economia da copa,
  não agência na partida. Anotar pra Copa do Dia.

---

## 4. Ranking

Nota de 1 a 5 (Custo: 5 = barato). Diversão = "dá vontade de apertar e dá pra ver o efeito". Estratégia = "tem escolha
certa e errada que depende da situação".

| # | Mecânica | Diversão | Estratégia | Custo | Total | Encosta em "jogar"? |
|---|---|---:|---:|---:|---:|---|
| 1 | M1 Pedido de tempo | 3 | 4 | 5 | **12** | não |
| 2 | M3 Goleiro-linha | 5 | 4 | 3 | **12** | não |
| 3 | M7 Pênaltis com decisão | 4 | 3 | 5 | **12** | não |
| 4 | M4 Golpe máximo do capitão | 5 | 4 | 2 | **11** | pouco |
| 5 | M2 Gritos do técnico | 4 | 4 | 3 | **11** | não |
| 6 | M6 Segurar a evolução | 4 | 3 | 4 | **11** | não |
| 7 | M10 Rival que reage | 3 | 5 | 3 | **11** | não (é contra-jogo) |
| 8 | M8 Bolsa do treinador | 4 | 3 | 2 | 9 | não |
| 9 | M5 Instrução individual | 3 | 4 | 2 | 9 | um pouco |
| 10 | M12 Trocar o capitão | 2 | 2 | 5 | 9 | não (só com a M4) |
| 11 | M9 Chamar o golpe | 4 | 3 | 2 | 9 | **sim** |
| 12 | M11 Foco da jogada | 2 | 3 | 3 | 8 | não, mas é invisível |

### As 3 que eu faria primeiro na 0.8.x

1. **Pedido de tempo + Gritos (M1 + M2) como um pacote "beira da quadra".** É o que conserta o 8x: dá ao jogador rápido
   um momento pra decidir, com custo (1 por tempo, 3 gritos). Reaproveita o painel do intervalo, os `Buff`s e o caminho
   das ordens. Também dá ao Duelo uma camada nova de leitura (o grito do rival aparece e você responde).
2. **Goleiro-linha (M3).** É futsal de verdade, é uma decisão de risco clara (todo mundo entende "gol vazio"), gera
   viradas e gols (diversão > realismo) e cabe num botão. Nenhum jogo de técnico popular faz isso: é assinatura do
   Soccermon.
3. **Golpe máximo do capitão (M4).** É o "momento" Pokémon que falta (Unite, Z-Move, Tera): dá peso à escolha do capitão,
   cria o lance que vira clipe (casa com os melhores momentos da 0.8.8) e o Miguel já tinha listado no `jogo-gostoso.md`.

**De brinde, baratas e já certas:** M7 (pênaltis, P) e M6 (segurar a evolução, P) podem entrar como "consertos de
agência" em qualquer 0.8.x, porque quase não mexem no equilíbrio.

**Logo depois:** M10 (rival que reage). Sozinha não dá botão novo, mas sem ela as outras viram receita fixa na Copa
("sempre goleiro-linha aos 37' perdendo"). Casa com a 0.8.9 (treinadores e quadras) e com os ginásios com personalidade.

**Deixar pra depois de ver os dados:** M9 (chamar o golpe; mais perto de jogar) e M11 (foco; efeito invisível em 8x).

### Regra pra não virar "sempre clique"

Toda mecânica precisa passar nos 4 testes antes de ir pro ar:

1. **Custo visível:** recurso contado (3 gritos, 1 tempo), risco claro (gol vazio) ou lado ruim (fôlego).
2. **Efeito visível em 8x:** ícone, brilho, narração ou câmera lenta. Se só muda um número escondido, não entra.
3. **Sem decisão dominante:** com o técnico robô, nenhuma política simples ("sempre grita Pra cima aos 30'") ganha mais
   de +4 pontos em todas as situações.
4. **Quem não usa não é punido:** o robô "nunca usa" perde no máximo ~5 pontos de vitória pro "usa bem". O jogo
   continua jogável em 8x sem tocar em nada.

### Como medir (vale pra todas)

- **Passo zero (P, sem motor):** incluir no `match_end` (`src/analytics/track.ts`) quantas ordens o técnico deu e de que tipo
  (`orders`, `tactic_changes`, `subs`, `boards`). Hoje não sabemos se alguém mexe na tática ao vivo. Uma semana de dados
  diz se o problema é "não tem o que fazer" ou "ninguém vê os botões".
- **Técnico robô** em `scripts/balance/coach.ts`: gera agendas de ordens pra `runMatch` com 3 políticas (nunca, aleatória,
  regra boa) e mede vitória, gols por jogo, goleadas e viradas. Roda em cima do `cup.ts` pra curva da copa.
- **`npm run calibrate`** continua sendo o termômetro geral: gols por jogo (~6,6–7,2), favorito 60–65%, goleadas < 3%.
- **Diversidade de capitães** (`1/Σp²`) antes e depois da M4.
- **No ar:** uso de cada mecânica por partida, vitória de quem usou x não usou (com cuidado: viés de quem é melhor), e o
  funil (não pode piorar o "jogou a 1ª partida").

---

## 5. Decisões do Miguel (recomendação primeiro)

Equilíbrio é sempre dele, com antes/depois. Perguntas curtas:

1. **Quais 3 entram na 0.8.x?** Recomendo Pedido de tempo + Gritos, Goleiro-linha e Golpe máximo do capitão; pênaltis e
   segurar a evolução de brinde.
2. **Pedido de tempo recupera fôlego?** Recomendo sim, pouco (+5%), pra ter motivo de pedir mesmo sem trocar.
3. **Quantos gritos e quais?** Recomendo 3 por jogo, 4 opções (Pra cima, Fecha a casinha, Calma, Abafa), 2–3 min cada.
   Números finais com o robô.
4. **Goleiro-linha liberado quando?** Recomendo só no 2º tempo, sem limite de vezes (o risco já é o custo).
5. **Golpe máximo: o que enche a barra?** Recomendo desarme, defesa, chute no gol e golpe certo, mais rápido perdendo;
   1 por partida; ~0,3 gol de valor médio.
6. **Evolução: padrão quando o jogador não faz nada?** Recomendo continuar evoluindo sozinha (como hoje) com o botão
   Segurar; a alternativa "esperar o Evoluir" respeita mais o "nada automático", mas vai fazer muita gente em 8x perder a
   evolução.
7. **Rival da Copa passa a reagir (M10)?** Recomendo sim, na 0.8.9 junto dos líderes com personalidade, recalibrando a
   curva da copa.
8. **Instrução individual e chamar o golpe:** recomendo esperar os dados do passo zero e do pacote 1 antes.
9. **Duelo:** as mecânicas novas entram no Duelo já na mesma versão (mesmo caminho das ordens) ou só na Copa primeiro?
   Recomendo Copa primeiro, Duelo na versão seguinte (dá tempo de ver o equilíbrio).
10. **Posso fazer o passo zero (contar ordens no `match_end`) já?** Recomendo sim, é 1 linha e não mexe na partida.
11. **Plano de jogo** (até 2 regras "se… então…" montadas pelo próprio jogador antes do jogo; ver seção 6) fere o
    "nada automático"? Recomendo permitir, só depois da M10 (mesmo motor de regras), com aviso na narração quando dispara.

---

## 6. Referências

Versão completa (35 referências, 3–6 linhas cada, com "não conferido" onde faltou fonte):
`agencia-referencias.md`. Abaixo, o que cada uma ensina pro Soccermon.

### O que mais pesou na proposta

| Referência | O que ensina | Vira qual mecânica |
|---|---|---|
| **FM, touchline shouts** — cada grito vale ~10 min e trava o próximo; grito errado deixa o jogador "Frustrated". No FM26 os gritos **saíram** por "nunca funcionarem como deviam" e **voltaram** no patch 26.1.0 depois da reclamação, entrando na próxima bola parada. ([Passion4FM](https://www.passion4fm.com/?p=11591), [TheSixthAxis](https://www.thesixthaxis.com/?p=466696), [FM Scout](https://www.fmscout.com/q-33959-Match-shouts.html?n=last)) | O jogador quer o gesto **e** quer ver o efeito; trava após uso evita spam | M2 (com ícone e narração obrigatórios) |
| **FM, Match Plans** — regras "se ganhando por 1 aos 80', fecha" montadas antes ([footballmanager.com](https://footballmanager.com/node/506)) | Tira o ajuste repetitivo de todo jogo | ideia "Plano de jogo" (abaixo) |
| **FM, opposition instructions / man-marking** — "toda ação tem reação": marcar abre buraco ([Passion4FM](https://www.passion4fm.com/football-manager-guide-opposition-instructions/), [FM Scout](https://www.fmscout.com/a-man-marking-guide-for-fm20.html)) | Instrução individual com custo embutido | M5 |
| **FM, team talks** — só em pausas naturais ([FM Scout](https://www.fmscout.com/team_talks.htm)) | Decidir parado, não com a bola rolando | M1 |
| **EA FC, game plans** — 4 presets montados antes; Ultra Attacking "deixa espaço atrás e gasta condição"; pressão só em rajadas ([EA oficial, FC Mobile](https://www.ea.com/nl/games/ea-sports-fc/fc-mobile/news/fcm27-game-plans-deep-dive), [Red Bull](https://www.redbull.com/gb-en/fifa-19-dynamic-tactics-tips-guide)) | Escolher no jogo entre o que se preparou; risco legível | M2 (Abafa), M3 |
| **Pokémon, Mega/Dynamax/Tera/Z** — uma vez por batalha; a decisão é **quando e em quem** ([Serebii](https://serebii.net/swordshield/dynamax.shtml), [Smogon](https://www.smogon.com/articles/dynamax-potential-part1), [PlayNews](https://www.playnews.gg/en/guides/pokemon-champions-complete-guide-to-special-mechanics)) | O maior momento é raro e preso a um portador | M4 |
| **Pokémon Unite** — a barra enche mais rápido acertando e pontuando; soltar é do jogador ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Unite_Move)) | Carga premia jogar bem | M4 |
| **Pokémon Masters, sync move** — contagem coletiva por golpe do time ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Sync_move), [Smogon](https://www.smogon.com/articles/spinoff-spotlight-masters)) | Barra do time, não do indivíduo | M4 (o que enche a barra) |
| **AFK Arena** — combate automático, o jogador só escolhe quando soltar a ultimate; "nem sempre assim que enche" ([LevelWinner](https://www.levelwinner.com/afk-arena-expert-guide-how-to-advance-through-stages-as-fast-as-possible/)) | Timing manual de um recurso que enche | M4, M9 |
| **Clash Royale, elixir** — x2/x3 no fim pra deixar o final mais emocionante ([Supercell](https://support.clashroyale.com/hc/en-us/articles/49484936933403-Elixir), [notas 2019](https://supercell.com/en/games/clashroyale/blog/release-notes/november-update)) | Clímax no fim | M4 (barra enche mais rápido perdendo), M3 |
| **Into the Breach** — tudo telegrafado; "cada morte é culpa sua" ([Game Developer](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-), [80.lv](https://80.lv/articles/gdc-2019-an-inside-look-at-into-the-breach)) | Avisar a intenção do rival transforma reação em plano | M10 |
| **Slay the Spire** — energia como custo e ícone de intenção do inimigo ([Untapped](https://sts2.untapped.gg/guides/how-to-read-enemy-intent)) | Custo por ação + leitura | M2, M10, M8 (poções) |
| **Marvel Snap** — partida curta, poucas decisões pesadas, aposta de confiança ([Kotaku](https://kotaku.com/marvel-snap-ben-brode-round-one-1-stats-cubes-best-tips-1849978932), [MarvelSnapZone](https://marvelsnapzone.com/short-matches-big-decisions-why-marvel-snap-feels-mentally-heavier-than-longer-games/)) | Densidade > quantidade | ranking; "aposta pré-jogo" anotada |
| **Blood Bowl** — risco com chance visível e poucas re-rolagens ([Goonhammer](https://goonhammer.com/hammer-of-math-risk-management-in-blood-bowl)) | Risco legível vira drama | M3 |
| **Auto-battlers (TFT, Pokémon Auto Chess, SAP, Battlegrounds)** — decisão densa antes, luta como revelação; crítica do Battlegrounds: "o combate já está decidido, você só assiste" ([Mobalytics](https://mobalytics.gg/blog/tft/tft-positioning-guide-how-to-get-the-most-from-your-units/), [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess), [Out of Games](https://outof.games/comments/137189)) | O Soccermon já é um auto-battler com pausas; precisa de *alguma* interferência na luta | tese do relatório |
| **Dragon Age: Inquisition** — "a IA joga uma moeda pra obedecer" → microgerenciamento forçado ([GamingBolt](https://gamingbolt.com/dragon-age-inquisition-npcs-intelligence-and-ai-wont-be-dumbed-down)) | Ordem dada tem que ser obedecida e visível | M5, M9 (sempre mostrar que cumpriu) |
| **New Star Soccer / FC Mobile VS Attack / OOTP** — jogar ou decidir só os momentos-chave ([Wikipedia NSS](https://en.wikipedia.org/wiki/New_Star_Soccer), [Fórum OOTP](https://forums.ootpdevelopments.com/showthread.php?p=3400166)) | "Manager calls" grandes e raros | M3, M7 |
| **Retro Bowl** — a metade simulada (defesa) é a parte chata e desequilibrada ([Gfinity](https://www.gfinityesports.com/reviews/retro-bowl-review/)) | Nenhuma fase do jogo pode ser 100% sem decisão | M10, M2 (defender também tem grito) |
| **Club Soccer Director / We Are Football** — falta de feedback do que a decisão causou ([Game Informer](https://gameinformer.com/b/features/archive/2017/08/28/the-sports-desk-taking-control-with-club-soccer-director-2018), [Finger Guns](https://fingerguns.net/reviews/2021/06/10/we-are-football-review-pc-somehow-i-manage/)) | Mostrar o efeito depois ("o grito rendeu 2 desarmes") | todas: linha no resultado |
| **Total War / Kingdom Rush** — habilidade do general com recarga ([manual TW](https://r2encv2.totalwar.com/en/manual/single-player/0085_enc_page_battle_play_phase_conflict_abilities), [Kingdom Rush Wiki](https://kingdomrushtd.fandom.com/wiki/Hero_Spell)); "desperdício deixar parado" vira checklist | Recarga curta demais = obrigação | M2 (recarga longa, 3 por jogo) |
| **Sid Meier, Interesting Decisions (GDC 2012)** — troca, situacional, pessoal, persistente ([Game Developer](https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay), [Filament](https://www.filamentgames.com/blog/sid-meiers-narrative-design-part-one)) | Os 4 testes da seção 4 | regra anti "sempre clique" |
| **RTWP (pausa ativa)** — pausa e despausa engasgada mata o ritmo; câmera lenta é o meio-termo ([GameBanshee](https://www.gamebanshee.com/k3rhc)) | Pausa só com custo | M1 em vez de pausa livre |

### Padrões que se repetem (resumo)

Recurso escasso que se renova ("quando gastar", não "se gastar"); trava depois de usar; uma vez por partida pro maior
momento; preparar antes e escolher no jogo; mudar custa transição visível; risco legível; decidir em pausas naturais;
telegrafar a intenção do rival; delegar sempre possível; jogar só os momentos-chave; feedback depois da decisão.

### Armadilhas citadas pela comunidade

Decisão sem efeito visível (ilusão frágil, mas tirar o botão revolta); "só assistir animação" com resultado já
decidido; IA que desobedece força microgerenciamento; mexer demais piora; ajuste repetitivo vira tarefa; metade do jogo
sem agência fica chata; aleatoriedade sem chance visível parece injusta; gimmick forte demais vira obrigação.

### Ideia extra que saiu da pesquisa: Plano de jogo (decisão do Miguel)

FM Match Plans + gambits do FF XII: antes do jogo o técnico monta até 2 regras "se… então…" (ex.: "ganhando por 1
depois dos 35', Retranca"; "perdendo por 1 depois dos 37', Goleiro-linha"). É o que mais ajuda quem joga em 8x, e é
**escolha dele, não automático do jogo**; mas encosta na regra "nada automático no time do jogador". Pequeno no motor
(gera as mesmas `TacticChange` a partir do estado, como o técnico IA da M10). Ver a pergunta 11 da seção 5.

