# Tradução para o inglês: o que ficou pendente

A tradução (branch `traducao`) cobriu toda a interface, menos os arquivos que estavam sendo mexidos ao mesmo
tempo por outros dois trabalhos (efeitos dos golpes no motor e MT do ginásio). Para não criar conflito, esses
arquivos não foram tocados. Este documento lista os textos que aparecem na tela e estão neles, com a proposta
em inglês, para terminar logo depois do merge.

## Como terminar

**API (sem dependência nova):**

- `src/i18n/index.ts` (funciona fora do React):
  - `t(chave, vars?)`: texto com `{nome}` trocado. Chaves tipadas: `t('match.halftime', { score })`.
  - `tn(chave, n, vars?)`: plural no formato `"um|vários"` (`{n}` é o número). `plural(formas, n)` faz o
    mesmo com um texto solto; `fmt(texto, vars)` só interpola.
  - `dict()`: dicionário inteiro do idioma atual (listas, estruturas). `getLang()` / `setLang()`.
  - Nomes de dados: `moveName(id)`, `abilityName(id)`, `itemName(id)` (oficiais em inglês, iguais nas duas
    línguas, como o jogo já fazia), `itemDesc(id)`, `moveDesc(id)` (PT: `descPt`; EN: `shortDesc`),
    `abilityDesc(id)`, `typeName(tipo)`, `statusName('par' | código)`, `stageName(fase)`,
    `clubName(nomeSalvo)`, `iconTitle(espécie)`, `formationText(id)`, `linkText(id)` (nome, desc, combo),
    `modLabel()` / `moveModLabel()`, `pct(f)`.
- `src/i18n/react.ts`: `useT()` → `{ lang, d, t, tn }` (redesenha quando o idioma muda) e
  `rich(texto, { nome: <b>…</b> })` para texto com JSX no meio (entende `**negrito**`).

**Onde pôr as chaves:** cada área tem `src/i18n/pt/<area>.ts` (fonte da verdade) e `src/i18n/en/<area>.ts`
(mesmo tipo: faltou chave em inglês = erro no `tsc`). A área nova entra em `src/i18n/pt.ts` e `en.ts`.
Sugestão: `commentary` (narração de `commentary.ts`), `battle` (faixa de batalha e textos na quadra do
`MatchScene.ts` e `cinematics.ts`), `reward` (tela de recompensa e MT) e, no `common` que já existe, as
explicações dos golpes especiais (`SPECIAL_EXPLAIN`).

**Regras:**

- **Português byte a byte igual:** copie o texto atual para `pt/<area>.ts` sem mudar nada (nem pontuação,
  nem o "GOOOOOL"). Quem joga em português não pode ver diferença.
- **Termos Pokémon com o nome oficial em inglês** (batalha, status, golpes, tipos). Nada traduzido de volta
  do português.
- **Phaser e narração estão fora do React:** `MatchScene.ts`, `cinematics.ts` e a classe `Commentator` usam
  o `t()` normal (não o hook). O idioma atual é mantido pelo `settings-sync.ts` (chama `setLang` sempre que
  `settings.lang` muda), então basta chamar `t()` na hora de montar o texto.
- Textos do motor que viram tela (`TACTIC_LABEL`, `CUP_STAGES`, nomes dos clubes, `SPECIAL_EXPLAIN`): o
  dicionário `common` já tem `tactic`, `stage`, `club` com PT idêntico ao do motor. Na tela, troque o uso
  direto por `t('common.tactic.' + id)`, `stageName(i)`, `clubName(nome)`. O motor pode continuar com o
  texto em português (o save guarda o nome do clube em português; `clubName` traduz na exibição).
- `src/store/game-store.ts` já ganhou o campo `lang: 'pt' | 'en'` em `Settings` (padrão pelo navegador via
  `detectLang()`); foi a única mudança nele. Saves antigos sem o campo caem no `detectLang()`.
- Variações sorteadas (`this.pick(...)`) da narração: mantenha o mesmo número de opções nas duas línguas
  para o RNG da narração sortear igual (use arrays no dicionário, `dict().commentary.shots`).

