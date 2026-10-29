import { create } from 'zustand';
import { cloudEnabled, cloudUserId, loadCloud, useCloud } from '../cloud/cloud';
import { type PublicInfo, publicInfo } from '../league/api';
import type { Peer } from '../net/duel-state';
import { duelWins } from '../store/duels';
import { type GameState, useGame } from '../store/game-store';
import { playedCount } from '../store/profile';

/**
 * Amigos (docs/planos/amigos.md): código de amigo, pedido → aceite, lista, desafiar pro Duelo, remover e bloquear.
 * Conversa com as funções `amigos_*` do banco (supabase/migrations/20261020120000_amigos.sql). Só conta Google; sem
 * Supabase ou sem conta, nada aparece. `?demo=amigos` (dev) troca o servidor por um de mentira (src/friends/demo.ts).
 * O navegador só vê o código de amigo e o nome público (treinador + clube), nunca o id da conta nem o e-mail.
 */

export type FriendStatus = 'amigo' | 'recebido' | 'enviado' | 'bloqueado';

export interface FriendRow {
    code: string;
    trainer: string;
    club: string;
    club_tag: string;
    club_color: string;
    status: FriendStatus;
    since: string;
    /** Sala do Duelo pra onde esse amigo te chamou nos últimos 15 min. */
    room: string | null;
    room_at: string | null;
    /** Amigo com o jogo aberto nos últimos 150 s (só vem pra amigo aceito). */
    online?: boolean;
}

export type AskStatus =
    | 'enviado'
    | 'amigos'
    | 'ja_amigos'
    | 'ja_pediu'
    | 'nao_achei'
    | 'voce_mesmo'
    | 'limite_dia'
    | 'limite_pedidos'
    | 'limite_amigos'
    | 'offline';

export interface AskResult {
    status: AskStatus;
    trainer?: string | null;
    club?: string | null;
}

/** O seu perfil como vai pra sala do Duelo, sem o id da conta (a vitrine dos amigos usa o mesmo). */
export type PublicPeer = Omit<Peer, 'id' | 'engine' | 'app' | 'anon'>;

export interface FriendNumbers {
    matches: number;
    wins: number;
    goals: number;
    titles: number;
    perfect: number;
    bestStreak: number;
    duelWins: number;
    /** Espécies que já jogaram pelo time (Pokédex). */
    played: number;
}

/** Um título da Copa na vitrine (os 3 últimos do Hall da Fama). */
export interface FriendTitle {
    date: number;
    club: string;
    color: string;
    /** Placar da final, do lado de quem ganhou. */
    final: [number, number];
    perfect: boolean;
    captain: number;
    shiny: boolean;
}

/**
 * Vitrine do perfil do amigo (supabase/migrations/20261021120000_perfil_do_amigo.sql): o mesmo pacote da sala do
 * Duelo mais os números e os últimos títulos. Só amigo aceito lê; quem lê valida cada campo (friendInfo).
 */
export interface FriendProfile extends PublicPeer {
    numbers: FriendNumbers;
    hall: FriendTitle[];
}

/** Pelo código de amigo, ou pelo rival do Duelo (o id que já está na sala). */
export type AskTarget = { code: string } | { user: string };

export interface FriendsServer {
    /** Cria/atualiza o seu cartão (nome público) e devolve o seu código. */
    card(info: PublicInfo): Promise<string | null>;
    list(): Promise<FriendRow[] | null>;
    ask(target: AskTarget): Promise<AskResult>;
    respond(code: string, accept: boolean): Promise<string>;
    remove(code: string): Promise<void>;
    block(code: string): Promise<void>;
    unblock(code: string): Promise<void>;
    challenge(code: string, room: string): Promise<string>;
    /** Publica a sua vitrine (os amigos veem no seu perfil). */
    vitrine(p: FriendProfile): Promise<boolean>;
    /** A vitrine de um amigo (null = não é amigo, ou ele ainda não abriu a versão com vitrine). Dado de fora. */
    profile(code: string): Promise<unknown>;
    /** "Estou com o jogo aberto" (os amigos veem online). */
    ping(): Promise<void>;
    /** Ouve os avisos na hora (pedido, amizade aceita, desafio). Devolve a função que para de ouvir. */
    listen(on: (event: string) => void): () => void;
}

