# Esteira: da branch pronta ao ar (19/10/2026)

Regras 2, 3, 4, 6, 7 e 9 de "Regras de velocidade" do `CLAUDE.md` (pesquisa em
[pesquisas/velocidade.md](pesquisas/velocidade.md)). O pesado roda no CI do GitHub, não na fila do PC; a esteira
confia no CI e não refaz tudo local.

## Trilhas

`node scripts/trilha.mjs` diz qual vale pra branch (lista única em `scripts/trilha.mjs`, a mesma que o CI usa):

- **Completa:** mexeu em `src/engine/`, `src/league/`, `src/net/`, `src/ui/duel/`, `src/store/`, `supabase/`, ou em
  ferramenta (`package.json`, `vite/`, `tsconfig.json`, `vitest.config.ts`, `.github/`).
- **Rápida:** o resto (telas, texto, i18n, CSS, `public/`, docs).

| | Agente, local | Antes de entregar |
|---|---|---|
| Rápida | `npm run check:rapido` (tsc incremental, Biome e `vitest related` só nos mudados: segundos) + prints 390 e 1440 da tela mexida | CI verde da branch |
| Completa | `npm run check:rapido` enquanto mexe; no fim `npm run check:completo` (entra sozinho na fila pesada) ou só o CI. Local só o que o CI não faz: `npm run calibrate`, `npm run determinismo`, olho no jogo | CI verde da branch |

## CI (`.github/workflows/ci.yml`, push em toda branch)

- **check** (~1 min): `npm ci` com cache, trilha, lint, `tsc`, vitest inteiro, `vite build`. É o que precisa estar verde.
- **smoke** (~2 min, em paralelo, não derruba o CI): build com o modo fumaça, `vite preview`, copa curta (draft,
  1ª partida, resultado) e páginas a 390x844 e 1440x900; prints no artefato `fumaca-prints`, resumo na página da
  rodada. Páginas a mais: uma linha `Fumaça: /?demo=album /?lab=quadras|.seletor` na mensagem de um commit da branch.
- **tempo**: duração da rodada no resumo.
- Push novo na mesma branch cancela a rodada velha.

Ver: `gh run watch` (ou `gh run list --branch <b> --limit 1`), prints: `gh run download <id> -n fumaca-prints`.
Roteiro: `scripts/smoke/fumaca.mjs` (roda local também: build com `SOCCERMON_SMOKE=1 npm run build:vite`, `vite
preview` e `node scripts/smoke/fumaca.mjs copa http://localhost:<porta> <pasta> 390x844`).

## Modo fumaça nas prévias

`__SMOKE__` liga os `?demo=`, `?cards=1`, `?lab=versus|posicoes` e `?vel=N` (quadra N vezes mais rápida, até 64)
no dev, nas prévias da Vercel (`VERCEL_ENV=preview`) e no CI (`SOCCERMON_SMOKE=1`). **Produção não tem** (o build de
produção nem leva o código: confira com `grep -l "Teste do aviso de erro" dist/bundle/*` vazio).

## Fila da esteira

Arquivo no scratchpad da rodada: `scratchpad/<rodada>/fila.md`, uma linha por entrega, o agente escreve ao terminar:

```
- [ ] <branch> · trilha <rapida|completa> · aprovado <sim|não> · <uma linha do que é>
```

A esteira lê a fila sozinha (não espera o principal) e, para cada `[ ]` aprovado e com o CI da branch verde:

1. Junta na branch `esteira` (a partir da `origin/main` atual): `git merge --no-ff <branch>`; conflito simples resolve,
   conflito de regra volta pro agente.
2. `npm run check:rapido` (segundos; pega conflito mal resolvido) e push da `esteira`.
3. Espera o CI **do commit da junção** (`gh run watch`): `check` verde. Smoke vermelho: olha os prints antes de seguir.
4. Publica: `git push origin esteira:main` (fast-forward), marca `[x]` com a hora e segue pra próxima.

Sem refazer testes, build e copa local: isso é do CI. Fumaça local só quando o CI não cobre (Duelo em 2 páginas,
olho no jogo). Mudança que precisa do Miguel (equilíbrio, carta, regra de jogo, Supabase de produção) fica na fila
com `aprovado não` até ele responder; o resto não espera.

## Fila pesada da máquina

Tudo que é pesado vai por `scripts/pesado.sh <comando>` (ou `npm run pesado -- <comando>`): `flock
/tmp/soccermon-heavy.lock`, um por vez, inclusive ffmpeg, render do HyperFrames e outros projetos. Dentro da fila,
chamar de novo não trava (`SOCCERMON_PESADO=1`).
