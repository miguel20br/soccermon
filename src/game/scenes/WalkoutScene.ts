import Phaser from 'phaser';
import type { CryStyle } from '../../store/game-store';
import { createSpeciesAnims, footOrigin, preloadSpecies, resolveAnim } from '../animation-manager';
import { playCrowd, playCry, playMax, playSfx } from '../audio';
import { skinOf } from '../skin';
import { type Entry, WALK_MS, WALK_REDUCED_MS, WALK_SKIP_AT, type WalkTier } from '../walkout-plan';

/**
 * Walkout em Phaser (laboratório `?lab=walkout&motor=phaser`, ut-walkout.md §8): estádio de pixel art desenhado por
 * código, holofotes varrendo, fogos e faíscas na cor da edição, câmera com zoom e tremida, as pistas (selo, tipo,
 * posição, placa de rota com a insígnia), a silhueta "Quem é esse Pokémon?", o sprite PMD entrando do jeito dele e a
 * carta girando (3D de mentira: scaleX). O relógio é próprio (`clock`, avança no update): tocar pula pra próxima
 * batida e a gravação quadro a quadro (`game.step`) sai igual toda vez. Avisa a tela por `game.events` ('walkout'):
 * 'skippable' (Pular aparece) e 'done' (Continuar).
 */
export interface WalkoutData {
    tier: WalkTier;
    /** Edição da carta (null = ouro sem edição). */
    edition: 'icone' | 'destaque' | 'shiny' | 'evento' | null;
    speciesId: number;
    shiny: boolean;
    name: string;
    /** Ícone: o título ("Mewtwo Contra-Ataca"), pro letreiro. */
    title?: string;
    overall: number;
    posShort: string;
    posLong: string;
    type: string;
    typeLabel: string;
    typeColor: number;
    editionLabel: string;
    home: string;
    /** A insígnia do ginásio do tipo, já rasterizada (sem ginásio: null, a placa diz só a rota). */
    badge: HTMLCanvasElement | null;
    attrs: { label: string; v: number }[];
    /** Especial que começa prateado e racha pra cor da edição na silhueta. */
    upgrade: boolean;
    reduce: boolean;
    who: string;
    entry: Entry;
    cries: CryStyle;
}

interface Look {
    /** Céu de cima pro horizonte. */
    sky: number[];
    /** Nebulosa: [x, y, raio x, raio y] em fração da tela + cor. */
    blobs?: [number, number, number, number, number][];
    fx: number[];
    beam: number;
}

