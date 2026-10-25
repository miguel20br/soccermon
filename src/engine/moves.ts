import levelMoves from '../data/level-moves.json';
import type { AttrKey } from './attributes';
import { MOVES, type MoveData, SPECIES, type Species } from './data';
import { SIGNATURE } from './signature-moves';

/**
 * Como cada golpe vira uma ação de futsal.
 * - strike:  dano físico → chute potente (com bola) ou carrinho forte (sem bola)
 * - blast:   dano especial → finalização de longe / chute colocado
 * - burst:   prioridade ou +Speed → arrancada
 * - buff:    +Atk/Def/SpA/SpD → melhora atributos por um tempo
 * - debuff:  baixa stat do rival próximo
 * - status:  paralisia/sono/veneno/confusão no rival próximo
 * - heal:    recupera fôlego
 * - flavor:  não faz nada útil (Splash!) — só narração
 */
export type MoveKind = 'strike' | 'blast' | 'burst' | 'buff' | 'debuff' | 'status' | 'heal' | 'flavor' | 'special';

/**
 * Golpes com efeito próprio no futsal (motor: match.ts → specialMove). Antes eram "enfeite" e não faziam nada.
 * - counter: devolve, 1 vez, o próximo golpe ou carrinho que receber (reação automática)
 * - haze: névoa que tira status e reforços/enfraquecimentos de todo mundo em volta
 * - mist: o time fica imune a enfraquecimentos por um tempo
 * - teleport: some e reaparece em outro ponto da quadra (foge da marcação)
 * - mirrormove: repete o último golpe que o rival usou; mimic: copia e fica com ele até o fim da partida
 * - metronome: um golpe aleatório
 * - substitute: um boneco aguenta o próximo carrinho ou golpe no lugar dele
 * - leechseed: semente que suga o fôlego do rival aos poucos para quem usou
 */
export const SPECIAL_MOVES = new Set([
    'bide',
    'rage',
    'conversion',
    'disable',
    'roar',
    'whirlwind',
    'splash',
    'transform',
    'counter',
    'haze',
    'mist',
    'teleport',
    'mirrormove',
    'mimic',
    'metronome',
    'substitute',
    'leechseed',
]);

/**
 * Traços: o "jeito" de cada golpe da Gen 1 traduzido em ação de futsal (12 famílias da proposta de golpes).
 * O `kind` continua mandando no básico (a IA e a UI dependem dele); os traços mudam o que acontece em campo.
 * Valores ajustáveis ficam todos em MOVE_TUNING.
 */
export type Trait =
    // F1 área: pega todos os rivais em volta (areaAll: os companheiros também)
    | 'area'
    | 'areaAll'
    // F2 crítico (Focus Energy garante o próximo)
    | 'crit'
    | 'focus'
    // F3 carga (chargeArmor: não pode ser desarmado carregando) e Hyper Beam sem recarga quando faz gol
    | 'charge'
    | 'chargeArmor'
    | 'noRechargeOnGoal'
    // F4 some do mapa
    | 'fly'
    | 'dig'
    // F5 prioridade / arrancada longa
    | 'priority'
    | 'longBurst'
    // F6 mira: nunca erra, fura o 1º bloqueio, por cima, tira a mira do rival
    | 'sureHit'
    | 'pierce'
    | 'lob'
    | 'blind'
    | 'smoke'
    // F7 dano fixo
    | 'fixed'
    | 'halfEnergy'
    | 'throw'
    | 'randomPower'
    | 'heavyTrip'
    // F8 multi-acerto, rebote e alcance
    | 'multi2'
    | 'multi25'
    | 'rebound'
    | 'reach'
    // F9 prender
    | 'wrap'
    | 'clamp'
    | 'fireRing'
    | 'squeeze'
    // F10 contador que cresce
    | 'toxic'
    | 'rage'
    | 'bide'
    // F11 esquiva e muro
    | 'clones'
    | 'minimize'
    | 'melt'
    | 'shell'
    | 'curl'
    | 'wall'
    | 'stompMini'
    // F12 controle de campo
    | 'flee'
    | 'blowBall'
    | 'bulldoze'
    | 'typeCopy'
    | 'teamHeal'
    | 'coins';

export const MOVE_TRAITS: Record<string, Trait[]> = {
    // F1
    acid: ['area'],
    blizzard: ['area'],
    bubble: ['area'],
    growl: ['area'],
    leer: ['area'],
    poisongas: ['area'],
    razorleaf: ['area', 'crit'],
    razorwind: ['area', 'charge', 'crit'],
    rockslide: ['area'],
    stringshot: ['area'],
    swift: ['area', 'sureHit'],
    tailwhip: ['area'],
    screech: ['area'],
    rollingkick: ['area'],
    earthquake: ['areaAll'],
    surf: ['areaAll'],
    // F2
    slash: ['crit'],
    karatechop: ['crit'],
    crabhammer: ['crit'],
    skyattack: ['charge', 'crit'],
    focusenergy: ['focus'],
    // F3
    solarbeam: ['charge'],
    skullbash: ['charge', 'chargeArmor'],
    hyperbeam: ['noRechargeOnGoal'],
    // F4
    fly: ['fly'],
    dig: ['dig'],
    // F5
    quickattack: ['priority'],
    agility: ['longBurst'],
    // F6
    drillpeck: ['pierce'],
    cut: ['pierce'],
    eggbomb: ['lob'],
    sandattack: ['blind'],
    kinesis: ['blind'],
    flash: ['blind', 'area'],
    smokescreen: ['smoke'],
    // F7
    sonicboom: ['fixed'],
    dragonrage: ['fixed'],
    nightshade: ['fixed'],
    seismictoss: ['fixed', 'throw'],
    psywave: ['randomPower'],
    superfang: ['halfEnergy'],
    lowkick: ['heavyTrip'],
    // F8
    doublekick: ['multi2'],
    twineedle: ['multi2'],
    bonemerang: ['multi2', 'rebound', 'reach'],
    // Slam: cauda longa ou vinha (Pikachu, Tangela, Dratini...): desarme de longe
    slam: ['reach'],
    furyattack: ['multi25'],
    furyswipes: ['multi25'],
    doubleslap: ['multi25'],
    cometpunch: ['multi25'],
    barrage: ['multi25', 'rebound'],
    pinmissile: ['multi25', 'rebound'],
    spikecannon: ['multi25', 'rebound'],
    vinewhip: ['reach'],
    boneclub: ['reach'],
    rockthrow: ['reach'],
    // F9
    wrap: ['wrap', 'reach'],
    bind: ['wrap', 'reach'],
    clamp: ['clamp'],
    firespin: ['fireRing'],
    constrict: ['squeeze'],
    // F10
    toxic: ['toxic'],
    rage: ['rage'],
    bide: ['bide'],
    // F11
    doubleteam: ['clones'],
    minimize: ['minimize'],
    acidarmor: ['melt'],
    withdraw: ['shell'],
    defensecurl: ['curl'],
    // Harden: na Gen 1 era igual ao Defense Curl e ao Withdraw (Def +1)
    harden: ['curl'],
    barrier: ['wall'],
    stomp: ['stompMini'],
    // F12
    roar: ['flee'],
    whirlwind: ['blowBall'],
    gust: ['blowBall'],
    strength: ['bulldoze'],
    conversion: ['typeCopy'],
    softboiled: ['teamHeal'],
    payday: ['coins'],
};

