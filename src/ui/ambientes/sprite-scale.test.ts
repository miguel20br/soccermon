import { describe, expect, it } from 'vitest';
import { boardScale, estadioScale, pixelFit, realScale, sceneScale } from './sprite-scale';

describe('escala dos sprites fora da partida (revisão de arte)', () => {
    it('uma escala por tamanho de tela: pequeno 1, celular 2, PC 3', () => {
        expect(sceneScale(true, false)).toBe(1);
        expect(sceneScale(false, false)).toBe(2);
        expect(sceneScale(false, true)).toBe(3);
    });
    it('sem zoom, a escala pedida', () => {
        expect(realScale(2)).toEqual({ css: 2, zoom: 1 });
        expect(realScale(3, 1, 1)).toEqual({ css: 3, zoom: 1 });
    });
    it('palco do PC (zoom 1,35): desfaz o zoom e fica no inteiro de baixo (Treino 3 x 1,35 = 4,05 vira 4)', () => {
        const r = realScale(3, 1.35);
        expect(r.css).toBe(4);
        expect(r.zoom * 1.35).toBeCloseTo(1);
        expect(realScale(2, 1.35).css).toBe(2);
        expect(realScale(1, 0.8).css).toBe(1);
    });
    it('zoom de encaixe abaixo de 1 (prancheta do draft no PC): continua na escala pedida, não cai pra 1x', () => {
        expect(realScale(2, 0.92).css).toBe(2);
        expect(realScale(2, 0.92).zoom * 0.92).toBeCloseTo(1);
    });
    it('onde pede presença: Estádio do PC 4x, prancheta do Estádio 2x', () => {
        expect([estadioScale(true, false), estadioScale(false, false), estadioScale(false, true)]).toEqual([1, 2, 4]);
        expect([boardScale(true), boardScale(false)]).toEqual([1, 2]);
    });
    it('tela com 2 pixels por px (retina): conta em pixel do aparelho', () => {
        expect(realScale(2, 1, 2).css).toBe(2);
        expect(realScale(2, 1.35, 2).css).toBe(2.5);
        // Windows a 125%: 2 x 1,25 = 2,5 pixels, desce pra 2 (inteiro)
        expect(realScale(2, 1, 1.25).css * 1.25).toBe(2);
    });
    it('GIF clássico em pixel exato: degrau inteiro (ou 1/2, 1/3) de pixel do aparelho mais perto do tamanho de antes', () => {
        // cada pixel do GIF vira um número inteiro de pixels da tela, ou exatamente 1/n
        const device = (h: number, n: number, z = 1, dpr = 1) => (pixelFit(h, n, z, dpr) * z * dpr) / n;
        const ok = (k: number) => Number.isInteger(k) || Number.isInteger(1 / k);
        for (const [h, n, z, dpr] of [
            [38, 72, 1, 3],
            [38, 61, 1, 3],
            [46, 89, 1, 2],
            [22, 117, 1, 1],
            [127, 71, 1, 3],
            [38, 84, 1.25, 1],
        ])
            expect(ok(device(h, n, z, dpr))).toBe(true);
        // Charizard (89 px) na vaga de 46 px no PC: metade exata (44,5), não 46 esticado
        expect(pixelFit(46, 89)).toBe(44.5);
        // celular 3x, vaga de 38 px: Starmie (61) 2 pixels por pixel; Lapras (72) também (48 px, até 30% acima)
        expect(pixelFit(38, 61, 1, 3)).toBeCloseTo(122 / 3);
        expect(pixelFit(38, 72, 1, 3)).toBe(48);
        // passaria de 30% acima: fica no degrau de baixo (Gyarados 84 px: 28, não 56)
        expect(pixelFit(38, 84, 1, 3)).toBe(28);
        // Pidgeotto (117 px) na vaga de 22 px no PC: 1/5 (23,4 px), o degrau mais perto
        expect(pixelFit(22, 117)).toBeCloseTo(117 / 5);
    });
});
