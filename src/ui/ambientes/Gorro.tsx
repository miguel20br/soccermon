import type { CSSProperties } from 'react';
import ANCORAS from '../../data/gorro-ancoras.json';
import { natalOn } from '../tema';
import './natal.css';

/**
 * Gorro de Natal (docs/planos/natal.md): SVG ancorado na cabeça do sprite do menu, só com o tema de Natal e só onde a
 * tela pede (`hat` no `FieldSprite`: capitão da Home, Arena, pódio). Nunca no campo da partida. A âncora é por espécie
 * (`src/data/gorro-ancoras.json`): `y` desce o gorro sobre a cabeça (fração da altura do quadro, a partir do topo da
 * cabeça de `sprite-feet.json`), `s` é a largura (fração da largura do quadro), `x` o desvio de frente ou de costas e
 * `xs` o desvio de lado, pra frente do Pokémon (lado direito: positivo; esquerdo espelha). Sem âncora, sem gorro:
 * Magikarp, Gastly e Onix só entram quando alguém conferir a cabeça deles.
 */
export interface Ancora {
    x?: number;
    xs?: number;
    y: number;
    s: number;
}
export const ancoraOf = (id: number): Ancora | undefined => (ANCORAS as Record<string, Ancora>)[id];

/** Existe gorro pra esta espécie agora? (tema de Natal ligado, ou `force` na galeria; e âncora revisada) */
export const hasGorro = (id: number, force = false) => (natalOn || force) && !!ancoraOf(id);

/** O gorro: copa vermelha caída pro lado, barra e pompom brancos, em pixel (o mesmo traço do resto da interface). */
export function Gorro({ id, dir, top }: { id: number; dir: number; top: number }) {
    const a = ancoraOf(id);
    if (!a) return null;
    const side = dir === 2 ? 1 : dir === 6 ? -1 : 0;
    const x = side ? (a.xs ?? a.x ?? 0) * side : (a.x ?? 0);
    const style = {
        left: `${(0.5 + x) * 100}%`,
        top: `${(top + a.y) * 100}%`,
        width: `${a.s * 100}%`,
        // de lado a ponta cai pra trás da cabeça
        transform: `translate(-50%, -88%) scaleX(${dir === 6 ? -1 : 1})${side ? ' rotate(-6deg)' : ''}`,
    } as CSSProperties;
    return (
        <svg className="fs-gorro" style={style} viewBox="0 0 24 22" shapeRendering="crispEdges" aria-hidden>
            <path d="M3 16 L5 8 L9 3 L15 1 L20 4 L21 8 L21 16 Z" fill="#d1252b" />
            <path d="M15 1 L20 4 L21 8 L21 16 L17 16 L17 6 Z" fill="#a31620" />
            <rect x="1" y="15" width="22" height="5" rx="1" fill="#f6f2e8" />
            <rect x="1" y="18" width="22" height="2" fill="#d9d2c0" />
            <circle cx="20" cy="3" r="3" fill="#fff" />
        </svg>
    );
}
