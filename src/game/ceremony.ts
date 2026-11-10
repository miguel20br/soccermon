/**
 * Cerimônia do título na quadra (docs/planos/animacoes-novas.md, A1 e A2): o roteiro em ms e as posições em px do
 * mundo. Puro (sem Phaser): a MatchScene desenha, o teste confere o tempo e o lugar.
 *
 * - `taca` (todo título): o time pula no seu jeito, anda pro meio em meia-lua e o capitão ergue a taça (~3 s).
 * - `invasao` (só o título da Rota): silêncio, explosão, a torcida e os selvagens invadem e cercam o time, o capitão
 *   vai pro alto e cai sentado, levanta e ergue a taça, foto com o letreiro (~10,5 s).
 */
import type Phaser from 'phaser';

export type CeremonyKind = 'taca' | 'invasao';

export interface CeremonyPlan {
    /** O time pula (cada um no seu jeito). */
    jump: number;
    /** Andam pro meio (meia-lua). */
    gather: number;
    /** A torcida entra (só na invasão) e chega no anel. */
    invade?: number;
    ring?: number;
    /** O capitão vai pro alto (3 subidas, a última cai sentado) e levanta. */
    toss?: number;
    getUp?: number;
    /** Junta força, ergue a taça. */
    charge: number;
    lift: number;
    /** Foto (letreiro, só na invasão). */
    photo?: number;
    /** A tela segue (o FinalCard aparece). */
    end: number;
}

export const CHARGE_MS = 450;
export const WALK_MS = 700;
/** Cada subida do capitão jogado pro alto (sobe e desce). */
export const TOSS_MS = 480;

export function ceremonyPlan(kind: CeremonyKind): CeremonyPlan {
    if (kind === 'taca') return { jump: 0, gather: 600, charge: 1300, lift: 1300 + CHARGE_MS, end: 3000 };
    return {
        jump: 600,
        gather: 1500,
        invade: 1500,
        ring: 3500,
        toss: 5000,
        getUp: 5000 + TOSS_MS * 3 + 250,
        charge: 6700,
        lift: 6700 + CHARGE_MS,
        photo: 8200,
        end: 10500,
    };
}

/** Reduzir movimento: só a foto final, parada, por um instante (a invasão segura o letreiro 2 s). */
export const reducedHold = (kind: CeremonyKind) => (kind === 'invasao' ? 2000 : 1200);

export interface Pt {
    x: number;
    y: number;
}

/**
 * Meia-lua em volta do capitão: ele na frente (mais perto da câmera), os outros atrás em arco, de frente pra ele.
 * `n` = quantos além do capitão. Raio em px.
 */
export function halfMoon(center: Pt, n: number, r = 64): { captain: Pt; others: Pt[] } {
    const captain = { x: center.x, y: center.y + 22 };
    const others = Array.from({ length: n }, (_, i) => {
        // de 200° a 340° (o arco de cima, atrás dele): espalhados por igual
        const a = ((200 + (n === 1 ? 70 : (140 * i) / (n - 1))) * Math.PI) / 180;
        return { x: Math.round(center.x + Math.cos(a) * r), y: Math.round(center.y + Math.sin(a) * r * 0.5) };
    });
    return { captain, others };
}

/** Sorteio pequeno e repetível (a mesma partida dá a mesma invasão: o clipe sai igual). */
function rng(seed: string) {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

export interface Fan {
    from: Pt;
    to: Pt;
    /** Quando sai correndo (ms desde `invade`) e quanto leva até o anel. */
    delay: number;
    dur: number;
    /** Camisa clara (1 em 4) ou na cor do clube. */
    light: boolean;
}

/**
 * A torcida que invade: `n` torcedores descendo das duas arquibancadas (em cima e embaixo da quadra) em ondas, até um
 * anel em volta do time (`center`, raio rx por ry). Nada dentro do anel: o time fica livre no meio.
 */
export function invasionFans(seed: string, center: Pt, n: number, size: { w: number; h: number }): Fan[] {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
        const top = i % 2 === 0;
        const a = (i / n) * Math.PI * 2 + r() * 0.3;
        const rx = 108 + r() * 30;
        const ry = 60 + r() * 16;
        const to = { x: Math.round(center.x + Math.cos(a) * rx), y: Math.round(center.y + Math.sin(a) * ry) };
        const from = { x: Math.round(to.x + (r() - 0.5) * 160), y: top ? -12 - r() * 30 : size.h + 12 + r() * 30 };
        return { from, to, delay: Math.floor(i / 8) * 260 + r() * 200, dur: 1300 + r() * 500, light: r() < 0.25 };
    });
}

/** Os selvagens da Rota que invadem junto (Pidgey por cima, Rattata no chão, Oddish e o Psyduck atrasado). */
export const INVADERS: { id: number; fly: boolean; late: number }[] = [
    { id: 16, fly: true, late: 0 },
    { id: 19, fly: false, late: 150 },
    { id: 43, fly: false, late: 450 },
    { id: 54, fly: false, late: 1100 },
];

const css = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * O torcedor de 7 px (o mesmo traço da torcida do Estádio): cabelo, rosto, camisa e perna; no 2º quadro, braços pra
 * cima. `fan-c-*` na cor do clube, `fan-l-*` de camisa clara. Refeito quando a cor muda.
 */
export function ensureFanTextures(scene: Phaser.Scene, club: number) {
    const tag = `fan-color-${club}`;
    if (scene.registry.get('fan-color') === tag) return;
    scene.registry.set('fan-color', tag);
    for (const [key, shirt] of [
        ['fan-c', css(club)],
        ['fan-l', '#e8e6f0'],
    ] as const) {
        for (const f of [0, 1]) {
            const name = `${key}-${f}`;
            if (scene.textures.exists(name)) scene.textures.remove(name);
            const el = document.createElement('canvas');
            el.width = 7;
            el.height = 11;
            const c = el.getContext('2d')!;
            const px = (x: number, y: number, w: number, h: number, color: string) => {
                c.fillStyle = color;
                c.fillRect(x, y, w, h);
            };
            const top = f ? 2 : 2;
            if (f) {
                px(0, 0, 1, 4, shirt);
                px(6, 0, 1, 4, shirt);
            } else {
                px(0, top + 3, 1, 3, shirt);
                px(6, top + 3, 1, 3, shirt);
            }
            px(1, top, 5, 1, '#2b1d14');
            px(1, top + 1, 5, 2, '#d9b08c');
            px(1, top + 3, 5, 4, shirt);
            px(2, top + 7, 1, 2, '#1b1e3a');
            px(4, top + 7, 1, 2, '#1b1e3a');
            scene.textures.addCanvas(name, el);
        }
    }
}
