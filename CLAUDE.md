# Soccermon: contexto para o Claude

Este arquivo leva para qualquer aparelho (PC, celular, nuvem) o que o Claude precisa saber do projeto e do
Miguel, o dono. As preferências abaixo valem em toda sessão.

Planos para o futuro: [docs/planos/roadmap.md](docs/planos/roadmap.md). Cópia das memórias do Claude feitas
no PC (preferências e decisões, com o porquê de cada uma): [docs/memoria/](docs/memoria/). Ao aprender uma
preferência nova do Miguel em outro aparelho, registre aqui no CLAUDE.md para ela valer em todos.

## Aviso (15/10/2026): histórico reescrito

O repositório virou **público** e o histórico foi reescrito para tirar o e-mail pessoal dos commits (agora é o
noreply `105948884+miguel20br@users.noreply.github.com`). Todo clone feito **antes de 15/10/2026** (o do PC,
por exemplo) tem o histórico velho: não dê `git pull` nele. Salve o que houver de mudança local, depois
re-clone (ou `git fetch && git reset --hard origin/main`) e rode `git config user.email` com o noreply. Se
você é o Claude e `git log` mostrar commits com `miguelcunhabr@`, avise o Miguel antes de qualquer push.

## Como falar com o Miguel

- **Sempre comece cada resposta com "Miguel,"** (nome e vírgula). É o teste de sanidade dele: se a resposta não
  começar assim, é sinal de contexto degradado.
- Português do Brasil, informal. Ele é fã enorme de Pokémon: pode usar jargão (BST, learnset, cries, Gen 1, PMD)
  sem explicar. Nada de alerta jurídico alarmista: ele sabe que é fan game.
- **Navegador:** teste do jogo sempre headless (Playwright `headless: true`); janela visível rouba o foco
  dele. Contas pessoais (TikTok, LinkedIn…) ficam no Brave, que o Claude não controla; para o Claude in Chrome
  ele criou um perfil pessoal no Chrome (Linux) que só aparece com o Claude Code logado na conta pessoal dele
  (não na da Bowe). Pergunte qual navegador antes de usar.
- **Social media do TikTok (16/10/2026):** o Miguel quer o Claude cuidando do TikTok @soccermongame (pelo perfil
  pessoal do Chrome): preparar clipe, legenda (textos em `docs/marketing/textos-divulgacao.md` §6), capa e
  hashtags, e postar. Antes de clicar em Post, confirme numa linha com ele. Upload pela extensão só até 10 MB:
  comprimir com ffmpeg 2 passes (~1,45 Mbps de vídeo, 1080x1920). Link clicável na bio só com 1000 seguidores:
  `soccermon.com` vai escrito na legenda. Todo post ganha um comentário com o link; fixar comentário só pelo app
  (o site não tem a opção). Mudança de perfil (foto/bio) demora uns minutos pra aparecer: não repetir.
- Antes de planejar algo grande e novo, ele gosta de uma pesquisa ampla de referências (repos do GitHub, libs,
  assets, skills de game design).

## Regras de design (decididas com ele)

- **Diversão > realismo.** Muitos gols e passes não são problema. Não recalibre o motor para "ficar realista"
  sem ele pedir. Priorize golpes e atributos visíveis em campo, ritmo e viradas. Teste olhando o jogo, não só
  pela calibração.
- **Posições, fórmulas de atributo e equilíbrio: decidir junto.** Mostre antes/depois (tabela, exemplos de
  Pokémon, números do `npm run calibrate`) e só aplique depois do ok explícito dele, mesmo que esteja num plano
  aprovado.
- **Nada automático no time do jogador.** Substituição, tática e escalação são escolhas dele (a IA rival pode ser
  automática). Eventos grandes (evolução, troca) têm momento e animação próprios e gatilho exigente.
