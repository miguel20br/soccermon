---
description: Plano de implementação da Copa roguelike em etapas, com o que o Miguel decidiu.
---

# Copa roguelike: plano de implementação (20/10/2026)

Proposta e análise em [copa-roguelike.md](copa-roguelike.md). **Decidido com o Miguel (20/10):** todas as
recomendadas, mais os 3 ajustes do veredito. Resumo:

- A Copa de hoje vira a **Copa rápida** (continua o padrão); a **Copa longa** é o mapa; a **Jornada** é o "algo maior".
- **Etapa 1** (Copa rápida): **₽ Pokédólar**, **Mercado** depois de cada vitória (a recompensa grátis continua, o
  Mercado vem depois dela), **Patrocínios** (os "Jokers") e **pacotes de tipo**. Estatística de tudo desde o dia 1.
- **Etapa 2**: **Copa longa em mapa** com Ginásio, Treino, Baú, Mercado e **eventos "?"** (lesão só por evento, você
  escolhe quem entra; patrocinador misterioso; capitão por ₽ como evento raro).
- **Copa do Dia** continua rápida e **sem** Mercado por enquanto.
- O ₽ só existe dentro da copa e some quando ela acaba. Nunca dinheiro de verdade.

## Versões

| Versão | O que entra | Pronto quando |
|---|---|---|
| **0.9.0 · Mercado e Patrocínios** | etapa 1 inteira | Miguel aprovou os números, o visual do Patrocínio e o Mercado no `?demo=mercado` |
| **0.9.1 · Copa longa** | mapa, eventos, Ginásio, Treino, Baú, lesão | aprovou o mapa e os eventos no `?demo=mapa` |
| 0.9.x | mais Patrocínios e eventos, ajustes pelos dados | conforme as estatísticas |
| **1.0** | **Jornada** (Kanto inteiro como corrida longa) + Modo história em cima | (o plano de lançamento junta com o "tudo do Em breve") |

(Sair do 0.8.x pra 0.9 marca a mudança de jogo; se preferir continuar no 0.8.x, é só trocar o número.)

## Etapa 1 em detalhe

### Fluxo

Vitória → Resultado → **Recompensa** (grátis, 1 de 3, como hoje) → **Mercado** (novo; dá pra sair na hora) →
Escalação. Não tem Mercado depois da final (a copa acabou) nem na Copa do Dia. Derrota: a copa acaba como hoje.

### Economia (proposta inicial, **calibrar com o Miguel antes de fechar**)

| Ganho | ₽ |
|---|---|
| Vitória | 5 |
| Cada gol (até 3 por partida) | 1 |
| Vitória sem sofrer gol | 2 |
| Juros: a cada 5 ₽ guardados ao entrar no Mercado | 1 (até 3) |

Numa copa normal (3 Mercados: depois das oitavas, quartas e semi) dá ~25 a 35 ₽ no total: um Patrocínio e mais
umas 3 compras, ou 2 Patrocínios se guardar. É a tensão do Balatro: gastar agora ou guardar pros juros e pro
Patrocínio.

| Preço | ₽ |
|---|---|
| Patrocínio | 10 |
| Pokémon avulso | 4 a 7 (pelo metal da carta: bronze 4, prata 5, ouro 7) |
| Pacote de tipo (3 cartas do tipo, você fica com 1) | 6 |
| Item | 3 |
| MT | 5 |
| Trocar a vitrine (reroll) | 2, e +1 a cada vez no mesmo Mercado |

### O Mercado (uma tela, ~10 s)

- **Vitrine com 5 coisas**: 2 Pokémon avulsos, 1 pacote de tipo (o tipo da semana ou o do seu capitão), 1 item ou
  MT, e **1 Patrocínio** em destaque. Embaixo: o seu ₽, "Trocar vitrine" e "Seguir".
- Comprar Pokémon usa o mesmo fluxo de hoje da recompensa (escolher quem sai do banco); item e MT, o mesmo de quem
  recebe; pacote abre com a animação do `CardPack`.
