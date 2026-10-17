import { create } from 'zustand';
import { realtimeClient } from '../cloud/cloud';
import { ENGINE_VERSION } from '../engine/config';
import type { MatchResult } from '../engine/runners/batch-runner';
import { SNAP_STRIDE } from '../engine/state';
import { EventBus } from '../game/EventBus';
import type { PlaybackSpeed } from '../store/game-store';
import { snapAt } from '../ui/match-view';
import {
    clockAdjust,
    type DuelMode,
    type EmoteKind,
    emoteAllowed,
    type Intent,
    newShared,
    other,
    type Peer,
    ROLES,
    type Role,
    reduce,
    roomCode,
    type Shared,
    tickTimers,
} from './duel-state';
import { checkReveal, makeChain, matchSeedOf, randomSecret, SEG_TICKS, segmentOf, segmentSeeds } from './seal';
import { type DuelTransport, localTransport, type NetMsg, supabaseTransport } from './transport';

/**
 * A sala do duelo rodando: conversa (transporte), quem aplica as regras (o host; se ele sumir, o convidado), os
 * lacres, o relógio e os emotes. A tela lê tudo pelo `useDuel`. Uma sala por vez.
 */

export type DuelStatus = 'idle' | 'connecting' | 'live' | 'full' | 'left';

export interface DuelView {
    status: DuelStatus;
    room: string | null;
    local: boolean;
    me: string;
    role: Role | null;
    shared: Shared | null;
    /** Quem está na sala agora (eu sempre). */
    online: Record<Role, boolean>;
    /** Relógio da sala − o meu (ms). */
    offset: number;
    /** Seed da partida (sai dos lacres do trecho 1 dos dois). */
    matchSeed: string | null;
    /** Último emote do rival (some sozinho). */
    emote: { kind: EmoteKind; role: Role; at: number } | null;
    muted: boolean;
}

export const useDuel = create<DuelView>(() => ({
    status: 'idle',
    room: null,
    local: false,
    me: '',
    role: null,
    shared: null,
    online: { host: false, guest: false },
    offset: 0,
    matchSeed: null,
    emote: null,
    muted: false,
}));

export const roomNow = () => Date.now() + useDuel.getState().offset;

const LOOP_MS = 500;
const CLOCK_MS = 2500;
const REVEAL_RETRY_MS = 2000;

// ------------------------------------------------------------------ guardar a sala (voltar depois de cair)

interface Kept {
    role: Role;
    shared: Shared;
    /** Topo da corrente de cada partida da sala (nº da partida → segredo). */
    tops: Record<number, string>;
    recorded?: number[];
}
const keptKey = (room: string, me: string) => `soccermon-duel:${room}:${me}`;
function readKept(room: string, me: string): Kept | null {
    try {
        const raw = localStorage.getItem(keptKey(room, me));
        return raw ? (JSON.parse(raw) as Kept) : null;
    } catch {
        return null;
    }
}
function writeKept(room: string, me: string, k: Kept) {
    try {
        localStorage.setItem(keptKey(room, me), JSON.stringify(k));
    } catch {
        // sem localStorage: quem recarregar a página perde os lacres (e o W.O. resolve)
    }
}

/** Id do jogador na sala local (duas abas): um por aba, que sobrevive a recarregar a página. */
export function localId(): string {
    try {
        let id = sessionStorage.getItem('soccermon-duel-id');
        if (!id) {
            id = `l-${randomSecret().slice(0, 12)}`;
            sessionStorage.setItem('soccermon-duel-id', id);
        }
        return id;
    } catch {
        return `l-${randomSecret().slice(0, 12)}`;
    }
}

/** FNV-1a curto do snapshot (as posições), pra conferir que as duas partidas são a mesma. */
function snapHash(m: MatchResult, tick: number): string {
    const snap = snapAt(m.snapshots, tick);
    let h = 0x811c9dc5;
    const text = `${snap.tick}|${snap.score.join()}|${Array.from(snap.p, (v) => v.toFixed(3)).join()}`;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return (h >>> 0).toString(16);
}

