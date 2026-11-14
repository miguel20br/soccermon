import Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';

/**
 * Animação de cada golpe (revisada golpe a golpe com o Miguel no laboratório ?lab=golpes).
 * Cada golpe tem uma "receita" montada com peças simples (projétil, jato, raio, ícone no alvo, corte, mordida,
 * pó caindo, gás, escudo, clones, giro…), na cor do tipo. Tudo é efêmero: cada peça se destrói no fim.
 * A receita devolve em quantos ms o golpe acerta (quando o alvo pisca e leva o anel de impacto).
 */
export type FxStyle =
    | 'projectile'
    | 'beam'
    | 'stream'
    | 'sky'
    | 'quake'
    | 'explosion'
    | 'wave'
    | 'melee'
    | 'sound'
    | 'cloud'
    | 'aura';

/** Partícula do Showdown por tipo do golpe. */
export const FX_BY_TYPE: Record<string, string> = {
    Fire: 'fireball',
    Water: 'waterwisp',
    Electric: 'lightning',
    Grass: 'leaf1',
    Ice: 'icicle',
    Fighting: 'fist',
    Poison: 'poisonwisp',
    Ground: 'mudwisp',
    Flying: 'feather',
    Psychic: 'mistball',
    Bug: 'web',
    Rock: 'rock1',
    Ghost: 'shadowball',
    Dragon: 'bluefireball',
    Normal: 'impact',
    Steel: 'sword',
    Fairy: 'heart',
    Dark: 'shadowball',
};

/** Partículas extras carregadas além das do tipo. */
export const EXTRA_FX = [
    'fist',
    'foot',
    'petal',
    'rock2',
    'rock3',
    'shine',
    'wisp',
    'hitmarker',
    'leaf2',
    'iceball',
    'electroball',
    'energyball',
    'bone',
    'topbite',
    'bottombite',
    'leftclaw',
    'rightclaw',
    'leftchop',
    'rightchop',
    'shell',
    'moon',
    'flareball',
    'caltrop',
    'poisoncaltrop',
    'blackwisp',
    'stare',
    'rainbow',
    'sword',
    'heart',
    'angry',
    'mudwisp',
    'waterwisp',
];

/** Todas as partículas usadas pelos golpes (para o preload). */
export const FX_TEXTURES = [...new Set([...Object.values(FX_BY_TYPE), ...EXTRA_FX])];

export function preloadMoveFx(scene: Phaser.Scene) {
    for (const fx of FX_TEXTURES) {
        if (!scene.textures.exists(`fx-${fx}`)) scene.load.image(`fx-${fx}`, `assets/fx/${fx}.png`);
    }
}

type Pt = { x: number; y: number };
type IconKind = 'lips' | 'dizzy' | 'tongue' | 'finger' | 'spoon' | 'doll' | 'zzz' | 'question' | 'note' | 'note2';

/** Estrelinha de 5 pontas desenhada. */
function starPoints(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fill: number, ink: number) {
    const pts: Pt[] = [];
    for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = k % 2 ? r * 0.45 : r;
        pts.push({ x: x + Math.cos(ang) * rr, y: y + Math.sin(ang) * rr });
    }
    g.fillStyle(fill, 1).fillPoints(pts as Phaser.Math.Vector2[], true);
    g.lineStyle(1.5, ink, 1).strokePoints(pts as Phaser.Math.Vector2[], true);
}

/** Letra Z (zzz do sono). */
const zPoints = (x: number, y: number, s: number): Pt[] => [
    { x: x - s / 2, y: y - s / 2 },
    { x: x + s / 2, y: y - s / 2 },
    { x: x - s / 2, y: y + s / 2 },
    { x: x + s / 2, y: y + s / 2 },
];
type Who = 'user' | 'target';

interface KitCtx {
    scene: Phaser.Scene;
    user: Phaser.GameObjects.Sprite;
    target: Phaser.GameObjects.Sprite | null;
    from: Pt;
    to: Pt | null;
    color: number;
    /** Partícula do tipo do golpe. */
    typeFx: string;
    depth: number;
    strong: boolean;
    baseScale: number;
    onHit: (x: number, y: number) => void;
    /** Desloca o sprite por um tempo (a partida soma isso à posição que vem do motor). */
    nudge: (who: Who, dx: number, dy: number, ms: number) => void;
}

const WHITE = 0xffffff;

/** Peças das animações. */
class Kit {
    constructor(readonly c: KitCtx) {}

    get s() {
        return this.c.scene;
    }
    get to(): Pt {
        return this.c.to ?? { x: this.c.from.x + 90, y: this.c.from.y };
    }
    get dir() {
        return Math.sign(this.to.x - this.c.from.x) || 1;
    }

