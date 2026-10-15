---
name: soccermon-assets
description: Como criar assets de divulgação do Soccermon (trailer, clipes de gameplay, logo, capas, prévia do link, avatar, banner, textos de post) e o gosto do Miguel pra eles. Use sempre que for gravar lance do jogo, montar/alterar vídeo no HyperFrames, mexer no logo, gerar imagem de marketing, escolher música/som, escrever post de lançamento ou subir assets pro Drive.
---

# Assets do Soccermon (vídeo, logo, marketing)

Aprendido no lançamento da beta aberta (15/10/2026, trailer "Temos que chutar!"). Leia inteiro antes de começar:
metade disto são armadilhas que custaram horas.

## O que existe e onde

| Peça | Fonte (no repo) | Como gerar |
|---|---|---|
| Trailer 16:9 | `trailer/montagem/index.html` (HyperFrames + GSAP) | `trailer/.logs/render.sh` (ver "Render") |
| Trailer 9:16 | `trailer/vertical/index.html` (pasta própria; `midia/` é link pra `../montagem/midia`) | `PROJ=vertical` no render |
| Mídia do trailer (fora do git) | `trailer/montagem/midia/` | `trailer/montagem/preparar.sh` + `node quadra-vazia.mjs` + `node recortes.mjs` + `node recortes2.mjs` (com `npm run dev` ligado) |
| Sons gerados da abertura | `trailer/montagem/abertura-sons.sh` | chamado pelo `preparar.sh` |
| Sons gravados (CC0) | `trailer/sons/` + `CREDITOS.md` | — |
| Clipes de gameplay | `scripts/trailer-hunt.ts`, `scripts/trailer-capture.mjs`, `scripts/trailer-peaks.ts`, `scripts/trailer-uau.mjs`, cenas em `src/ui/trailer-scenes.ts` | ver "Gravar lances" |
| Logo | `trailer/arte/logo/hibridos.py` (função `evolucao`), letras de `gerar.py`/`titulos.py` | `python3 hibridos.py`; PNG com `node render-svg.mjs <svg>` (`FUNDO=`, `ESCALA=`) |
| Capas, prévia do link, avatar, banner | `docs/marketing/arte/arte.html` (+ `src/`) | `node docs/marketing/arte/render.mjs` → `docs/marketing/*.png` e `public/og-image.jpg` |
| Textos dos posts | `docs/marketing/posts.md` | à mão |
| Ícones do jogo / favicon | `public/assets/ui/icone.svg`, `icon-*.png`, `apple-touch-icon.png` | a partir do `icone.svg` do logo |

Fora do git (pesado ou com direito de terceiros): música, clipes, vídeos finais. No celular ficam em
`/sdcard/Movies/Soccermon-trailer/` (clipes `1-…` a `8-…` e `final/`); cópia no Drive do Miguel, pasta
**"Soccermon trailer"** (Trailers/, Marketing/, Logo/, Midia-pro-PC/ com música + clipes).

## O gosto do Miguel (decidido com ele; respeite)

- **Identidade:** logo "Evolução": SOCC em silhueta branca, ERMON dourado 3D, o O é uma **carta holográfica com a
  bola**, raios da tela de evolução atrás. Tagline **"Temos que chutar!" / "Gotta kick 'em all!"**. Fonte de texto
  dos vídeos: Galmuri11 Bold (pixel). Fundo de marca: azul-noite radial `#2a3a7a → #070a18` + raios cônicos.
- **Taglines/textos:** ele detesta frase "de IA" (tricolon tipo "Monte. Escale. Evolua."). Quer humor de fã,
  paródia de bordão, piada com Pokémon ("O Snorlax fecha o gol", "O Ditto joga em todas as posições").
- **Logo:** mostrar 3 conceitos bem diferentes, depois misturas; ele escolhe. Minimalista demais foi rejeitado
  ("tão simples, queria um negócio mais criativo").
- **Clipes de jogo:** sem nomes em cima dos Pokémon e sem textos do jogo (o texto vem da edição). Versão "uau":
  câmera lenta de verdade no pico, flash, tremida.
- **Golpes:** letreiro "X usou Y!" **colado em quem usa o golpe** (anel no Pokémon + faixa diagonal do jogo com o
  retrato PMD), nunca num canto ("o olho tem que viajar bastante"). Mostrar o golpe sendo **lançado** e depois a
  bola entrando; quadro de impacto invertido + tremida no gol.
