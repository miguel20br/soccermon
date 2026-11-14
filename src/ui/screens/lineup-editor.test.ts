import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {}, playCry: () => {} }));

import { LineupEditor } from './Lineup';

const props = {
    title: 'Time',
    formation: '1-2-1',
    lineup: [],
    bench: [],
    byUid: new Map(),
    captainUid: null,
    tactic: 'balanced',
    cornerPlan: 'mixed',
    cornerTakerUid: null,
    locked: false,
    onFormation: () => {},
    onSwap: () => {},
    onTactic: () => {},
    onCorner: () => {},
    side: null,
};

describe('escalação (LineupEditor)', () => {
    // no Duelo não tem troca de capitão; sem sinergia o painel ficava vazio no PC
    it('sem capitão pra trocar e sem sinergia, não sobra painel vazio', () => {
        expect(renderToStaticMarkup(createElement(LineupEditor, props as never))).not.toContain('vt-team');
    });
    it('na copa (troca de capitão) o painel continua', () => {
        const html = renderToStaticMarkup(createElement(LineupEditor, { ...props, onCaptain: () => {} } as never));
        expect(html).toContain('vt-team');
    });
});
