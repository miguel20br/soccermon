/**
 * Pixel art das cenas (src/game/scenes/StoryScene.ts) numa grade só: 1 pixel de arte = 1 pixel do PMD. O palco tem
 * 144×256 pixels de arte e a tela mostra em escala inteira. Tudo aqui é pintado num canvas com retângulos (sem
 * antisserrilhado), com contorno escuro e sombreamento em 2 ou 3 tons, como o Mystery Dungeon. Arte própria (licença
 * limpa): treinadores, bolas, sombras e cenários.
 */
export const ART_W = 144;
export const ART_H = 256;
/** Onde começa o chão (pixels de arte). */
export const FLOOR = 92;

export type Paint = CanvasRenderingContext2D;

const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export function canvas(w: number, h: number): [HTMLCanvasElement, Paint] {
    const el = document.createElement('canvas');
    el.width = w;
    el.height = h;
    const ctx = el.getContext('2d') as Paint;
    ctx.imageSmoothingEnabled = false;
    return [el, ctx];
}

export function rect(p: Paint, x: number, y: number, w: number, h: number, c: number, a = 1) {
    p.globalAlpha = a;
    p.fillStyle = css(c);
    p.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    p.globalAlpha = 1;
}

/** Elipse cheia em pixels (linha a linha, sem borda borrada). */
export function disc(p: Paint, cx: number, cy: number, rx: number, ry: number, c: number, a = 1) {
    for (let dy = -ry; dy <= ry; dy++) {
        const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
        rect(p, cx - half, cy + dy, half * 2 + 1, 1, c, a);
    }
}

/** Retângulo com contorno de 1 pixel, luz em cima e sombra embaixo (o "bloco" do PMD). */
export function block(p: Paint, x: number, y: number, w: number, h: number, base: number, light: number, dark: number) {
    rect(p, x, y, w, h, base);
    rect(p, x, y, w, 1, light);
    rect(p, x, y + h - 1, w, 1, dark);
    rect(p, x + w - 1, y, 1, h, dark);
}

export const hash = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

/** Escurece uma cor (o ginásio antigo, de luz apagada). */
export const shade = (c: number, k: number) =>
    (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);

// ---- sprites em mapa de caracteres

const OUT = 0x1c1428;
type Pal = Record<string, number | [number, number]>;
const BASE: Pal = {
    o: OUT,
    e: OUT,
    s: 0xf8d0a0,
    S: 0xd8a070,
    w: 0xf8f8f8,
    W: 0xc8c8d8,
    k: 0x3a3040,
    x: [0x000000, 0.32],
};

/** Desenha um mapa de caracteres (`.` = vazio). `mirror` completa a metade esquerda espelhando (vista de frente). */
export function bitmap(rows: string[], pal: Pal, mirror = false): HTMLCanvasElement {
    const full = mirror ? rows.map((r) => r + [...r].reverse().join('')) : rows;
    const w = Math.max(...full.map((r) => r.length));
    const [el, p] = canvas(w, full.length);
    const colors = { ...BASE, ...pal };
    full.forEach((row, y) => {
        [...row].forEach((ch, x) => {
            const c = colors[ch];
            if (c === undefined) return;
            if (Array.isArray(c)) rect(p, x, y, 1, 1, c[0], c[1]);
            else rect(p, x, y, 1, 1, c);
        });
    });
    return el;
}

/** Treinadores de frente, na densidade do PMD (16 de largura, metade esquerda; a direita é o espelho). */
const TRAINERS: Record<string, { rows: string[]; pal: Pal }> = {
    red: {
        pal: { r: 0xe04038, R: 0xa02828, h: 0x302838, j: 0x4060b0, J: 0x2c4080 },
        rows: [
            '......oo',
            '....oorr',
            '...orrrw',
            '..orrrrw',
            '..oRRRRR',
            '.ooRRRRR',
            '.ohhssss',
            '.ohsesss',
            '..osssss',
            '...oSsss',
            '..ooRrrw',
            '.orrrrrw',
            '.orRrrrw',
            'osRrrrrw',
            'osRrrrrw',
            '.ooRRRRw',
            '..ojjjjj',
            '..ojjjjj',
            '..ojjjJo',
            '..ojjjJo',
            '..ojjjJo',
            '..okkkko',
            '...oooo.',
        ],
    },
    blue: {
        pal: { n: 0xb07038, N: 0x7a4820, p: 0x7058a8, P: 0x4c3c80, g: 0x3a3a48, G: 0x28283a },
        rows: [
            '....o..o',
            '...onoon',
            '..onnnnn',
            '.onnnNnn',
            'onnnnnnn',
            '.onNnnnn',
            '.onnssss',
            '.onsesss',
            '..osssss',
            '...oSsss',
            '..ooPppp',
            '.opppppp',
            '.opPpppp',
            'osPppppp',
            'osPppppp',
            '.ooPPPPP',
            '..oggggg',
            '..oggggg',
            '..ogggGo',
            '..ogggGo',
            '..ogggGo',
            '..okkkko',
            '...oooo.',
        ],
    },
    oak: {
        pal: { a: 0xb8b8c0, A: 0x8a8a98, r: 0xc84040, b: 0x8a6040, B: 0x5a3c28 },
        rows: [
            '....oooo',
            '...oaaaa',
            '..oaaaaa',
            '..oaAaaa',
            '.oaAssss',
            '.oasesss',
            '..osssss',
            '...oSsss',
            '..ooWwwr',
            '.owwwwwr',
            '.owWwwwr',
            'osWwwwwr',
            'osWwwwwr',
            '.owWwwww',
            '.owWwwww',
            '..owwbbo',
            '..owwbbo',
            '...obbBo',
            '...obbBo',
            '...okkko',
            '....oooo',
        ],
    },
};

export const trainerArt = (id: string) => bitmap(TRAINERS[id].rows, TRAINERS[id].pal, true);

export const ballArt = () => bitmap(['..ooo..', '.owwwo.', 'owkkkwo', 'owkkkwo', 'owwkwwo', '.owwwo.', '..ooo..'], {});

export const pokeballArt = () =>
    bitmap(['..ooo..', '.orrro.', 'orrrrro', 'oooWooo', 'owwwwwo', '.owwwo.', '..ooo..'], {
        r: 0xe03a30,
        W: 0xf8f8f8,
    });

/** Sombra no chão (elipse escura translúcida). */
export function shadowArt(w: number) {
    const [el, p] = canvas(w, 5);
    disc(p, Math.floor(w / 2), 2, Math.floor(w / 2) - 1, 1, 0x000000, 0.3);
    return el;
}

/** Luz do holofote: elipses em degraus (soma no modo ADD), sem degradê borrado. */
export function spotArt() {
    const [el, p] = canvas(64, 24);
    for (const [rx, ry] of [
        [30, 11],
        [23, 8],
        [15, 5],
    ])
        disc(p, 32, 12, rx, ry, 0xfff2d8, 0.2);
    return el;
}