// ------------------------------------------------------------------ código de amigo

/** 8 letras/números sem I, O, 0 e 1 (o mesmo alfabeto da sala do Duelo). */
export const FRIEND_CODE_LEN = 8;
export const isFriendCode = (s: string) => /^[A-HJ-NP-Z2-9]{8}$/.test(s);
/** O que a pessoa digitou (minúscula, espaço, traço) → o código. */
export const normalizeFriendCode = (s: string) =>
    s
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, FRIEND_CODE_LEN);
/** "K7M2QXAB" → "K7M2 QXAB" (fácil de ditar). */
export const formatFriendCode = (code: string) => `${code.slice(0, 4)} ${code.slice(4)}`;

/** Respostas do amigos_desafiar (qualquer outra coisa, ou erro do RPC, vira 'offline'). */
const CHALLENGE_STATUS = ['enviado', 'nao_achei', 'rapido_demais', 'sala', 'offline'] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUS)[number];

/** Desafio vale 15 minutos (o banco também confere). */
export const CHALLENGE_MS = 15 * 60 * 1000;

export interface FriendGroups {
    challenges: FriendRow[];
    received: FriendRow[];
    friends: FriendRow[];
    sent: FriendRow[];
    blocked: FriendRow[];
}

/** Separa a lista do servidor em grupos, na ordem da tela. Desafio vencido (relógio do aparelho) não conta. */
export function groupFriends(rows: FriendRow[], now: number): FriendGroups {
    const byName = (a: FriendRow, b: FriendRow) => a.trainer.localeCompare(b.trainer);
    const live = (r: FriendRow) => !!r.room && !!r.room_at && now - Date.parse(r.room_at) < CHALLENGE_MS;
    const of = (s: FriendStatus) => rows.filter((r) => r.status === s).sort(byName);
    // quem está online primeiro
    const friends = of('amigo').sort((a, b) => Number(!!b.online) - Number(!!a.online));
    return {
        challenges: friends.filter(live).sort((a, b) => Date.parse(b.room_at!) - Date.parse(a.room_at!)),
        received: of('recebido'),
        friends: friends.map((r) => (live(r) ? r : { ...r, room: null, room_at: null })),
        sent: of('enviado'),
        blocked: of('bloqueado'),
    };
}

// ------------------------------------------------------------------ servidor

const sbOrNull = async () => (cloudUserId() ? await loadCloud().catch(() => null) : null);

const real: FriendsServer = {
    async card(info) {
        const sb = await sbOrNull();
        if (!sb) return null;
        const { data, error } = await sb.rpc('amigos_cartao', {
            p_trainer: info.trainer,
            p_club: info.club,
            p_tag: info.tag,
            p_color: info.color,
        });
        return error ? null : (data as string);
    },
    async list() {
        const sb = await sbOrNull();
        if (!sb) return null;
        const { data, error } = await sb.rpc('amigos_lista');
        return error ? null : (data as FriendRow[]);
    },
    async ask(target) {
        const sb = await sbOrNull();
        if (!sb) return { status: 'offline' };
        const { data, error } = await sb.rpc(
            'amigos_pedir',
            'code' in target ? { p_code: target.code } : { p_user: target.user },
        );
        const row = (data as AskResult[] | null)?.[0];
        return error || !row ? { status: 'offline' } : row;
    },
    async respond(code, accept) {
        const sb = await sbOrNull();
        if (!sb) return 'offline';
        const { data, error } = await sb.rpc('amigos_responder', { p_code: code, p_aceitar: accept });
        return error ? 'offline' : (data as string);
    },
    async remove(code) {
        await (await sbOrNull())?.rpc('amigos_remover', { p_code: code });
    },
    async block(code) {
        await (await sbOrNull())?.rpc('amigos_bloquear', { p_code: code });
    },
    async unblock(code) {
        await (await sbOrNull())?.rpc('amigos_desbloquear', { p_code: code });
    },
    async ping() {
        await (await sbOrNull())?.rpc('amigos_ping');
    },
    listen(on) {
        // canal privado `amigos:<id>`: só o dono ouve (política em realtime.messages); quem fala é o banco
        let stop = false;
        let off = () => {};
        void (async () => {
            const sb = await sbOrNull();
            const uid = cloudUserId();
            if (!sb || !uid || stop) return;
            await sb.realtime.setAuth();
            const ch = sb
                .channel(`amigos:${uid}`, { config: { private: true } })
                .on('broadcast', { event: '*' }, (m) => on(m.event))
                .subscribe();
            off = () => void sb.removeChannel(ch);
            if (stop) off();
        })();
        return () => {
            stop = true;
            off();
        };
    },
    async challenge(code, room) {
        const sb = await sbOrNull();
        if (!sb) return 'offline';
        const { data, error } = await sb.rpc('amigos_desafiar', { p_code: code, p_room: room });
        return error ? 'offline' : (data as string);
    },
    async vitrine(p) {
        const sb = await sbOrNull();
        if (!sb) return false;
        const { error } = await sb.rpc('amigos_vitrine', { p_perfil: p });
        return !error;
    },
    async profile(code) {
        const sb = await sbOrNull();
        if (!sb) return null;
        const { data, error } = await sb.rpc('amigos_perfil', { p_code: code });
        return error ? null : data;
    },
};

