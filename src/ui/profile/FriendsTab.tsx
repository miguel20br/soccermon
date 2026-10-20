import { type CSSProperties, useEffect, useState } from 'react';
import { signInWithGoogle, useCloud } from '../../cloud/cloud';
import {
    buildVitrine,
    CHALLENGE_MS,
    type FriendRow,
    formatFriendCode,
    friendAction,
    friends,
    friendsOnline,
    groupFriends,
    isFriendCode,
    normalizeFriendCode,
    publishVitrine,
    refreshFriends,
    useFriends,
} from '../../friends/api';
import { playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { duelLink, isLocalDuel } from '../duel/link';
import { useAskText } from './AddFriendButton';
import { hexCss } from './club';
import { friendInfo, usePlayerCard, usePublicPeer } from './PlayerCard';
import './friends.css';

const stripe = (color: string) => ({ '--tc': hexCss(clubColorHex(color)) }) as CSSProperties;

/** Recarrega a lista ao abrir e a cada 30 s enquanto a tela estiver aberta (o desafio vale 15 min). */
function useFriendsPoll() {
    const user = useCloud((s) => s.user);
    useEffect(() => {
        if (!user) {
            // saiu da conta: o código e a lista eram dela
            useFriends.setState({ status: 'off', code: null, rows: null });
            return;
        }
        void refreshFriends();
        const id = window.setInterval(() => void refreshFriends(), 30_000);
        return () => window.clearInterval(id);
    }, [user]);
}

/** "Desafiar": guarda o amigo e abre o Duelo; a sala que nascer chama ele (sendPendingChallenge). */
function startChallenge(r: FriendRow) {
    playSfx('select');
    useFriends.setState({ challenging: { code: r.code, trainer: r.trainer } });
    useGame.getState().go('duel');
}

const joinRoom = (room: string) => window.location.assign(duelLink(room, isLocalDuel()));

function Who({ r }: { r: FriendRow }) {
    const { t } = useT();
    return (
        <span className="fr-who">
            <b>
                {r.online && <i className="fr-online" role="img" aria-label={t('friends.online')} />}
                {r.trainer}
            </b>
            <small>
                {r.club} · {r.club_tag}
            </small>
        </span>
    );
}

function FriendLine({ r }: { r: FriendRow }) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    // o perfil abre quando a vitrine chega (sem ela, só o nome e o clube)
    const openProfile = async () => {
        if (busy) return;
        setBusy(true);
        const raw = await friends().profile(r.code);
        setBusy(false);
        usePlayerCard.getState().open(friendInfo(r, raw));
    };
    return (
        <li className={`fr-row${open ? ' open' : ''}`} style={stripe(r.club_color)} data-testid="friend-row">
            <button
                type="button"
                className="fr-open"
                aria-busy={busy}
                aria-label={t('profile.card.openAria', { name: r.trainer })}
                onClick={() => void openProfile()}
            >
                <Who r={r} />
            </button>
            <span className="fr-actions">
                {r.room ? (
                    <button type="button" className="btn primary" onClick={() => joinRoom(r.room!)}>
                        {t('friends.enter')}
                    </button>
                ) : (
                    <button type="button" className="btn primary" onClick={() => startChallenge(r)}>
                        <HudIcon kind="play" /> {t('friends.challenge')}
                    </button>
                )}
                <button
                    type="button"
                    className="btn fr-more"
                    aria-expanded={open}
                    aria-label={t('friends.more', { name: r.trainer })}
                    onClick={() => setOpen(!open)}
                >
                    <HudIcon kind="more" />
                </button>
            </span>
            {open && (
                <div className="fr-confirm">
                    <p>{t('friends.removeAsk', { name: r.trainer })}</p>
                    <div className="fr-confirm-btns">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => void friendAction((s) => s.remove(r.code))}
                        >
                            {t('friends.remove')}
                        </button>
                        <button
                            type="button"
                            className="btn danger"
                            onClick={() => void friendAction((s) => s.block(r.code))}
                        >
                            {t('friends.block')}
                        </button>
                        <button type="button" className="btn" onClick={() => setOpen(false)}>
                            {t('friends.cancel')}
                        </button>
                    </div>
                    <small className="muted">{t('friends.blockHint')}</small>
                </div>
            )}
        </li>
    );
}

