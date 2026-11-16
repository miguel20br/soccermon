---
description: Diagnóstico de dados (19/10 a 16/11/2026) pra plano de crescimento: de onde vêm os jogadores, o pico de 27–30/10, funil, retenção e rendimento de cada post.
---

# Crescimento: o que os dados dizem (16/11/2026)

Só leitura. Fontes: `public.game_events` (consultas SELECT + `npm run stats -- --dias 28 --md`), API do Buffer (27 posts
enviados) e `docs/marketing/pauta.md`. Horários em Brasília, exceto onde diz UTC. Os eventos só existem a partir de 15/10
(e o placar de 28 dias começa em 19/10).

**Aviso de método (muda como ler tudo):** "sessão" é uma **aba** (id some ao fechar), não uma pessoa. Não existe id de
jogador, então **D1/D7 de verdade não dá pra medir**. O mais perto que temos é `returning` (o aparelho já tinha save). Também
**não há país nem idioma** nos eventos (só `device`, `ref`, `lab`, `cups`, `dex_seen`); idioma só aparece quando alguém
troca em Configurações (`lang=en` 15x, `lang=pt` 14x em 28 dias, ou seja, quase ninguém mexe).

## 1. De onde vêm os jogadores

Sessões abertas (`session_start`) por semana (segunda a domingo) e canal. `ig` = `utm_source=ig/instagram`; `google` inclui o
app de busca do Android; `vercel` = endereço antigo `soccermon.vercel.app`.

| Semana (seg) | Direto | Google | Instagram | Vercel | Outros | Total | Novas |
|---|---:|---:|---:|---:|---:|---:|---:|
| 12/10 | 54 | 9 | 0 | 22 | 4 | 89 | 38 |
| 19/10 | 156 | 118 | 22 | 37 | 8 | 341 | 111 |
| **26/10** | **259** | **154** | **138** | 17 | 0 | **568** | **201** |
| 02/11 | 145 | 97 | 35 | 22 | 3 | 302 | 88 |
| 09/11 | 116 | 47 | 9 | 18 | 5 | 195 | 63 |
| 16/11 (só seg.) | 10 | 0 | 0 | 3 | 0 | 13 | 5 |

Em 28 dias (1.401 sessões): direto 48%, Google 26%, Instagram 14%, vercel.app 7%, resto 5%. Aparelho: celular 76%, desktop 19%,
tablet 4%.

- **TikTok e YouTube não aparecem nunca como origem**: 0 sessões com `utm_source=tiktok` ou `youtube`, em todo o período,
  apesar de `/tt` e `/yt` existirem no `vercel.json`. O TikTok só tem link na legenda/comentário (bio clicável só com 1000
  seguidores) e o Shorts tem o link na descrição, onde quase ninguém clica. Parte do "direto" (48%) deve ser essa gente com
  o link copiado ou digitado, mas **os dados não separam**.
- **Google é o canal que mais cai, e o que melhor converte** (ver §3). 118 → 154 → 97 → 47 por semana. Não temos a causa
  (posição na busca, indexação, sazonalidade): é pergunta pra Search Console.
- Reddit, TikTok, YouTube, X: zero. Facebook 9 sessões, ChatGPT 2, GitHub 3.

## 2. O que causou o pico de 27–30/10

Sessões por dia (abertas) e origem:

| Dia | Sessões | Novas | Instagram | Google | Direto | Postado (Buffer, hora de Brasília) |
|---|---:|---:|---:|---:|---:|---|
| 23/10 | 42 | 12 | 0 | 10 | 31 | IG + YT (01h, UTC 04h17) |
| 24/10 | 90 | 48 | 14 | 43 | 27 | Reels Snorlax 08h49 (11,1 mil views); POV nível 3 13h44 em 3 redes |
| 25/10 | 44 | 13 | 8 | 25 | 9 | – |
| 26/10 | 45 | 8 | 5 | 14 | 25 | – |
| **27/10** | **105** | 57 | 40 | 22 | 41 | **EP 2 Magikarp 00h01–00h03 (IG 9,9 mil views)** |
| **28/10** | 102 | 45 | 33 | 31 | 35 | – (cauda do EP 2) |
| **29/10** | 121 | 42 | 30 | 36 | 51 | Trailer 0.9.25 14h41 |
| **30/10** | 104 | 23 | 16 | 27 | 59 | – |
| 31/10 | 52 | 16 | 8 | 14 | 29 | – |

