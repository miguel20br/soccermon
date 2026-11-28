import type { PokemonInstance } from '../../engine/instance';
import { moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { maxFxText, maxPlan } from '../max-levels';
import { TypeIcon } from './TypeIcon';

/** Escolha do capitão: o golpe máximo dele (tipo + nome) abaixo da carta; o título traz o N3. A Copa e o Duelo usam. */
export function CaptainMax({ inst }: { inst: PokemonInstance }) {
    const { d, lang } = useT();
    const plan = maxPlan(inst.moves, inst.speciesId, false);
    if (!plan.move) return null;
    const fx = maxFxText(plan.fx, lang);
    return (
        <div className="option-max" title={`${d.match.agency.levels.title}: ${fx.name}. ${fx.desc}`}>
            <TypeIcon type={plan.type} />
            <span>
                <small>{d.match.agency.levels.title}</small>
                <b>{moveName(plan.move)}</b>
            </span>
        </div>
    );
}
