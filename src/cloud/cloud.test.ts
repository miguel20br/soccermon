import { afterAll, describe, expect, it, vi } from 'vitest';

/**
 * Sincronização com a nuvem de ponta a ponta (cloud.ts), com um Supabase de mentira: o que sobe, quando a hora local
 * é marcada e o que a conta nova recebe quando o aparelho era de outra conta.
 */
const sb = vi.hoisted(() => {
    const rows = new Map<string, { data: unknown; updated_at: string; version: number }>();
    const upserts: { table: string; row: Record<string, unknown> }[] = [];
    let onAuth: ((event: string, session: unknown) => void) | null = null;
    const client = {
        auth: {
            onAuthStateChange: (cb: typeof onAuth) => {
                onAuth = cb;
                return { data: { subscription: { unsubscribe() {} } } };
            },
            signOut: async () => ({ error: null }),
            initialize: async () => {},
        },
        realtime: { connect() {} },
        from: (table: string) => ({
            upsert: async (row: Record<string, unknown>) => {
                upserts.push({ table, row });
                return { error: null };
            },
            select: () => ({
                eq: (_col: string, uid: string) => ({
                    maybeSingle: async () => ({ data: rows.get(uid) ?? null, error: null }),
                }),
            }),
        }),
    };
    return {
        rows,
        upserts,
        client,
        signIn: (id: string) => onAuth?.('SIGNED_IN', { user: { id, user_metadata: {} } }),
    };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: () => sb.client }));
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.stubEnv('VITE_SUPABASE_URL', 'https://teste.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave');
const mem = new Map<string, string>();
const storage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
        return mem.size;
    },
};
vi.stubGlobal('localStorage', storage);
vi.stubGlobal('sessionStorage', storage);
// os relógios pela global na hora da chamada (o vi.useFakeTimers troca a global)
vi.stubGlobal('window', {
    location: { search: '', hash: '', origin: '', pathname: '/' },
    setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
    clearTimeout: (id: number) => clearTimeout(id),
});

const { loadCloud, startCloudSync, cloudUserId } = await import('./cloud');
const { useGame, savePart, SAVE_VERSION } = await import('../store/game-store');
const { newUltimate } = await import('../store/ultimate/ultimate');

afterAll(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

const until = async (ok: () => boolean) => {
    for (let i = 0; i < 1000 && !ok(); i++) await new Promise((r) => setTimeout(r, 10));
    expect(ok()).toBe(true);
};
const saves = () => sb.upserts.filter((u) => u.table === 'saves');

describe('sincronização com a nuvem', () => {
    it('mudar só o Time Ultimate marca a hora local e sobe o save', async () => {
        await until(() => useGame.persist.hasHydrated());
        startCloudSync();
        await loadCloud();
        sb.signIn('conta-a');
        // conta sem save e aparelho sem progresso: sobe direto
        await until(() => cloudUserId() === 'conta-a' && saves().length === 1);

        vi.useFakeTimers();
        try {
            mem.set('soccermon-local-updated', '1');
            const u = useGame.getState().ultimate;
            useGame.setState({ ultimate: { ...u, fichas: u.fichas + 50 } });
            expect(Number(mem.get('soccermon-local-updated'))).toBeGreaterThan(1);
            await vi.advanceTimersByTimeAsync(3000);
        } finally {
            vi.useRealTimers();
        }
        expect(saves()).toHaveLength(2);
        const up = saves()[1].row.data as ReturnType<typeof savePart>;
        expect(up.ultimate.fichas).toBe(useGame.getState().ultimate.fichas);
    });

    it('entrar com outra conta não traz o Time Ultimate da conta anterior', async () => {
        // o aparelho agora é da conta A, com Fichas; a conta B tem o próprio UT na nuvem
        const mineA = useGame.getState().ultimate;
        expect(mineA.fichas).toBe(50);
        const ofB = { ...newUltimate('b'), fichas: 7 };
        sb.rows.set('conta-b', {
            data: { ...savePart(useGame.getState()), ultimate: ofB, dex: {} },
            updated_at: new Date().toISOString(),
            version: SAVE_VERSION,
        });
        sb.signIn('conta-b');
        await until(() => cloudUserId() === 'conta-b' && useGame.getState().ultimate.salt === 'b');
        expect(useGame.getState().ultimate.fichas).toBe(7);

        // conta C sem save nenhum: nasce com um UT novo, e não com o da B
        sb.signIn('conta-c');
        await until(() => cloudUserId() === 'conta-c' && useGame.getState().ultimate.salt !== 'b');
        expect(useGame.getState().ultimate.fichas).toBe(0);
    });
});
