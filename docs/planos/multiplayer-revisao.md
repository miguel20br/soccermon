# Revisão do duelo ao vivo (17/10/2026)

Revisão crítica do desenho em `multiplayer.md` (decisões, "Pesquisa técnica (17/10)" e o que foi decidido depois),
comparando com jogos que já resolveram o mesmo problema. A pergunta do Miguel: o duelo está saindo **leve, rápido,
fácil de construir e manter, sem servidor pago e difícil de burlar**? Só leitura: nada de código mexido.

## Resumo

- **O caminho está certo.** Lockstep com atraso, só ordens trafegando, Supabase Realtime de transporte e seed por
  trecho com lacre é exatamente o que os jogos de referência fazem (Age of Empires, Factorio, Photon Quantum) e
  cabe no plano grátis com folga.
- **O maior buraco não é "ver o futuro", é o time.** No modo **Time pronto** cada um manda o próprio time, tirado
  do save, que qualquer um edita no DevTools (nível, edição especial +2 em tudo, golpes, item). O outro navegador
  simula esse time sem conferir. Foi assim que o Hearthstone Duels quebrou em 2024. Precisa de um validador.
- **Faltam 3 coisas pequenas no protocolo, e é melhor fazer antes da rede ficar pronta:** a ordem identificada
  por quem mandou (e não pelo número do host); mensagem inválida é ignorada, nunca vira acusação de trapaça; e um
  "registro do duelo" único, que serve de entrada pro servidor do ranqueado.
- **Os drafts têm o mesmo problema do "ver o futuro":** com a mesma seed, um jogo modificado vê todos os pacotes
  que ainda vão sair. A solução é a mesma cadeia de lacres, com uma seed por rodada.
- **Dá pra cortar** a "IA técnica enquanto alguém está fora": com o lacre, a partida para no fim do trecho de
  qualquer jogo, então a IA só jogaria alguns segundos.

## O que dá pra burlar num jogo de técnico (o modelo de ameaça)

No Soccermon os dois navegadores calculam a partida inteira. Num RTS isso abre o **map hack**: o cliente tem o
estado do mapa todo e o programa só desliga a névoa (o Kartograph, de Stanford, fazia isso em StarCraft lendo a
memória). **No nosso caso não existe map hack na partida**, porque a quadra inteira já aparece pros dois. O que
fica escondido é pouco, e é aí que um jogo modificado pode tirar vantagem:

1. **O futuro** (a seed): simular o resto e testar todas as táticas.
2. **As cartas que ainda vão sair** no draft (as duas modalidades).
3. **As escolhas do rival** em "Cada um com seus pacotes" e os ajustes dele no team preview.
4. **As entradas que o próprio cliente informa**: o time (Time pronto), o carimbo das ordens (host), o resultado no
   save.

Quem trapaceia num amistoso é o rival, com o DevTools aberto. Pra nós, um terceiro na sala pode **atrapalhar**,
mas não ganhar nada.

## 1. Lockstep determinístico: o que os outros aprenderam

| Jogo / sistema | Como faz | O que vale pra nós |
|---|---|---|
| **Age of Empires 1/2** ("1500 archers on a 28.8") | Lockstep: só os comandos trafegam, valem 2 "turnos" à frente. Mandar a posição das unidades limitaria a 250 unidades num modem 28.8 | Igual ao nosso `leadTicks`. O alerta deles: o **out of sync** foi o bug que mais durou, porque diferenças minúsculas crescem com o tempo |
| **Factorio** | Lockstep a 60 Hz. Checagem de CRC parcial (jogador, contagem de entidades) em todo tick; no modo de depuração, CRC do mapa inteiro e um save por tick pra comparar. Ao dessincronizar, o cliente reconecta e baixa o mapa de novo, e o jogo grava um **relatório de dessincronização** pro jogador mandar | O nosso hash por trecho é o CRC deles. Falta o relatório: guardar as entradas do duelo (times, segredos, ordens) pra reproduzir o bug no PC |
| **StarCraft** | Lockstep, cada cliente com o estado inteiro → map hack (Kartograph). A solução acadêmica (OpenConflict) custa 22 ms por atualização | Pra nós não existe névoa na quadra. O nosso "map hack" é ver o futuro e os pacotes |
| **0 A.D.** (Wildfire Games) | A simulação recebe o cliente como não confiável e só garante que cada comando vem associado ao jogador que mandou | A ordem tem que dizer **de quem é** (time + seq), e não depender de quem repassou |
| **Photon Quantum** | Cada cliente roda tudo e só troca entradas. A documentação admite que "segredos controlados pelo cliente num jogo de cartas e névoa são fáceis de hackear", que os dados de configuração do jogador vindos do cliente são "completamente desprotegidos" e que checksum **não serve** pra pegar trapaceiro ao vivo (é pra bug). O caminho que eles recomendam pra resultado confiável é em degraus: o cliente informa → webhook → **ressimular as entradas no servidor** → servidor próprio | É o nosso plano, degrau por degrau: amistoso (o cliente informa) → ranqueado com Edge Function ressimulando. E confirma que time e config vindos do cliente precisam de validação |