- **Menus:** **nada de câmera passeando por print** ("parece amador, ficam vazando coisas"). Recortar o
  componente certo direto do DOM (print do elemento, 3x) e mostrar em **cortes secos** na batida, sobre o fundo de
  marca. Ele quer **mostrar bastante coisa** (cartas raras, campeão, sinergias, substituição).
- **Abertura:** precisa de "molho": som + escalada de tensão. A aprovada: caixa do jogo digitando "Um MEWTWO
  selvagem apareceu!" (bipes), transição de batalha do Red/Blue, olho do Mewtwo acendendo, "Vai! PIKACHU!" com
  faíscas, closes alternando que aceleram **sem ficar rápido demais** (0,7 / 0,6 / 0,5 / 0,4 s: menos que isso ele
  achou rápido), silêncio com a bola parada, **apito**, e só então a música.
- **Sons:** sintetizado soa ruim ("esse apito tá muito ruim"): use gravação real CC0. **Um** apito só.
- **Animação de personagem:** sprite parado deslizando é "tosco". Use animação que se mexe (ex.: Charizard PMD
  `Walk` batendo as asas, de lado na curva e de frente no mergulho).
- **Música:** ele escolhe (foi o "Trainer Battle Remix" do Bliitzit). Sempre creditar no fim do vídeo e nos posts.
  Cortes caem na batida.
- Iteração: render de rascunho → ele assiste no celular → ajusta. Ele avalia vendo o vídeo, não lendo a descrição.

## Gravar lances do jogo

1. Time da cena em `src/ui/trailer-scenes.ts` (o último titular é o capitão). Caçar seeds:
   `npx tsx scripts/trailer-hunt.ts --cena <cena> --n 800 --top 8` (pontua evolução cedo, gol de golpe, jogada,
   Ditto+combo, pênalti; cena `raio` = gol do Pikachu com Thunder/Thunderbolt). Gol de golpe é raro: muitas seeds.
2. Abrir no navegador: `?demo=trailer&cena=<cena>&seed=<seed>` (paridade com o motor testada).
3. Picos (câmera lenta e flash): adicionar em `CLIPS` de `scripts/trailer-peaks.ts` → `trailer/picos.json`.
4. Gravar normal + lento e montar a versão uau (modelo em `trailer/.logs/clipe8.sh`):
   `node scripts/trailer-capture.mjs --cena X --seed Y --de A --ate B --largura 968 --out <dir>-n`,
   o mesmo com `--vel 0.5` só no trecho do pico (`<dir>-l`), e
   `node scripts/trailer-uau.mjs --normal <dir>-n --lento <dir>-l --nome <nome> --out <mp4>`.
   `--modo pagina` só quando precisa do HTML por cima (tela de evolução).
5. Achar o instante certo no clipe: folha de contato (`ffmpeg -vf "fps=3,scale=320:-1,drawtext=…%{pts\:hms}…,tile=5x5"`)
   e olhar. O flash detectado por brilho (`signalstats YAVG`) é o do **gol**; o lançamento do golpe vem antes
   (quadra escurece). Medir posição de quem usa o golpe no quadro 1920x1080 pra colar o letreiro.

Captura funciona porque o loop do Phaser fica parado (`game.loop.sleep()`) e cada quadro é `game.step(t, 1000/fps)`
(`window.__soccermonGame`, só no dev). Pra tirar coisas do quadro: `sprite.willRender = () => false` (o jogo
reajusta alpha/visible a cada quadro, então setAlpha não basta). Quadra vazia: `trailer/montagem/quadra-vazia.mjs`.

## HyperFrames (render no Termux) e as armadilhas

- Render: `HYPERFRAMES_BROWSER_PATH=/data/data/com.termux/files/usr/bin/chromium-browser`, `LD_PRELOAD` do
  termux-exec, **`HYPERFRAMES_RENDER_DETACHED=1`** (senão "render_cancelled_parent_exited"), `-w 1`,
  `-q draft` pra rascunho e `-q high` pro final. 47 s 1080p ≈ 12–16 min por vídeo no celular. O aviso EACCES de
  "recordRenderSuccess" é inofensivo.
- Rodar jobs longos com `setsid nohup … < /dev/null &` e log em `trailer/.logs/` (o Termux fecha sem querer).
- **Não existe render de trecho**: pra testar a abertura, copie o `index.html` com `data-duration` menor numa pasta
  temporária com link pra `midia/` e renderize só aquilo.
