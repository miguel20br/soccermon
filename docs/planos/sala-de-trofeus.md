# Sala de troféus e o Soccermon "físico" (brainstorm, 20/10/2026)

Pedido do Miguel: deixar mais **físicos** os itens que hoje são lista ou número: uma **sala de troféus** com os
troféus da Copa, da Copa do Dia e do Duelo, e trazer pra ela as peças personalizáveis (escudo, uniforme, faixa,
vitrine…). O Álbum em livro (0.8.8.4) é o primeiro passo nessa direção: o que era tabela virou objeto que você abre e
folheia. **Nada de código antes das decisões do fim.**

## O que já temos e vira objeto

| Hoje (lista/número) | Vira na sala | De onde vem o dado |
|---|---|---|
| Títulos da Copa, Hall da Fama | **troféu** por título na estante, com nome do time, data e placar da final; tocar abre o elenco campeão e o replay do gol da copa | `hall`, `StageResult.replay` |
| Copa do Dia | **medalhão do dia** (bronze/prata/ouro pela posição) num quadro de cortiça; semana inteira jogada = troféu pequeno | `src/store/daily.ts`, ranking do dia |
| Duelo | **cinturão** (10, 50, 100 vitórias) pendurado na parede; troféu de "invicto contra amigo" | `src/store/duels.ts` |
| Liga (quando abrir) | **a taça da temporada**, grande, no centro | `src/league/` |
| Medalhas (20) | **broches num quadro** de veludo (degrau = metal do broche) | `src/store/medals.ts` |
| Platina da Gen 1 | o **Diploma de Kanto** do Prof. Carvalho emoldurado | missão `platina` |
| Selos de carreira | **placas** embaixo da carta do Pokémon na vitrine | `sealsOf` |
| Vitrine de cartas (3) | **vitrine de vidro** com as 3 cartas em pé | `profile.cardShowcase` |
| Álbuns | os **livros na estante** (Gen 1, e o espaço da Gen 2 vazio) | Álbum |
| Escudo, uniforme, faixa | **bandeira** com o escudo, **camisa emoldurada** com o número do capitão, **faixa** da torcida pendurada | `club-kit.ts`, `profile.banner` |
| Recordes | **placa de bronze** ("Maior goleada: 9 x 0, 18/10") | `records` |
| Melhores momentos | uma **TV** que passa o gol da copa em loop | `moments.ts` |
| Insígnias (Modo história) | o **estojo de insígnias** na mesa (já existe o `BadgeCase`) | Modo história |

## Referências

- **PlayStation Home (sala de troféus):** poucas vitrines à vista por vez e, da sacada, um salão com os troféus que você
  **ainda não ganhou**, apagados. Pro Soccermon: o lugar vazio na estante (silhueta do troféu) é o que dá vontade.
- **Old School RuneScape (troféus na casa do jogador):** suporte por nível; o suporte melhor mostra os troféus de nível
  menor também. Pro Soccermon: a sala cresce com você (ver "A sala sobe de nível").
- **Pokémon Ruby/Sapphire (base secreta)** e **Animal Crossing (casa e museu):** decorar com o que você ganhou,
  mostrar pros outros, visitar a casa do amigo. Pro Soccermon: o amigo visita a sua sala pelo perfil.
- **Sala de troféus de verdade:** uma prateleira por torneio, vitrine de vidro pro mais importante, luz em cima.

## A sala

- **Uma tela só, em pixel art** (o quarto de Pallet do Red/Blue como ponto de partida), de lado, com estante, parede,
  mesa e TV. Desenho por código (SVG, como o logo) pra ficar leve; nada de Phaser aqui.
- **Tocar num objeto aproxima** (a câmera desliza até ele, nada teleporta) e abre o detalhe: troféu gira devagar, com
  o nome do time, a data, o placar da final e "Ver o gol" (o replay que já guardamos).
- **Lugar vazio com silhueta** pra cada troféu que existe e você ainda não tem (Copa sem sofrer gol, 100 vitórias no
  Duelo, semana inteira da Copa do Dia…). Tocar na silhueta diz como ganhar.
