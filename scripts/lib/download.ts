import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface DownloadJob {
    url: string;
    dest: string;
}

/** Baixa arquivos com concorrência limitada; pula os que já existem. Retorna as URLs que falharam. */
export async function downloadAll(jobs: DownloadJob[], concurrency = 8): Promise<string[]> {
    const failed: string[] = [];
    let next = 0;
    let done = 0;

    async function worker() {
        while (next < jobs.length) {
            const job = jobs[next++];
            if (!existsSync(job.dest)) {
                const buf = await fetchBuffer(job.url);
                if (buf) {
                    await mkdir(dirname(job.dest), { recursive: true });
                    await writeFile(job.dest, buf);
                } else {
                    failed.push(job.url);
                }
            }
            done++;
            if (done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
        }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return failed;
}

export async function fetchBuffer(url: string, retries = 3): Promise<Buffer | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch(url);
            if (res.status === 404) return null;
            if (res.ok) return Buffer.from(await res.arrayBuffer());
        } catch {
            // rede instável: tenta de novo
        }
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    return null;
}

export async function fetchText(url: string): Promise<string | null> {
    const buf = await fetchBuffer(url);
    return buf ? buf.toString('utf8') : null;
}

/** Faixa de números da Pokédex de cada geração. O jogo usa só as de `ACTIVE_GENS`; as outras só têm os arquivos gerados. */
export const GENS = { 1: [1, 151], 2: [152, 251] } as const;
export type Gen = keyof typeof GENS;
export const ALL_GENS = Object.keys(GENS).map(Number) as Gen[];
/** Gerações que o jogo usa hoje. Ligar a Gen 2 = pôr o 2 aqui (e o equilíbrio, que é outra conversa). */
export const ACTIVE_GENS: Gen[] = [1];

export const idsOf = (gen: Gen) => Array.from({ length: GENS[gen][1] - GENS[gen][0] + 1 }, (_, i) => GENS[gen][0] + i);
export const genOf = (id: number) => ALL_GENS.find((g) => id >= GENS[g][0] && id <= GENS[g][1]) ?? 1;

/** Pasta dos dados gerados de cada geração: `src/data` (Gen 1, a que o jogo importa) ou `src/data/gen2`. */
export const dataDir = (gen: Gen) => (gen === 1 ? 'src/data' : `src/data/gen${gen}`);

/** Gerações pedidas na linha de comando (`--gen 2`, `--gen 1,2`); sem `--gen`, todas. */
export function gensFromArgs(argv = process.argv): Gen[] {
    const i = argv.indexOf('--gen');
    if (i < 0) return ALL_GENS;
    return argv[i + 1].split(',').map((g) => {
        const n = Number(g) as Gen;
        if (!GENS[n]) throw new Error(`geração desconhecida: ${g}`);
        return n;
    });
}

/** Os números das gerações pedidas na linha de comando. */
export const idsFromArgs = (argv = process.argv) => gensFromArgs(argv).flatMap(idsOf);

/**
 * JSON de uma API com cópia em `.cache/` (a PokeAPI pede cache local; quem abusa leva ban de IP). Baixa uma vez só:
 * rodar o script de novo lê do disco.
 */
export async function cachedJson<T>(url: string, cacheFile: string): Promise<T | null> {
    const path = `.cache/${cacheFile}`;
    if (existsSync(path)) return JSON.parse(await readFile(path, 'utf8')) as T;
    const buf = await fetchBuffer(url);
    if (!buf) return null;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buf);
    return JSON.parse(buf.toString('utf8')) as T;
}

/** Roda `fn` em cada item com no máximo `n` ao mesmo tempo. */
export async function pool<T, R>(items: readonly T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const out: R[] = [];
    let next = 0;
    await Promise.all(
        Array.from({ length: n }, async () => {
            while (next < items.length) {
                const i = next++;
                out[i] = await fn(items[i]);
            }
        }),
    );
    return out;
}

/** Créditos do PMDCollab vêm como id do Discord: credit_names.txt traz o nome de cada autor. */
export async function pmdCreditNames(): Promise<Map<string, string>> {
    const txt = await fetchText('https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/credit_names.txt');
    return new Map(
        (txt ?? '')
            .split('\n')
            .slice(1)
            .map((l) => l.split('\t'))
            .filter((c) => c[0] && c[1])
            .map((c) => [c[1].trim(), c[0].trim()] as const),
    );
}