export const hasTrait = (moveId: string | null | undefined, t: Trait): boolean =>
    !!moveId && (MOVE_TRAITS[moveId]?.includes(t) ?? false);

/**
 * Números das 12 famílias num lugar só (sugestões da proposta; ajustar aqui olhando o `npm run calibrate`).
 * Tempos em segundos, distâncias em metros, fatores multiplicam.
 */
export const MOVE_TUNING = {
    // F1 área
    areaRadius: 4,
    /** Rolling Kick: giro curto. Poison Gas: nuvem. */
    spinRadius: 2,
    gasRadius: 3,
    /** Cada vítima de golpe em área leva esta fração do efeito de um golpe num alvo só. */
    areaShare: 0.6,
    /** Leer: a encarada trava os rivais um instante. */
    leerFreeze: 0.3,
    // F2 crítico
    critChance: 0.2,
    /** Chance extra por pace (Gen 1: o crítico vinha da Speed). */
    critPace: 0.15,
    critSpeed: 1.25,
    critAim: 1.4,
    /** Focus Energy "bugado" da Gen 1: às vezes falha. */
    focusBugChance: 1 / 16,
    // F3 carga
    chargeTime: 0.6,
    chargePower: 1.3,
    // F4 voo / buraco
    airTime: 0.8,
    /** Com a bola, o voo/buraco leva a bola tantos metros rumo ao gol antes do chute (era 4: virava gol fácil). */
    airCarry: 2,
    airPounceRange: 8,
    // F5 prioridade
    quickRange: 3.3,
    quickDash: 2,
    burstTime: 2.5,
    agilityTime: 5,
    // F6 mira
    sureHitAim: 0.6,
    lobGkReach: 0.8,
    /** Velocidade que o goleiro "sente" num chute por cobertura (a bola vem devagar, mas caindo). */
    lobFeel: 18,
    /** Erro do chute/passe do alvo multiplicado por `factor` durante `t` s (`once`: só o próximo chute). */
    blind: {
        sandattack: { factor: 2, t: 6, once: false },
        kinesis: { factor: 2.5, t: 10, once: true },
        flash: { factor: 1.6, t: 5, once: false },
    } as Record<string, { factor: number; t: number; once: boolean }>,
    flashRadius: 7,
    smokeRadius: 3,
    smokeTime: 5,
    smokeAim: 1.8,
    // F7 dano fixo: velocidade do chute (m/s) e atordoamento sem bola (s)
    fixedShot: { sonicboom: 20, dragonrage: 24, nightshade: 23, seismictoss: 22 } as Record<string, number>,
    fixedStun: { sonicboom: 0.6, dragonrage: 0.8, nightshade: 0.8, seismictoss: 1 } as Record<string, number>,
    psywaveMin: 0.5,
    psywaveMax: 1.5,
    superFang: 0.5,
    throwMeters: 3,
    /** Low Kick: segundos no chão por kg (Snorlax, 460 kg, fica ~2 s). */
    tripPerKg: 0.0035,
    tripMax: 2,
    // F8 multi-acerto e alcance
    multiFalloff: 0.85,
    reboundChance: 0.5,
    /** Bumerangue sempre volta. */
    reboundAlways: ['bonemerang'],
    reachRange: 2.8,
    // F9 prender
    wrapTime: 1.2,
    clampHold: 1,
    fireRadius: 2,
    fireTime: 4,
    squeezeSlow: 0.6,
    squeezeTime: 2,
    // F10 contador
    toxicTime: 12,
    toxicMax: 3,
    rageTime: 15,
    rageStep: 0.05,
    rageMax: 3,
    bideTime: 3,
    bideRadius: 3.5,
    // F11 esquiva e muro
    decoys: 2,
    /** Os clones do Double Team somem depois de tantos segundos (ok do Miguel: 15 s). */
    decoyTime: 15,
    minimizeTime: 4,
    minimizeDodge: 0.6,
    meltTime: 3,
    shellTime: 1.5,
    shellSlow: 0.6,
    curlTime: 12,
    wallTime: 3,
    wallRadius: 1.3,
    // F12 controle de campo
    fleeRange: 5,
    fleeTime: 1.6,
    blowSpeed: 9,
    bulldoze: 2.5,
    typeCopyTime: 12,
    teamHealRadius: 8,
    // goleiro defende com golpe de ataque: goleiro +25% × força do golpe por 1,2 s
    gkSaveBoost: 0.25,
    gkSaveTime: 1.2,
    coinRadius: 3,
    coinStun: 0.4,
    // reforço e enfraquecimento: fator por estágio da Gen 1 e duração
    buffStep: 0.07,
    buffTime: 12,
    debuffStep: 0.08,
    debuffTime: 10,
    /** Cura (Recover, Soft-Boiled...): fôlego = base + força × golpe. Rest enche tudo. */
    healBase: 0.1,
    healPower: 0.3,
    // o preço dos golpes fortíssimos (DRAWBACK)
    recoilEnergy: 0.04,
    crashEnergy: 0.08,
    crashStun: 0.6,
    rampageChance: 0.5,
    rechargeStun: 0.9,
    faintEnergy: 0.15,
    faintStun: 1.6,
    /** Raio da explosão (Gen 1: Explosion 170 × Self-Destruct 130). */
    blastRadius: { explosion: 4, selfdestruct: 3 } as Record<string, number>,
    /** Nocaute que acerta: segundos no chão. */
    ohkoStun: 2.2,
};

