---
description: Proposta (16/11/2026) de métricas e observabilidade: contar pessoas por aparelho (D1/D7/D30) sem identificar ninguém, idioma, país, origem dos vídeos, eventos dos loops, erros e desempenho, comparação das ferramentas grátis, placar de segunda, volume no Supabase e o que entra na versão de 23/11.
---

# Métricas e observabilidade (proposta de 16/11/2026)

O Miguel pediu "bem mais métricas e observabilidade" e aprovou **medir pessoas, não abas**: idioma, país aproximado,
um contador anônimo por aparelho e D1/D7. O ponto de partida é o diagnóstico de
[crescimento-dados.md](pesquisas/crescimento-dados.md), que lista o que falta. As decisões de 16/11 estão em
[crescimento.md](crescimento.md).

Isto é só proposta: nenhum código mudou e nada foi feito em produção (nem SELECT). Os números de volume são
estimativas a partir do placar de 28 dias.

## Resumo

- **O que já existe e pouca gente lembra:** o `main.tsx` já liga o **Vercel Web Analytics** e o **Speed Insights**
  (`inject()` e `injectSpeedInsights()`). O painel da Vercel **já mostra o país** das visitas desde hoje, sem código
  novo. O que falta é cruzar país com funil e retenção.
- **Pessoas:** um id aleatório do aparelho no `localStorage`, fora do save, que vai no `session_start` junto com
  `first_day`, `day_n` e `days`. Com isso dá D1/D7/D30, novos × recorrentes e pessoas por semana, **sem migração**,
  porque o `props` já aceita campo novo.
- **Contexto:** idioma (`navigator.language`), fuso (`Intl`), PWA, tela, navegador de dentro do app (TikTok/Instagram)
  e a porta de entrada (Duelo, desafio, Copa do Dia). Tudo no `session_start`. País de verdade fica pra uma segunda
  etapa: um gatilho no banco que lê o `cf-ipcountry` sem guardar IP.
- **Origem dos vídeos:** `soccermon.com/tt` e `/yt` escritos **no vídeo** (os redirects já existem no `vercel.json`),
  detecção do navegador interno do TikTok e do Instagram, e, se o Miguel quiser, uma pergunta opcional de 1 toque
  **depois da 1ª partida**, nunca na porta.
- **Erros:** hoje a tela de crash do `ErrorBoundary` **não manda evento** (o `componentDidCatch` só faz
  `console.error`), e o `error` vai sem stack nem tela. A proposta é stack curta, tela e agrupamento no `npm run stats`.
  O Sentry fica como plano C.
- **Volume:** estimo ~3 a 6 mil eventos por dia, o que dá ~0,5 a 1 GB em 12 meses. **Não cabe nos 500 MB do Supabase
  grátis** se o jogo crescer. Proposta: guardar os eventos crus por 180 dias e conferir o tamanho real da tabela antes.
- **Recomendação:** opção **B**, em duas etapas. Na versão de **23/11** entra só o que não precisa de migração (opção
  A). Depois do 27/11, com o ok do Miguel, entra uma migração pequena (2 nomes de evento, o gatilho do país e a
  limpeza em 180 dias) e o alerta diário.

## 1. O que existe hoje (conferido no código)

| Peça | Onde | O que faz | Buraco |
|---|---|---|---|
| Eventos anônimos | `src/analytics/track.ts` (`track`, `startAnalytics`, `onChange`) | lote a cada 8 s pra `public.game_events`; só em `soccermon.com`, sem robô (`isBot`); desliga em Configurações (`settings.stats`) | `session` vive no `sessionStorage`: **aba, não pessoa** |
| Tabela e limites | `supabase/migrations/20261015150000_estatisticas.sql`, `…190000_estatisticas_limites.sql`, `20261111120000_evento_nav.sql` | só INSERT pela API; nomes numa lista fixa (`game_events_name_check`); `props` ≤ 512 bytes; pg_cron apaga eventos com mais de 12 meses | nome novo de evento = migração |
| Placar | `scripts/stats.ts` (`npm run stats`, `--md`, `--canal`) | período, gente, funil, canais, jogo, erros, retenção por dia, foco | "retenção" é `returning` (aparelho com save), não coorte |
| Visitas e velocidade | `src/main.tsx` (`@vercel/analytics`, `@vercel/speed-insights`) | página aberta, país, origem, aparelho; nota de velocidade (RES) | não cruza com o jogo; o plano grátis guarda 1 mês |
| Erros de JS | `startAnalytics` (`window` `error` e `unhandledrejection`), `errorText`, `errorGate` | manda a mensagem (até 160 caracteres, sem URL nem e-mail); no máximo 3 iguais e 30 por sessão | **sem stack, sem tela**. Erro de tela do React não chega (ver §5.1) |
| Tela de crash | `src/ui/components/ErrorBoundary.tsx`, `?demo=crash` (`App.tsx`, só fumaça) | aviso com Voltar, Recarregar e Copiar relatório | `componentDidCatch` não chama `track` |
| Saída antes da 1ª partida | `firstLeave` (`first_leave`) | tela, passo da copa, cartas, tick, velocidade, segundos | não diz se a pessoa tocou em algo |
| Compartilhar | `Result.tsx` (`share` com `kind: text/image/download-*`) | mede o Compartilhar da copa normal | **Copa do Dia não manda** (`Daily.tsx`, função `share`); **clipe não manda** (`Moments.tsx`, `clip-recorder.ts`) |
| Links de origem | `vercel.json` (`/tt`, `/yt`, `/ig` → `utm_source`), `referrer()` | `utm_source` ou domínio de quem mandou | desafio e Copa do Dia usam o mesmo `utm_source=share`; convite do Duelo (`?duelo=`) não tem marca |
| Duelo | `Duel.tsx` (`duel_join`, `duel_match_end` com `wo`/`desync`) | entrada e fim | falha de conexão (canal não abriu) não aparece |
| Liga | `src/league/api.ts` (`liga()`, tenta de novo no 546/5xx) | — | a falha final só vira `{ error }` na tela, sem evento |

