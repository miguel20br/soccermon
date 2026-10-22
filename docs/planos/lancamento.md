# Roadmap de lançamento: o plano pra deixar o Soccermon incrível (16/10/2026)

Meta: virar **o jogo de Pokémon de navegador que todo mundo manda pro amigo**. Sem dinheiro nenhum (fan game,
AGPL), então o crescimento vem de três coisas: o jogo ser viciante, o momento de orgulho virar post e o
link circular sozinho.

## Onde estamos (placar de 15 e 16/10, 24 sessões)

| Etapa | Sessões | Leitura |
|---|---:|---|
| Abriu → passou das boas-vindas | 79% | ok |
| → começou copa | 50% | ok pra começo |
| → jogou a 1ª partida | 38% | **maior vazamento** (draft longo no celular?) |
| → terminou a copa | 38% | quem joga 1 partida termina a copa |
| → campeão | 21% | |
| Voltando no dia seguinte | 43–45% | muito bom |

81% jogam em 8x, Dragonite capitão caiu pra 22%, zero erros. Pouca gente ainda: o gargalo agora é
**trazer gente**, sem esquecer de tapar o vazamento do draft.

## Os 5 pilares

1. **Primeiro minuto** (funil): da Home à 1ª partida em menos de 3 minutos no celular.
2. **Momento compartilhável**: título, golaço e virada viram imagem ou clipe com 1 toque. A 0.8.2 entregou o
   card do título e o Hall da Fama.
3. **Motivo pra voltar**: desafio diário, Pokédex pra completar, medalhas, Hall da Fama crescendo.
4. **Profundidade**: o que foi prometido no "Em breve" (Modo história, Multiplayer, Futebol de campo,
   Geração 2) e o modo jogável.
5. **Distribuição**: um canal por vez, medindo com UTM, sem queimar comunidade.

A **1.0 é o lançamento oficial**, com tudo o que o "Em breve" promete. O que vem depois (modo jogável, Gens 3 a 9,
personalização, Ultimate Team) está em "Depois da 1.0".

## Versões (seguimos na 0.8.x)

Ainda pendente do antigo "Primeiro minuto" (o maior vazamento é entre começar a copa e jogar a 1ª partida): Copa rápida, draft mais curto no celular. Encaixar quando couber.