/** Atributos que cada estágio da Gen 1 mexe em campo. */
export const BOOST_TO_ATTR: Record<string, AttrKey[]> = {
    atk: ['shooting', 'strength'],
    def: ['tackling', 'strength'],
    spa: ['passing', 'shooting'],
    spd: ['positioning'],
    spe: ['pace'],
    accuracy: ['passing'],
    evasion: ['dribble'],
};

/** Quanto dura cada status (s). */
export const STATUS_DURATION: Record<string, number> = {
    par: 6,
    slp: 2.5,
    psn: 10,
    brn: 8,
    frz: 2.5,
    confusion: 4,
    infatuation: 1.5,
};

/**
 * Reforço próprio do golpe, no lugar do dado: Amnesia é o Special +2 da Gen 1 (ataque e defesa especial juntos);
 * as paredes não sobem atributo (o efeito delas é a parede).
 */
const SELF_BOOSTS: Record<string, Partial<Record<string, number>>> = {
    amnesia: { spa: 2, spd: 2 },
    lightscreen: {},
    reflect: {},
};
/** O que o golpe de reforço sobe (sem dado: Focus Energy e companhia sobem chute/força). */
export const selfBoostsOf = (moveId: string): Partial<Record<string, number>> =>
    SELF_BOOSTS[moveId] ?? MOVES[moveId]?.selfBoosts ?? { atk: 1 };

/** Secundário sorteado: Tri Attack queima, congela ou paralisa (Gen 2 em diante). */
export const SECONDARY_PICK: Record<string, StatusKind[]> = { triattack: ['brn', 'frz', 'par'] };

/**
 * O que cada golpe faz no futsal (os especiais e os que ganharam traço). Os outros usam o texto do tipo.
 * Fica em português aqui; o inglês está em src/i18n/en/move-explain.ts (mesmas chaves, cobradas pelo tsc) e a
 * tela escolhe pelo idioma com `moveExplain()`. O motor não lê nada disso.
 */
