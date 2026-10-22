---
description: Relatório das 12 famílias de golpes implementadas no motor.
---

# Golpes no motor: as 12 famílias (relatório da branch `golpes-motor`)

> Implementação da seção 3 da [proposta de golpes](golpes-proposta.md) (Fase 1: motor). A MT do ginásio
> (seção 2.3), movesets, recompensas e Golpedex ficaram com o outro trabalho, em outra branch.
> **Nada de atributo, posição ou fórmula fora dos golpes foi mexido.** Os números abaixo são sugestões já
> calibradas, mas estão todos num lugar só (`MOVE_TUNING` em `src/engine/moves.ts`) para decidir junto.

## 1. O que foi feito

Cada golpe ganhou uma lista de **traços** (`MOVE_TRAITS` em `src/engine/moves.ts`). O `kind` antigo continua
(a IA e a UI dependem dele), então **o moveset padrão não muda**. O motor aplica os traços nos pontos que já
existiam (`kick`, `tryTackle`, `moveEffect`, `checkShotInteractions`, `tickTimers`, `scoreGoal`). Tudo usa o
`s.rng`; BatchRunner = LiveRunner e "mesma seed → mesmo log" continuam verdes. Snapshot: **sem mudar o
`SNAP_STRIDE`**, os estados novos usam bits livres do campo `flags` (8 a 512).

| Família | Status | O que faz em campo |
|---|---|---|
| F1 Área | feito | Sem bola, pega todos os rivais a 4 m (Rolling Kick 2 m, Poison Gas 3 m, Flash 7 m). Earthquake e Surf pegam **companheiros também**. Quem conduz e leva o golpe em área solta a bola. Growl/Leer/Tail Whip/Screech/String Shot em área; Leer trava 0,3 s |
| F2 Crítico | feito | Slash, Karate Chop, Razor Leaf, Crabhammer, Razor Wind, Sky Attack: chute crítico (+25% velocidade, mira melhor) e carrinho crítico ganha direto. Chance 20% + até 15% pelo pace. **Focus Energy** garante o próximo chute/carrinho crítico (e falha 1 em 16, o bug da Gen 1) |
| F3 Carga | feito | Solar Beam, Skull Bash, Sky Attack, Razor Wind: 0,6 s parado piscando, depois sai o golpe ×1,3 (com bola, o chute sai sozinho no canto longe do goleiro). Carrinho ou atordoamento na carga = perdeu o golpe. Skull Bash não perde a bola carregando. **Hyper Beam que vira gol não recarrega** |
| F4 Fly/Dig | feito | 0,8 s fora do alcance (sem carrinho, sem rajada, sem bloqueio). Com bola: leva 4 m rumo ao gol e finaliza no pouso. Sem bola: cai em cima de quem conduz (até 8 m) e dá o bote |
| F5 Prioridade | feito | Quick Attack sem bola: avança até 2 m e desarma na hora, **ignorando a recarga do carrinho** (alcance 3,3 m). Com bola: arrancada + chute/passe de primeira. Agility agora dura 5 s (antes era igual ao Quick Attack, 2,5 s) |
| F6 Mira | feito | Swift nunca erra (sem rolagem, chute 40% mais certeiro, jogador de linha não bloqueia). Drill Peck e Cut furam o 1º bloqueio (e o carrinho do Cut não perde força por trás). Egg Bomb é cobertura: passa por cima dos bloqueios e o goleiro alcança 20% menos. Sand Attack (erro ×2 por 6 s), Kinesis (só o próximo chute, erro ×2,5), Flash (área 7 m, ×1,6 por 5 s), Smokescreen (fumaça no chão 3 m/5 s, erro ×1,8 para os dois times) |
| F7 Dano fixo | feito | Sonic Boom/Dragon Rage/Night Shade/Seismic Toss: chute de velocidade fixa (20/24/23/22 m/s), goleiro sem vantagem de tipo. Sem bola, atordoam tempo fixo (Night Shade pega até Normal; Sonic Boom não pega Fantasma). Seismic Toss no carrinho arremessa 3 m + 1 s no chão. Psywave sorteia a força (0,5–1,5×). Super Fang tira metade do fôlego. Low Kick derruba pelo peso (Snorlax ~2 s) |
| F8 Multi-acerto e alcance | feito | Double Kick/Twineedle/Bonemerang: 2 tentativas; Fury Swipes/Fury Attack/Double Slap/Comet Punch/Barrage/Pin Missile/Spike Cannon: 2–5 (distribuição da Gen 1), cada uma 15% mais fraca, cada uma pode dar o secundário. Rebote: Bonemerang sempre, Barrage/Pin Missile/Spike Cannon 50%: defendido ou bloqueado, a bola volta para o pé de quem chutou. Alcance 2,8 m: Vine Whip, Rock Throw, Bonemerang, Wrap, Bind |
| F9 Prender | feito | Wrap/Bind: os dois presos 1,2 s e a bola sobra. Clamp: rouba e ninguém tira dele por 1 s. Fire Spin: anel de fogo no chão (2 m, 4 s) que deixa lento e pode queimar. Constrict: só aperta (lento 2 s, sem atordoar) |
| F10 Contador | feito | Toxic: veneno de 12 s que vai de ×1 a ×3. Rage: fúria 15 s (+10%), +5% a cada pancada sofrida (até 3). Bide: 3 s firme (+30% força) e depois onda que empurra/atordoa mais quanto mais apanhou |
| F11 Esquiva e muro | feito | Double Team: 2 clones aguentam os próximos 2 carrinhos/golpes. Minimize: 4 s pequenininho, carrinho 40% mais fraco (Stomp ignora). Acid Armor: 3 s ninguém tira a bola. Withdraw: 1,5 s idem, andando a 60%. Defense Curl: o próximo carrinho sofrido não tira a bola. Barrier: muro de 3 s entre ele e o gol, segura o próximo chute que passar perto |
| F12 Controle de campo | quase tudo | Roar: o rival mais perto foge 1,6 s para o próprio campo e larga a bola. Whirlwind e Gust sopram a bola solta para longe. Strength empurra 2,5 m. Conversion copia o tipo do rival mais perto por 12 s (vale em carrinho, goleiro e golpes). Soft-Boiled cura o companheiro mais cansado a 5 m. Pay Day sem bola: rivais a 3 m param 0,4 s. **Não feito:** Mimic virar o golpe do slot até o fim (continua copiando 1 vez) |

