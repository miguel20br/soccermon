import { describe, expect, it } from 'vitest';
import { AGENCY } from '../engine/agency';
import { species } from '../engine/data';
import { showdown as en } from '../i18n/en/showdown';
import { showdown as pt } from '../i18n/pt/showdown';
import { lineAt, lineSpan, SHOWDOWN_MS, showdownScript, typeDelays, typeMs } from './showdown-lines';

const mon = (id: number) => ({ speciesId: id, name: species(id).name });
/** As conversas prontas de um idioma (pares, linha evolutiva e as de um Pokémon só), com onde estão. */
function scripts(d: typeof pt) {
    return [
        ...Object.entries(d.pairs).map(([k, s]) => [`pairs.${k}`, s] as const),
        ...[...d.up, ...d.down].map((s, k) => [`fam.${k}`, s] as const),
        ...Object.entries(d.solo).flatMap(([k, s]) => [
            ...(s.keeper ?? []).map((x, i) => [`solo.${k}.keeper.${i}`, x] as const),
            ...(s.shooter ?? []).map((x, i) => [`solo.${k}.shooter.${i}`, x] as const),
        ]),
    ];
}

/** Todas as falas de um idioma, com onde estão. */
function all(d: typeof pt): [string, string][] {
    return [
        ...scripts(d).flatMap(([at, s]) => s.map(([, t], i) => [`${at}.${i}`, t] as [string, string])),
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
        for (const [k, s] of Object.entries(pt.solo))
            for (const role of ['keeper', 'shooter'] as const)
                expect(
                    en.solo[k][role]?.map((x) => x.map(([w]) => w)),
                    `${k}.${role}`,
                ).toEqual(s[role]?.map((x) => x.map(([w]) => w)));
        // pares notáveis: 12 a 16 (contando os dois sentidos como um)
        const pairs = new Set(Object.keys(pt.pairs).map((k) => k.split('-').map(Number).sort().join('-')));
        expect(pairs.size).toBeGreaterThanOrEqual(12);
        expect(pairs.size).toBeLessThanOrEqual(16);
        for (const k of Object.keys(pt.pairs))
            for (const id of k.split('-').map(Number)) expect(id).toBeLessThanOrEqual(151);
    });

    it('o goleiro fecha (a bicuda), 3 ou 4 falas, e quem chutou fala pelo menos uma vez', () => {
        for (const [at, s] of scripts(pt)) {
            expect(s.at(-1)?.[0], at).toBe('g');
            expect(
                s.some(([w]) => w === 's'),
                at,
            ).toBe(true);
            expect(s.length, at).toBeGreaterThanOrEqual(3);
            expect(s.length, at).toBeLessThanOrEqual(4);
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
                    // o goleiro parou a bola no pé e devolveu de bicuda: ninguém segura nem agarra (Miguel, 03/11/2026)
                    expect(text, at).not.toMatch(/\b(segurou|segurei|segurar|pegou|peguei|agarr\w*)\b/i);
                } else expect(text, at).not.toMatch(/\b(caught|catch(es)? it|grabbed)\b/i);
            }
        }
        // a bicuda genérica: até 3 palavras
        for (const t of [...pt.shout, ...en.shout]) expect(t.split(/\s+/).length).toBeLessThanOrEqual(3);
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
        // Snorlax chutou num Weedle: a conversa do Snorlax; Magikarp no gol vence a de quem chutou (Slowpoke)
        const solo = showdownScript(mon(143), mon(13), 3, pt);
        expect(solo.map((l) => l.text)).toEqual(pt.solo[143].shooter?.[0].map(([, t]) => t));
        expect(showdownScript(mon(79), mon(129), 3, pt)[0].text).toBe('Splash.');
        // Wartortle chutou num Weedle: tudo genérico, e a mesma em toda tela (mesmo lance = mesma conversa)
        const generic = showdownScript(mon(8), mon(13), 1234, pt);
        expect(pt.shot).toContain(generic[0].text);
        expect(pt.shout).toContain(generic.at(-1)?.text);
        expect(showdownScript(mon(8), mon(13), 1234, pt)).toEqual(generic);
        const seen = new Set(Array.from({ length: 30 }, (_, k) => showdownScript(mon(8), mon(13), k, pt)[0].text));
        expect(seen.size).toBeGreaterThan(3);
    });

    it('o duelo: cada fala na vez dela até a última, que fica até a caixa sair', () => {
        // a parada do motor (AGENCY.showdown.seconds): a cena cabe nela
        const ms = AGENCY.showdown.seconds * 1000;
        for (const n of [3, 4]) {
            const seen = Array.from({ length: ms / 50 }, (_, k) => lineAt(k * 50, ms, n));
            expect(seen[0]).toBe(-1);
            expect(seen.at(-1)).toBe(n - 1);
            // em ordem, sem pular nenhuma, e o mesmo pedaço do lineSpan
            expect([...new Set(seen)]).toEqual([-1, ...Array.from({ length: n }, (_, i) => i)]);
            for (let i = 0; i < n; i++) {
                const [a, b] = lineSpan(i, ms, n);
                expect(lineAt(a + 1, ms, n)).toBe(i);
                expect(lineAt(b - 1, ms, n)).toBe(i);
            }
        }
    });

    it('toda fala termina de digitar e fica inteira pelo menos 1,2 s na caixa (Miguel: "não dá pra ler")', () => {
        // a parada do motor (AGENCY.showdown.seconds): a cena cabe nela
        const ms = AGENCY.showdown.seconds * 1000;
        for (const d of [pt, en]) {
            const fits = (text: string, i: number, n: number, at: string) => {
                const [a, b] = lineSpan(i, ms, n);
                expect(typeMs(text) + SHOWDOWN_MS.read, `${at}: ${text}`).toBeLessThanOrEqual(b - a);
            };
            for (const [at, s] of [
                ...Object.entries(d.pairs),
                ...[...d.up, ...d.down].map((x, k) => [`fam.${k}`, x] as const),
                ...Object.entries(d.solo).flatMap(([k, x]) =>
                    [...(x.keeper ?? []), ...(x.shooter ?? [])].map((y) => [k, y] as const),
                ),
            ])
                s.forEach(([, t], i) => {
                    fits(t, i, s.length, at);
                });
            // as genéricas valem na conversa de 4 (a mais apertada)
            for (const t of [...d.shot, ...d.gk, ...d.more]) fits(t, 0, 4, 'generic');
            for (const t of d.shout) fits(t, 3, 4, 'shout');
        }
    });

    it('a digitação pausa curto depois da pontuação (as reticências, uma vez só)', () => {
        const d = typeDelays('Fui. Pode tirar foto.');
        const gap = (i: number) => d[i + 1] - d[i];
        // depois do "Fui." a pausa; entre letras de uma palavra, o passo normal
        expect(gap(3)).toBeGreaterThan(gap(1) + SHOWDOWN_MS.hard / 2);
        const dots = typeDelays('Zzz... BICUDA');
        expect(dots[4] - dots[3]).toBeCloseTo(dots[2] - dots[1]);
        expect(dots[6] - dots[5]).toBeGreaterThan(dots[2] - dots[1]);
        expect(typeMs('Isso não sai daqui, hein.')).toBeLessThanOrEqual(SHOWDOWN_MS.type + SHOWDOWN_MS.char);
    });
});
