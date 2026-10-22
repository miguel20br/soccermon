/**
 * Música das telas: faixas Opus `.webm` (reserva `.mp3`) em `public/music/<faixa>` + `.json` de trechos (loop, BPM), baixadas só quando a
 * tela pede. Toca no mesmo AudioContext dos efeitos (ZzFX), sem importar `phaser` (a Home usa este módulo).
 * Loop sem costura por `loopStart`/`loopEnd`; troca de tela com crossfade de 250 ms; troca de trecho na linha do compasso.
 */
export type TrackId =
    | 'abertura-gancho'
    | 'mercado-funk'
    | 'estrada-da-vitoria'
    | 'planalto-indigo'
    | 'campeao'
    | 'tema-brock'
    | 'tema-misty'
    | 'tema-rocket'
    | 'draft'
    | 'escalacao'
    | 'recompensa'
    | 'vitoria-gancho'
    | 'derrota'
    | 'eliminado'
    | 'rota-1'
    | 'mt-moon'
    | 'cerulean'
    | 'sala'
    | 'virada'
    | 'virada-pressao'
    | `partida-${'' | 'brock-' | 'misty-' | 'rocket-'}${'1t' | '2t'}`;

interface Section {
    nome: string;
    loop: boolean;
    inicio: number;
    fim: number;
    bpm: number;
}
interface Meta {
    secoes: Section[];
    /** Duração do áudio (s), sem o atraso do codificador. */
    duracao?: number;
    /** Batidas do gancho SOC-CER-MON (segundos depois do começo de cada compasso do gancho). */
    gancho?: { batidas: number[]; compassos: number[] };
}
interface Loaded {
    buf: AudioBuffer;
    meta: Meta;
    /** Atraso (s) do começo do arquivo que o navegador não cortou (mp3 no WebKit): os tempos do `.json` andam isso. */
    shift: number;
}
/** Faixa tocando: um nó de ganho próprio (pro crossfade) e a fonte do trecho atual. */
interface Playing {
    id: TrackId;
    loaded: Loaded;
    gain: GainNode;
    src: AudioBufferSourceNode;
    sec: Section;
    /** Tempo do contexto em que a fonte começou e posição (s) do arquivo nesse instante. */
    t0: number;
    off: number;
}

export const FADE_S = 0.25;
const vol = { master: 0.6, music: 0.4 };
/** Virada: a música da partida abaixa ~10 dB enquanto a vinheta toca. */
const DUCK = 10 ** (-10 / 20);
const DUCK_IN_S = 0.15;
const DUCK_OUT_S = 0.6;
/** Só o que está em uso (`prune`): cada faixa decodificada ocupa ~25-50 MB (28 faixas juntas passavam de 690 MB). */
const cache = new Map<TrackId, Promise<Loaded | null>>();
/** As vinhetas da virada ficam (curtas, e tocam na hora do gol). */
const STINGS: readonly TrackId[] = ['virada', 'virada-pressao'];
/**
 * Atraso do codificador do mp3 (LAME: 1105 amostras a 44,1 kHz = 25,06 ms, o `start_time` do ffprobe). Medido em
 * 22/10/2026: o WebKit não corta (o mp3 sai 25,1 ms adiantado e 30-50 ms mais longo que o `duracao` do `.json`); o
 * Chromium corta (duração exata).
 */
export const MP3_DELAY_S = 1105 / 44100;
let webmBroken = false;
let out: GainNode | null = null;
/** Entre as faixas e o volume: só a vinheta mexe nele (troca de trecho e crossfade mexem no ganho de cada faixa). */
let duck: GainNode | null = null;
let sting: AudioBufferSourceNode | null = null;
let current: Playing | null = null;
/** O que a tela pediu (pode esperar o toque que libera o áudio ou o download). */
let want: { id: TrackId | null; section?: string } = { id: null };
let gestureHooked = false;
let raf = 0;
let lastPos = 0;
const hitListeners = new Set<(i: number) => void>();

