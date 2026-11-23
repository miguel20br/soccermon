---
description: Pesquisa de sinergias secretas e animações personalizadas (o que já existe, referências, catálogo de 26 sinergias e 20 animações, registro de descobertas) com opções e decisões.
---

# Sinergias secretas e animações personalizadas (pesquisa, 18/11/2026)

O que os jogadores disseram ao Miguel: o que mais curtem são **animações personalizadas, sinergias secretas,
animações e tal**. Ele quer planejar uma leva disso. **Só pesquisa: nenhum código mudou.** As decisões estão no fim.

Como foi feita: leitura de `src/engine/links.ts`, `synergy.ts`, `modifiers.ts`, `match.ts` (`comboLink`), `state.ts`
(eventos), `signature-moves.ts`, `src/game/walkout-plan.ts`, `cinematics.ts`, `cine.ts`, `n3-story.ts`,
`animation-manager.ts` + `src/data/pmd-anims.json`, `src/game/scenes/MatchScene.ts` (eventos `combo`, gol,
comemoração), `src/ui/dev-demo.ts`, `src/store/missions.ts`, `src/store/ultimate/chemistry.ts`,
`src/ui/components/{LinkChips,CardModal,FormationBoard}.tsx`, `src/store/title-codes.ts` e da pasta `public/assets/`;
web (fontes no fim; a cota de busca acabou no meio, então os fatos de Pokémon estão marcados **(do jogo/anime, sem
fonte)** quando vêm de memória).

## Resumo em 6 linhas

1. Já temos **14 sinergias de história** (`LINKS`), todas **à vista** (carta, ajuda, chips). Muitas das óbvias já
   existem: Pássaros, Hitmon, Eeveelutions, Fósseis, Brock, Misty, Rocket, Time do Ash. O catálogo novo foge delas ou
   é o "degrau secreto" de cima delas.
2. Hoje todo combo usa **a mesma animação** (letreiro amarelo com o nome, `COMBO!` sobre os dois, grito). Cada
   sinergia ganhar o seu toque próprio é o ganho mais barato e mais visível.
3. "Secreto" hoje é pouco: Pokédex e laboratório de golpes escondem o que você não viu, o ovo esconde a espécie, os
   títulos por código. Não existe nenhuma sinergia escondida nem easter egg em campo.
4. As referências que mais casam: **Hades** (duo boons de dois deuses, com o Códex mostrando o que falta),
   **Balatro** (mãos secretas que só aparecem na lista depois de jogadas), **Inazuma/Tsubasa/Naruto Storm** (técnica
   combinada de dupla com cena própria) e **Smash** (provocação secreta que vira conversa num cenário certo).
5. Descoberta: sinergia secreta **liga na escalação como "???" com o número** (carta = campo) e **revela o nome na
   1ª vez que acontece em campo**, com momento longo só na 1ª vez; um **Registro de Sinergias** guarda as
   descobertas, com charada pra quem falta.
6. Recomendo a opção **B em duas etapas**: primeiro só tela (registro, revelação, toques de animação, rivalidades),
   depois o efeito no motor com os números aprovados pelo Miguel.

## 1. O que já existe

### Sinergias e combos

| O quê | Onde | Como funciona |
|---|---|---|
| 14 sinergias de história | `src/engine/links.ts` → `LINKS` | Gênese (Mew+Mewtwo), Pássaros Lendários (degrau `full` com os 3), Iniciais, Time do Ash, Equipe Rocket ("Decolando de Novo"), Irmãos Hitmon, Casal Nido, Eeveelutions, Fósseis, Instinto Materno, Trio Elemental, Time do Brock, Time da Misty, Canção de Ninar. Cada `group` é uma família evolutiva; `need` famílias entre os titulares; bônus de +4% a +8% em tudo |
| Cálculo | `computeLinks`, `linkFactor` (links.ts) | O titular pega o maior bônus entre as sinergias dele; soma com a de tipo sem teto (`modifiers.ts`, Miguel 04/11) |
| Combo em campo | `comboLink` + `kick` em `src/engine/match.ts` (~l. 394 e 1138) | Passe de um membro, chute do outro em até 4 s = chute 20% mais forte e mais preciso, 1 por sinergia por tempo (`combosUsed`). Emite `{ type: 'combo', by, partner, link }` |
| Combo na tela | `MatchScene.ts` `case 'combo'` (~l. 4164) | `COMBO!` sobre os dois, grito de quem chuta, linha na caixa de batalha e, no modo cinema, `cine.drama(NOME DO COMBO)`. **Igual pra todas** |
| Narração | `src/ui/commentary.ts` `case 'combo'` | Uma fala com o nome do combo |
| Aura | `FormationBoard.tsx` | Sinergia `special` completa (Gênese, Pássaros, Iniciais): as cartas brilham juntas na prancheta |
| Sinergia de tipo e monotipo | `src/engine/synergy.ts` | 2/3/4 do tipo = +3/6/8%; monotipo 5/6/7 = +12/16/22% |
| Onde aparece | `LinkChips.tsx` (chips e `newLinks` no draft), `CardModal.tsx` (`linksOf`: "pode entrar em"), `src/ui/help/content.ts` (lista inteira), `store/ultimate/chemistry.ts` (`nearLinks`: o que falta) | Tudo à vista: dá pra planejar tudo pela ajuda |
| Missões ligadas | `src/store/missions.ts` | Coleções (`colIniciais`, `colPassaros`, `colBrock`…) e a missão `rocket` (ganhar com a sinergia dá o título "decolando") |
| Textos | `src/i18n/{pt,en}/common.ts` (`links.<id>`), `battle.ts` (`comboPop`, `combo`, `comboSub`) | PT e EN |

