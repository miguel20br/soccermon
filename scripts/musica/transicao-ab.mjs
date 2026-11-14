// Demo A/B/C da troca de música entre telas (22/10/2026): o Miguel decide de ouvido se a troca fica só encaixada no
// tempo (o jogo hoje), com virada de bateria, ou com virada + prato/riser ou "ponte" (1 compasso no andamento e no tom
// da faixa que entra). Simula a troca do jogo com as funções do próprio `src/game/music.ts` (grade, espera, batida),
// em cima das faixas decodificadas de `public/music`. Não mexe no jogo.
//   scripts/pesado.sh node scripts/musica/transicao-ab.mjs --out <pasta>
// Sai: ab-<par>-<a|b|c>.ogg e ab-transicao.json (o que aconteceu em cada uma, pra página de amostras).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beatOf, gridOf, phaseOffset, sameTempo, sectionSwitchAt, swapWait, untilLine } from '../../src/game/music.ts';
import { FLIP } from './pecas/draft.mjs';
import { PECA } from './pecas/escalacao.mjs';
import { bass, drum, I, mel, Song, SR, stabs } from './synth.mjs';

const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : '/tmp/soccermon-musica/transicao-ab';
const MUSIC = new URL('../../public/music/', import.meta.url);
// constantes do jogo que não são exportadas (src/game/music.ts): entrada em 30 ms, saída com constante de 60 ms
const IN_S = 0.03;
const OUT_TAU = 0.06;
const LEAD_S = 0.03;
// swing de cada peça (scripts/musica/pecas), pra virada balançar junto
const SWING = { 'abertura-gancho': 0.15, 'menu-balanco': 0.1, draft: 0.1, escalacao: 0.04, 'partida-2t': 0.06 };

const tracks = new Map();
function track(id) {
    if (!tracks.has(id)) {
        const meta = JSON.parse(readFileSync(new URL(`${id}.json`, MUSIC)));
        const raw = execFileSync(
            'ffmpeg',
            [
                '-v',
                'error',
                '-i',
                new URL(`${id}.webm`, MUSIC).pathname,
                '-f',
                'f32le',
                '-ac',
                '2',
                '-ar',
                String(SR),
                '-',
            ],
            { maxBuffer: 1 << 30 },
        );
        const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
        const L = new Float32Array(x.length / 2);
        const R = new Float32Array(x.length / 2);
        for (let i = 0; i < L.length; i++) {
            L[i] = x[2 * i];
            R[i] = x[2 * i + 1];
        }
        tracks.set(id, { id, meta, L, R });
    }
    return tracks.get(id);
}
const sec = (t, nome) =>
    t.meta.secoes.find((s) => s.nome === nome) ?? t.meta.secoes.find((s) => s.loop) ?? t.meta.secoes[0];
const leadIn = (t, s) => (s.loop ? t.meta.secoes.find((x) => !x.loop && x.fim === s.inicio) : undefined);

/** Uma fonte tocando (como o AudioBufferSourceNode do jogo): `off` = posição no arquivo em `t0`, loop do trecho. */
const src = (t, s, t0, off, gain, stop = Number.POSITIVE_INFINITY, lp = null) => ({ t, s, t0, off, gain, stop, lp });
function posAt(p, at) {
    const x = p.off + at - p.t0;
    const { inicio, fim, loop } = p.s;
    return loop && x >= fim ? inicio + ((x - inicio) % (fim - inicio)) : x;
}
const gridX = (p, at) => posAt(p, at) - p.s.inicio;
const sounding = (p, at) => p.s.loop || posAt(p, at) < p.s.fim;

