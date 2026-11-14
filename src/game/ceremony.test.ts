import { describe, expect, it } from 'vitest';
import {
    CHARGE_MS,
    ceremonyCamera,
    ceremonyPlan,
    endPose,
    fanPose,
    halfMoon,
    invasionFans,
    reducedHold,
    TOSS_MS,
    tossHeight,
} from './ceremony';

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
        // a maior parte atrás do time (em cima), poucos na frente; e gente variada (pele, cabelo, altura)
        expect(a.filter((f) => f.to.y < c.y).length).toBeGreaterThan(a.length / 2);
        expect(new Set(a.map((f) => f.look.skin)).size).toBeGreaterThanOrEqual(4);
        expect(new Set(a.map((f) => f.look.hair)).size).toBeGreaterThanOrEqual(4);
        expect(a.some((f) => f.look.short) && a.some((f) => !f.look.short)).toBe(true);
        expect(a.some((f) => f.look.extra === 'bandeira') && a.some((f) => f.look.extra === 'cachecol')).toBe(true);
    });

    it('o pulo do torcedor agacha antes e depois (antecipação e amortecimento) e cada um tem o seu ritmo', () => {
        const [f, g] = invasionFans('seed-2', { x: 484, y: 264 }, 40, { w: 968, h: 528 }).filter((x) => x.jumps);
        const at = (ms: number) => fanPose(f, ms, false);
        const u0 = (1 - f.phase) * f.period;
        expect(at(u0 + 0.05 * f.period)).toEqual({ frame: 'crouch', air: 0 });
        expect(at(u0 + 0.53 * f.period).frame).toBe('up');
        expect(at(u0 + 0.53 * f.period).air).toBeGreaterThan(f.hop * 0.9);
        expect(at(u0 + 0.95 * f.period).frame).toBe('crouch');
        expect([f.period, f.phase]).not.toEqual([g.period, g.phase]);
    });

    it('capitão pro alto: 3 parábolas, a 3ª a mais alta, e volta pro chão', () => {
        expect(tossHeight(0)).toBe(0);
        expect(tossHeight(TOSS_MS * 3)).toBe(0);
        const tops = [0.5, 1.5, 2.5].map((k) => tossHeight(TOSS_MS * k));
        expect(tops[2]).toBeGreaterThan(tops[1]);
        expect(tops[1]).toBeGreaterThan(tops[0]);
    });

    it('a câmera anda sem pulo: começa no zoom do apito e termina no quadro da foto', () => {
        for (const kind of ['taca', 'invasao'] as const) {
            const p = ceremonyPlan(kind);
            expect(ceremonyCamera(kind, 0, 1.1).zoom).toBeCloseTo(1.1);
            let prev = ceremonyCamera(kind, 0, 1.1);
            for (let t = 20; t <= p.end; t += 20) {
                const now = ceremonyCamera(kind, t, 1.1);
                expect(Math.abs(now.zoom - prev.zoom)).toBeLessThan(0.05);
                prev = now;
            }
            // na foto o time desce na tela (a placa fica no alto)
            expect(ceremonyCamera(kind, p.end, 1.1).up).toBeGreaterThan(20);
        }
    });
});

describe('fim de jogo com cara (B2)', () => {
    const all = () => true;
    it('quem ganhou pula, quem perdeu senta, empate fica no Idle', () => {
        expect(endPose(0, 0, 0, all, false).anim).toBe('Hop');
        expect(endPose(1, 0, 0, all, false).anim).toBe('Sit');
        expect(endPose(1, 1, 0, all, false).anim).toBe('Hop');
        expect(endPose(0, null, 0, all, false).anim).toBe('Idle');
        expect(endPose(1, null, 0, all, false).anim).toBe('Idle');
    });
    it('sem Sit fica cabisbaixo (Hurt); sem nada, Idle sem erro', () => {
        const semSit = (a: string) => a !== 'Sit';
        expect(endPose(1, 0, 0, semSit, false).anim).toBe('Hurt');
        expect(endPose(1, 0, 0, () => false, false).anim).toBe('Idle');
        expect(endPose(0, 0, 0, () => false, false).anim).toBe('Idle');
    });
    it('cada um com um atraso; Reduzir movimento: pose parada, sem pulo', () => {
        const d = [0, 1, 2, 3, 4].map((s) => endPose(0, 0, s, all, false).delay);
        expect(d).toEqual([...d].sort((a, b) => a - b));
        expect(new Set(d).size).toBe(5);
        const r = endPose(0, 0, 0, all, true);
        expect(r.anim).toBe('Pose');
        expect(r.still).toBe(true);
        expect(endPose(0, 0, 0, (a) => a !== 'Pose', true).anim).toBe('Hop');
        expect(endPose(0, 0, 0, all, false).still).toBe(false);
    });
});
