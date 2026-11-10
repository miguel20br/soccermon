import { describe, expect, it } from 'vitest';
import { HOLD_MS, healPlan, safariPlan, slotPlan, wheelPlan } from './rota-reveal';

const keys = Array.from({ length: 200 }, (_, i) => `seed-${i}`);

describe('caça-níquel', () => {
    it('ganhou: 3 estrelas, e o 3º rolo demora (o "quase")', () => {
        for (const k of keys) {
            const p = slotPlan(true, k);
            expect(p.stops).toEqual(['star', 'star', 'star']);
            expect(p.near).toBe(true);
            expect(p.at[2] - p.at[1]).toBeGreaterThan(p.at[1] - p.at[0]);
        }
    });
    it('perdeu: nunca 3 iguais; o "quase" só quando os 2 primeiros batem, e acontece', () => {
        const plans = keys.map((k) => slotPlan(false, k));
        for (const p of plans) {
            expect(p.stops[0] === p.stops[1] && p.stops[1] === p.stops[2]).toBe(false);
            expect(p.near).toBe(p.stops[0] === p.stops[1]);
            expect(p.total).toBe(p.at[2] + HOLD_MS);
        }
        expect(plans.some((p) => p.near)).toBe(true);
        expect(plans.some((p) => !p.near)).toBe(true);
    });
    it('a mesma casa mostra a mesma cena', () => {
        expect(slotPlan(false, 'x')).toEqual(slotPlan(false, 'x'));
    });
});

describe('roleta do balcão', () => {
    it('a fatia é a chance e o ponteiro cai na cor do resultado', () => {
        for (const k of keys)
            for (const won of [true, false]) {
                const p = wheelPlan(0.6, won, k);
                expect(p.slice).toBeCloseTo(216);
                // o ângulo da roda que fica embaixo do ponteiro do topo
                const under = (360 - (p.turn % 360)) % 360;
                if (won) expect(under).toBeLessThan(p.slice);
                else expect(under).toBeGreaterThan(p.slice);
                expect(p.turn).toBeGreaterThan(3 * 360);
            }
    });
});

describe('Safari Ball', () => {
    it('pegou: 3 balançadas; fugiu: 1 a 3; as balançadas vêm depois de a bola cair', () => {
        for (const k of keys) {
            expect(safariPlan(true, k).shakes).toBe(3);
            const f = safariPlan(false, k);
            expect(f.shakes).toBeGreaterThanOrEqual(1);
            expect(f.shakes).toBeLessThanOrEqual(3);
            expect(f.shakeAt[0]).toBeGreaterThan(f.landAt);
            expect(f.resultAt).toBeGreaterThan(f.shakeAt.at(-1)!);
        }
        // pegar (3 balançadas) dura no máximo ~3,3 s com o resultado na tela
        expect(safariPlan(true, 'x').total).toBeLessThanOrEqual(3300);
    });
});

describe('Centro Pokémon', () => {
    it('as bolas pousam uma a uma (até 6), o jingle vem depois e a cena fica em ~3,5 s', () => {
        const p = healPlan(7);
        expect(p.ballAt).toHaveLength(6);
        expect(p.jingleAt).toBeGreaterThan(p.ballAt.at(-1)!);
        expect(p.effectAt).toBeGreaterThan(p.jingleAt);
        expect(p.total).toBeLessThanOrEqual(3700);
        expect(healPlan(0).ballAt).toHaveLength(1);
    });
});
