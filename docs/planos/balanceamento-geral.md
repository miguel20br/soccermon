---
description: Rascunho e decisões do balanceamento geral da 0.8.4: espécies, golpes, itens e posições.
---

# Balanceamento geral (próximo update, rascunho de 17/10/2026)

Pedido do Miguel: o próximo update é o balanceamento do jogo inteiro (151 Pokémon, golpes, itens, habilidades,
tipos, formações, táticas, sinergias, copa e draft). Regras de sempre: diversão > realismo, números de antes e
depois e o ok dele antes de aplicar.

## Método (pesquisa com Clash Royale, Smogon, Riot/TFT, Hearthstone BG, Slay the Spire, Balatro, EA FC)

**Meta: todo Pokémon tem um lugar.** Não é todo mundo com 50% de vitória: raro forte de nicho pode ficar; o que
sai é a presença universal (o caso do Freeze no Clash Royale: 50% de vitória, mas em todo deck, e o jogo fica
chato).

### Métricas

Ao vivo (`game_events`):
- taxa de oferta e **taxa de escolha quando oferecido** (o piso no 1 de 3 é 33%);
- **Δ de título**: chance de título com a espécie no time menos a média, comparando com quem viu a carta e passou
  no mesmo estágio (evita o viés de quem chega longe ver mais carta rara);
- **presença**: % dos times campeões, % de capitão, minutos em quadra;
- **diversidade**: número efetivo de capitães e de campeões (1/Σp²). Se cair entre patches, o jogo está
  homogeneizando.

Simulação (`calibrate` e scripts de auditoria):
- **teste de troca**: tirar o Pokémon e pôr um genérico da mesma nota mostra quanto ele vale de verdade;
- **nota × impacto**: se o impacto simulado foge muito da nota, a carta mente (quebra "carta = campo");
- mesmo teste pra golpes, itens, habilidades, sinergias e aura, incluindo as combinações.

### Faixas (adaptadas; nenhum jogo de draft publica as suas)

| Métrica | Saudável | Agir |
|---|---|---|
| Escolha quando oferecido | 15–60% | < 10% (nunca pego) ou > 70% (sempre pego) |
| Δ de título | ±5 pontos | fora disso, com 200+ copas |
| Capitão | até ~20% das copas | Dragonite em 50% é outlier |
| Presença nos campeões | até ~25% | acima, mesmo com Δ ok |

### Tamanho do patch

- 3 a 6 mudanças por patch, quase todas buffs no fundo da tabela (combina com "número sobe"); nerf só pros 1–2 do
  topo.
- Passos pequenos: 1–3 de nota ou 5–10% num efeito. Esperar um ciclo de dados antes de mexer de novo na mesma
  peça.
- Não mudar a função central de uma carta (gatilho de evolução e golpe assinatura ficam).
- Notas do patch: "antes ⇒ depois", uma linha de porquê, grupos Buff / Nerf / Ajuste com setas desenhadas (sem
  emoji) e uma marca nas cartas que mudaram.

### Armadilhas

Amostra pequena (lendários aparecem pouco: exigir N mínimo), viés de seleção, efeitos ligados (mexer num afeta
outro: sinergia, aura e item empilham), power creep ou achatamento, público diferente (iniciante × veterano, 8x),
e simulação não é diversão (conferir olhando partidas).

## Dados (17/10/2026: ~32 mil partidas simuladas + 74 copas no ar)

Scripts e tabelas brutas ficaram fora do repo (scratchpad da sessão); números principais:

1. **Táticas:** equilibrada 44%, ofensiva 56%, contra-ataque 53%, defensiva 48%. 85% das partidas no ar são na
   equilibrada (o padrão).
2. **Curva da copa invertida no fim:** vitória por fase na simulação 60 / 59 / **53** / **68**%; no ar 70 / 71 /
   58 / **90**%. A Liga Índigo joga na equilibrada e vira o rival mais fácil (68%) mesmo com a maior nota (83,4).
   Títulos: 26% no ar; 31% das copas acabam nas oitavas.
3. **Nota pesa pouco:** vantagem média +3 → 54%, +6 → 62%, +9 → 61%, +12 → 59%. Efeito de cada ponto no saldo:
   Pivô 0,038, Goleiro 0,016, Ala 0,014, **Fixo 0,000** (a nota do Fixo não muda o jogo).
