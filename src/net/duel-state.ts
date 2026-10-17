import type { Position } from '../engine/attributes';
import { captainOptions, DRAFT_PICKS, draftOptions, playerDraftOptions } from '../engine/draft';
import { DEFAULT_FORMATION, FORMATIONS, type FormationId, formationOf } from '../engine/formations';
import { type PokemonInstance, slotRating } from '../engine/instance';
import { Rng } from '../engine/rng';
import { isSubOrder, type MatchOrder, type SubOrder, type Tactic, type TeamSetup } from '../engine/state';
import type { PlaybackSpeed } from '../store/game-store';
import { openedSegments, playableUntil } from './seal';

/**
 * Estado compartilhado do duelo e as regras dele, sem rede nem tela (dá pra testar tudo aqui). Um lado só aplica as
 * intenções (o host; se ele sumir, o convidado) e manda o estado inteiro pros dois, com `rev` subindo. Quem recebe um
 * estado de `rev` maior fica com ele. Prazos (draft, intervalo, pedido de velocidade, W.O.) estão no relógio da sala:
 * o `Date.now()` do host, que o convidado acompanha pela diferença (`offset`).
 */

export type Role = 'host' | 'guest';
export const ROLES: Role[] = ['host', 'guest'];
export const SIDE: Record<Role, 0 | 1> = { host: 0, guest: 1 };
export const other = (r: Role): Role => (r === 'host' ? 'guest' : 'host');
export const roleOfSide = (side: 0 | 1): Role => (side === 0 ? 'host' : 'guest');

/** Os 3 modos (o host escolhe ao criar a sala). */
export type DuelMode = 'ready' | 'disputa' | 'pacotes';
export const DUEL_MODES: DuelMode[] = ['ready', 'disputa', 'pacotes'];
export const DUEL_SPEEDS: PlaybackSpeed[] = [1, 2, 4, 8, 'highlights'];

export const PICK_MS = 20_000;
export const CAPTAIN_PICK_MS = 30_000;
export const PREVIEW_MS = 30_000;
export const HALFTIME_MS = 20_000;
export const SPEED_ASK_MS = 5_000;
/** Depois do fim do trecho aberto, quanto a sala espera quem não abriu o próximo antes do W.O. */
export const WO_WAIT_MS = 60_000;
/** A tela do VERSUS fica esse tempo antes do apito (igual pros dois). */
export const KICKOFF_MS = 7_000;
export const MAX_TACTIC_CHANGES = 3;
/** Igual à partida da copa: a ordem vale ~2 s de jogo à frente, mais em velocidade alta. */
export const CHANGE_LEAD_TICKS = 40;
export const speedMult = (s: PlaybackSpeed) => (typeof s === 'number' ? s : 4);
export const leadTicks = (s: PlaybackSpeed) => CHANGE_LEAD_TICKS * speedMult(s);

/** Rodadas dos drafts do duelo: capitão (qualquer posição) e as vagas do losango, mais 1 reserva = 7 escolhas. */
export const DUEL_ROUNDS: (Position | 'ANY')[] = ['ANY', 'GK', 'FIXO', 'ALA', 'ALA', 'PIVO', 'ANY'];

export interface Peer {
    id: string;
    name: string;
    avatar: string;
    avatarGoogle: boolean;
    trainer: string;
    title: string;
    clubName: string;
    clubTag: string;
    clubColor: number;
    engine: number;
    app: string;
}

export type StampedOrder = MatchOrder & { seq: number };
export const isSubStamped = (o: StampedOrder): o is StampedOrder & SubOrder => isSubOrder(o);

export interface DraftState {
    /** Disputa: rodada, de quem é a vez, as 4 cartas abertas e as que queimaram. */
    round: number;
    turn: Role | null;
    options: PokemonInstance[];
    burned: number[];
    picks: Record<Role, PokemonInstance[]>;
    /** Prazo de cada um (na Disputa só vale o de quem está na vez). */
    deadline: Record<Role, number>;
}

export interface DuelResult {
    score: [number, number];
    shootout: [number, number] | null;
    winner: Role | null;
    /** Vitória por W.O. (o outro caiu e não voltou). */
    wo?: boolean;
}

