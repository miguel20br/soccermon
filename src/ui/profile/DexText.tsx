import { useEffect, useState } from 'react';
import { useT } from '../../i18n/react';

type Texts = Record<'pt' | 'en', Record<string, string>>;

let loaded: Texts | null = null;
let loading: Promise<Texts> | null = null;
/**
 * Texto da Pokédex (src/data/dex-text.json, gerado por scripts/fetch-dex-text.ts: PT-BR oficial do TCG Pocket, EN do
 * Red/Blue). Vem num pedaço à parte, só quando a ficha ou o Álbum abre; depois fica guardado.
 */
export function loadDexText(): Promise<Texts> {
    loading ??= import('../../data/dex-text.json').then((m) => {
        loaded = m.default as Texts;
        return loaded;
    });
    return loading;
}

/** O texto da Pokédex da espécie, no idioma do jogo (entra com fade; sem texto, não ocupa nada). */
export function DexText({ id, className = '' }: { id: number; className?: string }) {
    const { lang } = useT();
    const [texts, setTexts] = useState(loaded);
    useEffect(() => {
        if (texts) return;
        let on = true;
        loadDexText()
            .then((t) => on && setTexts(t))
            .catch(() => {});
        return () => {
            on = false;
        };
    }, [texts]);
    const text = texts?.[lang][id] ?? texts?.en[id];
    if (texts && !text) return null;
    return <p className={`pf-dex-text ${className}${text ? ' on' : ''}`}>{text}</p>;
}
