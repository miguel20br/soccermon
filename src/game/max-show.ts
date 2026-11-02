import Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';
import { trailParticle, typeBurst } from './ball-trail';

/**
 * O show do golpe máximo (pedido do Miguel, 01/11/2026: "as animações dos golpes N1 a N3 têm que ser beeem melhores; a
 * N3 um super hiper mega golpe especial"). Só tela, desenhado com shapes e as partículas do tipo (sem emoji): a carga no
 * capitão, o estouro do chute, a bola virando projétil do tipo, o impacto na chegada e, no N3, o fundo com a arte do
 * tipo. Identidade crescente: N1 dourado e curto, N2 na cor do tipo com onda, N3 a cena inteira. "Reduzir movimento":
 * nada gira nem pisca, os anéis só aparecem e somem.
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const colorOf = (type: string) => hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
const lighten = (c: number, k: number) => Phaser.Display.Color.IntegerToColor(c).lighten(k).color;

/** Carga (ms reais, a quadra parada) e o tamanho do estouro por nível. O N3 carrega na cena do especial. */
export const MAX_CHARGE_MS = { 1: 200, 2: 300 } as const;

/**
 * Carga no pé do capitão durante a parada (`ms`): anéis da cor do tipo fechando nele e (N2, N3) faíscas sugadas; no N3
 * a energia gira em volta dele a cena inteira.
 */
export function chargeFx(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    level: 1 | 2 | 3,
    ms: number,
    depth: number,
    reduce: boolean,
) {
    const c = colorOf(type);
    const rings = level === 1 ? 1 : level === 2 ? 2 : 4;
    for (let i = 0; i < rings; i++) {
        const ring = scene.add
            .circle(x, y, 10)
            .setStrokeStyle(level === 1 ? 3 : 4, i % 2 ? 0xffffff : c, 0.95)
            .setDepth(depth)
            .setScale(level === 3 ? 7 : 4.5)
            .setAlpha(0);
        scene.tweens.add({
            targets: ring,
            scale: 0.6,
            alpha: { from: 0.2, to: 1 },
            delay: (i * ms) / (rings + 1),
            duration: ms / (rings === 1 ? 1 : 1.6),
            ease: 'Quad.easeIn',
            onComplete: () => ring.destroy(),
        });
    }
    if (level === 1) return;
    // faíscas puxadas pro pé (o tipo carregando)
    const n = level === 2 ? 10 : 22;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd(0, 0.4);
        const r = rnd(40, level === 3 ? 110 : 70);
        const bit = scene.add
            .rectangle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, 4, 4, i % 3 ? c : 0xffffff)
            .setDepth(depth)
            .setRotation(a);
        scene.tweens.add({
            targets: bit,
            x,
            y,
            scale: 0.3,
            delay: rnd(0, ms * 0.5),
            duration: ms * 0.5,
            ease: 'Cubic.easeIn',
            onComplete: () => bit.destroy(),
        });
    }
    if (level !== 3 || reduce) return;
    // N3: energia girando em volta do capitão (duas órbitas inclinadas, cometas da cor do tipo e brancos)
    const g = scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    const t0 = scene.time.now;
    const spin = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
            const t = (scene.time.now - t0) / 1000;
            const k = Math.min(1, t / 0.3);
            g.clear();
            for (let o = 0; o < 2; o++) {
                const tilt = o ? 0.45 : 0.75;
                const rad = (34 + o * 14) * k;
                for (let j = 0; j < 3; j++) {
                    const a0 = t * (o ? -9 : 11) + (j * Math.PI * 2) / 3;
                    for (let s = 0; s < 8; s++) {
                        const a = a0 - s * 0.12;
                        g.fillStyle(s ? c : 0xffffff, (1 - s / 8) * 0.9);
                        g.fillCircle(x + Math.cos(a) * rad, y - 14 + Math.sin(a) * rad * tilt, 4.5 - s * 0.45);
                    }
                }
            }
            g.fillStyle(c, 0.25 + 0.1 * Math.sin(t * 40)).fillCircle(x, y - 14, 30 * k);
        },
    });
    scene.time.delayedCall(ms, () => {
        spin.remove();
        g.destroy();
    });
}