/** Mistura as fontes em `n` amostras; `lp` = passa-baixa que fecha (virada: a faixa que sai vai pro fundo). */
function mix(sources, n) {
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (const p of sources) {
        const i0 = Math.max(0, Math.ceil(p.t0 * SR));
        const i1 = Math.min(n, Math.ceil(p.stop * SR));
        const ls = Math.round(p.s.inicio * SR);
        const le = Math.round(p.s.fim * SR);
        let j = Math.round((p.off + i0 / SR - p.t0) * SR);
        const st = [0, 0, 0, 0];
        for (let i = i0; i < i1; i++, j++) {
            if (p.s.loop && j >= le) j = ls + ((j - ls) % (le - ls));
            if (j >= p.t.L.length) break;
            const t = i / SR;
            let l = p.t.L[j];
            let r = p.t.R[j];
            if (p.lp && t >= p.lp.from) {
                const u = Math.min(1, (t - p.lp.from) / (p.lp.to - p.lp.from));
                const a = 1 - Math.exp((-2 * Math.PI * 9000 * (1000 / 9000) ** u) / SR);
                st[0] += a * (l - st[0]);
                st[1] += a * (st[0] - st[1]);
                st[2] += a * (r - st[2]);
                st[3] += a * (st[2] - st[3]);
                const dip = 1 - 0.25 * u;
                l = st[1] * dip;
                r = st[3] * dip;
            } else [st[0], st[1], st[2], st[3]] = [l, l, r, r];
            const g = p.gain(t);
            L[i] += l * g;
            R[i] += r * g;
        }
    }
    return [L, R];
}

/** Envelopes do jogo: entra de 0 a 1 em `ramp`; sai com setTargetAtTime(0, at, 60 ms); corte de trecho em 10 ms. */
const rampIn =
    (at, ramp = IN_S) =>
    (t) =>
        t < at ? 0 : Math.min(1, (t - at) / ramp);
const decayAt = (at) => (t) => (t < at ? 1 : Math.exp(-(t - at) / OUT_TAU));
const cutAt = (at) => (t) => (t < at - 0.01 ? 1 : Math.max(0, (at - t) / 0.01));

function rms([L, R], a, b) {
    let e = 0;
    let n = 0;
    for (let i = Math.max(0, Math.round(a * SR)); i < Math.min(L.length, Math.round(b * SR)); i++, n++)
        e += (L[i] * L[i] + R[i] * R[i]) / 2;
    return Math.sqrt(e / Math.max(1, n));
}
/** Soma `buf` (que começa em `at` s) em `out` com ganho `g`. */
function place(out, buf, at, g) {
    const i0 = Math.round(at * SR);
    for (let c = 0; c < 2; c++)
        for (let i = 0; i < buf[c].length && i0 + i < out[c].length; i++)
            if (i0 + i >= 0) out[c][i0 + i] += buf[c][i] * g;
}
/** Ganho que leva o trecho [a, b) do `buf` (relativo ao começo dele) ao `alvo` de RMS, */
// e o pico não passa de PICO (−8 dBFS): a virada é percussão, fica abaixo do lead (as faixas têm pico de −3 a −6 dB)
const PICO = 0.4;
const ganhoPara = (buf, a, b, alvo) => {
    let pk = 1e-6;
    for (const c of buf) for (const v of c) pk = Math.max(pk, Math.abs(v));
    return Math.min(alvo / Math.max(1e-6, rms(buf, a, b)), PICO / pk);
};

/**
 * Virada da casa no andamento da faixa que sai: as últimas `beats` batidas do compasso 0; termina no SOC-CER-MON
 * (3-3-2) de caixa e clap 808 macio (receita 7b). `crash`: prato e bumbo no 1 do compasso seguinte (a faixa nova).
 */