export interface Shared {
    rev: number;
    room: string;
    /** Partida nº (revanche soma 1). */
    game: number;
    mode: DuelMode;
    speed: PlaybackSpeed;
    /** Seed dos pacotes (sorteada pelo host a cada partida). */
    seed: string;
    phase: 'lobby' | 'team' | 'draft' | 'preview' | 'match' | 'done';
    peers: Partial<Record<Role, Peer>>;
    ready: Record<Role, boolean>;
    /** Lacre (x[0] da corrente) de cada um, mandado junto com o "pronto". */
    commits: Partial<Record<Role, string>>;
    /** reveals[role][k] = x[k] aberto (já conferido por quem aplicou). */
    reveals: Record<Role, (string | null)[]>;
    teams: Partial<Record<Role, TeamSetup>>;
    draft?: DraftState;
    previewUntil?: number;
    previewReady: Record<Role, boolean>;
    /** Hora do apito inicial (relógio da sala). */
    kickoffAt?: number;
    log: StampedOrder[];
    speedAsk?: { by: Role; speed: PlaybackSpeed; until: number };
    halftime?: { until: number; ready: Record<Role, boolean> };
    secondHalf: boolean;
    /** Desde quando a sala espera alguém abrir o trecho seguinte. */
    waitSince?: number;
    /** As partidas se separaram (hash de trecho diferente). */
    desync?: boolean;
    segHash: Record<Role, Record<number, string>>;
    result?: DuelResult;
    rematch: Record<Role, boolean>;
}

const both = <T>(v: T): Record<Role, T> => ({ host: v, guest: v });

export function newShared(room: string, host: Peer, mode: DuelMode, speed: PlaybackSpeed, seed: string): Shared {
    return {
        rev: 1,
        room,
        game: 1,
        mode,
        speed,
        seed,
        phase: 'lobby',
        peers: { host },
        ready: both(false),
        commits: {},
        reveals: { host: [], guest: [] },
        teams: {},
        previewReady: both(false),
        log: [],
        secondHalf: false,
        segHash: { host: {}, guest: {} },
        rematch: both(false),
    };
}

export type Intent =
    | { k: 'join'; peer: Peer }
    | { k: 'ready'; ready: boolean; commit?: string }
    | { k: 'team'; team: TeamSetup }
    | { k: 'pick'; uid: string }
    | { k: 'formation'; formation: FormationId }
    | { k: 'tactic'; tactic: Tactic }
    | { k: 'swap'; a: number; b: number }
    | { k: 'previewReady' }
    | { k: 'reveal'; seg: number; x: string; hash?: string }
    | {
          k: 'order';
          order: { kind: 'tactic'; tactic: Tactic } | { kind: 'sub'; outUid: string; inUid: string };
          tick: number;
          ht?: boolean;
      }
    | { k: 'speed'; speed: PlaybackSpeed }
    | { k: 'speedAnswer'; yes: boolean }
    | { k: 'atHalftime' }
    | { k: 'htReady' }
    | { k: 'ended'; score: [number, number]; shootout: [number, number] | null; winner: 0 | 1 | null }
    | { k: 'rematch' };

/** O que quem aplica sabe na hora (relógio, presença e a partida que está rodando na tela dele). */
export interface Ctx {
    now: number;
    present: Record<Role, boolean>;
    /** Tick da partida na tela de quem aplica. */
    tick: number;
    /** Tick do intervalo na partida atual (troca no intervalo vale no tick seguinte). */
    htTick?: number;
    /** Troca da IA técnica por quem está fora no intervalo (o mais cansado, como os times da copa). */
    aiSub?: (side: 0 | 1) => { outUid: string; inUid: string } | null;
    /** Seed nova pra revanche. */
    newSeed?: string;
}

export const versionsOk = (s: Shared) =>
    !!s.peers.host &&
    !!s.peers.guest &&
    s.peers.host.engine === s.peers.guest.engine &&
    s.peers.host.app === s.peers.guest.app;

// ------------------------------------------------------------------ draft

/** As 4 cartas da rodada da Disputa (mesma vaga pros dois; ninguém repete espécie já tirada ou queimada). */
export function disputaOptions(seed: string, round: number, taken: ReadonlySet<number>): PokemonInstance[] {
    const rng = new Rng(seed, `disputa-${round}`);
    return round === 0 ? captainOptions(rng, taken, 4) : draftOptions(rng, round, taken, 4, [], DUEL_ROUNDS[round]);
}