/**
 * O estouro do chute no pé (fim da carga): clarão, anel(éis) e linhas de velocidade saindo, crescendo com o nível. A
 * tremida e o clarão da tela ficam com quem chama (a câmera da cena).
 */
export function releaseFx(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    level: 1 | 2 | 3,
    depth: number,
    reduce: boolean,
) {
    const c = level === 1 ? 0xffd447 : colorOf(type);
    const size = level === 1 ? 1 : level === 2 ? 1.5 : 2.4;
    if (!reduce) {
        const f = scene.add
            .circle(x, y, 16 * size, 0xffffff, 0.95)
            .setDepth(depth)
            .setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: f, scale: 2.4, alpha: 0, duration: 200, onComplete: () => f.destroy() });
    }
    for (let i = 0; i < (level === 1 ? 1 : 2); i++) {
        const ring = scene.add
            .ellipse(x, y, 24, 14)
            .setStrokeStyle(i ? 3 : 6, i ? 0xffffff : c, 1)
            .setDepth(depth);
        scene.tweens.add({
            targets: ring,
            scale: 5 * size,
            alpha: 0,
            delay: i * 60,
            duration: 380 + 120 * level,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy(),
        });
    }
    // linhas de velocidade saindo do pé (o "BAM" desenhado)
    const g = scene.add.graphics().setDepth(depth);
    const n = 8 + level * 4;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd(-0.1, 0.1);
        const r0 = 14 * size;
        const r1 = r0 + rnd(22, 38) * size;
        g.lineStyle(i % 2 ? 2 : 3.5, i % 3 ? 0xffffff : c, 1);
        g.lineBetween(
            x + Math.cos(a) * r0,
            y + Math.sin(a) * r0 * 0.7,
            x + Math.cos(a) * r1,
            y + Math.sin(a) * r1 * 0.7,
        );
    }
    scene.tweens.add({ targets: g, alpha: 0, scale: 1.1, duration: 260, onComplete: () => g.destroy() });
    if (level >= 2)
        for (let i = 0; i < 4 * level; i++) trailParticle(scene, type, x + rnd(-10, 10), y + rnd(-8, 8), depth);
}

/**
 * Chegada do golpe (gol, defesa, trave, bloqueio): N1 um anel dourado com faíscas, N2 a onda do tipo, N3 a explosão (três
 * anéis grandes, estilhaços, a rajada do tipo e um clarão).
 */
export function impactFx(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    level: 1 | 2 | 3,
    depth: number,
    reduce: boolean,
) {
    const c = level === 1 ? 0xffd447 : colorOf(type);
    const rings = level === 3 ? 3 : level;
    for (let i = 0; i < rings; i++) {
        const ring = scene.add
            .circle(x, y, 10)
            .setStrokeStyle(level === 3 ? 8 - i * 2 : 5, i === 1 ? 0xffffff : c, 1)
            .setDepth(depth);
        scene.tweens.add({
            targets: ring,
            scale: (level === 3 ? 11 : 4 + level) - i * 1.5,
            alpha: 0,
            delay: i * 80,
            duration: 420 + level * 120,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy(),
        });
    }
    if (!reduce) {
        const f = scene.add
            .circle(x, y, 14 + level * 10, 0xffffff, 0.95)
            .setDepth(depth)
            .setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
            targets: f,
            scale: 2 + level,
            alpha: 0,
            duration: 160 + level * 60,
            onComplete: () => f.destroy(),
        });
    }
    const bits = 8 + level * 8;
    for (let k = 0; k < bits; k++) {
        const a = (k / bits) * Math.PI * 2 + rnd(-0.15, 0.15);
        const r = rnd(40, 70) * (0.7 + level * 0.45);
        const bit = scene.add
            .rectangle(x, y, 4 + level, 4 + level, k % 3 ? c : 0xffffff)
            .setDepth(depth)
            .setRotation(a);
        scene.tweens.add({
            targets: bit,
            x: x + Math.cos(a) * r,
            y: y + Math.sin(a) * r * 0.65,
            angle: 220,
            alpha: 0,
            duration: 420 + level * 80,
            ease: 'Quad.easeOut',
            onComplete: () => bit.destroy(),
        });
    }
    if (level >= 2) typeBurst(scene, type, x, y, depth);
    if (level === 3) typeBurst(scene, type, x + rnd(-14, 14), y + rnd(-10, 10), depth);
}