**Achado de brinde (hipótese, conferir com 1 SELECT):** o `canal()` do `stats.ts` pega o "nome do meio" do domínio.
Quem chega por um app do Android tem `document.referrer` = `android-app://com.google.android.youtube/`. O `referrer()`
guarda `com.google.android.youtube`, e o `canal()` transforma isso em **`android`**. As 47 sessões "android" do
diagnóstico podem ser YouTube, app do Google, Gmail e outros apps juntos. Se for isso, **o YouTube já trouxe gente e o
placar escondeu**. O conserto é uma linha no `canal()` (pegar o último pedaço quando começa com `com.`).

## 2. Pessoas e retenção

### 2.1 O contador do aparelho

No `localStorage`, numa chave própria (`soccermon-aparelho`), **fora do save**:

```ts
{ id: crypto.randomUUID(), first: '2026-11-23', last: '2026-11-25', days: 2, legacy: false }
```

- **Fora do save de propósito:** o save (`soccermon-save`, `createJSONStorage(() => idbStorage)`) vai pra nuvem de
  quem loga e pro arquivo de backup. Se o id entrasse lá, ficaria ligado à conta Google. No `localStorage` separado,
  o id nunca encontra o `auth.uid`, e a `game_events` continua sem coluna de usuário. **Regra: nunca juntar o id do
  aparelho com conta, amigo ou ranking.**
- **Sem fingerprint:** é um número sorteado, não algo calculado do navegador, da tela ou de fontes. Limpar os dados
  do site zera o id.
- **Quando não cria:** com as estatísticas desligadas, com o Global Privacy Control ligado
  (`navigator.globalPrivacyControl`) ou sem `localStorage` (aba anônima, bloqueio). Desligar as estatísticas **apaga**
  a chave. O padrão de `try/catch` já existe em `src/ui/local-count.ts`.
- **`legacy`:** no dia em que o código entra, todo aparelho que já tem save (`returning`) vai parecer "novo de hoje".
  Por isso ele nasce com `legacy: true` e fica fora das coortes. Só conta coorte quem chegar depois.
- **Datas** no calendário local do aparelho (`toLocaleDateString('en-CA')`). O próprio cliente calcula `day_n` (dias
  desde o `first`), então o fuso não bagunça a conta no banco.

O que vai no `session_start` (o `props` já aceita campos novos sem migração; ver o comentário do `screenProps`):

| Campo | Exemplo | Pra quê |
|---|---|---|
| `did` | uuid | contar aparelhos (pessoas, com as ressalvas abaixo) |
| `first_day` | `2026-11-23` | coorte |
| `day_n` | `1` | dias desde o 1º dia (0 = primeiro dia) |
| `days` | `3` | em quantos dias diferentes já jogou |
| `new_day` | `true` | 1ª sessão deste aparelho hoje (conta "ativos do dia" sem precisar de `distinct`) |
| `legacy` | `false` | fora das coortes |

Isso continua bem abaixo dos 512 bytes do `props`, junto com o contexto da §3. Um teste no `track.test.ts` confere.

### 2.2 As métricas

- **Pessoas por dia, semana e mês** (DAU/WAU/MAU): `count(distinct did)` nos `session_start` da janela.
- **Novos × recorrentes:** novo = `day_n = 0`; recorrente = `day_n ≥ 1`. Substitui o `returning`, que conta abas.
- **D1, D7 e D30** por coorte **semanal** (60 a 200 novos por semana; coorte diária daria 3 de 8, puro ruído):
  - D1 clássico: voltou no dia seguinte (`day_n = 1`);
  - D7 e D30 "na janela": voltou em algum dia entre 7–13 e 30–36. O clássico (exatamente no dia 7) fica com amostra
    pequena demais.

  ```sql
  -- D1 por coorte semanal (o stats.ts faz em JS; este é o mesmo cálculo)
  with s as (select props->>'did' did, (props->>'first_day')::date f, (props->>'day_n')::int n
             from game_events where name='session_start' and not coalesce((props->>'legacy')::bool,false))
  select date_trunc('week', f)::date coorte, count(distinct did) filter (where n=0) novos,
         round(100.0*count(distinct did) filter (where n=1) / nullif(count(distinct did) filter (where n=0),0),1) d1
  from s group by 1 order by 1;
  ```
- **Funil por pessoa, não por aba:** a pessoa que abre o jogo de manhã e joga à noite em outra aba conta uma vez só.
  Isso conserta o "direto" do diagnóstico (quem chega pelo convite do Duelo e começa a copa no dia seguinte).
- **Tamanho das sessões:** hoje é o último evento menos o primeiro da aba (2,5 a 7,9 min de mediana), e aba aberta
  infla o número. A proposta é um evento `session_end` no `pagehide`/`visibilitychange` com `active_s` (soma do tempo
  com a aba visível) e `matches`. Precisa de migração (nome novo), então fica pra etapa 2. Até lá, tempo por pessoa e
  por dia = soma das abas do mesmo `did`.