    img(name: string, x: number, y: number, scale = 0.6, tint: number | null = this.c.color, add = true) {
        const key = `fx-${name}`;
        if (!this.s.textures.exists(key)) {
            return this.s.add
                .circle(x, y, 7 * scale * 1.5, tint ?? this.c.color, 0.9)
                .setDepth(this.c.depth)
                .setBlendMode(add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
        }
        const im = this.s.add.image(x, y, key).setDepth(this.c.depth).setScale(scale);
        if (tint !== null) im.setTint(tint);
        if (add) im.setBlendMode(Phaser.BlendModes.ADD);
        return im;
    }

    text(t: string, x: number, y: number, size = 22, color = '#ffffff') {
        return this.s.add
            .text(x, y, t, { fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3 })
            .setOrigin(0.5)
            .setDepth(this.c.depth + 2);
    }

    later(ms: number, fn: () => void) {
        this.s.time.delayedCall(ms, fn);
    }

    fade(o: Phaser.GameObjects.GameObject, props: object, ms: number, delay = 0, ease = 'Quad.easeOut') {
        this.s.tweens.add({ targets: o, ...props, duration: ms, delay, ease, onComplete: () => o.destroy() });
    }

    /** Acerta o alvo daqui a `ms` (anel de impacto + alvo pisca). Sem alvo, não faz nada. */
    hit(ms: number) {
        const t = this.c.to;
        if (t) this.later(ms, () => this.c.onHit(t.x, t.y));
        return ms;
    }

    ring(at: Pt, color = this.c.color, scale = 2.6, ms = 420, width = 4) {
        const r = this.s.add.circle(at.x, at.y, 10).setStrokeStyle(width, color, 1).setDepth(this.c.depth);
        this.fade(r, { scale, alpha: 0 }, ms);
    }

    // ------------------------------------------------------------ à distância
    /** Projétil(eis) até o alvo (ou do alvo até quem usou, `reverse`). */
    projectile(o: {
        name?: string;
        count?: number;
        gap?: number;
        scale?: number;
        tint?: number | null;
        spin?: number;
        arc?: number;
        ms?: number;
        reverse?: boolean;
        trail?: boolean;
        spread?: number;
    }) {
        const n = o.count ?? 1;
        const gap = o.gap ?? 100;
        const ms = o.ms ?? 380;
        const a = o.reverse ? this.to : this.c.from;
        const b = o.reverse ? this.c.from : this.to;
        for (let i = 0; i < n; i++) {
            this.later(i * gap, () => {
                const spread = o.spread ?? 0;
                const end = {
                    x: b.x + Phaser.Math.Between(-spread, spread),
                    y: b.y + Phaser.Math.Between(-spread, spread),
                };
                const p = this.img(
                    o.name ?? this.c.typeFx,
                    a.x,
                    a.y,
                    o.scale ?? 0.7,
                    o.tint === undefined ? this.c.color : o.tint,
                );
                const arc = o.arc ?? 0;
                const prog = { t: 0 };
                const trail = o.trail
                    ? this.s.time.addEvent({
                          delay: 35,
                          repeat: Math.ceil(ms / 35),
                          callback: () => {
                              const d = this.s.add
                                  .circle(p.x, p.y, 5, this.c.color, 0.6)
                                  .setDepth(this.c.depth - 1)
                                  .setBlendMode(Phaser.BlendModes.ADD);
                              this.fade(d, { alpha: 0, scale: 0.2 }, 280);
                          },
                      })
                    : null;
                this.s.tweens.add({
                    targets: prog,
                    t: 1,
                    duration: ms,
                    ease: 'Quad.easeIn',
                    onUpdate: () => {
                        p.x = a.x + (end.x - a.x) * prog.t;
                        p.y = a.y + (end.y - a.y) * prog.t - Math.sin(prog.t * Math.PI) * arc;
                        if (o.spin) p.rotation += o.spin;
                    },
                    onComplete: () => {
                        trail?.remove();
                        this.fade(p, { alpha: 0, scale: (o.scale ?? 0.7) * 1.6 }, 200);
                    },
                });
            });
        }
        return o.reverse ? ms + (n - 1) * gap : this.hit(ms + (n - 1) * gap);
    }

    /** Jato contínuo de partículas (lança-chamas, jato d'água). `reverse`: do alvo para quem usou (drenar). */
    stream(o: {
        name?: string;
        count?: number;
        gap?: number;
        scale?: number;
        jitter?: number;
        ms?: number;
        reverse?: boolean;
        tint?: number | null;
        grow?: number;
    }) {
        const n = o.count ?? 10;
        const gap = o.gap ?? 35;
        const ms = o.ms ?? 260;
        const a = o.reverse ? this.to : this.c.from;
        const b = o.reverse ? this.c.from : this.to;
        for (let i = 0; i < n; i++) {
            this.later(i * gap, () => {
                const j = o.jitter ?? 8;
                const p = this.img(
                    o.name ?? this.c.typeFx,
                    a.x,
                    a.y,
                    o.scale ?? 0.45,
                    o.tint === undefined ? this.c.color : o.tint,
                );
                this.s.tweens.add({
                    targets: p,
                    x: b.x + Phaser.Math.Between(-j, j),
                    y: b.y + Phaser.Math.Between(-j, j),
                    scale: (o.scale ?? 0.45) * (o.grow ?? 1.6),
                    angle: Phaser.Math.Between(-90, 90),
                    duration: ms,
                    ease: 'Quad.easeIn',
                    onComplete: () => this.fade(p, { alpha: 0 }, 160),
                });
            });
        }
        return o.reverse ? ms + n * gap * 0.5 : this.hit(ms + Math.min(n, 4) * gap);
    }

    /** Raios: laser, relâmpago horizontal, gelo, bolhas, solar, hiper, triplo, sombra, onda psíquica, dragão. */
    beam(kind: 'laser' | 'bolt' | 'ice' | 'bubbles' | 'solar' | 'hyper' | 'tri' | 'shadow' | 'psywave' | 'dragon') {
        const a = this.c.from;
        const b = this.to;
        const s = this.s;
        const d = this.c.depth;
        const line = (color: number, w: number, alpha: number, dy = 0, hold = 260) => {
            const g = s.add.graphics().setDepth(d).setBlendMode(Phaser.BlendModes.ADD);
            g.lineStyle(w, color, alpha).lineBetween(a.x, a.y, b.x, b.y + dy);
            g.setAlpha(0);
            s.tweens.add({ targets: g, alpha: 1, duration: 80, yoyo: true, hold, onComplete: () => g.destroy() });
            return g;
        };
        switch (kind) {
            case 'bolt': {
                // relâmpago em zigue-zague na horizontal, piscando
                for (let k = 0; k < 3; k++) {
                    this.later(k * 110, () => {
                        const g = s.add.graphics().setDepth(d).setBlendMode(Phaser.BlendModes.ADD);
                        const steps = 9;
                        const pts: Pt[] = [];
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const off = i === 0 || i === steps ? 0 : Phaser.Math.Between(-14, 14);
                            pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + off });
                        }
                        g.lineStyle(7, 0xfff36b, 0.5).strokePoints(pts as Phaser.Math.Vector2[]);
                        g.lineStyle(3, WHITE, 1).strokePoints(pts as Phaser.Math.Vector2[]);
                        this.fade(g, { alpha: 0 }, 160, 60);
                    });
                }
                return this.hit(120);
            }
            case 'ice': {
                line(0x9be7ff, 12, 0.7);
                line(WHITE, 4, 1);
                for (let i = 1; i < 6; i++) {
                    const t = i / 6;
                    this.later(i * 40, () => {
                        const p = this.img('icicle', a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.45, 0xbff4ff);
                        p.setAngle(Phaser.Math.Between(0, 360));
                        this.fade(p, { alpha: 0, scale: 0.8 }, 420, 120);
                    });
                }
                return this.hit(160);
            }
            case 'bubbles': {
                for (let i = 0; i < 14; i++) {
                    this.later(i * 30, () => {
                        const bub = s.add
                            .circle(a.x, a.y, Phaser.Math.Between(4, 8))
                            .setStrokeStyle(2, 0xbfe8ff, 1)
                            .setFillStyle(0x6fc3ff, 0.25)
                            .setDepth(d);
                        s.tweens.add({
                            targets: bub,
                            x: b.x + Phaser.Math.Between(-10, 10),
                            y: b.y + Phaser.Math.Between(-10, 10),
                            duration: 300,
                            onComplete: () => this.fade(bub, { scale: 1.6, alpha: 0 }, 140),
                        });
                    });
                }
                return this.hit(330);
            }
            case 'solar': {
                // junta a luz do sol e dispara um raio largo verde e dourado
                this.absorbIn(0xfff27a, 'shine', 10, 420);
                this.later(450, () => {
                    line(0x7dff6a, 26, 0.45, 0, 420);
                    line(0xfff27a, 12, 0.85, 0, 420);
                    line(WHITE, 4, 1, 0, 420);
                    s.cameras.main.flash(160, 255, 255, 200, false);
                });
                return this.hit(520);
            }
            case 'hyper': {
                this.absorbIn(0xffd447, 'shine', 12, 420);
                this.later(450, () => {
                    line(0xff8a1c, 34, 0.4, 0, 500);
                    line(0xffe14d, 16, 0.9, 0, 500);
                    line(WHITE, 6, 1, 0, 500);
                    s.cameras.main.shake(500, 0.014);
                    s.cameras.main.flash(200, 255, 230, 160, false);
                    this.explosion({ at: 'target', size: 3, quiet: true });
                });
                return this.hit(520);
            }
            case 'tri': {
                // três feixes: fogo, gelo e raio
                const cols = [0xff6b3d, 0x9be7ff, 0xffe14d];
                cols.forEach((col, i) => {
                    this.later(i * 70, () => line(col, 6, 0.95, (i - 1) * 10, 220));
                });
                return this.hit(240);
            }
            case 'shadow': {
                for (let i = 0; i < 8; i++) {
                    this.later(i * 45, () => {
                        const w = this.img('blackwisp', a.x, a.y, 0.6, 0x5a2a8a, false);
                        s.tweens.add({
                            targets: w,
                            x: b.x + Phaser.Math.Between(-12, 12),
                            y: b.y + Phaser.Math.Between(-12, 12),
                            duration: 360,
                            onComplete: () => this.fade(w, { alpha: 0, scale: 1.4 }, 260),
                        });
                    });
                }
                if (this.c.target) this.tintFlash('target', 0x3a2060, 600, 420);
                return this.hit(420);
            }
            case 'psywave': {
                const g = s.add.graphics().setDepth(d).setBlendMode(Phaser.BlendModes.ADD);
                const draw = (phase: number) => {
                    g.clear().lineStyle(4, 0xff7ad9, 0.9);
                    const pts: Pt[] = [];
                    for (let i = 0; i <= 30; i++) {
                        const t = i / 30;
                        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + Math.sin(t * 14 + phase) * 9 });
                    }
                    g.strokePoints(pts as Phaser.Math.Vector2[]);
                };
                const ph = { v: 0 };
                s.tweens.add({
                    targets: ph,
                    v: 8,
                    duration: 500,
                    onUpdate: () => draw(ph.v),
                    onComplete: () => g.destroy(),
                });
                return this.hit(250);
            }
            case 'dragon': {
                // Dragon Rage: chama azul grande e furiosa, com tremor
                this.stream({
                    name: 'bluefireball',
                    count: 20,
                    gap: 26,
                    scale: 1.1,
                    jitter: 18,
                    grow: 2.2,
                    tint: null,
                });
                this.later(380, () => {
                    s.cameras.main.shake(300, 0.01);
                    this.explosion({ at: 'target', size: 3.5, color: 0x6a8bff, quiet: true });
                });
                return this.hit(380);
            }
            default: {
                line(this.c.color, this.c.strong ? 14 : 9, 0.85);
                line(WHITE, 4, 1);
                return this.hit(120);
            }
        }
    }

    // ------------------------------------------------------------ no alvo
    /** Ícone(s) batendo no alvo (soco, pé, mão de karatê…), com faíscas do tipo se quiser. */
    strike(
        icons: string[],
        o: { count?: number; gap?: number; scale?: number; tint?: number | null; sparks?: string } = {},
    ) {
        const t = this.to;
        const n = o.count ?? 1;
        const gap = o.gap ?? 160;
        for (let i = 0; i < n; i++) {
            this.later(140 + i * gap, () => {
                const name = icons[i % icons.length];
                const x = t.x + (n > 1 ? (i % 2 ? 10 : -10) : 0);
                const y = t.y + (n > 1 ? (i % 2 ? -6 : 6) : 0);
                const ic = this.img(
                    name,
                    x - this.dir * 18,
                    y,
                    (o.scale ?? 0.8) * 0.7,
                    o.tint === undefined ? null : o.tint,
                    false,
                );
                if (this.dir < 0 && ic instanceof Phaser.GameObjects.Image) ic.setFlipX(true);
                this.s.tweens.add({ targets: ic, x, scale: o.scale ?? 0.8, duration: 90, ease: 'Back.easeOut' });
                this.fade(ic, { alpha: 0 }, 220, 200);
                this.c.onHit(x, y);
                if (o.sparks) {
                    for (let k = 0; k < 6; k++) {
                        const ang = (k / 6) * Math.PI * 2;
                        const p = this.img(o.sparks, x, y, 0.35);
                        this.fade(p, { x: x + Math.cos(ang) * 34, y: y + Math.sin(ang) * 26, alpha: 0 }, 380);
                    }
                }
            });
        }
        return 140;
    }

    /** Corte(s) no alvo: risco branco; `claws` = três garras paralelas. */
    slash(n = 1, o: { claws?: boolean; big?: boolean; gap?: number; color?: number } = {}) {
        const t = this.to;
        for (let i = 0; i < n; i++) {
            this.later(120 + i * (o.gap ?? 110), () => {
                const g = this.s.add
                    .graphics()
                    .setDepth(this.c.depth + 1)
                    .setPosition(t.x, t.y);
                const len = o.big ? 30 : 22;
                const flip = i % 2 ? -1 : 1;
                g.lineStyle(o.big ? 5 : 3, o.color ?? WHITE, 1);
                for (const off of o.claws ? [-8, 0, 8] : [0])
                    g.lineBetween(-len + off, -len * flip, len + off, len * flip);
                g.setScale(0.3);
                this.s.tweens.add({ targets: g, scale: 1, duration: 80, ease: 'Quad.easeOut' });
                this.fade(g, { alpha: 0 }, 260, 140);
                this.c.onHit(t.x, t.y);
            });
        }
        return 120;
    }

    /** Mordida: presas de cima e de baixo fechando no alvo. */
    bite(big = false) {
        const t = this.to;
        const sc = big ? 0.6 : 0.45;
        const top = this.img('topbite', t.x, t.y - 34, sc, null, false);
        const bot = this.img('bottombite', t.x, t.y + 34, sc, null, false);
        this.s.tweens.add({ targets: top, y: t.y - 8, duration: 160, delay: 80, ease: 'Quad.easeIn' });
        this.s.tweens.add({ targets: bot, y: t.y + 8, duration: 160, delay: 80, ease: 'Quad.easeIn' });
        this.fade(top, { alpha: 0 }, 220, 480);
        this.fade(bot, { alpha: 0 }, 220, 480);
        return this.hit(240);
    }

    /** Algo cai do alto no alvo: raios, neve afiada, pedras, água, mergulho. */
    sky(kind: 'bolt' | 'snow' | 'rocks' | 'water' | 'dive', big = false) {
        const at = this.to;
        const s = this.s;
        if (kind === 'bolt') {
            // Thunder: tela escurece, vários raios grossos, clarões e tremor
            const cam = s.cameras.main;
            const dark = s.add
                .rectangle(cam.midPoint.x, cam.midPoint.y, 4000, 4000, 0x000010, 0)
                .setDepth(this.c.depth - 5);
            s.tweens.add({
                targets: dark,
                fillAlpha: 0.45,
                duration: 150,
                yoyo: true,
                hold: 500,
                onComplete: () => dark.destroy(),
            });
            for (let k = 0; k < (big ? 4 : 3); k++) {
                this.later(150 + k * 120, () => {
                    const x = at.x + Phaser.Math.Between(-14, 14);
                    const g = s.add
                        .graphics()
                        .setDepth(this.c.depth + 1)
                        .setBlendMode(Phaser.BlendModes.ADD);
                    const pts: Pt[] = [{ x, y: at.y - 220 }];
                    let y = at.y - 220;
                    let xx = x;
                    while (y < at.y) {
                        y += 26;
                        xx += Phaser.Math.Between(-14, 14);
                        pts.push({ x: xx, y: Math.min(y, at.y) });
                    }
                    g.lineStyle(10, 0xfff36b, 0.45).strokePoints(pts as Phaser.Math.Vector2[]);
                    g.lineStyle(4, WHITE, 1).strokePoints(pts as Phaser.Math.Vector2[]);
                    this.fade(g, { alpha: 0 }, 200, 80);
                    cam.flash(90, 255, 255, 220, false);
                });
            }
            this.later(150, () => cam.shake(450, 0.012));
            return this.hit(180);
        }
        const n = kind === 'rocks' ? (big ? 9 : 6) : kind === 'snow' ? 18 : kind === 'water' ? 14 : 1;
        for (let k = 0; k < n; k++) {
            this.later(k * (kind === 'snow' ? 25 : 55), () => {
                const x = at.x + Phaser.Math.Between(-28, 28);
                let p: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
                if (kind === 'snow') {
                    p = this.img('icicle', x - 60, at.y - 150, 0.4, 0xdff8ff);
                    p.setAngle(135);
                } else if (kind === 'rocks') {
                    p = this.img(['rock1', 'rock2', 'rock3'][k % 3], x, at.y - 170, 0.7, null, false);
                } else if (kind === 'water') {
                    p = this.img('waterwisp', x, at.y - 160, 0.6, 0x6fc3ff);
                } else {
                    // Sky Attack/Fly: quem usou mergulha brilhando do alto
                    p = s.add
                        .circle(at.x, at.y - 200, 16, WHITE, 0.9)
                        .setDepth(this.c.depth)
                        .setBlendMode(Phaser.BlendModes.ADD);
                }
                s.tweens.add({
                    targets: p,
                    x: kind === 'snow' ? x : p.x,
                    y: at.y + Phaser.Math.Between(-6, 6),
                    duration: kind === 'dive' ? 220 : 300,
                    ease: 'Quad.easeIn',
                    onComplete: () => this.fade(p, { alpha: 0, scale: 1.4 }, 160),
                });
            });
        }
        if (kind === 'rocks') this.later(300, () => s.cameras.main.shake(300, 0.008));
        return this.hit(kind === 'dive' ? 220 : 320);
    }

    /** Chão tremendo; `crack` abre uma rachadura até o alvo (Fissure). */
    quake(crack = false) {
        const a = this.c.from;
        const s = this.s;
        s.cameras.main.shake(this.c.strong ? 520 : 340, this.c.strong ? 0.012 : 0.007);
        for (let i = 0; i < 3; i++) {
            const ring = s.add
                .ellipse(a.x, a.y + 10, 30, 12)
                .setStrokeStyle(6, 0x2a1808, 0.85)
                .setDepth(this.c.depth - 1);
            ring.setScale(0.4);
            this.fade(ring, { scale: 4 + i, alpha: 0 }, 560, i * 140);
        }
        if (crack) {
            const b = this.to;
            const g = s.add.graphics().setDepth(this.c.depth - 1);
            const pts: Pt[] = [];
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + 12 + (b.y - a.y) * t + (i % 2 ? 6 : -6) });
            }
            g.lineStyle(7, 0x120804, 0.95).strokePoints(pts as Phaser.Math.Vector2[]);
            g.lineStyle(2, 0xff7a3a, 0.8).strokePoints(pts as Phaser.Math.Vector2[]);
            this.fade(g, { alpha: 0 }, 500, 500);
        }
        for (let i = 0; i < 6; i++) {
            const rock = this.img('rock2', a.x, a.y + 6, 0.4, null, false);
            this.fade(
                rock,
                { x: a.x + Phaser.Math.Between(-60, 60), y: a.y - Phaser.Math.Between(10, 40), alpha: 0 },
                520,
            );
        }
        return this.hit(260);
    }

    explosion(o: { at: Who; size?: number; color?: number; quiet?: boolean }) {
        const at = o.at === 'user' ? this.c.from : this.to;
        const size = o.size ?? 4;
        const color = o.color ?? this.c.color;
        const s = this.s;
        const ball = s.add
            .circle(at.x, at.y, 14, color, 0.9)
            .setDepth(this.c.depth)
            .setBlendMode(Phaser.BlendModes.ADD);
        const core = s.add.circle(at.x, at.y, 9, WHITE, 1).setDepth(this.c.depth + 1);
        this.fade(ball, { scale: size * 1.5, alpha: 0 }, 560);
        this.fade(core, { scale: size, alpha: 0 }, 320);
        for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2;
            const p = this.img(i % 2 ? 'flareball' : 'fireball', at.x, at.y, 0.45, i % 3 ? color : WHITE);
            this.fade(p, { x: at.x + Math.cos(ang) * 22 * size, y: at.y + Math.sin(ang) * 15 * size, alpha: 0 }, 560);
        }
        if (!o.quiet) {
            s.cameras.main.shake(380, 0.004 * size);
            s.cameras.main.flash(180, 255, 240, 200, false);
        }
        if (o.at === 'target') this.c.onHit(at.x, at.y);
        return 0;
    }

    /** Onda de choque (Sonic Boom, Psychic, Supersonic, Thunder Wave): anéis saindo de um ponto. */
    shockwave(at: Who, o: { color?: number; rings?: number; big?: boolean; travel?: boolean } = {}) {
        const p = at === 'user' ? this.c.from : this.to;
        const n = o.rings ?? 3;
        for (let i = 0; i < n; i++) {
            this.later(i * 100, () => {
                const r = this.s.add
                    .circle(o.travel ? this.c.from.x : p.x, o.travel ? this.c.from.y : p.y, 10)
                    .setStrokeStyle(o.big ? 6 : 4, o.color ?? this.c.color, 0.95)
                    .setDepth(this.c.depth);
                const props: Record<string, number> = { scale: o.big ? 5 : 3.5, alpha: 0 };
                if (o.travel) {
                    props.x = this.to.x;
                    props.y = this.to.y;
                }
                this.fade(r, props, 520);
            });
        }
        return this.hit(o.travel ? 360 : 200);
    }

    /** Boca de quem usa: perto do topo do sprite, do lado para onde ele olha. */
    get mouth(): Pt {
        const u = this.c.user;
        const top = u.y - u.displayHeight * u.originY;
        return { x: u.x + this.dir * Math.abs(u.displayWidth) * 0.28, y: top + u.displayHeight * 0.38 };
    }

    /** Rosnado/rugido/guincho: riscos grossos saindo da boca de quem usa, em leque na direção do alvo. */
    roar(big = false, color = WHITE) {
        const a = this.mouth;
        const n = big ? 9 : 6;
        for (let k = 0; k < (big ? 3 : 2); k++) {
            this.later(k * 170, () => {
                for (let i = 0; i < n; i++) {
                    const ang = (this.dir > 0 ? 0 : Math.PI) + (i / (n - 1) - 0.5) * 1.5;
                    const r0 = 10 + k * 8;
                    const r1 = (big ? 62 : 46) + k * 8;
                    const g = this.s.add.graphics().setDepth(this.c.depth + 1);
                    const pts = [
                        a.x + Math.cos(ang) * r0,
                        a.y + Math.sin(ang) * r0,
                        a.x + Math.cos(ang) * r1,
                        a.y + Math.sin(ang) * r1,
                    ] as const;
                    g.lineStyle(big ? 8 : 7, 0x000000, 0.55).lineBetween(...pts);
                    g.lineStyle(big ? 5 : 4, color, 1).lineBetween(...pts);
                    this.fade(g, { alpha: 0 }, 320);
                }
            });
        }
        if (big) this.s.cameras.main.shake(320, 0.007);
        return this.hit(260);
    }

    /** Notas musicais (Sing) e corações + beijo (Lovely Kiss). */
    notes(kind: 'music' | 'kiss' = 'music') {
        const a = this.c.from;
        const b = this.to;
        const n = kind === 'music' ? 7 : 4;
        Array.from({ length: n }).forEach((_, i) => {
            this.later(i * 110, () => {
                const t =
                    kind === 'music'
                        ? this.drawIcon(i % 2 ? 'note2' : 'note', a.x, a.y - 10).setScale(1.5)
                        : this.img('heart', a.x, a.y - 10, 0.9, 0xff8fc8, false);
                this.s.tweens.add({
                    targets: t,
                    x: b.x + Phaser.Math.Between(-16, 16),
                    y: b.y - 20 + Phaser.Math.Between(-12, 12),
                    duration: 600,
                    ease: 'Sine.easeInOut',
                    onComplete: () => this.fade(t, { alpha: 0, y: t.y - 16 }, 300),
                });
            });
        });
        if (kind === 'kiss') this.later(650, () => this.icon('lips', 'target'));
        return this.hit(650);
    }

    /** Pó caindo na cabeça do alvo (Sleep Powder, Stun Spore, Spore, Poison Powder). */
    powder(color: number) {
        const t = this.to;
        for (let i = 0; i < 22; i++) {
            this.later(i * 25, () => {
                const x = t.x + Phaser.Math.Between(-22, 22);
                const p = this.s.add.circle(x, t.y - 60, Phaser.Math.Between(2, 3), color, 1).setDepth(this.c.depth);
                this.s.tweens.add({
                    targets: p,
                    y: t.y + Phaser.Math.Between(-10, 14),
                    x: x + Phaser.Math.Between(-8, 8),
                    duration: 600,
                    ease: 'Sine.easeIn',
                    onComplete: () => this.fade(p, { alpha: 0 }, 200),
                });
            });
        }
        return this.hit(600);
    }

    /** Gás/fumaça: nuvens fofas crescendo (lançadas no alvo ou em volta de quem usa). */
    gas(color: number, at: Who = 'target', big = false) {
        const p = at === 'user' ? this.c.from : this.to;
        const travel = at === 'target';
        for (let i = 0; i < (big ? 12 : 8); i++) {
            this.later(i * 50, () => {
                const c = this.s.add
                    .circle(travel ? this.c.from.x : p.x, travel ? this.c.from.y : p.y, 9, color, 0.55)
                    .setDepth(this.c.depth);
                this.s.tweens.add({
                    targets: c,
                    x: p.x + Phaser.Math.Between(-26, 26),
                    y: p.y + Phaser.Math.Between(-18, 14),
                    scale: big ? 3.4 : 2.6,
                    duration: 520,
                    ease: 'Sine.easeOut',
                    onComplete: () => this.fade(c, { alpha: 0 }, 500),
                });
            });
        }
        return travel ? this.hit(480) : 0;
    }

    /** Névoa em área em volta de quem usa (Mist, Haze). */
    mist(color: number) {
        const a = this.c.from;
        for (let i = 0; i < 10; i++) {
            const e = this.s.add
                .ellipse(a.x + Phaser.Math.Between(-60, 60), a.y + Phaser.Math.Between(-20, 30), 70, 30, color, 0)
                .setDepth(this.c.depth - 1);
            this.s.tweens.add({
                targets: e,
                fillAlpha: 0.35,
                duration: 300,
                delay: i * 40,
                yoyo: true,
                hold: 700,
                onComplete: () => e.destroy(),
            });
        }
        return 0;
    }

    // ------------------------------------------------------------ em quem usa
    /** Cresce e volta (Growth) ou encolhe e volta (Minimize). */
    pulse(scale: number, ms = 600) {
        const u = this.c.user;
        this.s.tweens.add({
            targets: u,
            scale: this.c.baseScale * scale,
            duration: ms / 2,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => u.setScale(this.c.baseScale),
        });
        return 0;
    }

    /** Gira no lugar (Fire Spin, Rolling Kick). */
    spin(turns = 2, who: Who = 'user') {
        // giro no eixo vertical (o Pokémon rodopia de frente para trás), como nos jogos: a largura do sprite
        // vai a zero e volta espelhada a cada meia volta
        const sp = who === 'user' ? this.c.user : this.c.target;
        if (!sp) return 0;
        const base = Math.abs(sp.scaleX) || this.c.baseScale;
        const st = { t: 0 };
        this.s.tweens.add({
            targets: st,
            t: turns,
            duration: 320 * turns,
            ease: 'Sine.easeInOut',
            onUpdate: () => sp.setScale(base * Math.cos(st.t * Math.PI * 2), sp.scaleY),
            onComplete: () => sp.setScale(base, sp.scaleY),
        });
        return 0;
    }

    /** Pinta o sprite por um tempo (Rage: vermelho de raiva). */
    tintFlash(who: Who, color: number, ms = 700, delay = 0) {
        const sp = who === 'user' ? this.c.user : this.c.target;
        if (!sp) return 0;
        this.later(delay, () => {
            sp.setTint(color).setTintMode(Phaser.TintModes.MULTIPLY);
            this.later(ms, () => sp.clearTint());
        });
        return 0;
    }

    /** Escudo em volta de quem usa (Harden, Barrier, Acid Armor, Defense Curl…). */
    shield(color: number, shape: 'hex' | 'bubble' = 'hex') {
        const a = this.c.from;
        const g = this.s.add
            .graphics()
            .setDepth(this.c.depth + 1)
            .setPosition(a.x, a.y);
        if (shape === 'bubble') {
            g.fillStyle(color, 0.25).fillCircle(0, 0, 30).lineStyle(3, color, 0.9).strokeCircle(0, 0, 30);
        } else {
            const pts: Pt[] = [];
            for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
                pts.push({ x: Math.cos(ang) * 30, y: Math.sin(ang) * 30 });
            }
            g.fillStyle(color, 0.25).fillPoints(pts as Phaser.Math.Vector2[], true);
            g.lineStyle(3, color, 1).strokePoints(pts as Phaser.Math.Vector2[], true);
        }
        g.setScale(0.2);
        this.s.tweens.add({ targets: g, scale: 1, duration: 220, ease: 'Back.easeOut' });
        this.fade(g, { alpha: 0 }, 400, 600);
        return 0;
    }

    /** Parede de luz (Light Screen, Reflect) na frente de quem usa. */
    wall(color: number) {
        const a = this.c.from;
        const r = this.s.add
            .rectangle(a.x + this.dir * 34, a.y, 10, 70, color, 0.45)
            .setStrokeStyle(2, WHITE, 0.9)
            .setDepth(this.c.depth + 1);
        r.setScale(1, 0.1);
        this.s.tweens.add({ targets: r, scaleY: 1, duration: 220, ease: 'Back.easeOut' });
        this.fade(r, { alpha: 0 }, 400, 700);
        return 0;
    }

    /** Clones de quem usa se espalhando e voltando (Double Team). */
    clones() {
        const u = this.c.user;
        for (const dx of [-36, 36, -18, 18]) {
            const c = this.s.add
                .sprite(u.x, u.y, u.texture.key, u.frame.name)
                .setScale(u.scaleX, u.scaleY)
                .setOrigin(u.originX, u.originY)
                .setAlpha(0.55)
                .setDepth(u.depth - 1);
            this.s.tweens.add({
                targets: c,
                x: u.x + dx,
                duration: 160,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut',
                onComplete: () => c.destroy(),
            });
        }
        return 0;
    }

    /** Energia entrando em quem usa (Focus Energy, Recover, Meditate, carga do Solar Beam). */
    absorbIn(color: number, name = 'shine', n = 10, ms = 500) {
        const a = this.c.from;
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2;
            const p = this.img(name, a.x + Math.cos(ang) * 60, a.y + Math.sin(ang) * 44, 0.4, color);
            this.s.tweens.add({
                targets: p,
                x: a.x,
                y: a.y,
                scale: 0.15,
                duration: ms,
                delay: i * 20,
                ease: 'Quad.easeIn',
                onComplete: () => p.destroy(),
            });
        }
        return 0;
    }

    /** Brilho subindo em volta de quem usa (reforço genérico). */
    aura(name = 'shine') {
        const a = this.c.from;
        for (let i = 0; i < 8; i++) {
            const p = this.img(name, a.x + Phaser.Math.Between(-16, 16), a.y + 8, 0.35);
            this.fade(p, { y: a.y - 40 - Phaser.Math.Between(0, 20), alpha: 0 }, 600 + i * 50);
        }
        const ring = this.s.add
            .ellipse(a.x, a.y + 10, 40, 14)
            .setStrokeStyle(3, this.c.color, 1)
            .setDepth(this.c.depth - 1);
        this.fade(ring, { scale: 2, alpha: 0 }, 600);
        return 0;
    }

    /** Espadas girando em volta de quem usa (Swords Dance). */
    orbit(name = 'sword', n = 4) {
        const a = this.c.from;
        const items = Array.from({ length: n }, () => this.img(name, a.x, a.y, 0.5, null, false));
        const st = { t: 0 };
        this.s.tweens.add({
            targets: st,
            t: 1,
            duration: 900,
            onUpdate: () => {
                items.forEach((it, i) => {
                    const ang = st.t * Math.PI * 4 + (i / n) * Math.PI * 2;
                    it.setPosition(a.x + Math.cos(ang) * 34, a.y + Math.sin(ang) * 18);
                    it.setAngle((ang * 180) / Math.PI + 90);
                });
            },
            onComplete: () => {
                for (const it of items) this.fade(it, { alpha: 0 }, 160);
            },
        });
        return 0;
    }

    /**
     * Ícones desenhados (nada de emoji): beijo, tontura, língua, dedo, colher, boneco, zzz, interrogação, notas.
     * Tamanho ~32 px, com contorno escuro para ler em cima de qualquer Pokémon.
     */
    drawIcon(kind: IconKind, x: number, y: number) {
        const g = this.s.add
            .graphics()
            .setDepth(this.c.depth + 3)
            .setPosition(x, y);
        const ink = 0x1a1020;
        switch (kind) {
            case 'lips':
                g.fillStyle(0xff3f6c, 1)
                    .fillEllipse(-6, -3, 16, 10)
                    .fillEllipse(6, -3, 16, 10)
                    .fillEllipse(0, 4, 26, 10);
                g.lineStyle(2, ink, 1).strokeEllipse(0, 1, 30, 18).lineBetween(-12, 1, 12, 1);
                break;
            case 'dizzy':
                for (let k = 0; k < 3; k++) {
                    const ang = (k / 3) * Math.PI * 2;
                    starPoints(g, Math.cos(ang) * 14, Math.sin(ang) * 6, 6, 0xffe14d, ink);
                }
                break;
            case 'tongue':
                g.fillStyle(0xff7aa8, 1).fillRoundedRect(-8, -12, 16, 26, 8);
                g.lineStyle(2, ink, 1).strokeRoundedRect(-8, -12, 16, 26, 8).lineBetween(0, -6, 0, 8);
                break;
            case 'finger':
                g.fillStyle(0xfff0dc, 1).fillRoundedRect(-9, -2, 18, 16, 4).fillRoundedRect(-3, -20, 7, 22, 3);
                g.lineStyle(2, ink, 1).strokeRoundedRect(-9, -2, 18, 16, 4).strokeRoundedRect(-3, -20, 7, 22, 3);
                break;
            case 'spoon':
                g.fillStyle(0xd8dde8, 1).fillEllipse(0, -10, 12, 16).fillRect(-2, -2, 4, 22);
                g.lineStyle(2, ink, 1).strokeEllipse(0, -10, 12, 16).strokeRect(-2, -2, 4, 22);
                break;
            case 'doll':
                g.fillStyle(0xd9a466, 1).fillCircle(-7, -14, 4).fillCircle(7, -14, 4).fillCircle(0, -8, 9);
                g.fillEllipse(0, 10, 18, 20);
                g.lineStyle(2, ink, 1).strokeCircle(0, -8, 9).strokeEllipse(0, 10, 18, 20);
                g.fillStyle(ink, 1).fillCircle(-3, -9, 1.6).fillCircle(3, -9, 1.6);
                break;
            case 'zzz':
                for (const [dx, dy, sz] of [
                    [-8, 8, 10],
                    [2, -2, 8],
                    [10, -11, 6],
                ] as const) {
                    g.lineStyle(5, ink, 0.6).strokePoints(zPoints(dx, dy, sz) as Phaser.Math.Vector2[]);
                    g.lineStyle(3, 0xbfe8ff, 1).strokePoints(zPoints(dx, dy, sz) as Phaser.Math.Vector2[]);
                }
                break;
            case 'question':
                g.lineStyle(7, ink, 0.6)
                    .beginPath()
                    .arc(0, -8, 8, Math.PI, Math.PI * 2.4)
                    .strokePath();
                g.lineStyle(4, WHITE, 1)
                    .beginPath()
                    .arc(0, -8, 8, Math.PI, Math.PI * 2.4)
                    .strokePath();
                g.lineBetween(3, 0, 0, 6);
                g.fillStyle(WHITE, 1).fillCircle(0, 13, 2.6);
                break;
            case 'note':
            case 'note2':
                g.fillStyle(WHITE, 1).fillEllipse(-4, 8, 10, 7);
                g.lineStyle(3, WHITE, 1).lineBetween(1, 8, 1, -12);
                if (kind === 'note2')
                    g.fillEllipse(10, 4, 10, 7).lineBetween(15, 4, 15, -15).lineBetween(1, -12, 15, -15);
                else g.lineBetween(1, -12, 8, -6);
                break;
        }
        return g;
    }

    /** Ícone aparecendo em cima de alguém (desenhado ou partícula do Showdown). */
    icon(what: IconKind | string, who: Who, o: { wag?: boolean; bend?: boolean; fx?: boolean; ms?: number } = {}) {
        const p = who === 'user' ? this.c.from : this.to;
        const obj = o.fx
            ? this.img(what, p.x, p.y - 30, 0.6, null, false)
            : this.drawIcon(what as IconKind, p.x, p.y - 30);
        const full = o.fx ? 0.6 : 1.6;
        obj.setScale(0.2 * full);
        this.s.tweens.add({ targets: obj, scale: full, y: p.y - 44, duration: 220, ease: 'Back.easeOut' });
        if (o.wag)
            this.s.tweens.add({ targets: obj, angle: { from: -25, to: 25 }, duration: 140, yoyo: true, repeat: 3 });
        if (o.bend) this.s.tweens.add({ targets: obj, angle: 70, duration: 500, delay: 200 });
        this.fade(obj, { alpha: 0 }, 250, o.ms ?? 800);
        return 0;
    }

    /** Olhos piscando em cima do alvo (Glare, Leer). */
    eyes(color: number | null = null) {
        const t = this.to;
        const e = this.img('stare', t.x, t.y - 44, 0.95, color, false);
        this.s.tweens.add({ targets: e, scaleY: 0.02, duration: 90, yoyo: true, repeat: 2, delay: 150 });
        this.fade(e, { alpha: 0 }, 200, 800);
        return this.hit(400);
    }

    /** Espiral girando no alvo (Hypnosis, Gust). */
    spiral(color = 0xd18bff) {
        const t = this.to;
        const g = this.s.add
            .graphics()
            .setDepth(this.c.depth + 1)
            .setPosition(t.x, t.y - 20);
        g.lineStyle(3, color, 1).beginPath();
        for (let i = 0; i <= 60; i++) {
            const ang = i * 0.35;
            const r = i * 0.5;
            if (i === 0) g.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
            else g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        g.strokePath();
        g.setScale(0.2);
        this.s.tweens.add({ targets: g, scale: 1, angle: 720, duration: 900 });
        this.fade(g, { alpha: 0 }, 200, 900);
        return this.hit(500);
    }

    /** Moedas (Pay Day) e estrelas (Swift) arremessadas. */
    shower(kind: 'coins' | 'stars') {
        const a = this.c.from;
        const b = this.to;
        const n = kind === 'coins' ? 9 : 7;
        for (let i = 0; i < n; i++) {
            this.later(i * 55, () => {
                const g = this.s.add.graphics().setDepth(this.c.depth).setPosition(a.x, a.y);
                if (kind === 'coins') {
                    g.fillStyle(0xffd447, 1).fillCircle(0, 0, 6).lineStyle(2, 0xb07a10, 1).strokeCircle(0, 0, 6);
                } else {
                    const pts: Pt[] = [];
                    for (let k = 0; k < 10; k++) {
                        const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
                        const r = k % 2 ? 4 : 9;
                        pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
                    }
                    g.fillStyle(0xfff36b, 1).fillPoints(pts as Phaser.Math.Vector2[], true);
                }
                const prog = { t: 0 };
                const end = { x: b.x + Phaser.Math.Between(-14, 14), y: b.y + Phaser.Math.Between(-12, 12) };
                this.s.tweens.add({
                    targets: prog,
                    t: 1,
                    duration: 420,
                    onUpdate: () => {
                        g.x = a.x + (end.x - a.x) * prog.t;
                        g.y = a.y + (end.y - a.y) * prog.t - Math.sin(prog.t * Math.PI) * (kind === 'coins' ? 40 : 18);
                        g.rotation += 0.3;
                    },
                    onComplete: () => this.fade(g, { alpha: 0 }, 150),
                });
            });
        }
        return this.hit(480);
    }

    /** Brilho de espelho em quem usa (Mirror Move, Mimic). */
    mirror() {
        const a = this.c.from;
        const r = this.s.add
            .rectangle(a.x, a.y - 4, 44, 56, 0xdde8ff, 0.35)
            .setStrokeStyle(2, WHITE, 1)
            .setDepth(this.c.depth + 1);
        const shine = this.s.add
            .rectangle(a.x - 20, a.y - 4, 6, 60, WHITE, 0.9)
            .setAngle(20)
            .setDepth(this.c.depth + 2);
        this.s.tweens.add({ targets: shine, x: a.x + 20, duration: 400, delay: 100 });
        this.fade(shine, { alpha: 0 }, 100, 500);
        this.fade(r, { alpha: 0 }, 300, 600);
        return 0;
    }

    /** Some num brilho (Teleport): o deslocamento de verdade vem do motor. */
    vanish() {
        const u = this.c.user;
        this.absorbIn(0xd18bff, 'shine', 8, 300);
        this.s.tweens.add({
            targets: u,
            alpha: 0,
            scaleX: this.c.baseScale * 0.2,
            duration: 200,
            delay: 250,
            yoyo: true,
            hold: 200,
            onComplete: () => u.setAlpha(1).setScale(this.c.baseScale),
        });
        return 0;
    }

    /** Alvo arremessado para cima e de volta ao chão (Seismic Toss). */
    toss() {
        this.later(160, () => this.c.nudge('target', 0, -80, 560));
        this.later(720, () => {
            this.s.cameras.main.shake(250, 0.01);
            this.ring({ x: this.to.x, y: this.to.y + 14 }, 0x8a5a2b, 3);
        });
        return this.hit(720);
    }

    /** Prende o alvo: anéis apertando em volta (Bind, Wrap, Constrict, String Shot). */
    bind(color: number) {
        const t = this.to;
        for (let i = 0; i < 3; i++) {
            const e = this.s.add
                .ellipse(t.x, t.y - 10 + i * 10, 70, 22)
                .setStrokeStyle(4, color, 1)
                .setDepth(this.c.depth + 1);
            this.s.tweens.add({ targets: e, scaleX: 0.55, duration: 300, delay: 120 + i * 80, ease: 'Quad.easeIn' });
            this.fade(e, { alpha: 0 }, 300, 700);
        }
        return this.hit(420);
    }

    /** Chicote de cipó estalando no alvo (Vine Whip). */
    whip(color = 0x4fae3a, times = 2) {
        const a = this.c.from;
        const b = this.to;
        for (let k = 0; k < times; k++) {
            this.later(k * 220, () => {
                const g = this.s.add.graphics().setDepth(this.c.depth);
                const st = { t: 0 };
                this.s.tweens.add({
                    targets: st,
                    t: 1,
                    duration: 180,
                    yoyo: true,
                    onUpdate: () => {
                        g.clear().lineStyle(5, color, 1);
                        const ex = a.x + (b.x - a.x) * st.t;
                        const ey = a.y + (b.y - a.y) * st.t;
                        new Phaser.Curves.QuadraticBezier(
                            new Phaser.Math.Vector2(a.x, a.y),
                            new Phaser.Math.Vector2((a.x + ex) / 2, Math.min(a.y, ey) - 40 * (k % 2 ? -1 : 1)),
                            new Phaser.Math.Vector2(ex, ey),
                        ).draw(g, 16);
                    },
                    onComplete: () => g.destroy(),
                });
                this.later(180, () => this.c.onHit(b.x, b.y));
            });
        }
        return 180;
    }

    /** Osso batendo (Bone Club) ou indo e voltando (Bonemerang). */
    bone(boomerang: boolean) {
        const a = this.c.from;
        const b = this.to;
        const p = this.img('bone', a.x, a.y, 0.9, null, false);
        this.s.tweens.add({
            targets: p,
            x: b.x,
            y: b.y - (boomerang ? 30 : 0),
            angle: 720,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.c.onHit(b.x, b.y);
                if (!boomerang) {
                    this.fade(p, { alpha: 0 }, 150);
                    return;
                }
                this.s.tweens.add({
                    targets: p,
                    x: a.x,
                    y: a.y + 20,
                    angle: 1440,
                    duration: 320,
                    onComplete: () => p.destroy(),
                });
            },
        });
        return 300;
    }

    /** Areia jogada no rosto do alvo (Sand Attack). */
    sand() {
        const a = this.c.from;
        const b = this.to;
        for (let i = 0; i < 26; i++) {
            this.later(i * 12, () => {
                const g = this.s.add
                    .circle(a.x, a.y + 6, Phaser.Math.Between(1, 3), 0xd9b56b, 1)
                    .setDepth(this.c.depth);
                this.s.tweens.add({
                    targets: g,
                    x: b.x + Phaser.Math.Between(-16, 16),
                    y: b.y - 10 + Phaser.Math.Between(-12, 12),
                    duration: 260,
                    onComplete: () => this.fade(g, { alpha: 0 }, 120),
                });
            });
        }
        return this.hit(300);
    }

    /** Ovo aparecendo e curando (Soft-Boiled). */
    egg() {
        const a = this.c.from;
        const g = this.s.add
            .graphics()
            .setDepth(this.c.depth + 2)
            .setPosition(a.x, a.y - 44);
        g.fillStyle(WHITE, 1)
            .fillEllipse(0, 0, 18, 24)
            .fillStyle(0xff8fc8, 1)
            .fillCircle(-3, -3, 2)
            .fillCircle(4, 4, 2);
        g.lineStyle(2, 0x000000, 0.7).strokeEllipse(0, 0, 18, 24);
        g.setScale(0.2);
        this.s.tweens.add({ targets: g, scale: 1.2, duration: 240, ease: 'Back.easeOut' });
        this.fade(g, { alpha: 0, y: a.y - 60 }, 300, 600);
        this.later(400, () => this.aura('shine'));
        return 0;
    }

    /** Clarão na tela inteira (Flash). */
    flash() {
        this.s.cameras.main.flash(500, 255, 255, 255, true);
        return this.hit(120);
    }

    /** Riscos de velocidade + arrancada (Quick Attack). */
    dash() {
        const a = this.c.from;
        for (let i = 0; i < 5; i++) {
            const g = this.s.add.graphics().setDepth(this.c.depth);
            g.lineStyle(3, WHITE, 0.9).lineBetween(
                a.x - this.dir * 50,
                a.y - 12 + i * 6,
                a.x - this.dir * 14,
                a.y - 12 + i * 6,
            );
            this.fade(g, { alpha: 0, x: this.dir * 30 }, 260, i * 20);
        }
        this.c.nudge('user', this.dir * 26, 0, 200);
        return this.c.target ? this.strike(['impact'], { scale: 0.6, tint: WHITE }) : 0;
    }

    /** Onda d'água varrendo até o alvo (Surf). */
    /** Estrela de fogo grande girando no alvo (o Fire Blast do Arcanine no golpe máximo). */
    fireStar() {
        const at = this.to;
        const g = this.s.add.graphics().setDepth(this.c.depth + 1);
        g.setPosition(at.x, at.y).setScale(0.3).setBlendMode(Phaser.BlendModes.ADD);
        starPoints(g, 0, 0, 26, 0xff8a3d, 0xffe08a);
        this.s.tweens.add({
            targets: g,
            scale: 2.4,
            angle: 72,
            alpha: 0,
            duration: 720,
            ease: 'Quad.easeOut',
            onComplete: () => g.destroy(),
        });
        return 0;
    }

    /** O Snorlax deita na frente do gol (a defesa máxima dele): uma cópia do sprite, deitada e roncando. */
    lieDown() {
        const u = this.c.user;
        const body = this.s.add
            .sprite(u.x, u.y - 6, u.texture.key, u.frame.name)
            .setDepth(this.c.depth)
            .setScale(this.c.baseScale * 1.5);
        this.s.tweens.add({ targets: body, angle: 90, y: u.y + 2, duration: 280, ease: 'Back.easeOut' });
        this.s.tweens.add({
            targets: body,
            scaleY: this.c.baseScale * 1.62,
            duration: 700,
            yoyo: true,
            repeat: 1,
            delay: 300,
        });
        this.later(1700, () => this.fade(body, { alpha: 0 }, 300));
        this.icon('zzz', 'user', { ms: 1600 });
        this.later(150, () => this.ring({ x: u.x, y: u.y }, 0xbfe8ff, 3.2, 520, 5));
        return 300;
    }

    surf() {
        const a = this.c.from;
        const b = this.to;
        const wave = this.s.add.graphics().setDepth(this.c.depth).setPosition(a.x, a.y);
        wave.fillStyle(0x3a8ee6, 0.7).fillEllipse(0, 0, 50, 110);
        wave.fillStyle(0xbfe8ff, 0.9).fillEllipse(this.dir * 14, -6, 14, 96);
        wave.setScale(0.6);
        this.s.tweens.add({
            targets: wave,
            x: b.x + this.dir * 20,
            y: b.y,
            scale: 1.2,
            duration: 560,
            ease: 'Sine.easeIn',
        });
        this.fade(wave, { alpha: 0 }, 220, 560);
        for (let i = 0; i < 10; i++) {
            this.later(i * 50, () => {
                const d = this.img('waterwisp', a.x, a.y, 0.5, 0x9fd8ff);
                this.fade(
                    d,
                    { x: b.x + Phaser.Math.Between(-20, 20), y: b.y + Phaser.Math.Between(-40, 40), alpha: 0 },
                    500,
                );
            });
        }
        return this.hit(520);
    }

    /** Pulinho espirrando água (Splash). */
    splash() {
        const a = this.c.from;
        this.c.nudge('user', 0, -20, 300);
        for (let i = 0; i < 8; i++) {
            const d = this.img('waterwisp', a.x, a.y + 10, 0.4, 0x6fc3ff);
            this.fade(
                d,
                { x: a.x + Phaser.Math.Between(-30, 30), y: a.y - Phaser.Math.Between(10, 40), alpha: 0 },
                500,
            );
        }
        return 0;
    }
}

