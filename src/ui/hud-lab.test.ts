import { describe, expect, it } from 'vitest';
import { EventBus } from '../game/EventBus';
import { CAM, type CamState, camStep, camTarget, followOffset, HUD_ZOOM_DAMP, readyScene } from './court-follow';
import { hudOn } from './hud-lab';

describe('?lab=hud', () => {
    it('é o padrão (0.9.24); hud-off desliga e fica na aba', () => {
        expect(hudOn('', null)).toBe(true);
        expect(hudOn('?lab=hud', '0')).toBe(true);
        expect(hudOn('?lab=hud-off', '1')).toBe(false);
        expect(hudOn('', '0')).toBe(false);
    });
    it('a quadra segue a bola sem mostrar além das bordas', () => {
        // janela de 390 numa quadra de 900: bola no meio centra, nas pontas encosta na borda
        expect(followOffset(450, 390, 900)).toBe(-255);
        expect(followOffset(20, 390, 900)).toBe(0);
        expect(followOffset(880, 390, 900)).toBe(-510);
    });
    it('o zoom dos lances por cima da quadra grande ainda mostra uns 40% da quadra (390x844)', () => {
        // canvas de ~856 px de largura (altura da quadra na tela), quadra = 880 dos 968 px do mundo
        const shown = (zoom: number) => (390 / 856 / (1 + (zoom - 1) * HUD_ZOOM_DAMP)) * (968 / 880);
        expect(shown(1)).toBeGreaterThan(0.48);
        // Transformar (1.5) e o golpe N3 (1.35): antes fechava em ~33% (2 ou 3 Pokémon e o gol)
        expect(shown(1.5)).toBeGreaterThan(0.4);
        expect(shown(1.35)).toBeGreaterThan(0.43);
    });
});

describe('câmera suave (1x e 2x)', () => {
    const view = 390;
    const full = 650;
    const run = (s: CamState, target: number, secs: number, subject: number | null = null) => {
        let c = s;
        const xs: number[] = [];
        for (let t = 0; t < secs; t += 1 / 60) {
            c = camStep(c, target, subject, 1 / 60, view, full);
            xs.push(c.x);
        }
        return { c, xs };
    };
    it('quem conduz fica atrás do meio, com espaço pro gol que ataca; bola solta mira onde ela vai', () => {
        expect(camTarget(300, 300, 1, 0, view)).toBeCloseTo(300 + CAM.attackLead * view);
        expect(camTarget(300, 300, -1, 0, view)).toBeCloseTo(300 - CAM.attackLead * view);
        expect(camTarget(300, null, 1, 200, view)).toBeCloseTo(300 + 200 * CAM.ballAhead);
        // saída de bola "teleporta": a velocidade enorme não leva a câmera longe
        expect(camTarget(300, null, 1, 99999, view)).toBeCloseTo(300 + CAM.ballAheadMax * view);
    });
    it('troca de posse vira curva: sem salto, sem passar do ponto, e chega', () => {
        const { c, xs } = run({ x: 250, v: 0 }, 400, 3);
        expect(xs[0] - 250).toBeLessThan(2);
        for (let i = 1; i < xs.length; i++) expect(Math.abs(xs[i] - xs[i - 1])).toBeLessThan(8);
        expect(Math.max(...xs)).toBeLessThanOrEqual(400);
        expect(c.x).toBeGreaterThan(400 - CAM.dead * view - 1);
    });
    it('dono novo longe (ou a bola de volta no meio depois do gol) vira panorâmica rápida, não corte', () => {
        let c: CamState = { x: 200, v: 0 };
        for (let i = 0; i < 30; i++) {
            const prev = c.x;
            c = camStep(c, camTarget(550, 550, 1, 0, view), 550, 1 / 60, view, full);
            expect(Math.abs(c.x - prev)).toBeLessThanOrEqual((CAM.catchUp * view) / 60 + 0.01);
        }
    });
    it('tremidinha do alvo dentro da zona morta não mexe a câmera', () => {
        let c: CamState = { x: 300, v: 0 };
        for (let i = 0; i < 120; i++) c = camStep(c, 300 + (i % 2 ? 4 : -4), null, 1 / 60, view, full);
        expect(c.x).toBe(300);
    });
    it('quem tem a bola nunca encosta na borda, e a janela não sai da quadra', () => {
        // contra-ataque rápido: o portador corre 600 px/s pra direita e a mola atrasa
        let c: CamState = { x: 200, v: 0 };
        for (let t = 0; t < 0.6; t += 1 / 60) {
            const p = 200 + 600 * t;
            c = camStep(c, camTarget(p, p, 1, 600, view), p, 1 / 60, view, full);
            expect(p - c.x).toBeLessThanOrEqual(view / 2 - CAM.edge * view + 0.01);
            expect(c.x).toBeLessThanOrEqual(full - view / 2);
        }
        const { xs } = run({ x: 300, v: 0 }, -500, 3);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(view / 2);
        expect(xs.at(-1)).toBeCloseTo(view / 2, 0);
    });
});

describe('cena pronta (girar o celular no meio da partida)', () => {
    it('quem liga a quadra grande depois do create ainda acha a cena; a de partida acabada não vale', () => {
        const scene = { sys: { isActive: () => true } };
        EventBus.emit('current-scene-ready', scene);
        expect(readyScene()).toBe(scene);
        scene.sys.isActive = () => false;
        expect(readyScene()).toBeNull();
    });
    it('a cena destruída sai da memória (não segura a partida que acabou)', () => {
        const fns: Record<string, () => void> = {};
        const scene = {
            sys: { isActive: () => true, events: { once: (ev: string, fn: () => void) => (fns[ev] = fn) } },
        };
        EventBus.emit('current-scene-ready', scene);
        expect(readyScene()).toBe(scene);
        fns.destroy();
        scene.sys.isActive = () => true;
        expect(readyScene()).toBeNull();
    });
});
