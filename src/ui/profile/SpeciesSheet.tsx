import { useEffect, useRef } from 'react';
import { MOVES, SPECIES_BY_ID, type Species, type StatKey, species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import { SIGNATURE } from '../../engine/signature-moves';
import { playCry } from '../../game/audio';
import { getLang, moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { defaultCard } from '../../store/binder';
import { useGame } from '../../store/game-store';
import {
    albumCount,
    CAREER_SEALS,
    type CareerSeal,
    type Dex,
    type DexEntry,
    isPlayed,
    kantoComplete,
    type MoveDex,
    playedCount,
    SEAL_GOAL,
    sealsOf,
    topSeal,
} from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { Tip } from '../components/Tip';
import { TypeIcon } from '../components/TypeIcon';
import { METAL, metalOf } from '../rarity';
import { TYPE_COLOR } from '../type-colors';
import { speciesGif } from './club';
import { BallMark, CareerSealIcon, ChampionRibbon, Chevron, EvoArrow, LockIcon, SpeakerIcon } from './icons';
import { sealTip } from './seal-tip';

const STATS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

export const dexNo = (id: number) => String(id).padStart(3, '0');
const fmt1 = (n: number) => (getLang() === 'pt' ? n.toFixed(1).replace('.', ',') : n.toFixed(1));

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
    onAlbum,
}: {
    id: number;
    /** "Figurinhas 3/5 · Ver no álbum": abre o Álbum na página dele (as cartas ficam só no Álbum). */
    onAlbum?: (id: number) => void;
    /** Ordem da lista atual (para anterior/próximo). */
    order: number[];
    onNav: (id: number) => void;
    onClose: () => void;
}) {
    const dex = useGame((s) => s.dex);
    const moves = useGame((s) => s.moves);
    const cries = useGame((s) => s.settings.cries);
    const { t, tn, d } = useT();
    const sp = species(id);
    const entry = dex[id];
    const seal = topSeal(entry, kantoComplete(dex));
    const seen = !!entry;
    const played = isPlayed(entry);
    const idx = order.indexOf(id);
    const prev = idx > 0 ? order[idx - 1] : null;
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
    // anterior/próximo: a ficha nova entra deslizando do lado de onde veio
    const last = useRef(id);
    const slide = last.current === id ? '' : idx > order.indexOf(last.current) ? ' pf-slide-next' : ' pf-slide-prev';
    useEffect(() => {
        last.current = id;
    }, [id]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft' && prev !== null) onNav(prev);
            else if (e.key === 'ArrowRight' && next !== null) onNav(next);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [prev, next, onNav, onClose]);

    const stickers = albumCount(dex, [sp]);

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
                aria-label={t('profile.sheet.aria', { no: dexNo(id), name })}
                style={{ ['--accent' as string]: seen ? accent : '#4b5a9a' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="modal-close"
                    onClick={onClose}
                    aria-label={t('common.ui.close')}
                    // biome-ignore lint/a11y/noAutofocus: o foco vai para dentro da janela que acabou de abrir
                    autoFocus
                >
                    <HudIcon kind="close" />
                </button>

                <div key={id} className={`pf-sheet-hero${slide}`}>
                    <div className="pf-sheet-art">
                        <img
                            className={`pixel${seen ? '' : ' pf-silhouette'}`}
                            src={speciesGif(id)}
                            alt={seen ? sp.name : t('profile.sheet.notSeenAlt')}
                            draggable={false}
                        />
                    </div>
                    <div className="pf-sheet-id">
                        <span className="pf-sheet-no">{t('profile.sheet.no', { no: dexNo(id) })}</span>
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
                                    <BallMark /> {t('profile.sheet.playedForYou')}
                                </>
                            ) : seen ? (
                                t('profile.sheet.seen')
                            ) : (
                                <>
                                    <LockIcon /> {t('profile.sheet.notSeen')}
                                </>
                            )}
                        </span>
                        {(entry?.titles ?? 0) > 0 && (
                            <span className="pf-champ">
                                <ChampionRibbon n={entry.titles} /> {tn('profile.sheet.ribbon', entry.titles)}
                            </span>
                        )}
                        {seal && (
                            <Tip
                                className={`pf-champ pf-seal-line seal-${seal}`}
                                text={sealTip(t, seal, sp.name, entry, playedCount(dex))}
                            >
                                <CareerSealIcon seal={seal} />{' '}
                                {t('profile.sheet.seal', { name: d.profile.sheet.sealNames[seal] })}
                            </Tip>
                        )}
                        {seen && (
                            <button
                                type="button"
                                className="btn ghost small pf-cry"
                                onClick={() => playCry(id, cries)}
                                aria-label={t('profile.sheet.cryAria', { name: sp.name })}
                            >
                                <SpeakerIcon /> {t('profile.sheet.cry')}
                            </button>
                        )}
                    </div>
                </div>

                {seen && onAlbum && (
                    <button type="button" className="pf-album-line" onClick={() => onAlbum(id)}>
                        <HudIcon kind="cards" />
                        <span>
                            {t('profile.album.stickers')}{' '}
                            <b>
                                {stickers.got}/{stickers.total}
                            </b>
                        </span>
                        <span className="pf-album-go">{t('profile.album.seeIn')}</span>
                        <HudIcon kind="next" />
                    </button>
                )}
                {seen ? <SeenBody sp={sp} dex={dex} moves={moves} onNav={onNav} /> : <LockedBody />}

                <div className="pf-sheet-nav">
                    <button
                        type="button"
                        className="btn ghost small"
                        disabled={prev === null}
                        onClick={() => prev !== null && onNav(prev)}
                        aria-label={t('profile.sheet.prev')}
                    >
                        <Chevron dir="left" />
                        {prev !== null && <span>{t('profile.sheet.no', { no: dexNo(prev) })}</span>}
                    </button>
                    <button
                        type="button"
                        className="btn ghost small"
                        disabled={next === null}
                        onClick={() => next !== null && onNav(next)}
                        aria-label={t('profile.sheet.next')}
                    >
                        {next !== null && <span>{t('profile.sheet.no', { no: dexNo(next) })}</span>}
                        <Chevron dir="right" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function LockedBody() {
    const { t } = useT();
    return (
        <div className="pf-locked">
            <p>{t('profile.sheet.locked')}</p>
        </div>
    );
}

function SeenBody({ sp, dex, moves, onNav }: { sp: Species; dex: Dex; moves: MoveDex; onNav: (id: number) => void }) {
    const inst = defaultCard(sp);
    const view = viewInstance(inst);
    const entry = dex[sp.id];
    const stages = evolutionStages(sp);
    const signature = SIGNATURE[sp.id];
    const moveIds = inst.moves;
    const found = moveIds.filter((m) => (moves[m] ?? 0) > 0).length;
    const { t, d } = useT();

    return (
        <div className="pf-sheet-body">
            <section className="pf-block">
                <h3>{t('profile.sheet.positions')}</h3>
                <div className="pf-chips">
                    {view.positions.map((p, i) => (
                        <span key={p} className={`pos-chip${i === 0 ? ' main' : ''}`}>
                            {d.common.pos[p]}
                            {i === 0 ? t('profile.sheet.main') : ''}
                        </span>
                    ))}
                </div>
            </section>

            <section className="pf-block">
                <h3>
                    {t('profile.sheet.baseStats')}{' '}
                    <span className="pf-bst">{t('profile.sheet.total', { n: sp.bst })}</span>
                </h3>
                <div className="pf-stats">
                    {STATS.map((k) => {
                        const v = sp.baseStats[k];
                        return (
                            <div key={k} className="pf-stat">
                                <span>{d.profile.sheet.stats[k]}</span>
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
                    <h3>{t('profile.sheet.evolution')}</h3>
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
                                                aria-label={
                                                    known
                                                        ? species(eid).name
                                                        : t('profile.sheet.evoNotSeen', { no: dexNo(eid) })
                                                }
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
                            ? t('profile.sheet.evolvesMidMatch')
                            : t('profile.sheet.finalForm')}
                    </p>
                </section>
            )}

            <section className="pf-block">
                <h3>
                    {t('profile.sheet.moves')}{' '}
                    <span className="pf-bst">{t('profile.sheet.found', { found, total: moveIds.length })}</span>
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
                                <b>{known ? moveName(m) : '???'}</b>
                                {m === signature && <em className="pf-sig">{t('profile.sheet.signature')}</em>}
                            </li>
                        );
                    })}
                </ul>
                {found < moveIds.length && <p className="pf-note">{t('profile.sheet.movesHelp')}</p>}
            </section>

            {entry && isPlayed(entry) && <Seals entry={entry} dex={dex} />}

            <section className="pf-block">
                <h3>{t('profile.sheet.career')}</h3>
                {entry && isPlayed(entry) ? (
                    <div className="pf-career">
                        <Num label={t('profile.sheet.matches')} v={entry.matches} />
                        <Num label={t('profile.sheet.minutes')} v={entry.minutes} />
                        <Num label={t('profile.sheet.goals')} v={entry.goals} />
                        <Num label={t('profile.sheet.assists')} v={entry.assists} />
                        <Num label={t('profile.sheet.wins')} v={entry.wins} />
                        <Num label={t('profile.sheet.titles')} v={entry.titles} />
                        <Num
                            label={t('profile.sheet.bestRating')}
                            v={entry.bestRating > 0 ? fmt1(entry.bestRating) : '—'}
                        />
                        <div className="pf-num">
                            {entry.bestOvr > 0 ? (
                                <b
                                    className="pf-metal"
                                    style={{ ['--metal' as string]: METAL[metalOf(entry.bestOvr)].color }}
                                    title={d.common.metal[metalOf(entry.bestOvr)]}
                                >
                                    {entry.bestOvr}
                                </b>
                            ) : (
                                <b>—</b>
                            )}
                            <span>
                                {t('profile.sheet.bestCard')}
                                {entry.bestOvr > 0 && ` · ${d.common.metal[metalOf(entry.bestOvr)]}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="pf-note">{t('profile.sheet.notPlayed')}</p>
                )}
            </section>
        </div>
    );
}

/** Os 4 degraus do selo de carreira com o quanto falta (retroativo: sai dos números da Dex). */
function Seals({ entry, dex }: { entry: DexEntry; dex: Dex }) {
    const { t, d } = useT();
    const played = playedCount(dex);
    const got = sealsOf(entry, kantoComplete(dex));
    const progress: Record<CareerSeal, number> = {
        folha: Math.min(entry.matches, SEAL_GOAL.folha),
        holo: Math.min(entry.goals, SEAL_GOAL.holo),
        prisma: Math.min(entry.titles, SEAL_GOAL.prisma),
        ouro: played,
    };
    return (
        <section className="pf-block">
            <h3>
                {t('profile.sheet.seals')}{' '}
                <span className="pf-bst">
                    {got.length}/{CAREER_SEALS.length}
                </span>
            </h3>
            <ul className="pf-seals">
                {CAREER_SEALS.map((s) => {
                    const on = got.includes(s);
                    const name = d.profile.sheet.sealNames[s];
                    const goal = t(`profile.sheet.sealGoal.${s}`, { n: progress[s] });
                    return (
                        <li
                            key={s}
                            className={`pf-seal-slot${on ? ' got' : ''}`}
                            aria-label={
                                on
                                    ? t('profile.sheet.sealGot', { name })
                                    : t('profile.sheet.sealMissing', { name, goal })
                            }
                        >
                            <CareerSealIcon seal={s} />
                            <b>{name}</b>
                            <small>{goal}</small>
                        </li>
                    );
                })}
            </ul>
            <p className="pf-note">{t('profile.sheet.sealsHelp')}</p>
        </section>
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
