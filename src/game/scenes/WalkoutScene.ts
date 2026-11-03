import Phaser from 'phaser';
import type { CryStyle } from '../../store/game-store';
import { bodyHeight, createSpeciesAnims, footOrigin, preloadSpecies, resolveAnim } from '../animation-manager';
import { trailParticle } from '../ball-trail';
import { ensureBallTexture } from '../court';
import { skinOf } from '../skin';
import { type Comemoracao, comemoracaoOf, type FxType, type Jogada, SHATTER_MS, type WalkPlan } from '../walkout-plan';
import { type WkSound, wkSound } from '../walkout-sound';
import { BAYER, mix, rgb, seeded, TypeFx } from '../walkout-type-fx';

/**
 * O walkout final (ut-walkout.md, "Escolha depois dos vídeos lado a lado"): o estádio de pixel art desenhado por código
 * (gramado, torcida, torres de luz, holofotes, fogos e faíscas na cor da edição, câmera com zoom e tremida), o tipo e a
 * posição acendendo nos dois telões, a silhueta "Quem é esse Pokémon?", o Pokémon entrando com a bola e fazendo a jogada
 * dele, o chute na tela que racha e quebra o vidro (edições especiais) ou revela a carta com o efeito do tipo (ouro,
 * `walkout-type-fx.ts`). A placa da edição e a carta de verdade (`FutCard`) ficam por cima,
 * em React (`WalkoutStage`), lendo o mesmo relógio: a cena avisa a hora a cada quadro por `game.events` ('wk-tick').
 * O relógio é próprio (`clock`): tocar pula pra próxima batida e a gravação quadro a quadro (`game.step`) sai igual.
 */
export interface WalkoutData {
    plan: WalkPlan;
    /** Edição da carta (null = ouro sem edição). */
    edition: 'icone' | 'destaque' | 'shiny' | 'evento' | null;
    speciesId: number;
    shiny: boolean;
    posShort: string;
    posLong: string;
    type: string;
    typeLabel: string;
    typeColor: number;
    who: string;
    jogada: Jogada;
    /** O que revela a carta: o vidro (edições) ou o efeito do tipo (`revealOf`). */
    reveal: 'vidro' | FxType;
    cries: CryStyle;
    /** Px da tela por px do jogo (2 a 4): o canvas tem a resolução da tela, a pixel art continua em px do jogo. */
    res?: number;
}

interface Look {
    /** Céu de cima pro horizonte. */
    sky: number[];
    /** Nebulosa: [x, y, raio x, raio y] em fração da tela + cor. */
    blobs?: [number, number, number, number, number][];
    /**
     * A textura da carta da edição no céu (pokecard2.css), em faixas com dithering: `ang` em graus, uma faixa a cada
     * `gap` px com `w` px de largura e força `a`; com várias cores, cada faixa pega a seguinte (o furta-cor do Shiny).
     */
    stripes?: { ang: number; gap: number; w: number; c: number | number[]; a: number }[];
    /** Raios de sol saindo de [x, y] (fração da tela) em `n` fatias, uma sim outra não escurecida (o Evento). */
    rays?: { x: number; y: number; n: number; dark: number };
    /** Cor das estrelas (a 1ª é a mais rara, o brilho). */
    stars?: [string, string];
    fx: number[];
    beam: number;
}

/**
 * O fundo de cada edição conversa com o acabamento da carta dela (pokecard2.css): ouro fosco com um reflexo largo,
 * ouro 85+ com o foil em faixas finas, Shiny pérola furta-cor, Destaque preto com risca dourada, Ícone galáxia e
 * Evento raios na cor do tipo (`eventLook`). Prata é só o começo do especial que troca de cor.
 */
const LOOKS: Record<string, Look> = {
    ouro: {
        sky: [0x060402, 0x22170a, 0x5c4312],
        blobs: [
            [0.25, 0.14, 0.6, 0.2, 0xb48a18],
            [0.78, 0.3, 0.55, 0.18, 0xe8c24a],
        ],
        stripes: [{ ang: 115, gap: 260, w: 70, c: 0xfff3b8, a: 0.3 }],
        stars: ['#fff6d8', '#c9a24a'],
        fx: [0xe8c24a, 0xffe9a0, 0xfff6d8],
        beam: 0xffd76a,
    },
    ouro85: {
        sky: [0x070402, 0x2c1c04, 0x74520a],
        blobs: [
            [0.2, 0.12, 0.6, 0.2, 0xe0ad1c],
            [0.75, 0.3, 0.6, 0.2, 0xffe680],
            [0.45, 0.02, 0.4, 0.1, 0x9c7208],
        ],
        stripes: [
            { ang: 115, gap: 9, w: 2, c: 0xfff6d8, a: 0.35 },
            { ang: 25, gap: 12, w: 1, c: 0xffffff, a: 0.18 },
            { ang: 115, gap: 220, w: 60, c: 0xffffff, a: 0.35 },
        ],
        stars: ['#ffffff', '#ffe680'],
        fx: [0xffe680, 0xe0ad1c, 0xfff6d8, 0xffffff],
        beam: 0xffe680,
    },
    prata: { sky: [0x05060a, 0x141822, 0x3a4256], fx: [0xc9ced8, 0xffffff, 0x9aa3b5], beam: 0xe4ebf7 },
    shiny: {
        sky: [0x0c0818, 0x2e2250, 0x6c5c96],
        blobs: [
            [0.15, 0.12, 0.45, 0.18, 0xffb3e0],
            [0.85, 0.2, 0.45, 0.18, 0xb3dcff],
            [0.5, 0.34, 0.6, 0.1, 0xc8ffc8],
            [0.45, 0.02, 0.35, 0.1, 0xffe6a8],
        ],
        stripes: [{ ang: 135, gap: 34, w: 30, c: [0xffe3f3, 0xe3f1ff, 0xe9ffe9, 0xfff4dc, 0xf3e3ff], a: 0.3 }],
        stars: ['#ffffff', '#ffd6f0'],
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
        blobs: [
            [0.5, 0.34, 0.8, 0.12, 0x8a6a1c],
            [0.2, 0.08, 0.4, 0.12, 0x3a2e10],
        ],
        stripes: [{ ang: 135, gap: 7, w: 1, c: 0xd9b23c, a: 0.45 }],
        stars: ['#ffe08a', '#b8902a'],
        fx: [0xd9b23c, 0xffe08a, 0xffffff, 0xb8902a],
        beam: 0xffe08a,
    },
};

const FONT = 'Galmuri11, monospace';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outQuad = (k: number) => 1 - (1 - k) * (1 - k);
const inSine = (k: number) => (1 - Math.cos(Math.PI * k)) / 2;
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/** Onde o Pokémon para de frente (fração do caminho do túnel até a beira da tela). */
const FRONT = 0.72;
/** Bola no tamanho 1 (perto do túnel): a textura da quadra tem 18 px. */
const BALL = 0.36;

type Fn = () => void;
/** A gravação segura o relógio no zero até começar a fotografar (`scripts/walkout-capture.mjs`). */
const held = () => (window as unknown as { __wkHold?: boolean }).__wkHold === true;
interface Screen {
    x: number;
    y: number;
    w: number;
    h: number;
}

export class WalkoutScene extends Phaser.Scene {
    private d!: WalkoutData;
    private p!: WalkPlan;
    private W = 0;
    private H = 0;
    private Z = 1;
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
    private flashes!: Phaser.GameObjects.Particles.ParticleEmitter;
    private rain?: Phaser.GameObjects.Particles.ParticleEmitter;
    private sparkle?: Phaser.GameObjects.Particles.ParticleEmitter;
    private rays!: Phaser.GameObjects.Image;
    // telões
    private screens: Screen[] = [];
    private tv: {
        halo: Phaser.GameObjects.Image;
        content: Phaser.GameObjects.Image;
        bloom: Phaser.GameObjects.Image;
        sweep: Phaser.GameObjects.Image;
        lit: boolean;
        ready: boolean;
        at: number;
    }[] = [];
    // Pokémon e bola
    private skin = 0;
    private mon!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Ellipse;
    private pool!: Phaser.GameObjects.Image;
    private ball!: Phaser.GameObjects.Image;
    private ballShadow!: Phaser.GameObjects.Ellipse;
    private animKey = '';
    private footO = 0.8;
    /** Onde o Pokémon e a bola estão (pro chute sair dali). */
    private monAt = { x: 0, d: 0, z: 0, angle: 0 };
    private contact = { x: 0, y: 0, s: BALL };
    private kicked = false;
    private shotSpin = 0;
    private touched = -1;
    private fxAt = 0;
    private impactPt = { x: 0, y: 0 };
    private landed = false;
    // câmera, ola, flashes, comemoração e a revelação com floreio
    private heads: { x: number; y: number; s: string; c: string; jump: boolean }[] = [];
    private rot = 0;
    private rotTween?: Phaser.Tweens.Tween;
    private orbit = 0;
    private camFree = false;
    private ola?: Phaser.GameObjects.Image;
    private olaFrom = Number.POSITIVE_INFINITY;
    private camFlash?: Phaser.GameObjects.Particles.ParticleEmitter;
    private timers: Record<string, number> = {};
    private temp: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private rays2?: Phaser.GameObjects.Image;
    private celebAt = -1;
    private celebStep = -1;
    private celeb: Comemoracao = 'pose';
    private beat = 0;
    private heat = 0;
    private fires: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    /** A revelação pelo tipo (carta ouro); sem, o vidro. */
    private tfx?: TypeFx;

    constructor() {
        super('walkout');
    }

    init(data: WalkoutData) {
        this.d = data;
        this.p = data.plan;
        this.clock = 0;
        this.queue = [];
        this.finished = false;
        this.lamps = [];
        this.beams = [];
        this.doors = [];
        this.screens = [];
        this.tv = [];
        this.animKey = '';
        this.kicked = false;
        this.touched = -1;
        this.landed = false;
        this.rot = 0;
        this.rotTween = undefined;
        this.orbit = 0;
        this.camFree = false;
        this.ola = undefined;
        this.olaFrom = Number.POSITIVE_INFINITY;
        this.timers = {};
        this.temp = [];
        this.fires = [];
        this.celebAt = -1;
        this.beat = 0;
        this.heat = 0;
        this.celeb = comemoracaoOf(data.speciesId);
        this.tfx = undefined;
    }

    preload() {
        this.skin = skinOf(this.d.speciesId, this.d.shiny);
        preloadSpecies(this, this.skin);
        this.load.image('wk-type', `assets/types/${this.d.type.toLowerCase()}.png`);
    }

