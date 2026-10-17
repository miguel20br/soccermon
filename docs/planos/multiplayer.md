# Multiplayer (rascunho para pensar junto, 17/10/2026)

Decidido com o Miguel: a ordem é **duelo ao vivo amistoso por link → liga ranqueada (fantasmas, Elo, divisões,
Copa do Dia) → copas entre amigos e Copa Semanal → duelo ranqueado e espectador na 1.0**. Antes de construir,
pensar melhor nas regras do duelo ao vivo (este documento). Sem servidor pago e sem dinheiro.

## O que o motor já dá

- A partida é função das entradas: `runMatch(cfg, casa, fora, seed, { orders })`. As ordens do técnico (tática,
  substituição) já são agendadas num tick futuro e a tela resimula tudo (`sendOrder` em `Match.tsx`).
- Os dois navegadores só precisam combinar a lista de ordens (~3 KB por partida com os dois times). Nada de
  mandar o resultado (1,6 MB).
- Supabase Realtime grátis: 200 conexões ao mesmo tempo, 2 milhões de mensagens/mês (~10 mil duelos/mês),
  pausa depois de 7 dias sem uso. Plano B sem custo: Trystero (WebRTC P2P, Supabase só apresenta os dois).

## Pré-requisito: a mesma partida em todo navegador

O motor usa `Math.sin/cos/atan2/exp/log/hypot`, e a especificação do JS não garante o mesmo resultado em
Chrome, Safari e Firefox. Trocar por versões próprias e criar um teste com o hash do resultado fixo. Cada time e
cada partida guardam `engineVersion`: duelo só entre versões iguais.

## Problemas a resolver

### 1. Velocidade (pedido do Miguel)

Os dois têm que ver o mesmo minuto ao mesmo tempo. Proposta:

- **Um relógio só, da sala.** O host manda "a partida começou em T, na velocidade V"; cada tela calcula o minuto
  a partir disso. Ninguém tem botão de 8x sozinho.
- **Velocidade escolhida ao criar a sala** (2x, 4x ou Lances), igual pros dois. Mudar no meio só por pedido
  aceito pelo outro ("Fulano quer 4x: aceitar?").
