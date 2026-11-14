---
name: soccermon-social
description: Social media do Soccermon (TikTok, Instagram, YouTube Shorts, X): pauta da semana, clipes, legendas, agendamento pelo Buffer (API), comentários e placar. Use sempre que for planejar, preparar, agendar ou postar qualquer coisa nas redes do jogo, responder comentário, ou medir o que deu certo.
---

# Social media do Soccermon

O Miguel passou as redes pro Claude (20/10/2026: "masterize a arte de ser meu social media"). O Claude planeja, faz
os clipes, escreve, agenda, acompanha e mede. **Publicar continua com o ok dele, mas em lote:** uma pauta numerada
por semana, ele responde numa linha ("ok 1–5", "tira o 3") e o Claude agenda tudo o que foi aprovado. Nada sai que
não esteja numa pauta aprovada: post, story, comentário e resposta. Texto fora da pauta (comentário com crítica,
pergunta difícil, DM de creator) vai pra ele como rascunho.

Leia antes: `docs/marca/brand-guide.md` (método de escrita, seção "O método de escrita do Miguel"),
`.claude/skills/soccermon-assets/SKILL.md` (como gravar e montar vídeo) e o plano vigente
`docs/planos/divulgacao-trailer2.md`. Pauta e registro: `docs/marketing/pauta.md`.

## Canais

Desde 27/10/2026 tudo sai pelo **Buffer** (plano grátis, API), sem o Claude in Chrome: `scripts/buffer.mjs`.

| Canal | Conta | Buffer (id) | Observações |
|---|---|---|---|
| TikTok | @soccermongame | `6adfc5252f1f5ed648df904e` | link na legenda + comentário fixado pelo app (link na bio só com 1000 seguidores) |
| Instagram | @soccermongame | `6adfc4952f1f5ed648df8ab1` | Reels: `{"instagram":{"type":"reel","shouldShareToFeed":true}}`; link clicável só na bio |
| YouTube Shorts | canal "Soccermon" (@soccermongame) | `6ae012e82f1f5ed648e3c7d8` | `{"youtube":{"title":…,"privacy":"public","categoryId":"20","madeForKids":false}}` |
| X | conta pessoal do Miguel | não ligado | rascunho pra ele postar |

**Como postar:** o vídeo vai pro repo público github.com/miguel20br/soccermon-midia (o Buffer só aceita link direto;
use `raw.githubusercontent.com/miguel20br/soccermon-midia/main/<arquivo>`), a legenda de cada rede num `.txt`, e
`node scripts/buffer.mjs postar <canal> <url> <legenda.txt> <ISO|fila|agora> [metadata]` (`CAPA_MS=` escolhe o quadro
da capa no TikTok e no Instagram). `node scripts/buffer.mjs canais` confere as redes ligadas. A chave `BUFFER_API_KEY`
fica no `.env.local` e vence a cada 30 dias (renovar em publish.buffer.com/settings/api, só ler e postar).
**Pegadinha do YouTube:** o canal é a conta de marca "miguel20br" dentro da conta Google secundária do Miguel (a "08"). Ao ligar no Buffer,
escolher "miguel20br · YouTube", não o e-mail (que leva a um canal pessoal vazio).

Links com origem (o placar lê o `utm_source`): `soccermon.com/tt`, `/ig`, `/yt`; X e HN com `?utm_source=x|hn`.

## O que funciona (pesquisa de 20/10/2026)

- **Gancho no 1º segundo:** começar no lance (gol, golpe, evolução, defesa), nunca em logo ou abertura. Quem passa o
  dedo nos 2 primeiros segundos derruba a distribuição. Testar 2 ganchos com o mesmo lance quando der.
- **Curto e inteiro:** 7 a 15 s, um lance só, com começo, pico e fim; trailer recortado não funciona.
- **Compartilhamento pesa mais que curtida** (Reels: envios por DM são dos sinais mais fortes). Legenda que dá motivo
  pra mandar pro amigo ("seu time de Kanto ganharia?") vale mais que hashtag.
- **Constância > volume:** 3 por semana (seg, qua, sex às 19h) por 4 semanas antes de julgar. Semana de lançamento
  pode ter 1 por dia.
- **Original e sem marca d'água:** o mesmo MP4 limpo vai pro TikTok, Reels e Shorts (sai do nosso pipeline; nunca
  baixar do TikTok pra repostar).
