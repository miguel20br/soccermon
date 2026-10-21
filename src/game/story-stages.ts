import type Phaser from 'phaser';
import type { StageId } from '../story/director';
import { COURTS, drawFloor } from './court-themes';

/**
 * Cenários das cenas do Modo história (src/story/director.ts), desenhados num Graphics como as quadras: sem imagem
 * nova. Palco em pé de 360×640 (vista de cima em 3/4, como o PMD): parede ou céu em cima, chão de `FLOOR` pra baixo.
 */
export const STAGE_W = 360;
export const STAGE_H = 640;
/** Onde começa o chão (px do palco). */
export const FLOOR = 230;

const hash = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

type G = Phaser.GameObjects.Graphics;

/** Escurece uma cor (o ginásio antigo, de luz apagada). */
const shade = (c: number, k: number) =>
    (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);

/** Parede de pedra do ginásio de Pewter (o ginásio continua ginásio: a quadra fica dentro dele). */
function gymWall(g: G, lit: boolean) {
    const tone = (c: number) => shade(c, lit ? 1 : 0.62);
    drawFloor(
        g,
        { kind: 'bricks', w: 40, h: 22, tones: [0x6e6253, 0x675b4d, 0x615648].map(tone), grout: tone(0x463d33) },
        { x: 0, y: 0, w: STAGE_W, h: FLOOR },
    );
    g.fillStyle(tone(0x3a322a), 1).fillRect(0, FLOOR - 10, STAGE_W, 10);
    // tochas
    for (const x of [46, 314]) {
        g.fillStyle(tone(0x3a2a1e), 1).fillRect(x - 3, 92, 6, 26);
        g.fillStyle(0xf0a030, lit ? 0.9 : 1).fillTriangle(x - 8, 92, x + 8, 92, x, 70);
        g.fillStyle(0xffe08a, 1).fillTriangle(x - 4, 92, x + 4, 92, x, 80);
    }
}

function gymFloor(g: G, lit: boolean) {
    const f = COURTS.brock.floor;
    if (f.kind !== 'bricks') return;
    const tone = (c: number) => shade(c, lit ? 1 : 0.6);
    drawFloor(g, { ...f, tones: f.tones.map(tone), grout: tone(f.grout) }, { x: 0, y: FLOOR, w: STAGE_W, h: STAGE_H });
}

/** Trave em 3/4: travessão e postes na linha do fundo, rede riscada. `lean` entorta o poste direito (a de madeira). */
function goal(g: G, x0: number, x1: number, color: number, lean = 0) {
    const top = FLOOR - 38;
    const bottom = FLOOR + 18;
    g.lineStyle(1, 0xffffff, 0.35);
    for (let x = x0 + 8; x < x1; x += 8) g.lineBetween(x, top + 4, x, bottom - 4);
    for (let y = top + 8; y < bottom; y += 8) g.lineBetween(x0 + 3, y, x1 - 3, y);
    g.fillStyle(0x000000, 0.25).fillRect(x0, bottom, x1 - x0 + 4, 4);
    g.fillStyle(color, 1);
    g.fillRect(x0 - 3, top, 6, bottom - top);
    g.fillPoints(
        [
            { x: x1 - 3, y: top + lean },
            { x: x1 + 3, y: top + lean },
            { x: x1 + 3 + lean, y: bottom },
            { x: x1 - 3 + lean, y: bottom },
        ] as Phaser.Math.Vector2[],
        true,
    );
    g.fillPoints(
        [
            { x: x0 - 3, y: top - 3 },
            { x: x1 + 3, y: top - 3 + lean },
            { x: x1 + 3, y: top + 3 + lean },
            { x: x0 - 3, y: top + 3 },
        ] as Phaser.Math.Vector2[],
        true,
    );
}

function courtLines(g: G, alpha: number) {
    g.lineStyle(3, 0xffffff, alpha);
    g.strokeRect(24, FLOOR + 18, STAGE_W - 48, STAGE_H - FLOOR - 40);
    g.lineBetween(24, 470, STAGE_W - 24, 470);
    g.strokeCircle(STAGE_W / 2, 470, 44);
    g.beginPath();
    g.arc(STAGE_W / 2, FLOOR + 18, 86, 0, Math.PI, false);
    g.strokePath();
}

