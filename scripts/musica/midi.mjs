// Exporta as peças de scripts/musica/pecas/ para MIDI (SMF formato 1, 480 PPQ).
//   node scripts/musica/midi.mjs [peça ...] [--out pasta]     (npm run midi → ~/Música/soccermon-midi)
// As notas vêm do gravador do Song (`Song.recording`), antes da síntese: linha, nota, duração, velocidade.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { I, Song } from './synth.mjs';

export const PPQ = 480;
const ROW = PPQ / 4; // uma linha = semicolcheia

/** Quantidade variável (VLQ). */
const vlq = (n) => {
    const b = [n & 0x7f];
    for (let r = n >> 7; r; r >>= 7) b.unshift((r & 0x7f) | 0x80);
    return b;
};
const u32 = (n) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const str = (s) => [...Buffer.from(s, 'utf8')];

/** SMF formato 1. `tracks`: lista de eventos { tick, data: bytes } por faixa; ordem estável no mesmo tick (off antes de on). */
export function smf(tracks) {
    const chunks = tracks.map((evs) => {
        let last = 0;
        const body = [...evs]
            .map((e, i) => ({ ...e, i, ord: (e.data[0] & 0xf0) === 0x80 ? 0 : (e.data[0] & 0xf0) === 0x90 ? 2 : 1 }))
            .sort((a, b) => a.tick - b.tick || a.ord - b.ord || a.i - b.i)
            .flatMap((e) => {
                const d = vlq(e.tick - last);
                last = e.tick;
                return [...d, ...e.data];
            });
        body.push(0, 0xff, 0x2f, 0);
        return [...str('MTrk'), ...u32(body.length), ...body];
    });
    return Buffer.from([...str('MThd'), ...u32(6), 0, 1, 0, tracks.length, PPQ >> 8, PPQ & 255, ...chunks.flat()]);
}

const meta = (type, bytes) => [0xff, type, ...vlq(bytes.length), ...bytes];

// General MIDI: programa (0-based) dos melódicos
const PROGRAM = {
    lead: 80,
    pulse: 80,
    thin: 80,
    arp: 80,
    counter: 73,
    bass: 38,
    slap: 36,
    stab: 62,
    chank: 28,
    clav: 7,
    pad: 89,
    strings: 48,
    brass: 61,
    tuba: 58,
    piccolo: 72,
    pizz: 45,
    bassoon: 70,
    bell: 9,
    epiano: 4,
    organ: 16,
    anvil: 115,
    coin: 11,
    whistle: 78,
    whistleDown: 78,
};
// bateria: nota GM (canal 10); tom e agogô escolhem pela afinação (`pitch`, em semitons)
const DRUM = {
    kick: 36,
    snare: 38,
    clap: 39,
    clap808: 39,
    palmas: 39,
    hat: 42,
    ohat: 46,
    shaker: 70,
    sleigh: 83,
    crash: 49,
    block: 76,
    timp: 41,
    tom: (p) => (p >= 7 ? 50 : p >= 3 ? 48 : p >= -1 ? 45 : p >= -4 ? 43 : 41),
    agogo: (p) => (p < -2 ? 68 : 67),
};
// timbre feito na peça (fora da paleta `I`): o nome da faixa decide
const POR_NOME = [
    [/baix/, 38],
    [/slap/, 36],
    [/metais|brass/, 61],
    [/clav/, 7],
    [/assovio/, 78],
    [/trombone|bocejo/, 57],
    [/placar|flip/, 9],
];
export const GM = { PROGRAM, DRUM };
const nameOf = new Map(Object.entries(I).map(([k, v]) => [v, k]));

/** Song gravado → Buffer .mid. */
export function songToMidi(song, title = '') {
    const { barLen } = song;
    const tickOf = (t) => {
        const b = Math.floor(t / barLen);
        return Math.round((b * barLen + (song.sec(t) - song.timeOfBar(b)) / song.rowAt(b)) * ROW);
    };
    // compasso: barLen linhas de 1/16 → n/16 (16 = 4/4, 12 = 6/8, 8 = 2/4, 6 = 3/8)
    const [num, den] = { 16: [4, 4], 12: [6, 8], 8: [2, 4], 6: [3, 8] }[barLen] ?? [barLen, 16];
    const conductor = [
        { tick: 0, data: meta(0x03, str(title || 'soccermon')) },
        { tick: 0, data: meta(0x58, [num, Math.log2(den), 24, 8]) },
    ];
    let prev = 0;
    for (let b = 0; b < song.bars; b++) {
        const bpm = song.bpmAt ? song.bpmAt(b) : song.bpm;
        if (bpm !== prev)
            conductor.push({ tick: b * barLen * ROW, data: meta(0x51, u32(Math.round(6e7 / bpm)).slice(1)) });
        prev = bpm;
    }
    conductor.push({ tick: song.bars * barLen * ROW, data: meta(0x06, str('fim')) });
    const tracks = [conductor];
    let ch = 0;
    for (const p of song.parts) {
        const key = nameOf.get(p.inst);
        const dr = DRUM[key] ?? (p.drum || typeof p.inst === 'function' ? 39 : null);
        if (ch === 9) ch++; // pula o canal 10
        const c = dr != null ? 9 : ch++;
        const evs = [{ tick: 0, data: meta(0x03, str(p.name)) }];
        if (dr == null)
            evs.push({ tick: 0, data: [0xc0 | c, PROGRAM[key] ?? POR_NOME.find(([r]) => r.test(p.name))?.[1] ?? 80] });
        for (const [t, m, len, vel] of p.rec ?? []) {
            const note = dr == null ? m : typeof dr === 'function' ? dr(m) : dr;
            const v = Math.min(127, Math.max(1, Math.round(vel * 88)));
            const on = tickOf(t);
            const off = on + (dr != null ? ROW / 2 : Math.max(1, Math.round(len * ROW)));
            evs.push({ tick: on, data: [0x90 | c, note, v] }, { tick: off, data: [0x80 | c, note, 0] });
        }
        tracks.push(evs);
    }
    return smf(tracks);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    const oi = args.indexOf('--out');
    const OUT = oi >= 0 ? args[oi + 1] : join(homedir(), 'Música', 'soccermon-midi');
    const dir = new URL('./pecas/', import.meta.url);
    const all = readdirSync(dir)
        .filter((f) => f.endsWith('.mjs'))
        .map((f) => f.replace(/\.mjs$/, ''));
    const names = args.filter((a, i) => !a.startsWith('--') && i !== oi + 1);
    const todo = names.length ? names : all;
    mkdirSync(OUT, { recursive: true });
    Song.recording = true;
    for (const name of todo) {
        const mod = await import(new URL(`${name}.mjs`, dir));
        const res = mod.default();
        const songs =
            res instanceof Song
                ? { [name]: res }
                : Object.fromEntries(Object.entries(res).map(([k, v]) => [`${name}-${k}`, v]));
        for (const [file, song] of Object.entries(songs)) {
            for (const p of song.parts)
                if (!nameOf.has(p.inst) && typeof p.inst !== 'function' && !POR_NOME.some(([r]) => r.test(p.name)))
                    console.warn(`${file}/${p.name}: timbre fora da paleta, programa 80`);
            writeFileSync(join(OUT, `${file}.mid`), songToMidi(song, mod.meta?.titulo ?? file));
            console.log(`${file}.mid`);
        }
    }
}