/** IA técnica no intervalo de quem caiu: tira o mais cansado (abaixo de 80%) e põe o primeiro do banco. */
export function aiHalftimeSub(m: MatchResult, side: 0 | 1, bench: string[], htTick: number) {
    const snap = snapAt(m.snapshots, htTick);
    const used = new Set<string>();
    const rows = m.roster
        .filter((r) => r.team === side && r.role !== 'GK')
        .map((r) => {
            let uid = r.uid;
            for (const e of m.events) {
                if (e.tick > htTick) break;
                if (e.type === 'sub' && e.outIdx === r.idx) {
                    uid = e.inUid;
                    used.add(e.inUid);
                }
            }
            return { uid, energy: snap.p[r.idx * SNAP_STRIDE + 6] ?? 1 };
        })
        .sort((a, b) => a.energy - b.energy);
    const tired = rows[0];
    const inUid = bench.find((u) => !used.has(u));
    return tired && tired.energy < 0.8 && inUid ? { outUid: tired.uid, inUid } : null;
}

// ------------------------------------------------------------------ sessão

class DuelSession {
    private transport: DuelTransport | null = null;
    private loop = 0;
    private lastClock = 0;
    private chain: string[] = [];
    private chainGame = 0;
    private kept: Kept | null = null;
    private revealSent = new Map<number, number>();
    private emoteSent = { any: -Infinity, grito: -Infinity };
    private emoteGot: Record<Role, { any: number; grito: number }> = {
        host: { any: -Infinity, grito: -Infinity },
        guest: { any: -Infinity, grito: -Infinity },
    };
    private seedFor = '';
    /** O que a tela da partida informa (tick na tela e a partida que está rodando). */
    tick = 0;
    result: MatchResult | null = null;
    /** Tela de partida rodando (o relógio só corrige com a bola rolando). */
    playing = false;
    private myPeer: Peer | null = null;

    get view() {
        return useDuel.getState();
    }

    private set(patch: Partial<DuelView>) {
        useDuel.setState(patch);
    }

    /** Cria a sala (quem cria é o host e escolhe modo e velocidade). */
    async create(peer: Peer, mode: DuelMode, speed: PlaybackSpeed, local: boolean): Promise<string> {
        const room = roomCode((n) => {
            const b = new Uint32Array(1);
            crypto.getRandomValues(b);
            return b[0] % n;
        });
        const shared = newShared(room, peer, mode, speed, randomSecret().slice(0, 16));
        this.kept = { role: 'host', shared, tops: {} };
        writeKept(room, peer.id, this.kept);
        this.open(room, peer, local, 'host', shared);
        return room;
    }

    /** Entra (ou volta) numa sala pelo código. */
    join(room: string, peer: Peer, local: boolean) {
        if (this.view.room === room && this.transport) {
            this.myPeer = peer;
            return;
        }
        this.kept = readKept(room, peer.id);
        this.open(room, peer, local, this.kept?.role ?? null, this.kept?.shared ?? null);
    }

    private open(room: string, peer: Peer, local: boolean, role: Role | null, shared: Shared | null) {
        this.close();
        this.myPeer = peer;
        this.revealSent.clear();
        this.chain = [];
        this.chainGame = 0;
        this.seedFor = '';
        this.set({
            status: role ? 'live' : 'connecting',
            room,
            local,
            me: peer.id,
            role,
            shared,
            online: { host: role === 'host', guest: role === 'guest' },
            matchSeed: null,
            emote: null,
            offset: role === 'host' ? 0 : this.view.offset,
        });
        let t: DuelTransport;
        if (local) t = localTransport(room, peer.id);
        else {
            const client = realtimeClient();
            if (!client) {
                this.set({ status: 'left' });
                return;
            }
            t = supabaseTransport(client, room, peer.id);
        }
        this.transport = t;
        t.onMessage((m) => this.onMessage(m));
        t.onPeers((ids) => this.onPeers(ids));
        t.send({ t: 'hello', peer, rev: shared?.rev ?? 0 });
        this.loop = window.setInterval(() => this.onLoop(), LOOP_MS);
        if (shared) void this.afterState(shared);
    }