**Entrar no meio:** o Factorio manda o mapa inteiro. O nosso equivalente (pedir `{times, log, segredos, tick}` e
ressimular) já está no plano e é bem mais barato, porque a partida inteira cabe em ~3 KB de entrada.

## 2. Cartas, auto-battler e gerenciamento online

| Jogo | Quem calcula | O que o cliente vê | Como evitam trapaça |
|---|---|---|---|
| **Pokémon Showdown** | O servidor (Node) roda a batalha. O cliente manda só a escolha (`move 1`, `switch 2`, `team 123` no team preview) | Só o próprio time (`|request|`); do rival, só o que foi revelado (HP em %) | Um **validador de time** separado do simulador, que confere o time inteiro contra as regras do formato antes da batalha |
| **Hearthstone** | O servidor (compra, embaralhamento) | A mão do rival nunca chega ao cliente | Em 2024 o **Duels** foi tirado do ar: o servidor aceitava baralhos sem conferir, e ferramentas de terceiros mandaram baralhos impossíveis. Teve banimento e compensação aos prejudicados |
| **Lichess** | O servidor valida cada lance | Tudo (xadrez não tem nada escondido) | A trapaça é usar motor por fora. Detecção estatística (Irwin, Kaladin) com moderador humano. Pra nós vale a ideia de que dá pra **detectar depois** em vez de impedir tudo |
| **Super Auto Pets, TFT, Battlegrounds** | Combate calculado uma vez; Arena do SAP usa times "fantasmas" de outros jogadores | Fases com cronômetro: compra e montagem, depois o combate | A fase acaba quando todos dão "pronto" ou o tempo esgota. É o desenho do nosso intervalo e do draft |
| **Hattrick / Battrick** | O servidor simula na hora marcada | As ordens ficam travadas antes (no Battrick, 20 min antes); sem ordem, entra a padrão | Nada ao vivo: o servidor tem tudo. É o nosso futuro ranqueado assíncrono (fantasmas) |
| **Clash Royale** | Não achei fonte oficial. Blogs dizem lockstep só com entradas, mas não dá pra confirmar | | |

**Conclusão:** quem tem servidor faz tudo nele (Showdown, Hearthstone). Quem não quer pagar servidor por partida
faz como o Quantum: cada cliente calcula, e **um juiz confere depois**, ressimulando as entradas. É exatamente o
plano (amistoso sem juiz, ranqueado com a Edge Function). O que todos fazem, com ou sem servidor: **validar o
time/baralho antes**. Isso falta no nosso desenho.

## 3. Informação escondida: o que o lacre resolve e o que sobra

### 3.1 Ver o futuro na partida: a cadeia de lacres resolve

Contas com o motor de hoje (`halfSeconds: 180`, 20 Hz → 7.200 ticks; trecho de 360 ticks = 9 s na tela a 2x,
4,5 s a 4x; `leadTicks` = 80 a 2x e 160 a 4x):

- Quem revela `x[k+1]` ao **entrar** no trecho k deixa o trapaceiro ver no máximo de 360 a 720 ticks à frente. Uma
  ordem dada agora vale daqui a 80 ou 160 ticks, então ele enxerga as consequências dela por 200 a 640 ticks.
