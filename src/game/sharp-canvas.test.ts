import { describe, expect, it } from 'vitest';
import { naturalScale, type SharpGame, sharpCanvas } from './sharp-canvas';

type Box = [number, number, number, number];

/** Um Game de mentira: canvas, ScaleManager (FIT) e o wrapper do GL que guarda o que chegou no gl.viewport/gl.scissor. */
function fakeGame(displayW: number) {
    const gl = { viewport: [] as number[], scissor: [] as number[] };
    let prerender = () => {};
    const game = {
        canvas: { width: 968, height: 528 } as SharpGame['canvas'],
        loop: { rawDelta: 16.7 },
        scale: { width: 968, height: 528, displaySize: { width: displayW } },
        renderer: {
            glWrapper: {
                state: { bindings: { framebuffer: null as { useCanvas?: boolean } | null } },
                updateViewport(s: { viewport: Box }) {
                    gl.viewport = s.viewport;
                },
                updateScissorBox(s: { scissor: { box: Box } }) {
                    gl.scissor = s.scissor.box;
                },
            },
        },
        events: {
            on(_: string, fn: () => void) {
                prerender = fn;
            },
        },
    };
    return { game, gl, frame: () => prerender() };
}

const draw = (g: ReturnType<typeof fakeGame>) => {
    const w = g.game.renderer.glWrapper;
    const s = { viewport: [0, 0, 968, 528] as Box, scissor: { box: [0, 0, 968, 528] as Box } };
    w.updateViewport(s);
    w.updateScissorBox(s);
};

describe('canvas da partida na resolução da tela', () => {
    it('celular em pé (quadra grande, 650 px CSS, DPR 3): canvas 1:1 com a tela (2,01 passa do teto 2 por 1%)', () => {
        const g = fakeGame(650);
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        expect(g.game.canvas).toEqual({ width: 1950, height: 1064 });
        draw(g);
        expect(g.gl.viewport).toEqual([0, 0, 1950, 1064]);
        expect(g.gl.scissor).toEqual([0, 0, 1950, 1064]);
        // a cena continua medindo o jogo em 968x528 (câmera, toque, clipe)
        expect(g.game.scale.width).toBe(968);
    });

    it('deitado (473 px, DPR 3) e PC (750 px, DPR 1): o tamanho exibido em pixels da tela', () => {
        for (const [css, dpr, w, h] of [
            [473, 3, 1419, 774],
            [750, 1, 750, 409],
        ]) {
            const g = fakeGame(css);
            sharpCanvas(g.game as unknown as SharpGame, () => dpr);
            g.frame();
            expect([g.game.canvas.width, g.game.canvas.height]).toEqual([w, h]);
        }
    });

    it('o Phaser refazendo o canvas no tamanho do jogo (scale.resize) volta pra tela no quadro seguinte', () => {
        const g = fakeGame(650);
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        g.game.canvas.width = 968;
        g.game.canvas.height = 528;
        g.frame();
        expect(g.game.canvas.width).toBe(1950);
    });

    it('framebuffer do pool (filtros da câmera) nasce na resolução do canvas, com o viewport junto', () => {
        const g = fakeGame(650);
        const fb = {
            width: 968,
            height: 528,
            resize(w: number, h: number) {
                Object.assign(this, { width: w, height: h });
            },
        };
        const pool = { get: (width = 968, height = 528) => ({ width, height, framebuffer: fb }) };
        Object.assign(g.game.renderer, { drawingContextPool: pool });
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        const c = pool.get(968, 528);
        expect([c.width, fb.width, fb.height]).toEqual([968, 1950, 1064]);
        g.game.renderer.glWrapper.state.bindings.framebuffer = fb;
        draw(g);
        expect(g.gl.viewport).toEqual([0, 0, 1950, 1064]);
    });

    it('framebuffer fora do pool (textura desenhada) fica no tamanho dele', () => {
        const g = fakeGame(650);
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        g.game.renderer.glWrapper.state.bindings.framebuffer = { useCanvas: false };
        draw(g);
        expect(g.gl.viewport).toEqual([0, 0, 968, 528]);
    });

    it('escala natural com piso', () => {
        expect(naturalScale(1300, 968, 3)).toBeCloseTo(4.03, 2);
        expect(naturalScale(100, 968, 1)).toBe(0.5);
    });

    it('tela grande: começa no teto 2 e sobe pra 3 quando o aparelho aguenta 60 fps', () => {
        const g = fakeGame(1300);
        const q = sharpCanvas(g.game as unknown as SharpGame, () => 3)!;
        g.frame();
        expect(g.game.canvas.width).toBe(1936);
        for (let i = 0; i < 60 * 12; i++) g.frame();
        expect(q.gov.level).toBe(0);
        expect(g.game.canvas.width).toBe(2904);
    });

    it('1:1 com a tela: o CSS do canvas vira o tamanho dele em pixels da tela e ele vai pro pixel inteiro', () => {
        const g = fakeGame(650);
        const style = { width: '650px', height: '354.5px', translate: '' };
        Object.assign(g.game.canvas, { style, getBoundingClientRect: () => ({ left: 10.125, top: 3 }) });
        sharpCanvas(g.game as unknown as SharpGame, () => 2)!;
        g.frame();
        // 968 x 1,343 = 1300 px da tela; o canvas tem 1300 px, então 650 px CSS
        expect(style.width).toBe('650px');
        // 10,125 px CSS = 20,25 px da tela: o translate leva pra 20
        expect(style.translate).toBe('-0.125px 0px');
    });
});
