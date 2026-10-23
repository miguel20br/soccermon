import Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';
import { typeBurst } from './ball-trail';

/**
 * Desenho da reação de quem é atingido (src/game/hit-react.ts diz o quê): palavra, ícone de status com anel de
 * contagem, estrelinhas de tonto, poeira do tombo e a onda de choque do N3. Só tela.
 */

/** Cor do tipo clareada pra texto e ícone sobre a quadra (Fantasma, Dragão, Venenoso e Lutador somem no escuro). */
export function readableColor(type: string): number {
    const c = Phaser.Display.Color.IntegerToColor(hexToNumber(TYPE_COLOR[type] ?? '#ffffff'));
    const lum = (0.299 * c.red + 0.587 * c.green + 0.114 * c.blue) / 255;
    const k = lum < 0.55 ? 0.45 : 0.12;
    const mix = (v: number) => Math.round(v + (255 - v) * k);
    return Phaser.Display.Color.GetColor(mix(c.red), mix(c.green), mix(c.blue));
}

/** Cor de cada ícone de status (código do snapshot), a mesma do rótulo antigo. */
export const ICON_COLOR: Record<number, number> = {
    1: 0xffe14d,
    2: 0xcfd8ff,
    3: 0xd48cff,
    4: 0xff8a5c,
    5: 0xa8ecff,
    6: 0xff9ad0,
    7: 0xff8fc8,
};

const INK = 0x0d1024;

/**
 * Ícone de status desenhado (grade 24, raio `r`) com o anel de contagem regressiva: `frac` = quanto ainda falta (1 =
 * acabou de pegar, 0 = acabando). Nada de emoji nem caractere: tudo em Graphics.
 */
export function drawStatusIcon(
    g: Phaser.GameObjects.Graphics,
    code: number,
    x: number,
    y: number,
    r: number,
    frac: number,
) {
    const color = ICON_COLOR[code];
    if (!color) return;
    const u = r / 12;
    const P = (px: number, py: number) => new Phaser.Math.Vector2(x + px * u, y + py * u);
    g.fillStyle(INK, 0.92).fillCircle(x, y, r + 2.5 * u);
    g.lineStyle(2.6 * u, 0xffffff, 0.2).strokeCircle(x, y, r + 1.5 * u);
    if (frac > 0) {
        g.lineStyle(2.6 * u, color, 1).beginPath();
        g.arc(x, y, r + 1.5 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac), false);
        g.strokePath();
    }
    g.fillStyle(color, 1);
    g.lineStyle(2.4 * u, color, 1);
    switch (code) {
        case 1: // paralisia: raio
            g.fillPoints([P(2, -8), P(-5, 1), P(-0.5, 1), P(-2, 8), P(5, -1.5), P(0.5, -1.5)], true);
            break;
        case 2: // sono: dois Z
            g.strokePoints([P(-6, -4), P(1, -4), P(-6, 4), P(1, 4)]);
            g.lineStyle(1.8 * u, color, 1).strokePoints([P(3, -8), P(7, -8), P(3, -3), P(7, -3)]);
            break;
        case 3: // veneno: bolhas
            g.fillCircle(x - 2 * u, y + 2.5 * u, 4.2 * u);
            g.fillCircle(x + 4 * u, y - 3 * u, 2.6 * u);
            g.fillCircle(x - 3.5 * u, y - 5 * u, 1.7 * u);
            break;
        case 4: // queimadura: chama
            g.fillPoints([P(0, -8.5), P(4, -2), P(6, 3), P(3, 7.5), P(-3, 7.5), P(-6, 3), P(-4, -1), P(-1.5, 1)], true);
            g.fillStyle(INK, 1).fillPoints([P(0, 0), P(2.5, 4), P(0, 7), P(-2.5, 4)], true);
            break;
        case 5: // congelado: floco
            for (let k = 0; k < 3; k++) {
                const a = (k * Math.PI) / 3 + Math.PI / 2;
                g.lineBetween(
                    x - Math.cos(a) * 7.5 * u,
                    y - Math.sin(a) * 7.5 * u,
                    x + Math.cos(a) * 7.5 * u,
                    y + Math.sin(a) * 7.5 * u,
                );
            }
            break;
        case 6: {
            // confusão: espiral
            const pts: Phaser.Math.Vector2[] = [];
            for (let t = 0; t <= 1; t += 1 / 28) {
                const a = t * Math.PI * 4.5;
                pts.push(P(Math.cos(a) * (1 + 6.5 * t), Math.sin(a) * (1 + 6.5 * t)));
            }
            g.strokePoints(pts);
            break;
        }
        case 7: // apaixonado: coração
            g.fillCircle(x - 3 * u, y - 2 * u, 3.7 * u);
            g.fillCircle(x + 3 * u, y - 2 * u, 3.7 * u);
            g.fillTriangle(x - 6.6 * u, y - 0.6 * u, x + 6.6 * u, y - 0.6 * u, x, y + 7.5 * u);
            break;
    }
}