### Animações próprias

| O quê | Onde | Observação |
|---|---|---|
| Golpe máximo N3 por tipo + 12 assinaturas | `src/engine/signature-moves.ts` (`MAX_SIGNATURE`), `src/game/n3-story.ts` (`N3Story`) | Cada tipo deixa a marca no voo da bola (brasa, espuma, raio, cristais, serpente do Dragão); 12 espécies com toque próprio (Hyper Beam, roleta do Metronome…) |
| Cut-in de retrato | `src/game/cinematics.ts` `superCutIn`, `superBanner`, `superScene`, `maxTag` | Já é o cut-in estilo Inazuma, com retrato PMD e listras na cor do tipo |
| Kit de cinema | `cinematics.ts` (`spotlight`, `slowMotion`, `punchIn`, `duel`, `setPieceBanner`, `drama`) e `cine.ts` (`TypeFx` com partículas dos 16 tipos, `shockwave`, `crack`, `speedLines`, `lightTrail`, `impactFrame`, `crowdFlash`) | Dá pra montar quase tudo do catálogo daqui |
| Duelo da bicuda | `cinematics.ts` `duel`/`duelEnd`, `?demo=bicuda` | Quadra escurece e só os dois ficam acesos: molde perfeito pra "rivais se encontram" |
| Walkout com jogada | `src/game/walkout-plan.ts` `jogadaOf` (9 jogadas: embaixadinha, bicicleta, cabeçada, drible, canhão, levita, voo, tremor, chama) e `WalkoutScene.ts` | Pelo tipo e pela forma, sempre a mesma por espécie |
| Comemoração do gol | `walkout-plan.ts` `comemoracaoOf` (pulo, giro, pose) e `goalCelebPose`; MatchScene usa no gol | 3 jeitos pela forma, dentro dos 2,5 s do `Action.Celebrate` do motor. Gol da Final solta a partícula do tipo |
| Evolução | evento `evolve`, `src/game/evolution-view.ts`, `?demo=evolucao` (`&rival=1`) | Pisca-pisca dos jogos, momento próprio |
| Ditto | evento `transform`, `?demo=ditto` | Ditto vira o melhor do rival |
| Cerimônia | `src/game/ceremony.ts` (`taca`, `invasao`) | Taça e invasão de campo |
| Virada, Charanga, Pressão final | `src/game/virada.ts`, `?demo=virada`, `?demo=charanga`, `?demo=acrescimos` | Música e letreiro |
| Dribles com nome | `?demo=dribles&tipo=lambreta\|roleta\|elastico\|chapeu` | |
| Líderes | `?demo=lider&clube=<id>` | VERSUS com fala e quadra do ginásio |

### O que temos de material

- **Sprites PMD** (`src/data/pmd-anims.json`): as 151 têm `Idle`, `Walk`, `Attack`, `Hop`, `Hurt`, `Charge`, `Swing`;
  149 têm `Shoot`; só **30 têm `Pose`** e 27 têm `Trip`. Nada de `Sleep`, `Eat`, `Dance`, `Sing` no pacote: puxar do
  SpriteCollab é trabalho à parte.
- **Retratos PMD com emoção** (`public/assets/portraits/`, 1.639 arquivos): ~120 espécies com 13 emoções
  (`happy`, `angry`, `determined`, `shouting`, `crying`, `dizzy`, `surprised`…). Dá pra fazer cut-in de dupla com
  expressão certa sem desenhar nada; quem não tem retrato cai no sprite.
- **Treinadores** (`public/assets/trainers/`, 47): Ash, Misty, Brock, Red, Blue, Oak, Giovanni, os 8 líderes, a
  Elite dos 4, Rocket, Enfermeira Joy (`nurse`), Bill… (sem Oficial Jenny).
- **Efeitos** (`public/assets/fx/`, 48): coração, pena, osso, punho, pé, raio, folhas, pétala, lua, bolas de fogo e gelo…
- **Gritos** de todas e a pasta `retro/` (visual Game Boy).

### O que é "secreto" hoje

- Pokédex esconde o tipo de quem você não viu (`DexTab.tsx`); `CardModal.tsx` esconde forma não vista como silhueta;
  `?lab=golpes` esconde golpe não visto (`MoveLab.tsx`); o ovo esconde a espécie até chocar (`long-events.ts`);
  títulos por código guardam só o hash (`title-codes.ts`).
- **Nenhuma sinergia escondida e nenhum easter egg em campo.** É terreno virgem.

