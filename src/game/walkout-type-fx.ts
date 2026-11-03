import Phaser from 'phaser';
import type { FxType } from './walkout-plan';
import type { WkSound } from './walkout-sound';

/**
 * A revelação da carta ouro (sem edição) pelo tipo do Pokémon, no lugar do vidro quebrando (que fica só nas edições,
 * pedido de 03/11): a bola bate na tela e ela congela, pega fogo, é lavada por uma onda, entra em curto, vira pedra…
 *
 * Como é feito (o mesmo cuidado do vidro): a "capa" do tipo é pintada uma vez só, pixel a pixel com dithering Bayer,
 * quando a cena monta (nunca uma textura por quadro), e cortada em pedaços de uma grade. Na batida cada pedaço aparece
 * na ordem do efeito (geada das bordas pro meio, gosma de cima pra baixo…) e, `SHATTER_MS` depois, sai do jeito do tipo
 * (estilhaça, desmorona, afunda, vira fumaça, escorre, abre como porta…). Por cima, um Graphics redesenhado a cada
 * quadro com linhas pré-sorteadas (raios, brasa, crista da onda, rachaduras, anéis) e partículas com teto.
 */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const mix = (a: number, b: number, t: number) => {
    const [r1, g1, b1] = rgb(a);
    const [r2, g2, b2] = rgb(b);
    return (
        (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t)
    );
};
/** Sorteio com semente (o efeito sai igual em toda gravação). */
export function seeded(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
/** Zona de emissão retangular (relativa ao emissor). */
const zone = (x: number, y: number, w: number, h: number): Phaser.Types.GameObjects.Particles.EmitZoneData => {
    const r = new Phaser.Geom.Rectangle(x, y, w, h);
    return { type: 'random', source: { getRandomPoint: (p) => r.getRandomPoint(p as Phaser.Math.Vector2) } };
};
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outQuad = (k: number) => 1 - (1 - k) * (1 - k);
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

export interface FxHost {
    scene: Phaser.Scene;
    W: number;
    H: number;
    /** Onde a bola bate na tela. */
    I: { x: number; y: number };
    /** Põe na camada de cima (a do vidro). */
    hud<T extends Phaser.GameObjects.GameObject>(o: T): T;
    snd(s: WkSound): void;
    shake(ms: number, px: number): void;
    flash(ms: number, r: number, g: number, b: number): void;
    /** Raro e curtos: menos partículas e pedaços. */
    small: boolean;
    seed: number;
}

type Leave = 'burst' | 'fall' | 'sink' | 'drift' | 'drip' | 'doors' | 'wind' | 'wash' | 'fold' | 'twinkle' | 'burn';

interface Piece {
    img: Phaser.GameObjects.Image;
    x: number;
    y: number;
    /** Ordem de chegada e de saída (0..1) e um sorteio do pedaço. */
    o1: number;
    o2: number;
    r: number;
}

interface Spec {
    /** A capa pintada: cor do pixel ou -1 (furo). `b` = limiar Bayer do pixel (0..1). */
    paint?: (x: number, y: number, b: number) => number;
    /** Desenho por cima da capa pintada (folhas, bolhas, facetas), só nos pixels de cada forma. */
    stamp?: (put: (x: number, y: number, c: number) => void) => void;
    /** Ordem de chegada (0 = primeiro) e de saída. */
    o1: (x: number, y: number, r: number) => number;
    o2: (x: number, y: number, r: number) => number;
    leave: Leave;
    /** Quanto a saída se espalha (ms) e quanto cada pedaço leva pra sair. */
    spread: number;
    dur: number;
    /** Extras: na batida, no estouro (`SHATTER_MS` depois) e a cada quadro (o Graphics já vem limpo). */
    hit?: () => void;
    brk?: () => void;
    draw?: (g: Phaser.GameObjects.Graphics, ms: number) => void;
}

/** Quanto dura o efeito inteiro depois da batida (depois disso tudo some). */
const END = 1500;

export class TypeFx {
    private h: FxHost;
    private type: FxType;
    private B: number;
    private pieces: Piece[] = [];
    private g?: Phaser.GameObjects.Graphics;
    private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private extra: Phaser.GameObjects.GameObject[] = [];
    private spec: Spec;
    private rnd: () => number;
    private broke = false;
    private t0 = -1;
    done = false;

    /** Pinta a capa e corta os pedaços já na montagem da cena (a batida não paga esse custo). */
    constructor(host: FxHost, type: FxType, shatterMs: number) {
        this.h = host;
        this.type = type;
        this.B = shatterMs;
        this.rnd = seeded(host.seed);
        ensureFxTextures(host.scene);
        this.spec = this.specOf(type);
        if (this.spec.paint) this.makeCover(this.spec.paint, this.spec.stamp);
    }

    /** A bola bateu na tela. */
    start(clock: number) {
        this.t0 = clock;
        this.g = this.h.hud(this.h.scene.add.graphics());
        for (const p of this.pieces) p.img.setVisible(true).setAlpha(0);
        this.spec.hit?.();
    }

    /** A cada quadro, com o relógio da cena. */
    step(clock: number) {
        if (this.t0 < 0 || this.done) return;
        const ms = clock - this.t0;
        if (!this.broke && ms >= this.B) {
            this.broke = true;
            this.spec.brk?.();
        }
        if (ms >= END) return this.destroy();
        const s = this.spec;
        const kb = clamp01(ms / this.B);
        for (const p of this.pieces) {
            const tl = ms - this.B - p.o2 * s.spread;
            if (tl < 0) {
                const a = clamp01((kb - p.o1 * 0.75) / 0.25);
                p.img
                    .setAlpha(a * this.flicker(ms))
                    .setPosition(p.x, p.y)
                    .setScale(1)
                    .setAngle(0);
                if (s.leave === 'burn') p.img.setTint(0xffffff);
                continue;
            }
            this.leave(p, clamp01(tl / s.dur), ms);
        }
        if (this.g) {
            this.g.clear();
            s.draw?.(this.g, ms);
        }
    }

    destroy() {
        this.done = true;
        for (const p of this.pieces) p.img.destroy();
        for (const e of this.emitters) e.destroy();
        for (const o of this.extra) o.destroy();
        this.g?.destroy();
        this.pieces = [];
        this.emitters = [];
        this.extra = [];
    }

    // ---------------------------------------------------------------- capa e pedaços

    private makeCover(paint: NonNullable<Spec['paint']>, stamp?: Spec['stamp']) {
        const { W, H, scene } = this.h;
        const key = 'wk-fx-cover';
        if (scene.textures.exists(key)) scene.textures.remove(key);
        const tex = scene.textures.createCanvas(key, W, H);
        if (!tex) return;
        const img = tex.context.createImageData(W, H);
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                const c = paint(x, y, BAYER[(y & 3) * 4 + (x & 3)] / 16);
                if (c < 0) continue;
                const k = (y * W + x) * 4;
                img.data[k] = (c >> 16) & 255;
                img.data[k + 1] = (c >> 8) & 255;
                img.data[k + 2] = c & 255;
                img.data[k + 3] = 255;
            }
        stamp?.((x, y, c) => {
            x = Math.round(x);
            y = Math.round(y);
            if (x < 0 || y < 0 || x >= W || y >= H) return;
            const k = (y * W + x) * 4;
            img.data[k] = (c >> 16) & 255;
            img.data[k + 1] = (c >> 8) & 255;
            img.data[k + 2] = c & 255;
            img.data[k + 3] = 255;
        });
        tex.context.putImageData(img, 0, 0);
        tex.refresh();
        // a grade: uns 15 pedaços na largura do celular, 30-35 no desktop
        const cs = Math.max(10, Math.round(Math.max(W, H) / (this.h.small ? 26 : 32)));
        let n = 0;
        for (let y = 0; y < H; y += cs)
            for (let x = 0; x < W; x += cs) {
                const w = Math.min(cs, W - x);
                const hh = Math.min(cs, H - y);
                const name = `c${n++}`;
                tex.add(name, 0, x, y, w, hh);
                const cx = x + w / 2;
                const cy = y + hh / 2;
                const r = this.rnd();
                const im = this.h.hud(scene.add.image(cx, cy, key, name).setVisible(false).setDepth(40));
                this.pieces.push({
                    img: im,
                    x: cx,
                    y: cy,
                    o1: clamp01(this.spec.o1(cx, cy, r)),
                    o2: clamp01(this.spec.o2(cx, cy, r)),
                    r,
                });
            }
    }

    /** Pisca da tela no curto-circuito (só o Elétrico). */
    private flicker(ms: number) {
        if (this.type !== 'Electric') return 1;
        const st = Math.floor(ms / 45);
        return [1, 0.2, 1, 1, 0.1, 1, 0.6][st % 7];
    }

    private leave(p: Piece, k: number, ms: number) {
        const { W, H, I } = this.h;
        const im = p.img;
        let x = p.x;
        let y = p.y;
        let a = 1;
        let sc = 1;
        let sy = 1;
        let ang = 0;
        switch (this.spec.leave) {
            case 'burst': {
                const th = Math.atan2(p.y - I.y, p.x - I.x);
                const v = (50 + p.r * 110) * outQuad(k);
                x += Math.cos(th) * v;
                y += Math.sin(th) * v + 220 * k * k;
                ang = (p.r - 0.5) * 520 * k;
                a = 1 - k ** 1.6;
                break;
            }
            case 'fall':
                y += k * k * H * 0.9;
                x += (p.r - 0.5) * 16 * k;
                ang = (p.r - 0.5) * 120 * k;
                a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
                break;
            case 'sink':
                // afunda escurecendo (sem encolher: a grade apareceria entre os pedaços)
                y += 16 * outQuad(k);
                im.setTint(mix(0xffffff, 0x302418, k));
                a = 1 - k ** 2;
                break;
            case 'drift':
                y -= 46 * outQuad(k);
                x += Math.sin(k * 6 + p.r * 6) * 7;
                sc = 1 + 0.6 * k;
                a = (1 - k) ** 1.4;
                break;
            case 'drip':
                y += (0.25 + p.r * 0.75) * H * 0.7 * k * k;
                sy = 1 + 1.6 * k;
                a = 1 - k ** 3;
                break;
            case 'doors': {
                const side = p.x < W / 2 ? -1 : 1;
                x += side * W * 0.65 * inOut(k);
                ang = side * 14 * k;
                a = 1 - k ** 3;
                break;
            }
            case 'wind':
                x += W * (0.5 + p.r * 0.6) * k ** 1.5;
                y += (p.r - 0.5) * 50 * k - 20 * k;
                ang = 200 * (p.r + 0.3) * k;
                a = 1 - k ** 2;
                break;
            case 'wash':
                x += W * 0.45 * outQuad(k);
                y += 40 * k * k;
                a = 1 - k;
                break;
            case 'fold': {
                const e = inOut(k);
                y = lerp(p.y, H / 2, e);
                sy = 1 - e;
                x += Math.sin(p.y * 0.08 + ms * 0.02) * 10 * e;
                a = 1 - e ** 3;
                break;
            }
            case 'twinkle': {
                const e = outQuad(k);
                sc = 1 - e;
                ang = 90 * e;
                im.setTint(mix(0xffffff, 0xfff0ff, e));
                a = 1 - e;
                break;
            }
            case 'burn':
                im.setTint(k < 0.4 ? mix(0xffffff, 0xffa040, k / 0.4) : mix(0xffa040, 0x200800, (k - 0.4) / 0.6));
                a = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
                break;
        }
        im.setPosition(x, y)
            .setScale(sc, sc * sy)
            .setAngle(ang)
            .setAlpha(clamp01(a));
    }

    // ---------------------------------------------------------------- partículas e formas

    private burst(
        x: number,
        y: number,
        tex: string,
        n: number,
        cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
    ) {
        const cap = Math.max(1, Math.round(n * (this.h.small ? 0.6 : 1)));
        const e = this.h.hud(
            this.h.scene.add.particles(x, y, tex, { emitting: false, maxAliveParticles: cap, ...cfg }),
        );
        e.setDepth(41);
        e.explode(cap);
        this.emitters.push(e);
        return e;
    }

    private ring(g: Phaser.GameObjects.Graphics, ms: number, at: number, len: number, max: number, c: number, w = 3) {
        const k = (ms - at) / len;
        if (k < 0 || k > 1) return;
        const r = max * outQuad(k);
        g.lineStyle(w + 2, 0x000000, 0.25 * (1 - k)).strokeCircle(this.h.I.x, this.h.I.y, r);
        g.lineStyle(w, c, 1 - k).strokeCircle(this.h.I.x, this.h.I.y, r);
    }

    private poly(g: Phaser.GameObjects.Graphics, pts: { x: number; y: number }[], w: number, c: number, a = 1) {
        g.lineStyle(w + 2, 0x000000, 0.4 * a).strokePoints(pts as Phaser.Math.Vector2[], false);
        g.lineStyle(w, c, a).strokePoints(pts as Phaser.Math.Vector2[], false);
    }

    /** Linha quebrada do ponto `a` ao `b` (raio, rachadura, cipó). */
    private jag(a: { x: number; y: number }, b: { x: number; y: number }, n: number, amp: number) {
        const pts = [a];
        const nx = -(b.y - a.y);
        const ny = b.x - a.x;
        const l = Math.hypot(nx, ny) || 1;
        for (let i = 1; i < n; i++) {
            const t = i / n;
            const o = (this.rnd() - 0.5) * 2 * amp;
            pts.push({ x: lerp(a.x, b.x, t) + (nx / l) * o, y: lerp(a.y, b.y, t) + (ny / l) * o });
        }
        pts.push(b);
        return pts;
    }

    private star(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, c: number, a: number) {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 10; i++) {
            const th = -Math.PI / 2 + (i * Math.PI) / 5;
            const rr = i % 2 ? r * 0.45 : r;
            pts.push({ x: x + Math.cos(th) * rr, y: y + Math.sin(th) * rr });
        }
        g.fillStyle(0x000000, 0.35 * a).fillPoints(
            pts.map((p) => ({ x: p.x + 2, y: p.y + 3 })) as Phaser.Math.Vector2[],
            true,
        );
        g.fillStyle(c, a).fillPoints(pts as Phaser.Math.Vector2[], true);
        g.lineStyle(2, 0xffffff, a).strokePoints(pts as Phaser.Math.Vector2[], true);
    }

    private img(key: string, x: number, y: number) {
        const o = this.h.hud(this.h.scene.add.image(x, y, key).setDepth(42));
        this.extra.push(o);
        return o;
    }

    // ---------------------------------------------------------------- os 16 tipos

    private specOf(type: FxType): Spec {
        const { W, H, I } = this.h;
        const R = Math.hypot(W, H);
        const rnd = this.rnd;
        const dI = (x: number, y: number) => Math.hypot(x - I.x, y - I.y) / R;
        const edge = (x: number, y: number) => Math.min(x, W - x, y, H - y) / (Math.min(W, H) / 2);
        const hash = (x: number, y: number) => {
            let h = (x * 374761393 + y * 668265263 + this.h.seed * 97) | 0;
            h = Math.imul(h ^ (h >>> 13), 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        };
        /** Três tons com dithering: v (0..1) escolhe entre as cores vizinhas pelo Bayer. */
        const tone = (v: number, b: number, cs: number[]) => {
            const q = clamp01(v) * (cs.length - 1);
            const i = Math.min(cs.length - 2, Math.floor(q));
            return q - i > b ? cs[i + 1] : cs[i];
        };
        const S = (s: WkSound) => this.h.snd(s);
        const bolts = (n: number, from: () => { x: number; y: number }) =>
            Array.from({ length: n }, () => this.jag(from(), { x: I.x, y: I.y }, 8, 9));

        switch (type) {
            case 'Ice': {
                // geada subindo das bordas, a tela vira gelo e estilhaça
                const facets = Array.from({ length: 22 }, () => {
                    const a = rnd() * Math.PI * 2;
                    const l = 10 + rnd() * 40;
                    const x = rnd() * W;
                    const y = rnd() * H;
                    return [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l];
                });
                const cracks = Array.from({ length: 9 }, (_, i) => {
                    const a = (i / 9) * Math.PI * 2 + rnd() * 0.5;
                    return this.jag(I, { x: I.x + Math.cos(a) * R * 0.6, y: I.y + Math.sin(a) * R * 0.6 }, 7, 6);
                });
                return {
                    paint: (x, y, b) => {
                        const e = edge(x, y);
                        if (b > 0.82 + 0.18 * (1 - e) && e > 0.3) return -1;
                        return tone(
                            0.25 + 0.6 * (1 - e) + (hash(x >> 2, y >> 2) - 0.5) * 0.3,
                            b,
                            [0x4a9ec4, 0x8fd3e8, 0xc8eef8, 0xeefcff],
                        );
                    },
                    stamp: (put) => {
                        // facetas do gelo: riscos brancos retos de 1 px
                        for (const [x0, y0, x1, y1] of facets) {
                            const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
                            for (let i = 0; i <= n; i++) put(lerp(x0, x1, i / n), lerp(y0, y1, i / n), 0xffffff);
                        }
                    },
                    o1: (x, y) => edge(x, y),
                    o2: (x, y, r) => dI(x, y) * 0.8 + r * 0.2,
                    leave: 'burst',
                    spread: 220,
                    dur: 620,
                    hit: () => {
                        S({ k: 'zz', name: 'gelo' });
                        this.burst(W / 2, H / 2, 'wk-px1', 60, {
                            emitZone: zone(-W / 2, -H / 2, W, H),
                            speed: { min: 2, max: 10 },
                            lifespan: { min: 500, max: 1100 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xc8eef8],
                        });
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'glass' });
                        S({ k: 'sfx', name: 'post', pitch: 2.6 });
                        this.h.flash(90, 220, 245, 255);
                        this.h.shake(200, 5);
                        this.burst(I.x, I.y, 'wk-star', 26, {
                            speed: { min: 60, max: 180 },
                            lifespan: { min: 400, max: 800 },
                            gravityY: 160,
                            scale: { start: 1, end: 0.3 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xc8eef8, 0x8fd3e8],
                        });
                    },
                    draw: (g, ms) => {
                        if (ms < this.B * 0.7 || ms > this.B) return;
                        const k = (ms - this.B * 0.7) / (this.B * 0.3);
                        for (const c of cracks)
                            this.poly(g, c.slice(0, Math.max(2, Math.ceil(c.length * k))), 1, 0xffffff, 0.9);
                    },
                };
            }
            case 'Fire': {
                // a tela tosta de dentro pra fora e o buraco queima com a borda em brasa
                const ring = Array.from({ length: 28 }, () => 0.85 + rnd() * 0.3);
                return {
                    paint: (x, y, b) => {
                        const d = dI(x, y);
                        if (b > 0.9 + 0.1 * d * 2) return -1;
                        const h = hash(x >> 1, y >> 1);
                        if (h > 0.985) return h > 0.993 ? 0xfff0a0 : 0xff8a20;
                        return tone(0.2 + d * 1.2 + (h - 0.5) * 0.35, b, [0x1a0a04, 0x3a1a08, 0x5a2c10, 0x7a4018]);
                    },
                    o1: (x, y) => dI(x, y) * 1.6,
                    o2: (x, y, r) => dI(x, y) * 1.4 + r * 0.08,
                    leave: 'burn',
                    spread: 380,
                    dur: 300,
                    hit: () => {
                        S({ k: 'zz', name: 'fogo' });
                        S({ k: 'sfx', name: 'thud', pitch: 0.7 });
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'fogo' });
                        this.h.flash(80, 255, 170, 60);
                        this.burst(I.x, I.y, 'wk-px', 40, {
                            speed: { min: 30, max: 140 },
                            lifespan: { min: 500, max: 1000 },
                            gravityY: -60,
                            scale: { start: 1.2, end: 0 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xfff0a0, 0xffb13b, 0xff6a1f, 0xd8401a],
                        });
                    },
                    draw: (g, ms) => {
                        const t = ms - this.B;
                        if (t < 0 || t > 900) return;
                        // a borda em brasa: um anel irregular do tamanho do buraco que queima
                        const r = R * 1.4 * clamp01(t / 380) * 0.5 + 4;
                        const pts = ring.map((f, i) => {
                            const a = (i / ring.length) * Math.PI * 2;
                            const w = f + 0.06 * Math.sin(ms / 40 + i * 2);
                            return { x: I.x + Math.cos(a) * r * w, y: I.y + Math.sin(a) * r * w };
                        });
                        pts.push(pts[0]);
                        const a = 1 - clamp01((t - 600) / 300);
                        g.lineStyle(7, 0xd8401a, 0.55 * a).strokePoints(pts as Phaser.Math.Vector2[], false);
                        g.lineStyle(4, 0xffb13b, 0.9 * a).strokePoints(pts as Phaser.Math.Vector2[], false);
                        g.lineStyle(1.5, 0xfff0a0, a).strokePoints(pts as Phaser.Math.Vector2[], false);
                    },
                };
            }
            case 'Water': {
                // uma onda entra pela esquerda, cobre a tela e lava pra direita
                return {
                    paint: (x, y, b) => {
                        if (b > 0.88) return -1;
                        const c = Math.sin(x * 0.18 + Math.sin(y * 0.09) * 2.2) + Math.sin(y * 0.21 - x * 0.05);
                        if (c > 1.55) return 0xeaf6ff;
                        return tone(0.35 + c * 0.22 + (y / H) * 0.25, b, [0x1e4a9c, 0x3a78d8, 0x6390f0, 0xa8d0ff]);
                    },
                    o1: (x) => x / W,
                    o2: (x, _y, r) => x / W + r * 0.1,
                    leave: 'wash',
                    spread: 380,
                    dur: 420,
                    hit: () => {
                        S({ k: 'zz', name: 'agua' });
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'agua' });
                        this.burst(W * 0.6, H * 0.5, 'wk-fx-bubble', 30, {
                            emitZone: zone(-W * 0.4, -H * 0.4, W * 0.8, H * 0.8),
                            speed: { min: 10, max: 40 },
                            angle: { min: 240, max: 300 },
                            lifespan: { min: 500, max: 900 },
                            alpha: { start: 1, end: 0 },
                        });
                    },
                    draw: (g, ms) => {
                        // a crista da onda (espuma) na frente da água
                        const k = ms < this.B ? ms / this.B : 1 + (ms - this.B) / 380;
                        const fx = W * k * 0.95;
                        if (fx > W * 1.35) return;
                        const pts = Array.from({ length: 24 }, (_, i) => {
                            const y = (i / 23) * H;
                            return { x: fx + Math.sin(y * 0.06 + ms * 0.02) * 8, y };
                        });
                        this.poly(g, pts, 4, 0xeaf6ff, 0.95);
                        this.poly(
                            g,
                            pts.map((p) => ({ x: p.x - 7, y: p.y })),
                            2,
                            0xa8d0ff,
                            0.8,
                        );
                    },
                };
            }
            case 'Electric': {
                // curto-circuito: a tela apaga e pisca, raios correm e ela acende de volta
                const set = [0, 1, 2].map(() =>
                    bolts(this.h.small ? 3 : 4, () => ({ x: rnd() * W, y: rnd() < 0.5 ? 0 : H })),
                );
                return {
                    paint: (x, y, b) => {
                        if (y % 2 && b > 0.5) return 0x141a30;
                        return tone(hash(x >> 1, y) * 0.5 + 0.1, b, [0x05060c, 0x0a0c18, 0x1a2040]);
                    },
                    o1: () => 0,
                    o2: (_x, _y, r) => r * 0.3,
                    leave: 'twinkle',
                    spread: 160,
                    dur: 260,
                    hit: () => {
                        S({ k: 'zz', name: 'zap' });
                        this.h.shake(260, 3);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'zap' });
                        S({ k: 'sfx', name: 'select', pitch: 2 });
                        this.h.flash(140, 255, 250, 200);
                        this.burst(I.x, I.y, 'wk-px', 36, {
                            speed: { min: 80, max: 220 },
                            lifespan: { min: 200, max: 500 },
                            scale: { start: 1, end: 0 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xfff6a0, 0xf7d02c],
                        });
                    },
                    draw: (g, ms) => {
                        if (ms > this.B + 260) return;
                        const bs = set[Math.floor(ms / 60) % set.length];
                        const a = ms > this.B ? 1 - (ms - this.B) / 260 : 1;
                        for (const b of bs) {
                            g.lineStyle(6, 0x000000, 0.35 * a).strokePoints(b as Phaser.Math.Vector2[], false);
                            g.lineStyle(4, 0xf7d02c, a).strokePoints(b as Phaser.Math.Vector2[], false);
                            g.lineStyle(1.5, 0xffffff, a).strokePoints(b as Phaser.Math.Vector2[], false);
                        }
                    },
                };
            }
            case 'Grass': {
                // cipós e folhas fecham a tela das laterais e se abrem como cortina
                const leaves = Array.from({ length: 70 }, () => ({
                    x: rnd() * W,
                    y: rnd() * H,
                    a: rnd() * Math.PI,
                    l: 5 + rnd() * 6,
                    c: rnd() < 0.5 ? 0 : 1,
                }));
                const vines = Array.from({ length: 6 }, (_, i) => {
                    const left = i % 2 === 0;
                    const y = ((i + 0.5) / 6) * H;
                    return this.jag(
                        { x: left ? 0 : W, y },
                        { x: W / 2 + (left ? 6 : -6), y: y + (rnd() - 0.5) * 60 },
                        9,
                        10,
                    );
                });
                return {
                    stamp: (put) => {
                        for (const L of leaves)
                            for (let dy = -L.l; dy <= L.l; dy++)
                                for (let dx = -L.l; dx <= L.l; dx++) {
                                    const u = dx * Math.cos(L.a) + dy * Math.sin(L.a);
                                    const v = -dx * Math.sin(L.a) + dy * Math.cos(L.a);
                                    if ((u / L.l) ** 2 + (v / (L.l * 0.45)) ** 2 < 1)
                                        put(
                                            L.x + dx,
                                            L.y + dy,
                                            Math.abs(v) < 0.5 ? 0x2e6b2a : L.c ? 0x7ac74c : 0x58b048,
                                        );
                                }
                    },
                    paint: (x, y, b) => {
                        if (b > 0.9) return -1;
                        return tone(0.3 + hash(x >> 2, y >> 2) * 0.5, b, [0x163a14, 0x24561f, 0x2e6b2a]);
                    },
                    o1: (x) => 1 - Math.abs(x - W / 2) / (W / 2),
                    o2: (_x, y, r) => Math.abs(y - I.y) / H + r * 0.15,
                    leave: 'doors',
                    spread: 200,
                    dur: 560,
                    hit: () => {
                        S({ k: 'sfx', name: 'move', pitch: 0.5 });
                        S({ k: 'zz', name: 'folha' });
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'folha' });
                        S({ k: 'sfx', name: 'post', pitch: 0.9 });
                        this.burst(W / 2, H / 2, 'wk-fx-leaf', 40, {
                            emitZone: zone(-8, -H / 2, 16, H),
                            speed: { min: 40, max: 120 },
                            lifespan: { min: 700, max: 1200 },
                            gravityY: 50,
                            rotate: { min: 0, max: 360 },
                            alpha: { start: 1, end: 0 },
                        });
                    },
                    draw: (g, ms) => {
                        const t = ms < this.B ? ms / this.B : 1;
                        const open = ms < this.B ? 0 : inOut(clamp01((ms - this.B) / 560));
                        if (open >= 1) return;
                        for (const v of vines) {
                            const left = v[0].x === 0;
                            const n = Math.max(2, Math.ceil(v.length * t));
                            const pts = v
                                .slice(0, n)
                                .map((p) => ({ x: p.x + (left ? -1 : 1) * W * 0.65 * open, y: p.y }));
                            this.poly(g, pts, 3, 0x3f8a2c, 1 - open);
                        }
                    },
                };
            }
            case 'Rock': {
                // a tela vira pedra a partir do impacto e desmorona
                const rowH = 12;
                return {
                    paint: (x, y, b) => {
                        const row = Math.floor(y / rowH);
                        const off = (hash(row, 7) * 20) | 0;
                        const bw = 18 + ((hash(row, 3) * 10) | 0);
                        const bx = (x + off) % bw;
                        if (y % rowH === 0 || bx === 0) return 0x2e2618;
                        if (y % rowH === 1 || bx === 1) return 0xc8b48a;
                        const h = hash(x >> 1, y >> 1);
                        return tone(
                            0.45 + (h - 0.5) * 0.5 + hash(row, Math.floor((x + off) / bw)) * 0.25,
                            b,
                            [0x5a4c34, 0x7a6a4a, 0x9a8a62, 0xb6a17a],
                        );
                    },
                    o1: (x, y) => dI(x, y) * 1.8,
                    o2: (_x, y, r) => (1 - y / H) * 0.7 + r * 0.3,
                    leave: 'fall',
                    spread: 300,
                    dur: 700,
                    hit: () => {
                        S({ k: 'sfx', name: 'thud', pitch: 0.45 });
                        S({ k: 'zz', name: 'rocha' });
                        this.h.shake(240, 4);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'rocha' });
                        S({ k: 'sfx', name: 'thud', pitch: 0.35 });
                        this.h.shake(320, 7);
                        this.burst(W / 2, H, 'wk-fx-smoke', 24, {
                            emitZone: zone(-W / 2, -20, W, 20),
                            speed: { min: 10, max: 40 },
                            angle: { min: 240, max: 300 },
                            lifespan: { min: 600, max: 1100 },
                            scale: { start: 1, end: 2 },
                            alpha: { start: 0.7, end: 0 },
                            tint: [0xb6a17a, 0x8a7a58],
                        });
                    },
                };
            }
            case 'Ground': {
                // a tela vira chão seco, racha em placas e afunda
                const seeds = Array.from({ length: this.h.small ? 22 : 34 }, () => ({ x: rnd() * W, y: rnd() * H }));
                const cell = (x: number, y: number) => {
                    let best = 0;
                    let bd = Number.POSITIVE_INFINITY;
                    let sd = Number.POSITIVE_INFINITY;
                    for (let i = 0; i < seeds.length; i++) {
                        const d = (x - seeds[i].x) ** 2 + (y - seeds[i].y) ** 2;
                        if (d < bd) {
                            sd = bd;
                            bd = d;
                            best = i;
                        } else if (d < sd) sd = d;
                    }
                    return { i: best, edge: Math.sqrt(sd) - Math.sqrt(bd) };
                };
                const cracks = Array.from({ length: 6 }, (_, i) => {
                    const a = (i / 6) * Math.PI * 2 + rnd() * 0.6;
                    return this.jag(I, { x: I.x + Math.cos(a) * R * 0.7, y: I.y + Math.sin(a) * R * 0.7 }, 10, 8);
                });
                return {
                    paint: (x, y, b) => {
                        const c = cell(x, y);
                        if (c.edge < 1.2) return 0x3a2610;
                        if (c.edge < 2.2) return 0xf0d890;
                        const h = hash(x, y);
                        if (h > 0.97) return 0x8a6a3a;
                        return tone(0.4 + hash(c.i, 1) * 0.35 + (h - 0.5) * 0.3, b, [0xa47c40, 0xc8a060, 0xe2bf65]);
                    },
                    o1: (x, y) => dI(x, y) * 1.5,
                    o2: (x, y) => {
                        const s = seeds[cell(x, y).i];
                        return dI(s.x, s.y) * 1.3;
                    },
                    leave: 'sink',
                    spread: 360,
                    dur: 520,
                    hit: () => {
                        S({ k: 'sfx', name: 'thud', pitch: 0.4 });
                        S({ k: 'zz', name: 'rocha' });
                    },
                    brk: () => {
                        S({ k: 'sfx', name: 'thud', pitch: 0.3 });
                        this.h.shake(360, 6);
                        this.burst(I.x, I.y, 'wk-fx-smoke', 20, {
                            speed: { min: 20, max: 70 },
                            lifespan: { min: 600, max: 1000 },
                            scale: { start: 1, end: 2.2 },
                            alpha: { start: 0.6, end: 0 },
                            tint: [0xe2bf65, 0xc8a060],
                        });
                    },
                    draw: (g, ms) => {
                        if (ms > this.B + 200) return;
                        const k = clamp01(ms / (this.B * 0.8));
                        const a = ms > this.B ? 1 - (ms - this.B) / 200 : 1;
                        for (const c of cracks)
                            this.poly(g, c.slice(0, Math.max(2, Math.ceil(c.length * k))), 2, 0x2a1a08, a);
                    },
                };
            }
            case 'Psychic': {
                // a tela ondula em anéis, entorta e se dobra no meio
                return {
                    paint: (x, y, b) => {
                        const d = Math.hypot(x - I.x, y - I.y);
                        const w = Math.sin(d * 0.28);
                        if (b > 0.75 + 0.2 * w) return -1;
                        return tone(0.5 + w * 0.4, b, [0xa02868, 0xf95587, 0xff9ec4, 0xffe0ee]);
                    },
                    o1: (x, y) => dI(x, y) * 1.6,
                    o2: (_x, y, r) => Math.abs(y - H / 2) / H + r * 0.1,
                    leave: 'fold',
                    spread: 160,
                    dur: 560,
                    hit: () => S({ k: 'zz', name: 'magia' }),
                    brk: () => {
                        S({ k: 'zz', name: 'magia' });
                        this.h.flash(90, 255, 150, 200);
                    },
                    draw: (g, ms) => {
                        for (const at of [0, 120, 240, this.B + 60]) this.ring(g, ms, at, 520, R * 0.6, 0xff9ec4, 2);
                    },
                };
            }
            case 'Ghost': {
                // uma sombra fecha a tela (com olhos) e se desfaz em fumaça
                return {
                    paint: (x, y, b) => {
                        const e = edge(x, y);
                        const n = hash(x >> 3, y >> 3) * 0.5 + hash(x >> 1, y >> 1) * 0.2;
                        if (b > 0.95 - 0.35 * e + n * 0.2) return -1;
                        return tone(0.15 + e * 0.5 + n * 0.3, b, [0x0c0814, 0x1a1026, 0x2e1e44, 0x4a3468]);
                    },
                    o1: (x, y) => edge(x, y),
                    o2: (_x, _y, r) => r,
                    leave: 'drift',
                    spread: 420,
                    dur: 520,
                    hit: () => S({ k: 'zz', name: 'sombra' }),
                    brk: () => {
                        S({ k: 'zz', name: 'sombra' });
                        this.burst(W / 2, H / 2, 'wk-fx-smoke', 34, {
                            emitZone: zone(-W / 2, -H / 2, W, H),
                            speed: { min: 6, max: 26 },
                            angle: { min: 240, max: 300 },
                            lifespan: { min: 700, max: 1200 },
                            scale: { start: 1.4, end: 2.6 },
                            alpha: { start: 0.6, end: 0 },
                            tint: [0x4a3468, 0x735797, 0x2e1e44],
                        });
                    },
                    draw: (g, ms) => {
                        // os olhos acendem na sombra e fecham quando ela se desfaz
                        const k = clamp01((ms - this.B * 0.45) / 120) * (1 - clamp01((ms - this.B) / 140));
                        if (k <= 0) return;
                        const s = Math.min(W, H) * 0.06;
                        for (const sx of [-1, 1]) {
                            const x = W / 2 + sx * s * 1.4;
                            const y = H * 0.42;
                            g.fillStyle(0xff3a5a, 0.35 * k).fillEllipse(x, y, s * 2.2, s * 1.6 * k);
                            g.fillStyle(0xffffff, k).fillEllipse(x, y, s * 1.1, s * 0.8 * k);
                        }
                    },
                };
            }
            case 'Poison': {
                // gosma roxa escorre do alto, cobre a tela e derrete
                const cols = Array.from({ length: 24 }, () => rnd());
                const drop = (x: number) => cols[Math.min(cols.length - 1, Math.floor((x / W) * cols.length))];
                const bubbles = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() * H, r: 2 + rnd() * 4 }));
                return {
                    stamp: (put) => {
                        for (const B of bubbles)
                            for (let dy = -B.r; dy <= B.r; dy++)
                                for (let dx = -B.r; dx <= B.r; dx++) {
                                    const d = Math.hypot(dx, dy);
                                    if (d < B.r)
                                        put(
                                            B.x + dx,
                                            B.y + dy,
                                            d < B.r * 0.4 && dx < 0 ? 0xf0c8f8 : d > B.r - 1 ? 0xe090e8 : 0xa33ea1,
                                        );
                                }
                    },
                    paint: (x, y, b) => {
                        if (b > 0.94) return -1;
                        return tone(
                            0.35 + Math.sin(x * 0.12 + y * 0.05) * 0.2 + hash(x >> 2, y >> 2) * 0.25,
                            b,
                            [0x4a1a5a, 0x7a2e8a, 0xa33ea1, 0xc86ad0],
                        );
                    },
                    o1: (x, y) => y / H - drop(x) * 0.25,
                    o2: (x, _y, r) => drop(x) * 0.6 + r * 0.2,
                    leave: 'drip',
                    spread: 260,
                    dur: 640,
                    hit: () => S({ k: 'zz', name: 'gosma' }),
                    brk: () => {
                        S({ k: 'zz', name: 'gosma' });
                        S({ k: 'zz', name: 'pop' });
                        this.burst(W / 2, H * 0.7, 'wk-fx-bubble', 30, {
                            emitZone: zone(-W / 2, -H * 0.3, W, H * 0.5),
                            speed: { min: 10, max: 40 },
                            angle: { min: 250, max: 290 },
                            lifespan: { min: 400, max: 900 },
                            tint: [0xc86ad0, 0xe090e8],
                            alpha: { start: 1, end: 0 },
                        });
                    },
                };
            }
            case 'Bug': {
                // um enxame entra pelas bordas, cobre a tela e se espalha
                const n = this.h.small ? 220 : 320;
                const bugs = Array.from({ length: n }, (_, i) => {
                    const side = i % 4;
                    const from =
                        side === 0
                            ? { x: -10, y: rnd() * H }
                            : side === 1
                              ? { x: W + 10, y: rnd() * H }
                              : side === 2
                                ? { x: rnd() * W, y: -10 }
                                : { x: rnd() * W, y: H + 10 };
                    const to = { x: rnd() * W, y: rnd() * H };
                    const im = this.img(`wk-fx-bug-${i % 2}`, from.x, from.y).setVisible(false);
                    return { im, from, to, r: rnd(), f: i % 2 };
                });
                return {
                    o1: () => 0,
                    o2: () => 0,
                    leave: 'burst',
                    spread: 0,
                    dur: 1,
                    hit: () => {
                        S({ k: 'zz', name: 'zumbido' });
                        for (const b of bugs) b.im.setVisible(true);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'zumbido' });
                        S({ k: 'sfx', name: 'move', pitch: 1.6 });
                    },
                    draw: (_g, ms) => {
                        for (const b of bugs) {
                            const flap = Math.floor(ms / 40 + b.r * 4) % 2;
                            b.im.setTexture(`wk-fx-bug-${flap}`);
                            let x: number;
                            let y: number;
                            if (ms < this.B) {
                                const k = outQuad(clamp01(ms / this.B / (0.6 + b.r * 0.4)));
                                x = lerp(b.from.x, b.to.x, k);
                                y = lerp(b.from.y, b.to.y, k);
                            } else {
                                const k = clamp01((ms - this.B) / (500 + b.r * 300));
                                const th = Math.atan2(b.to.y - I.y, b.to.x - I.x) + (b.r - 0.5);
                                x = b.to.x + Math.cos(th) * R * 0.8 * k * k;
                                y = b.to.y + Math.sin(th) * R * 0.8 * k * k;
                                b.im.setAlpha(1 - k);
                            }
                            x += Math.sin(ms / 50 + b.r * 20) * 2;
                            y += Math.cos(ms / 60 + b.r * 30) * 2;
                            b.im
                                .setPosition(x, y)
                                .setScale(2.5)
                                .setFlipX(b.to.x < b.from.x);
                        }
                    },
                };
            }
            case 'Flying': {
                // uma rajada de vento com penas varre a tela pra direita
                const streaks = Array.from({ length: 16 }, () => ({
                    y: rnd() * H,
                    l: 30 + rnd() * 60,
                    s: 0.6 + rnd() * 0.8,
                }));
                return {
                    paint: (x, y, b) => {
                        const s = Math.sin((x + y * 0.35) * 0.09 + Math.sin(y * 0.05) * 1.6);
                        if (b > 0.32 + 0.3 * s) return -1;
                        return tone(0.5 + s * 0.4, b, [0xa8b8e8, 0xc8d8f8, 0xe8f0ff, 0xffffff]);
                    },
                    o1: (x) => x / W,
                    o2: (x, _y, r) => (1 - x / W) * 0.5 + r * 0.5,
                    leave: 'wind',
                    spread: 280,
                    dur: 560,
                    hit: () => S({ k: 'zz', name: 'vento' }),
                    brk: () => {
                        S({ k: 'zz', name: 'vento' });
                        this.burst(0, H / 2, 'wk-fx-feather', 26, {
                            emitZone: zone(0, -H / 2, W * 0.3, H),
                            speed: { min: 120, max: 260 },
                            angle: { min: -20, max: 10 },
                            lifespan: { min: 700, max: 1200 },
                            rotate: { min: 0, max: 360 },
                            gravityY: 30,
                            alpha: { start: 1, end: 0 },
                        });
                    },
                    draw: (g, ms) => {
                        if (ms > this.B + 700) return;
                        for (const s of streaks) {
                            const x = ((ms * s.s * 0.9) % (W + s.l * 2)) - s.l;
                            g.lineStyle(2, 0xffffff, 0.75).lineBetween(x, s.y, x + s.l, s.y - s.l * 0.08);
                        }
                    },
                };
            }
            case 'Fighting': {
                // um soco vem lá de longe e estoura a tela
                const fist = this.img('wk-fx-fist', I.x, I.y).setVisible(false);
                return {
                    paint: (x, y, b) => {
                        const th = Math.atan2(y - I.y, x - I.x);
                        const d = Math.hypot(x - I.x, y - I.y);
                        const ray = Math.sin(th * 14) > 0.75;
                        if (ray && d > 30) return tone(0.6, b, [0xc22e28, 0xff6a50]);
                        if (b > 0.35 + 0.5 * clamp01(1 - d / (R * 0.35))) return -1;
                        return tone(1 - d / (R * 0.5), b, [0xffc8b0, 0xffe8d8, 0xffffff]);
                    },
                    o1: () => 0.95,
                    o2: (x, y, r) => dI(x, y) * 0.5 + r * 0.1,
                    leave: 'burst',
                    spread: 120,
                    dur: 560,
                    hit: () => {
                        S({ k: 'sfx', name: 'shot', pitch: 0.5 });
                        fist.setVisible(true);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'soco' });
                        S({ k: 'sfx', name: 'thud', pitch: 0.4 });
                        this.h.flash(80, 255, 255, 255);
                        this.h.shake(300, 9);
                        this.burst(I.x, I.y, 'wk-px', 40, {
                            speed: { min: 100, max: 260 },
                            lifespan: { min: 300, max: 600 },
                            scale: { start: 1.4, end: 0 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xffb13b, 0xc22e28],
                        });
                    },
                    draw: (g, ms) => {
                        // o punho cresce (de longe pra cara da tela) e some no estouro
                        if (ms < this.B + 140) {
                            const k = clamp01(ms / this.B);
                            const s = lerp(0.4, 4.2, k ** 2.4);
                            fist.setScale(s)
                                .setAngle(-10 + 10 * k)
                                .setAlpha(ms < this.B ? 1 : 1 - (ms - this.B) / 140);
                        } else fist.setVisible(false);
                        this.ring(g, ms, this.B, 420, R * 0.7, 0xffffff, 5);
                        this.ring(g, ms, this.B + 80, 420, R * 0.5, 0xc22e28, 3);
                    },
                };
            }
            case 'Dragon': {
                // o rugido: ondas de choque saem do impacto e empurram a tela pra fora
                return {
                    paint: (x, y, b) => {
                        // escamas: meias-luas em fileiras
                        const sw = 14;
                        const row = Math.floor(y / (sw * 0.6));
                        const ox = row % 2 ? sw / 2 : 0;
                        const cx = Math.floor((x + ox) / sw) * sw - ox + sw / 2;
                        const cy = row * sw * 0.6;
                        const d = Math.hypot(x - cx, (y - cy) * 1.1);
                        if (d > sw * 0.62 && b > 0.6) return -1;
                        const rim = d > sw * 0.5;
                        return rim
                            ? 0x40e0d0
                            : tone(0.3 + (1 - d / (sw * 0.6)) * 0.6, b, [0x1a0a4a, 0x2a1060, 0x6f35fc]);
                    },
                    o1: (x, y) => dI(x, y) * 1.4,
                    o2: (x, y, r) => dI(x, y) * 0.9 + r * 0.1,
                    leave: 'burst',
                    spread: 260,
                    dur: 600,
                    hit: () => {
                        S({ k: 'zz', name: 'rugido' });
                        this.h.shake(500, 5);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'rugido' });
                        S({ k: 'sfx', name: 'thud', pitch: 0.35 });
                        this.h.flash(90, 160, 120, 255);
                        this.h.shake(360, 8);
                    },
                    draw: (g, ms) => {
                        for (const at of [0, 110, 220, this.B, this.B + 120])
                            this.ring(
                                g,
                                ms,
                                at,
                                480,
                                R * 0.75,
                                at >= this.B ? 0x40e0d0 : 0x9a70ff,
                                at >= this.B ? 5 : 3,
                            );
                    },
                };
            }
            case 'Fairy': {
                // brilhos e corações: a tela vira purpurina rosa e cintila embora
                return {
                    paint: (x, y, b) => {
                        const h = hash(x >> 1, y >> 1);
                        if (h > 0.985) return 0xffffff;
                        if (b > 0.7 + 0.25 * Math.sin(x * 0.07 + y * 0.05)) return -1;
                        return tone(
                            0.4 + Math.sin(x * 0.05 - y * 0.08) * 0.3 + (h - 0.5) * 0.3,
                            b,
                            [0xd685ad, 0xf8a8d0, 0xffd0e8, 0xfff0f8],
                        );
                    },
                    o1: (x, y, r) => dI(x, y) * 1.4 + r * 0.15,
                    o2: (x, y, r) => dI(x, y) + r * 0.3,
                    leave: 'twinkle',
                    spread: 420,
                    dur: 360,
                    hit: () => S({ k: 'zz', name: 'sparkle' }),
                    brk: () => {
                        S({ k: 'zz', name: 'sparkle' });
                        S({ k: 'zz', name: 'magia' });
                        this.burst(I.x, I.y, 'wk-fx-heart', 22, {
                            speed: { min: 40, max: 130 },
                            lifespan: { min: 700, max: 1200 },
                            gravityY: -40,
                            scale: { start: 2, end: 1 },
                            alpha: { start: 1, end: 0 },
                        });
                        this.burst(W / 2, H / 2, 'wk-star', 30, {
                            emitZone: zone(-W / 2, -H / 2, W, H),
                            speed: { min: 0, max: 10 },
                            lifespan: { min: 300, max: 700 },
                            scale: { start: 0, end: 1.2, ease: 'Sine.easeOut' },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xffd0e8],
                        });
                    },
                };
            }
            default: {
                // Normal: um impacto simples, uma estrela que estoura e o anel
                return {
                    o1: () => 0,
                    o2: () => 0,
                    leave: 'burst',
                    spread: 0,
                    dur: 1,
                    hit: () => {
                        S({ k: 'sfx', name: 'thud', pitch: 0.6 });
                        this.h.flash(60, 255, 255, 255);
                    },
                    brk: () => {
                        S({ k: 'zz', name: 'pop' });
                        S({ k: 'sfx', name: 'post', pitch: 1.4 });
                        this.h.shake(200, 4);
                        this.burst(I.x, I.y, 'wk-star', 24, {
                            speed: { min: 80, max: 200 },
                            lifespan: { min: 400, max: 800 },
                            gravityY: 120,
                            scale: { start: 1, end: 0.4 },
                            alpha: { start: 1, end: 0 },
                            tint: [0xffffff, 0xfff1a8, 0xa8a77a],
                        });
                    },
                    draw: (g, ms) => {
                        const s = Math.min(W, H);
                        const k = clamp01(ms / this.B);
                        if (ms < this.B + 400) {
                            const pop = ms < this.B ? lerp(0.2, 1, outQuad(k)) : 1 + 0.5 * ((ms - this.B) / 400);
                            const a = ms < this.B ? 1 : 1 - (ms - this.B) / 400;
                            this.star(g, I.x, I.y, s * 0.28 * pop, 0xfff1a8, a);
                        }
                        this.ring(g, ms, this.B, 380, R * 0.6, 0xffffff, 4);
                    },
                };
            }
        }
    }
}

