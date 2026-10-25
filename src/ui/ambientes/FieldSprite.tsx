import { type CSSProperties, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
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

/** Tempo de cada quadro (ms): o AnimData fica fora do pedaço; o ritmo fixo basta no menu. */
const MS = { Walk: 110, Idle: 170, Hop: 80, Pose: 120 } as const;
export type FieldAnim = keyof typeof MS;

/**
 * Sprite PMD da quadra num menu (sem Phaser): anda, respira, pula ou faz pose numa das 8 direções (0 = de frente,
 * 2 = direita, 4 = de costas, 6 = esquerda). O pé fica no ponto (left/top do pai, pela altura do pé de cada espécie
 * em sprite-feet.json, a mesma da quadra) e o quadro cresce pra cima. Os quadros andam no relógio da cena
 * (`ClockCtx`): aba escondida, página escondida ou reduzir movimento param tudo junto. `play` falso fica no 1º
 * quadro; `start` (hora do relógio) faz o pulo começar do 1º quadro. Espécie sem a animação (Pose falta em muitas)
 * usa a de respirar. `children` fica no topo da cabeça (balão de emote, Zzz). Sem folha, mostra o GIF da carta.
 */
export function FieldSprite({
    id,
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
    const [atlas, setAtlas] = useState<Atlas | null | undefined>(undefined);
    const [k, setK] = useState(0);
    const kRef = useRef(0);
    useEffect(() => {
        let on = true;
        void load(id).then((a) => on && setAtlas(a));
        return () => {
            on = false;
        };
    }, [id]);
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
    if (atlas === null)
        return (
            <img
                className={`fs-sprite fs-gif pixel ${className}`}
                style={style}
                src={`assets/cards/${id}.gif`}
                alt=""
            />
        );
    if (!atlas || !n) return null;
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
                backgroundImage: `url(assets/field/${id}.png)`,
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
