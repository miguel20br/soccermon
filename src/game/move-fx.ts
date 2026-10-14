import Phaser from 'phaser';

/**
 * Animações de golpe por "estilo": antes todo golpe do mesmo tipo era igual (Thunder Shock = Thunder).
 * Cada golpe cai num estilo (raio, jato, do céu, terremoto, explosão, onda, corpo a corpo, som, nuvem, aura,
 * projétil) e o tipo dá a cor e a partícula. Tudo é efêmero (tween que se destrói no fim).
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

const STYLE_BY_MOVE: Record<string, FxStyle> = {
    // raios
    hyperbeam: 'beam',
    solarbeam: 'beam',
    icebeam: 'beam',
    psybeam: 'beam',
    aurorabeam: 'beam',
    bubblebeam: 'beam',
    triattack: 'beam',
    dragonrage: 'beam',
    thunderbolt: 'beam',
    psychic: 'beam',
    dreameater: 'beam',
    nightshade: 'beam',
    psywave: 'beam',
    // jatos
    flamethrower: 'stream',
    hydropump: 'stream',
    watergun: 'stream',
    firespin: 'stream',
    ember: 'stream',
    bubble: 'stream',
    acid: 'stream',
    absorb: 'stream',
    megadrain: 'stream',
    spikecannon: 'stream',
    pinmissile: 'stream',
    twineedle: 'stream',
    razorleaf: 'stream',
    petaldance: 'stream',
    payday: 'stream',
    // do céu
    thunder: 'sky',
    blizzard: 'sky',
    rockslide: 'sky',
    skyattack: 'sky',
    // chão
    earthquake: 'quake',
    fissure: 'quake',
    dig: 'quake',
    stomp: 'quake',
    bonemerang: 'projectile',
    // explosões
    explosion: 'explosion',
    selfdestruct: 'explosion',
    fireblast: 'explosion',
    metronome: 'explosion',
    sonicboom: 'explosion',
    // onda
    surf: 'wave',
    waterfall: 'wave',
    crabhammer: 'wave',
    // som
    sing: 'sound',
    supersonic: 'sound',
    screech: 'sound',
    growl: 'sound',
    roar: 'sound',
    lovelykiss: 'sound',
    // nuvem
    sleeppowder: 'cloud',
    poisonpowder: 'cloud',
    stunspore: 'cloud',
    spore: 'cloud',
    poisongas: 'cloud',
    smog: 'cloud',
    sludge: 'cloud',
    smokescreen: 'cloud',
    hypnosis: 'sound',
    glare: 'beam',
    confuseray: 'projectile',
    thunderwave: 'beam',
};

/** Estilo do golpe: tabela acima, senão pelo efeito (golpe físico = corpo a corpo, suporte = aura). */
export function fxStyle(moveId: string, kind: string): FxStyle {
    if (STYLE_BY_MOVE[moveId]) return STYLE_BY_MOVE[moveId];
    if (kind === 'strike') return 'melee';
    if (kind === 'buff' || kind === 'burst' || kind === 'heal') return 'aura';
    return 'projectile';
}

/** Partículas extras carregadas além das do tipo. */
export const EXTRA_FX = ['fist', 'foot', 'petal', 'rock2', 'rock3', 'shine', 'wisp', 'hitmarker', 'leaf2', 'iceball'];

export interface FxContext {
    scene: Phaser.Scene;
    from: { x: number; y: number };
    to: { x: number; y: number } | null;
    color: number;
    /** Textura da partícula do tipo (ou null se não carregou). */
    key: string | null;
    depth: number;
    strong: boolean;
    moveId: string;
    /** Chamado no instante em que o golpe acerta (anel de impacto + alvo pisca). */
    onHit: (x: number, y: number) => void;
}

const fade = (scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject, props: object, duration: number) =>
    scene.tweens.add({ targets: obj, ...props, duration, onComplete: () => obj.destroy() });

function particle(c: FxContext, x: number, y: number, scale = 0.6, name: string | null = c.key) {
    // partículas extras vêm pelo nome do arquivo ('rock2'); a do tipo já vem com o prefixo da textura
    const key = name && !name.startsWith('fx-') ? `fx-${name}` : name;
    if (!key || !c.scene.textures.exists(key)) {
        return c.scene.add
            .circle(x, y, 6 * scale * 1.6, c.color, 0.9)
            .setDepth(c.depth)
            .setBlendMode('ADD');
    }
    return c.scene.add.image(x, y, key).setDepth(c.depth).setScale(scale).setTint(c.color).setBlendMode('ADD');
}