- **Cartas:** minimalistas, bronze/prata/ouro pela nota (≤64 / 65–74 / 75+, padrão FIFA), nota e atributos
  grandes, raridade só como acabamento. Edições especiais (Shiny, Destaque, Ícone, Evento) têm visual próprio.
  Mudança visual de carta: mostrar na galeria `?cards=1` antes de espalhar.
- **Sem emoji na interface do jogo** (golpes, menus, gráficos): use ícones desenhados (SVG ou Phaser). O texto
  de Compartilhar pode ter emoji.
- **Carta = campo:** `src/engine/modifiers.ts` é a regra única de bônus; carta, painel e motor usam a mesma.

## O projeto

Fan game de navegador **sem fins lucrativos** (AGPL-3.0): draft roguelike "escolha 1 de 3" com os 151 de Kanto
+ copa de futsal 5v5 simulada. No ar em https://soccermon.com (domínio próprio desde 15/10/2026; o soccermon.vercel.app continua
respondendo). Repo: github.com/miguel20br/soccermon.

- Stack: Vite 8, React 19, TypeScript, Phaser 4, Zustand (save em IndexedDB), Vitest, Biome.
- Motor em `src/engine/` é **determinístico** (20 Hz, mesma seed + mesmas ordens = mesma partida): nada de
  `Math.random()` ou `Date` lá dentro; use o `Rng` do estado. Snapshots com `SNAP_STRIDE = 7`.
- Visão de longo prazo: **modo carreira** (temporadas, XP, evolução) e **modo jogável** (controlar um Pokémon ou
  o time, estilo FC). Preserve: controllers plugáveis (IA e humano emitem os mesmos Commands), tick fixo,
  BatchRunner + LiveRunner, MatchConfig paramétrico, PokemonInstance (não só espécie).
- Contas: login Google + save na nuvem via Supabase (projeto `vszcxacbcabohhdwxfpb`, integração da Vercel).
  Regras de acesso em `supabase/migrations/` (cada um só lê e escreve o próprio save). Sem as variáveis de
  ambiente o jogo roda 100% local.
- Atalhos de dev (`npm run dev`, porta 8080): `?demo=penaltis|ditto|evolucao|campeao|escanteio` (`escanteio&defesa=1`: espalmada que vira escanteio; `evolucao&rival=1`: evolução do rival), `?cards=1`,
  `?lab=posicoes`, `?demo=crash` (força o aviso de erro do `ErrorBoundary`). Público: `?lab=golpes` (com `&revisao=1` mostra a ferramenta de revisão ok/mudar).

## Rotina de trabalho

```bash
npm run lint     # Biome
npm test         # Vitest (~1 min; o teste de evolução é o mais lento)
npm run build    # tsc + Vite
npm run calibrate -- --n 400 [--formations|--tactics]   # equilíbrio headless
npm run stats [-- --dias 7 | --md]   # placar do jogo no ar
npm run fonts    # refaz o subset das Galmuri (public/fonts) quando o teste das fontes acusar caractere novo
```

- **Deploy:** push na `main` publica sozinho em produção (Vercel ligada ao GitHub). O CI do GitHub roda lint,
  testes e build em todo push e PR.
- **Versão nova:** atualize `src/ui/patch-notes.ts` (aparece em Novidades no jogo), gere o `CHANGELOG.md` a
  partir dele, suba `version` no `package.json` e crie a tag `vX.Y.Z`. Commits em português, terminando com a
  linha `Co-Authored-By` do Claude. **E-mail dos commits: `105948884+miguel20br@users.noreply.github.com`**
  (repo público desde 15/10/2026; o e-mail pessoal foi tirado do histórico). Confira `git config user.email`
  em cada aparelho.
