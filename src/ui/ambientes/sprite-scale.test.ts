import { describe, expect, it } from 'vitest';
import { boardScale, estadioScale, realScale, sceneScale } from './sprite-scale';

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
});
