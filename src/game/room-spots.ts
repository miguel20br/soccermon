import type { Metal } from './room-art';

/** Sala de troféus: onde fica cada coisa (sem Phaser: a tela usa pros nomes e botões; a cena, pras zonas de toque). */
export const ROOM_W = 416;
export const ROOM_H = 256;

export const CUP_X: Record<Metal, number> = { bronze: 150, prata: 178, ouro: 206 };
export const LIGA_X = 240;
/** Taça da Liga Índigo (Rota Índigo): à esquerda das taças da Relâmpago, entre o abajur e a estante. */
export const ROTA_X = 119;

/**
 * Onde fica cada objeto que dá pra tocar (px do quarto). A tela usa o mesmo mapa pros nomes ("segurar mostra o nome
 * de tudo") e pros botões-legenda.
 */
export const ROOM_SPOTS = {
    hall: { x: 8, y: 16, w: 92, h: 30 },
    platina: { x: 102, y: 14, w: 28, h: 36 },
    clube: { x: 162, y: 12, w: 68, h: 24 },
    rota: { x: ROTA_X - 16, y: 50, w: 32, h: 72 },
    'copa-bronze': { x: CUP_X.bronze - 14, y: 50, w: 28, h: 72 },
    'copa-prata': { x: CUP_X.prata - 14, y: 50, w: 28, h: 72 },
    'copa-ouro': { x: CUP_X.ouro - 14, y: 50, w: 28, h: 72 },
    liga: { x: LIGA_X - 20, y: 44, w: 40, h: 80 },
    dia: { x: 260, y: 16, w: 56, h: 32 },
    medalhas: { x: 316, y: 14, w: 48, h: 34 },
    duelo: { x: 364, y: 16, w: 44, h: 40 },
    album: { x: 262, y: 66, w: 56, h: 58 },
    livros: { x: 318, y: 56, w: 66, h: 68 },
    tv: { x: 8, y: 160, w: 84, h: 80 },
    numeros: { x: 96, y: 168, w: 62, h: 60 },
} as const;
export type RoomSpot = keyof typeof ROOM_SPOTS;

/** Recortes do Interiors_free_32x32.png (x, y, w, h), conferidos no tileset: cada um pega o móvel inteiro. */
export const MI: Record<string, [number, number, number, number]> = {
    frame: [320, 850, 24, 32],
    cork: [6, 1312, 52, 26],
    lamp: [352, 1774, 30, 50],
    fireplace: [288, 2752, 64, 80],
    cabinetGlass: [292, 1568, 54, 54],
    bookshelf: [160, 448, 64, 64],
    plantPalm: [426, 1408, 46, 62],
    plantSmall: [386, 1444, 28, 46],
    rug: [424, 356, 80, 120],
    tvCabinet: [234, 432, 76, 42],
    tv: [6, 468, 52, 36],
    // o PC: mesa verde inteira (com a sombra) e o monitor de cima do balcão (sem o balcão)
    desk: [338, 1236, 56, 44],
    monitor: [96, 276, 32, 23],
};

/** Móveis no chão: [x, base] (origem embaixo à esquerda, profundidade pela base). */
export const FLOOR_PROPS: Record<string, [number, number]> = {
    fireplace: [6, 122],
    lamp: [72, 120],
    tvCabinet: [12, 238],
    tv: [24, 204],
    desk: [100, 226],
    monitor: [104, 196],
    plantSmall: [300, 242],
    plantPalm: [352, 248],
    cabinetGlass: [262, 122],
    bookshelf: [318, 120],
};

/**
 * Chão livre onde o Pokémon pisa (a posição é a dos pés): na frente das vitrines, entre o PC e as plantas. Com a
 * margem do corpo (`clampToFloor`), ele nunca entra num móvel nem passa por baixo de um.
 */
export const ROOM_FLOOR = { x: 160, y: 132, w: 136, h: 100 };

/** Leva o ponto (pés) pra dentro do chão livre, com `halfW` de folga dos lados pro corpo. */
export function clampToFloor(x: number, y: number, halfW: number) {
    const f = ROOM_FLOOR;
    const lo = f.x + halfW;
    const hi = Math.max(lo, f.x + f.w - halfW);
    return { x: Math.min(hi, Math.max(lo, x)), y: Math.min(f.y + f.h, Math.max(f.y, y)) };
}

/**
 * Escala do Pokémon que passeia: sempre inteira (pixel art nítido, sem deformar) — 2x, ou 1x pros grandões cujo corpo
 * passaria de 72 px em 2x (Onix, Gyarados).
 */
export const monScale = (bodyH: number) => (bodyH * 2 <= 72 ? 2 : 1);

/** Escala que faz uma imagem (w x h) caber numa caixa de `box` px sem esticar. */
export const fitScale = (w: number, h: number, box: number) => box / Math.max(w, h);
