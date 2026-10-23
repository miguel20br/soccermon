---
description: Copa do Dia e Liga ranqueada com times fantasma: regras, servidor e abertura.
---

# Copa do Dia e Liga ranqueada (times fantasma)

Feito em 19/10/2026 na branch `liga`. Base: `docs/planos/multiplayer.md` (ordem: duelo amistoso → liga ranqueada) e
`docs/planos/multiplayer-revisao.md` §3.4 (receita do time, validador que roda no servidor).

## Decidido com o Miguel (19/10/2026)

1. **Copa do Dia:** mesma seed pra todo mundo no dia (draft e rivais iguais), **1 tentativa por dia** que vale pro
   ranking (estilo Wordle), texto de compartilhar estilo Wordle (emoji só no texto; a tela usa quadradinhos
   desenhados). Sequência gentil: dias jogados na semana, sem zerar tudo.
2. **Liga:** adversário = **time fantasma** (o time salvo de outro jogador, comandado pela IA), vale Elo, não precisa
   estar online junto. Divisões nas cores das cartas, temporada mensal.
3. **Ranking público:** nome do treinador + clube; só quem está logado (conta Google) entra. Privacidade (PT e EN)
   diz o que fica público.

## Como ficou

| Peça | Onde |
|---|---|
| Dia, seed, sequência, texto de compartilhar | `src/store/daily.ts` (+ `daily.test.ts`) |
| 1 tentativa no save (`daily` no save, `run.daily`, `startDaily`) | `src/store/game-store.ts` |
| Elo, divisões, temporada, escolha do fantasma | `src/league/rules.ts` (+ `rules.test.ts`) |
| Partida da Liga (mesma no navegador e no servidor) | `src/engine/league.ts` |
| Conversa com o servidor | `src/league/api.ts`, `src/league/sync.ts`, `src/league/liga-store.ts` |
| Telas | `src/ui/screens/Daily.tsx` (com o cartão da Home), `src/ui/screens/Liga.tsx`, `src/ui/liga.css` |
| Banco (RLS, funções, limpeza) | `supabase/migrations/20261019180000_copa_do_dia_e_liga.sql` |
| Teste das regras do banco | `supabase/tests/liga_rls.test.sql` (Postgres no Docker, instruções no topo) |
| Servidor da Liga (refaz a partida) | `supabase/functions/liga/index.ts` + `npm run edge:liga` |
| Demo sem Supabase | `?demo=dia`, `?demo=dia&estado=feito`, `?demo=liga` (dev; `src/league/demo.ts`) |

Escolhas da implementação:

- **Fuso:** o dia vira à meia-noite de **Brasília** (America/Sao_Paulo, UTC−3, sem horário de verão desde 2019) no jogo
  e no banco. Seed do dia: `dia-AAAAMMDD`. O tipo em evento da Copa do Dia é o da semana do dia (igual pra todos). A
  seed do dia não abre pelo `?seed=` (seria treino antes da tentativa).
- **1 tentativa:** a entrada do dia nasce no "Jogar" (antes do draft); recarregar volta pra mesma copa; abandonar ou
  trocar por outra copa encerra a tentativa. A copa em andamento vai pras copas guardadas. No ranking quem garante é o
  banco (chave `(conta, dia)`): só vale a tentativa registrada no começo, com rede.
- **Sequência gentil:** 7 quadradinhos (segunda a domingo) + total de dias jogados, que nunca zera.
- **Elo:** começa em 1000; K = 48 nas 10 primeiras partidas da temporada e 32 depois; vitória nos pênaltis = vitória.
  **Só o seu Elo muda** (o fantasma é a IA; assim ninguém sobe o amigo perdendo de propósito pro fantasma dele).
- **Divisões:** Bronze (< 1100), Prata (1100), Ouro (1250), Lenda (1400, creme e dourado como a carta lendária).
- **Temporada:** mês de Brasília. Na temporada nova o Elo volta metade do caminho até 1000 (1400 → 1200).
- **Fantasma:** nunca você, evita os 5 últimos, sorteia entre os 5 de Elo mais perto (times mexidos nos últimos 60
  dias). Começo da Liga (ninguém inscrito): um clube da Copa faz o papel, com Elo 1000.
- **Seu time na Liga:** o da copa atual ou da última (botão "Inscrever o time da copa"), até 3 cartas especiais,
  conferido pelo `validarTimeDuelo` no servidor. É ele que os outros enfrentam.
- **Nome público:** o nome do treinador do Perfil (vazio = "Treinador"), nunca o da conta Google.

## Anti-trapaça

O motor é determinístico e pequeno: **~300 KB** empacotado (75 KB gzip) e **~0,5 s** por partida no Node (0,8–1,2 s no
Deno com a máquina cheia; a 1ª partida de um processo frio ~2 s). Limites da Edge Function no plano grátis: 2 s de CPU
por pedido, 500 mil chamadas/mês, 20 MB de pacote. **Cabe uma partida por pedido**; uma copa inteira (4 partidas) não.

