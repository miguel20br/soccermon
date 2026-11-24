// "O plano infalível" v4 (estilo C caprichado + Pokémon do jogo): o esconderijo, o quadro com o plano desenhado pela luz,
// Meowth, Ekans e Koffing, o balde, a queda do quadro. 640x360, 112 BPM. Eventos no tempo da faixa (medidos no WAV).
import { acabamento, banda, bloco, bloom, camera, cone, esmear, poeira, reflexo } from './fx.mjs';
import { Pix, clamp, ease, hex, mix, rnd, sprite } from './pix.mjs';
import { pmd, quadro } from './pmd.mjs';

export const RES = [640, 360];
const W = 640, H = 360, HZ = 262, FEET = 304;
const Y = hex('#ffcb05'), RED = hex('#e8423f'), WARM = hex('#ffe38a'), GREEN = hex('#58c26b'), BLUE = hex('#3a7bd5');
const REGRUPA = 55.7, PLANOB = 72.9, ALARME = 88.5, CHASE = 90, SAI = 107, TIPTOE = 42.9, TRIP = 46.45, PANIC = 47.2, FALL = 47.45, FLEE = 49.4, BACK = 53.6;
const lerp = (a, b, t) => a + (b - a) * t;
const nivel = (l) => (l > 0.85 ? RED : l > 0.55 ? Y : l > 0.25 ? GREEN : BLUE);
export const S = 1.27; // traços do plano em coords do quadro (380x170)
export const tracos = [
    [[20, 120, 20, 60]], [[20, 60, 90, 60]], [[90, 60, 90, 120]], [[20, 120, 90, 120]], [[40, 120, 40, 96], [40, 96, 70, 96], [70, 96, 70, 120]],
    [[115, 90, 165, 90]], [[165, 90, 154, 82]], [[165, 90, 154, 98]], [[190, 108, 240, 72]], [[240, 72, 290, 108]], [[290, 108, 332, 74]],
    [[318, 60, 350, 92]], [[350, 60, 318, 92]], [[250, 128, 262, 128]], [[270, 128, 282, 128]], [[290, 128, 302, 128]],
].flat();
const progresso = (tt) => (tt < 36 ? clamp((tt - 1) / 33) : tt < REGRUPA ? 1 : tt < REGRUPA + 1.3 ? 0 : ease(clamp((tt - REGRUPA - 1.3) / 14)));
const sparks = [];
function quadroSprite(prog, copa) {
    const B = sprite(380, 170);
    B.rect(0, 0, 380, 170, hex('#6b4a2a')); B.rect(7, 7, 366, 156, hex('#10241e'));
    for (let i = 0; i < 40; i++) B.px(10 + ((i * 97) % 360), 10 + ((i * 53) % 150), hex('#17322a'));
    const n = Math.floor(prog * tracos.length), parc = prog * tracos.length - n;
    const L = (t, f) => { const x0 = t[0] * S + 4, y0 = t[1] * S + 6, x1 = t[2] * S + 4, y1 = t[3] * S + 6; B.line(x0, y0, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, hex('#e6f4ff'), 2); };
    tracos.forEach((t, i) => { if (i < n) L(t, 1); else if (i === n) L(t, parc); });
    if (prog > 0.95 || copa) { B.circle(332, 148, 8, Y); B.rect(326, 154, 12, 4, Y); B.rect(322, 143, 3, 6, Y); B.rect(339, 143, 3, 6, Y); }
    B.rect(12, 154, 52, 4, hex('#dde7ee'));
    return B;
}
const cacheQ = new Map();
const qs = (prog, copa = false) => { const k = Math.round(prog * 160) + (copa ? 1000 : 0); if (!cacheQ.has(k)) cacheQ.set(k, quadroSprite(Math.round(prog * 160) / 160, copa)); return cacheQ.get(k); };
const baldeS = (() => { const B = sprite(30, 30); B.poly([[3, 4], [27, 4], [24, 29], [6, 29]], hex('#8a93b8')); B.rect(3, 4, 24, 4, hex('#b8c0e0')); B.rect(8, 10, 3, 17, hex('#6a7298')); return B; })();

