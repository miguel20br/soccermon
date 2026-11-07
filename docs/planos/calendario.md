---
description: Calendário do Soccermon de novembro/2026 a 2027 (jogo e redes), com o que liga sozinho por data e quem decide cada passo.
---

# Calendário do Soccermon (07/11/2026)

Uma página pra não perder o controle: o que sai, quando, e o que depende do Miguel. Redes: a pauta numerada fica em
[../marketing/pauta.md](../marketing/pauta.md).

## O que liga sozinho por data (já está no código da main)

Nada disso precisa de versão nova: na hora marcada, quem estiver com a versão no ar recebe. **O que estiver na main
nesse dia é o que vai ao ar.**

| Quando (Brasília) | O quê | Onde muda a data |
|---|---|---|
| sex 27/11/2026 00:00 | Time Ultimate abre pra todo mundo, Temporada 1 começa | `ULTIMATE_OPENS_AT` em `src/ui/ultimate/flag.ts` |
| ter 12/01/2027 00:00 | Liga abre (adiada em 07/11; era 01/12) | `LIGA_OPENS_AT` em `src/league/rules.ts` |
| ter 15/12/2026 a 05/01/2027 | Evento de Natal do Time Ultimate (cartas Evento de Gelo, objetivos, enfeite) | `EVENTS` em `src/store/ultimate/rules.ts` |
| ter 01/06/2027 00:00 | Fim da Temporada 1 (zera o Time Ultimate), começa a T2 "Líderes" | `SEASONS` em `src/store/ultimate/rules.ts` |

## Jogo

| Quando | O quê | Quem decide |
|---|---|---|
| até sáb 07/11 | Branch `ut-numeros-27` na prévia da Vercel (números do Time Ultimate, fatia colorida) | feito |
| ter 17/11, junto da 0.9.44 | Conserto da quadra que segue a bola (erro `zoom` em laço) e teto de erros por sessão: branch `erros-0943` | conserto com teste (regra 5) |
| até sex 13/11 | Miguel joga a prévia do Time Ultimate e dá o ok final nas tabelas | Miguel |
| ter 17/11 | 0.9.44 "Véspera do Time Ultimate": números aprovados, polimento do playtest | "pode subir" |
| 18 a 26/11 | Congelamento do Time Ultimate: só conserto. Trailer do lançamento pronto até ter 24/11 | Miguel aprova o trailer |
| sex 27/11 | Time Ultimate no ar (sozinho, 00:00); trailer nas redes às 19h | — |
| ~qui 10/12 | Versão de Natal (o que mais entrar no Natal), pra estar no ar antes do evento do dia 15 | "pode subir" |
| ter 12/01/2027 | Liga abre sozinha (adiada pelo Miguel em 07/11) | — |
| 2027 | Modo História | — |

## Redes

- **Por que agora:** as sessões caíram de ~105 a 127 por dia (27 a 30/10, semana de 2 posts) pra ~40 a 58 por dia
  (01 a 07/11, um post só). Instagram é o canal que mais traz gente nova pelas redes (95 sessões novas em 14 dias,
  77% começam copa).
- **Ritmo:** duas séries do Pallet FC (bíblia em `trailer/curtas/BIBLIA.md`, branch `curtas`), terça e sexta às 19h,
  o mesmo vídeo no Instagram, TikTok e Shorts pelo Buffer:
  - terça: sitcom **"Vestiário do Pallet FC"** (F1);
  - sexta: reality **"Confessionário"** (F2).
- **Semana do lançamento:** o episódio de 24/11 puxa o Time Ultimate; 27/11 é o trailer.
- **Prazo de cada vídeo:** pronto 2 dias antes do post, pro Miguel ver.
