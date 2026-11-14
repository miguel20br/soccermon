---
description: Pesquisa de como produzir o trailer de lançamento.
---

# Pesquisa: trailer de lançamento feito pelo Claude (Opus 5.5) — 15/10/2026

Pesquisa pedida pelo Miguel antes de produzir o trailer da beta aberta. Complementa
[divulgacao-trailer.md](divulgacao-trailer.md) (roteiro, tons de LinkedIn/X). Fontes no fim; o que vem de blog e
não de documentação oficial está marcado como "relato".

## 1. O que o Opus 5.5 faz de verdade com vídeo

- Lançado em **22/09/2026**. A Anthropic destaca código longo e agentes; vídeo não aparece no anúncio oficial,
  mas a página cita que, num teste de criar jogo com um prompt, ele "teve a maior nota em gráficos e acabamento".
- **Ele não gera vídeo nem áudio direto.** O vídeo sai de **código**: o Claude escreve a animação (HTML com
  CSS/GSAP/three.js, ou React com Remotion), um navegador headless renderiza **quadro a quadro** e o ffmpeg junta
  em MP4. Edição é por conversa ("deixa a 2ª cena mais lenta", "troca o laranja por azul") e ele re-renderiza.
- Relatos: um showreel de 15 s em ~15 min; vídeos de 30–60 s levam de 30 min a mais de 1 h e gastam bastante do
  limite de uso. Pontos fracos citados: seres vivos desenhados por ele ficam estranhos, iluminação estourada.
  **Pra nós isso não pesa:** os Pokémon vêm dos sprites e da gravação do jogo, não desenhados por ele.
- Usar **esforço alto** no vídeo final (o padrão é médio); esforço menor serve pra ajustes pequenos.

## 2. Ferramentas (as 3 que importam)

| Ferramenta | O que é | Instalar | Pra nós |
|---|---|---|---|
| **HyperFrames** (HeyGen, Apache 2.0) | Composição em HTML com trilhas (`data-start`, `data-duration`), GSAP/CSS/Lottie/three.js, `<video>` e `<audio>` na timeline, transições com shader, render determinístico (mesma entrada = mesmo vídeo) | `npx skills add heygen-com/hyperframes` ou plugin `claude plugin marketplace add heygen-com/hyperframes` | **Recomendado.** Testado neste celular: renderizou 10 s em 1080p30 em 34 s (com `HYPERFRAMES_BROWSER_PATH` apontando pro Chromium do Termux) |
| **Remotion** (React) | O mais usado; skills oficiais desde jan/2026; `/remotion:remotion-create` | `claude plugin marketplace add remotion-dev/claude-code-plugin` + `claude plugin install remotion@remotion` | Ótimo, mas é um projeto React à parte e o renderizador baixa Chrome que não roda no Android: melhor no PC. Licença grátis só pra pessoa física/empresas pequenas |
| **ffmpeg** | Cortar, juntar, legendar, normalizar áudio, exportar 9:16/4:5 | já instalado aqui | Pós-produção e versões por rede social |

**Packs de skills úteis:**
- `charlie947/motion-graphics-skills` (`npx skills add charlie947/motion-graphics-skills`): 15 skills, entre elas
  `brand-intake` (cria `brand.md`/`MOTION.md` que as outras leem), `launch-video` (30–45 s), `title-sequence-3d`,
  `reel-export` (1080×1920). Regras boas que dá pra copiar: gancho nos 3 primeiros segundos, nada de "defaults"
  batidos (texto digitando, brilho, bounce, gradiente roxo→azul), animar "em dois" (segurar 2 quadros a 24 fps),
  conferir um quadro do meio de cada cena antes de exportar, **só assets reais** (nada redesenhado de memória).
- `EveryInc/product-launch-video`: skill + projeto Remotion pra lançamento de 15–30 s. Fluxo: brief → **storyboard
  em tabela antes de qualquer código** → cenas → render → **4 "críticos" em paralelo** (design, leitura, ritmo,
  marca) → MP4 + GIF + legenda pro X e LinkedIn. Produto na tela nos 3 primeiros segundos; texto legível em 720p;
  legenda queimada pra quem vê sem som.
