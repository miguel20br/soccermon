/**
 * Natal (ui/tema.ts): os treinadores de gorro. O gorro é um sprite de pixel (GORRO, abaixo) posicionado em cada
 * treinador pela tabela HEAD (onde fica o meio da aba, em px do sprite de 80x80) e colado por cima de uma cópia: os
 * PNGs originais não mudam. Saída em public/assets/trainers/natal/{id}.png; no período do Natal o `trainerSrc` aponta
 * pra lá. Também grava o gorro sozinho em public/assets/ui/gorro.png (logo e pódio).
 *
 * Uso: npx tsx scripts/build-natal-trainers.ts [pasta-da-prévia]   (com a pasta, grava também uma folha com todos)
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { TRAINERS, type TrainerId } from '../src/store/missions';

const DIR = 'public/assets/trainers';

// K contorno, R vermelho, r sombra, W pelo branco, w sombra do pelo. A ponta cai pra direita, com o pompom.
const GORRO = [
    '....KKKK.........',
    '...KRRRRKK.......',
    '..KRRRRRRRKK.....',
    '..KRRRRRRRRRKK...',
    '.KRRRRRRRRRRrRK..',
    '.KRRRRRRRRKKKrRK.',
    '.KRRRRRRRrK.KKrK.',
    '.KRRRRRRRrK.KWWWK',
    'KWWWWWWWWWWKKWWwK',
    'KWWWWWWWWWWWKKwK.',
    'KwwwwwwwwwwwK.K..',
    '.KKKKKKKKKKK.....',
];
const COLORS: Record<string, [number, number, number]> = {
    K: [26, 16, 32],
    R: [214, 40, 60],
    r: [140, 22, 44],
    W: [246, 246, 250],
    w: [184, 194, 214],
};
/** Meio da aba (embaixo) dentro do GORRO: é esse ponto que vai na cabeça. */
const AX = 6;
const AY = 11;

/**
 * Cabeça de cada treinador: [x, y] do meio da aba (px do sprite), e `f` pra ponta cair pro outro lado (quem olha pra
 * esquerda). Mais de uma cabeça (a Equipe Rocket): uma lista. Conferir na folha da prévia ao mexer.
 */
type Head = [number, number, 'f'?];
const HEAD: Record<TrainerId, Head | Head[]> = {
    acetrainer: [36, 16],
    agatha: [41, 17],
    ash: [38, 17],
    ashGold: [40, 17],
    beauty: [40, 15],
    biker: [26, 15],
    bill: [40, 16],
    birdkeeper: [40, 17],
    blackbelt: [34, 19],
    blaine: [45, 13],
    blue: [45, 14],
    blueGold: [45, 14],
    brock: [38, 13],
    bruno: [40, 23],
    bugcatcher: [45, 21],
    channeler: [38, 27],
    erika: [41, 17],
    fisherman: [48, 17],
    gentleman: [45, 15],
    giovanni: [44, 13],
    hiker: [42, 13],
    juggler: [38, 17],
    koga: [30, 22],
    lance: [33, 15],
    lanceGold: [35, 15],
    lass: [41, 20],
    lassGold: [41, 20],
    leaf: [39, 18],
    lorelei: [41, 15],
    ltsurge: [46, 15],
    misty: [38, 20],
    nurse: [33, 15],
    oak: [43, 13],
    oakGold: [42, 14],
    oakHolo: [42, 14],
    pokemaniac: [34, 16],
    red: [40, 18],
    redGold: [41, 18],
    rival: [41, 20],
    rocker: [37, 19],
    rocket: [
        [24, 10],
        [57, 10],
    ],
    sabrina: [39, 16],
    scientist: [39, 17],
    supernerd: [35, 15],
    swimmer: [36, 20],
    tamer: [31, 18],
    youngster: [42, 21],
    youngsterGold: [42, 21],
};

function hatPixels(flip: boolean): Buffer {
    const h = GORRO.length;
    const w = GORRO[0].length;
    const px = Buffer.alloc(w * h * 4);
    GORRO.forEach((row, y) => {
        for (let x = 0; x < w; x++) {
            const c = COLORS[row[flip ? w - 1 - x : x]];
            if (!c) continue;
            px.set([...c, 255], (y * w + x) * 4);
        }
    });
    return px;
}
const hatPng = (flip: boolean) =>
    sharp(hatPixels(flip), { raw: { width: GORRO[0].length, height: GORRO.length, channels: 4 } })
        .png()
        .toBuffer();

const out = `${DIR}/natal`;
mkdirSync(out, { recursive: true });
const hats = { false: await hatPng(false), true: await hatPng(true) };
const w = GORRO[0].length;
for (const id of TRAINERS) {
    const heads = (Array.isArray(HEAD[id][0]) ? HEAD[id] : [HEAD[id]]) as Head[];
    const layers = heads.map(([x, y, f]) => {
        const flip = f === 'f';
        // a aba fica no mesmo lugar dos dois lados: virado, o meio dela é w-1-AX
        const left = x - (flip ? w - 1 - AX : AX);
        const top = y - AY;
        return { input: hats[String(flip) as 'false'], left, top };
    });
    // gorro que passa da borda: corta (o sprite é 80x80 e continua 80x80)
    const pad = 20;
    await sharp(`${DIR}/${id}.png`)
        .ensureAlpha()
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .composite(layers.map((l) => ({ ...l, left: l.left + pad, top: l.top + pad })))
        .toBuffer()
        .then((b) => sharp(b).extract({ left: pad, top: pad, width: 80, height: 80 }).png().toFile(`${out}/${id}.png`));
}
await sharp(hats.false).toFile('public/assets/ui/gorro.png');

// a folha de conferência: todos, 3x
const sheetDir = process.argv[2];
if (sheetDir) {
    const S = 3;
    const cols = 8;
    const cell = 80 * S;
    const comps = await Promise.all(
        TRAINERS.flatMap((id, i) => [
            sharp(`${out}/${id}.png`)
                .resize(cell, cell, { kernel: 'nearest' })
                .toBuffer()
                .then((input) => ({ input, left: (i % cols) * cell, top: Math.floor(i / cols) * cell })),
            Promise.resolve({
                input: Buffer.from(
                    `<svg width="${cell}" height="20"><text x="2" y="15" font-size="14" fill="yellow">${id}</text></svg>`,
                ),
                left: (i % cols) * cell,
                top: Math.floor(i / cols) * cell + cell - 20,
            }),
        ]),
    );
    await sharp({
        create: {
            width: cols * cell,
            height: Math.ceil(TRAINERS.length / cols) * cell,
            channels: 4,
            background: '#33405a',
        },
    })
        .composite(comps)
        .png()
        .toFile(`${sheetDir}/natal-treinadores.png`);
}