const EXPLAIN = {
    counter: 'Reação: na primeira vez que receber um golpe ou carrinho, devolve no atacante (1 vez por partida).',
    haze: 'Névoa: tira status e reforços/enfraquecimentos de todo mundo em volta (dos dois times).',
    mist: 'O time fica imune a enfraquecimentos por 12 segundos.',
    teleport: 'Some e reaparece em outro ponto da quadra: foge da marcação.',
    mirrormove: 'Repete o último golpe que o rival usou.',
    mimic: 'Copia o último golpe que o rival usou e fica com ele até o fim da partida.',
    metronome: 'Balança o dedo e solta um golpe aleatório!',
    substitute: 'Cria um boneco que aguenta o próximo golpe ou carrinho no lugar dele (custa um pouco de fôlego).',
    leechseed: 'Planta uma semente no rival: o fôlego dele escorre aos poucos pra quem usou (Planta é imune).',
    bide: 'Aguenta firme 3 s e depois solta uma onda que empurra e atordoa quem está perto: quanto mais apanhou, mais forte.',
    rage: 'Fúria por 15 s: chute e força sobem, e cada carrinho ou golpe que sofre deixa ainda mais forte (até 3 vezes).',
    conversion: 'Copia o tipo do rival mais perto por 12 s (muda a vantagem de tipo) e tira os enfraquecimentos.',
    disable: 'Trava um golpe que o rival mais perto ainda tinha pra usar.',
    roar: 'Rugido: o rival mais perto foge de volta pro campo dele e larga a bola.',
    whirlwind: 'Ventania que empurra os rivais em volta e sopra a bola solta pra longe.',
    splash: 'Pula e espirra água: fica difícil de desarmar por um instante (mas é só isso mesmo).',
    transform:
        'Vira uma cópia do rival mais perto: pega os atributos melhores dele por 12 segundos. (O Ditto já entra transformado pela habilidade Impostor.)',
    // F1 área
    acid: 'Com a bola: chute colocado. Sem a bola: jato de ácido em todos os rivais a 4 m.',
    blizzard:
        'Com a bola: chute colocado que pode congelar o goleiro. Sem a bola: nevasca em todos os rivais a 4 m, com chance de congelar.',
    bubble: 'Com a bola: chute colocado. Sem a bola: bolhas em todos os rivais a 4 m (podem deixar lentos).',
    growl: 'Rugido em área: chute e força de todos os rivais a 4 m caem.',
    leer: 'Encarada em área: os rivais a 4 m travam um instante e desarmam pior.',
    tailwhip: 'Rabinho em área: desarme e força de todos os rivais a 4 m caem.',
    screech: 'Grito em área: desarme e força dos rivais a 4 m caem bastante.',
    stringshot: 'Teia em área: todos os rivais a 4 m ficam lentos.',
    poisongas: 'Nuvem de gás: tenta envenenar todos os rivais a 3 m.',
    rockslide: 'Com a bola: chute forte. Sem a bola: chuva de pedras em todos os rivais a 4 m, que podem hesitar.',
    rollingkick: 'Com a bola: chute forte. Sem a bola: chute giratório que derruba todo mundo a 2 m.',
    earthquake:
        'Com a bola: chute fortíssimo. Sem a bola: tremor de 4 m que derruba TODO MUNDO em volta, até companheiro.',
    surf: 'Com a bola: chute colocado. Sem a bola: onda que empurra todo mundo a 4 m, até companheiro.',
    swift: 'Estrelas que nunca erram: o chute não pode ser bloqueado por jogador de linha (só o goleiro). Sem a bola, acerta todos os rivais a 4 m.',
    razorleaf: 'Folhas afiadas: chute com chance alta de crítico. Sem a bola, corta todos os rivais a 4 m.',
    razorwind:
        'Carrega 0,6 s parado e solta lâminas de vento: chute com crítico fácil, ou todos os rivais a 4 m sem a bola. Se levar carrinho carregando, perde o golpe.',
    // F2 crítico
    slash: 'Corte com crítico fácil: o chute sai mais forte e certeiro; o carrinho crítico ganha direto.',
    karatechop: 'Golpe de caratê com crítico fácil: chute mais forte e certeiro; carrinho crítico ganha direto.',
    crabhammer: 'Martelada com crítico fácil: chute fortíssimo; carrinho crítico ganha direto.',
    skyattack:
        'Carrega 0,6 s brilhando e sai o chute mais forte do jogo, com crítico fácil. Se levar carrinho carregando, perde o golpe.',
    focusenergy:
        'Concentra: o próximo chute ou carrinho é crítico garantido (às vezes falha, como o Focus Energy bugado da Gen 1).',
    // F3 carga
    solarbeam:
        'Carrega 0,6 s parado juntando sol e solta o chute mais forte do jogo. Se levar carrinho carregando, perde o golpe.',
    skullbash: 'Abaixa a cabeça 0,6 s (ninguém tira a bola dele nesse tempo) e solta uma cabeçada fortíssima.',
    hyperbeam: 'Raio fortíssimo, mas fica parado recarregando depois. Se fizer gol, não recarrega (como na Gen 1).',
    // F4 some do mapa
    fly: 'Voa 0,8 s (ninguém alcança): com a bola, passa por cima da marcação e finaliza; sem a bola, cai em cima de quem conduz e dá o bote.',
    dig: 'Cava 0,8 s (ninguém alcança): com a bola, reaparece mais à frente e finaliza; sem a bola, sai do chão embaixo de quem conduz e dá o bote.',
    // F5 prioridade
    quickattack:
        'Prioridade: sem a bola, avança 2 m e desarma na hora, sem esperar; com a bola, arrancada e chute ou passe de primeira.',
    agility: 'Arrancada longa: fica bem mais veloz por 5 segundos.',
    // F6 mira
    drillpeck: 'Broca: chute forte que fura o primeiro bloqueio no caminho.',
    cut: 'Corte: chute que fura o primeiro bloqueio; o carrinho não perde força por trás.',
    eggbomb: 'Chute de cobertura: a bola vai por cima dos bloqueios e o goleiro alcança menos (mas é impreciso).',
    sandattack: 'Areia no olho: o rival mais perto chuta e passa bem torto por 6 s.',
    kinesis: 'Entorta a colher: o próximo chute do rival mais perto sai bem torto.',
    flash: 'Clarão: todos os rivais a 7 m chutam e passam torto por 5 s.',
    smokescreen: 'Cortina de fumaça no chão (3 m, 5 s): chute e passe de dentro dela saem tortos, pros dois times.',
    // F7 dano fixo
    sonicboom:
        'Dano fixo: chute de velocidade fixa (não depende do atributo nem do tipo). Sem a bola, estrondo que atordoa o rival um tempo fixo (Fantasma é imune).',
    dragonrage:
        'Dano fixo: chute de velocidade fixa alta, sem vantagem de tipo do goleiro. Sem a bola, atordoa o rival um tempo fixo.',
    nightshade:
        'Dano fixo: chute de velocidade fixa, ignora o tipo do goleiro. Sem a bola, atordoa um tempo fixo e pega até Normal.',
    seismictoss:
        'Arremesso: no carrinho, joga o rival 3 m e deixa 1 s no chão, sem depender da força. Com a bola, chute de velocidade fixa.',
    psywave: 'Onda psíquica de força sorteada: pode sair uma bomba ou uma bola murcha.',
    superfang: 'Presa: o carrinho que acerta tira metade do fôlego do rival.',
    lowkick: 'Rasteira: derruba mais quem é pesado (um Snorlax fica uns 2 s no chão).',
    // F8 multi-acerto e alcance
    doublekick: 'Dois chutes: sem a bola, duas tentativas de desarme seguidas.',
    twineedle: 'Duas agulhadas: duas tentativas de desarme, cada uma pode envenenar.',
    bonemerang:
        'Bumerangue: desarme de longe (2,8 m), duas tentativas; o chute, se o goleiro espalmar ou alguém bloquear, volta pro pé dele.',
    furyattack: 'De 2 a 5 tentativas de desarme seguidas (cada uma mais fraca).',
    furyswipes: 'De 2 a 5 arranhões: tentativas de desarme seguidas (cada uma mais fraca).',
    doubleslap: 'De 2 a 5 tapas: tentativas de desarme seguidas (cada uma mais fraca).',
    cometpunch: 'De 2 a 5 socos: tentativas de desarme seguidas (cada uma mais fraca).',
    barrage: 'De 2 a 5 tentativas de desarme; o chute pode voltar pro pé dele se for defendido.',
    pinmissile: 'De 2 a 5 tentativas de desarme; o chute pode voltar pro pé dele se for defendido.',
    spikecannon: 'De 2 a 5 tentativas de desarme; o chute pode voltar pro pé dele se for defendido.',
    vinewhip: 'Chicote: desarme de longe (2,8 m).',
    slam: 'Pancada com a cauda ou a vinha: com a bola, chute forte; sem a bola, desarme de longe (2,8 m).',
    boneclub: 'Osso na mão: desarme de longe (2,8 m), que pode fazer o rival hesitar.',
    rockthrow: 'Pedrada: desarme de longe (2,8 m).',
    // F9 prender
    wrap: 'Enrola de longe (2,8 m): quem conduz e quem usou ficam presos 1,2 s e a bola sobra.',
    bind: 'Amarra de longe (2,8 m): quem conduz e quem usou ficam presos 1,2 s e a bola sobra.',
    clamp: 'Fecha a concha: rouba a bola e ninguém tira dele por 1 s.',
    firespin: 'Anel de fogo no chão (2 m, 4 s): queima e deixa lento o rival que passar.',
    constrict: 'Aperta: o rival fica lento 2 s.',
    // F10 contador que cresce
    toxic: 'Veneno que piora: o fôlego escorre cada vez mais rápido (até 3x) por 12 s.',
    // F11 esquiva e muro
    doubleteam: 'Dois clones: os próximos 2 carrinhos ou golpes nele acertam um clone.',
    minimize: 'Fica pequenininho 4 s: muito difícil de desarmar (Stomp ignora).',
    acidarmor: 'Derrete: por 3 s os carrinhos passam direto por ele.',
    withdraw: 'Entra no casco 1,5 s: ninguém tira a bola dele, mas anda devagar.',
    defensecurl: 'Enrola: o próximo carrinho que sofrer não tira a bola.',
    harden: 'Endurece: o próximo carrinho que sofrer não tira a bola.',
    lightscreen: 'Parede de luz: por 15 s, golpes especiais e de status contra o seu time pegam pela metade.',
    reflect: 'Parede: por 15 s, os carrinhos contra o seu time saem 30% mais fracos.',
    barrier: 'Muro invisível 3 s na frente dele: bloqueia o próximo chute que passar perto.',
    stomp: 'Pisão: com a bola, chute forte; sem a bola, desarme que pode fazer hesitar e ignora quem está pequenininho (Minimize).',
    // F12 controle de campo
    gust: 'Com a bola: chute colocado. Sem a bola: rajada que empurra o rival e sopra a bola solta pra longe.',
    strength: 'Carrinho-trator: quando ganha a dividida, empurra o rival 2,5 m.',
    softboiled: 'Cura o fôlego dele e o do companheiro mais cansado a 8 m.',
    dreameater:
        'Com a bola: chute colocado. Sem a bola: suga o fôlego do rival mais perto; se tiver alguém dormindo, devora o sonho dele e suga o dobro.',
    payday: 'Chuva de moedas: com a bola, chute; sem a bola, os rivais a 3 m param um instante pra olhar.',
};