- Antes de fechar uma mudança visual, confira no celular (320 e 390 px), deitado e no desktop.
- **Primeiro carregamento leve:** Phaser (`src/PhaserGame.tsx`, pré-carregado depois do `load` da Home) e Supabase
  (`loadCloud()` em `src/cloud/cloud.ts`) vêm em pedaços à parte. Módulo que a Home usa (`EventBus`, `audio`,
  `animation-manager`…) não pode importar `phaser` em tempo de execução, e `@supabase/supabase-js` fora do
  `loadCloud` só com `import type`. Confira no build: o `index-*.js` não pode ter `WebGLRenderer` nem `GoTrueClient`.
  Pedaços com hash ficam em `/bundle` (cache de 1 ano no `vercel.json`).

## Skills do projeto (`.claude/skills/`)

Leia a skill antes de começar a tarefa dela:

| Skill | Quando |
|---|---|
| `soccermon-pesquisa` | feature grande nova: pesquisa de referências → opções → decisões do Miguel → código |
| `soccermon-balanceamento` | qualquer mudança de nota, posição, atributo, golpe, item, tática, copa ou draft |
| `soccermon-teste-navegador` | teste headless (fluxo da copa, celular/desktop, save antigo, prints) |
| `soccermon-lancamento` | versão nova: checklist, "pode subir", merge, tag, release, conferir o ar |
| `soccermon-titulos` | título por código pra gametester/amigo |
| `soccermon-assets` | vídeo, logo, imagem e texto de divulgação |

## Regras de desenvolvimento (17/10/2026)

- **`main` = produção.** Nada vai pra `main` sem o "pode subir" do Miguel naquela conversa. Prévia: push numa
  branch (`soccermon-git-<branch>-miguel20brs-projects.vercel.app`, atrás do login da Vercel).
- **Trabalho em paralelo em worktrees** (`.claude/worktrees/<nome>`, ignorado pelo git): um agente por worktree, cada
  um na sua branch; `node_modules` pode ser symlink. Junte numa branch de integração, teste, e depois do lançamento
  remova os worktrees e apague as branches já juntadas (locais e remotas).
- **Mudou o resultado de partidas** (motor, balanceamento, contas)? Suba `ENGINE_VERSION` em `src/engine/config.ts`.
  Mudou o formato do save? Migração em `src/store/` + teste com `scripts/fixtures/backup-v6-*.json`.
- **A máquina tem 7,5 GB:** uma simulação pesada por vez, `npx vitest run --maxWorkers=2`, um navegador por vez.
- **Dev server:** `npx vite --config vite/config.dev.mjs --port <porta> --strictPort` (sem o `--config` a Home quebra).
- **Antes de dizer que está pronto:** `npx tsc --noEmit -p .`, `npm run lint` sem erro, testes, e print headless de
  tudo que é visual (olhe o print).
- Scripts de análise vão em `scripts/` (os de balanceamento em `scripts/balance/`, com lint relaxado); saídas e
  rascunhos no scratchpad, nunca no repo. Código ou segredo de título nunca no repo (é público).
- Bug achado no teste: conserte a causa no lugar por onde todos passam e deixe um teste que falharia sem o conserto.

## Estado atual (19/10/2026, v0.8.7 · Emotes, selos e faixa da torcida)

Na 0.8.7 (5 frentes em paralelo + integração `int-087`; decisões em `docs/planos/relatorio-0.8.6.md`): emotes do Duelo
com retratos PMD do capitão (`src/ui/duel/Emotes.tsx`, `?lab=emotes`, plano em `docs/planos/emotes.md`), selos de
carreira na Pokédex (`sealsOf` em `src/store/profile.ts`: Folha 10 partidas, Holo 25 gols, Prisma 5 títulos, Ouro
escuro = Prisma + Kanto completo; selinho na carta só proposto em `?cards=1`, opção B), faixa da torcida (opção A, pano
na beira da quadra; frase no Perfil → Meu clube, campo opcional `banner`), "Monta pra mim" no draft (`autoDraft`,
`bestFit`; evento `pick.auto`/`run_end.auto_from`), Duelo com diferenças (`src/net/patch.ts`, `rev`/`need`, relógio 5 s
fora da partida) e partida curta = mesma partida tocada em dobro (`duelPace`), aviso de versão diferente na sala.
**Experimento "beira da quadra"** desligado por padrão (Configurações → Experimentos ou `?agencia=1`; no Duelo vale o
do host): gritos (3), pedido de tempo (1 por tempo, +5% fôlego pra quem pede e +3% pro rival), goleiro-linha, golpe
máximo do capitão (janela 20 s) e ordem dos pênaltis; técnico robô em `scripts/balance/coach.ts`. Com o padrão as
partidas não mudam (`ENGINE_VERSION` 3). Falta: rival que reage (com os líderes) pra "usar bem" valer mais que
"aleatório".

