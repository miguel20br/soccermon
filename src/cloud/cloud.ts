import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { migrateSave, type PersistedSave, SAVE_VERSION, useGame } from '../store/game-store';
import { DEFAULT_PROFILE, EMPTY_CAREER } from '../store/profile';
import {
    hasProgress,
    mergeRecords,
    mergeSaves,
    mergeSettings,
    type Plan,
    planReconcile,
    type SaveSummary,
    type Side,
    summarize,
} from './reconcile-plan';

/**
 * Contas (login com Google) e save na nuvem, pelo Supabase. Sem as variáveis de ambiente o jogo continua
 * 100% local (visitante) e nada daqui aparece. O save local (IndexedDB) continua sendo a fonte do jogo;
 * a nuvem é uma cópia. Ao entrar, reconcile-plan.ts decide: progresso de visitante só vai para a conta se o
 * jogador confirmar, recordes e Pokédex somam o melhor dos dois e copa em andamento nunca some sem aviso.
 */
const env = import.meta.env;
const URL: string | undefined = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const KEY: string | undefined =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(URL && KEY);
/** Endereço e chave pública do Supabase (as estatísticas anônimas usam a mesma API). */
export const cloudApi = URL && KEY ? { url: URL, key: KEY } : null;
/**
 * Cliente do Supabase (~200 KB): fica fora da Home. Carrega já no início só se houver sessão guardada ou volta do login
 * (loadCloud em startCloudSync); senão, quando a pessoa entra com Google ou abre o duelo sem conta. As estatísticas
 * anônimas não dependem dele (POST direto na API, em analytics/track.ts).
 */
let supabase: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;

export function loadCloud(): Promise<SupabaseClient | null> {
    if (!URL || !KEY) return Promise.resolve(null);
    if (loading) return loading;
    loading = import('@supabase/supabase-js').then(({ createClient }) => {
        const client = createClient(URL, KEY, {
            auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true },
            // duelo (Realtime): batida num Web Worker (aba em segundo plano não congela o socket) e, se o socket cair
            // em silêncio, reconecta. O socket só abre quando a tela do duelo assina o canal da sala.
            realtime: {
                worker: true,
                heartbeatCallback: (status) => {
                    if (status === 'disconnected' || status === 'timeout') client.realtime.connect();
                },
            },
        });
        supabase = client;
        client.auth.onAuthStateChange(onAuthChange);
        // ligar o Google na conta anônima voltou com "esse Google já tem conta": entra nela do jeito normal
        if (linkConflict(window.location.search + window.location.hash, takeLinkPending())) {
            void client.auth.initialize().then(() => signInWithGoogle(false));
        }
        return client;
    });
    // sem rede agora: a próxima chamada tenta de novo
    loading.catch(() => {
        loading = null;
    });
    return loading;
}

/** Cliente do Supabase pro Realtime do duelo (null sem as variáveis de ambiente). Quem tem id na sala já o carregou. */
export const realtimeClient = () => supabase;

/** Quando o save local mudou pela última vez (para comparar com a nuvem). */
const LOCAL_TS = 'soccermon-local-updated';
/** Hora do save quando aparelho e nuvem estavam iguais pela última vez (subiu ou desceu): diz quem mudou desde então. */
const LOCAL_SYNCED = 'soccermon-local-synced';
/** De qual conta é o save deste aparelho ('' = visitante). Outra conta entrando não herda a copa nem os recordes. */
const LOCAL_OWNER = 'soccermon-local-owner';
const UPLOAD_DELAY_MS = 2500;

export type CloudStatus = 'off' | 'guest' | 'syncing' | 'saved' | 'error';

/** Pergunta ao jogador depois do login (o que fazer com o progresso do aparelho). */
export interface LinkAsk {
    /** bring = levar para a conta nova; merge = juntar com o save da conta; cup = mesma conta, copas diferentes. */
    kind: 'bring' | 'merge' | 'cup';
    device: SaveSummary;
    cloud: SaveSummary | null;
    /** Os dois lados têm copa em andamento: o jogador escolhe qual continua (a outra fica guardada). */
    cupChoice: boolean;
    /** Sem escolha de copa: de que lado é a copa que continua. */
    keep: Side;
}