    close() {
        clearInterval(this.loop);
        this.transport?.close();
        this.transport = null;
    }

    /** Sai da sala (voltar pra Home). `forget` apaga o que estava guardado (sala que já acabou). */
    leave(forget = false) {
        const { room, me } = this.view;
        this.close();
        if (forget && room) {
            try {
                localStorage.removeItem(keptKey(room, me));
            } catch {
                // nada
            }
        }
        this.playing = false;
        this.result = null;
        this.set({ status: 'idle', room: null, role: null, shared: null, matchSeed: null, emote: null });
    }

    /** Eu aplico as regras agora? (host; o convidado só quando o host está fora). */
    get authority(): boolean {
        const { role, online } = this.view;
        return role === 'host' || (role === 'guest' && !online.host);
    }

    private ctx() {
        const s = this.view.shared;
        const m = this.result;
        const htTick = m?.events.find((e) => e.type === 'halftime')?.tick;
        return {
            now: roomNow(),
            present: this.view.online,
            tick: this.tick,
            htTick,
            aiSub: (side: 0 | 1) => {
                const team = s?.teams[side === 0 ? 'host' : 'guest'];
                return m && team && htTick !== undefined
                    ? aiHalftimeSub(
                          m,
                          side,
                          team.bench.map((p) => p.uid),
                          htTick,
                      )
                    : null;
            },
            newSeed: randomSecret().slice(0, 16),
        };
    }

    /** Minha intenção: aplico se sou eu quem aplica; senão mando pra quem aplica. */
    dispatch(i: Intent) {
        const { role, shared } = this.view;
        if (!role || !shared) return;
        if (this.authority) this.applyIntent(i, role);
        else this.transport?.send({ t: 'intent', intent: i });
    }

    private async applyIntent(i: Intent, by: Role) {
        let s = this.view.shared;
        if (!s) return;
        if (i.k === 'reveal') {
            const commit = s.commits[by];
            if (!commit || !(await checkReveal(commit, i.seg, i.x))) return;
            s = this.view.shared;
            if (!s) return;
        }
        const next = reduce(s, i, by, this.ctx());
        if (next !== s) this.publish(next);
    }

    private publish(s: Shared) {
        this.adopt(s);
        this.transport?.send({ t: 'state', shared: s });
    }

    private adopt(s: Shared) {
        const cur = this.view.shared;
        if (cur && (s.room !== cur.room || s.rev <= cur.rev)) return;
        const me = this.view.me;
        const role = ROLES.find((r) => s.peers[r]?.id === me) ?? null;
        // quem está na sala: a lista de presentes pode ter chegado antes de o estado dizer quem é quem
        const online = { host: false, guest: false };
        for (const r of ROLES) online[r] = r === role || (!!s.peers[r] && this.peerIds.includes(s.peers[r]!.id));
        this.set({ shared: s, role, online, status: role ? 'live' : this.view.status });
        if (role) {
            this.kept = { ...(this.kept ?? { tops: {} }), role, shared: s };
            writeKept(s.room, me, this.kept);
        }
        void this.afterState(s);
    }

