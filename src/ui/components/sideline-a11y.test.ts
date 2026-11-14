import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { maxCharge } from '../../engine/agency';
import type { MatchEvent } from '../../engine/state';
import { type AgencyView, chargeAt, PenaltyOrderPanel, SidelineControls } from './Sideline';

const view = (cue: boolean): AgencyView => ({
    timeoutUsed: false,
    timeoutPending: false,
    flyOn: false,
    flyPending: null,
    max: { charge: 1, level: 1 },
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
        const events = [{ type: 'save', tick: 100, by: 0 }] as MatchEvent[];
        const a = chargeAt(events, 0, 120);
        expect(a).toEqual(maxCharge(events, 0, 120, 5));
        expect(chargeAt(events, 0, 120)).toBe(a);
        expect(a.charge).toBeGreaterThan(0);
        events.push({ type: 'max', tick: 110, team: 0, by: 0, phase: 'hit', level: 1, q: 1 } as MatchEvent);
        expect(chargeAt(events, 0, 120).charge).toBe(0);
    });
});

describe('ordem dos pênaltis', () => {
    // retorno do Miguel (30/10, "o menu de quem bate tá bem cagado"): sem o chute à vista, a escolha era no escuro
    it('mostra o chute de cada cobrador na faixa da carta', () => {
        const takers = [
            { uid: 'a', name: 'Aerodactyl', sprite: '', gk: false, shot: 81 },
            { uid: 'b', name: 'Persian', sprite: '', gk: false, shot: 70 },
            { uid: 'c', name: 'Slowbro', sprite: '', gk: true, shot: 52 },
        ];
        const out = renderToStaticMarkup(
            createElement(PenaltyOrderPanel, { takers, onConfirm: () => {}, onKeep: () => {} }),
        );
        expect(out).toMatch(/sl-pen-shot ouro"><small>CHU<\/small>81/);
        expect(out).toMatch(/sl-pen-shot prata"><small>CHU<\/small>70/);
        expect(out).toMatch(/sl-pen-shot bronze"><small>CHU<\/small>52/);
    });
});
