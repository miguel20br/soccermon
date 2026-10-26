import { type CSSProperties, useEffect, useRef } from 'react';
import { reduceMotionOn } from '../settings-sync';

/**
 * Transição de momento (ideia do Miguel, 26/10; protótipo no ?lab=kit): uma linha amarela desce na diagonal do canto
 * de cima à direita até o de baixo à esquerda e revela um papel de parede com o logo no meio; depois o papel sai da
 * direita pra esquerda. Só pra momento (começar a copa, entrar em quadra, título), nunca em troca de tela comum
 * (ADR 0004: 200–300 ms). `onCovered` = a tela está toda coberta (a hora de trocar o que tem embaixo).
 */
/**
 * Os papéis de parede: um desenho por momento (ou sorteado), espalhado em xadrez com bastante respiro. Cada um tem a
 * sua cor de fundo; o desenho é pixel (grade 24), em 3 tons do mesmo fundo.
 */
export const WIPE_ART = {
    pokebola: {
        bg: '#24398a',
        art: "<circle cx='12' cy='12' r='10' fill='#172a6e'/><path d='M3 12a9 9 0 0 1 18 0z' fill='#5f7fe0'/><path d='M3 12a9 9 0 0 0 18 0z' fill='#c3d1ff'/><rect x='2' y='11' width='20' height='2' fill='#172a6e'/><circle cx='12' cy='12' r='3.4' fill='#172a6e'/><circle cx='12' cy='12' r='1.8' fill='#c3d1ff'/>",
    },
    bola: {
        bg: '#1d5a3a',
        art: "<circle cx='12' cy='12' r='10' fill='#0e3322'/><circle cx='12' cy='12' r='8.6' fill='#d4f5e0'/><path d='M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4z' fill='#0e3322'/><path d='M12 3.4v4.8M15.4 10.7l4.5-1.4M14.1 14.7l2.8 3.9M9.9 14.7l-2.8 3.9M8.6 10.7L4.1 9.3' stroke='#0e3322' stroke-width='1.2'/>",
    },
    trofeu: {
        bg: '#5a3a0e',
        art: "<path d='M7 3h10v6a5 5 0 0 1-10 0z' fill='#ffd75e'/><path d='M7 5H4v1a4 4 0 0 0 3.5 4M17 5h3v1a4 4 0 0 1-3.5 4' fill='none' stroke='#ffd75e' stroke-width='1.6'/><rect x='10.8' y='13' width='2.4' height='4' fill='#e0a520'/><rect x='7' y='17' width='10' height='3' fill='#ffd75e'/><rect x='9' y='5' width='2' height='4' fill='#fff3b8'/>",
    },
    raio: {
        bg: '#3b2a7a',
        art: "<path d='M14 2L5 13.5h6L9.5 22 19 9.5h-6z' fill='#ffe066' stroke='#241656' stroke-width='1.2' stroke-linejoin='round'/>",
    },
    estrela: {
        bg: '#1f4a7a',
        art: "<path d='M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z' fill='#bfe3ff' stroke='#123156' stroke-width='1.2' stroke-linejoin='round'/>",
    },
} as const;
export type WipeArt = keyof typeof WIPE_ART;
const ARTS = Object.keys(WIPE_ART) as WipeArt[];

/** Um desenho sorteado (sem repetir o último, pra cada momento parecer novo). */
let lastArt: WipeArt | null = null;
export function randomArt(): WipeArt {
    const pool = ARTS.filter((a) => a !== lastArt);
    lastArt = pool[Math.floor(Math.random() * pool.length)];
    return lastArt;
}

/** O ladrilho: 96x96 com o desenho de ~30 px no meio (e o mesmo ladrilho deslocado meio passo, em xadrez). */
const tile = (art: string) =>
    `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><g transform='translate(33 33) scale(1.25)'>${art}</g></svg>`,
    )}")`;

const IN_MS = 420;
const HOLD_MS = 320;
const OUT_MS = 340;

/** Região à direita da linha diagonal x − y = c (em %), com folga pra cobrir os cantos. */
const diag = (c: number) => `polygon(${c - 100}% -100%, ${c + 200}% 200%, 300% 200%, 300% -100%)`;
/** O que sobra à esquerda da borda que anda da direita pra esquerda. */
const left = (e: number) => `polygon(-1% -1%, ${e}% -1%, ${e}% 101%, -1% 101%)`;

export function MomentWipe({
    art = 'pokebola',
    onCovered,
    onDone,
}: {
    art?: WipeArt;
    onCovered?: () => void;
    onDone: () => void;
}) {
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
            <div
                ref={paper}
                className="k-wipe-paper"
                style={{ '--tile': tile(WIPE_ART[art].art), backgroundColor: WIPE_ART[art].bg } as CSSProperties}
            >
                <img ref={mark} className="k-wipe-mark" src="assets/ui/logo.svg" alt="" width="1441" height="300" />
            </div>
        </div>
    );
}
