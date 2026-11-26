import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../cloud/reconcile-plan';
import { levelOfDone, trainerLevel } from '../ui/ambientes/metas';
import { isUnlocked } from './club-kit';
import { migrateSave, withUnlocks } from './game-store';
import {
    earnedTitles,
    MISSIONS,
    missionExtra,
    newMissions,
    PLATINUM,
    platinumItems,
    trainerFrame,
    UT_FRAME_TITLE,
    unlockedTrainers,
    utView,
} from './missions';
import { DEFAULT_PROFILE } from './profile';
import { GYMS, PASS_MARKS, SEASONS } from './ultimate/rules';
import {
    MISSION_GIFTS,
    mergeUltimate,
    missionGiftId,
    missionGifts,
    newUltimate,
    rollSeason,
    type UltimateSave,
} from './ultimate/ultimate';

const DAY = 24 * 60 * 60 * 1000;
const IN_T1 = SEASONS[0].start + 10 * DAY;
const empty = { records: { titles: 0, perfect: 0 }, dex: {}, moves: {}, career: { goalsFor: 0 }, hall: [], runs: [] };
/** Um save do UT na Temporada 1 com os números dados. */
const t1 = (patch: Partial<UltimateSave> = {}): UltimateSave => ({
    ...newUltimate('ut', IN_T1),
    season: 1,
    ...patch,
});
const fresh = (u: UltimateSave, done: string[] = []) => newMissions({ ...empty, done, ut: utView(u) });
const UT_IDS = ['utPlay1', 'utWin25', 'utPlay100', 'utGyms', 'utSbc3', 'utPasse', 'utWin50', 'utPacks10'];

describe('missões do Time Ultimate', () => {
    it('são 8 num grupo próprio, e as 71 fecham o nível 16', () => {
        expect(MISSIONS.filter((m) => m.group === 'ultimate').map((m) => m.id)).toEqual(UT_IDS);
        expect(MISSIONS).toHaveLength(71);
        expect(trainerLevel(70).level).toBe(15);
        expect(trainerLevel(71).level).toBe(16);
        expect(levelOfDone(MISSIONS.map((m) => m.id)).level).toBe(16);
    });

    it('cada uma sai com o número dela (e não antes)', () => {
        const gyms = GYMS.map((g) => g.id);
        const cases: [string, Partial<UltimateSave>, Partial<UltimateSave>][] = [
            ['utPlay1', { played: 1 }, { played: 0 }],
            ['utWin25', { played: 30, wins: 25 }, { played: 30, wins: 24 }],
            ['utPlay100', { played: 100 }, { played: 99 }],
            ['utGyms', { gyms }, { gyms: gyms.slice(1) }],
            [
                'utSbc3',
                { sbc: { slots: {}, done: ['agua', 'eletrico', 'familia'], n: 3 } },
                { sbc: { slots: {}, done: ['agua', 'eletrico'], n: 2 } },
            ],
            ['utWin50', { played: 60, wins: 50 }, { played: 60, wins: 49 }],
            ['utPacks10', { opened: 10 }, { opened: 9 }],
        ];
        for (const [id, yes, no] of cases) {
            expect(fresh(t1(yes)), id).toContain(id);
            expect(fresh(t1(no)), id).not.toContain(id);
        }
        const pass = (marks: number) => t1({ pass: { ...t1().pass, marks } });
        expect(fresh(pass(PASS_MARKS))).toContain('utPasse');
        expect(fresh(pass(PASS_MARKS - 1))).not.toContain('utPasse');
    });

    it('a faxina (que repete) conta como um desafio só, entregue quantas vezes for', () => {
        expect(utView(t1({ sbc: { slots: {}, done: ['agua', 'eletrico'], n: 5 } })).sbc).toBe(3);
        expect(utView(t1({ sbc: { slots: {}, done: [], n: 5 } })).sbc).toBe(1);
    });

    it('a prévia (temporada 0) não conta', () => {
        expect(fresh({ ...t1({ played: 200, wins: 100, opened: 20 }), season: 0 })).toEqual([]);
    });

    it('partidas, vitórias e pacotes somam as temporadas; o passe completo de uma passada vale', () => {
        const old = rollSeason(
            t1({ played: 60, wins: 30, opened: 6, pass: { ...t1().pass, marks: PASS_MARKS } }),
            SEASONS[1].start,
        ).u;
        const now = { ...old, played: 40, wins: 20, opened: 4 };
        const v = utView(now);
        expect(v).toMatchObject({ played: 100, wins: 50, opened: 10, marks: PASS_MARKS });
        expect(fresh(now)).toEqual(expect.arrayContaining(['utPlay100', 'utWin50', 'utPacks10', 'utPasse']));
    });

    it('a temporada zera, a missão cumprida fica, e o prêmio dela não cai de novo na virada', () => {
        const gyms = GYMS.map((g) => g.id);
        const u = t1({ gyms, played: 1, wins: 1 });
        const done = fresh(u);
        expect(done).toEqual(expect.arrayContaining(['utGyms', 'utPlay1']));
        const paid = missionGifts(u, done);
        expect(paid.fichas).toBe(u.fichas + 150);
        // virada: insígnias e Fichas zeram, a missão e o personagem ficam
        const next = rollSeason(paid, SEASONS[1].start).u;
        expect(next.gyms).toEqual([]);
        expect(next.fichas).toBe(0);
        expect(utView(next).gyms).toBe(0);
        expect(unlockedTrainers({ missionsDone: done })).toContain('tamer');
        // sem os presentes passando a virada, as 150 Fichas da 1ª partida caíam de novo em toda temporada
        expect(missionGifts(next, done)).toBe(next);
        expect(next.gifts).toContain(missionGiftId('utPlay1'));
    });
});