- **Chance de gol cai pra velocidade da sala**, nunca pra uma opção pessoal (a opção "velocidade nas chances de
  gol" não vale no duelo).
- **Pular para o fim** não existe no duelo.

### 2. Ver o futuro (o maior risco)

Como a partida é determinística, um jogador com o jogo modificado pode simular o resto da partida no próprio
navegador, testar todas as táticas e escolher a que dá gol. Proposta: **seed por trecho**. A cada período (por
exemplo, a cada 2 minutos de jogo) a aleatoriedade é renovada com um número que os dois sorteiam em segredo e só
revelam na hora (compromisso e revelação). Dá pra prever no máximo até o fim do trecho atual, e as ordens já
valem com atraso de alguns segundos.

### 3. Decisões e intervalo

- Ordens valem alguns ticks à frente (o `leadTicks` que já existe), e o rival vê a troca acontecer.
- Mesmo limite de trocas de tática pros dois, validado no motor (hoje está só na tela).
- Intervalo com tempo (por exemplo 20 s): os dois decidem, e o 2º tempo começa quando os dois estão prontos ou
  quando o tempo acaba.

### 4. Draft disputado

- Pacotes da mesma seed pros dois. Formato a decidir: **snake** (um tira, o outro tira, a carta some) ou
  **simultâneo** (cada um com seus pacotes, mesma seed).
- Tempo por escolha (por exemplo 20 s; acabou, sai a melhor carta pra vaga).

### 5. Queda de conexão

O log de ordens reconstrói a partida. Quem cai volta pro mesmo minuto; enquanto está fora, a IA técnica decide
por ele. Abandono conta como derrota no ranqueado.

### 6. Trapaça no ranqueado

O servidor (Edge Function do Supabase) sorteia as seeds, recebe só as escolhas e as ordens, roda a partida de
novo (~0,5 s, cabe no limite de 2 s) e grava o placar. O cliente nunca informa o resultado.

## Decidido com o Miguel (17/10)

1. **Draft:** os dois formatos, como modos separados: **Disputa** (snake: um tira, o outro tira, a carta some) e
   **Cada um com seus pacotes** (mesma seed pros dois).
2. **Velocidade:** começa numa velocidade fixa da sala; no meio, qualquer um toca numa velocidade e o outro
   recebe o pedido ("Fulano quer 4x") pra aceitar ou recusar. Sem resposta em ~5 s, fica como está.
3. **Quem joga:** qualquer um com o link, mas logado (conta com save na nuvem), pra ter nome, avatar e histórico.
4. **Emotes (decidido pelo Claude):** 6, desenhados (sem emoji), no máximo 1 a cada 3 s, e dá pra silenciar os do
   rival:
   - **Boa!** (palmas), **Golaço!** (bola em chamas), **Ops** (gota de suor), **Zzz** (Snorlax dormindo, a
     provocação), **GG** (aperto de mão) e **Grito do capitão** (toca o grito do seu capitão).

## Pesquisa técnica (17/10)

Pesquisa só de leitura (código + web), sem mexer em nada. Resumo: **dá pra fazer o duelo amistoso inteiro com
Supabase Realtime grátis, sem tabela nova**, desde que antes a gente tire as funções de `Math` que variam entre
navegadores do motor. O resto (relógio, ordens, seed por trecho) é pouco código em cima do que já existe.

### 1. A mesma partida em todo navegador

**O que a especificação garante:** `+ - * /`, `Math.sqrt`, `Math.fround`, `abs/min/max/floor/ceil/round/trunc` e
`imul` são exatos (IEEE 754) em qualquer motor. Os JITs não juntam multiplicação e soma (FMA), então conta com
essas operações dá o mesmo bit em todo lugar. **Não garante** `sin, cos, tan, atan, atan2, exp, log, pow (**),
hypot, tanh, cbrt…`: o padrão só "recomenda" o fdlibm, e cada motor usa o seu.

- Chrome: `exp`, `pow` e `atan` vêm do llvm-libc e `sin/cos` de rotinas da glibc embutidas no V8. Desde o Chrome
  148, `Math.tanh` chama o libm do sistema e já dá resultado diferente no Linux, no Mac e no Windows.
- Firefox: trocou `sin/cos/tan` pelo fdlibm (bug 531915); o resto usa o libm do sistema.
- Safari (JavaScriptCore): usa o libm da Apple. **iPhone x Android é exatamente o par que vai jogar.**
- Caso real: a engine de física JS "bounce" dava hash diferente entre Node 20 e Chrome 149 só por causa de
  `sin/cos`; `sqrt` batia. Trocaram por `sin/cos/atan` em JS puro (kernels do fdlibm), a ~1,1x do tempo nativo.
- O Rune (plataforma de jogos multiplayer em JS) arredonda todo `Math.*` com `Math.fround`. Isso reduz o problema,
  mas não resolve: quando o valor cai bem na fronteira do arredondamento, os navegadores ainda divergem. Descartado.
- Photon Quantum (Unity) usa ponto fixo (Q48.16) no lugar de float. Pra nós seria reescrever o motor: exagero,
  porque só umas 20 chamadas são o problema.

**O que trocar no motor** (`grep -rn "Math\." src/engine`; `max/min/round/abs/floor/imul/sqrt` ficam como estão):

| Onde | Chamada | Mexe no jogo? | Troca |
|---|---|---|---|
| `vec.ts:11-12` (`len`, `dist`, ~60 usos) | `Math.hypot` | sim (tudo) | `Math.sqrt(dx*dx + dy*dy)` (exato) |
| `vec.ts:13` (`dist2`) | `** 2` | sim | `dx*dx + dy*dy` (`**` é `pow`, que não é garantido) |
| `vec.ts:29-30` (`rotate`) | `sin`, `cos` | sim (desvio do passe/chute/rebote) | `detSin/detCos` |
| `vec.ts:52` (`dir8`) | `atan2` | só `facing` (desenho), mas entra no snapshot | `detAtan2` |
| `rng.ts:66` (`gauss`) | `log`, `cos` | sim (dispersão do chute) | `detLog/detCos` |
| `xg.ts:11,19` | `atan2`, `exp` | sim (a IA decide o chute pelo xG) | `detAtan2/detExp` |
| `attributes.ts:114-115,157,159,213` | `log` | sim (porte → atributos) | `detLog` |
| `match.ts:1069,1070,2154` | `tipo ** typeBoost` | sim | tabela pronta (multiplicadores 0,25 a 4 × boost 1,2/1,3) ou `detExp(b*detLog(a))` |
| `match.ts:1091` | `0.85 ** i` | sim | multiplicar num laço (ou tabela) |
| `match-stats.ts:101` | `hypot` | estatística (distância percorrida) | `sqrt` |
| `synergy.ts:27` | `localeCompare` | ordem da sinergia | `a < b` (o `localeCompare` depende do idioma do aparelho) |

Custo: **~meio dia**. Duas formas:
- **(recomendado)** pacotes `@stdlib/math-base-special-{sin,cos,atan2,exp,ln}`: JS puro, portados do FreeBSD
  msun (fdlibm), sem nenhum `Math.*` dentro, Apache-2.0 (compatível com AGPL), poucos KB.
- copiar ~150 linhas do fdlibm pra `src/engine/det-math.ts` (como fez o bounce). Nossos ângulos são pequenos,
  então a redução simples de Cody-Waite basta.

Velocidade: as funções novas rodam a ~1,1x das nativas, e elas são uma fração pequena do tick. Os 0,5 s de
simulação não devem mudar. Muda o último bit de algumas contas, então **sobe `ENGINE_VERSION`** e roda
`npm run calibrate` antes/depois só pra confirmar que nada mexeu de verdade (skill `soccermon-balanceamento`).

**Teste de hash (golden master):**
- `src/engine/determinism.test.ts`: ~12 partidas fixas (seeds fixas, times do `aiDraftTeam`, uma com ordens, uma
  que vai pros pênaltis). O hash (FNV-1a) junta os bytes de todos os snapshots (`Float64Array` → bytes, pra
  pegar diferença no último bit) com o JSON dos eventos. Os hashes esperados ficam escritos no próprio teste.
  Mudou o motor de propósito: atualiza o hash e sobe `ENGINE_VERSION` no mesmo commit.
- Nos três motores: Vitest em modo navegador (`@vitest/browser-playwright`, `instances: chromium, firefox,
  webkit`, `headless: true`) num `vitest.browser.config.ts` que só inclui esse teste, rodado por
  `npm run test:browsers`. No CI, `npx playwright install --with-deps chromium firefox webkit` (com cache).
- Ressalva: o WebKit do Playwright no Linux não é o Safari do iPhone (o libm é outro). Depois da troca isso não
  importa mais, porque só sobra conta IEEE. Pra garantir, tem o **aperto de mão do motor**: ao entrar na sala,
  cada navegador simula 600 ticks de uma partida fixa (~40 ms) e manda o hash. Se der diferente, aparece "versões
  diferentes, atualize a página", em vez de duas partidas diferentes. Isso pega também `ENGINE_VERSION`
  esquecido e deploy no meio do duelo.

Lockstep x rollback: o GGPO, o NetplayJS e o Quantum fazem rollback porque precisam de resposta em 1 frame. O
nosso técnico já age com 2 s de atraso de propósito (`CHANGE_LEAD_TICKS = 40`), então basta **lockstep com
atraso** (o "deterministic lockstep" do Gaffer On Games). Não precisa de lib.

### 2. Transporte

| | Supabase Realtime (Broadcast + Presence) | WebRTC P2P (Trystero com Supabase só de apresentador) |
|---|---|---|
| Limites grátis | 200 conexões ao mesmo tempo, 100 msg/s, 2 milhões de msg/mês, 256 KB por mensagem, pausa depois de 7 dias sem uso | sinalização usa pouquíssimas mensagens; os dados vão direto |
| Latência | mediana de 6 ms dentro da AWS + a ida e volta até a região do projeto (do Brasil pra us-east, ~120–150 ms) | direto entre os dois (~20–80 ms no Brasil) |
| Falha | se o Supabase cai ou pausa, não tem duelo | 10–25% das conexões não fecham sem TURN (4G/5G com CGNAT); TURN grátis: Cloudflare (1.000 GB/mês, mas a credencial sai de uma Edge Function) ou Open Relay (20 GB/mês) |
| Código | já temos `supabase-js`; um canal privado + RLS | dependência nova + TURN + mais casos de erro |

Contando mensagens: cada broadcast conta 1 envio + 1 por quem recebe. Um duelo tem ~2,5 min de draft + ~3 min de
partida (2x) e manda heartbeat do relógio a cada 2–3 s, hash + revelação por trecho, ordens, picks e emotes. Dá
**~400–600 mensagens por duelo → 3 a 5 mil duelos/mês no grátis** (a conta de 10 mil lá em cima era otimista).
Estourou: o Supabase manda e-mail e dá um período de carência.

**Recomendação: Supabase Realtime**, porque é o que já temos. A latência não importa com 2 s de atraso nas
ordens. **Plano B: Trystero com a estratégia Supabase** (`@trystero-p2p/supabase`), só se estourar a cota ou a
latência incomodar. Pra isso, a conversa fica atrás de uma interface pequena (`send(tipo, dados)` / `on(tipo)`).
Ela ganha uma segunda implementação de verdade desde o dia 1: o `BroadcastChannel` nativo do navegador, pra
testar com **duas abas no mesmo PC sem login** (`?duelo=local`) e no Playwright com duas páginas.

### 3. Sincronia da partida

Uma coisa no código muda a ideia de "o host manda T e a velocidade": a velocidade da tela **não é constante**.
`MatchScene.currentSpeedFactor()` cai pra 1x perto do gol, faz câmera lenta (`dramaTicks`, `cine.speedFactor`),
segura a tela na evolução (`holdReal`) e para quando você toca num Pokémon (`inspecting`). Com isso, "minuto =
(agora − T) × V" sai errado. Proposta:

- **O host é o relógio.** A cada 2–3 s ele manda `{tick, speed}` (o `playTick` dele). O convidado compara com o
  próprio tick e corrige devagar (±10% de velocidade) se a diferença passar de ~0,5 s; se passar de 3 s, pula.
  O resto da tela continua igual pros dois porque é a mesma partida: câmera lenta, evolução e queda pra 1x no gol
  dependem só dos eventos.
- No duelo, tocar num Pokémon **abre o painel sem pausar**, e não existe pausa nem "pular para o fim".
- **Lances** é o modo mais chato de sincronizar, porque a velocidade depende do lance seguinte. Começar com 2x e
  4x e deixar Lances pra depois (decisão abaixo).
- **Ordens carimbadas pelo host.** O convidado manda o pedido ("tática X"); o host põe o tick
  (`max(tick dos dois) + leadTicks`) e um número de sequência e manda pros dois, ele incluído. Isso garante:
  log único e na mesma ordem pros dois; nada de duas ordens no mesmo tick vindo de lados diferentes (hoje o
  `LiveRunner` ordena só por `tick`, então tem que desempatar por `seq`); e o log serve direto pra reconexão.
  O atraso extra é ~100 ms dentro de 2 s de folga. O limite de 3 trocas (`MAX_TACTIC_CHANGES`, hoje só na tela)
  passa a ser validado no motor.
- **Mudar velocidade:** "Fulano quer 4x" → aceitar ou recusar em 5 s → o host anuncia "4x a partir do tick N"
  (~1 s à frente) e os dois trocam juntos.
- **Intervalo:** o motor para no `halftime`. O host manda "intervalo até T+20 s"; cada um manda as trocas
  (carimbadas pro `htTick+1`, como já é hoje) e um "pronto". Com os dois prontos ou o tempo acabando, o host manda
  "2º tempo, log com N ordens"; quem ainda não recebeu as N ordens espera antes de seguir.
- **Checagem:** em cada fim de trecho, cada lado manda um hash curto do snapshot. Se não bater, mostra "as
  partidas se separaram" e manda um evento `duelo_dessincronizou` pro analytics (ele precisa entrar na lista fixa
  da migração de estatísticas).
