// Renderiza as peças de scripts/musica/pecas/ em .wav e .ogg (−16 LUFS).
//   node scripts/musica/render.mjs [peça ...] [--out pasta] [--rms] [--so-wav]
// Sem nome = todas. Saída padrão: /tmp/soccermon-musica (nunca no repo). Lote grande: scripts/pesado.sh na frente.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeWav } from './synth.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : '/tmp/soccermon-musica';
const names = args.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
const dir = new URL('./pecas/', import.meta.url);
const all = readdirSync(dir)
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.replace(/\.mjs$/, ''));
const todo = names.length ? names : all;
const unknown = todo.filter((n) => !all.includes(n));
if (unknown.length) throw new Error(`peça desconhecida: ${unknown.join(', ')} (tem: ${all.join(', ')})`);

mkdirSync(OUT, { recursive: true });
for (const name of todo) {
    const mod = await import(new URL(`${name}.mjs`, dir));
    const t0 = performance.now();
    const song = mod.default();
    if (flag('--rms')) console.log(name);
    const wav = join(OUT, `${name}.wav`);
    writeWav(wav, song.render({ rms: flag('--rms') }));
    const secs = (song.bars * song.barSec).toFixed(1);
    if (!flag('--so-wav')) {
        // loop: comprimento exato; jingle: corta o silêncio do fim
        const trim =
            song.loopFrom == null ? 'areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,' : '';
        // ganho fixo (linear): o loudnorm de uma passada vira compressor e achata crescendos
        const target = mod.meta?.lufs ?? -16;
        const probe = spawnSync(
            'ffmpeg',
            ['-hide_banner', '-i', wav, '-af', `${trim}loudnorm=print_format=json`, '-f', 'null', '-'],
            {
                encoding: 'utf8',
            },
        ).stderr;
        const m = JSON.parse(probe.slice(probe.lastIndexOf('{'), probe.lastIndexOf('}') + 1));
        const gain = Math.min(target - Number(m.input_i), -1.5 - Number(m.input_tp));
        const af = `${trim}volume=${gain.toFixed(2)}dB`;
        execFileSync('ffmpeg', [
            '-v',
            'error',
            '-y',
            '-i',
            wav,
            '-af',
            af,
            '-ar',
            '44100',
            '-c:a',
            'libvorbis',
            '-q:a',
            '5',
            join(OUT, `${name}.ogg`),
        ]);
    }
    console.log(`${name}: ${secs} s de música, ${Math.round(performance.now() - t0)} ms → ${OUT}`);
}