/** Golpes que têm explicação própria (a tradução em inglês precisa ter todas). */
export type ExplainMoveId = keyof typeof EXPLAIN;
export const MOVE_EXPLAIN: Readonly<Record<string, string>> = EXPLAIN;

/** Compatibilidade: a carta e a Golpedex leem este nome. */
export const SPECIAL_EXPLAIN = MOVE_EXPLAIN;

/** Golpes que prendem o alvo (fica lento e atordoado um instante). */
export const TRAP = new Set(['bind', 'wrap', 'clamp', 'firespin', 'constrict']);
/** Nocaute: erram muito (30%), mas quando acertam derrubam o rival por um bom tempo. */
export const OHKO = new Set(['fissure', 'guillotine', 'horndrill']);
/**
 * Golpes fortíssimos com preço:
 * - faint (Explosion/Self-Destruct): explode em área e quem usou fica no chão quase sem fôlego
 * - recharge (Hyper Beam): fica parado recarregando
 * - recoil (Double-Edge, Take Down, Submission): perde fôlego no impacto
 * - rampage (Thrash, Petal Dance): pode ficar confuso depois
 * - crash (Jump Kick, High Jump Kick): se errar, se machuca
 */
export const DRAWBACK: Record<string, 'faint' | 'recharge' | 'recoil' | 'rampage' | 'crash'> = {
    explosion: 'faint',
    selfdestruct: 'faint',
    hyperbeam: 'recharge',
    doubleedge: 'recoil',
    takedown: 'recoil',
    submission: 'recoil',
    thrash: 'rampage',
    petaldance: 'rampage',
    jumpkick: 'crash',
    highjumpkick: 'crash',
};

/** Golpes que sugam o fôlego do alvo para quem usa (fração de fôlego). */
export const DRAIN: Record<string, number> = { absorb: 0.06, megadrain: 0.1, leechlife: 0.07, dreameater: 0.14 };

export type StatusKind = 'par' | 'slp' | 'psn' | 'brn' | 'frz' | 'confusion';

export interface MoveProfile {
    id: string;
    kind: MoveKind;
    data: MoveData;
    /** Intensidade 0..1 usada nos efeitos (poder normalizado ou soma de boosts). */
    strength: number;
    uses: number;
    status: StatusKind | null;
}

const STATUS_MOVES: Record<string, StatusKind> = {
    thunderwave: 'par',
    stunspore: 'par',
    glare: 'par',
    sleeppowder: 'slp',
    hypnosis: 'slp',
    sing: 'slp',
    lovelykiss: 'slp',
    spore: 'slp',
    poisonpowder: 'psn',
    poisongas: 'psn',
    toxic: 'psn',
    confuseray: 'confusion',
    supersonic: 'confusion',
};

const FLAVOR = new Set([
    'splash',
    'transform',
    'bide',
    'rage',
    'roar',
    'whirlwind',
    'conversion',
    'focusenergy',
    'disable',
    'payday',
    'doubleteam',
    'minimize',
    'lightscreen',
    'reflect',
    'dig',
    'fly',
    'skyattack',
    'solarbeam',
    'skullbash',
    'razorwind',
    'hyperbeam',
    'selfdestruct',
    'explosion',
    'dreameater',
    'superfang',
    'seismictoss',
    'nightshade',
    'sonicboom',
    'dragonrage',
    'psywave',
    'guillotine',
    'horndrill',
    'fissure',
    'struggle',
]);

// Golpes "especiais" de dois turnos ou suicidas ainda são divertidos como chutes únicos de efeito
const SPECTACULAR: Record<string, MoveKind> = {
    hyperbeam: 'blast',
    solarbeam: 'blast',
    skyattack: 'strike',
    skullbash: 'strike',
    fly: 'strike',
    dig: 'strike',
    selfdestruct: 'strike',
    explosion: 'strike',
    razorwind: 'blast',
    seismictoss: 'strike',
    nightshade: 'blast',
    sonicboom: 'blast',
    dragonrage: 'blast',
    psywave: 'blast',
    superfang: 'strike',
    guillotine: 'strike',
    horndrill: 'strike',
    fissure: 'strike',
    dreameater: 'blast',
    // Pay Day vira chuva de moedas e Metronome um golpe surpresa: eram golpes "inúteis" de dois ícones
    payday: 'blast',
    reflect: 'buff',
    lightscreen: 'buff',
    doubleteam: 'buff',
    minimize: 'buff',
    focusenergy: 'buff',
};

const FIXED_DAMAGE_POWER = 70;
/** Poder de golpes cujo dano nos jogos depende de peso/HP (aqui um valor fixo). */
const POWER_OVERRIDE: Record<string, number> = { lowkick: 60 };

/** Poder efetivo: golpes de vários acertos (Fury Swipes, Pin Missile, Double Kick…) somam os acertos. */
function effectivePower(data: MoveData): number {
    const base = POWER_OVERRIDE[data.id] ?? data.power;
    const hits = Array.isArray(data.multihit) ? 3 : (data.multihit ?? 1);
    return base * hits;
}

