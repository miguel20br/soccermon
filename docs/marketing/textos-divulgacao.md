# Textos de divulgação da 0.8 (prontos pra colar)

Complementa o [plano de divulgação da 0.8](../planos/divulgacao-0.8.md) (canais, funil e placar) e os
[posts de lançamento](posts.md) (X, Reels, YouTube e LinkedIn do trailer). Nada aqui foi postado.

Regras que valem pra todos os textos:

- **Um link por canal, sempre com UTM:** `https://soccermon.com/?utm_source=<canal>`, com `reddit`, `tabnews`,
  `hn`, `itch`, `discord`, `tiktok`, `x` ou `linkedin`. O jogo grava o `utm_source` no `session_start`; sem UTM a
  visita cai em "direto" e o placar perde a origem.
- Fan game **sem fins lucrativos**: nenhuma menção a dinheiro, doação, apoio ou anúncio.
- Se o post usar a música do trailer, creditar: "Trainer Battle Remix, por Bliitzit" / "by Bliitzit".
- Fatos conferidos no código em 15/10/2026: 151 Pokémon (`src/data/pokemon.json`), 164 golpes
  (`src/data/moves.json`), motor a 20 ticks/s com `Rng` no estado, 12 famílias de traço (`MOVE_TRAITS`), MT do
  ginásio (`GYM_TM`: Brock dá Bide, Misty dá Bubble Beam...), copa de 4 jogos no mata-mata (3 clubes de ginásio
  e a final contra a Liga Índigo), idioma inicial = idioma do navegador (`src/i18n/lang.ts`), repo público com
  Discussions ligado.
- Nos textos com a voz do Miguel (TabNews, LinkedIn, X) foi aplicado o `brand/estilo.md`: sem travessão, sem
  "não é X, é Y", sem trio forçado, um CTA de conversa. Releia em voz alta antes de postar.

---

## 1. Reddit

### 1.1 r/WebGames (EN)

Formato: **post de link** apontando pro jogo (é o formato do sub) e o texto abaixo como **primeiro comentário**.
Se o sub aceitar post de texto com link, use o texto como corpo.

**Título**

> Soccermon: draft from the 151 Kanto Pokémon and coach them through a 5v5 futsal cup (free, no sign-up)

**Link:** `https://soccermon.com/?utm_source=reddit`

**Primeiro comentário**

> Hi! I made this as a non-profit fan project and it just went into open beta, so honest feedback is very welcome.
>
> It's a roguelike draft (pick 1 of 3) where you build a 5-a-side squad from the original 151, then coach them
> through a simulated futsal cup against gym-themed clubs. The moves are real Gen 1 moves turned into plays:
> Earthquake knocks down everyone nearby (your own teammates included), Fly takes off with the ball and shoots
> on landing, Swift never misses, and Ditto copies the closest rival. Pokémon can also evolve mid-match.
>
> How to play: pick a formation and a captain, draft 5 starters and 2 subs, then change tactics and make subs
> while the match plays out.
>
> Runs in the browser on desktop and phone. It opens in your browser's language (English or Brazilian
> Portuguese, switch with PT | EN on the home screen) and uses the official English Pokémon names.
>
> What I'd love to know: did you understand what your team was doing on the court, and at what point did you
> stop playing?

### 1.2 r/incremental_games: pular

O sub é para jogos incrementais/idle (números que crescem, progressão por acúmulo). O Soccermon é draft
roguelike + simulação de partida: não tem loop incremental. Postar lá seria fora do tema e queima a conta no
Reddit. **Não postar.**

### 1.3 r/indiegames (EN)

Formato: **vídeo ou GIF nativo** (clipe 9:16 ou 16:9 de 10 a 20 s, ver §6) com o texto no primeiro comentário.
Post só com link costuma ir pior em sub de indie.

**Título**

> I made a browser game where the 151 original Pokémon play 5v5 futsal (non-profit fan game, open source)

**Primeiro comentário**

> This is Soccermon, a free fan game I've been building. You draft a squad from the 151 Kanto Pokémon (pick 1
> of 3, roguelike style) and coach them through a 4-match knockout cup. Every Gen 1 move does something on the
> court: in the clip, [descrever o lance do vídeo, ex.: Snorlax uses Earthquake and knocks down his own
> defender].
>
> Under the hood the match engine is deterministic (20 ticks per second, same seed + same coach orders = same
> match), which let me run 400 headless matches to check balance after each change. Code is AGPL on GitHub.
>
> Play in the browser, no sign-up: https://soccermon.com/?utm_source=reddit
>
> I'm looking for feedback on readability: can you follow the match, or is it too chaotic?
> (Trailer music: Trainer Battle Remix by Bliitzit.)

