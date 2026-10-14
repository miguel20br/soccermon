import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
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

export const ids151 = Array.from({ length: 151 }, (_, i) => i + 1);

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
