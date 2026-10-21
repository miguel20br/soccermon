---
name: soccermon-musica
description: Como compor, arranjar, renderizar e escolher a música do Soccermon (temas próprios em scripts/musica, faixas CC0/CC BY, trilhas de fã do PokéRogue) e o gosto do Miguel pra ela. Use sempre que for criar ou mexer em música de tela (Home, draft, partida, vestiário, Mercado, Rota, campeão, eliminado, Sala, Modo história), jingle, música adaptativa da partida, ou escolher/creditar faixa de terceiros.
---

# Música do Soccermon

Aprendido em 5 rodadas com o Miguel (20 e 21/10/2026). "No geral, as músicas SÓ MELHORAM" (rodada 5). Pesquisa, catálogo de fontes e mapa tela → faixa em
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

## 2. O gosto do Miguel

- **REGRA GERAL (rodada 5, vale pra TODA trilha): pergunta e resposta, e, quando der, uma referência ao tema
  SOC-CER-MON** (o `GANCHO`). Quem pergunta e quem responde: lead e metais, lead e torcida (palmas no ritmo do
  gancho), vibrafone e flauta (jazz, trocando de 4 em 4), fanfarra e torcida. A referência pode ser o gancho inteiro,
  só o ritmo 3-3-2 nas palmas, ou uma citação num solo.
- **Palmas na frente**: abafadas ele não ouve (na Abertura com gancho foram de 2 pra 4 de ganho, com reverb).

- **A Abertura é a referência** ("MUITO boa, esse refrão é bem legal; a vibe meio funk combinou com nosso estilo").
  Samba-funk em chiptune: swing leve, baixo slap sincopado, acordes no contratempo, agogô, ghost notes, refrão em
  terças. Não mexer nela sem pedido (`pecas/abertura.mjs` tem que renderizar idêntica).
- **Mudança de tom é "SOBERBA"**: use em mais músicas (subida de 1 tom ou meio tom na volta final, com virada antes).
- **Mais complexo > simples**: camadas, contracanto, variação, ponte. Os rascunhos de uma voz só ele achou simples.
- **Groove > "só 8-bit"**: o que ele ama no PokéRogue é o groove e a instrumentação, não o timbre de NES.
- **A Partida v4 é o molde** (`scripts/musica/partida-base.mjs`): cada personagem é uma variação dela (lista em §9).
- **Partida ANIMADA** (energia, tensão boa de jogo), não alegre nem esperançosa nem épica; base funk. **Já começa
  animada** (tema desde o 1º compasso, nada grave sozinho abrindo) e **acelera até o fim de cada tempo** (os dois).
- **Vestiário tenso** (hora de estrategizar), mas com balanço (referência: "Disco Cat", Komiku).
- **Funk é a casa.** Ele gosta de variar gênero (ska, marchinha), mas o coração cai pro funk: tenha sempre uma opção
  funk da tela.
- **Mercado**: marchinha/polca um pouco lenta e não alegre demais; reggae se mais rápido; ama a instrumentação de
  "Mt Fox Shop" (BoxCat Games, Si♭ menor pela análise). O Mercado funk ficou PERFEITO: som de caixa registradora e
  moedas bem na frente.
- **Rota**: mapa mais simples = mais feliz, mas "feliz" do jeito do Komiku ("Champ de tournesol", "Fouler l'horizon":
  tom menor que sobe, timbre quente, ~110 a 126 BPM), não alegria de desenho. Uma faixa por região. Cerulean em 6/8
  ficou ÓTIMA. Estrada da Vitória precisa de percussão que marca (taiko 3-3-2, bigorna). Planalto: swing e épico.
- **Campeão** elaborado mas não corrido (v3 = campeão final; a vitória de uma partida é a versão de ~5 s);
  **eliminado** leve, ~6 s (estilo GameOver 3 e 4 do Ninja Adventure).
- Ele **não gosta de bigorna** como percussão; quer "algo que marque" com outro timbre (palma pesada, aro, tambor de
  metal, cowbell grave).
- **Jazz com improviso** = "obra-prima": tema, depois um chorus de solo trocando de 4 em 4 com citação do gancho.
- **Natal**: as valsas românticas com melodia de domínio público ("Noite Feliz", "We Wish You a Merry Christmas")
  e o jazz da Sala com "Jingle Bells"; ele quer usar várias.
- **Sala**: jazz de verdade (swing de colcheia, ii-V, condução); a calma fica com a Village 4. **Natal**: romântico,
  com melodia natalina de domínio público ("Noite Feliz" já entrou) arranjada por nós.
- **Momentos bobos** = Modo história (cenas engraçadas), não partida.
- Ele **não gosta** de: tema "misterioso demais" em tela de decisão, faixas soturnas no intervalo, música de festa,
  faixas "chatas" repetitivas sem desenvolvimento, polca do MacLeod (batida demais).
