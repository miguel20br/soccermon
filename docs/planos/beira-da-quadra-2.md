---
description: Beira da quadra 2 (agência do técnico): golpe máximo na hora certa, defesa máxima, sem gritos, goleiro-linha e troca volante, com os números do robô (ENGINE_VERSION 10).
---

# Beira da quadra 2 (21–22/10/2026)

Segunda rodada da agência do técnico (pesquisa em [pesquisas/agencia.md](pesquisas/agencia.md)). **Sai do experimento na
0.9.6** (Miguel, 22/10): ligada pra todos, sem a opção em Configurações nem o `?agencia=1`; na Copa o rival sempre tem o
técnico IA. Pedido do Miguel em 21/10:

- **Golpe máximo** só acende na hora certa e sai na hora do toque: capitão de linha com a bola na zona de chute (até
  15 m do gol e xG ≥ 0,06; desde 22/10, zona pela posição, ver abaixo); capitão goleiro = **defesa máxima** (rival com a bola na zona dele: 4 s em que o chute que
  ele alcança é defendido, alcance x1,25, segura e sai jogando; sem chute, a barra volta pela metade). Barra 22 ⇒ 18.
  Botão grande na quadra e câmera lenta enquanto acende (só Copa). Rival IA usa na hora certa, sem aviso.
- **Gritos fora** (regra, tela, narração, técnico rival). Ordem de grito antiga (Duelo, save) é ignorada.
- **Goleiro-linha** na hora, com 5 contra 4: passe x1,12, chute x1,10, linha 2 m mais alta com a bola; o rival chuta
  no gol vazio de até 26 m se o goleiro estiver a mais de 7 m do gol.
- **Troca e prancheta volantes**: valem na hora com a bola rolando; quem entra vem da lateral perto do banco; quem está
  com a bola só sai quando soltar.

Código: `src/engine/agency.ts`, `match.ts` (`startMax`, `updateMax`, `maxShot`, troca volante), `rival-coach.ts`,
`src/ui/components/Sideline.tsx`, `MatchScene.ts` (câmera lenta). Demo: `?demo=maximo`.

## O que foi terminado em 22/10

- Merge da 0.9.5 (formações). Com as formações novas o fixo quase não chega na zona com a bola: o teste do golpe de
  linha passou a usar capitão pivô.
- **Golpe máximo saía tarde:** a ordem entrava no tick seguinte ao da tela, depois da decisão do capitão; se a IA
  chutasse naquele tick, o lance passava (o técnico rival chamava o golpe e nada acontecia). Agora a ordem (botão,
  rival e robô) entra antes da decisão do quadro da tela.
- **Botão com folga** (o "latched cue" que ficou pela metade): aceso mais 0,3 s de jogo depois da hora certa
  (`MAX_CUE_LATCH`, ~1,2 s na câmera lenta), pra não piscar quando o capitão dribla na beira da zona. Tocou nessa
  folga, a ordem fica armada 5 s e a bola procura o capitão.

## Números (motor 10, 200 partidas pareadas, ±1σ)

Técnico robô (`scripts/balance/coach.ts 200 out 4 max,flyGk,timeout`; rival sem técnico). "random" usa em hora
sorteada, "good" usa com regra simples:

| Mecânica | Política | Vitória | Δ vs nunca (pp) | Extra |
|---|---|---:|---:|---|
| nada | — | 47,5% | — | pênaltis 19% |
| Golpe máximo (capitão do draft) | random | 49,0% | +1,5 ±1,5 | sai 0,21/jogo, gol 0,04 |
| Golpe máximo | good | 45,5% | −2,0 ±2,5 | sai 0,42/jogo, gol 0,09 |
| Defesa máxima (capitão goleiro) | random | 57,0% vs 51,0% | +6,0 ±2,2 | defesa 0,41/jogo |
| Defesa máxima | good | 53,0% vs 51,0% | +2,0 ±2,7 | defesa 0,46/jogo |
| Goleiro-linha | random | 48,0% | +0,5 ±3,7 | 0,55 gol pró, 0,55 contra |
| Goleiro-linha | good | 47,0% | −0,5 ±2,2 | 0,18 pró, 0,20 contra |
| Pedido de tempo | random | 52,0% | +4,5 ±4,6 | — |
| Pedido de tempo | good | 51,5% | +4,0 ±4,2 | — |

Goleiro-linha por situação (`scripts/balance/goleiro-linha.ts 200`; mesma partida com e sem, ±1σ):

