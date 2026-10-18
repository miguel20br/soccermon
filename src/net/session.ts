import { create } from 'zustand';
import { realtimeClient } from '../cloud/cloud';
import { ENGINE_VERSION } from '../engine/config';
import { DRAFT_PICKS } from '../engine/draft';
import { DEFAULT_SPECIAL_LIMIT, type DuelTeamRecipe, type SpecialLimit } from '../engine/duel-validate';
import type { PokemonInstance } from '../engine/instance';
import type { MatchResult } from '../engine/runners/batch-runner';
import { EventBus } from '../game/EventBus';
import type { PlaybackSpeed } from '../store/game-store';
import { snapAt } from '../ui/match-view';
import {
    bestFor,
    clockAdjust,
    type DuelMode,
    type EmoteKind,
    emoteAllowed,
    type Intent,
    LOCAL_ONLY,
    leadTicks,
    newShared,
    type OrderBody,
    other,
    type Peer,
    type PreviewCfg,
    packOptions,
    packSealValue,
    ROLES,
    type Role,
    reduce,
    roomCode,
    type Shared,
    SIDE,
    specialLimitOf,
    tickTimers,
} from './duel-state';
import {
    abrir,
    checkReveal,
    holdTick,
    lacrar,
    makeChain,
    openedSegments,
    randomSecret,
    roundIdx,
    roundSeed,
    segIdx,
    segmentOfMinute,
    segmentSeeds,
} from './seal';
import { type DuelTransport, localTransport, type NetMsg, supabaseTransport } from './transport';

/**
 * A sala do duelo rodando: conversa (transporte), quem aplica as regras (o host; se ele sumir, o convidado), os
 * lacres, o relógio, as escolhas escondidas e os emotes. A tela lê tudo pelo `useDuel`. Uma sala por vez.
 *
 * Entrega (o Broadcast é "melhor esforço"): toda mensagem leva o número de quem mandou (`n`, com `b` = id desta
 * abertura da página). Quem vê um buraco pede de novo (`resend`) e quem mandou repete as importantes guardadas. O
 * estado inteiro vai a cada mudança e o relógio leva o `rev`, então um estado perdido se cura sozinho.
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
    /** Seeds dos trechos abertos pelos dois (vão pro `segmentSeeds` do motor); null antes do trecho 0. */
    segSeeds: string[] | null;
    /** Minhas escolhas de "cada um com seus pacotes" (só aqui até abrir no fim). */
    packPicks: PokemonInstance[];
    /** Já lacrei a escolha da fase atual (time pronto / prévia). */
    choiceSealed: boolean;
    /** Algo estranho nas ordens carimbadas pelo host (sumiu, atrasou, inventada, no passado). */
    suspect: string | null;
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
    segSeeds: null,
    packPicks: [],
    choiceSealed: false,
    suspect: null,
    emote: null,
    muted: false,
}));

export const roomNow = () => Date.now() + useDuel.getState().offset;

const LOOP_MS = 500;
const CLOCK_MS = 2500;
const RETRY_MS = 2000;
/** Mensagens importantes guardadas pra repetir quando o outro pedir. */
const OUTBOX = 120;
/** Folga do carimbo do host (ticks) antes de achar estranho. */
const STAMP_SLACK = 60;

type NetIntent = Intent | { k: 'openPicks'; picks: { uid: string; salt: string }[] };

// ------------------------------------------------------------------ guardar a sala (voltar depois de cair)