/** zzfx cria o AudioContext ao ser importado: só entra quando a música toca (e não nos testes, que não têm áudio). */
let zz: typeof import('zzfx') | null = null;
const ctx = (): AudioContext => (zz as typeof import('zzfx')).ZZFX.audioContext;
const level = () => vol.master * vol.music;

function output(): GainNode {
    if (!out) {
        out = ctx().createGain();
        out.connect(ctx().destination);
    }
    out.gain.value = level();
    return out;
}

/** Onde as faixas entram: o duck, que vai pro volume. A vinheta entra direto no volume (não abaixa junto). */
function bus(): GainNode {
    if (!duck) {
        duck = ctx().createGain();
        duck.connect(output());
    }
    return duck;
}

/** Volume geral e da música (0..1). Zero desliga de vez (nem baixa); saiu do zero, volta a faixa da tela. */
export function setMusicVolumes(v: { master?: number; music?: number }) {
    const was = level();
    if (typeof v.master === 'number') vol.master = v.master;
    if (typeof v.music === 'number') vol.music = v.music;
    if (out) out.gain.value = level();
    if ((was === 0) !== (level() === 0)) void apply();
}

/** Opus em WebM (64 kbps) onde o navegador toca; mp3 de reserva (Safari antigo, ou se o webm não decodificar). */
const ext = () =>
    !webmBroken && document.createElement('audio').canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'mp3';

async function fetchDecode(id: TrackId, meta: Meta): Promise<Loaded> {
    const e = ext();
    const raw = await fetch(`music/${id}.${e}`).then((r) => r.arrayBuffer());
    try {
        const buf = await ctx().decodeAudioData(raw);
        const shift = e === 'mp3' && buf.duration - (meta.duracao ?? buf.duration) > 0.02 ? MP3_DELAY_S : 0;
        return { meta, buf, shift };
    } catch (err) {
        if (e !== 'webm') throw err;
        // diz que toca Opus mas não decodifica (Safari antigo diz "probably"): mp3 daqui em diante
        webmBroken = true;
        return fetchDecode(id, meta);
    }
}

function load(id: TrackId): Promise<Loaded | null> {
    let p = cache.get(id);
    if (!p) {
        p = (async () => {
            try {
                const meta = await fetch(`music/${id}.json`).then((r) => r.json() as Promise<Meta>);
                return await fetchDecode(id, meta);
            } catch {
                // sem rede ou navegador sem Opus nem mp3: fica sem música, o jogo segue
                if (cache.get(id) === p) cache.delete(id);
                return null;
            }
        })();
        cache.set(id, p);
    }
    return p;
}

/** Solta as faixas fora de uso (a que toca, a pedida e as vinhetas ficam): a memória volta com o coletor. */
function prune() {
    for (const id of cache.keys()) if (id !== current?.id && id !== want.id && !STINGS.includes(id)) cache.delete(id);
}

const sectionOf = (l: Loaded, name?: string): Section =>
    l.meta.secoes.find((s) => s.nome === name) ?? l.meta.secoes.find((s) => s.loop) ?? l.meta.secoes[0];

/** Trecho sem loop que termina onde o loop começa (introdução da Abertura, virada da partida). */
const leadIn = (l: Loaded, sec: Section) =>
    sec.loop ? l.meta.secoes.find((x) => !x.loop && x.fim === sec.inicio) : undefined;

/** Fonte do trecho: loop = do começo do arquivo (intro inclusa) até o fim do loop, depois só o loop. */
function makeSource(l: Loaded, sec: Section, to: AudioNode, when: number, off: number) {
    const src = ctx().createBufferSource();
    src.buffer = l.buf;
    if (sec.loop) {
        src.loop = true;
        src.loopStart = sec.inicio + l.shift;
        src.loopEnd = sec.fim + l.shift;
    }
    src.connect(to);
    // ponytail: trecho sem loop toca até o fim do arquivo (fim/virada são os últimos); cortar no `fim` se precisar
    src.start(when, off + l.shift);
    return src;
}