- **Reconexão:** quem volta pede pro outro `{times, log, segredos revelados, tick}`, resimula (0,5 s) e cai no
  minuto certo. Se o host sai, o convidado vira o relógio, porque os dois têm tudo. **Celular com app em segundo
  plano** (ir no WhatsApp mandar o link!) derruba o WebSocket no iPhone: isso é o caso comum, não exceção. A sala
  tem que aguentar sair e voltar no lobby sem drama. Enquanto alguém está fora, a partida segue e as decisões
  dele ficam com a IA técnica.

Como outros fazem: no TFT, no Hearthstone Battlegrounds e no Super Auto Pets (Versus), o combate é calculado uma
vez e os dois só assistem. As decisões ficam em **fases com cronômetro**: a fase acaba quando todos dão "pronto"
ou o tempo esgota, e quem não decidiu fica com o padrão. O Football Manager em rede tem "forçar continuar" por
tempo ou por % de prontos. É o mesmo desenho do nosso intervalo e do draft.

### 4. Anti "ver o futuro": seed por trecho com compromisso e revelação

No motor, `createMatch` cria um único `new Rng(seed, 'match')`. A mudança é **renovar o `s.rng` no início de cada
trecho** (2 minutos de jogo = 360 ticks, ~20 trechos + 1 pros pênaltis). No modo solo a seed do trecho sai da
seed da partida, então é o mesmo código nos dois modos. O `runMatch` ganha um `untilTick`, porque não dá pra
simular além do último trecho revelado, e a tela já sabe segurar num tick (`holdAt`).