describe('prêmios das missões do UT', () => {
    it('Fichas e carta de presente caem uma vez só; nada na prévia', () => {
        const u = t1({ fichas: 10 });
        const once = missionGifts(u, ['utPlay1', 'utPacks10', 'utSbc3', 'blue']);
        expect(once.fichas).toBe(310);
        const gift = once.picks.find((p) => p.uid === `gift-${missionGiftId('utSbc3')}`);
        expect(gift).toMatchObject({ n: 1, min: 'prata', from: 'mission', ref: 'utSbc3' });
        expect(missionGifts(once, ['utPlay1', 'utPacks10', 'utSbc3'])).toBe(once);
        expect(missionGifts({ ...u, season: 0 }, ['utPlay1'])).toEqual({ ...u, season: 0 });
    });

    it('símbolo, padrão, personagem e título (com a moldura dourada) saem das missões', () => {
        expect(missionExtra('utWin25')?.kind).toBe('crest');
        expect(missionExtra('utPlay100')?.kind).toBe('kit');
        expect(missionExtra('utPlay1')).toEqual({ kind: 'fichas', n: MISSION_GIFTS.utPlay1.fichas });
        expect(missionExtra('utSbc3')).toEqual({ kind: 'card' });
        const crest = missionExtra('utWin25');
        const kit = missionExtra('utPlay100');
        if (crest?.kind !== 'crest' || kit?.kind !== 'kit') throw new Error('prêmio errado');
        expect(isUnlocked(crest.id, new Set(), {})).toBe(false);
        expect(isUnlocked(crest.id, new Set(['utWin25']), {})).toBe(true);
        expect(isUnlocked(kit.id, new Set(['utPlay100']), {})).toBe(true);
        const p = { missionsDone: ['utPasse', 'utWin50'], redeemedTitles: [] };
        expect(earnedTitles(p)).toEqual(expect.arrayContaining([UT_FRAME_TITLE, 'utVitorias50']));
        expect(trainerFrame('red', UT_FRAME_TITLE)).toBe(' gold-frame');
        expect(trainerFrame('red', 'pallet')).toBe('');
    });

    it('nuvem x aparelho: o prêmio que só o lado que perdeu recebeu vai pro que ficou, sem duplicar', () => {
        const base = t1({ fichas: 100 });
        const gave = missionGifts(base, ['utPlay1']); // aparelho A: recebeu as 150
        const ahead = { ...base, played: 30 }; // aparelho B: andou mais, não recebeu
        const m = mergeUltimate(gave, ahead);
        expect(m.played).toBe(30);
        expect(m.fichas).toBe(250);
        expect(m.gifts).toContain(missionGiftId('utPlay1'));
        // juntar de novo (ou ao contrário) não paga outra vez
        expect(mergeUltimate(m, gave).fichas).toBe(250);
        expect(mergeUltimate(gave, m).fichas).toBe(250);
        // os dois receberam: fica o do lado que ganhou, uma vez só
        const both = mergeUltimate(gave, missionGifts(ahead, ['utPlay1']));
        expect(both.fichas).toBe(250);
        expect(both.gifts.filter((g) => g === missionGiftId('utPlay1'))).toHaveLength(1);
        // a carta de presente também
        const card = mergeUltimate(missionGifts(base, ['utSbc3']), ahead);
        expect(card.picks.filter((p) => p.from === 'mission')).toHaveLength(1);
    });

    it('o save inteiro: carregar paga o prêmio da missão cumprida; juntar com a nuvem não perde nem duplica', () => {
        const local = migrateSave({}, 7);
        local.ultimate = t1({ played: 1, fichas: 0 });
        const loaded = withUnlocks(local);
        expect(loaded.profile.missionsDone).toContain('utPlay1');
        expect(loaded.ultimate.fichas).toBe(150);
        expect(withUnlocks(loaded).ultimate.fichas).toBe(150);
        // a nuvem andou mais no UT e não tinha o prêmio; a missão vem do perfil do aparelho
        const cloud = migrateSave({}, 7);
        cloud.ultimate = t1({ played: 5, fichas: 40 });
        const m = mergeSaves(loaded, cloud, 'cloud');
        expect(m.ultimate.played).toBe(5);
        expect(m.ultimate.fichas).toBe(190);
        expect(m.profile.missionsDone).toContain('utPlay1');
        expect(mergeSaves(m, loaded, 'cloud').ultimate.fichas).toBe(190);
    });

    it('a platina da Gen 1 não pede as missões do UT', () => {
        const items = platinumItems(PLATINUM[0], { ...empty, done: new Set() } as never);
        const missions = items.find((i) => i.id === 'missions');
        expect(missions?.goal).toBe(MISSIONS.filter((m) => m.group !== 'platina' && m.group !== 'ultimate').length);
        expect(DEFAULT_PROFILE.missionsDone).toEqual([]);
    });
});
