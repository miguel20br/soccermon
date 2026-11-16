// Faixa 16 do álbum, "Soc-cer-MON!" (a faixa-título nova). A história: o apito final da decisão, a fanfarra do
// Campeão, e a temporada inteira passando na cabeça do time enquanto a torcida canta: o SOC-CER-MON vira a base (o
// baixo e as palmas no 3-3-2) e por cima dele passa, na ordem da Rota, o motivo de cada rival enfrentado, no timbre e
// com o som de assinatura dele (Brock, Misty, Rocket, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni). Depois da
// sombra do Giovanni, a virada, sobe um tom (Dó → Ré) e o gancho com tudo, com o "hey hey" no clap 808 dobrado de
// torcida (a receita do Campeão). Funk animado, 100 BPM (o andamento do Campeão e do molde `livre-ditto`).
// `esboco()`: os 15 s pra o Miguel aprovar a ideia (meio compasso por rival). `default`: a faixa inteira.

import { MOTIVO as BLAINE, fogo } from '../pecas/lider-blaine.mjs';
import { borrifo, MOTIVO as ERIKA } from '../pecas/lider-erika.mjs';
import { MOTIVO as GIOVANNI, tremor } from '../pecas/lider-giovanni.mjs';
import { MOTIVO as KOGA, shaku, tonk, voz } from '../pecas/lider-koga.mjs';
import { MOTIVO as SABRINA, teremim, warp } from '../pecas/lider-sabrina.mjs';
import { torcida, zap } from '../pecas/livre-ginasio.mjs';
import { MOTIVO as SURGE } from '../pecas/livre-lt-surge.mjs';
import { MOTIVO as BROCK } from '../pecas/tema-brock.mjs';
import { MOTIVO as MISTY } from '../pecas/tema-misty.mjs';
import { MOTIVO as ROCKET } from '../pecas/tema-rocket.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Soc-cer-MON!', faixa: 16 };

/**
 * Frase solta (sem conferir o compasso): tokens do `mel` a partir da linha `t0`, com `k` linhas por unidade (o 12/8
 * da Misty entra no 4/4 com k = 4/3), `shift` semitons, e cortada em `ate` unidades (meia frase no esboço).
 */
function frase(P, t0, str, { k = 1, shift = 0, vel = 1, ate = Number.POSITIVE_INFINITY } = {}) {
    let u = 0;
    for (const tok of str.trim().split(/\s+/)) {
        const [, n, l, acc] = /^([^:]+):(\d+(?:\.\d+)?)([!~]?)$/.exec(tok);
        const len = Math.min(Number(l), ate - u);
        if (len <= 0) break;
        if (n !== 'r')
            for (const x of n.split('+'))
                P.note(t0 + u * k, midi(x) + shift, len * k, vel * (acc === '!' ? 1.2 : acc === '~' ? 0.6 : 1));
        u += Number(l);
    }
}

/** Os rivais na ordem da Rota: motivo, semitons até Dó (ou Dó menor), acorde em Dó, timbre e assinatura. */
const RIVAIS = [
    { nome: 'brock', m: BROCK.mel, s: -4, ac: ['Cm', 'Ab'] },
    { nome: 'misty', m: MISTY.mel, s: 1, ac: ['Cm', 'G7'], k: 4 / 3 },
    { nome: 'rocket', m: ROCKET.mel, s: 0, ac: ['Cm7', 'G7b9'] },
    { nome: 'surge', m: SURGE.mel, s: -6, ac: ['Cm', 'G7'] },
    { nome: 'erika', m: ERIKA.mel, s: -2, ac: ['C6', 'Bb'] },
    { nome: 'koga', m: KOGA.mel, s: 3, ac: ['Cm', 'Db'] },
    { nome: 'sabrina', m: SABRINA.mel, s: 2, ac: ['Cmaj7', 'D'] },
    { nome: 'blaine', m: BLAINE.mel, s: 0, ac: ['Cm', 'G7'] },
    { nome: 'giovanni', m: GIOVANNI.mel, s: -6, ac: ['Cm', 'G7'] },
];

