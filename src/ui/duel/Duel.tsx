import { useEffect, useState } from 'react';
import { cloudEnabled, cloudUserId, useCloud } from '../../cloud/cloud';
import { ENGINE_VERSION } from '../../engine/config';
import { DEFAULT_SPECIAL_LIMIT, SPECIAL_LIMITS, type SpecialLimit } from '../../engine/duel-validate';
import { playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import {
    DUEL_MODES,
    DUEL_SPEEDS,
    type DuelMode,
    isRoomCode,
    other,
    type Peer,
    type Role,
    type Shared,
    SIDE,
    specialLimitOf,
    versionsOk,
    WO_WAIT_MS,
} from '../../net/duel-state';
import { buildRegistro } from '../../net/record';
import { duel, localId, makePeer, useDuel } from '../../net/session';
import { type PlaybackSpeed, useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, trainerSrc } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { AccountBar } from '../components/AccountBar';
import { LeaveConfirm } from '../leave-guard';
import { FEEDBACK_URL } from '../links';
import { avatarImage, hexCss, titleName, trainerLabel } from '../profile/club';
import { DuelDraft, DuelPreview, specialRuleText, TeamPick } from './DuelDraft';
import { DuelMatch, useCountdown } from './DuelMatch';
import './duel.css';

const PENDING = 'soccermon-duel-pending';

// (dev) testes headless com duas abas leem e mexem no estado por aqui
if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__soccermonDuel = { duel, useDuel, useGame };

/** Código da sala no link (`?duelo=K7M2QX`), ou o que ficou guardado antes do login pelo Google. */
export function duelCodeFromUrl(): string | null {
    try {
        const q = new URLSearchParams(window.location.search).get('duelo');
        if (isRoomCode(q)) return q;
        const kept = sessionStorage.getItem(PENDING);
        return isRoomCode(kept) ? kept : null;
    } catch {
        return null;
    }
}

/** Sala local (duas abas, sem internet): sem Supabase configurado ou com `&local=1` no link. */
export const isLocalDuel = () => !cloudEnabled || new URLSearchParams(window.location.search).get('local') === '1';

export const duelLink = (code: string, local: boolean) =>
    `${window.location.origin}${window.location.pathname}?duelo=${code}${local ? '&local=1' : ''}`;

function setUrl(code: string | null, local: boolean) {
    const url = code ? `?duelo=${code}${local ? '&local=1' : ''}` : window.location.pathname;
    window.history.replaceState(null, '', url);
    try {
        if (code) sessionStorage.setItem(PENDING, code);
        else sessionStorage.removeItem(PENDING);
    } catch {
        // nada
    }
}

/** Quem eu sou na sala: nome, avatar, treinador, título, clube e as versões (o aperto de mão). */
function usePeer(local: boolean): Peer | null {
    const profile = useGame((s) => s.profile);
    const user = useCloud((s) => s.user);
    const id = local ? localId() : user ? cloudUserId() : null;
    if (!id) return null;
    const av = avatarImage(profile.avatar, user?.avatar);
    return makePeer({
        id,
        name: trainerLabel(profile, user?.name),
        avatar: av.src,
        avatarGoogle: av.google,
        trainer: activeTrainer(profile),
        title: titleName(activeTitle(profile)),
        clubName: profile.clubName || 'Pallet FC',
        clubTag: profile.clubTag || 'PAL',
        clubColor: clubColorHex(profile.clubColor),
    });
}

const speedLabel = (sp: PlaybackSpeed, lances: string) => (sp === 'highlights' ? lances : `${sp}x`);

/** Duelo em beta: uma linha com o link do feedback (o mesmo do botão da Home). */
function BetaNote() {
    const { t } = useT();
    return (
        <p className="duel-beta">
            <span className="duel-beta-tag">{t('duel.beta')}</span> {t('duel.betaNote')}{' '}
            <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                {t('duel.betaLink')}
            </a>
        </p>
    );
}

/** Criar sala: o host escolhe o modo e a velocidade. */
function CreateRoom({ peer, local }: { peer: Peer; local: boolean }) {
    const { t, d } = useT();
    const startSpeed = useGame((s) => s.settings.speed);
    const [mode, setMode] = useState<DuelMode>('ready');
    const [speed, setSpeed] = useState<PlaybackSpeed>(startSpeed === 8 ? 4 : startSpeed);
    const [busy, setBusy] = useState(false);
    const [specialLimit, setSpecialLimit] = useState<SpecialLimit>(DEFAULT_SPECIAL_LIMIT);
    return (
        <div className="duel-create">
            <h1>{t('duel.newDuel')}</h1>
            <p className="muted">{t('duel.newHint')}</p>
            <BetaNote />
            <fieldset className="duel-modes">
                <legend className="muted">{t('duel.modeLabel')}</legend>
                {DUEL_MODES.map((m) => (
                    <button
                        key={m}
                        type="button"
                        className={`panel duel-mode${mode === m ? ' on' : ''}`}
                        aria-pressed={mode === m}
                        onClick={() => setMode(m)}
                    >
                        <b>{d.duel.modes[m][0]}</b>
                        <span>{d.duel.modes[m][1]}</span>
                    </button>
                ))}
            </fieldset>
            {mode === 'ready' && (
                <fieldset className="duel-speeds">
                    <legend className="muted">{t('duel.specials.label')}</legend>
                    <div className="row">
                        {SPECIAL_LIMITS.map((l) => (
                            <button
                                key={String(l)}
                                type="button"
                                className={`btn small${specialLimit === l ? ' active' : ''}`}
                                aria-pressed={specialLimit === l}
                                onClick={() => setSpecialLimit(l)}
                            >
                                {l === 0
                                    ? t('duel.specials.none')
                                    : l === null
                                      ? t('duel.specials.free')
                                      : t('duel.specials.upTo3')}
                            </button>
                        ))}
                    </div>
                    <small className="muted">{t('duel.specials.hint')}</small>
                </fieldset>
            )}
            <fieldset className="duel-speeds">
                <legend className="muted">{t('duel.speedLabel')}</legend>
                <div className="row">
                    {DUEL_SPEEDS.map((sp) => (
                        <button
                            key={String(sp)}
                            type="button"
                            className={`btn small${speed === sp ? ' active' : ''}`}
                            aria-pressed={speed === sp}
                            onClick={() => setSpeed(sp)}
                        >
                            {speedLabel(sp, t('match.highlights'))}
                        </button>
                    ))}
                </div>
                <small className="muted">{t('duel.speedHint')}</small>
            </fieldset>
            <button
                type="button"
                className="btn primary big"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    playSfx('select');
                    const code = await duel.create(peer, mode, speed, local, specialLimit);
                    setUrl(code, local);
                }}
            >
                {t('duel.createRoom')}
            </button>
        </div>
    );
}