function MyCode({ code }: { code: string | null }) {
    const { t } = useT();
    const [copied, setCopied] = useState(false);
    const text = code ? t('friends.shareText', { code: formatFriendCode(code) }) : '';
    return (
        <section className="panel fr-code bc-surface bc-stripe">
            <span className="bc-lbl">{t('friends.codeTitle')}</span>
            <b className="fr-code-num" data-testid="friend-code">
                {code ? formatFriendCode(code) : '···· ····'}
            </b>
            <div className="fr-code-btns">
                <button
                    type="button"
                    className="btn"
                    disabled={!code}
                    onClick={() =>
                        navigator.clipboard?.writeText(code!).then(
                            () => setCopied(true),
                            () => {},
                        )
                    }
                >
                    {copied ? t('friends.copied') : t('friends.copy')}
                </button>
                {'share' in navigator && (
                    <button
                        type="button"
                        className="btn"
                        disabled={!code}
                        onClick={() =>
                            navigator.share({ title: 'Soccermon', text, url: window.location.origin }).catch(() => {})
                        }
                    >
                        <HudIcon kind="upload" /> {t('friends.share')}
                    </button>
                )}
            </div>
            <small className="fr-hint">{t('friends.codeHint')}</small>
        </section>
    );
}

function AddByCode() {
    const { t } = useT();
    const askText = useAskText();
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const code = normalizeFriendCode(value);
    return (
        <form
            className="panel fr-add bc-surface"
            onSubmit={async (e) => {
                e.preventDefault();
                if (!isFriendCode(code) || busy) return;
                setBusy(true);
                const r = await friendAction((s) => s.ask({ code }));
                setBusy(false);
                setMsg(askText(r));
                if (r.status === 'enviado' || r.status === 'amigos') setValue('');
            }}
        >
            <label className="bc-lbl" htmlFor="fr-add-input">
                {t('friends.addTitle')}
            </label>
            <div className="fr-add-row">
                <input
                    id="fr-add-input"
                    value={code.length > 4 ? formatFriendCode(code) : code}
                    maxLength={9}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={t('friends.addPlaceholder')}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setMsg(null);
                    }}
                />
                <button type="submit" className="btn primary" disabled={!isFriendCode(code) || busy}>
                    <HudIcon kind="addFriend" /> {t('friends.add')}
                </button>
            </div>
            {msg && (
                <p className="fr-msg" role="status">
                    {msg}
                </p>
            )}
        </form>
    );
}

