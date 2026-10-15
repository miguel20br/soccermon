/** Idiomas do jogo. Este arquivo não importa nada do jogo (o store usa `detectLang` no valor padrão). */
export type Lang = 'pt' | 'en';

export const LANGS: Lang[] = ['pt', 'en'];

/**
 * Idioma inicial: o do navegador (pt* → português, o resto → inglês). Fora do navegador (testes, worker)
 * fica em português, que é a língua de referência do jogo.
 */
export function detectLang(): Lang {
    if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'pt';
    const l = (navigator.language ?? '').toLowerCase();
    return l.startsWith('pt') ? 'pt' : 'en';
}

/** Valor do atributo `lang` do <html>. */
export const htmlLang = (lang: Lang) => (lang === 'pt' ? 'pt-BR' : 'en');
