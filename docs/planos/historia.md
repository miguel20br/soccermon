# Modo história: por que os Pokémon jogam futsal? (pesquisa, 21/10/2026)

Pergunta do Miguel: "Queria já ir pensando melhor na história. Por que nesse mundo os Pokémon jogam futsal?" Com
calma, sem bagunçar o jogo. Nada de código: é a pesquisa e as decisões antes.

Divisão já combinada:

| Modo | Papel da história |
|---|---|
| **Rota Índigo** (Copa longa) | roguelike pra rejogar; história só como tempero (as falas por região que já existem) |
| **Modo história** | a jornada jogada uma vez: save que dura, time que cresce, 8 ginásios com insígnias (`BadgeCase` pronto), Blue como rival fixo, Pokémon das rotas ("Draft do lugar", aprovado), começo, meio e fim |

## Decidido com o Miguel (21/10/2026)

- **Premissa:** juntar as 4 ideias numa só (seção 2). Ele achou "super legal".
- **Forma:** "investir em animações com as sprites que já temos e pouco texto, pra não ficar chato". Referência de
  ritmo: o trailer da Tutti (`~/Projects/midgar/tutti-ai/trailer/`) e os trailers do Soccermon. A cena roda
  **dentro do jogo**, em tempo real (Phaser + sprites PMD + retratos), sem vídeo pré-gravado.
- **Ginásio continua ginásio** (21/10): nada de "ginásio virou quadra" (o Miguel odiou a frase, "muito cara de IA", e
  trocar a palavra tira a identificação). O ginásio tem uma quadra dentro, e pronto. **Sem linha de lore na Home** por
  enquanto.
- **Texto:** falas curtas e naturais, como personagem de Pokémon fala. Nada de frase de efeito com cara de IA: sem
  "não é X, é Y", sem tricolon, sem dois-pontos dramático.
- **Respostas das perguntas da seção 8:** Pokémon não falam, só o Meowth da Rocket; "Liga de Baixo" serve; 1º jogo =
  inicial + peneira na Rota 1 ("você acabou de começar"); cada ginásio libera uma parte do jogo; insígnia dá efeito em
  quadra, mas de leve (com antes/depois); a Rocket mexe no seu time só com proposta que dá pra recusar, e eventos
  diferentes na campanha são bem-vindos; primeira entrega = o diretor de cena + a Cena 1 em `?lab=cenas` (H9).
- **Propostas da Rocket mais duras** (21/10): "não temos que passar a mão na cabeça dele". Aceitar custa de verdade
  (perde o jogador, o ₽ vem com condição) e recusar pode ter consequência (a Rocket volta mais forte, um evento ruim
  na rota). Continua sendo escolha do jogador: nada acontece no time sem ele decidir.
- **Pool que cresce** (21/10): no Modo história o jogador começa com poucos Pokémon possíveis no draft e vai
  desbloqueando opções conforme joga, perde, avança e volta (progressão de roguelite).
- **Liga de Baixo** (21/10): regras especiais na seção 3 (aprovadas, a ajustar e fora). "Sem intervalo" saiu (deixa o
  jogo lento). Momentos bobos ficam no Modo história, com trilha própria.

---

## 1. Como outros jogos explicam "criaturas fazendo esporte"

| Jogo | O que explica | O que deixa sem explicar | Tom | Lição pra cá |
|---|---|---|---|---|
| **Pokémon Sword/Shield** (Galar) | batalha é esporte de espectador: ginásio vira estádio, líder tem camisa numerada, torcida, TV, patrocínio (Macro Cosmos). O vilão é o dono do patrocínio, o Chairman Rose | por que só Galar é assim | épico de Copa do Mundo | o estádio lotado e o patrocínio que vira vilão já são cânone. Os Patrocínios da 0.9.0 cabem na história |
| **Pokémon Unite** (ilha Aeos) | uma cientista (Prof. Phorus) criou as Unite Battles depois de ver dois Pokémon evoluindo numa corrida; a energia Aeos fortalece e faz evoluir; quem é nocauteado volta | o resto do mundo | leve, quase nada de texto | **é a nossa premissa 2 pronta**: um professor, uma pesquisa, um esporte por equipe. E ninguém "morre" de verdade |
| **Pokéathlon** (HGSS) | nada: é uma atração do lado da jornada (Velocidade, Força, Técnica, Fôlego, Pulo) | tudo | festivo | dá pra ter esporte de Pokémon sem justificar; a jornada principal continua |
| **Concursos** (RSE, DPP) | outro jeito de competir: beleza e espetáculo em vez de batalha, com fitas no lugar de insígnias | por que os dois convivem | leve | cânone de "outra forma de competir" ao lado da batalha |
| **Pokémon Stadium** (N64) | nada; o Castelo dos Líderes é 8 líderes, Elite 4 e o rival em sequência | tudo | arena | a estrutura da jornada (8, Elite 4, rival) se sustenta sozinha, sem enredo |
| **Mystery Dungeon** | um humano vira Pokémon num mundo só de Pokémon; os retratos com emoção carregam a conversa | por que virou Pokémon (até o fim) | sensível, engraçado | os retratos PMD que já usamos (Happy, Surprised, Angry, Determined, Crying...) dizem muito sem texto |
| **Mario Strikers** | nada; copa, caos, golpes especiais | tudo | arcade | arcade não precisa de motivo. A Copa Relâmpago é isso |
| **Mario Tennis Aces** (modo aventura) | uma raquete lendária, Wario e Waluigi; tudo se resolve no tênis | por que tênis | bobo de propósito | uma premissa boba funciona se o jogo assume a graça |
| **Golf Story / Sports Story** | nada: o mundo resolve tudo com golfe (toupeira, zumbi, briga de vizinho) | tudo | humor seco | o humor está em levar o esporte a sério demais num mundo bobo |
| **Inazuma Eleven** (e GO) | futebol é o centro da sociedade; no GO o "Quinto Setor" manipula os placares e o herói faz o gol proibido | por que o futebol manda | anime shonen, às vezes sombrio | **liga manipulada é um vilão que funciona**, mas puxa pra sério. Pegar a ideia, não o peso |
| **Captain Tsubasa: Rise of New Champions** | menino que ama a bola rumo ao título nacional | — | anime de amizade | as críticas: "diálogo demais entre os jogos". O alerta pra nós |
| **Blue Lock** | a federação cria um programa radical depois de uma derrota | — | ego, épico | premissa como "programa" de uma instituição. Bom pra Liga Índigo, ruim pra tom leve |
| **Rocket League** | nada, de propósito: a Psyonix guarda a história pra o jogador imaginar | tudo | arcade | **não explicar também é escolha**. Vale pros modos rápidos |
| **Monster Rancher** | luta de monstros é o esporte oficial, com associações (FIMBA, IMa), ranks e a Copa Lendária | a origem (lenda antiga) | criação de bichinho | o esporte vira a estrutura do mundo (rank, liga, copa) |
| **Pokémon Rumble** | Pokémon são brinquedos de corda | — | fofo | a premissa pode explicar um limite técnico (lá, o gráfico simples; aqui, por que ninguém desmaia) |
| **Digimon World** | o parceiro cresce pelo cuidado e pelo treino | — | aventura | o laço como regra de jogo (a nossa sinergia) |
| **Yo-kai Watch** (Level-5, a mesma do Inazuma) | as bobeiras do dia a dia têm um culpado sobrenatural | — | comédia de bairro | o humor mora no cotidiano: um campinho de terra em Pallet já é graça |
| **Marvel Snap / Balatro** | quase nada de história | — | — | ensinam jogando: Snap abre a 1ª partida com uma regra só e libera o resto aos poucos |