O pico foi **o Reels do EP 2 (Magikarp no gol)**, com a cauda dele em 28–29/10 e o trailer 0.9.25 segurando o platô. Duas
pistas: (1) em 27/10 há 7 sessões `ig` só na hora seguinte ao post (01h), e a semana de 26/10 tem 138 sessões `ig` contra 22
e 35 nas vizinhas; (2) o EP 2 teve o melhor tempo médio assistido (25,6 s) e 477 curtidas. O Reels Snorlax de 24/10 (11,1 mil
views) deu um pico menor (90 sessões), mas **mais de Google (43) do que de Instagram (14)**, o que sugere que parte do efeito
foi "ouviu falar, buscou no Google".

Versões: saíram 0.9.23.1 a 0.9.29 nessa janela (quase uma por dia). Não há bug visível: as sessões de 28/10 (0.9.23.3 e
0.9.24) e 29/10 (0.9.25 e 0.9.26) foram normais. As únicas rajadas de erro são 2 sessões em 28/10 e 2 em 10/11 (loops de
cliente velho, `compassos is not iterable` na 0.9.10), sem ligação com a queda.

**O "pico de terça a quinta" é em boa parte o pico de 27–30/10** (27/10 foi terça). Fora do pico, em 19–26/10, terça a quinta
foram os dias mais fracos (35, 43, 28 sessões). Em 03–16/11, terça (99) e quinta (92) ainda lideram, mas com margem pequena
(seg 45, sex 71, sáb 70). Hora (03–16/11): 15h e 16h lideram (50 e 52 sessões), depois 19h (41) e 12h (43). É padrão fraco.

## 3. Funil

Sessões **novas** por semana, até onde chegaram (a sessão pode seguir em outro dia; `partida` = `match_end`):

| Semana | Abriu | Começou copa | Jogou 1ª partida | Terminou copa | Campeão |
|---|---:|---:|---:|---:|---:|
| 12/10 | 38 | 18 (47%) | 12 (32%) | 11 (29%) | 5 |
| 19/10 | 111 | 65 (59%) | 47 (42%) | 37 (33%) | 16 |
| 26/10 | 201 | 153 (76%) | 120 (60%) | 92 (46%) | 37 |
| 02/11 | 88 | 53 (60%) | 41 (47%) | 31 (35%) | 20 |
| 09/11 | 63 | 34 (54%) | 22 (35%) | 18 (29%) | 11 |

Por canal de origem (novas, 19/10 a 16/11):

| Canal | Novas | Começou copa | Jogou 1ª partida | Terminou copa |
|---|---:|---:|---:|---:|
| Google | 174 | 145 (83%) | 116 (67%) | 95 (55%) |
| Instagram | 110 | 85 (77%) | 64 (58%) | 44 (40%) |
| Direto | 166 | 69 (42%) | 46 (28%) | 36 (22%) |

- **Onde cai:** o maior buraco é **abrir → começar a copa** (placar oficial: perde 51% das novas). Quem vem de Google e
  Instagram começa copa em 77–83%; quem vem direto, em 42%. "Direto" inclui gente de link de **convite do Duelo**: 48
  sessões novas, só 5 começaram copa (10%), embora 21 tenham entrado na sala e 17 terminado um jogo. Ou seja, o Duelo
  funciona, mas é outro produto, e polui o funil.
