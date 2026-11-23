import Phaser from 'phaser';
import type { HumanDriver, PlayInput } from '../../engine/controllers/human-input';
import type { LiveRunner } from '../../engine/runners/live-runner';
import type { Vec2 } from '../../engine/vec';
import {
    animForAction,
    atlasKey,
    createSpeciesAnims,
    footOrigin,
    preloadSpecies,
    resolveAnim,
    skinOf,
} from '../animation-manager';
import { drawCourt, ensureBallTexture, GAME_H, GAME_W, PPM, toPx } from '../court';
import { WOOD } from '../court-themes';
import { BASE_SPRITE_SCALE } from '../quality';

export interface PlaySceneData {
    runner: LiveRunner;
    driver: HumanDriver;
    input: PlayInput;
    colors: [number, number];
}

interface View {
    skin: number;
    sprite: Phaser.GameObjects.Sprite;
    shadow: Phaser.GameObjects.Ellipse;
    ring: Phaser.GameObjects.Ellipse;
    key: string;
}

const TICK_MS = 50;
/** Indicador do controlado: amarelo do capitão (o C· das etiquetas da partida). */
const MINE = 0xffd447;

/**
 * Modo jogável (prévia, `?lab=jogavel`): a partida roda aqui ao vivo, um tick do motor a cada 50 ms (1x), com o
 * controle virando Command no tick (`HumanDriver`). A câmera segue o controlado. Desenho enxuto: sprites, sombra,
 * anel do time e bola; os lances especiais (golpe máximo, cinemáticas) ficam pra depois.
 */
export class PlayScene extends Phaser.Scene {
    private d!: PlaySceneData;
    private views: View[] = [];
    private ball!: Phaser.GameObjects.Image;
    private ballShadow!: Phaser.GameObjects.Ellipse;
    private marker!: Phaser.GameObjects.Triangle;
    private acc = 0;
    private prev: Vec2[] = [];
    private prevBall = { x: 0, y: 0, z: 0 };

    constructor() {
        super('Play');
    }

    init(data: PlaySceneData) {
        this.d = data;
    }

    preload() {
        const s = this.d.runner.state;
        const insts = [...s.players.map((p) => p.inst), ...s.teams.flatMap((t) => t.setup.bench)];
        for (const i of insts) preloadSpecies(this, skinOf(i.speciesId, i.shiny));
    }

    create() {
        const s = this.d.runner.state;
        drawCourt(this, WOOD, 2, false);
        ensureBallTexture(this);
        this.ballShadow = this.add.ellipse(0, 0, 12, 5, 0x000000, 0.35);
        this.ball = this.add.image(0, 0, 'ball').setScale(0.7);
        this.marker = this.add
            .triangle(0, 0, 0, 0, 12, 0, 6, 8, MINE)
            .setStrokeStyle(1.5, 0x000000, 0.9)
            .setDepth(9000);
        for (const p of s.players) {
            const ring = this.add.ellipse(0, 0, 26, 11).setStrokeStyle(2.5, this.d.colors[p.team], 0.95);
            const shadow = this.add.ellipse(0, 0, 20, 8, 0x000000, 0.3);
            const sprite = this.add.sprite(0, 0, '__DEFAULT').setScale(BASE_SPRITE_SCALE);
            this.views.push({ skin: -1, sprite, shadow, ring, key: '' });
        }
        this.snapPrev();
        const cam = this.cameras.main;
        cam.setBounds(0, 0, GAME_W, GAME_H);
        cam.roundPixels = true;
        const frame = () => {
            const { width, height } = this.scale.gameSize;
            // ~14 m de largura no celular em pé, até ~26 m no PC; nunca menos de 10 m de altura
            const meters = Math.min(26, Math.max(14, width / 55));
            cam.setZoom(Math.min(width / (meters * PPM), height / (10 * PPM)));
        };
        frame();
        this.scale.on('resize', frame);
        this.sys.events.once('shutdown', () => this.scale.off('resize', frame));
        const c = s.players[this.d.driver.controlled].pos;
        const px = toPx(c.x, c.y);
        cam.centerOn(px.x, px.y);
        if (import.meta.env.DEV || __SMOKE__) (window as unknown as { __play?: unknown }).__play = this;
    }

