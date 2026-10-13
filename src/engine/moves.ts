import { MOVES, type MoveData, type Species } from './data';

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
export type MoveKind = 'strike' | 'blast' | 'burst' | 'buff' | 'debuff' | 'status' | 'heal' | 'flavor';

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
    'teleport',
    'mimic',
    'transform',
    'metronome',
    'mirrormove',
    'substitute',
    'bide',
    'counter',
    'rage',
    'roar',
    'whirlwind',
    'conversion',
    'haze',
    'mist',
    'focusenergy',
    'disable',
    'payday',
    'flash',
    'kinesis',
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
    'leechseed',
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
    reflect: 'buff',
    lightscreen: 'buff',
    doubleteam: 'buff',
    minimize: 'buff',
    focusenergy: 'buff',
};

const FIXED_DAMAGE_POWER = 70;

export function classifyMove(id: string): MoveProfile {
    const data = MOVES[id];
    if (!data) throw new Error(`Golpe desconhecido: ${id}`);
    let kind: MoveKind;
    let strength: number;
    const status = STATUS_MOVES[id] ?? null;
    const selfBoost = Object.values(data.selfBoosts ?? {}).reduce((s: number, b) => s + Math.max(0, b ?? 0), 0);
    const targetDrop = Object.values(data.targetBoosts ?? {}).reduce((s: number, b) => s + Math.min(0, b ?? 0), 0);

    if (SPECTACULAR[id]) {
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
    } else if (data.category === 'Physical') {
        kind = 'strike';
        strength = Math.min(1, (data.power * (data.accuracy / 100)) / 120);
    } else if (data.category === 'Special') {
        kind = 'blast';
        strength = Math.min(1, (data.power * (data.accuracy / 100)) / 120);
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

    // usos por partida seguem o PP: golpes fracos/baratos aparecem mais, os devastadores 1–2 vezes
    const uses = kind === 'flavor' ? 1 : data.pp >= 25 ? 4 : data.pp >= 15 ? 3 : data.pp >= 10 ? 2 : 1;
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

/**
 * Moveset padrão com cara de "jogo de verdade":
 * 1) melhor golpe STAB da categoria mais forte da espécie (Atk vs SpA)
 * 2) melhor golpe de dano de outro tipo ou outra categoria (cobertura)
 * 3) utilitário: status > arrancada > buff > debuff > cura
 * 4) melhor restante, preferindo um tipo ainda não coberto
 * Espécies com learnset curto (Magikarp, Ditto…) ficam com menos de 4.
 */
export function defaultMoveset(sp: Species): string[] {
    const profiles = sp.learnset.map(moveProfile);
    const physical = sp.baseStats.atk >= sp.baseStats.spa;
    const damageScore = (p: MoveProfile): number => {
        if (p.kind !== 'strike' && p.kind !== 'blast') return 0;
        let sc = p.strength * 100;
        if (sp.types.includes(p.data.type)) sc *= 1.6;
        else if (p.data.type === 'Normal') sc *= 0.7;
        if ((p.kind === 'strike') === physical) sc *= 1.2;
        if (GENERIC_TM.has(p.id)) sc *= 0.75;
        if (RISKY.has(p.id)) sc *= 0.55;
        return sc;
    };
    const utilityScore = (p: MoveProfile): number => {
        const generic = GENERIC_TM.has(p.id) ? 0.6 : 1;
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
            default:
                return 0;
        }
    };
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
    const first = best(damageScore);
    best((p) => {
        const sc = damageScore(p);
        if (!first) return sc;
        const sameType = p.data.type === first.data.type;
        const sameKind = p.kind === first.kind;
        return sc * (sameType ? (sameKind ? 0.3 : 0.6) : 1.1);
    });
    best(utilityScore);
    const types = new Set(chosen.map((p) => p.data.type));
    best((p) =>
        Math.max(
            damageScore(p) * (types.has(p.data.type) ? 0.5 : 1),
            utilityScore(p) * 0.9,
            p.kind === 'flavor' ? 1 : 0,
        ),
    );
    return chosen.map((p) => p.id);
}
