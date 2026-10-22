import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    beatOf,
    fillWindow,
    gridOf,
    phaseOffset,
    planOf,
    REPEAT_S,
    sameTempo,
    sectionSwitchAt,
    swapWait,
    untilLine,
} from './music';
import { FILL_PEAK, mixVirada, viradaHits } from './virada';

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
    /** Valores escritos direto em `gain.value` (degrau) e alvos de rampa (`setTargetAtTime`). */
    const steps: number[] = [];
    const targets: number[] = [];
    const param = () => {
        let v = 1;
        return {
            get value() {
                return v;
            },
            set value(x: number) {
                steps.push(x);
                v = x;
            },
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
            setTargetAtTime(x: number) {
                targets.push(x);
            },
            cancelScheduledValues() {},
        };
    };
    const node = () => ({ gain: param(), connect() {} });
    /** Parâmetro que não conta como degrau (o passa-baixa de cada faixa). */
    const quiet = () => ({
        value: 0,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime() {},
        cancelScheduledValues() {},
    });
    const ctx = {
        state: 'running',
        currentTime: 0,
        sampleRate: 48000,
        destination: {},
        addEventListener() {},
        createGain: node,
        createBiquadFilter: () => ({ type: '', Q: quiet(), frequency: quiet(), connect() {} }),
        createBuffer: () => ({ id: 'virada', copyToChannel() {} }),
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
    vi.doMock('zzfx', () => ({ ZZFX: { audioContext: ctx, sampleRate: 44100, buildSamples: () => [0.5, 0.25] } }));
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
    return { ctx, fetched, started, steps, targets, decodes: () => decodes };
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

    it('troca de trecho nunca é agendada antes de uma troca que ainda não soou', () => {
        // o loop volta em 0,5 s, mas a troca pendente só entra em 3 s: a nova espera por ela
        expect(sectionSwitchAt(10, -3, 2, 13)).toBe(13);
        expect(sectionSwitchAt(10, 0.3, 2)).toBeCloseTo(11.7, 9); // sem pendência: a próxima linha do compasso
        expect(sectionSwitchAt(10, 1.9, 2, 10)).toBeCloseTo(10.1, 9); // pendência já passou: vale a linha
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

    it('mexer no volume é uma rampa curta, não um degrau (o degrau estala)', async () => {
        const a = fakeAudio();
        const m = await import('./music');
        m.playMusic('draft');
        await settle();
        const before = a.steps.length;
        m.setMusicVolumes({ music: 0.2 });
        expect(a.steps.length).toBe(before);
        expect(a.targets.at(-1)).toBeCloseTo(0.6 * 0.2, 9);
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

    it('12/8 (Misty): troca de trecho na linha do compasso de 12 linhas', async () => {
        // 90 BPM: linha = 1/6 s; compasso de 12 linhas = 2 s (4/4 dava 240/90 = 2,67 s: fora do compasso)
        const secoes = [
            { nome: 'nivel1', loop: true, inicio: 0, fim: 8, bpm: 90 },
            { nome: 'nivel2', loop: true, inicio: 8, fim: 16, bpm: 90 },
        ];
        const a = fakeAudio({ metas: { 'partida-misty-2t': { duracao: 16, linhasPorCompasso: 12, secoes } } });
        const m = await import('./music');
        m.playMusic('partida-misty-2t', 'nivel1');
        await settle();
        a.ctx.currentTime = 0.6;
        m.playMusic('partida-misty-2t', 'nivel2');
        await settle();
        expect(a.started[1].when).toBeCloseTo(2, 6);
    });
});

describe('troca entre telas: virada e ponte (regras de 22/10)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('a regra: avançar = ponte; voltar ou sem move = só no tempo; a mesma troca em 30 s = só virada; no meio = corta', () => {
        expect(planOf({ move: 'avanca' })).toBe('ponte');
        expect(planOf({ move: 'partida' })).toBe('ponte');
        expect(planOf({ move: 'volta' })).toBe('tempo');
        expect(planOf({})).toBe('tempo');
        expect(planOf({ move: 'avanca', since: 12 })).toBe('virada');
        expect(planOf({ move: 'avanca', since: REPEAT_S + 1 })).toBe('ponte');
        expect(planOf({ move: 'volta', pending: true })).toBe('corta');
        expect(planOf({ move: 'avanca', pending: true })).toBe('corta');
    });

    it('a virada vai da próxima batida até o 1 do compasso seguinte (1 a 4 batidas)', () => {
        const g = { bar: 2, pulse: 0.5 }; // 4/4 a 120
        for (const [x, beats] of [
            [0.3, 3], // batida em 0,5; compasso em 2
            [1.2, 1], // batida em 1,5; o 1 em 2 (meia batida de folga)
            [1.45, 4], // a batida de 1,5 está a 50 ms (menos que a folga de 100 ms): começa no 2 e vai até o 4
        ]) {
            const w = fillWindow(x, g);
            expect(onGrid(x + w.at, g.pulse)).toBe(true);
            expect(onGrid(x + w.end, g.bar)).toBe(true);
            expect(w.at).toBeGreaterThanOrEqual(0.1 - 1e-9);
            expect(w.beats).toBe(beats);
            expect(w.end - w.at).toBeCloseTo(beats * g.pulse, 9);
        }
        // as batidas: a primeira no começo da virada, o SOC-CER-MON termina meia batida antes do 1; prato só no 1
        for (const beats of [1, 2, 3, 4]) {
            const rows = viradaHits(beats).map((h) => h.row);
            expect(Math.min(...rows)).toBe(16 - 4 * beats);
            expect(Math.max(...rows)).toBeLessThan(16);
        }
        expect(
            viradaHits(3)
                .filter((h) => h.inst === 'clap')
                .map((h) => h.row),
        ).toEqual([8, 11, 14]);
        expect(
            viradaHits(2, true)
                .filter((h) => h.row === 16)
                .map((h) => h.inst),
        ).toEqual(['crash', 'kick']);
        // mistura: a 1ª batida é a amostra 0 do som; o nível não passa do pico
        const [L] = mixVirada({ beats: 3, pulse: 0.5 }, () => [1, 0.5], 1000);
        expect(L[0]).not.toBe(0);
        expect(L[1]).not.toBe(0);
        expect(L[2]).toBe(0);
        expect(Math.max(...L.map(Math.abs))).toBeLessThanOrEqual(FILL_PEAK + 1e-6);
        expect(L[(8 - 4) * 125]).not.toBe(0); // o SOC do SOC-CER-MON: 4 linhas depois (1 batida = 500 amostras)
    });

    const intro = (bpm: number, bar: number) => ({
        duracao: 60,
        secoes: [
            { nome: 'intro', loop: false, inicio: 0, fim: bar, bpm },
            { nome: 'loop', loop: true, inicio: bar, fim: 60, bpm },
        ],
    });
    const ponte = (bpm: number) => ({
        duracao: 4,
        secoes: [{ nome: 'ponte', loop: false, inicio: 0, fim: 240 / bpm, bpm }],
    });
    const metas = {
        'abertura-gancho': intro(136, 240 / 136),
        draft: intro(108, 240 / 108),
        escalacao: intro(116, 240 / 116),
        'ponte-draft': ponte(108),
        'ponte-escalacao': ponte(116),
    };

    it('avançar: virada no tempo da que sai, ponte no 1, a faixa no fim da ponte; repetir em 30 s: só a virada', async () => {
        const a = fakeAudio({ metas });
        const m = await import('./music');
        m.playMusic('abertura-gancho');
        await settle();
        a.ctx.currentTime = 1.3;
        m.playMusic('draft', undefined, 'avanca');
        await settle();
        const [fill, br, draft] = a.started.slice(1);
        expect(fill.id).toBe('virada');
        expect(onGrid(fill.when, 60 / 136)).toBe(true);
        expect(br.id).toBe('ponte-draft');
        expect(onGrid(br.when, 240 / 136)).toBe(true); // o 1 do compasso da Abertura
        expect(draft.id).toBe('draft');
        expect(draft.when).toBeCloseTo(br.when + 240 / 108, 9); // 1 compasso a 108
        expect(a.fetched).toContain('music/clap-808.wav');
        // volta pra Home (só no tempo) e avança de novo em menos de 30 s: virada sem ponte
        a.ctx.currentTime = draft.when + 3;
        m.playMusic('abertura-gancho', undefined, 'volta');
        await settle();
        expect(a.started.at(-1)?.id).toBe('abertura-gancho');
        a.ctx.currentTime += 5;
        const n = a.started.length;
        m.playMusic('draft', undefined, 'avanca');
        await settle();
        expect(a.started.slice(n).map((x) => x.id)).toEqual(['virada', 'draft']);
        expect(onGrid(a.started.at(-1)!.when - a.started.at(-3)!.when, 60 / 136)).toBe(true);
    });

    it('navegar de novo no meio da ponte: cancela, e a mais nova entra na próxima batida da ponte (sem outra virada)', async () => {
        const a = fakeAudio({ metas });
        const m = await import('./music');
        m.playMusic('abertura-gancho');
        await settle();
        a.ctx.currentTime = 1.3;
        m.playMusic('draft', undefined, 'avanca');
        await settle();
        const [, br, draft] = a.started.slice(1);
        a.ctx.currentTime = br.when + 0.7; // no meio da ponte (108 BPM: batida de 0,556 s)
        m.playMusic('escalacao', undefined, 'avanca');
        await settle();
        const e = a.started.at(-1)!;
        expect(e.id).toBe('escalacao');
        expect(a.started.filter((x) => x.id === 'virada')).toHaveLength(1);
        expect(e.when).toBeCloseTo(br.when + 2 * (60 / 108), 9);
        expect(draft.stop).toBe(a.ctx.currentTime); // a Draft agendada nem entra
        expect(br.stop).toBeGreaterThan(e.when); // a ponte decai da batida em diante
        expect(br.stop).toBeLessThan(e.when + 0.5);
    });

    it('voltar pra faixa que ainda sai, no meio da virada: ela continua de onde está, sem recomeçar', async () => {
        const a = fakeAudio({ metas });
        const m = await import('./music');
        m.playMusic('abertura-gancho');
        await settle();
        a.ctx.currentTime = 1.3;
        m.playMusic('draft', undefined, 'avanca');
        await settle();
        const [fill, br, draft] = a.started.slice(1);
        a.ctx.currentTime = fill.when + 0.05;
        m.playMusic('abertura-gancho', undefined, 'volta');
        await settle();
        const back = a.started.at(-1)!;
        expect(back.id).toBe('abertura-gancho');
        expect(onGrid(back.when, 60 / 136)).toBe(true);
        expect(back.off).toBeCloseTo(back.when, 6); // o mesmo ponto do arquivo (começou em 0)
        expect(a.started[0].stop).toBeCloseTo(back.when, 9);
        expect(br.stop).toBe(br.when); // a ponte nem toca
        expect(draft.stop).toBe(a.ctx.currentTime);
    });
});
