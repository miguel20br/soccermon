# Campeonato da Liga Índigo: as ideias do Miguel juntas (21/10/2026)

O Miguel jogou ideias soltas depois de ver a Rota Índigo: "inventar que é um campeonato, com chaveamento até a copa",
"fase de grupos nesse modo, ou na copa pequena", "bem mais treinadores com falas diferentes" e "times temáticos nos 2
modos". Aqui elas viram uma história só.

## A ideia que amarra tudo

**A Liga Índigo organiza um campeonato de futsal Pokémon.** Os dois modos são duas competições dele:

| | Copa Relâmpago | Rota Índigo |
|---|---|---|
| O que é na história | o torneio relâmpago da Liga: 16 clubes, mata-mata | a temporada: eliminatórias por Kanto e a fase final no Planalto |
| Formato | chave de 16 (oitavas, quartas, semi, final): 4 jogos | **Eliminatórias** no mapa (4 jogos, cartão amarelo, eventos, Mercado) → **Fase de grupos** no Planalto (grupo de 4, 3 jogos, passam 2) → **Final** (1 jogo): 8 jogos |
| Tela nova | a **chave** antes de cada jogo (os outros jogos saem com placar) | a **tabela do grupo** (pontos, saldo) e a chave da final |

- **Chave visível:** os outros jogos da chave e do grupo saem pela seed, com um placar pela força dos times (sem rodar o
  motor inteiro: é rápido e dá a sensação de campeonato). Seu jogo continua sendo a partida de verdade.
- **Fase de grupos:** empate vale 1 ponto (o motor já tem partida sem pênaltis: `MatchConfig.knockout`). O colchão do
  grupo substitui o cartão amarelo no Planalto (o amarelo fica só nas eliminatórias).
- **Copa do Dia** continua a Relâmpago de sempre (só ganha a chave na tela).

## Treinadores e falas

- **Banco de falas por treinador**, em 3 momentos: antes do jogo (VERSUS), quando ele ganha, quando ele perde. Mais as
  falas da história (as 6 regiões da Rota) e do grupo/final.
- **Quem fala:** os 8 líderes, a Elite 4 (Lorelei, Bruno, Agatha, Lance), Blue, Prof. Carvalho, Giovanni e as classes
  de treinador que já têm sprite (Caçador de Insetos, Montanhista, Nadador, Equipe Rocket, Ornitólogo, Faixa-Preta,
  Médium, Cientista, Motoqueiro, Pescador, Beldade, Supernerd, Malabarista, Cavalheiro, Pokémaníaco, Roqueiro). ~30
  treinadores × 3 falas ≈ 90 falas curtas (até ~15 palavras, no jeito das faixas da torcida).
- **Times temáticos nos 2 modos:** cada treinador traz o time do tipo dele (já é assim na Rota). Na Relâmpago, a chave
  de 16 mistura os clubes dos ginásios com esses times.

## Opções

| Opção | O que entra | Esforço |
|---|---|---|
| A | treinadores com falas e times temáticos nos 2 modos + a chave visível na Relâmpago; a Rota fica como está (mapa de 8) | 1 versão |
| **B (recomendada)** | A + a Rota vira **eliminatórias (mapa, 4) → grupos (3) → final (1)** | 1–2 versões |
| C | B + fase de grupos também na Relâmpago (vira 5–6 jogos e perde o "rápido") | 2 versões |

## Missões de "gols numa copa" (Motoqueiro: 10 gols; Artilheiro lendário: um Pokémon com 12)

Com 8 jogos elas ficam fáceis na Rota. Três jeitos:

1. **Melhor sequência de 4 jogos** de qualquer copa (recomendado): a mesma dificuldade nos dois modos; quem joga a Rota
   tem mais chances de bater (é justo: jogou mais).
2. Só a Copa Relâmpago conta (simples, mas a Rota não ajuda em nada).
3. Metas maiores na Rota (Motoqueiro 20, Artilheiro 24): dois números pra explicar.

E missões novas da Rota: "Campeão da Rota Índigo", "Vencer 3 Ginásios numa Rota", "Campeão sem cartão amarelo".

## Calibragem (robô, 200 Rotas, 21/10)

Título **16%** (meta ~30%); 25% chegam na Final; 93% usam o amarelo. Quem perde, perde no meio (partidas 3 a 6). Se a
opção B entrar, o grupo muda a conta: recalibrar depois do formato. Sem B, a proposta é amaciar o meio
(`LONG_DIFFICULTY` −1 nas partidas 3 a 6).

## Decidido com o Miguel (21/10/2026)

- **Opção B:** treinadores com falas e times temáticos nos 2 modos, chave na Relâmpago (mostrando você avançar na
  chave) e a Rota como eliminatórias (mapa) → grupos → final. Precisa de arte pra chave e pra tabela do grupo.
- **Missões de gols:** opção 1 (melhor sequência de 4 jogos de qualquer copa).
- Ideia em aberto: acréscimos de 1 a 3 minutos e gols mais fáceis no fim da partida (estilo "acréscimos do FIFA") pra
  deixar a taxa de vitória saudável no singleplayer.
