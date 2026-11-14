---
description: Proposta e protótipo da lista de amigos e do perfil do amigo.
---

# Amigos

Pedido do Miguel (19/10/2026): "um botão de adicionar amigo é necessário". Proposta + protótipo na branch `amigos`
(nada aplicado no Supabase). Base: Duelo por link (`multiplayer.md`), contas Google, Perfil com treinador e clube, e o
cartão do treinador que abre ao tocar no rival (outra branch), que já tem o botão "Adicionar amigo" desligado.

## Decidido com o Miguel (19/10/2026)

1a só conta Google · 2a código de 8 letras + botão no cartão do rival · 3a pedido → aceitar · **4b mostrar quem está
online (bolinha verde na lista)** · **5a+b convite na lista e no cartão do Duelo da Home por 15 min e também um aviso por
cima de qualquer tela, na hora** · 6a 100 amigos, 20 pedidos esperando, 30 por dia, pedido some em 30 dias · 7a só
bloquear · 8a aba Amigos no Perfil · 9a código fixo.

Feito na branch `amigos` (migração escrita, **não aplicada**). O botão "Adicionar amigo" está no cartão do treinador de
verdade (`PlayerCard.tsx`).

## Online e aviso na hora: como ficou e quanto custa

**Online (ponto verde)** = o jogo aberto e visível nos últimos 150 s. Com a aba visível, o jogo chama `amigos_ping` a
cada 60 s (grava `seen_at` no cartão) e a lista diz `online` só pros amigos aceitos. A lista já é recarregada a cada
30 s na Home e no Perfil, então o ponto vem junto, sem Realtime.

**Aviso na hora** (pedido, amizade aceita, desafio) sai do próprio banco pelo Realtime Broadcast (`realtime.send`)
num canal privado por conta, `amigos:<id>`. Só o dono ouve (política em `realtime.messages`); o navegador não fala
nesse canal. O aviso só leva o código e o nome público de quem mandou e o código da sala. Ao chegar, o jogo recarrega a
lista, e o convite aparece por cima da tela (`FriendInvite` no `App.tsx`; não aparece na Home nem no Duelo, onde o
convite já está na tela).

**Por que não Presence:** num canal comum de presença todo mundo veria todo mundo online, e cada entrada/saída vira
mensagem pra todos os conectados (com N online, N mensagens por entrada: cresce com N²). Um canal de presença por amigo
bate no limite de canais por conexão (100 amigos = 100 canais). O sinal de 60 s no banco não gasta mensagem nenhuma do
Realtime.

**Cota do Supabase grátis** (200 conexões ao mesmo tempo, 2 milhões de mensagens/mês, 100 mensagens/s):

| O quê | Gasto |
|---|---|
| Ponto online | 0 mensagens do Realtime; 1 chamada ao banco por minuto por jogador com a aba visível e alguém na lista |
| Aviso (pedido, aceite, desafio) | ~2 mensagens cada (o envio do banco e a entrega pro dono do canal). 1.000 desafios por dia ≈ 60 mil/mês, 3% da cota |
| Conexões | 1 por aba visível de quem tem conta Google **e** alguém na lista (amigo ou pedido enviado). O Duelo usa a mesma conexão. Aba escondida fecha o canal; ao voltar, recarrega a lista (o convite vale 15 min, nada se perde) |

O limite que pesa primeiro é o de **200 conexões ao mesmo tempo**. Passou disso, quem fica sem canal continua vendo o
convite na Home e na lista (que se atualizam a cada 30 s), só não recebe o aviso por cima da tela.

## Recomendação (antes das decisões)

**Código de amigo de 8 letras + pedido → aceite, só com conta Google, sem chat.** Adiciona de dois jeitos: pelo cartão
do rival depois de um Duelo (um toque) ou digitando o código que o amigo mandou no WhatsApp. A lista fica numa aba
**Amigos** do Perfil, com **Desafiar** (cria a sala do Duelo e o convite aparece pro amigo por 15 minutos, na lista
e no cartão do Duelo da Home), remover e bloquear. Ninguém procura ninguém pelo nome, e não tem "online agora" na
primeira versão. É o desenho do Pokémon GO (código + aceite, sem chat) com o desafio direto do Clash Royale.

