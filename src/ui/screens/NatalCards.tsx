import type { CSSProperties } from 'react';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { PokeCard2 } from '../components/PokeCard2';
import { type Metal, metalOf } from '../rarity';
import '../natal-cards.css';

/**
 * Proposta da edição "Evento de Natal" (só na galeria ?cards=1, pro Miguel escolher; nada disso está no jogo): três
 * desenhos por cima da carta Evento de Gelo. O metal (bronze/prata/ouro pela nota) aparece na cor da nota, na linha
 * da moldura e na fita. Os desenhos em pixel saem de mapas de letras (uma letra = um pixel) viram SVG aqui.
 */
type Pal = Record<string, string>;

/** Mapa de letras → SVG em data URI (cada sequência igual vira um retângulo; letra fora da paleta = vazio). */
function pixels(rows: string[], pal: Pal): string {
    let rects = '';
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; ) {
            let n = 1;
            while (row[x + n] === row[x]) n++;
            const fill = pal[row[x]];
            if (fill) rects += `<rect x='${x}' y='${y}' width='${n}' height='1' fill='${fill}'/>`;
            x += n;
        }
    });
    // width/height: o border-image corta a fatia em pixels da imagem; sem tamanho próprio, o SVG estica pra caixa
    const [w, h] = [rows[0].length, rows.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${rects}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Gira o mapa 90° no sentido horário. */
const rot = (g: string[]) =>
    [...g[0]].map((_, c) =>
        g
            .map((row) => row[c])
            .reverse()
            .join(''),
    );

/** Moldura pra border-image: canto de cima à esquerda + borda de cima, girados pros outros lados (fatia = canto). */
function frame(corner: string[], edge: string[]): string[] {
    const [c2, e2] = [rot(corner), rot(edge)];
    const [c3, e3] = [rot(c2), rot(e2)];
    const [c4, e4] = [rot(c3), rot(e3)];
    const hole = '.'.repeat(edge[0].length);
    return [
        ...corner.map((r, i) => r + edge[i] + c2[i]),
        ...e4.map((r, i) => r + hole + e2[i]),
        ...c4.map((r, i) => r + e3[i] + c3[i]),
    ];
}

/** Desenha `art` por cima de `g` a partir de (x, y); ponto = deixa o que está embaixo. */
function put(g: string[], x: number, y: number, art: string[]) {
    art.forEach((row, i) => {
        g[y + i] = [...g[y + i]]
            .map((c, j) => (j >= x && j < x + row.length && row[j - x] !== '.' ? row[j - x] : c))
            .join('');
    });
    return g;
}

// ---------------------------------------------------------------- A: Noite de Natal (festão + neve)
const FESTAO = (() => {
    const needles = [
        'gdgGgdggGdgggLgd',
        'GgdgGLgdgGdGgdgG',
        'dGgGgdGgLgdgGgGd',
        'gLgdGgGdgGgLdGgd',
        'dg.gGd.gg.dGg.Gg',
    ];
    const edge = [...needles.map((r) => r + r), '.g...d....g..d..'.repeat(2), '.'.repeat(32), '.'.repeat(32)];
    put(edge, 6, 4, ['.y.', 'Rrr', 'rrk', '.k.']);
    put(edge, 22, 4, ['.o.', 'Yyy', 'yyo', '.o.']);
    const corner = ['gdgGgdgg', 'GgdgGLgd', 'dGgRrGgG', 'gLRrrkGd', 'dgrrkGg.', 'GdGkGd..', 'gGg.g...', 'dg.d....'];
    return pixels(frame(corner, edge), {
        d: '#0e3b23',
        g: '#1d6b3a',
        G: '#3fa257',
        L: '#8ee07a',
        r: '#d0262f',
        R: '#ff7b6b',
        k: '#7a1018',
        y: '#e9b53f',
        Y: '#fff1a6',
        o: '#8a5a10',
    });
})();
const NEVE_FINA = pixels(
    [
        'w...............',
        '..........b.....',
        '.....w..........',
        '................',
        '.............w..',
        '..b.............',
        '................',
        '.........w......',
        '................',
        'w...........b...',
        '................',
        '.....b..........',
        '..............w.',
        '........w.......',
        '................',
        '...w............',
    ],
    { w: '#ffffff', b: '#bcd6ff' },
);
const NEVE_GROSSA = pixels(
    [
        '........................',
        '....w...................',
        '...www..................',
        '....w............ww.....',
        '.................ww.....',
        '........................',
        '..........w.............',
        '........................',
        '........................',
        '.....................w..',
        '....................www.',
        '.ww..................w..',
        '.ww.....................',
        '........................',
        '..........w.w...........',
        '...........w............',
        '..........w.w...........',
        '........................',
        '....................ww..',
        '....................ww..',
        '...w....................',
        '........................',
        '..............w.........',
        '........................',
    ],
    { w: '#ffffff' },
);

// ---------------------------------------------------------------- B: Embrulho de presente (papel, fita e laço)
const PAPEL = pixels(['k.......', '.....y..', '........', '...k....', '..k.k...', '...k....', '........', '.y......'], {
    k: '#7d0f18',
    y: '#f0c35a',
});
const LACO_ESQ = [
    '..oooo....',
    '.ohhmmoo..',
    'ohmmmmmlo.',
    'ohmmmmmmlo',
    'ohmmmmmmlo',
    'ohmmmmmloo',
    '.ollllloho',
    '..oooooohm',
    '.....olmlo',
    '....olmo.o',
    '...olmo...',
    '..olmmo...',
    '..ollo....',
    '...oo.....',
];
const LACO = LACO_ESQ.map((r) => r + [...r].reverse().join(''));
const METAL_PAL: Record<Metal, Pal> = {
    bronze: { o: '#3d2410', h: '#f6d3a8', m: '#c98a52', l: '#8f5a2e' },
    prata: { o: '#2b3240', h: '#ffffff', m: '#c9ced8', l: '#8a93a3' },
    ouro: { o: '#3d2c00', h: '#fff3b8', m: '#e8c24a', l: '#a87e12' },
};
const BOW: Record<Metal, string> = {
    bronze: pixels(LACO, METAL_PAL.bronze),
    prata: pixels(LACO, METAL_PAL.prata),
    ouro: pixels(LACO, METAL_PAL.ouro),
};

// ---------------------------------------------------------------- C: Gelo e luzes (pisca-pisca + flocos)
const LUZES = (() => {
    const edge = ['.'.repeat(32), 'k'.repeat(32), ...Array.from({ length: 6 }, () => '.'.repeat(32))];
    ['r', 'y', 'g', 'b'].forEach((c, i) => {
        const C = c.toUpperCase();
        put(edge, i * 8 + 3, 2, ['.s.', `w${c}${c}`, `${c}${c}${c}`, `${c}${c}${C}`, `.${C}.`]);
    });
    const corner = ['........', '..kkkkkk', '.k......', '.k......', '.k......', '.k......', '.k......', '.k......'];
    return frame(corner, edge);
})();
const BULB_ON: Pal = {
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
/** Lâmpada apagada: 45% da cor acesa sobre o azul-escuro do fio (o SVG não entende color-mix). */
const off = (c: string) =>
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
const LUZES_BASE = pixels(LUZES, {
    k: '#2c4a3a',
    s: '#9aa7a0',
    ...Object.fromEntries(Object.entries(BULB_ON).map(([k, c]) => [k, k === 'w' ? '#c9d6e8' : off(c)])),
});
const only = (keys: string) => Object.fromEntries(Object.entries(BULB_ON).filter(([k]) => keys.includes(k)));
const LUZES_A = pixels(LUZES, only('wrRgG'));
const LUZES_B = pixels(LUZES, only('wyYbB'));
const FLOCO = pixels(
    [
        '....w....',
        '.w..w..w.',
        '..w.w.w..',
        '...www...',
        'wwwwcwwww',
        '...www...',
        '..w.w.w..',
        '.w..w..w.',
        '....w....',
    ],
    { w: '#ffffff', c: '#9fd8ff' },
);

const ART = {
    '--xm-festao': FESTAO,
    '--xm-neve-fina': NEVE_FINA,
    '--xm-neve-grossa': NEVE_GROSSA,
    '--xm-papel': PAPEL,
    '--xm-luzes': LUZES_BASE,
    '--xm-luzes-a': LUZES_A,
    '--xm-luzes-b': LUZES_B,
    '--xm-floco': FLOCO,
} as CSSProperties;

const OPTIONS = [
    {
        id: 'a',
        name: 'A · Noite de Natal',
        note: 'Céu azul-noite, neve caindo em duas camadas e festão de pinheiro com bolas.',
    },
    {
        id: 'b',
        name: 'B · Embrulho de presente',
        note: 'Papel vermelho, fita no metal da carta cruzando no nome e laço no canto.',
    },
    { id: 'c', name: 'C · Gelo e luzes', note: 'Gelo translúcido, pisca-pisca colorido na borda e flocos nos cantos.' },
] as const;

/** Uma carta de cada metal, já com o +2 da edição na nota. */
const SAMPLES = [86, 25, 144].map((id): { inst: PokemonInstance; metal: Metal } => {
    const inst: PokemonInstance = {
        ...createInstance(id, new Rng(`natal-${id}`)),
        shiny: false,
        special: { kind: 'evento', type: 'Ice' },
    };
    return { inst, metal: metalOf(viewInstance(inst).overall) };
});
const METAL_NAME: Record<Metal, string> = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };

export function NatalCards() {
    return (
        <section className="panel" id="natal" style={ART}>
            <h2>Cartas de Natal · 3 opções pro Miguel escolher, fora do jogo</h2>
            <p className="muted">
                Carta Evento do Natal (tipo Gelo). Nota e atributos do mesmo tamanho; o metal pela nota aparece na cor
                da nota, na moldura e na fita. Movimento lento; com Reduzir movimento fica parado.
            </p>
            <div className="xm-grid">
                {OPTIONS.map((o) => (
                    <h3 key={o.id} className="xm-head">
                        {o.name} <small className="muted">{o.note}</small>
                    </h3>
                ))}
                {SAMPLES.flatMap(({ inst, metal }) =>
                    OPTIONS.map((o) => (
                        <figure key={`${o.id}-${inst.speciesId}`} className="cg-item">
                            <div
                                className={`xm-card xv-${o.id} xm-${metal}`}
                                style={{ '--xm-bow': BOW[metal] } as CSSProperties}
                            >
                                <PokeCard2 inst={inst} variant="metal" />
                            </div>
                            <figcaption className="muted">
                                {o.id.toUpperCase()} · {METAL_NAME[metal]}
                            </figcaption>
                        </figure>
                    )),
                )}
            </div>
        </section>
    );
}
