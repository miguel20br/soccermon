// Faixa 16 do álbum, "Soc-cer-MON!" (a faixa-título nova). A história: o apito final da decisão, a fanfarra do
// Campeão, e a temporada inteira passando na cabeça do time enquanto a torcida canta: o SOC-CER-MON vira a base (o
// baixo e as palmas no 3-3-2) e por cima dele passa, na ordem da Rota, o motivo de cada rival enfrentado, no timbre e
// com o som de assinatura dele (Brock, Misty, Rocket, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni). Depois da
// sombra do Giovanni, a virada, sobe um tom (Dó → Ré) e o gancho com tudo, com o "hey hey" no clap 808 dobrado de
// torcida (a receita do Campeão). Funk animado, 100 BPM (o andamento do Campeão e do molde `livre-ditto`).
// `esboco()`: os 15 s pra o Miguel aprovar a ideia (meio compasso por rival). `default`: a faixa inteira.
// Rodada 2 (16/11/2026): "tá bem legal, mas dá pra melhorar bastante". A faixa-título ganhou um REFRÃO próprio (antes
// eram 16 compassos do gancho repetido), com o gancho como etiqueta no fim de cada frase e o iv menor (Sol menor com
// sexta) de passagem; os cumprimentos dos rivais viraram um respiro (a banda abre espaço e volta crescendo); uma 2ª
// subida (Ré → Mi♭, pelo Si♭7) antes do fim; metais de verdade (trompete, trombone, tuba), bateria com corpo num
// barramento comprimido, e as palmas dobradas mais baixas (−4 dB) e só nas respostas.

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
import {
    bass,
    drum,
    GANCHO,
    I,
    MAJOR,
    MINOR,
    mel,
    midi,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';
import { BATERIA, bumbo, caixa, trombone, trompete, tuba as tubaVoz } from './kit.mjs';

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
        br: trompete(S, 'metais', { pan: -0.15, gain: 0.9, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.25 }),
        br2: trombone(S, 'metais2', { pan: 0.25, gain: 0.8, rev: 0.25 }),
        lead: S.part('lead', I.lead, { pan: 0, gain: 0.5 }),
        tuba: tubaVoz(S, 'tuba', { gain: 0.6 }),
        pad: S.part('pad', I.pad, { gain: 1.0, rev: 0.3 }),
        ar: S.part('arp', I.arp, { pan: 0.5, gain: 1.3, echo: { rows: 1, fb: 0.4, mix: 0.4 }, rev: 0.3 }),
        bs: S.part('baixo', I.slap, { gain: 0.55, corte: 2500 }),
        gt: S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 }),
        k: S.part('bumbo', bumbo, { drum: true, gain: 0.8, bus: S.barramentos ? 'bateria' : null }),
        sn: S.part('caixa', caixa, { drum: true, gain: 0.55, bus: S.barramentos ? 'bateria' : null }),
        hh: S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.5 }),
        ti: S.part('timpano', I.timp, { drum: true, gain: 0.25 }),
        cr: S.part('prato', I.crash, { drum: true, pan: 0.2, gain: 0.6 }),
        cl: S.part('palmas', clap, { drum: true, pan: -0.4, gain: 1, rev: 0.15 }),
        cl2: S.part('palmas2', clap.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.4, gain: 1, rev: 0.15 }),
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

