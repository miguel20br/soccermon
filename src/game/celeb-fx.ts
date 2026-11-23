import type Phaser from 'phaser';
import {
    BONE,
    BOOM,
    CHARIZARD,
    type Comemoracao,
    type ComemoracaoEspecie,
    JIGGLY,
    PAYDAY,
    SLOWPOKE,
    SPOON,
    SQUAD,
} from './walkout-plan';

/**
 * O enfeite das comemorações próprias da 0.9.54 (docs/planos/pesquisas/sinergias-e-animacoes.md, item 9): notas e
 * rabisco da Jigglypuff, "..." do Slowpoke, moedas do Meowth, fogo do Charizard, óculos do Squirtle, Bonemerang do
 * Cubone, explosão do Voltorb e colher do Kadabra. Tudo sai do tempo do gol (`ms`): replay e salto mostram igual, sem
 * sorteio. Partículas com teto (8 moedas, 8 brasas, 7 nuvens) e "Reduzir movimento": parado, sem piscar nem rastro.
 */

type Pt = { x: number; y: number };

export interface CelebDraw {
    /** As 5 da 0.9.53.1 e os jeitos da forma a cena desenha; aqui só as novas (o resto passa reto). */
    kind: Comemoracao | ComemoracaoEspecie;
    ms: number;
    /** Alto da cabeça (girando com o corpo) e o pé (px do mundo). */
    head: Pt;
    foot: Pt;
    /** Altura do pé ao alto da cabeça (px, já na escala do sprite). */
    hh: number;
    /** Profundidade do sprite (o osso passa por trás e pela frente dele). */
    depth: number;
    /** Escala da interface (até 2). */
    s: number;
    reduce: boolean;
    /** 1 → 0 nos últimos 200 ms da comemoração. */
    fade: number;
    /** Alto da tela (px do mundo): o fogo do Charizard vai até lá. */
    top: number;
    g: Phaser.GameObjects.Graphics;
    /** Texto reaproveitado da cena (n = qual). */
    mark: (n: number, text: string, size: number, color?: string) => Phaser.GameObjects.Text;
    /** Imagem reaproveitada (n = qual) com a textura `key`. */
    img: (n: number, key: string) => Phaser.GameObjects.Image;
    /** As cabeças dos rivais perto (no máximo 2, a mais perto primeiro): a Jigglypuff rabisca. */
    rivals: () => { head: Pt; hh: number }[];
}

const INK = 0x1a1020;
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));
const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
const backOut = (u: number) => {
    const c = 1.70158;
    const x = clamp01(u) - 1;
    return 1 + (c + 1) * x ** 3 + c * x ** 2;
};
const bump = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));

/**
 * Moeda n do Pay Day (8 ao todo), relativa à cabeça: sai em leque, cai até `floor` (px abaixo da cabeça), quica uma
 * vez e para. null antes de sair. `rest` = já no chão.
 */
export const COINS = 8;
export function coinAt(n: number, ms: number, s: number, floor: number): (Pt & { rest: boolean }) | null {
    const t0 = PAYDAY.toss + n * 45;
    if (ms < t0) return null;
    const vx = (n % 2 ? 1 : -1) * (34 + 20 * (n >> 1)) * s; // px/s
    const vy = (200 - 16 * (n >> 1)) * s;
    const grav = 640 * s;
    let u = (ms - t0) / 1000;
    const land = (vy + Math.sqrt(vy * vy + 2 * grav * floor)) / grav;
    if (u < land) return { x: vx * u, y: -vy * u + 0.5 * grav * u * u, rest: false };
    // quica uma vez (30% da velocidade da queda) e para
    u -= land;
    const v2 = 0.3 * (grav * land - vy);
    const air = (2 * v2) / grav;
    return {
        x: vx * land + vx * 0.4 * Math.min(u, air),
        y: floor - (u < air ? v2 * u - 0.5 * grav * u * u : 0),
        rest: u >= air,
    };
}

