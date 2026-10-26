import { type ReactNode, useRef, useState } from 'react';
import { computeAttributes } from '../../engine/attributes';
import { relampagoBracket } from '../../engine/bracket';
import { CLUBS, cupRival } from '../../engine/cup';
import { species } from '../../engine/data';
import { FORMATIONS, type FormationId, hasEdge } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { pickCornerTaker } from '../../engine/match';
import { applyModifiers, attributeModifiers } from '../../engine/modifiers';
import { type CornerPlan, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { clubName, cupStageName, dict, formationText, itemDesc, itemName, tn } from '../../i18n';
import { useT } from '../../i18n/react';
import { liveOf, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { isFinalStage, isLong, isOut, type OutWhy, outOf } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { BracketPeek, bracketRivals, bracketYou } from '../components/Bracket';
import { Fold, foldOpenByDefault } from '../components/Fold';
import { FormationBoard } from '../components/FormationBoard';
import { EdgeMark, FormationIdentity } from '../components/FormationIdentity';
import { FutCard } from '../components/FutCard';
import { LinkChips } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { cardSprite, TypeBadge } from '../components/PokeCard';
import { Money, SponsorSlots } from '../components/SponsorCard';
import { leaveWith } from '../feedback';
import { edgeAgainst, FORMATION_ICON } from '../formation-info';
import { Tip } from '../help/Tip';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';
import { useHeld } from '../use-held';

/** Descrição das táticas em português (o texto de cada idioma está em i18n: team.lineup.tacticDesc). */
export const TACTIC_DESC: Record<Tactic, string> = dict('pt').team.lineup.tacticDesc;

/** Instruções de escanteio na ordem da tela. */
export const CORNER_PLANS: CornerPlan[] = ['area', 'short', 'mixed'];

export function Lineup() {
    const {
        run: live,
        swapSlots,
        setTactic,
        setCorner,
        setFormation,
        moveItem,
        setMatch,
        go,
        abandonRun,
        lockMatch,
    } = useGame();
    const run = useHeld(live);
    const [error, setError] = useState<string | null>(null);
    const [askAbandon, setAskAbandon] = useState(false);
    const openCard = useCardModal((s) => s.open);
    const [loading, setLoading] = useState(false);
    const { t, d, lang } = useT();
    const clubColor = useClubColor();
    if (!run) return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const opponent = run.opponents[run.stage];
    // Copa longa: quem está fora (lesão, Creche) tem o selo na carta; titular fora trava o Jogar até você trocar
    const outStarter = run.lineup.filter((u) => isOut(run, u)).map((u) => viewInstance(byUid.get(u)!).displayName)[0];
    const locked = !!run.lockedTeam;

    const play = async () => {
        const seed = run.seed;
        const stage = run.stage;
        // a partida trava o time: sair no meio e voltar retoma a mesma partida
        // save da 0.6 não tinha manualSubs: nada automático no time do jogador
        const team = run.lockedTeam ? { ...run.lockedTeam, manualSubs: true } : playerTeam(run);
        lockMatch(team);
        setLoading(true);
        setError(null);
        try {
            // retomando: as mesmas ordens do técnico (tática/substituições) dão a mesma partida
            const orders = liveOf(useGame.getState().run)?.orders ?? [];
            const result = await simulateMatch(team, cupRival(opponent, true), `${seed}-stage-${stage}`, orders);
            // só abre a partida se o jogador ainda está nesta tela, nesta run e nesta fase
            const now = useGame.getState();
            if (now.screen !== 'lineup' || now.run?.seed !== seed || now.run.stage !== stage) return;
            setMatch(result);
            go('match');
        } catch {
            setError(t('team.lineup.simError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Copa Relâmpago: as 4 fases (na Rota o caminho é o mapa, e os rivais só existem até a casa de agora) */}
            {!isLong(run) && (
                <div className="cup-bug bc-surface">
                    <div className="cup-path">
                        {d.common.stage.map((label, i) => {
                            const res = run.results.find((r) => r.stage === i);
                            const cls = res ? (res.won ? 'won' : 'lost') : i === run.stage ? 'now' : '';
                            return (
                                <div key={label} className={`cup-step ${cls}`}>
                                    <b>{label}</b>
                                    <span className="muted">{clubName(run.opponents[i].name, lang)}</span>
                                    {res && (
                                        <div>
                                            {res.score[0]} x {res.score[1]}
                                            {res.shootout &&
                                                t('team.lineup.pens', { a: res.shootout[0], b: res.shootout[1] })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Copa Relâmpago: a chave inteira num toque, com você na fase de agora */}
            {!isLong(run) && (
                <BracketPeek
                    rounds={relampagoBracket(
                        run.seed,
                        bracketYou(run.teamName, clubColor, run.picks, run.captainUid),
                        bracketRivals(run.opponents),
                        run.results,
                    )}
                    current={run.stage}
                />
            )}
            <Tip id="lineup-synergy">{t('team.lineup.tip')}</Tip>
            <LineupEditor
                title={t('team.lineup.title', { team: run.teamName })}
                formation={run.formation}
                lineup={run.lineup}
                bench={run.bench}
                byUid={byUid}
                captainUid={run.captainUid}
                tactic={run.tactic}
                cornerPlan={run.cornerPlan ?? 'mixed'}
                cornerTakerUid={run.cornerTakerUid ?? null}
                locked={locked}
                onFormation={setFormation}
                onSwap={swapSlots}
                onTactic={setTactic}
                onCorner={setCorner}
                onMoveItem={moveItem}
                sponsors={run.sponsors}
                rivalFormation={opponent.formation ?? '1-2-1'}
                outOf={(u) => outOf(run, u)}
                side={
                    <div className="panel">
                        <h2>
                            {cupStageName(run, run.stage, lang)}: {clubName(opponent.name, lang)}
                        </h2>
                        <div className="opponent-strip">
                            {opponent.lineup.map((p) => (
                                <button
                                    key={p.uid}
                                    type="button"
                                    className="scout-btn"
                                    onClick={() =>
                                        openCard(p, {
                                            note: t('team.lineup.opponentNote', {
                                                name: clubName(opponent.name, lang),
                                            }),
                                        })
                                    }
                                    aria-label={t('team.lineup.seeCard', { name: viewInstance(p).displayName })}
                                >
                                    <img className="pixel" src={cardSprite(p)} alt="" />
                                </button>
                            ))}
                        </div>
                        <p className="fi-rival">
                            <span>
                                {clubCity(opponent.name)} → {formationText(opponent.formation ?? '1-2-1', lang).name}
                            </span>
                            {edgeAgainst(opponent.formation ?? '1-2-1') && (
                                <span className="fi-rival-edge">
                                    <EdgeMark />
                                    {formationText(edgeAgainst(opponent.formation ?? '1-2-1')!, lang).name}
                                </span>
                            )}
                        </p>
                        <p className="muted" style={{ fontSize: 11 }}>
                            {t('team.lineup.oppTactic', {
                                tactic: d.common.tactic[opponent.tactic],
                                n: lineupAverage(opponent.lineup, opponent.formation),
                            })}
                        </p>
                        <div className="bc-thumbbar">
                            {/* Rota Índigo: titular machucado trava o Jogar; o porquê fica do lado do botão */}
                            {outStarter && (
                                <p className="tb-hint" id="lineup-play-why">
                                    {t('longCup.outStarter', { name: outStarter })}
                                </p>
                            )}
                            <button
                                type="button"
                                className="btn primary wide"
                                onClick={play}
                                disabled={loading || !!outStarter}
                                aria-describedby={outStarter ? 'lineup-play-why' : undefined}
                            >
                                {loading
                                    ? t('team.lineup.warming')
                                    : locked
                                      ? t('team.lineup.backToMatch')
                                      : isFinalStage(run)
                                        ? t('longCup.playFinal')
                                        : t('team.lineup.play', {
                                              stage:
                                                  lang === 'pt'
                                                      ? cupStageName(run, run.stage, lang).toLowerCase()
                                                      : cupStageName(run, run.stage, lang),
                                          })}
                            </button>
                        </div>
                        {!!run.sponsors?.length && (
                            <div className="lineup-sponsors">
                                <span className="muted">
                                    {t('shop.sponsors')} · <Money n={run.money ?? 0} />
                                </span>
                                <SponsorSlots sponsors={run.sponsors} />
                            </div>
                        )}
                        {locked && <p className="tactic-desc">{t('team.lineup.lockedNote')}</p>}
                        {error && <p className="error-text">{error}</p>}
                    </div>
                }
                footer={
                    /* sem o confirm() do navegador: o 1º toque pergunta aqui mesmo, o 2º confirma */
                    askAbandon ? (
                        <div
                            className="abandon-ask"
                            role="alert"
                            // a confirmação cresce pra baixo: traz ela pra cima da barra do Jogar (scroll-padding)
                            ref={(el) =>
                                el?.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' })
                            }
                        >
                            <span>{t('team.lineup.abandonConfirm')}</span>
                            <button
                                type="button"
                                className="btn small danger"
                                data-fx="none"
                                onClick={() => leaveWith('leave', abandonRun)}
                            >
                                {t('team.lineup.abandon')}
                            </button>
                            <button type="button" className="btn ghost small" onClick={() => setAskAbandon(false)}>
                                {t('common.ui.cancel')}
                            </button>
                        </div>
                    ) : (
                        <button type="button" className="btn ghost small" onClick={() => setAskAbandon(true)}>
                            {t('team.lineup.abandon')}
                        </button>
                    )
                }
            />
        </>
    );
}

/**
 * Escalação (a mesma da copa e do duelo): formação, quadra com as vagas (toque em dois pra trocar), tática,
 * instrução e cobrador de escanteio, sinergias e a carta de quem foi tocado. O que muda de um modo pro outro
 * (rival, botão de jogar, abandonar) entra por `side` e `footer`.
 */
/** "Pewter" em vez de "Pewter Rochedo" na linha curta do rival. */
const clubCity = (name: string) => CLUBS.find((c) => c.name === name)?.city ?? name;

export function LineupEditor({
    title,
    formation,
    lineup,
    bench,
    byUid,
    captainUid,
    tactic,
    cornerPlan,
    cornerTakerUid,
    locked,
    onFormation,
    onSwap,
    onTactic,
    onCorner,
    onMoveItem,
    side,
    footer,
    sponsors,
    rivalFormation,
    outOf,
}: {
    title: string;
    formation: FormationId;
    lineup: string[];
    bench: string[];
    byUid: Map<string, PokemonInstance>;
    captainUid: string | null;
    tactic: Tactic;
    cornerPlan: CornerPlan;
    cornerTakerUid: string | null;
    locked: boolean;
    onFormation: (f: FormationId) => void;
    onSwap: (a: SlotRef, b: SlotRef) => void;
    onTactic: (t: Tactic) => void;
    onCorner: (patch: { cornerPlan?: CornerPlan; cornerTakerUid?: string | null }) => void;
    /** Só na copa (o item vai junto do time do duelo, lacrado). */
    onMoveItem?: (fromUid: string, toUid: string) => void;
    side: ReactNode;
    footer?: ReactNode;
    /** Patrocínios da copa: os de campo entram na conta da escalação (carta = campo). */
    sponsors?: readonly string[];
    /** Formação do rival, quando se sabe (selo "Vantagem tática" se a sua encaixa). */
    rivalFormation?: FormationId;
    /** Rota Índigo: quem está fora (lesão, Creche) e por quantas partidas. No banco fica travado. */
    outOf?: (uid: string) => { why: OutWhy | 'fora'; n: number } | null;
}) {
    const [selected, setSelected] = useState<SlotRef | null>(null);
    const [detail, setDetail] = useState<string | null>(null);
    /** Passando o item: quem tem o item que vai pra outro (o próximo toque na prancheta decide quem recebe). */
    const [giving, setGiving] = useState<string | null>(null);
    const givingItem = giving ? byUid.get(giving)?.item : undefined;
    const boardRef = useRef<HTMLDivElement>(null);
    const { t, d, lang } = useT();
    const picks = [...lineup, ...bench].flatMap((u) => byUid.get(u) ?? []);
    const detailInst = byUid.get(detail ?? lineup[0]) ?? picks[0];
    const synergies = computeSynergies(lineup.map((u) => byUid.get(u)!));
    const links = computeLinks(lineup.map((u) => byUid.get(u)!));
    const slotsNow = FORMATIONS[formation].slots;
    const positionOf = (uid: string) => {
        const i = lineup.indexOf(uid);
        return i >= 0 ? slotsNow[i] : undefined;
    };

    // escanteio: quem pode cobrar (jogadores de linha) e o automático (a mesma regra do motor)
    const lineupNow = lineup.map((u) => byUid.get(u)!);
    const captainNow = lineupNow.find((p) => p.uid === captainUid) ?? null;
    const cornerField = lineupNow
        .map((inst, i) => {
            const role = slotsNow[i];
            const mods = attributeModifiers(inst, { lineup: lineupNow, captain: captainNow, role, sponsors });
            const passing = applyModifiers(computeAttributes(species(inst.speciesId), inst.level), mods, role).passing;
            return { inst, role, passing };
        })
        .filter((f) => f.role !== 'GK');
    const autoTaker = pickCornerTaker(cornerField)?.inst;
    const chosenTaker = cornerTakerUid ? byUid.get(cornerTakerUid) : undefined;
    const takerOff = !!chosenTaker && !cornerField.some((f) => f.inst.uid === chosenTaker.uid);
    const captainBenched = !!captainUid && bench.includes(captainUid);

    const onSlot = (ref: SlotRef, uid: string) => {
        setDetail(uid);
        if (locked) return;
        if (giving) {
            if (uid !== giving) {
                onMoveItem?.(giving, uid);
            }
            setGiving(null);
            return;
        }
        if (!selected) {
            setSelected(ref);
            return;
        }
        if (selected.zone !== ref.zone || selected.index !== ref.index) {
            onSwap(selected, ref);
        }
        setSelected(null);
    };

    return (
        <div className="lineup-grid">
            <div className="panel" ref={boardRef}>
                <h2>{title}</h2>
                <div className="formation-tabs bc-seg segmented">
                    {Object.values(FORMATIONS).map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className={formation === f.id ? 'on' : undefined}
                            aria-pressed={formation === f.id}
                            disabled={locked}
                            onClick={() => onFormation(f.id)}
                        >
                            <HudIcon kind={FORMATION_ICON[f.id]} />
                            {formationText(f.id, lang).name}
                        </button>
                    ))}
                </div>
                <FormationIdentity id={formation} edge={!!rivalFormation && hasEdge(formation, rivalFormation)} />
                <p className="muted" style={{ marginTop: 8 }}>
                    {givingItem ? t('team.lineup.giveHint', { item: itemName(givingItem) }) : t('team.lineup.swapHint')}
                </p>
                <FormationBoard
                    formation={formation}
                    lineup={lineup}
                    bench={bench}
                    byUid={byUid}
                    captainUid={captainUid}
                    projection={
                        !giving && selected
                            ? byUid.get((selected.zone === 'lineup' ? lineup : bench)[selected.index])
                            : null
                    }
                    stateOf={(ref, uid) =>
                        ref.zone === 'bench' && outOf?.(uid)
                            ? 'locked'
                            : giving
                              ? uid === giving
                                  ? 'selected'
                                  : 'target'
                              : selected?.zone === ref.zone && selected.index === ref.index
                                ? 'selected'
                                : 'idle'
                    }
                    onSlot={onSlot}
                    badgeOf={outOf && ((inst) => <OutBadge out={outOf(inst.uid)} />)}
                    footer={
                        <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                            {t('team.lineup.subHint')}
                        </p>
                    }
                />
            </div>

            <div className="side-stack">
                {side}

                <div className="panel">
                    <h2>{t('team.lineup.tactic')}</h2>
                    {captainBenched && <p className="error-text">{t('team.lineup.captainBenched')}</p>}
                    <Fold
                        label={t('match.coach.style')}
                        summary={d.common.tactic[tactic]}
                        defaultOpen={foldOpenByDefault()}
                    >
                        <div className="bc-styles">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => (
                                <button
                                    key={tc}
                                    type="button"
                                    className={`bc-tile${tactic === tc ? ' on' : ''}`}
                                    aria-pressed={tactic === tc}
                                    disabled={locked}
                                    onClick={() => onTactic(tc)}
                                >
                                    <HudIcon kind={tc} />
                                    <span>
                                        <b>{d.common.tactic[tc]}</b>
                                        <small>{d.match.coach.styleShort[tc]}</small>
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="tactic-desc">
                            {d.team.lineup.tacticDesc[tactic]} {t('team.lineup.canChange')}
                        </p>
                    </Fold>
                    <Fold
                        label={t('team.lineup.corner')}
                        summary={d.common.cornerPlan[cornerPlan]}
                        defaultOpen={foldOpenByDefault()}
                    >
                        <div className="bc-seg">
                            {CORNER_PLANS.map((pl) => (
                                <button
                                    key={pl}
                                    type="button"
                                    className={cornerPlan === pl ? 'on' : undefined}
                                    aria-pressed={cornerPlan === pl}
                                    disabled={locked}
                                    onClick={() => onCorner({ cornerPlan: pl })}
                                >
                                    {d.common.cornerPlan[pl]}
                                </button>
                            ))}
                        </div>
                        <p className="tactic-desc">
                            {d.team.lineup.cornerDesc[cornerPlan]} {t('team.lineup.canChange')}
                        </p>
                    </Fold>
                    <Fold
                        label={t('team.lineup.cornerTaker')}
                        summary={
                            chosenTaker
                                ? viewInstance(chosenTaker).displayName
                                : autoTaker
                                  ? viewInstance(autoTaker).displayName
                                  : '?'
                        }
                        defaultOpen={foldOpenByDefault()}
                    >
                        <label className="corner-taker">
                            <span>{t('team.lineup.cornerTaker')}</span>
                            <select
                                value={cornerTakerUid ?? ''}
                                disabled={locked}
                                onChange={(e) => onCorner({ cornerTakerUid: e.target.value || null })}
                            >
                                <option value="">
                                    {t('team.lineup.cornerAuto', {
                                        name: autoTaker ? viewInstance(autoTaker).displayName : '?',
                                    })}
                                </option>
                                {cornerField.map((f) => (
                                    <option key={f.inst.uid} value={f.inst.uid}>
                                        {t('team.lineup.cornerTakerOpt', {
                                            name: viewInstance(f.inst).displayName,
                                            pos: d.common.pos[f.role],
                                            n: Math.round(f.passing),
                                        })}
                                    </option>
                                ))}
                                {chosenTaker && takerOff && (
                                    <option value={chosenTaker.uid}>{viewInstance(chosenTaker).displayName}</option>
                                )}
                            </select>
                        </label>
                        {chosenTaker && takerOff && (
                            <p className="tactic-desc">
                                {t('team.lineup.cornerTakerOff', { name: viewInstance(chosenTaker).displayName })}
                            </p>
                        )}
                    </Fold>
                    <Fold
                        label={t('team.lineup.typeSynergies')}
                        summary={synergies.length}
                        defaultOpen={foldOpenByDefault()}
                    >
                        {synergies.length === 0 ? (
                            <p className="tactic-desc">{t('team.lineup.typeSynEmpty')}</p>
                        ) : (
                            <div className="row" style={{ gap: 8 }}>
                                {synergies.map((s) => (
                                    <span key={s.type} className="row" style={{ gap: 4 }}>
                                        <TypeBadge type={s.type} />
                                        <span className="tactic-desc">
                                            ×{s.count} · +{Math.round((s.bonus - 1) * 100)}%
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </Fold>
                    <Fold
                        label={t('team.lineup.storySynergies')}
                        summary={links.length}
                        defaultOpen={foldOpenByDefault()}
                    >
                        {links.length === 0 ? (
                            <p className="tactic-desc">{t('team.lineup.storySynEmpty')}</p>
                        ) : (
                            <div className="row" style={{ gap: 6 }}>
                                <LinkChips links={links} />
                            </div>
                        )}
                    </Fold>
                </div>

                {detailInst && (
                    <>
                        <Fold
                            label={viewInstance(detailInst).displayName}
                            summary={t('team.lineup.cardFold')}
                            defaultOpen={foldOpenByDefault()}
                        >
                            <div className="detail-card">
                                <FutCard
                                    inst={detailInst}
                                    captain={detailInst.uid === captainUid}
                                    position={positionOf(detailInst.uid)}
                                    fullButton
                                />
                            </div>
                        </Fold>
                        {detailInst.item && onMoveItem && (
                            <div className="panel item-move">
                                <img className="pixel" src={itemSprite(detailInst.item)} alt="" />
                                <span>
                                    <b>{itemName(detailInst.item)}</b> — {itemDesc(detailInst.item, lang)}
                                </span>
                                <button
                                    type="button"
                                    className={`btn small${giving === detailInst.uid ? ' ghost' : ''}`}
                                    aria-pressed={giving === detailInst.uid}
                                    disabled={locked}
                                    onClick={() => {
                                        setSelected(null);
                                        setGiving(giving === detailInst.uid ? null : detailInst.uid);
                                        // no celular a prancheta fica lá em cima: traz ela pra tela
                                        boardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                                    }}
                                >
                                    {giving === detailInst.uid ? t('team.lineup.giveCancel') : t('team.lineup.giveTo')}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {footer}
            </div>
        </div>
    );
}

const OUT_ICON = { lesao: 'medkit', creche: 'egg', cansado: 'dumbbell', fora: 'lock' } as const;

/** Selo de quem está fora na Rota (Na creche, Machucado…) com quantas partidas faltam pra voltar. */
export function OutBadge({ out }: { out: { why: OutWhy | 'fora'; n: number } | null }) {
    const { d } = useT();
    if (!out) return null;
    const tag = d.longCup.outTag[out.why];
    return (
        <span className={`slot-out why-${out.why}`} role="img" aria-label={tn('longCup.outAria', out.n, { tag })}>
            <HudIcon kind={OUT_ICON[out.why]} />
            <b>{tag}</b>
            <small>{tn('longCup.outLeft', out.n)}</small>
        </span>
    );
}