/** Três estrelinhas girando numa elipse em cima de quem está no chão ou tonto (`t` em ms). */
export function drawStars(g: Phaser.GameObjects.Graphics, x: number, y: number, u: number, t: number) {
    for (let k = 0; k < 3; k++) {
        const a = t / 260 + (k * Math.PI * 2) / 3;
        const sx = x + Math.cos(a) * 11 * u;
        const sy = y + Math.sin(a) * 3.5 * u;
        const pts: Phaser.Math.Vector2[] = [];
        for (let i = 0; i < 10; i++) {
            const r = (i % 2 ? 1.5 : 3.6) * u;
            const b = -Math.PI / 2 + (i * Math.PI) / 5 + t / 400;
            pts.push(new Phaser.Math.Vector2(sx + Math.cos(b) * r, sy + Math.sin(b) * r));
        }
        g.fillStyle(0xffe14d, Math.sin(a) > 0 ? 1 : 0.7).fillPoints(pts, true);
    }
}

/** Palavra em cima do atingido: entra num pulo de 200 ms, fica ~1 s e sobe sumindo em 250 ms. */
export function effectWord(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: number,
    s: number,
    depth: number,
): Phaser.GameObjects.Text {
    const w = scene.add
        .text(x, y, text, {
            fontFamily: 'Galmuri11, monospace',
            fontSize: `${Math.round(15 * s)}px`,
            fontStyle: 'bold',
            color: Phaser.Display.Color.IntegerToColor(color).rgba,
            stroke: '#000000',
            strokeThickness: 4,
        })
        .setOrigin(0.5, 1)
        .setDepth(depth)
        .setResolution(2)
        .setScale(0.6);
    // não corta na beira da quadra
    const v = scene.cameras.main.worldView;
    const half = w.width / 2 + 4;
    if (v.width > 2 * half) w.x = Phaser.Math.Clamp(w.x, v.x + half, v.right - half);
    scene.tweens.add({ targets: w, scale: 1, duration: 200, ease: 'Back.easeOut' });
    scene.tweens.add({
        targets: w,
        y: y - 12,
        alpha: 0,
        delay: 850,
        duration: 250,
        ease: 'Quad.easeIn',
        onComplete: () => w.destroy(),
    });
    return w;
}

/** Poeira do tombo, no pé de quem cai. */
export function dust(scene: Phaser.Scene, x: number, y: number, n: number, depth: number) {
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const p = scene.add.circle(x, y, 2 + Math.random() * 2, 0xe8d8b8, 0.75).setDepth(depth);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(a) * (12 + Math.random() * 8),
            y: y + Math.sin(a) * 4 - 2,
            alpha: 0,
            scale: 2,
            duration: 320 + Math.random() * 140,
            ease: 'Quad.easeOut',
            onComplete: () => p.destroy(),
        });
    }
}

/** Onda de choque do N3 no impacto: dois anéis, partículas do tipo e (sem "Reduzir movimento") um clarão. */
export function shockwave(scene: Phaser.Scene, x: number, y: number, type: string, depth: number, flash: boolean) {
    const c = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
    for (const [delay, width, color, to] of [
        [0, 7, c, 7],
        [70, 3, 0xffffff, 5],
    ]) {
        const ring = scene.add.circle(x, y, 12).setStrokeStyle(width, color, 1).setDepth(depth);
        scene.tweens.add({
            targets: ring,
            scale: to,
            alpha: 0,
            delay,
            duration: 520,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy(),
        });
    }
    if (flash) {
        const f = scene.add.circle(x, y, 24, 0xffffff, 0.9).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: f, scale: 3, alpha: 0, duration: 180, onComplete: () => f.destroy() });
    }
    for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const bit = scene.add.rectangle(x, y, 5, 5, k % 3 ? c : 0xffffff).setDepth(depth);
        scene.tweens.add({
            targets: bit,
            x: x + Math.cos(a) * 80,
            y: y + Math.sin(a) * 52,
            angle: 180,
            alpha: 0,
            duration: 480,
            ease: 'Quad.easeOut',
            onComplete: () => bit.destroy(),
        });
    }
    typeBurst(scene, type, x, y, depth);
}
