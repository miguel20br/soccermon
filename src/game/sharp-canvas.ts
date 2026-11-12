/**
 * Canvas da partida na resolução da tela. O Phaser desenha num canvas do tamanho do jogo (968x528) e o navegador
 * estica: no celular em pé (quadra grande, ~650 px CSS com DPR 3) cada pixel do jogo virava 2x2 da tela, interpolado,
 * por cima do sprite já ampliado 1.8x pelo smoothPixelArt: duas reamostragens, sprite borrado. Aqui o canvas ganha o
 * tamanho exibido × devicePixelRatio e o GL desenha nele inteiro (viewport e tesoura multiplicados), com a projeção
 * ainda em pixels do jogo: câmera, zoom, toque, `scale.width` e tudo que mede o jogo continuam iguais.
 * Os framebuffers (filtros da câmera, texturas desenhadas) ficam no tamanho do jogo.
 */

/** Teto da escala: 2 cobre o celular em pé (2,02 na quadra grande); acima disso o custo cresce sem ganho visível. */
export const MAX_RES = 2;

/** Pixels do canvas por pixel do jogo pra largura exibida `cssW` (px CSS) na tela com `dpr`. */
export function backbufferScale(cssW: number, gameW: number, dpr: number): number {
    return Math.min(MAX_RES, Math.max(0.5, (cssW * dpr) / gameW));
}

type Box = [number, number, number, number];
interface GlState {
    viewport: Box;
    scissor: { box: Box };
}
/** O pedaço do Phaser que isto usa (o WebGLGlobalWrapper e o Game), pra testar sem o Phaser. */
export interface SharpGame {
    canvas: { width: number; height: number };
    scale: { width: number; height: number; displaySize: { width: number } };
    renderer: {
        glWrapper?: {
            state: { bindings: { framebuffer?: { useCanvas?: boolean } | null } };
            updateViewport(state: GlState, force?: boolean): void;
            updateScissorBox(state: GlState, force?: boolean): void;
        };
    };
    events: { on(event: 'prerender', fn: () => void): unknown };
}

export function sharpCanvas(game: SharpGame, dpr = () => window.devicePixelRatio || 1) {
    const gl = game.renderer.glWrapper;
    if (!gl) return; // renderer de canvas 2D (sem WebGL): fica como está
    const k = { x: 1, y: 1 };
    const onCanvas = () => {
        const fb = gl.state.bindings.framebuffer;
        return !fb || !!fb.useCanvas;
    };
    const up = (b: Box): Box => [
        Math.round(b[0] * k.x),
        Math.round(b[1] * k.y),
        Math.round(b[2] * k.x),
        Math.round(b[3] * k.y),
    ];
    const viewport = gl.updateViewport.bind(gl);
    const scissor = gl.updateScissorBox.bind(gl);
    gl.updateViewport = (s, force) => viewport(onCanvas() ? { ...s, viewport: up(s.viewport) } : s, force);
    gl.updateScissorBox = (s, force) =>
        scissor(onCanvas() ? { ...s, scissor: { ...s.scissor, box: up(s.scissor.box) } } : s, force);
    // a cada quadro (barato: só lê números): girar o celular, a quadra grande ligando e o Phaser refazendo o canvas
    // (scale.resize volta ele pro tamanho do jogo) caem aqui
    game.events.on('prerender', () => {
        const { canvas, scale } = game;
        const r = backbufferScale(scale.displaySize.width || scale.width, scale.width, dpr());
        const w = Math.round(scale.width * r);
        const h = Math.round(scale.height * r);
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        k.x = w / scale.width;
        k.y = h / scale.height;
    });
}
