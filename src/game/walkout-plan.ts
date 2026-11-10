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

/** Quanto dura a comemoração do gol (o `Action.Celebrate` de 2,5 s do motor). */
export const GOAL_CELEB_MS = 2500;
/** Giro: 2 voltas inteiras (16 passos de direção) que aceleram e freiam, e depois pula de frente. */
const GIRO_MS = 1360;
const GIRO_STEPS = 16;
/** Pose: junta força (como o "Vamooo!" do capitão) e solta a pose de frente. */
const POSE_CHARGE_MS = 450;
/** Quanto dura a esticada quando a pose solta (e a agachada antes do pulo). */
const POP_MS = 160;

/**
 * A comemoração do gol na quadra (MatchScene), no jeito da espécie (`comemoracaoOf`), dentro do tempo que o motor já
 * segura: pulo = Hop virado pra onde estava, com uma agachada antes; giro = gira pelas 8 direções (pião), começando
 * devagar, acelerando e freando, e pula de frente; pose = Charge agachando e Pose de frente com uma esticada (sem Pose,
 * o animation-manager cai no Hop). `ms` desde o gol; `sx`/`sy` = squash & stretch do corpo (1 = normal).
 */
export function goalCelebPose(
    kind: Comemoracao,
    ms: number,
    facing: number,
): { anim: string; facing: number; sx: number; sy: number } {
    const t = Math.max(0, ms);
    const bump = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
    if (kind === 'giro') {
        const u = Math.min(1, t / GIRO_MS);
        // ease in-out (seno): os passos ficam mais juntos no meio da volta
        const step = Math.floor(((1 - Math.cos(Math.PI * u)) / 2) * GIRO_STEPS);
        if (u < 1) return { anim: 'Walk', facing: (facing + step) % 8, sx: 1, sy: 1 };
        const k = bump((t - GIRO_MS) / POP_MS);
        return { anim: 'Hop', facing: 0, sx: 1 + 0.08 * k, sy: 1 - 0.1 * k };
    }
    if (kind === 'pose') {
        if (t < POSE_CHARGE_MS) {
            // junta força: vai agachando (antecipação)
            const k = Math.sin((Math.PI / 2) * (t / POSE_CHARGE_MS));
            return { anim: 'Charge', facing: 0, sx: 1 + 0.06 * k, sy: 1 - 0.09 * k };
        }
        // solta: estica e assenta
        const k = bump((t - POSE_CHARGE_MS) / (POP_MS * 1.5));
        return { anim: 'Pose', facing: 0, sx: 1 - 0.05 * k, sy: 1 + 0.1 * k };
    }
    const k = bump(t / POP_MS);
    return { anim: 'Hop', facing, sx: 1 + 0.08 * k, sy: 1 - 0.1 * k };
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