| Versão | Tema | O que entra | Por quê |
|---|---|---|---|
| **0.8.2** ✓ | Título | Hall da Fama com desfile, prêmios, seleção, recordes, gols da campanha, card 9:16/1:1, celular deitado | momento de orgulho + compartilhar |
| **0.8.3** ✓ | Jogo gostoso | Impacto em 4 níveis, bola e Pokémon com peso, câmera lenta em gol/trave/defesa, rastro do tipo na bola, shiny em campo, intervalo com decisão, pacote de cartas, VERSUS novo, torcida e apito; ajustes de 17/10 (sinergias com degraus e aura, Destaque com nível) | a partida e as recompensas com sabor |
| **0.8.4** ✓ | Balanceamento geral | Os 3 blocos de `balanceamento-geral.md` (regras, economia, cartas e golpes) + auditoria de posições (evolução herda a vaga) + **treinador e missões** (38 treinadores, 42 missões, títulos e códigos pros gametesters; fora da beira da quadra, decidido em 17/10) + pacote do tamanho da carta, item/MT como carta, troca no intervalo no vestiário + `ENGINE_VERSION` (partida salva no meio recomeça se o motor mudou) | o jogo justo e variado antes de abrir pra duelo |
| **0.8.5** ✓ | **Escanteio + duelo ao vivo** | Escanteio (desenho e calibração juntos) + base do multiplayer (mesma partida em todo navegador: contas próprias no motor, teste de hash) + desafiar um amigo por link (sem conta, login anônimo; Duelo em BETA, mesmo caminho do Copa, prancheta do time também no Copa): draft em Disputa ou cada um com seus pacotes, partida sincronizada com velocidade da sala, trocas que o rival vê, emotes. Regras em `multiplayer.md`. Divulgação da 0.8.4 e 0.8.5 juntas (decidido em 17/10) | a primeira vez que dá pra jogar contra alguém |
| **0.8.6** ✓ | Lendas douradas e prancheta ao vivo | Missões lendárias (6 treinadores dourados, 9 títulos), prancheta no meio da partida (formação e vagas na próxima bola parada), +2 por evolução da carta, evolução do rival com animação própria, defesa do goleiro consertada, Duelo mais justo e consertos da auditoria (decidido em 18/10: versão cheia de ajustes desse gênero) | agência do técnico + metas difíceis pra se exibir |
| **0.8.7** ✓ | Emotes, selos e faixa da torcida | Emotes do Duelo com o rosto do capitão (retratos PMD), selos de carreira na Pokédex, faixa da torcida na beira da quadra, "Monta pra mim" no draft, Duelo mandando só o que mudou + partida curta (mesma partida em dobro), experimento "beira da quadra" (gritos, tempo, goleiro-linha, golpe máximo, ordem dos pênaltis) desligado por padrão. Feito em paralelo em 18–19/10 | agência e personalização testadas antes de virar regra |
| **0.8.8** ✓ | Ícone MVP e conquistas retroativas | Conserto rápido da manhã de 19/10: Ícone leva MVP com selo "MVP n", missões lendárias do Hall da Fama | pedido de jogadores |
| **0.8.8.1** ✓ | Melhores momentos, Copa do Dia e medalhas | O pacotão de 19/10 (era a 0.8.9): melhores momentos e clipe, medalhas/vitrine/escudo/uniforme, líderes com fala e quadras + rival que reage, emotes 2 e vincular conta, consertos da caça-bugs, conquistas com a tarefa + platina, UX da pesquisa com jogadores, vestiário e pronto com desfazer, 404 e Home, fórmula A (`ENGINE_VERSION` 4) e barra de evolução (5), Copa do Dia, avatares por geração e shiny | tudo que já estava aprovado, no ar aos poucos |
| **0.8.8.2** ✓ | Logo novo e faixas da torcida | Marca nova (logo, título chapado, ícones padronizados, brand guide), faixas da torcida novas, pacote com o logo, Liga fechada com timer | a cara do jogo pro trailer 2 |
| **0.8.8.4** ✓ | Álbum em livro | Estante por geração, capa que abre, folha que vira, um espaço por Pokémon com a carta da frente escolhida, versões espalhadas | coleção com cara de álbum |
| **0.8.8.3** ✓ | Cartas em camadas e álbum de figurinhas | Shiny por cima, selo MVP, Destaque por nível, Evento por tipo, bônus sem teto (`ENGINE_VERSION` 6), dicas ao passar o mouse, Álbum dentro da Pokédex | coleção com mais o que caçar |
| ~~0.8.9~~ | (Pacotão) | Virou a 0.8.8.1 (19/10) | |
| **0.8.9** ✓ | Sala de troféus e menus novos | Sala de troféus em pixel art com luz, menus em portas, perfil do amigo, "nada pula" | casa pros troféus |
| **0.9.0** ✓ | Mercado e Patrocínios | Etapa 1 da Copa roguelike (`docs/planos/copa-roguelike-plano.md`): ₽, Mercado depois da recompensa, 12 Patrocínios, pacote de tipo; tudo dentro do Perfil | mais decisões entre as partidas |
| **0.9.1** ✓ | Rota Índigo (Copa longa) | Etapa 2: mapa estilo Slay the Spire, eventos "?", lesão, Ginásio, Treino e Baú; pacotes que começam piores e melhoram | copas diferentes entre si |
| **0.8.x** | Liga ranqueada (versão a combinar; era a 0.8.7) | Times "fantasma", Elo com divisões nas cores das cartas, temporada mensal, **Copa do Dia** (mesma seed pra todo mundo, ranking do dia; era o "Desafio diário"), replay por link | motivo diário pra voltar + competição |
| **0.8.8** | Melhores momentos | Replay dos gols e golpes, "gol da copa" com câmera lenta, **exportar clipe** (WebM/GIF curto) pro TikTok | conteúdo que se espalha sozinho |
| **0.8.9** | Treinadores e quadras | Líderes de ginásio com sprite e fala no VERSUS, quadra temática por ginásio, insígnias ganhas na copa | identidade Pokémon e base do Modo história |
| ~~Medalhas~~ | (antiga 0.8.9) | Virou as missões da 0.8.4 | |
| **1.0 (Jornada)** | **Modo história** | Kanto em capítulos: 8 ginásios em sequência com insígnias, rival recorrente, Liga Índigo e Elite 4, time que evolui e ganha XP ao longo da campanha, save por capítulo | primeira promessa do "Em breve" |
| **0.10** | **Copas entre amigos** | Copa privada de 4 a 8 treinadores e Copa Semanal oficial (chave no domingo, troféu no Hall da Fama) | multiplayer social |
| **0.11** | **Futebol de campo** | 7v7 primeiro, 11v11 depois (o `MatchConfig` já é paramétrico): formações novas, campo maior, câmera | terceira promessa |
| **0.12** | **Geração 2** | Os 100 de Johto, tipos Dark/Steel, golpes novos, Copa de Johto | quarta promessa |
| **1.0** | **Lançamento** | Tudo o que o "Em breve" prometeu, junto e polido: Copa, Modo história, Multiplayer, Futebol de campo e Gen 1 + Gen 2. Duelo ranqueado e espectador. Revisão completa (celular, inglês, desempenho, acessibilidade), trailer novo e divulgação grande | a versão "de verdade" |

