import Phaser from 'phaser';
import { atlasKey, createSpeciesAnims, footOrigin, preloadSpecies, resolveAnim, skinOf } from '../animation-manager';
import { EventBus } from '../EventBus';
import { CUP_X, LIGA_X, ROOM_H, ROOM_SPOTS, ROOM_W, type RoomSpot } from '../room-spots';

export { ROOM_H, ROOM_W } from '../room-spots';

import {
    type Metal,
    paintBanner,
    paintBelt,
    paintCup,
    paintGlass,
    paintMedal,
    paintPedestal,
    paintPins,
    paintPolaroid,
} from '../room-art';

/**
 * Sala de troféus em pixel art (docs/planos/sala-brainstorm.md): o quarto de noite com a luz 2D do Phaser (holofote em
 * cone em cada vitrine, lareira, abajur, TV, luar), móveis do Modern Interiors (LimeZu, versão grátis, uso não
 * comercial; public/assets/room/mi), troféus pintados por código (src/game/room-art.ts) e o seu Pokémon (sprite do
 * Mystery Dungeon, o mesmo da quadra) passeando. Tocar num objeto avisa a tela (`room:pick`); a tela manda
 * `room:focus` e a câmera aproxima dele com o resto escurecido.
 */

export interface RoomSceneData {
    night: boolean;
    club: string;
    cups: Record<Metal, number>;
    days: Record<Metal, number>;
    weeks: number;
    belts: boolean[];
    platinum: boolean;
    pins: number[];
    polaroids: { speciesId: number; shiny: boolean }[];
    cards: number;
    tv: { speciesId: number; shiny: boolean } | null;
    mon: { speciesId: number; shiny: boolean };
    /** Objetos com novidade (brilho piscando em cima). */
    fresh: string[];
}

/** Recortes do Interiors_free_32x32.png (x, y, w, h). */
const MI: Record<string, [number, number, number, number]> = {
    window: [228, 914, 56, 42],
    frame: [320, 850, 24, 32],
    cork: [6, 1312, 52, 26],
    lamp: [352, 1774, 30, 50],
    fireplace: [288, 2752, 64, 80],
    cabinetGlass: [292, 1568, 54, 54],
    bookshelf: [160, 448, 64, 64],
    plantTree: [334, 1426, 36, 62],
    plantPalm: [426, 1408, 46, 62],
    plantSmall: [386, 1444, 28, 46],
    rug: [424, 356, 80, 120],
    bench: [256, 576, 96, 52],
    tvCabinet: [234, 432, 76, 42],
    tv: [6, 468, 52, 36],
    desk: [320, 1236, 60, 108],
    painting: [4, 2324, 26, 30],
};

const FLOOR_Y = 76;

