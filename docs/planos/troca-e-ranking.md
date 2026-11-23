---
description: Troca de cartas entre amigos e ranking do Time Ultimate: tabelas, Edge Function `ut`, anti-trapaça, custo e quando ligar (código pronto atrás de ?lab=troca e ?lab=ranking-ut, nada aplicado em produção).
---

# Troca de cartas e ranking do Time Ultimate

Itens 12 e 13 do backlog, aprovados pelo Miguel como features. Os dois precisam de servidor conferindo carta e
placar. **Estado: código pronto atrás de bandeira; migração e função NÃO aplicadas** (migração de produção só com o ok
dele na hora, ADR 0007 e a nota de Supabase no CLAUDE.md).

## O que existe no repo

| Peça | Arquivo |
|---|---|
| Regras puras (troca, ranking, pontos), usadas pelo jogo e pela função | `src/store/ultimate/trade.ts` (+ `trade.test.ts`) |
| Migração (data futura de propósito, "não aplicar") | `supabase/migrations/20270601120000_troca_e_ranking_ut.sql` |
| Edge Function (não publicada) | `supabase/functions/ut/index.ts` |
| Entrada do pacote do motor para a função | `src/store/ultimate/edge-entry.ts` |
| Cliente que falha bem sem tabela/função | `src/store/ultimate/online.ts` |
| Telas mínimas | `src/ui/ultimate/OnlineLab.tsx`, `?lab=troca` e `?lab=ranking-ut` (só dev e prévias) |

O jogo não importa nada disso fora dos labs; o bundle da Home não muda (Supabase só via `loadCloud()`).

## Princípio

O save é do navegador, então "conferir contra o save da nuvem" **não prova posse**: quem edita o save no DevTools sobe
a edição junto. O que o servidor garante de verdade é (1) uma carta não vai a duas ofertas nem é gasta duas vezes,
(2) o placar do ranking sai do motor no servidor, com rival e seed sorteados lá, (3) limites por dia. Prova de posse
de verdade (cada pacote aberto com semente do servidor, como o plano do UT previu para o ranking) é a fase 3, ver
Riscos.

## Troca (1 por 1, entre amigos aceitos)

Fluxo: A oferece uma carta a um amigo → B vê a oferta e escolhe uma carta dele para aceitar → o servidor confere as
duas contra os saves da nuvem e fecha → cada ponta aplica a troca **no próprio save** na próxima vez que abre
(`applied_from`, `applied_to`). O servidor nunca escreve no save de ninguém (evita corrida com o upload do jogo).

- **Tabela `ut_trades`**: oferta, snapshot das duas cartas (jsonb), status (`pending`, `done`, `declined`,
  `cancelled`, `expired`), temporada, flags de aplicação. Índice único parcial `(from_id, offer_uid) where
  pending`: a mesma carta não está em duas ofertas.
- **RLS**: ligado, nenhuma política, `revoke all` de anon e authenticated. Só a função (service_role) lê e escreve.
  Mesmo modelo de `friend_*` (migração de amigos).
- **Confere na função `ut`** (ações `trocas`, `propor`, `aceitar`, `recusar`, `aplicado`): conta Google (não
  anônima); amigo aceito há 24 h ou mais e sem bloqueio (bloqueio devolve o mesmo erro de "não é amigo"); a carta está em
  `saves.data.ultimate.cards` de cada lado, na **mesma temporada** (a de agora); carta não trancada nem em evolução;
  diferença de nota de no máximo 6 (`TRADE.ovrGap`, `viewInstance`); oferta expira em 48 h; fechamento só se ainda
  `pending` (duas abas aceitando).
- **Aplicação idempotente**: a carta que chega ganha o uid `tr-<id da troca>`; `applyTrade` tira a dada e põe a recebida, e
  repetir não duplica. Não muda o formato do save (sem migração de save). A carta no time precisa sair do time antes
  (o jogo não escolhe por você, regra do Miguel).
- **Anti-farm entre contas amigas**: 5 trocas fechadas por dia por conta, 3 por par de amigos por dia, 5 ofertas
  abertas; carta que chegou numa troca só sai de novo depois de 24 h (corta corrente conta A → B → C); amizade com
  menos de 24 h não troca; troca 1 por 1 com teto de diferença de nota, então não dá para concentrar as melhores cartas
  numa conta só entregando lixo. Mesmo assim contas amigas do mesmo dono podem **redistribuir** cartas: o efeito é
  só social (a coleção é por temporada e zera), e o ranking tem as próprias travas.
- **Offline**: propor e aceitar exigem servidor. Sem rede, a tela explica e nada muda no save. Troca fechada espera
  o outro lado abrir o jogo (lista `toApply`); se o jogador vendeu a carta dada **depois** do aceite, `applyTrade`
  não tira nada e a carta recebida entra mesmo assim (a duplicação possível é de uma carta, só por quem edita o save
  ou vende dentro da janela; a função recusa nova troca com a mesma carta pelo save da nuvem, e a Fase 3 fecha isso).

## Ranking do Time Ultimate

- **Tabelas**: `ut_rank_teams` (time inscrito por temporada: receita + nome público, mesmo molde de `league_teams`),
  `ut_rank_rounds` (cada partida: nível, seed, os dois times, ordens, placar, pontos), `ut_ranking` (pontos, partidas,
  vitórias). RLS ligado, só a função escreve. Leitura pública só pela RPC `ut_ranking_lista(temporada)` (SECURITY
  DEFINER): 100 primeiros e você, nome do treinador, clube e os 5 titulares (ids de espécie), nunca o save.
