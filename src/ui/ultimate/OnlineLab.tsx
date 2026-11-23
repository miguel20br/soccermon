import { useCallback, useEffect, useState } from 'react';
import { cloudEnabled, useCloud } from '../../cloud/cloud';
import { species } from '../../engine/data';
import { teamRecipe } from '../../engine/duel-validate';
import { viewInstance } from '../../engine/instance';
import { friendsOnline, refreshFriends, useFriends } from '../../friends/api';
import { useT } from '../../i18n/react';
import { publicInfo } from '../../league/api';
import { useGame } from '../../store/game-store';
import { utNow } from '../../store/ultimate/clock';
import { type UtRankRow, type UtTradeRow, utCall, utRanking } from '../../store/ultimate/online';
import { seasonN } from '../../store/ultimate/season';
import { applyTrade, tradeBlock } from '../../store/ultimate/trade';
import { canPlay, homeTeam } from '../../store/ultimate/ultimate';
import { MenuHead } from '../components/MenuHead';

/**
 * Troca de cartas e ranking do Time Ultimate (docs/planos/troca-e-ranking.md). Só em `?lab=troca` e `?lab=ranking-ut`
 * (dev e prévias). Sem servidor, sem conta Google ou sem a migração no ar, mostra o aviso e nada quebra.
 */

function useNote() {
    const { d } = useT();
    const o = d.ultimate.online;
    return (error: string) => {
        if (error === 'indisponivel') return o.unavailable;
        if (error === 'offline') return o.offline;
        if (error === 'precisa_conta') return o.needAccount;
        return (o.err as Record<string, string>)[error] ?? o.failed;
    };
}

const nameOf = (id: number) => species(id).name;

