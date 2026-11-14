---
description: Pesquisa do sistema do Ultimate Team do EA FC 26 e FC 27 (modos, progressão, economia, promoções) e como trazer pro Time Ultimate.
---

# O sistema do Ultimate Team (FC 26 e FC 27) e o nosso Time Ultimate (01/11/2026)

Pedido do Miguel (01/11): "eu queria que você se inspirasse bem mais no sistema do FC" e "quero que nosso jogo seja
realmente um jogo digno de se olhar". Esta frente é o **sistema** (modos, progressão, economia, eventos); o visual
fica com outra pesquisa. Só leitura do repo e da web, **nenhum código mexido**. Base do que já existe: o plano
[ultimate-team.md](../ultimate-team.md) e o código da branch `ultimate` (`src/store/ultimate/`, `src/ui/ultimate/`).

Limites de sempre: sem dinheiro nenhum ([ADR 0006](../../adr/0006-sem-dinheiro-nenhum.md)), sem mercado entre
jogadores, motor determinístico (regra nova de partida sobe `ENGINE_VERSION` e passa pelo ok do Miguel), Supabase
grátis, celular primeiro, nada automático no time do jogador.

## Resumo (o que mais importa)

1. O UT do FC não é "abrir pacote": é **um calendário**. Cada dia, cada semana e cada fase de ~6 semanas têm um
   motivo próprio pra jogar, e cada modo diz antes da partida o que paga. O nosso já tem o dia e a semana; falta o meio.
2. O FC 27 roda **temporadas de 5 a 6 semanas** (T1 17/09–22/10, T2 22/10–03/12), cada uma com passe de 30 níveis e
   teto de 850 pontos por dia. A nossa temporada de 6 meses é o "ano" do FC; dentro dela faltam as **fases**.
3. O nosso passe acaba em ~40 dias jogando no teto, numa temporada de 186 dias: depois do 2º mês ele não tem mais nada.
4. Os modos que mais cabem no Soccermon são **Squad Battles** (contra times reais de outros jogadores, comandados
   pela IA) e **Rivals** (escada semanal). As duas coisas já existem pela metade: os times da Copa do Dia têm o
   time salvo (`squadOf` em `src/league/api.ts`) e a Liga já joga contra fantasma com Elo (`src/league/rules.ts`).
5. O **Rush do FC é 5 contra 5** (goleiro da IA, 7 minutos, sem intervalo). Ou seja: o FC está indo pro nosso
   formato, não o contrário.
6. O **Draft** do FC (escolha 1 de 5 por vaga, 4 jogos eliminatórios) é a nossa Copa. O "escolha 1 de 3" é a nossa
   cara: dá pra usá-lo como prêmio em todo canto do Time Ultimate (é o "Player Pick" do FC).
7. O elogio nº 1 do FC 26/27 são as **Evoluções** (motivo pra entrar todo dia); a gente já fez a melhor versão
   delas, com evolução Pokémon de verdade. Falta a "cadeia" (o que vem depois) e Evolução só pra carta fraca.
8. O FC 27 trocou o desafio de montagem por **pontuação-alvo com entrega parcial** e aceita repetidas. É exatamente
   o formato que serve pra nós, que não temos mercado.
9. As críticas que mais se repetem: sorte de pacote, excesso de conteúdo (100+ cartas de SBC em 2 meses no FC 26),
   promoções que viram uma só, moedas demais (o FC 27 tem 8), Weekend League cansativa, Evolução paga.
10. Recomendação: **Opção B, "Temporada à FC", em etapas**: lança 27/11 como está + "Primeiros passos"; dezembro
    traz Batalhas de Treinador e desafios de montagem; janeiro traz Rivais (escada) e o Platô Índigo de fim de semana.

## O mapa do UT do FC 27

| Modo | Solo ou online | Cadência | Paga o quê |
|---|---|---|---|
| Squad Battles | solo (contra IA com times da comunidade) | semana (fecha domingo) | moedas e SP por partida; prêmio semanal por faixa (Bronze 3 a Elite 1, Top 200); desde o FC 27 também pontos de classificação pro Champions |
| Rivals | online 1x1 | semana (prêmio na quinta), temporada de divisões | moedas e SP por partida; prêmio semanal por divisão (base com 15 pontos, melhorado com 30); pontos de classificação |
| Champions (Weekend League) | online 1x1 | fim de semana | 15 partidas na final; moedas, pacotes, Champions Tokens; entra com 1.000 pontos de classificação |
| Challengers | online | fim de semana | um "Champions" pra quem está no meio da tabela (FC 26) |
| Live Events (Torneios, Gauntlets, Exibições) | solo ou online, alguns co-op | rotativo, em momentos marcados | prêmio por vitórias; regras próprias ("House Rules") e requisito de entrada |
| Rush | online 4 humanos + goleiro IA | semana | pontos de Rush que liberam objetivos semanais |
| Draft | solo ou online | quando quiser (paga entrada) | pacotes e moedas por número de vitórias (0 a 4) |
| Moments | solo | permanente + por promoção | Estrelas, gastas na "Star Gallery" |
| Amistosos / Co-op | contra amigo / em dupla | quando quiser | quase nada (só objetivo) |

Por cima disso: passe da temporada (SP), objetivos diários/semanais/da temporada, marcos por modo, Evoluções, SBCs,
Galeria (FC 27), mercado e loja.

## Os modos, um por um

### Squad Battles