Formato concreto (**cadeia de hash**, um compromisso só):
1. Antes do pontapé, cada jogador sorteia `x[N]` (32 bytes, `crypto.getRandomValues`) e calcula
   `x[i] = SHA-256(x[i+1])` até `x[0]` (`crypto.subtle.digest`, ~21 hashes, instantâneo). Ele manda `x[0]` junto
   com o "pronto", e assim cada lado se compromete antes de ver qualquer coisa do outro.
2. O trecho k usa `seed_k = SHA-256(salaId | k | xHost[k] | xConv[k])`, cujo hex vai pro `new Rng(hex, 'match')`.
3. Cada um revela `x[1]` no pontapé e `x[k+1]` quando a tela **entra** no trecho k. Quem recebe confere
   `SHA-256(x[k+1]) == x[k]`; se não bater, é trapaça.
4. Assim dá pra prever no máximo o resto do trecho atual mais o seguinte, e qualquer ordem só vale `leadTicks`
   depois. A vantagem de quem trapaceia vira quase nada.
5. **Não revelou:** a tela para no fim do trecho com "esperando Fulano…". Depois de 15 s quem ficou escolhe
   esperar mais ou encerrar com vitória por W.O. Não dá pra seguir com uma seed alternativa, porque isso deixaria
   o trapaceiro escolher entre dois futuros.