### Um detalhe técnico que muda tudo

O gol já chega na tela com quem deu o passe (`{ type: 'goal', by, assist }` em `state.ts`), e passe, dividida,
evolução e golpe também viram eventos. Então **dá pra detectar "dupla secreta fez gol" ou "rivais se cruzaram" só na
tela**, sem tocar no motor: sem `ENGINE_VERSION`, sem republicar a `liga`, sem balanceamento, e aparece igual nos dois
lados do Duelo (os eventos são os mesmos). Efeito em campo (bônus, combo) é outra conversa: aí é motor.

## 2. Como os jogos fazem

| Jogo | O que o jogador decide | Como se descobre | O prazer |
|---|---|---|---|
| **TFT / Auto Chess** | Quem pôr no tabuleiro pra ativar traços (contagem 2/4/6) | Tudo à vista: o traço mostra quantos faltam. A Riot põe **descoberta** como pilar e renova os traços a cada set | Montar o time e ver o traço acender; o set novo reabre a exploração |
| **Pokémon Auto Chess** | Mesmo esquema, com tipos e classes de Pokémon | Lista de vínculos aberta | Ver o tipo virar arma (Fogo queima, Psíquico usa o golpe na hora) |
| **Hades (duo boons)** | Pegar bênçãos de dois deuses certos | O Códex mostra os pré-requisitos; a oferta não é garantida mesmo cumprindo. 28 duplas no 1, 37 no 2 | "Achei uma dupla!" e a fala dos dois deuses juntos; caçar o que falta no Códex |
| **Balatro** | Mexer no baralho pra formar mãos absurdas | **3 mãos secretas** (Five of a Kind, Flush House, Flush Five) só aparecem na lista depois de jogadas, cada uma com um planeta secreto | A lista que cresce: o jogo te conta que existia algo escondido |
| **Slay the Spire** | Montar o baralho com relíquias que se combinam | Compêndio marca o que você já viu; combos famosos são achados pela comunidade | Quebrar o jogo com uma combinação que ninguém te contou |
| **Inazuma Eleven** | Ter os dois (ou três) certos em campo e no lugar | Técnica combinada aprendida por história ou condição; no Victory Road, o quadro de Vínculos liga jogadores e aumenta o poder dos passes entre eles | Cena própria com os dois: Twin Boost (chutam um pro outro), Double Cyclone. É **a** referência de animação |
| **Captain Tsubasa** | Escalar os irmãos Tachibana juntos | No anime e nos jogos (Dream Team, Rise of New Champions) a técnica é deles | O Skylab Hurricane: um vira trampolim, o outro voa. Absurdo e reconhecível |
| **Naruto Storm** | Montar o trio com dupla canônica | Técnica secreta combinada só pra pares certos (31 no Storm 4), com barra cheia | Cena cinematográfica exclusiva dos dois; é de onde vieram nossas sinergias de história (comentário em `links.ts`) |
| **FIFA / FC** | Química pelo clube/liga/país; comemoração no botão | Comemoração assinatura: só aquele jogador faz (o "Cold" do Palmer) | Reconhecer o jogador real pelo gesto; zoar o adversário |
| **Super Smash** | Lutar com o personagem certo no cenário certo | Provocação secreta: Snake no Shadow Moses abre o Codec; Fox e Falco no Corneria conversam; Pit no templo da Palutena | Easter egg de fã: falas sobre o adversário, só pra quem sabe |
| **Marvel Snap** | 12 cartas, cada uma pesa; combos de 2–3 cartas | Cartas novas da temporada feitas pra combar com as anteriores | Baralho pequeno = cada combo é sentido; "baixa complexidade, muita profundidade" (Brode) |
| **Pokémon (anime e Gen 1)** | (o fã já sabe os pares) | Memória afetiva: Ash/Misty/Brock, Rocket, líderes, exclusivos de versão, abertura do Red e Green | Reconhecer: "olha, é a Jigglypuff com a caneta!" |

O que tirar disso:

- **Hades + Balatro**: a lista mostra que existe algo escondido ("???"), sem dizer o quê. Saber que falta é o motor
  da caça.
- **Inazuma + Tsubasa + Naruto**: dupla canônica merece **cena própria e curta**, não um letreiro genérico.
- **Smash + FC**: o easter egg vale pelo reconhecimento de fã. Barato e viraliza (clipe).
- **TFT**: sinergia que mexe no draft precisa de número visível, senão o jogador não confia nela. Por isso a secreta
  mostra "???" com o bônus.

## 3. Catálogo: 26 sinergias secretas

Legenda do efeito: **tela** = só animação, registro e fala (sem motor); **motor** = mesmo pacote das de história
(bônus pequeno em tudo + combo de passe e chute), números a definir com o Miguel pela skill de balanceamento.
"Rival" = um de cada time, sempre só tela. Números da Pokédex entre parênteses. Fatos de Pokémon **(do jogo/anime,
sem fonte)**.

