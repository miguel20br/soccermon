/**
 * O gorro de Natal em pixel art (Gorro.tsx): matriz de pixels na mesma escala do sprite (1 pixel do gorro = 1 pixel do
 * sprite). Paleta curta no estilo Gen 1/2, a mesma do gorro dos treinadores (scripts/build-natal-trainers.ts) com um
 * tom de luz a mais: K contorno, H luz, R vermelho, r sombra, W pelo branco, w sombra do pelo. Desenhados com a ponta
 * caindo pra direita; o outro lado é o espelho. A última linha é a base da aba: é ela que encosta na cabeça.
 */
export const GORRO_COR: Record<string, string> = {
    K: '#1a1020',
    H: '#f0505a',
    R: '#d6283c',
    r: '#8c162c',
    W: '#f6f6fa',
    w: '#b8c2d6',
};

export const GORROS = {
    // cone inclinado pra direita, pompom na ponta (13x10, a maioria)
    longo: [
        '.........KKK.',
        '........KWWwK',
        '......KKKwwK.',
        '....KKHRrKK..',
        '...KHRRRrK...',
        '..KHRRRRRrK..',
        '.KHRRRRRRRrK.',
        'KWWWWWWWWWWWK',
        'KwwwwwwwwwwwK',
        '.KKKKKKKKKKK.',
    ],
    // gorrinho baixo (cabeça pequena)
    curto: [
        '......KKK.',
        '.....KWWwK',
        '....KKwwK.',
        '..KKHRrK..',
        '.KHRRRRrK.',
        'KWWWWWWWWK',
        'KwwwwwwwwK',
        '.KKKKKKKK.',
    ],
    // o inclinado maior (cabeça grande: Snorlax, Lapras, Gyarados)
    grande: [
        '............KKK.',
        '...........KWWwK',
        '.........KKKWwwK',
        '.......KKHRKwwK.',
        '......KHRRrrKK..',
        '.....KHRRRRrK...',
        '....KHRRRRRRrK..',
        '...KHRRRRRRRrK..',
        '..KHRRRRRRRRRrK.',
        'KWWWWWWWWWWWWWWK',
        'KWWWWWWWWWWWWWwK',
        'KwwwwwwwwwwwwwwK',
        '.KKKKKKKKKKKKKK.',
    ],
} as const;
export type GorroTipo = keyof typeof GORROS;

/** Os retângulos de uma matriz (uma linha de mesma cor vira um retângulo só), espelhada se `flip`. */
export function gorroRects(tipo: GorroTipo, flip: boolean) {
    const rows = GORROS[tipo];
    const w = rows[0].length;
    const out: { x: number; y: number; w: number; c: string }[] = [];
    rows.forEach((row, y) => {
        const r = flip ? [...row].reverse().join('') : row;
        for (let x = 0; x < w; ) {
            const c = r[x];
            let e = x + 1;
            while (e < w && r[e] === c) e++;
            if (c !== '.') out.push({ x, y, w: e - x, c: GORRO_COR[c] });
            x = e;
        }
    });
    return { w, h: rows.length, rects: out };
}

/** Coluna do meio da aba em cada desenho (ponta pra direita). */
const AX: Record<GorroTipo, number> = { longo: 6, curto: 4, grande: 7 };

/**
 * Âncora revisada de uma espécie (src/data/gorro-ancoras.json): `t` o desenho, `f` 1 se de frente a ponta cai pra
 * esquerda, e `p` por direção (0 = frente, 2 = direita, 4 = costas, 6 = esquerda; as diagonais no meio) o ponto da
 * cabeça em px do quadro Idle: [coluna do meio da aba, linha da base da aba].
 */
export interface Ancora {
    t: GorroTipo;
    f?: 0 | 1;
    p: number[][];
}

/**
 * Onde vai o gorro no quadro Idle da direção `dir`: canto de cima à esquerda (px do sprite), desenho e espelho.
 * Olhando pra um lado, a ponta cai pra trás; de costas, o espelho da frente.
 */
export function gorroPos(a: Ancora, dir: number) {
    const flip = dir === 0 ? !!a.f : dir === 4 ? !a.f : dir < 4;
    const g = GORROS[a.t];
    const w = g[0].length;
    const ax = flip ? w - 1 - AX[a.t] : AX[a.t];
    const [hx, hy] = a.p[dir] ?? a.p[0];
    return { tipo: a.t, flip, x: hx - ax, y: hy - (g.length - 1), w, h: g.length };
}