6. O `x[N]` fica guardado no save local da partida (IndexedDB, junto do `live`). Sem isso, quem recarrega a página
   perde os segredos e a partida não continua.

Custo: ~1 dia (motor + ~80 linhas na sala). No ranqueado, o servidor guarda as seeds e não precisa disso.

### 5. Drafts

Referências: Hearthstone Arena (1 de 3, sem rival), FUT Draft (capitão de 5, depois 1 de 5 por vaga), LoL champ
select (draft alternado com 30 s por pick, e quem não escolhe derruba a sala), VGC (90 s de **team preview**: você
vê os 6 do rival e escolhe 4) e drafts de fantasy (acabou o tempo, o sistema escolhe pela sua lista). O nosso
draft (`draft.ts`) tem 7 escolhas: capitão, depois você escolhe a vaga e saem 3 pra ela.

- **Disputa (snake):** a rodada define a vaga pros dois (capitão, GK, FIXO, ALA, ALA, PIVÔ, reserva, reserva).
  Saem **4** opções; um tira, o outro tira e as 2 que sobram queimam. A ordem alterna por rodada (A-B, B-A, …),
  e quem começa sai da seed. Tudo é visível: o legal é "roubar" o Pokémon que o rival queria. 20 s por escolha;
  acabou, sai a melhor pra vaga (`aiPick`, que já existe). Mostrar em cima o time do rival se montando.
