import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { useGame } from '../store/game-store';
import { holdPair } from './use-held';

describe('holdPair (resultado que sai com "Nova copa")', () => {
    it('Nova copa da Rota: a copa nova nasce sem rivais e a partida some; o par fica o velho', () => {
        const g = () => useGame.getState();
        const ended = { opponents: [{ name: 'Liga Índigo' }], stage: 7 };
        const last = { run: ended, match: { score: [1, 0] } };
        g().newRun('Pallet FC', 'rota-fim-hold', undefined, 'longa');
        const fresh = g().run!;
        // o que quebrava o Result: a copa nova (Rota) não tem rival da fase 0
        expect(fresh.opponents[fresh.stage]).toBeUndefined();
        expect(g().match).toBeNull();
        expect(holdPair(last, fresh, g().match)).toBe(last);
    });
    it('com os dois presentes, o par é o de agora', () => {
        const run = { a: 1 };
        const match = { b: 2 };
        expect(holdPair(null, run, match)).toEqual({ run, match });
        expect(holdPair({ run: { a: 0 }, match }, run, match)?.run).toBe(run);
    });
});
