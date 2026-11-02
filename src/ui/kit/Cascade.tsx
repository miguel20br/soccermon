import { Children, type ReactNode, useEffect, useMemo, useState } from 'react';
import { playSfx } from '../../game/audio';
import { reduceMotionOn } from '../settings-sync';
import { beatTimes } from './beats';
import './stage.css';

/** O som de cada batida: o tom sobe um tom inteiro por batida (a escada do Balatro); a última bate grave. */
const beatSound = (i: number, n: number) =>
    i === n - 1 && n > 2 ? playSfx('kick') : playSfx('select', 2 ** ((i * 2) / 12));

/**
 * Cascata (cara-de-jogo.md, peça 3): as coisas do pós-jogo chegam uma de cada vez, cada uma com som e pop, no tempo
 * dos `gaps` (ms entre uma batida e a outra; o total cabe em 3,5 s). `skip()` mostra tudo na hora (o toque pula pro
 * fim) e `skipped` avisa quem conta número pra também pular a contagem. Com Reduzir movimento, já nasce no fim.
 */
export function useCascade(gaps: readonly number[], { sound = true } = {}) {
    const key = gaps.join();
    // biome-ignore lint/correctness/useExhaustiveDependencies: os intervalos mudam pelo conteúdo, não pela referência
    const times = useMemo(() => beatTimes(gaps), [key]);
    const n = times.length;
    const [step, setStep] = useState(() => (reduceMotionOn() ? n : 0));
    const [skipped, setSkipped] = useState(false);
    useEffect(() => {
        if (step >= n) return;
        const id = window.setTimeout(
            () => {
                if (sound) beatSound(step, n);
                setStep(step + 1);
            },
            times[step] - (times[step - 1] ?? 0),
        );
        return () => clearTimeout(id);
    }, [step, n, times, sound]);
    return {
        step,
        done: step >= n,
        skipped,
        skip: () => {
            if (step >= n) return;
            setSkipped(true);
            setStep(n);
        },
    };
}

/** Uma batida da cascata: guarda o lugar (nada empurra nada quando ela entra) e entra com pop quando `on`. */
export function Beat({ on, children, className = '' }: { on: boolean; children: ReactNode; className?: string }) {
    return <div className={`k-beat${on ? ' on' : ''} ${className}`}>{children}</div>;
}

/** Cascata pronta: cada filho é uma batida; tocar em qualquer lugar dela pula pro fim. */
export function Cascade({
    gaps,
    children,
    className = '',
}: {
    gaps: readonly number[];
    children: ReactNode;
    className?: string;
}) {
    const items = Children.toArray(children);
    const { step, skip } = useCascade(gaps.slice(0, items.length));
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a festa; o conteúdo já está no DOM pro leitor de tela
        <div className={`k-cascade ${className}`} onClick={skip}>
            {items.map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: as batidas são fixas por posição
                <Beat key={i} on={i < step}>
                    {c}
                </Beat>
            ))}
        </div>
    );
}
