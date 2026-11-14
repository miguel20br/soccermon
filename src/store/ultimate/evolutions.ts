import type { Position } from '../../engine/attributes';
import { SPECIES, species } from '../../engine/data';
import { evolveInstance } from '../../engine/evolution';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import type { PlayerSummary } from '../../engine/runners/batch-runner';
import { EVO_STEP, TRAIN_STEPS } from './rules';

/**
 * Evoluções do Time Ultimate (as Evolutions do FUT com evolução de verdade): você escolhe a carta, vê a forma final
 * antes de começar e cumpre o objetivo de cada passo jogando com ela. A carta continua a mesma (uid, edição, vaga);
 * a evolução usa a regra de sempre (`evolveInstance`, +2 em tudo por evolução). Quem não evolui mais faz Treino: até
 * TRAIN_STEPS subidas, cada uma valendo o mesmo que uma evolução (a mesma conta, `evolved`), sem fórmula nova.
 */
export interface UtEvo {
    uid: string;
    /** As espécies de cada passo até a forma final; vazio = Treino. */
    path: number[];
    /** Posição dele quando começou: a forma nova herda como secundária, e o goleiro conta defesas no lugar de gols. */
    role: Position;
    /** Passos já dados. */
    step: number;
    prog: { played: number; goals: number; mvp: number };
}

const MAX_ID = SPECIES.length;

/** Caminhos possíveis da carta até a forma final (Eevee tem 3); [[]] = não evolui mais, faz Treino. */
export function evoPaths(inst: Pick<PokemonInstance, 'speciesId' | 'ability'>): number[][] {
    if (inst.ability === 'imposter') return [[]];
    const walk = (id: number): number[][] => {
        const next = species(id).evolvesTo.filter((e) => e.id <= MAX_ID);
        return next.length ? next.flatMap((e) => walk(e.id).map((p) => [e.id, ...p])) : [[]];
    };
    return walk(inst.speciesId);
}

export const evoSteps = (e: Pick<UtEvo, 'path'>) => e.path.length || TRAIN_STEPS;

/** Meta de gols do passo (o goleiro conta defesas). */
export const evoGoalsNeed = (e: Pick<UtEvo, 'role'>) => (e.role === 'GK' ? EVO_STEP.saves : EVO_STEP.goals);

export const evoReady = (e: UtEvo) =>
    e.step < evoSteps(e) &&
    e.prog.played >= EVO_STEP.played &&
    e.prog.goals >= evoGoalsNeed(e) &&
    e.prog.mvp >= EVO_STEP.mvp;

/** Um passo: evolui pra próxima espécie do caminho, ou (Treino) +1 evolução de bônus sem mudar a espécie. */
export function evoStep(inst: PokemonInstance, e: Pick<UtEvo, 'path' | 'role' | 'step'>): PokemonInstance {
    const into = e.path[e.step];
    return into ? evolveInstance(inst, into, e.role) : { ...inst, evolved: (inst.evolved ?? 0) + 1 };
}

/** A prévia: a carta depois de todos os passos que faltam (o que ela vai ser no fim). */
export function evoPreview(inst: PokemonInstance, e: Pick<UtEvo, 'path' | 'role' | 'step'>): PokemonInstance {
    let out = inst;
    for (let step = e.step; step < evoSteps(e); step++) out = evoStep(out, { ...e, step });
    return out;
}

export function newEvo(inst: PokemonInstance, path: number[]): UtEvo {
    return {
        uid: inst.uid,
        path,
        role: viewInstance(inst).naturalPosition,
        step: 0,
        prog: { played: 0, goals: 0, mvp: 0 },
    };
}

/** Conta a partida nas Evoluções: quem entrou em quadra pelo seu time (`players`) e o craque do seu time. */
export function countEvos(evos: UtEvo[], players: readonly PlayerSummary[], mvpUid: string | null): UtEvo[] {
    return evos.map((e) => {
        const p = players.find((x) => x.team === 0 && x.uid === e.uid);
        if (!p || evoReady(e)) return e;
        const goals = e.role === 'GK' ? p.stats.saves : p.stats.goals;
        return {
            ...e,
            prog: {
                played: Math.min(EVO_STEP.played, e.prog.played + 1),
                goals: Math.min(evoGoalsNeed(e), e.prog.goals + goals),
                mvp: Math.min(EVO_STEP.mvp, e.prog.mvp + (mvpUid === e.uid ? 1 : 0)),
            },
        };
    });
}

const POS: Position[] = ['GK', 'FIXO', 'ALA', 'PIVO'];
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

/** Evoluções vindas do save: só as de cartas da coleção, com caminho que a carta pode fazer. */
export function evosOf(raw: unknown, cards: readonly PokemonInstance[]): UtEvo[] {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((r): UtEvo[] => {
        if (!r || typeof r !== 'object') return [];
        const e = r as Partial<UtEvo>;
        const card = cards.find((c) => c.uid === e.uid);
        if (!card || !Array.isArray(e.path) || !POS.includes(e.role as Position)) return [];
        const step = n(e.step);
        const path = e.path.filter((x): x is number => typeof x === 'number');
        if (step >= (path.length || TRAIN_STEPS)) return [];
        const p = (e.prog ?? {}) as Partial<UtEvo['prog']>;
        return [
            {
                uid: card.uid,
                path,
                role: e.role as Position,
                step,
                prog: { played: n(p.played), goals: n(p.goals), mvp: n(p.mvp) },
            },
        ];
    });
}
