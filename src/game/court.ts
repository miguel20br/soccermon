import type Phaser from 'phaser';
import { FUTSAL_5 } from '../engine/config';

export const PPM = 22; // pixels por metro
export const MARGIN = 44;
export const { length: L, width: W, goalWidth: GW } = FUTSAL_5.pitch;
export const GAME_W = L * PPM + MARGIN * 2;
export const GAME_H = W * PPM + MARGIN * 2;

export const toPx = (x: number, y: number) => ({ x: MARGIN + x * PPM, y: MARGIN + y * PPM });

/** Quadra de futsal em piso de madeira, com a pokébola no círculo central. */
export function drawCourt(scene: Phaser.Scene) {
    const g = scene.add.graphics();
    const tl = toPx(0, 0);
    g.fillStyle(0x7a4a2a, 1).fillRect(0, 0, GAME_W, GAME_H);
    g.fillStyle(0xc98a4f, 1).fillRect(tl.x - 14, tl.y - 14, L * PPM + 28, W * PPM + 28);
    for (let i = 0; i < (L * PPM + 28) / 24; i++) {
        g.fillStyle(i % 2 ? 0xc68649 : 0xcf9358, 1).fillRect(tl.x - 14 + i * 24, tl.y - 14, 24, W * PPM + 28);
    }
    g.fillStyle(0x3a7bd5, 0.55);
    areaPath(g, 0, true);
    areaPath(g, 1, true);

    g.lineStyle(2, 0xffffff, 0.95);
    g.strokeRect(tl.x, tl.y, L * PPM, W * PPM);
    const mid = toPx(L / 2, W / 2);
    g.lineBetween(mid.x, tl.y, mid.x, tl.y + W * PPM);
    g.strokeCircle(mid.x, mid.y, 3 * PPM);
    g.fillStyle(0xe8423f, 0.35)
        .slice(mid.x, mid.y, 2.2 * PPM, Math.PI, 0, false)
        .fillPath();
    g.fillStyle(0xffffff, 0.35)
        .slice(mid.x, mid.y, 2.2 * PPM, 0, Math.PI, false)
        .fillPath();
    g.lineStyle(2, 0xffffff, 0.95).lineBetween(mid.x - 2.2 * PPM, mid.y, mid.x + 2.2 * PPM, mid.y);
    g.fillStyle(0xffffff, 1).fillCircle(mid.x, mid.y, 0.55 * PPM);
    g.lineStyle(2, 0x333333, 0.6).strokeCircle(mid.x, mid.y, 0.55 * PPM);

    g.lineStyle(2, 0xffffff, 0.95);
    areaPath(g, 0, false);
    areaPath(g, 1, false);
    for (const side of [0, 1]) {
        const p1 = toPx(side === 0 ? 6 : L - 6, W / 2);
        const p2 = toPx(side === 0 ? 10 : L - 10, W / 2);
        g.fillStyle(0xffffff, 1).fillCircle(p1.x, p1.y, 2.5).fillCircle(p2.x, p2.y, 2.5);
        const top = toPx(side === 0 ? -1 : L, W / 2 - GW / 2);
        g.fillStyle(0xffffff, 0.25).fillRect(top.x, top.y, PPM, GW * PPM);
        g.lineStyle(1, 0xffffff, 0.5);
        for (let i = 1; i < 6; i++) {
            g.lineBetween(top.x, top.y + (i * GW * PPM) / 6, top.x + PPM, top.y + (i * GW * PPM) / 6);
        }
        g.lineStyle(3, 0xffffff, 1).strokeRect(top.x, top.y, PPM, GW * PPM);
    }
    g.setDepth(-1000);
}

/** Área do futsal: dois quartos de círculo de 6 m a partir das traves, unidos por um segmento. */
function areaPath(g: Phaser.GameObjects.Graphics, side: 0 | 1, fill: boolean) {
    const r = 6 * PPM;
    const postTop = toPx(side === 0 ? 0 : L, W / 2 - GW / 2);
    const postBot = toPx(side === 0 ? 0 : L, W / 2 + GW / 2);
    g.beginPath();
    g.moveTo(postTop.x, postTop.y - r);
    if (side === 0) {
        g.arc(postTop.x, postTop.y, r, -Math.PI / 2, 0, false);
        g.lineTo(postBot.x + r, postBot.y);
        g.arc(postBot.x, postBot.y, r, 0, Math.PI / 2, false);
    } else {
        g.arc(postTop.x, postTop.y, r, -Math.PI / 2, -Math.PI, true);
        g.lineTo(postBot.x - r, postBot.y);
        g.arc(postBot.x, postBot.y, r, Math.PI, Math.PI / 2, true);
    }
    if (fill) {
        g.lineTo(postBot.x, postBot.y + r);
        g.closePath();
        g.fillPath();
    } else {
        g.strokePath();
    }
}

/** Textura da bola de futsal (gerada uma vez). */
export function ensureBallTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('ball')) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const r = 8;
    g.fillStyle(0xffffff, 1).fillCircle(r + 1, r + 1, r);
    g.fillStyle(0x1d1d1d, 1);
    // pentágono central + "gomos" nas bordas
    const cx = r + 1;
    const cy = r + 1;
    const pent = Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return { x: cx + Math.cos(a) * 3.2, y: cy + Math.sin(a) * 3.2 };
    });
    g.fillPoints(pent as Phaser.Math.Vector2[], true);
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5;
        g.fillCircle(cx + Math.cos(a) * 7.2, cy + Math.sin(a) * 7.2, 1.8);
    }
    g.lineStyle(1.5, 0x222222, 1).strokeCircle(cx, cy, r);
    g.generateTexture('ball', r * 2 + 2, r * 2 + 2);
    g.destroy();
}