4. **Formações:** 1-1-2 62%, 2-2 53%, 1-2-1 51%, 4-0 50%, ferrolho 42%, 3-1 42% (títulos: 3-1 só 5%).
5. **Evolução:** quem drafta pela nota quase não evolui (0,16 por copa; meta ~1,2): nenhum raro, épico ou
   lendário evolui.
6. **Cartas fora da curva** (rende acima/abaixo da nota): Tauros +0,89, Aerodactyl +0,71, Mewtwo +0,56, Scyther
   +0,51, Snorlax GK +0,48; Electrode −0,56, Kingler −0,56, Jynx −0,53, Gengar −0,41, Dragonair −0,35. Dragonite
   joga o que a nota promete (−0,06); capitão em 13% no ar (os 50% eram do 1º dia). Ditto (carta 44) joga como
   Ala ~85. Lendário 89,6 de média contra épico 81,0 e raro 81,2.
7. **Golpes mortos:** Dream Eater 0 usos em 6.639 jogos; Softboiled, Bone Club, Petal Dance, Horn Drill,
   Submission, Body Slam quase nunca. Hitmonlee: time vence 37%.
8. **Itens e habilidades quase não aparecem em campo:** habilidades ~0 no saldo; só Leftovers dá algo.
9. **Sinergias de história:** Gênese +0,86 e Pássaros +0,76; Brock, Rocket e Hitmon ~0. Tipo: Rock melhor,
   Dragon pior (−0,63).
10. **Draft:** 22% dos drafts têm uma rodada com 3 bronzes; sobram 1,66 rerolls por copa.

Limites: o jogador simulado escolhe sempre a maior nota, joga na equilibrada e não usa MT.

## O patch (aprovado como estrutura em 17/10)

A parte de balanceamento do próximo patch são 3 blocos, nessa ordem, cada um com tabela de antes e depois pro ok
do Miguel:

1. **Regras:** as 4 táticas entre 47% e 53%; curva da copa crescente (oitavas ~75–80%, final ~50–55%, Liga Índigo
   como chefe final); a nota do Fixo contando em campo; 3-1 e ferrolho viáveis.
2. **Economia:** evolução que aparece (carta mostra a nota depois de evoluir; draft oferece mais quem evolui); piso
   de nota (cada rodada com pelo menos uma prata).
3. **Cartas e golpes:** ~8 Pokémon fora da curva (quase tudo buff; Tauros e Aerodactyl descem um pouco), golpes
   que nunca saem passam a sair, itens e habilidades com efeito visível.

## Bloco 1 (regras): aprovado pelo Miguel em 17/10

Branch `teste-084` (vai pro ar junto com a 0.8.4). Fixo vira a cobertura (fica entre atacante e gol) e o
posicionamento pesa 5x mais em corte e bloqueio; bônus das táticas refeitos; 3-1 e ferrolho marcam mais à frente,
1-1-2 recua; copa com rival "estreante" nas oitavas e itens do rival 0/1/1/3.

| | Antes | Depois |
|---|---|---|
| Táticas (equil./ofens./defens./contra) | 45,6 / 51,6 / 50,4 / 52,4% | 48,9 / 48,7 / 50,6 / 51,8% |
| Saldo por ponto de nota do Fixo | 0,000 | 0,015 (Ala 0,013) |
| Copa por fase (oitavas → final) | 60 / 59 / 53 / 68% | 74 / 67 / 55 / 50% |
| Título | 13% | 14% |
| Formações (1-2-1, 2-2, 3-1, 1-1-2, ferrolho, 4-0) | 47 / 53 / 49 / 58 / 42 / 50% | 50 / 48 / 52 / 54 / 50 / 46% |
| Gols por jogo / favorito vence / goleadas | 7,16 / 65,3% / 2,8% | 6,80 / 64,2% / 1,8% |

Na borda, aceito: contra-ataque × equilibrada 57%, 4-0 em 46%, semifinal 55% (meta 58%).

## Bloco 2 (economia): aprovado pelo Miguel em 17/10

Draft do jogador (`playerDraftOptions` em `src/engine/draft.ts`; rival e recompensas sem mudança): piso de prata
(3 bronzes na vaga → a mais fraca vira uma prata que joga ali) e promessa em toda rodada (nenhuma opção vira ouro
ao evoluir → entra uma que vira). Limiar de evolução 15 → 14. A carta mostra a nota depois de evoluir naquela vaga
(seta desenhada, verde ou vermelha; `evolvedRating` em `src/engine/evolution.ts`).

