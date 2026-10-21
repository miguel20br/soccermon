---
description: Pesquisa e proposta do escanteio, com a opção escolhida.
---

# Escanteio (pesquisa e proposta, 17/10/2026)

Pedido: escanteio na 0.8.5 (junto com o duelo ao vivo, ver `lancamento.md`). A ideia já foi aprovada em 16/10
(`jogo-gostoso.md`, fase 5): **bola pela linha de fundo tocada por último pela defesa vira escanteio, com
cobrança, disputa no alto pela força e cabeçada/voleio; sem jogo aéreo no resto (futsal é de chão)**. Este doc
junta a pesquisa, o que o motor faz hoje, 3 opções de desenho e as decisões que faltam. Nada de código ainda:
números e fórmulas passam pelo ok do Miguel antes (skill `soccermon-balanceamento`).

## Resumo

- **Hoje não existe escanteio nenhum**, e não é só porque falta a regra: medi 300 partidas e **zero** bolas saem
  pela linha de fundo depois de toque da defesa. Espalmada do goleiro sempre volta pra quadra e bloqueio sempre
  devolve a bola pra frente. Ou seja, além da regra, o escanteio precisa de **gerador** (goleiro espalmando pra
  fora, desvio no bloqueio).
- Futsal real: **~18 escanteios por jogo** e só **~3% viram gol** (Copa do Mundo de Futsal: 947 escanteios em 52
  jogos, 29 gols). Pro Soccermon isso seria chato. Proposta: **3 a 4 por jogo, ~10% de gol**. Cada escanteio vira
  um momento, e o efeito em gols fica pequeno: **+0,1 a +0,3 gol por jogo**.
- Recomendação: **Opção B**. Escanteio com 3 jogadas de futsal (na área, curta pro chute de fora e segunda
  trave), disputa no alto por força + tamanho + posicionamento, **golpe na bola parada** (Headbutt, Jump Kick,
  Fly, Swift, Gust...) e uma **instrução de escanteio do técnico** que funciona como a tática: escolhida antes,
  trocável durante, nunca automática.

## 1. Regras do futsal (FIFA Futsal Laws)

| Regra | Futsal real | No Soccermon |
|---|---|---|
| Quando | bola inteira passa a linha de fundo (no chão ou no alto), último toque da **defesa**, sem gol | hoje toda saída pela linha de fundo vira tiro de meta (ver §4) |
| Onde | no arco do canto mais perto de onde a bola saiu | canto do lado em que a bola cruzou (`yCross`) |
| Distância | rivais a **5 m** do arco até a bola rolar | defesa posicionada a ≥ 5 m na hora de montar a cobrança |
| Tempo | **4 segundos** depois de pronto, senão vira tiro de meta do rival | a IA cobra em ~1 s; o relógio do Soccermon já para fora da fase `play` (como o cronômetro do futsal) |
| Gol direto | vale (o "gol olímpico"), só contra o rival | vale, e é raro: fica pra golpe de vento/curva (ver opção B) |
| Cobrador | qualquer jogador de linha; não pode tocar 2 vezes seguidas | cobrador não domina a própria cobrança |
| Tiro de meta | **com a mão**, de qualquer ponto da área, em 4 s; não vale gol direto | o jogo já tem `goalkick`: a bola vai pro **pé** do goleiro (`goalClearance`) |
| Lateral | **com o pé**, bola parada na linha, 4 s, não vale gol direto | não existe: as laterais são parede (bola quica, "arena") |

Números de jogos de verdade:

| Fonte | Dado |
|---|---|
| Copa do Mundo de Futsal (FIFA Training Centre) | 947 escanteios em 52 jogos (**~18 por jogo**), 29 gols (**3,1%**). Bola parada = 92 de 301 gols (quase 1/3): lateral 32, escanteio 29, falta 26 |
| Top 8 ligas europeias (Futsalfeed, 176 jogos) | 6,48 gols/jogo na temporada regular. Bola parada = 23,8% dos gols; escanteio = 30,4% desses (**~7% de todos os gols**, ~0,45 por jogo) |
| Joinville, 35 jogos de 2019 (FIEP Bulletin) | 109 gols: 15 de escanteio (**13,8%**), 9 de lateral |
| Liga Nacional 2013–15 (citado no mesmo artigo) | bola parada = 20,3% dos gols |

