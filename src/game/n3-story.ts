import Phaser from 'phaser';
import { hexToNumber, TYPE_COLOR } from '../ui/type-colors';
import { crack, shockwave, type TypeFx } from './cine';

/**
 * O golpe máximo N3 contado pelo tipo (Miguel, 04/11/2026: "todos os outros golpes máximos subam de nível de produção",
 * na régua do Counter). Por cima do kit de cinema (cine.ts), cada um dos 16 tipos deixa a marca dele no voo da bola e na
 * chegada (Fogo põe o chão em brasa, Água deixa esteira de espuma, Elétrico solta raio que ricocheteia, Gelo trilha de
 * cristais, Psíquico o eco da bola, Fantasma some e reaparece, Dragão a serpente...) e as 12 assinaturas ganham um toque
 * a mais (o feixe do Hyper Beam, a estrela de fogo do Fire Blast, o raio em cadeia do Pikachu, a roleta do Metronome...).
 * Só tela.
 *
 * Tudo em 3 Graphics redesenhados a cada quadro (o chão, a tinta e a camada de cima) e nas partículas do `TypeFx`: nada
 * cria textura nem objeto por quadro (o eco e as iscas são 6 imagens da bola criadas uma vez). "Reduzir movimento": só o
 * rastro no chão parado sumindo e as rajadas da chegada; nada pisca, gira nem some.
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const colorOf = (type: string) => hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
type G = Phaser.GameObjects.Graphics;
interface P {
    x: number;
    y: number;
}

/** Um ponto do voo: a bola no ar, a sombra no chão, a direção, a hora e um sorteio fixo dele. */
interface Sample {
    x: number;
    y: number;
    gx: number;
    gy: number;
    ux: number;
    uy: number;
    t: number;
    r: number;
}

/** Marca solta (raio, soco, anel, pedra): de onde, até onde, quando nasce e quanto vive. */
interface Mark {
    kind: string;
    x: number;
    y: number;
    t: number;
    life: number;
    r: number;
    to?: P;
    pts?: number[];
    ux?: number;
    uy?: number;
    done?: boolean;
}

interface Ctx {
    scene: Phaser.Scene;
    fx: TypeFx;
    type: string;
    color: number;
    light: number;
    reduce: boolean;
    now: number;
    /** Desde o chute (ms). */
    age: number;
    ball: P;
    dir: P;
    path: Sample[];
    marks: Mark[];
    floor: G;
    top: G;
    ink: G;
    from: P;
    goal: P;
    land: { x: number; y: number; t: number; goal: boolean } | null;
    depth: number;
    images: Phaser.GameObjects.Image[];
    rivals: () => P[];
    /** Quando cada coisa saiu da última vez (`every`) e o estado do Fantasma. */
    last: Record<string, number>;
}

interface Look {
    /** Quanto o rastro do chão dura (ms). */
    life: number;
    floor?(c: Ctx, s: Sample, k: number, i: number, prev: Sample | null): void;
    /** A cada quadro do voo (solta marcas, partículas). */
    tick?(c: Ctx): void;
    /** A cada quadro, em volta da bola (no voo). */
    air?(c: Ctx): void;
    /** Uma marca (raio, anel, pedra...), viva por `k` (1 nascendo, 0 sumindo). */
    mark?(c: Ctx, m: Mark, k: number, a: number): void;
    /** Na chegada (uma vez). */
    hit?(c: Ctx, x: number, y: number): void;
    /** Depois da chegada, a cada quadro por `landMs` (`a` = ms desde ela). */
    after?(c: Ctx, a: number, x: number, y: number): void;
    landMs?: number;
    /** A bola some (Fantasma): alfa dela agora. */
    ballAlpha?(c: Ctx): number;
}

// ------------------------------------------------------------------ desenho
const perp = (u: P): P => ({ x: -u.y, y: u.x });

/** Estrela de `n` pontas (raio de dentro `r0`, de fora `r1`). */
function star(g: G, x: number, y: number, r0: number, r1: number, n: number, rot: number) {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < n * 2; i++) {
        const a = rot + (i * Math.PI) / n;
        const r = i % 2 ? r0 : r1;
        pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r));
    }
    g.fillPoints(pts, true);
}

/** Zigue-zague de raio (pontos `[x0, y0, x1, y1...]`), sorteado uma vez. */
function zig(x0: number, y0: number, x1: number, y1: number, seg: number, jit: number): number[] {
    const out = [x0, y0];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < seg; i++) {
        const t = i / seg;
        const j = rnd(-jit, jit);
        out.push(x0 + dx * t + (-dy / l) * j, y0 + dy * t + (dx / l) * j);
    }
    out.push(x1, y1);
    return out;
}

function polyline(g: G, pts: number[]) {
    g.beginPath().moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.strokePath();
}

/** Raio grosso na cor e o miolo branco. */
/** Raio: a cor por baixo (`ink`), o halo e o miolo branco por cima (`top`). */
function boltDraw(c: Ctx, pts: number[], color: number, w: number, k: number) {
    c.top.lineStyle(w * 2.4, color, 0.35 * k);
    polyline(c.top, pts);
    c.ink.lineStyle(w, color, 0.95 * k);
    polyline(c.ink, pts);
    c.top.lineStyle(Math.max(1, w * 0.4), 0xffffff, k);
    polyline(c.top, pts);
}

/** Anel em pé, de frente pra direção `u` (a onda do ar que a bola rasga). */
function airRing(g: G, x: number, y: number, u: P, R: number, flat: number) {
    const p = perp(u);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        pts.push(
            new Phaser.Math.Vector2(
                x + p.x * Math.cos(a) * R + u.x * Math.sin(a) * R * flat,
                y + p.y * Math.cos(a) * R * 0.75 + u.y * Math.sin(a) * R * flat,
            ),
        );
    }
    g.strokePoints(pts, true, true);
}

function leaf(g: G, x: number, y: number, s: number, a: number) {
    const c = Math.cos(a);
    const n = Math.sin(a);
    g.fillPoints(
        [
            new Phaser.Math.Vector2(x + c * s * 1.4, y + n * s * 1.4),
            new Phaser.Math.Vector2(x - n * s * 0.5, y + c * s * 0.5),
            new Phaser.Math.Vector2(x - c * s * 1.4, y - n * s * 1.4),
            new Phaser.Math.Vector2(x + n * s * 0.5, y - c * s * 0.5),
        ],
        true,
    );
}

function heart(g: G, x: number, y: number, s: number) {
    g.fillCircle(x - s * 0.5, y - s * 0.25, s * 0.55);
    g.fillCircle(x + s * 0.5, y - s * 0.25, s * 0.55);
    g.fillTriangle(x - s * 1.02, y - s * 0.05, x + s * 1.02, y - s * 0.05, x, y + s * 1.05);
}

function rock(g: G, x: number, y: number, s: number, a: number, light: number, dark: number) {
    const pts = [0, 1.3, 2.4, 3.6, 4.9].map(
        (k, i) => new Phaser.Math.Vector2(x + Math.cos(a + k) * s * (i % 2 ? 0.8 : 1.1), y + Math.sin(a + k) * s),
    );
    g.fillStyle(light, 1).fillPoints(pts, true);
    g.fillStyle(dark, 0.6).fillTriangle(pts[2].x, pts[2].y, pts[3].x, pts[3].y, x, y);
}