**O que a pesquisa ensina:**

1. Ninguém precisa de muita explicação. Uma regra do mundo dita uma vez basta (Galar, Unite). O resto o jogo mostra.
2. O cânone já tem as peças: estádio e patrocínio (Galar), professor que cria o esporte (Unite), outra forma de
   competir (Concursos), a escada 8 + Elite 4 + rival (Stadium).
3. Os modos arcade ficam sem história (Strikers, Rocket League). Só o Modo história conta.
4. Texto entre jogos cansa (crítica ao Tsubasa). Emoção vem do retrato e da animação (PMD).
5. Liga manipulada e apostas dão um vilão forte (Inazuma GO). Com a Rocket trapalhona fica leve.

---

## 2. A premissa (decidida: as 4 ideias juntas)

**Em uma linha:** em Kanto, os líderes de ginásio trocaram o desmaio pelo futsal, o Prof. Carvalho descobriu que
Pokémon ficam mais fortes jogando juntos, e a Equipe Rocket montou uma liga clandestina com apostas pra roubar os
melhores jogadores. Você começa como técnico novato num campinho de terra em Pallet.

### As 4 camadas

| Camada | O que diz | O que explica no jogo |
|---|---|---|
| **1. Batalha sem desmaio** (o mundo) | uns anos atrás, os líderes e a Liga Índigo criaram o futsal pra Pokémon competirem sem se machucar. O ginásio continua ginásio, com uma quadra dentro. Estádio lotado no Planalto, como em Galar | golpes viram jogada; ninguém desmaia (cai e levanta); líderes são técnicos; quadras temáticas; torcida; insígnias; Liga e Copa |
| **2. A pesquisa do Carvalho** (o porquê de jogar) | o Carvalho estuda por que Pokémon que jogam juntos ficam mais fortes. A Pokédex dele marca quem **jogou**, não só quem foi visto | sinergias = laços; evolução no meio do jogo = laço que estoura; Pokédex "visto/jogou"; a missão do jogador ("não precisa pegar todos: precisa jogar com todos") |
| **3. Equipe Rocket** (o vilão) | a Rocket roda a **Liga de Baixo**: futsal sem juiz, em quadra de terra, com aposta no Cassino de Celadon. Rouba os melhores jogadores dos clubes pra jogar lá | Rocket como time da Rota (já existe); evento "Proposta pelo capitão" (Giovanni, já existe); lesão por carrinho; o "homem de terno" |
| **4. Começo pessoal** (você) | técnico novato de Pallet, campinho de terra com trave de madeira. O Blue, neto do Carvalho, já treina time de verdade, com uniforme | o clube que você cria (nome, escudo, faixa); o Draft do lugar como "peneira"; o Blue como rival fixo |

Elas se amarram: a 3 é o espelho torto da 1 (o futsal sem regra, onde Pokémon se machucam). A 2 dá o motivo pra
você jogar com todos. A 4 dá o lugar de onde você sai. E o Giovanni joga em **terra batida** (a quadra de Viridian
já é assim): a versão rica do seu campinho.

### O que já existe e como a premissa explica

| Já existe | Explicação na premissa |
|---|---|
| Golpes em quadra (Thunderbolt paralisa, Fissure "derruba") | é a "batalha sem desmaio": o golpe vira chute, carrinho, drible. Quem cai levanta |
| Tipos e sinergias de tipo | treinar junto quem é do mesmo tipo fortalece o laço (pesquisa do Carvalho) |
| Sinergias de história (Rocket, iniciais, Pássaros) | laços que o próprio cânone já conta |
| Evolução no meio da partida | o laço estoura no jogo; o Carvalho quer entender isso (como a energia Aeos no Unite) |
| Líderes como técnicos, falas, quadras temáticas | foram eles que criaram o futsal; cada ginásio tem a quadra do seu tipo |
| Pokédex "visto/jogou" | o dado da pesquisa do Carvalho |
| Prof. Carvalho e Blue na Rota Índigo | os mesmos personagens; o tom das falas já bate |
| Torcida, VERSUS, transmissão | o futsal é a liga mais amada de Kanto (estádio como Galar) |
| Cartas e edições (Shiny, Destaque, Ícone, Evento) | **figurinhas oficiais da Liga Índigo**: o Álbum existe dentro do mundo. Destaque = craque da rodada; Ícone = lenda de ginásio |
| Patrocínios e ₽ | a Liga tem patrocinador (Silph Co.). Galar já fez isso; a Rocket compra um patrocínio na virada |
| Insígnias (`BadgeCase`) | o líder entrega a insígnia pra quem vence o clube dele |