/** As 3 cartas de "cada um com seus pacotes": mesma sorte pros dois, divergindo só pelo que cada um já tirou. */
export function packOptions(seed: string, round: number, picks: PokemonInstance[]): PokemonInstance[] {
    const taken = new Set(picks.map((p) => p.speciesId));
    const rng = new Rng(seed, `pacotes-${round}`);
    return round === 0 ? captainOptions(rng, taken, 3) : playerDraftOptions(rng, round, taken, DUEL_ROUNDS[round]);
}

/** Acabou o tempo: a carta de maior nota pra vaga. */
export function bestFor(options: PokemonInstance[], round: number): PokemonInstance {
    const need = DUEL_ROUNDS[round] ?? 'ANY';
    return options.reduce((b, o) => (slotRating(o, need) > slotRating(b, need) ? o : b));
}

const pickMs = (round: number) => (round === 0 ? CAPTAIN_PICK_MS : PICK_MS);
/** Quem abre a Disputa sai da seed; depois alterna a cada rodada. */
export const disputaFirst = (seed: string, round: number): Role =>
    (new Rng(seed, 'disputa-first').chance(0.5) ? 0 : 1) === round % 2 ? 'host' : 'guest';

export function optionsFor(s: Shared, role: Role): PokemonInstance[] {
    const d = s.draft;
    if (!d) return [];
    if (s.mode === 'disputa') return d.turn === role ? d.options : [];
    const round = d.picks[role].length;
    return round < DRAFT_PICKS ? packOptions(s.seed, round, d.picks[role]) : [];
}

/**
 * Escalação automática do fim do draft: os 5 que mais rendem nas vagas da formação (o capitão sempre começa) e o
 * resto no banco. O jogador ajusta na prévia de 30 s.
 */
export function autoLineup(picks: PokemonInstance[], formation: FormationId, captainUid: string | null) {
    const slots = formationOf(formation).slots;
    const r = picks.map((p) => slots.map((role) => slotRating(p, role)));
    let best: number[] = [];
    let bestSum = -1;
    const used = new Set<number>();
    const cur: number[] = [];
    const walk = (slot: number, sum: number) => {
        if (slot === slots.length) {
            const hasCaptain = !captainUid || cur.some((i) => picks[i].uid === captainUid);
            if (hasCaptain && sum > bestSum) {
                bestSum = sum;
                best = [...cur];
            }
            return;
        }
        for (let i = 0; i < picks.length; i++) {
            if (used.has(i)) continue;
            used.add(i);
            cur.push(i);
            walk(slot + 1, sum + r[i][slot]);
            cur.pop();
            used.delete(i);
        }
    };
    walk(0, 0);
    const lineup = best.map((i) => picks[i]);
    return { lineup, bench: picks.filter((_, i) => !best.includes(i)) };
}

function draftTeam(s: Shared, role: Role, picks: PokemonInstance[], formation = DEFAULT_FORMATION): TeamSetup {
    const peer = s.peers[role];
    const captainUid = picks[0]?.uid ?? null;
    return {
        name: peer?.clubName ?? role,
        ...autoLineup(picks, formation, captainUid),
        tactic: 'balanced',
        color: peer?.clubColor ?? 0x3a7bd5,
        formation,
        captainUid,
        manualSubs: true,
    };
}

/** Uids com o lado no fim: os dois times podem ter o mesmo Pokémon (mesmo save, mesmo pacote). */
export function tagTeam(team: TeamSetup, role: Role): TeamSetup {
    const suf = role === 'host' ? '~h' : '~g';
    const tag = (p: PokemonInstance) =>
        p.uid.endsWith(suf) ? p : { ...p, uid: `${p.uid.replace(/~[hg]$/, '')}${suf}` };
    const capBase = team.captainUid?.replace(/~[hg]$/, '');
    const lineup = team.lineup.map(tag);
    const bench = team.bench.map(tag);
    const cap = [...lineup, ...bench].find((p) => p.uid.replace(/~[hg]$/, '') === capBase);
    return { ...team, lineup, bench, captainUid: cap?.uid ?? null, manualSubs: true };
}

