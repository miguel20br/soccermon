import { createContext, useEffect, useState } from 'react';
import { reduceMotionOn } from '../reduce-motion';

export type Tick = (t: number, dt: number) => void;
/**
 * O relógio de uma cena: um `requestAnimationFrame` só pra tudo que anda em JS naquele ambiente (quadros dos sprites,
 * Pokémon ambiente, caminhada do time). `t` é o tempo de cena (só corre ligado), então voltar pra aba não dá salto.
 */
export interface SceneClock {
    readonly t: number;
    readonly running: boolean;
    sub(fn: Tick): () => void;
    run(on: boolean): void;
}

/** Maior passo de um quadro (ms): aba congelada ou celular engasgado não teleporta ninguém. */
export const MAX_DT = 100;

export function createClock(
    raf: (cb: (now: number) => void) => number = (cb) => requestAnimationFrame(cb),
    caf: (id: number) => void = (id) => cancelAnimationFrame(id),
): SceneClock {
    const subs = new Set<Tick>();
    let t = 0;
    let id = 0;
    let last = -1;
    let on = false;
    const frame = (now: number) => {
        id = 0;
        const dt = last < 0 ? 0 : Math.min(MAX_DT, Math.max(0, now - last));
        last = now;
        t += dt;
        for (const f of subs) f(t, dt);
        if (on) id = raf(frame);
    };
    return {
        get t() {
            return t;
        },
        get running() {
            return on;
        },
        sub(fn) {
            subs.add(fn);
            return () => {
                subs.delete(fn);
            };
        },
        run(v) {
            if (v === on) return;
            on = v;
            if (on) {
                last = -1;
                id = raf(frame);
            } else if (id) {
                caf(id);
                id = 0;
            }
        },
    };
}

/** Corre só com a aba na tela, a página visível e sem "reduzir movimento". */
export const clockOn = (active: boolean, hidden: boolean, reduce: boolean) => active && !hidden && !reduce;

/** O relógio da cena, ligado e desligado pela aba e pela visibilidade da página. */
export function useSceneClock(active: boolean): SceneClock {
    const [clock] = useState(() => createClock());
    useEffect(() => {
        const sync = () => clock.run(clockOn(active, document.hidden, reduceMotionOn()));
        sync();
        document.addEventListener('visibilitychange', sync);
        return () => {
            document.removeEventListener('visibilitychange', sync);
            clock.run(false);
        };
    }, [clock, active]);
    return clock;
}

export const ClockCtx = createContext<SceneClock | null>(null);
