import { flushSync } from 'react-dom';
import { reduceMotionOn } from './reduce-motion';
import { uiZoom } from './ui-zoom';

/**
 * Protótipo "Transmissão Kanto" (cara-de-jogo.md, direção C): corte de TV em diagonal na troca de tela, letreiro de
 * canal (o bug no canto e a faixa com o nome do programa) e o menu de modos como grade de programação. Só no dev e
 * nas prévias (`__SMOKE__`): `?lab=tv` liga na aba até fechar, `?lab=tv-off` desliga. Sem a bandeira nada muda.
 */
const KEY = 'soccermon-lab-tv';

export function tvFlag(search: string, stored: string | null, smoke: boolean): boolean {
    if (!smoke) return false;
    const q = new URLSearchParams(search).get('lab');
    if (q === 'tv') return true;
    if (q === 'tv-off') return false;
    return stored === '1';
}

let on = false;
/** Ligado nesta aba (lido uma vez pelo App, `readTv`). */
export const tvOn = () => on;

/** Lê e guarda a escolha (entrar na copa troca a URL; a troca de tela seguinte tem que lembrar). */
export function readTv(): boolean {
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    on = tvFlag(window.location.search, stored, __SMOKE__);
    try {
        if (on) sessionStorage.setItem(KEY, '1');
        else sessionStorage.removeItem(KEY);
    } catch {
        // nada
    }
    return on;
}

/** Corte inteiro: a faixa entra (cobre a tela na metade) e sai do outro lado. Dentro dos 280–350 ms da proposta. */
export const CUT_IN_MS = 150;
export const CUT_OUT_MS = 170;

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

/** Nome do "programa" que a faixa de baixo mostra: a tela, ou a aba da Home (Ambientes avisa quando troca). */
type Listener = (name: string | null) => void;
const listeners = new Set<Listener>();
/** O último anunciado: quem assina depois (o letreiro monta depois da Home) recebe na hora. */
let last: string | null = null;
export function announceProgram(name: string | null) {
    last = name;
    for (const l of listeners) l(name);
}
export function onProgram(l: Listener) {
    listeners.add(l);
    l(last);
    return () => {
        listeners.delete(l);
    };
}

/** Controle ou a quadra (onde o letreiro não pode ficar por cima). */
const CONTROL = 'button, a, input, select, textarea, [role=tab], [role=button], nav, canvas, .bc-thumbbar';
/** Controle, a quadra ou texto: o letreiro não esconde informação. */
const busy = (el: Element | null) =>
    !!el &&
    (!!el.closest(CONTROL) || [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()));

/**
 * A linha livre mais baixa pro letreiro: sobe de baixo (px da tela) até achar, nas colunas `xs`, uma faixa de `h` px
 * sem controle nem texto embaixo. Devolve a distância até o pé da tela (px do CSS) ou null se não acha no terço de baixo.
 */
export function freeBottom(xs: number[], h: number): number | null {
    const z = uiZoom();
    const H = window.innerHeight;
    const hit = (x: number, y: number) => busy(document.elementFromPoint(x, y));
    for (let y = H - 4; y > H * 0.7; y -= 6) {
        if (xs.every((x) => !hit(x, y) && !hit(x, y - h * z) && !hit(x, y - (h * z) / 2))) return (H - y) / z;
    }
    return null;
}
