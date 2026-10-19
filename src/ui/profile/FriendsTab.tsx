import { type CSSProperties, useEffect, useState } from 'react';
import { signInWithGoogle, useCloud } from '../../cloud/cloud';
import {
    type AskResult,
    type AskTarget,
    type FriendRow,
    formatFriendCode,
    friendAction,
    friendsOnline,
    groupFriends,
    isFriendCode,
    normalizeFriendCode,
    refreshFriends,
    useFriends,
} from '../../friends/api';
import { playSfx } from '../../game/audio';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { duelLink, isLocalDuel } from '../duel/Duel';
import { hexCss } from './club';
import './friends.css';

const stripe = (color: string) => ({ '--tc': hexCss(clubColorHex(color)) }) as CSSProperties;

/** Texto do resultado de um pedido ("Pedido enviado pra Davi."). */
function useAskText() {
    const { t } = useT();
    return (r: AskResult) => t(`friends.ask.${r.status}` as TKey, { name: r.trainer ?? '' });
}

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
    return (
        <span className="fr-who">
            <b>{r.trainer}</b>
            <small>
                {r.club} · {r.club_tag}
            </small>
        </span>
    );
}

function FriendLine({ r }: { r: FriendRow }) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    return (
        <li className={`fr-row${open ? ' open' : ''}`} style={stripe(r.club_color)} data-testid="friend-row">
            <Who r={r} />
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
                    <HudIcon kind="friendAdd" /> {t('friends.add')}
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

/**
 * Botão "Adicionar amigo" do cartão do treinador (o rival do Duelo). `peer` = quem está na sala: o `id` é o da conta
 * dele (o servidor procura o cartão por ele), `anon` = jogando sem conta Google (não dá pra adicionar).
 */
export function AddFriendButton({ peer }: { peer: { id: string; anon?: boolean } }) {
    const { t } = useT();
    const askText = useAskText();
    const user = useCloud((s) => s.user);
    const [state, setState] = useState<'idle' | 'busy' | AskResult>('idle');
    if (!friendsOnline()) return null;
    const blocked = !user ? t('friends.button.needGoogle') : peer.anon ? t('friends.button.rivalAnon') : null;
    const done = typeof state === 'object' && state.status !== 'offline';
    return (
        <div className="fr-addbtn">
            <button
                type="button"
                className="btn primary"
                disabled={!!blocked || state === 'busy' || done}
                data-testid="add-friend"
                onClick={async () => {
                    setState('busy');
                    playSfx('select');
                    const target: AskTarget = { user: peer.id };
                    setState(await friendAction((s) => s.ask(target)));
                }}
            >
                <HudIcon kind={done ? 'check' : 'friendAdd'} />{' '}
                {state === 'busy'
                    ? t('friends.button.sending')
                    : !done
                      ? t('friends.button.add')
                      : state.status === 'amigos' || state.status === 'ja_amigos'
                        ? t('friends.listTitle')
                        : t('friends.sentLine')}
            </button>
            {(blocked || typeof state === 'object') && (
                <small className="fr-hint" role="status">
                    {blocked ?? askText(state as AskResult)}
                </small>
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