- `wilwaldon/Claude-Code-Video-Toolkit`: índice de skills/MCPs (Manim, Playwright com `--save-video`, ffmpeg,
  recorte de YouTube).

**MCPs de edição** (se quiser editar no DaVinci depois): `samuelgursky/davinci-resolve-mcp` (precisa do Resolve
Studio pra API completa); `emircbngl/davinci-resolve-mcp-free` (Resolve grátis, via FCPXML); vários MCPs de ffmpeg.
Pra nós o ffmpeg direto já resolve.

## 3. Gravar o gameplay (a parte que é só nossa)

- **O motor é determinístico:** mesma seed + mesmas ordens = mesma partida. Dá pra rodar centenas de partidas
  headless (BatchRunner / `npm run calibrate`) **procurando seeds com lances bonitos** (gol de golpe, virada,
  evolução, Ditto copiando) e depois gravar exatamente aquelas. Nenhum trailer comum tem essa vantagem.
- **Atalhos prontos:** `?demo=ditto` (combo Gênese), `?demo=evolucao`, `?demo=campeao`, `?demo=penaltis`,
  `?cards=1` (galeria), `?lab=golpes` (todos os golpes com animação).
- **Como capturar sem engasgar:** gravação de tela "ao vivo" perde quadros em máquina lenta. O certo é tempo
  virtual: o navegador só avança o relógio depois de cada print (ideia do `timecut`/`timesnap`, do
  `puppeteer-capture` com `--deterministic-mode` e do próprio HyperFrames). Já temos o robô (puppeteer +
  Chromium) que joga e tira print aqui no celular.
- **Cuidado conhecido:** `canvas.captureStream()` pode sair preto em headless com SwiftShader; print via CDP
  funciona (foi o que usamos nos testes). O Phaser não tem gravação embutida.
- **Áudio do jogo:** não sai junto na captura de tela; os gritos (cries) e efeitos estão nos arquivos do jogo
  e entram na timeline do HyperFrames como `<audio>`.

## 4. Música, efeitos e voz

- **Trilha oficial de Pokémon: não.** É o que mais chama pedido de retirada.
- **Chiptune nosso (recomendado):** o jogo já usa **ZzFX**; o **ZzFXM** (MIT) compõe música 8-bit em código, e
  o Claude pode escrever a faixa sincronizada com os cortes. Fica 100% do projeto, sem licença de terceiros, e
  combina com o pixel art. Alternativas: ZzFX Studio (tracker algorítmico), chiptune-studio (exporta WAV).
- **IA de música** (ElevenLabs Music v2, Lyria): som melhor, mas a licença de música da ElevenLabs para jogos e
  filmes é confusa (planos self-serve excluem alguns usos; Enterprise cobre tudo). Num fan game sem dinheiro,
  evitar complicação.
- **Efeitos:** os do próprio jogo (ZzFX) + "whoosh"/impacto sintetizados em código.
- **Voz:** desnecessária. O feed toca **sem som** por padrão, então texto na tela e legenda valem mais.

## 5. Formato por rede (2026)

| Rede | Formato | Duração | Observação |
|---|---|---|---|
| X | 16:9 1080p, H.264/AAC | até 2:20 (usar 30–40 s) | gancho em 3 s |
| LinkedIn | 16:9 no desktop; **4:5 ou 9:16** no celular (o feed do celular favorece vertical) | até ~60 s orgânico | toca mudo: legenda/texto na tela; subir o vídeo nativo |

Plano: **um corte mestre 16:9** + **versão 4:5 (ou 9:16)** com reenquadramento (ffmpeg/`reel-export`), não um
segundo trailer.

## 6. Método (juntando o melhor das fontes)

