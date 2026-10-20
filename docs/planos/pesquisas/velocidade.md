# Pesquisa: por que mudança e deploy demoram tanto, e como acelerar (19/10/2026)

Pedido do Miguel: "toda alteração e deploy demora SÉCULOS pra acontecer... por que? quero uma pesquisa intensa sobre
como podemos acelerar esses processos". **Só pesquisa: nenhum código nem processo mudou.** Os números saíram de
três fontes: as transcrições da sessão (cada comando dos agentes da rodada 0.8.8, com hora de início e de fim), as
APIs do GitHub (deploys da Vercel e CI) e medições feitas agora na máquina, dentro do mesmo cadeado
(`/tmp/soccermon-heavy.lock`) que a esteira estava usando.

Scripts e saídas fora do repo, em
`/tmp/claude-1000/-home-bartolomeu-Projects-soccermon/e1939d5f-03fc-4882-9c76-204a383245a2/scratchpad/089/velocidade/`:
`transcripts.py` (tempo por tipo de comando e espera no cadeado), `perguntas.py` (tempo travado em questionário),
`recomendado.py` (quantas respostas foram a opção recomendada), `measure.py` (medição com cadeado, memória e carga),
`deploys.py`/`vercel-status.py`/`ci-steps.py` (Vercel e CI) e `smoke/` (cópia dos roteiros de fumaça).

## Resumo

1. **O deploy não é o problema.** Do push ao ar a Vercel leva **~30 s** (mediana de 60 deploys: 30 s; 19–44 s). O CI do
   GitHub leva ~1 min e roda em paralelo, sem travar nada.
