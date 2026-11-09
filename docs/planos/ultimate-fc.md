---
description: Pesquisa e proposta pra deixar o Time Ultimate mais FC antes de 27/11: Meus pacotes (abrir quando quiser, abrir vários), Pokémon Picks (escolha 1 de N) e a interface do hub, com opções e o que cabe antes do congelamento.
---

# Time Ultimate mais FC: Meus pacotes, Pokémon Picks e a interface (pesquisa, 09/11/2026)

Pedido do Miguel (09/11): "quero que tenhamos ainda mais inspiração no FC. não quero ter que abrir os packs na hora que
eles são ganhos, quero que o sistema de packs e pokemon picks seja mais parecido, quero uma INTERFACE EM SI mais
parecida. faça uma pesquisa disso tudo e vamos aplicar".

Só pesquisa: nada de código. Base de leitura: worktree `v0944` (`src/store/ultimate/`, `src/ui/ultimate/`), prints
headless a 390x844 e 1440x900 com `?lab=ultimate` (save novo, 2 pacotes abertos), e a web. Não repete o que já está em
[`ultimate-team.md`](ultimate-team.md) (números), [`pesquisas/fc-ut-sistema.md`](pesquisas/fc-ut-sistema.md) (modos e
calendário), [`pesquisas/ut-menus-e-pendentes.md`](pesquisas/ut-menus-e-pendentes.md) (hub, Clube, Pendentes, já
feitos) e [`pesquisas/ut-walkout.md`](pesquisas/ut-walkout.md) (walkout, já feito).

Limites de sempre: sem dinheiro nenhum ([ADR 0006](../adr/0006-sem-dinheiro-nenhum.md)), sem mercado entre jogadores,
motor igual (nada aqui mexe na partida, `ENGINE_VERSION` não muda), celular primeiro, sem emoji, nada automático no time
do jogador, arte do Soccermon (estrutura e fluxo do FC, nunca arte ou marca da EA). **Calendário:** a 0.9.44 sai em
17/11; de 18 a 26/11 é congelamento (só conserto); o modo abre sozinho em 27/11.

## Resumo

1. **No FC o pacote ganho nunca abre sozinho nem pede pressa:** vai pra **Loja > Meus pacotes** (My Packs), agrupado
   por tipo, e fica lá "enquanto o servidor existir" (fifauteam). A aba só aparece quando tem pacote guardado. Os Player
   Picks moram na mesma lista, como um item igual aos pacotes.
2. **Guardar pacote é cultura no FC:** o pessoal junta pacotes desde novembro pra abrir no TOTY (fórum da EA, guias).
   O nosso já tem o mesmo gancho de graça: o pacote sorteia na hora de abrir, então **pacote guardado e aberto no Natal
   (15/12–05/01) pode sair carta Evento**. É o "guardar pro TOTY" sem dinheiro.
3. **O FC não tem "abrir todos"**: é um pedido antigo da comunidade (fórum da EA, sugestão pro FC 26). A gente pode
   fazer melhor que eles: **Abrir todos** com uma tela de resumo.
4. **Player Pick = "escolha 1 de N"** (2, 3, 5 ou 10; também "2 de 7", "85+"): as opções têm nota mínima garantida,
   você fica com uma e as outras somem. Sai de SBC, objetivos, níveis da temporada e pacotes de prêmio. O **dia 1 do FC
   26 termina num Pick 1 de 5** ("pegue o seu primeiro craque"). É o DNA do Soccermon (o draft da Copa é 1 de 3), e o
   componente já existe (`CardPack` fechado + `k-pick3` em `src/ui/screens/Draft.tsx`).
