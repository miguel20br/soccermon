import { FpsGovernor, QualityStats, resAt } from './quality';

/**
 * Canvas da partida na resolução da tela. O Phaser desenha num canvas do tamanho do jogo (968x528) e o navegador
 * estica: no celular em pé (quadra grande, ~650 px CSS com DPR 3) cada pixel do jogo virava 2x2 da tela, interpolado,
 * por cima do sprite já ampliado 1.8x pelo smoothPixelArt: duas reamostragens, sprite borrado. Aqui o canvas ganha o
 * tamanho exibido × devicePixelRatio e o GL desenha nele inteiro (viewport e tesoura multiplicados), com a projeção
 * ainda em pixels do jogo: câmera, zoom, toque, `scale.width` e tudo que mede o jogo continuam iguais.
 * Os framebuffers (filtros da câmera, texturas desenhadas) ficam no tamanho do jogo.
 *
 * O teto da escala sai do governador de fps (`quality.ts`): começa em 2, sobe pra 3 se o aparelho aguenta e desce se
 * não. Com o canvas em 1:1 com a tela, o tamanho CSS dele vira o do canvas em pixels da tela e ele vai pro pixel
 * inteiro da tela (`translate` de menos de meio pixel): esticado ou fora da grade, o navegador reamostra a quadra
 * inteira e o pixel duro do sprite borra.
 */

/** Pixels da tela por pixel do jogo, sem teto (o piso de 0,5 segura canvas minúsculo). */
export const naturalScale = (cssW: number, gameW: number, dpr: number) => Math.max(0.5, (cssW * dpr) / gameW);

/** Desvio (px CSS) que leva `x` (px CSS) pro pixel inteiro da tela mais perto. */
export const toDeviceGrid = (x: number, dpr: number) => (Math.round(x * dpr) - x * dpr) / dpr;

type Box = [number, number, number, number];
interface GlState {
    viewport: Box;
    scissor: { box: Box };
}
/** O pedaço do Phaser que isto usa (o WebGLGlobalWrapper e o Game), pra testar sem o Phaser. */
export interface SharpGame {
    canvas: {
        width: number;
        height: number;
        style?: { width: string; height: string; translate: string };
        getBoundingClientRect?: () => { left: number; top: number };
    };
    scale: { width: number; height: number; displaySize: { width: number } };
    loop?: { rawDelta: number };
    renderer: {
        glWrapper?: {
            state: { bindings: { framebuffer?: { useCanvas?: boolean } | null } };
            updateViewport(state: GlState, force?: boolean): void;
            updateScissorBox(state: GlState, force?: boolean): void;
        };
    };
    events: { on(event: 'prerender', fn: () => void): unknown };
}

/** O estado da qualidade que a cena lê (`res`, pra escala do sprite e a resolução dos nomes) e a telemetria. */
export interface Quality {
    /** Pixels do canvas por pixel do jogo agora (0 antes do primeiro quadro). */
    res: number;
    /** Pixels da tela por pixel do jogo (sem teto). */
    natural: number;
    dpr: number;
    gov: FpsGovernor;
    stats: QualityStats;
}

export function sharpCanvas(game: SharpGame, dpr = () => window.devicePixelRatio || 1): Quality | undefined {
    const gl = game.renderer.glWrapper;
    if (!gl) return; // renderer de canvas 2D (sem WebGL): fica como está
    const k = { x: 1, y: 1 };
    const q: Quality = {
        res: 0,
        natural: 1,
        dpr: dpr(),
        stats: new QualityStats(),
        gov: new FpsGovernor((level) => resAt(level, q.natural)),
    };
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
    const off = { x: 0, y: 0 };
    let frames = 0;
    // a cada quadro (barato: só lê números): girar o celular, a quadra grande ligando, o Phaser refazendo o canvas
    // (scale.resize volta ele pro tamanho do jogo) e o governador mudando de degrau caem aqui
    game.events.on('prerender', () => {
        const { canvas, scale } = game;
        const dt = game.loop?.rawDelta ?? 0;
        q.stats.frame(dt);
        q.gov.frame(dt);
        const d = dpr();
        q.dpr = d;
        q.natural = naturalScale(scale.displaySize.width || scale.width, scale.width, d);
        const r = resAt(q.gov.level, q.natural);
        q.res = r;
        const w = Math.round(scale.width * r);
        const h = Math.round(scale.height * r);
        const st = canvas.style;
        if (st && r === q.natural) {
            // 1:1 com a tela: o CSS do canvas no tamanho dele em pixels da tela (o FIT dá fração de pixel)
            const cw = `${w / d}px`;
            if (st.width !== cw) {
                st.width = cw;
                st.height = `${h / d}px`;
            }
            // e no pixel inteiro da tela (de vez em quando: medir força o layout)
            if (frames++ % 30 === 0 && canvas.getBoundingClientRect) {
                const b = canvas.getBoundingClientRect();
                const wrap = (v: number) => ((((v * d + 0.5) % 1) + 1) % 1) / d - 0.5 / d;
                const nx = wrap(off.x + toDeviceGrid(b.left, d));
                const ny = wrap(off.y + toDeviceGrid(b.top, d));
                if (Math.abs(nx - off.x) > 1e-3 || Math.abs(ny - off.y) > 1e-3) {
                    off.x = nx;
                    off.y = ny;
                    st.translate = `${nx}px ${ny}px`;
                }
            }
        }
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        k.x = w / scale.width;
        k.y = h / scale.height;
    });
    return q;
}