**Limites do contador (e por que dá pra viver com eles):** o PWA no iPhone tem armazenamento separado do Safari, então
a mesma pessoa conta 2 vezes. A aba anônima vira um aparelho novo a cada vez. Duas pessoas no mesmo celular contam 1.
Tudo isso infla um pouco os "novos" e baixa um pouco o D1. Pra comparar semana com semana, serve.

### 2.3 LGPD: por que é aceitável

- **O que a LGPD chama de dado pessoal** é a informação de pessoa identificada ou **identificável** (art. 5º, I). Um
  número sorteado no navegador, sem IP, sem conta, sem e-mail e sem nada que ligue a uma pessoa, chega perto do dado
  anonimizado (art. 12). A leitura mais segura é tratar o id como **pseudônimo**, ou seja, como dado pessoal de baixo
  risco, e cumprir o básico. O jogo já cumpre quase tudo:
  - **Base legal:** legítimo interesse (art. 7º, IX e art. 10), que serve pra "saber se o jogo funciona e o que
    melhorar". O guia de cookies da ANPD (2022) aceita legítimo interesse pra cookie analítico, com teste de
    balanceamento e opção de recusar. A recusa já existe: Configurações → Seus dados → Estatísticas anônimas.
  - **Minimização:** sem IP, sem cidade, sem fingerprint, sem ligar à conta. País só como código de 2 letras.
  - **Transparência:** a política de privacidade explica (texto abaixo).
  - **Retenção curta:** eventos crus apagados em 180 dias (hoje são 12 meses).
- **Público jovem:** fã de Pokémon inclui adolescente e criança. O Enunciado CD/ANPD nº 1/2023 diz que dado de criança
  e adolescente pode usar as bases do art. 7º (inclusive legítimo interesse), olhando o melhor interesse deles. Contar
  visitas sem perfil, sem anúncio e sem venda de dado está dentro disso. A regra prática continua sendo **nunca usar o
  id pra perfilar, mirar ou mandar nada pra terceiro**.
- **Visitante da Europa:** a regra de lá (ePrivacy) pede consentimento pra guardar coisa não essencial no aparelho. O
  público é BR, e o respeito ao GPC cobre quem liga essa opção. Fica registrado como ressalva, não como bloqueio.

**O que muda na política** (`public/privacidade.html` e `public/privacy.html`, os dois juntos e com a data nova):

1. Em "Estatísticas anônimas → Eventos do jogo", trocar "Cada evento leva só um código aleatório da sessão (some quando
   você fecha a aba)" por: "Cada evento leva um código aleatório da aba e, no começo, **um código aleatório do
   aparelho**. Esse código fica guardado no navegador até você limpar os dados do site ou desligar as estatísticas, e
   serve pra contar quantas pessoas voltam no dia seguinte e na semana. Ele não tem ligação com sua conta e não é
   enviado a mais ninguém."
2. Somar à lista do começo de sessão: "o idioma e o fuso horário do navegador, o país aproximado (só o código, como BR;
   o IP não é guardado), o tamanho da tela e se o jogo está instalado".
3. Em "Cookies", trocar "o código aleatório da sessão (só enquanto a aba está aberta)" por "os códigos aleatórios da
   aba e do aparelho (este some quando você desliga as estatísticas)".
4. Em "Por quanto tempo", trocar 12 meses por 180 dias se a limpeza mudar.
5. O texto de Configurações (`settings.statsHint` em `src/i18n/pt/settings.ts` e `en`) continua certo: "Conta partidas
   sem saber quem você é".

## 3. Contexto

Tudo no `session_start`, sem migração:

| Campo | Como | Observação |
|---|---|---|
| `lang` | `navigator.language`, cortado em 8 | `detectLang()` (`src/i18n/lang.ts`) já lê; o `lang` do save é o idioma escolhido, que também vale mandar (`ui_lang`) |
| `tz` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | dá a região sem rede nenhuma: `America/Sao_Paulo`, `Europe/Lisbon`, `America/Mexico_City`. Junto com o `lang` (pt-BR × pt-PT) já separa Brasil, Portugal e o resto |
| `country` | etapa 2: gatilho no banco (abaixo) | o código de 2 letras, nunca o IP |
| `device` | já existe (`device()`: mobile, mobile-land, tablet, desktop) | — |
| `scr` | `screen.width`×`screen.height` em CSS px, arredondado de 10 em 10 | arredondar evita virar mais uma pista de fingerprint |
| `pwa` | `standalone()` de `src/ui/install.ts` (exportar) | instalou ou não |
| `inapp` | user agent: `musical_ly`/`BytedanceWebview` → `tiktok`, `Instagram` → `instagram`, `FBAN`/`FBAV` → `facebook` | quem tocou no link **dentro** do app (ver §4) |
| `entry` | URL: `duelo` (tem `?duelo=`), `seed` (desafio), `daily` (link da Copa do Dia) | separa o convite do "direto" |
| `load_ms` | `performance.now()` na hora do `session_start` (depois de o save carregar) | tempo até o jogo estar pronto |
| `app_version` | já vai em toda linha (`__APP_VERSION__`) | — |

**País aproximado, 3 caminhos:**

