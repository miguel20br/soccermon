import { type CSSProperties, useEffect, useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { countSpecials, type SpecialLimit, teamRecipe, validarTimeDuelo } from '../../engine/duel-validate';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { TeamSetup } from '../../engine/state';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    applyBuys,
    bothSealed,
    captainSwapOk,
    DUEL_ROUNDS,
    DUEL_SHOP_MONEY,
    other,
    type PreviewCfg,
    packOptions,
    type Role,
    type Shared,
    shopOf,
    specialLimitOf,
    teamProblems,
    utRecipe,
} from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { isDraftComplete, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { clubColorHex, type HallEntry } from '../../store/profile';
import { canPlay, homeTeam } from '../../store/ultimate/ultimate';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { lineupAverage } from '../rating';
import { DraftTeam } from '../screens/Draft';
import { LineupEditor } from '../screens/Lineup';
import { OfferCard } from '../screens/Shop';
import '../draft.css';
import { seriesLabel, useCountdown } from './DuelMatch';
import { ReadyBar } from './ReadyBar';

const avgOf = (t: TeamSetup) => lineupAverage(t.lineup, t.formation);

/** Time do Hall da Fama de volta pro campo: as espécies e a escalação do título (o Hall guarda só isso). */
export function hallTeam(h: HallEntry): TeamSetup {
    const rng = new Rng(h.id, 'duelo-hall');
    const insts = h.squad.map((p) => ({ ...createInstance(p.speciesId, rng), shiny: p.shiny }));
    const cap = h.squad.findIndex((p) => p.captain);
    return {
        name: h.club,
        lineup: insts.slice(0, 5),
        bench: insts.slice(5),
        tactic: 'balanced',
        color: clubColorHex(h.clubColor),
        formation: (FORMATIONS[h.formation as FormationId] ? h.formation : '1-2-1') as FormationId,
        captainUid: insts[cap]?.uid ?? null,
        manualSubs: true,
    };
}

/** A regra de cartas especiais da sala, numa linha. */
export function specialRuleText(limit: SpecialLimit, t: ReturnType<typeof useT>['t']): string {
    return t('duel.specials.rule', {
        rule:
            limit === 0 ? t('duel.specials.none') : limit === null ? t('duel.specials.free') : t('duel.specials.upTo3'),
    });
}

/** Fileira de sprites do time (draft e lobby). */
export function SquadStrip({ picks, label }: { picks: PokemonInstance[]; label?: string }) {
    return (
        <div className="duel-strip">
            {label && <span className="muted">{label}</span>}
            <div className="duel-strip-row">
                {Array.from({ length: DRAFT_PICKS }, (_, i) => {
                    const p = picks[i];
                    return p ? (
                        <span key={p.uid} className="duel-strip-mon" title={viewInstance(p).displayName}>
                            <img className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                            <b>{viewInstance(p).overall}</b>
                        </span>
                    ) : (
                        // biome-ignore lint/suspicious/noArrayIndexKey: vagas fixas
                        <span key={i} className="duel-strip-mon empty" />
                    );
                })}
            </div>
        </div>
    );
}

/** Time pronto: a copa atual (com o draft completo) ou um campeão do Hall da Fama. Vai lacrado: os dois abrem juntos. */
export function TeamPick({ s, role }: { s: Shared; role: Role }) {
    const { t, tn } = useT();
    const run = useGame((g) => g.run);
    const hall = useGame((g) => g.hall);
    const color = useGame((g) => clubColorHex(g.profile.clubColor));
    const clubName = useGame((g) => g.profile.clubName);
    const ultimate = useGame((g) => g.ultimate);
    const sealed = useDuel((v) => v.choiceSealed);
    const rival = s.peers[other(role)]?.name ?? '';
    const [chosen, setChosen] = useState<TeamSetup | null>(null);
    const options: { key: string; label: string; team: TeamSetup }[] = [];
    if (s.ut) {
        // sala do Time Ultimate: só o time do UT, do jeito que está escalado lá
        if (canPlay(ultimate))
            options.push({
                key: 'ut',
                label: t('duel.ut.team'),
                team: homeTeam(ultimate, (clubName || 'Pallet FC').slice(0, 30), color),
            });
    } else {
        if (run && isDraftComplete(run) && run.lineup.length)
            options.push({ key: 'run', label: t('duel.team.current'), team: playerTeam(run, color) });
        for (const h of hall)
            options.push({ key: h.id, label: t('duel.team.hall', { n: h.titleNo }), team: hallTeam(h) });
    }
    // escolhido: o time fica à vista com o pronto (e o "Mudar algo" volta pra lista enquanto o rival não escolheu)
    if (sealed || bothSealed(s)) {
        return (
            <div className="panel duel-center">
                <h2>{t('duel.team.chosen')}</h2>
                {chosen && <SquadStrip picks={[...chosen.lineup, ...chosen.bench]} />}
                <ReadyBar
                    mine={sealed}
                    rival={!!s.choice?.seal[other(role)]}
                    rivalName={rival}
                    starting={bothSealed(s)}
                    label=""
                    onReady={() => {}}
                    onUndo={() => duel.unsealChoice()}
                />
            </div>
        );
    }
    return (
        <div className="duel-teams">
            <header className="bc-screenhead">
                <span className="bc-tag">{t('duel.title')}</span>
                <h1>{t('duel.team.title')}</h1>
            </header>
            <p className="muted">{s.ut ? t('duel.ut.rule') : specialRuleText(specialLimitOf(s), t)}</p>
            {s.choice?.seal[other(role)] && (
                <p className="ready-chip on" data-testid="ready-rival">
                    <b>{rival}</b>
                    <span>
                        <i aria-hidden />
                        {t('duel.ready.on')}
                    </span>
                </p>
            )}
            {options.length === 0 && <p className="panel muted">{s.ut ? t('duel.ut.noTeam') : t('duel.team.none')}</p>}
            <div className="duel-team-list">
                {options.map((o) => {
                    // só a receita vai pela rede, e só se for um time que uma copa poderia dar
                    const recipe = s.ut ? utRecipe(o.team) : teamRecipe(o.team);
                    const limit = s.ut ? null : specialLimitOf(s);
                    const problems = s.ut ? teamProblems(s, recipe) : validarTimeDuelo(recipe);
                    const specials = countSpecials(recipe);
                    const tooMany = limit !== null && specials > limit;
                    return (
                        <button
                            key={o.key}
                            type="button"
                            className="panel duel-team-opt"
                            disabled={problems.length > 0 || tooMany}
                            onClick={() => {
                                setChosen(o.team);
                                void duel.chooseTeam(recipe);
                            }}
                        >
                            <span className="dto-head">
                                <b>{o.team.name}</b>
                                <span className="muted">
                                    {o.label} · {t('duel.team.avg', { n: avgOf(o.team) })}
                                </span>
                            </span>
                            <span className="dto-squad">
                                {[...o.team.lineup, ...o.team.bench].map((p) => (
                                    <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                                ))}
                            </span>
                            {tooMany && (
                                <span className="error-text small">
                                    {limit === 0
                                        ? tn('duel.team.noSpecials', specials)
                                        : tn('duel.team.tooManySpecials', specials, { max: limit })}
                                </span>
                            )}
                            {problems.length > 0 && <span className="error-text small">{t('duel.team.invalid')}</span>}
                        </button>
                    );
                })}
            </div>
            {hall.length > 0 && !s.ut && <p className="muted small">{t('duel.team.hallNote')}</p>}
        </div>
    );
}

/** Vaga da quadra (losango 1-2-1) de cada rodada: Goleiro, Fixo, Ala, Ala e Pivô; capitão e reserva no banco. */
function boardOf(picks: PokemonInstance[]) {
    const lineup = [1, 2, 3, 4, 5].map((r) => picks[r]?.uid ?? '');
    const bench = [0, 6].map((r) => picks[r]?.uid ?? '');
    return { lineup, bench };
}
const slotOfRound = (round: number): SlotRef =>
    round >= 1 && round <= 5 ? { zone: 'lineup', index: round - 1 } : { zone: 'bench', index: round === 0 ? 0 : 1 };

/**
 * Draft do duelo, no palco do draft da copa (cara-de-jogo.md): as cartas 1 de 3 sem rolar, o time em miniatura em
 * cima (tocar abre a quadra numa sheet) e a vez/cronômetro no polegar. Os dois andam rodada a rodada. A rodada abre
 * quando os dois abrem o segredo dela (a seed dos pacotes sai daí). Disputa: 4 cartas abertas, um tira e o outro
 * tira (as 2 que sobram queimam). Cada um com seus pacotes: 3 cartas pra cada, a escolha vai lacrada e só abre no fim.
 */
export function DuelDraft({ s, role }: { s: Shared; role: Role }) {
    const { t, d } = useT();
    const draft = s.draft!;
    const rivalRole = other(role);
    const rival = s.peers[rivalRole]?.name ?? '';
    const packPicks = useDuel((v) => v.packPicks);
    const [view, setView] = useState<Role>(role);
    const [teamOpen, setTeamOpen] = useState(false);
    const disputa = s.mode === 'disputa';
    const round = Math.min(draft.round, DRAFT_PICKS - 1);
    const seed = draft.seeds[draft.round];
    const open = draft.round < DRAFT_PICKS && !!seed;
    const mine = disputa ? draft.picks[role] : packPicks;
    const sealedNow = !disputa && !!draft.seals[role][draft.round];
    const myTurn = open && (disputa ? draft.turn === role : !sealedNow && packPicks.length === draft.round);
    const options = !open
        ? []
        : disputa
          ? draft.options
          : myTurn
            ? packOptions(seed, draft.round, packPicks, role)
            : [];
    const left = useCountdown(open ? draft.deadline[disputa ? (draft.turn ?? role) : role] : undefined);
    const need = DUEL_ROUNDS[round];
    const slotLabel =
        round === 0 ? t('duel.draft.captain') : need === 'ANY' ? t('duel.draft.bench') : d.common.pos[need];
    const rivalPicks = draft.picks[rivalRole];
    const rivalCount = disputa ? rivalPicks.length : draft.seals[rivalRole].filter(Boolean).length;
    // Disputa: o que o rival tirou nesta rodada e o que queimou na anterior
    const rivalTook = disputa && rivalPicks.length > round ? rivalPicks[round] : null;
    const burned = disputa && round > 0 ? draft.burned.slice(-2) : [];
    const target = slotOfRound(round);
    const stateOf = (ref: SlotRef, uid: string) =>
        !uid && open && ref.zone === target.zone && ref.index === target.index
            ? ('selected' as const)
            : ('locked' as const);
    const myBoard = boardOf(mine);
    // a sheet mostra o seu time ou (na Disputa) o do rival
    const shown = view === role || !disputa ? mine : rivalPicks;
    const board = boardOf(shown);

    const title = !open
        ? draft.round >= DRAFT_PICKS
            ? t('duel.draft.opening')
            : t('duel.draft.openingRound')
        : disputa
          ? myTurn
              ? t('duel.draft.yourTurn', { pos: slotLabel })
              : t('duel.draft.rivalTurn', { name: rival })
          : sealedNow
            ? t('duel.draft.sealedWait', { name: rival })
            : t('duel.draft.choose', { pos: slotLabel });
    // a vez e o relógio, perto do polegar
    const status =
        open && myTurn
            ? t('duel.draft.yourClock', { s: left })
            : open && disputa
              ? t('duel.draft.rivalPicking', { name: rival, s: left })
              : t('duel.draft.progress', { name: rival, n: rivalCount });

    // a 1ª escolha é o capitão e cai na 1ª vaga do banco: ela diz "Capitão", não "Banco"
    const benchLabels = [t('duel.draft.captain'), t('common.ui.bench')];

    return (
        <>
            <Stage className="draft-stage pick-stage duel-draft-stage" scene={<i className="k-stage-light" />}>
                <div className="draft-head bc-screenhead">
                    <span className="bc-tag">
                        {t('duel.draft.round', { n: round + 1 })} · {slotLabel}
                    </span>
                    <div className="draft-title">
                        <h1>{title}</h1>
                        <p className="muted">{disputa ? t('duel.draft.burn') : t('duel.draft.hidden')}</p>
                    </div>
                    <div className="duel-draft-clock">
                        <div className="steps" role="img" aria-label={t('team.draft.progress')}>
                            {Array.from({ length: DRAFT_PICKS }, (_, i) => (
                                <span
                                    // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                                    key={i}
                                    className={i < draft.round ? 'done' : i === draft.round ? 'now' : ''}
                                />
                            ))}
                        </div>
                        <div
                            className={`duel-timer${open && left <= 5 ? ' low' : ''}`}
                            data-testid="duel-timer"
                            title={t('duel.draft.timeout')}
                        >
                            {open ? left : '…'}
                        </div>
                    </div>
                </div>

                <div className="draft-pick" key={draft.round}>
                    {/* o time (a prancheta, ou a faixa no celular em pé): mostra onde a carta cai; tocar abre a quadra */}
                    <DraftTeam
                        run={{ formation: '1-2-1', ...myBoard }}
                        byUid={new Map(mine.map((p) => [p.uid, p]))}
                        stateOf={stateOf}
                        benchLabels={benchLabels}
                        label={t('duel.draft.yourTeam')}
                        onOpen={() => {
                            setView(role);
                            setTeamOpen(true);
                        }}
                    />
                    {(rivalTook || burned.length > 0) && (
                        <div className="duel-draft-news">
                            {rivalTook ? (
                                <span>
                                    <img className="pixel" src={cardSprite(rivalTook)} alt="" />
                                    {t('duel.draft.rivalTook', {
                                        name: rival,
                                        mon: viewInstance(rivalTook).displayName,
                                    })}
                                </span>
                            ) : (
                                <span>
                                    {burned.map((id) => (
                                        <img
                                            key={id}
                                            className="pixel burned"
                                            src={cardSprite({ speciesId: id, shiny: false })}
                                            alt=""
                                        />
                                    ))}
                                    {t('duel.draft.burnedLast')}
                                </span>
                            )}
                        </div>
                    )}
                    {options.length > 0 ? (
                        <CardPack
                            compact
                            look={packLookOf(options)}
                            label={slotLabel}
                            revealKey={`${s.game}-${draft.round}-${disputa ? 'd' : role}`}
                        >
                            <div className="k-pick3 draft-pick3" style={{ '--k-n': options.length } as CSSProperties}>
                                {options.map((o) => (
                                    <div
                                        key={o.uid}
                                        className={`option cpack-card${isBigCard(o) ? ' big' : ''}${myTurn ? '' : ' duel-locked'}`}
                                    >
                                        <FutCard
                                            inst={o}
                                            captain={round === 0}
                                            position={need === 'ANY' ? undefined : need}
                                            action={
                                                myTurn
                                                    ? {
                                                          label: disputa
                                                              ? t('duel.draft.take')
                                                              : round === 0
                                                                ? t('team.draft.chooseThis')
                                                                : t('team.draft.signAs', { pos: slotLabel }),
                                                          primary: true,
                                                          onClick: () => {
                                                              if (disputa) duel.dispatch({ k: 'pick', uid: o.uid });
                                                              else void duel.packPick(o.uid);
                                                          },
                                                      }
                                                    : undefined
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardPack>
                    ) : (
                        <div className="panel duel-center">
                            <span className="duel-spinner" aria-hidden />
                            <p className="muted">
                                {sealedNow ? t('duel.draft.sealedWait', { name: rival }) : t('duel.draft.openingRound')}
                            </p>
                        </div>
                    )}
                </div>
            </Stage>

            <Sheet
                open={teamOpen}
                onClose={() => setTeamOpen(false)}
                title={
                    view === role || !disputa
                        ? (s.peers[role]?.clubName ?? t('duel.draft.yourTeam'))
                        : (s.peers[rivalRole]?.clubName ?? t('duel.draft.rivalTeam', { name: rival }))
                }
                className="draft-team-sheet"
            >
                {disputa && (
                    <div className="tp-tabs duel-board-tabs" role="tablist">
                        {([role, rivalRole] as Role[]).map((r) => (
                            <button
                                key={r}
                                type="button"
                                role="tab"
                                aria-selected={view === r}
                                className={`tp-tab${view === r ? ' active' : ''}`}
                                onClick={() => setView(r)}
                            >
                                {r === role ? t('duel.draft.yourTeam') : t('duel.draft.rivalTeam', { name: rival })}
                            </button>
                        ))}
                    </div>
                )}
                <FormationBoard
                    formation="1-2-1"
                    lineup={board.lineup}
                    bench={board.bench}
                    byUid={new Map(shown.map((p) => [p.uid, p]))}
                    captainUid={shown[0]?.uid ?? null}
                    benchLabels={benchLabels}
                    emptyLabel={t('duel.draft.empty')}
                    stateOf={stateOf}
                    footer={
                        <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                            {disputa && view !== role
                                ? t('duel.draft.rivalCount', { name: rival, n: rivalCount })
                                : t('duel.draft.boardHint')}
                        </p>
                    }
                />
            </Sheet>

            {/* o polegar: o time inteiro (na Disputa, o do rival também) e de quem é a vez */}
            <div className="bc-thumbbar duel-draft-bar">
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        setView(disputa ? rivalRole : role);
                        setTeamOpen(true);
                    }}
                >
                    <HudIcon kind="players" />
                    {disputa ? t('duel.draft.rivalTeam', { name: rival }) : t('duel.draft.yourTeam')}
                </button>
                <p
                    className={`tb-hint duel-turn-hint${myTurn ? ' mine' : ''}`}
                    role="status"
                    data-testid="duel-rival-progress"
                >
                    {open && disputa && !myTurn && <span className="duel-spinner" aria-hidden />}
                    {status}
                </p>
            </div>
        </>
    );
}

/**
 * Escalação do duelo (30 s, depois do draft ou do time pronto): a mesma tela de escalação da copa, com o time do
 * rival à vista. O que vale vai lacrado: os dois abrem juntos (quem confirma por último não ajusta contra o outro).
 */
export function DuelPreview({ s, role }: { s: Shared; role: Role }) {
    const { t, d, lang } = useT();
    const openCard = useCardModal((v) => v.open);
    const base = s.teams[role]!;
    const rivalRole = other(role);
    const rivalTeam = s.teams[rivalRole]!;
    const rival = s.peers[rivalRole]?.name ?? '';
    const left = useCountdown(s.choice?.until);
    const sealed = useDuel((v) => v.choiceSealed);
    const [cfg, setCfg] = useState<PreviewCfg>(() => ({
        formation: base.formation ?? '1-2-1',
        tactic: base.tactic,
        order: [...base.lineup, ...base.bench].map((p) => p.uid),
        corner: base.corner ?? 'mixed',
        cornerTaker: base.cornerTakerUid ?? null,
    }));
    useEffect(() => {
        duel.previewDraft = cfg;
    }, [cfg]);
    // Mercado entre os jogos (melhor de 3 de draft): o elenco da escalação já é o de depois das compras
    const shop = shopOf(s, role);
    const team = applyBuys(base, shop, cfg.buys) ?? base;
    const all = [...team.lineup, ...team.bench];
    const byUid = new Map(all.map((p) => [p.uid, p]));
    const locked = sealed || bothSealed(s);
    // melhor de 3, do 2º jogo em diante: dá pra trocar o capitão entre os jogos (só entre os titulares, como na copa)
    const canCaptain = captainSwapOk(s);
    const idxOf = (r: SlotRef) => (r.zone === 'lineup' ? r.index : 5 + r.index);
    const swap = (a: SlotRef, b: SlotRef) => {
        const order = [...cfg.order];
        const [i, j] = [idxOf(a), idxOf(b)];
        [order[i], order[j]] = [order[j], order[i]];
        setCfg({ ...cfg, order });
    };
    const rivalAvg = avgOf(rivalTeam);
    return (
        <div className="duel-preview">
            <div className="draft-head bc-screenhead">
                <span className="bc-tag" data-testid="duel-series-tag">
                    {seriesLabel(s, role, t) ?? t('duel.preview.kicker')}
                </span>
                <div className="draft-title">
                    <h1>{t('duel.preview.title')}</h1>
                    <p className="muted">{t('duel.preview.hint')}</p>
                </div>
                <div className={`duel-timer${left <= 5 ? ' low' : ''}`} data-testid="duel-timer">
                    {left}
                </div>
            </div>
            {shop && (
                <DuelShopPanel
                    shop={shop}
                    team={team}
                    captainUid={cfg.captain ?? team.captainUid ?? null}
                    buys={cfg.buys ?? []}
                    locked={locked}
                    onBuy={(offer, uid) => {
                        const o = shop.offers[offer];
                        const swapIn = o.kind === 'pokemon' ? o.inst.uid : null;
                        setCfg({
                            ...cfg,
                            order: swapIn ? cfg.order.map((u) => (u === uid ? swapIn : u)) : cfg.order,
                            cornerTaker: swapIn && cfg.cornerTaker === uid ? null : cfg.cornerTaker,
                            buys: [...(cfg.buys ?? []), { offer, uid }],
                        });
                    }}
                    onUndo={() => {
                        const buys = [...(cfg.buys ?? [])];
                        const last = buys.pop();
                        const o = last && shop.offers[last.offer];
                        const back = o?.kind === 'pokemon' ? o.inst.uid : null;
                        setCfg({
                            ...cfg,
                            order: back ? cfg.order.map((u) => (u === back ? last!.uid : u)) : cfg.order,
                            buys,
                        });
                    }}
                />
            )}
            <LineupEditor
                title={t('team.lineup.title', { team: team.name })}
                formation={cfg.formation}
                lineup={cfg.order.slice(0, 5)}
                bench={cfg.order.slice(5)}
                byUid={byUid}
                captainUid={cfg.captain ?? team.captainUid ?? null}
                tactic={cfg.tactic}
                cornerPlan={cfg.corner ?? 'mixed'}
                cornerTakerUid={cfg.cornerTaker ?? null}
                locked={locked}
                onFormation={(formation) => setCfg({ ...cfg, formation })}
                onSwap={swap}
                onTactic={(tactic) => setCfg({ ...cfg, tactic })}
                onCaptain={canCaptain ? (captain) => setCfg({ ...cfg, captain }) : undefined}
                onCorner={(p) =>
                    setCfg({
                        ...cfg,
                        corner: p.cornerPlan ?? cfg.corner,
                        cornerTaker: p.cornerTakerUid !== undefined ? p.cornerTakerUid : cfg.cornerTaker,
                    })
                }
                side={
                    <div className="panel">
                        <h2>{t('duel.preview.rival', { name: rival })}</h2>
                        <div className="opponent-strip">
                            {[...rivalTeam.lineup, ...rivalTeam.bench].map((p) => (
                                <button
                                    key={p.uid}
                                    type="button"
                                    className="scout-btn"
                                    onClick={() => openCard(p, { note: t('duel.draft.rivalTeam', { name: rival }) })}
                                    aria-label={t('team.lineup.seeCard', { name: viewInstance(p).displayName })}
                                >
                                    <img className="pixel" src={cardSprite(p)} alt="" />
                                </button>
                            ))}
                        </div>
                        <p className="muted" style={{ fontSize: 11 }}>
                            {t('team.lineup.oppLine', {
                                formation: formationText(rivalTeam.formation ?? '1-2-1', lang).name,
                                tactic: d.common.tactic[rivalTeam.tactic],
                                n: rivalAvg,
                            })}
                        </p>
                        <ReadyBar
                            mine={sealed}
                            rival={!!s.choice?.seal[rivalRole]}
                            rivalName={rival}
                            starting={bothSealed(s)}
                            label={t('duel.preview.ready')}
                            note={t('duel.ready.timeNote')}
                            onReady={() => {
                                void duel.sealChoice(cfg);
                            }}
                            onUndo={() => duel.unsealChoice()}
                        />
                    </div>
                }
            />
        </div>
    );
}

/**
 * O Mercado do intervalo do melhor de 3 (`duelShop`): a vitrine igual à do rival, o ₽ deste intervalo e, ao comprar,
 * quem sai (Pokémon) ou quem segura (item). As compras vão lacradas junto da escalação; "Desfazer" tira a última.
 */
function DuelShopPanel({
    shop,
    team,
    captainUid,
    buys,
    locked,
    onBuy,
    onUndo,
}: {
    shop: NonNullable<ReturnType<typeof shopOf>>;
    team: TeamSetup;
    captainUid: string | null;
    buys: { offer: number; uid: string }[];
    locked: boolean;
    onBuy: (offer: number, uid: string) => void;
    onUndo: () => void;
}) {
    const { t } = useT();
    const [chosen, setChosen] = useState<number | null>(null);
    const spent = buys.reduce((n, b) => n + shop.offers[b.offer].price, 0);
    const money = shop.money - spent;
    const all = [...team.lineup, ...team.bench];
    const offer = chosen === null ? null : shop.offers[chosen];
    const sold = (i: number) => buys.some((b) => b.offer === i);
    const owned = (i: number) => {
        const o = shop.offers[i];
        return o.kind === 'pokemon' && all.some((p) => p.speciesId === o.inst.speciesId);
    };
    return (
        <section className="panel duel-shop" data-testid="duel-shop">
            <div className="duel-shop-head">
                <h2>{t('shop.title')}</h2>
                <b className="money" data-testid="duel-shop-money">
                    {t('shop.money', { n: money })}
                </b>
                {buys.length > 0 && !locked && (
                    <button type="button" className="btn small ghost" onClick={onUndo}>
                        {t('duel.shop.undo')}
                    </button>
                )}
            </div>
            <p className="muted duel-shop-hint">
                {t(shop.money > DUEL_SHOP_MONEY ? 'duel.shop.hintLoser' : 'duel.shop.hint', { n: shop.money })}
            </p>
            <div className="duel-shop-row">
                {shop.offers.map((o, i) => {
                    const ok = !locked && !sold(i) && !owned(i) && money >= o.price;
                    return (
                        <div
                            key={o.kind === 'pokemon' ? o.inst.uid : `${o.kind}-${i}`}
                            className={`shop-offer k-${o.kind}${sold(i) ? ' sold' : ''}${ok || sold(i) ? '' : ' cant'}`}
                        >
                            <OfferCard
                                offer={o}
                                lack={Math.max(0, o.price - money)}
                                selected={chosen === i}
                                team={all}
                                packSize={3}
                                onPick={() => ok && setChosen(i)}
                            />
                            <button
                                type="button"
                                className="btn small confirm shop-buy"
                                disabled={!ok}
                                onClick={() => setChosen(i)}
                            >
                                {!ok && !sold(i) && <HudIcon kind="lock" />}
                                {sold(i)
                                    ? t('shop.sold')
                                    : owned(i)
                                      ? t('shop.owned')
                                      : money < o.price
                                        ? t('shop.priceShort', { price: o.price, n: o.price - money })
                                        : t('shop.buy', { n: o.price })}
                            </button>
                        </div>
                    );
                })}
            </div>
            <Sheet
                open={!!offer && !locked}
                onClose={() => setChosen(null)}
                title={t(offer?.kind === 'pokemon' ? 'reward.whoLeaves' : 'reward.whoHolds')}
                className="reward-sheet"
            >
                <div className="duel-shop-who">
                    {all.map((p) => {
                        const v = viewInstance(p);
                        const no = offer?.kind === 'pokemon' && p.uid === captainUid;
                        return (
                            <button
                                key={p.uid}
                                type="button"
                                className="btn duel-shop-mon"
                                disabled={no}
                                onClick={() => {
                                    onBuy(chosen!, p.uid);
                                    setChosen(null);
                                }}
                            >
                                <img className="pixel" src={cardSprite(p)} alt="" />
                                <span>{v.displayName}</span>
                                <b>{v.overall}</b>
                                {no && <small className="muted">{t('duel.shop.captain')}</small>}
                            </button>
                        );
                    })}
                </div>
            </Sheet>
        </section>
    );
}
