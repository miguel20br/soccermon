import { dailyDay, weekOf } from '../daily';
import { type Level, OBJECTIVES, type Objective, type Outcome } from './rules';

/**
 * Objetivos diários e semanais do Time Ultimate (a tabela fica em rules.ts). O dia vira à meia-noite de Brasília, como
 * a Copa do Dia; a semana começa na segunda. O relógio (`now`, ms) é sempre de quem chama, pra dar pra testar.
 */
export interface ObjectiveState {
    /** Dia ('2026-11-01') e segunda-feira da semana do progresso guardado. */
    day: string;
    week: string;
    prog: Record<string, number>;
    /** Os que já pagaram neste período. */
    done: string[];
}

export const periodKeys = (now: number) => {
    const day = dailyDay(new Date(now));
    return { day, week: weekOf(day)[0] };
};

export const newObjectives = (now: number): ObjectiveState => ({ ...periodKeys(now), prog: {}, done: [] });

const byId = new Map(OBJECTIVES.map((o) => [o.id, o]));

/** O estado no relógio `now`: virou o dia (ou a semana), os objetivos daquele período recomeçam do zero. */
export function objectivesAt(g: ObjectiveState, now: number): ObjectiveState {
    const k = periodKeys(now);
    if (g.day === k.day && g.week === k.week) return g;
    const keep = (id: string) => {
        const o = byId.get(id);
        return !!o && (o.period === 'day' ? g.day === k.day : g.week === k.week);
    };
    return {
        ...k,
        prog: Object.fromEntries(Object.entries(g.prog).filter(([id]) => keep(id))),
        done: g.done.filter(keep),
    };
}

/** O que uma partida conta pros objetivos. */
export interface ObjectiveMatch {
    outcome: Outcome;
    level: Level;
    /** Gols do seu time no tempo normal. */
    goals: number;
    /** Nenhum titular Ouro (o objetivo com restrição). */
    noGold: boolean;
}

function gain(o: Objective, m: ObjectiveMatch): number {
    const win = m.outcome === 'win' ? 1 : 0;
    switch (o.kind) {
        case 'play':
            return 1;
        case 'win':
            return win;
        case 'goals':
            return m.goals;
        case 'winHard':
            return m.level === 'dificil' || m.level === 'mestre' ? win : 0;
        case 'winNoGold':
            return m.noGold ? win : 0;
    }
}

/** Conta a partida: o estado novo e os objetivos que completaram agora (quem chama paga o prêmio). */
export function countObjectives(
    g: ObjectiveState,
    m: ObjectiveMatch,
    now: number,
): { g: ObjectiveState; completed: Objective[] } {
    const cur = objectivesAt(g, now);
    const prog = { ...cur.prog };
    const completed: Objective[] = [];
    for (const o of OBJECTIVES) {
        if (cur.done.includes(o.id)) continue;
        prog[o.id] = Math.min(o.goal, (prog[o.id] ?? 0) + gain(o, m));
        if (prog[o.id] >= o.goal) completed.push(o);
    }
    return { g: { ...cur, prog, done: [...cur.done, ...completed.map((o) => o.id)] }, completed };
}

/** Estado vindo do save (antigo ou estragado): o que não serve volta pro padrão. */
export function objectivesOf(raw: unknown, now: number): ObjectiveState {
    if (!raw || typeof raw !== 'object') return newObjectives(now);
    const r = raw as Partial<ObjectiveState>;
    if (typeof r.day !== 'string' || typeof r.week !== 'string') return newObjectives(now);
    const prog: Record<string, number> = {};
    if (r.prog && typeof r.prog === 'object')
        for (const [id, v] of Object.entries(r.prog))
            if (byId.has(id) && typeof v === 'number' && Number.isFinite(v)) prog[id] = Math.max(0, Math.floor(v));
    const done = Array.isArray(r.done)
        ? r.done.filter((id): id is string => typeof id === 'string' && byId.has(id))
        : [];
    return { day: r.day, week: r.week, prog, done };
}

/** Quando os objetivos do período recomeçam (ms): meia-noite de Brasília (UTC−3 fixo desde 2019); a semana, na segunda. */
export function nextReset(now: number, period: Objective['period']): number {
    const { day, week } = periodKeys(now);
    const [y, m, d] = (period === 'day' ? day : week).split('-').map(Number);
    return Date.UTC(y, m - 1, d + (period === 'day' ? 1 : 7), 3);
}
