---
name: soccermon-musica
description: Como compor, arranjar, renderizar e escolher a música do Soccermon (temas próprios em scripts/musica, faixas CC0/CC BY, trilhas de fã do PokéRogue) e o gosto do Miguel pra ela. Use sempre que for criar ou mexer em música de tela (Home, draft, partida, vestiário, Mercado, Rota, campeão, eliminado, Sala, Modo história), jingle, música adaptativa da partida, ou escolher/creditar faixa de terceiros.
---

# Música do Soccermon

Aprendido em 8 rodadas com o Miguel (20 a 22/10/2026). "No geral, as músicas SÓ MELHORAM" (rodada 5). Pesquisa, catálogo de fontes e mapa tela → faixa em
`docs/planos/pesquisas/musica.md`. Leia as armadilhas (§7) antes de mexer no sequenciador.

## 1. Regras da casa (não negociáveis)

- **Nada composto pros jogos Pokémon**: nem rip, nem remix, nem "arranjo de fã" de música dos jogos, nem citação de
  melodia ou progressão reconhecível. "Paródia" = paródia de clima e estrutura (marcha de Liga, fanfarra), nunca de
  notas. Na dúvida, escreva outra melodia e pergunte ao Miguel se lembra algo.
- **Licença**: CC0, CC BY, CC BY-SA ou CC BY-NC-SA (o jogo nunca cobra). Licença própria de pack ("free for games, não
  redistribua") não serve: o repo é público e o arquivo vai junto. Crédito exato no `CREDITS.md` e na tela Créditos.
- **PokéRogue**: só o que o `audio/REUSE.toml` dá a autor de fã (Firel, Lmz, Andr06, Bird_Obsession, MattCello,
  Leavannite, Veilure, Faces in the Clouds). O bloco `LicenseRef-FAIR-USE` é música dos jogos (inclusive `menu`,
  `town`, `grass`, `heal`, `meadow`): nunca. Fora também os `*_afd`. CC BY-NC-SA vale só pros arquivos de áudio,
  numa pasta própria; não misturar com tema nosso no mesmo arquivo.
- **Temas nossos**: proposta de licença CC BY 4.0 (crédito "Soccermon"). Nada vai pro jogo sem o ok do Miguel
  ("pode subir").

## 2. Gosto do Miguel

Juntado das rodadas 1 a 8 (20 a 22/10/2026) e das memórias. "No geral, as músicas SÓ MELHORAM" (rodada 5).

**A régua.** O Tema da Rocket (rodada 6, `pecas/tema-rocket.mjs`): "brilhou meus olhos demais". Peça nova se mede
por ele. O que ele mais quer é **música que conta uma história**: no "Na ponta do pé v2" o B sobe pelo cromático,
tropeça, faz "bonk" e para no silêncio; ele chamou de genial, e os apitos deram o charme. Pense na cena (o plano, o
tropeço, a volta) antes das notas.

**Regra geral (rodada 5): pergunta e resposta** em toda trilha (lead × metais, lead × torcida, vibrafone × flauta de
4 em 4) e, quando der, **o SOC-CER-MON** (o `GANCHO` inteiro, só o 3-3-2 nas palmas, ou citado num solo).

**Um som de assinatura por faixa**, criativo, tirado da tela: as moedas e a caixa registradora do Mercado (as
favoritas: "gosto muito de ideias criativas como essa das moedas"), as 3 cartas virando no Draft, a prancheta
(5 peças magnéticas) na Escalação, as gotas e o eco da caverna no Mt. Moon, a gaivota e as bolhas na Cerulean, o
tique de relógio no Vestiário. Prefira isso a um clap genérico.

**Palmas.** O clap clássico do 808 (`I.clap808`, rodada 7) em tudo que é novo, na receita da 7b ("masterizou a
masterização, uma aula"): a mesma amostra, ~−6 dB, passa-baixa entre 6,5 e 7 kHz, sala curta, e um tratamento por
faixa (seco na Estrada, dobrado como torcida no Campeão, molhado e um semitom abaixo na Rocket). A palma sintetizada
da rodada 6 foi recusada no geral (ficou só em Brock, Misty e Mercado, onde ele gostou). Abafada demais ele não ouve.

**Timbre.** Tela que se ouve por muito tempo (Escalação, Draft, mapa, Sala) pede timbre **quente**: nada áspero ou
metálico. A Escalação v1 saiu "meio metálica demais" (pulso fino de 12,5%, clavinete de 7,5%, metais abertos): na 8b
ganhou ataque mais lento, passa-baixa mais fechado e onda mais redonda. Groove e instrumentação > "só 8-bit".

**Mistura.** Percussão (clap, chimbal, prato) **bem abaixo do lead**; baixo ~60% do lead. Confira com `--rms`.

**Clima por tela.**
- **Funk é a casa** (a Abertura com gancho é a Home e a referência: samba-funk em chiptune). Sempre tenha uma opção
  funk; variar gênero (ska, marchinha, jazz, 6/8) pode. Não mexa na Abertura sem pedido (`pecas/abertura.mjs` e
  `abertura-gancho.mjs` têm que renderizar idênticas: `cmp` do `.wav`). Momentos bobos = cenas do Modo história.
- **Mudança de tom é "SOBERBA"**: ½ tom ou 1 tom acima na volta final, com virada antes. **Mais complexo > simples**
  (camadas, contracanto, ponte). Nada "chato" repetitivo sem desenvolvimento.
- Partida: **animada** (não alegre, não épica), funk, tema desde o 1º compasso, acelera até o fim de cada tempo;
  cada personagem tem tema próprio e a partida dele cita o motivo (§9).
- Vestiário/Escalação: tenso com balanço ("Disco Cat"). Mercado: o funk com moedas ficou PERFEITO. Rota: "feliz"
  do jeito do Komiku (menor que sobe, timbre quente, 110 a 126 BPM), uma faixa por região; Cerulean em 6/8 "ÓTIMA".
  Sala: jazz de verdade com improviso de 4 em 4 ("obra-prima"). Campeão elaborado e não corrido; Vitória ~5 s;
  Eliminado leve, ~6 s; Derrota curta, "bola pra frente". Natal: melodia de domínio público, romântica.
- **Não gosta**: bigorna (quer outra coisa que marque: palma pesada, aro, cowbell grave), tema misterioso demais em
  tela de decisão, faixa soturna no intervalo, música de festa, polca do MacLeod (batida demais).

**O que ele aprovou, rodada a rodada.**

| Rodada | Aprovado |
|---|---|
| 2 | Abertura v2 (Home), Funk Game Loop no Draft; PokéRogue de fã "gostei de TODAS" pelo groove |
| 3 | Cena boba, Draft, Vestiário, Floresta, Mt. Moon, Cerulean ("ÓTIMA"); Eliminado v3 "perfeita" |
| 4 | o GANCHO SOC-CER-MON como leitmotiv; Eliminado v4 (a v3 mais longa) |
| 5 | pergunta e resposta como regra; Partida v4 como molde; Brock, Misty e Rocket |
| 6 | todas as partidas, Planalto v4, temas de Brock, Misty e Rocket (a régua), Mercado funk v3, Abertura com gancho na Home |
| 7/7b | o clap do 808 (Estrada, Campeão, Rocket) e a receita suave da 7b |
| 8 | Draft, Recompensa, Vitória v2 (gancho), Derrota, Virada, Rota 1 v3, Mt. Moon v2, Cerulean v2, Sala v3 (jazz), Na ponta do pé v2 ("genial"); Escalação voltou pra 8b (menos metálica) e a Derrota com o "toc toc" mais alto |

**Fluxo.** Ele ouve na página de amostras (localhost:8000) e responde tela por tela; mostre sempre a nova, as que
ele marcou (★) e a referência, com antes e depois lado a lado. **Aprovou, entra no jogo na hora**, na branch
`musica-jogo` (`webm` Opus 64 kbps + `mp3` 80 kbps + `.json` em `public/music/`, `loops.mjs` na cópia decodificada a
44,1 kHz, faixa ligada em `src/ui/music-sync.ts`), commit e aviso numa linha, sem perguntar de novo. Produção continua
precisando do "pode subir".

## 3. Pipeline

1. **Ouvir antes de compor**: rode `node scripts/musica/analisar.mjs <faixa>` nas referências que ele marcou
   (andamento, que pode vir dobrado ou pela metade; tonalidade provável; brilho em cruzamentos por segundo, ~450 é
   timbre quente, ~1300 é chiptune; volume). Não dá pra ouvir: diga isso e pergunte o que ele gostou ("o baixo? o
   sino?"). Ex.: a Rota 1 v1 saiu alegre e brilhante demais porque não medi as do Komiku antes.
2. **Uma peça = um arquivo** em `scripts/musica/pecas/<nome>.mjs`: `export const meta = { titulo, tela, lufs? }` e
   `export default function () { ...; return S; }`. Comentário no topo: o pedido, tom, BPM, forma.
3. **Renderizar** (sai fora do repo):
   ```bash
   node scripts/musica/render.mjs [peça ...] --out <pasta>   # .wav + .ogg a −16 LUFS (jingle: meta.lufs = −15)
   node scripts/musica/render.mjs <peça> --rms --so-wav      # volume de cada faixa, pra equilibrar a mistura
   node scripts/musica/loops.mjs <pasta>                      # confere a emenda de cada loop no .ogg (sai 1 se falhar)
   ```
   Cada arquivo sai com um `.json`: trechos (`nome`, `intensidade`, `loop`, `inicio`/`fim` em segundos e amostras a
   44,1 kHz, `bpm`, `compassos`). No jogo: `AudioBufferSourceNode` com `loopStart`/`loopEnd` do trecho; trocar de trecho
   na virada da volta (a página de amostras faz igual, botões por trecho).
   Lote grande: `scripts/pesado.sh node scripts/musica/render.mjs` (fila pesada, regra 7).
4. **Conferir pelos números** (§6) e só então montar a página de escuta: um `index.html` no scratchpad com players por
   tela, autor, licença, duração, ★ do que ele gostou. Rodadas antigas em `<details>`.
5. **Doc**: atualizar `docs/planos/pesquisas/musica.md` (retorno dele, o que mudou, mapa tela → faixa, perguntas).
6. **Pro jogo (quando ele mandar)**: Opus 64 kbps (`.webm`) + mp3 de reserva; `src/game/music.ts` ao lado do
   `audio.ts`, no mesmo `ZZFX.audioContext`, sem importar `phaser`; volume "Música" nas Configurações; carregar sob
   demanda depois do `load` da Home. Detalhes na seção 4 do doc.
7. **Troca de tela "só encaixando no tempo"** (22/10/2026, `src/game/music.ts`): a tela troca na hora; o áudio espera
   a linha do compasso da faixa que sai se ela chega em até 0,7 s, senão a próxima batida (`swapWait`). Andamentos que
   casam (até 4% de diferença, ou o dobro/metade: `sameTempo`) trocam na batida e a faixa nova entra **na mesma
   batida do compasso** (`phaseOffset`). A nova sobe em 30 ms, a velha decai (constante de 60 ms). Grade em
   `gridOf` (12/8 = 12 linhas, pulso de 3). Sem faixa saindo (1º som, depois do silêncio): fade de 250 ms. Troca de
   trecho (nível da partida) na linha do compasso, num ganho novo (a velha some em 10 ms, sem estalo); vale o último
   pedido. A tela `match` não silencia a música: a partida pede a dela e a troca da Escalação também cai no tempo.
8. **Virada no placar: tentada e recusada** (22/10/2026). 1ª versão: vinheta por cima da partida com a música
   abaixando ~10 dB (`virada.mjs`, `virada-pressao.mjs`): o Miguel não gostou. 2ª ideia (breque + virada de bateria +
   torcida + subir de nível) foi descartada antes de entrar: a música da partida só segue os trechos pelo minuto e
   pela pressão. Não proponha de novo sem ele pedir.

## 4. O sequenciador (`scripts/musica/synth.mjs`)

| Peça | Uso |
|---|---|
| `new Song({ bpm, bars, barLen, swing, tail, loopFrom, masterAt, secoes })` | `barLen` 16 = 4/4, 12 = 3/4 ou 6/8, 8 = 2/4. `loopFrom` n = intro (toca uma vez, cortada) + loop do n ao fim. `secoes: [{ nome, de, loop, intensidade }]` = vários trechos num arquivo: cada nota é do trecho em que começa, cada loop dobra o próprio rabo no seu começo, trecho do meio sem loop é cortado com 5 ms de saída, o último guarda o rabo. Mapa em `S.mapa` depois do `render` |
| `S.part(nome, I.x, { pan, gain, echo: { rows, fb, mix }, rev, drum, gainAt, corte })` | uma faixa; `rev` = envio pro reverb; `gainAt(seg)` = camada; `corte` (Hz) = passa-baixa suave de 12 dB/oitava sem ressonância (rodada 8b: o jeito de esquentar um timbre) |
| `mel(P, compasso, ['E5:2 r:2 C5+E5:4!'], { shift, harm, vel })` | melodia por compasso (confere a soma); `shift` modula; `harm: thirdBelow(MAJOR(0))` faz a segunda voz |
| `drum(P, compasso, n, 'X..xo...', { pitch })` | X forte, x normal, o fantasma |
| `bass(P, compasso, 'Dm7', '0:2 8:1~ 5:2 s:2 ...')` | 0 tônica, 3 terça, 5 quinta, 8 oitava, s sétima/sexta, l quinta abaixo, 7 décima |
| `stabs`, `arp`, `padChord`, `voicing`, `transpose`, `layer` | acordes curtos, arpejo, acorde longo, modulação, envelope de camada |
| `GANCHO.em({ grau, tom, oitava, menor })`, `GANCHO.palmas` | o leitmotiv do Soccermon num compasso, e as palmas que respondem |
| `bpmAt`, `swingUnit`, `masterAt` (no `Song`) | acelerar por compasso, swing de colcheia, volume geral no tempo |
| `partidaBase(cfg)` em `partida-base.mjs` | a Partida v4 como molde (rodada 6: devolve `{ '1t', '2t' }` em trechos nivel1-3, virada, pressao, fim): passe tom, acordes, tema, riff, timbres, padrões, `cita` (motivo do tema do personagem) e `extra` (`barLen: 12` pra 12/8) |
| `I.clap`, `I.palmas` | palma de verdade (3 pessoas) e a torcida (9): função, não parâmetros do ZzFX; `pitch` desce a faixa (palma pesada) |
| `I.clap808` | o clap clássico do 808 (rodada 7): amostra em `scripts/musica/amostras/clap-808.wav`, "TR08_Clap01" de Karman_Lyne no [Freesound](https://freesound.org/people/Karman_Lyne/sounds/519305/), CC0 1.0. `amostra(arquivo)` no `synth.mjs` lê qualquer WAV 16 bit mono 44,1 kHz dessa pasta; `pitch` reamostra. `I.clap808.com({ ganho, corte, sala, tom, atraso })` = o mesmo clap tratado (rodada 7b). Amostra nova: só CC0 ou CC BY (crédito no doc), numa pasta própria ao baixar |
| `I.coin`, `I.anvil`, `I.block` | moeda (ZzFX clássico), bigorna (ele não gostou), bloco de madeira |
| `I` | paleta: lead (quadrada), pulse (25%), thin (12,5%), counter (triangular), slap, chank, clav, stab, organ, epiano, pizz, bassoon, bell, strings, pad, brass, tuba, piccolo, agogo, block, whistle; bateria kick, snare, clap, hat, ohat, shaker, sleigh, crash, tom, timp |

## 5. Teoria aplicada (o que funcionou aqui)

**Trilha icônica (rodada 4).** O que faz um tema grudar, pela pesquisa de *earworms* (Jakubowski et al., 2017,
*Psychology of Aesthetics*): andamento mais rápido e dançável, contorno comum (sobe na 1ª frase, desce na 2ª) e um
intervalo incomum (salto inesperado ou nota repetida a mais). Koji Kondo (Mario, Zelda): o ritmo vem primeiro (o que o
jogo "faz" com o corpo) e o tema tem que aguentar horas de repetição. Somando os clássicos (Pokémon, Mario, Zelda,
Sonic, Tetris, Undertale, vinhetas de futebol na TV): **motivo de 3 a 5 notas com ritmo próprio**, cantável sem
instrumento, que **volta em outras músicas** (leitmotiv: Undertale faz isso em quase toda faixa) e tem **timbre de
assinatura**. Nosso motivo: o **GANCHO** (`synth.mjs`), G5-E5-C6 em 3-3-2 ("Soc-cer-MON!", desce uma terça e salta
uma sexta) com palmas respondendo. Já está na Abertura com gancho, na Partida v4 (metais no fim de cada tempo, em
menor) e no Planalto v2 (metais graves). `GANCHO.em({ grau, tom, oitava, menor })` leva pra qualquer tom.

**Groove (funk e samba-funk).** Tudo em semicolcheias. Bumbo no 1 e antecipado (linha 6 ou 10), caixa no 2 e no 4 com
fantasmas (`o`) entre elas, chimbal em 16 avos com o acento do partido-alto (`x.xx.x.xx.xx.x.x`), agogô em duas
alturas. Baixo slap: tônica, oitava curta (`8:1~`), pausa, quinta, sétima. Guitarra abafada (`chank`) e acordes no
contratempo (linhas 2, 6, 10, 14). Swing de 0,08 a 0,15.

**Harmonia que soa "Soccermon".** Vamp dórico (Dm7–G7) pra partida; I–vi–IV–V com sétimas pra Home; acordes
emprestados do menor na ponte (Si♭maj7, Lá♭maj7 em Dó) dão o "uau"; dominante com 9ª menor (B7b9) e sus4 dão tensão
sem ficar sombrio; lídio (Mi maior em Ré) pra água e céu; menor com V7 (A7 em Ré menor) pra caverna.

**Melodia.** Um motivo rítmico curto que volta (a Abertura e a Partida usam o mesmo "x x X x": família). Pergunta e
resposta entre lead e contracanto. Contracanto em notas longas (guia de terças e sétimas) por baixo de melodia rápida;
segunda voz em terças diatônicas no refrão. Não preencher tudo: pausas de 2 a 4 linhas respiram.

**Forma.** Intro curta (2 a 4 compassos) fora do loop → A → A com contracanto e arpejo → ponte (outra harmonia, meio
tempo) → refrão (registro mais alto, mais camadas) → A final. Jingle: rufar, frase, subida, acorde longo.

**Modulação (ele ama).** Subida de 1 tom ou meio tom no começo de uma seção nova (o "truck driver's gear change"),
com virada de caixa ou apito no compasso de antes, ou um V7 do tom novo (A7 antes de Mi dórico). Em peça longa: duas
subidas (Partida: +2 e depois +1). Em loop, a volta pro tom original é aceitável se a última seção termina num corte.

**Loop sem costura.** `loopFrom` soma o rabo (eco, reverb, nota soando) no começo do loop; termine num acorde que leva
ao primeiro (V → I, ou um compasso de virada no tom do começo depois de uma subida de tom). Intro fica antes do
`loopFrom` e é cortada (o rabo dela não pode voltar a cada volta). Arquivo em Opus/Vorbis (mp3 tem silêncio de
codificador). Conferir sempre com `loops.mjs` (emenda < 1 = mais lisa que as 0,1% piores passagens da própria música).
Na troca entre trechos (nível 1 → 2) o rabo que soa é o do trecho novo: no jogo, crossfade de ~30 ms se estalar.

**Acelerar.** `new Song({ bpmAt: (compasso) => bpm })`: o andamento muda na virada do compasso (Partida v4: 120 →
136 no 1º tempo, 124 → 142 no 2º). No jogo, ou camadas renderizadas em 3 ou 4 andamentos trocadas na virada, ou
`playbackRate` (sobe o tom junto: +6% = +1 semitom, que casa com a subida de tom que ele ama).

**Swing de jazz.** `swingUnit: 8` balança as colcheias (0,33 = tercina); o padrão (16) balança as semicolcheias do funk.

**Música adaptativa (partida).** Camadas verticais (vertical layering, Winifred Phillips): todas as faixas com o mesmo
tamanho, tocando juntas, cada uma com volume 0 até a vez dela; o jogo liga pelo minuto, placar e pressão, sempre na
virada do compasso. Subida de tom = outro conjunto de camadas já transposto (troca horizontal na virada). A música só
lê o estado da partida, nunca escreve (motor determinístico).

**Mistura.** Lead e baixo perto do mesmo volume RMS é baixo alto demais: baixo ~60% do lead. Caixa e tímpano estouram
fácil. Peça que cresce: volume geral por etapa (`masterAt`) além das camadas. Comparar sempre a −16 LUFS (jogos medidos
ficam perto de −18; console pede −24: no jogo a música fica abaixo de efeitos e torcida).

## 6. Conferir antes de mostrar

- `npx biome check scripts/musica` limpo.
- `--rms`: nenhum instrumento acima do lead (menos bumbo em pico), nenhum inaudível (rms < 0,01) sem querer.
- Afinação: `mel` já falha se o compasso não fecha; nota fora do acorde é escolha, não acidente.
- Crescendo: volume médio por trecho (`ffmpeg -ss X -t 5 -af volumedetect`) subindo de verdade.
- Abertura idêntica: `cmp` do `.wav` contra a versão aprovada se mexer no `synth.mjs`.
- Diga o que foi conferido pelos números e o que só o ouvido dele decide.

### Níveis no jogo (22/10/2026)

Configurações no padrão (geral 0,6, música 0,4, canais 1), medidos como saem: `npx tsx scripts/niveis-audio.ts`
(ebur128; ganhos base em `GAIN`, `src/game/audio.ts`). O grito é **tempero**: atrás da música (o Miguel achou alto).
O `audio.test.ts` barra grito acima da música.

| Canal | Alvo (LUFS) | Antes | Agora | Ganho base |
|---|---|---|---|---|
| Música (loops, integrado; M máx) | −28 (picos −25) | −28,4 (−25,3) | igual | geral × música; arquivo a −16 |
| Gritos (M máx, mediana do estilo `latest`; p90) | −30 (p90 −28) | −17,3 (−15,7) | −29,9 (−28,3) | `GAIN.cry` 0,55 → 0,13 |
| Efeitos ZzFX (M máx: apito 21, gol 24, chute 26, defesa 30) | −21 a −30 | igual | igual | `GAIN.sfx` 0,35 |
| Apito e torcida gravados (M máx) | −19 a −21 | igual | igual | `GAIN.sample` 0,7 |

Os controles das Configurações multiplicam por cima (0 a 1: dá pra baixar, não passar do padrão). Faixa nova: meça
com o script e confira que o grito fica uns 1,5 dB abaixo do integrado da música. Draft (e o do Duelo) sem grito:
escolher é silencioso, só a música.

## 7. Armadilhas (custaram tempo)

- **Parâmetro em branco do ZzFX é `null`, não 0.** Com 0 o `release` some e a caixa sai muda (a v1 não tinha caixa).
- **Saturar antes de normalizar** destrói a mistura (−5 LUFS de distorção). Normalize pelo pico e depois `tanh` leve.
- **`loudnorm` de uma passada é compressor** e achata crescendo. O `render.mjs` mede e aplica ganho fixo (`volume`).
- O JSON do `loudnorm` sai no stderr, com lixo depois: `spawnSync(...).stderr` e cortar entre `{` e `}`.
- **O `filter` do ZzFX ressoa** (biquad com Q 2; o corte real é 2× o valor): baixar ele pra "abafar" põe um pico em
  2 a 5 kHz e soa MAIS metálico (a 1ª tentativa da Escalação 8b subiu a banda de 2 a 4 kHz). Pra esquentar, use o
  `corte` da faixa e meça as bandas: `ffmpeg -af highpass=f=2000:poles=2,highpass=f=2000:poles=2,volumedetect`
  (e 4000, 8000) contra o total, antes e depois.
- `ZZFX.buildSamples` desafina 5% por padrão (`randomness`): o sequenciador zera.
- Importar `zzfx` no Node cria `AudioContext`: o `synth.mjs` põe um dublê antes do `import()`.
- O gerador de "humanizar" tem semente por peça; se for global, a ordem das peças muda o resultado.
- Não dá pra ouvir daqui. Fiz escolhas por nome, duração e curva de tom (cruzamento por zero) e errei o clima de
  várias (soturnas no intervalo). Melhor: poucas candidatas, explicadas, e perguntar.
- Fontes: FreePD fechou em 2025; OpenGameArt às vezes recusa conexão; itch.io baixa pelo fluxo `download_url` → `file/<id>`;
  Free Music Archive tem `fileUrl` no `data-track-info` da página do álbum e a licença no link CC da página.
- Melodia de domínio público ("Noite Feliz", "Jingle Bells", "Deck the Halls") pode; arranjo de outra pessoa
  dessas melodias não (o arranjo tem dono). Escreva o nosso.
- `stabs` e outros ajudantes precisam estar no `import`: o Biome não acusa variável global faltando em `.mjs`.
- Afirmação sobre jogo famoso sem fonte: confira (o "Balatro com 5 variações" não achei confirmado; um tópico da Steam
  diz que é uma faixa que muda um pouco por tela).

## 8. Referências pra estudar

- **Jogos**: Balatro (um tema que muda pouco por tela), Slay the Spire (uma por ato), Pokémon Mystery Dungeon e o
  próprio PokéRogue (groove de bioma, só pra aprender, nunca copiar), Celeste (Lena Raine: camadas e modulação),
  Shovel Knight (Jake Kaufman: chiptune com groove e arranjo cheio), Undertale (Toby Fox: leitmotiv em várias telas),
  FTL (Ben Prunty: versão calma e de combate da mesma faixa), Mario Strikers e Inazuma Eleven (futebol arcade com
  música), Rocket League e EA FC (menus com música, partida com estádio).
- **Compositores de chiptune**: Hirokazu Tanaka, Yuzo Koshiro, Tim Follin, Chipzel, Anamanaguchi, Danimal Cannon,
  Komiku (CC0), Eric Skiff (CC BY).
- **Teoria**: Winifred Phillips, *A Composer's Guide to Game Music* (camadas verticais, ressequenciamento horizontal);
  MusicRadar sobre modulação ("truck driver's gear change"); ASWG-R001 (loudness em jogos).
- **Ferramentas**: ZzFXM (MIT, o formato do ZzFX), BeepBox/JummBox (MIT, a música inteira no link), FamiStudio (MIT,
  NES, exporta WAV/OGG). O nosso `synth.mjs` cobre o que elas fazem e é texto (dá pra ajustar pelo que ele disser).

## 9. Partidas por personagem (rodada 5)

Molde: `partidaBase()` (a Partida v4). Cada um muda tom, levada, timbre e um elemento de assinatura; a forma
(acelera em cada tempo, sobe de tom, SOC-CER-MON com palmas no fim de cada tempo) fica. Personagem novo = primeiro o
`tema-<nome>.mjs` (tema próprio com `MOTIVO` de 2 compassos no tom da partida, último acorde levando à tônica), depois a
partida com `cita: MOTIVO`.

| Personagem | Ideia | Estado |
|---|---|---|
| Brock (pedra) | Mi menor, meio-tempo pesado, baixo sujo, metais, taiko | feito (`partida-brock` cita `tema-brock`) |
| Misty (água) | Si menor em 12/8, sino bembé, sinos em onda, bolhas | feito (`partida-misty` cita `tema-misty`) |
| Equipe Rocket | Dó menor, funk de espionagem, órgão cromático, nota blue | feito (`partida-rocket` cita `tema-rocket`) |
| Lt. Surge (elétrico) | Fá# menor, 140+ BPM, arpejo de 16 avos, pulso 12,5%, "choque" (slide) | proposta |
| Erika (planta) | samba-bossa animado, flauta e marimba, Ré mixolídio | proposta |
| Koga (veneno, ninja) | escala in-sen, taiko, flauta com slide, Lá frígio | proposta |
| Sabrina (psíquico) | tons inteiros, eco longo, viradas em 7/8, Si♭ lídio | proposta |
| Blaine (fogo) | salsa/mambo, metais, cowbell, montuno, Dó menor | proposta |
| Giovanni (chefe Rocket) | o riff da Rocket mais lento e pesado, órgão de igreja, Fá# menor | proposta |
| Blue (rival) | a partida em maior com rock, três subidas de tom, Mi maior | proposta |
| Elite dos Quatro | Lorelei (gelo, celesta, 12/8), Bruno (taiko e metais), Agatha (órgão e slide), Lance (épico com coro) | proposta |

## 10. As OSTs que o Miguel ama e o que tirar delas (22/10/2026)

Ele citou Inscryption, Persona, Undertale e Sonic Mania. O que torna cada uma marcante:

| OST | Mecânica | No Soccermon |
|---|---|---|
| **Undertale** (Toby Fox) | Poucos leitmotivs disfarçados na trilha toda (outro andamento, modo, timbre); o final costura os temas de todo mundo; a música reage às escolhas (rota genocida lenta e desafinada); silêncio como arma | O SOC-CER-MON é o leitmotiv do jogo, e cada personagem tem um motivo. **Final do Planalto que costura o gancho com os motivos dos líderes enfrentados naquela Rota.** Música da eliminação diferente se caiu cedo ou na Final |
| **Sonic Mania** (Tee Lopes) | Ato 1 e Ato 2: mesma melodia, outro arranjo; harmonia jazz-fusion (7ª e 9ª), baixo slap que é melodia; timbre FM do Mega Drive com produção moderna | **Estrada da Vitória como tema-mãe, rearranjado por região** (Rota 1 de dia, Mt. Moon na caverna, Cerulean na água). Acordes com extensão e baixo melódico nas partidas |
| **Persona** (Shoji Meguro) | Um gênero de identidade (acid jazz e J-pop); variação por contexto (chuva, noite, estação); faixa que repete muito é tranquila e vive de groove; menu e batalha viram hino | **Copa do Dia com versão de dia e de noite, ou uma por dia da semana**, do mesmo tema. O funk e o jazz aprovados viram "o som Soccermon". Telas longas, sem lead cansativo |
| **Inscryption** (Jonah Senzel) | Camadas entram conforme o jogador progride; o mesmo tema troca de roupa com o estilo de cada ato; o som do mundo vira instrumento (madeira, carta, balança) | **Camadas na partida pelo placar**: metais entram quando você está ganhando, o arranjo fica seco quando está perdendo, a torcida canta no tempo. Sons do jogo como instrumento (bola, apito, rede, cartas, moedas), como no Ginásio vazio |

O que vale pra toda peça nova:
1. **Gancho nos 2 primeiros compassos**, cantável e com ritmo próprio.
2. **Leitmotiv com transformação**: o mesmo motivo muda de andamento, modo e instrumento conforme o contexto, e a recompensa vem quando os temas se juntam.
3. **Paleta própria**: funk/jazz, clap 808 suave, baixo melódico e timbres quentes.
4. **A música muda com o estado do jogo**, por camadas verticais e trechos horizontais, sempre no tempo (batida ou compasso).
5. **O som do jogo vira instrumento.**
6. **Silêncio e contenção nos momentos certos**: antes do último pênalti, no apito de uma Final perdida.
7. **Contar uma história** (veja a seção 2): é o que o Miguel mais quer.
