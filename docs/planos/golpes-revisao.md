---
description: Revisão a fundo dos golpes confusos ou repetidos.
---

# Golpes: revisão a fundo (21/10/2026)

Pedido do Miguel: "Vários golpes estão meio confusos, meio iguais, ou então sem fazer muito sentido. Vamos fazer uma
análise a fundo." Junto, a regra do tipo próprio (o Gengar sem golpe Venenoso), já aprovada em princípio.

**Isto é pesquisa.** Nada mudou no jogo. Todas as simulações rodaram sem mexer no código do motor: o script troca os
golpes das cartas e liga as mudanças por fora.

- Script: `scripts/balance/golpes-revisao.ts` (lint relaxado). Modos: `inventario`, `iguais`, `especies`,
  `diff <regras>`, `calib <N> <regras>` (o mesmo `npm run calibrate`, mesmas seeds, mais o uso de cada golpe) e
  `troca <M> <regras>` (partidas pareadas: mesma seed e mesmos times, só os golpes da espécie mudam).
- Regras que dá pra ligar: `tipo` (degrau A), `flyfix` (Fly/Dig levam a bola 2 m), `c` (degrau C), `dupbeh`, `menosmt`,
  `semsplash` (degrau D).
- Saídas no scratchpad (`.../scratchpad/golpes-rev/`).
- Docs anteriores: [golpes-proposta.md](golpes-proposta.md) (as 12 famílias), [golpes-motor-relatorio.md](golpes-motor-relatorio.md)
  (o que entrou no motor), [golpes-por-tipo.md](golpes-por-tipo.md) (a auditoria do Gengar).

---

## 0. Resumo

1. 164 golpes, 120 em algum moveset padrão. Nenhum é mais "enfeite": o kind `flavor` não tem golpe nenhum.
2. **Iguais demais de verdade são poucos.** A maioria dos "clones" já era clone na Gen 1 (Fury Swipes = Fury Attack,
   os 5 sonos, os 3 nocautes). O que incomoda é outra coisa: **9 espécies levam 2 golpes de mesmo efeito no mesmo
   moveset** (Charizard com Flamethrower + Fire Blast, Raichu com Thunder + Thunderbolt...).
3. **Confuso é o texto, não o golpe.** 74 golpes não têm texto próprio e caem num texto genérico do tipo de golpe.
   O genérico esconde o preço (Double-Edge cansa, Explosion derruba quem usou, Thrash confunde) e o efeito (qual
   status, quanto tempo, quem é imune).
4. **Sem sentido de verdade:** Harden (7 espécies, 0,65 uso por jogo) e Amnesia (Snorlax) não fazem nada que se veja;
   Tri Attack promete queimar/congelar/paralisar e não faz nada (bug de dados); Light Screen e Reflect dão +7% de
   chute sem querer; Splash ocupa uma vaga do Gyarados.
5. **Regra do tipo próprio (A):** 13 espécies mudam. Feita pela nota que o jogo já usa, ela troca utilitário por
   Toxic nos Nidos e no Beedrill (mantém o dano), em vez de pôr Poison Sting (força 0,13).
6. **Achado da simulação:** a regra A dá o Fly ao Charizard, e o Fly com a bola é gol fácil (32 gols em 400 jogos).
   Com o voo levando a bola 2 m em vez de 4, cai para 24 e o geral volta para a meta.
7. Proposta em 4 degraus: A (regra do tipo + Fly 2 m), B (textos), C (5 consertos pequenos no motor), D (mudanças
   maiores nos movesets). A não muda a força de ninguém no total (44,1% → 43,8% em 1040 partidas pareadas); C dá
   +2,7 pp às 16 espécies que levam Harden, Slam ou Amnesia, quase todas do fundo da tabela.

---

## Decisões do Miguel e o que entrou (21/10/2026, branch `golpes`, ENGINE_VERSION 8)

Aprovado como recomendado: perguntas 1, 2 e 5 a 17. Nas 3 e 4:
- **Gengar:** sai o **Confuse Ray** (o combo Hypnosis → Dream Eater fica) e o golpe Venenoso é **Sludge**, numa exceção
  fora da Gen 1 só para ele (`LEARNSET_EXTRA` em `src/engine/data.ts`; da Gen 2 em diante ele aprende Sludge Bomb).
  Gengar = Dream Eater, Night Shade, Sludge, Hypnosis. Haunter e Gastly seguem a regra (Toxic).
- **Hitmonchan:** Agility ⇒ Counter (os 3 socos ficam).
- Butterfree fora da regra do tipo; D1 e D4 (fora o Gengar) ficam para depois.

O que entrou no código:
- **A** regra do tipo próprio no `defaultMoveset` (`ownTypeRule`), as trocas na mão em `MOVESET_SWAP` (Gengar,
  Hitmonchan, Gyarados: fácil de mudar, uma linha cada) e o Fly levando a bola 2 m (`airCarry`).
- **B** texto gerado pelos números do motor (`src/i18n/move-text.ts`, PT e EN) para todo golpe sem explicação
  própria; textos à mão para Harden, Slam, Light Screen, Reflect e Transform.
- **C** Harden = Defense Curl, Slam com alcance, Amnesia = Special +2, Tri Attack sorteando 3 status, Explosion 4 m,
  paredes sem o +7%. Os números que o texto usa saíram do `match.ts` para o `MOVE_TUNING`.
- **D2** sem 2 golpes de mesmo efeito (`moveBehavior`); Ponyta e Tangela ficam de fora até você ver.
- **D3** Gyarados: Splash ⇒ Hyper Beam.
- Duelo aceita qualquer golpe do learnset (com a exceção do Gengar): carta salva com o moveset antigo continua valendo.
- Testes novos em `src/engine/traits.test.ts` (regra do tipo, sem 2 iguais, trocas, Duelo, C1 a C5, Fly);
  hashes do determinismo novos; `npm run edge:liga` feito (sem deploy).

### Movesets que mudaram (20 espécies)

| Pokémon | Antes | Sai ⇒ entra | Por quê |
|---|---|---|---|
| 4 Charmander | Ember, Slash, Swords Dance, Fire Blast | Fire Blast ⇒ Dragon Rage | D2 (Ember = Fire Blast) |
| 5 Charmeleon | Slash, Flamethrower, Swords Dance, Fire Blast | Fire Blast ⇒ Dragon Rage | D2 |
| 6 Charizard | Flamethrower, Earthquake, Swords Dance, Fire Blast | Fire Blast ⇒ Fly | A (Voador) |
| 15 Beedrill | Twineedle, Double-Edge, Agility, Pin Missile | Agility ⇒ Toxic | A (Veneno) |
| 26 Raichu | Thunder, Slam, Thunder Wave, Thunderbolt | Thunderbolt ⇒ Agility | D2 |
| 31 Nidoqueen | Body Slam, Earthquake, Counter, Bite | Counter ⇒ Toxic | A |
| 32 Nidoran♂ | Double Kick, Blizzard, Focus Energy, Thunder | Focus Energy ⇒ Toxic | A |
| 33 Nidorino | Horn Attack, Double Kick, Focus Energy, Blizzard | Focus Energy ⇒ Toxic | A |
| 34 Nidoking | Thrash, Earthquake, Focus Energy, Double Kick | Focus Energy ⇒ Toxic | A |
| 41 Zubat | Leech Life, Wing Attack, Confuse Ray, Supersonic | Supersonic ⇒ Toxic | A |
| 42 Golbat | Wing Attack, Leech Life, Confuse Ray, Supersonic | Supersonic ⇒ Toxic | A |
| 59 Arcanine | Fire Blast, Bite, Agility, Flamethrower | Flamethrower ⇒ Take Down | D2 |
| 92 Gastly | Lick, Night Shade, Confuse Ray, Hypnosis | Hypnosis ⇒ Toxic | A |
| 93 Haunter | Night Shade, Dream Eater, Confuse Ray, Hypnosis | Hypnosis ⇒ Toxic | A |
| 94 Gengar | Dream Eater, Night Shade, Confuse Ray, Hypnosis | Confuse Ray ⇒ **Sludge** | decisão do Miguel |
| 106 Hitmonlee | High Jump Kick, Mega Kick, Focus Energy, Jump Kick | Jump Kick ⇒ Double Kick | D2 |
| 107 Hitmonchan | Thunder Punch, Fire Punch, Agility, Ice Punch | Agility ⇒ Counter | decisão do Miguel |
| 120 Staryu | Water Gun, Blizzard, Thunder Wave, Hydro Pump | Hydro Pump ⇒ Psychic | D2 |
| 130 Gyarados | Hydro Pump, Bite, Splash, Dragon Rage | Splash ⇒ Hyper Beam | D3 |
| 138 Omanyte | Water Gun, Blizzard, Withdraw, Hydro Pump | Hydro Pump ⇒ Surf | D2 |

