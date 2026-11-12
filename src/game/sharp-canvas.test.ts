import { describe, expect, it } from 'vitest';
import { backbufferScale, MAX_RES, type SharpGame, sharpCanvas } from './sharp-canvas';

type Box = [number, number, number, number];

/** Um Game de mentira: canvas, ScaleManager (FIT) e o wrapper do GL que guarda o que chegou no gl.viewport/gl.scissor. */
function fakeGame(displayW: number) {
    const gl = { viewport: [] as number[], scissor: [] as number[] };
    let prerender = () => {};
    const game = {
        canvas: { width: 968, height: 528 },
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
    it('celular em pé (quadra grande, 650 px CSS, DPR 3): canvas 2x, o GL desenha nele inteiro', () => {
        const g = fakeGame(650);
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        expect(g.game.canvas).toEqual({ width: 968 * MAX_RES, height: 528 * MAX_RES });
        draw(g);
        expect(g.gl.viewport).toEqual([0, 0, 1936, 1056]);
        expect(g.gl.scissor).toEqual([0, 0, 1936, 1056]);
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
        expect(g.game.canvas.width).toBe(1936);
    });

    it('framebuffer de filtro ou textura fica no tamanho dele', () => {
        const g = fakeGame(650);
        sharpCanvas(g.game as unknown as SharpGame, () => 3);
        g.frame();
        g.game.renderer.glWrapper.state.bindings.framebuffer = { useCanvas: false };
        draw(g);
        expect(g.gl.viewport).toEqual([0, 0, 968, 528]);
    });

    it('escala com teto e piso', () => {
        expect(backbufferScale(1300, 968, 3)).toBe(MAX_RES);
        expect(backbufferScale(100, 968, 1)).toBe(0.5);
    });
});