type Recipe = { style: FxStyle; run: (k: Kit) => number };
const R = (style: FxStyle, run: (k: Kit) => number): Recipe => ({ style, run });
const punch = (sparks?: string, tint?: number) => (k: Kit) =>
    k.strike(['fist'], { sparks, tint: tint ?? null, scale: 0.9 });
const kick =
    (count = 1, scale = 0.8) =>
    (k: Kit) =>
        k.strike(['foot'], { count, scale });

/** Receita de cada golpe. Os que não estão aqui caem no padrão do efeito (físico, especial, reforço…). */
const MOVE_FX: Record<string, Recipe> = {
    // Inseto
    leechlife: R('stream', (k) => {
        k.bite();
        return k.stream({ name: 'energyball', count: 8, scale: 0.35, reverse: true, tint: 0xff5a5a });
    }),
    pinmissile: R('stream', (k) =>
        k.projectile({ name: 'caltrop', count: 5, gap: 70, scale: 0.6, ms: 260, tint: null, spread: 10 }),
    ),
    twineedle: R('stream', (k) =>
        k.projectile({ name: 'poisoncaltrop', count: 2, gap: 120, scale: 0.65, ms: 260, tint: null }),
    ),
    stringshot: R('projectile', (k) => {
        k.stream({ name: 'web', count: 8, scale: 0.35, tint: WHITE });
        return k.bind(0xf0f0f0);
    }),
    // Sombrio / Dragão
    bite: R('melee', (k) => k.bite()),
    dragonrage: R('beam', (k) => k.beam('dragon')),
    // Elétrico
    thunder: R('sky', (k) => k.sky('bolt', true)),
    thunderpunch: R('melee', punch('lightning', 0xfff36b)),
    thundershock: R('projectile', (k) => k.projectile({ name: 'electroball', scale: 0.6, ms: 260 })),
    thunderwave: R('sound', (k) => k.shockwave('user', { color: 0xfff36b, rings: 4, travel: true })),
    thunderbolt: R('beam', (k) => k.beam('bolt')),
    // Lutador
    counter: R('melee', (k) => {
        k.shield(0xff9a5c);
        return k.strike(['fist'], { scale: 1 });
    }),
    doublekick: R('melee', kick(2)),
    highjumpkick: R('melee', (k) => {
        k.c.nudge('user', 0, -30, 300);
        return k.strike(['foot'], { scale: 1.1 });
    }),
    jumpkick: R('melee', (k) => {
        k.c.nudge('user', 0, -20, 260);
        return k.strike(['foot'], { scale: 0.95 });
    }),
    karatechop: R('melee', (k) => k.strike(['leftchop'], { scale: 0.5 })),
    lowkick: R('melee', kick(1, 0.75)),
    rollingkick: R('melee', (k) => {
        k.spin(1);
        return k.strike(['foot'], { scale: 0.9 });
    }),
    seismictoss: R('melee', (k) => k.toss()),
    submission: R('melee', (k) => {
        k.strike(['fist', 'foot'], { count: 2, scale: 0.8 });
        return k.toss();
    }),
    // Fogo
    ember: R('stream', (k) => k.stream({ name: 'fireball', count: 6, scale: 0.6, grow: 1.4 })),
    fireblast: R('explosion', (k) => {
        const t = k.projectile({ name: 'fireball', scale: 1.6, ms: 420 });
        k.later(420, () => k.explosion({ at: 'target', size: 4.5, color: 0xff6b3d }));
        return t;
    }),
    firepunch: R('melee', punch('fireball', 0xff8a5c)),
    firespin: R('stream', (k) => {
        k.spin(2);
        k.later(300, () => k.bind(0xff6b3d));
        return k.stream({ name: 'fireball', count: 10, scale: 0.6 });
    }),
    flamethrower: R('stream', (k) => k.stream({ name: 'fireball', count: 14, scale: 0.85, grow: 1.8 })),
    // Voador
    drillpeck: R('melee', (k) => {
        k.spin(2);
        return k.strike(['hitmarker'], { count: 3, gap: 90, scale: 0.6 });
    }),
    fly: R('sky', (k) => {
        k.c.nudge('user', 0, -120, 500);
        k.later(450, () => k.sky('dive'));
        return 680;
    }),
    gust: R('projectile', (k) => {
        k.spiral(0xcfe8ff);
        return k.projectile({ name: 'wisp', scale: 0.7, ms: 360, spin: 0.4, tint: 0xe8f4ff });
    }),
    mirrormove: R('aura', (k) => k.mirror()),
    peck: R('melee', (k) => k.strike(['hitmarker'], { scale: 0.6 })),
    skyattack: R('sky', (k) => {
        k.absorbIn(WHITE, 'shine', 10, 400);
        k.c.nudge('user', 0, -120, 600);
        k.later(500, () => k.sky('dive'));
        return 720;
    }),
    wingattack: R('melee', (k) => {
        k.slash(2, { big: true, color: 0xe8f4ff });
        return k.strike(['impact'], { scale: 0.6, tint: 0xe8f4ff });
    }),
    // Fantasma
    confuseray: R('projectile', (k) => k.projectile({ name: 'mistball', scale: 0.6, tint: 0xffe14d, trail: true })),
    lick: R('melee', (k) => {
        k.icon('tongue', 'target', { ms: 500 });
        return k.hit(260);
    }),
    nightshade: R('beam', (k) => k.beam('shadow')),
    // Planta
    absorb: R('stream', (k) => {
        k.hit(80);
        return k.stream({ name: 'energyball', count: 8, scale: 0.35, reverse: true, tint: 0x7dff6a });
    }),
    leechseed: R('projectile', (k) => {
        const t = k.projectile({
            name: 'energyball',
            count: 3,
            gap: 80,
            scale: 0.3,
            arc: 40,
            tint: 0x8bd44f,
            spread: 12,
        });
        k.later(t + 100, () => k.bind(0x4fae3a));
        return t;
    }),
    megadrain: R('stream', (k) => {
        k.hit(80);
        k.stream({ name: 'energyball', count: 14, scale: 0.45, reverse: true, tint: 0x7dff6a });
        k.later(500, () => k.aura('shine'));
        return 80;
    }),
    petaldance: R('stream', (k) => {
        k.spin(1);
        return k.stream({ name: 'petal', count: 18, scale: 0.6, tint: null, jitter: 16 });
    }),
    razorleaf: R('stream', (k) => k.stream({ name: 'leaf1', count: 14, scale: 0.6, tint: null, jitter: 12 })),
    sleeppowder: R('cloud', (k) => k.powder(0x9fe870)),
    solarbeam: R('beam', (k) => k.beam('solar')),
    spore: R('cloud', (k) => k.powder(0xc8ff9a)),
    stunspore: R('cloud', (k) => k.powder(0xffe14d)),
    vinewhip: R('melee', (k) => k.whip()),
    // Terrestre
    boneclub: R('melee', (k) => k.bone(false)),
    bonemerang: R('projectile', (k) => k.bone(true)),
    dig: R('quake', (k) => k.quake()),
    earthquake: R('quake', (k) => k.quake()),
    fissure: R('quake', (k) => k.quake(true)),
    sandattack: R('projectile', (k) => k.sand()),
    // Gelo
    aurorabeam: R('beam', (k) => k.beam('laser')),
    blizzard: R('sky', (k) => k.sky('snow', true)),
    haze: R('cloud', (k) => k.mist(0xd8e8ff)),
    icebeam: R('beam', (k) => k.beam('ice')),
    icepunch: R('melee', punch('icicle', 0xbff4ff)),
    mist: R('cloud', (k) => k.mist(0xf0f8ff)),
    // Normal
    barrage: R('projectile', (k) =>
        k.projectile({ name: 'energyball', count: 4, gap: 90, scale: 0.4, arc: 30, tint: 0xffe8a0 }),
    ),
    cometpunch: R('melee', (k) => k.strike(['fist'], { count: 4, gap: 110, scale: 0.75 })),
    constrict: R('melee', (k) => k.bind(0xc79a6a)),
    conversion: R('aura', (k) => {
        k.absorbIn(WHITE, 'rainbow', 6, 500);
        k.later(500, () => k.tintFlash('user', 0x9be7ff, 500));
        return 0;
    }),
    cut: R('melee', (k) => k.slash(1, { big: true })),
    defensecurl: R('aura', (k) => {
        k.pulse(0.85, 400);
        return k.shield(WHITE, 'bubble');
    }),
    dizzypunch: R('melee', (k) => {
        k.strike(['fist'], { scale: 0.9 });
        k.later(300, () => k.icon('dizzy', 'target'));
        return 140;
    }),
    doubleslap: R('melee', (k) => k.strike(['leftchop', 'rightchop'], { count: 2, scale: 0.45, gap: 150 })),
    doubleteam: R('aura', (k) => k.clones()),
    explosion: R('explosion', (k) => {
        k.explosion({ at: 'user', size: 7 });
        k.later(120, () => k.explosion({ at: 'user', size: 5, color: 0xffe14d }));
        return k.hit(150);
    }),
    flash: R('aura', (k) => k.flash()),
    focusenergy: R('aura', (k) => k.absorbIn(0xff9a5c, 'shine', 12, 600)),
    furyattack: R('melee', (k) => k.slash(3, { gap: 100 })),
    furyswipes: R('melee', (k) => k.slash(3, { claws: true, gap: 100 })),
    glare: R('beam', (k) => k.eyes(null)),
    growl: R('sound', (k) => k.roar(false)),
    growth: R('aura', (k) => {
        k.aura('leaf1');
        return k.pulse(1.35, 700);
    }),
    guillotine: R('melee', (k) => {
        k.slash(2, { big: true });
        return k.strike(['leftclaw', 'rightclaw'], { count: 2, gap: 80, scale: 0.6 });
    }),
    harden: R('aura', (k) => k.shield(0xc8cde8)),
    hyperbeam: R('beam', (k) => k.beam('hyper')),
    hyperfang: R('melee', (k) => k.bite(true)),
    leer: R('aura', (k) => k.eyes(0xff4040)),
    lovelykiss: R('sound', (k) => k.notes('kiss')),
    megakick: R('melee', kick(1, 1.15)),
    megapunch: R('melee', (k) => k.strike(['fist'], { scale: 1.15 })),
    metronome: R('aura', (k) => k.icon('finger', 'user', { wag: true, ms: 900 })),
    mimic: R('aura', (k) => k.mirror()),
    minimize: R('aura', (k) => k.pulse(0.45, 700)),
    payday: R('projectile', (k) => k.shower('coins')),
    quickattack: R('aura', (k) => k.dash()),
    rage: R('aura', (k) => {
        k.icon('angry', 'user', { fx: true });
        return k.tintFlash('user', 0xff5a4a, 1200);
    }),
    razorwind: R('projectile', (k) => {
        k.stream({ name: 'wisp', count: 8, scale: 0.5, tint: 0xe8f4ff });
        return k.slash(2, { big: true, gap: 90 });
    }),
    recover: R('aura', (k) => k.absorbIn(0x9be7ff, 'shine', 12, 600)),
    roar: R('sound', (k) => k.roar(true)),
    scratch: R('melee', (k) => k.slash(1, { claws: true })),
    screech: R('sound', (k) => {
        k.roar(false, 0xff8fc8);
        return k.shockwave('user', { color: 0xff8fc8, rings: 3 });
    }),
    selfdestruct: R('explosion', (k) => {
        k.explosion({ at: 'user', size: 5.5 });
        return k.hit(120);
    }),
    sharpen: R('aura', (k) => k.aura('sword')),
    sing: R('sound', (k) => k.notes('music')),
    slash: R('melee', (k) => k.slash(1, { big: true })),
    smokescreen: R('cloud', (k) => k.gas(0x6a6a6a, 'target', true)),
    softboiled: R('aura', (k) => k.egg()),
    sonicboom: R('explosion', (k) => k.shockwave('user', { color: WHITE, rings: 3, travel: true, big: true })),
    spikecannon: R('stream', (k) =>
        k.projectile({ name: 'caltrop', count: 5, gap: 70, scale: 0.6, tint: null, ms: 240, spread: 8 }),
    ),
    splash: R('aura', (k) => k.splash()),
    substitute: R('aura', (k) => {
        k.icon('doll', 'user', { ms: 900 });
        return k.shield(0xffd9a0, 'bubble');
    }),
    superfang: R('melee', (k) => k.bite(true)),
    supersonic: R('sound', (k) => k.shockwave('user', { color: 0xc8cde8, rings: 4, travel: true })),
    swift: R('projectile', (k) => k.shower('stars')),
    swordsdance: R('aura', (k) => k.orbit('sword', 4)),
    tailwhip: R('melee', (k) => {
        k.spin(1);
        return k.slash(1, { color: 0xffe8a0 });
    }),
    triattack: R('beam', (k) => k.beam('tri')),
    whirlwind: R('sound', (k) => {
        k.spiral(0xe8f4ff);
        return k.stream({ name: 'wisp', count: 10, scale: 0.5, tint: 0xe8f4ff, jitter: 16 });
    }),
    // Venenoso
    acidarmor: R('aura', (k) => k.shield(0xb15fc4, 'bubble')),
    poisongas: R('cloud', (k) => k.gas(0xa35bd1, 'target', true)),
    poisonpowder: R('cloud', (k) => k.powder(0xc77bff)),
    poisonsting: R('melee', (k) => k.projectile({ name: 'poisoncaltrop', scale: 0.65, ms: 220, tint: null })),
    sludge: R('projectile', (k) => {
        const t = k.projectile({ name: 'poisonwisp', scale: 0.9, arc: 40, ms: 360 });
        k.later(t, () => k.gas(0x7a3a9a, 'target'));
        return t;
    }),
    smog: R('cloud', (k) => k.gas(0x5a4a6a, 'target', true)),
    // Psíquico
    amnesia: R('aura', (k) => {
        k.icon('question', 'user');
        return k.aura('mistball');
    }),
    barrier: R('aura', (k) => k.shield(0x9be7ff)),
    dreameater: R('beam', (k) => {
        k.icon('zzz', 'target', { ms: 400 });
        k.later(200, () => k.stream({ name: 'mistball', count: 10, scale: 0.4, reverse: true, tint: 0xff7ad9 }));
        return k.hit(200);
    }),
    hypnosis: R('sound', (k) => {
        k.projectile({ name: 'mistball', ms: 300, scale: 0.4, tint: 0xd18bff });
        return k.spiral();
    }),
    kinesis: R('aura', (k) => k.icon('spoon', 'user', { bend: true, ms: 900 })),
    lightscreen: R('aura', (k) => k.wall(0xffe14d)),
    meditate: R('aura', (k) => {
        k.absorbIn(0xff7ad9, 'mistball', 8, 700);
        return k.aura('shine');
    }),
    psychic: R('beam', (k) => {
        k.shockwave('target', { color: 0xff7ad9, rings: 3, big: true });
        k.tintFlash('target', 0xff9ae0, 400, 100);
        return k.hit(150);
    }),
    psybeam: R('beam', (k) => k.beam('laser')),
    psywave: R('beam', (k) => k.beam('psywave')),
    reflect: R('aura', (k) => k.wall(0x9be7ff)),
    rest: R('aura', (k) => {
        k.icon('zzz', 'user', { ms: 1200 });
        return k.absorbIn(0x9be7ff, 'shine', 8, 600);
    }),
    teleport: R('aura', (k) => k.vanish()),
    // Pedra
    rockslide: R('sky', (k) => k.sky('rocks', true)),
    rockthrow: R('projectile', (k) => k.projectile({ name: 'rock1', scale: 0.8, arc: 30, tint: null, ms: 360 })),
    // Água
    bubble: R('stream', (k) => k.beam('bubbles')),
    bubblebeam: R('beam', (k) => k.beam('bubbles')),
    surf: R('wave', (k) => k.surf()),

    // Assinaturas do golpe máximo N3 (fase 2, motor 13): uma receita própria por Pokémon (`sig:<efeito>`)
    'sig:hyperbeam': R('beam', (k) => {
        k.absorbIn(0xffa040, 'shine', 10, 360);
        k.later(360, () => {
            k.roar(true, 0xffc070);
            k.beam('hyper');
        });
        k.later(560, () => k.shockwave('target', { color: 0xffa040, rings: 4, big: true }));
        return k.hit(600);
    }),
    'sig:bodyslam': R('melee', (k) => {
        k.c.nudge('user', 0, -70, 360);
        k.later(330, () => {
            k.quake(true);
            k.explosion({ at: 'target', size: 2.5, color: 0xd8c8a0, quiet: true });
            k.icon('dizzy', 'target', { ms: 900 });
        });
        return k.hit(340);
    }),
    'sig:rest': R('aura', (k) => k.lieDown()),
    'sig:fireblast': R('explosion', (k) => {
        const t = k.projectile({ name: 'fireball', scale: 1.8, ms: 420 });
        k.later(420, () => {
            k.fireStar();
            k.explosion({ at: 'target', size: 5, color: 0xff6b3d });
        });
        return t;
    }),
    'sig:blizzard': R('sky', (k) => {
        k.mist(0xdff4ff);
        k.sky('snow', true);
        k.later(300, () => k.shockwave('target', { color: 0xbfe8ff, rings: 3, big: true }));
        return k.hit(400);
    }),
    'sig:hydropump': R('stream', (k) => {
        k.stream({ name: 'waterwisp', count: 12, scale: 0.8, grow: 1.6, gap: 25 });
        k.later(120, () => k.stream({ name: 'waterwisp', count: 12, scale: 0.8, grow: 1.6, gap: 25, jitter: 14 }));
        k.later(200, () => k.surf());
        return k.hit(420);
    }),
    'sig:flamethrower': R('sky', (k) => {
        k.c.nudge('user', 0, -110, 460);
        k.later(230, () => k.stream({ name: 'fireball', count: 16, scale: 0.9, grow: 2 }));
        k.later(420, () => k.sky('dive'));
        return k.hit(640);
    }),
    'sig:thunderbolt': R('beam', (k) => {
        k.sky('bolt', true);
        k.later(180, () => k.beam('bolt'));
        k.later(380, () => k.shockwave('target', { color: 0xffe14d, rings: 3 }));
        return k.hit(400);
    }),
    'sig:dreameater': R('beam', (k) => {
        k.vanish();
        k.later(120, () => k.icon('zzz', 'target', { ms: 900 }));
        k.later(260, () => k.beam('shadow'));
        k.later(420, () => k.stream({ name: 'mistball', count: 10, scale: 0.4, reverse: true, tint: 0xff7ad9 }));
        return k.hit(300);
    }),
    'sig:psychic': R('beam', (k) => {
        k.eyes(0xff7ad9);
        k.spiral(0xff7ad9);
        k.later(250, () => k.shockwave('target', { color: 0xff7ad9, rings: 4, big: true }));
        k.tintFlash('target', 0xff9ae0, 600, 250);
        return k.hit(300);
    }),
    'sig:tsunami': R('wave', (k) => {
        k.roar(true, 0x9be7ff);
        k.later(150, () => {
            k.surf();
            k.sky('water', true);
        });
        k.s.cameras.main.shake(420, 0.008);
        return k.hit(450);
    }),
    'sig:metronome': R('aura', (k) => {
        k.icon('finger', 'user', { wag: true, ms: 900 });
        k.later(450, () => k.aura('shine'));
        return 0;
    }),
    'sig:transform': R('aura', (k) => {
        k.mirror();
        if (k.c.target) k.stream({ name: 'shine', count: 10, scale: 0.4, reverse: true, tint: 0xd18bff });
        k.later(300, () => k.pulse(1.3, 500));
        return 0;
    }),
    waterfall: R('wave', (k) => k.sky('water', true)),
};

