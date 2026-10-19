# Medalhas com degraus, vitrine, escudo e uniforme (aprovado em 19/10/2026, na 0.8.8)

Itens 12–14 do `relatorio-0.8.6.md` (decididos pelo Miguel em 18/10: medalhas com degraus, vitrine com borda e
cartão, escudo + uniforme; mascote e insígnias não). Tudo **só cosmético**, nada mexe no motor nem em
`ENGINE_VERSION`. **Números aprovados pelo Miguel em 19/10/2026**: estão no código (`src/store/medals.ts`, `src/store/club-kit.ts`)
e mudam com uma linha cada.

## Como funciona

- **Retroativo de verdade:** cada medalha é um número que o save já guarda (Pokédex, carreira, recordes, Hall da
  Fama, missões). O degrau sai na hora, então quem abrir a versão nova já entra com as medalhas do que jogou. Nada
  novo vai pro save, menos o contador `records.duelWins` (o histórico do Duelo guarda só as 30 últimas partidas).
- **Cores:** bronze, prata e ouro iguais aos metais das cartas (`pokecard2.css`); platina holográfica (as cores
  do título holo correndo; para com "reduzir movimento").
- **Onde ver:** Perfil → aba **Medalhas** (atalho `?perfil=medalhas`). Cada medalha mostra o degrau, a barra até o
  próximo e os 4 números.

## As 20 medalhas

| Medalha | O que conta | Bronze | Prata | Ouro | Platina |
|---|---|---:|---:|---:|---:|
| Pokédex | espécies vistas | 40 | 80 | 120 | 151 |
| Elenco | espécies que jogaram pelo seu time | 25 | 60 | 100 | 151 |
| Partidas | partidas jogadas | 10 | 50 | 250 | 1000 |
| Vitórias | partidas vencidas | 5 | 30 | 150 | 600 |
| Artilheiro | gols do seu clube | 100 | 500 | 2000 | 5000 |
| Copas | copas disputadas | 5 | 25 | 100 | 300 |
| Campeão | títulos da Copa | 1 | 5 | 25 | 100 |
| Sequência | títulos seguidos (melhor sequência) | 2 | 3 | 5 | 8 |
| Pênaltis | vitórias nos pênaltis | 1 | 5 | 20 | 50 |
| Evoluções | evoluções no meio da partida | 5 | 25 | 100 | 300 |
| Movedex | golpes descobertos (de 164) | 25 | 60 | 100 | 150 |
| Álbum | figurinhas no álbum (de 622) | 100 | 250 | 400 | 622 |
| Shiny | espécies com a figurinha Shiny | 1 | 5 | 15 | 40 |
| Ícones | cartas Ícone escaladas | 1 | 3 | 10 | 25 |
| Destaques | cartas Destaque conquistadas | 1 | 5 | 15 | 40 |
| Selos | espécies com selo de carreira | 1 | 5 | 15 | 40 |
| Tipos campeões | tipos diferentes entre as espécies campeãs (de 17) | 3 | 7 | 12 | 17 |
| Coleções | coleções temáticas completas (de 9) | 1 | 3 | 6 | 9 |
| Missões | missões cumpridas (de 60) | 10 | 20 | 35 | 60 |
| Duelista | vitórias no Duelo | 1 | 10 | 50 | 200 |

Lógica dos números: o bronze sai em 1–2 copas pra quem está começando (progresso dado), a prata em algumas
semanas, o ouro é meta de quem joga sempre e a platina é "completar" (151, 622, todas as missões) ou um número
absurdo. Pelo placar de 11 a 18/10 (134 copas, 28 títulos no total) quase ninguém passa da prata ainda.

## Vitrine de 3 destaques e moldura do avatar

- O jogador escolhe até **3** entre: medalha (com degrau), coleção temática completa ou selo de carreira de uma
  espécie. Escolha na aba Medalhas.
- Aparece no cartão de treinador (cabeçalho do Perfil) e no **VERSUS do Duelo**, dos dois lados (vai no perfil da
  sala, como a faixa da torcida; o rival manda já com o degrau, e ids desconhecidos são ignorados).
- **Moldura do avatar** = o melhor degrau entre os 3: medalha pelo degrau; selo Folha = bronze, Holo = prata,
  Prisma = ouro, Ouro escuro = platina; **coleção completa = prata**.

## Escudo e uniforme

- **Escudo:** formato (escudo, redondo, hexágono, diamante, flâmula; todos livres) + símbolo + cor do clube (fundo) +
  cor secundária (símbolo). Se as duas cores forem parecidas, o símbolo fica branco ou escuro pra ler.
- **Uniforme:** cor secundária (branco + as 10 do clube, livre) e padrão: liso e listras livres; faixa e meio a meio
  liberados por medalha.
- **Onde aparece:** placar (escudo antes da sigla + a faixa lateral com o padrão), VERSUS (escudo grande + o padrão de
  leve na metade do time), quadra (disco na cor secundária embaixo do Pokémon, dentro do anel na cor do clube; liso =
  o anel de sempre). **Pintar o sprite não:** tingir o Pokémon estraga as cores dele e custa por quadro; o disco é um
  objeto que já existia (o anel), só ganhou preenchimento.
- **Rival:** se a cor bater, entra de reserva **liso** (como já era só com a cor). Os clubes da copa ganham escudo
  com o símbolo do ginásio (Pewter rocha, Cerulean gota, Vermilion raio, Celadon folha, Cinnabar chama, Liga coroa).

### O que libera cada peça

| Peça | Libera com |
|---|---|
| Símbolos pokébola, raio, chama, gota | livres |
| Folha | coleção Iniciais |
| Asa | coleção Pássaros lendários |
| Concha | coleção Fósseis |
| Lua | coleção Eevee |
| Joia | coleção Lendários |
| Punho | coleção Hitmons |
| Chifre | coleção Nidos |
| Rocha | coleção Time do Brock |
| Estrela | coleção Time da Misty |
| Bola | medalha Artilheiro prata (500 gols) |
| Coroa | medalha Campeão prata (5 títulos) |
| Taça | medalha Campeão ouro (25 títulos) |
| Espadas | medalha Duelista bronze (1 vitória no Duelo) |
| Padrões liso e listras | livres |
| Padrão faixa | medalha Vitórias bronze (5 vitórias) |
| Padrão meio a meio | medalha Campeão bronze (1 título) |

## Save e nuvem

- Campos novos **opcionais** no perfil: `clubColor2`, `kitPattern`, `crestShape`, `crestSymbol`, `showcase`; e
  `records.duelWins`. Sem mudança de versão do save: save antigo fica no padrão (o visual de antes). Testado com
  `scripts/fixtures/backup-v6-*.json` (`src/store/medals.test.ts`).
- Nuvem: o perfil continua sendo o do lado que vale, mas o que só um lado escolheu (escudo, uniforme, vitrine,
  faixa) não se perde (`mergeProfileUnlocks`). `duelWins` junta pelo maior, como os outros recordes.

## Atalhos pra ver

- `?demo=colecao` (dev): carreira de mentira, medalhas em vários degraus, escudo e uniforme listrado, vitrine cheia.
  `&perfil=medalhas` abre na aba; `&novo=1` deixa o clube no padrão.
- `?lab=versus` (dev): VERSUS do Duelo com o seu perfil contra um rival de mentira, e o placar embaixo.
  `&clash=1`: rival com a sua cor (entra de reserva).