Para mudar o Gengar ou o Hitmonchan depois: uma linha em `MOVESET_SWAP` (`src/engine/moves.ts`).

### Textos: 6 exemplos antes ⇒ depois (carta, Golpedex e MT)

| Golpe | Antes | Depois |
|---|---|---|
| Explosion | Físico: chute potente com a bola, carrinho forte sem ela | Explode: derruba e empurra todo mundo a 4 m, até companheiro. Quem usou fica 1,6 s no chão, sem fôlego. Com a bola, o chute sai junto. |
| Double-Edge | Físico: chute potente com a bola, carrinho forte sem ela | Físico: chute potente com a bola, carrinho forte sem ela. Quem usa perde 4% do fôlego. |
| Thunder Wave | Status no rival perto (paralisia, sono, veneno, confusão) | Paralisa o rival mais perto: fica lento por 6 s. Terra é imune. Acerta 90%. |
| Sleep Powder | Status no rival perto (paralisia, sono, veneno, confusão) | Faz o rival mais perto dormir: fica parado 2,5 s. Planta é imune. Acerta 75%. |
| Amnesia | Reforço: sobe atributos por um tempo | Reforço: passe, chute e leitura sobem 14% por 12 s. |
| Tri Attack | Especial: finalização de longe ou chute colocado | Especial: finalização de longe ou chute colocado. Pode queimar, congelar ou paralisar. |

