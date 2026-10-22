import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { PPQ, smf, songToMidi } from './midi.mjs';
// @ts-expect-error módulo .mjs sem tipos
import { drum, I, mel, Song } from './synth.mjs';

type Ev = { tick: number; type: string; ch?: number; a?: number; b?: number; bytes?: number[] };
/** leitor mínimo de SMF: devolve formato, PPQ e os eventos de cada faixa */
function parse(buf: Buffer) {
    const r = { p: 0 };
    const u32 = () => {
        r.p += 4;
        return buf.readUInt32BE(r.p - 4);
    };
    const vlq = () => {
        let v = 0;
        for (;;) {
            const b = buf[r.p++];
            v = (v << 7) | (b & 0x7f);
            if (!(b & 0x80)) return v;
        }
    };
    expect(buf.toString('latin1', 0, 4)).toBe('MThd');
    r.p = 8;
    const format = buf.readUInt16BE(r.p);
    const n = buf.readUInt16BE(r.p + 2);
    const ppq = buf.readUInt16BE(r.p + 4);
    r.p += 6;
    const tracks: Ev[][] = [];
    for (let k = 0; k < n; k++) {
        expect(buf.toString('latin1', r.p, r.p + 4)).toBe('MTrk');
        r.p += 4;
        const len = u32();
        const end = r.p + len;
        const evs: Ev[] = [];
        let tick = 0;
        while (r.p < end) {
            tick += vlq();
            const s = buf[r.p++];
            if (s === 0xff) {
                const type = buf[r.p++];
                const len = vlq();
                evs.push({ tick, type: `meta${type}`, bytes: [...buf.subarray(r.p, r.p + len)] });
                r.p += len;
            } else {
                const kind = s & 0xf0;
                const len = kind === 0xc0 ? 1 : 2;
                evs.push({
                    tick,
                    type: kind === 0x90 && buf[r.p + 1] ? 'on' : kind === 0x90 || kind === 0x80 ? 'off' : 'pc',
                    ch: s & 15,
                    a: buf[r.p],
                    b: buf[r.p + 1],
                });
                r.p += len;
            }
        }
        tracks.push(evs);
    }
    return { format, ppq, tracks };
}

describe('midi', () => {
    it('writer: cabeçalho, faixas e uma nota conhecida', () => {
        const m = parse(
            smf([
                [{ tick: 0, data: [0xff, 0x03, 1, 65] }],
                [
                    { tick: 0, data: [0x90, 60, 100] },
                    { tick: 480, data: [0x80, 60, 0] },
                ],
            ]),
        );
        expect(m.format).toBe(1);
        expect(m.ppq).toBe(480);
        expect(m.tracks).toHaveLength(2);
        expect(m.tracks[1].filter((e) => e.type === 'on')).toEqual([{ tick: 0, type: 'on', ch: 0, a: 60, b: 100 }]);
        expect(m.tracks[1].find((e) => e.type === 'off')?.tick).toBe(480);
    });

    it('Song gravado: notas, swing, bateria no canal 10 e compasso', () => {
        Song.recording = true;
        const S = new Song({ bpm: 120, bars: 1, swing: 0.5 });
        const lead = S.part('lead', I.lead);
        const k = S.part('kick', I.kick, { drum: true });
        mel(lead, 0, ['C5:2 E5:2 r:12']);
        drum(k, 0, 1, 'X.x.............');
        Song.recording = false;
        const m = parse(songToMidi(S, 'teste'));
        expect(m.tracks).toHaveLength(3);
        const ons = m.tracks[1].filter((e) => e.type === 'on');
        expect(ons.map((e) => [e.tick, e.a])).toEqual([
            [0, 72],
            [2 * (PPQ / 4), 76],
        ]);
        expect(m.tracks[2].filter((e) => e.type === 'on').map((e) => [e.ch, e.a])).toEqual([
            [9, 36],
            [9, 36],
        ]);
        expect(m.tracks[0].find((e) => e.type === 'meta88')?.bytes).toEqual([4, 2, 24, 8]);
        expect(m.tracks[0].find((e) => e.type === 'meta81')?.bytes).toEqual([7, 0xa1, 0x20]); // 500000 us
    });
});
