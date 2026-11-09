import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { cupRival } from '../../engine/cup';
import { viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { FICHAS, GYM_LEVEL, GYMS, LEVELS, type Level } from '../../store/ultimate/rules';
import {
    canPlay,
    gymReady,
    homeTeam,
    paidLevel,
    teamStrength,
    ultimateRival,
    ultimateSeed,
} from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { HudIcon } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { Sheet } from '../kit/Sheet';
import { simulateMatch } from '../sim-client';
import { CardBack } from './PickMoment';
import { Gyms } from './Season';

/** O nível escolhido fica na sessão (é conveniência, não save). */
let levelMem: Level | null = null;

/** A próxima Batalha de Treinador: o time, a força, o nível escolhido e o rival que sai nele (Início e aba Jogar). */
export function useBattle() {
    const u = useGame((s) => s.ultimate);
    const profile = useGame((s) => s.profile);
    const [level, setLevelState] = useState<Level>(() => levelMem ?? u.last?.level ?? 'normal');
    const setLevel = (lv: Level) => {
        levelMem = lv;
        setLevelState(lv);
    };
    const home = useMemo(
        () => homeTeam(u, profile.clubName || 'Pallet FC', clubColorHex(profile.clubColor)),
        [u, profile.clubName, profile.clubColor],
    );
    const ready = canPlay(u);
    const strength = ready ? teamStrength(home) : 0;
    const rivalOf = (lv: Level) => ultimateRival(u.salt, u.played, lv, strength);
    const rival = ready ? rivalOf(level) : null;
    /** O nível que cada escolha vale de verdade: sem rival à altura, paga como o que ele alcança. */
    const paid = (lv: Level) => (ready ? paidLevel(lv, home, rivalOf(lv)) : lv);
    return { u, home, ready, strength, rival, level, setLevel, paid };
}

/** Os modos que ainda não chegaram (equivalentes do FC: Rivals, Champions, Draft, SBC), na ordem da aba. */
export const SOON = ['rivals', 'elite', 'draft', 'sbc'] as const;
type SoonMode = (typeof SOON)[number];

export const trainer = (id: string) => <img key={id} className="pixel" src={`assets/trainers/${id}.png`} alt="" />;
export const SOON_ART: Record<SoonMode, ReactNode> = {
    rivals: <span className="ut-mode-vs">{[trainer('red'), trainer('blue')]}</span>,
    elite: <span className="ut-mode-four">{['lorelei', 'bruno', 'agatha', 'lance'].map(trainer)}</span>,
    draft: (
        <span className="ut-mode-backs">
            {[0, 1, 2].map((i) => (
                <CardBack key={i} />
            ))}
        </span>
    ),
    sbc: (
        <span className="ut-mode-slots">
            {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} />
            ))}
        </span>
    ),
};

/**
 * Aba Jogar (retorno do Miguel, 09/11: "a aba JOGAR, com todos os modos de jogo"): um cartão por modo, como o Jogar do
 * FC. Batalhas de Treinador (o Squad Battles) é o jogo contra a IA de sempre; Rivais, Elite dos Quatro, Draft e
 * Desafios de Montagem chegam depois e ficam em preto e branco, com o cadeado.
 */
