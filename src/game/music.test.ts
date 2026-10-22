import { afterEach, describe, expect, it, vi } from 'vitest';

/** AudioContext de mentira: conta fetch e decode, guarda as fontes que começaram. */
function fakeAudio(opts: { webmFails?: boolean; extra?: number } = {}) {
    const fetched: string[] = [];
    const started: { off: number; loopStart: number }[] = [];
    let decodes = 0;
    const param = () => ({
        value: 1,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        cancelScheduledValues() {},
    });
    const node = () => ({ gain: param(), connect() {} });
    const ctx = {
        state: 'running',
        currentTime: 0,
        destination: {},
        addEventListener() {},
        createGain: node,
        createBufferSource: () => ({
            connect() {},
            stop() {},
            loopStart: 0,
            start(_when: number, off = 0) {
                started.push({ off, loopStart: this.loopStart });
            },
        }),
        decodeAudioData: async (raw: { ext: string }) => {
            decodes++;
            if (raw.ext === 'webm' && opts.webmFails) throw new Error('EncodingError');
            return { duration: 10 + (raw.ext === 'mp3' ? (opts.extra ?? 0) : 0) };
        },
    };
    vi.doMock('zzfx', () => ({ ZZFX: { audioContext: ctx } }));
    vi.stubGlobal('document', { hidden: false, createElement: () => ({ canPlayType: () => 'probably' }) });
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('fetch', async (url: string) => {
        fetched.push(url);
        const ext = url.split('.').at(-1)!;
        return {
            json: async () => ({ duracao: 10, secoes: [{ nome: 'loop', loop: true, inicio: 2, fim: 10, bpm: 120 }] }),
            arrayBuffer: async () => ({ ext }),
        };
    });
    return { fetched, started, decodes: () => decodes };
}

const settle = () => new Promise((r) => setTimeout(r, 5));

describe('música', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('solta a faixa que saiu de cena: voltar a ela decodifica de novo (as vinhetas ficam)', async () => {
        const a = fakeAudio();
        const m = await import('./music');
        m.playMusic('draft');
        await settle();
        m.prefetchMusic('virada');
        m.playMusic('escalacao');
        await settle();
        m.playMusic('draft');
        await settle();
        await m.playVirada();
        // draft 2x (saiu da memória quando a escalação entrou) + escalação + virada 1x
        expect(a.decodes()).toBe(4);
    });

    it('volume zero não baixa nem decodifica; subir o volume volta a faixa da tela', async () => {
        const a = fakeAudio();
        const m = await import('./music');
        m.setMusicVolumes({ music: 0 });
        m.playMusic('draft');
        m.prefetchMusic('virada');
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
});