    /** Depois de um estado novo: lacre da partida, seed e o que mais depende dele. */
    private async afterState(s: Shared) {
        const role = this.view.role;
        if (!role || !this.kept) return;
        // corrente da partida atual (o topo fica guardado: recarregar a página não perde os lacres)
        if (this.chainGame !== s.game) {
            let top = this.kept.tops[s.game];
            if (!top) {
                top = randomSecret();
                this.kept.tops = { [s.game]: top };
                writeKept(s.room, this.view.me, this.kept);
            }
            this.chainGame = s.game;
            this.chain = await makeChain(top);
            this.revealSent.clear();
        }
        const h = s.reveals.host[1];
        const g = s.reveals.guest[1];
        const key = `${s.game}|${h}|${g}`;
        if (s.phase === 'match' && h && g && this.seedFor !== key) {
            this.seedFor = key;
            const seeds = await segmentSeeds(s.room, s.reveals.host as string[], s.reveals.guest as string[]);
            this.set({ matchSeed: matchSeedOf(seeds) });
        }
        if (s.phase !== 'match') this.set({ matchSeed: null });
    }

    /** "Pronto" do lobby leva o lacre (x[0]). */
    async setReady(ready: boolean) {
        const s = this.view.shared;
        if (!s) return;
        if (this.chainGame !== s.game || !this.chain.length) await this.afterState(s);
        this.dispatch({ k: 'ready', ready, commit: this.chain[0] });
    }

    sendEmote(kind: EmoteKind): boolean {
        const now = Date.now();
        if (!emoteAllowed(this.emoteSent, kind, now)) return false;
        this.emoteSent = { any: now, grito: kind === 'grito' ? now : this.emoteSent.grito };
        this.transport?.send({ t: 'emote', kind });
        return true;
    }

    setMuted(muted: boolean) {
        this.set({ muted });
    }

    private peerIds: string[] = [];

    private onPeers(ids: string[]) {
        this.peerIds = ids;
        const s = this.view.shared;
        const online = { host: false, guest: false };
        for (const r of ROLES) online[r] = r === this.view.role || (!!s?.peers[r] && ids.includes(s.peers[r]!.id));
        const was = this.view.online;
        this.set({ online });
        // alguém voltou: manda o estado (quem tiver o mais novo fica com ele)
        const back = ROLES.some((r) => online[r] && !was[r] && r !== this.view.role);
        if (back && s) this.transport?.send({ t: 'state', shared: s });
        if (ids.length && !s) this.transport?.send({ t: 'hello', peer: this.myPeer, rev: 0 });
    }

    private onMessage(m: NetMsg) {
        const s = this.view.shared;
        switch (m.t) {
            case 'hello': {
                const peer = m.peer as Peer | undefined;
                if (!peer || peer.id !== m.from) return;
                if (s) this.transport?.send({ t: 'state', shared: s });
                if (!s || !this.authority) return;
                const known = ROLES.find((r) => s.peers[r]?.id === peer.id);
                if (known) {
                    const next = reduce(s, { k: 'join', peer }, known, this.ctx());
                    if (next !== s) this.publish(next);
                    return;
                }
                // vaga do convidado: livre, ou no lobby com quem estava nela fora da sala
                const guest = s.peers.guest;
                const free = !guest || (s.phase === 'lobby' && !this.view.online.guest);
                if (!free) {
                    this.transport?.send({ t: 'full', to: peer.id });
                    return;
                }
                const base = guest ? { ...s, peers: { host: s.peers.host }, ready: { ...s.ready, guest: false } } : s;
                this.publish(reduce(base, { k: 'join', peer }, 'guest', this.ctx()));
                return;
            }
            case 'state': {
                const next = m.shared as Shared | undefined;
                if (next && typeof next.rev === 'number') this.adopt(next);
                return;
            }
            case 'intent': {
                if (!s || !this.authority) return;
                const by = ROLES.find((r) => s.peers[r]?.id === m.from);
                if (by && by !== this.view.role) void this.applyIntent(m.intent as Intent, by);
                return;
            }
            case 'clock': {
                if (this.authority) return;
                const now = Number(m.now);
                if (Number.isFinite(now)) this.set({ offset: now - Date.now() });
                const tick = Number(m.tick);
                if (s?.phase === 'match' && this.playing && Number.isFinite(tick)) {
                    const adj = clockAdjust(tick - this.tick, s.speed);
                    if (adj.seek) EventBus.emit('match:seek', tick);
                    EventBus.emit('match:rate', adj.rate);
                }
                return;
            }
            case 'emote': {
                const by = s ? ROLES.find((r) => s.peers[r]?.id === m.from) : undefined;
                const kind = m.kind as EmoteKind;
                if (!by || by === this.view.role) return;
                const now = Date.now();
                // limite também no recebimento: jogo modificado não inunda a tela
                if (!emoteAllowed(this.emoteGot[by], kind, now)) return;
                this.emoteGot[by] = { any: now, grito: kind === 'grito' ? now : this.emoteGot[by].grito };
                if (!this.view.muted) this.set({ emote: { kind, role: by, at: now } });
                return;
            }
            case 'full':
                if (!this.view.role) this.set({ status: 'full' });
                return;
        }
    }

