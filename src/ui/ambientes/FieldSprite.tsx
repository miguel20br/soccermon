import {
    type CSSProperties,
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import SHINY_MISSING from '../../data/pmd-shiny-missing.json';
import FEET from '../../data/sprite-feet.json';
import { ClockCtx } from './clock';
import { realScale } from './sprite-scale';

type Frame = { x: number; y: number; w: number; h: number };
interface Atlas {
    frames: Record<string, { frame: Frame }>;
    meta: { size: { w: number; h: number } };
    /** Durações do AnimData (em 1/60 s), por animação. */
    anims?: Record<string, { durations: number[] }>;
}
/** O JSON da folha do menu (scripts/build-menu-sheets.ts): por animação, o quadro, a 1ª fileira e as durações. */
export interface MenuSheet {
    size: { w: number; h: number };
    anims: Record<string, { w: number; h: number; y: number; n: number; rows: number; durations: number[] }>;
}

/** A folha do menu da espécie: a shiny (mesma disposição, reusa o JSON) ou a normal, se o PMDCollab não tem a shiny. */
export const fieldSheet = (id: number, shiny = false) =>
    `assets/field/menu/${shiny && !(SHINY_MISSING as number[]).includes(id) ? 'shiny/' : ''}${id}.png`;

/** Os quadros "Anim/direção/i" da folha do menu: uma fileira por direção, quadros lado a lado. */
export function menuAtlas(m: MenuSheet): Atlas {
    const frames: Atlas['frames'] = {};
    for (const [anim, a] of Object.entries(m.anims))
        for (let row = 0; row < a.rows; row++)
            for (let i = 0; i < a.n; i++)
                frames[`${anim}/${row}/${i}`] = { frame: { x: i * a.w, y: a.y + row * a.h, w: a.w, h: a.h } };
    return { frames, meta: { size: m.size }, anims: m.anims };
}

const atlases = new Map<number, Promise<Atlas | null>>();
const load = (id: number) => {
    let a = atlases.get(id);
    if (!a) {
        a = fetch(`assets/field/menu/${id}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<MenuSheet>) : null))
            .then((m) => (m ? menuAtlas(m) : null))
            .catch(() => null);
        atlases.set(id, a);
    }
    return a;
};

type Sheet = { atlas: Atlas; url: string };
const sheets = new Map<string, Promise<Sheet | null>>();
/**
 * A folha só com o que o menu usa (Walk, Idle, Hop, Pose), gerada antes (npm run assets:menu): JSON e PNG baixam
 * juntos e o sprite só aparece com a imagem já decodificada. Antes o navegador baixava a folha inteira da quadra (até
 * 3512x3392, ~25 MB decodificada), esperava o JSON pra começar e recortava num canvas: com a página ocupada, o menu
 * de modos ficava segundos só com as sombras (F7 da revisão de arte).
 */
const loadSheet = (id: number, shiny = false) => {
    const url = fieldSheet(id, shiny);
    let s = sheets.get(url);
    if (!s) {
        const img = new Image();
        img.src = url;
        s = Promise.all([load(id), img.decode().catch(() => undefined)]).then(([atlas]) =>
            atlas ? { atlas, url } : null,
        );
        sheets.set(url, s);
    }
    return s;
};

/**
 * Painel das abas do menu longe da tela (nem a aba nem as vizinhas, e nunca vista): os sprites dele não baixam.
 */
export const SpriteNearCtx = createContext(true);

/**
 * As animações do menu, com o tempo de cada quadro (ms) de reserva: o de verdade vem do AnimData, no JSON da folha
 * (o mesmo da partida). Folha velha no cache, sem as durações, usa este.
 */
const MS = { Walk: 110, Idle: 170, Hop: 80, Pose: 120 } as const;
export type FieldAnim = keyof typeof MS;
/** Tocam uma vez (do `start`) e voltam pro Idle: o Hop em loop deixava o Pokémon quicando acima da sombra. */
const ONCE = new Set<FieldAnim>(['Hop']);

/** Duração de cada quadro (ms): a do AnimData (1/60 s) se bate com os quadros, senão a de reserva. */
export function frameMs(atlas: Pick<Atlas, 'anims'> | undefined, anim: FieldAnim, n: number): number[] {
    const d = atlas?.anims?.[anim]?.durations;
    return d?.length === n ? d.map((x) => (x * 1000) / 60) : Array<number>(n).fill(MS[anim]);
}

/** Os quadros de uma animação numa direção. */
function framesOf(atlas: Atlas | undefined, anim: FieldAnim, dir: number): Frame[] {
    const out: Frame[] = [];
    for (let i = 0; atlas?.frames[`${anim}/${dir}/${i}`]; i++) out.push(atlas.frames[`${anim}/${dir}/${i}`].frame);
    return out;
}

/** O quadro da animação `t` ms depois do começo: em loop repete; sem loop, -1 depois do último. */
export function frameAt(ms: number[], t: number, loop: boolean): number {
    const total = ms.reduce((a, b) => a + b, 0);
    if (!total || t < 0) return 0;
    if (!loop && t >= total) return -1;
    let r = t % total;
    for (let i = 0; i < ms.length; i++) {
        if (r < ms[i]) return i;
        r -= ms[i];
    }
    return ms.length - 1;
}

/**
 * Sprite PMD da quadra num menu (sem Phaser): anda, respira, pula ou faz pose numa das 8 direções (0 = de frente,
 * 2 = direita, 4 = de costas, 6 = esquerda). O pé fica no ponto (left/top do pai, pela altura do pé de cada espécie
 * em sprite-feet.json, a mesma da quadra) e o quadro cresce pra cima. Os quadros andam no relógio da cena
 * (`ClockCtx`), no tempo do AnimData (o mesmo da partida): aba escondida, página escondida ou reduzir movimento param
 * tudo junto. `play` falso fica no 1º quadro; o pulo (Hop) toca uma vez a partir de `start` (hora do relógio) e volta
 * pro Idle. Espécie sem a animação (Pose falta em muitas)
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
    // o quadro da vez: i da animação pedida, ou 1000 + i do Idle (depois de um Hop que já tocou)
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
    const frames = framesOf(atlas, use, dir);
    const n = frames.length;
    const once = ONCE.has(use);
    // fase própria por espécie: os quadros de todo mundo não viram no mesmo instante
    const phase = start || id * 37;
    useEffect(() => {
        if (!clock || !play || (n < 2 && !once)) return;
        const ms = frameMs(atlas, use, n);
        const idleMs = frameMs(atlas, 'Idle', framesOf(atlas, 'Idle', dir).length);
        const tick = (t: number) => {
            const i = frameAt(ms, t - phase, !once);
            const nk = i >= 0 ? i : 1000 + frameAt(idleMs, t - phase, true);
            if (nk === kRef.current) return;
            kRef.current = nk;
            setK(nk);
        };
        tick(clock.t);
        return clock.sub(tick);
    }, [clock, play, n, use, phase, once, atlas, dir]);
    // o zoom do CSS por cima (palco do PC, tela grande): o sprite desfaz e desenha em pixel inteiro (realScale)
    const ref = useRef<HTMLSpanElement>(null);
    const [z, setZ] = useState(1);
    const shown = !!atlas && n > 0;
    useLayoutEffect(() => {
        const el = ref.current?.parentElement as (HTMLElement & { currentCSSZoom?: number }) | null | undefined;
        if (!shown || !el) return;
        const read = () => setZ(el.currentCSSZoom ?? 1);
        read();
        window.addEventListener('resize', read);
        return () => window.removeEventListener('resize', read);
    }, [shown]);
    const r = realScale(scale, z, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
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
    const after = play && k >= 1000 ? framesOf(atlas, 'Idle', dir) : null;
    const f = after ? after[(k - 1000) % after.length] : frames[play ? k % n : 0];
    const feet = (FEET as Record<string, Partial<Record<string, number>>>)[id];
    const foot = feet?.[after ? 'Idle' : use] ?? 0.7;
    return (
        <span
            ref={ref}
            className={`fs-sprite ${className}`}
            style={{
                ...style,
                transform: `translate(-50%, ${-foot * 100}%)`,
                zoom: r.zoom === 1 ? undefined : r.zoom,
                width: f.w * r.css,
                height: f.h * r.css,
                backgroundImage: `url(${sheet.url})`,
                backgroundPosition: `${-f.x * r.css}px ${-f.y * r.css}px`,
                backgroundSize: `${atlas.meta.size.w * r.css}px ${atlas.meta.size.h * r.css}px`,
            }}
        >
            {children && (
                <span
                    className="fs-head"
                    style={{ top: `${(feet?.top ?? 0.2) * 100}%`, zoom: r.zoom === 1 ? undefined : z }}
                >
                    {children}
                </span>
            )}
        </span>
    );
}
