import { species } from '../engine/data';
import { type PokemonInstance, viewInstance } from '../engine/instance';
import { editionOf, themeOfTypes } from '../engine/specials';
import { dailyDay } from '../store/daily';

/**
 * Plano do walkout final (docs/planos/pesquisas/ut-walkout.md, "Escolha depois dos vídeos lado a lado"): quem ganha
 * qual nível, o roteiro de cada um (horários em ms) e a jogada com bola de cada espécie. Puro (sem Phaser nem React):
 * a cena (`WalkoutScene`), a carta por cima (`WalkoutStage`) e o teste leem daqui.
 */
export type WalkTier = 'raro' | 'muitoraro' | 'especial';

/** Raro = ouro 75–84; muito raro = ouro 85+, Shiny ou Evento; especial = Ícone ou Destaque. Abaixo de 75, nada. */
export function walkTier(edition: string | null, overall: number): WalkTier | null {
    if (edition === 'icone' || edition === 'destaque') return 'especial';
    if (edition === 'shiny' || edition === 'evento' || overall >= 85) return 'muitoraro';
    return overall >= 75 ? 'raro' : null;
}

const TIER_RANK: Record<WalkTier, number> = { raro: 1, muitoraro: 2, especial: 3 };

/**
 * A carta do pacote que ganha o walkout (UT e Mercado da Copa): a de nível mais alto e, no empate, a de nota maior.
 * -1 = nenhuma bate num nível: o pacote abre só com o leque.
 */
export function walkoutPick(cards: readonly PokemonInstance[]): number {
    let best = -1;
    let score = 0;
    cards.forEach((c, i) => {
        const ovr = viewInstance(c).overall;
        const tier = walkTier(editionOf(c), ovr);
        const s = tier ? TIER_RANK[tier] * 1000 + ovr : 0;
        if (s > score) {
            best = i;
            score = s;
        }
    });
    return best;
}

/**
 * Abrir todos: a carta do walkout entre todos os pacotes (`walkoutPick`) e os pacotes na ordem de abrir, com o dela por
 * último (o clímax fecha a sequência; os outros na ordem em que saíram).
 */
export function walkoutLast<T extends { cards: readonly PokemonInstance[] }>(
    packs: readonly T[],
): { packs: T[]; best: PokemonInstance | null } {
    const all = packs.flatMap((p) => p.cards);
    const at = walkoutPick(all);
    const best = at < 0 ? null : all[at];
    const has = (p: T) => !!best && p.cards.includes(best);
    return { packs: [...packs.filter((p) => !has(p)), ...packs.filter(has)], best };
}

/** O roteiro: cada campo é a hora (ms desde o começo) em que a batida entra. */
export interface WalkPlan {
    tier: WalkTier;
    /** cheio = o do nível; curto = o encolhido do dia; calmo = Reduzir movimento. */
    kind: 'cheio' | 'curto' | 'calmo';
    /** Especial que começa prateado (cara de muito raro) e vira a cor da edição no flash. */
    upgrade: boolean;
    /** Continuar aparece. */
    end: number;
    /** Holofotes (acendem um por um a partir de `sky`). */
    spots: number;
    fires: number[];
    /** Chuva de faíscas no fundo. */
    rain: boolean;
    /** O céu acende na cor do nível. */
    sky: number;
    /** Placa da edição (ou do metal) bate no meio e sai em `plateOut`. */
    plate?: number;
    plateOut?: number;
    /** Telões: o tipo, a posição e a câmera de volta pro campo. */
    type?: number;
    pos?: number;
    back?: number;
    /** Portão abre, silhueta "Quem é esse Pokémon?". */
    gate?: number;
    /** Flash: o Pokémon entra com a bola e faz a jogada (dura `body`), depois chuta na tela (~500-600 ms até o vidro). */
    enter: number;
    body: number;
    /** A bola bate no vidro e racha; o vidro quebra logo depois. */
    impact: number;
    /** A carta aparece (gira ou sobe) e a nota conta por `count` ms. */
    card: number;
    count: number;
    /** A foto entra na carta (antes disso ela vem sem a arte). */
    art?: number;
    /** Confete, fogos e o Pokémon pulando. */
    party: number;
}