/** Labareda em pé no chão (`h` de altura), tremendo. */
function tongue(g: G, x: number, y: number, w: number, h: number, sway: number) {
    g.fillStyle(0xff5a1f, 0.75).fillTriangle(x - w, y, x + w, y, x + sway, y - h);
    g.fillStyle(0xffd23f, 0.9).fillTriangle(x - w * 0.5, y, x + w * 0.5, y, x + sway * 0.6, y - h * 0.6);
}

const spawn = (c: Ctx, m: Omit<Mark, 't' | 'r'> & { t?: number }) =>
    c.marks.push({ ...m, t: m.t ?? c.now, r: Math.random() });

/** Deu a hora de soltar de novo (`key`, a cada `ms`). */
const every = (c: Ctx, key: string, ms: number) => {
    if (c.now - (c.last[key] ?? -1e9) < ms) return false;
    c.last[key] = c.now;
    return true;
};

// ------------------------------------------------------------------ os 16 tipos
// (medidas em px do mundo: no celular em pé a quadra aparece a ~0,67, então tudo é graúdo de propósito)
const TYPES: Record<string, Look> = {
    Normal: {
        life: 600,
        tick: (c) => {
            if (every(c, 'ring', 75)) spawn(c, { kind: 'ring', x: c.ball.x, y: c.ball.y, life: 340, ...u(c) });
            const s = c.path.at(-1);
            if (s && every(c, 'dust', 110)) c.fx.burst('Dust', s.gx, s.gy, 2, c.depth - 2);
        },
        mark: (c, m, k, a) => {
            if (m.kind !== 'ring') return;
            const R = 10 + a * 0.12;
            c.ink.lineStyle(4 * k + 4, 0x3a3a2a, 0.45 * k);
            airRing(c.ink, m.x, m.y, { x: m.ux ?? 1, y: m.uy ?? 0 }, R, 0.3);
            c.top.lineStyle(4 * k + 1.5, m.r > 0.5 ? 0xffffff : 0xfff3c0, 0.95 * k);
            airRing(c.top, m.x, m.y, { x: m.ux ?? 1, y: m.uy ?? 0 }, R, 0.3);
        },
        hit: (c, x, y) => {
            c.fx.burst('Normal', x, y, 34, c.depth + 1);
            c.fx.burst('Dust', x, y + 8, 14, c.depth - 2);
        },
        landMs: 420,
        after: (c, a, x, y) => {
            const k = 1 - a / 420;
            const g = Math.min(1, a / 70);
            c.top.fillStyle(0xffffff, 0.9 * k);
            star(c.top, x, y, (22 + a * 0.1) * g, (60 + a * 0.35) * g, 8, a / 300);
            c.top.fillStyle(0xfff3c0, k);
            star(c.top, x, y, 10 * g, (28 + a * 0.12) * g, 8, a / 300 + 0.2);
        },
    },
    Fire: {
        life: 1500,
        floor: (c, s, k, i) => {
            // o chão em brasa no caminho da bola, com labaredas tremendo
            const fl = c.reduce ? 1 : 0.8 + 0.2 * Math.sin(c.now / 45 + s.r * 9);
            c.floor.fillStyle(0x9a2a08, 0.5 * k).fillEllipse(s.gx, s.gy + 1, (26 + s.r * 16) * fl, 11 + s.r * 4);
            c.floor.fillStyle(0xff6a1f, 0.8 * k).fillEllipse(s.gx, s.gy, (16 + s.r * 10) * fl, 7 + s.r * 3);
            c.floor.fillStyle(0xffd23f, 0.95 * k).fillEllipse(s.gx, s.gy, 8 + 6 * k, 3 + 2 * k);
            if (i % 2 === 0 && k > 0.15)
                tongue(c.floor, s.gx, s.gy, 7, (18 + s.r * 18) * k * fl, c.reduce ? 0 : Math.sin(c.now / 70 + i) * 4);
        },
        tick: (c) => {
            const s = c.path.at(-1);
            if (s && every(c, 'ember', 60)) c.fx.burst('Fire', s.gx, s.gy, 3, c.depth - 2);
        },
        hit: (c, x, y) => c.fx.burst('Fire', x, y, 40, c.depth + 1),
        landMs: 1000,
        after: (c, a, x, y) => {
            // a coroa de fogo onde a bola bateu
            const k = 1 - a / 1000;
            const grow = Math.min(1, a / 160);
            for (let j = 0; j < 12; j++) {
                const ang = (j / 12) * Math.PI * 2;
                const r = 18 + 40 * grow;
                const h = (26 + (j % 3) * 10) * k * (0.85 + 0.15 * Math.sin(a / 40 + j));
                tongue(c.top, x + Math.cos(ang) * r, y + 8 + Math.sin(ang) * r * 0.45, 7, h, 0);
            }
        },
    },
    Water: {
        life: 1300,
        floor: (c, s, k, i) => {
            // a esteira de espuma abrindo em V atrás da bola
            const a = c.now - s.t;
            const sp = 5 + Math.min(a, 900) * 0.03;
            const p = { x: -s.uy, y: s.ux };
            c.floor.fillStyle(0x3a6ad0, 0.4 * k).fillEllipse(s.gx, s.gy, 22 + sp * 2.4, 10 + sp);
            c.floor.fillStyle(0xffffff, 0.95 * k);
            for (const side of [-1, 1])
                c.floor.fillCircle(s.gx + p.x * sp * side, s.gy + p.y * sp * side * 0.6, 4 + s.r * 3 * k);
            if (i % 2) c.floor.fillCircle(s.gx, s.gy, 3 + 2 * k);
        },
        hit: (c, x, y) => c.fx.burst('Water', x, y, 40, c.depth + 1),
        landMs: 900,
        after: (c, a, x, y) => {
            const k = 1 - a / 900;
            for (let j = 0; j < 3; j++) {
                const r = 14 + a * 0.13 * (1 + j * 0.45);
                c.top.lineStyle(6 - j * 1.5, j === 1 ? 0xffffff : 0x6390f0, 0.85 * k).strokeEllipse(x, y + 6, r * 2, r);
            }
        },
    },
    Electric: {
        life: 600,
        tick: (c) => {
            // o raio que sai da bola, bate no chão e ricocheteia
            if (!every(c, 'bolt', 70)) return;
            const s = c.path.at(-1);
            if (!s) return;
            const p = perp(c.dir);
            const b = { x: -c.dir.x, y: -c.dir.y };
            const side = Math.random() < 0.5 ? -1 : 1;
            const p1 = { x: s.gx + p.x * side * rnd(30, 70) + b.x * rnd(14, 40), y: s.gy + p.y * side * rnd(20, 44) };
            const p2 = {
                x: p1.x - p.x * side * rnd(40, 80) + b.x * rnd(30, 60),
                y: p1.y - p.y * side * rnd(20, 44),
            };
            const pts = [...zig(c.ball.x, c.ball.y, p1.x, p1.y, 5, 10), ...zig(p1.x, p1.y, p2.x, p2.y, 5, 10).slice(2)];
            spawn(c, { kind: 'bolt', x: p1.x, y: p1.y, life: 160, pts });
            spawn(c, { kind: 'scorch', x: p1.x, y: p1.y, life: 520 });
            spawn(c, { kind: 'scorch', x: p2.x, y: p2.y, life: 420 });
        },
        mark: (c, m, k) => {
            if (m.kind === 'bolt' && m.pts) boltDraw(c, m.pts, 0xf7d02c, 3.6, k);
            else if (m.kind === 'scorch') {
                c.floor.fillStyle(0xfff27a, 0.85 * k);
                star(c.floor, m.x, m.y, 2.5, 12 * k + 4, 4, m.r * 3);
            } else if (m.kind === 'strike' && m.pts) boltDraw(c, m.pts, 0xf7d02c, 5, k);
        },
        hit: (c, x, y) => {
            c.fx.burst('Electric', x, y, 36, c.depth + 1);
            // os raios caindo do céu em volta do gol
            for (let j = 0; j < 4; j++) {
                const tx = x + rnd(-60, 60);
                const ty = y + rnd(-10, 20);
                spawn(c, {
                    kind: 'strike',
                    x: tx,
                    y: ty,
                    t: c.now + j * 90,
                    life: 260,
                    pts: zig(tx + rnd(-50, 50), ty - 260, tx, ty, 8, 16),
                });
                spawn(c, { kind: 'scorch', x: tx, y: ty, t: c.now + j * 90, life: 600 });
            }
        },
    },
    Grass: {
        life: 1400,
        floor: (c, s, k, i, prev) => {
            // o cipó crescendo no chão atrás da bola, com folhas
            const p = { x: -s.uy, y: s.ux };
            const o = Math.sin(i * 0.9) * 12;
            if (prev) {
                const po = Math.sin((i - 1) * 0.9) * 12;
                c.floor.lineStyle(8, 0x2d6a14, 0.95 * k);
                c.floor.lineBetween(prev.gx + p.x * po, prev.gy + p.y * po, s.gx + p.x * o, s.gy + p.y * o);
            }
            if (i % 3 === 0) {
                c.floor.fillStyle(0x7ac74c, 0.95 * k);
                leaf(c.floor, s.gx + p.x * o + 8, s.gy + p.y * o - 4, 8 * k + 3, 0.7);
                leaf(c.floor, s.gx + p.x * o - 8, s.gy + p.y * o - 4, 8 * k + 3, -0.7);
            }
        },
        air: (c) => {
            // as folhas em espiral em volta da bola
            for (let j = 0; j < 7; j++) {
                const a = c.now / 70 + (j * Math.PI * 2) / 7;
                const front = Math.sin(a) > 0;
                c.top.fillStyle(front ? 0xb6f07a : 0x4e9a2a, front ? 1 : 0.7);
                leaf(c.top, c.ball.x + Math.cos(a) * 34, c.ball.y + Math.sin(a) * 15 - 3, 8, a + 1.2);
            }
        },
        hit: (c, x, y) => c.fx.burst('Grass', x, y, 44, c.depth + 1),
        landMs: 800,
        after: (c, a, x, y) => {
            const k = 1 - a / 800;
            for (let j = 0; j < 12; j++) {
                const ang = j * 0.53 + a / 150;
                const r = 10 + a * 0.18;
                c.top.fillStyle(j % 2 ? 0xb6f07a : 0x7ac74c, k);
                leaf(c.top, x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.6, 7, ang + 1.5);
            }
        },
    },
    Ice: {
        life: 1500,
        floor: (c, s, k, i, prev) => {
            // a trilha de gelo e os cristais brotando nela
            if (prev) {
                c.floor.lineStyle(26, 0x96d9d6, 0.55 * k).lineBetween(prev.gx, prev.gy, s.gx, s.gy);
                c.floor.lineStyle(14, 0xe8fbff, 0.8 * k).lineBetween(prev.gx, prev.gy, s.gx, s.gy);
                c.floor.lineStyle(3, 0xffffff, 0.95 * k).lineBetween(prev.gx, prev.gy - 6, s.gx, s.gy - 6);
            }
            if (i % 3) return;
            const a = c.now - s.t;
            const h = Math.min(1, a / 160) * (24 + s.r * 24) * (k > 0.25 ? 1 : k * 4);
            const x = s.gx + (s.r - 0.5) * 16;
            c.floor.fillStyle(0x4a9ab0, 0.9).fillTriangle(x - 8, s.gy + 1, x + 8, s.gy + 1, x, s.gy - h - 2);
            c.floor.fillStyle(0xe8fbff, 0.95).fillTriangle(x - 6, s.gy, x + 6, s.gy, x, s.gy - h);
            c.floor.fillStyle(0x96d9d6, 0.95).fillTriangle(x, s.gy, x + 6, s.gy, x, s.gy - h);
        },
        hit: (c, x, y) => c.fx.burst('Ice', x, y, 40, c.depth + 1),
        landMs: 1100,
        after: (c, a, x, y) => {
            const k = a < 800 ? 1 : 1 - (a - 800) / 300;
            const grow = Math.min(1, a / 150);
            c.floor.fillStyle(0xc8f4ff, 0.38 * k).fillEllipse(x, y + 8, 160 * grow, 60 * grow);
            for (let j = 0; j < 7; j++) {
                const ang = -Math.PI / 2 + (j - 3) * 0.42;
                const h = (40 + (j % 2) * 22) * grow;
                const bx = x + (j - 3) * 16;
                const by = y + 12;
                c.ink.fillStyle(0xe8fbff, 0.95 * k);
                c.ink.fillTriangle(bx - 8, by, bx + 8, by, bx + Math.cos(ang) * h, by + Math.sin(ang) * h);
                c.ink.fillStyle(0x96d9d6, 0.9 * k);
                c.ink.fillTriangle(bx, by, bx + 8, by, bx + Math.cos(ang) * h, by + Math.sin(ang) * h);
            }
        },
    },
    Fighting: {
        life: 600,
        tick: (c) => {
            // a rajada de socos na bola
            if (every(c, 'pow', 100))
                spawn(c, { kind: 'pow', x: c.ball.x + rnd(-10, 10), y: c.ball.y + rnd(-10, 10), life: 280, ...u(c) });
        },
        mark: (c, m, k, a) => {
            if (m.kind !== 'pow') return;
            const sc = 0.5 + Math.min(1, a / 90) * 0.8;
            c.top.fillStyle(0xffffff, 0.9 * k);
            star(c.top, m.x, m.y, 10 * sc, 30 * sc, 7, m.r * 6);
            c.top.fillStyle(0xc22e28, k);
            star(c.top, m.x, m.y, 5 * sc, 16 * sc, 7, m.r * 6 + 0.3);
            c.top.lineStyle(3, 0xff9a5c, 0.8 * k);
            airRing(c.top, m.x, m.y, { x: m.ux ?? 1, y: m.uy ?? 0 }, 14 + a * 0.1, 0.25);
        },
        hit: (c, x, y) => c.fx.burst('Fighting', x, y, 34, c.depth + 1),
        landMs: 420,
        after: (c, a, x, y) => {
            const k = 1 - a / 420;
            const sc = Math.min(1, a / 80);
            c.top.fillStyle(0xffffff, k);
            star(c.top, x, y, 30 * sc, 100 * sc, 11, 0.2);
            c.top.fillStyle(0xc22e28, k);
            star(c.top, x, y, 18 * sc, 56 * sc, 11, 0.45);
        },
    },
    Poison: {
        life: 1600,
        floor: (c, s, k, i) => {
            // a gosma no chão e as bolhas subindo e estourando
            if (i % 2 === 0) {
                c.floor.fillStyle(0x5a1f59, 0.75 * k);
                c.floor.fillCircle(s.gx, s.gy, 8 + s.r * 6);
                c.floor.fillCircle(s.gx + 9, s.gy + 2, 5 + s.r * 4);
                c.floor.fillStyle(0xa33ea1, 0.9 * k).fillCircle(s.gx - 1, s.gy - 1, 5 + s.r * 3);
                c.floor.fillStyle(0xd48cff, 0.9 * k).fillCircle(s.gx - 3, s.gy - 3, 2.6);
            }
            const a = c.now - s.t;
            if (i % 3 === 1 && a < 1100 && !c.reduce) {
                const r = 4 + (a / 1100) * 7;
                c.floor.lineStyle(3, 0xa33ea1, 0.95 * k).strokeCircle(s.gx + s.r * 8, s.gy - a * 0.045, r);
            }
        },
        hit: (c, x, y) => c.fx.burst('Poison', x, y, 36, c.depth + 1),
        landMs: 1200,
        after: (c, a, x, y) => {
            const k = 1 - a / 1200;
            for (let j = 0; j < 6; j++) {
                const ang = j * 1.05;
                const r = 30 + a * 0.06;
                c.ink.fillStyle(j % 2 ? 0xa33ea1 : 0x7b2d7a, 0.3 * k);
                c.ink.fillCircle(x + Math.cos(ang) * r * 0.7, y + Math.sin(ang) * r * 0.4, 30 + a * 0.05);
            }
        },
    },
    Ground: {
        life: 1600,
        floor: (c, s, k, i, prev) => {
            // o chão rachando atrás da bola
            if (!prev) return;
            const p = { x: -s.uy, y: s.ux };
            const o = (s.r - 0.5) * 14;
            const po = (prev.r - 0.5) * 14;
            for (const [w, col, al] of [
                [15, 0xc09a3a, 0.6],
                [5.5, 0x2a1a08, 0.95],
            ] as const) {
                c.floor.lineStyle(w, col, al * k);
                c.floor.lineBetween(prev.gx + p.x * po, prev.gy + p.y * po * 0.5, s.gx + p.x * o, s.gy + p.y * o * 0.5);
            }
            if (i % 3 === 0) {
                const side = s.r > 0.5 ? 1 : -1;
                c.floor.lineStyle(3, 0x2a1a08, 0.9 * k);
                c.floor.lineBetween(s.gx, s.gy, s.gx + p.x * side * 24 - s.ux * 9, s.gy + p.y * side * 12);
            }
        },
        tick: (c) => {
            const s = c.path.at(-1);
            if (s && every(c, 'rocks', 100)) c.fx.burst('Ground', s.gx, s.gy, 3, c.depth - 2);
        },
        hit: (c, x, y) => {
            crack(c.scene, x, y + 6, c.color, 3.2, 3, c.reduce).fade(1400);
            c.fx.burst('Ground', x, y, 30, c.depth + 1);
            c.fx.burst('Dust', x, y + 8, 16, c.depth - 2);
        },
    },
    Flying: {
        life: 600,
        tick: (c) => {
            if (every(c, 'ring', 85)) spawn(c, { kind: 'ring', x: c.ball.x, y: c.ball.y, life: 400, ...u(c) });
        },
        mark: (c, m, k, a) => {
            if (m.kind !== 'ring') return;
            c.top.lineStyle(3.5, 0xffffff, 0.8 * k);
            airRing(c.top, m.x, m.y, { x: m.ux ?? 1, y: m.uy ?? 0 }, 9 + a * 0.1, 0.4);
        },
        air: (c) => {
            // o vento cortante enrolando na bola
            for (let j = 0; j < 3; j++) {
                const pts: Phaser.Math.Vector2[] = [];
                for (let s = 0; s < 7; s++) {
                    const a = c.now / 55 + j * 2.1 - s * 0.35;
                    const back = s * 12;
                    pts.push(
                        new Phaser.Math.Vector2(
                            c.ball.x - c.dir.x * back + Math.cos(a) * 26,
                            c.ball.y - c.dir.y * back + Math.sin(a) * 15,
                        ),
                    );
                }
                c.top.lineStyle(3, j ? 0xa98ff3 : 0xffffff, 0.85).strokePoints(pts, false, true);
            }
        },
        hit: (c, x, y) => c.fx.burst('Flying', x, y, 36, c.depth + 1),
        landMs: 800,
        after: (c, a, x, y) => {
            // o redemoinho subindo do gol
            const k = 1 - a / 800;
            for (let j = 0; j < 6; j++) {
                const r = 18 + j * 9;
                c.top.lineStyle(4, j % 2 ? 0xa98ff3 : 0xffffff, 0.85 * k);
                const ph = a / 60 + j;
                c.top.strokeEllipse(x + Math.cos(ph) * 6, y - j * 18, r * 2, r * 0.6);
            }
        },
    },
    Psychic: {
        life: 900,
        floor: (c, s, k, i) => {
            if (i % 4) return;
            const a = c.now - s.t;
            c.floor.lineStyle(4, 0xf95587, 0.7 * k).strokeEllipse(s.gx, s.gy, 20 + a * 0.08, 10 + a * 0.04);
        },
        air: (c) => {
            // o eco da bola e o ar distorcendo em volta dela
            echoes(c, 4, 0xf95587);
            for (let j = 0; j < 3; j++) {
                const f = ((c.now / 6 + j * 15) % 45) / 45;
                const R = 18 + f * 44;
                const pts: Phaser.Math.Vector2[] = [];
                for (let i = 0; i < 20; i++) {
                    const a = (i / 20) * Math.PI * 2;
                    const w = R + Math.sin(a * 5 + c.now / 40) * 4;
                    pts.push(new Phaser.Math.Vector2(c.ball.x + Math.cos(a) * w, c.ball.y + Math.sin(a) * w * 0.7));
                }
                c.top.lineStyle(3, j % 2 ? 0xffb3cf : 0xf95587, 0.85 * (1 - f)).strokePoints(pts, true, true);
            }
        },
        hit: (c, x, y) => c.fx.burst('Psychic', x, y, 30, c.depth + 1),
        landMs: 700,
        after: (c, a, x, y) => {
            const k = 1 - a / 700;
            for (let j = 0; j < 4; j++) {
                const R = a < 220 ? 140 * (1 - a / 220) + j * 10 : 18 + (a - 220) * 0.28 + j * 16;
                c.top.lineStyle(4, j % 2 ? 0xffffff : 0xf95587, 0.9 * k).strokeEllipse(x, y, R * 2, R * 1.4);
            }
        },
    },
    Bug: {
        life: 600,
        air: (c) => {
            // o enxame em volta da bola e as duas iscas se abrindo
            for (let j = 0; j < 14; j++) {
                const x =
                    c.ball.x + Math.sin((c.now / 90) * (1 + j * 0.13) + j) * 26 + Math.cos(c.now / 53 + j * 2) * 10;
                const y = c.ball.y + Math.cos((c.now / 70) * (1 + j * 0.1) + j * 1.7) * 17;
                c.ink.fillStyle(0x3a420c, 1).fillCircle(x, y, 3.4);
                c.top.fillStyle(0xe0f060, 0.9).fillCircle(x, y, 2.4);
                const flap = Math.sin(c.now / 18 + j) > 0 ? 4.4 : 2.2;
                c.top.fillStyle(0xffffff, 0.65).fillEllipse(x - 2.5, y - 2.5, flap, 2.6);
                c.top.fillStyle(0xffffff, 0.65).fillEllipse(x + 2.5, y - 2.5, flap, 2.6);
            }
            decoys(c);
        },
        hit: (c, x, y) => c.fx.burst('Bug', x, y, 44, c.depth + 1),
    },
    Rock: {
        life: 900,
        air: (c) => {
            // as pedras orbitando a bola
            for (let j = 0; j < 4; j++) {
                const a = c.now / 120 + (j * Math.PI) / 2;
                const x = c.ball.x + Math.cos(a) * 34;
                const y = c.ball.y + Math.sin(a) * 17;
                rock(c.ink, x, y, 8, c.now / 90 + j, 0xb6a136, 0x5a4e1c);
            }
        },
        tick: (c) => {
            // e as que caem atrás dela, quicando no chão
            const s = c.path.at(-1);
            if (s && every(c, 'fall', 110))
                spawn(c, { kind: 'fall', x: c.ball.x, y: c.ball.y, to: { x: s.gx, y: s.gy }, life: 900 });
        },
        mark: (c, m, k, a) => {
            if (m.kind !== 'fall' || !m.to) return;
            const f = Math.min(1, a / 220);
            const hop = f === 1 ? Math.max(0, Math.sin(((a - 220) / 180) * Math.PI)) * 7 : 0;
            const y = m.y + (m.to.y - m.y) * f * f - hop;
            if (f === 1 && !m.done) {
                m.done = true;
                c.fx.burst('Dust', m.to.x, m.to.y, 3, c.depth - 2);
            }
            c.ink.fillStyle(0x000000, 0.25 * k).fillEllipse(m.to.x, m.to.y + 2, 14, 5);
            rock(c.ink, m.x - (m.x - m.to.x) * f, y, 7 * (0.7 + m.r * 0.6), m.r * 6 + a / 200, 0xb6a136, 0x5a4e1c);
        },
        hit: (c, x, y) => {
            // o desabamento em cima do gol
            for (let j = 0; j < 8; j++) {
                const tx = x + rnd(-60, 60);
                const ty = y + rnd(-6, 24);
                spawn(c, {
                    kind: 'fall',
                    x: tx + rnd(-16, 16),
                    y: ty - 220,
                    to: { x: tx, y: ty },
                    t: c.now + j * 60,
                    life: 900,
                });
            }
            c.fx.burst('Rock', x, y, 28, c.depth + 1);
        },
    },
    Ghost: {
        life: 600,
        ballAlpha: (c) => {
            if (c.reduce || c.land) return 1;
            return c.age % 420 < 260 ? 1 : 0;
        },
        tick: (c) => {
            if (c.reduce) return;
            // o anel de fumaça onde ela some e onde ela volta
            const phase = c.age % 420 < 260 ? 1 : 0;
            if (c.last.ghost !== phase) {
                c.last.ghost = phase;
                spawn(c, { kind: 'puff', x: c.ball.x, y: c.ball.y, life: 280 });
            }
        },
        mark: (c, m, k, a) => {
            if (m.kind !== 'puff') return;
            c.top.lineStyle(4, 0xb69ae0, 0.9 * k).strokeCircle(m.x, m.y, 8 + a * 0.14);
            c.top.fillStyle(0x735797, 0.55 * k).fillCircle(m.x, m.y, 18 * k);
        },
        air: (c) => {
            // as almas atrás dela
            const n = c.path.length;
            for (let j = 1; j <= 6; j++) {
                const s = c.path[n - 1 - j * 2];
                if (!s) break;
                const w = Math.sin(c.now / 80 + j) * 9;
                c.top.fillStyle(j % 2 ? 0xb69ae0 : 0x735797, 0.45 * (1 - j / 7));
                c.top.fillCircle(s.x - s.uy * w, s.y + s.ux * w, 13 - j * 1.5);
            }
        },
        hit: (c, x, y) => c.fx.burst('Ghost', x, y, 32, c.depth + 1),
        landMs: 800,
        after: (c, a, x, y) => {
            const k = 1 - a / 800;
            for (let j = 0; j < 8; j++) {
                const ang = (j / 8) * Math.PI * 2;
                const r = a * 0.14;
                c.top.fillStyle(j % 2 ? 0xb69ae0 : 0x735797, 0.6 * k);
                c.top.fillCircle(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.6 - a * 0.03, 14 * k + 4);
            }
        },
    },
    Dragon: {
        life: 600,
        air: (c) => {
            // a serpente de energia acompanhando a bola (ela é a pérola na boca)
            const n = c.path.length;
            const len = Math.min(20, n);
            for (let i = len - 1; i >= 0; i--) {
                const s = c.path[n - 1 - i];
                const amp = 5 + i * 1.4;
                const w = Math.sin(i * 0.55 - c.now / 55) * amp;
                const x = s.x - s.uy * w;
                const y = s.y + s.ux * w;
                const r = 14 - i * 0.55;
                c.top.fillStyle(0x4a1fb0, 0.85).fillCircle(x, y, r);
                c.top.fillStyle(0x8a5cff, 0.9).fillCircle(x, y - r * 0.2, r * 0.72);
                c.top.fillStyle(0xd4c4ff, 0.8).fillCircle(x, y - r * 0.35, r * 0.32);
                if (i % 3 === 0) c.top.fillStyle(0xffd447, 0.95).fillCircle(x, y - r * 0.8, 2.6);
            }
            const hx = c.ball.x - c.dir.x * 15;
            const hy = c.ball.y - c.dir.y * 15;
            const p = perp(c.dir);
            c.top
                .fillStyle(0x8a5cff, 0.95)
                .fillTriangle(
                    hx + c.dir.x * 16,
                    hy + c.dir.y * 16,
                    hx + p.x * 12,
                    hy + p.y * 12,
                    hx - p.x * 12,
                    hy - p.y * 12,
                );
            c.top.lineStyle(3, 0xffd447, 1);
            for (const side of [-1, 1])
                c.top.lineBetween(
                    hx + p.x * 8 * side,
                    hy + p.y * 8 * side - 3,
                    hx - c.dir.x * 16 + p.x * 16 * side,
                    hy - c.dir.y * 16 + p.y * 16 * side - 12,
                );
            c.top.fillStyle(0xffffff, 1).fillCircle(hx + p.x * 5, hy + p.y * 5 - 5, 2.6);
        },
        hit: (c, x, y) => c.fx.burst('Dragon', x, y, 36, c.depth + 1),
        landMs: 850,
        after: (c, a, x, y) => {
            // a serpente se enrolando no gol
            const k = 1 - a / 850;
            for (let s = 0; s < 26; s++) {
                const ang = s * 0.5 + a / 110;
                const r = (14 + s * 4) * (0.6 + 0.4 * Math.min(1, a / 200));
                c.top.fillStyle(s % 3 ? 0x6f35fc : 0xffd447, 0.7 * k);
                c.top.fillCircle(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.55, 11 * (1 - s / 28));
            }
        },
    },
    Fairy: {
        life: 900,
        floor: (c, s, k, i) => {
            c.floor.fillStyle(i % 2 ? 0xd685ad : 0xffffff, 0.9 * k).fillRect(s.gx + (s.r - 0.5) * 20, s.gy, 4, 4);
        },
        tick: (c) => {
            // o brilho piscando e os corações subindo do caminho
            const p = perp(c.dir);
            if (every(c, 'twinkle', 45)) {
                const o = rnd(-32, 32);
                spawn(c, { kind: 'twinkle', x: c.ball.x + p.x * o, y: c.ball.y + p.y * o * 0.7, life: 600 });
            }
            if (every(c, 'heart', 130)) spawn(c, { kind: 'heart', x: c.ball.x, y: c.ball.y, life: 800 });
        },
        mark: (c, m, k, a) => {
            if (m.kind === 'twinkle') {
                c.top.fillStyle(m.r > 0.5 ? 0xffffff : 0xffd1ea, 1);
                star(c.top, m.x, m.y, 1.6, 11 * Math.sin(Math.PI * (1 - k)) + 0.5, 4, 0);
            } else if (m.kind === 'heart') {
                c.top.fillStyle(0xd685ad, 0.95 * k);
                heart(c.top, m.x + Math.sin(a / 120 + m.r * 6) * 7, m.y - a * 0.045, 8);
            }
        },
        hit: (c, x, y) => c.fx.burst('Fairy', x, y, 36, c.depth + 1),
        landMs: 800,
        after: (c, a, x, y) => {
            const k = 1 - a / 800;
            for (let j = 0; j < 8; j++) {
                const ang = (j / 8) * Math.PI * 2;
                const r = a * 0.14;
                c.top.fillStyle(j % 2 ? 0xd685ad : 0xffd1ea, k);
                heart(c.top, x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.65, 9);
            }
            c.top.fillStyle(0xffffff, k);
            star(c.top, x, y, 6, 18 + a * 0.08, 4, a / 400);
        },
    },
};

