# Soccermon: contexto para o Claude

Este arquivo leva para qualquer aparelho (PC, celular, nuvem) o que o Claude precisa saber do projeto e do
Miguel, o dono. As preferências abaixo valem em toda sessão.

Planos para o futuro: [docs/planos/roadmap.md](docs/planos/roadmap.md). Cópia das memórias do Claude feitas
no PC (preferências e decisões, com o porquê de cada uma): [docs/memoria/](docs/memoria/), atualizada por
`scripts/memoria.sh` (no PC, antes de lançar; recusa memória com e-mail). Ao aprender uma preferência nova do Miguel
em outro aparelho, registre aqui no CLAUDE.md para ela valer em todos. `scripts/docs.test.ts` falha se o CLAUDE.md
passar de 16 KB, se o "Estado atual" não for a versão do `package.json`, se uma skill faltar na tabela ou se o índice
de `docs/memoria` não bater com os arquivos.

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
- **Social media (20/10/2026):** o Miguel passou as redes pro Claude ("masterize a arte de ser meu social media").
  Skill `soccermon-social`: pauta numerada por semana em `docs/marketing/pauta.md`, ele aprova numa linha ("ok 1–5")
  e o Claude grava, agenda e acompanha; nada vai ao ar fora de uma pauta aprovada.
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
- **Nada teleporta (20/10/2026, regra do Tutti):** toda troca de tela, entrada, saída e mudança de estado nos menus tem
  transição (200–300 ms, `--ease-out`), nada pula de posição; com Reduzir movimento fica só o fade. Tela nova já nasce
  assim; o que já existe está no backlog em `docs/planos/nada-teleporta.md`.
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
- Atalhos de dev (`npm run dev`, porta 8080): `?demo=penaltis|ditto|evolucao|campeao|escanteio` (`escanteio&defesa=1`: espalmada que vira escanteio; `evolucao&rival=1`: evolução do rival; `acrescimos`: Pressão final e "+N'" no fim do 2º tempo), `?cards=1`,
  `?lab=posicoes`, `?demo=crash` (força o aviso de erro do `ErrorBoundary`). Público: `?lab=golpes` (com `&revisao=1` mostra a ferramenta de revisão ok/mudar).

## Rotina de trabalho

```bash
npm run lint     # Biome
npm test         # Vitest (~1 min; o teste de evolução é o mais lento)
npm run build    # tsc + Vite
npm run calibrate -- --n 200 [--formations|--tactics]   # equilíbrio headless (n 400 só no número final)
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
| `soccermon-social` | redes do jogo: pauta da semana, clipes, agendar no TikTok/Instagram/Shorts, comentários, placar |
| `soccermon-marca` | antes de mexer em qualquer visual, ícone, texto de interface ou asset: checklist de padronização (brand guide em `docs/marca/`) |
| `supabase` | qualquer coisa de Supabase (banco, Auth, Edge Functions, Realtime, migrações) |

## Regras de velocidade (19/10/2026, `docs/planos/pesquisas/velocidade.md`)

Aprovadas pelo Miguel ("1a a 9a"); **cada tarefa é avaliada por si**, não é automático:
1. **Nunca travar a sessão com questionário bloqueante** quando há entrega pronta: pergunte em texto e siga entregando (um questionário travou 5 h em 19/10).
2. **CI em toda branch** (testes, build, fumaça e prints na nuvem); o agente espera o CI, não a fila do PC.
3. **Esteira com fila própria**, confia no CI do commit da junção.
4. **Duas trilhas:** rápida (tela, texto, conserto fora do motor: `tsc --incremental`, `vitest related`, prints em 390 e 1440) e completa (motor, Duelo, save, Supabase).
5. **Sobe sem perguntar:** conserto com teste, texto e tradução, acessibilidade, desempenho, processo, layout no kit da transmissão. **Continua com o Miguel:** equilíbrio, posições, visual de carta, regra nova de jogo, Supabase de produção e o que ele pedir pra ver.
6. **Modo fumaça nas prévias** (demos e velocidade alta fora da produção).
7. **Vídeo (ffmpeg) e outros projetos na mesma fila pesada** (`flock /tmp/soccermon-heavy.lock`).
8. **Agentes na nuvem:** testar com 1 tarefa pequena antes de usar mais.
9. **Ferramentas:** `tsc` incremental, build sem repetir o `tsc`, `engine.test.ts` dividido.

`npm run check:rapido` (tsc incremental + Biome + `vitest related`; avisa se caiu na trilha completa, `scripts/trilha.mjs`) e `npm run check:completo` (tudo, na fila pesada). Fila: `scripts/pesado.sh <cmd>`. Esteira: `docs/planos/esteira.md`. CI (`.github/workflows/ci.yml`): prints no artefato `fumaca-prints` (página extra: linha `Fumaça: /?demo=...` no commit). Prévias da Vercel têm os demos e `?vel=N` (até 64x); produção não.

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

## Estado atual (21/10/2026, v0.9.3.2)

Histórico por versão, "Pendente" antigo e detalhes de arquivos: [docs/planos/historico.md](docs/planos/historico.md).

- **No ar:** 0.9.3.2, com a **Rota Índigo** ligada (`LONG_CUP_LIVE`, `src/store/long-cup.ts`). Regra: modo novo só vai ao ar depois de jogado de ponta a ponta na tela, não só pelo robô do store (a Rota Índigo quebrou na 1ª partida em produção em 21/10).
- **Edge Function `liga` leva o motor empacotado:** a cada `ENGINE_VERSION` novo, `npm run edge:liga` e `npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api` (token `SUPABASE_ACCESS_TOKEN` no `.env.local`), senão a Liga recusa as partidas.
- **Liga fechada** até `LIGA_OPENS_AT` (`src/league/rules.ts`, 01/12/2026 00:00 de Brasília, provisória); reabrir ou adiar = trocar só essa linha e publicar. A Copa do Dia segue no ar.
- **Supabase (não desfazer sem trocar o código):** Realtime com "Allow public access" desligado e Auth com "Allow anonymous sign-ins" ligado (Duelo).
- **Decisões de 21/10:** os cartões "Em breve" ficam (só mais leves); a sequência de dias fica (sem perda e sem dinheiro); boas-vindas fora da 1ª visita (passo a passo só na Ajuda).

## Economia de tokens

- Agente novo por rodada, com brief curto; não retomar agente de contexto enorme.
- Sonnet/Haiku quando a tarefa permite; Opus para motor, equilíbrio, composição e design difícil.
- No máximo 3 agentes em paralelo. Prints só os essenciais.
- `npm run calibrate`: n=200 para explorar, n=400 no final. Local: só testes relacionados.

### Riscos que ele já conhece

- Supabase gratuito pausa depois de 7 dias sem uso (o login cai até reativar no painel).
- Exposição pública aumenta o risco de pedido de retirada pela Nintendo: manter sem dinheiro nenhum (sem doações, sem anúncios).
- Segredos do banco ficam só no `.env.local` do PC (nunca commitar). Para rodar migração sem o PC, use o SQL Editor do painel do Supabase.