/** Estilo (categoria) do golpe: para os filtros do laboratório. */
export function fxStyle(moveId: string, kind: string): FxStyle {
    if (MOVE_FX[moveId]) return MOVE_FX[moveId].style;
    if (kind === 'strike') return 'melee';
    if (kind === 'buff' || kind === 'burst' || kind === 'heal') return 'aura';
    return 'projectile';
}

/** Padrão por efeito, para golpes sem receita própria. */
function fallback(k: Kit, kind: string): number {
    switch (kind) {
        case 'strike':
            return k.strike(['impact'], { scale: 0.7 });
        case 'buff':
        case 'burst':
        case 'heal':
        case 'flavor':
            return k.aura();
        case 'status':
        case 'debuff':
            return k.c.target ? k.projectile({ scale: 0.5, ms: 320 }) : k.aura();
        default:
            return k.c.target ? k.projectile({ scale: k.c.strong ? 0.9 : 0.7, trail: true }) : k.aura();
    }
}

export interface CastOptions {
    scene: Phaser.Scene;
    user: Phaser.GameObjects.Sprite;
    target: Phaser.GameObjects.Sprite | null;
    moveId: string;
    moveType: string;
    /** strike, blast, buff… (src/engine/moves.ts) */
    kind: string;
    strong: boolean;
    depth: number;
    /** Escala normal do sprite (o pulso volta para ela). */
    baseScale: number;
    /** No acerto, além do anel de impacto (a partida usa para repintar o status do alvo). */
    onHit?: (x: number, y: number) => void;
    /** Desloca um sprite por um tempo (na partida a posição vem do motor: usa um deslocamento extra). */
    nudge?: (who: Who, dx: number, dy: number, ms: number) => void;
}

