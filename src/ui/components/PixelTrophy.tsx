import type { Metal } from '../rarity';
import '../trophy-room.css';

/**
 * Troféus em pixel art desenhados por código (uma linha = uma fileira de pixels): `o` metal, `h` brilho, `s` sombra,
 * `b` base de madeira, `r` fita (cor do clube), `k` couro do cinturão, `i` faixa índigo (taça da Liga Índigo).
 */
export const ART = {
    taca: [
        '..hhhhhhhhhhhh..',
        '.s.hoooooooos.s.',
        's..hoooooooos..s',
        's..hoooooooos..s',
        '.s.hoooooooos.s.',
        '...shooooooos...',
        '....shooooos....',
        '.....shooos.....',
        '......hoos......',
        '......hoos......',
        '.....hoooos.....',
        '....bbbbbbbb....',
        '...bbbbbbbbbb...',
        '...bbbbbbbbbb...',
    ],
    /** Taça da Liga Índigo (Rota Índigo): a taça com a faixa índigo no bojo e base mais alta. */
    liga: [
        '..hhhhhhhhhhhh..',
        '.s.hoooooooos.s.',
        's..hoooooooos..s',
        's..iiiiiiiiii..s',
        '.s.hoooooooos.s.',
        '...shooooooos...',
        '....shooooos....',
        '.....shooos.....',
        '......hoos......',
        '......hoos......',
        '.....hoooos.....',
        '....iiiiiiii....',
        '...bbbbbbbbbb...',
        '...bbbbbbbbbb...',
    ],
    medalhao: [
        '....rr....rr....',
        '.....rr..rr.....',
        '......rrrr......',
        '.....hoooos.....',
        '....hoooooos....',
        '...hoooooooos...',
        '...hoossssoos...',
        '...hosoooosos...',
        '...hoossssoos...',
        '...hoooooooos...',
        '....hoooooos....',
        '.....ssssss.....',
    ],
    cinturao: [
        '.....hhhhhhhhhh.....',
        'kkkkhoooooooooosskkk',
        'kkkkhooossssooosskkk',
        'kkkkhoosoooosoosskkk',
        'kkkkhooossssooosskkk',
        'kkkkhoooooooooosskkk',
        '.....ssssssssssss...',
    ],
} as const;
export type ArtKind = keyof typeof ART;

const PALETTE: Record<Metal, { o: string; h: string; s: string }> = {
    bronze: { o: '#c98a52', h: '#e8b07a', s: '#8d5a30' },
    prata: { o: '#c9ced8', h: '#f2f4f8', s: '#8a91a0' },
    ouro: { o: '#e8c24a', h: '#fff1a8', s: '#b08a20' },
};

const GB_METAL: Record<Metal, string> = { bronze: '#306230', prata: '#8bac0f', ouro: '#9bbc0f' };

/** Um path por cor (um quadradinho por pixel). Silhueta: tudo numa cor só, apagada. */
export function PixelTrophy({
    kind,
    metal,
    ghost,
    gb,
    className = '',
}: {
    kind: ArtKind;
    metal: Metal;
    ghost?: boolean;
    /** Nos 4 tons do Game Boy (o metal vira o tom: ouro claro, bronze escuro). */
    gb?: boolean;
    className?: string;
}) {
    const rows = ART[kind];
    const pal: Record<string, string> = gb
        ? { o: GB_METAL[metal], h: '#9bbc0f', s: '#0f380f', b: '#0f380f', r: '#306230', k: '#0f380f', i: '#306230' }
        : { ...PALETTE[metal], b: '#5a3b24', r: 'var(--tr-ribbon)', k: '#3a2a22', i: '#4b4fc4' };
    const paths = new Map<string, string>();
    rows.forEach((row, y) => {
        [...row].forEach((c, x) => {
            if (c === '.') return;
            const fill = ghost ? 'var(--tr-ghost)' : pal[c];
            paths.set(fill, `${paths.get(fill) ?? ''}M${x} ${y}h1v1h-1z`);
        });
    });
    return (
        <svg
            className={`tr-art tr-${kind}${ghost ? ' ghost' : ''} ${className}`}
            viewBox={`0 0 ${rows[0].length} ${rows.length}`}
            shapeRendering="crispEdges"
            aria-hidden
        >
            {[...paths].map(([fill, d]) => (
                <path key={fill} d={d} fill={fill} />
            ))}
        </svg>
    );
}
