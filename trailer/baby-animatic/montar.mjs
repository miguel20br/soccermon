// Monta o animatic: renderiza a música do conceito, tira os quadros (quadros.mjs) e corta cada um na batida, com um
// clarão branco curto onde a música tem clique de câmera ou gol. Áudio final em −14 LUFS com limitador em −1 dBFS.
//   scripts/pesado.sh node trailer/baby-animatic/montar.mjs a|c   (da raiz do worktree, com midia/ pronta)
// Saída: ~/Vídeos/soccermon-postar/previas/animatic-A-primeiro-dia.mp4 ou animatic-C-album.mp4 (1080x1920, 30 fps)
// e a folha de contato pra conferir (no scratch, SCRATCH=<pasta>, padrão ~/.cache/soccermon-tmp/animatic).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const C = process.argv[2];
const DIR = new URL('.', import.meta.url).pathname;
const TMP = process.env.SCRATCH ?? join(homedir(), '.cache/soccermon-tmp/animatic');
const SAIDA = join(homedir(), 'Vídeos/soccermon-postar/previas');
const FPS = 30;

// [quadro, segundo do corte, clarão]
const A_BAR = (16 * 60) / 124 / 4; // 1,935 s
const PLANOS = {
    a: {
        peca: 'animatic-primeiro-dia',
        nome: 'animatic-A-primeiro-dia',
        fim: 10 * A_BAR + 0.65,
        cortes: [
            ['a1', 0],
            ['a2', 1 * A_BAR], // c.1: o riso
            ['a3', 1.5 * A_BAR], // c.1, 3º tempo: o chute
            ['a4', 2 * A_BAR], // c.2: Rota 2, a banda entra
            ['a5', 3 * A_BAR], // c.3: Planalto, sobe 1 tom
            ['a6', 4 * A_BAR, true], // c.4: GOL
            ['a7', 5 * A_BAR], // c.5: explicação
            ['a8', 6.5 * A_BAR], // c.6, 3º tempo
            ['a9', 8 * A_BAR], // c.8: tela final, sobe meio tom
        ],
    },
    c: {
        peca: 'animatic-album',
        nome: 'animatic-C-album',
        fim: 20,
        cortes: [
            ['c1', 0, true], // clique
            ['c2', 1.5, true], // clique
            ['c3', 3, true], // clique
            ['c4', 4.5], // vira (Charizard)
            ['c5', 6], // vira (Gyarados)
            ['c6', 7.5, true], // clique: a turma campeã, sobe 1 tom
            ['c7', 10.5], // explicação
            ['c8', 13.5],
            ['c9', 16.5, true], // tela final: o último clique
        ],
    },
}[C];
if (!PLANOS) throw new Error('uso: montar.mjs a|c');

const T = join(TMP, C);
mkdirSync(T, { recursive: true });
mkdirSync(SAIDA, { recursive: true });
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
const ffErr = (...a) => spawnSync('ffmpeg', ['-hide_banner', ...a, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;

// música e quadros
execFileSync('node', ['scripts/musica/render.mjs', PLANOS.peca, '--out', T], { stdio: 'inherit' });
execFileSync('node', [join(DIR, 'quadros.mjs'), C], { stdio: 'inherit' });

// um trecho por quadro, no quadro exato do corte (30 fps)
const lista = [];
PLANOS.cortes.forEach(([q, t, clarao], i) => {
    const f0 = Math.round(t * FPS);
    const f1 = Math.round((PLANOS.cortes[i + 1]?.[1] ?? PLANOS.fim) * FPS);
    const seg = join(T, `${i}-${q}.mp4`);
    const vf = [`fps=${FPS}`, 'format=yuv420p', ...(clarao ? ['fade=t=in:d=0.2:color=white'] : [])].join(',');
    ff('-loop', '1', '-i', join(DIR, 'quadros', C, `${q}.png`), '-frames:v', String(f1 - f0), '-vf', vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-r', String(FPS), seg);
    lista.push(`file '${seg}'`);
});
writeFileSync(join(T, 'lista.txt'), `${lista.join('\n')}\n`);
ff('-f', 'concat', '-safe', '0', '-i', join(T, 'lista.txt'), '-c', 'copy', join(T, 'video.mp4'));

// áudio: o trecho do vídeo com saída de 0,5 s, ganho até −14 LUFS e limitador em −1 dBFS
const fim = PLANOS.fim;
const trecho = join(T, 'trecho.wav');
ff('-i', join(T, `${PLANOS.peca}.wav`), '-t', String(fim), '-af', `afade=t=out:st=${fim - 0.5}:d=0.5`, trecho);
const lufs = (f) => Number(/I:\s+(-?[\d.]+) LUFS/.exec(ffErr('-i', f, '-af', 'ebur128=peak=true').split('Summary:')[1])[1]);
const ganho = -14 - lufs(trecho);
const audio = join(T, 'audio.wav');
ff('-i', trecho, '-af', `volume=${ganho.toFixed(2)}dB,alimiter=limit=0.891:level=false:attack=2:release=60,aresample=48000`, audio);
// o limitador come um pouco do volume: uma segunda passada de ajuste fino
const ajuste = -14 - lufs(audio);
const final = join(T, 'audio-final.wav');
ff('-i', audio, '-af', `volume=${ajuste.toFixed(2)}dB,alimiter=limit=0.891:level=false:attack=2:release=60`, final);

const out = join(SAIDA, `${PLANOS.nome}.mp4`);
ff('-i', join(T, 'video.mp4'), '-i', final, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out);

// conferência: volume final, pico e folha de contato (2 quadros/s, hora em cada um, linha vermelha no centro)
const r = ffErr('-i', out, '-af', 'ebur128=peak=true').split('Summary:')[1];
console.log(out);
console.log('  ', r.replace(/\s+/g, ' ').trim());
const fq = join(T, 'fq');
execFileSync('rm', ['-rf', fq]);
mkdirSync(fq);
ff('-i', out, '-vf', 'fps=2,scale=180:-1,drawbox=x=89:y=0:w=2:h=ih:color=red', join(fq, '%02d.png'));
ff('-i', join(fq, '%02d.png'), '-vf', 'tile=10x4', '-frames:v', '1', join(T, 'folha.png'));