/** As texturas pequenas das partículas (uma vez por jogo). */
function ensureFxTextures(scene: Phaser.Scene) {
    const make = (key: string, rows: string[], pal: Record<string, string>) => {
        if (scene.textures.exists(key)) return;
        const t = scene.textures.createCanvas(key, rows[0].length, rows.length);
        if (!t) return;
        for (const [y, r] of rows.entries())
            for (const [x, ch] of [...r].entries()) {
                if (ch === '.') continue;
                t.context.fillStyle = pal[ch];
                t.context.fillRect(x, y, 1, 1);
            }
        t.refresh();
    };
    make('wk-fx-leaf', ['..gg.', '.gGGg', 'gGGg.', '.gg..'], { g: '#3f8a2c', G: '#7ac74c' });
    make('wk-fx-feather', ['.....ww', '..wwWW.', 'wwWWw..', '.ww....'], { w: '#c8d8f8', W: '#ffffff' });
    make('wk-fx-heart', ['.p.p.', 'pPpPp', 'pPPPp', '.pPp.', '..p..'], { p: '#d685ad', P: '#ffd0e8' });
    make('wk-fx-bubble', ['.bb.', 'bWbb', 'b..b', '.bb.'], { b: '#e8f4ff', W: '#ffffff' });
    make('wk-fx-smoke', ['..ss..', '.sSSs.', 'sSSSSs', 'sSSSSs', '.sSSs.', '..ss..'], { s: '#9a90a8', S: '#d8d0e0' });
    make('wk-fx-bug-0', ['w.w..', '.ww..', 'kGGGk', '.kkk.'], { w: '#d8e8a0', k: '#2a3008', G: '#7a8a14' });
    make('wk-fx-bug-1', ['.....', 'wwww.', 'kGGGk', '.kkk.'], { w: '#d8e8a0', k: '#2a3008', G: '#7a8a14' });
    // o punho (Lutador): luva vermelha de frente, com os nós dos dedos e o brilho
    make(
        'wk-fx-fist',
        [
            '..kkkkkkkk..',
            '.kRRkRRkRRk.',
            'kRrRkRrRkRrk',
            'kRRRkRRRkRRk',
            'kkkkkkkkkkkk',
            'kRRRRRRRRRRk',
            'kRrrRRRRRRRk',
            'kRRRRRRRRRRk',
            '.kRRRRRRRRk.',
            '..kwwwwwwk..',
            '..kWWWWWWk..',
            '...kkkkkk...',
        ],
        { k: '#1a0606', R: '#c22e28', r: '#ff8a7a', w: '#e8e8e8', W: '#ffffff' },
    );
}
