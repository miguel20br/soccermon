import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../rarity';

export const DITTO = 132;
/** Do toque até a carta do Ditto estar inteira (o disfarce derrete em 0,5 s; o Ditto sobe de 0,2 s a 0,65 s). */
export const DITTO_REVEAL_MS = 650;

/**
 * A carta que o Ditto finge ser no pacote: outra espécie do mesmo metal (sem lendário), com a mesma edição e nível. A
 * mesma carta do Ditto sempre vira o mesmo disfarce (a semente é o uid).
 */
export function dittoDisguise(inst: PokemonInstance): PokemonInstance {
    const metal = metalOf(viewInstance(inst).overall);
    const as = (id: number): PokemonInstance => ({ ...inst, speciesId: id, evolvedFrom: undefined });
    // só quem tem os olhos medidos (DITTO_FACES); sem nenhum do metal, qualquer um do metal (sem os olhinhos)
    const others = SPECIES.filter((sp) => sp.id !== DITTO && sp.tier !== 'legendary');
    const sameAll = others.filter((sp) => metalOf(viewInstance(as(sp.id)).overall) === metal);
    const faced = sameAll.filter((sp) => DITTO_FACES[sp.id]);
    const same = faced.length ? faced : sameAll;
    const rng = new Rng(inst.uid, 'ditto');
    const id = rng.pick(same.length ? same : others).id;
    return {
        ...createInstance(id, rng, inst.level),
        uid: `${inst.uid}~ditto`,
        shiny: inst.shiny,
        special: inst.special ?? null,
        evolved: inst.evolved,
        trained: inst.trained,
    };
}

/**
 * Os olhos de cada disfarce possível no sprite da carta (`assets/cards/<id>.gif`), em caixas de pixel [x0, y0, x1, y1]
 * medidas à mão (07/12/2026). O Ditto só se disfarça destes: é aqui que os olhos dele substituem os do Pokémon. Um olho
 * só = de perfil.
 */
// biome-ignore format: uma espécie por linha, como medido
export const DITTO_FACES: Record<number, [number, number, number, number][]> = {
    1: [[1, 18, 3, 22], [14, 16, 20, 23]],
    4: [[7, 7, 8, 12], [16, 7, 19, 12]],
    6: [[9, 47, 12, 49]],
    7: [[5, 11, 6, 14], [14, 10, 17, 15]],
    10: [[13, 9, 18, 13]],
    16: [[11, 15, 14, 18]],
    19: [[11, 23, 14, 26]],
    25: [[8, 15, 9, 17], [17, 13, 20, 16]],
    35: [[12, 18, 16, 20], [25, 18, 30, 20]],
    39: [[13, 24, 17, 31], [25, 22, 33, 29]],
    43: [[12, 37, 13, 38], [17, 38, 18, 39]],
    50: [[11, 9, 12, 12], [15, 9, 16, 12]],
    52: [[10, 31, 13, 36], [20, 31, 25, 36]],
    54: [[9, 12, 14, 16], [21, 13, 26, 16]],
    58: [[4, 23, 5, 26], [14, 22, 17, 27]],
    59: [[10, 16, 14, 19]],
    60: [[3, 5, 7, 9], [14, 5, 19, 9]],
    66: [[17, 10, 19, 14], [25, 10, 28, 14]],
    68: [[23, 20, 26, 23], [29, 20, 32, 23]],
    74: [[22, 26, 25, 29], [29, 26, 32, 29]],
    79: [[9, 35, 11, 39], [21, 36, 25, 40]],
    81: [[11, 14, 18, 18]],
    104: [[29, 13, 33, 18]],
    109: [[33, 12, 37, 16], [43, 12, 48, 16]],
    113: [[21, 10, 22, 12], [26, 10, 27, 12]],
    129: [[11, 29, 15, 34]],
    131: [[16, 15, 19, 18]],
    133: [[6, 20, 8, 23], [15, 22, 18, 26]],
    143: [[25, 21, 31, 25], [36, 21, 42, 25]],
    149: [[24, 17, 27, 21]],
};

/**
 * Os olhinhos de ponto do Ditto no sprite (em pixels do sprite; `rgba` como o `ImageData`): cada olho do Pokémon some
 * debaixo de um remendo da cor da pele em volta (a mais comum, nem contorno escuro nem brilho) e ganha um ponto no meio.
 */