Jogadas ensaiadas comuns no futsal:

- **Triângulo** (a mais clássica, futsal.tech): 2 atacantes na linha da área e 1 na marca do 2º pênalti (10 m).
  Três saídas: **de fora** (um faz o bloqueio, a bola chega no de trás e ele chuta de primeira), **na frente**
  (quem bloqueou chuta) e **por dentro** (bola alta na segunda trave pra cabeçada ou voleio). Um fica atrás contra o
  contra-ataque.
- **Rasteira forte na primeira trave**, buscando o desvio. Os goleiros se adiantam pra cobrir o chute de fora.
- **Bola alta na segunda trave** pro voleio e **bola na entrada da área** "pegaram as defesas de surpresa
  repetidas vezes" (FIFA).
- **Cobrança rápida** antes da defesa se arrumar: Portugal, Argentina e Rússia foram as melhores nisso.
- Defesa: quem **varia** a marcação de um escanteio pro outro se deu melhor (Argentina). Padrão: 1 na primeira
  trave, marcação mista, 1 sai pra fechar o chute de fora.
- Goleiro-linha (5x4) é jogada à parte (20,8% dos gols nas ligas europeias); não entra aqui.

## 2. Como os jogos fazem

| Jogo | O que o jogador decide | Como mostra | O que diverte / o que chateia |
|---|---|---|---|
| **EA FC / FIFA** | mira (retícula) + força; "jogador-alvo" e corridas nas táticas; FC IQ promete corridas de despiste | câmera atrás do cobrador, corte rápido pra área | diverte: o cruzamento perfeito na cabeça do zagueirão. Chateia: vira fórmula ("3 barras na marca do pênalti") e o meta é sempre o mesmo |
| **eFootball / PES** | alvo (1ª trave, 2ª trave, centro), instrução (Dash, pequena área, "trem", 2ª trave) e opções de **curto** (Touchline, Runner from deep...) | câmera do cobrador | variedade de jogadas; o próprio guia diz que o segredo é **variar** |
| **Football Manager** | rotinas por jogador (1ª trave, marca do pênalti, 2ª trave, **fora da área pro rebote**, 1–2 atrás); defesa **zona, individual ou mista** | motor 2D/3D, sem pausa | diverte ver a rotina que você montou dar certo. Disputa no alto pesa Impulsão, Cabeceio, Altura, Força e Antecipação |
| **Sensible Soccer** | direção + "aftertouch" (curva depois do chute) | visão de cima, nada para | rápido, quase sem interrupção |
| **Captain Tsubasa (Tecmo, Famicom)** | por menu: na bola alta escolhe cabeçada, dominar, afastar ou **bicicleta**; especiais gastam "guts" | cena desenhada com o nome do golpe | a referência mais "Pokémon": menu + golpe com nome + recurso que acaba. Vale como ideia pro golpe na bola parada |
| **Inazuma Eleven (Victory Road)** | golpes especiais (chute, drible, bloqueio, defesa); na bola aérea tem o **Scramble**, com marcadores de tempo pra apertar | cinemática do golpe | disputa aérea como mini-momento. Não achei golpe exclusivo de escanteio |
| **Mario Strikers: Battle League** | nada: cerca elétrica, a bola nunca sai | — | sem paradas, ritmo alto |
| **Rematch (Sloclap)** | nada: paredes, **sem escanteio e sem lateral** | — | a parede vira jogada (tabela, voleio). Igual às laterais do Soccermon hoje |
| **Captain Tsubasa: Rise of New Champions** | chute carregado e "Hidden Shots" | cinemática | especial bonito, mas longo; cansa se acontece toda hora |

O que dá pra levar:
1. **Escanteio é bom quando é raro e vira momento.** Os jogos de ritmo (Mario Strikers, Rematch) cortam a bola
   parada. Os de simulação aceitam 10+ por jogo porque o jogador controla cada um.
