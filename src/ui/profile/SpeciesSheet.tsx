import { useEffect } from 'react';
import { POSITION_LABEL } from '../../engine/attributes';
import { MOVES, SPECIES_BY_ID, type Species, type StatKey, species } from '../../engine/data';
import { DEFAULT_LEVEL, type PokemonInstance, viewInstance } from '../../engine/instance';
import { defaultMoveset } from '../../engine/moves';
import { SIGNATURE } from '../../engine/signature-moves';
import { playCry } from '../../game/audio';
import { useGame } from '../../store/game-store';
import { type Dex, isPlayed, type MoveDex } from '../../store/profile';
import { TypeIcon } from '../components/TypeIcon';
import { METAL, metalOf } from '../rarity';
import { TYPE_COLOR } from '../type-colors';
import { speciesGif } from './club';
import { BallMark, Chevron, EvoArrow, LockIcon, SpeakerIcon } from './icons';

const STATS: { k: StatKey; label: string }[] = [
    { k: 'hp', label: 'PS' },
    { k: 'atk', label: 'Ataque' },
    { k: 'def', label: 'Defesa' },
    { k: 'spa', label: 'At. Esp.' },
    { k: 'spd', label: 'Def. Esp.' },
    { k: 'spe', label: 'Velocidade' },
];

export const dexNo = (id: number) => String(id).padStart(3, '0');
const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Um Pokémon "de vitrine" (nível 50, golpes padrão) só para ler posições e golpes. */
function showcase(sp: Species): PokemonInstance {
    return {
        uid: `dex-${sp.id}`,
        speciesId: sp.id,
        level: DEFAULT_LEVEL,
        xp: 0,
        moves: defaultMoveset(sp),
        ability: sp.abilities[0] ?? '',
        shiny: false,
        nickname: null,
        condition: 1,
    };
}

