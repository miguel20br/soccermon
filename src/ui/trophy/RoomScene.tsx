import { type CSSProperties, useEffect, useRef } from 'react';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import type { MedalProgress } from '../../store/medals';
import { BELTS, METALS, type MetalCount, type RoomLevel } from '../../store/trophies';
import { ART } from '../components/PixelTrophy';
import { Crest } from '../profile/Crest';
import { speciesGif, useAvatar } from '../profile/club';
import type { Metal } from '../rarity';

/**
 * O quarto da Sala de troféus (direção 1 de docs/planos/menus-e-sala.md: o quarto do Red no FireRed/LeafGreen, visto
 * de cima em 3/4, tiles de 16 px, contorno escuro). Desenhado por código num canvas de 240x160 pixels, ampliado sem
 * borrar. Cada móvel é um botão por cima do desenho que leva à seção dele embaixo. Os números e o escudo ficam em
 * HTML por cima (texto nítido em qualquer tamanho).
 */
export const ROOM_W = 240;
export const ROOM_H = 160;

export type RoomTarget =
    | 'tr-copa'
    | 'tr-dia'
    | 'tr-duelo'
    | 'tr-liga'
    | 'tr-platina'
    | 'medalhas'
    | 'numeros'
    | 'album'
    | 'clube';

export interface RoomData {
    level: RoomLevel;
    club: number;
    cups: MetalCount;
    days: MetalCount;
    weeks: number;
    duelWins: number;
    medals: MedalProgress[];
    platinum: boolean;
    /** Metal das cartas da vitrine (a vitrine de vidro mostra a cor de cada uma). */
    glass: Metal[];
    /** Capitão do último título (passa na TV). */
    tv: { speciesId: number; shiny: boolean } | null;
}

