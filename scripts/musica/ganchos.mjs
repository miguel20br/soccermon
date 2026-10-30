// Mapa do SOC-CER-MON de cada faixa do jogo: acha o GANCHO nas notas gravadas (`Song.recording`, antes da síntese) e
// grava no .json da faixa `gancho.hits` (segundos no arquivo das 3 batidas de cada gancho), o swing e os `tempos`.
//   node scripts/musica/ganchos.mjs [faixa ...] [--seco]    (--seco: só mostra, não grava)
//   node scripts/musica/ganchos.mjs abertura-gancho --conferir   (mede o ataque no .webm perto de cada batida)
// O áudio não muda (o gravador só anota). O render.mjs grava o mesmo mapa nas faixas novas.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Song, SR } from './synth.mjs';

/** Linha `t` do Song → segundos no arquivo renderizado (trechos colados: o loop e o do meio cortados no fim, como no `render`). */
function arquivo(song) {
    const inicio = [];
    let acc = 0;
    for (const x of song.secoes) {
        inicio.push(acc);
        acc += Math.round((x.t1 - x.t0) * SR);
    }
    return (t) => {
        const k = song.secOfBar(Math.floor(t / song.barLen));
        return inicio[k] / SR + song.sec(t) - song.secoes[k].t0;
    };
}

/**
 * Batidas do gancho num Song gravado: em qualquer faixa, 3 notas em 3-3-(2+): as duas primeiras duram o
 * mesmo que a distância entre elas (3 linhas; aumentado, 6), a terceira dura 2 ou mais; descendo uma terça (3 ou 4 semitons) e subindo uma
 * sexta (8 ou 9): G5 E5 C6 em qualquer tom, grau, oitava ou menor (`GANCHO.em`), e a segunda voz em terças junto.
 * Devolve [[t0, t1, t2], ...] em segundos no arquivo renderizado (trechos colados como no `render`), sem repetidos.
 */
export function ganchosDe(song, { notas = false } = {}) {
    const fileSec = arquivo(song);
    const starts = new Map();
    for (const p of song.parts) {
        if (p.drum || typeof p.inst === 'function' || !p.rec) continue;
        // linha → { nota: duração }
        const at = new Map();
        for (const [t, m, len] of p.rec) {
            if (!at.has(t)) at.set(t, new Map());
            at.get(t).set(m, len);
        }
        for (const [t, ms] of at)
            for (const g of [3, 6])
                for (const [m, len] of ms)
                    for (const d1 of [3, 4])
                        for (const d2 of [8, 9]) {
                            const l2 = at.get(t + g)?.get(m - d1);
                            const l3 = at.get(t + 2 * g)?.get(m - d1 + d2);
                            if (len === g && l2 === g && l3 >= 2 && !starts.has(`${t}:${g}`))
                                starts.set(`${t}:${g}`, [m, m - d1, m - d1 + d2]);
                        }
    }
    const all = [...starts]
        .map(([k, m]) => [...k.split(':').map(Number), m])
        .sort((a, b) => a[0] - b[0])
        .map(([t, g, m]) => ({ t: [t, t + g, t + 2 * g].map((r) => Math.round(fileSec(r) * 1000) / 1000), m }));
    // a mesma batida em duas faixas (lead e metais, voz de cima e de baixo): uma só
    const hits = all.filter((h, i) => i === 0 || Math.abs(h.t[0] - all[i - 1].t[0]) > 0.005);
    return notas ? hits : hits.map((h) => h.t);
}

/** Faixa do jogo (`public/music/<faixa>.json`) → peça e, se a peça devolve vários Songs, a chave. */
export const FAIXAS = {
    'abertura-gancho': ['abertura-gancho'],
    'menu-balanco': ['menu-balanco'],
    campeao: ['campeao'],
    cerulean: ['extra-cerulean'],
    derrota: ['derrota'],
    draft: ['draft'],
    eliminado: ['eliminado'],
    escalacao: ['escalacao'],
    'estrada-da-vitoria': ['estrada-da-vitoria'],
    'mercado-funk': ['mercado-funk'],
    'mt-moon': ['extra-mt-moon'],
    'partida-1t': ['partida', '1t'],
    'partida-2t': ['partida', '2t'],
    'partida-brock-1t': ['partida-brock', '1t'],
    'partida-brock-2t': ['partida-brock', '2t'],
    'partida-misty-1t': ['partida-misty', '1t'],
    'partida-misty-2t': ['partida-misty', '2t'],
    'partida-rocket-1t': ['partida-rocket', '1t'],
    'partida-rocket-2t': ['partida-rocket', '2t'],
    'penaltis-espera': ['penaltis', 'espera'],
    'penaltis-ganhou': ['penaltis', 'ganhou'],
    'penaltis-perdeu': ['penaltis', 'perdeu'],
    'planalto-indigo': ['planalto-indigo'],
    recompensa: ['recompensa'],
    'rota-1': ['extra-rota-1'],
    sala: ['extra-sala'],
    'tema-blaine': ['lider-blaine'],
    'tema-brock': ['tema-brock'],
    'tema-erika': ['lider-erika'],
    'tema-giovanni': ['lider-giovanni'],
    'tema-koga': ['lider-koga'],
    'tema-ltsurge': ['livre-lt-surge'],
    'tema-misty': ['tema-misty'],
    'tema-rocket': ['tema-rocket'],
    'tema-sabrina': ['lider-sabrina'],
    'ultima-partida': ['livre-ultima-partida'],
    'vitoria-gancho': ['vitoria-gancho'],
};