## O que os outros fazem

| Jogo | Como adiciona | Aceite? | Lista / online | Desafiar | Chat | Proteção |
|---|---|---|---|---|---|---|
| **Pokémon GO** | código de treinador de 12 dígitos ou QR | sim (pedido some em 7 dias) | até 400–450 amigos, sem online | trocas, batalha | **nenhum** | sem chat nenhum; o público infantil entra pela conta Niantic Kids |
| **Clash Royale** | link de convite, Supercell ID, ou depois de um 2v2 | o link já adiciona | até 100 (300 no Supercell ID), mostra online | batalha amistosa direto da lista | chat do clã | silenciar emotes na partida |
| **Marvel Snap** | não tem lista: código de 5 dígitos por partida | não | não | "Friendly Battle" com o código da sala | nenhum | o próprio desenho evita contato |
| **Chess.com** | busca por nome, pedido de amizade | sim | lista e online | desafio | mensagens | "Safe Mode" pedido ao suporte desliga mensagens e chat |
| **Lichess** | seguir (sem aceite) | não | quem você segue, online | desafio | chat na partida | "Kid mode" desliga toda comunicação; bloquear |

O que serve pra gente:

- **Sem chat** é o que deixa o recurso seguro pra 12+ sem moderação humana (Pokémon GO e Marvel Snap). Os emotes do
  Duelo já cobrem a conversa.
- **Código + aceite** evita "seguir" desconhecido e evita busca por nome (que vira caça a perfil). O código passa
  fora do jogo (WhatsApp), igual ao link do Duelo.
- **Adicionar depois da partida** (Clash Royale, 2v2) é o momento em que dá vontade: é o botão do cartão do rival.
- **Desafiar pela lista** é o ganho real sobre o link: o convite chega sem precisar mandar nada.
- **Online agora** dá trabalho (Presence no Realtime pra cada conta) e expõe hábito de horário. Fica pra depois.

## Fluxo

1. **Seu código** (Perfil → Amigos): `K7M2 QXAB`, com Copiar e Compartilhar. O código nasce no primeiro login com
   Google depois da versão nova (o jogo cria o "cartão" sozinho ao abrir a Home) e o nome do cartão acompanha o Perfil.
2. **Adicionar**:
   - pelo código: digita (aceita minúscula, espaço, traço) → "Pedido enviado pra Davi.";
   - pelo cartão do rival no Duelo: "Adicionar amigo" → "Pedido enviado". Rival sem conta Google ou você sem conta: o
     botão fica desligado com o motivo.
   - os dois se pediram: viram amigos na hora.
3. **Aceitar ou recusar** em "Pedidos de amizade". Recusar não avisa ninguém; o pedido some em 30 dias se ninguém
   responder.
4. **Desafiar**: abre a tela do Duelo com a faixa "Desafio pra Ana Clara: crie a sala e o convite chega na hora".
   Criou a sala, o convite vai. O amigo vê "Ana Clara te chamou pro Duelo · Entrar" no cartão do Duelo da Home e no
   topo da lista (vale 15 min). O link de sempre continua lá pra quem quiser mandar no WhatsApp também.
5. **Remover / Bloquear** no botão "⋯" da linha (com confirmação na própria linha). Bloquear tira dos amigos, apaga
   os desafios e esconde os pedidos novos dessa pessoa, **sem avisar**: pra ela, o pedido "foi". Desbloquear fica
   numa lista recolhida "Bloqueados".

O que **não** entra: chat, busca por nome, ver o time/vitrine do amigo pela lista (dá pra pôr depois,
com o cartão do treinador), notificação push.

## Banco (`supabase/migrations/20261020120000_amigos.sql`, não aplicado)

| Tabela | O que guarda |
|---|---|
| `friend_cards` | o cartão público: código (único), treinador, clube, sigla, cor |
| `friend_links` | pedido (`pending`) ou amizade (`accepted`); um par só tem uma linha |
| `friend_blocks` | quem bloqueou quem |
| `friend_challenges` | convite pra sala do Duelo (código de 6 letras), vale 15 min |
| `friend_rate` | quantos pedidos cada conta fez no dia |

