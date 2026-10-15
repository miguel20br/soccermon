# Golpes: função para os 44 esquecidos + cada golpe com a cara da Gen 1 (proposta)

> Só pesquisa e proposta. Nada foi alterado no repo. Números tirados rodando o código atual (v0.8.0) com `tsx`
> (scripts descartáveis no scratchpad) e `npm run calibrate -- --n 400`.
> Tudo que mexe em equilíbrio (valores, chances, durações) está aqui como **sugestão para decidir junto**.

---

## 0. Resumo em 6 linhas

1. 164 golpes nos dados, 120 em algum moveset padrão, **44 nunca entram**. Todos os 44 têm pelo menos 1 Pokémon que aprende: o problema é só o moveset de 4 vagas.
2. As 4 vagas são: assinatura + melhor dano + 1 utilitário + "melhor resto". O 4º slot é dominado por MTs de cobertura: **Blizzard em 36 espécies**, Agility 29, Earthquake 24, Thunder Wave 23, Hydro Pump 20, Fire Blast 19, Thunder 18. Isso também deixa todo mundo parecido.
3. No motor, **36 golpes físicos são o mesmo "strike" puro** (só muda a força), 12 especiais são o mesmo "blast" puro, e vários pares são clones (Agility = Quick Attack, Harden = Withdraw = Defense Curl, Leer = Tail Whip, Sharpen = Meditate, Sand Attack = Smokescreen = Kinesis = Flash).
4. Mexer só na pontuação do moveset **não resolve** (testei: entra Growl em 18 espécies e Leer em 27, o Charizard fica com Growl + Leer). 4 vagas não comportam 164 golpes.
5. Recomendação: **MT do ginásio como recompensa** (escolha do jogador, 1 de 3, com o golpe que o líder dava na Gen 1: Brock → Bide, Misty → BubbleBeam, Erika → Mega Drain, Giovanni → Fissure…) + **rivais usando a MT do próprio ginásio** (a IA rival pode ser automática) + Golpedex contando tudo que dá para aprender (164).
6. Diferenciação: 12 famílias de efeito reutilizáveis (área, crítico, carga, some do mapa, prioridade, mira, dano fixo, multi-acerto/alcance, prender, contador que cresce, esquiva/muro, controle de campo). Com elas, cada golpe ganha o "jeito" da Gen 1 traduzido em ação de futsal.

---

## 1. Inventário

### 1.1 Números de hoje (baseline, `npm run calibrate -- --n 400`)

| Métrica | Hoje |
|---|---|
| Gols/jogo | **6,57** (meta 5–7) |
| Mais forte (Δ≥3) vence | **67,9%** (meta 60–65%) |
| Empates no tempo normal | 11,0% |
| Golpes/jogo | 22,8 → strike 4,85 · status 5,59 · burst 4,57 · blast 3,89 · buff 3,02 · special 0,84 · **debuff 0,06** |
| Tipos | melhor Ghost 59%, pior **Fighting 41%** |
| Táticas | counter 54%, offensive 55%, balanced 45%, defensive 48% |

Repara: debuff quase não existe em campo (0,06 por jogo) e special é raro (0,84).

### 1.2 Os 44 golpes que ninguém usa

Os nomes no jogo são os ingleses (`moves.json` só tem `descPt`, não tem nome PT). "Melhor nota" = a melhor pontuação que o golpe chega a ter em algum aprendiz no `defaultMoveset`, contra o que o aprendiz levou.

| Golpe | Tipo | Kind hoje | Efeito na Gen 1 | Quem aprende (n) | Por que fica de fora |
|---|---|---|---|---|---|
| acidarmor | Poison | buff | Def +2 | Grimer, Muk, Vaporeon (3) | utilitário perde para Poison Gas/status; Muk prefere dano |
| barrage | Normal | strike | 2–5 acertos | Exeggcute/Exeggutor (2) | força 15×3 normalizada baixa, Normal ×0,7 |
| bide | Normal | special | aguenta 2–3 turnos, devolve 2× | 145 (MT34 do Brock) | MT genérica ×0,6, special vale 50 contra status 60+ |
| bind | Normal | strike | prende 4–5 turnos (Gen 1: ninguém age) | Onix, Tangela, Pinsir (3) | força 0,13: nota 15 |
| bubblebeam | Water | blast | 10% −Spe | 57 (MT11 da Misty) | perde para Hydro Pump/Surf/Bubble assinatura |
| constrict | Normal | strike | 10% −Spe | Tentacool, Tentacruel, Tangela (3) | força 0,08 |
| conversion | Normal | special | Gen 1: vira o tipo do alvo | Porygon (1) | Porygon pega Agility (burst 65 > special 65 por desempate) |
| cut | Normal | strike | MO01, 50 | 30 | Normal fraco, sem STAB |
| doubleteam | Normal | buff | evasão +1 | 145 (MT) | MT genérica, buff fraco |
| eggbomb | Normal | strike | 100, 75% | Exeggcute, Exeggutor, Chansey, Mew | perde para Stomp/Psychic/Solar Beam; Chansey não é física |
| fissure | Ground | strike | OHKO (MT27 do Giovanni) | 30 | perde para Earthquake (mesmo tipo) |
| flash | Normal | debuff | precisão −1 (MO05) | 30 | debuff vale 25–35 |
| fly | Flying | strike | 1 turno no ar, invulnerável (MO02) | 16 | RISKY ×0,55 |
| furyattack | Normal | strike | 2–5 acertos | 13 | Spearow/Fearow já têm Peck/Drill Peck (penalidade mesmo tipo) |
| growl | Normal | debuff | Atk −1 em área | 35 | debuff vale 25–35 |
| growth | Normal | buff | Special +1 | 9 (Bulbasaur…) | a linha Bulba já tem 2 pós de status |
| kinesis | Psychic | debuff | precisão −1 | Kadabra, Alakazam | Thunder Wave + Disable ganham |
| leechseed | Grass | special | 1/8 HP por turno para quem usou | 5 | a linha Bulba prefere Poison/Sleep Powder |
| leer | Normal | debuff | Def −1 em área | 43 | debuff vale 25–35 |
| meditate | Psychic | buff | Atk +1 | 4 | perde para Hypnosis/Poison Gas |
| megadrain | Grass | blast | drena ½ (MT21 da Erika) | 29 | força 40 → nota 48 |
| megapunch | Normal | strike | 80, 85% | 48 | MT genérica ×0,75, Normal ×0,7 (Kangaskhan quase leva: 134) |
| mimic | Normal | special | copia um golpe do alvo pela batalha | 145 | MT genérica |
| minimize | Normal | buff | evasão +1 | 7 | Clefairy prefere Sing + coberturas |
| mist | Ice | special | imune a queda de atributo | Lapras, Vaporeon, Articuno, Mewtwo | Lapras prefere Confuse Ray/Sing |
| pound | Normal | strike | 40 | 11 | fraco |
| rage | Normal | special | Gen 1: preso no Rage, Atk +1 a cada golpe sofrido | 145 | MT genérica |
| razorwind | Normal | blast | carrega, depois acerta (área) | 17 | RISKY ×0,55 |
| recover | Normal | heal | cura 50% | Kadabra, Alakazam, Staryu, Starmie, Porygon, Mewtwo | cura vale 30 |
| reflect | Psychic | buff | dobra Def do time | 89 | buff fraco + perde para status |
| rest | Psychic | heal | cura tudo e dorme 2 turnos | 145 | cura vale 30 × MT ×0,6 = 23 |
| roar | Normal | special | encerra luta selvagem / força troca | Vulpix, Ninetales, Growlithe, Arcanine | Confuse Ray/Agility ganham |
| rollingkick | Fighting | strike | 60, 85%, 30% flinch | Hitmonlee (1) | Hitmonlee já tem 3 chutes melhores (HJK, Mega Kick, Jump Kick) |
| sandattack | Ground | debuff | precisão −1 | 12 | debuff |
| scratch | Normal | strike | 40 | 20 | fraco |
| screech | Normal | debuff | Def −2 | 18 | debuff (nota 44 no Ekans, perde para Glare) |
| sharpen | Normal | buff | Atk +1 | Porygon (1) | Agility ganha |
| skullbash | Normal | strike | carrega 1 turno, depois 100 (130 hoje) | 99 | MT genérica + RISKY |
| smokescreen | Normal | debuff | precisão −1 | 5 | debuff |
| strength | Normal | strike | MO04, 80 | 56 | Normal sem STAB |
| substitute | Normal | special | boneco com 25% do HP | 145 | MT genérica |
| swift | Normal | blast | nunca erra | 64 | MT genérica |
| tailwhip | Normal | debuff | Def −1 em área | 29 | debuff |
| wrap | Normal | strike | prende (Gen 1: ninguém age) | 11 | força 0,13 |

