import type { StageId } from '../story/director';
import { ART_H, ART_W, canvas, disc, FLOOR, hash, MI_OUT, type Paint, rect, shade } from './story-art';

/**
 * Cenários das cenas do Modo história, na grade do PMD (src/game/story-art.ts), vista de cima em 3/4. Decidido com o
 * Miguel (21/10): o Modern Interiors (o mesmo da Sala de troféus, pela metade, que cai na grade) em tudo que ele tem;
 * o que falta (Pallet, Rota 1, arquibancada, trave, tocha) é pintado aqui no mesmo traço: contorno #3a3a50, cores
 * suaves, luz em cima. O ginásio continua ginásio: a quadra fica dentro dele.
 */
export interface MiSheets {
    interiors: CanvasImageSource;
    room: CanvasImageSource;
}

/** Contorno do Modern Interiors: o mesmo nos cenários pintados, nos treinadores e nos objetos. */
const OUT = MI_OUT;
const W = ART_W;
const H = ART_H;

// ---- peças

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
        disc(p, x, y, 7, 6, OUT);
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

/** Ginásio de Pewter: parede e piso de pedra do Modern Interiors; arquibancada e trave pintadas no mesmo traço. */
function gym(p: Paint, mi: MiSheets, lit: boolean) {
    rect(p, 0, 0, W, FLOOR, 0x24222e);
    tile(p, mi.room, 32, 544, 32, 64, [0, FLOOR - 32, W, 32]);
    tile(p, mi.room, 448, 160, 32, 32, [0, FLOOR, W, H - FLOOR]);
    torch(p, 16, FLOOR - 22);
    torch(p, W - 16, FLOOR - 22);
    if (lit) {
        crowd(p);
        courtLines(p, 0xf8f8f8);
        goal(p, 0xf8f8f8, 0xa9acbc);
    } else {
        const c = 0xb0a8a8;
        frame(p, 16, FLOOR + 16, W - 32, H - FLOOR - 32, c);
        rect(p, 16, 180, W - 32, 1, c);
        ring(p, W / 2, 180, 14, c);
        // luz apagada: o ginásio de antigamente
        rect(p, 0, 0, W, H, 0x10101c, 0.45);
    }
}

function pallet(p: Paint) {
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

/** Laboratório do Carvalho: tudo do Modern Interiors (parede, piso, estantes, janela, globo, planta, mesa). */
function lab(p: Paint, mi: MiSheets) {
    rect(p, 0, 0, W, 100, 0x24222e);
    tile(p, mi.room, 32, 608, 32, 64, [0, 68, W, 32]);
    tile(p, mi.room, 352, 352, 32, 32, [0, 100, W, H - 100]);
    piece(p, mi.interiors, 294, 782, 50, 40, 60, 72);
    piece(p, mi.interiors, 160, 448, 64, 128, 2, 36);
    piece(p, mi.interiors, 160, 448, 64, 128, 110, 36);
    piece(p, mi.interiors, 334, 1426, 36, 62, 38, 70);
    piece(p, mi.interiors, 418, 1154, 26, 42, 94, 80);
    piece(p, mi.interiors, 26, 322, 76, 74, 53, 106);
}

function route1(p: Paint) {
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

/** Recorte da folha de 32 px do Modern Interiors pela metade: a arte é de 16 px dobrada, cai certinho na grade. */
function piece(
    p: Paint,
    img: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
) {
    p.drawImage(img, sx, sy, sw, sh, dx, dy, sw / 2, sh / 2);
}

function tile(p: Paint, img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, box: number[]) {
    const [x0, y0, w, h] = box;
    for (let y = y0; y < y0 + h; y += sh / 2)
        for (let x = x0; x < x0 + w; x += sw / 2) piece(p, img, sx, sy, sw, sh, x, y);
}

export function paintStage(id: StageId, mi: MiSheets): HTMLCanvasElement {
    const [el, p] = canvas(W, H);
    if (id === 'ginasio' || id === 'quadra') gym(p, mi, id === 'quadra');
    else if (id === 'pallet') pallet(p);
    else if (id === 'lab') lab(p, mi);
    else route1(p);
    return el;
}