| # | Nome (PT) | Gatilho | Efeito | Animação / momento em campo |
|---|---|---|---|---|
| 1 | **A Turma** | Pikachu (25) + 1 do Time da Misty + 1 do Time do Brock | motor | Ash, Misty e Brock (sprites de treinador) aparecem no rodapé; cut-in triplo com retratos `determined`; "Eu escolho você!" |
| 2 | **Monte Prateado** | Pikachu + Snorlax (143) + uma forma final inicial (3, 6 ou 9): o time do Red | motor | Neve cai na quadra por 3 s, silêncio total (música e torcida baixam), retrato do Red e só "..." |
| 3 | **Rival Azul** | 2 de Pidgeot (18), Alakazam (65), Rhydon (112), Arcanine (59), Gyarados (130), Exeggutor (103): o time do Blue | motor | Blue aparece rindo no canto: "Diga adeus!" (fala própria, não a dos jogos) |
| 4 | **Joy e Jenny** | Chansey (113) + Growlithe ou Arcanine (58, 59) | motor | Corações (`fx/heart`) e sirene do Growlithe; toca o jingle de cura do Centro (composto por nós, 5 notas) |
| 5 | **Abertura de Red e Green** | Rival: Gengar (94) x Nidorino (33) na mesma dividida | tela | A abertura do Game Boy: fundo listrado em paleta `retro/`, Gengar pula, Nidorino investe, 2 s |
| 6 | **Abertura do Yellow** | Rival: Pikachu x Jigglypuff (39) | tela | Mesma cena retrô com o par do Yellow |
| 7 | **Revanche de Vermilion** | Rival: Pikachu x Raichu (26) | tela | Duelo da bicuda (`cine.duel`): quadra escurece, só os dois acesos, raios trocados; Lt. Surge no canto |
| 8 | **Inveja do Meowth** | Rival: Meowth (52) x Pikachu | tela | Meowth leva choque e sai voando como estrela piscando ("Decolando de novo") |
| 9 | **Clone Contra-Ataca** | Rival: a mesma espécie nos dois times (espelho) | tela | Os dois se encaram, tela divide no meio, sombra roxa (o filme do Mewtwo) |
| 10 | **Flauta Pokémon** | Snorlax + Jigglypuff ou Clefairy (35) | motor | A canção toca e o Snorlax, que dorme em campo, acorda de um pulo (nos jogos ele só sai do caminho com a flauta) |
| 11 | **Slowbro** | Slowpoke (79) + Shellder (90) | motor | No combo, o Shellder salta e morde a cauda do Slowpoke; "MORDIDA!" e o Slowpoke brilha |
| 12 | **Mestre e Aprendiz** | Forma base + forma final da mesma família (Charmander + Charizard, Magikarp + Gyarados…) | motor | A forma final faz o passe e dá a pose de aprovação (`Pose`/`Hop`) quando a base marca. Vale pra ~30 famílias de 2+ estágios |
| 13 | **Família Completa** | Os 3 estágios da mesma família (Bulbasaur, Ivysaur, Venusaur) | motor | Os três em fila, o pisca-pisca da evolução ao contrário (final → base); Squirtle ganha os óculos do Esquadrão Squirtle |
| 14 | **As 4 Pokébolas** | Bulbasaur, Charmander e Squirtle na forma base + Pikachu (a 4ª bola do Carvalho) | motor | Prof. Carvalho e 4 Pokébolas abrindo; degrau secreto acima de Iniciais |
| 15 | **Irmãos Eevee** | Eevee (133) + Vaporeon, Jolteon e Flareon | motor | 4 quadros de quadrinho, um retrato por quadro (episódio dos irmãos Eevee); degrau secreto acima de Eeveelutions |
| 16 | **Museu de Pewter** | Os 3 fósseis juntos: Omanyte, Kabuto e Aerodactyl (nos jogos você escolhe Hélice **ou** Domo) | motor | A quadra vira pedra rachada (`crack`), ossos (`fx/bone`) sobem; degrau secreto acima de Fósseis |
| 17 | **Jardim de Celadon** | 2 de Victreebel (69–71), Tangela (114), Vileplume (43–45): o time da Erika | motor | Chuva de pétalas (`fx/petal`), Erika no canto |
| 18 | **Ninjas de Fuchsia** | 2 de Koffing/Weezing (109–110), Grimer/Muk (88–89), Venomoth (48–49): o time do Koga | motor | Bomba de fumaça, quem chuta some e reaparece na frente do gol |
| 19 | **Mente de Saffron** | 2 de Abra/Kadabra/Alakazam (63–65), Mr. Mime (122), Venomoth: o time da Sabrina | motor | A colher do Kadabra entorta e a bola faz a curva (jogada `levita`) |
| 20 | **Quiz de Cinnabar** | 2 de Growlithe/Arcanine, Ponyta/Rapidash (77–78), Magmar (126): o time do Blaine | motor | Placa de quiz: "Pergunta: quem marca? Resposta: GOL!" e chão em brasa |
| 21 | **Chefe Giovanni** | Persian (53) + Nidoking ou Nidoqueen + Rhydon ou Dugtrio (51) | motor | Giovanni no canto acariciando o Persian; se o Meowth estiver no time, ele bufa de ciúme |
| 22 | **Gelo de Lorelei** | 2 de Dewgong (86–87), Cloyster (90–91), Slowbro (80), Jynx (124), Lapras (131) | motor | A quadra congela por onde a bola passa (rastro de gelo do N3 reaproveitado) |
| 23 | **Punhos do Bruno** | Machamp (66–68) + Hitmonlee ou Hitmonchan + Onix (95) | motor | Socos e chutes (`fx/fist`, `fx/foot`) cruzando o caminho da bola; Bruno no canto |
| 24 | **Torre Pokémon** | 2 de Gastly/Haunter/Gengar (92–94), Golbat (41–42), Arbok (23–24), Cubone/Marowak (104–105): Agatha + o fantasma da Torre | motor | A luz apaga, só olhos acesos, e o Silph Scope "revela" quem chutou |
| 25 | **Dragões do Lance** | Dratini/Dragonair/Dragonite (147–149) + Gyarados ou Aerodactyl | motor | A serpente do Dragão (do N3) circula a quadra; Lance no canto |
| 26 | **Cabo Link** | Um par de exclusivos de versão no mesmo time: Scyther (123) + Pinsir (127), Ekans + Sandshrew (27), Oddish (43) + Bellsprout (69), Growlithe + Vulpix (37), Mankey (56) + Meowth | motor | Um cabo de Game Boy em pixel liga os dois sprites e pisca "TROCA!"; no time rival vira **Clássico de Versão** (tela) |