## src/ui/commentary.ts (narração)

Nomes de golpes, habilidades e itens já vêm dos dados em inglês (`MOVES[id].name` etc.): ok. Os nomes dos
times (`teamNames`) precisam passar por `clubName()` quando forem do rival. A troca de tática deve usar
`t('common.tactic.' + e.tactic)` no lugar de `TACTIC_LABEL`; o combo deve usar `linkText(e.link)`.

| Linha | PT | EN proposto |
| --- | --- | --- |
| 22 | `${w} usa Bide e se segura para o próximo carrinho!` | `${w} uses Bide and braces for the next slide tackle!` |
| 23 | `${w} fica com RAIVA! Chute e força lá em cima!` | `${w}'s RAGE is building! Shooting and Physical way up!` |
| 24 | `${w} usa Conversion e se adapta ao jogo!` | `${w} uses Conversion and adapts to the game!` |
| 25 | `${w} usa Disable: ${t} perdeu um golpe!` | `${w} uses Disable: ${t}'s move was disabled!` |
| 25 | `${w} usa Disable... não pegou.` | `${w} uses Disable... but it failed.` |
| 26 | `${w} RUGE e espanta todo mundo em volta!` | `${w} ROARS and scares everyone nearby away!` |
| 26 | `${w} ruge para o nada.` | `${w} roars at nothing.` |
| 28 | `${w} usa Whirlwind: a ventania joga os rivais longe!` | `${w} uses Whirlwind: the gust blows the rivals away!` |
| 28 | `${w} usa Whirlwind no vazio.` | `${w} uses Whirlwind on empty space.` |
| 29 | `${w} usa Splash! ...quase nada acontece, mas fica difícil de pegar.` | `${w} uses Splash! ...almost nothing happens, but it's hard to catch.` |
| 31 | `${w} usa Transform e copia o melhor de ${t}!` | `${w} uses Transform and copies the best of ${t}!` |
| 31 | `${w} tenta Transform, mas não tem ninguém perto.` | `${w} tries Transform, but nobody is close.` |
| 35 | `paralisado` | `paralyzed` (linha: "X is paralyzed!") |
| 36 | `dormindo` | `asleep` ("X fell asleep!") |
| 37 | `envenenado` | `poisoned` ("X was poisoned!") |
| 38 | `queimado` | `burned` ("X was burned!") |
| 39 | `congelado` | `frozen solid` ("X was frozen solid!") |
| 40 | `confuso` | `confused` ("X became confused!") |
| 41 | `apaixonado` | `in love` ("X fell in love!") |
| 42 | `hesitante` | `flinched` ("X flinched!") |
| 43 | `semeado (perde fôlego aos poucos)` | `seeded (slowly loses stamina)` ("X was seeded!") |
| 84 | `Rola a bola! Saída do ${time}.` | `Kick-off! ${team} get us underway.` |
| 90 | `GOL CONTRA! ${x} manda pra própria rede! ${placar}` | `OWN GOAL! ${x} puts it into their own net! ${score}` |
| 95 | ` Assistência de ${x}.` | ` Assist by ${x}.` |
| 96 | `GOOOOOL`, `GOLAÇO`, `É GOL`, `GOOOL` (sorteio) | `GOOOOAL`, `WHAT A GOAL`, `IT'S IN`, `GOOOAL` |
| 98 | `${grito} do ${time}! ${'O capitão '}${x} balança a rede!${assist} ${placar}` | `${shout} for ${team}! ${'Captain '}${x} finds the net!${assist} ${score}` |
| 107 | `${who} usa ${move} e solta a bomba!` | `${who} uses ${move} and unleashes a rocket!` |
| 109 | `${who} cara a cara com o goleiro... chutou!` | `${who} one-on-one with the keeper... shoots!` |
| 112–115 | `${who} arrisca de longe!` / `${who} finaliza!` / `Chute de ${who}!` / `${who} bate para o gol!` | `${who} tries from distance!` / `${who} shoots!` / `Shot by ${who}!` / `${who} goes for goal!` |
| 124 | `${x} encaixa firme!` / `Defesa segura de ${x}.` | `${x} holds on tight!` / `Safe save by ${x}.` |
| 126–127 | `QUE DEFESA de ${x}! Espalmou!` / `${x} voa e manda para fora!` | `WHAT A SAVE by ${x}! Parried!` / `${x} flies and tips it wide!` |
| 134 | `NA TRAVE!` / `Carimbou a trave!` / `Bola no poste! Que azar!` | `OFF THE POST!` / `Smashed off the woodwork!` / `Hits the post! So unlucky!` |
| 140 | `Pra fora.` / `Passou longe.` / `Raspando a trave, pra fora!` | `Wide.` / `Way off target.` / `Just past the post!` |
| 145 | `${x} se joga na frente e bloqueia!` | `${x} throws themselves in front and blocks!` |
| 151–152 | `Desarme de ${x} em ${y}.` / `${x} rouba a bola!` | `${x} tackles ${y}.` / `${x} wins the ball!` |
| 160 | `${x} lê o passe e intercepta.` | `${x} reads the pass and intercepts.` |
| 170 | ` É super efetivo!` | ` It's super effective!` |
| 170 | ` Não é muito efetivo...` | ` It's not very effective...` |
| 174 | `COUNTER! ${who} devolve o golpe em ${x}!` | `COUNTER! ${who} strikes ${x} right back!` |
| 176 | `${who} balança o dedo... Metronome!` | `${who} waggles a finger... Metronome!` |
| 180 | `${who} copia o golpe do rival com ${move}!` | `${who} copies the rival's move with ${move}!` |
| 181 | `${who} usa ${move}... não tinha o que copiar.` | `${who} uses ${move}... but there was nothing to copy.` |
| 186 | `${who} usa Substitute: um boneco entra na frente!` | `${who} uses Substitute: a decoy steps in front!` |
| 188 | `${who} cobre o time com Mist!` | `${who}'s team became shrouded in Mist!` |
| 192 | `${who} usa Leech Seed... não pegou.` | `${who} uses Leech Seed... but it missed.` |
| 198 | `${who} usa Splash! ...mas nada acontece.` | `${who} used Splash! But nothing happened!` |
| 199 | `${who} usa ${move}! A torcida não entendeu nada.` | `${who} uses ${move}! The crowd is baffled.` |
| 201 | `${who} usa ${move} e dispara em velocidade!` | `${who} uses ${move} and bursts away!` |
| 203 | `${who} usa ${move} e se concentra.` | `${who} uses ${move} and focuses.` |
| 205 | `${who} usa ${move} e recupera o fôlego.` | `${who} uses ${move} and gets their breath back.` |
| 209 | `${who} usa ${move} em ${x}!` | `${who} uses ${move} on ${x}!` |
| 210 | `${who} usa ${move}, mas não surte efeito.` | `${who} uses ${move}, but it had no effect.` |
| 215 | `${who} usa ${move}... errou!` | `${who} uses ${move}... it missed!` |
| 217 | `${who} carrega ${move} no pé!` | `${who} loads ${move} into the shot!` |
| 220 | `${who} chega com ${move} na dividida!${suffix}` | `${who} goes into the challenge with ${move}!${suffix}` |
| 224 | `${who} dispara ${move} em ${x}!` + ` Errou!` | `${who} fires ${move} at ${x}!` + ` Missed!` |
| 235 | `${x} ficou ${status}!${(golpe)}` | `${x} is ${status}!${(move)}` (melhor: frase pronta por status, ver linhas 35–43) |
| 244 | `${ab} de ${x} pega ${y}!` | `${x}'s ${ab} hits ${y}!` |
| 245 | `${ab} de ${x} é ativada!` | `${x}'s ${ab} activated!` |
| 252 | `${x} se transforma em ${sp}, o melhor da posição em campo!` | `${x} transformed into ${sp}, the best in its position on the court!` |
| 259 | `COMBO ${LINK}! ${a} serve ${b}: ${combo}!` | `${LINK} COMBO! ${a} sets up ${b}: ${combo}!` |
| 265 | `O QUÊ? ${x} está evoluindo... virou ${sp}!` | `What? ${x} is evolving... it became ${sp}!` |
| 271 | `O boneco de ${x} aguentou o golpe de ${y}!` | `The substitute took ${y}'s hit for ${x}!` |
| 278 | `${x} solta Haze: a névoa limpa ${n} Pokémon em volta!` | `${x} uses Haze: all stat changes were eliminated for ${n} Pokémon nearby!` |
| 279 | `${x} solta Haze, mas ninguém por perto tinha nada.` | `${x} uses Haze, but nobody nearby had anything to clear.` |
| 284 | `${x} usa Teleport e aparece do outro lado!` | `${x} uses Teleport and pops up on the other side!` |
| 287 | `${x} dá um drible desconcertante!` | `${x} pulls off a dazzling dribble!` |
| 290 | `${time} muda para ${tática}!` | `${team} switch to ${tactic}!` |
| 296 | `${item} de ${who} segura o gol certo!` | `${who}'s ${item} stops a sure goal!` |
| 298 | `${who} come a ${item} e se cura!` | `${who} ate its ${item} and was cured!` |
| 300 | `Chute crítico! ${item} de ${who}!` | `A critical shot! ${who}'s ${item}!` |
| 301 | `${who} resiste graças à ${item}!` | `${who} hung on using its ${item}!` |
| 308 | `Substituição no ${time}: sai ${out}, entra ${in}.` | `Substitution for ${team}: ${out} off, ${in} on.` |
| 313 | `Fim do primeiro tempo. ${placar}` | `Half-time. ${score}` |
| 317 | `Fim de jogo! ${placar} — vamos para os pênaltis!` | `Full-time! ${score} — it's going to penalties!` |
| 318 | `Fim de jogo! ${placar}` | `Full-time! ${score}` |
| 323 | `Pênalti ${n}: ${x} converte!` / `perde! ${gk} defende!` `(a x b)` | `Penalty ${n}: ${x} scores!` / `misses! ${gk} saves!` `(a–b)` |
| 329 | `${time} vence!` | `${team} win!` |
| 336 | `${A} ${a} x ${b} ${B}` (placar) | `${A} ${a}–${b} ${B}` |

