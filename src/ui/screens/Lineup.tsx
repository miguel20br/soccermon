import { type ReactNode, useRef, useState } from 'react';
import { computeAttributes } from '../../engine/attributes';
import { relampagoBracket } from '../../engine/bracket';
import { cupRival } from '../../engine/cup';
import { species } from '../../engine/data';
import { FORMATIONS, type FormationId, hasEdge } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { pickCornerTaker } from '../../engine/match';
import { applyModifiers, attributeModifiers } from '../../engine/modifiers';
import { type CornerPlan, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { clubName, cupStageName, dict, formationText, itemDesc, itemName, rivalLabel, tn } from '../../i18n';
import { useT } from '../../i18n/react';
import { liveOf, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { cupLength, isFinalStage, isLong, isOut, type OutWhy, outOf } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { Coach } from '../coach/Coach';
import { Bracket, bracketRivals, bracketYou } from '../components/Bracket';
import { Fold, foldOpenByDefault } from '../components/Fold';
import { FormationBoard } from '../components/FormationBoard';
import { EdgeMark, FormationIdentity } from '../components/FormationIdentity';
import { FutCard } from '../components/FutCard';
import { LinkChips } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { cardSprite, TypeBadge } from '../components/PokeCard';
import { useMedia, WIDE } from '../components/Prancheta';
import { Money, SponsorSlots } from '../components/SponsorCard';
import { leaveWith } from '../feedback';
import { edgeAgainst, FORMATION_ICON } from '../formation-info';
import { useFirstCup } from '../help/Tip';
import { ConfirmSheet, Sheet } from '../kit/Sheet';
import '../vestiario.css';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
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
    const [boardOpen, setBoardOpen] = useState(false);
    const [rivalOpen, setRivalOpen] = useState(false);
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
            {/* 1ª escalação da Relâmpago: trocar tocando em dois, e o que a lousa abre (a dica antiga saiu) */}
            <Coach
                id="relampagoVestiario"
                targets={['.vt-wall']}
                when={!run.daily && !isLong(run) && run.stage === 0 && !locked}
            />
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
                wall={
                    <>
                        <button
                            type="button"
                            className="vt-obj vt-rival"
                            aria-haspopup="dialog"
                            onClick={() => setRivalOpen(true)}
                        >
                            <span>
                                <b>
                                    {t('team.lineup.vsRival', {
                                        club: rivalLabel(opponent.name, lang),
                                        n: lineupAverage(opponent.lineup, opponent.formation),
                                    })}
                                </b>
                            </span>
                        </button>
                        {/* a chave (Relâmpago) ou a copa (Rota), e o Abandonar lá dentro */}
                        <button
                            type="button"
                            className="vt-obj vt-cork"
                            aria-haspopup="dialog"
                            onClick={() => setBoardOpen(true)}
                        >
                            <HudIcon kind="cup" />
                            <span>
                                <b>{isLong(run) ? t('team.lineup.cupObj') : d.bracket.title}</b>
                                <small>
                                    {run.stage + 1}/{cupLength(run)}
                                </small>
                            </span>
                        </button>
                    </>
                }
                side={
                    <div className="vt-door">
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
                                <i className="cb-shine" aria-hidden />
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
            />
            <Sheet
                open={rivalOpen}
                onClose={() => setRivalOpen(false)}
                title={clubName(opponent.name, lang)}
                className="vt-board-sheet"
            >
                <div className="opponent-strip">
                    {opponent.lineup.map((p) => (
                        <button
                            key={p.uid}
                            type="button"
                            className="scout-btn"
                            onClick={() =>
                                openCard(p, {
                                    note: t('team.lineup.opponentNote', { name: clubName(opponent.name, lang) }),
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
                        {rivalLabel(opponent.name, lang)} → {formationText(opponent.formation ?? '1-2-1', lang).name}
                    </span>
                    {edgeAgainst(opponent.formation ?? '1-2-1') && (
                        <span className="fi-rival-edge">
                            <EdgeMark />
                            {formationText(edgeAgainst(opponent.formation ?? '1-2-1')!, lang).name}
                        </span>
                    )}
                </p>
                <p className="muted">
                    {t('team.lineup.oppTactic', {
                        tactic: d.common.tactic[opponent.tactic],
                        n: lineupAverage(opponent.lineup, opponent.formation),
                    })}
                </p>
            </Sheet>
            <Sheet
                open={boardOpen}
                onClose={() => setBoardOpen(false)}
                title={isLong(run) ? t('team.lineup.cupObj') : d.bracket.title}
                className="vt-board-sheet"
            >
                {/* Copa Relâmpago: as 4 fases e a chave inteira (na Rota o caminho é o mapa) */}
                {!isLong(run) && (
                    <>
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
                        <div className="vt-bracket">
                            <Bracket
                                rounds={relampagoBracket(
                                    run.seed,
                                    bracketYou(run.teamName, clubColor, run.picks, run.captainUid),
                                    bracketRivals(run.opponents),
                                    run.results,
                                )}
                                current={run.stage}
                            />
                        </div>
                    </>
                )}
                {isLong(run) && <p>{cupStageName(run, run.stage, lang)}</p>}
                <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => {
                        setBoardOpen(false);
                        setAskAbandon(true);
                    }}
                >
                    {t('team.lineup.abandon')}
                </button>
            </Sheet>
            <ConfirmSheet
                open={askAbandon}
                onClose={() => setAskAbandon(false)}
                title={t('team.lineup.abandonTitle')}
                text={t('team.lineup.abandonText', { team: run.teamName })}
                confirm={t('team.lineup.abandon')}
                onConfirm={() => leaveWith('leave', abandonRun)}
                quiet
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
    wall,
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
    /** Objeto a mais na parede do vestiário, à esquerda do quadro da tática (a chave, na copa). */
    wall?: ReactNode;
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
    // celular: a carta abre numa sheet (na coluna de baixo ficava fora da tela); no desktop fica na coluna da direita
    const wide = useMedia(WIDE);
    const [cardOpen, setCardOpen] = useState(false);
    /** Passando o item: quem tem o item que vai pra outro (o próximo toque na prancheta decide quem recebe). */
    const [giving, setGiving] = useState<string | null>(null);
    const givingItem = giving ? byUid.get(giving)?.item : undefined;
    const boardRef = useRef<HTMLDivElement>(null);
    const [tacticOpen, setTacticOpen] = useState(false);
    const [formationOpen, setFormationOpen] = useState(false);
    const firstCup = useFirstCup();
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
        } else if (!wide) {
            // tocar de novo no mesmo (que antes só desmarcava) abre a carta; a troca continua sendo dois toques em vagas diferentes
            setCardOpen(true);
        }
        setSelected(null);
    };

    const detailCard = detailInst && (
        <div className="detail-card">
            <FutCard
                inst={detailInst}
                captain={detailInst.uid === captainUid}
                position={positionOf(detailInst.uid)}
                fullButton
            />
        </div>
    );
    const itemMove = detailInst?.item && onMoveItem && (
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
                    setCardOpen(false);
                    setGiving(giving === detailInst.uid ? null : detailInst.uid);
                    // no celular a prancheta fica lá em cima: traz ela pra tela
                    boardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }}
            >
                {giving === detailInst.uid ? t('team.lineup.giveCancel') : t('team.lineup.giveTo')}
            </button>
        </div>
    );

    return (
        <div className="lineup-grid vt">
            <div className="vt-room" ref={boardRef}>
                {/* a parede de armários com os quadros: a chave (na copa) e a tática, cada um abre a sua sheet */}
                <div className="vt-wall">
                    {wall}
                    <button
                        type="button"
                        className="vt-obj vt-white"
                        aria-haspopup="dialog"
                        onClick={() => setTacticOpen(true)}
                    >
                        <HudIcon kind={tactic} />
                        <span>
                            <b>{t('team.lineup.tactic')}</b>
                            <small>{d.common.tactic[tactic]}</small>
                        </span>
                    </button>
                    <button
                        type="button"
                        className="vt-obj vt-formation"
                        aria-haspopup="dialog"
                        onClick={() => setFormationOpen(true)}
                    >
                        <span>
                            <b>
                                {formationText(formation, lang).name} <HudIcon kind="down" className="vt-caret" />
                            </b>
                            <FormationIdentity
                                id={formation}
                                edge={!!rivalFormation && hasEdge(formation, rivalFormation)}
                            />
                        </span>
                    </button>
                </div>
                <section className="panel vt-board" aria-label={title}>
                    {!wide && !giving && selected && detailInst && (
                        <button type="button" className="vt-cardchip" onClick={() => setCardOpen(true)}>
                            {t('team.lineup.cardChip')}
                        </button>
                    )}
                    {captainBenched && <p className="error-text">{t('team.lineup.captainBenched')}</p>}
                    {(givingItem || firstCup) && (
                        <p className={`muted vt-hint${givingItem ? '' : ' vt-swaphint'}`}>
                            {givingItem
                                ? t('team.lineup.giveHint', { item: itemName(givingItem) })
                                : t('team.lineup.swapHint')}
                        </p>
                    )}
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
                            firstCup && (
                                <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                                    {t('team.lineup.subHint')}
                                </p>
                            )
                        }
                    />
                </section>
            </div>

            <div className="side-stack">
                {side}

                {wide && detailInst && (detail !== null || foldOpenByDefault()) && (
                    <>
                        <Fold
                            label={viewInstance(detailInst).displayName}
                            summary={t('team.lineup.cardFold')}
                            defaultOpen
                        >
                            {detailCard}
                        </Fold>
                        {itemMove}
                    </>
                )}

                {footer}
            </div>

            {!wide && detailInst && (
                <Sheet
                    open={cardOpen}
                    onClose={() => setCardOpen(false)}
                    title={viewInstance(detailInst).displayName}
                    className="vt-card-sheet"
                >
                    {detailCard}
                    {itemMove}
                </Sheet>
            )}
            <Sheet
                open={formationOpen}
                onClose={() => setFormationOpen(false)}
                title={t('team.lineup.formation')}
                className="vt-formation-sheet"
            >
                <div className="vt-formations">
                    {Object.values(FORMATIONS).map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className={`bc-tile${formation === f.id ? ' on' : ''}`}
                            aria-pressed={formation === f.id}
                            disabled={locked}
                            onClick={() => {
                                onFormation(f.id);
                                setFormationOpen(false);
                            }}
                        >
                            <HudIcon kind={FORMATION_ICON[f.id]} />
                            <span>
                                <b>{formationText(f.id, lang).name}</b>
                                <FormationIdentity id={f.id} edge={!!rivalFormation && hasEdge(f.id, rivalFormation)} />
                            </span>
                        </button>
                    ))}
                </div>
            </Sheet>
            <Sheet
                open={tacticOpen}
                onClose={() => setTacticOpen(false)}
                title={t('team.lineup.tactic')}
                className="vt-tactic-sheet"
            >
                <section>
                    <h3>{t('match.coach.style')}</h3>
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
                </section>
                <section>
                    <h3>{t('team.lineup.corner')}</h3>
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
                </section>
                <section>
                    <label className="corner-taker">
                        <h3>{t('team.lineup.cornerTaker')}</h3>
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
                </section>
                <section>
                    <h3>
                        {t('team.lineup.typeSynergies')} · {synergies.length}
                    </h3>
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
                </section>
                <section>
                    <h3>
                        {t('team.lineup.storySynergies')} · {links.length}
                    </h3>
                    {links.length === 0 ? (
                        <p className="tactic-desc">{t('team.lineup.storySynEmpty')}</p>
                    ) : (
                        <div className="row" style={{ gap: 6 }}>
                            <LinkChips links={links} />
                        </div>
                    )}
                </section>
            </Sheet>
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
