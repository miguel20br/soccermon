---
description: Proposta do Time Ultimate (antes Ultimate Team / Modo Treinador), o segundo modo principal, lançamento em 27/11/2026.
---

# Time Ultimate (proposta de 20/10/2026, decisões até 30/10)

Nome fechado em 30/10: **Time Ultimate** (EN "Team Ultimate"; id interno `ultimate`). As decisões de 30/10 estão no fim
deste doc e valem sobre o texto da proposta.

Pedido do Miguel (20/10): o Soccermon vai ter **dois modos principais**, o futsal casual (a Copa de hoje) e o
**Ultimate Team**, igual ao FUT: você monta o time da temporada, abre pacotes, e a cada temporada tudo reseta. Ele
quer ideias de como equilibrar e de como os dois modos convivem no mundo do Soccermon. Já está no "Em breve" da
Home (20/10). **Nada de código antes das decisões do fim deste doc.**

## O que já existe e o UT reaproveita

| Peça do UT | Já temos | Onde |
|---|---|---|
| Cartas, notas, edições (Shiny, Destaque, Ícone, Evento, MVP em camadas) | sim | `src/engine/specials.ts`, `src/ui/cards/` |
| Abrir pacote com animação | sim (o pacote da vitória) | `src/ui/CardPack.tsx` |
| Química | sinergia de tipo + sinergias de história (duplas e grupos da Gen 1) | `src/engine/synergy.ts`, `src/engine/links.ts`, `modifiers.ts` |
| Coleção | Álbum de figurinhas (melhor versão por espécie × edição) | `src/store/binder.ts`, `src/ui/profile/Album.tsx` |
| Jogar contra o time de outra pessoa sem ela online | times-fantasma da Liga, Elo, partida refeita no servidor | `src/league/`, Edge Function `liga` |
| Ao vivo contra amigo | Duelo, modo "Time pronto" | `src/net/`, `src/ui/duel/` |
| Desafio igual pra todo mundo | Copa do Dia | `src/store/daily.ts` |
| Metas e recompensas | missões, medalhas, títulos | `missions.ts`, `medals.ts`, `title-codes.ts` |

O motor não muda: o UT é um jeito novo de **montar e guardar** o time; a partida é a mesma (`ENGINE_VERSION` igual).

## Referências (o que copiar e o que evitar)

| Jogo | O que faz | Pro Soccermon |
|---|---|---|
| **EA FC 26 Ultimate Team** | química por clube/liga/nação (máx. 33), conta de qualquer lugar da escalação; fora de posição = 0 de química; química só dá bônus, nunca tira. **Evolutions**: objetivos que sobem a carta até 3 vezes. SBC (desafio de montagem que come duplicatas). Reset por edição anual. | Química = nossas sinergias de tipo e de história. **Evolution do FUT = evolução Pokémon de verdade**: o melhor trocadilho que existe. SBC como sumidouro de repetidas. |
| **Pokémon TCG Pocket** | 2 pacotes grátis por dia (acumula no máx. 2), pontos de pacote a cada abertura que compram a carta que você quer. Raras são variações de comuns, então dá pra competir sem gastar. | Pacote grátis por tempo + **pontos de pacote** como proteção contra azar. Raridade = acabamento (já é a nossa regra de carta). |
| **Marvel Snap** | cartas em "séries"; carta forte demais **desce de série** (fica mais fácil de achar); proteção de azar pra todo mundo do mesmo nível ter quase o mesmo número de cartas. | Equilibrar mexendo na **raridade** (quem domina fica mais comum) antes de mexer em atributo. |
| **Path of Exile / Diablo (temporadas)** | a temporada zera tudo e traz uma mecânica nova; o reset devolve a escassez (o 1º drop volta a valer). O que fica: o personagem vai pro "eterno", cosméticos, conquistas. | Reset de verdade + **tema por temporada** + o que você conquistou fica no Perfil (não no time). |

## Como os dois modos convivem

Princípio: **a Copa é o futsal casual** (cada copa começa do zero, draft "escolha 1 de 3", 10 minutos e acabou) e
o **UT é o clube da temporada** (você volta todo dia, o time cresce, a temporada acaba e recomeça). Um não pode
estragar o outro: carta do UT dentro da Copa mata o roguelike; Copa obrigatória pra evoluir o UT vira trabalho.

| Opção | Como | Prós | Contras |
|---|---|---|---|
| A. Separados | coleções e moedas sem contato | simples, zero risco de um quebrar o outro | o jogador da Copa não tem motivo pra abrir o UT |
| **B. Pontes de mão única (recomendada)** | o que você faz na **Copa dá pacote no UT** (título = 1 pacote; Copa do Dia = 1 pacote do dia); **Pokédex, Álbum, medalhas e títulos são um só** (vistos/jogaram contam dos dois); carta do UT **não** entra na Copa | a Copa vira a porta de entrada do UT; o UT dá motivo pra jogar mais Copa; a Copa segue justa | precisa limitar a ponte (teto por dia) pra Copa não virar fazenda |
| C. Unificado | a coleção do UT vira o pool do draft | uma coleção só | acaba com o "escolha 1 de 3" e com a graça da Copa |