function PeerCard({
    p,
    role,
    me,
    online,
    ready,
}: {
    p?: Peer;
    role: Role;
    me: boolean;
    online: boolean;
    ready: boolean;
}) {
    const { t } = useT();
    if (!p) {
        return (
            <div className="panel duel-peer empty">
                <span className="duel-spinner" aria-hidden />
                <span className="muted">{t('duel.lobby.waitingRival')}</span>
            </div>
        );
    }
    return (
        <div
            className={`panel duel-peer${online ? '' : ' away'}`}
            style={{ '--club': hexCss(p.clubColor) } as React.CSSProperties}
        >
            <img className="duel-trainer pixel" src={trainerSrc(p.trainer as never)} alt="" />
            <img
                className={`avatar${p.avatarGoogle ? '' : ' pixel'}`}
                src={p.avatar}
                alt=""
                referrerPolicy="no-referrer"
            />
            <span className="duel-peer-who">
                <small className="muted">
                    {me ? t('duel.lobby.you') : role === 'host' ? t('duel.lobby.host') : t('duel.lobby.guest')}
                    {!online && ` · ${t('duel.lobby.away')}`}
                </small>
                <b>{p.name}</b>
                <span className="duel-title">{p.title}</span>
                <span className="duel-club">
                    <i /> {p.clubName}
                </span>
            </span>
            <span className={`duel-ready${ready ? ' on' : ''}`} data-testid={`ready-${role}`}>
                {ready ? t('duel.lobby.ready') : t('duel.lobby.notReady')}
            </span>
        </div>
    );
}