export function dittoEyes(rgba: ArrayLike<number>, w: number, h: number, boxes: readonly number[][]) {
    const s = Math.max(1, Math.round(w / 32));
    return boxes.map(([x0, y0, x1, y1]) => {
        const count = new Map<string, number>();
        for (let y = y0 - 3; y <= y1 + 3; y++)
            for (let x = x0 - 3; x <= x1 + 3; x++) {
                if (x < 0 || y < 0 || x >= w || y >= h || (x >= x0 && x <= x1 && y >= y0 && y <= y1)) continue;
                const i = (y * w + x) * 4;
                const lum = 0.3 * rgba[i] + 0.59 * rgba[i + 1] + 0.11 * rgba[i + 2];
                if (rgba[i + 3] < 128 || lum < 60 || lum > 235) continue;
                const c = `rgb(${rgba[i]},${rgba[i + 1]},${rgba[i + 2]})`;
                count.set(c, (count.get(c) ?? 0) + 1);
            }
        const fill = [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const dot = { x: Math.round((x0 + x1 + 1 - s) / 2), y: Math.round((y0 + y1 + 1 - s) / 2), s };
        return { patch: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, fill }, dot };
    });
}

/** Põe os olhinhos por cima do sprite (`img.m-art`): um SVG irmão com a mesma caixa e o mesmo `object-fit`. */
function eyesOver(img: HTMLImageElement, speciesId: number) {
    const boxes = DITTO_FACES[speciesId];
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!boxes || !w || !h || !ctx) return null;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.drawImage(img, 0, 0);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'm-art ditto-eyes');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    const rect = (x: number, y: number, rw: number, rh: number, fill?: string | null) => {
        const r = document.createElementNS(ns, 'rect');
        for (const [k, v] of Object.entries({ x, y, width: rw, height: rh })) r.setAttribute(k, String(v));
        if (fill) r.setAttribute('fill', fill);
        svg.append(r);
    };
    const eyes = dittoEyes(ctx.getImageData(0, 0, w, h).data, w, h, boxes);
    for (const { patch } of eyes) if (patch.fill) rect(patch.x, patch.y, patch.w, patch.h, patch.fill);
    for (const { dot } of eyes) rect(dot.x, dot.y, dot.s, dot.s);
    img.after(svg);
    return svg;
}

/** O disfarce está à vista (o pacote abriu inteiro e ninguém tocou nele ainda). */
const masked = (box: Element) => {
    const m = box.querySelector('.ditto-mask');
    return !box.classList.contains('is-melt') && !!m && getComputedStyle(m).visibility === 'visible';
};

/** Derrete os Dittos ainda disfarçados em `root` (o Continuar do pacote do UT); `true` se havia algum. */
export function meltDittos(root: ParentNode | null | undefined): boolean {
    const boxes = [...(root?.querySelectorAll<HTMLElement>('.ditto-swap') ?? [])].filter(masked);
    for (const b of boxes) b.click();
    return boxes.length > 0;
}

/**
 * Ditto no pacote (ideia de playtester, 07/12/2026): sai disfarçado de outro Pokémon do mesmo metal, com os olhinhos de
 * ponto do Ditto, e fica assim até o jogador tocar na carta; aí o disfarce derrete em roxo, o Ditto sobe e o toque segue
 * (escolher, comprar, ver de perto) já com o Ditto. O disfarce só aparece num pacote que abriu inteiro (`.is-played` do
 * CardPack): pulou a abertura ou "reduzir movimento" = já é o Ditto. `render` desenha a carta (a mesma pros dois).
 */
export function DittoMask({ inst, render }: { inst: PokemonInstance; render: (inst: PokemonInstance) => ReactNode }) {
    const mask = useMemo(() => (inst.speciesId === DITTO ? dittoDisguise(inst) : null), [inst]);
    const [melt, setMelt] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const img = ref.current?.querySelector<HTMLImageElement>('.ditto-mask img.m-art');
        if (!mask || !img) return;
        let svg: SVGSVGElement | null = null;
        const draw = () => {
            svg = eyesOver(img, mask.speciesId);
        };
        if (img.complete) draw();
        else img.addEventListener('load', draw, { once: true });
        return () => {
            img.removeEventListener('load', draw);
            svg?.remove();
        };
    }, [mask]);
    if (!mask) return render(inst);
    // o toque derrete o disfarce e só depois chega na carta (o mesmo botão, já com o Ditto à vista)
    const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget;
        if (!masked(box)) return;
        e.preventDefault();
        e.stopPropagation();
        setMelt(true);
        const btn = e.target instanceof HTMLElement && e.target !== box ? e.target.closest('button') : null;
        if (btn && box.contains(btn)) window.setTimeout(() => btn.click(), DITTO_REVEAL_MS);
    };
    return (
        <div ref={ref} className={`ditto-swap${melt ? ' is-melt' : ''}`} onClickCapture={onClickCapture}>
            <div className="ditto-real">{render(inst)}</div>
            <div className="ditto-mask" aria-hidden inert>
                {render(mask)}
            </div>
        </div>
    );
}