**Como é (FC 27):** joga quantas quiser, mas só **18 partidas por semana contam** pra faixa: 16 contra times da
comunidade, 1 contra o "Featured Squad" (o time de alguém famoso) e 1 contra o Time da Semana. Aparecem **4
rivais por vez**, um de cada faixa (Fácil, Médio, Difícil pela nota do time; o 4º sorteado), e você escolhe a
dificuldade da IA antes de cada jogo. Pontos de batalha = resultado × dificuldade + bônus de desempenho (gols,
chutes no gol, escanteios, sem sofrer gol). Faixas de Bronze 3 a Elite 1, quase todas por percentil, mais o Top 200.
Fecha domingo; prêmio cai ~5 min depois e não expira. FC 27 aumentou as moedas por jogo e passou a dar pontos de
classificação pro Champions.

**Por que o pessoal gosta:** é o modo de quem não quer online. Os rivais são times de verdade de outros jogadores, o
que dá curiosidade ("olha o time desse cara").

**Pro Soccermon (Batalhas de Treinador):** é o modo que mais encaixa e quase não pede servidor.
- **Rivais:** os times da Copa do Dia já ficam salvos no ranking (5 titulares + capitão, `squadOf` em
  `src/league/api.ts`). Viram "treinadores" que você enfrenta com o seu Time Ultimate, montados como o modo monta
  hoje (`ultimateRival` em `src/store/ultimate/ultimate.ts`). Sem internet: os clubes de ginásio de hoje.
- **Semana:** 14 partidas que contam (12 treinadores + 1 "Time do Líder" + 1 "Time da Semana"), 4 por vez.
- **Pontos:** resultado × nível (os 4 de `LEVELS` em `rules.ts`) + gols, defesas e golpe especial que entrou. Tudo
  sai do resumo que a partida já devolve (`countObjectives` usa o mesmo).
- **Faixas fixas** (não percentil) até existir ranking de verdade; com ranking, percentil igual o FC.
- **Não copiar:** prêmio por percentil logo no começo (com pouca gente, a faixa pula muito); jogar sem limite pagando
  pontos (vira fazenda; fora das 14, paga só Fichas).

### Rivals

**Como é:** divisões 10 → 1 e Elite. Cada divisão tem estágios; vitória sobe 1 estágio, 2 vitórias seguidas
começam a sequência e sobem mais rápido, empate segura, derrota pode descer. **Checkpoints** seguram a sua posição;
no FC 26 viraram **checkpoints limitados**, que quebram depois de algumas derrotas (3 a 5 nas divisões de baixo, 2
na Elite, pelos guias) e aí você cai. Pontos da semana: 3 vitória, 1 empate, 0 derrota; **15 pontos dão o prêmio
base, 30 o melhorado** (passou de 30 não ganha mais). Prêmio na quinta, pela divisão em que você está. FC 26 trouxe
**Bounties** (desafio sorteado pro próximo jogo: "faça o 1º gol", "ganhe por 2", "não sofra gol") e Duels (os dois
lados com o mesmo Bounty, só um leva). FC 27: diferença maior de prêmio entre divisões, mais moedas, todo pacote
negociável, Bounty mais frequente.

**Por que funciona:** a escada é **visível** (você vê o estágio subir a cada vitória) e a semana tem um teto claro
(10 vitórias e pronto). O checkpoint tira o medo de jogar.

**Pro Soccermon (Rivais do Time Ultimate, janeiro):** a Liga já faz o difícil: partida contra o time salvo de outro
jogador, refeita na Edge Function `liga` com a mesma seed (`src/engine/league.ts`, `pickGhost`, `eloAfter`). A receita
do time (`DuelMonRecipe` em `src/engine/duel-validate.ts`) já leva `evolved` e `special`, então a carta evoluída
do Time Ultimate cabe sem mudar formato.
- **Escada visível por cima do Elo escondido:** o Elo continua escolhendo o fantasma; o que o jogador vê é a escada
  (6 divisões + a Elite dos Quatro, de 3 a 5 estágios cada). Hoje a Liga mostra só Elo e 4 divisões por faixa de Elo
  (`DIVISIONS`): funciona, mas não dá a sensação de "subi um degrau".
- **Semana com 15/30 pontos** (o mesmo 3/1/0), prêmio na segunda de Brasília pela divisão.
- **Desafio do jogo** (o Bounty): sorteado do `Rng` do servidor, pago no apito; só objetivo, não muda regra.
- **Checkpoint limitado** a cada divisão (quebra com 3 derrotas).
- **Não copiar:** Duels (precisa de dois jogadores ao mesmo tempo); prêmio negociável (não há mercado).

### Champions / Weekend League

**Como é:** entra quem junta **1.000 pontos de classificação** (no FC 27 vêm de Rivals e Squad Battles; caiu a
exigência de estar na divisão 6). Final de **15 partidas** no fim de semana (já foi 30 até o FIFA 22, depois 20).
Prêmio por número de vitórias, mais Champions Tokens que compram cartas, Evoluções e comemorações na loja de tokens.
FC 26 tirou os Playoffs (a fase de classificação de quinta) e criou o **Challengers** pra quem está no meio.

**O que a comunidade acha:** é o modo de mais prestígio e o mais odiado pelo cansaço; cada redução de partidas foi
comemorada.

**Pro Soccermon (Platô Índigo, janeiro ou depois):** o nome da Gen 1 pro campeonato é o Platô Índigo.
- **Entrada:** 1.000 pontos de classificação, que saem dos Rivais e das Batalhas de Treinador.
- **Fim de semana, 7 partidas** contra fantasmas de quem também entrou, assíncronas (joga quando quiser entre sexta
  e domingo). Prêmio por vitórias (0 a 7) e o título "Campeão do Platô" no Perfil (`title-codes.ts`, `medals.ts`).
- **Não copiar:** 15 partidas, horário fixo, loja de tokens (moeda nova).

### Live Events (Torneios, Gauntlets, Exibições)