- **RLS ligado e nenhuma política**: ninguém lê nem escreve as tabelas pela API. Tudo passa por funções `amigos_*`
  (`SECURITY DEFINER`, `search_path` vazio), que só mexem nas linhas de `auth.uid()` e só devolvem colunas públicas.
- **O navegador só vê código de amigo e nome público** (treinador + clube, os mesmos do ranking). Nunca o id da conta,
  e-mail, nome ou foto do Google. A única entrada por id é "adicionar o rival do Duelo", porque o id dele já está na
  sala.
- Funções: `amigos_cartao` (cria/atualiza o cartão, devolve o código), `amigos_pedir` (por código ou pelo id do rival),
  `amigos_responder`, `amigos_remover`, `amigos_bloquear`, `amigos_desbloquear`, `amigos_desafiar`, `amigos_lista`.
- Só conta Google: a sessão anônima do Duelo recebe `precisa_conta`; visitante (`anon`) nem chama.
- Apagar a conta leva tudo junto (`on delete cascade`).
- Limpeza diária (pg_cron `limpar-amigos`): pedido sem resposta em 30 dias, desafio velho em 1 dia, contador em 2 dias.
- Código: 8 caracteres do alfabeto da sala do Duelo (sem I, O, 0, 1), 32^8 ≈ 1 trilhão, sorteado com
  `gen_random_uuid()` (sorteio forte). Com 30 tentativas por dia, chutar código não dá em nada.

### Anti-abuso

| Limite | Valor | Por quê |
|---|---|---|
| Amigos | 100 | Clash Royale usa 100; ninguém desafia mais que isso |
| Pedidos esperando resposta | 20 | barra quem sai pedindo pra todo mundo |
| Pedidos por dia (inclusive código errado) | 30 | barra spam e chute de código |
| Desafio pro mesmo amigo | 1 a cada 10 s | barra metralhar convite |
| Desafio | vale 15 min | a sala do Realtime some quando os dois saem |

Moderação mínima: o único texto livre que outra pessoa vê é o nome do treinador e do clube, que já são públicos no
ranking. Nome ofensivo: bloquear resolve pra quem viu; se aparecer, o próximo passo é um filtro de palavrões no
`amigos_cartao` e no ranking juntos (decisão 7).

## Página de privacidade (texto da proposta; o que entrou está em `public/privacidade.html` e `privacy.html`)

No **Resumo**, um item novo:

> Amigos: só com login. Seus amigos veem o nome de treinador e do clube que você escolheu e o seu código de amigo;
> ninguém te acha pelo nome, e não existe chat.

Em **O que coletamos**, depois de "Copa do Dia e Liga":

> **Amigos (só com login):** o seu código de amigo, o nome de treinador e do clube (sigla e cor) que os amigos veem,
> os pedidos, as amizades, quem você bloqueou e os convites pro Duelo (o código da sala). Quem recebe um pedido seu vê
> o seu nome de treinador e clube. Bloquear não avisa a outra pessoa.

Em **Por quanto tempo**:

> Pedido de amizade sem resposta some em 30 dias e convite pro Duelo em 1 dia. A lista de amigos fica enquanto a conta
> existir; apagar a conta apaga tudo na hora.

## Protótipo (branch `amigos`)

| Peça | Onde |
|---|---|
| Conversa com o servidor, código de amigo, grupos da lista | `src/friends/api.ts` (+ `api.test.ts`) |
| Servidor de mentira | `src/friends/demo.tsx` |
| Aba Amigos, botão do cartão, convite na Home | `src/ui/profile/FriendsTab.tsx`, `friends.css` |
| Aba no Perfil, faixa no Duelo, convite na Home | `Profile.tsx`, `Duel.tsx` (manda o convite ao criar a sala), `Home.tsx` |
| Textos | `src/i18n/pt/friends.ts`, `src/i18n/en/friends.ts` |
| Online e aviso na hora | `startFriendsLive` em `src/friends/api.ts` (ligado no `main.tsx`), `FriendInvite` no `App.tsx` |
| Botão no cartão do treinador | `src/ui/profile/PlayerCard.tsx` |
| Banco e teste das regras | `supabase/migrations/20261020120000_amigos.sql`, `supabase/tests/amigos_rls.test.sql` |
| Privacidade | `public/privacidade.html`, `public/privacy.html` |