- **Cada um com seus pacotes:** mesma seed, mas as opções divergem conforme as escolhas (vaga escolhida e
  `taken`), então é "mesma sorte", não "mesmo pacote". Os dois escolhem ao mesmo tempo; do rival só aparece o
  progresso ("Fulano 4/7"). No fim vem **um team preview de 30 s**: os dois times aparecem, e cada um escolhe
  formação, tática e capitão sabendo contra quem joga. Pode dar Pokémon repetido dos dois lados (espelho: tudo
  bem).
- Nos dois modos: a carta do rival usa a mesma galeria/carta de sempre, e os dois times entram no VERSUS.

### 6. Sala por link + login

- **Fluxo:** Jogar → Duelo → "Criar sala" (modo de draft + velocidade). Isso gera o código, que vira o link
  `soccermon.com/?duelo=K7M2QX` (6 letras/números sem I/O/0/1, fácil de ditar). Aí "Copiar link" / "Compartilhar"
  (`navigator.share`) → o amigo abre o link e, se não estiver logado, cai no login e volta pra sala. Na sala os
  dois se veem (nome, avatar, clube), cada um toca em "Pronto" e começa.
- **Sem tabela nova no amistoso:** canal **privado** `duelo:<código>` com uma política RLS em `realtime.messages`
  que só deixa entrar quem está logado (`to authenticated` + `realtime.topic() like 'duelo:%'`). O Presence
  mostra quem está na sala. Chegou um terceiro, ele vê "sala cheia" (espectador fica pra 1.0). A sala some sozinha
  quando os dois saem, então **não precisa de limpeza com pg_cron**. O histórico ("ganhei do Fulano por 3x2") vai
  pro **save de cada um** (o perfil já sobe pra nuvem). O amistoso não precisa de prova contra trapaça.
- Detalhes: tem que desligar "Allow public access" no Realtime (hoje o jogo não usa Realtime, então nada quebra),
  e o `supabase-js` renova o token do canal sozinho. A tabela `duelos` + Edge Function + pg_cron de limpeza
  entram no ranqueado, quando o servidor passa a gravar o placar.

### 7. Emotes

- Clash Royale lutou contra o botão de silenciar e acabou colocando: um toque silencia os emotes do rival pelo
  resto da partida. Rocket League bloqueia o chat rápido por uns segundos ("Chat disabled for 3 seconds") depois
  de spam. O Hearthstone silencia pelo retrato do herói.
- Os 6 decididos ficam. Limite de 1 a cada 3 s **no envio e também no recebimento** (quem tem jogo modificado não
  consegue inundar). O **Grito do capitão** espera 10 s, porque som incomoda mais, e respeita o volume de efeitos.
  Botão de silenciar na própria barra de emotes, com ícone de "mudo" no avatar do rival enquanto valer.

### 8. Plano de construção

