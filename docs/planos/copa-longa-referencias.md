---
description: Pesquisa de referências de roguelike em mapa para a Copa longa, com opções.
---

# Copa longa: referências e opções (pesquisa, 20/10/2026)

Pesquisa pra etapa 2 do [plano da Copa roguelike](copa-roguelike-plano.md): a **Copa longa** em mapa (Jogo, Ginásio,
Mercado, Treino, Baú, "?" e a Final contra a Liga Índigo). Proposta e decisões de antes em
[copa-roguelike.md](copa-roguelike.md). Nada de código antes das decisões do fim.

## Resumo

- **A conta que manda em tudo:** com 8 partidas e "perdeu, acabou", o título cai pra ~10% mesmo com rivais fáceis no
  começo (hoje é ~17% em 4 partidas). Com **uma derrota permitida** (fora a Final) volta pra ~32%. Todo jogo de mapa
  tem esse "colchão" (vida no Slay the Spire, velas no Inscryption, fase de grupos no Rogue Striker).
- **O mapa do Slay the Spire é simples de copiar:** linhas fixas (1ª = luta fácil, meio = tesouro, antes do chefe =
  descanso) e o resto sorteado com 3 ou 4 regras ("sem elite no começo", "nada de loja/descanso/elite seguidos").
- **O Pokelike** (o que o amigo citou) é exatamente isso com Pokémon: 8 mapas, um por ginásio, casas de captura,
  treinador, Centro Pokémon, tutor, troca e "?".
- **Os eventos que funcionam** mostram o custo e o ganho no próprio botão: o PokéRogue escreve `(+)`, `(-)` e `(?)`
  em cada opção, e sempre tem "Sair".
- **No celular:** o mapa inteiro cabe numa tela se tiver até ~10 linhas e 3–4 colunas; tocar mostra o que tem na casa,
  um segundo toque confirma.
- **Recomendação:** mapa curto estilo Slay the Spire (opção B), 8 partidas, 1 "cartão amarelo" (uma derrota
  permitida), ~35 min.

## 1. Slay the Spire: como o mapa é feito

| Regra | Como é |
|---|---|
| Tamanho | 15 andares por ato (+ chefe e baú do chefe), grade de 7 colunas; 3 atos (+ um 4º secreto) |
| Caminhos | o gerador traça 6 caminhos de baixo pra cima; cada um anda pra uma das 3 casas mais perto; caminhos não se cruzam; casa sem caminho some |
| Andares fixos | 1º = luta fácil; 9º (meio) = Tesouro; 15º = Descanso (sempre antes do chefe) |
| Sorteio do resto | Luta 53%, "?" 22%, Descanso 12%, Elite 8% (16% nas dificuldades altas), Loja 5% |
| Restrições | Elite e Descanso só do 6º andar em diante; nada de Descanso no 14º (o 15º já é); Elite, Loja e Descanso nunca ligados um no outro; uma casa com 2+ saídas leva a tipos diferentes |
| "?" | sorteia evento, luta, loja ou tesouro; o que saiu fica menos provável na próxima e os outros sobem |