/** As faixas da peça (base, fanfarra, um timbre por rival, sons de assinatura). */
function banda(S) {
    const clap = I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.3 });
    const B = {
        br: S.part('metais', I.brass, { pan: -0.15, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.25 }),
        br2: S.part('metais2', I.brass, { pan: 0.25, gain: 0.75, rev: 0.25 }),
        lead: S.part('lead', I.lead, { pan: 0, gain: 0.5 }),
        tuba: S.part('tuba', I.tuba, { gain: 0.5 }),
        pad: S.part('pad', I.pad, { gain: 1.0, rev: 0.3 }),
        ar: S.part('arp', I.arp, { pan: 0.5, gain: 1.3, echo: { rows: 1, fb: 0.4, mix: 0.4 }, rev: 0.3 }),
        bs: S.part('baixo', I.slap, { gain: 0.55, corte: 2500 }),
        gt: S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 }),
        k: S.part('bumbo', I.kick, { drum: true, gain: 0.7 }),
        sn: S.part('caixa', I.snare, { drum: true, gain: 0.4 }),
        hh: S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.5 }),
        ti: S.part('timpano', I.timp, { drum: true, gain: 0.25 }),
        cr: S.part('prato', I.crash, { drum: true, pan: 0.2, gain: 0.6 }),
        cl: S.part('palmas', clap, { drum: true, pan: -0.4, gain: 1.6, rev: 0.15 }),
        cl2: S.part('palmas2', clap.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.4, gain: 1.6, rev: 0.15 }),
        torcida: S.part('torcida', torcida(4, 0.4, 2), { drum: true, gain: 0.35, rev: 0.3 }),
        apito: S.part('apito', I.whistle, { drum: true, pan: 0.2, gain: 0.8, rev: 0.2 }),
        // os rivais
        brock: S.part('brock', I.brass, { pan: -0.1, gain: 1.1, rev: 0.2 }),
        pedra: S.part('pedra', I.tom, { drum: true, pan: -0.2, gain: 0.7 }),
        misty: S.part('misty', I.counter, { pan: -0.15, gain: 1.2, rev: 0.25, echo: { rows: 3, fb: 0.2, mix: 0.15 } }),
        sinos: S.part('sinos', I.bell, { pan: 0.3, gain: 1.6, rev: 0.35 }),
        bolhas: S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.5, rev: 0.4 }),
        rocket: S.part('rocket', I.organ, { pan: -0.2, gain: 1.6, echo: { rows: 3, fb: 0.2, mix: 0.15 } }),
        trio: S.part('trio', I.stab, { pan: 0.1, gain: 1.3, rev: 0.15 }),
        surge: S.part('surge', I.pulse, { pan: -0.1, gain: 1.2, corte: 3500, echo: { rows: 3, fb: 0.25, mix: 0.2 } }),
        choque: S.part('choque', zap, { drum: true, pan: 0.35, gain: 0.6, echo: { rows: 3, fb: 0.3, mix: 0.3 } }),
        erika: S.part('erika', I.counter, { pan: 0.15, gain: 1.15, rev: 0.25, corte: 4000 }),
        marimba: S.part('marimba', I.pizz, { pan: 0.3, gain: 2.0, echo: { rows: 2, fb: 0.2, mix: 0.15 } }),
        perfume: S.part('perfume', borrifo, { drum: true, pan: 0.45, gain: 0.7, rev: 0.2 }),
        koga: voz(S, 'koga', shaku, {
            pan: -0.1,
            gain: 0.85,
            rev: 0.3,
            corte: 3800,
            echo: { rows: 3, fb: 0.2, mix: 0.15 },
        }),
        tonk: S.part('tonk', tonk, { drum: true, gain: 0.8, rev: 0.15 }),
        sabrina: voz(
            S,
            'sabrina',
            teremim,
            { pan: 0.1, gain: 0.7, rev: 0.35, echo: { rows: 6, fb: 0.3, mix: 0.25 } },
            { solta: 0.25 },
        ),
        warp: S.part('teleporte', warp, { drum: true, pan: 0.2, gain: 0.6, rev: 0.35 }),
        blaine: S.part('blaine', I.pulse, { pan: -0.1, gain: 1.2, corte: 3400, echo: { rows: 3, fb: 0.2, mix: 0.15 } }),
        fogo: S.part('fogo', fogo, { drum: true, pan: 0.3, gain: 0.6, rev: 0.15 }),
        giovanni: S.part('giovanni', I.brass, { pan: -0.1, gain: 1.2, rev: 0.2, corte: 2800 }),
        orgao: S.part('orgao', I.organ, { pan: 0.2, gain: 1.0, rev: 0.35 }),
        tremor: S.part('tremor', tremor, { drum: true, gain: 0.8 }),
    };
    return B;
}

