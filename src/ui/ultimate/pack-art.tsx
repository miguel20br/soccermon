import { useT } from '../../i18n/react';
import type { PackKind, UtPick } from '../../store/ultimate/ultimate';
import type { Metal } from '../rarity';

/**
 * O nome do PNG do pacote em `public/assets/ui/pacotes/{pt,en}/` (desenhado por `scripts/arte/pacotes.py`, com o
 * texto na língua): o tipo do pacote, o metal do Pick com Fichas, ou o Pick guardado.
 */
export function packArt(x: PackKind | Metal | UtPick): string {
    if (typeof x === 'string') return x === 'big' ? 'grande' : x;
    if (x.from === 'start') return 'craque';
    if (x.event) return `evento-${x.event}`;
    if (x.from === 'gym') return x.type ? `lider-${x.type.toLowerCase()}` : 'lider';
    return x.min;
}

/** A arte do pacote em 1x (126x174); o CSS amplia em escala inteira com `pixelated`. Fora do bundle (public/). */
export function PackImg({ art }: { art: string }) {
    const { lang } = useT();
    return (
        <img
            className="ut-packimg"
            src={`assets/ui/pacotes/${lang}/${art}.png`}
            alt=""
            width={126}
            height={174}
            decoding="async"
            draggable={false}
        />
    );
}