## src/game/scenes/MatchScene.ts (faixa de batalha e textos na quadra)

Os rótulos de status no Pokémon (`PAR`, `Zzz`, `PSN`, `BRN`, `FRZ`, `???`, `♥`, linhas 126–132) já são as
siglas oficiais em inglês: ficam iguais. O prefixo do capitão `C·` (448, 525, 1455) também. O combo
(1299–1305) usa `link.name`/`link.combo` do motor, em português: trocar por `linkText(link.id)`.

| Linha | PT | EN proposto |
| --- | --- | --- |
| 145 | `foi paralisado!` | `is paralyzed! It may be unable to move!` (curto: `was paralyzed!`) |
| 146 | `caiu no sono!` | `fell asleep!` |
| 147 | `foi envenenado!` | `was poisoned!` |
| 148 | `foi queimado!` | `was burned!` |
| 149 | `foi congelado!` | `was frozen solid!` |
| 150 | `ficou confuso!` | `became confused!` |
| 151 | `se apaixonou!` | `fell in love!` |
| 152 | `hesitou!` | `flinched!` |
| 153 | `foi semeado!` | `was seeded!` |
| 676 | `Disputa de pênaltis!` | `Penalty shoot-out!` |
| 708 | `${x} vai para a bola...` | `${x} steps up to the ball...` |
| 1070 | `QUE DEFESA!` | `WHAT A SAVE!` |
| 1076 | `DEFESA!` | `SAVE!` |
| 1082 | `NA TRAAAVE!` | `OFF THE POOOST!` |
| 1087 | `TRAVE!` | `POST!` |
| 1100 | `GOL CONTRA!` | `OWN GOAL!` |
| 1100 | `GOOOOOL!` | `GOOOOAL!` |
| 1156 | `${x} usou ${golpe}!` | `${x} used ${move}!` |
| 1157 | `Mas nada aconteceu!` | `But nothing happened!` |
| 1158 | `Mas errou!` | `But it missed!` |
| 1160 | `É super efetivo!` | `It's super effective!` |
| 1161 | `SUPER EFETIVO!` | `SUPER EFFECTIVE!` |
| 1163 | `Não é muito efetivo...` | `It's not very effective...` |
| 1231 | `${x} se transformou em ${y}!` | `${x} transformed into ${y}!` |
| 1281 | `TRANSFORMAR!` | `TRANSFORM!` |
| 1285 | `${x} virou ${y}` | `${x} became ${y}` |
| 1296–1297 | `COMBO!` | `COMBO!` (igual) |
| 1299 | `Combo ${link}: ${a} + ${b}!` | `${link} combo: ${a} + ${b}!` |
| 1301 | `link.combo.toUpperCase()` (ex.: `EU ESCOLHO VOCÊ`) | `linkText(id).combo` (ex.: `I CHOOSE YOU`) |
| 1305 | `Combo ${link}: ${a} + ${b}` | `${link} combo: ${a} + ${b}` |
| 1312 | `SUBSTITUTO!` | `SUBSTITUTE!` |
| 1313 | `O boneco de ${x} aguentou o golpe!` | `The substitute took damage for ${x}!` |
| 1317 | `limpo!` | `cleared!` |
| 1318 | `A névoa do Haze limpa tudo em volta!` | `All stat changes were eliminated!` |
| 1325 | `${x} se teleportou!` | `${x} teleported!` |
| 1332 | `Habilidade de ${x} ativada!` | `${x}'s Ability activated!` |
| 1342 | `Chute crítico de ${x}!` | `A critical shot from ${x}!` |
| 1343 | `${item} de ${x} entrou em ação!` | `${x}'s ${item} kicked in!` |
| 1362 | `É GOL!` | `GOAL!` |
| 1362 | `PEGOU!` | `SAVED!` |
| 1428 | `O quê? ${x} está evoluindo!` | `What? ${x} is evolving!` |
| 1445 | `Parabéns! ${x} evoluiu para ${y}!` | `Congratulations! ${x} evolved into ${y}!` |
| 1538 | `GOL!` | `GOAL!` |

