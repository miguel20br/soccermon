import { describe, expect, it, vi } from 'vitest';
import { MAX_CHARGE_MS, MAX_N12 } from './max-show';

// a tabela é pura; o Phaser só entra quando há cena (no Node ele nem carrega)
vi.mock('phaser', () => ({ default: {} }));

describe('golpe máximo N1/N2 e bicuda na escada (max-show.ts)', () => {
    it('não alonga a partida: N1 como antes (0,2 s), N2 e bicuda no máximo +0,2 s', () => {
        expect(MAX_CHARGE_MS[1]).toBe(200);
        expect(MAX_CHARGE_MS[2]).toBe(300);
        expect(MAX_N12.closeMs).toBeLessThanOrEqual(200);
    });

    it('o letreiro fica parado tempo de ler (pelo menos 1,2 s) e o close sai antes dele entrar', () => {
        expect(MAX_N12.tagMs).toBeGreaterThanOrEqual(1200);
        expect(MAX_N12.whipMs).toBeLessThan(MAX_N12.tagMs);
    });

    it('a história do tipo no voo é menor que a do N3 (1) e a bicuda leva o rastro mais grosso no N2', () => {
        for (const k of Object.values(MAX_N12.story)) {
            expect(k).toBeGreaterThan(0);
            expect(k).toBeLessThan(1);
        }
        expect(MAX_N12.trail[2]).toBeGreaterThan(MAX_N12.trail[1]);
    });
});