/** Os efeitos de tipo que revelam a carta ouro (sem edição), um por tipo da Gen 1 + Fada. */
export const FX_TYPES = [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Fairy',
] as const;
export type FxType = (typeof FX_TYPES)[number];

/**
 * O que revela a carta depois do chute na tela: o vidro quebrando só nas edições especiais (03/11); no ouro, o efeito
 * do tipo principal (Normal com um 2º tipo usa o 2º, como o símbolo no fundo da carta: o Pidgeot é Voador).
 */
export function revealOf(edition: string | null, types: readonly string[]): 'vidro' | FxType {
    if (edition) return 'vidro';
    const t = themeOfTypes(types);
    return (FX_TYPES as readonly string[]).includes(t) ? (t as FxType) : 'Normal';
}

/** Pular aparece depois da prévia: ninguém perde a cor. */
export const WALK_SKIP_AT = 1000;
/** O vidro quebra este tanto depois da bola bater. */
export const SHATTER_MS = 280;

type Base = Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'>;

const RARO: Base = {
    end: 5500,
    spots: 1,
    fires: [120],
    rain: false,
    sky: 0,
    plate: 200,
    plateOut: 900,
    type: 900,
    pos: 1500,
    back: 2100,
    enter: 2100,
    body: 1600,
    impact: 4200,
    card: 4550,
    count: 600,
    party: 5000,
};

const MUITO: Base = {
    end: 9350,
    spots: 2,
    fires: [500, 700],
    rain: false,
    sky: 100,
    plate: 800,
    plateOut: 1800,
    type: 1800,
    pos: 2800,
    back: 3800,
    gate: 3800,
    enter: 5000,
    body: 2200,
    impact: 7700,
    card: 8000,
    count: 800,
    party: 8750,
};

const ESPECIAL: Base = {
    end: 14950,
    spots: 4,
    fires: [650, 850, 1050],
    rain: true,
    sky: 600,
    plate: 1500,
    plateOut: 2900,
    type: 3000,
    pos: 4300,
    back: 5600,
    gate: 5800,
    enter: 7400,
    body: 3200,
    impact: 11200,
    card: 11550,
    count: 1300,
    art: 13150,
    party: 13550,
};

/** Upgrade: a prévia é a do muito raro (prateada, sem placa); a cor da edição e a placa vêm no flash. */
const UPGRADE: Partial<Base> = { spots: 2, fires: [600, 800], rain: false, plate: 7400, plateOut: 8000 };

/**
 * Encolhido do dia (raro do 2º em diante, ~3 s): prévia, o chute na tela e a carta, sem a jogada com bola. Com 1,8 s
 * ficava "absurdamente rápido" (03/11): a entrada e a carta respiram, e a nota bate a 0,7 s do Continuar. Os telões
 * do tipo e da posição acendem junto com a placa.
 */
const CURTO: Base = {
    end: 3000,
    spots: 1,
    fires: [150],
    rain: false,
    sky: 0,
    plate: 150,
    plateOut: 750,
    // os telões do tipo e da posição acendem no plano aberto, junto com a placa (sem a câmera ir até eles)
    type: 350,
    pos: 600,
    enter: 750,
    body: 0,
    impact: 1300,
    card: 1600,
    count: 500,
    party: 2400,
};

/** Reduzir movimento (~1,2 s): fade pra cor, a carta parada com a placa, o grito. */
const CALMO: Base = {
    end: 1200,
    spots: 0,
    fires: [],
    rain: false,
    sky: 0,
    enter: 300,
    body: 0,
    impact: 300,
    card: 300,
    count: 0,
    party: 300,
};

/**
 * O roteiro do walkout. `nth` = quantos deste nível já saíram hoje contando este (1 = o primeiro): o raro encolhe do 2º
 * em diante, o muito raro vira o tamanho do raro do 3º em diante, o especial nunca encolhe.
 */
