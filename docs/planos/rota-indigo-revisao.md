---
description: Revisão da Rota Índigo (30/10/2026): bugs consertados, o que está feio ou incoerente, quanto o caminho importa (simulado), os eventos de hoje e 13 novos, o redesenho do mapa e as decisões pro Miguel.
---

# Rota Índigo: revisão (30/10/2026)

Pedido do Miguel: "ela tem diversos bugs, coisas feias e incoerências"; "as escolhas quase não importam porque dá pra
pegar a maioria com qualquer caminho, os eventos são muito ruins".

Como foi feita:
- Joguei a Rota inteira headless a 390x844, 320x568 e 1440x900 (mais 844x390 nas telas do mapa): entrada, mapa, cada
  tipo de casa, os 8 eventos, Treino, Mercado, Baú, amarelo, vermelho, grupo, Final, campeão, sair no meio e voltar, e
  uma partida de verdade com evolução no meio. As decisões saíram pelo store; as telas, pelos cliques.
- Simulei 1.200 Rotas inteiras com 8 políticas de caminho, nas mesmas 150 seeds (`scripts/balance/rota-caminhos.sim.test.ts`).
- Prints fora do repo, no scratchpad da sessão:
  `~/.cache/claude-tmp/claude-1000/-home-bartolomeu-Projects-soccermon/152ccaaa-4524-49c1-9d45-e064e56ed88b/scratchpad/rota/`
  (`shots/` antes, `shots/after/` depois, `mock-*.png` as prévias). Abaixo, só o nome do arquivo.

## Consertos feitos

Branch `rota-indigo`, um commit cada. Os de lógica têm teste que falha sem o conserto.

| # | O que era | Onde | Commit |
|---|---|---|---|
| 1 | A barra da copa dizia "Partida 3 de 8" e o Continuar do Estádio "4 de 8" no mapa, no evento, no Treino, no Mercado, no Baú e no grupo, depois de **qualquer** partida. A barra contava `run.stage` (a última em que você entrou); o Continuar, `results.length` (a próxima). A próxima é `results.length`: é assim que o mapa (`matchIndexOfRow`) e o grupo (`playNext`) escolhem a partida. Agora tudo passa por `cupMatchNow` | `long-cup.ts`, `CupBar.tsx`, `AccountLink.tsx` | `59527355` |
| 2 | Vender o capitão com ele no banco deixava o uid dele no banco e sumia com o reserva: a próxima partida montava o banco com uma carta que não existe | `long-events.ts` | `4a8df985` |
| 3 | "CARTÃO VERMELH / O": o título do resultado quebrava no meio da palavra a 390 e a 320 | `ResultHero.tsx`, `styles.css` | `19797b56` |
| 4 | Final: "vs Indigo Plateau" em português; em inglês os times da Rota ficavam em português ("vs Ornitólogos") | `i18n/index.ts` (`rivalLabel`), `Lineup.tsx` | `489c44cc` |
| 5 | A ficha da casa dizia "Média 55" e a escalação "Média 54" pro mesmo rival | `CupMap.tsx` | `9285998e` |
| 6 | A escolha marcada no evento ficava dourada (dourado é só do JOGAR; escolhido é azul) | `long-cup.css` | `e06267dd` |
| 7 | A 320, o texto do evento saía com uma palavra por linha, e os nomes do grupo eram cortados seco ("Lavender As") | `long-cup.css` | `9a3b6d95` |
| 8 | O Baú prometia "Pacote grátis", mas abre a recompensa 1 de 3 | `i18n/*/longCup.ts` | `960d9282` |
| 9 | Treino era seta no mapa e halter na tela do Treino | `CupMap.tsx` | `d0571738` |
| 10 | `?demo=mapa&meio=1` (e os demos de evento, Treino, fora e eliminado) tinha 3 resultados com 2 partidas andadas | `dev-demo.ts` | `10d994ab` |
| 11 | Celular deitado: o "Ir" da casa escolhida ficava abaixo da tela, sem rolagem que chegasse nele. Não dava pra entrar na casa | `long-cup.css` | `77db3fd2` |