interface CloudState {
    status: CloudStatus;
    user: { name: string; avatar: string | null } | null;
    /** Pergunta aberta depois do login (nada sobe nem muda até a resposta). */
    ask: LinkAsk | null;
    /** Aviso pequeno depois do login: o save do aparelho era de outra conta. */
    notice: 'other-account' | null;
    /** Como terminou o último login (para a estatística `login`). */
    lastLink: { merged: boolean; choice: Side | null } | null;
    /**
     * Sessão anônima do duelo ("Jogar agora", sem conta): só serve pro canal da sala. Não sobe nem mexe no save da
     * nuvem; o `user` continua null (pro resto do jogo, visitante).
     */
    anonId: string | null;
}

export const useCloud = create<CloudState>(() => ({
    status: cloudEnabled ? 'guest' : 'off',
    user: null,
    ask: null,
    notice: null,
    lastLink: null,
    anonId: null,
}));

let userId: string | null = null;
let uploadTimer = 0;
let applying = false;
/** Mudança vinda da nuvem (não é ação do jogador): as estatísticas ignoram. */
export const isApplyingCloud = () => applying;
/** Marca que o jogador clicou em entrar (o redirecionamento volta na mesma aba). */
const LOGIN_PENDING = 'soccermon-login-pending';
/** Sessão guardada (Google ou duelo sem conta) ou volta do login: o Supabase carrega logo no início. */
function hasAuthTrace(): boolean {
    try {
        if (sessionStorage.getItem(LOGIN_PENDING)) return true;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            // sb-<projeto>-auth-token (sessão) e sb-<projeto>-auth-token-code-verifier (login no meio)
            if (k?.startsWith('sb-') && k.includes('-auth-token')) return true;
        }
    } catch {
        // sem storage não dá pra saber: carrega, como antes
        return true;
    }
    return /[?&#](code|error_description|access_token)=/.test(window.location.search + window.location.hash);
}
const markLoginPending = () => {
    try {
        sessionStorage.setItem(LOGIN_PENDING, '1');
    } catch {
        // sem sessionStorage: o evento de login só não é contado
    }
};
/** true uma vez só, logo depois de um login que o jogador pediu (não a cada carregamento com sessão aberta). */
export function takeLoginPending(): boolean {
    try {
        const v = sessionStorage.getItem(LOGIN_PENDING) === '1';
        sessionStorage.removeItem(LOGIN_PENDING);
        return v;
    } catch {
        return false;
    }
}
/**
 * Entre o login e a comparação com a nuvem nada sobe (senão o save local atropela o da nuvem antes da comparação).
 * Continua ligado enquanto a pergunta do login está aberta: se a aba fechar, nada mudou e a pergunta volta.
 */
let reconciling = false;
/** Contexto da pergunta aberta (o save da conta lido no login). */
let pending: { uid: string; cloud: Partial<PersistedSave> | undefined; cloudTs: number; plan: Plan } | null = null;

const readNum = (key: string) => {
    try {
        return Number(localStorage.getItem(key)) || 0;
    } catch {
        return 0;
    }
};
const writeNum = (key: string, n: number) => {
    try {
        localStorage.setItem(key, String(n));
    } catch {
        // modo privado: só perde a comparação de data (a nuvem ganha)
    }
};
const readLocalTs = () => readNum(LOCAL_TS);
const writeLocalTs = (ts: number) => writeNum(LOCAL_TS, ts);
const writeSynced = (ts: number) => writeNum(LOCAL_SYNCED, ts);

const readOwner = () => {
    try {
        return localStorage.getItem(LOCAL_OWNER) ?? '';
    } catch {
        return '';
    }
};
const writeOwner = (id: string) => {
    try {
        localStorage.setItem(LOCAL_OWNER, id);
    } catch {
        // modo privado: sem dono gravado, o save conta como visitante
    }
};

