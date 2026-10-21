import type { StageId } from '../story/director';
import { ART_H, ART_W, block, canvas, disc, FLOOR, hash, type Paint, rect, shade } from './story-art';

/**
 * Cenários das cenas do Modo história, em pixel art na grade do PMD (src/game/story-art.ts). Vista de cima em 3/4,
 * como os mapas do Mystery Dungeon: parede ou céu em cima, chão de `FLOOR` pra baixo. O ginásio continua ginásio: a
 * quadra fica dentro dele.
 *
 * Estilos (comparação em ?lab=cenas&estilo=): `a` = tudo no estilo PMD (o escolhido), `b` = Modern Interiors nos
 * interiores, `c` = palco de trailer (fundo da marca e silhuetas).
 */
export type StageStyle = 'a' | 'b' | 'c';
export interface MiSheets {
    interiors: CanvasImageSource;
    room: CanvasImageSource;
}

const OUT = 0x1c1428;
const W = ART_W;
const H = ART_H;

// ---- peças

function stoneWall(p: Paint, k: number) {
    rect(p, 0, 0, W, FLOOR, shade(0x3a322c, k));
    for (let row = 0; row * 8 < FLOOR - 6; row++) {
        const off = row % 2 ? -8 : 0;
        for (let x = off; x < W; x += 16) {
            const t = [0x6a5e52, 0x625649, 0x5b5044][Math.floor(hash(x * 3 + row * 7) * 3)];
            block(p, x, row * 8, 15, 7, shade(t, k), shade(0x7a6e60, k), shade(0x463c34, k));
        }
    }
    rect(p, 0, FLOOR - 6, W, 6, shade(0x2e2822, k));
    rect(p, 0, FLOOR - 6, W, 1, shade(0x4a4038, k));
}

function stoneFloor(p: Paint, k: number) {
    rect(p, 0, FLOOR, W, H - FLOOR, shade(0x6a6054, k));
    for (let row = 0; FLOOR + row * 14 < H; row++) {
        const off = row % 2 ? -12 : 0;
        for (let x = off; x < W; x += 24) {
            const t = [0xa89a86, 0xb3a58f, 0x9f917d][Math.floor(hash(x + row * 13) * 3)];
            block(p, x, FLOOR + row * 14, 23, 13, shade(t, k), shade(0xc4b8a4, k), shade(0x8a7e6c, k));
        }
    }
}

function torch(p: Paint, x: number, y: number) {
    rect(p, x - 2, y, 4, 10, OUT);
    rect(p, x - 1, y + 1, 2, 8, 0x5a3a22);
    disc(p, x, y - 3, 3, 4, OUT);
    disc(p, x, y - 3, 2, 3, 0xf0a030);
    rect(p, x, y - 4, 1, 3, 0xffe08a);
}

/** Linha de pixels em retângulo vazado. */
function frame(p: Paint, x: number, y: number, w: number, h: number, c: number) {
    rect(p, x, y, w, 1, c);
    rect(p, x, y + h - 1, w, 1, c);
    rect(p, x, y, 1, h, c);
    rect(p, x + w - 1, y, 1, h, c);
}

function ring(p: Paint, cx: number, cy: number, r: number, c: number, from = 0, to = Math.PI * 2) {
    const n = Math.ceil(r * 8);
    for (let i = 0; i <= n; i++) {
        const a = from + ((to - from) * i) / n;
        rect(p, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1, c);
    }
}

function courtLines(p: Paint, c: number) {
    frame(p, 10, FLOOR + 7, W - 20, H - FLOOR - 15, c);
    rect(p, 10, 188, W - 20, 1, c);
    ring(p, W / 2, 188, 16, c);
    ring(p, W / 2, FLOOR + 7, 30, c, 0, Math.PI);
}

/** Trave em 3/4 com rede; `lean` entorta o poste direito (a de madeira do campinho). */
function goal(p: Paint, color: number, dark: number, lean = 0) {
    const x0 = 54;
    const x1 = 90;
    const top = FLOOR - 16;
    const bottom = FLOOR + 7;
    for (let x = x0 + 3; x < x1; x += 3) rect(p, x, top + 2, 1, bottom - top - 3, 0xd8d8e0, 0.55);
    for (let y = top + 4; y < bottom; y += 3) rect(p, x0 + 1, y, x1 - x0 - 1, 1, 0xd8d8e0, 0.55);
    rect(p, x0 - 1, bottom, x1 - x0 + 3, 2, 0x000000, 0.25);
    // postes e travessão com contorno
    rect(p, x0 - 2, top - 1, 4, bottom - top + 2, OUT);
    rect(p, x0 - 1, top, 2, bottom - top, color);
    rect(p, x1 - 2 + lean, top - 1 + lean, 4, bottom - top + 2 - lean, OUT);
    rect(p, x1 - 1 + lean, top + lean, 2, bottom - top - lean, color);
    for (let x = x0 - 2; x <= x1 + 1 + lean; x++) {
        const y = top - 1 + Math.round(((x - x0) / (x1 - x0)) * lean);
        rect(p, x, y, 1, 3, OUT);
        rect(p, x, y + 1, 1, 1, color);
    }
    rect(p, x0 - 1, top + 2, 1, bottom - top - 2, dark);
}