Conferido depois: `npm run teleporte` nas telas da Rota (mapa, 3 eventos, Treino, grupo) não acusou nada, nenhum
caractere-ícone nem emoji nas telas da Rota, o logo delas pisca com a música (`LogoHits`), e a evolução no meio da Rota
(Magnemite → Magneton) roda com a animação dela.

## Feio e incoerente (propostas, não mexi)

1. **Tela do evento.** As escolhas ficam soltas no alto e a metade de baixo fica vazia (no PC, tudo miúdo no meio).
   Proposta: a cena (quem fala, grande, e o texto) no meio, as escolhas na barra do polegar. Prévia: `mock-1-evento.png`.
2. **Texto do amarelo.** 25 palavras, e "você tem 2 chances e pode perder uma única vez" diz a mesma coisa duas vezes.
   Proposta: "Primeira derrota no mapa. Mais uma e a Rota acaba." Prévia: `mock-2-amarelo.png`.
3. **Vermelho repetido.** O título "CARTÃO VERMELHO" e, logo embaixo, o cartão "Cartão vermelho. Segundo amarelo".
   Proposta: título "DERROTA" (como no amarelo) e o cartão conta o resto. Print: `after/390-d-eliminado.png`.
4. **"0 de 8" na Rota.** Ao lado do título, parece o progresso da Rota (que tem 8 jogos), mas são as insígnias.
   Proposta: "0/8 insígnias". Prévia: `mock-3-insignias.png`.
5. **MT "Baú raro" depois de um Jogo.** Na Rota o Baú é uma casa de verdade, então a MT da vitória num Jogo dizendo
   "Baú raro" confunde. Proposta: "MT rara" (vale pra Relâmpago também). Print: `390-10-recompensa.png`.
6. **Misty fora de hora.** "Não gaste todo o seu ₽ no primeiro Mercado" aparece na linha 6, depois de duas linhas com
   Mercado. Proposta: "O ₽ que você guarda rende no próximo Mercado. Não torra tudo, viu?"
7. **Tocar = escolher.** No Treino e na escolha de "quem" do evento, tocar no Pokémon já aplica, sem volta. Na
   Recompensa e no Mercado tem botão. Proposta: tocar marca (azul) e um botão confirma.
8. **Patrocinador misterioso.** "Os 2 reservas saem" sem mostrar quem são. Proposta: os dois rostos, como no carrinho.
9. **Status escondido no celular.** O mapa abre rolado até a casa aberta, e o status (₽, amarelo, Patrocínios) fica
   cortado embaixo da barra. Print: `390-d-mapa-meio.png`. Proposta: só o amarelo numa etiqueta presa no mapa (o ₽ já
   está na barra).
10. **320.** "Continuar · Mt. / Moon" quebra o nome da região no botão (`320-23-rota-continuar.png`); "Jogar partida
    3 de 8" vira três linhas ao lado do aviso de quem está fora (`320-d-fora.png`).

## Escolhas de caminho (medido)

### O mapa

2.000 mapas sorteados:

| | |
|---|---|
| Caminhos por mapa | 94 |
| Sequências de casas diferentes | 21 |
| Caminhos com pelo menos 1 Mercado | 80% |
| Caminhos com pelo menos 1 Evento | 80% |
| Mapas com Ginásio | 94% (56% dos caminhos passam por um) |
| Combinações que ainda dá pra fazer depois da 1ª casa | 72% |

Toda linha de parada tem Mercado e Evento, a linha do Baú é só Baú, e toda rota tem as mesmas 4 partidas no mapa. O
mapa fecha pouco: escolher uma casa raramente tira alguma coisa de você.

### O robô

150 Rotas por política, mesmas seeds pra todas. O robô monta pelo "Monta pra mim", joga na equilibrada, pega
Pokémon que melhora uma vaga e item pra titular sem item, compra no Mercado o que melhora o time e um Patrocínio.
Erro do título: ±3 pp. O time é a média da nota na vaga dos titulares.

