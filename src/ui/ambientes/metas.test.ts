import { describe, expect, it } from 'vitest';
import type { Mission, SaveView } from '../../store/missions';
import {
    avatarMon,
    closestMissions,
    countAt,
    myMon,
    nextBelt,
    oakLine,
    type PathStep,
    pathWindow,
    routeTeam,
    trainerLevel,
    trainerPath,
} from './metas';

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

describe('trainerPath (Caminho do treinador)', () => {
    const prize = (m: Mission, extra: Partial<Mission>): Mission => ({ ...m, ...extra });
    const list: Mission[] = [
        prize(counter('ace', 5, 3), { trainer: 'acetrainer', title: 'mestre' }),
        prize(feat('ash'), { trainer: 'ash' }),
        prize(counter('dex', 151, 30), { title: 'colecionador' }),
        counter('semPremio', 2, 1),
        prize(feat('brock'), { trainer: 'brock' }),
    ];
    const label = (s: { prize: { kind: string; m?: Mission; metal?: string; level?: string } }) =>
        s.prize.kind === 'mission' ? s.prize.m?.id : `${s.prize.kind}:${s.prize.metal ?? s.prize.level}`;

    it('o próximo é o prêmio mais perto de sair, depois dos ganhos; missão sem prêmio fica fora', () => {
        const { steps, next } = trainerPath(view(['brock']), ['brock'], 0, 0, 3, 8, list);
        expect(steps.map(label)).toEqual(['brock', 'ace', 'dex', 'ash', 'room:clube', 'belt:bronze']);
        expect(next).toBe(1);
        expect(steps[next]).toMatchObject({ n: 3, goal: 5, done: false });
        expect(steps[0].done).toBe(true);
    });
    it('cinturão e sala entram pela fração: 9 de 10 vitórias passa na frente das missões', () => {
        const { steps, next } = trainerPath(view(), [], 9, 0, 3, 8, list);
        expect(label(steps[next])).toBe('belt:bronze');
        expect(steps[next]).toMatchObject({ n: 9, goal: 10 });
    });
    it('ganhos à esquerda (os últimos), sem próximo com tudo ganho', () => {
        const all = list.map((m) => m.id);
        const { steps, next } = trainerPath(view(all), all, 100, 25, 3, 8, list);
        expect(next).toBe(-1);
        expect(steps.map(label)).toEqual(['ash', 'dex', 'brock']);
    });
});

describe('nextBelt', () => {
    it('conta até o próximo cinturão e para no de ouro', () => {
        expect(nextBelt(0)).toEqual({ metal: 'bronze', n: 0, goal: 10 });
        expect(nextBelt(10)).toEqual({ metal: 'prata', n: 10, goal: 50 });
        expect(nextBelt(100)).toBeNull();
    });
});

describe('routeTeam (quem anda no mapa da Rota)', () => {
    const pick = (uid: string, speciesId: number, shiny?: boolean) => ({ uid, speciesId, shiny });
    const ids = (team: { id: number }[]) => team.map((m) => m.id);
    it('Rota aberta ainda na formação (sem ninguém escolhido): o avatar no ponto de partida, nunca o mapa vazio', () => {
        expect(ids(routeTeam({ picks: [], lineup: [], captainUid: null }, true, { id: 6 }))).toEqual([6]);
        expect(routeTeam({ picks: [], lineup: [], captainUid: null }, true, avatarMon({ kind: 'google' }))).toEqual([
            { id: 25 },
        ]);
    });
    it('draft sem escalação: o 1º escolhido; com escalação: capitão na frente e mais 2', () => {
        expect(ids(routeTeam({ picks: [pick('a', 4)], lineup: [], captainUid: null }, true, { id: 6 }))).toEqual([4]);
        const run = {
            picks: [pick('a', 4), pick('b', 7), pick('c', 1), pick('d', 25)],
            lineup: ['b', 'a', 'c', 'd'],
            captainUid: 'a',
        };
        expect(ids(routeTeam(run, true, { id: 6 }))).toEqual([4, 7, 1]);
    });
    it('sem Rota aberta: o avatar sozinho em Pallet', () => {
        expect(ids(routeTeam({ picks: [pick('a', 4)], lineup: ['a'], captainUid: 'a' }, false, { id: 133 }))).toEqual([
            133,
        ]);
    });
    it('o shiny não some no mapa: avatar shiny e capitão shiny andam com a folha shiny', () => {
        const mew = avatarMon({ kind: 'pokemon', speciesId: 151, shiny: true });
        expect(routeTeam(null, false, mew)).toEqual([{ id: 151, shiny: true }]);
        const run = { picks: [pick('a', 6, true), pick('b', 7)], lineup: ['a', 'b'], captainUid: 'a' };
        expect(routeTeam(run, true, mew)).toEqual([
            { id: 6, shiny: true },
            { id: 7, shiny: false },
        ]);
        expect(avatarMon({ kind: 'pokemon', speciesId: 151 })).toEqual({ id: 151, shiny: false });
    });
});

describe('contador', () => {
    it('o contador sobe de 0 ao alvo, inteiro, sem passar nem voltar', () => {
        const seen = [0, 50, 100, 200, 350, 500, 650, 699, 700, 900].map((ms) => countAt(120, ms));
        expect(seen[0]).toBe(0);
        expect(seen.at(-1)).toBe(120);
        expect(countAt(120, 700)).toBe(120);
        for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
        expect(seen.every((v) => Number.isInteger(v) && v <= 120)).toBe(true);
        // começa rápido: na metade do tempo já passou de 80%
        expect(countAt(120, 350)).toBeGreaterThan(96);
        expect(countAt(0, 100)).toBe(0);
    });
});