2. **A decisão interessante é a jogada, não a mira.** PES e FM: escolher entre área, curto e 2ª trave. No
   Soccermon o técnico não controla Pokémon, então a escolha vira instrução de time.
3. **Golpe com nome na bola parada** (Tsubasa, Inazuma) é a identidade que nenhum jogo de futebol "sério" tem,
   e casa direto com os golpes da Gen 1.
4. **Variar ganha** (FIFA, PES, FM): a jogada da IA deve ter sorteio com peso, não ser sempre a mesma.

## 3. Simuladores open source

- **Google Research Football (gfootball):** o cenário `academy_corner` só monta as posições (bola em `(0.99,
  0.41)`, 11x11, todos os atacantes entre a marca do pênalti e a pequena área) e deixa o motor (o antigo Gameplay
  Football) jogar. Os autores dizem que é o cenário "academy" mais difícil pros agentes. Lição: **posição inicial
  fixa por papel + o motor normal resolve o resto**. É o mesmo que o Soccermon já faz em `setupKickoff` com
  `formation.kickoff`.
- **RoboCup (rcssserver):** o juiz põe a bola a 1 m do canto, muda o modo pra `corner_kick_l/r` e afasta os
  rivais. No tiro de meta, tira os rivais da área até a bola sair dela. As jogadas ficam por conta dos times
  (agentes). Lição: **regra no motor, jogada no controller**. É a divisão que o Soccermon já tem (motor ×
  `ai-controller.ts`).
- Disputa aérea: nenhum dos dois tem "duelo" explícito. Ganha quem chega primeiro na altura certa. O FM (fechado)
  compara atributos. Pro Soccermon, um **sorteio com peso entre quem está perto do ponto de queda** é o caminho
  mais simples, determinístico e fácil de calibrar.

## 4. O que o motor faz hoje (lido em 17/10)

- **Toda bola que sai pela linha de fundo sem ser gol vira tiro de meta.** Em `updateBall`
  (`src/engine/match.ts`, bloco "linha de fundo"): se não é gol nem trave, emite `wide` (se era chute) e chama
  `goalClearance(s, defensor)`, **sem olhar `ball.lastTouch`**. Confirmado.
- **Mas ninguém da defesa manda a bola pra fora.** Medição (300 partidas, táticas sorteadas, script fora do repo):

  | Por jogo (os dois times) | Valor |
  |---|---|
  | gols | 6,78 (calibrate de 100: 7,14) |
  | chutes / chutes pra fora | 34,8 / 13,2 |
  | tiros de meta | 13,2 (quase todos depois de chute pra fora) |
  | **saídas pela linha de fundo com último toque da defesa** | **0** |
  | defesas espalmadas / seguradas | 6,0 / 1,9 |
  | bloqueios | 4,5 (calibrate: 4,8) |
  | gol do rebote em até 5 s depois de espalmada | 0,34 (5,8% das espalmadas) |
  | gol do rebote em até 5 s depois de bloqueio | 0,22 (4,8% dos bloqueios) |

  Espalmada: `outward = (attackSign(time do goleiro) * 0.3..1, ±1)`, sempre pra frente. Bloqueio: a bola volta
  com `-0.3 × velocidade`. Nenhum dos dois cruza a linha de fundo.
- **O relógio para fora do `play`.** `step()` retorna antes do `s.time += dt` em qualquer outra fase. Escanteio
  numa fase própria não come tempo de jogo, igual ao cronômetro do futsal.
- **Já existe bola no alto:** passe ≥ 12 m (`LOB_MIN`) sai alto e quica perto do alvo; Egg Bomb (`lob`) é chute
  por cima; `REACH_Z = 1,1 m` (jogador) e `GK_REACH_Z = 2,3 m` (goleiro na área). Hoje quem domina é **o mais
  perto que alcança** (`checkPossession`): não tem disputa.
- **Tamanho já está calculado:** `sizePercentile(sp)` (peso + altura, `attributes.ts`) entra em `strength` (30%) e
  no `goalkeeping`. Não existe atributo de cabeceio/impulsão, e não precisa criar (ver decisões).