**Causas, em ordem de peso:**
1. **Só 4 vagas, e uma só para utilitário.** Status (60–85) e burst (65) sempre ganham de buff (40–55), special (50), heal (30) e debuff (25–35). Por isso os 8 debuffs e as 3 curas sumiram.
2. **MT de cobertura engole o 4º slot** (Blizzard ×36, Fire Blast ×19, Thunder ×18, Earthquake ×24). É o maior motivo de "todo mundo parece igual".
3. **MTs genéricas** (Bide, Mimic, Rage, Substitute, Rest, Double Team, Skull Bash, Swift, Mega Punch) têm penalidade de propósito (×0,6/×0,75), e com razão: se entrassem por pontuação, viravam o Blizzard da vez.
4. **RISKY ×0,55** (Fly, Skull Bash, Razor Wind) e golpes multi-acerto/prender de força normalizada baixa (Bind 0,13, Constrict 0,08).
5. Aprendiz único com concorrência interna (Rolling Kick no Hitmonlee, Conversion/Sharpen no Porygon).

Detalhe bom: o **Metronome do Mew já sorteia qualquer golpe que não seja flavor**, então em tese um dos 44 pode aparecer em campo hoje, mas a Golpedex não mostra (só numera golpes com usuário no moveset padrão).

### 1.3 Golpes que hoje se comportam igual (mesmo perfil no motor)

Agrupei pelo que o motor de fato usa (kind + secundário + TRAP/OHKO/DRAWBACK/DRAIN + boosts). Dentro de cada grupo só mudam força, precisão e tipo.

| Grupo (efeito igual) | Golpes |
|---|---|
| **strike puro (36)** | barrage, bonemerang, cometpunch, crabhammer, cut, dig, doublekick, doubleslap, drillpeck, earthquake, eggbomb, fly, furyattack, furyswipes, hornattack, karatechop, lowkick, megakick, megapunch, peck, pinmissile, pound, razorleaf, rockthrow, scratch, seismictoss, skullbash, slam, slash, spikecannon, strength, superfang, tackle, vinewhip, visegrip, wingattack |
| **blast puro (12)** | dragonrage, gust, hydropump, nightshade, payday, psywave, razorwind, solarbeam, sonicboom, surf, swift, watergun |
| strike + flinch (9) | bite, boneclub, headbutt, hyperfang, rockslide, rollingkick, skyattack, stomp, waterfall |
| sono (5) | hypnosis, lovelykiss, sing, sleeppowder, spore (só muda a precisão) |
| precisão −1 (4) | flash*, kinesis, sandattack, smokescreen (*Flash pega área) |
| burst (2) | **agility = quickattack** |
| Def +1 (3) | defensecurl, harden, withdraw |
| Def +2 (2) | acidarmor, barrier |
| Atk +1 (2) | meditate, sharpen |
| Def −1 (2) | leer, tailwhip |
| veneno (3) | poisongas, poisonpowder, **toxic** (Toxic = Poison Powder com mais precisão) |
| paralisia (3) | glare, stunspore, thunderwave |
| drena (3) | absorb, megadrain, dreameater (Dream Eater já é especial: só em quem dorme) |
| prender (3) | bind, clamp, wrap |
| OHKO (3) | fissure, guillotine, horndrill |
| recoil (3) | doubleedge, submission, takedown |
| faint (2) | explosion, selfdestruct |
| crash (2) | highjumpkick, jumpkick |
| queima, congela, paralisa, confunde, veneno em chute/rajada | ember/fireblast/flamethrower · blizzard/icebeam · thunder/thunderbolt/thundershock · confusion/psybeam · sludge/smog · poisonsting/twineedle |

Os grupos de "secundário" (Flamethrower vs Fire Blast etc.) estão ok: a diferença de força e precisão já é a diferença da Gen 1. O problema real são os **48 golpes "puros"** e os **clones de suporte**.

---

## 2. Como um golpe entra no time hoje, e como fazer os 44 aparecerem

### 2.1 Hoje

- `createInstance` → `moves: defaultMoveset(sp)`. A instância guarda os golpes (`PokemonInstance.moves`), então já existe espaço para golpes diferentes do padrão.
- `defaultMoveset` (src/engine/moves.ts): (0) assinatura (`signature-moves.ts`), (1) melhor dano STAB da categoria forte, (2) cobertura de outro tipo/categoria, (3) 1 utilitário (status > burst > buff > debuff > cura), (4) melhor resto. Golpe de nível dentro do estágio ×1,4; MT ×0,75; MT genérica ×0,6–0,75; RISKY ×0,55. Magikarp fixo.
- **Evolução refaz o moveset** (`evolveInstance` → `moves: defaultMoveset(sp)`). Qualquer golpe ensinado hoje se perderia ao evoluir.
- Usos: 1 por partida (2 se PP ≥ 25). Cooldown de 25 s por jogador e 5 s entre golpes de qualquer um.
- A IA (`ai-controller.ts`) escolhe por **kind** (`pickMoveSlot(['strike','blast'])`, etc.) e por id para os especiais (`pickSpecial`).

