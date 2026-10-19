/**
 * Mede o volume (RMS) e a duração dos 151 gritos nos dois estilos e grava o ganho de cada um em
 * src/data/cry-levels.json: todo grito toca no volume da mediana do estilo (os arquivos ficam como estão).
 * Precisa do ffmpeg/ffprobe. Uso: npx tsx scripts/cry-levels.ts (rodar de novo se os gritos mudarem).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const STYLES = ['legacy', 'latest'] as const;
/** Ganho máximo pra cima ou pra baixo (dB): ninguém some nem estoura por causa da conta. */
const MAX_DB = 8;

function measure(file: string): { rms: number; dur: number } {
    // volumedetect escreve no stderr: "mean_volume: -12.3 dB"
    const out = spawnSync(
        'ffmpeg',
        ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'],
        {
            encoding: 'utf8',
        },
    ).stderr;
    const rms = Number(/mean_volume: (-?[\d.]+) dB/.exec(out)?.[1]);
    const dur = Number(
        execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
            encoding: 'utf8',
        }),
    );
    if (!Number.isFinite(rms) || !Number.isFinite(dur)) throw new Error(`não deu pra medir ${file}`);
    return { rms, dur };
}

const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
};

const out: Record<string, [number, number][]> = {};
for (const style of STYLES) {
    const m = Array.from({ length: 151 }, (_, i) => measure(`public/assets/cries/${style}/${i + 1}.ogg`));
    const target = median(m.map((x) => x.rms));
    // [ganho em dB, duração em ms]
    out[style] = m.map((x) => [
        Math.round(Math.max(-MAX_DB, Math.min(MAX_DB, target - x.rms)) * 10) / 10,
        Math.round(x.dur * 1000),
    ]);
    const gains = out[style].map(([g]) => g);
    console.log(`${style}: mediana ${target} dB, ganho de ${Math.min(...gains)} a ${Math.max(...gains)} dB`);
}
writeFileSync('src/data/cry-levels.json', `${JSON.stringify(out)}\n`);
