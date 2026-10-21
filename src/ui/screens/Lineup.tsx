import { type ReactNode, useRef, useState } from 'react';
import { computeAttributes } from '../../engine/attributes';
import { relampagoBracket } from '../../engine/bracket';
import { cupRival } from '../../engine/cup';
import { species } from '../../engine/data';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { pickCornerTaker } from '../../engine/match';
import { applyModifiers, attributeModifiers } from '../../engine/modifiers';
import { type CornerPlan, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { clubName, cupStageName, dict, formationText, itemDesc, itemName } from '../../i18n';
import { useT } from '../../i18n/react';
import { liveOf, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { isLong, isOut } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { Bracket } from '../components/Bracket';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { LinkChips } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { cardSprite, TypeBadge } from '../components/PokeCard';
import { Money, SponsorSlots } from '../components/SponsorCard';
import { Tip } from '../help/Tip';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
import { agencyOn } from '../settings-sync';
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
    // Copa longa: quem está fora (lesão, Creche) fica no banco; titular fora trava o Jogar até você trocar
    const outName = (u: string) => `${viewInstance(byUid.get(u)!).displayName} (${run.out?.[u]})`;
    const outList = [...run.lineup, ...run.bench].filter((u) => isOut(run, u)).map(outName);
    const outStarter = run.lineup.filter((u) => isOut(run, u)).map(outName)[0];
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
            const result = await simulateMatch(team, cupRival(opponent, agencyOn()), `${seed}-stage-${stage}`, orders);
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
            <Tip id="lineup-synergy">{t('team.lineup.tip')}</Tip>
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

            {/* Copa Relâmpago: a chave inteira, com você na fase de agora */}
            {!isLong(run) && (
                <Bracket
                    rounds={relampagoBracket(
                        run.seed,
                        { name: run.teamName, color: clubColor },
                        run.opponents,
                        run.results,
                    )}
                    current={run.stage}
                />
            )}
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
                        <p className="muted" style={{ fontSize: 11 }}>
                            {t('team.lineup.oppLine', {
                                formation: formationText(opponent.formation ?? '1-2-1', lang).name,
                                tactic: d.common.tactic[opponent.tactic],
                                n: lineupAverage(opponent.lineup, opponent.formation),
                            })}
                        </p>
                        {outList.length > 0 && (
                            <p className={outStarter ? 'error-text' : 'tactic-desc'}>
                                {outStarter
                                    ? t('longCup.outStarter', { name: outStarter })
                                    : t('longCup.outBench', { names: outList.join(', ') })}
                            </p>
                        )}
                        <div className="bc-thumbbar">
                            <button
                                type="button"
                                className="btn primary wide"
                                onClick={play}
                                disabled={loading || !!outStarter}
                            >
                                {loading
                                    ? t('team.lineup.warming')
                                    : locked
                                      ? t('team.lineup.backToMatch')
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
                        <div className="abandon-ask" role="alert">
                            <span>{t('team.lineup.abandonConfirm')}</span>
                            <button type="button" className="btn small danger" onClick={abandonRun}>
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
                playSfx('select');
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
            playSfx('select');
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
                            {formationText(f.id, lang).name}
                        </button>
                    ))}
                </div>
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
                        giving
                            ? uid === giving
                                ? 'selected'
                                : 'target'
                            : selected?.zone === ref.zone && selected.index === ref.index
                              ? 'selected'
                              : 'idle'
                    }
                    onSlot={onSlot}
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
                    <span className="bc-lbl">{t('match.coach.style')}</span>
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
                    {captainBenched && <p className="error-text">{t('team.lineup.captainBenched')}</p>}
                    <h3 className="bc-lbl">
                        <HudIcon kind="flag" />
                        {t('team.lineup.corner')}
                    </h3>
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
                    <h3 className="bc-lbl">{t('team.lineup.typeSynergies')}</h3>
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
                    <h3 className="bc-lbl">{t('team.lineup.storySynergies')}</h3>
                    {links.length === 0 ? (
                        <p className="tactic-desc">{t('team.lineup.storySynEmpty')}</p>
                    ) : (
                        <div className="row" style={{ gap: 6 }}>
                            <LinkChips links={links} />
                        </div>
                    )}
                </div>

                {detailInst && (
                    <>
                        <div className="detail-card">
                            <FutCard
                                inst={detailInst}
                                captain={detailInst.uid === captainUid}
                                position={positionOf(detailInst.uid)}
                                fullButton
                            />
                        </div>
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