Tire a linha da música se o vídeo não usar o trailer.

### 1.4 Antes de postar em cada sub (conferir as regras do dia)

Não consegui ler as regras atuais dos subs daqui (o Reddit bloqueia leitura automática). O que conferir em cada
um, na barra lateral e nas regras fixadas:

| Sub | O que conferir |
|---|---|
| r/WebGames | Se exige jogo jogável no navegador sem cadastro (o Soccermon cumpre: login é opcional); formato do título (alguns subs pedem gênero entre colchetes); se aceita post do próprio criador e com que frequência |
| r/indiegames | Flair obrigatória (escolher a de promoção/vídeo, se existir); regra de autopromoção (proporção entre posts seus e participação); se fan game de IP alheia é permitido; dia específico pra divulgação |
| Todos | Regra geral do Reddit: a conta não pode ser só divulgação. Antes de postar, comente em alguns posts de outras pessoas. Responda todo comentário nas primeiras horas |

Um sub por dia, nunca o mesmo texto colado em vários subs no mesmo dia (o filtro de spam pega).

---

## 2. Comunidades de Pokémon

### 2.1 Texto curto (EN)

> Hi! I made Soccermon, a free, non-profit browser fan game: you draft a team from the 151 Kanto Pokémon (pick 1 of
> 3) and coach them through a 5v5 futsal cup against gym-themed clubs, ending against the Indigo League. Gen 1
> moves work on the court the way they did in the games: Earthquake hits your own teammates, Fly and Dig vanish,
> Focus Energy can fail like the Gen 1 bug, and gym leaders hand out their TMs (Brock gives Bide, Misty gives
> Bubble Beam). Pokémon can evolve mid-match. Official English names, no sign-up needed:
> https://soccermon.com/?utm_source=discord
>
> Not affiliated with Nintendo, Game Freak, Creatures or The Pokémon Company. Feedback welcome!

### 2.2 Texto curto (PT)

> Oi! Fiz o Soccermon, um fan game de navegador gratuito e sem fins lucrativos: você monta um time com os 151 de
> Kanto num draft "escolha 1 de 3" e leva ele numa copa de futsal 5v5 contra clubes dos ginásios, com final
> contra a Liga Índigo. Os golpes da Gen 1 funcionam em quadra do jeito dos jogos: Earthquake acerta o próprio
> companheiro, Fly e Dig somem do mapa, Focus Energy pode falhar como o bug da Gen 1, e o líder do ginásio
> entrega a MT dele (Brock dá Bide, Misty dá Bubble Beam). Dá pra evoluir no meio da partida. Joga no navegador,
> sem cadastro: https://soccermon.com/?utm_source=discord
>
> Não é afiliado à Nintendo, Game Freak, Creatures nem The Pokémon Company. Feedback é muito bem-vindo!

Use `utm_source=discord` em Discord e `utm_source=reddit` se for um subreddit.

### 2.3 Onde dá pra postar (todos com "leia as regras primeiro")

| Comunidade | O que eu sei | Recomendação |
|---|---|---|
| r/pokemon | Sub enorme e com moderação rígida de autopromoção e conteúdo de fã; regras mudam e às vezes concentram divulgação em tópicos fixos | Ler as regras e procurar tópico semanal de criações. Se não houver espaço claro, **não postar** (remoção conta contra a conta) |
| r/PokemonROMhacks | Focado em ROM hacks e fan games feitos nas engines da comunidade (Essentials etc.) | Provavelmente fora do tema (é jogo web de futsal). Só se as regras citarem fan games em geral |
| PokéCommunity (fórum) | Tem área de fan games com modelo de tópico exigido (prints, recursos, créditos) | Bom lugar se aceitar jogo de navegador; seguir o modelo de tópico à risca e citar os créditos (PMDCollab, PokeAPI, Showdown) |
| Relic Castle | Comunidade de fan games, mais voltada a Essentials | Conferir se aceita jogo fora das engines de RPG |
| Discords de Pokémon BR | Vários servidores têm canal de "divulgação" ou "projetos" | Só postar nesse canal, nunca no geral. Procurar servidores na Disboard com tag pokemon e idioma português |
| Comunidades de jogos BR (ex.: r/gamesEcultura) | Público brasileiro geral de games | Conferir regra de autopromoção; usar o texto PT |
| r/brdev | Público dev brasileiro | Pelo ângulo técnico: linkar o post do TabNews (§3), sem colar link do jogo direto |
| Sites de notícia BR (ex.: Pokémon Mythology) | Cobrem fan games às vezes | Mandar como dica pelo contato, com o texto PT e um GIF. Sem esperar retorno |