- Ele escuta tudo e responde tela por tela. Mostre sempre: a nova + as que ele marcou (★) + a referência.

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
   ```
   Lote grande: `scripts/pesado.sh node scripts/musica/render.mjs` (fila pesada, regra 7).
4. **Conferir pelos números** (§6) e só então montar a página de escuta: um `index.html` no scratchpad com players por
   tela, autor, licença, duração, ★ do que ele gostou. Rodadas antigas em `<details>`.
5. **Doc**: atualizar `docs/planos/pesquisas/musica.md` (retorno dele, o que mudou, mapa tela → faixa, perguntas).
6. **Pro jogo (quando ele mandar)**: Opus 64 kbps (`.webm`) + mp3 de reserva; `src/game/music.ts` ao lado do
   `audio.ts`, no mesmo `ZZFX.audioContext`, sem importar `phaser`; volume "Música" nas Configurações; crossfade de
   250 ms; carregar sob demanda depois do `load` da Home. Detalhes na seção 4 do doc.

## 4. O sequenciador (`scripts/musica/synth.mjs`)

| Peça | Uso |
|---|---|
| `new Song({ bpm, bars, barLen, swing, tail, loopFrom, masterAt })` | `barLen` 16 = 4/4, 12 = 3/4 ou 6/8, 8 = 2/4. `loopFrom` dobra o rabo pro começo do loop |
| `S.part(nome, I.x, { pan, gain, echo: { rows, fb, mix }, rev, drum, gainAt })` | uma faixa; `rev` = envio pro reverb; `gainAt(seg)` = camada |
| `mel(P, compasso, ['E5:2 r:2 C5+E5:4!'], { shift, harm, vel })` | melodia por compasso (confere a soma); `shift` modula; `harm: thirdBelow(MAJOR(0))` faz a segunda voz |
| `drum(P, compasso, n, 'X..xo...', { pitch })` | X forte, x normal, o fantasma |
| `bass(P, compasso, 'Dm7', '0:2 8:1~ 5:2 s:2 ...')` | 0 tônica, 3 terça, 5 quinta, 8 oitava, s sétima/sexta, l quinta abaixo, 7 décima |
| `stabs`, `arp`, `padChord`, `voicing`, `transpose`, `layer` | acordes curtos, arpejo, acorde longo, modulação, envelope de camada |
| `GANCHO.em({ grau, tom, oitava, menor })`, `GANCHO.palmas` | o leitmotiv do Soccermon num compasso, e as palmas que respondem |
| `bpmAt`, `swingUnit`, `masterAt` (no `Song`) | acelerar por compasso, swing de colcheia, volume geral no tempo |
| `partidaBase(cfg)` em `partida-base.mjs` | a Partida v4 como molde: passe tom, acordes, tema, riff, timbres, padrões e `extra`; sem nada sai a v4 idêntica (`barLen: 12` pra 12/8) |
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
ao primeiro (V → I). Intro fica antes do `loopFrom`. Arquivo em Opus/Vorbis (mp3 tem silêncio de codificador).

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

## 7. Armadilhas (custaram tempo)

- **Parâmetro em branco do ZzFX é `null`, não 0.** Com 0 o `release` some e a caixa sai muda (a v1 não tinha caixa).
- **Saturar antes de normalizar** destrói a mistura (−5 LUFS de distorção). Normalize pelo pico e depois `tanh` leve.
- **`loudnorm` de uma passada é compressor** e achata crescendo. O `render.mjs` mede e aplica ganho fixo (`volume`).
- O JSON do `loudnorm` sai no stderr, com lixo depois: `spawnSync(...).stderr` e cortar entre `{` e `}`.
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
(acelera em cada tempo, sobe de tom, SOC-CER-MON com palmas no fim de cada tempo) fica.

| Personagem | Ideia | Estado |
|---|---|---|
| Brock (pedra) | Mi menor, meio-tempo pesado, baixo sujo, metais, taiko | feito (`partida-brock`) |
| Misty (água) | Si menor em 12/8, sino bembé, sinos em onda, bolhas | feito (`partida-misty`) |
| Equipe Rocket | Dó menor, funk de espionagem, órgão cromático, nota blue | feito (`partida-rocket`) |
| Lt. Surge (elétrico) | Fá# menor, 140+ BPM, arpejo de 16 avos, pulso 12,5%, "choque" (slide) | proposta |
| Erika (planta) | samba-bossa animado, flauta e marimba, Ré mixolídio | proposta |
| Koga (veneno, ninja) | escala in-sen, taiko, flauta com slide, Lá frígio | proposta |
| Sabrina (psíquico) | tons inteiros, eco longo, viradas em 7/8, Si♭ lídio | proposta |
| Blaine (fogo) | salsa/mambo, metais, cowbell, montuno, Dó menor | proposta |
| Giovanni (chefe Rocket) | o riff da Rocket mais lento e pesado, órgão de igreja, Fá# menor | proposta |
| Blue (rival) | a partida em maior com rock, três subidas de tom, Mi maior | proposta |
| Elite dos Quatro | Lorelei (gelo, celesta, 12/8), Bruno (taiko e metais), Agatha (órgão e slide), Lance (épico com coro) | proposta |