export function walkoutPlan(
    tier: WalkTier,
    { nth = 1, reduce = false, upgrade = false }: { nth?: number; reduce?: boolean; upgrade?: boolean } = {},
): WalkPlan {
    const up = tier === 'especial' && upgrade && !reduce;
    const head = { tier, upgrade: up };
    if (reduce) return { ...CALMO, ...head, kind: 'calmo' };
    let p: WalkPlan;
    if (tier === 'raro' && nth >= 2) p = { ...CURTO, ...head, kind: 'curto' };
    else if (tier === 'muitoraro' && nth >= 3) p = { ...RARO, ...head, kind: 'curto' };
    else {
        const base = tier === 'raro' ? RARO : tier === 'muitoraro' ? MUITO : ESPECIAL;
        p = { ...base, ...(up ? UPGRADE : {}), ...head, kind: 'cheio' };
    }
    return stretch(p);
}

/**
 * As tabelas acima ganham tempo em dois lugares (no máximo +2 s): o travelling da câmera dos telões até o túnel (quem
 * tem silhueta) e a revelação da carta (a nota batendo em `card + 200 + count`, raios, a arte e a festa depois).
 */
function stretch(p: WalkPlan): WalkPlan {
    const tunnel = p.gate !== undefined ? 500 : 0;
    // o raro curto já tem o respiro na tabela; o muito raro curto (a tabela do raro) ganha o do raro
    const reveal =
        p.tier === 'raro' && p.kind === 'curto'
            ? 0
            : p.tier === 'especial'
              ? 1100
              : p.tier === 'muitoraro' && p.kind === 'cheio'
                ? 800
                : 500;
    const hit = p.card + 200 + p.count;
    const at = (x: number) => x + (p.back !== undefined && x >= p.back ? tunnel : 0) + (x > hit ? reveal : 0);
    const opt = (x?: number) => (x === undefined ? x : at(x));
    const out: WalkPlan = { ...p };
    for (const k of ['gate', 'art', 'plate', 'plateOut'] as const) out[k] = opt(p[k]);
    for (const k of ['enter', 'impact', 'card', 'party', 'end'] as const) out[k] = at(p[k]);
    return out;
}

/** A comemoração depois da jogada, pela forma: quem voa gira, quem é bicho de quatro patas/bola pula, o resto faz pose. */
export type Comemoracao = 'pulo' | 'giro' | 'pose';
export function comemoracaoOf(speciesId: number): Comemoracao {
    const sp = species(speciesId);
    if (sp.types.includes('Flying') || sp.shape === 'wings' || sp.shape === 'bug-wings') return 'giro';
    if (['upright', 'humanoid', 'armor', 'squiggle'].includes(sp.shape)) return 'pose';
    return 'pulo';
}

/**
 * Comemoração própria de 5 espécies (docs/planos/pesquisas/sinergias-e-animacoes.md, item 9): passa por cima do jeito
 * da forma só no gol da quadra. Vale pra shiny e edições (sai da espécie).
 */
export type ComemoracaoEspecie =
    | 'psyduck'
    | 'snorlax'
    | 'magikarp'
    | 'gengar'
    | 'pikachu'
    | 'jigglypuff'
    | 'slowpoke'
    | 'meowth'
    | 'charizard'
    | 'squirtle'
    | 'cubone'
    | 'voltorb'
    | 'kadabra';
/** As 5 da 0.9.53.1 e as 8 da 0.9.54 (algumas valem pra família: Slowbro, Marowak, Electrode, Alakazam). */
const DA_ESPECIE: Record<number, ComemoracaoEspecie> = {
    6: 'charizard',
    7: 'squirtle',
    25: 'pikachu',
    39: 'jigglypuff',
    52: 'meowth',
    54: 'psyduck',
    64: 'kadabra',
    65: 'kadabra',
    79: 'slowpoke',
    80: 'slowpoke',
    94: 'gengar',
    100: 'voltorb',
    101: 'voltorb',
    104: 'cubone',
    105: 'cubone',
    129: 'magikarp',
    143: 'snorlax',
};
export const golCelebOf = (speciesId: number): Comemoracao | ComemoracaoEspecie =>
    DA_ESPECIE[speciesId] ?? comemoracaoOf(speciesId);

