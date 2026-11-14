---
description: Patrocínios novos (Olheiro, Preparador, Charanga, Clube Formador de Pallet): proposta, decisões do Miguel, medidas com o motor 12 e rascunho das Novidades.
---

# Patrocínios novos (23/10/2026)

Ideia aprovada pelo Miguel em 22/10; as decisões, em 23/10 (todas como recomendadas). Implementado na branch
`patrocinios` (motor 12): veja [Implementado](#implementado-2310-motor-12) no fim.

## Como funcionam hoje

- 12 Patrocínios (`src/engine/sponsors.ts`), até 3 por copa, 10 ₽ cada, valem a copa inteira.
- O Mercado (`src/engine/shop.ts`) mostra 2 por vez. Antes da Final só aparecem os de campo.
- Três famílias: **economia** (Fã-Clube, Cassino, S.S. Anne, Loja: mexem no ₽ e na vitrine), **recompensa** (Cinnabar, Creche, Safari: opções a mais, troca grátis, pacote de 4) e **campo** (Silph, Bicicletaria, Academia, Torcida, Master: bônus de atributo pela regra única em `modifiers.ts`).
- Todo bônus de campo é número parado: `+N` em um atributo, o tempo todo. Nenhum depende do jogo (placar, tempo, fase) e nenhum mexe em fôlego, chute ou desarme.
- Uma copa rápida rende uns 25 a 35 ₽: dá pra 2 Patrocínios e umas compras.

## O que os números de 7 dias dizem

| Patrocínio | Uso | Leitura |
|---|---|---|
| bicicletaria | 28% | o preferido: efeito de campo simples e que o Ala mostra na hora |
| silph | 14% | campo, tipo do capitão |
| academia | 13% | campo, passe pro time todo |
| master | 10% | campo, combina com os outros |
| torcida | 10% | campo, Fixo e Goleiro |
| cinnabar | 5% | recompensa |
| fanclube | 4% | economia |
| safari | 4% | recompensa |
| cassino | 3% | economia |
| creche | 3% | recompensa |
| loja | 3% | economia |
| ssanne | 2% | economia |

- **Forte:** os 5 de campo somam 75% das escolhas. O jogador quer o que ele vê no jogo.
- **Fraco:** economia e recompensa somam 25% juntas, e o ssanne (+3 ₽ por vitória) é o último. ₽ a mais só vale se houver o que comprar, e o Mercado já tem 42% das visitas sem compra.
- **Título:** com Patrocínio 56% (n=71), sem 19% (n=537). Isso é correlação: quem leva Patrocínio já está indo bem e tem ₽. Não prova que o Patrocínio ganha título.
- **Consequência pro design:** os 5 novos precisam de efeito que dê pra ver em campo ou no draft, e pelo menos 2 deles têm que dar um motivo de comprar (uma coisa nova pra fazer no Mercado, não só mais ₽).

## Os 5 novos

Preço de todos: 10 ₽, como os atuais. Duração: a copa inteira. Nomes de Kanto, sem marca de verdade.

### 1. Olheiro de Viridian (draft, família recompensa)

- **Efeito:** os Pokémon avulsos e os pacotes do Mercado saem com a raridade da fase seguinte. Em campo da fase 1, o 1º Mercado já vende o que só o 2º venderia. A vitrine fica visivelmente mais dourada.
- **Exemplo:** depois das oitavas, o Mercado normalmente tem prata e bronze. Com o Olheiro aparece um Gengar de 76 por 7 ₽ ao lado de um Machamp de 72.
- **Pra que serve:** dá motivo pra guardar ₽ até o Mercado, ataca o "sai sem comprar".

### 2. Agente de Celadon (Mercado, família economia)

- **Efeito:** você ganha o botão Vender no banco (reserva rende 2 ₽ bronze, 3 prata, 4 ouro) e todo Pokémon avulso custa 1 ₽ a menos.
- **Exemplo:** vende o reserva que nunca entrou por 3 ₽ e fecha o Gengar do exemplo acima por 6 em vez de 7.
- **Pra que serve:** o jogador transforma banco parado em ₽, que hoje não tem destino. Dá uma ação nova no Mercado.

### 3. Preparador de Lavender (campo)

- **Efeito:** +6 de fôlego pro time todo. O fôlego corta o cansaço no fim de cada tempo (`match.ts`), então o time chega no 2º tempo correndo mais que o rival. Nenhum Patrocínio atual mexe em fôlego.
- **Exemplo:** na semi, o rival sofre no 2º tempo e você faz 2 gols entre 15' e 20'.

### 4. Charanga de Pewter (campo, variação da Torcida)

A Torcida de Vermilion já existe (+3 força pros Fixos e o Goleiro). Esta é outra coisa e não se confunde com ela: um bônus que só liga quando o jogo pede.

- **Efeito:** enquanto seu time perde no placar, todo mundo em campo ganha +4 em tudo. Empatou ou virou, desliga.
- **Exemplo:** perde de 0x2 pro Ferrolho, a bateria começa, o time faz 3x2 em 5 minutos e o bônus some. Vira o patrocínio de virada.
- **Nome:** Charanga em vez de Torcida pra não duplicar, e a Torcida de Vermilion continua do jeito que está.
- **Custo de implementar:** é o único que precisa de estado de jogo (placar) dentro do bônus; os outros 4 usam o que já existe.

### 5. Clube Formador de Pewter (evolução)

- **Efeito:** o seu time precisa de 5 pontos a menos pra evoluir (limiar 14 vira 9). O rival não muda.
- **Exemplo:** o Charmander que sempre ficava com 11 de 14 evolui na terceira partida, no meio da quadra, com a animação de sempre.
- **Pra que serve:** hoje o time evolui 0,36 vez por copa, e a promessa do draft era ~1,2. Esse Patrocínio puxa pra perto. Compra pra quem montou time de estágio 1.

## Efeito na taxa de título

Medido com o robô da copa (`scripts/balance/cup.ts`, 204 copas: 34 por formação, mesmas seeds em todas as rodadas, `scripts/pesado.sh`). O robô joga pela nota, sem MT, na equilibrada. Os efeitos foram aplicados à mão na simulação (variável de ambiente, sem mexer no código do jogo). O erro de cada medida é de ±3 a 5 pontos percentuais, então diferença abaixo disso é ruído.

| Cenário | Título | Leitura |
|---|---|---|
| Sem patrocínio | 14% | base |
| +2 em tudo (régua) | 22% | cada ponto em tudo vale uns +4 pp |
| Preparador: +6 fôlego | 18% | +4 pp, dentro do ruído (fôlego dá menos que a régua, como esperado) |
| Clube Formador: limiar 14 vira 9 | 15% | +1 pp, não mede nada (poucos evoluem no robô, que ignora quem evolui) |
| Mercado sem patrocínio novo | 16% | base do Mercado |
| Olheiro: raridade +1 | 19% | +3 pp, borda do ruído |
| Agente: avulso 2 ₽ mais barato | 13% | -3 pp, ruído: o robô só compra quando melhora 2+ pontos, preço não é o gargalo dele |

**Charanga (estimativa, não medida):** o bônus de +4 em tudo só vale enquanto perde. Pelas partidas do robô, o time perde por uns 25 a 35% do tempo, o que vale ~+1 a +1,4 em tudo na média. Com a régua de +4 pp por ponto, dá +4 a +6 pp de título, concentrado em virada. Não medi porque o bônus depende do placar, que o robô de copa não consegue ligar sem implementar o Patrocínio.

**Agente, a parte de vender:** estimativa. O robô não vende reserva, então não mede.

**Leitura geral:** nenhum passa de +6 pp, e a régua de +2 em tudo (dois Silph) vale +8 pp. Nenhum deles é mais forte que Silph, Academia ou Master por dois lados: o preço é o mesmo e o efeito é menor ou condicional. Sinal bom, não vai quebrar a copa. Por outro lado, o Clube Formador é o único com efeito que precisa de um robô que valorize evolução pra ser medido direito.

## Decisões pro Miguel

1. **Entram os 5, ou só 3 nesta leva?** Recomendo 4: Olheiro, Preparador, Charanga e Clube Formador. O Agente precisa de tela nova (Vender) e o único número que tenho dele é ruído.
2. **Agente: cortar, ou fazer só com o Vender?** Recomendo tirar o desconto e deixar só Vender o reserva, e esperar a 0.9.x seguinte.
3. **Charanga: +4 em tudo enquanto perde, ou +3?** Recomendo +4 em tudo, só com o placar contra (vale mais em partida que o robô perde). Se ficar forte demais na prévia, cai pra +3. Aprova o nome Charanga em vez de uma segunda Torcida?
4. **Clube Formador: limiar -5 (14 vira 9)?** Recomendo -4 (vira 10), que fica ainda abaixo do rival (10) sem passar dele.
5. **Preparador: +6 fôlego pro time todo, ou só Alas e Pivô?** Recomendo o time todo, que é fácil de ler na carta.
6. **Preço:** 10 ₽ pra todos, ou o Olheiro a 12 (ele rende Pokémon melhor)? Recomendo 10 pros 4 de campo e draft, pra não mudar a regra do Mercado.
7. **Ordem de entrada:** recomendo uma versão 0.9.x só com patrocínios, atrás de teste no `?demo=mercado`, porque a Charanga mexe em estado da partida e muda o resultado (sobe `ENGINE_VERSION`, republica a Edge Function `liga`).
8. **Ícones:** desenhados em SVG, sem emoji; peço ok na galeria `?cards=1` antes de espalhar.
9. **Atacar os fracos (ssanne e companhia)?** Recomendo olhar depois dessa leva: se o Agente e o Olheiro puxarem uso de ₽, o ssanne melhora sozinho. Se não, +3 vira +4 ₽ por vitória.

## Implementado (23/10, motor 12)

O Miguel aprovou as recomendações: entram 4 (o Agente fica pra depois, o S.S. Anne fica como está), todos a 10 ₽,
ícones SVG no `HudIcon`. O Clube Formador virou **de Pallet** pra não repetir Pewter.

| Patrocínio | Família | Efeito no código | Ícone |
|---|---|---|---|
| Olheiro de Viridian | recompensa | avulsos e pacote do Mercado com a raridade da fase seguinte (`shopRound` em `shop.ts`); no Mercado da reta final já é a mais alta | binóculo (o mesmo do evento Olheiro da Rota) |
| Preparador de Lavender | campo | +6 de fôlego pro time todo (`sponsorBonuses`) | cronômetro |
| Charanga de Pewter | campo | +4 em tudo enquanto o time perde; liga e desliga a cada gol (`scoreGoal` recalcula) | bumbo |
| Clube Formador de Pallet | campo | o seu time evolui com 10 em vez de 14 (`evoThreshold`); barras da carta, prancheta, mapa e eventos acompanham | broto |

- `ENGINE_VERSION` 11 → 12 (Charanga e Preparador mudam a partida). A Edge Function `liga` não foi republicada: a
  integração faz isso junto com o golpe por tipo, que também usa o 12.
- Save: nada novo (Patrocínio já era lista de ids), sem migração.
- O painel do jogador na partida mostra a linha da Charanga quando o time está atrás (carta = campo).
- Prévia: `?demo=mercado&novos=1` (Olheiro e Preparador nas vagas, Charanga e Clube Formador à venda).

### Medidas (robô da copa, 204 copas: 34 por formação, mesmas seeds, `scripts/pesado.sh`)

Agora com o código de verdade: `SPONSORS=<id>` no `scripts/balance/cup.ts` põe o Patrocínio desde a 1ª partida. O
robô joga pela nota, sem MT, na equilibrada; erro de ±3 a 5 pp em cada linha.

| Cenário | Proposta (estimativa à mão) | Motor 12 | Leitura |
|---|---|---|---|
| Sem patrocínio | 14% | 14% | mesma base (partida sem Patrocínio não mudou) |
| Preparador | 18% | 19% | +5 pp, na borda do ruído |
| Charanga +4 | +4 a +6 pp (estimado) | 18% | +4 pp: não ficou forte, fica no +4 |
| Clube Formador (robô pela nota) | 15% | 15% | evoluções 0,36 → 0,39 por copa |
| Clube Formador (robô pela evolução) | — | 15% → 16% | evoluções 1,68 → 2,07 por copa; copas com evolução 82% → 92% |
| Mercado sem patrocínio novo | 16% | 19% | base do Mercado (robô compra Patrocínio de campo) |
| Olheiro (no Mercado) | 19% | 19% | 0 pp: o robô já compra pouco Pokémon; o efeito aparece na vitrine (teste: nota média maior) |

- Nenhum passa de +5 pp, abaixo de Silph/Master. A Charanga não precisou cair pra +3.
- Calibrate n=200 (partidas sem Patrocínio, motor 12): 7,88 gols/jogo, favorito 68,8%, goleadas 1,5%, empates 18,5%.
- Ressalva: o robô não sente ritmo nem virada; a Charanga e o Preparador precisam ser jogados na prévia.

### Rascunho das Novidades (não está no `patch-notes.ts`)

**PT**
- 4 Patrocínios novos no Mercado, 10 ₽ cada:
  - **Olheiro de Viridian**: Mercado e pacotes com Pokémon mais raros.
  - **Preparador de Lavender**: +6 de fôlego pro time todo.
  - **Charanga de Pewter**: +4 em tudo enquanto o time perde.
  - **Clube Formador de Pallet**: a barra de evolução do seu time enche 40% mais rápido.

**EN**
- 4 new Sponsors in the Market, ₽10 each:
  - **Viridian Scout**: rarer Pokémon in the Market and packs.
  - **Lavender Trainer**: +6 stamina for the whole team.
  - **Pewter Drum Band**: +4 to everything while losing.
  - **Pallet Youth Club**: your team's evolution bar fills 40% faster.
