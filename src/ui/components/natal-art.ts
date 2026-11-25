import type { CSSProperties } from 'react';
import type { Metal } from '../rarity';

/**
 * Edição de Natal da carta Metal (Evento `natal-2026`, aprovada pelo Miguel em 25/11/2026 na galeria ?cards=1): os
 * desenhos em pixel saem de mapas de letras (uma letra = um pixel) viram SVG em data URI e entram na carta como
 * variáveis de CSS (só nas cartas de Natal). O resto do visual está em pokecard2.css ("Edição de Natal").
 */
type Pal = Record<string, string>;

/** Mapa de letras → SVG em data URI (cada sequência igual vira um retângulo; letra fora da paleta = vazio). */
function pixels(rows: string[], pal: Pal): string {
    // um <path> por cor, cada sequência igual da linha vira um "M x y h n v 1 h -n z" (bem menor que um <rect>)
    const paths: Record<string, string> = {};
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; ) {
            let n = 1;
            while (row[x + n] === row[x]) n++;
            const fill = pal[row[x]];
            if (fill) paths[fill] = `${paths[fill] ?? ''}M${x} ${y}h${n}v1h-${n}z`;
            x += n;
        }
    });
    const rects = Object.entries(paths)
        .map(([fill, d]) => `<path fill='${fill}' d='${d}'/>`)
        .join('');
    // width/height: sem tamanho próprio o SVG estica pra caixa e os pixels deixam de ser quadrados
    const [w, h] = [rows[0].length, rows.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${rects}</svg>`;
    // só o que quebra a URL vira escape (encodeURIComponent dobraria o tamanho do estilo da carta)
    return `url("data:image/svg+xml,${svg.replace(/[%#<>"]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}")`;
}

/** Papel de presente: losangos em 2 vermelhos com um pontinho dourado nos cruzamentos. */
const PAPEL = pixels(
    Array.from({ length: 16 }, (_, y) =>
        Array.from({ length: 16 }, (_, x) =>
            (x === 7 && y === 0) || (x === 0 && y === 7) ? 'y' : Math.abs(x - 7.5) + Math.abs(y - 7.5) <= 7 ? 'k' : '.',
        ).join(''),
    ),
    { k: '#a51624', y: '#c4913f' },
);

/** Laço com volume: meia-volta à esquerda (alça, dobra escura, nó e ponta da fita), espelhada. */
const LACO_ESQ = [
    '....oooo......',
    '...ohhhmoo....',
    '..ohhmmmmmoo..',
    '.ohhmmmmmmmloo',
    'ohhmmmmmmmlloh',
    'ohmmmmmmmlldoh',
    'ohmmmmmmllddom',
    'ohmmmmmlldddom',
    '.ommmmllddooom',
    '..ollllooo..ol',
    '...oooo.olmlol',
    '........olmmoo',
    '.......olmmlo.',
    '......olmmlo..',
    '.....olmmlo...',
    '....olmmlo....',
    '....ommlo.....',
    '...ommlo......',
    '...oolo.......',
    '....oo........',
];
const LACO = LACO_ESQ.map((r) => r + [...r].reverse().join(''));
/** Fita e laço no metal da nota: bronze puxado pro cobre, prata fria, ouro de sempre. */
const METAL_PAL: Record<Metal, Pal> = {
    bronze: { o: '#3a1a08', h: '#ffd0a6', m: '#cf7d45', l: '#8b431d', d: '#5a2810' },
    prata: { o: '#232c3a', h: '#f4f8ff', m: '#b8c4d6', l: '#6a7a92', d: '#445166' },
    ouro: { o: '#3d2c00', h: '#fff3b8', m: '#e8c24a', l: '#a87e12', d: '#6e5208' },
};

/**
 * Pisca-pisca pendurado na fita do nome: fio fino caindo em curva entre os bocais, lâmpada em pixel com bocal e, acesa,
 * um halo pequeno na cor dela. 4 lâmpadas por ladrilho; A = vermelha e verde, B = amarela e azul (acendem alternadas).
 */
