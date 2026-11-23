import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { useGame } from './game-store';

const g = () => useGame.getState();

describe('revanche', () => {
    it('mantém elenco, formação e capitão; muda seed e chave; pula o draft', () => {
        g().newRun('Pallet FC', 'copa-velha');
        g().autoDraft();
        const old = g().run!;
        expect(old.status).toBe('lineup');
        useGame.setState({ run: { ...old, status: 'eliminated' } });
        g().rematch();
        const run = g().run!;
        expect(run.seed).not.toBe('copa-velha');
        expect(run.status).toBe('lineup');
        expect(run.rematch).toBe(true);
        expect(run.picks.map((p) => p.uid)).toEqual(old.picks.map((p) => p.uid));
        expect(run.lineup).toEqual(old.lineup);
        expect(run.bench).toEqual(old.bench);
        expect(run.captainUid).toBe(old.captainUid);
        expect(run.formation).toBe(old.formation);
        expect(run.stage).toBe(0);
        expect(run.results).toEqual([]);
        expect(g().screen).toBe('lineup');
    });

    it('Copa do Dia, Rota e copa em andamento não têm revanche', () => {
        g().newRun('Pallet FC', 'x');
        const r = g().run!;
        for (const patch of [{ daily: '2026-11-23' }, { mode: 'longa' as const }, { status: 'drafting' as const }]) {
            useGame.setState({ run: { ...r, status: 'eliminated', ...patch } });
            g().rematch();
            expect(g().run?.rematch).toBeUndefined();
        }
    });
});
