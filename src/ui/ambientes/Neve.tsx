import type { CSSProperties } from 'react';
import './natal.css';

/**
 * Neve do Natal (ui/tema.ts, `natalOn`): flocos de pixel caindo por cima do cenário, só CSS (`transform`), sem toque.
 * 36 flocos, 24 no celular; com "Reduzir movimento" (ou `prefers-reduced-motion`) não aparece. Posições fixas (sem
 * sorteio): a mesma neve em todo print. O atraso negativo espalha os flocos já na entrada, que é um fade de 300 ms.
 */
const FLAKES = Array.from({ length: 36 }, (_, i) => {
    const r = (k: number) => (((i + 1) * 7919 * k) % 997) / 997;
    const x = `${((i * 61.8 + 7) % 100).toFixed(1)}%`;
    const style = {
        '--x': x,
        '--d': `${(9 + r(3) * 8).toFixed(1)}s`,
        '--t': `${(-r(5) * 17).toFixed(1)}s`,
        '--dx': `${Math.round((r(11) - 0.5) * 60)}px`,
    } as CSSProperties;
    return { x, style };
});

export function Neve() {
    return (
        <div className="neve" aria-hidden>
            {FLAKES.map(({ x, style }, i) => (
                // 1 de cada 3 é o floco grande (cruz de pixel)
                <i key={x} className={i % 3 ? undefined : 'g'} style={style} />
            ))}
        </div>
    );
}

/**
 * A capa de Natal das telas de fora dos ambientes (VERSUS, campeão, mapa da copa e da Rota, Time Ultimate, menu de
 * modos, Perfil): o festão com o pisca-pisca no alto e a neve, por cima de tudo e sem toque. Quem chama confere
 * `natalOn`.
 */
export function NatalCapa() {
    return (
        <div className="natal-capa" aria-hidden>
            <Neve />
            <div className="natal-festao" />
        </div>
    );
}