/** Arquibancada na parede: cabeças em cores sorteadas fixas. */
function crowd(g: G) {
    g.fillStyle(0x2c2a33, 1).fillRect(0, 130, STAGE_W, 90);
    g.fillStyle(0x3a3742, 1);
    for (let y = 150; y < 220; y += 22) g.fillRect(0, y, STAGE_W, 4);
    const colors = [0xd85a4a, 0x3a7bd5, 0xf0c040, 0x5aa85a, 0xe8e0d0, 0x9a6ad0];
    for (let row = 0; row < 3; row++)
        for (let i = 0; i < 20; i++) {
            const x = 10 + i * 18 + (row % 2) * 9 + hash(i + row * 40) * 4;
            const y = 144 + row * 22;
            g.fillStyle(colors[Math.floor(hash(i * 7 + row) * colors.length)], 1).fillRect(x - 5, y + 2, 10, 9);
            g.fillStyle(0xe0b48a, 1).fillCircle(x, y, 4);
        }
}

function sky(g: G, h: number) {
    const bands = [0x8fd0ee, 0x9ad6f0, 0xa6dcf2, 0xb2e2f4, 0xbfe8f6];
    for (const [i, c] of bands.entries()) g.fillStyle(c, 1).fillRect(0, (i * h) / bands.length, STAGE_W, h / 5 + 1);
    g.fillStyle(0xffffff, 0.9);
    for (const [x, y] of [
        [70, 34],
        [250, 22],
    ])
        g.fillEllipse(x, y, 54, 16).fillEllipse(x + 18, y - 6, 34, 16);
}

function trees(g: G, y: number) {
    for (let i = 0; i < 14; i++) {
        const x = i * 28 + hash(i) * 8;
        g.fillStyle(0x5a3a22, 1).fillRect(x - 3, y + 10, 6, 14);
        g.fillStyle(i % 2 ? 0x2f6e3c : 0x3a804a, 1).fillCircle(x, y, 18);
        g.fillStyle(0x4f9a5a, 1).fillCircle(x - 5, y - 6, 7);
    }
}

function house(g: G, x: number, y: number, w: number, h: number, roof: number, wall: number) {
    g.fillStyle(0x000000, 0.2).fillRect(x + 4, y + h, w, 5);
    g.fillStyle(wall, 1).fillRect(x, y + h * 0.4, w, h * 0.6);
    g.fillStyle(roof, 1).fillRect(x - 6, y, w + 12, h * 0.42);
    g.fillStyle(0x000000, 0.18).fillRect(x - 6, y + h * 0.36, w + 12, h * 0.06);
}

function grass(g: G, y0: number, y1: number) {
    g.fillStyle(0x7cc46a, 1).fillRect(0, y0, STAGE_W, y1 - y0);
    g.fillStyle(0x5fa84f, 1);
    for (let i = 0; i < 40; i++) {
        const x = hash(i * 3) * STAGE_W;
        const y = y0 + 4 + hash(i * 5 + 1) * (y1 - y0 - 8);
        g.fillTriangle(x - 3, y + 4, x, y - 3, x + 3, y + 4);
    }
}

function pallet(g: G) {
    sky(g, 120);
    trees(g, 112);
    grass(g, 128, FLOOR);
    // casa do jogador (esquerda) e o laboratório do Carvalho (direita, com a porta)
    house(g, 18, 92, 96, 82, 0xc8483a, 0xf0e6d0);
    g.fillStyle(0x7a4a26, 1).fillRect(56, 150, 18, 24);
    g.fillStyle(0x9ad6f0, 1).fillRect(28, 136, 18, 14).fillRect(86, 136, 18, 14);
    house(g, 214, 70, 132, 108, 0x5d7393, 0xf4f4ee);
    g.fillStyle(0x6a6a72, 1).fillRect(268, 140, 28, 38);
    g.fillStyle(0x9ad6f0, 1);
    for (const x of [224, 304, 324]) g.fillRect(x, 128, 14, 14);
    // campinho de terra com pintinha e cal apagada
    g.fillStyle(0xc49a62, 1).fillRect(0, FLOOR, STAGE_W, STAGE_H - FLOOR);
    for (let i = 0; i < 160; i++) {
        const x = hash(i * 11) * STAGE_W;
        const y = FLOOR + hash(i * 13 + 2) * (STAGE_H - FLOOR);
        g.fillStyle(i % 3 ? 0xb08550 : 0xd4ae78, 1).fillRect(Math.round(x), Math.round(y), 3, 2);
    }
    g.fillStyle(0x7cc46a, 1)
        .fillRect(0, FLOOR, 14, STAGE_H - FLOOR)
        .fillRect(STAGE_W - 14, FLOOR, 14, STAGE_H);
    courtLines(g, 0.28);
    goal(g, 136, 226, 0x8a5a30, 6);
}

