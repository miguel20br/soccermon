import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { type AgencyView, SidelineControls } from './Sideline';

const view = (cue: boolean): AgencyView => ({
    timeoutUsed: false,
    timeoutPending: false,
    flyOn: false,
    flyPending: null,
    max: { charge: 1, used: false, active: false } as AgencyView['max'],
    maxPending: false,
    maxCue: cue,
});
const html = (cue: boolean) =>
    renderToStaticMarkup(
        createElement(SidelineControls, { view: view(cue), canAct: true, onFlyGk: () => {}, onMax: () => {} }),
    );
const maxButton = (out: string) => out.match(/<button[^>]*sl-max[^>]*>/)![0];

describe('golpe máximo no teclado e no leitor de tela', () => {
    it('apagado: fica no Tab (aria-disabled, sem disabled) e o aviso está vazio', () => {
        const b = maxButton(html(false));
        expect(b).toContain('aria-disabled="true"');
        expect(b).not.toMatch(/\sdisabled=""/);
        expect(html(false)).toContain('aria-live="polite"></span>');
    });
    it('aceso: o aviso fala a hora', () => {
        expect(maxButton(html(true))).toContain('aria-disabled="false"');
        expect(html(true)).toMatch(/aria-live="polite">Golpe máximo: Agora!</);
    });
});
