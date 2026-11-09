---
description: Menos e mais (09/11/2026): inventário de tudo que o jogador encontra, o que os dados dizem que é usado, o que tirar, juntar, esconder até liberar e refinar, com a 1ª rodada pra 0.9.45 e as decisões.
---

# Menos e mais: o jogo tá com 110 de 100 (09/11/2026)

Feedback que o Miguel recebeu em 09/11: "o jogo tem MUITA coisa. supondo que 100 seja o número máximo de features, o
Soccermon tá com 110. não é muito, mas tá passando um pouco do ponto". Ele quer resolver de dois jeitos: (1) tirar o
inútil; (2) refinar o que fica até ficar liso e fácil de entender.

Base: a branch `v0944` inteira (a 0.9.44, que ainda não está no ar; a produção é a 0.9.43) e o placar de 14 dias
(26/10 a 09/11). Só proposta: nada foi mexido no código.

## 1. O resumo em 5 números

1. **O jogo é a Copa.** Das 519 sessões que começaram copa em 14 dias, 70% jogaram Relâmpago, 41% a Rota e 23% a
   Copa do Dia. Fora da copa, nas 235 sessões da 0.9.40 em diante: Coleção 10%, Configurações 6%, Sala de troféus 4%,
   Liga (fechada) 1%, Ajuda 0,4% (1 sessão).
2. **Os controles da partida quase não são tocados.** 71% das partidas acabam sem nenhuma ordem do técnico; 93% ficam
   na tática padrão (Equilibrada); 58% das copas ficam na formação padrão (1-2-1); plano de escanteio em 2,9% das
   partidas.
3. **Configurações tem 21 opções, e só uma é usada.** Fora a velocidade (312 trocas), nenhuma das outras passou de 6
   trocas em 14 dias.
4. **O convidado do Duelo joga e vai embora.** 25 sessões novas chegaram por convite, 13 terminaram um jogo do Duelo e
   só 2 começaram uma copa (0 chegaram à 1ª partida dela).
5. **MT à venda no Mercado é peso morto.** 5 compras de MT em 14 dias (0,4% das 1.252 compras), contra 464 de
   Patrocínio, 322 de Pokémon, 260 de pacote e 201 de item.

E um que explica o "110": antes do Time Ultimate, o jogador já tem **13 contadores** pra acompanhar (lista na seção
3). O Time Ultimate soma mais 6 (Fichas, Pontos de pacote, Pacote Mini, Pacote Grande, Picks e Passe).

## 2. Inventário: tudo que o jogador encontra (0.9.44)

"Toques" = a partir da 1ª tela (o Estádio). "Novo" = jogador sem save na 1ª visita.

### Entrada e navegação

| O quê | Onde | Toques | Jogador novo vê? |
|---|---|---|---|
| Estádio com JOGAR (Copa Relâmpago · 4 jogos), capitão fazendo embaixadinha, faixa de LED | `ambientes/Estadio.tsx` | 0 | Sim, e só ele tem ação: o trilho de modos vem vazio na 1ª visita |
| Barra de baixo com 5 ambientes: Lab, Rota, Estádio, Arena, Sede (e arrastar pro lado) | `ambientes/Ambientes.tsx` | 0 | **Sim, as 5 abas, todas abertas** |
| Chip do treinador (avatar, estrela de nível, barra) → Perfil | topo | 1 | Sim (nível 1, barra vazia) |
| Novidades (jornal), Ajuda (?), Configurações (engrenagem) | topo | 1 | Sim |
| Menu de modos (3 fatias: Clássico, Time Ultimate 27/11, Modo História 2027) | `screens/ModeMenu.tsx` | 0 ao reabrir | Não: só a partir da 2ª visita (`modeMenuDue`) |
| Balões do tutorial (13: intro, relampago ×4, rota, rotaGrupo, rotaNova, duelo, dueloSala, dia, liga, golpe, utRepetida) | `ui/coach/` | — | Os da Relâmpago, na 1ª copa |
| Passo a passo de 4 slides (`Onboarding`) | só pelo botão da Ajuda | 2 | Não aparece sozinho |

