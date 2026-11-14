import { describe, expect, it } from 'vitest';
import { needsScroll, placeBalloon } from './place';

describe('placeBalloon (dica com o dedo)', () => {
    const b = { width: 280, height: 60 };
    it('deixa o vão do dedo entre a linha e o alvo', () => {
        const p = placeBalloon({ left: 100, top: 100, width: 80, height: 40 }, b, 390, 844, 34);
        expect(p.side).toBe('below');
        expect(p.top).toBe(100 + 40 + 34);
    });
    it('alvo que ocupa a tela: a linha fica dentro dele, não no pé da tela (lá mora o botão de jogar)', () => {
        const p = placeBalloon({ left: 12, top: 60, width: 366, height: 700 }, b, 390, 844, 34);
        expect(p.side).toBe('inside');
        expect(p.top + b.height).toBeLessThanOrEqual(60 + 700);
        expect(p.top + b.height).toBeLessThan(844 - 76);
    });
});

describe('needsScroll', () => {
    it('alvo que cabe na tela não rola (nem perto da borda)', () => {
        expect(needsScroll({ top: 20, bottom: 70 }, 720)).toBe(false);
        expect(needsScroll({ top: 640, bottom: 700 }, 720)).toBe(false);
    });
    it('alvo cortado rola', () => {
        expect(needsScroll({ top: -5, bottom: 40 }, 720)).toBe(true);
        expect(needsScroll({ top: 680, bottom: 760 }, 720)).toBe(true);
    });
});
