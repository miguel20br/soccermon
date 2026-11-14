import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeRecords } from '../cloud/reconcile-plan';
import { FUTSAL_5 } from '../engine/config';
import { species } from '../engine/data';
import { ROUTE_START_BANNED, rootOf } from '../engine/draft';
import { runMatch } from '../engine/runners/batch-runner';
import { playerTeam, useGame } from './game-store';

const g = () => useGame.getState();
const names = (ids: number[]) => ids.map((i) => species(i).name);

describe('Rota Índigo: pré-evoluções e semente travada', () => {
    it('rootOf: forma-base da linha; sem linha fica como está', () => {
        expect(species(rootOf(6)).name).toBe(species(4).name); // Charizard -> Charmander
        expect(rootOf(4)).toBe(4);
        expect(rootOf(143)).toBe(143); // Snorlax
    });

    it('draft da Rota só oferece forma-base (capitão e vagas) e nunca os sem-linha fortes', () => {
        for (let k = 0; k < 6; k++) {
            g().newRun('T', `baby-${k}`, undefined, 'longa');
            g().chooseFormation('2-2');
            const all = [...g().run!.options];
            g().autoDraft();
            all.push(...g().run!.picks);
            for (const p of all) expect(ROUTE_START_BANNED.has(p.speciesId)).toBe(false);
            // forma-base, salvo se a base já estava no time (então fica a original: raro)
            const evolved = g().run!.picks.filter((p) => rootOf(p.speciesId) !== p.speciesId);
            expect(evolved.length, names(evolved.map((p) => p.speciesId)).join()).toBeLessThanOrEqual(1);
        }
    });

    it('Copa rápida não muda: pode sair espécie evoluída', () => {
        let evolved = 0;
        for (let k = 0; k < 6; k++) {
            g().newRun('T', `rapida-${k}`);
            g().autoDraft();
            evolved += g().run!.picks.filter((p) => rootOf(p.speciesId) !== p.speciesId).length;
        }
        expect(evolved).toBeGreaterThan(0);
    });

    it('abandonar dá a mesma Rota (mesmo capitão); terminar avança', () => {
        useGame.setState({ records: { cups: 0, titles: 0, perfect: 0 } });
        g().newRun('T', undefined, undefined, 'longa');
        const first = g().run!;
        const cap = first.options.map((o) => o.uid);
        g().abandonRun();
        g().newRun('T', undefined, undefined, 'longa');
        expect(g().run!.seed).toBe(first.seed);
        expect(g().run!.options.map((o) => o.uid)).toEqual(cap);
        expect(g().records.routeLock?.n).toBe(0);
        // outra Rota, sem ?seed=: não mexe no travamento
        g().newRun('T', 'desafio', undefined, 'longa');
        expect(g().run!.seed).toBe('desafio');
        expect(g().records.routeLock?.n).toBe(0);
    });

    it('terminar a Rota (título ou eliminação) avança o n; a seguinte é outra Rota', () => {
        useGame.setState({ records: { cups: 0, titles: 0, perfect: 0 } });
        g().newRun('T', undefined, undefined, 'longa');
        g().autoDraft();
        const seed = g().run!.seed;
        const run = g().run!;
        // parado no fim das eliminatórias, sem cartão amarelo sobrando: perder ou ganhar a final acaba a Rota
        const results = Array.from({ length: 7 }, (_, stage) => ({
            stage,
            opponent: 'x',
            score: [2, 1] as [number, number],
            shootout: null,
            won: true,
        }));
        useGame.setState({ run: { ...run, stage: 6, results, status: 'group', group: { rivals: [] } as never } });
        g().playNext();
        const now = g().run!;
        const team = playerTeam(now, 15221311);
        g().lockMatch(team);
        g().recordResult(runMatch(FUTSAL_5, team, now.opponents[7], `${now.seed}-stage-7`));
        expect(['eliminated', 'champion']).toContain(g().run!.status);
        expect(g().records.routeLock?.n).toBe(1);
        g().newRun('T', undefined, undefined, 'longa');
        expect(g().run!.seed).not.toBe(seed);
    });

    it('mergeRecords: routeLock fica com o maior n, e os dois lados escolhem igual', () => {
        const a = { cups: 1, titles: 0, perfect: 0, routeLock: { salt: 'b', n: 1 } };
        const b = { cups: 0, titles: 0, perfect: 0, routeLock: { salt: 'a', n: 3 } };
        expect(mergeRecords(a, b).routeLock).toEqual({ salt: 'a', n: 3 });
        expect(mergeRecords(b, a).routeLock).toEqual({ salt: 'a', n: 3 });
        const tie = { ...b, routeLock: { salt: 'z', n: 1 } };
        expect(mergeRecords(a, tie).routeLock).toEqual(mergeRecords(tie, a).routeLock);
        expect(mergeRecords({ cups: 0, titles: 0, perfect: 0 }, a).routeLock).toEqual(a.routeLock);
    });
});
