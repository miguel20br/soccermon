import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import portraits from '../data/portraits.json';
import { resolveAnim } from '../game/animation-manager';
import { STORY_TEXT } from '../i18n/story';
import { castOf, compile, cursorAt, nextStop, type SceneScript, sayEnd, textsOf, wordCount } from './director';
import { palletChoice, palletOpening, STARTERS } from './scenes/pallet';

const SCENES: SceneScript[] = [palletOpening, ...STARTERS.map(palletChoice)];

describe('diretor de cena', () => {
    const mini: SceneScript = {
        id: 'mini',
        bpm: 120,
        steps: [
            { at: 2, do: 'say', who: 'who.blue', text: 'pallet.blue.pick' },
            { at: 0, do: 'cut', stage: 'lab' },
            { at: 0, do: 'actor', id: 'a', mon: 25, x: 0.5, y: 0.5 },
            { at: 4, do: 'cut', stage: 'pallet' },
            { at: 1, do: 'flash' },
            { at: 6, do: 'end' },
        ],
    };

    it('põe os passos em ordem de tempo, e no empate na ordem escrita', () => {
        const c = compile(mini);
        expect(c.steps.map((s) => [s.t, s.step.do])).toEqual([
            [0, 'cut'],
            [0, 'actor'],
            [500, 'flash'],
            [1000, 'say'],
            [2000, 'cut'],
            [3000, 'end'],
        ]);
        expect(c.total).toBe(3000);
    });

    it('exige um único passo final, no fim', () => {
        expect(() => compile({ ...mini, steps: mini.steps.filter((s) => s.do !== 'end') })).toThrow();
        expect(() => compile({ ...mini, steps: [...mini.steps, { at: 1, do: 'end' }] })).toThrow();
        expect(() => compile({ ...mini, steps: [...mini.steps, { at: 9, do: 'flash' }] })).toThrow();
    });

    it('o toque leva ao próximo corte ou fala; pular leva ao fim', () => {
        const c = compile(mini);
        expect(nextStop(c, 0)).toBe(1000);
        expect(nextStop(c, 1000)).toBe(2000);
        expect(nextStop(c, 2500)).toBe(3000);
        expect(cursorAt(c, 0)).toBe(2);
        expect(cursorAt(c, c.total)).toBe(c.steps.length);
        // a fala fica até o próximo corte de cenário
        expect(sayEnd(c, 3)).toBe(2000);
    });
});

describe('cenas', () => {
    for (const scene of SCENES) {
        it(`${scene.id}: até 35 s, até 3 falas, letreiro de até 4 palavras e fala de até 12, em pt e en`, () => {
            const c = compile(scene);
            expect(c.total).toBeLessThanOrEqual(35_000);
            const { titles, lines, who } = textsOf(scene);
            expect(lines.length).toBeLessThanOrEqual(3);
            for (const lang of ['pt', 'en'] as const) {
                const tx = STORY_TEXT[lang];
                for (const k of titles) {
                    expect(wordCount(tx[k]), `${lang} ${k}`).toBeLessThanOrEqual(4);
                    expect(tx[k]).toBe(tx[k].toUpperCase());
                }
                for (const k of lines) {
                    expect(wordCount(tx[k]), `${lang} ${k}`).toBeGreaterThan(0);
                    expect(wordCount(tx[k]), `${lang} ${k}`).toBeLessThanOrEqual(12);
                }
                for (const k of who) expect(tx[k]).toBeTruthy();
            }
        });

        it(`${scene.id}: toda animação e retrato existem no PMD`, () => {
            const extra = (id: number): string[] => {
                try {
                    return Object.keys(
                        JSON.parse(readFileSync(`public/assets/field/extra/${id}.json`, 'utf8')).anims ?? {},
                    );
                } catch {
                    return [];
                }
            };
            const monOf = new Map<string, number>();
            for (const s of scene.steps) {
                if (s.do === 'actor' && s.mon) monOf.set(s.id, s.mon);
                const anim = s.do === 'anim' ? s.anim : s.do === 'actor' && s.mon ? s.anim : undefined;
                if (!anim) continue;
                const mon = s.do === 'actor' ? s.mon : s.do === 'anim' ? monOf.get(s.id) : undefined;
                expect(mon, `${scene.id}: ator sem Pokémon`).toBeTruthy();
                const ok = resolveAnim(mon as number, anim) === anim || extra(mon as number).includes(anim);
                expect(ok, `${mon} ${anim}`).toBe(true);
            }
            const faces = portraits as Record<string, string[]>;
            for (const f of castOf(scene).faces) {
                const [mon, face] = f.split(':');
                expect(faces[mon], f).toContain(face);
            }
        });
    }
});
