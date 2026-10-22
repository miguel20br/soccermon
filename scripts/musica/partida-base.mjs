// Base das músicas de partida (rodada 5): a Partida v4 aprovada vira molde. Cada personagem (líder de ginásio, rival,
// Equipe Rocket) passa só o que muda: tom, acordes, tema, riff, timbres, levada, andamento e extras.
// Rodada 6: um arquivo por tempo ('1t' e '2t'), em trechos que fazem loop sozinhos, um por intensidade. O andamento
// sobe de trecho em trecho (o jogo troca na virada do compasso conforme o minuto e a pressão):
//   1º tempo: nivel1 → nivel2 → nivel3 (16 compassos cada, loop) → fim (SOC-CER-MON com palmas + apito do intervalo)
//   2º tempo: um tom acima, nivel1 → nivel2 → nivel3 → virada (1 compasso) → pressao (meio tom acima, loop) → fim
// Cada nível: o tema duas vezes; na 2ª, se o personagem tem tema próprio (`cita`), os compassos 13 a 16 citam o
// motivo dele (o lead pergunta, os metais respondem uma oitava abaixo).
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    layer,
    MAJOR,
    MINOR,
    mel,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from './synth.mjs';

export const V4 = {
    barLen: 16,
    swing: 0.06,
    swingUnit: 16,
    bpm: { start1: 120, end1: 136, start2: 124, end2: 142 },
    shift: { half2: 2, press: 3 },
    chords: ['Am7', 'Am7', 'D7', 'D7', 'Fmaj7', 'G7', 'Em7', 'E7b9'],
    // riff nos compassos com número (transposição), acordes curtos nos `null`
    riff: 'A4:1 A4:1 r:1 C5:1 r:1 D5:2 E5:1 r:2 G5:1 E5:2 D5:1 C5:1 A4:1',
    riffShift: [0, 0, 5, 5, null, null, null, null],
    theme: [
        'E5:2 E5:1 E5:1 G5:2 A5:2 r:2 G5:1 E5:1 D5:2 C5:2',
        'D5:3 C5:3 A4:2 r:4 C5:2 D5:2',
        'F#5:2 F#5:1 F#5:1 A5:2 C6:2 r:2 A5:1 F#5:1 E5:2 D5:2',
        'E5:3 D5:3 C5:2 r:4 D5:2 E5:2',
        'A5:2 A5:1 A5:1 C6:2 E6:2 r:2 C6:2 A5:2 F5:2',
        'B5:2 B5:1 B5:1 D6:2 F6:2 r:2 D6:2 B5:2 G5:2',
        'G5:3 E5:3 B4:2 D5:2 E5:2 G5:2 B5:2',
        'G#5:4 F5:4 D5:4 B4:4',
    ],
    tonic: 9, // classe de nota do tom (Lá)
    minor: true,
    hook: { tom: -3, menor: true },
    inst: {
        lead: I.lead,
        riff: I.clav,
        bass: I.slap,
        chank: I.chank,
        horns: I.brass,
        harm: I.pulse,
        strings: I.strings,
        perc: I.agogo,
        arp: I.arp,
    },
    gain: { lead: 1, riff: 1, bass: 0.95, chank: 3, snare: 1.1, hat: 1.6, horns: 0.9, harm: 0.6, strings: 1.1 },
    pat: {
        kick: 'X.....x...X.....',
        kickHot: 'X.....x.X.x...x.',
        snare: '....X..o.o..X..o',
        hat: 'xoxoxoxoxoxoxoxo',
        hatHot: 'xxXxxxXxxxXxxxXx',
        bass: '0:1 r:1 8:1 0:1 r:2 0:1 8:1 r:1 0:1 s:1 8:1 r:1 5:1 3:1 0:1',
        chankRows: [2, 6, 9, 14],
        riffStabRows: [0, 3, 6, 10, 12],
        perc: [
            ['x..x..x...x.x...', 0],
            ['....x......x..x.', -5],
        ],
        ohat: '......x.......x.',
        tom: '..........x.x.x.',
        hornRows: [
            [3, 1],
            [6, 2],
            [14, 1],
        ],
        crash: 'X...............',
        fill1: '........xxxxXXXX',
        fill2: 'xxxxxxxxXXXXXXXX',
        whistle: 'x...............',
        intervaloBass: '0:6 r:10',
        intervaloWhistle: '........x.......',
        endBass: '0:16',
        hookRitmo: [3, 3, 6, 4],
        palmas: GANCHO.palmas,
    },
    cita: null, // { mel: [2 compassos], acordes: [2 acordes] } no tom do 1º tempo: o motivo do tema do personagem
    extra: null, // (S, ctx) => { ... } pra percussão ou timbre próprio do personagem
};