/** Direção da bola agora (pras marcas que olham pra ela). */
const u = (c: Ctx) => ({ ux: c.dir.x, uy: c.dir.y });

/** Psíquico: cópias da bola atrás dela no caminho (o eco), em imagens reaproveitadas. */
function echoes(c: Ctx, n: number, tint: number) {
    const sc = c.scene;
    for (let j = 0; j < n; j++) {
        c.images[j] ??= sc.add.image(0, 0, 'ball').setDepth(c.depth - 0.5);
        const s = c.path[c.path.length - 1 - (j + 1) * 3];
        const img = c.images[j];
        img.setVisible(!!s && !c.land);
        if (s)
            img.setPosition(s.x, s.y)
                .setTint(tint)
                .setAlpha(0.85 - j * 0.12)
                .setScale(2.3 - j * 0.16);
    }
}

/** Inseto: duas iscas (bolas falsas) se abrindo do caminho, a isca do goleiro. */
function decoys(c: Ctx) {
    const sc = c.scene;
    const p = perp(c.dir);
    const k = Math.min(1, c.age / 700);
    for (let j = 0; j < 2; j++) {
        c.images[j] ??= sc.add.image(0, 0, 'ball').setDepth(c.depth - 0.5);
        const side = j ? 1 : -1;
        const off = 8 + 40 * k;
        c.images[j]
            .setVisible(!c.land)
            .setPosition(
                c.ball.x + p.x * off * side - c.dir.x * 14 * k,
                c.ball.y + p.y * off * side * 0.7 - c.dir.y * 14 * k,
            )
            .setTint(0xc8d86a)
            .setAlpha(0.7)
            .setScale(1.3);
    }
}