- **Reinício padrão:** `goalClearance` e `setupKickoff` aplicam substituições pendentes (`applyPendingSubs`),
  conferem evolução (`checkEvolutions`), põem fase `restart`/`kickoff` com `phaseTimer`. O escanteio copia esse
  molde.
- **IA:** `ai-controller.ts` devolve `idle` fora do `play`. Chute com golpe: `pickMoveSlot(['strike','blast'])`
  só com xG alto, e há um espaçamento global entre golpes (`s.nextMoveTick`).
- **Tela:** `goalkick` hoje é `popText` + linha na `battleBox` (`MatchScene.ts`). Já existem faixa de golpe com
  holofote (`cinematics.ts`), texto de drama ("NA TRAAAVE!"), câmera lenta perto de gol/trave/defesa
  (`dramaTicks`), o modo **Lances** (`HIGHLIGHT` em `MatchScene.ts`) e a narração (`src/ui/commentary.ts`).
- **Observação lateral (vale conferir à parte):** nas mesmas simulações, **só ~0,07 chute por jogo sai com
  golpe** (`shot.moveId`). Os eventos `move` com a bola são quase todos `burst` (4,4/jogo); `strike`/`blast` com
  bola, ~0,07. Ou seja, o "chute com golpe" quase não acontece hoje. O escanteio pode ser o lugar natural pra ele
  acontecer, mas o motivo de ser tão raro merece uma olhada (talvez o `nextMoveTick` ou as chances de
  `pickMoveSlot`).

## 5. Proposta: 3 opções

Base comum das três:
- **Regra:** na linha de fundo, se `lastTouch` é da defesa, sai `setupCorner(s, atacante, lado)` em vez de
  `goalClearance`. Nova fase `corner` (ou `restart` com `s.setPiece`), evento `corner { team, by, side, play }`.
- **Gerador** (sem ele não sai escanteio): na espalmada, chance de **espalmar pra fora** (maior em chute forte e
  no canto: `placement` alto, `felt` alto) e no bloqueio, chance de **desviar pra fora**. Alvo: **3–4 escanteios
  por jogo** (os dois times). Exemplo: 35% das espalmadas + 25% dos bloqueios ≈ 2,1 + 1,1 ≈ 3,2. Os números finais
  saem da calibragem.
- **Determinístico:** tudo pelo `s.rng`; sobe `ENGINE_VERSION` (1 → 2); teste novo no `engine.test.ts` (toque da
  defesa → `corner`; do ataque → `goalkick`).
- `calibrate` passa a contar `corner` (já sai em "eventos/jogo") e **gols de escanteio** (gol até ~4 s depois do
  `corner`, do time que cobrou).

### Opção A: escanteio simples (regra + cruzamento + disputa)

- **Quando:** como na base.
- **Quem cobra:** o jogador de linha com mais `passing` (o pivô fica na área).
- **Posições** (molde fixo por papel, como `formation.kickoff`): ataque em triângulo (2 na linha da área, 1 na
  marca dos 10 m), 1 atrás (fixo ou ala) contra o contra-ataque. Defesa: goleiro na linha, 1 na primeira trave,
  2 marcando os da área, 1 saindo no de fora, todos a ≥ 5 m da bola.
- **Cobrança:** sempre cruzamento alto pra área (ponto entre a marca do pênalti e a segunda trave, com erro por
  `passing`).
- **Disputa no alto** (função nova `aerialDuel`, quando a bola cai na área vinda do escanteio): entram os
  jogadores a ~1,6 m do ponto de queda, com sorteio por peso `0,45·strength + 0,35·tamanho + 0,20·positioning`
  (tamanho = `sizePercentile`). O goleiro entra se a queda é a ≤ ~3 m do gol, com `goalkeeping` e alcance maior
  (`GK_REACH_Z`). Resultado: atacante ganhou = **cabeçada/voleio** (`kick` de chute com velocidade menor e mira
  pior que um chute de pé); defensor = afasta longe (`clear`); goleiro = segura ou soca.