Não inventei @ nem convite de servidor: o Miguel escolhe e confirma cada um.

---

## 3. TabNews (PT, voz do Miguel)

Campo **Título**:

> Como fiz um motor de futsal determinístico pros 151 Pokémon de Kanto (e o que quebrou no dia do lançamento)

Campo **Fonte**: `https://soccermon.com/?utm_source=tabnews`

Corpo (cerca de 900 palavras, Markdown do TabNews; se quiser enxugar, a seção "O dia do lançamento" aguenta
perder o parágrafo da mudança de domínio):

```markdown
O Soccermon é um fan game de navegador: você monta um time com os 151 Pokémon de Kanto num draft "escolha 1 de 3" e disputa uma copa de futsal 5v5 contra clubes temáticos dos ginásios. A partida é simulada e você é o técnico. Entrou em beta aberta esta semana, é sem fins lucrativos e o código está aberto (AGPL).

## O motor roda sem tela

O motor fica em `src/engine/`, em TypeScript puro, sem Phaser. Ele avança a partida 20 vezes por segundo e todo sorteio sai de um gerador com seed guardado no estado da partida. Dentro do motor é proibido chamar `Math.random()` ou `Date`.

Com isso, mesma seed e mesmas ordens do técnico dão a mesma partida, lance por lance. O Phaser só toca os snapshots que o motor gera, com interpolação entre eles.

O BatchRunner (num Web Worker, o mais rápido possível) e o LiveRunner (tick a tick, o que aparece na tela) têm um teste que exige o mesmo log pra mesma seed. Na prática, um bug com seed eu reproduzo igualzinho, e pro trailer eu rodei 800 seeds sem tela pra caçar a partida com o gol mais bonito.

## Como um golpe da Gen 1 vira lance de futsal

Cada um dos 164 golpes é classificado a partir dos dados do jogo original. Físico vira chute forte ou carrinho, especial vira chute ou rajada, prioridade vira arrancada, golpe que sobe atributo vira buff. A força é o poder dividido por 120, com teto em 1, e cada golpe sai uma vez por partida (duas, se o PP for 25 ou mais).

Essa camada genérica tinha um problema: Night Shade era só "um chute especial", igual a dezenas de outros. Na versão 0.8 entraram 12 famílias de traço por cima da classificação. Earthquake pega todo mundo a 4 m, companheiro incluído, e quem estava com a bola solta ela. Fly e Dig ficam 0,8 s fora do alcance. Swift nunca erra. Toxic começa fraco e vai até 3x em 12 segundos. Double Team cria dois clones que seguram os próximos dois carrinhos. E dois easter eggs da Gen 1: Focus Energy falha 1 vez em 16, e Hyper Beam que vira gol não precisa recarregar.

O que eu levaria pra outro projeto: os traços entraram como lista separada e o tipo antigo do golpe continuou existindo. A IA e a interface dependiam dele, então nada quebrou.

## 400 partidas pra saber se quebrou

Mexer em 164 golpes de uma vez sem medir seria chute (literalmente). O `npm run calibrate -- --n 400` roda 400 partidas sem tela, com as mesmas seeds, antes e depois da mudança.

A primeira versão dos traços deixou o favorito vencendo só 62,7% das vezes, abaixo da faixa que eu queria (65% a 69%). Baixei o efeito de golpe em área de 0,75 pra 0,6 por vítima e o crítico de 25% pra 20%, e voltou pra 65,3%. Gols por jogo foram de 6,57 pra 6,46. Seis gols e meio é muito pra futsal de verdade, e eu deixo assim de propósito: a regra do projeto é diversão antes de realismo.

A calibração também mostrou o que eu não teria visto jogando. Ghost vencia 59% e caiu pra 48%; Fighting subiu de 41% pra 53%. Ice caiu de 53% pra 43%, porque o Blizzard em área divide a força entre as vítimas (e ainda não decidi o que fazer com ele).

## Agentes em paralelo

Boa parte do código foi escrita com o Claude Code. Na 0.8, o motor dos golpes, a MT do ginásio e a tradução pro inglês andaram ao mesmo tempo, cada agente na sua branch e na sua git worktree. Cada branch terminava com um relatório (calibração antes e depois, riscos) que eu lia antes do merge.

O que deu errado: as worktrees usavam o `node_modules` como junction (o atalho de pasta do Windows) apontando pro do projeto principal, pra não instalar tudo de novo. Um agente removeu uma worktree e a remoção atravessou a junction. O `node_modules` do projeto principal sumiu junto. Não perdi código, só um `npm install`. A lição vale pra qualquer script de limpeza no Windows: desfazer as junctions antes de apagar a pasta que contém elas.

## O dia do lançamento

A tela de consentimento do Google estava em modo de teste, em que só os e-mails cadastrados conseguem entrar. Pra quem chegava pelo link, o login falhava.

O jogo também mudou do `soccermon.vercel.app` pro `soccermon.com`. O save de quem joga sem conta fica no IndexedDB, separado por endereço, e um redirecionamento comum deixaria esse progresso pra trás. O endereço antigo agora lê o save, comprime e manda junto no link, depois do `#` (essa parte nunca vai pra servidor), e o novo junta com o que já tiver lá.

