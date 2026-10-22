/**
 * Música das telas: faixas Opus `.webm` (reserva `.mp3`) em `public/music/<faixa>` + `.json` de trechos (loop, BPM), baixadas só quando a
 * tela pede. Toca no mesmo AudioContext dos efeitos (ZzFX), sem importar `phaser` (a Home usa este módulo).
 * Loop sem costura por `loopStart`/`loopEnd`. Troca de tela encaixada no tempo da faixa que sai (próxima batida, ou o
 * compasso se ele chega em até 0,7 s; andamentos que casam entram na mesma batida); a tela não espera, só o áudio.
 * Troca de trecho na linha do compasso.
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
    /** Linhas (16 avos da batida do `bpm`) por compasso: 16 = 4/4; 12 = 12/8 (a Misty). */
    linhasPorCompasso?: number;
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

/** Fade de entrada quando não há faixa saindo (o primeiro som, ou depois do silêncio) e de saída pro silêncio. */
export const FADE_S = 0.25;
/** Troca encaixada no tempo: a faixa nova entra em 30 ms (sem estalo) e a que sai decai (constante de 60 ms). */
const IN_S = 0.03;
const OUT_TAU = 0.06;
/** Corte da troca de trecho: o trecho que sai some nos últimos 10 ms antes da linha (sem estalo). */
const CUT_S = 0.01;
/** Antecedência mínima pra agendar no AudioContext (s). */
const LEAD_S = 0.03;
/** Troca de tela espera a linha do compasso só se ela chega em até isso (s); senão, a próxima batida. */
export const BAR_WAIT_S = 0.7;
const vol = { master: 0.6, music: 0.4 };
/** Só o que está em uso (`prune`): cada faixa decodificada ocupa ~25-50 MB (28 faixas juntas passavam de 690 MB). */
const cache = new Map<TrackId, Promise<Loaded | null>>();
/**
 * Atraso do codificador do mp3 (LAME: 1105 amostras a 44,1 kHz = 25,06 ms, o `start_time` do ffprobe). Medido em
 * 22/10/2026: o WebKit não corta (o mp3 sai 25,1 ms adiantado e 30-50 ms mais longo que o `duracao` do `.json`); o
 * Chromium corta (duração exata).
 */
export const MP3_DELAY_S = 1105 / 44100;
let webmBroken = false;
let out: GainNode | null = null;
let current: Playing | null = null;
/** A faixa que está saindo numa troca agendada (até a nova entrar, é ela que dá o tempo). */
let leaving: Playing | null = null;
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