/** Meowth 52, Ekans 23, Koffing 109 (cada qual: x, y, anim, dir, n, escala, rot, visível). */
function atores(tt, beatN, kick) {
    const hop = (u, h = 18) => Math.sin(clamp(u) * Math.PI) * h, home = [210, 330, 450];
    return [52, 23, 109, 100].map((id, i) => {
        if (id === 100) { // Voltorb: entra rolando atrás deles na perseguição
            const k = Math.floor((tt - CHASE) / 4.3), u = ((tt - CHASE) % 4.3) / 4.3, dirk = k % 2 ? -1 : 1;
            if (tt < CHASE || tt > SAI + 0.5) return { id, x: 0, y: FEET, anim: 'Walk', dir: 2, n: 0, sc: 2.6, rot: 0, vis: false, i };
            const fim = tt > 105.5 ? clamp((tt - 105.5) / 0.7) : 0, xx = dirk > 0 ? lerp(-260, 720, u) : lerp(900, -120, u);
            return { id, x: tt > 105.5 ? lerp(300, 380, ease(fim)) : xx, y: FEET, anim: fim >= 1 ? 'Hurt' : 'Walk', dir: dirk > 0 ? 2 : 6, n: Math.floor(tt * 14), sc: 2.6, rot: fim >= 1 ? 0 : tt * 9 * dirk, vis: true, i };
        }
        let x = home[i], y = FEET, anim = 'Idle', dir = 0, n = Math.floor(tt * (id === 109 ? 5 : 3)), sc = 2, rot = 0, vis = true;
        const flo = id === 109 ? 18 + Math.sin(tt * 3 + i) * 4 : 0; // Koffing flutua
        const prog = progresso(tt);
        if (tt < 3.6 + i * 0.4 && tt < 30) { const e = clamp((tt - i * 0.7) / 2.6); x = lerp(-70, home[i], ease(e)); anim = 'Walk'; dir = 2; n = Math.floor(tt * 7); if (e >= 1) { anim = 'Idle'; dir = 0; } y -= flo; }
        else if (tt < TIPTOE) {
            y -= flo;
            if (tt > 38.6) { const u = beatN % 1; anim = 'Hop'; dir = 0; n = Math.floor(u * 10); y -= hop(u, 22); }
            else if (i === 0) { dir = 4; const k = prog * tracos.length, f = k - Math.floor(k); if (f < 0.35) { anim = 'Hop'; n = Math.floor(f / 0.35 * 10); y -= hop(f / 0.35, 12); } x = 130 + 380 * (0.18 + 0.64 * ((prog * 3) % 1)) * 0.5 + 40; }
            else if (i === 1) { x = 330 + Math.sin(tt * 1.3) * 4; }
        } else if (tt < TRIP) { // na ponta do pé rumo ao balde, em fila
            const e = (tt - TIPTOE) / (TRIP - TIPTOE); anim = 'Walk'; dir = 2; n = Math.floor(tt * 4.5); x = lerp(home[i], [470, 440, 400][i] + 40 * 0 + 50 * (2 - i) * 0 , e) + e * 60 * (1 - i * 0.2); y -= flo * 0.5;
            x = lerp(home[i], 380 + (2 - i) * 70 * 0 + (i === 0 ? 150 : i === 1 ? 90 : 30), e);
        } else if (tt < PANIC) { // tropeço em cadeia, atordoados
            const e = clamp((tt - TRIP - i * 0.2) / 0.5); x = (i === 0 ? 530 : i === 1 ? 470 : 410) + e * (i === 0 ? 14 : 8); anim = id === 109 ? 'Hurt' : 'Trip'; dir = 2; n = Math.floor(e * 4.9); if (id === 109) { rot = ease(e) * 1.2; y = FEET - 8; } else y = FEET;
            if (tt > 46.8) { anim = 'Hurt'; n = Math.floor(tt * 4); if (id !== 109) y = FEET; }
        } else if (tt < FLEE) { // pânico: correm em círculos
            const w = tt * 8 + i * 2.1; x = 330 + Math.cos(w) * (130 + i * 40); y = FEET - 8 + Math.sin(w * 2) * 5 - flo * 0.5; anim = 'Walk'; dir = Math.sin(w) > 0 ? 6 : 2; n = Math.floor(tt * 12); sc = 2;
        } else if (tt < BACK) { // fuga: cada um mais longe
            const t0 = FLEE + [0, 1.5, 3.0][i], e = clamp((tt - t0) / 1.4), dirx = [-1, 1, -1][i];
            const from = [210, 450, 330][i]; x = from + dirx * ease(e) * 480; y = FEET - ease(e) * [16, 46, 80][i] - (e <= 0 ? flo * 0.3 : 0); sc = 2 * (1 - ease(e) * [0.15, 0.35, 0.5][i]);
            anim = 'Walk'; dir = dirx < 0 ? 6 : 2; n = Math.floor(tt * 12); if (e <= 0) { anim = 'Hurt'; dir = 0; n = Math.floor(tt * 5); } if (e >= 1) vis = false;
        } else if (tt < REGRUPA) { // voltam de fininho e ficam sem graça
            const t0 = BACK + i * 0.8, e = clamp((tt - t0) / 1.4), from = [-70, 710, 330][i], to = [190, 470, 330][i];
            x = lerp(from, to, ease(e)); y = i === 2 ? lerp(FEET + 70, FEET - flo, ease(e)) : FEET; anim = e < 1 ? 'Walk' : 'Idle'; dir = e < 1 ? (from < 0 ? 2 : 6) : 0; n = e < 1 ? Math.floor(tt * 7) : Math.floor(tt * 3); if (e <= 0) vis = false;
            if (e >= 1) { y -= (i === 2 ? 0 : 0); }
        } else if (tt < PLANOB) { // se recompõem: Meowth refaz o plano, os outros ajudam
            y -= flo; x = [200, 320, 440][i] + (i === 1 ? Math.sin(tt * 1.3) * 4 : 0);
            const prog = progresso(tt), k = prog * tracos.length, f = k - Math.floor(k);
            if (i === 0) { dir = 4; if (f < 0.35 && prog > 0 && prog < 1) { anim = 'Hop'; n = Math.floor(f / 0.35 * 10); y -= hop(f / 0.35, 12); } }
            else if (tt > 70) { anim = 'Hop'; n = Math.floor((beatN % 1) * 10); y -= hop(beatN % 1, 14); }
        } else if (tt < ALARME) { // PLANO B: em fila, na ponta do pé, rumo à vitrine
            const u = (tt - PLANOB) / (ALARME - PLANOB); x = lerp([520, 580, 640][i], [120, 170, 220][i], ease(u)); y -= flo * 0.6; anim = 'Walk'; dir = 6; n = Math.floor(tt * 4);
        } else if (tt < CHASE) { // alarme: congelam e olham pro susto
            x = [120, 170, 220][i]; y -= flo * 0.6; anim = 'Hurt'; dir = 0; n = Math.floor(tt * 6);
        } else if (tt < SAI) { // perseguição: correm de um lado ao outro, Voltorb atrás
            const k = Math.floor((tt - CHASE) / 4.3), u = ((tt - CHASE) % 4.3) / 4.3, dirk = k % 2 ? -1 : 1, atraso = 0.07 * (2 - i);
            const uu = clamp(u + atraso), xx = dirk > 0 ? lerp(-100, 760, uu) : lerp(740, -120, uu);
            x = xx; y = FEET - (id === 109 ? 18 : 0) - Math.abs(Math.sin(tt * 10 + i)) * 4; anim = 'Walk'; dir = dirk > 0 ? 2 : 6; n = Math.floor(tt * 14);
        } else if (i > 0) { // saem de fininho (cada vez mais longe e mais baixo)
            const e = clamp((tt - SAI - i * 0.5) / 2.2); x = lerp(i === 1 ? 300 : 360, -90, ease(e)); y = FEET - ease(e) * 40; sc = 2 * (1 - ease(e) * 0.4); anim = 'Walk'; dir = 6; n = Math.floor(tt * 6); if (e >= 1) vis = false;
        } else { // Meowth fica: a taça, o refletor e a piscadela
            x = 330; y = FEET; sc = 2.4; anim = tt > 110.6 ? 'Pose' : 'Idle'; dir = 0; n = Math.floor((tt - 110.6) * 5); if (tt < 108) { x = lerp(200, 330, ease((tt - SAI) / 1.5)); anim = 'Walk'; dir = 2; n = Math.floor(tt * 6); }
        }
        return { id, x, y, anim, dir, n, sc, rot, vis, i };
    });
}