// ------------------------------------------------------------------ as 12 assinaturas
interface Sig {
    /** Na cena (a carga, antes do chute), em volta do capitão em `at`, por `ms`. */
    charge?(c: Ctx, a: number, at: P, ms: number): void;
    /** A cada quadro do voo. */
    air?(c: Ctx): void;
    hit?(c: Ctx, x: number, y: number): void;
    after?(c: Ctx, a: number, x: number, y: number): void;
    landMs?: number;
    /** No chute, no pé (`c.from`). */
    launch?(c: Ctx): void;
    /** Tremida a mais no chute (px da tela). */
    kickShake?: number;
}

/** Os 16 tipos na ordem da roleta do Metronome. */
const WHEEL = [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Fairy',
];

/** Feixe reto do pé até a bola (Hyper Beam, Hydro Pump), tremendo na largura. */
function beam(c: Ctx, w: number, color: number, off = 0) {
    const p = perp(c.dir);
    const fl = c.reduce ? 1 : 1 + 0.15 * Math.sin(c.now / 25);
    const x0 = c.from.x + p.x * off;
    const y0 = c.from.y - 14 + p.y * off;
    const x1 = c.ball.x + p.x * off;
    const y1 = c.ball.y + p.y * off;
    c.top.lineStyle(w * 2.2 * fl, color, 0.25).lineBetween(x0, y0, x1, y1);
    c.top.lineStyle(w * fl, color, 0.75).lineBetween(x0, y0, x1, y1);
    c.top.lineStyle(w * 0.35, 0xffffff, 1).lineBetween(x0, y0, x1, y1);
}

