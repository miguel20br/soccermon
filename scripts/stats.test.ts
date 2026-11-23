import { describe, expect, it } from 'vitest';
import { canal, coortes, segundaDe, type Visita, visitaDe } from './stats';

describe('canal (origem da sessão)', () => {
    it('o app do Google (com.google.android.googlequicksearchbox) entra no canal Google, não em "android"', () => {
        expect(canal('com.google.android.googlequicksearchbox')).toBe('google');
        expect(canal('google.com')).toBe('google');
        expect(canal('google.com.br')).toBe('google');
    });

    it('outros apps do Android pelo nome do app; domínio e utm continuam como antes', () => {
        expect(canal('com.google.android.youtube')).toBe('youtube');
        expect(canal('com.google.android.gm')).toBe('gmail');
        expect(canal('com.instagram.android')).toBe('instagram');
        expect(canal('com.zhiliaoapp.musically')).toBe('tiktok');
        expect(canal('com.whatsapp')).toBe('whatsapp');
        expect(canal('old.reddit.com')).toBe('reddit');
        expect(canal('t.co')).toBe('x');
        expect(canal('soccermon.vercel.app')).toBe('vercel.app');
        expect(canal('tiktok')).toBe('tiktok');
        expect(canal(null)).toBe('direto');
    });
});

describe('coortes semanais (D1/D7/D30)', () => {
    const v = (did: string, first: string, n: number, legacy = false) =>
        visitaDe({
            created_at: new Date(),
            session: `${did}-${n}`,
            props: { did, first_day: first, day_n: n, legacy },
        }) as Visita;

    it('agrupa pela segunda-feira do 1º dia, sem legacy; D1 = voltou no dia seguinte, D7 = algum dia de 7 a 13', () => {
        expect(segundaDe('2026-11-23')).toBe('2026-11-23');
        expect(segundaDe('2026-11-29')).toBe('2026-11-23');
        const vs = [
            v('a', '2026-11-23', 0),
            v('a', '2026-11-23', 1),
            v('a', '2026-11-23', 9),
            v('b', '2026-11-25', 0),
            v('b', '2026-11-25', 3),
            v('c', '2026-11-29', 0),
            v('c', '2026-11-29', 1),
            v('old', '2026-11-23', 0, true),
            v('d', '2026-12-01', 0),
        ];
        const [w1, w2] = coortes(vs, '2026-12-31');
        expect(w1).toMatchObject({
            semana: '2026-11-23',
            novos: 3,
            d1: { n: 2, de: 3, parcial: false },
            d7: { n: 1, de: 3, parcial: false },
            d30: { n: 0, de: 3, parcial: true },
        });
        expect(w2).toMatchObject({ semana: '2026-11-30', novos: 1, d1: { n: 0, de: 1 }, d7: { n: 0, parcial: false } });
        // a janela do D30 nem começou pra coorte: sem número
        expect(coortes(vs, '2026-12-10')[0].d30).toBeNull();
    });

    it('sessão sem id de aparelho (versão antiga) não vira visita', () => {
        expect(visitaDe({ created_at: new Date(), session: 's', props: { returning: true } })).toBeNull();
    });
});