| Política | Título | Chega ao grupo | Time na 1ª | Time no grupo | Itens | Pokémon novos | ₽ ganho |
|---|---|---|---|---|---|---|---|
| Sempre à esquerda | 15,3% | 43% | 63,6 | 83,7 | 3,6 | 1,9 | 24 |
| Sempre à direita | 15,3% | 45% | 63,6 | 83,5 | 3,6 | 2,0 | 25 |
| Atrás de ₽ (não compra, vende o capitão) | 14,7% | 39% | 63,6 | 83,1 | 3,1 | 1,5 | 22 |
| Atrás de Pokémon (Ginásio, Baú, Mercado) | 11,3% | 39% | 63,6 | 83,8 | 3,8 | 1,9 | 23 |
| Sempre Ginásio | 17,3% | 39% | 63,6 | 83,7 | 3,8 | 1,8 | 23 |
| Aleatório | 14,7% | 43% | 63,6 | 83,4 | 3,6 | 2,0 | 25 |
| **Só as vitórias** (pula toda parada) | 10,0% | 33% | 63,6 | 82,8 | 2,0 | 1,0 | 20 |
| **Nada** (pula tudo, até a recompensa) | 9,3% | 30% | 63,6 | 82,3 | 0 | 0,1 | 20 |

O que os números dizem:
- **O caminho não muda o time.** Entre as seis políticas, o time no grupo varia 0,7 ponto (83,1 a 83,8) e o título
  fica dentro do erro. Nas mesmas seeds, esquerda e direita trazem Pokémon diferentes (só 17% das espécies em comum),
  mas o mesmo tanto de força.
- **Quase todo o crescimento vem sozinho.** O robô que recusa tudo vai de 63,6 a 82,3: a evolução da pré-evolução
  jogando dá uns 19 pontos. Todas as escolhas juntas (recompensas, Mercado, eventos, Treino) somam 1,3 ponto e uns 5 pp
  de título.
- **Não existe caminho do dinheiro.** O ₽ vem das vitórias (+5 e gols); o juro do Mercado para em +3. Quem corre atrás
  de ₽ termina com menos, porque ganha menos partidas.
- **O Ginásio não é aposta.** O robô que sempre vai no Ginásio tem o mesmo time e o melhor título da tabela. Rival +1
  (com teto) não pesa, e o prêmio não é exclusivo: toda vitória já dá um dos 3 melhores do rival.

Ressalvas: o robô não usa MT, não troca tática, não faz substituição e é ruim (eliminado no mapa em ~57% das Rotas).
Simulação não mede diversão. O "time no grupo" só conta quem chegou lá. Roda de novo com
`SIM=150 POL=... scripts/pesado.sh npx vitest run scripts/balance/rota-caminhos.sim.test.ts --maxWorkers=1`.

## Eventos

### Os 8 de hoje

| Evento | O que acontece | Escolhas | Veredito |
|---|---|---|---|
| Trombada no treino | Dois do time se trombam | Um descansa (fora 2) · Fisio (−₽4) | **Imposto.** Em ~metade das vezes um dos dois é reserva e parar sai de graça; nunca tem lado bom |
| Patrocinador misterioso | Troca os 2 reservas por uma carta ouro (a melhor de 5) | Trocar · Recusar | **Falsa.** A carta é vista e quase sempre é melhor que os dois reservas |
| Proposta pelo capitão | +₽15 pelo capitão | Vender · Recusar | **Decisão de verdade**, mas rara (peso 1 de 22) |
| Olheiro da Liga | 2 cartas por ₽3 | Contratar um · Agora não | **Mercado repetido.** Sim se for melhor que o pior reserva |
| Entrevista coletiva | O próximo rival muda | Respeito (−1) · Provocar (+1 e +₽4) · Sem comentários | **Quase falsa.** "Respeito" é grátis e só ajuda; "Sem comentários" não faz nada |
| Pokémon perdido | Uma carta da raridade mais baixa | Levar junto · Deixar ir (+₽1) | **Só um ok.** A carta é fraca demais pra pesar |
| Treino puxado | Meia barra de evolução | Em dobro (fora 1) · Leve (+1 sorteio) · Folga | **Falsa.** No reserva o "fora 1" não custa nada; "Folga" perde de "Leve" |
| Creche | Barra cheia | Deixar um (fora 2) · Recusar | **Falsa.** No reserva sai de graça |

O que se repete: toda escolha com custo tem uma saída grátis que também dá algo, o custo quase sempre cai num reserva
que não joga, e nenhum evento depende do seu time.

