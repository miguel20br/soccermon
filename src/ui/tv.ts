import { flushSync } from 'react-dom';
import { EventBus } from '../game/EventBus';
import { reduceMotionOn } from './reduce-motion';
import { neonOn } from './tema';
import { uiZoom } from './ui-zoom';
import './tv-cut.css';

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

/**
 * Semana Fora da Lei (ui/tema.ts): o corte vira neon. A = a mesma faixa em rosa e ciano com brilho e listras de
 * velocidade; B = 3 painéis inclinados (a capa em painéis) que entram e saem escalonados, de cima e de baixo. Fora do
 * tema é o corte de sempre. No tema as duas se revezam (o Miguel, 17/11): a `n`-ésima troca é A nas pares e B nas
 * ímpares; `?transicao=a|b` (dev e prévias) prende numa.
 */
export type CutKind = 'tv' | 'a' | 'b';
export function cutKind(neon: boolean, search: string, smoke: boolean, n: number): CutKind {
    if (!neon) return 'tv';
    const q = smoke ? new URLSearchParams(search).get('transicao') : null;
    if (q === 'a' || q === 'b') return q;
    return n % 2 ? 'b' : 'a';
}
/** Quantos cortes já houve nesta aba (o revezamento A, B, A…). */
let cuts = 0;

/** Painéis (B): o intervalo entre um e outro, a entrada e a saída de cada. Inteiro: 295 ms (ADR 0004). */
export const PANEL_STAGGER_MS = 25;
export const PANEL_IN_MS = 95;
export const PANEL_OUT_MS = 100;
export const PANELS = 3;

/**
 * Geometria dos painéis (px do CSS): colunas de largura `width` com as bordas inclinadas `s`, a i-ésima em `left(i)`.
 * Paradas no lugar, as 3 cobrem a tela inteira (cada uma passa por cima da borda da anterior: a borda preta vira a
 * calha entre os painéis, como na capa).
 */
export function panelGeometry(w: number, h: number) {
    const s = Math.round(Math.min(h * 0.15, w * 0.12));
    return { s, width: Math.ceil(w / PANELS + 2 * s + 8), left: (i: number) => Math.round(-s + (i * w) / PANELS) };
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
    const kind = cutKind(neonOn, window.location.search, __SMOKE__, cuts++);
    const z = uiZoom();
    const w = window.innerWidth / z;
    const h = window.innerHeight / z;
    const root = document.createElement('div');
    root.className = kind === 'tv' ? 'tv-cut' : `tv-cut neon-${kind}`;
    root.setAttribute('aria-hidden', 'true');
    /** As duas metades do corte: cada uma devolve a animação que acaba por último. */
    let cutIn: () => Animation;
    let cutOut: () => Animation;
    let inMs: number;
    if (kind === 'b') {
        const g = panelGeometry(w, h);
        const panels = Array.from({ length: PANELS }, (_, i) => {
            const p = document.createElement('i');
            p.className = 'nb-panel';
            p.style.left = `${g.left(i)}px`;
            p.style.width = `${g.width}px`;
            p.style.setProperty('--s', `${g.s}px`);
            root.append(p);
            return p;
        });
        // os pares descem de cima e os ímpares sobem de baixo; na saída continuam no mesmo sentido
        const slide = (from: number, to: number, duration: number, easing: string) =>
            panels.map((p, i) => {
                const dir = i % 2 ? -1 : 1;
                return p.animate(
                    [{ transform: `translateY(${from * dir}%)` }, { transform: `translateY(${to * dir}%)` }],
                    {
                        duration,
                        delay: i * PANEL_STAGGER_MS,
                        easing,
                        fill: 'both',
                    },
                );
            })[PANELS - 1];
        cutIn = () => slide(-100, 0, PANEL_IN_MS, 'cubic-bezier(0.5, 0, 0.75, 0)');
        cutOut = () => slide(0, 100, PANEL_OUT_MS, 'cubic-bezier(0.22, 1, 0.36, 1)');
        inMs = PANEL_IN_MS + (PANELS - 1) * PANEL_STAGGER_MS;
    } else {
        const g = cutGeometry(w, h);
        const band = document.createElement('i');
        band.className = 'tv-cut-band';
        band.style.width = `${g.width}px`;
        band.style.setProperty('--s', `${g.s}px`);
        root.append(band);
        const x = (v: number) => ({ transform: `translateX(${v}px)` });
        cutIn = () =>
            band.animate([x(g.start), x(g.cover)], {
                duration: CUT_IN_MS,
                easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
                fill: 'forwards',
            });
        cutOut = () =>
            band.animate([x(g.cover), x(g.end)], {
                duration: CUT_OUT_MS,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards',
            });
        inMs = CUT_IN_MS;
    }
    document.body.append(root);
    queue = [apply];
    const a = cutIn();
    let covered = false;
    const cover = () => {
        if (covered) return;
        covered = true;
        const steps = queue ?? [];
        queue = null;
        flushSync(() => {
            for (const st of steps) st();
        });
        const b = cutOut();
        b.onfinish = b.oncancel = () => root.remove();
    };
    a.onfinish = cover;
    a.oncancel = cover;
    // a aba foi pro fundo no meio (a animação para): a troca vale assim mesmo
    window.setTimeout(cover, inMs + 200);
    return true;
}

