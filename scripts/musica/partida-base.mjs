// Base das músicas de partida (rodada 5): a Partida v4 aprovada vira molde. Cada personagem (líder de ginásio, rival,
// Equipe Rocket) passa só o que muda: tom, acordes, tema, riff, timbres, levada, andamento e extras. A forma fica:
// 1º tempo acelerando, apito do intervalo, 2º tempo um tom acima acelerando, pressão final meio tom acima, o gancho
// SOC-CER-MON nos metais com as palmas respondendo no fim de cada tempo. Sem `cfg`, sai a Partida v4 idêntica.
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
    bpm: { start1: 120, end1: 136, intervalo: 120, start2: 124, end2: 142 },
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
    extra: null, // (S, ctx) => { ... } pra percussão ou timbre próprio do personagem
};

const HALF2 = 21;
const PRESS = 36;
const END = 42;

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
    const { pat, bpm: T } = c;
    const n = c.barLen;
    const bpmAt = (b) => {
        if (b < 20) return T.start1 + ((T.end1 - T.start1) * b) / 19;
        if (b < HALF2) return T.intervalo;
        if (b < END) return T.start2 + ((T.end2 - T.start2) * (b - HALF2)) / (END - 1 - HALF2);
        return T.end2;
    };
    const S = new Song({
        bpm: T.start1,
        bars: END + 1,
        barLen: n,
        swing: c.swing,
        swingUnit: c.swingUnit,
        tail: 3,
        bpmAt,
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
    const ag = S.part('agogo', c.inst.perc, { drum: true, pan: -0.3, gain: c.gain.perc ?? 1, gainAt: L(4) });
    const ar = S.part('arp', c.inst.arp, { pan: 0.5, echo: { rows: 3, fb: 0.25, mix: 0.25 }, gainAt: L(4) });
    const horns = S.part('horns', c.inst.horns, { pan: 0.2, gain: c.gain.horns });
    const harm = S.part('harm', c.inst.harm, { pan: 0.3, gain: c.gain.harm, gainAt: L(HALF2) });
    const str = S.part('strings', c.inst.strings, { gain: c.gain.strings });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });
    const tm = S.part('tom', I.tom, { drum: true });
    const wh = S.part('whistle', I.whistle, { drum: true, pan: -0.2, gain: 1.5 });
    const gang = S.part('palmas', I.clap, { drum: true, gain: 2 });

    const scale = (sh) => (c.minor ? MINOR : MAJOR)((c.tonic + sh) % 12);
    const shiftOf = (b) => (b >= PRESS ? c.shift.press : b >= HALF2 ? c.shift.half2 : 0);
    const pos = (b) => (b < HALF2 ? b % 8 : (b - HALF2) % 8);
    const hot = (b) => (b >= 14 && b < 20) || b >= PRESS - 2;

    for (let b = 0; b < END; b++) {
        if (b === 20) continue;
        const i = pos(b);
        const sh = shiftOf(b);
        const ch8 = transpose(c.chords[i], sh);
        drum(k, b, 1, hot(b) ? pat.kickHot : pat.kick);
        drum(sn, b, 1, pat.snare);
        drum(hh, b, 1, hot(b) ? pat.hatHot : pat.hat);
        bass(bs, b, ch8, pat.bass);
        stabs(ch, b, ch8, pat.chankRows, { low: 60, n: 3 });
        if (c.riff && c.riffShift[i] != null) mel(riff, b, [c.riff], { shift: sh + c.riffShift[i] });
        else stabs(riff, b, ch8, pat.riffStabRows, { low: 64, n: 3 });
        if (b >= 4) {
            for (const [p, pitch] of pat.perc) drum(ag, b, 1, p, { pitch });
            arp(ar, b, ch8, { low: 64, step: hot(b) ? 1 : 2, rows: n });
        }
        mel(lead, b, [c.theme[i]], { shift: sh });
        if (b >= HALF2) mel(harm, b, [c.theme[i]], { shift: sh, harm: thirdBelow(scale(sh)) });
        if (hot(b)) {
            stabs(horns, b, ch8, pat.hornRows, { low: 62, n: 3 });
            drum(oh, b, 1, pat.ohat);
            padChord(str, b, ch8, n, { low: 60, n: 4 });
        }
        if (b % 4 === 3) drum(tm, b, 1, pat.tom, { pitch: 4 });
        if ([0, 8, 14, HALF2, 29, PRESS].includes(b)) drum(cr, b, 1, pat.crash);
    }
    // SOC-CER-MON nos metais, as palmas respondem: fim de cada tempo
    for (const [b, sh] of [
        [18, 0],
        [19, 0],
        [40, c.shift.press],
        [41, c.shift.press],
    ]) {
        mel(horns, b, [GANCHO.em({ ...c.hook, tom: c.hook.tom + sh, ritmo: pat.hookRitmo })]);
        drum(gang, b, 1, pat.palmas);
    }
    drum(sn, 19, 1, pat.fill1);
    drum(sn, 41, 1, pat.fill2);
    drum(sn, PRESS - 1, 1, pat.fill1);
    drum(wh, PRESS - 1, 1, pat.whistle);
    const intervalo = c.chords[7];
    stabs(horns, 20, intervalo, [[0, 6]], { low: 62 });
    bass(bs, 20, intervalo, pat.intervaloBass);
    drum(k, 20, 1, pat.crash);
    drum(wh, 20, 1, pat.intervaloWhistle);
    const fim = transpose(c.chords[0], c.shift.press);
    stabs(horns, END, fim, [[0, Math.round((n * 3) / 4)]], { low: 62 });
    bass(bs, END, fim, pat.endBass);
    drum(k, END, 1, pat.crash);
    drum(cr, END, 1, pat.crash);
    padChord(str, END, fim, n, { low: 60, n: 4 });
    c.extra?.(S, { hot, shiftOf, pos, HALF2, PRESS, END, L, chords: c.chords });
    return S;
}
