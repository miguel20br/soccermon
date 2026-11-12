import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cargaLab, MaxMeter } from './MaxMeter';

const at = (search: string) => {
    vi.stubGlobal('__SMOKE__', true);
    vi.stubGlobal('window', { location: { search } });
};

describe('prévia da barrinha (?barra, ?carga)', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('fora do dev e das prévias não mexe em nada', () => {
        expect(cargaLab()).toBeNull();
        vi.stubGlobal('__SMOKE__', false);
        vi.stubGlobal('window', { location: { search: '?carga=3' } });
        expect(cargaLab()).toBeNull();
    });

    it('?carga=N para no nível N com a barra a meio caminho; N3 cheia', () => {
        at('?carga=2');
        expect(cargaLab()).toEqual({ charge: 2.5 / 3, level: 2 });
        at('?carga=3');
        expect(cargaLab()).toEqual({ charge: 1, level: 3 });
    });

    it('?carga=sobe vai de N0 a N3 em degraus e para cheia', () => {
        at('?carga=sobe');
        const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
        expect(cargaLab()?.level).toBe(0);
        const levels: number[] = [];
        for (let t = 1000; t <= 1000 + 12000; t += 100) {
            now.mockReturnValue(t);
            levels.push(cargaLab()!.level);
        }
        expect(levels.at(-1)).toBe(3);
        expect(cargaLab()!.charge).toBe(1);
        // nunca desce nem pula nível
        expect(levels.every((l, i) => i === 0 || l === levels[i - 1] || l === levels[i - 1] + 1)).toBe(true);
        now.mockRestore();
    });

    it('gomos: acende um bloco por nível', () => {
        const out = renderToStaticMarkup(
            createElement(MaxMeter, { variant: 'a', max: { charge: 0.8, level: 2 }, size: 'thumb' }),
        );
        expect(out.match(/mm-cell c\d on/g)).toHaveLength(2);
    });
});
