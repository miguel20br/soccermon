import Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';

/**
 * Kit de cinema da quadra (duelo da bicuda, 03/11/2026; o Miguel quer subir com ele todos os golpes máximos e as
 * bicudas). Só tela, nada aqui toca o motor. Peças:
 * - `CineRig`: a câmera de cinema (plano e contraplano, push-in, holandês, chicote, tremida com curva) e uma camada
 *   presa à tela (`layer`) que acompanha zoom e giro;
 * - `impactFrame` (quadro de impacto em 2 cores e invertido), `speedLines` (radiais ou paralelas), `shockwave`,
 *   `crack` (rachadura no chão), `chroma` (aberração cromática nos sprites), `crowdFlash` (flashes da torcida),
 *   `lightTrail` (rastro de luz da bola), `mangaPanels` (a tela partida em painéis diagonais) e `holdFrame` (congela um
 *   sprite num quadro da animação);
 * - `TypeFx`: partículas de cada tipo (os 15 da Gen 1, Fada, Sombrio e Aço) com teto, em emissores reaproveitados.
 * Texturas: as do kit nascem uma vez por jogo (`ensureCineTextures`); nada cria textura por quadro. "Reduzir movimento"
 * (`reduce`): câmera só em corte seco e sem giro, sem tremida, clarão, aberração nem linhas.
 */

export interface Shot {
    /** O ponto do mundo que a câmera mostra... */
    px: number;
    py: number;
    /** ...neste ponto da tela (px do canvas). */
    sx: number;
    sy: number;
    zoom: number;
    /** Giro da câmera (rad): o ângulo holandês. */
    rot: number;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** O meio da câmera (mundo) que põe `px, py` em `sx, sy` de uma tela `w × h`, com o zoom e o giro do plano. */
export function shotMid(s: Shot, w: number, h: number): { x: number; y: number } {
    const dx = (s.sx - w / 2) / s.zoom;
    const dy = (s.sy - h / 2) / s.zoom;
    const c = Math.cos(-s.rot);
    const n = Math.sin(-s.rot);
    return { x: s.px - (dx * c - dy * n), y: s.py - (dx * n + dy * c) };
}

/** Onde um ponto do mundo aparece na tela (px do canvas) com a câmera no meio `mid`. */
export function worldToScreen(
    mid: { x: number; y: number },
    zoom: number,
    rot: number,
    w: number,
    h: number,
    x: number,
    y: number,
) {
    const dx = (x - mid.x) * zoom;
    const dy = (y - mid.y) * zoom;
    const c = Math.cos(rot);
    const n = Math.sin(rot);
    return { x: w / 2 + dx * c - dy * n, y: h / 2 + dx * n + dy * c };
}

/** O contrário: o ponto do mundo que aparece em `sx, sy` da tela. */
export function screenToWorld(
    mid: { x: number; y: number },
    zoom: number,
    rot: number,
    w: number,
    h: number,
    sx: number,
    sy: number,
) {
    const dx = (sx - w / 2) / zoom;
    const dy = (sy - h / 2) / zoom;
    const c = Math.cos(-rot);
    const n = Math.sin(-rot);
    return { x: mid.x + dx * c - dy * n, y: mid.y + dx * n + dy * c };
}

/**
 * Enquadra as caixas (mundo) na área útil `safe` (px da tela): o zoom que faz elas ocuparem `fill` dela (entre `min` e
 * `max`) e o meio delas no ponto `ax, ay` da área (frações; 0,5 = o meio).
 */
export function fitShot(
    boxes: Box[],
    safe: Box,
    o: { min: number; max: number; fill?: number; rot?: number; ax?: number; ay?: number },
): Shot {
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.w));
    const y1 = Math.max(...boxes.map((b) => b.y + b.h));
    const fill = o.fill ?? 0.8;
    // girado, a caixa ocupa mais: desconta o canto
    const tilt = 1 + Math.abs(o.rot ?? 0) * 0.9;
    const fit = Math.min((fill * safe.w) / (x1 - x0), (fill * safe.h) / (y1 - y0)) / tilt;
    return {
        px: (x0 + x1) / 2,
        py: (y0 + y1) / 2,
        sx: safe.x + safe.w * (o.ax ?? 0.5),
        sy: safe.y + safe.h * (o.ay ?? 0.5),
        zoom: Math.max(o.min, Math.min(o.max, fit)),
        rot: o.rot ?? 0,
    };
}

/** A caixa encolhida `k` de cada lado (a margem do quadro). */
export const inset = (b: Box, k: number): Box => ({
    x: b.x + b.w * k,
    y: b.y + b.h * k,
    w: b.w * (1 - 2 * k),
    h: b.h * (1 - 2 * k),
});

/** Ruído suave (soma de senos) em -1..1: a tremida anda em curva, nunca pula de um lado pro outro. */
const wobble = (t: number, seed: number) =>
    0.55 * Math.sin(t * 0.047 + seed) + 0.3 * Math.sin(t * 0.093 + seed * 2.1) + 0.15 * Math.sin(t * 0.21 + seed * 3.7);

const isGl = (scene: Phaser.Scene) => scene.renderer.type === Phaser.WEBGL;

