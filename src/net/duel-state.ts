import type { Position } from '../engine/attributes';
import { captainOptions, DRAFT_PICKS, draftOptions, playerDraftOptions } from '../engine/draft';
import {
    DEFAULT_SPECIAL_LIMIT,
    type DuelTeamRecipe,
    SPECIAL_LIMITS,
    type SpecialLimit,
    teamFromRecipe,
    validarTimeDuelo,
} from '../engine/duel-validate';
import { DEFAULT_FORMATION, FORMATIONS, type FormationId, formationOf } from '../engine/formations';
import { type PokemonInstance, slotRating } from '../engine/instance';
import { Rng } from '../engine/rng';
import { CORNER_PLANS, validOrder } from '../engine/runners/live-runner';
import {
    type CornerOrder,
    type CornerPlan,
    isCornerOrder,
    isSubOrder,
    isTacticOrder,
    type MatchOrder,
    type SubOrder,
    type Tactic,
    type TacticChange,
    type TeamSetup,
} from '../engine/state';
import { dict } from '../i18n';
import type { PlaybackSpeed } from '../store/game-store';
import { tagFromName } from '../store/profile';
import { openedSegments } from './seal';

/**
 * Estado compartilhado do duelo e as regras dele, sem rede nem tela (dá pra testar tudo aqui). Um lado só aplica as
 * intenções (o host; se ele sumir, o convidado) e manda o estado inteiro pros dois, com `rev` subindo. Quem recebe um
 * estado de `rev` maior fica com ele. Prazos (draft, intervalo, pedido de velocidade, espera) estão no relógio da
 * sala: o `Date.now()` do host, que o convidado acompanha pela diferença (`offset`).
 *
 * Regra de segurança (docs/planos/multiplayer-revisao.md): intenção inválida devolve o mesmo estado e não acusa
 * ninguém. O Broadcast não autentica quem mandou; só o tempo esgotado (com o botão de quem ficou) dá W.O.
 */

export type Role = 'host' | 'guest';
export const ROLES: Role[] = ['host', 'guest'];
export const SIDE: Record<Role, 0 | 1> = { host: 0, guest: 1 };
export const other = (r: Role): Role => (r === 'host' ? 'guest' : 'host');

/** Os 3 modos (o host escolhe ao criar a sala). */
export type DuelMode = 'ready' | 'disputa' | 'pacotes';
export const DUEL_MODES: DuelMode[] = ['ready', 'disputa', 'pacotes'];
export const DUEL_SPEEDS: PlaybackSpeed[] = [1, 2, 4, 8, 'highlights'];

export const PICK_MS = 20_000;
export const CAPTAIN_PICK_MS = 30_000;
export const PREVIEW_MS = 30_000;
export const HALFTIME_MS = 20_000;
export const SPEED_ASK_MS = 5_000;
/** Folga pra mensagem chegar antes de a sala considerar que alguém está travando o jogo. */
export const GRACE_MS = 5_000;
/** Quanto quem ficou espera antes de poder encerrar por W.O. (o botão; nunca automático no amistoso). */
export const WO_WAIT_MS = 60_000;
/** A tela do VERSUS fica esse tempo antes do apito (igual pros dois). */
export const KICKOFF_MS = 7_000;
/** Limite de trocas (tática e, à parte, escanteio): o mesmo do motor. */
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
    /** Id do título: o rival mostra no idioma dele e com o visual do título (dourado, holográfico). Sala antiga manda só o nome. */
    titleId?: string;
    clubName: string;
    clubTag: string;
    clubColor: number;
    engine: number;
    app: string;
    /** Entrou sem conta ("Jogar agora", login anônimo): o lobby mostra o selo "Convidado". */
    anon?: boolean;
}

/** Ordem do duelo: a de sempre + `seq` do time (quem deu a ordem numera; o host só põe o tick). */
export type StampedOrder = MatchOrder & { seq: number };
export const isSubStamped = (o: StampedOrder): o is StampedOrder & SubOrder => isSubOrder(o);

export interface DraftState {
    /** Rodada dos dois (andam juntos); 7 = abrindo as escolhas lacradas de "cada um com seus pacotes". */
    round: number;
    /** Desde quando a rodada está aberta (pra saber quem trava). */
    since: number;
    /** Seed de cada rodada, quando os dois já abriram o segredo dela. */
    seeds: string[];
    /** Disputa: de quem é a vez, as 4 cartas abertas e as que queimaram. */
    turn: Role | null;
    options: PokemonInstance[];
    burned: number[];
    /** Disputa: aberto a cada escolha. Pacotes: vazio até abrir tudo no fim. */
    picks: Record<Role, PokemonInstance[]>;
    /** Pacotes: lacre da escolha de cada rodada. */
    seals: Record<Role, string[]>;
    /** Prazo de cada um na rodada (0 = a rodada ainda não abriu). */
    deadline: Record<Role, number>;
}

/** Escolha lacrada dos dois (time pronto e prévia): cada um lacra, e só abrem quando os dois lacraram. */
export interface ChoiceState {
    /** Lacre de cada um; '-' = ficou com o padrão (o tempo da prévia acabou sem lacre). */
    seal: Record<Role, string | null>;
    opened: Record<Role, boolean>;
    until?: number;
}

