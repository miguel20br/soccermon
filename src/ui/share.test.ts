import { describe, expect, it } from 'vitest';
import type { DailyEntry } from '../store/daily';
import { buildDailyShareText, challengeUrl, DAILY_SHARE_URL } from './share';

const day = (d: string, won: boolean[]): DailyEntry => ({
    day: d,
    results: won.map((w, i) => ({ score: w ? [2, 1] : [0, 1], shootout: null, won: w, opponent: `Rival ${i}` })),
    done: true,
    champion: won.length === 4 && won.every(Boolean),
});

describe('Compartilhar: origem dos links', () => {
    it('o desafio e a Copa do Dia têm utm_source próprios (antes a Copa do Dia também mandava "share")', () => {
        const desafio = new URL(challengeUrl('abc123'));
        expect(desafio.searchParams.get('utm_source')).toBe('share');
        expect(desafio.searchParams.get('seed')).toBe('abc123');
        expect(new URL(DAILY_SHARE_URL).searchParams.get('utm_source')).toBe('daily');
        expect(new URL(DAILY_SHARE_URL).searchParams.has('seed')).toBe(false);
    });
});

describe('Compartilhar a Copa do Dia', () => {
    it('leva o número do dia, os quadradinhos, a semana e o link da Copa do Dia (PT e EN)', () => {
        const hoje = day('2026-11-23', [true, true, false]);
        const ontem = day('2026-11-22', [true]);
        const pt = buildDailyShareText(hoje, [hoje, ontem], 'pt').split('\n');
        expect(pt[0]).toBe('Soccermon · Copa do Dia #36 · 23/11');
        expect(pt[1]).toBe('🟩🟩🟥 2/4');
        // 22/11 é domingo (semana anterior): a semana nova só tem hoje
        expect(pt).toContain('1/7 dias na semana');
        expect(pt.at(-1)).toBe('https://soccermon.com/?utm_source=daily');
        const en = buildDailyShareText(hoje, [hoje], 'en').split('\n');
        expect(en[0]).toBe('Soccermon · Daily Cup #36 · 11/23');
        expect(en.at(-1)).toBe(DAILY_SHARE_URL);
    });
});