### Modos

| Modo | Onde | Toques | Novo vê? | Libera com |
|---|---|---|---|---|
| Copa Relâmpago (7 escolhas, 4 jogos) | JOGAR | 1 | Sim | nada |
| Rota Índigo (8 jogos, mapa, cartão, insígnias 0/8, Mochila, casas) | aba Rota | 2 | **Sim, jogável no minuto zero** | nada (`LONG_CUP_LIVE`) |
| Copa do Dia (1 tentativa, ranking, sequência) | vira o JOGAR na 2ª sessão; trilho | 1–2 | Não (só o texto no LED) | 1ª copa |
| Duelo melhor de 3 (Meu time, Disputa, Pacotes; sala, QR, emotes, cinturões 10/50/100) | aba Arena | 2 | Sim | nada; link `?duelo=` abre direto |
| Liga (Elo, divisões, fantasma) | placa na Arena, card na Sala de troféus, LED, Ajuda, tópico do menu de modos | 2 | Sim, **fechada** ("abre em N dias") | 12/01/2027 + login |
| Time Ultimate (Início, Jogar, Clube, Loja, Metas) | fatia do menu de modos | 1 | Não | 27/11/2026 |
| Modo História | fatia do menu de modos | 1 | Não | "2027" |

### Dentro da copa

Formação (6), capitão (1 de 3), escolha 1 de 3 por vaga, sorteios (2), escalação e lousa, tática (4), itens (7 de
segurar + os de tipo), MT do ginásio, Recompensa 1 de 3 (ou Pular = +1 sorteio), Mercado (2 Pokémon, pacote de tipo,
item, MT, 2 Patrocínios, trocar vitrine), 16 Patrocínios (3 vagas), partida (velocidade 1/2/4/8/lances, pular,
substituir, tática ao vivo, escanteio com 3 planos, golpe máximo N1–N3, bicuda do goleiro, Pressão final, emote do
líder, melhores momentos), evolução em campo, pênaltis, resultado com Hall, raridade, compartilhar (imagem, texto,
Story, Quadrado). Na Rota, além disso: cartão amarelo/vermelho, Centro, Treino/Folga, Baú, Evento, Treinador Ás,
Zona Safari, Cassino, PC do Bill, Planalto/Grupo, pedras e Mochila.

### Fora da copa (as "portas")

| O quê | Onde | Toques | Novo vê? |
|---|---|---|---|
| Pokédex 0/151 (filtros, ficha da espécie, selos de carreira) | Lab | 2 | Sim, vazia |
| Álbum (622 figurinhas em 5 edições, vitrine de 3) | Lab (fichário) | 2 | Sim, vazio |
| Golpedex | Lab (computador) | 2 | Sim, vazia |
| Sala de troféus (taças, medalhões do Dia, cinturões, Liga, Platina, TV = Hall da Fama, quadro de medalhas, PC = Números) | Sede (vitrine) | 2–4 | Sim, vazia |
| 20 medalhas × 5 degraus | Sala de troféus | 3 | Sim |
| 63 missões → 46 treinadores e títulos → nível do treinador | Sede ("Missões") e Perfil | 2 | Sim |
| Perfil / armário (nome, avatar, treinador, título, código de título, cartão do treinador, vitrine) | chip | 1 | Sim |
| Clube (nome, sigla, 2 cores, 5 escudos, 17 símbolos, 4 uniformes, 12 faixas) | Sede (escudo) | 2 | Sim |
| Amigos (código, pedidos, "Online agora", Desafiar) | Sede (mural) | 2 | Sim, mas pede login Google |
| Configurações (Som, Partida, Acessibilidade, Dados: login, instalar, backup, apagar conta) + Créditos | engrenagem | 1–3 | Sim |
| Ajuda: 20 seções + perguntas + "Como funciona" (repete os balões) | ? | 1 | Sim |
| Novidades: carrossel (evento da semana; UT e Rota nova a partir de 17/11) + notas da versão | jornal | 1 | Sim |
| Evento semanal (tipo da semana, cartas Evento) | LED, Novidades, Mercado | 0 | Sim |