- **Primeira saída (`first_leave`, novas desde 27/10):** home 70, duelo 55, partida 24, draft 12, configurações 10. Mais de
  metade sai sem sair da Home ou da tela do Duelo.
- Depois da primeira partida a queda é suave (jogou → terminou 29 de 36 no placar oficial; terminou → campeão 20 de 29).
  Quem passa da 1ª partida fica.
- Na semana de 26/10 o funil foi o melhor (76% começaram copa), na de 09/11 o pior (54%/35%). Gente que veio do Reels era
  mais "pronta pra jogar" do que a de agora.

## 4. Retenção e jogadores únicos

**D1 e D7 não são mensuráveis** (sessão = aba, sem id). O que dá pra dizer:

| Semana | Sessões | Novas | Voltando (aparelho com save) | % voltando |
|---|---:|---:|---:|---:|
| 12/10 | 89 | 38 | 51 | 57% |
| 19/10 | 341 | 111 | 230 | 67% |
| 26/10 | 568 | 201 | 367 | 65% |
| 02/11 | 302 | 88 | 214 | 71% |
| 09/11 | 195 | 63 | 132 | 68% |

- A cada semana ~2/3 das sessões são de aparelho que já tinha save. **A base recorrente caiu junto com a entrada**: voltando
  foi de 367 (26/10) para 214 e 132, e novas de 201 para 88 e 63. A retenção "por aparelho" não piorou (65–71%); o que
  encolheu foi quanto entra. Isso aponta pra **aquisição**, não pra produto.
- Dia a dia: voltando ficou em 8–37 sessões/dia desde 02/11 (média ~25), novas em 1–24.
- Quem joga, joga muito: 3.591 copas começadas em 28 dias, 8.844 partidas, 2.608 copas terminadas, 627 títulos.
  1.117 das sessões são "maratona" (mais de 20 copas) ou versões velhas, e o placar oficial as tira do funil.
- Pessoas de verdade: não sabemos. Tetos: 1.401 sessões em 28 dias, 464 delas "novas". Duas abas do mesmo jogador contam 2.
- Login Google: 46 em 28 dias (30 levaram o progresso do aparelho pra conta). É a única forma de identificar gente.

## 5. Redes (Buffer, posts enviados desde 22/10)

Horário de Brasília. Views = visualizações da plataforma. "Compart." = Shares.

**Instagram (Reels)**

| Data | Conteúdo | Views | Alcance | Curtidas | Coment. | Compart. | Salvos | Tempo médio |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 23/10 01h | E se os Pokémon jogassem futsal (apresentação) | 335 | 228 | 13 | 6 | 5 | 8 | 11 s |
| 24/10 08h49 | Snorlax no gol (EP 1) | **11.104** | 9.566 | 295 | 5 | 15 | 18 | 16 s |
| 24/10 13h44 | POV nível 3 (Dragonite) | 1.642 | 1.339 | 35 | 11 | 7 | 9 | 8 s |
| 27/10 00h03 | **Magikarp no gol (EP 2)** | **9.923** | 8.101 | **477** | 12 | 17 | **31** | **26 s** |
| 29/10 14h41 | Trailer 0.9.25 Amigos | 905 | 736 | 28 | 0 | **28** | 2 | 11 s |
| 03/11 15h29 | Ditto no gol (EP 3) | 3.002 | 2.474 | 124 | 8 | 3 | 8 | 24 s |
| 09/11 19h02 | Vestiário do Pallet FC ep. 1 | 468 | 389 | 23 | 4 | 1 | 4 | 26 s |
| 13/11 19h03 | Vestiário ep. 2 (Bola a mais) | 645 | 579 | 10 | 1 | 0 | 0 | 5 s |