| Situação | n | Vitória sem ⇒ com | Δ (pp) |
|---|---:|---|---:|
| 33' perdendo por 1 | 70 | 21% ⇒ 29% | +7,1 ±7,4 |
| 37' perdendo por 1 | 61 | 7% ⇒ 16% | +9,8 ±5,6 |
| 33' / 37' perdendo por 2 | 42 / 47 | 2% ⇒ 2% / 0% ⇒ 2% | ~0 |
| 37' empatado | 37 | 54% ⇒ 46% | −8,1 ±9,8 |
| 37' ganhando por 1 ("à toa") | 61 | 93% ⇒ 85% | −8,2 ±4,8 |

Ou seja: vale perdendo por 1 no fim e custa quando não precisa. É o desenho pedido.

Hora do golpe máximo por posição do capitão (100 partidas por capitão, sem ordem; % das partidas com pelo menos uma
hora certa depois da barra cheia):

| Capitão | barra cheia | com hora certa |
|---|---:|---:|
| Pivô | 100% | 88% |
| Ala | 100% | 45% |
| Fixo | 100% | 11% |
| Saiu de quadra antes | 86% | 0% |

## Zona por posição (aprovada em 22/10, 0.9.6)

Decisão do Miguel: pivô 15 m, ala 18 m, fixo 22 m (`AGENCY.maxZone` em `src/engine/agency.ts`, regra única de botão,
motor, IA, técnico rival e robô). O xG mínimo de 0,06 só chega a ~19,8 m no meio, então o fixo usa 0,05 (a 22 m de
frente dá 0,055). O goleiro capitão (defesa máxima) continua com o rival a 15 m.

Hora certa por capitão (`scripts/balance/maximo-zona.ts 100`, 1-2-1, sem ordem; % das partidas com o capitão de bola
na zona com a barra cheia). A conta é mais justa que a da tabela acima (lá não contava a troca do capitão):

| Capitão | antes | depois | horas certas/jogo antes ⇒ depois | saiu de quadra antes da hora |
|---|---:|---:|---|---:|
| Pivô | 62% | 62% | 1,45 ⇒ 1,45 | 32% |
| Ala | 34% | 88% | 0,44 ⇒ 3,19 | 15% ⇒ 10% |
| Fixo | 6% | 67% | 0,08 ⇒ 1,49 | 0% |

O pivô fica atrás do ala porque a IA troca o pivô cansado (32% das partidas ele sai antes da hora certa).

Técnico robô, golpe máximo (`coach.ts 400 … 4 max`, capitão do draft; ±1σ):

| Política | Δ vs nunca antes ⇒ depois (pp) | sai/jogo | gol/jogo |
|---|---|---|---|
| random | +1,3 ±1,0 ⇒ +1,8 ±1,6 | 0,21 ⇒ 0,49 | 0,05 ⇒ 0,16 |
| good | +2,5 ±1,8 ⇒ +3,5 ±2,4 | 0,41 ⇒ 0,64 | 0,10 ⇒ 0,18 |

Números finais da 0.9.6 (n=400): calibrate 7,92 gols/jogo (meta 5–7, igual à 0.9.5 com MTs), favorito 65,8%,
goleadas 1,8%. Formações: 1-2-1 50%, 2-2 51%, 3-1 47%, 4-0 50%, 1-1-2 51%, Ferrolho 52%. Copa (360 copas, agora com o
técnico IA do rival, como no jogo; o jogador simulado não usa a beira da quadra): oitavas 76% ⇒ 74%, quartas 65% ⇒ 62%,
semi 61% ⇒ 58%, final 52% ⇒ 49%, título 16% ⇒ 13% (±4 pp). O rival com técnico deixa a copa ~3 pp mais difícil por
fase pra quem não usa a beira da quadra.

## Em aberto (decisão do Miguel)

1. ~~Capitão fixo quase nunca tem golpe máximo~~: zona por posição, aprovada e medida acima.
2. **Golpe máximo de linha vale pouco** (−2 a +1,5 pp, dentro do ruído; 1 gol a cada ~10 partidas). A defesa máxima
   vale mais (+2 a +6 pp). Se a ideia é ser um momento grande, dá pra subir o chute máximo (hoje força x1,55 e
   precisão x1,6).
3. ~~Sai do experimento?~~ Sai na 0.9.6. Os números não mostram nada quebrado. Falta ele jogar umas partidas no link de prévia
   (simulação não é diversão), principalmente o botão grande e a câmera lenta no celular.
