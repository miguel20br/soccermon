import Phaser from 'phaser';
import { GAME_H, GAME_W } from './court';

/**
 * Efeitos cinematográficos da partida:
 * - holofote: escurece a quadra e ilumina quem usou o golpe (e o alvo), com a faixa do nome do golpe;
 * - câmera lenta: multiplicador de velocidade que volta suave ao normal;
 * - drama: texto gigante ("NA TRAAAVE!", "GOOOOOL!", "QUE DEFESA!") com zoom e tremida.
 * A cena consulta `focused` para desenhar os Pokémon em destaque acima do escurecimento.
 */
export const FOCUS_DEPTH = 7100;

type Pinnable = Phaser.GameObjects.Container;

export class Cinematics {
    readonly focused = new Set<number>();
    private readonly dim: Phaser.GameObjects.Rectangle;
    private readonly spots = new Map<number, Phaser.GameObjects.Image>();
    private banner: Phaser.GameObjects.Container | null = null;
    private readonly pins = new Map<Pinnable, { sx: number; sy: number; scale: number }>();
    private spotlightUntil = 0;
    private slowFrom = 0;
    private slowUntil = 0;
    private slowValue = 1;
    /** Escala extra para textos quando a tela é pequena (celular). */
    uiScale = 1;

    constructor(private readonly scene: Phaser.Scene) {
        this.dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W * 2, GAME_H * 2, 0x05060f, 0).setDepth(7000);
        if (!scene.textures.exists('spotlight')) {
            const size = 256;
            const tex = scene.textures.createCanvas('spotlight', size, size);
            const ctx = tex?.getContext();
            if (ctx && tex) {
                const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
                g.addColorStop(0, 'rgba(255,255,255,0.9)');
                g.addColorStop(0.35, 'rgba(255,255,240,0.45)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, size, size);
                tex.refresh();
            }
        }
    }

    /** Multiplicador de velocidade atual (1 = normal). */
    speedFactor(now: number): number {
        if (now >= this.slowUntil) return 1;
        // segura o lento e volta suave nos últimos 35% do efeito
        const total = this.slowUntil - this.slowFrom;
        const t = (now - this.slowFrom) / total;
        if (t < 0.65) return this.slowValue;
        const k = (t - 0.65) / 0.35;
        return this.slowValue + (1 - this.slowValue) * k * k;
    }

    slowMotion(now: number, value: number, durationMs: number) {
        const until = now + durationMs;
        if (until > this.slowUntil || value < this.speedFactor(now)) {
            this.slowFrom = now;
            this.slowUntil = until;
            this.slowValue = value;
        }
    }

    get spotlightActive() {
        return this.scene.time.now < this.spotlightUntil;
    }

    /** Holofote em quem usou o golpe (+ alvo), faixa com o nome e câmera lenta. */
    spotlight(opts: {
        focus: { idx: number; x: number; y: number }[];
        color: number;
        moveName: string;
        userName: string;
        durationMs?: number;
    }) {
        const now = this.scene.time.now;
        const duration = opts.durationMs ?? 950;
        const extending = this.spotlightActive;
        this.spotlightUntil = Math.max(this.spotlightUntil, now + duration);
        for (const f of opts.focus) this.focused.add(f.idx);

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.add({ targets: this.dim, fillAlpha: 0.58, duration: extending ? 60 : 160 });

        for (const [i, f] of opts.focus.entries()) {
            // o mesmo Pokémon já em foco reaproveita a luz dele
            if (this.spots.has(f.idx)) continue;
            const spot = this.scene.add
                .image(f.x, f.y - 14, 'spotlight')
                .setDepth(FOCUS_DEPTH - 50)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setTint(i === 0 ? 0xffffff : opts.color)
                .setScale(0)
                .setAlpha(0.95);
            this.scene.tweens.add({ targets: spot, scale: i === 0 ? 0.75 : 0.55, duration: 180, ease: 'Back.easeOut' });
            this.spots.set(f.idx, spot);
        }
        this.showBanner(opts.userName, opts.moveName, opts.color, duration);
        this.slowMotion(now, 0.3, duration);
        this.scene.time.delayedCall(duration, () => {
            if (this.scene.time.now + 5 < this.spotlightUntil) return; // outro golpe estendeu o holofote
            this.clearSpotlight();
        });
    }

    /** Atualiza a posição das luzes para acompanhar os Pokémon em destaque. */
    followSpots(positions: Map<number, { x: number; y: number }>) {
        for (const [idx, spot] of this.spots) {
            const p = positions.get(idx);
            if (p) spot.setPosition(p.x, p.y - 14);
        }
    }

    private clearSpotlight() {
        this.focused.clear();
        this.scene.tweens.add({ targets: this.dim, fillAlpha: 0, duration: 250 });
        for (const spot of this.spots.values()) {
            this.scene.tweens.add({ targets: spot, alpha: 0, duration: 250, onComplete: () => spot.destroy() });
        }
        this.spots.clear();
    }

    // ------------------------------------------------------------------ textos presos na tela
    /**
     * Prende um objeto a uma posição da TELA (coordenadas 0..GAME_W × 0..GAME_H), compensando pan e zoom
     * da câmera: textos de interface não crescem nem saem de quadro quando a câmera aproxima do lance.
     */
    pin(obj: Pinnable, sx: number, sy: number, scale = 1) {
        this.pins.set(obj, { sx, sy, scale });
        this.applyPin(obj);
    }