    private lastHello = 0;

    private onLoop() {
        const s = this.view.shared;
        const now = Date.now();
        if (!s || !this.view.role) {
            // ainda sem resposta (o host pode nem ter aberto a sala): insiste no "oi" de vez em quando
            if (this.myPeer && now - this.lastHello > 3000) {
                this.lastHello = now;
                this.transport?.send({ t: 'hello', peer: this.myPeer, rev: 0 });
            }
            return;
        }
        if (this.authority) {
            const next = tickTimers(s, this.ctx());
            if (next !== s) this.publish(next);
            const otherOn = this.view.online[other(this.view.role)];
            if (otherOn && now - this.lastClock >= CLOCK_MS) {
                this.lastClock = now;
                this.transport?.send({ t: 'clock', tick: this.tick, now: roomNow(), speed: s.speed });
            }
        }
        if (s.phase === 'match') this.revealDue(s);
    }

    /**
     * Abre o trecho seguinte meio trecho antes de ele começar (dá tempo de a mensagem chegar sem travar a tela). O
     * trecho 1 abre logo no começo da partida (dele sai a seed).
     */
    private revealDue(s: Shared) {
        const role = this.view.role;
        if (!role || !this.chain.length || this.chainGame !== s.game) return;
        const upTo = s.reveals[role][1] ? segmentOf(this.tick + SEG_TICKS / 2) : 1;
        const now = Date.now();
        for (let k = 1; k <= upTo; k++) {
            const x = this.chain[k];
            const boundary = (k - 1) * SEG_TICKS;
            const hash = this.result && k > 1 && this.tick >= boundary ? snapHash(this.result, boundary) : undefined;
            const have = s.reveals[role][k] === x && (!hash || s.segHash[role][k] === hash);
            if (have) continue;
            if (now - (this.revealSent.get(k) ?? 0) < REVEAL_RETRY_MS) continue;
            this.revealSent.set(k, now);
            this.dispatch({ k: 'reveal', seg: k, x, hash });
        }
    }

    /** Partida terminou na minha tela: quem aplica grava o resultado. */
    ended(m: MatchResult) {
        this.dispatch({ k: 'ended', score: m.score, shootout: m.shootout, winner: m.winner });
    }

    /** Já gravei o histórico desta partida? (marca na hora). */
    markRecorded(game: number): boolean {
        if (!this.kept || this.kept.recorded?.includes(game)) return false;
        this.kept.recorded = [...(this.kept.recorded ?? []), game];
        const { room, me } = this.view;
        if (room) writeKept(room, me, this.kept);
        return true;
    }
}

export const duel = new DuelSession();

/** Perfil do jogador pra sala (nome, avatar, título, clube e as versões). */
export function makePeer(p: Omit<Peer, 'engine' | 'app'>): Peer {
    return { ...p, engine: ENGINE_VERSION, app: __APP_VERSION__ };
}
