---
description: Golpe máximo com barra em 3 níveis, toque na batida da música e defesa com timing; opções, determinismo (a nota do toque vira dado da ordem) e decisões pro Miguel.
---

# Golpe máximo em 3 níveis, na batida (proposta, 23/10/2026)

Ideia aprovada pelo Miguel em 22/10 ("golpe máximo com barra em 3 níveis, timing na batida e defesa com timing").
Em 23/10 ele aprovou as decisões 1 a 6 e 8 como recomendadas e **mudou a 7** (rival IA sorteia a nota; ver
[Decisões](#decisões-pro-miguel-recomendação-primeiro)). Implementado na branch `golpe-max` atrás de `?maximo3=1`
(motor 11); os números de força ainda esperam o ok dele ([Medida](#medida-23102026-n200)). Base: [beira-da-quadra-2.md](beira-da-quadra-2.md)
(golpe máximo de hoje), [balanceamento-geral.md](balanceamento-geral.md) §"Golpe máximo" (zona por posição) e o
relógio de batida da fase 1 do ritmo (`src/game/music.ts`, commit efb1599f).

## Como funciona hoje (motor 10)

- **Barra** (`maxCharge`, `src/engine/agency.ts`): sai só dos eventos do time. Desarme 1, defesa 1, gol 1,
  interceptação 0,5, chute 0,5, golpe que acertou 0,5. Perdendo por 1 enche 1,5x; por 2 ou mais, 2x. Cheia com 18
  pontos (`AGENCY.maxFull`). **Uma vez por partida** (`used`).
- **Hora certa** (`inMaxZone`/`maxCue`): capitão de linha com a bola na zona da posição dele (pivô 15 m, ala 18 m,
  fixo 22 m, com xG mínimo). Com capitão goleiro, a hora é o rival com a bola a 15 m. O botão só acende aí, com
  0,3 s de folga (`MAX_CUE_LATCH`) e câmera lenta (`MAX_CUE_SLOW = 0.25`, `MatchScene`).
- **Ordem** `{ kind: 'max', tick, team }` (`AgencyOrder`, `src/engine/state.ts`). Na Copa entra no tick do quadro
  da tela (`Match.tsx`, `sendMax`, resimula a partida com a agenda inteira). No Duelo vai carimbada `CHANGE_LEAD_TICKS`
  (40) à frente. Fica armada 100 ticks (`maxArmTicks`).
- **Efeito de linha** (`maxShot`, `match.ts`): o chute da zona sai com o golpe-assinatura, força x1,55 e precisão
  x1,6. **Defesa máxima** (`updateMax`/`gkMaxSave`): 4 s em que o chute que o goleiro alcança é defendido, alcance
  x1,25, segura e sai jogando. Se não vier chute, devolve meia barra.
- **Números** (técnico robô, n=400): golpe de linha +1,8 a +3,5 pp de vitória (dentro do erro, ~0,16–0,18 gol/jogo);
  defesa máxima +2 a +6 pp. O golpe de linha ainda vale pouco pra um "momento grande" (item 2 em aberto de
  beira-da-quadra-2).

### Quanto a barra enche numa partida (medido agora, motor 10, 100 partidas = 200 times, sem ordem)

Pontos sem teto e sem trava de "usado" (`scripts/balance/barra-niveis.ts 100`, mesma conta do `maxCharge`):

| Pontos | times que chegam | minuto mediano (de 40) |
|---:|---:|---:|
| 6 | 100% | 5,5 |
| 9 | 100% | 8,6 |
| 12 | 100% | 11,4 |
| 18 (hoje: barra cheia) | 100% | 17,6 |
| 24 | 100% | 21,1 |
| 27 | 99% | 23,6 |
| 36 | 86% | 30,7 |

Mediana de 45,5 pontos por time e por jogo (38 sem o bônus de quem está perdendo; mínimo 26, máximo 90,5). Ou seja,
cabem uns 3 a 4 "gomos de 12" por partida.

## A barra de 3 níveis: opções

### Opção 1: solta o que tiver (simples, recomendo)

- Barra de 3 gomos, **12 pontos cada** (N1 ~min 11, N2 ~min 21, N3 ~min 31; 86% dos times chegam no N3).
- O botão acende na hora certa a partir do N1. O toque **gasta a barra toda** e o golpe sai no nível em que ela estava.
  Depois a barra volta a encher do zero, então não é mais "1 por partida".
- A decisão vira "solto o N1 agora ou seguro pro N3 no fim?". É o padrão "recurso escasso que se renova" da pesquisa
  ([pesquisas/agencia-referencias.md](pesquisas/agencia-referencias.md), padrão 1). O risco de segurar é real: o
  capitão pode sair cansado (o pivô sai antes da hora certa em 32% das partidas).
- Efeito inicial (o robô ajusta):

| Nível | Capitão de linha (força / precisão do chute) | Capitão goleiro (defesa máxima) |
|---|---|---|
| N1 | x1,25 / x1,3 ("golpe forte") | 2 s, alcance x1,1 |
| N2 | x1,55 / x1,6 (o máximo de hoje) | 4 s, alcance x1,25 (hoje) |
| N3 | x1,8 / x2,0, goleiro rival com alcance x0,8 nesse chute, animação grande (estilo Dinamax) | 6 s, alcance x1,4, sai jogando |

- Motor: pouca coisa. `maxCharge` passa a devolver `level` (0–3) e os pontos continuam contando depois do uso;
  `maxShot` e a defesa leem o nível guardado em `agency.max`.

### Opção 2: gomos como moeda (estilo Street Fighter)

- Cada toque gasta **1 gomo** (efeito N1). Segurar o botão escolhe gastar 2 ou 3, e a ordem leva `level`.
- Mais flexível, mas segurar o botão no celular durante a câmera lenta é ruim, e "gastar 1 de 3" quase sempre ganha
  de esperar. A decisão fica mais pobre. Não recomendo.

### Opção 3: cada nível é outra coisa (rico, caro)

- N1 = chute máximo do capitão (o de hoje, um pouco mais fraco). N2 = **combo**: o capitão toca pra um companheiro e
  recebe na frente (tabela automática), chute N2. N3 = **golpe máximo de verdade**, com efeito de área pelo tipo do
  golpe (derruba quem está perto, congela, paralisa).
- É o mais bonito, só que o N3 é exatamente a frente "golpe máximo por tipo" (na fila). Melhor fazer a Opção 1 agora
  e deixar o efeito do N3 como o gancho dessa frente.

## Timing na batida, sem quebrar o determinismo

**Regra:** o motor nunca lê relógio de áudio nem `Date`. O toque vira uma ordem com **tick e nota** (`q`: 0 = fora,
1 = bom, 2 = perfeito). A nota é **dado da ordem**, igual ao `on` do goleiro-linha. Mesma agenda dá a mesma partida em
Copa, Duelo, Liga e replay.

1. **Na tela** (`Sideline`/`Match.tsx`/`DuelMatch.tsx`): com o botão aceso, um anel fecha em cima do botão no ritmo
   da música (`beatNow()` dá `phase` e `bpm`; o `heardTime()` já desconta a latência de saída do áudio).
2. **No toque** (`pointerdown`): distância até a batida mais perto = `min(phase, 1 − phase) × 60/bpm`. Até ±70 ms é
   **perfeito**, até ±150 ms é **bom** e o resto fica **fora** (a 120 BPM a batida tem 500 ms, então os dois
   primeiros cobrem ~60% do tempo). Uma constante de ajuste (`MAX_BEAT_OFFSET_MS`) fica pra calibrar no celular e no
   fone Bluetooth.
3. **A ordem** sai do jeito de hoje (`{ kind: 'max', q }`): tick do quadro na Copa e carimbo +40 no Duelo. A câmera
   lenta não atrapalha, porque a música segue no tempo real e a batida é medida no áudio, não no tick.
4. **No motor** a nota escala só a parte extra do nível: perfeito 100%, bom 70% e fora 40% (fora nunca zera, porque
   diversão vem antes de punição). Exemplo N2: perfeito x1,55, bom x1,385, fora x1,22. O evento `max`/`hit` passa a
   levar `level` e `q`, e a tela (inclusive o rival no Duelo e o replay) mostra "PERFEITO!" a partir do evento.
5. **Sem música** (volume 0, áudio travado): o anel segue um pulso visual fixo (100 BPM, `performance.now`) e a nota é
   medida contra ele. Funciona sem som e pra quem não ouve.
6. **Ordem antiga sem `q`** (save no meio da partida, cliente velho): vale como bom. O Duelo e a Liga já recusam
   versão de motor diferente.

**Liga e trapaça:** a nota vem do cliente, então quem mexer no código pode mandar sempre "perfeito". Não dá pra
provar o toque no servidor sem o áudio, e isso também vale pro tick, que o cliente já escolhe. O ganho máximo é
pequeno: um golpe, e a diferença perfeito/bom é 0,165 de força no N2. Proposta: aceitar e só validar `q ∈ {0,1,2}`
no `validOrder`.

**IA rival** (`rival-coach.ts`, decisão 7 como o Miguel mudou em 23/10): a nota **é sorteada**, num Rng próprio da seed
da partida (`coach-max-<time>`, igual ao "humor" do técnico: determinístico e sem mexer nos outros sorteios da
partida). A chance depende do rival (`RIVAL_COACH.maxGradeOdds`):

| Rival | perfeito | bom | fora |
|---|---:|---:|---:|
| comum: os líderes de ginásio (Brock a Giovanni, Agatha) | 25% | 55% | 20% |
| final: o Lance (Liga Índigo, final da Copa e da Rota) | 55% | 35% | 10% |

Hoje só líder tem técnico IA (treinador de rota da Rota Índigo não tem, `cupRival`), então "comum" são os líderes e
"líder/final" ficou sendo o Lance. Se quiser os líderes de ginásio também na tabela de cima, é uma linha. Solta no N2
ou no N3, ou no N1 se estiver perdendo do minuto 30 em diante (`maxN1From`). O técnico robô
(`scripts/balance/coach.ts`) ganha a nota sorteada fora do motor (40% perfeito, 40% bom, 20% fora) e as políticas
"solta no N1" e "segura pro N3".

## Defesa com timing

### D1: na batida, igual ao ataque (recomendo)

O goleiro capitão acende do jeito de hoje (rival com a bola a 15 m). O toque na batida arma a defesa máxima, o nível
dá a duração e o alcance (tabela da Opção 1) e a nota escala o alcance extra. Perfeito também **segura e sai jogando**;
bom e fora espalmam. A regra é a mesma em todos os modos e na mesma interface, e o Duelo funciona do jeito que já
funciona.

### D2: reflexo no chute ("parry")

O botão acende quando o rival **chuta** da zona, e um anel fecha na chegada da bola. A nota sai da distância entre o
toque e a chegada, medida em tempo de jogo. É mais emocionante e parece goleiro de verdade, mas:
- o voo da bola dura 0,5–1 s (10–20 ticks) e o Duelo manda a ordem 40 ticks à frente, então **não cabe no Duelo**. Ele
  ficaria com a D1, e seriam duas regras;
- a defesa sai da batida, e aí o "na batida" vira só do ataque.

### D3: desarme máximo do capitão de linha (extra)

Capitão de linha **sem** a bola e rival com a bola na nossa zona: o toque na batida dá um carrinho máximo (o motor já
tem `tackleBonus`) no portador. Isso dá um momento de defesa ao capitão fixo, que hoje quase só ataca. É mecânica
nova e pede medida própria; dá pra fazer depois.

## O que muda no motor

- `agency.ts`: `maxCharge` com níveis (`level`, pontos depois do uso), `AGENCY.maxLevels` (pontos por nível),
  `maxShot`/`maxGk` por nível e `maxGrade` (fator da nota).
- `state.ts`: `{ kind: 'max'; q?: 0 | 1 | 2 }` e o evento `max` com `level`/`q`; `validOrder` (Liga), `agencyStamp`
  e `OrderBody` do Duelo (`src/net/duel-state.ts`).
- `match.ts`: `startMax` guarda o nível e a nota em `agency.max`, e `maxShot`/`updateMax`/`gkMaxSave` usam os dois.
- **`ENGINE_VERSION` 10 ⇒ 11** (muda resultado de partida). Depois, `npm run edge:liga` e o deploy da Edge Function
  `liga`, junto com a publicação.
- Testes: `determinism.ts` (agenda com `q`), `agency.test.ts` (perfeito > fora no mesmo lance; N3 > N1; ordem sem `q`
  = bom; a barra volta a encher depois do uso) e o teste da Liga recusando `q: 7`.
- Save: nada a migrar (o campo é opcional na ordem guardada).
- Atrás de bandeira (`?maximo3=1`) até o Miguel jogar na tela ([ADR 0005](../adr/0005-modo-novo-so-no-ar-depois-de-jogado.md)).

## Medida (23/10/2026, n=200)

Números da Opção 1 como estão na tabela (nada ajustado: força final espera o ok do Miguel). Robô
(`scripts/balance/coach.ts`, rival parado, 200 partidas pareadas, ordem na hora certa, `MAX3=1` sorteia a nota 40/40/20)
e `npm run calibrate -- --n 200 --agencia [--maximo3]` (técnico IA nos dois times). "Antes" = motor 10 (1 nível; conta
como N2). ± = 1 desvio da diferença pareada.

**Capitão de linha (golpe máximo)**

| Política | Vitória (Δ vs nunca) | Gols pró / contra | Golpes/jogo (N1 / N2 / N3) | Gols do máximo/jogo (N1 / N2 / N3) |
|---|---|---|---|---|
| nunca usa | 47,5% | 3,81 / 3,94 | — | — |
| antes, bom (1ª hora certa, jogo apertado) | 48,0% (+0,5 ± 3,4) | 3,75 / 4,00 | 0,65 (— / 0,65 / —) | 0,17 |
| antes, aleatório | 50,0% (+2,5 ± 2,4) | 3,79 / 3,83 | 0,47 | 0,13 |
| depois, bom | 48,0% (+0,5 ± 3,4) | 3,73 / 3,92 | 1,19 (0,91 / 0,21 / 0,07) | 0,24 (0,16 / 0,06 / 0,02) |
| depois, n1 (solta no 1º gomo) | 49,0% (+1,5 ± 3,6) | 3,79 / 3,78 | 1,40 (1,09 / 0,24 / 0,06) | 0,28 (0,18 / 0,07 / 0,02) |
| depois, n3 (segura pro 3º) | 47,0% (−0,5 ± 1,8) | 3,75 / 3,92 | 0,44 (— / — / 0,44) | 0,09 |
| depois, aleatório | 52,5% (+5,0 ± 2,8) | 3,79 / 3,83 | 0,84 (0,36 / 0,24 / 0,23) | 0,27 (0,14 / 0,05 / 0,07) |

**Capitão goleiro (defesa máxima)**

| Política | Vitória (Δ vs nunca) | Gols pró / contra | Defesas/jogo (N1 / N2 / N3) |
|---|---|---|---|
| nunca usa | 51,0% | 3,75 / 3,64 | — |
| antes, bom | 53,0% (+2,0 ± 2,7) | 3,67 / 3,54 | 0,46 |
| antes, aleatório | 57,0% (+6,0 ± 2,2) | 3,71 / 3,40 | 0,41 |
| depois, bom | 56,5% (+5,5 ± 3,2) | 3,69 / 3,36 | 0,72 (0,57 / 0,11 / 0,04) |
| depois, n1 | 58,0% (+7,0 ± 3,4) | 3,75 / 3,23 | 0,93 (0,73 / 0,14 / 0,06) |
| depois, n3 | 51,5% (+0,5 ± 1,3) | 3,73 / 3,54 | 0,28 (só N3) |

**Calibrate com o técnico IA nos dois times**

| | Gols/jogo | Favorito vence | Goleadas | Golpes máximos/jogo (N1 / N2 / N3) | Viraram gol | Notas do rival (fora / bom / perfeito) |
|---|---:|---:|---:|---|---:|---|
| antes | 7,96 | 62,3% | 2,0% | 0,66 (0,12 de goleiro) | 0,22 | — |
| depois | 7,84 | 62,3% | 1,5% | 0,56 (0,02 / 0,39 / 0,15) | 0,17 | 0,10 / 0,28 / 0,18 |

O que dá pra ler (com o erro de ±3 pp, quase tudo é ruído no golpe de linha):
- **Gasta e recarrega dobra os golpes** (0,65 ⇒ 1,2–1,4 por jogo), mas quase tudo sai no N1, que é fraco: o golpe de
  linha continua valendo pouco em vitória (+0,5 a +1,5 pp). O "momento grande" ainda não apareceu nos números.
- **Segurar pro N3 não compensa:** com 3 gomos o capitão quase não tem mais a bola na zona (0,44 golpes/jogo) e o
  resultado fica igual a nunca usar. A decisão "solto agora ou seguro?" hoje tem resposta óbvia (solta).
- **A defesa ficou mais forte:** soltando a cada gomo, +7 pp (hoje +2 pp no "bom"); é o que a beira-da-quadra-2 já tinha
  cortado (+7 pp com alcance 1,8). O N1 de goleiro repetido é o que pesa.
- **O rival IA solta menos** (0,66 ⇒ 0,56 por jogo) porque espera o N2; gols e favorito ficam iguais.

Ajustes possíveis pro Miguel decidir (nada aplicado): (a) N3 mais forte e/ou gomo de 10 pontos pra o N3 chegar ~min 26;
(b) N1 de goleiro mais curto (1,5 s) ou sem o alcance extra; (c) N1 de linha x1,15 pra deixar a espera valer.

## Decisões pro Miguel (recomendação primeiro)

1. **Formato da barra:** Opção 1 (solta o que tiver, 3 gomos), a 2 (gomo como moeda) ou a 3 (cada nível é outra
   coisa)? *Recomendo a 1. O efeito especial do N3 fica pra frente "golpe por tipo".*
2. **Uso:** gasta e recarrega (dá pra usar várias vezes) ou continua 1 por partida? *Recomendo gasta e recarrega, com
   12 pontos por gomo (N3 lá pelo min 31, ~3 a 4 gomos por jogo).*
3. **Força por nível:** a tabela da Opção 1 como ponto de partida (N2 = o de hoje)? *Recomendo sim, ajustando com o
   robô e trazendo antes/depois.*
4. **Janelas e peso da nota:** perfeito ±70 ms, bom ±150 ms; efeito extra 100/70/40%? *Recomendo sim, com fora nunca
   zerando.*
5. **Sem música:** anel com pulso visual fixo (100 BPM)? *Recomendo sim.*
6. **Defesa:** D1 (na batida, igual ao ataque), D2 (reflexo no chute) ou D1 + D3 (desarme máximo)? *Recomendo D1
   agora e D3 numa rodada depois.*
7. **Rival IA:** ~~nota fixa~~ **sorteada** (Miguel, 23/10): comum 25/55/20 e final 55/35/10 (perfeito/bom/fora),
   soltando no N2/N3 (N1 só perdendo do min 30).
8. **Liga:** aceitar a nota do cliente (só checa 0–2)? *Recomendo aceitar, porque o ganho de trapacear é pequeno.*

## Depois do ok

1. Motor + testes + `ENGINE_VERSION` 11, atrás de `?maximo3=1`.
2. Robô (`coach.ts` com níveis e notas): antes ⇒ depois do golpe e da defesa por nível, calibrate n=400, copa
   (skill soccermon-balanceamento). Os números vão pro Miguel antes de fechar.
3. Tela: barra de 3 gomos no `Sideline`, anel da batida no botão, "PERFEITO!/BOM" (PT/EN, sem emoji), `?demo=maximo`
   com nível e nota. Prints em 320/390/1440 e deitado.
4. Miguel joga na prévia. Com o ok, tira a bandeira, faz as Novidades, `edge:liga` e o deploy, e publica numa 0.9.x.
