/**
 * Música das telas: faixas Opus `.webm` (reserva `.mp3`) em `public/music/<faixa>` + `.json` de trechos (loop, BPM), baixadas só quando a
 * tela pede. Toca no mesmo AudioContext dos efeitos (ZzFX), sem importar `phaser` (a Home usa este módulo).
 * Loop sem costura por `loopStart`/`loopEnd`. Troca de tela encaixada no tempo da faixa que sai (próxima batida, ou o
 * compasso se ele chega em até 0,7 s; andamentos que casam entram na mesma batida); a tela não espera, só o áudio.
 * Troca de trecho na linha do compasso. Avançar na copa: virada de bateria + ponte de 1 compasso (`Move`, `planOf`).
 */
import { type BuildSamples, mixVirada, wavMono } from './virada';

export type TrackId =
    | 'abertura-gancho'
    | 'mercado-funk'
    | 'estrada-da-vitoria'
    | 'planalto-indigo'
    | 'campeao'
    | 'tema-brock'
    | 'tema-misty'
    | 'tema-rocket'
    | 'tema-ltsurge'
    | 'tema-erika'
    | 'tema-koga'
    | 'tema-sabrina'
    | 'tema-blaine'
    | 'tema-giovanni'
    | 'ultima-partida'
    | `penaltis-${'espera' | 'ganhou' | 'perdeu'}`
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
    /** Cada SOC-CER-MON da faixa: as 3 batidas (s no arquivo), achadas nas notas pelo `scripts/musica/ganchos.mjs`. */
    gancho?: { hits: number[][] };
    /** Swing da peça (fração da linha) e em que nota ele cai (16 = semicolcheias ímpares, 8 = colcheias do contratempo). */
    swing?: number;
    swingEm?: 8 | 16;
    /** Mudanças de andamento dentro de um trecho: [s no arquivo (linha do compasso), bpm]. */
    tempos?: [number, number][];
}
interface Loaded {
    buf: AudioBuffer;
    meta: Meta;
    /** Atraso (s) do começo do arquivo que o navegador não cortou (mp3 no WebKit): os tempos do `.json` andam isso. */
    shift: number;
}
/** Faixa tocando: um nó de ganho próprio (pro crossfade), o passa-baixa (a virada fecha) e a fonte do trecho atual. */
interface Playing {
    id: TrackId;
    loaded: Loaded;
    gain: GainNode;
    lp: BiquadFilterNode;
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
/** Mexer no slider de volume: constante de tempo da rampa (s), sem estalo. */
const VOL_TAU = 0.03;
/** Corte da troca de trecho: o trecho que sai some nos últimos 10 ms antes da linha (sem estalo). */
const CUT_S = 0.01;
/** Antecedência mínima pra agendar no AudioContext (s). */
const LEAD_S = 0.03;
/** Troca de tela espera a linha do compasso só se ela chega em até isso (s); senão, a próxima batida. */
export const BAR_WAIT_S = 0.7;
/** A virada começa na batida que esteja a pelo menos isso (s): dá tempo de montar o som dela antes. */
const FILL_LEAD_S = 0.1;
const vol = { master: 0.6, music: 0.4 };
/** Só o que está em uso (`prune`): cada faixa decodificada ocupa ~25-50 MB (28 faixas juntas passavam de 690 MB). */
const cache = new Map<string, Promise<Loaded | null>>();
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
let want: { id: TrackId | null; section?: string; move?: Move } = { id: null };

/**
 * Regras da troca de tela (aprovadas pelo Miguel em 22/10/2026, a C da demo A/B/C):
 * 1. `avanca` (Home → Draft → Escalação, Resultado, mapa → Mercado…): virada no andamento da faixa que sai até o 1 do
 *    compasso seguinte, depois a PONTE (1 compasso no tom e no andamento da que entra, com o som dela), depois a faixa.
 * 2. `partida` (entrar na partida, ou no tema do líder no VERSUS): igual, e a ponte tem riser e prato no 1.
 * 3. `volta` (Home, botão de sair, voltar do Android) ou sem `move`: só encaixada no tempo (`swapWait`).
 * 4. Navegou de novo antes da ponte acabar: cancela virada e ponte; a mais nova entra na próxima batida (nunca duas viradas).
 * 5. A mesma troca (faixa → faixa) de novo em até REPEAT_S: só a virada, sem a ponte.
 */
export type Move = 'avanca' | 'volta' | 'partida';
export type Plan = 'tempo' | 'virada' | 'ponte' | 'corta';
export const REPEAT_S = 30;
/** Qual regra vale: `pending` = virada ou ponte ainda tocando; `since` = s desde a mesma troca (faixa → faixa). */
export function planOf(o: { move?: Move; pending?: boolean; since?: number }): Plan {
    if (o.pending) return 'corta';
    if (o.move !== 'avanca' && o.move !== 'partida') return 'tempo';
    return o.since !== undefined && o.since < REPEAT_S ? 'virada' : 'ponte';
}
/** Faixas com ponte (`public/music/ponte-<id>`, `scripts/musica/pontes.mjs`); as outras ficam só com a virada. */
export const PONTES: ReadonlySet<TrackId> = new Set<TrackId>([
    'draft',
    'escalacao',
    'recompensa',
    'mercado-funk',
    'rota-1',
    'mt-moon',
    'cerulean',
    'estrada-da-vitoria',
    'planalto-indigo',
    'vitoria-gancho',
    'derrota',
    'eliminado',
    'campeao',
    'partida-1t',
    'tema-brock',
    'tema-misty',
    'tema-rocket',
    'tema-ltsurge',
    'tema-erika',
    'tema-koga',
    'tema-sabrina',
    'tema-blaine',
    'tema-giovanni',
]);
/** Swing (fração da semicolcheia, o `swing` da peça) das faixas que balançam: a virada balança junto. */
const SWING: Partial<Record<TrackId, number>> = {
    'abertura-gancho': 0.15,
    draft: 0.1,
    recompensa: 0.1,
    'mercado-funk': 0.14,
    'tema-rocket': 0.12,
    'partida-1t': 0.06,
    'partida-2t': 0.06,
};
/** Virada e ponte em curso: até `end` (a faixa nova entra) navegar de novo cancela (regra 4). */
interface Trans {
    end: number;
    fill: Shot | null;
    ponte: (Shot & { g: Grid; l: Lines }) | null;
}
interface Shot {
    src: AudioBufferSourceNode;
    gain: GainNode;
    at: number;
}
let trans: Trans | null = null;
/** Hora (contexto) da última troca com virada de cada par `de>para` (regra 5). */
const lastPair = new Map<string, number>();
/** Linha do tempo das trocas no AudioContext; em dev fica em `window.__musica` (o teste do navegador lê). */
export const musicTrace: { ev: string; id: string | null; now: number; at: number; fim?: number }[] = [];
if (import.meta.env?.DEV && typeof window !== 'undefined')
    (window as unknown as { __musica: typeof musicTrace }).__musica = musicTrace;
const trace = (ev: string, id: string | null, now: number, at: number, fim?: number) => {
    if (musicTrace.length < 500) musicTrace.push({ ev, id, now, at, ...(fim !== undefined && { fim }) });
};
let gestureHooked = false;
let raf = 0;
let lastPos = 0;
const hitListeners = new Set<(i: number) => void>();
const beatListeners = new Set<(beat: number) => void>();
/** Batidas do gancho que não vêm do arquivo (o SOC-CER-MON da virada): hora do contexto e qual das 3. */
let extraHits: { t: number; i: number }[] = [];
if (import.meta.env?.DEV && typeof window !== 'undefined')
    // o teste do navegador lê o relógio (a ordem das declarações não importa: só é chamado depois)
    (window as unknown as { __relogio: object }).__relogio = {
        beatNow: () => beatNow(),
        nextBeatIn: (sub?: boolean) => nextBeatIn(sub),
        musicLines: (n: number) => musicLines(n),
        heardAt: (sec: number) => heardAt(sec),
    };

/** zzfx cria o AudioContext ao ser importado: só entra quando a música toca (e não nos testes, que não têm áudio). */
let zz: typeof import('zzfx') | null = null;
const ctx = (): AudioContext => (zz as typeof import('zzfx')).ZZFX.audioContext;
const level = () => vol.master * vol.music;

/** Onde as faixas entram: o volume da música. */
function bus(): GainNode {
    if (!out) {
        out = ctx().createGain();
        out.connect(ctx().destination);
        out.gain.value = level();
    }
    return out;
}

/** Volume geral e da música (0..1). Zero desliga de vez (nem baixa); saiu do zero, volta a faixa da tela. */
export function setMusicVolumes(v: { master?: number; music?: number }) {
    const was = level();
    if (typeof v.master === 'number') vol.master = v.master;
    if (typeof v.music === 'number') vol.music = v.music;
    // rampa curta: `gain.value` direto num valor novo é um degrau, e o degrau estala
    if (out) out.gain.setTargetAtTime(level(), ctx().currentTime, VOL_TAU);
    if ((was === 0) !== (level() === 0)) void apply();
}

/** Opus em WebM (64 kbps) onde o navegador toca; mp3 de reserva (Safari antigo, ou se o webm não decodificar). */
const ext = () =>
    !webmBroken && document.createElement('audio').canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'mp3';

async function fetchDecode(id: string, meta: Meta): Promise<Loaded> {
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

function load(id: string): Promise<Loaded | null> {
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
export function gridOf(l: { meta: Partial<Meta> }, sec: Pick<Section, 'bpm'>) {
    const line = 15 / sec.bpm;
    const n = l.meta.linhasPorCompasso ?? 16;
    return { bar: n * line, pulse: (n % 3 === 0 ? 3 : 4) * line };
}

type Grid = ReturnType<typeof gridOf>;
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Espera (s) de `x` (s desde a origem da grade) até a próxima linha de `step` que esteja a pelo menos `min` s. */
export const untilLine = (x: number, step: number, min = LEAD_S) => Math.ceil((x + min) / step - 1e-9) * step - x;

/**
 * Hora (contexto) da troca de trecho da mesma faixa: a próxima linha do compasso, mas nunca antes de uma troca que
 * ainda não soou (`pendingAt`). Sem isso, pedir outro trecho antes do 1º entrar agendava a troca fora de ordem.
 */
export const sectionSwitchAt = (now: number, x: number, bar: number, pendingAt = 0) =>
    Math.max(now + untilLine(x, bar), pendingAt);

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

/**
 * Virada (regra 1): começa na próxima batida a pelo menos FILL_LEAD_S (`at`) e termina na linha do compasso que esteja
 * a pelo menos meia batida dela (`end`, o 1 onde entra a ponte); `beats` = 1 a 4. Segundos a partir de `x`.
 */
export function fillWindow(x: number, g: Grid) {
    const at = untilLine(x, g.pulse, FILL_LEAD_S);
    const end = at + untilLine(x + at, g.bar, g.pulse / 2);
    return { at, end, beats: Math.round((end - at) / g.pulse) };
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

/** Ganho novo pra faixa que entra em `at` (de 0 a 1 em `ramp` s), passando por um passa-baixa aberto (a virada fecha). */
function rampIn(at: number, ramp: number): { gain: GainNode; lp: BiquadFilterNode } {
    const g = ctx().createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(1, at + ramp);
    const lp = ctx().createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0;
    lp.frequency.value = ctx().sampleRate / 2;
    g.connect(lp);
    lp.connect(bus());
    return { gain: g, lp };
}

/** Toca um som pronto (virada, ponte) em `at`, num ganho próprio (pra cancelar sem estalo). */
function shot(buf: AudioBuffer, at: number, off = 0): Shot {
    const gain = ctx().createGain();
    gain.connect(bus());
    const src = ctx().createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.start(at, off);
    return { src, gain, at };
}
/** Cala um som pronto a partir de `at` (decai em OUT_TAU; se ainda não começou, nem toca). */
function hush(s: Shot | null, at: number) {
    if (!s) return;
    const now = ctx().currentTime;
    s.gain.gain.cancelScheduledValues(now);
    s.gain.gain.setValueAtTime(1, now);
    s.gain.gain.setTargetAtTime(0, at, OUT_TAU);
    try {
        // ainda não começou: nem toca
        s.src.stop(at <= s.at ? s.at : at + 8 * OUT_TAU);
    } catch {
        // já parou
    }
}

/** O clap 808 da virada (`public/music/clap-808.wav`, 16 bits mono a 44,1 kHz). Sem ele, a virada sai sem clap. */
let clapP: Promise<Float32Array | null> | null = null;
const loadClap = () =>
    (clapP ??= fetch('music/clap-808.wav')
        .then((r) => r.arrayBuffer())
        .then(wavMono)
        .catch(() => {
            clapP = null;
            return null;
        }));

/** A virada (já no nível) como AudioBuffer a 44,1 kHz. */
function fillBuffer(o: Parameters<typeof mixVirada>[0]): AudioBuffer {
    const Z = (zz as typeof import('zzfx')).ZZFX;
    const build = (Z as unknown as { buildSamples: BuildSamples }).buildSamples.bind(Z);
    const [L, R] = mixVirada(o, build, Z.sampleRate);
    const b = ctx().createBuffer(2, L.length, Z.sampleRate);
    b.copyToChannel(L, 0);
    b.copyToChannel(R, 1);
    return b;
}

/** Próxima batida (s a partir de `now`) do que está soando: a ponte, ou a faixa que sai (durante a virada). */
function nextBeat(now: number): number {
    const p = trans?.ponte;
    if (p && now >= p.at) return untilLine(now - p.at, p.g.pulse);
    if (leaving && leaving.t0 <= now && sounding(leaving, now))
        return untilLine(gridX(leaving, now), gridOf(leaving.loaded, leaving.sec).pulse);
    return LEAD_S;
}

/** Troca de trecho da mesma faixa: o novo entra em `at` (linha do compasso) num ganho próprio; o velho some nos 10 ms antes. */
function switchSection(p: Playing, sec: Section, at: number): Playing {
    // trecho de entrada sem loop colado no loop (virada -> pressao): entra por ele
    const off = leadIn(p.loaded, sec)?.inicio ?? sec.inicio;
    const gain = ctx().createGain();
    gain.connect(p.lp);
    const g = p.gain.gain;
    const from = Math.max(ctx().currentTime, at - CUT_S);
    g.cancelScheduledValues(from);
    g.setValueAtTime(1, from);
    g.linearRampToValueAtTime(0, at);
    stopAfter(p, at + 0.01);
    // quem sai da tela é a faixa que está soando; uma troca que ainda não soou nunca chega a ser "a que sai"
    if (p.t0 <= ctx().currentTime) leaving = p;
    return { ...p, sec, gain, t0: at, off, src: makeSource(p.loaded, sec, gain, at, off) };
}

async function apply() {
    const { id, move } = want;
    // silêncio ou volume zero: nada de baixar nem decodificar
    if (id === null || level() === 0) {
        if (trans) {
            const now = ctx().currentTime;
            hush(trans.fill, now);
            hush(trans.ponte, now);
            extraHits = [];
            fadeOut(leaving);
            trans = null;
        }
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
    // a regra (pra saber o que baixar junto): ponte e clap só quando a troca vai ter virada
    const pair = current ? `${current.id}>${id}` : '';
    const first = current && current.id !== id ? planOf({ move, since: since(pair, c.currentTime) }) : 'tempo';
    const [loaded, ponte, clap] = await Promise.all([
        load(id),
        first === 'ponte' && PONTES.has(id) ? load(`ponte-${id}`) : null,
        first !== 'tempo' ? loadClap() : null,
    ]);
    // a tela (ou o volume) pode ter mudado enquanto baixava
    if (!loaded || want.id !== id || level() === 0) return;
    // e o trecho também: vale o último pedido
    const sec = sectionOf(loaded, want.section);
    const now = c.currentTime;
    if (trans && trans.end <= now) trans = null;
    if (current && current.id === id) {
        // mesma faixa, outro trecho: troca na linha do compasso (o trecho que ainda vai entrar troca na mesma hora)
        if (current.sec !== sec)
            current = switchSection(
                current,
                sec,
                sectionSwitchAt(
                    now,
                    gridX(current, now),
                    gridOf(loaded, current.sec).bar,
                    current.t0 > now ? current.t0 : 0,
                ),
            );
        return;
    }
    const start = leadIn(loaded, sec)?.inicio ?? sec.inicio;
    const g = gridOf(loaded, sec);
    // o pedido pode ter esperado o download: a faixa que soa agora é a que vale pro par
    const key = current ? `${current.id}>${id}` : pair;
    const plan = current ? planOf({ move, pending: !!trans, since: since(key, now) }) : 'tempo';
    if (plan === 'corta' && current) {
        // regra 4: cancela a virada e a ponte; a mais nova entra na próxima batida do que está soando
        const at = now + nextBeat(now);
        const t = trans as Trans;
        hush(t.fill, at);
        extraHits = extraHits.filter((x) => x.t < at);
        hush(t.ponte, at);
        current.gain.gain.cancelScheduledValues(now);
        current.gain.gain.setValueAtTime(0, now);
        stopAfter(current, now);
        trans = null;
        const back = leaving;
        // voltou pra faixa que ainda sai (a virada não acabou): ela fica, sem recomeçar
        if (back && back.id === id && back.sec.nome === sec.nome && now < (t.ponte?.at ?? t.end) - LEAD_S) {
            undoFill(back, now, at);
            current = back;
            leaving = null;
            trace('volta', id, now, at);
            prune();
            return;
        }
        fadeOut(back, at);
        enter(id, loaded, sec, at, start, IN_S);
        trace('corta', id, now, at);
        return;
    }
    const playing = current && current.t0 <= now && sounding(current, now) ? current : null;
    const ponteOk = plan === 'ponte' && ponte ? ponte : null;
    if (playing && (plan === 'virada' || plan === 'ponte')) {
        // regras 1, 2 e 5: virada no andamento da que sai até o 1; a que sai vai pro fundo (passa-baixa fechando)
        const rg = gridOf(playing.loaded, playing.sec);
        const w = fillWindow(gridX(playing, now), rg);
        const lines = (playing.loaded.meta.linhasPorCompasso ?? 16) % 3 ? 4 : 3;
        const buf = fillBuffer({
            beats: w.beats,
            pulse: rg.pulse,
            swing: lines === 4 ? ((SWING[playing.id] ?? 0) * rg.pulse) / 4 : 0,
            crash: move === 'partida' && !ponteOk,
            clap,
        });
        const fillAt = now + w.at;
        const D = now + w.end;
        const fill = shot(buf, fillAt);
        // a virada termina no SOC-CER-MON (linhas 8, 11 e 14 do compasso dela): o logo pisca junto
        if (w.beats >= 2) {
            const sw = lines === 4 ? ((SWING[playing.id] ?? 0) * rg.pulse) / 4 : 0;
            extraHits = [8, 11, 14].map((row, i) => ({
                t: fillAt + ((row - 16 + 4 * w.beats) / 4) * rg.pulse + (row % 2 ? sw : 0),
                i,
            }));
            startHits();
        }
        const lp = playing.lp.frequency;
        lp.cancelScheduledValues(now);
        lp.setValueAtTime(9000, fillAt);
        lp.exponentialRampToValueAtTime(1000, D);
        const pg = playing.gain.gain;
        pg.cancelScheduledValues(now);
        pg.setValueAtTime(1, fillAt);
        pg.linearRampToValueAtTime(0.75, D);
        pg.setTargetAtTime(0, D, OUT_TAU);
        stopAfter(playing, D + 8 * OUT_TAU);
        leaving = playing;
        let t0 = D;
        let p: Trans['ponte'] = null;
        if (ponteOk) {
            const ps = ponteOk.meta.secoes[0];
            p = { ...shot(ponteOk.buf, D, ponteOk.shift), g: gridOf(ponteOk, ps), l: linesOf(ponteOk.meta, ps.bpm) };
            t0 = D + ps.fim;
        }
        trans = { end: t0, fill, ponte: p };
        lastPair.set(key, now);
        enter(id, loaded, sec, t0, start, IN_S);
        trace(p ? 'ponte' : 'virada', id, now, fillAt, t0);
        if (p) trace('ponte-entra', `ponte-${id}`, now, D, t0);
        return;
    }
    if (ponteOk && (!current || current.t0 <= now)) {
        // a que sai já acabou (o jingle): sem tempo pra virada, a ponte entra já e a faixa no fim dela
        const at = now + LEAD_S;
        const ps = ponteOk.meta.secoes[0];
        fadeOut(current);
        trans = {
            end: at + ps.fim,
            fill: null,
            ponte: {
                ...shot(ponteOk.buf, at, ponteOk.shift),
                g: gridOf(ponteOk, ps),
                l: linesOf(ponteOk.meta, ps.bpm),
            },
        };
        lastPair.set(key, now);
        enter(id, loaded, sec, at + ps.fim, start, IN_S);
        trace('ponte', id, now, at, at + ps.fim);
        return;
    }
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
    enter(id, loaded, sec, at, off, ref ? IN_S : FADE_S);
    trace('tempo', id, now, at);
}

/** Segundos desde a última troca com virada do par `de>para` (regra 5); nunca houve: undefined. */
const since = (pair: string, now: number) => {
    const t = lastPair.get(pair);
    return t === undefined ? undefined : now - t;
};

/** A faixa nova entra em `at` (de `off` no arquivo), subindo em `ramp`. */
function enter(id: TrackId, loaded: Loaded, sec: Section, at: number, off: number, ramp: number) {
    const { gain, lp } = rampIn(at, ramp);
    current = { id, loaded, gain, lp, sec, t0: at, off, src: makeSource(loaded, sec, gain, at, off) };
    prune();
    startHits();
}

/** Desfaz a saída de uma faixa no meio da virada: o volume volta já e o passa-baixa abre até a batida `at`. */
function undoFill(p: Playing, now: number, at: number) {
    const g = p.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + IN_S);
    const f = p.lp.frequency;
    f.cancelScheduledValues(now);
    f.setValueAtTime(f.value, now);
    f.exponentialRampToValueAtTime(ctx().sampleRate / 2, at);
    // a fonte tinha parada marcada pro fim da virada: para na batida (a última parada vale) e uma igual, do mesmo
    // ponto, continua dali, sem emenda
    const off = posAt(p, at);
    stopAfter(p, at);
    Object.assign(p, { src: makeSource(p.loaded, p.sec, p.gain, at, off), t0: at, off });
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

/**
 * Pede a faixa da tela (null = silêncio). Mesma faixa em duas telas segue tocando; `section` troca o trecho; `move`
 * diz a regra da troca (avançar: virada e ponte; voltar ou nada: só no tempo).
 */
export function playMusic(id: TrackId | null, section?: string, move?: Move) {
    want = { id, section, move };
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

/** Avisa quando cai uma das 3 batidas de um SOC-CER-MON da faixa que toca, ou da virada (0, 1, 2). */
export function onGanchoHit(cb: (i: number) => void) {
    hitListeners.add(cb);
    startHits();
    return () => {
        hitListeners.delete(cb);
    };
}

/** Avisa a cada batida que sai no alto-falante (`beat` = 0 no 1 do compasso). */
export function onBeat(cb: (beat: number) => void) {
    beatListeners.add(cb);
    startHits();
    return () => {
        beatListeners.delete(cb);
    };
}

/** Avisa no 1 de cada compasso. */
export const onBar = (cb: () => void) => onBeat((b) => b === 0 && cb());

/** Tem música saindo no alto-falante (áudio liberado, volume acima de zero): o logo segue o som dela. */
export function musicAudible(): boolean {
    return !!zz && !!current && level() > 0 && ctx().state === 'running';
}

/** Grade de linhas do relógio (16 avos; no 12/8, colcheias): duração da linha, linhas por compasso e swing. */
export interface Lines {
    row: number;
    lines: number;
    swing?: number;
    swingEm?: 8 | 16;
}
const linesOf = (meta: Partial<Meta>, bpm: number): Lines => ({
    row: 15 / bpm,
    lines: meta.linhasPorCompasso ?? 16,
    swing: meta.swing ?? 0,
    swingEm: meta.swingEm ?? 16,
});
/** Linhas por batida (4; no 12/8, 3) ou por subdivisão (`sub`: colcheia = 2; no 12/8, 1). */
export const stepOf = (l: Lines, sub = false) => (l.lines % 3 === 0 ? (sub ? 1 : 3) : sub ? 2 : 4);
/** Atraso do swing na linha `t` (em linhas), como no `synth.mjs`: semicolcheias ímpares, ou colcheias do contratempo. */
const lateOf = (l: Lines, t: number) => {
    const k = mod(t, l.lines);
    return (l.swingEm === 8 ? k % 4 === 2 : k % 2 === 1) ? (l.swing ?? 0) * (l.swingEm === 8 ? 2 : 1) : 0;
};
/**
 * Próxima linha múltipla de `step` a pelo menos `min` s de `x` (s desde a origem da grade, no 1 de um compasso):
 * `d` = espera (s), `t` = a linha (pra saber em que batida do compasso cai).
 */
export function nextLine(x: number, l: Lines, step: number, min = 0): { d: number; t: number } {
    for (let t = Math.floor(x / l.row / step) * step - step; ; t += step) {
        const d = (t + lateOf(l, t)) * l.row - x;
        if (d >= min - 1e-9) return { d, t };
    }
}
/** Espera (s) até as próximas `n` linhas múltiplas de `step`, a partir de `min` s. */
export function linesAhead(x: number, l: Lines, step: number, n: number, min = 0): number[] {
    const out: number[] = [];
    let m = min;
    while (out.length < n) {
        const { d } = nextLine(x, l, step, m);
        out.push(d);
        m = d + 1e-6;
    }
    return out;
}

/**
 * O que se ouve agora (hora do contexto `h`): a ponte, a faixa (ou a que sai, durante a virada), com a posição na
 * grade dela. Mudança de andamento dentro do trecho (`tempos`): a grade recomeça na linha do compasso dela.
 */
function heard(h: number): { x: number; l: Lines } | null {
    const pt = trans?.ponte;
    if (pt && trans && h >= pt.at && h < trans.end) return { x: h - pt.at, l: pt.l };
    const p = current && h >= current.t0 ? current : leaving && h >= leaving.t0 ? leaving : null;
    if (!p || !sounding(p, h)) return null;
    const pos = posAt(p, h);
    let origin = p.sec.inicio;
    let bpm = p.sec.bpm;
    for (const [t, b] of p.loaded.meta.tempos ?? [])
        if (t > p.sec.inicio && t <= pos && t < p.sec.fim) [origin, bpm] = [t, b];
    return { x: pos - origin, l: linesOf(p.loaded.meta, bpm) };
}

const clock = () => (zz && ctx().state === 'running' && level() > 0 ? heard(heardTime()) : null);

/** Segundos até a próxima batida que se ouve (`sub`: a próxima colcheia, com swing); sem música, null. */
export function nextBeatIn(sub = false): number | null {
    const c = clock();
    return c && nextLine(c.x, c.l, stepOf(c.l, sub)).d;
}

/** Segundos até o próximo 1 de compasso que se ouve; sem música, null. */
export function nextBarIn(): number | null {
    const c = clock();
    return c && nextLine(c.x, c.l, c.l.lines).d;
}

/** Andamento e fase de agora: `bpm` do pulso (no 12/8, a semínima pontuada), `beat` no compasso, `phase` 0..1 na batida. */
export function beatNow(): { bpm: number; beat: number; beats: number; phase: number } | null {
    const c = clock();
    if (!c) return null;
    const step = stepOf(c.l);
    const pulse = step * c.l.row;
    const { d, t } = nextLine(c.x, c.l, step, 1e-6);
    const beats = c.l.lines / step;
    return { bpm: 60 / pulse, beat: mod(t / step - 1, beats), beats, phase: Math.min(1, Math.max(0, 1 - d / pulse)) };
}

/** Batida longa (acima disso, s) conta em colcheias quando a tela quer um evento por linha (cartas virando). */
export const SLOW_BEAT_S = 0.45;

/**
 * Linhas pra marcar eventos de tela no tempo (ms a partir de agora, que se ouvem): as próximas `n` batidas, ou
 * colcheias se a batida passa de SLOW_BEAT_S, seguindo o que vai soar (no meio de uma troca: a virada no andamento
 * da que sai, a ponte e a faixa nova). `beat` = ms de uma batida agora. Sem música, null.
 */
export function musicLines(n: number): { lines: number[]; beat: number } | null {
    if (!clock()) return null;
    const h = heardTime();
    const lines: number[] = [];
    let beat = 0;
    for (let t = h; lines.length < n; ) {
        const c = heard(t);
        if (!c) break;
        const b = stepOf(c.l) * c.l.row;
        beat ||= b;
        t += nextLine(c.x, c.l, stepOf(c.l, b > SLOW_BEAT_S), lines.length ? 1e-4 : 0).d;
        lines.push((t - h) * 1000);
    }
    return { lines, beat: beat * 1000 };
}

/** Hora do contexto em que um som agendado agora sai no alto-falante daqui a `sec` s (sem áudio, undefined). */
export const heardAt = (sec: number): number | undefined => (zz ? heardTime() + sec : undefined);

/**
 * Revelação no tempo (cartas do pacote): cada evento cai numa das `lines` (ms a partir de agora, crescentes) — o 1º
 * na primeira a partir do seu horário (`base`, ms), os outros na seguinte que guarde o espaço do `base` entre eles
 * (no mínimo uma linha depois). O 1º nunca espera mais que uma linha. Faltou linha: fica no horário pedido.
 */
export function onLines(base: readonly number[], lines: readonly number[]): number[] {
    const out: number[] = [];
    let j = 0;
    base.forEach((b, i) => {
        const min = i === 0 ? b : out[i - 1] + Math.max(1, b - base[i - 1]);
        while (j < lines.length && lines[j] < min - 0.5) j++;
        out.push(j < lines.length ? lines[j++] : Math.max(min, b));
    });
    return out;
}

/** Batida do gancho que passou há mais que isso (s), num quadro que travou ou na aba que voltou: não pisca atrasada. */
const LATE_S = 0.15;
let lastP: Playing | null = null;
/** O tempo que se ouve anda em saltos (`getOutputTimestamp`) e às vezes volta uns ms: o relógio dos quadros não volta. */
let lastH = 0;
let beatAt = Number.POSITIVE_INFINITY;
let beatT = 0;
function startHits() {
    if (raf || typeof requestAnimationFrame === 'undefined') return;
    const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!zz || (hitListeners.size === 0 && beatListeners.size === 0)) return;
        const h = Math.max(heardTime(), lastH);
        lastH = h;
        // a virada
        for (const x of extraHits)
            if (x.t <= h && h - x.t < LATE_S) {
                trace('gancho-virada', null, h, x.t);
                for (const f of hitListeners) f(x.i);
            }
        extraHits = extraHits.filter((x) => x.t > h);
        // o relógio: avisa quando a batida esperada passa, e mira a próxima
        const c = beatListeners.size ? heard(h) : null;
        if (c) {
            const step = stepOf(c.l);
            if (h >= beatAt) for (const f of beatListeners) f(mod(beatT / step, c.l.lines / step));
            const n = nextLine(c.x, c.l, step, 1e-4);
            beatAt = h + n.d;
            beatT = n.t;
        } else beatAt = Number.POSITIVE_INFINITY;
        // o gancho da faixa: as batidas que passaram desde o último quadro (trecho novo recomeça a conta)
        const p = current;
        const hits = p?.loaded.meta.gancho?.hits;
        if (!p || !hits || hitListeners.size === 0) return;
        const pos = posAt(p, h);
        if (pos < p.off) return; // ainda não saiu no alto-falante
        if (p !== lastP) {
            lastP = p;
            lastPos = p.off - 0.001;
        }
        // voltou mais de 1 s: deu a volta no loop (a posição só volta assim; troca de faixa ou trecho recomeça acima)
        const wrapped = pos < lastPos - 1;
        if (pos < lastPos && !wrapped) return;
        for (const g of hits)
            g.forEach((t, i) => {
                const passed = wrapped ? t > lastPos || (t >= p.sec.inicio && t <= pos) : t > lastPos && t <= pos;
                if (passed && (wrapped || pos - t < LATE_S)) {
                    trace('gancho', p.id, h, t, pos);
                    for (const f of hitListeners) f(i);
                }
            });
        lastPos = pos;
    };
    raf = requestAnimationFrame(tick);
}
