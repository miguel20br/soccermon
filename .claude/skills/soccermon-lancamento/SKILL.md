---
name: soccermon-lancamento
description: Como lançar uma versão nova do Soccermon (0.8.x) do jeito que o Miguel gosta, do teste ao ar. Use quando ele disser "lança", "sobe", "pode subir", "vamos lançar a 0.8.x", "faz o deploy", ou quando um conjunto de mudanças aprovadas estiver pronto pra virar versão.
---

# Lançar uma versão do Soccermon

Aprendido na 0.8.3 e na 0.8.4 (17/10/2026). Push na `main` publica sozinho em produção (Vercel ligada ao GitHub),
então **nada vai pra `main` sem o "pode subir" do Miguel** na conversa, mesmo com tudo aprovado antes.

## 1. Antes de pedir o "pode subir"

1. **Tudo numa branch de integração** (ex.: `teste-084`), com push pra ter prévia na Vercel:
   `https://soccermon-git-<branch>-miguel20brs-projects.vercel.app` (pede login da Vercel). Prévia nova leva uns
   minutos; o link fixo de cada deploy sai em `gh api repos/miguel20br/soccermon/deployments?per_page=5`.
2. **Motor mudou?** (mesma seed + mesmas ordens dão outro jogo: balanceamento, regra, golpe, contas) → suba
   `ENGINE_VERSION` em `src/engine/config.ts`. Partida salva no meio com outra versão recomeça do 0 a 0.
   **E refaça a Edge Function da Liga** (ela leva o motor empacotado e recusa partida de outra versão):
   `npm run edge:liga` e, junto com o push na `main`,
   `npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api` (token
   `SUPABASE_ACCESS_TOKEN` do `.env.local`). Confira com uma partida da Liga no ar.
3. **Save mudou de formato?** → migração em `src/store/` (`migrateSave`, `SAVE_VERSION`) + teste.
4. **Checagens pela trilha** ([docs/planos/esteira.md](../../../docs/planos/esteira.md)): `node scripts/trilha.mjs`
   diz rápida ou completa. Local, `npm run check:rapido` (segundos); o pesado é do **CI da branch** (lint, tsc,
   vitest, build, fumaça da copa e prints 390/1440 no artefato `fumaca-prints`): `gh run watch` e tem que dar
   `check` verde. `npm run check:completo` local só se o CI não der (entra na fila pesada sozinho). Se o equilíbrio
   mudou, `npm run calibrate -- --n 400` (ver skill `soccermon-balanceamento`), via `scripts/pesado.sh`.
5. **Fumaça além do CI** (skill `soccermon-teste-navegador`): só o que o CI não cobre. Trilha completa: copa inteira
   com troca no intervalo, save antigo, Duelo em 2 páginas se mexeu em `src/net`/`src/ui/duel`; 320 e deitado. A
   prévia da Vercel tem os `?demo=` e `?vel=N` (modo fumaça): dá pra pular direto pra tela.
6. **Novidades** em `src/ui/patch-notes.ts`, PT (`PATCH_NOTES`) e EN (`PATCH_NOTES_EN`), a mais nova primeiro:
   - título curto da versão ("Balanceamento geral e o seu treinador");
   - seções por assunto; mudança de número sempre "antes ⇒ depois" (Onix: Fixo 63 ⇒ 70);
   - Pokémon em "buff" e "nerf e ajuste";
   - nada de emoji.
7. `npm run changelog` (gera o `CHANGELOG.md`) e `npm version X.Y.Z --no-git-tag-version`.
   **Número com 4 partes** (0.8.8.1, 0.8.8.2…; usado em 19/10 pra separar o que subiu no mesmo dia): o npm só aceita
   semver em `"version"`, então ela fica no último X.Y.Z e o número de 4 partes vai em `"displayVersion"` no
   `package.json` (`__APP_VERSION__` = `displayVersion ?? version` em `vite/config.prod.mjs` e `config.dev.mjs`:
   Home, Novidades, Duelo e estatísticas mostram esse). Na próxima X.Y.Z, apague o `displayVersion`. A `version` das
   Novidades é o mesmo número de 4 partes.
8. Atualize o "Estado atual" do `CLAUDE.md` e a tabela de versões de `docs/planos/lancamento.md` (✓ na versão).
9. Confira os e-mails dos commits: `git log --format=%ae origin/main..HEAD | sort -u` tem que dar só
   `105948884+miguel20br@users.noreply.github.com`.

Aí resuma pro Miguel (o que entra, o que o teste achou e corrigiu, link da prévia) e pergunte "Posso subir?".

## 2. Depois do "pode subir"

```bash
git fetch -q origin && git merge-base --is-ancestor origin/main HEAD   # tem que dar fast-forward
gh run list --branch <branch> --limit 1      # CI do commit que vai subir: check verde (sem refazer tudo local)
git push origin HEAD:main
git tag -a vX.Y.Z -m "X.Y.Z · <título>" && git push -q origin vX.Y.Z
awk '/^## X.Y.Z/{f=1;next} /^## /{if(f)exit} f' CHANGELOG.md > notas.md   # notas só desta versão
printf '\nJogue em https://soccermon.com\n' >> notas.md
gh release create vX.Y.Z --title "X.Y.Z · <título>" --notes-file notas.md
```

Tag de 4 partes é igual (`v0.8.8.3`, o awk acha `## 0.8.8.3`). Várias versões de uma vez: uma tag anotada e uma
release por versão, cada tag no primeiro commit da `main` em que tudo daquela versão já estava no ar (as tags
`v0.8.8.1`…`v0.8.8.3` foram assim) e a mais nova por último (vira a "Latest" do GitHub).

Confira que foi pro ar:
- deploy de produção `success`: `gh api "repos/miguel20br/soccermon/deployments?per_page=10"` e depois os statuses
  do deploy daquele sha;
- o site serve a versão nova: baixe o `bundle/index-*.js` (era `assets/` até a 0.8.5) de `https://soccermon.com/` e procure `X.Y.Z`;
- CI verde: `gh run list --branch main --limit 1`.

Arrume a casa: `git merge --ff-only origin/main` no checkout principal, `git worktree remove` dos worktrees já
juntados, apague as branches locais e as remotas de prévia (todas já estão na `main`).

## 3. Divulgação

Combinado em 17/10: a 0.8.4 subiu **sem alarde**; a divulgação (TikTok, posts) sai junto com a 0.8.5. Post nas
contas dele: o Claude prepara (skill `soccermon-assets`, textos em `docs/marketing/`) e **para antes de publicar**
pra ele confirmar numa linha.
