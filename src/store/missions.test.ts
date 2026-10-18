import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../cloud/reconcile-plan';
import { createInstance } from '../engine/instance';
import type { GoalNote } from '../engine/match-stats';
import { Rng } from '../engine/rng';
import { migrateSave, type PersistedSave } from './game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    type MatchView,
    MISSIONS,
    newMissions,
    TRAINERS,
    unlockedTrainers,
} from './missions';
import { DEFAULT_PROFILE, type HallEntry } from './profile';
import { normalizeCode, redeemCode } from './title-codes';

const mon = (speciesId: number) => createInstance(speciesId, new Rng('m', String(speciesId)));
const goal = (team: 0 | 1, uid: string, speciesId = 25): GoalNote =>
    ({ team, uid, speciesId, ownGoal: false }) as GoalNote;
const view = (p: Partial<MatchView>): MatchView => ({
    won: true,
    score: [1, 0],
    shootout: false,
    lineup: [],
    squad: [],
    captain: null,
    goals: [],
    timeline: [],
    evolutions: [],
    links: [],
    ...p,
});
const empty = { records: { titles: 0, perfect: 0 }, dex: {}, moves: {}, career: { goalsFor: 0 }, hall: [], runs: [] };

describe('missões', () => {
    it('cada treinador bloqueado tem uma missão e os ids não se repetem', () => {
        const ids = MISSIONS.map((m) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const t of TRAINERS.slice(4)) expect(MISSIONS.some((m) => m.trainer === t)).toBe(true);
    });

    it('feitos de partida: hat-trick, virada de 2 gols e pênaltis', () => {
        const hat = view({ goals: [goal(0, 'a'), goal(0, 'a'), goal(0, 'a')] });
        const comeback = view({
            score: [3, 2],
            timeline: [
                [0, 1],
                [0, 2],
                [1, 2],
                [2, 2],
                [3, 2],
            ],
        });
        const lost = view({
            won: false,
            score: [0, 2],
            timeline: [
                [0, 1],
                [0, 2],
            ],
        });
        const fresh = newMissions({ ...empty, done: [] }, [hat, comeback, lost, view({ shootout: true })]);
        expect(fresh).toEqual(expect.arrayContaining(['hatTrick', 'rival', 'rocker']));
        // perder de 2 não vale a virada
        expect(newMissions({ ...empty, done: [] }, [lost])).not.toContain('rival');
    });

    it('titulares: Equipe Rocket, capitão Pikachu e goleiro Pedra sem sofrer gol', () => {
        const lineup = [mon(95), mon(23), mon(109), mon(25), mon(1)];
        const links = [{ def: { id: 'rocket' }, members: [], bonus: 1.05, full: false }] as never;
        const fresh = newMissions({ ...empty, done: [] }, [
            view({ lineup, squad: lineup, captain: lineup[3], links, score: [2, 0] }),
        ]);
        expect(fresh).toEqual(expect.arrayContaining(['rocket', 'pokemaniac', 'hiker']));
    });

    it('Kanto Completo sai quando os 8 ginásios estão cumpridos', () => {
        const gyms = ['brock', 'misty', 'ltsurge', 'erika', 'koga', 'sabrina', 'blaine'];
        expect(newMissions({ ...empty, done: gyms })).not.toContain('kanto');
        expect(newMissions({ ...empty, done: [...gyms, 'giovanni'] })).toContain('kanto');
    });

    it('Ash: campeão sofrendo no máximo 5 gols na copa (6 não vale)', () => {
        const entry = (conceded: number[]) =>
            ({ perfect: false, scores: conceded.map((c) => [3, c]), squad: [] }) as unknown as HallEntry;
        expect(newMissions({ ...empty, done: [], hall: [entry([2, 1, 0, 2])] })).toContain('ash');
        expect(newMissions({ ...empty, done: [], hall: [entry([2, 1, 1, 2])] })).not.toContain('ash');
    });

    it('treinador e título só valem se a missão foi cumprida', () => {
        const p = { ...DEFAULT_PROFILE, trainer: 'giovanni' as const, title: 'virada' };
        expect(activeTrainer(p)).toBe('red');
        expect(activeTitle(p)).toBe('pallet');
        const done = { ...p, missionsDone: ['giovanni', 'rival'] };
        expect(activeTrainer(done)).toBe('giovanni');
        expect(activeTitle(done)).toBe('virada');
        expect(unlockedTrainers(done)).toContain('rival');
    });
});

describe('save antigo (v6)', () => {
    const hall: HallEntry[] = [
        {
            id: 's1',
            date: 1,
            club: 'Pallet FC',
            clubColor: 'vermelho',
            formation: '1-2-1',
            titleNo: 1,
            perfect: true,
            scores: [
                [3, 0],
                [2, 0],
                [4, 0],
                [2, 0],
            ],
            squad: [{ speciesId: 149, shiny: false, name: 'Dragonite', ovr: 80, goals: 3, captain: true }],
        },
    ];

    it('carrega com treinador e título padrão e libera o que dá para tirar do save', () => {
        const dex = Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [
                i + 1,
                { matches: 0, minutes: 0, goals: 0, assists: 0, wins: 0, titles: 0, bestRating: 0, bestOvr: 0 },
            ]),
        );
        const old = {
            records: { cups: 1, titles: 1, perfect: 1 },
            profile: { trainerName: 'Ash', clubName: 'Pallet FC' },
            hall,
            dex,
        } as unknown as Partial<PersistedSave>;
        const out = migrateSave(old, 6);
        expect(out.profile.trainerName).toBe('Ash');
        expect(out.profile.trainer).toBe('red');
        expect(out.profile.title).toBe('pallet');
        expect(out.profile.redeemedTitles).toEqual([]);
        // título → Blue; copa perfeita → Ash; Dragonite campeão → Lance; 100 vistos → Prof. Carvalho; 11 gols → Biker
        expect(out.profile.missionsDone).toEqual(expect.arrayContaining(['blue', 'ash', 'lance', 'oak', 'biker']));
        expect(earnedTitles(out.profile)).toEqual(
            expect.arrayContaining(['pallet', 'campeao', 'perfeita', 'dragao', 'colecionador']),
        );
    });

    it('a junção com a nuvem não perde missão nem título resgatado de nenhum lado', () => {
        const local = migrateSave({}, 7);
        local.profile = { ...local.profile, missionsDone: ['rocker'], redeemedTitles: ['gametester'] };
        const cloud = migrateSave({}, 7);
        cloud.profile = { ...cloud.profile, missionsDone: ['bill'], clubName: 'Nuvem FC' };
        const m = mergeSaves(local, cloud, 'cloud');
        expect(m.profile.clubName).toBe('Nuvem FC');
        expect(m.profile.missionsDone).toEqual(expect.arrayContaining(['rocker', 'bill']));
        expect(m.profile.redeemedTitles).toEqual(['gametester']);
    });
});

describe('códigos', () => {
    it('espaços e caixa não contam; código errado não vale (os de verdade não ficam no repositório)', async () => {
        expect(normalizeCode('  goat-x ')).toBe('GOAT-X');
        expect(await redeemCode('SOCCERMON')).toBeNull();
        expect(await redeemCode('')).toBeNull();
    });
});
