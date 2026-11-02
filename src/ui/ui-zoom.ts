/**
 * O `zoom` da raiz na tela grande (styles.css, --ui-zoom): getBoundingClientRect e clientX vêm em px da tela, e o
 * que se escreve no estilo (left, translate) vale em px do CSS. Quem passa de um pro outro divide por isto. Com `el`,
 * devolve o zoom que vale nele (a raiz vezes o do palco no PC, stage.css `--k-big`).
 */
export function uiZoom(el?: Element | null): number {
    if (typeof document === 'undefined') return 1;
    if (el?.currentCSSZoom) return el.currentCSSZoom;
    return Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}
