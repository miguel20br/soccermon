# Ambiente de desenvolvimento: produção, staging e prévias (15/10/2026)

Pedido do Miguel: ter staging, testar builds na Vercel sem estar no ar, e o endereço antigo indo para o
soccermon.com. Boas práticas da Vercel + o que faz sentido para um projeto de uma pessoa com agentes.

## Como fica

| Ambiente | Branch | Endereço | Quem vê | Banco/estatísticas |
|---|---|---|---|---|
| **Produção** | `main` | soccermon.com | todo mundo | Supabase de produção; estatísticas ligadas |
| **Staging** | `staging` | staging.soccermon.com | só o Miguel (login da Vercel) | sem Supabase (jogo 100% local) ou um Supabase de teste |
| **Prévia** | qualquer outra (`feat/...`, PR) | URL automática `soccermon-git-<branch>-….vercel.app` | só o Miguel | igual ao staging |
| **Local** | qualquer | localhost:8080 | você | `.env.local` (produção) |

- A Vercel já cria uma **Preview Deployment** para todo push fora da `main` e para todo PR: é o "build na Vercel
  sem estar no ar". O staging é só uma prévia com endereço fixo.
- **Fluxo:** `feat/x` → PR para `staging` (CI roda lint/testes/build + prévia) → testar em staging.soccermon.com →
  PR `staging` → `main` (deploy de produção) → tag `vX.Y.Z`. Correção urgente: `hotfix/x` → PR direto para `main`.
- **Promover em vez de rebuildar:** depois de testar a prévia, `vercel promote <url>` põe exatamente aquele
  build no ar (instantâneo). Deu ruim em produção: **Instant Rollback** no painel (ou `vercel rollback`).

## Já feito no código (0.8.0)

- **soccermon.vercel.app → soccermon.com** (`src/cloud/domain-move.ts`): o endereço antigo abre o jogo, lê o save
  de quem joga sem conta e manda junto no link (no `#`, que não vai a servidor nenhum); o novo importa e junta.
  Por isso **não** dá para usar o redirecionamento do painel da Vercel agora (ele mandaria a pessoa embora antes
  de o save sair). Daqui a ~1 mês, trocar para redirecionamento 308 no painel.
- **Estatísticas só em soccermon.com** (`src/analytics/track.ts`): prévias, staging e o endereço antigo não
  enviam eventos.

## Painéis (Miguel)

1. **Vercel → Settings → Git → Production Branch:** `main` (já é).
2. **Criar o staging:** eu crio a branch `staging` e dou push; na Vercel → Settings → Domains → Add
   `staging.soccermon.com` → **Git Branch: staging**; no Cloudflare, CNAME `staging` com o valor que a Vercel
   mostrar, nuvem **cinza (DNS only)**.
3. **Vercel → Settings → Deployment Protection:** "Standard Protection" (Vercel Authentication) ligada para
   prévias. Assim staging e prévias só abrem logado na Vercel. Produção continua aberta.
4. **Vercel → Settings → Environment Variables:** as variáveis do Supabase marcadas só em **Production**
   (desmarcar Preview). Prévia/staging rodam sem login e sem nuvem, sem risco de mexer no banco real. Se um dia
   precisar testar login em staging: criar um projeto Supabase de teste e pôr as variáveis dele em Preview, com
   `https://staging.soccermon.com/**` nas Redirect URLs desse projeto.
5. **GitHub → Settings → Branches → regra para `main`:** exigir o CI verde (job do workflow) antes de juntar.
   Para não travar os agentes, dá para deixar push direto liberado para o Miguel e exigir PR só de fora.

## No repo (Claude, depois do lançamento)

- `vercel.json` → `"ignoreCommand"` para não gastar build em commit que só mexe em `docs/`, `trailer/` ou `.md`:
  `git diff --quiet HEAD^ HEAD -- . ':(exclude)docs' ':(exclude)trailer' ':(exclude)*.md'` (sai 0 = pula o build).
- CI: rodar também em PR para `staging`; comentar no PR o link da prévia (a integração da Vercel já faz).
- CLAUDE.md: rotina nova (branch `feat/...`, PR para `staging`, conferir na prévia, juntar na `main`, tag).
- Opcional: smoke test com Playwright contra a URL da prévia no CI (abre o jogo, começa uma copa, joga uma
  partida em 8x, sem erro no console) antes de juntar na `main`.