export function classifyMove(id: string): MoveProfile {
    const data = MOVES[id];
    if (!data) throw new Error(`Golpe desconhecido: ${id}`);
    let kind: MoveKind;
    let strength: number;
    const status = STATUS_MOVES[id] ?? null;
    const selfBoost = Object.values(data.selfBoosts ?? {}).reduce((s: number, b) => s + Math.max(0, b ?? 0), 0);
    const targetDrop = Object.values(data.targetBoosts ?? {}).reduce((s: number, b) => s + Math.min(0, b ?? 0), 0);

    if (SPECIAL_MOVES.has(id)) {
        kind = 'special';
        strength = 0.6;
    } else if (SPECTACULAR[id]) {
        kind = SPECTACULAR[id];
        strength = kind === 'buff' || kind === 'burst' ? 0.6 : Math.min(1, (data.power || FIXED_DAMAGE_POWER) / 120);
    } else if (status) {
        kind = 'status';
        strength = data.accuracy / 100;
    } else if (FLAVOR.has(id)) {
        kind = 'flavor';
        strength = 0;
    } else if (data.heal) {
        kind = 'heal';
        strength = id === 'rest' ? 1 : 0.6;
    } else if (data.category !== 'Status' && data.priority > 0) {
        kind = 'burst';
        strength = 0.7;
    } else if (OHKO.has(id)) {
        // nocaute: a precisão baixa já é o preço (rolada no motor)
        kind = 'strike';
        strength = 1;
    } else if (data.category === 'Physical') {
        kind = 'strike';
        strength = Math.min(1, effectivePower(data) / 120);
    } else if (data.category === 'Special') {
        kind = 'blast';
        strength = Math.min(1, effectivePower(data) / 120);
    } else if ((data.selfBoosts?.spe ?? 0) > 0) {
        kind = 'burst';
        strength = Math.min(1, selfBoost / 2);
    } else if (selfBoost > 0) {
        kind = 'buff';
        strength = Math.min(1, selfBoost / 2);
    } else if (targetDrop < 0) {
        kind = 'debuff';
        strength = Math.min(1, -targetDrop / 2) * (data.accuracy / 100);
    } else {
        kind = 'flavor';
        strength = 0;
    }

    // golpes são eventos especiais: 1 uso por partida (golpes de PP alto, 2)
    const uses = kind !== 'flavor' && data.pp >= 25 ? 2 : 1;
    return { id, kind, data, strength, uses, status };
}

const PROFILE_CACHE = new Map<string, MoveProfile>();
export function moveProfile(id: string): MoveProfile {
    let p = PROFILE_CACHE.get(id);
    if (!p) {
        p = classifyMove(id);
        PROFILE_CACHE.set(id, p);
    }
    return p;
}

/** TMs genéricos que quase todo Pokémon aprende — valem menos para manter os movesets com cara de cada espécie. */
const GENERIC_TM = new Set([
    'doubleedge',
    'bodyslam',
    'takedown',
    'hyperbeam',
    'skullbash',
    'megakick',
    'megapunch',
    'submission',
    'seismictoss',
    'rage',
    'bide',
    'mimic',
    'doubleteam',
    'substitute',
    'toxic',
    'rest',
    'swift',
    'triattack',
]);
const RISKY = new Set([
    'fly',
    'dig',
    'hyperbeam',
    'explosion',
    'selfdestruct',
    'solarbeam',
    'skullbash',
    'skyattack',
    'razorwind',
]);

const LEVEL_MOVES = levelMoves as Record<string, Record<string, number>>;

/**
 * Até que nível o estágio "costuma" ter chegado: o básico de uma linha fica com os golpes do começo, o do meio
 * com os do meio do caminho, o final com tudo (assim a carta muda quando o Pokémon evolui).
 */
function stageCap(sp: Species): number {
    const evolves = sp.evolvesTo.some((e) => e.id <= 151);
    if (!evolves) return 100;
    return sp.prevo ? 42 : 30;
}

/**
 * O que o golpe faz em campo, além da força, da precisão e do tipo: dois golpes com a mesma chave são "iguais" (Ember e
 * Fire Blast; Thunder e Thunderbolt). Usado para não pôr dois iguais no mesmo moveset.
 */
export function moveBehavior(id: string): string {
    const p = moveProfile(id);
    const sec = p.data.secondary;
    return [
        p.kind,
        (MOVE_TRAITS[id] ?? []).join('+'),
        DRAWBACK[id] ?? '',
        DRAIN[id] ? 'drain' : '',
        TRAP.has(id) ? 'trap' : '',
        OHKO.has(id) ? 'ohko' : '',
        p.status ?? '',
        sec?.status ?? sec?.volatile ?? '',
        sec?.boosts ? Object.keys(sec.boosts).join('/') : '',
        p.kind === 'buff' || p.kind === 'debuff' || p.kind === 'special' ? id : '',
    ].join('|');
}

/**
 * Moveset padrão com cara de "jogo de verdade":
 * 0) golpe-assinatura da espécie (src/engine/signature-moves.ts)
 * 1) melhor golpe STAB da categoria mais forte da espécie (Atk vs SpA)
 * 2) melhor golpe de dano de outro tipo ou outra categoria (cobertura)
 * 3) utilitário: status > arrancada > buff > debuff > cura
 * 4) melhor restante, preferindo um tipo ainda não coberto
 * Em 2 e 4, golpe de mesmo efeito de um que já entrou vale bem menos (sem Flamethrower + Fire Blast).
 * Depois: as trocas decididas com o Miguel (MOVESET_SWAP) e a regra do tipo próprio (1 golpe de cada tipo da espécie,
 * se o learnset da Gen 1 tiver). Espécies com learnset curto (Magikarp, Ditto…) ficam com menos de 4.
 */
/** Quem tem moveset fixo de propósito: o Magikarp é o Magikarp (a graça é evoluir). */
const FIXED_MOVESET: Record<number, string[]> = { 129: ['splash', 'tackle'] };

/**
 * Trocas na mão (sai → entra), decididas com o Miguel em 21/10/2026. Rodam antes da regra do tipo próprio, então
 * uma troca que já põe o tipo que faltava dispensa a regra.
 * - Gengar: o Confuse Ray vira Sludge (exceção fora da Gen 1, `LEARNSET_EXTRA` em data.ts) e o combo Hypnosis →
 *   Dream Eater fica. Sem a linha, a regra do tipo próprio tiraria o Hypnosis e poria o Toxic.
 * - Hitmonchan: os 3 socos ficam e entra o Counter (Lutador, nível 53) no lugar do Agility.
 * - Gyarados: o Splash herdado do Magikarp vira Hyper Beam (nível 52 na Gen 1).
 */
