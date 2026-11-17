import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    CUT_IN_MS,
    CUT_OUT_MS,
    cutGeometry,
    cutKind,
    PANEL_IN_MS,
    PANEL_OUT_MS,
    PANEL_STAGGER_MS,
    PANELS,
    panelGeometry,
    slowmoExit,
} from './tv';

describe('corte de TV', () => {
    it('dura 200–300 ms (ADR 0004) e a faixa cobre a tela inteira no meio, começando e acabando fora dela', () => {
        expect(CUT_IN_MS + CUT_OUT_MS).toBeGreaterThanOrEqual(200);
        expect(CUT_IN_MS + CUT_OUT_MS).toBeLessThanOrEqual(300);
        for (const [w, h] of [
            [390, 844],
            [1440, 900],
            [320, 568],
            [844, 390],
            [1920, 1080],
        ]) {
            const g = cutGeometry(w, h);
            // borda da esquerda (no topo, x + s) e da direita (embaixo, x + width - s) em cada ponto
            expect(g.start).toBeGreaterThanOrEqual(w);
            expect(g.cover + g.s).toBeLessThanOrEqual(0);
            expect(g.cover + g.width - g.s).toBeGreaterThanOrEqual(w);
            expect(g.end + g.width).toBeLessThanOrEqual(0);
        }
    });
});

describe('corte da Semana Fora da Lei', () => {
    it('fora do tema é a faixa de sempre (nem `?transicao` muda); no tema é a neon A, e B só com o atalho no dev', () => {
        expect(cutKind(false, '', true)).toBe('tv');
        expect(cutKind(false, '?transicao=b', true)).toBe('tv');
        expect(cutKind(true, '', false)).toBe('a');
        expect(cutKind(true, '?transicao=a', true)).toBe('a');
        expect(cutKind(true, '?transicao=b', true)).toBe('b');
        // produção: o atalho não vale
        expect(cutKind(true, '?transicao=b', false)).toBe('a');
    });
    it('os painéis duram 200–300 ms e, parados, cobrem a tela inteira', () => {
        const total = 2 * (PANELS - 1) * PANEL_STAGGER_MS + PANEL_IN_MS + PANEL_OUT_MS;
        expect(total).toBeGreaterThanOrEqual(200);
        expect(total).toBeLessThanOrEqual(300);
        for (const [w, h] of [
            [390, 844],
            [1440, 900],
            [320, 568],
            [844, 390],
            [1920, 1080],
        ]) {
            const g = panelGeometry(w, h);
            // em cima a coluna vai de left + s a left + width; embaixo de left a left + width - s
            expect(g.left(0) + g.s).toBeLessThanOrEqual(0);
            expect(g.left(PANELS - 1) + g.width - g.s).toBeGreaterThanOrEqual(w);
            for (let i = 1; i < PANELS; i++) expect(g.left(i)).toBeLessThanOrEqual(g.left(i - 1) + g.width - g.s);
        }
    });
    it('a saída em câmera lenta só existe no tema: fora dele troca na hora', () => {
        let n = 0;
        slowmoExit(() => n++);
        expect(n).toBe(1);
    });
});

it('o estilo da faixa vem com o tv.ts (no tv.css do menu de modos ela ficava invisível até abrir o menu)', () => {
    expect(readFileSync('src/ui/tv.ts', 'utf8')).toContain("import './tv-cut.css';");
    expect(readFileSync('src/ui/tv-cut.css', 'utf8')).toContain('.tv-cut-band {');
});