/**
 * A câmera de cinema: enquanto `active`, ela manda na câmera principal (zoom, giro e meio a cada quadro, `apply`). Os
 * planos (`Shot`) entram em corte seco (`cut`), em movimento (`move`, o push-in) ou em chicote (`whip`, rápido, com
 * borrão na direção). A tremida (`shake`, `rumble`) soma uma curva que sobe e decai. `layer` é uma camada presa à tela
 * (px do canvas), que gira e escala junto: painéis e linhas de tela vão nela. O jogo sem a borda da câmera durante o
 * plano (quem chama devolve).
 */
export class CineRig {
    readonly s: Shot = { px: 0, py: 0, sx: 0, sy: 0, zoom: 1, rot: 0 };
    active = false;
    readonly layer: Phaser.GameObjects.Container;
    private tw: Phaser.Tweens.Tween | null = null;
    private shakes: { amp: number; ms: number; t0: number; seed: number }[] = [];
    private hum = 0;
    private blur: Phaser.Filters.Blur | null = null;
    private blurOff: Phaser.Time.TimerEvent | null = null;
    /** O quadro em que a câmera está de fato (com a tremida): pros textos presos à tela. */
    readonly view = { x: 0, y: 0, zoom: 1, rot: 0 };

    constructor(
        private readonly scene: Phaser.Scene,
        readonly reduce: boolean,
        depth = 9600,
    ) {
        this.layer = scene.add.container(0, 0).setDepth(depth);
    }

    private get cam() {
        return this.scene.cameras.main;
    }

    /** Liga no quadro atual da câmera (sem salto). */
    on() {
        const cam = this.cam;
        cam.panEffect.reset();
        cam.zoomEffect.reset();
        cam.removeBounds();
        Object.assign(this.s, {
            px: cam.midPoint.x,
            py: cam.midPoint.y,
            sx: cam.width / 2,
            sy: cam.height / 2,
            zoom: cam.zoom,
            // a câmera do jogo nunca gira
            rot: 0,
        });
        this.active = true;
        this.apply();
    }

    /** Solta a câmera onde ela está (sem giro: quem chama deixa o giro em 0 antes, senão ele salta). */
    off() {
        this.tw?.stop();
        this.tw = null;
        this.shakes.length = 0;
        this.hum = 0;
        this.active = false;
        this.cam.setRotation(0);
        if (this.blur) this.blur.active = false;
    }

    cut(to: Partial<Shot>) {
        this.tw?.stop();
        this.tw = null;
        Object.assign(this.s, to);
        if (this.reduce) this.s.rot = 0;
    }

    /** Vai pro plano em `ms` (push-in, recuo, troca de giro). No "Reduzir movimento", corte seco. */
    move(to: Partial<Shot>, ms: number, ease = 'Sine.easeInOut', done?: () => void) {
        if (this.reduce || ms <= 0) {
            this.cut(to);
            done?.();
            return;
        }
        this.tw?.stop();
        this.tw = this.scene.tweens.add({
            targets: this.s,
            ...to,
            duration: ms,
            ease,
            onComplete: () => {
                this.tw = null;
                done?.();
            },
        });
    }

    /** Chicote: troca de plano em ~`ms` com borrão na direção do movimento (a câmera "varre" de um pro outro). */
    whip(to: Partial<Shot>, ms = 190, done?: () => void) {
        if (this.reduce) {
            this.cut(to);
            done?.();
            return;
        }
        const cam = this.cam;
        const from = worldToScreen(
            this.view,
            this.view.zoom,
            this.view.rot,
            cam.width,
            cam.height,
            to.px ?? this.s.px,
            to.py ?? this.s.py,
        );
        const dx = from.x - cam.width / 2;
        const dy = from.y - cam.height / 2;
        const d = Math.hypot(dx, dy) || 1;
        if (isGl(this.scene)) {
            this.blur ??= cam.filters.internal.addBlur(0, 1, 0, 1, 0xffffff, 2);
            this.blur.x = (dx / d) * 1.6;
            this.blur.y = (dy / d) * 1.6;
            this.blur.active = true;
            this.blurOff?.remove();
            this.blurOff = this.scene.time.delayedCall(ms * 0.6, () => {
                if (this.blur) this.blur.active = false;
            });
        }
        this.move(to, ms, 'Cubic.easeInOut', done);
    }

    /** Tremida de `amp` px da tela que sobe rápido e decai em curva por `ms`. */
    shake(amp: number, ms: number) {
        if (this.reduce) return;
        this.shakes.push({ amp, ms, t0: this.scene.time.now, seed: Math.random() * 100 });
        if (this.shakes.length > 4) this.shakes.shift();
    }

    /** Tremor contínuo (px da tela) até `rumble(0)`: a energia segurando antes da bicuda. */
    rumble(amp: number) {
        this.hum = this.reduce ? 0 : amp;
    }