- **Técnico:** nada a decidir (é regra de jogo).
- **Tela:** faixa curta "ESCANTEIO" (`popText` + `battleBox`, igual ao tiro de meta), apito, escanteio entra na
  lista do modo Lances; câmera lenta só se a cabeçada virar chance (já sai pelo `save`/`goal`/`post`).
- **Efeito em gols:** ver tabela abaixo; com ~10% de conversão, cerca de +0,15.
- **Risco:** baixo. Pode ficar "mais um evento" sem graça.
- **Esforço:** ~1 dia de motor + meio dia de tela/narração/i18n + calibragem.

### Opção B (recomendada): escanteio com jogadas, golpe e instrução do técnico

Tudo da A, mais:

- **3 jogadas de futsal** (sorteio com peso, a IA varia):
  1. **Na área / 2ª trave:** bola alta, disputa no alto, cabeçada ou voleio.
  2. **Curta pro chute de fora:** rasteira pro da marca dos 10 m, que **chuta de primeira** (sem disputa no
     alto; pesa `shooting`, e o bloqueio normal do motor decide). Bom pros pequenos e rápidos.
  3. **Rasteira na 1ª trave:** bola forte no primeiro pau buscando o desvio (chance de desvio/gol contra, como no
     futsal real).
- **Instrução de escanteio do técnico** (é dele, nunca automática): **Na área / Curta / Variar** (padrão
  Variar). Escolhida no pré-jogo junto da tática e trocável durante a partida **como a tática** (vira
  `MatchOrder` agendada: funciona em 8x, no Lances e no duelo ao vivo, que já sincroniza ordens). A instrução muda
  o peso do sorteio, não trava a jogada. A IA rival escolhe sozinha pelo time que tem (grandalhões = área;
  chutadores = curta).
- **Cobrador:** padrão = melhor `passing`; o técnico pode trocar no painel de escalação (igual ao capitão).
  Assim nada fica escondido nem automático contra a vontade dele.
- **Golpe na bola parada** (gasta o mesmo PP de sempre, `moveUses`; usa só golpes que o Pokémon já tem):
  - **Cobrador:** Swift (`sureHit`: cruzamento perfeito, sem erro), Egg Bomb (`lob`: bola mais alta, só o
    goleiro e os grandões alcançam), Gust/Whirlwind (`blowBall`: curva no vento, chance pequena de **gol
    olímpico**).
  - **Quem disputa no alto:** Headbutt, Skull Bash (sem a carga, na bola parada), Jump Kick / Hi Jump Kick
    (voleio/bicicleta; errou, se machuca, como já é hoje no `crash`), Fly / Sky Attack / Drill Peck (sobe mais:
    bônus grande na disputa), Body Slam (força). Bônus na disputa e cabeçada com o golpe (tipo, crítico, efeito
    secundário: tudo que o chute com golpe já faz).
  - **Defesa:** Barrier/Reflect já seguram chute; o goleiro já usa golpe pra defender (`save` em `move`). Não
    precisa de nada novo.
  - Com isso o escanteio vira o lugar onde o **chute com golpe** acontece de verdade (hoje ~0,07 por jogo).
- **Identidade Pokémon:** Onix (8,8 m), Gyarados, Snorlax e Machamp mandam no alto pelo tamanho/força;
  Pidgeot, Dragonite, Aerodactyl e Hitmonlee pelo golpe; Pikachu e Jolteon brilham na curta, chutando de fora.
  Fica a pergunta se o tipo Voador ganha bônus próprio no alto (decisão 4).
- **Carta = campo:** se tamanho pesa no alto, o painel do Pokémon mostra um selo derivado "Jogo aéreo" (alto,
  médio, baixo), calculado pela mesma função da disputa (`modifiers.ts` ou função exportada do motor). A carta não
  muda.