### 13 novos (custo que dói, uma saída sem ganho)

Regras: uma tela, 2 ou 3 escolhas, o custo no botão, sempre uma saída que não ganha nada, ninguém do time sofre sem
você escolher quem, tudo pela seed. Custos possíveis: o amarelo, um titular fora, ₽, um reserva, a barra de
evolução, o capitão, um item, o próximo rival mais forte.

| # | Evento | Quem fala | Texto | Escolhas |
|---|---|---|---|---|
| 1 | Fósseis do Mt. Moon (só no Mt. Moon) | supernerd | "Esses fósseis são meus! …Tá. Leva um." | Fóssil Hélice: Omanyte no banco · Fóssil Domo: Kabuto no banco · Pedra da Lua: um do time que evolui por ela evolui na próxima partida. O que você não leva, some |
| 2 | Pássaro lendário (Zapdos na Usina, Articuno em Seafoam, Moltres na Estrada da Vitória) | bill | "Um Zapdos pousou na Usina. Ninguém chega perto." | Desafiar: a próxima partida é contra um time com ele (+2); vencendo, ele é seu · Deixar ele lá |
| 3 | Assalto da Equipe Rocket | rocket | "Prepare-se para encrenca! Passa o melhor item ou um reserva." | Entregar um item (você escolhe) · Entregar um reserva (você escolhe) · Encarar: o próximo Jogo é contra a Equipe Rocket +2; vencendo, +₽8 e o item deles |
| 4 | Aposta do Blue | blue | "Aposto ₽6 que você não ganha o próximo por 2 gols." | Topar: vitória por 2+ gols, +₽6; senão, −₽6 · Nem vem |
| 5 | Juiz da Liga (só com amarelo) | gentleman | "Revi o lance da sua derrota. Dá pra limpar esse amarelo." | Limpar: −₽10 · Limpar: seu melhor reserva vai embora · Deixa quieto |
| 6 | Ovo da Creche | gentleman | "Achei um Ovo no quintal. Choca em 2 partidas." | Ficar com ele: sai um reserva agora; em 2 partidas nasce um raro (Dratini, Eevee, Lapras…) · Deixar |
| 7 | Faixa-Preta (troca o Treino puxado) | blackbelt | "Hai! Me empresta um titular. Volta mais forte… ou não volta." | Emprestar (você escolhe): 2 em 3, barra cheia; 1 em 3, fora 2 partidas · Hoje não |
| 8 | Entrevista (nova) | beauty | "Uma palavrinha sobre o próximo rival?" | Provocar: rival mais forte; vencendo, +₽6 e o melhor deles na recompensa · Elogiar: rival mais fraco, recompensa uma raridade abaixo · Sem comentários |
| 9 | Proposta pelo capitão (nova) | giovanni | "Seu capitão me interessa. ₽20, agora." | Vender: +₽20, um reserva entra e você escolhe o novo capitão (e ele aparece na Equipe Rocket depois) · Recusar |
| 10 | Snorlax na estrada | hiker | "Tem um Snorlax dormindo no meio da Rota. Não passa ninguém." | Esperar: quem está fora volta, mas você pula a próxima parada · Dar a volta: −₽3 · Acordar com o Lutador (precisa de um Lutador no time): o Snorlax vem pro banco |
| 11 | Troca com o Bill (precisa de Kadabra, Machoke, Graveler ou Haunter) | bill | "Troca comigo? Ele evolui e eu te devolvo, palavra." | Trocar (você escolhe): barra cheia, fora 1 partida · Agora não |
| 12 | Torre Pokémon | channeler | "Um Gengar quer fazer um pacto com um dos seus." | Aceitar (você escolhe quem): +4 em tudo até o fim, e o Gengar leva um reserva (você escolhe) · Sair correndo |
| 13 | Safari Zone | lass | "Entrada da Safari: ₽5. Cuidado que eles fogem!" | Entrar: −₽5, escolhe 1 de 3 da Safari (Kangaskhan, Tauros, Chansey, Scyther, Pinsir); 1 em 3 foge · Seguir |

Os 1, 10 e 11 são as "opções azuis" do FTL: aparecem por região ou pelo seu time. A 2 é um Ginásio dentro do evento.
A 5 é a escolha "descansar ou melhorar" do Slay the Spire.

