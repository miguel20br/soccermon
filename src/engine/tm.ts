import { MOVES, SPECIES, type Species, species } from './data';
import type { PokemonInstance } from './instance';
import { defaultMoveset } from './moves';
import type { Rng } from './rng';
import { SIGNATURE } from './signature-moves';

/**
 * "MT do ginásio": depois de vencer um ginásio, uma das 3 recompensas pode ser a MT que o líder dava na
 * Gen 1 (Brock → Bide, Misty → BubbleBeam…). Se ninguém do seu time aprende, vem um golpe do "baú raro"
 * (golpes que nenhum Pokémon leva no moveset padrão). Você escolhe quem aprende e qual golpe esquece; a
 * assinatura nunca é esquecida. O golpe ensinado fica em `PokemonInstance.taught` e sobrevive à evolução.
 *
 * Os clubes rivais também entram com a MT do próprio ginásio (a IA rival pode ser automática).
 */

/** Chance de uma das 3 recompensas ser uma MT (no lugar de um item). */
export const TM_REWARD_CHANCE = 0.5;
/** Chance de um Pokémon rival que não aprende a MT do ginásio levar um golpe do baú raro. */
export const RIVAL_RARE_CHANCE = 0.2;

/** MT que cada líder dava na Gen 1, pelo nome do clube da copa. Lavender não tem ginásio: baú raro. */
export const GYM_TM: Readonly<Record<string, { move: string; leader: string }>> = {
    'Pewter Rochedo': { move: 'bide', leader: 'Brock' },
    'Cerulean Cascata': { move: 'bubblebeam', leader: 'Misty' },
    'Vermilion Voltagem': { move: 'thunderbolt', leader: 'Lt. Surge' },
    'Celadon Arco-Íris': { move: 'megadrain', leader: 'Erika' },
    'Fuchsia Ninjas': { move: 'toxic', leader: 'Koga' },
    'Saffron Mentes': { move: 'psywave', leader: 'Sabrina' },
    'Cinnabar Vulcão': { move: 'fireblast', leader: 'Blaine' },
    'Viridian Terra': { move: 'fissure', leader: 'Giovanni' },
};

/** Número da MT/MO na Gen 1 (em PT-BR: Máquina Técnica / Máquina Oculta). */
const TM_LIST = [
    'megapunch',
    'razorwind',
    'swordsdance',
    'whirlwind',
    'megakick',
    'toxic',
    'horndrill',
    'bodyslam',
    'takedown',
    'doubleedge',
    'bubblebeam',
    'watergun',
    'icebeam',
    'blizzard',
    'hyperbeam',
    'payday',
    'submission',
    'counter',
    'seismictoss',
    'rage',
    'megadrain',
    'solarbeam',
    'dragonrage',
    'thunderbolt',
    'thunder',
    'earthquake',
    'fissure',
    'dig',
    'psychic',
    'teleport',
    'mimic',
    'doubleteam',
    'reflect',
    'bide',
    'metronome',
    'selfdestruct',
    'eggbomb',
    'fireblast',
    'swift',
    'skullbash',
    'softboiled',
    'dreameater',
    'skyattack',
    'rest',
    'thunderwave',
    'psywave',
    'explosion',
    'rockslide',
    'triattack',
    'substitute',
];
const HM_LIST = ['cut', 'fly', 'surf', 'strength', 'flash'];

/** "MT34", "MO02" ou null (golpe que na Gen 1 não vinha em disco). */
export function tmLabel(move: string): string | null {
    const tm = TM_LIST.indexOf(move);
    if (tm >= 0) return `MT${String(tm + 1).padStart(2, '0')}`;
    const hm = HM_LIST.indexOf(move);
    return hm >= 0 ? `MO${String(hm + 1).padStart(2, '0')}` : null;
}

let rarePool: string[] | null = null;
/** Baú raro: golpes que existem e alguém aprende, mas que nenhum Pokémon leva no moveset padrão. */
export function rareMovePool(): readonly string[] {
    if (!rarePool) {
        const used = new Set(SPECIES.flatMap((sp) => defaultMoveset(sp)));
        rarePool = Object.keys(MOVES)
            .filter((m) => !used.has(m) && SPECIES.some((sp) => sp.learnset.includes(m)))
            .sort();
    }
    return rarePool;
}