function virada(bpm, swing, beats, crash) {
    const S = new Song({ bpm, bars: 2, swing, tail: 2.5 });
    // bumbo só no 1 da faixa nova (com o prato): na virada, o bumbo da faixa que sai já está lá
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.85, pan: 0.05, rev: 0.08 });
    const toms = [0.35, 0, -0.35].map((pan) => S.part('tom', I.tom, { drum: true, gain: 0.9, pan, rev: 0.1 }));
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, rev: 0.1 });
    const cr = S.part('crash', I.crash, { drum: true, gain: 0.6, rev: 0.2 });
    const PITCH = [7, 3, -2];
    const r0 = 16 - 4 * beats;
    if (beats === 1) {
        // uma batida: rufo de caixa crescendo
        for (let i = 0; i < 4; i++) sn.note(r0 + i, 0, 0, 0.45 + 0.22 * i);
    } else {
        // antes das 2 últimas batidas: toms descendo, caixa fantasma nas linhas pares
        for (let r = r0; r < 8; r++) {
            const u = (r - r0) / Math.max(1, 8 - r0);
            const k3 = Math.min(2, Math.floor(u * 3));
            toms[k3].note(r, PITCH[k3], 0, 0.5 + 0.35 * u);
            if (r % 2 === 0) sn.note(r, 0, 0, 0.3);
        }
        // as 2 últimas: Soc-cer-MON na caixa e no clap, toms no meio
        for (const [r, v] of [
            [8, 0.9],
            [11, 1],
            [14, 1.15],
        ]) {
            sn.note(r, 0, 0, v);
            cl.note(r, 0, 0, v);
        }
        for (const [r, t] of [
            [9, 0],
            [10, 0],
            [12, 1],
            [13, 1],
            [15, 2],
        ])
            toms[t].note(r, PITCH[t], 0, 0.55);
    }
    if (crash) {
        cr.note(16, 0, 0, 1);
        k.note(16, 0, 0, 1.1);
    }
    return S.render();
}

/** Riser: ruído num passa-faixa que sobe (300 Hz → 5 kHz) e cresce até o 1 da faixa nova. */
function riser(dur) {
    const n = Math.round(dur * SR);
    let s = 99;
    const rnd = () => {
        s = (s * 16807) % 2147483647;
        return (s / 2147483647) * 2 - 1;
    };
    return [0, 1].map(() => {
        const y = new Float32Array(n);
        let low = 0;
        let band = 0;
        for (let i = 0; i < n; i++) {
            const u = i / n;
            const f1 = 2 * Math.sin((Math.PI * 300 * (5000 / 300) ** u) / SR);
            const high = rnd() - low - 0.5 * band;
            band += f1 * high;
            low += f1 * band;
            y[i] = band * u * u * Math.min(1, (n - i) / (0.005 * SR));
        }
        return y;
    });
}

