import { describe, expect, it } from 'vitest';
import type { Mission, SaveView } from '../../store/missions';
import { closestMissions, nextBelt } from './metas';

const view = (done: string[] = []) => ({ done: new Set(done) }) as unknown as SaveView;
const counter = (id: string, goal: number, n: number): Mission => ({ id, group: 'feitos', goal, count: () => n });
const feat = (id: string): Mission => ({ id, group: 'feitos', match: () => false });

describe('closestMissions', () => {
    it('põe a mais perto de sair na frente e pula as cumpridas', () => {
        const list = [counter('a', 10, 2), counter('b', 5, 4), feat('c'), counter('d', 3, 3)];
        expect(closestMissions(view(['d']), 3, list).map((g) => [g.m.id, g.n, g.goal])).toEqual([
            ['b', 4, 5],
            ['a', 2, 10],
            ['c', 0, 1],
        ]);
    });
    it('no empate em zero, a de meta menor e depois a ordem da tabela', () => {
        const list = [counter('grande', 50, 0), feat('x'), feat('y'), counter('media', 5, 0)];
        expect(closestMissions(view(), 4, list).map((g) => g.m.id)).toEqual(['x', 'y', 'media', 'grande']);
    });
    it('mesmo contador e mesma meta (treinador e título) aparecem uma vez só', () => {
        const seen = () => 18;
        const list: Mission[] = [
            { id: 'oak', group: 'colecao', goal: 151, count: seen },
            { id: 'mestre', group: 'colecao', goal: 151, count: seen },
            feat('x'),
        ];
        expect(closestMissions(view(), 3, list).map((g) => g.m.id)).toEqual(['oak', 'x']);
    });
    it('contador passando da meta não estoura a barra', () => {
        expect(closestMissions(view(), 1, [counter('a', 5, 9)])[0].n).toBe(5);
    });
});

describe('nextBelt', () => {
    it('conta até o próximo cinturão e para no de ouro', () => {
        expect(nextBelt(0)).toEqual({ metal: 'bronze', n: 0, goal: 10 });
        expect(nextBelt(10)).toEqual({ metal: 'prata', n: 10, goal: 50 });
        expect(nextBelt(100)).toBeNull();
    });
});