**TikTok**: 176, 302, 412, 518 (EP 2), 327 (trailer), 171 (EP 3), 187 (Vestiário 1), 176 (Vestiário 2). Curtidas 5–22, zero
compartilhamento quase sempre. Melhor: EP 2 (518 views, 22 curtidas, 11,9 s de média).
**YouTube Shorts**: 285, 1.696 (Snorlax), 1.129 (POV), 1.394 (EP 2), 273 (trailer), 1.158 (EP 3), 369 (Vestiário 1), 174 (Vestiário 2).
O Shorts rende 2 a 3x o TikTok, mas com curtidas e engajamento baixos (1–2%).

**Total de views dos 8 posts por rede:** Instagram ~28 mil, YouTube ~6,5 mil, TikTok ~2,3 mil. O post de 15/11 (Chapéu do
Mew) foi apagado (zero visualizações no Buffer) e não entra.

**Formatos (Instagram, mediana de views):**

| Formato | Posts | Views típicas | Observação |
|---|---:|---:|---|
| "Escalaram um X no gol" (EP 1–3) | 3 | 3 mil a 11 mil | melhor curtida/view e melhor tempo médio (16–26 s) |
| POV / golpe máximo | 1 | 1,6 mil | alcance médio, mais comentários (11) |
| Trailer de versão | 1 | 905 | poucos views, mas o maior compartilhamento por view (28) |
| Vestiário do Pallet FC | 2 | 468–645 | menor alcance; ep. 1 prende (26 s), ep. 2 não (5 s) |

A fórmula **"Escalaram um [Pokémon aleatório] no gol. Seu time passava por ele?"** é a única que escapou. Cada episódio
seguinte teve menos views (11,1 mil, 9,9 mil, 3,0 mil), e o formato trocou pra Vestiário, que nunca passou de 650.

**Algum post trouxe visita ao jogo?** Sessões vindas de Instagram nas 24 h seguintes ao post (e % nas sessões totais da
janela):

| Post | Views IG | Sessões `ig` em 24 h | Novas | Sessões totais em 24 h |
|---|---:|---:|---:|---:|
| Snorlax 24/10 08h49 | 11.104 | 15 | 13 | 96 |
| EP 2 27/10 00h03 | 9.923 | **40** | 31 | 105 |
| Trailer 29/10 14h41 | 905 | 28 | 15 | 136 |
| EP 3 03/11 15h29 | 3.002 | 13 | 7 | 54 |
| Vestiário 1 09/11 19h02 | 468 | 2 | 2 | 46 |
| Vestiário 2 13/11 19h03 | 645 | 3 | 2 | 23 |

- A conversão view → visita é baixíssima: ~0,15% a 0,4% (11 mil views = 15 visitas; 9,9 mil = 40). A cauda do EP 2 explica
  as 28 do trailer (o trailer teve só 905 views, o efeito é do EP 2 ainda rolando).
- **Zero visitas atribuíveis a TikTok e YouTube** (nem uma sessão com utm tiktok/youtube), então não dá pra dizer que
  nenhum post deles trouxe jogador, só que **não conseguimos ver**. O único sinal indireto é "direto": 41–59 sessões/dia em
  27–30/10 contra 15–25 em dias calmos.
- O link só vive na legenda/comentário, nunca no vídeo clicável. Os views ficam em 28 mil e as visitas em ~200 (204 sessões
  `ig`/`instagram` em 28 dias, 111 novas).

## 6. Celular, PC, idioma, país

- **Celular 76% das sessões, desktop 19%.** Funil por aparelho (só sessões novas, placar oficial): celular e desktop empatados
  (abre → joga 27% vs. 33%), tablet pior. Sessões novas sem nenhum toque: 13% no celular, 80% no tablet (amostra pequena, n=15 a 5).
- **Idioma e país: não existe dado.** Quem troca de idioma é raro (15 a EN, 14 a PT em 28 dias). Pergunta: vale registrar
  `navigator.language` no `session_start` (dado leve, sem identificar ninguém)? País exigiria geo-IP, que o projeto evita.

## 7. Outros fatores da queda