function snapshot(): PersistedSave {
    const { run, settings, records, profile, dex, moves, career, onboarded, parkedRuns, hall, duels } =
        useGame.getState();
    return { run, settings, records, profile, dex, moves, career, onboarded, parkedRuns, hall, duels };
}

/** Sobe o save; devolve false se a nuvem recusou (pausada, fora do ar, sem espaço). */
async function upload(): Promise<boolean> {
    if (!supabase || !userId) return true;
    useCloud.setState({ status: 'syncing' });
    const ts = readLocalTs() || Date.now();
    const { error } = await supabase.from('saves').upsert({
        user_id: userId,
        data: snapshot(),
        version: SAVE_VERSION,
        updated_at: new Date(ts).toISOString(),
    });
    if (!error) writeSynced(ts);
    useCloud.setState({ status: error ? 'error' : 'saved' });
    return !error;
}

function scheduleUpload() {
    clearTimeout(uploadTimer);
    uploadTimer = window.setTimeout(() => void upload(), UPLOAD_DELAY_MS);
}

/** Espera o save local (IndexedDB) carregar antes de comparar com a nuvem. */
function hydrated(): Promise<void> {
    if (useGame.persist.hasHydrated()) return Promise.resolve();
    return new Promise((resolve) => {
        const off = useGame.persist.onFinishHydration(() => {
            off();
            resolve();
        });
    });
}

async function onSignedIn(session: Session) {
    if (!supabase) return;
    userId = session.user.id;
    const meta = session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string };
    const name = meta.full_name ?? meta.name ?? session.user.email ?? 'Treinador';
    useCloud.setState({ status: 'syncing', user: { name, avatar: meta.avatar_url ?? null }, notice: null });
    // perfil só para exibição (nome e foto do Google); nunca usado para autorização
    await supabase.from('profiles').upsert({
        id: userId,
        display_name: name,
        avatar_url: meta.avatar_url ?? null,
        updated_at: new Date().toISOString(),
    });

    await hydrated();
    reconciling = true;
    let asking = false;
    try {
        asking = await reconcile(userId);
    } finally {
        // pergunta aberta: continua sem subir nada até a resposta
        if (!asking) reconciling = false;
    }
}

/** Partes do save que importam para saber se a junção mudou algo em relação à nuvem. */
const SYNC_KEYS = [
    'run',
    'records',
    'profile',
    'dex',
    'moves',
    'career',
    'onboarded',
    'parkedRuns',
    'hall',
    'duels',
] as const;
/** JSON com as chaves em ordem (a ordem de inserção não conta como diferença). */
const stable = (v: unknown): unknown =>
    Array.isArray(v)
        ? v.map(stable)
        : v && typeof v === 'object'
          ? Object.fromEntries(
                Object.keys(v)
                    .sort()
                    .map((k) => [k, stable((v as Record<string, unknown>)[k])]),
            )
          : (v ?? null);
const same = (a: unknown, b: unknown) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

/** Aplica a junção no aparelho, marca o dono e sobe se ficou diferente da nuvem. */
async function applyMerge(
    uid: string,
    cloud: Partial<PersistedSave> | undefined,
    cloudTs: number,
    keep: Side,
    stale: Side | null,
) {
    const local = snapshot();
    const merged = mergeSaves(local, cloud, keep, stale);
    applying = true;
    // trocou a copa: volta para a tela inicial (a partida aberta era da outra)
    useGame.setState({ ...merged, ...(merged.run !== local.run ? { screen: 'home' as const, match: null } : {}) });
    applying = false;
    writeOwner(uid);
    if (cloud && SYNC_KEYS.every((k) => same(cloud[k], merged[k]))) {
        writeLocalTs(cloudTs);
        writeSynced(cloudTs);
        useCloud.setState({ status: 'saved' });
        return;
    }
    // a junção é mais nova que os dois lados
    writeLocalTs(Math.max(Date.now(), cloudTs + 1));
    await upload();
}