export function Play({ onPacks }: { onPacks: () => void }) {
    const { t, d, lang } = useT();
    const { u, home, ready, strength, rival, level, setLevel, paid } = useBattle();
    const [sheet, setSheet] = useState<'level' | 'gyms' | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Simula (a mesma seed e as ordens guardadas dão a mesma partida) e abre a quadra. */
    const kick = async () => {
        const s = useGame.getState();
        const live = s.ultimate.live;
        if (!live) return;
        setBusy(true);
        setError(null);
        try {
            const m = await simulateMatch(
                live.home,
                cupRival(live.rival, true),
                `${ultimateSeed(s.ultimate.salt, live.n)}-stage-0`,
                live.orders,
            );
            if (useGame.getState().screen !== 'ultimate') return;
            s.setMatch(m);
            s.go('ultimate-match');
        } catch {
            setError(t('ultimate.play.simError'));
        } finally {
            setBusy(false);
        }
    };
    const start = () => {
        if (!rival) return;
        useGame.getState().ultimateStart({ n: u.played, level: paid(level), home, rival });
        void kick();
    };
    /** Desafio de líder: o clube dele, no Difícil, com a regra conferida na hora. */
    const challenge = (gym: string) => {
        if (!gymReady(u, gym)) return;
        setSheet(null);
        const r = ultimateRival(u.salt, u.played, GYM_LEVEL, strength, gym);
        useGame.getState().ultimateStart({ n: u.played, level: GYM_LEVEL, home, rival: r, gym });
        void kick();
    };
    const art = u.live?.rival ?? rival;

    return (
        <div className="ut-modes">
            <section className="panel bc-surface bc-stripe ut-mode is-battles">
                <span className="ut-mode-art">
                    {art ? (
                        <span className="ut-mode-team">
                            {art.lineup.map((p) => (
                                <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                            ))}
                        </span>
                    ) : (
                        <span className="ut-mode-vs">{[trainer('red'), trainer('acetrainer')]}</span>
                    )}
                </span>
                <span className="ut-mode-text">
                    <b className="ut-mode-name">{t('ultimate.modes.battles.name')}</b>
                    <small>{t('ultimate.modes.battles.line')}</small>
                    <span className="ut-mode-gives">
                        <HudIcon kind="coin" />
                        {t('ultimate.modes.battles.gives')}
                    </span>
                </span>
                {u.live ? (
                    <button
                        type="button"
                        className="btn primary big wide ut-go"
                        disabled={busy}
                        onClick={() => void kick()}
                    >
                        <i className="cb-shine" aria-hidden />
                        <span>
                            {busy ? t('ultimate.play.warming') : t('ultimate.play.resume')}
                            <small className="ut-go-goal">
                                {clubName(u.live.rival.name, lang)} · {d.ultimate.play.levels[u.live.level]}
                            </small>
                        </span>
                    </button>
                ) : ready && rival ? (
                    <>
                        <span className="ut-mode-next">
                            <span className="bc-lbl">{t('ultimate.play.rival')}</span>
                            <b>{clubName(rival.name, lang)}</b>
                            <small>
                                {t('ultimate.play.rivalPower', { n: Math.round(teamStrength(rival)) })} ·{' '}
                                {t('ultimate.play.yourPower', { n: Math.round(strength) })}
                            </small>
                        </span>
                        <button type="button" className="ut-level-chip" onClick={() => setSheet('level')}>
                            <HudIcon kind="coin" />
                            {t('ultimate.home.levelChip', {
                                level: d.ultimate.play.levels[level],
                                n: FICHAS[paid(level)].win,
                            })}
                            <b>{t('ultimate.home.change')}</b>
                        </button>
                        <button type="button" className="btn primary big wide ut-go" disabled={busy} onClick={start}>
                            <i className="cb-shine" aria-hidden />
                            <span>{busy ? t('ultimate.play.warming') : t('ultimate.play.go')}</span>
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn wide" onClick={onPacks}>
                        {t('ultimate.play.toPacks')}
                    </button>
                )}
                {error && <p className="error-text">{error}</p>}
                <button type="button" className="ut-mode-gyms" onClick={() => setSheet('gyms')}>
                    <span className="ut-b-head">
                        <HudIcon kind="stadium" />
                        <b>
                            {t('ultimate.home.gyms')} {u.gyms.length}/{GYMS.length}
                        </b>
                    </span>
                    <span className="ut-b-badges">
                        {GYMS.map((g) => (
                            <KantoBadge key={g.id} leader={g.id as TrainerId} earned={u.gyms.includes(g.id)} />
                        ))}
                    </span>
                </button>
            </section>
            {SOON.map((id) => (
                <section key={id} className={`panel bc-surface ut-mode is-locked is-${id}`} aria-disabled="true">
                    <span className="ut-mode-art">{SOON_ART[id]}</span>
                    <span className="ut-mode-text">
                        <span className="ut-mode-lock">
                            <HudIcon kind="lock" />
                            {t('ultimate.modes.soon')}
                        </span>
                        <b className="ut-mode-name">{t(`ultimate.modes.${id}.name`)}</b>
                        <small>{t(`ultimate.modes.${id}.line`)}</small>
                        <span className="ut-mode-gives">
                            <HudIcon kind="chest" />
                            {t(`ultimate.modes.${id}.gives`)}
                        </span>
                        {id === 'elite' && <small className="ut-mode-cond">{t('ultimate.modes.elite.cond')}</small>}
                    </span>
                </section>
            ))}
            <Sheet open={sheet === 'level'} onClose={() => setSheet(null)} title={t('ultimate.play.level')}>
                {rival && <LevelPick level={level} onLevel={setLevel} rival={rival} strength={strength} paid={paid} />}
            </Sheet>
            <Sheet
                open={sheet === 'gyms'}
                onClose={() => setSheet(null)}
                title={t('ultimate.gyms.title')}
                className="ut-gyms-sheet"
            >
                <Gyms u={u} busy={busy} onGo={challenge} />
            </Sheet>
        </div>
    );
}