    create() {
        const d = this.d;
        // a tela tem Z px por px do jogo: a pixel art fica igual (Z inteiro) e os telões e textos nítidos ganham resolução
        this.Z = Math.max(1, Math.round(d.res ?? 1));
        this.W = Math.round(this.scale.width / this.Z);
        this.H = Math.round(this.scale.height / this.Z);
        const { W, H } = this;
        this.y0 = Math.round(H * 0.38);
        this.yS = Math.round(H * 0.58);
        this.ground = Math.round(H * 0.91);
        this.impactPt = { x: Math.round(W * (0.4 + ((d.speciesId * 37) % 20) / 100)), y: Math.round(H * 0.4) };
        createSpeciesAnims(this, this.skin);
        ensureBallTexture(this);
        // os tweens no relógio da cena (o TweenManager do Phaser 4 conta pelo Date.now): a gravação quadro a quadro
        // (game.step) e o relógio das batidas andam juntos
        let pending = 0;
        this.events.on(Phaser.Scenes.Events.PRE_UPDATE, (_t: number, dt: number) => {
            pending = held() ? 0 : dt;
        });
        (this.tweens as unknown as { getDelta: () => number }).getDelta = () => {
            const dt = pending;
            pending = 0;
            return dt;
        };

        const ed = d.edition === 'evento' ? this.eventLook() : d.edition ? LOOKS[d.edition] : null;
        this.finalLook =
            this.p.tier === 'raro' ? LOOKS.ouro : (ed ?? (this.p.tier === 'muitoraro' ? LOOKS.ouro85 : LOOKS.ouro));
        this.look = this.p.upgrade ? LOOKS.prata : this.finalLook;

        this.world = this.add.layer();
        this.hud = this.add.layer();
        this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.hudCam.setZoom(this.Z).centerOn(W / 2, H / 2);
        this.cameras.main.setZoom(this.Z).centerOn(W / 2, H / 2);
        this.cameras.main.ignore(this.hud);
        this.hudCam.ignore(this.world);

        this.makeTextures();
        this.buildStadium();
        this.buildScreens();

        // a capa do tipo é pintada agora, na montagem (a batida não paga esse custo)
        if (d.reveal !== 'vidro' && this.p.kind !== 'calmo')
            this.tfx = new TypeFx(
                {
                    scene: this,
                    W,
                    H,
                    I: this.impactPt,
                    hud: (o) => this.h(o),
                    snd: (s) => this.snd(s),
                    shake: (ms, px) => this.shake(ms, px),
                    flash: (ms, r, g, b) => this.hudCam.flash(ms, r, g, b),
                    small: this.p.tier === 'raro' || this.p.kind === 'curto',
                    seed: d.speciesId * 17 + 3,
                },
                d.reveal,
                SHATTER_MS,
            );
        if (this.p.kind === 'calmo') this.planReduced();
        else this.plan();
    }

    private eventLook(): Look {
        const c = this.d.typeColor;
        return {
            sky: [mix(c, 0, 0.88), mix(c, 0, 0.6), mix(c, 0, 0.3)],
            blobs: [
                [0.7, 0.12, 0.35, 0.14, 0xffffff],
                [0.3, 0.3, 0.6, 0.15, c],
            ],
            rays: { x: 0.7, y: 0.12, n: 44, dark: 0.45 },
            stars: ['#ffffff', `#${mix(c, 0xffffff, 0.6).toString(16).padStart(6, '0')}`],
            fx: [c, mix(c, 0xffffff, 0.5), 0xffffff],
            beam: mix(c, 0xffffff, 0.4),
        };
    }

    private snd(s: WkSound) {
        wkSound(s, this.clock, this.d.speciesId, this.d.cries);
    }

    private at(ms: number | undefined, fn: Fn, beat = false) {
        if (ms === undefined) return;
        this.queue.push({ at: ms, fn, beat });
        this.queue.sort((a, b) => a.at - b.at);
    }

    /** Toque: pula pra próxima batida (as que ficaram no caminho acontecem). */
    tap() {
        if (this.finished) return;
        const next = this.queue.find((e) => e.beat && e.at > this.clock);
        if (next) this.clock = next.at - 1;
    }

    /** Pular: vai direto pro fim (a carta pronta por cima), com o grito. false = a cena ainda não montou. */
    skip(): boolean {
        if (!this.hud) return false;
        if (this.finished) return true;
        this.queue = [];
        this.tweens.killAll();
        this.tfx?.destroy();
        this.tfx = undefined;
        this.hud.removeAll(true);
        this.rain?.stop();
        for (const e of this.temp) e.stop();
        this.celebAt = -1;
        this.rot = 0;
        this.orbit = 0;
        this.ola?.setVisible(false);
        const cam = this.cameras.main;
        cam.resetFX();
        cam.setRotation(0);
        this.zoom(1);
        cam.centerOn(this.W / 2, this.H / 2);
        this.look = this.finalLook;
        this.paintSky(this.finalLook, 0);
        this.dark.setAlpha(0.3);
        for (const l of this.lamps) l.setAlpha(1);
        for (const b of this.beams) b.setAlpha(0.3).setTint(this.finalLook.beam).setData('lit', true);
        this.glow.setAlpha(0);
        for (const door of this.doors) door.setVisible(false);
        this.lightScreen(0, true);
        this.lightScreen(1, true);
        this.ball.setVisible(false);
        this.ballShadow.setVisible(false);
        this.monAt = { x: this.W / 2, d: FRONT, z: 0, angle: 0 };
        this.settleMon();
        this.rays.setAlpha(0.22).setTint(this.finalLook.beam);
        this.clock = this.p.end;
        this.snd({ k: 'cry', gain: 0.8 });
        this.snd({ k: 'sfx', name: 'goal' });
        this.finish();
        this.game.events.emit('wk-tick', this.clock);
        return true;
    }

    private finish() {
        this.finished = true;
    }