### 2.2 Opções

| Opção | Como | Prós | Contras |
|---|---|---|---|
| A. Mexer na pontuação | penalizar MT de cobertura sem STAB, subir debuff/cura | 0 de UI | **testado:** 87 espécies mudam, entram Growl ×18, Leer ×27, Tail Whip ×9, Screech ×9; Charizard vira Flamethrower/Slash/Growl/Leer. Só 9 dos 44 entram. Não chega a 164 e piora as cartas |
| B. **MT como recompensa da copa** | depois de cada vitória, uma das 3 cartas pode ser "MT": golpe + quem do seu time aprende. Você escolhe o Pokémon e qual golpe esquecer (ou pula) | escolha do jogador, roguelike puro (1 de 3), alcança os 164 (todos têm aprendiz), não mexe nos movesets padrão | precisa de tela de escolha + guardar "golpe ensinado" na evolução |
| C. Rival com MT | clubes da copa (são os ginásios!) entram com a MT do líder no 4º slot de quem aprende | faz os golpes aparecerem em campo sem tocar no seu time; dá cara aos ginásios | muda um pouco a força dos rivais |
| D. 5º slot / item "MT" segurado | item que dá um 5º golpe | simples de explicar | mexe em itens e em equilíbrio de todo mundo; a carta passa a ter 5 golpes |
| E. 2ª assinatura curada ("golpe do anime") | lista curta: Clefable → Metronome, Starmie → Recover, Exeggutor → Egg Bomb, Hitmonlee → Rolling Kick, Porygon → Conversion, Arcanine → Roar, Snorlax → Rest, Lapras → Mist, Weezing → Smokescreen, Muk → Minimize… | mais identidade nas cartas | muda carta de ~15 espécies: tem que passar pela galeria `?cards=1` e pelo seu ok, um por um |

### 2.3 Recomendação: B + C, com a "MT do ginásio"

Os clubes da copa já são os ginásios de Kanto (Pewter Rochedo, Cerulean Cascata…). Na Gen 1 cada líder dava uma MT. Quase todas são exatamente golpes esquecidos:

| Clube | Líder (Gen 1) | MT | Hoje no jogo |
|---|---|---|---|
| Pewter Rochedo | Brock | MT34 **Bide** | ninguém usa |
| Cerulean Cascata | Misty | MT11 **BubbleBeam** | ninguém usa |
| Vermilion Voltagem | Lt. Surge | MT24 Thunderbolt | 3 usam |
| Celadon Arco-Íris | Erika | MT21 **Mega Drain** | ninguém usa |
| Fuchsia Ninjas | Koga | MT06 Toxic | 10 usam |
| Saffron Mentes | Sabrina | MT46 Psywave | 1 usa |
| Cinnabar Vulcão | Blaine | MT38 Fire Blast | 19 usam |
| Viridian Terra | Giovanni | MT27 **Fissure** | ninguém usa |
| Lavender Assombro | (sem ginásio) | sorteio do "baú raro" | |
| Liga Índigo | (final, não dá recompensa) | | |

**Como fica:**
- Na tela de recompensa (`rewards.ts`), uma das 3 cartas pode ser **"MT"** (no lugar de um dos 2 itens, ~50% das vezes). Prioridade: a MT do ginásio que você acabou de vencer, se alguém do seu time aprende e ainda não tem; senão um golpe do "baú raro" (os 44 + golpes ainda não vistos na sua Golpedex), sempre entre os que alguém do seu time aprende. Visual de disco de MT; em PT-BR os jogos chamam de **MT** (Máquina Técnica) e **MO** (Máquina Oculta) para Cut/Fly/Surf/Strength/Flash.
- Ao pegar: escolhe o Pokémon (só quem aprende) e o golpe que vai esquecer. Texto Gen 1: "1, 2 e… Pronto! Charizard esqueceu Earthquake e aprendeu Fly!". Dá para desistir. **Sugestão:** a assinatura (slot 0) fica protegida para a carta não perder a cara. Decidir com você.
- **Evolução mantém o que foi ensinado** se a forma nova aprende (`taught: string[]` opcional na instância).
- **Rivais (C):** cada clube entra com a MT do líder no 4º slot dos Pokémon que aprendem (Misty com BubbleBeam, Brock com Bide, Erika com Mega Drain, Giovanni com Fissure). Os outros 4 Pokémon da IA rival têm ~20% de levar um golpe do baú raro (sorteio pela seed da copa). Isso é automático só no rival.
- **Golpedex:** passa a numerar todo golpe que algum Pokémon pode aprender (os 164), com um selo "MT" nos que só chegam assim. Contam em campo dos dois times, então ver Bide do Brock já descobre o golpe.

Por que esta e não A ou D: não muda o seu time sozinho, é uma escolha de 1 de 3 (o jeito do jogo), não mexe nas cartas padrão e não cria 5º slot. O risco de equilíbrio é local (um golpe por recompensa).

---

## 3. Diferenciar os golpes: 12 famílias de efeito

Ideia de implementação: em `moves.ts`, além do `kind` (que continua servindo para a IA e para a UI), cada golpe ganha uma lista de **traços** (`traits`) tirada de uma tabela única. O `match.ts` aplica os traços nos pontos que já existem: `kick` (chute), `tryTackle` (carrinho), `moveEffect` (rajada/suporte), `tickTimers` (efeitos no tempo) e `checkShotInteractions` (goleiro/bloqueio). Dá para derivar vários traços direto dos dados (`target: allAdjacentFoes/allAdjacent`, `multihit`, "high crit" no `shortDesc`).

**Já existe e será reaproveitado:** shotBonus/tackleBonus, knockback, stun, status/secundário, trap, OHKO, drawback (faint/recharge/recoil/rampage/crash), drain, leech seed (`seeded`), substitute, counter, evade, telas (light/reflect/mist), haze, teleport, transform, disable, metronome/mirror/mimic, buffs.