const SIGS: Record<string, Sig> = {
    hyperbeam: {
        // o feixe do Hyper Beam do pé do Dragonite até a bola, o voo inteiro
        air: (c) => beam(c, 26, 0xffb347),
        landMs: 380,
        after: (c, a, x, y) => {
            const k = 1 - a / 380;
            c.top.lineStyle(64 * k, 0xffb347, 0.35 * k).lineBetween(c.from.x, c.from.y - 14, x, y);
            c.top.lineStyle(30 * k, 0xffffff, 0.85 * k).lineBetween(c.from.x, c.from.y - 14, x, y);
        },
    },
    bodyslam: {
        // o peso do Snorlax: ele se joga (a cratera e a poeira no pé, tremida a mais) e a sombra esmaga o gol
        kickShake: 10,
        launch: (c) => {
            shockwave(c.scene, c.from.x, c.from.y, c.color, 2.6, c.depth - 1, c.reduce);
            crack(c.scene, c.from.x, c.from.y + 2, 0x5a4e3c, 3, 3, c.reduce).fade(1600);
            c.fx.burst('Dust', c.from.x, c.from.y + 4, 26, c.depth - 2);
        },
        hit: (c, x, y) => {
            shockwave(c.scene, x, y, c.color, 2.6, c.depth - 1, c.reduce);
            c.fx.burst('Dust', x, y + 10, 22, c.depth - 2);
        },
        landMs: 320,
        after: (c, a, x, y) => {
            const k = 1 - a / 320;
            c.ink.fillStyle(0x000000, 0.35 * k).fillEllipse(x, y + 10, 50 + a * 0.5, 18 + a * 0.15);
        },
    },
    fireblast: {
        landMs: 1000,
        after: (c, a, x, y) => {
            // a estrela de fogo do Fire Blast: cinco braços saindo do meio
            const k = a < 650 ? 1 : 1 - (a - 650) / 350;
            const g = Math.min(1, a / 170);
            const arms = [
                [0, -1],
                [-1, -0.15],
                [1, -0.15],
                [-0.65, 0.95],
                [0.65, 0.95],
            ];
            for (const [ax, ay] of arms)
                for (let s = 1; s <= 7; s++) {
                    const f = (s / 7) * g;
                    const px = x + ax * 80 * f;
                    const py = y + ay * 52 * f;
                    const h = (28 - s * 2.4) * k * (0.85 + 0.15 * Math.sin(a / 35 + s));
                    c.top.fillStyle(0xff5a1f, 0.8 * k).fillCircle(px, py, h * 0.55);
                    c.top.fillStyle(0xffd23f, 0.9 * k).fillCircle(px, py, h * 0.28);
                }
        },
    },
    blizzard: {
        // a nevasca varrendo a tela no voo e a área do gol congelando
        air: (c) => {
            const v = c.scene.cameras.main.worldView;
            for (let i = 0; i < 40; i++) {
                const sx = (i * 0.618) % 1;
                const sy = (i * 0.377 + 0.13) % 1;
                const x = v.x + ((sx + (c.age / 1000) * (0.6 + sy)) % 1) * v.width;
                const y = v.y + ((sy + (c.age / 1000) * 0.15) % 1) * v.height;
                c.top
                    .lineStyle(i % 3 ? 2.5 : 4, 0xffffff, 0.6)
                    .lineBetween(x, y, x - c.dir.x * 26, y - c.dir.y * 26 - 5);
            }
        },
        landMs: 1300,
        after: (c, a, x, y) => {
            const k = a < 900 ? 1 : 1 - (a - 900) / 400;
            const g = Math.min(1, a / 250);
            c.floor.fillStyle(0xe8fbff, 0.32 * k).fillEllipse(x, y + 6, 260 * g, 120 * g);
        },
    },
    hydropump: {
        // os dois canhões d'água do Blastoise
        air: (c) => {
            beam(c, 10, 0x6390f0, -12);
            beam(c, 10, 0x6390f0, 12);
        },
        hit: (c, x, y) => c.fx.burst('Water', x, y, 34, c.depth + 1),
    },
    flamethrower: {
        // o lança-chamas do Charizard empurrando a bola
        air: (c) => {
            const dx = c.ball.x - c.from.x;
            const dy = c.ball.y - (c.from.y - 14);
            const p = perp(c.dir);
            for (let s = 2; s <= 12; s++) {
                const f = s / 12;
                const x = c.from.x + dx * f;
                const y = c.from.y - 14 + dy * f;
                const w = (5 + f * 20) * (c.reduce ? 1 : 0.8 + 0.3 * Math.sin(c.now / 30 + s * 1.7));
                c.top
                    .fillStyle(s % 2 ? 0xff5a1f : 0xffd23f, 0.55)
                    .fillTriangle(x + p.x * w, y + p.y * w, x - p.x * w, y - p.y * w, x + dx * 0.09, y + dy * 0.09);
            }
        },
    },
    thunderbolt: {
        hit: (c, x, y) => {
            // o raio em cadeia: do gol pros dois rivais mais perto
            const near = c
                .rivals()
                .map((p) => ({ p, d: Math.hypot(p.x - x, p.y - y) }))
                .filter((o) => o.d > 20)
                .sort((a, b) => a.d - b.d)
                .slice(0, 2);
            let from = { x, y };
            near.forEach(({ p }, j) => {
                spawn(c, {
                    kind: 'strike',
                    x: p.x,
                    y: p.y,
                    t: c.now + 120 + j * 130,
                    life: 360,
                    pts: zig(from.x, from.y, p.x, p.y - 18, 9, 16),
                });
                spawn(c, { kind: 'scorch', x: p.x, y: p.y, t: c.now + 120 + j * 130, life: 600 });
                from = { x: p.x, y: p.y - 18 };
            });
        },
    },
    dreameater: {
        landMs: 1000,
        after: (c, a, x, y) => {
            // o sonho comido: olhos e o sorriso enorme em cima do gol, e os Z subindo
            const k = a < 700 ? 1 : 1 - (a - 700) / 300;
            const g = Math.min(1, a / 160);
            const cy = y - 60;
            c.top.fillStyle(0x735797, 0.55 * k).fillEllipse(x, cy, 190 * g, 100 * g);
            c.top.fillStyle(0xff4a6a, 0.95 * k);
            c.top.fillEllipse(x - 32 * g, cy - 14, 26 * g, 16 * g).fillEllipse(x + 32 * g, cy - 14, 26 * g, 16 * g);
            const pts: Phaser.Math.Vector2[] = [];
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                pts.push(
                    new Phaser.Math.Vector2(
                        x + (t - 0.5) * 110 * g,
                        cy + 14 + Math.sin(t * Math.PI) * 16 * g + (i % 2 ? -7 : 3) * g,
                    ),
                );
            }
            c.top.lineStyle(4, 0xffffff, k).strokePoints(pts, false, true);
            for (let j = 0; j < 3; j++) {
                const zy = y - 30 - ((a / 10 + j * 26) % 80);
                const zx = x + 56 + j * 10;
                const s = 7 + j * 2;
                c.top.lineStyle(3, 0xb69ae0, k);
                polyline(c.top, [zx - s, zy - s, zx + s, zy - s, zx - s, zy + s, zx + s, zy + s]);
            }
        },
    },
    psychic: {
        // a telecinese do Mewtwo: os rivais presos no anel rosa e o eco em dobro
        air: (c) => {
            echoes(c, 6, 0xf95587);
            for (const p of c.rivals()) {
                const r = 24 + Math.sin(c.now / 70 + p.x) * 3;
                c.top.lineStyle(3.5, 0xf95587, 0.85).strokeEllipse(p.x, p.y, r * 2, r * 0.8);
                c.top.lineStyle(2, 0xffffff, 0.65).strokeEllipse(p.x, p.y - 3, r * 1.5, r * 0.6);
            }
        },
    },
    tsunami: {
        air: (c) => {
            // a onda gigante varrendo a quadra do pé até depois do gol
            const span = c.goal.x - c.from.x;
            const f = Math.min(1, c.age / 1400);
            const fx = c.from.x + span * f;
            const back = Math.sign(span) * 140;
            const v = c.scene.cameras.main.worldView;
            const pts: Phaser.Math.Vector2[] = [];
            for (let i = 0; i <= 16; i++) {
                const y = v.y + (i / 16) * v.height;
                pts.push(new Phaser.Math.Vector2(fx + Math.sin(i * 0.9 + c.age / 90) * 14, y));
            }
            const band = [...pts, ...pts.map((p) => new Phaser.Math.Vector2(p.x - back, p.y)).reverse()];
            c.top.fillStyle(0x6390f0, 0.3 * (1 - f * 0.6)).fillPoints(band, true);
            c.top.lineStyle(7, 0xffffff, 0.8 * (1 - f * 0.6)).strokePoints(pts, false, true);
        },
    },
    metronome: {
        charge: (c, a, at, ms) => {
            // a roleta dos tipos em volta do Mew, girando e parando no sorteado na hora do chute
            const n = WHEEL.length;
            const end = Math.max(0, WHEEL.indexOf(c.type));
            const t = Math.min(1, a / ms);
            const pos = (end + n * 3) * (1 - (1 - t) ** 3);
            const lit = c.reduce ? end : Math.round(pos) % n;
            for (let i = 0; i < n; i++) {
                const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
                const x = at.x + Math.cos(ang) * 54;
                const y = at.y - 18 + Math.sin(ang) * 36;
                const on = i === lit;
                c.ink.fillStyle(0x0d1024, 0.8).fillCircle(x, y, on ? 11 : 7.5);
                c.top.fillStyle(colorOf(WHEEL[i]), on ? 1 : 0.85).fillCircle(x, y, on ? 9 : 6);
                if (on) c.top.lineStyle(3, 0xffffff, 1).strokeCircle(x, y, 13);
            }
            // o dedo balançando: o ponteiro do metrônomo em cima da cabeça
            const sw = c.reduce ? 0 : Math.sin(a / 90) * 0.7 * (1 - t);
            c.top
                .lineStyle(4, 0xffffff, 0.9)
                .lineBetween(at.x, at.y - 34, at.x + Math.sin(sw) * 40, at.y - 34 - Math.cos(sw) * 40);
        },
    },
    transform: {
        charge: (c, a, at) => {
            // o espelho: fatias da cor copiada correndo pelo Ditto e a linha branca varrendo
            for (let j = 0; j < 7; j++) {
                const y = at.y - 60 + j * 10;
                const dx = c.reduce ? 0 : Math.sin(a / 60 + j * 1.3) * 22;
                c.top.fillStyle(j % 2 ? c.color : 0xffffff, 0.45).fillRect(at.x - 44 + dx, y, 88, 5);
            }
            if (c.reduce) return;
            const sx = at.x - 48 + ((a / 3) % 96);
            c.top.fillStyle(0xffffff, 0.85).fillRect(sx, at.y - 70, 4, 76);
        },
    },
};