/** Tempo do contexto que está saindo no alto-falante agora (currentTime anda em blocos e vem antes do som). */
function heardTime(): number {
    const c = ctx();
    const o = c.getOutputTimestamp?.();
    return o?.contextTime ? o.contextTime + (performance.now() - (o.performanceTime ?? 0)) / 1000 : c.currentTime;
}

/** Posição (s) no arquivo agora (`heard`: a que se ouve, pro olho cair junto do ouvido). */
function position(p: Playing, heard = false): number {
    const x = p.off + (heard ? heardTime() : ctx().currentTime) - p.t0;
    const { inicio, fim, loop } = p.sec;
    return loop && x >= fim ? inicio + ((x - inicio) % (fim - inicio)) : x;
}

function stopAfter(p: Playing, at: number) {
    try {
        p.src.stop(at);
    } catch {
        // já parou
    }
}

async function apply() {
    const { id, section } = want;
    // silêncio ou volume zero: nada de baixar nem decodificar
    if (id === null || level() === 0) {
        fadeOut(current);
        current = null;
        prune();
        return;
    }
    zz ??= await import('zzfx');
    const c = ctx();
    watchState(c);
    if (c.state !== 'running') {
        hookGesture();
        return;
    }
    const loaded = await load(id);
    // a tela (ou o volume) pode ter mudado enquanto baixava
    if (!loaded || want.id !== id || level() === 0) return;
    const sec = sectionOf(loaded, section);
    const now = c.currentTime;
    if (current && current.id === id) {
        if (current.sec === sec) return;
        // mesma faixa, outro trecho: troca na linha do compasso (corte limpo, sem fade)
        const at = nextLine(current, 240 / current.sec.bpm);
        // trecho de entrada sem loop colado no loop (virada -> pressao): entra por ele
        const lead = leadIn(loaded, sec);
        const off = lead?.inicio ?? sec.inicio;
        const next: Playing = { ...current, sec, t0: at, off, src: makeSource(loaded, sec, current.gain, at, off) };
        stopAfter(current, at);
        current = next;
        return;
    }
    // faixa nova: crossfade de 250 ms (e a vinheta da virada, se ainda tocava, sai junto)
    fadeOut(current);
    endSting(now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + FADE_S);
    gain.connect(bus());
    // loop com introdução logo antes (Abertura): entra pela introdução
    const off = leadIn(loaded, sec)?.inicio ?? sec.inicio;
    current = { id, loaded, gain, sec, t0: now, off, src: makeSource(loaded, sec, gain, now, off) };
    prune();
    lastPos = off - 0.001;
    startHits();
}

/** Próxima linha da grade (`step` s: compasso ou batida) do trecho tocando, em tempo do contexto. */
function nextLine(p: Playing, step: number): number {
    const x = position(p) - (p.sec.loop ? p.sec.inicio : 0);
    return ctx().currentTime + (Math.ceil(x / step) * step - x);
}

function endSting(now: number) {
    if (!sting || !duck) return;
    try {
        sting.stop(now + 0.05);
    } catch {
        // já parou
    }
    sting = null;
    duck.gain.cancelScheduledValues(now);
    duck.gain.setValueAtTime(duck.gain.value, now);
    duck.gain.linearRampToValueAtTime(1, now + FADE_S);
}

/**
 * Virada no placar: a música da partida abaixa ~10 dB em 150 ms, a vinheta entra na próxima batida (meio tom acima
 * na Pressão final) e a música volta em 600 ms depois que ela acaba. Só o duck mexe no volume: a troca de trecho da
 * partida (no ganho da faixa) segue normal por baixo.
 */
export async function playVirada() {
    if (!zz || ctx().state !== 'running' || level() === 0) return;
    const loaded = await load(current?.sec.nome === 'pressao' ? 'virada-pressao' : 'virada');
    if (!loaded) return;
    const p = current;
    const now = ctx().currentTime;
    const at = p ? nextLine(p, 60 / p.sec.bpm) : now;
    const g = bus().gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(DUCK, now + DUCK_IN_S);
    const end = at + loaded.buf.duration;
    g.setValueAtTime(DUCK, end);
    g.linearRampToValueAtTime(1, end + DUCK_OUT_S);
    try {
        sting?.stop();
    } catch {
        // já parou
    }
    const src = ctx().createBufferSource();
    src.buffer = loaded.buf;
    src.connect(output());
    src.onended = () => {
        if (sting === src) sting = null;
    };
    src.start(at, loaded.shift);
    sting = src;
}

