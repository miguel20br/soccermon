# Pesquisa: UX que os jogadores pediram (19/10/2026, rodada 0.8.8)

Pedido do Miguel com sugestões de jogadores: evolução do rival, tática mais intuitiva, tirar o "ir pra prancheta",
textos mais fáceis, gritos esquisitos, "pronto" que dá pra desfazer, resultado sozinho no fim, mensagem da troca no
intervalo e o jogo mais fluido no geral. **Só pesquisa: nenhum código do jogo mudou.**

Prints, mockups e roteiros ficaram fora do repo, em
`/tmp/claude-1000/-home-bartolomeu-Projects-soccermon/e1939d5f-03fc-4882-9c76-204a383245a2/scratchpad/088/ux/`
(daqui pra baixo, `ux/`): `ux/prints/` (percurso), `ux/mockups/*.png` (propostas), `ux/*.cjs` (roteiros
Playwright pra refazer), `ux/cries.json` (medidas dos gritos). A página dos gritos está em
`~/Downloads/soccermon-gritos/index.html`.

## Resumo

1. A evolução do rival **já existe** (0.8.6), mas passa batida: 1,5 s, silhueta pequena e uma faixa "RIVAL EVOLUIU!"
   no mesmo canto do gol. A narração diz "Koffing está evoluindo… virou Weezing!" sem dizer de quem é.
2. Aba Tática: as 4 peças funcionam, mas os subtítulos são jargão ("meio-termo", "bloco baixo", "pivô na frente"),
   o efeito só aparece no `title` (no celular ninguém vê) e a 320 px o Substituir fica abaixo da dobra.
3. "Ir pra prancheta" = o botão **Mudar prancheta** do intervalo e do pedido de tempo. Ele só troca de aba. Dá pra
   tirar sem perder nada. A dica do escanteio ainda diz "dá pra mudar 3 vezes", o que não vale mais desde a 0.8.6.
4. Gritos: nenhum arquivo está quebrado (sem silêncio, sem corte, pico normal). O "esquisito" vem de três coisas:
   gritos muito curtos ou longos, volume desigual (até 10 dB de diferença no estilo Novo) e o tom mudado dos emotes
   do Duelo (0,75x a 1,3x). A página de audição tem os 151 nos dois estilos pro Miguel marcar.
5. Duelo, "pronto": a sala já deixa desfazer ("Esperar"). Escalação, escolha de time, rodada de pacotes, intervalo e
   revanche **não deixam**. No intervalo o "pronto" nem muda o botão, e o rival não fica sabendo.
6. Fim de jogo: o botão "Ver resultado" aparece 0,6 a 1,4 s depois do apito e fica esperando o toque. Dá pra ir
   sozinho em ~3 s com o botão enchendo, e um toque na quadra segura.
7. Troca no intervalo: a mensagem "Substituição na próxima saída de bola" fica numa caixa embaixo do painel (no
   celular, fora da tela). Pior: **só cabe 1 troca por intervalo** (o Substituir desliga até a bola rolar).
8. No geral, o fluxo é curto: a Copa manual leva ~38 toques do Home até a escalação da 2ª partida. Os maiores atritos são o aviso
   "Treinador novo" cobrindo o topo de 3 telas, a Tática fora da dobra no desktop 1440x900 e textos longos na
   recompensa e no Perfil (511 palavras visíveis).
9. Ganhos rápidos: 14 itens de até meio dia cada (lista abaixo). Mudanças maiores: 6.
10. Decisões pro Miguel no fim, em questionário, com a recomendação primeiro.

## Como foi o percurso

Servidor de dev local, Playwright headless, PT-BR. A Copa foi feita na mão a 390x844 (formação, capitão, draft de
7, escalação, VERSUS, partida em 1x→8x **sem pular**, troca no intervalo, apito, resultado, recompensa) e no "Monta
pra mim" a 320x568, 844x390 e 1440x900. O Duelo local foi feito em duas abas (`?local=1`): A 390x844 anfitrião,
B 844x390 convidado, Disputa, 8x, curta. A evolução do rival saiu do `?demo=evolucao&rival=1` a 390 e deitado.
Nenhum erro de console em nenhum percurso, e nada de rolagem lateral.

| Etapa (Copa, 390, na mão) | Toques | Observação |
|---|---:|---|
| Passo a passo de boas-vindas | 6 (ou 1 com Pular) | 6 páginas |
| Home → Nova copa | 1 | |
| Formação | 1 | |
| Capitão (pacote + escolher + vaga) | ~3 | |
| Draft (6 vagas) | 20 | ~3 por vaga: abrir pacote, Escalar, tocar na vaga |
| Escalação → Jogar | 1 | |
| VERSUS → Começar | 1 | espera de 0,7 a 2 s com "Carregando a quadra…" |
| Partida (abas) | 3 | |
| Intervalo com 1 troca | 4 | Substituir, quem sai, quem entra, Começar o 2º tempo |
| Fim → Ver resultado | 1 | o botão aparece 0,6 a 1,4 s depois do apito |
| Resultado → Escolher recompensa | 1 | |
| Recompensa | 4 | pacote, escolher, pular |