    /** A cada quadro, depois de tudo que mexe no plano: põe a câmera nele (com a tremida) e a camada na tela. */
    apply() {
        if (!this.active) return;
        const cam = this.cam;
        const now = this.scene.time.now;
        let ox = 0;
        let oy = 0;
        let or = 0;
        this.shakes = this.shakes.filter((k) => now - k.t0 < k.ms);
        for (const k of this.shakes) {
            const t = (now - k.t0) / k.ms;
            // sobe em 8% e decai ao quadrado
            const env = t < 0.08 ? t / 0.08 : (1 - (t - 0.08) / 0.92) ** 2;
            ox += k.amp * env * wobble(now, k.seed);
            oy += k.amp * env * wobble(now, k.seed + 40);
            or += 0.004 * k.amp * env * wobble(now, k.seed + 80);
        }
        if (this.hum) {
            ox += this.hum * wobble(now * 2.2, 7);
            oy += this.hum * wobble(now * 2.2, 19);
        }
        const rot = this.reduce ? 0 : this.s.rot + or;
        const mid = shotMid({ ...this.s, sx: this.s.sx + ox, sy: this.s.sy + oy, rot }, cam.width, cam.height);
        cam.setZoom(this.s.zoom).setRotation(rot).centerOn(mid.x, mid.y);
        Object.assign(this.view, { x: mid.x, y: mid.y, zoom: this.s.zoom, rot });
        const o = screenToWorld(mid, this.s.zoom, rot, cam.width, cam.height, 0, 0);
        this.layer
            .setPosition(o.x, o.y)
            .setRotation(-rot)
            .setScale(1 / this.s.zoom);
    }

    /** Ponto da tela → mundo com o quadro atual. */
    toWorld(sx: number, sy: number) {
        const cam = this.cam;
        return screenToWorld(this.view, this.view.zoom, this.view.rot, cam.width, cam.height, sx, sy);
    }

    /** Ponto do mundo → tela com o quadro atual. */
    toScreen(x: number, y: number) {
        const cam = this.cam;
        return worldToScreen(this.view, this.view.zoom, this.view.rot, cam.width, cam.height, x, y);
    }
}

// ------------------------------------------------------------------ quadro de impacto
const impactFilters = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.Filters.ColorMatrix>();

/** Linha da matriz de cor que leva a luminância `t = a·L + b` de `ink` (t = 0) a `color` (t = 1). */
function duotone(color: number, ink: number, a: number, b: number): number[] {
    const C = Phaser.Display.Color.IntegerToColor(color);
    const I = Phaser.Display.Color.IntegerToColor(ink);
    const row = (c: number, i: number) => {
        const k = (c - i) / 255;
        return [k * a * 0.299, k * a * 0.587, k * a * 0.114, 0, i + (c - i) * b];
    };
    return [...row(C.red, I.red), ...row(C.green, I.green), ...row(C.blue, I.blue), 0, 0, 0, 1, 0];
}

/**
 * Quadro de impacto (anime): a tela inteira vira 2 cores por metade de `ms` (`invert`: silhuetas escuras no fundo da cor
 * do tipo, pra quadra escurecida; senão o claro na cor e o escuro em tinta, pra quadra acesa) e depois o negativo, e
 * volta. Na câmera principal (WebGL); no Canvas, um clarão curto da cor. Reduzir movimento: nada.
 */
export function impactFrame(scene: Phaser.Scene, color: number, ms = 120, reduce = false, invert = true) {
    if (reduce) return;
    const cam = scene.cameras.main;
    if (!isGl(scene)) {
        cam.flash(ms, (color >> 16) & 255, (color >> 8) & 255, color & 255);
        return;
    }
    let f = impactFilters.get(cam);
    if (!f) {
        f = cam.filters.internal.addColorMatrix();
        impactFilters.set(cam, f);
    }
    const filter = f;
    // invertido (quadra escura: o fundo vira a cor, quem brilha vira silhueta) ou direto (quadra acesa: o claro vira a cor)
    filter.colorMatrix.set(invert ? duotone(color, 0x0d1024, -3.2, 2.1) : duotone(color, 0x0d1024, 3.4, -1.2));
    filter.active = true;
    scene.time.delayedCall(ms / 2, () => filter.colorMatrix.reset().negative());
    scene.time.delayedCall(ms, () => {
        filter.active = false;
    });
}

// ------------------------------------------------------------------ texturas e partículas
type Tex = 'glow' | 'drop' | 'bolt' | 'leaf' | 'shard' | 'star' | 'ring' | 'rock' | 'streak' | 'dot' | 'smoke';
const texKey = (t: Tex) => `cine-${t}`;