/** Login terminado (com ou sem pergunta): avisa as estatísticas. */
const finishLink = (merged: boolean, choice: Side | null) => useCloud.setState({ lastLink: { merged, choice } });

/** Compara o save do aparelho com o da conta. Devolve true se abriu a pergunta (falta a resposta do jogador). */
async function reconcile(uid: string): Promise<boolean> {
    if (!supabase) return false;
    const { data, error } = await supabase
        .from('saves')
        .select('data, updated_at, version')
        .eq('user_id', uid)
        .maybeSingle();
    if (error || userId !== uid) {
        if (error) useCloud.setState({ status: 'error' });
        return false;
    }
    const local = snapshot();
    const cloudTs = data ? Date.parse(data.updated_at) || 0 : 0;
    // saves da 0.7 (v4) ainda estão na nuvem: passam pela mesma migração do aparelho
    const cloud = data?.data
        ? (migrateSave(data.data as Partial<PersistedSave>, Number(data.version) || 4) as Partial<PersistedSave>)
        : undefined;
    const localTs = readLocalTs();
    const syncedTs = readNum(LOCAL_SYNCED);
    const plan = planReconcile({ local, cloud, owner: readOwner(), uid, localTs, cloudTs, syncedTs });

    switch (plan.kind) {
        case 'other-account': {
            // o save deste aparelho é de outra conta (continua guardado nela): esta começa com a nuvem ou do zero
            applying = true;
            useGame.setState({
                run: cloud?.run ?? null,
                settings: mergeSettings(local.settings, cloud?.settings, 'cloud'),
                records: mergeRecords({ cups: 0, titles: 0, perfect: 0 }, cloud?.records),
                profile: { ...DEFAULT_PROFILE, ...cloud?.profile },
                dex: cloud?.dex ?? {},
                moves: cloud?.moves ?? {},
                career: { ...EMPTY_CAREER, ...cloud?.career },
                onboarded: local.onboarded || !!cloud?.onboarded,
                parkedRuns: cloud?.parkedRuns ?? [],
                hall: cloud?.hall ?? [],
                duels: cloud?.duels ?? [],
                screen: 'home',
                match: null,
            });
            applying = false;
            writeLocalTs(cloudTs || Date.now());
            writeOwner(uid);
            if (hasProgress(local)) useCloud.setState({ notice: 'other-account' });
            if (cloud) {
                writeSynced(cloudTs);
                useCloud.setState({ status: 'saved' });
            } else await upload();
            finishLink(false, null);
            return false;
        }
        case 'ask-bring':
        case 'ask-merge':
        case 'ask-cup': {
            // nada muda nem sobe até o jogador responder (fechar a aba = a pergunta volta no próximo acesso)
            pending = { uid, cloud, cloudTs, plan };
            const kind = plan.kind === 'ask-bring' ? 'bring' : plan.kind === 'ask-merge' ? 'merge' : 'cup';
            useCloud.setState({
                ask: {
                    kind,
                    device: summarize(local),
                    cloud: plan.kind === 'ask-bring' ? null : summarize(cloud),
                    cupChoice: plan.kind === 'ask-cup' || (plan.kind === 'ask-merge' && plan.cupChoice),
                    keep: plan.kind === 'ask-merge' ? plan.keep : 'device',
                },
            });
            return true;
        }
        case 'upload':
            writeOwner(uid);
            await upload();
            finishLink(false, null);
            return false;
        case 'cloud-wins':
            // se o aparelho não mudou desde a última sincronização, as copas dele a nuvem já conhece
            await applyMerge(uid, cloud, cloudTs, 'cloud', localTs > syncedTs ? null : 'device');
            finishLink(false, null);
            return false;
        case 'local-wins':
            await applyMerge(uid, cloud, cloudTs, 'device', cloudTs > syncedTs ? null : 'cloud');
            finishLink(false, null);
            return false;
    }
}

/**
 * Resposta à pergunta do login. `choice` = qual copa continua quando as duas estão em andamento (sem escolha de
 * copa, qualquer valor: continua a de quem tem). A copa que não continua fica guardada (parkedRuns).
 */
