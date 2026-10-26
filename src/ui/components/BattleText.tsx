import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { CommentLine } from '../commentary';
import { hex } from './MatchHud';

/** Quanto cada frase fica na caixa no mínimo (tempo real): no 8x elas chegam muito mais rápido que isso. */
export const MIN_SHOW_MS = 1000;
/** Fila curta: o que passa disso já é passado (fica na aba Lances). */
const QUEUE_MAX = 2;

/** No 4x e no 8x só entra o que importa (gol, golpe forte, apito); no 1x e no 2x, tudo menos o miúdo. */
export function battleWorthy(tone: CommentLine['tone'], speed: number | string): boolean {
    if (tone === 'minor') return false;
    const fast = typeof speed !== 'number' || speed >= 4;
    return !fast || tone === 'goal' || tone === 'big' || tone === 'whistle';
}

/**
 * A caixa de texto da batalha (partida nova, ?lab=hud; o conceito C de 18/10): a narração no papel do FireRed, uma
 * frase por vez, cada uma pelo menos `MIN_SHOW_MS`. Em velocidade alta a fila só pega o que importa, então a caixa
 * nunca pisca de frase em frase.
 */
export function BattleText({
    lines,
    colors,
    speed,
}: {
    lines: (CommentLine & { id: number })[];
    colors: [number, number];
    speed: number | string;
}) {
    const [shown, setShown] = useState<(CommentLine & { id: number }) | null>(null);
    const queue = useRef<(CommentLine & { id: number })[]>([]);
    const seen = useRef(-1);
    const since = useRef(0);
    const speedRef = useRef(speed);
    speedRef.current = speed;

    // frases novas (a lista vem da mais nova pra mais velha) entram na fila
    const top = lines[0]?.id ?? -1;
    // biome-ignore lint/correctness/useExhaustiveDependencies: só quando chega frase nova (a lista muda de identidade a cada tick)
    useEffect(() => {
        const fresh = lines.filter((l) => l.id > seen.current).reverse();
        if (fresh.length) seen.current = fresh[fresh.length - 1].id;
        for (const l of fresh) if (battleWorthy(l.tone, speedRef.current)) queue.current.push(l);
        // gol nunca sai da fila; do resto, só as mais novas
        while (queue.current.length > QUEUE_MAX) {
            const i = queue.current.findIndex((l) => l.tone !== 'goal');
            queue.current.splice(i < 0 ? 0 : i, 1);
        }
    }, [top]);

    // troca a frase quando a de agora já ficou o mínimo
    useEffect(() => {
        const id = window.setInterval(() => {
            if (!queue.current.length || performance.now() - since.current < MIN_SHOW_MS) return;
            since.current = performance.now();
            setShown(queue.current.shift() ?? null);
        }, 100);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="bt-box" aria-hidden>
            {shown && (
                <p
                    key={shown.id}
                    className={`bt-line ${shown.tone}`}
                    style={
                        { '--team-color': shown.team !== null ? hex(colors[shown.team]) : undefined } as CSSProperties
                    }
                >
                    <span className="bt-min">{Math.floor(shown.minute)}'</span> {shown.text}
                </p>
            )}
            <i className="bt-next" />
        </div>
    );
}
