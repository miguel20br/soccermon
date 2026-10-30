---
description: Proposta do modo Ultimate Team, o segundo modo principal.
---

# Ultimate Team (proposta, 20/10/2026)

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

- **Duração:** 6 semanas (dá pra ter 2 "Semanas do tipo" dentro e não cansa). A 1ª pode ser mais curta (4) pra testar.
- **Zera:** time, cartas do UT, moedas, pontos de pacote, ranking.
- **Fica (no Perfil):** medalha da temporada (posição final), título ("Campeão da Temporada 1"), a carta que mais
  jogou vira figurinha especial no Álbum ("Lenda da T1", só enfeite), estatísticas da temporada no Hall da Fama.
- **Tema por temporada** (a mecânica nova de cada liga do PoE): T1 Kanto clássico; T2 Ícones dos líderes de
  ginásio; T3 temporada de um tipo (cartas Evento daquele tipo nos pacotes) etc. Muda o que sai nos pacotes e os
  desafios, não o motor.

## Economia (sem dinheiro nenhum, nunca)

- **Uma moeda** (nome a decidir; ex.: "fichas") que só se ganha jogando: partida do UT (vitória > empate >
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
3. **Limites de escalação:** 1 lendário (aves, Mewtwo, Mew) e 1 Ícone por time; espécie repetida não. Número a
   decidir junto.
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

## Fontes

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
