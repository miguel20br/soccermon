import { afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { ganchosDe, ritmoDe } from './ganchos.mjs';
// @ts-expect-error módulo .mjs sem tipos
import { GANCHO, I, MAJOR, mel, Song, thirdBelow } from './synth.mjs';

Song.recording = true;
afterAll(() => {
    Song.recording = false;
});

describe('mapa do SOC-CER-MON (ganchos.mjs)', () => {
    it('acha as 3 batidas do GANCHO em qualquer tom, com swing, na intro e no loop, e ignora melodia parecida', () => {
        // 120 BPM: linha = 0,125 s, compasso = 2 s; swing 0,1 atrasa a semicolcheia ímpar (a 2ª batida, linha 3)
        const S = new Song({ bpm: 120, bars: 4, swing: 0.1, loopFrom: 1 });
        const lead = S.part('lead', I.lead);
        const harm = S.part('harm', I.counter);
        mel(lead, 0, [GANCHO.bar, 'G5:4 E5:4 C6:8', GANCHO.em({ tom: 5, menor: true }), 'B5:3 G5:3 D6:2 r:8']);
        mel(harm, 0, [GANCHO.bar], { harm: thirdBelow(MAJOR(0)) }); // segunda voz junto: o mesmo gancho
        const hits = ganchosDe(S);
        const row = 0.125;
        // compasso 0 (intro) e compasso 2 (loop, que começa em 2 s no arquivo)
        const want = [
            [0, 3.1 * row, 6 * row],
            [4, 4 + 3.1 * row, 4 + 6 * row],
        ];
        expect(hits).toHaveLength(2);
        for (const [i, t] of hits.flat().entries()) expect(t).toBeCloseTo(want.flat()[i], 2);
    });

    it('acha o gancho aumentado (6-6-4) e no 12/8', () => {
        const S = new Song({ bpm: 90, bars: 2, barLen: 12 });
        mel(S.part('met', I.brass), 1, [GANCHO.em({ menor: true, ritmo: [3, 3, 4, 2] })]);
        const A = new Song({ bpm: 100, bars: 1 });
        mel(A.part('met', I.brass), 0, [GANCHO.em({ tom: 3, ritmo: [6, 6, 4, 0] })]);
        const row = 15 / 90;
        expect(ganchosDe(S)[0]).toEqual([12 * row, 15 * row, 18 * row].map((t) => Math.round(t * 1000) / 1000));
        expect(ganchosDe(A)).toEqual([[0, 0.9, 1.8]]);
    });

    it('grava swing e as mudanças de andamento dentro do trecho', () => {
        const S = new Song({ bpm: 120, bars: 4, swing: 0.1, loopFrom: 0, bpmAt: (b: number) => (b === 2 ? 60 : 120) });
        S.part('lead', I.lead);
        expect(ritmoDe(S)).toEqual({
            swing: 0.1,
            swingEm: 16,
            tempos: [
                [4, 60],
                [8, 120],
            ],
        });
    });
});