/** Perfil → Amigos: seu código, adicionar pelo código, pedidos, lista com Desafiar, remover e bloquear. */
export function FriendsTab() {
    const { t } = useT();
    useFriendsPoll();
    useEffect(() => {
        useFriends.setState({ listOpen: true });
        return () => useFriends.setState({ listOpen: false });
    }, []);
    const { code, rows, status } = useFriends();
    const user = useCloud((s) => s.user);

    if (!friendsOnline()) return <p className="panel fr-note">{t('friends.offline')}</p>;
    if (!user) {
        return (
            <section className="panel fr-note bc-surface">
                <p>{t('friends.needGoogle')}</p>
                <button type="button" className="btn primary" onClick={() => void signInWithGoogle()}>
                    {t('friends.login')}
                </button>
            </section>
        );
    }
    const g = groupFriends(rows ?? [], Date.now());

    return (
        <div className="fr">
            <MyCode code={code} />
            <AddByCode />

            {status === 'error' && (
                <p className="panel fr-note">
                    {t('friends.loadError')}{' '}
                    <button type="button" className="btn" onClick={() => void refreshFriends()}>
                        {t('friends.retry')}
                    </button>
                </p>
            )}

            {g.challenges.length > 0 && (
                <section className="panel fr-block fr-invites bc-surface">
                    <h2 className="bc-caption">{t('friends.challengesTitle')}</h2>
                    <ul className="fr-list">
                        {g.challenges.map((r) => (
                            <li key={r.code} className="fr-row" style={stripe(r.club_color)}>
                                <span className="fr-who">
                                    <b>{t('friends.challengeLine', { name: r.trainer })}</b>
                                    <small>
                                        {r.club} · {r.club_tag}
                                    </small>
                                </span>
                                <button type="button" className="btn primary" onClick={() => joinRoom(r.room!)}>
                                    {t('friends.enter')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {g.received.length > 0 && (
                <section className="panel fr-block bc-surface">
                    <h2 className="bc-caption">{t('friends.receivedTitle')}</h2>
                    <ul className="fr-list">
                        {g.received.map((r) => (
                            <li
                                key={r.code}
                                className="fr-row"
                                style={stripe(r.club_color)}
                                data-testid="friend-request"
                            >
                                <Who r={r} />
                                <span className="fr-actions">
                                    <button
                                        type="button"
                                        className="btn primary"
                                        onClick={() => void friendAction((s) => s.respond(r.code, true))}
                                    >
                                        <HudIcon kind="check" /> {t('friends.accept')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => void friendAction((s) => s.respond(r.code, false))}
                                    >
                                        {t('friends.decline')}
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="panel fr-block bc-surface">
                <h2 className="bc-caption">
                    {t('friends.listTitle')} <small>{t('friends.listCount', { n: g.friends.length })}</small>
                </h2>
                {g.friends.length === 0 ? (
                    <p className="fr-hint">{status === 'loading' ? '…' : t('friends.empty')}</p>
                ) : (
                    <ul className="fr-list">
                        {g.friends.map((r) => (
                            <FriendLine key={r.code} r={r} />
                        ))}
                    </ul>
                )}
            </section>

            {g.sent.length > 0 && (
                <section className="panel fr-block bc-surface">
                    <h2 className="bc-caption">{t('friends.sentTitle')}</h2>
                    <ul className="fr-list">
                        {g.sent.map((r) => (
                            <li key={r.code} className="fr-row dim" style={stripe(r.club_color)}>
                                <Who r={r} />
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => void friendAction((s) => s.remove(r.code))}
                                >
                                    {t('friends.cancel')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {g.blocked.length > 0 && (
                <details className="panel fr-block fr-blocked">
                    <summary className="bc-lbl">{t('friends.blockedTitle', { n: g.blocked.length })}</summary>
                    <ul className="fr-list">
                        {g.blocked.map((r) => (
                            <li key={r.code} className="fr-row dim" style={stripe(r.club_color)}>
                                <Who r={r} />
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => void friendAction((s) => s.unblock(r.code))}
                                >
                                    {t('friends.unblock')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

/** Na Home (cartão do Duelo): "Davi te chamou pro Duelo · Entrar". Também mantém o cartão de amigo em dia. */
export function FriendChallenge() {
    const { t } = useT();
    useFriendsPoll();
    const rows = useFriends((s) => s.rows);
    const first = groupFriends(rows ?? [], Date.now()).challenges[0];
    if (!first) return null;
    return (
        <div className="fr-home" style={stripe(first.club_color)} data-testid="friend-challenge">
            <HudIcon kind="friends" />
            <span>{t('friends.challengeLine', { name: first.trainer })}</span>
            <button type="button" className="btn primary" onClick={() => joinRoom(first.room!)}>
                {t('friends.enter')}
            </button>
        </div>
    );
}

/**
 * Aviso por cima de qualquer tela: "Davi te chamou pro Duelo · Entrar". Chega na hora pelo Realtime (startFriendsLive)
 * e vale enquanto o convite valer (15 min). Não aparece na Home, no Duelo nem com a aba Amigos aberta (já está na tela).
 */
export function FriendInvite() {
    const { t } = useT();
    const screen = useGame((s) => s.screen);
    const rows = useFriends((s) => s.rows);
    const dismissed = useFriends((s) => s.dismissed);
    const [, tick] = useState(0);
    const first = groupFriends(rows ?? [], Date.now()).challenges.find((r) => !dismissed.includes(r.room!));
    // some sozinho quando o convite vence
    useEffect(() => {
        if (!first?.room_at) return;
        const left = Date.parse(first.room_at) + CHALLENGE_MS - Date.now();
        const id = window.setTimeout(() => tick((n) => n + 1), Math.max(1000, left));
        return () => window.clearTimeout(id);
    }, [first?.room_at]);
    const listOpen = useFriends((s) => s.listOpen);
    const shown = screen !== 'home' && screen !== 'duel' && !listOpen ? first : undefined;
    const room = shown?.room;
    useEffect(() => {
        if (room) playSfx('select');
    }, [room]);
    if (!first || !shown) return null;
    const close = () => useFriends.setState((s) => ({ dismissed: [...s.dismissed, first.room!] }));
    return (
        <div className="fr-toast" style={stripe(first.club_color)} role="alert" data-testid="friend-invite">
            <HudIcon kind="friends" />
            <span className="fr-who">
                <b>{t('friends.challengeLine', { name: first.trainer })}</b>
                <small>
                    {first.club} · {first.club_tag}
                </small>
            </span>
            <button type="button" className="btn primary" onClick={() => joinRoom(first.room!)}>
                {t('friends.enter')}
            </button>
            <button type="button" className="btn fr-toast-x" onClick={close} aria-label={t('common.ui.close')}>
                <HudIcon kind="close" />
            </button>
        </div>
    );
}

/** Mantém em dia a vitrine que os amigos veem no seu perfil (só com conta Google e código de amigo). */
export function FriendVitrine() {
    const pub = usePublicPeer();
    const code = useFriends((s) => s.code);
    const career = useGame((s) => s.career);
    const records = useGame((s) => s.records);
    const hall = useGame((s) => s.hall);
    const dex = useGame((s) => s.dex);
    const duels = useGame((s) => s.duels);
    useEffect(() => {
        if (!code) return;
        // espera a partida/tela assentar: a Pokédex muda várias vezes seguidas
        const id = window.setTimeout(
            () => void publishVitrine(buildVitrine(pub, { career, records, hall, dex, duels })),
            3000,
        );
        return () => window.clearTimeout(id);
    }, [code, pub, career, records, hall, dex, duels]);
    return null;
}
