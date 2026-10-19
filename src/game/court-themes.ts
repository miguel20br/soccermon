import type Phaser from 'phaser';
import type { LeaderId } from '../engine/rival-coach';

/**
 * Quadra temática de cada ginásio (o rival da Copa joga em casa). Tudo é desenhado uma vez num Graphics (sem textura
 * nem imagem nova): o piso muda de cor e de padrão com pouco contraste entre as peças (a leitura dos Pokémon vem
 * primeiro) e os detalhes do ginásio ficam na margem, fora da linha lateral. O Duelo e o resto usam a madeira de
 * sempre (`WOOD`). Galeria: `?lab=quadras`.
 */
export type Floor =
    /** Tábuas ou faixas verticais (madeira, grama cortada). */
    | { kind: 'stripes'; size: number; tones: number[] }
    /** Xadrez de ladrilhos. */
    | { kind: 'checker'; size: number; tones: number[] }
    /** Blocos com junta (pedra, tatame, chapas), fileiras desencontradas; `rivets` = parafusos nos cantos. */
    | { kind: 'bricks'; w: number; h: number; tones: number[]; grout: number; rivets?: boolean };

export interface CourtTheme {
    /** Fora da quadra (margem). */
    surround: number;
    /** Faixa de piso entre a linha e a margem, numa cor só (sem ela, o piso vai até a margem). */
    rim?: number;
    floor: Floor;
    area: number;
    areaAlpha: number;
    /** Detalhes do ginásio na margem. `box` = retângulo do piso (com a faixa). */
    decor?: (g: Phaser.GameObjects.Graphics, box: Box, size: { w: number; h: number }) => void;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Quadra de madeira de sempre (exatamente as cores de antes). */
export const WOOD: CourtTheme = {
    surround: 0x7a4a2a,
    rim: 0xc98a4f,
    floor: { kind: 'stripes', size: 24, tones: [0xcf9358, 0xc68649] },
    area: 0x3a7bd5,
    areaAlpha: 0.55,
};

/** Pontos ao longo da margem (no meio da faixa de fora), a cada `step` px; `skipTop` deixa o alto livre. */
function along(box: Box, size: { w: number; h: number }, step: number, skipTop = true): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    const mx = box.x / 2;
    const my = box.y / 2;
    const bottom = box.y + box.h + (size.h - box.y - box.h) / 2;
    const right = box.x + box.w + (size.w - box.x - box.w) / 2;
    for (let x = step / 2; x < size.w; x += step) {
        pts.push({ x, y: bottom });
        if (!skipTop) pts.push({ x, y: my });
    }
    for (let y = box.y + step / 2; y < box.y + box.h; y += step) pts.push({ x: mx, y }, { x: right, y });
    return pts;
}

/** Sorteio fixo pelo índice (a quadra sai igual sempre, sem Math.random). */
const hash = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const star = (g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, n: number, inner: number) => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / n;
        const rr = i % 2 ? r * inner : r;
        pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
    }
    g.fillPoints(pts as Phaser.Math.Vector2[], true);
};