export interface DuelResult {
    score: [number, number];
    shootout: [number, number] | null;
    winner: Role | null;
    /** Vitória por W.O. (quem ficou apertou o botão depois da espera). */
    wo?: boolean;
    /** As duas telas se separaram (hash de trecho diferente): partida anulada. */
    desync?: boolean;
}

export interface Shared {
    rev: number;
    room: string;
    /** Partida nº (revanche soma 1). */
    game: number;
    mode: DuelMode;
    speed: PlaybackSpeed;
    /** Time pronto: limite de cartas especiais (0, 3 ou null = livre). Nos drafts não vale. */
    specialLimit: SpecialLimit;
    /** Seed pública da sala (só decide quem abre a Disputa); os pacotes saem das seeds das rodadas. */
    seed: string;
    phase: 'lobby' | 'team' | 'draft' | 'preview' | 'match' | 'done';
    peers: Partial<Record<Role, Peer>>;
    ready: Record<Role, boolean>;
    /** Lacre (x[0] da corrente) de cada um, mandado junto com o "pronto". */
    commits: Partial<Record<Role, string>>;
    /** Segredos abertos das rodadas do draft (índice = rodada). */
    roundReveals: Record<Role, (string | null)[]>;
    /** Segredos abertos dos trechos da partida (índice = trecho, a partir de 1). */
    reveals: Record<Role, (string | null)[]>;
    teams: Partial<Record<Role, TeamSetup>>;
    draft?: DraftState;
    choice?: ChoiceState;
    /** Hora do apito inicial (relógio da sala). */
    kickoffAt?: number;
    log: StampedOrder[];
    speedAsk?: { by: Role; speed: PlaybackSpeed; until: number };
    halftime?: { until: number; ready: Record<Role, boolean> };
    secondHalf: boolean;
    /** Quem está travando a sala e desde quando (a espera do W.O.). */
    waitFor?: Role;
    waitSince?: number;
    segHash: Record<Role, Record<number, string>>;
    result?: DuelResult;
    rematch: Record<Role, boolean>;
    /** Lacre (x[0]) da partida seguinte, mandado junto com o pedido de revanche (a revanche pula o lobby). */
    rematchCommits?: Partial<Record<Role, string>>;
}

const both = <T>(v: T): Record<Role, T> => ({ host: v, guest: v });

export function newShared(
    room: string,
    host: Peer,
    mode: DuelMode,
    speed: PlaybackSpeed,
    seed: string,
    specialLimit: SpecialLimit = DEFAULT_SPECIAL_LIMIT,
): Shared {
    return {
        rev: 1,
        room,
        game: 1,
        mode,
        speed,
        specialLimit: SPECIAL_LIMITS.includes(specialLimit) ? specialLimit : DEFAULT_SPECIAL_LIMIT,
        seed,
        phase: 'lobby',
        peers: { host },
        ready: both(false),
        commits: {},
        roundReveals: { host: [], guest: [] },
        reveals: { host: [], guest: [] },
        teams: {},
        log: [],
        secondHalf: false,
        segHash: { host: {}, guest: {} },
        rematch: both(false),
    };
}

/** Configuração da prévia (o que vai lacrado): formação, tática e a ordem do elenco (5 titulares, depois o banco). */
export interface PreviewCfg {
    formation: FormationId;
    tactic: Tactic;
    order: string[];
    /** Instrução de escanteio e cobrador (null = o automático do motor). */
    corner?: CornerPlan;
    cornerTaker?: string | null;
}

export type OrderBody =
    | { kind: 'tactic'; tactic: Tactic }
    | { kind: 'sub'; outUid: string; inUid: string }
    | { kind: 'corner'; corner: CornerPlan }
    | { kind: 'lineup'; formation: FormationId; order: string[] };

export type Intent =
    | { k: 'join'; peer: Peer }
    /** O "pronto" leva a regra de cartas especiais que a pessoa viu no lobby (o aperto de mão da regra). */
    | { k: 'ready'; ready: boolean; commit?: string; specialLimit?: SpecialLimit }
    | { k: 'roundReveal'; round: number; x: string }
    | { k: 'pick'; uid: string }
    | { k: 'seal'; round: number; seal: string }
    | { k: 'choiceSeal'; seal: string }
    | { k: 'choiceOpen'; value: unknown; salt: string }
    | { k: 'reveal'; seg: number; x: string; hash?: string }
    | { k: 'order'; order: OrderBody; tick: number; seq: number; ht?: boolean }
    | { k: 'speed'; speed: PlaybackSpeed }
    | { k: 'speedAnswer'; yes: boolean }
    | { k: 'atHalftime' }
    | { k: 'htReady' }
    /** Apito final na tela de quem manda (o placar sai da partida que quem aplica simulou, nunca da mensagem). */
    | { k: 'ended' }
    | { k: 'claimWO' }
    | { k: 'rematch'; commit?: string }
    // só locais (quem aplica gera depois de conferir; nunca aceitas da rede)
    | { k: 'roundSeed'; round: number; seed: string }
    | { k: 'picksOpened'; cards: PokemonInstance[] };

/** Intenções que só quem aplica gera (depois de conferir os lacres): da rede, são ignoradas. */
export const LOCAL_ONLY = new Set<Intent['k']>(['roundSeed', 'picksOpened']);