A página de privacidade foi reescrita na revisão final pra descrever exatamente o que sai do aparelho. As estatísticas não usam cookie: cada aba ganha um id aleatório que some quando ela fecha, e os eventos vêm de uma lista fixa, sem URL e sem e-mail, apagados depois de 12 meses. Quem desliga nas Configurações continua desligado. Por isso o link deste post tem `?utm_source=tabnews`: é o único jeito de eu saber que você veio daqui.

## O que vem depois

Sem data: melhores momentos usando os snapshots que o motor já grava, quadras temáticas com treinadores e um modo carreira com temporadas.

Se você jogar uma copa, me conta em que momento você entendeu (ou não entendeu) o que o seu time estava fazendo em quadra. É a parte que eu mais quero melhorar.

Jogo: https://soccermon.com/?utm_source=tabnews
Código: https://github.com/miguel20br/soccermon
```

Antes de publicar: a comunidade do TabNews costuma negativar post que parece só divulgação, por isso o texto é
técnico e o link do jogo fica no campo Fonte e no fim. Confira se o trecho da junction descreve o caso como ele
aconteceu.

---

## 4. Show HN (EN)

**Título** (recomendado, 65 caracteres):

> Show HN: A deterministic futsal sim where you draft Gen 1 Pokémon

Alternativa (73 caracteres):

> Show HN: Soccermon, the 151 original Pokémon playing simulated 5v5 futsal

**URL:** `https://soccermon.com/?utm_source=hn`

**Primeiro comentário (do criador)**

> Hi HN, I'm Miguel. Soccermon is a free, non-profit browser fan game: you draft a 5-a-side team from the 151
> original Pokémon (pick 1 of 3, roguelike style) and coach it through a 4-match knockout futsal cup. You don't
> control players directly; you pick tactics, make subs and watch the match play out on a top-down 2D court.
> No sign-up (Google login is optional, only for cloud saves).
>
> I wanted a game that mixed two things I watch a lot, Pokémon and futsal, and the original 151 felt like the
> right roster to argue about.
>
> Some technical bits that might be interesting:
>
> - The match engine is plain TypeScript with no rendering. It steps at 20 ticks per second and every random
>   roll comes from a seeded RNG stored in the match state, so the same seed plus the same coach orders
>   replays the exact same match. Phaser 4 only plays back the snapshots with interpolation.
> - A batch runner (Web Worker) and a live runner (tick by tick) must produce identical logs for the same seed;
>   there's a test for it. That makes bug reports reproducible and lets me run 400 headless matches with fixed
>   seeds before and after each balance change.
> - All 164 Gen 1 moves map to futsal actions from their original data (physical becomes a shot or tackle,
>   priority becomes a sprint, and so on), plus 12 "trait" families on top: Earthquake hits teammates too, Fly
>   and Dig make the user untargetable for 0.8 s, Swift never misses, Toxic ramps up to 3x, Double Team spawns
>   decoys. Focus Energy fails 1 in 16 as a nod to the Gen 1 bug.
> - Guest saves live in IndexedDB, which is per-origin. When I moved from a vercel.app subdomain to a custom
>   domain, the old origin compresses the save into the URL fragment (never sent to a server) and the new one
>   merges it.
> - Analytics are first-party and cookieless: a random per-tab session id, a fixed list of events, an
>   insert-only table.
>
> Stack: React 19, TypeScript, Phaser 4, Zustand, Supabase (optional login/cloud save), hosted on Vercel. A lot
> of the code was written with Claude Code, with several agents working in parallel git worktrees (move
> engine, gym TMs and the English translation landed that way). Code is AGPL-3.0:
> https://github.com/miguel20br/soccermon
>
> The UI starts in your browser's language (English or Brazilian Portuguese; there's a PT | EN switch on the
> home screen) and uses the official English Pokémon and move names.
>
> Feedback I'd love: can you follow what's happening in a match, or does it read as noise? And if you look at
> the engine code, I'm curious how others structure deterministic sims in JS.

