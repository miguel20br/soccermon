---
description: Pesquisa do hub, do Clube (My Club), do Elenco por posição e das cartas pendentes (venda rápida, mercado, resgatar) do UT do FC pro Time Ultimate.
---

# Time Ultimate: hub, Clube, Elenco e cartas pendentes (pesquisa, 02/11/2026)

Pedido do Miguel (02/11), depois de jogar a prévia: "não gosto do layout dos menus, tão todos juntos e não tem um menu
principal. Também não gosto dos reservas estarem todos juntos sem filtro nem nada, e sem posição. Queria que fosse
muuuito mais inspirado nos menus do Ultimate Team. [...] Também tem o sistema de cartas pendentes pra dar quick sell,
colocar no mercado e resgatar, quero todos esses menus e sistemas aqui."

Só pesquisa, nada de código. Não repete o que já está em [`ultimate-team.md`](../ultimate-team.md) (números),
[`fc-ut-sistema.md`](fc-ut-sistema.md) (modos e calendário) e [`menus-fc-e-aclamados.md`](menus-fc-e-aclamados.md)
(walkout, pós-jogo, palco). Limites: sem dinheiro nenhum ([ADR 0006](../../adr/0006-sem-dinheiro-nenhum.md)),
Supabase grátis, nada de servidor de leilão, celular primeiro, sem emoji, kit da transmissão
([brand guide](../../marca/brand-guide.md)).

## Resumo

1. **O que falta é o "Home" do FC.** Hoje o modo é uma tela só com 5 abas de pasta em cima (`Tab` em
   `src/ui/ultimate/Ultimate.tsx`: Pacotes, Coleção, Time, Metas, Jogar) e carteira + temporada empilhadas em cima
   delas. Não existe uma tela que diga "o que tem pra fazer agora". No FC o Home é um mosaico de blocos (Elenco, Loja,
   SBC, Objetivos, Evoluções, Temporada, Mercado, Clube), cada um com o estado dele, e o resto do modo é navegação.
2. **"Clube" no FC é a coleção** (My Club), não a arena. Em 01/11 a gente chamou de "Clube" o palco de entrada
   (`menus-fc-e-aclamados.md`, B). Pra ficar "muito mais FC", o certo é trocar: **Início** = o hub, **Clube** = as
   cartas, com busca, filtros e ordenação.
3. **A reclamação dos reservas é a falta da busca por posição.** No FC, tocar numa vaga do Elenco abre o Clube já
   filtrado pela posição da vaga, ordenado pela nota. O nosso motor já tem tudo pra isso: posição principal +
   alternativas (`instancePositions`), nota na vaga (`slotRating` em `src/engine/instance.ts`) e o fator de fora de
   posição (`positionFactor` em `src/engine/attributes.ts`). Falta só a tela.
4. **Pendentes = "Itens não atribuídos".** No FC tudo que sai do pacote cai ali; o que é novo vai pro clube, a
   repetida não pode ir (o clube só guarda uma de cada) e tem que ser vendida rápido, listada no mercado, guardada ou
   trocada. Hoje a nossa repetida vira pontos de pacote sozinha em `openPack` (`src/store/ultimate/ultimate.ts`),
   sem o jogador ver nem decidir.
5. **Nossas repetidas não são idênticas:** `createInstance` sorteia a habilidade (oculta 1 em 5). Então "Trocar pela
   do clube" (o swap do FC) tem sentido de verdade: a repetida pode vir com a habilidade oculta.
6. **Mercado entre jogadores não dá:** as cartas nascem no aparelho (semente do save, tabela `saves` que cada um
   escreve) e o Supabase tem login anônimo ligado (ADR 0003). Qualquer um edita o save e lista um Mew Ícone, ou
   farma contas anônimas pra mandar carta pra principal. Mercado de verdade exige inventário no servidor, que é
   reescrever o modo. E carta com valor fora do jogo puxa venda por Pix, que bate de frente com o ADR 0006.
7. **Mercado contra a IA dá, e é local:** "Transferências" onde você lista a repetida por Fichas dentro da faixa do
   metal e compradores da IA levam no fim das partidas. Quem trapaceia trapaceia só pra si (como já é hoje).
8. **Agora é a hora barata de mudar o save:** o modo ainda não abriu (27/11), então não tem save de jogador com
   Pendentes pra migrar; só as prévias.

## 1. O hub do UT (FC 24, 25, 26) e o que ele vira aqui

### Como é no FC

Do jeito que aparece nos jogos e nos guias (a lista de abas de cima vem de memória dos jogos e de prints; nenhum guia
oficial lista as abas, ver Fontes):

- **Console (FC 24/25):** abas no topo trocadas nos gatilhos: Home, Play, Squads (Elenco), SBC, Evolutions,
  Objectives, Store, Transfers, Club. O **Home** é um mosaico: blocos grandes pro que está quente (promoção da loja,
  SBC em destaque, progresso da temporada, objetivos perto de fechar) e blocos pequenos pro resto. Cada bloco mostra
  um estado ("3/5", "termina em 2 d"), não só o nome. Atalho de navegação rápida (L2/LT) leva direto a Club,
  Stadium e às pilhas (Unassigned, Transfer List, Transfer Targets).