### 0.8.6 · Lendas douradas e prancheta ao vivo


Na 0.8.6 (versão "cheia de ajustes desse gênero", decidido em 18/10; a liga ranqueada foi pra 0.8.7): missões
lendárias (6 treinadores dourados `*Gold`, sprites por `scripts/build-gold-trainers.ts`, `isGoldTrainer` dá brilho
e moldura; 9 títulos com `title-shine`), missão do Ash = campeão com até 5 gols sofridos (`ASH_MAX_CONCEDED`),
recorde de títulos seguidos (`Records.streak/bestStreak`), prancheta no meio da partida (ordem `lineup` na próxima
bola parada, sem limite), +2 por evolução da carta (`EVOLUTION_BONUS`, `PokemonInstance.evolved`; aprovado com
antes/depois em `balanceamento-geral.md`), Duelo com o mesmo limiar de evolução nos dois lados (`evoNeeded` por
técnico humano), evolução do rival com animação própria (`src/game/evolution-view.ts`, `?demo=evolucao&rival=1`),
defesa do goleiro sem bola atrás dele, coleção (álbum de edições
`DexEntry.editions` no save v9, fita de campeão, 9 coleções temáticas, grito de gol do capitão), consertos de
trapaça e reconexão do Duelo, item antigo na recompensa vai pra quem você escolher, e primeiro acesso de ~2,5 MB
pra ~0,4 MB (fontes Galmuri em subset por `npm run fonts`; Phaser e Supabase sob demanda; bundles com hash em
`/bundle`, cache immutable). `ENGINE_VERSION` 3. Atalhos de divulgação `soccermon.com/tt|yt|ig` (utm). Visual "Transmissão" (opção B) na
partida e no site inteiro (kit em `src/ui/broadcast-kit.css`), tática e escanteio sem limite de mudanças,
Substituir mostrando o banco e quem nunca jogou começando em 1x. Insígnias ficam pro **Modo história** (decidido em
18/10; o `BadgeCase` está pronto, fora do Perfil). Relatório e decisões em `docs/planos/relatorio-0.8.6.md`.

### 0.8.5 · Escanteio e duelo ao vivo

Na 0.8.5: escanteio (opção B de [docs/planos/escanteio.md](docs/planos/escanteio.md), `CORNER_TUNING` em
`src/engine/match.ts`), motor com contas próprias (`src/engine/dmath.ts`; `npm run determinismo` compara Node,
Chromium, Firefox e WebKit), seed por trecho de 2 minutos e o **Duelo ao vivo (BETA)** (regras e decisões em
[docs/planos/multiplayer.md](docs/planos/multiplayer.md); `src/net/` e `src/ui/duel/`): sala por link, Supabase
Realtime em canal privado `duel:<código>` (migração `20261017200000_duelo_realtime.sql` já aplicada), 3 modos
(Disputa, Cada um com seus pacotes, Time pronto), mesmo caminho e telas do Copa, prancheta do time (`Prancheta.tsx`,
também no Copa) e duelo sem conta (login anônimo). **No painel do Supabase:** Realtime com "Allow public access"
desligado e Auth com "Allow anonymous sign-ins" ligado (17/10/2026); não desfazer sem trocar o código.