/** Onde as faixas entram: o volume da música. */
function bus(): GainNode {
    if (!out) {
        out = ctx().createGain();
        out.connect(ctx().destination);
    }
    out.gain.value = level();
    return out;
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

/** Solta as faixas fora de uso (a que toca e a pedida ficam): a memória volta com o coletor. */
function prune() {
    for (const id of cache.keys()) if (id !== current?.id && id !== want.id) cache.delete(id);
}

/**
 * Grade do trecho em segundos: compasso e pulso. 4/4: pulso = semínima (4 linhas). 12/8: pulso = semínima pontuada
 * (3 linhas), e o compasso tem 12 linhas, não 16 (antes a troca de trecho da Misty caía fora da linha do compasso).
 */
export function gridOf(l: Pick<Loaded, 'meta'>, sec: Pick<Section, 'bpm'>) {
    const line = 15 / sec.bpm;
    const n = l.meta.linhasPorCompasso ?? 16;
    return { bar: n * line, pulse: (n % 3 === 0 ? 3 : 4) * line };
}

type Grid = ReturnType<typeof gridOf>;
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Espera (s) de `x` (s desde a origem da grade) até a próxima linha de `step` que esteja a pelo menos `min` s. */
export const untilLine = (x: number, step: number, min = LEAD_S) => Math.ceil((x + min) / step - 1e-9) * step - x;

/** Em que batida do compasso (0, 1, 2…) cai `x` (s desde a origem da grade, numa linha de batida). */
export const beatOf = (x: number, g: Grid) => Math.round(mod(x, g.bar) / g.pulse) % Math.round(g.bar / g.pulse);

/**
 * Troca de tela encaixada no tempo da faixa que sai (`x` = s desde a origem da grade dela): na linha do compasso se
 * ela chega em até BAR_WAIT_S, senão na próxima batida. `beatOnly` (andamentos que casam): sempre na batida.
 */
export function swapWait(x: number, g: Grid, beatOnly = false): number {
    const bar = untilLine(x, g.bar);
    return !beatOnly && bar <= BAR_WAIT_S ? bar : untilLine(x, g.pulse);
}

/** Pulsos que casam: mesmo andamento (até 4% de diferença, que some na troca de 30 ms) ou o dobro, ou a metade. */
export const sameTempo = (a: number, b: number) => [0.5, 1, 2].some((k) => Math.abs(a / b / k - 1) <= 0.04);

/**
 * Onde a faixa nova entra quando os andamentos casam: na mesma batida do compasso em que a outra está (entrou na 3ª
 * batida, começa da 3ª batida dela), contada a partir de `start` (começo do trecho ou da introdução).
 */
export const phaseOffset = (beat: number, g: Grid) => mod(beat * g.pulse, g.bar);

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

/** Posição (s) no arquivo no tempo `t` do contexto. */
function posAt(p: Playing, t: number): number {
    const x = p.off + t - p.t0;
    const { inicio, fim, loop } = p.sec;
    return loop && x >= fim ? inicio + ((x - inicio) % (fim - inicio)) : x;
}

/** Posição (s) no arquivo agora (`heard`: a que se ouve, pro olho cair junto do ouvido). */
const position = (p: Playing, heard = false) => posAt(p, heard ? heardTime() : ctx().currentTime);

/** Segundos desde a origem da grade (o começo do trecho; a introdução fica antes, em compassos inteiros). */
const gridX = (p: Playing, t: number) => posAt(p, t) - p.sec.inicio;

/** O trecho ainda soa no tempo `t` (o jingle que acabou não dá mais o tempo). */
const sounding = (p: Playing, t: number) => p.sec.loop || posAt(p, t) < p.sec.fim;

function stopAfter(p: Playing, at: number) {
    try {
        p.src.stop(at);
    } catch {
        // já parou
    }
}

/** Ganho novo pra faixa que entra em `at`: de 0 a 1 em `ramp` s. */
function rampIn(at: number, ramp: number): GainNode {
    const g = ctx().createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(1, at + ramp);
    g.connect(bus());
    return g;
}

/** Troca de trecho da mesma faixa: o novo entra em `at` (linha do compasso) num ganho próprio; o velho some nos 10 ms antes. */
function switchSection(p: Playing, sec: Section, at: number): Playing {
    // trecho de entrada sem loop colado no loop (virada -> pressao): entra por ele
    const off = leadIn(p.loaded, sec)?.inicio ?? sec.inicio;
    const gain = ctx().createGain();
    gain.connect(bus());
    const g = p.gain.gain;
    const from = Math.max(ctx().currentTime, at - CUT_S);
    g.cancelScheduledValues(from);
    g.setValueAtTime(1, from);
    g.linearRampToValueAtTime(0, at);
    stopAfter(p, at + 0.01);
    leaving = p;
    return { ...p, sec, gain, t0: at, off, src: makeSource(p.loaded, sec, gain, at, off) };
}

async function apply() {
    const { id } = want;
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
    // e o trecho também: vale o último pedido
    const sec = sectionOf(loaded, want.section);
    const now = c.currentTime;
    if (current && current.id === id) {
        // mesma faixa, outro trecho: troca na linha do compasso (o trecho que ainda vai entrar troca na mesma hora)
        if (current.sec !== sec)
            current = switchSection(
                current,
                sec,
                now + untilLine(gridX(current, now), gridOf(loaded, current.sec).bar),
            );
        return;
    }
    const start = leadIn(loaded, sec)?.inicio ?? sec.inicio;
    const g = gridOf(loaded, sec);
    // faixa nova, encaixada no tempo da que sai: troca agendada que ainda não soou cede o lugar (mesma hora, mesma batida)
    let ref = current;
    let at = now;
    if (current && current.t0 > now + LEAD_S) {
        at = current.t0;
        ref = leaving;
        current.gain.gain.cancelScheduledValues(now);
        current.gain.gain.setValueAtTime(0, now);
        stopAfter(current, now);
    } else if (current) {
        leaving = current;
    }
    let off = start;
    if (ref && sounding(ref, at)) {
        const rg = gridOf(ref.loaded, ref.sec);
        const same = sameTempo(rg.pulse, g.pulse);
        if (at === now) at += swapWait(gridX(ref, now), rg, same);
        if (same && sec.loop) off += phaseOffset(beatOf(gridX(ref, at), rg), g);
    }
    if (ref && ref === current) fadeOut(ref, at);
    const gain = rampIn(at, ref ? IN_S : FADE_S);
    current = { id, loaded, gain, sec, t0: at, off, src: makeSource(loaded, sec, gain, at, off) };
    prune();
    lastPos = off - 0.001;
    startHits();
}

/** A faixa sai: fica inteira até `at` e decai dali (troca no tempo), ou some em 250 ms já (silêncio). */
function fadeOut(p: Playing | null, at?: number) {
    if (!p) return;
    const now = ctx().currentTime;
    const g = p.gain.gain;
    g.cancelScheduledValues(now);
    if (at === undefined) {
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + FADE_S);
        stopAfter(p, now + FADE_S + 0.05);
        return;
    }
    g.setValueAtTime(g.value, now);
    g.setTargetAtTime(0, at, OUT_TAU);
    stopAfter(p, at + 8 * OUT_TAU);
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

/** A Abertura está saindo no alto-falante (áudio liberado, volume acima de zero): as piscadas do logo seguem o som. */
export function aberturaAudible(): boolean {
    return !!zz && current?.id === 'abertura-gancho' && level() > 0 && ctx().state === 'running';
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