## src/engine/state.ts

| Linha | PT | EN proposto |
| --- | --- | --- |
| 13 | `Equilibrado` | `Balanced` |
| 14 | `Ofensivo` | `Attacking` |
| 15 | `Retranca` | `Defensive` |
| 16 | `Contra-ataque` | `Counter-attack` |

Já existem em `common.tactic` (pt/en). Pendente só trocar os usos de `TACTIC_LABEL` que chegam à tela
(`commentary.ts:290`; nas telas da UI isso já foi feito).

## src/engine/moves.ts (`SPECIAL_EXPLAIN`: o que cada golpe especial faz no futsal)

| Linha | PT | EN proposto |
| --- | --- | --- |
| 51 | `Reação: na primeira vez que receber um golpe ou carrinho, devolve no atacante (1 vez por partida).` | `Counter: the first time it takes a move or a slide tackle, it hits the attacker back (once per match).` |
| 52 | `Névoa: tira status e reforços/enfraquecimentos de todo mundo em volta (dos dois times).` | `Haze: removes status conditions and stat changes from everyone nearby (both teams).` |
| 53 | `O time fica imune a enfraquecimentos por 12 segundos.` | `The team can't have its stats lowered for 12 seconds.` |
| 54 | `Some e reaparece em outro ponto da quadra: foge da marcação.` | `Vanishes and reappears elsewhere on the court: escapes its marker.` |
| 55 | `Repete o último golpe que o rival usou.` | `Repeats the last move the rival used.` |
| 56 | `Copia o último golpe que o rival usou.` | `Copies the last move the rival used.` |
| 57 | `Balança o dedo e solta um golpe aleatório!` | `Waggles a finger and unleashes a random move!` |
| 58 | `Cria um boneco que aguenta o próximo golpe ou carrinho no lugar dele (custa um pouco de fôlego).` | `Makes a substitute that takes the next move or slide tackle in its place (costs a little stamina).` |
| 59 | `Planta uma semente no rival: o fôlego dele escorre aos poucos para quem usou (Planta é imune).` | `Plants a seed on the rival: its stamina slowly drains to the user (Grass types are immune).` |
| 60 | `Aguenta firme: fica mais forte na dividida e o próximo carrinho sai bem mais forte.` | `Endures: stronger in challenges, and the next slide tackle comes out much stronger.` |
| 61 | `Fica com raiva: chute e força sobem por 12 segundos.` | `Gets angry: Shooting and Physical go up for 12 seconds.` |
| 62 | `Muda de tipo para se adaptar: tira os enfraquecimentos e melhora tudo um pouco.` | `Changes type to adapt: removes stat drops and slightly improves everything.` |
| 63 | `Trava um golpe que o rival mais perto ainda tinha para usar.` | `Disables a move the nearest rival still had left to use.` |
| 64 | `Rugido que assusta: empurra e atordoa os rivais em volta.` | `A scary roar: pushes back and stuns nearby rivals.` |
| 65 | `Ventania que empurra para longe os rivais em volta.` | `A gust that blows nearby rivals away.` |
| 66 | `Pula e espirra água: fica difícil de desarmar por um instante (mas é só isso mesmo).` | `Flops and splashes: hard to tackle for a moment (and that's really all).` |
| 67 | `Vira uma cópia do rival mais perto: pega os atributos melhores dele por 12 segundos.` | `Becomes a copy of the nearest rival: takes its better attributes for 12 seconds.` |