1. **Agora, sem nada:** o painel do Vercel Web Analytics já mostra país (só visitas e só 1 mês, sem cruzar com o jogo).
2. **Gatilho no banco (recomendado na etapa 2):** o Supabase fica atrás da Cloudflare, que manda o cabeçalho
   `cf-ipcountry`. O PostgREST expõe os cabeçalhos pro SQL em `current_setting('request.headers', true)`. Um gatilho
   `before insert` na `game_events` grava `props.country` no `session_start` e não guarda IP. É zero código no cliente
   e zero requisição a mais. **Falta confirmar** que o cabeçalho chega: há relato de captura com `cf-ipcountry` em
   requisição do Supabase, mas não há doc oficial. O teste sem risco é num **2º projeto Supabase grátis** (o plano dá
   2), nunca em produção. Uma ressalva: o cliente pode mandar um `cf-ipcountry` falso. Pra estatística, tanto faz.
3. **Função da Vercel:** `api/pais.ts` devolve `x-vercel-ip-country` (cabeçalho documentado), e o cliente busca uma vez
   por sessão antes do `session_start`. São ~3 mil chamadas por mês, contra 1 milhão grátis no Hobby. Fica de reserva
   se o 2 não funcionar. O custo é uma requisição a mais e uma pasta `api/` nova.

## 4. Origem

- **Já funciona:** `utm_source` e o domínio do referrer (`referrer()`).
- **O vídeo sem link clicável:** quem vê o TikTok ou o Shorts digita `soccermon.com` e cai em "direto". Três peças
  baratas, da mais barata pra mais cara:
  1. **Endereço curto no próprio vídeo e na legenda:** `soccermon.com/tt` no TikTok, `/yt` no Shorts, `/ig` no
     Reels. Os redirects já existem. Digitar 3 letras a mais é pouco, e se o vídeo mostra o endereço com a barra, a
     pessoa copia como está. É trabalho da skill `soccermon-social` (cartela final e legenda), sem código.
  2. **`inapp` no `session_start`** (§3): quem toca no link da legenda ou do comentário abre no navegador interno do
     TikTok ou do Instagram, e o user agent entrega. O YouTube no Android abre num Custom Tab, cujo referrer é
     `android-app://com.google.android.youtube` (ver o achado da §1).
  3. **Pergunta opcional "Como você conheceu o Soccermon?"**, 1 toque: TikTok, Instagram, YouTube, Amigo, Google,
     Outro, e um "pular" do mesmo tamanho. Aparece **uma vez por aparelho**, na tela de resultado **depois da 1ª
     partida**, nunca na porta, porque a porta é onde o funil já vaza (51% das novas não começam copa). A resposta vai
     num evento `origem` (nome novo, então precisa de migração) e fica no contador do aparelho pra não perguntar de
     novo. É elemento de tela e texto novo, então o Miguel aprova o visual antes.
- **Também:** o link da Copa do Dia passa a usar `utm_source=daily` em vez de `share` (`Daily.tsx`, `share`), e o do
  convite do Duelo ganha `utm_source=duelo` (`src/ui/duel/link.ts`). Assim "veio por convite" e "veio pelo desafio"
  deixam de se misturar.
- **Código no vídeo** ("digite TIKTOK no Perfil"): descartado. Pede esforço de quem acabou de chegar, e o `/tt` faz o
  mesmo sem atrito.

## 5. Funil e loops: eventos que faltam

Sempre que dá, o evento reaproveita um nome que já existe, pra não precisar de migração:

| O quê | Evento | Onde | Migração? |
|---|---|---|---|
| Compartilhar da Copa do Dia | `share` `{ kind: 'daily', day: nº do dia, result, wins }` | `Daily.tsx`, `share` (e o Compartilhar grande novo) | não |
| Clipe exportado | `share` `{ kind: 'clip', fmt: 'mp4'/'webm', secs, ok }` | `Moments.tsx`, depois do `ClipRecorder` terminar | não |
| Chegada por convite ou desafio | `session_start.entry` + `utm_source=duelo/daily/share` | §3 e §4 | não |
| Conversão do convidado | com o `did`: o aparelho com `entry=duelo` que teve `run_start` em até 7 dias | `stats.ts` | não |
| Botão "monta seu time" no fim do Duelo | `nav` `{ kind: 'cta', to: 'estadio', from: 'duel' }` (o `trackNav` já existe) | onde o botão nascer | não |
| Desafio da semana (quando existir) | `run_start` com `weekly: id` e, no prêmio, `reward` com `screen: 'weekly'` | o desafio é de conta, então o prêmio passa pelo save | não |
| Abandono na porta | `first_leave` ganha `taps` (toques na página até sair) e `last` (último `nav.to`) | `firstLeave` | não |
| Tempo de sessão e desempenho da aba | `session_end` `{ active_s, matches, fps_low }` | `startAnalytics` (`pagehide`) | **sim** |
| "Como conheceu?" | `origem` `{ answer }` | tela de resultado da 1ª partida | **sim** |

**Abandono na porta:** o `first_leave` já diz em que tela a pessoa saiu (Home 70, Duelo 55 no diagnóstico). O que
falta é saber **se ela chegou a tocar em algo**. Com `taps = 0` e `load_ms` alto, o problema é carregamento. Com
`taps = 0` e `load_ms` baixo, a Home não convida. Com `taps > 0` e `last = 'daily'`, ela tentou algo e desistiu. Dá
pra ler isso em `stats.ts` por aparelho, idioma e `inapp`. Uma pergunta que o diagnóstico não respondia: **quem fala
inglês sai mais na porta?**