/** Snorlax: deita (gira o corpo no pé, como o tombo) e levanta antes do motor soltar. */
export const SNORLAX = { down: 280, lie: 760, up: 2020, stand: 2380, rot: 1.45 } as const;
/** Magikarp: 4 pulos no lugar, virando de lado a cada um (o Splash). */
const MAGIKARP = { hops: 4, h: 22, air: 330 } as const;
/** Gengar: afunda no chão, fica embaixo e volta esticando; depois ri pulando. */
export const GENGAR = { sink: 760, under: 1150, rise: 1450 } as const;
/** Pikachu: junta carga até `zap` (ms) e solta o raio pro céu (o raio é desenhado pela cena). */
export const PIKA_ZAP = 420;
/** Jigglypuff: canta (notas da cena) até `sing`, infla brava até `puff` e rabisca a cara de quem está perto. */
export const JIGGLY = { sing: 1250, puff: 1600 } as const;
/** Slowpoke: parado com "..." (um ponto em cada `dots`), só percebe o gol em `notice` e pula atrasado. */
export const SLOWPOKE = { dots: [250, 600, 950], notice: 1500, jump: 1720 } as const;
/** Meowth: Pay Day, joga as moedas em `toss` (as moedas são da cena). */
export const PAYDAY = { toss: 380 } as const;
/** Charizard: enche o peito até `from` e solta o fogo pro céu até `to`. */
export const CHARIZARD = { from: 450, to: 1550 } as const;
/** Squirtle: os óculos do Esquadrão descem em `drop` e encaixam no rosto em `land`; o brilho passa em `glint`. */
export const SQUAD = { drop: 300, land: 720, glint: 1000 } as const;
/** Cubone: arremessa o osso em `toss`, o Bonemerang dá a volta e volta pra mão em `back`. */
export const BONE = { toss: 380, back: 1650 } as const;
/** Voltorb: pisca e incha até `boom`, explode, fica tostado até `clean` e se sacode. */
export const BOOM = { boom: 1050, clean: 1950 } as const;
/** Kadabra: a colher sobe em `rise` e entorta entre `bend` e `bent`. */
export const SPOON = { rise: 300, bend: 950, bent: 1450 } as const;

/** Quanto dura a comemoração do gol (o `Action.Celebrate` de 2,5 s do motor). */
export const GOAL_CELEB_MS = 2500;
/** Giro: 2 voltas inteiras (16 passos de direção) que aceleram e freiam, e depois pula de frente. */
const GIRO_MS = 1360;
const GIRO_STEPS = 16;
/** Pose: junta força (como o "Vamooo!" do capitão) e solta a pose de frente. */
const POSE_CHARGE_MS = 450;
/** Quanto dura a esticada quando a pose solta (e a agachada antes do pulo). */
const POP_MS = 160;

/** Pulo da comemoração: quanto sobe (px), quanto fica no ar e quanto dura o amassado da aterrissagem (ms). */
export const CELEB_HOP = { h: 28, air: 380, h2: 18, air2: 300, land: 190, squash: 0.3, squash2: 0.22 } as const;

interface CelebBody {
    sx: number;
    sy: number;
    /** Altura do corpo acima do chão (px; a sombra fica no chão). */
    lift: number;
    /** Giro do corpo no pé (rad; só as comemorações da espécie: o Snorlax deita, o Psyduck balança). */
    rot?: number;
    /** Tinta do corpo (o Voltorb pisca vermelho e fica tostado); a cena volta a tinta normal depois. */
    tint?: number;
}

const bump = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));

/**
 * Um pulo que sai em `t0` (ms): estica subindo e descendo (redondo no alto), cai e amassa `squash` na aterrissagem.
 * null fora dele.
 */
