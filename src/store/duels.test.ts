import { describe, expect, it } from 'vitest';
import { type DuelRecord, rivalTally } from './duels';

const duel = (id: string, rival: string, result: DuelRecord['result'], rivalCode?: string): DuelRecord => ({
    id,
    date: 0,
    mode: 'disputa',
    rival,
    rivalClub: `${rival} FC`,
    rivalCode,
    score: [1, 0],
    shootout: null,
    result,
});

describe('rivalTally', () => {
    it('um placar por amigo, o mais recente primeiro; anulada não conta', () => {
        const rows = rivalTally([
            duel('a', 'Gary', 'win', 'GARY01'),
            duel('b', 'Misty', 'loss'),
            duel('c', 'Gary', 'loss', 'GARY01'),
            duel('d', 'Gary', 'draw', 'GARY01'),
            duel('e', 'Misty', 'void'),
        ]);
        expect(rows.map((r) => [r.rival, r.win, r.draw, r.loss])).toEqual([
            ['Gary', 1, 1, 1],
            ['Misty', 0, 0, 1],
        ]);
    });
    it('sem código, o mesmo nome em clubes diferentes são dois rivais', () => {
        const other = { ...duel('b', 'Ash', 'win'), rivalClub: 'Outro FC' };
        expect(rivalTally([duel('a', 'Ash', 'win'), other])).toHaveLength(2);
    });
});
