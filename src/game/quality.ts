/**
 * Qualidade da partida sem perder desempenho (sem Phaser aqui: o `track.ts` da Home lê as estatísticas).
 *
 * - `spriteScaleFor`: a escala do sprite que dá um número inteiro de pixels do canvas por pixel do sprite (pixel duro,
 *   como o `pixelFit` dos menus), perto da escala de sempre (1.8 px do jogo).
 * - `FpsGovernor`: mede o tempo de quadro e mexe no teto de resolução do canvas (`RES_CAPS`) com histerese.
 * - `QualityStats`: fps médio, p10, DPR e degrau final da partida, que vão juntos no `match_end`.
 */

/** Escala de sempre do sprite PMD na quadra (px do jogo por px do sprite). */
export const BASE_SPRITE_SCALE = 1.8;
/** Quanto o sprite pode crescer ou encolher pra cair em pixel inteiro (mais que isso muda o tamanho na quadra). */
export const SPRITE_TOLERANCE = 0.15;

/**
 * Escala do sprite (px do jogo) com `res` px do canvas por px do jogo: o inteiro de px do canvas mais perto (na razão)
 * de `base * res`, se ficar a até `tol` dele; senão `base` (escala quebrada: o smoothPixelArt suaviza só a borda).
 */
export function spriteScaleFor(res: number, base = BASE_SPRITE_SCALE, tol = SPRITE_TOLERANCE): number {
    if (!(res > 0)) return base;
    const t = base * res;
    const lo = Math.max(1, Math.floor(t + 1e-6));
    const k = (lo + 1) / t < t / lo ? lo + 1 : lo;
    return Math.abs(k / t - 1) <= tol + 1e-9 ? k / res : base;
}

/** Tamanho em que a Galmuri11 sai em pixel inteiro (12 px: 1 pixel da letra por pixel; 24, 36...). */
export const GALMURI11_PX = 12;

/**
 * Fonte de pixel nítida no canvas: o múltiplo de `unit` px do canvas mais perto de `want` px do jogo × `res` (pelo
 * menos 1), devolvido em px do jogo, e o contorno em px inteiros do canvas (cerca de 1,5 pixel da letra pra fora).
 */
export function pixelFont(want: number, res: number, unit = GALMURI11_PX): { size: number; stroke: number } {
    const r = res > 0 ? res : 1;
    const m = Math.max(1, Math.round((want * r) / unit));
    return { size: (unit * m) / r, stroke: (2 * Math.ceil(1.5 * m)) / r };
}

/**
 * Tetos de resolução (px do canvas por px do jogo), do mais nítido ao mais leve. Começa em 2 (o teto de antes, que
 * cobre o celular em pé); sobe pra 3 (DPR real dos celulares bons) quando o aparelho aguenta, desce quando não.
 */
export const RES_CAPS = [3, 2, 1.5, 1] as const;
export const START_LEVEL = 1;

/**
 * A resolução do degrau `level` numa tela que pede `natural` px por px do jogo: o teto do degrau, mas a tela inteira
 * se ela passa dele por até 10% (o celular em pé pede 2,02: com o teto 2 o navegador esticava o canvas 1% e o pixel
 * duro borrava, por 1% a mais de pixels).
 */
export const resAt = (level: number, natural: number) => {
    const cap = RES_CAPS[Math.max(0, Math.min(RES_CAPS.length - 1, level))];
    return natural <= cap * 1.1 ? natural : cap;
};

/** Abaixo disso (fps médio de 1 s) por `DOWN_WINDOWS` seguidos, desce um degrau. */
export const LOW_FPS = 50;
/** A partir disso por `UP_WINDOWS` seguidos, sobe um degrau. */
export const HIGH_FPS = 57;
const DOWN_WINDOWS = 3;
const UP_WINDOWS = 8;
/** Janelas medidas depois de descer: se o fps não melhorar 10%, a resolução não era o gargalo. */
const TRIAL_WINDOWS = 3;
/** Um degrau que já falhou isso tudo não é tentado de novo na partida. */
const MAX_FAILS = 2;
/** Quadro mais longo que isso (aba escondida, carregamento) não conta. */
const MAX_DT = 250;
/** Os primeiros ms (shaders, texturas) não contam. */
const WARMUP_MS = 2000;

/**
 * Governador de fps. A cada janela de 1 s: abaixo de `LOW_FPS` por 3 s desce um degrau (o próximo que muda a
 * resolução de verdade); se em 3 s o fps não subir 10%, volta e trava (celular preso em 30 fps no modo de economia,
 * gargalo fora do desenho). Acima de `HIGH_FPS` por 8 s sobe um degrau, se ele não falhou 2 vezes. Assim não oscila.
 */