/** A sheet do nível: os 4 níveis, a tabela de Fichas e o rival que sai no nível escolhido. */
function LevelPick({
    level,
    onLevel,
    rival,
    strength,
    paid,
}: {
    level: Level;
    onLevel: (lv: Level) => void;
    rival: ReturnType<typeof ultimateRival>;
    strength: number;
    paid: (lv: Level) => Level;
}) {
    const { t, d, lang } = useT();
    const u = useGame((s) => s.ultimate);
    return (
        <div className="ut-level">
            <div className="bc-seg">
                {LEVELS.map((lv) => (
                    <button
                        type="button"
                        key={lv}
                        aria-pressed={level === lv}
                        className={level === lv ? 'on' : undefined}
                        onClick={() => onLevel(lv)}
                    >
                        {d.ultimate.play.levels[lv]}
                    </button>
                ))}
            </div>
            <span className="bc-lbl">{t('ultimate.play.prize')}</span>
            <table className="ut-prizes">
                <thead>
                    <tr>
                        <th />
                        <th>{t('ultimate.play.win')}</th>
                        <th>{t('ultimate.play.draw')}</th>
                        <th>{t('ultimate.play.loss')}</th>
                    </tr>
                </thead>
                <tbody>
                    {LEVELS.map((lv) => (
                        <tr key={lv} className={level === lv ? 'on' : undefined}>
                            <th>{d.ultimate.play.levels[lv]}</th>
                            <td>{FICHAS[paid(lv)].win}</td>
                            <td>{FICHAS[paid(lv)].draw}</td>
                            <td>{FICHAS[paid(lv)].loss}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <small className="muted">{t('ultimate.play.prizeNote')}</small>
            {paid(level) !== level && (
                <small>{t('ultimate.play.noRival', { level: d.ultimate.play.levels[paid(level)] })}</small>
            )}
            <section
                key={rival.name}
                className="panel ut-rival bc-surface bc-stripe"
                style={{ '--tc': `#${rival.color.toString(16).padStart(6, '0')}` } as CSSProperties}
            >
                <span className="bc-lbl">{t('ultimate.play.rival')}</span>
                <b>{clubName(rival.name, lang)}</b>
                <span className="lg-squad">
                    {rival.lineup.map((p) => (
                        <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                    ))}
                </span>
                <small>
                    {t('ultimate.play.rivalPower', { n: Math.round(teamStrength(rival)) })} ·{' '}
                    {t('ultimate.play.yourPower', { n: Math.round(strength) })}
                </small>
                {u.played > 0 && (
                    <small className="muted">{t('ultimate.play.record', { w: u.wins, d: u.draws, l: u.losses })}</small>
                )}
            </section>
        </div>
    );
}
