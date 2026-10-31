---
description: Golpe máximo universal (todo capitão chuta; o do goleiro capitão é a bicuda, que é o parry), efeito na bola automático e o N3 com cena de especial; decisões de 30/10/2026.
---

# Golpe máximo universal + bicuda (30/10/2026)

Ideia de um amigo do Miguel, que ele aprovou ("concordo com tudo") em 30/10/2026. Motivo: a defesa máxima do goleiro é confusa,
só vale no N3 e quase ninguém usa. Agora todo golpe máximo é um chute; o do goleiro capitão é a bicuda (o parry).
Protótipo na branch `golpe-universal`. A 0.9.28 sai antes, sem isto.

## Regras

**Capitão de linha: o golpe máximo é o chute.**

| Nível | Efeito |
|---|---|
| N1 | Chute forte + **status do tipo** em quem bloqueia ou defende. |
| N2 | O N1 + **derruba os jogadores de linha na linha do chute** (o goleiro não cai). |
| N3 | **Sempre no alvo** (a bicuda do goleiro capitão rival ainda pode devolver) + o N2 + o efeito do tipo ou a assinatura de hoje, com a **cena de especial** (estilo Street Fighter) antes do chute. |

Status por tipo (ponto de partida): Fogo queima, Elétrico paralisa, Venenoso envenena, Gelo congela, Psíquico confunde,
Normal atordoa. Fantasma fica como está na tabela (confunde); nada de status que não existe nos jogos. Os outros tipos se
fecham com o Miguel.

**Goleiro capitão: o golpe máximo dele é a bicuda, e a bicuda é o parry** (correção do Miguel, 30/10/2026: uma mecânica
só, sem botão de parry à parte e sem parry pra goleiro que não é capitão).
- Com a barra pronta, o chute do rival que o goleiro vai alcançar mesmo (golpe máximo do rival inclusive) acende a hora
  certa: o mesmo anel do golpe máximo, na chegada da bola. Chute que um zagueiro bloqueia antes, que vai pra fora ou na
  trave, ou que passa longe do goleiro não acende (Miguel, 30/10/2026). O motor solta o evento `gkReach` quando o goleiro
  capitão chega na bola; a tela olha à frente nos eventos (`bicudaCueNear`), do chute até um tick antes do toque.
- O toque vale só pra aquele chute (Miguel, 30/10/2026): o pedido prende no chute do rival que está no ar (ou no que vem,
  se o rival já está com a bola na zona do goleiro) e some com ele, sem gastar a barra, se o goleiro não chegar nela.
  Fora dessa hora a ordem nem arma (o toque atrasado não fica 5 s esperando o chute seguinte).
- Toque na hora (bom ou perfeito): em vez de encaixar, o goleiro devolve com a bicuda e derruba quem estiver no caminho.
  N1 e N2: lançamento forte pro companheiro mais à frente no campo rival (o N2 derruba a linha no caminho). N3: chute
  N3 no gol rival (sempre no alvo, status, efeito do tipo), mas o goleiro rival defende como num chute normal (sem o
  alcance e a chance reduzidos do N3): não é gol automático.
- Toque fora: a defesa de sempre daquele chute. Gasta a barra (evento `max` `miss`, a tela mostra o "fora").
- Gasta a barra toda, como o golpe máximo de linha.
- O rival usa a mesma regra pelo técnico IA quando o goleiro dele é o capitão (arma quando o nosso atacante entra na
  zona, nota sorteada como a do golpe máximo; o pedido vale só pro chute seguinte e some com ele).

**Efeito na bola (pedido do Miguel, automático desde 30/10/2026):** todo golpe máximo, em qualquer nível, curva sozinho
pro canto longe do goleiro, sem arrastar. Usa a mesma conta da curva do Psíquico, com metade do teto. O N3 Psíquico fica
com a curva dele, mais forte, sem somar.

## Polimento (pedido do Miguel: "tudo bem polido, a música na medida, efeitos especiais legais")

- A cena do N3: congela a tela, close no capitão, fundo na cor do tipo, o nome do golpe gigante, depois o chute.
- Sons e estouros próprios pra bicuda, na família do pacote D.
- A música abaixa só na hora certa e volta com a virada.

## Motor

- Muda o resultado das partidas: motor 17 e republicar a `liga`.
- Os números de antes e depois vão pro Miguel antes de valer. Medir com `npm run calibrate -- --n 400 --agencia` e
  `scripts/balance/coach.ts`.

## Números do motor 17 (n=400, 30/10/2026; aprovados em 30/10)

