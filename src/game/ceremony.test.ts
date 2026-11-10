import { describe, expect, it } from 'vitest';
import { CHARGE_MS, ceremonyPlan, halfMoon, invasionFans, reducedHold, TOSS_MS } from './ceremony';

describe('cerimônia do título', () => {
    it('taça curta em ~3 s; invasão da Rota em 10 a 12 s, na ordem do storyboard', () => {
        const taca = ceremonyPlan('taca');
        expect(taca.end).toBeLessThanOrEqual(3000);
        expect(taca.lift - taca.charge).toBe(CHARGE_MS);
        const rota = ceremonyPlan('invasao');
        expect(rota.end).toBeGreaterThanOrEqual(10000);
        expect(rota.end).toBeLessThanOrEqual(12000);
        const order = [rota.jump, rota.invade, rota.ring, rota.toss, rota.getUp, rota.charge, rota.lift, rota.photo];
        expect(order).toEqual([...order].sort((a, b) => (a ?? 0) - (b ?? 0)));
        // as 3 subidas acabam antes de ele levantar
        expect((rota.toss ?? 0) + TOSS_MS * 3).toBeLessThanOrEqual(rota.getUp ?? 0);
        // Reduzir movimento: a foto (a taça já erguida) fica um instante antes de seguir
        expect(taca.end - reducedHold('taca')).toBeGreaterThanOrEqual(taca.lift);
        expect(rota.end - reducedHold('invasao')).toBeGreaterThanOrEqual(rota.photo ?? 0);
    });

    it('meia-lua: o capitão na frente, os outros atrás e espalhados', () => {
        const { captain, others } = halfMoon({ x: 400, y: 200 }, 4);
        for (const o of others) expect(o.y).toBeLessThan(captain.y);
        const xs = others.map((o) => o.x);
        expect(new Set(xs).size).toBe(4);
        expect(Math.min(...xs)).toBeLessThan(captain.x);
        expect(Math.max(...xs)).toBeGreaterThan(captain.x);
    });

    it('a torcida desce de fora da quadra até um anel em volta do time, igual em toda gravação', () => {
        const c = { x: 484, y: 264 };
        const a = invasionFans('seed-1', c, 38, { w: 968, h: 528 });
        expect(invasionFans('seed-1', c, 38, { w: 968, h: 528 })).toEqual(a);
        for (const f of a) {
            expect(f.from.y < 0 || f.from.y > 528).toBe(true);
            // ninguém pisa dentro da meia-lua do time
            expect(((f.to.x - c.x) / 108) ** 2 + ((f.to.y - c.y) / 60) ** 2).toBeGreaterThanOrEqual(0.95);
        }
    });
});