Em inglês sai o mesmo pelos mesmos números ("Paralyzes the nearest rival: it slows down for 6 s. Ground types are
immune. 90% accuracy.").

### Calibragem: `npm run calibrate -- --n 400`, antes (main 0.9.2.1, v7) e depois (v8)

| Métrica | Antes (v7) | Depois (v8) | Meta |
|---|---|---|---|
| Gols por jogo | 7,59 | 7,64 | 5–7 (já estava acima por causa da Pressão final) |
| Mais forte (Δ≥3) vence | 62,3% | 62,6% | 60–65% |
| Empates no tempo normal | 19,0% | 13,5% | — |
| Goleadas (6+) | 2,0% | 3,3% | — |
| Golpes por jogo | 30,6 | 30,9 | — |
| Gols logo após chute com golpe (400 jogos) | 136 | 179 | — |
| Fly: usos por jogo / gols em 400 jogos | 0 / 0 | 0,39 / 21 | — |
| Toxic por jogo | 0,55 | 0,99 | — |
| "Enrola" (Defense Curl e Harden) por jogo | 0,56 | 1,45 | — |
| Alcance (desarme de longe) por jogo | 0,35 | 0,59 | — |
| Melhor / pior tipo | Aço 57% (23 jogos) / Dragão 39% | Dragão 56% / Aço 39% (23 jogos) | ≤ 58 / ≥ 42 |

Erro da medida: favorito ±2,9 pp, gols ±0,13, tipo ±5 pp (Aço e Dragão, com 23 e 94 jogos, ±10). Gols e favorito
não mudaram. Os empates caíram 5,5 pp e as goleadas subiram 1,3 pp: mais gol saindo de golpe (179 × 136, boa parte do
Fly do Charizard, que mesmo com 2 m faz 21 gols em 400 jogos) desempata mais jogos. O Dragão subiu com o Slam de
alcance (Dratini e Dragonair) e o Dragon Rage na linha do Charmander não conta (não são Dragão).

**Gengar antes ⇒ depois (pareado, 160 partidas, mesmos times e seeds, só os golpes dele mudam):** com Confuse Ray
45,0% de vitórias e saldo −0,23; com Sludge 44,4% e −0,16. Erro ±4 pp: **a força dele não mudou.**

---

## 1. Como um golpe vira jogo (o que o motor olha de verdade)

Só a IA usa golpe (o jogador escolhe time, tática e gritos, não aperta golpe). Cada golpe tem **1 uso por partida** (2
se o PP da Gen 1 for 25 ou mais), 25 s de recarga por jogador e 5 s entre golpes de qualquer um.

| Kind | Com a bola | Sem a bola | Quantos |
|---|---|---|---|
| strike (físico) | chute: força ×(1 + 0,3·F), mira ×(1 + 0,2·F) | o próximo carrinho (1,5 s) com força ×(1 + 0,4·F) e o secundário | 69 |
| blast (especial) | chute: força ×(1 + 0,15·F), mira ×(1 + 0,45·F) | rajada no rival mais perto até 7 m: atordoa, cansa, empurra, secundário | 36 |
| burst | arrancada | arrancada | 2 |
| buff | sobe atributo do Gen 1 (Atk → chute/força, Def → desarme/força, SpA → passe/chute, SpD → posicionamento, Spe → velocidade, evasão → drible) +7% por estágio, 12 s | igual | 15 |
| debuff | — | o mesmo, −8% por estágio, no rival (ou em área), 10 s | 9 |
| status | — | paralisa (6 s, velocidade ×0,6), sono (2,5 s parado), veneno (10 s), confusão (4 s, passe ×0,7) | 13 |
| heal | — | fôlego | 3 |
| special | — | código próprio por golpe (Counter, Haze, Metronome...) | 17 |

**F = força** = poder do golpe ÷ 120, com teto 1. Os dados usam o poder moderno, não o da Gen 1 (Leech Life 80, não
20; Wing Attack 60, não 35). Por causa do teto, **11 golpes ficam com força 1,00** e empatam: Double-Edge, Mega Kick,
Thrash, Petal Dance, Hyper Beam, Solar Beam, Skull Bash, Sky Attack, High Jump Kick, Explosion e Self-Destruct.

Dentro de um mesmo kind, um golpe só se diferencia por: força, precisão, tipo (vantagem contra goleiro e carrinho),
secundário (`secondary` dos dados), preço (`DRAWBACK`), traço (`MOVE_TRAITS`, as 12 famílias) ou código por id.

---

## 2. Inventário: o que cada golpe faz em quadra

Agrupado pelo efeito real no motor. "Padrão" = quantas espécies levam no moveset padrão. "Usos por jogo" = média em
400 partidas do calibrate (times da IA, as mesmas seeds do `npm run calibrate`). Golpe com 0 só aparece por MT, baú
raro, rival do ginásio ou Metronome.

### A1 Físico puro: só muda a força (10)

| Golpe | Tipo | Força | Padrão | Usos por jogo |
|---|---|---|---|---|
| Slam | Normal | 0,67 | 7 | 0,245 |
| Wing Attack | Voador | 0,50 | 5 | 0,163 |
| Horn Attack | Normal | 0,54 | 3 | 0,037 |
| Peck | Voador | 0,29 | 3 | 0,010 |
| Tackle | Normal | 0,33 | 3 | 0,077 |
| Mega Kick | Normal | 1,00 | 1 | 0,010 |
| Vice Grip | Normal | 0,46 | 1 | 0,005 |
| Mega Punch | Normal | 0,67 | 0 | 0 |
| Pound | Normal | 0,33 | 0 | 0 |
| Scratch | Normal | 0,33 | 0 | 0 |

### A2 Físico + secundário (12)

| Golpe | Tipo | Força | Secundário | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Bite | Sombrio | 0,50 | hesita | 17 | 1,015 |
| Leech Life | Inseto | 0,67 | suga fôlego | 6 | 0,117 |
| Headbutt | Normal | 0,58 | hesita | 4 | 0,117 |
| Poison Sting | Veneno | 0,13 | envenena | 3 | 0,040 |
| Body Slam | Normal | 0,71 | paralisa | 2 | 0,075 |
| Fire Punch | Fogo | 0,63 | queima | 2 | 0,095 |
| Hyper Fang | Normal | 0,67 | hesita | 2 | 0,048 |
| Ice Punch | Gelo | 0,63 | congela | 2 | 0,083 |
| Thunder Punch | Elétrico | 0,63 | paralisa | 2 | 0,095 |
| Waterfall | Água | 0,67 | hesita | 2 | 0,028 |
| Dizzy Punch | Normal | 0,58 | confunde | 1 | 0,052 |
| Lick | Fantasma | 0,25 | paralisa | 1 | 0,010 |

### A3 Físico com preço (8)

| Golpe | Tipo | Força | Preço | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Double-Edge | Normal | 1,00 | perde 4% de fôlego | **17** | 0,390 |
| Thrash | Normal | 1,00 | 50% de ficar confuso | 5 | 0,150 |
| Take Down | Normal | 0,75 | perde 4% de fôlego | 3 | 0,160 |
| Explosion | Normal | 1,00 | explode 3 m, cai 1,6 s com 15% de fôlego | 2 | 0,070 |
| Submission | Lutador | 0,67 | perde 4% de fôlego | 2 | 0,120 |
| High Jump Kick | Lutador | 1,00 | errou: −8% fôlego e 0,6 s no chão | 1 | 0,013 |
| Jump Kick | Lutador | 0,83 | errou: igual | 1 | 0,018 |
| Self-Destruct | Normal | 1,00 | igual ao Explosion | 1 | 0,005 |

### A4 Nocaute (3)

Guillotine (1 espécie, 0,080), Horn Drill (1, 0,030), Fissure (0). Todos Normal/Terra, força 0,58, acertam 30%;
o carrinho que acerta deixa o rival 2,2 s no chão. Na simulação acertaram 16% e 25% (a precisão rola antes e o
carrinho ainda precisa pegar).

### A5 Físico com traço próprio (36)

| Golpe | Tipo | Força | Traço | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Earthquake | Terra | 0,83 | área que pega companheiro | **24** | 0,880 |
| Slash | Normal | 0,58 | crítico | 10 | 0,250 |
| Rock Slide | Pedra | 0,63 | área, hesita | 7 | 0,145 |
| Double Kick | Lutador | 0,50 | 2 tentativas | 5 | 0,100 |
| Drill Peck | Voador | 0,67 | fura bloqueio | 5 | 0,145 |
| Razor Leaf | Planta | 0,46 | área, crítico | 4 | 0,270 |
| Rock Throw | Pedra | 0,42 | alcance 2,8 m | 4 | 0,210 |
| Double Slap | Normal | 0,38 | 2 a 5 tentativas | 3 | 0,135 |
| Sky Attack | Voador | 1,00 | carga, crítico, hesita | 3 | 0,090 |
| Vine Whip | Planta | 0,38 | alcance 2,8 m | 3 | 0,235 |
| Bone Club | Terra | 0,54 | alcance, hesita | 2 | 0,065 |
| Crabhammer | Água | 0,83 | crítico | 2 | 0,033 |
| Karate Chop | Lutador | 0,42 | crítico | 2 | 0,010 |
| Low Kick | Lutador | 0,50 | derruba mais quem é pesado | 2 | 0,102 |
| Pin Missile | Inseto | 0,63 | 2 a 5, rebote | 2 | 0,072 |
| Spike Cannon | Normal | 0,50 | 2 a 5, rebote | 2 | 0,060 |
| Stomp | Normal | 0,54 | pisa no Minimize, hesita | 2 | 0,115 |
| Bonemerang | Terra | 0,83 | 2 tentativas, rebote sempre, alcance | 1 | 0,098 |
| Clamp | Água | 0,29 | rouba e segura a bola 1 s | 1 | 0,000 |
| Comet Punch | Normal | 0,45 | 2 a 5 | 1 | 0,028 |
| Dig | Terra | 0,67 | cava 0,8 s | 1 | 0,013 |
| Fury Swipes | Normal | 0,45 | 2 a 5 | 1 | 0,015 |
| Seismic Toss | Lutador | 0,58 | dano fixo, arremessa 3 m | 1 | 0,070 |
| Super Fang | Normal | 0,58 | tira metade do fôlego | 1 | 0,022 |
| Twineedle | Inseto | 0,42 | 2 tentativas, envenena | 1 | 0,020 |
| Barrage, Fury Attack | Normal | 0,38 | 2 a 5 (Barrage com rebote) | 0 | 0 |
| Bind, Wrap | Normal | 0,13 | alcance, prende os dois 1,2 s | 0 | 0 |
| Constrict | Normal | 0,08 | aperta (lento 2 s) | 0 | 0 |
| Cut | Normal | 0,42 | fura bloqueio | 0 | 0 |
| Egg Bomb | Normal | 0,83 | cobertura | 0 | 0 |
| Fly | Voador | 0,75 | voa 0,8 s | 0 | 0 |
| Rolling Kick | Lutador | 0,50 | área 2 m, hesita | 0 | 0 |
| Skull Bash | Normal | 1,00 | carga sem perder a bola | 0 | 0 |
| Strength | Normal | 0,67 | empurra 2,5 m | 0 | 0,003 |

### B1 Especial puro (3)

Hydro Pump (Água 0,92, **20 espécies**, 0,623), Tri Attack (Normal 0,67, 2, 0,055), Water Gun (Água 0,33, 2, 0,013).

### B2 Especial + secundário (17)

| Golpe | Tipo | Força | Secundário | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Fire Blast | Fogo | 0,92 | queima | **19** | 0,892 |
| Thunder | Elétrico | 0,92 | paralisa | **18** | 0,502 |
| Psychic | Psíquico | 0,75 | −10% posicionamento | 13 | 0,590 |
| Flamethrower | Fogo | 0,75 | queima | 6 | 0,500 |
| Psybeam | Psíquico | 0,54 | confunde | 5 | 0,125 |
| Confusion | Psíquico | 0,42 | confunde | 4 | 0,152 |
| Ember | Fogo | 0,33 | queima | 4 | 0,098 |
| Ice Beam | Gelo | 0,75 | congela | 4 | 0,100 |
| Aurora Beam | Gelo | 0,54 | −10% chute/força | 3 | 0,025 |
| Sludge | Veneno | 0,54 | envenena | 3 | 0,058 |
| Thunderbolt | Elétrico | 0,75 | paralisa | 3 | 0,063 |
| Absorb | Planta | 0,17 | suga fôlego | 2 | 0,028 |
| Dream Eater | Psíquico | 0,83 | suga (dobro em quem dorme) | 2 | 0,045 |
| Smog | Veneno | 0,25 | envenena | 1 | 0,003 |
| Thunder Shock | Elétrico | 0,33 | paralisa | 1 | 0,000 |
| Bubble Beam | Água | 0,54 | −10% velocidade | 0 | 0 |
| Mega Drain | Planta | 0,33 | suga fôlego | 0 | 0 |

### B3 Especial com preço (2)

Petal Dance (Planta 1,00, 50% de confusão depois, 2 espécies, 0,075) e Hyper Beam (Normal 1,00, recarga 0,9 s, sem
recarga se fizer gol, 1 espécie, 0,117).

### B4 Especial com traço próprio (14)

| Golpe | Tipo | Força | Traço | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Blizzard | Gelo | 0,92 | área, congela | **36** | 0,855 |
| Acid | Veneno | 0,33 | área | 8 | 0,307 |
| Solar Beam | Planta | 1,00 | carga | 6 | 0,168 |
| Surf | Água | 0,75 | área que pega companheiro | 6 | 0,142 |
| Dragon Rage | Dragão | 0,58 | dano fixo | 4 | 0,240 |
| Bubble | Água | 0,33 | área, lento | 3 | 0,022 |
| Night Shade | Fantasma | 0,58 | dano fixo | 3 | 0,063 |
| Sonic Boom | Normal | 0,58 | dano fixo | 3 | 0,020 |
| Gust | Voador | 0,33 | sopra a bola | 2 | 0,040 |
| Fire Spin | Fogo | 0,29 | anel de fogo | 1 | 0,077 |
| Pay Day | Normal | 0,33 | moedas | 1 | 0,005 |
| Psywave | Psíquico | 0,58 | força sorteada | 1 | 0,003 |
| Razor Wind | Normal | 0,67 | carga, área, crítico | 0 | 0 |
| Swift | Normal | 0,50 | área, nunca erra | 0 | 0 |

### C Arrancada (2)

Agility (Psíquico, **29 espécies**, **3,11 usos por jogo**: o golpe mais usado do jogo, 99% com a bola) e Quick Attack
(Normal, 12, 1,50).

### D Reforço (15)

| Golpe | Tipo | O que sobe (12 s) | Extra | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Focus Energy | Normal | +7% chute/força | próximo chute ou carrinho é crítico | 14 | 1,590 |
| Swords Dance | Normal | +14% chute/força | — | 8 | 0,738 |
| Harden | Normal | +7% desarme/força | **nada** | 7 | 0,645 |
| Withdraw | Água | +7% desarme/força | casco 1,5 s | 6 | 0,560 |
| Defense Curl | Normal | +7% desarme/força | o próximo carrinho não tira a bola | 3 | 0,480 |
| Amnesia | Psíquico | +14% posicionamento | **nada** | 2 | 0,065 |
| Light Screen | Psíquico | +7% chute/força (sem querer) | parede: especial/status no time ×0,5 por 15 s | 2 | 0,160 |
| Barrier | Psíquico | +14% desarme/força | muro 3 s | 1 | 0,087 |
| Acid Armor | Veneno | +14% desarme/força | derrete 3 s | 0 | 0 |
| Double Team | Normal | +7% drible | 2 clones | 0 | 0 |
| Growth | Normal | +7% chute/força/passe | — | 0 | 0 |
| Meditate, Sharpen | Psíquico, Normal | +7% chute/força | — | 0 | 0 |
| Minimize | Normal | +14% drible | encolhe 4 s | 0 | 0 |
| Reflect | Psíquico | +7% chute/força (sem querer) | parede: carrinho no time ×0,7 por 15 s | 0 | 0 |

### E Enfraquecer o rival (9)

String Shot (Inseto, área, lento; 4 espécies, 0,140). Os outros 8 não estão em moveset nenhum: Flash, Growl, Kinesis,
Leer, Sand Attack, Screech, Smokescreen, Tail Whip. Debuff no jogo inteiro: **0,14 por jogo**.

### F Status (13)

| Golpe | Tipo | Status | Precisão | Padrão | Usos por jogo |
|---|---|---|---|---|---|
| Thunder Wave | Elétrico | paralisia (Terra imune) | 90% | **23** | 1,480 |
| Poison Powder | Veneno | veneno (Planta imune) | 75% | 15 | 1,198 |
| Sleep Powder | Planta | sono (Planta imune) | 75% | 13 | 0,620 |
| Supersonic | Normal | confusão | 55% | 12 | 0,490 |
| Toxic | Veneno | veneno que piora | 90% | 10 | 0,545 |
| Confuse Ray | Fantasma | confusão | 100% | 9 | 0,547 |
| Hypnosis | Psíquico | sono | 60% | 9 | 0,328 |
| Sing | Normal | sono | 55% | 6 | 0,065 |
| Poison Gas | Veneno | veneno em área 3 m | 90% | 4 | 0,095 |
| Glare | Normal | paralisia | 100% | 2 | 0,122 |
| Spore | Planta | sono (Planta imune) | 100% | 2 | 0,043 |
| Stun Spore | Planta | paralisia (Planta imune) | 75% | 2 | 0,058 |
| Lovely Kiss | Normal | sono | 75% | 1 | 0,105 |

### G Cura (3)

Soft-Boiled (cura ele e o companheiro mais cansado; Chansey, 0,020), Recover (0), Rest (0).

### H Efeito próprio (17)

Disable (4 espécies, 0,320), Counter (3, 0,130, reação automática), Splash (2, 0,307), Haze (2, 0,045), Mirror Move
(1, 0,110), Metronome (1, 0,068), Whirlwind (1, 0,075), Teleport (1, 0,018), Transform (Ditto, **0**). Sem moveset
padrão: Bide, Conversion, Leech Seed, Mimic, Mist, Rage, Roar, Substitute.

---

## 3. Iguais demais

### 3.1 Grupos de golpes com o mesmo efeito no motor

| Grupo | Golpes | Já era assim na Gen 1? | É problema? | Proposta |
|---|---|---|---|---|
| Golpe básico | Tackle = Pound = Scratch (Normal 0,33, 2 usos) | sim (todos 40/35) | não: só o Tackle está em moveset (Caterpie, Metapod, Magikarp) | tirar Pound e Scratch do **baú raro** (ganhar "Pound" de prêmio é frustrante) |
| Pancada Normal média | Slam ≈ Mega Punch (0,67), Horn Attack ≈ Vice Grip (0,54/0,46) | quase | **sim no Slam**: 7 espécies (Pikachu, Raichu, Victreebel, Lickitung, Tangela, Dratini, Dragonair) e nada de especial | Slam ganha **alcance 2,8 m** (o texto da Gen 1 já diz "cauda longa, vinhas") (C) |
| 2 a 5 golpes | Comet Punch, Double Slap, Fury Attack, Fury Swipes | sim, idênticos (15–18 de poder) | não | deixar |
| Hesita | Headbutt ≈ Hyper Fang (0,58/0,67) | quase | não (Raticate tem Hyper Fang + Super Fang, que são diferentes) | deixar |
| Sono | Hypnosis, Lovely Kiss, Sing, Sleep Powder, Spore (só a precisão muda) | sim | não: é o "jeito" de cada um; os pós já têm a imunidade da Planta | deixar |
| Confusão | Confuse Ray (100%) e Supersonic (55%) | sim | **sim no Zubat e no Golbat**, que levam os dois | a regra A resolve (Supersonic sai) |
| Nocaute | Fissure, Guillotine, Horn Drill | sim | não | deixar |
| Explosão | Explosion = Self-Destruct (força 1,00 nos dois por causa do teto, explosão de 3 m nos dois) | não: 170 × 130 | sim | Explosion com raio de 4 m, Self-Destruct fica com 3 m (C) |
| Reforço Def +1 | Harden, Withdraw, Defense Curl | sim, idênticos | **sim**: Withdraw e Defense Curl ganharam efeito; Harden ficou só com +7%, em 7 espécies | Harden = Defense Curl (o próximo carrinho não tira a bola) (C) |
| Reforço Atk +1 | Meditate = Sharpen | sim | não (ninguém usa no padrão) | deixar |
| Paredes | Light Screen ≈ Reflect | não | o efeito é diferente, mas os dois dão +7% de chute/força sem querer | tirar o bônus acidental (C) |
| Encarada | Leer ≈ Tail Whip (Leer ainda trava 0,3 s) | sim | não (ninguém usa no padrão) | deixar |
| Teto de força | 11 golpes com força 1,00 (lista na seção 1) | não | pouco: Double-Edge (perde 4% de fôlego) fica igual ao Mega Kick (sem preço, 75% de precisão) e vale o mesmo que Hyper Beam | D, se quiser (subir o teto para 150 de poder) |

### 3.2 O que mais incomoda: dois golpes iguais no mesmo moveset

O jogador vê na carta. Hoje, 9 espécies levam 2 golpes de mesmo efeito (mesmo kind, mesmo secundário, mesmo traço;
só a força e a precisão mudam):

| Pokémon | Os dois iguais | Com a regra `dupbeh` (D2), o 2º vira |
|---|---|---|
| Charmander | Ember + Fire Blast | Dragon Rage (MT23) |
| Charmeleon | Flamethrower + Fire Blast | Dragon Rage |
| Charizard | Flamethrower + Fire Blast | Dragon Rage (com a regra A junto: Fly) |
| Raichu | Thunder + Thunderbolt | Agility |
| Arcanine | Fire Blast + Flamethrower | Take Down |
| Ponyta | Ember + Fire Blast | Toxic |
| Hitmonlee | High Jump Kick + Jump Kick | Double Kick |
| Staryu | Water Gun + Hydro Pump | Psychic |
| Omanyte | Water Gun + Hydro Pump | Surf |

Isso vem do 4º golpe ("melhor resto"): ele só penaliza tipo repetido (×0,5), e o Fire Blast (0,92) ainda ganha.

### 3.3 O que deixa todo mundo parecido (não é clone, é repetição)

O 4º golpe é quase sempre uma MT de cobertura forte: **Blizzard em 36 espécies**, Earthquake 24, Thunder Wave 23,
Hydro Pump 20, Fire Blast 19, Thunder 18, Double-Edge 17, Bite 17. E o utilitário mais comum é Agility (29) ou Focus
Energy (14, quase todo Lutador). 13 espécies levam 2 ou mais MTs de cobertura sem STAB (Clefairy leva 3: Blizzard,
Fire Blast e Thunder). Tratado no D1.

---

## 4. Confusos

### 4.1 Texto que esconde o que acontece

Hoje 74 golpes não têm texto próprio. A carta e a Golpedex mostram o texto do kind ("Físico: chute potente com a bola,
carrinho forte sem ela"). Em 40 deles isso basta (chute/rajada comum). Nos outros, o texto esconde algo importante:

| Golpe | Texto hoje (carta e Golpedex) | O que faz de verdade | Texto proposto |
|---|---|---|---|
| Explosion, Self-Destruct | Físico: chute potente com a bola, carrinho forte sem ela | explode: derruba e empurra **todo mundo a 3 m, até companheiro**; quem usou fica 1,6 s no chão com 15% de fôlego | "Explode: derruba e empurra todo mundo a 3 m, até companheiro. Quem usou fica 1,6 s no chão, sem fôlego. Com a bola, o chute sai junto." |
| Double-Edge, Take Down, Submission | Físico: chute potente... | o mesmo, e quem usou perde 4% de fôlego | "...Quem usa perde um pouco de fôlego no impacto." |
| Thrash, Petal Dance | Físico/Especial genérico | depois do golpe, 50% de ficar confuso 4 s | "...Depois, metade das vezes fica confuso (corre torto) por 4 s." |
| Jump Kick, High Jump Kick | Físico genérico | se errar, perde 8% de fôlego e fica 0,6 s no chão | "...Se errar, cai e se machuca." |
| Fissure, Guillotine, Horn Drill | Físico genérico | acerta só 30%; o carrinho que acerta deixa o rival 2,2 s no chão | "Nocaute: acerta 3 em 10. Quando acerta o carrinho, o rival fica 2,2 s no chão." |
| Light Screen | Reforço: sobe atributos por um tempo | parede: por 15 s, golpe especial e de status contra o time pega pela metade | "Parede de luz: por 15 s, golpes especiais e de status contra o seu time pegam pela metade." |
| Reflect | Reforço: sobe atributos por um tempo | parede: por 15 s, carrinho contra o time 30% mais fraco | "Parede: por 15 s, os carrinhos contra o seu time saem 30% mais fracos." |
| Amnesia | Reforço: sobe atributos por um tempo | +14% posicionamento 12 s | (depende do C) "Esvazia a mente: passe, chute e posicionamento sobem bastante por 12 s." |
| Harden | Reforço: sobe atributos por um tempo | +7% desarme e força 12 s | (depende do C) "Endurece: o próximo carrinho que sofrer não tira a bola." |
| Swords Dance | Reforço: sobe atributos por um tempo | +14% chute e força 12 s | "Dança das espadas: chute e força sobem bastante por 12 s." |
| Tri Attack | Especial genérico (e a descrição Gen diz "20% de queimar, congelar ou paralisar") | **nada**: o dado tem a chance mas não tem o status | conserto no C; texto: "Três raios: chute colocado; sem a bola, rajada que pode queimar, congelar ou paralisar." |
| Thunder Wave, Glare, Stun Spore | Status no rival perto (paralisia, sono, veneno, confusão) | paralisa o rival mais perto (até 6,5 m) por 6 s: velocidade ×0,6 | "Paralisa o rival mais perto: fica lento por 6 s. Terra é imune." (Stun Spore: "Planta é imune") |
| Hypnosis, Sing, Sleep Powder, Spore, Lovely Kiss | o mesmo genérico | o rival mais perto dorme 2,5 s (parado) | "Faz o rival mais perto dormir: fica parado 2,5 s. Acerta X%." |
| Poison Powder | o mesmo genérico | veneno 10 s: o fôlego escorre | "Envenena o rival mais perto: o fôlego escorre por 10 s. Planta é imune." |
| Confuse Ray, Supersonic | o mesmo genérico | confusão 4 s: corre torto, passe ×0,7 | "Confunde o rival mais perto: corre torto e erra passe por 4 s. Acerta X%." |
| Leech Life | Físico... · suga o fôlego do alvo | sem a bola, suga **na hora** quem está colado (2,5 m), mesmo sem dar o carrinho | "Morde e suga o fôlego de quem está colado; com a bola, chute forte." |
| Rest | Recupera fôlego | fôlego cheio, mas **dorme 2,5 s** | "Dorme 2,5 s e acorda com o fôlego cheio." |
| Transform (Ditto) | Vira uma cópia do rival mais perto... | nunca é usado: o Ditto já entra transformado (habilidade Impostor) | "O Ditto já entra transformado (Impostor): este golpe fica guardado." |

Detalhes que também confundem, sem conserto necessário:
- **Tipos modernos:** Bite é Sombrio, Gust é Voador, Karate Chop é Lutador e Sand Attack é Terra (na Gen 1 eram
  todos Normal). Agility é Psíquico (isso é Gen 1 mesmo), então o Pidgey aparece com um golpe Psíquico.
- **Poder moderno:** Leech Life (80) está mais forte que Wing Attack (60) e que Bite (60).
- O texto do kind `flavor` ("Só narração, não faz nada") não tem mais golpe nenhum. Pode sair.

### 4.2 Recomendação para os textos

Em vez de escrever 74 textos à mão em dois idiomas, **gerar o texto pelos números do motor** para as famílias
repetitivas (status, reforço, enfraquecer, preço, nocaute, secundário): uma função lê `STATUS_DURATION`, os boosts,
o `DRAWBACK` e a precisão e monta "Paralisa o rival mais perto: fica lento por 6 s. Terra é imune." em PT e EN.
Texto à mão só nos especiais (já existe). Vantagem: se um número mudar, o texto muda junto. Isso não muda partida.

---

## 5. Sem sentido

### 5.1 Golpe que não faz nada que se veja

| Golpe | Quem leva | Usos por jogo | O que faz | Por que é problema |
|---|---|---|---|---|
| Harden | Metapod, Kakuna, Krabby, Kingler, Onix, Kabuto, Kabutops | 0,645 | +7% desarme/força 12 s | é a identidade do Metapod e não aparece em campo |
| Amnesia | Snorlax, Poliwag | 0,065 | +14% posicionamento 12 s | na Gen 1 era o golpe do Snorlax (Special +2); aqui é invisível |
| Tri Attack | Dodrio, Porygon (assinatura) | 0,055 | o secundário rola 20% e não faz nada (`secondary` sem status) | bug de dados; a descrição promete 3 status |
| Light Screen, Reflect | Voltorb, Electrode (Light Screen) | 0,160 | a parede funciona, mas também dão +7% chute/força (o código usa `{ atk: 1 }` quando o golpe não tem boost) | efeito escondido, sem relação com o golpe |
| Splash | Magikarp (de propósito) e **Gyarados** | 0,307 | evasão 1,5 s | o Gyarados herdou do Magikarp (nível 1) e gasta uma vaga |
| Transform | Ditto | 0 | — | o Impostor já transforma (sem conserto: só texto) |
| Psychic (secundário) | 13 espécies | — | −10% posicionamento 10 s | invisível, mas o golpe já é forte: deixar |

### 5.2 Golpe que quase nunca sai mesmo estando no time

Usos por titular por partida (média: 0,4–0,6 para golpes de dano de 1 uso). Os mais baixos: Self-Destruct 0,04,
Smog 0,11, Vice Grip 0,17, Psywave 0,17, Fury Swipes 0,19, Super Fang 0,20, Sonic Boom 0,24, Water Gun 0,24, Peck 0,25,
Dream Eater 0,26, Sing 0,27. Quase todos são o 2º ou 3º golpe de dano: a IA sorteia entre os golpes do kind, então
cada um sai menos. A amostra é pequena (Self-Destruct só no Graveler: 45 titulares). **Não é problema de golpe**: é
como a IA divide os usos. Clamp (Shellder) e Thunder Shock (Magnemite) não saíram nenhuma vez, mas tiveram 3 e 5
titulares na amostra.

### 5.3 Os 151: movesets com problema

`npx tsx scripts/balance/golpes-revisao.ts especies` roda o `defaultMoveset` dos 151 e marca:

| Problema | Quantos | Espécies |
|---|---|---|
| **Falta golpe do tipo próprio, e o learnset tem** | 13 | Charizard (Voador), Butterfree (Inseto), Beedrill, Nidoqueen, Nidoran♂, Nidorino, Nidoking, Zubat, Golbat, Gastly, Haunter, Gengar (Veneno), Hitmonchan (Lutador) |
| Falta golpe do tipo próprio, e o learnset não tem | 16 | Clefairy, Clefable, Jigglypuff, Wigglytuff, Mr. Mime (Fada); Magnemite, Magneton (Aço); Scyther, Pinsir (Inseto); Gyarados, Dragonite (Voador); Omanyte, Omastar, Kabuto, Kabutops, Aerodactyl (Pedra) |
| 2+ golpes de um tipo de fora (sem contar Normal) | 5 | Gengar e Haunter (Psíquico ×2), Poliwag (Hypnosis + Amnesia), Porygon (Psybeam + Agility), Mr. Mime (Thunder + Thunder Wave) |
| 2 golpes de mesmo efeito | 11 | os 9 da seção 3.2 + Zubat e Golbat (Confuse Ray + Supersonic) |
| 2+ MTs de cobertura sem STAB | 13 | Rattata, Nidoran♂, Clefairy (3), Clefable, Machop, Machoke, Machamp, Grimer, Muk, Lickitung, Koffing, Weezing, Mewtwo |
| Dano todo de um tipo só | 7 | Bulbasaur, Ivysaur, Venusaur (Planta ×2), Kadabra, Alakazam (Psybeam + Psychic), Gastly (Lick + Night Shade), Electabuzz (Thunder Punch + Thunder) |
| Só 1 golpe de dano / menos de 4 golpes | 4 | Caterpie (2), Metapod (3), Weedle (2), Kakuna (3): learnset da Gen 1 é assim, deixar |
| 2 reforços e nenhum golpe do tipo | 1 | Pinsir (Swords Dance + Focus Energy) |
| Golpe herdado sem sentido | 1 | Gyarados com Splash |
| Sem nenhum golpe de dano | 0 | (Ditto e Magikarp são de propósito) |

2+ golpes de status aparecem em 27 espécies, mas quase todas são os "pós" das plantas (Poison Powder + Sleep Powder):
é a cara delas, não é problema.

---

## 6. Proposta em degraus

Base de comparação: `npm run calibrate -- --n 400` de hoje, que o script reproduz igual (mesmas seeds).

Todos os números abaixo: 400 partidas, mesmas seeds, times da IA. Erro da medida: favorito ±2,9 pp, gols por jogo
±0,13, vitória por tipo ±4–5 pp. Diferença menor que isso é sorte.

| Métrica | Hoje | A | A + C | A + C + Fly 2 m | A + C + D2 | Meta |
|---|---|---|---|---|---|---|
| Gols por jogo | 6,84 | 7,05 | 7,01 | **6,95** | 7,06 | 5–7 |
| Mais forte (Δ≥3) vence | 62,6% | 59,4% | 61,6% | **64,4%** | 63,0% | 60–65% |
| Empates no tempo normal | 15,5% | 16,8% | 15,0% | 15,8% | 12,8% | — |
| Goleadas (6+) | 1,8% | 2,0% | 2,0% | 1,8% | 1,8% | — |
| Golpes por jogo | 28,4 | 28,8 | 29,0 | 28,8 | 29,1 | — |
| Gols logo após chute com golpe (por jogo) | 0,38 | 0,46 | 0,45 | 0,40 | 0,44 | — |
| Fly: usos / gols em 400 jogos | — | 155 / **32** | 154 / 31 | 152 / 24 | 154 / 32 | — |
| Toxic por jogo | 0,55 | 1,06 | 1,03 | 1,01 | 1,13 | — |
| "Enrola" (Defense Curl/Harden) por jogo | 0,51 | 0,49 | **1,31** | 1,33 | 1,32 | — |
| Alcance (desarme de longe) por jogo | 0,34 | 0,35 | **0,55** | 0,54 | 0,52 | — |
| Debuff por jogo | 0,14 | 0,23 | 0,24 | 0,24 | 0,24 | — |
| Melhor / pior tipo | Psíquico 54 / Aço 39 | Gelo 55 / Lutador 43 | Gelo 56 / Pedra 45 | Fada 55 / Aço 43 | Voador 53 / Terra 46 | ≤ 58 / ≥ 42 |

"Fly 2 m" = `MOVE_TUNING.airCarry` de 4 para 2 (com a bola, o voo leva a bola 2 m em vez de 4 antes do chute). C aqui
é só C1 a C3 (C4 e C5 precisam mexer no motor).

### Degrau A: regra do tipo próprio

**Regra:** depois de montar os 4 golpes, para cada tipo da espécie sem golpe: entra o golpe do tipo com a melhor nota
que o próprio `defaultMoveset` já dá (dano ou utilitário). Sai, nesta ordem de preferência: um golpe da mesma classe
(dano por dano, utilitário por utilitário), um de efeito repetido, um de tipo de fora repetido, um de tipo de fora, um
do tipo próprio repetido. Nunca sai a assinatura nem o único golpe de um tipo próprio. Umas 25 linhas no fim do
`defaultMoveset` + um teste ("todo Pokémon tem 1 golpe de cada tipo dele quando o learnset tem"; hoje falha no Gengar).

| Pokémon | Tipos | Golpes hoje | Sai ⇒ entra |
|---|---|---|---|
| 6 Charizard | Fogo/Voador | Flamethrower, Earthquake, Swords Dance, Fire Blast | Fire Blast ⇒ **Fly** (MO02) |
| 12 Butterfree | Inseto/Voador | Psybeam, Gust, Poison Powder, Sleep Powder | Sleep Powder ⇒ String Shot |
| 15 Beedrill | Inseto/Veneno | Twineedle, Double-Edge, Agility, Pin Missile | Agility ⇒ Toxic |
| 31 Nidoqueen | Veneno/Terra | Body Slam, Earthquake, Counter, Bite | Counter ⇒ Toxic |
| 32 Nidoran♂ | Veneno | Double Kick, Blizzard, Focus Energy, Thunder | Focus Energy ⇒ Toxic |
| 33 Nidorino | Veneno | Horn Attack, Double Kick, Focus Energy, Blizzard | Focus Energy ⇒ Toxic |
| 34 Nidoking | Veneno/Terra | Thrash, Earthquake, Focus Energy, Double Kick | Focus Energy ⇒ Toxic |
| 41 Zubat | Veneno/Voador | Leech Life, Wing Attack, Confuse Ray, Supersonic | Supersonic ⇒ Toxic |
| 42 Golbat | Veneno/Voador | Wing Attack, Leech Life, Confuse Ray, Supersonic | Supersonic ⇒ Toxic |
| 92 Gastly | Fantasma/Veneno | Lick, Night Shade, Confuse Ray, Hypnosis | Hypnosis ⇒ Toxic |
| 93 Haunter | Fantasma/Veneno | Night Shade, Dream Eater, Confuse Ray, Hypnosis | Hypnosis ⇒ Toxic |
| 94 Gengar | Fantasma/Veneno | Dream Eater, Night Shade, Confuse Ray, Hypnosis | Hypnosis ⇒ Toxic |
| 107 Hitmonchan | Lutador | Thunder Punch, Fire Punch, Agility, Ice Punch | Ice Punch ⇒ Submission (MT) |

Diferenças para a tabela de [golpes-por-tipo.md](golpes-por-tipo.md):
- **Nidos e Beedrill:** lá entrava Poison Sting no lugar de um golpe de dano. Poison Sting tem força 0,13 (o mais fraco
  do jogo depois do Constrict); trocar o Double-Edge (1,00) por ele era um nerf grande. A regra pela nota põe Toxic no
  lugar do utilitário e mantém o dano. Fica melhor.
- **Gengar e Haunter:** iguais à proposta (Hypnosis sai). O combo Hypnosis → Dream Eater acaba; o Dream Eater ainda
  suga (o dobro se alguém dormir por outro motivo).
- **Gastly:** a regra tira o Hypnosis (tipo de fora), não o Confuse Ray. Fica Lick, Night Shade, Confuse Ray, Toxic.
- **Hitmonchan:** a regra troca um soco por Submission (dano por dano). A outra opção é Agility ⇒ Counter (o Counter
  clássico dele, nível 53), que guarda os 3 socos. Pergunta 3.
- **Butterfree:** entra (a regra é geral). String Shot sai no lugar de um dos pós; empate entre Poison Powder e
  Sleep Powder, a regra tira o Sleep Powder. Pergunta 4.
- Efeito colateral: o **Fly sai do baú raro** de MTs (lá só entra golpe que ninguém leva no padrão). Toxic e Submission
  já estavam em movesets.

**Números:**

Coluna **A** da tabela do começo da seção. Tudo dentro do ruído, menos uma coisa: **o Fly vira máquina de gol.** O
Charizard aparece em 17% dos times da IA (136 de 800), e o Fly com a bola leva a bola 4 m rumo ao gol, puxa para o
meio e chuta sozinho no pouso: 94% dos usos são com a bola e 32 viraram gol em 400 jogos (0,08 gol por jogo só dele).
O relatório do motor já avisava ("quando a MT trouxer o Fly, ficar de olho em gol fácil"). Com o voo levando 2 m
(`airCarry` 2), cai para 24 gols e o geral volta para 6,95 gols e 64,4% do favorito. **Recomendo subir o A junto com o
Fly 2 m.**

**Partidas pareadas** (`troca 80 tipo`): cada espécie que muda entra num time da IA; a mesma partida roda 2 vezes, com
os golpes de hoje e com os novos. 80 pares por espécie, 1040 no total.

| Pokémon | Vitórias hoje | Vitórias com A | Saldo hoje | Saldo com A |
|---|---|---|---|---|
| Charizard | 54% | 56% | +0,47 | +0,61 |
| Butterfree | 50% | 43% | −0,24 | −0,41 |
| Beedrill | 39% | 43% | −0,44 | −0,36 |
| Nidoqueen | 44% | 38% | −0,17 | −0,64 |
| Nidoran♂ | 48% | 39% | −0,57 | −0,64 |
| Nidorino | 45% | 41% | −0,34 | −0,38 |
| Nidoking | 54% | 51% | +0,31 | −0,25 |
| Zubat | 34% | 44% | −0,80 | −0,36 |
| Golbat | 55% | 55% | +0,16 | +0,06 |
| Gastly | 36% | 44% | −0,94 | −0,59 |
| Haunter | 33% | 39% | −0,57 | −0,24 |
| Gengar | 41% | 40% | −0,09 | −0,04 |
| Hitmonchan | 43% | 39% | −0,28 | −0,31 |
| **Total (1040 pares)** | **44,1%** | **43,8%** | **−0,27** | **−0,27** |

Por espécie o erro é ±8 pp (80 partidas): nenhuma linha sozinha prova nada. **No total, a regra A não muda a força de
ninguém.** Leitura com cuidado: Zubat, Gastly e Haunter talvez melhorem (Toxic no lugar de Supersonic/Hypnosis, que
erram muito); os Nidos talvez percam um pouco (sai o Focus Energy). Com Fly 2 m o total fica igual (44,2% → 43,9%).

**O que muda em partida:** 13 espécies trocam 1 golpe. O Fly 2 m vale para todo Fly e Dig (MT, baú, Diglett). Muito mais Toxic em campo (10 → 20 espécies), menos Focus
Energy (14 → 11) e menos Hypnosis (9 → 6).

**ENGINE_VERSION:** sim, 6 → 7 (golpe é evento em campo; replays e "mesma seed, mesma partida" mudam). Junto:
`npm run edge:liga` e o deploy da Edge Function `liga`, senão a Liga recusa as partidas.

**Duelo:** `monProblems` (`src/engine/duel-validate.ts:110`, não `src/net/`) aceita só `defaultMoveset + taught`.
Carta antiga salva com Hypnosis (Gengar do Álbum, do Hall, do time pronto) seria recusada ("golpes").
Achado: o `taught` já aceita qualquer golpe do learnset, sem limite, então a checagem hoje já equivale a "todo golpe
está no learnset". **Conserto de 1 linha, sem perder segurança:** `allowed = new Set([...sp.learnset, ...defaultMoveset(sp)])`.
Opcional: migrar as cartas salvas (trocar os golpes padrão antigos pelos novos, mantendo os ensinados) na abertura do
jogo, como o `withUnlocks`.

**Testes:** `tm.test.ts` (baú raro sem o Fly, se algum teste conta o baú) e um teste novo da regra.

### Degrau B: textos

O que está na seção 4: texto próprio para os ~35 golpes em que o genérico esconde preço, status ou imunidade, de
preferência **gerado pelos números do motor** (4.2). Inglês junto (`src/i18n/en/move-explain.ts`, o tsc cobra as
chaves).

- **Muda partida:** não. **ENGINE_VERSION:** não. **Duelo:** nada.
- Conferir na carta (`CardModal`), na Golpedex (`?lab=golpes`) e na tela de MT (`TmTeach`), em 320 e 390 px: os
  textos ficam maiores.

### Degrau C: cinco consertos pequenos no motor

| # | Mudança | Por quê | Onde |
|---|---|---|---|
| C1 | **Harden = Defense Curl** (o próximo carrinho sofrido não tira a bola, vale 12 s) | Gen 1: Harden, Withdraw e Defense Curl eram idênticos; os outros dois já ganharam efeito | `MOVE_TRAITS.harden = ['curl']` |
| C2 | **Slam com alcance 2,8 m** | cauda longa/vinha; separa do Mega Punch; 7 espécies | `MOVE_TRAITS.slam = ['reach']` |
| C3 | **Amnesia = Special +2 da Gen 1**: passe, chute e posicionamento +14% por 12 s | hoje só posicionamento; era o golpe do Snorlax | boosts do Amnesia em `match.ts` (`buff`) |
| C4 | **Tri Attack** sorteia queimar, congelar ou paralisar (20%, regra de secundário de sempre) | o dado tem a chance e não tem o status: bug | `applySecondary` |
| C5 | **Explosion 4 m**, Self-Destruct continua 3 m; Light Screen e Reflect **sem** o +7% acidental | separa os dois; tira efeito escondido | `drawback` e o `buff` |

- **Muda partida:** sim (pouco). **ENGINE_VERSION:** sim (junto com o A, uma subida só). **Duelo:** nada (os
  movesets não mudam).
- Simulado C1 a C3 (dá pra ligar por fora do código). C4 e C5 precisam mexer no motor; não simulei.

Coluna **A + C** da tabela. O geral não muda (7,01 gols, 61,6%). O que muda é o que se vê: "enrola" sai 1,31 vez por
jogo (era 0,51) e o desarme de longe 0,55 (era 0,34).

Partidas pareadas (`troca 60 c`), só com as 16 espécies que levam Harden, Slam ou Amnesia:

| Pokémon | Golpe | Vitórias hoje | Vitórias com C | Saldo hoje | Saldo com C |
|---|---|---|---|---|---|
| Metapod | Harden | 33% | 38% | −0,77 | −0,65 |
| Kakuna | Harden | 37% | 45% | −0,60 | −0,40 |
| Pikachu | Slam | 43% | 62% | −0,47 | +0,30 |
| Raichu | Slam | 55% | 62% | +0,02 | +0,22 |
| Poliwag | Amnesia | 40% | 43% | −0,72 | −0,63 |
| Victreebel | Slam | 33% | 42% | −0,77 | −0,37 |
| Onix | Harden | 38% | 37% | −0,28 | −0,73 |
| Krabby | Harden | 37% | 47% | −0,68 | −0,32 |
| Kingler | Harden | 42% | 33% | −0,40 | −0,70 |
| Lickitung | Slam | 42% | 42% | −0,45 | −0,33 |
| Tangela | Slam | 40% | 40% | −0,85 | −0,77 |
| Kabuto | Harden | 42% | 38% | −0,45 | −0,57 |
| Kabutops | Harden | 48% | 50% | −0,20 | +0,08 |
| Snorlax | Amnesia | 45% | 52% | −0,57 | −0,48 |
| Dratini | Slam | 43% | 37% | −0,55 | −1,00 |
| Dragonair | Slam | 48% | 43% | −0,08 | −0,45 |
| **Total (960 pares)** | | **41,7%** | **44,4%** | **−0,49** | **−0,42** |

Por espécie o erro é ±9 pp. No total, **+2,7 pp para espécies que estão no fundo da tabela** (quase todas abaixo de
45%): é o tipo de buff que a skill de balanceamento pede. Pikachu +19 pp é provavelmente sorte em parte; vale olhar
jogando.

### Degrau D: mudanças maiores (cada uma pede o seu ok, carta por carta)

| # | Mudança | Espécies que mudam | Observação |
|---|---|---|---|
| D1 | **Menos MT de cobertura** (`menosmt`): no 4º golpe, MT sem STAB vale ×0,6 | 39 | Blizzard 36 → 22. Bom: Machop/Machoke/Machamp Fire Blast ⇒ Low Kick/Karate Chop; Cubone Blizzard ⇒ Bonemerang; Psyduck, Wartortle, Omastar, Kabuto Blizzard ⇒ Surf; Mankey Thunder ⇒ Low Kick; Grimer/Muk Thunder ⇒ Acid Armor; Krabby/Kabutops ⇒ Swords Dance. Ruim: Sandshrew/Sandslash Rock Slide ⇒ Toxic; Nidoran♀ Blizzard ⇒ Reflect; Mewtwo Fire Blast ⇒ Amnesia |
| D2 | **Sem 2 golpes de mesmo efeito** (`dupbeh`) | 9 | tabela da seção 3.2; Charmander, Charmeleon e Charizard ganham Dragon Rage (MT23 da Gen 1) |
| D3 | **Splash só no Magikarp** (`semsplash`) | 1 | Gyarados: Splash ⇒ Toxic pela nota (Leer ou Hyper Beam por escolha) |
| D4 | **Exceções fora da Gen 1** para o tipo próprio | até 8 | Gengar Sludge; Omanyte, Omastar, Kabuto, Kabutops Rock Throw ou Rock Slide; Aerodactyl Rock Slide; Dragonite Wing Attack (nível na Gen 2). Nenhum deles está no learnset Gen 1. Fada e Aço não têm golpe nenhum na tabela do jogo |
| D5 | **Baú raro sem golpe básico** | 0 | tirar Pound, Scratch e Mega Punch do baú (só existem lá) |
| D6 | **Teto de força** em 150 de poder em vez de 120 | todas as cartas com golpe de 120+ | separa Hyper Beam/Explosion de Double-Edge; mexe em gols por jogo, precisa de calibragem própria |

D2 simulado junto com A e C (coluna **A + C + D2**): 7,06 gols, 63,0% do favorito, empates caem para 12,8%. Dragon
Rage sai em 0,28 por jogo (era 0,24). D1, D3 e D6 não simulei: mudam muitas cartas e precisam primeiro do seu olho na
galeria. D4 e D5 não mudam partida da IA.

---

## 7. Perguntas pro Miguel

1. **Regra A como está (pela nota do jogo, 13 espécies)?** Recomendo **sim**: Nidos e Beedrill ganham Toxic no lugar do
   utilitário e não perdem dano, e a regra vale sozinha para a Gen 2.
2. **Fly leva a bola 2 m em vez de 4** (`airCarry`, junto com o A)? Recomendo **sim**: sem isso o Charizard vira
   máquina de gol (32 gols de Fly em 400 jogos; com 2 m, 24, e gols por jogo e favorito voltam para a meta).
3. **Gengar:** Hypnosis sai (fica Dream Eater, Night Shade, Confuse Ray, Toxic) ou Confuse Ray sai (guarda o combo
   Hypnosis → Dream Eater, mas continua com 2 Psíquicos)? Recomendo **Hypnosis sai**: era a sua reclamação.
4. **Hitmonchan:** Ice Punch ⇒ Submission (regra) ou Agility ⇒ Counter (guarda os 3 socos)? Recomendo **Agility ⇒
   Counter**: os 3 socos são a cara dele, e o Counter é o golpe dele na Gen 1. Precisa de 1 exceção na regra.
5. **Butterfree entra na regra** (Sleep Powder ⇒ String Shot)? Recomendo **não**, ou trocar o Poison Powder em vez do
   Sleep Powder. O trio de pós é a cara dela; String Shot é fraco.
6. **Duelo:** aceitar qualquer golpe do learnset na validação (1 linha, mesma segurança de hoje) e migrar as cartas
   salvas? Recomendo **sim às duas**.
7. **Textos (B):** gerar pelos números do motor (PT e EN) em vez de escrever à mão? Recomendo **sim**. Sobe sem
   perguntar pela regra 5 (texto), mas vale você ver uns exemplos antes.
8. **C1 Harden = Defense Curl?** Recomendo **sim**: é o golpe do Metapod e hoje não faz nada visível.
9. **C2 Slam com alcance?** Recomendo **sim**.
10. **C3 Amnesia vira o Special +2 da Gen 1?** Recomendo **sim**. Imunidade a sono e confusão durante o efeito fica de
   fora (mais um efeito para explicar).
11. **C4 Tri Attack:** consertar (sorteia 3 status, como da Gen 2 em diante) ou tirar a promessa do texto (na Gen 1
    ele não tinha efeito)? Recomendo **consertar**: é a assinatura do Porygon e do Dodrio.
12. **C5 Explosion 4 m e paredes sem o bônus escondido?** Recomendo **sim**.
13. **D1 menos MT de cobertura:** quer ver as 39 cartas na galeria `?cards=1` antes? Recomendo **deixar para depois**
    do A–C e olhar carta por carta (tem troca ruim, como Sandslash perdendo Rock Slide).
14. **D2 sem 2 golpes iguais:** Charizard com Dragon Rage no lugar do Fire Blast é ok? Recomendo **sim para Raichu,
    Arcanine, Hitmonlee, Staryu e Omanyte**; para a linha do Charmander, só junto com o A (Charizard fica com Fly).
15. **D3 Gyarados sem Splash:** Toxic (nota), Leer (intimida) ou Hyper Beam (o golpe dele na Gen 1, nível 52)?
    Recomendo **Hyper Beam**, mesmo ficando sem utilitário.
16. **D4 abrir exceção fora da Gen 1** (Gengar Sludge, fósseis Rock Throw, Dragonite Wing Attack)? Recomendo **não por
    agora**: a regra "learnset da Gen 1" é simples de explicar. Rever quando a Gen 2 chegar.
17. **Ordem de subida:** A (com Fly 2 m) + B + C juntos numa versão (uma subida de ENGINE_VERSION, um deploy da Liga), D depois, com
    você jogando antes? Recomendo **sim**.

---

## 8. Movesets iguais entre espécies (pedido do Miguel: "queria que cada Pokémon fosse único")

`npx tsx scripts/balance/golpes-revisao.ts unicos` (com os movesets da v8). Regra combinada: **mesma linha evolutiva
parecida não é problema**; só vale mexer em espécies sem relação, e só se a troca não tirar poder nem deixar o Pokémon
estranho.

| | Mesma linha evolutiva | Sem relação |
|---|---|---|
| Moveset idêntico (4 de 4) | 11 grupos (Ivysaur/Venusaur, Wartortle/Blastoise, Zubat/Golbat, Kadabra/Alakazam...) | **1**: Spearow e Doduo (Peck, Drill Peck, Double-Edge, Agility) |
| Quase idêntico (3 de 4) | 50 pares | **47 pares** |

Os 47 pares sem relação são quase todos o mesmo "molde": os pós das plantas (Bulbasaur, Oddish, Bellsprout, Tangela,
Venonat com Poison Powder + Sleep Powder), os pássaros Normal/Voador (Spearow, Fearow, Doduo, Dodrio, Pidgeotto,
Scyther), os Elétricos com Thunder Wave + Agility (Pikachu, Raichu, Jolteon, Zapdos, e Dratini/Dragonair pelo Slam +
Thunder Wave + Agility), os Água com Hydro Pump + Blizzard (Squirtle, Horsea, Omastar, Staryu), os Terra com
Earthquake + Rock Slide (Sandshrew, Diglett, Dugtrio, Rhyhorn) e o trio Psychic + Thunder Wave + Blizzard (Slowbro,
Starmie, Mewtwo).

### Regra (ligada em 21/10/2026 com o ok do Miguel, `ENGINE_VERSION` 9: `UNIQUE_MOVESETS = true` em `src/engine/moves.ts`, sem Wigglytuff e Staryu)

Quando duas espécies de linhas diferentes dividem 3 ou 4 golpes, a de número maior troca 1 golpe dividido pelo
melhor golpe do learnset dela que nenhuma das duas leva, desde que:
- seja da mesma classe (dano por dano; status por status; arrancada por arrancada);
- não repita efeito nem tipo de fora que ela já tem;
- tenha nota de pelo menos 90% do que sai e, no dano, força de pelo menos 90% e precisão parecida (nada de nocaute ou
  golpe de risco no lugar);
- não seja a assinatura nem o único golpe de um tipo dela.

Sem troca que cumpra tudo, fica como está.

| Pokémon | Hoje (v8) | Sai ⇒ entra | Divide com | Leitura |
|---|---|---|---|---|
| 33 Nidorino | Horn Attack, Double Kick, Toxic, Blizzard | Blizzard ⇒ Thunder | Nidoran♀ | ok |
| 40 Wigglytuff | Double Slap, Blizzard, Sing, Double-Edge | Blizzard ⇒ Mega Kick | Clefable, Chansey | **estranho** (3 golpes Normais) |
| 48 Venonat | Psybeam, Leech Life, Poison Powder, Sleep Powder | Sleep Powder ⇒ Stun Spore | Butterfree | ok |
| 69 Bellsprout | Vine Whip, Acid, Poison Powder, Sleep Powder | Poison Powder ⇒ Stun Spore | Bulbasaur, Oddish | ok |
| 70 Weepinbell | Acid, Razor Leaf, Poison Powder, Sleep Powder | Poison Powder ⇒ Stun Spore | Ivysaur, Venusaur, Oddish | ok |
| 71 Victreebel | Razor Leaf, Slam, Poison Powder, Sleep Powder | Sleep Powder ⇒ Stun Spore | Ivysaur, Venusaur, Tangela | ok |
| 80 Slowbro | Psychic, Surf, Thunder Wave, Blizzard | Blizzard ⇒ Fire Blast | Starmie, Mewtwo | troca MT por MT |
| 113 Chansey | Soft-Boiled, Double-Edge, Blizzard, Sing | Blizzard ⇒ Egg Bomb | Jigglypuff, Wigglytuff | ok (Egg Bomb é a cara dela) |
| 120 Staryu | Water Gun, Blizzard, Thunder Wave, Psychic | Psychic ⇒ Surf | Starmie, Mewtwo | **mais fraco** (2 Água, perde a cobertura) |
| 135 Jolteon | Thunder, Pin Missile, Thunder Wave, Agility | Agility ⇒ Quick Attack | Raichu, Zapdos | ok |

**10 espécies mudam.** Dos 47 pares sem relação, sobram 26 (o learnset da Gen 1 não tem troca que cumpra a regra; o
Spearow/Doduo é um deles). Alguns pares novos aparecem (Staryu × Omanyte, Electabuzz × Jolteon), sempre de 3 de 4.

**Números com o protótipo ligado** (só na simulação, `calib 400 uniq.json` e `troca 60 uniq.json`):

| Métrica | v8 | v8 + unicidade |
|---|---|---|
| Gols por jogo | 7,64 | 7,70 |
| Mais forte vence | 62,6% | 63,3% |
| Goleadas | 3,3% | 3,5% |
| Partidas pareadas das 10 espécies (600 pares): vitórias / saldo | 39,2% / −0,45 | 40,2% / −0,53 |

Dentro do ruído: a regra não muda a força geral. Por espécie (±9 pp), Wigglytuff (38% ⇒ 32%) e Staryu (42% ⇒ 37%)
pioram, junto com a leitura de cima.

**Recomendação:** se quiser ligar, ligar **sem Wigglytuff e Staryu** (8 espécies) e olhar as cartas na galeria
`?cards=1` antes. A unicidade total não dá com o learnset da Gen 1: 26 pares continuam parecidos sem perder poder. O
que mais "iguala" é o 4º golpe de MT de cobertura (Blizzard, Thunder Wave, Agility); o D1 (MT sem STAB vale menos)
mexe nisso direto, mas muda 39 cartas.

**Decidido (21/10/2026):** ligada com 8 espécies. Wigglytuff e Staryu ficam de fora junto com os pares deles
(`UNIQUE_SKIP`), então mudam só Nidorino, Venonat, Bellsprout, Weepinbell, Victreebel, Slowbro, Chansey e Jolteon.