/**
 * A bola do golpe no ar, desenhada a cada quadro num Graphics (ADD) em volta dela: N1 brilho dourado com cauda curta, N2
 * cometa na cor do tipo, N3 o projétil do tipo (núcleo branco, cauda grossa e o enfeite do tipo: raios, chamas, anéis,
 * estilhaços orbitando). `vx`/`vy`: para onde a bola anda na tela (px por quadro, a cauda vai pro lado contrário).
 */
export function drawProjectile(
    g: Phaser.GameObjects.Graphics,
    type: string,
    level: 1 | 2 | 3,
    x: number,
    y: number,
    vx: number,
    vy: number,
    t: number,
    reduce: boolean,
) {
    const c = level === 1 ? 0xffd447 : colorOf(type);
    const light = lighten(c, 25);
    const pulse = reduce ? 0 : Math.sin(t / 60);
    const r = (level === 1 ? 9 : level === 2 ? 11 : 14) + pulse * (level + 1);
    const sp = Math.hypot(vx, vy);
    // cauda: triângulo atrás da bola, comprido e grosso conforme o nível
    if (sp > 0.3) {
        const ux = vx / sp;
        const uy = vy / sp;
        const len = (level === 1 ? 26 : level === 2 ? 48 : 80) * Math.min(1.4, 0.6 + sp / 8);
        const w = level === 1 ? 6 : level === 2 ? 10 : 16;
        for (const [k, col, al] of [
            [1, c, 0.5],
            [0.55, light, 0.7],
            [0.25, 0xffffff, 0.85],
        ] as const) {
            g.fillStyle(col, al);
            g.fillTriangle(
                x - uy * w * k,
                y + ux * w * k,
                x + uy * w * k,
                y - ux * w * k,
                x - ux * len * k * 1.2,
                y - uy * len * k * 1.2,
            );
        }
        if (level === 3) projectileDress(g, type, c, x, y, ux, uy, len, t, reduce);
    }
    g.fillStyle(c, 0.22).fillCircle(x, y, r * 1.9);
    g.fillStyle(c, 0.5).fillCircle(x, y, r);
    g.fillStyle(0xffffff, level === 3 ? 0.85 : 0.55).fillCircle(x, y, r * 0.45);
}

/** O enfeite do projétil N3 por família do tipo. */
function projectileDress(
    g: Phaser.GameObjects.Graphics,
    type: string,
    c: number,
    x: number,
    y: number,
    ux: number,
    uy: number,
    len: number,
    t: number,
    reduce: boolean,
) {
    const fam = FAMILY[type] ?? 'burst';
    const a0 = reduce ? 0 : t / 90;
    if (fam === 'bolt') {
        // raios estalando em volta da bola
        for (let b = 0; b < 3; b++) {
            const a = Math.random() * Math.PI * 2;
            let px = x;
            let py = y;
            g.lineStyle(2.5, b ? 0xfff27a : 0xffffff, 1)
                .beginPath()
                .moveTo(px, py);
            for (let j = 0; j < 4; j++) {
                px += Math.cos(a + rnd(-0.8, 0.8)) * 9;
                py += Math.sin(a + rnd(-0.8, 0.8)) * 9;
                g.lineTo(px, py);
            }
            g.strokePath();
        }
    } else if (fam === 'flame') {
        // labaredas ao longo da cauda, tremendo
        for (let i = 0; i < 6; i++) {
            const k = (i + 1) / 7;
            const bx = x - ux * len * k;
            const by = y - uy * len * k;
            const s = (1 - k) * 14 + rnd(0, 5);
            g.fillStyle(i % 2 ? 0xffd23f : c, 0.85);
            g.fillTriangle(
                bx - uy * s,
                by + ux * s,
                bx + uy * s,
                by - ux * s,
                bx - ux * s * 2 + rnd(-4, 4),
                by - uy * s * 2 - s,
            );
        }
    } else if (fam === 'ring') {
        for (let i = 0; i < 2; i++) {
            const rr = 18 + ((t / 8 + i * 12) % 24);
            g.lineStyle(2.5, i ? 0xffffff : c, 1 - (rr - 18) / 24).strokeEllipse(x, y, rr * 2, rr * 1.3);
        }
    } else {
        // estilhaços orbitando (gelo, pedra, folha, bolha, estrela, pena…)
        for (let i = 0; i < 5; i++) {
            const a = a0 + (i * Math.PI * 2) / 5;
            const px = x + Math.cos(a) * 22;
            const py = y + Math.sin(a) * 14;
            shard(g, fam, i % 2 ? 0xffffff : c, px, py, 5.5, a);
        }
    }
}

