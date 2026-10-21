import { type CSSProperties, useEffect, useState } from 'react';
import { reduceMotionOn } from '../settings-sync';

interface ExtraAtlas {
    frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
    meta: { size: { w: number; h: number } };
    anims: Record<string, { durations: number[]; foot?: number }>;
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

type Anim = 'Sleep' | 'Sit' | 'Eat' | 'Faint';
/** Não repetem: tocam uma vez e param no último quadro (o desmaio termina no chão). */
const ONCE = new Set<Anim>(['Faint']);

/**
 * Sprite PMD animado numa tela de menu (fora do Phaser): dormir, sentar, comer, desmaiar. Troca o quadro no tempo do
 * AnimData; com "reduzir movimento", fica parado (no último quadro do desmaio). `anim` pode ser uma lista: a 1ª que a
 * espécie tiver. Sem nenhuma, mostra `fallback`.
 */
export function PmdSprite({
    id,
    shiny = false,
    anim,
    scale = 2,
    className = '',
    fallback = null,
    fit,
}: {
    id: number;
    shiny?: boolean;
    anim: Anim | Anim[];
    scale?: number;
    className?: string;
    fallback?: React.ReactNode;
    /**
     * Altura que ocupa na fileira (px): a maior escala inteira (até `scale`) que cabe; quadro maior que isso (o
     * Gyarados deitado tem 112 px) sobra pra cima, por cima do que está acima (o quadro do PMD é quase todo vazio).
     */
    fit?: number;
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
    const name = [anim].flat().find((a) => atlas?.anims[a]);
    const durations = name ? atlas?.anims[name]?.durations : undefined;
    const once = !!name && ONCE.has(name);
    useEffect(() => {
        if (!durations) return;
        if (reduceMotionOn()) {
            setI(once ? durations.length - 1 : 0);
            return;
        }
        if (durations.length < 2) return;
        let k = 0;
        let timer = 0;
        const step = () => {
            timer = window.setTimeout(
                () => {
                    k = (k + 1) % durations.length;
                    setI(k);
                    if (!once || k < durations.length - 1) step();
                },
                (durations[k] * 1000) / 60,
            );
        };
        step();
        return () => clearTimeout(timer);
    }, [durations, once]);
    if (atlas === undefined) return null;
    const f = name ? atlas?.frames[`${name}/0/${i % (durations?.length ?? 1)}`]?.frame : undefined;
    if (!atlas || !f) return <>{fallback}</>;
    // o pé (fração da altura do quadro, do script) fica na linha de baixo: o vazio embaixo do corpo não conta
    const foot = (name && atlas.anims[name]?.foot) || 1;
    const k = fit ? Math.max(1, Math.min(scale, Math.floor(fit / (f.h * foot)))) : scale;
    const body = f.h * foot * k;
    const style: CSSProperties = {
        width: f.w * k,
        height: f.h * k,
        marginTop: fit && body > fit ? fit - body : undefined,
        marginBottom: body - f.h * k,
        backgroundImage: `url(assets/field/extra/${shiny && atlas.shiny ? 'shiny/' : ''}${id}.png)`,
        backgroundSize: `${atlas.meta.size.w * k}px auto`,
        backgroundPosition: `${-f.x * k}px ${-f.y * k}px`,
    };
    return <span className={`pmd-sprite ${className}`} style={style} aria-hidden />;
}