Easter eggs Gen 1 feitos (eram triviais): Focus Energy "bugado" (1/16) e Hyper Beam sem recarga quando faz gol.
Não feitos: Fissure falha contra alvo mais rápido, Counter só físico, Earthquake dobrado em quem cava, Gust dobrado
em quem voa, Toxic acelerando o Leech Seed.

Também **não feitos** (estavam na tabela 3.1 como ajuste fino de golpes "existe"): Amnesia/Meditate imunes a
sono/confusão, Hydro Pump empurrando o dobro, Thunder caindo no rival mais longe, Scratch sempre ficando com a
bola, Mega Punch empurrando 2 m, Recover 50%, Self-Destruct 3 m × Explosion 4 m, Cut com passe não
interceptável, contador de moedas do Pay Day na súmula, Rage deixando a IA mais agressiva.

### Visível em campo (cena e narração)

- Evento novo `trait` (crítico, carga, voo, clones, muro...). A cena mostra um texto que sobe da cabeça
  ("CRÍTICO!", "FUROU!", "ERA UM CLONE!", "3x!", "BATEU NO MURO!"...), uma linha na caixa de batalha e, nos golpes
  em área, um anel que abre até o raio. Fumaça, anel de fogo e muro ficam desenhados no chão pelo tempo deles.
- Pelos bits de `flags`: Fly sobe o sprite e encolhe a sombra, Dig some no chão, carga pisca em branco/amarelo,
  Double Team mostra 2 clones, Minimize encolhe, casco/concha azula, fúria avermelha. Sem emoji: tudo desenhado.
- Narração (`src/ui/commentary.ts`) com uma linha para cada traço e textos novos de Bide, Rage, Conversion e Roar.
- Explicação de cada golpe: `MOVE_EXPLAIN` (todos os golpes com traço + os especiais). A carta e a Golpedex já leem
  `SPECIAL_EXPLAIN`, que agora é o mesmo objeto, então o texto novo aparece sem mexer na UI.

### IA

Quick Attack quando o portador está a 1,3–3,3 m; desarme de longe com chicote/pedra/osso/Wrap até 2,8 m; Fly/Dig
com a bola marcado perto do gol; golpe de carga só com pressão < 0,35; casco/clones/Minimize/Acid Armor/Defense
Curl para proteger a bola sob pressão; golpe de área (debuff/status) com 2+ rivais a 4 m; areia/fumaça/muro e
Roar com o rival com a bola chegando no nosso gol; Rest nunca no goleiro com a bola perto.