Duelo (por pessoa): criar sala 4, sala 1, draft 14, escalação 1, intervalo 1, fim 1.

Palavras visíveis por tela (390): Home 180, formação 171, escalação 211, intervalo 94, resultado 226, recompensa
141, Configurações 295, **Perfil 511**. A partida fica em ~40 (bom).

---

## 1. Evolução do Pokémon adversário

**O que já existe** (`src/game/evolution-view.ts`, `MatchScene.rivalEvolution`): na Copa a quadra segura 1,5 s
(`RIVAL_EVO_MS`) e o Pokémon do rival pisca em silhueta branca com um brilho na cor do time. Na troca sobe a faixa
"RIVAL EVOLUIU!" no canto do rival, com rosto antigo → novo, por 2,6 s (`MatchHighlight`). No Duelo a quadra segura
9,5 s (`DUEL_EVO_HOLD_MS`), o tempo da tela cheia do outro lado. A caixa de batalha diz "O quê? Koffing deles está
evoluindo!" e "Cuidado! Koffing deles evoluiu para Weezing!".

**O problema visto** (`ux/prints/evo-rival-390-tira.png`, frames em `ux/prints/evo-rival-390x844-*.png`):
- a 390 o sprite tem ~16 px: a silhueta piscando quase não aparece, e 1,5 s passa antes de alguém achar onde olhar;
- a faixa entra no **mesmo canto e no mesmo formato da faixa de GOL** (no demo ela veio logo depois de um gol do
  rival), cobre a caixa de batalha e some em 2,6 s;
- a faixa diz "RIVAL", nunca o nome do time. A narração embaixo ("O QUÊ? Koffing está evoluindo… virou Weezing!",
  `commentary.evolve`) **não diz de quem é**;
- o Resultado só lista as suas evoluções (`Result.tsx` filtra `e.team !== 0`). Quem piscou perdeu;
- "Pular para o fim" pula tudo (`silent`), então em 8x com pulo ninguém vê.

**Opções**

| | O quê | Esforço | Risco |
|---|---|---|---|
| A | **Deixar claro e mais longo:** a faixa do rival ganha visual próprio (selo com o **nome do time** na cor dele, "Horsea → Seadra"), fica 3,5 s, a quadra segura 2,5 s, a câmera dá zoom no Pokémon (o `cine.spotlight` já existe) e a narração vira "O Horsea do Saffron evoluiu para Seadra!" | ~1 dia | baixo (só cena/texto) |
| B | A + **meia tela do rival** (cartão menor que o seu, borda na cor do rival, "EVOLUÇÃO DO RIVAL", toque pula) | ~2 dias | médio: para a partida pra uma coisa que não é sua |
| C | A + **lembrete depois**: "O rival evoluiu: Seadra" no intervalo e no Resultado, e selo EVO no Rival da prancheta | +½ dia | baixo |

**Recomendação: A + C.** Diz de quem é (nome e cor), dá tempo de ver e deixa rastro. A meia tela (B) é
tentadora, mas "eventos grandes têm momento próprio" vale pro **seu** time. Pro rival basta a quadra parar um
pouquinho. Mockup: `ux/mockups/evo-rival.png`.

## 2. Botões de tática mais intuitivos (aba Tática, `MatchHud.tsx` → `TacticControls`)

**O problema visto** (`ux/prints/copa-390x844-08-tatica.png`, `copa-320x568-08-tatica.png`,
`copa-1440x900-09-intervalo.png`):
- Os subtítulos são jargão de futsal: "meio-termo", "mais chute", "bloco baixo", "pivô na frente". A explicação boa
  ("Linhas altas e mais chutes. Cansa mais e abre espaço atrás.", `team.lineup.tacticDesc`) só vai no `title` do
  botão, e no celular ninguém vê.
- Ao tocar, só aparece um "mudando…" pequeno no rótulo. A faixa "NOVA TÁTICA" vem uns segundos depois, quando a
  ordem entra no jogo, e no mesmo canto das faixas de gol. Não tem nada que diga, na hora e em palavras, o que vai
  mudar.
- O escanteio é "Na área / Curta / Variar", sem ícone. A dica de que é instrução (e o "dá pra mudar 3 vezes", que
  já não vale) também só vai no `title`.
- A **320x568** a aba mostra 2 das 4 táticas, e o Substituir fica abaixo da dobra. No **1440x900** a Tática fica
  embaixo da quadra, cortada (só aparece a 1ª linha).
- Embaixo do Substituir sobra uma faixa vazia de ~30 px no celular.

**Opções**

| | O quê | Esforço | Risco |
|---|---|---|---|
| A | **Mesmas 4 peças, texto de criança:** nome + uma linha do que muda ("Ataca e defende igual", "Mais chutes, cansa mais", "Todo mundo protege o gol", "Rouba e sai correndo"), régua ATQ/DEF de 3 pontinhos, selo "VALENDO" e um aviso curto ao tocar ("Pra cima! O time sobe na próxima jogada"). Escanteio com ícone e subtítulo. No desktop, a Tática sobe pra coluna da direita como aba | ~1 dia | baixo |
| B | **Régua de mentalidade** (FC Mobile, Top Eleven): Retranca ↔ Pra cima em 4 degraus + chave "Contra-ataque" | ~2 dias | médio: o motor tem 4 táticas, não 4 degraus. Um degrau novo ("Cuidado") mexe em balanceamento |
| C | A + **atalho na quadra**: segurar no seu lado abre a roda de táticas (estilo Quick Chat do UNITE) | +2 dias | médio: gesto escondido |