Na 0.8.4: balanceamento geral em 3 blocos + auditoria de posições (tudo em
[docs/planos/balanceamento-geral.md](docs/planos/balanceamento-geral.md); ajuste por espécie em `SPECIES_TUNING`,
`src/engine/attributes.ts`; a evolução herda a vaga em `PokemonInstance.inherited`), treinador e missões
(`src/store/missions.ts`, códigos de título em `src/store/title-codes.ts`) e `ENGINE_VERSION`
(`src/engine/config.ts`: suba a cada mudança que altera partidas). Divulgação da 0.8.4 e da 0.8.5 juntas (clipe
combo no TikTok). O modo de hoje se chama **Copa** (Modo história e Duelo são outros modos).

### 0.8.3 · Partida com peso, pacote de cartas e torcida

Na 0.8.3 (plano em [docs/planos/jogo-gostoso.md](docs/planos/jogo-gostoso.md)): impacto em 4 níveis (`punch()` no
`MatchScene`), câmera lenta igual pra gol/trave/defesa, rastro do tipo na bola (`src/game/ball-trail.ts`), condução
refeita, shiny em campo (`scripts/build-pmd-shiny.ts`), defesa jockey, intervalo com decisão, pacote de cartas
(`CardPack.tsx`), VERSUS novo, barra de evolução que não zera (limiar 15) e sons gravados (`public/assets/sfx/`:
apito do trailer e torcida do lado do jogador: gol, vaia e "uuuh" com variações, créditos no CREDITS.md; `playSample`/`playCrowd` em `src/game/audio.ts`).


**Plano de lançamento e próximas versões (0.8.3 → 1.0): [docs/planos/lancamento.md](docs/planos/lancamento.md).** O Miguel
quer seguir na 0.8.x por enquanto. **1.0 = lançamento oficial com tudo do "Em breve"** (Modo história, Multiplayer,
Futebol de campo, Gen 2); modo jogável, Gens 3 a 9, personalização absurda e Ultimate Team ficam para depois da 1.0. Na 0.8.2: Hall da Fama (`hall` no save v6, desfile em `HallParade.tsx`, aba no
Perfil), prêmios/seleção/recordes/gols da campanha (`ChampionExtras.tsx`, `matchDigest` em `match-stats.ts` guarda
gols/golpes/evoluções de cada partida), card do título 9:16/1:1 (`share-card.ts`) e raridade dos campeões
(`npm run stats -- --raridade` grava `public/data/raridade.json`; a tela só mostra com 20+ campeões).


No ar: contas e save na nuvem, evolução no meio da partida, substituição pelo técnico, painel ao tocar no
Pokémon, estatísticas da partida e da copa, 6 formações, tela de campeão, menus novos, golpes revisados com
animação própria, bônus de time recalculados a cada troca/evolução, página de privacidade e "Apagar minha
conta" (migração `20261014180000_apagar_conta.sql` já aplicada no banco), Ditto no painel mostrando a forma
copiada (não mais a original). Na 0.8.0: Perfil (treinador, avatar, clube com nome/sigla/cor de uma paleta
curada; cor vale no placar, VERSUS, resultado e gráficos, rival troca de uniforme se bater), Pokédex (visto =
apareceu no draft/recompensas/time rival; jogou = 1+ minuto em quadra pelo seu time; carreira por espécie),
Golpedex (`?lab=golpes`, golpe descoberto quando aparece em campo; revisão do Miguel só com `&revisao=1`), passo a
passo de boas-vindas + botão "?" + tela Ajuda + dicas, configurações a fundo (volumes, velocidade inicial, nomes
na quadra, reduzir movimento, confirmar saída, backup/restaurar/apagar) e save v5 (`src/store/profile.ts`).
Também na 0.8.0: golpes com o efeito da Gen 1 em 12 famílias (`MOVE_TRAITS`/`MOVE_TUNING` em `src/engine/moves.ts`,
relatório em `docs/planos/golpes-motor-relatorio.md`; fogo amigo do Earthquake/Surf aprovado), MT do ginásio como
recompensa (`src/engine/tm.ts`; assinatura protegida, golpe ensinado em `PokemonInstance.taught` sobrevive à
evolução, rival leva a MT do líder em até 2 Pokémon) e o jogo inteiro em inglês (`src/i18n/`, nomes oficiais;
Golpedex = Movedex, Destaque = Star Player).

