---
description: Pesquisa, rodadas de escuta e mapa tela para faixa da música do jogo (temas próprios, partidas por personagem, arquivos Opus)
---

# Música de fundo: pesquisa, amostras e proposta

21/10/2026. Pedido do Miguel: "sim, mas eu queria que você me ajudasse com isso". Hoje o jogo não tem música: só
efeitos ZzFX, gritos, apito e torcida gravados (`src/game/audio.ts`).

Regras desta pesquisa:

- Nada das trilhas dos jogos Pokémon. Nem remix, nem "arranjo de fã" de música dos jogos: a composição é da Nintendo.
- O jogo nunca cobra. A licença tem que permitir uso num jogo AGPL sem fins lucrativos, com crédito.
- O repo é público: o arquivo da música vai junto (`public/`). Licença que proíbe redistribuir o arquivo não serve.

**Amostras pra ouvir:** abra `index.html` na pasta de amostras do scratchpad (caminho no fim deste doc). A Rodada 2
vem em cima (72 faixas por tela, ★ nas que o Miguel gostou) e a Rodada 1 fica recolhida embaixo.

## Rodada 8b (22/10): Escalação mais macia, Derrota e a virada no jogo

Retorno da rodada 8: aprovou Draft, Recompensa, Vitória v2, Rota 1 v3, Mt. Moon v2, Cerulean v2, Sala v3 (jazz) e
Na ponta do pé v2 (o B que sobe no cromático, tropeça, faz "bonk" e para no silêncio: "genial", os apitos deram o
charme). Derrota aprovada, com o "toc toc" um pouco mais alto. Escalação "meio metálica demais". Virada: gostou e
perguntou como entra por cima da música que já toca. Página: `r8b-*.ogg`, velha e nova lado a lado.

| Faixa | O que mudou |
|---|---|
| Escalação | lead e terças de pulso 12,5% pra 25%, clavinete de 7,5% pra 20%, metais com ataque de 30 → 60 ms; passa-baixa suave sem ressonância por faixa (`corte` novo no `S.part`: lead 2,6 kHz, terças 2,2, metais e clavinete 1,8); chimbal e prato a 60%. Melodia e prancheta iguais. Banda acima de 2 kHz −3,2 dB, acima de 4 kHz −4 dB, acima de 8 kHz −3,8 dB (relativo ao total, mesmo volume) |
| Derrota | bloco de madeira com ganho 1,2 → 1,9 (~+4 dB) |
| Virada na pressão | `virada-pressao`: a mesma vinheta meio tom acima (Dó) e a 144 BPM, o tom e o andamento do trecho `pressao`. A `virada` sai idêntica à aprovada |

A 1ª tentativa da Escalação baixou o `filter` do ZzFX e ficou mais brilhante (a banda de 2 a 4 kHz subiu): esse
filtro ressoa no corte. Daí o `corte` por faixa no sequenciador (padrão desligado; a Abertura com gancho sai idêntica,
conferido amostra a amostra).

**Conferido pelos números:** as aprovadas re-renderizadas saem idênticas às que ele ouviu (PCM igual: Draft,
Recompensa, Vitória, Rota 1, Mt. Moon, Cerulean, Sala, Na ponta do pé, Eliminado v4, Virada). Escalação `--rms`:
lead 0,149, metais 0,086, clap 0,033, chimbal 0,015. O que só o ouvido dele decide: se a Escalação ficou quente o
bastante sem perder o "disco tenso".

## Rodada 8 (22/10): as telas sem música e os extras

Pedido: música pro Draft, Escalação, Recompensa e Resultado (vitória, derrota, eliminado), mais a vinheta da virada
no placar (aprovada) e as peças antigas sem tela levadas pra régua do Tema da Rocket. Página: `r8-*.ogg`.

| Tela | Peça | O que é |
|---|---|---|
| Draft | `draft` (nova) | Fá maior, 108 BPM, funk leve. Assinatura: as três cartas (sinos em 3-3-2, esquerda/meio/direita, com "flip" de carta; o baralho embaralha na virada). Flauta pergunta, pizzicato responde; SOC-CER-MON no fim do B; ½ tom acima no fim. Loop de 73 s |
| Escalação | `escalacao` (Vestiário polido) | o Vestiário (aprovado) com lead × metais, SOC-CER-MON em Mi menor, clap 808, parte só de groove, ½ tom acima. Assinatura: a prancheta (5 peças magnéticas). Loop de 68 s. O Vestiário original pode ficar no intervalo |
| Recompensa | `recompensa` (nova) | primo do Draft a 124 BPM, groove cheio, SOC-CER-MON em sequência. Loop de 31 s |
| Vitória | `vitoria-gancho` | a v1 com o SOC-CER-MON e o clap 808 no lugar da subida; mesmo tamanho (~6,5 s com rabo) |
| Derrota | `derrota` (nova) | ~3,6 s: o gancho murcho em Lá menor, para no Mi maior (bola pra frente) |
| Eliminado da copa | `eliminado` (v4, sem mudança) | ele achou a v3 perfeita |
| Virada no placar | `virada` (nova) | Si, 133 BPM (2º tempo, nível 2): escala de blues nos metais, SOC-CER-MON em Si maior, fecha num Si sem terça. Na pressão (Dó dórico): `shift: 1` |

Extras (propostas de tela): `extra-rota-1` (mapa, Rota 1), `extra-mt-moon` (mapa, Mt. Moon), `extra-cerulean`
(mapa, Cerulean), `extra-sala` (Sala de troféus), `extra-cutscene-boba` (cenas bobas do Modo história). Cada uma
ganhou pergunta e resposta, SOC-CER-MON e ½ tom acima na volta final; as originais ficam como estão.

**Conferido pelos números:** `--rms` com percussão abaixo do lead em todas e baixo entre 59% e 78% do lead;
`loops.mjs` 8 loops, 0 falhas (emendas: Draft 0,02, Escalação 0,08, Recompensa 0,05, Rota 1 0,17, Mt. Moon 0,31,
Cerulean 0,18, Sala 0,12, Na ponta do pé 0,04). Jingle com o acorde final no rabo (mapa termina na batida dele), senão
o `.ogg` cortado fica mais curto que o mapa. O que só o ouvido dele decide: se as cartas e a prancheta soam como
cartas e prancheta, e se o Draft cansa.

## Rodada 7b (22/10): o clap do 808 mais suave

Retorno da rodada 7: gostou do clap, mas achou alto. A amostra é a mesma nas três (identidade do jogo); cada faixa
ganhou o próprio tratamento, por parâmetros no instrumento (`I.clap808.com({ ganho, corte, sala, tom, atraso })`),
sem instrumento novo. Padrão (`I.clap808` puro) continua idêntico à rodada 7.

| Faixa | Tratamento | RMS do clap (r7 → r7b) | Lead |
|---|---|---|---|
| Comum | ~−5 dB, passa-baixa suave (12 dB/oitava) em 6,5 a 7 kHz, sala curta (~0,25 s) assada na batida | | |
| Estrada da Vitória | quase seco e justo: sala 0,15, reverb grande 0,2 → 0,04, corte 7 kHz | 0,173 → 0,088 (−5,9 dB) | metais 0,218 |
| Campeão | torcida: clap dobrado, o segundo 11 ms depois e +0,4 semitom, um de cada lado (pan ±0,4), sala 0,3 | 0,169 → ~0,084 somados (−6 dB) | metais 0,172 |
| Tema da Rocket | mais molhado (sala 0,5, reverb grande 0,1 → 0,25) e 1 semitom abaixo; o resto idêntico (RMS das outras faixas igual) | 0,056 → 0,030 (−5,4 dB) | órgão 0,165, lead 0,077 |

`loops.mjs`: Estrada emenda 0,10, Tema da Rocket 0,05, 0 falhas (Campeão é jingle). Páginas: `r7b-*.ogg`.

## Rodada 7 (22/10): o clap clássico de bateria eletrônica

