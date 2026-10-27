/**
 * O `zoom` da raiz na tela grande (styles.css, --ui-zoom): getBoundingClientRect e clientX vêm em px da tela, e o
 * que se escreve no estilo (left, translate) vale em px do CSS. Quem passa de um pro outro divide por isto.
 */
export function uiZoom(): number {
    if (typeof document === 'undefined') return 1;
    return Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}
