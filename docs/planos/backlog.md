---
description: Backlog único de features do Soccermon (fora bugs e Natal), juntado dos planos em 23/11/2026, com tamanho e fonte.
---

# Backlog de features (23/11/2026)

Juntado de `roadmap.md`, das pesquisas, do relatório de 18/11 (`ux.md` §2, `produto.md`) e das decisões de 18/11. Bugs
ficam na esteira (Trello); o Natal tem plano próprio (`natal.md`). Tamanho: P (até 1 dia), M (2 a 4 dias), G (semana ou
mais). "Motor" = mexe no resultado das partidas (sobe `ENGINE_VERSION`, número com o Miguel antes).

## Copa e draft: mais diversão por esforço

| # | Feature | Tam. | Fonte | Nota |
|---|---|---|---|---|
| 1 | **Capitão mostra o golpe máximo na escolha**: nome, ícone e clipe de 1 s ao segurar a carta | P | ux.md §2.2 | a escolha vira "quero ver esse golpe" |
| 2 | **Recompensa mostra o efeito no seu time** ("Golem 87 → 90") antes de escolher | P–M | ux.md §2.3 | usa `modifiers.ts` (carta = campo) |
| 3 | **Dica pós-jogo que ensina a escalar** ("Seu Pivô tinha 46; no banco tinha Jolteon 88") | P | ux.md §2.4 | só texto, nada automático |
| 4 | **Dica de formação e tática no intervalo** (70% das copas usam 1-2-1 e 91% a Equilibrada) | P | produto.md §2.2 | as outras quase ninguém usa |
| 5 | **Revanche com o mesmo time depois de cair** (botão na eliminação, chave nova) | P–M | decisão 13 (18/11) | combinado pra janeiro; decidir se dá recompensa |

## Partida e espetáculo

| # | Feature | Tam. | Fonte | Nota |
|---|---|---|---|---|
| 6 | **Sinergias secretas**: 26 combos escondidos, chip "???" na escalação, revelação em campo, Registro de Sinergias no Álbum, medalhas | M–G | pesquisas/sinergias-e-animacoes.md §3 e §5 | começar pelas que são só tela (rivalidades); as com bônus são motor |
| 7 | **Mais animações próprias**: o catálogo tem 20; saíram as 5 comemorações e o cut-in de dupla (0.9.53.1) | M | mesma pesquisa §4 | Skylab, toca aqui, cenas de dupla |
| 8 | **Escolher os golpes do Pokémon** | M | roadmap | motor e equilíbrio |
| 9 | **Quadras temáticas por ginásio e treinadores com sprite na Copa** | M | roadmap | as quadras dos 10 líderes já existiam (19/10); o treinador na beira da quadra foi feito e o Miguel recusou em 23/11 ("não curti") |

## Time Ultimate (depois da estreia de 27/11)

| # | Feature | Tam. | Fonte | Nota |
|---|---|---|---|---|
| 10 | **Desafios de montagem** ("só tipo Água", "só bronze"…) | M | decisão 5 | combinado pra janeiro |
| 11 | **Duelo com o time do UT** | G | decisão 8 | próximo multiplayer |
| 12 | **Troca de cartas entre amigos** | G | ultimate-team.md (30/10) | precisa do servidor conferindo |
| 13 | **Ranking do UT** | G | decisão 5 | junto com a Temporada 2 (01/06/2027) |

## Perfil e progressão

| # | Feature | Tam. | Fonte | Nota |
|---|---|---|---|---|
| 14 | **Perfil revamp**: seletor de título novo, Legado do UT no Perfil, título no ranking | M ×3 | perfil-revamp.md, decisão 7 | fase 1 vai no Natal 1 (30/11) |
| 15 | **Caminho do treinador**: Metas mostrando o prêmio | M | revamp-ui.md, decisão 7 | prometido e nunca saiu |
| 16 | **Personalização do clube**: cores, mascote, quadra (nome e escudo já existem) | M–G | personalizacao-e-pokedex.md | |

## Modos grandes (2027)

