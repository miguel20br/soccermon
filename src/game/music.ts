/**
 * Música das telas: faixas .ogg em `public/music/<faixa>.ogg` + `.json` de trechos (loop, BPM), baixadas só quando a
 * tela pede. Toca no mesmo AudioContext dos efeitos (ZzFX), sem importar `phaser` (a Home usa este módulo).
 * Loop sem costura por `loopStart`/`loopEnd`; troca de tela com crossfade de 250 ms; troca de trecho na linha do compasso.
 */
export type TrackId =
    | 'abertura-gancho'
    | 'mercado-funk'
    | 'estrada-da-vitoria'
    | 'planalto-indigo'
    | 'campeao'
    | 'partida-1t'
    | 'partida-2t';

interface Section {
    nome: string;
    loop: boolean;
    inicio: number;
    fim: number;
    bpm: number;
}
interface Meta {
    secoes: Section[];
    /** Batidas do gancho SOC-CER-MON (segundos depois do começo de cada compasso do gancho). */
    gancho?: { batidas: number[]; compassos: number[] };
}
interface Loaded {
    buf: AudioBuffer;
    meta: Meta;
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
const cache = new Map<TrackId, Promise<Loaded | null>>();
let out: GainNode | null = null;
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

/** Volume geral e da música (0..1). */
export function setMusicVolumes(v: { master?: number; music?: number }) {
    if (typeof v.master === 'number') vol.master = v.master;
    if (typeof v.music === 'number') vol.music = v.music;
    if (out) out.gain.value = level();
}

function load(id: TrackId): Promise<Loaded | null> {
    let p = cache.get(id);
    if (!p) {
        p = (async () => {
            try {
                const [meta, raw] = await Promise.all([
                    fetch(`music/${id}.json`).then((r) => r.json() as Promise<Meta>),
                    fetch(`music/${id}.ogg`).then((r) => r.arrayBuffer()),
                ]);
                return { meta, buf: await ctx().decodeAudioData(raw) };
            } catch {
                // sem rede ou navegador sem Vorbis: fica sem música, o jogo segue
                cache.delete(id);
                return null;
            }
        })();
        cache.set(id, p);
    }
    return p;
}

const sectionOf = (l: Loaded, name?: string): Section =>
    l.meta.secoes.find((s) => s.nome === name) ?? l.meta.secoes.find((s) => s.loop) ?? l.meta.secoes[0];

/** Fonte do trecho: loop = do começo do arquivo (intro inclusa) até o fim do loop, depois só o loop. */
function makeSource(l: Loaded, sec: Section, to: AudioNode, when: number, off: number) {
    const src = ctx().createBufferSource();
    src.buffer = l.buf;
    if (sec.loop) {
        src.loop = true;
        src.loopStart = sec.inicio;
        src.loopEnd = sec.fim;
    }
    src.connect(to);
    // ponytail: trecho sem loop toca até o fim do arquivo (fim/virada são os últimos); cortar no `fim` se precisar
    src.start(when, off);
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
    zz ??= await import('zzfx');
    const { id, section } = want;
    const c = ctx();
    if (id === null) {
        fadeOut(current);
        current = null;
        return;
    }
    if (c.state !== 'running') {
        hookGesture();
        return;
    }
    const loaded = await load(id);
    // a tela pode ter mudado enquanto baixava
    if (!loaded || want.id !== id) return;
    const sec = sectionOf(loaded, section);
    const now = c.currentTime;
    if (current && current.id === id) {
        if (current.sec === sec) return;
        // mesma faixa, outro trecho: troca na linha do compasso (corte limpo, sem fade)
        const barS = 240 / current.sec.bpm;
        const pos = position(current);
        const start = current.sec.loop ? current.sec.inicio : 0;
        const at = now + (Math.ceil((pos - start) / barS) * barS - (pos - start));
        const next: Playing = {
            ...current,
            sec,
            t0: at,
            off: sec.inicio,
            src: makeSource(loaded, sec, current.gain, at, sec.inicio),
        };
        stopAfter(current, at);
        current = next;
        return;
    }
    // faixa nova: crossfade de 250 ms
    fadeOut(current);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + FADE_S);
    gain.connect(output());
    // loop com introdução logo antes (Abertura): entra pela introdução
    const intro = loaded.meta.secoes.find((x) => !x.loop && x.fim === sec.inicio);
    const off = sec.loop && intro ? intro.inicio : sec.inicio;
    current = { id, loaded, gain, sec, t0: now, off, src: makeSource(loaded, sec, gain, now, off) };
    lastPos = off - 0.001;
    startHits();
}

function fadeOut(p: Playing | null) {
    if (!p) return;
    const now = ctx().currentTime;
    p.gain.gain.cancelScheduledValues(now);
    p.gain.gain.setValueAtTime(p.gain.gain.value, now);
    p.gain.gain.linearRampToValueAtTime(0, now + FADE_S);
    stopAfter(p, now + FADE_S + 0.05);
}

/** O navegador só libera o áudio depois de um toque: o primeiro toque acorda o contexto e começa a música. */
function hookGesture() {
    if (gestureHooked || typeof window === 'undefined') return;
    gestureHooked = true;
    const go = () => {
        gestureHooked = false;
        for (const ev of ['pointerdown', 'keydown']) window.removeEventListener(ev, go, true);
        ctx()
            .resume()
            .then(apply)
            .catch(() => {});
    };
    for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, go, true);
}

/** Pede a faixa da tela (null = silêncio). Mesma faixa em duas telas segue tocando; `section` troca o trecho. */
export function playMusic(id: TrackId | null, section?: string) {
    want = { id, section };
    void apply();
}

/** Aba escondida: pausa (e volta com a aba). */
export function startMusicLifecycle() {
    document.addEventListener('visibilitychange', () => {
        if (!zz) return;
        const c = ctx();
        if (document.hidden) {
            if (c.state === 'running' && current) void c.suspend();
        } else if (c.state === 'suspended' && current) void c.resume();
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
