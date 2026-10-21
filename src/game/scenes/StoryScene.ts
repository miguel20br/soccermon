import Phaser from 'phaser';
import { zzfx } from 'zzfx';
import { dir8 } from '../../engine/vec';
import type { Lang } from '../../i18n/lang';
import { storyText } from '../../i18n/story';
import type { CryStyle } from '../../store/game-store';
import {
    type Compiled,
    castOf,
    compile,
    DIRS,
    type Dir,
    isLasting,
    nextStop,
    type SceneScript,
    type StageId,
    type Step,
    sayEnd,
} from '../../story/director';
import { portraitSrc } from '../../ui/portrait';
import {
    atlasKey,
    createExtraAnims,
    createSpeciesAnims,
    footOrigin,
    preloadExtra,
    preloadSpecies,
    resolveAnim,
    shadowSize,
} from '../animation-manager';
import { playCrowd, playCry, playSample, playSfx } from '../audio';
import { ART_H, ART_W, ballArt, pokeballArt, shadowArt, spotArt, trainerArt } from '../story-art';
import { paintStage } from '../story-stages';

/**
 * Tocador das cenas do Modo história (src/story/director.ts). O palco tem 144×256 pixels de arte (a grade do PMD, em
 * pé) e a câmera do mundo mostra em escala inteira: corte, zoom e tremida. Uma segunda câmera, parada, desenha
 * letreiro, fala e retrato por cima, numa grade de 360×640 (texto nítido). O relógio é o da
 * cena (`update`), então a gravação quadro a quadro do trailer (`game.step`) funciona igual.
 */
export interface StoryData {
    script: SceneScript;
    lang: Lang;
    /** Reduzir movimento: sem tremida, zoom nem flash; corte vira fade de 200 ms. */
    reduce: boolean;
    cries: CryStyle;
    /** Pixels do canvas por pixel de arte (inteiro: uma densidade só no palco). */
    zoom: number;
    onEvent: (e: 'handoff' | 'end') => void;
}

/** Grade da fala, do letreiro e do retrato (a câmera parada). */
const UI_W = 360;
const UI_H = 640;
const ACTOR_DEPTH = 1000;
const FONT = 'Galmuri11, monospace';
const INK = '#0b1030';

interface Actor {
    obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
    shadow?: Phaser.GameObjects.Image;
    skin?: number;
    kind: 'mon' | 'trainer' | 'prop';
    dir: number;
    x: number;
    y: number;
    tween?: Phaser.Tweens.Tween;
}

const dirRow = (d: Dir | undefined, fallback = 0) => (d ? DIRS.indexOf(d) : fallback);

export class StoryScene extends Phaser.Scene {
    private d!: StoryData;
    private c!: Compiled;
    private elapsed = 0;
    private i = 0;
    private paused = false;
    private world!: Phaser.GameObjects.Layer;
    private ui!: Phaser.GameObjects.Layer;
    private stage!: Phaser.GameObjects.Image;
    private dim!: Phaser.GameObjects.Rectangle;
    private actors = new Map<string, Actor>();
    private spots = new Map<string, Phaser.GameObjects.Image>();
    private dimTween?: Phaser.Tweens.Tween;
    private titleWords: Phaser.GameObjects.Text[] = [];
    private titleUntil = Infinity;
    private box!: Phaser.GameObjects.Container;
    private boxTween?: Phaser.Tweens.Tween;
    private boxText!: Phaser.GameObjects.Text;
    private boxName!: Phaser.GameObjects.Text;
    private typing: { full: string; from: number; shown: number } | null = null;
    private sayUntil = Infinity;
    private faces = new Map<'left' | 'right', { obj: Phaser.GameObjects.Container; until: number }>();

    constructor() {
        super('Story');
    }

    init(data: StoryData) {
        this.d = data;
        this.c = compile(data.script);
        this.elapsed = 0;
        this.i = 0;
        this.paused = false;
        this.actors = new Map();
        this.spots = new Map();
        this.dimTween = undefined;
        this.boxTween = undefined;
        this.faces = new Map();
        this.titleWords = [];
        this.typing = null;
    }

