import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';
import { uiZoom } from '../ui-zoom';

/** Celular pequeno (SE) ou deitado. */
export const SMALL = '(max-width: 359px), (max-height: 520px)';
/** PC (e tablet grande). */
export const BIG = '(min-width: 900px) and (min-height: 700px)';

/**
 * Escala dos sprites PMD fora da partida (revisão de arte, F3/D2): uma escala inteira por cena e por tamanho de tela,
 * a mesma em todo ambiente. Celular pequeno ou deitado 1x, celular 2x, PC 3x; nada de 2x, 3x e 4x na mesma cena.
 * A tabela de quem usa o quê fica em docs/planos/revisao-arte.md.
 */
export const sceneScale = (small: boolean, big: boolean) => (small ? 1 : big ? 3 : 2);

/**
 * Onde a cena pede presença (retorno do Miguel, 10/11), uma escala inteira acima, ainda uma só por cena: o Estádio do
 * PC todo em 4x (capitão, torcida e gandula); a prancheta de campo (Estádio) em 2x (1x só no celular pequeno ou deitado).
 */
export const estadioScale = (small: boolean, big: boolean) => (big ? 4 : sceneScale(small, big));
export const boardScale = (small: boolean) => (small ? 1 : 2);
/** Media query como estado (sprite maior no desktop, menor no celular pequeno). */
export function useMq(q: string): boolean {
    const [on, setOn] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
    useEffect(() => {
        const m = matchMedia(q);
        const f = () => setOn(m.matches);
        f();
        m.addEventListener('change', f);
        return () => m.removeEventListener('change', f);
    }, [q]);
    return on;
}

/** A escala da cena no tamanho de tela de agora (`sceneScale`). */
export function useSceneScale(): number {
    return sceneScale(useMq(SMALL), useMq(BIG));
}

/**
 * Pixel inteiro na tela (D3): o `zoom` do CSS por cima (palco do PC 1,2/1,35, tela grande 1,25/1,6) multiplicava o
 * sprite e deixava 2,7x e 4,05x. O sprite desfaz o zoom (`zoom: 1/z`) e desenha com a maior escala inteira em pixels
 * do aparelho que cabe no tamanho pensado pra cena (`scale` x `z`), nunca maior que ele. Zoom abaixo de 1 (a prancheta
 * do draft encolhida pra caber) não encolhe o sprite: pedia 2x e mostrava 1x. Devolve a escala em px do CSS (já sem o
 * zoom) e o zoom a pôr no sprite.
 */
export function realScale(scale: number, z = 1, dpr = 1): { css: number; zoom: number } {
    const zz = z > 0 ? z : 1;
    const d = dpr > 0 ? dpr : 1;
    // folga de 1%: 3 x 1 x 1 não pode virar 2 por erro de ponto flutuante
    const device = Math.max(1, Math.floor(scale * Math.max(1, zz) * d + 0.01));
    return { css: device / d, zoom: 1 / zz };
}

/**
 * A escala inteira de uma fileira (D4): a maior até `max` em que o corpo de todos (px, null = sem a animação) cabe em
 * `fit` px, a mesma pra todos (antes cada um escolhia a sua e o Kakuna ficava 2x ao lado do Gyarados 1x).
 */
export const rowScale = (bodies: (number | null)[], fit: number, max: number) =>
    Math.max(1, Math.min(max, ...bodies.map((b) => (b ? Math.floor(fit / b) : max))));

/**
 * Sprite clássico (GIF de frente, 1x) em pixel exato (11/11): cada pixel do GIF vira um número inteiro de pixels da
 * tela (1, 2, 3…) ou, se o GIF é maior que a caixa, exatamente 1/2, 1/3… (nearest-neighbor tira 1 a cada 2, 3).
 * Vale o degrau mais perto do tamanho de antes (`target`, px do CSS), sem passar dele mais que `over` (30%); conta em
 * pixel do aparelho (`z` o zoom do CSS por cima, `dpr` os pixels por px). Devolve a altura em px do CSS.
 */
export function pixelFit(target: number, natural: number, z = 1, dpr = 1, over = 1.3): number {
    const d = (z > 0 ? z : 1) * (dpr > 0 ? dpr : 1);
    const r = (target * d) / natural;
    // os degraus em volta de r: ... 1/3, 1/2, 1, 2, 3 ...
    const lo = r >= 1 ? Math.floor(r + 1e-6) : 1 / Math.ceil(1 / r - 1e-6);
    const hi = lo >= 1 ? lo + 1 : 1 / (1 / lo - 1);
    const k = hi <= r * over && hi / r < r / lo ? hi : lo;
    return (k * natural) / d;
}

/**
 * Aplica `pixelFit` nos `img[data-px]` de `root`: a altura que o CSS dá ao sprite é o alvo. `data-px="box"` (vaga da
 * prancheta) mantém a caixa do CSS (a sobra ou o excesso vai na margem de cima, o pé no mesmo lugar); `data-px="tight"`
 * (foto do VERSUS, sem folga em volta) passa no máximo 20% do alvo.
 */
export function fitPixelSprites(root: ParentNode) {
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    for (const img of root.querySelectorAll<HTMLImageElement>('img[data-px]')) {
        if (!img.naturalHeight) continue;
        img.style.height = '';
        img.style.marginTop = '';
        const t = Number.parseFloat(getComputedStyle(img).height);
        if (!(t > 0)) continue;
        const h = pixelFit(t, img.naturalHeight, uiZoom(img), dpr, img.dataset.px === 'tight' ? 1.2 : 1.3);
        img.style.height = `${h}px`;
        if (img.dataset.px === 'box') img.style.marginTop = `${t - h}px`;
    }
}

/** `fitPixelSprites` a cada render, a cada GIF que carrega e quando a caixa muda de tamanho. */
export function usePixelFit(ref: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        if (ref.current) fitPixelSprites(ref.current);
    });
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const fit = () => fitPixelSprites(el);
        el.addEventListener('load', fit, true);
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
        ro?.observe(el);
        return () => {
            el.removeEventListener('load', fit, true);
            ro?.disconnect();
        };
    }, [ref]);
}
