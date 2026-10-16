# Plano de divulgação da 0.8 (a partir de 16/10/2026)

Objetivo: levar gente a jogar e **aprender distribuição** (regra 4 do Plano do Midgar: construir em público).
O Soccermon é fan game sem fins lucrativos: nada de dinheiro, doação ou anúncio, em lugar nenhum.

## Como medir (antes de postar qualquer coisa)

- **Um link por canal**, com UTM: `https://soccermon.com/?utm_source=<canal>`
  (`reddit`, `tabnews`, `hn`, `itch`, `discord`, `tiktok`, `x`, `linkedin`). O jogo grava o `utm_source` no
  `session_start` (`ref`), e ele aparece em `analytics.origem` e no `npm run stats`. O botão Compartilhar já
  manda `utm_source=share` (indicação de jogador para jogador).
- **Placar semanal** (toda segunda): `npm run stats -- --md` e colar o resultado aqui embaixo e no post da semana.
  O que olhar, nesta ordem:
  1. **Chegou gente?** sessões por canal.
  2. **Entendeu?** % das sessões que começa uma copa (meta: mais da metade).
  3. **Gostou?** % que termina a copa e partidas por sessão.
  4. **Voltou?** sessões marcadas como "voltando".
  5. **Indicou?** sessões vindas de `share`.
- **Regra de foco:** se o funil vaza (abre e não começa copa, ou começa e não termina), corrigir o jogo antes de
  divulgar mais. Divulgar com o funil furado é gastar o canal.
- **Uma mudança por semana**, escolhida pelo maior vazamento do funil ou pelo pedido que mais se repetir na
  Discussion #1.

## Canais (por ordem de aposta)

| Canal | Formato | Frequência | Texto pronto |
|---|---|---|---|
| TikTok / Reels / Shorts | clipe vertical de 8–15 s com um lance "uau" | 3 por semana | `docs/marketing/textos-divulgacao.md` §6; clipes em `Downloads/Soccermon trailer/Divulgacao-0.8/` |
| Reddit (r/WebGames, r/indiegames) | "fiz isso, joguem, quero feedback" + GIF | 1 por subreddit, respeitando as regras de autopromoção | §1 |
| Comunidades de Pokémon e Discords BR | texto curto onde fan game é permitido | quando houver canal de projetos | §2 |
| TabNews | "como eu fiz", técnico | 1 agora, depois a cada versão grande | §3 |
| Hacker News (Show HN) | título + comentário do criador | 1 vez | §4 |
| ~~itch.io~~ | **descartado em 16/10**: trabalho de manter a página atualizada não compensa o tráfego | — | §5 fica de referência |
| X / LinkedIn | construir em público: números da semana, lance, bastidor, correção que veio de feedback | 1–2 por semana | §7 |

Cuidados: ler as regras de cada subreddit e servidor antes (autopromoção, flair, dia certo); nunca prometer data
de feature; não usar "Pokémon" como palavra-chave paga nem tag comercial; responder todo comentário nas primeiras
horas (é o que faz o post crescer).

## Primeira semana

| Dia | O quê |
|---|---|
| sex 16/10 | ~~LinkedIn~~ (sem acesso à conta, adiado). **Feito:** TikTok @soccermongame criado, 1º post = trailer PT 9:16 (o clipe 04-terremoto ficou no PC, vai no próximo) |
| sáb 17/10 | Reddit r/WebGames |
| dom 18/10 | Clipe 2. Post no TabNews |
| seg 19/10 | **Placar 1** (`npm run stats -- --md`), escolher a mudança da semana. Clipe 3 |
| ter 20/10 | Show HN (manhã nos EUA, ~11h no Brasil) |
| qua 21/10 | Reddit r/indiegames (com clipe). Discords que aceitam divulgação |
| qui 22/10 | Post de construir em público no X/LinkedIn com o placar e a mudança escolhida |

Calendário detalhado, com o texto de cada post: `docs/marketing/textos-divulgacao.md` §8.

## Placar

| Semana | Sessões | Começou copa | Terminou | Voltando | Melhor canal | Mudança da semana |
|---|---:|---:|---:|---:|---|---|
| 15–21/10 | | | | | | |