function crowd(p: Paint) {
    rect(p, 0, 50, W, 36, 0x2c2a33);
    for (let y = 58; y < 86; y += 9) rect(p, 0, y, W, 2, 0x3a3742);
    const colors = [0xd85a4a, 0x3a7bd5, 0xf0c040, 0x5aa85a, 0xe8e0d0, 0x9a6ad0];
    for (let row = 0; row < 3; row++)
        for (let i = 0; i < 18; i++) {
            const x = 3 + i * 8 + (row % 2) * 4;
            const y = 53 + row * 9;
            rect(p, x - 2, y + 2, 5, 4, colors[Math.floor(hash(i * 7 + row) * colors.length)]);
            rect(p, x - 1, y - 1, 3, 3, 0xe0b48a);
            rect(p, x - 1, y - 1, 3, 1, 0x302838);
        }
}

function sky(p: Paint) {
    const bands = [0x86cbec, 0x92d2ee, 0xa0d8f0, 0xaedef2, 0xbce4f4];
    bands.forEach((c, i) => {
        rect(p, 0, i * 10, W, 10, c);
    });
    for (const [x, y] of [
        [28, 12],
        [104, 8],
    ]) {
        disc(p, x, y, 10, 3, 0xffffff);
        disc(p, x + 7, y - 2, 6, 3, 0xffffff);
        rect(p, x - 9, y + 3, 19, 1, 0xd8eef8);
    }
}

function trees(p: Paint, y: number) {
    for (let i = 0; i < 13; i++) {
        const x = i * 12 + Math.round(hash(i) * 4);
        rect(p, x - 1, y + 5, 3, 6, 0x5a3a22);
        disc(p, x, y, 7, 6, 0x1c3c24);
        disc(p, x, y, 6, 5, i % 2 ? 0x2f6e3c : 0x3a804a);
        disc(p, x - 2, y - 2, 2, 2, 0x5aa85a);
    }
}

function grass(p: Paint, y0: number, y1: number) {
    rect(p, 0, y0, W, y1 - y0, 0x7cc46a);
    for (let i = 0; i < 30; i++) {
        const x = Math.round(hash(i * 3) * W);
        const y = Math.round(y0 + 2 + hash(i * 5 + 1) * (y1 - y0 - 4));
        rect(p, x, y, 1, 2, 0x5fa84f);
        rect(p, x + 2, y, 1, 2, 0x5fa84f);
        rect(p, x + 1, y - 1, 1, 2, 0x5fa84f);
    }
}

/** Casa em 3/4: telhado visto de cima, parede da frente, porta e janelas, tudo com contorno. */
function house(p: Paint, x: number, y: number, w: number, roof: number, roofDark: number, wall: number, door: number) {
    const roofH = 16;
    const wallH = 20;
    rect(p, x - 1, y - 1, w + 2, roofH + wallH + 2, OUT);
    rect(p, x, y, w, roofH, roof);
    for (let ry = y + 3; ry < y + roofH; ry += 4) rect(p, x, ry, w, 1, roofDark);
    rect(p, x, y + roofH - 1, w, 1, OUT);
    rect(p, x, y + roofH, w, wallH, wall);
    rect(p, x, y + roofH + wallH - 2, w, 2, shade(wall, 0.85));
    const dx = x + Math.floor(w / 2) - 3;
    rect(p, dx - 1, y + roofH + 7, 8, 13, OUT);
    rect(p, dx, y + roofH + 8, 6, 12, door);
    for (const wx of [x + 4, x + w - 12]) {
        rect(p, wx - 1, y + roofH + 4, 10, 8, OUT);
        rect(p, wx, y + roofH + 5, 8, 6, 0x9ad6f0);
        rect(p, wx, y + roofH + 5, 3, 1, 0xffffff);
    }
}

// ---- estilo A (PMD)

function gymA(p: Paint, lit: boolean) {
    const k = lit ? 1 : 0.6;
    stoneWall(p, k);
    torch(p, 16, 30);
    torch(p, W - 16, 30);
    if (lit) crowd(p);
    stoneFloor(p, k);
    if (lit) {
        courtLines(p, 0xffffff);
        goal(p, 0xf4f4f4, 0xb8b8c8);
    } else {
        const c = 0x8a8070;
        frame(p, 16, FLOOR + 16, W - 32, H - FLOOR - 32, c);
        rect(p, 16, 180, W - 32, 1, c);
        ring(p, W / 2, 180, 14, c);
    }
}