- **A sala sobe de nível:** quarto em Pallet → sala do clube → sala do estádio, conforme os títulos. Cada nível ganha
  mais estante, outra parede e outro chão. Escudo e cor do clube pintam a sala.
- **Arrumar (opção rica):** arrastar os troféus pra outra prateleira, escolher o que fica na vitrine de vidro, papel de
  parede e chão liberados por missão (como as peças de escudo hoje).
- **Visita:** o cartão do treinador (perfil público) e o VERSUS do Duelo mostram um pedaço da sua sala (a vitrine e o
  troféu maior). Ver a sala inteira de um amigo pela lista de Amigos.

## Os troféus (cada modo tem o seu formato, pra ler de longe)

| Modo | Objeto | Metal |
|---|---|---|
| Copa | taça com alças, pequena | pela campanha: bronze (campeão), prata (sem perder), ouro (sem sofrer gol / Ash) |
| Copa do Dia | medalhão redondo com a data | posição no dia: top 10 bronze, top 3 prata, 1º ouro |
| Duelo | cinturão | 10 / 50 / 100 vitórias |
| Liga | taça grande no centro | posição final da temporada |
| Ultimate Team (futuro) | troféu da temporada + a "Lenda da temporada" | posição final (o que fica quando a temporada zera) |

O mesmo troféu repetido (5 títulos de Copa) vira **uma taça com o número gravado** e as datas na base (estante não
enche de cópia).

## Outros jeitos de deixar físico (ideias soltas)

- **Ingresso** de cada partida guardado numa caixa (time, placar, data): abre e folheia como o álbum.
- **Bola autografada** pelo MVP da final (o retrato PMD do Pokémon na bola).
- **Foto** do elenco campeão (o card 9:16 que já existe) presa na parede, estilo polaroid.
- **Pacote fechado** na mesa quando você tem recompensa pra abrir (abre ali mesmo).
- **Prancheta** pendurada com a sua formação favorita.

## Opções de escopo

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| A. Estante | uma aba "Troféus" no Perfil: estantes com os troféus como objetos (Copa, Copa do Dia, Duelo), silhueta do que falta, tocar abre o detalhe | 1 versão | baixo |
| **B. Sala (recomendada)** | A + a sala em pixel art com parede (faixa, bandeira, camisa, diploma, broches), vitrine de vidro, livros do álbum, TV com o gol, nível da sala, visita pelo perfil | 2 versões | médio (arte) |
| C. Sala montável | B + arrastar e arrumar, papel de parede e chão por missão, visitar a sala inteira do amigo | 3+ versões | alto |

## Decisões pro Miguel

1. **Escopo:** B, a sala **(recomendado)** / A só estante / C montável já.
2. **Onde fica:** um botão "Sala de troféus" no Perfil (aba nova no lugar do Hall da Fama, que vira a estante da Copa)
   **(recomendado)** / na Home, ao lado do Perfil.
3. **Metal da taça da Copa** pela campanha (campeão / sem perder / sem sofrer gol) **(recomendado)** / pela dificuldade
   da copa / todas iguais.
4. **Silhueta do que falta** à vista **(recomendado)** / só o que você ganhou.
5. **Visita:** pedaço da sala no cartão e no VERSUS agora, sala inteira do amigo depois **(recomendado)** / nada de
   visita / tudo já.
6. **Estilo:** pixel art do Red/Blue (quarto de Pallet, combina com a abertura do trailer) **(recomendado)** / o kit da
   transmissão (painéis escuros, mais "menu").

## Fontes

- [PlayStation Home: first look (GamesRadar)](https://www.gamesradar.com/home-first-look/3)
- [Head trophy space, Old School RuneScape Wiki](https://oldschool.runescape.wiki/w/Head_trophy_space)
- [8 trophy display tips from the pros (ShopPOPDisplays)](https://www.shoppopdisplays.com/blog/2023/05/24/8-trophy-display-tips-from-the-pros/)
- Base secreta (Pokémon Ruby/Sapphire) e casa/museu (Animal Crossing): referência de memória, sem link.