| Etapa | O que dá pra ver funcionando | Esforço |
|---|---|---|
| 0. Determinismo | troca da tabela do item 1, teste de hash em Chrome/Firefox/WebKit, `ENGINE_VERSION` 2, calibração antes/depois | ½–1 dia |
| 1. Motor do duelo | `s.rng` renovado por trecho, `untilTick`, ordens desempatadas por `seq`, limite de trocas no motor, `manualSubs` nos dois times | 1 dia |
| 2. Duas abas no PC | transporte `BroadcastChannel`, os dois **com o time que já têm** (última copa), mesma partida nas duas abas com relógio do host e ordens carimbadas; teste Playwright com duas páginas comparando o placar | 1–2 dias |
| 3. Sala de verdade | Supabase Realtime privado, link, login, presença, pronto, aperto de mão do motor | 1 dia |
| 4. Seed por trecho | cadeia de hash, W.O. por não revelar, hash de checagem por trecho | 1 dia |
| 5. Intervalo, velocidade e reconexão | intervalo de 20 s, pedido de 4x, voltar pro minuto certo, IA técnica enquanto fora | 1–2 dias |
| 6. Emotes | 6 desenhados, limite, silenciar | ½–1 dia |
| 7. Drafts | primeiro "cada um com seus pacotes" (reusa o draft de hoje) + team preview; depois Disputa | 2–3 dias |
| 8. Acabamento | celular 320/390 e deitado, tela de fim, revanche, histórico no save, PT/EN, analytics | 1–2 dias |

**Total: ~10–14 dias de trabalho.** Dá pra fatiar a 0.8.5 em "duelo com o time que você já tem" (etapas 0 a 6) e
deixar os dois drafts pra 0.8.6.

Opções, do simples ao rico:
- **A. Duelo com time pronto** (etapas 0–6): ~6–8 dias, risco baixo. Já dá pra jogar com o Davi.
- **B. A + "cada um com seus pacotes"**: ~9–10 dias.
- **C. Tudo (A + os dois drafts + Lances sincronizado)**: ~14+ dias, risco médio (Lances e Disputa são os mais
  chatos).
Recomendação: **A na 0.8.5 e os drafts na 0.8.6**.

Riscos: (1) não determinismo escondido que o teste não pegou (mitigado pelo hash por trecho e pelo aperto de mão);
(2) iPhone derrubando a conexão em segundo plano; (3) cota de 2 milhões de mensagens se viralizar (plano B
Trystero); (4) Supabase pausado depois de 7 dias sem uso, que derruba duelo e login juntos; (5) resimular a
partida inteira a cada ordem do rival (0,5 s) num celular fraco (hoje só acontece nas suas ordens; agora dobra).

### 9. Decisões pro Miguel

1. **Fatiar:** 0.8.5 = duelo com o time que cada um já tem; drafts na 0.8.6? *(recomendo sim)*
2. **Velocidades do duelo:** só 2x e 4x por enquanto, Lances depois? *(recomendo sim)*
3. **Tocar num Pokémon no duelo** abre o painel sem pausar? *(recomendo sim; pausa não existe no duelo)*
4. **Trecho de 2 minutos** pra seed secreta; quem não revela em 15 s pode perder por W.O.? *(recomendo sim)*
5. **Disputa:** 4 opções por rodada, a vaga é a mesma pros dois e 2 queimam? Ou 3 opções e 1 queima?
   *(recomendo 4, porque sobra escolha real pra quem tira em segundo)*
6. **Cada um com seus pacotes:** escolhas do rival escondidas até o fim + team preview de 30 s? *(recomendo sim)*
7. **Tempo por escolha** no draft: 20 s? *(recomendo 20 s, e o capitão 30 s)*
8. **Histórico do amistoso** só no save de cada um, sem tabela no banco? *(recomendo sim)*
9. **Grito do capitão** com espera de 10 s (os outros 3 s)? *(recomendo sim)*
10. **Queda no amistoso:** a partida segue com a IA técnica decidindo por quem caiu, e ele volta pro minuto certo?
    *(recomendo sim; W.O. só se não voltar até o fim)*

### Fontes