describe('trainerLevel', () => {
    it('sobe em degraus de 1, 2, 2, 3, 3… missões', () => {
        expect(trainerLevel(0)).toEqual({ level: 1, n: 0, goal: 1 });
        expect(trainerLevel(1)).toEqual({ level: 2, n: 0, goal: 2 });
        expect(trainerLevel(2)).toEqual({ level: 2, n: 1, goal: 2 });
        expect(trainerLevel(3)).toEqual({ level: 3, n: 0, goal: 2 });
        expect(trainerLevel(5)).toEqual({ level: 4, n: 0, goal: 3 });
        expect(trainerLevel(7)).toEqual({ level: 4, n: 2, goal: 3 });
    });
    it('as 63 missões fecham o nível 15 e o número nunca volta', () => {
        expect(trainerLevel(63).level).toBe(15);
        expect(trainerLevel(62).level).toBe(14);
        let prev = 0;
        for (let d = 0; d <= 80; d++) {
            const { level, n, goal } = trainerLevel(d);
            expect(level).toBeGreaterThanOrEqual(prev);
            expect(n).toBeLessThan(goal);
            prev = level;
        }
        expect(trainerLevel(-3)).toEqual({ level: 1, n: 0, goal: 1 });
    });
});

describe('myMon (o seu Pokémon nos ambientes)', () => {
    const pika = { kind: 'pokemon', speciesId: 25 } as const;
    it('depois de eliminado continua o capitão do último time, não o Pikachu do avatar padrão', () => {
        const run = {
            picks: [
                { uid: 'a', speciesId: 7 },
                { uid: 'b', speciesId: 6, shiny: true },
            ],
            captainUid: 'b',
        };
        expect(myMon(run, pika)).toEqual({ id: 6, shiny: true });
        expect(myMon({ ...run, captainUid: null }, pika)).toEqual({ id: 7, shiny: false });
    });
    it('sem time montado, o avatar', () => {
        expect(myMon(null, pika)).toEqual({ id: 25, shiny: false });
        expect(myMon({ picks: [], captainUid: null }, { kind: 'google' })).toEqual({ id: 25 });
    });
});

describe('pathWindow (o Caminho no tapete da Sede)', () => {
    const steps = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}` }) as PathStep);
    const ids = (xs: PathStep[]) => xs.map((x) => x.id);
    it('o último ganho, o próximo e o seguinte', () => {
        expect(ids(pathWindow(steps(8), 3))).toEqual(['s2', 's3', 's4']);
    });
    it('sem nada ganho, o próximo primeiro; o próximo no fim da estrada não corta o passo', () => {
        expect(ids(pathWindow(steps(8), 0))).toEqual(['s0', 's1', 's2']);
        expect(ids(pathWindow(steps(4), 3))).toEqual(['s1', 's2', 's3']);
    });
    it('com tudo ganho, os 3 últimos; estrada curta, o que tiver', () => {
        expect(ids(pathWindow(steps(5), -1))).toEqual(['s2', 's3', 's4']);
        expect(ids(pathWindow(steps(2), 1))).toEqual(['s0', 's1']);
    });
});

describe('oakLine (a fala do Carvalho no Lab)', () => {
    // 30 Pokémon: 1–20 Normal, 21–25 Gelo, 26–30 Fogo/Gelo
    const list = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        types: i < 20 ? ['normal'] : i < 25 ? ['ice'] : ['fire', 'ice'],
    }));
    const upTo =
        (n: number, also: number[] = []) =>
        (id: number) =>
            id <= n || also.includes(id);
    it('no começo, quanto falta (draft e rival já contam)', () => {
        expect(oakLine(upTo(5), 0, 0, list)).toEqual({ k: 'start', n: 25 });
    });
    it('depois, o tipo com menos faltando; empate fica com o 1º que falta', () => {
        // faltam 21–24 (Gelo) e 30 (Fogo/Gelo): Fogo 1, Gelo 5
        expect(oakLine(upTo(20, [25, 26, 27, 28, 29]), 0, 0, list)).toEqual({ k: 'type', n: 1, type: 'fire' });
        // faltam 21 e 26: Gelo 2, Fogo 1
        expect(oakLine((id) => id !== 21 && id !== 26, 0, 0, list)).toEqual({ k: 'type', n: 1, type: 'fire' });
        // faltam 2 Normal (19, 20) e 1 Gelo (25): o Gelo, com menos faltando
        expect(oakLine((id) => ![19, 20, 25].includes(id), 0, 0, list)).toEqual({ k: 'type', n: 1, type: 'ice' });
        // empate 1 a 1: o 1º que falta na ordem da Pokédex (Normal, nº 20)
        expect(oakLine((id) => ![20, 25].includes(id), 0, 0, list)).toEqual({ k: 'type', n: 1, type: 'normal' });
    });
    it('Pokédex cheia: o Álbum, depois a Golpedex, depois tudo feito', () => {
        const all = () => true;
        expect(oakLine(all, 12, 3, list)).toEqual({ k: 'album', n: 12 });
        expect(oakLine(all, 0, 3, list)).toEqual({ k: 'moves', n: 3 });
        expect(oakLine(all, 0, 0, list)).toEqual({ k: 'done' });
    });
});