/**
 * O N3 do tipo: nasce na cena (`charge`, a carga), solta no chute (`launch`), anda com a bola (`step` a cada quadro) e
 * explode na chegada (`land`). `step` devolve false quando acabou (o último rastro sumiu).
 */
export class N3Story {
    private readonly c: Ctx;
    private readonly look: Look;
    private readonly sig: Sig | null;
    private t0 = 0;
    private flying = false;
    private chargeAt: { at: P; t0: number; ms: number } | null = null;
    private dead = false;

    constructor(o: {
        scene: Phaser.Scene;
        fx: TypeFx;
        type: string;
        sig: string | null;
        depth: number;
        reduce: boolean;
        goal: P;
        rivals: () => P[];
    }) {
        const look = TYPES[o.type] ?? TYPES.Normal;
        this.look = look;
        this.sig = (o.sig && SIGS[o.sig]) || null;
        const color = colorOf(o.type);
        const floor = o.scene.add.graphics().setDepth(2);
        this.c = {
            scene: o.scene,
            fx: o.fx,
            type: o.type,
            color,
            light: Phaser.Display.Color.IntegerToColor(color).lighten(25).color,
            reduce: o.reduce,
            now: o.scene.time.now,
            age: 0,
            ball: { x: 0, y: 0 },
            dir: { x: 1, y: 0 },
            path: [],
            marks: [],
            floor,
            top: o.scene.add.graphics().setDepth(o.depth),
            ink: o.scene.add.graphics().setDepth(o.depth - 0.25),
            from: { x: 0, y: 0 },
            goal: o.goal,
            land: null,
            depth: o.depth,
            images: [],
            rivals: o.rivals,
            last: {},
        };
    }

