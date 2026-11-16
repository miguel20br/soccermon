// Renderiza e masteriza as versões de álbum (scripts/musica/album/<nn>-<nome>.mjs) pro streaming. O jogo não muda:
// as peças de pecas/ são só importadas.
//   node scripts/musica/album.mjs [arquivo[:export] ...] [--out pasta] [--rms] [--bruto]
// Sem nome = todas. Saída padrão: /tmp/soccermon-album (nunca no repo). Lote: scripts/pesado.sh na frente.
// Master: −14 LUFS integrado (meta.lufs pra as calmas), pico verdadeiro ≤ −1 dBTP (limitador com 4× de
// sobreamostragem, ganho fixo medido antes: nada de loudnorm de uma passada), WAV PCM 16 bit 44,1 kHz estéreo, sem
// silêncio no começo e com `meta.respira` s (padrão 1,5) de silêncio depois do rabo. `meta.emenda` = a faixa emenda na
// próxima sem pausa (não ganha silêncio no fim). `--bruto` só grava o .wav do sequenciador.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Song, writeWav } from './synth.mjs';

/** Integrado (LUFS) e pico verdadeiro (dBTP) pelo ebur128 do ffmpeg, só medindo. */
export function medir(wav) {
    const err = spawnSync(
        'ffmpeg',
        ['-hide_banner', '-nostats', '-i', wav, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
        {
            encoding: 'utf8',
        },
    ).stderr;
    const resumo = err.slice(err.lastIndexOf('Summary:'));
    const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(resumo)?.[1]);
    const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(resumo)?.[1]);
    const dur = Number(
        execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], {
            encoding: 'utf8',
        }),
    );
    return { I, TP, dur };
}

/** Do .wav bruto ao master. Devolve as medidas do master. */
export function masterizar(bruto, saida, { lufs = -14, respira = 1.5, emenda = false, apara = true } = {}) {
    const corta = [
        ...(apara ? ['silenceremove=start_periods=1:start_threshold=-70dB'] : []),
        // o rabo vai até −66 dB; na emenda, até −60 dB e sem silêncio depois (a próxima faixa entra colada)
        'areverse',
        `silenceremove=start_periods=1:start_threshold=${emenda ? -60 : -66}dB`,
        'areverse',
    ];
    const limpo = `${saida}.limpo.wav`;
    execFileSync('ffmpeg', [
        '-v',
        'error',
        '-y',
        '-i',
        bruto,
        ...(corta.length ? ['-af', corta.join(',')] : []),
        limpo,
    ]);
    const antes = medir(limpo);
    let ganho = lufs - antes.I;
    let teto = -1.3;
    let m;
    for (let i = 0; i < 4; i++) {
        const lim = 10 ** (teto / 20);
        const af = [
            `volume=${ganho.toFixed(2)}dB`,
            'aresample=176400',
            `alimiter=limit=${lim.toFixed(4)}:level=false:attack=1:release=60:asc=1`,
            'aresample=44100',
            ...(emenda ? [] : [`apad=pad_dur=${respira}`]),
        ];
        execFileSync('ffmpeg', [
            '-v',
            'error',
            '-y',
            '-i',
            limpo,
            '-af',
            af.join(','),
            '-ar',
            '44100',
            '-ac',
            '2',
            '-c:a',
            'pcm_s16le',
            saida,
        ]);
        m = medir(saida);
        if (m.TP <= -1 && Math.abs(m.I - lufs) <= 0.3) break;
        if (m.TP > -1) teto -= m.TP + 1 + 0.1;
        ganho += lufs - m.I; // o limitador come um pouco do integrado: devolve
    }
    rmSync(limpo);
    return m;
}

const main = import.meta.url === `file://${process.argv[1]}`;
if (main) {
    const args = process.argv.slice(2);
    const outIdx = args.indexOf('--out');
    const OUT = outIdx >= 0 ? args[outIdx + 1] : '/tmp/soccermon-album';
    const nomes = args.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
    const dir = new URL('./album/', import.meta.url);
    const todas = readdirSync(dir)
        .filter((f) => /^\d\d-.*\.mjs$/.test(f))
        .map((f) => f.replace(/\.mjs$/, ''));
    mkdirSync(OUT, { recursive: true });
    for (const alvo of nomes.length ? nomes : todas) {
        const [arq, exp = 'default'] = alvo.split(':');
        const mod = await import(new URL(`${arq}.mjs`, dir));
        const t0 = performance.now();
        const song = mod[exp]();
        if (!(song instanceof Song) && !Array.isArray(song)) throw new Error(`${alvo}: não devolveu um Song`);
        const nome = exp === 'default' ? arq : `${arq}-${exp}`;
        const bruto = join(OUT, `${nome}.bruto.wav`);
        if (args.includes('--rms')) console.log(nome);
        writeWav(bruto, Array.isArray(song) ? song : song.render({ rms: args.includes('--rms') }));
        if (args.includes('--bruto')) continue;
        const o = { ...mod.meta, ...(mod[`meta_${exp}`] ?? {}) };
        const m = masterizar(bruto, join(OUT, `${nome}.wav`), o);
        rmSync(bruto);
        console.log(
            `${nome}: ${m.dur.toFixed(1)} s, ${m.I.toFixed(1)} LUFS, pico ${m.TP.toFixed(1)} dBTP, ${Math.round(performance.now() - t0)} ms`,
        );
    }
}