function hop(t: number, t0: number, h: number, air: number, squash: number): CelebBody | null {
    if (t < t0 || t >= t0 + air + CELEB_HOP.land) return null;
    if (t < t0 + air) {
        const u = (t - t0) / air;
        const s = Math.abs(2 * u - 1);
        return { lift: h * 4 * u * (1 - u), sx: 1 - 0.1 * s, sy: 1 + 0.2 * s };
    }
    const k = bump((t - t0 - air) / CELEB_HOP.land);
    return { lift: 0, sx: 1 + squash * k, sy: 1 - squash * 1.15 * k };
}

/** Agacha nos `ms` antes de `t0` (antecipação do pulo). */
const crouch = (t: number, t0: number, ms: number): CelebBody | null =>
    t >= t0 - ms && t < t0 ? { lift: 0, ...squashOf(Math.sin((Math.PI / 2) * ((t - t0 + ms) / ms))) } : null;
const squashOf = (k: number) => ({ sx: 1 + 0.15 * k, sy: 1 - 0.2 * k });

/**
 * A comemoração do gol na quadra (MatchScene), no jeito da espécie (`comemoracaoOf`), dentro do tempo que o motor já
 * segura: pulo = agacha e pula duas vezes (Hop) virado pra onde estava; giro = gira pelas 8 direções (pião), começando
 * devagar, acelerando e freando, e pula de frente; pose = Charge agachando, salta e solta a Pose de frente (sem Pose,
 * o animation-manager cai no Hop). Todo pulo amassa ao aterrissar (12/11). `ms` desde o gol; `sx`/`sy` = squash &
 * stretch do corpo (1 = normal); `lift` = altura do pulo (px).
 */