function palletA(p: Paint) {
    sky(p);
    trees(p, 46);
    grass(p, 52, FLOOR);
    house(p, 6, 34, 38, 0xc8483a, 0x9c3428, 0xf0e6d0, 0x7a4a26);
    house(p, 86, 30, 52, 0x5d7393, 0x48596f, 0xf4f4ee, 0x6a6a72);
    // campinho de terra, pintinhas e cal gasta
    rect(p, 0, FLOOR, W, H - FLOOR, 0xc49a62);
    for (let i = 0; i < 140; i++) {
        const x = Math.round(hash(i * 11) * W);
        const y = Math.round(FLOOR + hash(i * 13 + 2) * (H - FLOOR));
        rect(p, x, y, i % 4 ? 1 : 2, 1, i % 3 ? 0xb08550 : 0xd4ae78);
    }
    rect(p, 0, FLOOR, 4, H - FLOOR, 0x7cc46a);
    rect(p, W - 4, FLOOR, 4, H - FLOOR, 0x7cc46a);
    courtLines(p, 0xe6d2a8);
    goal(p, 0x9a6a38, 0x6a4420, 2);
}

function labA(p: Paint) {
    rect(p, 0, 0, W, 100, 0xd9d6c8);
    rect(p, 0, 0, W, 6, 0x3a3442);
    rect(p, 0, 84, W, 16, 0xb8b4a4);
    rect(p, 0, 84, W, 1, 0xccc8b8);
    rect(p, 0, 99, W, 1, 0x8a8678);
    for (const x0 of [6, 102]) {
        rect(p, x0 - 1, 27, 38, 74, OUT);
        rect(p, x0, 28, 36, 72, 0x7a4a26);
        rect(p, x0, 28, 36, 1, 0x9a6238);
        for (let s = 0; s < 4; s++) {
            const y = 31 + s * 17;
            rect(p, x0 + 2, y, 32, 14, 0x3e2410);
            for (let b = 0; b < 10; b++) {
                const c = [0xc8483a, 0x3a7bd5, 0xf0c040, 0x5aa85a, 0xe8e0d0][Math.floor(hash(x0 + s * 9 + b) * 5)];
                const hgt = 10 + Math.floor(hash(b + s * 3) * 4);
                rect(p, x0 + 3 + b * 3, y + 14 - hgt, 2, hgt, c);
            }
        }
    }
    // janela
    rect(p, 53, 17, 38, 36, OUT);
    rect(p, 54, 18, 36, 34, 0x8a8a96);
    rect(p, 56, 20, 32, 30, 0xa6dcf2);
    rect(p, 71, 20, 2, 30, 0x8a8a96);
    rect(p, 56, 34, 32, 2, 0x8a8a96);
    for (let i = 0; i < 6; i++) rect(p, 58 + i, 22 + i, 1, 1, 0xe8f6fc);
    // piso
    for (let y = 100; y < H; y += 12)
        for (let x = 0; x < W; x += 12) rect(p, x, y, 12, 12, ((x + y) / 12) % 2 ? 0xd6d2c4 : 0xe8e4d8);
    // mesa das Poké Balls
    disc(p, 72, 140, 34, 3, 0x000000, 0.18);
    rect(p, 41, 116, 62, 20, OUT);
    rect(p, 42, 117, 60, 11, 0xa06a3c);
    rect(p, 42, 117, 60, 1, 0xb88050);
    rect(p, 42, 128, 60, 6, 0x7a4a26);
    for (const lx of [44, 97]) {
        rect(p, lx - 1, 134, 5, 9, OUT);
        rect(p, lx, 134, 3, 8, 0x5a3418);
    }
}

function route1A(p: Paint) {
    trees(p, 8);
    trees(p, 24);
    grass(p, 32, H);
    rect(p, 56, 32, 32, H, 0xd8b878);
    rect(p, 56, 32, 1, H, 0xb89858);
    rect(p, 87, 32, 1, H, 0xb89858);
    for (let i = 0; i < 24; i++)
        rect(p, 58 + Math.round(hash(i) * 27), 36 + Math.round(hash(i + 9) * 216), 2, 1, 0xc4a466);
    for (let row = 0; row < 7; row++)
        for (const x0 of [4, 94]) {
            for (let i = 0; i < 4; i++) {
                const x = x0 + i * 11 + (row % 2) * 5;
                const y = 92 + row * 14;
                for (let r = 0; r < 7; r++) rect(p, x + 3 - Math.floor(r / 2), y + r, 1 + r, 1, r ? 0x3f8a3c : OUT);
                rect(p, x - 1, y + 7, 9, 1, 0x2f6a2c);
            }
        }
    rect(p, 92, 56, 3, 14, OUT);
    rect(p, 86, 48, 16, 10, OUT);
    rect(p, 87, 49, 14, 8, 0xa06a3c);
    rect(p, 87, 49, 14, 1, 0xc08a50);
}