export class TrophyRoomScene extends Phaser.Scene {
    private room!: RoomSceneData;
    private dim!: Phaser.GameObjects.Rectangle;
    private spots = new Map<string, Phaser.GameObjects.GameObject[]>();
    private mon: Phaser.GameObjects.Sprite | null = null;
    private monKey = 0;
    private lights2: { light: Phaser.GameObjects.Light; base: number; flicker: number }[] = [];
    private focused: string | null = null;
    private outline!: Phaser.GameObjects.Graphics;
    private held = false;
    private holdTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('TrophyRoom');
    }

    init(data: RoomSceneData) {
        this.room = data;
    }

    preload() {
        this.load.image('mi', 'assets/room/mi/Interiors_free_32x32.png');
        this.load.image('mi-room', 'assets/room/mi/Room_Builder_free_32x32.png');
        // o Pokémon do avatar com a folha certa (shiny se o avatar é shiny)
        preloadSpecies(this, skinOf(this.room.mon.speciesId, this.room.mon.shiny));
        for (const p of [...this.room.polaroids, ...(this.room.tv ? [this.room.tv] : [])])
            if (!this.textures.exists(`card-${p.speciesId}`))
                this.load.image(`card-${p.speciesId}`, `assets/cards/${p.speciesId}.gif`);
    }

    create() {
        const d = this.room;
        const mi = this.textures.get('mi');
        for (const [k, [x, y, w, h]] of Object.entries(MI)) mi.add(k, 0, x, y, w, h);
        const room = this.textures.get('mi-room');
        room.add('wall', 0, 32, 416, 32, 64);
        room.add('floor', 0, 352, 416, 32, 32);
        /** Textura pintada por código (a mesma chave = o mesmo desenho: pinta uma vez só). */
        const canvasTex = (key: string, el: HTMLCanvasElement) => {
            if (!this.textures.exists(key)) this.textures.addCanvas(key, el);
            return key;
        };
        const lit = <T extends Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite>(o: T) => {
            o.setLighting(true);
            return o;
        };
        /** Objeto apoiado no chão: origem embaixo, profundidade pela base. */
        const put = (frame: string, x: number, bottom: number, tex = 'mi') =>
            lit(this.add.image(x, bottom, tex, frame).setOrigin(0, 1).setDepth(bottom));

        // ---- quarto: teto, parede de madeira, piso de taco em espinha, bordas
        lit(this.add.tileSprite(0, 12, ROOM_W, 64, 'mi-room', 'wall').setOrigin(0).setDepth(-20));
        lit(
            this.add
                .tileSprite(0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y, 'mi-room', 'floor')
                .setOrigin(0)
                .setDepth(-20),
        );
        this.add.rectangle(0, 0, ROOM_W, 12, 0x1c1a24).setOrigin(0).setDepth(-10);
        this.add.rectangle(0, 0, 6, ROOM_H, 0x1c1a24).setOrigin(0).setDepth(9000);
        this.add
            .rectangle(ROOM_W - 6, 0, 6, ROOM_H, 0x1c1a24)
            .setOrigin(0)
            .setDepth(9000);
        this.add
            .rectangle(0, ROOM_H - 6, ROOM_W, 6, 0x1c1a24)
            .setOrigin(0)
            .setDepth(9000);

        // ---- cada parte da sala fala de um assunto (docs/planos/sala-brainstorm.md): à esquerda o Hall da Fama e a
        // Platina, no centro a Copa e a Liga, à direita Copa do Dia, medalhas, cinturões e a Coleção, embaixo TV e PC
        const wall = (tex: string, x: number, y: number, frame?: string) =>
            lit(this.add.image(x, y, tex, frame).setOrigin(0).setDepth(-5));
        const zone = (id: RoomSpot, parts: Phaser.GameObjects.GameObject[]) => {
            const r = ROOM_SPOTS[id];
            const z = this.add
                .zone(r.x, r.y, r.w, r.h)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true })
                .setDepth(9500);
            // toque rápido abre; segurar mostra os nomes (aí soltar não abre)
            z.on('pointerup', () => {
                if (!this.held) EventBus.emit('room:pick', id);
            });
            z.on('pointerover', () => this.hover(id));
            z.on('pointerout', () => this.hover(null));
            this.spots.set(id, parts);
            if (d.fresh.includes(id)) this.sparkle(r.x + r.w - 3, r.y + 3);
        };

        // esquerda: lareira (enfeite), diploma, polaroids
        put('fireplace', 6, 122);
        zone('platina', [wall('mi', 104, 16, 'frame').setAlpha(d.platinum ? 1 : 0.5)]);
        const pol: Phaser.GameObjects.GameObject[] = [];
        d.polaroids.slice(0, 4).forEach((p, i) => {
            const x = 12 + i * 22;
            const y = 20 + (i % 2) * 3;
            pol.push(wall(canvasTex('polaroid', paintPolaroid()), x, y));
            if (this.textures.exists(`card-${p.speciesId}`))
                pol.push(
                    lit(
                        this.add
                            .image(x + 9, y + 9, `card-${p.speciesId}`)
                            .setDisplaySize(12, 12)
                            .setDepth(-4),
                    ),
                );
        });
        if (!pol.length) pol.push(wall(canvasTex('polaroid', paintPolaroid()), 12, 20).setAlpha(0.4));
        zone('hall', pol);
        put('lamp', 72, 120);

        // centro: faixa do clube, as 3 taças da Copa e a Liga
        zone('clube', [wall(canvasTex('banner', paintBanner(d.club)), 164, 14)]);
        const pedestalTex = canvasTex('pedestal', paintPedestal(26, 26));
        const glassTex = canvasTex('glass', paintGlass(28, 34));
        (['bronze', 'prata', 'ouro'] as Metal[]).forEach((m) => {
            const x = CUP_X[m];
            const base = lit(this.add.image(x, 120, pedestalTex).setOrigin(0.5, 1).setDepth(120));
            const cup = lit(
                this.add
                    .image(x, 95, canvasTex(`cup-${m}-${d.cups[m] > 0}`, paintCup(d.cups[m] ? m : 'ghost')))
                    .setOrigin(0.5, 1)
                    .setDepth(121),
            );
            const glass = this.add.image(x, 95, glassTex).setOrigin(0.5, 1).setDepth(122);
            zone(`copa-${m}`, [base, cup, glass]);
            if (d.cups[m]) this.spot(x, 0xffe9b8, 1.5);
        });
        const ligaBase = lit(
            this.add
                .image(LIGA_X, 122, canvasTex('pedestal-big', paintPedestal(34, 30)))
                .setOrigin(0.5, 1)
                .setDepth(122),
        );
        const ligaCup = lit(
            this.add
                .image(LIGA_X, 93, canvasTex('cup-liga', paintCup('ghost', true)))
                .setOrigin(0.5, 1)
                .setDepth(123),
        );
        const ligaGlass = this.add
            .image(LIGA_X, 93, canvasTex('glass-big', paintGlass(40, 48)))
            .setOrigin(0.5, 1)
            .setDepth(124);
        zone('liga', [ligaBase, ligaCup, ligaGlass]);

        // direita: cortiça da Copa do Dia, broches das medalhas, cinturões do Duelo
        const medals: Phaser.GameObjects.GameObject[] = [wall('mi', 262, 20, 'cork')];
        (['bronze', 'prata', 'ouro'] as Metal[]).forEach((m, i) => {
            medals.push(
                wall(
                    canvasTex(`medal-${m}-${d.days[m] > 0}`, paintMedal(d.days[m] ? m : 'ghost', d.club)),
                    268 + i * 15,
                    18,
                ).setScale(0.6),
            );
        });
        zone('dia', medals);
        zone('medalhas', [wall(canvasTex('pins', paintPins(d.pins)), 318, 16)]);
        zone(
            'duelo',
            [0, 1, 2].map((i) =>
                wall(
                    canvasTex(
                        `belt-${i}-${d.belts[i]}`,
                        paintBelt(d.belts[i] ? (['bronze', 'prata', 'ouro'] as Metal[])[i] : 'ghost'),
                    ),
                    366,
                    18 + i * 12,
                ),
            ),
        );

        // embaixo: TV (o último título) e PC (números); a Coleção fica no fundo, à direita
        lit(this.add.image(214, 186, 'mi', 'rug').setAngle(90).setScale(1.1).setDepth(-15));
        const tvCab = put('tvCabinet', 12, 238);
        const tv = put('tv', 24, 204);
        const tvParts: Phaser.GameObjects.GameObject[] = [tvCab, tv];
        if (d.tv && this.textures.exists(`card-${d.tv.speciesId}`))
            tvParts.push(
                this.add.image(50, 186, `card-${d.tv.speciesId}`).setDisplaySize(24, 24).setDepth(205).setAlpha(0.9),
            );
        zone('tv', tvParts);
        zone('numeros', [put('desk', 96, 240)]);
        put('plantSmall', 300, 242);
        put('plantPalm', 352, 248);
        zone('album', [put('cabinetGlass', 262, 122)]);
        zone('livros', [put('bookshelf', 318, 120)]);

        // contorno do que dá pra tocar (mouse em cima)
        this.outline = this.add.graphics().setDepth(9450);

        // segurar em qualquer lugar mostra o nome de tudo (a tela desenha os nomes)
        this.input.on('pointerdown', () => {
            this.held = false;
            this.holdTimer?.remove();
            this.holdTimer = this.time.delayedCall(450, () => {
                this.held = true;
                EventBus.emit('room:hold', true);
            });
        });
        this.input.on('pointerup', () => {
            this.holdTimer?.remove();
            if (this.held) EventBus.emit('room:hold', false);
            // o pointerup da zona roda antes: só agora zera
            this.time.delayedCall(0, () => {
                this.held = false;
            });
        });

        // ---- luz: noite (ou dia, pelo relógio)
        this.lights.enable().setAmbientColor(d.night ? 0x4a5080 : 0xd8d4cc);
        if (d.night) {
            this.lights2.push({ light: this.lights.addLight(38, 90, 140, 0xff8a3a, 1.6), base: 1.6, flicker: 0.35 });
            this.lights2.push({ light: this.lights.addLight(87, 78, 100, 0xffd08a, 1.2), base: 1.2, flicker: 0 });
            this.lights2.push({ light: this.lights.addLight(50, 186, 90, 0x6aa0ff, 1.1), base: 1.1, flicker: 0.2 });
            this.lights2.push({ light: this.lights.addLight(208, 140, 180, 0x9fb4ff, 0.5), base: 0.8, flicker: 0 });
            this.add.pointlight(38, 104, 0xff8a3a, 34, 0.25).setDepth(130);
            this.add.pointlight(87, 82, 0xffd08a, 22, 0.25).setDepth(130);
        }

        // a câmera nunca mostra fora do quarto (ao aproximar de um canto)
        this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);

        // ---- foco: o resto escurece e a câmera aproxima
        this.dim = this.add.rectangle(0, 0, ROOM_W, ROOM_H, 0x05060f, 0).setOrigin(0).setDepth(9400);
        const onFocus = (id: string | null) => this.focus(id);
        EventBus.on('room:focus', onFocus);
        this.events.once('shutdown', () => EventBus.off('room:focus', onFocus));
        this.events.once('destroy', () => EventBus.off('room:focus', onFocus));

        // ---- o seu Pokémon
        const skin = skinOf(d.mon.speciesId, d.mon.shiny);
        createSpeciesAnims(this, skin);
        if (this.textures.exists(atlasKey(skin))) {
            this.monKey = skin;
            this.mon = this.add.sprite(214, 180, atlasKey(this.monKey)).setScale(1.4).setDepth(220);
            this.mon.setLighting(true);
            this.wander();
        }
        EventBus.emit('room:ready');
    }

    /** Contorno claro no objeto debaixo do mouse (e o nome dele na tela). */
    private hover(id: RoomSpot | null) {
        this.outline.clear();
        EventBus.emit('room:hover', id);
        if (!id || this.focused) return;
        const r = ROOM_SPOTS[id];
        this.outline.lineStyle(1, 0xffd447, 0.9).strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }

    /** Brilho piscando (novidade) num canto do objeto. */
    private sparkle(x: number, y: number) {
        const key = 'sparkle';
        if (!this.textures.exists(key)) {
            const el = document.createElement('canvas');
            el.width = 7;
            el.height = 7;
            const c = el.getContext('2d')!;
            c.fillStyle = '#ffe36a';
            c.fillRect(3, 0, 1, 7);
            c.fillRect(0, 3, 7, 1);
            c.fillStyle = '#ffffff';
            c.fillRect(2, 2, 3, 3);
            this.textures.addCanvas(key, el);
        }
        const s = this.add.image(x, y, key).setDepth(9460);
        if (document.documentElement.dataset.reduceMotion !== 'true')
            this.tweens.add({
                targets: s,
                scale: { from: 0.6, to: 1.3 },
                alpha: { from: 0.5, to: 1 },
                duration: 700,
                yoyo: true,
                repeat: -1,
            });
    }

    /** Holofote em cone vindo do teto, apontado pra baixo, sobre uma vitrine. */
    private spot(x: number, color: number, intensity: number) {
        const l = this.lights.addLight(x, 40, 90, color, intensity).setCone(Math.PI / 2, 0.55, 1.1);
        this.lights2.push({ light: l, base: intensity, flicker: 0 });
    }

    /** Anda até um ponto do tapete, para um pouco e escolhe outro. À noite, depois das 22 h, dorme no tapete. */
    private wander() {
        const mon = this.mon;
        if (!mon || this.focused) return;
        const hour = new Date().getHours();
        if (this.room.night && (hour >= 22 || hour < 6)) {
            this.play('Sleep', 0);
            return;
        }
        const to = { x: Phaser.Math.Between(170, 290), y: Phaser.Math.Between(148, 218) };
        this.walkTo(to.x, to.y, () => {
            this.play('Idle', 0);
            this.time.delayedCall(Phaser.Math.Between(1800, 4200), () => this.wander());
        });
    }

    private walkTo(x: number, y: number, done: () => void) {
        const mon = this.mon;
        if (!mon) return;
        const dx = x - mon.x;
        const dy = y - mon.y;
        // direção do PMD: 0 = baixo, depois anti-horário em 45°
        const ang = Math.atan2(dy, dx);
        const dir = ((Math.round((Math.PI / 2 - ang) / (Math.PI / 4) + 8) % 8) + 8) % 8;
        this.play('Walk', dir);
        this.tweens.add({
            targets: mon,
            x,
            y,
            duration: (Math.hypot(dx, dy) / 40) * 1000,
            onUpdate: () => mon.setDepth(mon.y),
            onComplete: done,
        });
    }

    private play(anim: string, dir: number) {
        if (!this.mon) return;
        const a = resolveAnim(this.monKey, anim);
        this.mon.play(`${this.monKey}/${a}/${dir}`, true).setOrigin(0.5, footOrigin(this.monKey, a));
    }

    /** Foco num objeto: escurece o resto, traz o objeto pra frente e aproxima a câmera. `null` volta. */
    private focus(id: string | null) {
        const cam = this.cameras.main;
        const reduce = document.documentElement.dataset.reduceMotion === 'true';
        for (const parts of this.spots.values())
            for (const p of parts) (p as Phaser.GameObjects.Image).setData('lift', false);
        this.focused = id;
        const parts = id ? (this.spots.get(id) ?? []) : [];
        let bounds: Phaser.Geom.Rectangle | null = null;
        for (const p of parts) {
            const img = p as Phaser.GameObjects.Image;
            if (img.getData('depth0') === undefined) img.setData('depth0', img.depth);
            img.setDepth(9450 + (img.getData('depth0') as number) / 1000);
            const b = img.getBounds();
            bounds = bounds ? Phaser.Geom.Rectangle.Union(bounds, b) : b;
        }
        for (const [key, ps] of this.spots)
            if (key !== id)
                for (const p of ps) {
                    const img = p as Phaser.GameObjects.Image;
                    const d0 = img.getData('depth0');
                    if (d0 !== undefined) img.setDepth(d0 as number);
                }
        const dur = reduce ? 0 : 320;
        this.tweens.add({ targets: this.dim, fillAlpha: id ? 0.62 : 0, duration: dur, ease: 'Cubic.easeOut' });
        if (bounds) {
            const zoom = Phaser.Math.Clamp(
                Math.min(ROOM_W / (bounds.width * 2.6), ROOM_H / (bounds.height * 2.4)),
                1.2,
                3,
            );
            cam.pan(bounds.centerX, bounds.centerY, dur, 'Cubic.easeOut');
            cam.zoomTo(zoom, dur, 'Cubic.easeOut');
            // o Pokémon vai até lá olhar
            if (this.mon) {
                this.tweens.killTweensOf(this.mon);
                this.walkTo(
                    Phaser.Math.Clamp(bounds.centerX + 18, 30, ROOM_W - 30),
                    Phaser.Math.Clamp(bounds.bottom + 14, 130, ROOM_H - 20),
                    () => this.play('Idle', 4),
                );
            }
        } else {
            cam.pan(ROOM_W / 2, ROOM_H / 2, dur, 'Cubic.easeOut');
            cam.zoomTo(1, dur, 'Cubic.easeOut');
            this.time.delayedCall(dur + 200, () => this.wander());
        }
    }

    update(time: number) {
        for (const l of this.lights2)
            if (l.flicker)
                l.light.intensity =
                    l.base *
                    (1 - l.flicker / 2 + Math.sin(time / 90) * 0.15 * l.flicker + Math.random() * l.flicker * 0.5);
    }
}