/**
 * O que vai no .json pro relógio de batidas do jogo: o swing, as mudanças de andamento dentro de um trecho (`tempos`:
 * [s no arquivo, bpm] na linha do compasso; a Erika freia no meio do loop) e o gancho (se tiver).
 */
export function ritmoDe(song) {
    const out = {};
    if (song.swing) Object.assign(out, { swing: song.swing, swingEm: song.swingUnit });
    if (song.bpmAt) {
        const fileSec = arquivo(song);
        const tempos = song.secoes.flatMap((x) =>
            Array.from({ length: x.ate - x.de - 1 }, (_, i) => x.de + 1 + i)
                .filter((b) => song.bpmAt(b) !== song.bpmAt(b - 1))
                .map((b) => [Math.round(fileSec(b * song.barLen) * 1e6) / 1e6, song.bpmAt(b)]),
        );
        if (tempos.length) out.tempos = tempos;
    }
    const hits = ganchosDe(song);
    if (hits.length) out.gancho = { hits };
    return out;
}

/** Junta o ritmo no .json, no lugar do que havia (gancho e swing velhos saem). */
export function comRitmo(json, ritmo) {
    const { gancho: _g, swing: _s, swingEm: _e, tempos: _t, ...rest } = json;
    return { ...rest, ...ritmo };
}

/**
 * Ataque medido no áudio de cada batida: energia na frequência da nota (Goertzel, janela de 512 amostras, passo de
 * 1 ms) e a maior subida (em 10 ms) dela de −45 a +55 ms do previsto. Devolve medido − previsto (ms).
 */
function conferir(file, ganchos) {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
        maxBuffer: 1 << 30,
    });
    const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const N = 512;
    const band = (c, f) => {
        const w = 2 * Math.cos((2 * Math.PI * f) / SR);
        let [s1, s2] = [0, 0];
        for (let i = Math.max(0, c - N / 2); i < Math.min(x.length, c + N / 2); i++)
            [s1, s2] = [x[i] + w * s1 - s2, s1];
        return s1 * s1 + s2 * s2 - w * s1 * s2;
    };
    const errs = [];
    for (const { t, m } of ganchos)
        t.forEach((h, k) => {
            const f = 440 * 2 ** ((m[k] - 69) / 12);
            const e = [];
            for (let ms = -50; ms <= 60; ms++) e.push(Math.log(1e-9 + band(Math.round((h + ms / 1000) * SR), f)));
            let best = 0;
            for (let i = 10; i < e.length; i++) if (e[i] - e[i - 10] > e[best + 10] - e[best]) best = i - 10;
            // a subida de 10 ms com o ataque no meio dela
            errs.push(best + 5 - 50);
        });
    return errs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    const names = args.filter((a) => !a.startsWith('--'));
    const todo = names.length ? names : Object.keys(FAIXAS);
    const dir = new URL('../../public/music/', import.meta.url);
    Song.recording = true;
    const mods = new Map();
    for (const faixa of todo) {
        const [peca, chave] = FAIXAS[faixa] ?? [];
        if (!peca) throw new Error(`faixa sem peça: ${faixa}`);
        if (!mods.has(peca)) {
            const mod = await import(new URL(`./pecas/${peca}.mjs`, import.meta.url));
            mods.set(peca, mod.default());
        }
        const res = mods.get(peca);
        const song = chave ? res[chave] : res;
        const path = new URL(`${faixa}.json`, dir);
        const json = JSON.parse(readFileSync(path, 'utf8'));
        // o mapa só vale se os trechos da peça são os do arquivo publicado
        let acc = 0;
        song.secoes.forEach((x, k) => {
            if (json.secoes[k]?.amostras[0] !== acc) throw new Error(`${faixa}: trecho ${x.nome} fora do lugar`);
            acc += Math.round((x.t1 - x.t0) * SR);
        });
        const ritmo = ritmoDe(song);
        const hits = ritmo.gancho?.hits ?? [];
        let extra = '';
        if (args.includes('--conferir')) {
            const errs = conferir(new URL(`${faixa}.webm`, dir).pathname, ganchosDe(song, { notas: true }));
            extra = ` ataque − previsto (ms): ${errs.join(' ')}`;
        }
        console.log(`${faixa}: ${hits.length} gancho(s) ${hits.map((h) => h[0]).join(' ')}${extra}`);
        if (!args.includes('--seco')) writeFileSync(path, `${JSON.stringify(comRitmo(json, ritmo), null, 1)}\n`);
        if (chave) delete res[chave];
    }
}
