import type Phaser from 'phaser';
import { FUTSAL_5 } from '../engine/config';
import { type CourtTheme, drawFloor, WOOD } from './court-themes';

export const PPM = 22; // pixels por metro
export const MARGIN = 44;
export const { length: L, width: W, goalWidth: GW } = FUTSAL_5.pitch;
export const GAME_W = L * PPM + MARGIN * 2;
export const GAME_H = W * PPM + MARGIN * 2;

export const toPx = (x: number, y: number) => ({ x: MARGIN + x * PPM, y: MARGIN + y * PPM });

/**
 * Quadra da partida: o Graphics (~26 mil comandos) vira textura uma vez e entra como imagem; desenhado direto, o
 * Phaser refazia a malha dele em todo quadro (~30% da thread com CPU 4x). A textura tem o dobro da resolução pros
 * zooms dos lances (até 1.6) continuarem nítidos.
 */
export function drawCourt(scene: Phaser.Scene, theme: CourtTheme = WOOD) {
    const key = 'court-baked';
    const bake = () => {
        const g = courtGraphics(scene, theme).setScale(COURT_RES);
        if (scene.textures.exists(key)) scene.textures.remove(key);
        scene.textures
            .addDynamicTexture(key, GAME_W * COURT_RES, GAME_H * COURT_RES)
            ?.draw(g)
            .render();
        g.destroy();
    };
    bake();
    const img = scene.add
        .image(0, 0, key)
        .setOrigin(0)
        .setScale(1 / COURT_RES)
        .setDepth(-1000);
    // o contexto WebGL perdido (celular em segundo plano, memória) apaga a textura desenhada: refaz quando ele volta
    const renderer = scene.renderer;
    const restore = () => {
        bake();
        img.setTexture(key);
    };
    renderer.on('restorewebgl', restore);
    scene.events.once('shutdown', () => renderer.off('restorewebgl', restore));
    return img;
}
const COURT_RES = 2;

/**
 * Quadra de futsal com a bola no círculo central (a pokébola como símbolo saiu, brand guide): madeira por padrão,
 * ou a do ginásio (`COURTS` em court-themes.ts). Um Graphics só (o lab de quadras tira foto dele; a partida usa
 * `drawCourt`).
 */
export function courtGraphics(scene: Phaser.Scene, theme: CourtTheme = WOOD) {
    const g = scene.add.graphics();
    const tl = toPx(0, 0);
    const box = { x: tl.x - 14, y: tl.y - 14, w: L * PPM + 28, h: W * PPM + 28 };
    g.fillStyle(theme.surround, 1).fillRect(0, 0, GAME_W, GAME_H);
    if (theme.rim === undefined) drawFloor(g, theme.floor, box);
    else {
        g.fillStyle(theme.rim, 1).fillRect(box.x, box.y, box.w, box.h);
        drawFloor(g, theme.floor, { x: tl.x, y: tl.y, w: L * PPM, h: W * PPM });
    }
    theme.decor?.(g, box, { w: GAME_W, h: GAME_H });
    g.fillStyle(theme.area, theme.areaAlpha);
    areaPath(g, 0, true);
    areaPath(g, 1, true);

    g.lineStyle(2, 0xffffff, 0.95);
    g.strokeRect(tl.x, tl.y, L * PPM, W * PPM);
    const mid = toPx(L / 2, W / 2);
    g.lineBetween(mid.x, tl.y, mid.x, tl.y + W * PPM);
    g.strokeCircle(mid.x, mid.y, 3 * PPM);
    // a bola de futsal pintada no meio: disco claro, o pentágono do centro e as 5 costuras
    const R = 2.2 * PPM;
    const vx = (i: number, r: number) => mid.x + r * Math.sin((i * 2 * Math.PI) / 5);
    const vy = (i: number, r: number) => mid.y - r * Math.cos((i * 2 * Math.PI) / 5);
    g.fillStyle(0xffffff, 0.35).fillCircle(mid.x, mid.y, R);
    g.fillStyle(0x0e1430, 0.4).beginPath();
    for (let i = 0; i < 5; i++) g[i ? 'lineTo' : 'moveTo'](vx(i, 0.42 * R), vy(i, 0.42 * R));
    g.closePath().fillPath();
    g.lineStyle(2, 0x0e1430, 0.4);
    for (let i = 0; i < 5; i++) g.lineBetween(vx(i, 0.42 * R), vy(i, 0.42 * R), vx(i, R), vy(i, R));
    g.lineStyle(2, 0xffffff, 0.95).strokeCircle(mid.x, mid.y, R);

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
    return g;
}