    preload() {
        const cast = castOf(this.d.script);
        for (const m of cast.mons) {
            preloadSpecies(this, m);
            preloadExtra(this, m);
        }
        // Modern Interiors (o tileset da Sala de troféus): parede, piso e móveis dos cenários
        if (!this.textures.exists('mi')) this.load.image('mi', 'assets/room/mi/Interiors_free_32x32.png');
        if (!this.textures.exists('mi-room')) this.load.image('mi-room', 'assets/room/mi/Room_Builder_free_32x32.png');
        for (const f of cast.faces) {
            const [mon, face] = f.split(':');
            const key = `face-${f}`;
            if (!this.textures.exists(key)) this.load.image(key, portraitSrc(Number(mon), [face]));
        }
    }

    create() {
        for (const m of castOf(this.d.script).mons) {
            createSpeciesAnims(this, m);
            createExtraAnims(this, m);
        }
        this.makeTextures();
        this.world = this.add.layer();
        this.ui = this.add.layer();
        const cam = this.cameras.main;
        cam.setZoom(this.d.zoom).centerOn(ART_W / 2, ART_H / 2);
        const uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height).setZoom(this.uiZoom);
        uiCam.centerOn(UI_W / 2, UI_H / 2);
        cam.ignore(this.ui);
        uiCam.ignore(this.world);