Sugestão: chave `common.specialExplain` (pt idêntico ao motor) e usar na tela via `t()`; o outro trabalho
pode mudar esses textos, então copiar o PT depois do merge.

## src/engine/cup.ts (clubes e fases) — FEITO

Conferido depois do merge: os nomes dos clubes e das fases do motor continuam iguais às chaves de
`common.club` / `common.stage` (PT idêntico, EN `Pewter Boulders`, `Indigo League`, `Round of 16`...). O save
segue guardando o nome em português; `clubName()` / `stageName()` traduzem na exibição (Reward.tsx inclusive).

`city` (`Pewter`, `Indigo Plateau`...) já está em inglês oficial e funciona como id.

Ginásios e líderes (nomes oficiais em inglês, para a MT do ginásio e textos futuros):

| Cidade | Líder | Insígnia | Tipo |
| --- | --- | --- | --- |
| Pewter City | Brock | Boulder Badge | Rock |
| Cerulean City | Misty | Cascade Badge | Water |
| Vermilion City | Lt. Surge | Thunder Badge | Electric |
| Celadon City | Erika | Rainbow Badge | Grass |
| Fuchsia City | Koga | Soul Badge | Poison |
| Saffron City | Sabrina | Marsh Badge | Psychic |
| Cinnabar Island | Blaine | Volcano Badge | Fire |
| Viridian City | Giovanni | Earth Badge | Ground |
| Indigo Plateau | Elite Four (Lorelei, Bruno, Agatha, Lance) | — | — |