Notas do catálogo:

- **Sem repetir o que existe:** 14, 15 e 16 são o degrau secreto de cima de Iniciais, Eeveelutions e Fósseis (como o
  `full` dos Pássaros); o resto é novo. Brock e Misty já têm sinergia, por isso entram juntos só em "A Turma".
- **Sobreposição:** um Pokémon pode estar em várias (o Koffing está na Rocket e no Koga); o motor já pega só o maior
  bônus por titular, então empilhar não vira bola de neve.
- **Raridade de propósito:** 12 e 13 acontecem bastante (servem de primeira descoberta); 2, 14, 15 e 16 são raras
  (merecem a cena longa).
- **Rivalidades (5 a 9 e o Clássico de Versão)** acontecem contra o rival, então são sempre só tela: nada no time do
  jogador muda.

## 4. Catálogo: 20 animações personalizadas

Custo: **P** = monta com o que já existe (kit de cinema, retratos, fx, anims PMD), 1 dia ou menos; **M** = precisa de
código de cena novo ou um asset pequeno, 2–3 dias; **G** = asset novo em quantidade, pipeline ou mexe no tempo do motor.

| # | Animação | Quando | O que usa | Custo |
|---|---|---|---|---|
| 1 | **Cut-in de dupla** (Inazuma): dois retratos entram de lados opostos e se cruzam, nome da técnica no meio | Combo de sinergia (todas) | `superCutIn` x2, retratos `determined`/`shouting`, cor dos dois tipos | P |
| 2 | **Passe combinado**: a bola deixa rastro nas duas cores de tipo, câmera lenta curta e zoom no chute | Combo | `lightTrail`, `TypeFx`, `slowMotion`, `punchIn` | P |
| 3 | **Toque próprio por sinergia**: neve, pétalas, fumaça, brasa, gelo, olhos no escuro, serpente | Combo da sinergia (17–25, 2) | Partículas do `TypeFx`, chão do `n3-story`, `cine.dim` | P cada |
| 4 | **Treinador no canto**: sprite do treinador entra no rodapé com uma fala curta | Combo das sinergias de treinador (1–3, 17–25) | `public/assets/trainers` (47 sprites), caixa de fala do VERSUS | P |
| 5 | **Estrela "Decolando de novo"**: quem perde a dividida sobe girando e vira estrela piscando | Combo da Rocket, Inveja do Meowth | Tween de escala e posição, brilho | P |
| 6 | **Revelação de sinergia secreta** (1ª vez): câmera lenta, tela escurece, "SINERGIA SECRETA", silhuetas que viram os sprites, nome, jingle de "item obtido" (nosso) | 1ª vez de cada secreta | `spotlight`, `superBanner`, silhueta (tint preto) | M |
| 7 | **Duelo de rivais**: quadra escurece, só os dois acesos, letreiro do clássico | Rivalidades (7, 9) | `cine.duel`/`duelEnd`, `setPieceBanner` | P |
| 8 | **Abertura retrô**: cena de 2 s em paleta Game Boy com os dois sprites | Rivalidades 5 e 6 | `public/assets/retro`, filtro de paleta, `Attack`/`Hop` | M |
| 9 | **Comemoração por espécie** (5 primeiras): Psyduck segura a cabeça (`Hurt` em loop + "?"); Snorlax deita e solta "Z" (sem `Sleep`: gira o sprite e põe o texto); Magikarp pula no lugar ("Mas nada aconteceu"); Gengar afunda no chão e volta rindo; Pikachu solta um raio pro céu | Gol dessas espécies | `goalCelebPose` com caso por espécie, fx, gritos; dentro dos 2,5 s | P cada |
| 10 | **Rabisco da Jigglypuff**: depois do gol dela, os rivais em volta ganham rabisco de caneta no rosto até o reinício | Gol da Jigglypuff | Graphics por cima dos sprites, some no `kickoff` | M |
| 11 | **Comemoração de dupla**: quem deu o passe e quem marcou correm um pro outro e batem a mão (impacto + "TOCA AQUI") | Gol de dupla secreta | Caminho na cena durante o `Celebrate`, `Hop`, `fx/impact` | M |
| 12 | **Skylab** (Tsubasa): um vira trampolim, o outro salta sobre ele e chuta do alto | Combo de 2 sinergias escolhidas (Hitmon, Nido) | `Hop`/`Shoot`, tween de altura e escala, sombra | M (a bola já saiu: a cena tem que caber no voo) |
| 13 | **Família Completa**: os 3 estágios em fila e o pisca-pisca da evolução de trás pra frente | Sinergia 13 | `blinkSchedule` (`evolution-view.ts`) | P |
| 14 | **Cabo Link**: cabo pixel entre os dois sprites, "TROCA!" piscando | Sinergia 26 | Um desenho pequeno de cabo + linha | P |
| 15 | **Estouro dos Tauros**: 5 Tauros atravessam a quadra correndo (os 30 Tauros do Ash) | Gol do Tauros na Zona Safari (se entrar) ou easter egg raro | Sprite repetido com `Walk`, sem física | P |
| 16 | **Entrada de dupla no walkout/VERSUS**: a dupla secreta entra lado a lado e faz uma jogada combinada antes do chute no vidro | Pacote/escalação com dupla secreta | `WalkoutScene`, `jogadaOf` com par | M–G |
| 17 | **Provocação do capitão** (Smash): botão depois de gol ou defesa; o capitão faz a pose e solta a fala; na quadra do líder certo, com o Pokémon dele, vira conversa secreta com o líder | Botão do jogador (escolha dele) | `Pose`, falas do VERSUS, `trainers` | M (só tela; no Duelo, o outro lado não vê sem mexer na rede) |
| 18 | **Quiz de Cinnabar** e outros letreiros de gag por ginásio | Sinergia 20 | `setPieceBanner` com texto próprio | P |
| 19 | **Cartão "Descobri"** pra compartilhar: os dois sprites, o nome e a data | Tela de resultado depois da revelação | `Moments.tsx` (já compartilha lance) | M |
| 20 | **Anims PMD extras** (`Sleep`, `Eat`, `Dance`, `Sing`, `Laying`…) puxadas do SpriteCollab | Deixa 9, 10 e 17 bem melhores | Pipeline de sprites, `pmd-anims.json`, peso no carregamento da partida | G |