Simulado "Nota" escolhe a maior nota; "Evo" escolhe pela nota depois de evoluir.

| | Antes | Depois |
|---|---|---|
| Evoluções por copa (Evo / Nota) | 0,82 / 0,20 | 1,21 / 0,25 |
| Copas com 1+ evolução (Evo) | 56% | 68% |
| Drafts com uma rodada só de bronze | 22% | 0% |
| Copa por fase, Nota (oitavas → final) | 74 / 67 / 55 / 50% | 74 / 67 / 57 / 52% |
| Título (Nota / Evo) | 14% / 13% | 15% / 13% |
| Gols por jogo / favorito vence | 6,80 / 64,2% | 6,83 / 64,2% |

Raro, épico e lendário não evoluem porque nenhum tem evolução no jogo. Quem só pega a maior nota continua quase
sem evoluir: o selo é o que mostra que vale apostar.

## Bloco 3 (cartas e golpes) e auditoria de posições: aprovados pelo Miguel em 17/10

- A lista de cartas fora da curva da 1ª auditoria era quase toda ruído (128 jogos por espécie: correlação 0,27 com a
  antiga). Cada carta mexida foi confirmada com 384 jogos (erro ±0,16).
- Goleiro passa a usar golpe (defesa com o golpe de ataque, suporte); Dream Eater, Soft-Boiled e Bone Club com regra
  nova. Usos por jogo dos golpes mortos: 0–0,05 → 0,19–0,60.
- `SPECIES_TUNING` (`src/engine/attributes.ts`): pontos em atributo que a nota da posição não usa (Pinsir, Flareon,
  Electrode, Jynx, Pikachu); nerf leve em Tauros e Aerodactyl (sem efeito medível: fica, olhar os dados no ar).
- Habilidades 1,5x (+5% → +8%), as sem efeito ganharam um; nome da habilidade sobe na quadra. Fica assim.
- Auditoria de posições: 28 suspeitos revisados em `?lab=posicoes&revisao=1` (25 ok, Mr. Mime/Beedrill/Onix mais
  fortes que a sugestão), Metapod goleiro +1, regra da serpente (porte só pelo peso) e **a evolução herda a vaga**
  (`PokemonInstance.inherited`).
- Calibrate com tudo junto: 6,64 gols/jogo, favorito 67,5% (meta 60–65; ±3 de erro), goleadas 2,8%.
- **Para um patch próprio:** a nota do Ala não conta chute e a do Pivô não conta velocidade, mas o motor usa os dois.
  É a causa da maioria dos fora da curva; mexer nas fórmulas muda a nota de todo mundo.

## Bônus de evolução: aprovado pelo Miguel em 18/10