    /** Tremida a mais no chute (a assinatura pesada do Snorlax). */
    get kickShake() {
        return this.sig?.kickShake ?? 0;
    }

    /** A cena da carga: a assinatura que acontece no capitão (roleta do Mew, espelho do Ditto), em `at` por `ms`. */
    charge(at: P, ms: number) {
        if (this.sig?.charge) this.chargeAt = { at, t0: this.c.scene.time.now, ms };
    }

    /** O chute: daqui o voo conta. `from` = o pé. */
    launch(from: P) {
        this.chargeAt = null;
        this.c.from = { ...from };
        this.t0 = this.c.scene.time.now;
        this.flying = true;
        this.sig?.launch?.(this.c);
    }

    /** A chegada (gol, defesa, trave, bloqueio). */
    land(x: number, y: number, goal: boolean) {
        const c = this.c;
        if (c.land || this.dead) return;
        c.now = c.scene.time.now;
        c.land = { x, y, t: c.now, goal };
        this.flying = false;
        this.look.hit?.(c, x, y);
        this.sig?.hit?.(c, x, y);
        for (const img of c.images) img.setVisible(false);
    }

    /** A bola agora (Fantasma: some e volta). */
    ballAlpha(): number {
        return this.flying ? (this.look.ballAlpha?.(this.c) ?? 1) : 1;
    }