export const MOVESET_SWAP: Readonly<Record<number, Readonly<Record<string, string>>>> = {
    94: { confuseray: 'sludge' },
    107: { agility: 'counter' },
    130: { splash: 'hyperbeam' },
};
/** Fora da regra do tipo próprio: a Butterfree guarda os pós (o único Inseto dela seria String Shot). */
const TYPE_RULE_SKIP = new Set([12]);
/**
 * Fora da regra "sem 2 iguais" (o Miguel não viu a troca ainda): o Ponyta guarda Ember + Fire Blast (a regra daria
 * Toxic) e a Tangela guarda Vine Whip + Slam (os dois com alcance; a regra daria Solar Beam).
 */
const DUP_RULE_SKIP = new Set([77, 114]);

const MOVESET_CACHE = new Map<number, readonly string[]>();

/**
 * Espécies SEM relação não dividem 3 ou 4 golpes do moveset padrão (aprovado pelo Miguel, ENGINE_VERSION 9).
 * Ligado, o `defaultMoveset` usa `uniqueMovesets()`. Ver docs/planos/golpes-revisao.md, seção 8.
 */
export const UNIQUE_MOVESETS = true;

export function defaultMoveset(sp: Species): string[] {
    if (FIXED_MOVESET[sp.id]) return [...FIXED_MOVESET[sp.id]];
    if (UNIQUE_MOVESETS) return [...(uniqueMovesets().get(sp.id) ?? baseMoveset(sp))];
    return [...baseMoveset(sp)];
}

function baseMoveset(sp: Species): readonly string[] {
    let ms = MOVESET_CACHE.get(sp.id);
    if (!ms) {
        ms = buildMoveset(sp);
        MOVESET_CACHE.set(sp.id, ms);
    }
    return ms;
}

const lineRoot = (id: number): number => {
    const p = SPECIES[id - 1]?.prevo;
    return p && p <= 151 ? lineRoot(p) : id;
};

/**
 * Fora da unicidade (Miguel, 21/10/2026), junto com os pares deles: a troca deixaria o Wigglytuff estranho e o Staryu
 * mais fraco. Ficam as 8 trocas aprovadas.
 */
const UNIQUE_SKIP = new Set([40, 120]);

let uniqueCache: Map<number, string[]> | null = null;
/**
 * Regra da unicidade (protótipo): quando duas espécies de linhas evolutivas diferentes dividem 3 ou 4 golpes, a de
 * número maior troca 1 golpe dividido pelo melhor golpe do learnset dela que nenhuma das duas leva. O novo é da mesma
 * classe (dano por dano, status por status), não repete efeito nem tipo de fora, tem nota de pelo menos 90% e, no
 * dano, força de pelo menos 90% e precisão parecida (não tira poder). Nunca sai a assinatura nem o único golpe de um
 * tipo da espécie. Sem troca boa, fica como está. Mesma linha evolutiva parecida não é problema (Miguel, 21/10/2026).
 */
export function uniqueMovesets(): Map<number, string[]> {
    if (uniqueCache) return uniqueCache;
    const mons = SPECIES.filter((sp) => sp.id <= 151 && !FIXED_MOVESET[sp.id] && sp.learnset.length > 1);
    const sets = new Map(mons.map((sp) => [sp.id, [...baseMoveset(sp)]]));
    const shared = (a: string[], b: string[]) => a.filter((m) => b.includes(m));
    const isDamage = (m: string) => ['strike', 'blast'].includes(moveProfile(m).kind);
    for (let pass = 0; pass < 3; pass++) {
        let changed = false;
        for (const a of mons)
            for (const b of mons) {
                if (b.id <= a.id || lineRoot(a.id) === lineRoot(b.id) || UNIQUE_SKIP.has(a.id) || UNIQUE_SKIP.has(b.id))
                    continue;
                const ma = sets.get(a.id)!;
                const mb = sets.get(b.id)!;
                if (shared(ma, mb).length < 3) continue;
                const fix = trySwap(b, mb, ma) ?? trySwap(a, ma, mb);
                if (fix) {
                    sets.set(fix.id, fix.moves);
                    changed = true;
                }
            }
        if (!changed) break;
    }
    function trySwap(sp: Species, mine: string[], other: string[]): { id: number; moves: string[] } | null {
        const { damageScore, utilityScore } = scorer(sp);
        const score = (m: string) => Math.max(damageScore(moveProfile(m)), utilityScore(moveProfile(m)));
        const ownCount = (t: string) => mine.filter((m) => MOVES[m].type === t).length;
        const outs = shared(mine, other)
            .filter((m) => m !== SIGNATURE[sp.id])
            .filter((m) => !(sp.types.includes(MOVES[m].type) && ownCount(MOVES[m].type) === 1))
            .sort((x, y) => score(x) - score(y));
        // não tira poder: dano com força e precisão parecidas (nada de nocaute ou golpe de risco no lugar); utilitário
        // do mesmo jeito (status por status, arrancada por arrancada)
        const weaker = (m: string, out: string) => {
            const [pm, po] = [moveProfile(m), moveProfile(out)];
            if (!isDamage(out)) return pm.kind !== po.kind;
            if ((OHKO.has(m) || RISKY.has(m)) && !OHKO.has(out) && !RISKY.has(out)) return true;
            return pm.strength < 0.9 * po.strength || pm.data.accuracy < po.data.accuracy - 10;
        };
        for (const out of outs) {
            const rest = mine.filter((m) => m !== out);
            let best: string | null = null;
            for (const m of sp.learnset) {
                if (mine.includes(m) || other.includes(m) || isDamage(m) !== isDamage(out)) continue;
                if (rest.some((r) => moveBehavior(r) === moveBehavior(m))) continue;
                const t = MOVES[m].type;
                if (!sp.types.includes(t) && rest.some((r) => MOVES[r].type === t)) continue;
                if (score(m) < 0.9 * score(out) || weaker(m, out)) continue;
                if (!best || score(m) > score(best)) best = m;
            }
            if (best) return { id: sp.id, moves: mine.map((m) => (m === out ? best! : m)) };
        }
        return null;
    }
    uniqueCache = sets;
    return sets;
}

