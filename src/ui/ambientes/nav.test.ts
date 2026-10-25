import { describe, expect, it } from 'vitest';
import { ambientesOn, dragPos, START, snapTab, TABS } from './nav';

describe('navegação por ambientes', () => {
    it('abre no Estádio, a aba do meio', () => {
        expect(TABS[START]).toBe('estadio');
        expect(START).toBe(Math.floor(TABS.length / 2));
    });

    it('bandeira desligada = Home de sempre', () => {
        expect(ambientesOn('', null)).toBe(false);
        expect(ambientesOn('?lab=golpes', null)).toBe(false);
        expect(ambientesOn('?demo=mapa', null)).toBe(false);
    });

    it('?lab=ambientes liga, e fica ligado na aba depois que a URL muda; ?lab=off desliga', () => {
        expect(ambientesOn('?lab=ambientes', null)).toBe(true);
        expect(ambientesOn('?demo=mapa&lab=ambientes', null)).toBe(true);
        expect(ambientesOn('', '1')).toBe(true);
        expect(ambientesOn('?lab=off', '1')).toBe(false);
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
});