- `<video>`/`<audio>` com `data-start` **precisam de `id`** (sem id: vídeo congela, áudio some).
- **Uma composição raiz por pasta**: dois HTML com `data-composition-id` na mesma pasta = áudio dobrado. Por isso o
  9:16 mora em `trailer/vertical/`.
- **GIF vira vídeo e perde o tamanho do CSS, e às vezes congela.** Use PNG do 1º quadro, ou troque `src` quadro a
  quadro com `tl.set(el, { attr: { src } }, t)` (determinístico). Folhas PMD são `pal8`: extraia com
  `format=rgba` antes do `crop`, senão perde a transparência.
- **Não use `transform: translate(-50%…)` no CSS de elemento que o GSAP escala/move** dentro de cena com
  `data-start` (o GSAP mede com a cena escondida e o elemento desce). Posicione com left/top/margem.
- `fromTo` repetido no mesmo elemento (flash): `immediateRender: false` em todos, senão o "from" vira estado de
  repouso (tela branca desde o começo).
- Tween de `keyframes` com valores relativos (`"+=14"`) num elemento que outra animação também move **trava** o
  movimento: balanço vai num elemento de dentro (wrapper), caminho no de fora. Centro de sprite não quadrado:
  `xPercent/yPercent: -50` em vez de margem fixa.
- Legenda com `display:flex`: ponha o texto dentro de um `<span>`, senão cada `<b>` vira uma coluna.
- Deslocar o tempo do trailer (abertura mais longa): script que soma D aos `data-start` ≥ limite e aos números
  absolutos do `<script>` (lista explícita); cuidado com números que não são tempo (escala `7.3`) e com regex
  gulosa apagando blocos vizinhos (compare a lista de `id` antes/depois).
- Conferir sempre com folha de contato dos quadros-chave e `volumedetect` nos trechos de áudio (apito audível?).

## Áudio

- Música: `musica-analisar.py` (BPM por autocorrelação + energia por segundo) e `musica-fase.py` (onde cai a 1ª
  batida). Trailer Battle Remix: 178 BPM, compasso 1,348 s. Cortes em múltiplos de compasso/batida.
- Sons reais CC0: buscar no Wikimedia Commons pela API
  (`api.php?action=query&list=search&srsearch=<termo> filetype:audio&srnamespace=6`) e conferir a licença em
  `prop=imageinfo&iiprop=extmetadata` (LicenseShortName). Registrar em `trailer/sons/CREDITOS.md`.
- Gritos: `public/assets/cries/latest/<id>.ogg` (grave/lento: `asetrate=44100*0.6,aresample=44100`).
- Normalizar efeito com `loudnorm=I=-14:TP=-1`; `data-volume` acima de 1 não passa muito do teto.

## Imagens de marketing

- Tudo em `docs/marketing/arte/arte.html`: cada `<section id>` é uma peça no tamanho final; `?lang=en` troca os
  textos; `render.mjs` tira print de cada seção. Tamanhos: og 1200x630, capa 1920x1080 e 1080x1920, avatar
  1080x1080, banner X 1500x500.
- Quadro de jogo como fundo: extrair do clipe (`ffmpeg -ss … -frames:v 1`) e conferir se o Pokémon citado aparece
  no recorte (no 9:16 use `object-position` puxando pro lado dele).
- Logo em SVG: letras construídas por código (sem fonte de terceiros); render com `render-svg.mjs` pelo dev server.

## Textos de post

`docs/marketing/posts.md`: PT e EN por rede (X, Reels/TikTok/Shorts, YouTube, LinkedIn, Reddit/Discord), emoji pode
(é texto de post), sempre "fan game sem fins lucrativos" + crédito da música. Não inventar @ de ninguém: deixar o
Miguel confirmar o perfil.

## Entregar

- Vídeos/imagens grandes pro Drive: o conector do Drive só aceita arquivo dentro da mensagem (inviável pra MB).
  Use **rclone** (`pkg install rclone`; remote `gdrive` já configurado no Termux, preso à pasta "Soccermon
  trailer"): `rclone copy <pasta> gdrive:<subpasta>`, conferir com `rclone check … --one-way`. Se precisar logar
  de novo, quem roda `rclone config create gdrive drive scope=drive root_folder_id=<id>` é o Miguel (`!` no prompt).
- Commit do que é fonte (HTML, scripts, SVG, PNG de marketing); mídia gerada e música ficam fora do git.
- `rm` com variável sempre `"${VAR:?}"` (a checagem de segurança barra o resto). `pkill -f` com o nome do próprio
  script mata o terminal: mate por PID (`pgrep -f "nom[e]"`).