export const COURTS: Record<LeaderId, CourtTheme> = {
    // Pewter: piso de pedra e pedregulhos na margem
    brock: {
        surround: 0x5b5148,
        rim: 0x8f8170,
        floor: { kind: 'bricks', w: 44, h: 33, tones: [0xa89a86, 0xb3a58f, 0x9f917d], grout: 0x7d705f },
        area: 0x7a5a3a,
        areaAlpha: 0.5,
        decor: (g, box, size) => {
            for (const [i, p] of along(box, size, 46).entries()) {
                const r = 7 + hash(i) * 5;
                g.fillStyle(0x3e362f, 0.5).fillEllipse(p.x + 2, p.y + 3, r * 2.2, r * 1.5);
                g.fillStyle(i % 2 ? 0x8a7f72 : 0x9b9083, 1).fillEllipse(p.x, p.y, r * 2.1, r * 1.7);
                g.fillStyle(0xc4baa9, 0.7).fillEllipse(p.x - r * 0.35, p.y - r * 0.35, r * 0.8, r * 0.5);
            }
        },
    },
    // Cerulean: piscina (ladrilho azul) e ondas na margem
    misty: {
        surround: 0x1f5f8f,
        rim: 0x74bddb,
        floor: { kind: 'checker', size: 22, tones: [0x92d1ea, 0x9fd8ee] },
        area: 0x1f63c4,
        areaAlpha: 0.5,
        decor: (g, box, size) => {
            g.lineStyle(2, 0x9fd8ee, 0.45);
            for (const y of [box.y / 2, box.y + box.h + (size.h - box.y - box.h) / 2]) {
                for (let x = 0; x < size.w; x += 32) {
                    g.beginPath();
                    g.arc(x + 8, y, 8, Math.PI, 0, false);
                    g.strokePath();
                }
            }
            for (const [i, p] of along(box, size, 38).entries())
                if (p.x < box.x || p.x > box.x + box.w)
                    g.fillStyle(0xd8f2ff, 0.55).fillCircle(p.x + (hash(i) - 0.5) * 10, p.y, 2 + hash(i + 9) * 3);
        },
    },
    // Vermilion: chapas de metal com parafusos, faixa de alerta e raios
    ltsurge: {
        surround: 0x2a2d33,
        rim: 0x80868f,
        floor: { kind: 'bricks', w: 44, h: 44, tones: [0xa6acb4, 0x9da3ac], grout: 0x7c828b, rivets: true },
        area: 0xf2c53d,
        areaAlpha: 0.42,
        decor: (g, box, size) => {
            // faixa de alerta colada no piso
            const band = 6;
            for (let x = box.x; x < box.x + box.w; x += 12) {
                g.fillStyle(0xf2c53d, 1).fillRect(x, box.y + box.h, 6, band);
                g.fillStyle(0x16181c, 1).fillRect(x + 6, box.y + box.h, 6, band);
            }
            g.fillStyle(0xf7d64a, 0.9);
            for (const [i, p] of along(box, size, 64).entries()) {
                const s = i % 2 ? 1 : -1;
                g.fillPoints(
                    [
                        { x: p.x + 2 * s, y: p.y - 10 },
                        { x: p.x - 5 * s, y: p.y + 1 },
                        { x: p.x, y: p.y + 1 },
                        { x: p.x - 3 * s, y: p.y + 10 },
                        { x: p.x + 6 * s, y: p.y - 2 },
                        { x: p.x + 1 * s, y: p.y - 2 },
                    ] as Phaser.Math.Vector2[],
                    true,
                );
            }
        },
    },
    // Celadon: grama cortada em faixas e flores na margem
    erika: {
        surround: 0x3f6b3a,
        rim: 0x6aa64e,
        floor: { kind: 'stripes', size: 44, tones: [0x80bf60, 0x76b558] },
        area: 0xe0679f,
        areaAlpha: 0.42,
        decor: (g, box, size) => {
            const petals = [0xf4a7c8, 0xfff1a8, 0xffffff, 0xe889b6];
            for (const [i, p] of along(box, size, 30).entries()) {
                const c = petals[i % petals.length];
                const x = p.x + (hash(i) - 0.5) * 8;
                const y = p.y + (hash(i + 3) - 0.5) * 8;
                g.fillStyle(c, 0.95);
                for (let k = 0; k < 5; k++) {
                    const a = (k * 2 * Math.PI) / 5;
                    g.fillCircle(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, 2.6);
                }
                g.fillStyle(0xf2b630, 1).fillCircle(x, y, 1.8);
            }
        },
    },
    // Fuchsia: tatame do dojo e shurikens
    koga: {
        surround: 0x3a2848,
        rim: 0x8c6da2,
        floor: { kind: 'bricks', w: 88, h: 44, tones: [0xc9b97c, 0xc1b173], grout: 0x6e5a3a },
        area: 0x8a4cb2,
        areaAlpha: 0.5,
        decor: (g, box, size) => {
            for (const [i, p] of along(box, size, 54).entries()) {
                g.fillStyle(0x15111a, 0.45);
                star(g, p.x + 1.5, p.y + 2, 9, 4, 0.32);
                g.fillStyle(i % 2 ? 0xbfc4cc : 0xa8adb6, 1);
                star(g, p.x, p.y, 9, 4, 0.32);
                g.fillStyle(0x3a2848, 1).fillCircle(p.x, p.y, 1.8);
            }
        },
    },
    // Saffron: xadrez rosa e ondas psíquicas na margem
    sabrina: {
        surround: 0x4a2440,
        rim: 0xb87aa3,
        floor: { kind: 'checker', size: 33, tones: [0xd79bbf, 0xcc8fb4] },
        area: 0x8a3fc8,
        areaAlpha: 0.45,
        decor: (g, box, size) => {
            for (const [i, p] of along(box, size, 70).entries()) {
                for (let k = 3; k >= 1; k--) g.lineStyle(1.5, 0xf2a6d6, 0.18 + 0.16 * k).strokeCircle(p.x, p.y, 4 * k);
                g.fillStyle(i % 2 ? 0xffd2ec : 0xe8b8ff, 0.9).fillCircle(p.x, p.y, 2.2);
            }
        },
    },
    // Cinnabar: chão de argila quente, rachaduras de lava e brasas
    blaine: {
        surround: 0x34170f,
        rim: 0x9c4b37,
        floor: { kind: 'bricks', w: 44, h: 33, tones: [0xc4745d, 0xbb6b54, 0xc97d66], grout: 0x8f4532 },
        area: 0xff8a2a,
        areaAlpha: 0.42,
        decor: (g, box, size) => {
            for (const [i, p] of along(box, size, 44).entries()) {
                const s = 6 + hash(i) * 6;
                g.lineStyle(3, 0xff6a1a, 0.55);
                g.lineBetween(p.x - s, p.y - 3, p.x - s / 3, p.y + 3);
                g.lineBetween(p.x - s / 3, p.y + 3, p.x + s / 3, p.y - 2);
                g.lineBetween(p.x + s / 3, p.y - 2, p.x + s, p.y + 2);
                g.lineStyle(1, 0xffd060, 0.8);
                g.lineBetween(p.x - s / 3, p.y + 3, p.x + s / 3, p.y - 2);
                g.fillStyle(0xffb040, 0.8).fillCircle(p.x + (hash(i + 5) - 0.5) * 14, p.y - 8, 1.5);
            }
        },
    },
    // Viridian: quadra de terra batida com friso dourado
    giovanni: {
        surround: 0x2f2a20,
        rim: 0xa8854f,
        floor: { kind: 'stripes', size: 33, tones: [0xc9a46a, 0xc19c62] },
        area: 0x5f8a34,
        areaAlpha: 0.5,
        decor: (g, box, size) => {
            g.lineStyle(2, 0xd9a935, 0.9).strokeRect(box.x - 7, box.y - 7, box.w + 14, box.h + 14);
            g.lineStyle(1, 0xd9a935, 0.5).strokeRect(box.x - 11, box.y - 11, box.w + 22, box.h + 22);
            for (const [i, p] of along(box, size, 58).entries()) {
                if (i % 2) continue;
                g.fillStyle(0xd9a935, 0.85);
                star(g, p.x, p.y, 6, 4, 0.45);
            }
        },
    },
    // Lavender: madeira escurecida, lápides, velas e fantasminhas
    agatha: {
        surround: 0x2b2238,
        rim: 0x7e6b97,
        floor: { kind: 'stripes', size: 24, tones: [0x9f8cb4, 0x9683ab] },
        area: 0x55398a,
        areaAlpha: 0.5,
        decor: (g, box, size) => {
            for (const [i, p] of along(box, size, 50).entries()) {
                if (i % 3 === 2) {
                    // vela
                    g.fillStyle(0xe8e0d0, 1).fillRect(p.x - 2, p.y - 2, 4, 9);
                    g.fillStyle(0xffd060, 0.95).fillEllipse(p.x, p.y - 5, 4, 6);
                    g.fillStyle(0xffd060, 0.18).fillCircle(p.x, p.y - 4, 8);
                } else if (i % 3 === 1) {
                    // fantasminha
                    g.fillStyle(0xd8c8f0, 0.35)
                        .fillCircle(p.x, p.y - 2, 6)
                        .fillRect(p.x - 6, p.y - 2, 12, 7);
                    g.fillStyle(0x2b2238, 0.8)
                        .fillCircle(p.x - 2, p.y - 3, 1.2)
                        .fillCircle(p.x + 2, p.y - 3, 1.2);
                } else {
                    // lápide
                    g.fillStyle(0x15101c, 0.45).fillRoundedRect(p.x - 6, p.y - 7, 14, 17, {
                        tl: 6,
                        tr: 6,
                        bl: 0,
                        br: 0,
                    });
                    g.fillStyle(0x8c849a, 1).fillRoundedRect(p.x - 7, p.y - 9, 14, 17, { tl: 6, tr: 6, bl: 0, br: 0 });
                    g.fillStyle(0x5d566b, 1)
                        .fillRect(p.x - 1, p.y - 5, 2, 7)
                        .fillRect(p.x - 3, p.y - 3, 6, 2);
                }
            }
        },
    },
    // Liga Índigo: mármore azul, colunas nos cantos e estrelas douradas
    lance: {
        surround: 0x1c1e45,
        rim: 0x5f66ab,
        floor: { kind: 'checker', size: 44, tones: [0x8e94c9, 0x868cc1] },
        area: 0xd9a935,
        areaAlpha: 0.38,
        decor: (g, box, size) => {
            g.lineStyle(2, 0xd9a935, 0.85).strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
            for (const [i, p] of along(box, size, 60).entries()) {
                g.fillStyle(i % 2 ? 0xffd447 : 0xd9a935, 0.9);
                star(g, p.x, p.y, 7, 5, 0.45);
            }
            const r = 12;
            for (const [cx, cy] of [
                [box.x / 2, box.y / 2],
                [size.w - box.x / 2, box.y / 2],
                [box.x / 2, size.h - box.y / 2],
                [size.w - box.x / 2, size.h - box.y / 2],
            ]) {
                g.fillStyle(0x0e0f2a, 0.5).fillCircle(cx + 2, cy + 3, r);
                g.fillStyle(0xd8dcf2, 1).fillCircle(cx, cy, r);
                g.fillStyle(0xb7bce0, 1).fillCircle(cx, cy, r * 0.7);
                g.fillStyle(0xd9a935, 1).fillCircle(cx, cy, r * 0.3);
            }
        },
    },
};