/** Ponte: 1 compasso no andamento e no tom da faixa que entra, com o som de assinatura dela. */
const PONTE = {
    // Draft (Fá maior, 108): C7 com o baixo subindo Dó-Ré-Mi até o Fá, e as três cartas em 3-3-2 (Soc-cer-MON em Fá)
    draft(S) {
        const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.15 });
        const bs = S.part('baixo', I.bass, { gain: 0.6 });
        const k = S.part('bumbo', I.kick, { drum: true, gain: 0.7 });
        const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.3 });
        const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6000, sala: 0.35 }), { drum: true, rev: 0.1 });
        stabs(ep, 0, 'C7sus4', [[0, 3]], { low: 57, n: 4, vel: 0.8 });
        stabs(ep, 0, 'C7', [[6, 2]], { low: 57, n: 4, vel: 0.8 });
        bass(bs, 0, 'C7', '0:4 2:4 3:6 r:2');
        drum(k, 0, 1, 'X.......X.......');
        drum(sh, 0, 1, 'xoxoxoxoxoxoxoxo');
        drum(cl, 0, 1, '....x...........');
        ['C6', 'A5', 'F6'].forEach((n, i) => {
            const pan = [-0.6, 0, 0.6][i];
            const r = [8, 11, 14][i];
            mel(S.part('carta', I.bell, { pan, gain: 2, rev: 0.3 }), 0, [`r:${r} ${n}:2 r:${14 - r}`]);
            drum(S.part('flip', FLIP, { drum: true, pan, gain: 1.6 }), 0, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    },
    // Escalação (Mi menor, 116, disco): Si7b9 nos metais quentes, baixo Si-Ré#-Fá#-Lá até o Mi, e a prancheta
    escalacao(S) {
        const met = S.part('metais', I.brass, { pan: 0.25, gain: 0.9, corte: 1800, rev: 0.15 });
        const bs = S.part('baixo', I.slap, { gain: 0.5 });
        const k = S.part('bumbo', I.kick, { drum: true, gain: 0.9 });
        const oh = S.part('chimbal', I.ohat, { drum: true, pan: 0.3, gain: 0.6 });
        const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 }), { drum: true });
        const tm = S.part('tom', I.tom, { drum: true });
        stabs(met, 0, 'B7b9', [
            [0, 6],
            [12, 4],
        ]);
        bass(bs, 0, 'B7', '0:2 8:2 r:2 3:2 5:2 r:2 s:4');
        drum(k, 0, 1, 'x...x...x...x...');
        drum(oh, 0, 1, '..x...x...x...x.');
        drum(cl, 0, 1, '....x.......x...');
        drum(tm, 0, 1, '..............xx', { pitch: 3 });
        [0, 3, 6, 10, 12].forEach((r, i) => {
            const P = S.part('peça', PECA, { drum: true, pan: -0.6 + 0.3 * i, gain: 1.4, rev: 0.12 });
            drum(P, 0, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`, { pitch: [0, 2, 3, 5, 7][i] });
        });
    },
};
function ponte(id, bpm, swing) {
    const S = new Song({ bpm, bars: 1, swing, tail: 2 });
    PONTE[id](S);
    return S.render();
}

/**
 * Os 4 pares. `de`: faixa que sai, trecho e quantos compassos depois do começo dele o clipe começa; `toque` = em que
 * compasso (fracionário, desde o começo do clipe) a tela troca. Partida → Vitória: o apito pede o trecho `fim` e o
 * resultado vem 3 s depois (AUTO_RESULT_MS), como no jogo.
 */
const PARES = [
    { nome: 'home-draft', de: ['menu-balanco', 'loop', 8], toque: 3.65, para: 'draft', c: 'ponte' },
    { nome: 'draft-escalacao', de: ['draft', 'loop', 4], toque: 3.4, para: 'escalacao', c: 'ponte' },
    { nome: 'escalacao-partida', de: ['escalacao', 'loop', 4], toque: 3.4, para: 'partida-1t', c: 'riser' },
    {
        nome: 'partida-vitoria',
        de: ['partida-2t', 'pressao', 4],
        apito: 3.5,
        toque: 3.2,
        para: 'vitoria-gancho',
        c: 'riser',
    },
];
const NOVA_S = 8;

function render(par, modo) {
    const [fromId, fromSec, bars0] = par.de;
    const A = track(fromId);
    const sa = sec(A, fromSec);
    const ga = gridOf(A, sa);
    let old = src(A, sa, 0, sa.inicio + bars0 * ga.bar, () => 1);
    const sources = [old];
    let click = par.toque * ga.bar;
    if (par.apito != null) {
        // o apito: troca de trecho pro `fim` na linha do compasso (sectionSwitchAt), o resultado 3,2 s depois
        const t = par.apito * ga.bar;
        const at = sectionSwitchAt(t, gridX(old, t), ga.bar);
        const fim = sec(A, 'fim');
        old.gain = cutAt(at);
        old.stop = at + 0.01;
        old = src(A, fim, at, fim.inicio, () => 1);
        sources.push(old);
        click = at + par.toque;
    }
    const B = track(par.para);
    const sb = sec(B, 'nivel1');
    const gb = gridOf(B, sb);
    const start = leadIn(B, sb)?.inicio ?? sb.inicio;
    const g = gridOf(A, old.s);
    const x = gridX(old, click);
    if (!sounding(old, click)) throw new Error(`${par.nome}: a faixa que sai já acabou no toque`);
    const info = {
        par: par.nome,
        modo,
        de: `${fromId} (${old.s.nome}, ${old.s.bpm} BPM)`,
        para: `${par.para} (${sb.bpm} BPM)`,
    };
    info.toque = +click.toFixed(2);
    let entra;
    let off = start;
    const extras = [];
    if (modo === 'a') {
        // o jogo hoje: swapWait (compasso se chega em até 0,7 s, senão a batida); andamentos que casam: batida, mesma fase
        const same = sameTempo(g.pulse, gb.pulse);
        entra = click + swapWait(x, g, same);
        if (same && sb.loop) off += phaseOffset(beatOf(gridX(old, entra), g), gb);
        info.onde = same
            ? `na batida (andamentos casam), na ${beatOf(gridX(old, entra), g) + 1}ª batida do compasso`
            : Math.abs(untilLine(x, g.bar) - (entra - click)) < 1e-6
              ? 'na linha do compasso'
              : 'na próxima batida';
        old.gain = decayAt(entra);
        old.stop = entra + 8 * OUT_TAU;
    } else {
        // virada: começa na próxima batida e termina no 1 do compasso seguinte (de 1 batida a 1 compasso)
        const fillAt = click + untilLine(x, g.pulse);
        const D = fillAt + untilLine(gridX(old, fillAt), g.bar, g.pulse / 2);
        const beats = Math.round((D - fillAt) / g.pulse);
        info.virada = beats;
        old.lp = { from: fillAt, to: D };
        old.gain = decayAt(D);
        old.stop = D + 8 * OUT_TAU;
        const ref = rms(
            mix([{ ...old, gain: () => 1, lp: null, stop: click }], Math.ceil(click * SR)),
            click - 2,
            click,
        );
        const fill = virada(old.s.bpm, SWING[fromId] ?? 0, beats, modo === 'c' && par.c === 'riser');
        const fill0 = D - g.bar;
        const k = ganhoPara(fill, fillAt - fill0, D - fill0, 0.6 * ref);
        extras.push([fill, fill0, k]);
        entra = D;
        if (modo === 'c' && par.c === 'riser') {
            const r0 = Math.max(click + LEAD_S, D - g.bar);
            const rs = riser(D - r0);
            extras.push([rs, r0, ganhoPara(rs, 0, D - r0, 0.3 * ref)]);
            info.extra = `riser de ${(D - r0).toFixed(1)} s e prato no 1`;
        }
        if (modo === 'c' && par.c === 'ponte') {
            const p = ponte(par.para, sb.bpm, SWING[par.para] ?? 0);
            const alvo = rms(mix([src(B, sb, 0, start, () => 1)], 4 * SR), 0, 4);
            extras.push([p, D, ganhoPara(p, 0, gb.bar, 0.75 * alvo)]);
            entra = D + gb.bar;
            info.extra = `ponte de 1 compasso (${gb.bar.toFixed(2)} s) no andamento e no tom da faixa nova`;
        }
    }
    info.espera = +(entra - click).toFixed(2);
    sources.push(src(B, sb, entra, off, rampIn(entra)));
    const fim = B.meta.secoes.length === 1 ? entra + B.L.length / SR - off : entra + NOVA_S;
    const n = Math.ceil(fim * SR);
    const out = mix(sources, n);
    for (const [buf, at, k] of extras) place(out, buf, at, k);
    // saída de 1 s no fim do clipe (faixa em loop) e limitador suave só nos picos
    const fade = Math.round(SR * (B.meta.secoes.length === 1 ? 0.01 : 1));
    for (const c of out)
        for (let i = 0; i < n; i++) {
            const v = c[i] * Math.min(1, (n - i) / fade);
            const a = Math.abs(v);
            c[i] = a < 0.9 ? v : Math.sign(v) * (0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1));
        }
    const pcm = new Float32Array(2 * n);
    for (let i = 0; i < n; i++) [pcm[2 * i], pcm[2 * i + 1]] = [out[0][i], out[1][i]];
    const file = `ab-${par.nome}-${modo}.ogg`;
    execFileSync(
        'ffmpeg',
        [
            '-v',
            'error',
            '-y',
            '-f',
            'f32le',
            '-ar',
            String(SR),
            '-ac',
            '2',
            '-i',
            '-',
            '-c:a',
            'libvorbis',
            '-q:a',
            '5',
            join(OUT, file),
        ],
        { input: Buffer.from(pcm.buffer) },
    );
    info.arquivo = file;
    info.duracao = +(n / SR).toFixed(1);
    return info;
}

mkdirSync(OUT, { recursive: true });
const res = PARES.flatMap((p) => ['a', 'b', 'c'].map((m) => render(p, m)));
for (const r of res) console.log(JSON.stringify(r));
writeFileSync(join(OUT, 'ab-transicao.json'), `${JSON.stringify(res, null, 1)}\n`);