/** Esboço (~29 s, 2ª versão): fanfarra (1), os nove rivais um compasso cada (9), a virada (1), o gancho em Ré (1). */
export function esboco() {
    const S = new Song({ bpm: 100, bars: 12, swing: 0.1, tail: 3 });
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
    // 1 a 9 · a temporada passa: um rival por compasso, sobre a base
    RIVAIS.forEach((r, i) => {
        const b = 1 + i;
        base(B, b, r.ac[0], r.ac[0]);
        rival(B, r, b * 16, 16);
        if (i % 3 === 0) drum(B.cr, b, 1, 'X...............', { vel: 0.7 });
    });
    // 10 · a virada em Lá7 (o V de Ré), a caixa e o apito subindo
    bass(B.bs, 10, 'A7', '0:2 0:2 3:2 5:2 0:2 0:2 3:2 5:2');
    stabs(B.br, 10, 'A7', [0, 3, 6, [8, 2], 10, [12, 4]], { low: 61, n: 3, vel: 0.8 });
    drum(B.k, 10, 1, 'X...X...X.X.X.X.');
    drum(B.sn, 10, 1, 'x...x...xxXxXXXX', { vel: 0.9 });
    B.apito.note(10 * 16 + 12, 0, 0, 0.7);
    // 11 · o gancho em Ré com tudo, e o "hey hey" dobrado de torcida
    const D = MAJOR(2);
    drum(B.cr, 11, 1, 'X...............');
    drum(B.k, 11, 1, 'X.....x...x.....');
    drum(B.ti, 11, 1, 'X...............');
    B.torcida.note(11 * 16, 2, 0, 1.2);
    mel(B.br, 11, [GANCHO.em({ tom: 2 })]);
    mel(B.br2, 11, [GANCHO.em({ tom: 2 })], { harm: thirdBelow(D) });
    mel(B.lead, 11, [GANCHO.em({ tom: 2 })]);
    for (const g of [B.cl, B.cl2]) drum(g, 11, 1, 'X..X..X.....X.X.');
    bass(B.bs, 11, 'D', '0:3 0:3 8:2 r:8');
    bass(B.tuba, 11, 'D', 'r:12 0:4');
    padChord(B.pad, 11, 'Dadd9', 16, { low: 62 });
    stabs(B.gt, 11, 'D', [2, 6], { low: 60, n: 3 });
    drum(B.cr, 11, 1, '............X...', { vel: 0.8 });
    arp(B, 11);
    return S;
}

/** O arpejo do acorde final (Ré com nona), como no fim do Campeão. */
function arp(B, b) {
    const notas = [74, 76, 78, 81, 86, 88, 90, 93];
    for (const [i, m] of notas.entries()) B.ar.note(b * 16 + 12 + i * 0.5, m, 1, 0.6);
}

/**
 * A faixa inteira (~2:26, 61 compassos a 100 BPM; 2ª versão: três compassos por rival, pedido do Miguel em 16/11):
 *   0-3   · o apito final (curto, curto, longo), a torcida explode, a fanfarra do Campeão e a torcida responde
 *   4-11  · a festa: o funk com o SOC-CER-MON no baixo; os metais cantam a fanfarra, a torcida responde com o gancho
 *   12-38 · a temporada passando: os nove rivais, três compassos cada (o motivo em 2, no timbre e com a assinatura
 *           de cada um, sobre a base; e 1 de resposta da torcida ou dos metais)
 *   39-40 · a sombra do Giovanni: o chão treme, a banda some, sobra a torcida batendo o 3-3-2 sozinha, crescendo
 *   41    · a virada: Lá7, caixa e o apito subindo
 *   42-49 · sobe um tom (Ré): o REFRÃO novo (rodada 2), com o gancho de etiqueta no fim de cada frase e o iv menor
 *   50-57 · os cumprimentos: a banda abre espaço e cada rival cumprimenta o campeão com a assinatura; volta crescendo
 *   58    · a virada: Si♭7, o SOC-CER-MON na caixa
 *   59-62 · sobe mais meio tom (Mi♭): a 2ª metade do refrão com tudo
 *   63-65 · o fim do Campeão em Mi♭: nona nos metais, o arpejo, prato e tímpano, e a torcida
 */
