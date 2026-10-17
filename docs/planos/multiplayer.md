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

## Perguntas para o Miguel

1. Draft do duelo: snake (disputa pela carta) ou cada um com seus pacotes?
2. Velocidade: fixa na sala ou dá pra pedir troca no meio?
3. Duelo amistoso precisa de conta (Google) ou entra qualquer um pelo link?
4. Emotes no duelo: quais (comemorar, provocar, "boa!")? Sempre desenhados, sem emoji.
