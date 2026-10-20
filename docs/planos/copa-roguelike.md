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
