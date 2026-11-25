import type { CSSProperties } from 'react';
import ANCORAS from '../../data/gorro-ancoras.json';
import QUADROS from '../../data/gorro-quadros.json';
import { natalOn } from '../tema';
import { type Ancora, gorroPos, gorroRects } from './gorro-pixel';
import './natal.css';

/**
 * Gorro de Natal (docs/planos/natal.md) em pixel art, na cabeça do sprite do menu, só com o tema de Natal e só onde a
 * tela pede (`hat` no `FieldSprite`: capitão da Home, Arena, pódio). Nunca no campo da partida. Cada pixel do gorro
 * é um pixel do sprite (a mesma escala inteira, `css`). A âncora é por espécie e por direção
 * (`src/data/gorro-ancoras.json`, revisada na galeria `?lab=gorro`) e o gorro acompanha a cabeça quadro a quadro
 * (`src/data/gorro-quadros.json`, de `scripts/build-gorro-quadros.ts`). Sem âncora revisada, sem gorro: Butterfree,
 * Magikarp, Tauros e Pinsir (cabeça escondida atrás de asa, chifre ou corcova) ficam sem.
 */
export const ancoraOf = (id: number): Ancora | undefined => (ANCORAS as Record<string, Ancora>)[id];

type Quadros = Record<string, Partial<Record<string, number[][]>>>;

/** Existe gorro pra esta espécie agora? (tema de Natal ligado, ou `force` na galeria; e âncora revisada) */
export const hasGorro = (id: number, force = false) => (natalOn || force) && !!ancoraOf(id);

/** Onde vai o gorro no quadro `i` da animação (px do quadro), ou null se a animação não tem a cabeça seguida. */
export function gorroAt(id: number, d: number, anim: string, i: number) {
    // a Pose do PMD só tem frente e costas: as outras direções repetem a de frente (o gorro também)
    const dir = anim === 'Pose' && d !== 4 ? 0 : d;
    const a = ancoraOf(id);
    const o = (QUADROS as Quadros)[id]?.[anim]?.[dir];
    if (!a || !o) return null;
    const g = gorroPos(a, dir);
    const k = (i % (o.length / 2)) * 2;
    return { ...g, x: g.x + o[k], y: g.y + o[k + 1] };
}

/** O gorro: copa vermelha inclinada, aba e pompom brancos, contorno escuro de 1 px, como os sprites. */
export function Gorro({ id, dir, anim, i, css }: { id: number; dir: number; anim: string; i: number; css: number }) {
    const p = gorroAt(id, dir, anim, i);
    if (!p) return null;
    const { w, h, rects } = gorroRects(p.tipo, p.flip);
    const style = {
        left: p.x * css,
        top: p.y * css,
        width: w * css,
        height: h * css,
    } as CSSProperties;
    return (
        <svg className="fs-gorro" style={style} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden>
            {rects.map((r) => (
                <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
            ))}
        </svg>
    );
}
