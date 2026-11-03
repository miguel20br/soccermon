import { type CSSProperties, memo, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { ZZFX, zzfx } from 'zzfx';
import FEET from '../../data/sprite-feet.json';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { cardTypeOf, editionOf, ICONS } from '../../engine/specials';
import { playCrowd, playCry, playMax, playSfx, SFX, type SfxName } from '../../game/audio';
import type { MaxSound } from '../../game/max-sfx';
import { duckMusic, unduckMusic } from '../../game/music';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { ClockCtx, type SceneClock, type Tick } from '../ambientes/clock';
import { type FieldAnim, FieldSprite } from '../ambientes/FieldSprite';
import { KantoBadge } from '../components/BadgeCase';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { TypeIcon } from '../components/TypeIcon';
import { reduceMotionOn } from '../settings-sync';
import { TYPE_COLOR } from '../type-colors';
import { uiZoom } from '../ui-zoom';
import { MomentWipe } from './MomentWipe';
import {
    type Entry,
    entryOf,
    habitatOf,
    nextBeat,
    placeName,
    SKIP_AFTER_MS,
    upgradeOf,
    type WalkPlan,
    type WalkTier,
    walkoutPlan,
    walkoutTier,
} from './walkout-plan';
import './walkout.css';

/*
 * Walkout em 3 níveis, versão React/CSS (pesquisas/ut-walkout.md, opção B "túnel do ginásio"). Tudo sai de um relógio
 * só (`t`, ms desde o começo): cada camada calcula transform/opacity a partir dele, as partículas desenham num canvas
 * 2D pequeno e os sprites PMD andam no mesmo relógio (`ClockCtx`). Assim Pular, o toque que adianta e a gravação
 * quadro a quadro (window.__wkSeek) são só "mudar o t". Laboratório: ?lab=walkout&motor=react.
 */

// ---------------------------------------------------------------- curvas
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outCubic = (k: number) => 1 - (1 - k) ** 3;
const inQuad = (k: number) => k * k;
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const outBack = (k: number) => 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2;
/** "Ligou com estalo": acende, pisca e firma (holofote). */
const clank = (t: number, at: number) => (t < at ? 0 : t < at + 50 ? 1 : t < at + 100 ? 0.35 : 1);

// ---------------------------------------------------------------- cores por nível e edição
interface Palette {
    /** Luz principal (holofote, raios, trim do portão). */
    c1: string;
    /** Segunda cor (fogos, chuva). */
    c2: string;
    /** Classe do céu. */
    sky: string;
    fire: string[];
}
const GOLD: Palette = { c1: '#ffd75e', c2: '#e0a520', sky: 'raro', fire: ['#ffd75e', '#fff3b8', '#e0a520', '#ffffff'] };
const SILVER: Palette = {
    c1: '#e8eefb',
    c2: '#9fb0cf',
    sky: 'muito',
    fire: ['#ffffff', '#dfe7f7', '#a9bbdb', '#c9f0ff'],
};
const SHINY_FIRE = ['#ffb3e1', '#b3dcff', '#c4ffc4', '#fff0b3', '#e3c4ff', '#ffffff'];
const ED_PALETTE: Record<string, Palette> = {
    icone: { c1: '#c9a6ff', c2: '#ff7ad0', sky: 'icone', fire: ['#b48cff', '#ff7ad0', '#ffffff', '#8fd8ff'] },
    destaque: { c1: '#ffd75e', c2: '#d9b23c', sky: 'destaque', fire: ['#ffd75e', '#ffffff', '#d9b23c', '#fff3b8'] },
};

function paletteOf(inst: PokemonInstance, tier: WalkTier, cracked: boolean): Palette {
    const ed = editionOf(inst);
    if (tier === 'especial' && cracked && ed && ED_PALETTE[ed]) return ED_PALETTE[ed];
    if (tier === 'especial' && !cracked) return SILVER;
    if (tier === 'raro') return GOLD;
    if (ed === 'evento') {
        const c = TYPE_COLOR[inst.special?.type ?? ''] ?? '#9fb0cf';
        return { c1: c, c2: '#ffffff', sky: 'evento', fire: [c, '#ffffff', SILVER.c1] };
    }
    if (inst.shiny) return { ...SILVER, sky: 'shiny', fire: SHINY_FIRE };
    return SILVER;
}

// ---------------------------------------------------------------- relógio (um só pra cena e pros sprites)
type Clock = SceneClock & { set(t: number): void };
function manualClock(): Clock {
    const subs = new Set<Tick>();
    let now = 0;
    return {
        get t() {
            return now;
        },
        running: true,
        sub(fn) {
            subs.add(fn);
            return () => {
                subs.delete(fn);
            };
        },
        run() {},
        set(v) {
            const dt = v - now;
            now = v;
            for (const f of subs) f(now, dt);
        },
    };
}
/** O mesmo relógio mais rápido (quem corre troca de quadro mais depressa). */
const fastClock = (c: SceneClock, k: number): SceneClock => ({
    get t() {
        return c.t * k;
    },
    running: true,
    sub: (fn) => c.sub((t, dt) => fn(t * k, dt * k)),
    run() {},
});

/** Gravação quadro a quadro: o script liga `__wkManual` antes de carregar e chama `__wkSeek(ms)` por quadro. */
interface WkWindow {
    __wkManual?: boolean;
    __wkSeek?: (ms: number) => void;
    __wkSounds?: { t: number; s: Sound }[];
    __wkRender?: (s: Sound) => number[] | null;
    __wkPlan?: WalkPlan;
}
const wkw = () => window as unknown as WkWindow;

function useTimeline() {
    const [t, setT] = useState(0);
    const tRef = useRef(0);
    const [clock] = useState(manualClock);
    useEffect(() => {
        const w = wkw();
        if (w.__wkManual) {
            w.__wkSeek = (ms) =>
                flushSync(() => {
                    tRef.current = ms;
                    clock.set(ms);
                    setT(ms);
                });
            return () => {
                w.__wkSeek = undefined;
            };
        }
        let id = 0;
        let last = -1;
        const frame = (now: number) => {
            const dt = last < 0 ? 0 : Math.min(100, now - last);
            last = now;
            tRef.current += dt;
            clock.set(tRef.current);
            setT(tRef.current);
            id = requestAnimationFrame(frame);
        };
        id = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(id);
    }, [clock]);
    const seek = (ms: number) => {
        tRef.current = ms;
        clock.set(ms);
        setT(ms);
    };
    return { t, seek, clock, tRef };
}

// ---------------------------------------------------------------- som
type Sound =
    | { k: 'sfx'; name: SfxName; pitch?: number }
    | { k: 'max'; name: MaxSound }
    | { k: 'crowd'; call: 'gol' | 'uuh'; gain: number }
    | { k: 'cry'; gain: number }
    | { k: 'zz'; name: keyof typeof ZZ };

/** Sons novos no ZzFX (sem arquivo): o BOING de assinatura, o brilho de shiny, o estouro dos fogos. */
const ZZ = {
    boing: [1, 0, 130, 0.01, 0.09, 0.28, 0, 1.2, 16, -0.9, 0, 0, 0, 0, 11, 0, 0, 0.8, 0.05],
    sparkle: [0.7, 0, 1568, 0, 0.03, 0.32, 0, 1.8, 0, 0, 523, 0.05, 0.07, 0, 0, 0, 0, 0.55, 0.05],
    pop: [1.1, 0.2, 380, 0, 0.02, 0.28, 4, 1.4, -2, 0, 0, 0, 0, 0.9, 0, 0.1, 0, 0.5, 0.06],
    tick: [0.5, 0, 1200, 0, 0.005, 0.03, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0],
} as const;

function playSound(s: Sound, inst: PokemonInstance) {
    const cries = useGame.getState().settings.cries;
    if (s.k === 'sfx') playSfx(s.name, s.pitch ?? 1);
    else if (s.k === 'max') playMax(s.name);
    else if (s.k === 'crowd') playCrowd(s.call, s.gain);
    else if (s.k === 'cry') playCry(inst.speciesId, cries, s.gain);
    else {
        try {
            zzfx(...(ZZ[s.name] as unknown as number[]));
        } catch {
            // contexto de áudio ainda bloqueado
        }
    }
}

/** Amostras (44,1 kHz) de um som do ZzFX, pro script juntar o áudio do vídeo. */
function renderSound(s: Sound): number[] | null {
    if (s.k !== 'sfx' && s.k !== 'zz') return null;
    const p = [...(s.k === 'sfx' ? SFX[s.name] : ZZ[s.name])] as number[];
    if (s.k === 'sfx') p[2] *= s.pitch ?? 1;
    return Array.from(ZZFX.buildSamples(...p));
}

/** A trilha de cada nível: o que toca em cada batida (os stingers do golpe N3 servem de rascunho, como no doc). */
function soundCues(p: WalkPlan, inst: PokemonInstance): { at: number; s: Sound }[] {
    const c: { at: number; s: Sound }[] = [];
    const add = (at: number | undefined, s: Sound) => at !== undefined && c.push({ at, s });
    if (p.kind === 'calmo') {
        add(0, { k: 'sfx', name: 'thud' });
        add(p.card, { k: 'max', name: 'golpe-n1' });
        add(p.card + 80, { k: 'cry', gain: 0.8 });
        return c;
    }
    add(0, { k: 'sfx', name: 'thud', pitch: p.tier === 'especial' ? 0.7 : 1 });
    for (let i = 0; i < p.spots; i++) add(p.sky + i * 250, { k: 'sfx', name: 'post', pitch: 0.55 + i * 0.05 });
    for (const f of p.fires) add(f + 560, { k: 'zz', name: 'pop' });
    if (p.tier === 'especial') add(p.sky, { k: 'max', name: 'especial' });
    if (inst.shiny) for (const d of [0, 180, 360]) add(p.sky + 300 + d, { k: 'zz', name: 'sparkle' });
    add(p.seal, { k: 'sfx', name: 'thud', pitch: 0.6 });
    add(p.seal, { k: 'max', name: 'tap-perfeito' });
    p.clues.forEach((cl, i) => {
        add(cl.at, { k: 'sfx', name: 'kick', pitch: 1 + i * 0.15 });
        if (i > 0) add(cl.at - 60, { k: 'sfx', name: 'move', pitch: 0.7 });
    });
    if (p.gate !== undefined) {
        add(p.gate, { k: 'sfx', name: 'post', pitch: 0.4 });
        add(p.gate + 200, { k: 'crowd', call: 'uuh', gain: 0.55 });
        // rufar acelerando até o flash
        for (let at = p.gate + 300, gap = 190; at < p.flash - 40; at += gap, gap = Math.max(45, gap * 0.86))
            add(at, { k: 'sfx', name: 'kick', pitch: 0.75 });
    }
    if (p.crack !== undefined) {
        add(p.crack, { k: 'sfx', name: 'post', pitch: 1.6 });
        add(p.crack + 150, { k: 'max', name: 'tap-perfeito' });
        add(p.crack + 150, { k: 'sfx', name: 'thud', pitch: 0.6 });
    }
    // o grito: no reveal (muito raro e especial) ou quando ele para de frente (raro)
    const cryAt = p.gate !== undefined ? p.flash + 60 : p.enter + (p.kind === 'curto' ? 80 : 700);
    add(cryAt, { k: 'cry', gain: p.tier === 'especial' ? 1 : 0.85 });
    if (p.tier === 'especial') add(p.flash + 900, { k: 'zz', name: 'boing' });
    if (p.gate !== undefined) add(p.flash, { k: 'sfx', name: 'shot', pitch: 0.8 });
    add(p.card, { k: 'max', name: p.tier === 'raro' ? 'golpe-n2' : p.tier === 'muitoRaro' ? 'golpe-n3' : 'golpe-n1' });
    if (p.tier !== 'especial') add(p.card + 150, { k: 'crowd', call: 'gol', gain: p.tier === 'raro' ? 0.4 : 0.8 });
    add(p.art, { k: 'max', name: 'stinger' });
    add(p.party, { k: 'crowd', call: 'gol', gain: 1 });
    return c.sort((a, b) => a.at - b.at);
}

// ---------------------------------------------------------------- partículas (canvas 2D, pixel de verdade)
/** Número pseudoaleatório fixo por (semente, índice): o mesmo quadro sempre desenha igual. */
const hash = (a: number, b: number) => {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

interface FxScene {
    plan: WalkPlan;
    pal: Palette;
    shiny: boolean;
    /** Cores da edição depois do upgrade (a chuva e o confete trocam de cor na rachadura). */
    late: Palette;
}

function drawFx(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, u: number, sc: FxScene) {
    ctx.clearRect(0, 0, w, h);
    const { plan } = sc;
    if (plan.kind === 'calmo') return;
    const ox = (w - 360 * u) / 2;
    const oy = (h - 640 * u) / 2;
    const px = Math.max(2, Math.round(2 * u));
    const dot = (x: number, y: number, s: number, c: string, a: number) => {
        if (a <= 0) return;
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = c;
        const q = px * s;
        ctx.fillRect(Math.round((ox + x * u) / px) * px, Math.round((oy + y * u) / px) * px, q, q);
    };
    const palAt = (at: number) => (plan.crack !== undefined && at >= plan.crack ? sc.late : sc.pal);
    // fogos: o rojão sobe 560 ms deixando rastro e abre em pixel; cai devagar com arrasto
    plan.fires.forEach((f, i) => {
        const p = palAt(f + 560);
        const x0 = [70, 290, 180, 120, 240][i % 5] + (hash(i, 1) - 0.5) * 40;
        const yb = 150 + hash(i, 2) * 90;
        const lt = t - f;
        if (lt < 0) return;
        if (lt < 560) {
            const k = outCubic(lt / 560);
            const y = lerp(660, yb, k);
            dot(x0, y, 1.5, '#fff8d8', 1);
            for (let j = 1; j < 6; j++) dot(x0 + Math.sin(lt / 30 + j) * 1.5, y + j * 7, 1, p.fire[0], 1 - j / 6);
            return;
        }
        const bt = lt - 560;
        if (bt > 1700) return;
        const n = plan.tier === 'especial' ? 72 : 52;
        const life = bt / 1700;
        for (let j = 0; j < n; j++) {
            const ang = (j / n) * Math.PI * 2 + hash(i, j) * 0.2;
            const sp = 90 + hash(j, i + 7) * 70;
            const d = sp * (1 - Math.exp(-bt / 380));
            const x = x0 + Math.cos(ang) * d;
            const y = yb + Math.sin(ang) * d + 0.00006 * bt * bt;
            const c = p.fire[j % p.fire.length];
            const tw = hash(j, Math.floor(bt / 70)) > 0.25 ? 1 : 0.3;
            dot(x, y, j % 3 === 0 ? 2 : 1.5, c, (1 - life) * 1.4 * tw);
            if (bt < 300) dot(x0, yb, 6 - bt / 60, '#ffffff', (1 - bt / 300) * 0.9);
        }
    });
    // chuva de faíscas no fundo (especial)
    if (plan.rain && t > plan.sky) {
        const a = ramp(t, plan.sky, plan.sky + 600);
        for (let j = 0; j < 70; j++) {
            const sp = 0.03 + hash(j, 3) * 0.05;
            const x = -60 + hash(j, 4) * 480 + Math.sin(t / 700 + j) * 8;
            const y = ((hash(j, 5) * 700 + (t - plan.sky) * sp) % 700) - 30;
            const p = palAt(t);
            dot(
                x,
                y,
                hash(j, 6) > 0.7 ? 1.5 : 1,
                p.fire[j % p.fire.length],
                a * (0.4 + 0.6 * hash(j, Math.floor(t / 120))),
            );
        }
    }
    // estrelinhas de shiny em volta da tela
    if (sc.shiny && t > plan.sky + 200) {
        for (let j = 0; j < 18; j++) {
            const per = 900 + hash(j, 8) * 500;
            const lt = (t + hash(j, 9) * per) % per;
            const k = lt / per;
            const edge = j % 4;
            const r = hash(j, Math.floor((t + hash(j, 9) * per) / per));
            const x = edge === 0 ? 20 + r * 320 : edge === 1 ? 20 + r * 320 : edge === 2 ? 22 : 338;
            const y = edge === 0 ? 70 : edge === 1 ? 600 : 90 + r * 460;
            const s = Math.sin(k * Math.PI);
            const c = SHINY_FIRE[j % SHINY_FIRE.length];
            // estrela de 4 pontas em pixel: miolo e 2 pixels por braço
            dot(x, y, 2, '#ffffff', s);
            for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ])
                for (const r of [4, 8])
                    dot(x + dx * r * s, y + dy * r * s, r === 4 ? 1.5 : 1, c, s * (r === 4 ? 1 : 0.7));
        }
    }
    // flashes de câmera na torcida depois da carta
    if (t > plan.card) {
        const n = plan.tier === 'raro' ? 6 : 12;
        for (let j = 0; j < n; j++) {
            const slot = Math.floor((t - plan.card) / 110) + j * 7;
            if (hash(slot, j) > 0.55) continue;
            const x = -160 + hash(slot, j + 1) * 680;
            const y = 168 + hash(slot, j + 2) * 160;
            dot(x, y, 2, '#ffffff', 0.9);
        }
    }
    // faíscas da carta (raro e curto) ou confete (muito raro na carta, especial na festa)
    const confAt = plan.tier === 'especial' ? plan.party : plan.tier === 'muitoRaro' ? plan.card + 150 : undefined;
    if (confAt !== undefined && t > confAt) {
        const p = palAt(confAt);
        const lt = t - confAt;
        const cols = plan.tier === 'muitoRaro' && !sc.shiny ? ['#ffd75e', '#fff3b8', '#ffffff', '#e0a520'] : p.fire;
        for (let j = 0; j < 110; j++) {
            const delay = hash(j, 11) * 500;
            const ct = lt - delay;
            if (ct < 0) continue;
            const x = -30 + hash(j, 12) * 420 + Math.sin(ct / 260 + j) * 14;
            const y = -20 + ct * (0.11 + hash(j, 13) * 0.08);
            if (y > 680) continue;
            const flip = Math.abs(Math.sin(ct / 120 + j));
            ctx.globalAlpha = 1;
            ctx.fillStyle = cols[j % cols.length];
            const cw = Math.max(px, Math.round(4 * u * flip));
            ctx.fillRect(Math.round(ox + x * u), Math.round(oy + y * u), cw, Math.round(6 * u));
        }
    } else if (plan.tier !== 'especial' && plan.tier !== 'muitoRaro' && t > plan.card) {
        const bt = t - plan.card;
        if (bt < 900)
            for (let j = 0; j < 40; j++) {
                const ang = (j / 40) * Math.PI * 2;
                const d = (120 + hash(j, 14) * 60) * outCubic(bt / 900);
                dot(180 + Math.cos(ang) * d, 255 + Math.sin(ang) * d * 1.2, 1.5, GOLD.fire[j % 4], 1 - bt / 900);
            }
    }
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- o Pokémon
const hasPose = (id: number) => (FEET as Record<string, { Pose?: number }>)[id]?.Pose !== undefined;
/** Pé no portão e na frente (coordenadas do palco, 360x640). */
const GATE_Y = 428;
const FRONT_Y = 548;
const FAR = 0.62;

interface MonState {
    x: number;
    y: number;
    alt: number;
    sc: number;
    anim: FieldAnim;
    dir: number;
    start: number;
    op: number;
    dark: number;
    fast: boolean;
}

function monAt(p: WalkPlan, t: number, entry: Entry, pose: boolean): MonState | null {
    if (p.kind === 'calmo') return null;
    const gate = p.gate;
    const enterMs = entry === 'corre' ? 520 : entry === 'voa' ? 1000 : entry === 'quica' ? 900 : 850;
    const poseAt = p.enter + enterMs + 80;
    const idleAfterPose = poseAt + 1100;
    const base: MonState = {
        x: 180,
        y: FRONT_Y,
        alt: 0,
        sc: 1,
        anim: 'Idle',
        dir: 0,
        start: 0,
        op: 1,
        dark: 0,
        fast: false,
    };
    // silhueta no portão
    if (gate !== undefined && t < p.flash) {
        if (t < gate + 250) return null;
        return { ...base, y: GATE_Y, sc: FAR, op: ramp(t, gate + 250, gate + 650), dark: 1 };
    }
    if (gate === undefined && t < p.enter) return null;
    const k = ramp(t, p.enter, p.enter + enterMs);
    const s: MonState = { ...base };
    if (p.kind === 'curto') {
        // encolhido: aparece de frente com um pop
        s.sc = outBack(ramp(t, p.enter, p.enter + 260));
        s.op = ramp(t, p.enter, p.enter + 100);
    } else if (gate !== undefined) {
        // do portão pra frente (muito raro e especial)
        s.dark = 1 - ramp(t, p.flash, p.flash + 140);
        const kk = entry === 'corre' ? outCubic(k) : entry === 'anda' ? k : inOut(k);
        s.y = lerp(GATE_Y, FRONT_Y, kk);
        s.sc = lerp(FAR, 1, kk);
        if (entry === 'voa') s.alt = Math.sin(Math.PI * k) * 150 + 24 * k;
        if (entry === 'quica') s.alt = Math.abs(Math.sin(3 * Math.PI * k)) * 46 * (1 - 0.4 * k);
        if (entry === 'aparece') {
            s.y = FRONT_Y;
            s.sc = 1;
            s.op = ramp(t, p.flash + 100, p.flash + 650);
            s.dark = 0;
        }
    } else {
        // raro: entra pelo lado até o meio e vira de frente
        const kk = entry === 'corre' ? outCubic(k) : entry === 'voa' ? outCubic(k) : k;
        s.x = lerp(-70, 180, kk);
        s.dir = k < 1 ? 2 : 0;
        if (entry === 'voa') s.alt = lerp(330, 24, kk);
        if (entry === 'quica') s.alt = Math.abs(Math.sin(3 * Math.PI * k)) * 46;
        if (entry === 'aparece') {
            s.x = 180;
            s.dir = 0;
            s.op = ramp(t, p.enter, p.enter + 600);
        }
    }
    const moving = k > 0 && k < 1 && entry !== 'aparece' && p.kind !== 'curto';
    s.anim = moving ? (entry === 'quica' ? 'Hop' : 'Walk') : 'Idle';
    s.fast = moving && entry === 'corre';
    if (entry === 'voa' && t >= p.enter) {
        // quem voa fica pairando e bate asa
        s.alt += k >= 1 ? 4 * Math.sin(t / 170) : 0;
        if (k >= 1) s.alt = Math.max(s.alt, 20);
        s.anim = 'Walk';
    }
    if (entry === 'aparece') s.alt += 5 * Math.sin(t / 260);
    s.start = s.anim === 'Hop' ? p.enter : 0;
    if (!moving && t >= poseAt && t < idleAfterPose && p.kind !== 'curto') {
        // Pose (quem tem) ou 2 pulinhos no lugar
        if (pose) {
            s.anim = 'Pose';
            s.start = poseAt;
        } else s.alt += Math.abs(Math.sin(((t - poseAt) / 300) * Math.PI)) * (t < poseAt + 600 ? 18 : 0);
    }
    // festa: 3 pulinhos de alegria (a altura é nossa; o Hop do PMD sobe demais pra caber embaixo da carta)
    if (p.party !== undefined && t >= p.party && t < p.party + 1290) {
        s.anim = 'Idle';
        s.alt += Math.abs(Math.sin(((t - p.party) / 430) * Math.PI)) * 26;
    }
    return s;
}

function WalkMon({ inst, st, u, clock }: { inst: PokemonInstance; st: MonState; u: number; clock: SceneClock }) {
    const fast = useMemo(() => fastClock(clock, 1.8), [clock]);
    const scale = Math.max(2, Math.round(4 * u));
    const shadow = 1 - Math.min(0.6, st.alt / 220);
    return (
        <>
            <i
                className="wk-shadow"
                style={{
                    transform: `translate(${st.x * u}px, ${st.y * u}px) translate(-50%, -50%) scale(${st.sc * shadow})`,
                    opacity: st.op * (1 - st.dark * 0.6),
                }}
            />
            <div
                className="wk-mon"
                style={{
                    transform: `translate(${st.x * u}px, ${(st.y - st.alt) * u}px) scale(${st.sc})`,
                    opacity: st.op,
                    filter: st.dark > 0 ? `brightness(${1 - st.dark})` : undefined,
                }}
            >
                <ClockCtx.Provider value={st.fast ? fast : clock}>
                    <FieldSprite
                        id={inst.speciesId}
                        shiny={inst.shiny}
                        anim={st.anim}
                        dir={st.dir}
                        scale={scale}
                        start={st.start}
                    />
                </ClockCtx.Provider>
            </div>
        </>
    );
}

// ---------------------------------------------------------------- arena (o túnel do ginásio, em SVG pixel)
function Arena({ open, color }: { open: number; color: string }) {
    const trim = color;
    const glow = color;
    const d = Math.round(open * 66);
    return (
        <svg className="wk-arena" viewBox="0 0 360 640" shapeRendering="crispEdges" aria-hidden>
            <defs>
                <pattern id="wk-crowd" width="12" height="12" patternUnits="userSpaceOnUse">
                    <rect width="12" height="12" fill="#0d1338" />
                    <rect x="2" y="3" width="4" height="4" fill="#1c2558" />
                    <rect x="8" y="8" width="3" height="3" fill="#232d66" />
                    <rect x="7" y="1" width="3" height="3" fill="#161e4c" />
                </pattern>
                <radialGradient id="wk-backlight" cx="50%" cy="70%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" style={{ stopColor: glow }} />
                    <stop offset="100%" stopColor="#1a1f45" />
                </radialGradient>
                <linearGradient id="wk-beam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <clipPath id="wk-door">
                    <rect x="117" y="262" width="126" height="168" />
                </clipPath>
            </defs>
            {/* arquibancada com a torcida */}
            <rect x="-900" y="140" width="2160" height="292" fill="url(#wk-crowd)" opacity="0.72" />
            <rect x="-900" y="140" width="2160" height="292" style={{ fill: 'var(--c1)' }} opacity="0.1" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
                <rect key={r} x="-900" y={150 + r * 36} width="2160" height="4" fill="#060a24" opacity="0.8" />
            ))}
            <rect x="-900" y="420" width="2160" height="12" fill="#0a0e2c" />
            {/* parede e portão */}
            <rect x="88" y="214" width="184" height="218" fill="#141a44" />
            <path d="M100 262 V238 h12 v-10 h12 v-8 h112 v8 h12 v10 h12 V262 Z" fill="#1d2560" />
            <rect x="100" y="250" width="160" height="8" style={{ fill: trim }} />
            <rect x="104" y="258" width="8" height="172" style={{ fill: trim }} opacity="0.85" />
            <rect x="248" y="258" width="8" height="172" style={{ fill: trim }} opacity="0.85" />
            <rect x="117" y="262" width="126" height="168" fill="url(#wk-backlight)" opacity={0.35 + open * 0.65} />
            <g clipPath="url(#wk-door)">
                <g transform={`translate(${-d} 0)`}>
                    <rect x="117" y="262" width="63" height="168" fill="#2a3470" />
                    <rect x="123" y="270" width="51" height="70" fill="#323e82" />
                    <rect x="123" y="350" width="51" height="72" fill="#323e82" />
                    <rect x="172" y="262" width="8" height="168" fill="#1b2254" />
                </g>
                <g transform={`translate(${d} 0)`}>
                    <rect x="180" y="262" width="63" height="168" fill="#2a3470" />
                    <rect x="186" y="270" width="51" height="70" fill="#323e82" />
                    <rect x="186" y="350" width="51" height="72" fill="#323e82" />
                    <rect x="180" y="262" width="8" height="168" fill="#1b2254" />
                </g>
            </g>
            {/* piso da quadra em perspectiva */}
            <polygon points="-900,432 1260,432 1260,760 -900,760" fill="#122a63" />
            <polygon points="-900,432 1260,432 1260,760 -900,760" style={{ fill: 'var(--c2)' }} opacity="0.16" />
            <polygon points="-900,432 1260,432 1260,446 -900,446" fill="#17357a" />
            <rect x="-900" y="496" width="2160" height="3" fill="#2c4f9e" />
            <polygon points="178,432 182,432 196,760 164,760" fill="#3d63b8" />
            <ellipse cx="180" cy="566" rx="96" ry="22" fill="none" stroke="#3d63b8" strokeWidth="3" />
            {/* a luz que sai do portão aberto */}
            {open > 0 && <polygon points="117,430 243,430 330,760 30,760" fill="url(#wk-beam)" opacity={open} />}
        </svg>
    );
}

