import { type CSSProperties, useEffect, useState } from 'react';
import { reduceMotionOn } from '../settings-sync';

interface ExtraAtlas {
    frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
    meta: { size: { w: number; h: number } };
    anims: Record<string, { durations: number[] }>;
    shiny?: boolean;
}

const atlases = new Map<number, Promise<ExtraAtlas | null>>();
/** Atlas de fora da quadra (scripts/build-pmd-atlas.ts --extra): baixa uma vez por espécie, só quando aparece. */
const loadAtlas = (id: number) => {
    let a = atlases.get(id);
    if (!a) {
        a = fetch(`assets/field/extra/${id}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<ExtraAtlas>) : null))
            .catch(() => null);
        atlases.set(id, a);
    }
    return a;
};

/**
 * Sprite PMD animado numa tela de menu (fora do Phaser): dormir, sentar, comer, desmaiar. Troca o quadro no tempo do
 * AnimData; com "reduzir movimento", fica no 1º quadro. Sem a animação na espécie, mostra `fallback`.
 */
export function PmdSprite({
    id,
    shiny = false,
    anim,
    scale = 2,
    className = '',
    fallback = null,
}: {
    id: number;
    shiny?: boolean;
    anim: 'Sleep' | 'Sit' | 'Eat' | 'Faint';
    scale?: number;
    className?: string;
    fallback?: React.ReactNode;
}) {
    const [atlas, setAtlas] = useState<ExtraAtlas | null | undefined>(undefined);
    const [i, setI] = useState(0);
    useEffect(() => {
        let on = true;
        void loadAtlas(id).then((a) => on && setAtlas(a));
        return () => {
            on = false;
        };
    }, [id]);
    const durations = atlas?.anims[anim]?.durations;
    useEffect(() => {
        if (!durations || durations.length < 2 || reduceMotionOn()) return;
        let k = 0;
        let timer = 0;
        const step = () => {
            timer = window.setTimeout(
                () => {
                    k = (k + 1) % durations.length;
                    setI(k);
                    step();
                },
                (durations[k] * 1000) / 60,
            );
        };
        step();
        return () => clearTimeout(timer);
    }, [durations]);
    if (atlas === undefined) return null;
    const f = atlas?.frames[`${anim}/0/${i % (durations?.length ?? 1)}`]?.frame;
    if (!atlas || !f) return <>{fallback}</>;
    const style: CSSProperties = {
        width: f.w * scale,
        height: f.h * scale,
        backgroundImage: `url(assets/field/extra/${shiny && atlas.shiny ? 'shiny/' : ''}${id}.png)`,
        backgroundSize: `${atlas.meta.size.w * scale}px auto`,
        backgroundPosition: `${-f.x * scale}px ${-f.y * scale}px`,
    };
    return <span className={`pmd-sprite ${className}`} style={style} aria-hidden />;
}