export function goalCelebPose(
    kind: Comemoracao | ComemoracaoEspecie,
    ms: number,
    facing: number,
): { anim: string; facing: number } & CelebBody {
    const t = Math.max(0, ms);
    const H = CELEB_HOP;
    const still = { sx: 1, sy: 1, lift: 0 };
    const easeOut = (u: number) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
    if (kind === 'psyduck') {
        // segura a cabeça (Hurt em loop, a cena repete) balançando de um lado pro outro; o "?" é da cena
        return {
            anim: 'Hurt',
            facing: 0,
            ...still,
            rot: 0.16 * Math.max(0, Math.min(1, t / 250, (GOAL_CELEB_MS - t) / 250)) * Math.sin(t / 140),
        };
    }
    if (kind === 'snorlax') {
        const S = SNORLAX;
        if (t < S.down)
            return { anim: 'Idle', facing: 0, lift: 0, ...squashOf(Math.sin((Math.PI / 2) * (t / S.down))) };
        // tomba de lado, assenta (amassa) no chão e levanta no fim
        const k = t < S.up ? easeOut((t - S.down) / (S.lie - S.down)) : 1 - easeOut((t - S.up) / (S.stand - S.up));
        const land = bump((t - S.lie) / 200);
        return { anim: 'Idle', facing: 0, sx: 1 + 0.12 * land, sy: 1 - 0.1 * land, lift: 0, rot: S.rot * k };
    }
    if (kind === 'magikarp') {
        const per = MAGIKARP.air + H.land;
        const n = Math.floor(t / per);
        const body = n < MAGIKARP.hops ? hop(t, n * per, MAGIKARP.h, MAGIKARP.air, H.squash) : null;
        return { anim: 'Hop', facing: n % 2 ? 6 : 2, ...(body ?? still) };
    }
    if (kind === 'gengar') {
        const G = GENGAR;
        if (t < POP_MS) return { anim: 'Idle', facing: 0, ...(crouch(t, POP_MS, POP_MS) ?? still) };
        // afunda: encolhe pro pé e alarga (a sombra fica, como um buraco)
        if (t < G.under) {
            const k = Math.min(1, (t - POP_MS) / (G.sink - POP_MS)) ** 2;
            return { anim: 'Idle', facing: 0, sx: 1 + 0.35 * k, sy: Math.max(0.02, 1 - k), lift: 0 };
        }
        // volta esticando (passa um pouco do tamanho) e ri pulando
        if (t < G.rise) {
            const u = (t - G.under) / (G.rise - G.under);
            return {
                anim: 'Pose',
                facing: 0,
                sx: 1.35 - 0.35 * easeOut(u),
                sy: 0.02 + 0.98 * easeOut(u) + 0.15 * bump(u),
                lift: 0,
            };
        }
        const body =
            hop(t, G.rise + 40, 16, 260, H.squash2) ?? hop(t, G.rise + 40 + 260 + H.land + 30, 12, 230, H.squash2);
        return { anim: 'Pose', facing: 0, ...(body ?? still) };
    }
    if (kind === 'pikachu') {
        if (t < PIKA_ZAP)
            return { anim: 'Charge', facing: 0, lift: 0, ...squashOf(Math.sin((Math.PI / 2) * (t / PIKA_ZAP))) };
        const body = hop(t, PIKA_ZAP, 14, 260, H.squash);
        return { anim: 'Pose', facing: 0, ...(body ?? still) };
    }
    if (kind === 'jigglypuff') {
        const J = JIGGLY;
        // canta balançando devagar (a nota é da cena)
        if (t < J.sing)
            return {
                anim: 'Idle',
                facing: 0,
                ...still,
                sy: 1 + 0.04 * Math.sin(t / 130),
                rot: 0.14 * Math.min(1, t / 300) * Math.sin(t / 260),
            };
        // ninguém ficou pra ouvir: infla de raiva (passa do tamanho e assenta)
        if (t < J.puff) {
            const u = (t - J.sing) / (J.puff - J.sing);
            const k = easeOut(u) + 0.12 * bump(u);
            return { anim: 'Charge', facing: 0, sx: 1 + 0.28 * k, sy: 1 + 0.22 * k, lift: 0 };
        }
        // rabisca: murcha devagar pulando de raiva
        const k = 1 - easeOut((t - J.puff) / 500);
        const body =
            hop(t, J.puff + 80, 10, 200, H.squash2) ?? hop(t, J.puff + 80 + 200 + H.land + 40, 8, 180, H.squash2);
        const b = body ?? still;
        return { anim: 'Attack', facing: 0, sx: b.sx * (1 + 0.28 * k), sy: b.sy * (1 + 0.22 * k), lift: b.lift };
    }
    if (kind === 'slowpoke') {
        const S = SLOWPOKE;
        if (t < S.notice) return { anim: 'Idle', facing: 0, ...still };
        // o susto: estica de uma vez e volta
        if (t < S.jump - 120) {
            const k = bump((t - S.notice) / 180);
            return { anim: 'Idle', facing: 0, sx: 1 - 0.1 * k, sy: 1 + 0.18 * k, lift: 0 };
        }
        const body = crouch(t, S.jump, 120) ?? hop(t, S.jump, 22, 360, H.squash);
        return { anim: 'Hop', facing: 0, ...(body ?? still) };
    }
    if (kind === 'meowth') {
        if (t < PAYDAY.toss)
            return { anim: 'Charge', facing: 0, lift: 0, ...squashOf(Math.sin((Math.PI / 2) * (t / PAYDAY.toss))) };
        const body = hop(t, PAYDAY.toss, 16, 280, H.squash) ?? hop(t, PAYDAY.toss + 1100, 12, 240, H.squash2);
        return { anim: t < PAYDAY.toss + 700 ? 'Attack' : 'Pose', facing: 0, ...(body ?? still) };
    }
    if (kind === 'charizard') {
        const C = CHARIZARD;
        // enche o peito (estica pra cima) e solta: o corpo treme leve enquanto o fogo sai
        if (t < C.from) {
            const k = Math.sin((Math.PI / 2) * (t / C.from));
            return { anim: 'Charge', facing: 0, sx: 1 - 0.08 * k, sy: 1 + 0.12 * k, lift: 0 };
        }
        if (t < C.to) {
            const k = 1 - easeOut((t - C.from) / 160);
            return {
                anim: 'Attack',
                facing: 0,
                sx: 1 + 0.1 * k,
                sy: 1 - 0.1 * k,
                lift: 0,
                rot: 0.025 * Math.sin(t / 35),
            };
        }
        const body = hop(t, C.to + 120, 18, 320, H.squash);
        return { anim: 'Hop', facing: 0, ...(body ?? still) };
    }
    if (kind === 'squirtle') {
        const Q = SQUAD;
        if (t < Q.drop)
            return { anim: 'Charge', facing: 0, lift: 0, ...squashOf(0.6 * Math.sin((Math.PI / 2) * (t / Q.drop))) };
        if (t < Q.land) return { anim: 'Idle', facing: 0, ...still };
        // os óculos encaixam: amassa um pouco e fica parado na pose de durão (um aceno de cabeça)
        const k = bump((t - Q.land) / 200);
        const nod = bump((t - Q.land - 700) / 260);
        return { anim: 'Idle', facing: 0, sx: 1 + 0.12 * k, sy: 1 - 0.12 * k - 0.05 * nod, lift: 0 };
    }
    if (kind === 'cubone') {
        const B = BONE;
        if (t < B.toss)
            return { anim: 'Charge', facing: 0, lift: 0, ...squashOf(Math.sin((Math.PI / 2) * (t / B.toss))) };
        // arremessa de lado e acompanha o osso girando a cabeça (direções 2 → 4 → 6 → 0)
        if (t < B.back) {
            const u = (t - B.toss) / (B.back - B.toss);
            return {
                anim: u < 0.2 ? 'Attack' : 'Idle',
                facing: u < 0.35 ? 2 : u < 0.6 ? 4 : u < 0.85 ? 6 : 0,
                ...still,
            };
        }
        // pega o osso: amassa e pula de frente
        const body = hop(t, B.back + 60, 18, 320, H.squash);
        const k = bump((t - B.back) / 140);
        return { anim: 'Pose', facing: 0, ...(body ?? { lift: 0, sx: 1 + 0.15 * k, sy: 1 - 0.15 * k }) };
    }
    if (kind === 'voltorb') {
        const V = BOOM;
        if (t < V.boom) {
            // incha piscando vermelho, cada vez mais rápido
            const u = t / V.boom;
            const blink = Math.sin((u * u * 9 + u) * Math.PI * 2) > 0;
            const k = u * u;
            return {
                anim: 'Charge',
                facing: 0,
                sx: 1 + 0.22 * k,
                sy: 1 + 0.18 * k,
                lift: 0,
                tint: blink ? 0xff5040 : undefined,
            };
        }
        if (t < V.clean) {
            // tostado e tonto (Hurt), balançando; a fumaça é da cena
            const k = bump((t - V.boom) / 160);
            return {
                anim: 'Hurt',
                facing: 0,
                sx: 1 + 0.25 * k,
                sy: 1 - 0.3 * k,
                lift: 0,
                rot: 0.12 * Math.sin((t - V.boom) / 90) * Math.min(1, (V.clean - t) / 200),
                tint: 0x4a4a4a,
            };
        }
        // se sacode (a fuligem sai) e pula de volta
        const body = hop(t, V.clean + 60, 16, 280, H.squash);
        return { anim: 'Hop', facing: 0, ...(body ?? still) };
    }
    if (kind === 'kadabra') {
        const P = SPOON;
        if (t < P.bent) return { anim: 'Charge', facing: 0, ...still, sy: 1 + 0.03 * Math.sin(t / 90) };
        const body = hop(t, P.bent + 80, 16, 300, H.squash);
        return { anim: 'Pose', facing: 0, ...(body ?? still) };
    }
    if (kind === 'giro') {
        const u = Math.min(1, t / GIRO_MS);
        // ease in-out (seno): os passos ficam mais juntos no meio da volta
        const step = Math.floor(((1 - Math.cos(Math.PI * u)) / 2) * GIRO_STEPS);
        if (u < 1) return { anim: 'Walk', facing: (facing + step) % 8, ...still };
        const body = crouch(t, GIRO_MS + POP_MS, POP_MS) ?? hop(t, GIRO_MS + POP_MS, H.h, H.air, H.squash);
        return { anim: 'Hop', facing: 0, ...(body ?? still) };
    }
    if (kind === 'pose') {
        // junta força: vai agachando (antecipação)
        if (t < POSE_CHARGE_MS)
            return { anim: 'Charge', facing: 0, lift: 0, ...squashOf(Math.sin((Math.PI / 2) * (t / POSE_CHARGE_MS))) };
        // solta: salta esticado e assenta na pose
        const body = hop(t, POSE_CHARGE_MS, H.h2 + 4, H.air2, H.squash);
        return { anim: 'Pose', facing: 0, ...(body ?? still) };
    }
    const body =
        crouch(t, POP_MS, POP_MS) ??
        hop(t, POP_MS, H.h, H.air, H.squash) ??
        hop(t, POP_MS + H.air + H.land + 60, H.h2, H.air2, H.squash2);
    return { anim: 'Hop', facing, ...(body ?? still) };
}