- **Fluxo** (ações `inscrever`, `proxima`, `jogar`, `resultado`): o jogador inscreve o time; o servidor valida a
  receita (`validarTimeDuelo`) e que **cada carta existe no save da nuvem** (`recipeMatchesSave`: espécie, brilho, edição,
  evoluções) e que a temporada do save é a atual. Para jogar, o servidor sorteia a seed e o rival (`ultimateRival` com a
  força do seu time e o nível pedido) e só entrega a seed no "Jogar"; o navegador joga e manda **só as ordens**; o
  servidor refaz a partida (`simulateLiga`, ~0,5 s de CPU) e o placar que vale é o de lá. Largar a partida depois do
  Jogar = abandono (0 ponto, conta no teto). Mesmo molde da Liga (ADR 0002).
- **Pontos** (`RANK_POINTS`): vitória e nível mandam (Fácil 2 · Normal 3 · Difícil 4 · Mestre 6; empate e derrota
  menos). Desempate: vitórias, depois menos partidas. Teto de 20 partidas por dia (`RANK_DAILY_MAX`).
- **Pacote do motor**: a função leva `engine.js` (esbuild de `edge-entry.ts`, ~350 KB). Mesmo custo operacional da
  `liga`: **todo `ENGINE_VERSION` novo exige empacotar e republicar a `ut`** (se esquecer, o ranking recusa partida
  "versão"). O comando está no topo de `edge-entry.ts`; não entrou no `package.json` (fora do escopo desta frente).
- **O que falta para o ranking ser jogável** (fora do que esta entrega cobre): a tela de partida do ranking, que liga
  `proxima`/`jogar`/`resultado` ao `Match` com `seed` e rival vindos do servidor (hoje só o `?lab=ranking-ut` lista
  e inscreve). É trabalho de UI de uma versão, igual foi a `liga-match`.
- **Offline**: sem rede o jogador joga normal contra a IA (Batalhas); só o ranking some. Nada fica pendente no cliente.

## Custo no plano grátis do Supabase

- **Banco**: linhas minúsculas (jsonb de 5-7 cartas, ~2-3 KB). 10 mil jogadores x (1 time + 20 partidas) ≈ 70 MB de
  `ut_rank_rounds` na pior hipótese; uma limpeza de partidas com mais de 30 dias (a criar na hora de ligar, como a da Liga) deixa em dezenas de MB.
  O limite grátis é 500 MB.
- **Edge Functions**: 500 mil chamadas por mês grátis. Uma partida do ranking = 3 chamadas (proxima, jogar,
  resultado). 100 jogadores ativos x 10 partidas x 30 dias ≈ 90 mil chamadas. Troca: ~4 por troca. Folga grande. O
  risco é CPU: 2 s por chamada (a partida usa ~0,5 s) e instância fria pode estourar (546), por isso o cliente repete
  como na Liga.
- **Banda/egress** desprezível (JSON pequeno). O projeto grátis pausa após 7 dias parado: o ranking não muda isso.
- **Sem dinheiro** (ADR 0006): nada aqui pede plano pago; se passar do grátis, o ranking desliga antes de qualquer cobrança.

## Riscos

1. **Posse não provada**: o save é do cliente. Para o ranking, quem editar o save pode inscrever um time forte.
   Mitigações já no desenho: receita tem que bater com o save da nuvem, nota/atributo saem do motor e não do cliente, e o
   teto de 20 partidas/dia. **Fase 3** (recomendada antes de prêmio de verdade): pacotes do ranking abertos com semente
   do servidor (`ut_cards` com o histórico) e `recipeMatchesSave` contra essa tabela e não contra o save. Sem prêmio
   em dinheiro (ADR 0006), o dano de um trapaceiro é só a posição no placar.
2. **Corrida do save**: o upload do jogo é com atraso (debounce); carta recém-aberta pode ainda não estar na nuvem
   (a troca recusa com `sem_carta`: a tela pede para esperar a sincronização).
3. **Drift de versão do motor**: ver acima (republicar `ut` a cada `ENGINE_VERSION`).
4. **Contas amigas do mesmo dono**: ver Anti-farm. Aceitável sem prêmio.
5. **Dados pessoais**: só nome público (treinador e clube, já públicos na Liga e no ranking da Copa), ids de espécie e o
   código de amigo. Apagar a conta apaga tudo (`on delete cascade`). Sem e-mail em nada.

## Para ligar (precisa do Miguel)

1. Ok para aplicar `20270601120000_troca_e_ranking_ut.sql` (renomear a data para o dia, se for antes de junho).
2. `npx esbuild src/store/ultimate/edge-entry.ts ... --outfile=supabase/functions/ut/engine.js` e
   `npx -y supabase@latest functions deploy ut --project-ref vszcxacbcabohhdwxfpb --use-api` (token no `.env.local`).
3. Tela de partida do ranking (versão própria), tela de troca fora do lab (entrada pela lista de amigos e pelo Clube),
   Novidades, e conferência no celular (390) e desktop.
4. Soltar a bandeira: trocar o `?lab=` por `ULTIMATE`-flag como o ADR 0005 pede (modo novo só depois de jogado na tela).

## Recomendação de quando

**Ligar a troca e o ranking juntos na Temporada 2 (01/06/2027)**, como decidido em 18/11. Motivos: (a) a Temporada 1
zera as cartas em 01/06, então a troca nasce com coleção nova e sem dívida de save antigo; (b) o ranking precisa da
Fase 3 (pacote com semente do servidor) para valer prêmio, e dá tempo de fazer com calma; (c) nada de servidor novo
entra durante o lançamento do UT (27/11) e do Natal. Se o Miguel quiser **antes**: a troca é segura de adiantar (limites
e idempotência já estão, sem prêmio em jogo); o ranking só vale adiantar como "mini ranking sem prêmio" com o aviso de que
o save não é provado. Em qualquer data, primeiro uma prévia com 2 contas de teste e a função em um projeto Supabase de
teste (não o de produção).