    private snapPrev() {
        const s = this.d.runner.state;
        this.prev = s.players.map((p) => ({ x: p.pos.x, y: p.pos.y }));
        this.prevBall = { x: s.ball.pos.x, y: s.ball.pos.y, z: s.ball.z };
    }

    update(_time: number, delta: number) {
        const { runner, driver, input } = this.d;
        // aba em segundo plano: não tenta alcançar o tempo perdido de uma vez
        this.acc += Math.min(delta, 250);
        while (this.acc >= TICK_MS && !runner.finished) {
            this.snapPrev();
            driver.step(input);
            this.acc -= TICK_MS;
        }
        this.draw(runner.finished ? 1 : this.acc / TICK_MS);
    }

    private draw(t: number) {
        const s = this.d.runner.state;
        const lerp = (a: number, b: number) => a + (b - a) * t;
        for (const p of s.players) {
            const view = this.views[p.idx];
            const from = this.prev[p.idx] ?? p.pos;
            const at = toPx(lerp(from.x, p.pos.x), lerp(from.y, p.pos.y));
            const skin = skinOf(p.inst.speciesId, p.inst.shiny);
            // troca de espécie (substituição, evolução, Ditto): só com a folha já carregada
            if (skin !== view.skin && this.textures.exists(atlasKey(skin))) {
                createSpeciesAnims(this, skin);
                view.skin = skin;
                view.key = '';
            }
            if (view.skin >= 0) {
                const anim = resolveAnim(view.skin, animForAction(p.action));
                const key = `${view.skin}/${anim}/${p.facing}`;
                if (key !== view.key && this.anims.exists(key)) {
                    view.sprite.play(key).setOrigin(0.5, footOrigin(view.skin, anim));
                    view.key = key;
                }
            }
            view.sprite.setPosition(Math.round(at.x), Math.round(at.y)).setDepth(at.y);
            view.shadow.setPosition(at.x, at.y + 1).setDepth(at.y - 2);
            const mine = p.idx === this.d.driver.controlled;
            view.ring
                .setPosition(at.x, at.y + 1)
                .setDepth(at.y - 1)
                .setStrokeStyle(mine ? 3.5 : 2.5, mine ? MINE : this.d.colors[p.team], 0.95);
            if (mine) this.follow(at, view);
        }
        const b = { x: lerp(this.prevBall.x, s.ball.pos.x), y: lerp(this.prevBall.y, s.ball.pos.y) };
        const z = lerp(this.prevBall.z, s.ball.z);
        const bp = toPx(b.x, b.y);
        this.ballShadow.setPosition(bp.x, bp.y + 2).setDepth(bp.y - 2);
        this.ball.setPosition(bp.x, bp.y - 4 - z * PPM).setDepth(bp.y + 1);
    }

    /** Seta em cima do controlado e a câmera indo atrás dele (puxando um pouco pra bola). */
    private follow(at: { x: number; y: number }, view: View) {
        const top = at.y - view.sprite.displayHeight * view.sprite.originY - 6;
        this.marker.setPosition(at.x - 6, top - 8);
        const s = this.d.runner.state;
        const ball = toPx(s.ball.pos.x, s.ball.pos.y);
        const cam = this.cameras.main;
        const tx = at.x * 0.75 + ball.x * 0.25;
        const ty = at.y * 0.75 + ball.y * 0.25;
        const k = 0.12;
        cam.centerOn(cam.midPoint.x + (tx - cam.midPoint.x) * k, cam.midPoint.y + (ty - cam.midPoint.y) * k);
    }
}
