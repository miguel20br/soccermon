---
description: Progressão de dificuldade da Rota Índigo, com opções simuladas e a recomendação (esperando o Miguel).
---

# Rota Índigo: progressão de dificuldade

O pedido veio do Miguel em 22/10/2026: "o draft 1 tá parecendo um draft normal, já fico com o melhor time na primeira partida". A ideia é a Rota começar mais fraca e o time crescer pelo caminho, com o Planalto como pico. **Nada aqui foi aplicado.** Os números saem de um robô que usa o "Monta pra mim" e joga na tática equilibrada, sem MT. Cada opção roda n=200, com erro de ±3,5 pp por taxa. As simulações estão em `scripts/balance/rota-progressao.sim.test.ts`, e as tabelas saem de `scripts/balance/rota-progressao-agg.ts`.

Termos usados nas tabelas:
- **Rivais −1:** a Rota 2 e a Rota 3 ficam um nível mais fáceis, com o rival em ~65 em vez de ~71.
- **Reforço do Planalto:** no Treino final, escolher 1 de 3 com a raridade de capitão, sem teto.

## Hoje

| Partida | Rota 1 | Rota 2 | Rota 3 | Rota 4 | Grupo 1 | Grupo 2 | Grupo 3 | Final |
|---|---|---|---|---|---|---|---|---|
| Seu time | 79,2 | 80,6 | 83,0 | 83,9 | 84,8 | 85,4 | 85,9 | 87,0 |
| Rival | 65,3 | 71,2 | 71,6 | 77,4 | 79,9 | 80,1 | 80,1 | 84,6 |
| Vitória | 74% | 63% | 73% | 64% | 64% | 69% | 68% | 61% |

Os jogadores chegam ao Planalto em 61% das rotas e à Final em 41%; o título sai em 25%. Na Rota 1, o time do jogador começa 14 pontos acima do rival. O capitão médio tem nota 87,1, e 71% dos capitães têm 85 ou mais.

## Opções

| Opção | Draft | Capitão | Vitória R1/R2/R3/R4 | Planalto | Final | Título |
|---|---|---|---|---|---|---|
| Hoje | 79,2 | 87,1 | 74/63/73/64% | 61% | 41% | 25% |
| Só capitão ≤82, sem Ícone | 78,3 | 81,3 | 67/59/67/61% | 51% | 35% | 16% |
| 1. Teto 74 + capitão ≤82 + rivais −1 | 73,5 | 81,3 | 51/65/74/43% | 44% | 21% | 12% |
| 1 + reforço do Planalto | 73,5 | 81,3 | 51/65/74/43% | 44% | 23% | 10% |
| 2. Vagas + capitão ≤82 + rivais −1 | 71,8 | 81,3 | 50/62/76/54% | 46% | 26% | 12% |
| **2 + reforço do Planalto** | 71,8 | 81,3 | 50/62/76/54% | 46% | 28% | **17%** |
| 3. Raridade (sem épico/lendário, capitão raro) | 77,3 | 84,2 | 71/57/63/61% | 53% | 33% | 16% |
| 3 + reforço do Planalto | 77,3 | 84,2 | 71/68/71/57% | 57% | 31% | 18% |

- **Teto:** as cartas do draft inicial ficam entre 68 e 74.
- **Vagas:** o draft tem o capitão e mais 3 escolhas; as outras 3 vagas começam com bronzes da Rota. Cada uma das 3 primeiras vitórias troca um bronze por uma escolha nova.

## O que os números mostram

1. **O começo:** toda opção que começa mais fraca deixa a Rota 1 em uns 50% de vitória. O rival da Rota 1 já está no nível mais fácil. Pra chegar perto de 65% precisa de um nível de rival ainda mais fraco, que ainda não foi simulado.
2. **O capitão:** é o que mais pesa no título. O teto de 82 sozinho leva o título de 25% pra 16%.
3. **O reforço do Planalto:** só funciona com as vagas. Com o teto 74 o título cai pra 10%, porque o time chega fraco demais ao Planalto. Com as vagas, ele chega à Final com 86,0 contra 84,7 do rival e vence 62% das finais.
4. **A raridade:** quase não muda nada. O draft continua forte, com 77 contra 65 na Rota 1.
5. **A Rota 4:** o rival dá um salto de 72 pra 78. Uma curva mais lisa seria −1, −1, 0, 0.

## Recomendação

A **opção 2 (vagas) com o reforço do Planalto e o capitão ≤82 sem Ícone**. Ela é a que mais conta a história de "começar fraco e crescer":
- o time vai de 71,8 a 86,0 ao longo da rota;
- toda vitória do começo traz um reforço visível;
- o Planalto devolve o pico;
- o título fica em 17%, perto dos 16% da Copa depois da 0.9.6.

Junto com ela, eu criaria um rival mais fraco pra Rota 1 (nível −2), pra ela não ficar em 50%, e mediria de novo.

Exemplo de primeiro draft nas vagas: capitão Dodrio 78, com Jolteon 88 e Wartortle 70, mais Ekans 44 como bronze da Rota (média 69).

Antes de aplicar:
- rodar a opção escolhida com n=400;
- o Miguel jogar umas Rotas na prévia, porque simulação não mede diversão.