**Recomendação: A.** O problema é de texto e de retorno visual, não de modelo. O motor fica igual, e a regra "nada
automático" também. Nomes: manter **Equilibrado, Retranca e Contra-ataque**, que todo brasileiro conhece, e trocar
**Ofensivo → "Pra cima"** (é como o técnico grita). Mockups: `ux/mockups/tatica-a.png` (recomendada) e
`ux/mockups/tatica-b.png`.

## 3. Tirar o "ir pra prancheta" e deixar os textos mais fáceis

**"Ir pra prancheta"** é o botão **Mudar prancheta** (`match.ht.board`) no `HalftimePanel` e no `TimeoutPanel`
(`Sideline.tsx`). Ele só faz `setTab('board')` e rola até a prancheta (`ux/prints/copa-390x844-09-intervalo.png`).
No desktop a prancheta já fica sempre visível à direita, então o botão não faz nada útil
(`copa-1440x900-09-intervalo.png`). No celular ele empurra o jogador pra fora do painel do intervalo, e ele precisa
achar o caminho de volta pro "Começar o 2º tempo".

**Opções:** (A) tirar o botão e deixar a aba Prancheta como está; (B) trocar por "Posições" abrindo a prancheta
dentro do próprio painel do intervalo (vestiário com Trocas | Posições | Tática); (C) renomear a aba Prancheta pra
"Posições" em todo lugar. **Recomendação: A agora (ganho rápido) + C** ("Prancheta" é palavra de técnico; "Posições"
uma criança entende). B entra junto com o item 7 se ele for pro vestiário.

**Textos** (olho de quem tem 12 anos e joga no celular; PT em `src/i18n/pt/`, o EN acompanha):

| Onde | Hoje | Proposta |
|---|---|---|
| `match.coach.styleShort` | meio-termo / mais chute / bloco baixo / pivô na frente | Ataca e defende igual / Mais chutes, cansa mais / Todo mundo protege o gol / Rouba e sai correndo |
| `common.tactic.offensive` | Ofensivo | Pra cima |
| `common.cornerPlan` | Na área / Curta / Variar | Bola alta / Curta / Varia (com subtítulo: pros grandões / chute de fora / o time escolhe) |
| `match.cornerHint` | "…(dá para mudar 3 vezes)" | "O que o time tenta no escanteio. Muda quando quiser." (o limite não existe desde a 0.8.6) |
| `match.subPending` | Substituição na próxima saída de bola: sai X, entra Y | "Troca marcada: Y entra no lugar de X quando a bola parar" (no intervalo: "…no 2º tempo") |
| `match.boardPending` | Prancheta nova na próxima bola parada: {f} | "Posições novas quando a bola parar: {f}" |
| `match.ht.tacticHint` | Estilo de jogo e escanteio também mudam agora, em Tática. | (sai se o intervalo virar vestiário; senão: "Tática também muda agora.") |
| `match.ht.board` | Mudar prancheta | (sai) |
| `match.pressure` | Pressão: chance de gol de cada time a cada 2 minutos (só até agora) | "Quem está apertando mais" |
| `team.lineup.subHint` | …a troca entra na próxima saída de bola. | "…a troca entra quando a bola parar." |
| `team.draft.tip` | 2 frases, 26 palavras | "Toque numa vaga livre pra ver 3 Pokémon. Não gostou? Sorteie de novo." |
| `team.draft.hintCaptain` | O capitão dá +3% ao time e +6% a quem divide tipo com ele… | "O capitão deixa o time mais forte, e mais ainda quem é do mesmo tipo dele." (o número fica na carta) |
| `reward.tip` (recompensa) | 46 palavras | "Ganhou! Pegue um Pokémon do rival, um item ou uma MT. Pular dá +1 sorteio." |
| `duel.modes.ready[0]` | Time pronto | "Meu time" (hoje "Pronto" quer dizer duas coisas no Duelo) |
| `duel.lobby.unready` | Esperar | "Não estou pronto" |
| `duel.preview.sealed` / `duel.team.sealed` / `draft.sealedWait` | Lacrado! / Time lacrado / Escolha lacrada | "Pronto! Esperando {name}" (o "lacre" é coisa nossa, não do jogador) |
| `duel.preview.lockNote` | Quando os dois confirmarem (ou o tempo acabar), a escalação abre pros dois ao mesmo tempo. | "Os dois times aparecem juntos quando os dois derem pronto." |
| `commentary.evolve` | O QUÊ? {x} está evoluindo... virou {sp}! | do rival: "O {x} do {time} evoluiu para {sp}!" |
| `match.agency.shoutHint.*` | "+desarme e posição, chute pior, por 2,5 min" | "Defende melhor, chuta pior, por 2 minutos e meio" (sem sinais de + e −) |