**Cortar:** Pokémon perdido (não pesa), Olheiro (repete o Mercado), "Folga" e o "+1 sorteio" do Treino leve (o mesmo
prêmio de consolação do Descanso e do Pular), Creche e Treino puxado (viram o Ovo e o Faixa-Preta). Trombada fica,
mas só com dois titulares.

## Redesenho proposto

A pesquisa (Slay the Spire, Monster Train, FTL, Hades, Inscryption, Darkest Dungeon, PokéRogue) e a
[copa-longa-referencias.md](copa-longa-referencias.md) chegam no mesmo ponto: caminho é aposta quando cada casa dá
**uma** coisa, você vê o que ela dá antes de ir, e o que tem num lado falta no outro.

1. **Ramos com tipo (PokéRogue).** Cada coluna vira uma rota de Kanto com tipos, como os times da Rota já têm (Rota
   24: Água e Grama; Túnel de Pedra: Pedra e Lutador; Torre: Fantasma e Psíquico). Rival, Baú, Mercado e pacote
   daquele ramo puxam o tipo. Escolher o lado é escolher a cara do time. No código: o nó ganha `types`, e
   `rewardOptions`/`shopOffers` passam o tipo pro `draftOptions` (o pacote do Mercado já faz isso).
2. **Prêmio à vista (Hades).** Cada Jogo mostra o prêmio no mapa: "Pokémon do rival", "MT", "₽ em dobro" ou "item de
   tipo". Hoje toda vitória dá o mesmo 1 de 3.
3. **A evolução passa pelo caminho.** Hoje ela dá uns 19 dos 20 pontos que o time cresce, sem escolha nenhuma.
   Proposta: as pedras do Gen 1 viram prêmio de região (Pedra da Lua no Mt. Moon, Pedra d'Água em Cerulean, Pedra do
   Trovão na Usina, Pedra da Folha em Celadon, Pedra de Fogo em Cinnabar), e quem evolui por pedra (Pikachu, Eevee,
   Growlithe, Vulpix, Clefairy, Jigglypuff, Gloom, Weepinbell, Exeggcute, Poliwhirl, Shellder, Staryu, Nidorina,
   Nidorino) só evolui com ela. O resto continua evoluindo jogando. Mexe na regra da evolução: decidir junto.
4. **Ginásio de verdade (elite do Slay the Spire).** Rival +2 (hoje +1, com teto), aparece desde a 2ª partida, e o
   prêmio é exclusivo: a carta ouro do líder garantida (o Onix do Brock, a Starmie da Misty), a insígnia e a MT. A
   aposta é o amarelo.
5. **Escassez.** No máximo um Mercado por caminho (o gerador garante), Treino e Mercado nunca no mesmo ramo, e a linha
   do Baú vira escolha: Baú · Centro Pokémon (tira o amarelo ou traz de volta quem está fora) · Ginásio.
6. **Eventos novos** (a lista acima), com a chance do "?" subindo pro tipo que não saiu, como no Slay the Spire.

Meta, medida com o mesmo robô: o melhor e o pior caminho diferirem uns 3 pontos de time ou 5 pp de título (hoje 0,7
ponto), e a diferença entre jogar e recusar tudo passar de 1,3 pra uns 5 pontos. Não simulei o redesenho: os números
de antes/depois saem do robô quando cada etapa estiver pronta, como pede o balanceamento.

Ordem que eu seguiria: 1 e 2 juntos (mexem no mapa e na recompensa), depois 4 e 5, depois os eventos, e a 3 por
último (é a que mais mexe no jogo).

## Decisões pro Miguel

1. **Textos** (amarelo, vermelho, "0/8 insígnias", "MT rara", fala da Misty, "Mt. Moon" sem quebrar): posso trocar?
   Recomendo sim. São só texto.
2. **Tela do evento** com as escolhas na barra do polegar (`mock-1-evento.png`)? Recomendo sim.
3. **Tocar marca, botão confirma** no Treino e no "quem" do evento? Recomendo sim.
4. **Ramos com tipo + prêmio à vista** (redesenho 1 e 2) como primeira etapa? Recomendo sim.
5. **Ginásio elite** (+2, carta ouro do líder garantida, insígnia)? Recomendo sim, com antes/depois do robô antes de
   subir.