let server: FriendsServer = real;
/** Só o `?demo=amigos` do dev troca o servidor. */
export const setFriendsServer = (s: FriendsServer) => {
    server = s;
};
export const friends = (): FriendsServer => server;
/** Tem servidor (Supabase configurado, ou o de mentira do `?demo=`). */
export const friendsOnline = () => cloudEnabled || server !== real;

// ------------------------------------------------------------------ estado da tela

interface FriendsState {
    code: string | null;
    rows: FriendRow[] | null;
    /** null = ainda não carregou; 'off' = sem servidor/sem conta Google. */
    status: 'loading' | 'ok' | 'off' | 'error' | null;
    /** "Desafiar" foi tocado: a próxima sala criada no Duelo chama esse amigo. */
    challenging: { code: string; trainer: string } | null;
    /** O que o banco respondeu ao desafio da sala que acabou de nascer (a sala mostra; erro pede o link). */
    challengeSent: { trainer: string; status: ChallengeStatus } | null;
    /** Salas dos avisos que a pessoa fechou (o aviso por cima da tela não volta). */
    dismissed: string[];
    /** A aba Amigos está aberta (o aviso por cima não repete o que a lista já mostra). */
    listOpen: boolean;
}

export const useFriends = create<FriendsState>(() => ({
    code: null,
    rows: null,
    status: null,
    challenging: null,
    challengeSent: null,
    dismissed: [],
    listOpen: false,
}));
// saiu do Duelo sem criar a sala: o desafio não fica pendurado pra próxima vez. Só na troca de tela saindo do Duelo:
// a tela nova chega depois do resto do estado (screen-transition.ts), e olhar só `screen !== 'duel'` apagava o
// desafio no caminho do Perfil pro Duelo (o convite nunca saía)
useGame.subscribe((s, prev) => {
    if (prev.screen === 'duel' && s.screen !== 'duel') useFriends.setState({ challenging: null, challengeSent: null });
});

let cardKey = '';

/** Atualiza o cartão (o nome do Perfil pode ter mudado) e a lista. */
export async function refreshFriends() {
    if (!friendsOnline() || !useCloud.getState().user) {
        useFriends.setState({ status: 'off' });
        return;
    }
    if (!useFriends.getState().rows) useFriends.setState({ status: 'loading' });
    // o cartão só sobe na 1ª vez e quando o nome/clube do Perfil muda (a lista é que é conferida a cada 30 s)
    const info = publicInfo(useGame.getState().profile);
    const key = JSON.stringify(info);
    if (key !== cardKey || !useFriends.getState().code) {
        const code = await server.card(info);
        if (code) {
            cardKey = key;
            useFriends.setState({ code });
        }
    }
    const rows = await server.list();
    useFriends.setState({ rows, status: rows ? 'ok' : 'error' });
}