Regra pra todo texto novo: **até ~12 palavras**, verbo no começo, sem sigla, sem "%" quando der pra dizer
"mais/menos", e o número fica na carta ou na Ajuda (as referências do Roblox e da NN/g dizem o mesmo: menos texto,
dica na hora certa).

## 4. Grito do capitão: os esquisitos

**De onde sai o grito:** `playCry` (`src/game/audio.ts`) toca `assets/cries/<estilo>/<n>.ogg`, nos estilos
**legacy** (padrão, som do Game Boy, 10,5 kHz) e **latest** (Configurações → Estilo dos gritos), sem normalizar o
volume. O capitão grita no seu gol (`playGoalCry`, 450 ms depois do grito de quem marcou, que sai a 1,2x de ganho),
nos golpes (0,7x) e nos emotes do Duelo (`Emotes.tsx`), que **mudam o tom**: Zzz 0,75x, Nãão 0,8x, Grrr 0,9x, GG
1,05x, Boa 1,15x, Golaço 1,25x, Ops 1,3x (`emote-faces.ts`, `preservesPitch = false`).

**Medido** (ffmpeg + numpy, `ux/cries_analise.py` → `ux/cries.json`):

| | Gen 1 (padrão) | Novo |
|---|---|---|
| Duração | 0,20 a 2,24 s (mediana 0,80) | 0,37 a 2,30 s (mediana 1,00) |
| Volume (RMS) | −14,3 a −8,7 dB (5,6 dB de diferença) | −17,3 a −7,5 dB (**9,8 dB**) |
| Silêncio no começo/fim | 0 ms | até 40 ms |
| Clipping (amostras no teto) | até 0,12% | até 0,43% |
| Tom (centroide) | 1,4 a 2,8 kHz | 1,6 a 4,9 kHz |

Nenhum arquivo está quebrado: começa na hora, não tem silêncio e o clipping é o normal de onda quadrada. Suspeitos
pelas medidas (a página marca em vermelho):
- **curtos demais** (Gen 1, < 0,35 s, viram um "bip"): Pidgey, Jigglypuff, Wigglytuff, Poliwhirl, Snorlax;
- **longos** (> 1,4 s, atropelam o som do gol e o grito do capitão 450 ms depois): Parasect, Alakazam, Exeggutor,
  **Jynx (2,2 s)**, Electabuzz, Mewtwo, Mew (no Novo também Graveler, Ponyta, Drowzee, Hypno, Vaporeon, Aerodactyl);
- **baixos** (Novo, até −7,6 dB da mediana): Butterfree, **Pikachu**, Raichu, Clefairy, Oddish, Paras, **Diglett**,
  Dugtrio, Poliwag, Cloyster, Haunter. Gen 1: Magneton, Haunter;
- **altos/estourados** (Novo): Charizard, Gyarados, Grimer, Onix, Electrode, Gengar, Machoke, Seel, Dewgong, Marowak;
- **agudos** (estridentes, ainda mais com o Ops a 1,3x): Zubat, Meowth, Doduo, Horsea, Electabuzz, Pinsir, Porygon,
  Eevee, Gastly, Kabuto/Kabutops, Zapdos, Nidorino/Nidoking.

**Página de audição:** `~/Downloads/soccermon-gritos/index.html` (abre direto do arquivo; os áudios ficam em
`gen1/` e `novo/`, os rostos em `rosto/`). Tem os 151 nos dois estilos, play, botões **grave** e **agudo** (o tom
dos emotes), as medidas, filtro "Com suspeita", "Tocar em sequência" e um checkbox **esquisito** por estilo. A
lista copiável sai embaixo, e as marcas ficam salvas no navegador. Print: `ux/prints/gritos-390.png`.

**Opções de conserto** (depois da lista do Miguel):
- A. **Normalizar o volume** de todos (ffmpeg loudnorm, offline, uma vez, nos 302 arquivos): some o "esse grita
  baixo, aquele estoura". ~2 h.
- B. **Cortar o rabo dos longos** (fade em 1,2 s) só no grito de gol/capitão, e **não tocar o grito do capitão por
  cima** quando o de quem marcou ainda está soando. ~meia hora no `audio.ts`.
- C. **Faixa de tom menor nos emotes** (0,9 a 1,15x em vez de 0,75 a 1,3x): o tom muda menos e soa menos "disco
  arranhado". ~10 min.
- D. Trocar um a um os que o Miguel marcar (outro estilo pra aquele Pokémon, ou outro arquivo do PokeAPI). Por item.

**Recomendação:** A + B + C já (ganho rápido, ninguém perde nada) e D com a lista dele.

## 5. "Pronto" e desfazer o pronto (Duelo)

**Todos os momentos de "pronto"** (`src/net/duel-state.ts`, `src/ui/duel/`):

