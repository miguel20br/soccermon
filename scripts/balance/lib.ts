// Helpers do audit de balanceamento (não edita nada do repo).
export { FUTSAL_5 } from '../../src/engine/config';

import { FUTSAL_5 } from '../../src/engine/config';
import { SPECIES, species } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import { type FormationId, formationOf } from '../../src/engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../src/engine/instance';
import { attributeModifiers } from '../../src/engine/modifiers';
import { everyoneIn } from '../../src/engine/mvp';
import { Rng } from '../../src/engine/rng';
import { type MatchResult, runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { ratingAt } from '../../src/ui/rating';

export type { FormationId, MatchResult, PokemonInstance, TeamSetup };
export {
    aiDraftTeam,
    createInstance,
    everyoneIn,
    formationOf,
    Rng,
    ratingAt,
    runMatch,
    SPECIES,
    species,
    viewInstance,
};

export const bestOverall = (p: PokemonInstance) => viewInstance(p).overall;

export function captainOf(lineup: PokemonInstance[]) {
    return lineup.reduce((b, p) => (bestOverall(p) > bestOverall(b) ? p : b)).uid;
}

/** Nota média na vaga (como a UI mostra). */
export function slotAvg(t: TeamSetup) {
    const slots = formationOf(t.formation).slots;
    return t.lineup.reduce((s, p, i) => s + ratingAt(p, slots[i]).rating, 0) / t.lineup.length;
}

/** Multiplicador médio de time (capitão × sinergia de tipo × história), como o motor aplica. */
export function teamMult(t: TeamSetup) {
    const cap = t.lineup.find((p) => p.uid === t.captainUid) ?? null;
    let sum = 0;
    const parts = { cap: 0, syn: 0, link: 0 };
    for (const p of t.lineup) {
        let f = 1;
        for (const m of attributeModifiers(p, { lineup: t.lineup, captain: cap })) {
            if (!m.factor) continue;
            if (m.source === 'capitao') parts.cap += m.factor - 1;
            if (m.source === 'sinergia') parts.syn += m.factor - 1;
            if (m.source === 'historia') parts.link += m.factor - 1;
            if (m.source === 'capitao' || m.source === 'sinergia' || m.source === 'historia') f *= m.factor;
        }
        sum += f;
    }
    const n = t.lineup.length;
    return { mult: sum / n, cap: parts.cap / n, syn: parts.syn / n, link: parts.link / n };
}

export function baseTeams(i: number, formation: FormationId = '1-2-1') {
    const mk = (side: string): TeamSetup => ({
        name: side,
        ...aiDraftTeam(new Rng(`base-${i}`, side), 1, [], formation),
        tactic: 'balanced',
        color: 0,
        formation,
    });
    return { A: mk('A'), B: mk('B') };
}

/** Coloca a espécie `s` no time na vaga da posição natural dela. null se não der. */
export function insertSpecies(
    t: TeamSetup,
    s: number,
    i: number,
    ability?: string,
): { team: TeamSetup; inst: PokemonInstance } | null {
    const all = [...t.lineup, ...t.bench];
    if (all.some((p) => p.speciesId === s)) return null;
    const inst = createInstance(s, new Rng(`ins-${i}-${s}`));
    inst.shiny = false;
    if (ability) inst.ability = ability;
    const pos = viewInstance(inst).naturalPosition;
    const slots = formationOf(t.formation).slots;
    const idxs = slots.map((r, k) => (r === pos ? k : -1)).filter((k) => k >= 0);
    if (!idxs.length) return null;
    const k = idxs[i % idxs.length];
    const lineup = [...t.lineup];
    lineup[k] = inst;
    return { team: { ...t, lineup, captainUid: captainOf(lineup) }, inst };
}

// ---------- coleta de golpes ----------
export interface MoveAgg {
    carriers: number;
    uses: number;
    hits: number;
    shots: number;
    goals: number;
    xg: number;
    winsCarrier: number;
}
export const moveAgg = new Map<string, MoveAgg>();
const ma = (id: string) => {
    let x = moveAgg.get(id);
    if (!x) moveAgg.set(id, (x = { carriers: 0, uses: 0, hits: 0, shots: 0, goals: 0, xg: 0, winsCarrier: 0 }));
    return x;
};
export const shotAgg = { normalShots: 0, normalGoals: 0, normalXg: 0 };
export const abilityEv = new Map<string, number>();
export const itemEv = new Map<string, number>();
export const traitEv = new Map<string, number>();
export let matchesSeen = 0;
export const roleAgg = new Map<string, { carriers: number; uses: number }>();
const ra = (k: string) => {
    let x = roleAgg.get(k);
    if (!x) roleAgg.set(k, (x = { carriers: 0, uses: 0 }));
    return x;
};

export function collect(r: MatchResult, home: TeamSetup, away: TeamSetup) {
    matchesSeen++;
    const insts = new Map([...home.lineup, ...home.bench, ...away.lineup, ...away.bench].map((p) => [p.uid, p]));
    for (const pl of everyoneIn(r)) {
        const inst = insts.get(pl.uid);
        if (!inst) continue;
        for (const m of new Set(inst.moves)) {
            const x = ma(m);
            x.carriers++;
            if (r.winner === pl.team) x.winsCarrier++;
            ra(`${m}@${pl.role}`).carriers++;
        }
    }
    let last: { by: number; moveId: string | null } | null = null;
    for (const e of r.events) {
        if (e.type === 'move') {
            const x = ma(e.moveId);
            x.uses++;
            if (e.hit) x.hits++;
            const who = r.finalRoster.find((q) => q.idx === e.by);
            if (who) ra(`${e.moveId}@${who.role}`).uses++;
        } else if (e.type === 'shot') {
            last = { by: e.by, moveId: e.moveId };
            if (e.moveId) {
                const x = ma(e.moveId);
                x.shots++;
                x.xg += e.xg;
            } else {
                shotAgg.normalShots++;
                shotAgg.normalXg += e.xg;
            }
        } else if (e.type === 'goal' && !e.ownGoal) {
            if (last && last.by === e.by) {
                if (last.moveId) ma(last.moveId).goals++;
                else shotAgg.normalGoals++;
            }
            last = null;
        } else if (e.type === 'ability') abilityEv.set(e.ability, (abilityEv.get(e.ability) ?? 0) + 1);
        else if (e.type === 'item') itemEv.set(`${e.item}:${e.effect}`, (itemEv.get(`${e.item}:${e.effect}`) ?? 0) + 1);
        else if (e.type === 'trait') traitEv.set(e.fx, (traitEv.get(e.fx) ?? 0) + 1);
    }
}

export function play(home: TeamSetup, away: TeamSetup, seed: string) {
    const r = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
    collect(r, home, away);
    return r;
}

export function dumpAgg() {
    return {
        matches: matchesSeen,
        moves: Object.fromEntries(moveAgg),
        shotAgg,
        abilityEv: Object.fromEntries(abilityEv),
        itemEv: Object.fromEntries(itemEv),
        traitEv: Object.fromEntries(traitEv),
        roleAgg: Object.fromEntries(roleAgg),
    };
}