/** As batidas onde o toque para (tocar adianta pra próxima). */
export function planBeats(p: WalkPlan): number[] {
    const all = [p.sky, p.plate, p.type, p.pos, p.gate, p.enter, p.impact, p.card, p.art, p.end];
    return [...new Set(all.filter((x): x is number => x !== undefined && x > 0))].sort((a, b) => a - b);
}

/** Upgrade em metade dos especiais: decidido pela carta (o mesmo uid sempre dá o mesmo). */
export function upgradeOf(inst: PokemonInstance): boolean {
    let h = 0;
    for (const ch of inst.uid) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (h & 1) === 1;
}

/**
 * Contador por nível e por dia, guardado num número só: dia * 1000 + quantos. Devolve o `nth` deste walkout e o número
 * a gravar.
 */
export function dayCount(stored: number | null, today: number): { nth: number; store: number } {
    const day = stored === null ? null : Math.floor(stored / 1000);
    const n = day === today && stored !== null ? (stored % 1000) + 1 : 1;
    return { nth: n, store: today * 1000 + Math.min(n, 999) };
}

/** Hoje no relógio de Brasília (o dia da Copa do Dia) como número, 20261103, pro `dayCount`. */
export const walkoutToday = (now = new Date()) => Number(dailyDay(now).replace(/-/g, ''));

