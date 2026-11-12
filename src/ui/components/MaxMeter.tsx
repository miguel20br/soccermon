import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { MaxCharge } from '../../engine/agency';
import { TYPE_COLOR } from '../type-colors';
import './max-meter.css';

const q = () => new URLSearchParams(window.location.search);

/** Passos da carga de `?carga=sobe` (12 = 4 por nível) e quanto cada um dura, em ms (relógio da página). */
const STEPS = 12;
const STEP_MS = 650;
const LEAD_MS = 1200;
/** Quando a subida começou (recomeça se a URL mudar: o gravador troca a URL depois de parar o relógio). */
let cargaT0: { search: string; at: number } | null = null;

/**
 * Carga de mentira do seu time, só na tela (o motor não muda), pra prévia: `?carga=0..3` para no nível com a barra a
 * meio caminho do próximo; `?carga=sobe` sobe de N0 a N3 em degraus (como os lances somam pontos) e para cheia.
 */
export function cargaLab(): MaxCharge | null {
    // o window antes: nos testes (node) o __SMOKE__ nem existe
    if (typeof window === 'undefined' || !__SMOKE__) return null;
    const v = q().get('carga');
    if (v === null) return null;
    if (v === 'sobe') {
        const now = performance.now();
        if (cargaT0?.search !== window.location.search) cargaT0 = { search: window.location.search, at: now };
        const step = Math.min(STEPS, Math.max(0, Math.floor((now - cargaT0.at - LEAD_MS) / STEP_MS) + 1));
        const charge = step / STEPS;
        return { charge, level: Math.floor(charge * 3 + 1e-9) };
    }
    const lv = Math.min(3, Math.max(0, Math.round(Number(v)) || 0));
    return { charge: lv === 3 ? 1 : (lv + 0.5) / 3, level: lv };
}

/** Sobe 1 a cada nível novo (não no primeiro quadro): a chave que refaz a animação do "subiu". */
function useLevelUp(level: number) {
    const prev = useRef(level);
    const [up, setUp] = useState(0);
    useEffect(() => {
        if (level > prev.current) setUp((u) => u + 1);
        prev.current = level;
    }, [level]);
    return up;
}

/**
 * A barrinha "Gomos": três blocos, cada um na cor do nível (amarelo, laranja, tipo do capitão); conta-se o nível pelos
 * acesos. `size`: `thumb` (barra de baixo do celular), `btn` (botão do desktop) ou `mini` (embaixo do placar).
 */
export function MaxMeter({
    max,
    type,
    size,
    flip,
}: {
    max: MaxCharge;
    /** O tipo do capitão (a cor do N3; sem ele, vermelho). */
    type?: string;
    size: 'thumb' | 'btn' | 'mini';
    /** O time de lá no placar: a barra enche da direita pra esquerda. */
    flip?: boolean;
}) {
    const up = useLevelUp(max.level);
    const lv = max.level;
    const style = { '--mm3': type ? TYPE_COLOR[type] : undefined } as CSSProperties;
    return (
        <span className={`mm mm-a mm-${size}${flip ? ' flip' : ''}`} data-lv={lv} style={style} aria-hidden>
            {[1, 2, 3].map((n) => {
                const f = Math.min(1, Math.max(0, max.charge * 3 - (n - 1)));
                const pop = n === lv && up > 0;
                return (
                    <i
                        key={pop ? `${n}-${up}` : n}
                        className={`mm-cell c${n}${lv >= n ? ' on' : ''}${pop ? ' pop' : ''}`}
                        style={{ '--f': f } as CSSProperties}
                    />
                );
            })}
        </span>
    );
}