Cuidados: Show HN pede algo que dê pra testar na hora (ok, sem cadastro). Não peça voto nem compartilhe o link
pedindo upvote (o HN pune). Fique por perto nas primeiras 2 a 3 horas pra responder. Se o post não pegar, o HN
permite repostar depois de um tempo; não repostar no mesmo dia.

---

## 5. itch.io

**Título:** Soccermon

**Short description / tagline** (EN, 104 caracteres):

> Draft the 151 Kanto Pokémon and coach them through a 5v5 futsal cup. Free, non-profit browser fan game.

**Long description (EN)**

> **Gotta kick 'em all!**
>
> Soccermon is a free, non-profit fan game. Draft a squad from the 151 Kanto Pokémon in a roguelike "pick 1 of 3"
> draft, then coach it through a 5v5 futsal cup against gym-themed clubs, with the Indigo League waiting in the
> final.
>
> - Pick a formation (6 options), a captain, 5 starters and 2 subs
> - Watch the match on a top-down court and coach live: tactics, substitutions, speed from 1x to 8x
> - All 164 Gen 1 moves happen on the court: Earthquake hits your own teammates, Fly and Dig vanish, Swift
>   never misses, Toxic gets worse over time, Double Team makes clones
> - Evolve mid-match, earn the gym leader's TM (Brock gives Bide, Misty gives Bubble Beam)
> - Rare card editions, type bonuses, story duos (Mew + Mewtwo, the legendary birds), Pokédex and Movedex
> - English and Brazilian Portuguese, with the official English names
>
> **How to play:** click Play, choose your formation and draft your team. No sign-up; Google login is optional
> and only saves your cup to the cloud.
>
> Play at https://soccermon.com/?utm_source=itch
> Source code (AGPL-3.0): https://github.com/miguel20br/soccermon
>
> *Soccermon is a non-profit fan game, not affiliated with or endorsed by Nintendo, Game Freak, Creatures Inc. or
> The Pokémon Company. Pokémon and all related names, images and sounds are © their respective owners. Sprites
> from the PMDCollab SpriteCollab project (CC BY-NC 4.0) and other community sources, credited in the game and
> in the repository.*

**Long description (PT)** (itch não tem página por idioma: cole abaixo da EN, separado por uma linha)

> **Temos que chutar!**
>
> Soccermon é um fan game gratuito e sem fins lucrativos. Monte um time com os 151 Pokémon de Kanto num draft
> roguelike "escolha 1 de 3" e dispute uma copa de futsal 5v5 contra clubes dos ginásios, com a Liga Índigo
> esperando na final.
>
> - Formação (6 opções), capitão, 5 titulares e 2 reservas
> - Partida numa quadra vista de cima, com tática e substituição ao vivo e velocidade de 1x a 8x
> - Os 164 golpes da Gen 1 acontecem em quadra: Earthquake acerta o próprio companheiro, Fly e Dig somem,
>   Swift nunca erra, Toxic piora com o tempo, Double Team cria clones
> - Evolução no meio da partida e a MT do líder do ginásio (Brock dá Bide, Misty dá Bubble Beam)
> - Cartas raras, bônus de tipo, duplas de história, Pokédex e Golpedex
> - Português ou inglês, com os nomes oficiais dos jogos
>
> Jogue em https://soccermon.com/?utm_source=itch
>
> *Fan game sem fins lucrativos, não afiliado nem endossado pela Nintendo, Game Freak, Creatures Inc. ou The
> Pokémon Company.*

**Tags** (10): `fangame`, `soccer`, `futsal`, `roguelite`, `auto-battler`, `sports`, `management`, `pixel-art`,
`open-source`, `singleplayer`

Decisão sobre a tag `pokemon`: **não usar.** O plano já diz para não usar "Pokémon" como palavra-chave de busca
nem tag comercial, e tag de marca é exatamente o que ferramentas de denúncia de IP varrem. O nome aparece no
texto e nas imagens, que já basta pra quem procura. Se depois de duas semanas o itch trouxer quase ninguém
(placar), dá pra trocar `management` por `pokemon` sabendo do risco.

**Genre:** Sports.

**Configuração da página**

