import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../cloud/reconcile-plan';
import { markAllSeen, newsCount, newsOf } from '../ui/profile/news';
import { DEFAULT_SETTINGS, migrateSave, type PersistedSave, useGame, withUnlocks } from './game-store';
import { earnedKeys, freshKeys, medalViewOf, newsKey } from './news';
import { DEFAULT_PROFILE, type Dex, EDITION_BIT, EMPTY_CAREER } from './profile';

function save(patch: Partial<PersistedSave> = {}): PersistedSave {
    return {
        run: null,
        settings: { ...DEFAULT_SETTINGS, lang: 'pt' },
        records: { cups: 0, titles: 0, perfect: 0 },
        profile: { ...DEFAULT_PROFILE, seen: [] },
        dex: {},
        moves: {},
        binder: [],
        career: EMPTY_CAREER,
        onboarded: false,
        parkedRuns: [],
        hall: [],
        duels: [],
        daily: [],
        ...patch,
    };
}
/** Jogou pelo seu time, com estas figurinhas. */
const played = (ids: number[], editions = EDITION_BIT.normal): Dex =>
    Object.fromEntries(
        ids.map((id) => [
            id,
            { matches: 1, minutes: 10, goals: 0, assists: 0, wins: 0, titles: 0, bestRating: 6, bestOvr: 60, editions },
        ]),
    );
const news = (s: PersistedSave) => freshKeys(earnedKeys(medalViewOf(s), s.profile), s.profile.seen);

describe('selo NOVO', () => {
    it('começo do zero: nada é novo (Red, Pallet e Pikachu vêm de graça)', () => {
        expect(news(save())).toEqual([]);
    });

    it('ganhou → novo; viu → some', () => {
        const s = save({ dex: played([6], EDITION_BIT.normal | EDITION_BIT.shiny) });
        const fresh = news(s);
        expect(fresh).toContain(newsKey.avatar(6));
        expect(fresh).toContain(newsKey.avatar(6, true));
        expect(fresh).toContain(newsKey.sticker('6:shiny'));
        const seen = { ...s, profile: { ...s.profile, seen: [newsKey.avatar(6)] } };
        expect(news(seen)).not.toContain(newsKey.avatar(6));
        expect(news(seen)).toContain(newsKey.sticker('6:shiny'));
    });

    it('missão cumprida: treinador e título novos', () => {
        const s = save({ profile: { ...DEFAULT_PROFILE, seen: [], missionsDone: ['brock'] } });
        const fresh = news(s);
        expect(fresh.some((k) => k.startsWith('tr:') || k.startsWith('ti:'))).toBe(true);
    });

    it('save antigo (sem o campo): o que já tinha conta como visto, o que vier depois é novo', () => {
        const old = save({ dex: played([1, 4, 7, 25], EDITION_BIT.normal | EDITION_BIT.shiny) });
        delete old.profile.seen;
        const up = withUnlocks(old);
        expect(up.profile.seen?.length).toBeGreaterThan(0);
        expect(news(up)).toEqual([]);
        const later = { ...up, dex: { ...up.dex, ...played([150]) } };
        expect(news(later)).toEqual([newsKey.avatar(150)]);
    });

    it('backup v6 de verdade abre sem enxurrada', async () => {
        const { readFileSync } = await import('node:fs');
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const s = migrateSave(backup.save, backup.version);
            expect(Array.isArray(s.profile.seen)).toBe(true);
            expect(news(s)).toEqual([]);
        }
    });

    it('nuvem: visto em qualquer lado conta (união); nuvem antiga entra como vista', () => {
        const local = save({
            dex: played([6, 9]),
            profile: { ...DEFAULT_PROFILE, seen: [newsKey.avatar(6)] },
        });
        const cloud = save({ dex: played([6, 9]), profile: { ...DEFAULT_PROFILE, seen: [newsKey.avatar(9)] } });
        const merged = mergeSaves(local, cloud, 'cloud');
        expect(merged.profile.seen).toEqual(expect.arrayContaining([newsKey.avatar(6), newsKey.avatar(9)]));
        expect(news(merged)).toEqual([]);

        // a conta tem um save de antes do selo (sem `seen`): passa pela migração e o que ela tinha não vira novo
        const oldCloud = save({ dex: played([131, 143]) });
        delete oldCloud.profile.seen;
        const fresh = mergeSaves(save(), migrateSave(oldCloud, 9), 'cloud');
        expect(news(fresh)).toEqual([]);
    });

    it('"Marcar tudo como visto" zera a aba (e as outras ficam)', () => {
        useGame.setState(
            save({
                dex: played([6], EDITION_BIT.normal | EDITION_BIT.shiny),
                profile: { ...DEFAULT_PROFILE, seen: [], missionsDone: ['brock'] },
            }),
        );
        const before = newsOf(useGame.getState());
        expect(newsCount(before, 'dex')).toBe(1);
        expect(newsCount(before, 'clube')).toBeGreaterThan(1);
        markAllSeen('dex');
        const mid = newsOf(useGame.getState());
        expect(newsCount(mid, 'dex')).toBe(0);
        expect(newsCount(mid, 'clube')).toBeGreaterThan(0);
        markAllSeen();
        expect(newsOf(useGame.getState()).size).toBe(0);
    });
});