## 6. Observabilidade técnica

### 6.1 Erros

O que melhora em casa, sem ferramenta nova:

1. **Erro de tela do React:** pela doc do React 19, o erro pego por um Error Boundary vai, por padrão, só pro console
   (`onCaughtError`). O `ErrorBoundary.componentDidCatch` não chama `track`, então **a tela de crash, o pior caso, hoje
   não aparece no placar**. Conserto: `track('error', { kind: 'react', … })` no `componentDidCatch` (ou
   `onCaughtError` no `createRoot`). **Conferir com `?demo=crash` numa prévia** antes de afirmar. O `?demo=crash` só
   existe com `__SMOKE__`, e as estatísticas só ligam em `soccermon.com`, então o teste é de unidade ou de console, não
   no placar.
2. **Campos novos no `error`:** `kind` (`window`/`promise`/`react`/`duel`/`liga`), `screen` (`useGame.getState().screen`)
   e `at` (os 2 primeiros quadros da stack no formato `arquivo:linha:coluna`, com o mesmo filtro de URL e e-mail do
   `errorText`). Mensagem 160 + stack 2 quadros (~150) + tela cabem nos 512 bytes.
3. **Agrupamento no `stats.ts`:** chave = mensagem sem números + 1º quadro. Por grupo: sessões, aparelhos (`did`),
   versões, primeira e última vez. A seção "6. Erros" passa de "os 10 últimos" pra "os grupos, com **novo nesta
   versão**" no topo.
4. **Stack legível (depois, se precisar):** o bundle sai minificado (`/bundle/*.js` com hash). Com
   `build.sourcemap: 'hidden'` no `vite/config.prod.mjs` os `.map` são gerados sem o comentário que faz o navegador
   baixar, e um `npm run erros` traduz `arquivo:linha:coluna` pra linha do código (o `source-map-js` já está no
   `package-lock`, vindo do Vite). Como o repo é público (AGPL), o mapa publicado não expõe nada que já não esteja
   no GitHub.
5. **Duelo e Liga:** `error` com `kind: 'duel'` quando o canal do Realtime não abre ou dá timeout (o motivo vem do
   status do canal), e `kind: 'liga'` com o `status` quando o `liga()` de `src/league/api.ts` desiste depois das 2
   novas tentativas. O `errorGate` continua valendo.

### 6.2 Desempenho

- **Carregamento:** `load_ms` no `session_start` (§3) e a navegação nativa (`performance.getEntriesByType('navigation')`:
  `responseStart`, `domContentLoadedEventEnd`). Sem biblioteca.
- **fps na partida:** a `MatchScene` já usa o `game.loop`. Ela amostra `game.loop.actualFps` a cada ~2 s num módulo
  simples (sem importar `phaser`, pra Home continuar sem Phaser), e o `match_end` leva `fps_p50` e `fps_low` (o 5º
  percentil). Por `device`, isso responde "o celular aguenta a partida?". Não toca no motor (`src/engine/`) nem no
  resultado das partidas.
- **Web Vitals:** o Speed Insights grátis já coleta, mas no plano Hobby mostra só a nota geral (RES), em 24 h e 7 dias.
  O limite é 10 mil eventos em 30 dias móveis; passou disso, pausa por 14 dias. Num pico de creator, vale ligar o
  `sampleRate`. LCP/INP/CLS por aparelho no nosso banco só se o RES cair (a lib `web-vitals` tem ~2 KB).

### 6.3 Saúde do Supabase

| Coisa | Onde olhar | Alerta |
|---|---|---|
| Banco (500 MB) | painel → Database → tamanho; `select pg_size_pretty(pg_total_relation_size('public.game_events'))` | > 350 MB |
| Realtime do Duelo (200 conexões simultâneas, 2 milhões de mensagens por mês) | painel → Reports → Realtime | pico > 150 em dia de creator ou do UT |
| Edge Function `liga` (500 mil chamadas por mês) | painel → Edge Functions (log de só 1 dia no grátis) | `error kind=liga` > 0 no dia, depois de 12/01 |
| Pausa por 7 dias parado | os próprios eventos mantêm o projeto vivo | zero `session_start` em 24 h |

### 6.4 Alertas (grátis)

Um **GitHub Action diário** (cron, que é grátis em repo público) roda `scripts/alertas.ts`, um irmão do `stats.ts` que
usa uma **role só de leitura** nas views do schema `analytics`. A URL do banco vai como secret do GitHub, nunca no
repo. Quando algo passa do limite, o job falha, e o GitHub manda e-mail pro Miguel. Os limites:

- zero `session_start` em 24 h (site fora ou estatística quebrada);
- grupo de erro **novo** na versão atual com 3+ aparelhos;
- sessões com erro acima de 1% no dia;
- `error kind=liga` ou `kind=duel` acima do normal;
- `game_events` acima de 350 MB.

Cuidado: o log de Action de repo público é público. O job escreve só "alerta: erros novos (3)", sem as mensagens.

### 6.5 Comparação das ferramentas grátis