## 2. `MOVE_TUNING` (valores atuais)

| Família | Valor |
|---|---|
| F1 | raio 4 m (Rolling Kick 2, Poison Gas 3, Flash 7); cada vítima leva **0,6** do efeito de um golpe num alvo só; Leer trava 0,3 s |
| F2 | crítico **20% + 15% × pace/99**; crítico = velocidade ×1,25, erro ÷1,4; Focus Energy falha 1/16 |
| F3 | carga **0,6 s**; golpe carregado ×**1,3** |
| F4 | **0,8 s** no ar; leva a bola 4 m; mergulha em quem conduz até 8 m |
| F5 | Quick Attack alcance 3,3 m, avança até 2 m; arrancada 2,5 s; Agility **5 s** |
| F6 | Swift erro ×0,6; goleiro alcança ×0,8 na cobertura (e "sente" 18 m/s); Sand Attack ×2/6 s; Kinesis ×2,5 no próximo chute; Flash ×1,6/5 s; fumaça 3 m/5 s ×1,8 |
| F7 | chute fixo: Sonic Boom 20, Dragon Rage 24, Night Shade 23, Seismic Toss 22 m/s; atordoamento fixo 0,6/0,8/0,8/1 s; Psywave 0,5–1,5×; Super Fang 50%; arremesso 3 m; Low Kick 0,0035 s/kg (máx. 2 s) |
| F8 | cada tentativa ×0,85; rebote 50% (Bonemerang 100%); alcance 2,8 m |
| F9 | Wrap/Bind 1,2 s; Clamp 1 s; Fire Spin 2 m/4 s; Constrict lento 0,6 por 2 s |
| F10 | Toxic 12 s até ×3; Rage 15 s, +5% por pancada (máx. 3); Bide 3 s, onda de 3,5 m |
| F11 | 2 clones; Minimize 4 s (carrinho ×0,6); Acid Armor 3 s; Withdraw 1,5 s a 60%; Defense Curl vale 12 s; muro 3 s, raio 1,3 m |
| F12 | Roar 5 m/1,6 s; ventania 9 m/s; Strength 2,5 m; Conversion 12 s; Soft-Boiled 5 m; Pay Day 3 m/0,4 s |

## 3. Calibração (`npm run calibrate -- --n 400`, mesmas seeds)

| Métrica | Antes (v0.8.0) | Depois | Meta |
|---|---|---|---|
| Gols/jogo | 6,57 | **6,46** | 6,3–7,0 |
| Favorito (Δ≥3) vence | 67,9% | **65,3%** | 65–69% |
| Empates no tempo normal | 11,0% | 15,5% | — |
| Golpes/jogo | 22,8 | **23,5** | 23–27 |
| Debuff/jogo | 0,06 | 0,09 | ≥ 0,8 (**não bate**, ver riscos) |
| Special/jogo | 0,84 | 0,89 | ≥ 1,2 |
| Traços visíveis/jogo | — | 6,3 (área 1,55, prioridade 1,40, crítico 0,60, Toxic 0,52, proteção 0,50, Defense Curl 0,36, dano fixo 0,34, multi 0,28, carga 0,26, alcance 0,20...) | — |
| Melhor tipo | Ghost 59% | Electric 55% | ≤ 58% |
| Pior tipo | Fighting 41% | Ice 43% | ≥ 42% |
| Fighting | 41% | 53% | — |
| Ghost | 59% | 48% | — |
| Flying | 55% | 53% | ≤ 57% |
| Táticas | counter 54, offensive 55, balanced 45, defensive 48 | counter 51, offensive 59, balanced 50, defensive 43 | — |

Por tipo (depois): Electric 55, Fighting 53, Flying 53, Ground 53, Fire 53, Psychic 52, Water 52, Rock 50, Dragon 50,
Bug 49, Poison 49, Steel 48, Grass 48, Normal 48, Ghost 48, Fairy 47, Ice 43.

Rodada intermediária (área 0,75 por vítima, crítico 25%): 6,44 gols, favorito 62,7%. Baixar a área para 0,6 e o
crítico para 20% devolveu o favorito para a meta. Velocidade da simulação igual à de antes (A/B na mesma máquina).

## 4. Antes e depois de 8 Pokémon (moveset padrão não mudou)