const N = 16; // compassos por nível

/** As duas metades da partida: { '1t': Song, '2t': Song }. */
export function partidaBase(cfg = {}) {
    const c = {
        ...V4,
        ...cfg,
        bpm: { ...V4.bpm, ...cfg.bpm },
        shift: { ...V4.shift, ...cfg.shift },
        inst: { ...V4.inst, ...cfg.inst },
        gain: { ...V4.gain, ...cfg.gain },
        pat: { ...V4.pat, ...cfg.pat },
    };
    return { '1t': tempo(c, 1), '2t': tempo(c, 2) };
}

function tempo(c, t) {
    const { pat, bpm: T } = c;
    const n = c.barLen;
    const [a, z] = t === 1 ? [T.start1, T.end1] : [T.start2, T.end2];
    const sh0 = t === 1 ? 0 : c.shift.half2;
    // trechos: [nome, nível (1 a 4; 0 = virada, -1 = fim), bpm, compassos, subida de tom]
    const plan = [
        ['nivel1', 1, a, N, sh0],
        ['nivel2', 2, Math.round((a + z) / 2), N, sh0],
        ['nivel3', 3, z, N, sh0],
        ...(t === 2
            ? [
                  ['virada', 0, z + 2, 1, c.shift.press],
                  ['pressao', 4, z + 2, N, c.shift.press],
              ]
            : []),
        ['fim', -1, t === 1 ? z : z + 2, 3, t === 1 ? 0 : c.shift.press],
    ];
    let de = 0;
    const secs = plan.map(([nome, nivel, bpm, len, sh]) => {
        const x = { nome, nivel, bpm, de, len, sh };
        de += len;
        return x;
    });
    const END = de;
    const secAt = (b) => secs.findLast((x) => x.de <= b);
    const S = new Song({
        bpm: a,
        bars: END,
        barLen: n,
        swing: c.swing,
        swingUnit: c.swingUnit,
        tail: 3,
        bpmAt: (b) => secAt(Math.min(b, END - 1)).bpm,
        secoes: secs.map((x) => ({
            nome: x.nome,
            de: x.de,
            loop: x.nivel > 0,
            ...(x.nivel > 0 && { intensidade: x.nivel }),
        })),
    });
    const L = (from, to) => layer(S, from, to);
    const lead = S.part('lead', c.inst.lead, { pan: -0.1, gain: c.gain.lead, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const riff = S.part('riff', c.inst.riff, { pan: 0.35, gain: c.gain.riff });
    const bs = S.part('slap', c.inst.bass, { gain: c.gain.bass });
    const ch = S.part('chank', c.inst.chank, { pan: -0.35, gain: c.gain.chank });
    const k = S.part('kick', I.kick, { drum: true });
    const sn = S.part('snare', I.snare, { drum: true, gain: c.gain.snare });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.3, gain: c.gain.hat });
    const oh = S.part('ohat', I.ohat, { drum: true, pan: 0.3 });
    const ag = S.part('agogo', c.inst.perc, { drum: true, pan: -0.3, gain: c.gain.perc ?? 1 });
    const ar = S.part('arp', c.inst.arp, { pan: 0.5, echo: { rows: 3, fb: 0.25, mix: 0.25 } });
    const horns = S.part('horns', c.inst.horns, { pan: 0.2, gain: c.gain.horns });
    const harm = S.part('harm', c.inst.harm, { pan: 0.3, gain: c.gain.harm });
    const str = S.part('strings', c.inst.strings, { gain: c.gain.strings });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });
    const tm = S.part('tom', I.tom, { drum: true });
    const wh = S.part('whistle', I.whistle, { drum: true, pan: -0.2, gain: 1.5 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 2.4, rev: 0.12 });

    const scale = (sh) => (c.minor ? MINOR : MAJOR)((c.tonic + sh) % 12);
    for (const x of secs) {
        const { nivel, sh, de: b0 } = x;
        if (nivel < 1) continue;
        const hot = nivel >= 3;
        for (let j = 0; j < N; j++) {
            const b = b0 + j;
            const i = j % 8;
            const segunda = j >= 8;
            const cita = c.cita && segunda && i >= 4; // compassos 13 a 16: o motivo do personagem
            const ch8 = cita ? transpose(c.cita.acordes[i % 2], sh) : transpose(c.chords[i], sh);
            drum(k, b, 1, hot ? pat.kickHot : pat.kick);
            drum(sn, b, 1, pat.snare);
            drum(hh, b, 1, hot ? pat.hatHot : pat.hat);
            bass(bs, b, ch8, pat.bass);
            stabs(ch, b, ch8, pat.chankRows, { low: 60, n: 3 });
            if (!cita && c.riff && c.riffShift[i] != null) mel(riff, b, [c.riff], { shift: sh + c.riffShift[i] });
            else stabs(riff, b, ch8, pat.riffStabRows, { low: 64, n: 3 });
            if (nivel >= 2 || j >= 4) {
                for (const [p, pitch] of pat.perc) drum(ag, b, 1, p, { pitch });
                arp(ar, b, ch8, { low: 64, step: hot ? 1 : 2, rows: n });
            }
            if (cita && i < 6) mel(lead, b, [c.cita.mel[i - 4]], { shift: sh });
            else if (cita) mel(horns, b, [c.cita.mel[i - 6]], { shift: sh - 12, vel: 1.2 });
            else mel(lead, b, [c.theme[i]], { shift: sh });
            if (!cita && (t === 2 || (nivel >= 2 && segunda)))
                mel(harm, b, [c.theme[i]], { shift: sh, harm: thirdBelow(scale(sh)) });
            if (hot || (nivel === 2 && segunda)) {
                drum(oh, b, 1, pat.ohat);
                padChord(str, b, ch8, n, { low: 60, n: 4 });
            }
            if (hot && !(cita && i >= 6)) stabs(horns, b, ch8, pat.hornRows, { low: 62, n: 3 });
            if (j % 4 === 3) drum(tm, b, 1, pat.tom, { pitch: 4 });
            if (j % 8 === 0) drum(cr, b, 1, pat.crash);
        }
        if (hot) drum(sn, b0 + N - 1, 1, pat.fill1);
        if (nivel === 4) drum(sn, b0 + 7, 1, pat.fill1);
    }
    // virada pra pressão (2º tempo): o V7 do tom novo, caixa rufando e apito subindo
    const vir = secs.find((x) => x.nome === 'virada');
    if (vir) {
        const v7 = transpose(c.chords[7], vir.sh);
        bass(bs, vir.de, v7, pat.bass);
        stabs(horns, vir.de, v7, pat.hornRows, { low: 62, n: 3 });
        drum(k, vir.de, 1, pat.kickHot);
        drum(sn, vir.de, 1, pat.fill2);
        drum(wh, vir.de, 1, pat.whistle);
    }
    // fim do tempo: SOC-CER-MON nos metais, a torcida responde batendo palma; depois o apito (intervalo) ou o acorde final
    const f = secs.at(-1);
    const tonica = transpose(c.chords[0], f.sh);
    for (const b of [f.de, f.de + 1]) {
        mel(horns, b, [GANCHO.em({ ...c.hook, tom: c.hook.tom + f.sh, ritmo: pat.hookRitmo })]);
        drum(gang, b, 1, pat.palmas);
        drum(k, b, 1, pat.kickHot);
        drum(hh, b, 1, pat.hatHot);
        bass(bs, b, tonica, pat.bass);
        stabs(ch, b, tonica, pat.chankRows, { low: 60, n: 3 });
        padChord(str, b, tonica, n, { low: 60, n: 4 });
    }
    drum(cr, f.de, 1, pat.crash);
    drum(sn, f.de + 1, 1, t === 1 ? pat.fill1 : pat.fill2);
    const last = f.de + 2;
    const acorde = t === 1 ? transpose(c.chords[7], f.sh) : tonica;
    stabs(horns, last, acorde, [[0, t === 1 ? 6 : Math.round((n * 3) / 4)]], { low: 62 });
    bass(bs, last, acorde, t === 1 ? pat.intervaloBass : pat.endBass);
    drum(k, last, 1, pat.crash);
    drum(cr, last, 1, pat.crash);
    if (t === 1) drum(wh, last, 1, pat.intervaloWhistle);
    else padChord(str, last, acorde, n, { low: 60, n: 4 });
    c.extra?.(S, { END, L, chords: c.chords, secs });
    return S;
}
