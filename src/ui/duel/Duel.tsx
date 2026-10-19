import { useEffect, useState } from 'react';
import { cloudEnabled, duelUserId, signInAnon, signInWithGoogle, useCloud } from '../../cloud/cloud';
import { ENGINE_VERSION } from '../../engine/config';
import { DEFAULT_SPECIAL_LIMIT, SPECIAL_LIMITS, type SpecialLimit } from '../../engine/duel-validate';
import { matchMvp } from '../../engine/mvp';
import { playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import {
    DUEL_DURATIONS,
    DUEL_MODES,
    DUEL_SPEEDS,
    type DuelDuration,
    type DuelMode,
    duelNames,
    durationOf,
    isRoomCode,
    other,
    type Peer,
    type Role,
    type Shared,
    SIDE,
    specialLimitOf,
    trainerNames,
    versionsOk,
    WO_WAIT_MS,
} from '../../net/duel-state';
import { buildRegistro } from '../../net/record';
import { duel, localId, makePeer, useDuel } from '../../net/session';
import { lookOfProfile, peerLookFields } from '../../store/club-kit';
import { isDraftComplete, type PlaybackSpeed, useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, trainerFrame, trainerFx, trainerSrc } from '../../store/missions';
import { bannerOf, clubColorHex, rivalColor } from '../../store/profile';
import { ResultHero } from '../components/ResultHero';
import { LeaveConfirm } from '../leave-guard';
import { FEEDBACK_URL } from '../links';
import { avatarImage, hexCss, peerTitle, titleName, trainerLabel } from '../profile/club';
import { useShowcase } from '../profile/Medals';
import { qrPath } from '../qr';
import { heroStats, MatchDetails } from '../screens/Result';
import { agencyOn } from '../settings-sync';
import { setChartColors } from '../stats/StatsCharts';
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

/** Link da sala; `from` = nome de quem chama (a tela de quem abre sem conta mostra "Fulano te chamou"). */
export const duelLink = (code: string, local: boolean, from?: string) =>
    `${window.location.origin}${window.location.pathname}?duelo=${code}${local ? '&local=1' : ''}${
        from ? `&de=${encodeURIComponent(from.slice(0, 24))}` : ''
    }`;

const FROM = 'soccermon-duel-from';
/** Quem mandou o link (`&de=`), guardado pra sobreviver ao login pelo Google. */
function inviterFromUrl(): string {
    try {
        const q = new URLSearchParams(window.location.search).get('de');
        if (q) sessionStorage.setItem(FROM, q.slice(0, 24));
        return (q ?? sessionStorage.getItem(FROM) ?? '').slice(0, 24);
    } catch {
        return '';
    }
}

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
    useCloud((s) => s.anonId);
    const showcase = useShowcase().encoded;
    const id = local ? localId() : duelUserId();
    if (!id) return null;
    const av = avatarImage(profile.avatar, user?.avatar);
    return makePeer({
        id,
        name: trainerLabel(profile, user?.name),
        avatar: av.src,
        avatarGoogle: av.google,
        trainer: activeTrainer(profile),
        title: titleName(activeTitle(profile)),
        titleId: activeTitle(profile),
        clubName: profile.clubName || 'Pallet FC',
        clubTag: profile.clubTag || 'PAL',
        clubColor: clubColorHex(profile.clubColor),
        banner: bannerOf(profile.banner),
        ...peerLookFields(lookOfProfile(profile)),
        showcase,
        anon: !local && !user,
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

/**
 * Quem abre o duelo sem conta (ou o link da sala): "Fulano te chamou pra um duelo", o nome do treinador e "Jogar
 * agora" (login anônimo, só pro canal da sala). Entrar com o Google fica de segunda opção (guarda o histórico na
 * nuvem); o duelo não exige conta.
 */
function DuelEntry({ code }: { code: string | null }) {
    const { t } = useT();
    const profile = useGame((g) => g.profile);
    const updateProfile = useGame((g) => g.updateProfile);
    const [name, setName] = useState(profile.trainerName);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<'disabled' | 'error' | null>(null);
    const [inviter] = useState(inviterFromUrl);
    const play = async () => {
        setBusy(true);
        setError(null);
        playSfx('select');
        const clean = name.trim().slice(0, 20);
        if (clean && clean !== profile.trainerName) updateProfile({ trainerName: clean });
        const r = await signInAnon();
        if (r !== 'ok') {
            setError(r);
            setBusy(false);
        }
    };
    return (
        <div className="panel duel-center duel-entry">
            {code ? (
                <>
                    <span className="muted">{t('duel.entry.kicker', { code })}</span>
                    <h1>{inviter ? t('duel.entry.invited', { name: inviter }) : t('duel.entry.invitedAnon')}</h1>
                </>
            ) : (
                <h1>{t('duel.newDuel')}</h1>
            )}
            <p className="muted">{t('duel.entry.text')}</p>
            <label className="duel-name">
                <span className="muted">{t('duel.entry.nameLabel')}</span>
                <input
                    value={name}
                    maxLength={20}
                    placeholder={t('profile.trainer')}
                    autoComplete="nickname"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !busy && void play()}
                />
            </label>
            <button
                type="button"
                className="btn primary big"
                data-testid="duel-play-now"
                disabled={busy}
                onClick={() => void play()}
            >
                {busy ? t('duel.entry.entering') : t('duel.entry.playNow')}
            </button>
            {error && (
                <p className="error-text" role="alert">
                    {error === 'disabled' ? t('duel.entry.anonOff') : t('duel.entry.failed')}
                </p>
            )}
            <button type="button" className="duel-google" onClick={() => void signInWithGoogle()}>
                {t('duel.entry.google')}
            </button>
            <BetaNote />
        </div>
    );
}

/** Tem time pronto pra levar (copa com o draft completo ou um campeão do Hall). */
function useHasReadyTeam(): boolean {
    const run = useGame((g) => g.run);
    const hall = useGame((g) => g.hall);
    return (!!run && isDraftComplete(run) && run.lineup.length > 0) || hall.length > 0;
}

/** Criar sala: o host escolhe o modo e a velocidade. */
function CreateRoom({ peer, local }: { peer: Peer; local: boolean }) {
    const { t, d } = useT();
    const startSpeed = useGame((s) => s.settings.speed);
    const hasTeam = useHasReadyTeam();
    // Disputa é o padrão: ninguém precisa ter time pra jogar
    const [mode, setMode] = useState<DuelMode>('disputa');
    const [speed, setSpeed] = useState<PlaybackSpeed>(startSpeed === 8 ? 4 : startSpeed);
    const [busy, setBusy] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [specialLimit, setSpecialLimit] = useState<SpecialLimit>(DEFAULT_SPECIAL_LIMIT);
    const [duration, setDuration] = useState<DuelDuration>('normal');
    return (
        <div className="duel-create">
            <header className="bc-screenhead">
                <span className="bc-tag">{t('duel.title')}</span>
                <h1>{t('duel.newDuel')}</h1>
            </header>
            <p className="muted">{t('duel.newHint')}</p>
            <BetaNote />
            <fieldset className="duel-modes">
                <legend className="bc-lbl">{t('duel.modeLabel')}</legend>
                {DUEL_MODES.map((m) => (
                    <button
                        key={m}
                        type="button"
                        className={`bc-tile duel-mode${mode === m ? ' on' : ''}`}
                        aria-pressed={mode === m}
                        data-mode={m}
                        disabled={m === 'ready' && !hasTeam}
                        onClick={() => setMode(m)}
                    >
                        <b>{d.duel.modes[m][0]}</b>
                        <span>{d.duel.modes[m][1]}</span>
                        {m === 'ready' && !hasTeam && <small className="duel-mode-off">{t('duel.noTeam')}</small>}
                    </button>
                ))}
            </fieldset>
            {mode === 'ready' && (
                <fieldset className="duel-speeds">
                    <legend className="bc-lbl">{t('duel.specials.label')}</legend>
                    <div className="bc-seg segmented">
                        {SPECIAL_LIMITS.map((l) => (
                            <button
                                key={String(l)}
                                type="button"
                                className={specialLimit === l ? 'on' : undefined}
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
                <legend className="bc-lbl">{t('duel.speedLabel')}</legend>
                <div className="bc-seg segmented">
                    {DUEL_SPEEDS.map((sp) => (
                        <button
                            key={String(sp)}
                            type="button"
                            className={speed === sp ? 'on' : undefined}
                            aria-pressed={speed === sp}
                            onClick={() => setSpeed(sp)}
                        >
                            {speedLabel(sp, t('match.highlights'))}
                        </button>
                    ))}
                </div>
                <small className="muted">{t('duel.speedHint')}</small>
            </fieldset>
            <fieldset className="duel-speeds">
                <legend className="bc-lbl">{t('duel.durationLabel')}</legend>
                <div className="bc-seg segmented">
                    {DUEL_DURATIONS.map((du) => (
                        <button
                            key={du}
                            type="button"
                            className={duration === du ? 'on' : undefined}
                            aria-pressed={duration === du}
                            data-testid={`duel-length-${du}`}
                            onClick={() => setDuration(du)}
                        >
                            {d.duel.durations[du]}
                        </button>
                    ))}
                </div>
                <small className="muted">{t('duel.durationHint')}</small>
            </fieldset>
            <button
                type="button"
                className="btn primary big"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    playSfx('select');
                    const code = await duel.create(peer, mode, speed, local, specialLimit, duration, agencyOn());
                    setUrl(code, local);
                }}
            >
                {t('duel.createRoom')}
            </button>
            <form
                className="panel duel-join"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (isRoomCode(joinCode)) window.location.assign(duelLink(joinCode, local));
                }}
            >
                <label>
                    <span className="muted">{t('duel.join.label')}</span>
                    <input
                        value={joinCode}
                        maxLength={6}
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="K7M2QX"
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                </label>
                <button type="submit" className="btn" disabled={!isRoomCode(joinCode)}>
                    {t('duel.join.go')}
                </button>
            </form>
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
            className={`panel duel-peer${online ? '' : ' away'}${trainerFrame(p.trainer)}`}
            style={{ '--club': hexCss(p.clubColor) } as React.CSSProperties}
        >
            <img className={`duel-trainer pixel${trainerFx(p.trainer)}`} src={trainerSrc(p.trainer as never)} alt="" />
            <img
                className={`avatar${p.avatarGoogle ? '' : ' pixel'}`}
                src={p.avatar}
                alt=""
                referrerPolicy="no-referrer"
            />
            <span className="duel-peer-who">
                <small className="muted">
                    {me ? t('duel.lobby.you') : t('duel.lobby.rival')}
                    {role === 'host' && ` · ${t('duel.lobby.host')}`}
                    {!online && ` · ${t('duel.lobby.away')}`}
                </small>
                <b>
                    {p.name}
                    {p.anon && <span className="duel-anon">{t('duel.lobby.anon')}</span>}
                </b>
                <span className="duel-title">
                    <span className={peerTitle(p).look || undefined}>{peerTitle(p).name}</span>
                </span>
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

/** O link da sala num QR (SVG próprio, src/ui/qr.ts) pra quem está do lado. */
function RoomQr({ link }: { link: string }) {
    const qr = qrPath(link);
    if (!qr) return null;
    return (
        <svg className="duel-qr-svg" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img">
            <title>{link}</title>
            <rect width={qr.size} height={qr.size} fill="#fff" />
            <path d={qr.d} fill="#141a33" />
        </svg>
    );
}

/** Convidar: código grande, Compartilhar (ou copiar), WhatsApp e QR. */
function InviteBox({ s, local, compact }: { s: Shared; local: boolean; compact: boolean }) {
    const { t } = useT();
    const [note, setNote] = useState<string | null>(null);
    const link = duelLink(s.room, local, s.peers.host?.name);
    const text = t('duel.lobby.shareText', { code: s.room });
    const flash = (msg: string) => {
        setNote(msg);
        window.setTimeout(() => setNote(null), 2200);
    };
    const copy = () =>
        navigator.clipboard?.writeText(link).then(
            () => flash(t('duel.lobby.copied')),
            () => flash(link),
        ) ?? flash(link);
    const share = () => {
        playSfx('select');
        if ('share' in navigator) navigator.share({ title: 'Soccermon', text, url: link }).catch(() => {});
        else void copy();
    };
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
    return (
        <div className={`panel duel-invite${compact ? ' compact' : ''}`}>
            <div className="duel-code">
                <span className="muted">{t('duel.lobby.codeLabel')}</span>
                <b data-testid="duel-code">{s.room}</b>
            </div>
            {!compact && <p className="muted duel-invite-hint">{t('duel.lobby.inviteHint')}</p>}
            <div className="row duel-share">
                <button type="button" className="btn primary" data-testid="duel-share" onClick={share}>
                    {t('duel.lobby.share')}
                </button>
                <a className="btn whatsapp" href={wa} target="_blank" rel="noopener" data-testid="duel-wa">
                    {t('duel.lobby.whatsapp')}
                </a>
                <button type="button" className="btn ghost" onClick={() => void copy()}>
                    {t('duel.lobby.copy')}
                </button>
            </div>
            {!compact && (
                <details className="duel-qr">
                    <summary>{t('duel.lobby.qr')}</summary>
                    <RoomQr link={link} />
                    <small className="muted">{t('duel.lobby.qrHint')}</small>
                </details>
            )}
            {note && (
                <div className="toast-pill" role="status">
                    {note}
                </div>
            )}
        </div>
    );
}

/**
 * Jogos de versões diferentes na sala (um com a página velha em cache, ou que recarregou depois de uma versão nova):
 * o lobby não deixa começar e, se acontecer no meio, o aviso fica no topo em vez de a partida se separar calada.
 */
function VersionBanner({ s }: { s: Shared }) {
    const { t } = useT();
    if (!s.peers.host || !s.peers.guest || versionsOk(s)) return null;
    const v = (p: Peer) => `${p.app} · ${t('duel.lobby.engine')} ${p.engine}`;
    return (
        <p className="duel-banner warn" data-testid="duel-versions">
            {t('duel.lobby.versions', { a: v(s.peers.host), b: v(s.peers.guest) })}
        </p>
    );
}

function Lobby() {
    const { t, d } = useT();
    const s = useDuel((st) => st.shared)!;
    const role = useDuel((st) => st.role)!;
    const online = useDuel((st) => st.online);
    const local = useDuel((st) => st.local);
    const mismatch = s.peers.host && s.peers.guest && !versionsOk(s);
    const rivalIn = !!s.peers[other(role)];
    // Time pronto sem time pra levar (quem entrou pelo link num save novo): o Pronto travaria a sala na escolha do time
    const hasTeam = useHasReadyTeam();
    const noTeam = s.mode === 'ready' && !hasTeam;
    return (
        <div className="duel-lobby">
            <div className="duel-lobby-head bc-screenhead">
                <h1>{rivalIn ? t('duel.lobby.title') : t('duel.lobby.inviteTitle')}</h1>
                <span className="bc-tag">
                    {d.duel.modes[s.mode][0]} · {speedLabel(s.speed, t('match.highlights'))}
                    {durationOf(s) === 'short' && ` · ${d.duel.durations.short}`}
                    {s.mode === 'ready' && (
                        <>
                            {' · '}
                            <span className="duel-rule" data-testid="duel-rule">
                                {specialRuleText(specialLimitOf(s), t)}
                            </span>
                        </>
                    )}
                    {s.agency && <> · {t('match.agency.title')}</>}
                </span>
            </div>
            <InviteBox s={s} local={local} compact={rivalIn} />
            {local && <p className="muted small">{t('duel.lobby.local')}</p>}
            <div className="duel-peers">
                {(['host', 'guest'] as Role[]).map((r) => (
                    <PeerCard key={r} p={s.peers[r]} role={r} me={r === role} online={online[r]} ready={s.ready[r]} />
                ))}
            </div>
            <VersionBanner s={s} />
            <button
                type="button"
                className={`btn big ${s.ready[role] ? 'ghost' : 'primary'}`}
                data-testid="duel-ready"
                disabled={!rivalIn || !!mismatch || (noTeam && !s.ready[role])}
                onClick={() => {
                    playSfx('select');
                    void duel.setReady(!s.ready[role]);
                }}
            >
                {s.ready[role] ? t('duel.lobby.unready') : t('duel.lobby.imReady')}
            </button>
            {noTeam && <p className="error-text small">{t('duel.noTeam')}</p>}
            <BetaNote />
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
    const name = trainerNames(s)[SIDE[s.waitFor]];
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
    const { t, tn } = useT();
    const s = useDuel((st) => st.shared)!;
    const role = useDuel((st) => st.role)!;
    const online = useDuel((st) => st.online);
    const history = useGame((g) => g.duels);
    const r = s.result!;
    const rival = trainerNames(s)[SIDE[other(role)]];
    // o rival saiu da sala: revanche não tem quem aceite
    const rivalGone = !online[other(role)];
    // placar contra esse amigo (pelo nome dele no histórico do save)
    const rivalSaved = s.peers[other(role)]?.name ?? '';
    const vsRival = history.filter((h) => h.rival === rivalSaved && h.result !== 'void');
    const h2h = {
        w: vsRival.filter((h) => h.result === 'win').length,
        l: vsRival.filter((h) => h.result === 'loss').length,
        d: vsRival.filter((h) => h.result === 'draw').length,
    };
    const side = SIDE[role];
    // a partida que esta tela simulou (recarregou a página no resultado: fica só o placar)
    const m = !r.wo && !r.desync ? duel.result : null;
    const myTeam = s.teams[role];
    const rivalTeam = s.teams[other(role)];
    const mine = myTeam?.color ?? 0;
    const theirs = rivalColor(mine, rivalTeam?.color ?? 0x3a7bd5);
    const colors: [number, number] = side === 0 ? [mine, theirs] : [theirs, mine];
    // gráficos e tabelas da partida nas cores do placar do duelo (antes de desenhar; volta pro da copa ao sair)
    setChartColors([colors[side], colors[side === 0 ? 1 : 0]], side);
    useEffect(() => () => setChartColors(null, 0), []);
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
    const actions = (
        <div className="row duel-share">
            {rivalGone && (
                <p className="duel-left-note" role="status" data-testid="duel-rival-left">
                    {t('duel.result.rivalLeft', { name: rival })}
                </p>
            )}
            <button
                type="button"
                className="btn primary big"
                data-testid="duel-rematch"
                disabled={s.rematch[role] || rivalGone}
                onClick={() => {
                    playSfx('select');
                    void duel.rematch();
                }}
            >
                {rivalGone
                    ? t('duel.result.rematch')
                    : s.rematch[role]
                      ? t('duel.result.rematchWait', { name: rival })
                      : s.rematch[other(role)]
                        ? t('duel.result.rematchAsk', { name: rival })
                        : t('duel.result.rematch')}
            </button>
            <button type="button" className="btn ghost" onClick={onHome}>
                {t('duel.result.home')}
            </button>
        </div>
    );
    // clubes com o mesmo nome: o nome do treinador
    const names = duelNames(s);
    return (
        <div className="duel-result">
            <span className="sr-only" data-testid="duel-result">
                {head}
            </span>
            {m && rivalTeam ? (
                <>
                    <ResultHero
                        match={m}
                        opponent={rivalTeam}
                        names={names}
                        mvpUid={matchMvp(m, side)?.uid ?? null}
                        stats={heroStats(m, t)}
                        duel={{
                            side,
                            stage: t('duel.title'),
                            title:
                                r.winner === role
                                    ? t('result.hero.win')
                                    : r.winner
                                      ? t('duel.result.lossTitle')
                                      : t('duel.result.drawTitle'),
                            sub: head,
                            colors,
                        }}
                        actions={actions}
                    />
                    <MatchDetails match={m} names={names} side={side} />
                </>
            ) : (
                <div className="panel duel-final-box">
                    <h1 className={r.winner === role ? 'won' : r.winner ? 'lost' : ''}>{head}</h1>
                    {!r.wo && !r.desync && (
                        <div className="duel-final">
                            <span>{names[0]}</span>
                            <b data-testid="duel-final">
                                {r.score[0]} x {r.score[1]}
                            </b>
                            <span>{names[1]}</span>
                            {r.shootout && (
                                <small className="muted">
                                    {t('match.penalties', { a: r.shootout[0], b: r.shootout[1] })}
                                </small>
                            )}
                        </div>
                    )}
                    {actions}
                </div>
            )}
            {history.length > 0 && (
                <div className="panel duel-history">
                    <h2>{t('duel.result.history')}</h2>
                    {vsRival.length > 0 && (
                        <p className="duel-h2h" data-testid="duel-h2h">
                            <span className="muted">{t('duel.result.h2hLabel', { name: rival })}</span>{' '}
                            <b>{t('duel.result.h2h', { w: h2h.w, l: h2h.l, name: rival })}</b>
                            {h2h.d > 0 && <span className="muted"> · {tn('duel.result.h2hDraws', h2h.d)}</span>}
                        </p>
                    )}
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
            <BetaNote />
        </div>
    );
}

/** Tela do duelo: criar sala, entrar (com login), lobby, time/draft, prévia, partida e resultado. */
export function Duel() {
    const { t } = useT();
    const go = useGame((g) => g.go);
    const recordDuel = useGame((g) => g.recordDuel);
    const recordDuelDex = useGame((g) => g.recordDuelDex);
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
        // Pokédex: quem jogou pelo seu lado vira "jogou" (partida anulada ou W.O. não conta)
        if (duel.result && !r.desync && !r.wo) recordDuelDex(duel.result, mine);
    }, [s?.phase, s?.game, role]);

    const home = () => {
        duel.leave(s?.phase === 'done');
        setUrl(null, false);
        go('home');
    };

    // etapa nova (lobby, draft, escalação, partida, resultado) abre no topo, como as telas do Copa
    const showMatch =
        !!s && (s.phase === 'match' || (s.phase === 'done' && !s.result?.wo && !s.result?.desync && seen !== s.game));
    const step = !s ? 'none' : showMatch ? 'match' : s.phase;
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda a cada troca de etapa
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step, s?.game]);

    let body: React.ReactNode;
    if (!peer) {
        body = <DuelEntry code={code} />;
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
    else if (showMatch) body = <DuelMatch key={s.game} onSeeResult={() => setSeen(s.game)} />;
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
            {s && role && s.phase !== 'lobby' && <VersionBanner s={s} />}
            {body}
            <LeaveConfirm />
        </div>
    );
}