## 3. Moedas e contadores

| Contador | Vale onde | Ganha com | Gasta em |
|---|---|---|---|
| ₽ | uma copa | vitória, gols, sem sofrer, juros, patrocínios | Mercado, Cassino |
| Sorteios | uma copa | começa com 2, Pular a recompensa | Sortear de novo |
| Cartão amarelo | Rota | derrota | Centro |
| Insígnias 0/8 | Rota | ginásio | treinadores |
| Mochila (pedras) | Rota | prêmio | evoluir |
| Barra de evolução | partida | jogar bem | evolução em campo |
| Nível do treinador | sempre | missões (não tem XP) | nada (cosmético) |
| Missões n/63 | sempre | condições | treinadores, títulos, nível |
| Medalhas 20 × 5 | sempre | marcos (uma delas é "Missões") | moldura do avatar |
| Troféus, medalhões, cinturões, selos de carreira | sempre | títulos, Dia, Duelo, jogos | vitrine |
| Pokédex x/151 e Golpedex | sempre | ver e jogar | medalhas, missões |
| Álbum x/622 | sempre | escalar edição especial | medalhas |
| Sequência da Copa do Dia, streak de títulos | sempre | jogar | medalha, missões |
| **Time Ultimate:** Fichas, Pontos de pacote, Pacote Mini (12 h, até 6), Pacote Grande, Picks, Passe (40 marcos) | temporada | partidas, objetivos, venda rápida | pacotes, picks, escolher carta |

Três escadas de longo prazo medem quase a mesma coisa: **missões** sobem o **nível**, e a **medalha "Missões"** conta
as missões. No Time Ultimate, Fichas e Pontos de pacote são duas moedas pro mesmo lugar (a Loja), e a decisão 5 do
[ultimate-team.md](ultimate-team.md) era "moeda = Fichas".

## 4. O que os dados dizem

Fonte: `npm run stats -- --dias 14 --md` e consultas só de leitura em `public.game_events` (transação `read only`).
Período 26/10 15h a 09/11 15h; 861 sessões, 33% novas, 77% no celular. O tráfego caiu de 105–127 sessões por dia
(27 a 30/10) pra 31–59 (06 a 09/11), e a Copa do Dia de 16 sessões por dia (29/10) pra 4–6.

### Telas por sessão (235 sessões da 0.9.40 em diante, ~última semana)

| Tela | Sessões | % |
|---|---:|---:|
| Escalação / draft / partida | 137–142 | 58–60% |
| Home | 117 | 50% |
| Mercado | 104 | 44% |
| Duelo | 70 | 30% (26 delas são convites de quem é novo) |
| Rota (mapa) | 51 | 22% |
| Evento da Rota | 43 | 18% |
| Treino | 40 | 17% |
| Perfil | 38 | 16% |
| Grupo (Planalto) | 37 | 16% |
| Coleção (as 3 abas juntas) | 24 | 10% |
| Copa do Dia (tela) | 19 | 8% |
| Configurações | 15 | 6% |
| Sala de troféus | 9 | 4% |
| Liga | 3 | 1% |
| Ajuda | 1 | 0,4% |

### Modos (14 dias)

- 519 sessões com copa: Relâmpago 363 (70%), Rota 214 (41%), Copa do Dia 118 (23%); 131 jogaram dois modos ou mais.
- Duelo: 78 sessões entraram numa sala, 38 como anfitrião sem convite (4% de todas as sessões) e 42 como convidado.
  173 jogos terminados (81 Disputa, 82 Pacotes, 10 Meu time).
- Liga: 7 aberturas da tela em 6 sessões (é só o aviso "abre em").

