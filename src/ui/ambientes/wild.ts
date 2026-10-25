/**
 * Pokémon ambiente dos menus (`?lab=ambientes`): em cada lugar, 1 a 4 Pokémon sorteados de um pool que combina com o
 * lugar, cada um fazendo ações aleatórias com timer (andar, parar, olhar pros lados, dormir, pular, emote, perseguir
 * outro, fugir quando o time passa). Só tela: aqui pode `Math.random` (o motor determinístico é `src/engine`).
 * Coordenadas de 0 a 1 dentro da caixa da zona; `aspect` (largura/altura da caixa) deixa a velocidade e a direção
 * iguais na horizontal e na vertical.
 */
import { TABS, type Tab } from './nav';

export type Mood = 'calm' | 'busy' | 'sleepy' | 'shy';
/** Uma vaga do sorteio: a zona do lugar, quem pode cair nela e a chance de a vaga existir (1 = sempre). */
export interface Slot {
    zone: string;
    ids: readonly number[];
    mood?: Mood;
    chance?: number;
}

/**
 * Os pools. Rota: selvagens de Kanto no mato, na água e no céu. Estádio: um dormindo na arquibancada, um gandula na
 * linha de fundo e torcedores/mascotes na beira. Lab, Arena e Sede: 1 ou 2 no chão, pra não ficarem vazios.
 */
export const POOLS: Record<Tab, readonly Slot[]> = {
    rota: [
        { zone: 'grass', ids: [16, 19, 10, 13, 29, 32, 43, 69, 56, 39, 52, 25, 27, 23, 37, 58, 46, 35, 84, 48] },
        { zone: 'grass', ids: [16, 19, 10, 13, 29, 32, 43, 69, 56, 39, 52, 25, 27, 23, 37, 58, 46, 35, 84, 48] },
        { zone: 'water', ids: [129, 72, 118, 60, 54, 86, 90, 116, 120, 98, 79, 7], mood: 'calm' },
        { zone: 'sky', ids: [21, 17, 12, 22, 18, 49, 15, 83], chance: 0.6 },
    ],
    estadio: [
        { zone: 'stand', ids: [143, 79, 39, 96, 133, 52, 74], mood: 'sleepy' },
        { zone: 'ball', ids: [58, 19, 133, 25, 50, 77, 128], mood: 'busy', chance: 0.85 },
        { zone: 'edge', ids: [25, 35, 122, 54, 113, 66, 104, 132, 36, 125] },
        { zone: 'edge', ids: [25, 35, 122, 54, 113, 66, 104, 132, 36, 125], chance: 0.5 },
    ],
    lab: [
        { zone: 'floor', ids: [1, 4, 7, 137, 81, 100, 132, 63], mood: 'busy' },
        { zone: 'floor', ids: [1, 4, 7, 137, 81, 100, 132, 63], mood: 'busy', chance: 0.5 },
    ],
    arena: [
        { zone: 'floor', ids: [66, 56, 106, 107, 57, 62, 68, 128, 115], mood: 'busy' },
        { zone: 'floor', ids: [66, 56, 106, 107, 57, 62, 68, 128, 115], mood: 'busy', chance: 0.5 },
    ],
    sede: [
        { zone: 'floor', ids: [52, 113, 58, 133, 35, 108, 143, 40], mood: 'busy' },
        { zone: 'floor', ids: [52, 113, 58, 133, 35, 108, 143, 40], mood: 'busy', chance: 0.5 },
    ],
};

/** Peso no sorteio de quem você já viu na Pokédex (fica pessoal); quem nunca apareceu pesa 1. */
export const SEEN_WEIGHT = 4;
/** Sprites ambiente montados ao mesmo tempo (a aba da tela e as vizinhas, que aparecem no arrasto). */
export const MAX_WILD = 8;

export interface Wild {
    key: string;
    id: number;
    zone: string;
    mood: Mood;
}

type Rand = () => number;