    unpin(obj: Pinnable) {
        this.pins.delete(obj);
    }

    updatePins() {
        for (const obj of this.pins.keys()) {
            if (!obj.active) this.pins.delete(obj);
            else this.applyPin(obj);
        }
    }

    private applyPin(obj: Pinnable) {
        const pin = this.pins.get(obj);
        if (!pin) return;
        const cam = this.scene.cameras.main;
        const view = cam.worldView;
        const z = cam.zoom || 1;
        // antes do primeiro render o worldView ainda está zerado
        const vx = view.width > 0 ? view.x : 0;
        const vy = view.height > 0 ? view.y : 0;
        obj.setPosition(vx + pin.sx / z, vy + pin.sy / z);
        obj.setScale(pin.scale / z);
    }

    /** Faixa compacta com o nome do golpe, no canto superior esquerdo (não cobre o lance). */
    private showBanner(userName: string, moveName: string, color: number, duration: number) {
        this.banner?.destroy();
        const s = Math.min(this.uiScale, 1.3);
        const small = this.scene.add
            .text(0, 0, `${userName.toUpperCase()} usou`, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: `${Math.round(14 * s)}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            })
            .setOrigin(0, 0.5)
            .setResolution(2);
        const big = this.scene.add
            .text(0, 0, moveName.toUpperCase(), {
                fontFamily: 'Galmuri11, monospace',
                fontSize: `${Math.round(22 * s)}px`,
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5,
            })
            .setOrigin(0, 0.5)
            .setResolution(2);
        const pad = 12 * s;
        const w = Math.max(small.width, big.width) + pad * 2;
        const h = 54 * s;
        small.setPosition(pad, h * 0.3);
        big.setPosition(pad, h * 0.66);
        const g = this.scene.add.graphics();
        g.fillStyle(0x0d1024, 0.92).fillRoundedRect(-3, -3, w + 6, h + 6, 10);
        g.fillStyle(color, 1).fillRoundedRect(0, 0, w, h, 8);
        g.fillStyle(0xffffff, 0.18).fillRoundedRect(0, 0, w, h / 2, { tl: 8, tr: 8, bl: 0, br: 0 });
        // conteúdo animado dentro de um container preso à tela
        const inner = this.scene.add.container(0, 0, [g, small, big]).setAlpha(0);
        inner.x = -24;
        const banner = this.scene.add.container(0, 0, [inner]).setDepth(9500);
        this.banner = banner;
        this.pin(banner, 14, 14);
        this.scene.tweens.add({ targets: inner, x: 0, alpha: 1, duration: 200, ease: 'Back.easeOut' });
        this.scene.tweens.add({
            targets: inner,
            alpha: 0,
            delay: Math.max(400, duration - 200),
            duration: 220,
            onComplete: () => banner.destroy(),
        });
    }

    /** Texto grande de drama no alto da tela (a câmera centraliza o lance; o texto não o cobre). */
    drama(text: string, opts: { color: string; stroke: string; at?: { x: number; y: number }; sub?: string }) {
        const now = this.scene.time.now;
        this.slowMotion(now, 0.25, 1100);
        this.banner?.destroy();
        this.banner = null;
        const cam = this.scene.cameras.main;
        if (opts.at) {
            cam.pan(opts.at.x, opts.at.y, 220, 'Sine.easeOut', true);
            cam.zoomTo(1.18, 220, 'Sine.easeOut', true);
            this.scene.time.delayedCall(1000, () => {
                cam.pan(GAME_W / 2, GAME_H / 2, 450, 'Sine.easeInOut', true);
                cam.zoomTo(1, 450, 'Sine.easeInOut', true);
            });
        }
        cam.shake(380, 0.006);
        // cabe na largura da quadra mesmo no celular
        const s = Math.min(this.uiScale, 1.1, (GAME_W * 0.9) / (text.length * 42));
        const t = this.scene.add
            .text(0, 0, text, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: `${Math.round(60 * s)}px`,
                fontStyle: 'bold',
                color: opts.color,
                stroke: opts.stroke,
                strokeThickness: 10,
            })
            .setOrigin(0.5)
            .setScale(0.2)
            .setResolution(2);
        const children: Phaser.GameObjects.GameObject[] = [t];
        if (opts.sub) {
            const sub = this.scene.add
                .text(0, 40 * s, opts.sub, {
                    fontFamily: 'Galmuri11, monospace',
                    fontSize: `${Math.round(17 * s)}px`,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                })
                .setOrigin(0.5)
                .setAlpha(0)
                .setResolution(2);
            this.scene.tweens.add({ targets: sub, alpha: 1, delay: 180, duration: 200 });
            children.push(sub);
        }
        const holder = this.scene.add.container(0, 0, children).setDepth(9800);
        this.pin(holder, GAME_W / 2, GAME_H * 0.17);
        // entra esticado na horizontal e "assenta"
        this.scene.tweens.add({ targets: t, scaleX: 1.12, scaleY: 1, duration: 240, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: t, scaleX: 1, delay: 240, duration: 280, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({
            targets: children,
            alpha: 0,
            delay: 1250,
            duration: 330,
            onComplete: () => holder.destroy(),
        });
    }
}