- **Tela:**
  - apito + faixa "ESCANTEIO" com o nome de quem cobra e o nome da jogada ("Na área", "Curta", "1ª trave");
  - no golpe, a faixa de golpe com holofote que já existe;
  - disputa no alto ganha um texto curto ("NO ALTO!") e um `punch` leve; câmera lenta só se virar chance;
  - narração nova: "subiu mais que todo mundo", "testou firme", "o goleiro sai socando", "gol olímpico!";
  - torcida: "uuuh" na cabeçada que passa perto (`playCrowd`);
  - escanteio e cabeçada contam como lance no modo Lances.
- **Efeito em gols:** com 3,2 por jogo e ~10% de conversão, cerca de +0,2 (tabela abaixo).
- **Risco:** médio. Golpe + tamanho podem fazer o escanteio decidir demais (um Onix capitão vira máquina de gol).
  Por isso o bônus de golpe tem teto e a calibragem olha "gols de escanteio por espécie".
- **Esforço:** ~2–3 dias de motor/IA + 1 dia de tela, narração, i18n e painel + calibragem com o Miguel.

### Opção C: escanteio interativo (momento do técnico)

Tudo da B, mais uma **pausa curta em cada escanteio do time do jogador**: 3 botões (Na área / Curta / 1ª trave)
e, se tiver golpe de bola parada, "Usar Headbutt?". Se ele não tocar em 3 s, vale a instrução de escanteio. É o
estilo Captain Tsubasa/Inazuma.

- **Problemas:**
  - a partida é simulada inteira de uma vez e a tela resimula com as ordens. Uma pausa com escolha exige parar o
    `LiveRunner`, igual a uma ordem nova, e a cada escanteio a partida "se refaz";
  - 73% jogam em 8x: a pausa quebra o ritmo que eles escolheram;
  - no duelo ao vivo, os dois teriam que esperar a escolha do outro (com prazo).
- **Ganho:** o momento mais "jogável" antes do modo jogável. Faz mais sentido junto com o modo jogável (depois da
  1.0).
- **Esforço:** ~4–5 dias + ajustes no duelo. **Risco:** alto (ritmo e multiplayer).

### Efeito esperado em gols (estimativa, a confirmar no `calibrate`)

Conta: escanteios tiram o rebote de quem espalmou/bloqueou pra fora (hoje 5,8% e 4,8% viram gol) e somam a
conversão do escanteio. Com 3,2 escanteios/jogo (2,1 de espalmada + 1,1 de bloqueio), perde-se ~0,17 gol de
rebote:

| Conversão do escanteio | Gols de escanteio/jogo | Efeito líquido | Gols/jogo (base ~6,8–7,0) |
|---|---|---|---|
| 3% (futsal real) | 0,10 | **−0,07** | ~6,8 |
| 8% | 0,26 | +0,09 | ~6,9–7,1 |
| **10% (recomendado)** | 0,32 | **+0,15** | ~7,0–7,1 |
| 15% (arcade) | 0,48 | +0,31 | ~7,1–7,3 |

Pra caber na meta de 5–7: conversão de 8–10% e, se passar de 7, baixar um pouco a chance de **espalmar pra fora**
(menos escanteios), sem mexer em finalização nem goleiro. O peso dos gols de escanteio fica em ~4–5% dos gols:
abaixo dos 7% das ligas europeias e dos 14% de Joinville, então não "vira jogo de bola parada".

### Calibragem (passo a passo, com antes/depois pro Miguel)

1. Rodar `npm run calibrate -- --n 400` antes (base) e salvar.
2. Ligar a regra + gerador e medir: escanteios/jogo (meta 3–4), gols de escanteio/jogo, conversão, quem ganha a
   disputa (ataque/defesa/goleiro: chute inicial 35/45/20%) e gols/jogo.
3. Ver por espécie: top 10 em "gols de escanteio" e "disputas ganhas". Se um Pokémon passar de ~2× a média,
   baixar o peso do tamanho.
4. `--tactics` e `--formations` pra ver se alguma tática/formação ganha vantagem (ex.: ferrolho cedendo mais
   escanteios).
5. Olhar o jogo de verdade (headless, `soccermon-teste-navegador`): o escanteio tem que dar vontade de assistir em
   8x e no Lances.

## 6. Recomendação