/** Linha evolutiva por estágio (só espécies do jogo): [[Eevee], [Vaporeon, Jolteon, Flareon]]. */
function evolutionStages(sp: Species): number[][] {
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

const statColor = (v: number) => (v >= 110 ? '#58c26b' : v >= 80 ? '#b6d94c' : v >= 55 ? '#ffcb05' : '#f07f1d');

/** Página de uma espécie na Pokédex (janela). Não visto = carta trancada "???". */
export function SpeciesSheet({
    id,
    order,
    onNav,
    onClose,
}: {
    id: number;
    /** Ordem da lista atual (para anterior/próximo). */
    order: number[];
    onNav: (id: number) => void;
    onClose: () => void;
}) {
    const dex = useGame((s) => s.dex);
    const moves = useGame((s) => s.moves);
    const cries = useGame((s) => s.settings.cries);
    const sp = species(id);
    const entry = dex[id];
    const seen = !!entry;
    const played = isPlayed(entry);
    const idx = order.indexOf(id);
    const prev = idx > 0 ? order[idx - 1] : null;
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft' && prev !== null) onNav(prev);
            else if (e.key === 'ArrowRight' && next !== null) onNav(next);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [prev, next, onNav, onClose]);

    const name = seen ? sp.name : '???';
    const accent = TYPE_COLOR[sp.types[0]] ?? '#4b5a9a';

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; o botão fecha pelo teclado
        <div className="modal-backdrop pf-sheet-backdrop" onClick={onClose} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
            <div
                className={`modal panel pf-sheet${seen ? '' : ' locked'}`}
                role="dialog"
                aria-modal="true"
                aria-label={`Pokédex: nº ${dexNo(id)} ${name}`}
                style={{ ['--accent' as string]: seen ? accent : '#4b5a9a' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Fechar"
                    // biome-ignore lint/a11y/noAutofocus: o foco vai para dentro da janela que acabou de abrir
                    autoFocus
                >
                    ×
                </button>

                <div className="pf-sheet-hero">
                    <div className="pf-sheet-art">
                        <img
                            className={`pixel${seen ? '' : ' pf-silhouette'}`}
                            src={speciesGif(id)}
                            alt={seen ? sp.name : 'Pokémon ainda não visto'}
                            draggable={false}
                        />
                    </div>
                    <div className="pf-sheet-id">
                        <span className="pf-sheet-no">Nº {dexNo(id)}</span>
                        <h2>{name}</h2>
                        {seen ? (
                            <div className="pf-sheet-types">
                                {sp.types.map((t) => (
                                    <TypeIcon key={t} type={t} label />
                                ))}
                            </div>
                        ) : null}
                        <span className={`pf-status ${played ? 'played' : seen ? 'seen' : 'unseen'}`}>
                            {played ? (
                                <>
                                    <BallMark /> Jogou pelo seu time
                                </>
                            ) : seen ? (
                                'Visto'
                            ) : (
                                <>
                                    <LockIcon /> Ainda não visto
                                </>
                            )}
                        </span>
                        {seen && (
                            <button
                                type="button"
                                className="btn ghost small pf-cry"
                                onClick={() => playCry(id, cries)}
                                aria-label={`Ouvir o grito de ${sp.name}`}
                            >
                                <SpeakerIcon /> Grito
                            </button>
                        )}
                    </div>
                </div>

                {seen ? <SeenBody sp={sp} dex={dex} moves={moves} onNav={onNav} /> : <LockedBody />}

                <div className="pf-sheet-nav">
                    <button
                        type="button"
                        className="btn ghost small"
                        disabled={prev === null}
                        onClick={() => prev !== null && onNav(prev)}
                        aria-label="Pokémon anterior"
                    >
                        <Chevron dir="left" />
                        {prev !== null && <span>Nº {dexNo(prev)}</span>}
                    </button>
                    <button
                        type="button"
                        className="btn ghost small"
                        disabled={next === null}
                        onClick={() => next !== null && onNav(next)}
                        aria-label="Próximo Pokémon"
                    >
                        {next !== null && <span>Nº {dexNo(next)}</span>}
                        <Chevron dir="right" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function LockedBody() {
    return (
        <div className="pf-locked">
            <p>
                Você ainda não viu este Pokémon. Ele entra na Pokédex quando aparece no seu draft, nas recompensas ou no
                time rival.
            </p>
        </div>
    );
}

function SeenBody({ sp, dex, moves, onNav }: { sp: Species; dex: Dex; moves: MoveDex; onNav: (id: number) => void }) {
    const inst = showcase(sp);
    const view = viewInstance(inst);
    const entry = dex[sp.id];
    const stages = evolutionStages(sp);
    const signature = SIGNATURE[sp.id];
    const moveIds = inst.moves;
    const found = moveIds.filter((m) => (moves[m] ?? 0) > 0).length;

    return (
        <div className="pf-sheet-body">
            <section className="pf-block">
                <h3>Posições</h3>
                <div className="pf-chips">
                    {view.positions.map((p, i) => (
                        <span key={p} className={`pos-chip${i === 0 ? ' main' : ''}`}>
                            {POSITION_LABEL[p]}
                            {i === 0 ? ' (principal)' : ''}
                        </span>
                    ))}
                </div>
            </section>

            <section className="pf-block">
                <h3>
                    Atributos base <span className="pf-bst">Total {sp.bst}</span>
                </h3>
                <div className="pf-stats">
                    {STATS.map((s) => {
                        const v = sp.baseStats[s.k];
                        return (
                            <div key={s.k} className="pf-stat">
                                <span>{s.label}</span>
                                <b>{v}</b>
                                <span className="pf-stat-bar">
                                    <i
                                        style={{
                                            width: `${Math.min(100, (v / 160) * 100)}%`,
                                            background: statColor(v),
                                        }}
                                    />
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {stages.length > 1 && (
                <section className="pf-block">
                    <h3>Evolução</h3>
                    <div className="pf-evo">
                        {stages.map((ids, i) => (
                            <div key={ids.join('-')} className="pf-evo-stage">
                                {i > 0 && <EvoArrow />}
                                <div className="pf-evo-col">
                                    {ids.map((eid) => {
                                        const known = !!dex[eid];
                                        const current = eid === sp.id;
                                        return (
                                            <button
                                                type="button"
                                                key={eid}
                                                className={`pf-evo-mon${current ? ' current' : ''}`}
                                                onClick={() => onNav(eid)}
                                                disabled={current}
                                                aria-label={known ? species(eid).name : `Nº ${dexNo(eid)} não visto`}
                                            >
                                                <img
                                                    className={`pixel${known ? '' : ' pf-silhouette'}`}
                                                    src={speciesGif(eid)}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <span>{known ? species(eid).name : '???'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="pf-note">
                        {sp.evolvesTo.some((e) => SPECIES_BY_ID.has(e.id))
                            ? 'No Soccermon, ele evolui no meio da partida quando joga muito bem.'
                            : 'Forma final da linha evolutiva.'}
                    </p>
                </section>
            )}

            <section className="pf-block">
                <h3>
                    Golpes no Soccermon{' '}
                    <span className="pf-bst">
                        {found}/{moveIds.length} descobertos
                    </span>
                </h3>
                <ul className="pf-moves">
                    {moveIds.map((m) => {
                        const known = (moves[m] ?? 0) > 0;
                        const data = MOVES[m];
                        return (
                            <li
                                key={m}
                                className={`pf-move${known ? '' : ' locked'}`}
                                style={known ? { borderColor: TYPE_COLOR[data.type] } : undefined}
                            >
                                {known ? <TypeIcon type={data.type} size={18} /> : <LockIcon />}
                                <b>{known ? data.name : '???'}</b>
                                {m === signature && <em className="pf-sig">Assinatura</em>}
                            </li>
                        );
                    })}
                </ul>
                {found < moveIds.length && (
                    <p className="pf-note">Os golpes aparecem aqui quando você vê o golpe em campo numa partida.</p>
                )}
            </section>

            <section className="pf-block">
                <h3>Sua carreira com ele</h3>
                {entry && isPlayed(entry) ? (
                    <div className="pf-career">
                        <Num label="Partidas" v={entry.matches} />
                        <Num label="Minutos" v={entry.minutes} />
                        <Num label="Gols" v={entry.goals} />
                        <Num label="Assistências" v={entry.assists} />
                        <Num label="Vitórias" v={entry.wins} />
                        <Num label="Títulos" v={entry.titles} />
                        <Num label="Melhor nota" v={entry.bestRating > 0 ? fmt1(entry.bestRating) : '—'} />
                        <div className="pf-num">
                            {entry.bestOvr > 0 ? (
                                <b
                                    className="pf-metal"
                                    style={{ ['--metal' as string]: METAL[metalOf(entry.bestOvr)].color }}
                                    title={METAL[metalOf(entry.bestOvr)].label}
                                >
                                    {entry.bestOvr}
                                </b>
                            ) : (
                                <b>—</b>
                            )}
                            <span>
                                Maior carta
                                {entry.bestOvr > 0 && ` · ${METAL[metalOf(entry.bestOvr)].label}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="pf-note">
                        Ainda não jogou pelo seu time. Escale ele numa copa (pelo menos 1 minuto em quadra) para começar
                        a carreira dele.
                    </p>
                )}
            </section>
        </div>
    );
}

function Num({ label, v }: { label: string; v: number | string }) {
    return (
        <div className="pf-num">
            <b>{v}</b>
            <span>{label}</span>
        </div>
    );
}
