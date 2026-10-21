# Acréscimos e Pressão final (21/10/2026, branch `pressao`)

Pedido do Miguel: "adicionar acréscimos de 1 a 3 minutos no jogo" e, no lugar de um empurrão escondido pro gol no fim
(o "script" do FIFA), uma **Pressão final** que aparece na tela. A regra é aberta e igual pros dois times, então vale
no Duelo e na Liga sem dar vantagem a ninguém. `ENGINE_VERSION` 7.

## Como ficou

- **Acréscimos** (`STOPPAGE` em `src/engine/config.ts`, `stoppage` no `MatchConfig`): quando o tempo normal acaba, o
  motor sorteia 1 a 3 minutos no `rng` da partida (mesma seed = mesmos acréscimos) e avisa com o evento `stoppage`. O
  relógio fica parado no 20' (ou 40') e o placar mostra a plaquinha **+2'**; a narração diz "Acréscimos: +2". Um
  minuto de acréscimo dura o mesmo que um minuto do relógio (9 s de jogo, 180 ticks), mais as bolas paradas.
- **Pressão final** (`FINAL_PRESSURE` e `finalPressureTeam` em `src/engine/effective.ts`): do minuto 37 até o apito
  final (acréscimos incluídos), quem está perdendo ganha +6% de chute, +4% de passe e drible e +3% de velocidade, e a
  IA sobe o time (o mesmo empurrão da tática: `attack` +1,5, `defend` +1, `pressBias` +0,03). Empatou, acabou;
  virou, passa pro outro lado. O placar mostra o selo vermelho **PRESSÃO FINAL** em cima do lado de quem perde (fade
  de 250 ms), e a narração avisa quando começa.
- O minuto exibido nunca passa de 40: estatísticas, minutos jogados, barra de pressão e os trechos de seed do Duelo
  continuam iguais. Os acréscimos do 1º tempo ficam no trecho 10 (o mesmo do começo do 2º tempo) e os do 2º no trecho
  20, junto dos pênaltis.
- Atalho: `?demo=acrescimos` (escalação de uma partida que você perde; ao começar já está na Pressão final, a 3 s dos
  acréscimos).

## Números (400 partidas, os mesmos times do `npm run calibrate`)

`npx tsx scripts/balance/pressao.ts 400`. "Perdia no 37": quem estava atrás no placar no minuto 37 do 2º tempo; conta
o placar do tempo normal (empate vai pros pênaltis). Erro de 400 partidas: ±3 pontos no favorito; na coluna "perdia
por 1" (113 jogos) é ±4 pontos.

| regulagem | gols/jogo | empate no tempo normal | favorito vence | jogo com gol nos acréscimos | gols do 37 em diante | perdia no 37 e empatou/virou | perdia por 1 no 37 e empatou/virou |
|---|---|---|---|---|---|---|---|
| antes (0.9.0) | 6,84 | 15,5% | 62,6% | 0% | 0,43 | 4,5% | 12,4% |
| só acréscimos 1–3 | 7,49 | 14,5% | 61,9% | 43,8% | 0,73 | 6,9% | 18,6% |
| só Pressão final | 6,87 | 19,5% | 61,6% | 0% | 0,46 | 8,2% | 23,9% |
| **acréscimos 1–3 + Pressão (padrão)** | **7,59** | **19,0%** | **62,3%** | **44,5%** | **0,83** | **11,1%** | **27,4%** |
| acréscimos 1–3 + Pressão fraca | 7,56 | 15,0% | 63,3% | 44,8% | 0,80 | 8,4% | 23,9% |
| acréscimos 1–3 + Pressão forte | 7,69 | 23,0% | 61,6% | 45,8% | 0,86 | 15,5% | 31,9% |
| acréscimos 1–2 + Pressão (padrão) | 7,42 | 15,5% | 62,3% | 34,5% | 0,65 | 8,0% | 17,5% |

Regulagens (só os números mudam):

| | `lastMinutes` | chute / passe / drible / velocidade | `attack` / `defend` / `pressBias` |
|---|---|---|---|
| fraca | 3 | +3% / +2% / +2% / +1,5% | +0,75 / +0,5 / +0,015 |
| **padrão** | 3 | +6% / +4% / +4% / +3% | +1,5 / +1 / +0,03 |
| forte | 5 | +10% / +6% / +6% / +5% | +2,5 / +1,5 / +0,05 |

O que dá pra ler:

- **O drama do fim mais que dobra:** gol do 37' em diante quase dobra (0,43 → 0,83 por jogo), quase metade dos jogos
  tem gol nos acréscimos, e quem perde por 1 no 37' empata ou vira 27% das vezes (era 12%).
- **O favorito não muda** (62,3%, dentro da meta de 60–65%): a Pressão é igual pros dois lados e só vale pra quem
  perde.
- **A Pressão final leva ao empate, não à virada:** quando empata ela acaba, e aí os dois times jogam igual. Mais
  empates no tempo normal (15,5% → 19%) = mais pênaltis na copa.
- **Gols por jogo passam da meta (7,59 contra 5–7).** Quase tudo vem dos acréscimos em si (+4 minutos de jogo em média
  = +10% de tempo); a Pressão quase não mexe no total (6,84 → 6,87 sozinha).

## Decisões pro Miguel

1. **Gols acima da meta (7,6).** Recomendo deixar: diversão > realismo, e o gol a mais cai justo no fim, que é o
   drama que ele pediu. Se quiser voltar pra perto de 6,8: acréscimos de 1 a 2 (7,4) ou encurtar o tempo normal
   (`halfSeconds` 180 → 164 deixa o tempo total médio, com os acréscimos, igual ao de hoje; muda o ritmo do relógio e os trechos do Duelo, precisa de teste).
2. **Força da Pressão:** recomendo a **padrão**. A fraca quase não mexe nos empates; a forte começa no minuto 35 e
   leva 23% dos jogos aos pênaltis.
3. **Pra conferir jogando:** o selo e a plaquinha no placar (`?demo=acrescimos`), e se a narração "Pressão final!"
   aparece no momento certo.

## Ressalvas

- Simulação não é diversão: vale jogar umas partidas na prévia.
- Partida salva no meio com a versão antiga do motor recomeça do 0 a 0 (`ENGINE_VERSION` 7), e o replay guardado do
  gol da copa some, como em toda mudança de motor.
- Lançamento: a Liga refaz a partida no servidor com o motor empacotado: `npm run edge:liga` e
  `npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api` junto com a versão.