/** As texturas brancas do kit (tingidas na hora), feitas uma vez por jogo. */
export function ensureCineTextures(scene: Phaser.Scene) {
    if (scene.textures.exists(texKey('glow'))) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const bake = (t: Tex, w: number, h: number, draw: () => void) => {
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.lineStyle(2, 0xffffff, 1);
        draw();
        g.generateTexture(texKey(t), w, h);
    };
    bake('glow', 16, 16, () => {
        for (let r = 8; r > 0; r -= 2) g.fillStyle(0xffffff, 0.25 + (8 - r) * 0.1).fillCircle(8, 8, r);
    });
    bake('smoke', 24, 24, () => {
        for (let r = 12; r > 0; r -= 3) g.fillStyle(0xffffff, 0.18).fillCircle(12, 12, r);
    });
    bake('drop', 8, 12, () => {
        g.fillCircle(4, 8, 4);
        g.fillTriangle(0.5, 7, 7.5, 7, 4, 0);
    });
    bake('bolt', 12, 16, () => {
        g.lineStyle(2.5, 0xffffff, 1).strokePoints(
            [
                new Phaser.Math.Vector2(8, 1),
                new Phaser.Math.Vector2(3, 7),
                new Phaser.Math.Vector2(8, 9),
                new Phaser.Math.Vector2(3, 15),
            ],
            false,
        );
    });
    bake('leaf', 12, 7, () => {
        g.fillEllipse(6, 3.5, 11, 6);
        g.fillStyle(0x000000, 0.25).fillRect(1, 3, 10, 1);
    });
    bake('shard', 8, 14, () => {
        g.fillPoints(
            [
                new Phaser.Math.Vector2(4, 0),
                new Phaser.Math.Vector2(8, 7),
                new Phaser.Math.Vector2(4, 14),
                new Phaser.Math.Vector2(0, 7),
            ],
            true,
        );
    });
    bake('star', 16, 16, () => {
        g.fillPoints(
            Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4 - Math.PI / 2;
                const r = i % 2 ? 2 : 8;
                return new Phaser.Math.Vector2(8 + Math.cos(a) * r, 8 + Math.sin(a) * r);
            }),
            true,
        );
    });
    bake('ring', 16, 16, () => {
        g.lineStyle(2, 0xffffff, 1).strokeCircle(8, 8, 6.5);
    });
    bake('rock', 10, 10, () => {
        g.fillPoints(
            [
                new Phaser.Math.Vector2(2, 1),
                new Phaser.Math.Vector2(8, 0),
                new Phaser.Math.Vector2(10, 6),
                new Phaser.Math.Vector2(6, 10),
                new Phaser.Math.Vector2(0, 7),
            ],
            true,
        );
        g.fillStyle(0x000000, 0.3).fillRect(5, 5, 5, 5);
    });
    bake('streak', 16, 2, () => {
        g.fillRect(0, 0, 16, 2);
    });
    bake('dot', 3, 3, () => {
        g.fillRect(0, 0, 3, 3);
    });
    g.destroy();
}

interface FxSpec {
    tex: Tex;
    tint: number[];
    add?: boolean;
    gravity: number;
    speed: [number, number];
    life: [number, number];
    scale: [number, number];
    alpha?: [number, number];
    /** Gira (graus no tempo de vida). */
    spin?: number;
    /** Aponta pra onde vai (gota, vento). */
    aim?: boolean;
}

/** A partícula de cada tipo: brasa, gota, raio, folha, gelo, soco, bolha, terra, vento, onda, inseto, pedra, sombra… */
export const TYPE_FX: Record<string, FxSpec> = {
    Normal: {
        tex: 'star',
        tint: [0xffffff, 0xfff3c0],
        add: true,
        gravity: 0,
        speed: [60, 160],
        life: [300, 600],
        scale: [0.7, 0],
    },
    Fire: {
        tex: 'glow',
        tint: [0xee8130, 0xffd23f, 0xff5a1f],
        add: true,
        gravity: -140,
        speed: [40, 150],
        life: [400, 800],
        scale: [0.9, 0.1],
    },
    Water: {
        tex: 'drop',
        tint: [0x6390f0, 0xbfe0ff, 0xffffff],
        gravity: 300,
        speed: [90, 210],
        life: [400, 700],
        scale: [0.8, 0.5],
        aim: true,
    },
    Electric: {
        tex: 'bolt',
        tint: [0xfff27a, 0xffffff, 0xf7d02c],
        add: true,
        gravity: 0,
        speed: [110, 270],
        life: [120, 260],
        scale: [0.9, 0.4],
        spin: 360,
    },
    Grass: {
        tex: 'leaf',
        tint: [0x7ac74c, 0xb6f07a, 0x4e9a2a],
        gravity: 50,
        speed: [50, 150],
        life: [600, 1000],
        scale: [0.8, 0.6],
        spin: 540,
    },
    Ice: {
        tex: 'shard',
        tint: [0xc8f4ff, 0x96d9d6, 0xffffff],
        add: true,
        gravity: 70,
        speed: [60, 180],
        life: [500, 900],
        scale: [0.8, 0.3],
        spin: 240,
    },
    Fighting: {
        tex: 'star',
        tint: [0xc22e28, 0xffffff, 0xff9a5c],
        add: true,
        gravity: 0,
        speed: [130, 270],
        life: [200, 380],
        scale: [1.1, 0],
    },
    Poison: {
        tex: 'ring',
        tint: [0xa33ea1, 0xd48cff],
        gravity: -70,
        speed: [20, 90],
        life: [600, 1000],
        scale: [0.4, 1],
        alpha: [0.9, 0],
    },
    Ground: {
        tex: 'rock',
        tint: [0xe2bf65, 0x9c7a3c],
        gravity: 400,
        speed: [80, 220],
        life: [500, 800],
        scale: [0.6, 0.5],
        spin: 300,
    },
    Flying: {
        tex: 'streak',
        tint: [0xffffff, 0xa98ff3],
        gravity: 0,
        speed: [150, 310],
        life: [250, 450],
        scale: [0.9, 0.3],
        aim: true,
    },
    Psychic: {
        tex: 'ring',
        tint: [0xf95587, 0xffb3cf],
        add: true,
        gravity: 0,
        speed: [20, 80],
        life: [500, 800],
        scale: [0.3, 1.8],
        alpha: [0.9, 0],
    },
    Bug: { tex: 'dot', tint: [0xa6b91a, 0xe0f060], gravity: 0, speed: [50, 170], life: [500, 900], scale: [1, 0.6] },
    Rock: {
        tex: 'rock',
        tint: [0xb6a136, 0x7d6e2a, 0xd8c878],
        gravity: 450,
        speed: [100, 250],
        life: [600, 900],
        scale: [1, 0.8],
        spin: 200,
    },
    Ghost: {
        tex: 'smoke',
        tint: [0x735797, 0xb69ae0],
        add: true,
        gravity: -60,
        speed: [15, 70],
        life: [700, 1200],
        scale: [0.6, 1.3],
        alpha: [0.7, 0],
    },
    Dragon: {
        tex: 'shard',
        tint: [0x6f35fc, 0xb59cff, 0xffd447],
        add: true,
        gravity: 0,
        speed: [90, 210],
        life: [400, 700],
        scale: [0.9, 0.2],
        spin: 400,
    },
    Dark: {
        tex: 'smoke',
        tint: [0x1a1420, 0x705746],
        gravity: -50,
        speed: [15, 70],
        life: [600, 1000],
        scale: [0.7, 1.4],
        alpha: [0.85, 0],
    },
    Steel: {
        tex: 'shard',
        tint: [0xb7b7ce, 0xffffff],
        add: true,
        gravity: 220,
        speed: [130, 270],
        life: [300, 500],
        scale: [0.8, 0.4],
        spin: 500,
    },
    Fairy: {
        tex: 'star',
        tint: [0xd685ad, 0xffd1ea, 0xffffff],
        add: true,
        gravity: -30,
        speed: [30, 120],
        life: [600, 1000],
        scale: [0.7, 0],
        alpha: [1, 0.2],
    },
    /** Poeira do chão (pé de apoio, quique). */
    /** Flash de câmera da torcida (`crowdFlash`). */
    Flash: { tex: 'star', tint: [0xffffff], add: true, gravity: 0, speed: [0, 0], life: [90, 150], scale: [1.6, 0.2] },
    /** Fios da rede estourando no gol. */
    Net: {
        tex: 'streak',
        tint: [0xffffff, 0xe6ecff],
        gravity: 260,
        speed: [120, 320],
        life: [400, 750],
        scale: [0.8, 0.4],
        aim: true,
    },
    Dust: {
        tex: 'smoke',
        tint: [0xe8d8b8, 0xc9b48c],
        gravity: -10,
        speed: [30, 110],
        life: [350, 650],
        scale: [0.4, 1.1],
        alpha: [0.7, 0],
    },
};