/** Desenha uma moeda (ellipse que gira no eixo vertical). */
function coin(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, spin: number, alpha: number) {
    const w = Math.max(0.25, Math.abs(Math.cos(spin)));
    g.fillStyle(INK, 0.8 * alpha).fillEllipse(x, y, 2 * r * w + 2.4, 2 * r + 2.4);
    g.fillStyle(0xd99a16, alpha).fillEllipse(x, y, 2 * r * w, 2 * r);
    g.fillStyle(0xffd84a, alpha).fillEllipse(x, y, 2 * r * w * 0.68, 2 * r * 0.68);
    if (w > 0.55) g.fillStyle(0xfff6c8, alpha).fillRect(x - 0.6 * r * w, y - 0.5 * r, 0.35 * r * w, 0.35 * r);
}

/** Nota musical desenhada (uma ou duas colcheias), com contorno escuro. */
function note(g: Phaser.GameObjects.Graphics, x: number, y: number, k: number, two: boolean, color: number, a: number) {
    for (const [w, c, al] of [
        [2.2, INK, 0.75 * a],
        [0, color, a],
    ] as const) {
        const e = w * 0.5;
        g.fillStyle(c, al).fillEllipse(x - 3 * k, y + 6 * k, 7 * k + w, 5 * k + w);
        g.lineStyle(2 * k + w, c, al).lineBetween(x + 0.4 * k, y + 6 * k, x + 0.4 * k, y - 8 * k - e);
        if (two) {
            g.fillEllipse(x + 7 * k, y + 3 * k, 7 * k + w, 5 * k + w);
            g.lineBetween(x + 10.4 * k, y + 3 * k, x + 10.4 * k, y - 11 * k - e);
            g.lineStyle(3 * k + w, c, al).lineBetween(x + 0.4 * k, y - 8 * k, x + 10.4 * k, y - 11 * k);
        } else g.lineBetween(x + 0.4 * k, y - 8 * k, x + 5 * k, y - 3 * k);
    }
}

/** O rabisco de caneta no rosto (bigode de guidão e um óculos num olho), na unidade do rosto (0 = centro). */
export const SCRIBBLE: Pt[] = (() => {
    const pts: Pt[] = [];
    // bigode: da ponta esquerda (enrolada pra cima) à direita
    for (let i = 0; i <= 24; i++) {
        const a = i / 24;
        const x = (a * 2 - 1) * 0.95;
        pts.push({ x, y: 0.32 - 0.34 * Math.abs(2 * a - 1) ** 3 + 0.05 * Math.sin(a * Math.PI * 4) });
    }
    // sobe pro olho e dá uma volta e meia em volta dele
    for (let i = 0; i <= 22; i++) {
        const a = (i / 22) * Math.PI * 3;
        const r = 0.26 + 0.02 * Math.sin(a * 2);
        pts.push({ x: 0.38 + r * Math.cos(a + Math.PI / 2), y: -0.32 + r * Math.sin(a + Math.PI / 2) });
    }
    return pts;
})();

/** Quanto do rabisco do rival n já foi desenhado (0..1). */
export const scribbleDone = (ms: number, n: number) => clamp01((ms - JIGGLY.puff - 120 - n * 260) / 420);

/** Ponto do Bonemerang (relativo à mão): sai pra direita, passa por trás, volta pela esquerda e pela frente. */
export function bonemerang(ms: number, s: number): (Pt & { front: boolean }) | null {
    if (ms < BONE.toss || ms >= BONE.back) return null;
    const u = (ms - BONE.toss) / (BONE.back - BONE.toss);
    // sai rápido, desacelera longe e volta acelerando (seno)
    const th = Math.PI / 2 - 2 * Math.PI * ((1 - Math.cos(Math.PI * u)) / 2);
    const rx = 58 * s;
    const ry = 24 * s;
    return { x: rx * Math.cos(th), y: ry * Math.sin(th) - ry, front: Math.sin(th) > 0 };
}