- Sorteado pela seed da copa (`Rng(seed, 'shop-<fase>-r<trocas>')`): mesma copa, mesma vitrine (desafio por link
  continua justo).

### Patrocínios (os Jokers daqui)

- **Até 3 por copa** (3 vagas, como os Jokers do Balatro); comprar o 4º pede pra dispensar um.
- Ficam visíveis na Escalação e no placar da partida (ícone + dica ao tocar).
- Nomes de lugares e empresas **do mundo Pokémon de Kanto** (nunca marca de verdade). Primeira leva (12), em 3
  famílias:

| Patrocínio | Efeito | Família |
|---|---|---|
| Fã-Clube Pokémon | +1 ₽ por gol (sem limite de 3) | economia |
| Cassino de Celadon | juros até 5 (em vez de 3) | economia |
| S.S. Anne | +3 ₽ por vitória | economia |
| Loja de Departamentos | Mercado com 1 coisa a mais na vitrine | economia |
| Laboratório de Cinnabar | a recompensa grátis mostra 4 opções | recompensa |
| Creche Pokémon | a 1ª troca de vitrine de cada Mercado é grátis | recompensa |
| Safari Zone | pacote de tipo com 4 cartas | recompensa |
| Silph Co. | +3 em tudo pros Pokémon do **tipo do capitão** | campo |
| Bicicletaria de Cerulean | +4 de velocidade pros Alas | campo |
| Academia de Saffron | +4 de passe pro time todo | campo |
| Torcida de Vermilion | +3 de força pros Fixos e o Goleiro | campo |
| Patrocínio Master | +2 em tudo pro capitão, e mais +1 por Patrocínio que você tem | campo (combina) |

- Os de **campo** entram pela regra única de bônus (`src/engine/modifiers.ts`, nova origem de modificador, como os
  itens): **carta = campo** continua (a carta mostra o bônus). Partidas sem Patrocínio não mudam (Liga, Duelo e as
  partidas antigas ficam iguais; `ENGINE_VERSION` só sobe se o formato do time mudar).
- **Visual da carta do Patrocínio**: mostrar na galeria (`?cards=1`) antes de espalhar (regra das cartas).

### Save, estatística e servidor

- `RunState` ganha `money`, `sponsors` (ids) e `shop` (vitrine, trocas); `SAVE_VERSION` 10 com migração (copa em
  andamento de antes começa com 0 ₽) e teste com os backups antigos (`scripts/fixtures/backup-v6-*.json`).
- **Estatística**: eventos novos `shop_buy` (o quê, preço, fase), `shop_leave` (₽ guardado) e `sponsor_pick` (qual).
  A lista de eventos aceitos fica no banco (`game_events_name_check`): **migração no Supabase de produção, com o ok
  do Miguel, aplicada antes de publicar** (como a do `share`).
- O placar (`npm run stats`) ganha a seção "Mercado": o que mais se compra, Patrocínios mais escolhidos, ₽ guardado
  e se quem compra Patrocínio ganha mais títulos.

### Calibragem (skill `soccermon-balanceamento`)

- Robô de Mercado no `npm run calibrate` (compra o Patrocínio de campo do seu tipo e cartas de metal maior): mostra a
  taxa de título **antes/depois** (hoje ~22% das copas terminadas). Meta proposta: subir pra ~28–32% quem usa bem o
  Mercado, sem passar de 40%.
- Números e a lista de Patrocínios voltam pro Miguel com antes/depois **antes** de fechar.

### Ordem de trabalho e pontos de conferência

1. **Números e Patrocínios** (este doc): ok do Miguel na economia e na lista.
2. Lógica pura + testes: `src/engine/shop.ts` (vitrine, preços, juros), `src/engine/sponsors.ts` (efeitos),
   migração do save.
3. **Carta do Patrocínio** na galeria `?cards=1` → ok do Miguel.
4. Tela do Mercado + `?demo=mercado` → ok do Miguel (celular e desktop, "nada teleporta").
5. Calibragem com o robô → antes/depois pro ok.
6. Estatística (migração no banco com ok) + Notas da versão + lançamento 0.9.0.