const fxOf = (type: string) => TYPE_FX[type] ?? TYPE_FX.Normal;

/**
 * Partículas por tipo: um emissor por tipo pra rajadas (`burst`) e um por fluxo (`stream`, seguindo um ponto), todos com
 * teto (`cap`). Criados na 1ª vez e reaproveitados; a cena destrói junto.
 */
export class TypeFx {
    private readonly bursts = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly cap = 90,
    ) {
        ensureCineTextures(scene);
    }

    private config(type: string, k = 1): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
        const f = fxOf(type);
        return {
            speed: { min: f.speed[0] * k, max: f.speed[1] * k },
            angle: { min: 0, max: 360 },
            lifespan: { min: f.life[0], max: f.life[1] },
            gravityY: f.gravity,
            scale: { start: f.scale[0] * k, end: f.scale[1] * k },
            alpha: { start: f.alpha?.[0] ?? 1, end: f.alpha?.[1] ?? 0 },
            tint: f.tint,
            ...(f.spin ? { rotate: { min: 0, max: f.spin } } : {}),
            ...(f.aim
                ? {
                      rotate: {
                          onEmit: (p?: Phaser.GameObjects.Particles.Particle) =>
                              p ? (Math.atan2(p.velocityY, p.velocityX) * 180) / Math.PI + 90 : 0,
                      },
                  }
                : {}),
            blendMode: f.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
            emitting: false,
            maxAliveParticles: this.cap,
        };
    }

    /** Rajada de `n` partículas do tipo em `x, y` (mundo). */
    burst(type: string, x: number, y: number, n: number, depth: number) {
        let e = this.bursts.get(type);
        if (!e) {
            e = this.scene.add.particles(0, 0, texKey(fxOf(type).tex), this.config(type));
            this.bursts.set(type, e);
        }
        e.setDepth(depth).emitParticleAt(x, y, n);
    }

    /**
     * Fluxo contínuo do tipo saindo de `at` (mundo; o objeto pode andar: a bola, o pé) a cada `every` ms, até `stop`.
     * `k` encolhe ou cresce a partícula e a velocidade (faísca na bola parada = 0,5).
     */
    stream(type: string, at: { x: number; y: number }, every: number, depth: number, k = 1, zone?: Box) {
        const e = this.scene.add.particles(0, 0, texKey(fxOf(type).tex), {
            ...this.config(type, k),
            emitting: true,
            frequency: every,
            follow: at as Phaser.Types.Math.Vector2Like,
            maxAliveParticles: Math.round(this.cap / 2),
            // `zone` (mundo): nasce espalhada nessa caixa (a aura no corpo inteiro), não num ponto só
            ...(zone
                ? {
                      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone({
                          getRandomPoint: (p) => {
                              p.x = zone.x - at.x + Math.random() * zone.w;
                              p.y = zone.y - at.y + Math.random() * zone.h;
                          },
                      }),
                  }
                : {}),
        });
        e.setDepth(depth);
        return {
            rate: (ms: number) => e.setFrequency(ms),
            stop: () => {
                e.stop();
                this.scene.time.delayedCall(1300, () => e.destroy());
            },
        };
    }
}