| Campo | Valor |
|---|---|
| Kind of project | HTML |
| Release status | In development (é beta aberta) |
| Pricing | **No payments** (não usar "$0 or donate": abre pedido de doação na hora do download) |
| Uploads | Um `.zip` com o `index.html` lançador abaixo, marcado "This file will be played in the browser" |
| Embed options | Tamanho 640x360; desligar o botão de tela cheia (o lançador só abre o site) |
| Community | Comments ligado (vira canal de feedback; responder lá também) |
| Visibility | Draft até conferir a página com "View page"; depois Public |
| AI disclosure (se o itch perguntar) | Responder com honestidade: código escrito em boa parte com Claude Code; sprites e sons são da comunidade, não gerados |

Por que um lançador em vez de colocar o jogo dentro do itch: dentro do iframe do itch, o save fica separado do
soccermon.com, o login do Google não abre em iframe e as estatísticas só contam no domínio oficial. O lançador
abre o site de verdade numa aba nova:

```html
<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Soccermon</title>
<body style="margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(#2a3a7a,#070a18);font:700 20px system-ui;color:#fff">
  <a href="https://soccermon.com/?utm_source=itch" target="_blank" rel="noopener"
     style="padding:18px 32px;border-radius:12px;background:#f5c542;color:#070a18;text-decoration:none">Play Soccermon</a>
</body></html>
```

(Trocar o botão pelo logo `public/assets/ui/logo.svg` se quiser, embutido como arquivo no zip.)

**Imagens**

- **Capa 630x500**: ainda não existe. Criar uma seção nova em `docs/marketing/arte/arte.html` (logo "Evolução"
  sobre o fundo de marca, um Pokémon em quadra) e gerar com `render.mjs`, como as outras capas.
- **Screenshots 16:9 (3 a 5)**, nesta ordem: partida em andamento com um golpe no ar (`docs/partida.jpg` ou quadro
  de clipe), VERSUS (`docs/versus.jpg`), draft "escolha 1 de 3" com cartas ouro, tela da MT do ginásio, tela de
  campeão. O itch aceita GIF como screenshot: o `docs/marketing/teaser.gif` pode ser o primeiro.
- Trailer: link do YouTube no campo "Gameplay video or trailer", quando o vídeo estiver lá.

---

## 6. TikTok / Reels / Shorts

Ordem por fator "uau" (gravar nesta ordem). Clipes de 8 a 15 s, vertical, sem nome em cima dos Pokémon e sem
texto do jogo (o texto vem da edição); lance em câmera lenta no pico, flash e tremida, como na skill
`soccermon-assets`. Link sempre `https://soccermon.com/?utm_source=tiktok` na bio (o mesmo serve pra Reels e
Shorts; se quiser separar, use `tiktok` só no TikTok e anote os outros no placar como "tiktok" também, porque o
jogo só lê o `utm_source`).

Se usar a música do trailer, acrescentar à legenda: "🎵 Trainer Battle Remix por Bliitzit" / "by Bliitzit".

### 1. Ditto transformando

Gravar: `?demo=ditto` ou cena própria em `trailer-scenes.ts`, caçar seed com o Ditto usando Transform perto de
um rival forte (o Transform copia os atributos melhores do rival mais perto por 12 s).

- Texto na tela PT: "O Ditto joga em todas as posições"
- Texto na tela EN: "Ditto plays every position"
- Legenda PT: "Ele virou o Mewtwo do outro time por 12 segundos 👀 Soccermon, fan game de futsal com os 151 de Kanto. Grátis no navegador, link na bio."
- Legenda EN: "He became the other team's Mewtwo for 12 seconds 👀 Soccermon, a futsal fan game with all 151 Kanto Pokémon. Free in your browser, link in bio."
- Hashtags: `#pokemon #ditto #fangame #futsal`

### 2. Earthquake no próprio time

Gravar: Snorlax ou Charizard (os dois têm Earthquake no moveset padrão) com companheiro a menos de 4 m; o
`trailer-hunt.ts` precisa pontuar "Earthquake que derruba aliado".

- Texto PT: "O Snorlax usou Earthquake… no próprio time"
- Texto EN: "Snorlax used Earthquake… on his own team"
- Legenda PT: "Nas batalhas em dupla o Earthquake pega o parceiro. Aqui também 😅 Soccermon, link na bio."
- Legenda EN: "In double battles Earthquake hits your partner. Same here 😅 Soccermon, link in bio."
- Hashtags: `#pokemon #snorlax #fangame #futsal`

### 3. Gol de Fly

