import type { Position } from '../engine/attributes';
import { species } from '../engine/data';
import { type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import type { Tactic } from '../engine/state';
import { ratingAt } from './rating';

/** Diferença mínima de nota pra valer uma linha de dica depois da derrota. */
const MIN_GAP = 8;

export type LineupFact =
    | { kind: 'bench'; role: Position; starter: string; rating: number; bench: string; benchRating: number }
    | { kind: 'off'; role: Position; name: string; rating: number; best: Position; bestRating: number };

const nameOf = (p: PokemonInstance) => p.nickname ?? species(p.speciesId).name;

/**
 * O fato da escalação que mais custou na copa que caiu: o maior entre "titular fraco na vaga com alguém muito melhor
 * no banco" e "titular fora de posição que renderia mais na principal". Nota na vaga (`ratingAt`, a da carta).
 * Sem diferença relevante (< MIN_GAP), sem fato. Ditto fica de fora (a nota dele só vale em campo).
 */
export function lineupFact(
    lineup: readonly PokemonInstance[],
    bench: readonly PokemonInstance[],
    formation: FormationId | undefined,
): LineupFact | null {
    const slots = formationOf(formation).slots;
    let best: { gap: number; fact: LineupFact } | null = null;
    const offer = (gap: number, fact: LineupFact) => {
        if (gap >= MIN_GAP && (!best || gap > best.gap)) best = { gap, fact };
    };
    lineup.forEach((p, i) => {
        const role = slots[i];
        if (!role || role === 'GK' || p.speciesId === 132) return;
        const mine = ratingAt(p, role);
        for (const b of bench) {
            if (b.speciesId === 132) continue;
            const br = ratingAt(b, role).rating;
            offer(br - mine.rating, {
                kind: 'bench',
                role,
                starter: nameOf(p),
                rating: mine.rating,
                bench: nameOf(b),
                benchRating: br,
            });
        }
        if (mine.fit === 'off') {
            const pos = (['FIXO', 'ALA', 'PIVO'] as Position[])
                .map((r) => ({ r, v: ratingAt(p, r).rating }))
                .sort((a, b) => b.v - a.v)[0];
            offer(pos.v - mine.rating, {
                kind: 'off',
                role,
                name: nameOf(p),
                rating: mine.rating,
                best: pos.r,
                bestRating: pos.v,
            });
        }
    });
    return (best as { fact: LineupFact } | null)?.fact ?? null;
}

export interface HalftimeCtx {
    formation: FormationId | undefined;
    tactic: Tactic;
    /** Seu placar menos o do rival no intervalo. */
    diff: number;
    /** Quantos do elenco (quadra + banco) têm 70+ de nota de Fixo. */
    strongFixos: number;
}

export type CoachId = 'behind' | 'ahead' | 'fixos' | 'tactic';

/** A primeira dica que serve e ainda não foi dada (na ordem de prioridade). */
export function halftimeCoachId(c: HalftimeCtx, seen: ReadonlySet<string>): CoachId | null {
    const cands: [CoachId, boolean][] = [
        ['behind', c.diff < 0 && c.tactic !== 'offensive'],
        ['ahead', c.diff > 0 && c.tactic !== 'defensive'],
        ['fixos', (c.formation ?? '1-2-1') === '1-2-1' && c.strongFixos >= 2],
        ['tactic', c.diff === 0 && c.tactic === 'balanced'],
    ];
    return cands.find(([id, ok]) => ok && !seen.has(id))?.[0] ?? null;
}

const seenByCup = new Map<string, Set<string>>();
const chosen = new Map<string, CoachId | null>();

/** A dica do intervalo `key` (copa + fase): escolhida uma vez, e nenhuma se repete na mesma copa. */
export function pickHalftimeCoach(cup: string, key: string, c: HalftimeCtx): CoachId | null {
    const k = `${cup}:${key}`;
    if (chosen.has(k)) return chosen.get(k) ?? null;
    const seen = seenByCup.get(cup) ?? new Set<string>();
    const id = halftimeCoachId(c, seen);
    if (id) seenByCup.set(cup, seen.add(id));
    chosen.set(k, id);
    return id;
}

export const countStrongFixos = (squad: readonly PokemonInstance[]) =>
    squad.filter((p) => p.speciesId !== 132 && ratingAt(p, 'FIXO').rating >= 70).length;