/** Piso dentro do retângulo `box` (com as tábuas/ladrilhos/blocos do tema). */
export function drawFloor(g: Phaser.GameObjects.Graphics, f: Floor, box: Box) {
    const { x, y, w, h } = box;
    if (f.kind === 'stripes') {
        for (let i = 0; i < w / f.size; i++)
            g.fillStyle(f.tones[i % f.tones.length], 1).fillRect(x + i * f.size, y, f.size, h);
        return;
    }
    if (f.kind === 'checker') {
        for (let j = 0; j * f.size < h; j++)
            for (let i = 0; i * f.size < w; i++)
                g.fillStyle(f.tones[(i + j) % f.tones.length], 1).fillRect(
                    x + i * f.size,
                    y + j * f.size,
                    Math.min(f.size, w - i * f.size),
                    Math.min(f.size, h - j * f.size),
                );
        return;
    }
    // blocos: fileiras desencontradas (meio bloco), tom de cada um pelo índice
    for (let j = 0; j * f.h < h; j++) {
        const off = j % 2 ? -f.w / 2 : 0;
        for (let i = 0; off + i * f.w < w; i++) {
            const bx = Math.max(x, x + off + i * f.w);
            const bw = Math.min(x + off + (i + 1) * f.w, x + w) - bx;
            const bh = Math.min(f.h, h - j * f.h);
            const by = y + j * f.h;
            g.fillStyle(f.tones[Math.floor(hash(i * 31 + j * 17) * f.tones.length)], 1).fillRect(bx, by, bw, bh);
            g.lineStyle(1, f.grout, 0.55).strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
            if (f.rivets && bw > 12 && bh > 12) {
                g.fillStyle(f.grout, 0.9);
                for (const [rx, ry] of [
                    [bx + 4, by + 4],
                    [bx + bw - 4, by + 4],
                    [bx + 4, by + bh - 4],
                    [bx + bw - 4, by + bh - 4],
                ])
                    g.fillCircle(rx, ry, 1.3);
            }
        }
    }
}