function validTeam(t: TeamSetup | undefined): t is TeamSetup {
    return (
        !!t &&
        Array.isArray(t.lineup) &&
        Array.isArray(t.bench) &&
        t.lineup.length === 5 &&
        t.bench.length <= 2 &&
        [...t.lineup, ...t.bench].every((p) => p && typeof p.uid === 'string' && typeof p.speciesId === 'number')
    );
}

// ------------------------------------------------------------------ ordens

/** Quem do time está em quadra depois das trocas do log. */
export function onFieldAfter(team: TeamSetup, log: StampedOrder[], side: 0 | 1): string[] {
    const field = team.lineup.map((p) => p.uid);
    for (const o of log) {
        if (o.team !== side || !isSubOrder(o)) continue;
        const i = field.indexOf(o.outUid);
        if (i >= 0) field[i] = o.inUid;
    }
    return field;
}

/**
 * Carimba a ordem com o tick e o número: `max(tick dos dois) + leadTicks` (no intervalo, o tick seguinte a ele),
 * sempre depois da última do log. Mesmo limite pros dois: 3 mudanças de tática e as trocas do banco.
 */
export function stampOrder(
    s: Shared,
    by: Role,
    i: Extract<Intent, { k: 'order' }>,
    ctx: Pick<Ctx, 'tick' | 'htTick'>,
): StampedOrder | null {
    const side = SIDE[by];
    const team = s.teams[by];
    if (!team) return null;
    const mine = s.log.filter((o) => o.team === side);
    if (i.order.kind === 'tactic') {
        const tactics = mine.filter((o) => !isSubOrder(o));
        const current = (tactics.at(-1) as { tactic?: Tactic } | undefined)?.tactic ?? team.tactic;
        if (tactics.length >= MAX_TACTIC_CHANGES || current === i.order.tactic) return null;
    } else {
        const subs = mine.filter(isSubStamped);
        const field = onFieldAfter(team, s.log, side);
        const usedIn = new Set(subs.map((o) => o.inUid));
        const { outUid, inUid } = i.order;
        if (subs.length >= team.bench.length) return null;
        if (!field.includes(outUid) || usedIn.has(inUid) || !team.bench.some((p) => p.uid === inUid)) return null;
    }
    const base =
        i.ht && ctx.htTick !== undefined
            ? ctx.htTick + 1
            : Math.ceil(Math.max(ctx.tick, Number(i.tick) || 0)) + leadTicks(s.speed);
    const tick = Math.max(base, (s.log.at(-1)?.tick ?? 0) + 1);
    const seq = s.log.length + 1;
    return i.order.kind === 'tactic'
        ? { tick, team: side, tactic: i.order.tactic, seq }
        : { tick, team: side, kind: 'sub', outUid: i.order.outUid, inUid: i.order.inUid, seq };
}

/** As ordens na ordem do motor (tick, depois número): o log já nasce assim, mas quem reconecta pode juntar. */
export const ordersOf = (log: StampedOrder[]): MatchOrder[] =>
    [...log].sort((a, b) => a.tick - b.tick || a.seq - b.seq);

// ------------------------------------------------------------------ reducer

function startPlay(s: Shared, now: number): Shared {
    return {
        ...s,
        phase: 'match',
        teams: { host: tagTeam(s.teams.host!, 'host'), guest: tagTeam(s.teams.guest!, 'guest') },
        kickoffAt: now + KICKOFF_MS,
        log: [],
        reveals: { host: [], guest: [] },
        segHash: { host: {}, guest: {} },
        halftime: undefined,
        secondHalf: false,
        speedAsk: undefined,
        waitSince: undefined,
        result: undefined,
    };
}

function startDraftOrTeam(s: Shared, now: number): Shared {
    if (s.mode === 'ready') return { ...s, phase: 'team', teams: {} };
    const first = disputaFirst(s.seed, 0);
    const deadline = now + CAPTAIN_PICK_MS;
    return {
        ...s,
        phase: 'draft',
        teams: {},
        draft: {
            round: 0,
            turn: s.mode === 'disputa' ? first : null,
            options: s.mode === 'disputa' ? disputaOptions(s.seed, 0, new Set()) : [],
            burned: [],
            picks: { host: [], guest: [] },
            deadline: both(deadline),
        },
    };
}