- **FC 26:** refez o menu de jogar do zero (o do FC 25 era "desajeitado e lento"): **Para você** (Novo, Continuar
  jogando, Em breve), Online, Contra a CPU, Contra amigo, e cada modo mostra os objetivos dele ao lado (realsport101).
  Correção que diz muito: voltar da Loja ou dos Objetivos devolve pra tela de onde se veio.
- **Web app e app companion:** as mesmas peças sem o Jogar: Squads, Transfers, SBC, Store e Club (com o Stadium e a
  "Quick Sell Recovery" dentro do Club). No celular, uma barra de seções fixa; o Home tem atalhos pro elenco, SBC e
  mercado (Beebom, mein-mmo).
- **FC Mobile:** o estudo de UI citado nas fontes reclama exatamente do que o Miguel reclamou ("home lotada,
  navegação que não é pensada no jogador") e propõe abas por função pra desafogar a tela inicial.

O que copiar: **um Home com blocos que dizem o estado**, uma barra fixa com 5 lugares, e voltar sempre pro lugar de
onde se veio.

### Como mapear pro nosso

| FC | Nosso (já existe) | Onde está hoje | Onde vai |
|---|---|---|---|
| Home | nada (é o que falta) | | **Início** (aba 1, entrada) |
| Play | `Play()` com nível, rival, tabela de prêmio, líderes (`Gyms`) | aba Jogar | botão JOGAR gordo no Início; nível no subtítulo (sheet) |
| Squads | `Team()` + `LineupEditor` + `Chemistry` + `Reserves()` | aba Time | **Elenco** (aba 2), com troca por vaga filtrada pela posição |
| Club | `Collection()` (grade sem filtro, ordenada por nota) | aba Coleção | **Clube** (aba 3), com busca, filtros, ordem e Pendentes |
| Unassigned | nada (repetida vira ponto sozinha em `openPack`) | | **Pendentes** dentro do Clube + bloco no Início quando tiver |
| Store | `Packs()`, `Shop()` (carta com pontos, pacote com Fichas), `Odds()` | aba Pacotes | **Loja** (aba 4) |
| Objectives | `Goals()`, `FirstSteps` | aba Metas | **Metas** (aba 5) |
| Evolutions | `Evolutions()` dentro de `Goals.tsx` | aba Metas | continua em Metas; bloco próprio no Início |
| Season / passe | `SeasonBar`, `Pass()` em `Season.tsx` | barra em cima de tudo | bloco no Início, tela cheia ao tocar |
| Live events / Rivals | `Gyms` (líderes) | dentro do Jogar | bloco "Líderes 3/8" no Início |
| Transfers | nada | | bloco no Início (opção C) |
| Galeria (FC 27) | Álbum do Perfil (`binder.ts`, recebe `'ultimate'`) | Perfil | bloco pequeno no Início que leva pro Álbum |

A carteira (`ut-wallet`: Fichas, pontos, cartas) sai do corpo da tela e vai pra barra de cima, em plaquinhas com
número contornado, como a `CupBar` faz com ₽ e sorteios.

A barra embaixo já foi decidida em 01/11 (`menus-fc-e-aclamados.md`, decisão 2: "abas embaixo, igual aos
ambientes"). O que muda é o conteúdo: em vez de Pacotes | Coleção | CLUBE | Time | Metas, fica
**Início | Elenco | Clube | Loja | Metas**, com o Início como entrada (o palco com os 5 titulares de 01/11 mora no
bloco do Elenco do Início). Reusa o esqueleto dos ambientes (`src/ui/ambientes/Ambientes.tsx`, `nav.ts`: `TABS`,
`START`, `dragPos`) com outra lista de abas.

### Wireframe: Início (390 px)

`[$]` = ícone de Fichas, `[*]` = pontos de pacote (`HudIcon`); `[spr]` = `FieldSprite`.

```
390 px · Início (hub do Time Ultimate)
┌──────────────────────────────────────────┐
│[<] Time Ultimate   [$]420 [*]52 [≡][?][⚙]│ carteira na barra
│ ┌ PENDENTES · 3 ───────────────────────┐ │ só aparece se tiver
│ │ 2 repetidas · 1 prêmio    [Resolver] │ │ leva pro Clube > Pendentes
│ └──────────────────────────────────────┘ │
│ ┌ ELENCO ── média 71 · química +6% ────┐ │ toque = Elenco
│ │ ░░ quadra do clube ░░░░░░░░░░░░░░░░░ │ │
│ │  [spr]  [spr]  [CAP]  [spr]  [spr]   │ │ os 5 titulares
│ │   GOL    FIX    ALA    ALA    PIV    │ │
│ └──────────────────────────────────────┘ │
│ ┌ LOJA ───────────┐ ┌ METAS ───────────┐ │
│ │ [pac] Mini 2/2  │ │ Vença 1 [██░] 0/1│ │ o mais perto de fechar
│ │ próximo 03:12   │ │ +40 [$]          │ │
│ └─────────────────┘ └──────────────────┘ │
│ ┌ EVOLUÇÕES 1/2 ──┐ ┌ TEMPORADA 1 ─────┐ │
│ │ Charmander 2/3  │ │ Marco 7/40 [███░]│ │
│ └─────────────────┘ └──────────────────┘ │
│ ┌ LÍDERES 3/8 ────┐ ┌ TRANSFERÊNCIAS ──┐ │ opção C; antes, Álbum
│ │ [insígnias]     │ │ 1 vendida  +45   │ │
│ └─────────────────┘ └──────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │                JOGAR                 │ │ dourado, o único gordo
│ │       Normal · vitória +50 [$]       │ │ toque no subtítulo = nível
│ └──────────────────────────────────────┘ │
├───────┬───────┬────────┬───────┬─────────┤
│Início │Elenco │ Clube •│ Loja  │ Metas • │ • = tem coisa pra resolver
└───────┴───────┴────────┴───────┴─────────┘
```

Blocos com estado, título simples (Galmuri11 Bold, `.bc-caption`), `.bc-surface`, barra `k-bar` dentro. Ordem dos
blocos fixa (memória muscular); o de Pendentes é o único que entra e sai. Deitado (844x390) o Início vira duas
colunas: Elenco + JOGAR à esquerda, a grade de blocos à direita. Desktop: a barra de baixo continua (igual aos
ambientes).

## 2. O Clube (My Club) e o Elenco

### Como é no FC

- **Clube:** abas Jogadores, Staff, Itens (consumíveis, estádio) e o armazém de repetidas (SBC Storage, 100 vagas,
  desde o FC 25). Busca pelo nome; filtros de qualidade (bronze, prata, ouro), raridade (comum, rara, especial),
  posição, nação, liga e clube; ordenação (mais recentes, nota, nome, valor). Uma carta tocada abre as ações:
  Trocar com o elenco, Comparar preço, Listar no mercado, Venda rápida, Ver detalhes, Aplicar consumível, Evolução.
  A busca do clube tem bug conhecido de não mostrar todo mundo (fórum EA), e o FC 26 ganhou pedido de filtro "tem
  Evolução disponível" (fórum EA). Ou seja: o filtro "o que eu posso fazer com essa carta" é o que mais falta lá.
- **Elenco:** 11 titulares + 7 no banco + 5 reservas. Tocar num titular abre "Trocar jogador" com o clube **já
  filtrado pela posição da vaga**, e os de outras posições aparecem com a posição alternativa ou com a química
  zerada. Química 0 a 3 por titular (fora de posição = 0).
- **eFootball:** trava o jogador no menu dele pra não vender ou converter por engano (guia do PES 2020). Bom detalhe
  pra copiar.

### O que temos

- `Collection()` (`Ultimate.tsx`): grade de `FutCard sm` ordenada pela nota, fita Titular/Banco. Sem filtro, sem busca.
- `Reserves()` (`Ultimate.tsx`): lista de chips de todas as cartas fora do time, ordenadas pela nota, sem posição; toque
  numa e depois na vaga (que mostra `posShort` da vaga). É exatamente o "todos juntos sem filtro" do Miguel.
- Time: `TEAM_SIZE = 7`, `STARTERS = 5` (`rules.ts`), `order` = 5 titulares + 2 banco; o motor tem
  `benchSize: 2` em `src/engine/config.ts`.
- Posições: `Position = 'GK' | 'FIXO' | 'ALA' | 'PIVO'`; a carta tem principal + alternativas (`instancePositions`);
  alternativa vale até 98% (`positionFactor`); fora de posição cai pelo `outOfPositionFactor`.
- Filtros prontos pra copiar: o Pokédex do Perfil (`src/ui/profile/DexTab.tsx`) já tem filtro de situação no
  segmentado e o de tipo (`pf-types`, os 18 `TypeIcon`).
- `FutCard` já aceita `modalActions` (ações dentro da carta completa) e `action` (chip embaixo).

### Proposta pro nosso 5v5

**Clube** (aba 3) com dois segmentos em cima (`.bc-seg`): **Cartas · N** e **Pendentes · N**.

| Peça | FC | Nosso |
|---|---|---|
| Busca | nome do jogador | nome do Pokémon ou apelido (`displayName`), `k-field` |
| Posição | posição | chips fixos na tela: Todas, GOL, FIX, ALA, PIV (conta a principal e as alternativas) |
| Qualidade | bronze/prata/ouro | Metal (pela nota, `metalOf`) |
| Raridade | comum/rara/especial | Edição: Normal, Shiny, Ícone, Evento, Destaque |
| Liga / nação / clube | química | Tipo (os 18, é a química de tipo) e, depois, linha evolutiva |
| (não tem) | | Situação: Titular, Banco, Sem uso, Em evolução, Pode evoluir, Trancada |
| Ordem | recentes, nota, nome | Nota (padrão), Nota na posição filtrada, Recentes, Nº da Pokédex, Nome, Mais jogos (`plays`) |

Só os chips de posição ficam sempre à vista; o resto mora numa sheet "Filtros · 2" (o número = quantos estão
ligados) com "Limpar". O filtro escolhido fica lembrado na sessão (é conveniência, não save).

**Ações da carta** (toque abre a carta completa, `modalActions`):

- **Escalar**: abre o quadro do Elenco com as vagas da posição dela acesas.
- **Comparar**: lado a lado com o titular da posição principal dela (atributos, nota na vaga, química).
- **Evoluir / Treinar**: o mesmo `startEvo` da aba Metas, quando dá.
- **Trancar**: não sai na venda rápida nem no "vender todas" (eFootball).
- **Venda rápida**: só fora do time e destrancada, com `ConfirmSheet` ("Vender Charmander? +3 pontos").
- **Listar** (opção C): vai pras Transferências.

**Elenco** (aba 2): o `LineupEditor` de hoje fica (é a prancheta da Copa), mas a troca muda:

- Tocar numa vaga (titular ou banco) abre a sheet "Trocar o ALA", que é o Clube **já filtrado pela posição da vaga**
  e ordenado por `slotRating(carta, vaga)`: primeiro quem tem a posição como principal, depois alternativa (selo
  "alt.", 98%), por último fora de posição em cinza com a nota vermelha. Cada linha mostra a diferença pro titular
  atual (+7 verde, −3 vermelho) e a química que muda. Um chip "Todas" tira o filtro.
- O banco mostra a posição principal de cada um ("Banco · PIV"), como o FC mostra.
- `Reserves()` some. A lista de "reservas" do FC (5 que não vão pro jogo) não precisa existir: no nosso caso as
  reservas são o Clube filtrado. Se faltar, vira "favoritas" depois.
- Banco: **continua 2** (`benchSize` do motor). 3 no banco só no Time Ultimate é possível pelo `MatchConfig`, mas
  muda o resultado das partidas do modo (passa por `soccermon-balanceamento`); o futsal de verdade leva até 9 no
  banco, então não é o realismo que pede.

### Wireframe: Clube (390 px)

```
390 px · Clube (as cartas da temporada)
┌──────────────────────────────────────────┐
│[<] Time Ultimate   [$]420 [*]52 [≡][?][⚙]│
│ [  Cartas · 23  |  Pendentes · 3 •  ]    │ bc-seg
│ ┌ [lupa] Buscar pelo nome ─────────────┐ │ k-field
│ └──────────────────────────────────────┘ │
│ (Todas)(GOL)(FIX)(ALA)(PIV)  [Filtros 2] │ posição sempre à vista
│ Ordem: Nota            Sem uso: 9        │ toque = sheet de ordem
│ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │ 88   │ │ 85   │ │ 79   │               │ FutCard sm, 3 por linha
│ │[spr] │ │[spr] │ │[spr] │               │ (2 por linha em 320 px)
│ │BLAST.│ │MOLTR.│ │ARCAN.│               │
│ │TITUL.│ │BANCO │ │ EVO  │               │ fita: Titular/Banco/Evo/
│ └──────┘ └──────┘ └──────┘               │       cadeado = trancada
│ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │ ...  │ │ ...  │ │ ...  │               │
├───────┬───────┬────────┬───────┬─────────┤
│Início │Elenco │ Clube •│ Loja  │ Metas   │
└───────┴───────┴────────┴───────┴─────────┘
```

```
390 px · Elenco: tocou na vaga do ALA
┌──────────────────────────────────────────┐
│ ═══                                  (x) │ Sheet
│ Trocar o ALA · Pikachu 71                │
│ (ALA)(Todas)          Ordem: nota na vaga│
│ [ico] Jolteon     ALA       78   +7      │ verde
│ [ico] Raichu      ALA       74   +3      │
│ [ico] Sandslash   PIV alt.  70   −1      │ alternativa (98%)
│ [ico] Onix        fora      52  −19      │ cinza, nota vermelha
│                         [Ver no Clube]   │ terciário
└──────────────────────────────────────────┘
```

## 3. Pendentes (Itens não atribuídos)

### Como é no FC

- Tudo que sai do pacote, prêmio de objetivo, SBC ou Evolução cai em **Unassigned**. O que é novo tem "Enviar ao
  clube" (um a um ou "Enviar tudo"). **A repetida não pode ir ao clube** (o clube guarda uma de cada); as saídas
  são: venda rápida (moedas na hora, valor baixo), listar no mercado (se negociável), mandar pro armazém de
  repetidas (SBC Storage, 100 vagas, FC 25; R2/RT manda todas as intransferíveis de uma vez), ou trocar pela do
  clube (swap). Item consumível e moedas em carta pedem **Resgatar** (redeem).
- Enquanto há coisa pendente o jogo não deixa abrir outro pacote (é o que a dica da VideoGamer contorna com a
  recuperação de venda rápida). Quem esquece fica travado; o FC 25 aliviou com o armazém.
- **Venda rápida tem desfazer:** até 7 dias, só jogador, devolvendo as moedas recebidas (help.ea.com); um guia diz 5
  por 31 dias. Existe porque vender a carta errada no "vender todas" é o erro nº 1 (fórum EA, FC 25: vendeu as que
  queria guardar no armazém).
- **Mercado:** preço inicial, compre já, duração de 1 a 12 h (alguns anos com 1 e 3 dias), faixa de preço por carta
  definida pela EA (piso sempre acima da venda rápida), 5% de taxa, "comparar preço" antes de listar, liberação
  gradual pra conta nova (FC 26: jogar 3 partidas num dia).

### O que temos

`openPack` (`src/store/ultimate/ultimate.ts`) já separa: `points[i] > 0` = repetida (`isRepeat`: mesma espécie e
edição), que vira `REPEAT_POINTS` (Bronze 1, Prata 3, Ouro 8) na hora; o resto entra pelo `addCards` → `fillTeam`.
`UtPackMoment` mostra "+3 pontos" batendo. Ou seja, **a venda rápida já existe, só que automática e invisível**. Os
prêmios de objetivo, passe e líder também pagam sozinhos no apito (`finishMatch`; decisão da 0.9.32 tomada sem o
Miguel: "sem botão de resgatar"), e ele agora pede o Resgatar.

### Proposta: a pilha Pendentes

**Quem cai lá:** a repetida do pacote (sempre) e, se ele topar, os prêmios (pacote ganho, Fichas, carta de abertura do
passe). A carta nova vai direto pro clube no "Guardar" do fim do pacote (um toque, como o "Enviar tudo" do FC); o
`fillTeam` continua enchendo só as vagas vazias.

| Ação | Em quê | O que faz | Número |
|---|---|---|---|
| Venda rápida | repetida, ou carta do clube fora do time e destrancada | some e paga na hora | os pontos de hoje (`REPEAT_POINTS` 1/3/8), sem número novo |
| Vender todas as repetidas | a pilha toda | um toque, `ConfirmSheet` com o total; trancadas e prêmios ficam | soma |
| Trocar pela do clube | repetida | a repetida entra, a do clube vira a pendente (vale quando a habilidade é outra, ex. a oculta) | nenhum |
| Resgatar / Resgatar tudo | prêmio | o pacote vai pra Loja, as Fichas pra carteira | os de hoje |
| Listar | repetida (opção C) | vai pras Transferências | faixa por metal |
| Desfazer | a última venda rápida da sessão | volta pra pilha devolvendo os pontos | 1 por vez |

Regras:

- **Teto de 30.** Cheio, o pacote pede pra resolver antes de abrir (como o FC), com o "Vender todas as repetidas"
  na própria sheet. Nada é vendido sozinho (vale o "nada automático" do time do jogador).
- **Virada da temporada** (`rollSeason`): prêmio pendente é resgatado sozinho antes de zerar; repetida pendente zera
  com o resto (como as cartas).
- **Álbum:** continua contando a carta no pacote (`binderAdd` em `ultimateOpenPack`), não no "enviar".
- **Primeiros passos:** "Abra o 1º pacote" passa a explicar a pilha na 1ª repetida (balão do tutorial), sem passo
  novo.

```
390 px · Clube > Pendentes
┌──────────────────────────────────────────┐
│ [  Cartas · 23  |  Pendentes · 3  ]      │
│ Repetida não entra no clube.             │ uma linha, sem manual
│ ┌──────┐ Charmander 66 · Prata           │
│ │[card]│ a do clube tem Blaze, esta tem  │
│ │      │ Solar Power                     │ por que trocar
│ └──────┘ [Vender +3] [Trocar] [Listar]   │ chips k-chip
│ ┌──────┐ Rattata 52 · Bronze             │
│ │[card]│ igual à do clube                │
│ └──────┘ [Vender +1]          [Listar]   │
│ ┌──────┐ Pacote Grande                   │
│ │[pac] │ Vença 6 partidas                │
│ └──────┘                    [Resgatar]   │ verde
│ ┌──────────────────────────────────────┐ │
│ │ Vender as repetidas +4 · Resgatar   │ │ verde, barra do polegar
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### As três saídas pro "mercado" (sem dinheiro e sem leilão)

| | (a) Venda rápida por pontos | (b) Transferências contra a IA | (c) Mercado entre jogadores (Supabase) |
|---|---|---|---|
| O que é | o que já existe, agora com botão | você lista a repetida por Fichas dentro da faixa do metal; compradores da IA levam | leilão de verdade, carta de um vai pro outro |
| Onde roda | local (`ultimate.ts`) | local; preço e chance de venda sorteados pela semente do save | Edge Function + tabelas novas + inventário no servidor |
| Esforço | dentro de A/B | +4 a 6 dias | 3 a 5 semanas |
| Trapaça | só pra si | só pra si | edita o save e lista um Mew Ícone; contas anônimas (ADR 0003) farmam e mandam pra principal |
| Abuso | nenhum | nenhum | carta com valor fora do jogo: venda por Pix, conta à venda (vai contra o ADR 0006) |
| Moderação | nenhuma | nenhuma | preço, bots, denúncia; o Miguel sozinho |
| Supabase grátis | não usa | não usa | cabe no volume (500 MB, 500 mil chamadas), mas pausa após 7 dias parado e prende o modo nele |
| Reset semestral | ok | ok | mercado zera junto; inflação e queda depois de cada promoção (crítica nº 1 do FC) |
| Diversão | baixa (é um botão) | média: ver a venda no pós-jogo dá o gostinho do mercado | alta pra quem curte economia, ruim pra criança de 12 anos |

**Recomendação: (a) agora e (b) em dezembro; (c) não.** Se um dia vier troca entre pessoas, é a "troca entre amigos
com limite" já marcada pra depois (`ultimate-team.md`, jan), e a lição do Pokémon TCG Pocket vale: o sistema de troca
com fichas que custavam cartas destruídas virou a função mais odiada do jogo e foi refeito duas vezes em 2025.

**Como seria o (b), "Transferências":**

- Listar a repetida com um preço dentro da faixa do metal (proposta pro balanceamento, nada aprovado:
  Bronze 10–30, Prata 25–75, Ouro 60–180 Fichas; o piso de cada faixa paga mais que a venda rápida em pontos, como
  no FC). Até 5 listadas ao mesmo tempo.
- Sem relógio de verdade: **cada partida jogada é "um dia de mercado"**. No apito, cada carta listada tem uma chance
  de venda que cai com o preço (no piso quase sempre vende, no teto raramente) e sobe se o tipo dela é o da "semana
  do tipo" (`fc-ut-sistema.md`). Sorteio pelo `Rng` com a semente do save e o número da partida, então é
  determinístico e testável.
- A venda aparece na cascata do pós-jogo ("Charmander vendido · +45 Fichas") e no bloco do Início.
- Não vendeu em 5 partidas, volta pra Pendentes. Sem taxa (taxa é pedágio de economia de dinheiro).
- "Vitrine" de compra da IA (cartas à venda por Fichas, trocando a cada 12 h) fica de fora: a Loja já tem a carta
  escolhida com pontos (`buyCard`), e duas lojas confundem.
- Nome: **Transferências**, porque "Mercado" já é a loja de ₽ da Copa longa (`src/i18n/pt/longCup.ts`).

## 4. O que os outros jogos de carta no celular ensinam (só o que ajuda)

| Jogo | O que faz | Pro Time Ultimate |
|---|---|---|
| FC Mobile | home lotada é a crítica do estudo de UI; a proposta é separar por abas de função | é a reclamação do Miguel: Início com blocos + barra de 5 |
| eFootball | trava o jogador pra não vender ou converter por engano; repetida vira treinador de EXP (hoje "Player Fusion") | **Trancar** no Clube; a ideia "repetida dá Treino na carta do clube" fica como opção futura (mexe em equilíbrio) |
| Marvel Snap | coleção com filtro por custo, poder e "não tenho", ordenações curtas | ordem com poucas opções; o "não tenho" é o Álbum, não o Clube |
| Clash Royale | coleção ordenada por elixir/raridade/arena num botão que alterna; repetida sobe o nível da carta | ordem num botão só que abre sheet; repetida que melhora a carta = mesma ideia do eFootball (decidir depois) |
| Pokémon TCG Pocket | fichário com filtro de tipo e raridade; troca entre jogadores com fichas que custavam cartas: odiado, refeito em 2025 | filtro de tipo com os 18 ícones; não fazer troca com custo destrutivo |

## 5. Onde cada coisa muda no código

| Peça | Arquivo / função | O quê |
|---|---|---|
| Abas | `src/ui/ultimate/Ultimate.tsx`: `Tab`, `TABS`, `TAB_ICON`, `Ultimate()` | `home, squad, club, shop, goals`; barra embaixo no esqueleto dos ambientes (`src/ui/ambientes/Ambientes.tsx`, `nav.ts`, `src/ui/tab-slide.ts`) |
| Início | novo `src/ui/ultimate/Home.tsx` | blocos; puxa de `momentGoal`, `packsReady`, `nextPackIn`, `evoReady`, `passMarksOf`, `gymReady` |
| Jogar | `Play()` em `Ultimate.tsx` | vira o botão do Início + sheet de nível; tabela de prêmio e líderes ficam na sheet |
| Clube | `Collection()` → novo `src/ui/ultimate/Club.tsx` | busca, chips de posição, sheet de filtros (copiar `pf-types` e o segmentado do `DexTab.tsx`), ordem |
| Ações da carta | `FutCard` (`modalActions`) | Escalar, Comparar, Evoluir, Trancar, Venda rápida, Listar |
| Elenco | `Team()`, `Reserves()` em `Ultimate.tsx`; `LineupEditor` em `src/ui/screens/Lineup.tsx` | `Reserves` some; sheet "Trocar o ALA" ordenada por `slotRating`; banco com a posição |
| Pendentes (regra) | `src/store/ultimate/ultimate.ts`: `UltimateSave`, `openPack`, `ultimateOf`, `rollSeason`, `finishMatch` | campo `pending` (cartas e prêmios); `openPack` manda repetida pra lá em vez de pagar; funções puras novas `quickSell`, `swapPending`, `redeem`, `sellAllRepeats`; `locked: string[]` |
| Pendentes (números) | `src/store/ultimate/rules.ts` | `PENDING_MAX = 30`; venda rápida reusa `REPEAT_POINTS`; (C) `LIST_RANGE`, `LIST_MAX`, `LIST_MATCHES` |
| Store | `src/store/game-store.ts` (`ultimateOpenPack` e vizinhos) | ações `ultimateQuickSell`, `ultimateSwap`, `ultimateRedeem`, `ultimateLock` |
| Pacote | `src/ui/ultimate/PackMoment.tsx` | fim: "Guardar" (novas pro clube) + "Pendentes · N" |
| Pós-jogo | cascata em `Ultimate.tsx` (`useCascade`) | "Resgatar" no prêmio; (C) vendas das Transferências |
| Save | `ultimateOf` + `src/store/ultimate/migration.test.ts` | campo novo com padrão vazio; teste com `scripts/fixtures/backup-v6-*.json` e um save v10 da prévia |
| Textos | `src/i18n/pt/ultimate.ts` e o `en` | Início, Elenco, Clube, Pendentes, Venda rápida, Resgatar, Transferências |
| Motor | nada | `ENGINE_VERSION` igual (banco continua 2) |

## 6. Opções

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| **A. A casa do FC** | Início com blocos, barra embaixo (Início, Elenco, Clube, Loja, Metas), Clube com busca/posição/filtros/ordem, Elenco com troca por vaga filtrada pela posição, Pendentes só com repetidas (Vender, Vender todas, Trocar) | 4–5 dias | baixo: só tela e uma lista nova no save; nenhum número novo |
| **B. A + Resgatar e ações da carta (recomendada)** | A + prêmios caem em Pendentes com Resgatar/Resgatar tudo, Trancar, Comparar, venda rápida de carta do clube, teto de 30, desfazer a última venda, tutorial da 1ª repetida | 7–9 dias | médio: muda a decisão da 0.9.32 (prêmio automático) e o pós-jogo; dá pra fechar antes de 27/11 com uns 7 dias de prévia |
| C. B + Transferências contra a IA | B + listar por Fichas na faixa do metal, venda no fim das partidas, bloco e cascata | 12–15 dias | médio-alto: economia nova de Fichas (passa pelo balanceamento); não cabe com folga antes de 27/11 |

(c) mercado entre jogadores: avaliado e descartado (3–5 semanas, trapaça, contas anônimas, Pix).

## 7. Recomendação

**B antes de 27/11, e as Transferências contra a IA (o resto de C) em dezembro, junto das fases e da semana do
tipo.** Motivos: é o que o Miguel reclamou ao jogar (hub, reservas sem posição, pendentes); mexer no save agora é de
graça (ninguém tem o modo ainda); nada disso toca no motor; e o mercado contra a IA fica melhor com a semana do tipo
de dezembro dando demanda.

Ordem dentro de B (cada etapa jogável na prévia):

1. Barra embaixo + Início (2–3 dias).
2. Elenco com a sheet por posição e o banco com posição (1–2 dias).
3. Clube com busca, posição, filtros e ordem (2 dias).
4. Pendentes + ações + Resgatar (2 dias), com os testes das funções puras e da migração.

## 8. Decisões pro Miguel (recomendação primeiro)

1. **Escopo:** B antes de 27/11 e Transferências contra a IA em dezembro **(recomendado)** / só A agora / C inteiro
   antes de 27/11.
2. **Abas embaixo:** Início · Elenco · Clube · Loja · Metas **(recomendado)** / manter Pacotes · Coleção · Time ·
   Metas · Jogar. (Isso troca o nome de 01/11: "Clube" passa a ser as cartas, como no FC; a entrada vira "Início".)
3. **JOGAR:** botão gordo no Início, nível no subtítulo **(recomendado)** / aba própria no centro da barra.
4. **Carta nova do pacote:** vai pro clube no "Guardar", só a repetida fica em Pendentes **(recomendado)** / tudo
   cai em Pendentes e você manda (igual ao FC, um toque a mais por pacote).
5. **Venda rápida paga:** pontos de pacote, os 1/3/8 de hoje **(recomendado)** / Fichas.
6. **Vender carta do clube** (não repetida, fora do time, destrancada, com confirmação) **(recomendado)** / só
   repetida.
7. **Prêmios (objetivos, passe, líderes) com Resgatar** em Pendentes, "Resgatar tudo" num toque e resgate sozinho na
   virada **(recomendado)** / continuam pagando sozinhos no apito.
8. **Pendentes cheio (30):** pede pra resolver antes de abrir pacote **(recomendado)** / sem teto.
9. **Trocar a repetida pela do clube** (habilidade diferente) **(recomendado)** / não ter.
10. **Mercado:** contra a IA, local, "Transferências", em dezembro **(recomendado)** / nunca / entre jogadores (não
    recomendado).
11. **Banco:** 2 como hoje **(recomendado)** / 3 só no Time Ultimate (muda partida, passa pelo balanceamento).
12. **Repetida que melhora a carta do clube** (estilo Clash/eFootball, +Treino): **depois, com números na mesa
    (recomendado)** / já / nunca.

## Fontes

- [realsport101, FC 26's New UI: A Deep Dive into the Redesigned Ultimate Team Menu](https://realsport101.com/article/fc-26s-new-ui-a-deep-dive-into-the-redesigned-ultimate-team-menu)
- [Beebom, EA FC 26 Web and Companion App](https://beebom.com/ea-fc-26-web-companion-app-guide)
- [EA Help, How to use the EA SPORTS FC 26 Web and Companion Apps](https://help.ea.com/help/ea-sports-fc/early-web-and-companion-app-start)
- [mein-mmo, EA FC 26: 4 tips for the web app](https://mein-mmo.de/en/ea-fc-26-4-tips-for-the-web-app-how-to-optimally-start-the-season,1526285)
- [realsport101, FC 26 web app guide](https://realsport101.com/article/fc-26-web-app-your-guide-to-a-head-start-in-ultimate-team)
- [EA Help, Quick Sell Recovery](https://help.ea.com/pl/help/ea-sports-fc/fc-quick-sell-recovery/)
- [GGRecon, Quick sell recovery no FC 24](https://cms.ggrecon.com/guides/ea-fc-24-quick-sell-recovery-get-back-discarded-players/)
- [VideoGamer, How to open packs with unassigned items (FC 24)](https://www.videogamer.com/?p=392024)
- [mein-mmo, EA FC 25 SBC Storage](https://mein-mmo.de/en/ea-fc-25-sbc-storage-how-to-use-the-new-duplicate-feature-in-ultimate-team,1180978)
- [VGC, FC 25 adding duplicate storage](https://www.videogameschronicle.com/news/ea-sports-fc-25-ultimate-team-adding-duplicate-storage-more-evolutions)
- [realsport101, FC 25 duplicates storage update](https://realsport101.com/ea-sports-fc/fc-25-100-duplicates-storage-update/)
- [Fórum EA, SBC storage: perdendo jogadores na venda rápida (FC 25)](https://forums.ea.com/discussions/fc-25-ultimate-team-en/sbc-storage---losing-players-when-using-quick-sell/11483048)
- [Fórum EA, repetida intransferível que não volta pro clube (FC 25)](https://forums.ea.com/discussions/fc-25-technical-issues-en/cannot-restore-untradable-duplicate-to-club/7855291)
- [Fórum EA, pedido de filtro de Evoluções disponíveis (FC 26)](https://forums.ea.com/discussions/fc-26-feedback-en/player-search---available-evolutions-/13021577)
- [Fórum EA, busca do clube no web app não mostra todos (FC 25)](https://forums.ea.com/idea/fc-25-bug-reports-en/club-search-in-web-app-doesnt-show-all-players/12223980)
- [mein-mmo, FIFA 21 esconde o My Club no menu](https://mein-mmo.de/en/fifa-21-hides-my-club-deep-in-the-menu-heres-how-to-find-it-anyway,582207)
- [FIFPlay, FC 26 Transfer Market](https://www.fifplay.com/fc-26-transfer-market/)
- [FIFPlay, Price Ranges](https://www.fifplay.com/glossary/price-ranges/)
- [fifauteam, FC 26 Transfer Market](https://fifauteam.com/fc-26-transfer-market/)
- [Estudo de UI/UX do EA FC Mobile](https://whativylearned.blogspot.com/2024/09/ea-sports-fc-mobile-uiux-study.html)
- [Fórum EA, FC 26: menus mais rápidos](https://forums.ea.com/discussions/fc-26-feedback-en/fc-26--future-fc-games-%E2%80%93-faster-menus-needed/13637025)
- [Konami, manual do PES 2019: myClub (converter em treinador)](https://dds.konami.com/games/manual/pes2019/PS4/en/myclub.html)
- [Magic Game World, PES 2020: treino com repetidos e trava](https://magicgameworld.com/efootball-pes-training-with-duplicate-players)
- [gamingonphone, eFootball 2026: Legacy Transfer](https://gamingonphone.com/guides/efootball-2026-a-guide-to-understanding-and-performing-legacy-transfer)
- [VGC, Pokémon TCG Pocket muda a função mais polêmica](https://www.videogameschronicle.com/news/pokemon-tcg-pocket-is-changing-its-most-controversial-feature/)
- [Shacknews, TCG Pocket tira as Trade Tokens](https://www.shacknews.com/article/143482/pokemon-tcg-pocket-trade-tokens-update)
- [Pokémon Zone, Trade updates (julho de 2025)](https://www.pokemon-zone.com/articles/trade-updates-july-2025/)
- [SnapVault, coleção do Marvel Snap](https://www.snapvault.app/news/snapvault-collection-and-wishlist-guide)
- [Clash Royale Wiki, Cards](https://clashroyale.fandom.com/wiki/Cards)

## Decidido com o Miguel (02/11/2026)

"Tudo como recomendado": opção B antes de 27/11 e Transferências contra a IA em dezembro; abas Início · Elenco · Clube · Loja · Metas;
JOGAR como botão gordo no Início; carta nova vai direto pro Clube e só a repetida fica pendente; venda rápida paga os pontos de
pacote de hoje (1/3/8); pode vender carta do Clube fora do time, com confirmação; prêmios com Resgatar (resgate sozinho na virada
da temporada); teto de 30 pendentes antes de abrir pacote; "Trocar a repetida pela do Clube"; banco continua com 2.

### Último dia da temporada (03/11/2026)

Nas últimas 24 h antes do `end` da temporada (relógio do modo, `utNow`, que respeita `&utnow=`), com prêmio pendente: aviso
vermelho no bloco Pendentes do Início ("Último dia da temporada: resgate N prêmios antes da virada"), ponto na aba Início (o
Clube já tem o dele) e, ao entrar no modo, uma folha (ConfirmSheet) uma vez por dia de Brasília com "Resgatar" que leva aos
Pendentes. Regra em `lastDayPrizes` (`src/store/ultimate/season.ts`, testada dos dois lados da data).