**Estatísticas (15/10/2026):** Vercel Web Analytics + Speed Insights (ligar no painel da Vercel) e eventos
anônimos do jogo em `public.game_events` (`src/analytics/track.ts`, migração `20261015150000_estatisticas.sql`
já aplicada; só INSERT pela API). Consultas prontas no schema `analytics` (SQL Editor):
`por_dia`, `funil`, `origem`, `pokemon_escolhidos`, `formacoes`, `fases`, `telas`, `erros`. Privacidade promete
guardar no máximo 12 meses: job pg_cron `limpar-estatisticas-antigas` (dia 1, 4h) apaga o que passar disso; eventos só de uma lista fixa (migração `20261015190000_estatisticas_limites.sql`).

Plano do trailer e dos posts de lançamento: [docs/planos/divulgacao-trailer.md](docs/planos/divulgacao-trailer.md).

### Pendente

> 15/10/2026: o Miguel configurou Supabase (Site URL/Redirect com soccermon.com) e Google Cloud em outra sessão;
> os itens 0–2 abaixo ficam só pra conferência (login em soccermon.com funcionando, botão oficial do Google).

0. **(16/10/2026: Client ID `363222096118-…` posto em `VITE_GOOGLE_CLIENT_ID` na Vercel, Production e Preview. O `772771786907-…` é de outro client, sem as origens: não usar.)** **Botão oficial do Google (tira o "vszcxacbcabohhdwxfpb.supabase.co" da tela de login):** o código já existe
   (`src/cloud/google-button.ts`, login com `signInWithIdToken`), mas só liga com o Client ID da Web do Google.
   Falta: (a) colocar o Client ID (termina em `.apps.googleusercontent.com`; é público) como valor padrão de
   `GOOGLE_CLIENT_ID` em `src/cloud/google-button.ts` ou na variável `VITE_GOOGLE_CLIENT_ID` da Vercel;
   (b) no Google Cloud Console → Clients → esse client → **Authorized JavaScript origins**:
   `https://soccermon.com`, `https://soccermon.vercel.app` e `http://localhost:8080`; (c) escopo `openid` em Data Access. No Supabase
   (Google provider) o mesmo Client ID precisa estar em "Client IDs" e "Skip Nonce Check" desligado. Sem o
   Client ID o jogo usa o login antigo por redirecionamento.
1. **Feito (15/10/2026):** tela de consentimento OAuth "In production" (testado com conta de fora). O Google
   pede verificação da marca (logo/nome): opcional, 2–3 dias úteis, prova do domínio pelo Search Console.
2. **Feito (15/10/2026):** domínio soccermon.com (Cloudflare Registrar, DNS em CNAME "DNS only" para a Vercel,
   www → 308), Supabase Site URL/Redirect, origens do Client ID e site do repo no GitHub.
3. **Polimento antes de divulgar** (lista em `docs/planos/roadmap.md`, seção "Agora"): "Como jogar" e botão de
   feedback feitos na 0.8.0; nomes na quadra viraram opção em Configurações. Home, draft e Movedex no celular
   deitado arrumados em 16/10 (teste headless); partida, pênaltis, substituição e campeão também.
4. **Trailer e marketing prontos (15/10/2026):** 16:9 em `trailer/montagem/`, 9:16 em `trailer/vertical/`
   (HyperFrames, PT/EN por variável); mídia e música fora do git (`trailer/montagem/preparar.sh` + scripts de
   recorte). Vídeos finais no celular em `Filmes/Soccermon-trailer/final/`. Capas, prévia do link, avatar,
   banner e textos dos posts em `docs/marketing/` (`node docs/marketing/arte/render.mjs` refaz as imagens).
   **Pra criar qualquer asset novo (vídeo, logo, imagem, post), leia antes a skill
   `.claude/skills/soccermon-assets/SKILL.md`** (pipeline, armadilhas do HyperFrames e o gosto do Miguel). Cópia de
   tudo no Drive dele, pasta "Soccermon trailer".