Fontes: [Map Generation (wiki.gg)](https://slaythespire.wiki.gg/wiki/Map_Generation),
[guia de geração do mapa (KosGames)](https://kosgames.com/slay-the-spire-map-generation-guide-26769/).

**Que decisões isso cria:** o mapa inteiro aparece no começo do ato, então você planeja a rota (quantas elites eu
aguento? passo na loja com ouro ou não?). Elite é **opcional**: mais difícil, recompensa melhor (relíquia). O descanso
é a escolha clássica "curar ou melhorar uma carta". As restrições garantem que nenhuma rota seja injusta (ninguém pega
elite no 2º andar com o deck inicial) e que toda rota tenha escolha (ramos com tipos diferentes).

**Duração:** ~45 a 50 casas por corrida, 50 a 90 min pra quem é experiente (relatos em
[Steam](https://steamcommunity.com/app/646570/discussions/0/1642042464745019506) e
[Quarter to Three](https://forum.quartertothree.com/t/slay-the-spire-2-climb-it-again/163606?page=3)). Um ato (~17
casas) dá ~20–30 min: é a escala da nossa Copa longa.

**Slay the Spire 2 (acesso antecipado, 2026):** os mesmos 7 tipos de casa e o descanso garantido antes do chefe
([guia Broken Builds](https://brokenbuilds.gg/slay-the-spire-2/guides/slay-the-spire-2-beginner-guide-2026)). Novidades:
**atos alternativos** (no ato 1 você escolhe Floresta ou Docas, cada um com outros inimigos e chefes;
[Mobalytics](https://mobalytics.gg/slay-the-spire-2/guides/alternate-acts)) e os **Anciões** na entrada de cada ato,
que oferecem bênçãos com custo e substituem as relíquias de chefe; um deles até troca o mapa do ato por um caminho
único dourado ([PCGamesN](https://www.pcgamesn.com/slay-the-spire-2/ancients)). Lição: um "presente com preço" no
começo de cada trecho deixa cada corrida com cara própria.

## 2. Pokémon: Pokelike e PokéRogue

### Pokelike (pokelike.xyz)

Roguelike de Pokémon de navegador, feito por fã, de março de 2026 ([Backloggd](https://backloggd.com/games/pokelike/),
[Androidphoria](https://androidphoria.com/juegos/pokelike-roguelike-de-pokemon)). Combate automático (você monta o time
e a ordem; a luta se resolve sozinha), como a nossa partida. Modos: História (Clássico ou Nuzlocke), Battle Tower,
Desafios e um quebra-cabeça diário. Tem anúncio na página (o Soccermon nunca).

O que deu pra ver no próprio jogo (textos da página e das notas de versão):

| Peça | Como é |
|---|---|
| Estrutura | **8 mapas, um por ginásio** ("Clear Map 1 and defeat Brock" … "Map 8 … Giovanni"), depois a Elite Four |
| Casas | Batalha selvagem (+1 nível), Treinador (+2 níveis), **Captura** (escolhe 1 Pokémon), Item, Item passivo (vale a corrida toda), Centro Pokémon, Tutor de golpes, Troca, Lendário, "?" e o Chefe (líder) |
| Garantias | a 1ª linha de todo mapa tem pelo menos uma Captura; as linhas 1, 3 e 5 têm pelo menos uma Batalha |
| Time cheio | tela "Team Full!": escolhe quem sai ou fica como está (nada automático) |
| Tipos | "traços de time": cada nível de quantos Pokémon de um tipo você tem liga um efeito passivo (como as nossas sinergias) |
| Refazer | um item deixa refazer o mapa uma vez por corrida, antes de pisar na primeira casa |
| Celular | segurar a casa mostra o que é antes de ir; a casa de treinador mostra o time dele; caminhos já feitos ficam mais escuros, casa visitada fica cinza com um "✓" |

**Lição pra cá:** é o formato do "Jornada" (um mapa por ginásio) e prova que dá pra fazer no celular. Pra Copa longa
interessam as garantias por linha, a prévia do rival na casa e o "time cheio" com escolha.

### PokéRogue

Roguelite de Pokémon de navegador, código aberto ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Sandbox/Ronis),
[repositório](https://github.com/pagefaultgames/pokerogue)). Pelo código (`src/game-mode.ts`):

- **Ondas:** o Clássico vai até a **onda 200**, chefe a cada 10, bioma novo a cada 10, treinadores nas ondas 5 de cada
  dezena; a corrida diária tem **50 ondas** ([Clubic](https://www.clubic.com/telecharger-fiche525438-pokerogue.html)).
- **Recompensa depois de toda onda:** escolhe 1 de algumas grátis; trocar as opções custa dinheiro e encarece; um
  botão "travar raridades" mantém o nível na troca; embaixo, uma fileira de loja paga (poções, etc.) com preço que sobe
  com a onda.
- **Eventos misteriosos** (`mystery-encounters`, ~30): "Dark Deal", "An Offer You Can't Refuse", "Shady Vitamin
  Dealer", "Mysterious Chest", "Training Session", "Part-Timer". Cada botão diz o que acontece:

| Evento | Opções (texto do jogo) |
|---|---|
| An Offer You Can't Refuse | Aceitar: `(-) perde o seu Pokémon mais forte (+) item (+) dinheiro` · Extorquir o garoto: só aparece se você tem certo golpe · Sair |
| Shady Vitamin Dealer | Barato: `(-) paga (-) efeito colateral? (+) 2 vitaminas` · Caro: `(-) paga mais (+) 2 vitaminas` · Sair |
| Mysterious Chest | Abrir: `(x%) algo terrível / (y%) recompensa ok / (z%) boa` · "Arriscado demais", sair |
| Training Session | Leve / Moderado / Pesado: luta com o Pokémon escolhido, melhora maior quanto mais pesado · Sair |

- **O que gostam:** grátis no navegador, cada corrida diferente, itens que se acumulam
  ([Retro Dodo](https://retrododo.com/pokerogue-is-an-unmissable-pokemon-roguelite-and-its-free-to-play-in-your-browser/),
  [Gfinity](https://www.gfinityesports.com/article/pokerogue-must-play-pokemon-roguelike)).
- **O que pesa:** 200 ondas são horas (um jogador conta "uma hora e não acaba",
  [itch.io](https://itch.io/profile/mankey1)); por isso a diária de 50 existe. Pra nós: a Copa longa tem que ter fim
  visível no mapa.

## 3. Outros roguelites com mapa curto (e um de futebol)

| Jogo | Estrutura | Lição pro Soccermon |
|---|---|---|
| **Rogue Striker** (futebol, 2027) | 3 atos: Eliminatórias, Fase de grupos, Mata-mata até a final; entre os jogos: amistosos pra contratar, treino, lojas e eventos; draft de jogadores com posição, atributos, raridade e habilidade ([Steam](https://store.steampowered.com/app/4841110), [Game Developer](https://www.gamedeveloper.com/press-release/rogue-striker-announced-for-steam-a-soccer-roguelite-made-in-one-month-for-world-cup-season)) | o **amistoso** como casa (jogo sem risco que rende contratação); fase de grupos = derrota que não elimina |
| **Balatro** | 8 antes, cada uma com Small, Big e Boss Blind; as duas primeiras dá pra **pular em troca de um bônus** (tag); o chefe tem uma regra que atrapalha e aparece antes, pra você se preparar; alguns chefes só a partir de certa ante ([Dot Esports](https://dotesports.com/indies/news/balatro-antes-blinds-explained), [Pro Game Guides](https://progameguides.com/balatro/how-does-ante-work-in-balatro/)); corrida de 15–30 min ([Two Average Gamers](https://www.twoaveragegamers.com/short-roguelikes-finish-run-before-bedtime/)) | mostrar a Final desde o começo; Ginásio com uma **regra do líder** (o "Boss Blind"); "pular" um jogo fácil por uma recompensa |
| **Monster Train** | caminho linear com **duas opções a cada bifurcação**, e você vê o que cada lado dá antes de escolher; poucas batalhas (uma review fala em dez) com chefes regulares; corrida do Monster Train 2 em 30–45 min ([Checkpoint Gaming](https://checkpointgaming.net/reviews/2020/05/monster-train-review-lurking-on-the-railroad/), [Pocket Gamer](https://www.pocketgamer.com/monster-train/review/)) | número de partidas fixo e rota só nas paradas: a opção mais simples (A, abaixo) |
| **Inscryption** (ato 1) | 4 mapas curtos estilo Slay the Spire, chefe no fim de cada um; batalha com totem (rival mais forte) marcada no mapa; **perder 2 vezes no mesmo mapa** (ou 1 no chefe) acaba ([Wikipedia](https://en.wikipedia.org/wiki/Inscryption), [Prima Games](https://primagames.com/gaming/inscryption-map-symbols-act-1-guide)) | a "vela": uma derrota permitida, menos no chefe. É o nosso cartão amarelo |
| **Dicey Dungeons** | 6 andares por episódio; o mapa de cada andar sai de **moldes prontos** (não é procedural); inimigos, maçã (cura), loja, troca e bigorna; dá pra pular inimigo ([TCRF](https://tcrf.net/Dicey_Dungeons), [GameSpot](https://www.gamespot.com/reviews/dicey-dungeons-review/1900-6417267/)) | moldes feitos à mão em vez de gerador: mais fácil de calibrar e de garantir 8 jogos |

**Padrões que se repetem:**

- **Elite opcional** (elite, totem, ginásio): mais difícil, sempre com recompensa melhor e visível antes.
- **Descanso garantido antes do chefe** e **tesouro no meio**: o meio da corrida tem um respiro.
- **A rota mostra tudo antes** (Monster Train, Pokelike): a decisão é de plano, não de sorte.
- **Dificuldade sobe por andar** e os chefes mais chatos só aparecem tarde (Balatro, Slay the Spire).
- **Corridas de 30–40 min** têm entre 8 e 15 decisões grandes e ~10 lutas.

## 4. A conta do tempo e da dificuldade

**Tempo.** A Copa rápida dá ~15 min (draft + 4 jogos). A partida tem 2 tempos de 180 s; em 8x (86% jogam assim) são
~45 s, e com escalação, resultado e recompensa o bloco fica em ~2,5 min. Pra ~35 min:

| Peça | Quanto | Tempo |
|---|---|---|
| Draft | 1 | ~4 min |
| Partidas (com resultado e recompensa) | 8, contando a Final | ~20 min |
| Mercado | 2 | ~2 min |
| "?", Baú, Treino | 4–5 | ~3 min |
| Mapa (olhar e escolher) | 12–13 vezes | ~3 min |
| **Total** | | **~32–35 min** |

**Dificuldade.** Hoje (calibragem de 20/10) a vitória por fase é 75/62/64/58%, o que dá ~17% de título. Esticando:

| Cenário (8 partidas, a última é a Final) | Sem derrota permitida | 1 derrota permitida | 2 permitidas |
|---|---|---|---|
| Todas a 75% | 10% | 33% | 57% |
| Todas a 80% | 17% | 46% | 68% |
| Curva 88 → 60% (fácil no começo, Final a 60%) | 11% | 32% | 49% |

Ou seja: **sem colchão a Copa longa fica 2x mais difícil que a rápida e frustra depois de 25 min**. Com uma derrota
permitida fica perto dos ~22–30% que a gente já mira. Na ficção do futsal: **cartão amarelo** (perdeu um Jogo ou
Ginásio, leva amarelo; o segundo é vermelho e a copa acaba; perder a Final acaba sempre). Alternativas: fase de grupos
(como o Rogue Striker; mais tela, mais regra) ou baixar muito os rivais (perde a tensão).

## 5. Eventos "?"

**Regras de escrita** (de Slay the Spire, PokéRogue e do nosso "nada automático"):

1. **Uma tela, 2–3 botões, texto de até 2 linhas.** Cada botão com o ganho e o custo escritos (`+`, `−`, `?` como o
   PokéRogue, desenhados com ícone, sem emoji).
2. **Sempre tem "Recusar"/"Seguir"** sem perda nenhuma (ou com uma perda pequena e escrita).
3. **Nada acontece com o time sem um toque seu.** Quando o evento mexe em alguém, você escolhe quem (lesão, troca,
   treino).
4. **Opção secreta pelo time** (como o "Extorquir" do PokéRogue, que só aparece com certo golpe): um botão extra se
   você tem um Pokémon de certo tipo. Faz o time contar fora da quadra.
5. **Tudo pela seed** (mesma copa, mesmos eventos) e sorteio que evita repetir na mesma copa.
6. **Nada de marca real:** só lugares e gente de Kanto.

**Primeira leva (16 ideias; as 3 primeiras já decididas):**

| # | Evento | Texto curto | Escolhas |
|---|---|---|---|
| 1 | **Carrinho no treino** (lesão) | "No coletivo, dois dos seus se trombaram. Um precisa parar." | Escolher quem fica fora 2 jogos (mostra os dois) · Fisioterapeuta: −4 ₽, ninguém fica fora · Jogar no sacrifício: os dois jogam com −15% de fôlego nos próximos 2 |
| 2 | **Patrocinador misterioso** (2 por 1) | "Um homem de terno quer dois dos seus reservas por uma carta lacrada." | Aceitar: escolhe 2 do banco, ganha 1 carta ouro (às vezes Destaque) · Pedir pra ver antes: a carta fica visível, mas ele pede 3 ₽ a mais · Recusar |
| 3 | **Proposta pelo capitão** (raro) | "Um clube rico quer o seu capitão. Agora." | Vender: +15 ₽, o capitão sai e você escolhe o novo · Contraproposta: vende um reserva por 4 ₽ · Recusar |
| 4 | **Olheiro da Liga** | "Um olheiro tem o caderno do próximo rival." | Ler: vê a escalação e os itens do próximo rival · Pagar 2 ₽ e trocar o próximo Jogo por outro rival · Seguir |
| 5 | **Entrevista coletiva** | "Os repórteres querem uma frase." | "Respeito o rival": +10% de fôlego no próximo jogo · Provocar: +4 ₽, o rival entra com +2 em tudo · Sair sem falar |
| 6 | **Pokémon perdido na Rota** | "Um Pokémon selvagem segue o ônibus do time." | Contratar (bronze, grátis; escolhe quem sai se o banco estiver cheio) · Deixar ir: +1 ₽ |
| 7 | **Treino puxado** | "O preparador quer dobrar a carga de alguém." | Escolher um: +3 num atributo até o fim, mas começa o próximo jogo com 70% de fôlego · Treino leve: +1 pra todos no próximo jogo · Folga |
| 8 | **Creche Pokémon** | "A creche cuida de um dos seus por uns dias." | Deixar um (escolhe): fica fora 2 andares e volta com a barra de evolução mais cheia · Recusar. (Evolução continua só na partida, com a animação dela) |
| 9 | **Equipe Rocket** | "Uns sujeitos de preto oferecem um item 'achado'." | Comprar: item raro por 2 ₽, mas o próximo Jogo vira contra a Equipe Rocket (mais forte) · Denunciar: +3 ₽ · Ignorar |
| 10 | **Baú na arquibancada** | "Tem um baú esquecido embaixo do banco." | Abrir: 70% item, 20% pacote, 10% Voltorb (−3 ₽) · Deixar |
| 11 | **Liquidação em Celadon** | "A Loja de Departamentos está em promoção hoje." | Comprar 1 item por 1 ₽ (escolhe entre 3) · Guardar o ₽ |
| 12 | **Pedido de amistoso** | "Um time da Rota quer um amistoso." | Jogar (resultado direto, sem risco de cartão): vitória dá +3 ₽ e o melhor deles fica contratável · Recusar |
| 13 | **Snorlax no caminho** | "Um Snorlax dorme no meio da estrada do ônibus." | Esperar: todo mundo descansa (+fôlego), mas pula o próximo Mercado · Dar a volta: o próximo andar vira Jogo · Acordar (só com a Flauta, ou com um tipo Lutador no time): ele vira contratável |
| 14 | **Torcida pede faixa** | "A torcida quer uma faixa nova pro próximo jogo." | Pagar 3 ₽: +2 em tudo no próximo jogo · Pedir pra torcida fazer: grátis, +1 só pro capitão · Seguir |
| 15 | **Torre de Lavender** | "Um Gengar oferece um pacto pra um dos seus." | Aceitar (escolhe um): +5 em tudo até o fim, mas ele não pode mais sair dos titulares · Recusar |
| 16 | **Professor Carvalho** | "O Professor quer ver o seu time jogar." | Mostrar o time: ele revela os "?" dos próximos 2 andares · Pedir conselho: +1 opção na próxima recompensa · Seguir |

**Notas:**

- Os números são exemplo pra discutir; tudo que mexe em atributo ou ₽ vai pra calibragem com antes/depois.
- A lesão (1) é a única que tira alguém de quadra, e sempre com você escolhendo quem ou pagando pra evitar.
- Eventos "bons" e "ruins": o "?" do Slay the Spire às vezes é luta. Aqui o "?" pode virar **Jogo surpresa** (rival da
  Rota) em ~20% das vezes, como o Slay the Spire faz.

## 6. Pacotes melhores a cada andar e rivais mais fortes

**Como é hoje:** a raridade sai da tabela `TIER_ODDS` (`src/engine/draft.ts`, 7 linhas, da mais fraca pra mais forte);
o Mercado usa as linhas 3, 5 e 6 nas três fases (`SHOP_ROUND`), o reforço da recompensa também. O capitão sempre sai de
raro pra cima (`CAPTAIN_ODDS`). Os rivais usam `STAGE_DIFFICULTY` = −1, 0, 2, 4.

**Proposta pra Copa longa (8 andares de jogo, ideia do amigo):**

| Andar | Pacote/Mercado/reforço (linha da `TIER_ODDS`) | Rival Jogo | Rival Ginásio | Itens do rival |
|---|---|---|---|---|
| 1 | 0 | −2 | (não tem) | 0 |
| 2 | 1 | −1 | (não tem) | 0 |
| 3 | 2 | −1 | +1 | 0 / 1 |
| 4 (Baú no meio) | 3 (Baú: +1 linha) | 0 | +1 | 1 |
| 5 | 4 | 0 | +2 | 1 |
| 6 | 5 | +1 | +3 | 1 / 2 |
| 7 (Treino antes da Final) | 6 | +2 | +3 | 2 |
| Final | — | Liga Índigo +4 | — | 3 |

- **Draft da Copa longa mais fraco:** as 7 escolhas saem uma linha abaixo da Copa rápida (o capitão continua raro:
  ele é a identidade do time). O time cresce pelo mapa, como o amigo sugeriu.
- **Preço sobe por andar** (PokéRogue faz isso): Pokémon avulso e pacote +1 ₽ a cada 2 andares, o Patrocínio fica 10.
- **Ginásio = elite:** rival do líder, mais forte, com a MT do líder; recompensa com uma opção a mais e reforço uma linha
  acima. Opcional, sempre visível no mapa com o tipo do líder (dá pra montar o time pra ele).
- **Regra do líder** (o "Boss Blind" do Balatro, pra depois): cada Ginásio com uma regra pequena e escrita na casa
  (Misty: quadra molhada, Água +2; Brock: chute de longe −). Mexe em equilíbrio: só com o ok do Miguel.
- **Jogo comum** precisa de rivais que não são ginásio: times da Rota com classes de treinador de Kanto (Caçador de
  Insetos, Montanhista, Nadador, Equipe Rocket), puxados pra 1–2 tipos.

## 7. Celular: a tela do mapa

- **Mapa vertical, de baixo pra cima**, com a Final (Liga Índigo) no topo desde o começo. Com até ~10 linhas e 3–4
  colunas, cabe inteiro em 390 × 844 sem rolar; em 320 px, rola só na vertical, centrando na linha atual.
- **Toque em dois tempos:** o 1º toque abre uma folha embaixo com a prévia (rival com escudo, tipos e nota média; o que
  o Baú/Treino/Mercado dá; "?" diz só "Evento"); o botão "Ir" confirma. O Pokelike usa segurar pra ver; tocar e
  confirmar é mais claro pra quem é casual.
- **Casas grandes:** alvo de toque de 44–48 px ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [Material](https://m3.material.io/foundations/designing/structure)); a versão de celular do Slay the Spire teve de
  mexer no tamanho dos ícones do mapa depois do lançamento ([GamingOnLinux](https://www.gamingonlinux.com/2019/07/the-excellent-deck-builder-slay-the-spire-is-getting-a-4th-free-character-update-out-with-touch-screen-support/page=1/),
  [TouchArcade](https://toucharcade.com/2020/06/15/slay-the-spire-ios-review-iphone-ipad-performance-icloud-megacrit-humble-games/)).
- **Ícones desenhados com nome embaixo** (nada de legenda separada; o Pokelike tirou a legenda do rodapé). Ícones no
  traço do `HudIcon`, sem emoji.
- **Rastro do caminho:** casas já feitas em cinza com um sinal de feito, caminho percorrido mais escuro, casas que dá
  pra alcançar acesas (Pokelike).
- **No topo, fixo:** ₽, cartões amarelos, Patrocínios e o botão do time (ver e mexer na escalação a qualquer hora).
- **Nada teleporta:** o ônibus do time anda da casa atual até a nova (200–300 ms) e a tela da casa entra com a
  transição; com Reduzir movimento, só o fade.
- **Retomar:** o mapa salva no `RunState`; fechou a aba, volta no mesmo andar (o Pokelike teve bug de "voltar e escolher
  de novo": a escolha grava antes de abrir a casa).

## 8. Opções pra Copa longa

| Opção | Como é | Esforço | Risco |
|---|---|---|---|
| **A. Trilha** (Monster Train) | 8 jogos fixos. Antes de cada jogo, escolhe entre 2 rivais (Jogo ou Ginásio, com prévia); depois de cada vitória, escolhe 1 de 2 paradas (Mercado, Treino, "?", Baú). Sem grade | 1 versão | baixo: tempo previsível; a rota tem menos cara de "mapa" |
| **B. Mapa curto** (Slay the Spire) **(recomendada)** | grade de 3–4 colunas × 11 linhas + Final; linhas fixas: 1 = Jogo fácil, 6 = Baú, 11 = Treino; o resto sorteado (Jogo ~45%, "?" ~20%, Mercado ~13%, Ginásio ~12% a partir da linha 4, Treino ~10% a partir da 5); sem Ginásio, Mercado ou Treino seguidos; o gerador refaz até **toda rota ter 7 a 9 partidas**; 1 cartão amarelo | 1–2 versões | médio: gerador com regras, tela nova, calibragem da curva |
| **C. Mapa em atos** (Slay the Spire 2 + Pokelike) | B em 2 atos (Rota de Kanto → Planalto Índigo), cada um com um "presente com preço" na entrada (Prof. Carvalho oferece 1 de 3, como os Anciões), regra do líder nos Ginásios, refazer o mapa uma vez | 3+ versões | alto: é meio caminho da Jornada; melhor depois de ver os números da B |

**Recomendação: B.** É o que o amigo pediu (rota de verdade, "?" bom ou ruim, Ginásio opcional), cabe em ~35 min com
8 partidas, e o gerador fica pequeno porque as regras são poucas e testáveis (toda seed: 7–9 partidas, Treino antes da
Final, Baú no meio). Com a curva da seção 6 e um cartão amarelo, o título fica perto de 30% pra quem joga bem. Dá pra
lançar com 8 eventos e ir somando.

Tela nova: só o Mapa (a casa reaproveita o que existe: partida, Mercado, recompensa, `CardPack`) e o Evento (caixa de
texto com 2–3 botões). `?demo=mapa` pra o ok antes de lançar.

## Decisões pro Miguel

1. **Formato:** B, mapa curto estilo Slay the Spire **(recomendado)** / A, trilha com 8 jogos fixos / C, atos.
2. **Derrota:** 1 cartão amarelo (uma derrota permitida, menos na Final) **(recomendado)** / perdeu, acabou (como a
   rápida) / fase de grupos.
3. **Tamanho:** 8 partidas contando a Final, ~35 min **(recomendado)** / 10 partidas, ~45 min.
4. **Mercado:** só como casa do mapa (2–3 por rota) **(recomendado)** / depois de toda vitória, como na rápida (fica
   lento: 7 Mercados).
5. **Recompensa grátis depois de cada vitória:** continua **(recomendado)** / só no Ginásio e no Baú.
6. **Draft da Copa longa mais fraco** (uma linha abaixo, capitão raro igual) e pacotes subindo por andar
   **(recomendado)** / draft igual ao da rápida.
7. **Rivais do Jogo comum:** times da Rota com classes de treinador de Kanto **(recomendado)** / só os clubes dos
   ginásios.
8. **Primeira leva de eventos:** os 8 primeiros da tabela (1 a 8) **(recomendado)** / todos os 16 / outra seleção.
9. **Regra do líder no Ginásio:** fica pra depois da 0.9.1 **(recomendado)** / já na primeira versão.
10. **Copa do Dia:** continua rápida **(recomendado)** / ganha uma versão longa no fim de semana.

## Fontes

- Slay the Spire: [Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation),
  [Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations),
  [guia do gerador (KosGames)](https://kosgames.com/slay-the-spire-map-generation-guide-26769/),
  [evento Big Fish](https://slaythespire.wiki.gg/wiki/Big_Fish),
  [palestra de métricas na GDC 2019](https://www.gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019)
- Slay the Spire 2: [Broken Builds](https://brokenbuilds.gg/slay-the-spire-2/guides/slay-the-spire-2-beginner-guide-2026),
  [Anciões (PCGamesN)](https://www.pcgamesn.com/slay-the-spire-2/ancients),
  [atos alternativos (Mobalytics)](https://mobalytics.gg/slay-the-spire-2/guides/alternate-acts),
  [escolhas de rota (untapped.gg)](https://sts2.untapped.gg/guides/how-to-make-the-best-map-choices-in-slay-the-spire-2)
- Pokelike: [pokelike.xyz](https://pokelike.xyz) (textos e notas de versão do próprio jogo),
  [Backloggd](https://backloggd.com/games/pokelike/), [Androidphoria](https://androidphoria.com/juegos/pokelike-roguelike-de-pokemon),
  [TCG Actu](https://tcg-actu.fr/pokelike-jeu-pokemon-roguelike-guide/)
- PokéRogue: [código](https://github.com/pagefaultgames/pokerogue) (`src/game-mode.ts`,
  `src/phases/select-modifier-phase.ts`, `src/data/mystery-encounters/`),
  [textos dos eventos](https://github.com/pagefaultgames/pokerogue-locales/tree/main/en/mystery-encounters),
  [Retro Dodo](https://retrododo.com/pokerogue-is-an-unmissable-pokemon-roguelite-and-its-free-to-play-in-your-browser/),
  [Gfinity](https://www.gfinityesports.com/article/pokerogue-must-play-pokemon-roguelike)
- Rogue Striker: [Steam](https://store.steampowered.com/app/4841110),
  [Game Developer](https://www.gamedeveloper.com/press-release/rogue-striker-announced-for-steam-a-soccer-roguelite-made-in-one-month-for-world-cup-season)
- Balatro: [antes e blinds (Dot Esports)](https://dotesports.com/indies/news/balatro-antes-blinds-explained),
  [Pro Game Guides](https://progameguides.com/balatro/how-does-ante-work-in-balatro/)
- Monster Train: [Checkpoint Gaming](https://checkpointgaming.net/reviews/2020/05/monster-train-review-lurking-on-the-railroad/),
  [Pocket Gamer](https://www.pocketgamer.com/monster-train/review/)
- Inscryption: [Wikipedia](https://en.wikipedia.org/wiki/Inscryption),
  [símbolos do mapa (Prima Games)](https://primagames.com/gaming/inscryption-map-symbols-act-1-guide)
- Dicey Dungeons: [TCRF](https://tcrf.net/Dicey_Dungeons), [GameSpot](https://www.gamespot.com/reviews/dicey-dungeons-review/1900-6417267/)
- Duração das corridas: [Two Average Gamers](https://www.twoaveragegamers.com/short-roguelikes-finish-run-before-bedtime/),
  [Steam (Slay the Spire)](https://steamcommunity.com/app/646570/discussions/0/1642042464745019506)
- Celular: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [Material 3](https://m3.material.io/foundations/designing/structure),
  [TouchArcade](https://toucharcade.com/2020/06/15/slay-the-spire-ios-review-iphone-ipad-performance-icloud-megacrit-humble-games/)