// ---------------------------------------------------------------- pistas
/** A insígnia do ginásio do tipo; tipo sem ginásio mostra "Kanto". */
const BADGE_OF: Partial<Record<string, TrainerId>> = {
    Rock: 'brock',
    Water: 'misty',
    Electric: 'ltsurge',
    Grass: 'erika',
    Poison: 'koga',
    Psychic: 'sabrina',
    Fire: 'blaine',
    Ground: 'giovanni',
};

const BIG_Y = 300;
const STRIP_Y = 84;
/** Tamanho de cada pista na fileira de cima (a placa e a posição são largas). */
const STRIP_SCALE: Record<string, number> = { type: 0.42, gym: 0.42, pos: 0.36, route: 0.32 };

/** Onde cada pista está: grande no meio quando chega, depois vai pra fileira de cima (as pistas juntas). */
function itemPose(
    t: number,
    at: number,
    next: number,
    slot: number,
    slots: number,
    how: 'pop' | 'slide' | 'drop' | 'slam',
    bigY = BIG_Y,
    small = 0.42,
) {
    if (t < at) return null;
    const ki = ramp(t, at, at + (how === 'drop' ? 420 : how === 'slam' ? 180 : 280));
    let x = 180;
    let y = bigY;
    let s = 1;
    let r = 0;
    let op = 1;
    if (how === 'pop') {
        s = lerp(1.7, 1, outBack(ki));
        op = ramp(t, at, at + 90);
    } else if (how === 'slide') {
        x = lerp(420, 180, outCubic(ki));
        r = lerp(-10, -4, ki);
    } else if (how === 'drop') {
        // cai de cima e assenta com um quique
        const b = ki < 0.7 ? inQuad(ki / 0.7) : 1 - Math.sin(((ki - 0.7) / 0.3) * Math.PI) * 0.08;
        y = lerp(bigY - 260, bigY, b);
    } else {
        s = lerp(3.2, 1, inQuad(ki));
        op = ramp(t, at, at + 60);
    }
    const kc = inOut(ramp(t, next, next + 320));
    const sx = 180 + (slot - (slots - 1) / 2) * 74;
    return { x: lerp(x, sx, kc), y: lerp(y, STRIP_Y, kc), r: lerp(r, 0, kc), s: lerp(s, small, kc), op };
}