    /**
     * Um quadro: `ball` (no ar) e `ground` (a sombra dela) enquanto voa. Redesenha o rastro do chão, o que anda com a bola,
     * as marcas e a chegada. False = acabou (quem chama solta).
     */
    step(ball: P, ground: P): boolean {
        if (this.dead) return false;
        const c = this.c;
        c.now = c.scene.time.now;
        c.floor.clear();
        c.top.clear();
        c.ink.clear();
        if (this.chargeAt) {
            const ch = this.chargeAt;
            this.sig?.charge?.(c, c.now - ch.t0, ch.at, ch.ms);
            return true;
        }
        if (!this.flying && !c.land) return true;
        c.age = c.now - this.t0;
        if (this.flying) {
            const last = c.path.at(-1);
            const dx = ball.x - (last?.x ?? c.from.x);
            const dy = ball.y - (last?.y ?? c.from.y);
            const d = Math.hypot(dx, dy);
            if (d > 0.5) {
                c.dir.x += (dx / d - c.dir.x) * 0.4;
                c.dir.y += (dy / d - c.dir.y) * 0.4;
                const n = Math.hypot(c.dir.x, c.dir.y) || 1;
                c.dir.x /= n;
                c.dir.y /= n;
            }
            c.ball.x = ball.x;
            c.ball.y = ball.y;
            if (!last || d >= 5)
                c.path.push({
                    x: ball.x,
                    y: ball.y,
                    gx: ground.x,
                    gy: ground.y,
                    ux: c.dir.x,
                    uy: c.dir.y,
                    t: c.now,
                    r: Math.random(),
                });
            if (c.path.length > 80) c.path.shift();
            if (!c.reduce) this.look.tick?.(c);
        }
        // o rastro do chão (parado sumindo, também no "Reduzir movimento")
        const life = this.look.life;
        let prev: Sample | null = null;
        c.path.forEach((s, i) => {
            const k = 1 - (c.now - s.t) / life;
            if (k > 0) this.look.floor?.(c, s, k, i, prev);
            prev = k > 0 ? s : null;
        });
        if (this.flying && !c.reduce) {
            this.look.air?.(c);
            this.sig?.air?.(c);
        }
        c.marks = c.marks.filter((m) => c.now - m.t < m.life);
        for (const m of c.marks) {
            const a = c.now - m.t;
            if (a >= 0 && !c.reduce) this.look.mark?.(c, m, 1 - a / m.life, a);
        }
        const L = c.land;
        let busy = c.marks.length > 0 || c.path.some((s) => c.now - s.t < life);
        if (L) {
            const a = c.now - L.t;
            const lm = Math.max(this.look.landMs ?? 0, this.sig?.landMs ?? 0);
            if (a < lm && !c.reduce) {
                if (a < (this.look.landMs ?? 0)) this.look.after?.(c, a, L.x, L.y);
                if (a < (this.sig?.landMs ?? 0)) this.sig?.after?.(c, a, L.x, L.y);
                busy = true;
            }
        }
        if (!busy && L) this.stop();
        return !this.dead;
    }

    /** Some com tudo agora (pulou o lance, trocou de trecho do replay). */
    stop() {
        if (this.dead) return;
        this.dead = true;
        const c = this.c;
        c.floor.destroy();
        c.top.destroy();
        c.ink.destroy();
        for (const img of c.images) img.destroy();
        c.images.length = 0;
    }
}

/** Os efeitos de tipo que a história conhece (o teste confere os 16 e as 12 assinaturas). */
export const N3_LOOKS = Object.keys(TYPES);
export const N3_SIGS = Object.keys(SIGS);