interface Kept {
    role: Role;
    shared: Shared;
    /** Topo da corrente de cada partida da sala (nº da partida → segredo). */
    tops: Record<number, string>;
    recorded?: number[];
    /** Escolhas lacradas de "cada um com seus pacotes" (partida, cartas e sais). */
    packs?: { game: number; picks: PokemonInstance[]; salts: string[] };
    /** Escolha lacrada da fase (time pronto ou prévia). */
    choice?: { game: number; phase: string; value: unknown; salt: string; seal: string };
    /** Ordens que eu dei (seq → tick pedido), pra conferir o carimbo do host. */
    sent?: { game: number; orders: Record<number, { tick: number; at: number; body: OrderBody; ht?: boolean }> };
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
        // sem localStorage: quem recarregar a página perde os lacres (e quem ficou pode pedir o W.O.)
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
export function snapHash(m: MatchResult, tick: number): string {
    const snap = snapAt(m.snapshots, tick);
    let h = 0x811c9dc5;
    const text = `${snap.tick}|${snap.score.join()}|${Array.from(snap.p, (v) => v.toFixed(3)).join()}`;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return (h >>> 0).toString(16);
}

// ------------------------------------------------------------------ sessão

class DuelSession {
    private transport: DuelTransport | null = null;
    private loop = 0;
    private lastClock = 0;
    private lastHello = 0;
    private chain: string[] = [];
    private chainGame = 0;
    private kept: Kept | null = null;
    private retry = new Map<string, number>();
    private emoteSent = { any: -Infinity, grito: -Infinity };
    private emoteGot: Record<Role, { any: number; grito: number }> = {
        host: { any: -Infinity, grito: -Infinity },
        guest: { any: -Infinity, grito: -Infinity },
    };
    private seedFor = '';
    private peerIds: string[] = [];
    private myPeer: Peer | null = null;
    // entrega
    private boot = randomSecret().slice(0, 8);
    private n = 0;
    private outbox: NetMsg[] = [];
    private got = new Map<string, { b: string; last: number; seen: Set<number> }>();
    private knownRival = new Set<string>();
    /** O que a tela da partida informa (tick e minuto na tela e a partida que está rodando). */
    tick = 0;
    minute = 0;
    result: MatchResult | null = null;
    /** Quantas ordens do log a `result` já tem (o hash do trecho diz com quantas foi feito). */
    resultLog = 0;
    /** Quantas seeds de trecho a `result` já tem (o hash do trecho k precisa das seeds 0..k-1). */
    resultSeeds = 0;
    /** Tela de partida rodando (o relógio só corrige com a bola rolando). */
    playing = false;
    /** Rascunho da prévia (lacrado sozinho se o tempo acabar). */
    previewDraft: PreviewCfg | null = null;

    get view() {
        return useDuel.getState();
    }

    private set(patch: Partial<DuelView>) {
        useDuel.setState(patch);
    }

    /** Topo da corrente da partida atual (o registro do duelo guarda o meu). */
    topOf(game: number) {
        return this.kept?.tops[game] ?? null;
    }

