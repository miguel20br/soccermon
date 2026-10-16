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

| Versão | Tema | O que entra | Por quê |
|---|---|---|---|
| **0.8.2** ✓ | Título | Hall da Fama com desfile, prêmios, seleção, recordes, gols da campanha, card 9:16/1:1, celular deitado | momento de orgulho + compartilhar |
| **0.8.3** | Primeiro minuto | Draft mais curto no celular (cartas menores, 3 opções sem rolar, "escolher e já ir pra próxima vaga"), dica de "toque na vaga" mais clara, botão "Copa rápida" que **você** escolhe (draft com 3 rerolls e sem perguntas extras), Home deitada mais enxuta, botão oficial do Google | tapar o vazamento de 25% |
| **0.8.4** | Desafio diário | Copa do dia (mesma seed pra todo mundo, sorteada pela data), **ranking do dia** (Supabase: tabela só INSERT com placar e tempo, uma entrada por conta), card "Desafio do dia" estilo Wordle | motivo diário pra voltar + competição |
| **0.8.5** | Melhores momentos | Replay dos gols e golpes (os snapshots já existem), "gol da copa" com câmera lenta, **exportar clipe** (WebM/GIF curto) pro TikTok | conteúdo que se espalha sozinho |
| **0.8.6** | Treinadores e quadras | Líderes de ginásio com sprite e fala no VERSUS, quadra temática por ginásio (pedra, água, elétrica…), insígnias ganhas na copa | identidade Pokémon e base do Modo história |
| **0.8.7** | Medalhas | Conquistas (marcar com Ditto, copa perfeita, 151 vistos, golpe X decidindo final…), raridade dos campeões já ligada | metas de longo prazo |
| **0.9** | **Modo história** | Kanto em capítulos: 8 ginásios em sequência com insígnias, rival recorrente, Liga Índigo e Elite 4, time que evolui e ganha XP ao longo da campanha, save por capítulo | primeira promessa do "Em breve" |
| **0.10** | **Multiplayer** | Desafiar o time salvo de um amigo por link (assíncrono: o motor determinístico roda a partida dos dois lados), depois liga semanal entre amigos | segunda promessa |
| **0.11** | **Futebol de campo** | 7v7 primeiro, 11v11 depois (o `MatchConfig` já é paramétrico): formações novas, campo maior, câmera | terceira promessa |
| **0.12** | **Geração 2** | Os 100 de Johto, tipos Dark/Steel, golpes novos, Copa de Johto | quarta promessa |
| **1.0** | **Lançamento** | Tudo o que o "Em breve" prometeu, junto e polido: Copa, Modo história, Multiplayer, Futebol de campo e Gen 1 + Gen 2. Revisão completa (celular, inglês, desempenho, acessibilidade), trailer novo e divulgação grande | a versão "de verdade" |

### Depois da 1.0 (planos futuros)

- **Modo jogável:** controlar um Pokémon ou o time inteiro, estilo FC (o `HumanController` e o `LiveRunner` já existem).
- **Gerações 3 a 9:** uma região por vez (Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea), cada uma com a sua copa,
  líderes e golpes; habilidades e tipos novos entram junto (Fairy na Gen 6).
- **Personalização absurda:** escudo desenhado, uniforme (cores, listras, número), mascote, quadra/estádio do clube,
  torcida, música e grito de gol, cartas e molduras próprias, apelido dos Pokémon.
- **Modo Ultimate Team:** montar o clube com as cartas que você ganha (edições especiais, Shiny, Ícones, Eventos),
  química por tipo e sinergia, desafios de montagem (SBC) e temporadas. Sem dinheiro nenhum: tudo se ganha jogando.
- Mais ideias que já surgiram: Nuzlocke opcional, ranking por temporada, quadras temáticas extras, torneios da
  comunidade.

Regras de sempre em todas as versões: nada automático no time do jogador, equilíbrio decidido junto com
números, carta muda primeiro na galeria `?cards=1`, sem emoji na interface, conferir em 320/390 em pé,
deitado e no desktop.

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