- Com **3 trocas de tática** e poucas substituições, o ganho é escolher o melhor momento pra 3 ou 4 decisões.
  Pequeno, e só pra quem modificou o jogo. Bom o bastante pro amistoso.
- Se um dia incomodar, dá pra revelar `x[k+1]` só **no meio** do trecho k (a janela cai pra no máximo 540 ticks e
  ainda sobram 2,2 s de folga a 4x). Não precisa agora.
- **Último a revelar:** quem revela por último sempre pode ver a seed e desistir. É a fraqueza conhecida de todo
  compromisso e revelação (a especificação do Tor diz isso com essas palavras). Mas ele não escolhe a seed: só
  escolhe entre "segue" e "abandona". Como abandonar = W.O., não ganha nada.
- **Lacre do host visto antes:** tanto faz. `x[0]` é um hash e não diz nada de `x[k]`, e a cadeia de cada um já
  está fixa quando ele manda `x[0]`.

### 3.2 Os drafts: o mesmo problema, a mesma solução

`draftOptions`/`playerDraftOptions` (`src/engine/draft.ts`) puxam números de um `Rng` que vai sendo consumido.
Se esse `Rng` sai da seed da sala, **um jogo modificado calcula todos os pacotes futuros**:

- **Disputa:** vê as 4 cartas de todas as rodadas que faltam e planeja ("não pego goleiro agora, porque na
  rodada 5 vem o Lapras"). O honesto não tem como saber.
- **Cada um com seus pacotes:** como as opções dependem da vaga escolhida e do `taken`, ele percorre a árvore
  inteira e escolhe o melhor caminho de 7 escolhas.

Solução: **a mesma cadeia de lacres, com uma seed por rodada**. A rodada r usa
`H(sala | 'draft' | r | xA[r] | xB[r])` e o trecho k da partida usa os elementos depois desses (a cadeia só fica
mais comprida, 7 ou 8 rodadas + 21 trechos). Pra isso, o draft precisa ser uma função pura da seed da rodada
(`opções = f(seedRodada, vaga, taken)`, um `new Rng(seedRodada)` por chamada). Isso tem um bônus: depois do draft,
qualquer um **confere** se cada carta do rival saiu mesmo de um pacote dele.

Consequência em **Cada um com seus pacotes**: a seed da rodada r precisa do segredo dos dois, então os dois
jogadores andam no mesmo compasso (o mais rápido espera o outro, no máximo os 20 s da escolha). É o desenho de
fases do SAP/TFT ("rodada acaba quando os dois escolheram ou o tempo esgota"). E aí **as duas modalidades viram
o mesmo laço**: revela a seed, cada um escolhe, manda. Na Disputa a escolha vai aberta; no Cada um vai lacrada.
Um código só.

### 3.3 Escolhas do rival escondidas (Cada um) e o team preview

Sem servidor, "simultâneo e escondido" só existe com lacre. Se cada um só mostra o time no fim, **quem abre por
último vê o time do outro e pode montar outro time** (qualquer caminho válido dos pacotes dele). Correção barata:

- Cada escolha sai **lacrada** junto com o progresso: `{rodada, lacre: SHA-256(sal | escolhas até aqui)}`. No fim,
  os dois abrem; quem recebe confere o lacre de cada rodada e se a carta estava no pacote (§3.2).
- **Team preview de 30 s:** formação, tática e capitão também vão lacrados, e os dois abrem juntos quando os dois
  mandaram (ou o tempo acabou). Sem isso, quem confirma por último ajusta contra o outro.
- Um ajudante só, `lacrar(obj)` / `abrir(obj, sal, lacre)` (~20 linhas com `crypto.subtle`), usado nos 3 lugares.

### 3.4 Time pronto: o buraco maior

Hoje o `PokemonInstance` do save carrega `level`, `moves`, `ability`, `item`, `special` (+2 em todos os atributos),
`taught`, `evo` e `inherited`. **Tudo isso vem do cliente.** Um time com 5 Mewtwo nível 100, todos edição Ícone,
com os melhores golpes, é uma linha no console. O navegador do rival simula esse time sem perguntar nada. É o caso
do Hearthstone Duels.

Correção, no estilo do validador do Showdown:

- Mandar só a **receita** (espécie, golpes ensinados, habilidade, item, edição, shiny, vaga) e **recalcular** o
  resto com o motor (`computeAttributes`, `defaultMoveset`), em vez de aceitar números prontos.
- `validarTimeDuelo(time) → lista de problemas`: espécie entre as 151, `level === DEFAULT_LEVEL`, habilidade da
  espécie, golpe ensinado só de MT que existe (`tm.ts`) e que a espécie aprende, item da lista, tamanho do elenco e
  do banco, sem espécie repetida, no máximo N edições especiais. Quem recebe um time inválido vê "time inválido" e
  a sala não começa.
- O mesmo arquivo roda na Edge Function do ranqueado. Fica em `src/engine/` (sem DOM).
- Mesmo validado, Time pronto vira "qualquer time que as regras permitem", como no Showdown: é justo num
  amistoso, mas **não deve contar no ranqueado**. No ranqueado vale draft ou time que o servidor viu nascer.

### 3.5 Os outros vetores

| Vetor | O desenho atual cobre? | Mitigação mais barata |
|---|---|---|
| **Host atrasa ou some com a ordem do convidado** (carimba um tick bem depois, ou nunca carimba) | Não | O pedido do convidado leva o tick dele (`pedidoNoTick`). Quando a ordem carimbada volta, ele confere `tick ≤ pedidoNoTick + lead + tolerância`. Se não voltar em ~2 s, reenvia. Se o host insistir, aparece aviso e analytics |
| **Host inventa ordem do convidado** | Não | O convidado sabe as ordens que mandou: uma ordem "dele" que ele não mandou no log é sinal de host modificado → aviso |
| **Ordem no passado** (o host carimba a própria ordem pra valer já, sem o `lead`, reagindo a um contra-ataque) | Não | Toda ordem recebida tem que ter `tick ≥ meuTick + lead − tolerância` (tolerância ~20 ticks, que cobre o ±0,5 s do relógio). Fora disso: ignorar e avisar. O motor também precisa ignorar ordem impossível de um jeito determinístico (limite de 3 táticas, substituição ilegal: o `applyPendingSubs` já ignora) |
| **Host atrasa/acelera o relógio** | Em parte (velocidade só com aceite) | Só incomoda, não dá vantagem: o futuro continua lacrado. Nada a fazer |
| **Ver a ordem do rival ~2 s antes de valer** | Por desenho ("o rival vê a troca") | Ele reage com o próprio `lead`, então ganha uns 2 s. Irrelevante |
| **Desconectar quando está perdendo** | Sim (W.O.) | No amistoso não tem prêmio, então desistir não rende nada. No ranqueado, o servidor dá o W.O. com a prova (os segredos revelados até ali conferem com o `x[0]`) |
| **Falsificar o resultado no save / histórico** | Aceito no amistoso | O save já é escrito pelo próprio jogador (RLS deixa cada um escrever o seu). Regra pra não esquecer: **o histórico do amistoso nunca alimenta ranking, Hall da Fama, raridade ou recordes públicos**. Ranqueado: placar só do servidor, numa tabela que o cliente não escreve |
| **Terceiro na sala** (o link foi parar num grupo) mandando mensagem falsa | Não (o "sala cheia" é só educação do cliente) | O Broadcast **não diz quem mandou**: qualquer logado no canal manda o que quiser. Regra: **mensagem inválida é ignorada, nunca acusa ninguém** (uma revelação que não confere vem de um intruso, e a verdadeira ainda vai chegar). Senão um intruso consegue um W.O. falso. Divergência mesmo só pelo hash do trecho. Assinar mensagens (chave ECDSA por sala, trocada no "pronto") só se aparecer gente atrapalhando de propósito. Ranqueado: RLS do canal com tabela de membros da sala |
| **Inundar com emote** | Sim (limite também no recebimento) | Ok |
| **Jogar "por fora" com outro programa** (o Lichess sofre com motor de xadrez) | Não se aplica | Só seria útil pra quem enxerga o futuro, e isso o lacre já limita |

### 3.6 Conflito: IA técnica enquanto alguém está fora × lacre

Com a seed por trecho, **a partida não passa do fim do trecho sem o segredo de quem caiu**. Então a "IA técnica
decide por ele" funciona por no máximo 4,5 a 18 s de tela, e quase nunca troca alguém nesse tempo. O próprio
desenho já reconhece isso ("vai até o fim do trecho e espera"). **Proposta: cortar a IA técnica.** Quem caiu fica
com a tática que tinha, e o time joga normalmente (a IA dos jogadores continua). Se ficar, ela precisa ser uma
**ordem registrada no log** ("time 1 no automático a partir do tick N", que desliga o `manualSubs`), nunca uma
decisão local de cada navegador. Senão as duas partidas se separam.

## 4. Transporte

| | **Supabase Realtime (Broadcast)** | **WebRTC P2P (Trystero)** | **Cloudflare Durable Object** | **Edge Function do Supabase** |
|---|---|---|---|---|
| Custo | Grátis: 200 conexões, 100 msg/s, 2 mi msg/mês, 256 KB por mensagem | Grátis sem TURN; com TURN, Cloudflare (credencial sai de servidor) ou Open Relay | Grátis: 100 mil requisições/dia, 13.000 GB-s/dia, mensagem de WebSocket conta 1/20 | Grátis: 2 s de CPU por chamada, 150 s de relógio, 256 MB |
| Latência | ida e volta até a região do projeto (~120–150 ms do Brasil) | direto (~20–80 ms) | borda perto do jogador | uma chamada por partida, não importa |
| Celular / segundo plano | O socket cai em silêncio com a aba em segundo plano (os timers são freados). O Supabase recomenda `heartbeatCallback` e `worker: true` (batimento num Web Worker) | O ICE cai junto e precisa renegociar | O mesmo problema de WebSocket | — |
| Privacidade | o rival não vê seu IP | **o rival vê seu IP público** (RFC 8828), a não ser com TURN forçado | não expõe IP | — |
| Garantia de entrega | **Melhor esforço**: sem fila, sem repetição, não promete ordem; `ack: true` só confirma que o *servidor* recebeu; o Replay só vale pra mensagem vinda do banco | o canal de dados pode ser confiável e em ordem | o código é nosso | — |
| Dá pra rodar a partida? | — | — | Não no grátis: o Worker grátis tem **10 ms de CPU** por requisição | **Sim**: 0,1–0,5 s cabe nos 2 s |
| Peso pra manter | já temos `supabase-js` | dependência + TURN + mais casos de erro | outra plataforma, `wrangler`, conferir o JWT do Supabase lá dentro | já temos |

**Recomendação: fica o Supabase Realtime**, como no plano. Público jovem + IP exposto é um bom motivo extra pra
não ir de P2P. O Durable Object só vale se a cota do Realtime estourar de verdade (aí ele vira o "juiz" da sala,
guardando as seeds), e mesmo assim não roda a partida no grátis. A Edge Function é o lugar certo do ranqueado.

O que o "melhor esforço" exige do protocolo (pouco código, mas tem que estar lá desde o começo):

- Toda mensagem leva `seq` de quem mandou. Quem vê um buraco pede de novo (`reenvia desde N`). Quem pede recebe
  o pedaço do log; mensagem repetida não faz nada (aplicar duas vezes = aplicar uma).
- `ack: true` nas mensagens importantes (ordem, revelação, escolha, pronto). Heartbeat e emote vão sem.
- `worker: true` + `heartbeatCallback` + no `visibilitychange` (voltou pra aba) reconectar e pedir o que perdeu.
  É o caso do WhatsApp.
- **Abrir o socket só na tela do duelo** e fechar ao sair. As 200 conexões ao mesmo tempo dão 100 duelos
  simultâneos. Um canal "global" de presença gastaria isso com quem só está no menu.

## 5. Peso: o que cortar e o que deixar pronto pro ranqueado

### Dá pra cortar ou adiar sem perder segurança que importa

- **IA técnica enquanto fora** (§3.6): cortar.
- **Assinatura de mensagens**: adiar. Ignorar mensagem inválida já resolve o amistoso.
- **Trystero / Durable Object**: não construir. A interface `send/on` com `BroadcastChannel` (duas abas) já deixa a
  porta aberta.
- **Ressimular a partida inteira a cada ordem** num celular fraco: só mexer se medir lento. Se for o caso, o
  remédio barato é guardar o estado no começo de cada trecho (a seed é renovada ali, então é um ponto natural) e
  ressimular só a partir dele.
- **Revelar no meio do trecho** (§3.1): adiar.

### Tem que ficar como está (é barato e é o que segura o resto)

- Teste de hash em 3 navegadores + aperto de mão do motor (já feito na etapa 1: `dmath.ts`, `determinism.test.ts`).
- Hash curto por trecho: dá pra mandar na mesma mensagem da revelação, sem mensagem a mais.
- Cadeia de lacres, agora cobrindo o draft também.
- Limite de trocas e validade das ordens **no motor** (hoje `MAX_TACTIC_CHANGES` está só em `Match.tsx` e o
  `LiveRunner` aplica qualquer ordem que chega).

### O contrato do ranqueado (fazer agora, enquanto é barato)

No ranqueado a Edge Function recebe as entradas e ressimula. Se o amistoso já produzir **exatamente essas
entradas**, o ranqueado vira "gravar e conferir", sem reescrever a sala. Esse formato também serve de relatório de
dessincronização (como no Factorio) e pro replay de "melhores momentos":

```ts
interface RegistroDuelo {
  engineVersion: number;
  sala: string;
  modo: 'pronto' | 'disputa' | 'pacotes';
  config: { velocidadeInicial: Speed };            // só o que muda a partida
  times: [ReceitaTime, ReceitaTime];               // receitas (§3.4), nunca atributos prontos
  escolhas?: [Escolha[], Escolha[]];               // draft: por rodada, conferível com as seeds
  segredos: [string, string];                      // x[N] de cada um (ou o pedaço revelado, se alguém sumiu)
  ordens: [OrdemDuelo[], OrdemDuelo[]];            // separadas POR AUTOR
}
// OrdemDuelo = MatchOrder + { seq: number }   (seq por time; ordem no motor = (tick, time, seq))
```

Dois detalhes que mudam o desenho atual:

1. **A ordem pertence a quem a deu.** O host pode continuar carimbando o *tick* (é o relógio), mas a identidade é
   `(time, seq do time)` e o motor ordena por `(tick, time, seq)`, não por um número global do host. No
   ranqueado, cada jogador manda as **próprias** ordens pro servidor (uma linha numa tabela com RLS por
   `auth.uid()`, que prova o autor e a hora). Assim, nem o host nem quem subiu o registro consegue inventar ordem
   do outro.
2. **Ranqueado = 3 peças, nenhuma reescrita:** (a) tabela `duelos` onde cada um registra o próprio `x[0]` antes do
   pontapé e as próprias ordens durante; (b) Edge Function que confere cadeias, escolhas, times e ordens e roda
   `runMatch`; (c) RLS do canal amarrada aos dois membros da sala. O Broadcast continua levando relógio, emotes e o
   espelho das ordens pra tela.

## Conclusão

### Veredito

**Sim, o caminho está certo**, e está mais perto do que os jogos de referência fazem do que parecia: lockstep com
atraso (AoE), checagem por hash (Factorio), cada cliente calcula e um juiz ressimula depois (Quantum), fases com
cronômetro (SAP/TFT). É leve (~3 KB de entrada por partida, ~500 mensagens por duelo), não custa nada e não pede
servidor no amistoso. O que falta é **validação das entradas** (time, ordens, mensagens) e **estender o lacre ao
draft**. São coisas pequenas, mas mexem no formato das mensagens, então é melhor fazer antes da rede ficar pronta.

### Mudar já (antes do outro agente fechar a rede)

1. **Ordem com autor:** `OrdemDuelo = MatchOrder + seq por time`; o `LiveRunner` ordena por `(tick, time, seq)`; o
   host só põe o tick. O convidado confere as próprias ordens (não sumiu, não atrasou demais, nenhuma inventada).
2. **Janela de ordens** nos dois lados (`tick ≥ meuTick + lead − tolerância`) e limite de trocas validado no motor.
3. **Mensagem inválida = ignorar.** Só o hash do trecho divergente mostra erro. Nada de W.O. ou "trapaça" por uma
   mensagem que qualquer um no canal poderia ter mandado.
4. **`seq` + pedido de reenvio + `ack`** nas mensagens importantes; `worker: true` + `heartbeatCallback`; socket só
   na tela do duelo.
5. **`RegistroDuelo`** gravado no fim (no save) com tudo o que a partida precisa pra ser refeita.
6. **Time pronto com receita + `validarTimeDuelo`** em `src/engine/` (o mesmo código vai pra Edge Function).
7. **Draft como função pura da seed da rodada** e a cadeia de lacres cobrindo as rodadas. Os dois modos de draft
   num laço só (Disputa aberta, Cada um lacrado), com `lacrar/abrir` também no team preview.

### Pode esperar

Assinatura de mensagens, revelar no meio do trecho, ressimular a partir do trecho, Trystero, Durable Object, a
tabela `duelos` e a Edge Function (0.8.6+).

### Riscos, do mais grave ao menos grave

| # | Risco | Mitigação mais barata |
|---|---|---|
| 1 | **Time pronto com save editado** (5 lendários nível 100 com +2 em tudo): estraga o modo na primeira semana | Receita + `validarTimeDuelo` (§3.4) |
| 2 | **Dessincronização por algo fora do motor** (a tela influenciando a simulação, ordem de chegada de mensagem, `Lances`/câmera lenta mexendo em tick) | Ordem só por `(tick, time, seq)`; hash por trecho; `RegistroDuelo` pra reproduzir no PC; teste Playwright com 2 páginas |
| 3 | **Celular em segundo plano** derrubando o socket no meio da partida e virando W.O. entre amigos | `worker: true`, reconectar no `visibilitychange`, pedir o que perdeu; W.O. só quando quem ficou apertar (decisão 3) |
| 4 | **Ver os pacotes futuros** no draft | Seed por rodada na mesma cadeia (§3.2) |
| 5 | **Host abusando do carimbo** (atrasar, inventar, ordem sem `lead`) | Conferência do convidado + janela de ordens (§3.5) |
| 6 | **Intruso na sala** forjando mensagem e causando W.O. falso ou dessincronização | Ignorar mensagem inválida; código de 6 caracteres (32^6, ~1 bilhão de combinações); assinar só se precisar |
| 7 | **Escopo**: tudo na 0.8.5 (Lances sincronizado + Disputa + Cada um) | Os dois drafts num laço só; no Lances, o convidado **pula** pro tick do host em vez de acelerar ±10% (lá a velocidade dá saltos) |
| 8 | **Cota e pausa do Supabase** | ~500 msg/duelo → milhares por mês; socket só no duelo; o Supabase avisa antes de cortar |
| 9 | **Ressimular a partida inteira** a cada ordem do rival num celular fraco | Medir; se precisar, estado salvo no começo de cada trecho |

### Decisões pro Miguel

1. **Time pronto: o que é um time legal?** Nível 50, sem espécie repetida, golpes só da espécie ou de MT, no
   máximo N edições especiais (quanto é N?). *(Recomendo: "qualquer time que uma copa poderia dar", validado, e Time
   pronto fora do ranqueado.)*
2. **IA técnica pra quem caiu:** cortar, já que o lacre para a partida no fim do trecho? *(Recomendo cortar: quem
   caiu fica com a tática que tinha.)*
3. **W.O. no amistoso:** automático em 60 s, ou só quando quem ficou apertar "encerrar" (com "esperar mais"
   sempre disponível)? *(Recomendo o botão: é amistoso, e o caso comum é o amigo que foi no WhatsApp.)*
4. **Cada um com seus pacotes em compasso:** os dois andam rodada a rodada (o mais rápido espera até 20 s) pra
   cada rodada ter seed nova e ninguém ver os pacotes futuros? *(Recomendo sim; é o mesmo laço da Disputa.)*
5. **Team preview lacrado:** formação, tática e capitão abrem juntos pros dois? *(Recomendo sim; senão quem confirma
   por último ajusta contra o outro.)*
6. **Carimbo das ordens:** fica com o host (como está), mas com autor + conferência do convidado? *(Recomendo sim; é
   o menor passo, e encaixa no ranqueado sem refazer.)*

## Fontes

- Lockstep: [1500 Archers on a 28.8 (Age of Empires)](https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond) ·
  [Factorio FFF #47: CRC fun](https://factorio.com/blog/post/fff-47) ·
  [Factorio FFF #55: MP preview](https://factorio.com/blog/post/fff-55) ·
  [Factorio FFF #76: MP inside out](https://factorio.com/blog/post/fff-76) ·
  [Factorio FFF #188: Bug, Bug, Desync](https://factorio.com/blog/post/fff-188) ·
  [0 A.D.: requisitos da simulação](https://trac.wildfiregames.com/wiki/SimulationRequirements) ·
  [Photon Quantum: Cheat Protection](https://doc.photonengine.com/quantum/current/manual/cheat-protection) ·
  [Stanford: Kartograph e OpenConflict (map hack)](https://crypto.stanford.edu/~dabo/pubs/abstracts/onlinegames.html) ·
  [Bishop Fox: cheating at online video games](https://bishopfox.com/blog/cheating-at-online-video-games-part-1) ·
  [Gaffer On Games: Deterministic Lockstep](https://gafferongames.com/post/deterministic_lockstep/)
- Cartas e gerenciamento: [Pokémon Showdown: SIM-PROTOCOL](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md) ·
  [Pokémon Showdown: TEAMS.md (validador separado)](https://github.com/smogon/pokemon-showdown/blob/262160e8e3b36473732b88a198ed8981dbd37668/sim/TEAMS.md) ·
  [Hearthstone: banimentos no Heroic Duels](https://www.hearthstonetopdecks.com/bans-for-exploiting-heroic-duels-10-tavern-tickets-as-compensation-for-affected-players/) ·
  [Fórum da Blizzard: 28.4 Duels exploiting](https://us.forums.blizzard.com/en/hearthstone/t/284-account-bans-for-duels-exploiting/119501?page=3) ·
  [Lichess: Kaladin](https://lichess.org/blog/YulPhhAAACAAvm1f/lichess-half-year-update-new-feature-sneak-preview) ·
  [Super Auto Pets: The Basics](https://superautopets.wiki.gg/wiki/The_Basics) ·
  [Super Auto Pets (Wikipedia)](https://en.wikipedia.org/wiki/Super_Auto_Pets) ·
  [Battrick: prazo das ordens](https://www.battrick.org/nl/rules.asp?item=16)
- Compromisso e revelação: [Tor SRV: análise de segurança (último a revelar)](https://spec.torproject.org/srv-spec/security-analysis.html) ·
  [Chainlink: commit and reveal](https://chain.link/article/commit-and-reveal-schemes)
- Transporte: [Supabase Realtime: limites](https://supabase.com/docs/guides/realtime/limits) ·
  [Supabase Broadcast (`ack`, `self`, Replay)](https://supabase.com/docs/guides/realtime/broadcast) ·
  [Supabase: desconexão silenciosa em segundo plano](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) ·
  [Supabase: Realtime é "best effort"](https://supabase.com/blog/realtime-or-pipelines-how-to-choose-the-right-tool) ·
  [Supabase Edge Functions: limites](https://supabase.com/docs/guides/functions/limits) ·
  [Cloudflare Durable Objects: preços](https://developers.cloudflare.com/durable-objects/platform/pricing/) ·
  [Cloudflare Workers: limites (10 ms de CPU no grátis)](https://developers.cloudflare.com/workers/platform/limits) ·
  [RFC 8828: IP no WebRTC](https://www.rfc-editor.org/rfc/rfc8828.html) ·
  [Trystero](https://github.com/dmotz/trystero)

## Decidido com o Miguel (17/10)

Todas as recomendações:
1. Time pronto vale qualquer time que uma copa poderia dar, conferido por `validarTimeDuelo`, e fica fora do ranqueado.
2. Sem IA técnica pra quem caiu (substitui a decisão anterior).
3. W.O. no amistoso só pelo botão de quem ficou (substitui o W.O. automático em 60 s).
4. "Cada um com seus pacotes" anda rodada a rodada junto com o rival.
5. Team preview lacrado: os dois revelam juntos.
6. O host carimba o tick e o convidado confere as próprias ordens.