2. **O maior buraco de hoje foi um questionário.** Às 03:31 a sessão principal fez um questionário ("Gol sem
   chute") e ficou **travada 5 h 29 min** esperando a resposta (o Miguel dormia). Nesse tempo, 4 branches prontas
   (404, ux-rápido, conquistas, ux-pronto) ficaram paradas: o aviso de "agente terminou" chega, mas só é lido quando
   o questionário é respondido. A esteira acabou a fila às 05:18 e ficou ociosa até 09:00.
3. Quando o Miguel está acordado ele responde rápido: **16 de 17 questionários em até 7 min** (mediana ~2 min).
   O que trava é pergunta que bloqueia, não a demora dele.
4. **Dentro de cada agente, 50–80% do tempo é verificação pesada**, e boa parte disso é **fila no cadeado**: 15 a 42
   min por agente (soma da rodada: **255 min** de espera). Com 5–6 agentes ao mesmo tempo e um cadeado só, o paralelo
   vira fila indiana justamente na parte mais lenta.
5. Escrever o código é a parte pequena: 11–44 min de "modelo" por agente (conquistas: 15 min de 91).
6. **A esteira refaz tudo de novo** (testes, build, copa inteira, Duelo em duas páginas, prints): 12–26 min por
   entrega (mediana 24), uma por vez. E depois o CI refaz testes e build pela terceira vez.
7. A máquina está no limite: carga 15–19 em 8 núcleos, 5 GB de swap em uso e só 300–600 MB livres durante as
   medições. Parte disso nem é do Soccermon (ffmpeg de vídeo em 4 núcleos, eslint de outro repo) e roda fora do
   cadeado. O mesmo `npm test` leva **34 s no CI**, **69–73 s aqui com o vídeo rodando** e **27 s aqui depois que o
   vídeo acabou** (build: 34 s → 12 s; `tsc`: 31–43 s → 15–24 s). **O vídeo em paralelo deixa tudo 2,5x mais lento.**
8. Ganhos fáceis: `tsc` incremental (**31–43 s → 6–7 s**; são ~140 execuções por rodada), `vitest related` (mudança
   só de tela: **2 s em vez de 70 s**), `vite build` sem repetir o `tsc` (**34 s → 4 s**) e a fumaça só onde a mudança
   mexe.
9. Proposta: **duas trilhas** (rápida pra tela/texto/conserto fora do motor; completa pra motor/Duelo/save), **CI em
   toda branch fazendo o pesado na nuvem** (grátis em repo público, 4 núcleos e 16 GB), **esteira que confia no CI**
   e **pergunta que nunca trava** a fila.
10. Meta: mudança pequena no ar em **≤ 20 min** do pedido; mudança completa em **≤ 60 min** de agente + **≤ 10 min**
    de esteira. Decisões no fim, em questionário.

## Onde o tempo vai hoje

### Uma entrega típica: `conquistas` (pedido 02:55 → no ar 09:13)

| Etapa | Min | % |
|---|---:|---:|
| Pedido → agente começa | 1 | 0 |
| Agente pensando e escrevendo código | 15 | 4 |
| `tsc` + lint | 3 | 1 |
| Testes, build, fumaça e prints rodando | 31 | 8 |
| **Agente esperando o cadeado** | **42** | 11 |
| **Branch pronta esperando a esteira** (principal travado no questionário) | **274** | 72 |
| Esteira: juntar, refazer tudo, fumaça, push | 12 | 3 |
| Vercel (build + no ar) | 0,5 | 0 |
| **Total** | **378** | |

`ux-rapido` foi parecido: pedido 02:09, decisões 02:59, agente 03:03–04:22 (79 min, 44 de pesado, 15 de cadeado),
parada na fila 04:22–09:13 (**291 min**), esteira 09:13–09:39 (26 min, porque a fumaça da copa precisou de 3
rodadas: o roteiro procurava um texto que mudou), no ar 09:39. **Total 7 h 30.**

Quando ninguém trava, o caminho já é rápido: o código de conserto da Pokédex do Triple M foi da reclamação (09:16) ao
ar (09:22) em **6 min**, feito direto pela sessão principal; o conserto da animação da quadra achado pela fumaça
(10:14) estava no ar às 10:28 (**14 min**).

### Todas as entregas da rodada (branch pronta → no ar)

| Branch | Agente (min) | Cadeado dentro do agente (min) | Pronta → no ar | Esteira (min) | No ar |
|---|---:|---:|---:|---:|---|
| momentos | 93 | 18 | 1 h 02 | ~30 | 04:00 |
| bugs | 57 | 8 | 33 min | 26 | 04:26 |
| colecao-2 | 92 | 0 | 1 h 44 | ~14 | 04:41 |
| treinadores | 78 | 13 | 2 h 12 | ~14 | 04:55 |
| polimento (emotes 2) | 88 | 31 | 2 h 17 | ~14 | 05:09 |
| conquistas | 91 | 42 | **4 h 46** | 12 | 09:13 |
| ux-rapido | 79 | 15 | **5 h 17** | 26 | 09:39 |
| ux-pronto | 112 | 37 | **5 h 07** | 22 | 10:02 |
| home-404 | 42 | 15 | **6 h 41** | 26 | 10:28 |

As primeiras (madrugada, antes do questionário) também esperaram 1–2 h porque a esteira faz **uma por vez, ~24 min
cada**, e todas ficaram prontas quase juntas (02:43–02:58).

### Por tipo de comando (rodada 0.8.8, 19/10 01:20–11:05, todos os agentes)

| Tipo | Execuções | Tempo total | Mediana | p90 |
|---|---:|---:|---:|---:|
| Fumaça/prints (Playwright) | 133 | 345 min | 8 s | 8,3 min |
| Vitest inteiro | 74 | 133 min | 13 s | 6,5 min |
| Esperando tarefa em 2º plano (`until …`) | 31 | 113 min | 1,5 min | 10 min (teto) |
| `tsc` | 140 | 66 min | 19 s | 65 s |
| Preview + fumaça da esteira | 19 | 42 min | 9 s | 7,5 min |
| Build | 11 | 32 min | 31 s | 5,5 min |
| Lint (Biome) | 45 | 1,5 min | 1,4 s | 4 s |
| git push/fetch, `gh` | 67 | 7 min | 2 s | 1 min |

- **Cadeado:** 140 comandos com `flock`; 61 esperaram mais de 5 s; espera total **255 min**, p90 **6,8 min**,
  máximo ~10 min. Rodando de verdade (descontada a espera), a fumaça tem mediana 70 s e p90 6,7 min; o vitest, 52 s
  e 3,5 min.
- **17 comandos bateram no teto de 10 min** do Bash (quase todos `until` esperando fumaça ou vitest em 2º plano):
  tempo morto até o agente olhar de novo.
- Lint é irrelevante (1–2 s). Vercel e `git push` também.

### Medido agora (19/10 11:06–12:15; carga 15–19 em 8 núcleos até ~11:35 e 3–6 depois; 300–3.000 MB livres)

| Passo | Aqui (rodando) | Esperou o cadeado | No CI do GitHub |
|---|---:|---:|---:|
| `tsc --noEmit` | 31–43 s (máquina leve: 15–24 s) | — | (dentro do build) |
| `tsc` incremental, 2ª vez em diante | **6–7 s** | — | — |
| `npm run lint` | 1,5–2 s | — | 1 s |
| Biome só no arquivo mudado | 0,7 s | — | — |
| Vitest inteiro (`--maxWorkers=2`) | 69–73 s (máquina leve: **27 s**) | 161 s, **568 s** e 99 s | **34 s** |
| Vitest com `--pool=threads` | 70 s (sem ganho) | 189 s | — |
| `vitest related` (só tela: patch-notes + Home) | **2 s** (0 testes afetados) | — | — |
| `vitest related src/store/missions.ts` | 7 s (11 arquivos, 91 testes) | — | — |
| `vitest related src/engine/match.ts` | 68 s (16 arquivos, 228 testes) | — | — |
| `npm run build` (tsc + vite) | 32–34 s (máquina leve: 12 s) | 36 s e 84 s | 14 s |
| `vite build` sozinho (Vite 8, Rolldown) | **4 s** | 0 | — |
| `vite preview` subir | 1,4 s | — | — |
| Prints 4 tamanhos × 3 páginas | 62 s | **312 s** | — |
| Fumaça da copa, 1ª partida + Perfil/backup (`main`) | 195 s (falhou num passo: roteiro desatualizado) | 17 s | — |
| Fumaça da copa inteira (`full`, 390), na esteira hoje | 5–8 min por rodada | 0–10 min | — |
| Duelo em 2 páginas, curta 8x | 116 s | 0 | — |
| Duelo em 2 páginas (padrão, 4x) | 197 s | 0 | — |
| Vercel: push → no ar | — | — | 30 s (19–44) |
| CI inteiro (checkout, `npm ci`, lint, testes, build) | — | — | 55–77 s |

- **Um arquivo segura o vitest:** `src/engine/engine.test.ts` leva **62 s** dos 116 s somados (o teste de evolução
  sozinho, 12,6 s). Com 2 workers, o tempo total nunca cai abaixo desse arquivo. Depois vêm `rival-coach` (14 s),
  `agency` (10 s) e `duel` (8 s); os outros 30 arquivos somam ~15 s.
- `threads` não ajudou (70 s vs 69–73 s). O próprio vitest calcula ~3,6 s de ganho com `isolate: false`: pouco.
- **O build é 90% `tsc`:** `npm run build` leva 32–34 s e o `vite build` sozinho, 4 s. Quem acabou de rodar `tsc`
  paga de novo no build.
- A fumaça é o passo mais caro que sobra, e o mais frágil: a cópia de hoje do roteiro da copa (o da esteira)
  falhou aqui num seletor da prancheta, porque procura texto e classe que mudam de uma branch pra outra.
- `tsconfig.tsbuildinfo` está **no git** (sobra de algum `tsc -b`); não é usado, mas confunde.

## Por que demora (as causas, em ordem de peso)

1. **Pergunta que trava a fila.** O questionário (AskUserQuestion) para a sessão principal inteira. Os avisos de
   agente pronto ficam guardados e só são lidos quando a pergunta é respondida. À noite isso custa horas.
2. **A esteira depende do principal pra receber trabalho.** Ela terminou a fila às 05:18 e só ganhou as 4 próximas
   às 09:00, quando o principal destravou. Não existe uma fila que ela mesma leia.
3. **Um cadeado só para tudo que é pesado**, numa máquina de 7,5 GB. 6 agentes × ~30 min de pesado = ~3 h de fila
   no cadeado por rodada.
4. **Outros trabalhos fora do cadeado** (render de vídeo, preview do HyperFrames, lint de outro repo) deixam cada
   passo pesado 2,5x mais lento enquanto rodam (vitest 70 s → 27 s quando o vídeo acabou), e a fila do cadeado
   cresce junto.
5. **A mesma verificação três vezes** (agente → esteira → CI), e a mais cara (fumaça da copa inteira + Duelo, 5–8
   min) pelo menos duas vezes.
6. **Verificação igual para tudo:** mudar um texto da Home passa pela copa inteira, Duelo em 2 páginas e prints em 4
   tamanhos, igual a mudar o motor.
7. **Esperas mortas:** `until` com teto de 10 min, `tsc` frio a cada vez (~140 por rodada), roteiro de fumaça que
   quebra quando um texto muda (reroda inteiro).

## Opções (ranqueadas por ganho ÷ esforço)

| # | Opção | Ganho | Esforço | Risco |
|---|---|---|---|---|
| 1 | **Pergunta nunca trava:** principal pergunta em texto (ou questionário só quando não há nada na fila) e segue entregando o que já foi aprovado | horas (hoje 4,5–6 h por entrega da madrugada) | zero (regra) | nenhum |
| 2 | **Esteira com fila própria** (um arquivo `fila.md` no scratchpad que os agentes atualizam ao terminar e a esteira lê sozinha) | 1–5 h nas madrugadas | baixo | baixo |
| 3 | **Vídeo e outros projetos no mesmo cadeado** (ou ffmpeg com `-threads 2` e `nice`) | medido: vitest 70 → 27 s, build 34 → 12 s quando o vídeo parou | mínimo | nenhum |
| 4 | **CI em toda branch** (hoje só roda na `main` e em PR): lint, `tsc`, testes, build, fumaça e prints no GitHub Actions; o agente faz push e espera o CI em vez do cadeado | 30–60 min por agente; o cadeado quase some | médio (1 workflow + roteiros de fumaça no repo) | baixo |
| 5 | **Esteira confia no CI:** junta na branch `esteira`, push, CI completo roda no commit da junção, CI verde → `main` (sem refazer local) | 12–26 → ~6 min por entrega, sem cadeado | baixo (depois do 4) | baixo |
| 6 | **Duas trilhas** (rápida / completa) pelo que a mudança toca | 20–40 min em mudança pequena | baixo (regra + lista de pastas) | médio se a lista estiver errada (o CI completo na `main` pega) |
| 7 | **`tsc` incremental** (`incremental` + `tsBuildInfoFile` em `.cache/`, por worktree) e tirar o `tsconfig.tsbuildinfo` do git; local, `vite build` em vez de `npm run build` quando o `tsc` já passou | `tsc` 31–43 s → 6–7 s (~50 min por rodada); build 34 s → 4 s | mínimo | nenhum (o CI segue com `npm run build`) |
| 8 | **`vitest related`** na trilha rápida (e o inteiro no CI) | 70 s → 2–7 s fora do motor | mínimo | baixo (o CI roda tudo) |
| 9 | **Dividir `engine.test.ts`** em 3–4 arquivos (evolução, golpes, partida…) | testes ~70 → ~35 s aqui, ~34 → ~20 s no CI | baixo | nenhum |
| 10 | **Fumaça mais curta e por escopo:** copa `main` (1ª partida) na trilha rápida, `full` só na completa; Duelo só se mexer em `src/net`/`src/ui/duel`; prints só 390 e 1440 na rápida; roteiros procurando `data-testid` em vez de texto | 5–8 min → 1–2 min | baixo | baixo |
| 11 | **Modo fumaça no build de prévia** (os `?demo=` e uma velocidade alta valendo fora da produção) pra a fumaça pular direto pra tela que interessa | fumaça de minutos → segundos | médio (código novo) | baixo (desligado em produção) |
| 12 | **Esperar tarefa em 2º plano pela notificação**, não por `until` com teto de 10 min | ~5 min por espera | mínimo | nenhum |
| 13 | **Agentes na nuvem** (`claude --cloud`: cada um numa VM própria, a máquina fica livre) | foge dos 7,5 GB de vez | médio (GitHub App, script de setup com Chromium, conta pessoal) | médio (custa limite do plano; sem a máquina do Miguel pra prints locais) |
| 14 | **Merge queue do GitHub** | junta em fila sem humano | baixo | só existe em repo de **organização**: fica pra quando o repo for pro `midgar-hq` |
| 15 | Vercel: `ignoreCommand` pra commit só de `docs/` | economiza build, não tempo (30 s) | mínimo | baixo |

Descartadas:
- **Deploy `--prebuilt` da máquina** (pular o build da Vercel): ganharia ~20 s, mas sem as variáveis de sistema da
  Vercel no build, e o `__APP_BUILD__` do Duelo usa `VERCEL_GIT_COMMIT_SHA` (`vite/config.prod.mjs`): o Duelo
  deixaria de reconhecer telas do mesmo deploy. Não vale.
- **Mais workers no vitest aqui** (`--maxWorkers=4`): com 300–600 MB livres, arrisca swap e trava o resto. No CI
  (16 GB) não precisa.
- **`--pool=threads`**: medido, sem ganho.
- **Rodar a fumaça contra a URL de prévia da Vercel** (com o "Protection Bypass for Automation"): funciona, mas
  depende de segredo e do deploy terminar. Mais simples o CI servir o próprio `dist/` com `vite preview`.

## Fluxo novo recomendado

### Trilha rápida (texto, i18n, CSS, uma tela, conserto fora do motor/save/Duelo)

Quando: a mudança só toca `src/ui/**` (menos `src/ui/duel/**`), `src/i18n/**`, `public/**`, `docs/**`, ou um
conserto com teste em `src/store/**` que não muda o formato do save.

1. Agente (ou o principal, se for pequeno) muda o código.
2. Local, sem cadeado: `tsc` incremental (6 s), Biome nos arquivos mudados (1 s), `vitest related <arquivos> --run`
   (2–7 s), print a 390 e 1440 da tela mexida pelo servidor de dev com `?demo=` (1 navegador, com cadeado, ~1 min).
3. Push na branch → CI na nuvem (lint, `tsc`, testes inteiros, build, fumaça `main` da copa) ~3–4 min.
4. CI verde → esteira junta e manda pra `main` (CI de novo no commit da junção, ~2 min) → Vercel 30 s.
5. Meta: **pedido → no ar ≤ 20 min** quando não precisa de ok visual; com ok visual, ≤ 20 min depois do ok.

### Trilha completa (motor, balanceamento, contas, save/migração, `src/net`, Duelo, Supabase)

1. Agente faz o código e os testes do que mexeu (`vitest related`, `tsc` incremental).
2. Pesado na nuvem: push → CI completo (testes inteiros, build, copa `full` a 390, Duelo em 2 páginas, prints em 4
   tamanhos como artefato pra baixar e olhar). O agente espera o CI (`gh run watch`), não o cadeado.
3. Local, com cadeado, só o que o CI não faz: `npm run calibrate`, `npm run determinismo` (4 navegadores), e quando
   precisar de olho no jogo.
4. Esteira: junta, CI completo no commit da junção, `main`. Sem refazer local.
5. Metas: **agente ≤ 60 min**, **esteira ≤ 10 min**, **espera no cadeado ≤ 5 min por agente**.

### Regras que valem pras duas

- **Nada trava a fila.** Pergunta pro Miguel em texto (ele responde em 1–3 min quando está acordado); questionário só
  quando não há nada pronto esperando. Antes de dormir, o que estiver aprovado continua andando.
- **A esteira lê a própria fila** (`scratchpad/<rodada>/fila.md`: branch, trilha, aprovado sim/não). Agente pronto
  escreve lá; a esteira pega sozinha, sem esperar o principal.
- **O que sobe sem perguntar** (nos questionários das duas últimas sessões, o Miguel ficou com a opção recomendada
  em 37 de 64 respostas; quase todos os desvios foram gosto de jogo: tempo, faixa, gritos, Dragonite, acabamento,
  e o "Gol sem chute", que muda partida):
  conserto com teste, texto e tradução, acessibilidade, desempenho, processo/infra que não muda partida, layout que
  segue o kit da transmissão. **Continua perguntando** (regra do CLAUDE.md): números de equilíbrio, posições,
  fórmulas, visual de carta (galeria `?cards=1`), regra nova de jogo, migração no Supabase.

## Como ficaria o CI (rascunho, não aplicado)

```yaml
on:
  push:
    branches: ['**']        # hoje: só main (e PR)
jobs:
  check:        # ~1 min: npm ci (cache), lint, tsc, testes (2 shards se dividir engine.test.ts), build, dist como artefato
  smoke:        # needs: check. playwright install chromium (com cache), vite preview do dist,
                # copa main (rápida) ou full + duelo (completa: se mexeu em src/engine, src/net, src/store, src/ui/duel),
                # prints 320/390/844x390/1440 como artefato
```

- GitHub Actions em repo **público** usa a máquina padrão (4 núcleos, 16 GB) **de graça e sem limite de minutos**.
- Os roteiros de fumaça (`scratchpad/089/esteira/copa.cjs`, `scratchpad/087/int/duel/smoke.cjs`,
  `scratchpad/089/esteira/pages.cjs`) teriam que ir pro repo (`scripts/smoke/`): hoje vivem no scratchpad, que some
  com a sessão. São públicos sem problema (nenhum segredo; o jogo roda sem Supabase).
- `concurrency` com `cancel-in-progress` já existe: push novo na mesma branch cancela o anterior.

## Metas

| Caso | Hoje | Meta |
|---|---|---|
| Mudança pequena, pedido → no ar | 1–7 h (6–14 min quando feita direto pelo principal) | ≤ 20 min |
| Agente da trilha completa | 42–112 min | ≤ 60 min |
| Espera no cadeado por agente | 15–42 min | ≤ 5 min |
| Esteira por entrega | 12–26 min | ≤ 10 min |
| Branch pronta → no ar | 33 min a 6 h 41 | ≤ 15 min |
| Push → no ar | 30 s | 30 s (já está bom) |

## Decisões pro Miguel

1. **Pergunta que trava a fila**
   - **A) O principal nunca usa questionário com entrega pronta esperando; pergunta em texto e segue (recomendado)**
   - B) Só evita à noite
   - C) Como hoje