// ---- estilo B (Modern Interiors nos interiores; o exterior não tem: Pallet sai no estilo A)

/** Recorte da folha de 32 px do Modern Interiors pela metade (a arte é de 16 px dobrada: cai certinho na grade). */
function mi(p: Paint, img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number) {
    p.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw / 2, sh / 2);
}

function tile(p: Paint, img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, box: number[]) {
    const [x0, y0, w, h] = box;
    for (let y = y0; y < y0 + h; y += sh / 2)
        for (let x = x0; x < x0 + w; x += sw / 2) mi(p, img, sx, sy, sw, sh, x, y);
}

function gymB(p: Paint, s: MiSheets, lit: boolean) {
    rect(p, 0, 0, W, FLOOR, 0x23222c);
    tile(p, s.room, 32, 544, 32, 64, [0, FLOOR - 32, W, 32]);
    tile(p, s.room, 448, 160, 32, 32, [0, FLOOR, W, H - FLOOR]);
    if (lit) {
        crowd(p);
        courtLines(p, 0xffffff);
        goal(p, 0xf4f4f4, 0xb8b8c8);
    } else rect(p, 0, 0, W, H, 0x05060f, 0.4);
}

function labB(p: Paint, s: MiSheets) {
    rect(p, 0, 0, W, 100, 0x23222c);
    tile(p, s.room, 32, 608, 32, 64, [0, 36, W, 64]);
    tile(p, s.room, 352, 352, 32, 32, [0, 100, W, H - 100]);
    mi(p, s.interiors, 160, 448, 64, 64, 6, 68);
    mi(p, s.interiors, 160, 448, 64, 64, 106, 68);
    mi(p, s.interiors, 426, 1408, 46, 62, 44, 69);
    mi(p, s.interiors, 338, 1236, 56, 44, 58, 114);
}

// ---- estilo C (palco de trailer: fundo da marca, cenário só em silhueta)

function brand(p: Paint) {
    const cx = W / 2;
    const cy = 110;
    const tones = [0x2a3a7a, 0x223268, 0x1b2856, 0x141f44, 0x0e1632, 0x070a18];
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const d = Math.hypot(x - cx, (y - cy) * 0.75) / 24;
            const i = Math.min(tones.length - 1, Math.floor(d + ((x + y) % 2) * 0.5));
            const ray = Math.floor(((Math.atan2(y - cy, x - cx) + Math.PI) / (Math.PI * 2)) * 16) % 2;
            rect(p, x, y, 1, 1, ray && i > 0 ? shade(tones[i], 1.12) : tones[i]);
        }
}

function silhouette(p: Paint, id: StageId) {
    const S = 0x0b1030;
    const R = 0x3a4a8a;
    rect(p, 0, FLOOR, W, H - FLOOR, 0x0e1632, 0.65);
    rect(p, 0, FLOOR, W, 1, R);
    if (id === 'pallet') {
        for (const [x, y, w] of [
            [6, 40, 38],
            [86, 34, 52],
        ]) {
            rect(p, x - 1, y - 1, w + 2, FLOOR - y + 1, R);
            rect(p, x, y, w, FLOOR - y, S);
        }
    }
    if (id === 'lab') {
        for (const x0 of [6, 102]) {
            rect(p, x0 - 1, 27, 38, 74, R);
            rect(p, x0, 28, 36, 72, S);
        }
        rect(p, 41, 116, 62, 20, R);
        rect(p, 42, 117, 60, 18, S);
    }
    if (id === 'ginasio' || id === 'quadra' || id === 'pallet') {
        rect(p, 53, FLOOR - 17, 39, 3, R);
        rect(p, 53, FLOOR - 17, 3, 25, R);
        rect(p, 89, FLOOR - 17, 3, 25, R);
    }
    if (id === 'ginasio' || id === 'quadra') {
        torch(p, 16, 30);
        torch(p, W - 16, 30);
    }
}

export function paintStage(id: StageId, style: StageStyle, sheets?: MiSheets): HTMLCanvasElement {
    const [el, p] = canvas(W, H);
    if (style === 'c') {
        brand(p);
        silhouette(p, id);
        if (id === 'ginasio') rect(p, 0, 0, W, H, 0x000000, 0.35);
        return el;
    }
    if (style === 'b' && sheets && (id === 'ginasio' || id === 'quadra')) gymB(p, sheets, id === 'quadra');
    else if (style === 'b' && sheets && id === 'lab') labB(p, sheets);
    else if (id === 'ginasio' || id === 'quadra') gymA(p, id === 'quadra');
    else if (id === 'pallet') palletA(p);
    else if (id === 'lab') labA(p);
    else route1A(p);
    return el;
}