1. **Brief + marca** (`brand.md`): cores do jogo, fonte Galmuri, logo SOCCERMON, tom. Fatos aprovados por você.
2. **Storyboard em tabela** antes de código (já temos o esqueleto de 30–40 s em `divulgacao-trailer.md`).
3. **Coleta de cenas:** seeds boas via motor headless → gravação quadro a quadro dos lances.
4. **Composição no HyperFrames:** clipes de gameplay + títulos/cartas animados + música chiptune.
5. **Render rascunho** (`--quality draft`) → eu confiro quadros do meio de cada cena (texto cortado,
   sobreposição, fato errado) → ajusto → repete.
6. **Revisão por críticos** (design, leitura no celular, ritmo, marca) antes do render final.
7. **Render final** (`--quality delivery` ou `high`) + versões 4:5/9:16 + legendas + texto dos posts.

**Otimizações:** rascunho em baixa qualidade e 1 worker no celular (pouca RAM); final no PC se precisar de
mais qualidade; reaproveitar o robô e os atalhos `?demo=`; seeds salvas pra re-gravar igual.

## 7. Prompts de exemplo (das fontes)

- Teste de capacidade (Charlie Hills): *"Make a dynamic 15-second motion graphics video that shows what an
  incredible motion designer you are. Go all out."*
- Remotion (docs): `/remotion:remotion-create Make a promo video for a record store`
- Edição por conversa: *"Slow down the second scene."*, *"Swap the text for mine."*, *"Make the orange navy."*
- Os prompts completos do "AI Blew My Mind" (10+ exemplos) estão atrás de paywall; o formato que eles descrevem é
  pedir com **duração, cenas, resolução e estilo** definidos.

## 8. Ainda não encontrado

Nenhum exemplo público de **trailer de jogo** feito assim (só promos de produto, explicativos, gráficos). O nosso
seria um caso novo: gameplay real determinístico + motion graphics em código.

## Fontes

- [Introducing Claude Opus 5.5 (Anthropic)](https://www.anthropic.com/claude-opus-5-5) ·
  [TechCrunch](https://techcrunch.com/2026/09/22/anthropic-releases-opus-5-5-with-lower-prices-and-fable-level-performance/) ·
  [MacRumors](https://www.macrumors.com/2026/09/22/anthropic-claude-opus-5-5/)
- [How to Make Videos With Claude Opus 5.5 (AI Blew My Mind)](https://aiblewmymind.substack.com/p/claude-opus-5-5-video-animations) ·
  [Claude Code motion graphics with Opus 5.5 (Charlie Hills)](https://charliehills.substack.com/p/claude-code-motion-graphics) ·
  [Code-to-video com Opus 5.5 (Apiyi)](https://help.apiyi.com/en/claude-opus-5-5-code-to-video-guide-en.html)
- [HyperFrames](https://github.com/heygen-com/hyperframes) ·
  [motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) ·
  [product-launch-video (Every)](https://github.com/EveryInc/product-launch-video) ·
  [Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit)
- [Remotion: plugin do Claude Code](https://www.remotion.dev/docs/ai/claude-code-plugin) ·
  [Remotion: prompting com agentes](https://www.remotion.dev/docs/ai/coding-agents) ·
  [Tella: Remotion Agent Skills](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code)
- [MCPs de edição comparados](https://github.com/a1adams/mcp-servers-for-video-editing) ·
  [davinci-resolve-mcp-free](https://github.com/emircbngl/davinci-resolve-mcp-free)
- [timecut](https://github.com/tungs/timecut) · [puppeteer-capture](https://alexey-pelykh.com/blog/why-i-built-puppeteer-capture/) ·
  [CCapture.js](https://github.com/spite/ccapture.js/) ·
  [captureStream preto em headless](https://github.com/kajica2/sainted-word-records/issues/75)
- [ZzFXM](https://github.com/keithclark/ZzFXM) · [ZzFX Studio](https://github.com/thejustinwalsh/zzfx-studio) ·
  [Licença do Eleven Music](https://www.mindstudio.ai/blog/elevenlabs-music-v2-commercial-content-licensed-ai-music)
- [LinkedIn: specs de vídeo 2026](https://contentin.io/blog/linkedin-video-format/) ·
  [Derek Lieu: gancho](https://www.derek-lieu.com/blog/2022/10/24/how-to-hook-the-audience-and-how-quickly-to-do-it)
