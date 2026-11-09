import { describe, expect, it } from 'vitest';
import { weeklyEventType } from '../engine/specials';
import { mergeProfileUnlocks } from '../store/missions';
import { DEFAULT_PROFILE } from '../store/profile';
import { activeNews, NEWS, NEXT_NEWS, type NewsCard, unseenNews, weekCard, withSeen } from './news';
import { ULTIMATE_OPENS_AT } from './ultimate/flag';

const at = (iso: string) => Date.parse(iso);
const card = (id: string, date: string, until: string): NewsCard => ({
    id,
    date,
    until,
    title: { pt: id, en: id },
    text: { pt: id, en: id },
    art: 'daily',
});

describe('lista das Notícias', () => {
    it('ids únicos, datas válidas e textos curtos nos dois idiomas', () => {
        const all = [...NEWS, ...NEXT_NEWS, weekCard()];
        expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
        for (const c of all) {
            expect(c.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(c.until >= c.date).toBe(true);
            for (const l of ['pt', 'en'] as const) {
                expect(c.title[l].split(' ').length).toBeLessThanOrEqual(5);
                expect(c.text[l].length).toBeGreaterThan(0);
                expect(c.text[l].length).toBeLessThanOrEqual(90);
                // o botão diz aonde leva (Miguel, 09/11: nada de "Jogar" pra tudo)
                if (c.to) expect(c.cta?.[l].split(' ').length).toBeLessThanOrEqual(5);
            }
        }
    });

    it('o cartão do Time Ultimate conta até a mesma estreia do modo', () => {
        const ut = NEWS.find((c) => c.to === 'ultimate');
        expect(ut?.opensAt).toBe(ULTIMATE_OPENS_AT);
    });
});

describe('evento da semana', () => {
    it('o mesmo tipo do letreiro, de segunda a domingo, na frente do feed', () => {
        const qua = at('2026-11-18T15:00:00Z');
        const c = weekCard(qua);
        expect(c.type).toBe(weeklyEventType(new Date(qua)));
        expect([c.date, c.until]).toEqual(['2026-11-16', '2026-11-22']);
        expect(activeNews(qua)[0].id).toBe(c.id);
        // semana nova, evento novo: outro id (o pontinho acende de novo)
        expect(weekCard(at('2026-11-24T15:00:00Z')).id).not.toBe(c.id);
        expect(weekCard(at('2026-11-22T15:00:00Z')).id).toBe(c.id);
    });
});

describe('quando o cartão aparece (dia de Brasília)', () => {
    const list = [card('a', '2026-11-09', '2026-11-20')];
    it('do primeiro ao último dia, inclusive', () => {
        expect(activeNews(at('2026-11-09T02:59:00Z'), list)).toHaveLength(0); // 23h59 do dia 8 em Brasília
        expect(activeNews(at('2026-11-09T03:00:00Z'), list)).toHaveLength(1);
        expect(activeNews(at('2026-11-21T02:59:00Z'), list)).toHaveLength(1);
        expect(activeNews(at('2026-11-21T03:00:00Z'), list)).toHaveLength(0);
    });
});

describe('visto no save', () => {
    const now = at('2026-11-10T12:00:00Z');
    const list = [card('a', '2026-11-09', '2026-11-20'), card('b', '2026-11-09', '2026-11-20')];
    it('save antigo (sem o campo): todos os cartões no ar são novos', () => {
        expect(DEFAULT_PROFILE.newsSeen).toBeUndefined();
        expect(unseenNews(undefined, now, list).map((c) => c.id)).toEqual(['a', 'b']);
    });
    it('visto some da conta; repetir não duplica', () => {
        const seen = withSeen(withSeen(undefined, ['a']), ['a']);
        expect(seen).toEqual(['a']);
        expect(unseenNews(seen, now, list).map((c) => c.id)).toEqual(['b']);
    });
    it('visto em qualquer aparelho conta (junção com a nuvem)', () => {
        const merged = mergeProfileUnlocks({ ...DEFAULT_PROFILE, newsSeen: ['a'] }, { newsSeen: ['b', 'a'] });
        expect(merged.newsSeen).toEqual(['a', 'b']);
        expect(mergeProfileUnlocks({ ...DEFAULT_PROFILE }, {}).newsSeen).toBeUndefined();
    });
});
