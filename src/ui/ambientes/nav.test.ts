import { describe, expect, it } from 'vitest';
import { dragPos, START, skyOf, snapTab, TABS } from './nav';

describe('navegação por ambientes', () => {
    it('abre no Estádio, a aba do meio', () => {
        expect(TABS[START]).toBe('estadio');
        expect(START).toBe(Math.floor(TABS.length / 2));
    });

    it('arrastar mais da metade troca de aba; menos volta pra mesma', () => {
        const w = 390;
        expect(snapTab(START, -250, 0, w)).toBe(START + 1); // dedo pra esquerda: aba da direita
        expect(snapTab(START, 250, 0, w)).toBe(START - 1);
        expect(snapTab(START, -120, 0, w)).toBe(START);
    });

    it('peteleco rápido troca mesmo curto; toque parado não troca', () => {
        expect(snapTab(START, -40, -0.8, 390)).toBe(START + 1);
        expect(snapTab(START, 40, 0.8, 390)).toBe(START - 1);
        expect(snapTab(START, -10, -0.8, 390)).toBe(START);
    });

    it('nunca pula duas abas nem sai das pontas', () => {
        expect(snapTab(START, -900, 0, 390)).toBe(START + 1);
        expect(snapTab(0, 300, 1, 390)).toBe(0);
        expect(snapTab(TABS.length - 1, -300, -1, 390)).toBe(TABS.length - 1);
    });

    it('nas pontas o arrasto é elástico', () => {
        expect(dragPos(0, 300, 300)).toBeCloseTo(-1 / 3);
        expect(dragPos(START, -195, 390)).toBeCloseTo(START + 0.5);
    });

    it('céu pela hora: dia, fim de tarde e noite', () => {
        expect([5, 6, 12, 16, 17, 18, 19, 23, 0].map(skyOf)).toEqual([
            'noite',
            'dia',
            'dia',
            'dia',
            'tarde',
            'tarde',
            'noite',
            'noite',
            'noite',
        ]);
    });

    it('com abas apagadas, o arrasto anda só entre as acesas (last = a última acesa)', () => {
        const w = 390;
        // acesas: Lab, Rota, Estádio (posição 2 de 0..2): pra direita não tem mais nada
        expect(snapTab(2, -250, -1, w, 2)).toBe(2);
        expect(snapTab(2, 250, 1, w, 2)).toBe(1);
        expect(dragPos(2, -w, w, 2)).toBeCloseTo(2 + 1 / 3);
    });
});
