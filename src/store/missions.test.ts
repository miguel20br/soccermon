import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../cloud/reconcile-plan';
import { SPECIES } from '../engine/data';
import { createInstance } from '../engine/instance';
import type { GoalNote } from '../engine/match-stats';
import { Rng } from '../engine/rng';
import { noticeLines } from '../ui/components/UnlockNotice';
import { titleHow, trainerHow } from '../ui/profile/club';
import { migrateSave, type PersistedSave, type Records, streakAfter } from './game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    KANTO_BADGES,
    type MatchView,
    MISSION_GROUPS,
    MISSIONS,
    newMissions,
    PLATINUM,
    platinumItems,
    TRAINERS,
    unlockedTrainers,
} from './missions';
import { DEFAULT_PROFILE, type Dex, EMPTY_ENTRY, gameMoveIds, type HallEntry } from './profile';
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
    final: false,
    ...p,
});
const empty = { records: { titles: 0, perfect: 0 }, dex: {}, moves: {}, career: { goalsFor: 0 }, hall: [], runs: [] };

describe('missões', () => {
    it('Carvalho dourado conta "jogou" igual à Pokédex (inclusive quem veio por código, sem minutos)', () => {
        const dex = Object.fromEntries(Array.from({ length: 151 }, (_, i) => [i + 1, { ...EMPTY_ENTRY, matches: 1 }]));
        expect(newMissions({ ...empty, dex, done: [] })).toContain('oakGold');
    });

    it('Original e Clone sai pelo Hall da Fama (campeão com Mew e Mewtwo antes da missão existir)', () => {
        const entry = (ids: number[]) =>
            ({
                squad: ids.map((speciesId) => ({ speciesId, goals: 0 })),
                scores: [[2, 1]],
                perfect: false,
            }) as unknown as HallEntry;
        const got = newMissions({ ...empty, hall: [entry([150, 151, 25])], done: [] });
        expect(got).toContain('originalClone');
        expect(got).toContain('genese');
        expect(newMissions({ ...empty, hall: [entry([150, 25])], done: [] })).not.toContain('originalClone');
    });

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

    it('insígnias: uma por ginásio, saem da missão do líder (retroativa pelos resultados guardados)', () => {
        expect(KANTO_BADGES).toEqual(['brock', 'misty', 'ltsurge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni']);
        for (const id of KANTO_BADGES) expect(MISSIONS.find((m) => m.id === id)?.group).toBe('ginasios');
        const res = (won: boolean, opponent: string) => ({ won, opponent, score: [won ? 1 : 0, won ? 0 : 1] });
        const runs = [{ results: [res(true, 'Cerulean Cascata'), res(false, 'Pewter Rochedo')] }];
        const done = newMissions({ ...empty, runs: runs as never, done: [] });
        expect(KANTO_BADGES.filter((id) => done.includes(id))).toEqual(['misty']);
    });

    it('coleções temáticas: contam quem jogou (visto não vale) e dão título', () => {
        const cols = MISSIONS.filter((m) => m.group === 'colecoes');
        expect(MISSION_GROUPS).toContain('colecoes');
        expect(cols).toHaveLength(9);
        for (const c of cols) {
            expect(c.title).toBe(c.id);
            expect(c.goal).toBe(c.species?.length);
        }
        const entry = (matches: number) => ({ matches }) as never;
        const dex = { 106: entry(3), 107: entry(0), 144: entry(1), 145: entry(1), 146: entry(2) };
        const fresh = newMissions({ ...empty, dex, done: [] });
        expect(fresh).toContain('colPassaros');
        expect(fresh).not.toContain('colHitmons');
        expect(fresh).not.toContain('colLendarios');
        const hit = cols.find((c) => c.id === 'colHitmons')!;
        expect(hit.count?.({ ...empty, dex, done: new Set() } as never)).toBe(1);
        expect(earnedTitles({ missionsDone: fresh, redeemedTitles: [] })).toContain('colPassaros');
    });

    it('Ash: campeão sofrendo no máximo 5 gols na copa (6 não vale)', () => {
        const entry = (conceded: number[]) =>
            ({ perfect: false, scores: conceded.map((c) => [3, c]), squad: [] }) as unknown as HallEntry;
        expect(newMissions({ ...empty, done: [], hall: [entry([2, 1, 0, 2])] })).toContain('ash');
        expect(newMissions({ ...empty, done: [], hall: [entry([2, 1, 1, 2])] })).not.toContain('ash');
    });

    it('lendárias: só valem como campeão (na final) e cada uma com a sua regra', () => {
        const birds = [mon(144), mon(145), mon(146), mon(25), mon(1)];
        const full = [{ def: { id: 'passaros' }, members: [], bonus: 1.1, full: true }] as never;
        const fresh = (m: Partial<MatchView>) => newMissions({ ...empty, done: [] }, [view(m)]);
        expect(fresh({ final: true, lineup: birds, links: full })).toContain('lanceGold');
        expect(fresh({ final: false, lineup: birds, links: full })).not.toContain('lanceGold');
        expect(fresh({ final: true, won: false, lineup: birds, links: full })).not.toContain('lanceGold');
        expect(fresh({ final: true, lineup: [mon(19), mon(1), mon(4), mon(7), mon(25)] })).toContain('youngsterGold');
        const back = {
            score: [4, 3] as [number, number],
            timeline: [
                [0, 1],
                [0, 2],
                [0, 3],
                [4, 3],
            ] as [number, number][],
        };
        expect(fresh({ final: true, ...back })).toContain('blueGold');
        expect(fresh({ final: false, ...back })).not.toContain('blueGold');
        // time de carta bronze (Caterpie, Weedle, Rattata, Pidgey, Magikarp) contra um com Mewtwo
        expect(fresh({ final: true, lineup: [mon(10), mon(13), mon(19), mon(16), mon(129)] })).toContain('zeNinguem');
        expect(fresh({ final: true, lineup: [mon(10), mon(13), mon(19), mon(16), mon(150)] })).not.toContain(
            'zeNinguem',
        );
    });

    it('lendárias do save: copa perfeita, 5 títulos seguidos e 12 gols de um Pokémon numa copa', () => {
        const entry = (p: Partial<HallEntry>) =>
            ({ perfect: false, scores: [], squad: [], ...p }) as unknown as HallEntry;
        expect(newMissions({ ...empty, done: [], hall: [entry({ perfect: true })] })).toContain('ashGold');
        expect(newMissions({ ...empty, done: [], hall: [entry({})] })).not.toContain('ashGold');
        let rec = { cups: 0, titles: 0, perfect: 0 } as Records;
        for (const won of [true, true, true, true, false, true, true, true, true])
            rec = { ...rec, ...streakAfter(rec, won) };
        expect(rec.bestStreak).toBe(4);
        expect(newMissions({ ...empty, done: [], records: { ...empty.records, ...rec } })).not.toContain('redGold');
        rec = { ...rec, ...streakAfter(rec, true) };
        expect(newMissions({ ...empty, done: [], records: { ...empty.records, ...rec } })).toContain('redGold');
        const scorer = (goals: number) => entry({ squad: [{ speciesId: 25, goals }] as never });
        expect(newMissions({ ...empty, done: [], hall: [scorer(12)] })).toContain('artilheiroLendario');
        expect(newMissions({ ...empty, done: [], hall: [scorer(11)] })).not.toContain('artilheiroLendario');
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
        // título → Blue; copa perfeita → Ash; Dragonite campeão → Lance; 11 gols → Biker (o Carvalho pede os 151 vistos)
        expect(out.profile.missionsDone).toEqual(expect.arrayContaining(['blue', 'ash', 'lance', 'biker']));
        expect(earnedTitles(out.profile)).toEqual(
            expect.arrayContaining(['pallet', 'campeao', 'perfeita', 'dragao']),
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

describe('platina da Gen 1', () => {
    const others = MISSIONS.filter((m) => m.group !== 'platina').map((m) => m.id);
    const entry = { matches: 1, minutes: 9, goals: 0, assists: 0, wins: 0, titles: 0, bestRating: 0, bestOvr: 0 };
    /** Tudo 100%: os 151 jogaram com todas as edições, todos os golpes vistos. */
    const fullDex: Dex = Object.fromEntries(SPECIES.map((sp) => [sp.id, { ...entry, editions: 31 }]));
    const allMoves = Object.fromEntries([...gameMoveIds()].map((id) => [id, 1]));
    const items = (dex: Dex, moves: Record<string, number>, done: string[]) =>
        Object.fromEntries(
            platinumItems(PLATINUM[0], { ...empty, dex, moves, done: new Set(done) } as never).map((i) => [
                i.id,
                [i.n, i.goal],
            ]),
        );

    it('cada item conta do save e o total fecha só com 100% em tudo', () => {
        expect(items({}, {}, [])).toEqual({
            dex: [0, 151],
            moves: [0, gameMoveIds().size],
            album: [0, expect.any(Number)],
            collections: [0, 9],
            trainers: [0, MISSIONS.filter((m) => m.trainer && m.group !== 'platina').length],
            missions: [0, others.length],
        });
        const full = items(fullDex, allMoves, others);
        for (const [n, goal] of Object.values(full)) expect(n).toBe(goal);
        expect(newMissions({ ...empty, dex: fullDex, moves: allMoves, done: others })).toEqual(['platina1']);
    });

    it('falta uma coisa = sem Carvalho holográfico (uma figurinha, um golpe, uma missão)', () => {
        const noShiny = { ...fullDex, 25: { ...entry, editions: 31 & ~2 } };
        const [oneMove] = gameMoveIds();
        const { [oneMove]: _, ...missingMove } = allMoves;
        expect(newMissions({ ...empty, dex: noShiny, moves: allMoves, done: others })).toEqual([]);
        expect(newMissions({ ...empty, dex: fullDex, moves: missingMove, done: others })).toEqual([]);
        expect(newMissions({ ...empty, dex: fullDex, moves: allMoves, done: others.slice(1) })).not.toContain(
            'platina1',
        );
        const p = { ...DEFAULT_PROFILE, trainer: 'oakHolo' as const, missionsDone: others };
        expect(unlockedTrainers(p)).not.toContain('oakHolo');
        expect(activeTrainer(p)).toBe('red');
        expect(activeTrainer({ ...p, missionsDone: [...others, 'platina1'] })).toBe('oakHolo');
    });

    it('é retroativa: um save que já tem 100% ganha a platina ao abrir', () => {
        const old = { profile: { missionsDone: others }, dex: fullDex, moves: allMoves } as never;
        const out = migrateSave(old, 7);
        expect(out.profile.missionsDone).toContain('platina1');
        expect(earnedTitles(out.profile)).toContain('diplomaKanto');
    });
});

describe('a tarefa cumprida aparece em tudo que se ganha', () => {
    it('aviso: o prêmio e a tarefa', () => {
        expect(noticeLines('originalClone')).toEqual({
            head: 'Título novo: Original e Clone',
            task: 'Seja campeão com Mew e Mewtwo titulares na final',
        });
        expect(noticeLines('platina1')?.head).toBe('Treinador novo desbloqueado: Prof. Carvalho Holográfico');
        expect(noticeLines('nada')).toBeNull();
    });

    it('perfil: treinador e título dizem como saíram (livres e de código também)', () => {
        expect(trainerHow('red')).toBe('Desde o começo');
        expect(trainerHow('brock')).toBe('Vença o clube de Pewter (ginásio de Brock) numa copa');
        expect(titleHow('pallet')).toBe('Desde o começo');
        expect(titleHow('goat')).toBe('Código');
        expect(titleHow('diplomaKanto')).toBe('Platine a Gen 1: 100% de tudo');
    });
});
