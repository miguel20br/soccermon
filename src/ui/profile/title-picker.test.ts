import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCrowd: () => {}, playCry: () => {}, playSfx: () => {} }));
vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: false }) });

import { earnedTitles, TITLE_IDS } from '../../store/missions';
import { DEFAULT_PROFILE, type Profile } from '../../store/profile';
import { CUSTOM_TITLES, titleClass, titleLook } from '../../store/title-codes';
import { pickerTitles, titleHow, titleName, titleRarity } from './club';
import { pickTitle, TitlePicker } from './TrainerTab';

const html = (profile: Profile) => renderToStaticMarkup(createElement(TitlePicker, { profile, save: () => {} }));
/** Células da grade: [nome, bloqueado, escolhido]. */
const cells = (out: string) =>
    [
        ...out.matchAll(
            /<button type="button"(?: aria-pressed="(true|false)")?[^>]*class="pf-tcell([^"]*)"[^>]*>(.*?)<\/button>/g,
        ),
    ].map((m) => ({ pressed: m[1] === 'true', locked: m[2].includes('locked'), body: m[3] }));

describe('título "Natal 2026" (perfil-revamp.md, fase 1)', () => {
    it('existe, tem o visual de gelo (o único) e ninguém o tem num save novo', () => {
        expect(titleName('natal2026')).toBe('Natal 2026');
        expect(titleClass('natal2026')).toBe(' title-ice');
        expect(titleRarity('natal2026')).toBe('especial');
        expect(titleHow('natal2026')).toBe('Copa de Natal (24 e 25/12) ou degrau 4 do Desafio de Natal');
        const ice = [...TITLE_IDS, ...Object.keys(CUSTOM_TITLES)].filter((id) => titleLook(id) === 'ice');
        expect(ice).toEqual(['natal2026']);
        expect(earnedTitles(DEFAULT_PROFILE)).not.toContain('natal2026');
    });
    it('quando o evento der (em redeemedTitles), conta como ganho', () => {
        expect(earnedTitles({ ...DEFAULT_PROFILE, redeemedTitles: ['natal2026'] })).toContain('natal2026');
    });
});

describe('seletor de título no molde do Treinador', () => {
    it('tocar num ganho salva; num bloqueado não', () => {
        const earned = earnedTitles({ ...DEFAULT_PROFILE, missionsDone: ['blue'] });
        expect(pickTitle('campeao', earned)).toEqual({ title: 'campeao' });
        expect(pickTitle('natal2026', earned)).toBeNull();
    });
    it('save novo: Pallet em uso e o resto bloqueado por grupo, com o Natal nos Especiais', () => {
        const out = html(DEFAULT_PROFILE);
        const all = cells(out);
        expect(all.filter((c) => !c.locked).map((c) => c.body)).toEqual([
            expect.stringContaining('Treinador de Pallet'),
        ]);
        expect(all.find((c) => c.pressed)?.body).toContain('Treinador de Pallet');
        expect(all.filter((c) => c.locked)).toHaveLength(TITLE_IDS.length - 1 + 1);
        expect(pickerTitles(earnedTitles(DEFAULT_PROFILE))[0]).toEqual({ group: 'especial', ids: ['natal2026'] });
        // título de código fica escondido até alguém resgatar
        expect(out).not.toContain('GOAT');
    });
    it('a prévia mostra o título escolhido com o visual vivo e a raridade', () => {
        const out = html({ ...DEFAULT_PROFILE, redeemedTitles: ['natal2026'], title: 'natal2026' });
        expect(out).toMatch(/pf-tprev-title"><span class="title-ice">Natal 2026/);
        expect(out).toContain('Especial');
        expect(cells(out).find((c) => c.pressed)?.body).toContain('Natal 2026');
    });
});