/** A sua vitrine: o perfil da sala do Duelo + números da carreira + os 3 últimos títulos do Hall da Fama. */
export function buildVitrine(
    pub: PublicPeer,
    s: Pick<GameState, 'career' | 'records' | 'hall' | 'dex' | 'duels'>,
): FriendProfile {
    return {
        ...pub,
        numbers: {
            matches: s.career.matches,
            wins: s.career.wins,
            goals: s.career.goalsFor,
            titles: s.records.titles,
            perfect: s.records.perfect,
            bestStreak: s.records.bestStreak ?? 0,
            duelWins: duelWins(s.records, s.duels),
            played: playedCount(s.dex),
        },
        hall: s.hall.slice(0, 3).map((h) => {
            const cap = h.squad.find((p) => p.captain) ?? h.squad[0];
            return {
                date: h.date,
                club: h.club,
                color: h.clubColor,
                final: h.scores.at(-1) ?? [0, 0],
                perfect: h.perfect,
                captain: cap?.speciesId ?? 25,
                shiny: !!cap?.shiny,
            };
        }),
    };
}

let vitrineKey = '';

/** Sobe a vitrine quando ela muda (uma vez por abertura do jogo, e de novo a cada título, carta nova…). */
export async function publishVitrine(p: FriendProfile) {
    const key = JSON.stringify(p);
    if (key === vitrineKey || !useFriends.getState().code) return;
    vitrineKey = key;
    if (!(await server.vitrine(p))) vitrineKey = '';
}

/** Faz a ação e recarrega a lista. */
export async function friendAction<T>(fn: (s: FriendsServer) => Promise<T>): Promise<T> {
    const r = await fn(server);
    await refreshFriends();
    return r;
}

/** "Desafiar": guarda o amigo e abre o Duelo; a sala que nascer chama ele (sendPendingChallenge). */
export function challengeFriend(r: { code: string; trainer: string }) {
    useFriends.setState({ challenging: { code: r.code, trainer: r.trainer } });
    useGame.getState().go('duel');
}

/** Depois que a sala do Duelo nasce: manda o desafio pro amigo escolhido no "Desafiar". */
export async function sendPendingChallenge(room: string) {
    const c = useFriends.getState().challenging;
    if (!c) return null;
    useFriends.setState({ challenging: null, challengeSent: null });
    const r = await server.challenge(c.code, room).catch(() => 'offline');
    const status: ChallengeStatus = (CHALLENGE_STATUS as readonly string[]).includes(r)
        ? (r as ChallengeStatus)
        : 'offline';
    useFriends.setState({ challengeSent: { trainer: c.trainer, status } });
    return status;
}

// ------------------------------------------------------------------ online e avisos na hora

/**
 * Enquanto o jogo está aberto e visível, com conta Google e alguém na lista (amigo ou pedido enviado): "online" a cada
 * 60 s (amigos_ping) e o canal de avisos ligado. Aba escondida desliga os dois (economiza conexão do Realtime: o plano
 * grátis aguenta 200 ao mesmo tempo); ao voltar, recarrega a lista (o convite vale 15 min, nada se perde).
 */
let liveOff: (() => void) | null = null;
let pingTimer = 0;
const visible = () => typeof document === 'undefined' || document.visibilityState === 'visible';
const wantLive = () =>
    !!useCloud.getState().user &&
    friendsOnline() &&
    visible() &&
    !!useFriends.getState().rows?.some((r) => r.status === 'amigo' || r.status === 'enviado');

function syncLive() {
    const want = wantLive();
    if (want && !liveOff) {
        liveOff = server.listen(() => void refreshFriends());
        void server.ping();
        pingTimer = window.setInterval(() => void server.ping(), 60_000);
    } else if (!want && liveOff) {
        liveOff();
        liveOff = null;
        window.clearInterval(pingTimer);
    }
}

export function startFriendsLive() {
    const wake = () => {
        if (useCloud.getState().user && friendsOnline() && visible()) void refreshFriends().then(syncLive);
        else syncLive();
    };
    useCloud.subscribe((s, prev) => s.user !== prev.user && wake());
    useFriends.subscribe((s, prev) => s.rows !== prev.rows && syncLive());
    document.addEventListener('visibilitychange', wake);
    wake();
}