/** A jogada com bola na entrada em campo. Todas terminam com o chute na tela (que racha o vidro). */
export type Jogada =
    | 'embaixadinha'
    | 'bicicleta'
    | 'cabecada'
    | 'drible'
    | 'canhao'
    | 'levita'
    | 'voo'
    | 'tremor'
    | 'chama';

export const JOGADAS: readonly Jogada[] = [
    'embaixadinha',
    'bicicleta',
    'cabecada',
    'drible',
    'canhao',
    'levita',
    'voo',
    'tremor',
    'chama',
];

/**
 * A jogada da espécie, pelo tipo e pela forma (sempre a mesma pra mesma espécie): Psíquico e Fantasma levitam a bola,
 * os quadrúpedes rápidos driblam em zigue-zague, Fogo põe
 * fogo na bola, quem voa traz a bola pelo ar, Lutador faz bicicleta, Pedra e Terra chutam com tremor, Elétrico
 * dribla, bola/gosma/peixe fazem embaixadinha; o resto se divide entre
 * embaixadinha, cabeçada e o canhão pelo número da Pokédex.
 */
export function jogadaOf(speciesId: number): Jogada {
    const sp = species(speciesId);
    const has = (t: string) => sp.types.includes(t);
    if (has('Psychic') || has('Ghost')) return 'levita';
    if (sp.shape === 'quadruped' && sp.baseStats.spe >= 90) return 'drible';
    if (has('Fire') && sp.shape !== 'wings') return 'chama';
    if (has('Flying') || sp.shape === 'wings' || sp.shape === 'bug-wings') return 'voo';
    if (has('Fighting')) return 'bicicleta';
    if (has('Rock') || has('Ground')) return 'tremor';
    if (has('Electric')) return 'drible';
    if (sp.shape === 'ball' || sp.shape === 'blob' || sp.shape === 'fish') return 'embaixadinha';
    return (['embaixadinha', 'cabecada', 'canhao'] as const)[speciesId % 3];
}