Ponte também do UT pra Copa, só cosmética: escudo e uniforme do clube do UT podem ser os mesmos do Perfil (já
existem: `club-kit.ts`).

## A temporada

**Pedido do Miguel (31/10): temporada longa, com eventos no meio, e reset anual ou semestral** (no lugar das 6
semanas da proposta de 20/10). **Decidido em 01/11: semestral.**

- **Semestral.** Duas temporadas por ano, ex.: T1 de 27/11/2026 ao fim de maio de 2027, T2 de junho a
  novembro. Anual é longo pra um jogo pequeno: quem chegou no começo abre tanta vantagem que quem chega no meio
  desiste, e o "recomeço do zero", que é o que traz gente de volta, só acontece uma vez por ano. O FC é anual, mas
  tem conteúdo novo toda semana; a gente não tem esse volume.
- **Eventos no meio (2 a 3 semanas cada, um de cada vez):** Natal (dez), Ano Novo, Carnaval, Páscoa, "Semana do
  tipo", Halloween, aniversário do jogo. Cada evento traz: cartas Evento com visual próprio nos pacotes, objetivos e
  um passe do evento (grátis), um desafio de montagem com retorno, um mini ranking e um enfeite que fica no Perfil.
  Poucos e marcados (o FC 27 cortou 5 promoções por cansaço).
- **Pra quem chega no meio:** pacote de boas-vindas que cresce com a idade da temporada, e Evoluções e objetivos que
  não dependem de ter jogado os eventos anteriores. A carta Evento não pode ser mais forte que a base da temporada
  por mais que um degrau (senão o evento vira obrigação).
- **Zera no fim da temporada:** time, cartas do Time Ultimate, Fichas, pontos de pacote, ranking.
- **Fica (no Perfil):** medalha da temporada e de cada evento, título ("Campeão da Temporada 1"), a carta que mais
  jogou vira figurinha especial no Álbum ("Lenda da T1", só enfeite), estatísticas no Hall da Fama.
- **Tema por temporada:** T1 Kanto clássico; T2 Ícones dos líderes de ginásio etc. Muda o que sai nos pacotes e os
  desafios, não o motor.
- **Muda duas decisões de 30/10:** a "temporada 1 atravessando o Natal" vira "o Natal é o 1º evento da T1"; o
  ranking do Time Ultimate entra como evento em janeiro, sem esperar uma temporada nova.

## Economia (sem dinheiro nenhum, nunca)

- **Uma moeda: Fichas** (decidido em 30/10, as do Game Corner de Celadon) que só se ganha jogando: partida do UT (vitória > empate >
  derrota, sempre algo), objetivos diários e semanais, ponte da Copa. Nada à venda, nem "pular espera".
- **Pacotes:** 1 grátis a cada 12 h (acumula 2, como no TCG Pocket) + pacotes por objetivo e por ficha. Pacote de
  5 cartas com piso garantido (1 prata ou melhor) e **chances visíveis na tela** (transparência é o oposto do que
  faz o FUT ser odiado).
- **Proteção contra azar:** cada pacote dá pontos; com pontos você **escolhe uma carta** comum/prata/ouro (Ícone e
  Evento ficam fora, pra continuarem especiais). Repetida vira pontos.
- **Sem mercado entre jogadores** na 1ª versão (mercado traz contas-fantasma, fraude e um monte de servidor). Troca
  entre amigos (já existe a lista de amigos) pode vir depois, com limite.
- **Trapaça:** o save é local, então quem quiser edita a coleção. Isso só importa no ranking: pacotes e partidas
  que contam pra classificação vêm do servidor (semente do pacote dada pela Edge Function, como a Liga já refaz a
  partida). Fora do ranking, o UT pode rodar 100% local.

## Equilíbrio (o que impede o time de Ícones de ganhar sempre)

1. **Química vale mais que nota.** As sinergias de tipo e de história já existem; no UT elas viram o centro
   (painel de química na escalação). Meta pra calibrar: um time prata com química cheia empata com um ouro sem
   química (números com `npm run calibrate` antes do ok).
2. **Evoluções (FUT Evolutions com evolução de verdade).** Carta de Charmander evolui pra Charmeleon e depois
   Charizard cumprindo objetivos com ela (jogar X partidas, fazer gols, ganhar o MVP); mantém a edição e a vaga.
   Pokémon sem evolução (Tauros, Lapras, Snorlax) ganham **Treino**: até 3 subidas de atributo por objetivo. Isso
   faz a carta comum valer a pena e prende o jogador ao time dele.
3. **Sem limite duro: a dificuldade é o limite** (decidido em 30/10, no lugar de "1 lendário e 1 Ícone"): o rival
   acompanha a média do seu time, você escolhe o nível de cada jogo (mais difícil paga mais, o fácil nunca paga zero)
   e objetivos com restrição ("time todo prata") pagam a mais.
4. **Rival do mesmo tamanho:** as rodadas casam times por Elo e por nota (o Elo da Liga já existe), então quem
   abriu Ícone cedo sobe e enfrenta gente igual.
