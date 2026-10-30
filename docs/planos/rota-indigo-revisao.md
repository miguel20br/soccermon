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
