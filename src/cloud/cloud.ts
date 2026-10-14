import { createClient, type Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { type Records, useGame } from '../store/game-store';

/**
 * Contas (login com Google) e save na nuvem, pelo Supabase. Sem as variáveis de ambiente o jogo continua
 * 100% local (visitante) e nada daqui aparece. O save local (IndexedDB) continua sendo a fonte do jogo;
 * a nuvem é uma cópia: ao entrar, vale a mais recente das duas (os recordes somam o melhor de cada).
 */
const env = import.meta.env;
const URL: string | undefined = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const KEY: string | undefined =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(URL && KEY);
const supabase =
    URL && KEY
        ? createClient(URL, KEY, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } })
        : null;

/** Formato do save na nuvem (mesmo do store persistido). */
const SAVE_VERSION = 4;
/** Quando o save local mudou pela última vez (para comparar com a nuvem). */
const LOCAL_TS = 'soccermon-local-updated';
/** De qual conta é o save deste aparelho ('' = visitante). Outra conta entrando não herda a copa nem os recordes. */
const LOCAL_OWNER = 'soccermon-local-owner';
const UPLOAD_DELAY_MS = 2500;

export type CloudStatus = 'off' | 'guest' | 'syncing' | 'saved' | 'error';

interface CloudState {
    status: CloudStatus;
    user: { name: string; avatar: string | null } | null;
}

export const useCloud = create<CloudState>(() => ({ status: cloudEnabled ? 'guest' : 'off', user: null }));

let userId: string | null = null;
let uploadTimer = 0;
let applying = false;
/** Entre o login e a comparação com a nuvem nada sobe (senão o save local atropela o da nuvem antes da comparação). */
let reconciling = false;

const readLocalTs = () => {
    try {
        return Number(localStorage.getItem(LOCAL_TS)) || 0;
    } catch {
        return 0;
    }
};
const writeLocalTs = (ts: number) => {
    try {
        localStorage.setItem(LOCAL_TS, String(ts));
    } catch {
        // modo privado: só perde a comparação de data (a nuvem ganha)
    }
};

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

function snapshot() {
    const { run, settings, records } = useGame.getState();
    return { run, settings, records };
}

/** Recordes nunca diminuem: junta local e nuvem pelo maior de cada contador. */
function mergeRecords(a: Records, b: Partial<Records> | undefined): Records {
    const out: Records = { ...a };
    for (const [k, v] of Object.entries(b ?? {}) as [keyof Records, number | undefined][]) {
        if (typeof v === 'number') out[k] = Math.max(out[k] ?? 0, v);
    }
    return out;
}

async function upload() {
    if (!supabase || !userId) return;
    useCloud.setState({ status: 'syncing' });
    const { error } = await supabase.from('saves').upsert({
        user_id: userId,
        data: snapshot(),
        version: SAVE_VERSION,
        updated_at: new Date(readLocalTs() || Date.now()).toISOString(),
    });
    useCloud.setState({ status: error ? 'error' : 'saved' });
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
    useCloud.setState({ status: 'syncing', user: { name, avatar: meta.avatar_url ?? null } });
    // perfil só para exibição (nome e foto do Google); nunca usado para autorização
    await supabase.from('profiles').upsert({
        id: userId,
        display_name: name,
        avatar_url: meta.avatar_url ?? null,
        updated_at: new Date().toISOString(),
    });

    await hydrated();
    reconciling = true;
    try {
        await reconcile(userId);
    } finally {
        reconciling = false;
    }
}

/** Compara o save do aparelho com o da conta e fica com o certo. */
async function reconcile(uid: string) {
    if (!supabase) return;
    const { data, error } = await supabase.from('saves').select('data, updated_at').eq('user_id', uid).maybeSingle();
    if (error || userId !== uid) {
        if (error) useCloud.setState({ status: 'error' });
        return;
    }
    const local = useGame.getState();
    const cloudTs = data ? Date.parse(data.updated_at) : 0;
    const cloud = data?.data as Partial<ReturnType<typeof snapshot>> | undefined;
    const owner = readOwner();
    if (owner && owner !== uid) {
        // o save deste aparelho é de outra conta: essa conta começa com o que tem na nuvem (ou do zero)
        applying = true;
        useGame.setState({
            run: cloud?.run ?? null,
            settings: { ...local.settings, ...cloud?.settings },
            records: mergeRecords({ cups: 0, titles: 0, perfect: 0 }, cloud?.records),
            screen: 'home',
        });
        applying = false;
        writeLocalTs(cloudTs || Date.now());
        writeOwner(uid);
        if (cloud) useCloud.setState({ status: 'saved' });
        else await upload();
        return;
    }
    writeOwner(uid);
    if (cloud && (cloudTs > readLocalTs() || !local.run)) {
        // a nuvem é mais nova (outro aparelho): ela vale; recordes juntam os dois
        applying = true;
        useGame.setState({
            run: cloud.run ?? null,
            settings: { ...local.settings, ...cloud.settings },
            records: mergeRecords(local.records, cloud.records),
            screen: 'home',
        });
        applying = false;
        writeLocalTs(cloudTs);
        useCloud.setState({ status: 'saved' });
        // se os recordes locais eram maiores, sobe a junção
        if (JSON.stringify(cloud.records) !== JSON.stringify(useGame.getState().records)) await upload();
    } else {
        await upload();
    }
}

/** Liga a sincronização (uma vez, no início do app). */
export function startCloudSync() {
    // toda mudança no save local marca a hora (vale também para visitante: ao entrar, compara com a nuvem)
    useGame.subscribe((s, prev) => {
        if (s.run === prev.run && s.settings === prev.settings && s.records === prev.records) return;
        // o carregamento do save do IndexedDB não é "mudança": senão o local parece sempre mais novo que a nuvem
        if (applying || !useGame.persist.hasHydrated()) return;
        writeLocalTs(Date.now());
        if (userId && !reconciling) scheduleUpload();
    });
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session && session.user.id !== userId) {
            // fora do callback: o supabase-js pede para não esperar outras chamadas dentro dele
            setTimeout(() => void onSignedIn(session), 0);
        }
        if (event === 'SIGNED_OUT') {
            userId = null;
            clearTimeout(uploadTimer);
            useCloud.setState({ status: 'guest', user: null });
        }
    });
}

export async function signInWithGoogle() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
    if (error) throw error;
}

export async function signOut() {
    if (!supabase) return;
    // sobe o que falta antes de sair; o save local continua no aparelho
    clearTimeout(uploadTimer);
    await upload();
    await supabase.auth.signOut();
}