### Partida e Mercado

- 1.564 partidas (0.9.40+): 29% com alguma ordem; tática 14,5%, substituição 13,7%, troca na escalação 6,1%,
  escanteio 2,9%.
- Velocidade: 8x em 70% das partidas; "Pular pro fim" 3.537 vezes em 324 sessões (65 na 1ª copa).
- Mercado: 1.997 visitas, 51% saem sem comprar. Compras: Patrocínio 37%, Pokémon 26%, pacote 21%, item 16%, MT 0,4%.
- Copa terminada com Patrocínio vira título em 50% das vezes; sem, em 16%. É correlação (quem compra patrocínio
  já joga melhor), mas mostra que é o sistema do Mercado que mais pesa.
- Recompensa: 27% puladas; das escolhidas, item 63%, Pokémon 29%, MT 8%.

### Entrada e abandono

- Sessões novas (fora maratona e versão antiga): 69% começam a copa, 56% chegam ao apito da 1ª, 42% terminam a copa.
- Celular novo: abriu → jogou 33% (5 de 15); desktop 88% (14 de 16). Amostra pequena.
- `first_leave` (saiu antes de terminar a 1ª partida): Home 49 sessões com mediana de **13 s**; Duelo 44 (mediana
  29 s, quase todo convite); dentro da 1ª partida 20 (mediana 145 s).
- Balão `intro` (o da 2ª visita): 24 mostrados, 11 pulados no 1º passo, 2 chegaram ao fim do 2º. Os da Relâmpago vão
  bem (182 mostrados, 139 seguidos).
- "Monta pra mim": 8 de 94 sessões que começaram copa (75% jogaram a partida; na mão, 93%).

### O que não dá pra medir hoje

- **Abas dos ambientes** (Lab, Rota, Arena, Sede): trocar de aba não gera `screen`. Não dá pra saber quantos novos
  abrem a Rota ou a Sede antes de jogar.
- **Abas das portas**: Pokédex × Álbum × Golpedex, Perfil × Clube × Amigos, Troféus × Medalhas × Números; Missões.
- Novidades (abrir e tocar no card), seções da Ajuda, fatias do menu de modos, placa da Liga, link de feedback,
  emotes, nível que subiu, missão e medalha cumpridas.
- **Tudo do Time Ultimate** (só aparece `screen: ultimate`).
- **Pessoa**: o id é da aba, então não há D1/D7 por jogador, só "voltando" por aparelho.
- Evento novo precisa de migração antes (`game_events_name_check`), senão o lote inteiro volta 400.

## 5. Como os jogos de referência escondem e liberam

| Jogo | O que faz | O que serve pra nós |
|---|---|---|
| **Clash Royale** | Tutorial em 5 batalhas curtas; cartas, arenas e recursos vão aparecendo pela Trilha de Troféus; o Ranqueado só abre muito depois | A barra de baixo pode existir desde o início e as abas irem **acendendo** com a progressão |
| **Brawl Stars** | Modos abrem por troféus (Showdown, Liga de Poder); a Trilha de Troféus entrega um sistema por vez | Liberar o Duelo e a Rota por marco (1ª copa, 1º título), não por relógio |
| **Marvel Snap** | Começa só com o modo principal; coleção e loja de fichas abrem pelo Nível de Coleção | Um contador só puxa tudo (no nosso caso, as copas jogadas) |
| **Balatro** | Desafios só depois de vencer com 5 baralhos; baralhos e stakes abrem jogando | Mostrar o que existe só quando o jogador consegue usar |
| **Slay the Spire** | Um personagem no início; os outros abrem terminando corridas; Ascensão depois de vencer | A Rota (copa longa e difícil) como "o próximo degrau" depois da Relâmpago |
| **EA FC Ultimate Team** | Objetivos de "Fundamentos" ensinam o modo um sistema por vez, com pacote de prêmio | Os Primeiros passos do Time Ultimate já seguem isso: manter curto |