| Momento | Intenção | Tempo | Desfaz hoje? | Como aparece pro rival |
|---|---|---|---|---|
| Sala | `ready {ready: bool}` | sem limite | **sim** ("Esperar") | chip "Pronto"/"Ainda não" |
| Time pronto: escolha do time | `choiceSeal` | sem limite | não | "Esperando {name} escolher…" |
| Pacotes: rodada do draft | `seal` por rodada | 20 s (capitão 30) | não | "{name}: n de 7" |
| Disputa: tirar carta | `pick` (na vez) | 20 s | não (e nem deveria: o outro vê) | carta some |
| Escalação (prévia) | `choiceSeal` | 30 s (`PREVIEW_MS`) | **não**: o botão vira "Esperando {name}…" apagado e a tela inteira trava | nada |
| Intervalo | `htReady` | 20 s (`HALFTIME_MS`) | **não**, e o botão nem muda | **nada** (só o próprio vê "esperando…") |
| Revanche | `rematch` | sem limite | não | "{name} quer revanche" |

Prints: `ux/prints/duelo-A-06-escalacao-lacrada.png` (botão apagado, sem volta), `duelo-A-09-intervalo-pronto.png`
(o "Começar o 2º tempo" segue igual depois do toque) e `duelo-B-09-intervalo-rival-pronto.png` (o rival não sabe e
vê "2º tempo em 18 s ·", com um ponto sobrando no fim).

Outros dois achados:
- na escalação, se o tempo acaba **sem** o pronto, vale o padrão (`seal '-'`), e o que a pessoa mexeu se perde;
- no intervalo do Duelo dá pra seguir trocando depois do pronto (o `canChange` não olha o `htReady`). Só que, se o
  rival der pronto, o 2º tempo começa no meio da troca.

**Opções**

| | O quê | Esforço | Risco |
|---|---|---|---|
| A | **Desfazer no intervalo e na escalação/escolha de time:** `htReady {ready:false}` e `choiceUnseal` aceitos **só enquanto o outro não deu pronto** (como o `undo` do Showdown e o Undo End Turn do Marvel Snap). Botão em 3 estados: "Pronto" → "Pronto! Esperando Ana · Mudar algo" → "Começando…" (trava). O rival vê o chip "pronto" do outro nas duas telas | ~1,5 dia com testes no `duel.test.ts` | baixo: o lacre esconde o conteúdo, desfazer não vaza nada. Jogo antigo sem o campo segue igual (padrão `true`) |
| B | A + **vale o que está na tela** quando o tempo acaba (a escalação se lacra sozinha no último segundo, em vez de cair no padrão) | +½ dia | baixo |
| C | B + desfazer também na rodada de pacotes e na revanche | +1 dia | baixo valor: 20 s por rodada |

**Recomendação: B.** Cobre o pedido (intervalo e escalação, onde se mexe de verdade), mostra o pronto do outro
(hoje invisível no intervalo) e conserta a perda silenciosa da escalação. Mockup: `ux/mockups/pronto.png`. A Copa
não precisa disso: lá não tem ninguém do outro lado.

## 6. Ir sozinho pra tela de resultado

**Hoje** (`Match.tsx`/`DuelMatch.tsx`): no apito final a barra de velocidade vira o botão **Ver resultado**
(`ux/prints/copa-390x844-12-fim-botao.png`). Medido do "Fim de jogo" no placar até o botão: 0,6 s (Copa) e 1,4 s
(Duelo). Depois disso fica esperando o toque. A aba Tática continua aberta, com tudo apagado.

**Opções**

| | O quê | Esforço |
|---|---|---|
| A | **Vai sozinho em ~3 s:** apito, faixa grande "VITÓRIA! 5 x 4" (ou "FIM DE JOGO") por 2,5 s, botão "Ver resultado" enchendo, e vai. Qualquer toque na quadra ou no painel segura (vira o botão de hoje). Reduzir movimento: sem a faixa, o mesmo tempo | ~½ dia |
| B | A, com o tempo como opção em Configurações (Na hora / 3 s / Não ir sozinho) | +2 h |
| C | Só a faixa do placar e o botão no lugar de sempre (sem ir sozinho) | ~2 h |

**Recomendação: A.** O momento do apito fica (faixa + som), e ninguém precisa caçar o botão. Pênaltis: conta
depois da última cobrança. Duelo: igual, cada um no seu. Mockup: `ux/mockups/fim.png`. Referências: o UNITE revela
o placar no fim e vai sozinho pro resumo. O FC leva bronca quando junta "pular comemoração" com "pular replay";
aqui o toque só **segura**, não pula nada.

## 7. Mensagem da troca de Pokémon no intervalo

**Hoje** (`ux/prints/copa-390x844-09d-intervalo-depois-troca.png`): depois da troca aparece, **embaixo** do
painel do intervalo, uma caixa tracejada "Substituição na próxima saída de bola: sai Arcanine, entra Dragonair". No
celular ela fica fora da tela (precisa rolar). "Próxima saída de bola" no intervalo é o começo do 2º tempo, mas
ninguém entende isso. E o **Substituir desliga**: o `canSub` exige `!pendingSub`, então no intervalo só cabe **1
troca** (no 1º tempo faz sentido, uma por bola parada; no intervalo não). A troca do rival aparece como faixa
"SUBSTITUIÇÃO" na quadra e na narração cortada ("Substituição no Saffron Mentes: sai Horsea, entra …").

