import type { CSSProperties } from 'react';
import type { Stone } from '../../engine/evolution';
import { TYPE_COLOR } from '../type-colors';
import { HudIcon } from './MatchHud';

/** Cor de cada pedra: a do tipo de quem ela evolui (a da Lua, a de Fada do Clefairy). */
export const STONE_COLOR: Record<Stone, string> = {
    lua: TYPE_COLOR.Fairy,
    agua: TYPE_COLOR.Water,
    trovao: TYPE_COLOR.Electric,
    folha: TYPE_COLOR.Grass,
    fogo: TYPE_COLOR.Fire,
};
/** A gema da pedra, na cor dela. */
export const StoneMark = ({ stone, className = 'cm-stone' }: { stone: Stone; className?: string }) => (
    <span className={className} style={{ '--stone': STONE_COLOR[stone] } as CSSProperties}>
        <HudIcon kind="stone" />
    </span>
);