5. **Equilibrar pela raridade primeiro** (Marvel Snap): carta que domina a temporada fica mais comum nos pacotes da
   seguinte, antes de mexer em atributo (atributo segue a regra de sempre: antes/depois + ok do Miguel).
6. **Desafios de montagem** (SBC): "monte um time só de Água com nota 70+", "5 da mesma linha evolutiva" →
   pacote temático. Comem as repetidas e ensinam a usar a química.

## O que se joga dentro do UT

- **Rodadas da temporada** (contra times-fantasma de outros jogadores, assíncrono, como a Liga): o modo principal.
- **Copa da temporada** (fim de semana): chave de 8 com os times do UT.
- **Duelo com o time do UT** (amigo ao vivo): um 4º modo no Duelo.
- Contra a IA (líderes de ginásio com time de UT) pra quem não quer ranking.

## Opções de escopo

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| Simples | UT local: coleção da temporada, pacotes, química, objetivos, contra IA/líderes; reset | 2 versões | baixo (nada de servidor novo) |
| **Média (recomendada)** | Simples + rodadas contra times-fantasma com ranking da temporada, pacotes do ranking vindos do servidor, Evoluções, pontes com a Copa | 3–4 versões | médio (reaproveita a Liga) |
| Rica | Média + Duelo com time do UT, desafios de montagem, troca entre amigos, temporada temática | 5+ versões | alto (economia e servidor) |

## Decidido com o Miguel (20/10/2026)

"O planejamento do UT tá perfeito": valem as recomendações das 8 decisões abaixo (B, 6 semanas, escopo Médio,
Evoluções sim, sem mercado na 1ª versão, UT entra na 1.0, nome "Ultimate Team" por enquanto, a Copa continua "Copa").

## Decisões pro Miguel

1. **Ponte entre os modos:** B, pontes de mão única (Copa dá pacote no UT; Pokédex/Álbum/medalhas juntos; carta do UT
   não entra na Copa) **(recomendado)** / A separados / C unificado.
2. **Temporada:** 6 semanas **(recomendado)** / 4 / 8. O que fica no Perfil: medalha + título + "Lenda da temporada"
   no Álbum **(recomendado)** / só medalha.
3. **Escopo da 1ª versão:** Média **(recomendado)** / Simples / Rica.
4. **Evoluções** (Charmander → Charizard por objetivo, Treino pra quem não evolui): sim **(recomendado)** / não.
5. **Mercado entre jogadores:** não na 1ª versão, troca entre amigos depois **(recomendado)** / nunca / sim já.
6. **Onde entra no plano:** hoje o roadmap põe o UT depois da 1.0, mas a regra é "1.0 = tudo do Em breve". UT entra
   na 1.0 **(recomendado, já que está no Em breve)** / fica depois e sai do Em breve.