function Lobby() {
    const { t, d } = useT();
    const s = useDuel((st) => st.shared)!;
    const role = useDuel((st) => st.role)!;
    const online = useDuel((st) => st.online);
    const local = useDuel((st) => st.local);
    const [copied, setCopied] = useState(false);
    const link = duelLink(s.room, local);
    const mismatch = s.peers.host && s.peers.guest && !versionsOk(s);
    const v = (p?: Peer) => (p ? `${p.app} · motor ${p.engine}` : '');
    return (
        <div className="duel-lobby">
            <div className="duel-code">
                <span className="muted">{t('duel.room', { code: '' })}</span>
                <b data-testid="duel-code">{s.room}</b>
                <span className="muted">
                    {d.duel.modes[s.mode][0]} · {speedLabel(s.speed, t('match.highlights'))}
                </span>
                {s.mode === 'ready' && (
                    <span className="duel-rule" data-testid="duel-rule">
                        {specialRuleText(specialLimitOf(s), t)}
                    </span>
                )}
            </div>
            <div className="row duel-share">
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        void navigator.clipboard?.writeText(link).then(() => setCopied(true));
                    }}
                >
                    {copied ? t('duel.lobby.copied') : t('duel.lobby.copy')}
                </button>
                {'share' in navigator && (
                    <button
                        type="button"
                        className="btn"
                        onClick={() =>
                            navigator
                                .share({ text: t('duel.lobby.shareText', { code: s.room }), url: link })
                                .catch(() => {})
                        }
                    >
                        {t('duel.lobby.share')}
                    </button>
                )}
            </div>
            {local && <p className="muted small">{t('duel.lobby.local')}</p>}
            <BetaNote />
            <div className="duel-peers">
                {(['host', 'guest'] as Role[]).map((r) => (
                    <PeerCard key={r} p={s.peers[r]} role={r} me={r === role} online={online[r]} ready={s.ready[r]} />
                ))}
            </div>
            {mismatch && (
                <p className="duel-banner warn">
                    {t('duel.lobby.versions', { a: v(s.peers.host), b: v(s.peers.guest) })}
                </p>
            )}
            <button
                type="button"
                className={`btn big ${s.ready[role] ? 'ghost' : 'primary'}`}
                disabled={!s.peers[other(role)] || !!mismatch}
                onClick={() => {
                    playSfx('select');
                    void duel.setReady(!s.ready[role]);
                }}
            >
                {s.ready[role] ? t('duel.lobby.unready') : t('duel.lobby.imReady')}
            </button>
        </div>
    );
}

/**
 * Alguém está travando a sala (caiu, não abriu o lacre, não escolheu no prazo): conta o tempo e, depois de 1 minuto,
 * deixa quem ficou encerrar por W.O. Nunca automático: o caso comum é o amigo que foi no WhatsApp.
 */
function WaitBanner({ s, role }: { s: Shared; role: Role }) {
    const { t } = useT();
    const left = useCountdown(s.waitSince !== undefined ? s.waitSince + WO_WAIT_MS : undefined);
    if (!s.waitFor || s.waitFor === role || s.waitSince === undefined) return null;
    const name = s.peers[s.waitFor]?.name ?? '';
    return (
        <div className="duel-banner warn" role="status" data-testid="duel-wait">
            {left > 0 ? (
                t('duel.wait.text', { name, s: left })
            ) : (
                <>
                    <span>{t('duel.wait.can', { name })}</span>
                    <button type="button" className="btn small primary" onClick={() => duel.dispatch({ k: 'claimWO' })}>
                        {t('duel.wait.claim')}
                    </button>
                </>
            )}
        </div>
    );
}