/** Uma peça do tipo (o desenho dos enfeites e do fundo do N3). */
function shard(g: Phaser.GameObjects.Graphics, fam: Family, col: number, x: number, y: number, s: number, a: number) {
    g.fillStyle(col, 0.95);
    if (fam === 'shard' || fam === 'rock') {
        const k = fam === 'rock' ? 1 : 0.55;
        g.fillPoints(
            [0, 1, 2, 3].map((i) => {
                const aa = a + (i * Math.PI) / 2;
                const rr = i % 2 ? s * k : s * 1.6;
                return new Phaser.Math.Vector2(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
            }),
            true,
        );
    } else if (fam === 'leaf') g.fillEllipse(x, y, s * 2.4, s * 1.1);
    else if (fam === 'bubble' || fam === 'wisp') {
        g.lineStyle(2, col, 0.9).strokeCircle(x, y, s);
        g.fillStyle(0xffffff, 0.6).fillCircle(x - s * 0.35, y - s * 0.35, s * 0.3);
    } else if (fam === 'heart') {
        g.fillCircle(x - s * 0.45, y - s * 0.2, s * 0.55);
        g.fillCircle(x + s * 0.45, y - s * 0.2, s * 0.55);
        g.fillTriangle(x - s, y, x + s, y, x, y + s * 1.1);
    } else {
        // estrela de 4 pontas (Normal, Lutador, Voador, Inseto, o resto)
        g.fillTriangle(x - s * 1.6, y, x + s * 1.6, y, x, y - s * 0.4);
        g.fillTriangle(x - s * 1.6, y, x + s * 1.6, y, x, y + s * 0.4);
        g.fillTriangle(x, y - s * 1.6, x, y + s * 1.6, x - s * 0.4, y);
        g.fillTriangle(x, y - s * 1.6, x, y + s * 1.6, x + s * 0.4, y);
    }
}

type Family =
    | 'flame'
    | 'wave'
    | 'bolt'
    | 'leaf'
    | 'shard'
    | 'rock'
    | 'ring'
    | 'bubble'
    | 'wisp'
    | 'heart'
    | 'burst'
    | 'wind';
/** Família do desenho de cada tipo (o fundo da cena e o enfeite do projétil N3). */
const FAMILY: Record<string, Family> = {
    Fire: 'flame',
    Dragon: 'flame',
    Water: 'wave',
    Electric: 'bolt',
    Grass: 'leaf',
    Bug: 'leaf',
    Ice: 'shard',
    Rock: 'rock',
    Ground: 'rock',
    Psychic: 'ring',
    Poison: 'bubble',
    Ghost: 'wisp',
    Fairy: 'heart',
    Normal: 'burst',
    Fighting: 'burst',
    Flying: 'wind',
    Steel: 'shard',
    Dark: 'wisp',
};

/**
 * Fundo da cena do especial N3 com a arte do tipo (Inazuma, Super de luta): por cima da cor escura do tipo, o desenho
 * dele andando pela tela inteira (chamas subindo, ondas, raios, folhas, cristais, anéis, bolhas, almas, corações,
 * estouros, vento) até `ms`. Fica entre o escurecimento e quem está em foco. "Reduzir movimento": parado e mais fraco.
 */
export function typeBackdrop(
    scene: Phaser.Scene,
    type: string,
    cx: number,
    cy: number,
    span: { w: number; h: number },
    ms: number,
    depth: number,
    reduce: boolean,
) {
    const c = colorOf(type);
    const light = lighten(c, 22);
    const fam = FAMILY[type] ?? 'burst';
    const g = scene.add.graphics().setDepth(depth).setAlpha(0);
    const n = 26;
    const seeds = Array.from({ length: n }, () => ({
        u: Math.random(),
        v: Math.random(),
        s: rnd(0.6, 1.4),
        p: rnd(0, 6.28),
    }));
    const x0 = cx - span.w / 2;
    const y0 = cy - span.h / 2;
    const t0 = scene.time.now;
    const draw = () => {
        const t = reduce ? 0 : (scene.time.now - t0) / 1000;
        g.clear();
        if (fam === 'wave') {
            for (let b = 0; b < 7; b++) {
                const yy = y0 + ((b + 0.5) / 7) * span.h;
                g.lineStyle(10, b % 2 ? light : 0xffffff, b % 2 ? 0.35 : 0.18).beginPath();
                for (let i = 0; i <= 24; i++) {
                    const xx = x0 + (i / 24) * span.w;
                    const yv = yy + Math.sin(i * 0.7 + t * 7 + b) * 10;
                    if (i) g.lineTo(xx, yv);
                    else g.moveTo(xx, yv);
                }
                g.strokePath();
            }
            return;
        }
        if (fam === 'wind') {
            for (const sd of seeds) {
                const xx = x0 + ((sd.u + t * 1.6 * sd.s) % 1) * span.w;
                const yy = y0 + sd.v * span.h;
                g.lineStyle(3 * sd.s, 0xffffff, 0.35).lineBetween(xx, yy, xx - 70 * sd.s, yy);
            }
            return;
        }
        if (fam === 'bolt') {
            for (let b = 0; b < 5; b++) {
                let px = x0 + Math.random() * span.w;
                let py = y0;
                g.lineStyle(b % 2 ? 3 : 6, b % 2 ? 0xffffff : light, 0.5)
                    .beginPath()
                    .moveTo(px, py);
                while (py < y0 + span.h) {
                    px += rnd(-24, 24);
                    py += rnd(14, 30);
                    g.lineTo(px, py);
                }
                g.strokePath();
            }
            return;
        }
        for (const sd of seeds) {
            // o resto anda: chamas e bolhas sobem, folhas e cristais caem girando, anéis pulsam, estouros piscam
            const up = fam === 'flame' || fam === 'bubble' || fam === 'wisp' || fam === 'heart';
            const flow = fam === 'ring' || fam === 'burst' ? 0 : (up ? -1 : 1) * t * 0.5 * sd.s;
            const vv = (((sd.v + flow) % 1) + 1) % 1;
            const xx = x0 + sd.u * span.w + (fam === 'leaf' ? Math.sin(t * 3 + sd.p) * 14 : 0);
            const yy = y0 + vv * span.h;
            const s = 9 * sd.s;
            if (fam === 'flame') {
                const h = s * (2.6 + Math.sin(t * 14 + sd.p) * 0.5);
                g.fillStyle(sd.p > 3 ? light : 0xffd23f, 0.42).fillTriangle(xx - s, yy, xx + s, yy, xx, yy - h);
            } else if (fam === 'ring') {
                const rr = (s * 2 + ((t * 60 * sd.s + sd.p * 10) % 40)) * 1.2;
                g.lineStyle(3, light, 0.4 * (1 - (rr / 1.2 - s * 2) / 40)).strokeEllipse(xx, yy, rr * 2, rr * 1.3);
            } else if (fam === 'burst') {
                const k = 0.5 + 0.5 * Math.sin(t * 9 + sd.p);
                shard(g, 'burst', k > 0.5 ? 0xffffff : light, xx, yy, s * (0.6 + k), sd.p);
            } else shard(g, fam, sd.p > 3 ? 0xffffff : light, xx, yy, s, sd.p + t * 2);
        }
    };
    draw();
    const timer = reduce ? null : scene.time.addEvent({ delay: 33, loop: true, callback: draw });
    scene.tweens.add({ targets: g, alpha: reduce ? 0.35 : 0.85, duration: 120 });
    scene.tweens.add({
        targets: g,
        alpha: 0,
        delay: Math.max(0, ms - 140),
        duration: 160,
        onComplete: () => {
            timer?.remove();
            g.destroy();
        },
    });
}