export default function socCerMon() {
    const S = new Song({ bpm: 100, bars: 66, swing: 0.1, tail: 5, barramentos: { bateria: BATERIA } });
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
    // 12-38 · os nove rivais, três compassos cada: o motivo inteiro (2) e uma resposta curta (1) pro próximo
    // entrar respirando. A resposta alterna: a torcida canta o SOC-CER-MON (no modo do rival), ou os metais repetem o
    // começo do motivo dele, como quem comenta; no fim dela, Sol7 e a caixa levam pro próximo.
    RIVAIS.forEach((r, i) => {
        const b = 12 + 3 * i;
        const menor = !['erika', 'sabrina'].includes(r.nome);
        const ton = menor ? 'Cm' : 'C';
        base(B, b, r.ac[0], r.ac[0], { palmas: false });
        base(B, b + 1, r.ac[1], r.ac[1], { palmas: false });
        base(B, b + 2, ton, 'G7', { palmas: false });
        rival(B, r, b * 16, 32);
        if (i % 2 === 0) {
            const g = GANCHO.em({ menor });
            mel(B.br, b + 2, [g], { vel: 0.8 });
            mel(B.br2, b + 2, [g], { harm: thirdBelow(menor ? MINOR(0) : C), vel: 0.6 });
            palmas(b + 2, GANCHO.palmas, 0.9);
        } else {
            frase(B.br2, (b + 2) * 16, r.m[0], { shift: r.s - 12, k: r.k ?? 1, ate: 8 / (r.k ?? 1), vel: 0.8 });
            palmas(b + 2, '............x.x.', 0.7);
        }
        drum(B.sn, b + 2, 1, '............ooxX', { vel: 0.6 });
        if (i % 3 === 0) drum(B.cr, b, 1, 'X...............', { vel: 0.6 });
    });
    // 39-40 · a sombra do Giovanni: o chão treme, sobra a torcida no 3-3-2, crescendo
    B.tremor.note(39 * 16, 0, 0, 1);
    bass(B.tuba, 39, 'Cm', '0:16', { vel: 0.8 });
    bass(B.bs, 39, 'Cm', '0:3 0:3 8:2 r:8', { vel: 0.7 });
    bass(B.bs, 40, 'Cm', '0:3 0:3 8:2 0:3 0:3 8:2');
    palmas(39, 'X..X..X.........', 0.6);
    palmas(40, 'X..X..X.X..X..X.', 0.9);
    B.torcida.note(40 * 16, 0, 0, 0.9);
    drum(B.k, 40, 1, 'X..X..X.X..X..X.');
    // 41 · a virada: Lá7 (o V de Ré), caixa e o apito subindo
    bass(B.bs, 41, 'A7', '0:2 0:2 3:2 5:2 0:2 0:2 3:2 5:2');
    stabs(B.br, 41, 'A7', [0, 3, 6, [8, 2], 10, [12, 4]], { low: 61, n: 3, vel: 0.8 });
    drum(B.sn, 41, 1, 'x...x...xxXxXXXX', { vel: 0.9 });
    drum(B.k, 41, 1, 'X...X...X.X.X.X.');
    B.apito.note(41 * 16 + 12, 0, 0, 0.8);
    // 42-49 · Ré: o REFRÃO da faixa (rodada 2: a faixa-título ganha uma melodia própria, e o gancho vira a
    // etiqueta no fim de cada frase); o baixo continua no SOC-CER-MON; o iv menor (Sol menor com sexta) no 7º compasso
    const REFRAO = [
        ['D', 'D', 'F#5:2 A5:2 D6:3 C#6:1 B5:2 A5:2 F#5:4'],
        ['Bm7', 'Bm7', 'D5:2 F#5:2 B5:3 A5:1 F#5:2 D5:2 E5:4'],
        ['G', 'G', 'G5:3 G5:3 B5:2 D6:4 C#6:2 B5:2'],
        ['A7', 'A7', GANCHO.em({ tom: 2 })],
        ['D', 'D', 'F#5:2 A5:2 D6:3 C#6:1 B5:2 A5:2 F#5:4'],
        ['Bm7', 'Bm7', 'D5:2 F#5:2 B5:3 C#6:1 D6:2 E6:2 F#6:4'],
        ['G', 'Gm6', 'G6:3 F#6:3 E6:2 D6:4 Bb5:4'],
        ['A7', 'A7', GANCHO.em({ tom: 2 })],
    ];
    const refrao = (b0, s) =>
        REFRAO.forEach(([c1, c2, m], i) => {
            const b = b0 + i;
            base(B, b, transpose(c1, s), transpose(c2, s), { palmas: false });
            padChord(B.pad, b, transpose(c1, s), 16, { low: 57, vel: 0.5 });
            mel(B.br, b, [m], { shift: s });
            mel(B.lead, b, [m], { shift: s, vel: 0.7 });
            mel(B.br2, b, [m], { shift: s - 12, harm: thirdBelow(MAJOR(2 + s)), vel: 0.8 });
            if (i % 4 === 3) palmas(b, GANCHO.palmas, 0.9);
        });
    refrao(42, 0);
    drum(B.cr, 42, 1, 'X...............');
    drum(B.cr, 46, 1, 'X...............');
    B.torcida.note(42 * 16, 2, 0, 1);
    // 50-57 · os cumprimentos: a banda abre espaço (só bumbo, chimbal e baixo), cada rival cumprimenta o campeão com
    // a assinatura dele, um por compasso, a fanfarra em Ré responde; na 2ª metade a banda volta crescendo
    const RE = [
        ['D', 'D'],
        ['Bm7', 'Bm7'],
        ['G', 'A7'],
        ['D', 'A7'],
    ];
    for (let i = 0; i < 8; i++) {
        const b = 50 + i;
        const [c1, c2] = RE[i % 4];
        if (i < 4) {
            drum(B.k, b, 1, 'X.......X.......');
            drum(B.hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
            bass(B.bs, b, c1, '0:3 0:3 8:2 r:8');
            bass(B.bs, b, c2, 'r:8 0:3 0:3 8:2');
            padChord(B.pad, b, c1, 16, { low: 57, vel: 0.4 });
        } else {
            base(B, b, c1, c2, { palmas: i === 7 });
            padChord(B.pad, b, c1, 16, { low: 57, vel: 0.6 });
        }
    }
    const M2 = ['D5:2 D5:1 D5:1 A5:4 G5:2 F#5:1 G5:1 A5:4', 'B5:2 B5:1 B5:1 C#6:2 C#6:1 C#6:1 D6:8'];
    mel(B.br, 51, [M2[0]], { vel: 0.8 });
    mel(B.br, 55, [M2[1]], { vel: 0.9 });
    mel(B.br2, 55, [M2[1]], { shift: -12, harm: thirdBelow(D), vel: 0.7 });
    drum(B.cr, 54, 1, 'X...............');
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
        const t = (50 + i) * 16 + 14;
        if (p == null) for (const m of [62, 66, 69, 72]) P.note(t, m, 1, 0.7);
        else P.note(t, p, 0, 0.8);
    });
    // 58 · a virada: Si♭7 (o V de Mi♭), o SOC-CER-MON na caixa e nos toms, o apito
    bass(B.bs, 58, 'Bb7', '0:2 0:2 3:2 5:2 0:2 0:2 3:2 5:2');
    stabs(B.br2, 58, 'Bb7', [0, 3, 6, [8, 2], 10, [12, 4]], { low: 50, n: 3, vel: 0.8 });
    drum(B.sn, 58, 1, 'X..X..X.xxXxXXXX', { vel: 0.9 });
    drum(B.k, 58, 1, 'X..X..X.X.X.X.X.');
    drum(B.ti, 58, 1, '........X.X.XXXX', { pitch: 1 });
    B.apito.note(58 * 16 + 12, 0, 0, 0.8);
    // 59-62 · sobe mais meio tom (Mi♭): a 2ª metade do refrão com tudo, a torcida
    REFRAO.slice(4).forEach(([c1, c2, m], i) => {
        const b = 59 + i;
        base(B, b, transpose(c1, 1), transpose(c2, 1), { palmas: false });
        padChord(B.pad, b, transpose(c1, 1), 16, { low: 58, vel: 0.6 });
        mel(B.br, b, [m], { shift: 1 });
        mel(B.lead, b, [m], { shift: 13, vel: 0.5 });
        mel(B.br2, b, [m], { shift: -11, harm: thirdBelow(MAJOR(3)), vel: 0.85 });
        mel(B.tuba, b, [m], { shift: -23, vel: 0.5 });
    });
    palmas(62, GANCHO.palmas, 1.1);
    drum(B.cr, 59, 1, 'X...............');
    B.torcida.note(59 * 16, 3, 0, 1.2);
    // 63-65 · o fim do Campeão, em Mi♭
    mel(B.br, 63, ['Eb6:16', 'Eb6:12 r:4']);
    mel(B.br2, 63, ['Bb4:16', 'Bb4:12 r:4']);
    mel(B.lead, 63, ['r:8 G6:2 Bb6:2 Eb7:4', GANCHO.em({ tom: 3 })]);
    palmas(64, 'X..X..X.....X.X.', 1);
    bass(B.tuba, 63, 'Eb', '0:16');
    bass(B.bs, 63, 'Eb', '0:3 0:3 8:2 r:8');
    padChord(B.pad, 63, 'Ebadd9', 48, { low: 63 });
    drum(B.cr, 63, 1, 'X.......X.......');
    drum(B.ti, 63, 1, 'X...............', { pitch: 1 });
    drum(B.k, 63, 1, 'X...............');
    B.torcida.note(63 * 16, 3, 0, 1.2);
    for (const b of [63, 64]) {
        const notas = [75, 77, 79, 82, 87, 89, 91, 94];
        for (let r = 0; r < 16; r++) B.ar.note(b * 16 + r, notas[r % 8], 1, b === 63 ? 0.8 : 0.5);
    }
    drum(B.cr, 65, 1, 'X...............');
    drum(B.ti, 65, 1, 'X...............', { pitch: 1 });
    bass(B.tuba, 65, 'Eb', '0:16');
    stabs(B.br, 65, 'Eb', [[0, 8]], { low: 63, n: 3 });
    stabs(B.br2, 65, 'Eb', [[0, 8]], { low: 51, n: 3 });
    return S;
}