A regra comum: **um modo e um botão no começo, o resto aparece no momento em que serve** ("ensinar quando é
relevante, não antes"), e cada liberação é um evento com recompensa, não um cadeado à vista.

## 6. Diagnóstico

**Pouco usado e custa atenção (candidato a sair ou esconder):**
- MT à venda no Mercado (0,4% das compras, ocupa vaga na vitrine 35% das vezes).
- Liga fechada em 5 lugares (placa da Arena, LED, Sala de troféus, Ajuda, menu de modos) por mais 2 meses, com o Time
  Ultimate abrindo antes: dois "em breve" disputando o mesmo olhar.
- Configurações com 21 opções e uma usada.
- Ajuda com 20 seções aberta por 0,4% das sessões, mais o passo a passo de 4 slides que só ela abre.

**Sobreposições:**
- Missões × Medalhas × Nível: três escadas que contam o mesmo progresso, em telas diferentes (Sede e Sala de troféus).
- Perfil × Sede: o chip abre o Perfil, que tem "Ir pra Sede"; a Sede tem missões, clube e amigos, que também estão no
  Perfil. São 5 ambientes + 3 portas = 8 entradas pra "quem eu sou e o que eu tenho".
- Fichas × Pontos de pacote no Time Ultimate.
- Copa do Dia é a Relâmpago com semente e sem Mercado. Não é problema, mas o JOGAR virar "Copa do Dia" pra quem volta
  troca o botão principal de lugar.

**Confunde quem chega:**
- 5 abas abertas no minuto zero, com Rota, Duelo, Pokédex 0/151, Álbum 0/622, 63 missões e nível 1 à vista antes da
  1ª partida. Quem sai na Home sai em 13 s (mediana).
- O convidado do Duelo cai direto numa sala e não tem ponte pra copa.

**Bom, mas mal apresentado (refinar):**
- Patrocínio: o sistema que mais pesa no título fica numa linha "Patrocínios 0 de 3 ›".
- Controles da partida: estão lá, quase ninguém toca. Não é pra tirar (é escolha do jogador), é pra pesar menos na
  tela; a 0.9.24 "Beira da quadra" já foi nesse rumo.
- O balão `intro` da 2ª visita: metade pula no 1º passo.

## 7. Proposta

Esforço: P (horas), M (1–2 dias), G (3+ dias). Risco: o que pode quebrar ou o que muda pro jogador que já joga.

### A. Remover

| # | O quê | Dado | Esforço | Risco |
|---|---|---|---|---|
| A1 | MT sai da vitrine do Mercado (fica como recompensa do ginásio, que é escolhida) | 5 compras em 14 dias | P | Mexe na economia do draft: skill `soccermon-balanceamento` e conferir se a vitrine usa o `Rng` da copa (Copa do Dia não tem Mercado, então não afeta o ranking) |
| A2 | Passo a passo de 4 slides (`Onboarding`) | só abre pela Ajuda, que 1 sessão em 235 abriu | P | Nenhum; os balões já ensinam |
| A3 | Ajuda: cortar as seções que repetem os balões e o que está na própria tela; fica "Como funciona" por modo + perguntas | 0,4% das sessões | M | Texto PT/EN junto |

### B. Juntar ou simplificar

| # | O quê | Esforço | Risco |
|---|---|---|---|
| B1 | Configurações: Velocidade, Volume, Idioma e Movimento reduzido à vista; o resto em "Mais opções" (nada some) | P | Baixo; acessibilidade continua a 1 toque |
| B2 | Missões + Medalhas numa tela só, "Metas" (missões em cima, medalhas embaixo), na Sede; a Sala de troféus fica com as taças | M | Só interface; o save já guarda os dois |
| B3 | Perfil vira aba da Sede: o chip do treinador abre a Sede; as 3 portas viram abas dos ambientes que já existem | M | Links `?aba=` e `?perfil=` antigos precisam continuar indo pro lugar certo (`doors.ts` já tem o mapa) |
| B4 | Time Ultimate com uma moeda só: venda rápida dá Fichas e Pick/Escolher carta custa Fichas (sem Pontos de pacote) | M | Equilíbrio do UT; o mais barato é **antes de 27/11**, quando ainda não tem save com pontos |

### C. Esconder até liberar (ordem pelas primeiras sessões)

As abas continuam na barra (o modelo dos ambientes fica); a que ainda não serve aparece apagada, sem cadeado, e
**acende com uma animação curta** no marco, como as arenas do Clash Royale.

| Marco | Acende | Por quê |
|---|---|---|
| 0 copas | Estádio (JOGAR Relâmpago), Configurações | Um botão, um modo |
| 1ª partida jogada | **Lab** ("você já viu N Pokémon") | A Pokédex deixa de nascer vazia |
| 1ª copa terminada | **Rota** (o balão `rotaNova` já existe), Copa do Dia no trilho, **Sede** (missões, com a 1ª já cumprida) | É quando o jogador entende o draft e quer mais |
| 2ª copa ou 1º título | **Arena** (Duelo); o link de convite continua abrindo direto | Duelo "Meu time" precisa de time |
| 27/11 e 1 copa | Time Ultimate no menu de modos (já é assim) | — |
| ~1 semana antes de 12/01 | Liga (placa, LED, card) | Até lá, some dos 5 lugares; fica só o tópico no menu de modos |

Esforço M; risco médio: quem já tem save não pode ver nada apagar (regra: save com copa acende tudo). Precisa de um
evento de navegação pra conferir o efeito (D6).

### D. Refinar

| # | O quê | Esforço | Risco |
|---|---|---|---|
| D1 | Ponte do Duelo: no fim da série, o convidado sem copa vê "Monte o seu time: Copa Relâmpago" como botão principal | P | Nenhum |
| D2 | Balão `intro` da 2ª visita com 1 passo só | P | Nenhum |
| D3 | Patrocínio na 1ª ida ao Mercado: um balão curto ("Patrocínio rende a copa inteira") | P | Nenhum |
| D4 | Ajuda contextual: o "?" abre a seção da tela onde o jogador está | P | Nenhum |
| D5 | Partida: a aba de tática ao vivo fecha por padrão e mostra só Substituir e Golpe máximo; o resto a 1 toque (nada sai, nada fica automático) | M | Mexe na tela da partida: prints 390/1440 |
| D6 | Medir a navegação: um evento `nav` (aba do ambiente, aba da porta, Novidades, fatia do menu de modos, Ajuda) | P + migração | Migração de produção precisa do ok |
| D7 | Celular novo (33% abriu → jogou, contra 88% no desktop): rodar o fluxo novo em 390 px e ver onde emperra | M | Amostra pequena; confirmar antes |

## 8. Recomendação: 1ª rodada (0.9.45, depois do Time Ultimate)

Só interface, sem motor e sem `ENGINE_VERSION`:

1. **D6** evento `nav` (com o ok da migração), pra medir o antes e o depois.
2. **C** abas acendendo pela progressão, com a Liga escondida até perto de abrir.
3. **B1** Configurações enxutas; **A2 + A3 + D4** Ajuda curta e contextual, sem o passo a passo.
4. **D1** ponte do Duelo; **D2** intro de 1 passo; **D3** balão do Patrocínio.
5. **A1** MT fora do Mercado (passa pela skill de balanceamento, com o ok).

Fica pra 0.9.46: B2 (Metas), B3 (Perfil na Sede) e D5 (tática ao vivo recolhida). **B4 tem prazo:** se for fazer,
é antes de 27/11.

Pra medir: comparar 7 dias antes e depois em "abriu → começou a copa" das novas, `first_leave` na Home, convidados do
Duelo que começam copa e % de sessões que abrem a Rota.

## 9. Decisões pro Miguel (recomendação primeiro)

1. **Abas acendendo pela progressão (C)?** Recomendo sim, sem cadeado, e quem já tem save vê tudo aceso.
2. **Liga some até ~1 semana antes de 12/01?** Recomendo sim; fica só o tópico no menu de modos.
3. **MT sai da vitrine do Mercado (A1)?** Recomendo sim; a MT do ginásio continua na Recompensa.
4. **Time Ultimate com uma moeda só (B4), antes de 27/11?** Recomendo sim: Fichas em tudo, Pontos de pacote saem.
5. **Missões + Medalhas numa tela "Metas" (B2) e Perfil dentro da Sede (B3)?** Recomendo sim, na 0.9.46.
6. **Configurações e Ajuda enxutas, sem o passo a passo de 4 slides (B1, A2, A3)?** Recomendo sim.
7. **Evento `nav` com migração em produção (D6)?** Recomendo sim; sem ele a rodada não tem como ser medida.
8. **JOGAR continua virando "Copa do Dia" pra quem volta?** Recomendo manter (é o que traz gente todo dia), mas com o
   Relâmpago a 1 toque no trilho, como já está.
9. **Modo História "2027" no menu de modos por mais um ano?** Você decidiu manter como cena viva; só confirmo se
   continua valendo depois do feedback.

## Fontes

- Dados: `npm run stats -- --dias 14 --md` (09/11/2026) e consultas de leitura em `public.game_events`.
- Código: `src/ui/ambientes/`, `src/ui/screens/{ModeMenu,Shop,Settings,Help}.tsx`, `src/store/{coach,missions,medals,long-cup}.ts`,
  `src/store/ultimate/rules.ts`, `src/engine/sponsors.ts`, `src/analytics/track.ts`, `src/ui/doors.ts` (branch `v0944`).
- Planos ligados: [revisao-caminho.md](revisao-caminho.md), [funil-boas-vindas.md](funil-boas-vindas.md),
  [revamp-ui.md](revamp-ui.md), [menus-e-sala.md](menus-e-sala.md), [ultimate-team.md](ultimate-team.md).
- Clash Royale: [Deconstructing Clash Royale (Game Developer)](https://www.gamedeveloper.com/business/deconstructing-clash-royale),
  [Onboarding for Games (Apple)](https://developer.apple.com/app-store/onboarding-for-games/),
  [Trophy Road rework (Mobile Matters)](https://mobilematters.gg/clash-royale/clash-royale-trophy-road-rework-level-gates-trophy-floors-champions),
  [June update 2025 (Supercell)](https://supercell.com/en/games/clashroyale/blog/release-notes/june-update-2025/).
- Brawl Stars: [How to unlock new modes (Prima Games)](https://primagames.com/tips/how-unlock-new-modes-brawl-stars),
  [Trophy Road explained (Mobile Matters)](https://mobilematters.gg/guides/brawl-stars/trophy-road-explained).
- Marvel Snap: [Account progression (Untapped)](https://blog.snap.untapped.gg/marvel-snap-wiki-account-progression),
  [The definitive deconstruction (Deconstructor of Fun)](https://deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction).
- Balatro: [How to unlock everything (Prima Games)](https://primagames.com/gaming/how-to-unlock-everything-in-balatro-jokers-decks-vouchers-and-more).
- Slay the Spire: [How to unlock Ascension (Twinfinite)](https://twinfinite.net/guides/slay-the-spire-unlock-ascension-how/),
  [Unlock characters in StS2 (Untapped)](https://sts2.untapped.gg/en/guides/how-to-unlock-characters).
- Progressive disclosure: [Built for Mars](https://builtformars.com/ux-glossary/progressive-disclosure),
  [Tutorials as onboarding funnels (Wayline)](https://www.wayline.io/blog/tutorials-onboarding-funnels-ux),
  [First-time user experience (PlaytestCloud)](https://blog.playtestcloud.com/first-time-user-experience-can-make-or-break-your-game/).
