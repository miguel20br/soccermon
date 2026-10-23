---
description: Golpe máximo N3 com efeito do tipo do capitão (15 tipos da Gen 1) e, na fase 2, assinatura própria pros 12 mais escolhidos; motor, tela, medida e decisões pro Miguel.
---

# Golpe máximo por tipo, e depois por Pokémon (proposta, 23/10/2026)

Ideia aprovada pelo Miguel em 22/10; as decisões, como recomendadas, em 23/10. **Fase 1 implementada (motor 12, branch
`golpe-tipo`, atrás de `?tipo=1`): ver [Fase 1 no código](#fase-1-no-código-2310).** Base: [golpe-maximo-niveis.md](golpe-maximo-niveis.md)
(3 níveis, motor 11, na 0.9.14), que deixou o efeito especial do N3 pra esta frente, e
[golpes-por-tipo.md](golpes-por-tipo.md) (de onde vem o golpe de cada um). Código lido: `src/engine/agency.ts`
(`AGENCY.maxLevelShot`, `maxCharge`), `src/engine/match.ts` (`maxShot`, `maxMoveOf`, o laço de bloqueio e defesa do
chute), `src/engine/moves.ts` (`MOVE_TRAITS`, `MOVE_TUNING`) e `src/engine/signature-moves.ts`.

## A ideia

Hoje o N3 é só um chute mais forte (x2,2 de força, x2,0 de precisão, goleiro rival com alcance x0,7), igual pra
todo mundo. A proposta: o N3 ganha **o efeito do tipo do capitão**, um truque que dá pra ver em campo e que muda o
lance. O Charizard deixa a bola em chamas, o Blastoise solta uma onda que empurra a defesa, o Mewtwo curva a bola no
ar e o Gengar atravessa o zagueiro. Cada tipo tem um efeito diferente, e o jogador escolhe o capitão também pelo
máximo dele. Isso resolve o problema que a 0.9.14 deixou aberto: **segurar pro N3 hoje não compensa** (+0,0 pp contra
+0,5 pp de soltar no N1), porque só força não basta. Com um truque de verdade no N3, esperar passa a valer a pena. A
fase 2 troca o efeito do tipo por uma **assinatura própria** nos 12 Pokémon mais escolhidos e mais icônicos.

## O que a medida de hoje diz (motor 11, n=200)

Desfecho do chute máximo de linha, em 200 partidas pareadas, com o robô soltando em todo gomo (política n1) ou
segurando pro N3 (política n3) e a nota sorteada 40/40/20, como no `coach.ts`. Script no scratchpad
(`.../scratchpad/tipo/desfecho.mts`), rodado pela fila pesada.

| Desfecho do chute máximo | Todos (n1, 222 chutes) | N1 (173) | N2 (41) | N3 (n3, 65 chutes) |
|---|---:|---:|---:|---:|
| gol | 24,8% | 21,4% | 34,1% | 27,7% |
| goleiro defendeu (espalmou) | 18,5% | 20,2% | 12,2% | 9,2% |
| goleiro segurou | **0%** | 0% | 0% | 0% |
| bloqueado por um zagueiro | 6,8% | 5,2% | 14,6% | 7,7% |
| trave | 6,8% | 6,4% | 7,3% | 10,8% |
| pra fora | **43,2%** | 46,8% | 31,7% | 43,1% |

Três coisas mudam a proposta:

1. **O chute máximo vai pra fora quase metade das vezes.** O efeito que corrige a mira (o Psíquico) mexe no maior
   balde e é o mais perigoso.
2. **O goleiro nunca segura o chute máximo:** ele é rápido demais (o `felt < 17` da defesa nunca passa). Então
   "o goleiro solta a bola" (a 1ª ideia do Fogo) não muda nada. O Fogo precisa de outra coisa (ver tabela).
3. **O bloqueio de zagueiro é raro (5 a 15%).** Atravessar o zagueiro (Fantasma) vale pouco sozinho e precisa vir com
   mais alguma coisa.

## Os 15 tipos

Regra comum: o efeito só vale no chute N3 do capitão de linha (decisão 1) e vem **por cima** dos números do N3, que
não mudam. Os efeitos são montados com peças que o motor já tem (`knockback`, `applyStatus`, `areaHit`, `lob`,
`pierce`, parede do Barrier, nuvem do Poison Gas e do Smokescreen, clones do Double Team), com números novos num lugar
só (`AGENCY.maxType`). "Peso" = qual desfecho da tabela acima o efeito ataca.

| Tipo | Efeito em campo (N3) | O que muda no motor | Animação | Risco de equilíbrio |
|---|---|---|---|---|
| **Normal** | **Mega Impacto.** A bola fura todos os bloqueios e, se o goleiro espalmar, ele cai 1 s e a bola sobra na pequena área. | `pierce` em todos os bloqueios + `stun` 1 s no goleiro na defesa; o rebote fica a ~3 m do gol (`tryRebound` com a bola mais perto). | Onda de choque branca no contato, tela treme. | Médio: cria rebote limpo. Peso: defesa + bloqueio. |
| **Fogo** | **Bola em chamas.** O goleiro que toca nela se queima e espalma curto (a bola não sai da área), e a bola deixa um rastro de fogo no chão por 3 s que queima quem passa. | Na defesa: `applyStatus(brn)` no goleiro (8 s, já existe) e o espalmar com `speed × 0,15` (rebote curto). Rastro: o anel do Fire Spin (`fireRing`) em 2 ou 3 pontos da linha do chute. | Bola vira bola de fogo (o rastro `fire` do `ball-trail` em dobro), chamas no chão, goleiro pisca vermelho. | Médio: a queimadura enfraquece o goleiro pelo resto do lance. Peso: defesa. |
| **Água** | **Onda.** Sai uma onda do capitão que empurra os rivais no caminho do chute 2,5 m pra trás, antes da bola passar. | No chute: `knockback` em todo rival a até 2 m da linha capitão-gol (o goleiro vai 1 m), sem `rng`. Sem bloqueio nem goleiro bem posicionado. | Onda azul (estilo `wave` do `move-fx`) varrendo a quadra, gotas no rastro. | Médio: abre o gol, mas o goleiro ainda pode alcançar. Peso: bloqueio + defesa. |
| **Elétrico** | **Raio.** A bola sai 15% mais rápida em linha reta e paralisa quem encosta nela: o zagueiro que bloqueia e o goleiro que defende ficam parados 1,5 s. | `speed × 1,15`; `applyStatus(par)` curto (1,5 s em vez de 6) em quem bloquear ou defender. Com o goleiro paralisado, o rebote é do ataque. | Raio amarelo do pé do capitão até a bola, faíscas em zigue-zague (já existe no `ball-trail`), quem toca fica com o choque. | Médio: a velocidade também tira defesa. Peso: defesa + bloqueio. |
| **Planta** | **Cipó.** Na hora do chute sai um cipó do chão que prende o goleiro 0,5 s: ele pula atrasado. | `wrap` (do Wrap/Bind) no goleiro por 0,5 s no chute; com ele preso, alcance x0,6 (em vez do x0,7 do N3). | Cipós verdes saindo do chão e enrolando o goleiro, folhas no rastro. | Médio: mexe direto no goleiro, como o N3 já mexe. Peso: defesa. |
| **Gelo** | **Pista de gelo.** A linha do chute congela: os rivais a até 2 m ficam congelados 1 s (não bloqueiam) e o goleiro escorrega (alcance x0,85). | `applyStatus(frz)` curto (1 s) em área ao longo da linha, sem `rng`; alcance do goleiro x0,85. | Faixa de gelo no chão que fica 3 s, zagueiros viram bloco de gelo. | Médio: área. Peso: bloqueio + defesa. |
| **Lutador** | **Chute de dois tempos.** Bloqueou ou o goleiro espalmou? O capitão emenda de primeira no rebote, com um 2º chute (força do N2), se estiver a até 6 m. | Um 2º `kick` do capitão no rebote, igual ao `multi2` do Double Kick, mas com o chute inteiro (força N2, sem nota). | Punho e pé estourando no contato, "2x" grande, o capitão dá um pulo e emenda. | Médio a alto: o 2º chute é forte. Peso: defesa + bloqueio + trave. |
| **Venenoso** | **Nuvem tóxica.** O chute explode numa nuvem roxa na área: todo rival dentro dela se envenena (perde fôlego) e o goleiro fica com a saída de bola pior por 5 s. | A nuvem do Poison Gas (`gasRadius` maior, 4 m) no ponto onde a bola parar ou for defendida + a fumaça do Smokescreen (`smokeAim`) no goleiro. | Nuvem roxa que fica 5 s na área, bolhas no rastro. | Baixo: quase não vira gol na hora, rende pressão e cansaço. Peso: depois do lance. |
| **Terrestre** | **Terremoto.** A quadra treme na hora do chute: todo rival a até 6 m do gol (o goleiro também) cai 0,6 s. Voador e quem levita não cai. | `areaHit` com `areaAll` do Earthquake (raio 6, só rivais) e `stun` 0,6 s; a imunidade sai da tabela de tipos (`effectiveness` = 0, Terrestre em Voador) e da habilidade Levitate. | Tela treme forte, rachaduras no chão, poeira marrom. | Alto: derruba todo mundo perto do gol, inclusive o goleiro. Peso: defesa + bloqueio. |
| **Voador** | **Chute do céu.** O capitão chuta por cima, a bola sobe e cai em cima do gol: não dá pra bloquear e o goleiro alcança pouco. | `lob` (já existe e está calibrado) com o alcance do goleiro x0,8 (`lobGkReach`) por cima do x0,7 do N3. | Bola some no alto com penas, sombra crescendo no chão, cai como meteoro. | Baixo: o `lob` já é conhecido. Peso: bloqueio + defesa. |
| **Psíquico** | **Bola que curva.** A bola faz uma curva no ar e busca o canto longe do goleiro. | `ball.curve`: aceleração lateral fixa, calculada no chute (sem `rng`), que puxa a bola até 12° pro canto oposto ao goleiro. Peça nova na física da bola. | Aura rosa na bola, rastro em arco, olhos do capitão brilhando. | **Alto**: mexe no maior balde (43% pra fora). Precisa de teto no ângulo. Peso: pra fora + defesa. |
| **Inseto** | **Enxame.** A bola se divide em 3 no ar; o goleiro pula numa delas e erra 1 a cada 2 vezes. | Sorteio com o `rng` da partida no chute: com 50%, o goleiro "pulou na isca" e não tem defesa nesse chute. As 2 iscas são só da tela (como os clones do Double Team). | Bola vira 3, duas viram pó verde quando passam do goleiro. | Médio: o 50% é um corte seco. Peso: defesa. |
| **Pedra** | **Deslizamento.** A bola sai pesada (fura o 1º bloqueio) e caem pedras na frente da área por 3 s: o rival não consegue sair jogando por ali e o rebote fica com o ataque. | `pierce` no 1º bloqueio + a parede do Barrier (`wall`, `wallRadius`) em 2 ou 3 pontos na frente da área, de rival. | Pedras caindo do alto, poeira, as pedras ficam e somem rachando. | Médio: segura o lance vivo. Peso: depois do lance + bloqueio. |
| **Fantasma** | **Bola fantasma.** A bola fica transparente e atravessa os zagueiros, e o goleiro só vê ela no fim (alcance x0,8). Goleiro Normal não se assusta: defende como sempre. | Sem bloqueio nesse chute (o laço do `block` pula os não goleiros) + alcance x0,8. Imunidade pela tabela de tipos (`effectiveness` = 0, Fantasma em Normal). | Bola roxa e translúcida, os zagueiros piscam quando ela passa, risada (o cry do Gengar baixo). | Médio: bloqueio é raro, mas o x0,8 pesa. Peso: bloqueio + defesa. |
| **Dragão** | **Fúria do dragão.** A bola vira um dragão azul que ignora a resistência de tipo do goleiro, e o goleiro recua com medo (alcance x0,8). Se não virar gol, o capitão fica em fúria 6 s (chute e velocidade +15%). | `gkTypeMult` e `shotTypeMult` = 1 nesse chute (como o dano fixo), alcance x0,8 + `buffs` no capitão se não for gol. Fada fica imune (Dragão em Fada = 0), como na Gen 6. | Chama azul em forma de dragão (partícula `bluefireball`), rugido, o capitão fica com aura azul na fúria. | Médio a alto: o Dragonite é o capitão nº 1 (10%) e o Dragonair o 5º mais escolhido. Peso: defesa + o lance seguinte. |

**Fada e Aço** (tipos modernos de 7 espécies: Clefairy, Clefable, Jigglypuff, Wigglytuff, Mr. Mime, Magnemite e
Magneton). Pela regra da próxima seção, só o Clefairy e o Clefable (Fada pura) ficam sem um tipo da tabela. Proposta:
Fada vira **Brilho da lua** (o goleiro rival fica encantado 1 s e alcança x0,85; o mesmo `infatuation` que já existe).
Aço nunca é escolhido (o Magneton solta Thunderbolt, Elétrico).

### O goleiro capitão (defesa máxima N3)

A tabela é do capitão de linha. Pro goleiro capitão, a proposta é uma versão curta do mesmo tipo, em cima da defesa
máxima N3 de hoje (6 s, alcance x1,4). Fica pra uma 2ª rodada (decisão 6):

| Tipo | No gol | Tipo | No gol | Tipo | No gol |
|---|---|---|---|---|---|
| Normal | segura e lança longo | Gelo | congela quem chutou 1 s | Psíquico | parede (Barrier) na frente do gol 2 s |
| Fogo | queima quem chutou | Lutador | devolve (Counter): derruba quem chutou | Inseto | teia: atacantes na área ficam lentos |
| Água | onda empurra os atacantes da área | Venenoso | envenena quem chutou | Pedra | muro: alcance x1,6 |
| Elétrico | paralisa quem chutou | Terrestre | tremor derruba a área | Fantasma | assusta: o chute sai com mira pior |
| Planta | cipó segura o chutador antes do chute | Voador | espalma pra longe, sai da área | Dragão | segura e o time ganha fúria 6 s |

## Qual tipo quando o capitão tem dois

Proposta: **o tipo do golpe máximo, se for STAB; senão, o 1º tipo do Pokémon.** O golpe máximo já existe
(`maxMoveOf`: a assinatura, se for de ataque) e é o nome que aparece na faixa grande. Fica assim:

| Capitão | Tipos | Golpe máximo (tipo) | Efeito |
|---|---|---|---|
| Charizard | Fogo/Voador | Flamethrower (Fogo, STAB) | Fogo |
| Gyarados | Água/Voador | Hydro Pump (Água, STAB) | Água |
| Articuno | Gelo/Voador | Blizzard (Gelo, STAB) | Gelo |
| Moltres | Fogo/Voador | Sky Attack (Voador, STAB) | Voador |
| Dragonite | Dragão/Voador | Hyper Beam (Normal, sem STAB) | **Dragão** (1º tipo) |
| Gengar | Fantasma/Veneno | Dream Eater (Psíquico, sem STAB) | **Fantasma** (1º tipo) |
| Golem | Pedra/Terra | Explosion (Normal, sem STAB) | Pedra |
| Scyther | Inseto/Voador | Slash (Normal, sem STAB) | Inseto |
| Mr. Mime | Psíquico/Fada | Confusion (Psíquico, STAB) | Psíquico |
| Clefable | Fada | Double Slap (Normal, sem STAB) | Fada (Brilho da lua) |

Por que essa regra: o efeito combina com o golpe que aparece na tela, sem escolha nova pro jogador (o capitão já é
escolha dele), e quem tem golpe de outro tipo não vira um Psíquico qualquer (o Gengar fica Fantasma). MT ensinada
pode mudar o golpe máximo e, com ele, o efeito; isso é uma escolha de verdade e fica bom.

Outras opções: (b) sempre o 1º tipo (mais simples, mas o Moltres fica Fogo com um Sky Attack); (c) o jogador escolhe
o tipo na tela do capitão (mais um menu, e quase todo mundo ia escolher o mais forte); (d) os dois efeitos pela
metade (confuso de ler em campo).

## Fase 2: por Pokémon (assinaturas)

A assinatura troca o efeito do tipo, só pro N3 e só na forma final de cada linha (evoluir no meio da copa destrava,
um bom gancho pro evento de evolução). Ela é montada com **as mesmas peças da fase 1**: é quase só dado e animação. O
nome é o do golpe que já está em `SIGNATURE` (`signature-moves.ts`), então nada muda no moveset.

| Pokémon | Assinatura (golpe de `SIGNATURE`) | Efeito N3 | Peças |
|---|---|---|---|
| Dragonite (capitão nº 1) | **Hyper Beam** | Raio laranja que atravessa tudo (bloqueio e iscas), alcance do goleiro x0,6. Gol: sem recarga. Errou: o Dragonite fica parado 1 s (o preço do Hyper Beam da Gen 1). | `pierce` total, `noRechargeOnGoal` (já existe), recarga do `DRAWBACK` |
| Snorlax (capitão nº 2) | **Body Slam** | Na linha: o chute derruba e paralisa o goleiro que defende. No gol: o Snorlax deita na frente do gol por 3 s (alcance x1,8, ronco). | `par` no goleiro / `wall` grande |
| Arcanine (capitão nº 3) | **Fire Blast** | A bola explode em estrela de fogo na área: todo rival a 4 m cai 0,6 s e se queima. | `areaHit` + `brn` |
| Articuno (capitão nº 4) | **Blizzard** | Nevasca: a área rival inteira congela 1,2 s (o goleiro também). | `frz` em área |
| Blastoise (capitão nº 5) | **Hydro Pump** | Dois canhões: a onda empurra a defesa e, se o goleiro espalmar, a bola volta no pé do Blastoise pra um 2º chute. | onda da Água + rebote do Lutador |
| Charizard | **Flamethrower** | Voa com a bola (2 m rumo ao gol, como o Fly) e chuta de cima em chamas: não dá pra bloquear e o goleiro se queima. | `fly` + `lob` + Fogo |
| Pikachu | **Thunderbolt** | O raio salta da bola pro goleiro e de lá pra 2 rivais perto (paralisia 1,5 s em cadeia). | `par` em cadeia |
| Gengar | **Dream Eater** | Atravessa a defesa e o goleiro dorme 0,8 s antes de pular. | Fantasma + `slp` curto |
| Mewtwo | **Psychic** | A bola para no ar meio segundo e o Mewtwo escolhe o canto: curva máxima, o goleiro fica parado (telecinese). | `curve` forte + `stun` no goleiro |
| Gyarados | **Hydro Pump** (fúria) | Tsunami: a onda empurra **todos** os rivais 3 m e o Gyarados fica em fúria 6 s (Intimidate). | onda grande + fúria do Dragão |
| Mew | **Psychic** (Metronome) | Sorteia um dos 15 efeitos de tipo a cada N3 (com o `rng` da partida, então dá a mesma partida no replay). | sorteio |
| Ditto | **Transform** | Copia o efeito do capitão rival (se o rival não tiver máximo, vira Normal). | cópia |

Fora da lista, mas candidatos depois: Alakazam, Machamp, Lapras, Zapdos, Moltres, Mew (se o Metronome ficar bom). O
Dragonair (5º mais escolhido) usa o efeito do Dragão, porque não é forma final.

## O que precisa no motor (determinístico, `ENGINE_VERSION` 11 ⇒ 12)

- **Regra única** em `agency.ts`: `maxTypeOf(inst)` (STAB senão 1º tipo; Fada pura = Fada) e
  `AGENCY.maxType: Record<string, MaxTypeFx>` com os números de cada tipo; na fase 2, `MAX_SIGNATURE` em
  `signature-moves.ts` (id da espécie ⇒ efeito montado com as mesmas peças). A tela e a carta leem daqui (carta = campo).
- **`maxShot`** (`match.ts`): no N3, guarda `ball.shot.maxFx = { type, sig? }` e chama o efeito "na hora do chute"
  (Água, Gelo, Terrestre, Planta, Voador). Os outros entram nos pontos que já existem:
  - laço do bloqueio (Normal, Elétrico, Pedra, Fantasma);
  - defesa do goleiro (Fogo, Elétrico, Normal, Inseto, Dragão);
  - depois do lance (Venenoso, Pedra, Lutador, Dragão).
- **Peça nova de verdade, só uma:** a curva da bola do Psíquico (`ball.curve`, aceleração lateral aplicada no passo
  da bola enquanto `ball.shot` existir). O resto reaproveita o que já existe.
- **Determinismo:** nada de `Math.random()` nem `Date`. O único sorteio novo (Inseto, e o Metronome do Mew) usa
  `s.rng`. A nota do toque continua escalando só os números do N3 (`maxGraded`); o efeito do tipo vale inteiro com
  qualquer nota (decisão 3).
- **Evento:** o `max`/`hit` ganha `fx` (o tipo ou a assinatura), e cada efeito que acontece solta um evento curto
  (`maxFx`: "queimou o goleiro", "atravessou", "pulou na isca") pra tela, o Duelo e o replay mostrarem igual.
- **IA rival** (`rival-coach.ts`): nada muda na regra de soltar (já solta no N2/N3); o rival também ganha o efeito.
- **`ENGINE_VERSION` 11 ⇒ 12**, `npm run edge:liga` e deploy da Edge Function `liga` junto com a publicação. Duelo e
  lobby já comparam a versão. Save: nada a migrar (o efeito sai da espécie e do golpe, não fica guardado).
- **Testes:** `determinism.ts` com N3 de cada tipo; um teste por peça em `agency.test.ts` (ex.: Fogo queima o goleiro
  que defende; Fantasma não é bloqueado e um goleiro Normal defende normal; Terrestre não derruba Voador; N1 e N2
  continuam bit a bit iguais ao motor 11); `maxTypeOf` dos 151 sem tipo vazio.
- **Robô:** `coach.ts` ganha `CAPTYPE=<tipo>` (força um capitão do tipo, com o `insertSpecies` do `lib.ts`) e o
  `desfecho.mts` desta proposta vira `scripts/balance/maximo-tipo.ts`.

## O que precisa na tela

- **Barra:** o 3º gomo mostra o ícone do tipo do capitão (os ícones de tipo já existem, `fetch-type-icons`). Assim o
  jogador sabe o que está esperando.
- **Chute N3:** a faixa grande (`cine.drama`) ganha o nome do efeito ("Bola em chamas", "Onda", "Terremoto"…) e a
  cor do tipo; a bola cresce e ganha a aura do tipo; o rastro do `ball-trail` fica mais denso. Cada efeito ganha uma
  receita em `move-fx.ts` (as peças `wave`, `quake`, `beam`, `cloud` e as partículas por tipo já existem).
- **Laboratório:** `?lab=maximo` com os 15 tipos e as 12 assinaturas lado a lado, com a ferramenta de revisão
  ok/mudar do `?lab=golpes&revisao=1`. O Miguel aprova a animação ali antes de espalhar.
- **Demo:** `?demo=maximo&tipo=Fire` (e `&sig=6` pra assinatura).
- **Carta e capitão:** na tela do capitão, uma linha "Golpe máximo: Onda (Água): empurra a defesa" (PT/EN). Sem emoji:
  ícone do tipo desenhado.
- **Nada teleporta:** as animações novas duram 200 a 600 ms e seguem a câmera lenta de hoje. Prints em 320, 390,
  1440 e deitado.

## Estimativa de impacto

Sem o efeito implementado não dá pra medir a vitória por tipo de verdade. A conta abaixo parte do desfecho medido do
N3 (tabela lá de cima, 65 chutes, ±5 pp por linha) e de uma hipótese por tipo sobre quanto de cada desfecho vira gol.
Pra converter: ~0,33 a 0,44 chute N3 por jogo pra quem segura (esta medida e a da 0.9.14) e ~15 pp de vitória por gol
a mais por jogo (a 0.9.14 mediu +1,8 a +3,5 pp com ~0,17 gol/jogo). Chute no alvo vira gol 75% das vezes no N3.

| Tipo | De onde sai o gol a mais (hipótese) | Gol a mais por chute N3 | Vitória a mais pra quem segura |
|---|---|---:|---:|
| Psíquico | metade dos chutes pra fora vira no alvo (43% × 0,5 × 0,75) | **+0,16** | **+0,8 a +1,1 pp** |
| Terrestre | bloqueio some (7,7% × 0,75) + goleiro caído em 70% das defesas | +0,12 | +0,6 a +0,8 pp |
| Normal | bloqueio some + rebote limpo em 30% das defesas | +0,09 | +0,4 a +0,6 pp |
| Fantasma | bloqueio some + alcance x0,8 | +0,09 | +0,4 a +0,6 pp |
| Água | bloqueio some + goleiro 1 m fora do lugar | +0,09 | +0,4 a +0,6 pp |
| Voador | sem bloqueio + alcance x0,8 (a cobertura erra um pouco mais) | +0,08 | +0,4 a +0,5 pp |
| Elétrico | chute mais rápido + rebote com o goleiro ou o zagueiro paralisado | +0,07 | +0,3 a +0,5 pp |
| Gelo | bloqueio congelado + alcance x0,85 | +0,07 | +0,3 a +0,5 pp |
| Pedra | fura o 1º bloqueio + rebote preso pelas pedras | +0,07 | +0,3 a +0,5 pp |
| Dragão | alcance x0,8 + fúria no lance seguinte | +0,07 | +0,3 a +0,5 pp |
| Lutador | 2º chute em ~60% dos rebotes (bloqueio, defesa e trave = 28%) | +0,06 | +0,3 a +0,4 pp |
| Inseto | metade das defesas some (9,2% × 0,5) | +0,05 | +0,2 a +0,3 pp |
| Planta | alcance x0,6 em vez de x0,7 | +0,04 | +0,2 a +0,3 pp |
| Fogo | rebote curto na área depois da defesa + rastro | +0,04 | +0,2 a +0,3 pp |
| Venenoso | quase nada na hora; rende posse e cansaço depois | +0,02 | +0,1 pp |

O que dá pra ler:

- **Os efeitos sozinhos rendem pouco em vitória (+0,1 a +1,1 pp).** O N3 sai pouco (0,33 a 0,44 por jogo) e 43% dos
  chutes N3 vão pra fora, coisa que só o Psíquico corrige. O efeito do tipo vale pela cena e pela escolha do capitão,
  e menos pelo placar. Isso é bom pro equilíbrio: a diferença entre o tipo mais forte e o mais fraco fica perto de 1 pp.
- **A meta da 0.9.14 (segurar ≥ +1 pp sobre soltar no N1) só o Psíquico bate sozinho.** Pra todo mundo bater, a
  alavanca que sobrou da 0.9.14 é o volume: gomo de 10 pontos (N3 lá pelo min 26) ou zona maior no N3 (decisão 11).
- **Os extremos:** Psíquico e Terrestre no topo, Venenoso, Fogo e Planta no fundo. Proposta de partida: Psíquico com
  teto de 8° (em vez de 12°), Venenoso com a nuvem também na hora do chute (os rivais na nuvem não bloqueiam) e Fogo
  com a queimadura deixando o goleiro com alcance x0,85 até o fim do lance. Tudo isso se acerta com o robô na etapa 2.
- **Ressalva:** é conta com hipótese, não medida. O robô por tipo (`CAPTYPE`, 384 partidas pareadas por tipo, ±1,6 pp)
  substitui esta tabela antes de qualquer número ir pro jogo. O desfecho veio de 65 chutes N3, então cada linha tem
  ±5 pp.

## Tamanho da implementação

| Etapa | O que entra | Tamanho |
|---|---|---|
| 1. Motor fase 1 | `maxTypeOf`, `AGENCY.maxType`, ganchos em `maxShot`/bloqueio/defesa/depois, curva da bola, eventos, testes, `ENGINE_VERSION` 12 | ~400 a 600 linhas, 2 a 3 dias de agente |
| 2. Medida | robô por tipo (15 × 384 partidas pareadas, ~1 h na fila), ajuste dos números com o Miguel | 1 dia |
| 3. Tela fase 1 | 15 receitas de animação, ícone no gomo, faixa, `?lab=maximo`, `?demo`, i18n | ~600 a 900 linhas, 2 a 3 dias + revisão do Miguel no lab |
| 4. Fase 2 | 12 assinaturas (dado + 12 animações), medida das 12 | ~400 linhas, 2 dias |
| 5. Goleiro capitão por tipo (opcional) | 15 efeitos curtos na defesa máxima | ~250 linhas, 1 a 2 dias |

Fase 1 inteira: uma versão (0.9.15 ou 0.9.16), ~1 semana com revisão. Fase 2: a versão seguinte.

## Decisões pro Miguel (recomendação primeiro)

1. **Só no N3 ou cresce por nível?** *Recomendo só no N3, com uma prévia visual no N1 e no N2 (o rastro do tipo, que
   já existe, e o ícone no 3º gomo).* É o que dá motivo pra segurar a barra, o buraco que a 0.9.14 deixou. Se o
   efeito crescer por nível (N1 25%, N2 50%, N3 100%), ele aparece ~1,3 vez por jogo em vez de 0,44, o risco de
   equilíbrio triplica e soltar no N1 continua ganhando.
2. **Regra do tipo duplo:** o tipo do golpe máximo se for STAB, senão o 1º tipo? *Recomendo essa.* (Outras: sempre o
   1º tipo, ou o jogador escolhe.)
3. **A nota do toque mexe no efeito?** *Recomendo que não:* o efeito vale inteiro com qualquer nota, e a nota segue
   escalando só a força e a mira do N3. Fica fácil de ler ("saiu o N3, saiu a onda").
4. **Os 15 efeitos da tabela:** aprova a lista como ponto de partida, pra ajustar com o robô e no `?lab=maximo`?
   *Recomendo aprovar e marcar os que quiser trocar.* Os que mais pedem o seu olho: Psíquico (curva, o mais forte),
   Terrestre (derruba o goleiro) e Venenoso (o mais fraco na hora).
5. **Faixa de equilíbrio:** toda política "segura pro N3" com +1 a +3 pp sobre nunca usar, e nenhum tipo mais de 1,5
   pp acima da média dos tipos? *Recomendo essa meta,* medida com 384 partidas pareadas por tipo (±1,6 pp).
6. **Goleiro capitão por tipo:** agora ou numa 2ª rodada? *Recomendo 2ª rodada* (a defesa máxima acabou de ser
   ajustada pra +4 pp no máximo; mexer de novo junto embaralha a medida).
7. **Fada:** efeito próprio (Brilho da lua) ou o Clefable/Clefairy usam o Normal? *Recomendo o Brilho da lua* (é 1
   linha a mais e o Clefable é carta querida).
8. **Rival IA:** os líderes também ganham o efeito do tipo do capitão deles? *Recomendo sim* (cada ginásio fica com a cara do capitão
   dele; o Lance com o Dragonite solta a Fúria do dragão).
9. **Fase 2:** as 12 assinaturas da lista (Dragonite, Snorlax, Arcanine, Articuno, Blastoise, Charizard, Pikachu,
   Gengar, Mewtwo, Gyarados, Mew e Ditto), só na forma final, depois da fase 1 no ar? *Recomendo sim, numa versão
   própria.*
10. **Volume do N3:** se a medida mostrar a política "segura pro N3" abaixo de +1 pp com o efeito, baixar o gomo pra
    10 pontos (N3 ~min 26)? *Recomendo medir o efeito primeiro e trazer o gomo de 10 como 2º passo, com antes/depois.*
11. **Bandeira:** fase 1 atrás de `?maximo-tipo=1` até você jogar na prévia (ADR 0005)? *Recomendo sim.*

12. **Precisão do N3:** 43% dos chutes N3 iam pra fora. Dar mais precisão ao N3, sem bandeira (vale também pro golpe
    máximo de hoje)? *Aprovado em 23/10.*

## Fase 1 no código (23/10)

O que entrou (motor 12; a integração junta com os patrocínios, que também usam o 12):

- **Decisão 12, sem bandeira:** o alvo do chute N3 chega pro meio do gol (`AGENCY.maxAim` = 0,6 da distância do meio;
  a IA mirava a 0,3 m da trave). N1 e N2 iguais bit a bit (as 8 partidas antigas do golden master não mudaram).
- **Efeito do tipo, atrás de `?tipo=1` (ou `?maximo-tipo=1`, `MatchConfig.maxType`):** só no N3, com o ícone do tipo
  apagado no botão no N1 e no N2 e aceso no N3 (prévia, decisão 1). Tipo = o do golpe máximo se for STAB, senão o 1º
  (`maxFxType`, decisão 2; Aço vira Normal). A nota do toque não mexe no efeito (decisão 3). Os líderes rivais também
  usam (decisão 8). Fada = Brilho da lua (decisão 7). A Liga roda sem a bandeira; o Duelo compara a versão 12.4.
- **Números num lugar só:** `AGENCY.maxType` (`src/engine/agency.ts`); ganchos em `kick`/`maxFxShot` (na hora do
  chute), no bloqueio e na defesa (`checkShotInteractions`, `maxFxStop`), na bola (`updateBall`, curva) e na posse
  (`checkPossession`, voleio do Lutador). Evento novo `maxFx` (`shot`/`hit`).
- **Ajustes da tabela pra caber no motor:** o goleiro **nunca** fica parado (parado = sem defesa nenhuma, o N3 virava
  gol certo). Então Terrestre derruba só a linha (o goleiro alcança x0,8), Água empurra o goleiro 1 m sem derrubar,
  Planta e Fada viram alcance (x0,86 e x0,85). Venenoso ganhou o efeito na hora (a nuvem envenena e quem está nela não
  bloqueia). Pedra = fura o 1º bloqueio e espalma curto (sem as pedras no chão).
- **Tela:** a faixa grande do N3 leva o nome do efeito na cor do tipo; a receita de um golpe do tipo (`move-fx.ts`) vai
  do capitão ao goleiro; estouro do tipo na bola e o rastro do tipo; quem é pego ganha um texto curto ("Queimou!",
  "Pulou na isca!"). Demo: `?demo=maximo&nivel=3&tipo=1&capitao=<id>`.
- **Testes:** `src/engine/max-type.test.ts` (um por efeito, imunidades, bandeira desligada, determinismo) e 2 partidas
  novas no golden master (`maxTypeMatch`: o robô n3 e o Lance).

### Precisão do N3 (decisão 12)

`scripts/balance/maximo-tipo.ts`, 400 partidas, política n3, nota 40/40/20, mesmas seeds (140 chutes N3, ± ≈ 4 pp):

| Desfecho do N3 | Motor 11 | Motor 12 (mira) | Motor 12 + tipo |
|---|---:|---:|---:|
| gol | 38,6% | **53,6%** | 60,0% |
| pra fora | **37,9%** | **17,9%** | 16,4% |
| trave | 7,9% | 8,6% | 5,7% |
| bloqueio | 7,1% | 11,4% | 7,1% |
| defesa | 6,4% | 6,4% | 8,6% |

### Robô por tipo (n=200)

`MAXTIPO=1 CAPTYPE=<tipo> POLS=n3 npx tsx scripts/balance/coach.ts 200 out.json 4 max`: o capitão de linha do robô é
de cada tipo (rodízio pelas espécies), política "segura pro N3" contra "nunca usa", mesmas seeds (± 1,3 a 2,4 pp):

| Tipo | Δ vitória (pp) | ± | N3/jogo | Gol do N3/jogo |
|---|---:|---:|---:|---:|
| Água | **+3,5** | 2,1 | 0,37 | 0,22 |
| Terrestre | **+3,5** | 1,5 | 0,24 | 0,12 |
| Gelo | +3,0 | 2,2 | 0,48 | 0,30 |
| Psíquico | +2,5 | 1,8 | 0,49 | 0,39 |
| Elétrico | +2,0 | 2,2 | 0,44 | 0,28 |
| Venenoso | +2,0 | 1,9 | 0,37 | 0,20 |
| Inseto | +2,0 | 2,0 | 0,39 | 0,23 |
| Pedra | +2,0 | 1,9 | 0,36 | 0,21 |
| Voador | +1,5 | 2,4 | 0,51 | 0,24 |
| Normal | +1,0 | 1,9 | 0,32 | 0,17 |
| Planta | +1,0 | 2,1 | 0,49 | 0,28 |
| Fogo | +0,5 | 1,5 | 0,34 | 0,20 |
| Lutador | +0,5 | 1,8 | 0,22 | 0,14 |
| Dragão | +0,5 | 1,3 | 0,35 | 0,20 |
| Fada | +0,5 | 0,5 | 0,18 | 0,11 |
| Fantasma | +0,0 | 2,4 | 0,45 | 0,23 |
| **Média** | **+1,7** | | | |

Política geral (capitão sorteado, 200 partidas pareadas):

| Política (Δ vs nunca) | Motor 11 | Motor 12 (mira) | Motor 12 + tipo |
|---|---:|---:|---:|
| n1 (solta no 1º gomo) | +0,5 | +0,5 ± 3,4 | +0,5 ± 3,4 |
| **n3 (segura pro 3º)** | +0,0 | **+1,5 ± 2,2** | **+3,5 ± 2,2** |

Calibrate com o técnico IA nos dois times (`npm run calibrate -- --n 200 --agencia [--tipo]`):

| | Gols/jogo | Favorito vence | Goleadas | Máximos/jogo (N1/N2/N3) | Viraram gol |
|---|---:|---:|---:|---|---:|
| Motor 11 (0.9.14) | 7,99 | 64,5% | 1,5% | 0,61 (0,04/0,41/0,15) | 0,22 |
| Motor 12 | 7,99 | 65,9% | 1,5% | 0,60 (0,04/0,41/0,15) | 0,22 |
| Motor 12 + tipo | 7,96 | 65,2% | 1,5% | 0,58 (0,03/0,41/0,15) | 0,23 |

O que dá pra ler:

- **Precisão: pra fora caiu de 38% pra 18%** e o gol do N3 subiu de 39% pra 54%. Só isso já faz segurar compensar
  (+1,5 pp, era +0,0).
- **Meta (decisão 5): segurar fica em +1 a +3 pp na média dos tipos (+1,7) e na política geral (+3,5 ± 2,2, no teto).**
  Por tipo, Água e Terrestre (+3,5) passam 0,3 pp do limite "média + 1,5" (3,2), dentro do erro da medida (± 1,5 a
  2,1). No fundo, Fantasma (+0,0), Fogo, Lutador, Dragão e Fada (+0,5). Os extremos ficam a 3,5 pp um do outro, o que
  com n=200 ainda é quase todo ruído. Pra cravar, 384 por tipo nos extremos (Água, Terrestre, Fantasma).
- **Gomo de 10 pontos (decisão 10): não precisa.** Segurar já passou de +1 pp.
- O calibrate quase não mexe (os rivais soltam pouco N3: 0,15 por jogo).
- **Psíquico** (o mais perigoso na proposta) ficou no meio (+2,5): a mira nova já tirou o balde de "pra fora" que ele
  ia corrigir. **Venenoso** subiu com o efeito na hora (+2,0). **Terrestre** é o que mais pede o olho (+3,5): se
  incomodar, o goleiro x0,85 em vez de x0,8.

Prints (headless, `?demo=maximo&nivel=3&tipo=1&capitao=6|65|51|94`, 390 e 1440): o ícone do tipo aceso no botão do
N3, a faixa "BOLA EM CHAMAS!" / "BOLA FANTASMA!" e a receita do tipo no lance. Pra ver de verdade: jogar na prévia.

### Rascunho das Novidades

Título: **Golpe máximo com a cara do capitão**

- O chute do nível 3 agora mira mais pro meio do gol: bem menos bola pra fora
- (com `?tipo=1`, até o Miguel jogar) No nível 3, o golpe máximo ganha o efeito do tipo do capitão
- Charizard solta a bola em chamas, Blastoise empurra a defesa com uma onda, Gengar atravessa o zagueiro
- Alakazam curva a bola, Dugtrio faz a quadra tremer, Scyther solta um enxame e o goleiro pula na isca
- O ícone do tipo aparece no botão: apagado no nível 1 e 2, aceso no 3
- Capitão de dois tipos: vale o tipo do golpe máximo, se for do tipo dele
- Os líderes também usam: o Lance solta a Fúria do dragão
