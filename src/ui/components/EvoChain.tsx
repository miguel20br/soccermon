import { SPECIES_BY_ID, type Species, species } from '../../engine/data';
import { STONES, stoneInto } from '../../engine/evolution';
import { useT } from '../../i18n/react';
import type { Dex } from '../../store/profile';
import { speciesGif } from '../profile/club';
import { EvoArrow } from '../profile/icons';
import './evo-chain.css';

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
 * Cadeia de evolução com sprite e nome de quem você já viu (Pokédex); quem não viu é silhueta "???". A forma atual
 * fica destacada. Com `onPick` (Pokédex), tocar num estágio abre a ficha dele; sem (carta), só mostra.
 */
export function EvoChain({ id, dex, onPick }: { id: number; dex: Dex; onPick?: (id: number) => void }) {
    const { t, d } = useT();
    const how = (eid: number) => {
        const prevo = species(eid).prevo;
        const edge = prevo ? species(prevo).evolvesTo.find((e) => e.id === eid) : undefined;
        if (!prevo || !edge) return null;
        const stone = STONES.find((s) => stoneInto(prevo, s) === eid);
        if (stone) return t('team.modal.evoHowStone', { stone: d.longCup.stone[stone] });
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
                            const label = `${known ? species(eid).name : t('profile.sheet.evoNotSeen', { no: dexNo(eid) })}${way ? ` (${way})` : ''}`;
                            const body = (
                                <>
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
                            return onPick && !current ? (
                                <button
                                    type="button"
                                    key={eid}
                                    className={`${cls} pick`}
                                    onClick={() => onPick(eid)}
                                    aria-label={label}
                                >
                                    {body}
                                </button>
                            ) : (
                                <div
                                    key={eid}
                                    className={cls}
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
