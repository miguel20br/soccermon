import ENC from '../../data/kanto-encounters.json';
import { species } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';

/**
 * Walkout em 3 níveis (docs/planos/pesquisas/ut-walkout.md, opção B, decidido com o Miguel em 02/11/2026). Módulo puro:
 * quem ganha qual nível, o roteiro de cada um (os horários em ms) e as pistas (jeito de entrar, onde vive). A tela é o
 * `WalkoutReact`, que só lê o roteiro.
 */
export type WalkTier = 'raro' | 'muitoRaro' | 'especial';

/** Raro = ouro 75–84; muito raro = ouro 85+, Shiny e Evento; especial = Ícone e Destaque. Abaixo de 75, nada. */
export function walkoutTier(inst: PokemonInstance): WalkTier | null {
    const kind = inst.special?.kind;
    if (kind === 'icone' || kind === 'destaque') return 'especial';
    if (kind === 'evento' || inst.shiny) return 'muitoRaro';
    const ovr = viewInstance(inst).overall;
    return ovr >= 85 ? 'muitoRaro' : ovr >= 75 ? 'raro' : null;
}

export type ClueKind = 'type' | 'pos' | 'gym' | 'route';

/** O roteiro: cada campo é a hora (ms desde o começo) em que a batida entra. */
export interface WalkPlan {
    tier: WalkTier;
    /** cheio = o do nível; curto = o encolhido do dia; calmo = Reduzir movimento. */
    kind: 'cheio' | 'curto' | 'calmo';
    /** Upgrade: começa prateado (cara de muito raro) e racha pra cor da edição na silhueta. */
    upgrade: boolean;
    /** Continuar aparece. */
    end: number;
    /** Holofotes (acendem um por um a partir de `sky`). */
    spots: number;
    /** Hora de cada fogo. */
    fires: number[];
    /** Chuva de faíscas no fundo (especial). */
    rain: boolean;
    /** Apagão com o MomentWipe da estrela. */
    wipe: boolean;
    /** O céu acende na cor do nível. */
    sky: number;
    /** Selo da edição bate no meio. */
    seal?: number;
    /** A tela racha e vira a cor da edição (só no upgrade). */
    crack?: number;
    clues: { kind: ClueKind; at: number }[];
    /** Portão abre, silhueta "Quem é esse Pokémon?". */
    gate?: number;
    /** Flash do reveal (a silhueta ganha cor). */
    flash: number;
    /** O Pokémon começa a entrar do jeito dele. */
    enter: number;
    /** A carta bate. */
    card: number;
    /** A arte entra na carta (antes disso, a carta vem sem a foto e a nota conta). */
    art?: number;
    /** Confete e o Pokémon pulando. */
    party?: number;
}

/** Pular aparece depois da prévia: ninguém perde a cor. */
export const SKIP_AFTER_MS = 1000;

const RARO: Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'> = {
    end: 4000,
    spots: 1,
    fires: [150],
    rain: false,
    wipe: false,
    sky: 0,
    clues: [
        { kind: 'type', at: 600 },
        { kind: 'pos', at: 1200 },
        { kind: 'gym', at: 1800 },
    ],
    enter: 2400,
    flash: 3200,
    card: 3200,
};

const MUITO: Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'> = {
    end: 7000,
    spots: 2,
    fires: [500, 720],
    rain: false,
    wipe: false,
    sky: 0,
    clues: [
        { kind: 'type', at: 1200 },
        { kind: 'pos', at: 2200 },
        { kind: 'route', at: 3200 },
    ],
    gate: 4200,
    flash: 5200,
    enter: 5200,
    card: 5800,
};

const ESPECIAL: Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'> = {
    end: 10500,
    spots: 4,
    fires: [600, 820, 1040],
    rain: true,
    wipe: true,
    sky: 600,
    seal: 1500,
    clues: [
        { kind: 'type', at: 2500 },
        { kind: 'pos', at: 3500 },
        { kind: 'route', at: 4500 },
    ],
    gate: 5500,
    flash: 7000,
    enter: 7000,
    card: 8000,
    art: 9000,
    party: 9500,
};

/** Upgrade: a prévia é a do muito raro (2 holofotes e 2 fogos prateados, sem selo); o selo vem com a rachadura. */
const UPGRADE: Partial<WalkPlan> = { spots: 2, fires: [600, 820], rain: false, seal: undefined, crack: 6200 };

/** Encolhido do dia (raro do 2º em diante): prévia e carta. */
const CURTO: Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'> = {
    end: 1500,
    spots: 1,
    fires: [100],
    rain: false,
    wipe: false,
    sky: 0,
    clues: [],
    enter: 700,
    flash: 700,
    card: 700,
};