/** O que quem aplica sabe na hora (relógio, presença e a partida que está rodando na tela dele). */
export interface Ctx {
    now: number;
    present: Record<Role, boolean>;
    /** Tick da partida na tela de quem aplica. */
    tick: number;
    /** Tick do intervalo na partida atual (troca no intervalo vale no tick seguinte). */
    htTick?: number;
    /** Seed nova pra revanche. */
    newSeed?: string;
    /** A tela de quem aplica parou no fim do último trecho aberto pelos dois (`holdTick` em seal.ts). */
    atHold?: boolean;
    /** Placar da partida que quem aplica simulou, só depois do apito final na tela dele (null = ainda não acabou). */
    final?: FinalScore | null;
}

export interface FinalScore {
    score: [number, number];
    shootout: [number, number] | null;
    winner: 0 | 1 | null;
}

/** Limite de cartas especiais da sala (sala guardada antes da regra existir fica no padrão). */
export const specialLimitOf = (s: Pick<Shared, 'specialLimit'>): SpecialLimit =>
    s.specialLimit === undefined ? DEFAULT_SPECIAL_LIMIT : s.specialLimit;

/**
 * Nomes do placar, da narração e do resultado: o clube de cada um; se os dois clubes têm o mesmo nome ("Pallet FC" x
 * "Pallet FC"), o nome do treinador (e, se até ele repete, o do convidado ganha um "2").
 */
export function duelNames(s: Pick<Shared, 'teams' | 'peers'>): [string, string] {
    const club = ROLES.map((r) => s.teams[r]?.name ?? s.peers[r]?.clubName ?? '');
    return sameName(club[0], club[1]) ? trainerNames(s) : [club[0], club[1]];
}

/**
 * Siglas do placar (no celular ele só mostra a sigla): a do clube de cada um; se repetem (dois "PAL" do clube
 * padrão), as dos nomes do placar e, se até elas repetem, a do convidado ganha um "2".
 */
export function duelTags(s: Pick<Shared, 'teams' | 'peers'>): [string, string] {
    const names = duelNames(s);
    const [a, b] = ROLES.map((r, i) => s.peers[r]?.clubTag || tagFromName(names[i]));
    if (a !== b) return [a, b];
    const [na, nb] = names.map(tagFromName);
    return na !== nb ? [na, nb] : [a, `${b.slice(0, 2)}2`];
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Nome padrão de quem não escolheu nome (em qualquer idioma: o rival pode jogar em outro). */
const DEFAULT_TRAINER = (['pt', 'en'] as const).map((l) => dict(l).profile.trainer);
const isDefaultTrainer = (name: string) => !name.trim() || DEFAULT_TRAINER.some((d) => sameName(d, name));

/**
 * Nome de cada treinador nos textos ("Fulano venceu"). Quem ficou com o nome padrão ("Treinador") aparece pelo
 * nome do clube (dois "Treinador" viravam "Treinador" x "Treinador 2"); se ainda assim os dois repetem, o do
 * convidado ganha um "2".
 */
export function trainerNames(s: Pick<Shared, 'peers'>): [string, string] {
    const [host, guest] = ROLES.map((r) => {
        const p = s.peers[r];
        if (!p) return '';
        return isDefaultTrainer(p.name) && p.clubName.trim() ? p.clubName : p.name;
    });
    return [host, guest && sameName(host, guest) ? `${guest} 2` : guest];
}

export const versionsOk = (s: Shared) =>
    !!s.peers.host &&
    !!s.peers.guest &&
    s.peers.host.engine === s.peers.guest.engine &&
    s.peers.host.app === s.peers.guest.app;

// ------------------------------------------------------------------ draft

/** As 4 cartas da rodada da Disputa: função só da seed da rodada e do que já saiu. */
export function disputaOptions(roundSeed: string, round: number, taken: ReadonlySet<number>): PokemonInstance[] {
    const rng = new Rng(roundSeed, 'disputa');
    return round === 0 ? captainOptions(rng, taken, 4) : draftOptions(rng, round, taken, 4, [], DUEL_ROUNDS[round]);
}

/** As 3 cartas de "cada um com seus pacotes": seed da rodada + quem abre (cada um recebe um pacote diferente). */
export function packOptions(roundSeed: string, round: number, picks: PokemonInstance[], role: Role): PokemonInstance[] {
    const taken = new Set(picks.map((p) => p.speciesId));
    const rng = new Rng(roundSeed, `pacotes-${role}`);
    return round === 0 ? captainOptions(rng, taken, 3) : playerDraftOptions(rng, round, taken, DUEL_ROUNDS[round]);
}

/** Acabou o tempo: a carta de maior nota pra vaga. */
export function bestFor(options: PokemonInstance[], round: number): PokemonInstance {
    const need = DUEL_ROUNDS[round] ?? 'ANY';
    return options.reduce((b, o) => (slotRating(o, need) > slotRating(b, need) ? o : b));
}

export const pickMs = (round: number) => (round === 0 ? CAPTAIN_PICK_MS : PICK_MS);
/** Quem abre a Disputa sai da seed da sala; depois alterna a cada rodada. */
export const disputaFirst = (seed: string, round: number): Role =>
    (new Rng(seed, 'disputa-first').chance(0.5) ? 0 : 1) === round % 2 ? 'host' : 'guest';

/** O que vai lacrado em cada escolha de pacote (rodada + carta). */
export const packSealValue = (round: number, uid: string) => ({ round, uid });

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
        corner: 'mixed',
        cornerTakerUid: null,
    };
}