const LOOKS: Record<string, Look> = {
    ouro: { sky: [0x05040a, 0x1a1206, 0x4a3410], fx: [0xe8c24a, 0xffe9a0, 0xfff6d8], beam: 0xffd76a },
    prata: { sky: [0x05060a, 0x141822, 0x3a4256], fx: [0xc9ced8, 0xffffff, 0x9aa3b5], beam: 0xe4ebf7 },
    shiny: {
        sky: [0x0a0716, 0x2a1d48, 0x5a3f78],
        blobs: [
            [0.2, 0.15, 0.5, 0.18, 0xff8ad0],
            [0.8, 0.25, 0.5, 0.2, 0x8ac8ff],
        ],
        fx: [0xffb3e0, 0xb3dcff, 0xc8ffc8, 0xffe6a8, 0xe0c8ff, 0xffffff],
        beam: 0xffe3f3,
    },
    icone: {
        sky: [0x050314, 0x0b0726, 0x2a1060],
        blobs: [
            [0.2, 0.12, 0.6, 0.2, 0x7850ff],
            [0.75, 0.3, 0.6, 0.2, 0xff50be],
            [0.45, 0.02, 0.4, 0.1, 0xb48cff],
        ],
        fx: [0xb48cff, 0xff50be, 0x7850ff, 0xffffff, 0xffb8f0],
        beam: 0xc8a8ff,
    },
    destaque: {
        sky: [0x000000, 0x111114, 0x2b2b30],
        blobs: [[0.5, 0.3, 0.8, 0.12, 0x6a5418]],
        fx: [0xd9b23c, 0xffe08a, 0xffffff, 0xb8902a],
        beam: 0xffe08a,
    },
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
const mix = (a: number, b: number, t: number) => {
    const [r1, g1, b1] = rgb(a);
    const [r2, g2, b2] = rgb(b);
    return (
        (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t)
    );
};
const FONT = 'Galmuri11, monospace';
const FONT_BIG = 'Galmuri14, monospace';

/** Sorteio com semente (o desenho do estádio e da torcida sai igual em toda gravação). */
function seeded(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

type Fn = () => void;

export class WalkoutScene extends Phaser.Scene {
    private d!: WalkoutData;
    private W = 0;
    private H = 0;
    private look!: Look;
    private finalLook!: Look;
    private clock = 0;
    private queue: { at: number; fn: Fn; beat?: boolean }[] = [];
    private finished = false;
    private world!: Phaser.GameObjects.Layer;
    private hud!: Phaser.GameObjects.Layer;
    private hudCam!: Phaser.Cameras.Scene2D.Camera;
    // estádio
    private y0 = 0;
    private yS = 0;
    private ground = 0;
    private skyLook!: Phaser.GameObjects.Image;
    private dark!: Phaser.GameObjects.Rectangle;
    private crowd!: Phaser.GameObjects.Image;
    private crowdFrame = 0;
    private crowdBeat = 260;
    private crowdAt = 0;
    private lamps: Phaser.GameObjects.Image[] = [];
    private beams: Phaser.GameObjects.Image[] = [];
    private glow!: Phaser.GameObjects.Image;
    private doors: Phaser.GameObjects.Rectangle[] = [];
    private board!: Phaser.GameObjects.Text;
    private flashes!: Phaser.GameObjects.Particles.ParticleEmitter;
    private rain?: Phaser.GameObjects.Particles.ParticleEmitter;
    private sparkle?: Phaser.GameObjects.Particles.ParticleEmitter;
    // Pokémon e carta
    private skin = 0;
    private mon!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Ellipse;
    private pool!: Phaser.GameObjects.Image;
    private rays!: Phaser.GameObjects.Image;
    private card!: Phaser.GameObjects.Container;
    private front: Phaser.GameObjects.GameObject[] = [];
    private back!: Phaser.GameObjects.Image;
    private art!: Phaser.GameObjects.Image;
    private ratingText!: Phaser.GameObjects.Text;
    private shine!: Phaser.Textures.CanvasTexture;
    private shineAt = -1;
    private spin = 0;
    private spinning = false;
    private cardScale = 1;
    /** A arte já entrou na carta (o especial mostra a carta sem foto primeiro). */
    private artShown = false;

    constructor() {
        super('walkout');
    }

    init(data: WalkoutData) {
        this.d = data;
        this.clock = 0;
        this.queue = [];
        this.finished = false;
        this.lamps = [];
        this.beams = [];
        this.doors = [];
        this.front = [];
        this.shineAt = -1;
        this.spin = 0;
        this.spinning = false;
        this.artShown = false;
    }

    preload() {
        this.skin = skinOf(this.d.speciesId, this.d.shiny);
        preloadSpecies(this, this.skin);
        this.load.image('wk-type', `assets/types/${this.d.type.toLowerCase()}.png`);
        this.load.image('wk-art', `assets/cards/${this.d.shiny ? 'shiny/' : ''}${this.d.speciesId}.gif`);
        this.load.svg('wk-symbol', 'assets/ui/simbolo.svg', { width: 40, height: 40 });
    }

    create() {
        const d = this.d;
        this.W = this.scale.width;
        this.H = this.scale.height;
        const { W, H } = this;
        this.y0 = Math.round(H * 0.38);
        this.yS = Math.round(H * 0.58);
        this.ground = Math.round(H * 0.91);
        createSpeciesAnims(this, this.skin);
        // os tweens no relógio da cena (o TweenManager do Phaser 4 conta pelo Date.now): a gravação quadro a quadro
        // (game.step) e o relógio das batidas andam juntos
        let pending = 0;
        this.events.on(Phaser.Scenes.Events.PRE_UPDATE, (_t: number, dt: number) => {
            pending = dt;
        });
        (this.tweens as unknown as { getDelta: () => number }).getDelta = () => {
            const dt = pending;
            pending = 0;
            return dt;
        };
        if (d.badge && !this.textures.exists('wk-badge')) this.textures.addCanvas('wk-badge', d.badge);

        const ed = d.edition === 'evento' ? this.eventLook() : d.edition ? LOOKS[d.edition] : null;
        this.finalLook = d.tier === 'raro' ? LOOKS.ouro : (ed ?? (d.tier === 'muitoraro' ? LOOKS.prata : LOOKS.ouro));
        this.look = d.tier === 'especial' && d.upgrade && !d.reduce ? LOOKS.prata : this.finalLook;

        this.world = this.add.layer();
        this.hud = this.add.layer();
        this.hudCam = this.cameras.add(0, 0, W, H);
        this.cameras.main.ignore(this.hud);
        this.hudCam.ignore(this.world);

        this.makeTextures();
        this.buildStadium();
        this.buildCard();

        if (d.reduce) this.planReduced();
        else if (d.tier === 'raro') this.planRaro();
        else if (d.tier === 'muitoraro') this.planMuitoRaro();
        else this.planEspecial();
        if (!d.reduce) this.at(WALK_SKIP_AT, () => this.emit('skippable'));
    }

    private eventLook(): Look {
        const c = this.d.typeColor;
        return {
            sky: [0x000000, mix(c, 0, 0.75), mix(c, 0, 0.4)],
            blobs: [[0.5, 0.15, 0.7, 0.2, c]],
            fx: [c, mix(c, 0xffffff, 0.5), 0xffffff],
            beam: mix(c, 0xffffff, 0.4),
        };
    }

    private emit(what: 'skippable' | 'done') {
        this.game.events.emit('walkout', what);
    }

    private at(ms: number, fn: Fn, beat = false) {
        this.queue.push({ at: ms, fn, beat });
        this.queue.sort((a, b) => a.at - b.at);
    }

    /** Toque: pula pra próxima batida (as que ficaram no caminho acontecem). */
    tap() {
        if (this.finished) return;
        const next = this.queue.find((e) => e.beat && e.at > this.clock);
        if (next) this.clock = next.at - 1;
    }

    /** Pular: vai direto pra carta pronta, com o grito. */
    skip() {
        if (this.finished) return;
        this.queue = [];
        this.tweens.killAll();
        this.hud.removeAll(true);
        this.rain?.stop();
        const cam = this.cameras.main;
        cam.resetFX();
        cam.setZoom(1).centerOn(this.W / 2, this.H / 2);
        this.look = this.finalLook;
        this.paintSky(this.finalLook, 0);
        this.dark.setAlpha(0.3);
        for (const l of this.lamps) l.setAlpha(1);
        for (const b of this.beams) b.setAlpha(0.3).setTint(this.finalLook.beam);
        this.glow.setAlpha(0);
        for (const door of this.doors) door.setVisible(false);
        this.placeMonFinal();
        this.artShown = true;
        this.showCard(true);
        this.ratingText.setText(String(this.d.overall));
        this.rays.setAlpha(0.22).setTint(this.finalLook.beam);
        this.showBoard();
        playCry(this.d.speciesId, this.d.cries, 0.8);
        playSfx('goal');
        this.finish();
    }

    private finish() {
        this.finished = true;
        this.emit('done');
        // fica vivo: holofotes, faíscas, a carta flutua e brilha de vez em quando
        this.tweens.add({ targets: this.card, y: this.card.y - 2, duration: 1200, yoyo: true, repeat: -1 });
        this.sweepBeams();
        this.shineAt = this.clock;
    }

    update(_t: number, dt: number) {
        this.clock += dt;
        while (this.queue.length && this.queue[0].at <= this.clock) this.queue.shift()?.fn();
        // torcida pulando (2 quadros), mais rápido quando esquenta
        if (!this.d.reduce && this.clock - this.crowdAt >= this.crowdBeat) {
            this.crowdAt = this.clock;
            this.crowdFrame ^= 1;
            this.crowd.setTexture(`wk-crowd-${this.crowdFrame}`);
        }
        if (this.spinning) this.applySpin();
        if (this.shineAt >= 0) this.drawShine();
    }

    // ---------------------------------------------------------------- texturas

    private canvas(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
        if (this.textures.exists(key)) this.textures.remove(key);
        const t = this.textures.createCanvas(key, Math.max(1, w), Math.max(1, h));
        if (!t) return null;
        draw(t.context);
        t.refresh();
        return t;
    }

    /** Degradê vertical em faixas com dithering 4x4 (pixel art, sem borrão). */
    private dither(img: ImageData, x0: number, y0: number, w: number, h: number, stops: number[]) {
        const cols = stops.map(rgb);
        const n = cols.length - 1;
        for (let y = 0; y < h; y++) {
            const p = (y / Math.max(1, h - 1)) * n * 4;
            for (let x = 0; x < w; x++) {
                const q = p / 4;
                const i = Math.min(n - 1, Math.floor(q));
                // 4 sub-faixas entre duas cores; o Bayer decide qual das vizinhas o pixel pega
                const sub = Math.floor((q - i) * 4) / 4;
                const f = (q - i - sub) * 4;
                const t = Math.min(1, sub + (f * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? 0.25 : 0));
                const a = cols[i];
                const b = cols[i + 1];
                const k = ((y0 + y) * img.width + x0 + x) * 4;
                img.data[k] = a[0] + (b[0] - a[0]) * t;
                img.data[k + 1] = a[1] + (b[1] - a[1]) * t;
                img.data[k + 2] = a[2] + (b[2] - a[2]) * t;
                img.data[k + 3] = 255;
            }
        }
    }

    private skyTexture(key: string, look: Look) {
        const { W, H } = this;
        const h = this.y0 + 4;
        const rnd = seeded(7);
        this.canvas(key, W, h, (ctx) => {
            const img = ctx.createImageData(W, h);
            this.dither(img, 0, 0, W, h, look.sky);
            for (const [bx, by, rx, ry, c] of look.blobs ?? []) {
                const [r, g, b] = rgb(c);
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < W; x++) {
                        const dx = (x / W - bx) / rx;
                        const dy = (y / H - by) / ry;
                        const v = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 0.7;
                        if (v * 16 <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
                        const k = (y * W + x) * 4;
                        img.data[k] = (img.data[k] + r) / 2;
                        img.data[k + 1] = (img.data[k + 1] + g) / 2;
                        img.data[k + 2] = (img.data[k + 2] + b) / 2;
                    }
            }
            ctx.putImageData(img, 0, 0);
            for (let i = 0; i < (W * h) / 140; i++) {
                ctx.fillStyle = rnd() < 0.2 ? '#ffffff' : '#9aa0b8';
                ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * (h - 10)), 1, 1);
            }
        });
    }

    private makeTextures() {
        const { W, H } = this;
        this.canvas('wk-px', 2, 2, (c) => {
            c.fillStyle = '#fff';
            c.fillRect(0, 0, 2, 2);
        });
        this.canvas('wk-px1', 1, 1, (c) => {
            c.fillStyle = '#fff';
            c.fillRect(0, 0, 1, 1);
        });
        this.canvas('wk-conf', 2, 4, (c) => {
            c.fillStyle = '#fff';
            c.fillRect(0, 0, 2, 4);
        });
        this.canvas('wk-star', 7, 7, (c) => {
            c.fillStyle = '#fff';
            c.fillRect(3, 0, 1, 7);
            c.fillRect(0, 3, 7, 1);
            c.fillRect(2, 2, 3, 3);
        });
        this.skyTexture('wk-sky-dark', { sky: [0x020205, 0x05060c, 0x0a0c16], fx: [], beam: 0 });
        // cone do holofote: estreito em cima, largo embaixo, some com dithering
        const bl = Math.round(Math.hypot(W, H));
        const bw = Math.max(56, Math.round(W * 0.38));
        this.canvas('wk-beam', bw, bl, (ctx) => {
            for (let y = 0; y < bl; y++) {
                const t = y / bl;
                const half = 1.5 + (bw / 2 - 1.5) * t;
                const a = 0.55 * (1 - t) ** 1.4;
                for (let x = Math.floor(bw / 2 - half); x < Math.ceil(bw / 2 + half); x++) {
                    const edge = 1 - Math.abs(x - bw / 2) / half;
                    const v = a * Math.min(1, edge * 2.5);
                    if (v * 16 < BAYER[(y & 3) * 4 + (x & 3)] * 0.5) continue;
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, v * 1.4).toFixed(3)})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });
        // poça de luz no chão
        this.canvas('wk-pool', 96, 24, (ctx) => {
            for (let y = 0; y < 24; y++)
                for (let x = 0; x < 96; x++) {
                    const dx = (x - 48) / 48;
                    const dy = (y - 12) / 12;
                    const v = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
                    if (v * 16 <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
                    ctx.fillStyle = `rgba(255,255,255,${(0.25 + v * 0.4).toFixed(2)})`;
                    ctx.fillRect(x, y, 1, 1);
                }
        });
        // raios atrás da carta
        const rs = Math.round(Math.max(W, H) * 1.3);
        this.canvas('wk-rays', rs, rs, (ctx) => {
            ctx.translate(rs / 2, rs / 2);
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 16; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, rs / 2, (i * Math.PI) / 8, (i * Math.PI) / 8 + Math.PI / 16);
                ctx.closePath();
                ctx.fill();
            }
        });
        // torcida, 2 quadros (no B uns 40% pulam um pixel e levantam o braço)
        const rnd = seeded(3);
        const heads: { x: number; y: number; s: string; c: string; jump: boolean }[] = [];
        const SKIN = ['#d9a066', '#8f563b', '#eec39a', '#663931', '#c58a5a'];
        const SHIRT = ['#ffcb05', '#3a7bd5', '#e8e8e8', '#e8423f', '#58c26b', '#ffcb05', '#3a7bd5'];
        const tw = 22;
        for (let y = this.y0 + 3; y < this.yS - 4; y += 4)
            for (let x = 1; x < W - 1; x += 3) {
                if (Math.abs(x - W / 2) < tw && y > this.yS - 40) continue; // o túnel
                if ((x + Math.floor(y / 4) * 7) % 37 < 3) continue; // corredor
                if (rnd() < 0.12) continue;
                heads.push({
                    x: x + (rnd() < 0.5 ? 0 : 1),
                    y,
                    s: SKIN[Math.floor(rnd() * SKIN.length)],
                    c: SHIRT[Math.floor(rnd() * SHIRT.length)],
                    jump: rnd() < 0.4,
                });
            }
        for (const f of [0, 1])
            this.canvas(`wk-crowd-${f}`, W, H, (ctx) => {
                for (const h of heads) {
                    const up = f && h.jump ? 1 : 0;
                    ctx.fillStyle = h.c;
                    ctx.fillRect(h.x, h.y + 2 - up, 2, 2);
                    ctx.fillStyle = h.s;
                    ctx.fillRect(h.x, h.y - up, 2, 2);
                    if (up) ctx.fillRect(h.x + (h.x % 2 ? 2 : -1), h.y - 2, 1, 2);
                }
            });
    }

    // ---------------------------------------------------------------- estádio

    private buildStadium() {
        const { W, H, y0, yS, ground } = this;
        const w = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
            this.world.add(o);
            return o;
        };
        w(this.add.image(0, 0, 'wk-sky-dark').setOrigin(0).setDepth(0));
        this.skyTexture('wk-sky-look', this.look);
        this.skyLook = w(
            this.add.image(0, 0, 'wk-sky-look').setOrigin(0).setDepth(1).setAlpha(0),
        ) as Phaser.GameObjects.Image;

        // estádio parado (arquibancada, placas, gramado, linhas, torres, telão)
        this.canvas('wk-stadium', W, H, (ctx) => {
            const img = ctx.createImageData(W, H);
            this.dither(img, 0, y0, W, yS - y0, [0x10131f, 0x1a1f33, 0x232842]);
            // gramado em faixas que engordam com a perspectiva
            let y = yS + 6;
            let k = 0;
            while (y < H) {
                const bh = 3 + k * 2;
                const c = rgb(k % 2 ? 0x2e6b34 : 0x377a3d);
                for (let yy = y; yy < Math.min(H, y + bh); yy++)
                    for (let x = 0; x < W; x++) {
                        const i = (yy * W + x) * 4;
                        img.data.set([c[0], c[1], c[2], 255], i);
                    }
                y += bh;
                k++;
            }
            ctx.putImageData(img, 0, 0);
            // degraus da arquibancada
            ctx.fillStyle = '#2b3150';
            for (let yy = y0 + 1; yy < yS; yy += 4) ctx.fillRect(0, yy, W, 1);
            // teto
            ctx.fillStyle = '#0b0d16';
            ctx.fillRect(0, y0 - 8, W, 7);
            ctx.fillStyle = '#4b5a9a';
            ctx.fillRect(0, y0 - 2, W, 1);
            ctx.fillStyle = '#232d57';
            for (let x = 0; x < W; x += 6) ctx.fillRect(x, y0 - 8, 1, 6);
            // placas de publicidade (LED) na beira do campo
            ctx.fillStyle = '#05060a';
            ctx.fillRect(0, yS, W, 6);
            const ads = ['#ffcb05', '#3a7bd5', '#e8423f', '#58c26b'];
            for (let x = 0, i = 0; x < W; x += 24, i++) {
                ctx.fillStyle = ads[i % 4];
                ctx.fillRect(x + 2, yS + 1, 20, 4);
                ctx.fillStyle = '#05060a';
                for (let xx = x + 4; xx < x + 21; xx += 3) ctx.fillRect(xx, yS + 2, 1, 2);
            }
            // linhas do campo
            ctx.fillStyle = '#e8f0e8';
            ctx.fillRect(0, yS + 9, W, 1);
            const rx = Math.min(W * 0.42, 84);
            const ry = rx * 0.28;
            for (let a = 0; a < Math.PI * 2; a += 0.6 / rx) {
                ctx.fillRect(Math.round(W / 2 + Math.cos(a) * rx), Math.round(ground + Math.sin(a) * ry), 1, 1);
            }
            ctx.fillRect(Math.floor(W / 2), yS + 9, 1, H - yS);
            ctx.fillRect(Math.floor(W / 2) - 1, ground, 3, 1);
            // túnel (portão do ginásio)
            const tx = Math.floor(W / 2 - 20);
            ctx.fillStyle = '#4b5a9a';
            ctx.fillRect(tx - 2, yS - 36, 44, 36);
            ctx.fillStyle = '#05060a';
            ctx.fillRect(tx, yS - 34, 40, 34);
            ctx.fillStyle = '#232d57';
            ctx.fillRect(tx - 2, yS - 40, 44, 4);
            // torres de luz
            for (const px of [8, W - 10]) {
                ctx.fillStyle = '#1d2133';
                ctx.fillRect(px, 20, 2, yS - 20);
                ctx.fillStyle = '#2b3150';
                ctx.fillRect(px - 7, 12, 16, 10);
                ctx.fillStyle = '#4a4f60';
                for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ctx.fillRect(px - 6 + i * 4, 13 + j * 4, 3, 3);
            }
            // telão
            const bw = Math.min(W - 44, 150);
            const by = Math.round(y0 * 0.42);
            ctx.fillStyle = '#1d2133';
            ctx.fillRect(Math.floor(W / 2 - bw / 4), by + 11, 2, y0 - by - 19);
            ctx.fillRect(Math.floor(W / 2 + bw / 4), by + 11, 2, y0 - by - 19);
            ctx.fillStyle = '#4b5a9a';
            ctx.fillRect(Math.floor(W / 2 - bw / 2) - 1, by - 12, bw + 2, 24);
            ctx.fillStyle = '#05060a';
            ctx.fillRect(Math.floor(W / 2 - bw / 2), by - 11, bw, 22);
            ctx.fillStyle = '#0d1020';
            for (let x = Math.floor(W / 2 - bw / 2); x < W / 2 + bw / 2; x += 2)
                for (let yy = by - 11; yy < by + 11; yy += 2) ctx.fillRect(x, yy, 1, 1);
        });
        // a luz do fim do túnel (atrás da silhueta) e as portas
        this.canvas('wk-glow', 40, 34, (ctx) => {
            for (let y = 0; y < 34; y++)
                for (let x = 0; x < 40; x++) {
                    const v = 1 - Math.hypot((x - 20) / 22, (y - 30) / 30);
                    if (v * 16 <= BAYER[(y & 3) * 4 + (x & 3)] * 0.8) continue;
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.3 + v).toFixed(2)})`;
                    ctx.fillRect(x, y, 1, 1);
                }
        });
        this.glow = w(
            this.add
                .image(W / 2, yS, 'wk-glow')
                .setOrigin(0.5, 1)
                .setDepth(8)
                .setAlpha(0)
                .setTint(this.look.beam)
                .setBlendMode(Phaser.BlendModes.ADD),
        ) as Phaser.GameObjects.Image;
        w(this.add.image(0, 0, 'wk-stadium').setOrigin(0).setDepth(4));
        this.crowd = w(this.add.image(0, 0, 'wk-crowd-0').setOrigin(0).setDepth(5)) as Phaser.GameObjects.Image;
        // escuro por cima do estádio (o céu escurece pela troca de textura)
        this.dark = w(
            this.add
                .rectangle(0, y0 - 10, W, H - y0 + 10, 0x000000, 1)
                .setOrigin(0)
                .setDepth(7),
        ) as Phaser.GameObjects.Rectangle;
        for (const side of [-1, 1]) {
            const door = this.add
                .rectangle(W / 2 + side * 10, yS - 17, 20, 34, 0x0a0b10)
                .setStrokeStyle(1, 0x1d2133)
                .setDepth(9);
            this.doors.push(w(door) as Phaser.GameObjects.Rectangle);
        }
        // lâmpadas acesas das torres
        for (const px of [8, W - 10]) {
            const key = `wk-lamp-${px}`;
            this.canvas(key, 18, 12, (ctx) => {
                ctx.fillStyle = '#fffbe0';
                for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ctx.fillRect(1 + i * 4, 1 + j * 4, 3, 3);
            });
            this.lamps.push(
                w(
                    this.add
                        .image(px - 7, 12, key)
                        .setOrigin(0)
                        .setDepth(8)
                        .setAlpha(0),
                ) as Phaser.GameObjects.Image,
            );
        }
        // flashes de câmera na torcida
        this.flashes = this.add.particles(0, 0, 'wk-px1', {
            x: { min: 2, max: W - 2 },
            y: { min: y0 + 2, max: yS - 4 },
            lifespan: 90,
            frequency: -1,
            alpha: { start: 1, end: 0 },
            blendMode: Phaser.BlendModes.ADD,
        });
        this.flashes.setDepth(8);
        w(this.flashes);
        // telão
        const by = Math.round(y0 * 0.42);
        this.board = w(
            this.add
                .text(W / 2, by, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '11px', color: '#ffcb05' })
                .setOrigin(0.5)
                .setDepth(6),
        ) as Phaser.GameObjects.Text;
        // Pokémon
        this.pool = w(
            this.add
                .image(W / 2, ground, 'wk-pool')
                .setDepth(10)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD),
        ) as Phaser.GameObjects.Image;
        this.shadow = w(
            this.add
                .ellipse(W / 2, ground, 34, 8, 0x000000, 0.4)
                .setDepth(12.5)
                .setVisible(false),
        ) as Phaser.GameObjects.Ellipse;
        this.mon = w(
            this.add
                .sprite(W / 2, yS - 2, `pmd-${this.skin}`)
                .setDepth(13)
                .setVisible(false),
        ) as Phaser.GameObjects.Sprite;
        this.rays = w(
            this.add
                .image(W / 2, Math.round(H * 0.45), 'wk-rays')
                .setDepth(11)
                .setAlpha(0)
                .setTint(this.finalLook.beam)
                .setBlendMode(Phaser.BlendModes.ADD),
        ) as Phaser.GameObjects.Image;
    }

    private play(anim: string, dir = 0, speed = 1) {
        const a = resolveAnim(this.skin, anim);
        const key = `${this.skin}/${a}/${dir}`;
        if (!this.anims.exists(key)) return;
        this.mon.play(key);
        this.mon.anims.timeScale = speed;
        this.mon.setOrigin(0.5, footOrigin(this.skin, a));
    }

    private paintSky(look: Look, ms: number) {
        this.skyTexture('wk-sky-look', look);
        this.skyLook.setTexture('wk-sky-look');
        if (ms) {
            this.skyLook.setAlpha(0);
            this.tweens.add({ targets: this.skyLook, alpha: 1, duration: ms });
        } else this.skyLook.setAlpha(1);
    }

    private addBeam(x: number, y: number, aim: number, sweep: number, delay: number) {
        const b = this.add
            .image(x, y, 'wk-beam')
            .setOrigin(0.5, 0)
            .setRotation(aim)
            .setDepth(9)
            .setAlpha(0)
            .setTint(this.look.beam)
            .setBlendMode(Phaser.BlendModes.ADD);
        b.setData('aim', aim).setData('sweep', sweep).setData('delay', delay);
        this.world.add(b);
        this.beams.push(b);
        return b;
    }

    /** Holofote acende com um "clank" e começa a varrer. */
    private lightBeam(b: Phaser.GameObjects.Image, alpha = 0.32) {
        playSfx('post', 0.55 + Math.random() * 0.1);
        b.setAlpha(alpha + 0.25);
        this.tweens.add({ targets: b, alpha, duration: 260 });
        this.tweens.add({
            targets: b,
            rotation: b.getData('aim') + b.getData('sweep'),
            duration: 1500 + b.getData('delay'),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private sweepBeams() {
        for (const b of this.beams) {
            if (this.tweens.isTweening(b)) continue;
            this.tweens.add({
                targets: b,
                rotation: b.getData('aim') + b.getData('sweep'),
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    private lampOn(i: number) {
        const l = this.lamps[i];
        if (!l) return;
        l.setAlpha(1);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 120, yoyo: true, repeat: 2 });
    }

    /** Rojão sobe deixando rastro e abre em pixel na cor do nível. */
    private firework(x: number, top: number, colors: number[], delay = 0, big = 1) {
        const rocket = this.add.image(x, this.yS, 'wk-px').setDepth(3).setTint(colors[0]);
        this.world.add(rocket);
        const trail = this.add.particles(0, 0, 'wk-px1', {
            follow: rocket,
            lifespan: 300,
            frequency: 18,
            speedY: { min: 4, max: 14 },
            alpha: { start: 0.9, end: 0 },
            tint: colors,
            blendMode: Phaser.BlendModes.ADD,
        });
        trail.setDepth(3);
        this.world.add(trail);
        playSfx('move', 0.6);
        this.tweens.add({
            targets: rocket,
            y: top,
            x: x + (Math.random() - 0.5) * 10,
            duration: 520,
            delay,
            ease: 'Quad.easeOut',
            onComplete: () => {
                trail.stop();
                rocket.destroy();
                this.burst(rocket.x, rocket.y, colors, big);
                this.time.delayedCall(400, () => trail.destroy());
            },
        });
    }

    private burst(x: number, y: number, colors: number[], big = 1) {
        playSfx('shot', 0.7 + Math.random() * 0.3);
        const e = this.add.particles(x, y, 'wk-px', {
            speed: { min: 45 * big, max: 105 * big },
            angle: { min: 0, max: 360 },
            lifespan: { min: 900, max: 1500 },
            gravityY: 45,
            alpha: { start: 1, end: 0 },
            scale: { start: 1.5, end: 0.5 },
            tint: colors,
            blendMode: Phaser.BlendModes.ADD,
            emitting: false,
        });
        e.setDepth(3);
        this.world.add(e);
        e.explode(Math.round(90 * big));
        // a coroa que pisca depois
        const c = this.add.particles(x, y, 'wk-px1', {
            speed: { min: 10, max: 50 * big },
            lifespan: { min: 600, max: 1100 },
            delay: 250,
            gravityY: 20,
            alpha: { values: [1, 0, 1, 0, 1, 0] },
            tint: 0xffffff,
            blendMode: Phaser.BlendModes.ADD,
            emitting: false,
        });
        c.setDepth(3);
        this.world.add(c);
        c.explode(Math.round(28 * big));
        const ring = this.add.circle(x, y, 4, colors[0], 0.6).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
        this.world.add(ring);
        this.tweens.add({ targets: ring, scale: 6 * big, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
        this.time.delayedCall(1800, () => {
            e.destroy();
            c.destroy();
        });
    }

    private startRain(colors: number[]) {
        this.rain?.destroy();
        this.rain = this.add.particles(0, -2, 'wk-px1', {
            x: { min: 0, max: this.W },
            speedY: { min: 10, max: 28 },
            speedX: { min: -4, max: 4 },
            lifespan: 5000,
            frequency: 45,
            alpha: { values: [1, 0.4, 1, 0.2, 0.8, 0] },
            tint: colors,
            blendMode: Phaser.BlendModes.ADD,
        });
        this.rain.setDepth(2);
        this.world.add(this.rain);
    }

    private startSparkle() {
        this.sparkle = this.add.particles(0, 0, 'wk-star', {
            x: { min: 6, max: this.W - 6 },
            y: { min: 6, max: this.H - 6 },
            lifespan: 600,
            frequency: 70,
            scale: { values: [0, 1, 0] },
            tint: LOOKS.shiny.fx,
            blendMode: Phaser.BlendModes.ADD,
        });
        this.sparkle.setDepth(14);
        this.world.add(this.sparkle);
    }

    private confetti(colors: number[]) {
        const { W, H } = this;
        for (const [x, ang] of [
            [0, -60],
            [W, -120],
        ] as const) {
            const e = this.add.particles(x, H, 'wk-conf', {
                speed: { min: 120, max: 230 },
                angle: { min: ang - 18, max: ang + 18 },
                gravityY: 140,
                rotate: { min: 0, max: 360 },
                lifespan: { min: 1800, max: 2600 },
                alpha: { start: 1, end: 0.6 },
                tint: colors,
                emitting: false,
            });
            e.setDepth(14);
            this.world.add(e);
            e.explode(60);
        }
    }

    private shake(ms: number, px: number) {
        this.cameras.main.shake(ms, px / this.H);
        this.hudCam.shake(ms, px / this.H);
    }

    private crowdBurst(n: number) {
        this.flashes.explode(n);
    }

    // ---------------------------------------------------------------- pistas (HUD, fora do zoom)

    private h<T extends Phaser.GameObjects.GameObject>(o: T): T {
        this.hud.add(o);
        return o;
    }

    private wash(color: number, ms: number) {
        const r = this.h(this.add.rectangle(0, 0, this.W, this.H, color, 0).setOrigin(0));
        this.tweens.add({ targets: r, fillAlpha: 0.82, duration: 120 });
        this.tweens.add({ targets: r, fillAlpha: 0, duration: 200, delay: ms, onComplete: () => r.destroy() });
    }

    /** Pop de entrada e saída de uma peça da pista. */
    private popIn(o: Phaser.GameObjects.Container, ms: number, from = 2.4) {
        o.setScale(from).setAlpha(0);
        this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
        this.tweens.add({
            targets: o,
            alpha: 0,
            scale: 0.9,
            duration: 180,
            delay: ms,
            onComplete: () => o.destroy(),
        });
    }

    private clueSeal(ms: number) {
        const d = this.d;
        const { W, H } = this;
        const look = this.finalLook;
        const bw = Math.min(W - 16, 168);
        const c = this.h(this.add.container(W / 2, Math.round(H * 0.42)));
        const g = this.add.graphics();
        const bg = d.edition === 'destaque' ? 0x111114 : d.edition === 'icone' ? 0x0b0726 : 0x141a33;
        g.fillStyle(0x000000, 0.6).fillRect(-bw / 2 + 3, -18 + 3, bw, 36);
        g.fillStyle(bg, 1).fillRect(-bw / 2, -18, bw, 36);
        g.fillStyle(look.fx[0], 1)
            .fillRect(-bw / 2, -18, bw, 2)
            .fillRect(-bw / 2, 16, bw, 2);
        g.fillStyle(look.fx[1] ?? look.fx[0], 1)
            .fillRect(-bw / 2, -14, 2, 28)
            .fillRect(bw / 2 - 2, -14, 2, 28);
        const t = this.add
            .text(0, 0, d.editionLabel.toUpperCase(), {
                fontFamily: FONT_BIG,
                fontSize: '28px',
                color: css(look.fx[0]),
            })
            .setOrigin(0.5)
            .setShadow(2, 2, '#000', 0, false, true);
        c.add([g, t]);
        this.popIn(c, ms, 3);
        this.shake(220, 6);
        playSfx('thud', 0.8);
        playMax('tap-perfeito');
        this.crowdBurst(10);
    }

    private clueType(ms: number) {
        const d = this.d;
        const { W, H } = this;
        this.wash(d.typeColor, ms);
        const c = this.h(this.add.container(W / 2, Math.round(H * 0.42)));
        const icon = this.add.image(0, -10, 'wk-type').setScale(2);
        const t = this.add
            .text(0, 30, d.typeLabel.toUpperCase(), {
                fontFamily: FONT,
                fontStyle: 'bold',
                fontSize: '11px',
                color: '#ffffff',
            })
            .setOrigin(0.5)
            .setStroke('#000000', 3);
        c.add([icon, t]);
        this.popIn(c, ms);
        playSfx('kick', 1);
        playSfx('move', 0.8);
    }

    private cluePos(ms: number, step: number) {
        const d = this.d;
        const { W, H } = this;
        const c = this.h(this.add.container(W + 120, Math.round(H * 0.42)).setRotation(-0.18));
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.6).fillRect(-74 + 3, -24 + 3, 148, 48);
        g.fillStyle(0xffcb05, 1).fillRect(-74, -24, 148, 48);
        g.fillStyle(0x141a33, 1).fillRect(-74, 14, 148, 10);
        const big = this.add
            .text(0, -6, d.posShort, { fontFamily: FONT_BIG, fontSize: '28px', color: '#141a33' })
            .setOrigin(0.5);
        const small = this.add
            .text(0, 19, d.posLong.toUpperCase(), {
                fontFamily: FONT,
                fontStyle: 'bold',
                fontSize: '11px',
                color: '#ffcb05',
            })
            .setOrigin(0.5);
        c.add([g, big]);
        // "ALA" já é o nome inteiro: a linha de baixo só aparece quando diz mais
        if (d.posLong.toUpperCase() !== d.posShort.toUpperCase()) c.add(small);
        else small.destroy();
        this.tweens.add({ targets: c, x: W / 2, duration: 240, ease: 'Back.easeOut' });
        this.tweens.add({
            targets: c,
            x: -140,
            duration: 200,
            delay: ms,
            ease: 'Quad.easeIn',
            onComplete: () => c.destroy(),
        });
        playSfx('kick', 1 + step * 0.15);
        playSfx('move', 1.1);
    }

    /** Placa de madeira de rota (estilo FireRed) com a insígnia do ginásio do tipo. */
    private clueRoute(ms: number, step: number) {
        const d = this.d;
        const { W, H } = this;
        const badge = this.textures.exists('wk-badge');
        const label = this.add
            .text(0, 0, d.home, { fontFamily: FONT, fontStyle: 'bold', fontSize: '11px', color: '#3a2410' })
            .setOrigin(0.5);
        const bw = Math.min(W - 12, Math.max(96, Math.ceil(label.width) + (badge ? 44 : 20)));
        const bh = 36;
        const c = this.h(this.add.container(W / 2, -60));
        const g = this.add.graphics();
        g.fillStyle(0x5a3a1a, 1)
            .fillRect(-bw / 2 + 12, bh / 2, 5, 20)
            .fillRect(bw / 2 - 17, bh / 2, 5, 20);
        g.fillStyle(0x000000, 0.5).fillRect(-bw / 2 + 3, -bh / 2 + 3, bw, bh);
        g.fillStyle(0x5a3a1a, 1).fillRect(-bw / 2, -bh / 2, bw, bh);
        g.fillStyle(0xc8904a, 1).fillRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh - 4);
        g.fillStyle(0xb07a3c, 1);
        for (let y = -bh / 2 + 6; y < bh / 2 - 2; y += 6) g.fillRect(-bw / 2 + 4, y, bw - 8, 1);
        g.fillStyle(0xe8b878, 1).fillRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, 1);
        c.add(g);
        if (badge) {
            c.add(this.add.image(-bw / 2 + 18, 0, 'wk-badge'));
            label.setX(12);
        }
        label.setWordWrapWidth(bw - (badge ? 40 : 12));
        c.add(label);
        this.tweens.add({ targets: c, y: Math.round(H * 0.4), duration: 520, ease: 'Bounce.easeOut' });
        this.tweens.add({
            targets: c,
            y: H + 80,
            duration: 220,
            delay: ms,
            ease: 'Quad.easeIn',
            onComplete: () => c.destroy(),
        });
        playSfx('kick', 1 + step * 0.15);
        this.time.delayedCall(260, () => playSfx('thud', 1));
    }

    /** Insígnia sozinha (nível raro). */
    private clueBadge(ms: number) {
        const { W, H } = this;
        const c = this.h(this.add.container(W / 2, Math.round(H * 0.42)));
        if (this.textures.exists('wk-badge')) c.add(this.add.image(0, 0, 'wk-badge').setScale(2));
        else
            c.add(
                this.add
                    .text(0, 0, 'Kanto', { fontFamily: FONT_BIG, fontSize: '28px', color: '#ffcb05' })
                    .setOrigin(0.5)
                    .setStroke('#000', 4),
            );
        this.popIn(c, ms);
        playSfx('kick', 1.3);
    }

    /** O portão abre, a silhueta no fim do túnel, "Quem é esse Pokémon?", rufar e zoom lento. */
    private silhouette(ms: number) {
        const { W, H, yS } = this;
        const cam = this.cameras.main;
        for (const [i, door] of this.doors.entries())
            this.tweens.add({ targets: door, x: W / 2 + (i ? 30 : -30), duration: 420, ease: 'Quad.easeOut' });
        playSfx('post', 0.4);
        this.glow.setTint(this.look.beam);
        this.tweens.add({ targets: this.glow, alpha: 1, duration: 300 });
        this.play('Idle', 0);
        this.mon
            .setPosition(W / 2, yS - 1)
            .setScale(1)
            .setVisible(true)
            .setTint(0x000000)
            .setTintMode(Phaser.TintModes.FILL);
        cam.pan(W / 2, yS - 20, 260, 'Quad.easeOut');
        cam.zoomTo(1.1, 260, 'Quad.easeOut');
        this.time.delayedCall(280, () => {
            cam.pan(W / 2, yS - 18, ms - 300, 'Sine.easeIn');
            cam.zoomTo(1.3, ms - 300, 'Sine.easeIn');
        });
        const who = this.h(
            this.add
                .text(W / 2, Math.round(H * 0.24), this.d.who, {
                    fontFamily: FONT,
                    fontStyle: 'bold',
                    fontSize: '11px',
                    color: '#ffcb05',
                })
                .setOrigin(0.5)
                .setStroke('#000000', 3)
                .setScale(0),
        );
        this.tweens.add({ targets: who, scale: 1, duration: 220, ease: 'Back.easeOut', delay: 200 });
        this.tweens.add({ targets: who, angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: who, alpha: 0, duration: 120, delay: ms - 80, onComplete: () => who.destroy() });
        // rufar acelerando + torcida crescendo
        let at = this.clock + 60;
        let gap = 170;
        while (at < this.clock + ms - 40) {
            const k = (at - this.clock) / ms;
            this.at(at, () => {
                playSfx('kick', 0.7 + k * 0.6);
                this.crowdBurst(2 + Math.round(k * 6));
            });
            at += gap;
            gap = Math.max(45, gap * 0.86);
        }
        this.crowdBeat = 140;
        playCrowd('uuh', 0.5);
    }

    /** O upgrade honesto: a prévia prateada racha e vira a cor da edição. */
    private crack() {
        const { W, H } = this;
        const g = this.h(this.add.graphics());
        const cx = W / 2;
        const cy = H * 0.46;
        const rays = Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + 0.3;
            const pts = [{ x: cx, y: cy }];
            let r = 0;
            while (r < Math.max(W, H)) {
                r += 10 + Math.random() * 18;
                const j = (Math.random() - 0.5) * 0.5;
                pts.push({ x: cx + Math.cos(a + j) * r, y: cy + Math.sin(a + j) * r });
            }
            return pts;
        });
        const prog = { p: 0 };
        this.tweens.add({
            targets: prog,
            p: 1,
            duration: 260,
            onUpdate: () => {
                g.clear().lineStyle(1, 0xffffff, 1);
                for (const pts of rays) {
                    const n = Math.max(2, Math.ceil(pts.length * prog.p));
                    g.strokePoints(pts.slice(0, n) as Phaser.Math.Vector2[], false);
                }
            },
        });
        playSfx('post', 1.6);
        this.shake(260, 3);
        this.at(this.clock + 300, () => {
            g.destroy();
            this.hudCam.flash(140, 255, 255, 255);
            this.look = this.finalLook;
            this.paintSky(this.finalLook, 0);
            for (const b of this.beams) b.setTint(this.finalLook.beam);
            this.glow.setTint(this.finalLook.beam);
            this.startRain(this.finalLook.fx);
            this.firework(this.W * 0.22, this.y0 * 0.35, this.finalLook.fx, 0, 1.2);
            this.firework(this.W * 0.78, this.y0 * 0.4, this.finalLook.fx, 80, 1.2);
            playMax('golpe-n2');
            this.shake(300, 6);
        });
    }

    /** Flash em círculo: a silhueta ganha cor e o Pokémon entra do jeito dele. */
    private reveal(px: number) {
        const { W, H, yS, ground } = this;
        const cam = this.cameras.main;
        const ring = this.h(this.add.circle(W / 2, H * 0.5, 8, 0xffffff, 1));
        this.tweens.add({
            targets: ring,
            scale: Math.max(W, H) / 6,
            alpha: 0,
            duration: 340,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy(),
        });
        this.hudCam.flash(90, 255, 255, 255);
        this.shake(320, px);
        cam.pan(W / 2, H / 2, 260, 'Quad.easeOut');
        cam.zoomTo(1, 260, 'Back.easeOut');
        this.glow.setAlpha(0.5);
        this.tweens.add({ targets: this.glow, alpha: 0, duration: 600 });
        this.dark.setAlpha(0.35);
        this.tweens.add({ targets: this.pool, alpha: 0.7, duration: 300 });
        this.pool.setTint(this.finalLook.beam);
        this.mon.clearTint();
        this.crowdBeat = 110;
        this.crowdBurst(30);
        const e = this.d.entry;
        const m = this.mon;
        m.setVisible(true)
            .setPosition(W / 2, yS - 1)
            .setScale(1)
            .setAlpha(1);
        this.shadow
            .setVisible(true)
            .setScale(0.4)
            .setPosition(W / 2, yS);
        const land = () => this.pose();
        if (e === 'aparece') {
            m.setPosition(W / 2, ground)
                .setScale(2)
                .setAlpha(0);
            this.shadow.setScale(1).setPosition(W / 2, ground);
            this.play('Idle', 0);
            this.tweens.add({
                targets: m,
                alpha: { from: 0, to: 1 },
                duration: 600,
                ease: 'Stepped',
                easeParams: [6],
                onComplete: land,
            });
            return;
        }
        if (e === 'voa') {
            this.play('Walk', 0, 1.2);
            const p = { t: 0 };
            this.tweens.add({
                targets: p,
                t: 1,
                duration: 900,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const t = p.t;
                    const y = yS - 1 + (ground - yS) * t - Math.sin(t * Math.PI) * (H * 0.22);
                    m.setPosition(W / 2 + Math.sin(t * Math.PI * 2) * 12, y).setScale(1 + t);
                    this.shadow.setPosition(m.x, yS + (ground - yS) * t).setScale(0.4 + t * 0.6);
                },
                onComplete: land,
            });
            playSfx('move', 0.5);
            return;
        }
        if (e === 'quica') {
            this.play('Hop', 0);
            const p = { t: 0 };
            this.tweens.add({
                targets: p,
                t: 1,
                duration: 900,
                onUpdate: () => {
                    const t = p.t;
                    const hop = Math.abs(Math.sin(t * Math.PI * 3)) * 18 * (1 - t * 0.4);
                    m.setPosition(W / 2, yS - 1 + (ground - yS) * t - hop).setScale(1 + t);
                    this.shadow.setPosition(m.x, yS + (ground - yS) * t).setScale(0.4 + t * 0.6);
                },
                onComplete: land,
            });
            for (const k of [0, 1, 2]) this.time.delayedCall(k * 300 + 280, () => playSfx('kick', 1.4 + k * 0.1));
            return;
        }
        const run = e === 'corre';
        this.play('Walk', 0, run ? 1.8 : 1);
        this.tweens.add({
            targets: m,
            y: ground,
            scale: 2,
            duration: run ? 650 : 1000,
            ease: 'Quad.easeIn',
            onUpdate: (tw) => this.shadow.setPosition(m.x, m.y).setScale(0.4 + tw.progress * 0.6),
            onComplete: land,
        });
    }

    private pose() {
        this.play('Pose', 0);
        this.mon.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.play('Idle', 0));
        playCry(this.d.speciesId, this.d.cries, 0.9);
        this.shake(140, 2);
    }

    private placeMonFinal() {
        this.mon
            .setVisible(true)
            .setAlpha(1)
            .clearTint()
            .setScale(2)
            .setPosition(this.W / 2, this.ground);
        this.shadow
            .setVisible(true)
            .setScale(1)
            .setPosition(this.W / 2, this.ground);
        this.pool.setAlpha(0.7).setTint(this.finalLook.beam);
        this.play('Idle', 0);
    }

    // ---------------------------------------------------------------- carta

    private buildCard() {
        const d = this.d;
        const cw = 116;
        const ch = 144;
        const ed = d.edition;
        const ink = ed === 'icone' || ed === 'destaque' || ed === 'evento' ? '#ffffff' : '#2a2140';
        const corner = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
            // canto em degrau de pixel
            ctx.clearRect(x, y, 3, 1);
            ctx.clearRect(x, y, 1, 3);
            ctx.clearRect(x + w - 3, y, 3, 1);
            ctx.clearRect(x + w - 1, y, 1, 3);
            ctx.clearRect(x, y + h - 1, 3, 1);
            ctx.clearRect(x, y + h - 3, 1, 3);
            ctx.clearRect(x + w - 3, y + h - 1, 3, 1);
            ctx.clearRect(x + w - 1, y + h - 3, 1, 3);
        };
        const face = (ctx: CanvasRenderingContext2D, backside: boolean) => {
            const img = ctx.createImageData(cw, ch);
            const stops =
                ed === 'icone'
                    ? [0x0b0726, 0x231050, 0x0b0726, 0x3a1060]
                    : ed === 'destaque'
                      ? [0x2b2b30, 0x16161a, 0x000000]
                      : ed === 'shiny'
                        ? [0xffe3f3, 0xe3f1ff, 0xe9ffe9, 0xfff4dc, 0xf3e3ff]
                        : ed === 'evento'
                          ? [mix(d.typeColor, 0xffffff, 0.3), d.typeColor, mix(d.typeColor, 0, 0.5)]
                          : [0xfff2b0, 0xe8c24a, 0xb88a24, 0xe8c24a];
            this.dither(img, 0, 0, cw, ch, stops);
            ctx.putImageData(img, 0, 0);
            const edge =
                ed === 'icone' ? '#b48cff' : ed === 'destaque' ? '#d9b23c' : ed === 'shiny' ? '#ffffff' : '#7a5a14';
            if (ed === 'destaque') {
                ctx.fillStyle = 'rgba(255,215,90,0.14)';
                for (let k = -ch; k < cw; k += 8) for (let y = 0; y < ch; y++) ctx.fillRect(k + y, y, 1, 1);
            }
            if (ed === 'icone') {
                const rnd = seeded(11);
                for (let i = 0; i < 40; i++) {
                    ctx.fillStyle = rnd() < 0.3 ? '#ff50be' : '#ffffff';
                    ctx.fillRect(Math.floor(rnd() * cw), Math.floor(rnd() * ch), 1, 1);
                }
            }
            ctx.fillStyle = edge;
            ctx.fillRect(0, 0, cw, 2);
            ctx.fillRect(0, ch - 2, cw, 2);
            ctx.fillRect(0, 0, 2, ch);
            ctx.fillRect(cw - 2, 0, 2, ch);
            ctx.fillRect(5, 5, cw - 10, 1);
            ctx.fillRect(5, ch - 6, cw - 10, 1);
            if (!backside) {
                ctx.fillRect(8, 105, cw - 16, 1);
            }
            corner(ctx, 0, 0, cw, ch);
        };
        this.canvas('wk-card-front', cw, ch, (ctx) => face(ctx, false));
        this.canvas('wk-card-back', cw, ch, (ctx) => face(ctx, true));
        const shine = this.canvas('wk-shine', cw, ch, () => undefined);
        if (shine) this.shine = shine;

        const c = this.add
            .container(this.W / 2, Math.round(this.H * 0.45))
            .setDepth(12)
            .setVisible(false);
        this.world.add(c);
        const bgImg = this.add.image(0, 0, 'wk-card-front');
        this.art = this.add.image(14, -32, 'wk-art').setVisible(false);
        this.ratingText = this.add
            .text(-38, -64, '', { fontFamily: FONT_BIG, fontSize: '28px', color: ink })
            .setOrigin(0.5, 0);
        const pos = this.add
            .text(-38, -34, d.posShort, { fontFamily: FONT, fontStyle: 'bold', fontSize: '11px', color: ink })
            .setOrigin(0.5, 0);
        const name = this.add
            .text(0, 30, d.name.toUpperCase(), { fontFamily: FONT, fontStyle: 'bold', fontSize: '11px', color: ink })
            .setOrigin(0.5, 1);
        const attrs = d.attrs.slice(0, 4).map((a, i) =>
            this.add
                .text(i % 2 ? 4 : -50, 38 + Math.floor(i / 2) * 14, `${a.v} ${a.label}`, {
                    fontFamily: FONT,
                    fontSize: '11px',
                    color: ink,
                })
                .setOrigin(0, 0),
        );
        this.back = this.add.image(0, 0, 'wk-card-back').setVisible(false);
        const symbol = this.add.image(0, 0, 'wk-symbol').setVisible(false);
        this.back.setData('symbol', symbol);
        const shineImg = this.add.image(0, 0, 'wk-shine').setBlendMode(Phaser.BlendModes.ADD);
        this.front = [bgImg, this.art, this.ratingText, pos, name, ...attrs];
        c.add([...this.front, this.back, symbol, shineImg]);
        this.card = c;
    }

    /** Face da frente (com ou sem a arte) ou o verso, e o brilho correndo. */
    private showCard(front: boolean) {
        this.card.setVisible(true).setAlpha(1).setScale(this.cardScale);
        for (const o of this.front) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(front);
        if (front) this.art.setVisible(this.artShown);
        this.back.setVisible(!front);
        (this.back.getData('symbol') as Phaser.GameObjects.Image).setVisible(!front);
    }

    /** Giro 3D de mentira: scaleX = |cos|, e o verso aparece quando o cos fica negativo. */
    private applySpin() {
        const cos = Math.cos(this.spin);
        const front = cos >= 0;
        if (this.back.visible === front) this.showCard(front);
        this.card.scaleX = Math.max(0.04, Math.abs(cos)) * this.cardScale;
        this.card.scaleY = this.cardScale * (1 + Math.abs(Math.sin(this.spin)) * 0.06);
    }

    private spinCard(turns: number, ms: number, fromScale: number, hideArt: boolean, onDone?: Fn) {
        this.artShown = !hideArt;
        this.showCard(true);
        this.spinning = true;
        this.spin = 0;
        this.cardScale = fromScale;
        const st = { a: 0, s: fromScale };
        this.tweens.add({
            targets: st,
            a: Math.PI * 2 * turns,
            s: 1,
            duration: ms,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                this.spin = st.a;
                this.cardScale = st.s;
            },
            onComplete: () => {
                this.spinning = false;
                this.cardScale = 1;
                this.card.setScale(1);
                this.showCard(true);
                onDone?.();
            },
        });
    }

    private countRating(ms: number) {
        const to = this.d.overall;
        const from = Math.max(40, to - 30);
        const v = { n: from };
        let last = from;
        this.ratingText.setText(String(from));
        this.tweens.add({
            targets: v,
            n: to,
            duration: ms,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                const n = Math.round(v.n);
                if (n === last) return;
                last = n;
                this.ratingText.setText(String(n));
                playSfx('select', 0.8 + (n - from) / 40);
            },
            onComplete: () => {
                this.ratingText.setText(String(to));
                this.tweens.add({ targets: this.ratingText, scale: 1.3, duration: 90, yoyo: true });
            },
        });
    }

    /** Arte entra na carta: meia volta rápida e o flash na carta. */
    private artIn() {
        const st = { a: 0 };
        this.spinning = true;
        this.cardScale = 1;
        this.tweens.add({
            targets: st,
            a: Math.PI,
            duration: 260,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                // meia volta passando pelo verso: na volta ela já vem com a arte
                this.spin = st.a < Math.PI / 2 ? st.a : st.a + Math.PI;
                if (st.a >= Math.PI / 2) this.artShown = true;
            },
            onComplete: () => {
                this.spinning = false;
                this.card.setScale(1);
                this.showCard(true);
                this.shineAt = this.clock;
            },
        });
    }

    private drawShine() {
        const t = (this.clock - this.shineAt) / 600;
        const ctx = this.shine.context;
        const w = this.shine.width;
        const h = this.shine.height;
        ctx.clearRect(0, 0, w, h);
        if (t <= 1) {
            const x = -40 + t * (w + 80);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            for (let y = 2; y < h - 2; y++) ctx.fillRect(Math.round(x + y * 0.5) - 6, y, 6, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let y = 2; y < h - 2; y++) ctx.fillRect(Math.round(x + y * 0.5) + 2, y, 2, 1);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillRect(2, 2, w - 4, h - 4);
            ctx.globalCompositeOperation = 'source-over';
        } else if (this.finished && t > 4) this.shineAt = this.clock; // brilha de novo a cada ~2,4 s
        this.shine.refresh();
    }

    private showBoard() {
        const d = this.d;
        this.board.setText((d.title ?? d.name).toUpperCase()).setColor(css(this.finalLook.fx[0]));
        this.tweens.add({ targets: this.board, alpha: { from: 0.4, to: 1 }, duration: 160, yoyo: true, repeat: 3 });
    }

    private cardReveal(ms: number, spinTurns: number, hideArt: boolean) {
        this.rays.setAlpha(0).setTint(this.finalLook.beam);
        this.tweens.add({ targets: this.rays, alpha: 0.22, duration: 300 });
        this.tweens.add({ targets: this.rays, angle: 360, duration: 9000, repeat: -1 });
        this.spinCard(spinTurns, ms, 0.25, hideArt, () => this.shake(160, 4));
        playSfx('shot', 0.6);
    }

    // ---------------------------------------------------------------- roteiros

    private lightsOn(beams: number, look: Look, at: number, step: number) {
        const { W, H } = this;
        const set: [number, number, number, number][] =
            beams === 1
                ? [[W / 2, H + 4, Math.PI, 0.35]]
                : beams === 2
                  ? [
                        [0, 16, -0.55, 0.45],
                        [W - 1, 16, 0.55, -0.45],
                    ]
                  : [
                        [0, 16, -0.5, 0.5],
                        [W - 1, 16, 0.5, -0.5],
                        [W * 0.2, H + 4, Math.PI + 0.35, -0.6],
                        [W * 0.8, H + 4, Math.PI - 0.35, 0.6],
                    ];
        set.forEach(([x, y, aim, sweep], i) => {
            const b = this.addBeam(x, y, aim, sweep, i * 230);
            b.setTint(look.beam);
            this.at(at + i * step, () => {
                this.lightBeam(b);
                this.lampOn(x < W / 2 ? 0 : 1);
                if (i === 0) this.tweens.add({ targets: this.dark, alpha: 0.55, duration: 300 });
            });
        });
    }

    private planRaro() {
        const T = WALK_MS.raro;
        const fx = LOOKS.ouro.fx;
        playSfx('thud', 0.9);
        this.at(0, () => this.paintSky(LOOKS.ouro, 500));
        this.lightsOn(1, LOOKS.ouro, 60, 0);
        this.at(120, () => this.firework(this.W / 2, this.y0 * 0.4, fx));
        this.at(600, () => this.clueType(480), true);
        this.at(
            1200,
            () => {
                this.cluePos(460, 1);
                this.cameras.main.zoomTo(1.15, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(1800, () => this.clueBadge(450), true);
        this.at(2300, () => {
            for (const [i, door] of this.doors.entries())
                this.tweens.add({ targets: door, x: this.W / 2 + (i ? 30 : -30), duration: 200 });
            this.cameras.main.zoomTo(1, 300, 'Quad.easeOut');
        });
        this.at(
            2400,
            () => {
                this.tweens.add({ targets: this.pool, alpha: 0.6, duration: 300 });
                this.pool.setTint(LOOKS.ouro.beam);
                this.dark.setAlpha(0.4);
                this.mon.setVisible(true);
                this.reveal(2);
            },
            true,
        );
        this.at(
            3200,
            () => {
                this.cardReveal(420, 1, false);
                this.countRating(500);
                this.hudCam.flash(70, 255, 240, 200);
                this.showBoard();
                playSfx('goal');
                playCrowd('gol', 0.5);
            },
            true,
        );
        this.at(T, () => this.finish());
    }

    private planMuitoRaro() {
        const d = this.d;
        const T = WALK_MS.muitoraro;
        const look = this.look;
        playSfx('thud', 0.8);
        this.shake(160, 2);
        this.at(100, () => this.paintSky(look, 300));
        this.lightsOn(2, look, 0, 260);
        this.at(500, () => {
            this.firework(this.W * 0.3, this.y0 * 0.4, look.fx);
            this.firework(this.W * 0.7, this.y0 * 0.32, look.fx, 160);
            if (d.edition === 'shiny') {
                this.startSparkle();
                for (const k of [0, 1, 2, 3]) this.time.delayedCall(k * 90, () => playSfx('select', 2 + k * 0.3));
            }
            this.startRain(look.fx);
        });
        this.at(
            1200,
            () => {
                this.clueType(800);
                this.cameras.main.pan(this.W / 2 - 14, this.H / 2, 300, 'Quad.easeOut');
                this.cameras.main.zoomTo(1.15, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(
            2200,
            () => {
                this.cluePos(780, 1);
                this.cameras.main.pan(this.W / 2 + 14, this.H / 2, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(
            3200,
            () => {
                this.clueRoute(780, 2);
                this.cameras.main.pan(this.W / 2, this.H / 2, 300, 'Quad.easeOut');
                this.cameras.main.zoomTo(1, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(4200, () => this.silhouette(1000), true);
        this.at(5200, () => this.reveal(6), true);
        this.at(
            5800,
            () => {
                this.cardReveal(520, 2, false);
                this.countRating(700);
                this.confetti(look.fx.concat(LOOKS.ouro.fx));
                this.showBoard();
                playMax('golpe-n3');
                playCrowd('gol', 0.8);
                this.crowdBurst(40);
            },
            true,
        );
        this.at(T, () => this.finish());
    }

    private planEspecial() {
        const d = this.d;
        const T = WALK_MS.especial;
        const look = this.look;
        playSfx('thud', 0.6);
        this.at(250, () => playSfx('thud', 0.5));
        this.at(600, () => {
            this.paintSky(look, 400);
            playMax('especial');
        });
        this.lightsOn(4, look, 600, 150);
        this.at(650, () => {
            this.firework(this.W * 0.2, this.y0 * 0.45, look.fx);
            this.firework(this.W * 0.5, this.y0 * 0.28, look.fx, 200, 1.3);
            this.firework(this.W * 0.8, this.y0 * 0.45, look.fx, 400);
        });
        this.at(1200, () => this.startRain(look.fx));
        this.at(1500, () => this.clueSeal(850), true);
        this.at(
            2500,
            () => {
                this.clueType(800);
                this.cameras.main.pan(this.W / 2 - 16, this.H / 2 - 6, 300, 'Quad.easeOut');
                this.cameras.main.zoomTo(1.15, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(
            3500,
            () => {
                this.cluePos(780, 1);
                this.cameras.main.pan(this.W / 2 + 16, this.H / 2 + 4, 300, 'Quad.easeOut');
                this.cameras.main.zoomTo(1.2, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(
            4500,
            () => {
                this.clueRoute(780, 2);
                this.cameras.main.pan(this.W / 2, this.H / 2, 300, 'Quad.easeOut');
                this.cameras.main.zoomTo(1, 300, 'Quad.easeOut');
            },
            true,
        );
        this.at(5500, () => this.silhouette(1500), true);
        if (d.upgrade) this.at(6150, () => this.crack());
        this.at(
            7000,
            () => {
                this.reveal(8);
                playMax('stinger');
            },
            true,
        );
        this.at(
            8000,
            () => {
                this.cardReveal(620, 2, true);
                this.countRating(900);
            },
            true,
        );
        this.at(
            9000,
            () => {
                this.artIn();
                this.showBoard();
                playSfx('goal');
                this.hudCam.flash(80, 255, 255, 255);
            },
            true,
        );
        this.at(9500, () => {
            this.confetti(this.finalLook.fx);
            this.firework(this.W * 0.25, this.y0 * 0.4, this.finalLook.fx);
            this.firework(this.W * 0.75, this.y0 * 0.35, this.finalLook.fx, 150);
            this.tweens.add({ targets: this.rays, alpha: 0.3, duration: 200 });
            this.play('Hop', 0);
            this.time.delayedCall(1100, () => this.play('Idle', 0));
            playCrowd('gol', 1);
            this.crowdBurst(50);
            this.crowdBeat = 90;
        });
        this.at(T, () => this.finish());
    }

    /** Reduzir movimento: fade pra cor, carta parada com o selo, grito e o stinger curto. */
    private planReduced() {
        const look = this.finalLook;
        this.paintSky(look, 300);
        this.tweens.add({ targets: this.dark, alpha: 0.4, duration: 300 });
        for (const l of this.lamps) l.setAlpha(1);
        playSfx('thud', 0.8);
        this.at(300, () => {
            this.mon
                .setVisible(true)
                .setScale(2)
                .setPosition(this.W / 2, this.ground);
            this.play('Idle', 0);
            this.mon.anims.pause();
            this.shadow.setVisible(true).setPosition(this.W / 2, this.ground);
            this.artShown = true;
            this.showCard(true);
            this.ratingText.setText(String(this.d.overall));
            this.card.setAlpha(0);
            this.tweens.add({ targets: this.card, alpha: 1, duration: 200 });
            this.board.setText((this.d.title ?? this.d.editionLabel ?? this.d.name).toUpperCase());
            playCry(this.d.speciesId, this.d.cries, 0.8);
            playSfx('goal');
        });
        this.at(WALK_REDUCED_MS, () => {
            this.finished = true;
            this.emit('done');
        });
    }
}