// ---------------------------------------------------------------- câmera e tremida
function camAt(p: WalkPlan, t: number) {
    let x = 0;
    let y = 0;
    let s = 1;
    let r = 0;
    p.clues.forEach((c, i) => {
        const k = outCubic(ramp(t, c.at - 80, c.at + 320));
        const side = i % 2 === 0 ? 1 : -1;
        x = lerp(x, side * 18, k);
        r = lerp(r, side * -1.6, k);
        s = lerp(s, 1.15, k);
    });
    if (p.gate !== undefined) {
        const k = ramp(t, p.gate, p.flash);
        const k3 = outCubic(clamp01(k * 3));
        x = lerp(x, 0, k3);
        r = lerp(r, 0, k3);
        s = lerp(s, 1.32, inOut(k));
        y = lerp(y, 26, inOut(k));
    }
    const back = p.gate !== undefined ? p.flash : p.enter;
    if (t >= back) {
        const k = ramp(t, back, back + 420);
        const pop = outBack(k);
        s = lerp(s, 1, pop);
        x = lerp(x, 0, k);
        r = lerp(r, 0, k);
        y = lerp(y, 0, k);
    }
    return { x, y, s, r };
}

function shakesOf(p: WalkPlan): [number, number, number][] {
    const out: [number, number, number][] = [];
    const add = (at: number | undefined, amp: number, dur: number) => at !== undefined && out.push([at, amp, dur]);
    if (p.kind === 'calmo') return out;
    if (p.tier !== 'raro') add(p.sky + 60, 2, 160);
    add(p.seal, 6, 260);
    add(p.crack, 7, 320);
    if (p.gate !== undefined) add(p.flash, p.tier === 'especial' ? 8 : 6, 260);
    add(p.card + (p.tier === 'raro' ? 120 : 190), p.tier === 'raro' ? 3 : 6, 220);
    add(p.art, 4, 180);
    return out;
}
function shakeAt(list: [number, number, number][], t: number) {
    let x = 0;
    let y = 0;
    for (const [at, amp, dur] of list) {
        if (t < at || t > at + dur) continue;
        const k = 1 - (t - at) / dur;
        x += Math.round(Math.sin(t * 0.13 + at) * amp * k);
        y += Math.round(Math.cos(t * 0.17 + at) * amp * k);
    }
    return { x, y };
}

