import { useEffect, useRef } from 'react';
import { reduceMotionOn } from '../settings-sync';

/**
 * Transição de momento (ideia do Miguel, 26/10; protótipo no ?lab=kit): uma linha amarela desce na diagonal do canto
 * de cima à direita até o de baixo à esquerda e revela um papel de parede com o logo no meio; depois o papel sai da
 * direita pra esquerda. Só pra momento (começar a copa, entrar em quadra, título), nunca em troca de tela comum
 * (ADR 0004: 200–300 ms). `onCovered` = a tela está toda coberta (a hora de trocar o que tem embaixo).
 */
export type WipeArt = 'pokebolas' | 'simbolo';

const IN_MS = 420;
const HOLD_MS = 320;
const OUT_MS = 340;

/** Região à direita da linha diagonal x − y = c (em %), com folga pra cobrir os cantos. */
const diag = (c: number) => `polygon(${c - 100}% -100%, ${c + 200}% 200%, 300% 200%, 300% -100%)`;
/** O que sobra à esquerda da borda que anda da direita pra esquerda. */
const left = (e: number) => `polygon(-1% -1%, ${e}% -1%, ${e}% 101%, -1% 101%)`;

export function MomentWipe({ art, onCovered, onDone }: { art: WipeArt; onCovered?: () => void; onDone: () => void }) {
    const line = useRef<HTMLDivElement>(null);
    const paper = useRef<HTMLDivElement>(null);
    const mark = useRef<HTMLImageElement>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda uma vez por montagem (cada momento monta de novo)
    useEffect(() => {
        const l = line.current;
        const p = paper.current;
        const m = mark.current;
        if (!l || !p || !m) return;
        if (reduceMotionOn()) {
            // sem movimento: o papel aparece e some com fade, o logo parado
            const a = p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
            let gone = false;
            a.onfinish = () => {
                onCovered?.();
                const b = p.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: 200,
                    delay: HOLD_MS,
                    fill: 'forwards',
                });
                b.onfinish = () => !gone && onDone();
            };
            l.style.display = 'none';
            return () => {
                gone = true;
            };
        }
        const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
        // a linha amarela vai na frente (uns 10% adiantada), o papel vem atrás dela; a varredura inteira acontece na tela
        l.animate([{ clipPath: diag(102) }, { clipPath: diag(-110) }], {
            duration: IN_MS,
            easing: ease,
            fill: 'forwards',
        });
        const pin = p.animate([{ clipPath: diag(112) }, { clipPath: diag(-101) }], {
            duration: IN_MS,
            easing: ease,
            fill: 'forwards',
        });
        m.animate(
            [
                { transform: 'scale(0.6)', opacity: 0 },
                { transform: 'scale(1.06)', opacity: 1, offset: 0.7 },
                { transform: 'scale(1)', opacity: 1 },
            ],
            { duration: 320, delay: IN_MS - 80, easing: 'ease-out', fill: 'both' },
        );
        let gone = false;
        pin.onfinish = () => {
            if (gone) return;
            onCovered?.();
            // saída: a borda anda da direita pra esquerda, com a linha amarela colada nela
            const opt = { duration: OUT_MS, delay: HOLD_MS, easing: ease, fill: 'forwards' as const };
            l.animate([{ clipPath: left(104) }, { clipPath: left(-1) }], opt);
            const pout = p.animate([{ clipPath: left(100) }, { clipPath: left(-6) }], opt);
            pout.onfinish = () => !gone && onDone();
        };
        return () => {
            gone = true;
        };
    }, []);
    return (
        <div className="k-wipe" aria-hidden>
            <div ref={line} className="k-wipe-line" />
            <div ref={paper} className={`k-wipe-paper art-${art}`}>
                <img ref={mark} className="k-wipe-mark" src="assets/ui/logo.svg" alt="" width="1441" height="300" />
            </div>
        </div>
    );
}