- Legenda com palavras que as pessoas buscam (Pokémon, futsal, Kanto, jogo de navegador) > muitas hashtags; 3–5
  hashtags no máximo.

## Voz

Método de escrita do Miguel: curto, direto, sem ironia, sem "parece IA". Texto no vídeo: 2 a 5 palavras dizendo a
feature (o mesmo estilo das legendas do trailer: "ESCOLHA 1 DE 3", "EVOLUÇÕES NO MEIO DO JOGO"). Legenda do post: uma
pergunta ou frase de fã + o link + crédito da música se tiver. Humor de fã só pontual. Emoji só na legenda do post
(nunca no vídeo). Nada de dinheiro, doação, sorteio, "link na bio pra comprar"; nada sobre Nintendo/Game Freak.

## A semana

1. **Segunda:** placar (`npm run stats -- --md` + TikTok Studio → Analytics + Insights do Instagram) no
   `docs/marketing/pauta.md` (Registro): views, % que assistiu tudo, compartilhamentos, cliques por canal. Escolher o
   que repetir (o formato que mais compartilhou) e o que largar.
2. **Segunda:** pauta da semana em texto pro Miguel, numerada: dia/hora, canal, lance, texto na tela, legenda, capa.
   Ele aprova numa linha. Sem resposta, nada é agendado (não insistir mais de uma vez no dia).
3. **Gravar e montar** os aprovados (skill `soccermon-assets`): clipe 1080x1920, 30 fps, sem nome em cima dos
   Pokémon; cópia `-celular` ≤ 10 MB (ffmpeg 2 passes, ~1,45 Mbps) pra subir pela extensão. Folha de contato antes
   de agendar (centro, nada cortado, texto legível no celular).
4. **Agendar** tudo de uma vez nos canais (passos abaixo) e conferir na lista que ficou com a data certa.
5. **Depois de cada post (até 1 h):** comentário com o link (TikTok), olhar os comentários; responder os simples com
   textos da pauta ("valeu!", "é grátis, joga em soccermon.com"); dúvida/crítica vai pro Miguel em rascunho.

## Plano B: TikTok Studio pelo Chrome (aprendido em 20/10; só se o Buffer falhar)

- O upload pela extensão só aceita arquivo que a sessão pode ler: copie o MP4 e a capa pro scratchpad antes do
  `file_upload`. Limite de 10 MB por envio.
- Legenda: clicar no editor, `ctrl+a` + Delete (vem o nome do arquivo), digitar; quebra de linha com `shift+Enter`;
  hashtag uma por vez com espaço e 1 s de espera; Esc fecha as sugestões.
- **Capa:** "Edit cover" → "Upload cover" com a imagem 1080x1920 (o Miguel prefere a capa do trailer
  `docs/marketing/capa-PT-9x16.png`, centralizada, ao último quadro do vídeo). Conferir a prévia 3:4 do perfil.
- **Agendar:** "Schedule" (na 1ª vez pede "Allow" pra guardar o vídeo); data no calendário; hora clicando nos números
  da roda (cada clique no de baixo sobe 3 horas). Fuso do PC (Brasília).
- Ligue só o **Music copyright check** (sai em segundos). **Não ligue o Content check lite**: ele leva 10 min e o
  botão vira "Post now" (publicaria na hora).
- **Post agendado não se edita.** Pra trocar vídeo ou capa: agendar o novo primeiro, conferir, depois apagar o antigo.
- "Video published" aparece até pra agendado; confira em Posts o selo com a data.

## Plano B: Instagram pelo Chrome

- Perfil: `instagram.com/accounts/edit/` (foto pelo input de arquivo, bio); nome em Accounts Center → Profiles →
  Name (só 2 trocas a cada 14 dias). Site/link só no app.
- Reels: "Create" → selecionar arquivo → 9:16 → legenda → Share. Sem conta profissional não agenda: no dia, ou o
  Claude posta na hora (sessão aberta) ou o Miguel posta pelo celular.

## Comentários e creators

- Responder rápido na 1ª hora (pesa no alcance). Respostas prontas na pauta; nada de discutir.
- Pedido de feature/bug: agradecer, anotar em `docs/marketing/pauta.md` (Ouvidos) e, se for bug, avisar o Miguel.
- Creators: o kit está em `~/Downloads/soccermon-kit-creators/`; mensagem escrita pelo Miguel, enviada por ele (ou
  pelo Claude só com o ok daquela mensagem).