function lab(g: G) {
    g.fillStyle(0xd9d6c8, 1).fillRect(0, 0, STAGE_W, FLOOR + 20);
    g.fillStyle(0xb8b4a4, 1).fillRect(0, FLOOR - 40, STAGE_W, 60);
    // estantes com livros
    for (const x0 of [16, 254]) {
        g.fillStyle(0x7a4a26, 1).fillRect(x0, 70, 90, 180);
        for (let s = 0; s < 4; s++) {
            const y = 80 + s * 42;
            g.fillStyle(0x4a2c16, 1).fillRect(x0 + 6, y, 78, 34);
            for (let b = 0; b < 9; b++) {
                const c = [0xc8483a, 0x3a7bd5, 0xf0c040, 0x5aa85a, 0xe8e0d0][Math.floor(hash(x0 + s * 9 + b) * 5)];
                g.fillStyle(c, 1).fillRect(x0 + 8 + b * 8.4, y + 6 + hash(b + s) * 6, 6, 28 - hash(b + s) * 6);
            }
        }
    }
    // janela
    g.fillStyle(0x6a6a72, 1).fillRect(134, 50, 92, 84);
    g.fillStyle(0xa6dcf2, 1).fillRect(140, 56, 80, 72);
    g.fillStyle(0x6a6a72, 1).fillRect(178, 56, 4, 72).fillRect(140, 90, 80, 4);
    drawFloor(
        g,
        { kind: 'checker', size: 30, tones: [0xe8e4d8, 0xd6d2c4] },
        { x: 0, y: FLOOR + 20, w: STAGE_W, h: STAGE_H },
    );
    // mesa das Poké Balls
    g.fillStyle(0x000000, 0.18).fillEllipse(180, 362, 170, 18);
    g.fillStyle(0x5a3418, 1).fillRect(110, 330, 10, 30).fillRect(240, 330, 10, 30);
    g.fillStyle(0x7a4a26, 1).fillRect(104, 318, 152, 16);
    g.fillStyle(0xa06a3c, 1).fillRect(104, 292, 152, 28);
}

function route1(g: G) {
    trees(g, 26);
    trees(g, 64);
    grass(g, 80, STAGE_H);
    g.fillStyle(0xd8b878, 1).fillRect(140, 80, 80, STAGE_H);
    g.fillStyle(0xc4a466, 1);
    for (let i = 0; i < 30; i++) g.fillRect(146 + hash(i) * 66, 90 + hash(i + 9) * 540, 4, 2);
    // mato alto dos dois lados
    for (let row = 0; row < 7; row++)
        for (const x0 of [12, 236]) {
            for (let i = 0; i < 4; i++) {
                const x = x0 + i * 26 + (row % 2) * 12;
                const y = 220 + row * 34;
                g.fillStyle(0x3f8a3c, 1).fillTriangle(x, y + 16, x + 9, y - 6, x + 18, y + 16);
                g.fillStyle(0x56a650, 1).fillTriangle(x + 4, y + 16, x + 11, y, x + 18, y + 16);
            }
        }
    // placa de madeira
    g.fillStyle(0x7a4a26, 1).fillRect(228, 150, 6, 30);
    g.fillStyle(0xa06a3c, 1).fillRect(214, 132, 36, 22);
    g.lineStyle(2, 0x5a3418, 1).strokeRect(214, 132, 36, 22);
}

export function drawStage(g: G, id: StageId) {
    g.clear();
    if (id === 'ginasio' || id === 'quadra') {
        const lit = id === 'quadra';
        gymWall(g, lit);
        if (lit) crowd(g);
        gymFloor(g, lit);
        if (lit) {
            courtLines(g, 0.85);
            goal(g, 136, 224, 0xf4f4f4);
        } else {
            // o campo de batalha antigo: retângulo e o círculo do meio, gastos
            g.lineStyle(2, 0xe8e0d0, 0.3);
            g.strokeRect(40, FLOOR + 40, STAGE_W - 80, STAGE_H - FLOOR - 80);
            g.lineBetween(40, 450, STAGE_W - 40, 450);
            g.strokeCircle(STAGE_W / 2, 450, 36);
        }
    } else if (id === 'pallet') pallet(g);
    else if (id === 'lab') lab(g);
    else route1(g);
}