2. **CI em toda branch, com o pesado na nuvem**
   - **A) Sim: testes, build, fumaça e prints no GitHub Actions; agente espera o CI, não o cadeado (recomendado)**
   - B) Só testes e build na nuvem; fumaça continua aqui
   - C) Não
3. **Esteira**
   - **A) Lê a própria fila e confia no CI do commit da junção, sem refazer local (recomendado)**
   - B) Fila própria, mas refaz a fumaça local
   - C) Como hoje
4. **Duas trilhas (rápida e completa)**
   - **A) Sim, pela lista de pastas acima (recomendado)**
   - B) Só pra texto e tradução
   - C) Tudo pela completa
5. **O que sobe sem perguntar**
   - **A) Conserto com teste, texto/tradução, acessibilidade, desempenho, processo, layout no kit (recomendado)**
   - B) Só consertos com teste
   - C) Nada, tudo pergunta
6. **Modo fumaça no build de prévia** (`?demo=` e velocidade alta fora da produção; código novo)
   - **A) Sim (recomendado)**
   - B) Não, a fumaça segue jogando a copa
7. **Vídeo e outros projetos na mesma máquina**
   - **A) Entram no mesmo cadeado (ou ffmpeg com 2 threads) quando o Soccermon estiver rodando agentes (recomendado)**
   - B) Deixa como está
