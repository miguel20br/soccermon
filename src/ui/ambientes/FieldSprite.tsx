import { type CSSProperties, useEffect, useState } from 'react';
import FEET from '../../data/sprite-feet.json';

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
const MS = { Walk: 110, Idle: 170 } as const;
export type FieldAnim = keyof typeof MS;

/**
 * Sprite PMD da quadra num menu (sem Phaser): anda ou respira numa das 8 direções (0 = de frente, 2 = direita,
 * 4 = de costas, 6 = esquerda). O pé fica no ponto (left/top do pai, pela altura do pé de cada espécie em
 * sprite-feet.json, a mesma da quadra) e o quadro cresce pra cima. `play` falso (aba
 * escondida, reduzir movimento) para no 1º quadro. Sem folha, mostra o GIF da carta.
 */
export function FieldSprite({
    id,
    anim,
    dir,
    scale = 2,
    play = true,
    className = '',
    style,
}: {
    id: number;
    anim: FieldAnim;
    dir: number;
    scale?: number;
    play?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    const [atlas, setAtlas] = useState<Atlas | null | undefined>(undefined);
    const [k, setK] = useState(0);
    useEffect(() => {
        let on = true;
        void load(id).then((a) => on && setAtlas(a));
        return () => {
            on = false;
        };
    }, [id]);
    const frames: Frame[] = [];
    for (let i = 0; atlas?.frames[`${anim}/${dir}/${i}`]; i++) frames.push(atlas.frames[`${anim}/${dir}/${i}`].frame);
    const n = frames.length;
    useEffect(() => {
        if (!play || n < 2) return;
        const t = window.setInterval(() => setK((x) => x + 1), MS[anim]);
        return () => window.clearInterval(t);
    }, [play, n, anim]);
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
    const foot = (FEET as Record<string, Partial<Record<string, number>>>)[id]?.[anim] ?? 0.7;
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
        />
    );
}
