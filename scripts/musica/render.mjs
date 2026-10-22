// Renderiza as peças de scripts/musica/pecas/ em .wav, .ogg (−16 LUFS) e .json (trechos, pontos de loop, BPM).
//   node scripts/musica/render.mjs [peça ...] [--out pasta] [--rms] [--so-wav]
// Sem nome = todas. Saída padrão: /tmp/soccermon-musica (nunca no repo). Lote grande: scripts/pesado.sh na frente.
// A peça devolve um Song, ou { sufixo: Song } quando é mais de um arquivo (partida: { '1t', '2t' }).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Song, SR, writeWav } from './synth.mjs';

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

const s6 = (n) => Math.round((n / SR) * 1e6) / 1e6;

mkdirSync(OUT, { recursive: true });
for (const name of todo) {
    const mod = await import(new URL(`${name}.mjs`, dir));
    const res = mod.default();
    const songs =
        res instanceof Song
            ? { [name]: res }
            : Object.fromEntries(Object.entries(res).map(([k, v]) => [`${name}-${k}`, v]));
    for (const [file, song] of Object.entries(songs)) {
        const t0 = performance.now();
        if (flag('--rms')) console.log(file);
        const wav = join(OUT, `${file}.wav`);
        const [L, R] = song.render({ rms: flag('--rms') });
        writeWav(wav, [L, R]);
        const last = song.secoes.at(-1);
        // jingle (um trecho só, sem loop): o .ogg sai sem o silêncio do fim; o resto sai no comprimento exato do mapa
        const jingle = song.secoes.length === 1 && !last.loop;
        const trim = jingle ? 'areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,' : '';
        // e o mapa do jingle não passa do fim do áudio (o Eliminado v4 acabava antes do último compasso)
        const cut = jingle
            ? execFileSync(
                  'ffmpeg',
                  ['-v', 'error', '-i', wav, '-af', trim.slice(0, -1), '-ac', '1', '-f', 'f32le', '-'],
                  {
                      maxBuffer: 1 << 30,
                  },
              ).length / 4
            : Number.POSITIVE_INFINITY;
        writeFileSync(
            join(OUT, `${file}.json`),
            `${JSON.stringify(
                {
                    faixa: file,
                    titulo: mod.meta?.titulo,
                    tela: mod.meta?.tela,
                    sampleRate: SR,
                    linhasPorCompasso: song.barLen, // 16 = 4/4; 12 = 12/8 ou 3/4; bpm = 4 linhas por batida
                    duracao: s6(L.length),
                    // em segundos (amostras a 44,1 kHz entre colchetes); loop = tocar [inicio, fim) de novo até trocar
                    secoes: song.mapa.map((m) => ({
                        nome: m.nome,
                        ...(m.intensidade != null && { intensidade: m.intensidade }),
                        loop: m.loop,
                        inicio: s6(m.inicio),
                        fim: s6(Math.min(m.fim, cut)),
                        amostras: [m.inicio, Math.min(m.fim, cut)],
                        bpm: m.bpm,
                        compassos: m.ate - m.de,
                    })),
                },
                null,
                1,
            )}\n`,
        );
        if (!flag('--so-wav')) {
            // ganho fixo (linear): o loudnorm de uma passada vira compressor e achata crescendos
            const target = mod.meta?.lufs ?? -16;
            const probe = spawnSync(
                'ffmpeg',
                ['-hide_banner', '-i', wav, '-af', `${trim}loudnorm=print_format=json`, '-f', 'null', '-'],
                { encoding: 'utf8' },
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
                String(SR),
                '-c:a',
                'libvorbis',
                '-q:a',
                '5',
                join(OUT, `${file}.ogg`),
            ]);
        }
        const secs = song.timeOfBar(song.bars).toFixed(1);
        console.log(
            `${file}: ${secs} s de música, ${song.secoes.length} trecho(s), ${Math.round(performance.now() - t0)} ms → ${OUT}`,
        );
    }
}