/** Toca a animação do golpe. Devolve quanto tempo (ms) até o acerto. */
export function playMoveFx(style: FxStyle, c: FxContext): number {
    const { scene, from, depth, color } = c;
    const to = c.to;
    switch (style) {
        case 'beam': {
            if (!to) return aura(c);
            const g = scene.add.graphics().setDepth(depth).setBlendMode('ADD');
            const w = c.strong ? 14 : 9;
            g.lineStyle(w, color, 0.85).lineBetween(from.x, from.y, to.x, to.y);
            g.lineStyle(w * 0.35, 0xffffff, 1).lineBetween(from.x, from.y, to.x, to.y);
            g.setAlpha(0);
            scene.tweens.add({
                targets: g,
                alpha: 1,
                duration: 90,
                yoyo: true,
                hold: 260,
                onComplete: () => g.destroy(),
            });
            scene.time.delayedCall(120, () => c.onHit(to.x, to.y));
            return 120;
        }
        case 'stream': {
            if (!to) return aura(c);
            const n = c.strong ? 12 : 8;
            for (let i = 0; i < n; i++) {
                scene.time.delayedCall(i * 35, () => {
                    const p = particle(c, from.x, from.y, 0.45);
                    const jx = Phaser.Math.Between(-8, 8);
                    const jy = Phaser.Math.Between(-8, 8);
                    scene.tweens.add({
                        targets: p,
                        x: to.x + jx,
                        y: to.y + jy,
                        scale: 0.8,
                        duration: 260,
                        ease: 'Quad.easeIn',
                        onComplete: () => fade(scene, p, { alpha: 0, scale: 1.2 }, 160),
                    });
                });
            }
            scene.time.delayedCall(300, () => c.onHit(to.x, to.y));
            return 300;
        }
        case 'sky': {
            const at = to ?? from;
            const bolts = c.strong ? 5 : 3;
            for (let i = 0; i < bolts; i++) {
                scene.time.delayedCall(i * 90, () => {
                    const x = at.x + Phaser.Math.Between(-22, 22);
                    if (c.moveId === 'thunder') {
                        // raio em zigue-zague caindo do alto
                        const g = scene.add.graphics().setDepth(depth).setBlendMode('ADD');
                        g.lineStyle(4, 0xfff6a0, 1)
                            .beginPath()
                            .moveTo(x, at.y - 170);
                        let y = at.y - 170;
                        let xx = x;
                        while (y < at.y - 4) {
                            y += 22;
                            xx += Phaser.Math.Between(-10, 10);
                            g.lineTo(xx, Math.min(y, at.y));
                        }
                        g.strokePath();
                        fade(scene, g, { alpha: 0 }, 260);
                    } else {
                        const p = particle(c, x - 40, at.y - 160, 0.6);
                        scene.tweens.add({
                            targets: p,
                            x,
                            y: at.y,
                            angle: 180,
                            duration: 280,
                            ease: 'Quad.easeIn',
                            onComplete: () => fade(scene, p, { alpha: 0, scale: 1.3 }, 160),
                        });
                    }
                });
            }
            scene.cameras.main.flash(120, 255, 255, 255, false);
            scene.time.delayedCall(300, () => c.onHit(at.x, at.y));
            return 300;
        }
        case 'quake': {
            scene.cameras.main.shake(c.strong ? 520 : 320, c.strong ? 0.012 : 0.007);
            for (let i = 0; i < 3; i++) {
                const ring = scene.add
                    .ellipse(from.x, from.y + 10, 30, 12)
                    .setStrokeStyle(6, 0x2a1808, 0.85)
                    .setDepth(depth - 1);
                ring.setScale(0.4);
                scene.tweens.add({
                    targets: ring,
                    scale: 4 + i,
                    alpha: 0,
                    delay: i * 140,
                    duration: 560,
                    onComplete: () => ring.destroy(),
                });
            }
            for (let i = 0; i < 6; i++) {
                const rock = particle(c, from.x, from.y + 6, 0.4, 'rock2');
                fade(
                    scene,
                    rock,
                    { x: from.x + Phaser.Math.Between(-60, 60), y: from.y - Phaser.Math.Between(10, 40), alpha: 0 },
                    520,
                );
            }
            if (to) scene.time.delayedCall(260, () => c.onHit(to.x, to.y));
            return 260;
        }
        case 'explosion': {
            const at = to && c.moveId !== 'explosion' && c.moveId !== 'selfdestruct' ? to : from;
            const delay = at === from ? 0 : projectile(c, 260);
            scene.time.delayedCall(delay, () => {
                const ball = scene.add.circle(at.x, at.y, 14, color, 0.9).setDepth(depth).setBlendMode('ADD');
                const core = scene.add.circle(at.x, at.y, 9, 0xffffff, 1).setDepth(depth + 1);
                fade(scene, ball, { scale: c.strong ? 6 : 4, alpha: 0 }, 520);
                fade(scene, core, { scale: 3, alpha: 0 }, 300);
                for (let i = 0; i < 10; i++) {
                    const ang = (i / 10) * Math.PI * 2;
                    const p = particle(c, at.x, at.y, 0.4);
                    fade(scene, p, { x: at.x + Math.cos(ang) * 70, y: at.y + Math.sin(ang) * 45, alpha: 0 }, 520);
                }
                scene.cameras.main.shake(260, 0.01);
                if (to) c.onHit(to.x, to.y);
            });
            return delay;
        }
        case 'wave': {
            const dir = to ? Math.atan2(to.y - from.y, to.x - from.x) : 0;
            const band = scene.add
                .ellipse(from.x, from.y, 26, 90, color, 0.55)
                .setDepth(depth)
                .setRotation(dir)
                .setBlendMode('ADD');
            const crest = scene.add
                .ellipse(from.x, from.y, 10, 90, 0xffffff, 0.8)
                .setDepth(depth + 1)
                .setRotation(dir);
            const tx = to ? to.x : from.x + 120;
            const ty = to ? to.y : from.y;
            for (const obj of [band, crest]) fade(scene, obj, { x: tx, y: ty, scaleY: 1.6, alpha: 0 }, 520);
            if (to) scene.time.delayedCall(360, () => c.onHit(to.x, to.y));
            return 360;
        }
        case 'melee': {
            if (!to) return aura(c);
            scene.time.delayedCall(140, () => {
                const g = scene.add.graphics().setDepth(depth + 2);
                g.lineStyle(4, 0xffffff, 1);
                g.lineBetween(to.x - 14, to.y - 14, to.x + 14, to.y + 14);
                g.lineBetween(to.x - 14, to.y + 6, to.x + 14, to.y - 18);
                fade(scene, g, { alpha: 0 }, 300);
                const hit = particle(c, to.x, to.y, c.strong ? 0.9 : 0.6, /punch|kick/.test(c.moveId) ? 'fist' : c.key);
                fade(scene, hit, { scale: 1.4, alpha: 0 }, 300);
                c.onHit(to.x, to.y);
            });
            return 140;
        }
        case 'sound': {
            for (let i = 0; i < 4; i++) {
                scene.time.delayedCall(i * 130, () => {
                    const ring = scene.add.circle(from.x, from.y, 12).setStrokeStyle(3, color, 0.9).setDepth(depth);
                    fade(scene, ring, { scale: 5, alpha: 0 }, 640);
                });
            }
            const note = scene.add
                .text(from.x + 10, from.y - 18, c.moveId === 'lovelykiss' ? '♥' : '♪', {
                    fontSize: '22px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                })
                .setDepth(depth + 1);
            fade(scene, note, { y: from.y - 60, alpha: 0 }, 900);
            if (to) scene.time.delayedCall(400, () => c.onHit(to.x, to.y));
            return 400;
        }
        case 'cloud': {
            const at = to ?? from;
            for (let i = 0; i < 7; i++) {
                const p = particle(c, from.x, from.y, 0.5, 'wisp');
                p.setAlpha(0.8);
                fade(
                    scene,
                    p,
                    {
                        x: at.x + Phaser.Math.Between(-24, 24),
                        y: at.y + Phaser.Math.Between(-20, 10),
                        scale: 1.4,
                        alpha: 0,
                    },
                    700 + i * 40,
                );
            }
            if (to) scene.time.delayedCall(450, () => c.onHit(to.x, to.y));
            return 450;
        }
        case 'aura':
            return aura(c);
        default: {
            if (!to) return aura(c);
            return projectile(c, 380);
        }
    }
}

/** Projétil do tipo até o alvo (o estilo antigo). */
function projectile(c: FxContext, duration: number): number {
    const { scene, from, to, depth } = c;
    if (!to) return 0;
    const fx = particle(c, from.x, from.y - 2, c.strong ? 0.9 : 0.7);
    const trail = scene.time.addEvent({
        delay: 30,
        repeat: Math.ceil(duration / 30),
        callback: () => {
            const d = scene.add.circle(fx.x, fx.y, 6, c.color, 0.7).setDepth(depth).setBlendMode('ADD');
            fade(scene, d, { alpha: 0, scale: 0.2 }, 300);
        },
    });
    scene.tweens.add({
        targets: fx,
        x: to.x,
        y: to.y,
        scale: c.strong ? 1.3 : 1,
        duration,
        ease: 'Quad.easeIn',
        onComplete: () => {
            trail.remove();
            c.onHit(fx.x, fx.y);
            fade(scene, fx, { alpha: 0, scale: 1.8 }, 250);
        },
    });
    return duration;
}

/** Brilho subindo em volta de quem usou (reforço, arrancada, cura). */
function aura(c: FxContext): number {
    const { scene, from } = c;
    for (let i = 0; i < 8; i++) {
        const p = particle(c, from.x + Phaser.Math.Between(-16, 16), from.y + 8, 0.35, 'shine');
        fade(scene, p, { y: from.y - 40 - Phaser.Math.Between(0, 20), alpha: 0 }, 600 + i * 50);
    }
    const ring = scene.add
        .ellipse(from.x, from.y + 10, 40, 14)
        .setStrokeStyle(3, c.color, 1)
        .setDepth(c.depth - 1);
    fade(scene, ring, { scale: 2, alpha: 0 }, 600);
    return 0;
}