// ---------------------------------------------------------------- a carta
/** A carta não redesenha a cada quadro (a nota conta direto no texto dela). */
const Card = memo(function Card({ inst }: { inst: PokemonInstance }) {
    return <FutCard inst={inst} />;
});

// ---------------------------------------------------------------- o walkout
export function WalkoutReact({
    inst,
    onDone,
    nth = 1,
    upgrade,
    reduce,
}: {
    inst: PokemonInstance;
    onDone: () => void;
    /** Quantos deste nível já saíram hoje contando este (o encolher do dia). */
    nth?: number;
    /** Força o upgrade (sem: metade dos especiais, pela carta). */
    upgrade?: boolean;
    reduce?: boolean;
}) {
    const { t: tr, d, lang } = useT();
    const view = viewInstance(inst);
    const tier = walkoutTier(inst) ?? 'raro';
    const [plan] = useState(() =>
        walkoutPlan(tier, { nth, reduce: reduce ?? reduceMotionOn(), upgrade: upgrade ?? upgradeOf(inst) }),
    );
    const { t, seek, clock, tRef } = useTimeline();
    const type = cardTypeOf(inst);
    const edition = editionOf(inst);
    const entry = entryOf(inst.speciesId);
    const cracked = plan.crack === undefined || t >= plan.crack + 120;
    const pal = paletteOf(inst, tier, cracked);
    const late = paletteOf(inst, tier, true);
    const cues = useMemo(() => soundCues(plan, inst), [plan, inst]);
    const shakes = useMemo(() => shakesOf(plan), [plan]);

    // tamanho do palco (360x640 em unidades) e do canvas
    const [box, setBox] = useState(() => ({ w: 360, h: 640, u: 1 }));
    useLayoutEffect(() => {
        const measure = () => {
            const z = uiZoom();
            const w = window.innerWidth / z;
            const h = window.innerHeight / z;
            setBox({ w, h, u: Math.min(w / 360, h / 640) });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);
    const { u } = box;

    // sons: cada um toca uma vez quando o relógio passa por ele (Pular marca tudo como tocado)
    const fired = useRef(-1);
    const lastT = useRef(0);
    useEffect(() => {
        const w = wkw();
        w.__wkPlan = plan;
        w.__wkRender = renderSound;
        const from = lastT.current;
        lastT.current = t;
        if (t < from) return;
        for (let i = fired.current + 1; i < cues.length && cues[i].at <= t; i++) {
            fired.current = i;
            if (cues[i].at < from - 1) continue;
            if (w.__wkManual) w.__wkSounds?.push({ t: cues[i].at, s: cues[i].s });
            else playSound(cues[i].s, inst);
        }
    }, [t, cues, plan, inst]);
    // a música do menu abaixa no especial
    useEffect(() => {
        if (plan.tier !== 'especial') return;
        duckMusic(true);
        return () => unduckMusic(false);
    }, [plan.tier]);

    const skip = () => {
        // vai pro fim: marca os sons como tocados e toca só o grito e um stinger curto
        fired.current = cues.length - 1;
        lastT.current = plan.end;
        seek(plan.end);
        if (!wkw().__wkManual) {
            playSound({ k: 'max', name: 'golpe-n1' }, inst);
            playSound({ k: 'cry', gain: 0.9 }, inst);
        }
    };
    const skipRef = useRef(skip);
    // Esc = Pular, que só vale depois da prévia
    skipRef.current = () => tRef.current >= SKIP_AFTER_MS && skip();
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skipRef.current();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    const tap = () => {
        if (tRef.current >= plan.end) return;
        const to = nextBeat(plan, tRef.current);
        // o que tocaria no caminho fica pra trás (só o que cai na batida nova soa)
        while (fired.current + 1 < cues.length && cues[fired.current + 1].at < to) fired.current++;
        lastT.current = to;
        seek(to);
    };

    // partículas
    const canvas = useRef<HTMLCanvasElement>(null);
    const fx = useMemo<FxScene>(() => ({ plan, pal, late, shiny: inst.shiny }), [plan, pal, late, inst.shiny]);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    useLayoutEffect(() => {
        const c = canvas.current;
        const ctx = c?.getContext('2d');
        if (!c || !ctx) return;
        const W = Math.round(box.w * dpr);
        const H = Math.round(box.h * dpr);
        if (c.width !== W || c.height !== H) {
            c.width = W;
            c.height = H;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawFx(ctx, t, box.w, box.h, u, fx);
    }, [t, box, u, fx, dpr]);

    // a nota contando (direto no texto da carta: a carta não redesenha)
    const cardRef = useRef<HTMLDivElement>(null);
    const ovr = view.overall;
    const countMs = plan.kind === 'calmo' ? 0 : plan.tier === 'especial' ? 900 : 600;
    const countFrom = Math.max(40, ovr - 32);
    const shown =
        countMs === 0
            ? ovr
            : Math.round(lerp(countFrom, ovr, outCubic(ramp(t, plan.card + 150, plan.card + 150 + countMs))));
    const lastTick = useRef(-1000);
    useLayoutEffect(() => {
        const el = cardRef.current?.querySelector('.m-ovr');
        if (!el || t < plan.card) return;
        const txt = String(shown);
        if (el.textContent !== txt) {
            el.textContent = txt;
            // tique por número, no máximo um a cada 45 ms
            if (plan.tier === 'especial' && t - lastTick.current >= 45) {
                lastTick.current = t;
                if (wkw().__wkManual) wkw().__wkSounds?.push({ t, s: { k: 'zz', name: 'tick' } });
                else playSound({ k: 'zz', name: 'tick' }, inst);
            }
        }
    });

    // ---------------------------------------------------------------- quadro
    const calm = plan.kind === 'calmo';
    const cam = calm ? { x: 0, y: 0, s: 1, r: 0 } : camAt(plan, t);
    const shake = shakeAt(shakes, t);
    const skyOn = calm ? ramp(t, 0, 300) : ramp(t, plan.sky, plan.sky + (plan.tier === 'especial' ? 500 : 250));
    const crackK = plan.crack === undefined ? 1 : ramp(t, plan.crack + 120, plan.crack + 420);
    const firstClue = plan.clues[0];
    const typeWash =
        firstClue && firstClue.kind === 'type'
            ? ramp(t, firstClue.at - 40, firstClue.at + 120) * (1 - ramp(t, firstClue.at + 700, firstClue.at + 1100))
            : 0;
    const open = plan.gate === undefined ? 0 : outCubic(ramp(t, plan.gate, plan.gate + 520));
    const rot = calm ? 0 : t * 0.012 + Math.max(0, t - plan.card) * 0.05;
    const raysOn = calm ? skyOn * 0.6 : skyOn * (t >= plan.card ? 1 : 0.55);
    const mon = monAt(plan, t, entry, hasPose(inst.speciesId));
    const cardOn = t >= plan.card;
    const cardK = ramp(t, plan.card, plan.card + (plan.tier === 'especial' ? 820 : plan.tier === 'raro' ? 520 : 220));
    let cardTf = '';
    let cardOp = 1;
    if (calm) cardOp = ramp(t, plan.card, plan.card + 200);
    else if (plan.tier === 'especial') {
        const e = outCubic(cardK);
        cardTf = `rotateY(${lerp(900, 0, e)}deg) scale(${lerp(0.25, 1, e)})`;
    } else if (plan.tier === 'muitoRaro' && plan.kind === 'cheio') {
        cardTf = `scale(${lerp(2.6, 1, inQuad(cardK))})`;
        cardOp = ramp(t, plan.card, plan.card + 70);
    } else {
        cardTf = `translateY(${lerp(70, 0, outBack(cardK)) * u}px) scale(${lerp(0.8, 1, outBack(cardK))})`;
        cardOp = ramp(t, plan.card, plan.card + 160);
    }
    const artK = plan.art === undefined ? 1 : ramp(t, plan.art, plan.art + 260);
    // flashes: o grande do reveal (em círculo no muito raro e no especial) e os curtos
    const flashes: [number | undefined, number][] = [
        [plan.gate !== undefined ? plan.flash : undefined, 110],
        [plan.tier === 'raro' || plan.kind === 'curto' ? plan.card : undefined, 80],
        [plan.art, 90],
        [plan.crack !== undefined ? plan.crack + 120 : undefined, 120],
    ];
    let flash = 0;
    for (const [at, dur] of flashes)
        if (at !== undefined && t >= at && t < at + dur) flash = Math.max(flash, 1 - (t - at) / dur);
    const ringK = plan.gate !== undefined && !calm ? ramp(t, plan.flash, plan.flash + 360) : 0;
    const whoK =
        plan.gate !== undefined
            ? ramp(t, plan.gate + 380, plan.gate + 640) * (1 - ramp(t, plan.flash - 60, plan.flash + 60))
            : 0;
    const bars =
        calm || plan.kind === 'curto' || plan.tier === 'raro'
            ? 0
            : ramp(t, 0, 300) * (1 - ramp(t, plan.card - 200, plan.card + 100));
    const stripOff = 1 - ramp(t, plan.card - 150, plan.card + 150);
    const skyCls = cracked ? pal.sky : 'muito';
    const lateSky = late.sky;

    // pistas na ordem: selo (se tiver), tipo, posição, ginásio/rota
    const hasSeal = plan.seal !== undefined || plan.crack !== undefined;
    const slots = plan.clues.length + (hasSeal ? 1 : 0);
    const nextOf = (i: number) => plan.clues[i + 1]?.at ?? plan.gate ?? plan.enter;
    const sealAt = plan.seal ?? (plan.crack !== undefined ? plan.crack + 120 : undefined);
    const sealNext = plan.seal !== undefined ? (plan.clues[0]?.at ?? plan.card) : plan.flash - 200;
    const badge = BADGE_OF[type];
    const habitat = habitatOf(inst.speciesId);
    const place =
        'area' in habitat
            ? placeName(habitat.area, lang)
            : ((d.ultimate.walkout.place as Record<string, string>)[habitat.kind] ?? habitat.kind);
    const sealText =
        edition === 'evento'
            ? `${d.common.edition.evento} · ${d.common.type[inst.special?.type as keyof typeof d.common.type] ?? ''}`
            : edition
              ? d.common.edition[edition]
              : '';
    const title = inst.special?.title;

    const rootStyle = {
        '--u': `${u}px`,
        '--c1': pal.c1,
        '--c2': pal.c2,
        '--tc': TYPE_COLOR[type] ?? '#5a6bd8',
        '--l1': late.c1,
        '--l2': late.c2,
    } as CSSProperties;

    return createPortal(
        // biome-ignore lint/a11y/useKeyWithClickEvents: tocar adianta a batida; no teclado, Pular (Esc) e Continuar fazem o mesmo
        <div
            className={`k-moment wk wk-${plan.tier} wk-k-${plan.kind}`}
            role="dialog"
            aria-modal="true"
            aria-label={view.displayName}
            style={rootStyle}
            onClick={tap}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <div className="wk-shake" style={{ transform: `translate(${shake.x * u}px, ${shake.y * u}px)` }}>
                <i className="wk-sky wk-sky-dark" />
                <i className={`wk-sky wk-sky-${skyCls}`} style={{ opacity: skyOn }} />
                {plan.crack !== undefined && <i className={`wk-sky wk-sky-${lateSky}`} style={{ opacity: crackK }} />}
                <i
                    className="wk-rays"
                    style={{ opacity: raysOn, transform: `translate(-50%, -50%) rotate(${rot}deg)` }}
                />
                {inst.shiny && !calm && (
                    <span className="wk-shinyring" style={{ opacity: skyOn * (0.75 + 0.25 * Math.sin(t / 300)) }}>
                        <i style={{ transform: `rotate(${t * 0.03}deg)` }} />
                    </span>
                )}

                <div className="wk-stage">
                    {!calm && (
                        <div
                            className="wk-cam"
                            style={{
                                transform: `translate(${cam.x * u}px, ${cam.y * u}px) rotate(${cam.r}deg) scale(${cam.s})`,
                            }}
                        >
                            <Arena open={open} color={pal.c1} />
                            {Array.from({ length: plan.spots }, (_, i) => {
                                const at = plan.sky + i * 250;
                                const xs =
                                    plan.spots === 1 ? [180] : plan.spots === 2 ? [40, 320] : [10, 110, 250, 350];
                                const base =
                                    plan.spots === 1
                                        ? 0
                                        : (xs[i] < 180 ? 1 : -1) * (plan.spots === 2 ? 20 : 12 + (i % 2) * 10);
                                return (
                                    <i
                                        // biome-ignore lint/suspicious/noArrayIndexKey: os holofotes são fixos
                                        key={i}
                                        className="wk-spot"
                                        style={{
                                            left: xs[i] * u,
                                            opacity: clank(t, at) * (t >= plan.card ? 0.7 : 1),
                                            transform: `translateX(-50%) rotate(${base + Math.sin(t / 900 + i * 1.7) * 7}deg)`,
                                        }}
                                    />
                                );
                            })}
                            {mon && <WalkMon inst={inst} st={mon} u={u} clock={clock} />}
                        </div>
                    )}
                </div>
                {/* a cor do tipo lava a arena na 1ª pista */}
                <i className="wk-sky wk-sky-type" style={{ opacity: typeWash * 0.7 }} />

                <div className="wk-stage">
                    {/* pistas: grandes no meio, depois na fileira de cima */}
                    {!calm && (
                        <div className="wk-hud" style={{ opacity: stripOff }}>
                            {hasSeal && sealAt !== undefined && (
                                <Item
                                    u={u}
                                    pose={itemPose(
                                        t,
                                        sealAt,
                                        sealNext,
                                        0,
                                        slots,
                                        'slam',
                                        plan.seal !== undefined ? BIG_Y : 330,
                                        0.3,
                                    )}
                                >
                                    <span className={`wk-seal wk-seal-${edition}`}>{sealText}</span>
                                </Item>
                            )}
                            {plan.clues.map((c, i) => {
                                const slot = i + (hasSeal ? 1 : 0);
                                const how = c.kind === 'pos' ? 'slide' : c.kind === 'route' ? 'drop' : 'pop';
                                return (
                                    <Item
                                        key={c.kind}
                                        u={u}
                                        pose={itemPose(
                                            t,
                                            c.at,
                                            nextOf(i),
                                            slot,
                                            slots,
                                            how,
                                            BIG_Y,
                                            STRIP_SCALE[c.kind],
                                        )}
                                    >
                                        {c.kind === 'type' ? (
                                            <span className="wk-type">
                                                <TypeIcon type={type} size={96} />
                                            </span>
                                        ) : c.kind === 'pos' ? (
                                            <span className="wk-pos">{d.common.pos[view.naturalPosition]}</span>
                                        ) : c.kind === 'gym' ? (
                                            <span className="wk-badge">
                                                {badge ? <KantoBadge leader={badge} earned /> : <b>Kanto</b>}
                                            </span>
                                        ) : (
                                            <span className="wk-sign">
                                                <b>{place}</b>
                                            </span>
                                        )}
                                    </Item>
                                );
                            })}
                            {whoK > 0 && (
                                <p
                                    className="wk-who"
                                    style={{
                                        opacity: whoK,
                                        transform: `translate(-50%, -50%) rotate(-5deg) scale(${lerp(1.5, 1, outBack(whoK))})`,
                                    }}
                                >
                                    {tr('ultimate.walkout.who')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* a carta */}
                    {cardOn && (
                        <div
                            ref={cardRef}
                            className={`wk-card${plan.art !== undefined ? ' wk-card-noart' : ''}`}
                            style={{ opacity: cardOp, '--wk-art': artK } as CSSProperties}
                        >
                            <i
                                className="wk-card-glow"
                                style={{ transform: `translate(-50%, -50%) scale(${1 + 0.06 * Math.sin(t / 220)})` }}
                            />
                            <div className="wk-card-spin" style={{ transform: cardTf }}>
                                <div className="wk-card-face">
                                    <Card inst={inst} />
                                </div>
                                {plan.tier === 'especial' && !calm && (
                                    <div className={`wk-card-back wk-sky-${lateSky}`}>
                                        <img src="assets/ui/simbolo.svg" alt="" />
                                    </div>
                                )}
                            </div>
                            {calm && sealText && (
                                <span className={`wk-seal wk-seal-${edition} wk-seal-calm`}>{sealText}</span>
                            )}
                        </div>
                    )}
                    {title && plan.art !== undefined && t >= plan.art && (
                        <p className="wk-title" style={{ clipPath: `inset(0 ${100 - artK * 100}% 0 0)` }}>
                            {title}
                        </p>
                    )}
                </div>

                <canvas ref={canvas} className="wk-fx" style={{ width: box.w, height: box.h }} />
                {plan.crack !== undefined && t >= plan.crack && t < plan.crack + 700 && (
                    <Crack
                        k={ramp(t, plan.crack, plan.crack + 160)}
                        out={ramp(t, plan.crack + 260, plan.crack + 700)}
                    />
                )}
                <i className="wk-bars" style={{ '--b': bars } as CSSProperties} />
                {ringK > 0 && ringK < 1 && (
                    <i
                        className="wk-ring"
                        style={{ transform: `translate(-50%, -50%) scale(${ringK * 3.2})`, opacity: 1 - ringK }}
                    />
                )}
                <i className="wk-flash" style={{ opacity: flash }} />
            </div>

            {plan.wipe && t < 1150 && <MomentWipe art="estrela" onDone={() => {}} />}
            {t >= SKIP_AFTER_MS && t < plan.end && (
                <button
                    type="button"
                    className="btn ghost small k-moment-skip"
                    onClick={(e) => {
                        e.stopPropagation();
                        skip();
                    }}
                >
                    {tr('common.ui.skip')}
                </button>
            )}
            {t >= plan.end && (
                <button
                    type="button"
                    className="btn confirm big wk-go"
                    style={{ opacity: ramp(t, plan.end, plan.end + 250) }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDone();
                    }}
                >
                    {tr('common.ui.continue')}
                </button>
            )}
        </div>,
        document.body,
    );
}

function Item({ pose, u, children }: { pose: ReturnType<typeof itemPose>; u: number; children: ReactNode }) {
    if (!pose) return null;
    return (
        <div
            className="wk-item"
            style={{
                transform: `translate(${pose.x * u}px, ${pose.y * u}px) rotate(${pose.r}deg) scale(${pose.s})`,
                opacity: pose.op,
            }}
        >
            <div className="wk-item-in">{children}</div>
        </div>
    );
}

/** A tela rachando (upgrade): raios brancos do centro pras bordas. */
function Crack({ k, out }: { k: number; out: number }) {
    const lines = [
        'M180 330 L150 300 L162 250 L120 190 L132 120 L90 40',
        'M180 330 L215 290 L205 240 L250 200 L240 130 L290 60',
        'M180 330 L130 350 L80 330 L30 370 L-20 350',
        'M180 330 L235 360 L290 340 L340 380 L390 365',
        'M180 330 L165 390 L190 450 L160 520 L180 600 L170 680',
        'M180 330 L200 380 L245 420 L260 500 L300 560',
    ];
    return (
        <svg className="wk-crack" viewBox="0 0 360 640" aria-hidden style={{ opacity: 1 - out }}>
            {lines.map((l) => (
                <path key={l} d={l} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
            ))}
        </svg>
    );
}

// ---------------------------------------------------------------- laboratório
type LabEd = 'icone' | 'destaque' | 'evento' | 'shiny' | 'ouro85' | 'ouro75';
const LAB_EDS: LabEd[] = ['icone', 'destaque', 'evento', 'shiny', 'ouro85', 'ouro75'];
const DEFAULT_ID: Record<LabEd, number> = { icone: 150, destaque: 149, evento: 6, shiny: 6, ouro85: 149, ouro75: 59 };

/** A carta do laboratório: a espécie com a edição pedida; ouro 75 e 85 acham um nível com a nota na faixa. */
export function labCard(ed: LabEd, id: number): PokemonInstance {
    const make = (lv?: number) => createInstance(id, new Rng('walkout-lab', `${ed}-${id}`), lv);
    let inst = make();
    if (ed === 'ouro75') for (let lv = 49; lv > 1 && viewInstance(inst).overall > 84; lv--) inst = make(lv);
    if (ed === 'ouro85') for (let lv = 51; lv <= 100 && viewInstance(inst).overall < 85; lv++) inst = make(lv);
    if (ed === 'icone') return { ...inst, special: { kind: 'icone', title: ICONS[id] } };
    if (ed === 'destaque') return { ...inst, special: { kind: 'destaque', level: 1 } };
    if (ed === 'evento') return { ...inst, special: { kind: 'evento', type: species(id).types[0] } };
    if (ed === 'shiny') return { ...inst, shiny: true };
    return inst;
}

/** ?lab=walkout&motor=react (&ed=icone|destaque|evento|shiny|ouro85|ouro75 &id=150 &up=0|1 &dia=N &calmo=1 &auto=1). */
export function WalkoutLab({ onExit }: { onExit: () => void }) {
    const q = new URLSearchParams(window.location.search);
    const [ed, setEd] = useState<LabEd>(() =>
        LAB_EDS.includes(q.get('ed') as LabEd) ? (q.get('ed') as LabEd) : 'icone',
    );
    const [id, setId] = useState(() => Number(q.get('id')) || DEFAULT_ID[ed]);
    const [up, setUp] = useState<'auto' | '1' | '0'>(() =>
        q.get('up') === '1' ? '1' : q.get('up') === '0' ? '0' : 'auto',
    );
    const [nth, setNth] = useState(() => Number(q.get('dia')) || 1);
    const [calm, setCalm] = useState(() => q.get('calmo') === '1');
    // auto=1 já toca; na gravação (window.__wkManual) espera o script chamar __wkStart, pro relógio começar junto
    const [run, setRun] = useState(() => (q.get('auto') === '1' && !wkw().__wkManual ? 1 : 0));
    useEffect(() => {
        (window as unknown as { __wkStart?: () => void }).__wkStart = () => setRun(1);
    }, []);
    const inst = useMemo(() => labCard(ed, Math.min(151, Math.max(1, id))), [ed, id]);
    const tier = walkoutTier(inst);
    return (
        <div className="kl wk-lab">
            <header className="kl-head bc-screenhead">
                <span className="bc-tag">Laboratório</span>
                <h1>Walkout · React</h1>
                <button type="button" className="btn small ghost" onClick={onExit}>
                    <HudIcon kind="prev" /> Sair
                </button>
            </header>
            <section className="panel">
                <p className="muted">
                    {species(inst.speciesId).name} · nota {viewInstance(inst).overall} · nível{' '}
                    {tier === 'especial' ? 'especial' : tier === 'muitoRaro' ? 'muito raro' : 'raro'} · entra{' '}
                    {entryOf(inst.speciesId)}
                </p>
                <div className="wk-lab-row">
                    {LAB_EDS.map((e) => (
                        <button
                            key={e}
                            type="button"
                            className={`btn small${e === ed ? ' confirm' : ''}`}
                            onClick={() => {
                                setEd(e);
                                setId(DEFAULT_ID[e]);
                            }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
                <div className="wk-lab-row">
                    <label>
                        Pokédex{' '}
                        <input
                            type="number"
                            min={1}
                            max={151}
                            value={id}
                            onChange={(e) => setId(Number(e.target.value) || 1)}
                        />
                    </label>
                    <label>
                        Upgrade{' '}
                        <select value={up} onChange={(e) => setUp(e.target.value as 'auto' | '1' | '0')}>
                            <option value="auto">metade (pela carta)</option>
                            <option value="1">sim</option>
                            <option value="0">não</option>
                        </select>
                    </label>
                    <label>
                        Do dia{' '}
                        <select value={nth} onChange={(e) => setNth(Number(e.target.value))}>
                            {[1, 2, 3].map((n) => (
                                <option key={n} value={n}>
                                    {n}º
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" checked={calm} onChange={(e) => setCalm(e.target.checked)} /> Reduzir
                        movimento
                    </label>
                </div>
                <button type="button" className="btn primary big" onClick={() => setRun((r) => r + 1)}>
                    <HudIcon kind="play" /> Tocar
                </button>
            </section>
            {run > 0 && (
                <WalkoutReact
                    key={run}
                    inst={inst}
                    nth={nth}
                    upgrade={up === 'auto' ? undefined : up === '1'}
                    reduce={calm || undefined}
                    onDone={() => setRun(0)}
                />
            )}
        </div>
    );
}
