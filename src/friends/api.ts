import { create } from 'zustand';
import { cloudEnabled, cloudUserId, loadCloud, useCloud } from '../cloud/cloud';
import { type PublicInfo, publicInfo } from '../league/api';
import { useGame } from '../store/game-store';

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
    const friends = of('amigo');
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
    async challenge(code, room) {
        const sb = await sbOrNull();
        if (!sb) return 'offline';
        const { data, error } = await sb.rpc('amigos_desafiar', { p_code: code, p_room: room });
        return error ? 'offline' : (data as string);
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
}

export const useFriends = create<FriendsState>(() => ({ code: null, rows: null, status: null, challenging: null }));
// saiu do Duelo sem criar a sala: o desafio não fica pendurado pra próxima vez
useGame.subscribe((s) => {
    if (s.screen !== 'duel' && useFriends.getState().challenging) useFriends.setState({ challenging: null });
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

/** Faz a ação e recarrega a lista. */
export async function friendAction<T>(fn: (s: FriendsServer) => Promise<T>): Promise<T> {
    const r = await fn(server);
    await refreshFriends();
    return r;
}

/** Depois que a sala do Duelo nasce: manda o desafio pro amigo escolhido no "Desafiar". */
export async function sendPendingChallenge(room: string) {
    const c = useFriends.getState().challenging;
    if (!c) return null;
    useFriends.setState({ challenging: null });
    return server.challenge(c.code, room);
}