function applyPick(s: Shared, by: Role, uid: string, now: number): Shared {
    const d = s.draft;
    if (!d || s.phase !== 'draft') return s;
    const opts = optionsFor(s, by);
    const card = opts.find((o) => o.uid === uid);
    if (!card) return s;
    const picks = { ...d.picks, [by]: [...d.picks[by], card] };
    let draft: DraftState;
    if (s.mode === 'disputa') {
        const rest = d.options.filter((o) => o.uid !== uid);
        const firstOfRound = disputaFirst(s.seed, d.round);
        if (by === firstOfRound) {
            draft = { ...d, picks, options: rest, turn: other(by), deadline: both(now + pickMs(d.round)) };
        } else {
            // as 2 que sobram queimam; a próxima rodada abre com quem não abriu esta
            const round = d.round + 1;
            const burned = [...d.burned, ...rest.map((o) => o.speciesId)];
            const taken = new Set([...burned, ...[...picks.host, ...picks.guest].map((p) => p.speciesId)]);
            const done = round >= DRAFT_PICKS;
            draft = {
                round,
                burned,
                picks,
                turn: done ? null : disputaFirst(s.seed, round),
                options: done ? [] : disputaOptions(s.seed, round, taken),
                deadline: both(now + pickMs(round)),
            };
        }
    } else {
        draft = { ...d, picks, deadline: { ...d.deadline, [by]: now + pickMs(picks[by].length) } };
    }
    const next = { ...s, draft };
    if (ROLES.every((r) => draft.picks[r].length >= DRAFT_PICKS)) {
        return {
            ...next,
            phase: 'preview',
            teams: { host: draftTeam(s, 'host', draft.picks.host), guest: draftTeam(s, 'guest', draft.picks.guest) },
            previewUntil: now + PREVIEW_MS,
            previewReady: both(false),
        };
    }
    return next;
}

/** Aplica uma intenção de `by`. Devolve o mesmo objeto quando não vale (sem subir `rev`). */
export function reduce(s: Shared, i: Intent, by: Role, ctx: Ctx): Shared {
    const next = apply(s, i, by, ctx);
    return next === s ? s : { ...next, rev: s.rev + 1 };
}