O que é caro de verdade:

- **Dois Pokémon interagindo de corpo** (Skylab, toca aqui) com o motor rodando: a cena tem que caber no tempo que o
  motor já dá (voo da bola, 2,5 s do `Celebrate`). Esticar esse tempo é motor.
- **Arte nova desenhada** (mesa do Carvalho, cabo, óculos): cada peça é pequena, mas tem que passar pela skill
  `soccermon-marca`.
- **Anims PMD extras**: pipeline e peso. Só se as comemorações pedirem.
- **Celular**: tudo isso roda numa quadra que já carrega N3, torcida e música; partículas com limite e "Reduzir
  movimento" (só aparece e some) em todas, como o `n3-story` já faz.

## 5. Como o "secreto" funciona

1. **Ligou, mas não sabe o quê.** Na escalação, a secreta aparece como chip **"???"** com o bônus (+4%) e o brilho dos
   membros. O número é visível porque carta = campo (`attributeModifiers` mostraria o bônus de qualquer jeito); o
   **nome e o desenho** ficam escondidos. É o "existe algo aqui" do Balatro.
2. **Revela em campo.** Na 1ª vez que a secreta acontece (combo, gol de dupla, rivais na dividida), entra a
   revelação longa (animação 6): câmera lenta, silhuetas, nome, jingle. Da 2ª vez em diante, só o toque próprio e o
   letreiro (regra do Miguel: só encurtar o que se repete).