/** A espécie aprende o golpe (learnset da Gen 1) e ainda não sabe. */
export function canLearn(inst: PokemonInstance, move: string): boolean {
    return species(inst.speciesId).learnset.includes(move) && !inst.moves.includes(move);
}

/** A assinatura nunca é esquecida (a carta não perde a cara). */
export function isProtectedMove(inst: PokemonInstance, slot: number): boolean {
    const m = inst.moves[slot];
    return m !== undefined && m === SIGNATURE[inst.speciesId];
}

/**
 * Ensina `move` no lugar do golpe em `slot` (ou acrescenta, com `slot === moves.length`, se ainda há vaga).
 * Devolve null se não pode (não aprende, já sabe, assinatura, vaga inválida).
 */
export function teachMove(inst: PokemonInstance, move: string, slot: number): PokemonInstance | null {
    if (!MOVES[move] || !canLearn(inst, move)) return null;
    const moves = [...inst.moves];
    if (slot === moves.length && moves.length < 4) moves.push(move);
    else if (slot >= 0 && slot < moves.length && !isProtectedMove(inst, slot)) moves[slot] = move;
    else return null;
    const forgotten = inst.moves[slot];
    const taught = [...(inst.taught ?? []).filter((m) => m !== forgotten && moves.includes(m)), move];
    return { ...inst, moves, taught };
}

/**
 * Golpes depois de evoluir: o moveset padrão da forma nova, mantendo o que foi ensinado por MT (se a forma
 * nova aprende), de preferência na mesma vaga, nunca no lugar da assinatura.
 */
export function movesAfterEvolution(inst: PokemonInstance, sp: Species): { moves: string[]; taught: string[] } {
    const moves = defaultMoveset(sp).slice();
    const sig = SIGNATURE[sp.id];
    const taught = (inst.taught ?? []).filter((m) => inst.moves.includes(m) && sp.learnset.includes(m));
    const locked = new Set<number>();
    const kept: string[] = [];
    for (const m of taught) {
        const have = moves.indexOf(m);
        if (have >= 0) {
            locked.add(have);
            kept.push(m);
            continue;
        }
        if (moves.length < 4) {
            moves.push(m);
            locked.add(moves.length - 1);
            kept.push(m);
            continue;
        }
        const free = (i: number) => i >= 0 && i < moves.length && !locked.has(i) && moves[i] !== sig;
        const old = inst.moves.indexOf(m);
        const idx = free(old) ? old : [3, 2, 1, 0].find(free);
        if (idx === undefined) continue;
        moves[idx] = m;
        locked.add(idx);
        kept.push(m);
    }
    return { moves, taught: kept };
}

/** MT oferecida na recompensa: a do ginásio vencido, se alguém aprende; senão uma do baú raro. */
export interface TmOffer {
    move: string;
    /** Líder que dava a MT, ou null (baú raro). */
    leader: string | null;
}

export function rollTmOffer(rng: Rng, team: readonly PokemonInstance[], clubName?: string): TmOffer | null {
    const gym = clubName ? GYM_TM[clubName] : undefined;
    if (gym && team.some((p) => canLearn(p, gym.move))) return { move: gym.move, leader: gym.leader };
    const rare = rareMovePool().filter((m) => team.some((p) => canLearn(p, m)));
    return rare.length ? { move: rng.pick(rare), leader: null } : null;
}

/** Instância com o golpe na 4ª vaga (ou na última que não é a assinatura). */
function withMove(inst: PokemonInstance, move: string): PokemonInstance {
    if (inst.moves.length < 4) return teachMove(inst, move, inst.moves.length) ?? inst;
    for (let i = inst.moves.length - 1; i >= 0; i--) {
        const out = teachMove(inst, move, i);
        if (out) return out;
    }
    return inst;
}

/**
 * Rivais da copa: quem aprende entra com a MT do ginásio do clube; os outros têm uma chance pequena de
 * levar um golpe do baú raro. Automático só no rival.
 */
export function equipRivalTms(rng: Rng, clubName: string, players: PokemonInstance[]): PokemonInstance[] {
    const gym = GYM_TM[clubName];
    return players.map((p) => {
        if (gym && canLearn(p, gym.move)) return withMove(p, gym.move);
        if (!rng.chance(RIVAL_RARE_CHANCE)) return p;
        const rare = rareMovePool().filter((m) => canLearn(p, m));
        return rare.length ? withMove(p, rng.pick(rare)) : p;
    });
}