### Tom, antagonista e o que abre

- **Tom:** leve, com momentos épicos (a final) e graça de bairro (o campinho, a Rocket). Pokémon não falam (como
  na série principal). A exceção é o Meowth da Rocket, como no anime.
- **Antagonista:** Rocket em dois níveis. Os recrutas e a dupla do lema ("Prepare-se para encrenca...", já no jogo)
  são trapalhões. O Giovanni é frio e só mostra o rosto na Silph.
- **Abre pro futuro:**
  - **Johto (Gen 2):** a Liga cresce; a Rocket volta (cânone de Gold/Silver).
  - **Futebol de campo:** o Planalto tem o primeiro campo de grama; depois da Liga, "o futsal ficou pequeno".
  - **Ultimate Team:** figurinhas da Liga, Time da Semana, e uma edição de evento "resgatados da Liga de Baixo"
    (como os Shadow Pokémon de Colosseum). Visual novo de carta passa antes pela galeria `?cards=1`.

### Riscos e como evitar

| Risco | Como evitar |
|---|---|
| Contradizer o cânone | batalha continua existindo (a Rocket batalha de verdade); Poké Ball, cidades, ordem dos ginásios, Blue neto do Carvalho, Giovanni chefe da Rocket e líder de Viridian: tudo como nos jogos |
| Ficar sério demais (Inazuma GO) | roubo e aposta só como pano de fundo; nada de Pokémon machucado na tela; a Rocket perde e "decola de novo" |
| Texto demais pra celular | orçamento de texto (seção 4); a cena se conta com sprite, retrato e som |
| Roubar Pokémon do time do jogador | a Rocket rouba de outros clubes (do Blue, na virada). Do seu time, só faz **proposta**: aceitar custa de verdade, recusar pode ter consequência, mas quem decide é você ("nada automático no time do jogador") |
| Confundir os modos | a premissa só aparece no Modo história; os modos rápidos ficam sem história |

### As 3 premissas que não entram (alternativas)

| Premissa | Em uma linha | Por que fica de fora |
|---|---|---|
| **Não explicar** (Rocket League, Mario Strikers) | Kanto joga futsal e pronto | serve pra Copa Relâmpago, mas o Modo história precisa de motivo e de vilão |
| **A pelada selvagem** (estilo Mystery Dungeon) | os Pokémon começaram sozinhos, chutando uma fruta na Rota 1; os humanos só organizaram | divertida, mas não explica líderes nem Liga. Fica como **detalhe**: nas rotas dá pra ver Pokémon selvagens batendo bola (a "peneira") |
| **O futsal decide tudo** (Inazuma GO, Blue Lock) | a Liga controla Kanto e os placares decidem o destino das cidades | pesada demais e contradiz o cânone. A Rocket manipulando apostas já pega o melhor dela |

---

## 3. O arco do Modo história

Ordem dos ginásios da Gen 1. Cada capítulo = rota (Draft do lugar) + ginásio + uma cena. A cada ginásio o jogo
**libera uma mecânica**, como o Snap (começa com uma regra só). Quem já jogou a Copa sabe tudo; no Modo história a
mecânica nova chega com o líder que "é bom nela".

| Cap. | Lugar | Líder (tipo, quadra que já existe) | O que ensina / libera | Momento da história |
|---|---|---|---|---|
| 0 | Pallet, Rota 1 | — (campinho de terra, novo) | escalar o time; Draft do lugar ("peneira") | **Cena 1:** inicial 1 de 3 (o próprio draft), Blue pega o de vantagem; 1º jogo contra o Blue |
| — | Viridian | ginásio fechado | — | placa "Ginásio fechado. Líder viajando." (o Giovanni) |
| 1 | Pewter | **Brock** (Pedra, piso de pedra) | **formação e posições** (de origem, também joga, improvisado); o Onix vai pro gol | **Cena 2:** primeiro ginásio de verdade, com torcida. Insígnia da Rocha |
| — | Mt. Moon | Rocket (time da Rota) | — | **Cena 3:** a Rocket aparece. Recrutas querendo um Clefairy pra Liga de Baixo |
| 2 | Cerulean | **Misty** (Água, piscina) | **tipos e efetividade**; itens | Ponte Pepita: 5 treinadores = 5 cobranças de pênalti seguidas; no fim, o recrutador da Rocket faz proposta pelo seu capitão |
| 3 | Vermilion | **Lt. Surge** (Elétrico, chapas e raios) | **golpes e status**; gritos da beira da quadra | S.S. Anne: o Blue no navio, 2º jogo contra ele |
| 4 | Celadon | **Erika** (Planta, grama) | **fôlego e substituição**; vestiário no intervalo | **Cena 4 (a virada):** Cassino Rocket, a Liga de Baixo, o capitão do Blue roubado |
| — | Lavender | Médiuns (Rota) | — | Torre Pokémon: jogo silencioso, sem torcida (só os cries) |
| 5 | Fuchsia | **Koga** (Veneno, tatame) | **tática** (retranca, contra-ataque) | Zona Safári: Draft do lugar com raros |
| 6 | Saffron | **Sabrina** (Psíquico, xadrez rosa) | **ler o rival**: escalação dele antes, prancheta no meio do jogo | Silph Co.: a Rocket comprou o patrocínio da Liga. Giovanni aparece de rosto; Blue de novo |
| 7 | Cinnabar | **Blaine** (Fogo, argila e lava) | **evolução e garra** (virada no fim) | o quiz do Blaine vira evento de 3 perguntas; diário do Mewtwo na Mansão (gancho do pós-jogo) |
| 8 | Viridian | **Giovanni** (Terra, terra batida com friso dourado) | **tudo junto**; o rival técnico que reage | o chefe da Rocket é o líder. Ganhou: ele dissolve a Rocket (cânone) |
| 9 | Estrada da Vitória, Planalto | Elite 4 (Lorelei, Bruno, Agatha, Lance: sprites já existem) e **Blue campeão** | — | **Cena 5:** estádio lotado, a final contra o Blue. Hall da Fama (`HallParade` já existe) |
| Pós | Caverna de Cerulean | Mewtwo | — | o time do Mewtwo; gancho pra Johto e pro futebol de campo |