/**
 * Faixa da torcida (pano com dois paus) na beira de cima da quadra, no meio da metade do time (o time 0 defende a
 * esquerda). Grande o bastante pra ler a 390 px: ocupa a margem e a sobra do piso, sem passar da linha lateral.
 */
export function drawBanner(scene: Phaser.Scene, team: 0 | 1, text: string, color: number, ink: number) {
    const h = 34;
    const y = 8;
    const half = (L * PPM) / 2;
    const label = scene.add
        .text(0, 0, text, {
            fontFamily: 'Galmuri11, monospace',
            fontSize: '30px',
            color: `#${ink.toString(16).padStart(6, '0')}`,
        })
        .setOrigin(0.5)
        .setResolution(3)
        .setDepth(-998);
    const w = Math.min(half - 20, label.width + 28);
    label.setScale(Math.min(1, (w - 16) / label.width));
    const x = MARGIN + team * half + (half - w) / 2;
    label.setPosition(x + w / 2, y + h / 2 + 1);
    const g = scene.add.graphics().setDepth(-999);
    g.fillStyle(0x2b1a0e, 1)
        .fillRect(x - 4, y - 3, 4, h + 8)
        .fillRect(x + w, y - 3, 4, h + 8);
    // pano: bordas em onda e dobras
    const n = 14;
    // fillPoints só lê x e y (o tipo pede Vector2)
    type Pts = Phaser.Math.Vector2[];
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) pts.push({ x: x + (i * w) / n, y: y + Math.sin(i * 0.9 + team * 2) * 1.6 });
    for (let i = n; i >= 0; i--) pts.push({ x: x + (i * w) / n, y: y + h + Math.sin(i * 0.9 + team * 2 + 1) * 1.6 });
    g.fillStyle(0x000000, 0.35).fillPoints(pts.map((p) => ({ x: p.x, y: p.y + 3 })) as Pts, true);
    g.fillStyle(color, 1).fillPoints(pts as Pts, true);
    for (let i = 1; i < 6; i++) g.fillStyle(0x000000, 0.1).fillRect(x + (i * w) / 6 - 3, y, 6, h);
}

/**
 * Placas de patrocínio (Patrocínios da copa, src/engine/sponsors.ts) na beira de cima da metade do rival (na Copa o
 * rival não tem faixa): cor da marca, nome curto em branco e um brilho de LED. Ficam embaixo dos jogadores.
 */
export function drawBoards(scene: Phaser.Scene, boards: readonly { text: string; color: number }[]) {
    const h = 34;
    const y = 8;
    const half = (L * PPM) / 2;
    const gap = 10;
    const w = Math.min(200, (half - 20 - gap * (boards.length - 1)) / boards.length);
    const x0 = MARGIN + half + (half - (w * boards.length + gap * (boards.length - 1))) / 2;
    const g = scene.add.graphics().setDepth(-999);
    boards.forEach((b, i) => {
        const x = x0 + i * (w + gap);
        g.fillStyle(0x000000, 0.4).fillRect(x, y + 3, w, h);
        g.fillStyle(b.color, 1).fillRect(x, y, w, h);
        g.fillStyle(0xffffff, 0.2).fillRect(x, y, w, 5);
        g.fillStyle(0x000000, 0.2).fillRect(x, y + h - 5, w, 5);
        const label = scene.add
            .text(x + w / 2, y + h / 2 + 1, b.text, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '24px',
                fontStyle: 'bold italic',
                color: '#ffffff',
            })
            .setOrigin(0.5)
            .setResolution(3)
            .setDepth(-998);
        label.setScale(Math.min(1, (w - 12) / label.width));
    });
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
