import type { Metal } from './room-art';

/** Sala de troféus: onde fica cada coisa (sem Phaser: a tela usa pros nomes e botões; a cena, pras zonas de toque). */
export const ROOM_W = 416;
export const ROOM_H = 256;

export const CUP_X: Record<Metal, number> = { bronze: 150, prata: 178, ouro: 206 };
export const LIGA_X = 240;

/**
 * Onde fica cada objeto que dá pra tocar (px do quarto). A tela usa o mesmo mapa pros nomes ("segurar mostra o nome
 * de tudo") e pros botões-legenda.
 */
export const ROOM_SPOTS = {
    hall: { x: 8, y: 16, w: 92, h: 30 },
    platina: { x: 102, y: 14, w: 28, h: 36 },
    clube: { x: 162, y: 12, w: 68, h: 24 },
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
    numeros: { x: 94, y: 128, w: 64, h: 112 },
} as const;
export type RoomSpot = keyof typeof ROOM_SPOTS;