**Como é (FC 26/27):** um "Event Hub" mostra o que está aberto, a regra de entrada (objetivo cumprido, divisão de
Rivals, X cartas de um clube/liga/nação, nota mínima, química mínima, posição), o prêmio e o progresso. **House
Rules:** Clássico, Química Máxima, Primeiro a X Gols, Bola Misteriosa, Sem Regras, Só de Longe, Trocas,
Sobrevivência. **Gauntlet:** até 5 jogos, um **time diferente em cada** (até o banco), sem eliminação, mais vitórias
= prêmio melhor (o Ultimate Gauntlet de 3 rodadas volta a cada 2 semanas). **Torneio:** mata-mata em momentos
marcados. FC 27 trouxe eventos solo contra IA (o "Ones We Watched", com dificuldade escolhida e IA mais forte a
cada etapa) e o **Campaign Hub**, que junta tudo da promoção atual (objetivos, SBC, eventos) numa tela.

**Pro Soccermon:** os desafios dos líderes (`GYMS` em `rules.ts`) já são Live Events solo com regra de entrada.
Dá pra ir além sem tocar no motor:
- **Regra de entrada** (time, tipo, metal, nota, química mínima): `gymOk` em `src/store/ultimate/season.ts` já faz.
- **Gauntlet de Kanto:** 3 jogos seguidos, 3 times sem repetir carta. Pede coleção grande; serve pra fase 2 em diante.
- **Torneio de 8 fantasmas** num fim de semana do evento (mata-mata assíncrono, cada rodada um dia).
- **Regras que mexem na partida** (Primeiro a 3, Bola Misteriosa, Sobrevivência): todas são motor, pedem
  `ENGINE_VERSION`, a Edge Function republicada e o ok do Miguel. Deixar pra 2027.
- **Hub do evento:** uma tela com o evento atual, os objetivos dele, o desafio de montagem e o passe dele.

### Rush

**Como é:** **5 contra 5**, goleiro da IA, 4 humanos de linha, 7 minutos sem intervalo, campo menor, prorrogação e
pênaltis, sem substituição, cartão azul (1 minuto fora), saída de bola sorteada no meio. Antes do jogo, **90
segundos** pra montar o time com a regra do evento, com "blocos" opcionais que dão pontos a mais. Pontos de Rush
liberam objetivos semanais. Quem sai no meio pega fila de 15 min a 1 h.

