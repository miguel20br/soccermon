import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { maxCharge } from '../../engine/agency';
import type { MatchEvent } from '../../engine/state';
import { type AgencyView, chargeAt, SidelineControls } from './Sideline';

const view = (cue: boolean): AgencyView => ({
    timeoutUsed: false,
    timeoutPending: false,
    flyOn: false,
    flyPending: null,
    max: { charge: 1, level: 1, active: false },
    maxPending: false,
    maxCue: cue && 'hora',
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
        expect(html(true)).toMatch(/aria-live="polite">Golpe máximo: Agora! \(Nível 1\)</);
    });
});

describe('chargeAt', () => {
    it('o mesmo maxCharge, guardado por time/tick; evento novo no fim conta', () => {
        const events = [{ type: 'max', tick: 100, team: 0, by: 0, phase: 'start', level: 3, q: 1 }] as MatchEvent[];
        const a = chargeAt(events, 0, 120);
        expect(a).toEqual(maxCharge(events, 0, 120, 5));
        expect(chargeAt(events, 0, 120)).toBe(a);
        expect(a.active).toBe(true);
        events.push({ type: 'max', tick: 110, team: 0, by: 0, phase: 'hit', level: 3, q: 1 } as MatchEvent);
        expect(chargeAt(events, 0, 120).active).toBe(false);
    });
});