export async function answerLink(choice: Side) {
    const p = pending;
    pending = null;
    useCloud.setState({ ask: null });
    // sem contexto (demo do dev) ou a sessão mudou no meio: nada a fazer
    if (!p || userId !== p.uid) return;
    try {
        const ask = p.plan;
        const cupChoice = ask.kind === 'ask-cup' || (ask.kind === 'ask-merge' && ask.cupChoice);
        const keep: Side =
            ask.kind === 'ask-bring' ? 'device' : cupChoice ? choice : ask.kind === 'ask-merge' ? ask.keep : choice;
        await applyMerge(p.uid, p.cloud, p.cloudTs, keep, null);
        finishLink(ask.kind !== 'ask-cup', cupChoice ? choice : null);
    } finally {
        reconciling = false;
    }
}

/** "Agora não": sai da conta sem subir nada; o aparelho fica exatamente como estava. */
export async function declineLink() {
    pending = null;
    reconciling = false;
    clearTimeout(uploadTimer);
    userId = null;
    takeLoginPending();
    useCloud.setState({ ask: null, status: 'guest', user: null });
    try {
        await supabase?.auth.signOut();
    } catch {
        // sem rede: a sessão local some de qualquer jeito no próximo login
    }
}

/** Fecha o aviso pequeno do login. */
export const dismissNotice = () => useCloud.setState({ notice: null });

/** Liga a sincronização (uma vez, no início do app). */
export function startCloudSync() {
    // toda mudança no save local marca a hora (vale também para visitante: ao entrar, compara com a nuvem)
    useGame.subscribe((s, prev) => {
        const keys = [
            'run',
            'settings',
            'records',
            'profile',
            'dex',
            'moves',
            'career',
            'onboarded',
            'parkedRuns',
            'hall',
            'duels',
        ] as const;
        if (keys.every((k) => s[k] === prev[k])) return;
        // o carregamento do save do IndexedDB não é "mudança": senão o local parece sempre mais novo que a nuvem
        if (applying || !useGame.persist.hasHydrated()) return;
        writeLocalTs(Date.now());
        if (userId && !reconciling) scheduleUpload();
    });
    if (cloudEnabled && hasAuthTrace()) void loadCloud();
}

function onAuthChange(event: string, session: Session | null) {
    // duelo sem conta: a sessão anônima só abre o canal da sala (nada de reconciliar, subir ou juntar save)
    if (session?.user.is_anonymous) {
        if (useCloud.getState().anonId !== session.user.id) useCloud.setState({ anonId: session.user.id });
        return;
    }
    // USER_UPDATED: a conta anônima do duelo acabou de ganhar o Google (linkIdentity com o botão oficial)
    const signedIn = event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED';
    if (signedIn) useCloud.setState({ anonId: null });
    if (signedIn && session && session.user.id !== userId) {
        // fora do callback: o supabase-js pede para não esperar outras chamadas dentro dele
        setTimeout(() => void onSignedIn(session), 0);
    }
    if (event === 'SIGNED_OUT') {
        userId = null;
        pending = null;
        reconciling = false;
        clearTimeout(uploadTimer);
        useCloud.setState({ status: 'guest', user: null, ask: null, anonId: null });
    }
}

/** Id da conta logada. */
export const cloudUserId = () => userId;
/** Id do jogador na sala do duelo: a conta, ou a sessão anônima do "Jogar agora". */
export const duelUserId = () => userId ?? useCloud.getState().anonId;

/**
 * "Jogar agora" do duelo, sem conta: login anônimo do Supabase (o papel continua `authenticated`, então a regra do
 * canal privado `duel:%` vale igual). Devolve 'disabled' se o painel ainda não liga "Allow anonymous sign-ins".
 */
