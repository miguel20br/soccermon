# Divulgação do trailer 2 (decidido com o Miguel em 19/10/2026)

Substitui o plano de 4 semanas de `pesquisas/marketing.md` (feito antes da Liga, Copa do Dia, Melhores momentos e do
logo novo). Regra de sempre: **o Claude prepara tudo e para antes de publicar**; o Miguel confirma numa linha e posta
(ou o Claude posta pelo perfil pessoal do Chrome, no TikTok). Textos seguem o método de escrita do Miguel
(`docs/marca/brand-guide.md`): curto, direto, sem ironia, humor de fã só pontual. Música do trailer: Trainer Battle
Remix, do Bliitzit, **sempre creditada** (no fim do vídeo e no post). O Bliitzit libera o uso na descrição do
vídeo dele (link a registrar aqui); isso cobre o arranjo/gravação dele, não a composição original da Game Freak, então
pode haver reivindicação automática (Content ID) por cima: se o Reels/TikTok silenciar o vídeo, trocar pela faixa da
biblioteca do app no próprio post. Clipes do **kit dos creators vão sem música** (o risco seria do canal deles).

## Decisões

| Item | Decisão |
|---|---|
| Instagram | conta nova **@soccermongame** (mesmo @ do TikTok), link `soccermon.com/ig` na bio (clicável desde o 1º dia) |
| TikTok | apagar o vídeo antigo (1 visualização) e postar o trailer 2; link `soccermon.com/tt` na legenda + comentário |
| Dia D | **quinta 22/10, 19h (Brasília)**; reserva **terça 27/10, 19h** se o trailer atrasar |
| Hacker News | **sim** (Show HN), em dia separado do Dia D, com o Miguel respondendo 3–4 h em inglês |
| Reddit | **não** |
| Creators | sim, **pequenos e grandes**; começa pelo LeeGengar (o Miguel conhece); lista em `~/Downloads/soccermon-creators/` |

## Dia D (qui 22/10)

| Hora | O quê | Quem |
|---|---|---|
| até 18h | Trailer 2 aprovado no celular (PT 9:16, EN 9:16 e 16:9), capa, legendas e hashtags prontos | Claude prepara, Miguel aprova |
| feito 20/10 | Instagram @soccermongame criado (Miguel) e arrumado pelo Claude: foto (logo novo), nome, bio com `soccermon.com/ig` (o link clicável só dá pra pôr pelo app) | — |
| 19h | **Reels** com o trailer PT (+ comentário fixado com o link) | Miguel |
| 19h05 | **TikTok**: trailer PT v3 (33 s) **já agendado pra 19h** (20/10, capa `capa-PT-9x16.png`); depois de sair, o Claude apaga o vídeo antigo de 16/10 e o Miguel comenta o link | Claude + Miguel |
| 19h10 | **YouTube Shorts** (PT) + **X** (16:9 EN e PT no fio) | Miguel |
| 19h15 | **GitHub**: release com o trailer + Discussion "Trailer 2 / #DesafioDourado" fixada | Claude |
| 19h–22h | Responder comentários (os primeiros 60 min pesam no alcance) | Miguel |

## Show HN (qua 28/10, 10h de Brasília = 9h ET)

Dia útil de manhã nos EUA é o melhor horário. Uma semana depois do Dia D: dá tempo de o jogo estar estável com a
Liga e de ter números reais pra citar.

- **Título** (≤ 80 caracteres, sem exagero): `Show HN: Soccermon – Pokémon play 5v5 futsal in your browser (open source)`
- **Link:** `https://soccermon.com/?utm_source=hn` (ou o repo, se a regra do dia pedir texto).
- **Primeiro comentário do Miguel (EN, rascunho):** quem ele é e por que fez; o que é o jogo em 2 linhas; a parte
  técnica que o público de lá gosta (motor determinístico a 20 Hz, mesma seed + mesmas ordens = mesma partida em
  Node, Chromium, Firefox e WebKit; o servidor re-simula a partida da Liga pra evitar trapaça; Duelo ao vivo por
  link com Supabase Realtime mandando só o que mudou); fan game sem fins lucrativos, AGPL; pedir feedback.
- **Durante 3–4 h:** responder tudo, inclusive crítica, sem defensiva. O Claude ajuda a rascunhar respostas.

## Rotina das semanas 1 a 4 (23/10 a 19/11)

- **3 clipes por semana** (seg, qua, sex às 19h): Reels + TikTok + Shorts. O próprio jogo exporta o clipe
  (Melhores momentos), então cada um custa pouco. Fila inicial:
  1. Rival evoluiu (evolução do líder com o nome do time);
  2. Gol da copa em câmera lenta;
  3. Snorlax no gol;
  4. Campeão com um Rattata (Joey dourado);
  5. "Quem vai platinar a Gen 1?" (Carvalho holográfico);
  6. "Sua insígnia é minha!" (faixa da torcida em quadra);
  7. Copa do Dia: a mesma copa pra todo mundo (o placar do Miguel como desafio);
  8. Duelo com emote (rosto do capitão).
  Legenda de vídeo: 2–5 palavras dizendo a feature; humor só pontual.
- **#DesafioDourado:** missões difíceis (copa perfeita, Rattata, platina). Quem fizer entra nas Novidades e ganha um
  título por código (skill `soccermon-titulos`).
- **Toda segunda:** placar (`npm run stats -- --md`) por canal (`/ig`, `/tt`, `/yt`, `hn`, `share`).

## Creators (a partir da semana 2)

O que mandar (o kit): mensagem curta escrita pelo Miguel (sem cara de cópia), o trailer vertical, 2–3 clipes
prontos, o link direto e **um título por código exclusivo pra audiência do canal** (ex.: "Fã do LeeGengar"; o
código também mostra quantos usaram). Sugestões de formato: short "testei um jogo em que Pokémon jogam futsal",
desafio ("consegue uma copa perfeita?"), ou 10 min de live na Copa do Dia ("bata o meu placar"). Sem cobrança: os
pequenos (5–50 mil) respondem mais; os grandes, se responderem, é bônus. Ordem: LeeGengar + o top 5 da pesquisa.

## Pendências

- Trailer 2 v3 aprovado (20/10): `~/Downloads/soccermon-trailer2/final/`, 33,4 s, PT/EN, 9:16 e 16:9.
- Liga e Copa do Dia no ar (em produção) antes do Dia D, porque aparecem no trailer.
- Lista de creators (pesquisa rodando) e o kit.