        this.stage = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setDepth(-1000);
        this.dim = this.add.rectangle(ART_W / 2, ART_H / 2, ART_W * 2, ART_H * 2, 0x05060f, 0).setDepth(500);
        this.world.add([this.stage, this.dim]);
        this.makeBox();
        this.input.on('pointerdown', () => this.advance());
        cam.fadeIn(250);
    }

    update(_: number, delta: number) {
        if (this.paused) return;
        this.elapsed += delta;
        const steps = this.c.steps;
        while (!this.paused && this.i < steps.length && steps[this.i].t <= this.elapsed) {
            this.run(steps[this.i].step, false, this.i);
            this.i++;
        }
        this.tick();
    }

    /** Toque: completa a fala que está digitando; se não tem, vai pro próximo corte ou fala. */
    advance() {
        if (this.paused) return;
        if (this.typing && this.typing.shown < this.typing.full.length) {
            this.typing.shown = this.typing.full.length;
            this.boxText.setText(this.typing.full);
            return;
        }
        this.jumpTo(nextStop(this.c, this.elapsed));
    }

    /** "Pular": o palco fica como estaria no fim e a cena termina. */
    skip() {
        if (this.paused) return;
        this.jumpTo(this.c.total);
    }

    /** Adianta até `ms`: o que deixa marca (cenário, ator, posição) vale na hora; letreiro, fala e som, não. */
    private jumpTo(ms: number) {
        this.clearTransient();
        const steps = this.c.steps;
        while (this.i < steps.length && steps[this.i].t < ms) {
            const s = steps[this.i].step;
            if (isLasting(s)) this.run(s, true, this.i);
            this.i++;
        }
        this.elapsed = ms;
    }

    private run(s: Step, instant: boolean, index: number) {
        switch (s.do) {
            case 'cut':
                return this.cut(s.stage, s.zoom, s.focus);
            case 'actor':
                return this.addActor(s, instant);
            case 'walk':
                return this.walk(s.id, s.x, s.y, s.beats, s.hops, instant);
            case 'anim':
                return this.anim(s.id, s.anim, s.dir, instant);
            case 'exit':
                return this.exit(s.id, instant);
            case 'portrait':
                return this.portrait(s.mon, s.face, s.side ?? 'left', this.elapsed + (s.beats ?? 3) * this.beat);
            case 'say':
                return this.say(s, sayEnd(this.c, index));
            case 'title':
                return this.title(storyText(s.text, this.d.lang), s.beats ?? 4);
            case 'camera':
                return this.camera(s.zoom, s.focus, s.beats ?? 0, s.shake);
            case 'spot':
                return this.spot(s.on, instant);
            case 'flash':
                if (!this.d.reduce) this.cameras.main.flash(160, 255, 255, 255);
                return;
            case 'sound':
                return this.playSound(s);
            case 'handoff':
            case 'end':
                this.paused = true;
                this.clearTransient();
                this.d.onEvent(s.do);
        }
    }

    private get uiZoom() {
        return (this.d.zoom * ART_W) / UI_W;
    }

    private get beat() {
        return 60_000 / this.d.script.bpm;
    }

    // ---- palco

    private cut(stage: StageId | undefined, zoom = 1, focus?: string) {
        const cam = this.cameras.main;
        if (stage) {
            for (const a of this.actors.values()) this.destroyActor(a);
            this.actors.clear();
            this.spot(null, true);
            this.clearTransient();
            this.stage.setTexture(this.stageTexture(stage));
        }
        this.frame(zoom, focus, 0);
        if (this.d.reduce) cam.fadeIn(200);
    }

    private stageTexture(id: StageId) {
        const key = `stage-${id}`;
        if (!this.textures.exists(key))
            this.textures.addCanvas(
                key,
                paintStage(id, {
                    interiors: this.textures.get('mi').getSourceImage() as CanvasImageSource,
                    room: this.textures.get('mi-room').getSourceImage() as CanvasImageSource,
                }),
            );
        return key;
    }

    /** Enquadra (zoom 1 a 1,3, arredondado pra escala inteira) num ator, sem mostrar fora do palco. */
    private frame(zoom: number, focus: string | undefined, ms: number) {
        const cam = this.cameras.main;
        const k = this.d.zoom;
        const scale = this.d.reduce ? k : Math.max(k, Math.round(k * zoom));
        const z = scale / k;
        const a = focus ? this.actors.get(focus) : undefined;
        const halfW = ART_W / 2 / z;
        const halfH = ART_H / 2 / z;
        const x = Math.round(Phaser.Math.Clamp(a ? a.x : ART_W / 2, halfW, ART_W - halfW));
        const y = Math.round(Phaser.Math.Clamp(a ? a.y - 20 : ART_H / 2, halfH, ART_H - halfH));
        if (ms > 0 && !this.d.reduce) {
            cam.zoomTo(scale, ms, 'Sine.easeInOut', true);
            cam.pan(x, y, ms, 'Sine.easeInOut', true);
        } else {
            cam.stopFollow();
            cam.setZoom(scale).centerOn(x, y);
        }
    }

    private camera(zoom: number | undefined, focus: string | undefined, beats: number, shake?: boolean) {
        if (zoom !== undefined || focus) this.frame(zoom ?? 1, focus, beats * this.beat);
        if (shake && !this.d.reduce) this.cameras.main.shake(220, 0.012);
    }

    private addActor(s: Extract<Step, { do: 'actor' }>, instant: boolean) {
        const old = this.actors.get(s.id);
        if (old) this.destroyActor(old);
        const x = Math.round(s.x * ART_W);
        const y = Math.round(s.y * ART_H);
        const dir = dirRow(s.dir);
        let a: Actor;
        if (s.mon) {
            const sprite = this.add.sprite(x, y, atlasKey(s.mon));
            const shadow = this.add.image(x, y, `story-shadow-${Math.min(3, shadowSize(s.mon) + 1)}`);
            a = { obj: sprite, shadow, skin: s.mon, kind: 'mon', dir, x, y };
            this.world.add([shadow, sprite]);
            this.actors.set(s.id, a);
            this.play(a, s.anim ?? 'Idle', dir, instant);
        } else if (s.trainer) {
            const img = this.add.image(x, y, `story-trainer-${s.trainer}`).setOrigin(0.5, 1);
            const shadow = this.add.image(x, y, 'story-shadow-1');
            a = { obj: img, shadow, kind: 'trainer', dir, x, y };
            this.world.add([shadow, img]);
            this.actors.set(s.id, a);
            if (!instant) this.pop(img);
        } else {
            const img = this.add.image(x, y, `story-${s.prop ?? 'ball'}`).setOrigin(0.5, 1);
            const shadow = this.add.image(x, y, 'story-shadow-0');
            a = { obj: img, shadow, kind: 'prop', dir, x, y };
            this.world.add([shadow, img]);
            this.actors.set(s.id, a);
        }
        this.place(a, 0);
    }

    /** Treinador entra por corte com pulinho e achatar/esticar (Reduzir movimento: só aparece). */
    private pop(img: Phaser.GameObjects.Image) {
        const y = img.y;
        if (this.d.reduce) {
            img.setAlpha(0);
            this.tweens.add({ targets: img, alpha: 1, duration: 200 });
            return;
        }
        // achatar/esticar em pixels inteiros: 16 de largura vira 14 ou 18, nunca meio pixel
        img.setY(y - 10).setScale(14 / 16, 26 / 23);
        this.tweens.chain({
            targets: img,
            tweens: [
                { y, duration: 130, ease: 'Quad.easeIn' },
                { scaleX: 18 / 16, scaleY: 20 / 23, duration: 70, ease: 'Stepped' },
                { scaleX: 1, scaleY: 1, duration: 140, ease: 'Stepped' },
            ],
        });
    }

    private place(a: Actor, lift: number) {
        a.obj.setPosition(Math.round(a.x), Math.round(a.y - lift)).setDepth(ACTOR_DEPTH + a.y);
        a.shadow?.setPosition(Math.round(a.x), Math.round(a.y)).setDepth(ACTOR_DEPTH + a.y - 1);
    }

    private play(a: Actor, anim: string, dir: number, instant: boolean) {
        if (a.kind !== 'mon' || a.skin === undefined) return;
        const sprite = a.obj as Phaser.GameObjects.Sprite;
        const res = resolveAnim(a.skin, anim);
        const key = `${a.skin}/${res}/${dir}`;
        if (!this.anims.exists(key)) return;
        a.dir = dir;
        const hold = res === 'Faint' || res === 'Walk' || res === 'Idle' || res === 'Sleep' || res === 'Sit';
        if (instant && !hold) {
            this.play(a, 'Idle', dir, false);
            return;
        }
        sprite.play(key).setOrigin(0.5, footOrigin(a.skin, res));
        if (instant && res === 'Faint') sprite.anims.setProgress(1);
        if (!hold)
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (sprite.anims.currentAnim?.key === key) this.play(a, 'Idle', dir, false);
            });
    }

    private anim(id: string, anim: string, dir: Dir | undefined, instant: boolean) {
        const a = this.actors.get(id);
        if (a) this.play(a, anim, dirRow(dir, a.dir), instant);
    }

    /** Anda em linha reta com Walk na direção certa; a bola quica (`hops`) e achata ao bater no chão. */
    private walk(id: string, tx: number, ty: number, beats: number, hops = 0, instant = false) {
        const a = this.actors.get(id);
        if (!a) return;
        a.tween?.stop();
        const from = { x: a.x, y: a.y };
        const to = { x: tx * ART_W, y: ty * ART_H };
        const dir = dir8({ x: to.x - from.x, y: to.y - from.y }, a.dir);
        if (instant) {
            a.x = to.x;
            a.y = to.y;
            this.place(a, 0);
            this.play(a, 'Idle', dir, true);
            return;
        }
        this.play(a, 'Walk', dir, false);
        a.tween = this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: beats * this.beat,
            onUpdate: (tw) => {
                const p = tw.getValue() ?? 0;
                a.x = from.x + (to.x - from.x) * p;
                a.y = from.y + (to.y - from.y) * p;
                const arc = hops ? Math.abs(Math.sin(p * hops * Math.PI)) : 0;
                this.place(a, arc * 12 * (1 - p * 0.4));
                // a bola achata ao bater no chão: 7 pixels viram 9×5
                if (a.kind === 'prop' && hops && !this.d.reduce)
                    a.obj.setScale(arc < 0.15 ? 9 / 7 : 1, arc < 0.15 ? 5 / 7 : 1);
            },
            onComplete: () => {
                if (a.kind === 'prop') a.obj.setScale(1);
                this.play(a, 'Idle', dir, false);
            },
        });
    }

    private exit(id: string, instant: boolean) {
        const a = this.actors.get(id);
        if (!a) return;
        this.actors.delete(id);
        a.tween?.stop();
        if (instant) return this.destroyActor(a);
        const lift = a.kind === 'trainer' && !this.d.reduce ? { y: a.obj.y - 8 } : {};
        this.tweens.add({
            targets: [a.obj, a.shadow].filter(Boolean),
            alpha: 0,
            ...lift,
            duration: 200,
            onComplete: () => this.destroyActor(a),
        });
    }

    private destroyActor(a: Actor) {
        a.tween?.stop();
        a.obj.destroy();
        a.shadow?.destroy();
    }

    /** No corte e ao adiantar, sem fade (um tween ainda na fila sobrevivia ao killTweensOf e escurecia o palco). */
    private spot(on: string[] | null, instant = false) {
        for (const l of this.spots.values()) l.destroy();
        this.spots.clear();
        this.dimTween?.stop();
        this.dimTween = undefined;
        const alpha = on ? 0.62 : 0;
        if (instant) this.dim.setFillStyle(0x05060f, alpha);
        else this.dimTween = this.tweens.add({ targets: this.dim, fillAlpha: alpha, duration: on ? 160 : 200 });
        for (const id of on ?? []) {
            const light = this.add.image(0, 0, 'story-spot').setBlendMode(Phaser.BlendModes.ADD).setDepth(600);
            this.world.add(light);
            this.spots.set(id, light);
        }
    }

    // ---- letreiro, fala e retrato (câmera parada)

    /** Letreiro grande, palavra por palavra (0,08 s entre elas), centrado no alto. */
    private title(text: string, beats: number) {
        for (const w of this.titleWords) w.destroy();
        const style = {
            fontFamily: FONT,
            fontStyle: 'bold',
            fontSize: '30px',
            color: '#ffffff',
            stroke: INK,
            strokeThickness: 7,
        };
        const words = text.split(' ').map((w) => this.add.text(0, 0, w, style).setResolution(this.uiZoom * 2));
        const gap = 12;
        const lines: Phaser.GameObjects.Text[][] = [[]];
        let width = 0;
        for (const w of words) {
            const line = lines[lines.length - 1];
            if (line.length && width + gap + w.width > UI_W - 40) {
                lines.push([w]);
                width = w.width;
            } else {
                width += (line.length ? gap : 0) + w.width;
                line.push(w);
            }
        }
        const lineH = 40;
        const top = 120 - ((lines.length - 1) * lineH) / 2;
        let k = 0;
        for (const [li, line] of lines.entries()) {
            const lw = line.reduce((s, w) => s + w.width, 0) + gap * (line.length - 1);
            let x = (UI_W - lw) / 2;
            for (const w of line) {
                w.setOrigin(0.5).setPosition(x + w.width / 2, top + li * lineH);
                x += w.width + gap;
                w.setAlpha(0).setScale(this.d.reduce ? 1 : 1.3);
                this.tweens.add({
                    targets: w,
                    alpha: 1,
                    scale: 1,
                    delay: k++ * 80,
                    duration: 140,
                    ease: 'Back.easeOut',
                });
            }
        }
        this.ui.add(words);
        this.titleWords = words;
        this.titleUntil = this.elapsed + beats * this.beat;
    }

    private makeBox() {
        const w = UI_W - 24;
        const h = 88;
        const g = this.add.graphics();
        g.fillStyle(0x2a3050, 1).fillRoundedRect(-3, -3, w + 6, h + 6, 10);
        g.fillStyle(0xf8f8f0, 1).fillRoundedRect(0, 0, w, h, 8);
        g.lineStyle(2, 0xd06040, 1).strokeRoundedRect(4, 4, w - 8, h - 8, 6);
        this.boxText = this.add
            .text(16, 16, '', {
                fontFamily: FONT,
                fontSize: '15px',
                color: '#303030',
                lineSpacing: 6,
                wordWrap: { width: w - 32 },
            })
            .setResolution(this.uiZoom * 2);
        const tag = this.add.graphics();
        tag.fillStyle(0x2a3050, 1).fillRoundedRect(10, -22, 150, 26, 6);
        this.boxName = this.add
            .text(20, -9, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '12px', color: '#f0c040' })
            .setOrigin(0, 0.5)
            .setResolution(this.uiZoom * 2);
        this.box = this.add.container(12, 446, [tag, this.boxName, g, this.boxText]).setAlpha(0);
        this.ui.add(this.box);
    }

    private fadeBox(alpha: number, duration: number) {
        this.boxTween?.stop();
        this.boxTween = this.tweens.add({ targets: this.box, alpha, duration });
    }

    private say(s: Extract<Step, { do: 'say' }>, until: number) {
        const full = storyText(s.text, this.d.lang);
        this.boxName.setText(storyText(s.who, this.d.lang).toUpperCase());
        this.boxText.setText('');
        this.typing = { full, from: this.elapsed, shown: 0 };
        this.sayUntil = until - 120;
        this.fadeBox(1, 120);
        if (s.face) this.portrait(s.face.mon, s.face.face, 'right', until - 120);
    }

    private portrait(mon: number, face: string, side: 'left' | 'right', until: number) {
        this.faces.get(side)?.obj.destroy();
        // o retrato é pixel art também: tamanho na tela múltiplo de 40 (escala inteira)
        const size = (40 * Math.max(1, Math.round((76 * this.uiZoom) / 40))) / this.uiZoom;
        const g = this.add.graphics();
        g.fillStyle(0x2a3050, 1).fillRoundedRect(-size / 2 - 4, -size / 2 - 4, size + 8, size + 8, 8);
        g.fillStyle(0xf8f8f0, 1).fillRect(-size / 2, -size / 2, size, size);
        const img = this.add.image(0, 0, `face-${mon}:${face}`).setDisplaySize(size, size);
        const x = side === 'left' ? 56 : UI_W - 56;
        const box = this.add.container(x, 392, [g, img]).setAlpha(0);
        if (!this.d.reduce) box.setScale(0.8);
        this.tweens.add({ targets: box, alpha: 1, scale: 1, duration: 160, ease: 'Back.easeOut' });
        this.ui.add(box);
        this.faces.set(side, { obj: box, until });
    }

    /** Some com o que é passageiro (letreiro, fala, retrato): no corte de cenário, no toque e no fim. */
    private clearTransient() {
        for (const w of this.titleWords) w.destroy();
        this.titleWords = [];
        this.titleUntil = Infinity;
        this.typing = null;
        this.sayUntil = Infinity;
        this.boxTween?.stop();
        this.box?.setAlpha(0);
        for (const f of this.faces.values()) f.obj.destroy();
        this.faces.clear();
    }

    /** A cada quadro: digita a fala (bipe a cada 2 letras), segue os holofotes, tira o que passou do tempo. */
    private tick() {
        const now = this.elapsed;
        if (this.typing) {
            const n = Math.min(this.typing.full.length, Math.floor((now - this.typing.from) / 28));
            if (n > this.typing.shown) {
                if (Math.floor(n / 2) > Math.floor(this.typing.shown / 2) && this.typing.full[n - 1] !== ' ') bip();
                this.typing.shown = n;
                this.boxText.setText(this.typing.full.slice(0, n));
            }
        }
        if (now >= this.sayUntil) {
            this.sayUntil = Infinity;
            this.typing = null;
            this.fadeBox(0, 150);
        }
        if (now >= this.titleUntil) {
            this.titleUntil = Infinity;
            const words = this.titleWords;
            this.titleWords = [];
            this.tweens.add({
                targets: words,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    for (const w of words) w.destroy();
                },
            });
        }
        for (const [side, f] of this.faces) {
            if (now < f.until) continue;
            this.faces.delete(side);
            this.tweens.add({ targets: f.obj, alpha: 0, duration: 150, onComplete: () => f.obj.destroy() });
        }
        for (const [id, light] of this.spots) {
            const a = this.actors.get(id);
            if (a) light.setPosition(Math.round(a.x), Math.round(a.y));
        }
    }

    private playSound(s: Extract<Step, { do: 'sound' }>) {
        const gain = s.gain ?? 1;
        if ('sfx' in s) playSfx(s.sfx);
        else if ('sample' in s) playSample(s.sample, gain);
        else if ('crowd' in s) playCrowd(s.crowd, gain);
        else playCry(s.cry, this.d.cries, gain);
    }

    /** Arte própria na grade do PMD (src/game/story-art.ts), pintada uma vez por jogo. */
    private makeTextures() {
        const add = (key: string, make: () => HTMLCanvasElement) => {
            if (!this.textures.exists(key)) this.textures.addCanvas(key, make());
        };
        for (const t of ['red', 'blue', 'oak']) add(`story-trainer-${t}`, () => trainerArt(t));
        add('story-ball', ballArt);
        add('story-pokeball', pokeballArt);
        add('story-spot', spotArt);
        // sombra por tamanho: 0 = bola, 1..3 = shadowSize do PMD
        [7, 12, 16, 20].forEach((w, i) => {
            add(`story-shadow-${i}`, () => shadowArt(w));
        });
    }
}

/** Bipe curto da letra (Red/Blue). Volume pelo ZZFX.volume, o mesmo dos efeitos. */
function bip() {
    try {
        zzfx(0.25, 0, 620, 0, 0.01, 0.02, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0);
    } catch {
        // áudio ainda bloqueado pelo navegador
    }
}