export class FpsGovernor {
    level = START_LEVEL;
    locked = false;
    private t = 0;
    private n = 0;
    private warm = 0;
    private low = 0;
    private high = 0;
    private trial: { from: number; fps: number; sum: number; wins: number } | null = null;
    private readonly fails = new Map<number, number>();

    /** `resAt(level)`: a resolução que o degrau dá nesta tela (degrau que não muda nada é pulado). */
    constructor(private readonly resAt: (level: number) => number) {}

    /** Um quadro de `dt` ms. Devolve true quando o degrau mudou. */
    frame(dt: number): boolean {
        if (!(dt > 0) || dt > MAX_DT || this.locked) return false;
        if (this.warm < WARMUP_MS) {
            this.warm += dt;
            return false;
        }
        this.t += dt;
        this.n++;
        if (this.t < 1000) return false;
        const fps = (this.n * 1000) / this.t;
        this.t = 0;
        this.n = 0;
        return this.window(fps);
    }

    private step(dir: 1 | -1): number | null {
        const cur = this.resAt(this.level);
        for (let l = this.level + dir; l >= 0 && l < RES_CAPS.length; l += dir) {
            const r = this.resAt(l);
            if (dir > 0 ? r < cur - 1e-3 : r > cur + 1e-3) return l;
        }
        return null;
    }

    private window(fps: number): boolean {
        const tr = this.trial;
        if (tr) {
            tr.sum += fps;
            if (++tr.wins < TRIAL_WINDOWS) return false;
            this.trial = null;
            if (tr.sum / tr.wins < tr.fps * 1.1) {
                this.level = tr.from;
                this.locked = true;
                return true;
            }
            return false;
        }
        this.low = fps < LOW_FPS ? this.low + 1 : 0;
        this.high = fps >= HIGH_FPS ? this.high + 1 : 0;
        if (this.low >= DOWN_WINDOWS) {
            this.low = 0;
            const to = this.step(1);
            if (to === null) return false;
            this.fails.set(this.level, (this.fails.get(this.level) ?? 0) + 1);
            this.trial = { from: this.level, fps, sum: 0, wins: 0 };
            this.level = to;
            return true;
        }
        if (this.high >= UP_WINDOWS) {
            this.high = 0;
            const to = this.step(-1);
            if (to === null || (this.fails.get(to) ?? 0) >= MAX_FAILS) return false;
            this.level = to;
            return true;
        }
        return false;
    }
}

/** fps de cada quadro num histograma (0 a 240) pro médio e o p10 da partida, sem guardar lista. */
export class QualityStats {
    private readonly hist = new Uint32Array(241);
    private frames = 0;
    private ms = 0;

    frame(dt: number) {
        if (!(dt > 0) || dt > MAX_DT) return;
        this.hist[Math.min(240, Math.round(1000 / dt))]++;
        this.frames++;
        this.ms += dt;
    }

    /** fps médio (quadros / tempo) e o fps que 90% dos quadros superam; null sem quadros. */
    summary(): { fps: number; fpsP10: number } | null {
        if (!this.frames) return null;
        let need = Math.ceil(this.frames * 0.1);
        let p10 = 0;
        for (let f = 0; f <= 240; f++) {
            need -= this.hist[f];
            if (need <= 0) {
                p10 = f;
                break;
            }
        }
        return { fps: Math.round((this.frames * 1000) / this.ms), fpsP10: p10 };
    }
}

export interface MatchQuality {
    fps: number;
    fps_p10: number;
    dpr: number;
    res_level: number;
}
/** Quem mede a partida aberta (o jogo Phaser registra ao nascer; o `match_end` lê uma vez). */
let source: (() => MatchQuality | null) | null = null;

export function setMatchQualitySource(fn: (() => MatchQuality | null) | null) {
    source = fn;
}

/** As estatísticas de qualidade da partida que acabou, uma vez só (partida sem jogo na tela: nada). */
export function takeMatchQuality(): Partial<MatchQuality> {
    const q = source?.() ?? null;
    source = null;
    return q ?? {};
}

/**
 * Quanto mover (px do mundo) um objeto cuja borda esquerda (ou de cima) está em `edge` (px do mundo) pra ela cair no
 * pixel inteiro do canvas, com a câmera sem giro (`scroll`, `origin` = largura × originX, `pos` = x da câmera,
 * `zoom`) e `res` px do canvas por px do jogo. Escala inteira e borda na grade: cada pixel do sprite vira o mesmo
 * número de pixels da tela, igual ao vizinho mais próximo.
 */
export function gridShift(
    edge: number,
    scroll: number,
    origin: number,
    pos: number,
    zoom: number,
    res: number,
): number {
    const at = ((edge - scroll - origin) * zoom + origin + pos) * res;
    return (Math.round(at) - at) / (zoom * res);
}