| # | Feature | Tam. | Fonte | Nota |
|---|---|---|---|---|
| 17 | **Modo História**, capítulo 1 (Pallet até o Brock) | G | decisão 9 | plano em fevereiro, jogável em abril |
| 18 | **Gen 2**: Copa Johto separada | G | decisão 10 | âncora da Temporada 2 |
| 19 | **Modo jogável** (controlar um Pokémon ou o time, estilo FC) | G | CLAUDE.md (visão) | o motor já tem controllers plugáveis |

## Ordem (o Miguel aprovou as 19 em 23/11 e deixou a ordem comigo)

O que mexe no motor ou em visual de carta ainda passa pelos números ou pela galeria antes de entrar.

| Quando | Versão | O que entra |
|---|---|---|
| até sex 27/11 | vídeos | trailer v4 do UT (frenético, um diferencial por batida) e o News especial |
| seg 30/11 | 0.9.54 "Natal 1" | Natal 1 + **1, 2, 3 e 4** (os pequenos que deixam o combo à vista) + Perfil fase 1 (14) |
| seg 07/12 | 0.9.55 "Natal 2" | Natal 2 + **6** (sinergias secretas, primeiro as só de tela) + Legado do UT no Perfil (14) |
| seg 14/12 | 0.9.56 "Natal 3" | Natal 3 + **7** (animações próprias) + **15** (Caminho do treinador) |
| janeiro | 0.9.57+ | **5** (revanche), **10** (desafios de montagem), **9** (quadras e treinadores), **8** (escolher golpes: motor), título no ranking (14) antes da Liga em 12/01 |
| fev a abr | | **11** (Duelo com o UT), **16** (clube), plano e capítulo 1 do **17** (Modo História) |
| 01/06/2027 | Temporada 2 | **13** (ranking), **12** (troca), **18** (Gen 2) |
| depois | | **19** (modo jogável) |

## Pedidos de 23/11 (tarde)

- **Natal em tudo:** decorar por cima o que já existe (quadra da partida, VERSUS, pódio, Rota, UT, menus), não só o Estádio; treinadores com sprite ganham versão temática (gorro, cachecol); **3 músicas de menu de Natal** (a "Noite Feliz" aprovada + 2) e **músicas de batalha de Natal**. Tudo liga sozinho de 30/11 a 06/01.
- **Álbuns só no YouTube, com visualizers:** o vol. 1 (23 masters prontos) e um **álbum de Natal** feito das trilhas de Natal do jogo. Sem menção a Pokémon.

## Revisão do Miguel (23/11, noite)

- **Aprovados pra 0.9.54:** 1 a 10, 12 (escolher golpes, ligado, motor 33), 13 (Duelo com o UT, ligado), 14 e 15 (Natal e músicas).
- **Saiu:** mascote do clube (o avatar já faz o papel).
- **19, modo jogável:** prévia feita (branch `feat-modo-jogavel`, `?lab=jogavel`), fora da 0.9.54. O Miguel viu "MUITO potencial"; pra seguir: mais dribles e chutes, partida mais curta, mais complexidade.
- **12 e 13 do backlog (troca e ranking):** plano e código atrás de bandeira na branch `feat-troca-ranking` (`docs/planos/troca-e-ranking.md`), migração e Edge Function `ut` NÃO aplicadas. Recomendação: ligar na Temporada 2 (01/06/2027).
- **Cartas do draft legíveis (decisão 11 de 18/11):** 3 opções na galeria (branch `feat-cartas-legiveis`); em 25/11 o Miguel preferiu manter a carta atual ("o jeito atual tá ótimo já"). Branch não entra.

## Ideias de playtester aprovadas (27/11)

- **Itens ativos na partida** e **copa longa com eventos**: plano em [itens-ativos.md](itens-ativos.md) (9 decisões aprovadas). 0.10.1 reforço (se os números saírem até 02/12), 0.10.2 sabotagem + carrinho + eventos, janeiro Copinha Baby.
- **0.10.1:** Ditto disfarçado até o toque (com os olhinhos), walkout de carta de edição na recompensa da Copa, metas avançando na partida do UT, loja (Mercado) nos intervalos do Duelo melhor de 3 (10 ₽, +3 pra quem perdeu, 45 s). Selo "nunca jogou": recusado.
- **Duelo da bicuda:** regra mantida; o goleiro de quem chutou fica de frente na parada e a 1ª vez ganha faixa explicando.