6. **Escassez** (1 Mercado por caminho; a linha do Baú vira Baú · Centro Pokémon · Ginásio)? Recomendo sim.
7. **Eventos:** cortar os 5 da lista e entrar com quais novos? Recomendo começar por 6: Fósseis do Mt. Moon, Pássaro
   lendário, Assalto da Equipe Rocket, Aposta do Blue, Juiz da Liga e Ovo.
8. **Pedras evolutivas** (redesenho 3): mexe na regra da evolução. Recomendo sim, mas só depois das etapas 4 a 7, e
   com você jogando umas Rotas na prévia.
9. **O robô de caminhos** (`scripts/balance/rota-caminhos.sim.test.ts`) vira a régua de cada etapa? Recomendo sim.

## O que entrou (30/10/2026, branch `rota-redesenho`)

O Miguel disse "sim em tudo" pras 9 decisões. Entraram a 1 a 7; a 8 ficou de fora (abaixo).

1. **Textos:** amarelo curto, "DERROTA" no vermelho, "0/8 insígnias", "MT rara", a fala da Misty, e o Continuar da
   Rota com a região na linha de baixo (não quebra "Mt. Moon"). A 320, a dica do titular fora sobe pra cima do Jogar.
2. **Tela do evento:** a cena no meio, as escolhas na barra do polegar.
3. **Tocar marca, botão confirma** no Treino e no "Quem?" do evento (a barra vira Voltar · Confirmar).
4. **Ramos com tipo:** 3 ramos por mapa (de `BRANCHES` em `cup-map.ts`), um por coluna; rival, Baú, Mercado e item de
   tipo puxam eles. **Prêmio à vista:** todo Jogo mostra o prêmio no mapa (Pokémon do rival, MT, item de tipo ou ₽ em
   dobro), cada um diferente na mesma linha.
5. **Ginásio elite:** rival +2 (era +1 com teto), desde a 2ª partida, e o prêmio é a carta do líder (Onix, Starmie,
   Raichu, Vileplume, Weezing, Alakazam, Arcanine, Rhydon, Gengar), a MT dele e um item. O Onix é prata (70), os outros
   ouro. A insígnia já saía da vitória no ginásio.
6. **Escassez:** no máximo 1 Mercado por caminho e nunca Mercado e Treino no mesmo caminho (a casa que sobra vira
   Evento). A linha do Baú vira Baú ou Centro Pokémon (tira o amarelo ou traz de volta quem está fora). O Ginásio
   nessa linha ficou de fora: mudaria o número de partidas por caminho (hoje são sempre 8).
7. **Eventos:** saíram Olheiro, Pokémon perdido, Treino puxado e Creche; a trombada é só entre titulares. Entraram
   Fósseis do Mt. Moon (na linha antes do Mt. Moon), Pássaro lendário (Zapdos, na linha de Cerulean), Assalto da Equipe
   Rocket, Aposta do Blue, Juiz da Liga (só com amarelo) e Ovo da Creche. Save com evento cortado aberto sorteia outro.

**Fora:** a 8 (pedras evolutivas) mexe no motor: quem evolui e quando é decidido dentro da partida (`match.ts`). Pela
regra do projeto, pede `ENGINE_VERSION` novo e decisão do Miguel. Também ficaram de fora o "?" puxando o tipo de evento
que não saiu e as propostas 8 e 9 de "Feio e incoerente" (rostos no Patrocinador, status no celular).

### O robô, antes e depois (decisões 4 a 7 juntas)

150 Rotas por política, mesmas seeds, mesmo robô (ele aprendeu os eventos novos e a olhar o prêmio: `ouro` vai no ₽ em
dobro, `pokemon` no Pokémon do rival). Erro do título: ±3 pp. Antes = `964cddf4`; depois = esta branch.