/** A base: o funk com o SOC-CER-MON no baixo (3-3-2 duas vezes por compasso) e o "hey hey" da torcida. */
function base(B, b, c1, c2 = c1, { palmas = true } = {}) {
    drum(B.k, b, 1, 'X.....x...x..x..');
    drum(B.sn, b, 1, '....X..o.o..X..o');
    drum(B.hh, b, 1, 'x.xx.x.xx.xx.x.x');
    bass(B.bs, b, c1, '0:3 0:3 8:2 r:8');
    bass(B.bs, b, c2, 'r:8 0:3 0:3 8:2');
    stabs(B.gt, b, c1, [2, 6], { low: 60, n: 3 });
    stabs(B.gt, b, c2, [10, 14], { low: 60, n: 3 });
    if (palmas) for (const g of [B.cl, B.cl2]) drum(g, b, 1, '............x.x.', { vel: 0.8 });
}

/** O rival `r` entra na linha `t0` e toca `ate` linhas do motivo, com a assinatura dele no fim. */
function rival(B, r, t0, ate) {
    const k = r.k ?? 1;
    const fim = t0 + ate;
    // cada compasso do motivo tem 16 linhas no 4/4 (12 unidades × 4/3 no 12/8 da Misty)
    const um = (P, i, o = {}) => frase(P, t0 + i * 16, r.m[i], { shift: r.s, k, ate: (ate - i * 16) / k, ...o });
    const ambos = (P, o) => {
        um(P, 0, o);
        if (ate > 16) um(P, 1, o);
    };
    switch (r.nome) {
        case 'brock':
            ambos(B.brock);
            B.pedra.note(fim - 2, -5, 0, 1);
            break;
        case 'misty':
            ambos(B.misty);
            ambos(B.sinos, { shift: r.s + 12, vel: 0.35 });
            B.bolhas.note(fim - 3, 0, 0, 0.8);
            B.bolhas.note(fim - 2, 5, 0, 0.6);
            break;
        case 'rocket':
            ambos(B.rocket);
            for (const x of [0, 1, 2]) for (const m of [59, 62, 65, 68]) B.trio.note(fim - 6 + x * 2, m, 1, 0.9);
            break;
        case 'surge':
            ambos(B.surge);
            B.choque.note(fim - 2, 0, 0, 1);
            break;
        case 'erika':
            ambos(B.erika);
            ambos(B.marimba, { shift: r.s - 12, vel: 0.5 });
            B.perfume.note(fim - 3, 0, 0, 1);
            break;
        case 'koga':
            ambos(B.koga);
            B.tonk.note(fim - 2, 0, 0, 1);
            break;
        case 'sabrina':
            B.warp.note(t0 - 2, 0, 0, 0.8);
            ambos(B.sabrina);
            break;
        case 'blaine':
            ambos(B.blaine);
            B.fogo.note(fim - 3, 0, 0, 1);
            break;
        case 'giovanni':
            ambos(B.giovanni);
            ambos(B.orgao, { shift: r.s + 12, vel: 0.5 });
            B.tremor.note(t0, 0, 0, 0.8);
            break;
        default:
            throw new Error(r.nome);
    }
}

