---
description: Onde as sessões novas somem entre "Começou a copa" e "Jogou a 1ª partida" (24/10, 0.9.18): quase tudo na 1ª partida, não no draft.
---

# Funil do draft: quem começa a copa e não joga a 1ª partida (24/10/2026, branch `funil-draft`)

Pedido: 33 novas começaram a copa desde 24/10 e só 23 "jogaram" (~30% de perda); na semana, 166 de 187 copas
abandonadas pararam nas oitavas. Só diagnóstico: nada foi pro ar nem mudou código do jogo. Script novo, só leitura:
`scripts/funil-draft.ts` (`ENV_LOCAL=<.env.local> npx tsx scripts/funil-draft.ts [--desde AAAA-MM-DD]`), mesma
tabela `game_events` do `stats.ts`.

## 1. Resposta curta

**O vazamento não é o draft. É a 1ª partida, antes do apito final.** Das 10 sessões novas que começaram a copa e não
"jogaram", **8 chegaram na tela da partida** e sumiram lá (as 9 de 10 terminaram o draft inteiro). O evento
`match_end` só sai no apito final (`Match.tsx`: `match:ended`), então "Jogou a 1ª partida" na verdade quer dizer
"**assistiu ou pulou até o fim da 1ª partida**". O nome engana: a perda de ~30% é gente que abriu a partida e não
chegou ao apito, não gente que desistiu de escolher cartas.

E o "166 de 187 nas oitavas" é **ruído de 3 sessões**, não 166 desistências (seção 4).

## 2. Os números (desde 24/10 00h, `scripts/funil-draft.ts`, sessões novas, sem lab/convite do Duelo/TikTok-Instagram)

| | Sessões |
|---|---:|
| Novas | 42 (45 contando 3 maratonas de 10 a 20 copas) |
| Começaram a copa | 31 (34 com as maratonas) |
| Chegaram na tela da partida | 29 |
| Chegaram ao apito final (`match_end`) | 21 (24 com as maratonas) |
| **Saíram entre `run_start` e o apito** | **10 (32%)** |

Os números do pedido (33 e 23) batem com isso, a diferença de 1 é o corte de hora do `stats.ts`.

Onde as 10 pararam (último evento da sessão):

| Último ponto | Sessões |
|---|---:|
| Tela da partida (`screen=match`), sem `match_end` | **8** |
| Escalação (`lineup`) | 1 |
| Home, depois de 1 pick (o capitão) | 1 |

- **Draft de verdade (formação, capitão, 6 vagas):** perde 1 de 31 (3%). Os 9 restantes fizeram os 7 picks.
- **Quanto tempo no draft:** quem jogou levou mediana de **124 s** de `run_start` até a tela da partida; quem saiu
  levou **79 s**. Quem sai não é quem demora no draft, é até mais rápido.
- **"Monta pra mim":** usaram em 2 de 10 que saíram (20%) e em 5 de 21 que jogaram (24%). Não muda nada.
- **Aparelho:** celular 9 de 27 saem (33%), desktop 0 de 3, tablet 1 de 1 (ruído). É o celular.
- **Erros de JS:** nenhum evento `error` em sessão que começou copa. Não é crash registrado.
- **Resolução do tempo:** `created_at` é a hora do lote (a cada 8 s), então tempos têm ~8 s de erro. Amostra de 10
  sessões: cada uma vale ~3 pontos. Leia como direção, não como medida.

### Quanto dura a 1ª partida

- Cada tempo é 180 s de simulação; a 1x são ~6 min só de jogo, mais intervalo e ao vivo a partida passa de 9 min
  (2 sessões em 1x sem mexer na velocidade levaram 541 s até o apito).
- **A velocidade padrão é 1x** (decisão de 18/10, `game-store.ts`: "quem nunca jogou começa em 1x pra ver a partida").
- Das 21 que chegaram ao apito, **14 terminaram em 8x** e a mediana de "tela da partida → apito" foi **269 s** mesmo
  assim. Quase todo mundo sobe a velocidade; 3 terminaram em 1x.
- Das 8 que saíram na partida, **5 mexeram na velocidade** (último toque 19 a 264 s depois de entrar; 4 delas ficaram em
  1x ou 2x) e **3 não tocaram nela**. O botão **Pular** existe (`bc-skip`), mas nenhum evento diz se foi tocado.