## src/store/game-store.ts — FEITO

`stageLabel` saiu (era usado só na Reward.tsx, que agora usa `stageName(fase) || t('reward.cup')`).
`Pallet FC` fica igual nas duas línguas. Fora isso, só o campo `lang` em `Settings`.

## src/ui/screens/Reward.tsx (recompensa depois da vitória) — FEITO

Área nova `reward` (`src/i18n/pt/reward.ts` / `en/reward.ts`), PT byte a byte igual ao texto antigo. Fase com
`stageName`, time eliminado com `clubName`, item com `itemName` / `itemDesc`. A dica (`Tip id="reward-pick"`)
já inclui a frase da MT do ginásio.

## MT do ginásio (src/ui/components/TmTeach.tsx, src/engine/tm.ts) — FEITO

Chaves em `reward.tm`. Nomes oficiais em inglês: `TM34` / `HM02` (`tmLabel(move, 'TM', 'HM')`: o motor
recebe o prefixo da tela, padrão `MT` / `MO`), líderes já oficiais (`From Brock`, `From Lt. Surge`),
fala da Gen 1 ao esquecer: `1, 2 and… Poof!` + `X forgot Y! And… X learned Z!`, `not compatible` para
quem não aprende. Descrição do golpe na carta da MT: PT `descPt`, EN `moveDesc` (texto oficial curto).
O selo `TaughtMark` (carta e painel da partida) mostra `TM` / título `Taught by TM`.

