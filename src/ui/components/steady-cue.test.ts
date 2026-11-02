import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { type CueHold, MAX_CUE_MIN_MS, type MaxCueKind, steadyCue } from './Sideline';

/** Botão aceso quadro a quadro (16 ms) pra uma sequência da hora crua (`maxCueAt`). */
function shown(raw: MaxCueKind[], linger = true, ringEnd: number | null = null) {
    let hold: CueHold | null = null;
    return raw.map((r, i) => {
        hold = steadyCue(hold, r, i * 16, linger, ringEnd);
        return hold?.kind ?? false;
    });
}

describe('botão do golpe máximo sem pisca (Miguel, 01/11: "aparece e depois some")', () => {
    it('a hora que apaga por um instante (passe pra trás, perdida) não apaga o botão', () => {
        const raw: MaxCueKind[] = [...Array(10).fill('call'), ...Array(6).fill(false), ...Array(10).fill('call')];
        expect(shown(raw).every((k) => k === 'call')).toBe(true);
    });

    it('aceso por um quadro só fica o tempo mínimo e depois apaga', () => {
        const n = Math.ceil(MAX_CUE_MIN_MS / 16) + 5;
        const out = shown(['call', ...Array(n).fill(false)]);
        expect(out[Math.floor(MAX_CUE_MIN_MS / 16) - 1]).toBe('call');
        expect(out.at(-1)).toBe(false);
    });

    it('espera o anel fechar, mesmo depois do tempo mínimo', () => {
        const ringEnd = MAX_CUE_MIN_MS + 800;
        const out = shown(['hora', ...Array(Math.ceil(ringEnd / 16) + 3).fill(false)], true, ringEnd);
        expect(out[Math.floor((ringEnd - 20) / 16)]).toBe('hora');
        expect(out.at(-1)).toBe(false);
    });

    it('motivo claro (bola parada, gol, a bicuda depois do toque do goleiro): some na hora', () => {
        expect(shown(['hora', false], false)).toEqual(['hora', false]);
    });

    it('a hora certa no meio do "chamar o capitão" troca o motivo (o anel da hora certa nasce de novo)', () => {
        expect(shown(['call', 'call', 'hora'])).toEqual(['call', 'call', 'hora']);
    });
});
