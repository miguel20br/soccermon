import type { CSSProperties } from 'react';
import { SPECIES_BY_ID, type Species, species } from '../../engine/data';
import { STONES, stoneInto } from '../../engine/evolution';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { useT } from '../../i18n/react';
import type { Dex } from '../../store/profile';
import { speciesGif } from '../profile/club';
import { EvoArrow } from '../profile/icons';
import { METAL, metalOf } from '../rarity';
import './evo-chain.css';

/** A carta "do pacote" da espécie (1ª habilidade, golpes padrão, sem edição): a ficha que a Linha evolutiva abre. */
export function speciesCard(id: number): PokemonInstance {
    return {
        ...createInstance(id, new Rng(`ficha-${id}`)),
        uid: `ficha-${id}`,
        ability: species(id).abilities[0],
        shiny: false,
    };
}

/** Linha evolutiva por estágio (só espécies do jogo): [[Eevee], [Vaporeon, Jolteon, Flareon]]. */
export function evolutionStages(sp: Species): number[][] {
    let root = sp;
    while (root.prevo && SPECIES_BY_ID.has(root.prevo)) root = species(root.prevo);
    const stages: number[][] = [[root.id]];
    for (;;) {
        const next = stages[stages.length - 1].flatMap((id) =>
            species(id)
                .evolvesTo.map((e) => e.id)
                .filter((x) => SPECIES_BY_ID.has(x)),
        );
        if (!next.length) break;
        stages.push(next);
    }
    return stages;
}

const dexNo = (id: number) => String(id).padStart(3, '0');

/**
 * Cadeia de evolução com quem você já viu (Pokédex) em mini carta: nota e posição principal da espécie, sprite e nome;
 * quem não viu é silhueta "???", sem nota. A forma atual fica destacada. Com `onPick`, tocar num estágio visto abre a
 * ficha dele (Pokédex: navega; carta: ficha empilhada); sem, só mostra.
 */
export function EvoChain({
    id,
    dex,
    onPick,
    pickUnseen,
}: {
    id: number;
    dex: Dex;
    onPick?: (id: number) => void;
    /** Pokédex: a forma não vista também abre (a ficha trancada dela). */
    pickUnseen?: boolean;
}) {
    const { t, d } = useT();
    const how = (eid: number) => {
        const prevo = species(eid).prevo;
        const edge = prevo ? species(prevo).evolvesTo.find((e) => e.id === eid) : undefined;
        if (!prevo || !edge) return null;
        const stone = STONES.find((s) => stoneInto(prevo, s) === eid);
        if (stone) return t('team.modal.evoHowStone', { stone: d.longCup.stoneShort[stone].replace('. ', '.\u00a0') });
        return edge.method === 'trade' ? t('team.modal.evoHowTrade') : t('team.modal.evoHowBar');
    };
    return (
        <div className="evo-chain">
            {evolutionStages(species(id)).map((ids, i) => (
                <div key={ids.join('-')} className="evo-chain-stage">
                    {i > 0 && <EvoArrow />}
                    <div className="evo-chain-col">
                        {ids.map((eid) => {
                            const current = eid === id;
                            const known = current || !!dex[eid];
                            const way = how(eid);
                            const view = known ? viewInstance(speciesCard(eid)) : null;
                            const pos = view ? d.common.posShort[view.naturalPosition] : '';
                            const label = `${known ? species(eid).name : t('profile.sheet.evoNotSeen', { no: dexNo(eid) })}${view ? `, ${view.overall} ${pos}` : ''}${way ? ` (${way})` : ''}`;
                            const body = (
                                <>
                                    {view && (
                                        <span className="evo-chain-ovr">
                                            <b>{view.overall}</b>
                                            <small>{pos}</small>
                                        </span>
                                    )}
                                    <img
                                        className="pixel"
                                        src={speciesGif(eid)}
                                        alt=""
                                        loading="lazy"
                                        draggable={false}
                                    />
                                    <span className="evo-chain-name">{known ? species(eid).name : '???'}</span>
                                    {way && <small className="evo-chain-how">{way}</small>}
                                </>
                            );
                            const cls = `evo-chain-mon${current ? ' current' : ''}${known ? '' : ' unseen'}`;
                            const style = view
                                ? ({ '--metal': METAL[metalOf(view.overall)].color } as CSSProperties)
                                : undefined;
                            return onPick && !current && (known || pickUnseen) ? (
                                <button
                                    type="button"
                                    key={eid}
                                    className={`${cls} pick`}
                                    style={style}
                                    onClick={() => onPick(eid)}
                                    aria-label={label}
                                >
                                    {body}
                                </button>
                            ) : (
                                <div
                                    key={eid}
                                    className={cls}
                                    style={style}
                                    role="img"
                                    aria-label={label}
                                    aria-current={current || undefined}
                                >
                                    {body}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
