import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { FUTSAL_5 } from '../engine/config';
import { runMatch } from '../engine/runners/batch-runner';
import { bolsaAfter, bolsaOffer, setBolsaLab, withBolsa } from './bolsa';
import { playerTeam, useGame } from './game-store';

const g = () => useGame.getState();

describe('Bolsa do técnico na campanha (?lab=itens)', () => {
    afterEach(() => setBolsaLab(false));

    it('desligada (produção): copa sem Bolsa e time sem `bag`', () => {
        g().newRun('T', 'bolsa-off');
        g().autoDraft();
        expect(g().run!.bolsa).toBeUndefined();
        expect(playerTeam(g().run!).bag).toBeUndefined();
    });

    it('ligada: Relâmpago e Rota começam com 1 Poção, a Copa do Dia não; o time leva a Bolsa', () => {
        setBolsaLab(true);
        g().newRun('T', 'bolsa-on');
        expect(g().run!.bolsa).toEqual(['potion']);
        g().autoDraft();
        expect(playerTeam(g().run!).bag).toEqual(['potion']);
        g().newRun('T', 'bolsa-rota', undefined, 'longa');
        expect(g().run!.bolsa).toEqual(['potion']);
        g().newRun('T', undefined, '2026-11-27');
        expect(g().run!.bolsa).toBeUndefined();
    });

    it('o item usado na partida sai da Bolsa', () => {
        setBolsaLab(true);
        g().newRun('T', 'bolsa-use');
        g().autoDraft();
        const run = g().run!;
        g().lockMatch(playerTeam(run, 0xe8423f));
        const cur = g().run!;
        const team = cur.lockedTeam!;
        const m = runMatch(FUTSAL_5, team, cur.opponents[0], `${cur.seed}-stage-0`, {
            orders: [{ tick: 400, team: 0, kind: 'bag', item: 'potion', target: team.lineup[2].uid }],
        });
        expect(m.events.some((e) => e.type === 'bag')).toBe(true);
        g().recordResult(m);
        expect(g().run!.bolsa).toEqual([]);
    });

    it('bolsaAfter tira só o que o seu time usou, um por evento', () => {
        const ev = (team: 0 | 1, item: 'potion' | 'xattack') =>
            ({ type: 'bag', team, item, target: null, tick: 1, half: 1, minute: 0 }) as const;
        expect(bolsaAfter(['potion', 'potion', 'xattack'], [ev(0, 'potion'), ev(1, 'xattack')])).toEqual([
            'potion',
            'xattack',
        ]);
    });

    it('vitrine e recompensa sorteiam num Rng próprio (o resto não muda) e são determinísticas', () => {
        expect(bolsaOffer('s', 'm1', 0)).toEqual(bolsaOffer('s', 'm1', 0));
        const opts = [
            { kind: 'item' as const, item: 'leftovers' },
            { kind: 'item' as const, item: 'lumberry' },
        ];
        let swapped = 0;
        for (let k = 0; k < 40; k++) {
            const out = withBolsa(opts, `s${k}`, 'm', 0);
            expect(out[0]).toBe(opts[0]);
            if (out[1].kind === 'bolsa') swapped++;
            else expect(out[1]).toBe(opts[1]);
        }
        expect(swapped).toBeGreaterThan(0);
        expect(swapped).toBeLessThan(40);
    });
});
