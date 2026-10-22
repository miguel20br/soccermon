---
name: soccermon-assets
description: Como criar assets de divulgação do Soccermon (trailer, clipes de gameplay, logo, capas, prévia do link, avatar, banner, textos de post) e o gosto do Miguel pra eles. Use sempre que for gravar lance do jogo, montar/alterar vídeo no HyperFrames, mexer no logo, gerar imagem de marketing, escolher música/som, escrever post de lançamento ou subir assets pro Drive.
---

# Assets do Soccermon (vídeo, logo, marketing)

Aprendido no lançamento da beta aberta (15/10/2026, trailer "Temos que chutar!"). Leia inteiro antes de começar:
metade disto são armadilhas que custaram horas.

**Fila pesada (regra 7 do CLAUDE.md):** ffmpeg, render do HyperFrames, gravação de clipe e `render.mjs` de arte vão
por `~/Projects/soccermon/scripts/pesado.sh <comando>` (`flock /tmp/soccermon-heavy.lock`, um pesado por vez). Vídeo
rodando fora da fila deixou testes e build dos agentes 2,5x mais lentos em 19/10.

## O que existe e onde

| Peça | Fonte (no repo) | Como gerar |
|---|---|---|
| Trailer 16:9 | `trailer/montagem/index.html` (HyperFrames + GSAP) | `trailer/.logs/render.sh` (ver "Render") |
| Storyboard (antes de qualquer render) | `trailer/v2/storyboard/` (branch `trailer-2`) | `PRINTS=<pasta> node trailer/v2/storyboard/montar.mjs` (ver "Storyboard antes de renderizar") |
| Trailer 9:16 | `trailer/vertical/index.html` (pasta própria; `midia/` é link pra `../montagem/midia`) | `PROJ=vertical` no render |
| Mídia do trailer (fora do git) | `trailer/montagem/midia/` | `trailer/montagem/preparar.sh` + `node quadra-vazia.mjs` + `node recortes.mjs` + `node recortes2.mjs` (com `npm run dev` ligado) |
| Sons gerados da abertura | `trailer/montagem/abertura-sons.sh` | chamado pelo `preparar.sh` |
| Sons gravados (CC0) | `trailer/sons/` + `CREDITOS.md` | — |
| Clipes de gameplay | `scripts/trailer-hunt.ts`, `scripts/trailer-capture.mjs`, `scripts/trailer-peaks.ts`, `scripts/trailer-uau.mjs`, cenas em `src/ui/trailer-scenes.ts` | ver "Gravar lances" |
| Logo (final, 19/10/2026) | `trailer/arte/logo/final/logo.py` (letras de `gerar.py`) | `python3 trailer/arte/logo/final/logo.py && node trailer/arte/logo/final/publicar.mjs` (copia pro `public/` e pras artes); PNG de conferência com `node trailer/arte/logo/final/render.mjs` |
| Capas, prévia do link, avatar, banner | `docs/marketing/arte/arte.html` (+ `src/`) | `node docs/marketing/arte/render.mjs` → `docs/marketing/*.png` e `public/og-image.jpg` |
| Textos dos posts | `docs/marketing/posts.md` | à mão |
| Ícones do jogo / favicon | `public/assets/ui/icone.svg`, `favicon.svg`, `simbolo.svg`, `icon-*.png`, `apple-touch-icon.png`, `public/favicon.ico` | `publicar.mjs` (o 16 px é desenhado à mão na grade, `arq_icone_16` do `logo.py`) |
| Brand guide | `docs/marca/brand-guide.md` + `docs/marca/index.html` | `node docs/marca/montar.mjs --copiar` (galeria de ícones + cópia em `~/Downloads/soccermon-brand-guide/`) |

Fora do git (pesado ou com direito de terceiros): música, clipes, vídeos finais. No celular ficam em
`/sdcard/Movies/Soccermon-trailer/` (clipes `1-…` a `8-…` e `final/`); cópia no Drive do Miguel, pasta
**"Soccermon trailer"** (Trailers/, Marketing/, Logo/, Midia-pro-PC/ com música + clipes).

## O gosto do Miguel (decidido com ele; respeite)

- **Identidade:** logo final (19/10/2026, "sobre a logo, perfeito"): SOCC branco, ERMON dourado com bloco 3D azul,
  o O é a **carta holo com a bola** (bola de futebol de verdade com faixa e botão dourado). **Vetor limpo:** contorno
  azul-noite firme, cores chapadas, sem degradê nem brilho borrado (o título também). Regras de uso em
  `docs/marca/brand-guide.md`; checklist em `.claude/skills/soccermon-marca/SKILL.md`. Tagline **"Temos que chutar!" / "Gotta kick 'em all!"**. Fonte de texto
  dos vídeos: Galmuri11 Bold (pixel). Fundo de marca: azul-noite radial `#2a3a7a → #070a18` + raios cônicos.