/** Esboço de 15 s: fanfarra (1), os nove rivais em meio compasso cada (4,5), a virada (½), o gancho em Ré (1). */
export function esboco() {
    const S = new Song({ bpm: 100, bars: 7, swing: 0.1, tail: 3 });
    const B = banda(S);
    const C = MAJOR(0);
    // 0 · o apito final e a fanfarra do Campeão ("pam pam-pam PAAM"), com o rufar
    B.apito.note(0, 0, 0, 0.9);
    B.torcida.note(0, 0, 0, 1);
    const F = ['C5:2 C5:1 C5:1 G5:4 F5:2 E5:1 F5:1 G5:4'];
    mel(B.br, 0, F);
    mel(B.br2, 0, F, { harm: thirdBelow(C) });
    drum(B.sn, 0, 1, 'oooooooxxxxxXXXX', { vel: 0.8 });
    drum(B.ti, 0, 1, 'X.......X...X.X.');
    padChord(B.pad, 0, 'C', 8, { low: 55 });
    padChord(B.pad, 0, 'G', 8, { low: 55, at: 8 });
    bass(B.tuba, 0, 'C', '0:4 5:4 r:8');
    bass(B.tuba, 0, 'G', 'r:8 0:4 5:4');
    // 1 a 5 · a temporada passa: a base e um rival a cada meio compasso
    RIVAIS.forEach((r, i) => {
        const t0 = 16 + i * 8;
        rival(B, r, t0, 8);
    });
    for (let b = 1; b <= 5; b++) {
        const i = (b - 1) * 2;
        const c1 = RIVAIS[i].ac[0];
        const c2 = RIVAIS[i + 1]?.ac[0] ?? 'A7';
        if (b < 5) base(B, b, c1, c2);
    }
    drum(B.cr, 1, 1, 'X...............', { vel: 0.7 });
    // 5 · Giovanni na 1ª metade; na 2ª, a virada em Lá7 (o V de Ré), a caixa e o apito subindo
    bass(B.bs, 5, 'Cm', '0:3 0:3 8:2 r:8');
    drum(B.k, 5, 1, 'X.....x.X.X.X.X.');
    drum(B.sn, 5, 1, '........xxXxXXXX', { vel: 0.9 });
    bass(B.bs, 5, 'A7', 'r:8 0:2 0:2 3:2 5:2');
    stabs(B.br, 5, 'A7', [8, 10, [12, 4]], { low: 61, n: 3, vel: 0.8 });
    B.apito.note(5 * 16 + 12, 0, 0, 0.7);
    // 6 · o gancho em Ré com tudo, e o "hey hey" dobrado de torcida
    const D = MAJOR(2);
    drum(B.cr, 6, 1, 'X...............');
    drum(B.k, 6, 1, 'X.....x...x.....');
    drum(B.ti, 6, 1, 'X...............');
    B.torcida.note(6 * 16, 2, 0, 1.2);
    mel(B.br, 6, [GANCHO.em({ tom: 2 })]);
    mel(B.br2, 6, [GANCHO.em({ tom: 2 })], { harm: thirdBelow(D) });
    mel(B.lead, 6, [GANCHO.em({ tom: 2 })]);
    for (const g of [B.cl, B.cl2]) drum(g, 6, 1, 'X..X..X.....X.X.');
    bass(B.bs, 6, 'D', '0:3 0:3 8:2 r:8');
    bass(B.tuba, 6, 'D', 'r:12 0:4');
    padChord(B.pad, 6, 'Dadd9', 16, { low: 62 });
    stabs(B.gt, 6, 'D', [2, 6], { low: 60, n: 3 });
    drum(B.cr, 6, 1, '............X...', { vel: 0.8 });
    arp(B, 6);
    return S;
}

/** O arpejo do acorde final (Ré com nona), como no fim do Campeão. */
function arp(B, b) {
    const notas = [74, 76, 78, 81, 86, 88, 90, 93];
    for (const [i, m] of notas.entries()) B.ar.note(b * 16 + 12 + i * 0.5, m, 1, 0.6);
}

/**
 * A faixa inteira (~2:10, 52 compassos a 100 BPM):
 *   0-3   · o apito final (curto, curto, longo), a torcida explode, a fanfarra do Campeão e a torcida responde
 *   4-11  · a festa: o funk com o SOC-CER-MON no baixo; os metais cantam a fanfarra, a torcida responde com o gancho
 *   12-29 · a temporada passando: os nove rivais, dois compassos cada, no timbre e com a assinatura de cada um, sobre
 *           a base; a torcida grita "hey hey" entre um bloco de três e o outro
 *   30-31 · a sombra do Giovanni: o chão treme, a banda some, sobra a torcida batendo o 3-3-2 sozinha, crescendo
 *   32    · a virada: Lá7, caixa e o apito subindo
 *   33-48 · sobe um tom (Ré): o gancho com tudo, o "hey hey" dobrado; na 2ª metade, a fanfarra em Ré e cada rival
 *           volta só com o som de assinatura dele, um por compasso, como quem cumprimenta o campeão
 *   49-51 · o fim do Campeão: o Ré com nona nos metais, o arpejo, prato e tímpano, e a torcida
 */