/**
 * O golpe inteiro: pulso e anel de aura em quem usou + a receita do golpe na cor e partícula do tipo + anel de
 * impacto e o alvo piscando em branco. Usado na partida e no laboratório de golpes (?lab=golpes).
 */
export function castMove(o: CastOptions) {
    const { scene, user, target, depth } = o;
    const color = hexToNumber(TYPE_COLOR[o.moveType] ?? '#ffffff');
    if (o.strong) {
        scene.tweens.add({
            targets: user,
            scale: o.baseScale * 1.2,
            duration: 140,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => user.setScale(o.baseScale),
        });
    }
    const ring = scene.add
        .circle(user.x, user.y - 14, 16, color, 0.45)
        .setDepth(depth)
        .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 520, onComplete: () => ring.destroy() });

    const nudge =
        o.nudge ??
        ((who: Who, dx: number, dy: number, ms: number) => {
            const sp = who === 'user' ? user : target;
            if (sp) {
                scene.tweens.add({
                    targets: sp,
                    x: sp.x + dx,
                    y: sp.y + dy,
                    duration: ms / 2,
                    yoyo: true,
                    ease: 'Sine.easeOut',
                });
            }
        });
    const kit = new Kit({
        scene,
        user,
        target,
        from: { x: user.x, y: user.y - 14 },
        to: target ? { x: target.x, y: target.y - 16 } : null,
        color,
        typeFx: FX_BY_TYPE[o.moveType] ?? 'impact',
        depth,
        strong: o.strong,
        baseScale: o.baseScale,
        nudge,
        onHit: (hx, hy) => {
            if (!target) return;
            const hit = scene.add
                .circle(hx, hy, 10)
                .setStrokeStyle(4, color, 1)
                .setDepth(depth + 10);
            scene.tweens.add({ targets: hit, scale: 2.6, alpha: 0, duration: 420, onComplete: () => hit.destroy() });
            scene.cameras.main.shake(120, 0.003);
            target.setTint(WHITE).setTintMode(Phaser.TintModes.FILL);
            scene.time.delayedCall(130, () => {
                target.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
                o.onHit?.(hx, hy);
            });
        },
    });
    const recipe = MOVE_FX[o.moveId];
    if (recipe) recipe.run(kit);
    else fallback(kit, o.kind);
}