    update(_t: number, dt: number) {
        if (held()) return;
        this.clock += dt;
        while (this.queue.length && this.queue[0].at <= this.clock) this.queue.shift()?.fn();
        // torcida pulando (2 quadros), mais rápido quando esquenta
        if (this.p.kind !== 'calmo' && this.clock - this.crowdAt >= this.crowdBeat) {
            this.crowdAt = this.clock;
            this.crowdFrame ^= 1;
            this.crowd.setTexture(`wk-crowd-${this.crowdFrame}`);
        }
        const p = this.p;
        if (!this.finished && p.kind !== 'calmo' && this.clock >= p.enter && this.clock < p.impact)
            this.stepJogada(this.clock - p.enter);
        if (p.kind !== 'calmo') this.stepScreens();
        this.tfx?.step(this.clock);
        if (p.kind !== 'calmo') this.stepMotion();
        this.game.events.emit('wk-tick', this.clock);
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
            this.skyPattern(img, W, h, look);
            ctx.putImageData(img, 0, 0);
            const [s1, s2] = look.stars ?? ['#ffffff', '#9aa0b8'];
            for (let i = 0; i < (W * h) / 140; i++) {
                ctx.fillStyle = rnd() < 0.2 ? s1 : s2;
                ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * (h - 10)), 1, 1);
            }
        });
    }

    /** Faixas e raios da carta no céu (`Look.stripes`/`rays`), com o Bayer decidindo a força de cada pixel. */
    private skyPattern(img: ImageData, W: number, h: number, look: Look) {
        const put = (x: number, y: number, c: number, k: number) => {
            const q = Math.floor(k * 4 + BAYER[(y & 3) * 4 + (x & 3)] / 16) / 4;
            if (q <= 0) return;
            const [r, g, b] = rgb(c);
            const i = (y * W + x) * 4;
            img.data[i] += (r - img.data[i]) * q;
            img.data[i + 1] += (g - img.data[i + 1]) * q;
            img.data[i + 2] += (b - img.data[i + 2]) * q;
        };
        for (const s of look.stripes ?? []) {
            const ca = Math.cos((s.ang * Math.PI) / 180);
            const sa = Math.sin((s.ang * Math.PI) / 180);
            const cs = Array.isArray(s.c) ? s.c : [s.c];
            for (let y = 0; y < h; y++)
                for (let x = 0; x < W; x++) {
                    const u = x * ca + y * sa + 4 * s.gap;
                    const off = Math.abs((u % s.gap) - s.gap / 2);
                    if (off > s.w / 2) continue;
                    // faixa larga tem borda macia; faixa fina é um risco cheio
                    const v = s.w > 4 ? 1 - off / (s.w / 2) : 1;
                    put(x, y, cs[Math.floor(u / s.gap) % cs.length], s.a * v);
                }
        }
        const r = look.rays;
        if (r)
            for (let y = 0; y < h; y++)
                for (let x = 0; x < W; x++) {
                    const a = Math.atan2(y - r.y * this.H, x - r.x * W) / (2 * Math.PI) + 0.5;
                    if (Math.floor(a * r.n) % 2) put(x, y, 0, r.dark);
                }
    }

    private makeTextures() {
        const { W, H } = this;
        const px = (key: string, w: number, h: number) =>
            this.canvas(key, w, h, (c) => {
                c.fillStyle = '#fff';
                c.fillRect(0, 0, w, h);
            });
        px('wk-px', 2, 2);
        px('wk-px1', 1, 1);
        px('wk-conf', 2, 4);
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
        // torcida, 2 quadros (uns 40% pulam um pixel e levantam o braço)
        const rnd = seeded(3);
        const heads = this.heads;
        heads.length = 0;
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

    private w<T extends Phaser.GameObjects.GameObject>(o: T): T {
        this.world.add(o);
        return o;
    }

    private buildStadium() {
        const { W, H, y0, yS, ground } = this;
        this.w(this.add.image(0, 0, 'wk-sky-dark').setOrigin(0).setDepth(0));
        this.skyTexture('wk-sky-look', this.look);
        this.skyLook = this.w(this.add.image(0, 0, 'wk-sky-look').setOrigin(0).setDepth(1).setAlpha(0));
        // os dois telões no alto: o do tipo (esquerda) e o da posição (direita)
        const tw = Math.round(Math.min((W - 36) / 2, 128));
        const th = Math.round(Math.min(64, Math.max(54, H * 0.12)));
        const ty = Math.round(Math.max(th / 2 + 18, y0 * 0.42));
        for (const side of [-1, 1])
            this.screens.push({ x: Math.round(W / 2 + side * (tw / 2 + 5)), y: ty, w: tw, h: th });

        // estádio parado (arquibancada, placas, gramado, linhas, torres, telões)
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
                    for (let x = 0; x < W; x++) img.data.set([c[0], c[1], c[2], 255], (yy * W + x) * 4);
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
            // pernas dos telões (o telão em si é nítido, `buildScreens`)
            for (const s of this.screens) {
                const t = Math.round(s.y - s.h / 2);
                ctx.fillStyle = '#1d2133';
                ctx.fillRect(Math.round(s.x - s.w / 4), t + s.h, 2, y0 - 8 - t - s.h);
                ctx.fillRect(Math.round(s.x + s.w / 4), t + s.h, 2, y0 - 8 - t - s.h);
            }
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
        this.glow = this.w(
            this.add
                .image(W / 2, yS, 'wk-glow')
                .setOrigin(0.5, 1)
                .setDepth(8)
                .setAlpha(0)
                .setTint(this.look.beam)
                .setBlendMode(Phaser.BlendModes.ADD),
        );
        this.w(this.add.image(0, 0, 'wk-stadium').setOrigin(0).setDepth(4));
        this.crowd = this.w(this.add.image(0, 0, 'wk-crowd-0').setOrigin(0).setDepth(5));
        // a ola: a arquibancada de pé com os braços pra cima, mostrada numa faixa que corre de um lado pro outro
        const st = this.textures.get('wk-stadium').getSourceImage() as HTMLCanvasElement;
        this.canvas('wk-crowd-up', W, H, (ctx) => {
            ctx.drawImage(st, 0, y0, W, yS - y0 - 1, 0, y0, W, yS - y0 - 1);
            for (const h of this.heads) {
                ctx.fillStyle = h.c;
                ctx.fillRect(h.x, h.y, 2, 2);
                ctx.fillStyle = h.s;
                ctx.fillRect(h.x, h.y - 2, 2, 2);
                ctx.fillRect(h.x - 1, h.y - 4, 1, 3);
                ctx.fillRect(h.x + 2, h.y - 4, 1, 3);
            }
        });
        this.ola = this.w(this.add.image(0, 0, 'wk-crowd-up').setOrigin(0).setDepth(5.5).setVisible(false));
        this.camFlash = this.add.particles(0, 0, 'wk-star', {
            x: { min: 4, max: W - 4 },
            y: { min: y0 + 4, max: yS - 6 },
            lifespan: 150,
            frequency: -1,
            scale: { start: 1, end: 0.2 },
            alpha: { start: 1, end: 0 },
            blendMode: Phaser.BlendModes.ADD,
        });
        this.camFlash.setDepth(8);
        this.w(this.camFlash);
        // escuro por cima do estádio (o céu escurece pela troca de textura)
        this.dark = this.w(
            this.add
                .rectangle(0, y0 - 10, W, H - y0 + 10, 0x000000, 1)
                .setOrigin(0)
                .setDepth(7),
        );
        for (const side of [-1, 1]) {
            const door = this.add
                .rectangle(W / 2 + side * 10, yS - 17, 20, 34, 0x0a0b10)
                .setStrokeStyle(1, 0x1d2133)
                .setDepth(9);
            this.doors.push(this.w(door));
        }
        // lâmpadas acesas das torres
        for (const px of [8, W - 10]) {
            const key = `wk-lamp-${px}`;
            this.canvas(key, 18, 12, (ctx) => {
                ctx.fillStyle = '#fffbe0';
                for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ctx.fillRect(1 + i * 4, 1 + j * 4, 3, 3);
            });
            this.lamps.push(
                this.w(
                    this.add
                        .image(px - 7, 12, key)
                        .setOrigin(0)
                        .setDepth(8)
                        .setAlpha(0),
                ),
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
        this.w(this.flashes);
        // Pokémon e bola
        this.pool = this.w(
            this.add
                .image(W / 2, this.depthY(FRONT), 'wk-pool')
                .setDepth(10)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD),
        );
        this.shadow = this.w(
            this.add
                .ellipse(W / 2, ground, 34, 8, 0x000000, 0.4)
                .setDepth(12.5)
                .setVisible(false),
        );
        this.ballShadow = this.w(this.add.ellipse(0, 0, 14, 4, 0x000000, 0.4).setDepth(12.4).setVisible(false));
        this.mon = this.w(
            this.add
                .sprite(W / 2, yS - 2, `pmd-${this.skin}`)
                .setDepth(13)
                .setVisible(false),
        );
        this.ball = this.w(this.add.image(0, 0, 'ball').setDepth(13.5).setVisible(false));
        this.rays = this.w(
            this.add
                .image(W / 2, Math.round(H * 0.42), 'wk-rays')
                .setDepth(11)
                .setAlpha(0)
                .setTint(this.finalLook.beam)
                .setBlendMode(Phaser.BlendModes.ADD),
        );
    }

    /**
     * Os dois telões, nítidos: a moldura com bisel e espessura, o vidro com linhas finas e reflexo, e o conteúdo (o ícone
     * do tipo redesenhado em alta a partir do de 36 px; o nome do tipo; a posição) em textura de K px por px do jogo com
     * filtro linear, que continua limpa quando a câmera chega perto. Por cima, o brilho (bloom); atrás, o halo de luz.
     */
    private buildScreens() {
        const d = this.d;
        const B = 4;
        const D = 3;
        const halo = this.screens[0];
        // halo: um retângulo de luz macio (baixa resolução de propósito), tingido na cor de cada telão
        this.canvas('wk-tv-halo', halo.w + 40, halo.h + 40, (c) => {
            const img = c.createImageData(halo.w + 40, halo.h + 40);
            for (let y = 0; y < halo.h + 40; y++)
                for (let x = 0; x < halo.w + 40; x++) {
                    const dx = Math.max(0, Math.abs(x + 0.5 - (halo.w + 40) / 2) - halo.w / 2);
                    const dy = Math.max(0, Math.abs(y + 0.5 - (halo.h + 40) / 2) - halo.h / 2);
                    const v = Math.max(0, 1 - Math.hypot(dx, dy) / 20);
                    img.data.set([255, 255, 255, Math.round(230 * v * v)], (y * (halo.w + 40) + x) * 4);
                }
            c.putImageData(img, 0, 0);
        })?.setFilter(Phaser.Textures.FilterMode.LINEAR);
        // a faixa da varredura e a borda do wipe: degradê macio
        this.canvas('wk-tv-soft', 8, 64, (c) => {
            const g = c.createLinearGradient(0, 0, 0, 64);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.5, 'rgba(255,255,255,1)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 8, 64);
        })?.setFilter(Phaser.Textures.FilterMode.LINEAR);

        this.screens.forEach((s, i) => {
            const K = Math.min(this.Z * 3.6, 2400 / (s.w + 2 * B + 2));
            const l = s.x - s.w / 2;
            const t = s.y - s.h / 2;
            const hi = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
                const tex = this.canvas(key, Math.ceil(w * K), Math.ceil(h * K), (c) => {
                    c.scale(K, K);
                    draw(c);
                });
                tex?.setFilter(Phaser.Textures.FilterMode.LINEAR);
                return tex;
            };
            const color = i === 0 ? d.typeColor : 0xffcb05;

            hi(`wk-tv-frame-${i}`, s.w + 2 * B + 2, s.h + 2 * B + D + 2, (c) => {
                c.translate(B + 1, B + 1);
                const box = (x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) => {
                    c.fillStyle = fill;
                    c.beginPath();
                    c.roundRect(x, y, w, h, r);
                    c.fill();
                };
                // sombra e a espessura da caixa (vista um pouco de baixo)
                box(-B - 1, -B + 1, s.w + 2 * B + 2, s.h + 2 * B + D, 3, 'rgba(0,0,0,0.45)');
                box(-B, -B + D, s.w + 2 * B, s.h + 2 * B, 3, '#10142a');
                // bisel de metal: luz em cima, sombra embaixo
                const g = c.createLinearGradient(0, -B, 0, s.h + B);
                g.addColorStop(0, '#93a3e8');
                g.addColorStop(0.1, '#5a6aa6');
                g.addColorStop(0.6, '#323f78');
                g.addColorStop(1, '#1b2350');
                box(-B, -B, s.w + 2 * B, s.h + 2 * B, 3, g);
                c.fillStyle = 'rgba(255,255,255,0.4)';
                c.fillRect(-B + 2, -B + 0.2, s.w + 2 * B - 4, 0.45);
                // a borda funda em volta do vidro
                box(-1.3, -1.3, s.w + 2.6, s.h + 2.6, 1.3, '#04050b');
                // o vidro apagado: azul quase preto com pontinhos finos de LED
                const v = c.createLinearGradient(0, 0, 0, s.h);
                v.addColorStop(0, '#0d1226');
                v.addColorStop(1, '#05070f');
                c.fillStyle = v;
                c.fillRect(0, 0, s.w, s.h);
                c.fillStyle = 'rgba(120,140,220,0.09)';
                for (let y = 0.5; y < s.h; y++) for (let x = 0.5; x < s.w; x++) c.fillRect(x - 0.2, y - 0.2, 0.4, 0.4);
                // parafusos
                c.fillStyle = '#b4c0f2';
                for (const [x, y] of [
                    [-B + 1.6, -B + 1.6],
                    [s.w + B - 1.6, -B + 1.6],
                    [-B + 1.6, s.h + B - 1.6],
                    [s.w + B - 1.6, s.h + B - 1.6],
                ]) {
                    c.beginPath();
                    c.arc(x, y, 0.7, 0, Math.PI * 2);
                    c.fill();
                }
            });
            const on = hi(`wk-tv-on-${i}`, s.w, s.h, (c) =>
                i === 0 ? this.drawTypeScreen(c, s.w, s.h, K) : this.drawPosScreen(c, s.w, s.h, K),
            );
            // bloom: o conteúdo borrado em baixa resolução, somado por cima (vaza um pouco pro bisel)
            const P = 8;
            this.canvas(`wk-tv-bloom-${i}`, (s.w + 2 * P) * 2, (s.h + 2 * P) * 2, (c) => {
                if (!on) return;
                if ('filter' in c) c.filter = 'blur(5px)';
                c.drawImage(on.getSourceImage() as HTMLCanvasElement, P * 2, P * 2, s.w * 2, s.h * 2);
            })?.setFilter(Phaser.Textures.FilterMode.LINEAR);
            // o vidro por cima: linhas finas, vinheta e o reflexo na diagonal
            hi(`wk-tv-glass-${i}`, s.w, s.h, (c) => {
                c.fillStyle = 'rgba(0,0,0,0.2)';
                for (let y = 0; y < s.h; y++) c.fillRect(0, y + 0.68, s.w, 0.32);
                const vg = c.createRadialGradient(
                    s.w / 2,
                    s.h / 2,
                    Math.min(s.w, s.h) * 0.3,
                    s.w / 2,
                    s.h / 2,
                    s.w * 0.7,
                );
                vg.addColorStop(0, 'rgba(0,0,0,0)');
                vg.addColorStop(1, 'rgba(0,0,0,0.38)');
                c.fillStyle = vg;
                c.fillRect(0, 0, s.w, s.h);
                const r = c.createLinearGradient(0, 0, s.w, s.h);
                r.addColorStop(0.26, 'rgba(255,255,255,0)');
                r.addColorStop(0.33, 'rgba(255,255,255,0.11)');
                r.addColorStop(0.42, 'rgba(255,255,255,0.03)');
                r.addColorStop(0.5, 'rgba(255,255,255,0)');
                c.fillStyle = r;
                c.fillRect(0, 0, s.w, s.h);
            });

            const img = (key: string, x: number, y: number, depth: number, scale: number) =>
                this.w(this.add.image(x, y, key).setOrigin(0).setScale(scale).setDepth(depth));
            const tv = {
                halo: img('wk-tv-halo', l - 20, t - 20, 3.5, 1)
                    .setTint(color)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setAlpha(0),
                content: img(`wk-tv-on-${i}`, l, t, 6.2, 1 / K).setAlpha(0),
                bloom: img(`wk-tv-bloom-${i}`, l - P, t - P, 6.3, 0.5)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setAlpha(0),
                sweep: img('wk-tv-soft', l, t, 6.6, 1)
                    .setDisplaySize(s.w, 7)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setAlpha(0),
                lit: false,
                ready: false,
                at: 0,
            };
            img(`wk-tv-frame-${i}`, l - B - 1, t - B - 1, 6, 1 / K);
            img(`wk-tv-glass-${i}`, l, t, 6.5, 1 / K);
            this.tv.push(tv);
        });
    }

    /** O ícone oficial do tipo (36 px) redesenhado em alta: o fundo vira vetor e o símbolo branco é ampliado e afiado. */
    private drawTypeIcon(c: CanvasRenderingContext2D, x: number, y: number, size: number, K: number) {
        const img = this.textures.get('wk-type').getSourceImage() as HTMLImageElement;
        const n = img.width;
        const src = document.createElement('canvas');
        src.width = src.height = n;
        const sc = src.getContext('2d', { willReadFrequently: true });
        if (!sc) return;
        sc.drawImage(img, 0, 0);
        const px = sc.getImageData(0, 0, n, n);
        const k0 = (Math.floor(n / 2) * n + 3) * 4;
        const bg = [px.data[k0], px.data[k0 + 1], px.data[k0 + 2]];
        const base = bg[0] + bg[1] + bg[2];
        // a máscara do símbolo: quanto o pixel puxa do fundo pro branco
        for (let k = 0; k < px.data.length; k += 4) {
            const a = clamp01((px.data[k] + px.data[k + 1] + px.data[k + 2] - base) / Math.max(1, 765 - base));
            px.data[k] = px.data[k + 1] = px.data[k + 2] = 255;
            px.data[k + 3] = Math.round(255 * a * (px.data[k + 3] / 255));
        }
        sc.putImageData(px, 0, 0);
        const S = Math.ceil(size * K);
        const big = document.createElement('canvas');
        big.width = big.height = S;
        const bc = big.getContext('2d', { willReadFrequently: true });
        if (!bc) return;
        bc.imageSmoothingEnabled = true;
        bc.imageSmoothingQuality = 'high';
        bc.drawImage(src, 0, 0, S, S);
        // limiar suave: a borda borrada da ampliação vira um contorno limpo
        const bd = bc.getImageData(0, 0, S, S);
        for (let k = 3; k < bd.data.length; k += 4) {
            const e = clamp01((bd.data[k] / 255 - 0.32) / 0.36);
            bd.data[k] = Math.round(255 * e * e * (3 - 2 * e));
        }
        bc.putImageData(bd, 0, 0);
        const hex = (v: number[]) => `rgb(${v.map(Math.round).join(',')})`;
        const g = c.createLinearGradient(0, y, 0, y + size);
        g.addColorStop(0, hex(bg.map((v) => v + (255 - v) * 0.22)));
        g.addColorStop(0.55, hex(bg));
        g.addColorStop(1, hex(bg.map((v) => v * 0.8)));
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.45)';
        c.shadowOffsetY = 1.2 * K;
        c.shadowBlur = 1.5 * K;
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(x, y, size, size, size * 0.2);
        c.fill();
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.6)';
        c.lineWidth = 0.6;
        c.stroke();
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.3)';
        c.shadowOffsetY = 0.5 * K;
        c.drawImage(big, x, y, size, size);
        c.restore();
    }

    /** Texto na fonte do jogo, com contorno e sombra, encolhendo pra caber em `maxW`. */
    private fitText(
        c: CanvasRenderingContext2D,
        text: string,
        font: string,
        size: number,
        [maxW, maxH]: [number, number],
        x: number,
        y: number,
        fill: string,
        stroke: string,
        K: number,
    ) {
        c.font = font.replace('#', `${size}px`);
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        const m = c.measureText(text);
        const tall = Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
        const f = Math.min(1.3, maxW / Math.max(1, m.width), maxH / tall);
        c.font = font.replace('#', `${size * f}px`);
        // centra pela caixa de verdade das letras (acento incluído), não pela linha de base da fonte
        y += ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * f) / 2;
        c.lineJoin = 'round';
        c.lineWidth = size * f * (size > 20 ? 0.18 : 0.3);
        c.strokeStyle = stroke;
        c.strokeText(text, x, y);
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.5)';
        c.shadowOffsetY = 0.8 * K;
        c.fillStyle = fill;
        c.fillText(text, x, y);
        c.restore();
    }

    private drawTypeScreen(c: CanvasRenderingContext2D, w: number, h: number, K: number) {
        const col = this.d.typeColor;
        const css = (v: number) => `#${v.toString(16).padStart(6, '0')}`;
        const bg = c.createRadialGradient(w / 2, h * 0.42, 2, w / 2, h * 0.45, w * 0.7);
        bg.addColorStop(0, css(mix(col, 0x000000, 0.25)));
        bg.addColorStop(1, css(mix(col, 0x000000, 0.78)));
        c.fillStyle = bg;
        c.fillRect(0, 0, w, h);
        c.save();
        c.globalAlpha = 0.08;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.1;
        for (let x = -h; x < w; x += 4) {
            c.beginPath();
            c.moveTo(x, h);
            c.lineTo(x + h, 0);
            c.stroke();
        }
        c.restore();
        const ic = Math.min(h * 0.54, w * 0.5);
        this.drawTypeIcon(c, (w - ic) / 2, h * 0.4 - ic / 2, ic, K);
        this.fitText(
            c,
            this.d.typeLabel.toUpperCase(),
            'bold # Galmuri11, monospace',
            11,
            [w * 0.88, h * 0.22],
            w / 2,
            h * 0.84,
            '#ffffff',
            'rgba(0,0,0,0.65)',
            K,
        );
    }

    private drawPosScreen(c: CanvasRenderingContext2D, w: number, h: number, K: number) {
        const d = this.d;
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#273272');
        g.addColorStop(0.5, '#141a3e');
        g.addColorStop(1, '#090c20');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        const r = c.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w * 0.5);
        r.addColorStop(0, 'rgba(255,203,5,0.28)');
        r.addColorStop(1, 'rgba(255,203,5,0)');
        c.fillStyle = r;
        c.fillRect(0, 0, w, h);
        // faixas amarelas em cima e embaixo, cara de placar
        c.fillStyle = '#ffcb05';
        c.fillRect(0, 0, w, 1.5);
        c.fillRect(0, h - 1.5, w, 1.5);
        const two = d.posLong.toUpperCase() !== d.posShort.toUpperCase();
        const big = d.posShort.toUpperCase();
        this.fitText(
            c,
            big,
            '# Galmuri14, monospace',
            28,
            two ? [w * 0.8, h * 0.46] : [w * 0.8, h * 0.62],
            w / 2,
            two ? h * 0.4 : h * 0.5,
            '#ffcb05',
            '#3b2a05',
            K,
        );
        if (two)
            this.fitText(
                c,
                d.posLong.toUpperCase(),
                'bold # Galmuri11, monospace',
                11,
                [w * 0.9, h * 0.22],
                w / 2,
                h * 0.8,
                '#ffffff',
                'rgba(0,0,0,0.65)',
                K,
            );
    }

    /** Acende um telão: o conteúdo entra num wipe com a borda de luz (o tipo da esquerda pra direita, a posição descendo
     * em degraus como placar), o brilho estoura e assenta, e o halo acende em volta. */
    private lightScreen(i: number, now = false) {
        const tv = this.tv[i];
        if (!tv || (tv.lit && !now)) return;
        tv.lit = true;
        tv.at = this.clock;
        const fw = tv.content.frame.width;
        const fh = tv.content.frame.height;
        if (now) {
            tv.content.setAlpha(1).setCrop();
            tv.bloom.setAlpha(0.2);
            tv.halo.setAlpha(0.5);
            tv.ready = true;
            return;
        }
        const s = this.screens[i];
        const down = i === 1;
        tv.content.setAlpha(1).setCrop(0, 0, 0, 0);
        const edge = this.w(
            this.add
                .image(s.x, s.y, 'wk-tv-soft')
                .setDepth(6.7)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setAngle(down ? 0 : 90)
                .setDisplaySize(down ? s.w : s.h, 6),
        );
        const o = { k: 0 };
        const ms = down ? 460 : 360;
        this.tweens.add({
            targets: o,
            k: 1,
            duration: ms,
            ease: down ? 'Stepped' : 'Cubic.easeOut',
            easeParams: down ? [6] : undefined,
            onUpdate: () => {
                if (down) {
                    tv.content.setCrop(0, 0, fw, fh * o.k);
                    edge.setPosition(s.x, s.y - s.h / 2 + s.h * o.k);
                } else {
                    tv.content.setCrop(0, 0, fw * o.k, fh);
                    edge.setPosition(s.x - s.w / 2 + s.w * o.k, s.y);
                }
            },
            onComplete: () => {
                tv.content.setCrop();
                this.tweens.add({ targets: edge, alpha: 0, duration: 160, onComplete: () => edge.destroy() });
            },
        });
        this.tweens.add({ targets: tv.bloom, alpha: 0.7, duration: ms });
        this.tweens.add({
            targets: tv.bloom,
            alpha: 0.2,
            duration: 420,
            delay: ms,
            onComplete: () => {
                tv.ready = true;
            },
        });
        this.tweens.add({ targets: tv.halo, alpha: 0.5, duration: 300 });
    }

    /** Telões acesos: a varredura desce devagar e o brilho respira. */
    private stepScreens() {
        for (const [i, tv] of this.tv.entries()) {
            if (!tv.lit) continue;
            const s = this.screens[i];
            const ph = ((this.clock - tv.at) % 2400) / 2400;
            tv.sweep.setPosition(s.x - s.w / 2, s.y - s.h / 2 + (s.h - 7) * ph).setAlpha(0.14 * Math.sin(ph * Math.PI));
            if (tv.ready) tv.bloom.setAlpha(0.2 + 0.05 * Math.sin(this.clock / 260 + i));
        }
    }

    /** O tipo ou a posição: a câmera corre pro telão, ele acende, e a luz dos holofotes pega a cor. */
    private clueScreen(i: number, step: number) {
        const s = this.screens[i];
        const cam = this.cameras.main;
        const z = Phaser.Math.Clamp((this.W * 0.86) / s.w, 1.6, 3);
        const p = this.p;
        if (i === 1) {
            // corte seco pro telão da posição, já perto, e a câmera abre devagar girando de volta
            cam.panEffect.reset();
            cam.centerOn(s.x, s.y + 4);
            this.zoom(z * 1.12);
            this.zoom(z * 0.97, Math.max(300, (p.back ?? p.enter) - (p.pos ?? 0) - 100), 'Sine.easeOut');
            this.hudCam.flash(70, 255, 255, 255);
            this.tilt(0.03, 0, 900, 'Sine.easeOut');
        } else {
            // chicote até o telão do tipo e um dolly lento chegando mais perto, com a câmera inclinada
            cam.pan(s.x, s.y + 4, 260, 'Cubic.easeOut', true);
            this.zoom(z * 0.94, 260, 'Back.easeOut');
            this.at(this.clock + 270, () =>
                this.zoom(z * 1.06, Math.max(300, (p.pos ?? 0) - (p.type ?? 0) - 300), 'Sine.easeInOut'),
            );
            this.tilt(-0.035, -0.015, 1000, 'Sine.easeOut');
        }
        this.beatBeams();
        this.at(this.clock + 220, () => {
            this.lightScreen(i);
            this.snd({ k: 'sfx', name: 'kick', pitch: 1 + step * 0.15 });
            this.snd({ k: 'sfx', name: 'select', pitch: 1.2 + step * 0.2 });
            this.crowdBurst(12);
            this.shake(140, 2);
        });
        this.snd({ k: 'sfx', name: 'move', pitch: 0.8 + step * 0.2 });
        const c = i === 0 ? mix(this.d.typeColor, 0xffffff, 0.3) : this.look.beam;
        for (const b of this.beams) b.setTint(c);
    }

    /**
     * Inclina a câmera de `from` pra `to`. Uma inclinação só por vez: com duas, a anterior (a do telão do tipo) seguia
     * escrevendo `rot` por cima da nova e o telão da posição tremia pro outro lado no corte.
     */
    private tilt(from: number, to: number, ms: number, ease = 'Linear') {
        this.rotTween?.remove();
        this.rot = from;
        this.rotTween = this.tweens.add({ targets: this, rot: to, duration: ms, ease });
    }

    private camBack() {
        const cam = this.cameras.main;
        const p = this.p;
        this.tilt(this.rot, 0, 400);
        if (p.gate !== undefined && p.back !== undefined) {
            // travelling: dos telões desce pela arquibancada até a boca do túnel
            const ms = p.gate - p.back + 120;
            cam.pan(this.W / 2, this.yS - 22, ms, 'Sine.easeInOut', true);
            this.zoom(1.25, ms, 'Sine.easeInOut');
        } else {
            cam.pan(this.W / 2, this.H / 2, 360, 'Quad.easeInOut', true);
            this.zoom(1, 360, 'Quad.easeInOut');
        }
        for (const b of this.beams) b.setTint(this.look.beam);
        this.snd({ k: 'sfx', name: 'move', pitch: 0.6 });
    }

    private paintSky(look: Look, ms: number) {
        this.skyTexture('wk-sky-look', look);
        this.skyLook.setTexture('wk-sky-look');
        if (ms) {
            this.skyLook.setAlpha(0);
            this.tweens.add({ targets: this.skyLook, alpha: 1, duration: ms });
        } else this.skyLook.setAlpha(1);
    }

    private addBeam(x: number, y: number, aim: number, sweep: number) {
        const b = this.add
            .image(x, y, 'wk-beam')
            .setOrigin(0.5, 0)
            .setRotation(aim)
            .setDepth(9)
            .setAlpha(0)
            .setTint(this.look.beam)
            .setBlendMode(Phaser.BlendModes.ADD);
        b.setData('aim', aim).setData('sweep', sweep);
        this.w(b);
        this.beams.push(b);
        return b;
    }

    /** Holofote acende com um "clank" (quem varre é o `stepMotion`). */
    private lightBeam(b: Phaser.GameObjects.Image, i: number, alpha = 0.32) {
        this.snd({ k: 'sfx', name: 'post', pitch: 0.55 + i * 0.05 });
        b.setAlpha(alpha + 0.25);
        this.tweens.add({ targets: b, alpha, duration: 260 });
        b.setData('lit', true);
    }

    private lampOn(i: number) {
        const l = this.lamps[i];
        if (!l) return;
        l.setAlpha(1);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 120, yoyo: true, repeat: 2 });
    }

    /** Rojão sobe deixando rastro e abre em pixel na cor do nível. */
    private firework(x: number, top: number, colors: number[], delay = 0, big = 1) {
        const rocket = this.w(this.add.image(x, this.yS, 'wk-px').setDepth(3).setTint(colors[0]).setVisible(!delay));
        const trail = this.add.particles(0, 0, 'wk-px1', {
            follow: rocket,
            lifespan: 300,
            frequency: 18,
            speedY: { min: 4, max: 14 },
            alpha: { start: 0.9, end: 0 },
            tint: colors,
            blendMode: Phaser.BlendModes.ADD,
            emitting: !delay,
        });
        trail.setDepth(3);
        this.w(trail);
        this.at(this.clock + delay, () => {
            rocket.setVisible(true);
            trail.start();
            this.snd({ k: 'sfx', name: 'move', pitch: 0.6 });
        });
        this.tweens.add({
            targets: rocket,
            y: top,
            x: x + ((x * 7) % 10) - 5,
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
        this.snd({ k: 'zz', name: 'pop' });
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
        this.w(e);
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
        this.w(c);
        c.explode(Math.round(28 * big));
        const ring = this.w(this.add.circle(x, y, 4, colors[0], 0.6).setDepth(3).setBlendMode(Phaser.BlendModes.ADD));
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
        this.w(this.rain);
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
        this.w(this.sparkle);
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
            this.w(e);
            e.explode(60);
        }
    }

    private shake(ms: number, px: number) {
        // a intensidade do Phaser é fração da câmera vezes o zoom: com Z, divide por Z pra tremer os mesmos px do jogo
        this.cameras.main.shake(ms, px / this.H / this.Z);
        this.hudCam.shake(ms, px / this.H / this.Z);
    }

    /** Zoom da câmera do mundo (1 = a tela inteira), já no Z da resolução. */
    private zoom(z: number, ms = 0, ease = 'Quad.easeInOut') {
        const cam = this.cameras.main;
        if (ms) cam.zoomTo(z * this.Z, ms, ease, true);
        else {
            cam.zoomEffect.reset();
            cam.setZoom(z * this.Z);
        }
    }

    private crowdBurst(n: number) {
        this.flashes.explode(n);
    }

    /** Poeira no pé (drible, passo pesado, aterrissagem). */
    private dust(x: number, y: number, n: number, spread = 1) {
        const e = this.add.particles(x, y, 'wk-px', {
            speed: { min: 8 * spread, max: 30 * spread },
            angle: { min: 190, max: 350 },
            lifespan: { min: 300, max: 600 },
            gravityY: 30,
            alpha: { start: 0.8, end: 0 },
            tint: [0xb8c4a0, 0x8a9a78, 0xe0e6cc],
            emitting: false,
        });
        e.setDepth(12.6);
        this.w(e);
        e.explode(n);
        this.time.delayedCall(700, () => e.destroy());
    }

    /** Partícula de rastro do tipo (a mesma da bola com golpe na partida), no mundo. */
    private trail(type: string, x: number, y: number, depth: number) {
        const n = this.children.list.length;
        trailParticle(this, type, x, y, depth);
        for (const o of this.children.list.slice(n)) this.world.add(o);
    }

    // ---------------------------------------------------------------- Pokémon e bola

    /** Altura na tela de um ponto do campo: 0 = boca do túnel, 1 = beira de baixo. */
    private depthY(d: number) {
        return this.yS + (this.ground - this.yS) * d;
    }

    private anim(name: string, dir = 0, speed = 1) {
        const a = resolveAnim(this.skin, name);
        const key = `${this.skin}/${a}/${dir}`;
        if (key !== this.animKey && this.anims.exists(key)) {
            this.animKey = key;
            this.mon.play(key);
            this.footO = footOrigin(this.skin, a);
        }
        this.mon.anims.timeScale = speed;
    }

    /** Põe o Pokémon no campo: x na tela, d no fundo (escala 1 → 2), z de altura (pulo, voo), ângulo (bicicleta). */
    private placeMon(x: number, d: number, z = 0, angle = 0) {
        const s = 1 + d;
        const y = this.depthY(d);
        this.monAt = { x, d, z, angle };
        // girando (bicicleta), o pivô é o meio do corpo; parado, o pé
        const o = angle ? this.footO - this.headZ() / 2 / this.mon.height : this.footO;
        this.mon
            .setVisible(true)
            .setOrigin(0.5, o)
            .setPosition(x, y - z * s - (this.footO - o) * this.mon.height * s)
            .setScale(s)
            .setAngle(angle);
        this.shadow
            .setVisible(true)
            .setPosition(x, y)
            .setScale(s * 0.55 * (1 - Math.min(0.6, z / 80)))
            .setAlpha(1 - Math.min(0.7, z / 60));
    }

    private placeBall(x: number, d: number, z: number, spin: number) {
        const s = 1 + d;
        const y = this.depthY(d);
        this.ball
            .setVisible(true)
            .setPosition(x, y - (z + 9 * BALL) * s)
            .setScale(BALL * s)
            .setAngle(spin)
            .setDepth(d >= this.monAt.d ? 13.5 : 12.8);
        this.ballShadow
            .setVisible(true)
            .setPosition(x, y)
            .setScale(s * 0.5 * (1 - Math.min(0.6, z / 60)));
        this.contact = { x: this.ball.x, y: this.ball.y, s: BALL * s };
    }

    /** Altura da cabeça (px da folha, escala 1), pra cabeçada e a bola flutuando. */
    private headZ() {
        return bodyHeight(this.skin);
    }

    /** Um toque na bola: o som sai uma vez por toque. */
    private touch(k: number, pitch = 1.3) {
        if (k === this.touched) return;
        this.touched = k;
        this.snd({ k: 'sfx', name: 'kick', pitch });
    }

    /** A cada `ms` do relógio, uma vez (partículas que seguem a bola). */
    private every(ms: number) {
        if (this.clock - this.fxAt < ms) return false;
        this.fxAt = this.clock;
        return true;
    }

    private stepJogada(ms: number) {
        const p = this.p;
        const shot = p.impact - p.enter - p.body;
        if (ms < p.body) this.body(ms / p.body);
        else this.shot(clamp01((ms - p.body) / shot));
    }

    /** A jogada de cada um (u de 0 a 1). Todas acabam com a bola pronta pro chute em `contact`. */
    private body(u: number) {
        const cx = this.W / 2;
        const j = this.d.jogada;
        const type = this.d.type;
        const walk = (a: number, dEnd: number, speed = 1, d0 = 0) => {
            const k = Math.min(1, u / a);
            if (k < 1) this.anim('Walk', 0, speed);
            return lerp(d0, dEnd, k);
        };
        const dribble = (x: number, md: number, k = 1) =>
            this.placeBall(x, md + 0.05, Math.abs(Math.sin(u * 20)) * 3 * k, u * 450);
        if (j === 'embaixadinha') {
            const md = walk(0.3, FRONT);
            if (u < 0.3) {
                this.placeMon(cx, md);
                dribble(cx + 2, md);
                return;
            }
            // 4 a 5 toques (cada um com no mínimo ~350 ms), cada um mais alto; o último deixa a bola caindo no pé pro voleio
            const n = Math.max(3, Math.min(5, Math.round((0.7 * this.p.body) / 350)));
            const ph = ((u - 0.3) / 0.7) * n;
            const k = Math.min(n - 1, Math.floor(ph));
            const f = ph - k;
            this.anim(f < 0.35 ? 'Swing' : 'Idle', 0);
            this.placeMon(cx, md, f < 0.35 ? 2 * Math.sin((f / 0.35) * Math.PI) : 0);
            this.placeBall(
                cx + (k % 2 ? 4 : -4) * (1 - f),
                md + 0.04,
                (10 + k * 4) * 4 * f * (1 - f),
                135 + (ph / n) * 420,
            );
            this.touch(k, 1.2 + k * 0.08);
            return;
        }
        if (j === 'bicicleta') {
            const md = walk(0.3, 0.68);
            if (u < 0.3) {
                this.placeMon(cx, md);
                dribble(cx + 2, md);
                return;
            }
            if (u < 0.5) {
                const k = (u - 0.3) / 0.2;
                this.anim('Idle', 0);
                this.placeMon(cx, md);
                this.placeBall(cx + 2, md + 0.04, 40 * outQuad(k), 135 + k * 400);
                this.touch(0);
                return;
            }
            // o pulo de costas: sobe girando e encontra a bola lá em cima
            const k = (u - 0.5) / 0.5;
            this.anim('Shoot', 0, 0.6);
            this.placeMon(cx, md, 32 * Math.sin((k * Math.PI) / 2), -300 * inSine(k));
            this.placeBall(cx + 2, md + 0.04, 40 - 3 * k, 535 + k * 200);
            if (k > 0.02 && this.every(500)) this.snd({ k: 'sfx', name: 'move', pitch: 1.4 });
            return;
        }
        if (j === 'cabecada') {
            const md = walk(0.3, 0.66);
            if (u < 0.3) {
                this.placeMon(cx, md);
                dribble(cx + 2, md);
                return;
            }
            // levanta a bola bem alto; ela cai na cabeça no fim do pulo
            const k = (u - 0.3) / 0.7;
            const jump = k > 0.72 ? Math.sin(((k - 0.72) / 0.28) * (Math.PI / 2)) * 10 : 0;
            const hz = this.headZ() + 10;
            const P = 72;
            const b = (4 * P - 2 * hz + Math.sqrt((4 * P - 2 * hz) ** 2 - 4 * hz * hz)) / 2;
            this.anim(k > 0.72 ? 'Hop' : 'Idle', 0);
            this.placeMon(cx, md, jump);
            this.placeBall(cx + 1, md + 0.02, (b + hz) * k - b * k * k, 135 + k * 400);
            this.touch(0);
            return;
        }
        if (j === 'drible') {
            // zigue-zague até a frente, a bola colada no pé do lado que ele vai
            const md = FRONT * u;
            const amp = this.W * 0.22 * (1 - u * 0.5);
            const mx = cx + amp * Math.sin(u * Math.PI * 2);
            const dx = Math.cos(u * Math.PI * 2);
            this.anim('Walk', dx > 0 ? 1 : 7, 1.5);
            this.placeMon(mx, md);
            // a bola troca de pé deslizando (nada de pulo seco de um lado pro outro)
            this.placeBall(
                mx + Math.max(-1, Math.min(1, dx * 3)) * 6 * (1 + md),
                md + 0.05,
                Math.abs(Math.sin(u * 26)) * 2,
                u * 700,
            );
            this.touch(Math.floor(u * 6), 1.5);
            if (this.every(150)) this.dust(mx, this.depthY(md), 4, 0.6);
            return;
        }
        if (j === 'canhao') {
            if (u < 0.3) {
                const md = walk(0.3, 0.6);
                this.placeMon(cx, md);
                dribble(cx + 2, md);
                return;
            }
            const rest = { x: cx + 2, d: 0.64 };
            if (u < 0.46) {
                // ajeita a bola e recua pra pegar distância
                const k = (u - 0.3) / 0.16;
                this.anim('Walk', 4, 1);
                this.placeMon(cx, lerp(0.6, 0.46, k));
                this.placeBall(rest.x, rest.d, 0, 135);
                return;
            }
            if (u < 0.78) {
                // carrega o chute: treme (balanço suave, não liga-desliga), e a energia do tipo sobe
                const k = (u - 0.46) / 0.32;
                this.anim('Charge', 0);
                this.placeMon(cx + Math.sin(this.clock / 45) * 1.5 * k, 0.46);
                this.placeBall(rest.x, rest.d, 0, 135);
                this.touch(0, 0.6);
                if (this.every(70))
                    this.trail(
                        type,
                        cx + (((this.clock * 13) % 24) - 12) * (1 + k),
                        this.depthY(0.46) - (this.clock % 30),
                        12.9,
                    );
                if (k > 0.4 && this.every(240)) this.shake(80, 1 + k * 2);
                return;
            }
            const k = inSine((u - 0.78) / 0.22);
            this.anim('Walk', 0, 1.6);
            this.placeMon(cx, lerp(0.46, 0.6, k));
            this.placeBall(rest.x, rest.d, 0, 135);
            return;
        }
        if (j === 'levita') {
            const md = walk(0.35, 0.66);
            const k = clamp01((u - 0.35) / 0.65);
            if (u < 0.35) {
                this.placeMon(cx, md);
                this.placeBall(cx + 12, md + 0.02, 10 + 2 * Math.sin(u * 20), u * 450);
                return;
            }
            // a bola gira em volta dele e sobe, com os anéis psíquicos
            this.anim('Charge', 0);
            this.placeMon(cx, md);
            const th = k * Math.PI * 3;
            const r = 14 * (1 - k * 0.4);
            this.placeBall(
                cx + r * Math.cos(th),
                md + 0.05 * Math.sin(th),
                12 + k * 30 + 3 * Math.sin(th * 2),
                157 + k * 360,
            );
            this.ball.setTint(mix(0xffffff, 0xff9ae6, k));
            if (this.every(90)) this.trail('Psychic', this.ball.x, this.ball.y, 13.6);
            this.touch(0, 0.9);
            return;
        }
        if (j === 'voo') {
            // desce do céu trazendo a bola, solta perto da frente e paira
            if (u < 0.7) {
                const k = u / 0.7;
                const e = Math.sin((k * Math.PI) / 2);
                this.anim('Walk', k < 0.85 ? 1 : 0, 1.1);
                const md = lerp(0.1, 0.7, e);
                const z = lerp(this.H * 0.42, 16, inOut(k)) + Math.sin(k * Math.PI) * 8;
                this.placeMon(lerp(-30, cx, e), md, z);
                const s = 1 + md;
                this.placeBall(this.monAt.x, md, Math.max(0, z - 6 * BALL * s), k * 200);
                if (this.every(420)) this.snd({ k: 'sfx', name: 'move', pitch: 0.5 });
                return;
            }
            const k = (u - 0.7) / 0.3;
            this.anim('Walk', 0, 1);
            this.placeMon(cx, 0.7, 16 - 6 * k + Math.sin(this.clock / 120) * 2);
            const fall = k < 0.45 ? 10 * (1 - (k / 0.45) ** 2) : 9 * Math.sin(((k - 0.45) / 0.55) * Math.PI * 0.75);
            this.placeBall(cx + 3, 0.74, Math.max(0, fall), 200 + k * 100);
            if (k >= 0.45) this.touch(0, 0.9);
            return;
        }
        if (j === 'tremor') {
            if (u < 0.4) {
                const md = walk(0.4, 0.62, 0.8);
                this.placeMon(cx, md);
                dribble(cx + 2, md, 0.5);
                const step = Math.floor(u / 0.14);
                if (step !== this.touched) {
                    this.touched = step;
                    this.shake(130, 2);
                    this.dust(cx, this.depthY(md), 6);
                    this.snd({ k: 'sfx', name: 'thud', pitch: 0.7 });
                }
                return;
            }
            const rest = { x: cx + 2, d: 0.66 };
            if (u < 0.7) {
                // pula e cai com tudo no chão
                const k = (u - 0.4) / 0.3;
                this.anim('Hop', 0);
                this.placeMon(cx, 0.62, 30 * Math.sin(k * Math.PI));
                this.placeBall(rest.x, rest.d, 0, 180);
                this.landed = false;
                return;
            }
            if (!this.landed) {
                this.landed = true;
                this.shake(320, 7);
                this.dust(cx, this.depthY(0.62), 26, 2);
                this.trail(type, cx, this.depthY(0.62), 12.6);
                this.snd({ k: 'sfx', name: 'thud', pitch: 0.45 });
                this.snd({ k: 'sfx', name: 'shot', pitch: 0.5 });
                this.crowdBurst(20);
            }
            const k = (u - 0.7) / 0.3;
            this.anim('Idle', 0);
            this.placeMon(cx, 0.62);
            this.placeBall(rest.x, rest.d, 32 * Math.sin(k * Math.PI * 0.8), 180 + k * 360);
            return;
        }
        // chama: para, carrega, e a bola pega fogo num anel de chamas
        const md = walk(0.35, 0.66);
        if (u < 0.35) {
            this.placeMon(cx, md);
            dribble(cx + 2, md);
            return;
        }
        const k = (u - 0.35) / 0.65;
        this.anim('Charge', 0);
        this.placeMon(cx, md);
        this.placeBall(cx + 2, 0.7, 0, 157);
        this.ball.setTint(mix(0xffffff, 0xff7a2a, k));
        this.touch(0, 0.6);
        if (this.every(Math.max(45, 100 - k * 55))) {
            const th = this.clock / 140;
            const r = 9 * (1 + 0.7);
            this.trail('Fire', this.ball.x + Math.cos(th) * r, this.ball.y + Math.sin(th) * r * 0.4, 13.6);
            this.trail('Fire', this.ball.x, this.ball.y - 2, 13.6);
        }
    }

    /** O chute na tela: a bola cresce vindo pra câmera, com o rastro do tipo. */
    private shot(k: number) {
        const j = this.d.jogada;
        const m = this.monAt;
        if (!this.kicked) {
            this.kicked = true;
            this.shotSpin = this.ball.angle;
            this.snd({ k: 'sfx', name: 'shot', pitch: j === 'canhao' || j === 'tremor' ? 0.6 : 0.8 });
            this.snd({ k: 'sfx', name: 'kick', pitch: 0.7 });
            this.shake(160, j === 'canhao' ? 6 : 3);
            this.crowdBurst(16);
            this.ballShadow.setVisible(false);
            this.trail(this.d.type, this.contact.x, this.contact.y, 13.6);
        }
        // o Pokémon: chute (ou o golpe, quem levita), e volta pro chão
        if (j === 'levita') this.anim('Attack', 0);
        else if (j === 'voo') this.anim('Walk', 0);
        else this.anim('Shoot', 0);
        const z = j === 'voo' ? m.z : m.z * (1 - k);
        const angle = j === 'bicicleta' ? lerp(m.angle, -360, Math.min(1, k * 2)) : 0;
        this.placeMon(m.x, m.d, z, angle);
        this.monAt = m;
        if (k >= 1) return;
        const c = this.contact;
        const I = this.impactPt;
        const e = k * k;
        const big = (Math.min(this.W, this.H) * 0.6) / 18;
        this.ball
            .setVisible(true)
            .setDepth(30)
            .setPosition(lerp(c.x, I.x, e), lerp(c.y, I.y, e) - Math.sin(k * Math.PI) * this.H * 0.06)
            .setScale(lerp(c.s, big, k ** 2.2))
            .setAngle(this.shotSpin + k * 300);
        if (this.every(16)) this.trail(this.d.type, this.ball.x, this.ball.y, 29);
    }

    /** Depois do chute: o Pokémon desce (se estava no ar) e fica parado de frente. */
    private settleMon() {
        const m = this.monAt;
        this.anim('Idle', 0);
        this.placeMon(m.x, m.d, this.d.jogada === 'voo' ? 8 : 0);
        this.mon.setAngle(0);
        this.pool.setPosition(m.x, this.depthY(m.d)).setTint(this.finalLook.beam);
        this.tweens.add({ targets: this.pool, alpha: 0.7, duration: 300 });
    }

    // ---------------------------------------------------------------- batidas

    /** O portão abre, a silhueta no fim do túnel com a bola no pé, "Quem é esse Pokémon?", rufar e zoom lento. */
    private silhouette(ms: number) {
        const { W, H, yS } = this;
        const cam = this.cameras.main;
        for (const [i, door] of this.doors.entries())
            this.tweens.add({ targets: door, x: W / 2 + (i ? 30 : -30), duration: 420, ease: 'Quad.easeOut' });
        this.snd({ k: 'sfx', name: 'post', pitch: 0.4 });
        this.glow.setTint(this.look.beam);
        this.tweens.add({ targets: this.glow, alpha: 1, duration: 300 });
        this.anim('Idle', 0);
        this.placeMon(W / 2, 0);
        this.mon.setTint(0x000000).setTintMode(Phaser.TintModes.FILL);
        this.placeBall(W / 2 + 7, 0.02, 0, 0);
        this.ball.setTint(0x000000).setTintMode(Phaser.TintModes.FILL);
        this.shadow.setVisible(false);
        this.ballShadow.setVisible(false);
        cam.pan(W / 2, yS - 20, 260, 'Quad.easeOut', true);
        this.zoom(1.1 * 1.15, 260, 'Quad.easeOut');
        this.at(this.clock + 280, () => {
            cam.pan(W / 2, yS - 18, ms - 300, 'Sine.easeIn', true);
            this.zoom(1.3 * 1.15, ms - 300, 'Sine.easeIn');
        });
        const who = this.h(
            this.add
                .text(W / 2, Math.round(H * 0.3), this.d.who, {
                    fontFamily: FONT,
                    fontStyle: 'bold',
                    fontSize: '11px',
                    color: '#ffcb05',
                })
                .setOrigin(0.5)
                .setStroke('#1b3a8f', 4)
                .setShadow(0, 2, '#000000', 0, true, true)
                .setScale(0),
        );
        const fit = Math.min(1.5, (W * 0.9) / Math.max(1, who.width));
        this.tweens.add({ targets: who, scale: fit, duration: 220, ease: 'Back.easeOut', delay: 200 });
        this.tweens.add({ targets: who, angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: who, alpha: 0, duration: 120, delay: ms - 80, onComplete: () => who.destroy() });
        // rufar acelerando + torcida crescendo
        let at = this.clock + 60;
        let gap = 170;
        while (at < this.clock + ms - 40) {
            const k = (at - this.clock) / ms;
            this.at(at, () => {
                this.snd({ k: 'sfx', name: 'kick', pitch: 0.7 + k * 0.6 });
                this.crowdBurst(2 + Math.round(k * 6));
            });
            at += gap;
            gap = Math.max(45, gap * 0.86);
        }
        this.crowdBeat = 140;
        this.snd({ k: 'crowd', call: 'uuh', gain: 0.5 });
    }

    private h<T extends Phaser.GameObjects.GameObject>(o: T): T {
        this.hud.add(o);
        return o;
    }

    /** Flash em círculo (depois da silhueta) ou o portão abrindo (raro): o Pokémon entra com a bola. */
    private enter() {
        const { W, H } = this;
        const p = this.p;
        const cam = this.cameras.main;
        this.mon.clearTint();
        this.ball.clearTint();
        this.kicked = false;
        this.touched = -1;
        this.crowdBeat = 110;
        this.crowdBurst(30);
        if (p.gate !== undefined) {
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
            this.shake(320, p.tier === 'especial' ? 8 : 6);
            cam.pan(W / 2, H / 2, 260, 'Quad.easeOut', true);
            this.zoom(1, 260, 'Back.easeOut');
            this.glow.setAlpha(0.5);
            this.tweens.add({ targets: this.glow, alpha: 0, duration: 600 });
            this.snd({ k: 'sfx', name: 'shot', pitch: 0.8 });
            this.snd({ k: 'cry', gain: p.tier === 'especial' ? 1 : 0.85 });
        } else {
            for (const [i, door] of this.doors.entries())
                this.tweens.add({ targets: door, x: W / 2 + (i ? 30 : -30), duration: 200 });
            this.glow.setAlpha(0.8);
            this.tweens.add({ targets: this.glow, alpha: 0, duration: 500 });
            this.at(this.clock + 500, () => this.snd({ k: 'cry', gain: 0.85 }));
        }
        this.dark.setAlpha(0.35);
        if (p.tier === 'especial') this.at(this.clock + 900, () => this.snd({ k: 'zz', name: 'boing' }));
        if (p.upgrade) {
            // a prévia prateada vira a cor da edição
            this.look = this.finalLook;
            this.paintSky(this.finalLook, 0);
            for (const b of this.beams) b.setTint(this.finalLook.beam);
            this.startRain(this.finalLook.fx);
            this.firework(W * 0.22, this.y0 * 0.35, this.finalLook.fx, 0, 1.2);
            this.firework(W * 0.78, this.y0 * 0.4, this.finalLook.fx, 80, 1.2);
            this.snd({ k: 'max', name: 'especial' });
            this.snd({ k: 'max', name: 'tap-perfeito' });
        }
        if (p.body === 0) {
            this.placeMon(W / 2, FRONT);
            this.anim('Idle', 0);
            this.placeBall(W / 2 + 4, FRONT + 0.04, 0, 0);
        }
    }

    /**
     * A bola bate na tela. Edição especial: a tela racha a partir do ponto do impacto e, logo depois, quebra em cacos.
     * Ouro: o efeito do tipo (congela, queima, lava…) no mesmo tempo.
     */
    private impact() {
        const { W, H } = this;
        const I = this.impactPt;
        this.ball.setVisible(false).clearTint();
        this.ballShadow.setVisible(false);
        this.settleMon();
        const small = this.p.tier === 'raro' || this.p.kind === 'curto';
        const punch = () => {
            this.zoom(1.14);
            this.zoom(1, 360, 'Back.easeOut');
            this.beatBeams();
            this.at(this.clock + 140, () => {
                this.celebAt = this.clock;
                this.celebStep = -1;
            });
            this.crowdBurst(20);
        };
        if (this.tfx) {
            punch();
            this.shake(220, small ? 3 : 5);
            this.tfx.start(this.clock);
            return;
        }
        const rnd = seeded(this.d.speciesId * 17 + 3);
        const n = small ? 7 : 11;
        const R = Math.max(W, H);
        const rays = Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 + rnd() * 0.4;
            const pts = [{ x: I.x, y: I.y }];
            let r = 0;
            while (r < R * (small ? 0.45 : 1)) {
                r += 8 + rnd() * 16;
                const j = (rnd() - 0.5) * 0.45;
                pts.push({ x: I.x + Math.cos(a + j) * r, y: I.y + Math.sin(a + j) * r });
            }
            return pts;
        });
        // anéis da teia (vidro de verdade racha em volta do ponto)
        const rings = [10, 22, 38].slice(0, small ? 2 : 3).map((r) =>
            rays.map((pts) => {
                const q = pts.find((p) => Math.hypot(p.x - I.x, p.y - I.y) >= r) ?? pts[pts.length - 1];
                return { x: q.x, y: q.y };
            }),
        );
        const g = this.h(this.add.graphics());
        const prog = { p: 0 };
        const draw = () => {
            g.clear();
            g.fillStyle(0xffffff, 0.12 * prog.p).fillCircle(I.x, I.y, 8);
            g.lineStyle(2, 0x000000, 0.35);
            for (const pts of rays) {
                const m = Math.max(2, Math.ceil(pts.length * prog.p));
                g.strokePoints(pts.slice(0, m) as Phaser.Math.Vector2[], false);
            }
            g.lineStyle(1, 0xffffff, 1);
            for (const pts of rays) {
                const m = Math.max(2, Math.ceil(pts.length * prog.p));
                g.strokePoints(pts.slice(0, m) as Phaser.Math.Vector2[], false);
            }
            if (prog.p > 0.5) for (const ring of rings) g.strokePoints(ring as Phaser.Math.Vector2[], true, true);
        };
        this.tweens.add({ targets: prog, p: 1, duration: 200, ease: 'Quad.easeOut', onUpdate: draw });
        this.hudCam.flash(60, 255, 255, 255);
        this.shake(220, small ? 3 : 6);
        punch();
        this.snd({ k: 'zz', name: 'glass' });
        this.snd({ k: 'sfx', name: 'thud', pitch: 0.6 });
        this.at(this.clock + SHATTER_MS, () => this.shatter(g, rays, rnd));
    }

    /** O vidro quebra: os cacos caem girando e a tela fica limpa pra carta. */
    private shatter(g: Phaser.GameObjects.Graphics, rays: { x: number; y: number }[][], rnd: () => number) {
        const I = this.impactPt;
        g.destroy();
        this.hudCam.flash(120, 255, 255, 255);
        this.snd({ k: 'zz', name: 'glass' });
        this.snd({ k: 'sfx', name: 'post', pitch: 2.2 });
        for (let i = 0; i < rays.length; i++) {
            const a = rays[i];
            const b = rays[(i + 1) % rays.length];
            for (let s = 1; s < Math.min(a.length, b.length) - 1; s += 2) {
                const p0 = a[s];
                const p1 = a[s + 1];
                const p2 = b[s];
                const cxp = (p0.x + p1.x + p2.x) / 3;
                const cyp = (p0.y + p1.y + p2.y) / 3;
                const shard = this.h(
                    this.add.triangle(
                        cxp,
                        cyp,
                        p0.x - cxp,
                        p0.y - cyp,
                        p1.x - cxp,
                        p1.y - cyp,
                        p2.x - cxp,
                        p2.y - cyp,
                        0xdff4ff,
                        0.18,
                    ),
                );
                shard.setStrokeStyle(1, 0xffffff, 0.6).setOrigin(0, 0);
                const away = Math.atan2(cyp - I.y, cxp - I.x);
                const v = 20 + rnd() * 40;
                this.tweens.add({
                    targets: shard,
                    x: cxp + Math.cos(away) * v,
                    y: cyp + Math.sin(away) * v + 160 + rnd() * 120,
                    angle: (rnd() - 0.5) * 300,
                    alpha: 0,
                    duration: 600 + rnd() * 400,
                    ease: 'Quad.easeIn',
                    onComplete: () => shard.destroy(),
                });
            }
        }
    }

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
        set.slice(0, beams).forEach(([x, y, aim, sweep], i) => {
            const b = this.addBeam(x, y, aim, sweep);
            b.setTint(look.beam);
            this.at(at + i * step, () => {
                this.lightBeam(b, i);
                this.lampOn(x < W / 2 ? 0 : 1);
                if (i === 0) this.tweens.add({ targets: this.dark, alpha: 0.55, duration: 300 });
            });
        });
    }

    /** O roteiro inteiro, lido do plano (`walkout-plan.ts`). */
    private plan() {
        const p = this.p;
        const d = this.d;
        const look = this.look;
        const { W } = this;
        const esp = p.tier === 'especial';
        this.snd({ k: 'sfx', name: 'thud', pitch: esp ? 0.6 : 0.9 });
        if (p.tier !== 'raro') this.shake(160, 2);
        if (esp) this.at(250, () => this.snd({ k: 'sfx', name: 'thud', pitch: 0.5 }));
        this.at(p.sky, () => {
            this.paintSky(look, esp ? 400 : 300);
            if (esp && !p.upgrade) this.snd({ k: 'max', name: 'especial' });
        });
        this.lightsOn(p.spots, look, p.sky, p.spots > 2 ? 150 : 260);
        const xs = p.fires.length === 1 ? [0.5] : p.fires.length === 2 ? [0.3, 0.7] : [0.2, 0.5, 0.8];
        p.fires.forEach((f, i) => {
            this.at(f, () =>
                this.firework(W * xs[i], this.y0 * (i === 1 ? 0.28 : 0.42), look.fx, 0, i === 1 ? 1.3 : 1),
            );
        });
        if (d.shiny && p.fires.length)
            this.at(p.fires[0], () => {
                this.startSparkle();
                for (const k of [0, 180, 360])
                    this.at(this.clock + 300 + k, () => this.snd({ k: 'zz', name: 'sparkle' }));
            });
        if (p.rain) this.at(1200, () => this.startRain(look.fx));
        // a placa da edição (desenhada em React por cima) bate: aqui o tranco e o som
        this.at(
            p.plate,
            () => {
                this.shake(220, 6);
                this.snd({ k: 'sfx', name: 'thud', pitch: 0.6 });
                this.snd({ k: 'max', name: 'tap-perfeito' });
                this.crowdBurst(10);
            },
            true,
        );
        this.at(p.type, () => this.clueScreen(0, 0), true);
        this.at(p.pos, () => this.clueScreen(1, 1), true);
        this.at(p.back, () => this.camBack());
        if (p.gate !== undefined) this.at(p.gate, () => this.silhouette(p.enter - (p.gate ?? 0)), true);
        this.at(p.enter, () => this.enter(), true);
        this.at(p.impact, () => this.impact(), true);
        this.at(
            p.card,
            () => {
                this.rays.setAlpha(0).setTint(this.finalLook.beam);
                this.tweens.add({ targets: this.rays, alpha: 0.22, duration: 300 });
                this.tweens.add({ targets: this.rays, angle: 360, duration: 9000, repeat: -1 });
                this.snd({
                    k: 'max',
                    name: p.tier === 'raro' ? 'golpe-n2' : p.tier === 'muitoraro' ? 'golpe-n3' : 'golpe-n1',
                });
                if (!esp)
                    this.at(this.clock + 150, () =>
                        this.snd({ k: 'crowd', call: 'gol', gain: p.tier === 'raro' ? 0.4 : 0.8 }),
                    );
            },
            true,
        );
        this.at(p.art, () => this.snd({ k: 'sfx', name: 'goal' }), true);
        this.at(p.party, () => {
            this.confetti(this.finalLook.fx.concat(p.tier === 'especial' ? [] : LOOKS.ouro.fx));
            if (p.tier !== 'raro') {
                this.firework(W * 0.22, this.y0 * 0.4, this.finalLook.fx);
                this.firework(W * 0.78, this.y0 * 0.35, this.finalLook.fx, 150);
            }
            this.tweens.add({ targets: this.rays, alpha: 0.3, duration: 200 });
            this.celebAt = this.clock;
            this.celebStep = -1;
            this.snd({ k: 'crowd', call: 'gol', gain: esp ? 1 : 0.6 });
            this.crowdBurst(50);
            this.crowdBeat = 90;
        });
        this.at(p.end, () => this.finish());
        this.planMotion();
    }

    /**
     * O movimento por cima do roteiro: a câmera abre num dolly, a ola e os flashes começam com a luz, colunas de fogo e
     * fogos nas batidas (placa, carta, a nota batendo, o golpe do stinger), raios e faíscas subindo atrás da carta, e
     * confete na cor da edição caindo na festa.
     */
    private planMotion() {
        const p = this.p;
        const { W, H } = this;
        const cam = this.cameras.main;
        const fx = this.finalLook.fx;
        const esp = p.tier === 'especial';
        // tudo o que solta partícula nasce agora, parado (criar no meio custava uma travadinha por batida)
        this.fireColumns(0);
        const rise = this.add.particles(0, 0, 'wk-px', {
            x: { min: W * 0.12, max: W * 0.88 },
            y: H + 2,
            speedY: { min: -75, max: -35 },
            speedX: { min: -6, max: 6 },
            lifespan: 3600,
            frequency: 55,
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0.2 },
            tint: fx,
            blendMode: Phaser.BlendModes.ADD,
            emitting: false,
        });
        rise.setDepth(11.5);
        const fall = this.add.particles(0, -4, 'wk-conf', {
            x: { min: 0, max: W },
            speedY: { min: 30, max: 65 },
            speedX: { min: -14, max: 14 },
            rotate: { min: 0, max: 360 },
            lifespan: 6000,
            frequency: 45,
            tint: fx,
            emitting: false,
        });
        fall.setDepth(14);
        for (const e of [rise, fall]) {
            this.w(e);
            this.temp.push(e);
        }
        this.rays2 = this.w(
            this.add
                .image(this.rays.x, this.rays.y, 'wk-rays')
                .setDepth(10.9)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD),
        );
        // abre perto do túnel no escuro e recua até o estádio inteiro quando a luz acende
        this.zoom(1.6);
        cam.centerOn(W / 2, this.yS - 14);
        this.at(Math.max(0, p.sky - 100), () => {
            cam.pan(W / 2, H / 2, 1300, 'Sine.easeInOut', true);
            this.zoom(1, 1300, 'Sine.easeInOut');
        });
        this.olaFrom = p.sky + 700;
        this.at(p.plate, () => {
            if (!p.upgrade) this.fireColumns(2);
            this.beatBeams();
        });
        this.at(p.enter, () => {
            this.fireColumns(4);
            this.beatBeams();
        });
        this.at(p.card, () => {
            this.rays2
                ?.setAlpha(0)
                .setTint(fx[1] ?? fx[0])
                .setScale(0.8);
            this.tweens.add({ targets: this.rays2, alpha: 0.16, duration: 400 });
            this.tweens.add({ targets: this.rays2, angle: -360, duration: 6000, repeat: -1 });
            this.tweens.add({ targets: this.rays, angle: 360, duration: 5000, repeat: -1 });
            this.zoom(1.06, p.end - p.card, 'Sine.easeInOut');
            rise.start();
        });
        // a nota bate: tremida, fogo e fogos
        const hit = p.card + 200 + p.count;
        this.at(hit, () => {
            this.shake(260, esp ? 6 : 4);
            this.snd({ k: 'sfx', name: 'thud', pitch: 0.5 });
            this.snd({ k: 'max', name: 'tap-perfeito' });
            this.fireColumns(4);
            this.beatBeams();
            this.crowdBurst(30);
            this.rays.setAlpha(0.5);
            this.tweens.add({ targets: this.rays, alpha: 0.26, duration: 500 });
            if (p.tier !== 'raro') this.firework(W * 0.5, this.y0 * 0.3, fx, 0, 1.2);
        });
        // o stinger começa antes: o golpe dele (500 ms) cai com a arte entrando; o acento (1,1 s) com mais fogos
        if (p.art !== undefined) {
            const art = p.art;
            this.at(art - 500, () => this.snd({ k: 'max', name: 'stinger' }));
            this.at(art, () => {
                this.fireColumns(4);
                this.firework(W * 0.2, this.y0 * 0.38, fx, 0, 1.2);
                this.firework(W * 0.8, this.y0 * 0.32, fx, 60, 1.2);
                this.beatBeams();
                this.heat = 1;
            });
            this.at(art + 600, () => {
                this.firework(W * 0.5, this.y0 * 0.25, fx, 0, 1.4);
                this.fireColumns(2);
                this.beatBeams();
            });
        }
        this.at(p.party, () => {
            this.heat = 1;
            this.fireColumns(4);
            this.beatBeams();
            fall.start();
        });
    }

    /** Colunas de fogo na beira do campo (pirotecnia), com o tranco e o som do fogo. */
    private fireColumns(n: 0 | 2 | 4) {
        // as 4 colunas são criadas uma vez (criar emissor no meio do walkout custava ~10 ms por quadro de batida)
        if (!this.fires.length)
            this.fires = [0.08, 0.3, 0.7, 0.92].map((x) => {
                const e = this.add.particles(this.W * x, this.yS + 2, 'wk-px', {
                    speedY: { min: -210, max: -140 },
                    speedX: { min: -10, max: 10 },
                    gravityY: 160,
                    lifespan: { min: 380, max: 560 },
                    frequency: 14,
                    quantity: 2,
                    scale: { start: 2, end: 0.4 },
                    alpha: { start: 1, end: 0 },
                    tint: [0xffffff, 0xfff1a8, 0xffb13b, 0xff6a1f, this.finalLook.fx[0]],
                    blendMode: Phaser.BlendModes.ADD,
                    emitting: false,
                });
                e.setDepth(7.5);
                this.w(e);
                this.temp.push(e);
                return e;
            });
        if (n === 0) return;
        for (const e of n === 2 ? [this.fires[0], this.fires[3]] : this.fires) {
            e.start();
            this.at(this.clock + 320, () => e.stop());
        }
        this.snd({ k: 'zz', name: 'fogo' });
        this.shake(120, 2);
    }

    /** Batida: os holofotes trocam de cor (as da edição, em roda). */
    private beatBeams() {
        this.beat++;
        const fx = this.look.fx;
        for (const [i, b] of this.beams.entries()) b.setTint(fx[(i + this.beat) % fx.length] ?? this.look.beam);
    }

    /** A cada quadro: câmera (órbita na jogada), holofotes dançando, ola, flashes e a comemoração. */
    private stepMotion() {
        const p = this.p;
        const { W, H } = this;
        const cam = this.cameras.main;
        const c = this.clock;
        // órbita leve seguindo o Pokémon na jogada; volta pro centro antes do chute (o vidro racha no ponto certo)
        if (!this.finished && p.body > 0 && c >= p.enter + 300 && c < p.enter + p.body) {
            const k = clamp01((c - p.enter - 300) / 500) * (1 - clamp01((c - (p.enter + p.body - 350)) / 350));
            this.zoom(1 + 0.12 * k);
            cam.centerOn(lerp(W / 2, this.mon.x, 0.35 * k), lerp(H / 2, this.mon.y - 12, 0.3 * k));
            this.orbit = 0.035 * k * Math.sin((c - p.enter) / 520);
            this.camFree = true;
        } else if (this.camFree) {
            this.camFree = false;
            this.orbit = 0;
            this.zoom(1);
            cam.centerOn(W / 2, H / 2);
        }
        cam.setRotation(this.rot + this.orbit);
        // holofotes dançando: varrem mais rápido e mais largo, e esquentam na festa
        for (const [i, b] of this.beams.entries()) {
            if (!b.getData('lit')) continue;
            const sp = 620 - 200 * this.heat;
            b.setRotation(b.getData('aim') + b.getData('sweep') * 1.3 * Math.sin(c / sp + i * 1.7));
        }
        // ola: uma faixa de pé corre a arquibancada a cada 2,6 s
        if (this.ola) {
            const ph = c - this.olaFrom;
            const k = ph >= 0 ? ph % 2600 : -1;
            if (k >= 0 && k < 1500) {
                const bw = W * 0.16;
                this.ola.setVisible(true).setCrop(-bw + ((W + bw) * k) / 1500, 0, bw, H);
            } else this.ola.setVisible(false);
        }
        // flashes de câmera na torcida
        if (c > p.sky && this.each('flash', 110)) this.crowdBurst(2);
        if (c > p.sky && this.each('cam', 260)) this.camFlash?.explode(1 + (this.heat ? 1 : 0));
        if (this.celebAt >= 0) this.celebrate(c - this.celebAt);
    }

    /** Uma vez a cada `ms` por chave. */
    private each(key: string, ms: number) {
        if (this.clock - (this.timers[key] ?? Number.NEGATIVE_INFINITY) < ms) return false;
        this.timers[key] = this.clock;
        return true;
    }

    /** A comemoração, pela forma: pulo (3 pulinhos), giro (salto girando) ou pose (carrega e solta o golpe). */
    private celebrate(ms: number) {
        const DUR = 1300;
        const m = { x: this.monAt.x, d: this.monAt.d };
        const base = this.d.jogada === 'voo' ? 8 : 0;
        if (ms >= DUR) {
            this.celebAt = -1;
            this.anim('Idle', 0);
            this.placeMon(m.x, m.d, base);
            this.mon.setAngle(0);
            return;
        }
        const u = ms / DUR;
        const y = this.depthY(m.d);
        if (this.celeb === 'pulo') {
            const ph = u * 3;
            const n = Math.floor(ph);
            this.anim('Hop', 0, 1.4);
            this.placeMon(m.x, m.d, base + [18, 13, 9][n] * Math.sin((ph - n) * Math.PI));
            if (n !== this.celebStep) {
                this.celebStep = n;
                this.dust(m.x, y, 6);
                this.snd({ k: 'sfx', name: 'kick', pitch: 1.4 + n * 0.15 });
            }
            return;
        }
        if (this.celeb === 'giro') {
            this.anim('Walk', 0, 1.6);
            this.placeMon(m.x, m.d, base + 28 * Math.sin(u * Math.PI), -360 * inOut(u));
            if (u > 0.45 && this.celebStep < 0) {
                this.celebStep = 1;
                this.burst(this.mon.x, this.mon.y, this.finalLook.fx, 0.5);
            }
            if (u > 0.98) this.mon.setAngle(0);
            return;
        }
        // pose: agacha carregando e solta o golpe, um anel do tipo em volta
        if (u < 0.25) {
            this.anim('Charge', 0);
            this.placeMon(m.x, m.d, base);
            return;
        }
        this.anim('Attack', 0);
        this.placeMon(m.x, m.d, base + 5 * Math.sin(Math.min(1, (u - 0.25) / 0.3) * (Math.PI / 2)));
        if (this.celebStep < 0) {
            this.celebStep = 1;
            this.shake(140, 3);
            this.snd({ k: 'sfx', name: 'shot', pitch: 1.2 });
            for (let a = 0; a < 10; a++) {
                const th = (a / 10) * Math.PI * 2;
                this.trail(this.d.type, m.x + Math.cos(th) * 16, y - 14 + Math.sin(th) * 10, 13.6);
            }
        }
    }

    /** Reduzir movimento: fade pra cor, telões acesos, o Pokémon parado; a carta (React) aparece com a placa. */
    private planReduced() {
        const look = this.finalLook;
        this.paintSky(look, 300);
        this.tweens.add({ targets: this.dark, alpha: 0.4, duration: 300 });
        for (const l of this.lamps) l.setAlpha(1);
        this.lightScreen(0, true);
        this.lightScreen(1, true);
        this.snd({ k: 'sfx', name: 'thud', pitch: 0.8 });
        this.at(this.p.card, () => {
            this.placeMon(this.W / 2, FRONT);
            this.anim('Idle', 0);
            this.mon.anims.pause();
            this.mon.setAlpha(0);
            this.tweens.add({ targets: this.mon, alpha: 1, duration: 200 });
            this.snd({ k: 'max', name: 'golpe-n1' });
            this.snd({ k: 'cry', gain: 0.8 });
        });
        this.at(this.p.end, () => {
            this.finished = true;
        });
    }
}