Gravar: o Fly não está em nenhum moveset padrão, chega como golpe raro de recompensa (MO). Montar cena com o Fly
ensinado (ex.: Pidgeot, Charizard) e caçar seed em que ele decola com a bola e finaliza no pouso. É o mais
trabalhoso de gravar; se emperrar, passe o 4 pra frente.

- Texto PT: "Gol de Fly"
- Texto EN: "Fly goal"
- Legenda PT: "Ele some do mapa, ninguém consegue marcar, e finaliza no pouso 🦅 Soccermon, link na bio."
- Legenda EN: "Untouchable in the air, shoots on landing 🦅 Soccermon, link in bio."
- Hashtags: `#pokemon #charizard #fangame #futsal #golaco`

### 4. Evolução no meio da partida

Gravar: `?demo=evolucao` (iniciais, evolução logo no começo), `--modo pagina` pra pegar a tela de evolução.

- Texto PT: "Ué? O Charmander está evoluindo… no meio do jogo"
- Texto EN: "What? Charmander is evolving… mid-match"
- Legenda PT: "Ele entrou Charmander e saiu Charmeleon 🔥 Soccermon, fan game de futsal com os 151 de Kanto. Link na bio."
- Legenda EN: "Came on as Charmander, left as Charmeleon 🔥 Soccermon, link in bio."
- Hashtags: `#pokemon #charmander #fangame #futsal`

### 5. Disputa de pênaltis

Gravar: `?demo=penaltis`; cortar na última cobrança, câmera lenta no goleiro.

- Texto PT: "Final contra a Liga Índigo. Pênaltis."
- Texto EN: "Indigo League final. Penalties."
- Legenda PT: "Quem você colocaria pra bater o último? ⚽ Soccermon, link na bio."
- Legenda EN: "Who takes the last one? ⚽ Soccermon, link in bio."
- Hashtags: `#pokemon #futsal #penaltis #fangame`

### 6. MT do ginásio: "1, 2 e… Pronto!"

Gravar: tela da MT depois de vencer um ginásio (recorte do componente, cortes secos, nada de câmera passeando
por print), terminando no "1, 2 e… Pronto!" / "1, 2 and… Poof!" e num lance com o golpe novo.

- Texto PT: "O Brock me deu a MT dele"
- Texto EN: "Brock gave me his TM"
- Legenda PT: "Vence o ginásio, escolhe quem aprende e o que esquece. 1, 2 e… Pronto! Soccermon, link na bio."
- Legenda EN: "Beat the gym, pick who learns it and what to forget. 1, 2 and… Poof! Soccermon, link in bio."
- Hashtags: `#pokemon #brock #fangame #futsal`

---

## 7. X: seguimento (construir em público)

Cada post com menos de 280 caracteres (link conta como 23). Um por dia, como resposta ao post de lançamento ou
solto. Os números entre colchetes vêm do `npm run stats -- --md`; não postar com colchete.

**1. Números do primeiro dia**

> PT: Primeiro dia do Soccermon no ar: [N] sessões, [X]% começaram uma copa e [Y]% terminaram uma. O mais escalado foi o [Pokémon]. Agora vou atrás de onde o pessoal desiste e conserto isso primeiro.
>
> EN: Soccermon's first day: [N] sessions, [X]% started a cup and [Y]% finished one. Most drafted: [Pokémon]. Next I'm hunting down where people quit and fixing that first.

**2. Lance em GIF** (GIF do clipe 2)

> PT: O Snorlax usou Earthquake e derrubou o próprio fixo. No Soccermon o tremor pega todo mundo a 4 m, companheiro incluso, igual nas batalhas em dupla. Deixei assim de propósito. https://soccermon.com/?utm_source=x
>
> EN: Snorlax used Earthquake and flattened his own defender. In Soccermon the quake hits everyone within 4 m, teammates included, like in double battles. Kept it on purpose. https://soccermon.com/?utm_source=x

**3. Bastidor técnico**

> PT: Bastidor: o motor do Soccermon roda a 20 ticks/s e nunca chama Math.random. Todo sorteio sai de uma seed, então mesma seed + mesmas ordens do técnico = mesma partida, lance por lance. Foi assim que deu pra rodar 400 partidas sem tela pra testar o equilíbrio.
>
> EN: Under the hood: Soccermon's engine runs at 20 ticks/s and never calls Math.random. Every roll comes from a seed, so same seed + same coach orders = same match, play by play. That's how I run 400 headless matches to check balance.

**4. Curiosidade da Gen 1**