**Opção B, em duas entregas dentro da 0.8.5:**
1. **B1 (motor):** regra do último toque, gerador (espalmada/desvio pra fora), molde de posições, as 3 jogadas da
   IA, disputa no alto e cabeçada. Calibrar até 3–4 escanteios e ~10% de conversão. Tela mínima (faixa,
   narração, Lances).
2. **B2 (identidade):** golpe na bola parada, instrução de escanteio do técnico (ordem como a tática), cobrador no
   painel de escalação, selo "Jogo aéreo" no painel, texto "NO ALTO!" e torcida.

A Opção C fica anotada pro modo jogável. Lateral cobrado e tiro de meta com a mão ficam de fora (decisões 8 e 9).

## 7. Decisões pro Miguel

1. **Quantos escanteios por jogo?** Recomendo **3–4** (o real é ~18: muita parada, ainda mais no Lances).
2. **Conversão-alvo?** Recomendo **~10%** (3× o real, +0,15 gol/jogo). Se gols/jogo passar de 7, corto na
   quantidade de escanteios, não na finalização.
3. **De onde sai o escanteio?** Recomendo **espalmada pra fora + desvio no bloqueio** (+ afastada de defensor que
   sai pelo fundo, que a regra pega sozinha). Alternativa: também "afastar pra escanteio" de propósito sob pressão
   (mais raro, mais código).
4. **Disputa no alto pesa o quê?** Recomendo **força 45%, tamanho 35%, posicionamento 20%**, sem atributo novo.
   Voador ganha bônus próprio (+10%) ou só via golpe (Fly, Sky Attack)? Recomendo **só via golpe**, pra não dar
   mais um bônus ao tipo que já vence 56% (calibrate de hoje).
5. **Jogo aéreo só no escanteio?** Recomendo **sim** (como decidido em 16/10: futsal é de chão).
6. **Golpe na bola parada?** Recomendo **sim**, com a lista da opção B (cobrador: Swift, Egg Bomb, Gust/Whirlwind;
   cabeçada: Headbutt, Skull Bash sem carga, Jump Kick/Hi Jump Kick, Fly/Sky Attack/Drill Peck, Body Slam),
   gastando PP normal.
7. **Gol olímpico** (direto do escanteio) só com golpe de vento? Recomendo **sim**, raro (~1 a cada 30–50
   copas), com drama próprio.
8. **O que o técnico decide?** Recomendo **instrução de escanteio (Na área / Curta / Variar)** trocável como a
   tática + **cobrador** escolhível na escalação (padrão: melhor passe). Sem pausa a cada escanteio (opção C fica
   pro modo jogável).
9. **Lateral cobrado com o pé (kick-in)?** Recomendo **não**: as paredes dão ritmo (igual Rematch e Mario
   Strikers). No futsal real o lateral rende tantos gols quanto o escanteio, então fica anotado pra um
   "modo regras oficiais" ou pro futebol de campo (0.11).
10. **Tiro de meta com a mão?** Recomendo **só trocar a animação** (goleiro lança com a mão) quando sobrar tempo,
    sem mexer no motor. Fora da 0.8.5.
11. **Como aparece?** Recomendo **faixa "ESCANTEIO" curta + nome da jogada**, "NO ALTO!" na disputa, câmera
    lenta só quando vira chance, e escanteio contando como lance no Lances.
12. **Selo "Jogo aéreo" no painel do Pokémon** (carta = campo)? Recomendo **sim**, só no painel (a carta não
    muda).

## Fontes