| Pokémon | Golpe | Antes | Agora |
|---|---|---|---|
| **Pidgeot** | Sky Attack | chute forte genérico (força 1,0) | carrega 0,6 s piscando e sai o chute ×1,3 com crítico fácil; carrinho na carga = perdeu o golpe; a IA só usa com espaço |
| | Double-Edge | recoil | igual |
| | Agility | +velocidade 2,5 s (igual ao Quick Attack) | +velocidade **5 s** |
| | Quick Attack | igual à Agility | sem bola: bote de até 2 m que desarma na hora, sem esperar a recarga; com bola: arrancada + chute de primeira |
| **Gengar** | Night Shade | chute especial genérico (0,58) / rajada no mais perto | chute de velocidade fixa 23 m/s, goleiro sem vantagem de tipo; sem bola atordoa 0,8 s fixo e pega até Normal |
| | Dream Eater, Confuse Ray, Hypnosis | | igual (o combo Hypnosis → Dream Eater continua) |
| **Snorlax** | Earthquake | chute/carrinho forte | sem bola: tremor de 4 m que atordoa e empurra todo mundo, **inclusive companheiro**, e faz quem conduz soltar a bola |
| | Body Slam, Amnesia, Double-Edge | | igual (Amnesia imune a sono/confusão ficou para depois) |
| **Mewtwo** | Blizzard | rajada no rival mais perto | sem bola: nevasca em todos os rivais a 4 m, cada um pode congelar; com bola, igual |
| | Psychic, Thunder Wave, Fire Blast | | igual |
| **Charizard** | Earthquake | chute/carrinho forte | tremor em área (cuidado com o próprio time) |
| | Flamethrower, Swords Dance, Fire Blast | | igual |
| **Starmie** | Blizzard | rajada no mais perto | área (como o Mewtwo) |
| | Psychic, Hydro Pump, Thunder Wave | | igual (Hydro Pump empurrando o dobro ficou para depois) |
| **Hitmonlee** | Focus Energy | chute +12% por 12 s | próximo chute ou carrinho é **crítico garantido**; 1 em 16 falha ("como na Gen 1!") |
| | High Jump Kick, Mega Kick, Jump Kick | | igual |
| **Clefable** | Double Slap | carrinho genérico (0,38) | 2 a 5 tentativas de desarme seguidas, cada uma 15% mais fraca ("3x!") |
| | Blizzard | rajada no mais perto | área |
| | Sing, Fire Blast | | igual |

Golpes com traço que já estão nos movesets padrão: área 96 (Blizzard em 36 espécies, Earthquake em 24), Agility 29,
crítico 21, Focus Energy 14, Quick Attack 12, dano fixo 11, Toxic 10, carga 9, multi-acerto 16, alcance 8. Fly
não está em nenhum moveset padrão e Dig em 1: a família F4 aparece de verdade quando a MT entrar.

## 5. Riscos e o que ficou de fora

- **Debuff ≥ 0,8/jogo não dá só com o motor:** só 4 espécies (Caterpie, Metapod, Weedle, Kakuna) têm golpe de
  debuff no moveset padrão. A IA já usa mais (área com 2+ rivais, areia/fumaça com o rival chegando no gol), mas
  quem decide se Leer/Growl/Sand Attack entram é o moveset/MT (outra branch). Os efeitos de "controle" agora
  aparecem por outro caminho: golpes de área (1,55/jogo), mira torta e zonas.
- **Earthquake com fogo amigo** está em 24 espécies: pode derrubar o próprio companheiro na hora errada. É a
  graça, mas vale ver jogando.
- **Ice caiu de 53% para 43%** (Blizzard em área divide a força entre as vítimas e cada uma rola a precisão de
  70%). Se incomodar, subir `areaShare` só para golpes Special ou dar ao Blizzard o alcance cheio.
- **Empates subiram** de 11% para 15,5% e a tática ofensiva foi de 55% para 59% (defensiva 48% → 43%).
- **Fly/Dig** quase não aparecem hoje (0,03/jogo, só Dig no moveset). Quando a MT trouxer o Fly, ficar de olho
  em gol fácil (um número só: `airTime`/`airCarry`).
- **Visual não foi conferido no celular** (320/390 px, deitado): o motor e os testes estão verdes e o tsc passa,
  mas os textos novos, os clones e as zonas no chão precisam de uma olhada jogando antes de publicar.
- Textos que sobem da cabeça usam acentos (CRÍTICO, ÁREA): conferir se a fonte Galmuri11 desenha tudo.
- Commits por família não ficaram separados: o motor das 12 famílias entrou num commit só (os arquivos se
  cruzam), com um teste roteirizado por família em `src/engine/traits.test.ts`.