/** Uids com o lado no fim: os dois times podem ter o mesmo Pokémon (mesmo pacote). */
export function tagTeam(team: TeamSetup, role: Role): TeamSetup {
    const suf = role === 'host' ? '~h' : '~g';
    const base = (uid: string) => uid.replace(/~[hg]$/, '');
    const tag = (p: PokemonInstance) => (p.uid.endsWith(suf) ? p : { ...p, uid: `${base(p.uid)}${suf}` });
    const lineup = team.lineup.map(tag);
    const bench = team.bench.map(tag);
    const find = (uid: string | null | undefined) =>
        uid ? ([...lineup, ...bench].find((p) => base(p.uid) === base(uid))?.uid ?? null) : null;
    return {
        ...team,
        lineup,
        bench,
        captainUid: find(team.captainUid),
        cornerTakerUid: find(team.cornerTakerUid),
        manualSubs: true,
    };
}

const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];

/** Aplica a prévia aberta (mesmo elenco, formação e tática válidas, capitão em quadra). */
export function applyPreview(team: TeamSetup, cfg: PreviewCfg): TeamSetup | null {
    if (!cfg || !FORMATIONS[cfg.formation] || !TACTICS.includes(cfg.tactic)) return null;
    const all = [...team.lineup, ...team.bench];
    if (!Array.isArray(cfg.order) || cfg.order.length !== all.length || new Set(cfg.order).size !== all.length)
        return null;
    const byUid = new Map(all.map((p) => [p.uid, p]));
    const order = cfg.order.map((u) => byUid.get(u));
    if (order.some((p) => !p)) return null;
    const lineup = order.slice(0, 5) as PokemonInstance[];
    if (team.captainUid && !lineup.some((p) => p.uid === team.captainUid)) return null;
    if (cfg.corner !== undefined && !CORNER_PLANS.includes(cfg.corner)) return null;
    if (cfg.cornerTaker != null && !byUid.has(cfg.cornerTaker)) return null;
    return {
        ...team,
        formation: cfg.formation,
        tactic: cfg.tactic,
        lineup,
        bench: order.slice(5) as PokemonInstance[],
        corner: cfg.corner ?? team.corner ?? 'mixed',
        cornerTakerUid: cfg.cornerTaker ?? null,
    };
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

/** Os dois hashes do trecho saíram do mesmo número de ordens (o prefixo antes do ":"). */
const sameInputs = (a: string, b: string) => a.slice(0, a.indexOf(':') + 1) === b.slice(0, b.indexOf(':') + 1);

/** As duas telas mandaram hashes diferentes do trecho k, feitos com as mesmas ordens. */
const segMismatch = (h: Shared['segHash'], k: number) => {
    const a = h.host[k];
    const b = h.guest[k];
    return !!a && !!b && a !== b && sameInputs(a, b);
};

/**
 * Carimba a ordem com o tick: `max(tick dos dois) + leadTicks` (no intervalo, o tick seguinte a ele), sempre depois
 * da última do log. O número (`seq`) é de quem deu a ordem: repetida não entra de novo. Tática, escanteio e prancheta
 * sem limite; as trocas, até acabar o banco.
 */
export function stampOrder(
    s: Shared,
    by: Role,
    i: Extract<Intent, { k: 'order' }>,
    ctx: Pick<Ctx, 'tick' | 'htTick'>,
): StampedOrder | null {
    const side = SIDE[by];
    const team = s.teams[by];
    if (!team || !Number.isInteger(i.seq) || i.seq < 1 || !i.order) return null;
    const mine = s.log.filter((o) => o.team === side);
    if (mine.some((o) => o.seq >= i.seq)) return null;
    if (i.order.kind === 'tactic') {
        const tactics = mine.filter((o) => isTacticOrder(o)) as TacticChange[];
        const current = tactics.at(-1)?.tactic ?? team.tactic;
        if (current === i.order.tactic) return null;
    } else if (i.order.kind === 'corner') {
        const corners = mine.filter((o) => isCornerOrder(o)) as CornerOrder[];
        const current = corners.at(-1)?.corner ?? team.corner ?? 'mixed';
        if (current === i.order.corner) return null;
    } else if (i.order.kind === 'sub') {
        const subs = mine.filter(isSubStamped);
        const field = onFieldAfter(team, s.log, side);
        const usedIn = new Set(subs.map((o) => o.inUid));
        const { outUid, inUid } = i.order;
        if (subs.length >= team.bench.length) return null;
        if (!field.includes(outUid) || usedIn.has(inUid) || !team.bench.some((p) => p.uid === inUid)) return null;
    } else if (i.order.kind === 'lineup') {
        // prancheta sem limite: só quem está em quadra (quem sai numa troca do log vale como quem entra)
        const order: unknown = i.order.order;
        if (!Array.isArray(order) || !order.every((u) => typeof u === 'string')) return null;
        const field = onFieldAfter(team, s.log, side);
        const resolved = order.map((u: string) => {
            for (const o of s.log) if (o.team === side && isSubOrder(o) && o.outUid === u) u = o.inUid;
            return u;
        });
        if (resolved.length !== field.length || !field.every((u) => resolved.includes(u))) return null;
    } else return null;
    const base =
        i.ht && ctx.htTick !== undefined
            ? ctx.htTick + 1
            : Math.ceil(Math.max(ctx.tick, Number(i.tick) || 0)) + leadTicks(s.speed);
    const tick = Math.max(base, (s.log.at(-1)?.tick ?? 0) + 1);
    const o = i.order;
    const out: StampedOrder =
        o.kind === 'tactic'
            ? { tick, team: side, tactic: o.tactic, seq: i.seq }
            : o.kind === 'corner'
              ? { tick, team: side, kind: 'corner', corner: o.corner, seq: i.seq }
              : o.kind === 'lineup'
                ? { tick, team: side, kind: 'lineup', formation: o.formation, order: [...o.order], seq: i.seq }
                : { tick, team: side, kind: 'sub', outUid: o.outUid, inUid: o.inUid, seq: i.seq };
    // a mesma regra que o motor usa pra aceitar a ordem na agenda
    return validOrder(out) ? out : null;
}

/** As ordens na ordem do motor: (tick, time, seq). */
export const ordersOf = (log: StampedOrder[]): MatchOrder[] =>
    [...log].sort((a, b) => a.tick - b.tick || a.team - b.team || a.seq - b.seq);

// ------------------------------------------------------------------ reducer

function startPlay(s: Shared, now: number): Shared {
    return {
        ...s,
        phase: 'match',
        choice: undefined,
        teams: { host: tagTeam(s.teams.host!, 'host'), guest: tagTeam(s.teams.guest!, 'guest') },
        kickoffAt: now + KICKOFF_MS,
        log: [],
        reveals: { host: [], guest: [] },
        segHash: { host: {}, guest: {} },
        halftime: undefined,
        secondHalf: false,
        speedAsk: undefined,
        waitFor: undefined,
        waitSince: undefined,
        result: undefined,
    };
}

const emptyChoice = (until?: number): ChoiceState => ({ seal: both(null), opened: both(false), until });

function startDraftOrTeam(s: Shared, now: number): Shared {
    if (s.mode === 'ready') return { ...s, phase: 'team', teams: {}, choice: emptyChoice() };
    return {
        ...s,
        phase: 'draft',
        teams: {},
        roundReveals: { host: [], guest: [] },
        draft: {
            round: 0,
            since: now,
            seeds: [],
            turn: null,
            options: [],
            burned: [],
            picks: { host: [], guest: [] },
            seals: { host: [], guest: [] },
            deadline: both(0),
        },
    };
}

function toPreview(s: Shared, now: number): Shared {
    const d = s.draft!;
    return {
        ...s,
        phase: 'preview',
        teams: { host: draftTeam(s, 'host', d.picks.host), guest: draftTeam(s, 'guest', d.picks.guest) },
        choice: emptyChoice(now + PREVIEW_MS),
    };
}

/** Rodada nova: espera os dois abrirem o segredo dela (a seed sai disso). */
function nextRound(s: Shared, d: DraftState, now: number): Shared {
    const round = d.round + 1;
    const draft: DraftState = { ...d, round, since: now, turn: null, options: [], deadline: both(0) };
    if (round < DRAFT_PICKS || s.mode === 'pacotes') return { ...s, draft };
    return toPreview({ ...s, draft }, now);
}

function applyPick(s: Shared, by: Role, uid: string, now: number): Shared {
    const d = s.draft;
    if (!d || s.phase !== 'draft' || s.mode !== 'disputa' || d.turn !== by) return s;
    const card = d.options.find((o) => o.uid === uid);
    if (!card) return s;
    const picks = { ...d.picks, [by]: [...d.picks[by], card] };
    const rest = d.options.filter((o) => o.uid !== uid);
    if (by === disputaFirst(s.seed, d.round))
        return {
            ...s,
            draft: { ...d, picks, options: rest, turn: other(by), deadline: both(now + pickMs(d.round)) },
        };
    // as 2 que sobram queimam
    return nextRound(s, { ...d, picks, burned: [...d.burned, ...rest.map((o) => o.speciesId)] }, now);
}

function applyChoice(s: Shared, by: Role, value: unknown, now: number): Shared {
    const c = s.choice;
    if (!c || c.opened[by] || !c.seal[by] || c.seal[by] === '-' || !ROLES.every((r) => c.seal[r])) return s;
    let team: TeamSetup | null = null;
    if (s.phase === 'team') {
        if (validarTimeDuelo(value, specialLimitOf(s)).length) return s;
        team = teamFromRecipe(value as DuelTeamRecipe, '');
    } else if (s.phase === 'preview' && s.teams[by]) team = applyPreview(s.teams[by]!, value as PreviewCfg);
    if (!team) return s;
    const choice = { ...c, opened: { ...c.opened, [by]: true } };
    const next = { ...s, choice, teams: { ...s.teams, [by]: team } };
    if (!ROLES.every((r) => choice.opened[r] || choice.seal[r] === '-')) return next;
    // time pronto: os dois times abertos vão pra mesma escalação lacrada dos drafts (30 s vendo o rival)
    return s.phase === 'team'
        ? { ...next, phase: 'preview', choice: emptyChoice(now + PREVIEW_MS) }
        : startPlay(next, now);
}

/** Aplica uma intenção de `by`. Devolve o mesmo objeto quando não vale (sem subir `rev`). */
export function reduce(s: Shared, i: Intent, by: Role, ctx: Ctx): Shared {
    const next = apply(s, i, by, ctx);
    return next === s ? s : { ...next, rev: s.rev + 1 };
}

const isHex64 = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

function apply(s: Shared, i: Intent, by: Role, ctx: Ctx): Shared {
    const { now } = ctx;
    if (!i || typeof i !== 'object') return s;
    switch (i.k) {
        case 'join': {
            const cur = s.peers[by];
            if (!i.peer || (cur && cur.id !== i.peer.id)) return s;
            return { ...s, peers: { ...s.peers, [by]: i.peer } };
        }
        case 'ready': {
            if (s.phase !== 'lobby') return s;
            if (i.ready && !isHex64(i.commit)) return s;
            // pronto com outra regra na tela (a sala mudou ou o jogo é outro): não vale
            if (i.ready && (i.specialLimit ?? null) !== specialLimitOf(s)) return s;
            const ready = { ...s.ready, [by]: !!i.ready };
            const commits = { ...s.commits, [by]: i.ready ? i.commit : undefined };
            const next = { ...s, ready, commits };
            return ready.host && ready.guest && versionsOk(next) ? startDraftOrTeam(next, now) : next;
        }
        case 'roundReveal': {
            const d = s.draft;
            if (s.phase !== 'draft' || !d || i.round !== d.round || s.roundReveals[by][i.round] || !isHex64(i.x))
                return s;
            const mine = [...s.roundReveals[by]];
            mine[i.round] = i.x;
            return { ...s, roundReveals: { ...s.roundReveals, [by]: mine } };
        }
        case 'roundSeed': {
            const d = s.draft;
            if (s.phase !== 'draft' || !d || i.round !== d.round || d.seeds[i.round]) return s;
            const seeds = [...d.seeds];
            seeds[i.round] = i.seed;
            const deadline = both(now + pickMs(d.round));
            if (s.mode === 'pacotes') return { ...s, draft: { ...d, seeds, deadline } };
            const taken = new Set([...d.burned, ...[...d.picks.host, ...d.picks.guest].map((p) => p.speciesId)]);
            return {
                ...s,
                draft: {
                    ...d,
                    seeds,
                    deadline,
                    options: disputaOptions(i.seed, d.round, taken),
                    turn: disputaFirst(s.seed, d.round),
                },
            };
        }
        case 'pick':
            return applyPick(s, by, i.uid, now);
        case 'seal': {
            const d = s.draft;
            if (s.mode !== 'pacotes' || s.phase !== 'draft' || !d || i.round !== d.round || !d.seeds[d.round]) return s;
            if (d.seals[by][d.round] || !isHex64(i.seal)) return s;
            const seals = { ...d.seals, [by]: [...d.seals[by]] };
            seals[by][d.round] = i.seal;
            const draft = { ...d, seals };
            return ROLES.every((r) => seals[r][d.round]) ? nextRound(s, draft, now) : { ...s, draft };
        }
        case 'picksOpened': {
            const d = s.draft;
            if (s.mode !== 'pacotes' || !d || d.round < DRAFT_PICKS || d.picks[by].length) return s;
            if (!Array.isArray(i.cards) || i.cards.length !== DRAFT_PICKS) return s;
            const draft = { ...d, picks: { ...d.picks, [by]: i.cards } };
            const next = { ...s, draft };
            return ROLES.every((r) => draft.picks[r].length) ? toPreview(next, now) : next;
        }
        case 'choiceSeal': {
            const c = s.choice;
            if (!c || (s.phase !== 'team' && s.phase !== 'preview') || c.seal[by] || !isHex64(i.seal)) return s;
            return { ...s, choice: { ...c, seal: { ...c.seal, [by]: i.seal } } };
        }
        case 'choiceOpen':
            return applyChoice(s, by, i.value, now);
        case 'reveal': {
            if (s.phase !== 'match' || !Number.isInteger(i.seg) || i.seg < 0 || !isHex64(i.x)) return s;
            const mine = [...s.reveals[by]];
            if (mine[i.seg] === i.x && (!i.hash || s.segHash[by][i.seg] === i.hash)) return s;
            mine[i.seg] = i.x;
            const segHash = i.hash ? { ...s.segHash, [by]: { ...s.segHash[by], [i.seg]: i.hash } } : s.segHash;
            const next = { ...s, reveals: { ...s.reveals, [by]: mine }, segHash };
            // as duas telas se separaram: anula em vez de seguir com placares diferentes. O hash vem como
            // "<ordens antes da divisa>:<hash>": com números diferentes uma das telas ainda não tem a ordem (ela
            // refaz). Só anula com 2 trechos SEGUIDOS diferentes: um hash errado sozinho (ou inventado) não anula
            const k = i.seg;
            if (i.hash && segMismatch(segHash, k) && (segMismatch(segHash, k - 1) || segMismatch(segHash, k + 1)))
                return {
                    ...next,
                    phase: 'done',
                    result: { score: [0, 0], shootout: null, winner: null, desync: true },
                };
            return next;
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
            // o placar é o da partida que quem aplica simulou, e só depois do apito final na tela dele
            const f = ctx.final;
            if (s.phase !== 'match' || s.result || !f) return s;
            const winner = f.winner === null ? null : f.winner === 0 ? 'host' : 'guest';
            return {
                ...s,
                phase: 'done',
                result: { score: [f.score[0], f.score[1]], shootout: f.shootout, winner },
            };
        }
        case 'claimWO': {
            if (!canClaimWO(s, by, now)) return s;
            return { ...s, phase: 'done', result: { score: [0, 0], shootout: null, winner: by, wo: true } };
        }
        case 'rematch': {
            if (s.phase !== 'done') return s;
            const rematch = { ...s.rematch, [by]: true };
            const commits = { ...s.rematchCommits, [by]: isHex64(i.commit) ? i.commit : undefined };
            if (!(rematch.host && rematch.guest)) return { ...s, rematch, rematchCommits: commits };
            const fresh: Shared = {
                ...newShared(s.room, s.peers.host!, s.mode, s.speed, ctx.newSeed ?? `${s.seed}-r`, specialLimitOf(s)),
                peers: s.peers,
                game: s.game + 1,
            };
            // revanche de um toque: mesmo modo, os dois já mandaram o lacre da partida nova, direto pro draft/time.
            // Sem lacre (versão antiga) ou com versões diferentes: volta pro lobby, como antes
            if (!isHex64(commits.host) || !isHex64(commits.guest) || !versionsOk(fresh)) return fresh;
            return startDraftOrTeam(
                { ...fresh, ready: both(true), commits: { host: commits.host, guest: commits.guest } },
                now,
            );
        }
    }
    return s;
}

/** O que identifica um time (uid sem o lado, espécie, golpes, item, formação, tática e capitão). */
function teamKey(t: TeamSetup | undefined): string {
    if (!t) return '';
    const base = (uid: string | null | undefined) => (uid ?? '').replace(/~[hg]$/, '');
    const mon = (p: PokemonInstance) => [base(p.uid), p.speciesId, p.moves.join('/'), p.item ?? ''].join(':');
    return JSON.stringify([t.lineup.map(mon), t.bench.map(mon), t.formation ?? '', t.tactic, base(t.captainUid)]);
}

/**
 * O host volta (recarregou a página, ficou em segundo plano, caiu) e o convidado, que aplicou as regras enquanto ele
 * estava fora, manda o estado. O host só fica com ele se nada do que é do host mudou: lacre, segredos abertos,
 * hashes, ordens e time do host. Resultado novo só se for W.O. do convidado depois de o host ficar fora o tempo da
 * espera (`awayMs`, medido pelo próprio host). Fora disso o host segue com o dele, e o convidado manda de novo o que
 * fez (as intenções se repetem sozinhas).
 */
export function acceptTakeover(cur: Shared, next: Shared, awayMs: number): boolean {
    if (!next?.peers || !next.reveals || !next.roundReveals || !next.segHash || !Array.isArray(next.log)) return false;
    if (next.room !== cur.room || next.rev <= cur.rev || next.peers.host?.id !== cur.peers.host?.id) return false;
    const same = next.game === cur.game;
    // revanche sem o host: só se ele já tinha pedido (e com o lacre que ele mandou)
    const rematchOk =
        next.game === cur.game + 1 &&
        cur.phase === 'done' &&
        cur.rematch.host &&
        next.commits?.host === cur.rematchCommits?.host;
    if (!same && !rematchOk) return false;
    const hostOrders = (s: Shared) => JSON.stringify(s.log.filter((o) => o.team === 0));
    const hostHashes = (s: Shared) => JSON.stringify(s.segHash.host ?? {});
    if (same) {
        if (next.commits?.host !== cur.commits.host) return false;
        if (next.reveals.host.some((x, k) => x && x !== cur.reveals.host[k])) return false;
        if (next.roundReveals.host.some((x, r) => x && x !== cur.roundReveals.host[r])) return false;
        if (hostOrders(next) !== hostOrders(cur) || hostHashes(next) !== hostHashes(cur)) return false;
        // o time do host só muda pelas escolhas dele: não pode mudar nem aparecer enquanto ele estava fora
        if (teamKey(next.teams.host) !== teamKey(cur.teams.host)) return false;
        // no lobby a partida só começa com o "pronto" do host
        if (cur.phase === 'lobby' && next.phase !== 'lobby' && !cur.ready.host) return false;
        if (cur.result) return JSON.stringify(next.result) === JSON.stringify(cur.result);
    } else if (next.teams.host || next.log.some((o) => o.team === 0) || Object.keys(next.segHash.host ?? {}).length)
        return false;
    const r = next.result;
    return !r || (!!r.wo && r.winner === 'guest' && awayMs >= WO_WAIT_MS - GRACE_MS);
}

/** Quem ficou pode encerrar por W.O.: o outro está travando a sala há pelo menos `WO_WAIT_MS`. */
export const canClaimWO = (s: Shared, by: Role, now: number) =>
    s.phase !== 'lobby' &&
    s.phase !== 'done' &&
    s.waitFor === other(by) &&
    s.waitSince !== undefined &&
    now - s.waitSince >= WO_WAIT_MS;

/**
 * Quem está travando a sala agora (null = ninguém): não abriu o segredo da rodada ou do trecho, não lacrou a escolha
 * no prazo ou não abriu o lacre depois que os dois lacraram. Só tempo esgotado conta: mensagem estranha não.
 */
export function blocker(s: Shared, ctx: Pick<Ctx, 'now' | 'atHold'>): Role | null {
    const { now } = ctx;
    const one = (missing: Role[]) => (missing.length === 1 ? missing[0] : null);
    if (s.phase === 'draft' && s.draft) {
        const d = s.draft;
        if (now < d.since + GRACE_MS) return null;
        if (d.round >= DRAFT_PICKS) return one(ROLES.filter((r) => !d.picks[r].length));
        if (!d.seeds[d.round]) return one(ROLES.filter((r) => !s.roundReveals[r][d.round]));
        if (s.mode === 'pacotes')
            return one(ROLES.filter((r) => !d.seals[r][d.round] && now >= d.deadline[r] + GRACE_MS));
        return null;
    }
    if ((s.phase === 'team' || s.phase === 'preview') && s.choice) {
        const c = s.choice;
        if (!ROLES.every((r) => c.seal[r])) return null;
        if (s.phase === 'preview' && now < (c.until ?? 0) + GRACE_MS) return null;
        return one(ROLES.filter((r) => c.seal[r] !== '-' && !c.opened[r]));
    }
    if (s.phase === 'match' && !s.result) {
        const opened = openedSegments(s.reveals.host, s.reveals.guest);
        // antes do apito ninguém trava; parado no fim do último trecho aberto, trava quem não abriu o seguinte
        const stuck = now >= (s.kickoffAt ?? 0) + GRACE_MS && (opened === 0 || !!ctx.atHold);
        return stuck ? one(ROLES.filter((r) => !s.reveals[r][opened])) : null;
    }
    return null;
}

/**
 * Prazos (quem aplica chama a cada meio segundo): carta de maior nota quando o tempo da Disputa acaba, prévia que
 * acaba sem lacre fica com o padrão, pedido de velocidade sem resposta, fim do intervalo e a espera de quem trava.
 */
export function tickTimers(s: Shared, ctx: Ctx): Shared {
    const next = timers(s, ctx);
    return next === s ? s : { ...next, rev: s.rev + 1 };
}

function timers(s: Shared, ctx: Ctx): Shared {
    const { now, present } = ctx;
    let out = s;
    const d = out.draft;
    if (
        out.phase === 'draft' &&
        d &&
        out.mode === 'disputa' &&
        d.turn &&
        d.deadline[d.turn] &&
        now >= d.deadline[d.turn]
    ) {
        if (d.options.length) out = applyPick(out, d.turn, bestFor(d.options, d.round).uid, now);
    }
    // prévia: quem não lacrou no tempo fica com o time como saiu do draft
    const c = out.choice;
    if (
        out.phase === 'preview' &&
        c?.until !== undefined &&
        now >= c.until + GRACE_MS &&
        ROLES.some((r) => !c.seal[r])
    ) {
        const seal = { ...c.seal };
        for (const r of ROLES) if (!seal[r]) seal[r] = '-';
        out = { ...out, choice: { ...c, seal } };
        if (ROLES.every((r) => seal[r] === '-' || c.opened[r])) out = startPlay(out, now);
    }
    if (out.speedAsk && now >= out.speedAsk.until) out = { ...out, speedAsk: undefined };
    if (out.phase === 'match' && out.halftime && !out.secondHalf) {
        const ht = out.halftime;
        if (now >= ht.until || ROLES.every((r) => ht.ready[r] || !present[r])) out = { ...out, secondHalf: true };
    }
    const b = blocker(out, ctx);
    if (!b) {
        if (out.waitFor) out = { ...out, waitFor: undefined, waitSince: undefined };
    } else if (out.waitFor !== b) out = { ...out, waitFor: b, waitSince: now };
    return out;
}

// ------------------------------------------------------------------ relógio e emotes

/**
 * Correção do relógio do convidado: `drift` = tick do host − o meu (positivo = estou atrás). Até meio segundo de
 * diferença, nada; até 3 s, 10% mais rápido ou mais devagar; mais que isso, pula pra frente (ou espera parado). Em
 * Lances a velocidade dá saltos: aí pula já com 1 s de diferença em vez de acelerar.
 */
export function clockAdjust(drift: number, speed: PlaybackSpeed): { rate: number; seek?: boolean } {
    const perSec = 20 * speedMult(speed);
    const soft = 0.5 * perSec;
    const hard = (speed === 'highlights' ? 1 : 3) * perSec;
    if (drift > hard) return { rate: 1, seek: true };
    if (drift < -hard) return { rate: 0 };
    if (drift > soft) return { rate: 1.1 };
    if (drift < -soft) return { rate: 0.9 };
    return { rate: 1 };
}

export type EmoteKind = 'boa' | 'golaco' | 'gg' | 'grito' | 'ops' | 'zzz' | 'choro' | 'bravo';
/** Ordem da gaveta (4 x 2, como o deck de emotes do Clash Royale): os de festa em cima, os de lamento embaixo. */
export const EMOTES: EmoteKind[] = ['boa', 'golaco', 'gg', 'grito', 'ops', 'zzz', 'choro', 'bravo'];
export const EMOTE_GAP_MS = 3_000;
export const SHOUT_GAP_MS = 10_000;

/** Limite dos emotes (vale no envio e no recebimento): 1 a cada 3 s, e o grito do capitão 1 a cada 10 s. */
export function emoteAllowed(last: { any: number; grito: number }, kind: EmoteKind, now: number): boolean {
    if (!EMOTES.includes(kind) || now - last.any < EMOTE_GAP_MS) return false;
    return kind !== 'grito' || now - last.grito >= SHOUT_GAP_MS;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Código da sala: 6 letras/números sem I, O, 0 e 1 (fácil de ditar). */
export function roomCode(rand: (n: number) => number): string {
    return Array.from({ length: 6 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join('');
}
export const isRoomCode = (s: string | null | undefined): s is string => !!s && /^[A-HJ-NP-Z2-9]{6}$/.test(s);
