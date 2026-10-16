# Tela de campeão: referências e plano (16/10/2026)

Objetivo: o título ser o momento de orgulho e de compartilhar (o Soccermon como febre entre jogos de Pokémon).

## Referências

| Jogo | O que copiar |
|---|---|
| [PokéRogue, Run Info](https://github.com/pagefaultgames/pokerogue/blob/HEAD/src/ui/handlers/run-info-ui-handler.ts) | histórico de runs, recorde pessoal, duração, time com itens, Hall of Fame com os sprites |
| [Hall of Fame Gen 1](https://bulbapedia.bulbagarden.net/wiki/Hall_of_Fame) | desfile: cada Pokémon sozinho, depois o treinador; guarda os últimos registros |
| [Vampire Survivors, Results](https://vampire.survivors.wiki/w/Results) | tabela por arma (aqui: por golpe) com o maior de cada coluna destacado |
| [Balatro](https://balatrowiki.org/w/Seed) | seed + "mão mais jogada" no fim (aqui: golpe mais usado + link de desafio) |
| [Pokémon Unite, medalhas](https://www.pockettactics.com/pokemon-unite/medals) | uma medalha por categoria + MVP pela nota |
| [Rocket League, spotlights](https://www.rocketleague.com/news/celebrate-with-post-game-spotlights-in-june) | títulos com nome tirados das estatísticas |
| [Prêmios da Copa do Mundo](https://en.wikipedia.org/wiki/FIFA_World_Cup_awards) | Bola/Chuteira/Luva de Ouro e a seleção do torneio na formação |
| [Slay the Spire, pontuação](https://slay-the-spire.fandom.com/wiki/Score) | nota final em linhas de bônus com nome |
| [Wordle](https://thespinoff.co.nz/media/13-01-2022/those-coloured-boxes-on-twitter-are-new-zealands-fault) | compartilhar que gera curiosidade sem entregar tudo |
| [Spotify Wrapped](https://itmagination.com/blog/spotify-wrapped-2021-design-analysis) | sequência de cards verticais, cada um compartilhável, texto que elogia |
| [Strava, sticker](https://www.remove.bg/b/strava-overlay-for-instagram-stories-and-posts) | compartilhar direto pros Stories como imagem |
| Pokémon Showdown, replays | link da partida (nosso motor determinístico permite seed + ordens) |

## O que falta

**Com dados que já existem** (`aggregate()`, `results[].stats`, `profile`):
- Prêmios: Bola de Ouro (nota média), Chuteira (gols), Garçom (assistências), Luva (defesas), Muralha (desarmes + interceptações), Pulmão (distância), Mestre dos Golpes (golpes usados).
- Seleção da copa na quadra (5 melhores por nota na formação usada).
- Nota de cada Pokémon jogo a jogo; gols/chutes/posse por jogo (o `CupStats` já desenha parte).
- Seu time x finalista (média das cartas e placar).
- Recordes: "3º título", "1ª copa perfeita", "nova melhor nota do Gengar" (comparar com o perfil de antes do título).
- Tipos do time, rerolls usados, pênaltis vencidos, cartas Destaque ganhas.

**Precisa guardar dado novo** (só no store; os eventos já existem no `MatchResult`, o `StageStats` descarta):
- Gols com minuto, autor, assistência, golpe e posição (linha do tempo, mapa, "gol da copa", viradas).
- Golpes usados e gols por golpe; evoluções; placar do intervalo.
- Duração da run (`startedAt`/`endedAt` no store).
- Hall of Fame persistente (save v6, fusão com a nuvem por união).
- Raridade ("3% dos campeões usaram Psyduck capitão"): JSON estático gerado pelo `npm run stats` a cada deploy.

## Proposta (do maior impacto/menor esforço ao maior esforço)

1. Prêmios da copa + seleção na quadra (só dados existentes). MVP com acabamento especial passa antes pela galeria `?cards=1`.
2. Recordes e número do título.
3. Card de imagem 9:16 e 1:1 no Compartilhar (canvas, `navigator.share({files})`, sem emoji na arte).
4. Guardar o resumo dos eventos por partida (libera linha do tempo, mapa dos gols, golpe da copa).
5. Hall of Fame persistente com desfile Gen 1 e sequência estilo Wrapped.
