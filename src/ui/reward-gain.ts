import type { Position } from '../engine/attributes';
import { positionFactor, positionRating } from '../engine/attributes';
import { formationOf } from '../engine/formations';
import { instanceBase, instancePositions, type PokemonInstance, viewInstance } from '../engine/instance';
import { cardAttributes, type TeamContext } from '../engine/modifiers';
import type { Reward } from '../engine/rewards';
import type { RunState } from '../store/game-store';

export interface RewardGain {
    uid: string;
    name: string;
    before: number;
    after: number;
}

/** Nota em campo na vaga: a mesma conta da carta com Eviolite (`cardAttributes` = regra única de bônus, `PokeCard2`). */
export function fieldRating(inst: PokemonInstance, role: Position | null, ctx: TeamContext): number {
    const view = viewInstance(inst);
    const pos = role ?? view.naturalPosition;
    const { field } = cardAttributes(inst, { ...ctx, role });
    const positions = instancePositions(inst, instanceBase(inst));
    return Math.round(positionRating(field, pos) * positionFactor(positions, pos, field));
}

/**
 * Quem do time ganha nota com um item (segurando) ou Patrocínio, antes → depois, do que mais ganha pro que menos.
 * Item sem efeito em número (Leftovers) e recompensa de outro tipo voltam vazios.
 */
export function rewardGains(run: RunState, reward: Reward | null): RewardGain[] {
    if (reward?.kind !== 'item' && reward?.kind !== 'sponsor') return [];
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const slots = formationOf(run.formation).slots;
    const get = (us: readonly string[]) => us.flatMap((u) => byUid.get(u) ?? []);
    const captain = (run.captainUid && byUid.get(run.captainUid)) || null;
    const sponsors = run.sponsors ?? [];
    const base: TeamContext = { lineup: get(run.lineup), rest: get(run.bench), captain, sponsors };
    const next: TeamContext = reward.kind === 'sponsor' ? { ...base, sponsors: [...sponsors, reward.id] } : base;
    const out: RewardGain[] = [];
    for (const [i, uid] of [...run.lineup, ...run.bench].entries()) {
        const inst = byUid.get(uid);
        if (!inst) continue;
        const role = i < run.lineup.length ? slots[i] : null;
        // a conta do ganho usa o time inteiro (capitão, sinergia, Patrocínios); o "antes" mostrado é o número da
        // prancheta, e o "depois" soma o ganho nele (a prancheta não mostra o bônus do time)
        const gain =
            fieldRating(reward.kind === 'item' ? { ...inst, item: reward.item } : inst, role, next) -
            fieldRating(inst, role, base);
        const before = fieldRating(inst, role, {});
        const after = before + gain;
        if (gain > 0) out.push({ uid, name: viewInstance(inst).displayName, before, after });
    }
    return out.sort((a, b) => b.after - b.before - (a.after - a.before));
}