**Pro Soccermon:** a gente já é 5 contra 5; o que vale copiar é a **montagem com blocos** ("leve 2 Elétricos: +20%
de pontos"), que é só regra de objetivo e pode entrar nas Batalhas de Treinador e nos eventos. O cartão azul e a
saída sorteada são motor (ideia pra lista de 2027). O Rush com 4 amigos depende do modo jogável (controlar o
Pokémon), que é visão de longo prazo.

### Draft

**Como é:** paga entrada (15.000 moedas, FC Points ou um Draft Token), escolhe 1 de 5 formações, 1 de 5 capitães e
1 de 5 por vaga; 4 jogos mata-mata; prêmio por vitórias (perder no 1º ainda paga um pouco). As cartas não vão pro
clube.

**Pro Soccermon:** é a Copa. A ponte que já existe (título da Copa = 1 Pacote Mini, até 2 por dia,
`CUP_BRIDGE_DAY_MAX`) é o jeito certo. **Não copiar:** cobrar entrada da Copa, nem levar carta da Copa pro Time
Ultimate (decisão de 20/10).

### Moments

**Como é:** cenas curtas contra a IA ("faça 2 gols de cabeça em 10 minutos"), em histórias temáticas, pagando
Estrelas que compram coisas numa galeria própria.

**Pro Soccermon:** o formato de cena já existe nos `?demo=` (pênaltis, escanteio, evolução, acréscimos). Uma
"Cena do Anime" (Ash x Gary, Misty brava) é ponte pro Modo História de 2027, não pro Time Ultimate agora.
**Não copiar:** a moeda Estrela.

### Amistosos e Co-op

FC 26 tirou as House Rules dos amistosos online (só Clássico). Co-op existe em Squad Battles, Rivals e Rush. Pra
nós: **Duelo com o time do Time Ultimate** (um 4º modo em `DUEL_MODES`, `src/net/duel-state.ts`), já planejado pra
janeiro, com o limite de cartas especiais que o "Time pronto" já tem (`SpecialLimit`). Co-op não cabe sem o modo
jogável.

## Progressão

### Temporada, passe e pontos (Season Points)

**Como é (FC 27):** temporadas de 5–6 semanas, cada uma com **passe de 30 níveis, 1.000 SP por nível** (30.000 no
total; o S1 devolve 2.500 SP nos níveis 11 e 25). Cada partida dá **15 a 100 SP** pelo resultado e modo, com **teto de
850 SP por dia** nas partidas; objetivos dão SP por fora. 30.000 / 850 ≈ 35 dias no teto, numa temporada de 35 a 42
dias. O passe Premium é pago (500.000 moedas ou 1.000 FC Points); o grátis tem cartas, Evoluções e pacotes (o S2
grátis: 8 cartas Heritage, 7 Evoluções, 21 pacotes).

**O nosso hoje** (`PASS_*` em `rules.ts`): passe único de 40 marcos × 150 pontos = 6.000, teto de 150 por dia,
vitória 40. São ~40 dias no teto (~110 jogando 2 por dia) **numa temporada de 186 dias**. Quem joga muito termina em
janeiro e fica 4 meses sem passe; quem joga pouco ainda termina. O FC resolve isso cortando o ano em fases.

**Pro Soccermon (Fases):** a temporada semestral fica (decidido em 01/11). Dentro dela, **4 fases de ~6 semanas**,
cada uma com tema, passe próprio e o evento dela:

| Fase da T1 | Datas (proposta) | Evento |
|---|---|---|
| 1. Pallet | 27/11 a 08/01 | Natal (15/12–05/01) |
| 2. Celadon | 08/01 a 19/02 | Carnaval (8–9/02/2027), ranking do Time Ultimate |
| 3. Saffron | 19/02 a 09/04 | Páscoa (28/03) |
| 4. Indigo | 09/04 a 01/06 | reta final, Platô Índigo |

- Passe da fase: **30 marcos × 150 pontos** (4.500), teto de 150 por dia = 30 dias no teto em ~42 (a mesma folga do FC).
- A carta de abertura (Pikachu, `PASS_CARD`) continua crescendo **de fase em fase** (não zera), então quem chega na
  fase 3 ainda tem motivo pra fazer o passe.
- Zera no fim da **fase**: passe e objetivos da fase. Zera no fim da **temporada**: o resto (como já está em
  `rollSeason`).
- **Não copiar:** passe Premium; teto de pontos que pune quem joga pouco (o nosso teto é por dia, igual o FC, fica).

### Objetivos, marcos e "Foundations"

**Como é:** objetivos diários, semanais e da temporada; **Milestones** por modo (jogue 5/10/20 Live Events → pacote
grande); **Foundations**, objetivos de quem está começando, que ensinam o modo (e no FC 26 liberam o mercado depois de
um tempo). O FC 26 passou a mostrar no menu "Jogar" os objetivos do modo que você está olhando.

**Pro Soccermon:** diários e semanais já existem (`OBJECTIVES`, `objectives.ts`). Faltam dois:
- **Primeiros passos** (Foundations): abra o 1º pacote, monte o time, ligue uma química, vença no Normal, comece uma
  Evolução, vença um líder. Cada um paga pouco e o conjunto paga um Pacote Grande. É barato (mesmo
  `countObjectives`, período `start`) e é o que faz o modo novo não assustar no dia 27/11.
- **Marcos de longo prazo** por modo (25/50/100 vitórias no Time Ultimate, 8 insígnias, 10 Evoluções) que viram
  medalha no Perfil (`medals.ts`).
- **Objetivo do lado do botão:** na tela "Jogar", mostrar o que aquela partida avança (o FC 26 fez isso e é o tipo de
  coisa que deixa o jogo "digno de se olhar").

### Evoluções

**Como é:** FC 24 criou; carta que cumpre o requisito (nota máxima, posição, teto de atributo) entra, cumpre
objetivos por nível (jogar X partidas com ela, fazer gols) e ganha atributos e PlayStyles. FC 26: Evolução de
goleiro, Evoluções "repetíveis limitadas", visual que se acumula, selo de "evoluída" que vira requisito de SBC, 2
vagas ativas. FC 27: **caminhos** (escolher o ramo: ataque ou defesa), **prévia da cadeia** (mostra em que outras
Evoluções a carta vai caber depois), PlayStyles Lab, Evolução pra carta de nota baixa (Training Camp), **menos
Evoluções, em momentos marcados**.

**O que a comunidade acha:** o sistema mais elogiado do FC 26 ("motivo pra entrar todo dia"). Críticas: Evolução
paga (um cálculo no Reddit chegou a £435 pra fazer todas no FC 25), Evoluções que deixam todo mundo com a mesma carta,
e no FC 27 já tem tópico dizendo que ficaram menos empolgantes que no FC 26 (menos frequentes).

**O nosso hoje** (`evolutions.ts`): Charmander → Charmeleon → Charizard por objetivo (3 partidas + 2 gols + 1 vez
craque por passo), prévia, Treino de 3 subidas pra forma final, 2 ao mesmo tempo, o jogador toca em "Evoluir".
Já é melhor que o FC no essencial (a evolução é a do Pokémon). Pra ficar no nível do FC 27:
- **Prévia da cadeia:** mostrar o que vem depois (Charizard → Treino 1/2/3), já que `evoPaths` e `evoPreview` existem.
- **Evolução de Base** (Training Camp): só pra carta Bronze, com objetivo mais fácil, pra Bronze virar titular.
  Mexe em atributo? Não: usa o mesmo +2 da evolução (`evolved`).
- **Selo de evoluída** como requisito de desafio ("3 titulares evoluídos") e de líder.
- **Não copiar:** Evolução paga, Evolução que muda visual de carta sem passar pela galeria `?cards=1`.

### Desafios de montagem (SBC) e Player Picks

**Como é:** o SBC clássico pede um time com química, posição e nota mínimas; você entrega as cartas (somem) e
ganha pacote, carta ou **Player Pick** (escolha 1 entre N). Tipos: carta (a promoção da semana), upgrade (troca
repetida por pacote melhor), desafio (quebra-cabeça), diários, Foundations. **FC 27, "Streamlined SBC":** cada carta
vale pontos pela nota e raridade (a mesma conta da Galeria), você entrega até bater a pontuação-alvo, **aceita
repetidas** e **salva entrega parcial**; o quebra-cabeça clássico fica só pros desafios (Marquee Matchups, Daily
Puzzle).

**O que a comunidade acha:** o FC 26 lançou mais de 100 cartas de SBC em 2 meses; faltou "forragem" (carta barata
pra entregar), muito SBC caro demais pra fazer. O streamlined foi bem recebido por ser rápido.

**Pro Soccermon (janeiro, já no plano):**
- Hoje a repetida vira pontos de pacote na hora (`REPEAT_POINTS`), então não sobra carta pra entregar. Duas saídas:
  (a) o desafio pede **cartas da coleção** (elas somem) e paga mais que elas valiam; (b) a repetida vai pra uma
  pilha de "Reservas" que o desafio consome, e só vira pontos se você quiser. A (b) é a do FC, pede tela nova.
- **Prêmio principal: "escolha 1 de 3"** (o Player Pick). É o DNA do Soccermon (a Copa toda é isso) e resolve a
  sorte de pacote melhor que outro pacote.
- Dois tipos só: **desafio de pontuação** (entrega parcial, aceita repetida) e **quebra-cabeça de química**
  ("monte 5 com Fósseis e Misty") que **não gasta carta**: só mostra que você tem e paga. Ensina a química sem doer.
- **Poucos, com retorno:** 2 a 3 por fase, todos devolvendo pelo menos um Pacote Mini.

### Química e posições

**Como é (desde o FIFA 23):** cada jogador tem **0 a 3 pontos** (losangos na carta); o time vai até 33. Conta o time
inteiro, não só o vizinho. Clube 2/4/7 jogadores = 1/2/3, liga 3/5/8, nação 2/5/8. **Fora de posição = 0** e não
ajuda ninguém; banco não conta. Ícone conta em dobro pra nação e +1 pra toda liga; Herói em dobro pra liga.
Química só dá bônus (pelo estilo de química), nunca tira. **FC 27:** Ícone e Herói caíram pra +1 liga e +1 nação
("uma escolha que vai ser impopular", Operation Sports). Posição: 1 principal + até 3 alternativas, sem carta de
mudar posição; papéis (Roles) com + e ++; PlayStyles e PlayStyles+.

**O nosso hoje** (`chemistry.ts`): sinergia de tipo (2 = +3% até 5 = +10%), sinergias de história
(`links.ts`), teto de +15% (`SYNERGY_CAP`), fator de posição, tudo pela regra única (`attributeModifiers`). A conta
é boa; o que o FC tem a mais é **leitura**: 3 losangos por jogador e um número do time que todo mundo entende.
- **Losangos (só visual, mesma conta):** cada titular mostra 0–3 pela química dele (ex.: +3% = 1, +6% = 2, +10% = 3)
  e o time mostra "X/15". Não muda número nenhum, mas é visual de carta: **galeria `?cards=1` antes** (regra de design).
- **Fora de posição = losango apagado**, igual o FC (o fator `pos` já existe).
- **Ícone:** não copiar o corte do FC 27 no meio do caminho; a regra "fechar química e lendários antes de 27/11" vale.
- **Golpes = PlayStyles:** a carta já mostra os golpes; o "+" do FC seria golpe especial. Fica como está.

## Economia

**Como é:** moedas (jogando e vendendo), FC Points (dinheiro), pacotes de tamanhos Mini 3, Small 6, Large 9, Jumbo 24 e
Giant 32 (FC 27 tirou a divisão comum/rara e **tirou o mínimo garantido de raras** dos nomes), chance divulgada nos
pacotes da loja (pressão de regulador, Bélgica proibiu a venda de FC Points), negociável x intransferível, mercado
com faixa de preço e taxa, acesso gradual ao mercado (FC 26), venda rápida (Quick Sell, revisada no FC 27), loja com
ofertas limitadas. FC 27: mais prêmio negociável, mais moedas por partida, menos ofertas na loja. Além das moedas, o
FC 27 tem SP, pontos de classificação, Champions Tokens, Gallery Tokens, Event Tokens, Draft Tokens e Estrelas.

**O que a comunidade acha:** sorte de pacote é a queixa nº 1 todo ano (fórum da EA, "pack luck" no FC 26 e 27);
pacote de Black Friday com chance de Ícone estranha virou polêmica no FC 26; inflação e mercado que despenca depois de
cada promoção; "o modo ainda quer o seu dinheiro" (Tom's Guide), "mais acessível, mas mantém os pedágios" (Vandal).

**Pro Soccermon:** aqui a gente já está **melhor** que o FC e o certo é não piorar.
- Fichas como moeda única, chances na tela, piso garantido (o FC 27 tirou o dele; a gente mantém), pontos de pacote
  que compram a carta (proteção de azar), repetida que vira algo. Tudo já em `rules.ts`.
- **Venda rápida** = repetida vira pontos (já é).
- **Negociável x intransferível:** não existe sem mercado; não criar.
- **Shiny = o "Holográfico" do FC 27** (mesmos atributos, visual raro). Já temos; o Shiny hoje dá +2 (`specials.ts`),
  o Holográfico não dá nada. Não mexer agora, só registrar a diferença.
- **Galeria do FC 27 = o nosso Álbum** (`binder.ts`, já recebe `'ultimate'`): a carta conta pra sempre, mesmo depois de
  evoluída ou gasta. Crítica do FC 27: os conjuntos se completam com um botão e viram "burocracia". Se a gente fizer
  conjuntos (por tipo, linha evolutiva, ginásio), que paguem enfeite e não tenham botão de completar sozinho.

## Promoções e eventos

**Como é:** **TOTW** toda quarta (cartas "em forma" pelo desempenho real da semana; no FC 27 a comunidade vota um
jogador nas 6 primeiras). Campanhas de ~2 semanas com 2 times cada (Ones to Watch, Ratings Reload, Future Stars,
Ultimate Scream 23/10–06/11...), TOTY em janeiro, TOTS de abril a junho, Futties no verão. Cartas dinâmicas: Ones to
Watch sobem +1 a cada TOTW do jogador real; Destined for Glory sobe pelo desempenho no campeonato real. **FC 27 cortou
~5 semanas de campanha** (cerca de 15 promoções no ano) e criou **Series**: semanas temáticas sem carta especial nova
nos pacotes (TOTY Warm Up, TOTS Warm Up), a 1ª em dezembro.

**O que a comunidade acha:** "promoções que viram uma só", ritmo que a economia não acompanha, carta nova toda semana
que deixa a da semana passada inútil (a curva de poder).

**Pro Soccermon:**
- **Time da Semana** sem servidor novo: os 5 Pokémon mais escalados pelos campeões da Copa do Dia da semana
  (`DailyRow.squad` + `champion`, `src/league/api.ts`) saem como carta Destaque (edição que já existe) numa "escolha
  1 de 3" do fim de semana. É "a comunidade escolheu" sem votação.
- **Um evento por fase** (o plano já diz "poucos e marcados"); entre eventos, uma **semana temática** de tipo
  ("Semana do Fogo": objetivos e líder do tipo, sem carta nova), que é a "Series" do FC 27 e custa quase nada.
- **Carta dinâmica** (a OTW): carta Evento que sobe +1 se a espécie entrar no Time da Semana durante o evento. Mexe
  em atributo, então é equilíbrio: só com o ok do Miguel.
- **Não copiar:** promoção por semana; carta de evento mais forte que a base por mais de um degrau (regra que já está no
  plano).

## Do FC 26 pro FC 27: o que mudou e o que o pessoal achou

| Mudou | FC 26 | FC 27 | Recepção |
|---|---|---|---|
| Classificação pro Champions | divisão + pontos, sem Playoffs | só pontos (1.000), de Rivals **e Squad Battles**; sem exigir divisão 6 | elogiado (quem joga solo também chega) |
| Moedas por partida | ~500–600 | "várias vezes isso" | elogiado; guias de mercado falam em inflação |
| Prêmios | muitos intransferíveis | quase todos negociáveis | elogiado |
| Química de Ícone/Herói | Ícone +2 nação, Herói +2 liga | +1 liga e +1 nação os dois | criticado |
| SBC | quebra-cabeça de time | pontuação-alvo, parcial, aceita repetida | elogiado (rápido) |
| Evoluções | lineares, muitas | com caminho e prévia da cadeia, menos e marcadas | caminho elogiado; "menos empolgante" no fórum |
| Coleção | só o clube | Galeria permanente com conjuntos e tokens | "tem potencial" mas é "burocracia" (Dexerto) |
| Pacotes | comum/raro, mínimo de raras | Mini/Small/Large/Jumbo/Giant, sem mínimo garantido | chances iguais ao FC 26 pela EA; sorte de pacote segue a queixa nº 1 |
| Promoções | ~20 | ~15 + semanas de Series | bem recebido (menos cansaço) |
| Animação de pacote | longa | mais curta (v1.1, pedido do beta) | elogiado |
| Hub | Event Hub (FC 26) | Campaign Hub (tudo da promoção numa tela) | neutro |

Leitura geral das análises: o UT do FC 27 é "refinamento, não revolução" (Maxim, games.gg 8/10, Insider Gaming 7/10),
"o modo que menos recebeu atenção" (Dexerto). O competitivo ficou mais justo (defesa automática mais fraca, Game
Informer).

## Copiar, adaptar, evitar

| | O quê (FC) | No Soccermon | Onde |
|---|---|---|---|
| Copiar | Fases de ~6 semanas com passe de 30 níveis e teto diário | 4 fases na T1, passe de 30 marcos por fase, carta de abertura cresce entre fases | `rules.ts` (`PASS_*`, `SEASONS`), `season.ts` |
| Copiar | Squad Battles: 4 rivais por vez, faixa semanal, dificuldade escolhida | Batalhas de Treinador contra os times da Copa do Dia | `squadOf`, `ultimateRival` |
| Copiar | Escada de Rivals com estágios, 15/30 pontos, checkpoint | Rivais com escada visível e Elo escondido | `src/league/rules.ts`, Edge Function `liga` |
| Copiar | Foundations (objetivos do 1º dia) | Primeiros passos | `objectives.ts` |
| Copiar | SBC por pontuação com entrega parcial e repetidas | Desafios de montagem de pontuação | jan |
| Copiar | Player Pick | "Escolha 1 de 3" como prêmio | o 1 de 3 da Copa |
| Copiar | Prévia da cadeia de Evolução | mostrar Treino depois da forma final | `evoPreview` |
| Copiar | Objetivo do modo mostrado no botão de jogar | aba Jogar mostra o que a partida avança | `Ultimate.tsx` |
| Adaptar | Champions de 15 jogos | Platô Índigo: 7 jogos assíncronos no fim de semana | `liga` |
| Adaptar | Live Events com regra de entrada | líderes + Gauntlet de Kanto + torneio de 8 fantasmas | `GYMS`, `gymOk` |
| Adaptar | Bounties | desafio sorteado do próximo jogo dos Rivais | `liga` (Rng do servidor) |
| Adaptar | Rush e seus "blocos" de montagem | bônus de pontos por montar com a regra da semana | objetivos |
| Adaptar | TOTW | Time da Semana pelos campeões da Copa do Dia, carta Destaque | `DailyRow` |
| Adaptar | Series (semana sem carta nova) | Semana do tipo entre eventos | `EVENTS` |
| Adaptar | Losangos de química 0–3 | mesma conta, leitura do FC (galeria antes) | `chemistry.ts` |
| Adaptar | Galeria com conjuntos | conjuntos no Álbum pagando enfeite, sem auto-completar | `binder.ts` |
| Evitar | Moedas demais (o FC 27 tem 8) | só Fichas, sempre | ADR 0006 |
| Evitar | Passe Premium, loja, FC Points, Evolução paga, entrada paga no Draft | nada disso | ADR 0006 |
| Evitar | Mercado e negociável x intransferível | sem mercado (troca entre amigos, se vier, com limite) | plano |
| Evitar | Pacote sem mínimo garantido | manter o piso | `FLOOR_METAL` |
| Evitar | Weekend League longa e com horário | 7 jogos, quando quiser | |
| Evitar | Promoção toda semana, 100 SBCs em 2 meses | 1 evento por fase, 2–3 desafios por fase | |
| Evitar | Mexer em química/carta no meio da temporada | fechar antes de 27/11 (já decidido) | |
| Evitar | Regras da casa no motor agora | lista de 2027 (`ENGINE_VERSION`) | |
| Evitar | Auto-completar time (Draft, Galeria) | escalação é escolha do jogador | regra de design |

## Onde estamos x o FC

| Peça do FC | Time Ultimate hoje (branch `ultimate`) | Falta |
|---|---|---|
| Pacotes com chance e piso | Mini 3 e Grande 5, chances na tela, piso | nada |
| Proteção de azar | pontos de pacote compram a carta | nada |
| Contra IA com dificuldade | 4 níveis, tabela de prêmio | rivais de verdade (Batalhas de Treinador) |
| Objetivos dia/semana | sim | Primeiros passos, marcos, objetivo no botão |
| Passe | 1 passe de 40 marcos na temporada | fases |
| Evoluções | sim, com prévia | cadeia, Evolução de Base, selo |
| Live Events | 8 líderes com regra | Gauntlet, torneio, hub do evento |
| Evento | Natal | semana do tipo, Time da Semana |
| Rivals / Champions | não (a Liga é separada) | Rivais e Platô Índigo |
| SBC | não | desafios de montagem |
| Química | painel em % | leitura em losangos |
| Coleção permanente | Lenda e medalhas no Álbum | conjuntos |

## Opções de reformulação

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| **A. Calendário do FC (simples)** | Fases de 6 semanas com passe próprio, Primeiros passos, marcos, objetivo no botão de jogar, semana do tipo, prévia da cadeia de Evolução, Evolução de Base | 1 versão (dez) | baixo: tudo local, só números novos em `rules.ts` e o ok deles |
| **B. Temporada à FC (recomendada)** | A + Batalhas de Treinador (times da Copa do Dia, faixa semanal), desafios de montagem por pontuação com "escolha 1 de 3", Time da Semana, e em jan Rivais com escada e o Platô Índigo de fim de semana | 3 versões (dez, jan, fev) | médio: Rivais e Platô mexem na Edge Function `liga` e no Supabase de produção (ok do Miguel); Batalhas e desafios são locais |
| C. UT completo (rica) | B + Gauntlet, torneios de 8, Duelo com o time, losangos de química, conjuntos no Álbum, regras da casa no motor (Primeiro a 3, cartão azul), carta dinâmica | 5+ versões (até a T2) | alto: motor (`ENGINE_VERSION`), equilíbrio, servidor, visual de carta |

## Recomendação

**B, em etapas, sem mexer no que lança em 27/11:**

1. **27/11 (sem mudar o escopo):** só **Primeiros passos** e o **objetivo no botão de jogar**, porque é o que deixa
   o 1º dia bonito. Se o Miguel topar as fases, o passe de 40 marcos vira o passe da fase 1 (só números).
2. **Dezembro (0.9.34/35):** fases ligadas, Batalhas de Treinador, prévia da cadeia, Evolução de Base, semana do tipo.
3. **Janeiro (fase 2, junto do ranking que já estava marcado):** Rivais com escada e desafio do jogo, desafios de
   montagem, Time da Semana.
4. **Fevereiro/março:** Platô Índigo de fim de semana, Gauntlet de Kanto, Duelo com o time.

O que deixa o Time Ultimate "digno de se olhar" pelo lado do sistema: abrir o modo e sempre ver **o que está aberto,
quanto falta e o que paga** (o hub do FC), com uma coisa nova por fase e não por semana.

## Decisões pro Miguel (recomendação primeiro)

1. **Reformulação:** B em etapas **(recomendado)** / A só / C.
2. **Fases dentro da temporada semestral** (4 de ~6 semanas, passe de 30 marcos cada, Pikachu cresce entre fases)
   **(recomendado)** / passe único de 40 marcos como hoje.
3. **Batalhas de Treinador** contra os times da Copa do Dia, 14 partidas que contam por semana **(recomendado)** / só
   os clubes de ginásio.
4. **Faixa semanal das Batalhas:** fixa por pontos **(recomendado até ter ranking)** / percentil como o FC.
5. **Rivais:** escada visível (6 divisões + Elite dos Quatro, estágios, checkpoint de 3 derrotas) com Elo escondido
   **(recomendado)** / Elo e 4 divisões como a Liga.
6. **Platô Índigo:** 7 jogos assíncronos no fim de semana, entrada com 1.000 pontos **(recomendado)** / 15 como o FC
   / não ter.
7. **Prêmio dos desafios e marcos grandes:** "escolha 1 de 3" **(recomendado)** / pacote.
8. **Desafio de montagem:** pontuação que gasta carta da coleção + quebra-cabeça de química que não gasta
   **(recomendado)** / pilha de Reservas com as repetidas (tela nova) / só os que não gastam.
9. **Time da Semana** com os mais escalados pelos campeões da Copa do Dia, como Destaque **(recomendado)** / não ter.
10. **Primeiros passos já em 27/11** **(recomendado)** / em dezembro.
11. **Losangos de química** (mesma conta, leitura do FC), mostrados antes na galeria **(recomendado pra opção C)** / %
    como hoje.
12. **Regras da casa que mexem na partida** (Primeiro a 3, cartão azul, saída sorteada): lista de 2027
    **(recomendado)** / já num evento.
13. **Moeda:** só Fichas pra sempre, nada de token de Campeões **(recomendado)** / uma 2ª moeda.

## Decidido com o Miguel (01/11/2026)

"Perfeito, por mim ótimo": as 13 decisões acima ficam com a recomendação. B em etapas (27/11 Primeiros passos e o
objetivo no JOGAR; dezembro fases de ~6 semanas com passe de 30 marcos e Batalhas de Treinador; janeiro Rivais,
desafios de montagem e Time da Semana; fev/mar Platô Índigo). Rivais e Platô mexem na `liga` e no Supabase de
produção: pedir o ok de novo na hora.

## Fontes

- [EA, Pitch Notes: FC 27 Launch Update](https://www.ea.com/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-launch-update)
- [EA, Pitch Notes: FC 27 Title Update v1.1](https://www.ea.com/games/ea-sports-fc/fc-27/news/update-v1-1-pitch-notes)
- [EA, Pitch Notes: FC 26 FUT Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-fut-deep-dive)
- [EA, probabilidades dos pacotes](https://www.ea.com/games/ea-sports-fc/news/fc-pack-probabilities)
- [EA Help, como funciona o Rivals](https://help.ea.com/en/help/ea-sports-fc/fc-ultimate-team-rivals/)
- [EA Help, como funciona o Champions no FC 27](https://help.ea.com/fi/articles/ea-sports-fc/ultimate-team-champions/)
- [Operation Sports, química e prêmios no lançamento do FC 27](https://www.operationsports.com/ea-fc-27-launch-day-pitch-notes-highlight-chemistry-changes-new-rewards-and-day-one-content/)
- [Operation Sports, jogadores dizem que o grind de SBC do FC 26 passou do ponto](https://www.operationsports.com/ea-fc-26-players-say-the-sbc-grind-has-gone-too-far/)
- [Operation Sports, fãs querem mudança mas a carteira diz outra coisa](https://www.operationsports.com/ea-fc-fans-want-change-but-their-wallets-say-otherwise/)
- [Operation Sports, mudanças do UT no FC 26 (torneios e mais)](https://www.operationsports.com/tournaments-and-more-all-of-the-biggest-ultimate-team-changes-coming-with-ea-fc-26)
- [fut.gg, Evoluções no FC 27: caminhos e prévia](https://www.fut.gg/news/how-are-evolutions-changing-in-ea-fc-27-pathways-previews-and-more/)
- [fut.gg, Streamlined SBCs no FC 27](https://www.fut.gg/news/what-are-streamlined-sbcs-in-ea-fc-27-new-ultimate-team-feature-explained/)
- [fut.gg, passe da Temporada 1 do FC 27](https://www.fut.gg/news/ea-fc-27-season-1-pass-how-to-earn-sp-fast/)
- [Dot Esports, Temporada 2 FC Heritage](https://dotesports.com/ea-sports-fc/guides/fc-27-season-2-fc-heritage-end-date-season-pass)
- [FUTWIZ, Division Rivals semana 1 do FC 27](https://www.futwiz.com/guides/fc-27-division-rivals-week-1-standard)
- [FUTWIZ, classificação pro Champions e loja de tokens no FC 27](https://www.futwiz.com/guides/fc-27-champions-qualification-token-store)
- [FIFA Uteam, Squad Battles no FC 27](https://fifauteam.com/fc-27-squad-battles-explained/)
- [FIFA Uteam, Rush no FC 26](https://fifauteam.com/fc-26-rush/)
- [FIFA Uteam, Draft no FC 27](https://fifauteam.com/?p=338450)
- [FIFA Uteam, Live Events do FC 27](https://fifauteam.com/fc-27-live-events-list/)
- [FIFA Uteam, Moments no FC 26](https://fifauteam.com/moments-football-club-26/)
- [gamecurrency.net, Rivals do FC 26: bounties, duels e checkpoints](https://gamecurrency.net/blog/fc26-division-rivals-bounties-feature)
- [Dexerto, química do FIFA 23 em diante](https://www.dexerto.com/fifa/fifa-23-how-to-get-chemistry-1943414/)
- [FIFPlay, química no FC 27](https://www.fifplay.com/fc-27-chemistry/)
- [Dexerto, posições e papéis no FC 26](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/all-new-player-roles-explained/)
- [AltChar, FC 27 FUT Deep Dive (Galeria, SBC, Campaign Hub)](https://www.altchar.com/game-news/ea-sports-fc-27-fut-deep-dive-reveals-fut-gallery-faster-sbcs-and-evolution-upgrades-avC1O1v3gRtt)
- [Dexerto, review do FC 27](https://www.dexerto.com/ea-sports-fc/ea-sports-fc-27-review-3410901/)
- [Tom's Guide, review do FC 27](https://www.tomsguide.com/gaming/ive-played-every-fifa-game-since-2000-heres-my-verdict-on-ea-sports-fc-27)
- [Game Informer, review do FC 27](https://gameinformer.com/review/ea-sports-fc-27/more-build-up-play-than-the-long-ball)
- [games.gg, review do FC 27](https://games.gg/ea-sports-fc-27/review/)
- [Maxim, review do FC 27](https://www.maxim.com/sports/ea-sports-fc-27-review-the-game-formerly-known-as-fifa-feels-beautiful-again/)
- [Vandal, análise do FC 27](https://vandal.elespanol.com/analisis/ps5/ea-sports-fc-27/237994)
- [Fórum EA, sorte de pacote no FC 27](https://forums.ea.com/discussions/fc-27-ultimate-team-en/pack-luck/13830030)
- [Fórum EA, "Evoluções não empolgam como no FC 26"](https://forums.ea.com/discussions/fc-27-feedback-en/evolutions-no-longer-feel-as-exciting-as-fc26/13779312)
- [Soccer Gaming, polêmica do pacote de Black Friday do FC 26](https://soccergaming.com/ea-sports-fc-26-black-friday-pack-sparks-controversy-over-icon-odds/)
- [mein-mmo, gasto com Evoluções no FC 25](https://mein-mmo.de/en/in-ea-fc-25-players-could-spend-over-500-euros-on-a-feature-fans-fear-it-will-get-worse,1403599)

Nota de método: o Reddit não abriu pra leitura automática e o fórum da EA bloqueou o acesso direto; a opinião da
comunidade aqui vem das análises, do fórum pelos títulos e de matérias que citam os tópicos. Os números de Rivals,
Squad Battles e Champions que a EA não publica (estágios, derrotas do checkpoint, 15/30 pontos) vêm de guias e podem
mudar no jogo.