// ------------------------------------------------------------------ efeitos de um lance
/**
 * Linhas de velocidade por `ms`: radiais saindo de `x, y` (o impacto) ou paralelas a `dir` (a bola voando), redesenhadas
 * a cada 45 ms. `reach()` = o raio da tela em px do mundo (diagonal / zoom), pra ficarem do mesmo tamanho em qualquer
 * zoom. Somem nos últimos 35%. Reduzir movimento: nenhuma.
 */
export function speedLines(
    scene: Phaser.Scene,
    o: {
        at: { x: number; y: number };
        color: number;
        ms: number;
        depth: number;
        reach: () => number;
        dir?: { x: number; y: number };
        n?: number;
        /** 0..1 a cada desenho: quantas linhas, quão fortes e compridas (a bola mais rápida, mais linha). */
        power?: () => number;
        reduce: boolean;
    },
) {
    if (o.reduce) return { stop: () => {} };
    const g = scene.add.graphics().setDepth(o.depth);
    const t0 = scene.time.now;
    const n = o.n ?? (o.dir ? 22 : 34);
    const draw = () => {
        const R = o.reach();
        const k = (scene.time.now - t0) / o.ms;
        const p = o.power ? Math.max(0, Math.min(1, o.power())) : 1;
        g.clear()
            .setPosition(o.at.x, o.at.y)
            .setAlpha((k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35)) * (0.35 + 0.65 * p));
        for (let i = 0; i < Math.round(n * (0.35 + 0.65 * p)); i++) {
            const c = i % 3 ? 0xffffff : o.color;
            g.fillStyle(c, 0.5 + Math.random() * 0.45);
            if (o.dir) {
                // paralelas: faixas ao longo da direção, fora do miolo onde está a bola
                const across = (Math.random() < 0.5 ? -1 : 1) * R * (0.12 + Math.random() * 0.75);
                const along = (Math.random() - 0.5) * R * 1.6;
                const len = R * (0.25 + Math.random() * 0.5) * (0.6 + 0.6 * p);
                const w = 0.6 + Math.random() * 1.8;
                const { x: dx, y: dy } = o.dir;
                const px = -dy;
                const py = dx;
                const ax = along * dx + across * px;
                const ay = along * dy + across * py;
                g.fillTriangle(ax + px * w, ay + py * w, ax - px * w, ay - py * w, ax - dx * len, ay - dy * len);
            } else {
                const a = (i / n) * Math.PI * 2 + Math.random() * 0.15;
                const wa = 0.008 + Math.random() * 0.022;
                const r0 = R * (0.22 + Math.random() * 0.18);
                const r1 = R * 1.3;
                g.fillTriangle(
                    Math.cos(a) * r0,
                    Math.sin(a) * r0,
                    Math.cos(a - wa) * r1,
                    Math.sin(a - wa) * r1,
                    Math.cos(a + wa) * r1,
                    Math.sin(a + wa) * r1,
                );
            }
        }
    };
    draw();
    const ev = scene.time.addEvent({ delay: 45, loop: true, callback: draw });
    const stop = () => {
        ev.remove();
        g.destroy();
    };
    scene.time.delayedCall(o.ms, stop);
    return { stop };
}

/**
 * Onda de choque: anel no chão (achatado) na cor, anel no ar branco e o miolo estourando em branco. `size` 1 ≈ 60 px de
 * raio. Reduzir movimento: só o anel do chão, parado, sumindo.
 */
export function shockwave(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    size: number,
    depth: number,
    reduce: boolean,
) {
    const floor = scene.add.ellipse(x, y, 24, 12).setStrokeStyle(5, color, 1).setDepth(depth);
    if (reduce) {
        floor.setScale(3 * size);
        scene.tweens.add({ targets: floor, alpha: 0, duration: 400, onComplete: () => floor.destroy() });
        return;
    }
    scene.tweens.add({
        targets: floor,
        scale: 6 * size,
        alpha: 0,
        duration: 520,
        ease: 'Cubic.easeOut',
        onComplete: () => floor.destroy(),
    });
    const air = scene.add
        .circle(x, y - 10, 10)
        .setStrokeStyle(3, 0xffffff, 1)
        .setDepth(depth + 2);
    scene.tweens.add({
        targets: air,
        scale: 5 * size,
        alpha: 0,
        delay: 40,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => air.destroy(),
    });
    const core = scene.add
        .circle(x, y - 10, 16 * size, 0xffffff, 1)
        .setDepth(depth + 3)
        .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
        targets: core,
        scale: 0.1,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: () => core.destroy(),
    });
}

/**
 * Rachadura no chão saindo de `x, y` (o pé de apoio): galhos tortos, achatados como o piso, crescendo em 140 ms, com a
 * cor por baixo brilhando. Fica até `fade`. Reduzir movimento: aparece inteira.
 */