**Opções**

| | O quê | Esforço | Risco |
|---|---|---|---|
| A | **Só o texto:** dentro do painel, logo acima dos botões: "Dragonair entra no lugar de Arcanine no 2º tempo" | ~1 h | nenhum |
| B | **Vestiário:** o painel do intervalo vira a lista "Suas trocas pro 2º tempo" (com desfazer em cada uma), **várias trocas no intervalo**, "O rival trocou: Starmie entrou, Horsea saiu", e os botões Trocar mais / Tática / Começar o 2º tempo | ~1,5 dia | médio: várias trocas no mesmo tick do motor (a ordem `sub` já é por tick; testar Copa e Duelo) |
| C | B + **sugestão** (nunca automática): "Kabutops está com 74%: trocar?" com um toque pra abrir a troca já com ele | +½ dia | baixo |

**Recomendação: B** (com o A como ganho rápido, se o B não couber agora). O "só 1 troca" é a parte que mais
atrapalha. Mockup: `ux/mockups/intervalo.png`.

## 8. UX e UI no geral (o que o percurso achou)

Por tela, do mais ao menos importante (prints em `ux/prints/copa-<tamanho>-*.png`):

- **Aviso "Treinador novo desbloqueado"** aparece no apito e segue por cima do topo no Resultado e na Recompensa,
  cobrindo o cabeçalho da tela (`copa-390x844-13-resultado.png`, `-14-recompensa.png`). Sugestão: ele entra só no
  Resultado e some sozinho em 3 s, ou vai pra dentro do Resultado ("Novo treinador: Sabrina").
- **Desktop 1440x900, partida:** a Tática fica embaixo da quadra, cortada pela dobra (`copa-1440x900-09-intervalo.png`).
  Ela devia ser uma aba da coluna da direita, como no celular.
- **320x568, partida:** a aba Tática mostra 2 de 4 estilos, e o Substituir some (`copa-320x568-08-tatica.png`). Vale
  pôr o Substituir fixo na barra de baixo (do lado do "pular"), onde o polegar já está.
- **Intervalo** (todos os tamanhos): 3 botões do mesmo peso, e o principal (Começar o 2º tempo) é o último. Ver o
  item 7.
- **Duelo, intervalo:** o rival não sabe que você deu pronto, e sobra um "·" quando ninguém está pronto
  (`duelo-B-09-…`).
- **Duelo, escalação lacrada:** o botão apagado parece quebrado (`duelo-A-06-…`). Ver o item 5.
- **Recompensa:** dica de 46 palavras e três ações com nomes diferentes (Escolher, Contratar, Pular) pra mesma
  decisão. Um verbo só ("Pegar") e o tipo no selo da carta (ITEM / DO RIVAL / MT).
- **Draft:** ~3 toques por vaga (abrir o pacote, Escalar, tocar na vaga). O "Escalar (Fixo)" já sabe a vaga. Quando
  só tem uma vaga possível, dava pra pular o toque na vaga (−6 toques por copa).
- **VERSUS:** 0,7 a 2 s de "Carregando a quadra…" com o botão vermelho apagado. É curto, mas o botão apagado parece
  erro. Com uma barrinha enchendo dentro do botão, fica claro que está carregando.
- **Perfil:** 511 palavras visíveis e muitas dicas `small.muted` ("O nome já vem preenchido…"). Recolher as dicas
  num "?" por campo.
- **Configurações:** botões "1x" de 37 px de largura (abaixo dos 44 px recomendados pra dedo).
- **Partida:** sobra uma faixa vazia de ~30 px embaixo do Substituir no celular.
- **Passo a passo de boas-vindas:** 6 páginas é muito pra quem quer jogar (a Apple e o Roblox recomendam pedaços
  curtos, na hora em que a coisa aparece). Dá pra cortar pra 3 e mandar o resto pras dicas que já existem.
- **Bom e pra manter:** o "Monta pra mim" no draft, a partida com ~40 palavras na tela, o VERSUS, o aviso de quem
  está cansado no Substituir e a faixa da torcida.

## 9. Referências (como os outros resolvem)

