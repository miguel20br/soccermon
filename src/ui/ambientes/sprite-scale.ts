import { useEffect, useState } from 'react';

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
 * PC todo em 4x (capitão, torcida e gandula); o VERSUS duas acima dos lugares (3x pequeno, 4x celular, 5x PC), maior
 * que a BW antiga; a prancheta em 2x (1x só no celular pequeno ou deitado).
 */
export const estadioScale = (small: boolean, big: boolean) => (big ? 4 : sceneScale(small, big));
export const versusScale = (small: boolean, big: boolean) => sceneScale(small, big) + 2;
export const boardScale = (small: boolean) => (small ? 1 : 2);
/**
 * A maior escala inteira até `max` em que o time cabe na caixa: `u` é a altura pensada pro capitão (px) e um Pokémon
 * médio em PMD tem uns 30 px de quadro por escala. VERSUS a 320 fica 2x, deitado 3x, 390 4x, PC 5x.
 */
export const fitScale = (u: number, max: number) => Math.max(1, Math.min(max, Math.floor(u / 30)));

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