export function TradeLab({ onExit }: { onExit: () => void }) {
    const { d, t } = useT();
    const o = d.ultimate.online;
    const note = useNote();
    const user = useCloud((s) => s.user);
    const u = useGame((s) => s.ultimate);
    const rows = useFriends((s) => s.rows);
    const [trades, setTrades] = useState<UtTradeRow[]>([]);
    const [friend, setFriend] = useState('');
    const [msg, setMsg] = useState('');

    // biome-ignore lint/correctness/useExhaustiveDependencies: note e t mudam só com o idioma
    const load = useCallback(async () => {
        const r = await utCall<{ rows: UtTradeRow[] }>('trocas');
        if (!r.ok) return setMsg(note(r.error));
        setTrades(r.data.rows);
        // aplica no save o que o servidor já fechou (idempotente: o uid da carta vem da troca)
        let n = 0;
        for (const row of r.data.rows) {
            if (!row.toApply) continue;
            useGame.setState({
                ultimate: applyTrade(useGame.getState().ultimate, row.toApply.lose, row.toApply.gain, row.id),
            });
            await utCall('aplicado', { id: row.id });
            n++;
        }
        if (n) setMsg(t('ultimate.online.applied', { n }));
    }, []);

    useEffect(() => {
        if (friendsOnline() && user) {
            void refreshFriends();
            void load();
        }
    }, [user, load]);

    if (!cloudEnabled || !user) {
        return (
            <section className="panel">
                <MenuHead title={o.tradeTitle} hud="crown" onBack={onExit} />
                <p className="muted">{o.needAccount}</p>
            </section>
        );
    }

    const friends = (rows ?? []).filter((r) => r.status === 'amigo');
    const act = async (action: string, body: Record<string, unknown>, ok = '') => {
        const r = await utCall(action, body);
        setMsg(r.ok ? ok : note(r.error));
        await load();
    };

    return (
        <section className="panel">
            <MenuHead title={o.tradeTitle} hud="crown" onBack={onExit} />
            {msg && <p role="status">{msg}</p>}

            <h3>{o.pickFriend}</h3>
            {friends.length ? (
                <select value={friend} onChange={(e) => setFriend(e.target.value)} aria-label={o.friend}>
                    <option value="">-</option>
                    {friends.map((f) => (
                        <option key={f.code} value={f.code}>
                            {f.trainer} · {f.club}
                        </option>
                    ))}
                </select>
            ) : (
                <p className="muted">{o.noFriends}</p>
            )}

            <h3>{o.pickCard}</h3>
            <ul>
                {u.cards.map((c) => {
                    const block = tradeBlock(u, c.uid);
                    return (
                        <li key={c.uid}>
                            {nameOf(c.speciesId)} · {viewInstance(c).overall}
                            {block ? (
                                <small className="muted"> ({o.block[block as keyof typeof o.block] ?? block})</small>
                            ) : (
                                <button
                                    type="button"
                                    disabled={!friend}
                                    onClick={() => act('propor', { code: friend, offerUid: c.uid }, o.sent)}
                                >
                                    {o.offer}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            <h3>{o.incoming}</h3>
            <IncomingList rows={trades.filter((r) => r.dir === 'in' && r.status === 'pending')} act={act} />

            <h3>{o.outgoing}</h3>
            {trades
                .filter((r) => r.dir === 'out' && r.status === 'pending')
                .map((r) => (
                    <p key={r.id}>
                        {r.friend?.trainer}: {nameOf(r.offer.speciesId)}{' '}
                        <button type="button" onClick={() => act('recusar', { id: r.id })}>
                            {o.cancel}
                        </button>
                    </p>
                ))}
        </section>
    );
}

function IncomingList({
    rows,
    act,
}: {
    rows: UtTradeRow[];
    act: (a: string, b: Record<string, unknown>, ok?: string) => Promise<void>;
}) {
    const { d, t } = useT();
    const o = d.ultimate.online;
    const u = useGame((s) => s.ultimate);
    if (!rows.length) return <p className="muted">{o.none}</p>;
    return (
        <>
            {rows.map((r) => (
                <div key={r.id}>
                    <p>
                        {r.friend?.trainer}:{' '}
                        {t('ultimate.online.offered', { name: nameOf(r.offer.speciesId), level: r.offer.level })}
                    </p>
                    <select
                        defaultValue=""
                        onChange={(e) => e.target.value && act('aceitar', { id: r.id, giveUid: e.target.value })}
                        aria-label={o.accept}
                    >
                        <option value="">{o.accept}</option>
                        {u.cards
                            .filter((c) => !tradeBlock(u, c.uid))
                            .map((c) => (
                                <option key={c.uid} value={c.uid}>
                                    {nameOf(c.speciesId)} · {viewInstance(c).overall}
                                </option>
                            ))}
                    </select>{' '}
                    <button type="button" onClick={() => act('recusar', { id: r.id })}>
                        {o.decline}
                    </button>
                </div>
            ))}
        </>
    );
}

export function RankLab({ onExit }: { onExit: () => void }) {
    const { d, t } = useT();
    const o = d.ultimate.online;
    const note = useNote();
    const user = useCloud((s) => s.user);
    const u = useGame((s) => s.ultimate);
    const profile = useGame((s) => s.profile);
    const [list, setList] = useState<UtRankRow[] | null>(null);
    const [msg, setMsg] = useState('');
    const season = seasonN(utNow());

    // biome-ignore lint/correctness/useExhaustiveDependencies: note e t mudam só com o idioma
    const load = useCallback(async () => {
        const r = await utRanking(season);
        if (r.ok) setList(r.data);
        else setMsg(note(r.error));
    }, [season]);

    useEffect(() => {
        void load();
    }, [load]);

    const join = async () => {
        if (!canPlay(u)) return setMsg(o.needTeam);
        const info = publicInfo(profile);
        const team = teamRecipe(homeTeam(u, info.club, 0xc8102e));
        const r = await utCall('inscrever', { team, info });
        setMsg(r.ok ? o.joined : note(r.error));
        if (r.ok) await load();
    };

    return (
        <section className="panel">
            <MenuHead title={o.rankTitle} hud="crown" onBack={onExit} />
            {msg && <p role="status">{msg}</p>}
            {user && cloudEnabled ? (
                <button type="button" onClick={join}>
                    {o.joinTeam}
                </button>
            ) : (
                <p className="muted">{o.needAccount}</p>
            )}{' '}
            <button type="button" onClick={load}>
                {o.refresh}
            </button>
            {list && !list.length && <p className="muted">{o.rankEmpty}</p>}
            <ol>
                {(list ?? []).map((r) => (
                    <li key={r.pos} style={r.me ? { fontWeight: 700 } : undefined}>
                        {r.pos}. {r.trainer} · {r.club} · {t('ultimate.online.points', { n: r.points })}{' '}
                        <small className="muted">{t('ultimate.online.record', { g: r.games, w: r.wins })}</small>
                    </li>
                ))}
            </ol>
        </section>
    );
}