7. **Nome:** "Ultimate Team" é o nome do modo da EA; dá pra manter ou ter um nosso ("Time da Temporada", "Clube dos
   Sonhos"…). Manter por enquanto e decidir antes de lançar **(recomendado)** / trocar já.
8. **E a Copa?** Passa a se chamar "Futsal casual" na Home, ou continua "Copa"? Continua "Copa" **(recomendado:
   o nome já pegou e a Copa do Dia depende dele)** / renomear.

## Pesquisa do FC 27 (30/10/2026): o que entra no plano

O UT do EA FC 27 saiu em 25/09/2026. A queixa nº 1 da comunidade é a sorte de pacote; o mais elogiado são as
Evoluções com caminhos e prévia. A pesquisa inteira (com as fontes) ficou fora do repo; o resumo:

| | O quê | Liga a |
|---|---|---|
| Copiar | Evoluções com caminho e prévia: você vê o Charizard antes de começar. Na Gen 1 só o Eevee ramifica; nos outros o caminho é o papel em quadra (o mesmo Charizard pivô ou fixo, pelos objetivos cumpridos) | Evoluções |
| Copiar | Pós-jogo que sempre paga (vitória > empate > derrota) | Fichas |
| Copiar | Chances do pacote visíveis na tela | pacotes |
| Copiar | Teto diário de pontos da temporada (o FC usa 850/dia), pra quem joga pouco não ficar pra trás | temporada |
| Copiar | Álbum permanente: a carta continua contando depois de evoluída ou gasta (a "FUT Gallery") | Álbum |
| Adaptar | Dificuldade escolhida com piso de prêmio: o difícil paga mais, o fácil nunca paga zero e ainda enche o pacote de 12 h e os objetivos; tabela de prêmio antes da partida | dificuldade |
| Adaptar | Pacote Mini (3 cartas) a cada 12 h e Grande por objetivo semanal | pacotes |
| Adaptar | Passe grátis com uma carta de abertura que cresce com os marcos da temporada | objetivos |
| Adaptar | Desafios do líder de ginásio (regra própria, contra IA, sem servidor), como os "Live Events" solo | objetivos |
| Adaptar | Desafio de montagem com pontuação-alvo, entrega parcial salva e sempre devolvendo um pacote pequeno | desafios |
| Evitar | Pacote sem proteção de azar (manter "pontos de pacote compram a carta") | pacotes |
| Evitar | Enfraquecer química ou carta no meio da temporada: fechar química e lendários antes de 27/11 | química |
| Evitar | Várias moedas: só Fichas | Fichas |
| Evitar | Evento toda semana | eventos |

## Fontes

- [EA, Pitch Notes FC 27](https://www.ea.com/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-launch-update)
- [fut.gg, Evoluções no FC 27](https://www.fut.gg/news/how-are-evolutions-changing-in-ea-fc-27-pathways-previews-and-more/)
- [Operation Sports, química no FC 27](https://www.operationsports.com/ea-fc-27-launch-day-pitch-notes-highlight-chemistry-changes-new-rewards-and-day-one-content/)
- [Fórum EA, sorte de pacote no FC 27](https://forums.ea.com/discussions/fc-27-ultimate-team-en/pack-luck/13830030)
- [EA FC 26: chemistry (Team Gullit)](https://www.teamgullit.com/ea-fc-26/chemistry)
- [EA FC 26 Ultimate Team tips (Red Bull)](https://www.redbull.com/ke-en/ea-fc-26-ultimate-team-tips-guide)
- [Beginner's guide to FC 26 Ultimate Team (The Xbox Hub)](https://www.thexboxhub.com/chasing-the-pros-a-beginners-guide-to-ea-sports-fc-26-ultimate-team-on-xbox/)
- [TCG Pocket in-game economy (Pokémon Zone)](https://www.pokemon-zone.com/articles/tcg-pocket-in-game-economy/)
- [Is Pokémon TCG Pocket pay-to-win? (Deltia's Gaming)](https://deltiasgaming.com/?p=79033)
- [Marvel Snap token shop and series (AV Club)](https://www.avclub.com/marvel-snap-update-new-cards-token-shop)
- [Marvel Snap series drops (esports.gg)](https://esports.gg/news/gaming/marvel-snap-february-series-drop/)
- [The design philosophy behind PoE 2's seasonal model (Game-Wisdom)](https://game-wisdom.com/general/design-philosophy-behind-poe-2s-seasonal-model-resetting-everything-works)
- [Diablo 4: new character every season? (GameStar)](https://www.gamestar.de/artikel/diablo-4-neuer-charakter-fuer-jede-season-gutes-feature-oder-zeitverschwendung,3396269.html)

## Decidido com o Miguel (30/10/2026): Time Ultimate

- **Nome:** "Time Ultimate" (EN "Team Ultimate"); id interno `ultimate`. Modo História continua o de 2027.
- **Lançamento 27/11:** coleção da temporada, pacotes (1 grátis a cada 12 h + objetivos + 1 por título da Copa),
  química, Evoluções, jogos contra IA e líderes, objetivos diários/semanais, reset no fim. Ranking, desafios de
  montagem, Duelo com o time e troca entre amigos ficam pra dez/jan. Antes do plano final: pesquisa do Ultimate
  Team do FC 27.
- **Liga separada** no lançamento (abre 01/12; servidor não confere posse de cartas); ranking do Time Ultimate na
  temporada 2 (janeiro).
- **Temporada 1 atravessa o Natal** (27/11 a ~08/01), com pacote natalino sem reset.
- **Sem limite duro de time; a dificuldade é o limite:** rival acompanha a média do seu time, você escolhe o nível de
  cada jogo (mais difícil = prêmio maior) e objetivos com restrição ("time todo prata") pagam a mais.
- **Moeda: Fichas** (as do Game Corner de Celadon).
- **Equilíbrio:** meta "prata com química cheia empata com ouro sem química"; números antes de aplicar.

## Plano de versões até 27/11 (01/11/2026)

Tudo atrás de `?lab=ultimate` até a bandeira ligar em 27/11 ([ADR 0005](../adr/0005-modo-novo-so-no-ar-depois-de-jogado.md));
o Miguel joga cada etapa na prévia. Motor igual (`ENGINE_VERSION` não muda). Números de economia e química são
constantes num lugar só (`src/store/ultimate/rules.ts`) e só valem depois do ok dele (tabela antes/depois).

| Versão | Data alvo | O que entra |
|---|---|---|
| 0.9.31 | ~08/11 | Base: save do Time Ultimate (fatia própria, migração), coleção da temporada, Fichas, pacote Mini a cada 12 h (acumula 2) com piso e chances na tela, abrir pacote (reusa o pacote da vitória), montar o time (reusa a Escalação), jogo contra IA com nível escolhido e tabela de prêmio antes da partida |
| 0.9.32 | ~15/11 | Química no centro (painel na escalação), objetivos diários e semanais, pontos de pacote que compram a carta, Evoluções com prévia (Charmander → Charizard por objetivo; Treino pra quem não evolui), ponte da Copa (título = 1 pacote) |
| 0.9.33 | ~22/11 | Temporada 1 (tema Kanto clássico, reset semestral, medalha e "Lenda da T1" no Álbum), desafios dos líderes de ginásio, passe grátis com a carta de abertura, Natal preparado como 1º evento, Pacote Grande nos objetivos semanais, polimento e playtest do Miguel (feito na branch `ultimate`, falta o playtest) |
| 27/11 | | Abre sozinho: `ultimateOn` (flag.ts) liga pra todo mundo a partir de `ULTIMATE_OPENS_AT` (27/11 00:00 de Brasília) e o menu tira o EM BREVE (feito em 02/11) |
| dez | | Evento de Natal (cartas Evento, objetivos, enfeite no Perfil) |
| jan | | Ranking do Time Ultimate, desafios de montagem; Duelo com o time e troca entre amigos depois |

**Pro ok do Miguel antes de valer:** chances do pacote por metal, Fichas por resultado e por nível, preço em pontos
de pacote, meta da química ("prata com química cheia empata com ouro sem química", medida no `calibrate`).

## Proposta de números (aprovada "a princípio" pelo Miguel em 02/11/2026, sujeita a mudanças)

0.9.31 (base), atrás de `?lab=ultimate` (só dev e prévias). Tudo em `src/store/ultimate/rules.ts`; nada aqui está
aprovado. Mudou um número? Muda lá e aqui.

| O quê | Proposta |
|---|---|
| Pacote Mini grátis | 1 a cada 12 h, acumula 2 (cheio, o relógio para); quem chega começa com os 2 |
| Cartas por Pacote Mini | 3 |
| Chance por carta | Bronze 62% · Prata 28% · Ouro 10% (metal pela nota no nível 50: ≤64 / 65–74 / 75+) |
| Piso | todo pacote tem 1 Prata ou melhor (se não saiu, a última vira Prata) |
| Edições por carta | Shiny 1/64 (1,6%) · Ícone 1% (só os 20 da lista); Evento fica pros eventos |
| Repetida (mesma espécie e edição) | não entra; vira pontos de pacote: Bronze 1 · Prata 3 · Ouro 8 (**09/11: moeda única, vira Fichas: 5 · 15 · 40**, [ultimate-fc.md](ultimate-fc.md#moeda-única-miguel-0911)) |
| Primeiros pacotes | até o time ter 7 cartas, o pacote não repete espécie que você já tem (2 pacotes = time pronto) |
| Rival da IA | clube de ginásio sorteado por partida só entre os que montam time a até 2 do alvo (`RIVAL_TOLERANCE`; 02/11); média dos titulares = a sua + Fácil −6 · Normal 0 · Difícil +4 · Mestre +8 (o mais perto entre 12 times do clube) |
| Fichas (V / E / D) | Fácil 30/15/10 · Normal 50/25/10 · Difícil 80/40/15 · Mestre 120/60/20 |
| Empate | placar igual no tempo normal (os pênaltis do motor ficam só como festa) |
| **0.9.32** | |
| Pontos por pacote aberto | +5 (além das repetidas). **09/11: +25 Fichas** |
| Carta escolhida com pontos | Bronze 15 · Prata 40 · Ouro 100 (a Normal, sem Shiny; Ícone e Evento fora; a espécie que você ainda não tem). **09/11: em Fichas, 75 · 200 · 500** |
| Pacote Mini com Fichas | 150 Fichas (sem teto) |
| Ponte da Copa | título da Copa = 1 Pacote Mini, até 2 por dia (Brasília); só pra quem já abriu o 1º pacote do modo |
| Objetivos do dia | jogue 2 → 30 Fichas · vença 1 → 40 Fichas · faça 4 gols → 1 Pacote Mini |
| Objetivos da semana | jogue 12 → 100 Fichas + 1 pacote · vença 6 → 2 pacotes · vença 3 no Difícil/Mestre → 2 pacotes · vença 2 sem Ouro entre os titulares → 100 Fichas + 1 pacote |
| Evolução: cada passo | 3 partidas com a carta + 2 gols (goleiro: 6 defesas) + 1 vez craque do seu time |
| Evoluções ao mesmo tempo | 2 |
| Treino (quem não evolui mais) | 3 subidas, cada uma +2 em tudo (a mesma conta da evolução, `evolved`) |

Decisões tomadas sem o Miguel (as mais simples que respeitam o plano), 0.9.31: o capitão se troca na aba Time; as
Fichas só acumulavam (na 0.9.32 compram Pacote Mini).

0.9.32: o 1º pacote sempre traz um goleiro (sem goleiro na coleção, a 1ª carta do pacote é um goleiro do metal
sorteado; as chances de metal não mudam) e o time enche só as vagas vazias, com a melhor distribuição pela nota na
vaga (nunca tira ninguém); o capitão nasce com a carta de melhor nota do 1º pacote. Os objetivos pagam sozinhos no
apito final (sem botão de resgatar). A Evolução dá o passo quando você toca em "Evoluir" (com a tela de evolução da
partida), nunca sozinha; uma carta faz uma Evolução ou um Treino só, e quem já está na forma final faz Treino. O
Treino reaproveita o bônus da evolução (+2 em tudo por subida), sem fórmula nova; por isso a ficha da carta mostra
"Evoluiu: +2 em tudo". Pacote Grande (objetivo semanal) ficou pra 0.9.33 (feito: o semanal paga Pacote Grande).

0.9.33, ainda atrás de `?lab=ultimate`. Nas prévias, `&utnow=2026-12-20` põe o modo naquela data (pra jogar a T1 e o
Natal antes da hora; em produção o relógio é sempre o de verdade). Atenção: entrar com uma data da T1 zera o save da
prévia (é a virada da temporada 0 pra 1).

| O quê | Proposta |
|---|---|
| **0.9.33** | |
| Temporadas | T1 27/11/2026 a 01/06/2027 (meia-noite de Brasília), tema Kanto clássico; T2 01/06 a 01/12/2027 (Ícones dos líderes, só o nome por enquanto) |
| Zera na virada | time, cartas do modo, Fichas, pacotes ganhos, passe, insígnias, objetivos; nasce com os 2 pacotes grátis |
| Fica (Perfil, no Álbum) | medalha de cada temporada jogada (1 partida já conta), marcos do passe, título "Campeão da Temporada N" (passe completo), a Lenda (carta com mais partidas; empate, a de nota maior), enfeites dos eventos |
| Pacote Grande | 5 cartas, pelo menos 2 Prata ou melhor (mesmas chances por carta do Mini) |
| Objetivos da semana | os mesmos, pagando Pacote Grande no lugar do Mini (1:1): jogue 12 → 100 Fichas + 1 Grande · vença 6 → 2 Grandes · vença 3 no Difícil/Mestre → 2 Grandes · vença 2 sem Ouro → 100 Fichas + 1 Grande |
| Passe: pontos por partida | vitória 40 · empate 25 · derrota 15 (desafio de líder vale o dobro) |
| Passe: teto por dia | 150 pontos (Brasília); ~4 vitórias |
| Passe: marcos | 40, um a cada 150 pontos (6.000 no total: ~40 dias no teto, ~110 dias jogando 2 por dia) |
| Passe: prêmios | marco 1: carta de abertura (Pikachu Normal); a cada 5 marcos ela sobe +2 em tudo (8 subidas, +16 no fim) e nos de 10 ainda 1 Pacote Grande; os outros: ímpar 100 Fichas, par 1 Pacote Mini |
| Líderes | os 8 clubes de ginásio, nível Difícil; regra pro titular: Brock 2 Pedra · Misty só Água (5) · Surge 2 Elétrico · Erika 3 Planta · Koga 3 Veneno · Sabrina time todo Prata (5) · Blaine 2 Fogo · Giovanni 3 Terra |
| Líderes: prêmio | 2x as Fichas do Difícil (160/80/30); 1ª vitória contra cada um na temporada: insígnia + 1 Pacote Grande |
| Natal (1º evento da T1) | 15/12/2026 a 05/01/2027; cada carta do pacote 1 em 12 (8,3%) de sair Evento (pintada de Gelo, +2 como toda Evento); objetivos: jogue 10 → 150 Fichas · faça 25 gols → 2 Mini · vença 6 → 1 Grande; os 3 = enfeite "Natal" no Perfil |
| Evolução no meio da partida | desligada no Time Ultimate (dos dois lados) |

Decisões tomadas sem o Miguel na 0.9.33 (as mais simples que respeitam o plano), pra ele confirmar:

1. **Evolução no meio da partida desligada no Time Ultimate** (dos dois times), sem mexer no motor: a carta entra na
   partida com a barra de evolução em −1.000.000, então nunca enche. Copa, Duelo e Liga iguais (`ENGINE_VERSION` 17,
   testes do motor iguais). Evoluir no Time Ultimate fica só pelas Evoluções. Alternativa: manter e guardar a forma
   nova na coleção (aí a Evolução perde sentido).
2. **"Campeão da Temporada" = passe completo** (40 marcos); a medalha vem com 1 partida. O título aparece no bloco do
   Time Ultimate no Álbum do Perfil; ainda não entra na lista de títulos do cartão do treinador (missions.ts).
3. **A Lenda fica no Álbum como carta com a fita "Lenda da T1"**, num bloco do Time Ultimate embaixo do livro (só
   aparece com legado). Não é uma edição nova de carta (visual novo de carta pede a galeria antes).
4. **Carta de abertura da T1 = Pikachu** Normal; cresce pela mesma conta do Treino (+2 em tudo por subida).
5. **Rival do líder**: o clube dele (os mesmos da Copa), com a força do Difícil sobre a média do seu time.
6. **Natal pintado de Gelo**: a edição Evento que já existe (nenhum visual novo); qualquer espécie pode sair Evento
   no Natal.
7. A virada espera o apito final de uma partida aberta; relógio que volta no tempo não volta a temporada; na nuvem
   vence a temporada mais nova e o legado dos dois lados fica junto.

**Pra ligar a bandeira em 27/11:** o ok do Miguel nos números (as três tabelas), ele jogar a prévia (inclusive com
`&utnow=2026-12-20` pro Natal e `&utnow=2027-06-01` pra virada), decidir os 7 itens acima, `npm run calibrate` da
meta de química (a abertura em 27/11 já está no `ultimateOn`, flag.ts: feito em 02/11),
patch notes e changelog da versão.

## Medição da química (falta o ok)

Meta: "um time prata com química cheia empata com um ouro sem química". Medido em 01/11 com
`scripts/pesado.sh npx tsx scripts/balance/quimica-ut.ts --n 400` (motor 16, nada mudou de número). Prata com química:
busca completa nas 54.152 combinações de 5 Pratas com goleiro, pela química do painel (tipo × história,
`attributeModifiers`), com a média na vaga também Prata. Ouro sem química: 5 Ouros sem tipo repetido nem história
(química 1,00), média na vaga 75+. Times montados como o modo monta (`fillTeam`, capitão = melhor nota, Equilibrada,
formação padrão, sem banco); resultado pelo placar do tempo normal, lados alternados.

| Par | Partidas | V | E | D | Saldo/jogo | Gols (prata x ouro) |
|---|---|---|---|---|---|---|
| 1: Prata 65, química 1,14 (Wartortle 70, Omanyte 66, Seadra 70, Seaking 71, Kabuto 66; Água + Fósseis + Misty) x Ouro 79 (Hypno 89, Blastoise 88, Gengar 83, Moltres 85, Machamp 91) | 400 | 54,8% | 15,0% | 30,3% | +0,72 | 3,93 x 3,21 |
| 2: Prata 66, química 1,10 (Graveler 72, Omanyte 66, Poliwhirl 67, Seadra 70, Kabuto 66; Fósseis) x Ouro 79 (Machoke 78, Flareon 78, Venomoth 77, Mew 91, Tauros 77) | 400 | 20,0% | 15,5% | 64,5% | −1,25 | 2,73 x 3,99 |
| 3: Prata 65, química 1,09 (Wartortle 70, Omanyte 66, Charmeleon 67, Butterfree 67, Kabuto 66; Ash + Fósseis) x Ouro 79 (Snorlax 91, Cloyster 78, Clefable 82, Arcanine 87, Dragonite 89) | 400 | 30,3% | 18,8% | 51,0% | −0,58 | 3,56 x 4,14 |
| Geral: as 6 Pratas de química mais alta (1,07 a 1,14) x 12 Ouros (75 a 84) | 2.376 | 39,1% | 17,0% | 43,9% | −0,13 | 3,42 x 3,55 |

Leitura (n=200 deu o mesmo, 39,1 / 17,7 / 43,1, saldo −0,11):

- **No geral a meta está quase batida:** a Prata de química alta perde por pouco (39 x 44, saldo −0,13 por jogo)
  de um Ouro sem química com 13 pontos a mais de nota na vaga (66 x 79).
- **A química "cheia" de verdade (1,14) passa da meta:** o único time Prata que chega perto do teto (+15%) é o de
  Água com Fósseis e Misty, e ele **ganha** do Ouro (55 x 30). Química 1,09–1,10 já perde (20–30% de vitória).
  Ou seja: os últimos 4–5 pontos de química valem muito.
- **Só a Água fecha 5 do mesmo tipo em Prata:** há só 26 espécies Prata (68 Ouro, 57 Bronze) e quase todo tipo tem
  1 ou 2 delas; o resto da química Prata vem das sinergias de história (Fósseis aparece em todos os melhores).
  Pra muitos jogadores, "prata com química cheia" vai ser o time de Água.
- O capitão do mesmo tipo (+6% pro time de um tipo só) entra na conta, como no modo; o painel de química não o mostra.

Pro Miguel decidir (nada mudado): a meta vale assim, ou mexer (química, teto, chances de Prata/Ouro) antes de 27/11?

## Decidido com o Miguel (01/11/2026)

- As 7 decisões da 0.9.33 valem como estão ("perfeito").
- Química: a meta medida (Prata de química alta x Ouro sem química, 39/17/44 em n=400) fica assim.
- Números das tabelas "Proposta de números": ele vai olhar e responder. A prévia ele joga depois.

## Etapa até 27/11: Primeiros passos, objetivo no JOGAR, pacote e pós-jogo (02/11/2026, números aprovados pelo Miguel)

Feito na branch `ultimate`, atrás de `?lab=ultimate` (B em etapas, `fc-ut-sistema.md` e `menus-fc-e-aclamados.md`).
Nenhum número que já existia mudou; os novos estão em `src/store/ultimate/rules.ts` (`FIRST_STEPS`).

| Primeiro passo | Quando conta | Prêmio (proposta) |
|---|---|---|
| Abra o 1º pacote | abriu um pacote | 20 Fichas |
| Mexa na escalação (aba Time) | trocou vaga, formação, tática, escanteio ou capitão | 20 Fichas |
| Jogue a 1ª partida | apito final da 1ª | 30 Fichas |
| Vença uma partida | 1ª vitória | 30 Fichas |
| Comece uma Evolução (aba Metas) | começou uma Evolução ou Treino | 50 Fichas |

Os 5 somam 150 Fichas, o preço de um Pacote Mini na loja (`FICHAS_PACK_PRICE`): o último passo ensina a loja. Cada
um paga uma vez, na hora; recomeçam na temporada nova (como o resto do modo).

- **Botão JOGAR:** embaixo do "JOGAR" vai "Primeiros passos 2/5" até acabarem; depois, o objetivo do dia, da semana
  ou do evento mais perto de fechar (maior fração; empate, o primeiro da lista), com "x/meta".
- **Pacote:** tela cheia (Momento do kit), arrastar de lado rasga a tampa (o toque e o Enter também abrem), leque, e
  a melhor carta, se for Ouro 75+ ou edição, guardada pro walkout em 3 batidas com Pular (`walkoutIndex`).
- **Pós-jogo:** cascata de até 3 s (Fichas contando, passe, objetivos e Primeiros passos um por um, o que dá pra abrir
  por último); tocar pula; "Abrir agora" quando a partida deu pacote (abre o Grande se tiver ganho um, senão o Mini).
- **Música:** o Time Ultimate toca a `menu-balanco` até ter a própria.

Decidido com o Miguel (02/11/2026): os 5 prêmios ficam (20, 20, 30, 30, 50), os Primeiros passos recomeçam a cada temporada e o "Abrir agora" entra.

## Junção com a 0.9.37 e playtest headless (02/11/2026)

Main 0.9.37 juntada na `ultimate` (motor 19 igual, sem `calibrate`); depois a 0.9.37.1 (sem o letreiro de canal
flutuante). Save 0.9.37 (v9) abre na branch e vira v10 com a fatia vazia.

**Abertura automática (02/11, aprovado):** `ultimateOn` (flag.ts) liga o modo pra todo mundo a partir de
`ULTIMATE_OPENS_AT` = 27/11/2026 00:00 de Brasília (`Date.UTC(2026, 10, 27, 3)`, a mesma data da contagem do menu).
Antes disso, em produção, nada muda (EM BREVE 27/11). No dev e nas prévias `?lab=ultimate` liga antes,
`&utnow=2026-11-27` simula a data (só lá) e `?lab=ultimate-off` mostra o menu antigo. Depois da data o canal diz
AO VIVO em vez de PRÉVIA e o cabeçalho do modo perde o selo "Prévia".

Pro Miguel decidir: **o Fácil nem sempre é fácil pra quem começa.** O rival sai de 12 times do clube sorteado
(`aiDraftTeam` com dificuldade −2 a 3) e alguns clubes não têm time fraco o bastante: medido em 200 saves novos
(2 pacotes, média 49–74), em 22 o rival do 1º Fácil tem média igual ou maior que a do jogador (3 com +5 ou mais; no
pior, 50 x 59, que perdeu 0x7 e mais 4 seguidas). Opções: aceitar, abrir a faixa de dificuldade da IA no Fácil, ou
escolher o clube entre os que chegam perto do alvo.

**Decidido com o Miguel (02/11/2026): o clube sai só entre os que chegam perto do alvo** (a até `RIVAL_TOLERANCE` = 2;
nenhum chega, fica o mais perto). Ordem embaralhada pela semente e `n`, o primeiro que chega: determinístico, e o
clube pode mudar com o nível. Medido de novo, mesmo método (200 saves novos, 1ª partida):

| | antes | depois |
|---|---|---|
| Fácil: rival com média ≥ a sua | 22 de 200 (3 com +5 ou mais; pior +9) | 0 de 200 (pior 50 x 49) |
| Fácil: rival a até 2 do alvo | 111 de 200 | 196 de 200 (os 4 de fora até +5, sem clube fraco o bastante) |
| Normal / Difícil / Mestre: rival a até 2 do alvo | 134 / 154 / 157 de 200 | 200 / 200 / 200 |

## Rival pela força e Fichas pelo nível alcançado (06/11/2026, motor 27, aprovado pelo Miguel)

- **Rival pela força:** `ultimateRival` mira a força do seu time (`teamStrength`: média na vaga × química, com o banco no
  monotipo, a mesma regra da partida) + LEVEL_GAP, e não só a média. A torcida segue fora do modo.
- **Fichas pelo nível que o rival alcança** (`paidLevel`): sem clube à altura (time forte no Mestre), a partida vale o
  nível que ele alcançou, nunca acima do escolhido. Fichas e o objetivo "vencer no Difícil" seguem esse nível; a folha
  de nível mostra a tabela já ajustada e "Nenhum rival à altura: paga como X".
- **Medida** (`scripts/balance/niveis-ut.ts --n 400`, ±4,9 pp, robô dos dois lados, rival com o treinador que reage
  como na tela). Vitórias, antes (n 200, mesmo método) ⇒ depois:

| Time | Fácil | Normal | Difícil | Mestre | Mestre paga o nível |
|---|---|---|---|---|---|
| Início (média 62) | 39 ⇒ 45% | 32 ⇒ 38% | 26 ⇒ 27% | 18 ⇒ 21% | 100% |
| 1ª semana (78) | 33 ⇒ 40% | 28 ⇒ 30% | 24 ⇒ 23% | 18 ⇒ 15% | 94% |
| 1º mês (85) | 47 ⇒ 46% | 39 ⇒ 35% | 33 ⇒ 30% | 34 ⇒ 23% | 52% |
| 7 de Água (68, monotipo) | 68 ⇒ 48% | 62 ⇒ 33% | (62) ⇒ 34% | (43) ⇒ 16% | 75% |

  Entre parênteses, a medida antiga sem o treinador do rival (a de antes parou no meio). Mestre do 1º mês: Fichas por
  partida 60 ⇒ 36. Ressalva: o robô do seu lado não troca nem chama o capitão; o rival tem treinador que reage.
