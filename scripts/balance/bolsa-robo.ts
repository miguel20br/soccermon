// Robô da Bolsa (itens-ativos.md, A1): a hora sensata de cada item, usada por coach.ts e long-cup.sim.test.ts (BOLSA=1).
import type { BagItem } from '../../src/engine/bag';
import { minuteOf } from '../../src/engine/match';
import type { MatchState } from '../../src/engine/state';

/**
 * A hora sensata de cada item (o robô da Bolsa; o mesmo do long-cup.sim com BOLSA=1). Poção: 2º tempo a partir dos 28'
 * no mais cansado de linha; X Attack: 2º tempo a partir dos 25' sem estar ganhando; X Defense: 2º tempo a partir dos
 * 30' ganhando; Cura Total: 2 ou mais do time com status ou enfraquecidos. Devolve a ordem (sem tick) ou null.
 */
export function bagPick(s: MatchState, team: 0 | 1, left: readonly BagItem[]) {
    const min = minuteOf(s);
    const diff = s.score[team] - s.score[team === 0 ? 1 : 0];
    const mine = s.players.filter((p) => p.team === team);
    const tired = mine.filter((p) => p.role !== 'GK').sort((a, b) => a.energy - b.energy)[0];
    const hurt = mine.filter((p) => p.status || p.seeded || p.buffs.some((b) => b.factor < 1)).length;
    const want: BagItem[] = [];
    if (hurt >= 2) want.push('fullheal');
    if (s.half === 2 && min >= 25 && diff <= 0) want.push('xattack');
    if (s.half === 2 && min >= 30 && diff >= 1) want.push('xdefense');
    if (s.half === 2 && min >= 28 && tired && tired.energy < 0.6) want.push('potion');
    const item = want.find((i) => left.includes(i));
    if (!item) return null;
    return { kind: 'bag' as const, item, ...(item === 'potion' && { target: (tired.origin ?? tired.inst).uid }) };
}