- Em **7 das 8**, o último evento é o balão da partida (`coach_next`/`coach_skip` de `relampagoJogo`, "Mude a tática e
  troque jogadores durante o jogo"): fecharam o balão e não fizeram mais nada que gere evento.

## 3. Hipóteses (com a evidência que há)

1. **A 1ª partida é longa demais pra quem chegou agora (1x, ~6 a 9 min).** Evidência: 8 de 10 saídas são na partida;
   14 de 21 que terminaram foram pra 8x; mediana de 269 s mesmo acelerando; 2 ficaram 541 s em 1x. Contra: 5 de 8
   que saíram já tinham mexido na velocidade (sabiam acelerar e saíram igual). Mais provável: **parcial**.
2. **Quem sai não sabe/não vê o "Pular".** Evidência: 3 de 8 não tocaram na velocidade. Contra: sem evento de toque
   no Pular, não dá pra afirmar. É a hipótese mais barata de testar (instrumentar).
3. **O balão `relampagoJogo` come o 1º toque e a atenção.** Evidência: o último evento de 7 de 8 é o balão. Pelo
   `Coach.tsx`, fora do alvo o toque só fecha o balão (`coach-block`). Contra: é o último evento que **gera evento**;
   quem ficou assistindo também terminaria assim. **Correlação fraca**, mas custa quase nada tirar.
4. **Desistir olhando o jogo (não é problema de tela).** O draft rápido (79 s) e "Monta pra mim" sem efeito dizem que
   quem sai já gostou o bastante pra chegar na bola rolando. O que falta é motivo pra ficar 6+ min no escuro:
   placar parado, time sem rival visível. Sem evento de gol/lance no meio da partida, não dá pra medir.
5. **Aba some no celular (fundo, memória).** Phaser (1,3 MB) carrega ao entrar na partida e o celular pode matar a
   aba ao trocar de app. Evidência: nenhuma (zero `error`; as 8 não têm evento depois da tela). Contra: ninguém
   reportou. É hipótese de último recurso, e o evento `pagehide` não grava onde parou.

Não é hipótese viva: "o draft é longo/confuso". O prefixo do funil (20 toques, 6 com Monta pra mim) está em
[funil-boas-vindas.md](funil-boas-vindas.md) e não casa com quem some.

## 4. "166 de 187 abandonadas nas oitavas": ruído de poucas sessões

`run_abandon` é **evento** (a run virou `null`), não sessão. Em 7 dias: 155 com `status=lineup, stage=0` vindos de
só **15 sessões**; **3 sessões fazem 125 deles** (67, 33 e 25 abandonos).

- As 3 são do **0.9.13** (versão velha, aba aberta há dias), com 53 a 71 `run_start` em 40 a 50 min (~36 s por copa),
  centenas de `pick` com `auto=true` ("Monta pra mim") e 18 a 50 `match_end`. É uma maratona: gente (ou script) que
  monta, joga, abandona e refaz copa em loop. Não é desistência de entrada.
- Tirando as 3, restam ~30 abandonos em `lineup`/`stage 0`, de ~12 sessões. Plausível: "Desistir" na escalação pra
  refazer o time (reroll de draft), o que **não é abandono do jogo**.
- Abandono é medida ruim de "saiu": quem **fecha a aba** não gera `run_abandon` (nenhuma das 10 saídas deste
  relatório gerou). Use sessões, não eventos.
- Há também 3 sessões novas do **0.9.18** com 10 a 20 copas cada (celular): contam como "jogaram" e dão +3 em
  `jogou` no funil do `stats.ts`. O script as tira.

## 5. Opções de conserto (custo)

| | O que muda | Custo | Quem decide |
|---|---|---|---|
| **A. 1ª partida mais curta de assistir** | Só na 1ª partida: começar em 4x (ou tocar o resto em "Lances" depois do 1º gol) e deixar o "Pular" em destaque; da 2ª em diante a velocidade que a pessoa salvou. Alternativa menor: o botão Pular pulsa uma vez depois de ~60 s | meio dia + prints 320/390/deitado; **mexe na decisão de 18/10 (1x)** | Miguel (regra nova de jogo) |
| **B. Tirar o balão `relampagoJogo` da hora do apito** | Mostrar o balão depois do 1º gol/intervalo (ou no fim da partida) em vez de por cima do campo e do Pular | 1–2 h; texto/UX, sobe sem perguntar (regra 5) | pode subir |
| **C. Medir a partida (antes de mexer em A)** | Evento novo (ex.: `match_leave` ou `match_progress`: minuto, velocidade, se tocou no Pular), disparado em `visibilitychange=hidden`. O nome entra em `EVENT_NAMES`, mas o banco exige **migração antes** (`game_events_name_check`) | 1–2 h + **migração de produção (ok do Miguel)**; 1 a 2 semanas de dados (~10 novas/dia) | Miguel (Supabase de produção) |
| D. Renomear a etapa | `stats.ts`: "Jogou a 1ª partida" vira "Chegou ao apito da 1ª partida", e tirar maratonas (≥10 copas) e versão antiga do funil; 2º vazamento mostra "saiu na partida" separado | 1 h, sem migração; sobe sem perguntar | pode subir |

**Ordem que eu seguiria:** D agora (a leitura do funil melhora sem mexer no jogo), B junto (não muda regra), C em
paralelo pra decidir A com dado. A só com o ok do Miguel e depois de ver `match_progress`: a decisão de 1x foi dele, e
a hipótese 1 sozinha tem contra-evidência.

## 6. Limites desta análise

- 10 sessões que saíram: direção, não medida. Dois dias a mais de dados já mudam os números.
- Não há evento no meio da partida: não sei se saíram aos 30 s, aos 3 min ou no intervalo.
- Não rodei a 1ª copa headless nem contei toques de novo: o mapa de telas e os 20 toques (6 com Monta pra mim) já estão
  em [funil-boas-vindas.md](funil-boas-vindas.md), e a perda aqui não está nessas telas.
- Fonte: produção (`game_events`, `soccermon.com`) em 24/10/2026; ninguém abriu o jogo local pra este diagnóstico.