Pedido dele: pegar carta pra evoluir tem que valer mais que pegar a pronta. Cada evolução da carta dá **+2 em todos
os atributos** (`EVOLUTION_BONUS` em `src/engine/instance.ts`, campo `PokemonInstance.evolved`, linha "Evoluiu: +N
em tudo" na regra única de `modifiers.ts`). Charmander que vira Charizard: 89 contra 85 do Charizard pronto.

| Draft (copa simulada, 300 copas cada) | Títulos antes | Títulos depois |
|---|---|---|
| Pela nota de agora | 18% | 17% (ruído ±2) |
| Mirando evolução | 14% | 17% |

Quem draftou mirando evolução: oitavas 66% → 62%, semi 55% → 66%, final 60% → 68%. O rival que evolui no meio da
partida também ganha o bônus. `ENGINE_VERSION` 3.

## Fórmula A: aprovada pelo Miguel em 19/10

A nota do Ala passa a contar chute e a do Pivô, velocidade (o motor já usava os dois). Ala: velocidade 25, drible 25,
passe 20, chute 15, fôlego 15. Pivô: chute 30, força 30, drible 15, posicionamento 15, velocidade 10. Dragonite segue
Pivô (90 ⇒ 89; `SPECIES_TUNING` goleiro −5, desarme −6, chute +4, força +2). Proposta, tabelas e ressalvas em
[patch-formula.md](patch-formula.md). `ENGINE_VERSION` 4.

| Exemplo | Antes | Depois |
|---|---|---|
| Jolteon | Ala 92 | Ala 88 |
| Alakazam | Ala 87 | Ala 83 |
| Electrode | Ala 84 | Ala 80 |
| Pikachu | Ala 66 (prata) | Ala 63 (bronze) |
| Tauros | Pivô 75 | Pivô 77 |
| Kingler | Pivô 78 | Fixo 78 |
| Rapidash | Ala 83 | Pivô 82 |
| Mr. Mime | Ala 80 | Goleiro 77 |
| Dragonite | Pivô 90 | Pivô 89 |

Calibragem (400 partidas): 6,84 gols por jogo (meta 5–7), favorito vence 62,6% (meta 60–65%), goleadas 1,8%.

## MTs mais fortes: aprovado pelo Miguel em 21/10 (opção B + A nas 3 piores), ENGINE_VERSION 10

Queixa: ele "quase nunca fica em dúvida entre pegar" a MT. Medido: a MT saía 0,40 vez por partida e ensinar não mudava a
vitória (+0,5 ±2,4 pp, 1600 pares). Regra em `src/engine/modifiers.ts` (`TAUGHT_MOVE`, carta = campo); dados em
`src/engine/data.ts` (`MOVE_DATA_TUNING`). Vale também pras MTs do rival da copa (`equipRivalTms`).

| O quê | Antes ⇒ depois |
|---|---|
| Golpe treinado (ensinado por MT) | +1 uso, força x1,3, a IA escolhe ele primeiro, selo MT onde o golpe aparece |
| Mega Drain / BubbleBeam (poder) | 40 ⇒ 100 / 65 ⇒ 100 |
| Fissure (acerto) | 30% ⇒ 50% |

MT ensinada × não ensinada (mesmo time, mesma seed, 200 pares por MT, ±2σ):

| MT | usos/jogo antes ⇒ depois | Δ vitória antes | Δ vitória depois |
|---|---|---:|---:|
| Bide | 0,96 ⇒ 1,86 | −1,0 ±8,0 | −1,5 ±8,3 |
| BubbleBeam | 0,28 ⇒ 0,63 | 0,0 ±7,1 | +4,0 ±7,5 |
| Thunderbolt | 0,27 ⇒ 0,56 | +1,5 ±5,8 | +1,0 ±6,6 |
| Mega Drain | 0,28 ⇒ 0,71 | −1,0 ±5,8 | 0,0 ±5,5 |
| Toxic | 0,65 ⇒ 1,19 | +1,5 ±7,2 | +6,0 ±7,8 |
| Psywave | 0,23 ⇒ 0,58 | +2,5 ±6,1 | −3,0 ±6,8 |
| Fire Blast | 0,35 ⇒ 0,63 | −2,5 ±6,9 | −0,5 ±6,9 |
| Fissure | 0,20 ⇒ 0,39 | +3,0 ±6,6 | −1,5 ±7,3 |
| **Todas** | **0,40 ⇒ 0,82** | **+0,5 ±2,4** | **+0,6 ±2,5** |

O uso dobrou; o efeito na vitória continua dentro do ruído (um golpe a mais por partida pesa pouco num jogo de ~300
passes). Nenhuma MT ficou dominante (a maior, Toxic +6, está dentro do erro). Calibrate n=200: gols/jogo 7,72 ⇒ 7,88,
favorito 66,7% ⇒ 68,8% (ruído; o draft da IA não ensina MT). Formações (n=200): nenhuma mexeu mais que 2 pp
(1-2-1 51/51, 2-2 50/50, 3-1 47/47, 4-0 50/51, 1-1-2 50/50, Ferrolho 53/51). Copa (360 copas, rival com MT): oitavas
78% ⇒ 76%, quartas 70% ⇒ 65%, semi 59% ⇒ 61%, final 55% ⇒ 52%, título 18% ⇒ 16% (erro de ~±4 pp no título).

## Golpe máximo: zona por posição, aprovada pelo Miguel em 22/10 (0.9.6, ENGINE_VERSION 10)

Pivô 15 m, ala 18 m, fixo 22 m (xG mínimo 0,05 no fixo; `AGENCY.maxZone`). Hora certa por capitão: pivô 62% ⇒ 62%, ala
34% ⇒ 88%, fixo 6% ⇒ 67% das partidas. Técnico robô (n=400): golpe máximo random +1,3 ⇒ +1,8 pp, good +2,5 ⇒ +3,5 pp
(dentro do erro). Números, copa com o técnico IA do rival e ressalvas em [beira-da-quadra-2.md](beira-da-quadra-2.md).

## N3 quase indefensável: aprovado pelo Miguel em 26/10 (0.9.24, ENGINE_VERSION 14)

Pedido dele: "o nv3 devia ser quase indefensável". Medido com `POL=n3 MAXTIPO=1 scripts/balance/maximo-tipo.ts 400`
(~140 chutes N3, ±4 pp). A defesa máxima do goleiro rival continua parando o N3 (decisão 2 dele: "quase", não "sempre").

| | Antes | Depois |
|---|---|---|
| `maxAim` | 0,6 | 0,35 |
| N3 `accuracy` | 2 | 3 |
| N3 `save` / `block` (novos) | 1 / 1 | 0,15 / 0,15 (perfeito; bom 0,4, fora 0,66) |
| Gol / fora / defesa / bloqueio / trave | 57 / 17 / 13 / 5 / 6% | 82 / 4 / 6 / 1 / 5% |

O calibrate não mede (o robô não aperta o botão); efeito estimado de +0,1 gol/jogo pra quem guarda o N3. O rival da
copa também usa N3: vale igual contra o jogador.

## Monotipo e times dos líderes (04/11/2026, motor 24)

Aprovado pelo Miguel ("o teto tem que ser removido", "apoio G1 a G6"; números da sinergia delegados a mim).

| O quê | Antes | Depois |
|---|---|---|
| 5 do mesmo tipo em quadra | +10% | Monotipo +12% |
| 6 do tipo no elenco (5 + 1 reserva) | — | +16% |
| 7 do tipo no elenco | — | +22% |
| Teto tipo × história | +15% | sem teto |
| Líder de ginásio (e Final) | sem mínimo do tipo | 4 dos 5 titulares do tipo (Rota segue 3) |
| Capitão do líder | melhor nota | melhor do tipo (a Final, elite, segue a melhor nota) |
| Fora do tipo (ginásio e Rota) | qualquer um | sem contra-tipo nem lendário (Final livre) |
| Oitavas | dificuldade -1, sem item | -2 (pior das opções) e 1 item |

Time monotipo contra time do mesmo nível (8 tipos × 200, ±1,2 pp; o monotipo sai 1,3 de nota mais fraco): +10% 54%,
+15% 60%, +20% 65%, +25% 70%. Copa por fase (600 copas, `scripts/balance/cup.ts`, ±2–4 pp): antes 73/64/54/42%,
título 11%; depois 81/58/51/60%, título 14%. Ressalvas: a final ficou acima da meta (50–55%) e as quartas abaixo;
a Rota não foi medida por fase.

## Capitão chamado (05/11/2026, motor 26)

Relatos de "N3 não chuta": o golpe chamado num ataque esperava o capitão chutar da zona. N3 chamado saindo em até 30 s
(116 casos): 54% ⇒ 86%; mediana entre os que saíram de 4–10 s ⇒ 4–6 s (amostra em oitavos, conta grossa). Jogador que chama em todo ataque, toque bom (240 partidas, ±3 pp):
V/E/D 52/16/32 ⇒ 62/10/28, gols 4,40 x 3,70 ⇒ 4,94 x 3,90, golpes por jogo 2,74 ⇒ 3,44. Quem puxa o ganho é a condução,
não o passe (só a condução: 63/10/28). `calibrate --agencia` igual: o técnico IA só usa a hora certa.

## Torcida a favor (05/11/2026, motor 27)

Miguel: menos zebra contra o jogador no PVE, x1 equilibrado. Aprovado: rival evolui com 14 (era 10), `crowd` −4% na Copa e na
Rota, −7% nas 3 primeiras da Rota, visível no painel do rival, Time Ultimate de fora.

Real, 14 dias: Copa 77/74/62/59%, Rota 52/57/56/61/63/60/68/71%, título 20% nas duas (quase tudo antes da 0.9.42).

| Simulação | Antes | Depois |
|---|---|---|
| Só as regras, robô fixo (2.000 partidas, ±2,2 pp), geral | 59% | 67% |
| Mesma medida, time 0–4 / 5–9 / 10–14 / 15+ melhor | 51/59/63/81% | 64/62/75/88% |
| Copa inteira, 600 copas, robô da nota | 81/58/51/60%, título 14% | 85/70/60/67%, título 24% |
| Rota inteira, 200 rotas | 53/47/57/51/43/53/55/68%, título 14% | 68/61/66/65/49/51/57/64%, título 22% |

Ressalvas: o grupo do Planalto segue perto de 50% e a final da Copa passa da meta antiga (50–55%).

Barra de evolução (robô, 600 copas por linha): 14 ⇒ 12 ⇒ 10 quase não muda. Robô da nota 0,36 ⇒ 0,38 por copa; robô que escolhe
quem evolui 1,95 ⇒ 2,15 ⇒ 2,35. Real na Copa: 0,63 por copa, 39% das copas com alguma, só 20% das cartas escolhidas ainda
evoluem (estimativa pelo elenco final). A barra segue em 14: o que limita é a escolha no draft.

## Time Ultimate: rival pela força (06/11/2026, motor 27)

Aprovado pelo Miguel: o rival do Time Ultimate mira a força (média × química) e não só a média; sem rival à altura, as
Fichas seguem o nível alcançado. Tabela e ressalvas em [ultimate-team.md](ultimate-team.md) (seção do dia). Não muda o
motor nem a Liga.

## Rota: 1ª derrota sem amarelo, Final sem torcida e um Evento por linha (10/11/2026, motor 27)

Aprovado pelo Miguel (pesquisa em `rota-indigo-2.md`): a derrota na 1ª partida da Rota não dá cartão (`forgivenLoss`), o
rival da Final perde a torcida a favor (era −4%, `crowd` ausente) e toda linha de parada tem um Evento "?". Nada no motor:
o rival é gerado fora dele.

Robô da Rota, mapa largo, 400 Rotas (mesmas seeds; título ±2,3 pp, Final ±3,4 pp):

| | Antes | Depois |
|---|---:|---:|
| Título | 30% | 32% |
| Vitória por partida (1ª..Final) | 63/64/69/60/64/62/61/**73%** | 63/64/66/61/62/62/60/**64%** |
| Eliminado depois da 2ª / 3ª / 4ª partida | 13 / 10 / 15% | 0 / 10 / 17% |
| Eliminado no grupo / perdeu a Final | 21 / 11% | 24 / 18% |
| Chega ao grupo / à Final | 61 / 41% | 73 / 49% |
| Evento "?" por Rota | 0,41 | 0,71 |

Na mesma Final (mesmos times), a torcida em −4% dava 70% de vitória (título 34%); +3% pro rival, 59% (29%); +6%, 49% (24%).

## Motor 29: fixo na armação da 3-1 (aprovado pelo Miguel em 10/11/2026)

Relato de jogador: na Linha de 3 a bola roda entre alas e pivô e nunca volta pro fixo. Causa: `bestPass` castiga passe pra trás (`fwdPass`) e o fixo fica ~8 m atrás dos alas; o pivô ganha `pivotPass` + `longPivot`. Ajuste: `fixoPass: 0.3` só na 3-1; muda só o destino (a decisão passe × drible usa o melhor passe sem o bônus), e não vale logo depois do fixo/parede do pivô tocar. 200 jogos: armações com o fixo 34% ⇒ 51%, passes pro fixo 9% ⇒ 17%, gols 3,6/3,9 ⇒ 3,6/3,8, chutes 18,1 ⇒ 17,6; `calibrate --formations` igual dentro do erro (3-1 47% ⇒ 46%). De olho: 3-1 × Losango 51% ⇒ 42% (400 jogos). Losango com 0,2 fica pra outra rodada. Script: `scripts/balance/fixo-armacao.ts`.

## MT fora da vitrine do Mercado (aprovado no plano "menos e mais", 10/11/2026)

A MT sai da vitrine (fica na recompensa do ginásio, no 1 de 3 e no prêmio da casa da Rota); na vaga entra um item. Mesmas seeds: Copa Relâmpago (2400 copas) título 25,0% ⇒ 25,6% (+0,6 ± 0,9 pp), ₽ no Mercado 11,7 ⇒ 12,3, itens 0,49 ⇒ 0,75 por copa; Rota (400) 13,2% ⇒ 13,5% (+0,2 ± 1,7 pp). Dentro do erro. O robô não usa MT (como 99,6% dos jogadores).
