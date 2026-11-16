---
description: O Soccermon é fan game sem fins lucrativos: sem doações, anúncios ou venda de nada, e licença AGPL-3.0.
status: aceito
data: 2026-10-13
---

# 0006. Sem dinheiro nenhum

## Contexto

O jogo usa Pokémon, marca da Nintendo. Exposição pública aumenta o risco de pedido de retirada, e o Miguel quer o projeto como vitrine e distribuição, não como negócio.

## Decisão

Nada de doações, anúncios, loja real ou qualquer cobrança. O código é AGPL-3.0. A moeda do Mercado (₽) é só do jogo, ganha jogando, sem compra.

## Consequências

- Sem receita: custos ficam nos planos gratuitos (Supabase pausa após 7 dias sem uso).
- Mecânicas de retenção precisam ser sem perda e sem dinheiro (ex.: sequência de dias).
- Divulgação sem apelo comercial; o repo é público, então nenhum segredo nele.

## Exceção: a trilha sonora (16/11/2026)

O Miguel decidiu que o álbum **"Soccermon Songs"** (a OST do jogo mais músicas extras) pode sair em streaming pago por play, como o Spotify, e que os royalties ficam com ele. A trilha é composição original dele com a marca Soccermon: sem melodia de jogo Pokémon (regra da skill `soccermon-musica`) e sem material licenciado de ninguém.

O jogo continua sem dinheiro nenhum, e a exceção vale só pra música. Pra o risco não voltar pro jogo:
- o álbum não menciona Pokémon em nada: nome das faixas, capa, descrição e tags;
- o Content ID da distribuidora fica desligado, pra não gerar reclamação contra quem usar a trilha em vídeo;
- o jogo não vende o álbum nem põe link de compra. Ele pode citar onde ouvir, sem apelo comercial.
