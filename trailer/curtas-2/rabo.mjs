// Curtas 2 v3: o rabo da tela final do Ginásio vazio. A peça acaba no último quique (~74 s) e a tela final precisava
// de ~3 s de música embaixo: em vez de cortar a tela, o acorde do fim (Ré m7 no pad da torcida, o mesmo instrumento e
// a mesma voz do c.29) segura mais uns compassos. O .ogg aprovado não muda: isto é uma faixa a mais, que entra baixinho
// por baixo dos últimos quiques e some no fim.
//   node trailer/curtas-2/rabo.mjs <pasta>   → <pasta>/rabo-ginasio.ogg
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { I, padChord, Song, writeWav } from '../../scripts/musica/synth.mjs';

const OUT = process.argv[2] ?? 'trailer/curtas-2/midia/som';
const S = new Song({ bpm: 104, bars: 3, tail: 2 });
const pad = S.part('pad', I.pad, { gain: 0.5, rev: 0.4 });
padChord(pad, 0, 'Dm7', 48, { low: 57, n: 4, vel: 0.5 });
const wav = join(OUT, 'rabo-ginasio.wav');
writeWav(wav, S.render());
// −30 dB de pico: fica por baixo dos quiques (que estão em −35 RMS) e some sozinho
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-af', 'volume=-14dB,afade=t=in:d=1.2,afade=t=out:st=4.2:d=1.6', '-t', '5.8', '-c:a', 'libvorbis', '-q:a', '5', join(OUT, 'rabo-ginasio.ogg')]);
execFileSync('rm', [wav]);
console.log('rabo pronto');