### Depois da 1.0 (planos futuros)

- **Modo jogável:** controlar um Pokémon ou o time inteiro, estilo FC (o `HumanController` e o `LiveRunner` já existem).
- **Gerações 3 a 9:** uma região por vez (Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea), cada uma com a sua copa,
  líderes e golpes; habilidades e tipos novos entram junto (Fairy na Gen 6).
- **Personalização absurda:** escudo desenhado, uniforme (cores, listras, número), mascote, quadra/estádio do clube,
  torcida, música e grito de gol, cartas e molduras próprias, apelido dos Pokémon.
- **Modo Ultimate Team** (proposta em [ultimate-team.md](ultimate-team.md), no Em breve desde 20/10/2026): montar o clube com as cartas que você ganha (edições especiais, Shiny, Ícones, Eventos),
  química por tipo e sinergia, desafios de montagem (SBC) e temporadas. Sem dinheiro nenhum: tudo se ganha jogando.
- Mais ideias que já surgiram: Nuzlocke opcional, ranking por temporada, quadras temáticas extras, torneios da
  comunidade.

Regras de sempre em todas as versões: nada automático no time do jogador, equilíbrio decidido junto com
números, carta muda primeiro na galeria `?cards=1`, sem emoji na interface, conferir em 320/390 em pé,
deitado e no desktop.

## Nomes dos modos (decidido com o Miguel em 17/10)

- **Copa:** o modo de hoje (draft do zero, 4 jogos mata-mata, Liga Índigo na final). Copa do Dia, Copa Semanal,
  Copa entre amigos e, com a Gen 2, Copa Kanto/Copa Johto são variações dela.
- **Modo história** (0.9): campanha com um time só que cresce, 8 ginásios em ordem, rival recorrente e Elite 4.
- **Duelo** (0.8.5): multiplayer.

Quando o Duelo chegar, a Home vira cartões de modo ("Copa" e "Duelo", cada um com uma linha do que é).

## Calendário de divulgação (próximas 4 semanas)

| Semana | Canais | Gancho |
|---|---|---|
| 17–23/10 | TikTok 3 clipes/semana (terremoto, Ditto, evolução), TabNews ("como fiz um motor determinístico"), Show HN (ter 20/10), X com o placar | lançamento da 0.8 |
| 24–30/10 | Reddit r/WebGames e r/PokemonROMhacks (conta nova criada nesta semana e aquecida comentando), Discords de Pokémon BR que aceitam divulgação | card do título da 0.8.2 como imagem do post |
| 31/10–6/11 | 0.8.3 + 0.8.4: post "Desafio diário" em todo canal que já funcionou | ranking puxa competição |
| 7–13/11 | 0.8.5: clipes exportados por jogadores; repostar os melhores (com permissão) | conteúdo dos próprios jogadores |

Toda segunda: `npm run stats -- --md` no placar do plano de divulgação e **uma** mudança da semana escolhida
pelo maior vazamento ou pelo pedido que mais repetir na Discussion #1.

## Metas por fase

| Fase | Sessões/semana | Começa copa | Joga 1ª partida | Voltando | Compartilhou |
|---|---:|---:|---:|---:|---:|
| Agora | ~80 | 50% | 38% | 44% | (medir a partir da 0.8.2) |
| Fim de outubro | 500 | 60% | 55% | 40% | 5% dos campeões |
| Fim de novembro | 2.000 | 65% | 60% | 45% | 10% dos campeões |

"Compartilhou" precisa de um evento novo (`share`, com `kind: image|text`) na lista fixa do banco: entra na
0.8.3 junto com a migração que libera o nome do evento.

## Base técnica (entra aos poucos, sem versão própria)

- Botão oficial do Google: falta só o Client ID (variável `VITE_GOOGLE_CLIENT_ID` na Vercel).
- Phaser carregado só na partida (Home mais rápida; JS hoje ~600 KB gzip).
- Ambiente de staging (`docs/planos/ambiente-dev.md`) antes do ranking diário (que mexe no banco).
- Monitoramento de erros já vem do `track('error')`; olhar no placar toda semana.
- Supabase gratuito pausa com 7 dias parado: o ranking diário mantém ele vivo.

## Riscos

- **Nintendo:** quanto mais famoso, maior o risco. Manter: sem dinheiro, sem anúncio, sem marca registrada em
  palavra-chave paga, créditos claros, código aberto.
- **Conta nova no Reddit:** autopromoção com conta zerada é removida. Aquecer antes.
- **Ranking:** trapaça é fácil num jogo de cliente. Como o motor é determinístico, guardar seed + ordens e
  revalidar o placar (rodar a partida de novo no servidor) antes de entrar no ranking.
