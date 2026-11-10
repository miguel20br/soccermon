import type { CSSProperties } from 'react';
import { useT } from '../../i18n/react';

/**
 * Pixel art escrita em texto: cada caractere é um pixel da paleta (`.` ou fora dela = vazio). Vira um SVG em data URI
 * pra usar de fundo em CSS, medido em pixels de arte (`w` x `h`).
 */
export function pixelArt(rows: string, pal: Record<string, string>) {
    const lines = rows
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const w = Math.max(...lines.map((l) => l.length));
    const h = lines.length;
    let rects = '';
    lines.forEach((l, y) => {
        for (let x = 0; x < l.length; ) {
            let n = 1;
            while (l[x + n] === l[x]) n++;
            if (pal[l[x]]) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${pal[l[x]]}"/>`;
            x += n;
        }
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" shape-rendering="crispEdges">${rects}</svg>`;
    return { w, h, url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` };
}

type Art = ReturnType<typeof pixelArt>;
/** As medidas da arte pro CSS (`--art`, `--w`, `--h`; o tamanho de 1 pixel é o `--ep` da cena). */
const tile = (a: Art) => ({ '--art': a.url, '--w': a.w, '--h': a.h }) as CSSProperties;

const SLOT = pixelArt(
    `
    ..........kkkkkk..............
    .........kyywyyyk.............
    .........kyyyyYYk.............
    ...kkkkkkkkkkkkkkkkkkkk.......
    ...khhhhhhhhhhhhhhhhhdk.......
    ...khrrrrrrrrrrrrrrrrdk.......
    ...khkkkkkkkkkkkkkkkkdk.......
    ...khkyryryryryryryykdk.......
    ...khkkkkkkkkkkkkkkkkdk..kk...
    ...khrrrrrrrrrrrrrrrrdk.krrk..
    ...khkkkkkkkkkkkkkkkkdk.khrk..
    ...khkWWWWkWWWWkWWWWkdk..kk...
    ...khkwrrrkwwwwkwwcwkdk.kgk...
    ...khkwwrwkbbbbkwcwwkdk.kgk...
    ...khkwrwwkbbbbkrwrwkdk.kgk...
    ...khkwrwwkwwwwkrwrwkdk.kgk...
    ...khkWWWWkWWWWkWWWWkdk.kgk...
    ...khkkkkkkkkkkkkkkkkdkGGGk...
    ...khrrrrrrrrrrrrrrrrdkGkkk...
    ...kddddddddddddddddddk.......
    ...khryyrrbbrrccrrrrrdk.......
    ...khrrrrrrrrrrrrrrrrdk.......
    ...khrrrrrrrrrrrrrrrrdk.......
    ...khrrrrkkkkkkkkrrrrdk.......
    ...khrrrrkGGGGGGkrrrrdk.......
    ...khrrrrkgyygggkrrrrdk.......
    ...khrrrrkkkkkkkkrrrrdk.......
    ...khrrrrrrrrrrrrrrrrdk.......
    ...kYYYYYYYYYYYYYYYYYYk.......
    ...kddddddddddddddddddk.......
    ...kddddddddddddddddddk.......
    ...kkkkkkkkkkkkkkkkkkkk.......
    ....kGGGGGGGGGGGGGGGGk........
    ....kkkkkkkkkkkkkkkkkk........
    `,
    {
        k: '#1b1b26',
        r: '#c8323c',
        d: '#8a1f2c',
        h: '#ee6a5f',
        y: '#ffcb05',
        Y: '#c9871c',
        w: '#f4f1e6',
        W: '#c9c4b4',
        b: '#3a7bc8',
        c: '#58c26b',
        g: '#9aa0b0',
        G: '#5c6070',
    },
);
const BULBS = pixelArt(
    `
    kkkkkkkk
    YYYYYYYY
    nyynnwwn
    nyynnwwn
    YYYYYYYY
    kkkkkkkk
    `,
    { k: '#1b1b26', Y: '#c9871c', n: '#2a0f22', y: '#ffcb05', w: '#fff4c8' },
);
const CARPET = pixelArt(
    `
    RRRRRRRRRRRRRRRR
    RRRRRRRyyRRRRRRR
    RRRRRRyRRyRRRRRR
    RRRRRyRRRRyRRRRR
    RRRRyRRDDRRyRRRR
    RRRyRRDDDDRRyRRR
    RRyRRDDRRDDRRyRR
    RyRRDDRyyRDDRRyR
    RyRRDDRyyRDDRRyR
    RRyRRDDRRDDRRyRR
    RRRyRRDDDDRRyRRR
    RRRRyRRDDRRyRRRR
    RRRRRyRRRRyRRRRR
    RRRRRRyRRyRRRRRR
    RRRRRRRyyRRRRRRR
    RRRRRRRRRRRRRRRR
    `,
    { R: '#8e2436', y: '#d9a43a', D: '#6a1a2a' },
);
const COUNTER = pixelArt(
    `
    ........................................................................................................................
    .......kkkkkk..............................................................................................kkkkkk.......
    ......kywyyyyk............................................................................................kywyyyyk......
    ......kYYYYYYk....................................................................................kkkkkk..kYYYYYYk......
    ......kyyyyyyk...................................................................................kywyyyyk.kyyyyyyk......
    ......kYYYYYYk..kkkkkk...........................................................................kYYYYYYk.kYYYYYYk......
    ......kyyyyyyk.kywyyyyk..........................................................................kyyyyyyk.kyyyyyyk......
    ......kYYYYYYk.kYYYYYYk..kkkkkk..........................................................kkkkkk..kYYYYYYk.kYYYYYYk......
    ......kyyyyyyk.kyyyyyyk.kywyyyyk........................................................kywyyyyk.kyyyyyyk.kyyyyyyk......
    ......kYYYYYYk.kYYYYYYk.kYYYYYYk........................................................kYYYYYYk.kYYYYYYk.kYYYYYYk......
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    kLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLk
    kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMk
    kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk
    kRyQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRyQk
    kyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQRRRRRRRRRRRRRRRRRRRRRyQk
    kyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk
    kRyQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRRQRRRRRRRRRRRRRRRRRRRRRyQk
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    `,
    {
        k: '#1b1b26',
        y: '#ffcb05',
        Y: '#c9871c',
        w: '#fff4c8',
        L: '#c98e52',
        M: '#9a6234',
        D: '#5e3a1e',
        R: '#a82a3a',
        Q: '#7e1e2c',
    },
);
const FENCE = pixelArt(
    `
    .kk.............
    kFMk............
    kFMk............
    kFMk............
    kFMkkkkkkkkkkkkk
    kFMkFFFFFFFFFFFF
    kFMkMMMMMMMMMMMM
    kFMkkkkkkkkkkkkk
    kFMk............
    kFMk............
    kFMkkkkkkkkkkkkk
    kFMkFFFFFFFFFFFF
    kFMkMMMMMMMMMMMM
    kFMkkkkkkkkkkkkk
    kFMk............
    kFMk............
    `,
    { k: '#3a2414', F: '#c68a50', M: '#9a6234' },
);
const TREES = pixelArt(
    `
    ........................
    ...............lllll....
    .............llllllttt..
    ............llllllttttt.
    ....lllll..llllllttttttt
    ..lllllltttllllltttttttt
    .lllllltttlllllttttttttt
    .lllllttttlllltttttttttt
    llllltttttllltttttttttll
    llllttttttlltttttttttlll
    llltttttttlttttttttttlll
    lltttttttttttttttttttllt
    ltttttttttttttttttttlltt
    tttttttttttttttttttttttt
    ttttttttttttTttttttttttt
    tttttttttttTTTTtttttTttt
    tttTtttttTTTTTTTTTTTTTtt
    TTTTTTTTTTTTTTTTTTTTTTTT
    TTTTTTTTTTTTTTTTTTTTTTTT
    TTTTTTTTTTTTTTTTTTTTTTTT
    TTTTTTTTTTTTTTTTTTTTTTTT
    TTTTTTTTTTTTTTTTTTTTTTTT
    `,
    { T: '#24553a', t: '#2f6e45', l: '#3f8a52' },
);
const GRASS = pixelArt(
    `
    ................
    ........G.......
    ........G......G
    .G......G......G
    .G.....GLG.....G
    GG.....GLG..G.GL
    GLG..G.GLG..G.GL
    GLG..GGgggG.G.GL
    gLG..GGgggGGLGgg
    gggGGLGgggGGLGgg
    gggGGLGgggGGLGgg
    gggGGLGgggGggggg
    gggGggggggGggggg
    gggGggggggGggggg
    `,
    { G: '#2e6b2e', g: '#4f9a3a', L: '#8fd16a' },
);
const FIELD = pixelArt(
    `
    .........d......
    .........dd.....
    ..d.............
    ..dd............
    ................
    ................
    .............d..
    .............dd.
    ................
    .....d..........
    .....dd.........
    ................
    ...........d....
    .d.........dd...
    .dd.............
    ................
    `,
    { d: '#4c9a3e' },
);
const SIGN = pixelArt(
    `
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk
    kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDLDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDLDDk
    kDDLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLDDk
    kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk
    kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    ..........kMDk............................kMDk..........
    `,
    { k: '#3a2414', D: '#7a4a26', M: '#b07a48', L: '#d9a066' },
);
const CLOUD = pixelArt(
    `
    ......wwww..........
    ....wwwwwwww..ww....
    ..wwwwwwwwwwwwwwww..
    .wwwwwwwwwwwwwwwwwww
    cccccccccccccccccccc
    `,
    { w: '#f4f9ff', c: '#cfe6f3' },
);

/**
 * O cenário dos eventos com lugar (revisão de arte, D7), no traço dos ambientes: o Cassino de Celadon com as lâmpadas,
 * o letreiro, a fileira de caça-níqueis e o carpete; a Zona Safari com a mata, a cerca de madeira, a placa e o mato
 * alto. Fica atrás de quem fala e das cartas.
 */
export function EventSet({ place }: { place: 'safari' | 'cassino' }) {
    const { d } = useT();
    if (place === 'cassino')
        return (
            <div className="evs evs-cassino" aria-hidden>
                <i className="evs-wall" />
                <i className="evs-row evs-bulbs" style={tile(BULBS)} />
                <span className="evs-marquee" style={tile(BULBS)}>
                    <b>{d.longCup.casinoSign}</b>
                </span>
                <i className="evs-row evs-slots" style={tile(SLOT)} />
                <i className="evs-floor" style={tile(CARPET)} />
            </div>
        );
    return (
        <div className="evs evs-safari" aria-hidden>
            <i className="evs-sky" />
            <i className="evs-piece evs-cloud" style={tile(CLOUD)} />
            <i className="evs-piece evs-cloud c2" style={tile(CLOUD)} />
            <i className="evs-row evs-trees" style={tile(TREES)} />
            <i className="evs-floor" style={tile(FIELD)} />
            <i className="evs-row evs-fence" style={tile(FENCE)} />
            <span className="evs-piece evs-sign" style={tile(SIGN)}>
                <b>{d.longCup.kind.safari}</b>
            </span>
            <i className="evs-row evs-grass" style={tile(GRASS)} />
        </div>
    );
}

/** O balcão de fichas do Cassino, atrás da carta do prêmio (as fichas aparecem dos lados dela). */
export function CasinoCounter() {
    return <i className="evs-piece evs-counter" style={tile(COUNTER)} aria-hidden />;
}