export default function socCerMon() {
    const S = new Song({ bpm: 100, bars: 52, swing: 0.1, tail: 4 });
    const B = banda(S);
    const C = MAJOR(0);
    const D = MAJOR(2);
    const palmas = (b, p = GANCHO.palmas, vel = 1) => {
        for (const g of [B.cl, B.cl2]) drum(g, b, 1, p, { vel });
    };
    // 0-3 · apito final, a fanfarra e a resposta
    drum(B.apito, 0, 1, 'x...x...x.......', { vel: 0.8 });
    B.torcida.note(10, 0, 0, 1.2);
    drum(B.sn, 0, 1, '..........ooxxXX', { vel: 0.7 });
    const M1 = ['C5:2 C5:1 C5:1 G5:4 F5:2 E5:1 F5:1 G5:4', 'A5:2 A5:1 A5:1 B5:2 B5:1 B5:1 C6:8'];
    mel(B.br, 1, M1);
    mel(B.br2, 1, M1, { harm: thirdBelow(C) });
    mel(B.br, 3, [GANCHO.bar]);
    mel(B.lead, 3, [GANCHO.bar]);
    palmas(3, 'X..X..X.....X.X.');
    for (const [b, c1, c2] of [
        [1, 'C', 'C'],
        [2, 'F', 'G'],
        [3, 'C', 'G7'],
    ]) {
        bass(B.tuba, b, c1, '0:4 5:4 r:8');
        bass(B.tuba, b, c2, 'r:8 0:4 5:4');
        padChord(B.pad, b, c1, 8, { vel: 0.7 });
        padChord(B.pad, b, c2, 8, { at: 8, vel: 0.7 });
        drum(B.sn, b, 1, b === 3 ? 'X.xxX.x.X.xxXXXX' : 'X.xxX.x.X.xxX.x.', { vel: 0.8 });
        drum(B.k, b, 1, 'X...X...X...X...');
    }
    drum(B.ti, 2, 1, '........X.X.XXXX', { pitch: 5 });
    drum(B.cr, 1, 1, 'X...............');
    // 4-11 · a festa: a base, os metais cantam a fanfarra (pergunta), a torcida e o lead respondem com o gancho
    const FESTA = [
        ['C', 'C'],
        ['Am7', 'Am7'],
        ['F', 'G7'],
        ['C', 'C'],
        ['C', 'C'],
        ['Am7', 'Am7'],
        ['Dm7', 'G7'],
        ['C', 'G7'],
    ];
    FESTA.forEach(([c1, c2], i) => {
        base(B, 4 + i, c1, c2, { palmas: i % 2 === 1 });
    });
    mel(B.br, 4, M1);
    mel(B.br2, 4, M1, { harm: thirdBelow(C) });
    mel(B.lead, 6, [GANCHO.bar]);
    mel(B.br, 8, ['E5:2 E5:1 E5:1 C6:4 B5:2 A5:1 B5:1 C6:4', 'D6:2 D6:1 D6:1 B5:2 B5:1 B5:1 G5:8']);
    mel(B.br2, 8, ['C5:2 C5:1 C5:1 A5:4 G5:2 F5:1 G5:1 A5:4', 'B5:2 B5:1 B5:1 G5:2 G5:1 G5:1 D5:8']);
    mel(B.lead, 10, [GANCHO.em({ grau: 1 }), GANCHO.em({ grau: 4, oitava: -1 })]);
    for (const b of [4, 8]) drum(B.cr, b, 1, 'X...............', { vel: 0.7 });
    // 12-29 · os nove rivais, dois compassos cada, sobre a base
    RIVAIS.forEach((r, i) => {
        const b = 12 + 2 * i;
        base(B, b, r.ac[0], r.ac[0], { palmas: false });
        base(B, b + 1, r.ac[1], r.ac[1], { palmas: i % 3 === 2 });
        rival(B, r, b * 16, 32);
        if (i % 3 === 0) drum(B.cr, b, 1, 'X...............', { vel: 0.6 });
    });
    // 30-31 · a sombra do Giovanni: o chão treme, sobra a torcida no 3-3-2, crescendo
    B.tremor.note(30 * 16, 0, 0, 1);
    bass(B.tuba, 30, 'Cm', '0:16', { vel: 0.8 });
    bass(B.bs, 30, 'Cm', '0:3 0:3 8:2 r:8', { vel: 0.7 });
    bass(B.bs, 31, 'Cm', '0:3 0:3 8:2 0:3 0:3 8:2');
    palmas(30, 'X..X..X.........', 0.6);
    palmas(31, 'X..X..X.X..X..X.', 0.9);
    B.torcida.note(31 * 16, 0, 0, 0.9);
    drum(B.k, 31, 1, 'X..X..X.X..X..X.');
    // 32 · a virada: Lá7 (o V de Ré), caixa e o apito subindo
    bass(B.bs, 32, 'A7', '0:2 0:2 3:2 5:2 0:2 0:2 3:2 5:2');
    stabs(B.br, 32, 'A7', [0, 3, 6, [8, 2], 10, [12, 4]], { low: 61, n: 3, vel: 0.8 });
    drum(B.sn, 32, 1, 'x...x...xxXxXXXX', { vel: 0.9 });
    drum(B.k, 32, 1, 'X...X...X.X.X.X.');
    B.apito.note(32 * 16 + 12, 0, 0, 0.8);
    // 33-48 · Ré: o gancho com tudo
    const RE = [
        ['D', 'D'],
        ['Bm7', 'Bm7'],
        ['G', 'A7'],
        ['D', 'A7'],
    ];
    for (let i = 0; i < 16; i++) {
        const b = 33 + i;
        const [c1, c2] = RE[i % 4];
        base(B, b, c1, c2, { palmas: false });
        padChord(B.pad, b, c1, 16, { low: 57, vel: 0.6 });
        if (i % 2 === 0) {
            const g = GANCHO.em({ tom: 2, grau: i % 8 === 4 ? 1 : 0 });
            mel(B.br, b, [g]);
            mel(B.br2, b, [g], { harm: thirdBelow(D) });
            mel(B.lead, b, [g]);
            palmas(b, GANCHO.palmas, 1.1);
            palmas(b + 1, 'X..X..X.........', 0.8);
        }
        if (i % 8 === 0) {
            drum(B.cr, b, 1, 'X...............');
            B.torcida.note(b * 16, 2, 0, 1);
        }
    }
    // 2ª metade: a fanfarra em Ré nas respostas, e cada rival cumprimenta com a assinatura dele
    const M2 = ['D5:2 D5:1 D5:1 A5:4 G5:2 F#5:1 G5:1 A5:4', 'B5:2 B5:1 B5:1 C#6:2 C#6:1 C#6:1 D6:8'];
    for (const b of [42, 46]) mel(B.lead, b, [M2[(b - 42) / 4]], { vel: 0.8 });
    mel(B.br, 34, ['r:8 F#5:2 A5:2 D6:4']);
    const ASSIN = [
        [B.pedra, -5],
        [B.bolhas, 7],
        [B.trio, null],
        [B.choque, 2],
        [B.perfume, 0],
        [B.tonk, 2],
        [B.warp, 2],
        [B.fogo, 0],
    ];
    ASSIN.forEach(([P, p], i) => {
        const t = (41 + i) * 16 + 14;
        if (p == null) for (const m of [62, 66, 69, 72]) P.note(t, m, 1, 0.7);
        else P.note(t, p, 0, 0.8);
    });
    // 49-51 · o fim do Campeão, em Ré
    mel(B.br, 49, ['D6:16', 'D6:12 r:4']);
    mel(B.br2, 49, ['A5:16', 'A5:12 r:4']);
    mel(B.lead, 49, ['r:8 F#6:2 A6:2 D7:4', GANCHO.em({ tom: 2 })]);
    palmas(50, 'X..X..X.....X.X.', 1.2);
    bass(B.tuba, 49, 'D', '0:16');
    bass(B.bs, 49, 'D', '0:3 0:3 8:2 r:8');
    padChord(B.pad, 49, 'Dadd9', 48, { low: 62 });
    drum(B.cr, 49, 1, 'X.......X.......');
    drum(B.ti, 49, 1, 'X...............');
    drum(B.k, 49, 1, 'X...............');
    B.torcida.note(49 * 16, 2, 0, 1.2);
    for (const b of [49, 50]) {
        const notas = [74, 76, 78, 81, 86, 88, 90, 93];
        for (let r = 0; r < 16; r++) B.ar.note(b * 16 + r, notas[r % 8], 1, b === 49 ? 0.8 : 0.5);
    }
    drum(B.cr, 51, 1, 'X...............');
    drum(B.ti, 51, 1, 'X...............');
    bass(B.tuba, 51, 'D', '0:16');
    stabs(B.br, 51, 'D', [[0, 8]], { low: 62, n: 3 });
    return S;
}