/** Sorteio de um lugar: cada vaga (se a chance deixar) pega alguém do pool, sem repetir espécie no lugar. */
export function rollWild(tab: Tab, seen: (id: number) => boolean, rand: Rand = Math.random): Wild[] {
    const used = new Set<number>();
    const out: Wild[] = [];
    POOLS[tab].forEach((slot, i) => {
        if (rand() >= (slot.chance ?? 1)) return;
        const ids = slot.ids.filter((id) => !used.has(id));
        if (!ids.length) return;
        const w = ids.map((id) => (seen(id) ? SEEN_WEIGHT : 1));
        let r = rand() * w.reduce((a, b) => a + b, 0);
        let k = 0;
        while (k < ids.length - 1 && r >= w[k]) r -= w[k++];
        used.add(ids[k]);
        out.push({ key: `${tab}-${i}`, id: ids[k], zone: slot.zone, mood: slot.mood ?? 'calm' });
    });
    return out;
}

export function rollAll(seen: (id: number) => boolean, rand: Rand = Math.random): Record<Tab, Wild[]> {
    return Object.fromEntries(TABS.map((t) => [t, rollWild(t, seen, rand)])) as Record<Tab, Wild[]>;
}

/**
 * Quantos sprites cada aba monta: a da tela primeiro (todos), depois a vizinha da esquerda e a da direita até o
 * teto; as longe, nenhum (nem baixam a folha).
 */
export function wildQuota(tab: number, counts: readonly number[], max = MAX_WILD): number[] {
    const out = counts.map(() => 0);
    let left = max;
    for (const i of [tab, tab - 1, tab + 1]) {
        if (i < 0 || i >= counts.length) continue;
        out[i] = Math.min(counts[i], left);
        left -= out[i];
    }
    return out;
}

// ---------------------------------------------------------------------------------------------- ações

export type Act = 'idle' | 'walk' | 'look' | 'sleep' | 'hop' | 'emote' | 'chase' | 'flee';
export type Emote = 'heart' | 'note' | 'surprise' | 'question';
export interface Pt {
    x: number;
    y: number;
    /** Raio do susto (em alturas da caixa); sem raio, 0,16. */
    r?: number;
}
/** Uma zona: onde dá pra pisar, a velocidade (alturas da caixa por segundo) e se voa ou fica sentado. */
export interface Area {
    aspect: number;
    ok: (x: number, y: number) => boolean;
    speed: number;
    fly?: boolean;
    still?: boolean;
}
export interface Actor extends Wild {
    x: number;
    y: number;
    tx: number;
    ty: number;
    act: Act;
    /** ms até a próxima decisão. */
    left: number;
    /** Hora do relógio em que a ação começou (o pulo e o emote começam do 1º quadro). */
    t0: number;
    /** Direção PMD: 0 frente, 2 direita, 4 costas, 6 esquerda (e as diagonais no meio). */
    dir: number;
    emote?: Emote;
    prey?: string;
}

const WEIGHTS: Record<Mood, Partial<Record<Act, number>>> = {
    calm: { walk: 4, idle: 3, look: 2, hop: 1, emote: 1, chase: 1, sleep: 0.5 },
    busy: { walk: 6, idle: 1, look: 1, hop: 2, emote: 1, chase: 2 },
    sleepy: { sleep: 8, idle: 2, look: 1, walk: 0.5, emote: 0.5 },
    shy: { walk: 3, idle: 2, look: 3, hop: 0.5, emote: 0.5 },
};
const EMOTES: Emote[] = ['heart', 'note', 'question', 'surprise'];
const between = (rand: Rand, a: number, b: number) => a + rand() * (b - a);

/** Direção PMD de um passo (dx, dy em unidades de altura, y pra baixo). */
export function dirOf(dx: number, dy: number): number {
    const k = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8; // 0 direita, 2 baixo, 4 esquerda, 6 cima
    return (2 - k + 8) % 8;
}