export function drawCeleb(c: CelebDraw) {
    const { g, ms, head, foot, hh, s, reduce, fade } = c;
    switch (c.kind) {
        case 'jigglypuff': {
            // as notas da Canção de Ninar saem da boca em fila, ondulando
            for (let n = 0; n < 6; n++) {
                const t0 = 120 + n * 170;
                const u = reduce ? (ms < JIGGLY.sing ? 0.4 + 0.1 * n : 2) : (ms - t0) / 1000;
                if (u <= 0 || u >= 1) continue;
                const side = n % 2 ? 1 : -1;
                const x = head.x + side * (8 + 12 * u) * s + (reduce ? 0 : Math.sin(u * 7 + n) * 3 * s);
                const y = head.y + (2 - 34 * u) * s;
                const a = Math.min(1, bump(u) * 1.8) * fade;
                note(g, x, y, (0.7 + 0.35 * backOut(u * 4)) * s, n % 3 === 1, n % 2 ? 0xffc2e2 : 0xffffff, a);
            }
            // brava: a veia de raiva pulsando na cabeça
            if (ms > JIGGLY.sing) {
                const k = reduce ? 1 : backOut((ms - JIGGLY.sing) / 220);
                const pulse = reduce ? 1 : 1 + 0.08 * Math.sin(ms / 60);
                c.img(0, 'fx-angry')
                    .setPosition(head.x + hh * 0.32, head.y + hh * 0.06)
                    .setScale(0.5 * s * k * pulse)
                    .setDepth(c.depth + 2)
                    .setAlpha(fade);
            }
            // o rabisco de caneta no rosto de quem estava perto (fica até o fim)
            if (ms > JIGGLY.puff)
                c.rivals().forEach((r, n) => {
                    const done = reduce ? 1 : scribbleDone(ms, n);
                    if (done <= 0) return;
                    const w = Math.max(7 * s, Math.min(16 * s, r.hh * 0.32));
                    const cx = r.head.x;
                    const cy = r.head.y + r.hh * 0.34;
                    const last = Math.max(1, Math.round(done * (SCRIBBLE.length - 1)));
                    const pts = SCRIBBLE.slice(0, last + 1).map((p) => ({ x: cx + p.x * w, y: cy + p.y * w }));
                    for (const [lw, col, a] of [
                        [3.2, 0xffffff, 0.5],
                        [1.7, INK, 0.95],
                    ] as const) {
                        g.lineStyle(lw * s, col, a * fade).beginPath();
                        g.moveTo(pts[0].x, pts[0].y);
                        for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
                        g.strokePath();
                    }
                    // a ponta da caneta enquanto desenha
                    if (done < 1) {
                        const tip = pts[pts.length - 1];
                        g.fillStyle(INK, fade).fillCircle(tip.x, tip.y, 1.6 * s);
                        g.lineStyle(3 * s, 0xff6fae, fade).lineBetween(tip.x, tip.y, tip.x + 7 * s, tip.y - 9 * s);
                    }
                });
            break;
        }
        case 'slowpoke': {
            const S = SLOWPOKE;
            if (ms < S.notice) {
                const dots = S.dots.filter((d) => ms >= d).length;
                if (dots)
                    c.mark(0, '.'.repeat(dots), 16)
                        .setPosition(head.x + 4 * s, head.y - 2 * s)
                        .setAlpha(fade);
            } else if (ms < S.jump + 520) {
                const k = reduce ? 1 : backOut((ms - S.notice) / 200);
                c.mark(0, '!', 26, '#ffe14d')
                    .setPosition(head.x, head.y - 2 * s)
                    .setScale(k)
                    .setAlpha(fade * Math.min(1, (S.jump + 520 - ms) / 160));
            }
            break;
        }
        case 'meowth': {
            for (let n = 0; n < COINS; n++) {
                // o chão de cada moeda: perto do pé, espalhado na profundidade
                const floor = foot.y - head.y + ((n % 3) * 5 - 3) * s;
                const p = coinAt(n, reduce ? 9000 : ms, s, floor);
                const t0 = PAYDAY.toss + n * 45;
                if (!p || ms < t0) continue;
                const spin = reduce || p.rest ? 0.3 : (ms - t0) / 45 + n;
                const a = fade * (reduce ? clamp01((ms - t0) / 200) : 1);
                const x = head.x + p.x;
                const y = head.y + p.y;
                coin(g, x, y, 3.6 * s, spin, a);
                // brilho de vez em quando nas que já pararam
                const tw = (ms + n * 137) % 600;
                if (!reduce && p.rest && tw < 120) {
                    const k = bump(tw / 120) * 3 * s;
                    g.lineStyle(1.4 * s, 0xffffff, a)
                        .lineBetween(x - k, y - 4 * s, x + k, y - 4 * s)
                        .lineBetween(x, y - 4 * s - k, x, y - 4 * s + k);
                }
            }
            break;
        }
        case 'charizard': {
            const C = CHARIZARD;
            if (ms < C.from || ms > C.to + 260) break;
            const top = c.top - 10;
            const base = head.y + hh * 0.12;
            const reach = easeOut((ms - C.from) / 260);
            // no fim a base solta e sobe atrás da ponta
            const cut = ms > C.to ? easeOut((ms - C.to) / 260) : 0;
            const tipY = base + (top - base) * reach;
            const baseY = base + (top - base) * cut;
            const N = 14;
            const edge = (n: number, side: number, scale: number) => {
                const v = n / N;
                const y = baseY + (tipY - baseY) * v;
                const w = (4 + 12 * Math.sqrt(v)) * s * scale * (1 - 0.6 * v ** 6);
                const wig = reduce ? 0 : Math.sin(ms / 38 + n * 1.3 + side) * 2.2 * s * (0.4 + v);
                return { x: head.x + side * w + wig, y };
            };
            for (const [scale, col, a] of [
                [1.35, 0xc8281a, 0.55],
                [1, 0xff6a1a, 0.95],
                [0.62, 0xffb21f, 1],
                [0.28, 0xfff3b8, 1],
            ] as const) {
                const pts = [
                    ...Array.from({ length: N + 1 }, (_, n) => edge(n, -1, scale)),
                    ...Array.from({ length: N + 1 }, (_, n) => edge(N - n, 1, scale)),
                ];
                g.fillStyle(col, a).fillPoints(pts as Phaser.Math.Vector2[], true);
            }
            // brasas subindo pelos lados
            if (!reduce)
                for (let n = 0; n < 8; n++) {
                    const u = ((ms - C.from) / 520 + n / 8) % 1;
                    const y = base + (top - base) * u * reach;
                    if (y < baseY - 1 && cut > 0) continue;
                    const x = head.x + (n % 2 ? 1 : -1) * (10 + 10 * u + 4 * Math.sin(n * 2.1 + u * 9)) * s;
                    g.fillStyle(n % 3 ? 0xffb21f : 0xfff3b8, 1 - u).fillCircle(x, y, (2.2 - u) * s);
                }
            break;
        }
        case 'squirtle': {
            const Q = SQUAD;
            if (ms < Q.drop) break;
            // descem de cima girando de leve e encaixam com um quique
            const u = clamp01((ms - Q.drop) / (Q.land - Q.drop));
            const drop = reduce ? 0 : (1 - bounceOut(u)) * 46 * s;
            const tilt = reduce ? 0 : (1 - u) * 0.5 * Math.sin(u * 9);
            const lw = Math.max(5 * s, hh * 0.2);
            const lh = lw * 0.7;
            const ex = head.x;
            const ey = head.y + hh * 0.36 - drop;
            const a = fade * (reduce ? clamp01(u * 3) : 1);
            const rot = (px: number, py: number) => ({
                x: ex + px * Math.cos(tilt) - py * Math.sin(tilt),
                y: ey + px * Math.sin(tilt) + py * Math.cos(tilt),
            });
            const lens = (cx: number) => {
                const pts = [
                    rot(cx - lw / 2, -lh / 2),
                    rot(cx + lw / 2, -lh / 2),
                    rot(cx + lw / 2 - lw * 0.12, lh / 2),
                    rot(cx - lw / 2 + lw * 0.12, lh / 2),
                ];
                return pts;
            };
            const gap = lw * 0.18;
            for (const cx of [-(lw / 2 + gap / 2), lw / 2 + gap / 2]) {
                const pts = lens(cx);
                g.lineStyle(2.4 * s, 0xffffff, 0.45 * a).strokePoints(pts as Phaser.Math.Vector2[], true);
                g.fillStyle(0x15151d, a).fillPoints(pts as Phaser.Math.Vector2[], true);
                // reflexo fixo no alto da lente
                const r0 = rot(cx - lw * 0.28, -lh * 0.22);
                const r1 = rot(cx - lw * 0.02, -lh * 0.22);
                g.lineStyle(1.3 * s, 0x6b7aa8, a).lineBetween(r0.x, r0.y, r1.x, r1.y);
            }
            const b0 = rot(-gap / 2, -lh * 0.3);
            const b1 = rot(gap / 2, -lh * 0.3);
            g.lineStyle(1.6 * s, 0x15151d, a).lineBetween(b0.x, b0.y, b1.x, b1.y);
            // o brilho passa pelas lentes e termina numa estrelinha
            if (!reduce && ms > Q.glint && ms < Q.glint + 420) {
                const v = (ms - Q.glint) / 300;
                if (v < 1) {
                    const p = rot(-lw - gap / 2 + (2 * lw + gap) * v, 0);
                    g.lineStyle(1.8 * s, 0xffffff, 0.9 * a).lineBetween(
                        p.x - 1.5 * s,
                        p.y + lh * 0.45,
                        p.x + 1.5 * s,
                        p.y - lh * 0.45,
                    );
                } else {
                    const k = bump((ms - Q.glint - 300) / 120) * 5 * s;
                    const p = rot(lw + gap / 2, -lh / 2);
                    g.lineStyle(1.6 * s, 0xffffff, a)
                        .lineBetween(p.x - k, p.y, p.x + k, p.y)
                        .lineBetween(p.x, p.y - k, p.x, p.y + k);
                }
            }
            break;
        }
        case 'cubone': {
            const hand = { x: foot.x + hh * 0.3, y: foot.y - hh * 0.45 };
            const scale = (Math.max(9 * s, hh * 0.38) / 29) * 1.1;
            // o rastro (3 ossos atrasados, sumindo) e o osso girando
            const trail = reduce ? [0] : [0, 45, 90, 135];
            trail.forEach((back, n) => {
                const p = bonemerang(ms - back, s);
                if (!p) return;
                c.img(n, 'fx-bone')
                    .setPosition(hand.x + p.x, hand.y + p.y)
                    .setScale(scale * (1 - 0.12 * n))
                    .setRotation(reduce ? 0.6 : (ms - back) / 45)
                    .setDepth(c.depth + (p.front ? 1 : -1))
                    .setAlpha(fade * [1, 0.38, 0.2, 0.08][n]);
            });
            // pegou: um estalo na mão
            if (!reduce && ms >= BONE.back && ms < BONE.back + 160) {
                const k = (ms - BONE.back) / 160;
                g.lineStyle(2 * s, 0xffffff, 1 - k);
                for (let n = 0; n < 5; n++) {
                    const a = (n / 5) * Math.PI * 2;
                    const r0 = (5 + 6 * k) * s;
                    const r1 = (9 + 9 * k) * s;
                    g.lineBetween(
                        hand.x + Math.cos(a) * r0,
                        hand.y + Math.sin(a) * r0,
                        hand.x + Math.cos(a) * r1,
                        hand.y + Math.sin(a) * r1,
                    );
                }
            }
            break;
        }
        case 'voltorb': {
            const V = BOOM;
            if (ms < V.boom) break;
            const t = ms - V.boom;
            const mid = { x: foot.x, y: foot.y - hh * 0.5 };
            // o estouro: clarão branco, anel e a estrela do impacto
            if (t < 320) {
                const k = t / 320;
                if (!reduce) {
                    g.fillStyle(0xffffff, 0.9 * (1 - k)).fillCircle(mid.x, mid.y, (10 + 26 * easeOut(k)) * s);
                    g.lineStyle(3 * s, 0xffe08a, 1 - k).strokeCircle(mid.x, mid.y, (12 + 40 * easeOut(k)) * s);
                }
                c.img(0, 'fx-impact')
                    .setPosition(mid.x, mid.y)
                    .setScale((reduce ? 0.4 : 0.2 + 0.35 * easeOut(k)) * s)
                    .setDepth(c.depth + 2)
                    .setAlpha(1 - k * k);
            }
            // a fumaça: 7 nuvens que crescem, sobem e somem
            for (let n = 0; n < 7; n++) {
                const u = reduce ? clamp01(t / 900) * 0.4 + 0.2 : clamp01((t - n * 25) / 950);
                if (u <= 0 || u >= 1) continue;
                const a = (n / 7) * Math.PI * 2 + 0.4;
                const d = (6 + 16 * easeOut(u)) * s;
                const x = mid.x + Math.cos(a) * d;
                const y = mid.y + Math.sin(a) * d * 0.6 - 14 * s * u;
                const r = (5 + 7 * easeOut(u)) * s;
                const al = 0.85 * (1 - u) * fade;
                g.fillStyle(0x4b4651, al).fillCircle(x + 1.2 * s, y + 1.2 * s, r);
                g.fillStyle(n % 2 ? 0x8d8894 : 0xa7a2ad, al).fillCircle(x, y, r);
            }
            // se sacode: a fuligem pula pros lados
            if (!reduce && ms > V.clean && ms < V.clean + 300) {
                const k = (ms - V.clean) / 300;
                for (let n = 0; n < 5; n++) {
                    const a = -Math.PI * (0.15 + 0.7 * (n / 4));
                    const d = (8 + 18 * k) * s;
                    g.fillStyle(0x2b2830, 1 - k).fillCircle(
                        mid.x + Math.cos(a) * d,
                        mid.y + Math.sin(a) * d + 20 * s * k * k,
                        1.8 * s,
                    );
                }
            }
            break;
        }
        case 'kadabra': {
            const P = SPOON;
            if (ms < P.rise) break;
            const up = reduce ? 1 : easeOut((ms - P.rise) / 320);
            const L = Math.max(14 * s, hh * 0.5);
            const x = head.x;
            const y = head.y - (4 + 14 * up) * s + (reduce ? 0 : Math.sin(ms / 160) * 1.5 * s);
            const bend = Math.PI * 0.42 * (reduce ? (ms > P.bend ? 1 : 0) : easeOut((ms - P.bend) / (P.bent - P.bend)));
            const a = fade * clamp01((ms - P.rise) / 120);
            // a aura psíquica: anéis que saem da colher
            if (!reduce)
                for (let n = 0; n < 3; n++) {
                    const u = ((ms - P.rise) / 700 + n / 3) % 1;
                    g.lineStyle(1.6 * s, 0xd38cff, (1 - u) * 0.8 * a).strokeEllipse(
                        x,
                        y - L * 0.25,
                        (10 + 26 * u) * s,
                        (5 + 13 * u) * s,
                    );
                }
            const midY = y;
            const tip = { x: x + Math.sin(bend) * (L / 2), y: midY - Math.cos(bend) * (L / 2) };
            for (const [w, col] of [
                [3.6, INK],
                [1.8, 0xe2e6f0],
            ] as const) {
                g.lineStyle(w * s, col, a)
                    .lineBetween(x, midY + L / 2, x, midY)
                    .lineBetween(x, midY, tip.x, tip.y);
                const bx = tip.x + Math.sin(bend) * 3 * s;
                const by = tip.y - Math.cos(bend) * 3 * s;
                g.fillStyle(col, a).fillCircle(bx, by, (w === 1.8 ? 3 : 4.2) * s);
            }
            // brilho quando termina de entortar
            if (!reduce && ms > P.bent && ms < P.bent + 240) {
                const k = bump((ms - P.bent) / 240) * 6 * s;
                g.lineStyle(1.6 * s, 0xffffff, a)
                    .lineBetween(tip.x - k, tip.y, tip.x + k, tip.y)
                    .lineBetween(tip.x, tip.y - k, tip.x, tip.y + k);
            }
            break;
        }
    }
}

function bounceOut(u: number) {
    const n = 7.5625;
    const d = 2.75;
    const x = clamp01(u);
    if (x < 1 / d) return n * x * x;
    const [o, c] = x < 2 / d ? [1.5, 0.75] : x < 2.5 / d ? [2.25, 0.9375] : [2.625, 0.984375];
    const y = x - o / d;
    return n * y * y + c;
}