| Política | Título antes | Título depois | Chega ao grupo antes → depois | Time no grupo antes → depois | Pokémon novos antes → depois | ₽ ganho antes → depois |
|---|---|---|---|---|---|---|
| Sempre à esquerda | 15,3% | 16,0% | 43% → 50% | 83,7 → 82,9 | 1,95 → 1,15 | 24 → 25 |
| Sempre à direita | 15,3% | 14,0% | 45% → 50% | 83,5 → 82,5 | 1,99 → 1,35 | 25 → 26 |
| Atrás de ₽ | 14,0% | 16,0% | 39% → 49% | 83,1 → 81,9 | 1,49 → 1,11 | 22 → 30 |
| Atrás de Pokémon | 11,3% | 13,3% | 39% → 47% | 83,8 → 83,2 | 1,88 → 1,50 | 23 → 23 |
| Sempre Ginásio | 17,3% | 12,0% | 39% → 47% | 83,7 → 82,9 | 1,83 → 1,22 | 23 → 24 |
| Aleatório | 14,7% | 11,3% | 43% → 46% | 83,4 → 82,4 | 1,98 → 1,13 | 25 → 24 |
| Só as vitórias | 10,0% | 6,7% | 33% → 38% | 82,8 → 82,7 | 1,05 → 0,50 | 20 → 22 |
| Nada (recusa tudo) | 9,3% | 10,7% | 30% → 36% | 82,3 → 82,0 | 0,13 → 0 | 20 → 22 |

O que os números dizem:
- **No geral não ficou mais difícil:** título médio das 6 políticas que jogam 14,7% → 13,8% (dentro do erro), e mais
  gente chega ao grupo (o Centro Pokémon tira o amarelo).
- **A meta não foi batida.** O time no grupo entre as políticas varia 1,3 ponto (era 0,7; a meta era ~3), e jogar contra
  recusar tudo dá ~0,6 ponto de time e ~3 pp de título (era 1,3 ponto e ~5 pp).
- **Por quê:** a escassez cortou o que entra no time (Pokémon novos 1,9 → 1,1 a 1,5: menos Mercado e Baú), e a
  evolução continua dando uns 19 dos 20 pontos que o time cresce. O robô não usa MT, então o prêmio MT e a MT do líder
  valem zero pra ele. O ₽ em dobro aparece (o `ouro` sobe de 22 pra 30), mas o `ouro` não compra.
- **Sempre Ginásio** caiu de 17,3% pra 12,0%: o +2 virou aposta de verdade (o robô não sabe recusar).

Alavancas, se o Miguel quiser (não mexi): a escassez mais leve (Mercado limitado só a 1 por caminho, sem cortar o
Treino), o Pokémon do rival como prêmio de todo Jogo com outro prêmio junto, e a decisão 8 (pedras), que é a única
que mexe no que mais pesa (a evolução), mas pede motor novo.

### Alavancas medidas (30/10): escassez mais leve (a) e o Pokémon do rival em todo Jogo (b)

O Miguel aprovou testar duas alavancas. As duas ficam em `ROTA_RULES` (`src/engine/cup-map.ts`), que o robô liga e
desliga (`MAX_SHOPS`, `SHOP_TREINO`, `SPARE`, `RIVAL`); não mexem no motor de partida.

- **(a) Escassez mais leve:** até 2 Mercados por caminho, e Mercado e Treino podem cair no mesmo caminho. Em N=50 testei
  também "2 Mercados, Treino separado" (quase igual a hoje) e "a casa que a escassez tira vira Baú" (mais Pokémon, mas
  o caminho pesa menos ainda). Fica a de 2 Mercados com Treino: no mapa, 69% dos caminhos têm Mercado (hoje 43%).
- **(b) Pokémon do rival em todo Jogo:** vitória num Jogo abre primeiro o 1 de 3 do time rival e depois o prêmio da casa
  (MT ou item; o ₽ em dobro entra na vitória). O prêmio "Pokémon do rival" sai do mapa, que sorteia MT, item ou ₽ em
  dobro. Pular o rival não dá sorteio (o prêmio ainda vem); pular o prêmio dá, como sempre.

150 Rotas por política, mesmas seeds. Antes = esta branch antes das alavancas (a tabela de cima, coluna "depois").