/** Baixa antes da hora (as vinhetas da virada no 2º tempo), se a música já está ligada. */
export function prefetchMusic(...ids: TrackId[]) {
    if (zz && level() > 0) for (const id of ids) void load(id);
}

function fadeOut(p: Playing | null) {
    if (!p) return;
    const now = ctx().currentTime;
    p.gain.gain.cancelScheduledValues(now);
    p.gain.gain.setValueAtTime(p.gain.gain.value, now);
    p.gain.gain.linearRampToValueAtTime(0, now + FADE_S);
    stopAfter(p, now + FADE_S + 0.05);
}

/**
 * O navegador só libera o áudio depois de um gesto: o primeiro acorda o contexto e começa a música. `pointerdown` de
 * toque não conta como ativação no Chrome do Android (`pointerup`, `touchend` e `click` contam).
 */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
function hookGesture() {
    if (gestureHooked || typeof window === 'undefined') return;
    gestureHooked = true;
    const go = () => {
        gestureHooked = false;
        for (const ev of GESTURES) window.removeEventListener(ev, go, true);
        ctx()
            .resume()
            .then(apply)
            .catch(() => {});
    };
    for (const ev of GESTURES) window.addEventListener(ev, go, true);
}

/**
 * iOS: ligação, Siri ou outro app deixam o contexto `interrupted` (não `suspended`) e ele não volta sozinho. Parou com a
 * aba à vista e música pedida: o próximo gesto retoma.
 */
let stateWatched = false;
function watchState(c: AudioContext) {
    if (stateWatched) return;
    stateWatched = true;
    c.addEventListener('statechange', () => {
        if (c.state !== 'running' && !document.hidden && want.id && level() > 0) hookGesture();
    });
}

/** Pede a faixa da tela (null = silêncio). Mesma faixa em duas telas segue tocando; `section` troca o trecho. */
export function playMusic(id: TrackId | null, section?: string) {
    want = { id, section };
    prune();
    void apply();
}

/** Aba escondida: pausa (e volta com a aba). */
export function startMusicLifecycle() {
    document.addEventListener('visibilitychange', () => {
        if (!zz) return;
        const c = ctx();
        if (document.hidden) {
            if (c.state === 'running' && current) void c.suspend();
        } else if (c.state !== 'running' && want.id && level() > 0) {
            // 'suspended' (a aba escondeu) ou 'interrupted' (iOS): tenta já; se o iOS pedir gesto, o próximo toque retoma
            c.resume()
                .then(() => (c.state === 'running' ? apply() : hookGesture()))
                .catch(hookGesture);
        }
    });
}

/** Avisa quando cai uma das 3 batidas do gancho SOC-CER-MON da Abertura (0, 1, 2). */
export function onGanchoHit(cb: (i: number) => void) {
    hitListeners.add(cb);
    return () => {
        hitListeners.delete(cb);
    };
}

function startHits() {
    if (raf) return;
    const tick = () => {
        raf = requestAnimationFrame(tick);
        const p = current;
        const g = p?.loaded.meta.gancho;
        if (!p || !g || hitListeners.size === 0) return;
        const pos = position(p, true);
        if (pos < p.off) return; // ainda não saiu no alto-falante
        const wrapped = pos < lastPos;
        for (const bar of g.compassos) {
            g.batidas.forEach((b, i) => {
                const h = bar + b;
                if (wrapped ? h > lastPos || (h >= p.sec.inicio && h <= pos) : h > lastPos && h <= pos)
                    for (const f of hitListeners) f(i);
            });
        }
        lastPos = pos;
    };
    raf = requestAnimationFrame(tick);
}