- **Cadência dos posts caiu e o formato mudou.** 22/10 a 03/11: posts em dias úteis variados (24, 27, 29/10, 03/11). 04/11 a
  08/11: nada. Depois só dois Vestiário (09 e 13/11) e um Chapéu apagado (15/11). A semana do pico teve 3 posts com alcance
  de 10 mil; a de 09/11 teve 2 com alcance de 600.
- **Versão:** o jogo mudou muito (0.9.18 em 24/10 → 0.9.52 hoje), mas não há degrau de sessões em nenhum lançamento. Sem bug
  (erros concentrados em 4 sessões). A 0.9.52 já é 72 das sessões das últimas 2 semanas, 0.9.43 e 0.9.46 ainda somam 64
  (cliente em cache de versão antiga: não vê as novidades).
- **Primeira tela:** não vi mudança de primeira tela que coincida com a queda (a 0.9.50/0.9.51 refizeram a Home em modos,
  mas as sessões de 12–16/11 já estavam em ~25/dia e a queda tinha começado em 31/10).
- **A queda é a cauda de dois estouros** (24/10 Snorlax e 27/10 EP 2), não a perda de uma base fiel. Antes do 24/10, a
  linha de base era ~35 sessões/dia; agora são ~25/dia.
- Google em queda sem causa conhecida (§1).
- **Duelo:** 48 novas por convite, só 10% começam copa. É tráfego bom (21 entraram na sala), mas não vira jogador de copa.

## 5 conclusões principais

1. **O crescimento veio de um tipo de post só: o Reels "Escalaram um X no gol".** Dois episódios (Snorlax 11 mil views, Magikarp
   9,9 mil) explicam os dois picos (24/10 e 27–30/10). O terceiro (Ditto) já deu 3 mil, e o Vestiário nunca passou de 650.
2. **Quase todo o tráfego social é Instagram, e converte pouco em visita.** ~28 mil views no IG viram ~200 sessões `ig`
   (0,15% a 0,4% por post). TikTok (2,3 mil views) e YouTube (6,5 mil) deram **zero** sessões atribuídas: o link do vídeo não
   chega ao jogo ou não é medido. Hoje não dá pra saber se vale postar nelas.
3. **A queda é entrada, não retenção.** Novas por semana: 201 → 88 → 63; % de sessões voltando fica em 65–71%. Google (a
   fonte que mais converte: 83% começam copa, 55% terminam) caiu de 154 pra 47 por semana sem causa conhecida.
4. **O funil vaza na porta, não no meio.** 40–50% das novas não começam copa (direto 42%, Google 83%, IG 77%); quem passa
   da 1ª partida acaba a copa (80%). Parte do "direto" é convite de Duelo: 10% começam copa, mas 17 de 48 terminaram um jogo
   de Duelo.
5. **O que existe hoje não mede pessoas.** Sessão = aba, sem D1/D7, sem país nem idioma, TikTok/YT sem origem. O plano de
   crescimento precisa de 3 coisas baratas e sem identificar ninguém: link com `utm` no vídeo/bio, idioma do navegador no
   `session_start`, e um contador de dias distintos por aparelho.

## O que os dados não respondem

- Quantas **pessoas** reais existem e se voltam no dia 1 e no dia 7 (sem id).
- De onde vem o "direto" (48%): TikTok/YT sem link rastreado, convite de Duelo, favorito, boca a boca?
- Por que o **Google** caiu 70% em duas semanas (Search Console: posição, cliques, consultas).
- Idioma (PT/EN) e país dos jogadores.
- Se TikTok e YouTube trazem jogador (e quanto) ou só views.
- Se o **Vestiário** perde por conteúdo, por título/gancho, ou por ser a série nova e o algoritmo ter esfriado depois do
  EP 3 (3 mil views já mostrava queda).
- Se a queda nas visitas depois de 31/10 é por menos posts ou por cada post render menos.
- O tempo que as pessoas ficam: a duração mediana de sessão por aba é 2,5 a 7,9 min por semana, mas abas ficam abertas.