/** Um ponto válido perto de (x, y), a até `r` alturas; `null` se não achar em 16 tentativas. */
function spotNear(area: Area, x: number, y: number, r: number, rand: Rand): [number, number] | null {
    for (let i = 0; i < 16; i++) {
        const a = rand() * Math.PI * 2;
        const d = r * (0.35 + 0.65 * rand());
        const nx = x + (Math.cos(a) * d) / area.aspect;
        const ny = y + Math.sin(a) * d;
        if (nx > 0.03 && nx < 0.97 && ny > 0.03 && ny < 0.97 && area.ok(nx, ny)) return [nx, ny];
    }
    return null;
}

export function spawn(w: Wild, area: Area, rand: Rand = Math.random, now = 0): Actor {
    let x = 0.5;
    let y = 0.5;
    for (let i = 0; i < 60; i++) {
        const nx = between(rand, 0.06, 0.94);
        const ny = between(rand, 0.06, 0.94);
        if (area.ok(nx, ny)) {
            x = nx;
            y = ny;
            break;
        }
    }
    const a: Actor = { ...w, x, y, tx: x, ty: y, act: 'idle', left: 0, t0: now, dir: rand() < 0.5 ? 0 : 7 };
    a.left = between(rand, 200, 1600); // cada um decide numa hora: ninguém sai andando junto
    if (area.fly) begin(a, 'walk', [], area, rand, now);
    else if (w.mood === 'sleepy') begin(a, 'sleep', [], area, rand, now);
    return a;
}

function begin(a: Actor, act: Act, all: Actor[], area: Area, rand: Rand, now: number) {
    a.act = act;
    a.t0 = now;
    a.emote = undefined;
    a.prey = undefined;
    if (act === 'walk') {
        const p = area.fly
            ? [between(rand, 0.06, 0.94), between(rand, 0.08, 0.92)]
            : spotNear(area, a.x, a.y, 0.3, rand);
        if (!p) return begin(a, 'idle', all, area, rand, now);
        [a.tx, a.ty] = p;
        a.left = area.fly ? 9000 : 5000;
    } else if (act === 'chase') {
        const prey = all.filter((o) => o !== a && o.zone === a.zone && o.act !== 'sleep' && o.act !== 'flee');
        if (!prey.length) return begin(a, 'walk', all, area, rand, now);
        const p = prey[Math.floor(rand() * prey.length)];
        a.prey = p.key;
        a.left = between(rand, 2200, 3200);
        flee(p, a, area, now);
    } else if (act === 'sleep') {
        a.dir = 0;
        a.left = between(rand, 4000, 9000);
    } else if (act === 'hop') {
        a.left = 900;
    } else if (act === 'emote') {
        a.emote = EMOTES[Math.floor(rand() * EMOTES.length)];
        a.left = between(rand, 1400, 2000);
    } else if (act === 'look') {
        a.left = between(rand, 1400, 2400);
    } else {
        a.left = between(rand, 1000, 2600);
    }
}

/** Foge de `from`: corre pro lado oposto até onde der pisar. */
function flee(a: Actor, from: Pt, area: Area, now: number) {
    a.act = 'flee';
    a.t0 = now;
    a.prey = undefined;
    a.emote = 'surprise';
    a.left = 1800;
    let dx = (a.x - from.x) * area.aspect;
    let dy = a.y - from.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2]) {
        const c = Math.cos(turn);
        const s = Math.sin(turn);
        const ux = dx * c - dy * s;
        const uy = dx * s + dy * c;
        for (const len of [0.35, 0.22, 0.12]) {
            const nx = a.x + (ux * len) / area.aspect;
            const ny = a.y + uy * len;
            if (nx > 0.02 && nx < 0.98 && ny > 0.02 && ny < 0.98 && area.ok(nx, ny)) {
                a.tx = nx;
                a.ty = ny;
                return;
            }
        }
    }
    a.tx = a.x;
    a.ty = a.y;
}