| Ferramenta | Limite grátis | Privacidade | Peso no bundle | Segredo? | Veredito |
|---|---|---|---|---|---|
| **Em casa (`game_events`)** | 500 MB de banco (§8) | dado fica com a gente; sem IP | 0 (já existe) | não (chave pública do Supabase) | **base de tudo** |
| **Vercel Web Analytics** (já ligado) | 50 mil eventos por mês; 1 mês de histórico; sem evento próprio nem UTM no Hobby; passou do limite, pausa 7 dias | sem cookie; já na política | já está | não | manter: país e origem de graça |
| **Vercel Speed Insights** (já ligado) | 10 mil eventos em 30 dias móveis; só RES no grátis; passou, pausa 14 dias | já na política | já está | não | manter; `sampleRate` se crescer |
| **Sentry** (Developer) | 5 mil erros, 30 dias, 1 usuário, alerta só por e-mail, 1 monitor de uptime, 50 replays | terceiro; guarda IP, a menos que se desligue no projeto; política muda | ~23 KB gz (só erro); dá pra carregar depois da Home | DSN é público; token só pra mandar sourcemap (secret na Vercel) | **plano C**: só se o agrupamento em casa não bastar |
| **PostHog** | 1 milhão de eventos, 5 mil replays e 100 mil exceções por mês | terceiro; tem modo sem cookie; replay grava a tela (pesado pra público jovem) | dezenas de KB (não medi) | chave pública | **não**: repete o `game_events` e pesa |
| **Cloudflare Web Analytics** | grátis, sem limite claro de pageviews (fontes divergem sobre amostragem e retenção) | sem cookie, segundo a Cloudflare (uma análise contesta) | ~6 KB | não | **não**: repete o Vercel WA |
| **Google Search Console** | grátis | não toca no jogador | 0 | registro TXT no DNS da Vercel | **sim** (já decidido): explica a queda do Google |

## 7. Painel

- **Onde o Miguel vê:** o `npm run stats` (com `--md` pra colar na conversa) continua sendo o placar. Seções novas:
  - **Pessoas:** aparelhos na semana, novos, recorrentes;
  - **Retenção:** tabela de coortes semanais com D1/D7/D30 (substitui a "7. Retenção" de hoje);
  - **Contexto:** idioma, fuso/país e PWA, com o funil de cada um;
  - **Origem:** canal + `inapp` + `entry` + resposta do "como conheceu?";
  - **Loops:** compartilhamentos por tipo e conversão do convite;
  - **Erros agrupados;**
  - **Desempenho:** `load_ms` e `fps_low` por aparelho.
- **Página local:** um `--html <arquivo>` que escreve um HTML com as mesmas tabelas no scratchpad ou em `~/`, nunca no
  repo e nunca publicado (memória "Sem Artifacts"). Só se o `--md` cansar. É da opção C.
- **Painéis de fora:** o da Vercel (país e origem das visitas) e o do Supabase (tamanho do banco, Realtime, função
  `liga`) pra conferir a saúde. Nenhum painel novo de terceiro.

### Placar de segunda (10 linhas)

As metas são palpites pra revisar depois de 2 semanas de dado. A base é a semana de 09/11 do diagnóstico.

| # | Métrica | Hoje | Meta |
|---|---|---|---|
| 1 | Pessoas novas na semana (aparelhos `day_n=0`) | ~63 (sessões novas) | 100 |
| 2 | Pessoas ativas na semana (WAU) | sem dado | +10% por semana |
| 3 | % de novos que começam copa (a porta) | 54% | 65% |
| 4 | % de novos que terminam a 1ª partida | 35% | 45% |
| 5 | D1 da coorte da semana anterior | sem dado | 25% |
| 6 | D7 (janela 7–13) da coorte de 2 semanas atrás | sem dado | 10% |
| 7 | Compartilhamentos a cada 100 copas terminadas (copa, Copa do Dia e clipe) | ~1,7 | 5 |
| 8 | % de convidados (Duelo) que começam copa em 7 dias | ~10% | 25% |
| 9 | % de novos com origem conhecida (não "direto") | ~52% | 70% |
| 10 | Saúde: sessões com erro a cada 1.000, `fps_low` no celular e `load_ms` p75 | sem dado | < 5; ≥ 30; < 3 s |

À parte, os cliques do Search Console na semana (manual, do painel do Google).

## 8. Volume e custo

- **Estimativa (sem consultar o banco):** em 28 dias foram 1.401 sessões, 3.591 copas e 8.844 partidas. Cada copa
  gera ~40 a 50 eventos (`run_start`, `formation`, ~8 `pick`, 4 `match_end`, `reward`, `run_end`, ~20 `screen`, `nav`),
  o que dá **~3 a 6 mil eventos por dia**.
- **Espaço:** uma linha com `props` médio de 150 a 300 bytes, mais o uuid, os 2 índices e o overhead do Postgres, fica
  em ~350 a 500 bytes. São ~1,5 a 3 MB por dia, ou **~45 a 90 MB por mês**. Com a limpeza de 12 meses de hoje, a
  tabela chega a **0,5 a 1 GB**, acima dos 500 MB do plano grátis, que ainda divide espaço com saves, Copa do Dia,
  Liga e amigos. E o laço da 0.9.10 já mandou 69 mil linhas de erro em 3 sessões.
- **O que a proposta soma:** o `session_start` fica ~200 bytes maior (~1.500 por mês, desprezível); `session_end` e
  `origem` dão +1 a 2 linhas por sessão; o desempenho entra no `match_end`, sem linha nova. Total: **menos de 5% a
  mais**.
- **Retenção proposta:** eventos crus por **180 dias** (o `cron.schedule` da `…190000_estatisticas_limites.sql` passa de
  `12 months` pra `180 days`). Isso cobre D30 com folga e segura a tabela em ~270 a 540 MB no pior caso. Se o tamanho
  real passar de 250 MB, entra um resumo diário (`analytics.resumo_dia`: dia × métrica × recorte, poucos KB) antes de
  apagar. **Primeiro passo, antes de decidir:** rodar o `pg_total_relation_size` (§6.3) no SQL Editor. É leitura, e
  quem roda é o Miguel.
