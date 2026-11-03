import { flushSync } from 'react-dom';
import { reduceMotionOn } from './reduce-motion';
import { uiZoom } from './ui-zoom';

/**
 * A transmissão (cara-de-jogo.md, direção C; padrão desde 0.9.37): corte de TV em diagonal na troca de tela.
 * Reduzir movimento cai no fade. O letreiro de canal flutuante saiu na 0.9.37.1 (o Miguel não curtiu).
 */

/** Corte inteiro: a faixa entra (cobre a tela na metade) e sai do outro lado. 280 ms (ADR 0004: 200–300 ms). */
export const CUT_IN_MS = 130;
export const CUT_OUT_MS = 150;

/**
 * Geometria da faixa (px do CSS): um paralelogramo de largura `w + 2s` com as bordas inclinadas `s` (a diagonal),
 * que anda de `start` (fora, à direita) a `end` (fora, à esquerda) e cobre a tela inteira em `cover`.
 */
export function cutGeometry(w: number, h: number) {
    const s = Math.round(h * 0.36);
    return { s, width: w + 2 * s, start: w, cover: -s, end: -(w + 2 * s) };
}

/** O que chegou enquanto a faixa entra (antes de cobrir): troca junto, embaixo dela. */
let queue: (() => void)[] | null = null;

/**
 * Troca de tela com o corte de TV: a faixa na cor do kit (tinta do placar e filete amarelo) varre da direita pra
 * esquerda, a troca acontece com a tela coberta e a faixa sai. Devolve false quando não dá pra animar (Reduzir
 * movimento, aba escondida, navegador sem WAAPI): aí quem chamou usa a transição de sempre.
 */
export function tvCut(apply: () => void): boolean {
    if (queue) {
        queue.push(apply);
        return true;
    }
    if (
        typeof document === 'undefined' ||
        reduceMotionOn() ||
        document.visibilityState !== 'visible' ||
        typeof document.body.animate !== 'function'
    )
        return false;
    const z = uiZoom();
    const g = cutGeometry(window.innerWidth / z, window.innerHeight / z);
    const root = document.createElement('div');
    root.className = 'tv-cut';
    root.setAttribute('aria-hidden', 'true');
    const band = document.createElement('i');
    band.className = 'tv-cut-band';
    band.style.width = `${g.width}px`;
    band.style.setProperty('--s', `${g.s}px`);
    root.append(band);
    document.body.append(root);
    queue = [apply];
    const x = (v: number) => ({ transform: `translateX(${v}px)` });
    const a = band.animate([x(g.start), x(g.cover)], {
        duration: CUT_IN_MS,
        easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
        fill: 'forwards',
    });
    let covered = false;
    const cover = () => {
        if (covered) return;
        covered = true;
        const steps = queue ?? [];
        queue = null;
        flushSync(() => {
            for (const st of steps) st();
        });
        const b = band.animate([x(g.cover), x(g.end)], {
            duration: CUT_OUT_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
        });
        b.onfinish = b.oncancel = () => root.remove();
    };
    a.onfinish = cover;
    a.oncancel = cover;
    // a aba foi pro fundo no meio (a animação para): a troca vale assim mesmo
    window.setTimeout(cover, CUT_IN_MS + 200);
    return true;
}