const ACESA: Pal = {
    w: '#ffffff',
    r: '#ff5a55',
    R: '#d81f2a',
    y: '#ffe066',
    Y: '#e0a400',
    g: '#62f08a',
    G: '#16a34a',
    b: '#6cc8ff',
    B: '#1f74d6',
};
const HALO: Pal = { 1: '#ff5a5566', 2: '#ffe06666', 3: '#62f08a66', 4: '#6cc8ff66' };
/** Lâmpada apagada: 45% da cor acesa sobre um azul-escuro (o SVG não entende color-mix). */
const apagada = (c: string) =>
    `#${[1, 3, 5]
        .map((i) =>
            Math.round(
                Number.parseInt(c.slice(i, i + 2), 16) * 0.45 +
                    Number.parseInt('20304a'.slice(i - 1, i + 1), 16) * 0.55,
            )
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;
const LAMPADA = ['.ss.', '.SS.', '.wc.', 'wccC', 'cccC', '.cC.', '..C.'];
function fio(lit: 'base' | 'a' | 'b'): string[] {
    const W = 96;
    const g = Array.from({ length: 11 }, () => Array.from({ length: W }, () => '.'));
    if (lit === 'base')
        for (let x = 0; x < W; x++)
            g[1 + Math.round(2.4 * Math.sin((Math.PI * (((x - 13.5 + W) % 24) + 0.5)) / 24))][x] = 'k';
    ['r', 'y', 'g', 'b'].forEach((c, i) => {
        if (lit !== 'base' && (lit === 'a') !== (i % 2 === 0)) return;
        const x0 = i * 24 + 12;
        const art = LAMPADA.map((r) => r.replaceAll('c', c).replaceAll('C', c.toUpperCase()));
        const glass = (ax: number, ay: number) => ay >= 2 && art[ay]?.[ax] !== undefined && art[ay][ax] !== '.';
        if (lit !== 'base')
            // halo: tudo a até 2 pixels do vidro ganha a cor da lâmpada, meio transparente
            for (let y = 0; y < 11; y++)
                for (let x = x0 - 3; x < x0 + 7; x++)
                    if (
                        art.some((r, ay) =>
                            [...r].some((_, ax) => glass(ax, ay) && Math.abs(ax + x0 - x) + Math.abs(ay + 1 - y) <= 2),
                        )
                    )
                        g[y][x] = String(i + 1);
        art.forEach((r, ay) => {
            [...r].forEach((ch, ax) => {
                if (ch !== '.' && (lit === 'base' || ay >= 2)) g[ay + 1][x0 + ax] = ch;
            });
        });
    });
    return g.map((r) => r.join(''));
}

/** Neve leve atrás do Pokémon: poucos flocos de 1 pixel e cruzinhas de 3 (a da opção D, que o Miguel preferiu). */
const NEVE = pixels(
    [
        '................................',
        '......w.........................',
        '.....www........................',
        '......w...................w.....',
        '................................',
        '................................',
        '................................',
        '.................w..............',
        '................................',
        '................................',
        '................................',
        '..w.............................',
        '...........................w....',
        '..........................www...',
        '...........................w....',
        '................................',
        '................................',
        '................................',
        '.............w..................',
        '............www.................',
        '.............w..................',
        '................................',
        '................................',
        '.......w........................',
        '................................',
        '................................',
        '.........................w......',
        '................................',
        '................................',
        '..................w.............',
        '................................',
        '................................',
    ],
    { w: '#ffffff' },
);

const SHARED = {
    '--nt-papel': PAPEL,
    '--nt-neve': NEVE,
    '--nt-fio': pixels(fio('base'), {
        k: '#4a2a14',
        s: '#6d6a60',
        S: '#a9a397',
        ...Object.fromEntries(Object.entries(ACESA).map(([k, c]) => [k, k === 'w' ? '#c9b8a8' : apagada(c)])),
    }),
    '--nt-fio-a': pixels(fio('a'), { ...ACESA, ...HALO }),
    '--nt-fio-b': pixels(fio('b'), { ...ACESA, ...HALO }),
};
const STYLE = Object.fromEntries(
    (Object.keys(METAL_PAL) as Metal[]).map((m) => [
        m,
        { ...SHARED, '--nt-laco': pixels(LACO, METAL_PAL[m]) } as CSSProperties,
    ]),
) as Record<Metal, CSSProperties>;

/** As variáveis de CSS da carta de Natal no metal dela (o mesmo objeto sempre: não refaz os SVGs). */
export const natalArt = (metal: Metal): CSSProperties => STYLE[metal];
