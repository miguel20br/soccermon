import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import SHINY_MISSING from '../../data/pmd-shiny-missing.json';
import FEET from '../../data/sprite-feet.json';
import { ClockCtx } from './clock';

type Frame = { x: number; y: number; w: number; h: number };
interface Atlas {
    frames: Record<string, { frame: Frame }>;
    meta: { size: { w: number; h: number } };
}

const atlases = new Map<number, Promise<Atlas | null>>();
/** A mesma folha da quadra (assets/field, a do Phaser), baixada uma vez por espécie e só quando aparece. */
const load = (id: number) => {
    let a = atlases.get(id);
    if (!a) {
        a = fetch(`assets/field/${id}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<Atlas>) : null))
            .catch(() => null);
        atlases.set(id, a);
    }
    return a;
};

/** A folha PNG da espécie: a shiny (mesma disposição, reusa o JSON) ou a normal, se o PMDCollab não tem a shiny. */
export const fieldSheet = (id: number, shiny = false) =>
    `assets/field/${shiny && !(SHINY_MISSING as number[]).includes(id) ? 'shiny/' : ''}${id}.png`;

/**
 * Folha só do menu: as 4 animações do menu nas 8 direções, uma fileira por (animação, direção), quadros lado a lado.
 * Devolve o atlas novo e de onde vem cada quadro na folha da quadra.
 */
export function menuLayout(atlas: Atlas): { atlas: Atlas; copies: [Frame, Frame][] } {
    const frames: Atlas['frames'] = {};
    const copies: [Frame, Frame][] = [];
    let w = 0;
    let y = 0;
    for (const anim of Object.keys(MS)) {
        for (let dir = 0; dir < 8; dir++) {
            let x = 0;
            let h = 0;
            for (let i = 0; atlas.frames[`${anim}/${dir}/${i}`]; i++) {
                const from = atlas.frames[`${anim}/${dir}/${i}`].frame;
                const to = { x, y, w: from.w, h: from.h };
                frames[`${anim}/${dir}/${i}`] = { frame: to };
                copies.push([from, to]);
                x += from.w;
                h = Math.max(h, from.h);
            }
            w = Math.max(w, x);
            y += h;
        }
    }
    return { atlas: { frames, meta: { size: { w, h: y } } }, copies };
}

type Sheet = { atlas: Atlas; url: string };
const sheets = new Map<string, Promise<Sheet | null>>();
/**
 * A folha da quadra inteira (até 1584x3904, ~25 MB decodificada) vira uma folha pequena só com o que o menu usa,
 * recortada uma vez num canvas e guardada como blob: o Estádio com 8 espécies ia a ~170 MB de imagem decodificada.
 * Sem canvas (ou se falhar), usa a folha inteira.
 */
const loadSheet = (id: number, shiny = false) => {
    const src = fieldSheet(id, shiny);
    let s = sheets.get(src);
    if (!s) {
        s = load(id).then(async (atlas) => {
            if (!atlas) return null;
            try {
                // ImageBitmap (e não <img>): a folha grande decodificada sai da memória no close(), na hora
                const big = await createImageBitmap(await (await fetch(src)).blob());
                const menu = menuLayout(atlas);
                const canvas = document.createElement('canvas');
                canvas.width = menu.atlas.meta.size.w;
                canvas.height = menu.atlas.meta.size.h;
                const ctx = canvas.getContext('2d');
                for (const [f, t] of menu.copies) ctx?.drawImage(big, f.x, f.y, f.w, f.h, t.x, t.y, t.w, t.h);
                big.close();
                const blob = ctx && (await new Promise<Blob | null>((r) => canvas.toBlob(r)));
                canvas.width = 0;
                if (!blob) throw new Error('sem canvas');
                return { atlas: menu.atlas, url: URL.createObjectURL(blob) };
            } catch {
                return { atlas, url: src };
            }
        });
        sheets.set(src, s);
    }
    return s;
};

/**
 * Painel das abas do menu longe da tela (nem a aba nem as vizinhas, e nunca vista): os sprites dele não baixam.
 */
export const SpriteNearCtx = createContext(true);

/** Tempo de cada quadro (ms): o AnimData fica fora do pedaço; o ritmo fixo basta no menu. */
const MS = { Walk: 110, Idle: 170, Hop: 80, Pose: 120 } as const;
export type FieldAnim = keyof typeof MS;

/**
 * Sprite PMD da quadra num menu (sem Phaser): anda, respira, pula ou faz pose numa das 8 direções (0 = de frente,
 * 2 = direita, 4 = de costas, 6 = esquerda). O pé fica no ponto (left/top do pai, pela altura do pé de cada espécie
 * em sprite-feet.json, a mesma da quadra) e o quadro cresce pra cima. Os quadros andam no relógio da cena
 * (`ClockCtx`): aba escondida, página escondida ou reduzir movimento param tudo junto. `play` falso fica no 1º
 * quadro; `start` (hora do relógio) faz o pulo começar do 1º quadro. Espécie sem a animação (Pose falta em muitas)
 * usa a de respirar. `shiny` usa a folha shiny. `children` fica no topo da cabeça (balão de emote, Zzz). Sem folha, mostra o GIF da carta.
 */
export function FieldSprite({
    id,
    shiny,
    anim,
    dir,
    scale = 2,
    play = true,
    start = 0,
    className = '',
    style,
    children,
}: {
    id: number;
    shiny?: boolean;
    anim: FieldAnim;
    dir: number;
    scale?: number;
    play?: boolean;
    start?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}) {
    const clock = useContext(ClockCtx);
    const near = useContext(SpriteNearCtx);
    const [sheet, setSheet] = useState<Sheet | null | undefined>(undefined);
    const atlas = sheet?.atlas;
    const [k, setK] = useState(0);
    const kRef = useRef(0);
    useEffect(() => {
        if (!near) return;
        let on = true;
        void loadSheet(id, shiny).then((a) => on && setSheet(a));
        return () => {
            on = false;
        };
    }, [id, shiny, near]);
    const use: FieldAnim = atlas?.frames[`${anim}/${dir}/0`] ? anim : 'Idle';
    const frames: Frame[] = [];
    for (let i = 0; atlas?.frames[`${use}/${dir}/${i}`]; i++) frames.push(atlas.frames[`${use}/${dir}/${i}`].frame);
    const n = frames.length;
    // fase própria por espécie: os quadros de todo mundo não viram no mesmo instante
    const phase = start || id * 37;
    useEffect(() => {
        if (!clock || !play || n < 2) return;
        const tick = (t: number) => {
            const nk = Math.max(0, Math.floor((t - phase) / MS[use]));
            if (nk === kRef.current) return;
            kRef.current = nk;
            setK(nk);
        };
        tick(clock.t);
        return clock.sub(tick);
    }, [clock, play, n, use, phase]);
    if (sheet === null)
        return (
            <img
                className={`fs-sprite fs-gif pixel ${className}`}
                style={style}
                src={`assets/cards/${id}.gif`}
                alt=""
            />
        );
    if (!sheet || !atlas || !n) return null;
    const f = frames[play ? k % n : 0];
    const feet = (FEET as Record<string, Partial<Record<string, number>>>)[id];
    const foot = feet?.[use] ?? 0.7;
    return (
        <span
            className={`fs-sprite ${className}`}
            style={{
                ...style,
                transform: `translate(-50%, ${-foot * 100}%)`,
                width: f.w * scale,
                height: f.h * scale,
                backgroundImage: `url(${sheet.url})`,
                backgroundPosition: `${-f.x * scale}px ${-f.y * scale}px`,
                backgroundSize: `${atlas.meta.size.w * scale}px ${atlas.meta.size.h * scale}px`,
            }}
        >
            {children && (
                <span className="fs-head" style={{ top: `${(feet?.top ?? 0.2) * 100}%` }}>
                    {children}
                </span>
            )}
        </span>
    );
}
