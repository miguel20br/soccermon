---
description: Revisão de todos os textos do jogo em PT por blocos (inventário, verificador, blocos 1 a 3 aplicados, propostas do bloco 4).
---

# Revisão dos textos do jogo (24/10/2026)

O Miguel acha os textos "meio estranhos, meio feitos de IA". A revisão vai por blocos, na ordem em que o jogador
vê: ele aprova um bloco, o Claude aplica (PT e EN juntos) e passa pro próximo. Bloco 1 aplicado em 25/10 ("ok
1-16"), junto com o "pra" padronizado e as 17 strings sem uso apagadas.

Critérios: método de escrita do brand guide (§4), a memória "texto sem cara de IA" e a skill humanizer
("Signs of AI writing"): dois-pontos de anúncio, "não é X, é Y", trio por regra, par de enfeite ("rápido e
direto"), gerúndio pendurado, explicar o óbvio, palavra de sistema (save, visitante), travessão, mistura de
"pra" e "para".

## 1. Inventário por bloco

Contagem das strings PT do dicionário (`src/i18n/pt/*.ts`, achatado: cada texto, item de lista ou forma de
plural conta 1) mais os textos do motor que aparecem na tela (`MOVE_EXPLAIN` em `src/engine/moves.ts`, itens e
formações). Total: **3.551** (3.425 do dicionário + 126 do motor).

| # | Bloco | O que entra | Strings |
|---|---|---|---:|
| 1 | Home, menus e primeira visita | `home`, `common.ui`, fases (`common.stage*`), barra da conta (`settings.bar`), `account` (juntar saves, copa guardada), cartões da Home (Copa do Dia, Liga, Duelo), passo a passo de boas-vindas, tela de Ajuda (busca), `bracket` | 205 |
| 2 | Draft, escalação e cartas | `team` (draft, escalação, carta, painel), posições, atributos, formações, táticas, escanteio, vínculos (`common.link`), corpo do Pokémon | 376 |
| 3 | Partida: HUD, técnico e letreiros | `match` (menos líderes), `battle` (letreiros e pops em quadra) | 372 |
| 4 | Narração | `commentary` | 160 |
| 5 | Resultado, recompensa e Mercado | `result`, `reward` (inclui MTs), `shop`, `moments` (clipes) | 319 |
| 6 | Golpes, itens e efeitos | `MOVE_EXPLAIN` (94), Golpedex (`stats.lab`), status, tipos, itens, bônus (`common.mod`); o texto gerado de `src/i18n/move-text.ts` vai junto | 278 |
| 7 | Rota Índigo, líderes e história | `longCup`, falas dos líderes (`match.leaders`), cenas do Modo história (`src/i18n/story.ts`, 11) | 241 |
| 8 | Ajuda e dicas do técnico | `help` (seções, perguntas frequentes, balões do técnico) | 283 |
| 9 | Perfil, coleção e troféus | `profile` (clube, Pokédex, álbum, missões, medalhas, títulos), `trophies`, `title`, `stats`, raridade e acabamento | 838 |
| 10 | Duelo, Liga e amigos | `duel`, `liga` (menos o cartão da Home), `friends` | 351 |
| 11 | Configurações, créditos e erros | `settings` (menos a barra), créditos, tela de erro, importar e exportar | 139 |

**Fora do i18n** (strings soltas em `src/ui`): quase tudo é ferramenta de dev (`?lab=posicoes`, `?cards=1`,
galerias e laboratórios, ~95 strings) e fica fora. As que o jogador vê são nomes: tipos em
`type-colors.ts` (18), raridades em `rarity.ts` (~10), o título da aba em `settings-sync.ts` e 3 erros do
simulador em `sim-client.ts`. Entram nos blocos 6, 9, 1 e 11.

**Novidades** (`src/ui/patch-notes.ts`, 90 versões) ficam fora: é histórico, revisado a cada lançamento.

## 2. Resultado do verificador

### `copy_ia.py` (todos os `src/i18n/pt/*.ts`, `story.ts`, `move-text.ts` e os textos do motor)

12 achados, só 4 reais. O verificador pega o tique mecânico; o que soa estranho no jogo é de estrutura.

| Bloco | Achado | Situação |
|---|---|---|
| 2 | `team.lineup.title`: "Escalação — {team}" | travessão, trocar por "·" |
| 3 | `match.reload`: "A quadra não carregou — recarregar" | travessão |
| 3 | `match.agency.maxWaitHint`: "próximo nível" | falso: é o nível do golpe máximo |
| 4 | `commentary.timeDraw`: "Fim de jogo! {score} — vamos para os pênaltis!" | travessão |
| 5 | `result.shareText`: emoji 🏆 (2) | pode: é texto de Compartilhar |
| 9 | `trophies.nextLevel`: "Próximo nível" | falso: nível da taça |
| 11 | `settings.credits.pmd`: travessão no meio dos créditos | travessão |
| motor | 4 em comentários de código | falso |

### Filtro da humanizer (script no scratchpad, adaptado pro PT)

Sinais por bloco. É filtro grosso: dois-pontos de rótulo ("Dica:") e explicação longa na Ajuda contam também. O
número real sai na leitura de cada bloco.

| # | Bloco | Sinais | O que mais aparece |
|---|---|---:|---|
| 1 | Home e menus | 33 | mais de 12 palavras 9, trio 8, "para" 5, palavra de anúncio 3, dois-pontos 3, negrito 3 |
| 2 | Draft e escalação | 66 | "para" 16, dois-pontos 15, trio 13, mais de 12 palavras 11, "sem X" 6, "clássico/sólido e direto" nas formações |
| 3 | Partida | 28 | dois-pontos 10, "para" 7, mais de 12 palavras 6, "Parabéns! … evoluiu!" |
| 4 | Narração | 40 | exclamação dupla 16, "para" 13, dois-pontos 5, "clássico!" |
| 5 | Resultado e Mercado | 22 | mais de 12 palavras 8, dois-pontos 5, "em vez de" 5 |
| 6 | Golpes e itens | 177 | mais de 12 palavras 77, dois-pontos 76 (quase todo `MOVE_EXPLAIN` é "Rótulo: regra; regra.") |
| 7 | Rota Índigo e líderes | 36 | exclamação dupla 20 (falas dos líderes; parte é fala de personagem e pode), mais de 12 palavras 8 |
| 8 | Ajuda | 192 | mais de 12 palavras 93, trio 31, negrito 30, dois-pontos 28 |
| 9 | Perfil e troféus | 54 | dois-pontos 17, mais de 12 palavras 15, trio 14 |
| 10 | Duelo, Liga e amigos | 49 | mais de 12 palavras 25, dois-pontos 20 |
| 11 | Configurações | 25 | trio 9, mais de 12 palavras 6, "para" 4 |

Padrões que se repetem no jogo todo (valem pros próximos blocos):

- **"para" e "pra" misturados**, às vezes na mesma tela ("Não deu para salvar…" ao lado de "Não deu pra abrir…").
  Proposta: "pra" em todo texto de jogo; "para" só no aviso legal e nos créditos.
- **"Rótulo: explicação"** em fila (golpes, dicas do intervalo, formações). Um ou outro é rótulo; em fila vira tique.
- **Par de enfeite** no fim da frase: "rápido e direto", "Sólido e direto", "Equilíbrio clássico".
- **Palavra de sistema**: save, progresso de visitante.

## 3. Bloco 1: Home, menus e primeira visita (205 strings)

**Aplicado em 25/10** ("ok 1-16"; o item 5, `help.screen.tipsBack`, ficou "As dicas voltaram à tela."). O EN acompanhou onde tinha o mesmo defeito: "Patch notes" virou "What's new",
"guest progress" e "save" saíram, "quick and direct" saiu, o parêntese do erro da nuvem virou frase.

| Chave | Texto atual | Proposta | Por quê |
|---|---|---|---|
| `home.soon[1].text` | O time da temporada, montado abrindo pacotes | Abra pacotes e monte o time da temporada | gerúndio pendurado ("montado abrindo"), frase de catálogo |
| `home.eventText` | Cartas Evento do tipo {type} podem aparecer no draft. | Cartas Evento de {type} podem sair no draft. | repete "tipo" do título logo antes ("Semana do tipo Fogo"); no draft o jogo diz "saem", não "aparecem" |
| `home.quickCup.line` | Mata-mata de 4 jogos, rápido e direto. | Mata-mata das oitavas à final. | "rápido e direto" é par de enfeite (linguagem de venda); "4 jogos" já está na etiqueta do lado |
| `home.tiles.news[0]` e `home.news` | Notas da versão | Novidades | tradução de "patch notes", cara de programa; é o nome que o próprio projeto usa |
| `help.screen.tipsBack` | Dicas de volta nas telas | As dicas voltaram | frase sem verbo, ordem estranha |
| `help.onboarding.welcomeText` | Os **151 de Kanto** num futsal 5 contra 5. Monte o time e ganhe a copa. | Os **151 de Kanto** jogando futsal 5 contra 5. Monte o time e ganhe a copa. | "num futsal" soa traduzido |
| `settings.bar.error` | Não deu para salvar na nuvem (o jogo continua salvo neste aparelho) | Não deu pra salvar na nuvem. Neste aparelho está salvo. | parêntese explicativo; "para" do lado do "pra" do aviso seguinte |
| `liga.home.dailyDone` | Ver o dia | Ver resultado | vago: o botão abre o resultado da Copa do Dia que você já jogou |
| `liga.home.ligaClosed` | A Liga abre quando tiver mais gente jogando. Enquanto isso, a Copa do Dia tem ranking todo dia. | Enquanto a Liga não abre, a Copa do Dia tem ranking. | 17 palavras; "Dia… todo dia" repete; "quando tiver mais gente" contradiz a contagem logo abaixo ("Abre em 37d"). **Decisão sua:** se o motivo deve aparecer, fica a primeira frase |
| `duel.line` | Desafie um amigo ao vivo: mande o link e joguem juntos | Mande o link pra um amigo e joguem ao vivo | dois-pontos de anúncio; "desafie" e "joguem juntos" dizem a mesma coisa |
| `account.bring.title` e `account.bring.yes` | Levar seu progresso para a conta? / Levar para a conta | Levar seu progresso pra conta? / Levar pra conta | "pra" como o resto da tela |
| `account.bring.text` | Você entrou com o Google. Este aparelho tem progresso de visitante: | Você entrou com o Google. Este aparelho tem um jogo salvo sem conta: | "progresso de visitante" é palavra de sistema |
| `account.merge.text` | Sua conta já tem um save, e este aparelho tem progresso de visitante. | Sua conta já tem um jogo salvo, e este aparelho tem outro. | "save" e "visitante" |
| `account.best` | Recordes e Pokédex juntam o melhor dos dois. | Recordes e Pokédex ficam com o melhor dos dois. | "juntam o melhor" é frase feita e não diz o que acontece |
| `account.parkedNote` | A outra fica guardada na tela inicial para você retomar quando quiser. | A outra fica guardada na tela inicial. | explica o óbvio |
| `account.otherAccount` | Este aparelho tinha o save de outra conta; ele continua guardado nela. | Este aparelho tinha o jogo de outra conta. Ele continua salvo nela. | ponto e vírgula e "save" |

### Strings sem uso (apagadas em PT e EN em 25/10)

Conferido com busca no código: nenhuma tela lê estas chaves. Os atalhos (`home.tiles.*`) viraram texto simples.

- `home.rec.*` (6): título, copa, perfeita, destaque, evolução, ícone.
- `home.tiles.*[1]`, os subtítulos dos atalhos (6), e `home.tiles.moves` (2). A Home só mostra o nome
  (`[0]`). Inclui "Ideia, elogio ou bug: conta pra gente".
- `profile.quick.*` (3): Copas, Títulos, Gols.

### Ficam como estão

- `home.tagline` ("Monte seu time com os 151 de Kanto e ganhe a Copa de Futsal."): é o exemplo de texto bom do
  próprio `copy_ia.py`.
- `help.onboarding.draftText` ("Não gostou? **Sorteie de novo**."): pergunta e resposta, mas é fala natural.
- `home.confirmNew`, `account.confirmDiscard` ("Ela some de vez."), "Bora jogar", "Vem aí", `home.longCup.line`.
- Subtítulos das portas ("Taças, medalhas e números", "Pokédex, Álbum e Golpedex"): são trios, mas repetem as
  abas de cada tela.
- `home.disclaimer`: aviso legal, fica formal.

## 4. "pra" no lugar de "para" (aplicado em 25/10)

Toda preposição "para" dos textos PT do jogo virou "pra" (com contração: "para o" → "pro", "para os" → "pros",
"para a" → "pra"): 65 trocas em `src/i18n/pt/*.ts` e no `MOVE_EXPLAIN` (`src/engine/moves.ts`). A ajuda de itens
agora cita o botão como ele é ("Passar pra outro"). EN e chaves não mudaram.

Ficaram como "para":

| Onde | Texto | Por quê |
|---|---|---|
| `commentary.ts` `charge` | "{w} para e começa a carregar…" | verbo parar |
| `commentary.ts` `coins` | "todo mundo para pra olhar" | o primeiro é o verbo parar (o segundo virou "pra") |
| `commentary.ts` `timeout` | "A quadra para na próxima bola parada." | verbo parar |
| `longCup.ts` `fisio` | "Ninguém para." | verbo parar |
| `match.ts` `timeoutHint` | "Para quando a bola parar" | verbo parar |
| `match.ts` (fala da Equipe Rocket) e `common.ts` `link.rocket.desc` | "Prepare-se para encrenca…" / "Preparem-se para encrenca!" | lema da Equipe Rocket na dublagem oficial |
| `src/engine/links.ts` (`rocket`) e `src/engine/formations.ts` (`ferrolho`) | descrições do motor | não aparecem na tela (a tela lê o `common.ts`) |
| `src/cloud/cloud.ts` `signOut` | erro "Não deu para salvar na nuvem antes de sair" | não aparece na tela (a tela mostra `settings.data.signOutFailed`) |

Textos legais (`home.disclaimer`, privacidade e termos) e créditos não tinham "para".

## 5. Bloco 2: Draft, escalação e cartas (376 strings)

Só onde há melhora real. **Aplicado em 25/10; 2 e 8 recusados** (ficam com o texto original; o 2 mantém o "pra"). O EN acompanhou onde tinha o mesmo defeito (1, 3, 4, 5, 7, 11, 12, 13, 14, 18); no 3 o número foi conferido em `TACTIC_MODS` e vale nos dois idiomas.

| # | Chave | Hoje | Proposta | Por quê |
|---|---|---|---|---|
| 1 | `team.lineup.title` | Escalação — {team} | Escalação · {team} | travessão (achado do verificador) |
| 2 | `team.lineup.swapHint` | Toque em dois jogadores pra trocá-los de vaga (inclusive com o banco). | Toque em dois pra trocar de vaga, inclusive com o banco. | "trocá-los" é língua escrita; parêntese |
| 3 | `team.lineup.tacticDesc.balanced` | Passe e posicionamento um pouco melhores (+3%), sem cansar mais. | Passe e leitura +4%, desarme +3%. Não cansa mais. | o texto está errado: o motor dá +4% em passe e leitura e +3% em desarme (`TACTIC_MODS`), e o atributo se chama Leitura |
| 4 | `team.lineup.tacticDesc.counter` | Pivô espera lá na frente; passes e arrancadas mais rápidos. | O pivô espera na frente. Passe e velocidade +2%. | ponto e vírgula; com o número fica igual ao Equilibrado (motor: +2% em passe e velocidade) |
| 5 | `team.lineup.lockedNote` | Partida em andamento: escalação e tática ficam travadas até o apito final. | Escalação e tática travadas até o apito final. | dois-pontos de anúncio; "partida em andamento" é óbvio, você está nela |
| 6 | `team.lineup.storySynEmpty` | Duplas famosas (Mew + Mewtwo, Equipe Rocket…) ficam mais fortes juntas e fazem combos. | Escale duplas famosas, como Mew e Mewtwo, pra ganhar bônus e combo. | parêntese com lista; Equipe Rocket é trio; fica no mesmo molde do aviso de tipo logo acima |
| 7 | `team.lineup.giveHint` | Toque em quem recebe {item} (quem já tem item troca com ele). | Toque em quem recebe {item}. Se ele já tiver item, os dois trocam. | parêntese explicativo |
| 8 | `team.lineup.abandonConfirm` | Abandonar esta copa? O time será perdido. | Abandonar esta copa? O time some de vez. | passiva de formulário; igual ao "Ela some de vez." da copa guardada |
| 9 | `team.lineup.cornerDesc.area` | Bola alta na área: os grandões e fortes disputam no alto. | Bola alta na área pros grandões disputarem. | "alta… no alto" repete; dois-pontos |
| 10 | `team.lineup.cornerDesc.mixed` | O time varia a jogada pelo elenco que tem. | Varia a jogada conforme o elenco. | "pelo elenco que tem" soa truncado |
| 11 | `team.lineup.cornerTakerOff` | {name} não está em quadra: cobra o automático. | {name} está fora de quadra. Vale o automático. | "cobra o automático" parece que ele cobra |
| 12 | `team.card.tipMvpOne` e `tipMvp` | MVP {n}: craque da partida {n} vezes. Carta com +{bonus} em tudo. | MVP {n}: craque da partida {n} vezes. +{bonus} em tudo. | as outras dicas de edição acabam em "+2 em tudo."; "Carta com" sobra |
| 13 | `team.modal.kindExplain.status` | Aplica um status no rival mais perto (paralisia, sono, veneno, confusão…). | Paralisa, faz dormir, envenena ou confunde o rival mais perto. | "aplica um status" é palavra de sistema; parêntese com lista |
| 14 | `team.inspect.buffed` | Reforçado por um golpe (atributos acima do normal) | Reforçado por um golpe | o parêntese explica o óbvio (o `debuffed` do lado já é assim) |
| 15 | `team.inspect.aerialHint` | Força, tamanho e posicionamento: quem ganha a disputa no alto do escanteio. | Força, tamanho e leitura decidem a bola alta no escanteio. | dois-pontos; "posicionamento" se chama Leitura no jogo |
| 16 | `team.inspect.ditto` | Ditto (Transformar): virou {name} nesta partida e não evolui. | Ditto (Transform): virou {name} nesta partida e não evolui. | golpe com o nome oficial em inglês |
| 17 | `team.inspect.back` | Voltar à partida | Voltar pra partida | a mesma ação na escalação já é "Voltar pra partida" |
| 18 | `common.formation['4-0'].description` | Sem pivô: os quatro giram de lugar, passam e correm. | Os quatro giram de lugar, passam e correm. | "Sem pivô:" repete a etiqueta "−Sem pivô" logo embaixo |

### Ficam como estão

- `team.evolution.evolving` e `evolved` ("O quê? {name} está evoluindo!", "Parabéns! {name} evoluiu pra {into}!"): é
  a fala dos jogos.
- Dicas do draft (`hintCaptain`, `hintOptions`, `tip`, `autoAsk`): curtas e faladas.
- Nomes e combos das sinergias de história, nomes das formações, Ícones, tipos, posições e atributos: nomes.
- `kindTcg.flavor` e `kindExplain.flavor` ("Não faz nada… ou faz?", "…mas a torcida adora."): humor de fã pontual.
- Notas do corpo (`common.body`): rótulo curto, já no padrão.

## 6. Bloco 3: Partida, HUD, técnico e letreiros (372 strings)

**Aplicado em 25/10, as 16** ("ok 1-16"). Os nomes de efeito do golpe máximo que não são nome de golpe (Dois canhões,
Voo em chamas, Bola que curva…) ficam. O EN acompanhou onde tinha o mesmo defeito (1, 3, 4, 5, 7, 8, 16).

- **5 e 6:** número conferido de novo no motor: o pedido de tempo soma 0,05 ao fôlego de cada jogador de quem pediu e
  0,03 aos do rival (`AGENCY.timeoutEnergy` e `timeoutRivalEnergy`, aplicados em `applyDeadBallAgency`, teto 100%).
- **3:** a dica do intervalo virou a função `htTip` no `HalftimePanel` (sem a condição do cansado), com teste em
  `halftime-tip.test.ts`.
- **9 a 11, nome oficial do golpe em inglês no resto do PT:** além das assinaturas do `maxFx` (Hyper Beam, Blizzard,
  Dream Eater, Metronome, Transform) e dos letreiros TRANSFORM! e SUBSTITUTE!, a descrição do Imposter do Ditto
  (`src/engine/data.ts`) trocou "Transformar:" por "Transform:". A narração já usava os nomes em inglês. Ficam:
  "transformado" e "nevasca" como palavra comum (no `MOVE_EXPLAIN` do Blizzard, que é do bloco 6), e as assinaturas
  inventadas (Pancada do Snorlax, Voo em chamas, Estrela de fogo, Raio em cadeia, Telecinese, Tsunami…).

| # | Chave | Hoje | Proposta | Por quê |
|---|---|---|---|---|
| 1 | `match.reload` | A quadra não carregou — recarregar | Recarregar a quadra | travessão (achado do verificador); o botão aparece quando a quadra demora (`sceneSlow`), não só quando falha |
| 2 | `match.finalPressureHint` | Quem perde nos últimos 3 minutos ataca com tudo (vale pros dois times) | Nos últimos 3 minutos, quem está perdendo ataca com tudo. Vale pros dois times. | parêntese explicativo; os 3 minutos conferem (`FINAL_PRESSURE.lastMinutes`) |
| 3 | `match.ht.tipTired` | {name} está cansado: talvez seja hora de trocar. | (sai; a dica cai na próxima regra) | abaixo de 40% de fôlego, o intervalo mostra o mesmo jogador três vezes: "Mais cansado" no quadro, esta dica e o botão "{name} com {p}% de fôlego: trocar?". Sem troca sobrando, manda trocar sem poder. Tira 1 condição no `HalftimePanel` |
| 4 | `match.ht.tipEven` | Jogo aberto. Siga assim ou mude algo. | Ainda tem o 2º tempo inteiro. | aparece sempre que você não está na frente, perdendo inclusive, e aí "jogo aberto" fica errado; "mude algo" não diz nada |
| 5 | `match.agency.timeoutHint` | 1 por tempo. Para quando a bola parar: descansa e faz trocas | 1 por tempo, na próxima bola parada. Seu time recupera 5% de fôlego e o rival, 3%. | "Para… parar" ecoa; "descansa" sem número (motor: +5% pra quem pede, +3% pro rival, `AGENCY.timeoutEnergy`); troca dá pra fazer a qualquer hora |
| 6 | `match.agency.timeoutPanel.sub` | Seu time descansa um pouco. Troca e posições valem agora. | Seu time recupera 5% de fôlego. Trocas e posições entram na hora. | "um pouco" vago; o mesmo número do 5 |
| 7 | `match.agency.maxHint` | Enche com os lances do time. Cheia, acende na hora do chute do capitão (no gol: no chute do rival). Atalho: M. | Enche com os lances do time. Acende já no N1, quando o capitão chega com a bola perto do gol. Capitão goleiro: quando o rival chega. Atalho: M. | ficou errado com os 3 níveis: acende com 1 gomo, não com a barra cheia (`maxCue`, botão aceso com `level >= 1`); com capitão goleiro acende quando o rival tem a bola na zona, não no chute; parêntese |
| 8 | `match.agency.pens.keep` | Pela ordem do chute | Melhor chute primeiro | "ordem do chute" lê como a ordem de bater; o motor ordena pelo atributo Chute (`penaltyTakers`) |
| 9 | `match.agency.maxFx` (assinaturas) | Hiper Raio, Nevasca, Come-sonho, Metrônomo (e o grito "Metrônomo!"), Transformação | Hyper Beam, Blizzard, Dream Eater, Metronome (e "Metronome!"), Transform | é o nome do golpe traduzido; golpe vai com o nome oficial em inglês (o EN já usa; o bloco 2 fez "Ditto (Transform)") |
| 10 | `battle.transformBig` | TRANSFORMAR! | TRANSFORM! | nome do golpe, como no 9; o infinitivo gritado soa estranho |
| 11 | `battle.substitutePop` | SUBSTITUTO! | SUBSTITUTE! | nome oficial do golpe; num jogo de futsal "SUBSTITUTO!" na cabeça do jogador parece substituição (a linha do lado já fala do boneco) |
| 12 | `battle.line.blind` | {m} de {w}: o rival não acerta mais nada! | {m} de {w}: a precisão do rival caiu! | exagero: o erro do rival dobra por 6 s (Sand Attack) ou vale só no próximo chute (Kinesis) (`T.blind`); "a precisão caiu" é a fala dos jogos |
| 13 | `battle.line.bideStored` | {w} solta o Bide (guardou {n} pancadas)! | {w} guardou {n} pancadas e solta o Bide! | parêntese |
| 14 | `battle.line.coins` | Chuva de moedas: todo mundo parou pra olhar! | Chuva de moedas! Os rivais perto param pra olhar! | só os rivais a até 3 m param (`T.coinRadius`); "todo mundo" está errado |
| 15 | `battle.haze` | A névoa do Haze limpa tudo em volta! | O Haze limpa tudo em volta! | "névoa do Haze" explica o nome do golpe (Haze já é névoa) |
| 16 | `match.courtLab.win` e `lose` | Se ganhar / Se perder | Se você perder / Se você ganhar | "Se ganhar" parece você, mas a fala embaixo é a do treinador ganhando (`win` = o líder ganhou); `?lab=quadras` é público |

### Ficam como estão

- Falas de evolução (`battle.evolving`, `evolved` e as do rival): fala dos jogos.
- `battle.line.focusBug` ("…como na Gen 1!") e `noRecharge`: humor de fã pontual, e o Hyper Beam sem recarga é
  regra da Gen 1.
- Nomes de efeito por tipo (`maxFx` de Normal a Fairy): descrevem o efeito, não são o golpe. "Terremoto" fica
  como palavra comum.
- `ht.tipShots`, `tipPossession`, `tipAhead`, `flyGkHint`, os pops e as faixas (`GOL!`, `QUE DEFESA!`,
  `NA TRAAAVE!`): curtos e com cara de transmissão.
- `highlightsHint`, `cornerHint`, as dicas da prancheta (`board.hint*`): claras; mexer só encurtaria.

## 7. Bloco 4: Narração (160 strings)

Propostas, esperando o ok. Só onde há melhora real; fatos conferidos no motor. Os golpes na narração já estão todos
com o nome oficial em inglês. O EN acompanha onde tem o mesmo defeito (1, 6, 7, 8, 11); no 2, 4, 5 e 10 o EN já é
assim.

| # | Chave | Hoje | Proposta | Por quê |
|---|---|---|---|---|
| 1 | `fulltimeDraw` | Fim de jogo! {score} — vamos pros pênaltis! | Fim de jogo! {score}. Vamos pros pênaltis! | travessão (achado do verificador) |
| 2 | `status.seed` | {x} ficou semeado (perde fôlego aos poucos)!{by} | {x} foi semeado!{by} Vai perdendo fôlego aos poucos. | parêntese explicativo; com o golpe no fim saíam dois parênteses seguidos: "…aos poucos)! (Leech Seed)" |
| 3 | `special.rage` | {w} fica com RAIVA! Cada pancada deixa mais forte! | {w} fica com RAIVA! Quanto mais apanha, mais forte fica! | "deixa mais forte" sem objeto soa truncado; confere no motor (cada pancada sofrida soma, até 3: `onHurt`, `T.rageMax`) |
| 4 | `trait.blindMany` | {m} de {w}: {n} rivais sem mira! | {m} de {w}: a precisão de {n} rivais caiu! | exagero: o erro do alvo dobra por uns segundos (`T.blind`); mesma fala do letreiro (bloco 3, item 12) |
| 5 | `trait.blindOne` | {m} de {w}: {tg} perde a mira! | {m} de {w}: a precisão de {tg} caiu! | idem |
| 6 | `trait.guard` | {tg} bate e volta: {w} está protegido ({m})! | {tg} tenta o desarme, mas o {m} protege {w}! | parêntese; a linha sai quando o desarme bate no Withdraw, Acid Armor, Clamp ou Skull Bash carregando |
| 7 | `trait.typeCopy` | {w} usa Conversion e vira do tipo de {tg}! | {w} vira do tipo de {tg}! | sai logo depois de "{w} usa Conversion!" no mesmo lance; o golpe aparecia duas vezes seguidas |
| 8 | `trait.coins` | Pay Day de {w}: chuva de moedas e todo mundo para pra olhar! | Pay Day de {w}: chuva de moedas e os rivais perto param pra olhar! | só os rivais a até 3 m param (`T.coinRadius`), como no item 14 do bloco 3 |
| 9 | `haze` | {x} solta Haze: a névoa limpa {n} Pokémon em volta! | {x} solta Haze e limpa {n} Pokémon em volta! | "a névoa" explica o nome do golpe, como no item 15 do bloco 3 |
| 10 | `debuffMiss` | {w} usa {m}, mas não surte efeito. | {w} usa {m}... mas falhou! | "não surte efeito" é língua escrita; "But it failed!" é a fala dos jogos (o EN já usa) |
| 11 | `timeout` | Tempo pedido pelo {team}: todo mundo na beira da quadra. | {team} pede tempo! Todo mundo na beira da quadra. | passiva de formulário; a do técnico rival logo abaixo já é "{leader} pediu tempo!" |

### Ficam como estão

- Gritos de gol, chutes, defesas, trave e pra fora (`shouts`, `shots`, `saveCaught`, `post`, `wide`…): cara de
  transmissão, curtos.
- Humor de fã: `focusBug`, `noRecharge`, `flavor` ("A torcida não entendeu nada."), `roarMiss`, os dois `splash`.
- `rageUp` ("({n}/3)"): o parêntese é o placar da fúria, não explicação.
- `corner` ("Jogada: {play}."): o nome da jogada vem com maiúscula (Na área, Curta); no meio da frase ficaria pior.
- `olympic` ("…faz a curva no vento!"): confere, o gol olímpico só sai com Gust ou Whirlwind.
- `penaltyMissed` ("{gk} defende!"): confere, pênalti perdido é sempre defesa na tela.
- `maxMiss` ("a barra volta pela metade"): confere (`AGENCY.maxRefund` = 0,5).
- `stoppage` ("Acréscimos: +{min}"), `status` (ficou paralisado, confuso, hesitante…), falas do técnico rival:
  claras; mexer só encurtaria.
