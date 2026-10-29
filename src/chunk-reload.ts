/**
 * Versão nova no ar com a aba aberta (ou restaurada do cache): os pedaços com hash da versão velha (`/bundle`) somem do
 * servidor e todo import() que ainda não tinha carregado falha (Phaser, Supabase, telas e dados à parte). O navegador
 * guarda a falha do módulo, então a aba fica dando erro até recarregar. Recarrega uma vez, e só se o servidor já tem
 * outra versão (o index.html de lá não aponta pro mesmo pedaço de entrada): rede ruim não tira ninguém da tela. Se já
 * recarregou no último minuto (HTML velho em cache), não recarrega de novo: nada de loop.
 */
const KEY = 'soccermon-chunk-reload';
const WAIT_MS = 60_000;
let pending: Promise<boolean> | null = null;

export interface ReloadEnv {
    storage: Pick<Storage, 'getItem' | 'setItem'>;
    now: number;
    online: boolean;
    /** `src` do script de entrada desta página (/bundle/index-<hash>.js). */
    entry: string | null;
    /** index.html que o servidor entrega agora, sem cache. */
    serverHtml: () => Promise<string>;
    reload: () => void;
}

const browserEnv = (): ReloadEnv => ({
    storage: sessionStorage,
    now: Date.now(),
    online: navigator.onLine,
    entry: document.querySelector('script[type="module"][src]')?.getAttribute('src') ?? null,
    serverHtml: () => fetch('/', { cache: 'no-store' }).then((r) => (r.ok ? r.text() : Promise.reject(r.status))),
    reload: () => window.location.reload(),
});

async function check(env: ReloadEnv): Promise<boolean> {
    if (!env.online || !env.entry || env.now - (Number(env.storage.getItem(KEY)) || 0) <= WAIT_MS) return false;
    // mesma versão no servidor: o pedaço falhou por rede, recarregar não ajuda
    if ((await env.serverHtml()).includes(env.entry)) return false;
    env.storage.setItem(KEY, String(env.now));
    env.reload();
    return true;
}

/** true = a página está recarregando pra versão nova (quem chamou espera); false = segue o erro normal. */
export function reloadForNewVersion(env?: ReloadEnv): Promise<boolean> {
    pending ??= Promise.resolve()
        .then(() => check(env ?? browserEnv()))
        .catch(() => false) // sem sessionStorage ou sem rede: não arrisca recarregar
        .then((ok) => {
            if (!ok) pending = null;
            return ok;
        });
    return pending;
}

/** Liga no início: o Vite avisa (`vite:preloadError`) quando um import() dinâmico do build falha. */
export function startChunkReload() {
    window.addEventListener('vite:preloadError', () => void reloadForNewVersion());
}