## src/ui/golpedex/golpedex-data.ts — FEITO

`ALL_ROWS` continua com `descPt` (é o texto em PT); a tela (`MoveLab.tsx`) já mostra `moveDesc(row.id)` em
inglês. Nada mais a fazer.

## Sem texto na tela (nada a fazer)

`src/engine/match.ts`, `src/engine/controllers/ai-controller.ts`, `src/engine/rewards.ts`,
`src/engine/instance.ts`, `src/engine/evolution.ts`, `src/game/move-fx.ts` (o helper `text()` não é usado
com texto em PT). Nomes de Pokémon, golpes, habilidades e itens que esses arquivos mandam para a tela já
são os oficiais em inglês.

`src/engine/tm.ts` (MT do ginásio): feito, ver a seção da MT acima.

## Fora das áreas restritas

Os dois textos de `src/game/cinematics.ts:271` (" no chute" / " usou") já foram traduzidos neste passo
(`match.castShot` / `match.castUsed`). `animation-manager.ts` e `court.ts`: sem texto na tela.

Ficaram de fora de propósito (só aparecem em telas de desenvolvimento ou nunca chegam ao jogador):

| Onde | PT | EN proposto |
| --- | --- | --- |
| src/ui/components/PokeCard2.tsx:31 (`VARIANT_LABEL`, só na galeria `?cards=1`) | Figurinha Holo, TCG de futsal, Holo clássico, Arco-íris, Galáxia, Radiante, Dourado | Holo Sticker, Futsal TCG, Classic Holo, Rainbow, Galaxy, Radiant, Gold |
| src/App.tsx:24 (`?demo=crash`) | Teste do aviso de erro (?demo=crash) | Error notice test (?demo=crash) |
| src/ui/screens/PositionLab.tsx, CardGallery.tsx, dev-demo.ts, trailer-scenes.ts | ferramentas de dev | (não traduzir) |

## Depois do merge, além das tabelas acima

- `SPECIAL_EXPLAIN` (moves.ts): hoje o painel da carta (`CardModal.tsx`, função `specialExplain`) e a Golpedex
  (`MoveLab.tsx`) mostram em inglês a descrição oficial curta do golpe (`moveDesc`) ou a explicação genérica do
  tipo de golpe (`stats.lab.kind`). Com o mapa EN por id (tabela de moves.ts acima) é só trocar nesses dois lugares.
- Combos de sinergia: `MatchScene.ts` (~1301) e `commentary.ts` (~259) usam `link.name` / `link.combo` do motor;
  trocar por `linkText(id)` (já traduzido em `common.link`).
- ~~Reward.tsx: usar `stageName()` no lugar de `stageLabel()`, `clubName()` para o time eliminado, `itemName/itemDesc`.~~ Feito.
- Nome da Golpedex em inglês: **Movedex** (Home, Ajuda e título da tela já usam).

## Resumo

Feito depois do merge: Reward.tsx (21 + 5 textos novos da MT), MT do ginásio (TmTeach.tsx e tm.ts, ~40),
cup.ts (14, só conferência), game-store.ts (2), golpedex-data.ts (1). Falta só o que é do trabalho dos efeitos
dos golpes no motor:

| Arquivo | Textos |
| --- | --- |
| src/ui/commentary.ts | 79 |
| src/game/scenes/MatchScene.ts | 43 |
| src/engine/moves.ts | 17 |
| src/engine/state.ts | 4 |
| **Total pendente** | **143** |