5. **Por que hoje parece "abrir na hora" (o nosso):** os pacotes já são guardados como contadores (`packs`,
   `extraPacks`, `bigPacks` em `UltimateSave`), mas (a) o pós-jogo tem **"Abrir agora"** como botão principal, (b) não
   existe um lugar "Meus pacotes": a Loja é uma rolagem só com relógio, Grande, compra, escolha de carta e chances
   misturados, (c) o pacote grátis **trava o relógio quando você tem 2 guardados** ("Cheio: o relógio só volta quando você
   abrir um"): isso obriga a abrir, (d) o save novo cai direto na Loja com "Abrir pacote" e (e) o pacote da ponte da Copa
   entra calado (nenhum aviso).
6. **Mudar o formato do save agora é quase de graça:** a fatia `ultimate` já está na produção (0.9.43) mas ninguém
   joga (bandeira desligada até 27/11), então todo save de produção tem a fatia vazia. `ultimateOf` já aceita campo novo
   com padrão. Depois de 27/11, qualquer mudança no formato vira migração com coleção de gente de verdade.
7. **Interface:** a casca do FC já está (hub de blocos, barra embaixo Início · Elenco · Clube · Loja · Metas, Clube com
   filtros, Pendentes, walkout). O que falta pra "cara de FC" é pouco e barato: **carteira no cabeçalho** (hoje um painel
   inteiro), **número nas abas** (hoje só um ponto), **bloco Meus pacotes com a pilha** no Início, **bloco de destaque**
   no topo e o **cartão do time** (nota grande + química).
8. **Recomendação: opção B antes de 17/11** (Meus pacotes + Abrir todos + Pokémon Picks + os ajustes baratos de
   interface), e a opção C (carrossel de destaque, losangos de química, Início de 3 colunas no PC) em dezembro, junto
   do Natal. Se as decisões chegarem depois de 12/11, cai pra A.

## Decidido com o Miguel (09/11)

Escopo: o máximo possível antes de 17/11 ("conseguimos fazer sim no tempo, confia"): **a opção B inteira e o quanto der
da C**. Todas as decisões da seção 8 ficaram na recomendação:

1. B agora + C (o quanto der antes do congelamento).
2. A Loja abre em **Meus pacotes · N**, com **Comprar** no outro segmento.
3. O relógio do pacote grátis guarda até **6** (3 dias fora) e só aí para; o save novo nasce com 2.
4. Pós-jogo: **Continuar** é o principal e **Meus pacotes · N** o secundário; sem "Abrir agora".
5. **Abrir todos** com um walkout só (o da melhor carta) e o resumo ordenado pela nota.
6. Save novo e temporada nova: 2 Mini + **Pick 1 de 5 Prata ou melhor** ("Seu primeiro craque").
7. **Pick do líder** (1 de 3 Prata+ do tipo dele) no lugar do Pacote Grande do líder.
8. Marcos **20 e 40** do passe dão **Pick 1 de 3 Ouro** (10 e 30 seguem Grande).
9. **Pick com pontos** em Comprar: Bronze 10 · Prata 25 · Ouro 60.
10. O Pick **nunca oferece carta que você já tem** (Normal).
11. Revelação com **silhueta "Quem é esse Pokémon?"** (toque vira, "Virar todas"). *Trocada em 09/11 pela carta de
    costas (abaixo).*
12. **Resgatar** fica onde está, mostrando "+N em Meus pacotes".
13. **Aviso da ponte** no resultado da Copa campeã ("+1 Pacote Mini no Time Ultimate").

## Retorno do Miguel na prévia (09/11)

"por que o time ultimate tá abrindo na loja? e sei lá, ainda não me convenceu essa home... pra mim tinha que ter na
home uns quadrados com JOGAR, CLUBE, LOJA, OBJETIVOS, de tamanhos e pesos diferentes. e aí tinha que ter a aba JOGAR,
com todos os modos de jogo, o equivalente ao Squad Battles liberado, o equivalente ao Rivals bloqueado, o equivalente ao
Champions bloqueado também, e tal". E: "nos PPs (Pokémon Picks), queria que a carta estivesse virada, e que as costas
dela tivessem a logo do Soccermon. não a silhueta".

O que mudou (branch `ut-fc`):

- **Abre sempre no Início.** A causa: a aba inicial era `u.cards.length ? 'home' : 'shop'`; o save novo (sem cartas, só
  o Pick do primeiro craque e 2 Mini guardados) caía na Loja. O destaque e o número na aba Loja já avisam dos pacotes.
  Teste: `src/ui/ultimate/hub.test.ts`.
- **Início em blocos de pesos diferentes:** JOGAR é o maior e o único dourado (o botão gordo do kit), com o modo, o time
  rival, "clube · nível · vitória +N" e a meta da vez; Clube (nota grande, química, os 5 titulares, nº de cartas); Loja
  (Meus pacotes · N, o Pick guardado, o relógio do grátis); Metas (a meta com barra, o marco do passe, evolução pronta);
  o destaque (carrossel) largo embaixo; Pendentes em cima, só quando tem. Celular em pé: 2 colunas (JOGAR na largura
  toda, Clube alto à esquerda, Loja e Metas à direita). Deitado e PC: mosaico de 4 colunas (JOGAR 2 x 2). Saiu a barra
  fixa do JOGAR (cobria blocos) e os blocos Evoluções, Temporada e Líderes (viraram linhas de Metas e da aba Jogar).
- **Barra de baixo: Início · Jogar · Clube · Loja · Metas.** O Elenco saiu da barra e virou o 1º segmento do Clube
  (Elenco · Cartas · Pendentes), como o Squad dentro do Club no FC; o bloco Clube do Início abre direto nele.
- **Aba Jogar com os modos** (cartão por modo, arte de sprites e cartas do jogo): **Batalhas de Treinador** (Squad
  Battles, liberado: o jogo contra a IA de sempre, com nível, rival, JOGAR e os Líderes); **Rivais** (Rivals),
  **Elite dos Quatro** (Champions, "Classifique-se em Rivais"), **Draft** (FUT Draft) e **Desafios de Montagem** (SBC)
  em preto e branco com cadeado e "Em breve", sem nada funcionando. EN: Trainer Battles, Rivals, Elite Four, Draft,
  Build Challenges.
- **Pick de costas:** as opções nascem com o verso da carta (o símbolo do Soccermon no escuro, na moldura do metal, o
  mesmo verso do walkout); tocar vira (giro 3D de 450 ms, as duas faces), "Virar todas" vira em sequência (140 ms entre
  uma e outra) e a melhor segue virando com o walkout. Com Reduzir movimento, vira sem giro. O walkout continua com a
  silhueta dele.

## 1. Como o FC faz

Onde não achei fonte e falo do jogo de memória, está marcado **(do jogo, sem fonte)**.

### Pacotes guardados (Loja > Meus pacotes)

- **Loja com 4 abas** trocadas nos gatilhos: **My Packs**, Browse (comprar), Previewed (pacote de prévia aberto e não
  comprado) e FC Points (dinheiro) (fifauteam, FC 26).
- **My Packs** guarda os pacotes fechados e os Player Picks, inclusive os prêmios de Rivals, Squad Battles e Champions;
  **pacotes do mesmo tipo ficam juntos**; a aba só aparece quando tem algo guardado; o pacote fica lá "enquanto os
  servidores existirem" (fifauteam).
- O console mostra só uma quantidade limitada de pacotes de cada vez: abrir libera espaço pros mais velhos (fórum EA).
- **Não existe "abrir todos"**: abre um por vez; um tópico do fórum pede "abrir todos de uma vez" pro FC 26
  (fórum EA, só pelo título).
- Ranked (Rivals, Champions) paga **muitos pacotes de uma vez** (mein-mmo): é daí que vem a pilha.
- Objetivo do evento pode ser resgatado no próprio hub do evento desde o FC 26 ("Objective Linking", EA). No resto, o
  prêmio de objetivo se resgata em Objetivos ("Claim") e o pacote vai pra My Packs **(do jogo, sem fonte)**.

### Tipos de pacote

- FC 26: Promo (janela de tempo; Premium Gold Players quase todo dia, troca às 18h do Reino Unido), Gold, Classic
  (Bronze e Prata premium), rodadas relâmpago com estoque global (fifauteam).
- **FC 27: nome pelo tamanho**, Mini, Small, Large, Jumbo, Giant; caiu a divisão comum/rara e o "mínimo de raras" do
  nome (EA, pitch notes do lançamento). Existe "Giant Gold Pack" como prêmio da divisão 1 de Rivals.
- **Chances na tela** em todo pacote vendido: por categoria ("Ouro 82+"), chance mínima de pelo menos 1, data da última
  atualização; cada abertura é independente (EA, probabilidades).
- Arte do pacote pela cor do conteúdo (bronze, prata, ouro, preto/promo) **(do jogo, sem fonte)**.

### Abrir: walkout e a tela de itens

- Walkout em degraus (ver [`ut-walkout.md`](pesquisas/ut-walkout.md), já feito no nosso).
- Depois da animação, uma **lista de tudo o que saiu, ordenada pela nota**, com ação por item (Enviar ao clube, Venda
  rápida, Listar no mercado, Trocar repetida, Guardar no armazém de SBC) e em lote ("Enviar tudo ao clube", "Vender
  rápido as repetidas intransferíveis") **(do jogo, sem fonte)**. O que não foi resolvido fica em **Itens não
  atribuídos**; item preso ali impede abrir outro pacote (vários relatos no fórum da EA, FC 24–26).
- Repetida não entra no clube (o clube guarda uma de cada): vai pro armazém de SBC (100 vagas, FC 25) ou venda rápida;
  pacote não evita repetida (resposta da EA no fórum).

### Player Picks

- "Escolha 1 de N": 2, 3, 5 ou 10 opções; variantes com nota mínima (82+, 85+, 88+ Ícone/Herói) e de escolher mais de
  uma (2 de 5, 2 de 7) (fifauteam, allthings.how).
- **As que você não escolhe somem**; a escolhida é intransferível (allthings.how).
- **Sai de** SBC, objetivos, níveis da temporada, pacotes de prêmio e da loja; **fica em My Packs** como um pacote
  (fifauteam).
- **Dia 1 do FC 26:** pacote inicial (você escolhe o par de ligas) → walkout do melhor → "Avançar pra pegar o seu
  primeiro craque": **Pick 1 de 5** intransferível (fifauteam, primeiros passos do FC 26).
- "Red Picks" do Champions: réplicas vermelhas de cartas especiais (timesaver.gg).
- A revelação: as N cartas aparecem em fila e viram uma de cada vez com mini-walkout (bandeira, posição, clube), e só
  então o botão de escolher acende **(do jogo, sem fonte)**.

### A interface (o que dá a "cara de FC")

- **Hub** com abas no topo (Home, Play, Squads, SBC, Evolutions, Objectives, Store, Transfers, Club) e o Home em
  mosaico de blocos com estado ("3/5", "termina em 2 d") (ver `ut-menus-e-pendentes.md`, já copiado). FC 26 refez o
  Play: **Para você** (Novo, Continuar jogando, Em breve), Online, Contra a CPU, Contra amigo, Outros; cada modo mostra
  os objetivos dele ao lado (realsport101, EA).
- **FC 27:** Campaign Hub (tudo da promoção atual numa tela), passe com níveis 1–30, teto de 850 pontos por dia, menu
  radial de ações (EA, pitch notes).
- **Dinheiro e moedas sempre no canto de cima**, em todas as telas do modo **(do jogo, sem fonte)**.
- **Bloco de destaque grande** no topo do Home (a promoção da semana, SBC em destaque), trocando sozinho como
  carrossel; os outros blocos são menores **(do jogo, sem fonte)**.
- **Cartão do time** no Elenco: nota do time e química X/33 grandes, losangos por jogador (ver `fc-ut-sistema.md`).
- **Contadores**: número em cima da aba/bloco (pacotes, objetivos pra resgatar), selo "NEW" na carta nova no Clube,
  relógios "termina em 2d 4h", aviso no canto quando um objetivo fecha **(do jogo, sem fonte)**.
- Tipografia condensada em caixa alta nos títulos; cor por raridade (bronze, prata, ouro; cada promoção com a sua).

### O que o pessoal ama e odeia

- **Ama:** a pilha de pacotes guardados pra abrir num evento (fórum EA sobre TOTY; futfc.gg sobre guardar só os
  pacotes bons), o Pick com nota mínima ("sei que vem algo bom, só não sei o quê"), o walkout.
- **Odeia:** sorte de pacote (queixa nº 1, todo ano), chance de TOTY abaixo de 1% nos pacotes da loja (realsport101),
  item preso nos não atribuídos travando a loja (fórum EA), animação longa (o FC 27 encurtou), pay-to-win.
- **Pro Soccermon:** fica o divertido (pilha, Pick, walkout, chance de evento) e fica de fora o que é dinheiro (loja de
  pontos, prévia de pacote pra vender, ofertas com relógio, estoque relâmpago).

## 2. Como o nosso Time Ultimate está hoje (v0944)

### Telas (prints de 09/11, 390x844)

| Aba | Arquivo | O que tem |
|---|---|---|
| (todas) | `Ultimate.tsx` (`Ultimate`) | cabeçalho `MenuHead` com "PRÉVIA" + título em placa (2 linhas), **painel de carteira** (Fichas, Pontos, Cartas), barra embaixo com ponto em Clube/Início/Loja/Metas |
| Início | `Home.tsx` (`Home`) | blocos: Pendentes (só com algo), Elenco (5 sprites, média e química), Loja ("Nenhum pacote agora", relógio), Metas, Evoluções, Temporada, Líderes; JOGAR gordo + chip de nível. Voltando da partida, o `PostGame` em cascata no lugar dos blocos |
| Elenco | `Squad.tsx` | prancheta da Copa (`LineupEditor`), troca por vaga filtrada pela posição, química, capitão |
| Clube | `Club.tsx` | Cartas · N / Pendentes · N, busca, chips de posição, Filtros, Ordem, grade de `FutCard` com fita Titular/Banco |
| Loja | `Ultimate.tsx` (`Packs`), `Shop.tsx`, `Odds` | Primeiros passos compacto, **Pacote Mini** (2 quadradinhos do relógio, "+N ganhos", botão Abrir), **Pacote Grande** (Abrir se tiver), Loja (Mini por 150 Fichas, escolher carta com pontos), Chances. Uma rolagem só |
| Metas | `Goals.tsx`, `Season.tsx` | barra da temporada, objetivos, Evoluções, passe |
| Pacote | `PackMoment.tsx` (`UtPackMoment`) | tela cheia, rasgar arrastando, leque com "Nova"/"Repetida", walkout da melhor, "Guardar no Clube" |

No PC (1440) é a mesma coluna única esticada até ~1030 px; a Loja vira uma rolagem de 2.000 px.

### De onde vem cada pacote e o que acontece

| Origem | Código | Vai pra | Abre quando |
|---|---|---|---|
| Relógio (1 a cada 12 h, máx. 2) | `refill`, `PACK_MAX = 2`, `PACK_INTERVAL_MS` | contador `packs` | quando quiser, **mas com 2 guardados o relógio para** |
| Save novo / temporada nova | `newUltimate` (`packs: PACK_MAX`) | `packs` = 2 | a 1ª tela é a Loja com "Abrir pacote" (`Ultimate`: `tab = 'shop'` sem cartas) |
| Primeiros passos | `firstStep`, `FIRST_STEPS` | só Fichas (20/20/30/30/50) | (não dá pacote) |
| Objetivos dia/semana | `finishMatch` → prêmio em `pending` (`kind: 'prize'`) | Pendentes, espera **Resgatar** → `extraPacks`/`bigPacks` | pós-jogo: "Resgatar tudo" e depois **"Abrir agora"** como botão principal (`PostGame`, `lastPacks`) |
| Passe (marcos pares = Mini; 10/20/30/40 = Grande) | `payPass`, `passReward` | Pendentes → Resgatar | idem |
| 1ª vitória contra líder | `finishMatch` (`GYM_FIRST_BIG`) | Pendentes → Resgatar (Grande) | idem |
| Loja (150 Fichas) | `buyPack` | `extraPacks` | quando quiser |
| Título da Copa (até 2/dia) | `cupBridge` (`game-store.ts`, `status === 'champion'`) | `extraPacks` | quando quiser, **sem nenhum aviso na Copa** |

`openPack` abre um por vez: Mini gasta primeiro o do relógio (pra ele voltar a contar), depois os ganhos; as novas
entram no Clube (`addCards` + `fillTeam` só nas vagas vazias), a repetida vai pros Pendentes, +5 pontos de pacote. Com
30 Pendentes (`PENDING_MAX`) o pacote não abre. O pacote **sorteia na hora de abrir** (`rollPack` com
`ut-pack-${opened}` e `eventAt(now)`): guardar pro Natal já dá chance de Evento.

### Save (`UltimateSave` em `src/store/ultimate/ultimate.ts`)

- Pacotes: `packs` (0..2, relógio), `packAt`, `extraPacks` (Mini ganhos, sem teto), `bigPacks`, `opened` (semente).
- Cartas: `cards`, `team`, `locked`, `pending` (repetidas e prêmios), `sold` (desfazer).
- Fichas e pontos: `fichas`, `packPoints`, `bought` (semente da carta escolhida).
- `ultimateOf` lê campo por campo com padrão (campo novo nasce com o padrão de `newUltimate`, sem subir
  `SAVE_VERSION`); `mergeUltimate` decide nuvem x aparelho por `opened + played + bought`; `rollSeason` zera tudo na
  virada. Teste em `src/store/ultimate/migration.test.ts`.
- **Na produção** (0.9.43) a fatia existe com o padrão (bandeira desligada): ninguém tem carta. Mudar agora = mudar
  `ultimateOf` + teste; depois de 27/11 = migração de verdade.

### "Escolha 1 de N" hoje

- **Copa:** o draft todo é 1 de 3 (`draftOptions`, `playerDraftOptions`, `captainOptions` em `src/engine/draft.ts`),
  mostrado num `CardPack` fechado com `k-pick3` (`Draft.tsx`, `DuelDraft.tsx`, estilos em `src/ui/kit/stage.css`).
- **Time Ultimate:** não tem. O mais perto é "Escolher carta" com pontos (`buyCard`, `PICK_PRICE` 15/40/100): você
  escolhe a espécie direto, sem suspense.

## 3. Mapa FC → Soccermon

| | FC | No Soccermon | Onde |
|---|---|---|---|
| Copiar | Loja > Meus pacotes, agrupado por tipo com "x3", aparece com algo guardado | Loja com 2 segmentos: **Meus pacotes · N** e **Comprar**; Meus pacotes é a entrada da Loja | `Packs()` em `Ultimate.tsx` |
| Copiar | Pacote ganho espera você, sem prazo | todo pacote ganho vai pra pilha; nenhum botão principal de "Abrir agora" | `PostGame` em `Home.tsx` |
| Copiar | Player Pick como item da mesma lista | **Pokémon Pick** em Meus pacotes, ao lado dos pacotes | save `picks` |
| Copiar | Pick com mínimo garantido, as outras somem | "Escolha 1 de 3 · Prata ou melhor", "1 de 5" | `rollPick` (novo) |
| Copiar | Dia 1 termina num Pick 1 de 5 | **"Seu primeiro craque"**: os 2 Mini de boas-vindas + 1 Pick 1 de 5 | `newUltimate` |
| Copiar | Moedas no canto de cima de toda tela | Fichas e pontos em plaquinhas no `MenuHead` (como a `CupBar`); some o painel de carteira | `Ultimate.tsx` |
| Copiar | Número na aba e no bloco | número no lugar do ponto (Loja 3, Clube 2) | `dot` em `Ultimate.tsx` |
| Copiar | Chances na tela | já temos; vão pro segmento Comprar (e um "?" em cada pacote) | `Odds` |
| Adaptar | Sem "abrir todos" (pedido da comunidade) | **Abrir todos**: um rasgo, leque rápido por pacote, walkout só do melhor, resumo ordenado pela nota | `UtPackMoment` |
| Adaptar | Revelação do Pick (cartas viram uma a uma) | **"Quem é esse Pokémon?"**: as opções nascem como silhueta e viram no toque; "Virar todas" | `k-pick3` + `FutCard` |
| Adaptar | Guardar pacote pro TOTY | guardar pro **Natal** (já sorteia na hora de abrir); o bloco do evento avisa "pacotes abertos no Natal podem trazer carta Evento" | `rollPack`, `eventAt` |
| Adaptar | Pick temático (TOTW, Ícone, Herói) | **Pick do líder**: 1ª vitória contra a Misty = escolha 1 de 3 de Água | `GYMS`, `finishMatch` |
| Adaptar | Itens não atribuídos travam a loja | já temos o teto de 30 Pendentes; o "Abrir todos" para quando encher, com o atalho "Vender repetidas" | `pendingFull` |
| Adaptar | Repetida vira moeda (venda rápida) | já é: repetida → Pendentes → pontos de pacote (1/3/8). **Sem "pó" novo**; o Pick nunca oferece repetida | `REPEAT_POINTS` |
| Adaptar | Relógio de pacote do celular (TCG Pocket, máx. 2) | o relógio não trava mais a pilha: o pacote do relógio cai em Meus pacotes, teto maior (proposta 6 = 3 dias) | `PACK_MAX` |
| Não fazer | FC Points, prévia de pacote pra vender, ofertas com relógio, estoque relâmpago, pacote pago | nada disso (ADR 0006) | |
| Não fazer | Pick intransferível x negociável | não existe sem mercado | |
| Não fazer | Pacote sem mínimo (FC 27) | manter o piso | `FLOOR_METAL` |
| Não fazer | Moeda nova (tokens) | só Fichas e pontos de pacote | |
| Não fazer | Pacote que expira | nada expira dentro da temporada; na virada, a pilha zera com o resto (como hoje) | `rollSeason` |

## 4. Fluxo novo

### Meus pacotes

- **Onde:** Loja abre em **Meus pacotes · N** (segmento `bc-seg`); o outro segmento é **Comprar** (Mini por Fichas,
  escolher carta com pontos, Chances). Bloco do Início vira "Meus pacotes" com a pilha desenhada.
- **O que entra:** Mini (relógio + ganhos), Grande, Picks. Uma linha por tipo, com "x3" e de onde veio o último ("do
  passe, marco 20").
- **Relógio:** continua 1 a cada 12 h, mas o pacote pronto conta como guardado na pilha; o relógio só para no teto
  (proposta: **6**, 3 dias fora). Número de economia: precisa do ok (decisão 3). O save novo continua nascendo com 2
  (constante própria, senão o `PACK_MAX` novo daria 6 de boas-vindas).
- **Prêmio:** continua com Resgatar (decisão do Miguel em 02/11); o que muda é o destino ficar visível: "Resgatar
  tudo" mostra "+2 em Meus pacotes" e o pós-jogo tem **Continuar** como botão principal e **Meus pacotes · N** do lado.
  "Abrir agora" sai (ou fica secundário, decisão 4).
- **Ponte da Copa:** aviso no resultado da Copa campeã: "+1 Pacote Mini no Time Ultimate" (só pra quem já abriu o modo).
- **Natal:** o bloco do evento (já existe) ganha a linha "Pacote aberto no Natal pode trazer carta Evento": é o
  convite pra guardar.

### Abrir todos

- Botão "Abrir todos (N)" na linha do tipo (e "Abrir 1" do lado). Um rasgo só; cada pacote sai em leque rápido
  (`TIMING.fast` do `CardPack`); o walkout toca **uma vez**, pra melhor carta de todos (degraus do `walkoutPick`).
- Fim: **resumo** "Saiu de 4 pacotes": grade ordenada pela nota com fita Nova/Repetida, total de pontos ganhos, e dois
  botões: "Guardar no Clube" e "Ver Pendentes (3)". Igual à "lista de itens" do FC, sem o mercado.
- Pendentes cheio no meio: para, abre o que deu, e o resumo diz "Pendentes cheio: venda as repetidas pra abrir o resto".
- Regra pura nova: `openMany(u, now, kind, n)` = `openPack` em laço (mesma semente por `opened`, então abrir 4 de uma
  vez dá as mesmas cartas que abrir 4 um por um). Teste que confere isso.

### Pokémon Picks

| Pick | Opções | Mínimo | De onde sai (proposta, falta o ok) |
|---|---|---|---|
| **Seu primeiro craque** | 1 de 5 | Prata | save novo e temporada nova, junto dos 2 Mini |
| **Pick do líder** | 1 de 3 | Prata, do tipo do líder | 1ª vitória contra cada líder (no lugar do Pacote Grande; Sabrina = 1 de 3 Prata de qualquer tipo, Giovanni = Terra) |
| **Pick de Ouro** | 1 de 3 | Ouro | marcos 20 e 40 do passe (no lugar do Grande; 10 e 30 seguem Grande) |
| **Pick com pontos** (opcional) | 1 de 3 | metal escolhido | Comprar, ao lado de "escolher carta": mais barato que escolher direto (proposta Bronze 10 · Prata 25 · Ouro 60) |
| Pick de Evento (dezembro) | 1 de 3 | Evento | objetivo do Natal |

- **Regras:** opções sem espécie repetida e **nunca uma que você já tem** na edição Normal (o FC não faz isso; a gente
  pode, porque não vende nada); edições com as chances de sempre por carta (Shiny 1/64, Ícone 1%); a escolhida entra no
  Clube pelo `addCards` (enche vaga vazia como o pacote); as outras somem.
- **Determinismo:** semente `ut-pick-${picked}`, e o contador só sobe quando você escolhe. Fechar o jogo com o Pick
  aberto e voltar mostra as mesmas opções (sem "rerrolar" recarregando).
- **Tela:** o `CardPack` fechado com a arte do Pick (cor do mínimo), rasga, as opções nascem como **silhueta** ("Quem é
  esse Pokémon?", a do anime), toque vira uma, "Virar todas" vira o resto, a de Ouro/edição vira com o walkout curto;
  "Escolher" acende quando todas viraram. Confirmação em uma linha ("Ficar com o Arcanine? As outras voltam pro mato").
- **Primeiros passos:** "Abra o 1º pacote" passa a valer também pro Pick (sem passo novo).

### O que muda no save

| Mudança | Campo | Migração |
|---|---|---|
| Pilha de pacotes | **nenhuma**: os contadores `packs`/`extraPacks`/`bigPacks` já são a pilha agrupada por tipo; "de onde veio" sai do último prêmio (`last`) ou fica de fora | não |
| Teto do relógio | `PACK_MAX` (2 → 6) + `PACK_START = 2` | não (`ultimateOf` limita pelo `PACK_MAX`) |
| Picks guardados | `picks: { uid, n, min, type?, from }[]` e `picked: number` | `ultimateOf` com padrão `[]`/`0`; `mergeUltimate` soma `picked` no progresso; `rollSeason` zera; prêmio ganha `pick?` em `UtPrize`; teste em `migration.test.ts` com um save v10 da prévia e `scripts/fixtures/backup-v6-*.json` |
| Abrir todos | nenhum | não |

Nada sobe `SAVE_VERSION` (a fatia já é lida campo por campo). **Feito antes de 27/11, é só isso.** Depois, mexer no
formato dos pacotes (por exemplo, trocar contadores por lista) exigiria converter a pilha de quem já joga.

## 5. A interface nova (rascunhos a 390 px)

`[$]` Fichas, `[*]` pontos de pacote (`HudIcon`), `[spr]` sprite, `[pac]` arte do pacote, `[?]` silhueta.

### Início

```
390 px · Início
┌──────────────────────────────────────────┐
│[<] TIME ULTIMATE · PRÉVIA  [$]420 [*]52 ⚙│ carteira no cabeçalho, título numa linha
│ ┌ DESTAQUE ────────────────────────────┐ │ (C) carrossel; (A/B) 1 bloco fixo:
│ │ [pac][pac][pac]  3 pacotes guardados │ │ o que tem de mais quente agora
│ │ Natal: carta Evento até 05/01        │ │ (pilha > Pick > evento > Pendentes)
│ │                     [Meus pacotes]   │ │
│ └──────────────────────────────────────┘ │
│ ┌ ELENCO ─────── 71 · química +6% ─────┐ │ cartão do time: nota grande
│ │  [spr]  [spr]  [CAP]  [spr]  [spr]   │ │
│ │   GOL    FIX    ALA    ALA    PIV    │ │
│ └──────────────────────────────────────┘ │
│ ┌ MEUS PACOTES  3 ┐ ┌ METAS ────────── 2┐│ número = o que espera você
│ │ Mini x2 Pick x1 │ │ Vença 1 [██░] 0/1 ││
│ │ próximo 03:12   │ │ +40 [$]           ││
│ └─────────────────┘ └───────────────────┘│
│ ┌ EVOLUÇÕES 1/2 ──┐ ┌ TEMPORADA 1 ──────┐│
│ │ Charmander 2/3  │ │ Marco 7/40 [███░] ││
│ └─────────────────┘ └───────────────────┘│
│ ┌ LÍDERES 3/8 [insígnias] ─────────────┐ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │                JOGAR                 │ │ dourado, o único gordo
│ └──────────────────────────────────────┘ │
│        Normal · vitória +50 [$] Nível    │
├───────┬───────┬────────┬───────┬─────────┤
│Início │Elenco │Clube  2│Loja  3│Metas  2 │ número no lugar do ponto
└───────┴───────┴────────┴───────┴─────────┘
```

### Loja > Meus pacotes

```
390 px · Loja
┌──────────────────────────────────────────┐
│[<] TIME ULTIMATE           [$]420 [*]52 ⚙│
│ [ Meus pacotes · 4  |  Comprar ]         │ bc-seg; abre em Meus pacotes
│ ┌──────────────────────────────────────┐ │
│ │[pac] SEU PRIMEIRO CRAQUE         x1  │ │ Pick primeiro (é o mais gostoso)
│ │      Escolha 1 de 5 · Prata+         │ │
│ │                          [Escolher]  │ │ verde
│ ├──────────────────────────────────────┤ │
│ │[pac] PACOTE MINI                 x2  │ │
│ │      3 cartas · 1 Prata+  [?]        │ │ [?] = chances deste pacote
│ │      próximo em 03:12 (até 6)        │ │ o relógio mora aqui
│ │            [Abrir 1]  [Abrir todos]  │ │
│ ├──────────────────────────────────────┤ │
│ │[pac] PACOTE GRANDE               x1  │ │
│ │      5 cartas · 2 Prata+ · do passe  │ │
│ │                          [Abrir 1]   │ │
│ └──────────────────────────────────────┘ │
│ Natal (15/12–05/01): pacote aberto no    │ só perto/durante o evento
│ evento pode trazer carta Evento.         │
├───────┬───────┬────────┬───────┬─────────┤
│Início │Elenco │ Clube  │Loja  4│ Metas   │
└───────┴───────┴────────┴───────┴─────────┘
```

Sem nada guardado: "Nenhum pacote guardado. O próximo chega em 03:12." e o atalho pra Comprar. **Comprar** = o que
hoje está embaixo (Mini por 150 Fichas, escolher carta, Pick com pontos se entrar, Chances).

### Abrir todos: o resumo

```
390 px · depois de "Abrir todos (4)"
┌──────────────────────────────────────────┐
│        SAIU DE 4 PACOTES  · +20 [*]      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │ FutCard sm, ordem pela nota
│ │ 85   │ │ 78   │ │ 72   │ │ 70   │      │
│ │[spr] │ │[spr] │ │[spr] │ │[spr] │      │
│ │ NOVA │ │ NOVA │ │REPET.│ │ NOVA │      │
│ └──────┘ └──────┘ └──────┘ └──────┘      │
│ ┌──────┐ ┌──────┐ ...                    │ (12 cartas: 3 linhas)
│ 9 novas no Clube · 3 repetidas           │
│ ┌──────────────────────────────────────┐ │
│ │          Guardar no Clube            │ │ verde
│ └──────────────────────────────────────┘ │
│            Ver Pendentes (3)             │ terciário
└──────────────────────────────────────────┘
```

### Pokémon Pick

```
390 px · Pick (tela cheia, MomentStage)
┌──────────────────────────────────────────┐
│          SEU PRIMEIRO CRAQUE             │
│       Escolha 1 de 5 · Prata ou melhor   │
│  ┌────┐ ┌────┐ ┌────┐                    │ 5 opções: 3 + 2 (2 + 2 + 1 a 320)
│  │ 74 │ │ ?? │ │ ?? │                    │ silhueta "Quem é esse Pokémon?"
│  │spr │ │[?] │ │[?] │                    │ toque vira
│  │ALA │ │    │ │    │                    │
│  └────┘ └────┘ └────┘                    │
│     ┌────┐ ┌────┐                        │
│     │ ?? │ │ 81 │                        │ Ouro vira com walkout curto
│     │[?] │ │spr │                        │
│     └────┘ └────┘                        │
│            Virar todas                   │ some quando todas viraram
│ ┌──────────────────────────────────────┐ │
│ │      Ficar com o Arcanine (81)       │ │ verde, acende ao escolher
│ └──────────────────────────────────────┘ │
│   As outras voltam pro mato.             │
└──────────────────────────────────────────┘
```

### Pós-jogo

O de hoje fica (cascata ≤ 3 s), só muda o fim: **Resgatar tudo** (com prêmio) → "+2 em Meus pacotes" batendo; depois
**Continuar** (principal) e **Meus pacotes · N** (secundário). Nada abre sozinho nem empurra pra abrir.

### Elenco e Clube

- **Elenco:** cartão do time em cima da prancheta ("71 · química +6%", nota grande, como o bloco do Início). Losangos de
  química por carta só na opção C (visual de carta: galeria `?cards=1` antes).
- **Clube:** selo **Nova** na carta que chegou desde a última visita (some ao ver), como o "NEW" do FC. O resto já está
  feito (filtros, ordem, Pendentes).

### Celular deitado e PC

- **Deitado (844x390):** Meus pacotes em duas colunas (lista à esquerda, detalhes/chances do tipo tocado à direita);
  o Pick com as 5 opções numa linha só; o resumo do Abrir todos em 6 por linha.
- **PC (1440):** hoje é uma coluna esticada. Na A/B: largura máxima de leitura (~760 px) pra Loja e Metas, e a pilha de
  Meus pacotes com as artes maiores. Na C: **Início em 3 colunas** (Elenco grande com a quadra à esquerda; destaque e
  JOGAR no meio; blocos à direita), a barra embaixo continua (decisão de 01/11, igual aos ambientes).

## 6. Opções

| Opção | O que entra | Esforço | Risco | Save | Antes de 17/11? |
|---|---|---|---|---|---|
| **A. Meus pacotes** | Loja em 2 segmentos (Meus pacotes / Comprar), pilha por tipo com "x2", Abrir todos com resumo, relógio que não trava a pilha (teto 6), pós-jogo sem "Abrir agora" como principal, aviso da ponte na Copa, carteira no cabeçalho, número nas abas, bloco Meus pacotes no Início | 2–3 dias; `Ultimate.tsx`, `Home.tsx`, `PackMoment.tsx`, `rules.ts`, `ultimate.ts` (`openMany`), i18n PT/EN, tela de resultado da Copa | baixo: tela + 1 número (teto do relógio, ok do Miguel) | não | **sim**, folgado |
| **B. A + Pokémon Picks (recomendada)** | A + Picks guardados em Meus pacotes (Primeiro craque 1 de 5, Pick do líder, Pick de Ouro nos marcos 20/40, Pick com pontos opcional), tela de revelação com silhueta, bloco de destaque fixo no Início, selo Nova no Clube, cartão do time no Elenco | +3–4 dias (6–7 no total); + `PickMoment.tsx` novo (reusa `CardPack`/`k-pick3`/`FutCard`), `rollPick`/`choosePick`, `finishMatch`/`payPass` (prêmios), testes | médio: muda prêmio de líder e de 2 marcos do passe (números com ok) e mexe na fatia do save; tudo local, motor igual | `picks` + `picked` no `ultimateOf` (padrão vazio, sem `SAVE_VERSION`) | **sim, apertado**: precisa das decisões até ~11/11 e de 1–2 dias de playtest na prévia antes de 17/11 |
| C. B + interface FC completa | B + carrossel de destaque (evento, Pick, pilha, Pendentes), losangos de química 0–3 e "X/15" no Elenco (galeria antes), Início de 3 colunas no PC, aviso no canto quando um objetivo fecha fora do pós-jogo, Pick de Evento no Natal, Picks "2 de 5" | +5–7 dias | médio-alto: visual de carta (galeria), muita tela nova em cima do congelamento | igual à B | **não**: dezembro (junto do Natal, 15/12) |

## 7. Recomendação

**B antes de 17/11, C em dezembro.** Motivos: é exatamente o que o Miguel pediu (pacote guardado, Pick, cara de FC);
mexer na fatia do save agora é de graça e depois de 27/11 não é; nada toca no motor; o Pick reaproveita o pick da
Copa, que já é a cara do jogo; e o Natal (15/12) é o momento certo pra C, quando a pilha guardada ganha motivo.

Ordem dentro da B (cada etapa jogável na prévia, `?lab=ultimate`):

1. **Dia 1–2:** Loja em 2 segmentos + pilha + Abrir todos + resumo; pós-jogo com Continuar; aviso da ponte; carteira no
   cabeçalho e números nas abas. (Isso sozinho já é a A: se apertar, sobe só isso.)
2. **Dia 3–5:** Picks (regra pura com teste de determinismo e de "nunca repete"), tela de revelação, Primeiro craque no
   save novo, prêmios de líder e passe trocados.
3. **Dia 6:** bloco de destaque, selo Nova, cartão do time; prints 320/390/844x390/1440.
4. **Dia 7–8 (até 17/11):** playtest do Miguel na prévia; o que não passar fica fora da 0.9.44 (regra "pode subir só o
   aprovado").

Se as decisões chegarem depois de 12/11: só a A antes de 17/11, e os Picks em dezembro (aí com conversão de save, mas
pequena: um campo novo com padrão vazio continua sem migração de verdade).

## 8. Decisões pro Miguel (recomendação primeiro)

1. **Escopo:** B antes de 17/11 e C em dezembro **(recomendado)** / só A agora / tudo depois de 27/11.
2. **Loja:** abre em "Meus pacotes · N", com "Comprar" no outro segmento **(recomendado)** / aba própria "Pacotes" na
   barra (6 abas).
3. **Relógio do pacote grátis:** continua 1 a cada 12 h, mas guarda até **6** (3 dias fora) e só aí para **(recomendado)**
   / continua 2 / sem teto. (Número de economia: quem joga a cada 2–3 dias ganha mais pacotes que hoje.)
4. **Pós-jogo:** Continuar principal + "Meus pacotes · N" secundário, sem "Abrir agora" **(recomendado)** / manter
   "Abrir agora" como secundário.
5. **Abrir todos** com um walkout só (o da melhor carta) e resumo ordenado pela nota **(recomendado)** / walkout de cada
   carta boa / não ter.
6. **Primeiro craque:** save novo e temporada nova ganham 2 Mini + **Pick 1 de 5 Prata ou melhor** **(recomendado)** /
   1 de 3 / sem Pick inicial.
7. **Pick do líder** (1ª vitória: insígnia + escolha 1 de 3 Prata+ do tipo dele, no lugar do Pacote Grande)
   **(recomendado)** / manter o Grande / os dois.
8. **Passe:** marcos 20 e 40 dão Pick 1 de 3 Ouro no lugar do Grande (10 e 30 seguem Grande) **(recomendado)** / passe
   como está.
9. **Pick com pontos** em Comprar (1 de 3 do metal: Bronze 10 · Prata 25 · Ouro 60, ao lado do "escolher carta")
   **(recomendado)** / não ter (só "escolher carta").
10. **Pick nunca oferece carta que você já tem** (Normal) **(recomendado)** / pode repetir como o FC (a repetida vai pros
    Pendentes).
11. **Revelação "Quem é esse Pokémon?"** (silhueta, toque vira, "Virar todas") **(recomendado)** / as opções já abertas
    como no draft da Copa.
12. **Resgatar:** fica onde está (Pendentes e pós-jogo), só mostrando "+N em Meus pacotes" **(recomendado)** / prêmio
    vai direto pra Meus pacotes sem Resgatar / mover o Resgatar pra Metas (como o "Claim" do FC).
13. **Aviso da ponte** no resultado da Copa campeã ("+1 Pacote Mini no Time Ultimate") **(recomendado)** / calado como
    hoje.

## Fontes

- [EA, Pitch Notes: FC 27 Launch Update (nomes Mini a Giant, sem mínimo de raras, Holográficas, Streamlined SBC, passe 1–30)](https://www.ea.com/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-launch-update)
- [EA, Pitch Notes: FC 26 FUT Deep Dive (Event Hub, Objective Linking)](https://www.ea.com/en/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-fut-deep-dive)
- [EA, probabilidades dos pacotes](https://www.ea.com/seed/news/fc-pack-probabilities)
- [FIFA Uteam, Loja do FC 26 (My Packs, Previewed, agrupado por tipo, sem prazo)](https://fifauteam.com/fc-26-store/)
- [FIFA Uteam, pacotes do FC 26](https://fifauteam.com/fc-26-packs-ultimate-team/)
- [FIFA Uteam, Player Picks do FC 26](https://fifauteam.com/fc-26-player-picks/)
- [FIFA Uteam, primeiros passos do FC 26 (Pick 1 de 5 no dia 1)](https://fifauteam.com/fc-26-ultimate-team-day-one-walkthrough)
- [allthings.how, Player Picks de SBC do FC 26 (as outras somem, nota mínima)](https://allthings.how/fc-26-93-uefa-winners-ptg-and-star-performer-player-pick-every-sbc-reward/)
- [timesaver.gg, Player Picks e Red Picks no FC 26](https://timesaver.gg/blog/ea-fc-26-player-picks-red-picks)
- [realsport101, o menu novo do UT no FC 26](https://realsport101.com/article/fc-26s-new-ui-a-deep-dive-into-the-redesigned-ultimate-team-menu)
- [realsport101, chance de TOTY abaixo de 1% nos pacotes do FIFA 23](https://realsport101.com/article/fifa-23-fans-fuming-as-toty-pack-weight-is-at-all-time-low)
- [mein-mmo, FC 25: TOTY e como juntar pacotes](https://mein-mmo.de/en/ea-fc-25-complete-toty-is-here-3-tips-to-get-more-packs,1219407)
- [futfc.gg, guardar pacotes pro TOTY](https://futfc.gg/toty-is-coming-how-to-grind-save-and-keep-your-sanity/)
- [vocal.media, guia pré-TOTS do FC 26 (guardar pacotes)](https://vocal.media/gamers/f-c26-pre-tots-tactical-guide-navigating-the-market-slump-and-sbc-strategy)
- [Fórum EA, guardar pacotes desde novembro pro TOTY (FC 26)](https://forums.ea.com/discussions/fc-26-feedback-en/fc-26-team-of-the-year---share-your-feedback/13136963/replies/13143250)
- [Fórum EA, "Missing packs": o console mostra um número limitado de pacotes (FC 26)](https://forums.ea.com/discussions/fc-26-ultimate-team-en/missing-packs/13098096)
- [Fórum EA, sugestão de abrir pacotes todos de uma vez no FC 26](https://forums.ea.com/discussions/fc-25-general-discussion-en/suggestion-to-open-packs-in-ea-fc26/12249649)
- [Fórum EA, item preso nos não atribuídos impede abrir pacote (FC 26)](https://forums.ea.com/discussions/fc-26-ultimate-team-en/evo-item-stuck-in-unassigned-preventing-me-from-opening-packs-/13314047)
- [Fórum EA, dois itens presos travam a loja (FC 26)](https://forums.ea.com/discussions/fc-26-technical-issues-en/two-bugged-evo-items-blocking-store--can%e2%80%99t-open-packs-or-buy-anything-ps5/13179636)
- [Fórum EA, pacote não evita repetida (FC 26)](https://forums.ea.com/discussions/fc-26-ultimate-team-en/pack-luck-and-duplicates/13350305/replies/13351193)

Nota de método: o fórum da EA bloqueou a leitura direta (403) e o Reddit não foi aberto; o que vem do fórum é pelo
título e pelos trechos da busca. Os guias não descrevem a tela de itens depois do pacote, a revelação do Pick nem o
layout do Home: esses pontos estão marcados "(do jogo, sem fonte)". Prints do estado de hoje no scratchpad da sessão
(não vão pro repo).
