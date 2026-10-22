import { afterEach, describe, expect, it, vi } from 'vitest';
import { beatOf, gridOf, phaseOffset, sameTempo, swapWait, untilLine } from './music';

interface Sec {
    nome: string;
    loop: boolean;
    inicio: number;
    fim: number;
    bpm: number;
}
const LOOP: Sec[] = [{ nome: 'loop', loop: true, inicio: 2, fim: 10, bpm: 120 }];

/** AudioContext de mentira: conta fetch e decode, guarda as fontes que começaram (quando, de onde, velocidade). */
function fakeAudio(opts: { webmFails?: boolean; extra?: number; metas?: Record<string, object> } = {}) {
    const fetched: string[] = [];
    const started: { id: string; when: number; off: number; loopStart: number; rate: number; stop?: number }[] = [];
    let decodes = 0;
    const param = () => ({
        value: 1,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime() {},
        cancelScheduledValues() {},
    });
    const node = () => ({ gain: param(), connect() {} });
    const ctx = {
        state: 'running',
        currentTime: 0,
        destination: {},
        addEventListener() {},
        createGain: node,
        createBufferSource() {
            const s = {
                buffer: null as null | { id: string },
                connect() {},
                loopStart: 0,
                playbackRate: { value: 1 },
                rec: null as null | (typeof started)[number],
                stop(t: number) {
                    if (s.rec) s.rec.stop = t;
                },
                start(when: number, off = 0) {
                    s.rec = { id: s.buffer?.id ?? '', when, off, loopStart: s.loopStart, rate: s.playbackRate.value };
                    started.push(s.rec);
                },
            };
            return s;
        },
        decodeAudioData: async (raw: { ext: string; id: string }) => {
            decodes++;
            if (raw.ext === 'webm' && opts.webmFails) throw new Error('EncodingError');
            return { id: raw.id, duration: 10 + (raw.ext === 'mp3' ? (opts.extra ?? 0) : 0) };
        },
    };
    vi.doMock('zzfx', () => ({ ZZFX: { audioContext: ctx } }));
    vi.stubGlobal('document', { hidden: false, createElement: () => ({ canPlayType: () => 'probably' }) });
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('fetch', async (url: string) => {
        fetched.push(url);
        const ext = url.split('.').at(-1)!;
        const id = url.replace(/^music\//, '').replace(/\.\w+$/, '');
        return {
            json: async () => opts.metas?.[id] ?? { duracao: 10, secoes: LOOP },
            arrayBuffer: async () => ({ ext, id }),
        };
    });
    return { ctx, fetched, started, decodes: () => decodes };
}

const settle = () => new Promise((r) => setTimeout(r, 5));
const onGrid = (t: number, step: number) => Math.abs(t / step - Math.round(t / step)) < 1e-6;

describe('troca no tempo (contas)', () => {
    const g120 = { bar: 2, pulse: 0.5 }; // 4/4 a 120

    it('próxima linha, com 30 ms de folga pra agendar', () => {
        expect(untilLine(0.3, 0.5)).toBeCloseTo(0.2, 9);
        expect(untilLine(0.49, 0.5)).toBeCloseTo(0.51, 9); // a de 10 ms não dá tempo: a seguinte
        expect(untilLine(1, 0.5)).toBeCloseTo(0.5, 9); // em cima da linha: a próxima
        expect(untilLine(-0.3, 2)).toBeCloseTo(0.3, 9); // ainda na introdução (antes da origem)
    });

    it('compasso se chega em até 0,7 s; senão a próxima batida; andamento que casa vai na batida', () => {
        expect(swapWait(1.5, g120)).toBeCloseTo(0.5, 9); // compasso em 0,5 s
        expect(swapWait(0.3, g120)).toBeCloseTo(0.2, 9); // compasso em 1,7 s: a batida
        expect(swapWait(1.4, g120, true)).toBeCloseTo(0.1, 9);
    });

    it('batida do compasso, e a mesma batida na faixa que entra', () => {
        expect(beatOf(1.5, g120)).toBe(3);
        expect(beatOf(4, g120)).toBe(0);
        expect(beatOf(-0.5, g120)).toBe(3); // introdução de compassos inteiros
        expect(phaseOffset(3, g120)).toBeCloseTo(1.5, 9);
        const misty = gridOf({ meta: { secoes: [], linhasPorCompasso: 12 } }, { bpm: 72 }); // 12/8
        expect(misty.bar).toBeCloseTo(2.5, 9);
        expect(misty.pulse).toBeCloseTo(0.625, 9);
        expect(phaseOffset(5, misty)).toBeCloseTo(0.625, 9); // 4 pulsos por compasso
    });

    it('andamentos que casam: iguais (até 4%), o dobro ou a metade', () => {
        expect(sameTempo(60 / 116, 60 / 120)).toBe(true);
        expect(sameTempo(60 / 108, 60 / 136)).toBe(false);
        expect(sameTempo(60 / 60, 60 / 120)).toBe(true);
    });
});

describe('música', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('solta a faixa que saiu de cena: voltar a ela decodifica de novo', async () => {
        const a = fakeAudio();
        const m = await import('./music');
        m.playMusic('draft');
        await settle();
        m.playMusic('escalacao');
        await settle();
        m.playMusic('draft');
        await settle();
        // draft 2x (saiu da memória quando a escalação entrou) + escalação
        expect(a.decodes()).toBe(3);
    });

    it('volume zero não baixa nem decodifica; subir o volume volta a faixa da tela', async () => {
        const a = fakeAudio();
        const m = await import('./music');
        m.setMusicVolumes({ music: 0 });
        m.playMusic('draft');
        await settle();
        expect(a.fetched).toEqual([]);
        m.setMusicVolumes({ music: 0.4 });
        await settle();
        expect(a.decodes()).toBe(1);
        expect(a.started).toHaveLength(1);
    });

    it('webm que não decodifica cai pro mp3, e o atraso do mp3 não cortado anda os tempos', async () => {
        const a = fakeAudio({ webmFails: true, extra: 0.04 });
        const m = await import('./music');
        m.playMusic('draft');
        await settle();
        expect(a.fetched).toContain('music/draft.mp3');
        expect(a.started[0].loopStart).toBeCloseTo(2 + m.MP3_DELAY_S, 6);
        expect(a.started[0].off).toBeCloseTo(2 + m.MP3_DELAY_S, 6);
    });

    it('troca de tela cai na batida ou no compasso da faixa que sai; andamento igual entra na mesma batida', async () => {
        const intro = (bpm: number, bar: number) => ({
            duracao: 60,
            secoes: [
                { nome: 'intro', loop: false, inicio: 0, fim: bar, bpm },
                { nome: 'loop', loop: true, inicio: bar, fim: 60, bpm },
            ],
        });
        // Abertura 136, Draft 108 (não casam), Escalação 116 e a "rota-1" a 120 (casam: 3,4%)
        const a = fakeAudio({
            metas: {
                'abertura-gancho': intro(136, 240 / 136),
                draft: intro(108, 240 / 108),
                escalacao: intro(116, 240 / 116),
                'rota-1': intro(120, 2),
            },
        });
        const m = await import('./music');
        m.playMusic('abertura-gancho');
        await settle();
        expect(a.started[0].when).toBe(0);
        // Home → Draft com 1,3 s de Abertura: compasso (1,765 s) a 0,46 s → no compasso
        a.ctx.currentTime = 1.3;
        m.playMusic('draft');
        await settle();
        const d = a.started[1];
        expect(onGrid(d.when, 240 / 136)).toBe(true);
        expect(d.when - 1.3).toBeLessThanOrEqual(m.BAR_WAIT_S);
        expect(d.off).toBe(0); // andamento diferente: do começo
        expect(a.started[0].stop).toBeGreaterThan(d.when); // a Abertura decai depois da entrada
        // Draft → Escalação 1,0 s depois da entrada: compasso a 1,22 s (longe) → a batida (0,556 s)
        a.ctx.currentTime = d.when + 1.0;
        m.playMusic('escalacao');
        await settle();
        const e = a.started[2];
        expect(onGrid(e.when - d.when, 60 / 108)).toBe(true);
        expect(e.when - a.ctx.currentTime).toBeLessThan(60 / 108);
        // Escalação → 120 BPM a 2,5 batidas da entrada: casa, entra na batida 3 dela
        a.ctx.currentTime = e.when + 2.5 * (60 / 116);
        m.playMusic('rota-1');
        await settle();
        const r = a.started[3];
        expect(onGrid(r.when - e.when, 60 / 116)).toBe(true);
        expect(r.off).toBeCloseTo(3 * 0.5, 6);
    });

    it('troca de trecho na linha do compasso, e vale o último pedido (pedidos seguidos não trocam duas vezes)', async () => {
        const a = fakeAudio({
            metas: {
                'partida-2t': {
                    duracao: 100,
                    secoes: [
                        { nome: 'nivel1', loop: true, inicio: 0, fim: 32, bpm: 120 },
                        { nome: 'nivel2', loop: true, inicio: 32, fim: 64, bpm: 120 },
                        { nome: 'virada', loop: false, inicio: 64, fim: 66, bpm: 120 },
                        { nome: 'pressao', loop: true, inicio: 66, fim: 98, bpm: 120 },
                    ],
                },
            },
        });
        const m = await import('./music');
        m.playMusic('partida-2t', 'nivel1');
        await settle();
        a.ctx.currentTime = 3;
        m.playMusic('partida-2t', 'nivel2');
        m.playMusic('partida-2t', 'pressao');
        await settle();
        const later = a.started.filter((s) => s.when > 3);
        expect(later).toHaveLength(1);
        expect(later[0].when).toBeCloseTo(4, 6); // compasso de 2 s a 120
        expect(later[0].off).toBe(64); // a Pressão entra pela `virada` da faixa
        expect(a.started[0].stop).toBeCloseTo(4.01, 6);
    });
});