function choose(a: Actor, all: Actor[], area: Area, rand: Rand, now: number) {
    const w = { ...WEIGHTS[a.mood] };
    if (area.fly) {
        begin(a, 'walk', all, area, rand, now);
        return;
    }
    if (area.still) {
        w.idle = (w.idle ?? 0) + (w.walk ?? 0) + (w.chase ?? 0);
        w.walk = 0;
        w.chase = 0;
    }
    if (!all.some((o) => o !== a && o.zone === a.zone && o.act !== 'sleep')) w.chase = 0;
    const acts = Object.keys(w) as Act[];
    let r = rand() * acts.reduce((s, k) => s + (w[k] ?? 0), 0);
    let pick = acts[acts.length - 1];
    for (const k of acts) {
        r -= w[k] ?? 0;
        if (r < 0) {
            pick = k;
            break;
        }
    }
    begin(a, pick, all, area, rand, now);
}

/** Tocaram nele: pula com um coração ou uma nota; quem dormia acorda assustado. Devolve se acordou. */
export function poke(a: Actor, now: number, rand: Rand = Math.random): boolean {
    const woke = a.act === 'sleep';
    a.act = 'hop';
    a.t0 = now;
    a.left = 900;
    a.prey = undefined;
    a.tx = a.x;
    a.ty = a.y;
    a.dir = 0;
    a.emote = woke ? 'surprise' : rand() < 0.5 ? 'heart' : 'note';
    return woke;
}

const LOOK = [2, 0, 6, 0];

/**
 * Um passo de todos (dt em ms, `now` = hora do relógio da cena). Mexe nos atores no lugar e devolve `true` se
 * alguma ação, direção ou emote mudou (aí a tela redesenha; a posição a tela escreve direto a cada quadro).
 * `threats`: por zona, quem assusta (o time passando): quem está perto foge, quem dorme acorda assustado.
 */
export function step(
    actors: Actor[],
    areas: Record<string, Area | undefined>,
    dt: number,
    now: number,
    threats: Record<string, Pt[] | undefined> = {},
    rand: Rand = Math.random,
): boolean {
    let changed = false;
    for (const a of actors) {
        const area = areas[a.zone];
        if (!area) continue;
        const before = `${a.act}${a.dir}${a.emote}${a.t0}`;
        for (const t of threats[a.zone] ?? []) {
            if (a.act === 'flee' || area.fly) break;
            if (Math.hypot((t.x - a.x) * area.aspect, t.y - a.y) > (t.r ?? 0.16)) continue;
            if (area.still) {
                if (a.emote !== 'surprise') begin(a, 'emote', actors, area, rand, now);
                a.emote = 'surprise';
            } else flee(a, t, area, now);
            break;
        }
        a.left -= dt;
        if (a.act === 'walk' || a.act === 'chase' || a.act === 'flee') {
            if (a.act === 'chase') {
                const p = actors.find((o) => o.key === a.prey);
                if (!p) a.left = 0;
                else {
                    a.tx = p.x;
                    a.ty = p.y;
                    if (Math.hypot((p.x - a.x) * area.aspect, p.y - a.y) < 0.05) {
                        begin(a, 'emote', actors, area, rand, now);
                        a.emote = 'heart';
                    }
                }
            }
            if (a.act === 'walk' || a.act === 'chase' || a.act === 'flee') {
                const k = a.act === 'flee' ? 2.2 : a.act === 'chase' ? 1.7 : 1;
                const len = (area.speed * k * dt) / 1000;
                const dx = (a.tx - a.x) * area.aspect;
                const dy = a.ty - a.y;
                const d = Math.hypot(dx, dy);
                if (d > 1e-4) a.dir = dirOf(dx, dy);
                if (d <= len) {
                    a.x = a.tx;
                    a.y = a.ty;
                    if (a.act !== 'chase') a.left = 0;
                } else {
                    const nx = a.x + (dx / d) * (len / area.aspect);
                    const ny = a.y + (dy / d) * len;
                    if (area.fly || area.ok(nx, ny)) {
                        a.x = nx;
                        a.y = ny;
                    } else a.left = 0;
                }
            }
        } else if (a.act === 'look') {
            a.dir = LOOK[Math.floor(a.left / 600) & 3];
        }
        if (a.left <= 0) choose(a, actors, area, rand, now);
        if (`${a.act}${a.dir}${a.emote}${a.t0}` !== before) changed = true;
    }
    return changed;
}