Bicuda = parry (regra corrigida de 30/10). `calibrate --agencia` (os dois times com o técnico IA) e
`scripts/balance/coach.ts` (técnico robô, 400 partidas por política). O motor 16 é o da `main` (o motor não mudou nos 38
commits da 0.9.28, então a coluna é a medida antes, com as mesmas seeds); a coluna do meio é o protótipo anterior (parry à
parte, já removido).

| Medida | Motor 16 (main) | Motor 17 com parry à parte (saiu) | Motor 17 (bicuda = parry) |
|---|---:|---:|---:|
| Gols/jogo | 8,10 | 7,77 | 8,29 |
| Golpe máximo por jogo (N1/N2/N3) | 0,86 (0,04/0,48/0,34) | 0,96 (0,05/0,56/0,34) | 0,94 (0,04/0,56/0,33) |
| Golpe de linha que vira gol (N1/N2/N3) | 55% (24/36/93) | 15% (16/11/24) | **72%** (40/63/93) |
| Bicudas por jogo (N1/N2/N3) | — | 0,15 (0/0,07/0,08) | 0,14 (0/0,07/0,07) |
| Bicuda N3 que vira gol (do time, em 4 s) | — | 6% | **92%** |
| Bicuda com toque fora (vira defesa, gasta a barra) | — | — | 0,01/jogo |
| Técnico robô de linha, Δ vitória (random/good/n1/n3) | +2,3 a +5,3 pp | +6,3 a +11,5 pp | +10,5 / +8,5 / +10,0 / +6,0 pp (±2–3) |
| Técnico robô goleiro, Δ vitória (random/good/n1/n3) | +3,3 a +4,3 pp | +9,0 a +12,8 pp | +7,8 / +10,5 / +11,3 / +7,5 pp (±2–3) |
| Técnico robô contra o técnico IA (good / n3) | +2,5 / +4,8 pp | +5,0 / +4,3 pp | +8,5 / +6,5 pp |
| Robô goleiro: bicudas por jogo (good), gol do time depois | — | — | 0,86 (N1/N2/N3 0,50/0,20/0,16), 0,14 gol |

**Aprovado em 30/10 (Miguel):** a bicuda N3 fica como está (92% de gol); o golpe de linha fica mais forte como está
(72%); o toque fora da bicuda gasta a barra. Os números do motor 17 valem assim.

### Anel só no chute que chega (30/10/2026, depois da aprovação)

O anel da bicuda acende só no chute que o goleiro capitão alcança e o toque vale só pra ele (regras acima). Medida com o
mesmo `calibrate --n 400 --agencia` (mesmas seeds); só a bicuda e o golpe máximo mudam, os números não foram mexidos:

| Medida | Antes (toque armado 5 s) | Depois (só aquele chute) |
|---|---:|---:|
| Gols/jogo | 8,29 | 8,29 |
| Golpe máximo por jogo (N1/N2/N3) | 0,94 (0,04/0,56/0,33) | 0,92 (0,04/0,55/0,33) |
| Bicudas por jogo (N1/N2/N3) | 0,14 (0/0,07/0,07) | 0,12 (0/0,06/0,06) |
| Bicuda N3 que vira gol (do time, em 4 s) | 92% | 92% |
| Bicuda com toque fora | 0,01/jogo | 0,01/jogo |
| Goleiro capitão alcança o chute (`gkReach`) | — | 4,73/jogo |

Na tela (`?demo=maximo&goleiro=1&nivel=3`, headless 390x844): o botão acendeu 6 ticks antes do chute que o Snorlax
alcançou e a bicuda N3 saiu no toque dele na bola, logo depois do toque na tela.

O que estava em aberto antes da decisão:
- **Bicuda N3 ainda é quase gol certo (92%; robô goleiro n3: 85%)**, mesmo passando pela defesa normal do goleiro rival:
  hipótese (não medida): o chute N3 sai a ~2,2x de força, a conta de defesa do goleiro cai pro piso (5%) com bola tão
  rápida, e a curva automática leva pro canto (no teste com o goleiro parado, a curva sozinha já tira a bola do alcance). Pra ficar defensável de verdade, opções: a bicuda N3 com menos força (ex.: a do N2), ou
  um piso de defesa maior pra ela. Nada mexido.
- O golpe de linha voltou a valer (72% de gol, contra 55% no motor 16): o N1 e o N2 subiram muito (24⇒40%, 36⇒63%).
- O técnico robô ganha +6 a +11 pp de vitória com o golpe máximo (motor 16: +2 a +5): o golpe máximo pesa mais no
  resultado.
- Toque fora da bicuda: gasta a barra (como pedido "gasta como o golpe máximo"). Alternativa: não gastar no fora.
