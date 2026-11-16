import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// card da esteira (16/11/2026): no celular, ao tocar em Descartar numa copa guardada, a confirmação aparecia sem a
// caixa (fundo e borda) da linha, só o texto e os botões soltos sobre a quadra. As duas telas usam a mesma caixa
const ask = vi.hoisted(() => ({ value: null as null | { kind: 'swap' | 'discard'; seed: string } }));
vi.mock('react', async (orig) => {
    const react = await orig<typeof import('react')>();
    return { ...react, useState: (init: unknown) => [ask.value ?? init, () => {}] };
});
vi.mock('../../store/game-store', () => {
    const cup = { seed: 'guardada', teamName: 'Cerulean Stars', status: 'drafting', draftRound: 0, results: [] };
    const state = {
        run: { ...cup, seed: 'atual', teamName: 'Pallet FC' },
        parkedRuns: [cup],
        resumeParked: () => {},
        discardParked: () => {},
        settings: { lang: 'pt' },
    };
    return {
        useGame: (sel: (s: typeof state) => unknown) => sel(state),
        isCupInProgress: (r: unknown) => !!r,
    };
});
vi.mock('./AccountLink', () => ({ cupStep: () => 'Draft' }));

const { ParkedRuns } = await import('./ParkedRuns');
const rootClasses = () => {
    const html = renderToStaticMarkup(createElement(ParkedRuns));
    return html.match(/^<div class="([^"]+)"/)![1].split(' ');
};
const css = readFileSync('src/ui/components/account-link.css', 'utf8');
const rule = (sel: string) => css.match(new RegExp(`(?:^|\\n)\\${sel} \\{([^}]*)\\}`))?.[1] ?? '';

describe('copa guardada: a caixa não some', () => {
    it('a caixa tem fundo e borda', () => {
        expect(rule('.parked-box')).toMatch(/background:/);
        expect(rule('.parked-box')).toMatch(/border:/);
    });

    it('linha, Descartar e Retomar (troca) usam a mesma caixa', () => {
        ask.value = null;
        expect(rootClasses()).toContain('parked-box');
        ask.value = { kind: 'discard', seed: 'guardada' };
        expect(rootClasses()).toContain('parked-box');
        ask.value = { kind: 'swap', seed: 'guardada' };
        expect(rootClasses()).toContain('parked-box');
    });
});