| # | Família | O que faz no futsal | Golpes | Gancho no motor |
|---|---|---|---|---|
| F1 | **Área** | sem bola, pega **todos** os rivais num raio de ~4 m em vez do mais perto. `allAdjacent` (Earthquake, Surf, Explosion) pega **os companheiros também** | acid, blizzard, bubble, growl, leer, poisongas, razorleaf, razorwind, rockslide, stringshot, swift, tailwhip, earthquake, surf, screech, rollingkick | novo, simples: loop de vítimas (o Flash e o Roar já fazem isso) |
| F2 | **Crítico** | chute crítico usa o caminho do Scope Lens (+25% velocidade, mais preciso, texto "Acerto crítico!"); carrinho crítico vence direto. Chance ~25% + bônus por **pace** (na Gen 1 o crítico vinha da Speed: Persian e Electrode critam muito) | slash, karatechop, razorleaf, crabhammer, razorwind, skyattack; **Focus Energy garante o próximo** | reaproveita o crit do Scope Lens |
| F3 | **Carga e recarga** | **carga:** fica 0,6 s parado brilhando; se levar carrinho nesse tempo perde o golpe (Skull Bash não perde: Def +1 na carga); depois sai o chute mais forte do jogo. **Recarga:** Hyper Beam continua parado depois, mas, como na Gen 1, **se fizer gol não recarrega** | solarbeam, skullbash, skyattack, razorwind · hyperbeam | novo estado `charging {moveId, t}`; recarga já existe |
| F4 | **Some do mapa** | 0,8 s fora do alcance (não sofre carrinho, status nem rajada). Com bola: carrega a bola por cima (Fly) ou por baixo (Dig) ~4 m para a frente e finaliza. Sem bola: reaparece em cima do portador e dá o bote. Earthquake pega quem está cavando em dobro (aceno aos jogos) | fly, dig | novo estado `airborne {kind, t}` + checagem em tryTackle/status/rajada |
| F5 | **Prioridade** | bote instantâneo: avança ~2 m e desarma sem esperar o cooldown; com bola, chute ou passe de primeira, sem tempo de preparo. Agility vira o oposto: velocidade longa (5 s) | quickattack (agility muda só a duração) | novo, curto: ignora tackleCooldown/kickCooldown + dash |
| F6 | **Mira** | **Nunca erra:** sem rolagem de precisão, o chute não é bloqueado por jogador de linha (só o goleiro) e sai mais certeiro. **Fura bloqueio:** ignora o 1º bloqueio. **Por cima:** chute de cobertura (usa a física do passe longo): passa pelos bloqueios e o goleiro alcança menos. **Tira a mira do rival:** fator novo `aim` no erro do chute/passe do alvo | swift (nunca erra) · drillpeck, cut (fura) · eggbomb (por cima) · sandattack, kinesis, flash, smokescreen (tira a mira) | novo fator no `sigma` do `kick` + flag no `ball.shot` |
| F7 | **Dano fixo** | ignora atributo e tipo. Chute com velocidade fixa (Dratini chuta igual Dragonite), sem vantagem de tipo do goleiro. Super Fang tira **metade do fôlego** do alvo. Seismic Toss **arremessa** 3 m e deixa 1 s no chão, sem depender da força. Psywave sorteia a força (0,5–1,5×): pode sair bomba ou bola murcha. Sonic Boom e Night Shade sem bola: atordoam por tempo fixo (na Gen 1 Night Shade, Seismic Toss e Dragon Rage ignoravam imunidade de tipo; Sonic Boom não pegava Ghost) | sonicboom, dragonrage, nightshade, seismictoss, psywave, superfang, lowkick* | novo, simples: troca fórmula por constante |
| F8 | **Multi-acerto e alcance** | **sem bola:** 2 a 5 tentativas de desarme seguidas (cada uma mais fraca, cada uma pode dar o secundário: Twineedle envenena). **com bola:** "rebote": se o goleiro espalmar ou alguém bloquear, a bola volta para o pé dele (Bonemerang sempre volta, é bumerangue). **Alcance:** desarme de 2,5–3 m (chicote, pedra, osso) | doublekick, twineedle, bonemerang (2) · furyattack, furyswipes, doubleslap, cometpunch, barrage, pinmissile, spikecannon (2–5) · alcance: vinewhip, rockthrow, bonemerang, wrap, bind | loop em tryTackle; rebote em checkShotInteractions; TACKLE_RANGE por golpe |
| F9 | **Prender** | Gen 1: no Wrap ninguém age. **Wrap/Bind:** alvo e usuário presos 1,2 s, o alvo não passa nem chuta. **Clamp:** o Shellder fecha a concha: rouba e segura a bola 1 s sem poder ser desarmado. **Fire Spin:** anel de fogo no chão (2 m, 4 s): queima e deixa lento quem passa. **Constrict:** só aperta (lento 2 s, sem stun) | wrap, bind, clamp, firespin, constrict | trap já existe; zona no chão é nova (lista de zonas no estado) |
| F10 | **Contador que cresce** | **Toxic:** veneno que piora (dreno ×1 → ×3 em 12 s); na Gen 1 o contador do Toxic acelerava o Leech Seed também (easter egg). **Rage:** 15 s de fúria, +5% chute/força a cada carrinho ou golpe sofrido (até 3), a IA parte para a pressão. **Bide:** 3 s segurando firme, depois solta uma onda que empurra e atordoa proporcional ao que sofreu | toxic, rage, bide | novo, curto: contadores no PlayerState |
| F11 | **Esquiva e muro** | **Double Team:** 2 clones, os 2 próximos carrinhos/golpes erram. **Minimize:** 4 s de esquiva (fica pequenininho no sprite); Stomp ignora Minimize (aceno Gen 2). **Acid Armor:** derrete, passa por carrinhos 3 s. **Withdraw:** casco, 1,5 s sem perder a bola, mas anda a 60%. **Defense Curl:** enrola, o próximo carrinho sofrido não derruba. **Barrier:** parede invisível 3 s na frente do Mr. Mime: bloqueia o próximo chute que passar perto | doubleteam, minimize, acidarmor, withdraw, defensecurl, barrier | reaproveita `substitute` (com contador) e `evade`; muro é novo |
| F12 | **Controle de campo** | **Roar:** o rival mais perto "volta para o banco": recua até a posição de origem dele (Gen 1: força a troca). **Whirlwind/Gust:** sopram a bola solta para longe e empurram (Gust pega dobrado quem está voando). **Strength:** carrinho-trator que empurra 2,5 m (a MO que empurra pedra). **Conversion (Gen 1):** copia o tipo do rival mais perto por 12 s (muda vantagem em carrinho, goleiro e golpes). **Mimic:** o slot do Mimic vira o último golpe do rival até o fim da partida; Mirror Move continua repetindo na hora. **Soft-Boiled:** cura ele e o companheiro mais cansado em 5 m (na Gen 1 dava para curar o time fora da luta). **Pay Day:** chuva de moedas, rivais a 3 m param 0,4 s para olhar; contador "moedas" só na súmula (nada de dinheiro) | roar, whirlwind, gust, strength, conversion, mimic, softboiled, payday | knockback/teleport já existem; type override e zona são novos |