Atalhos (dev): `?demo=amigos` (Perfil → Amigos com Davi e Ana online; o código `CHAR2ZRD` acha o "Gary"),
`?demo=amigos&tela=home` (convite na Home), `?demo=amigos&tela=config` (Configurações; 2 s depois a Ana chama pro
Duelo e o aviso aparece por cima), `?demo=amigos&cartao=1` e `&cartao=anon` (o cartão do treinador do rival com o
"Adicionar amigo").

Pra rodar o teste do banco: as instruções estão no topo de `supabase/tests/amigos_rls.test.sql` (Postgres no Docker).

## Decisões pro Miguel (respondidas em 19/10, no topo)

1. **Quem pode ter amigos?**
   a) Só conta Google *(recomendo: o código e a lista valem em qualquer aparelho, e é a mesma regra do ranking)*;
   b) também quem joga anônimo no Duelo (a lista some se limpar o navegador).
2. **Como adicionar?**
   a) Código de 8 letras + botão no cartão do rival depois do Duelo *(recomendo)*;
   b) só pelo Duelo (sem código);
   c) também busca por nome (não recomendo pra 12+).
3. **Pedido precisa de aceite?**
   a) Sim, pedido → aceitar *(recomendo)*;
   b) não, adiciona direto (estilo "seguir" do Lichess).
4. **Ver quem está online?**
   a) Não na primeira versão *(recomendo: menos exposição e menos Realtime aberto)*;
   b) sim, uma bolinha verde na lista (Presence; uma conexão a mais por jogador logado).
5. **Como o amigo fica sabendo do desafio?**
   a) Na lista e no cartão do Duelo da Home, por 15 minutos, conferindo a cada 30 s *(recomendo)*;
   b) também um aviso por cima de qualquer tela (precisa do Realtime ligado o tempo todo);
   c) só pelo link, como hoje.
6. **Limites:** 100 amigos, 20 pedidos esperando, 30 pedidos por dia, pedido some em 30 dias *(recomendo assim)*;
   ou outros números.
7. **Moderação de nomes:**
   a) Só bloquear, como está *(recomendo pra agora)*;
   b) filtro de palavrões nos nomes (cartão de amigo e ranking juntos);
   c) botão "Denunciar" que manda pra você revisar (precisa de uma tela de admin).
8. **Onde fica a lista?**
   a) Aba "Amigos" no Perfil (7 abas: no celular viram 2 fileiras de 4) *(recomendo)*;
   b) um botão "Amigos" na Home.
9. **Dá pra trocar o código?**
   a) Não *(recomendo: bloquear resolve)*;
   b) "Gerar código novo" (quem tinha o velho não te acha mais).

## Fontes

- Pokémon GO, amigos e limite: [Pokémon GO Hub](https://pokemongohub.net/post/news/pokemon-go-friends-list-limited-increased/),
  [Dot Esports](https://dotesports.com/pokemon/news/how-many-friends-can-you-have-in-pokemon-go),
  [wiki](https://breezewiki.discard.no/pokemongo/wiki/Friends)
- Clash Royale, convite e limites: [Esports.net](https://www.esports.net/news/mobile-games/how-to-add-friends-in-clash-royale/),
  [Pro Game Guides](https://progameguides.com/clash-royale/how-to-add-friends-in-clash-royale/)
- Marvel Snap, Friendly Battle por código: [Shacknews](https://shacknews.com/article/133933/marvel-snap-play-friends-battle-mode),
  [GameSpot](https://gamespot.com/articles/marvel-snaps-pvp-battle-mode-coming-tuesday/1100-6510992/)
- Chess.com Safe Mode: [suporte](https://support.chess.com/en/articles/8614033-what-is-safe-mode-and-how-do-i-turn-it-on)
- Lichess Kid mode e turmas: [lichess.org/page/class](https://lichess.org/page/class),
  [Chess in Schools](https://www.chessinschools.co.uk/lichess)