function mundo(P, c) {
    const { tt, beatN, q } = c, cam = c.cam, ox = (d) => -cam * d, gv = banda(c.bandas, 0, 6), mt = banda(c.bandas, 10, 24), ag = banda(c.bandas, 28, 40);
    const panic = tt > PANIC && tt < FLEE, dim = tt >= FLEE && tt < BACK ? 0.4 : tt >= 46.7 && tt < 47.15 ? 0.1 : 1;
    P.grad(0, HZ, hex('#2a2152'), hex('#171238'));
    for (let y = 0; y < HZ; y += 12) { P.rect(0, y, W, 1, hex('#130e30'), 0.8); for (let x = ((y / 12) & 1 ? 0 : 20) + (ox(0.5) % 40); x < W + 40; x += 40) P.rect(x, y, 1, 12, hex('#130e30'), 0.8); }
    P.grad(HZ, H, hex('#3a2d5a'), hex('#1a1330'));
    for (let i = -10; i <= 10; i++) P.line(320 + i * 30 + ox(0.8), HZ, 320 + i * 150 + ox(0.8), H, hex('#2a2048'), 1, 0.8);
    // lâmpadas: fio de trás (pequenas, parallax .4) e de frente (grandes, 1.3): cada lâmpada é uma banda
    const luzes = [];
    for (const [d, n, y0, sag, r, sw] of [[0.4, 40, 14, 12, 3, 0.4], [1.3, 24, 34, 34, 5, 1]]) for (let k = 0; k < n; k++) {
        const u = k / (n - 1), pend = panic ? Math.sin(tt * 4 + k * 0.4) * 14 * sw : Math.sin(tt * 0.8 + k) * 1.5 * sw, x = -40 + u * (W + 80) + ox(d) + pend, y = y0 + sag * 4 * u * (1 - u) + (panic ? Math.sin(tt * 5 + k) * 3 : 0);
        const lv = (c.bandas[Math.floor(u * 39)] ?? 0) * dim; luzes.push([x, y, lv, r]);
        P.rect(x, y - 4, 1, 4, hex('#0a0a14'), 0.9);
    }
    for (const [x, y, lv, r] of luzes) { const col = lv > 0.06 ? nivel(lv) : hex('#3a3a55'); if (lv > 0.1) { P.circle(Math.round(x), Math.round(y + r + 12), Math.round(14 + lv * 26 * (r / 4)), col, 0.05 + 0.04 * lv); } P.circle(Math.round(x), Math.round(y + r), r, col); if (lv > 0.5) P.px(x - 1, y + r - 1, [255, 255, 255]); }
    // quadro (parallax .8): o plano desenhado pela luz; cai no pânico
    const prog = progresso(tt), qx = 130 + ox(0.8), qy0 = 52;
    const lift = ease(clamp((tt - REGRUPA) / 1.0)), cai = clamp((tt - FALL) / 0.75) * (1 - lift), rot = -ease(cai) * 1.42, qy = qy0 + ease(cai * cai) * 150;
    const brilho = 0.05 + 0.05 * gv;
    if (tt < FALL || lift >= 1) P.rect(qx - 8, qy0 - 6, 396, 186, WARM, brilho * dim);
    P.blit(qs(prog, tt > 0.5), qx, qy, { px: 0, py: 0, rot });
    if (tt < FALL || lift >= 1) { P.line(qx + 40, 28, qx + 40, qy0 + 2, hex('#0a0a14'), 1); P.line(qx + 340, 28, qx + 340, qy0 + 2, hex('#0a0a14'), 1); }
    // a faísca que desenha: ponta do traço atual
    if (tt < 36 || (tt > 36 && tt < 38)) { const k = prog * tracos.length, i = Math.min(tracos.length - 1, Math.floor(k)), f = k - i, t = tracos[i]; if (prog < 1) { const hx = qx + (t[0] + (t[2] - t[0]) * f) * S + 4, hy = qy0 + (t[1] + (t[3] - t[1]) * f) * S + 6; P.circle(Math.round(hx), Math.round(hy), 3, Y); for (let s = 0; s < 6; s++) P.px(hx + Math.sin(tt * 9 + s * 2) * 6, hy + Math.cos(tt * 7 + s) * 6, WARM, 0.8); } }
    // piso: reflexo das lâmpadas e do quadro
    reflexo(P, HZ, 110, 0.3);
    // balde
    const bx = 590 + ox(1.0), voa = tt > TRIP ? clamp((tt - TRIP) / 1.4) : 0;
    P.rect(bx - 14, FEET + 2, 30, 3, [0, 0, 0], 0.35);
    P.blit(baldeS, bx - voa * 60, FEET - 14 - Math.sin(voa * Math.PI) * 60 + voa * 6, { px: 15, py: 15, rot: voa * 9, sx: 1.4, sy: 1.4 });
    // vitrine da taça (à esquerda): vidro, taça e a sirene que gira no alarme
    { const vx = 70 + ox(0.95), al = tt >= ALARME && tt < SAI, aberta = tt >= ALARME;
      P.rect(vx - 30, FEET - 6, 60, 8, hex('#2a2048')); P.rect(vx - 24, FEET - 44, 48, 38, hex('#3a2d5a'));
      if (tt < 110.4) { P.circle(vx, FEET - 62, 9, Y); P.rect(vx - 5, FEET - 56, 10, 6, Y); P.rect(vx - 12, FEET - 66, 4, 8, Y); P.rect(vx + 8, FEET - 66, 4, 8, Y); }
      P.rect(vx - 26, FEET - 90 - (aberta ? 24 : 0), 52, 48, hex('#bfe9ff'), 0.12); P.rect(vx - 26, FEET - 90 - (aberta ? 24 : 0), 52, 2, hex('#bfe9ff'), 0.5);
      if (al) { const a = tt * 9; P.rect(vx - 5, FEET - 112, 10, 10, hex('#2a0a0a')); P.poly([[vx, FEET - 107], [vx + Math.cos(a) * 160, FEET - 107 + Math.sin(a) * 30 - 40], [vx + Math.cos(a + 0.35) * 160, FEET - 107 + Math.sin(a + 0.35) * 30 - 40]], RED, 0.28); P.circle(vx, FEET - 107, 5, Math.sin(tt * 18) > 0 ? RED : hex('#701010')); }
    }
    if (tt >= 110.2) { P.rect(0, 0, W, H, [4, 3, 12], 0.85); const cn = cone(P, 330, 0, 0, 330, 24, 150, WARM, 0.28); poeira(P, cn, tt, 50, [255, 240, 210], 12); if (tt > 110.8) { P.circle(330, FEET - 150, 8, Y); P.rect(325, FEET - 145, 10, 6, Y); if (Math.sin(tt * 8) > 0.2) { P.rect(318, FEET - 152, 24, 2, [255, 255, 255]); P.rect(329, FEET - 163, 2, 24, [255, 255, 255]); } } }
    // atores
    const as = atores(tt, beatN, c.kickPulse).filter((a) => a.vis).sort((a, b) => a.y - b.y);
    for (const a of as) {
        const ax = a.x + ox(1.0); P.rect(ax - 16 * a.sc / 2 * 1.2, a.y + 1, 32 * a.sc / 2 * 1.2, 3, [0, 0, 0], 0.4);
        pmd(P, a.id, a.anim, a.dir, a.n, ax, a.y, { sc: a.sc, rot: a.rot });
        if (tt > 46.8 && tt < PANIC) for (let s = 0; s < 3; s++) { const ang = tt * 6 + s * 2.1 + a.i; P.rect(ax + Math.cos(ang) * 22, a.y - 72 + Math.sin(ang) * 5, 3, 3, Y); }
        if (panic) { P.rect(ax + 18, a.y - 84, 3, 10, RED); P.rect(ax + 18, a.y - 70, 3, 3, RED); }
    }
    // pó de giz quando o quadro cai e luz baixa na fuga
    if (tt > FALL && tt < 49.4) { const r = rnd(9); for (let i = 0; i < 70; i++) P.circle(Math.round(150 + r() * 360), Math.round(250 + r() * 40 - (tt - FALL) * 14), 2 + Math.floor(r() * 4), hex('#dfe8ee'), 0.08); }
    if (tt >= FLEE && tt < BACK) { const cn = cone(P, 320 + ox(0.5), 0, 0.05, 340, 20, 130, hex('#9ab0ff'), 0.16); poeira(P, cn, tt, 70, [200, 220, 255], 31, 3); P.rect(0, 0, W, H, hex('#0a0820'), 0.35); }
    if (tt >= BACK) P.rect(0, 0, W, H, WARM, 0.05 * gv);
    if (panic) P.rect(0, 0, W, H, RED, 0.22 * c.kickPulse);
    if (tt >= ALARME && tt < SAI) P.rect(0, 0, W, H, RED, 0.1 + 0.12 * (Math.sin(tt * 9) > 0 ? 1 : 0));
    if (tt >= 46.45 && tt < 46.6) P.rect(0, 0, W, H, [255, 255, 255], 0.5 * (1 - (tt - 46.45) / 0.15));
    if (tt >= 46.7 && tt < 47.15) P.rect(0, 0, W, H, [0, 0, 0], 0.75);
    if (mt > 0.01 && tt < FLEE) { const cn = cone(P, 320 + ox(0.5), 0, 0, 300, 20, 220, WARM, 0.05 + 0.12 * mt); poeira(P, cn, tt, 50, [255, 240, 210], 5); }
    void ag; void q;
}