| Política | Título antes / (a) / (b) / (a+b) | Chega ao grupo | Time no grupo | Pokémon novos | ₽ ganho |
|---|---|---|---|---|---|
| Sempre à esquerda | 16,0 / 16,0 / 16,0 / 18,0% | 50 / 50 / 50 / 52% | 82,9 / 83,1 / 83,4 / 83,3 | 1,15 / 1,26 / 1,74 / 1,90 | 25 / 26 / 26 / 28 |
| Sempre à direita | 14,0 / 12,7 / 15,3 / 16,7% | 50 / 47 / 55 / 51% | 82,5 / 82,4 / 83,3 / 83,3 | 1,35 / 1,24 / 2,17 / 2,15 | 26 / 27 / 29 / 30 |
| Atrás de ₽ | 16,0 / 16,7 / 10,0 / 14,7% | 49 / 47 / 39 / 43% | 81,9 / 82,2 / 82,8 / 82,8 | 1,11 / 1,01 / 1,67 / 1,75 | 30 / 31 / 26 / 29 |
| Atrás de Pokémon | 13,3 / 15,3 / 16,0 / 16,7% | 47 / 43 / 45 / 40% | 83,2 / 83,2 / 83,9 / 84,0 | 1,50 / 1,59 / 1,80 / 1,91 | 23 / 24 / 25 / 24 |
| Sempre Ginásio | 12,0 / 15,3 / 14,0 / 15,3% | 47 / 46 / 50 / 49% | 82,9 / 82,3 / 83,4 / 84,0 | 1,22 / 1,23 / 1,84 / 1,89 | 24 / 24 / 25 / 26 |
| Aleatório | 11,3 / 14,0 / 6,7 / 13,3% | 46 / 43 / 43 / 44% | 82,4 / 82,6 / 83,0 / 83,4 | 1,13 / 1,15 / 1,67 / 1,87 | 24 / 25 / 23 / 26 |
| Só as vitórias | 6,7 / 6,7 / 7,3 / 7,3% | 38 / 38 / 37 / 37% | 82,7 / 82,7 / 83,5 / 83,5 | 0,50 / 0,50 / 1,09 / 1,09 | 22 / 23 / 22 / 23 |
| Nada (recusa tudo) | 10,7 / 10,7 / 10,7 / 10,7% | 36% | 82,0 | 0 | 22 / 23 / 22 / 23 |

| Métrica (6 políticas que jogam) | Antes | (a) | (b) | (a+b) | Meta |
|---|---|---|---|---|---|
| Título médio | 13,8% | 15,0% | 13,0% | 15,8% | até ~18% |
| Variação do time entre políticas | 1,3 | 1,0 | 1,1 | 1,3 | ~3 |
| Jogar − recusar tudo (time) | 0,6 | 0,6 | 1,3 | 1,5 | quanto maior melhor |
| Jogar − recusar tudo (título) | 3,1 pp | 4,3 pp | 2,3 pp | 5,1 pp | quanto maior melhor |

O que os números dizem (erro do título ±3 pp):
- **(a+b) é a que chega mais perto:** jogar contra recusar tudo vai de 0,6 pra 1,5 ponto de time e de 3,1 pra 5,1 pp de
  título (a meta antiga de ~5 pp), com o título médio em 15,8% (dentro do teto de 18%). Pokémon novos voltam a 1,8–2,2
  por Rota (eram 1,9 antes da escassez).
- **A variação entre políticas não sai de ~1,3.** As duas alavancas dão mais pra todo caminho: o rival vem em todo Jogo
  de todo caminho, e o Mercado a mais esbarra no ₽ (o robô ganha ~25 ₽ por Rota e compra pouco). Um Pokémon novo melhora
  uma vaga em uns 2 a 4 pontos, ou seja, ~0,5 na média do time; pra abrir 3 pontos entre caminhos, um caminho teria que
  dar uns 6 Pokémon a mais que outro. O que mais pesa continua sendo a evolução, igual em todo caminho.
- **(b) sozinha** sobe o time de todo mundo (+0,5 a +1) mas o título não acompanha; **(a) sozinha** quase não muda o time
  (o robô não tem ₽ pra usar o Mercado a mais).
- Pra variação chegar a ~3, a alavanca que falta é a que mexe na evolução por caminho: a decisão 8 (pedras como prêmio de
  região), com o motor 17.
