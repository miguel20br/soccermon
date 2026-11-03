import { species } from '../engine/data';
import type { PokemonInstance } from '../engine/instance';

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
    /** Flash: o Pokémon entra com a bola e faz a jogada (dura `body`), depois chuta na tela. */
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
    /** Versão 2 (`&v=2`, pra comparar): mais movimento; a nota bate em `card + 200 + count`. */
    v2?: boolean;
}

/** Pular aparece depois da prévia: ninguém perde a cor. */
export const WALK_SKIP_AT = 1000;
/** O vidro quebra este tanto depois da bola bater. */
export const SHATTER_MS = 280;

type Base = Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'>;

const RARO: Base = {
    end: 5000,
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
    body: 1250,
    impact: 3700,
    card: 4050,
    count: 600,
    party: 4500,
};

const MUITO: Base = {
    end: 8500,
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
    body: 1500,
    impact: 6850,
    card: 7150,
    count: 800,
    party: 7900,
};

const ESPECIAL: Base = {
    end: 14000,
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
    body: 2400,
    impact: 10250,
    card: 10600,
    count: 1300,
    art: 12200,
    party: 12600,
};

/** Upgrade: a prévia é a do muito raro (prateada, sem placa); a cor da edição e a placa vêm no flash. */
const UPGRADE: Partial<Base> = { spots: 2, fires: [600, 800], rain: false, plate: 7400, plateOut: 8000 };

/** Encolhido do dia (raro do 2º em diante): prévia, o chute na tela e a carta. */
const CURTO: Base = {
    end: 1800,
    spots: 1,
    fires: [100],
    rain: false,
    sky: 0,
    plate: 100,
    plateOut: 600,
    enter: 500,
    body: 0,
    impact: 900,
    card: 1200,
    count: 400,
    party: 1500,
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
    {
        nth = 1,
        reduce = false,
        upgrade = false,
        v2 = false,
    }: { nth?: number; reduce?: boolean; upgrade?: boolean; v2?: boolean } = {},
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
    return v2 ? stretchV2(p) : p;
}

/**
 * A versão 2 ganha tempo em dois lugares (no máximo +2 s): o travelling da câmera dos telões até o túnel (quem tem
 * silhueta) e a revelação da carta (a nota batendo, raios, a arte e a festa depois).
 */
function stretchV2(p: WalkPlan): WalkPlan {
    const tunnel = p.gate !== undefined ? 500 : 0;
    const reveal = p.kind === 'curto' ? 0 : p.tier === 'especial' ? 1100 : p.tier === 'muitoraro' ? 800 : 500;
    const hit = p.card + 200 + p.count;
    const at = (x: number) => x + (p.back !== undefined && x >= p.back ? tunnel : 0) + (x > hit ? reveal : 0);
    const opt = (x?: number) => (x === undefined ? x : at(x));
    const out: WalkPlan = { ...p, v2: true };
    for (const k of ['gate', 'art', 'plate', 'plateOut'] as const) out[k] = opt(p[k]);
    for (const k of ['enter', 'impact', 'card', 'party', 'end'] as const) out[k] = at(p[k]);
    return out;
}

/** A comemoração depois da jogada (versão 2), pela forma: quem voa gira, quem é bicho de quatro patas/bola pula, o resto faz pose. */
export type Comemoracao = 'pulo' | 'giro' | 'pose';
export function comemoracaoOf(speciesId: number): Comemoracao {
    const sp = species(speciesId);
    if (sp.types.includes('Flying') || sp.shape === 'wings' || sp.shape === 'bug-wings') return 'giro';
    if (['upright', 'humanoid', 'armor', 'squiggle'].includes(sp.shape)) return 'pose';
    return 'pulo';
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