Regras e dados reais:
- [FIFA Futsal Laws, Lei 17: escanteio (The FA)](https://www.thefa.com/football-rules-governance/lawsandrules/laws/futsal/law-17---the-corner-kick)
- [FIFA Futsal Laws, Lei 16: tiro de meta (The FA)](https://www.thefa.com/football-rules-governance/lawsandrules/laws/futsal/law-16---the-goal-clearance)
- [FIFA Training Centre: escanteios na Copa do Mundo de Futsal](https://fifatrainingcentre.com/en/game/tournaments/fifa-futsal-world-cup/corners.php)
- [Futsalfeed (Mirko Vrcan): análise de gols nas 8 principais ligas europeias](https://futsalfeed.com/columns/authors/mirko-vrcan/posts/goal-scoring-analysis-in-top-8-european-futsal-leagues)
- [FIEP Bulletin 2021: gols de bola parada do Joinville (35 jogos)](https://ojs.fiepbulletin.net/fiepbulletin/article/download/6397/54615894/54616409)
- [futsal.tech: escanteio em triângulo](https://futsal.tech/en/set-play/ck/ck-attack-1)
- [Sport Session Planner: defesa de escanteio no futsal (Oxford University)](https://sportsessionplanner.com/s/kGjui/Oxford-University-Defensive-Set-Up---Corners-Cup-Match.html)
- Futebol de campo, pra comparar: [Ardá Suárez et al., escanteios na Copa de 2010](https://archives.rpd-online.com/article/view/v23-n1-arda-maneiro-rial-etal.html)

Jogos:
- [Team Gullit: bola parada no EA FC 25](https://www.teamgullit.com/ea-sports-fc-25/set-pieces) e [Anfield Index: FC IQ](https://anfieldindex.com/?p=80297)
- [PES Mastery: escanteio no eFootball](https://pesmastery.com/efootball-corner-kick-tutorial/)
- [FM Scout: bola parada no Football Manager](https://www.fmscout.com/a-how-to-manage-set-pieces-on-football-manager.html) e [guia de atributos](https://www.fmscout.com/a-utilizing-player-attributes-guide-2022.html)
- [Sensible Soccer 2006: dicas (aftertouch)](https://swosunited.com/forum/sensible-soccer-2006/1445-sensible-soccer-2006-hints-amp-tips)
- [Captain Tsubasa Vol. II (Wikipedia)](https://en.wikipedia.org/wiki/Captain_Tsubasa_Vol._II:_Super_Striker) e [Hardcore Gaming 101](https://www.hardcoregaming101.net/captain-tsubasa/)
- [Inazuma Eleven: Victory Road, sistemas de partida (Gematsu)](https://gematsu.com/2023/08/inazuma-eleven-victory-road-details-new-in-match-systems-victory-road-mode-more)
- [Mario Strikers: Battle League (Wikipedia)](https://en.wikipedia.org/wiki/Mario_Strikers:_Battle_League) e [review da Shacknews](https://shacknews.com/article/130746/mario-strikers-battle-league-review-soccer-riot)
- [Rematch (A.V. Club)](https://www.avclub.com/rematch-preview-sloclap-sifu-soccer-videogame)
- [Captain Tsubasa: Rise of New Champions (Siliconera)](https://www.siliconera.com/captain-tsubasa-rise-of-new-champions-gameplay-details-for-special-skills-moves-more/)

Simuladores:
- [Google Research Football: `academy_corner.py`](https://github.com/google-research/football/blob/master/gfootball/scenarios/academy_corner.py) e [artigo (arXiv 1907.11180)](https://arxiv.org/pdf/1907.11180)
- [RoboCup Soccer Simulator: visão geral (juiz e modos de jogo)](https://rcsoccersim.readthedocs.io/en/latest/overview.html)

## Decidido com o Miguel (17/10)

Opção B completa na 0.8.5, com todas as recomendações das decisões 1 a 12 acima: 3–4 escanteios por jogo e ~10% de
conversão (corta na quantidade se passar de 7 gols por jogo); nasce da espalmada pra fora e do desvio no bloqueio;
disputa no alto força 45% / tamanho 35% / posicionamento 20% (Voador sem bônus próprio); golpe na bola parada
gastando PP; gol olímpico raro, só com golpe de vento; técnico escolhe a instrução (Na área / Curta / Variar,
trocável como a tática) e o cobrador na escalação, sem pausa; lateral continua nas paredes; faixa "ESCANTEIO",
"NO ALTO!", câmera lenta só quando vira chance e conta no modo Lances; selo "Jogo aéreo" só no painel. Números de
antes e depois pro ok do Miguel antes de lançar (skill `soccermon-balanceamento`).