**Liga (feito, forte):** o navegador nunca manda placar.
1. `proxima`: o servidor sorteia o fantasma e cria a partida aberta (1 por vez; recarregar devolve a mesma, sem prazo).
2. `jogar`: só aqui sai a **seed** (antes dela ninguém simula em casa pra fugir das partidas ruins). Começou e largou
   por mais de 2 h = derrota.
3. `resultado`: o navegador manda **só as ordens**; a Edge Function refaz a partida com o motor (`simulateLiga`) e grava
   placar e Elo. Versão do motor diferente = recusa ("recarregue a página"). Teto de 100 partidas por dia.
4. Limite conhecido: o navegador conhece o futuro da partida que está assistindo (igual na Copa); quem mexe no DevTools
   pode escolher ordens melhores. Se um dia precisar: seed por trecho revelada pelo servidor, como no duelo.
5. O time inscrito é "qualquer time que as regras permitem" (validador): ainda não é "time que o servidor viu nascer".

**Copa do Dia (feito: plausibilidade no banco; re-simulação descrita):** as funções `copa_dia_comecar` e
`copa_dia_partida` só deixam: conta Google, 1 tentativa por dia (registrada no começo), partidas na ordem, placar de 0
a 30, empate só com pênaltis, 5 s mínimos entre partidas, tentativa de até 12 h, time e ordens pequenos. O time
escalado e as ordens de cada partida ficam guardados 30 dias. Ninguém escreve nas tabelas direto (RLS só de leitura da
própria linha; leitura pública só pelas funções de ranking, com as colunas públicas).

**Próximo passo da Copa do Dia (não feito):** a partida em si dá pra conferir igual à Liga (rivais saem da seed do dia,
o time e as ordens já chegam), mas o buraco grande é o **draft**: hoje dá pra mandar um time que o draft do dia não
daria. O conserto é guardar as escolhas da copa (formação, vagas, cartas, rerolls, recompensas) e o servidor refazer
o draft inteiro pela seed (as funções do `game-store` já são quase puras). Até lá: auditoria (refazer as partidas do
ranking do dia com o time e as ordens guardados) e zerar quem não bater.

## No ar (19/10/2026)

1. Migração `20261019180000_copa_do_dia_e_liga.sql` aplicada; Edge Function `liga` publicada com o motor da
   `ENGINE_VERSION` 5 (`npm run edge:liga` + `npx -y supabase@latest functions deploy liga --project-ref
   vszcxacbcabohhdwxfpb --use-api`, com o `SUPABASE_ACCESS_TOKEN` do `.env.local`; o gateway confere o JWT e a função
   recusa conta anônima).
2. **Refazer o empacote e o deploy a cada `ENGINE_VERSION` novo** (senão a Liga recusa as partidas da versão nova):
   está no checklist da skill de lançamento.
3. Conferido com contas de teste (criadas pelo admin e apagadas): 4 partidas, placar do servidor igual ao da
   simulação local e ao da tela; recusas de versão, ordens e conta anônima. O pedido `resultado` leva ~2 s de relógio
   (com as idas ao banco); a partida em si roda em ~0,3–0,4 s no Node e nenhum pedido bateu no limite de CPU (546).
   Os logs de CPU da função ficam no painel (o token da CLI não lê logs).
4. A partida da Liga conta na Pokédex como o Duelo (seu lado jogou, o fantasma foi visto).

## Fechada até ter mais gente (19/10/2026)

Pedido do Miguel: "tirar a partida ranqueada e voltar com ela pra quando tivermos mais jogadores, no lançamento talvez.
Aí a gente deixa a opção e um timer pra liberar."

- **Só a Liga fecha.** A Copa do Dia e o ranking do dia seguem iguais.
- Na Home a linha da Liga continua visível, com o selo "Em breve" (`.bc-tag`), "Abre em 12d 04h 31m" e um cadeado. O
  toque mostra: "A Liga abre quando tiver mais gente jogando. Enquanto isso, a Copa do Dia tem ranking todo dia."
  (`LigaHomeRow` em `src/ui/screens/Daily.tsx`.)
- **Data:** `LIGA_OPENS_AT` em `src/league/rules.ts`, hoje `2026-12-01T00:00:00-03:00` (placeholder até o Miguel
  confirmar). Passou da data, a Home troca sozinha pro "Abrir a Liga" (a contagem confere a cada 30 s, sem deploy). Pra
  reabrir antes ou adiar, troque só essa linha e publique. Teste: `src/league/rules.test.ts` ("Liga fechada até a
  data").
- **Nada apagado:** tabelas, funções do banco e Edge Function `liga` continuam no Supabase; o `?demo=liga` (dev) entra
  direto na tela da Liga mesmo fechada.
- **Partida da Liga aberta:** fica no servidor (e as ordens em `localStorage`, `soccermon-liga-live`), não no save; a
  Home não depende dela, então nada trava. Quando a Liga abrir, quem tinha uma partida aberta volta nela; se já tinha
  começado (seed revelada) há mais de 2 h, o servidor conta derrota, como sempre.
