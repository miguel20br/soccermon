import { type ReactNode, useRef, useState } from 'react';
import { relampagoBracket } from '../../engine/bracket';
import { cupRival } from '../../engine/cup';
import { FORMATIONS, type FormationId, hasEdge } from '../../engine/formations';
import { instanceBase, type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { pickCornerTaker } from '../../engine/match';
import { applyModifiers, attributeModifiers } from '../../engine/modifiers';
import { type CornerPlan, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { clubName, cupStageName, dict, formationText, itemDesc, itemName, rivalLabel, tn } from '../../i18n';
import { useT } from '../../i18n/react';
import { lookOfCupClub } from '../../store/club-kit';
import { liveOf, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { cupLength, isFinalStage, isLong, isOut, type OutWhy, outOf } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { Coach } from '../coach/Coach';
import { Bracket, bracketRivals, bracketYou } from '../components/Bracket';
import { Fold, foldOpenByDefault } from '../components/Fold';
import { FormationBoard } from '../components/FormationBoard';
import { FormationDiagram } from '../components/FormationCarousel';
import { EdgeMark, FormationIdentity } from '../components/FormationIdentity';
import { FutCard } from '../components/FutCard';
import { LinkChips, SynergyChip } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { useMedia, WIDE } from '../components/Prancheta';

import { Money, SponsorSlots } from '../components/SponsorCard';
import { leaveWith } from '../feedback';
import { edgeAgainst } from '../formation-info';
import { useFirstCup } from '../help/Tip';
import { SheetRow, Stepper } from '../kit/controls';
import { ConfirmSheet, Sheet } from '../kit/Sheet';
import '../vestiario.css';
import { Crest } from '../profile/Crest';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
import { simulateMatch } from '../sim-client';
import { useHeld } from '../use-held';

/** Celular deitado (a mesma consulta do vestiario.css). */
const DEITADO = '(orientation: landscape) and (max-height: 520px)';

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
        setCaptain,
        setMatch,
        go,
        abandonRun,
        lockMatch,
    } = useGame();
    const run = useHeld(live);
    const [error, setError] = useState<string | null>(null);
    const [askAbandon, setAskAbandon] = useState(false);
    const [boardOpen, setBoardOpen] = useState(false);
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
                onCaptain={setCaptain}
                sponsors={run.sponsors}
                rivalFormation={opponent.formation ?? '1-2-1'}
                outOf={(u) => outOf(run, u)}
                wall={
                    // o cartaz do rival na parede: escudo, nome, média e os 5 dele; abre a chave (com o rival e o Abandonar)
                    <button
                        type="button"
                        className="vt-obj vt-rival"
                        aria-haspopup="dialog"
                        onClick={() => setBoardOpen(true)}
                    >
                        <Crest look={lookOfCupClub(opponent.name, opponent.color)} className="crest vt-crest" />
                        <span className="vt-rival-txt">
                            <b>{t('team.lineup.vsClub', { club: rivalLabel(opponent.name, lang) })}</b>
                            <small>
                                {t('team.lineup.avg', { n: lineupAverage(opponent.lineup, opponent.formation) })}
                            </small>
                        </span>
                        <span className="vt-rival-mons" aria-hidden>
                            {opponent.lineup.map((p) => (
                                <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                            ))}
                        </span>
                        <span className="vt-rival-stage">
                            <HudIcon kind="cup" />
                            {run.stage + 1}/{cupLength(run)}
                        </span>
                    </button>
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
                                    {t('shop.sponsors')}
                                    {isLong(run) && (
                                        <>
                                            {' · '}
                                            <Money n={run.money ?? 0} />
                                        </>
                                    )}
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
                open={boardOpen}
                onClose={() => setBoardOpen(false)}
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
                <h3 className="vt-sheet-h">
                    {isLong(run) ? t('team.lineup.cupObj') : d.bracket.title} · {run.stage + 1}/{cupLength(run)}
                </h3>
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
    onCaptain,
    onSlotTap,
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
    /** Só na copa: outro titular vira capitão (entre as partidas; no duelo o capitão vem do draft). */
    onCaptain?: (uid: string) => void;
    /** Time Ultimate: tocar numa vaga abre a troca por posição (no lugar de tocar em duas vagas). */
    onSlotTap?: (ref: SlotRef, uid: string) => void;
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
    // deitado (celular de lado): a quadra deita também; em pé, as 5 vagas não cabiam na altura e se sobrepunham
    const deitado = useMedia(DEITADO);
    const [cardOpen, setCardOpen] = useState(false);
    /** Passando o item: quem tem o item que vai pra outro (o próximo toque na prancheta decide quem recebe). */
    const [giving, setGiving] = useState<string | null>(null);
    const givingItem = giving ? byUid.get(giving)?.item : undefined;
    const boardRef = useRef<HTMLDivElement>(null);
    const firstCup = useFirstCup();
    const { t, d, lang } = useT();
    const picks = [...lineup, ...bench].flatMap((u) => byUid.get(u) ?? []);
    const detailInst = byUid.get(detail ?? lineup[0]) ?? picks[0];
    const benchNow = bench.flatMap((u) => byUid.get(u) ?? []);
    const synergies = computeSynergies(
        lineup.map((u) => byUid.get(u)!),
        benchNow,
    );
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
            const mods = attributeModifiers(inst, {
                lineup: lineupNow,
                rest: benchNow,
                captain: captainNow,
                role,
                sponsors,
            });
            const passing = applyModifiers(instanceBase(inst), mods, role).passing;
            return { inst, role, passing };
        })
        .filter((f) => f.role !== 'GK');
    const autoTaker = pickCornerTaker(cornerField)?.inst;
    const chosenTaker = cornerTakerUid ? byUid.get(cornerTakerUid) : undefined;
    const takerOff = !!chosenTaker && !cornerField.some((f) => f.inst.uid === chosenTaker.uid);
    const captainBenched = !!captainUid && bench.includes(captainUid);
    // o resumo da bola parada: quem cobra (o escolhido ou o automático)
    const taker = chosenTaker && !takerOff ? chosenTaker : autoTaker;
    const takerName = taker ? viewInstance(taker).displayName : undefined;

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
        if (onSlotTap) {
            onSlotTap(ref, uid);
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
                {/* a parede: o cartaz do rival (na copa); tática e formação ficam abertas no painel ao lado/embaixo */}
                {wall && <div className="vt-wall">{wall}</div>}
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
                        horizontal={deitado}
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

                {/* tática, formação e bola parada: 3 linhas-resumo que abrem a escolha numa sheet (revisão de telas,
                    item 21: ajuste raro fecha); o capitão fica à vista, é a escolha de toda partida */}
                <section className="panel vt-plan" aria-label={t('team.lineup.tactic')}>
                    <SheetRow
                        className="vt-row"
                        icon={tactic}
                        label={`${t('team.lineup.tactic')}: ${d.common.tactic[tactic]}`}
                        title={t('match.coach.style')}
                    >
                        <div className="vt-pick">
                            <div className="vt-grid vt-tactics">
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
                            <p className="tactic-desc vt-fade" key={tactic}>
                                {d.team.lineup.tacticDesc[tactic]} {t('team.lineup.canChange')}
                            </p>
                        </div>
                    </SheetRow>
                    <SheetRow
                        className="vt-row"
                        icon={<FormationDiagram id={formation} />}
                        label={`${t('team.lineup.formation')}: ${formationText(formation, lang).name}`}
                        hint={!!rivalFormation && hasEdge(formation, rivalFormation) && <EdgeMark />}
                        title={t('team.lineup.formation')}
                    >
                        <div className="vt-pick">
                            <div className="vt-grid vt-formations">
                                {(Object.keys(FORMATIONS) as FormationId[]).map((id) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`bc-tile${formation === id ? ' on' : ''}`}
                                        aria-pressed={formation === id}
                                        disabled={locked}
                                        title={formationText(id, lang).description}
                                        onClick={() => onFormation(id)}
                                    >
                                        <FormationDiagram id={id} />
                                        <span>
                                            <b>{formationText(id, lang).name}</b>
                                            <FormationIdentity
                                                id={id}
                                                edge={!!rivalFormation && hasEdge(id, rivalFormation)}
                                            />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </SheetRow>
                    <SheetRow
                        className="vt-row"
                        icon="flag"
                        label={`${t('team.lineup.setPiece')}: ${d.common.cornerPlan[cornerPlan]}`}
                        hint={takerName}
                        title={t('team.lineup.setPiece')}
                    >
                        <div className="vt-pick">
                            <h3 className="bc-lbl">{t('team.lineup.corner')}</h3>
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
                            <p className="tactic-desc vt-fade" key={cornerPlan}>
                                {d.team.lineup.cornerDesc[cornerPlan]}
                            </p>
                            <div className="corner-taker">
                                <h3>{t('team.lineup.cornerTaker')}</h3>
                                <Stepper
                                    label={t('team.lineup.cornerTaker')}
                                    value={cornerTakerUid ?? ''}
                                    disabled={locked}
                                    wrap
                                    options={[
                                        {
                                            value: '',
                                            label: t('team.lineup.cornerAuto', {
                                                name: autoTaker ? viewInstance(autoTaker).displayName : '?',
                                            }),
                                        },
                                        ...cornerField.map((f) => ({
                                            value: f.inst.uid,
                                            label: t('team.lineup.cornerTakerOpt', {
                                                name: viewInstance(f.inst).displayName,
                                                pos: d.common.pos[f.role],
                                                n: Math.round(f.passing),
                                            }),
                                        })),
                                        ...(chosenTaker && takerOff
                                            ? [{ value: chosenTaker.uid, label: viewInstance(chosenTaker).displayName }]
                                            : []),
                                    ]}
                                    onChange={(uid) => onCorner({ cornerTakerUid: uid || null })}
                                />
                            </div>
                            {chosenTaker && takerOff && (
                                <p className="tactic-desc">
                                    {t('team.lineup.cornerTakerOff', { name: viewInstance(chosenTaker).displayName })}
                                </p>
                            )}
                        </div>
                    </SheetRow>
                </section>

                {/* capitão (à vista: escolha de toda partida) e as sinergias, logo embaixo das linhas-resumo. Sem os dois
                    (o Duelo sem sinergia), o painel não aparece: ficava uma caixa vazia no PC */}
                {(onCaptain || synergies.length + links.length > 0) && (
                    <section className="panel vt-team">
                        {onCaptain && (
                            <section>
                                <h3 className="bc-lbl">{t('team.lineup.captain')}</h3>
                                <div className="vt-captains">
                                    {lineupNow.map((inst, i) => (
                                        <button
                                            key={inst.uid}
                                            type="button"
                                            className={`bc-tile${inst.uid === captainUid ? ' on' : ''}`}
                                            aria-pressed={inst.uid === captainUid}
                                            disabled={locked}
                                            onClick={() => onCaptain(inst.uid)}
                                        >
                                            <img className="pixel" src={cardSprite(inst)} alt="" />
                                            <span>
                                                <b>{viewInstance(inst).displayName}</b>
                                                <small>{d.common.pos[slotsNow[i]]}</small>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="tactic-desc">{t('team.lineup.captainDesc')}</p>
                            </section>
                        )}
                        {/* sinergias de tipo (o selo do monotipo incluso) e de história numa linha de chips; sem
                        nenhuma, a seção some */}
                        {synergies.length + links.length > 0 && (
                            <section>
                                <h3 className="bc-lbl">{t('team.lineup.synergies')}</h3>
                                <div className="row vt-syn">
                                    {synergies.map((s) => (
                                        <SynergyChip key={s.type} s={s} />
                                    ))}
                                    <LinkChips links={links} />
                                </div>
                            </section>
                        )}
                    </section>
                )}

                <div className="vt-aside">
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
                </div>

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