> PT: No Soccermon o Focus Energy garante crítico no próximo chute. E falha 1 vez em 16, em homenagem ao bug da Gen 1. Hyper Beam que vira gol também não recarrega, igual a quando nocauteava no Red/Blue.
>
> EN: In Soccermon, Focus Energy guarantees a crit on the next shot. It also fails 1 in 16, a nod to the Gen 1 bug. And a Hyper Beam that scores doesn't need to recharge, just like a KO in Red/Blue.

**5. Correção que veio de feedback** (modelo; preencher com o caso real da semana)

> PT: Quem jogou reclamou de [problema concreto, ex.: não entender quando o golpe foi usado]. Saiu na [versão]: [o que mudou em uma frase]. Valeu a todo mundo que mandou no Discussions. https://soccermon.com/?utm_source=x
>
> EN: Players told me [problem]. Fixed in [version]: [what changed]. Thanks to everyone who posted in Discussions. https://soccermon.com/?utm_source=x

### LinkedIn (PT, voz do Miguel, para a semana)

Link no **primeiro comentário** (`https://soccermon.com/?utm_source=linkedin` e o GitHub), não no corpo.

> Mudei o comportamento de 164 golpes de uma vez num jogo e precisava saber se o equilíbrio tinha quebrado, sem jogar centenas de partidas na mão.
>
> O jogo é o Soccermon, um fan game de navegador sem fins lucrativos em que os Pokémon de Kanto jogam futsal 5v5 simulado. Cada partida tem centenas de sorteios: se o chute entra, se o carrinho pega, se sai crítico, se o goleiro alcança. Com sorteio solto, cada rodada de teste dá um resultado diferente e "parece mais equilibrado" vira opinião.
>
> O que resolveu foi passar todo sorteio do motor por um gerador com seed, guardado no estado da partida. Mesma seed e mesmas ordens do técnico dão a mesma partida, lance por lance.
>
> Aí o teste vira comparação. Rodo 400 partidas sem tela, com as mesmas seeds, antes e depois da mudança. Na última, os gols por jogo foram de 6,57 para 6,46 e o favorito passou de vencer 67,9% das vezes para 65,3%. Também apareceu o que eu não teria visto jogando: o tipo Ice caiu de 53% para 43% de vitórias (e ainda não decidi o que fazer com ele).
>
> Se o seu projeto tem algo aleatório, como jogo ou simulação, vale centralizar o sorteio num lugar só, com seed, desde o primeiro dia. Colocar depois dá bem mais trabalho, porque cada chamada solta precisa ser achada.
>
> Se você já testou balanceamento de outro jeito, com playtest de gente ou planilha, me conta nos comentários o que funcionou melhor no seu caso.
>
> -//
>
> #DevJunior #ProgramacaoParaIniciantes #GameDevBrasil

---

## 8. Calendário dos próximos 7 dias

Atenção: no plano `divulgacao-0.8.md` os dias da semana estão um dia adiantados (16/10/2026 é **sexta**, não
quinta). Abaixo, com os dias certos. O placar continua na segunda (19/10).

| Dia | Canal e texto |
|---|---|
| 16/10 (sex) | LinkedIn (§7). Clipe 1, Ditto (§6.1). Página do itch.io em Draft, conferir e publicar (§5) |
| 17/10 (sáb) | Reddit r/WebGames (§1.1). X post 4, Gen 1 (§7) |
| 18/10 (dom) | TabNews (§3). Clipe 2, Earthquake (§6.2) |
| 19/10 (seg) | **Placar 1** (`npm run stats -- --md`), escolher a mudança da semana. X post 1, números (§7) |
| 20/10 (ter) | Show HN (§4), de manhã nos EUA (perto das 11h de Brasília) e ficar respondendo. X post 3, bastidor |
| 21/10 (qua) | Reddit r/indiegames com o clipe (§1.3). Discords/comunidades de Pokémon que aceitam divulgação (§2). Clipe 3, evolução ou Fly (§6.3/6.4) |
| 22/10 (qui) | X post 2, GIF do Earthquake. X post 5 só se já houver correção vinda de feedback |

Os clipes 5 e 6 (pênaltis e MT) ficam pra semana seguinte, mantendo 3 clipes por semana.

### Registrar cada post

Ao postar, anote na tabela abaixo (e leve o resumo pro **Placar** semanal em
[`divulgacao-0.8.md`](../planos/divulgacao-0.8.md)): data, canal, `utm_source`, link do post e o que aconteceu.
Sem isso, o número de sessões por canal no placar não diz qual post trouxe gente.

| Data | Canal | utm_source | Link do post | Resultado (sessões, comentários, removido?) |
|---|---|---|---|---|
| 15/10 | X (lançamento) | x | | |
| | | | | |