/** Saída da partida em câmera lenta (Semana Fora da Lei): a cor some e a câmera aproxima; depois escurece e troca. */
export const SLOWMO_MS = 850;
export const SLOWMO_OUT_MS = 250;
let exiting = false;

/** Câmera lenta da quadra na saída: a velocidade da cena `elapsed` ms depois do começo, de 1x a 0,25x (freia rápido). */
export const SLOWMO_FLOOR = 0.25;
export function slowmoScale(elapsed: number, ms = SLOWMO_MS): number {
    const k = Math.min(1, Math.max(0, elapsed / ms));
    return 1 - (1 - SLOWMO_FLOOR) * (1 - (1 - k) ** 2);
}

/**
 * Do apito final pro resultado (copa, Liga e Duelo) na Semana Fora da Lei: a tela inteira perde a cor, aproxima e desfoca
 * de leve (850 ms; momento raro, ADR 0004 deixa passar dos 300), um véu escuro cobre o fim, a troca acontece por baixo
 * e o véu sai (250 ms). A quadra freia junto (`match:slowmo`: a MatchScene vai a `slowmoScale`; só a reprodução, o
 * motor não sabe). Reduzir movimento: só a cor some e o véu (sem zoom, desfoque nem câmera lenta). Fora do tema:
 * troca direto.
 */
export function slowmoExit(apply: () => void) {
    if (exiting) return;
    if (
        !neonOn ||
        typeof document === 'undefined' ||
        document.visibilityState !== 'visible' ||
        typeof document.body.animate !== 'function'
    ) {
        apply();
        return;
    }
    exiting = true;
    const calm = reduceMotionOn();
    const ms = calm ? 400 : SLOWMO_MS;
    if (!calm) EventBus.emit('match:slowmo', ms);
    const veil = document.createElement('div');
    veil.setAttribute('aria-hidden', 'true');
    // estilo aqui: a partida pode abrir direto (retomada) sem o tv.css carregado; o véu segura toques durante a saída
    veil.style.cssText = 'position:fixed;inset:0;z-index:600;background:#0b0614;opacity:0';
    document.body.append(veil);
    // a tela inteira: o #root e o que mora fora dele (a cartela final e as sheets vão num portal no body)
    const frames = calm
        ? [{ filter: 'grayscale(0)' }, { filter: 'grayscale(1)' }]
        : [
              { filter: 'grayscale(0) blur(0)', transform: 'scale(1)' },
              { filter: 'grayscale(1) blur(2px)', transform: 'scale(1.06)' },
          ];
    const looks = [...document.body.children]
        .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== veil && el.tagName !== 'SCRIPT')
        .map((el) => el.animate(frames, { duration: ms, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' }));
    const dark = veil.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], {
        duration: ms,
        easing: 'ease-in',
        fill: 'forwards',
    });
    let done = false;
    const swap = () => {
        if (done) return;
        done = true;
        // libera antes: se a troca falhar (a tela já saiu, no Duelo), a próxima saída não fica presa
        exiting = false;
        const out = veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SLOWMO_OUT_MS, fill: 'forwards' });
        out.onfinish = out.oncancel = () => veil.remove();
        for (const l of looks) l.cancel();
        flushSync(apply);
    };
    dark.onfinish = dark.oncancel = swap;
    // aba pro fundo no meio: troca assim mesmo
    window.setTimeout(swap, ms + 200);
}