export function crack(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    size: number,
    depth: number,
    reduce: boolean,
) {
    const glow = scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    const ink = scene.add.graphics().setDepth(depth + 0.5);
    const arms: { x: number; y: number }[][] = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const pts = [{ x: 0, y: 0 }];
        let px = 0;
        let py = 0;
        const len = (5 + Math.random() * 5) * size;
        for (let s = 0; s < 4; s++) {
            const aa = a + (Math.random() - 0.5) * 0.9;
            px += Math.cos(aa) * len * (1 - s * 0.18);
            py += Math.sin(aa) * len * 0.5 * (1 - s * 0.18);
            pts.push({ x: px, y: py });
        }
        arms.push(pts);
    }
    const draw = (k: number) => {
        glow.clear();
        ink.clear();
        for (const pts of arms) {
            const upto = 1 + (pts.length - 1) * k;
            for (const [g, w, c, al] of [
                [glow, 3, color, 0.3],
                [ink, 1, 0x080402, 0.95],
            ] as const) {
                g.lineStyle(w, c, al).beginPath().moveTo(x, y);
                for (let j = 1; j < upto; j++) g.lineTo(x + pts[j].x, y + pts[j].y);
                g.strokePath();
            }
        }
    };
    if (reduce) draw(1);
    else scene.tweens.addCounter({ from: 0, to: 1, duration: 140, onUpdate: (t) => draw(t.getValue() ?? 1) });
    let gone = false;
    return {
        /** Some em `ms` (uma vez só: a 2ª chamada não faz nada). */
        fade: (ms: number) => {
            if (gone) return;
            gone = true;
            scene.tweens.add({
                targets: [glow, ink],
                alpha: 0,
                duration: ms,
                onComplete: () => {
                    glow.destroy();
                    ink.destroy();
                },
            });
        },
    };
}

/** Aberração cromática curta: cópias vermelha e ciano dos sprites, separadas `px` e sumindo em `ms`. */
export function chroma(
    scene: Phaser.Scene,
    objs: (Phaser.GameObjects.Sprite | Phaser.GameObjects.Image)[],
    px: number,
    ms: number,
    reduce: boolean,
) {
    if (reduce) return;
    for (const o of objs) {
        if (!o.visible) continue;
        for (const [dx, tint] of [
            [-px, 0xff2a4a],
            [px, 0x22e6ff],
        ] as const) {
            const g = scene.add
                .image(o.x + dx, o.y, o.texture.key, o.frame.name)
                .setOrigin(o.originX, o.originY)
                .setScale(o.scaleX, o.scaleY)
                .setRotation(o.rotation)
                .setFlipX(o.flipX)
                .setDepth(o.depth + 0.05)
                .setTint(tint)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setAlpha(0.75);
            scene.tweens.add({
                targets: g,
                alpha: 0,
                x: o.x + dx * 0.3,
                duration: ms,
                ease: 'Quad.easeOut',
                onComplete: () => g.destroy(),
            });
        }
    }
}

/** Flashes de câmera da torcida (estrelinhas brancas piscando) nos pontos `pts` (mundo), espalhados em `ms`. */
export function crowdFlash(
    fx: TypeFx,
    scene: Phaser.Scene,
    pts: { x: number; y: number }[],
    ms: number,
    depth: number,
    reduce: boolean,
) {
    if (reduce) return;
    pts.forEach((p, i) => {
        scene.time.delayedCall((i / pts.length) * ms + Math.random() * 60, () => fx.burst('Flash', p.x, p.y, 1, depth));
    });
}

/** Pontos na beira do quadro visível (`view`, px da tela), onde a torcida aparece: o meio fica pro lance. */
export function edgePoints(rig: CineRig, view: Box, n: number): { x: number; y: number }[] {
    return Array.from({ length: n }, (_, i) => {
        const side = i % 4;
        const t = Math.random();
        const m = 0.1;
        const sx =
            side < 2 ? view.x + view.w * t : view.x + view.w * (side === 2 ? m * Math.random() : 1 - m * Math.random());
        const sy =
            side < 2 ? view.y + view.h * (side === 0 ? m * Math.random() : 1 - m * Math.random()) : view.y + view.h * t;
        return rig.toWorld(sx, sy);
    });
}

/**
 * Rastro de luz da bola (pontos do mais velho pro mais novo): halo largo somando luz, a cor e o miolo branco.
 */
export function lightTrail(g: Phaser.GameObjects.Graphics, pts: { x: number; y: number }[], color: number, w: number) {
    const n = pts.length;
    for (let i = 1; i < n; i++) {
        const k = i / (n - 1);
        for (const [ww, c, al] of [
            [w * 1.9, color, 0.18],
            [w, color, 0.8],
            [w * 0.32, 0xffffff, 0.85],
        ] as const) {
            g.lineStyle(1 + ww * k, c, al * (0.15 + 0.85 * k));
            g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        }
    }
}

/** Congela o sprite no quadro `frame` da animação `key` (a pose do chute). `resume` solta dali. */
export function holdFrame(sprite: Phaser.GameObjects.Sprite, key: string, frame: number) {
    sprite.play({ key, startFrame: frame });
    sprite.anims.pause();
}

// ------------------------------------------------------------------ painéis de mangá
export type Panel = { face: string; color: number; flip: boolean } | { ball: string; color: number };

/**
 * A tela partida em painéis diagonais (mangá): colunas inclinadas com a cor de cada um, linhas de velocidade e o rosto
 * (retrato PMD sem fundo, estourando a borda) ou a bola girando no do meio. Entram batendo um depois do outro, com um
 * clarão em cada, e saem juntos em `ms`. Na camada presa à tela (`rig.layer`), dentro de `view` (px da tela).
 * Reduzir movimento: aparecem e somem sem mexer.
 */