function apply(s: Shared, i: Intent, by: Role, ctx: Ctx): Shared {
    const { now } = ctx;
    switch (i.k) {
        case 'join': {
            const cur = s.peers[by];
            if (cur && cur.id !== i.peer.id) return s;
            return { ...s, peers: { ...s.peers, [by]: i.peer } };
        }
        case 'ready': {
            if (s.phase !== 'lobby') return s;
            if (i.ready && !/^[0-9a-f]{64}$/.test(i.commit ?? '')) return s;
            const ready = { ...s.ready, [by]: i.ready };
            const commits = { ...s.commits, [by]: i.ready ? i.commit : undefined };
            const next = { ...s, ready, commits };
            return ready.host && ready.guest && versionsOk(next) ? startDraftOrTeam(next, now) : next;
        }
        case 'team': {
            if (s.phase !== 'team' || !validTeam(i.team)) return s;
            const teams = { ...s.teams, [by]: { ...i.team, manualSubs: true } };
            const next = { ...s, teams };
            return teams.host && teams.guest ? startPlay(next, now) : next;
        }
        case 'pick':
            return applyPick(s, by, i.uid, now);
        case 'formation':
        case 'tactic':
        case 'swap': {
            const team = s.teams[by];
            if (s.phase !== 'preview' || !team) return s;
            let t: TeamSetup = team;
            if (i.k === 'formation') {
                if (!FORMATIONS[i.formation]) return s;
                t = draftTeam(s, by, s.draft?.picks[by] ?? [...team.lineup, ...team.bench], i.formation);
                t = { ...t, tactic: team.tactic };
            } else if (i.k === 'tactic') t = { ...team, tactic: i.tactic };
            else {
                const all = [...team.lineup, ...team.bench];
                if (!all[i.a] || !all[i.b] || i.a === i.b) return s;
                [all[i.a], all[i.b]] = [all[i.b], all[i.a]];
                const lineup = all.slice(0, 5);
                // o capitão não vai pro banco
                if (team.captainUid && !lineup.some((p) => p.uid === team.captainUid)) return s;
                t = { ...team, lineup, bench: all.slice(5) };
            }
            return { ...s, teams: { ...s.teams, [by]: t } };
        }
        case 'previewReady': {
            if (s.phase !== 'preview') return s;
            const previewReady = { ...s.previewReady, [by]: true };
            const next = { ...s, previewReady };
            return previewReady.host && previewReady.guest ? startPlay(next, now) : next;
        }
        case 'reveal': {
            if (s.phase !== 'match' || i.seg < 1) return s;
            const mine = [...s.reveals[by]];
            if (mine[i.seg] === i.x && (!i.hash || s.segHash[by][i.seg] === i.hash)) return s;
            mine[i.seg] = i.x;
            const segHash = i.hash ? { ...s.segHash, [by]: { ...s.segHash[by], [i.seg]: i.hash } } : s.segHash;
            const otherHash = segHash[other(by)][i.seg];
            const desync = s.desync || (!!i.hash && !!otherHash && otherHash !== i.hash);
            return { ...s, reveals: { ...s.reveals, [by]: mine }, segHash, desync };
        }
        case 'order': {
            if (s.phase !== 'match' || s.result) return s;
            const o = stampOrder(s, by, i, ctx);
            return o ? { ...s, log: [...s.log, o] } : s;
        }
        case 'speed': {
            if (s.phase !== 'match' || s.speedAsk || i.speed === s.speed || !DUEL_SPEEDS.includes(i.speed)) return s;
            // o outro fora da sala não tem como aceitar: fica como está
            if (!ctx.present[other(by)]) return s;
            return { ...s, speedAsk: { by, speed: i.speed, until: now + SPEED_ASK_MS } };
        }
        case 'speedAnswer': {
            if (!s.speedAsk || s.speedAsk.by === by) return s;
            return { ...s, speed: i.yes ? s.speedAsk.speed : s.speed, speedAsk: undefined };
        }
        case 'atHalftime': {
            if (s.phase !== 'match' || s.halftime) return s;
            return { ...s, halftime: { until: now + HALFTIME_MS, ready: both(false) } };
        }
        case 'htReady': {
            if (!s.halftime || s.secondHalf) return s;
            return { ...s, halftime: { ...s.halftime, ready: { ...s.halftime.ready, [by]: true } } };
        }
        case 'ended': {
            if (s.phase !== 'match' || s.result) return s;
            const winner = i.winner === null ? null : i.winner === 0 ? 'host' : 'guest';
            return { ...s, phase: 'done', result: { score: i.score, shootout: i.shootout, winner } };
        }
        case 'rematch': {
            if (s.phase !== 'done') return s;
            const rematch = { ...s.rematch, [by]: true };
            if (!(rematch.host && rematch.guest)) return { ...s, rematch };
            return {
                ...newShared(s.room, s.peers.host!, s.mode, s.speed, ctx.newSeed ?? `${s.seed}-r`),
                peers: s.peers,
                game: s.game + 1,
            };
        }
    }
    return s;
}

/**
 * Prazos e a IA técnica (quem aplica chama a cada meio segundo): carta de maior nota quando o tempo do draft acaba,
 * fim da prévia, pedido de velocidade sem resposta, fim do intervalo e W.O. de quem não abre o trecho seguinte.
 */
export function tickTimers(s: Shared, ctx: Ctx): Shared {
    const next = timers(s, ctx);
    return next === s ? s : { ...next, rev: s.rev + 1 };
}

