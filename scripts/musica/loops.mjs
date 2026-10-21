// Confere os loops no .ogg que vai pro jogo (decodificado pelo ffmpeg), pelos pontos do .json:
//   node scripts/musica/loops.mjs [pasta]      (padrão: /tmp/soccermon-musica, a saída do render.mjs)
// 1. Alinhamento: em cada ponto do mapa, o .ogg bate com o .wav sem atraso (o codificador não deslocou nada).
// 2. Emenda: o salto fim → início do loop, medido como erro de prever a amostra seguinte pelas duas anteriores, em
//    relação ao percentil 99,9 desse erro dentro do trecho. Nota < 1 = mais liso que as 0,1% piores passagens da
//    própria música (sem estalo). O teste de si mesmo no começo prova que a medida pega um estalo de verdade.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? '/tmp/soccermon-musica';
const decode = (file) => {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-'], {
        maxBuffer: 1 << 30,
    });
    const f = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const n = f.length / 2;
    const ch = [new Float32Array(n), new Float32Array(n)];
    for (let i = 0; i < n; i++) {
        ch[0][i] = f[2 * i];
        ch[1][i] = f[2 * i + 1];
    }
    return ch;
};
const err = (x, p2, p1, q) => Math.abs(x[q] - (2 * x[p1] - x[p2]));
function p999(x, a, b) {
    const e = [];
    for (let i = a + 2; i < b; i += 3) e.push(err(x, i - 2, i - 1, i));
    e.sort((u, v) => u - v);
    return e[Math.floor(e.length * 0.999)] || 1e-9;
}
/** nota da emenda fim → ini: pior canal, pior das duas primeiras amostras depois dela */
function seam(chs, ini, fim, a = ini, b = fim) {
    let worst = 0;
    for (const x of chs) {
        const e1 = err(x, fim - 2, fim - 1, ini);
        const e2 = Math.abs(x[ini + 1] - (2 * x[ini] - x[fim - 1]));
        worst = Math.max(worst, Math.max(e1, e2) / p999(x, a, b));
    }
    return worst;
}
/**
 * O .ogg está alinhado com o .wav perto de `at`? Correlação sem atraso contra a melhor de −64 a 64 amostras (graves
 * dão picos largos: aceita 0 se ficar a 0,5% da melhor). Janela quase muda não diz nada: conta como alinhada.
 */
function aligned(a, b, at) {
    const n = 4096;
    const s = Math.max(64, Math.min(at, b.length - n - 64));
    const c = (d) => {
        let v = 0;
        for (let i = s; i < s + n; i++) v += a[i + d] * b[i];
        return v;
    };
    let e = 0;
    for (let i = s; i < s + n; i++) e += b[i] * b[i];
    if (e / n < 1e-7) return true;
    let best = -Infinity;
    for (let d = -64; d <= 64; d++) best = Math.max(best, c(d));
    return c(0) >= 0.995 * best;
}

// teste de si mesmo: música de mentira (seno + ruído), um loop bom e um com estalo (fase pulando na emenda)
{
    const n = 44100;
    let seed = 7;
    const tab = Array.from({ length: 4410 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.02);
    const r = (k) => tab[k % 4410]; // ruído periódico: a volta continua igual
    const good = new Float32Array(n).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 441 * i) / 44100) + r(i));
    const bad = new Float32Array(n).map(
        (_, i) => 0.5 * Math.sin((2 * Math.PI * 441 * (i + (i < 100 ? 25 : 0))) / 44100) + r(i),
    );
    const g = seam([good], 0, n);
    const b = seam([bad], 0, n);
    if (!(g < 1 && b > 1)) throw new Error(`a medida não separa loop bom (${g}) de estalo (${b})`);
    console.log(`teste da medida: loop bom ${g.toFixed(2)}, com estalo ${b.toFixed(1)}`);
}

let fail = 0;
let n = 0;
const trocas = [];
for (const j of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
    const meta = JSON.parse(readFileSync(join(DIR, j), 'utf8'));
    const chs = decode(join(DIR, j.replace(/\.json$/, '.ogg')));
    const wavPath = join(DIR, j.replace(/\.json$/, '.wav'));
    const wav = existsSync(wavPath) ? decode(wavPath) : null;
    const end = meta.secoes.at(-1).amostras[1];
    if (chs[0].length < end) {
        console.log(`FALHA ${meta.faixa}: o .ogg tem ${chs[0].length} amostras, o mapa vai até ${end}`);
        fail++;
    }
    for (const s of meta.secoes) {
        const [ini, fim] = s.amostras;
        if (s.loop && ini > 0) trocas.push(seam(chs, ini, ini, ini, fim)); // o trecho anterior emendando neste, como no arquivo
        const al = !wav || [ini, fim - 4096].every((p) => aligned(chs[0], wav[0], p));
        if (!s.loop && al) continue;
        const nota = s.loop ? seam(chs, ini, fim) : 0;
        const ok = nota < 1 && al;
        n += s.loop ? 1 : 0;
        if (!ok) fail++;
        console.log(
            `${ok ? 'ok   ' : 'FALHA'} ${meta.faixa.padEnd(20)} ${s.nome.padEnd(8)} ${s.inicio.toFixed(2).padStart(7)}–${s.fim.toFixed(2).padEnd(7)} emenda ${nota.toFixed(2)}${al ? '' : '  .ogg desalinhado do .wav'}`,
        );
    }
}
console.log(`${n} loops conferidos, ${fail} falha(s)`);
if (trocas.length)
    console.log(`trocas de trecho (só informativo, a mesma nota na virada): pior ${Math.max(...trocas).toFixed(2)}`);
process.exit(fail ? 1 : 0);