## Etapa 2 (resumo; planejamento detalhado depois da 0.9.0)

- **Mapa** da Copa longa: 4 andares de 2–3 casas por andar + a Final; tipos de casa como no Slay the Spire (Jogo ~40%,
  "?" ~20%, Mercado, Treino, Baú, Ginásio); Treino garantido antes da Final; tudo pela seed.
- **Eventos "?"** (primeira leva ~8): patrocinador misterioso (2 por 1), capitão por ₽ (raro), lesão (alguém fica fora
  1–2 jogos; você escolhe quem entra), olheiro (ver o próximo rival), imprensa (escolher a frase: +₽ ou +fôlego),
  torcida (bônus de moral), treino extra (atributo +, cansa), Pokémon perdido (contratar de graça um bronze).
- **Lesão**: `RunState.injuries` (uid → partidas fora); o Pokémon fica no banco travado; Treino ou Poção cura.
- Telas: Mapa, Evento (a caixa de texto do jogo com 2–3 escolhas), Treino.
- `?demo=mapa` pro ok do Miguel antes de lançar.

## Etapa 3 (a Jornada, rumo à 1.0)

Kanto inteiro como uma corrida longa: os 8 ginásios como atos do mapa, Elite Four e Campeão no fim; desbloqueios entre
corridas (treinadores, Patrocínios novos, a sala de troféus guardando a Jornada); o Modo história em cima. Pesquisa e
decisões próprias quando a 0.9.1 provar que o mapa diverte.

## Calibragem 1 (20/10/2026, `scripts/balance/cup.ts ... 60 nota|mercado`, 360 copas cada, mesmas seeds)

Robô do Mercado: compra o Patrocínio da vitrine (de campo, ou o primeiro de qualquer família), depois o Pokémon avulso
que melhora uma vaga em 3+ pontos e o pacote se a melhor carta melhora uma vaga. Não usa item, MT nem troca de vitrine.

| | Sem Mercado | Com Mercado |
|---|---|---|
| Título (todas as copas) | 17,2% | 19,4% |
| Título entre quem passou das oitavas (quem vê o Mercado) | 22,9% | 25,8% (±3,6) |
| Vitória por fase (oitavas / quartas / semi / final) | 75 / 62 / 64 / 58% | 75 / 62 / 66 / 63% |

- ₽ que sobra no fim da copa: 4,1 em média; compras: 170 Patrocínios, 147 Pokémon avulsos, 62 pacotes.
- Abaixo da meta (28–32% pra quem usa bem): o Mercado ajuda, mas pouco. Decisão com o Miguel.

## Decisões do Miguel (20/10/2026, depois da 1ª prévia)

- **Força do Mercado:** fica como está; ele joga e sente antes de mexer nos números.
- **Migração dos eventos do Mercado** (`20261021200000_eventos_mercado.sql`): ok pra aplicar na hora do lançamento.
- **Pacote com cara de pacote, temático do tipo** (feito: o lacre da recompensa na cor e com a estampa do tipo,
  `PackArt`) e **Patrocínio com cara de patrocínio** (feito: placa da marca + contrato, cor de marca por Patrocínio, e
  os que você tem viram placas na beira da quadra). Os dois na galeria `?cards=1` pro ok.
- **Tudo mora no Perfil:** a Home tem só a porta do Perfil; Sala de troféus e Coleção abrem de dentro dele.

## Ideias do amigo pra Copa longa (etapa 2)

- **Pacotes piores no começo e melhores a cada andar:** o time não nasce "stackado" e cada escolha pesa mais (no
  Mercado de hoje a raridade já sobe por fase, `SHOP_ROUND`; na Copa longa a escada fica mais longa e começa mais
  baixa).
- **Mapa com casas de tesouro, inimigo, chefe e "?"** (bom ou ruim), como o Slay the Spire. Referência a olhar: o
  **Pokelike**, que fez algo parecido com Pokémon.
