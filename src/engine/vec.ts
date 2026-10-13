export interface Vec2 {
    x: number;
    y: number;
}

export const v = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const dist2 = (a: Vec2, b: Vec2): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function norm(a: Vec2): Vec2 {
    const l = len(a);
    return l > 1e-9 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
}

/** Limita o módulo do vetor a `max`. */
export function truncate(a: Vec2, max: number): Vec2 {
    const l = len(a);
    return l > max ? scale(a, max / l) : a;
}

export function rotate(a: Vec2, rad: number): Vec2 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

/** Distância do ponto p ao segmento ab, e o parâmetro t (0..1) do ponto mais próximo. */
export function pointSegment(p: Vec2, a: Vec2, b: Vec2): { d: number; t: number } {
    const ab = sub(b, a);
    const l2 = dot(ab, ab);
    const t = l2 > 0 ? clamp(dot(sub(p, a), ab) / l2, 0, 1) : 0;
    return { d: dist(p, add(a, scale(ab, t))), t };
}

// setor angular (-4..4, 0 = direita, +2 = baixo) → linha da sheet PMD
const SECTOR_TO_ROW = [6, 5, 4, 3, 2, 1, 0, 7, 6];

/**
 * Direção em 8 setores, na ordem das linhas das sheets PMD:
 * 0 baixo, 1 baixo-direita, 2 direita, 3 cima-direita, 4 cima, 5 cima-esquerda, 6 esquerda, 7 baixo-esquerda.
 * Coordenadas de tela: +x direita, +y baixo.
 */
export function dir8(d: Vec2, fallback = 0): number {
    if (Math.abs(d.x) < 1e-6 && Math.abs(d.y) < 1e-6) return fallback;
    const sector = Math.round(Math.atan2(d.y, d.x) / (Math.PI / 4));
    return SECTOR_TO_ROW[sector + 4];
}