function timers(s: Shared, ctx: Ctx): Shared {
    const { now, present } = ctx;
    let out = s;
    if (out.phase === 'draft' && out.draft) {
        for (const r of ROLES) {
            const d = out.draft;
            if (!d) break;
            const due = out.mode === 'disputa' ? d.turn === r : d.picks[r].length < DRAFT_PICKS;
            if (!due || now < d.deadline[r]) continue;
            const opts = optionsFor(out, r);
            if (opts.length)
                out = applyPick(out, r, bestFor(opts, out.mode === 'disputa' ? d.round : d.picks[r].length).uid, now);
        }
    }
    if (out.phase === 'preview' && out.previewUntil !== undefined && now >= out.previewUntil) out = startPlay(out, now);
    if (out.speedAsk && now >= out.speedAsk.until) out = { ...out, speedAsk: undefined };
    if (out.phase === 'match' && out.halftime && !out.secondHalf) {
        const ht = out.halftime;
        const done = now >= ht.until || ROLES.every((r) => ht.ready[r] || !present[r]);
        if (done) {
            // IA técnica: quem está fora da sala não fica com o cansado em quadra
            for (const r of ROLES) {
                if (present[r] || !ctx.aiSub) continue;
                const side = SIDE[r];
                if (
                    out.log.some(
                        (o) => o.team === side && isSubOrder(o) && ctx.htTick !== undefined && o.tick > ctx.htTick,
                    )
                )
                    continue;
                const sub = ctx.aiSub(side);
                if (!sub) continue;
                const o = stampOrder(
                    out,
                    r,
                    { k: 'order', order: { kind: 'sub', ...sub }, tick: ctx.tick, ht: true },
                    ctx,
                );
                if (o) out = { ...out, log: [...out.log, o] };
            }
            out = { ...out, secondHalf: true };
        }
    }
    if (out.phase === 'match' && !out.result) {
        const opened = openedSegments(out.reveals.host, out.reveals.guest);
        // antes do apito ninguém trava; sem o trecho 1 aberto, trava no 0
        const stuck = now >= (out.kickoffAt ?? 0) && ctx.tick >= playableUntil(opened) - 1;
        if (!stuck) {
            if (out.waitSince !== undefined) out = { ...out, waitSince: undefined };
        } else if (out.waitSince === undefined) {
            out = { ...out, waitSince: now };
        } else if (now - out.waitSince >= WO_WAIT_MS) {
            const missing = ROLES.filter((r) => !out.reveals[r][opened + 1]);
            if (missing.length === 1) {
                const winner = other(missing[0]);
                out = {
                    ...out,
                    phase: 'done',
                    result: { score: [0, 0], shootout: null, winner, wo: true },
                };
            }
        }
    }
    return out;
}

/** Quem está esperando quem na trava do trecho (pra tela dizer "esperando Fulano…"). */
export function waitingFor(s: Shared): Role | null {
    const opened = openedSegments(s.reveals.host, s.reveals.guest);
    const missing = ROLES.filter((r) => !s.reveals[r][opened + 1]);
    return missing.length === 1 ? missing[0] : null;
}

// ------------------------------------------------------------------ relógio e emotes

/**
 * Correção do relógio do convidado: `drift` = tick do host − o meu (positivo = estou atrás). Até meio segundo de
 * diferença, nada; até 3 s, 10% mais rápido ou mais devagar; mais que isso, pula pra frente (ou espera parado).
 */
export function clockAdjust(drift: number, speed: PlaybackSpeed): { rate: number; seek?: boolean } {
    const perSec = 20 * speedMult(speed);
    const soft = 0.5 * perSec;
    const hard = 3 * perSec;
    if (drift > hard) return { rate: 1, seek: true };
    if (drift < -hard) return { rate: 0 };
    if (drift > soft) return { rate: 1.1 };
    if (drift < -soft) return { rate: 0.9 };
    return { rate: 1 };
}

export type EmoteKind = 'boa' | 'golaco' | 'ops' | 'zzz' | 'gg' | 'grito';
export const EMOTES: EmoteKind[] = ['boa', 'golaco', 'ops', 'zzz', 'gg', 'grito'];
export const EMOTE_GAP_MS = 3_000;
export const SHOUT_GAP_MS = 10_000;

/** Limite dos emotes (vale no envio e no recebimento): 1 a cada 3 s, e o grito do capitão 1 a cada 10 s. */
export function emoteAllowed(last: { any: number; grito: number }, kind: EmoteKind, now: number): boolean {
    if (now - last.any < EMOTE_GAP_MS) return false;
    return kind !== 'grito' || now - last.grito >= SHOUT_GAP_MS;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Código da sala: 6 letras/números sem I, O, 0 e 1 (fácil de ditar). */
export function roomCode(rand: (n: number) => number): string {
    return Array.from({ length: 6 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join('');
}
export const isRoomCode = (s: string | null | undefined): s is string => !!s && /^[A-HJ-NP-Z2-9]{6}$/.test(s);