3. **Registro de Sinergias.** Uma página nova no Álbum (ou na Pokédex): as 14 de hoje abertas; as secretas como
   "???", com o número de silhuetas (2 ou 3) e uma **charada curta** ("Um ronca, o outro canta"; "O original encontra a
   cópia"; "Ninguém escolhe os dois fósseis"). Contador "12/40". É o Códex do Hades.
4. **Dica vaga, dica direta.** A charada está sempre lá; uma dica direta por semana (um dos membros revelado) pode sair
   na News da segunda ou como "dupla da semana" na Copa do Dia. Opcional.
5. **Recompensa.** Medalha em degraus (5, 15, todas) e talvez um título pela última. As missões e medalhas já
   existem (`missions.ts`, `medals.ts`); o título "decolando" da Rocket é o precedente.
6. **Compartilhar.** Depois da partida, na tela de resultado: "Sinergia descoberta: Monte Prateado" com o cartão
   (animação 19). O texto de Compartilhar pode ter emoji; a tela não.
7. **Onde guarda.** Um campo novo no perfil do save (`profile.combosFound: string[]`, no padrão de `missionsDone` e
   `seen`), que sobe pra nuvem com o resto. Campo opcional com valor padrão `[]`; mesmo assim, teste com
   `scripts/fixtures/backup-v6-*.json`.
8. **Repo público.** A lista fica no código, quem ler o repo descobre. Não vale esconder: Balatro e Pokémon também
   foram descobertos por datamine, e a graça é de quem joga. Só não pôr as charadas e os nomes em lugar que vaze na
   interface antes da hora (ajuda, `CardModal`, `nearLinks` da química do UT).

## 6. Limites

- **Motor determinístico.** Secreta com efeito em campo entra em `LINKS` e passa por `comboLink`: muda resultado de
  partida, então sobe `ENGINE_VERSION`, republica a `liga` (`npm run edge:liga` + deploy) e passa pela skill
  `soccermon-balanceamento` com antes/depois (`npm run calibrate`) e ok do Miguel. Nada de `Math.random()` no motor.
  O que é só tela pode usar `Math.random()` à vontade (o `n3-story` já usa).
- **Liga e Duelo.** O efeito no motor vale igual pros dois lados (já é assim com as de história). Descoberta conta em
  qualquer partida que você vê. A provocação (animação 17) é só local; mostrar pro rival no Duelo exigiria mandar
  pela rede.
- **Sem emoji na tela.** Ícones desenhados; charadas e nomes em texto.
- **PT e EN.** Cada sinergia ganha `name`, `desc`, `combo` e a charada nos dois `common.ts`; falas de treinador
  também. Nomes podem ter flavor, descrições não (regra dos textos diretos).
- **Celular primeiro.** Cut-ins e letreiros já se ajustam ao 9:16 (`CROP_TEXT_SCALE`); conferir 320/390 em pé,
  deitado e 1440. Treinador no canto não pode cobrir o placar.
- **Nada automático no time do jogador.** Sinergia liga pela escalação que ele escolheu; o combo em campo é lance
  (como golpe), não troca nem tática. A provocação é botão dele.
- **Nada teleporta.** Chip "???" entra e o Registro abre com as transições de 200–300 ms.
- **Modo novo atrás de bandeira** (ADR 0005): o Registro e as secretas ficam escondidos até serem jogados na tela.
- **Carta = campo.** O bônus da secreta tem que aparecer igual na carta, no painel e no motor, só com o nome escondido.

## 7. Opções

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| **A. Só tela** | 10–12 secretas sem efeito (rivalidades 5–9, Cabo Link, e gol de dupla para 1, 2, 10–13), detectadas por evento na cena; revelação (6), cut-in de dupla (1), toques próprios nas 14 sinergias atuais (3, 4, 5), 5 comemorações por espécie (9), Registro com charadas, medalha | ~1 semana | Baixo: sem motor, sem `liga`, sem balanceamento. Mas sem efeito, a secreta não pesa no draft |
| **B. Secretas de verdade (em 2 etapas)** | Etapa 1 = A. Etapa 2: 12–15 secretas viram `LINKS` com `secret` (bônus +3–5% e combo reaproveitando `comboLink`), chip "???" na escalação, nomes escondidos em ajuda/carta/química; `ENGINE_VERSION` + `liga` + calibrate | ~2 semanas | Médio: números, vazamento do nome em algum canto da interface, Liga |
| **C. Temporada das Sinergias** | B com as 26, as 20 animações (Skylab, toca aqui, abertura retrô, rabisco, Tauros, entrada de dupla no walkout), provocação com conversas de ginásio, anims PMD extras, cartão de compartilhar, dica da semana | 3–5 semanas | Alto: escopo, assets, desempenho no celular e RAM da máquina pra testar |

**Recomendação: B, em duas etapas.** A etapa 1 sai rápido e já entrega o que os jogadores pediram (animação própria
e o "achei!"), sem tocar no motor. A etapa 2 dá peso no draft, que é onde a sinergia vira estratégia (lição do TFT e
do Hades), e passa pelos números do Miguel com calma. Das animações de C, pegar só as baratas que mais aparecem (1, 2,
3, 6, 9); Skylab, walkout de dupla e anims extras ficam pra uma leva depois. Calendário: 0.9.53 sai em 23/11 e o UT
abre em 27/11, então isso entra depois, numa segunda de dezembro.

## 8. Decisões pro Miguel (recomendação primeiro)

1. Começa só tela (A) e depois põe efeito no motor (B)? *Recomendo sim.*
2. Secreta tem efeito em campo igual às de história (bônus pequeno + combo)? *Recomendo sim, na etapa 2, números
   pela skill de balanceamento.*
3. Na escalação, a secreta ligada aparece como "???" com o bônus? *Recomendo sim (carta = campo; só o nome some).*
4. Rivalidades entre times (Gengar x Nidorino, Pikachu x Raichu, espelho) ficam só na tela? *Recomendo sim.*
5. Onde mora o Registro? *Recomendo uma página nova no Álbum.*
6. Charada sempre visível, e dica direta na News da segunda? *Recomendo charada sempre; dica semanal opcional.*
7. Revelação longa só na 1ª vez, depois só o letreiro? *Recomendo sim.*
8. Descobre no Duelo e na Liga também? *Recomendo sim.*
9. Recompensa: medalha em degraus; entra na platina? *Recomendo medalha sim, platina não (quem já platinou não perde).*
10. Quais entram na 1ª leva? *Recomendo: Mestre e Aprendiz, Família Completa, Monte Prateado, Joy e Jenny, Flauta
    Pokémon, Slowbro, Cabo Link, Torre Pokémon, e as rivalidades Abertura de Red e Green, Revanche de Vermilion,
    Inveja do Meowth e Clone Contra-Ataca.*
11. Quais 5 comemorações por espécie primeiro? *Recomendo Psyduck, Snorlax, Magikarp, Gengar e Pikachu.*
12. Provocação com botão? *Recomendo deixar pra depois (opção C).*

## Fontes

- TFT: [pilares de design (Riot)](https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/dev-design-pillars-of-tft),
  [aprendizados do set Arcane (Riot)](https://teamfighttactics.leagueoflegends.com/en-au/news/dev/dev-tft-into-the-arcane-learnings),
  [guia de sinergias (Dexerto)](https://dexerto.com/league-of-legends/teamfight-tactics-champion-synergy-guide-origins-classes-737400)
- Pokémon Auto Chess: [lista de vínculos (não oficial)](https://autochesspokemon.pages.dev/bonds)
- Hades: [duo boons (Prima Games)](https://primagames.com/tips/hades-what-are-duo-boons-how-get-duo-boons),
  [duo boons do Hades 2 (Rogue Ranker)](https://rogueranker.com/hades-2-duo-boons/),
  [duo boons no Hades 2 (Twinfinite)](https://twinfinite.net/guides/how-to-get-duo-boons-hades-2/?amp=1)
- Balatro: [mãos secretas (Gameranx)](https://gameranx.com/features/id/524672/article/balatro-how-to-unlock-every-secret-hand/),
  [todas as mãos (Dot Esports)](https://dotesports.com/indies/news/all-hands-in-balatro)
- Slay the Spire: [Compêndio, visto x desbloqueado (Steam)](https://steamcommunity.com/app/646570/discussions/0/1733207382031436549),
  [game breakers (TV Tropes)](https://tvtropes.org/pmwiki/pmwiki.php/GameBreaker/SlayTheSpire)
- Inazuma Eleven: [Twin Boost](https://inazuma-eleven.fandom.com/wiki/Twin_Boost),
  [Double Cyclone](https://inazuma-eleven.fandom.com/wiki/Double_Cyclone),
  [Kattobi Defense](https://inazuma-eleven.fandom.com/wiki/Kattobi_Defense),
  [Bond Link no Victory Road (Operation Sports)](https://www.operationsports.com/inazuma-eleven-victory-road-bond-link-guide),
  [Bond Link e Bond Stars (All Things How)](https://allthings.how/inazuma-eleven-victory-road-bond-link-and-bond-stars-explained)
- Captain Tsubasa: [Skylab Hurricane (wiki)](https://captaintsubasa.fandom.com/wiki/Skylab_Hurricane),
  [Skylab Triangle (wiki)](https://captaintsubasa.fandom.com/wiki/Skylab_Triangle),
  [Kazuo Tachibana no Dream Team (oficial)](https://www.tsubasa-dreamteam.com/en/character/050)
- Naruto Storm: [técnicas secretas combinadas (Prima Games)](https://primagames.com/gaming/naruto-ultimate-ninja-storm-connections-combination-secret-techniques),
  [técnicas ligadas no Storm 4 (Twinfinite)](https://twinfinite.net/ps4/naruto-shippuden-ultimate-ninja-storm-4-how-to-do-linked-secret-techniques/)
- FC: [lista de comemorações do FC 25 (GamesRadar)](https://gamesradar.com/games/ea-sports-fc/fc-25-celebrations-list),
  [guia de comemorações (Prima Games)](https://primagames.com/gaming/ea-fc-25-celebrations-guide-all-celebration-controls-and-new-celebration-animations)
- Smash: [Smash Taunt (SmashWiki)](https://www.ssbwiki.com/Smash_Taunt),
  [Codec (SmashWiki)](https://www.ssbwiki.com/Codec),
  [Palutena's Guidance (SmashWiki)](https://www.ssbwiki.com/Palutena%27s_Guidance),
  [segredos do Smash (GamesRadar)](https://www.gamesradar.com/smash-bros-secret-secrets/)
- Marvel Snap: [receita do sucesso, Ben Brode (MobileGamer)](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/),
  [onboarding e design de cartas (MobileGamer)](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)
- Pokémon (times de líderes, Elite dos 4, Red e Blue, exclusivos de versão, aberturas do Red/Green e do Yellow,
  episódios do anime): **do jogo/anime, sem fonte conferida nesta sessão** (a cota de busca acabou). Conferir na
  Bulbapedia antes de fechar os gatilhos.
