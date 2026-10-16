import { useState } from 'react';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { clubName, dict, formationText, itemDesc, itemName, stageName } from '../../i18n';
import { useT } from '../../i18n/react';
import { playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { LinkChips } from '../components/LinkChips';
import { cardSprite, TypeBadge } from '../components/PokeCard';
import { Tip } from '../help/Tip';
import { simulateMatch } from '../sim-client';

/** Descrição das táticas em português (o texto de cada idioma está em i18n: team.lineup.tacticDesc). */
export const TACTIC_DESC: Record<Tactic, string> = dict('pt').team.lineup.tacticDesc;

export function Lineup() {
    const { run, swapSlots, setTactic, setFormation, moveItem, setMatch, go, abandonRun, lockMatch } = useGame();
    const [error, setError] = useState<string | null>(null);
    const [askAbandon, setAskAbandon] = useState(false);
    const openCard = useCardModal((s) => s.open);
    const [selected, setSelected] = useState<SlotRef | null>(null);
    const [detail, setDetail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t, d, lang } = useT();
    if (!run) return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const opponent = run.opponents[run.stage];
    const detailInst = byUid.get(detail ?? run.lineup[0]) ?? run.picks[0];
    const synergies = computeSynergies(run.lineup.map((u) => byUid.get(u)!));
    const links = computeLinks(run.lineup.map((u) => byUid.get(u)!));
    const holders = run.picks.filter((p) => p.uid !== detailInst?.uid);

    const locked = !!run.lockedTeam;
    const captainBenched = !!run.captainUid && run.bench.includes(run.captainUid);

    const onSlot = (ref: SlotRef, uid: string) => {
        setDetail(uid);
        if (locked) return;
        if (!selected) {
            setSelected(ref);
            return;
        }
        if (selected.zone !== ref.zone || selected.index !== ref.index) {
            playSfx('select');
            swapSlots(selected, ref);
        }
        setSelected(null);
    };

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
            const live = useGame.getState().run?.live;
            const orders = live?.stage === stage ? live.orders : [];
            const result = await simulateMatch(team, opponent, `${seed}-stage-${stage}`, orders);
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
            <Tip id="lineup-coach">{t('team.lineup.tip')}</Tip>
            <div className="panel">
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

            <div className="lineup-grid">
                <div className="panel">
                    <h2>{t('team.lineup.title', { team: run.teamName })}</h2>
                    <div className="formation-tabs">
                        {Object.values(FORMATIONS).map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                className={`btn small${run.formation === f.id ? ' active' : ''}`}
                                disabled={locked}
                                onClick={() => setFormation(f.id)}
                            >
                                {formationText(f.id, lang).name}
                            </button>
                        ))}
                    </div>
                    <p className="muted" style={{ marginTop: 8 }}>
                        {t('team.lineup.swapHint')}
                    </p>
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        projection={
                            selected
                                ? byUid.get((selected.zone === 'lineup' ? run.lineup : run.bench)[selected.index])
                                : null
                        }
                        stateOf={(ref) =>
                            selected?.zone === ref.zone && selected.index === ref.index ? 'selected' : 'idle'
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
                    <div className="panel">
                        <h2>
                            {stageName(run.stage, lang)}: {clubName(opponent.name, lang)}
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
                                n: Math.round(
                                    opponent.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) /
                                        opponent.lineup.length,
                                ),
                            })}
                        </p>
                        <button type="button" className="btn primary wide" onClick={play} disabled={loading}>
                            {loading
                                ? t('team.lineup.warming')
                                : locked
                                  ? t('team.lineup.backToMatch')
                                  : t('team.lineup.play', {
                                        stage:
                                            lang === 'pt'
                                                ? stageName(run.stage, lang).toLowerCase()
                                                : stageName(run.stage, lang),
                                    })}
                        </button>
                        {locked && <p className="tactic-desc">{t('team.lineup.lockedNote')}</p>}
                        {error && <p className="error-text">{error}</p>}
                    </div>

                    <div className="panel">
                        <h2>{t('team.lineup.tactic')}</h2>
                        <div className="tactics">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => (
                                <button
                                    key={tc}
                                    type="button"
                                    className={`btn small${run.tactic === tc ? ' active' : ''}`}
                                    disabled={locked}
                                    onClick={() => setTactic(tc)}
                                >
                                    {d.common.tactic[tc]}
                                </button>
                            ))}
                        </div>
                        <p className="tactic-desc">
                            {d.team.lineup.tacticDesc[run.tactic]} {t('team.lineup.canChange')}
                        </p>
                        {captainBenched && <p className="error-text">{t('team.lineup.captainBenched')}</p>}
                        <h3 style={{ marginTop: 12 }}>{t('team.lineup.typeSynergies')}</h3>
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
                        <h3 style={{ marginTop: 12 }}>{t('team.lineup.storySynergies')}</h3>
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
                                <FutCard inst={detailInst} captain={detailInst.uid === run.captainUid} fullButton />
                            </div>
                            {detailInst.item && (
                                <div className="panel item-move">
                                    <img className="pixel" src={itemSprite(detailInst.item)} alt="" />
                                    <span>
                                        <b>{itemName(detailInst.item)}</b> — {itemDesc(detailInst.item, lang)}
                                    </span>
                                    <label className="muted">
                                        {t('team.lineup.giveTo')}{' '}
                                        <select
                                            value=""
                                            disabled={locked}
                                            onChange={(e) => e.target.value && moveItem(detailInst.uid, e.target.value)}
                                        >
                                            <option value="">…</option>
                                            {holders.map((h) => (
                                                <option key={h.uid} value={h.uid}>
                                                    {viewInstance(h).displayName}
                                                    {h.item
                                                        ? t('team.lineup.swapWith', { item: itemName(h.item) })
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {/* sem o confirm() do navegador: o 1º toque pergunta aqui mesmo, o 2º confirma */}
                    {askAbandon ? (
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
                    )}
                </div>
            </div>
        </>
    );
}