export function plano4(P, c) {
    const { tt, q } = c;
    let cam = 0, k = { z: 1 };
    const sh = tt > PANIC && tt < FLEE ? { dx: Math.round(Math.sin(q * 3.1) * 3 * (0.4 + c.kickPulse)), dy: Math.round(Math.cos(q * 2.7) * 2) } : tt >= ALARME && tt < CHASE ? { dx: Math.round(Math.sin(q * 3.7) * 3), dy: 0 } : { dx: Math.round(c.kickPulse * Math.sin(q * 4)), dy: 0 };
    if (tt < 6) { const u = tt / 6; cam = lerp(-30, 30, u); k = { z: lerp(1.5, 1.08, ease(u)), cx: lerp(440, 320, ease(u)), cy: lerp(120, 175, ease(u)), rot: 0 }; } // gancho: abre da taça no quadro
    else if (tt < TIPTOE) { const e = Math.floor((tt - 6) / 8), u = ((tt - 6) % 8) / 8, pre = [{ cam: lerp(-40, 40, u), z: 1.12, cx: 320, cy: 175, rot: 0 }, { cam: 0, z: lerp(1.1, 1.7, ease(u)), cx: lerp(320, 200, u), cy: lerp(180, 130, u), rot: 0.02 }, { cam: lerp(40, -30, u), z: 1.2, cx: 360, cy: 230, rot: -0.025 }, { cam: lerp(-20, 30, u), z: lerp(1.5, 1.1, ease(u)), cx: 320, cy: lerp(120, 180, u), rot: 0 }][e % 4]; cam = pre.cam; k = pre; }
    else if (tt < TRIP) { const u = (tt - TIPTOE) / (TRIP - TIPTOE); cam = lerp(-20, 60, u); k = { z: lerp(1.25, 1.5, u), cx: lerp(300, 470, u), cy: 255, rot: -0.04 + 0.01 * Math.sin(tt * 3) }; }
    else if (tt < PANIC) { k = { z: 2.2, cx: 520, cy: 270, rot: 0.06 }; cam = 60; }
    else if (tt < FLEE) { cam = 0; k = { z: 1.06, cx: 320, cy: 190, rot: 0.025 * Math.sin(tt * 7) }; }
    else if (tt < BACK) { const u = (tt - FLEE) / (BACK - FLEE); k = { z: lerp(1.55, 1.0, ease(u)), cx: 320, cy: lerp(250, 170, ease(u)), rot: 0 }; cam = lerp(0, 30, u); }
    else if (tt < PLANOB) { const u = clamp((tt - BACK) / (PLANOB - BACK)); cam = lerp(30, -30, u); k = { z: lerp(1.04, 1.25, ease(u)), cx: 320, cy: 180, rot: lerp(-0.015, 0.015, u) }; }
    else if (tt < ALARME) { const u = (tt - PLANOB) / (ALARME - PLANOB); cam = lerp(0, -40, u); k = { z: lerp(1.2, 1.55, ease(u)), cx: lerp(420, 190, ease(u)), cy: 240, rot: lerp(0.03, -0.04, u) }; }
    else if (tt < CHASE) { k = { z: 1.9, cx: 100, cy: 235, rot: 0.05 * Math.sin(tt * 11) }; cam = -40; }
    else if (tt < SAI) { const u = ((tt - CHASE) % 4.3) / 4.3; cam = 20 * Math.sin(tt * 1.5); k = { z: 1.1 + 0.1 * Math.sin(tt * 0.8), cx: 320 + 40 * Math.sin(u * 6.28), cy: 200, rot: 0.03 * Math.sin(u * 6.28) }; }
    else { const u = ease(clamp((tt - SAI) / 5)); cam = 0; k = { z: lerp(1.0, 1.7, u), cx: lerp(320, 330, u), cy: lerp(190, 215, u), rot: 0 }; }
    mundo(P, { ...c, cam });
    camera(P, { ...k, ...sh });
    const cortes = [[TIPTOE, 'whip'], [FLEE, 'bloco'], [BACK, 'flash'], [REGRUPA, 'bloco'], [PLANOB, 'whip'], [ALARME, 'flash'], [CHASE, 'whip'], [94.3, 'whip'], [98.6, 'whip'], [102.9, 'whip'], [SAI, 'bloco'], [9, 'bloco'], [36.5, 'bloco'], [6, 'bloco'], [14, 'whip'], [22, 'bloco'], [30, 'whip']];
    for (const [ct, tp] of cortes) { const d = Math.abs(tt - ct); if (d < 0.25) { const p = 1 - d / 0.25; if (tp === 'whip') esmear(P, Math.round(p * 30)); else if (tp === 'flash') P.rect(0, 0, W, H, [255, 255, 255], 0.7 * p); else bloco(P, p * 0.9, ct); } }
    bloom(P, 205, 0.6); acabamento(P, 0.55);
    if (tt > c.dur - 0.8) bloco(P, clamp((tt - (c.dur - 0.8)) / 0.7), 7);
}
void Pix; void mix; void quadro;