function DuelResultView({ onHome }: { onHome: () => void }) {
    const { t } = useT();
    const s = useDuel((st) => st.shared)!;
    const role = useDuel((st) => st.role)!;
    const history = useGame((g) => g.duels);
    const r = s.result!;
    const rival = s.peers[other(role)]?.name ?? '';
    const head = r.desync
        ? t('duel.result.desync')
        : r.wo
          ? r.winner === role
              ? t('duel.result.wo', { name: rival })
              : t('duel.result.woLost')
          : r.winner === role
            ? t('duel.result.won')
            : r.winner
              ? t('duel.result.lost', { name: rival })
              : t('duel.result.draw');
    const home = s.teams.host;
    const away = s.teams.guest;
    return (
        <div className="duel-result">
            <h1 className={r.winner === role ? 'won' : r.winner ? 'lost' : ''} data-testid="duel-result">
                {head}
            </h1>
            {!r.wo && !r.desync && (
                <div className="panel duel-final">
                    <span>{home?.name}</span>
                    <b data-testid="duel-final">
                        {r.score[0]} x {r.score[1]}
                    </b>
                    <span>{away?.name}</span>
                    {r.shootout && (
                        <small className="muted">{t('match.penalties', { a: r.shootout[0], b: r.shootout[1] })}</small>
                    )}
                </div>
            )}
            <div className="row duel-share">
                <button
                    type="button"
                    className="btn primary big"
                    disabled={s.rematch[role]}
                    onClick={() => duel.dispatch({ k: 'rematch' })}
                >
                    {s.rematch[role]
                        ? t('duel.result.rematchWait', { name: rival })
                        : s.rematch[other(role)]
                          ? t('duel.result.rematchAsk', { name: rival })
                          : t('duel.result.rematch')}
                </button>
                <button type="button" className="btn ghost" onClick={onHome}>
                    {t('duel.result.home')}
                </button>
            </div>
            {history.length > 0 && (
                <div className="panel duel-history">
                    <h2>{t('duel.result.history')}</h2>
                    {history.slice(0, 8).map((h) => (
                        <div key={h.id} className="duel-hrow">
                            <i className={h.result}>
                                {h.result === 'win'
                                    ? t('duel.result.win')
                                    : h.result === 'loss'
                                      ? t('duel.result.loss')
                                      : h.result === 'void'
                                        ? t('duel.result.voidShort')
                                        : t('duel.result.drawShort')}
                            </i>
                            <span>{t('duel.result.vs', { name: h.rival })}</span>
                            <b>{h.wo ? 'W.O.' : `${h.score[0]} x ${h.score[1]}`}</b>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Tela do duelo: criar sala, entrar (com login), lobby, time/draft, prévia, partida e resultado. */
export function Duel() {
    const { t } = useT();
    const go = useGame((g) => g.go);
    const recordDuel = useGame((g) => g.recordDuel);
    const [local] = useState(isLocalDuel);
    const peer = usePeer(local);
    const [code] = useState(duelCodeFromUrl);
    const status = useDuel((st) => st.status);
    const room = useDuel((st) => st.room);
    const s = useDuel((st) => st.shared);
    const role = useDuel((st) => st.role);
    const [seen, setSeen] = useState(0);
    const [askLeave, setAskLeave] = useState(false);
    const active = !!s && ['team', 'draft', 'preview', 'match'].includes(s.phase);

    // entra na sala do link (de novo ao voltar de outra tela ou recarregar)
    // biome-ignore lint/correctness/useExhaustiveDependencies: entra uma vez por sala/conta
    useEffect(() => {
        if (code && peer && room !== code) duel.join(code, peer, local);
    }, [code, peer?.id]);

    // histórico no save de cada um (uma vez por partida)
    // biome-ignore lint/correctness/useExhaustiveDependencies: grava quando a partida da sala termina
    useEffect(() => {
        if (!s?.result || !role || s.phase !== 'done') return;
        if (!duel.markRecorded(s.game)) return;
        const mine = SIDE[role];
        const r = s.result;
        const rival = s.peers[other(role)];
        const secret = duel.topOf(s.game);
        const top = secret ? { side: mine, top: secret } : undefined;
        recordDuel({
            id: `${s.room}-${s.game}`,
            date: Date.now(),
            mode: s.mode,
            rival: rival?.name ?? '?',
            rivalClub: rival?.clubName ?? '',
            score: mine === 0 ? r.score : [r.score[1], r.score[0]],
            shootout: r.shootout ? (mine === 0 ? r.shootout : [r.shootout[1], r.shootout[0]]) : null,
            result: r.desync ? 'void' : r.winner === role ? 'win' : r.winner ? 'loss' : 'draw',
            wo: r.wo,
            // tudo pra refazer a partida (dessincronização, replay; no futuro, a entrada do ranqueado)
            registro:
                s.teams.host && s.teams.guest ? buildRegistro(s, ENGINE_VERSION, __APP_VERSION__, top) : undefined,
        });
    }, [s?.phase, s?.game, role]);

    const home = () => {
        duel.leave(s?.phase === 'done');
        setUrl(null, false);
        go('home');
    };

    let body: React.ReactNode;
    if (!peer) {
        body = (
            <div className="panel duel-center">
                <h1>{t('duel.login.title')}</h1>
                <p>{t('duel.login.text', { code: code ?? '' })}</p>
                <AccountBar />
            </div>
        );
    } else if (status === 'full') {
        body = (
            <div className="panel duel-center">
                <h1>{t('duel.full')}</h1>
                <p className="muted">{t('duel.fullText')}</p>
            </div>
        );
    } else if (!code && !room) {
        body = <CreateRoom peer={peer} local={local} />;
    } else if (!s || !role) {
        body = (
            <div className="panel duel-center">
                <span className="duel-spinner" aria-hidden />
                <p>{t('duel.connecting', { code: code ?? room ?? '' })}</p>
                <p className="muted">{t('duel.waitingHost')}</p>
            </div>
        );
    } else if (s.phase === 'lobby') body = <Lobby />;
    else if (s.phase === 'team') body = <TeamPick s={s} role={role} />;
    else if (s.phase === 'draft') body = <DuelDraft s={s} role={role} />;
    else if (s.phase === 'preview') body = <DuelPreview s={s} role={role} />;
    else if (s.phase === 'match' || (s.phase === 'done' && !s.result?.wo && !s.result?.desync && seen !== s.game))
        body = <DuelMatch key={s.game} onSeeResult={() => setSeen(s.game)} />;
    else body = <DuelResultView onHome={home} />;

    return (
        <div className="duel" data-phase={s?.phase ?? 'none'}>
            {room && (
                <div className="duel-top row">
                    <span className="muted">{t('duel.room', { code: room })}</span>
                    {askLeave ? (
                        <span className="row duel-leave-ask">
                            <span>{t('duel.leaveAsk')}</span>
                            <button type="button" className="btn small" onClick={home}>
                                {t('duel.leaveYes')}
                            </button>
                            <button type="button" className="btn small ghost" onClick={() => setAskLeave(false)}>
                                {t('common.ui.cancel')}
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => (active ? setAskLeave(true) : home())}
                        >
                            {t('duel.leave')}
                        </button>
                    )}
                </div>
            )}
            {s && role && <WaitBanner s={s} role={role} />}
            {body}
            <LeaveConfirm />
        </div>
    );
}
