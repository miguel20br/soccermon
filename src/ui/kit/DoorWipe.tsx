import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { PixelTrophy } from '../components/PixelTrophy';
import { reduceMotionOn } from '../settings-sync';

/**
 * A porta da Sala de troféus (pedido do Miguel, 30/10): da Sede, a porta dupla de madeira chega perto, a tela troca
 * atrás dela e as duas folhas abrem pra dentro; voltando, a mesma porta abre pra Sede. Como o `MomentWipe`, é um
 * momento (ADR 0008), não troca de tela comum. Só transform e opacity; com "reduzir movimento", um fade.
 */
const IN_MS = 220;
const HOLD_MS = 60;
const OPEN_MS = 460;

function DoorWipe({ onCovered, onDone }: { onCovered: () => void; onDone: () => void }) {
    const root = useRef<HTMLDivElement>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda uma vez por montagem (cada porta monta de novo)
    useEffect(() => {
        const r = root.current;
        const [l, rr] = [r?.querySelector('.k-door-l'), r?.querySelector('.k-door-r')];
        if (!r || !l || !rr) return;
        let gone = false;
        if (reduceMotionOn()) {
            const a = r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
            a.onfinish = () => {
                if (gone) return;
                onCovered();
                const b = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, delay: 80, fill: 'forwards' });
                b.onfinish = () => !gone && onDone();
            };
            return () => {
                gone = true;
            };
        }
        // chega: a porta vem de longe (a câmera anda até ela)
        const come = r.animate(
            [
                { opacity: 0, transform: 'scale(0.55)' },
                { opacity: 1, transform: 'scale(1)' },
            ],
            { duration: IN_MS, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' },
        );
        come.onfinish = () => {
            if (gone) return;
            onCovered();
            // a moldura escura só serve pra chegada: abrindo, atrás das folhas já está a tela nova
            r.style.background = 'transparent';
            r.querySelector('.k-door-plate')?.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: 120,
                delay: HOLD_MS,
                fill: 'forwards',
            });
            // abre: as folhas giram pra dentro (dobradiça nas pontas) e a luz da sala passa pela fresta
            const opt = {
                duration: OPEN_MS,
                delay: HOLD_MS,
                easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
                fill: 'forwards' as const,
            };
            l.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-100deg)', opacity: 0.4 }], opt);
            const open = rr.animate(
                [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(100deg)', opacity: 0.4 }],
                opt,
            );
            r.querySelector('.k-door-light')?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], {
                duration: OPEN_MS,
                delay: HOLD_MS,
            });
            open.onfinish = () => !gone && onDone();
        };
        return () => {
            gone = true;
        };
    }, []);
    return (
        <div ref={root} className="k-door" aria-hidden>
            <i className="k-door-light" />
            <div className="k-door-l">
                <span className="k-door-knob" />
            </div>
            <div className="k-door-r">
                <span className="k-door-knob" />
            </div>
            <span className="k-door-plate">
                <PixelTrophy kind="taca" metal="ouro" />
            </span>
        </div>
    );
}

const useDoor = create<{ cover: (() => void) | null; n: number }>(() => ({ cover: null, n: 0 }));

/** Passa pela porta: `then` troca a tela quando a porta cobre tudo. Uma porta já tocando: o 2º toque não conta. */
export function playDoor(then: () => void) {
    if (useDoor.getState().cover) return;
    useDoor.setState((s) => ({ cover: then, n: s.n + 1 }));
}

/** A camada da porta (montada uma vez no App). */
export function DoorLayer() {
    const { cover, n } = useDoor();
    if (!cover) return null;
    return <DoorWipe key={n} onCovered={cover} onDone={() => useDoor.setState({ cover: null })} />;
}