    /** Cria a sala (quem cria é o host e escolhe modo e velocidade). */
    async create(
        peer: Peer,
        mode: DuelMode,
        speed: PlaybackSpeed,
        local: boolean,
        specialLimit: SpecialLimit = DEFAULT_SPECIAL_LIMIT,
    ): Promise<string> {
        const room = roomCode((n) => {
            const b = new Uint32Array(1);
            crypto.getRandomValues(b);
            return b[0] % n;
        });
        const shared = newShared(room, peer, mode, speed, randomSecret().slice(0, 16), specialLimit);
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
        this.retry.clear();
        this.chain = [];
        this.chainGame = 0;
        this.seedFor = '';
        this.got.clear();
        this.knownRival.clear();
        this.set({
            status: role ? 'live' : 'connecting',
            room,
            local,
            me: peer.id,
            role,
            shared,
            online: { host: role === 'host', guest: role === 'guest' },
            segSeeds: null,
            packPicks: this.packsFor(shared)?.picks ?? [],
            choiceSealed: false,
            suspect: null,
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
        t.onMessage((m) => this.onRaw(m));
        t.onPeers((ids) => this.onPeers(ids));
        this.send({ t: 'hello', peer, rev: shared?.rev ?? 0 });
        this.loop = window.setInterval(() => this.onLoop(), LOOP_MS);
        if (shared) void this.afterState(shared);
    }

    close() {
        clearInterval(this.loop);
        this.transport?.close();
        this.transport = null;
    }

    /** Sai da sala (fecha o socket). `forget` apaga o que estava guardado (sala que já acabou). */
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
        this.set({ status: 'idle', room: null, role: null, shared: null, segSeeds: null, emote: null });
    }

    /** Eu aplico as regras agora? (host; o convidado só quando o host está fora). */
    get authority(): boolean {
        const { role, online } = this.view;
        return role === 'host' || (role === 'guest' && !online.host);
    }

    private ctx() {
        const m = this.result;
        return {
            now: roomNow(),
            present: this.view.online,
            tick: this.tick,
            htTick: m?.events.find((e) => e.type === 'halftime')?.tick,
            newSeed: randomSecret().slice(0, 16),
            atHold: this.atHold(),
        };
    }

    // ------------------------------------------------------------ entrega

    /** Manda numerado; as importantes ficam guardadas pra repetir. */
    private send(msg: Omit<NetMsg, 'from'>, important = false) {
        const full = { ...msg, n: ++this.n, b: this.boot } as unknown as NetMsg;
        if (important) {
            this.outbox.push(full);
            if (this.outbox.length > OUTBOX) this.outbox.shift();
        }
        this.transport?.send(full);
    }

    /** Recebe: descarta repetida, pede o que faltou e entrega. */
    private onRaw(m: NetMsg) {
        const n = Number(m.n);
        const b = String(m.b ?? '');
        if (Number.isInteger(n) && b) {
            let rec = this.got.get(m.from);
            if (!rec || rec.b !== b) {
                rec = { b, last: n - 1, seen: new Set() };
                this.got.set(m.from, rec);
            }
            if (rec.seen.has(n)) return;
            rec.seen.add(n);
            if (rec.seen.size > 400) rec.seen = new Set([...rec.seen].slice(-200));
            if (n > rec.last + 1) this.transport?.send({ t: 'resend', to: m.from, since: rec.last + 1, b });
            rec.last = Math.max(rec.last, n);
        }
        this.onMessage(m);
    }

    // ------------------------------------------------------------ intenções

    /** Minha intenção: aplico se sou eu quem aplica; senão mando pra quem aplica. */
    dispatch(i: NetIntent) {
        const { role, shared } = this.view;
        if (!role || !shared) return;
        if (this.authority) void this.applyIntent(i, role, true);
        else this.send({ t: 'intent', intent: i }, true);
    }

    /**
     * Confere o que precisa de conta (lacres) e aplica. Inválida = ignorada, sem acusar ninguém: o Broadcast não
     * diz quem mandou, e a verdadeira ainda pode chegar.
     */
    private async applyIntent(i: NetIntent, by: Role, mine = false) {
        if (!i || typeof i !== 'object') return;
        if (!mine && LOCAL_ONLY.has(i.k as Intent['k'])) return;
        let s = this.view.shared;
        if (!s) return;
        const commit = s.commits[by];
        let intent: Intent | null = i as Intent;
        if (i.k === 'reveal') {
            if (!commit || !(await checkReveal(commit, segIdx(i.seg), i.x))) return;
        } else if (i.k === 'roundReveal') {
            if (!commit || !(await checkReveal(commit, roundIdx(i.round), i.x))) return;
        } else if (i.k === 'choiceOpen') {
            const seal = s.choice?.seal[by];
            if (!seal || seal === '-' || !(await abrir(i.value, i.salt, seal))) return;
        } else if (i.k === 'openPicks') {
            intent = await this.checkPicks(s, by, i.picks);
            if (!intent) return;
        }
        s = this.view.shared;
        if (!s || !intent) return;
        const next = reduce(s, intent, by, this.ctx());
        if (next !== s) this.publish(next);
    }

    /** Confere as escolhas lacradas de pacote: cada carta estava no pacote da rodada e bate com o lacre. */
    private async checkPicks(s: Shared, by: Role, picks: { uid: string; salt: string }[]): Promise<Intent | null> {
        const d = s.draft;
        if (!d || !Array.isArray(picks) || picks.length !== DRAFT_PICKS) return null;
        const cards: PokemonInstance[] = [];
        for (let r = 0; r < DRAFT_PICKS; r++) {
            const seed = d.seeds[r];
            const p = picks[r];
            if (!seed || !p || !(await abrir(packSealValue(r, p.uid), p.salt, d.seals[by][r]))) return null;
            const card = packOptions(seed, r, cards, by).find((o) => o.uid === p.uid);
            if (!card) return null;
            cards.push(card);
        }
        return { k: 'picksOpened', cards };
    }

    private publish(s: Shared) {
        this.adopt(s);
        this.send({ t: 'state', shared: s });
    }

    /** Estado novo: fica com ele se for mais novo e não mexer no que é meu (lacre, segredos abertos). */
    private adopt(s: Shared) {
        const cur = this.view.shared;
        if (!s || typeof s !== 'object' || !s.peers || !s.reveals) return;
        if (cur && (s.room !== cur.room || s.rev <= cur.rev)) return;
        const me = this.view.me;
        const role = ROLES.find((r) => s.peers[r]?.id === me) ?? null;
        if (role && this.chain.length && this.chainGame === s.game) {
            const c = this.chain;
            const forged =
                (s.commits[role] && s.commits[role] !== c[0]) ||
                s.reveals[role].some((x, k) => x && x !== c[segIdx(k)]) ||
                s.roundReveals[role].some((x, r) => x && x !== c[roundIdx(r)]);
            if (forged) return;
        }
        // partida nova (revanche): nada da anterior vale (relógio, minuto e partida simulada)
        if (s.game !== this.view.shared?.game) {
            this.tick = 0;
            this.minute = 0;
            this.result = null;
            this.resultLog = 0;
            this.resultSeeds = 0;
        }
        const online = { host: false, guest: false };
        for (const r of ROLES) online[r] = r === role || (!!s.peers[r] && this.peerIds.includes(s.peers[r]!.id));
        this.set({ shared: s, role, online, status: role ? 'live' : this.view.status });
        if (role) {
            this.kept = { ...(this.kept ?? { tops: {} }), role, shared: s };
            writeKept(s.room, me, this.kept);
        }
        if (s.phase === 'match') this.checkOrders(s);
        void this.afterState(s);
    }

    /** Depois de um estado novo: corrente da partida, seed e as escolhas guardadas. */
    private async afterState(s: Shared) {
        const role = this.view.role;
        if (!role || !this.kept) return;
        if (this.chainGame !== s.game) {
            let top = this.kept.tops[s.game];
            if (!top) {
                top = randomSecret();
                this.kept.tops = { [s.game]: top };
                writeKept(s.room, this.view.me, this.kept);
            }
            this.chainGame = s.game;
            this.chain = await makeChain(top);
            this.retry.clear();
        }
        // seeds dos trechos: muda a cada trecho aberto pelos dois (a tela resimula com elas)
        const opened = openedSegments(s.reveals.host, s.reveals.guest);
        const key = `${s.game}|${opened}`;
        if (s.phase === 'match' && opened > 0 && this.seedFor !== key) {
            this.seedFor = key;
            const seeds = await segmentSeeds(s.room, s.reveals.host, s.reveals.guest);
            if (this.seedFor === key) this.set({ segSeeds: seeds });
        }
        if (s.phase !== 'match') this.set({ segSeeds: null });
        const c = this.kept.choice;
        this.set({
            packPicks: this.packsFor(s)?.picks ?? [],
            choiceSealed: !!c && c.game === s.game && c.phase === s.phase,
        });
    }

    private packsFor(s: Shared | null) {
        const p = this.kept?.packs;
        return s && p && p.game === s.game ? p : null;
    }

    /** "Pronto" do lobby leva o lacre (x[0]). */
    async setReady(ready: boolean) {
        const s = this.view.shared;
        if (!s) return;
        if (this.chainGame !== s.game || !this.chain.length) await this.afterState(s);
        this.dispatch({ k: 'ready', ready, commit: this.chain[0], specialLimit: specialLimitOf(s) });
    }

    /** Escolha de pacote: guarda a carta e o sal aqui e manda só o lacre. */
    async packPick(uid: string) {
        const s = this.view.shared;
        const d = s?.draft;
        if (!s || !d || !this.kept || s.mode !== 'pacotes' || !d.seeds[d.round] || d.seals[this.view.role!]?.[d.round])
            return;
        const packs = this.packsFor(s) ?? { game: s.game, picks: [], salts: [] };
        if (packs.picks.length !== d.round) return;
        const card = packOptions(d.seeds[d.round], d.round, packs.picks, this.view.role!).find((o) => o.uid === uid);
        if (!card) return;
        const { seal, salt } = await lacrar(packSealValue(d.round, uid));
        this.kept.packs = { game: s.game, picks: [...packs.picks, card], salts: [...packs.salts, salt] };
        writeKept(s.room, this.view.me, this.kept);
        this.set({ packPicks: this.kept.packs.picks });
        this.dispatch({ k: 'seal', round: d.round, seal });
    }

    /** Escolha escondida da fase (time pronto ou prévia): lacra aqui; abre sozinha quando os dois lacrarem. */
    async sealChoice(value: unknown) {
        const s = this.view.shared;
        if (!s || !this.kept || this.view.choiceSealed) return;
        const { seal, salt } = await lacrar(value);
        this.kept.choice = { game: s.game, phase: s.phase, value, salt, seal };
        writeKept(s.room, this.view.me, this.kept);
        this.set({ choiceSealed: true });
        this.dispatch({ k: 'choiceSeal', seal });
    }

    chooseTeam(recipe: DuelTeamRecipe) {
        return this.sealChoice(recipe);
    }

    /** Ordem do técnico: eu numero (seq do meu time) e guardo o tick pedido pra conferir o carimbo do host. */
    order(body: OrderBody, ht: boolean) {
        const s = this.view.shared;
        const role = this.view.role;
        if (!s || !role || !this.kept) return;
        const side = SIDE[role];
        const sent = this.kept.sent?.game === s.game ? this.kept.sent.orders : {};
        const seq =
            Math.max(0, ...s.log.filter((o) => o.team === side).map((o) => o.seq), ...Object.keys(sent).map(Number)) +
            1;
        sent[seq] = { tick: this.tick, at: Date.now(), body, ht };
        this.kept.sent = { game: s.game, orders: sent };
        writeKept(s.room, this.view.me, this.kept);
        this.dispatch({ k: 'order', order: body, tick: this.tick, seq, ht });
    }

    /**
     * Confere o carimbo do host (só quem não aplica): minha ordem não pode sumir, atrasar demais ou aparecer sem eu
     * ter mandado; a do rival não pode valer no passado. Estranho = aviso na tela, nunca W.O.
     */
    private checkOrders(s: Shared) {
        const role = this.view.role;
        if (!role || this.authority) return;
        const side = SIDE[role];
        const lead = leadTicks(s.speed);
        const sent = this.kept?.sent?.game === s.game ? this.kept.sent.orders : {};
        for (const o of s.log) {
            if (o.team === side) {
                const mine = sent[o.seq];
                if (!mine) this.set({ suspect: 'invented' });
                else if (!mine.ht && o.tick > mine.tick + lead + STAMP_SLACK * speedMultOf(s.speed))
                    this.set({ suspect: 'late' });
            } else {
                const key = `${s.game}:${o.seq}`;
                if (this.knownRival.has(key)) continue;
                this.knownRival.add(key);
                if (this.playing && o.tick < this.tick + lead / 2 - STAMP_SLACK) this.set({ suspect: 'past' });
            }
        }
    }

    sendEmote(kind: EmoteKind): boolean {
        const now = Date.now();
        if (!emoteAllowed(this.emoteSent, kind, now)) return false;
        this.emoteSent = { any: now, grito: kind === 'grito' ? now : this.emoteSent.grito };
        this.send({ t: 'emote', kind });
        return true;
    }

    setMuted(muted: boolean) {
        this.set({ muted });
    }

    private onPeers(ids: string[]) {
        this.peerIds = ids;
        const s = this.view.shared;
        const online = { host: false, guest: false };
        for (const r of ROLES) online[r] = r === this.view.role || (!!s?.peers[r] && ids.includes(s.peers[r]!.id));
        const was = this.view.online;
        this.set({ online });
        // alguém voltou: manda o estado (quem tiver o mais novo fica com ele)
        const back = ROLES.some((r) => online[r] && !was[r] && r !== this.view.role);
        if (back && s) this.send({ t: 'state', shared: s });
    }

    private onMessage(m: NetMsg) {
        const s = this.view.shared;
        switch (m.t) {
            case 'hello': {
                const peer = m.peer as Peer | undefined;
                if (!peer || peer.id !== m.from) return;
                if (s) this.send({ t: 'state', shared: s });
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
                    this.send({ t: 'full', to: peer.id });
                    return;
                }
                const base = guest ? { ...s, peers: { host: s.peers.host }, ready: { ...s.ready, guest: false } } : s;
                this.publish(reduce(base, { k: 'join', peer }, 'guest', this.ctx()));
                return;
            }
            case 'resend': {
                if (m.b !== this.boot) return;
                const since = Number(m.since);
                for (const o of this.outbox) if (Number(o.n) >= since) this.transport?.send(o);
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
                if (by && by !== this.view.role) void this.applyIntent(m.intent as NetIntent, by);
                return;
            }
            case 'clock': {
                if (this.authority) return;
                // o estado mais novo se perdeu: pede de novo
                if (s && Number(m.rev) > s.rev) this.send({ t: 'hello', peer: this.myPeer, rev: s.rev });
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

    /** Uma vez por tentativa a cada RETRY_MS (o que já está no estado não repete). */
    private due(key: string) {
        const now = Date.now();
        if (now - (this.retry.get(key) ?? 0) < RETRY_MS) return false;
        this.retry.set(key, now);
        return true;
    }

    private onLoop() {
        const s = this.view.shared;
        const role = this.view.role;
        const now = Date.now();
        if (!s || !role) {
            // ainda sem resposta (o host pode nem ter aberto a sala): insiste no "oi" de vez em quando
            if (this.myPeer && now - this.lastHello > 3000) {
                this.lastHello = now;
                this.send({ t: 'hello', peer: this.myPeer, rev: 0 });
            }
            return;
        }
        const otherOn = this.view.online[other(role)];
        if (this.authority) {
            const next = tickTimers(s, this.ctx());
            if (next !== s) this.publish(next);
            void this.computeRoundSeed(this.view.shared!);
        }
        // batida com o número da última mensagem (quem perdeu alguma percebe) e, de quem aplica, o relógio
        if (otherOn && now - this.lastClock >= CLOCK_MS) {
            this.lastClock = now;
            const cur = this.view.shared!;
            if (this.authority) this.send({ t: 'clock', tick: this.tick, now: roomNow(), rev: cur.rev });
            else this.send({ t: 'beat' });
        }
        if (this.chainGame !== s.game || !this.chain.length) return;
        this.selfDuties(this.view.shared!, role);
    }

    /** Quem aplica calcula a seed da rodada quando os dois abriram o segredo dela. */
    private async computeRoundSeed(s: Shared) {
        const d = s.draft;
        if (s.phase !== 'draft' || !d || d.round >= DRAFT_PICKS || d.seeds[d.round]) return;
        const h = s.roundReveals.host[d.round];
        const g = s.roundReveals.guest[d.round];
        if (!h || !g || !this.due(`seed-${s.game}-${d.round}`)) return;
        const seed = await roundSeed(s.room, d.round, h, g);
        await this.applyIntent({ k: 'roundSeed', round: d.round, seed }, this.view.role!, true);
    }

    /** O que cada um faz sozinho: abrir segredos, lacrar no tempo esgotado, abrir os lacres quando é hora. */
    private selfDuties(s: Shared, role: Role) {
        const now = roomNow();
        const d = s.draft;
        if (s.phase === 'draft' && d) {
            if (d.round < DRAFT_PICKS && !s.roundReveals[role][d.round] && this.due(`rr-${s.game}-${d.round}`))
                this.dispatch({ k: 'roundReveal', round: d.round, x: this.chain[roundIdx(d.round)] });
            if (s.mode === 'pacotes' && d.round < DRAFT_PICKS && d.seeds[d.round] && !d.seals[role][d.round]) {
                const packs = this.packsFor(s);
                if ((packs?.picks.length ?? 0) > d.round) {
                    // escolhi mas o lacre se perdeu: lacra de novo com o mesmo sal
                    if (this.due(`seal-${s.game}-${d.round}`))
                        void lacrar(packSealValue(d.round, packs!.picks[d.round].uid), packs!.salts[d.round]).then(
                            (x) => this.dispatch({ k: 'seal', round: d.round, seal: x.seal }),
                        );
                } else if (d.deadline[role] && now >= d.deadline[role] && this.due(`auto-${s.game}-${d.round}`)) {
                    const opts = packOptions(d.seeds[d.round], d.round, packs?.picks ?? [], role);
                    void this.packPick(bestFor(opts, d.round).uid);
                }
            }
            if (s.mode === 'pacotes' && d.round >= DRAFT_PICKS && !d.picks[role].length && this.due(`open-${s.game}`)) {
                const packs = this.packsFor(s);
                if (packs?.picks.length === DRAFT_PICKS)
                    this.dispatch({
                        k: 'openPicks',
                        picks: packs.picks.map((p, i) => ({ uid: p.uid, salt: packs.salts[i] })),
                    });
            }
        }
        const c = s.choice;
        if (c && (s.phase === 'team' || s.phase === 'preview')) {
            const kc = this.kept?.choice;
            const mineOk = kc && kc.game === s.game && kc.phase === s.phase;
            if (mineOk && !c.seal[role] && this.due(`cs-${s.game}-${s.phase}`))
                this.dispatch({ k: 'choiceSeal', seal: kc.seal });
            if (mineOk && ROLES.every((r) => c.seal[r]) && !c.opened[role] && this.due(`co-${s.game}-${s.phase}`))
                this.dispatch({ k: 'choiceOpen', value: kc.value, salt: kc.salt });
            // prévia: o tempo acabou e eu não confirmei: lacra o que estava na tela
            if (s.phase === 'preview' && !mineOk && c.until !== undefined && now >= c.until && this.due('pv-auto')) {
                const team = s.teams[role];
                const cfg =
                    this.previewDraft ??
                    (team && {
                        formation: team.formation ?? '1-2-1',
                        tactic: team.tactic,
                        order: [...team.lineup, ...team.bench].map((p) => p.uid),
                    });
                if (cfg) void this.sealChoice(cfg);
            }
        }
        if (s.phase === 'match') {
            this.revealSegments(s, role);
            this.resendOrders(s, role);
        }
    }

    /**
     * Abre o trecho seguinte meio trecho antes de ele começar (dá tempo de a mensagem chegar sem travar a tela). O
     * trecho 1 abre logo no começo da partida (dele sai a seed).
     */
    private revealSegments(s: Shared, role: Role) {
        const upTo = s.reveals[role][0] ? segmentOfMinute(this.minute + 1) : 0;
        for (let k = 0; k <= upTo; k++) {
            const x = this.chain[segIdx(k)];
            // o hash do começo do trecho (o 1º snapshot dele) confere que as duas telas têm a mesma partida
            const boundary = this.result && k > 0 ? holdTick(this.result.snapshots, k) : Number.POSITIVE_INFINITY;
            // leva quantas ordens antes da divisa a partida simulada tinha: só compara com o outro se for o mesmo
            // número (ordem que chegou atrasada não anula; a tela refaz e manda de novo)
            const before = s.log.slice(0, this.resultLog).filter((o) => o.tick < boundary).length;
            const hash =
                this.result && this.resultSeeds >= k && this.tick >= boundary
                    ? `${before}:${snapHash(this.result, boundary)}`
                    : undefined;
            const have = s.reveals[role][k] === x && (!hash || s.segHash[role][k] === hash);
            if (!have && this.due(`seg-${s.game}-${k}-${hash ?? ''}`)) this.dispatch({ k: 'reveal', seg: k, x, hash });
        }
    }

    /** Ordem minha que ainda não entrou no log: manda de novo (mesmo seq: repetida não entra duas vezes). */
    private resendOrders(s: Shared, role: Role) {
        const sent = this.kept?.sent?.game === s.game ? this.kept.sent.orders : {};
        const side = SIDE[role];
        for (const [seqStr, o] of Object.entries(sent)) {
            const seq = Number(seqStr);
            if (s.log.some((x) => x.team === side && x.seq === seq)) continue;
            if (Date.now() - o.at < RETRY_MS || !this.due(`ord-${s.game}-${seq}`)) continue;
            this.dispatch({ k: 'order', order: o.body, tick: o.tick, seq, ht: o.ht });
        }
    }

    /** A tela parou no fim do último trecho aberto pelos dois. */
    atHold(): boolean {
        const s = this.view.shared;
        if (!s || !this.result) return false;
        const opened = openedSegments(s.reveals.host, s.reveals.guest);
        return this.tick >= holdTick(this.result.snapshots, opened) - 1;
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

const speedMultOf = (s: PlaybackSpeed) => (typeof s === 'number' ? s : 4);

export const duel = new DuelSession();

/** Perfil do jogador pra sala (nome, avatar, título, clube e as versões). */
export function makePeer(p: Omit<Peer, 'engine' | 'app'>): Peer {
    return { ...p, engine: ENGINE_VERSION, app: __APP_VERSION__ };
}