**Tática ao vivo**
- FC Mobile: 5 mentalidades e até 4 "Game Plans", trocados na partida por um menu no canto. A mudança vale na
  hora, cada mentalidade diz o custo numa frase, e a EA desaconselha trocar o tempo todo.
  [EA: Game Plans deep dive](https://www.ea.com/games/ea-sports-fc/fc-mobile/news/fcm27-game-plans-deep-dive)
- eFootball/PES: 3 presets trocados durante o jogo e até 2+2 instruções. O plano completo fica pro intervalo.
  [Manual PES 2019](https://dds.konami.com/games/manual/pes2019/PC/en/plan.html),
  [PES Mastery](https://pesmastery.com/?p=8355)
- Top Eleven: régua de mentalidade em 5 níveis, de "defender forte" a "atacar forte".
  [BlueStacks](https://www.bluestacks.com/blog/game-guides/top-eleven-2015/tesm-best-tactics-guide-en.html),
  [SuperCheats](https://www.supercheats.com/guides/top-eleven-football-manager/match-day)
- Football Manager: 8 gritos com efeito de ~10 min e recarga. O retorno é um ícone de humor em cada jogador.
  [Passion4FM](https://www.passion4fm.com/?p=11591). Reviews do FM Touch reclamam de controle "cheio de toque".
  [Use a Potion](https://useapotion.com/2021/01/football-manager-touch-2021-review)
- Pokémon UNITE: mensagens rápidas em 3 grupos (Ataque, Defesa, Comunicação), personalizáveis.
  [TheGamer](https://www.thegamer.com/pokemon-unite-quick-message-improvements/)

**Pronto e desfazer**
- Pokémon Showdown: `undo` só "se o outro ainda precisa escolher e não escolheu".
  [SIM-PROTOCOL](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md)
- Marvel Snap: "Undo End Turn" enquanto o oponente não encerrou o turno, e o botão de turno é o próprio relógio.
  [Shacknews, patch de março/2024](https://www.shacknews.com/article/139086/marvel-snap-march-12-patch-notes),
  [Game Developer](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns)
- Hearthstone: mulligan com 65 s pros dois, e o do rival só aparece depois de você travar o seu.
  [Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Mulligan)
- Pokémon TCG Pocket: na troca, qualquer um pode recusar em qualquer etapa.
  [Dexerto](https://www.dexerto.com/pokemon/how-to-trade-in-pokemon-tcg-pocket-3050521)
- FC online: o intervalo é cronometrado e não espera os dois.
  [Fórum EA](https://forums.ea.com/idea/fc-26-bug-reports-en/team-management-bugs-prevent-any-changes-in-all-online-modes-rival-champ-/12704198)

**Fim de partida**
- Pokémon UNITE: o placar fica escondido e é revelado no fim (o produtor explica por quê), depois vêm as medalhas e
  as estatísticas atrás de um botão.
  [Dexerto](https://www.dexerto.com/pokemon/pokemon-unite-devs-reveal-why-hide-game-scores-1683678),
  [Gfinity](https://www.gfinityesports.com/pokemon-unite/medals/)
- FC: os jogadores reclamam que pular a comemoração também pula o replay.
  [Fórum EA](https://forums.ea.com/discussions/fc-26-feedback-en/skip-goal-celebrations-without-skipping-replays/13571379)
- Overwolf (guia de pós-jogo): resumo, comparação, momentos e compartilhar.
  [Overwolf](https://dev.overwolf.com/ow-native/guides/product-guidelines/app-screen-behavior/post-game-behavior)
- Não achei descrição escrita do pós-jogo do Clash Royale, do Marvel Snap nem do Top Eleven (só aparece em vídeo).

**Textos e onboarding**
- Apple: o Clash Royale ensina em 5 tutoriais curtos, um passo por vez, com "Como jogar" sempre à mão.
  [Apple, onboarding for games](https://developer.apple.com/app-store/onboarding-for-games/)
- Roblox: "quanto mais texto, mais o jogador entende errado ou esquece". O guia prefere destacar o botão e dar a dica
  na hora. [Roblox Creator Docs](https://create.roblox.com/docs/en-us/production/game-design/onboarding-techniques)
- NN/g: leitores de 9 a 12 anos pedem instruções específicas e alvos de toque grandes, e adolescentes leem pouco e
  com pressa. [Crianças](https://www.nngroup.com/articles/childrens-websites-usability-issues/),
  [Adolescentes](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- King (UX writer do Candy Crush): texto claro, curto, acionável, sem jargão de gamer.
  [PocketGamer.biz](https://www.pocketgamer.biz/news/83292/kings-senior-ux-writer-greta-septinia-talks-conversion-and-actionable-microcopy-in-candy-crush/)

**Upgrade do rival e trocas**
- TFT: a estrela de upgrade aparece na própria carta antes da compra, e a informação do rival fica longe demais
  (a comunidade pede pra ver o tabuleiro inimigo no seu).
  [LoL Wiki](https://wiki.leagueoflegends.com/en-us/V9.20_(Teamfight_Tactics)),
  [Mobalytics](https://mobalytics.gg/blog/tft/3-tft-mechanics-that-need-updating/)
- FC Mobile: "Suggested Sub" com timer e cancelar. Os jogadores pedem pra escolher quem entra, o que bate com o
  "nada automático" daqui: sugerir, nunca trocar sozinho.
  [Fórum EA](https://forums.ea.com/discussions/fc-mobile-general-discussion-en/allow-players-to-configure-automatic-substitutions-quality-of-life-improvement/13535250)
- eFootball: trocas em "janelas" (5 trocas em 3 janelas).
  [Konami, patch v2.1.0](https://www.konami.com/efootball/en-us/page/2023/season1_patch-notes_v2-10)

---

## Ganhos rápidos (até meio dia cada)

1. Tirar o **Mudar prancheta** do intervalo e do pedido de tempo (`HalftimePanel`, `TimeoutPanel`).
2. Consertar a **dica do escanteio** ("dá pra mudar 3 vezes" não vale mais), PT e EN.
3. **Subtítulos da Tática** em palavras simples + "Ofensivo" → "Pra cima" (só i18n).
4. **Mensagem da troca no intervalo** dentro do painel: "Y entra no lugar de X no 2º tempo" (item 7A).
5. **Narração da evolução do rival** com o nome do time, e a faixa do rival com o nome do time em vez de "RIVAL".
6. Evolução do rival **mais longa**: segura 2,5 s (era 1,5 s) e faixa de 3,5 s, com zoom (`cine.spotlight`).
7. **Ir sozinho pro resultado** em ~3 s com faixa do placar; um toque segura (item 6A).
8. **Duelo, intervalo:** o botão muda pra "Pronto! Esperando {name}", o rival vê "{name} está pronto" e some o "·"
   sobrando.
9. **Gritos:** normalizar o volume dos 302 arquivos (loudnorm offline).
10. **Gritos:** não tocar o grito do capitão por cima de um grito longo, e fade nos longos (> 1,2 s).
11. **Emotes:** faixa de tom de 0,9 a 1,15x (era 0,75 a 1,3x).
12. Aviso **"Treinador novo"** só no Resultado e menor (não cobre o topo de 3 telas).
13. **Duelo:** "Time pronto" → "Meu time", "Esperar" → "Não estou pronto", "lacrado" → "Pronto!".
14. Botão do VERSUS com **barrinha de carregando** em vez de apagado.

## Mudanças maiores

1. **Pronto com desfazer** no intervalo e na escalação do Duelo + escalação que vale o que está na tela quando o
   tempo acaba (item 5B; protocolo novo, compatível com o jogo antigo, testes no `duel.test.ts`). ~2 dias.
2. **Vestiário no intervalo** com várias trocas, desfazer e "o rival trocou" (item 7B; Copa e Duelo). ~1,5 dia.
3. **Aba Tática nova** (item 2A) com aviso ao tocar e a Tática como aba no desktop. ~1 dia.
4. **Evolução do rival** com lembrete no intervalo, no Resultado e na prancheta do rival (item 1, parte C). ~½ dia.
5. **Revisão de texto** do jogo inteiro com a regra das ~12 palavras (Perfil, Ajuda, recompensa, dicas). ~1 dia + o
   EN.
6. **Passo a passo de 6 → 3 páginas** + dicas na hora (draft, partida, intervalo). ~1 dia.

---

## Decisões pro Miguel

Responda como de costume ("1 A, 2 B…"). A recomendação vem primeiro em cada pergunta.

1. **Evolução do rival:**
   A) deixar claro e mais longo na quadra + lembrete no intervalo e no Resultado (recomendado);
   B) A + meia tela própria do rival (para a partida ~3 s);
   C) só trocar o texto (nome do time na faixa e na narração).
2. **Aba Tática:**
   A) as mesmas 4 peças com texto simples, régua ATQ/DEF, selo "valendo" e aviso ao tocar (recomendado);
   B) régua de mentalidade em degraus + chave de contra-ataque (mexe no motor);
   C) só os textos.
3. **Nome da tática ofensiva:** A) "Pra cima" (recomendado); B) manter "Ofensivo"; C) "Ataque".
4. **Mudar prancheta:** A) tirar o botão e chamar a aba de "Posições" (recomendado); B) só tirar o botão; C) levar a
   prancheta pra dentro do intervalo (vestiário).
5. **Textos:** A) aplicar a tabela do item 3 e a regra das ~12 palavras no jogo todo (recomendado); B) só os da
   partida e do Duelo agora; C) eu mando cada texto pra você aprovar antes.
6. **Gritos:** A) normalizar volume + fade nos longos + tom menor nos emotes agora, e trocar os que você marcar
   (recomendado); B) só trocar os que você marcar; C) deixar como está.
7. **Estilo padrão dos gritos:** A) manter Gen 1 (recomendado: mais curto, mais "Pokémon"); B) passar pro Novo.
8. **Pronto no Duelo:** A) desfazer no intervalo e na escalação/escolha de time + "vale o que está na tela" quando o
   tempo acaba (recomendado); B) só desfazer; C) desfazer em todos, rodada de pacotes e revanche incluídas.
9. **Fim de jogo:** A) vai sozinho em ~3 s, e um toque segura (recomendado); B) A + opção em Configurações;
   C) não ir sozinho, só a faixa do placar.
10. **Intervalo:** A) vestiário com várias trocas, desfazer e "o rival trocou" (recomendado); B) só a mensagem nova
    dentro do painel; C) B + liberar mais de 1 troca, sem vestiário.
11. **Sugestão de troca no intervalo** ("Kabutops com 74%: trocar?", um toque abre a troca, nada automático):
    A) sim (recomendado); B) não.
12. **Aviso "Treinador novo":** A) só no Resultado, menor (recomendado); B) como está.
13. **Passo a passo de boas-vindas:** A) 3 páginas e o resto em dicas na hora (recomendado); B) manter as 6.
14. **Ordem:** A) ganhos rápidos primeiro (uma versão só), depois pronto/desfazer e vestiário (recomendado);
    B) tudo junto numa versão maior.
