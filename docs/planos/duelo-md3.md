---
description: Plano e decisões do Duelo melhor de 3 (série, anulada e W.O.).
---

# Duelo: Melhor de 3 (21/10/2026)

Pedido do Miguel: "dar a possibilidade de fazer um modo MD3 no x1 também, com o mesmo time". Decidido pelo Claude
(padrões simples; o Miguel pode mudar qualquer um):

## Regras

- **Quem cria a sala escolhe** "1 jogo" (padrão, o de hoje) ou "Melhor de 3", junto com modo, velocidade e duração. O
  lobby mostra "Melhor de 3" na etiqueta da sala (como a duração), então o convidado vê antes do "Estou pronto".
- **Mesmo time a série inteira:** os 7 que cada um montou no draft (ou levou no Meu time). Cada jogo começa do time
  de antes do jogo 1: o que evolui dentro de um jogo não passa pro seguinte (o time da sala nunca muda pela partida,
  então isso já sai de graça).
- **Entre um jogo e outro:** a mesma Escalação lacrada de 30 s (formação, tática, escanteio, quem começa), já com o que
  cada um usou no jogo anterior. Os dois confirmam (ou o tempo acaba) e vem o VERSUS do jogo seguinte.
- **Seed nova por jogo:** cada jogo é uma partida nova da sala (`game` + 1), com corrente de lacres nova (o pedido de
  "Próximo jogo" leva o lacre, como a revanche de um toque). A seed base é `sala-jogo` e as seeds dos trechos saem dos
  lacres novos: outro jogo, mesma partida nas duas telas.
- **Placar da série** ("Jogo 2 · 1 x 0", o seu lado primeiro) na Escalação, no VERSUS e no resultado. Quem chega a 2
  vitórias leva. Resultado de um jogo que não decide: botão **Próximo jogo**. Resultado final: placar da série e o de
  cada jogo.
- **Empate não existe:** a partida do duelo é mata-mata (`FUTSAL_5.knockout`, pênaltis). Se um dia der empate, o jogo
  não conta pra ninguém e a série acaba no 3º jogo de qualquer jeito (quem tiver mais vitórias; igual = empate).

## O que muda no estado (`src/net/duel-state.ts`)

- `Shared.bestOf?: 3` (sem o campo = 1 jogo: sala de 1 jogo fica byte a byte igual à de hoje) e `Shared.series?:
  DuelResult[]` (os jogos que já acabaram nesta série; o jogo atual fica em `result`).
- `seriesOf(s)`: jogo da série, vitórias de cada um, se acabou e quem levou.
- `rematch` com a série aberta = **próximo jogo**: com os dois lacres, `game` + 1, `series` + o resultado, os mesmos
  times e direto pra Escalação. Com a série decidida, é a revanche de sempre (série nova, mesmo `bestOf`).
- `acceptTakeover`: no próximo jogo o time do host pode vir junto (tem que ser o mesmo); `bestOf` e `series` não
  mudam dentro do mesmo jogo.

## Casos de borda

- **Caiu no meio da série:** igual a hoje dentro do jogo (espera, W.O. pelo botão depois de 1 minuto). **W.O. encerra
  a série** a favor de quem ficou.
- **Partida anulada** (as telas se separaram) **é jogada de novo** (decidido pelo Miguel em 21/10): só aquele jogo,
  com o mesmo placar da série e lacres novos (outra seed). O resultado mostra "Jogo 2 anulado: ele vale de novo" e o
  botão **Jogar de novo**; o anulado fica em `series` mas não conta em nada (`seriesOf().played`), e o quadro da série
  avisa "1 jogo anulado e jogado de novo". Na sala de 1 jogo a anulada continua anulada, como hoje.
- **Saiu entre um jogo e outro = W.O. da série** (Miguel, 21/10): quem ficou toca "Próximo jogo" (o botão fica ligado
  mesmo com o rival fora) e a espera de sempre começa (`blocker`: trava quem não pediu o próximo jogo depois que o
  outro pediu). Depois de 1 minuto aparece "Encerrar com vitória por W.O."; o jogo que acabou vai pra `series`, o
  `result` vira o W.O. e quem ficou vê a tela de vitória por W.O. com o quadro da série (o
  placar da série vira "vitória por W.O." em vez de um "1 x 1" que enganaria; a lista dos jogos fica). Na Escalação do jogo seguinte
  vale a espera de sempre (quem não lacra no tempo fica com o time do jogo anterior). O host que volta aceita esse W.O.
  do convidado só depois da espera (`acceptTakeover`, mesma regra do W.O. no meio do jogo).
- **Recarregou / versão nova no meio:** o próximo jogo exige os dois lacres e a mesma versão; sem isso volta pro lobby
  (série perdida, como a revanche de versão antiga).
- **Revanche** depois da série decidida: série nova, mesmo formato.

## Histórico, medalhas e troféus

- A série é **um duelo** no histórico (`DuelRecord` com `bestOf: 3`, placar = vitórias na série e `games` = o placar
  de cada jogo, o seu lado primeiro). Vitória na série conta 1 em `duelWins`, medalha Duelista, cinturões da Sala de
  troféus e retrospecto (`headToHead`). Registro antigo continua igual (campos opcionais).
- O W.O. entre jogos fecha a série no mesmo jogo da sala: o histórico grava uma vez por série (`duelo-<nº>` no
  `recorded` da sala) e o efeito roda de novo quando o `wo` chega.
- A Pokédex conta **cada jogo** (`recordDuelDex` no fim de cada um).
- Estatísticas: o Duelo não manda evento hoje; nada novo.

## Testes (`src/net/duel.test.ts`, "melhor de 3")

1 jogo igual a hoje; 2 x 0 acaba no jogo 2; 1 x 1 vai pro jogo 3; seed base e lacres diferentes por jogo e o mesmo
estado nos dois lados; times de volta ao de antes da série; mudança da Escalação entre jogos vale; jogo não começa sem
os dois confirmarem; W.O. no meio do jogo encerra a série; jogo anulado é jogado de novo e a série segue; sair entre
um jogo e outro é W.O. da série (espera de 1 minuto, botão de quem ficou); volta do host no próximo jogo e no W.O.
entre jogos.