/** Reduzir movimento (~1,2 s): fade pra cor do nível e a carta parada com o selo. */
const CALMO: Omit<WalkPlan, 'tier' | 'kind' | 'upgrade'> = {
    end: 1200,
    spots: 0,
    fires: [],
    rain: false,
    wipe: false,
    sky: 0,
    clues: [],
    enter: 300,
    flash: 300,
    card: 300,
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
    if (tier === 'raro' && nth >= 2) return { ...CURTO, ...head, kind: 'curto' };
    if (tier === 'muitoRaro' && nth >= 3) return { ...RARO, ...head, kind: 'curto' };
    const base = tier === 'raro' ? RARO : tier === 'muitoRaro' ? MUITO : ESPECIAL;
    return { ...base, ...(up ? UPGRADE : {}), ...head, kind: 'cheio' };
}

/** As batidas onde o toque para (tocar adianta pra próxima). */
export function planBeats(p: WalkPlan): number[] {
    const all = [p.sky, p.seal, p.crack, ...p.clues.map((c) => c.at), p.gate, p.flash, p.card, p.art, p.end];
    return [...new Set(all.filter((x): x is number => x !== undefined && x > 0))].sort((a, b) => a - b);
}

/** Próxima batida depois de `t` (o toque adianta); no fim, o próprio fim. */
export const nextBeat = (p: WalkPlan, t: number) => planBeats(p).find((b) => b > t + 1) ?? p.end;

/** Upgrade em metade dos especiais: decidido pela carta (o mesmo uid sempre dá o mesmo). */
export function upgradeOf(inst: PokemonInstance): boolean {
    let h = 0;
    for (const ch of inst.uid) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (h & 1) === 1;
}

/**
 * Contador por nível e por dia, guardado num número só (`local-count`): dia * 1000 + quantos. Devolve o `nth` deste
 * walkout e o número a gravar.
 */
export function dayCount(stored: number | null, today: number): { nth: number; store: number } {
    const day = stored === null ? null : Math.floor(stored / 1000);
    const n = day === today && stored !== null ? (stored % 1000) + 1 : 1;
    return { nth: n, store: today * 1000 + Math.min(n, 999) };
}

export type Entry = 'voa' | 'quica' | 'corre' | 'anda' | 'aparece';

/** O jeito de entrar em campo, pela forma da espécie (a mesma `shape` que a quadra usa pra decidir quem paira). */
export function entryOf(speciesId: number): Entry {
    const sp = species(speciesId);
    if (sp.types.includes('Ghost')) return 'aparece';
    if (sp.types.includes('Flying') || sp.shape === 'wings' || sp.shape === 'bug-wings') return 'voa';
    if (sp.shape === 'ball' || sp.shape === 'blob' || sp.shape === 'fish') return 'quica';
    if (sp.baseStats.spe >= 95 && sp.shape !== 'upright' && sp.shape !== 'humanoid') return 'corre';
    return 'anda';
}

type Enc = {
    areas: Record<string, { name: string; mons: [number, string, number, ...unknown[]][] }>;
    notWild: Record<string, string>;
};
const enc = ENC as unknown as Enc;

export type Habitat = { area: string } | { kind: string };

/** Onde vive (pista "placa de rota"): o lugar onde mais aparece; quem não é selvagem herda da pré-evolução. */
export function habitatOf(speciesId: number): Habitat {
    let best: { name: string; rate: number } | null = null;
    for (const a of Object.values(enc.areas)) {
        for (const m of a.mons) {
            if (m[0] !== speciesId || m[1] === 'gift') continue;
            if (!best || m[2] > best.rate) best = { name: a.name, rate: m[2] };
        }
    }
    if (best) return { area: best.name };
    const why = enc.notWild[speciesId];
    const prevo = species(speciesId).prevo;
    if (why === 'evolucao' && prevo) return habitatOf(prevo);
    return { kind: why ?? 'presente' };
}

/** Nome do lugar na placa (o PokeAPI vem em inglês: "Road 1", "Cerulean Cave (B1F)"). */
export function placeName(area: string, lang: string): string {
    const n = area.replace(/\s*\(.*\)$/, '').replace(/Pokemon/g, 'Pokémon');
    const road = /^Road (\d+)/.exec(n);
    if (lang !== 'pt') return road ? `Route ${road[1]}` : n.replace(/^Victory Road 2$/, 'Victory Road');
    if (road) return `Rota ${road[1]}`;
    const PT: Record<string, string> = {
        'Viridian Forest': 'Floresta de Viridian',
        'Cerulean Cave': 'Caverna Cerulean',
        'Digletts Cave': 'Caverna do Diglett',
        'Rock Tunnel': 'Túnel de Pedra',
        'Power Plant': 'Usina',
        'Safari Zone': 'Zona Safári',
        'Seafoam Islands': 'Ilhas Seafoam',
        'Victory Road 2': 'Estrada Vitória',
        'Pokémon Tower': 'Torre Pokémon',
        'Pokémon Mansion': 'Mansão Pokémon',
        'Mount Moon': 'Mt. Moon',
        'Kanto Underground Path': 'Passagem Subterrânea',
        'S.S. Anne dock': 'Cais do S.S. Anne',
        'Fighting Dojo': 'Dojô de Luta',
        'Silph Co. 7F': 'Silph Co.',
        'Pallet Town': 'Pallet',
        'Cinnabar Island': 'Cinnabar',
    };
    return PT[n] ?? n.replace(/ City$/, '');
}
