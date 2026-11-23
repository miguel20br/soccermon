import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { halftimeCoachId, lineupFact, pickHalftimeCoach } from './coach-tips';
import { ratingAt } from './rating';

const rng = new Rng(3, 'coach-tips');
const mk = (id: number) => createInstance(id, rng);

describe('lineupFact (dica pós-jogo)', () => {
    it('acha o banco melhor na vaga e usa a nota na vaga', () => {
        const lineup = [mk(143), mk(95), mk(95), mk(95), mk(95)]; // Onix em quase tudo
        const jolteon = mk(135);
        const f = lineupFact(lineup, [jolteon], '1-2-1');
        expect(f).not.toBeNull();
        if (f?.kind === 'bench') {
            expect(f.bench).toBe('Jolteon');
            expect(f.benchRating).toBe(ratingAt(jolteon, f.role).rating);
            expect(f.benchRating - f.rating).toBeGreaterThanOrEqual(8);
        } else expect(f?.kind).toBe('off');
    });
    it('sem elenco, sem fato', () => {
        expect(lineupFact([], [], '1-2-1')).toBeNull();
    });
});

describe('dica do intervalo', () => {
    const base = { formation: '1-2-1' as const, tactic: 'balanced' as const, diff: -1, strongFixos: 0 };
    it('perdendo sugere o Ofensivo; já no Ofensivo, nada', () => {
        expect(halftimeCoachId(base, new Set())).toBe('behind');
        expect(halftimeCoachId({ ...base, tactic: 'offensive' }, new Set())).toBeNull();
    });
    it('2 Fixos fortes no 1-2-1 sugere a formação', () => {
        expect(halftimeCoachId({ ...base, diff: 1, tactic: 'defensive', strongFixos: 2 }, new Set())).toBe('fixos');
    });
    it('uma por intervalo e nenhuma repete na mesma copa', () => {
        expect(pickHalftimeCoach('copa-a', 'jogo0', base)).toBe('behind');
        expect(pickHalftimeCoach('copa-a', 'jogo0', base)).toBe('behind'); // re-render: a mesma
        expect(pickHalftimeCoach('copa-a', 'jogo1', base)).toBeNull(); // já deu
        expect(pickHalftimeCoach('copa-b', 'jogo0', base)).toBe('behind'); // outra copa
    });
});