Retorno da rodada 6: aprovou todas as partidas, o Planalto v4, os temas de Brock, Misty e Rocket (o da Rocket, o
favorito de longe) e o Mercado funk v3 (amou as palmas novas e as moedas ali). Mas a palma sintetizada nova, no geral,
não: ele quer "aquele clap clássico daqueles teclados" (o clap da TR-808/909).

| Pedido | O que mudou |
|---|---|
| Clap clássico | `I.clap808` no `synth.mjs`: amostra gravada de uma **Roland TR-08** (a reedição Boutique da TR-808), `scripts/musica/amostras/clap-808.wav` (0,9 s, mono, cortada com saída suave). As 3 batidas rápidas e o rabo do 808 vêm da própria amostra; `pitch` reamostra como num sampler |
| Fonte | ["TR08_Clap01.WAV" de Karman_Lyne no Freesound](https://freesound.org/people/Karman_Lyne/sounds/519305/) (pack "Roland TR08 100% gain, default tuning"), **CC0 1.0**: sem crédito obrigatório, cabe no repo público. Crédito de cortesia: "clap: Karman_Lyne (Freesound), CC0". Baixado da prévia HQ (mp3 128 kbps; o .wav original pede login), o que basta pra um clap |
| Estrada da Vitória | a palma pesada do contratempo do 2 e do 4 virou o clap do 808, no tom original (a antiga era 6 semitons abaixo); ganho 3 → 2, reverb 0,3 → 0,2 |
| Campeão | as palmas do SOC-CER-MON e do "hey hey" viraram o clap do 808 (ganho 4 → 2,2) |
| Tema da Rocket | só as três palmas do SOC-CER-MON debochado viraram o clap do 808 (ganho 2,2 → 1,6); o resto idêntico |
| Ficam como estavam | Brock e Misty (palmas de verdade, ele gostou ali), Mercado (palmas e moedas), Abertura, partidas, Planalto |

**Conferido pelos números:** `--rms`: o clap fica abaixo do lead nas três (Estrada 0,173 contra metais 0,218;
Campeão ~0,17 contra metais 0,172; Rocket 0,056 contra órgão 0,165); a amostra tem rabo mais longo que a palma antiga,
por isso o RMS sobe mesmo com ganho menor. `loops.mjs`: Estrada emenda 0,09, Tema da Rocket 0,05 (Campeão é jingle,
sem loop). Abertura idêntica byte a byte (`cmp`) depois da mudança no sequenciador. O que só o ouvido dele decide: se
é "aquele" clap e se ficou alto ou baixo demais em cada uma.

Perguntas: (1) é esse o clap? Se quiser o da 909 (mais seco e brilhante), dá pra trocar a amostra. (2) Vale levar o
clap do 808 pra mais alguma (partidas, Planalto)?

## Rodada 6 (21/10): temas próprios, palmas de verdade e tudo em loop

Pedidos: palmas com timbre de palma (e menos no fim da Abertura com gancho v2, que vira a Home); temas próprios de
Brock, Misty e Equipe Rocket citados nas partidas deles; Planalto com o SOC-CER-MON mais evidente; o Mercado no groove
do funk v2; tudo loopável sem costura, partida em 1º e 2º tempo com trechos por intensidade e um JSON por faixa.

| Pedido | O que mudou |
|---|---|
| Palmas | `I.clap` (3 pessoas) e `I.palmas` (torcida, 9) no `synth.mjs`: ruído em duas faixas (~1,1 e ~2,5 kHz), 3 batidas rápidas e rabo de sala, cada pessoa um pouco fora do tempo. Mesmo volume RMS da palma antiga. Vale em todas as peças |
| Home | **Abertura com gancho v3**: palmas novas, sem as palmas no 2 e no 4 do A final (só a resposta do gancho no fim), intro de 4 compassos que toca uma vez e loop do 4 ao fim (o gancho final vira a virada de volta pro A) |
| Temas próprios | `tema-brock` (Mi menor, rock meio-tempo, taiko 3-3-2, trompete pergunta e tuba/fagote respondem, Sol maior no meio com SOC-CER-MON, volta um tom acima), `tema-misty` (Si menor 12/8, flauta pergunta e sinos respondem, Ré lídio no meio com SOC-CER-MON nos sinos, volta um tom acima), `tema-rocket` (Dó menor com swing, órgão e o "trio" de três acordes dos vilões, SOC-CER-MON debochado com três palmas, "o plano" em Lá♭, volta meio tom acima). Cada um exporta `MOTIVO` (2 compassos) |
| Partidas | os compassos 13 a 16 de cada nível citam o motivo do tema: o lead pergunta, os metais respondem uma oitava abaixo |
| Planalto v4 | fanfarra de entrada = o gancho em bloco com a torcida respondendo; o tema A começa com ele (Fá-Ré-SI♭, e Ré-Si♭-SOL em Sol menor); parte nova de 4 compassos com a banda inteira gritando o gancho subindo (Si♭, Dó menor) e palmas de volta; volta final termina em Fá7 pra voltar ao Si♭ |
| Mercado funk v3 | os 16 compassos da v2 iguais (o modelo) + parte B de 8 no mesmo groove (Sol♭maj7, lead pergunta e metais respondem, "plim" e moedas seguem); loop de ~55 s |
| Loop | `Song({ secoes })`: vários trechos num arquivo, cada nota pertence ao trecho em que começa, cada loop dobra o próprio rabo no seu começo; a intro é cortada (antes o rabo dela voltava em toda volta do loop). `render.mjs` grava o `.json` de cada faixa; `loops.mjs` confere as emendas no `.ogg` |

**Partida em dois tempos** (um `.ogg` + `.json` por tempo; base, Brock, Misty e Rocket):

| Trecho | 1º tempo | 2º tempo |
|---|---|---|
| nivel1 (loop, 16 compassos) | 120 BPM, groove + tema | 124, um tom acima, com terças |
| nivel2 (loop) | 128, agogô e arpejo o tempo todo, terças e cordas na 2ª volta | 133 |
| nivel3 (loop) | 136, bumbo e chimbal quentes, metais, cordas | 142 |
| virada (1 compasso, uma vez) | | V7 do tom novo, caixa e apito |
| pressao (loop) | | 144, meio tom acima |
| fim (uma vez) | SOC-CER-MON com palmas + apito do intervalo | SOC-CER-MON com palmas + acorde final |

(Os líderes têm os andamentos deles: Brock 108 → 122 e 112 → 132, Misty 72 → 82 e 76 → 90, Rocket 118 → 134 e
122 → 142.) No jogo: tocar o trecho com `loopStart`/`loopEnd`, subir de nível na virada da volta conforme o minuto e
a pressão, e o `fim` quando o tempo acaba. A música só lê o estado da partida.

**Conferido pelos números:** `node scripts/musica/loops.mjs` nos `.ogg` desta rodada: 37 loops (as faixas novas e
Cerulean, Sala, Estrada), todos com emenda entre 0,05 e 0,43 (abaixo de 1 = mais lisa que as 0,1% piores passagens de
amostra da própria música; o teste da medida dá 0,56 num loop bom de mentira e 13,8 num estalo), e o `.ogg` alinhado
com o `.wav` em todos os pontos do mapa. Abertura, Cerulean, Sala e Vitória saem idênticas byte a byte depois da
mudança no sequenciador (`cmp`). Volume por nível da partida (1º tempo): −17,9 → −16,9 → −16,1 dB; 2º tempo −17,3 →
−17,0 → −16,2 → pressão −16,1. Nos temas, taiko e baixos baixados até ficarem abaixo do lead (`--rms`). O que só o
ouvido dele decide: se a palma soa como palma, o clima de cada tema e a força de cada nível. A troca de um nível pro
outro (como está no arquivo) também mede abaixo de 1 (pior 0,95); se estalar no jogo, ~30 ms de crossfade resolve.

Perguntas: (1) a palma nova soa como palma? (2) Os três temas têm a cara de cada um? Sigo com Lt. Surge e Erika?
(3) Na partida, os níveis estão bem separados (dá pra sentir a subida)? (4) Planalto: o gancho ficou evidente o
bastante, ou demais?

## Rodada 5 (21/10): pergunta e resposta, partidas por personagem, Natal

"No geral, as músicas SÓ MELHORAM." Regra nova pra todas as trilhas: **pergunta e resposta e, quando der, uma
referência ao SOC-CER-MON**. Aplicada em:

| Faixa | Pergunta e resposta / SOC-CER-MON |
|---|---|
| Abertura com gancho v2 | etiqueta em pares (lead canta o gancho, a torcida responde batendo palmas no mesmo ritmo, metais repetem embaixo), metais respondendo nas pausas do A e da ponte, "hey hey" no refrão; palmas no 2 e no 4 e bem mais altas; baixo e caixa mais suingados |
| Partidas (v4 e personagens) | gancho nos metais e palmas respondendo no fim de cada tempo |
| Mercado funk v2 | gancho nos metais (Si♭ menor) com palmas; "plim" na frente e moedas caindo |
| Planalto Índigo v3 | trompa responde a nota longa do trompete com o gancho, no meio da música |
| Campeão v4 | a fanfarra pergunta, a torcida responde com o gancho e palmas; fim com o gancho em Ré |
| Sala (jazz) | improviso trocando de 4 em 4 (vibrafone e flauta) com citação do gancho |
| Jazz de Natal | idem, com duas citações |

**Partida v4 virou o molde** (`scripts/musica/partida-base.mjs`, a v4 sai idêntica por ele). Feitas: **Brock**
(Mi menor, pesado, meio-tempo, baixo sujo, taiko), **Misty** (Si menor em 12/8, sino bembé, sinos em onda, bolhas) e
**Equipe Rocket** (Dó menor, funk de espionagem, órgão cromático). Proposta pras outras: Lt. Surge (sintetizado,
140+ BPM), Erika (samba-bossa), Koga (escala in-sen, taiko), Sabrina (tons inteiros, 7/8), Blaine (salsa/mambo),
Giovanni (Rocket mais pesado com órgão), Blue (rock em maior, três subidas de tom) e a Elite dos Quatro. Tabela na
skill, §9.

Outros: Estrada sem a bigorna (palma pesada e aro no lugar), Vitória mais curta (~4 s), Natal com "We Wish You a
Merry Christmas" em valsa e um jazz de Natal com "Jingle Bells" (as duas em domínio público; arranjos nossos).
Eliminado, Rota 1, Cena boba, Draft e as aprovadas antes ficam como estão.

Perguntas: (1) a Abertura com gancho v2 ficou "perfeita"? Vira a Home oficial? (2) Brock, Misty e Rocket: o clima de
cada um bateu? Sigo com quais da lista? (3) Qual valsa de Natal vai pra dezembro, ou alternam?

## Rodada 4 (21/10): o gancho, partida que acelera e ajustes

### O que faz uma trilha ser icônica (pesquisa)

- **Earworms** (Jakubowski, Finkel, Stewart e Müllensiefen, *Psychology of Aesthetics, Creativity, and the Arts*,
  2017; 3.000 pessoas): grudam as melodias **mais rápidas e dançáveis**, com **contorno comum** (sobe na 1ª frase,
  desce na 2ª) e algo **incomum nos intervalos** (salto inesperado ou nota repetida a mais).
  ([APA](https://www.apa.org/news/press/releases/2016/11/earworms), [Goldsmiths](https://www.gold.ac.uk/news/scientists-find-key-to-writing-catchy-pop-hits/))
- **Koji Kondo** (Mario, Zelda): o ritmo vem primeiro, casado com o que o jogador sente ao jogar; o tema tem que
  aguentar horas de repetição sem cansar ([Siliconera](https://www.siliconera.com/how-does-koji-kondo-make-his-tunes-catchy/),
  [Iwata Asks](https://iwataasks.nintendo.com/interviews/wii/super-mario-all-stars/0/3)).
- O que os clássicos têm em comum (Pokémon, Mario, Zelda, Sonic, Tetris, Undertale, Balatro, Rocket League, vinhetas
  de futebol): **motivo de 3 a 5 notas com ritmo próprio**, cantável sem instrumento; **repetição com variação**;
  **leitmotiv** que volta em outras faixas (Undertale faz isso o jogo inteiro); **timbre de assinatura**; e uma
  "resposta" (as palmas e o "olê" das vinhetas de futebol).

**Nosso gancho:** G5-E5-C6 em 3-3-2 (grito de torcida: "Soc-cer-MON!"): desce uma terça e salta uma sexta (o
intervalo incomum), termina numa nota longa e as palmas respondem "hey hey". Não cita nenhum tema conhecido. Está no
`synth.mjs` como `GANCHO` e já aparece em:

| Faixa | Como |
|---|---|
| Abertura com gancho (nova, alternativa) | abre a música 2x com palmas, volta numa etiqueta depois do refrão subindo em sequência (Dó, Ré, Mi, Fá) e fecha |
| Partida v4 | em Lá menor, gritado pelos metais e palmas no fim de cada tempo |
| Planalto Índigo v2 | nos metais graves, enquanto a melodia segura na volta final |
| Proposta | Vitória e Campeão terminarem com ele; jingle da Home; som de "gol" no Duelo |

### Retorno da rodada 3 e o que mudou

| Tela | Ele disse | Agora |
|---|---|---|
| Abertura | Curtiu as duas; pesquisar trilha icônica e tentar ficar melhor ainda | **Abertura com gancho** (alternativa, 88 s) |
| Cena boba, Draft, Vestiário, Floresta, Mt. Moon, Cerulean | Aprovadas (Cerulean 6/8 "ÓTIMA") | Sem mudança |
| Partida | Começar animada, acelerar no fim de cada tempo, animada e não alegre | **Partida v4**: funk em Lá menor dórico, tema desde o 1º compasso; 1º tempo 120 → 136 BPM, 2º tempo 124 → 142 um tom acima, pressão meio tom acima |
| Mercado | Gostou de todas; falta uma funk | **Mercado funk** (Si♭ menor, o tom da "Mt Fox Shop": clavinete, órgão, slap, cowbell, "plim" de caixa registradora) |
| Rota 1 | Nada parecida com as do Komiku e alegre demais | **Rota 1 v2**: medi as duas do Komiku (106 a 126 BPM, Dó# menor, timbre bem mais escuro) e refiz em Dó# menor, 120 BPM, flauta, piano elétrico, pizzicato, baixo a galope |
| Estrada da Vitória | Falta percussão que marque | **v2**: taiko em 3-3-2 e bigorna no contratempo |
| Planalto Índigo | Falta swing e algo épico | **v2**: swing de colcheia, coro de cordas, metais graves, rufos de tímpano, gancho |
| Campeão | v3 é o campeão final; fazer uma de ~5 s | **Vitória** (uma partida): a frase da v3 em ~5 s |
| Eliminado | Perfeita, uns 3 s mais longa | **v4** (~6 s): uma segunda frase antes do Lá maior |
| Sala | Mais jazzada | **Sala v2**: swing de colcheia, ii-V em Fá, condução, baixo andando, Charleston |
| Natal | Usar as duas; Natal com melodia de domínio público, mais romântica | **Natal v2**: nossa valsa + "Noite Feliz" (Gruber, 1818, domínio público) com cordas e harpa |

Ferramentas novas: `scripts/musica/analisar.mjs` (andamento, tom provável, brilho de uma faixa de referência),
andamento por compasso (`bpmAt`) e swing de colcheia (`swingUnit: 8`) no sequenciador. A Abertura continua
renderizando idêntica à aprovada.

**Partida no jogo, com aceleração:** duas saídas. (a) Renderizar as camadas em 3 ou 4 andamentos (ex.: 120, 128,
136, 142) e trocar na virada do compasso conforme o minuto. (b) Uma só versão e `playbackRate` subindo devagar: o tom
sobe junto (+6% = +1 semitom), o que casa com a subida de tom que ele gosta. Recomendo (a) pro 1º tempo e (b) só na
pressão final.

### Perguntas da Rodada 4

1. A Abertura com gancho ficou melhor que a aprovada? Se sim, o gancho vira o leitmotiv oficial (Vitória, Campeão,
   Duelo)?
2. Partida v4: começou animada e a aceleração em cada tempo convence? Tensa no ponto, ou ainda alegre?
3. Rota 1 v2 chegou no clima do Komiku?
4. Mercado: qual vai pro jogo (funk, marchinha, ska), ou uma por loja/região?

## Rodada 3 (21/10): skill própria, sequenciador no repo e 14 peças nossas

O Miguel amou a Abertura v2 e pediu uma skill de composição. Agora existe:

- **Skill** `.claude/skills/soccermon-musica/SKILL.md`: regras da casa, o gosto dele, pipeline, teoria aplicada,
  conferências e armadilhas.
- **Sequenciador** `scripts/musica/synth.mjs` (sobre o `ZZFX.buildSamples` do jogo; agora com reverb, loop sem
  costura e volume geral no tempo), uma peça por arquivo em `scripts/musica/pecas/`, e
  `node scripts/musica/render.mjs [peça] --out <pasta>` (wav + ogg a −16 LUFS, saída fora do repo). Biome limpo.
- A Abertura foi portada e renderiza **idêntica** à v2 aprovada (conferido com `cmp`).

### Retorno da rodada 2 e o que fiz

| Tela | Ele disse | Agora |
|---|---|---|
| Home | Abertura v2 fica | Mantida. A v1 virou **Abertura simples** (remix no funk, mais leve) pra momentos simples |
| Modo história | "Momentos bobos" = cenas | **Na ponta do pé** (nossa, no lugar de "Sneaky Snom", mais boba), Pixelland ★, Opening ★ |
| Draft | Todas menos Laboratory e Jungle | Funk Game Loop ★, Skate ★, Rhythm ★ |
| Partida | Grave no começo, esperançosa; mudança de tom SOBERBA; volte pro funk | **Partida v3**: funk da Abertura em Ré dórico, começa com chank/chimbal/palmas, sobe +1 tom no 2º tempo e +½ na pressão, crescendo de ~13 dB |
| Vestiário | Tensa, tipo "Disco Cat" | **Vestiário v2**: disco em Mi menor, baixo de oitava, clavinete, cordas, tique de relógio, B7b9 sem resolver, trecho ½ tom acima |
| Mercado | Marchinha mais lenta e menos alegre; Mall mais rápida; Mt Fox Shop | **Marchinha v2** (100 BPM, parte A em Ré menor, caixinha de música) e **Mercado no balanço** (ska a 112 BPM) |
| Rota 1 | Champ de tournesol; Fouler séria demais | **Rota 1** nossa (Sol maior, 150 BPM, sobe um tom na 3ª volta) |
| Viridian | Rogue's Echoes perfeita; Jungle quase | As duas ★ |
| Mt. Moon | "8bit Dungeon Level, só que melhor"; 3 do PokéRogue perfeitas | **Mt. Moon** nossa (Ré menor, sininhos de Clefairy, ½ tom acima no fim) + as 3 ★ |
| Cerulean | Adorou todas; refazer a do Komiku | **Cerulean** nossa (Ré lídio em 6/8, ondas e bolhas) + Lake, Marine Mystique, rocky_coast ★ |
| Estrada da Vitória | Só La montagne, refazer | **Estrada** nossa: a estrada sobe um tom por volta (Mi → Fá# → Sol#) |
| Planalto Índigo | Tema nosso, paródia de clima | **Planalto Índigo**: marcha de Liga com fanfarra, caixa de banda, tímpanos, sobe pra Dó. Melodia do zero |
| Campeão | Mais lenta, mistura v1 + v2 | **Campeão v3** (100 BPM, melodia da v1 + produção da v2) |
| Eliminado | Menos dramático, tipo GameOver 3/4 | **Eliminado v3** (3 s, pulso em terças, Lá maior de consolo) |
| Sala | Village 4, ou a Home do Komiku refeita | **Sala** nossa (Fá jazzístico, piano elétrico, vassourinha) + Village 4 ★ |
| Sala em dezembro | Cozy Christmas genial, versão nossa | **Natal na Sala** (valsa em Sol, sinos, trenó; nenhuma canção de Natal citada) |

Não consegui ouvir "Mt Fox Shop" pra copiar a instrumentação que ele gostou: o que tem nela que agradou (o baixo, o
sino, a bateria)? Com isso eu levo pra Marchinha.

### Partida adaptativa (atualizado)

Mesma proposta de camadas, agora com o funk da Abertura e duas subidas de tom:

| Etapa | Gatilho no jogo | Camadas | Tom |
|---|---|---|---|
| 1 | Apito inicial | chank, chimbal, palmas | Ré dórico |
| 2 | 25% do 1º tempo | + bumbo, baixo slap | |
| 3 | Metade do 1º tempo | + tema | |
| 4 | Fim do 1º tempo | + agogô, arpejo | |
| 5 | 2º tempo (depois do Vestiário) | + contracanto | **Mi dórico (+1 tom)** |
| 6 | Jogo apertado no 2º tempo | + metais, segunda voz | |
| 7 | Últimos 2 min apertados, prorrogação, pênaltis | + cordas, chimbal dobrado, prato | **Fá dórico (+½ tom)** |

Cada tom é um conjunto de camadas de 8 compassos (15,5 s a 124 BPM): 3 conjuntos × 9 camadas em Opus ≈ 2 MB, ou
gerados no build pelo `render.mjs`. O resto (gol abaixa, goleada relaxa, 2x a 8x não acelera) segue igual.

### Mapa tela → faixa (rodada 3)

| Tela | Primeira opção | Reserva |
|---|---|---|
| Home, Perfil, Coleção | Abertura (nossa) | |
| Menus simples, tutorial | Abertura simples (nossa) | |
| Draft, Recompensa, Escalação | Funk Game Loop ★ | Skate ★, Rhythm ★ |
| Partida | Partida v3 (nossa, em camadas) | |
| Vestiário | Vestiário v2 (nossa) | Disco Cat |
| Mercado | Marchinha v2 ou Mercado no balanço (nossas) | Mt Fox Shop ★, Mall ★ |
| Rota 1 | Champ de tournesol ★ ou Rota 1 (nossa) | |
| Floresta de Viridian | Rogue's Echoes ★ | Jungle ★ |
| Mt. Moon | Enchanted Cave ★ ou Mt. Moon (nossa) | Subterrene Echoes ★, Ancient Ruins ★ |
| Cerulean | Lake ★ ou Cerulean (nossa) | Marine Mystique ★, rocky_coast ★ |
| Estrada da Vitória | Estrada (nossa) | La montagne ★ |
| Planalto Índigo | Planalto Índigo (nossa) | Aether (Firel) |
| Campeão | Campeão v3 (nossa) | |
| Eliminado | Eliminado v3 (nossa) | GameOver3 ★ |
| Sala de troféus | Sala (nossa) ou Village 4 ★ | |
| Sala em dezembro | Natal na Sala (nossa) | |
| Modo história | Na ponta do pé (nossa), Pixelland ★, Opening ★ | |

### Perguntas da Rodada 3

1. Partida v3: o funk e as duas subidas de tom ficaram como você queria? O começo ainda está fraco ou forte demais?
2. Vestiário v2: tenso no ponto, ou quer mais (andamento maior, menos melodia)?
3. Mercado: Marchinha v2 ou Mercado no balanço? E o que te pegou na instrumentação de "Mt Fox Shop"?
4. Nas regiões com faixa nossa e do PokéRogue (Mt. Moon, Cerulean), qual vai na frente?
5. Planalto Índigo: soa como Liga? Lembra algum tema dos jogos? (Se lembrar, eu reescrevo a melodia.)
6. Campeão v3 e Eliminado v3: chegaram no ponto?

## Rodada 2 (21/10, depois do Miguel ouvir)

### O que ele disse e o que mudou

| Tela | Retorno | O que fiz |
|---|---|---|
| Tema próprio | Gostou da ideia, quer mais complexo: camadas, contracanto, variação, ponte, groove | **Abertura v2** (80 s): intro, A, A com contracanto e arpejo, ponte com acordes emprestados (Si♭, Lá♭), refrão em terças, A final. Swing leve, baixo sincopado, acordes na contratempo, agogô, ghost notes |
| Home | Gostou de todas; Pixelland pra momentos bobos | Abertura v2 na Home; as outras viram reserva |
| Partida | Todas paradas; quer música que cresce até o fim | **Demo "Partida que cresce"** (81 s) e proposta de camadas abaixo |
| Draft e escalação | Funk Game Loop sim, o resto misterioso | Funk Game Loop + 4 com groove |
| Vestiário | Soturnas demais; quer animado | **Vestiário funk** (nosso, 104 BPM, slap e palmas) + 5 animadas |
| Mercado | Animado, "tipo a polca do MacLeod, só que outra" | **Marchinha do Mercado** (nossa, polca em 2/4) + Komiku "Mall", BoxCat "Mt Fox Shop" e outras |
| Rota | 8bit Dungeon Level e Arpanauts, variando por região; mais simples = mais feliz | 3 a 4 candidatas por região (tabela abaixo) |
| Campeão | Gosta da fanfarra, mas simples | **Fanfarra v2** (16 s): rufar, tímpanos, metais em terças, muda de Dó pra Ré, final com nona |
| Eliminado | Gosta dos game over, mas simples | **Eliminado v2** (14 s): Lá menor descendo com eco, termina num Lá maior de consolo |
| Sala | Curte a "Village" | Marquei as duas Village (a 4 e a 36: qual era?) |
| PokéRogue | "Gostei de TODAS", pelo groove | Lista completa das faixas de fã abaixo, com crédito e lugar pra cada |

### Novas fontes (conferidas na página do Free Music Archive)

| Fonte | Licença | Crédito | Estilo |
|---|---|---|---|
| [Komiku](https://freemusicarchive.org/music/Komiku/) (álbuns "Poupi's incredible adventures", "Captain Glouglou's Incredible Week", "It's time for adventure") | **CC0 1.0** | Opcional | Chiptune alegre de jogo, centenas de faixas. A melhor descoberta da rodada |
| [BoxCat Games, "Nameless: the Hackers RPG"](https://freemusicarchive.org/music/BoxCat_Games/Nameless_the_Hackers_RPG_Soundtrack) | **CC BY 3.0** | Obrigatório | Chiptune de RPG: tem "Mt Fox Shop" (loja), "Victory", "Defeat", "Map Theme" |

### Os temas próprios v2

Agora num sequenciador próprio de ~200 linhas sobre o `ZZFX.buildSamples` (o mesmo motor de som do jogo): nota em
qualquer tempo (swing), duração de verdade, eco por instrumento, volume que muda no tempo (as camadas) e 20
instrumentos (quadrada, pulso 25% estilo NES, triangular, serra com filtro, pad com tremolo, metais, tuba, flautim,
agogô, bumbo, caixa, palmas, chimbal aberto e fechado, shaker, prato, tom, tímpano). As 6 peças renderizam em 4 s
no PC. Fonte em `fonte/v2/` na pasta das amostras (`node songs.mjs <saída> [nome]`).

Conferi por script: afinação, acordes, segunda voz em terças e equilíbrio da mistura (nenhum instrumento engolindo
os outros). Volume final igualado a −16 LUFS (jingles −15) pra comparar com as outras.

### Música da partida que cresce (proposta)

A ideia é a do Balatro e dos jogos de ritmo: **uma música em camadas** (mesmo andamento, mesmo tom, loop de 8
compassos ≈ 15 s). Todas as camadas tocam juntas desde o apito, cada uma com volume 0 até a vez dela. O jogo só
mexe nos volumes, sempre na virada do compasso, pra entrada soar musical.

| Camada | Entra quando | Na demo |
|---|---|---|
| 1. Pulso (baixo grave) + shaker | Apito inicial | 0 s |
| 2. Bumbo | 25% do 1º tempo | 8 s |
| 3. Baixo de groove + caixa | Metade do 1º tempo | 15 s |
| 4. Acordes + agogô | 2º tempo | 23 s |
| 5. Arpejo | Últimos 40% do jogo | 30 s |
| 6. Riff | Jogo apertado (empate ou 1 gol de diferença) no 2º tempo | 38 s |
| 7. **Pressão final** (a versão inteira um tom acima, chimbal dobrado, prato aberto, nota longa subindo) | Últimos 2 min de jogo apertado, ou prorrogação/pênaltis | 53 s |
| Rufar e acorde final | Último minuto e apito final | 73 s e 79 s |

Regras:

- **Gol:** tudo abaixa −10 dB por 1,5 s (a torcida manda). Depois do gol, 1 compasso só com bumbo e volta com prato.
- **Goleada (3+ de diferença):** tira o riff e a pressão; a música "relaxa".
- **Intervalo:** a da partida some em 400 ms e entra o Vestiário.
- **Velocidade 2x a 8x:** a música não acelera (desafinaria); as camadas seguem o minuto do jogo. Em "Melhores
  momentos" fica só a camada 1, ou nada.
- **A música só lê o estado da partida** (minuto, placar), nunca escreve: o motor determinístico não muda.
- **Volume:** a partida usa a música a ~60% do slider, pra não brigar com torcida e gritos.
- **Peso:** 7 camadas de 15 s em Opus 64 kbps ≈ 850 KB, ou geradas pelo nosso script no build.

### PokéRogue: todas as faixas originais de fã

Fonte: [`audio/REUSE.toml`](https://github.com/pagefaultgames/pokerogue-assets/blob/main/audio/REUSE.toml) (autor e
licença) e [`en/bgm-name.json`](https://github.com/pagefaultgames/pokerogue-locales/blob/main/en/bgm-name.json) (nome
da faixa). Todas **CC BY-NC-SA 4.0**. Ficam de fora o bloco `LicenseRef-FAIR-USE` (música dos jogos: inclusive o
`menu`, `town`, `grass`, `heal`, `meadow`, `beach`, `mountain`, `temple`, que são PMD e BW) e as 4 de 1º de abril
(`*_afd`: brincadeiras que podem citar tema dos jogos).

| Arquivo | Nome | Autor | Onde encaixa |
|---|---|---|---|
| `title` | PokéRogue | Firel | Planalto Índigo (é o tema-título deles: nunca como tema principal) |
| `plains` | Route 888 | Firel | Rota 1 |
| `metropolis` | Metropolis | Firel | Vestiário, Draft |
| `laboratory` | Laboratory | Firel | Draft |
| `mystery_encounter_delibirdy` | DeliDelivery! | Firel | Mercado |
| `volcano` | Twisturn Volcano | Firel | Estrada da Vitória |
| `abyss` | Penumbra Chasm | Firel | Estrada da Vitória |
| `ice_cave` | -50°C | Firel | Estrada da Vitória, evento de gelo |
| `space` | Aether | Firel | Planalto Índigo |
| `end` | Darkest Day | Firel | Final da Copa longa |
| `desert` | Far Sands | Firel | Evento/região futura (Gen 2+) |
| `graveyard` | Faller | Firel | Lavender (Modo história) |
| `seabed` | Seabed | Firel | Ilhas Seafoam (Modo história) |
| `power_plant` | The Klink | Firel | Usina (Modo história), Zapdos |
| `jungle` | Jungle | Lmz | Floresta de Viridian, Draft |
| `lake` | Lake | Lmz | Cerulean |
| `ruins` | Ancient Ruins | Lmz | Mt. Moon |
| `rocky_coast` | (sem nome ainda) | Lmz | Cerulean, Vermilion |
| `forest` | Rogue's Echoes | Andr06 | Floresta de Viridian |
| `fairy_cave` | Enchanted Cave | Andr06 | Mt. Moon (Clefairy) |
| `sea` | Marine Mystique | Andr06 | Cerulean |
| `slum` | Sneaky Snom | Andr06 | Mercado, Equipe Rocket |
| `winter_title` | Cozy Christmas | Andr06 | Sala de troféus em dezembro |
| `cave` | Subterrene Echoes | Bird_Obsession | Mt. Moon |
| `tall_grass` | Careful Footing | Bird_Obsession | Floresta de Viridian, evento "Mato alto" |
| `snowy_forest` | Silent Snowfall | Bird_Obsession | Evento de inverno |
| `island` | Sun Kissed Shore Up | MattCello | Vestiário, Vermilion |
| `construction_site` | Endless Toil | MattCello | Evento |
| `wasteland` | Empty Dream | Leavannite | Região futura |
| `underground_well` | (sem nome ainda) | Veilure | Caverna (Modo história) |
| `swamp` | Muckraker | Faces in the Clouds | Região futura |

**Como usar direito:**

- **Crédito por faixa** no `CREDITS.md` e na tela Créditos: `"Route 888", Firel (PokéRogue,
  github.com/pagefaultgames/pokerogue-assets), CC BY-NC-SA 4.0`. Se cortarmos o loop ou mudarmos o volume, dizer
  "editada" (a licença pede que as mudanças fiquem indicadas).
- **NC:** o jogo nunca cobra, nem doação, nem anúncio. Já vale pros sprites PMD (CC BY-NC).
- **SA:** vale só pros arquivos de áudio (e o que fizermos a partir deles: loop cortado, versão mais curta). Ficam
  numa pasta própria (`public/assets/music/pokerogue/`) com o texto da licença. O código continua AGPL.
- **Não misturar** faixa do PokéRogue com tema nosso no mesmo arquivo (viraria CC BY-NC-SA inteiro).
- **Identidade:** usar as deles nas regiões da Rota e em eventos, e deixar Home, partida, campeão e eliminado com
  temas nossos. Assim o Soccermon tem som próprio e o groove do PokéRogue entra como "trilha das rotas".
- **Avisar o PokéRogue** (opcional, educado): uma linha no Discord deles dizendo que usamos as faixas com crédito.

### Mapa final proposto: tela → faixa

| Tela | Faixa | Fonte e licença | Reserva |
|---|---|---|---|
| Home, Perfil, Coleção, Configurações | **Abertura v2** (segue tocando entre elas) | nosso | Underclocked (Skiff, CC BY) |
| Draft, Recompensa, Escalação | **Funk Game Loop** ★ | MacLeod, CC BY 4.0 | Jungle (Lmz), Skate (Komiku) |
| Partida | **Partida que cresce** (camadas) | nosso | sem música |
| Vestiário | **Vestiário funk** | nosso | Metropolis (Firel) |
| Mercado | **Marchinha do Mercado** | nosso | Mall (Komiku, CC0) |
| Rota 1 | **Route 888** ou Champ de tournesol | Firel (BY-NC-SA) / Komiku (CC0) | Arpanauts ★ |
| Floresta de Viridian | **Rogue's Echoes** | Andr06 | Careful Footing |
| Mt. Moon | **8bit Dungeon Level** ★ | MacLeod, CC BY 4.0 | Enchanted Cave (Andr06) |
| Cerulean | **Lake** | Lmz | Barque sur le lac (Komiku) |
| Estrada da Vitória | **Twisturn Volcano** | Firel | La montagne (Komiku) |
| Planalto Índigo | **Aether** | Firel | PokéRogue (Firel) |
| Campeão | **Fanfarra v2**, depois Abertura | nosso | WIN (Komiku) |
| Eliminado | **Eliminado v2**, 2 s de silêncio, Abertura baixa | nosso | GameOver3 ★ |
| Sala de troféus | **Village** ★ | Ninja Adventure, CC0 | Home (Komiku) |
| Momentos bobos | **Pixelland** ★ | MacLeod, CC BY 4.0 | |
| Duelo, Copa do Dia, Liga | iguais às da Copa | | |

Peso (Opus 64 kbps, loops cortados): ~7 MB somando tudo, mas cada tela baixa só a sua (300 KB a 1 MB).

### Perguntas da Rodada 2

1. **Abertura v2:** ficou no ponto? Se não, o quê: andamento (136), mais samba, refrão mais forte, ponte mais curta?
2. **Partida que cresce:** a subida convence? Recomendo ligar como experimento nas Configurações primeiro (como a
   "beira da quadra") e ver no placar quanta gente desliga.
3. **PokéRogue nas Rotas:** fechado nas regras acima (temas nossos nas telas principais, deles nas regiões)?
   Recomendo sim.
4. **Draft:** Funk Game Loop é bem conhecido (como a polca). Fica, ou prefere o Vestiário funk nosso também no draft?
   Recomendo Funk Game Loop no draft e o nosso no vestiário, pra não repetir.
5. **Sala:** qual Village, a "4 - Village" ou a "36 - Village"?
6. **Momentos bobos com Pixelland:** quais? Sugestão: Ditto copiando, fogo amigo do Earthquake, Magikarp em campo.
7. **Fanfarra v2 e Eliminado v2:** ponto certo de "elaborado", ou quer ainda mais (com a melodia da Abertura
   citada na fanfarra, por exemplo)?

---

## Rodada 1 (20 a 21/10, histórico)

## 1. Onde a música entra

### Como os jogos de referência tratam música x efeitos x torcida

| Jogo | Menus | Partida/jogo | O que dá pra pegar |
|---|---|---|---|
| Balatro | Um tema só (LouisF) com variações por tela: loja, pacote, chefe. Mesmo tom e andamento, troca sem corte | O mesmo tema, em camadas | **Um tema nosso com versões por tela.** Troca suave, identidade forte |
| Slay the Spire | Tema do menu; cada ato tem a sua; chefe tem outra | Música sempre, efeitos por cima | Música muda com o "lugar" da Rota |
| Pokémon Puzzle League | Tema por fase/rival | Música acelera quando aperta (perigo) | Camada de tensão no fim do jogo ou nos pênaltis (depois) |
| Rocket League | Playlist nos menus, com nome da faixa na tela | Quase só estádio e carros; volume de música separado | Partida com torcida, menu com música |
| EA FC / PES | Trilha licenciada só nos menus | Zero música: torcida e narração | Transmissão de TV não tem música por baixo |
| Mario Strikers, Inazuma Eleven, Captain Tsubasa (NES) | Tema de abertura | Música o jogo todo | Futebol arcade pode ter música em campo, mas briga com a torcida |
| Sensible Soccer | Música-tema famosa na abertura | Só torcida | Tema marcante na Home, silêncio no jogo |

Resumo: jogo de futebol "transmissão" deixa a partida com a torcida. Roguelike de cartas (Balatro, Spire) tem
música contínua nos menus e troca suave entre telas. O Soccermon é os dois: música nos menus e na Rota, torcida na
quadra.

### Tela a tela

| Tela (`Screen`) | Clima | Recomendação | Amostras |
|---|---|---|---|
| `home`, `profile`, `collection`, `settings`, `help`, `credits` | Chiptune animado de abertura, cara de "vamos jogar" | Tema principal, loop de 30 a 90 s | `home-*` |
| `draft`, `reward` | Foco: o jogador lê cartas. Médio, sem melodia que canse | Versão mais leve do tema (sem a melodia) ou faixa calma | `draft-*` |
| `lineup` | Concentração antes do jogo | Mesma do draft, segue sem cortar | `draft-*` |
| `match`, `liga-match` | Torcida, gritos, apito | **Sem música.** Se quiser algo, só batucada baixa, abaixando no gol | `partida-*` |
| Intervalo (vestiário, dentro da partida) | Respiro | Faixa calma e baixa, ou nada | `intervalo-*` |
| `shop` (Mercado) | Lojinha, bem-humorada | Variação "loja" do tema (como o Balatro) ou faixa leve | `mercado-*` |
| `map`, `group`, `event` (Rota) | Aventura, "seguir viagem" | Faixa de estrada | `rota-*` |
| `result` com título | Fanfarra curta (2 a 5 s), depois o tema da Home | Jingle + volta pro tema | `campeao-*` |
| `result` eliminado | Jingle curto e triste, sem drama | Jingle + 2 s de silêncio + tema da Home baixo | `eliminado-*` |
| `trophies` (Sala) | Quarto à noite, aconchego | Faixa calma e baixa | `sala-*` |
| `duel`, `daily`, `liga` | Iguais às telas da Copa | Reaproveita | |

VERSUS, evolução, pacote de cartas e pênaltis já têm som próprio. A música abaixa (não para) nesses momentos.

## 2. Catálogo de fontes

Conferido em 21/10/2026.

| Fonte | Licença exata | Cabe com AGPL? | Crédito | Tamanho | Estilo |
|---|---|---|---|---|---|
| [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) (Pixel-boy e AAA) | **CC0 1.0** (LICENSE.txt no zip) | Sim | Opcional ("appreciated") | 40 músicas + 15 jingles; ogg de 0,4 a 4,5 MB (19 s a 2:33) | Chiptune/8-bit de RPG, de aventura a aconchego |
| [Kenney Music Jingles](https://kenney.nl/assets/music-jingles) | **CC0 1.0** | Sim | Opcional | 86 jingles, zip de 1,2 MB, 10 a 40 KB cada | 8-bit, hit, pizzicato, sax, steel. Bom pra campeão/eliminado |
| [Eric Skiff, Resistor Anthems](https://ericskiff.com/music/) | **CC BY 4.0** | Sim | Obrigatório: nome + link | 18 faixas, mp3 de 2,8 a 6,5 MB (2 a 4,5 min) | Chiptune clássico, animado. "Underclocked" é muito usado em jogos indie |
| [Kevin MacLeod / incompetech](https://incompetech.com/music/royalty-free/music.html) | **CC BY 4.0** | Sim | Obrigatório, no formato dele ("Pixelland" Kevin MacLeod (incompetech.com), Licensed under CC BY 4.0) | mp3 320 kbps, 2 a 9 MB | Variado. Chiptune: Pixelland, Pixel Peeker Polka, 8bit Dungeon. Muito ouvido no YouTube (soa "genérico") |
| [OpenGameArt](https://opengameart.org/) | CC0, CC BY, CC BY-SA, GPL: **muda por faixa** | CC0/CC BY sim; CC BY-SA sim (SA vale só pra faixa) | Conforme a faixa | Variado | Muito chiptune. Destaques: [5 Chiptunes (Action)](https://opengameart.org/content/5-chiptunes-action) e os JRPG Packs de Juhani Junkala / SubspaceAudio (CC0, loops sem emenda) |
| [FreePD](https://freepd.com/) | Era domínio público | — | — | — | **Fechou em 2025** (o site diz "permanently closed"). Fora |
| itch.io (packs grátis) | Cada pack tem a sua. Muitos "free" usam licença própria que proíbe redistribuir o arquivo | Só CC0/CC BY | Conforme o pack | | Filtrar por licença CC0/CC BY e ler o texto. Licença própria = fora (repo público) |
| [PokéRogue, trilhas de fã](https://github.com/pagefaultgames/pokerogue-assets/blob/main/audio/REUSE.toml) | **CC BY-NC-SA 4.0** (só as de fã; ver abaixo) | Cabe como asset separado, como os sprites PMD (CC BY-NC) | Obrigatório, por autor | ~35 faixas, mp3 de 2 a 5 MB | Cara de Pokémon de verdade (é o charme e o risco) |
| [Freesound](https://freesound.org/) (amostras de bateria) | **muda por som** (CC0, CC BY, CC BY-NC): ler na página de cada um | CC0/CC BY sim | Conforme o som | prévias HQ (mp3) sem login; o original pede conta | Clap do 808 (rodada 7): [TR08_Clap01, Karman_Lyne](https://freesound.org/people/Karman_Lyne/sounds/519305/), CC0 |
| [ZzFXM](https://github.com/keithclark/ZzFXM) (tema próprio) | Player MIT; a música é nossa | Sim | Nosso | Música de 27 s = **3,5 KB de dados** (495 bytes com gzip) | O mesmo som dos efeitos ZzFX que já temos |
| [BeepBox](https://www.beepbox.co) / JummBox (tema próprio) | Ferramenta MIT; a música é de quem compõe | Sim | Nosso | A música inteira mora no link; exporta .wav/.mp3 | Chiptune fácil de compor no navegador |

OpenGameArt estava fora do ar hoje (conexão recusada), por isso não tem amostra de lá. Licenças dos JRPG Packs vieram
da busca: conferir na página antes de usar.

### PokéRogue, faixa a faixa (REUSE.toml de `audio/`)

O arquivo separa em blocos. O que importa:

| Bloco | Faixas | Licença | Pra nós |
|---|---|---|---|
| `LicenseRef-FAIR-USE` (© Nintendo, Creatures, GAME FREAK) | `bgm/bw/*`, todos os `battle_*`, `encounter_*`, `mystery_encounter_*` (menos delibirdy), **`menu`, `town`, `grass`, `heal`, `meadow`**, `beach`, `dojo`, `factory`, `mountain`, `temple`, `end_summit` | Música dos jogos | **Nunca.** Atenção: o `menu.mp3` deles é dos jogos |
| Firel | `title`, `plains`, `metropolis`, `power_plant`, `laboratory`, `desert`, `volcano`, `ice_cave`, `graveyard`, `seabed`, `space`, `abyss`, `end`, `mystery_encounter_delibirdy` | CC BY-NC-SA 4.0 | Ok na licença |
| Lmz | `jungle`, `lake`, `ruins`, `rocky_coast` | CC BY-NC-SA 4.0 | Ok |
| Andr06 | `forest`, `fairy_cave`, `sea`, `slum`, `winter_title`, `title_afd`, `title_afd_2`, `battle_trainer_afd`, `battle_rival_3_afd` | CC BY-NC-SA 4.0 | Ok (as `_afd` são de 1º de abril e podem citar tema dos jogos: evitar) |
| Bird_Obsession, MattCello, Leavannite, Veilure, Faces in the Clouds | `cave`, `snowy_forest`, `tall_grass`, `construction_site`, `island`, `wasteland`, `underground_well`, `swamp` | CC BY-NC-SA 4.0 | Ok |

**NC é problema?** Não pra nós: o jogo nunca cobra, e os sprites PMD já são CC BY-NC. O AGPL vale pro código; os
assets já têm licenças próprias no `CREDITS.md`.

**SA é problema?** Um pouco. Cortar o loop, mudar o andamento ou mixar com outra coisa vira obra derivada e sai
obrigatoriamente CC BY-NC-SA. Não contamina o código nem as outras músicas.

**O risco de verdade é outro:** essas faixas foram feitas pra soar como Pokémon. Quem ouvir pode achar que é música
dos jogos (pedido de retirada pela "cara"). E é a trilha de outro jogo de fã: o Soccermon fica parecido com o
PokéRogue em vez de ter som próprio.

## 3. Amostras

Pasta com `index.html`, 40 faixas (3 a 5 por clima) e os 3 temas nossos. Escolhas feitas pelo nome, pela duração e
pela curva de tom dos jingles (subindo = campeão, descendo = eliminado). Não deu pra ouvir daqui: é por isso que as
amostras existem.

| Clima | Amostras |
|---|---|
| Home | **tema próprio "Abertura"**, Underclocked e We're the Resistors (Eric Skiff), Pixelland (MacLeod), Good Time (Ninja Adventure) |
| Draft e escalação | Sunny e Adventure Begin (Ninja), Come and Find Me (Skiff), Funk Game Loop (MacLeod) |
| Partida | **batucada própria** (só bateria e baixo do tema), Jumpshot e Ouroboros só pra comparar |
| Intervalo | Chill e Quiet (Ninja), We're all under the stars (Skiff) |
| Mercado | Pixel Peeker Polka lenta e rápida (MacLeod), Village (Ninja) |
| Rota | Road e Adventure (Ninja), 8bit Dungeon Level (MacLeod), Arpanauts (Skiff) |
| Campeão | **fanfarra própria (5 s)**, NES12 (Kenney), LevelUp3 e Success4 (Ninja), All of Us (Skiff, tema longo) |
| Eliminado | GameOver3, GameOver4 e Sad Theme (Ninja), NES07 (Kenney) |
| Sala | Peaceful, Village, Calm Village e Dream (Ninja) |
| Comparação | PokéRogue: title, plains, metropolis (Firel), lake (Lmz), forest (Andr06) |

### Os temas próprios (rascunho)

Feitos em ZzFXM com os instrumentos do ZzFX que o jogo já usa. Script `fonte/render.mjs` na pasta das amostras
(roda com `node render.mjs <saída>`), dados em `tema-*.zzfxm.json`.

- **Abertura:** Dó maior, 140 BPM, 16 compassos (27 s, loop). Levada de "samba-pop": tamborim com o acento do
  partido-alto, bumbo antecipado, baixo sincopado, arpejo e uma melodia nossa (nada de tema dos jogos).
- **Batucada:** a mesma música só com bateria e baixo. É a "camada" que mostra a ideia do Balatro: uma música, várias
  versões por tela.
- **Fanfarra de campeão:** 150 BPM, 5 s, sobe até um Dó longo com prato e arpejo.

Instrumentos de bateria tirados do exemplo "depp" do ZzFXM (MIT). Melodia e harmonia conferidas por script (as notas
saem afinadas). O som final só o ouvido do Miguel decide.

Não fiz link do BeepBox: o link é a música codificada e precisa ser montado na própria ferramenta. Se o Miguel quiser
compor lá, ele manda o link e a gente exporta. O caminho ZzFXM tem a vantagem de ser texto: dá pra eu ajustar a partir
do que ele disser ("mais rápido", "mais Kanto", "menos samba").

## 4. Proposta técnica (sem implementar)

| Ponto | Proposta |
|---|---|
| Formato | **Opus** (`.webm`) 48 a 64 kbps, com **mp3** 96 kbps de reserva escolhido por `canPlayType`. Conferir Opus e Vorbis no WebKit (o Safari é o chato) antes de decidir; o mp3 garante |
| Loop sem emenda | mp3 tem silêncio no começo e no fim (padding do codificador) e o loop "soluça". Tocar por `AudioBufferSourceNode` com `loop = true` (e `loopStart`/`loopEnd` quando a faixa tiver intro) |
| Peso | Loop de 60 s em Opus 64 kbps ≈ 480 KB; 8 faixas ≈ 3 a 4 MB no total, mas cada uma só quando a tela pedir. Jingles: 20 a 80 KB. Tema ZzFXM: 3,5 KB de dados, mas leva ~0,5 s pra gerar no PC (mais no celular): gerar num Worker ou já renderizar em `.webm` no build |
| Carregamento | Nada no primeiro carregamento. Depois do `load` da Home (como o Phaser), baixar só o tema da Home. As outras quando a tela abrir, e a da próxima tela provável em segundo plano. Cache de 1 ano como em `/bundle` |
| Onde no código | `src/game/music.ts` novo, ao lado do `audio.ts`, usando o mesmo `ZZFX.audioContext`. Sem `phaser` (a Home importa). Um `GainNode` "música" com o volume `geral × música` |
| Volume | `musicVolume` nas Configurações, junto de gritos, efeitos e torcida (`settings-sync.ts` → `setVolumes`). 0 = desligada. Campo novo opcional no save, sem migração |
| Troca de tela | Crossfade de 250 ms (`linearRampToValueAtTime`), na mesma batida do "nada teleporta". Mesma faixa em duas telas = segue tocando, sem recomeçar. Se for tema em camadas, troca a camada em vez da faixa |
| Partida | Entrar na quadra: a música some em 400 ms. Se um dia tiver batucada: −10 dB no gol, na torcida e nos gritos, volta em 1,5 s |
| Jingles | Campeão/eliminado: a faixa da tela abaixa, o jingle toca, a faixa volta em 1 s |
| Primeiro toque | O navegador só libera áudio depois da 1ª interação. A música entra com fade de 1 s no primeiro toque da Home |
| Aba escondida | `visibilitychange`: pausa a música e retoma com fade |
| Reduzir movimento | Não mexe na música (é configuração de movimento, não de som) |
| Créditos | Linha por faixa no `CREDITS.md` e na tela Créditos. CC BY pede nome, título e link da licença |
| Analytics | Se quiser saber quanta gente desliga: `musicVolume` entra nas configurações enviadas (ver `track.ts`) |

## 5. Perguntas pro Miguel (rodada 1, respondidas: ver Rodada 2)

1. **Quer música em quais telas?** Recomendo menus, draft, Rota, Mercado e Sala. Partida sem música.
2. **De onde vem?** (a) tema próprio com versões por tela, estilo Balatro; (b) faixas prontas CC0/CC BY; (c) as
   duas. Recomendo **(c)**: tema nosso na Home, no campeão e no eliminado (vira a "cara" do jogo, cabe no
   trailer e no TikTok sem crédito de ninguém), e Ninja Adventure ou Eric Skiff na Rota, no Mercado e na Sala.
3. **Gostou do rascunho "Abertura"?** O que mudar: andamento, mais samba, mais Kanto, outra melodia? Recomendo eu
   seguir ajustando no ZzFXM pelo que você disser, ou você compõe no BeepBox e me manda o link.
4. **PokéRogue (Firel, Lmz, Andr06)?** Recomendo **não**: a licença cabe, mas soa como Pokémon de propósito e é a
   identidade de outro jogo de fã. Se uma delas te pegar muito, dá pra usar na Rota com crédito.
5. **Partida: silêncio ou batucada baixa?** Recomendo silêncio (torcida e gritos já fazem o clima). A batucada pode
   entrar depois como teste só nos pênaltis ou na final.
6. **Volume padrão da Música:** recomendo ligada a 40% (abaixo dos efeitos). Quem não quiser desliga no slider.
7. **Licença do nosso tema:** recomendo CC BY 4.0 (crédito pro Soccermon, qualquer um pode usar). AGPL é de código e
   fica estranho em música.
8. **Ouça o `index.html` e marque 1 por clima** (ou "nenhuma"). Com as escolhas eu faço o plano de implementação e os
   créditos.

## Links

- Amostras: `index.html` na pasta `musica/` do scratchpad desta sessão.
- [ZzFXM](https://github.com/keithclark/ZzFXM) e o [tracker](https://keithclark.github.io/ZzFXM/tracker/)
- [REUSE.toml do PokéRogue (áudio)](https://github.com/pagefaultgames/pokerogue-assets/blob/main/audio/REUSE.toml)
- Pesquisa anterior: `docs/planos/pesquisas/apis-e-assets.md` (worktree `pesquisa-apis`), seção 2.4 e decisão 4

## No jogo (22/10/2026)

- Arquivos em `public/music/`: Opus `.webm` 64 kbps (13 MB) + `.mp3` 80 kbps de reserva (14 MB, escolhido por `canPlayType`); o `.ogg` saiu (27 MB). Emendas conferidas no `.webm` com o `loops.mjs` adaptado (decodifica a 44,1 kHz): 35 loops, pior 0,74.
- Rival com `rivalTrainer` brock/misty/rocket: tema na apresentação (VERSUS) e `partida-<nome>-1t/2t`; os outros líderes seguem em `partida-1t/2t`.
- `campeao` na tela de resultado da copa campeã; `planalto-indigo` na fase de grupos (tela `group`). `pressao` entra pela `virada` (trecho de entrada colado no loop) e `fim` toca no apito final.