- Determinismo: [es-discuss: precisão das funções especiais](https://esdiscuss.org/topic/es6-accuracy-of-special-functions) ·
  [Scrapfly: Math do navegador por SO (V8/tanh, llvm-libc)](https://scrapfly.dev/posts/browser-math-os-fingerprint/) ·
  [commit do V8 (tanh → std::tanh)](https://chromium.googlesource.com/v8/v8/+/c1486295ae5bcb0f8fb078b7cf921802ccd75eaf) ·
  [Firefox bug 531915 (fdlibm em sin/cos/tan)](https://bugzilla.mozilla.org/show_bug.cgi?id=531915) ·
  [bounce #8: sin/cos divergindo entre motores](https://codeberg.org/perplexdotgg/bounce/issues/8) ·
  [Rune: making JS deterministic](https://developers.rune.ai/blog/making-js-deterministic-for-fun-and-glory/) ·
  [stdlib math-base-special-sin (fonte, port do msun)](https://github.com/stdlib-js/math-base-special-sin) ·
  [Gaffer On Games: Deterministic Lockstep](https://gafferongames.com/post/deterministic_lockstep/) ·
  [Gaffer: Floating Point Determinism](https://gafferongames.com/post/floating_point_determinism/) ·
  [Photon Quantum (FP Q48.16, predict/rollback)](https://doc.photonengine.com/quantum) ·
  [NetplayJS](https://github.com/rameshvarun/netplayjs) ·
  [Vitest Browser Mode](https://vitest.dev/guide/browser/) · [Playwright: navegadores](https://playwright.dev/docs/browsers)
- Transporte: [Supabase Realtime: limites](https://supabase.com/docs/guides/realtime/limits) ·
  [Supabase: preços](https://supabase.com/pricing) ·
  [Supabase: como conta mensagens](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages) ·
  [Supabase: benchmarks](https://supabase.com/docs/guides/realtime/benchmarks) ·
  [Supabase: Broadcast](https://supabase.com/docs/guides/realtime/broadcast) ·
  [Supabase: Realtime Authorization (canal privado + RLS)](https://supabase.com/docs/guides/realtime/authorization) ·
  [Trystero](https://github.com/dmotz/trystero) ·
  [Cloudflare Realtime TURN: preços](https://developers.cloudflare.com/realtime/pricing/) ·
  [Open Relay (Metered)](https://metered.ca/tools/openrelay/) ·
  [quantas conexões precisam de TURN](https://getstream.io/resources/projects/webrtc/advanced/stun-turn/)
- Draft, fases e emotes: [LoL: Draft Pick](https://wiki.leagueoflegends.com/en-us/Draft_pick) ·
  [VGC: regras (team preview 90 s)](https://victoryroad.pro/sv-rules-regulations/) ·
  [Super Auto Pets: Versus e cronômetro](https://superautopets.wiki.gg/wiki/The_Basics) ·
  [FM em rede: forçar continuar](https://www.fmscout.com/a-how-to-play-football-manager-online-without-hamachi.html) ·
  [Clash Royale ganha o silenciar emotes](https://toucharcade.com/2016/09/19/clash-royale-update-adds-emote-mutenew-tournaments-cards-and-more/) ·
  [Rocket League: "Chat disabled for 3 seconds"](https://knowyourmeme.com/memes/chat-disabled-for-3-seconds)

## Decidido com o Miguel (17/10, depois da pesquisa)

- **Tudo na 0.8.5, completo:** duelo com os dois drafts (Disputa e cada um com seus pacotes) e todas as velocidades,
  inclusive Lances. Nada fatiado pra 0.8.6.
- Tocar num Pokémon abre o painel **sem pausar** a partida.
- Se alguém cair, a IA técnica decide por ele até voltar.
- Grito do capitão no máximo a cada 10 s.
- Histórico do amistoso só no save de cada um (sem tabela nova).
- Seed por trecho e W.O.: o Miguel pediu explicação. O que ele quer: as duas telas vendo a partida ao mesmo tempo e
  nenhum jeito de burlar.