const OL = '#383028';
const METAL_PAL: Record<Metal, { o: string; h: string; s: string }> = {
    bronze: { o: '#c98a52', h: '#e8b07a', s: '#8d5a30' },
    prata: { o: '#c9ced8', h: '#f2f4f8', s: '#8a91a0' },
    ouro: { o: '#e8c24a', h: '#fff1a8', s: '#b08a20' },
};
const TIER_PIN = ['#4a1624', '#c98a52', '#c9ced8', '#e8c24a', '#b8f0f0'];

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** Mistura duas cores (0 = a, 1 = b). */
function mix(a: string, b: string, k: number) {
    const pa = [1, 3, 5].map((i) => Number.parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => Number.parseInt(b.slice(i, i + 2), 16));
    return `#${pa
        .map((v, i) =>
            Math.round(v + (pb[i] - v) * k)
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;
}

/** Cores do quarto por nível: quarto em Pallet, sala do clube (parede na cor do clube), sala do estádio. */
function palette(level: RoomLevel, club: string) {
    if (level === 'estadio')
        return {
            wall: '#283468',
            stripe: '#22305e',
            trim: '#c8c8d8',
            trimDark: '#8888a0',
            floor: '#3c8c5c',
            floor2: '#388556',
            seam: '#2e7048',
            ghost: '#1c2650',
        };
    if (level === 'clube')
        return {
            wall: mix('#f4e4c0', club, 0.35),
            stripe: mix('#e8d4a8', club, 0.42),
            trim: '#7a5232',
            trimDark: '#4c3020',
            floor: '#a8743f',
            floor2: '#9c6a3a',
            seam: '#6e4828',
            ghost: mix('#d8c8a0', club, 0.45),
        };
    return {
        wall: '#f4e4c0',
        stripe: '#e8d4a8',
        trim: '#8c5c34',
        trimDark: '#5c3c20',
        floor: '#d8a468',
        floor2: '#cc9a5e',
        seam: '#a8784a',
        ghost: '#d8c8a0',
    };
}

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
};
/** Peça com contorno escuro, brilho em cima e sombra embaixo (o jeito dos móveis do FRLG). */
function box(c: Ctx, x: number, y: number, w: number, h: number, fill: string, hi?: string, sh?: string) {
    R(c, x, y, w, h, OL);
    R(c, x + 1, y + 1, w - 2, h - 2, fill);
    if (hi) R(c, x + 1, y + 1, w - 2, 1, hi);
    if (sh) R(c, x + 1, y + h - 2, w - 2, 1, sh);
}
/** Desenho em fileiras (o mesmo das taças em PixelTrophy). `ghost`: silhueta do que falta. */
function art(c: Ctx, rows: readonly string[], metal: Metal, x: number, y: number, ghost: string | null, s = 1) {
    const pal: Record<string, string> = { ...METAL_PAL[metal], b: '#5a3b24', r: '#d83838', k: '#3a2a22' };
    rows.forEach((row, j) => {
        [...row].forEach((ch, i) => {
            if (ch === '.') return;
            R(c, x + i * s, y + j * s, s, s, ghost ?? pal[ch]);
        });
    });
}

function draw(c: Ctx, d: RoomData) {
    const p = palette(d.level, hex(d.club));
    const clubCol = hex(d.club);
    // ---- parede (3 tiles) e rodapé
    R(c, 0, 0, ROOM_W, 44, p.wall);
    for (let x = 4; x < ROOM_W; x += 8) R(c, x, 3, 2, 41, p.stripe);
    R(c, 0, 0, ROOM_W, 3, p.trimDark);
    R(c, 0, 44, ROOM_W, 4, p.trim);
    R(c, 0, 47, ROOM_W, 1, p.trimDark);
    // ---- piso de tábua (ou quadra no estádio)
    for (let y = 48; y < ROOM_H; y += 8) {
        const row = (y - 48) / 8;
        R(c, 0, y, ROOM_W, 8, row % 2 ? p.floor2 : p.floor);
        R(c, 0, y + 7, ROOM_W, 1, p.seam);
        for (let x = (row % 2) * 16; x < ROOM_W; x += 32) R(c, x, y, 1, 7, p.seam);
    }
    if (d.level === 'estadio') R(c, 0, 96, ROOM_W, 1, '#e8f0e8');

    // ---- janela
    box(c, 8, 8, 32, 24, '#f8f8f8');
    R(c, 11, 11, 26, 18, d.level === 'estadio' ? '#1c2448' : '#9cd0ec');
    R(c, 23, 11, 2, 18, '#f8f8f8');
    R(c, 11, 19, 26, 2, '#f8f8f8');
    R(c, 13, 13, 4, 1, '#ffffff');
    R(c, 13, 14, 2, 1, '#ffffff');

    // ---- diploma de Kanto (platina)
    box(c, 48, 10, 24, 20, p.trim, mix(p.trim, '#ffffff', 0.3));
    R(c, 51, 13, 18, 14, d.platinum ? '#f8f4e4' : p.ghost);
    if (d.platinum) {
        for (const [yy, w] of [
            [16, 12],
            [19, 12],
            [22, 7],
        ])
            R(c, 54, yy, w, 1, '#8c8c8c');
        R(c, 64, 21, 3, 3, '#d83838');
    }

    // ---- faixa da torcida (o escudo vem por cima, em HTML)
    box(c, 80, 6, 64, 16, clubCol, mix(clubCol, '#ffffff', 0.35), mix(clubCol, '#000000', 0.3));
    for (let x = 82; x < 142; x += 4) R(c, x, 22, 2, 2, mix(clubCol, '#000000', 0.3));

    // ---- quadro de veludo com os broches (as 20 medalhas, metal = degrau)
    box(c, 152, 6, 40, 30, '#7a2a3c', '#9a3a50');
    d.medals.forEach((m, i) => {
        const x = 156 + (i % 5) * 7;
        const y = 10 + Math.floor(i / 5) * 6;
        const col = TIER_PIN[m.tier];
        R(c, x + 1, y, 2, 4, col);
        R(c, x, y + 1, 4, 2, col);
    });

    // ---- cinturões do Duelo
    BELTS.forEach((b, i) => {
        const y = 8 + i * 9;
        R(c, 210, y - 1, 2, 2, p.trimDark);
        art(c, ART.cinturao, b.metal, 201, y, d.duelWins >= b.wins ? null : p.ghost);
    });

    // ---- estante de troféus (Copa em cima, Copa do Dia embaixo)
    box(c, 8, 34, 96, 50, '#9c6a3c', '#b88050', '#6e4828');
    R(c, 11, 38, 90, 20, '#6e4828');
    R(c, 9, 58, 94, 3, '#b88050');
    R(c, 11, 62, 90, 18, '#6e4828');
    METALS.forEach((m, i) => {
        art(c, ART.taca, m, 16 + i * 32, 43, d.cups[m] ? null : '#5a3a22');
        art(c, ART.medalhao, m, 12 + i * 22, 66, d.days[m] ? null : '#5a3a22');
    });
    art(c, ART.taca, 'prata', 80, 65, d.weeks ? null : '#5a3a22');

    // ---- a Liga: taça grande no pedestal (silhueta até a Liga abrir)
    box(c, 116, 74, 24, 14, '#b8b8c8', '#d8d8e0', '#8888a0');
    art(c, ART.taca, 'ouro', 112, 46, p.ghost, 2);

    // ---- planta
    box(c, 182, 64, 12, 14, '#c06838', '#d88050', '#8c4826');
    for (const [x, y, w, h] of [
        [178, 54, 8, 12],
        [190, 52, 8, 14],
        [184, 46, 8, 20],
    ])
        box(c, x, y, w, h, '#48a058', '#68c070');

    // ---- estante de livros (álbuns: Gen 1 vermelho, Gen 2 cinza)
    box(c, 200, 38, 32, 46, '#9c6a3c', '#b88050', '#6e4828');
    for (const sy of [42, 56, 70]) R(c, 203, sy, 26, 12, '#6e4828');
    const books = ['#4870c0', '#e8c24a', '#58a058', '#c05080', '#7058a8', '#d87838'];
    books.forEach((col, i) => {
        R(c, 204 + i * 4, 44, 3, 10, col);
    });
    R(c, 204, 58, 5, 10, '#d83838');
    R(c, 210, 58, 5, 10, '#8a8a98');
    books.slice(2).forEach((col, i) => {
        R(c, 205 + i * 5, 72, 4, 10, col);
    });

    // ---- tapete na cor do clube
    R(c, 56, 100, 128, 48, mix(clubCol, '#000000', 0.25));
    R(c, 58, 102, 124, 44, clubCol);
    R(c, 61, 105, 118, 38, mix(clubCol, '#ffffff', 0.18));
    R(c, 63, 107, 114, 34, clubCol);

    // ---- vitrine de vidro (as 3 cartas da vitrine, na cor do metal)
    box(c, 92, 124, 56, 8, '#7a5232', '#9c6a3c');
    R(c, 92, 104, 56, 20, OL);
    R(c, 93, 105, 54, 18, '#bfe2ee');
    d.glass.forEach((m, i) => {
        box(c, 99 + i * 16, 107, 12, 15, METAL_PAL[m].o, METAL_PAL[m].h, METAL_PAL[m].s);
        R(c, 102 + i * 16, 110, 6, 6, '#f8f8f0');
    });
    R(c, 95, 106, 1, 8, '#ffffff');
    R(c, 97, 106, 1, 4, '#ffffff');

    // ---- TV com o console (passa o último título)
    box(c, 6, 124, 36, 16, '#7a5232', '#9c6a3c', '#5a3a22');
    box(c, 9, 101, 30, 24, '#585868', '#787888');
    R(c, 12, 104, 24, 17, '#284878');
    box(c, 14, 129, 20, 7, '#c8c8d0', '#e0e0e8');
    R(c, 18, 131, 4, 2, '#7058a8');
    R(c, 26, 131, 4, 2, '#d83838');

    // ---- PC (os números da carreira)
    box(c, 196, 122, 40, 18, '#9c6a3c', '#b88050', '#6e4828');
    box(c, 204, 100, 24, 22, '#d8d8e0', '#f0f0f4');
    R(c, 207, 103, 18, 13, '#2c5838');
    for (const yy of [105, 108, 111]) R(c, 209, yy, 10 + (yy % 3) * 2, 1, '#78d890');
    box(c, 206, 125, 20, 4, '#b8b8c0');
}

/** Lugar de cada móvel no quarto (pixels do desenho) e pra onde ele leva. */
type Spot = 'cups' | 'daily' | 'duel' | 'liga' | 'diploma' | 'medals' | 'pc' | 'tv' | 'books' | 'glass' | 'flag';
const SPOTS: { target: RoomTarget; x: number; y: number; w: number; h: number; label: Spot }[] = [
    { target: 'tr-copa', x: 8, y: 36, w: 96, h: 24, label: 'cups' },
    { target: 'tr-dia', x: 8, y: 60, w: 96, h: 24, label: 'daily' },
    { target: 'tr-duelo', x: 198, y: 4, w: 36, h: 30, label: 'duel' },
    { target: 'tr-liga', x: 110, y: 42, w: 36, h: 46, label: 'liga' },
    { target: 'tr-platina', x: 46, y: 8, w: 28, h: 24, label: 'diploma' },
    { target: 'medalhas', x: 150, y: 4, w: 44, h: 34, label: 'medals' },
    { target: 'numeros', x: 194, y: 98, w: 44, h: 44, label: 'pc' },
    { target: 'tr-copa', x: 4, y: 98, w: 40, h: 44, label: 'tv' },
    { target: 'album', x: 198, y: 36, w: 36, h: 50, label: 'books' },
    { target: 'album', x: 90, y: 102, w: 60, h: 32, label: 'glass' },
    { target: 'clube', x: 78, y: 4, w: 68, h: 22, label: 'flag' },
];

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const at = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: pct(x, ROOM_W),
    top: pct(y, ROOM_H),
    width: pct(w, ROOM_W),
    height: pct(h, ROOM_H),
});

export function RoomScene({ data, onPick }: { data: RoomData; onPick: (t: RoomTarget) => void }) {
    const { d } = useT();
    const ref = useRef<HTMLCanvasElement>(null);
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    useEffect(() => {
        const c = ref.current?.getContext('2d');
        if (c) draw(c, data);
    }, [data]);
    const name = (k: Spot) => d.trophies.spots[k];
    return (
        <div className="room" style={{ aspectRatio: `${ROOM_W} / ${ROOM_H}` }}>
            <canvas ref={ref} width={ROOM_W} height={ROOM_H} className="room-canvas" aria-hidden />
            <span className="room-crest" style={at(104, 7, 16, 14)} aria-hidden>
                <Crest look={lookOfProfile(profile)} className="crest" />
            </span>
            {/* o seu Pokémon do avatar no tapete; na TV, o capitão do último título */}
            {!avatar.google && <img className="room-mon pixel" style={at(64, 112, 28, 28)} src={avatar.src} alt="" />}
            {data.tv && (
                <img
                    className="room-tv pixel"
                    style={at(14, 104, 20, 17)}
                    src={speciesGif(data.tv.speciesId, data.tv.shiny)}
                    alt=""
                />
            )}
            {METALS.map((m, i) =>
                data.cups[m] > 1 ? (
                    <b key={m} className="room-n" style={at(25 + i * 32, 54, 14, 6)}>
                        ×{data.cups[m]}
                    </b>
                ) : null,
            )}
            {SPOTS.map((s) => (
                <button
                    type="button"
                    key={s.label}
                    className="room-spot"
                    style={at(s.x, s.y, s.w, s.h)}
                    aria-label={name(s.label)}
                    title={name(s.label)}
                    onClick={() => onPick(s.target)}
                />
            ))}
        </div>
    );
}