- **Custo em dinheiro:** zero. Tudo no grátis da Vercel, do Supabase e do GitHub.

## 9. Opções

### A. Enxuto: só o que não precisa de migração (~1 dia de código; risco baixo)

O contador do aparelho e o contexto no `session_start` (§2 e §3, menos o país); o `share` da Copa do Dia e do clipe;
o `nav` do "monta seu time"; `taps` no `first_leave`; `kind`, `screen` e `at` no `error`, mais o `componentDidCatch`;
fps no `match_end`; o conserto do `canal()`; `utm_source=daily/duelo`; as seções novas do `stats.ts`; a política
atualizada; `/tt` e `/yt` escritos nos vídeos; Search Console. Nada muda no banco de produção, só o código publicado.
**Limite:** sem país de verdade (só fuso e idioma), sem tempo de sessão e sem "como conheceu?".

### B. Médio: A + uma migração pequena + alerta (~2 a 3 dias; risco baixo) · **recomendado**

Tudo do A, mais uma migração (com o ok do Miguel):

- os nomes `session_end` e `origem` na `game_events_name_check`;
- o gatilho do país (`cf-ipcountry`), testado antes num 2º projeto grátis;
- a limpeza em 180 dias.

E ainda: a pergunta "como conheceu?" (com o visual aprovado), o `scripts/alertas.ts` no GitHub Action diário e o
sourcemap `hidden`. **Risco:** a migração precisa entrar antes do código que manda os nomes novos, senão o lote inteiro
dá 400 e some (é o aviso do `EVENT_NAMES`). Se o cabeçalho não existir, o país cai no plano 3 (função da Vercel).

### C. Completo: B + ferramentas de fora (~4 a 5 dias; risco médio)

Tudo do B, mais:

- Sentry free carregado depois da Home, com sourcemap pelo token (secret na Vercel);
- `web-vitals` no `session_end`;
- painel HTML local (`--html`);
- resumo diário no banco.

**Risco:** terceiro novo na política, +23 KB (carregados depois) e um segredo a mais pra cuidar. Repete boa parte do
que o B já faz em casa.

### Recomendação

**B, em duas etapas.** A parte A vai na versão de **23/11**, porque não mexe no banco, não mexe no Time Ultimate e já
destrava D1/D7 a partir do dia 23. Assim a coorte do lançamento do UT (27/11) **já nasce medida**, que é o motivo de não
esperar. A migração, a pergunta e o alerta entram na semana de 30/11, com o ok do Miguel, e o país pelo gatilho
depois do teste no projeto de rascunho. O C só se os erros agrupados em casa não bastarem.

## 10. Decisões pro Miguel (recomendação primeiro)

1. **Opção B em duas etapas (A no 23/11, migração depois do UT)?** Sim.
2. **O id do aparelho fica fora do save (não vai pra nuvem nem pro backup) e nunca se junta com a conta?** Sim.
3. **Respeitar o Global Privacy Control (sem id pra quem liga)?** Sim, custa 1 linha.
4. **País pelo gatilho do `cf-ipcountry`, testado antes num 2º projeto Supabase grátis?** Sim. Até lá, fuso e idioma.
5. **Pergunta "Como conheceu?" depois da 1ª partida, 1 toque, com Pular?** Sim, mas só depois de você ver o visual
   (semana de 30/11). Se preferir não ter tela nova, o `/tt` nos vídeos e o `inapp` cobrem boa parte.
6. **`soccermon.com/tt` e `/yt` escritos na cartela final dos vídeos a partir do News de 23/11?** Sim.
7. **Eventos crus por 180 dias em vez de 12 meses?** Sim. Antes, rode a consulta de tamanho da §6.3 no SQL Editor e me
   passe o número.
8. **Alerta diário por GitHub Action, com uma role só de leitura?** Sim, depois do UT.
9. **Sentry?** Não agora.
10. **As 10 linhas do placar de segunda e as metas da §7?** Sim, revisando as metas depois de 2 semanas.

## 11. O que entra na versão de segunda 23/11 (trilha rápida, nada do UT)

Tudo da opção A, nesta ordem (cada item com teste no `track.test.ts` ou no `stats`):

1. Contador do aparelho (`did`, `first_day`, `day_n`, `days`, `new_day`, `legacy`) no `session_start`, fora do save,
   com o GPC e a recusa respeitados. É a peça mais importante: sem ela a coorte do UT se perde.
2. Contexto no `session_start`: `lang`, `ui_lang`, `tz`, `scr`, `pwa`, `inapp`, `entry`, `load_ms`.
3. `share` da Copa do Dia (`kind: 'daily'`, com o número do dia que já vai entrar) e do clipe (`kind: 'clip'`);
   `utm_source=daily` no link da Copa do Dia e `utm_source=duelo` no convite.
4. `nav` do botão "monta seu time" (se o botão sair nessa versão).
5. `error` com `kind`, `screen` e `at`, mais o `componentDidCatch` do `ErrorBoundary`; `taps` e `last` no
   `first_leave`.
6. `fps_p50` e `fps_low` no `match_end` (amostra na `MatchScene`, sem tocar no motor nem no resultado: não sobe o
   `ENGINE_VERSION`).