export function mangaPanels(scene: Phaser.Scene, rig: CineRig, view: Box, panels: Panel[], ms: number) {
    const reduce = rig.reduce;
    const n = panels.length;
    const slant = view.w * 0.07;
    const gut = 7;
    const root = scene.add.container(0, 0);
    rig.layer.add(root);
    const bg = scene.add.rectangle(view.x + view.w / 2, view.y + view.h / 2, view.w + 40, view.h + 40, 0x0d1024, 0.92);
    root.add(bg);
    const edge = (i: number, y: number) => {
        // a borda i (0..n) na altura y: inclinada, as de fora retas na beira
        if (i === 0) return view.x - 30;
        if (i === n) return view.x + view.w + 30;
        const b = view.x + (view.w * i) / n;
        return b + slant * (1 - (2 * (y - view.y)) / view.h);
    };
    const top = view.y - 30;
    const bot = view.y + view.h + 30;
    panels.forEach((p, i) => {
        const poly = [
            { x: edge(i, top) + gut, y: top },
            { x: edge(i + 1, top) - gut, y: top },
            { x: edge(i + 1, bot) - gut, y: bot },
            { x: edge(i, bot) + gut, y: bot },
        ];
        const cx = poly.reduce((a, q) => a + q.x, 0) / 4;
        const cy = view.y + view.h * 0.5;
        const c = scene.add.container(0, 0);
        const g = scene.add.graphics();
        const dark = Phaser.Display.Color.IntegerToColor(p.color).darken(30).color;
        const V = poly.map((q) => new Phaser.Math.Vector2(q.x, q.y));
        g.fillStyle(dark, 1).fillPoints(V, true);
        // linhas de velocidade saindo do meio do painel, presas dentro dele (leque até a borda)
        const rays = 26;
        for (let r = 0; r < rays; r++) {
            const a = (r / rays) * Math.PI * 2 + Math.random() * 0.2;
            const hit = rayToPoly(cx, cy, Math.cos(a), Math.sin(a), poly);
            if (!hit) continue;
            const w = 0.03 + Math.random() * 0.04;
            const hit2 = rayToPoly(cx, cy, Math.cos(a + w), Math.sin(a + w), poly) ?? hit;
            const r0 = 0.3 + Math.random() * 0.25;
            g.fillStyle(r % 3 ? 0xffffff : p.color, 0.22 + Math.random() * 0.25);
            g.fillTriangle(cx + (hit.x - cx) * r0, cy + (hit.y - cy) * r0, hit.x, hit.y, hit2.x, hit2.y);
        }
        g.lineStyle(4, 0xffffff, 1).strokePoints(V, true, true);
        c.add(g);
        const ph = view.h * 0.72;
        if ('face' in p) {
            if (scene.textures.exists(p.face)) {
                const img = scene.add.image(cx, cy + view.h * 0.06, p.face).setFlipX(p.flip);
                img.setScale(ph / (img.height || 40));
                c.add(img);
                if (!reduce)
                    scene.tweens.add({ targets: img, scale: img.scale * 1.07, duration: ms, ease: 'Sine.easeOut' });
            }
        } else {
            const glow = scene.add.circle(cx, cy, ph * 0.33, p.color, 0.45).setBlendMode(Phaser.BlendModes.ADD);
            const ball = scene.add.image(cx, cy, p.ball);
            ball.setScale((ph * 0.42) / (ball.height || 12));
            c.add([glow, ball]);
            if (!reduce) scene.tweens.add({ targets: ball, rotation: 7, duration: ms, ease: 'Sine.easeOut' });
        }
        root.add(c);
        if (reduce) return;
        // entra batendo: o de fora vem do lado dele, o do meio de cima
        const from =
            i === 0 ? { x: -view.w * 0.6, y: 0 } : i === n - 1 ? { x: view.w * 0.6, y: 0 } : { x: 0, y: -view.h };
        c.setPosition(from.x, from.y).setAlpha(0);
        scene.tweens.add({ targets: c, x: 0, y: 0, alpha: 1, delay: i * 80, duration: 150, ease: 'Back.easeOut' });
        const flash = scene.add.graphics().fillStyle(0xffffff, 1).fillPoints(V, true).setAlpha(0);
        root.add(flash);
        scene.tweens.add({ targets: flash, alpha: { from: 0.9, to: 0 }, delay: i * 80 + 130, duration: 140 });
    });
    if (!reduce) {
        bg.setAlpha(0);
        scene.tweens.add({ targets: bg, alpha: 1, duration: 120 });
    }
    const out = () => root.destroy();
    if (reduce) scene.time.delayedCall(ms, out);
    else scene.tweens.add({ targets: root, alpha: 0, scale: 1.04, delay: ms - 140, duration: 140, onComplete: out });
    return { destroy: out };
}

/** Onde o raio que sai de (x, y) na direção (dx, dy) cruza a borda do polígono convexo (o ponto mais longe). */
export function rayToPoly(x: number, y: number, dx: number, dy: number, poly: { x: number; y: number }[]) {
    let best: { x: number; y: number } | null = null;
    let bt = -1;
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((a.x - x) * ey - (a.y - y) * ex) / den;
        const u = ((a.x - x) * dy - (a.y - y) * dx) / den;
        if (t > 0 && u >= 0 && u <= 1 && t > bt) {
            bt = t;
            best = { x: x + dx * t, y: y + dy * t };
        }
    }
    return best;
}

export const typeColor = (type: string) => hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
