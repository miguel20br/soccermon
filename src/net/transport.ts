import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

/**
 * Conversa do duelo atrás de uma interface pequena (docs/planos/multiplayer.md, "Transporte"): mandar uma mensagem
 * pra sala, ouvir as mensagens e saber quem está na sala. Duas implementações: BroadcastChannel (duas abas no mesmo
 * PC, sem internet nem login, usada nos testes) e Supabase Realtime (canal privado `duel:<sala>`, só logado).
 */
export interface NetMsg {
    /** Tipo da mensagem (hello, state, intent, clock, emote, full, bye). */
    t: string;
    /** Quem mandou (id do jogador na sala). */
    from: string;
    /** Só pra este id (os outros ignoram). */
    to?: string;
    [k: string]: unknown;
}

export interface DuelTransport {
    readonly me: string;
    send(msg: Omit<NetMsg, 'from'>): void;
    onMessage(cb: (msg: NetMsg) => void): () => void;
    /** Ids dos outros que estão na sala agora (muda quando alguém entra, sai ou some). */
    onPeers(cb: (ids: string[]) => void): () => void;
    /** O canal caiu e voltou (`lostAt` = quando caiu): quem aplica as regras sabe que esteve fora. */
    onRejoin?(cb: (lostAt: number) => void): void;
    close(): void;
}

/** Sem sinal de vida por esse tempo, o outro é dado como fora da sala. */
const PEER_TIMEOUT_MS = 6000;
const BEAT_MS = 2000;

/** Base comum: lista de ouvintes e a lista de presentes. */
function listeners(me: string) {
    const msgs = new Set<(m: NetMsg) => void>();
    const peerCbs = new Set<(ids: string[]) => void>();
    let peers: string[] = [];
    return {
        deliver(m: NetMsg) {
            if (m.from === me || (m.to && m.to !== me)) return;
            for (const cb of msgs) cb(m);
        },
        setPeers(ids: string[]) {
            const next = [...new Set(ids)].filter((id) => id !== me).sort();
            if (next.join() === peers.join()) return;
            peers = next;
            for (const cb of peerCbs) cb(peers);
        },
        onMessage(cb: (m: NetMsg) => void) {
            msgs.add(cb);
            return () => msgs.delete(cb);
        },
        onPeers(cb: (ids: string[]) => void) {
            peerCbs.add(cb);
            cb(peers);
            return () => peerCbs.delete(cb);
        },
    };
}

/** Duas abas do mesmo navegador: BroadcastChannel + batida de presença. */
export function localTransport(room: string, me: string): DuelTransport {
    const bc = new BroadcastChannel(`soccermon-duel-${room}`);
    const base = listeners(me);
    const seen = new Map<string, number>();
    const refresh = () => {
        const now = Date.now();
        for (const [id, at] of seen) if (now - at > PEER_TIMEOUT_MS) seen.delete(id);
        base.setPeers([...seen.keys()]);
    };
    bc.onmessage = (e: MessageEvent<NetMsg>) => {
        const m = e.data;
        if (!m || typeof m.from !== 'string') return;
        if (m.t === 'bye') seen.delete(m.from);
        else seen.set(m.from, Date.now());
        refresh();
        if (m.t !== 'beat') base.deliver(m);
    };
    const post = (m: Omit<NetMsg, 'from'>) => bc.postMessage({ ...m, from: me });
    post({ t: 'beat' });
    const beat = setInterval(() => {
        post({ t: 'beat' });
        refresh();
    }, BEAT_MS);
    return {
        me,
        send: post,
        onMessage: base.onMessage,
        onPeers: base.onPeers,
        close() {
            clearInterval(beat);
            post({ t: 'bye' });
            bc.close();
        },
    };
}

/**
 * Supabase Realtime: canal privado (a política RLS em realtime.messages deixa só quem está logado), Broadcast pras
 * mensagens e Presence pra quem está na sala. Celular que volta do segundo plano (foi no WhatsApp mandar o link) pode
 * voltar com o canal fechado: na volta pra aba, se não estiver inscrito, abre de novo.
 */
export function supabaseTransport(client: SupabaseClient, room: string, me: string): DuelTransport {
    const base = listeners(me);
    let channel: RealtimeChannel | null = null;
    let closed = false;
    const queue: Omit<NetMsg, 'from'>[] = [];
    let joined = false;
    /** Quando o canal caiu (0 = nunca entrou ou está no ar). */
    let lostAt = 0;
    let everJoined = false;
    const rejoin = new Set<(lostAt: number) => void>();

    const open = async () => {
        if (closed) return;
        if (joined) lostAt = Date.now();
        joined = false;
        if (channel) await client.removeChannel(channel);
        await client.realtime.setAuth();
        const ch = client.channel(`duel:${room}`, {
            // ack: o servidor confirma cada envio (sem confirmação, tenta de novo uma vez)
            config: { private: true, broadcast: { self: false, ack: true }, presence: { key: me } },
        });
        channel = ch;
        ch.on('broadcast', { event: 'm' }, ({ payload }) => base.deliver(payload as NetMsg));
        ch.on('presence', { event: 'sync' }, () => base.setPeers(Object.keys(ch.presenceState())));
        ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                joined = true;
                if (everJoined) for (const cb of rejoin) cb(lostAt || Date.now());
                everJoined = true;
                lostAt = 0;
                await ch.track({ at: Date.now() });
                for (const m of queue.splice(0))
                    void ch.send({ type: 'broadcast', event: 'm', payload: { ...m, from: me } });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                if (joined) lostAt = Date.now();
                joined = false;
                if (!closed && status !== 'CLOSED') setTimeout(() => void open(), 2000);
            }
        });
    };
    const onVisible = () => {
        if (document.visibilityState === 'visible' && !joined) void open();
    };
    document.addEventListener('visibilitychange', onVisible);
    void open();

    return {
        me,
        send(m) {
            if (!channel || !joined) {
                // fora do ar: guarda as últimas (o estado mais novo basta; a fila não cresce sem fim)
                queue.push(m);
                if (queue.length > 20) queue.shift();
                return;
            }
            const ch = channel;
            const payload = { ...m, from: me };
            void ch.send({ type: 'broadcast', event: 'm', payload }).then((r) => {
                if (r !== 'ok' && !closed) void ch.send({ type: 'broadcast', event: 'm', payload });
            });
        },
        onMessage: base.onMessage,
        onPeers: base.onPeers,
        onRejoin(cb) {
            rejoin.add(cb);
        },
        close() {
            closed = true;
            document.removeEventListener('visibilitychange', onVisible);
            if (channel) void client.removeChannel(channel);
        },
    };
}