/** As notas que o moveset padrão dá a cada golpe da espécie (dano e utilitário). */
function scorer(sp: Species) {
    const physical = sp.baseStats.atk >= sp.baseStats.spa;
    const levels = LEVEL_MOVES[sp.id] ?? {};
    const cap = stageCap(sp);
    // golpe aprendido por nível tem a cara da espécie; TM (que quase todo mundo aprende) vale menos
    const origin = (p: MoveProfile): number => {
        const lv = levels[p.id];
        if (lv === undefined) return 0.75;
        return lv <= cap ? 1.4 : 0.85;
    };
    const damageScore = (p: MoveProfile): number => {
        if (p.kind !== 'strike' && p.kind !== 'blast') return 0;
        let sc = p.strength * 100 * origin(p);
        if (sp.types.includes(p.data.type)) sc *= 1.6;
        else if (p.data.type === 'Normal') sc *= 0.7;
        if ((p.kind === 'strike') === physical) sc *= 1.2;
        if (GENERIC_TM.has(p.id)) sc *= 0.75;
        if (RISKY.has(p.id)) sc *= 0.55;
        return sc;
    };
    const utilityScore = (p: MoveProfile): number => {
        const generic = (GENERIC_TM.has(p.id) ? 0.6 : 1) * (levels[p.id] !== undefined ? 1.3 : 1);
        switch (p.kind) {
            case 'status':
                return (60 + 25 * p.strength) * generic;
            case 'burst':
                return 65 * generic;
            case 'buff':
                return (40 + 15 * p.strength) * generic;
            case 'debuff':
                return (25 + 10 * p.strength) * generic;
            case 'heal':
                return 30 * generic;
            case 'special':
                return 50 * generic;
            default:
                return 0;
        }
    };
    return { damageScore, utilityScore };
}

function buildMoveset(sp: Species): string[] {
    const profiles = sp.learnset.map(moveProfile);
    const { damageScore, utilityScore } = scorer(sp);
    const chosen: MoveProfile[] = [];
    const best = (score: (p: MoveProfile) => number) => {
        let top: MoveProfile | null = null;
        let topScore = 0;
        for (const p of profiles) {
            if (chosen.includes(p)) continue;
            const sc = score(p);
            if (sc > topScore || (sc === topScore && top && p.id < top.id)) {
                top = p;
                topScore = sc;
            }
        }
        if (top) chosen.push(top);
        return top;
    };
    // golpe de mesmo efeito de um que já entrou vale bem menos
    const dup = (p: MoveProfile) =>
        !DUP_RULE_SKIP.has(sp.id) && chosen.some((c) => moveBehavior(c.id) === moveBehavior(p.id)) ? 0.4 : 1;
    const signature = profiles.find((p) => p.id === SIGNATURE[sp.id]);
    if (signature) chosen.push(signature);
    const first =
        signature && (signature.kind === 'strike' || signature.kind === 'blast') ? signature : best(damageScore);
    best((p) => {
        const sc = damageScore(p);
        if (!first) return sc;
        const sameType = p.data.type === first.data.type;
        const sameKind = p.kind === first.kind;
        return sc * dup(p) * (sameType ? (sameKind ? 0.3 : 0.6) : 1.1);
    });
    // assinatura de suporte (Sing, Glare…) já é o utilitário
    const isUtility = (p: MoveProfile | undefined) => !!p && p.kind !== 'strike' && p.kind !== 'blast';
    if (!isUtility(signature)) best(utilityScore);
    const types = new Set(chosen.map((p) => p.data.type));
    if (chosen.length < 4) {
        best((p) =>
            Math.max(
                damageScore(p) * (types.has(p.data.type) ? 0.5 : 1) * dup(p),
                utilityScore(p) * 0.9,
                p.kind === 'flavor' ? 1 : 0,
            ),
        );
    }
    for (const [out, inn] of Object.entries(MOVESET_SWAP[sp.id] ?? {})) {
        const i = chosen.findIndex((p) => p.id === out);
        if (i >= 0 && sp.learnset.includes(inn)) chosen[i] = moveProfile(inn);
    }
    if (!TYPE_RULE_SKIP.has(sp.id)) ownTypeRule(sp, profiles, chosen, signature, damageScore, utilityScore);
    return chosen.slice(0, 4).map((p) => p.id);
}

/**
 * Regra do tipo próprio (Miguel, 21/10/2026: o Gengar não tinha golpe Venenoso): para cada tipo da espécie sem
 * golpe, entra o golpe do tipo de melhor nota (dano ou utilitário), se o learnset tiver. Sai, nesta ordem: um da
 * mesma classe (dano por dano, utilitário por utilitário), um de efeito repetido, um de tipo de fora repetido, um de
 * tipo de fora, um do tipo próprio repetido. Nunca sai a assinatura nem o único golpe de um tipo da espécie.
 */
function ownTypeRule(
    sp: Species,
    profiles: MoveProfile[],
    chosen: MoveProfile[],
    signature: MoveProfile | undefined,
    damageScore: (p: MoveProfile) => number,
    utilityScore: (p: MoveProfile) => number,
) {
    const isDamage = (p: MoveProfile) => p.kind === 'strike' || p.kind === 'blast';
    const score = (p: MoveProfile) => Math.max(damageScore(p), utilityScore(p));
    const own = (t: string) => sp.types.includes(t as never);
    for (const t of sp.types) {
        if (chosen.some((p) => p.data.type === t)) continue;
        let cand: MoveProfile | null = null;
        for (const p of profiles)
            if (p.data.type === t && !chosen.includes(p) && (!cand || score(p) > score(cand))) cand = p;
        if (!cand) continue;
        const c = cand;
        const count = (ty: string) => chosen.filter((p) => p.data.type === ty).length;
        const rank = (p: MoveProfile) =>
            (isDamage(p) === isDamage(c) ? 100 : 0) +
            (chosen.some((o) => o !== p && moveBehavior(o.id) === moveBehavior(p.id)) ? 40 : 0) +
            (!own(p.data.type) && count(p.data.type) > 1 ? 30 : !own(p.data.type) ? 20 : 10);
        const victims = chosen
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => p !== signature && !(own(p.data.type) && count(p.data.type) === 1))
            .sort((a, b) => rank(b.p) - rank(a.p) || score(a.p) - score(b.p) || b.i - a.i);
        if (victims.length) chosen[victims[0].i] = c;
    }
}