8. **Agentes na nuvem (`claude --cloud`)**
   - **A) Testar com 1 tarefa pequena, depois decidir (recomendado)**
   - B) Não agora
   - C) Passar todos os agentes pra nuvem
9. **Ajustes pequenos de ferramenta** (`tsc` incremental, tirar `tsconfig.tsbuildinfo` do git, dividir
   `engine.test.ts`, `vitest related` na trilha rápida)
   - **A) Fazer todos junto com o CI novo (recomendado)**
   - B) Só o `tsc` incremental
   - C) Nenhum

## Fontes

- Vitest, desempenho (pools, `isolate`, shards, cache): https://vitest.dev/guide/improving-performance
- Vitest, CLI (`related`, `--changed`, `--shard`): https://vitest.dev/guide/cli
- GitHub Actions, máquinas padrão (4 CPU / 16 GB, grátis e sem limite em repo público):
  https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- Merge queue (repos públicos de organização): https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/
- Vercel `deploy --prebuilt` (perde as variáveis de sistema no build): https://vercel.com/docs/cli/deploy
- Vercel, testes E2E depois da prévia e "Protection Bypass for Automation":
  https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment e
  https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
- Claude Code na nuvem (`claude --cloud`, VM por sessão, conta no limite do plano):
  https://code.claude.com/docs/en/claude-code-on-the-web
- Dados próprios: transcrições da sessão `e1939d5f…` (agentes da rodada 0.8.8), `gh api …/deployments`,
  `…/commits/<sha>/statuses`, `gh run view --json jobs`.
