---
description: Proposta da Copa roguelike: mapa, mercado, eventos e o "algo maior".
---

# Copa roguelike: mapa, loja, eventos e o "algo maior" (proposta, 20/10/2026)

Pedido do Miguel (20/10, depois de conversar com um amigo, e "concordo com TUDO, só não sei como implementar nem se
faz sentido"): hoje o Soccermon é "um joguinho de navegador"; ele quer que continue sendo o **jogo curto de navegador**,
mas que cresça pra **algo maior**. Nada de código antes das decisões do fim.

## O que o amigo sugeriu (texto e áudio)

1. **Mapa estilo Slay the Spire:** casas com tesouro, inimigo, chefe e "?" (pode ser bom ou ruim).
2. **Comprar pacotes de um tipo** (só Fogo, só Água…).
3. **Eventos:** "o jogador X levou um carrinho, está machucado e não joga mais"; "um patrocinador misterioso dá um
   Pokémon muito forte em troca de dois"; "receber dinheiro pra entregar o seu capitão".
4. **Loja estilo Balatro** depois de cada vitória: gastar o dinheiro em carta ou em item; **cupons** mais caros (10)
   que dão vantagem pra copa inteira (mais dinheiro, mais uma carta na loja…).
5. **Copas mais longas**, às vezes.

## O que já temos (e que essas ideias aproveitam)

| Peça | Hoje | Onde |
|---|---|---|
| Copa = corrida curta | draft de 7, 4 partidas (oitavas → final contra a Liga Índigo), perdeu acabou | `src/engine/cup.ts`, `RunState` em `src/store/game-store.ts` |
| Recompensa 1 de 3 (já é Slay the Spire) | depois de cada vitória: contratar do rival, 2 itens, às vezes MT; reroll | `src/engine/rewards.ts`, `Reward.tsx` |
| Pacote de cartas | animação do pacote, raridades, edições (Shiny, Evento, Ícone, Destaque) | `CardPack.tsx`, `src/engine/specials.ts` |
| Tipo da semana | cartas Evento do tipo no draft | `weeklyEventType` |
| Seed | toda copa é uma seed: mesma seed = mesmos rivais e sorteios (Copa do Dia, desafio por link) | `Rng`, `dailySeed` |
| Fôlego e evolução | o time cansa e evolui no meio da partida | motor |

## Referências (o que cada uma ensina pra cá)

- **Slay the Spire** ([mapa](https://slaythespire.wiki.gg/wiki/Map_Generation),
  [tipos de casa](https://slaythespire.wiki.gg/wiki/Map_Locations)): 7 tipos de casa (inimigo, elite, descanso, "?",
  tesouro, loja, chefe); o mapa é fixo pela seed; descanso garantido antes do chefe e tesouro no meio; a graça é
  **escolher a rota** (mais risco = mais recompensa). Distribuição que a comunidade usa como referência: inimigo ~40%,
  "?" ~18%, descanso ~14%, elite ~12%, loja ~8%, tesouro ~8%.
- **Balatro** ([cupons](https://dotesports.com/indies/news/all-balatro-vouchers-effects-how-to-unlock-and-more),
  [economia](https://games.gg/balatro/guides/balatro-economy-guide/)): loja depois de cada fase; **cupom** custa 10,
  vale pra corrida inteira, um por loja, e o comprado libera uma versão mais forte; **pacotes** de 4/6/8;
  **juros** (guardar dinheiro rende até um teto): a decisão "gastar agora ou guardar" é o coração da loja.
- **PokéRogue** (roguelike de Pokémon de navegador, código aberto): ondas de batalha, **loja entre as batalhas**
  (curar custa), itens que acumulam, sem Centro Pokémon de graça: cuidar do time vira habilidade.
- **Rogue Striker** ([anúncio](https://www.gamedeveloper.com/press-release/rogue-striker-announced-for-steam-a-soccer-roguelite-made-in-one-month-for-world-cup-season)):
  roguelite de **futebol** com draft e a corrida em 3 atos (eliminatórias, fase de grupos, mata-mata) com eventos,
  lojas e treino no caminho. Prova que o formato funciona no futebol.

## Como cada sugestão vira jogo no Soccermon

| Sugestão | Como fica aqui | Cuidado |
|---|---|---|
| Mapa | A copa vira um mapa curto, de baixo pra cima: cada linha é uma rodada; você escolhe por onde subir. Casas: **Jogo** (rival comum), **Ginásio** (líder, mais forte, recompensa melhor), **Mercado** (loja), **Treino** (recupera fôlego/lesão ou melhora alguém), **Baú** (pacote grátis), **"?"** (evento), **Final** (Liga Índigo) | partidas continuam sendo partidas de verdade (o mapa só decide quem e o que vem entre elas) |
| Pacote de um tipo | No Mercado: "Pacote Fogo" (3 cartas, 1 escolhe) por ₽, mais caro que o comum; o tipo da semana sai mais barato | não pode virar time de um tipo só sem custo: preço sobe a cada compra |
| Lesão | Evento "?" ou risco depois de um carrinho: o Pokémon fica **machucado** por N partidas (fica no banco, não entra); Treino ou um item (Poção Máxima) cura | **nada automático no seu time**: o jogo avisa e **você** escolhe quem entra. Na primeira versão, lesão só por evento (não muda o motor) |
| Patrocinador misterioso | Evento "?" com escolha: dar 2 do banco por 1 carta forte (às vezes Destaque); ou entregar o capitão por muito ₽ | sempre dá pra recusar; o texto diz exatamente o que você perde |
| Loja + cupons | Depois de cada vitória (ou na casa Mercado): cartas, itens, pacotes, MT e **Patrocínios** (os cupons, com nome de futebol): "Patrocínio da Silph Co.: +2 ₽ por vitória", "Olheiro: +1 carta no Mercado", "Fisioterapeuta: lesão dura 1 a menos"… valem a copa inteira | economia nova: precisa de calibragem junto (preços, quanto se ganha) |
| Copa longa | Duas durações: **Copa rápida** (a de hoje, 4 jogos, ~15 min) e **Copa longa** (mapa com 8 a 10 jogos, ~35 min), escolhe na Nova copa | a Copa do Dia continua rápida e igual pra todo mundo |

Dinheiro do jogo: **₽ (Pokédólar)**, só dentro da copa (some quando ela acaba). Nunca dinheiro de verdade.

## Opções

| Opção | O que entra | Esforço | Risco |
|---|---|---|---|
| A. Loja + eventos na copa de hoje | ₽ por vitória e gol; Mercado depois de cada vitória (no lugar da recompensa, ou junto); 1 evento "?" entre as partidas; pacotes de tipo; Patrocínios | 1 versão | baixo: a copa continua com 4 jogos |
| **B. Copa em mapa (recomendada)** | A + o mapa: a Copa longa com rotas (Jogo, Ginásio, Mercado, Treino, Baú, "?", Final); a Copa rápida vira um mapa curtinho de 4 jogos (ou fica como hoje) | 2 versões | médio: tela nova, economia, calibragem |
| C. Jornada (o "algo maior") | B + atos: Kanto inteiro como corrida longa (os 8 ginásios + Liga Índigo), progresso entre corridas (desbloqueios, como o PokéRogue), e o Modo história em cima disso | 4+ versões | alto: é o jogo grande; melhor depois que B provar que é divertido |

**Recomendação:** B em duas etapas. **Etapa 1 = A** (loja, ₽, eventos, Patrocínios, pacotes de tipo, lesão por
evento) na copa de hoje: dá pra sentir se a economia é divertida sem mexer no formato. **Etapa 2** = o mapa e a Copa
longa. C fica como o caminho pro Modo história (que já está no "Em breve"): a Jornada por Kanto é o mapa da B esticado.

## Ordem sugerida (cada passo é uma versão que dá pra jogar)

1. **₽ e Mercado** depois de cada vitória (cartas, itens, MT, pacote de tipo); a recompensa grátis de hoje continua.
2. **Eventos "?"** entre as partidas (5 a 8 eventos com escolha: patrocinador, lesão, olheiro, torcida, imprensa).
3. **Patrocínios** (cupons) no Mercado.
4. **Copa longa em mapa** (escolher a rota; Ginásio, Treino, Baú).
5. Depois: **Jornada** (atos), desbloqueios entre corridas, Modo história.

## O que muda no código (pra saber o tamanho)

- `RunState` ganha `money`, `sponsors`, `injuries` e, no passo 4, `map` (+ migração do save).
- Tudo sorteado pela seed da copa (`Rng`), como hoje: a Copa do Dia continua igual pra todo mundo.
- Telas novas: Mercado, Evento (caixa de texto do jogo com 2–3 escolhas), Mapa.
- O motor só muda se a lesão vier de dentro da partida (carrinho); na primeira versão, não (evento).
- Calibragem (skill `soccermon-balanceamento`): quanto ₽ por vitória/gol, preços, força dos Patrocínios, com
  antes/depois pro ok do Miguel.

## Decidido com o Miguel (20/10/2026)

"A ideia 2 é INCRÍVEL": a Copa de hoje vira a **Copa rápida**, o mapa é a **Copa longa**, e o **modo Jornada** é o
"algo maior". Ordem: primeiro a etapa 1 (Mercado, eventos, Patrocínios), depois a 2 (mapa). Antes das decisões ele
pediu uma análise do jogo de hoje contra Balatro, Slay the Spire e cia. (abaixo).

## Análise: o jogo de hoje e o que isso agrega (dados de 13 a 20/10)

**Como as pessoas jogam hoje** (`npm run stats -- --dias 7`):

| Sinal | Número | O que diz |
|---|---|---|
| Copas por sessão que começou copa | 444 copas em 82 sessões (**~5,4 por sessão**) | o ciclo curto funciona: quem entra joga de novo, de novo |
| Velocidade da partida | **86% em 8x**, 10% em "Lances" | ninguém assiste a partida inteira: a diversão está **nas decisões e no resultado**, não em ver o jogo |
| Tática | 79% das partidas na "equilibrada" | quase ninguém mexe durante a partida |
| Formação | 1-2-1 em 65% das copas | uma escolha "resolvida": pouca variedade |
| Recompensa entre partidas | 605, só 14% puladas | a única decisão entre os jogos é bem usada |
| Título | 84 em 388 copas terminadas (~22%) | a copa é difícil o bastante pra ter tensão |
| Funil | 45% saem antes de passar as boas-vindas; 56% no celular | quem chega é casual e de celular: tudo novo tem que ser rápido e claro |

**Onde está a diversão:** no **draft** (as escolhas), na **recompensa** e em **ver o time evoluir** ao longo da
copa. A partida é o "dado rolando": as pessoas aceleram pra ver o resultado. Entre as partidas, hoje, só existe
**uma** escolha por vitória (4 por copa).

**O que os jogos de referência fazem que falta aqui:**

| Jogo | O que prende | Equivalente no Soccermon | Falta hoje |
|---|---|---|---|
| **Slay the Spire** | escolher a rota (risco x recompensa), eventos com escolhas difíceis, elites opcionais | o mapa, os eventos "?", o Ginásio | **toda decisão de rota**: hoje o caminho é sempre o mesmo |
| **Balatro** | economia (gastar agora ou guardar), Jokers que mudam as regras e se combinam, loja curta e rápida | ₽, Mercado, **Patrocínios** (os Jokers daqui), sinergias de tipo e de história que já existem | **economia e tensão de guardar**; regras que você monta |
| **PokéRogue** | cuidar do time sem Centro Pokémon, itens que acumulam | Treino, lesão, itens | consequência entre partidas (fôlego e lesão que pesam) |
| **Rogue Striker** | o mesmo formato no futebol: atos, eventos, loja, treino | a Copa longa e a Jornada | — |

**O que isso agrega:**

1. **Mais decisões por minuto onde as pessoas já se divertem** (entre as partidas), sem mexer na partida que elas
   aceleram. Em vez de 4 escolhas por copa, ~12 a 20 na Copa longa.
2. **Copas diferentes entre si:** hoje toda copa é draft → 4 jogos iguais em formato. Com mapa, eventos e
   Patrocínios, cada copa conta uma história ("vendi o capitão pro patrocinador e ganhei a final com o Magikarp").
   É isso que faz o "só mais uma" do Balatro durar meses.
3. **Builds:** os Patrocínios (como os Jokers) mudam regras e se combinam com as sinergias de tipo e os links da
   Gen 1 que já temos. A formação e a tática começam a ter motivo pra mudar.
4. **Um lugar pro "algo maior":** a Jornada é o mapa esticado por Kanto inteiro, e o Modo história nasce em cima.

**Riscos e como evitar:**

- **Complexidade pra quem é casual e de celular** (45% saem nas boas-vindas): a **Copa rápida fica como é** e
  continua sendo o padrão; Mercado e eventos com no máximo 1 tela e 2–3 botões; tutorial na primeira vez.
- **Ficar lento:** cada tela entre partidas tem que se resolver em ~10 s (o mesmo motivo de 86% jogarem em 8x).
- **Economia quebrada** (comprar o time perfeito): preços que sobem a cada compra, limite de Patrocínios, calibrado
  com o `npm run calibrate` antes/depois pro ok do Miguel.
- **Cheiro de loja de dinheiro de verdade:** o ₽ só existe dentro da copa, some quando ela acaba, e nada é vendido
  fora do jogo (o Soccermon nunca cobra).

**Veredito:** **sim, é isso mesmo**, com três ajustes na ordem da etapa 1:

1. **Os Patrocínios são a peça mais importante** (são os Jokers do Balatro: mudam as regras e criam builds). Entram
   junto com o Mercado, não depois.
2. **Medir desde o primeiro dia:** eventos de estatística pra compra no Mercado, Patrocínio escolhido e escolha de
   evento (dá pra ver se as pessoas usam ou pulam).
3. **A Copa rápida ganha só o Mercado** (curto) na etapa 1; os eventos "?" ficam pra Copa longa, pra a rápida
   continuar rápida.

**Decisões aprovadas (20/10):** todas as recomendadas abaixo, com os 3 ajustes do veredito. Plano de implementação em
[copa-roguelike-plano.md](copa-roguelike-plano.md).

## Decisões pro Miguel

1. **Formato:** B em duas etapas (loja/eventos primeiro, mapa depois) **(recomendado)** / A só / ir direto pro mapa.
2. **Copa rápida continua** como hoje, e a **Copa longa** é o mapa **(recomendado)** / toda copa vira mapa.
3. **Recompensa grátis** depois da vitória continua, e o Mercado vem junto **(recomendado)** / o Mercado substitui.
4. **Lesão:** só por evento, sempre com você escolhendo quem entra **(recomendado)** / também por carrinho na
   partida (muda o motor) / sem lesão.
5. **Patrocinador do capitão** (dinheiro em troca do capitão): sim, como evento raro **(recomendado)** / não.
6. **Nome do dinheiro:** ₽ Pokédólar **(recomendado)** / moedas / outro.
7. **Nome dos cupons:** Patrocínios **(recomendado)** / Cupons / Contratos.
8. **Copa do Dia:** continua rápida e sem loja por enquanto **(recomendado)** / ganha a loja também.

## Fontes

- [Slay the Spire wiki: Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation) e
  [Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations)
- [Slay the Spire 2: escolhas de rota](https://sts2.untapped.gg/guides/how-to-make-the-best-map-choices-in-slay-the-spire-2)
- [Balatro: cupons (Dot Esports)](https://dotesports.com/indies/news/all-balatro-vouchers-effects-how-to-unlock-and-more)
  e [economia (games.gg)](https://games.gg/balatro/guides/balatro-economy-guide/)
- [Rogue Striker (Game Developer)](https://www.gamedeveloper.com/press-release/rogue-striker-announced-for-steam-a-soccer-roguelite-made-in-one-month-for-world-cup-season)
- PokéRogue (roguelike de Pokémon de navegador, código aberto, Pagefault Games)