**Insígnias** também podem ter efeito, como na Gen 1 (lá a Rocha subia Ataque e a Cascata fazia Pokémon de nível 30
obedecer). Exemplo: cada insígnia sobe o teto de raridade do Draft do lugar. Isso é equilíbrio: decidir junto, com
antes/depois.

**Blue** aparece 5 vezes: Pallet, S.S. Anne, Celadon (do seu lado), Silph e a final. Começa arrogante ("meu time
treina em ginásio"), fica humilde na virada, volta a ser rival, perde a final. O Carvalho fecha com a fala do
cânone: o Blue esqueceu de confiar nos Pokémon. Aqui é literal: esqueceu de **jogar junto**.

**A virada (Celadon)** é o meio: a Rocket rouba o capitão do Blue (o inicial dele). Ele pede ajuda numa linha e te
**empresta 2 jogadores só pra aquela partida** (entram com aviso e saem depois). Partida na Liga de Baixo com a
**regra da casa** da Liga de Baixo (tabela abaixo; precisa do ok de equilíbrio, o `MatchConfig` é paramétrico). Ganhou:
os roubados ficam livres e você escolhe 1 de 3 pra levar (Draft do lugar). O Blue: "Isso não muda nada."

**Regras especiais da Liga de Baixo** (21/10; números e equilíbrio decididos junto, com antes/depois):

| Situação | Regra | O que faz |
|---|---|---|
| Aprovada | Sem juiz | sem falta marcada |
| Aprovada | Quadra de terra | o piso da Liga de Baixo |
| Aprovada | Gol de longe vale 2 | chute de fora da área conta dois |
| Aprovada | Aposta | vencer por 3 ou mais dá ₽ extra; perder custa ₽ |
| Precisa de ajuste | Apagão | a quadra escurece por trechos; passe longo erra; Fantasma e Psíquico se dão bem |
| Precisa de ajuste | Expulsão armada | 2 minutos com 4 contra 5 |
| Precisa de ajuste | Juiz comprado | um gol seu é anulado |
| Precisa de ajuste | Quadra torta | a bola puxa pra um lado |
| Precisa de ajuste | Morte súbita | — (definir como entra) |
| Fora | Sem intervalo | deixa o jogo lento |

**Momentos bobos** (piadas e cenas engraçadas) são do Modo história e vão ter uma trilha própria.

**Progressão do Modo história:** o pool do draft começa pequeno e cresce conforme você joga, perde, avança e volta
(roguelite). Como desbloqueia (por rota, por ginásio, por derrota) fica pro plano do modo.

**Orçamento de texto do Modo história inteiro:** ~20 cenas, ~40 palavras por cena, ~800 palavras no total. É menos
que a seção "Golpes" da Ajuda.

---

## 4. Guia de cena

Tirado do trailer da Tutti (cortes no compasso, frase subindo palavra por palavra, um som por evento, a
personagem entrando sozinha e olhando pra câmera) e do gosto do Miguel nos trailers (`soccermon-assets`).

| Item | Regra |
|---|---|
| **Duração** | cena comum 8–15 s; cena-chave 15–30 s; nenhuma passa de 35 s |
| **Tempo** | contado em batidas (120 por minuto: batida 0,5 s, compasso 2 s). Plano de 1 a 2 compassos; trocar a música não muda o roteiro |
| **Cortes** | 3 a 8 por cena, secos, na batida. Closes que aceleram até 0,4 s e não menos (o Miguel achou 0,3 rápido). Nada de câmera passeando por cenário vazio |
| **Letreiro** | até **4 palavras**, caixa alta, Galmuri11 Bold, grande. Entra palavra por palavra (0,08 s entre elas). Diz o lugar ou o fato: "GINÁSIO DE PEWTER", "EQUIPE ROCKET". Sem frase irônica |
| **Fala** | caixa de diálogo estilo Red/Blue (a `BattleBox` do jogo), digitando com bipe. Até **12 palavras**, 1 a 2 linhas. **No máximo 3 falas por cena** (4 na virada) |
| **Retrato** | retrato PMD com emoção trocando no tempo da fala (Happy, Surprised, Angry, Determined, Crying, Joyous, Shouting, Sigh, Inspired). Pokémon não fala: o retrato fala por ele |
| **Movimento** | Pokémon sempre com animação PMD (Walk, Hop, Attack, Pose, Hurt, Charge, Shoot); sprite parado deslizando é proibido. Treinador (sprite parado de 80×80) entra por **corte** com pulinho e achatar/esticar, nunca deslizando |
| **Câmera** | zoom de 1 a 1,3; tremida só em impacto (Onix pisando, porta abrindo); holofote do `Cinematics` pra focar alguém |
| **Som** | um som por evento: bipe por letra, cry do Pokémon, apito gravado (um só), torcida gravada, moedas da Rocket. Silêncio antes do momento grande |
| **Música** | o jogo hoje não tem música. Proposta: começar sem (cries, torcida e efeitos bastam) e decidir um tema depois (pergunta 6) |
| **Pular** | tocar adianta o plano (completa o texto). Botão "Pular" no canto a partir de 0,5 s pula a cena toda. Cena vista não repete sozinha; dá pra rever na Sala de troféus (uma TV no quarto) |
| **Reduzir movimento** | sem tremida, zoom nem flash: cortes viram fade de 200 ms |
| **Nada teleporta** | entrar e sair da cena segue a regra (fade 250 ms, `--ease-out`). Corte seco **dentro** da cena é linguagem de cinema, como no trailer |
| **Celular** | palco em pé (390 px) primeiro; deitado e desktop enquadram o mesmo palco. Texto fora dos 15% de baixo; tudo centrado |
| **Idioma** | letreiro e fala em `src/i18n` (pt e en), com teste contando palavras por letreiro e por fala |

---

## 5. As 5 cenas-chave (roteiro curto)

Tempos em segundos (batidas de 0,5 s). "Fala" = caixa de diálogo; "LETREIRO" = texto grande.

### Cena 1 · Abertura em Pallet (feita em `?lab=cenas`, ~15,5 s + draft + ~14 s)

Roteiro de verdade em `src/story/scenes/pallet.ts`; textos em `src/i18n/story.ts`. Sem a frase proibida: o ginásio
antigo e o de hoje aparecem só com imagem e um letreiro de fato.

| # | Tempo | Imagem | Texto | Som |
|---|---|---|---|---|
| 1 | 0–3 | Ginásio de Pewter antigo, escuro, holofote. Geodude (Attack) acerta o Machop: Hurt, tremida, Faint. Retrato do Machop com dor | LETREIRO: KANTO, ANOS ATRÁS | baque; "uuuh" baixo |
| 2 | 3–5,5 | Corte: o mesmo ginásio aceso, com quadra, trave e torcida. Machop chuta (Shoot), a bola quica pro gol, Geodude no gol | LETREIRO: LIGA ÍNDIGO DE FUTSAL | apito; chute; torcida |
| 3 | 5,5–7,5 | Pallet de manhã: campinho de terra, trave de madeira torta. O Red entra com pulinho, chuta, a bola bate na trave e volta | LETREIRO: PALLET | chute; trave |
| 4 | 7,5–11,5 | O time do Blue passa correndo (Pidgey e Rattata em Walk). Corte pro Blue (zoom 1,25, pulinho) | Fala (Blue): "Campinho de terra? Meu time treina em ginásio." | bipe |
| 5 | 11,5–14 | Corte pro Carvalho na porta do laboratório | Fala (Carvalho): "Vocês dois! Venham pro laboratório." | bipe |
| 6 | 14–15,5 | Laboratório: três Poké Balls na mesa, Red e Blue entram com pulinho | — | — |
| — | — | **Entrega pro jogo:** o draft 1 de 3 dos iniciais (no lab, um 1 de 3 simples) | — | — |
| 7 | 0–2 | A bola escolhida some num flash, o inicial sai em Pose com o cry; retrato Joyous | — | cry |
| 8 | 2–4,5 | O Blue pega o de vantagem (flash, Pose, cry) | Fala (Blue): "Então eu fico com esse." (retrato do dele: Determined) | cry; bipe |
| 9 | 3,5–4,5 | O seu dá um pulinho; retrato Angry | — | — |
| 10 | 4,5–8 | Corte pro Carvalho (zoom 1,2) | Fala (Carvalho): "Pokémon que jogam juntos ficam mais fortes. Leve esta Pokédex." (retrato do seu: Inspired) | "plim"; bipe |
| 11 | 8–11,5 | Plano aberto. O Blue sai; o inicial dele sai andando | Fala (Blue): "Monta um time na Rota 1. Te espero no campinho." (retrato do seu: Determined) | bipe |
| 12 | 11,5–14 | Rota 1: o seu inicial sobe a trilha andando, o Red entra; pulinho e cry no fim | LETREIRO: ROTA 1 | cry |

Em inglês: KANTO, YEARS AGO · INDIGO FUTSAL LEAGUE · PALLET TOWN · ROUTE 1; "A dirt pitch? My team trains in a gym." ·
"You two! Come to my lab." · "Then I'll take this one." · "Pokémon that play together get stronger. Take this
Pokédex." · "Go build a team on Route 1. I'll be at the pitch."

### Cena 2 · Primeiro ginásio: Brock (~16 s)

| # | Tempo | Imagem | Texto | Som |
|---|---|---|---|---|
| 1 | 0–2 | Fachada do ginásio. Porta abre | LETREIRO: GINÁSIO DE PEWTER | porta, torcida abafada |
| 2 | 2–5 | Corte pra dentro: quadra de pedra (`COURTS.brock`), arquibancada cheia | — | torcida alta |
| 3 | 5–9 | O Onix entra (Walk). A câmera treme a cada passo. Ele para no gol e ocupa o gol inteiro | — | passo pesado ×3, cry do Onix |
| 4 | 9–11 | Corte pro Brock, braços cruzados | Fala (Brock): "Minha defesa é de pedra. Quero ver você passar." (já existe) | — |
| 5 | 11–13 | Retrato do seu capitão: Surprised, depois Determined | — | — |
| 6 | 13–16 | VERSUS de sempre | — | apito |
| *depois* | 0–4 | A insígnia gira e cai no estojo (`BadgeCase`); carta "Formações liberadas" vira | LETREIRO: INSÍGNIA DA ROCHA | "plim" |

### Cena 3 · A Rocket aparece: Mt. Moon (~18 s)

| # | Tempo | Imagem | Texto | Som |
|---|---|---|---|---|
| 1 | 0–3 | Caverna escura (holofote). Três Clefairy batendo bola com uma pedra da lua (Hop) | LETREIRO: MT. MOON | pinga-pinga, risadinhas (cries agudos) |
| 2 | 3–5 | Moedas caem do teto (efeito do Pay Day que já existe). Os Clefairy param e olham | — | moedas |
| 3 | 5–7 | Corte: dois recrutas da Rocket, sprite com pulinho | LETREIRO: EQUIPE ROCKET | acorde grave |
| 4 | 7–10 | Retrato do Clefairy: Surprised, depois Crying | Fala (Recruta): "Esse aí joga bem. Vai render aposta na Liga de Baixo." | — |
| 5 | 10–13 | Seu capitão entra na frente (Walk, Pose). Retrato Angry | — | cry |
| 6 | 13–15 | VERSUS contra a Equipe Rocket (time da Rota que já existe) | Fala (Recruta): "Prepare-se para encrenca!" (já existe) | apito |
| *depois* | 0–4 | Os recrutas somem num brilho ("decolando de novo"). Fica no chão um ingresso com o R | LETREIRO: CELADON, 22H | "plim" |

### Cena 4 · A virada: o Cassino Rocket (~30 s)

| # | Tempo | Imagem | Texto | Som |
|---|---|---|---|---|
| 1 | 0–2 | Celadon à noite, o Cassino. O Blue na porta, sozinho, sem o time | — | máquinas caça-níquel |
| 2 | 2–5 | Corte pro Blue | Fala (Blue): "Levaram meu capitão. Preciso de um técnico." | silêncio |
| 3 | 5–7 | O pôster atrás da máquina (cânone). Seu capitão aperta o botão escondido; a parede abre | — | clique, porta |
| 4 | 7–10 | Escada descendo, corte seco a cada degrau (0,7 / 0,6 / 0,5 / 0,4 s) | — | passos acelerando |
| 5 | 10–13 | A Liga de Baixo: quadra de terra com grade, recrutas apostando | LETREIRO: LIGA DE BAIXO | moedas, vaia |
| 6 | 13–16 | O capitão do Blue numa jaula. Retrato Crying | — | cry fraco |
| 7 | 16–19 | Sacada no alto: silhueta escura (o Giovanni, sprite pintado de preto) | Fala (?): "Aqui não tem juiz." | acorde grave |
| 8 | 19–22 | Blue ao seu lado, os dois de frente pra quadra | Fala (Blue): "Te empresto dois. Só hoje." | — |
| 9 | 22–26 | Cartão "Regra da casa: sem juiz" + VERSUS | — | apito |
| *depois* | 0–5 | A jaula abre. O capitão corre pro Blue (Walk, Hop; retrato Joyous). Os outros roubados olham pra você | Fala (Blue): "Isso não muda nada." | cries |
| *depois* | +5 | Draft do lugar: escolha 1 de 3 entre os libertados | — | — |

### Cena 5 · A final na Liga Índigo (~24 s antes, ~14 s depois)

| # | Tempo | Imagem | Texto | Som |
|---|---|---|---|---|
| 1 | 0–3 | Estádio do Planalto por fora, cheio de luz | LETREIRO: PLANALTO ÍNDIGO | torcida enorme, de longe |
| 2 | 3–6 | Closes da Elite 4 vencida, um por corte: Lorelei 0,7, Bruno 0,6, Agatha 0,5, Lance 0,4 | — | um baque por close |
| 3 | 6–8 | Silêncio. Quadra de mármore (`COURTS.lance`) vazia, a bola parada no meio | — | silêncio |
| 4 | 8–12 | Blue no centro, o time dele atrás em Pose | Fala (Blue): "Cheguei antes de você. O campeão sou eu." | — |
| 5 | 12–16 | Seus 5 entram um a um (Walk), cada um com seu cry e o retrato Determined | — | 5 cries, torcida subindo |
| 6 | 16–18 | Os dois capitães cara a cara, zoom 1,3 | — | — |
| 7 | 18–20 | Apito | LETREIRO: A FINAL | apito (o único) |
| *depois* | 0–4 | Carvalho entra na quadra. Retrato do inicial do Blue: Sigh | Fala (Carvalho): "Blue, você esqueceu de jogar junto com eles." | torcida baixa |
| *depois* | 4–8 | Carvalho vira pra você, Pokédex aberta | Fala (Carvalho): "Agora me conta: quantos jogaram com você?" | "plim" |
| *depois* | 8–14 | Hall da Fama (`HallParade`), depois o letreiro | LETREIRO: CAMPEÃO DE KANTO | torcida, fogos |

Cada cena passa por **storyboard antes de montar** (mesmo processo do trailer 2: um quadro real por plano, em
`?lab=cenas`), com o ok do Miguel.

---

## 6. O "diretor de cena" (tecnologia reaproveitável)

**Feito (H9, 21/10):** `src/story/director.ts` (parte pura: ordem, tempo, adiantar, pular, elenco; teste em
`director.test.ts`), `src/game/scenes/StoryScene.ts` (o tocador no Phaser, com câmera do mundo e câmera parada pro
letreiro, fala e retrato), `src/game/story-stages.ts` (ginásio antigo, ginásio com quadra, Pallet, laboratório, Rota 1)
e `src/ui/screens/StoryLab.tsx` (`?lab=cenas`, dev e prévias; `&reduzir=1` força o Reduzir movimento, `&inicial=4`
escolhe sozinho no draft). O relógio da cena anda com o `update` do Phaser; pra gravar quadro a quadro, além do
`game.step`, o `Date.now` precisa andar junto (os tweens do Phaser leem o `Date.now`).

Uma cena é **dados**: uma lista de passos no tempo, em batidas. Um tocador único lê a lista e usa o que o jogo já
tem. Fica em Phaser (um relógio só pra sprite, câmera, texto e som), carregado sob demanda como o resto do Phaser.

```ts
// src/story/scenes/pallet.ts (esboço)
export const pallet: SceneScript = {
    bpm: 120,
    stage: 'templo-antigo',
    steps: [
        { at: 0, do: 'actor', id: 'machop', species: 66, x: 0.4, y: 0.6, dir: 'right' },
        { at: 0, do: 'actor', id: 'geodude', species: 74, x: 0.6, y: 0.6, dir: 'left' },
        { at: 1, do: 'anim', id: 'machop', anim: 'Attack' },
        { at: 2, do: 'anim', id: 'geodude', anim: 'Hurt' },
        { at: 2, do: 'title', key: 'story.pallet.before' },
        { at: 4, do: 'cut', stage: 'quadra-antiga' },
        { at: 4, do: 'sound', sample: 'apito' },
        // ...
    ],
};
```

| Passo | O que faz | Reaproveita |
|---|---|---|
| `stage` / `cut` | troca o cenário (corte seco) | `court-themes.ts` (as 10 quadras), `room-art.ts` (quarto em pixel art) |
| `actor` | põe um Pokémon (espécie, shiny, posição, direção) ou um treinador | `animation-manager.ts` (folhas PMD), `public/assets/trainers` |
| `walk` | anda até um ponto com a animação Walk e a direção certa | `animation-manager.ts` |
| `anim` | Hop, Attack, Pose, Hurt, Charge, Shoot, Swing | `animation-manager.ts` |
| `pop` | treinador entra com pulinho e achatar/esticar | novo (tween simples) |
| `portrait` | retrato PMD com emoção, de um lado da tela | `public/assets/portraits`, o mesmo dos emotes |
| `say` | caixa de diálogo digitando com bipe | `battle-box.ts` |
| `title` | letreiro grande, palavra por palavra | novo (texto Galmuri + tween), o "drama" do `cinematics.ts` como base |
| `camera` | zoom, foco num ator, tremida | câmera do Phaser, `punch()` do `MatchScene` |
| `spot` / `flash` | holofote e flash | `cinematics.ts` |
| `fx` | moedas do Pay Day, brilho, poeira | `move-fx.ts` |
| `sound` / `cry` / `crowd` | efeito, cry, torcida | `audio.ts` (`playSample`, `playCry`, `playCrowd`) |
| `wait` | espera um toque (raro: só antes de entregar pro jogo) | — |
| `handoff` | entrega pro jogo (draft, VERSUS, partida) e volta depois | as telas que já existem |

**Comportamento único do tocador:** pular (aplica o estado final de cada ator e vai pro fim), tocar pra adiantar,
Reduzir movimento (troca corte, zoom e tremida por fade), cena vista guardada no save (`seenScenes`).

**Ganho extra:** a gravação quadro a quadro do trailer (`game.step`, `scripts/trailer-capture.mjs`) funciona igual
no palco da cena. Toda cena vira clipe 9:16 pro TikTok sem trabalho novo.

**Teste:** cada roteiro tem chaves de texto que existem em pt e en; letreiro com até 4 palavras e fala com até 12;
duração calculada abaixo de 35 s; atores com animação que existe na folha PMD (o `FALLBACK` cobre as que faltam).

### Esforço

| Peça | Dias |
|---|---|
| Tocador + passos + pular + Reduzir movimento + `?lab=cenas&cena=` | 3–4 |
| Cenários novos: campinho de terra, caverna, cassino, laboratório, fachada de ginásio, estádio por fora | 2–3 |
| As 5 cenas-chave (storyboard, montagem, ajuste no celular, en) | 4–5 |
| **Total das 5 cenas com o diretor** | **~2 semanas** |
| As ~15 cenas pequenas que faltam pro Modo história | +1,5 a 2 semanas |

Fora daqui: o Modo história em si (save que dura, mapa de Kanto, Draft do lugar, progressão), que é outro plano.
O que falta de asset: treinadores andando (hoje são sprites parados de 80×80; o corte com pulinho resolve) e as
silhuetas dos cenários novos (desenhados em `Graphics`, como as quadras).

---

## 7. Como amarrar sem bagunçar

| Modo | O que muda | O que não muda |
|---|---|---|
| **Copa Relâmpago** | nada | tudo |
| **Rota Índigo** | as 6 falas por região passam pela voz da premissa (já batem: Carvalho, Blue, Brock, Misty, Lance); "Proposta pelo capitão" pode ganhar o R da Rocket | é "outra temporada": o Lance na final e o Blue como desafiante não brigam com o Modo história |
| **Duelo** | nada: amistoso entre técnicos | tudo |
| **Liga** | nada: é a Liga Índigo oficial, com ranking | tudo |
| **Copa do Dia** | nada: "a rodada do dia" | tudo |
| **Ultimate Team** | ganha um enredo pros eventos: figurinhas da Liga, Time da Semana, edição "resgatados da Liga de Baixo" | as regras do UT ([ultimate-team.md](ultimate-team.md)) |
| **Pokédex** | a Ajuda diz numa linha que é a pesquisa do Carvalho | a regra de visto/jogou |
| **Sala de troféus** | uma TV pra rever as cenas; o `BadgeCase` na mesa | o resto |

**Linha de lore:** não entra por enquanto (decidido em 21/10). Se um dia voltar, sem "ginásio virou quadra".

Antes de subir, passa pelo verificador de frase de IA (`python3 -I .claude/skills/soccermon-marca/copy_ia.py`).

---

## 8. Perguntas pro Miguel (recomendação primeiro)

**Respondidas em 21/10** (ver "Decidido com o Miguel" no topo). A 1 ficou "não" (sem linha de lore); a 6 (música)
segue em aberto: a Cena 1 está sem música, só cries, torcida e efeitos.

1. **Linha de lore nas boas-vindas e na Ajuda já agora**, antes do Modo história? **Sim, só a linha (recomendo)**
   / esperar o Modo história.
2. **Pokémon falam?** **Não, só retrato e cry; o Meowth da Rocket é a exceção (recomendo)** / ninguém fala / todos
   falam (estilo PMD).
3. **Nome da liga clandestina:** **Liga de Baixo (recomendo)** / Liga Subterrânea / Copa da Sombra / outro.
4. **A Rocket mexe no seu time?** **Só com proposta que você recusa; rouba do Blue e de outros clubes (recomendo)**
   / pode roubar um reserva seu por 1 capítulo.
5. **Regra da casa na Liga de Baixo** (sem intervalo e sem substituição): **sim, só nessa partida, com antes/depois
   de equilíbrio (recomendo)** / partida normal.
   *Resposta (21/10): sem intervalo não (deixa o jogo lento); as outras regras estão na tabela da seção 3.*
6. **Música nas cenas:** **começar sem música, só cries, torcida e efeitos (recomendo)** / um tema curto feito pro
   jogo / música de fã com crédito (como no trailer).
7. **Primeiro jogo do Modo história:** **inicial + peneira de 4 na Rota 1, depois o Blue no campinho (recomendo)** /
   inicial + 4 emprestados do laboratório contra o Blue.
8. **Mecânica liberada por ginásio** (estilo Snap): **sim, só no Modo história (recomendo)** / tudo liberado desde o
   começo.
9. **Insígnia com efeito** (sobe o teto de raridade do Draft do lugar): **sim, com antes/depois (recomendo)** / só
   enfeite.
10. **Primeira entrega:** **o diretor de cena + a Cena 1 (Pallet) em `?lab=cenas`, pra você sentir o ritmo
    (recomendo)** / as 5 de uma vez / esperar o plano do Modo história inteiro.

---

## Fontes

- Galar e Macro Cosmos: [Bulbapedia, Rose](https://bulbapedia.bulbagarden.net/wiki/Rose),
  [Serebii, Macro Cosmos](https://www.serebii.net/swordshield/macrocosmos.shtml),
  [Bulbapedia, Galar](https://bulbapedia.bulbagarden.net/wiki/Galar),
  [Siliconera: ginásios como estádios](https://www.siliconera.com/2019/03/08/pokemon-sword-and-shield-features-soccer-stadiums-as-gyms/),
  [TheGamer: batalha como esporte de espectador](https://www.thegamer.com/pokemon-battles-galar-sword-shield-boring-spectator-sport/)
- Unite: [Bulbapedia, Aeos Island](https://bulbapedia.bulbagarden.net/wiki/Aeos_Island),
  [Bulbapedia, Aeos energy](https://bulbapedia.bulbagarden.net/wiki/Aeos_energy),
  [mangá oficial, cap. 1](https://play.nintendo.com/news-tips/comics/pokemon-manga-chapter-1-aeos-energy/)
- [Bulbapedia, Pokéathlon Dome](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9athlon_Dome);
  [Bulbapedia, Coordinator](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Coordinator);
  [Bulbapedia, Pokémon Base (anime)](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Base)
- [Wikipedia, Pokémon Stadium](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Stadium);
  [Bulbapedia, Pokémon Stadium](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Stadium)
- [Wikipedia, Mystery Dungeon: Red/Blue Rescue Team](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Mystery_Dungeon:_Blue_Rescue_Team_and_Red_Rescue_Team)
- [Wikipedia, Mario Strikers: Battle League](https://en.wikipedia.org/wiki/Mario_Strikers:_Battle_League);
  [MobileSyrup, review](https://mobilesyrup.com/2022/06/08/mario-strikers-battle-league-review/)
- Golf Story: [Wikipedia](https://en.wikipedia.org/wiki/Golf_Story), [RPGamer](https://rpgamer.com/review/golf-story-review/),
  [GamesBeat](https://gamesbeat.com/golf-story-review-nintendo-switchs-hole-in-one-blend-of-rpg-and-links/)
- Inazuma Eleven: [Wikipedia, GO temporada 1](https://en.wikipedia.org/wiki/Inazuma_Eleven_GO_season_1),
  [Wikipedia, GO (jogo)](https://en.wikipedia.org/wiki/Inazuma_Eleven_GO_(video_game))
- Captain Tsubasa: [Game Critics](https://gamecritics.com/eugene-sax/tsubasa-rise-of-new-champions-review/),
  [Nintendo Life](https://nintendolife.com/reviews/nintendo-switch/captain_tsubasa_rise_of_new_champions),
  [Bandai Namco, modo história](https://en.bandainamcoent.eu/captain-tsubasa/news/captain-tsubasa-rise-of-new-champions-story-mode-reveal)
- [Sportskeeda: o projeto Blue Lock](https://sportskeeda.com/anime/blue-lock-the-blue-lock-project-explained)
- Rocket League: [Game Informer, "the surprisingly guarded lore"](https://gameinformer.com/b/features/archive/2015/08/09/the-surprisingly-guarded-lore-of-rocket-league),
  [GamePro](https://www.gamepro.de/artikel/rocket-league-hat-eine-story-entwickler-will-sie-nicht-verraten,3236123.html)
- Monster Rancher: [Wikipedia, Monster Rancher 2](https://en.wikipedia.org/wiki/Monster_Rancher_2),
  [Monster Rancher Wiki, batalhas](https://monster-rancher.fandom.com/wiki/Category:Monster_Battles)
- Rumble: [Wikipedia, Pokémon Rumble World](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Rumble_World),
  [Nintendo Life](https://www.nintendolife.com/reviews/3ds-eshop/pokemon_rumble_world)
- Marvel Snap: [Mobilegamer, onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/),
  [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction)
- Cânone de Kanto (ordem dos ginásios, efeito das insígnias na Gen 1, Cassino de Celadon, Silph Co., a fala final
  do Carvalho): Pokémon Red/Blue/Yellow e FireRed/LeafGreen.
- Ritmo das cenas: `~/Projects/midgar/tutti-ai/trailer/roteiro.md` e `composicao.html` (100 BPM, compasso de
  2,4 s, frase palavra por palavra, um som por evento); `.claude/skills/soccermon-assets/SKILL.md` (gosto do Miguel).