**Easter eggs Gen 1 opcionais** (diversão > realismo, você decide): Focus Energy "bugado" (1 em 16: "Focus Energy falhou… como na Gen 1!"); Hyper Beam sem recarga quando faz gol; Fissure falha se o alvo for mais rápido (regra de OHKO da Gen 1 usando a Speed); Counter só devolve carrinho (físico), não rajada (Gen 1: só Normal/Lutador).

### 3.1 Tabela golpe a golpe (164)

Legenda: **Gancho** = família nova (F#) ou "existe" (mecânica que já está no motor). **Visual** = estilo do `move-fx.ts` (os 164 já têm receita ou padrão; "+estado" = precisa desenhar um estado novo no sprite). **Risco** = risco de equilíbrio (B baixo, M médio, A alto). *Itálico* = um dos 44 sem uso hoje.

#### Bug
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| leechlife | drena ½ | mantém: carrinho que suga fôlego. Novo: se o goleiro defender o chute, suga dele | existe (drain) | stream | B |
| pinmissile | 2–5 acertos | 2–5 tentativas de desarme / rebote no chute | F8 | stream | M |
| stringshot | Spe −1 (área) | teia em área: todos em 4 m ficam lentos | F1 | projectile | B |
| twineedle | 2 acertos, 20% veneno cada | 2 tentativas, cada uma pode envenenar | F8 | stream | B |

#### Dark / Dragon
| bite | flinch | mantém | existe | melee | B |
|---|---|---|---|---|---|
| dragonrage | 40 fixo | chute de velocidade fixa alta, sem vantagem de tipo do goleiro | F7 | beam | M |

#### Electric
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| thunder | 70%, 10% par | mantém; sem bola o raio cai no rival **mais longe** em até 9 m (vem do céu) | existe + alvo | sky | B |
| thunderbolt | 10% par | mantém | existe | beam | B |
| thunderpunch | 10% par | mantém | existe | melee | B |
| thundershock | 10% par | mantém | existe | projectile | B |
| thunderwave | paralisa (Ground imune) | mantém | existe | sound | B |

#### Fighting
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| counter | devolve 2× físico (só Normal/Lutador) | mantém a reação; só devolve **carrinho**, com empurrão dobrado | existe | melee | B |
| doublekick | 2 acertos | 2 tentativas | F8 | melee | B |
| highjumpkick | crash | mantém | existe | melee | B |
| jumpkick | crash | mantém | existe | melee | B |
| karatechop | crítico alto | crítico | F2 | melee | M |
| lowkick | Gen 1: 50 + 30% flinch | rasteira: derruba mais quem é pesado (usa `weightkg`: Snorlax fica 2 s no chão) | F7 leve | melee | B |
| *rollingkick* | 30% flinch | chute giratório: pega todos em 2 m + flinch | F1 | melee | B |
| seismictoss | dano = nível | arremessa 3 m, 1 s no chão, sem depender da força | F7 | melee | M |
| submission | recoil | mantém | existe | melee | B |

#### Fire
| ember | 10% queima | mantém | existe | stream | B |
|---|---|---|---|---|---|
| fireblast | 10% queima | mantém | existe | explosion | B |
| firepunch | 10% queima | mantém | existe | melee | B |
| firespin | prende | anel de fogo no chão (zona) | F9 | stream + zona | M |
| flamethrower | 10% queima | mantém | existe | stream | B |

#### Flying
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| drillpeck | 80 | broca: chute que fura o 1º bloqueio | F6 | melee | B |
| *fly* | invulnerável 1 turno | voa com a bola por cima da marcação e finaliza / cai em cima do portador | F4 | sky +estado (sombra) | **A** |
| gust | 40 | sopra a bola solta e empurra; dobro em quem voa | F12 | projectile | B |
| mirrormove | usa o último golpe do alvo | mantém | existe | aura | B |
| peck | 35 | mantém (golpe básico, 2 usos) | existe | melee | B |
| skyattack | carga, depois forte | carga + crítico | F3+F2 | sky +brilho | M |
| wingattack | 60 | mantém | existe | melee | B |

#### Ghost
| confuseray | confunde | mantém | existe | projectile | B |
|---|---|---|---|---|---|
| lick | 30% par | mantém | existe | melee | B |
| nightshade | dano = nível | chute fixo; sem bola atordoa tempo fixo; pega até Normal (na Gen 1 dano fixo ignorava imunidade) | F7 | beam | B |

#### Grass
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| absorb | drena ½ | mantém | existe | stream | B |
| *leechseed* | 1/8 por turno | mantém (já tem efeito próprio; só faltava aparecer) | existe | projectile | B |
| *megadrain* | drena ½ (MT21 Erika) | mantém (drena mais que Absorb) | existe | stream | B |
| petaldance | rampage | mantém | existe | stream | B |
| razorleaf | crítico alto, área | crítico + área | F2+F1 | stream | M |
| sleeppowder | sono | mantém | existe | cloud | B |
| solarbeam | carga | carga | F3 | beam +brilho | M |
| spore | sono 100% | mantém | existe | cloud | B |
| stunspore | par | mantém | existe | cloud | B |
| vinewhip | 45 | chicote: desarme de 2,8 m | F8 (alcance) | melee | B |
| *growth* | Special +1 | chute + passe (Special) por 12 s | existe (buff) | aura | B |

#### Ground
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| boneclub | flinch | mantém | existe | melee | B |
| bonemerang | 2 acertos | bumerangue: se defendem, a bola volta; desarme de 3 m | F8 | projectile | M |
| dig | cava 1 turno | por baixo: some e reaparece à frente; EQ pega dobrado | F4 | quake +estado (buraco) | **A** |
| earthquake | todos adjacentes | sem bola: tremor de 4 m que atordoa todo mundo, **inclusive companheiros** | F1 | quake | M |
| *fissure* | OHKO (MT27 Giovanni) | mantém OHKO 30%; falha se o alvo for mais rápido | existe + regra | quake | B |
| *sandattack* | precisão −1 | areia no olho: próximo chute/passe do alvo com erro ×2 (6 s) | F6 | projectile | B |

#### Ice
| aurorabeam | 10% Atk −1 | mantém | existe | beam | B |
|---|---|---|---|---|---|
| blizzard | 10% congela (área) | sem bola: nevasca em área com chance de congelar | F1 | sky | M |
| haze | zera tudo | mantém | existe | cloud | B |
| icebeam | 10% congela | mantém | existe | beam | B |
| icepunch | 10% congela | mantém | existe | melee | B |
| *mist* | imune a queda | mantém (já tem efeito, só faltava aparecer) | existe | cloud | B |

#### Normal
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| *barrage* | 2–5 | 2–5 tentativas / rebote | F8 | projectile | B |
| *bide* | aguenta e devolve 2× (MT34 Brock) | 3 s firme, depois onda proporcional ao que sofreu | F10 | aura → explosion | M |
| *bind* | prende (ninguém age) | os dois presos 1,2 s + alcance | F9+F8 | melee | M |
| bodyslam | 30% par | mantém | existe | melee | B |
| cometpunch | 2–5 | 2–5 tentativas | F8 | melee | B |
| *constrict* | 10% Spe −1 | aperta: lento 2 s | F9 leve | melee | B |
| *conversion* | Gen 1: vira o tipo do alvo | copia o tipo do rival mais perto por 12 s | F12 | aura +cor | M |
| *cut* | MO01 | corte: carrinho sem penalidade de costas; com bola, passe que não pode ser interceptado 1 s | F6 | melee | B |
| defensecurl | Def +1 | enrola: próximo carrinho sofrido não derruba | F11 | aura | B |
| disable | trava 1 golpe | mantém | existe | projectile | B |
| dizzypunch | 20% confunde | mantém | existe | melee | B |
| doubleedge | recoil | mantém | existe | melee | B |
| doubleslap | 2–5 | 2–5 tentativas | F8 | melee | B |
| *doubleteam* | evasão | 2 clones: 2 próximos carrinhos/golpes erram | F11 | aura +clones | M |
| *eggbomb* | 100, 75% | cobertura: chute por cima dos bloqueios | F6 | arco +ovo | M |
| explosion | faint, área | mantém (raio 4 m) | existe | explosion | B |
| *flash* | precisão −1 (MO05) | clarão em área: erro ×1,6 nos rivais em 7 m por 5 s | F6 | aura | B |
| focusenergy | crítico (bugado na Gen 1) | próximo chute crítico garantido (+ easter egg opcional) | F2 | aura | M |
| *furyattack* | 2–5 | 2–5 tentativas | F8 | melee | B |
| furyswipes | 2–5 | 2–5 tentativas | F8 | melee | B |
| glare | paralisa | mantém | existe | beam | B |
| *growl* | Atk −1 área | rugido em área: chute/força −8% | F1 | sound | B |
| guillotine | OHKO | mantém | existe | melee | B |
| harden | Def +1 | mantém (desarme e força) | existe | aura | B |
| headbutt | 30% flinch | mantém | existe | melee | B |
| hornattack | 65 | mantém | existe | melee | B |
| horndrill | OHKO | mantém | existe | melee | B |
| hyperbeam | recarga (não recarrega se nocautear) | mantém; se fizer gol, não recarrega | existe + regra | beam | B |
| hyperfang | 10% flinch | mantém | existe | melee | B |
| *leer* | Def −1 área | encarada em área: desarme −8% e os rivais travam 0,3 s | F1 | aura | B |
| lovelykiss | sono | mantém | existe | sound | B |
| megakick | 120, 75% | bicuda: a bola mais rápida do jogo, mas imprecisa | existe (parâmetros) | melee | B |
| *megapunch* | 80, 85% | soco: carrinho que derruba e empurra 2 m | existe (knockback) | melee | B |
| metronome | golpe aleatório | mantém | existe | aura | B |
| *mimic* | copia pela batalha | o slot vira o último golpe do rival até o fim (1 uso) | F12 | aura | B |
| *minimize* | evasão | 4 s difícil de desarmar, sprite encolhe | F11 | aura +escala | M |
| payday | moedas | chuva de moedas: rivais a 3 m param 0,4 s; "moedas" na súmula | F12 | projectile +moedas | B |
| *pound* | 40 | básico (2 usos) | existe | melee | B |
| quickattack | prioridade | bote de 2 m sem cooldown / chute de primeira | F5 | aura → dash | M |
| *rage* | preso no Rage, Atk +1 por golpe sofrido | fúria 15 s, acumula até 3 | F10 | aura vermelha | M |
| *razorwind* | carga, área | carga + lâminas em área / chute crítico | F3+F1+F2 | projectile | M |
| *recover* | cura 50% | cura 50% do fôlego (hoje ~28%) | existe | aura | B |
| *roar* | força troca | rival mais perto recua até a posição de origem | F12 | sound | M |
| *scratch* | 40 | arranhão: no desarme a bola fica sempre com ele (hoje 55%) | existe (ajuste) | melee | B |
| *screech* | Def −2 | grito em área: desarme e força −16% | F1 | sound | B |
| selfdestruct | faint | mantém (raio 3 m, menor que Explosion) | existe | explosion | B |
| *sharpen* | Atk +1 | chute e força (Porygon afiado) | existe | aura | B |
| sing | sono | mantém | existe | sound | B |
| *skullbash* | carga | carga sem poder ser desarmado, depois cabeçada fortíssima | F3 | melee +brilho | M |
| slam | 80, 75% | mantém | existe | melee | B |
| slash | crítico alto | crítico | F2 | melee | M |
| *smokescreen* | precisão −1 | nuvem de fumaça no chão (3 m, 5 s): chute e passe saem tortos **para os dois times** | F6 + zona | cloud | M |
| softboiled | cura 50% | cura ele e o companheiro mais cansado | F12 | aura | B |
| sonicboom | 20 fixo | estrondo: atordoa tempo fixo, Ghost imune | F7 | explosion | B |
| spikecannon | 2–5 | 2–5 tentativas / rebote | F8 | stream | B |
| splash | nada | mantém | existe | aura | B |
| stomp | 30% flinch | mantém + ignora Minimize | existe | melee | B |
| *strength* | MO04 | carrinho-trator: empurra 2,5 m | F12 | melee | B |
| *substitute* | boneco | mantém | existe | aura | B |
| superfang | metade do HP | tira metade do fôlego do alvo | F7 | melee | M |
| supersonic | confunde | mantém | existe | sound | B |
| *swift* | nunca erra | estrelas: sem erro, não pode ser bloqueado por jogador de linha | F6 | projectile (estrelas) | M |
| swordsdance | Atk +2 | mantém | existe | aura | B |
| tackle | 40 | mantém | existe | melee | B |
| *tailwhip* | Def −1 área | rabinho em área: desarme −8% | F1 | melee | B |
| takedown | recoil | mantém | existe | melee | B |
| thrash | rampage | mantém | existe | melee | B |
| transform | copia | mantém | existe | projectile | B |
| triattack | 20% par/queima/congela | mantém | existe | beam | B |
| visegrip | 55 | mantém | existe | melee | B |
| whirlwind | força troca | ventania em área + sopra a bola solta | F12 | sound | B |
| *wrap* | prende (ninguém age) | os dois presos 1,2 s + alcance | F9+F8 | melee | M |

#### Poison
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| acid | 10% SpD −1 (área) | área | F1 | projectile | B |
| *acidarmor* | Def +2 | derrete: passa por carrinhos 3 s | F11 | aura | B |
| poisongas | veneno (área) | nuvem: envenena todos em 3 m | F1 | cloud | M |
| poisonpowder | veneno | mantém | existe | cloud | B |
| poisonsting | 30% veneno | mantém | existe | melee | B |
| sludge | 30% veneno | mantém | existe | projectile | B |
| smog | 40% veneno | mantém | existe | cloud | B |
| toxic | veneno que piora | dreno crescente ×1 → ×3 | F10 | projectile | M |

#### Psychic
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| agility | Spe +2 | velocidade longa (5 s), diferente do Quick Attack | existe (duração) | aura | B |
| amnesia | Gen 1: Special +2 (a famosa quebrada) | chute + posicionamento, e imune a sono/confusão 6 s | existe + flag | aura | M |
| barrier | Def +2 | muro invisível 3 s: bloqueia o próximo chute que passar perto | F11 | aura +parede | M |
| confusion | 10% confunde | mantém | existe | projectile | B |
| dreameater | só em quem dorme | mantém | existe | beam | B |
| hypnosis | sono | mantém | existe | sound | B |
| *kinesis* | precisão −1 | entorta a colher: o **próximo** chute do alvo sai bem torto | F6 | aura | B |
| lightscreen | tela | mantém | existe | aura | B |
| *meditate* | Atk +1 | chute + imune a confusão 8 s (foco) | existe + flag | aura | B |
| psybeam | 10% confunde | mantém | existe | beam | B |
| psychic | 10% SpD −1 | mantém | existe | beam | B |
| psywave | aleatório | força sorteada 0,5–1,5× | F7 | beam | B |
| *reflect* | tela | mantém | existe | aura | B |
| *rest* | cura tudo + dorme | mantém (a IA nunca usa no goleiro com a bola perto) | existe | aura | M |
| teleport | foge | mantém | existe | aura | B |

#### Rock / Water
| Golpe | Gen 1 | Futsal proposto | Gancho | Visual | Risco |
|---|---|---|---|---|---|
| rockslide | 30% flinch (área) | área + flinch | F1 | sky | M |
| rockthrow | 50 | arremesso: desarme de 3 m | F8 | projectile | B |
| bubble | 10% Spe −1 (área) | área | F1 | stream | B |
| *bubblebeam* | 10% Spe −1 (MT11 Misty) | mantém (Bubble forte) | existe | beam | B |
| clamp | prende | rouba e segura a bola 1 s | F9 | melee | M |
| crabhammer | crítico alto | crítico | F2 | melee | M |
| hydropump | 110, 80% | mantém; sem bola o jato empurra o dobro | existe (parâmetro) | projectile | B |
| surf | todos adjacentes | onda: empurra todo mundo na faixa, inclusive companheiros | F1 | wave | M |
| waterfall | 20% flinch | mantém | existe | wave | B |
| watergun | 40 | mantém | existe | projectile | B |
| withdraw | Def +1 | casco: 1,5 s sem perder a bola, anda a 60% | F11 | aura | B |

Conta: mudam de comportamento ~70 golpes; ~95 ficam como estão (já são distintos ou o secundário basta). Os 44 sem uso: 36 ganham comportamento novo e 8 já tinham efeito próprio e só não apareciam (Leech Seed, Mega Drain, Mist, Reflect, Substitute, BubbleBeam, Fissure, Recover/Rest com ajuste).

---

## 4. Plano de implementação

### 4.1 Fases e arquivos

**Fase 1: motor (traços + 12 famílias).** Esforço: 2–3 sessões.
- `src/engine/moves.ts`: tabela `MOVE_TRAITS` (golpe → traços), `MOVE_EXPLAIN` para **todos** os golpes (hoje só os especiais têm `SPECIAL_EXPLAIN`), limpar `FLAVOR`/`SPECTACULAR` (viram traços). `MoveProfile` ganha `traits`. O `kind` fica (IA e UI dependem dele).
- `src/engine/state.ts`: campos novos no `PlayerState` (`charging`, `airborne`, `decoys`, `aim`, `rage`, `bide`, `typeOverride`, `toxicT`) e `zones` no `MatchState` (fumaça, anel de fogo, muro). Snapshot: bits novos para o render (cuidado com `SNAP_STRIDE = 7`: usar o campo de status/flags existente ou subir o stride junto com o `match-view.ts`).
- `src/engine/match.ts`: `moveEffect` (aplica traços), `tryTackle` (multi-acerto, alcance, crítico, airborne, clones, Strength, Wrap), `kick` (nunca erra, fixo, por cima, crítico, `aim`), `checkShotInteractions` (Swift não bloqueável, muro do Barrier, rebote/Bonemerang, fixo ignora tipo), `tickTimers` (carga solta, pouso do Fly/Dig, Toxic crescente, Bide, zonas), `drawback` (Hyper Beam sem recarga em gol). Tudo com `s.rng`, nada de `Math.random`/`Date`.
- `src/engine/controllers/ai-controller.ts`: gatilhos novos (carga só com pressão < 0,35; Fly/Dig com bola sob pressão perto do gol; Quick Attack com portador a 1,3–3 m; debuffs de área com 2+ rivais em 4 m; fumaça/areia/Kinesis com rival em posição de chute perto do seu gol; Barrier/Withdraw/clones sob pressão; Roar/Whirlwind com portador perto do seu gol; Rest nunca no goleiro com a bola perto). Hoje debuff aparece 0,06 vez por jogo: subir a chance quando o efeito vira área.

**Fase 2: MT do ginásio.** Esforço: 1–2 sessões.
- `src/engine/rewards.ts`: `Reward` ganha `{ kind: 'tm'; move; learners: uid[]; gym?: string }`; parâmetro opcional com golpes já vistos (vem do store; continua determinístico porque é entrada).
- `src/engine/cup.ts`: `GYM_TM` por clube; rivais com a MT do líder + ~20% de golpe raro.
- `src/engine/instance.ts` (`taught?: string[]`) e `src/engine/evolution.ts` (reaplica o que foi ensinado se a forma nova aprende).
- `src/store/game-store.ts`: aplicar MT (Pokémon + slot escolhidos). Campo opcional: save antigo continua válido (sem migração; conferir o cloud save).
- UI: carta de MT na tela de recompensa + modal "esquecer qual golpe?" (celular 320/390 px, deitado, desktop).

**Fase 3: UI, Golpedex e visual.** Esforço: 1–2 sessões.
- `src/ui/golpedex/golpedex-data.ts`: numerar todo golpe com aprendiz (164) + selo "MT/MO".
- `PlayerInspect.tsx`, `CardModal.tsx`, `MoveLab.tsx`: texto do `MOVE_EXPLAIN`.
- `src/game/move-fx.ts` + cena da partida: estados novos (brilho de carga, sombra do Fly, buraco do Dig, clones do Double Team, Minimize encolhendo, zonas de fumaça/fogo, parede do Barrier, moedas do Pay Day). Sem emoji: tudo desenhado (SVG ou Phaser).
- `src/ui/patch-notes.ts`, `CHANGELOG.md`, `package.json` (0.9.0?), tag.

Total: ~5–7 sessões. Dá para entregar a Fase 1 sozinha (já muda o jogo) e a Fase 2 depois.

### 4.2 Testes

- Já existentes e que precisam continuar verdes: "mesma seed → mesmo log", "BatchRunner = LiveRunner", "controller humano roteirizado", "nenhum golpe fica sem efeito", "movesets ≤ 4". O teste de recompensa ("1 reforço + 2 itens") muda para "1 reforço + 2 itens **ou** 1 item + 1 MT".
- Novos (`engine.test.ts`):
  - todo golpe tem `MOVE_EXPLAIN` e todo golpe tem aprendiz (Golpedex = 164);
  - um teste curto por família com cenário montado (2 jogadores, golpe forçado via controller roteirizado): Fly não sofre carrinho durante o voo; carga interrompida por carrinho perde o golpe (Skull Bash não); Swift não é bloqueado; Toxic drena mais no fim que no começo; Double Team absorve exatamente 2 carrinhos; Wrap trava os dois; Quick Attack desarma com cooldown ativo; Super Fang tira metade do fôlego; Earthquake atordoa companheiro;
  - evolução mantém golpe ensinado (Charmeleon com Fly → Charizard com Fly);
  - recompensa de MT determinística pela seed e só com golpes que alguém do time aprende.
- `npm run lint`, `npm test`, `npm run build`.

### 4.3 Calibração: antes e o que esperar

`npm run calibrate -- --n 400` (e `--tactics`). Sugestão: adicionar ao calibrate (a) contagem de golpes por **família** e (b) uma flag `--tm` para simular rivais com MT.

| Métrica | Antes (hoje) | Esperado depois | Alarme |
|---|---|---|---|
| Gols/jogo | 6,57 | 6,3–7,0 | > 7,3 ou < 5,8 |
| Favorito (Δ≥3) vence | 67,9% | 65–69% | > 71% |
| Golpes/jogo | 22,8 | 23–27 | > 30 (vira poluição visual) |
| Debuff/jogo | 0,06 | ≥ 0,8 | |
| Special/jogo | 0,84 | ≥ 1,2 | |
| Pior tipo | Fighting 41% | ≥ 43% (Karate Chop crítico, Seismic Toss, Low Kick, Counter ajudam) | < 40% |
| Melhor tipo | Ghost 59% | ≤ 58% (Night Shade fixo pode subir Ghost: ficar de olho) | > 60% |
| Flying | 55% | ≤ 57% (Fly/Sky Attack) | > 58% |

O mais arriscado: **Fly/Dig** (sem marcação perto do gol pode virar gol fácil), **carga** (o chute mais forte do jogo) e **multi-acerto** (desarme demais). Cada um tem um número só para ajustar (duração no ar, multiplicador da carga, força por tentativa).

### 4.4 O que mostrar para você aprovar

1. Esta tabela de famílias e os easter eggs (sim/não para cada).
2. Antes/depois de 8 Pokémon (moveset padrão **não muda**; muda o que cada golpe faz):

| Pokémon | Golpe | Hoje | Proposto | MT que faria sentido |
|---|---|---|---|---|
| **Pidgeot** | Sky Attack | chute forte genérico (força 1,0) | carrega 0,6 s brilhando, chute crítico; se levar carrinho na carga, perde | **Fly** (voa com a bola por cima da marcação) |
| | Agility | +velocidade 2,5 s (igual ao Quick Attack) | +velocidade 5 s | |
| | Quick Attack | igual ao Agility | bote de 2 m sem cooldown / chute de primeira | |
| | Double-Edge | recoil | mantém | |
| **Gengar** | Night Shade | chute especial genérico (0,58) | chute de velocidade fixa, ignora tipo do goleiro; sem bola atordoa fixo, pega até Normal (quirk da Gen 1) | Mega Drain (Erika), Substitute |
| | Dream Eater, Confuse Ray, Hypnosis | | mantém (o combo Hypnosis → Dream Eater já existe) | |
| **Snorlax** (goleiro) | Earthquake | chute/carrinho forte | sem bola: tremor de 4 m que atordoa todo mundo, até companheiro | **Rest** (a IA não usa com a bola perto) |
| | Amnesia | posicionamento +14% | chute + posicionamento, imune a sono/confusão 6 s (a Amnesia quebrada da Gen 1) | |
| | Body Slam, Double-Edge | | mantém | |
| **Mewtwo** | Blizzard | chute/rajada no mais perto | sem bola: nevasca em área com chance de congelar | **Recover**, **Barrier**, **Swift** |
| | Psychic, Thunder Wave, Fire Blast | | mantém | |
| **Charizard** | Earthquake | chute/carrinho | tremor em área (cuidado com o próprio time) | **Fly**, **Fissure** (Giovanni) |
| | Flamethrower, Fire Blast, Swords Dance | | mantém | |
| **Starmie** | Hydro Pump | chute forte impreciso | mantém; sem bola o jato empurra o dobro | **Recover** (anime), **Swift**, **Minimize** |
| | Blizzard | rajada no mais perto | área | |
| **Hitmonlee** | Focus Energy | chute +12% | próximo chute é crítico garantido | **Rolling Kick** (giro em área + flinch) |
| | Mega Kick | chute forte genérico | bicuda: a bola mais rápida do jogo, imprecisa | |
| **Clefable** | Double Slap | carrinho genérico (0,38) | 2–5 tentativas de desarme | **Metronome**, **Minimize** |

3. Números do calibrate antes/depois (tabela 4.3) e uma rodada no `?lab=golpes` com cada família animada.
4. Decisões que são suas: valores (chance de crítico, tempo de carga, tempo no ar, tentativas do multi-acerto, crescimento do Toxic), proteger ou não a assinatura na MT, frequência da carta de MT (sugestão ~50% das recompensas), chance de golpe raro no rival (sugestão 20%), e a opção E (2ª assinatura "do anime") à parte, pela galeria `?cards=1`.
