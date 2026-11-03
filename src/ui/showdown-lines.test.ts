import { describe, expect, it } from 'vitest';
import { species } from '../engine/data';
import { showdown as en } from '../i18n/en/showdown';
import { showdown as pt } from '../i18n/pt/showdown';
import { lineAt, SHOWDOWN_MS, showdownScript } from './showdown-lines';

const mon = (id: number) => ({ speciesId: id, name: species(id).name });
/** Todas as falas de um idioma, com onde estão. */
function all(d: typeof pt): [string, string][] {
    return [
        ...Object.entries(d.pairs).flatMap(([k, s]) => s.map(([, t], i) => [`pairs.${k}.${i}`, t] as [string, string])),
        ...[...d.up, ...d.down].flatMap((s, k) => s.map(([, t], i) => [`fam.${k}.${i}`, t] as [string, string])),
        ...Object.entries(d.solo).flatMap(([k, s]) =>
            [...s.shot, ...s.gk, ...s.shout].map((t, i) => [`solo.${k}.${i}`, t] as [string, string]),
        ),
        ...[...d.shot, ...d.gk, ...d.more, ...d.shout].map((t, i) => [`generic.${i}`, t] as [string, string]),
    ];
}

describe('falas do duelo da bicuda', () => {
    it('todo par e todo solo existe em PT e EN, com a mesma ordem de quem fala', () => {
        expect(Object.keys(en.pairs).sort()).toEqual(Object.keys(pt.pairs).sort());
        expect(Object.keys(en.solo).sort()).toEqual(Object.keys(pt.solo).sort());
        for (const [k, s] of Object.entries(pt.pairs))
            expect(
                en.pairs[k].map(([w]) => w),
                k,
            ).toEqual(s.map(([w]) => w));
        for (const fam of ['up', 'down'] as const)
            pt[fam].forEach((s, i) => {
                expect(en[fam][i].map(([w]) => w)).toEqual(s.map(([w]) => w));
            });
        // pares notáveis: 12 a 16 (contando os dois sentidos como um)
        const pairs = new Set(Object.keys(pt.pairs).map((k) => k.split('-').map(Number).sort().join('-')));
        expect(pairs.size).toBeGreaterThanOrEqual(12);
        expect(pairs.size).toBeLessThanOrEqual(16);
        for (const k of Object.keys(pt.pairs))
            for (const id of k.split('-').map(Number)) expect(id).toBeLessThanOrEqual(151);
    });

    it('quem chutou abre, o goleiro fecha (o grito da bicuda), 3 ou 4 falas', () => {
        for (const s of [...Object.values(pt.pairs), ...pt.up, ...pt.down]) {
            expect(s[0][0]).toBe('s');
            expect(s.at(-1)?.[0]).toBe('g');
            expect(s.length).toBeGreaterThanOrEqual(3);
            expect(s.length).toBeLessThanOrEqual(4);
        }
    });

    it('curtas, sem emoji, "pra" em vez de "para" e sem "não é X, é Y"', () => {
        for (const [lang, d] of [
            ['pt', pt],
            ['en', en],
        ] as const) {
            for (const [at, text] of all(d)) {
                expect(text.split(/\s+/).length, `${lang} ${at}: ${text}`).toBeLessThanOrEqual(10);
                expect(text, `${lang} ${at}`).not.toMatch(/\p{Extended_Pictographic}/u);
                expect(text.trim(), `${lang} ${at}`).toBe(text);
                if (lang === 'pt') {
                    expect(text, at).not.toMatch(/\bpara\b/i);
                    expect(text, at).not.toMatch(/não é .*, é /i);
                }
            }
        }
        // o grito: 1 ou 2 palavras (o nome do golpe e o bordão da Equipe Rocket passam)
        for (const t of pt.shout) expect(t.split(/\s+/).length).toBeLessThanOrEqual(2);
    });

    it('prioridade: par notável, linha evolutiva, solo e genéricas', () => {
        // Charizard chutou, Charmander segurou: a conversa deles
        expect(showdownScript(mon(6), mon(4), 1, pt)[0].text).toBe(pt.pairs['6-4'][0][1]);
        expect(showdownScript(mon(4), mon(6), 1, pt)[0].text).toBe(pt.pairs['4-6'][0][1]);
        // Ivysaur chutou, Bulbasaur segurou (a pré-evolução); Squirtle chutou, Wartortle segurou (o evoluído)
        const up = showdownScript(mon(2), mon(1), 7, pt).map((l) => l.text);
        expect(
            pt.up.some(
                (s) => s.map(([, t]) => t.replace('{g}', 'Bulbasaur').replace('{s}', 'Ivysaur')).join() === up.join(),
            ),
        ).toBe(true);
        const down = showdownScript(mon(7), mon(8), 7, pt);
        expect(pt.down.some((s) => s.at(-1)?.[1] === down.at(-1)?.text)).toBe(true);
        // Snorlax chutou num Weedle: a fala do Snorlax e a resposta genérica
        const solo = showdownScript(mon(143), mon(13), 3, pt);
        expect(solo[0]).toEqual({ who: 's', text: pt.solo[143].shot[0] });
        expect(pt.gk).toContain(solo[1].text);
        // Wartortle chutou num Weedle: tudo genérico, e a mesma em toda tela (mesmo lance = mesma conversa)
        const generic = showdownScript(mon(8), mon(13), 1234, pt);
        expect(pt.shot).toContain(generic[0].text);
        expect(pt.shout).toContain(generic.at(-1)?.text);
        expect(showdownScript(mon(8), mon(13), 1234, pt)).toEqual(generic);
        const seen = new Set(Array.from({ length: 30 }, (_, k) => showdownScript(mon(8), mon(13), k, pt)[0].text));
        expect(seen.size).toBeGreaterThan(3);
    });

    it('a cutscene: cada fala na vez dela até o grito, que fica até o corte sair', () => {
        const ms = 9000;
        for (const n of [3, 4]) {
            const seen = Array.from({ length: ms / 50 }, (_, k) => lineAt(k * 50, ms, n));
            expect(seen[0]).toBe(-1);
            expect(seen.at(-1)).toBe(n - 1);
            // em ordem, sem pular nenhuma
            expect([...new Set(seen)]).toEqual([-1, ...Array.from({ length: n }, (_, i) => i)]);
            // o grito entra antes do corte sair com tempo de ler
            const shout = seen.indexOf(n - 1) * 50;
            expect(ms - SHOWDOWN_MS.exit - shout).toBeGreaterThanOrEqual(1000);
        }
    });
});