7. `stats.ts`: conserto do `canal()` pros apps do Android, seções Pessoas/Retenção/Contexto/Loops, erros agrupados.
8. `privacidade.html` e `privacy.html` com o texto da §2.3 e a data nova.
9. Fora do código: Search Console (10 min do Miguel no DNS da Vercel) e o `/tt` e o `/yt` na cartela do News.

Fica pra depois do 27/11: a migração (`session_end`, `origem`, o gatilho do país, os 180 dias), a pergunta "como
conheceu?", o alerta diário e o sourcemap.

## Fontes

Projeto: `src/analytics/track.ts`, `src/main.tsx`, `src/ui/components/ErrorBoundary.tsx`, `src/ui/screens/Daily.tsx`,
`src/ui/screens/Result.tsx`, `src/ui/install.ts`, `src/ui/duel/Duel.tsx`, `src/league/api.ts`, `scripts/stats.ts`,
`supabase/migrations/20261015150000_estatisticas.sql`, `…20261015190000_estatisticas_limites.sql`,
`…20261111120000_evento_nav.sql`, `vercel.json`, `vite/config.prod.mjs`, `public/privacidade.html`,
[crescimento-dados.md](pesquisas/crescimento-dados.md), [crescimento.md](crescimento.md).

Vercel:
- [Web Analytics: limites e preço (50 mil eventos, 1 mês no Hobby)](https://vercel.com/docs/analytics/limits-and-pricing)
- [Speed Insights: limites (10 mil eventos em 30 dias, só RES no grátis)](https://vercel.com/docs/speed-insights/limits-and-pricing)
- [Cabeçalhos de requisição (`x-vercel-ip-country`)](https://vercel.com/docs/headers/request-headers)
- [Plano Hobby (1 milhão de chamadas de função)](https://vercel.com/docs/plans/hobby)

Supabase e Cloudflare:
- [Supabase: preços do plano grátis (500 MB, Realtime 200 conexões, log de 1 dia, pausa em 7 dias)](https://supabase.com/pricing)
- [Supabase: ler cabeçalhos da requisição no SQL](https://supabase.com/docs/guides/api/securing-your-api)
- [Hacking the PostgREST headers (relato com `cf-ipcountry`)](https://dev.to/burggraf/hacking-the-postgrest-headers-oh-the-things-you-can-do-ck2)
- [Cloudflare: geolocalização por IP (`CF-IPCountry`)](https://developers.cloudflare.com/support/network/configuring-ip-geolocation)

Ferramentas:
- [Sentry: preços (Developer grátis)](https://sentry.io/pricing/)
- [Sentry: redução do tamanho do SDK](https://blog.sentry.io/javascript-sdk-package-reduced/)
- [PostHog: preços e plano grátis](https://posthog.com/pricing)
- [PostHog: FAQ (modo sem cookie)](https://posthog.com/faq)
- [Cloudflare Web Analytics](https://cloudflare.com/web-analytics)
- [Análise técnica e de privacidade do Cloudflare Web Analytics](https://www.ctrl.blog/entry/review-cloudflare-analytics/)
- [Google: adicionar propriedade no Search Console](https://support.google.com/webmasters/answer/34592)
- [React: `createRoot` (`onCaughtError`, `onUncaughtError`)](https://react.dev/reference/react-dom/client/createRoot)
- [MDN: `navigator.globalPrivacyControl`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl)

LGPD:
- [Lei 13.709/2018 (LGPD), arts. 5º, 7º, 10, 12 e 14](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD: guia orientativo de cookies (2022)](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/processo-guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf)
- [Mattos Filho: resumo do guia de cookies](https://www.mattosfilho.com.br/unico/anpd-guia-cookies-protecao-dados/)
- [Enunciado CD/ANPD nº 1/2023 (dados de crianças e adolescentes)](https://www.mobiletime.com.br/artigos/20/06/2023/anpd-publica-enunciado-sobre-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/)

Sem dado: o tamanho real da `game_events` hoje (não consultei produção); se o `cf-ipcountry` chega mesmo no
`request.headers` do Supabase; o peso exato do `posthog-js`; retenção e amostragem oficiais do Cloudflare Web
Analytics.

## Conferido no banco (16/11/2026, só leitura)

- `game_events` ocupa **54 MB**, com 218.511 linhas desde 16/10; o banco inteiro tem 71 MB. Nesse ritmo, 12 meses dariam uns 650 MB, acima dos 500 MB do plano grátis, então 180 dias é o certo.
- As 47 sessões que o placar conta como "android" têm referrer `com.google.android.googlequicksearchbox`, o app do Google (busca), não do YouTube. A hipótese do YouTube caiu: essas sessões são Google e deviam entrar no canal Google, que então é ainda maior.

## Decidido com o Miguel (16/11/2026)

Todas as 10 decisões aprovadas, cada uma com a recomendação:
1. Fazer em 2 etapas.
2. O id do aparelho fica fora do save.
3. Respeitar o GPC.
4. País pelo `cf-ipcountry`, testado antes num projeto de rascunho.
5. Pergunta "como conheceu?" depois da 1ª partida, com o visual mostrado a ele antes.
6. `/tt` e `/yt` na tela final dos vídeos.
7. Guardar 180 dias.
8. Alerta diário depois do UT.
9. Sem Sentry por enquanto.
10. Placar de segunda com 10 linhas e metas.

A etapa 1 entra na 0.9.53 (segunda, 23/11).
