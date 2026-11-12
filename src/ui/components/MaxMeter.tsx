import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { MaxCharge } from '../../engine/agency';
import { TYPE_COLOR } from '../type-colors';
import './max-meter.css';

/**
 * Prévia da barrinha nova do golpe máximo (Miguel, 12/11: "a barrinha de N tá muito feia"). Três caras, atrás de
 * `?barra=a|b|c` só no dev e nas prévias (`__SMOKE__`); sem o parâmetro, a de hoje. Ele escolhe e a escolhida vira padrão.
 *   a "Gomos": três blocos, cada um na cor do nível (amarelo, laranja, tipo); conta-se o nível pelos acesos.
 *   b "Selo": o número do nível grande num selo; a borda enche em degraus até o próximo.
 *   c "Estoque": uma barra só que reenche a cada nível por cima da cor do anterior (barra de super de luta) e o N ao lado.
 */
export type Barra = 'a' | 'b' | 'c';

const q = () => new URLSearchParams(window.location.search);

export function barraLab(): Barra | null {
    // o window antes: nos testes (node) o __SMOKE__ nem existe
    if (typeof window === 'undefined' || !__SMOKE__) return null;
    const v = q().get('barra');
    return v === 'a' || v === 'b' || v === 'c' ? v : null;
}

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
 * A barrinha (as três caras). `size`: `thumb` (botão da barra de baixo do celular), `btn` (botão do desktop) ou `mini`
 * (embaixo do placar, os dois times). `type`: o tipo do capitão (a cor do N3; sem ele, vermelho).
 */
export function MaxMeter({
    variant,
    max,
    type,
    size,
    flip,
}: {
    variant: Barra;
    max: MaxCharge;
    type?: string;
    size: 'thumb' | 'btn' | 'mini';
    /** O time de lá no placar: a barra enche da direita pra esquerda. */
    flip?: boolean;
}) {
    const up = useLevelUp(max.level);
    const lv = max.level;
    // o quanto do nível de agora já encheu (0 a 1), em degraus de 1/8 no selo (pixel, sem curva lisa)
    const inLevel = lv >= 3 ? 1 : max.charge * 3 - lv;
    const style = {
        '--mm3': type ? TYPE_COLOR[type] : undefined,
        '--p': variant === 'b' ? Math.floor(inLevel * 8) / 8 : inLevel,
    } as CSSProperties;
    const cls = `mm mm-${variant} mm-${size}${flip ? ' flip' : ''}`;
    if (variant === 'a')
        return (
            <span className={cls} data-lv={lv} style={style} aria-hidden>
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
    if (variant === 'b')
        return (
            <span className={cls} data-lv={lv} style={style} aria-hidden>
                <span className="mm-seal">
                    {/* span, não b/small: o botão do técnico tem regra pra b e small (bloco, 12 px) */}
                    <span key={up} className={`mm-num${up ? ' pop' : ''}`}>
                        <span className="mm-n">N</span>
                        {lv}
                    </span>
                </span>
                {up > 0 && <i key={`r${up}`} className="mm-burst" />}
            </span>
        );
    return (
        <span className={cls} data-lv={lv} style={style} aria-hidden>
            <span className="mm-bar">
                <i className="mm-fill" />
                {up > 0 && <i key={up} className="mm-flash" />}
            </span>
            <span key={up} className={`mm-stock${up ? ' pop' : ''}`}>
                N{lv}
            </span>
        </span>
    );
}