export async function signInAnon(): Promise<'ok' | 'disabled' | 'error'> {
    const sb = await loadCloud().catch(() => null);
    if (!sb) return 'error';
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) {
        const code = (error as { code?: string }).code;
        return code === 'anonymous_provider_disabled' || /anonymous sign-ins are disabled/i.test(error.message)
            ? 'disabled'
            : 'error';
    }
    if (data.user) useCloud.setState({ anonId: data.user.id });
    return 'ok';
}

/** Antes do login de verdade: a sessão anônima do duelo sai (o histórico dela já está no save local). */
async function dropAnon() {
    if (!supabase || !useCloud.getState().anonId) return;
    await supabase.auth.signOut({ scope: 'local' });
    useCloud.setState({ anonId: null });
}

/**
 * Quem jogou Duelo sem conta e entra com o Google: a conta anônima ganha o Google (`linkIdentity`) e continua a
 * mesma (o mesmo id na sala do duelo; o save do aparelho sobe como em qualquer conta nova). Precisa de "Manual
 * linking" ligado no painel do Supabase: desligado (ou qualquer erro), o login segue do jeito de antes (a sessão
 * anônima sai e entra a conta do Google). Google que já tem conta só dá erro na volta do Google: `linkConflict`.
 */
const LINK_PENDING = 'soccermon-link-pending';
const redirectTo = () => `${window.location.origin}${window.location.pathname}`;

/** Voltou do Google com "esse Google já tem conta": entra nela (a sessão anônima sai). */
export function linkConflict(url: string, pending: boolean): boolean {
    return pending && /[?&#]error_code=identity_already_exists\b/.test(url);
}

function takeLinkPending(): boolean {
    try {
        const v = sessionStorage.getItem(LINK_PENDING) === '1';
        sessionStorage.removeItem(LINK_PENDING);
        return v;
    } catch {
        return false;
    }
}

export async function signInWithGoogle(link = true) {
    const sb = await loadCloud();
    if (!sb) return;
    markLoginPending();
    if (link && useCloud.getState().anonId) {
        try {
            sessionStorage.setItem(LINK_PENDING, '1');
        } catch {
            // sem sessionStorage: se o Google já tiver conta, a pessoa só precisa tocar em Entrar de novo
        }
        const { error } = await sb.auth.linkIdentity({ provider: 'google', options: { redirectTo: redirectTo() } });
        if (!error) return;
        takeLinkPending();
    }
    await dropAnon();
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
    if (error) throw error;
}

/** Login pelo botão oficial do Google (google-button.ts): o Supabase confere o token e abre a sessão. */
export async function signInWithGoogleToken(idToken: string, rawNonce: string) {
    const sb = await loadCloud();
    if (!sb) return;
    markLoginPending();
    if (useCloud.getState().anonId) {
        const { error } = await sb.auth.linkIdentity({ provider: 'google', token: idToken, nonce: rawNonce });
        if (!error) return;
    }
    await dropAnon();
    const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce });
    if (error) throw error;
}

export async function signOut() {
    if (!supabase) return;
    // pergunta do login ainda aberta: nada do aparelho foi para a conta, então sai sem subir
    if (pending || useCloud.getState().ask) return declineLink();
    // sobe o que falta antes de sair; o save local continua no aparelho. Se a nuvem recusar, não sai
    // (quem chama decide: "Apagar dados deste aparelho" não pode seguir com progresso sem cópia na nuvem)
    clearTimeout(uploadTimer);
    if (!(await upload())) throw new Error('Não deu para salvar na nuvem antes de sair');
    await supabase.auth.signOut();
}

/**
 * Apaga a conta de vez (LGPD): login, perfil e save na nuvem (supabase/migrations/…_apagar_conta.sql).
 * O save deste aparelho continua, agora como visitante. Lança erro se o servidor recusar.
 */
export async function deleteAccount() {
    if (!supabase || !userId) return;
    clearTimeout(uploadTimer);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    userId = null;
    writeOwner('');
    // a sessão já não vale no servidor; limpa a do navegador sem chamar a API
    await supabase.auth.signOut({ scope: 'local' });
    useCloud.setState({ status: 'guest', user: null });
}
