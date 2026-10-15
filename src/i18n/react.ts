import { createElement, Fragment, type ReactNode, useMemo } from 'react';
import { useGame } from '../store/game-store';
import { type Dict, dict, type Lang, type TKey, t, tn, type Vars } from './index';
import { detectLang } from './lang';

/** Idioma escolhido nas configurações (saves antigos não têm o campo: segue o navegador). */
export const useLang = (): Lang => useGame((s) => s.settings.lang) ?? detectLang();

export interface Translator {
    lang: Lang;
    /** Dicionário do idioma (listas e textos longos). */
    d: Dict;
    t: (key: TKey, vars?: Vars) => string;
    tn: (key: TKey, n: number, vars?: Vars) => string;
}

/** Textos no idioma do jogo; o componente redesenha quando o idioma muda. */
export function useT(): Translator {
    const lang = useLang();
    return useMemo(
        () => ({
            lang,
            d: dict(lang),
            t: (key: TKey, vars?: Vars) => t(key, vars, lang),
            tn: (key: TKey, n: number, vars?: Vars) => tn(key, n, vars, lang),
        }),
        [lang],
    );
}

/**
 * Texto com pedaços de JSX no meio: `rich('Apaga a do {team}.', { team: <b>{nome}</b> })`.
 * Também entende `**negrito**`.
 */
export function rich(text: string, nodes: Record<string, ReactNode> = {}): ReactNode {
    const parts = text.split(/(\{\w+\}|\*\*[^*]+\*\*)/g);
    return createElement(
        Fragment,
        null,
        ...parts.map((part, i) => {
            const m = /^\{(\w+)\}$/.exec(part);
            if (m && m[1] in nodes) return createElement(Fragment, { key: i }, nodes[m[1]]);
            const b = /^\*\*([^*]+)\*\*$/.exec(part);
            if (b) return createElement('b', { key: i }, b[1]);
            return part;
        }),
    );
}
