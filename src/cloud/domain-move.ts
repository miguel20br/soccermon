import { migrateSave, type PersistedSave, SAVE_VERSION, useGame } from '../store/game-store';
import { mergeSaves } from './reconcile-plan';

/**
 * Mudança de endereço: soccermon.vercel.app → soccermon.com. O save de quem joga sem conta fica no navegador
 * (IndexedDB), que é separado por endereço; um redirecionamento simples deixaria esse progresso para trás.
 * Então o endereço antigo carrega o jogo, lê o save e manda junto no link (no #, que não vai para servidor
 * nenhum); o endereço novo importa e junta com o que já tiver lá. Quem entra com Google já tem tudo na nuvem.
 */
const OLD_HOSTS = new Set(['soccermon.vercel.app']);
const NEW_ORIGIN = 'https://soccermon.com';
const KEY = 'mudanca';

const hydrated = () =>
    new Promise<void>((resolve) => {
        if (useGame.persist.hasHydrated()) resolve();
        else useGame.persist.onFinishHydration(() => resolve());
    });

const hasProgress = (s: Partial<PersistedSave>) =>
    !!s.run || (s.records?.cups ?? 0) > 0 || Object.keys(s.dex ?? {}).length > 0;

function snapshot(): PersistedSave {
    const { run, settings, records, profile, dex, moves, career, onboarded, parkedRuns, hall } = useGame.getState();
    return { run, settings, records, profile, dex, moves, career, onboarded, parkedRuns, hall };
}

const toB64 = (bytes: Uint8Array) => {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string) => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(
    bytes: Uint8Array<ArrayBuffer>,
    stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
    const out = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(out).arrayBuffer());
}

/** "z" = comprimido (deflate), "j" = JSON puro (navegador sem CompressionStream). */
export async function encode(data: unknown): Promise<string> {
    const raw = new TextEncoder().encode(JSON.stringify(data));
    if (typeof CompressionStream === 'undefined') return `j${toB64(raw)}`;
    return `z${toB64(await pipe(raw, new CompressionStream('deflate-raw')))}`;
}
export async function decode(s: string): Promise<unknown> {
    const bytes = fromB64(s.slice(1));
    const raw = s[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    return JSON.parse(new TextDecoder().decode(raw));
}

/** No endereço antigo: leva o jogador (e o save) para o novo. Devolve true se está saindo da página. */
export async function moveToNewDomain(): Promise<boolean> {
    if (!OLD_HOSTS.has(window.location.hostname)) return false;
    await hydrated();
    const save = snapshot();
    const target = `${NEW_ORIGIN}/${window.location.search}`;
    let hash = '';
    if (hasProgress(save)) {
        try {
            hash = `#${KEY}=${await encode({ version: SAVE_VERSION, save })}`;
        } catch {
            // sem como empacotar: vai sem o save (quem tem conta recupera pela nuvem)
        }
    }
    window.location.replace(target + hash);
    return true;
}

/** No endereço novo: importa o save que veio do antigo (uma vez) e junta com o que já existe aqui. */
export async function importFromOldDomain() {
    const prefix = `#${KEY}=`;
    if (!window.location.hash.startsWith(prefix)) return;
    const packed = window.location.hash.slice(prefix.length);
    // tira o save do endereço na hora (não fica no histórico nem num link copiado)
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    try {
        const data = (await decode(packed)) as { version?: number; save?: Partial<PersistedSave> };
        if (!data?.save) return;
        const incoming = migrateSave(data.save, Number(data.version) || SAVE_VERSION);
        await hydrated();
        const local = snapshot();
        if (!hasProgress(local)) {
            useGame.setState(incoming);
            return;
        }
        // os dois têm progresso: fica a copa e o perfil daqui; recordes, Pokédex e carreira somam o melhor, e a
        // copa em andamento que veio do endereço antigo (se for outra) fica guardada em vez de sumir
        const merged = mergeSaves(local, incoming, 'device');
        useGame.setState({ ...merged, settings: local.settings });
    } catch {
        // link quebrado ou cortado: segue com o save daqui
    }
}
