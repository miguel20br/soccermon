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
 * medidas à mão (07/12/2026). O Ditto só se disfarça destes. Ficaram só os que trocam o olho limpo (conferido no zoom):
 * olho grande ou que cruza o contorno (Charmander, Pikachu, Clefairy, Jigglypuff, Meowth, Poliwag, Cubone, Slowpoke...) saiu. Um olho só =
 * de perfil.
 */
// biome-ignore format: uma espécie por linha, como medido
export const DITTO_FACES: Record<number, [number, number, number, number][]> = {
    1: [[1, 18, 3, 22], [14, 16, 20, 23]],
    6: [[9, 47, 12, 49]],
    7: [[5, 11, 6, 14], [14, 10, 17, 15]],
    10: [[13, 8, 18, 13]],
    16: [[11, 15, 14, 18]],
    19: [[11, 23, 14, 26]],
    43: [[12, 37, 13, 38], [17, 38, 18, 39]],
    50: [[11, 9, 12, 12], [15, 9, 16, 12]],
    54: [[9, 12, 14, 16], [21, 13, 26, 16]],
    59: [[10, 16, 14, 19]],
    68: [[23, 20, 26, 23], [29, 20, 32, 23]],
    109: [[33, 12, 37, 16], [43, 12, 48, 16]],
    131: [[16, 15, 19, 18]],
    133: [[6, 20, 8, 23], [15, 22, 18, 26]],
    143: [[25, 21, 31, 25], [36, 21, 42, 25]],
    149: [[24, 17, 27, 21]],
};

/**
 * Os olhinhos de ponto do Ditto no sprite (em pixels do sprite; `rgba` como o `ImageData`). Em cada caixa, os pixels do
 * olho (os que fogem da cor da pele em volta, só por dentro do contorno) são repintados um a um com a cor do vizinho
 * de pele mais perto, tirada do próprio sprite: sem retângulo, sem borda. No centro do olho fica o ponto preto do
 * Ditto (1 px de sprite; 2 px nos sprites grandes).
 */
export function dittoEyes(rgba: ArrayLike<number>, w: number, h: number, boxes: readonly number[][]) {
    const at = (x: number, y: number) => (y * w + x) * 4;
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
    const solid = (x: number, y: number) => inside(x, y) && rgba[at(x, y) + 3] >= 128;
    const lum = (x: number, y: number) => {
        const i = at(x, y);
        return 0.3 * rgba[i] + 0.59 * rgba[i + 1] + 0.11 * rgba[i + 2];
    };
    const dist = (x: number, y: number, c: number[]) => {
        const i = at(x, y);
        return Math.abs(rgba[i] - c[0]) + Math.abs(rgba[i + 1] - c[1]) + Math.abs(rgba[i + 2] - c[2]);
    };
    const s = w >= 64 ? 3 : 2;
    return boxes.map(([x0, y0, x1, y1]) => {
        // a pele: a cor mais comum logo em volta da caixa (nem contorno escuro nem brilho)
        const count = new Map<string, { n: number; c: number[] }>();
        for (let y = y0 - 2; y <= y1 + 2; y++)
            for (let x = x0 - 2; x <= x1 + 2; x++) {
                if (!solid(x, y) || (x >= x0 && x <= x1 && y >= y0 && y <= y1) || lum(x, y) < 60) continue;
                const i = at(x, y);
                const c = [rgba[i], rgba[i + 1], rgba[i + 2]];
                const k = c.join();
                count.set(k, { n: (count.get(k)?.n ?? 0) + 1, c });
            }
        const skin = [...count.values()].sort((a, b) => b.n - a.n)[0]?.c;
        // o olho: pixel da caixa longe da pele e cercado de pixel (o contorno de fora fica)
        const eye = new Set<number>();
        if (skin)
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++) {
                    if (!solid(x, y) || dist(x, y, skin) < 60) continue;
                    // na beira do sprite só sai o que não é contorno (o contorno escuro fica)
                    let shut = true;
                    for (let dy = -1; dy <= 1 && shut; dy++)
                        for (let dx = -1; dx <= 1; dx++) if (!solid(x + dx, y + dy)) shut = false;
                    if (shut || lum(x, y) >= 60) eye.add(y * w + x);
                }
        const pixels: { x: number; y: number; fill: string }[] = [];
        let cx = 0;
        let cy = 0;
        for (const k of eye) {
            const x = k % w;
            const y = Math.floor(k / w);
            cx += x;
            cy += y;
            // o vizinho de pele mais perto (fora do olho, perto da cor da pele)
            let best: number[] | null = null;
            for (let r = 1; r <= 4 && !best; r++)
                for (let dy = -r; dy <= r && !best; dy++)
                    for (let dx = -r; dx <= r && !best; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (!solid(nx, ny) || eye.has(ny * w + nx) || dist(nx, ny, skin!) >= 60) continue;
                        const i = at(nx, ny);
                        best = [rgba[i], rgba[i + 1], rgba[i + 2]];
                    }
            const c = best ?? skin!;
            pixels.push({ x, y, fill: `rgb(${c[0]},${c[1]},${c[2]})` });
        }
        const n = eye.size || 1;
        const mx = eye.size ? cx / n : (x0 + x1) / 2;
        const my = eye.size ? cy / n : (y0 + y1) / 2;
        return { pixels, dot: { x: Math.round(mx - (s - 1) / 2), y: Math.round(my - (s - 1) / 2), s } };
    });
}

/**
 * O sprite do disfarce com os olhinhos: o 1º quadro do GIF (as caixas de `DITTO_FACES` foram medidas nele) repintado
 * pixel a pixel num canvas, como imagem parada. Por cima do GIF animado não dava: o sprite balança e o olho original
 * aparecia do lado do remendo. A carta parada também é uma pista de que tem algo errado.
 */
async function dittoSprite(src: string, speciesId: number): Promise<string | null> {
    const boxes = DITTO_FACES[speciesId];
    if (!boxes) return null;
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!w || !h || !ctx) return null;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    for (const { pixels, dot } of dittoEyes(data.data, w, h, boxes)) {
        for (const p of pixels) {
            const [r, g, b] = p.fill.match(/\d+/g)!.map(Number);
            data.data.set([r, g, b, 255], (p.y * w + p.x) * 4);
        }
        for (let y = dot.y; y < dot.y + dot.s; y++)
            for (let x = dot.x; x < dot.x + dot.s; x++) data.data.set([16, 16, 24, 255], (y * w + x) * 4);
    }
    ctx.putImageData(data, 0, 0);
    return ctx.canvas.toDataURL();
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
        const src = img.getAttribute('src') ?? '';
        let live = true;
        dittoSprite(src, mask.speciesId)
            .then((url) => {
                if (live && url) img.src = url;
            })
            .catch(() => undefined);
        return () => {
            live = false;
            img.setAttribute('src', src);
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