- **Taglines/textos:** ele detesta frase "de IA" (tricolon tipo "Monte. Escale. Evolua."). **Legenda de vídeo =
  2 a 5 palavras em caixa alta dizendo a feature, sem gracinha:** "ESCOLHA 1 DE 3", "ÍCONES RAROS", "FUTSAL 5 CONTRA
  5", "EVOLUÇÕES NO MEIO DO JOGO", "MULTIPLAYER ONLINE", "COPA RANKEADA". No trailer 2 ele cortou as irônicas
  ("CHAMA AQUELE AMIGO QUE DIZ QUE É MESTRE POKÉMON", "ELE EVOLUIU NO MEIO DO JOGO?!": "feitas com IA, irônicas
  demais e com muito texto"). O humor de fã fica pra momentos pontuais (o twist da abertura "…e elas JOGAM
  FUTSAL.", a tagline "Temos que chutar!") e pros posts, nunca empilhado, de preferência paródia de coisa real
  ("ABAIXA QUE É HYPER BEAM"). Método completo: `docs/marca/brand-guide.md`, seção 4. Conferir:
  `python3 -I .claude/skills/soccermon-marca/copy_ia.py --legenda <arquivo>`.
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

## Storyboard antes de renderizar (obrigatório pra vídeo novo)

Aprendido no trailer 2 (19/10/2026; o Miguel aprovou de primeira: "achei perfeito"). **Nenhum vídeo novo é gravado
nem renderizado antes de ele aprovar o storyboard.** Modelo: `trailer/v2/storyboard/` (branch `trailer-2`):
`quadros.html` (um quadro por plano, em HTML), `index.html` (a página que ele abre) e `montar.mjs`
(`PRINTS=<pasta> node trailer/v2/storyboard/montar.mjs` tira PNG de cada quadro e monta tudo em
`~/Downloads/soccermon-<nome>-storyboard/`; abra com `xdg-open` no notebook dele).

1. **Roteiro em texto primeiro** (5 blocos: abertura com "molho", draft, partida, extras, final com logo e tagline),
   aprovado por ele numa mensagem. Depois o storyboard.
2. **Cada plano tem:** número, tempo em **segundos e em batidas** da música (compasso e trecho; reancorar fica fácil
   se a música mudar), um **quadro de referência real** no formato final (9:16 ou 16:9), o texto na tela, o som
   (bipe, apito, golpe, torcida), a transição e de onde veio a imagem.
3. **Quadro real, não desenho:** print headless do jogo de hoje, recortando o componente certo do DOM (3x, como no
   vídeo final), ou um quadro da partida achada com `scripts/trailer-hunt.ts` + `scripts/trailer-capture.mjs`.
   Abertura, final e o que não existe no jogo viram **mock em HTML** com o mesmo visual (caixa do Red/Blue, pacote
   do `CardPack.tsx`), marcado "mock".
4. **No topo:** a duração total e a linha do tempo com os planos em tamanho proporcional (clicáveis).
   **Embaixo:** a tabela dos lances a gravar (plano, cena, seed, trecho em segundos de partida, onde vai câmera
   lenta), os recortes do DOM (atalho `?demo=`/`?lab=` + seletor de cada um) e a lista do que falta decidir, cada
   item com a recomendação.
5. Confira a página no celular (390) e no desktop, sem rolagem lateral. As decisões vão pra ele **em texto**, sem
   travar a sessão (ver `docs/planos/pesquisas/velocidade.md`).
6. Só depois do ok: gravar os lances da tabela e montar no HyperFrames seguindo os tempos do storyboard.

**Pra vertical (Reels/TikTok):** o gancho tem que estar nos primeiros 1–2 s (a abertura não pode demorar a mostrar
algo que se mexe), e textos e logo ficam na área segura: fora dos ~15% de baixo (legenda e botões do app) e da
faixa da direita (curtir/comentar).
**Mas tudo centrado em x 540** (o centro dos raios e das legendas): a área segura limita a largura, não desloca o
centro. No trailer 2 o logo, o pacote e as cartas ficaram em x 490 "pra fugir dos botões" e o Miguel achou
desalinhado (20/10/2026).

**Controle de qualidade antes de entregar** (todo vídeo): folha de contato do vídeo inteiro a 2 quadros/s com a hora
e uma linha vermelha no centro (`ffmpeg -vf "fps=2,scale=180:-1,drawtext=...,drawbox=x=89:y=0:w=2:h=ih:color=red,tile=12x6"`)
e, em tamanho grande, os quadros da tela final. Conferir: centro, nada cortado na borda, quadro vazio entre planos,
texto pequeno demais pro celular, dois elementos iguais sobrepostos, e o ritmo (abertura sem música curta).

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