5. **Divulgação da 0.8 (16 a 22/10/2026):** plano em `docs/planos/divulgacao-0.8.md` (um canal por dia, UTM por
   canal, placar toda segunda com `npm run stats -- --md`); textos prontos em `docs/marketing/textos-divulgacao.md`;
   clipes verticais e imagens do itch.io em `Downloads/Soccermon trailer/Divulgacao-0.8/`. Feito em 15/10: X,
   release v0.8.0/v0.8.1 com trailers, Social preview, Discussion #1 fixada ("Feedback do lançamento"). Falta:
   LinkedIn (texto em `docs/marketing/textos-divulgacao.md` §7), clipes, Reddit, TabNews, Show HN. itch.io
   descartado (16/10: dá trabalho manter e traz pouca gente). Posts nas contas dele: o Claude prepara e para antes de publicar.
6. **Sinais do 1º dia para olhar no placar:** maior vazamento entre "começou copa" e "jogou partida" (draft longo
   no celular?); 73% jogam em 8x (começar mais rápido?); Dragonite capitão em 50% das copas (forte demais? decidir
   junto, com calibragem).
7. **Ambiente de dev** (`docs/planos/ambiente-dev.md`): branch `staging` + staging.soccermon.com protegido,
   variáveis do Supabase só em Production, regra de CI na `main`, `ignoreCommand` no vercel.json. Depois do
   lançamento. O vercel.app hoje leva o save por JS (`src/cloud/domain-move.ts`): trocar por 308 no painel da
   Vercel só daqui a ~1 mês (novembro/2026).
8. **Repo no Midgar:** o Miguel quer mover para a org `midgar-hq` (vault em `midgar-hq/midgar-vault`: microsaas
   em série + construir em público). Transferir com calma (reconectar a Vercel à org). Lá ele entra como projeto
   de distribuição/marca, não como aposta de microsaas (o Soccermon nunca pode cobrar).
9. Pequenos: Fly quase não aparece fora da MT; GitHub do
   Miguel arrumado em 16/10 (perfil, bio, Soccermon fixado) — pendente decidir o repo `portfolio` (site antigo no
   ar) e README do `Jogo-Oficina`.
10. Ideias combinadas para depois: melhores momentos/replay (os snapshots já existem), quadras temáticas e
   treinadores, modo carreira (0.9+).
11. **Depois da 0.8.5 (18/10/2026):** clipe combo 0.8.4 + 0.8.5 pro TikTok (rascunho da 0.8.4 em
   `trailer/atualizacao/`; falta gravar escanteio e duelo e o Miguel escolher a música; confirmar antes de postar).
   Duelo: confirmar no ar que o "Partida anulada" sumiu (corrigido na 0.8.5; só testado em duas abas no PC).
   Pequenos: prancheta mostra quem saiu por 1–3 s depois do intervalo (celular); barra "Escanteios 0 x 0" do gráfico
   com um risco vermelho; vincular conta anônima ao Google (precisa ligar "manual linking" no Supabase). Ideia
   solta: patch da fórmula (Ala contando chute, Pivô contando velocidade), com antes/depois pro ok dele.

### Riscos que ele já conhece

- Supabase gratuito pausa depois de 7 dias sem uso (o login cai até reativar no painel).
- Exposição pública aumenta o risco de pedido de retirada pela Nintendo: manter sem dinheiro nenhum (sem
  doações, sem anúncios).
- Segredos do banco ficam só no `.env.local` do PC (nunca commitar). Para rodar migração sem o PC, use o SQL
  Editor do painel do Supabase.
