import type { Metal } from './room-art';

/** Sala de troféus: onde fica cada coisa (sem Phaser: a tela usa pros nomes e botões; a cena, pras zonas de toque). */
export const ROOM_W = 480;
export const ROOM_H = 320;

export const CUP_X: Record<Metal, number> = { bronze: 178, prata: 212, ouro: 246 };
export const LIGA_X = 292;

/**
 * Onde fica cada objeto que dá pra tocar (px do quarto). A tela usa o mesmo mapa pros nomes ("segurar mostra o nome
 * de tudo") e pros botões-legenda.
 */
export const ROOM_SPOTS = {
    platina: { x: 50, y: 14, w: 28, h: 36 },
    hall: { x: 80, y: 16, w: 94, h: 32 },
    clube: { x: 198, y: 12, w: 68, h: 24 },
    'copa-bronze': { x: CUP_X.bronze - 15, y: 50, w: 30, h: 72 },
    'copa-prata': { x: CUP_X.prata - 15, y: 50, w: 30, h: 72 },
    'copa-ouro': { x: CUP_X.ouro - 15, y: 50, w: 30, h: 72 },
    liga: { x: LIGA_X - 20, y: 44, w: 40, h: 80 },
    dia: { x: 284, y: 16, w: 56, h: 32 },
    medalhas: { x: 344, y: 14, w: 48, h: 34 },
    duelo: { x: 398, y: 16, w: 44, h: 40 },
    tv: { x: 20, y: 228, w: 84, h: 76 },
    numeros: { x: 126, y: 194, w: 64, h: 112 },
    album: { x: 328, y: 246, w: 58, h: 58 },
    livros: { x: 388, y: 236, w: 68, h: 68 },
} as const;
export type RoomSpot = keyof typeof ROOM_SPOTS;
