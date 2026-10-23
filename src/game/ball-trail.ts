import type Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';

/**
 * Rastro da bola chutada com golpe: cada tipo solta a sua partícula (fogo sobe e apaga, água pinga, elétrico
 * faz faísca em zigue-zague, planta solta folha…). Uma partícula por chamada; quem chama controla a frequência.
 * Só visual: nada aqui toca o motor.
 */
type Spawn = (s: Phaser.Scene, x: number, y: number, c: number, d: number) => void;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const fade = (s: Phaser.Scene, o: Phaser.GameObjects.GameObject, props: object, ms: number) =>
    s.tweens.add({ targets: o, alpha: 0, ...props, duration: ms, ease: 'Quad.easeOut', onComplete: () => o.destroy() });

const SPAWN: Record<string, Spawn> = {
    fire: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-3, 3), y + rnd(-2, 2), rnd(2.5, 4.5), Math.random() < 0.5 ? c : 0xffd23f, 0.9);
        fade(s, p.setDepth(d), { y: y - rnd(8, 14), scale: 0.2 }, 380);
    },
    water: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-3, 3), y, rnd(1.5, 3), c, 0.85);
        fade(s, p.setDepth(d), { y: y + rnd(6, 10) }, 420);
    },
    electric: (s, x, y, _c, d) => {
        const g = s.add.graphics().setDepth(d);
        g.lineStyle(2, 0xfff27a, 1);
        let px = x;
        let py = y;
        g.beginPath();
        g.moveTo(px, py);
        for (let i = 0; i < 3; i++) {
            px += rnd(-7, 7);
            py += rnd(-7, 7);
            g.lineTo(px, py);
        }
        g.strokePath();
        fade(s, g, {}, 160);
    },
    grass: (s, x, y, c, d) => {
        const p = s.add.ellipse(x, y, 6, 3, c, 0.95).setRotation(rnd(0, Math.PI));
        fade(s, p.setDepth(d), { x: x + rnd(-10, 10), y: y + rnd(-6, 6), rotation: p.rotation + rnd(-2, 2) }, 520);
    },
    ice: (s, x, y, _c, d) => {
        const p = s.add.rectangle(x, y, 4, 4, 0xc8f4ff, 0.95).setRotation(Math.PI / 4);
        fade(s, p.setDepth(d), { scale: 1.6 }, 600);
    },
    psychic: (s, x, y, c, d) => {
        const p = s.add.circle(x, y, 3).setStrokeStyle(1.5, c, 0.9);
        fade(s, p.setDepth(d), { scale: 3.2 }, 420);
    },
    ghost: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-4, 4), y, rnd(3, 5), c, 0.45);
        fade(s, p.setDepth(d), { y: y - rnd(10, 16), x: x + rnd(-6, 6) }, 640);
    },
    poison: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-4, 4), y + rnd(-2, 2), rnd(2, 3.5)).setStrokeStyle(1.5, c, 0.9);
        fade(s, p.setDepth(d), { y: y - rnd(6, 10), scale: 1.5 }, 480);
    },
    ground: (s, x, y, c, d) => {
        const p = s.add.rectangle(x + rnd(-3, 3), y, rnd(2, 4), rnd(2, 4), c, 0.9);
        fade(s, p.setDepth(d), { y: y + rnd(5, 9), rotation: rnd(-2, 2) }, 420);
    },
    rock: (s, x, y, c, d) => SPAWN.ground(s, x, y, c, d),
    flying: (s, x, y, _c, d) => {
        const g = s.add.graphics().setDepth(d);
        g.lineStyle(1.5, 0xffffff, 0.8);
        const len = rnd(6, 11);
        g.lineBetween(x - len, y + rnd(-4, 4), x + len, y + rnd(-4, 4));
        fade(s, g, {}, 240);
    },
    fighting: (s, x, y, c, d) => {
        const p = s.add.triangle(x, y, 0, 6, 3, 0, 6, 6, c, 0.9).setRotation(rnd(0, Math.PI * 2));
        fade(s, p.setDepth(d), { scale: 1.8 }, 300);
    },
    bug: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-5, 5), y + rnd(-5, 5), 1.6, c, 0.95);
        fade(s, p.setDepth(d), { x: x + rnd(-12, 12), y: y + rnd(-12, 12) }, 500);
    },
    dragon: (s, x, y, c, d) => {
        const p = s.add.circle(x + rnd(-3, 3), y + rnd(-3, 3), rnd(4, 6), c, 0.7);
        fade(s, p.setDepth(d), { scale: 0.1, y: y - rnd(4, 8) }, 460);
    },
    normal: (s, x, y, _c, d) => {
        const p = s.add.star(x + rnd(-4, 4), y + rnd(-4, 4), 4, 1, 3, 0xffffff, 0.95);
        fade(s, p.setDepth(d), { scale: 0.2, rotation: 1 }, 320);
    },
};

/** Partícula usada pelo tipo (o motor manda 'Fire'; antes caía tudo na estrelinha do Normal). */
export const trailKind = (type: string): string => (SPAWN[type.toLowerCase()] ? type.toLowerCase() : 'normal');

/** Uma partícula do rastro do tipo `type` na posição da bola. */
export function trailParticle(scene: Phaser.Scene, type: string, x: number, y: number, depth: number) {
    const spawn = SPAWN[trailKind(type)];
    spawn(scene, x, y, hexToNumber(TYPE_COLOR[type] ?? '#ffffff'), depth);
}

/** Explosão do tipo no gol de golpe: um anel grande e uma rajada das partículas do próprio tipo. */
export function typeBurst(scene: Phaser.Scene, type: string, x: number, y: number, depth: number) {
    const c = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
    const ring = scene.add.circle(x, y, 10).setStrokeStyle(5, c, 1).setDepth(depth);
    scene.tweens.add({
        targets: ring,
        scale: 6,
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        trailParticle(scene, type, x + Math.cos(a) * 14, y + Math.sin(a) * 9, depth);
    }
}
